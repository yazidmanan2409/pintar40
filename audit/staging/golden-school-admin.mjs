// STAGING ONLY. The Golden School's spine past the first administrator (docs/recovery/GOLDEN-SCHOOL-CONTRACT.md §5),
// the school admin's own screens, before Gate 3:
//
//   A0  read only: the school GS_SLUG exists, real, founded by C1, and its first administrator holds «Admin sekolah»
//       at its root (GS-01 to GS-03, staging-golden-school.yml).
//   A1  GS-03 again, as a person: the school admin signs in by the real email link from the staging test mailbox
//       (/masuk, the same browser) and lands on Konfigurasi. ONE sign-in email (staging allows 2 an hour, shared).
//   A2  GS-04 (J3.3): on Konfigurasi → Struktur sekolah, the same page, the admin builds the recipe's structure:
//       Bagian «Kelas Tinggi» → Tingkat «Kelas 5» (this school year) → Kelas «Kelas 5A». No hidden level shows;
//       «Persiapan sekolah» then says the Kelas is there and students and a teacher remain.
//   A3  GS-06 (J3.5): the teacher, the head of department and the dean: their names on Pendataan (after the
//       school's code, which a new school sets there first), an account by email on Aktivasi, and their roles on
//       Peran & akses: Guru at «Kelas 5A», Kepala departemen at «Kelas Tinggi», Dekan at the school.
//   A4  GS-07, its first half (J3.6): the five students recorded on Pendataan into «Kelas 5A» as Murid. The class
//       set of cards (J3.7, M7) is issued in the run that signs the students in (GS-12), and read from the
//       printable set there: card numbers and PINs are never kept between runs.
//   A5  read back, read only: the tree, the four staff roles, the five students; «Persiapan sekolah» done.
//   A6  GS-08 (J4.1, J4.2): content in. Konfigurasi → Studio → Buat Paket: the school, the real workbook (SD 5
//       Matematika Bab 1, docs/onboarding/konten, as on main), «Periksa buku kerja», the media it names (it names
//       none), «Simpan ke Studio»; it is a draft of the school's, whole, and its package page opens by its link.
//   A7  GS-05 (J3.8): back to Konfigurasi by Studio's own link; on Batas ketuntasan the chapter reads «Batas
//       ketuntasan belum ditetapkan» (no default, D-081); the admin sets 70% with a reason; the page reads it back,
//       the database holds it, by them, audited.
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
import { fileURLToPath } from "node:url";
import { APP, SLOW, closeTour } from "../perf/lib.mjs";

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
const KODE = `G${(SLUG.replace(/\D/g, "") || "0").slice(-2).padStart(2, "0")}`;
const BAGIAN = "Kelas Tinggi", TINGKAT = "Kelas 5", KELAS = "Kelas 5A";
const STAF = [
  { kunci: "guru", nama: `Guru ${SLUG.toUpperCase()}`, peran: "EDUCATOR", tempat: KELAS },
  { kunci: "kabag", nama: `Kepala Bagian ${SLUG.toUpperCase()}`, peran: "HEAD_OF_DEPARTMENT", tempat: BAGIAN },
  { kunci: "dekan", nama: `Dekan ${SLUG.toUpperCase()}`, peran: "DEAN", tempat: null },
];
const MURID = ["Utama", "Bunga", "Citra", "Dimas", "Eka"].map((n) => `${n} Murid ${SLUG.toUpperCase()}`);
// the chapter (§4): the real workbook on main; its Kursus, Pelajaran and Soal sheets give these (read 2 Oct, 0a81e5b)
const BUKU = fileURLToPath(new URL("../../docs/onboarding/konten/SD5-Matematika-Bab1.xlsx", import.meta.url));
const BAB = { judul: "Matematika Kelas 5 · Bab 1: Bilangan Cacah sampai 100.000", pelajaran: 5, soal: 31 };
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
  try { detail = await fn(rec); } catch (e) { rec.verdict = "FAIL"; detail = String(e.message ?? e).split("\n")[0].slice(0, 300); }
  results.push({ id, verdict: rec.verdict });
  log(`${rec.verdict.padEnd(5)} ${id}  ${title} :: ${detail}`);
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
  const a = page.locator(`a[href="${href}"]`).first();
  await a.waitFor({ state: "visible", timeout: SLOW });
  await a.click();
  await page.waitForURL((u) => u.pathname === href, { timeout: SLOW });
  await page.waitForLoadState("networkidle");
  await closeTour(page);
}
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
async function catat(page, nama, { kelas = null, peran = null } = {}) {
  const jejak = [];
  await page.locator("#pin-tempel").fill(["nama", ...nama].join("\n"));
  await page.locator("#pin-medan-node_id").waitFor({ timeout: SLOW });
  if (kelas) {
    const tempat = await page.locator("#pin-medan-node_id option").evaluateAll((os) => os.map((o) => ({ v: o.value, t: (o.textContent ?? "").trim() })));
    const k = tempat.find((o) => o.v.startsWith("t:") && o.t.includes(kelas));
    if (!k) throw new Error(`«${kelas}» is not offered as a place: ${JSON.stringify(tempat.map((o) => o.t))}`);
    await page.locator("#pin-medan-node_id").selectOption(k.v);
    jejak.push(`Tempat «${k.t}»`);
  }
  if (peran) await page.locator("#pin-medan-role").selectOption(`t:${peran}`);
  await page.getByRole("button", { name: "Lanjut ke pemeriksaan", exact: true }).click();
  await page.waitForURL((u) => /^\/pendataan\/[^/]+$/.test(u.pathname), { timeout: SLOW });
  await page.getByRole("button", { name: "Periksa daftar ini", exact: true }).click();
  await page.getByRole("button", { name: "Ya, catat orang-orang ini", exact: true }).waitFor({ timeout: SLOW });
  await shot(page, "pendataan-pratinjau");
  await page.getByRole("button", { name: "Ya, catat orang-orang ini", exact: true }).click();
  for (let i = 0; i < 60; i++) {
    await page.waitForLoadState("networkidle");
    if (/· Selesai\b/.test(norm(await page.locator("main").innerText().catch(() => "")))) { jejak.push("«Selesai»"); break; }
    for (const tombol of ["Sudah saya periksa, lanjutkan sisanya", "Mulai mencatat", "Lanjutkan"]) {
      const b = page.getByRole("button", { name: tombol, exact: true });
      if (await b.count() && await b.first().isEnabled()) { await b.first().click(); jejak.push(`«${tombol}»`); break; }
    }
    await page.waitForTimeout(1000);
    if (i % 5 === 4) await page.reload({ waitUntil: "networkidle" });
  }
  await shot(page, "pendataan-selesai");
  // back to the list by the page's own link
  await page.locator('a.pin-back[href="/pendataan"]').first().click();
  await page.waitForURL((u) => u.pathname === "/pendataan", { timeout: SLOW });
  await page.waitForLoadState("networkidle");
  return `${nama.length} name(s) pasted; ${jejak.join(" → ")}`;
}
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
await step("A1", "GS-03, as a person: the school admin signs in by the real email link (/masuk, the staging test mailbox, the same browser) and lands on Konfigurasi", async (rec) => {
  const t0 = Date.now() / 1000 - 60;
  await A.goto(`${APP}/masuk`, { timeout: SLOW, waitUntil: "networkidle" });
  await A.locator("#email").fill(ADMIN_EMAIL);
  await A.getByRole("button", { name: "Kirim tautan masuk" }).click();
  await A.getByRole("heading", { name: "Periksa email Anda" }).waitFor({ timeout: SLOW });
  const link = execFileSync("python3", ["mailbox_link.py", ADMIN_EMAIL, String(t0), "180"], { encoding: "utf8" }).trim();
  console.log(`::add-mask::${link}`);
  await A.goto(link, { timeout: SLOW, waitUntil: "networkidle" });
  await A.waitForURL((u) => !u.pathname.startsWith("/auth/"), { timeout: SLOW }).catch(() => {});
  await A.waitForLoadState("networkidle");
  await closeTour(A);
  const di = new URL(A.url()).pathname;
  await shot(A, "a1-konfigurasi");
  masuk = di === "/konfigurasi" && norm(await A.locator("main").innerText().catch(() => "")).includes(S.nama);
  if (!masuk) rec.verdict = "FAIL";
  return `signed in by the email link, landed on ${di}; their school named ${masuk}`;
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
  // 2. an account by email on Aktivasi (no email is sent; each signs in later through /masuk)
  await klikTautan(A, "/aktivasi");
  for (const p of STAF) {
    if (akunSurel(mail(p.kunci))) continue;
    const baris = A.locator("li.pin-akt-orang", { hasText: p.nama }).first();
    if (!(await baris.count())) { jejak.push(`«${p.nama}» not on Aktivasi`); continue; }
    await baris.locator('input[type="email"]').fill(mail(p.kunci));
    await baris.getByRole("button", { name: "Aktifkan dengan surel", exact: true }).click();
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
await step("A6", `GS-08 (J4.1, J4.2): content in: Konfigurasi → Studio → Buat Paket; «${BAB.judul}» from the real workbook, checked, the media it names, saved to Studio as the school's draft; its package page opens by its link`, async (rec) => {
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

await browser.close();
const red = results.filter((r) => r.verdict === "FAIL");
log(`TALLY ${JSON.stringify(results.reduce((t, r) => ({ ...t, [r.verdict]: (t[r.verdict] ?? 0) + 1 }), {}))}`);
if (red.length) { log(`RED: ${red.map((r) => r.id).join(", ")}`); process.exit(1); }
