// STAGING ONLY. The Golden School's spine past the first administrator (docs/recovery/GOLDEN-SCHOOL-CONTRACT.md §5),
// the school admin's own screens, under Gate 3 and Gate 6 (staff sign in as masuk.mjs says, C2):
//
//   A0  read only: the school GS_SLUG exists, real, founded by C1, and its first administrator holds «Admin sekolah»
//       at its root (GS-01 to GS-03, staging-golden-school.yml).
//   A1  GS-03 again, as a person: the school admin signs in with the password set at their activation (G4) and
//       lands on Konfigurasi.
//   A2  GS-04 (J3.3): on Konfigurasi → Struktur sekolah, the same page, the admin builds the recipe's structure:
//       Bagian «Kelas Tinggi» → Tingkat «Kelas 5» (this school year) → Kelas «Kelas 5A». No hidden level shows;
//       «Persiapan sekolah» then says the Kelas is there and students and a teacher remain.
//   A3  GS-06 (J3.5): the teacher, the head of department and the dean: their names on Pendataan (after the
//       school's code, which a new school sets there first), an account by email on Aktivasi («Aktifkan dengan
//       email»: no email is sent; each activates at «Aktifkan akun»), and their roles on
//       Peran & akses: Guru at «Kelas 5A», Kepala departemen at «Kelas Tinggi», Dekan at the school.
//   A4  GS-07, its first half (J3.6): the five students recorded on Pendataan into «Kelas 5A» as Murid. The class
//       set of cards (J3.7, M7) is issued in the run that signs the students in (GS-12), and read from the
//       printable set there: card numbers and PINs are never kept between runs.
//   A5  read back, read only: the tree, the four staff roles, the five students; «Persiapan sekolah» done.
//   A6  GS-08 (J4.1, J4.2): content in. Konfigurasi → Studio → Buat Paket: the school, the synthetic workbook (SD 5
//       Matematika Bab 1, docs/onboarding/konten-sintetis, as on main; F-4: the real chapter left the public tree),
//       «Periksa buku kerja», the media it names (it names none), «Simpan ke Studio»; it is a draft of the school's,
//       whole, and its package page opens by its link.
//   A7  GS-05 (J3.8): back to Konfigurasi by Studio's own link; on Batas ketuntasan the chapter reads «Batas
//       ketuntasan belum ditetapkan» (no default, D-081); the admin sets 70% with a reason; the page reads it back,
//       the database holds it, by them, audited.
//   A8  GS-09, the reviewer: the head of department activates, in their own browser (the code from the staging test
//       mailbox, then the wizard), or signs in with their password if already active.
//   A9  GS-09 (J4.3–J4.5): the package page's seven steps by two people. The admin, who uploaded the chapter, composes,
//       checks and submits it; the head of department finds it in «Antrean Tinjauan», reads every question with its key
//       and reasons (D-088(h)), approves, makes and locks the release, and reviews any WARNING finding; the author is
//       never offered the second person's steps; the admin publishes. Read back: PUBLISHED, sealed, reviewed by the
//       head of department, its three release steps in the audit log.
//   A10 GS-10 (J2): the teacher activates (or signs in) the same way, in their own browser, and lands on Mengajar
//       with the class there.
//   A11 GS-11 (J5.4): Mengajar → the class → «Siapkan» → the published chapter; the school's pass mark read-only; an
//       end day 30 days ahead; «Sediakan». Read back: the class's learning assignment, both tests, the post-test sealed
//       at the school's mark (SCHOOL), the pre-test without one.
//
// GS-05 (the lesson's minimum passing mark) is set per lesson, so it follows GS-08, when the school has the
// chapter. Every page is reached by clicking from the previous one; a reload of the same page is allowed. A step
// already done is a NOTE, never repeated. NEVER: production (staging's ref, database URL and origin are checked
// first); a direct write (the database is read in read-only transactions; every write is a press of PINTAR's
// buttons); a server-made session as a person's act; any change to the product, its sign-in or its settings.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, appendFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { APP, SLOW, closeTour } from "../perf/lib.mjs";
import { keadaanDari, masukStaf, pilihKonteks } from "./masuk.mjs";
import { catat as catatDi } from "./pendataan.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SLUG = env("GS_SLUG");
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(SLUG)) throw new Error("GS_SLUG is not a school slug");
mkdirSync(join(OUT, "shots"), { recursive: true });

// the recipe (§4): fabricated test identities on the staging test mailbox's plus-addresses (D-084)
const mail = (who) => `goldenschool+${SLUG}-${who}@pintarselalu.com`;
const ADMIN_EMAIL = mail("admin");
// the school's three-character code: «G» and two characters from the slug. Codes are globally unique (a school's
// people are numbered under it), so the walk takes the first one no other school holds, as a person choosing one would
// (6 Oct: «sekolah-uji-b0» and «sekolah-demo-pintar» both gave «G00», and the screen rightly saved nothing)
const KODE_CALON = [`G${(SLUG.replace(/\D/g, "") || "0").slice(-2).padStart(2, "0")}`,
  ...Array.from({ length: 24 }, (_, i) => `G${(parseInt(createHash("sha256").update(`${SLUG}:${i}`).digest("hex").slice(0, 8), 16) % 1296).toString(36).toUpperCase().padStart(2, "0")}`)];
let KODE = KODE_CALON[0];
const BAGIAN = "Kelas Tinggi", TINGKAT = "Kelas 5", KELAS = "Kelas 5A";
const STAF = [
  { kunci: "guru", nama: `Guru ${SLUG.toUpperCase()}`, peran: "EDUCATOR", tempat: KELAS },
  { kunci: "kabag", nama: `Kepala Bagian ${SLUG.toUpperCase()}`, peran: "HEAD_OF_DEPARTMENT", tempat: BAGIAN },
  { kunci: "dekan", nama: `Dekan ${SLUG.toUpperCase()}`, peran: "DEAN", tempat: null },
];
const MURID = ["Utama", "Bunga", "Citra", "Dimas", "Eka"].map((n) => `${n} Murid ${SLUG.toUpperCase()}`);
// the chapter (§4): F-4 (D-145(b)), the synthetic workbook on main (the real one, with its key, left the public tree);
// its Kursus, Pelajaran and Soal sheets give these (docs/onboarding/konten-sintetis/buat-korpus.mts writes them)
const BUKU = fileURLToPath(new URL("../../docs/onboarding/konten-sintetis/SD5-Sintetis-Bab1.xlsx", import.meta.url));
const BAB = { judul: "Matematika Kelas 5 · Bab 1: Pola Bilangan", pelajaran: 4, soal: 18 };
const BATAS = { persen: "70", alasan: "Keputusan rapat guru Golden School" };

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };
const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const benar = (x) => ["t", "true"].includes(x);

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
  try { detail = await fn(rec); } catch (e) { rec.verdict = "FAIL"; detail = String(e.message ?? e).split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 3).join(" | ").slice(0, 500); }
  results.push({ id, verdict: rec.verdict });
  log(`${rec.verdict.padEnd(5)} ${id}  ${title} :: ${detail}`);
  // a failing check is also a GitHub annotation, readable through the API without the job log (D-140, 9 Oct)
  if (rec.verdict === "FAIL") console.log(`::error title=${id}::${String(detail).replace(/%/g, "%25").replace(/\r?\n/g, " ").slice(0, 900)}`);
  return rec.verdict;
}

// ── read-only facts about the school
let S = null;
const simpul = (kind, nama) => sql(`select id from public.org_nodes where institution_id = '${S.id}' and kind = '${kind}'
  and name = ${lit(nama)} and is_active order by created_at limit 1`);
const orang = (nama) => sql(`select p.id from public.persons p join public.institutional_identities ii on ii.person_id = p.id
  where ii.institution_id = '${S.id}' and p.display_name = ${lit(nama)} limit 1`);
const akunSurel = (email) => sql(`select count(*) from public.accounts a join auth.users u on u.id = a.auth_user_id
  where lower(u.email) = lower(${lit(email)})`) !== "0";
const peranAktif = (nama, peran, tempat) => sql(`select count(*) from public.role_assignments r join public.persons p on p.id = r.person_id
  where r.institution_id = '${S.id}' and p.display_name = ${lit(nama)} and r.role = '${peran}' and r.scope_node_id = '${tempat}'
    and r.revoked_at is null and now() < r.valid_until`) !== "0";
const diKelas = (kelas) => sql(`select count(distinct e.person_id) from public.memberships m join public.enrollments e on e.id = m.enrollment_id
  join public.persons p on p.id = e.person_id where m.node_id = '${kelas}' and m.valid_to is null and e.status in ('PENDING', 'ACTIVE')
    and p.display_name in (${MURID.map(lit).join(",")})`);

// ── the admin's screens, reached by clicking
async function klikTautan(page, href) {
  // D-138 step 3 (AppShell): under 1024 px the staff places and «Akun saya» sit in the menu; a person opens it first
  if (!(await page.locator(`a[href="${href}"]:visible`).count())) {
    const menu = page.locator('label[for="pin-laci"]');
    if (await menu.isVisible().catch(() => false)) await menu.click();
  }
  // W3.5 (Batch 2, JQ2(a)): Akun saya and Laporan saya sit in the account menu, opened by the staff member's name
  if (!(await page.locator(`a[href="${href}"]:visible`).count())) {
    const akun = page.locator('button[aria-controls="pin-menu-akun"]:visible').first();
    if (await akun.count()) await akun.click();
  }
  const a = page.locator(`a[href="${href}"]:visible`).first();
  await a.waitFor({ state: "visible", timeout: SLOW });
  await a.click();
  await page.waitForURL((u) => u.pathname === href, { timeout: SLOW });
  await page.waitForLoadState("networkidle");
  await closeTour(page);
}
// a person signs in as Gate 3 has it (masuk.mjs): activation the first time, the password after; where it lands
const setelan = keadaanDari(sql, lit);
async function masukSurel(page, email) {
  const r = await masukStaf(page, email, setelan);
  jalanMasuk.set(email, `${r.jalan}${r.lewat.length ? ` (${r.lewat.join(" → ")})` : ""}`);
  return r.di;
}
const jalanMasuk = new Map();
// Konfigurasi from wherever the admin is: by a link to it, or a reload when already there (the page has no link to itself)
async function keKonfigurasi(page) {
  if (new URL(page.url()).pathname === "/konfigurasi") { await page.reload({ waitUntil: "networkidle" }); await closeTour(page); }
  else await klikTautan(page, "/konfigurasi");
}
async function bacaPersiapan(page) {
  await page.reload({ waitUntil: "networkidle" });
  await closeTour(page);
  const out = {};
  for (const li of await page.locator("#persiapan li[data-langkah]").all()) {
    out[await li.getAttribute("data-langkah")] = (await li.getAttribute("data-selesai")) === "ya";
  }
  out.teks = norm(await page.locator("#persiapan").innerText().catch(() => ""));
  return out;
}
// Struktur sekolah: one «Tambah …» form, its name typed, its button pressed, and the new row waited for on screen
async function tambah(page, tingkatan, nama) {
  const f = page.locator(`div.pin-str-tambah-${tingkatan} form`).first();
  await f.waitFor({ state: "visible", timeout: SLOW });
  await f.locator('input[name="nama"]').fill(nama);
  await f.locator('button[type="submit"]').click();
  await page.locator("#struktur strong.pin-str-nama", { hasText: new RegExp(`^${nama}$`) }).first().waitFor({ timeout: SLOW });
  await page.waitForLoadState("networkidle");
}
// Pendataan: a pasted list, its place and role for every row, checked, confirmed, until «Selesai» (ADM-J08)
// Pendataan (pendataan.mjs, shared with the report walk's GS-22), with this walk's screenshots
const catat = (page, nama, opsi = {}) => catatDi(page, nama, opsi, { shot });
// Peran & akses on Konfigurasi: person, role, place, until the school year ends; «Berikan peran»
async function beriPeran(page, nama, peran, tempatNama) {
  const form = page.locator("form").filter({ has: page.locator('select[name="person"]') });
  let opsi = await form.locator('select[name="person"] option').filter({ hasText: nama }).first().getAttribute("value").catch(() => null);
  if (!opsi) { await page.reload({ waitUntil: "networkidle" }); opsi = await form.locator('select[name="person"] option').filter({ hasText: nama }).first().getAttribute("value").catch(() => null); }
  if (!opsi) throw new Error(`«${nama}» is not offered in the person list`);
  await form.locator('select[name="person"]').selectOption(opsi);
  await form.locator('select[name="role"]').selectOption(peran);
  const tempat = await form.locator('select[name="scope"] option').allTextContents();
  const nilai = await form.locator('select[name="scope"] option').filter({ hasText: tempatNama }).first().getAttribute("value").catch(() => null);
  if (!nilai) throw new Error(`no place «${tempatNama}» offered; offered: ${tempat.map(norm).join(" / ")}`);
  await form.locator('select[name="scope"]').selectOption(nilai);
  await form.locator('input[name="valid_until"]').fill(S.akhir);
  // the answer is this grant's own: the server action's redirect (run 36972520894 read the address the previous
  // grant had left, «hasil=ok», while the dean's grant never reached the server)
  const [jawab] = await Promise.all([
    page.waitForResponse((r) => r.request().method() === "POST" && Boolean(r.request().headers()["next-action"]), { timeout: SLOW }),
    form.getByRole("button", { name: "Berikan peran" }).click(),
  ]);
  const ke = String(jawab.headers()["x-action-redirect"] ?? "").split(";")[0];
  await page.waitForLoadState("networkidle");
  if (!ke) return { hasil: null, kode: `no redirect (HTTP ${jawab.status()})`, tawaran: tempat.map(norm) };
  const u = new URL(ke, APP);
  return { hasil: u.searchParams.get("hasil"), kode: u.searchParams.get("kode"), tawaran: tempat.map(norm) };
}

const browser = await chromium.launch();
const A = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" })).newPage();

await step("A0", `read only: «${SLUG}» exists, real, founded by C1, and its first administrator holds «Admin sekolah» at its root (GS-01 to GS-03)`, async (rec) => {
  const r = sql(`select i.id || '|' || i.name || '|' || i.is_synthetic::text || '|' || coalesce(i.namespace, '-') || '|' ||
      coalesce((select p.ends_on::text from public.academic_periods p where p.institution_id = i.id order by p.starts_on desc limit 1), '-') || '|' ||
      (select count(*) from public.role_assignments r join public.accounts a on a.person_id = r.person_id join auth.users u on u.id = a.auth_user_id
        where r.institution_id = i.id and r.role = 'INSTITUTION_ADMIN' and r.scope_node_id = i.id and r.revoked_at is null
          and now() < r.valid_until and lower(u.email) = lower(${lit(ADMIN_EMAIL)}))
    from public.institutions i where i.slug = ${lit(SLUG)}`);
  if (!r) { rec.verdict = "FAIL"; return `no school «${SLUG}»`; }
  const [id, nama, sintetis, kode, akhir, admin] = r.split("|");
  S = { id, nama, kode, akhir };
  if (sintetis !== "false" || akhir === "-" || admin !== "1") rec.verdict = "FAIL";
  return `«${nama}»: synthetic ${sintetis}; school year ends ${akhir}; school code ${kode}; its admin's «Admin sekolah» at the root: ${admin}`;
});
if (!S) { await browser.close(); log("RED: A0"); process.exit(1); }

let masuk = false;
await step("A1", "GS-03, as a person: the school admin signs in with the password set at their activation and lands on Konfigurasi", async (rec) => {
  const di = await masukSurel(A, ADMIN_EMAIL);
  await shot(A, "a1-konfigurasi");
  masuk = di === "/konfigurasi" && norm(await A.locator("main").innerText().catch(() => "")).includes(S.nama);
  if (!masuk) rec.verdict = "FAIL";
  return `signed in by ${jalanMasuk.get(ADMIN_EMAIL)}, landed on ${di}; their school named ${masuk}`;
});
if (!masuk) { await browser.close(); log("RED: A1"); process.exit(1); }

await step("A2", `GS-04 (J3.3): on Konfigurasi → Struktur sekolah the admin builds «${BAGIAN}» → «${TINGKAT}» → «${KELAS}»; no hidden level shows; «Persiapan sekolah» says the Kelas is there`, async (rec) => {
  const sudah = simpul("CLASS", KELAS);
  const jejak = [];
  if (sudah) { rec.verdict = "NOTE"; jejak.push("the structure already exists; nothing built"); }
  else {
    await A.locator("#struktur").scrollIntoViewIfNeeded();
    const kosong = norm(await A.locator("#struktur").innerText().catch(() => ""));
    jejak.push(`before: "${kosong.slice(0, 160)}"`);
    if (!simpul("DEPARTMENT", BAGIAN)) await tambah(A, "bagian", BAGIAN);
    if (!simpul("COHORT", TINGKAT)) await tambah(A, "tingkat", TINGKAT);
    await tambah(A, "kelas", KELAS);
  }
  await shot(A, "a2-struktur");
  const layar = norm(await A.locator("#struktur").innerText().catch(() => ""));
  const tersembunyi = /Jenjang|Reguler|Program/.test(layar);
  const kl = simpul("CLASS", KELAS);
  const tangga = kl ? sql(`with recursive up as (select id, parent_id, kind::text k, name, 1 n from public.org_nodes where id = '${kl}'
      union all select o.id, o.parent_id, o.kind::text, o.name, up.n + 1 from public.org_nodes o join up on o.id = up.parent_id)
    select string_agg(k || ' «' || name || '»', ' <- ' order by n) from up`) : "-";
  const tahun = kl ? sql(`select coalesce(p.name, '-') from public.org_nodes n left join public.academic_periods p on p.id = n.academic_period_id where n.id = '${kl}'`) : "-";
  const siap = await bacaPersiapan(A);
  jejak.push(`on screen: ${[BAGIAN, TINGKAT, KELAS].map((n) => `«${n}» ${layar.includes(n)}`).join(", ")}; hidden level shown ${tersembunyi}`,
    `ladder: ${tangga}; the Kelas's year ${tahun}`,
    `«Persiapan sekolah»: Kelas ${siap.kelas}, students ${siap.murid}, teacher ${siap.guru}`);
  if (!kl || tersembunyi || siap.kelas !== true || ![BAGIAN, TINGKAT, KELAS].every((n) => layar.includes(n))) rec.verdict = "FAIL";
  return jejak.join("; ");
});

await step("A3", "GS-06 (J3.5): the teacher, the head of department and the dean: names on Pendataan, an account by email on Aktivasi, roles on Peran & akses (Guru at the Kelas, Kepala departemen at the Bagian, Dekan at the school)", async (rec) => {
  const jejak = [];
  const kl = simpul("CLASS", KELAS), bg = simpul("DEPARTMENT", BAGIAN);
  if (!kl || !bg) { rec.verdict = "FAIL"; return "no structure (A2)"; }
  const tempatId = { [KELAS]: kl, [BAGIAN]: bg };
  // 1. names on Pendataan; a new school sets its three-letter code there first
  await klikTautan(A, "/pendataan");
  if (sql(`select coalesce(namespace, '') from public.institutions where id = '${S.id}'`) === "") {
    KODE = KODE_CALON.find((k) => sql(`select count(*) from public.institutions where upper(namespace) = upper(${lit(k)})`) === "0") ?? KODE;
    await A.locator("#pin-kode-isi").fill(KODE);
    await A.getByRole("button", { name: "Simpan kode", exact: true }).click();
    await A.locator("#pin-tempel").waitFor({ timeout: SLOW }).catch(() => {});
    await A.waitForLoadState("networkidle");
    const kode = sql(`select coalesce(namespace, '') from public.institutions where id = '${S.id}'`);
    jejak.push(`the school's code «${kode}» saved on Pendataan`);
    if (kode !== KODE) { rec.verdict = "FAIL"; return `${jejak.join("; ")}; expected «${KODE}»`; }
  }
  const belum = STAF.filter((p) => !orang(p.nama)).map((p) => p.nama);
  if (belum.length) jejak.push(`Pendataan: ${await catat(A, belum)}`);
  const tercatat = STAF.filter((p) => orang(p.nama)).length;
  jejak.push(`staff recorded ${tercatat}/3`);
  // 2. an account by email on Aktivasi (no email is sent; each activates later at «Aktifkan akun»)
  await klikTautan(A, "/aktivasi");
  for (const p of STAF) {
    if (akunSurel(mail(p.kunci))) continue;
    const baris = A.locator("li.pin-akt-orang", { hasText: p.nama }).first();
    if (!(await baris.count())) { jejak.push(`«${p.nama}» not on Aktivasi`); continue; }
    await baris.locator('input[type="email"]').fill(mail(p.kunci));
    await baris.getByRole("button", { name: "Aktifkan dengan email", exact: true }).click();
    await baris.locator('input[type="email"]').waitFor({ state: "detached", timeout: SLOW }).catch(() => {});
  }
  await shot(A, "a3-aktivasi");
  const akun = STAF.filter((p) => akunSurel(mail(p.kunci))).length;
  jejak.push(`accounts by email ${akun}/3`);
  // 3. roles on Konfigurasi → Peran & akses
  await klikTautan(A, "/konfigurasi");
  for (const p of STAF) {
    const tempatNama = p.tempat ?? S.nama;
    const tempatNode = p.tempat ? tempatId[p.tempat] : S.id;
    if (peranAktif(p.nama, p.peran, tempatNode)) { jejak.push(`${p.peran} for «${p.nama}» already held`); continue; }
    const r = await beriPeran(A, p.nama, p.peran, tempatNama);
    jejak.push(`${p.peran} at «${tempatNama}»: hasil=${r.hasil}${r.kode ? ` kode=${r.kode}` : ""}`);
  }
  await shot(A, "a3-peran");
  const peran = STAF.filter((p) => peranAktif(p.nama, p.peran, p.tempat ? tempatId[p.tempat] : S.id)).length;
  jejak.push(`roles held ${peran}/3`);
  if (tercatat !== 3 || akun !== 3 || peran !== 3) rec.verdict = "FAIL";
  return jejak.join("; ");
});

await step("A4", `GS-07, first half (J3.6): the five students recorded on Pendataan into «${KELAS}» as Murid (the class set of cards is issued where they sign in, GS-12)`, async (rec) => {
  const kl = simpul("CLASS", KELAS);
  if (!kl) { rec.verdict = "FAIL"; return "no Kelas (A2)"; }
  const sebelum = Number(diKelas(kl));
  if (sebelum === MURID.length) { rec.verdict = "NOTE"; return `the five are already in «${KELAS}»`; }
  await klikTautan(A, "/pendataan");
  const belum = MURID.filter((n) => !orang(n));
  const jejak = belum.length ? await catat(A, belum, { kelas: KELAS, peran: "STUDENT" }) : "nobody new to record";
  const sesudah = Number(diKelas(kl));
  if (sesudah !== MURID.length) rec.verdict = "FAIL";
  return `${jejak}; placed in «${KELAS}» (a current placement: PENDING or ACTIVE, as the product counts it): ${sesudah}/${MURID.length}`;
});

await step("A5", "read back, read only: the tree; the four staff roles; the five students; «Persiapan sekolah» done", async (rec) => {
  const pohon = sql(`select string_agg(kind::text || ' «' || name || '»', ', ' order by kind::text) from public.org_nodes where institution_id = '${S.id}' and is_active`);
  const peran = sql(`select string_agg(r.role::text || ' @ ' || n.name, ', ' order by r.role::text) from public.role_assignments r
    join public.org_nodes n on n.id = r.scope_node_id where r.institution_id = '${S.id}' and r.revoked_at is null and now() < r.valid_until`);
  const diaudit = sql(`select coalesce(bool_and(exists (select 1 from public.audit_log l where l.target_table = 'role_assignments' and l.target_id = r.id::text)), false)
    from public.role_assignments r where r.institution_id = '${S.id}' and r.revoked_at is null`);
  const kl = simpul("CLASS", KELAS);
  const murid = kl ? diKelas(kl) : "0";
  await klikTautan(A, "/konfigurasi").catch(() => {});
  const siap = await bacaPersiapan(A);
  await shot(A, "a5-persiapan");
  if (siap.kelas !== true || siap.murid !== true || siap.guru !== true || murid !== String(MURID.length) || !benar(diaudit)) rec.verdict = "FAIL";
  return `tree: ${pohon}; roles: ${peran}; every role audited: ${benar(diaudit)}; students in «${KELAS}»: ${murid}; ` +
    `«Persiapan sekolah»: Kelas ${siap.kelas}, students ${siap.murid}, teacher ${siap.guru} ("${siap.teks.slice(0, 200)}")`;
});

// the chapter in the school: its course, lessons and questions, read only
const bab = () => {
  const id = sql(`select id from public.courses where institution_id = '${S.id}' and title = ${lit(BAB.judul)} order by created_at limit 1`);
  if (!id) return null;
  const [status, pelajaran, soal, jejak] = sql(`select c.status::text || '|' ||
      (select count(*) from public.lessons l join public.modules m on m.id = l.module_id where m.course_id = c.id) || '|' ||
      (select count(*) from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = c.id) || '|' ||
      (select count(*) from public.audit_log a where a.institution_id = c.institution_id and a.target_id = c.id::text)
    from public.courses c where c.id = '${id}'`).split("|");
  return { id, status, pelajaran: Number(pelajaran), soal: Number(soal), jejak: Number(jejak) };
};

let kursus = null;
await step("A6", `GS-08 (J4.1, J4.2): content in: Konfigurasi → Studio → Buat Paket; «${BAB.judul}» from the synthetic workbook, checked, the media it names, saved to Studio as the school's draft; its package page opens by its link`, async (rec) => {
  if (!existsSync(BUKU)) { rec.verdict = "FAIL"; return `no workbook at ${BUKU}`; }
  const ada = bab();
  if (ada) {
    rec.verdict = "NOTE";
    kursus = ada.id;
    return `already in the school, nothing uploaded: status ${ada.status}, lessons ${ada.pelajaran}, questions ${ada.soal}`;
  }
  const jejak = [];
  await keKonfigurasi(A);
  await klikTautan(A, "/studio");
  await klikTautan(A, "/studio/unggah");
  const sel = A.locator("#ung-sekolah");
  const tawaran = (await sel.locator("option").allTextContents()).map(norm);
  const v = await sel.locator("option").filter({ hasText: S.nama }).first().getAttribute("value").catch(() => null);
  jejak.push(`schools offered: ${tawaran.map((x) => `«${x}»`).join(", ")}`);
  if (!v) { rec.verdict = "FAIL"; return `${jejak.join("; ")}; «${S.nama}» is not offered`; }
  await sel.selectOption(v);
  await A.locator("#ung-berkas").setInputFiles(BUKU);
  await A.getByRole("button", { name: "Periksa buku kerja", exact: true }).click();
  const lolos = await A.getByText("Buku kerja lolos pemeriksaan.").waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  await shot(A, "a6-periksa");
  jejak.push(`«Periksa buku kerja»: passed ${lolos}`);
  if (!lolos) {
    rec.verdict = "FAIL";
    return `${jejak.join("; ")}; the panel says "${norm(await A.locator(".pin-ung").innerText().catch(() => "")).slice(0, 300)}"`;
  }
  // the media the workbook names: this chapter's Pelajaran sheet names none, so the panel asks for none
  const media = await A.locator("#ung-media").count();
  jejak.push(`media asked for: ${media ? norm(await A.locator("ul.pin-ung-media").innerText().catch(() => "")) : "none (the workbook names none)"}`);
  if (media) { rec.verdict = "FAIL"; return `${jejak.join("; ")}; this walk carries no media`; }
  await A.getByRole("button", { name: "Simpan ke Studio", exact: true }).click();
  const simpan = await A.getByText("Tersimpan di Studio sebagai draf.").waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  const hitung = norm(await A.locator(".pin-ung-hitung").last().innerText().catch(() => ""));
  await shot(A, "a6-tersimpan");
  jejak.push(`«Simpan ke Studio»: «Tersimpan di Studio sebagai draf.» ${simpan}; the panel counts "${hitung}"`);
  const b = bab();
  if (b) {
    kursus = b.id;
    jejak.push(`in the database: status ${b.status}, lessons ${b.pelajaran}/${BAB.pelajaran}, questions ${b.soal}/${BAB.soal}, audit rows on the course ${b.jejak}`);
  }
  // the package page, by the panel's own link
  const buka = A.getByRole("link", { name: "Buka kursus", exact: true });
  if (simpan && b && await buka.count()) {
    await buka.click();
    await A.waitForURL((u) => u.pathname === `/studio/paket/${b.id}`, { timeout: SLOW });
    await A.waitForLoadState("networkidle");
    await closeTour(A);
    const halaman = norm(await A.locator("main").innerText().catch(() => ""));
    await shot(A, "a6-paket");
    jejak.push(`«Buka kursus» → ${new URL(A.url()).pathname}, the title on the page ${halaman.includes(BAB.judul)}`);
    if (!halaman.includes(BAB.judul)) rec.verdict = "FAIL";
  } else rec.verdict = "FAIL";
  if (!simpan || !b || b.pelajaran !== BAB.pelajaran || b.soal !== BAB.soal) rec.verdict = "FAIL";
  return jejak.join("; ");
});

await step("A7", `GS-05 (J3.8): back to Konfigurasi by Studio's own link; on Batas ketuntasan the chapter reads «Batas ketuntasan belum ditetapkan»; the admin sets ${BATAS.persen}% with a reason; the page and the database read it back, by them, audited`, async (rec) => {
  if (!kursus) { rec.verdict = "FAIL"; return "no chapter in the school (A6)"; }
  const sekarang = () => sql(`select m.percent || '|' || p.display_name || '|' || m.reason || '|' ||
      (select count(*) from public.audit_log l where l.action = 'school_pass_mark.set' and l.target_id = m.id::text)
    from public.school_pass_marks m join public.persons p on p.id = m.set_by_person_id
   where m.institution_id = '${S.id}' and m.course_id = public.course_lineage_root('${kursus}')
     and not exists (select 1 from public.school_pass_marks n where n.supersedes_id = m.id)`);
  const sudah = sekarang();
  if (sudah) { rec.verdict = "NOTE"; return `already set, nothing changed: ${sudah}`; }
  await keKonfigurasi(A);
  const baris = A.locator(`#ketuntasan li[data-pelajaran="${kursus}"]`);
  await A.locator("#ketuntasan").scrollIntoViewIfNeeded().catch(() => {});
  if (!(await baris.count())) {
    rec.verdict = "FAIL";
    await shot(A, "a7-ketuntasan");
    return `Batas ketuntasan lists no such chapter: "${norm(await A.locator("#ketuntasan").innerText().catch(() => "")).slice(0, 300)}"`;
  }
  const sebelum = norm(await baris.innerText());
  await baris.locator('input[name="persen"]').fill(BATAS.persen);
  await baris.locator('input[name="alasan"]').fill(BATAS.alasan);
  await baris.getByRole("button", { name: "Tetapkan", exact: true }).click();
  await A.waitForURL((u) => u.searchParams.get("bagian") === "ketuntasan", { timeout: SLOW });
  await A.waitForLoadState("networkidle");
  await closeTour(A);
  await shot(A, "a7-ketuntasan");
  const bagian = norm(await A.locator("#ketuntasan").innerText());
  const sesudah = norm(await A.locator(`#ketuntasan li[data-pelajaran="${kursus}"]`).innerText().catch(() => ""));
  const [persen, oleh, alasan, audit] = sekarang().split("|");
  const adminNama = sql(`select p.display_name from public.persons p join public.accounts a on a.person_id = p.id
    join auth.users u on u.id = a.auth_user_id where lower(u.email) = lower(${lit(ADMIN_EMAIL)}) limit 1`);
  const ok = /Batas ketuntasan belum ditetapkan/.test(sebelum) && /Batas ketuntasan ditetapkan/.test(bagian)
    && new RegExp(`Batas ketuntasan: ${BATAS.persen}\\s?%`).test(sesudah)
    && persen === BATAS.persen && alasan === BATAS.alasan && oleh === adminNama && audit === "1";
  if (!ok) rec.verdict = "FAIL";
  return `the row before: "${sebelum.slice(0, 140)}"; «Tetapkan» ${BATAS.persen} → the section says «Batas ketuntasan ditetapkan» ` +
    `${/Batas ketuntasan ditetapkan/.test(bagian)}; the row after: "${sesudah.slice(0, 140)}"; in the database ${persen}% set by «${oleh}» ` +
    `(the admin is «${adminNama}»), reason "${alasan}", audited ${audit}`;
});

// ── GS-09: the head of department reviews and locks; the school admin, who uploaded it, publishes
const KABAG = STAF.find((p) => p.kunci === "kabag");
// the course's status and its latest release's, as the package page reads them (langkah.ts posisiPaket)
const keadaan = () => {
  const [kursus_, terbitan] = sql(`select c.status::text || '|' || coalesce((select r.status::text from public.plp_releases r
    where r.course_id = c.id order by r.created_at desc limit 1), '-') from public.courses c where c.id = '${kursus}'`).split("|");
  return { kursus: kursus_, terbitan };
};
const teksKeadaan = () => { const k = keadaan(); return `${k.kursus}/${k.terbitan}`; };
// the step the package page offers next, and whose it is (langkah.ts: the author composes, checks and submits; a second
// person approves and locks; the head of department may also make the release; only the school admin publishes)
const langkahKini = () => {
  const k = keadaan();
  if (k.terbitan === "PUBLISHED") return null;
  if (k.terbitan === "FROZEN") return { kunci: "terbitkan", tombol: "Terbitkan", siapa: "admin" };
  if (k.terbitan !== "-") return { kunci: "kunci", tombol: "Kunci terbitan", siapa: "kabag" };
  return {
    INGESTED: { kunci: "susun", tombol: "Tandai sudah tersusun", siapa: "admin" },
    VALIDATION_FAILED: { kunci: "susun", tombol: "Tandai sudah tersusun", siapa: "admin" },
    STRUCTURED: { kunci: "periksa", tombol: "Tandai lolos pemeriksaan", siapa: "admin" },
    VALIDATED: { kunci: "ajukan", tombol: "Ajukan untuk ditinjau", siapa: "admin" },
    IN_REVIEW: { kunci: "setujui", tombol: "Setujui isi", siapa: "kabag" },
    APPROVED: { kunci: "buat", tombol: "Buat terbitan", siapa: "kabag" },
  }[k.kursus] ?? null;
};
// the package page, reached by clicking from Studio's home (the admin) or the review queue (the head of department)
async function kePaket(page, lewat) {
  if (!new URL(page.url()).pathname.startsWith("/studio")) await klikTautan(page, "/studio");
  if (lewat === "antrean") {
    await klikTautan(page, "/studio/tinjau");
    await page.getByRole("heading", { name: "Antrean Tinjauan", exact: true }).waitFor({ timeout: SLOW }).catch(() => {});
  } else if (new URL(page.url()).pathname !== "/studio") await klikTautan(page, "/studio");
  await klikTautan(page, `/studio/paket/${kursus}`);
  await page.getByRole("heading", { name: "Langkah menuju terbit", exact: true }).waitFor({ timeout: SLOW }).catch(() => {});
}
// press a step's button on the package page; the state it moved to, or null when nothing moved
async function tekan(page, tombol) {
  await page.reload({ waitUntil: "networkidle" });
  await closeTour(page);
  const b = page.getByRole("button", { name: tombol, exact: true });
  if (!(await b.count())) return { tidakAda: true };
  const sebelum = teksKeadaan();
  await b.first().click();
  let sesudah = sebelum;
  for (let i = 0; i < 40 && sesudah === sebelum; i++) { await page.waitForTimeout(500); sesudah = teksKeadaan(); }
  await page.waitForLoadState("networkidle");
  return { sesudah: sesudah === sebelum ? null : sesudah };
}
const langkahPage = async (page) => { const t = norm(await page.locator("main").innerText().catch(() => "")); const i = t.indexOf("Langkah menuju terbit"); return (i >= 0 ? t.slice(i) : t).slice(0, 260); };

const H = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" })).newPage();
let kabagMasuk = false;
await step("A8", `GS-09, the reviewer: the head of department «${KABAG.nama}» activates in their own browser (the code from the staging test mailbox, then the wizard), or signs in with their password`, async (rec) => {
  if (!kursus) { rec.verdict = "FAIL"; return "no chapter in the school (A6)"; }
  if (keadaan().terbitan === "PUBLISHED") { rec.verdict = "NOTE"; return "the chapter is already published; no review to do"; }
  const di = await masukSurel(H, mail(KABAG.kunci));
  await shot(H, "a8-kabag-masuk");
  // L3 (D-132(i), HOD-08): a head of department holds Mengajar and Mengelola in the school, so they land on the chooser
  // and choose Mengelola, whose Studio reviews
  const ke = di === "/" ? await pilihKonteks(H, { tujuan: "MENGELOLA" }) : di;
  kabagMasuk = di === "/" && ke === "/pimpinan";
  if (!kabagMasuk) rec.verdict = "FAIL";
  return `${jalanMasuk.get(mail(KABAG.kunci))}, landed on ${di}; chose Mengelola → ${ke}`;
});

await step("A9", "GS-09 (J4.3–J4.5): the seven steps by two people. The admin, its author, composes, checks and submits it; the head of department finds it in «Antrean Tinjauan», reads every question with its key and reasons, approves, makes and locks the release and reviews any finding; the admin is never offered the second person's steps; the admin publishes", async (rec) => {
  if (!kursus) { rec.verdict = "FAIL"; return "no chapter in the school (A6)"; }
  if (keadaan().terbitan === "PUBLISHED") { rec.verdict = "NOTE"; return `already published (${teksKeadaan()})`; }
  if (!kabagMasuk) { rec.verdict = "FAIL"; return "the head of department is not signed in (A8)"; }
  const jejak = [`from ${teksKeadaan()}`];
  const halaman = { admin: A, kabag: H };
  const sudahDiPaket = { admin: false, kabag: false };
  for (let n = 0; n < 9; n++) {
    const l = langkahKini();
    if (!l) break;
    const page = halaman[l.siapa];
    if (!sudahDiPaket[l.siapa]) { await kePaket(page, l.siapa === "kabag" ? "antrean" : "beranda"); sudahDiPaket[l.siapa] = true; }
    // a second person's step: the author (the admin) must not be offered it
    if (["setujui", "kunci"].includes(l.kunci)) {
      if (!sudahDiPaket.admin) { await kePaket(A, "beranda"); sudahDiPaket.admin = true; } else await A.reload({ waitUntil: "networkidle" });
      if (await A.getByRole("button", { name: l.tombol, exact: true }).count()) { jejak.push(`!! the author is offered «${l.tombol}»`); rec.verdict = "FAIL"; }
    }
    // D-088(h): before approving, the reviewer reads every question, its key and every option's reason
    if (l.kunci === "setujui") {
      await H.reload({ waitUntil: "networkidle" });
      const diLayar = await H.locator("#soal li.pin-soal").count();
      const kunciLayar = await H.locator("#soal li.pin-opsi-kunci").count();
      const opsiLayar = await H.locator("#soal li.pin-opsi").count();
      const [soal, opsi, kunciDb] = sql(`select (select count(*) from public.items i join public.lessons x on x.id = i.lesson_id join public.modules m on m.id = x.module_id where m.course_id = '${kursus}')
        || '|' || (select count(*) from public.item_options o join public.items i on i.id = o.item_id join public.lessons x on x.id = i.lesson_id join public.modules m on m.id = x.module_id where m.course_id = '${kursus}')
        || '|' || (select count(*) from public.item_options o join public.items i on i.id = o.item_id join public.lessons x on x.id = i.lesson_id join public.modules m on m.id = x.module_id where m.course_id = '${kursus}' and o.is_correct)`).split("|").map(Number);
      await shot(H, "a9-soal-ditinjau");
      jejak.push(`the head of department reads ${diLayar}/${soal} questions, ${opsiLayar}/${opsi} options with their reason, ${kunciLayar}/${kunciDb} keys`);
      if (!soal || diLayar !== soal || opsiLayar !== opsi || kunciLayar !== kunciDb) rec.verdict = "FAIL";
    }
    // publishing wants every WARNING finding reviewed by a second person (publish_readiness; never the author)
    if (l.kunci === "terbitkan") {
      const siap = () => sql(`select status || ' | ' || coalesce(blockers::text, '') from public.publish_readiness('${kursus}')`);
      const r0 = siap();
      jejak.push(`readiness: ${r0.slice(0, 160)}`);
      if (r0.startsWith("BLOCKED")) { rec.verdict = "FAIL"; jejak.push("ERROR findings: the content must be corrected before it can be published"); break; }
      if (!r0.startsWith("READY")) {
        // the head of department is on the package page since approving; a release no longer waits in the queue
        if (!sudahDiPaket.kabag) { await kePaket(H, "beranda"); sudahDiPaket.kabag = true; }
        let ditinjau = 0;
        for (let i = 0; i < 80; i++) {
          await H.reload({ waitUntil: "networkidle" });
          const ack = H.getByRole("button", { name: "Sudah saya tinjau", exact: true });
          if (!(await ack.count())) break;
          const terbuka = () => Number(sql(`select (select count(*) from public.mcq_quality_findings where course_id = '${kursus}' and acknowledged_at is null)
            + (select count(*) from public.coaching_findings where course_id = '${kursus}' and acknowledged_at is null)`));
          const n0 = terbuka();
          await ack.first().click();
          for (let k = 0; k < 20 && terbuka() === n0; k++) await H.waitForTimeout(300);
          ditinjau += 1;
        }
        await shot(H, "a9-temuan-ditinjau");
        jejak.push(`the head of department reviewed ${ditinjau} finding(s); readiness now ${siap().slice(0, 120)}`);
      }
    }
    const t = await tekan(page, l.tombol);
    const siapa = l.siapa === "admin" ? "the admin" : "the head of department";
    await shot(page, `a9-${l.kunci}`);
    if (t.tidakAda) { jejak.push(`${l.kunci}: no «${l.tombol}» for ${siapa} (${teksKeadaan()}); the page says "${await langkahPage(page)}"`); rec.verdict = "FAIL"; break; }
    if (!t.sesudah) { jejak.push(`${l.kunci}: «${l.tombol}» pressed by ${siapa}, nothing moved (${teksKeadaan()}); the page says "${await langkahPage(page)}"`); rec.verdict = "FAIL"; break; }
    jejak.push(`«${l.tombol}» by ${siapa} → ${t.sesudah}`);
  }
  // read back: the release, who wrote and reviewed it, its seal, and the audit trail of its three steps
  const r = sql(`select r.status::text || '|' || coalesce(r.version_label, '-') || '|' || (r.content_sha256 is not null)::text || '|' ||
      coalesce(a.display_name, '-') || '|' || coalesce(v.display_name, '-') || '|' ||
      coalesce((select string_agg(l.action || ' by ' || coalesce(p.display_name, '-'), ', ' order by l.at) from public.audit_log l
        left join public.persons p on p.id = l.actor_person_id where l.target_id = r.id::text), '-')
    from public.plp_releases r left join public.persons a on a.id = r.author_person_id left join public.persons v on v.id = r.reviewed_by_person_id
   where r.course_id = '${kursus}' order by r.created_at desc limit 1`);
  const [status, versi, segel, penulis, peninjau, audit] = (r || "-|-|-|-|-|-").split("|");
  jejak.push(`the release: ${status} ${versi}, sealed ${segel}; author «${penulis}», reviewed by «${peninjau}»; audit: ${audit}`);
  if (status !== "PUBLISHED" || segel !== "true" || peninjau !== KABAG.nama || !/RELEASE_PUBLISHED/.test(audit)) rec.verdict = "FAIL";
  return jejak.join("; ");
});

// ── GS-10, GS-11: the teacher signs in, finds the class and gives it the chapter
const GURU = STAF.find((p) => p.kunci === "guru");
const tugasKelas = () => {
  const kl = simpul("CLASS", KELAS);
  return kl && kursus ? sql(`select count(*) from public.learning_assignments where course_id = '${kursus}' and node_id = '${kl}'`) : "0";
};
const G = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta" })).newPage();
let guruMasuk = false;
await step("A10", `GS-10 (J2): the teacher «${GURU.nama}» activates (or signs in) in their own browser and lands on Mengajar with «${KELAS}» there`, async (rec) => {
  const di = await masukSurel(G, mail(GURU.kunci));
  await shot(G, "a10-mengajar");
  const teks = norm(await G.locator("main").innerText().catch(() => ""));
  guruMasuk = di === "/mengajar";
  if (!guruMasuk || !teks.includes(KELAS)) rec.verdict = "FAIL";
  return `${jalanMasuk.get(mail(GURU.kunci))}, landed on ${di}; «${KELAS}» on the page ${teks.includes(KELAS)}`;
});

await step("A11", `GS-11 (J5.4): Mengajar → «${KELAS}» → «Siapkan» → the published chapter; the school's pass mark is shown read-only (${BATAS.persen}%); until a day 30 days ahead; «Sediakan». The class has the chapter with both tests, the post-test sealed at the school's mark`, async (rec) => {
  if (keadaan().terbitan !== "PUBLISHED") { rec.verdict = "FAIL"; return `the chapter is not published (${teksKeadaan()}; A9)`; }
  if (!guruMasuk) { rec.verdict = "FAIL"; return "the teacher is not signed in (A10)"; }
  const kl = simpul("CLASS", KELAS);
  if (tugasKelas() !== "0") { rec.verdict = "NOTE"; return `«${KELAS}» already has the chapter`; }
  const jejak = [];
  // by clicking: the class from Mengajar, «Siapkan» from the class, the chapter from Siapkan's list
  await G.locator(`a.pin-row[href="/mengajar/${kl}"]`).first().click();
  await G.waitForURL((u) => u.pathname === `/mengajar/${kl}`, { timeout: SLOW });
  await G.waitForLoadState("networkidle");
  await closeTour(G);
  await klikTautan(G, `/mengajar/${kl}/siapkan`);
  await shot(G, "a11-siapkan-pilih");
  const baris = G.locator(`a.pin-row[href^="/mengajar/${kl}/siapkan?terbitan="]`).filter({ hasText: "Matematika Kelas 5" }).first();
  if (!(await baris.count())) {
    rec.verdict = "FAIL";
    return `Siapkan does not offer the chapter: "${norm(await G.locator("main").innerText().catch(() => "")).slice(0, 260)}"`;
  }
  await baris.click();
  await G.waitForURL((u) => u.pathname === `/mengajar/${kl}/siapkan` && u.searchParams.has("terbitan"), { timeout: SLOW });
  await G.waitForLoadState("networkidle");
  // the school's calendar (Asia/Jakarta): the teacher's "until" is a day on it
  const sampai = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(Date.now() + 30 * 86400000));
  await G.locator("#pin-sampai").fill(sampai);
  const batas = norm(await G.locator(".pin-batas").first().innerText().catch(() => ""));
  jejak.push(`Siapkan reads "${batas}"`);
  if (!new RegExp(`Batas ketuntasan: ${BATAS.persen}\\s?%`).test(batas)) rec.verdict = "FAIL";
  await shot(G, "a11-siapkan-tinjau");
  const [jawab] = await Promise.all([
    G.waitForResponse((r) => r.request().method() === "POST" && Boolean(r.request().headers()["next-action"]), { timeout: SLOW }),
    G.locator('form:has(input[name="terbitan"]) button[type="submit"]').first().click(),
  ]);
  const ke = String(jawab.headers()["x-action-redirect"] ?? "").split(";")[0];
  await G.waitForLoadState("networkidle");
  await shot(G, "a11-sediakan");
  jejak.push(`«Sediakan» answered ${ke || `HTTP ${jawab.status()}`}`);
  const la = tugasKelas();
  const segel = sql(`select coalesce(string_agg(d.mode::text || ':' || coalesce(aa.pass_mark::text, '-') || ':' || coalesce(aa.pass_mark_source, '-'), ',' order by d.mode::text), '-')
    from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
    join public.learning_assignments la on la.id = aa.learning_assignment_id where la.course_id = '${kursus}' and la.node_id = '${kl}'`);
  const jendela = sql(`select to_char(available_from at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI') || ' .. ' ||
      coalesce(to_char(available_until at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI:SS'), '-') || ' Jakarta; by ' ||
      coalesce((select p.display_name from public.persons p where p.id = la.assigned_by_person_id), '-')
    from public.learning_assignments la where la.course_id = '${kursus}' and la.node_id = '${kl}' order by created_at desc limit 1`);
  jejak.push(`learning assignments for «${KELAS}» ${la}; window ${jendela}; tests sealed ${segel}`);
  const tanda = (Number(BATAS.persen) / 100).toFixed(2);
  if (la === "0" || !new RegExp(`POST_TEST:${tanda.replace(".", "\\.")}:SCHOOL`).test(segel) || !/PRE_TEST:-:-/.test(segel)) rec.verdict = "FAIL";
  return jejak.join("; ");
});

await browser.close();
const red = results.filter((r) => r.verdict === "FAIL");
log(`TALLY ${JSON.stringify(results.reduce((t, r) => ({ ...t, [r.verdict]: (t[r.verdict] ?? 0) + 1 }), {}))}`);
if (red.length) { log(`RED: ${red.map((r) => r.id).join(", ")}`); process.exit(1); }
