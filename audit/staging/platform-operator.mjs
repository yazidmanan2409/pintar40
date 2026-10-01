// STAGING ONLY. The staging Platform Operator (D-088(a), Yazid, 2 Oct): a platform-admin identity whose sign-in
// mail the automation can read, so the real-school journeys on staging no longer wait on Yazid's own account.
//
//   O1  SETUP, on Yazid's authorisation (D-088(a)), not a person's act: a server-made session for staging's one
//       recorded platform admin (matched by the digest staging.yml already pins; the address is never printed).
//   O2  through PINTAR's own screen, as that admin: Aktivasi → «Orang baru di luar pendataan» records the
//       operator by name and the staging test mailbox's plus-address. Skipped when the operator already exists.
//   O3  through PINTAR's own screen: Konfigurasi → Peran & akses grants the operator «Admin platform», valid until
//       OPERATOR_UNTIL, so it ends by itself. Skipped when an active grant exists. The grant is the admin's,
//       audited as every grant is.
//   O4  the operator signs in like a person: /masuk, the real email in the staging test mailbox, the same browser.
//       Lands on Konfigurasi with both schools offered: a platform admin's view. ONE sign-in email.
//   O5  read back, read only: the operator holds exactly one active platform-admin grant, made by the recorded
//       admin, ending OPERATOR_UNTIL, with its audit row; the recorded admin's own grant is untouched.
//
// NEVER: production (staging's ref and database URL are checked first, and the origin must be staging's); any
// direct write (the database is read in read-only transactions; every write is a press of PINTAR's buttons);
// any change to the product, its sign-in or its settings.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { APP, SLOW, closeTour, signIn } from "../perf/lib.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const ADMIN_SHA256 = env("ADMIN_SHA256");
const OPERATOR_EMAIL = env("OPERATOR_EMAIL");
const OPERATOR_NAME = env("OPERATOR_NAME");
const OPERATOR_UNTIL = env("OPERATOR_UNTIL");
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
if (!/^goldenschool\+[a-z0-9-]+@pintarselalu\.com$/.test(OPERATOR_EMAIL)) throw new Error("the operator's address is not a staging test-mailbox address");
if (!/^\d{4}-\d{2}-\d{2}$/.test(OPERATOR_UNTIL)) throw new Error("OPERATOR_UNTIL is not a date");
mkdirSync(join(OUT, "shots"), { recursive: true });

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const sha = (s) => createHash("sha256").update(s).digest("hex");
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

const ACTIVE_SYS = `from public.role_assignments r join public.accounts a on a.person_id = r.person_id
  join auth.users u on u.id = a.auth_user_id
  where r.role = 'SYSTEM_ADMIN' and r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until`;
const admins = sql(`select u.email ${ACTIVE_SYS}`).split("\n").filter(Boolean);
for (const e of admins) console.log(`::add-mask::${e}`);
const ADMIN_EMAIL = admins.find((e) => [sha(e), sha(e.trim().toLowerCase())].includes(ADMIN_SHA256));
if (!ADMIN_EMAIL) throw new Error("staging's recorded platform admin is not an active platform admin");

const results = [];
let shotN = 0;
async function shot(page, name) {
  const f = join(OUT, "shots", `${String(++shotN).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: f, fullPage: true }).catch(() => {});
  return f;
}
async function step(id, title, fn) {
  const rec = { verdict: "PASS" };
  let detail;
  try { detail = await fn(rec); } catch (e) { rec.verdict = "FAIL"; detail = String(e.message ?? e).split("\n")[0].slice(0, 300); }
  results.push({ id, verdict: rec.verdict });
  log(`${rec.verdict.padEnd(5)} ${id}  ${title} :: ${detail}`);
}

const operatorRow = () => sql(`select p.id || '|' || coalesce((select count(*) ${ACTIVE_SYS} and r.person_id = p.id), 0)
  from public.persons p join public.accounts a on a.person_id = p.id join auth.users u on u.id = a.auth_user_id
  where lower(u.email) = lower(${lit(OPERATOR_EMAIL)}) limit 1`);

const browser = await chromium.launch();
const newPage = async () => (await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" })).newPage();
const A = await newPage();

await step("O1", "SETUP on Yazid's authorisation (D-088(a)): a server-made session for staging's recorded platform admin", async () => {
  const r = await signIn(A, ADMIN_EMAIL, "/konfigurasi");
  await closeTour(A);
  return `setup, not a person's sign-in; ${r}; active platform admins before: ${admins.length}`;
});

await step("O2", "the platform admin records the operator on Aktivasi → «Orang baru di luar pendataan»", async (rec) => {
  if (operatorRow()) { rec.verdict = "NOTE"; return "the operator already has an account; nothing to record"; }
  await A.goto(`${APP}/aktivasi`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(A);
  const bagian = A.locator("section.pin-akt-baru");
  await bagian.waitFor({ timeout: SLOW });
  await bagian.locator("input.pin-input").first().fill(OPERATOR_NAME);
  await bagian.locator('input[type="email"]').fill(OPERATOR_EMAIL);
  await bagian.getByRole("button", { name: "Buat dan aktifkan", exact: true }).click();
  let row = "";
  for (let i = 0; i < 30 && !row; i++) { row = operatorRow(); if (!row) await A.waitForTimeout(500); }
  const layar = norm(await bagian.innerText().catch(() => ""));
  await shot(A, "o2-orang-baru");
  if (!row) { rec.verdict = "FAIL"; return `no account for the operator after «Buat dan aktifkan»: "${layar.slice(0, 200)}"`; }
  return `recorded by the screen; it says: "${layar.replace(OPERATOR_EMAIL, "<operator>").slice(-200)}"`;
});

await step("O3", `the platform admin grants the operator «Admin platform» on Konfigurasi → Peran & akses, until ${OPERATOR_UNTIL}`, async (rec) => {
  const row = operatorRow();
  if (!row) { rec.verdict = "FAIL"; return "the operator has no account (O2)"; }
  if (Number(row.split("|")[1]) > 0) { rec.verdict = "NOTE"; return "the operator already holds an active platform-admin grant; nothing to grant"; }
  await A.goto(`${APP}/konfigurasi?muat=${Date.now()}#roles`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(A);
  const form = A.locator("form").filter({ has: A.locator('select[name="person"]') });
  const orang = await form.locator('select[name="person"] option').filter({ hasText: OPERATOR_NAME }).first().getAttribute("value");
  if (!orang) { rec.verdict = "FAIL"; return `«${OPERATOR_NAME}» is not offered in the person list`; }
  await form.locator('select[name="person"]').selectOption(orang);
  await form.locator('select[name="role"]').selectOption("SYSTEM_ADMIN");
  await form.locator('input[name="valid_until"]').fill(OPERATOR_UNTIL);
  await form.getByRole("button", { name: "Berikan peran" }).click();
  await A.waitForURL(/hasil=/, { timeout: SLOW }).catch(() => {});
  await A.waitForLoadState("networkidle");
  await shot(A, "o3-peran");
  const u = new URL(A.url());
  if (u.searchParams.get("hasil") !== "ok") { rec.verdict = "FAIL"; }
  return `after «Berikan peran»: hasil=${u.searchParams.get("hasil")} kode=${u.searchParams.get("kode")}`;
});
await A.context().close();

const O = await newPage();
await step("O4", "the operator signs in like a person: /masuk, the real email in the staging test mailbox, the same browser", async (rec) => {
  const t0 = Date.now() / 1000 - 60;
  await O.goto(`${APP}/masuk`, { timeout: SLOW, waitUntil: "networkidle" });
  await O.locator("#email").fill(OPERATOR_EMAIL);
  await O.getByRole("button", { name: "Kirim tautan masuk" }).click();
  await O.getByRole("heading", { name: "Periksa email Anda" }).waitFor({ timeout: SLOW });
  const link = execFileSync("python3", ["mailbox_link.py", OPERATOR_EMAIL, String(t0), "180"], { encoding: "utf8" }).trim();
  console.log(`::add-mask::${link}`);
  await O.goto(link, { timeout: SLOW, waitUntil: "networkidle" });
  await O.waitForURL((u) => !u.pathname.startsWith("/auth/"), { timeout: SLOW }).catch(() => {});
  await O.waitForLoadState("networkidle");
  await closeTour(O);
  const at = new URL(O.url()).pathname;
  await O.goto(`${APP}/konfigurasi#struktur`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(O);
  const sekolah = await O.locator("select[name='sekolah'] option, select#pin-sekolah option").allTextContents().catch(() => []);
  const halaman = norm(await O.locator("main").innerText().catch(() => ""));
  await shot(O, "o4-operator");
  const platform = /SD Zayd Pintar Selalu/.test(halaman + sekolah.join(" ")) && /SMA Zayd Pintar Selalu/.test(halaman + sekolah.join(" "));
  if (at !== "/konfigurasi" || !platform) rec.verdict = "FAIL";
  return `signed in by the email link, landed on ${at}; both schools offered (a platform admin's view): ${platform}`;
});

await step("O5", "read back: one active platform-admin grant for the operator, by the recorded admin, ending by itself, audited", async (rec) => {
  const r = sql(`select count(*) || '|' || coalesce(min(r.valid_until::date)::text, '-') || '|' ||
      coalesce(bool_and(lower(gu.email) = lower(${lit(ADMIN_EMAIL)})), false) || '|' ||
      coalesce(bool_and(exists (select 1 from public.audit_log l where l.target_table = 'role_assignments' and l.target_id = r.id::text)), false)
    from public.role_assignments r
    join public.accounts a on a.person_id = r.person_id join auth.users u on u.id = a.auth_user_id
    left join public.accounts ga on ga.person_id = r.granted_by left join auth.users gu on gu.id = ga.auth_user_id
    where r.role = 'SYSTEM_ADMIN' and r.revoked_at is null and now() < r.valid_until and lower(u.email) = lower(${lit(OPERATOR_EMAIL)})`);
  const [n, until, byAdmin, audited] = r.split("|");
  const after = sql(`select u.email ${ACTIVE_SYS}`).split("\n").filter(Boolean);
  const adminKept = after.some((e) => [sha(e), sha(e.trim().toLowerCase())].includes(ADMIN_SHA256));
  const ok = n === "1" && until === OPERATOR_UNTIL && byAdmin === "t" && audited === "t" && adminKept && after.length === 2;
  if (!ok) rec.verdict = "FAIL";
  return `operator's active platform-admin grants: ${n}, ending ${until}; granted by the recorded admin: ${byAdmin === "t"}; audit row: ${audited === "t"}; ` +
    `active platform admins now: ${after.length} (the recorded admin still one of them: ${adminKept})`;
});

await browser.close();
const red = results.filter((r) => r.verdict === "FAIL");
log(`TALLY ${JSON.stringify(results.reduce((t, r) => ({ ...t, [r.verdict]: (t[r.verdict] ?? 0) + 1 }), {}))}`);
if (red.length) { log(`RED: ${red.map((r) => r.id).join(", ")}`); process.exit(1); }
