// One human on staging (Yazid, 1 Oct). In the synthetic school, through PINTAR's own operations and
// performed by that school's existing synthetic admin (the same server-made session the staging journey
// uses), this prepares:
//   - a teacher Yazid can sign in to with the ordinary email link, at the address he chose, holding Guru at
//     the school's class;
//   - two students recorded in that class, each with a class card whose number and PIN are printed once,
//     for Yazid to sign in as a student.
// Nothing in the product, its sign-in or its settings changes. Staging only. Re-running is safe: an
// existing teacher account is reused, and each run adds two students with fresh cards.

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { APP, SLOW, session, sessionCookies } from "../perf/lib.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SB = env("SUPABASE_URL");
const ANON = env("ANON_KEY");
const ADMIN_EMAIL = env("ADMIN_EMAIL");
const TEACHER_EMAIL = env("TEACHER_EMAIL").toLowerCase();
const TEACHER_NAME = env("TEACHER_NAME");
const SCHOOL = "Sekolah Uji Kinerja (sintetis)";
const KELAS = "Kelas Uji Kinerja A";
const TAG = process.env.RUN_TAG ?? String(Date.now()).slice(-5);
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging") || SB.includes(PRODUCTION_REF)) throw new Error("not staging");

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(s ?? "")) throw new Error(`not a uuid: ${s}`); return `'${s}'`; };
const out = [];
const say = (s) => { console.log(s); out.push(s); };

const [SID, synth] = sql(`select id || '|' || is_synthetic from public.institutions where name = ${lit(SCHOOL)}`).split("|");
if (synth !== "true") throw new Error("this runs only in the synthetic school");
const KID = sql(`select id from public.org_nodes where institution_id = ${uuid(SID)} and kind = 'CLASS' and name = ${lit(KELAS)} and is_active`);
uuid(KID);

// The admin acts through PINTAR's own operations, with its own token (RLS and the database's rules apply).
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
async function record(rows) {
  const job = await rpc("import_open", { p_institution: SID, p_rows: rows });
  const v = await rpc("import_validate", { p_job: job });
  if (v?.ok === false) throw new Error(`the intake check refused the rows: ${JSON.stringify(v).slice(0, 400)}`);
  await rpc("import_confirm", { p_job: job });
  for (let i = 0; i < 6; i++) {
    try {
      const a = await rpc("import_advance", { p_job: job, p_max_rows: 50 });
      if (a?.state === "COMPLETED") break;
    } catch (e) {
      if (/pilot/i.test(e.message)) await rpc("import_verify_pilot", { p_job: job });
      else if (!/COMPLETED|not provisioning/i.test(e.message)) throw e;
      else break;
    }
  }
  return job;
}
const awaiting = async (name) => (await rpc("persons_awaiting_account", {}) ?? []).find((p) => p.display_name === name);

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: "id-ID", timezoneId: "Asia/Jakarta" });
await ctx.addCookies(sessionCookies(adminSess));
const page = await ctx.newPage();
await page.goto(`${APP}/aktivasi`, { timeout: SLOW });
const activate = async (data) => {
  const r = await page.request.post(`${APP}/api/akun/aktivasi`, { data, headers: { Origin: APP } });
  const body = await r.json().catch(() => null);
  if (!body?.ok) throw new Error(`activation (${data.mode}) refused: HTTP ${r.status()} ${JSON.stringify(body)}`);
  return body;
};

// 1. The teacher: reused if the address already has an account.
let teacher = sql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where lower(u.email) = ${lit(TEACHER_EMAIL)}`);
if (teacher) {
  say(`teacher: the account for ${TEACHER_EMAIL} already exists; reused`);
} else {
  // main refuses a staff row in the intake ("a staff row is not recorded by the bulk intake yet"); its
  // supported route is a name-only row (recorded in the school, no place, no role), then the role (BOB-21).
  const job = await record([{ display_name: TEACHER_NAME }]);
  const p = await awaiting(TEACHER_NAME);
  if (!p) throw new Error(`the teacher was not recorded (intake ${job}); row states: ${sql(`select string_agg(ordinal||':'||state::text, ',') from public.import_rows where job_id = ${uuid(job)}`)}`);
  await activate({ mode: "EMAIL", person_id: p.person_id ?? p.id, email: TEACHER_EMAIL });
  teacher = p.person_id ?? p.id;
  say(`teacher: recorded as "${TEACHER_NAME}" and given an email sign-in at ${TEACHER_EMAIL}`);
}
uuid(teacher);
const hasGuru = () => sql(`select count(*) from public.role_assignments where person_id = ${uuid(teacher)} and role = 'EDUCATOR' and scope_node_id = ${uuid(KID)} and revoked_at is null and now() < valid_until`);
if (hasGuru() === "0") {
  await rpc("grant_role", { p_person: teacher, p_role: "EDUCATOR", p_scope_node: KID, p_valid_until: "2027-06-30T23:59:59+07:00" });
}
if (hasGuru() === "0") throw new Error("the teacher does not hold Guru at the class");
say(`teacher: holds Guru at ${KELAS}`);

// 2. Two students, each with a class card (the number and PIN are shown once, here).
const COUNT = Number(process.env.STUDENT_COUNT ?? 2);
const names = Array.from({ length: COUNT }, (_, i) => `Murid Coba ${TAG}-${i + 1}`);
if (names.length) await record(names.map((n) => ({ display_name: n, node_id: KID, role: "STUDENT" })));
const cards = [];
for (const n of names) {
  const p = await awaiting(n);
  if (!p) throw new Error(`student "${n}" was not recorded`);
  const r = await activate({ mode: "CLASSROOM_CARD", person_id: p.person_id ?? p.id });
  cards.push({ name: n, card: r.card, pin: r.pin });
}
for (const c of cards) say(`student: ${c.name}: card ${c.card}, PIN ${c.pin}`);

// 3. Check, as the teacher, that Mengajar shows the class (a server-made session; no email is sent).
// TEACHER_CHECK=0 skips it when a real email sign-in follows: a server-made link starts the address's
// one-email-per-minute window, so the real request seconds later is refused (staging, 1 Oct 06:43 UTC).
let ok = true;
if (process.env.TEACHER_CHECK !== "0") {
const tctx = await browser.newContext({ locale: "id-ID", timezoneId: "Asia/Jakarta" });
await tctx.addCookies(sessionCookies(await session(TEACHER_EMAIL)));
const t = await tctx.newPage();
await t.goto(`${APP}/mengajar`, { timeout: SLOW, waitUntil: "networkidle" });
const seen = ((await t.locator("body").innerText()) ?? "").replace(/\s+/g, " ");
ok = new URL(t.url()).pathname.startsWith("/mengajar") && seen.includes(KELAS);
say(`teacher check: lands on ${new URL(t.url()).pathname}; sees ${KELAS}: ${seen.includes(KELAS)}`);
}
await browser.close();

if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, ["### One human on staging", "", ...out.map((s) => `- ${s}`), ""].join("\n"));
}
if (!ok) { console.error("the teacher does not land on Mengajar with the class"); process.exit(1); }
