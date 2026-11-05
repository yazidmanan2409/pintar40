// STAGING ONLY. The L1 load's seed (D-031, D-035: L1 = 1,000 students; CAP-02, CAP-07).
//
// In the synthetic school only ("Sekolah Uji Kinerja (sintetis)", D-046(c)), as its synthetic admin (a server-made
// session: SETUP, never a person's act), through PINTAR's own operations with that admin's token, so the
// database's rules and audit apply to every write:
//   1. structure: a Tingkat «Tingkat Beban L1» under the school's «Bagian Uji Kinerja», and KELAS classes
//      «Kelas Beban NN» in it (create_tingkat, create_kelas);
//   2. the chapter: the newest PUBLISHED release in the school whose lesson has the school's pass mark (the
//      staging walk sets one for its own chapter, J05b); none is invented here;
//   3. it is given to every class (assign_release), its window ending WINDOW_DAYS from now;
//   4. the learners: TOTAL names recorded by the intake, spread over the classes (import_open → validate →
//      confirm → advance, the pilot verified as the screen does);
//   5. a class card for each learner without an account: the same /api/akun/aktivasi call that «Buat kartu
//      untuk kelas ini» makes, one per learner. The card numbers and PINs are never printed or kept: the load
//      makes its sessions without them (perf/l1.mjs).
// Idempotent: a class, an assignment, a recorded learner or a carded learner that exists is reused, never made
// twice. NEVER: production (staging's ref, database URL and origin are checked first), a direct write (the
// database is read in read-only transactions), a school other than the synthetic one.
import { request } from "playwright";
import { execFileSync } from "node:child_process";
import { appendFileSync } from "node:fs";
import { APP, session, sessionCookies } from "./lib.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SB = env("SUPABASE_URL");
const ANON = env("ANON_KEY");
const ADMIN_EMAIL = env("ADMIN_EMAIL");
const YEAR = process.env.YEAR ?? "2026/2027";
const TOTAL = Number(process.env.TOTAL ?? 1000);
const KELAS = Number(process.env.KELAS ?? 25);
const WINDOW_DAYS = Number(process.env.WINDOW_DAYS ?? 14);
const PARALLEL = Number(process.env.CARD_PARALLEL ?? 4);
const SCHOOL = "Sekolah Uji Kinerja (sintetis)";
const BAGIAN = "Bagian Uji Kinerja";
// LABEL names a separate Tingkat and its learners (default «L1», the L1 load's own). A test after the L1 classes'
// windows have closed needs classes of its own: assign_release gives a release to a class once (ASSIGN_EXISTS), and
// PINTAR has no operation that ends an assignment, so a fresh window is a fresh Tingkat, never a direct write.
const LABEL = process.env.LABEL || "L1";
if (!/^[A-Za-z0-9]{1,8}$/.test(LABEL)) throw new Error("LABEL: 1-8 letters or digits");
const TINGKAT = `Tingkat Beban ${LABEL}`;
const AWALAN = LABEL === "L1" ? "" : `${LABEL} `;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging") || SB.includes(PRODUCTION_REF)) throw new Error("not staging");
if (!(TOTAL > 0 && TOTAL <= 5000 && KELAS > 0 && KELAS <= 100)) throw new Error("TOTAL or KELAS out of range");

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8", maxBuffer: 64 << 20 }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(s ?? "")) throw new Error(`not a uuid: ${s}`); return `'${s}'`; };
const rows = (q) => { const t = sql(q); return t ? t.split("\n").map((l) => l.split("|")) : []; };
const out = [];
const say = (s) => { console.log(s); out.push(s); };
const pad = (n, w) => String(n).padStart(w, "0");

const [SID, synth] = sql(`select id || '|' || is_synthetic from public.institutions where name = ${lit(SCHOOL)}`).split("|");
if (synth !== "true") throw new Error("the L1 seed runs only in the synthetic school");

const adminSess = await session(ADMIN_EMAIL);
async function rpc(fn, args) {
  const r = await fetch(`${SB}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${adminSess.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new Error(`${fn}: HTTP ${r.status} ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}
const node = (kind, name, parent) => sql(`select id from public.org_nodes where institution_id = ${uuid(SID)} and kind = '${kind}'
  and name = ${lit(name)} and is_active${parent ? ` and parent_id = ${uuid(parent)}` : ""} order by created_at limit 1`);

// 1. structure
const bagian = node("DEPARTMENT", BAGIAN);
if (!bagian) throw new Error(`no «${BAGIAN}» in the synthetic school (staging-perf-seed.yml makes it)`);
// a Tingkat's parent is the Bagian's hidden «Reguler» (D-006), so it is found by its name in the school
const tingkat = node("COHORT", TINGKAT) || await rpc("create_tingkat", { p_bagian_node: bagian, p_name: TINGKAT, p_academic_year: YEAR });
const kelas = [];
for (let i = 1; i <= KELAS; i++) {
  const nama = `Kelas Beban ${AWALAN}${pad(i, 2)}`;   // class names are unique among siblings (STRUCTURE_NAME_TAKEN, run 42107287870)
  kelas.push({ nama, id: node("CLASS", nama, tingkat) || await rpc("create_kelas", { p_tingkat_node: tingkat, p_name: nama }) });
}
say(`structure: «${TINGKAT}» with ${kelas.length} Kelas («${kelas[0].nama}» … «${kelas.at(-1).nama}»)`);

// 2. the chapter: newest published release whose lesson has the school's pass mark
const [rel] = rows(`select r.id, c.id, c.title, pm.percent from public.plp_releases r join public.courses c on c.id = r.course_id
  join public.school_pass_marks pm on pm.institution_id = c.institution_id and pm.course_id = c.id
    and not exists (select 1 from public.school_pass_marks n where n.supersedes_id = pm.id)
  where c.institution_id = ${uuid(SID)} and r.status = 'PUBLISHED' order by r.created_at desc limit 1`);
if (!rel) throw new Error("no published chapter with the school's pass mark in the synthetic school (the staging walk publishes one and sets its mark)");
const [RELEASE, , JUDUL, PERSEN] = rel;
say(`chapter: «${JUDUL}» (release ${RELEASE.slice(0, 8)}), the school's pass mark ${PERSEN}%`);

// 3. given to every class
const sampai = new Date(Date.now() + WINDOW_DAYS * 86400000).toISOString();
let diberi = 0;
for (const k of kelas) {
  const ada = sql(`select id from public.learning_assignments where plp_release_id = ${uuid(RELEASE)} and node_id = ${uuid(k.id)} limit 1`);
  if (!ada) { await rpc("assign_release", { p_release: RELEASE, p_node: k.id, p_from: new Date().toISOString(), p_until: sampai }); diberi++; }
}
say(`given to the classes: ${diberi} new, ${kelas.length - diberi} already given`);

// 4. the learners
const perKelas = Math.ceil(TOTAL / KELAS);
const ingin = [];
for (let n = 0; n < TOTAL; n++) {
  const k = kelas[Math.floor(n / perKelas)];
  ingin.push({ display_name: `Murid Beban ${AWALAN}${k.nama.slice(-2)}-${pad((n % perKelas) + 1, 3)}`, node_id: k.id, role: "STUDENT" });
}
const sudah = new Set(rows(`select p.display_name from public.memberships m join public.enrollments e on e.id = m.enrollment_id
  join public.persons p on p.id = e.person_id where m.node_id in (${kelas.map((k) => uuid(k.id)).join(",")}) and m.valid_to is null`).map((r) => r[0]));
const baru = ingin.filter((r) => !sudah.has(r.display_name));
if (baru.length) {
  const job = await rpc("import_open", { p_institution: SID, p_rows: baru });
  const v = await rpc("import_validate", { p_job: job });
  if (v?.ok === false) throw new Error(`the intake check refused the rows: ${JSON.stringify(v).slice(0, 400)}`);
  await rpc("import_confirm", { p_job: job });
  for (let i = 0; i < 200; i++) {
    const st = sql(`select state from public.import_jobs where id = ${uuid(job)}`);
    if (st === "COMPLETED") break;
    if (st === "AWAITING_PILOT_VERIFICATION") { await rpc("import_verify_pilot", { p_job: job }); continue; }
    await rpc("import_advance", { p_job: job, p_max_rows: 200 });
  }
  say(`recorded by the intake: ${baru.length} learner(s) (job ${job.slice(0, 8)}: ${sql(`select state from public.import_jobs where id = ${uuid(job)}`)})`);
} else say(`recorded by the intake: none new (${sudah.size} already in the classes)`);

// 5. a class card for each learner without an account (numbers and PINs never printed or kept)
const tanpa = rows(`select distinct p.id from public.memberships m join public.enrollments e on e.id = m.enrollment_id
  join public.persons p on p.id = e.person_id where m.node_id in (${kelas.map((k) => uuid(k.id)).join(",")}) and m.valid_to is null
  and not exists (select 1 from public.accounts a where a.person_id = p.id)`).map((r) => r[0]);
const api = await request.newContext({ baseURL: APP, extraHTTPHeaders: { Origin: APP },
  storageState: { cookies: sessionCookies(adminSess).map((c) => ({ ...c, expires: -1 })), origins: [] } });
let dibuat = 0, ditolak = 0;
const galat = new Map();
let antre = tanpa.slice();
async function pekerja() {
  while (antre.length) {
    const person_id = antre.shift();
    const r = await api.post("/api/akun/aktivasi", { data: { mode: "CLASSROOM_CARD", person_id } }).catch((e) => ({ status: () => 0, json: async () => ({ e: String(e) }) }));
    const body = await r.json().catch(() => null);
    if (body?.ok && body.card) dibuat++;
    else { ditolak++; const k = `${r.status()} ${JSON.stringify(body ?? {}).slice(0, 80)}`; galat.set(k, (galat.get(k) ?? 0) + 1); }
  }
}
await Promise.all(Array.from({ length: PARALLEL }, pekerja));
await api.dispose();
say(`class cards: ${dibuat} made, ${ditolak} refused${galat.size ? ` (${[...galat].map(([k, n]) => `${n}× ${k}`).join("; ")})` : ""}; ` +
  `learners without an account before: ${tanpa.length}`);

// read back
const [jml, aktif, kartu] = rows(`select count(distinct p.id), count(distinct p.id) filter (where e.status = 'ACTIVE'),
  count(distinct a.person_id) from public.memberships m join public.enrollments e on e.id = m.enrollment_id
  join public.persons p on p.id = e.person_id left join public.accounts a on a.person_id = p.id
  where m.node_id in (${kelas.map((k) => uuid(k.id)).join(",")}) and m.valid_to is null`)[0];
const terbuka = sql(`select count(*) from public.assessment_assignments aa join public.learning_assignments la on la.id = aa.learning_assignment_id
  join public.assessment_definitions d on d.id = aa.assessment_definition_id
  where la.plp_release_id = ${uuid(RELEASE)} and la.node_id in (${kelas.map((k) => uuid(k.id)).join(",")})
    and d.mode = 'POST_TEST' and aa.status = 'OPEN'`);
say(`READ BACK: ${jml} learner(s) in the ${kelas.length} classes, ${aktif} with an ACTIVE enrolment, ${kartu} with an account; ` +
  `${terbuka} open Uji Penguasaan (one per class expected)`);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, ["### L1 seed (SETUP, synthetic school)", "", ...out.map((s) => `- ${s}`), ""].join("\n"));
if (Number(kartu) < TOTAL || Number(aktif) < TOTAL || Number(terbuka) !== kelas.length) process.exit(1);
