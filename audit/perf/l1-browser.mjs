// STAGING ONLY. The synchronized Uji Penguasaan through the REAL app (efficiency audit, 2 Oct): one shard.
//
// perf/l1.mjs calls PINTAR's learner RPCs directly. The real student's journey goes through Next.js: page renders
// (each with the proxy's sign-in check and the page's own reads), server actions that one tab runs one at a time,
// the player's own 5 s assistance timer and its outbox. This drives that journey in Chromium, one browser context
// per learner, so what is measured is what a class at 50 would cause:
//   SETUP, before T0 (made ahead, never measured): each learner's session (Auth's admin link and verify, as
//   perf/l1.mjs; card accounts have no email to receive) and their Pemetaan Awal sat and finished through the same
//   learner RPCs, as a class does on an earlier day (the Uji Penguasaan opens only after it, penguasaan/page.tsx).
//   THE WAVE, from T0 (ramp up to RAMP_S): /belajar → the chapter → «Uji Penguasaan» by its links; «Mulai Uji
//   Penguasaan»; per question: read THINK_MIN_S..THINK_MAX_S seconds (the player polls as it does), choose,
//   «Simpan jawaban ini» until «Tersimpan»; a fifth change their answer and save again; a tenth lose the network
//   before saving and get it back 2 s later (the outbox sends on its own); «Kumpulkan», asked and confirmed, until
//   the result page.
// Timed, as the learner sees them: buka (the Uji Penguasaan page), mulai (press to first question), simpan (press
// to «Tersimpan»), kumpulkan (press to the result page). Every request to PINTAR (pages, RSC, server actions) is
// recorded with its status and duration. Read-back (read only): every answer the page called «Tersimpan» is stored
// exactly once; every handed-in sitting has its result. Writes calls-N.json and summary-N.json for perf/l1-merge.mjs
// (SAVE_CALL=simpan). NEVER production, never a school other than the synthetic one.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { APP, closeTour, session, sessionCookies } from "./lib.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SB = env("SUPABASE_URL");
const ANON = env("ANON_KEY");
const SHARD = Number(process.env.SHARD ?? 0);
const SHARDS = Number(process.env.SHARDS ?? 1);
const LIMIT = Number(process.env.PER_SHARD ?? 1000);
const T0 = Date.parse(env("T0"));
const RAMP_MS = Number(process.env.RAMP_S ?? 30) * 1000;
const THINK = [Number(process.env.THINK_MIN_S ?? 5) * 1000, Number(process.env.THINK_MAX_S ?? 15) * 1000];
const VERIFY_PER_WINDOW = Number(process.env.VERIFY_PER_WINDOW ?? 28);
const WAIT = 60000;
const OUT = process.env.OUT_DIR ?? "out";
const SCHOOL = "Sekolah Uji Kinerja (sintetis)";
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || SB.includes(PRODUCTION_REF) || !SB.includes(REF) || !APP.includes("staging")) throw new Error("not staging");
if (!Number.isFinite(T0)) throw new Error("T0 is not a time");
mkdirSync(OUT, { recursive: true });

const FS = "\x1f";
const sql = (q) => execFileSync("psql", [DB, "-qAt", "-F", FS, "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8", maxBuffer: 256 << 20 }).trim();
const rows = (q) => { const t = sql(q); return t ? t.split("\n").map((l) => l.split(FS)) : []; };
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(s ?? "")) throw new Error(`not a uuid: ${s}`); return `'${s}'`; };
const pause = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
const acak = (a, b) => a + Math.random() * (b - a);
const log = (o) => console.log(JSON.stringify({ shard: SHARD, ...o }));

// ── setup (read only): the learners with an open, unsat Uji Penguasaan, their chapter and their class's Pemetaan Awal
const SID = sql(`select id from public.institutions where name = $q$${SCHOOL}$q$ and is_synthetic`);
uuid(SID);
const semua = rows(`
  with kelas as (
    select n.id from public.org_nodes n join public.org_nodes t on t.id = n.parent_id
     where n.institution_id = ${uuid(SID)} and n.kind = 'CLASS' and n.is_active and n.name like 'Kelas Beban %'
       and t.name = 'Tingkat Beban L1'),
  uji as (
    select distinct on (aa.node_id, d.mode) aa.node_id, d.mode, aa.id as aa_id, aa.learning_assignment_id as la_id
      from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
     where aa.node_id in (select id from kelas) and d.mode in ('PRE_TEST', 'POST_TEST') and aa.status = 'OPEN'
       and (aa.closes_at is null or aa.closes_at > now() + interval '30 minutes')
     order by aa.node_id, d.mode, aa.created_at desc)
  select p.id, u.email, post.aa_id, post.la_id, pre.aa_id
    from public.memberships m join public.enrollments e on e.id = m.enrollment_id and e.status = 'ACTIVE'
    join public.persons p on p.id = e.person_id
    join public.accounts a on a.person_id = p.id join auth.users u on u.id = a.auth_user_id
    join uji post on post.node_id = m.node_id and post.mode = 'POST_TEST'
    join uji pre on pre.node_id = m.node_id and pre.mode = 'PRE_TEST' and pre.la_id = post.la_id
   where m.valid_to is null
     and not exists (select 1 from public.assessment_sessions s where s.person_id = p.id and s.assessment_assignment_id = post.aa_id)
   order by p.id`);
const mine = semua.filter((_, i) => i % SHARDS === SHARD).slice(0, LIMIT)
  .map(([person, email, post, tugas, pre]) => ({ person, email, post, tugas, pre }));
log({ phase: "setup", learners_available: semua.length, mine: mine.length });

// ── SETUP: sessions, paced under Auth's per-address verify limit (as perf/l1.mjs)
let windowStart = Date.now(), inWindow = 0, minted = 0, mintFail = 0;
for (const m of mine) {
  for (let attempt = 0; attempt < 6 && !m.sess; attempt++) {
    if (inWindow >= VERIFY_PER_WINDOW) { await pause(windowStart + 301000 - Date.now()); windowStart = Date.now(); inWindow = 0; }
    inWindow++;
    try { m.sess = await session(m.email); minted++; }
    catch (e) {
      if (/429/.test(String(e.message))) { await pause(windowStart + 301000 - Date.now()); windowStart = Date.now(); inWindow = 0; }
      else await pause(5000);
    }
  }
  if (!m.sess) mintFail++;
}

// ── SETUP: the Pemetaan Awal, sat and finished through the learner RPCs with the learner's own token
async function rpc(m, fn, args) {
  const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, { method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${m.sess.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args) });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${fn}: HTTP ${r.status} ${JSON.stringify(body).slice(0, 160)}`);
  return body;
}
let preDone = 0, preFail = 0;
for (const m of mine.filter((x) => x.sess)) {
  try {
    const selesai = sql(`select count(*) from public.assessment_sessions where person_id = ${uuid(m.person)}
      and assessment_assignment_id = ${uuid(m.pre)} and status = 'FINALIZED'`);
    if (selesai === "0") {
      const sid = await rpc(m, "start_learning_session", { p_assessment_assignment: m.pre });
      const paper = await rpc(m, "session_paper", { p_session: sid });
      const manifest = {};
      for (const q of paper) {
        const posisi = q.muatan?.opsi?.[0]?.posisi ?? 1;
        await rpc(m, "record_answer", { p_presented_item: q.presented_item_id, p_client_seq: 1, p_jawaban: { posisi },
          p_client_asserted_at: null, p_receipt_mode: "LIVE" });
        manifest[q.presented_item_id] = 1;
      }
      await rpc(m, "finish_my_session", { p_session: sid, p_manifest: manifest });
    }
    m.preOk = true; preDone++;
  } catch (e) { preFail++; log({ phase: "pre", error: String(e.message).slice(0, 200) }); }
}
log({ phase: "setup-done", minted, mintFail, pre_done: preDone, pre_failed: preFail, ready_in_s: Math.round((T0 - Date.now()) / 1000) });

// ── the wave
const calls = [];
const catat = (name, t, ms, status, who, err = null) => calls.push({ name, ms, status, at: t - T0, who, err, code: null });
const browser = await chromium.launch();
const sittings = [];
const asal = new URL(APP).origin;

async function sitting(m, i) {
  const who = `${SHARD}.${i}`;
  const s = { who, person: m.person, started: false, finished: false, saved: 0, items: new Set(), refused: [] };
  sittings.push(s);
  await pause(T0 - Date.now() + acak(0, RAMP_MS));
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" });
  await ctx.addCookies(sessionCookies(m.sess).map((c) => ({ ...c, expires: -1 })));
  const page = await ctx.newPage();
  // every request to PINTAR itself (not its static files): page, RSC or server action, with its status and time
  page.on("requestfinished", async (req) => {
    const u = new URL(req.url());
    if (u.origin !== asal || u.pathname.startsWith("/_next/static") || /\.(png|svg|ico|woff2?|css|js)$/.test(u.pathname)) return;
    const h = req.headers();
    const name = req.method() === "POST" && h["next-action"] ? "aksi" : h["rsc"] ? "rsc" : req.resourceType() === "document" ? "halaman" : "lain";
    const res = await req.response().catch(() => null);
    const tm = req.timing();
    catat(name, Date.now() - Math.max(0, tm.responseEnd), Math.round(tm.responseEnd), res?.status() ?? 0, who);
  });
  page.on("requestfailed", (req) => {
    const u = new URL(req.url());
    if (u.origin !== asal || u.pathname.startsWith("/_next/static")) return;
    if (s.offline) return; // the planned network loss, not the server's
    catat("gagal", Date.now(), 0, 0, who, String(req.failure()?.errorText ?? "failed").slice(0, 80));
  });
  const ukur = async (name, fn) => {
    const t = Date.now();
    try { await fn(); catat(name, t, Date.now() - t, 200, who); return true; }
    catch (e) { catat(name, t, Date.now() - t, 0, who, String(e.message).split("\n")[0].slice(0, 120)); s.refused.push(`${name}: ${String(e.message).split("\n")[0].slice(0, 100)}`); return false; }
  };
  try {
    // /belajar → the chapter → «Uji Penguasaan», by their links where the page offers them
    await page.goto(`${APP}/belajar`, { waitUntil: "domcontentloaded", timeout: WAIT });
    await closeTour(page);
    const keBab = page.locator(`a[href="/belajar/${m.tugas}"]`).first();
    if (await keBab.count()) await keBab.click(); else await page.goto(`${APP}/belajar/${m.tugas}`, { timeout: WAIT });
    await page.waitForURL((u) => u.pathname === `/belajar/${m.tugas}`, { timeout: WAIT });
    await closeTour(page);
    const ok = await ukur("buka", async () => {
      const keUji = page.locator(`a[href="/belajar/${m.tugas}/penguasaan"]`).first();
      if (await keUji.count()) await keUji.click(); else await page.goto(`${APP}/belajar/${m.tugas}/penguasaan`, { timeout: WAIT });
      await page.getByRole("button", { name: "Mulai Uji Penguasaan", exact: true }).waitFor({ timeout: WAIT });
    });
    if (!ok) return;
    await closeTour(page);
    if (!await ukur("mulai", async () => {
      await page.getByRole("button", { name: "Mulai Uji Penguasaan", exact: true }).click();
      await page.locator("h2.pin-stem").first().waitFor({ state: "visible", timeout: WAIT });
    })) return;
    s.started = true;
    const offlineDi = Math.random() < 0.1 ? Math.floor(acak(0, 6)) : -1;
    for (let q = 0; q < 40; q++) {
      const stem = await page.locator("h2.pin-stem").first().innerText();
      await pause(acak(...THINK));
      const opts = page.locator("ul.pin-opsi button.pin-op");
      const n = await opts.count();
      const pilih = Math.floor(acak(0, n));
      const simpan = page.getByRole("button", { name: /^(Kunci|Simpan) jawaban ini$/ });
      const tersimpan = page.getByRole("button", { name: "Tersimpan", exact: true });
      await opts.nth(pilih).click();
      if (q === offlineDi) {
        // the network drops before the save; it comes back 2 s later and the outbox sends the answer on its own
        s.offline = true;
        await page.context().setOffline(true);
        await simpan.click();
        await pause(2000);
        await page.context().setOffline(false);
        s.offline = false;
        if (await ukur("simpan_luring", () => tersimpan.waitFor({ timeout: WAIT }))) { s.saved++; s.items.add(stem); }
      } else if (await ukur("simpan", async () => { await simpan.click(); await tersimpan.waitFor({ timeout: WAIT }); })) { s.saved++; s.items.add(stem); }
      if (Math.random() < 0.2 && n > 1) {
        await pause(acak(2000, 5000));
        await opts.nth((pilih + 1) % n).click();
        if (await ukur("simpan", async () => { await simpan.click(); await tersimpan.waitFor({ timeout: WAIT }); })) s.saved++;
      }
      const next = page.getByRole("button", { name: "Berikutnya", exact: true });
      if (await next.count()) {
        await next.click();
        await page.waitForFunction((prev) => document.querySelector("h2.pin-stem")?.innerText !== prev, stem, { timeout: WAIT });
        continue;
      }
      await ukur("kumpulkan", async () => {
        await page.getByRole("button", { name: "Kumpulkan", exact: true }).click();
        const tanya = page.locator('[aria-labelledby="kumpulkan-tanya"]');
        await tanya.waitFor({ state: "visible", timeout: WAIT });
        await tanya.getByRole("button", { name: "Kumpulkan", exact: true }).click();
        await page.waitForURL((u) => u.pathname.endsWith("/hasil"), { timeout: WAIT });
        await page.locator("h1").first().waitFor({ state: "visible", timeout: WAIT });
      }) && (s.finished = true);
      break;
    }
  } catch (e) {
    s.refused.push(`journey: ${String(e.message).split("\n")[0].slice(0, 120)}`);
  } finally {
    await page.waitForTimeout(3000).catch(() => {}); // the result page's own reads settle
    await ctx.close().catch(() => {});
  }
}

const ready = mine.filter((m) => m.sess && m.preOk);
await Promise.all(ready.map((m, i) => sitting(m, i)));
const endAt = Date.now();
await browser.close();

// ── read-back (read only): every answer the page called «Tersimpan» is stored exactly once; every handed-in sitting
// has its result. The page names an answer saved only on the server's acknowledgement.
const persons = sittings.map((s) => s.person);
let disimpan = 0, ganda = 0, tanpaHasil = 0, sesi = 0, hilang = 0;
if (persons.length) {
  const post = new Map(mine.map((m) => [m.person, m.post]));
  const r = rows(`select s.person_id, s.id, s.status::text,
      (select count(distinct r.presented_item_id) from public.responses r where r.session_id = s.id),
      (select count(*) from (select 1 from public.responses r where r.session_id = s.id group by r.presented_item_id, r.client_seq having count(*) > 1) d),
      exists (select 1 from public.assessment_results x where x.session_id = s.id)
    from public.assessment_sessions s where s.person_id in (${persons.map(uuid).join(",")})
      and s.assessment_assignment_id in (${[...new Set(post.values())].map(uuid).join(",")})`);
  sesi = r.length;
  const disitu = new Map();
  for (const [person, , status, items, dup, hasil] of r) {
    disitu.set(person, Number(items));
    disimpan += Number(items);
    ganda += Number(dup);
    if (status === "FINALIZED" && hasil !== "t") tanpaHasil++;
  }
  // lost: a question the page called «Tersimpan» that the database does not hold, per learner
  for (const s of sittings) hilang += Math.max(0, s.items.size - (disitu.get(s.person) ?? 0));
}
const diakui = sittings.reduce((n, s) => n + s.saved, 0);
const summary = {
  shard: SHARD, learners: mine.length, minted, mintFail, pre_done: preDone, pre_failed: preFail,
  started: sittings.filter((s) => s.started).length, finished: sittings.filter((s) => s.finished).length,
  sessions: sesi, answers_acknowledged: diakui, items_stored: disimpan,
  answers_lost: hilang, answers_duplicated: ganda, finished_without_result: tanpaHasil,
  refusals: sittings.flatMap((s) => s.refused).slice(0, 20), wave_s: Math.round((endAt - T0) / 1000),
};
writeFileSync(join(OUT, `calls-${SHARD}.json`), JSON.stringify(calls));
writeFileSync(join(OUT, `summary-${SHARD}.json`), JSON.stringify(summary));
log({ phase: "done", ...summary });
