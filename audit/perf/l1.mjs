// STAGING ONLY. L1 (D-031, D-035): the synchronized Uji Penguasaan for the seeded learners (CAP-02), one shard.
//
// Each of SHARDS jobs takes every SHARDS-th learner of the L1 classes (perf/seed-l1.mjs) who has not yet sat the
// class's open Uji Penguasaan, and makes their sessions ahead of the wave (SETUP: Auth's admin link and verify, no
// email; staging allows about 30 verifications per 5 minutes per address, so they are paced). At T0 every shard
// starts together and each learner sits the test the way the player does it, calling PINTAR's own learner RPCs
// with the learner's own token (the database decides everything; nothing here can see a key the learner cannot):
//   - the page's sign-in check (Auth /user, as the proxy does on every request);
//   - start_learning_session once; session_paper; their presented items;
//   - per question: note_item_view, assistance_state every 5 s while reading (as the player polls), then
//     record_answer (LIVE); a fifth change their answer (the next seq); a tenth lose the network and replay the
//     same answer (REPLAYED, expected ACKNOWLEDGED);
//   - finish_my_session with the manifest; session_outcome.
// The answer chosen is right with probability P_RIGHT; the right one is known from the chapter's keys, read once in
// setup from the database (read only). Every call is timed. The shard's own read-back: every answer the server
// acknowledged is stored exactly once, and every finished sitting has its result.
// Writes JSON (calls, ledger, summary) to OUT_DIR for the merge (perf/l1-merge.mjs). NEVER production, never a
// school other than the synthetic one.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SB = env("SUPABASE_URL");
const ANON = env("ANON_KEY");
const SERVICE = env("SERVICE_KEY");
const SHARD = Number(process.env.SHARD ?? 0);
const SHARDS = Number(process.env.SHARDS ?? 1);
const LIMIT = Number(process.env.PER_SHARD ?? 1000);
const T0 = Date.parse(env("T0"));
const RAMP_MS = Number(process.env.RAMP_S ?? 30) * 1000;
const THINK = [Number(process.env.THINK_MIN_S ?? 5) * 1000, Number(process.env.THINK_MAX_S ?? 15) * 1000];
const P_RIGHT = Number(process.env.P_RIGHT ?? 0.7);
const VERIFY_PER_WINDOW = Number(process.env.VERIFY_PER_WINDOW ?? 28);
const OUT = process.env.OUT_DIR ?? "out";
const SCHOOL = "Sekolah Uji Kinerja (sintetis)";
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || SB.includes(PRODUCTION_REF) || !SB.includes(REF)) throw new Error("not staging");
if (!Number.isFinite(T0)) throw new Error("T0 is not a time");
mkdirSync(OUT, { recursive: true });

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8", maxBuffer: 256 << 20 }).trim();
const rows = (q) => { const t = sql(q); return t ? t.split("\n").map((l) => l.split("|")) : []; };
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(s ?? "")) throw new Error(`not a uuid: ${s}`); return `'${s}'`; };
const pause = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
const acak = (a, b) => a + Math.random() * (b - a);
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const log = (o) => console.log(JSON.stringify({ shard: SHARD, ...o }));

// ── setup (read only): the learners, their open Uji Penguasaan, the chapter's keys
const SID = sql(`select id from public.institutions where name = $q$${SCHOOL}$q$ and is_synthetic`);
uuid(SID);
const semua = rows(`
  with kelas as (
    select n.id from public.org_nodes n join public.org_nodes t on t.id = n.parent_id
     where n.institution_id = ${uuid(SID)} and n.kind = 'CLASS' and n.is_active and n.name like 'Kelas Beban %'
       and t.name = 'Tingkat Beban L1'),
  pa as (
    select distinct on (aa.node_id) aa.node_id, aa.id as aa_id, la.course_id
      from public.assessment_assignments aa join public.learning_assignments la on la.id = aa.learning_assignment_id
      join public.assessment_definitions d on d.id = aa.assessment_definition_id
     where aa.node_id in (select id from kelas) and d.mode = 'POST_TEST' and aa.status = 'OPEN'
       and (aa.closes_at is null or aa.closes_at > now() + interval '30 minutes')
     order by aa.node_id, aa.created_at desc)
  select p.id, u.email, pa.aa_id, pa.course_id
    from public.memberships m join public.enrollments e on e.id = m.enrollment_id and e.status = 'ACTIVE'
    join public.persons p on p.id = e.person_id
    join public.accounts a on a.person_id = p.id join auth.users u on u.id = a.auth_user_id
    join pa on pa.node_id = m.node_id
   where m.valid_to is null
     and not exists (select 1 from public.assessment_sessions s where s.person_id = p.id and s.assessment_assignment_id = pa.aa_id)
   order by p.id`);
const mine = semua.filter((_, i) => i % SHARDS === SHARD).slice(0, LIMIT)
  .map(([person, email, aa, course]) => ({ person, email, aa, course }));
const courses = [...new Set(mine.map((m) => m.course))];
const KUNCI = new Map(); // item_id -> { right: Set(body), wrong: Set(body) }
for (const c of courses) {
  for (const [item, body, ok] of rows(`select o.item_id, replace(replace(o.body, E'\\n', ' '), '|', '/'), o.is_correct
      from public.item_options o join public.items i on i.id = o.item_id join public.lessons l on l.id = i.lesson_id
      join public.modules md on md.id = l.module_id where md.course_id = ${uuid(c)}`)) {
    const k = KUNCI.get(item) ?? { right: new Set(), wrong: new Set() };
    (ok === "t" ? k.right : k.wrong).add(norm(body));
    KUNCI.set(item, k);
  }
}
log({ phase: "setup", learners_available: semua.length, mine: mine.length, courses: courses.length, keyed_items: KUNCI.size });

// ── timed HTTP
const calls = [];
async function http(name, url, init, who) {
  const t = Date.now();
  let status = 0, body = null, err = null;
  try {
    const r = await fetch(url, init);
    status = r.status;
    const txt = await r.text();
    try { body = txt ? JSON.parse(txt) : null; } catch { body = txt; }
  } catch (e) { err = String(e.message ?? e).slice(0, 120); }
  const ms = Date.now() - t;
  const code = body && typeof body === "object" && !Array.isArray(body) ? (body.code ?? null) : null;
  calls.push({ name, ms, status, code, at: t - T0, who, err });
  return { status, body, ms, err };
}
const rpc = (who, token, fn, args) => http(fn, `${SB}/rest/v1/rpc/${fn}`, {
  method: "POST", headers: { apikey: ANON, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(args),
}, who);
const authUser = (who, token) => http("auth/user", `${SB}/auth/v1/user`, { headers: { apikey: ANON, Authorization: `Bearer ${token}` } }, who);

// ── sessions, made ahead of the wave and paced under Auth's per-address verify limit
let windowStart = Date.now(), inWindow = 0, minted = 0, mintFail = 0;
for (const m of mine) {
  for (let attempt = 0; attempt < 6 && !m.token; attempt++) {
    if (inWindow >= VERIFY_PER_WINDOW) { await pause(windowStart + 301000 - Date.now()); windowStart = Date.now(); inWindow = 0; }
    const g = await fetch(`${SB}/auth/v1/admin/generate_link`, { method: "POST",
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "magiclink", email: m.email }) }).then((r) => r.json()).catch(() => ({}));
    const th = g.hashed_token || g.properties?.hashed_token;
    if (!th) { await pause(5000); continue; }
    inWindow++;
    const v = await fetch(`${SB}/auth/v1/verify`, { method: "POST", headers: { apikey: ANON, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "magiclink", token_hash: th }) });
    const sj = await v.json().catch(() => ({}));
    if (v.status === 429) { log({ phase: "mint", throttled: true, after: minted }); await pause(windowStart + 301000 - Date.now()); windowStart = Date.now(); inWindow = 0; continue; }
    if (sj.access_token) { m.token = sj.access_token; minted++; }
  }
  if (!m.token) mintFail++;
}
log({ phase: "mint", minted, failed: mintFail, ready_in_s: Math.round((T0 - Date.now()) / 1000) });

// ── one sitting
const ledger = []; // acknowledged answers: { sid, pid, seq }
const sittings = [];
async function sitting(m, i) {
  const who = `${SHARD}.${i}`;
  const s = { who, started: false, finished: false, result: null, answered: 0, refused: [] };
  sittings.push(s);
  await pause(T0 - Date.now() + acak(0, RAMP_MS));
  await authUser(who, m.token);
  const st = await rpc(who, m.token, "start_learning_session", { p_assessment_assignment: m.aa });
  if (st.status !== 200 || typeof st.body !== "string") { s.refused.push(`start ${st.status} ${JSON.stringify(st.body).slice(0, 80)}`); return; }
  const sid = st.body;
  s.started = true;
  const paper = await rpc(who, m.token, "session_paper", { p_session: sid });
  const pres = await http("presented_items", `${SB}/rest/v1/presented_items?session_id=eq.${sid}&select=id,item_id`,
    { headers: { apikey: ANON, Authorization: `Bearer ${m.token}` } }, who);
  const itemOf = new Map((Array.isArray(pres.body) ? pres.body : []).map((p) => [p.id, p.item_id]));
  const soal = Array.isArray(paper.body) ? paper.body : [];
  const manifest = {};
  for (const q of soal) {
    const pid = q.presented_item_id;
    await rpc(who, m.token, "note_item_view", { p_presented_item: pid });
    // reading: the player asks for assistance on showing the item and every 5 s
    const baca = acak(...THINK);
    for (let t = 0; t < baca; t += 5000) { await rpc(who, m.token, "assistance_state", { p_presented_item: pid }); await pause(Math.min(5000, baca - t)); }
    const k = KUNCI.get(itemOf.get(pid));
    const opsi = q.muatan?.opsi ?? [];
    const benar = opsi.filter((o) => k?.right.has(norm(o.teks))).map((o) => o.posisi);
    const salah = opsi.filter((o) => !k?.right.has(norm(o.teks))).map((o) => o.posisi);
    const pilih = (Math.random() < P_RIGHT && benar.length) || !salah.length ? benar[0] : salah[Math.floor(Math.random() * salah.length)];
    let seq = 1;
    const kirim = async (posisi, mode) => {
      await authUser(who, m.token);
      const r = await rpc(who, m.token, "record_answer", { p_presented_item: pid, p_client_seq: seq, p_jawaban: { posisi },
        p_client_asserted_at: null, p_receipt_mode: mode });
      const outcome = Array.isArray(r.body) ? r.body[0]?.outcome : null;
      if (r.status === 200 && outcome) ledger.push({ sid, pid, seq, outcome, mode });
      else s.refused.push(`record_answer ${r.status} ${JSON.stringify(r.body).slice(0, 80)}`);
      return outcome;
    };
    await kirim(pilih, "LIVE");
    if (Math.random() < 0.2 && opsi.length > 1) {          // changes their mind
      await pause(acak(2000, 5000));
      seq = 2;
      await kirim(opsi.map((o) => o.posisi).find((p) => p !== pilih), "LIVE");
    }
    if (Math.random() < 0.1) {                              // the network drops and the same answer is replayed
      await pause(acak(1000, 3000));
      const last = ledger.findLast((l) => l.pid === pid);
      if (last) {
        const r = await rpc(who, m.token, "record_answer", { p_presented_item: pid, p_client_seq: last.seq,
          p_jawaban: { posisi: seq === 1 ? pilih : opsi.map((o) => o.posisi).find((p) => p !== pilih) },
          p_client_asserted_at: null, p_receipt_mode: "REPLAYED" });
        const outcome = Array.isArray(r.body) ? r.body[0]?.outcome : null;
        if (outcome !== "ACKNOWLEDGED") s.refused.push(`replay ${r.status} ${outcome ?? JSON.stringify(r.body).slice(0, 80)}`);
      }
    }
    manifest[pid] = seq;
    s.answered++;
  }
  await authUser(who, m.token);
  const f = await rpc(who, m.token, "finish_my_session", { p_session: sid, p_manifest: manifest });
  if (f.status === 200 && f.body) { s.finished = true; s.result = f.body; s.sid = sid; }
  else s.refused.push(`finish ${f.status} ${JSON.stringify(f.body).slice(0, 120)}`);
  s.sid = sid;
  await rpc(who, m.token, "session_outcome", { p_session: sid });
}

const ready = mine.filter((m) => m.token);
await Promise.all(ready.map((m, i) => sitting(m, i)));
const endAt = Date.now();

// ── read-back (read only): every acknowledged answer stored exactly once; every finished sitting has its result
const sids = [...new Set(sittings.filter((s) => s.sid).map((s) => s.sid))];
let hilang = 0, ganda = 0, tanpaHasil = 0;
if (sids.length) {
  const kunci = new Set(ledger.map((l) => `${l.pid}:${l.seq}`));
  const ada = new Map();
  for (const [pid, seq, n] of rows(`select presented_item_id, client_seq, count(*) from public.responses
      where session_id in (${sids.map(uuid).join(",")}) group by 1, 2`)) ada.set(`${pid}:${seq}`, Number(n));
  for (const k of kunci) { const n = ada.get(k) ?? 0; if (n === 0) hilang++; if (n > 1) ganda++; }
  const hasil = new Set(rows(`select distinct session_id from public.assessment_results where session_id in (${sids.map(uuid).join(",")})`).map((r) => r[0]));
  tanpaHasil = sittings.filter((s) => s.finished && !hasil.has(s.sid)).length;
}
const summary = {
  shard: SHARD, learners: mine.length, minted, mintFail, started: sittings.filter((s) => s.started).length,
  finished: sittings.filter((s) => s.finished).length, answers_acknowledged: ledger.length,
  answers_lost: hilang, answers_duplicated: ganda, finished_without_result: tanpaHasil,
  refusals: sittings.flatMap((s) => s.refused).slice(0, 20), wave_s: Math.round((endAt - T0) / 1000),
};
writeFileSync(join(OUT, `calls-${SHARD}.json`), JSON.stringify(calls));
writeFileSync(join(OUT, `summary-${SHARD}.json`), JSON.stringify(summary));
log({ phase: "done", ...summary });
