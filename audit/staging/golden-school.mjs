// STAGING ONLY. The Golden School's first steps (docs/recovery/GOLDEN-SCHOOL-CONTRACT.md §5), under Gate 3 and Gate 6:
//
//   G0  read only: the school GS_SLUG exists, real (never synthetic), founded by the C1 step from found-school.yml
//       (its school.founded audit row names that run), with its root place and its school year.
//   G1  The staging Platform Operator (D-088(a)) signs in as a person does (masuk.mjs, C2): the password set at their
//       activation, or «Lupa password?» by a code from the staging test mailbox when the walk does not know it.
//   G2  GS-02 (J1.4): the operator records the school's first administrator on Aktivasi → «Orang baru di luar
//       pendataan» (name, and the staging test mailbox's plus-address), confirms it («Sudah benar, buat dan
//       aktifkan», DAISY-20), and reads what the screen says.
//   G3  GS-02: the operator gives «Admin sekolah» at the school's root on Konfigurasi → Peran & akses, ending with
//       the school year.
//   G4  GS-03: the school admin activates as a person does: «Aktifkan akun», the code PINTAR emails to the staging
//       test mailbox, a username, a PIN, a password and their name, then «Komputer siapa ini?». Lands on Konfigurasi,
//       on their own school, whose «Persiapan sekolah» says nothing is set up yet. Already active: the password.
//   G5  read back, read only: one active «Admin sekolah» grant for the admin at the school's root, made by the
//       operator, audited; the school still has no other role.
//
// A step already done (the admin recorded, the grant made) is a NOTE, never repeated.
// NEVER: production (staging's ref, database URL and origin are checked first); a direct write (the database is
// read in read-only transactions; every write is a press of PINTAR's buttons); any change to the product, its
// sign-in or its settings.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { APP, SLOW, closeTour } from "../perf/lib.mjs";
import { keadaanDari, masukStaf } from "./masuk.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const OPERATOR_EMAIL = env("OPERATOR_EMAIL");
const SLUG = env("GS_SLUG");
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(SLUG)) throw new Error("GS_SLUG is not a school slug");
const ADMIN_EMAIL = `goldenschool+${SLUG}-admin@pintarselalu.com`;
const ADMIN_NAME = `Admin ${SLUG}`;
mkdirSync(join(OUT, "shots"), { recursive: true });

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

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
  return rec.verdict;
}

// the school, its year, and who holds a role there now
const sekolah = () => sql(`select i.id || '|' || i.name || '|' || i.is_synthetic::text || '|' ||
    coalesce((select p.name || '|' || p.ends_on::text from public.academic_periods p where p.institution_id = i.id order by p.starts_on desc limit 1), '-|-') || '|' ||
    coalesce((select l.summary ->> 'operator_ref' from public.audit_log l where l.action = 'school.founded' and l.target_id = i.id::text limit 1), '-')
  from public.institutions i where i.slug = ${lit(SLUG)}`);
const adminRow = () => sql(`select p.id from public.persons p join public.accounts a on a.person_id = p.id
  join auth.users u on u.id = a.auth_user_id where lower(u.email) = lower(${lit(ADMIN_EMAIL)}) limit 1`);
const hibah = (inst) => sql(`select count(*) from public.role_assignments r join public.accounts a on a.person_id = r.person_id
  join auth.users u on u.id = a.auth_user_id
  where r.institution_id = '${inst}' and r.role = 'INSTITUTION_ADMIN' and r.scope_node_id = '${inst}'
    and r.revoked_at is null and now() < r.valid_until and lower(u.email) = lower(${lit(ADMIN_EMAIL)})`);

const keadaan = keadaanDari(sql, lit);

const browser = await chromium.launch();
const newPage = async () => (await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" })).newPage();

let S = null;
await step("G0", `read only: the school «${SLUG}» was founded by the C1 step (found-school.yml), real, with its root place and school year`, async (rec) => {
  const r = sekolah();
  if (!r) { rec.verdict = "FAIL"; return `no school «${SLUG}» on staging: dispatch found-school.yml first`; }
  const [id, nama, sintetis, tahun, akhir, rujukan] = r.split("|");
  S = { id, nama, tahun, akhir };
  const akar = sql(`select count(*) from public.org_nodes where id = '${id}' and kind = 'INSTITUTION' and parent_id is null`);
  if (sintetis !== "false" || akar !== "1" || tahun === "-" || !/^found-school\.yml run \d+/.test(rujukan)) rec.verdict = "FAIL";
  return `«${nama}»: synthetic ${sintetis}; root place ${akar === "1"}; school year ${tahun} (ends ${akhir}); founded by "${rujukan}"`;
});
if (!S) { await browser.close(); log("RED: G0"); process.exit(1); }

const O = await newPage();
await step("G1", "the staging Platform Operator signs in as a person does (C2): the password, or «Lupa password?» by the emailed code", async (rec) => {
  const r = await masukStaf(O, OPERATOR_EMAIL, keadaan);
  if (r.di !== "/konfigurasi") rec.verdict = "FAIL";
  return `by ${r.jalan}${r.lewat.length ? ` (${r.lewat.join(" → ")})` : ""}; landed on ${r.di}`;
});

await step("G2", "GS-02 (J1.4): the operator records the school's first administrator on Aktivasi → «Orang baru di luar pendataan»", async (rec) => {
  if (adminRow()) { rec.verdict = "NOTE"; return "the administrator already has an account; nothing to record"; }
  await O.goto(`${APP}/aktivasi`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(O);
  const bagian = O.locator("section.pin-akt-baru");
  await bagian.waitFor({ timeout: SLOW });
  await bagian.getByLabel("Nama").fill(ADMIN_NAME);
  await bagian.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await bagian.getByRole("button", { name: "Buat dan aktifkan", exact: true }).click();
  // DAISY-20 (D-077): the first press shows what will be made; «Sudah benar, buat dan aktifkan» makes it
  await bagian.getByRole("button", { name: "Sudah benar, buat dan aktifkan", exact: true }).click();
  const jawab = bagian.locator('[role="status"]').first();
  await jawab.waitFor({ timeout: SLOW });
  const teks = norm(await jawab.innerText());
  await shot(O, "g2-orang-baru");
  const ok = /pin-hasil-ok/.test((await jawab.getAttribute("class")) ?? "") && !!adminRow();
  if (!ok) rec.verdict = "FAIL";
  return `the screen answered: "${teks.replace(ADMIN_EMAIL, "<admin>").slice(0, 260)}"; account recorded ${!!adminRow()}`;
});

await step("G3", "GS-02: the operator gives «Admin sekolah» at the school's root on Konfigurasi → Peran & akses, ending with the school year", async (rec) => {
  if (!adminRow()) { rec.verdict = "FAIL"; return "the administrator has no account (G2)"; }
  if (hibah(S.id) !== "0") { rec.verdict = "NOTE"; return "the administrator already holds «Admin sekolah» here; nothing to grant"; }
  await O.goto(`${APP}/konfigurasi?muat=${Date.now()}#roles`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(O);
  const form = O.locator("form").filter({ has: O.locator('select[name="person"]') });
  const orang = await form.locator('select[name="person"] option').filter({ hasText: ADMIN_NAME }).first().getAttribute("value");
  if (!orang) { rec.verdict = "FAIL"; return `«${ADMIN_NAME}» is not offered in the person list`; }
  await form.locator('select[name="person"]').selectOption(orang);
  await form.locator('select[name="role"]').selectOption("INSTITUTION_ADMIN");
  const tempat = await form.locator('select[name="scope"] option').allTextContents();
  const akar = await form.locator('select[name="scope"] option').filter({ hasText: S.nama }).first().getAttribute("value");
  if (!akar) { rec.verdict = "FAIL"; return `no place named «${S.nama}» offered; offered: ${tempat.slice(0, 8).join(" / ")}`; }
  await form.locator('select[name="scope"]').selectOption(akar);
  await form.locator('input[name="valid_until"]').fill(S.akhir);
  await form.getByRole("button", { name: "Berikan peran" }).click();
  await O.waitForURL(/hasil=/, { timeout: SLOW }).catch(() => {});
  await O.waitForLoadState("networkidle");
  await shot(O, "g3-peran");
  const u = new URL(O.url());
  if (u.searchParams.get("hasil") !== "ok" || hibah(S.id) !== "1") rec.verdict = "FAIL";
  return `after «Berikan peran»: hasil=${u.searchParams.get("hasil")} kode=${u.searchParams.get("kode")}; active grants at the root now ${hibah(S.id)}`;
});
await O.context().close();

const A = await newPage();
// D-054(b)'s order (and the server's, src/lib/aktivasi-kontrak.ts URUTAN_LANGKAH): the screens are read as they come and
// the order is asserted, not assumed (6 Oct: this title said «PIN → password», which no run had observed)
const URUTAN_D054 = ["username", "password", "pin", "nama"];
await step("G4", "GS-03: the school admin activates as a person does (the code from the staging test mailbox → username → password → PIN → name, D-054(b), as observed → «Komputer siapa ini?») and lands on Konfigurasi, on their own school, nothing set up yet", async (rec) => {
  if (hibah(S.id) !== "1") { rec.verdict = "FAIL"; return "the administrator holds no «Admin sekolah» here (G3)"; }
  const r = await masukStaf(A, ADMIN_EMAIL, keadaan);
  if (new URL(A.url()).pathname !== "/konfigurasi") {
    await A.goto(`${APP}/konfigurasi`, { timeout: SLOW, waitUntil: "networkidle" });
    await closeTour(A);
  }
  const di = r.di;
  const halaman = norm(await A.locator("main").innerText().catch(() => ""));
  const persiapan = norm(await A.locator("#persiapan").innerText().catch(() => ""));
  await shot(A, "g4-admin-sekolah");
  const wizard = r.lewat.filter((x) => URUTAN_D054.includes(x));
  const urutan = JSON.stringify(wizard) === JSON.stringify(URUTAN_D054);
  const ok = di === "/konfigurasi" && halaman.includes(S.nama) && /Belum/.test(persiapan) && urutan;
  if (!ok) rec.verdict = "FAIL";
  return `${r.jalan} (${r.lewat.join(" → ") || "no steps recorded"}; D-054(b)'s order ${urutan}), landed on ${di}; their school named ${halaman.includes(S.nama)}; «Persiapan sekolah»: "${persiapan.slice(0, 220)}"`;
});

await step("G5", "read back: one active «Admin sekolah» at the school's root, made by the operator, audited; no other role in the school", async (rec) => {
  const r = sql(`select count(*) || '|' ||
      coalesce(bool_and(lower(gu.email) = lower(${lit(OPERATOR_EMAIL)})), false) || '|' ||
      coalesce(bool_and(exists (select 1 from public.audit_log l where l.target_table = 'role_assignments' and l.target_id = r.id::text)), false) || '|' ||
      (select count(*) from public.role_assignments x where x.institution_id = '${S.id}' and x.revoked_at is null and now() < x.valid_until)
    from public.role_assignments r
    join public.accounts a on a.person_id = r.person_id join auth.users u on u.id = a.auth_user_id
    left join public.accounts ga on ga.person_id = r.granted_by left join auth.users gu on gu.id = ga.auth_user_id
    where r.institution_id = '${S.id}' and r.role = 'INSTITUTION_ADMIN' and r.scope_node_id = '${S.id}'
      and r.revoked_at is null and now() < r.valid_until and lower(u.email) = lower(${lit(ADMIN_EMAIL)})`);
  const [n, byOperatorRaw, auditedRaw, semua] = r.split("|");
  const benar = (x) => ["t", "true"].includes(x);
  const ok = n === "1" && benar(byOperatorRaw) && benar(auditedRaw) && semua === "1";
  if (!ok) rec.verdict = "FAIL";
  return `active «Admin sekolah» at the root: ${n}; made by the operator: ${benar(byOperatorRaw)}; audited: ${benar(auditedRaw)}; active roles in the school: ${semua}`;
});

await browser.close();
const red = results.filter((r) => r.verdict === "FAIL");
log(`TALLY ${JSON.stringify(results.reduce((t, r) => ({ ...t, [r.verdict]: (t[r.verdict] ?? 0) + 1 }), {}))}`);
if (red.length) { log(`RED: ${red.map((r) => r.id).join(", ")}`); process.exit(1); }
