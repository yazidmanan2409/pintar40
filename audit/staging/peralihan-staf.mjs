// STAGING ONLY. J2.7 (W9.14, CR-24): EXISTING STAFF MAKE THE TRANSITION TO 4.0'S SIGN-IN, WITH NO DUPLICATE. Authorised by
// the owner on 6 Nov 2026 as a synthetic staging rehearsal.
//
// The population is the school GS_SLUG's staff on the staging test mailbox who held an account before the identity
// foundation (20261021100000), which marked every email account REQUIRED, and who signed in then by the email link.
// Each is a person the transition meets in production: an account, a person and roles that already exist, and a
// sign-in that no longer does.
//
//   T0  read only: the school exists, is real (never synthetic), and has such staff; for each, the auth user, the
//       account, the person, the PINTAR ID and the active roles, and how many of each the address has.
//   T1  /masuk offers no email link (TAUTAN_MASUK_CADANGAN off, C14): «Lupa password?» is a link to the recovery
//       page, not a button that sends a link; «Aktifkan akun» is offered.
//   T2  each of them, in a browser of their own, makes the transition as a person does: «Aktifkan akun», the code
//       PINTAR emails to the test mailbox, the wizard (username, PIN, password, name), «Komputer siapa ini?».
//   T3  read only, after: the same auth user, account, person and PINTAR ID; set-up COMPLETE with a username; the same
//       roles; the address still has exactly one auth user, one account and one person.
//   T4  each of them signs in again in a fresh browser with the password the wizard set, and lands past /masuk.
//   T5  read only: no person, account or auth user was made by the run (the whole database's counts are unchanged).
//
// Someone already through (COMPLETE) is a NOTE at T2 and still checked at T3 and T4: a re-run never repeats it.
// NEVER: production (staging's ref, database URL and origin are checked first); a direct write (the database is read
// in read-only transactions; every write is a press of PINTAR's buttons); an address or a credential in the log.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { APP, SLOW } from "../perf/lib.mjs";
import { denganPassword, kredensial, keadaanDari, masukStaf, selesaikan, bukti } from "./masuk.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SLUG = env("GS_SLUG");
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(SLUG)) throw new Error("GS_SLUG is not a school slug");
// the identity foundation's day: an account made before it is an existing account
const FONDASI = "2026-10-21";
mkdirSync(join(OUT, "shots"), { recursive: true });

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const keadaan = keadaanDari(sql, lit);

const results = [];
async function step(id, title, fn) {
  const rec = { verdict: "PASS" };
  let detail;
  try { detail = await fn(rec); } catch (e) { rec.verdict = "FAIL"; detail = String(e.message ?? e).split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 3).join(" | ").slice(0, 500); }
  results.push({ id, verdict: rec.verdict });
  log(`${rec.verdict.padEnd(5)} ${id}  ${title} :: ${detail}`);
  if (rec.verdict === "FAIL") console.log(`::error title=${id}::${String(detail).replace(/%/g, "%25").replace(/\r?\n/g, " ").slice(0, 900)}`);
  return rec.verdict;
}

// one address's identity: auth user | account | person | PINTAR ID | set-up | username | roles | how many of each
const identitas = (email) => {
  const r = sql(`with u as (select id from auth.users where lower(email) = lower(${lit(email)}))
    select coalesce(string_agg(distinct u.id::text, ','), '-') || '|' ||
      coalesce((select string_agg(distinct a.id::text, ',') from public.accounts a where a.auth_user_id in (select id from u)), '-') || '|' ||
      coalesce((select string_agg(distinct a.person_id::text, ',') from public.accounts a where a.auth_user_id in (select id from u)), '-') || '|' ||
      coalesce((select string_agg(distinct p.pintar_id, ',') from public.persons p join public.accounts a on a.person_id = p.id where a.auth_user_id in (select id from u)), '-') || '|' ||
      coalesce((select string_agg(distinct s.state::text, ',') from public.account_setup s join public.accounts a on a.id = s.account_id where a.auth_user_id in (select id from u)), '-') || '|' ||
      coalesce((select string_agg(distinct n.username, ',') from public.person_usernames n join public.accounts a on a.person_id = n.person_id where a.auth_user_id in (select id from u)), '-') || '|' ||
      coalesce((select string_agg(r.role::text || '@' || r.institution_id::text || '@' || coalesce(r.scope_node_id::text, '-'), ',' order by r.role, r.institution_id, r.scope_node_id)
        from public.role_assignments r join public.accounts a on a.person_id = r.person_id
        where a.auth_user_id in (select id from u) and r.revoked_at is null), '-') || '|' ||
      (select count(*) from u) || '|' ||
      (select count(*) from public.accounts a where a.auth_user_id in (select id from u)) || '|' ||
      (select count(distinct a.person_id) from public.accounts a where a.auth_user_id in (select id from u))
    from u`);
  const [auth, akun, orang, pintarId, setup, username, peran, nAuth, nAkun, nOrang] = r.split("|");
  return { auth, akun, orang, pintarId, setup, username, peran, nAuth, nAkun, nOrang };
};
const jumlahSemua = () => sql(`select (select count(*) from public.persons) || '/' || (select count(*) from public.accounts) || '/' || (select count(*) from auth.users)`);

let S = null;
let staf = [];
const sebelum = new Map();
let jumlahAwal = "";
await step("T0", `read only: «${SLUG}» is real and has staff on the test mailbox whose accounts predate the identity foundation (${FONDASI})`, async (rec) => {
  const r = sql(`select id || '|' || name || '|' || is_synthetic::text from public.institutions where slug = ${lit(SLUG)}`);
  if (!r) { rec.verdict = "FAIL"; return `no school «${SLUG}» on staging`; }
  const [id, nama, sintetis] = r.split("|");
  S = { id, nama };
  if (sintetis !== "false") { rec.verdict = "FAIL"; return `«${nama}» is synthetic; the rehearsal is on a real school's staff`; }
  // the addresses are read at run time and never printed: each is named by its role alone
  const baris = sql(`select distinct lower(u.email) || '|' || (select string_agg(distinct r2.role::text, '+' order by r2.role::text)
      from public.role_assignments r2 where r2.person_id = a.person_id and r2.revoked_at is null and r2.institution_id = '${id}')
    from public.role_assignments r join public.accounts a on a.person_id = r.person_id join auth.users u on u.id = a.auth_user_id
    where r.institution_id = '${id}' and r.revoked_at is null and a.kind = 'EMAIL'
      and lower(u.email) like 'goldenschool+%@pintarselalu.com' and u.created_at < '${FONDASI}'`).split("\n").filter(Boolean);
  staf = baris.map((b) => { const [email, peran] = b.split("|"); return { email, peran }; }).sort((x, y) => x.peran.localeCompare(y.peran));
  for (const s of staf) { console.log(`::add-mask::${s.email}`); sebelum.set(s.email, identitas(s.email)); }
  jumlahAwal = jumlahSemua();
  if (staf.length === 0) { rec.verdict = "FAIL"; return `«${nama}» has no staff on the test mailbox from before ${FONDASI}`; }
  const satu = staf.every((s) => { const i = sebelum.get(s.email); return i.nAuth === "1" && i.nAkun === "1" && i.nOrang === "1"; });
  if (!satu) rec.verdict = "FAIL";
  return `«${nama}»: ${staf.length} staff (${staf.map((s) => `${s.peran} ${sebelum.get(s.email).setup}`).join("; ")}); each one auth user, one account, one person: ${satu}; persons/accounts/auth users ${jumlahAwal}`;
});
if (!S || staf.length === 0) { log("RED: T0"); process.exit(1); }

const browser = await chromium.launch();
const newPage = async () => (await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" })).newPage();

await step("T1", "/masuk offers no email link (C14): «Lupa password?» is a link to the recovery page, not a button that sends one; «Aktifkan akun» is offered", async (rec) => {
  const p = await newPage();
  await p.goto(`${APP}/masuk`, { timeout: SLOW, waitUntil: "networkidle" });
  const lupaTautan = await p.locator('a.pin-tautan[href="/masuk/lupa"]').filter({ hasText: "Lupa password?" }).count();
  const lupaTombol = await p.locator("button.pin-tautan").filter({ hasText: "Lupa password?" }).count();
  const aktifkan = await p.locator('a.pin-tautan[href="/aktifkan"]').count();
  await p.context().close();
  if (lupaTautan !== 1 || lupaTombol !== 0 || aktifkan !== 1) rec.verdict = "FAIL";
  return `«Lupa password?» as the recovery link: ${lupaTautan}; as the email-link button: ${lupaTombol}; «Aktifkan akun»: ${aktifkan}`;
});

for (const s of staf) {
  await step(`T2 ${s.peran}`, `the ${s.peran} makes the transition as a person does: «Aktifkan akun», the emailed code, the wizard, «Komputer siapa ini?»`, async (rec) => {
    if (keadaan(s.email) !== "REQUIRED") { rec.verdict = "NOTE"; return `already through (${keadaan(s.email)}); nothing to repeat`; }
    const p = await newPage();
    try {
      const r = await masukStaf(p, s.email, keadaan);
      if (r.jalan !== "activated by the emailed code" || ["/masuk", "/aktifkan", "/perangkat"].includes(r.di)) rec.verdict = "FAIL";
      return `${r.jalan} (${r.lewat.join(" → ") || "no steps recorded"}); landed on ${r.di}`;
    } finally { await p.context().close(); }
  });
}

for (const s of staf) {
  await step(`T3 ${s.peran}`, `read only: the ${s.peran} is the same auth user, account, person, PINTAR ID and roles; set up with a username; still one of each`, async (rec) => {
    const a = sebelum.get(s.email), b = identitas(s.email);
    const sama = a.auth === b.auth && a.akun === b.akun && a.orang === b.orang && a.pintarId === b.pintarId && a.peran === b.peran;
    const satu = b.nAuth === "1" && b.nAkun === "1" && b.nOrang === "1";
    const siap = b.setup === "COMPLETE" && b.username !== "-" && !b.username.includes(",");
    if (!sama || !satu || !siap) rec.verdict = "FAIL";
    return `same auth user ${a.auth === b.auth}, account ${a.akun === b.akun}, person ${a.orang === b.orang}, PINTAR ID ${a.pintarId === b.pintarId}, roles ${a.peran === b.peran}; set-up ${a.setup} → ${b.setup}; one username ${siap}; one auth user/account/person ${satu}`;
  });
}

for (const s of staf) {
  await step(`T4 ${s.peran}`, `the ${s.peran} signs in again in a fresh browser with the password the wizard set`, async (rec) => {
    const p = await newPage();
    try {
      const k = kredensial(s.email);
      if (!(await denganPassword(p, s.email, k.password))) { rec.verdict = "FAIL"; throw await bukti(p, new Error("the password was refused"), "signing in again"); }
      const lewat = await selesaikan(p, k);
      const di = new URL(p.url()).pathname;
      if (["/masuk", "/aktifkan", "/perangkat"].includes(di)) rec.verdict = "FAIL";
      return `the password; ${lewat.length ? `${lewat.join(" → ")}; ` : ""}landed on ${di}`;
    } finally { await p.context().close(); }
  });
}

await browser.close();

await step("T5", "read only: the run made no person, account or auth user (the whole database's counts are unchanged)", async (rec) => {
  const akhir = jumlahSemua();
  if (akhir !== jumlahAwal) rec.verdict = "FAIL";
  return `persons/accounts/auth users ${jumlahAwal} → ${akhir}`;
});

const red = results.filter((r) => r.verdict === "FAIL");
log(`TALLY ${JSON.stringify(results.reduce((t, r) => ({ ...t, [r.verdict]: (t[r.verdict] ?? 0) + 1 }), {}))}`);
if (red.length) { log(`RED: ${red.map((r) => r.id).join(", ")}`); process.exit(1); }
