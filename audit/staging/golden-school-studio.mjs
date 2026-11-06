// STAGING ONLY. W6.5 and W6.7 on deployed staging (Batch 3 exit gate; owner, 2 Nov: «Batch 3 controlled promotion»).
// The whole Studio path by the screens, in a Golden School that GS-01 to GS-21 have already walked (its admin, its
// head of department «Kelas Tinggi», its Guru of «Kelas 5A», its Dekan and its five learners exist):
//
//   T0  read only: the school, «Kelas 5A», the staff accounts, and staging's own migration for this batch.
//   T1  the Guru signs in and, from Mengajar, opens Studio → «Buat Paket» and downloads «Unduh contoh isian» (W1.10):
//       the example's own made-up chapter, which she makes hers (a new title); it was never imported anywhere.
//   T2  her first upload FAILS at «Periksa buku kerja», row by row (question C1's difficulty is not one the column
//       allows), and nothing is saved.
//   T3  she fixes the row; the check passes; «Simpan ke Studio»: a draft, with her as its author.
//   T4  «Tandai sudah tersusun», «Tandai lolos pemeriksaan», «Ajukan untuk ditinjau»; she is offered neither the
//       reviewer's «Setujui isi» nor «Kembalikan ke penyusun».
//   T5  the head of department finds it in «Antrean Tinjauan» and sends it back ONCE with a reason (W1.6).
//   T6  the Guru reads the reason, who gave it and when (W1.8), and the way to the correction.
//   T7  she uploads the corrected workbook as the next version of the package, with what changed, and submits again.
//   T8  the head of department approves, acknowledges the findings by kind (W1.5), and creates and locks the release
//       in one press (W1.4); the author is offered neither; the head of department is not offered «Terbitkan».
//   T9  the school admin publishes («✓ Diterbitkan») and sets the line's pass mark on Konfigurasi.
//   T10 the Guru gives it to «Kelas 5A» on Siapkan («✓ Disediakan», W3.11).
//   T11 the school admin re-issues one learner's damaged card on Aktivasi (as GS-21 does; the new card is read from
//       its sheet, never printed); the learner signs in with it, finds the chapter on Belajar and opens it.
//   T12 «Riwayat perbaikan» names the send-back with its reason, the correction and the approval, with who and when.
//   T13 W6.7: the Guru launches an Uji Cepat of three of the chapter's questions for «Kelas 5A».
//   T14 the learner hands it in; no certificate comes of it (J5.7).
//   T15 «Lihat hasil»: the class figure on its base first, the learner one step below (W2.4).
//   T7a, T10 (end), T10b: the Batch 3 closure: Studio's home lists a line once; after «Sediakan» the card and the class page say
//       «✓ Tersedia»; the Guru browses Bank Soal with keys and no Question Health (F-7)
//   T16 read only: nama_riwayat_paket, called as each kind of reader inside a read-only transaction: the author is
//       told the reviewer; the same school's Dekan (no Studio capability) and another school's administrator are told
//       nobody; nobody is told a person not recorded on the package; an anonymous caller is refused.
//
// Synthetic content only (F-4): the example workbook's made-up chapter. Every write is a press of PINTAR's buttons;
// the database is read in read-only transactions. NEVER production: staging's ref, database URL and origin are
// checked first. A step that cannot run because an earlier one failed is BLOCKED, and the run is red.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { APP, SLOW, closeTour } from "../perf/lib.mjs";
import { keadaanDari, masukStaf, pilihKonteks, tutupi } from "./masuk.mjs";
import { ubahBuku, ubahBaris, xmlTeks } from "../buku-kerja.mjs";

const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} is not set`); return v; };
const DB = env("STAGING_SUPABASE_DB_URL");
const REF = env("STAGING_SUPABASE_PROJECT_REF");
const PRODUCTION_REF = env("PRODUCTION_SUPABASE_PROJECT_REF");
const SLUG = env("GS_SLUG");
const SEKOLAH_LAIN = process.env.GS_OTHER_SLUG ?? "";
const OUT = process.env.OUT_DIR ?? "out";
const SUMMARY = process.env.GITHUB_STEP_SUMMARY;
if (!DB.includes(REF) || DB.includes(PRODUCTION_REF) || !APP.includes("staging")) throw new Error("not staging");
if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(SLUG)) throw new Error("GS_SLUG is not a school slug");
if (SEKOLAH_LAIN && !/^[a-z0-9][a-z0-9-]{1,40}$/.test(SEKOLAH_LAIN)) throw new Error("GS_OTHER_SLUG is not a school slug");
mkdirSync(join(OUT, "shots"), { recursive: true });

const mail = (who) => `goldenschool+${SLUG}-${who}@pintarselalu.com`;
const KELAS = "Kelas 5A";
const MURID = ["Utama", "Bunga", "Citra", "Dimas", "Eka"].map((n) => `${n} Murid ${SLUG.toUpperCase()}`);
const PELAJAR = MURID[2]; // GS-21 re-issues Utama's and Bunga's cards; this walk re-issues Citra's
// one chapter per run, so the walk can be run again on the same school (each run's chapter is its own)
const RUN = (process.env.GITHUB_RUN_ID ?? String(Date.now())).slice(-6);
const JUDUL = `Matematika Kelas 4 · Kelipatan Bilangan (${SLUG} · ${RUN})`;
const ALASAN_KEMBALI = "Soal C5 terlalu panjang untuk murid kelas 4; mohon dipersingkat kalimatnya.";
const RINGKASAN = "Soal C5 dipersingkat sesuai catatan peninjau.";

const sql = (q) => execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
  "-c", "begin transaction read only", "-c", q, "-c", "commit"], { encoding: "utf8" }).trim();
const lit = (s) => { if (String(s).includes("$q$")) throw new Error("unsafe literal"); return `$q$${s}$q$`; };
const uuid = (s) => { if (!/^[0-9a-f-]{36}$/.test(s)) throw new Error(`not a uuid: ${s}`); return s; };
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const log = (s) => { console.log(s); if (SUMMARY) appendFileSync(SUMMARY, `${s}\n`); };

// ─────────────────────────────── steps
const hasil = [];
let shotN = 0;
async function shot(page, name) {
  const f = join(OUT, "shots", `${String(++shotN).padStart(2, "0")}-${name}.png`);
  await page.screenshot({ path: f, fullPage: true }).catch(() => {});
  return f;
}
async function step(id, judul, fn) {
  const rec = { verdict: "PASS", catatan: [] };
  try { await fn(rec); } catch (e) {
    rec.verdict = "FAIL";
    rec.catatan.push(`error: ${String(e.message ?? e).split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 3).join(" | ").slice(0, 400)}`);
  }
  hasil.push({ id, judul, verdict: rec.verdict, catatan: rec.catatan });
  log(`${rec.verdict.padEnd(7)} ${id}  ${judul} :: ${rec.catatan.join("; ")}`);
  if (rec.verdict !== "PASS") console.log(`::error title=${id}::${rec.catatan.join("; ").replace(/%/g, "%25").replace(/\r?\n/g, " ").slice(0, 900)}`);
  return rec.verdict === "PASS";
}
const harus = (rec, ok, kata) => { rec.catatan.push(`${ok ? "ok" : "!!"} ${kata}`); if (!ok) rec.verdict = "FAIL"; return ok; };
const terhalang = (rec, sebab) => { rec.verdict = "BLOCKED"; rec.catatan.push(sebab); };

async function klikTautan(page, href) {
  if (!(await page.locator(`a[href="${href}"]:visible`).count())) {
    const menu = page.locator('[data-laci-tombol]:visible, label[for="pin-laci"]:visible').first();
    if (await menu.isVisible().catch(() => false)) await menu.click();
  }
  const a = page.locator(`a[href="${href}"]:visible`).first();
  await a.waitFor({ state: "visible", timeout: SLOW });
  await a.click();
  await page.waitForURL((u) => u.pathname + u.search === href || u.pathname === href, { timeout: SLOW });
  await page.waitForLoadState("networkidle");
  await closeTour(page);
}
const konteks = () => ({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta", acceptDownloads: true });
const jalanMasuk = new Map();
async function masukSurel(page, email) {
  const r = await masukStaf(page, email, keadaanDari(sql, lit));
  jalanMasuk.set(email, r.jalan);
  return r.di;
}

// ═══════════════════════════════════════════════════════════════════════════ T0
const browser = await chromium.launch();
let S = null;
await step("T0", `read only: «${SLUG}», «${KELAS}», its staff, and staging's migration for Batch 3`, async (rec) => {
  const r = sql(`select i.id || '|' || k.id || '|' ||
      (select count(*) from supabase_migrations.schema_migrations) || '|' ||
      (to_regprocedure('public.nama_riwayat_paket(uuid[])') is not null)::text || '|' ||
      (select count(*) from public.courses c where c.institution_id = i.id and c.title = ${lit(JUDUL)})
    from public.institutions i join public.org_nodes k on k.institution_id = i.id and k.kind = 'CLASS' and k.name = ${lit(KELAS)} and k.is_active
   where i.slug = ${lit(SLUG)} limit 1`);
  if (!harus(rec, !!r, `the school «${SLUG}» with «${KELAS}»`)) return;
  const [id, kelas, migrasi, fungsi, sudah] = r.split("|");
  S = { id: uuid(id), kelas: uuid(kelas) };
  harus(rec, Number(migrasi) >= 182 && fungsi === "true", `staging holds ${migrasi} migrations and nama_riwayat_paket: ${fungsi}`);
  harus(rec, sudah === "0", `no chapter titled «${JUDUL}» yet (${sudah}): this run's own chapter`);
  for (const who of ["admin", "kabag", "guru", "dekan"]) {
    harus(rec, keadaanDari(sql, lit)(mail(who)) !== null, `${who} has an account`);
  }
});
if (!S || hasil.at(-1).verdict !== "PASS") { await browser.close(); log("RED: T0"); process.exit(1); }

// ─────────────────────────────── the people, each in their own browser
const G = await (await browser.newContext(konteks())).newPage();
const H = await (await browser.newContext(konteks())).newPage();
const A = await (await browser.newContext(konteks())).newPage();
const M = await (await browser.newContext(konteks())).newPage();

let course = "", pertama = "";
const keadaan = () => sql(`select c.status || '|' || coalesce((select r.status::text from public.plp_releases r where r.course_id = c.id order by r.created_at desc limit 1), '-') from public.courses c where c.id = '${uuid(course)}'`);
const paket = (page) => page.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle", timeout: SLOW });
async function tekan(page, tombol, rec, nama, { sampai = null } = {}) {
  await paket(page);
  const btn = page.getByRole("button", { name: tombol, exact: true });
  if (!(await btn.count())) { harus(rec, false, `«${tombol}» is offered (state ${keadaan()})`); return null; }
  const sebelum = keadaan();
  await btn.first().click();
  let sesudah = sebelum;
  for (let i = 0; i < 60 && (sesudah === sebelum || (sampai && !sampai.test(sesudah))); i++) { await page.waitForTimeout(500); sesudah = keadaan(); }
  await page.waitForLoadState("networkidle");
  await shot(page, nama);
  harus(rec, sesudah !== sebelum, `«${tombol}»: ${sebelum} → ${sesudah}`);
  return sesudah !== sebelum ? sesudah : null;
}
const ditawarkan = async (page, tombol) => { await paket(page); return (await page.getByRole("button", { name: tombol, exact: true }).count()) > 0; };

// ─────────────────────────────── T1–T3 · the Guru's chapter
let buku = null;
const JUDUL_CONTOH = "Contoh — Matematika Kelas 4 · Kelipatan Bilangan";
const SOAL_C5 = "Lampu merah menyala setiap 2 menit dan lampu hijau setiap 5 menit. Keduanya menyala bersama pada menit ke-0. Pada menit ke berapa keduanya menyala bersama lagi?";
const SOAL_C5_SINGKAT = "Lampu merah menyala tiap 2 menit, lampu hijau tiap 5 menit. Mulai bersama, kapan menyala bersama lagi?";
const bukuGuru = (rusak, dikoreksi = false) => ubahBuku(buku, (lembar, xml) => {
  let x = xml.split(`>${xmlTeks(JUDUL_CONTOH)}</t>`).join(`>${xmlTeks(JUDUL)}</t>`);
  if (dikoreksi && lembar === "Soal") x = x.split(`>${xmlTeks(SOAL_C5)}</t>`).join(`>${xmlTeks(SOAL_C5_SINGKAT)}</t>`);
  if (rusak && lembar === "Soal") x = ubahBaris(x, "C1", "Mudah", "Gampang");
  return x;
});
const tulisBerkas = (nama, b) => { const f = join(OUT, nama); writeFileSync(f, b); return f; };
async function periksaBuku(page, berkas) {
  await page.locator("#ung-berkas").setInputFiles(berkas);
  await page.getByRole("button", { name: "Periksa buku kerja" }).click();
  const lolos = page.getByText("Buku kerja lolos pemeriksaan.");
  const gagal = page.getByText("Paket ini belum bisa diterima");
  await Promise.race([lolos.waitFor({ timeout: SLOW }).catch(() => {}), gagal.waitFor({ timeout: SLOW }).catch(() => {})]);
  return { lolos: await lolos.isVisible().catch(() => false), teks: norm(await page.locator("main").innerText().catch(() => "")) };
}
const kursusIni = () => sql(`select coalesce((select id::text from public.courses where institution_id = '${S.id}' and title = ${lit(JUDUL)} and supersedes_course_id is null order by created_at desc limit 1), '')`);

await step("T1", "the Guru signs in, opens Studio → «Buat Paket» from Mengajar, and downloads «Unduh contoh isian» (W1.10)", async (rec) => {
  const di = await masukSurel(G, mail("guru"));
  harus(rec, di === "/mengajar", `the Guru (${jalanMasuk.get(mail("guru"))}) lands on ${di}`);
  await klikTautan(G, "/studio");
  await klikTautan(G, "/studio/unggah");
  await shot(G, "t1-unggah");
  const tombol = G.getByRole("button", { name: "Unduh contoh isian" });
  if (!harus(rec, (await tombol.count()) === 1, "«Buat Paket» offers «Unduh contoh isian»")) return;
  const [unduh] = await Promise.all([G.waitForEvent("download", { timeout: SLOW }), tombol.click()]);
  buku = readFileSync(await unduh.path());
  harus(rec, buku.length > 1000 && buku.readUInt32LE(0) === 0x04034b50, `downloaded ${unduh.suggestedFilename()} (${buku.length} bytes)`);
});

await step("T2", "her first upload fails at «Periksa buku kerja», row by row, and nothing is saved", async (rec) => {
  if (!buku) return terhalang(rec, "T1 downloaded no workbook");
  const r = await periksaBuku(G, tulisBerkas("bab-guru-salah.xlsx", bukuGuru(true)));
  await shot(G, "t2-periksa-gagal");
  harus(rec, !r.lolos, "the check does not pass");
  harus(rec, /Lembar Soal, baris 2, kolom Tingkat kesulitan/.test(r.teks), "the refusal names the sheet, the row and the column (Soal, row 2, Tingkat kesulitan)");
  harus(rec, /Belum ada yang disimpan/.test(r.teks), "the page says nothing was saved");
  harus(rec, kursusIni() === "", "no course was made");
});

await step("T3", "she fixes the row; the check passes; «Simpan ke Studio» saves her chapter as a draft", async (rec) => {
  if (!buku) return terhalang(rec, "T1 downloaded no workbook");
  await G.reload({ waitUntil: "networkidle" });
  const r = await periksaBuku(G, tulisBerkas("bab-guru.xlsx", bukuGuru(false)));
  if (!harus(rec, r.lolos, "«Buku kerja lolos pemeriksaan.»")) return;
  await G.getByRole("button", { name: "Simpan ke Studio" }).click();
  const saved = await G.getByText("Tersimpan di Studio sebagai draf.").waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  await shot(G, "t3-tersimpan");
  harus(rec, saved, "«Tersimpan di Studio sebagai draf.»");
  course = kursusIni();
  if (!harus(rec, !!course, `the course exists (${course ? keadaan() : "none"})`)) return;
  const penyusun = sql(`select coalesce((select u.email from public.courses c join public.accounts a on a.person_id = c.author_person_id join auth.users u on u.id = a.auth_user_id where c.id = '${uuid(course)}' limit 1), '-')`);
  harus(rec, penyusun.toLowerCase() === mail("guru").toLowerCase(), "its author is the Guru");
});

await step("T4", "the Guru takes it to review; she is offered neither «Setujui isi» nor «Kembalikan ke penyusun»", async (rec) => {
  if (!course) return terhalang(rec, "no chapter (T3)");
  for (const [tombol, nama] of [["Tandai sudah tersusun", "t4-susun"], ["Tandai lolos pemeriksaan", "t4-periksa"], ["Ajukan untuk ditinjau", "t4-ajukan"]]) {
    if (!(await tekan(G, tombol, rec, nama))) return;
  }
  harus(rec, !(await ditawarkan(G, "Setujui isi")) && !(await ditawarkan(G, "Kembalikan ke penyusun")), "the author is offered neither");
});

// ─────────────────────────────── T5–T8 · review, send-back, correction, approval
await step("T5", "the head of department finds it in «Antrean Tinjauan» and sends it back once, with a reason (W1.6)", async (rec) => {
  if (!course || !keadaan().startsWith("IN_REVIEW")) return terhalang(rec, `not in review (${course ? keadaan() : "no chapter"})`);
  const di = await masukSurel(H, mail("kabag"));
  const ke = di === "/" ? await pilihKonteks(H, { tujuan: "MENGELOLA" }) : di;
  rec.catatan.push(`the head of department (${jalanMasuk.get(mail("kabag"))}) → ${ke}`);
  await klikTautan(H, "/studio");
  await klikTautan(H, "/studio/tinjau");
  const tautan = H.locator(`a[href="/studio/paket/${course}"]`);
  if (!harus(rec, (await tautan.count()) > 0, "the queue lists the chapter")) return;
  await tautan.first().click();
  await H.waitForURL((u) => u.pathname === `/studio/paket/${course}`, { timeout: SLOW });
  await H.getByRole("heading", { name: "Langkah menuju terbit", exact: true }).waitFor({ timeout: SLOW });
  const buka = H.getByRole("button", { name: "Kembalikan ke penyusun", exact: true });
  harus(rec, (await buka.count()) > 0 && (await H.getByRole("button", { name: "Setujui isi", exact: true }).count()) > 0, "«Setujui isi» and «Kembalikan ke penyusun» are offered");
  await buka.first().click();
  const kotak = H.locator('.pin-konfirmasi textarea[name="alasan"]');
  await kotak.waitFor({ timeout: SLOW });
  harus(rec, await kotak.evaluate((el) => el === document.activeElement), "the confirmation opens with the reason box focused");
  await kotak.fill("Pendek");
  harus(rec, !(await kotak.evaluate((el) => el.checkValidity())), "a six-character reason does not pass the form");
  await kotak.fill(ALASAN_KEMBALI);
  await shot(H, "t5-kembalikan");
  const sebelum = keadaan();
  await H.locator('.pin-konfirmasi button[type="submit"]').click();
  let sesudah = sebelum;
  for (let i = 0; i < 40 && sesudah === sebelum; i++) { await H.waitForTimeout(500); sesudah = keadaan(); }
  await H.waitForLoadState("networkidle");
  await shot(H, "t5-dikembalikan");
  harus(rec, sesudah.startsWith("VALIDATION_FAILED"), `back to its author: ${sebelum} → ${sesudah}`);
  const r = sql(`select o.outcome || '|' || coalesce(o.reason, '') || '|' || u.email from public.content_review_outcomes o join public.accounts a on a.person_id = o.reviewer_person_id join auth.users u on u.id = a.auth_user_id where o.course_id = '${uuid(course)}' order by o.decided_at desc limit 1`);
  harus(rec, r.toLowerCase() === `SENT_BACK|${ALASAN_KEMBALI}|${mail("kabag")}`.toLowerCase(), "recorded: SENT_BACK, the reason, the head of department");
});

await step("T6", "the Guru reads the reason, who gave it and when (W1.8), and the way to the correction", async (rec) => {
  if (!course || !keadaan().startsWith("VALIDATION_FAILED")) return terhalang(rec, "not sent back (T5)");
  await paket(G);
  await shot(G, "t6-guru-membaca-alasan");
  const teks = norm(await G.locator("main").innerText());
  harus(rec, teks.includes(ALASAN_KEMBALI), "the reason is on the page");
  const nama = sql(`select p.display_name from public.content_review_outcomes o join public.persons p on p.id = o.reviewer_person_id where o.course_id = '${uuid(course)}' order by o.decided_at desc limit 1`);
  harus(rec, teks.toLowerCase().includes(`oleh ${nama}`.toLowerCase()), "who sent it back is named");
  harus(rec, (await G.locator('a[href*="/studio/unggah?revisi="]').count()) > 0, "a way to upload the correction");
});

await step("T7", "she uploads the corrected workbook as the next version, with what changed, and submits it again", async (rec) => {
  if (!course || !keadaan().startsWith("VALIDATION_FAILED")) return terhalang(rec, "not sent back (T5)");
  pertama = course;
  await paket(G);
  await G.locator('a[href*="/studio/unggah?revisi="]').first().click();
  await G.waitForURL((u) => u.pathname === "/studio/unggah", { timeout: SLOW });
  await G.waitForLoadState("networkidle");
  harus(rec, (await G.locator("#ung-revisi").inputValue()) === course, "the upload opens with this package chosen");
  await G.locator("#ung-ringkasan").fill(RINGKASAN);
  const r = await periksaBuku(G, tulisBerkas("bab-guru-perbaikan.xlsx", bukuGuru(false, true)));
  if (!harus(rec, r.lolos, "the corrected workbook passes the check")) return;
  await G.getByRole("button", { name: "Simpan ke Studio" }).click();
  const saved = await G.getByText("Tersimpan di Studio sebagai draf.").waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  await shot(G, "t7-perbaikan");
  harus(rec, saved, "«Tersimpan di Studio sebagai draf.»");
  const baru = sql(`select coalesce((select id::text from public.courses where supersedes_course_id = '${uuid(pertama)}' order by created_at desc limit 1), '')`);
  if (!harus(rec, !!baru, "the correction is the next version in the line")) return;
  course = baru;
  const c5 = sql(`select count(*) from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id = '${uuid(course)}' and i.stem = ${lit(SOAL_C5_SINGKAT)}`);
  harus(rec, c5 === "1", "the new version carries the shortened question C5");
  for (const [tombol, nama] of [["Tandai sudah tersusun", "t7-susun"], ["Tandai lolos pemeriksaan", "t7-periksa"], ["Ajukan untuk ditinjau", "t7-ajukan"]]) {
    if (!(await tekan(G, tombol, rec, nama))) return;
  }
});

// Batch 3 closure (defect 1): the line is one package on Studio's home, at its newest version; the replaced version is
// history, opened from «Riwayat perbaikan»
await step("T7a", "Studio's home lists the package once, at its newest version; the version the correction replaced is not a package of its own", async (rec) => {
  if (!course || !pertama || course === pertama) return terhalang(rec, "no correction (T7)");
  await G.goto(`${APP}/studio`, { waitUntil: "networkidle", timeout: SLOW });
  await shot(G, "t7a-beranda-satu-garis");
  const baris = G.locator("#paket a.pin-row").filter({ hasText: JUDUL });
  harus(rec, (await baris.count()) === 1, `the package is listed ${await baris.count()} time(s)`);
  harus(rec, (await G.locator(`#paket a[href="/studio/paket/${pertama}"]`).count()) === 0, "the replaced version is not listed as a package");
  await paket(G);
  harus(rec, (await G.locator(`#riwayat a[href="/studio/paket/${pertama}"]`).count()) > 0, "«Riwayat perbaikan» still opens the replaced version");
});

await step("T8", "the head of department approves, acknowledges the findings by kind, and creates and locks the release in one press; the author is offered neither; the head of department is not offered «Terbitkan»", async (rec) => {
  if (!course || course === pertama || !keadaan().startsWith("IN_REVIEW")) return terhalang(rec, `the correction is not in review (${course ? keadaan() : "-"})`);
  if (!(await tekan(H, "Setujui isi", rec, "t8-setujui"))) return;
  let akui = 0;
  for (let i = 0; i < 20; i++) {
    await paket(H);
    const b = H.getByRole("button", { name: /^Sudah saya tinjau( semuanya)?$/ });
    if (!(await b.count())) break;
    await b.first().click();
    await H.waitForLoadState("networkidle");
    await H.waitForTimeout(800);
    akui += 1;
  }
  const terbuka = sql(`select (select count(*) from public.mcq_quality_findings where course_id = '${uuid(course)}' and acknowledged_at is null and severity::text = 'WARNING')
    + (select count(*) from public.coaching_findings where course_id = '${uuid(course)}' and acknowledged_at is null and severity::text = 'WARNING')`);
  harus(rec, terbuka === "0", `findings acknowledged by kind in ${akui} press(es); WARNINGs left: ${terbuka}`);
  harus(rec, !(await ditawarkan(G, "Buat terbitan")) && !(await ditawarkan(G, "Kunci terbitan")), "the author is offered neither «Buat terbitan» nor «Kunci terbitan»");
  await paket(H);
  const panel = norm(await H.locator("#lt-kini").innerText().catch(() => ""));
  harus(rec, /Buat terbitan · Kunci terbitan/.test(panel), `the panel reads «${panel}»`);
  const s2 = await tekan(H, "Kunci terbitan", rec, "t8-buat-dan-kunci", { sampai: /\|FROZEN$/ });
  harus(rec, !!s2 && /\|FROZEN$/.test(s2), `one press created and locked the release (${s2})`);
  harus(rec, !(await ditawarkan(H, "Terbitkan")), "the head of department is not offered «Terbitkan»");
});

// ─────────────────────────────── T9–T11 · publication, assignment, the learner
await step("T9", "the school admin publishes («✓ Diterbitkan») and sets the line's pass mark on Konfigurasi", async (rec) => {
  if (!course || !/\|FROZEN$/.test(keadaan())) return terhalang(rec, "no locked release (T8)");
  const di = await masukSurel(A, mail("admin"));
  rec.catatan.push(`the admin (${jalanMasuk.get(mail("admin"))}) lands on ${di}`);
  await paket(A);
  await A.getByRole("button", { name: "Terbitkan", exact: true }).click();
  const sudah = await A.getByText("Diterbitkan").first().waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  for (let i = 0; i < 40 && !/\|PUBLISHED$/.test(keadaan()); i++) await A.waitForTimeout(500);
  await shot(A, "t9-diterbitkan");
  harus(rec, sudah, "the button answered «✓ Diterbitkan»");
  harus(rec, /\|PUBLISHED$/.test(keadaan()), `published (${keadaan()})`);
  const akar = pertama || course;
  await A.goto(`${APP}/konfigurasi/ketuntasan?sekolah=${S.id}&muat=${Date.now()}#ketuntasan`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(A);
  const baris = A.locator(`#ketuntasan li[data-pelajaran="${akar}"]`);
  if (!harus(rec, (await baris.count()) > 0, "Batas ketuntasan lists the chapter's line")) return;
  // B1: a record's one action opens its short form in place first
  await baris.locator("[data-buka-ubah]").click();
  await baris.locator('input[name="alasan"]').waitFor({ timeout: SLOW });
  await baris.locator('input[name="persen"]').fill("70");
  await baris.locator('input[name="alasan"]').fill("Keputusan rapat guru Golden School");
  await baris.getByRole("button", { name: "Tetapkan", exact: true }).click();
  await A.waitForURL((u) => u.searchParams.get("bagian") === "ketuntasan", { timeout: SLOW }).catch(() => {});
  const batas = sql(`select coalesce(max(m.percent)::text, '-') from public.school_pass_marks m where m.course_id = '${uuid(akar)}'
    and not exists (select 1 from public.school_pass_marks n where n.supersedes_id = m.id)`);
  harus(rec, batas === "70", `the pass mark is ${batas}%`);
});

let la = "";
await step("T10", `the Guru gives it to «${KELAS}» on Siapkan («✓ Disediakan», W3.11)`, async (rec) => {
  if (!course || !/\|PUBLISHED$/.test(keadaan())) return terhalang(rec, "not published (T9)");
  await G.goto(`${APP}/mengajar`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(G);
  await G.goto(`${APP}/mengajar/${S.kelas}/siapkan`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(G);
  const row = G.locator("a.pin-row").filter({ hasText: JUDUL }).first();
  if (!harus(rec, (await row.count()) > 0, "Siapkan offers the chapter")) return;
  await row.click();
  await G.waitForLoadState("networkidle");
  const sampai = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + 30 * 86400000));
  await G.locator("#pin-sampai").fill(sampai);
  await G.locator('form:has(input[name="terbitan"]) button[type="submit"]').first().click();
  await G.waitForURL((u) => u.searchParams.has("disediakan") || u.searchParams.has("kode"), { timeout: SLOW }).catch(() => {});
  await G.waitForLoadState("networkidle");
  const tombol = norm(await G.locator('form:has(input[name="terbitan"]) button[type="submit"]').first().innerText().catch(() => ""));
  await shot(G, "t10-disediakan");
  harus(rec, new URL(G.url()).searchParams.has("disediakan") && /✓\s*Disediakan/.test(tombol), `the button reads «${tombol}»`);
  la = sql(`select coalesce((select id::text from public.learning_assignments where course_id = '${uuid(course)}' and node_id = '${S.kelas}' order by created_at desc limit 1), '')`);
  harus(rec, !!la, "the class holds the assignment");
  // Batch 3 closure (defect 2): the card says what the class now has, never «Belum disediakan» beside «✓ Disediakan»
  const lencana = norm(await G.locator(".pin-paket .pin-prow .pin-pill").first().innerText().catch(() => ""));
  harus(rec, lencana === "Tersedia" && (await G.locator(".pin-paket .pin-prow .pin-pill.pin-ok").count()) === 1, `the card's badge reads «${lencana}»`);
  // Daisy, J1Terbit step 7: the way on is the class, whose «Materi untuk kelas ini» lists it «✓ Tersedia» with its window
  await G.locator(`main a.pin-btn[href="/mengajar/${S.kelas}"]`).first().click();
  await G.waitForURL((u) => u.pathname === `/mengajar/${S.kelas}`, { timeout: SLOW });
  await G.waitForLoadState("networkidle");
  const materi = G.locator(".pin-sec", { has: G.getByRole("heading", { name: "Materi untuk kelas ini" }) }).locator(".pin-row").filter({ hasText: JUDUL });
  await materi.first().scrollIntoViewIfNeeded().catch(() => {});
  await shot(G, "t10-kelas-tersedia");
  const barisMateri = norm(await materi.first().innerText().catch(() => ""));
  harus(rec, (await materi.locator(".pin-pill.pin-ok").count()) === 1 && /Tersedia/.test(barisMateri) && /Mulai .+ Sampai /.test(barisMateri),
    `the class page lists it «${barisMateri}»`);
});

// F-7 (owner ruling, 2 Nov, Batch 3 closure; QN5, J4.8): the teacher who authors browses her school's bank, with keys and
// reasons; Question Health inside it stays the reviewer's (no review form)
await step("T10b", "the Guru opens Studio → «Bank Soal» by clicking: her school's questions with their keys and reasons, and no Question Health (F-7)", async (rec) => {
  if (!course) return terhalang(rec, "no package (T3)");
  await G.goto(`${APP}/studio`, { waitUntil: "networkidle", timeout: SLOW });
  const tab = G.getByRole("link", { name: "Bank Soal" }).first();
  if (!harus(rec, (await tab.count()) > 0, "Studio offers the Guru «Bank Soal»")) return;
  await tab.click();
  await G.waitForURL((u) => u.pathname === "/studio/bank", { timeout: SLOW });
  await G.getByRole("heading", { name: "Bank Soal", exact: true }).waitFor({ timeout: SLOW }).catch(() => {});
  await G.locator("main li[data-soal]").first().waitFor({ timeout: SLOW }).catch(() => {});
  await shot(G, "t10b-bank-guru");
  const ids = (await G.locator("main li[data-soal]").evaluateAll((els) => els.map((e) => e.getAttribute("data-soal")))).filter(Boolean);
  const asing = ids.length ? sql(`select count(*) from public.items where left(id::text, 8) = any(string_to_array('${ids.join(",")}', ',')) and institution_id <> '${S.id}'`) : "0";
  harus(rec, ids.length > 0 && asing === "0", `${ids.length} question(s) listed, ${asing} of another school`);
  harus(rec, (await G.locator("main .pin-opsi-kunci").count()) > 0, "a question shows its key and reasons");
  harus(rec, (await G.locator('main form select[name="keputusan"]').count()) === 0, "no Question Health review form");
});

let kartu = null;
await step("T11", `the school admin re-issues ${PELAJAR.split(" ")[0]}'s damaged card; the learner signs in with it, finds the chapter on Belajar and opens it`, async (rec) => {
  if (!la) return terhalang(rec, "not given to the class (T10)");
  await A.goto(`${APP}/konfigurasi`, { waitUntil: "networkidle", timeout: SLOW });
  await klikTautan(A, "/aktivasi");
  const bagian = A.locator('section[aria-labelledby="pin-akt-ulang"]');
  await bagian.waitFor({ timeout: SLOW });
  await bagian.locator('input[type="search"]').fill(PELAJAR);
  const baris = bagian.locator("ul.pin-lap-baris > li").filter({ hasText: PELAJAR });
  await baris.first().waitFor({ timeout: SLOW });
  await baris.getByRole("button", { name: "Terbitkan kartu baru", exact: true }).click();
  await baris.getByRole("radio", { name: "Kartunya rusak" }).check();
  await baris.getByRole("button", { name: "Ya, terbitkan kartu baru", exact: true }).click();
  const lembar = bagian.locator("li.pin-akt-kartu").filter({ hasText: PELAJAR });
  await lembar.waitFor({ timeout: SLOW });
  const [number, pin] = await lembar.locator("dd.pin-num").evaluateAll((ds) => ds.map((d) => (d.textContent ?? "").trim()));
  if (!harus(rec, /^\d{10}$/.test(number ?? "") && /^\d{6}$/.test(pin ?? ""), "the new card's sheet reads as a card (not recorded)")) return;
  kartu = { number: tutupi(number), pin: tutupi(pin) };
  await M.goto(`${APP}/masuk`, { waitUntil: "networkidle", timeout: SLOW });
  await M.getByRole("button", { name: "Gunakan kartu kelas" }).click();
  await M.locator("#kartu").fill(kartu.number);
  await M.locator("#pin").fill(kartu.pin);
  await M.getByRole("button", { name: "Masuk dengan kartu" }).click();
  await M.waitForURL((u) => u.pathname !== "/masuk" && u.pathname !== "/masuk/kartu", { timeout: SLOW });
  await M.goto(`${APP}/belajar`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(M);
  const tautan = M.locator(`a[href*="/belajar/${la}"]`);
  if (!harus(rec, (await tautan.count()) > 0, "Belajar offers the chapter")) return;
  await tautan.first().click();
  await M.waitForURL((u) => u.pathname.startsWith(`/belajar/${la}`), { timeout: SLOW });
  await M.waitForFunction(() => !/Memuat halaman/.test(document.querySelector("main")?.innerText ?? "Memuat halaman"), null, { timeout: SLOW }).catch(() => {});
  await closeTour(M);
  await shot(M, "t11-bab-dibuka");
  const teks = norm(await M.locator("main").innerText().catch(() => ""));
  harus(rec, /kelipatan bilangan/i.test(teks) && /Pemetaan Awal/.test(teks), `the chapter opens at its Pemetaan Awal (${new URL(M.url()).pathname.replace(la, "<penugasan>")})`);
  harus(rec, !/Kunci|Alasan:/.test(teks), "no key or reason is shown to the learner");
});

await step("T12", "«Riwayat perbaikan» names the send-back with its reason, the correction and the approval, with who and when", async (rec) => {
  if (!course || course === pertama) return terhalang(rec, "no correction (T7)");
  await paket(G);
  const r = norm(await G.locator("#riwayat").innerText().catch(() => ""));
  await G.locator("#riwayat").scrollIntoViewIfNeeded().catch(() => {});
  await shot(G, "t12-riwayat");
  const nama = sql(`select string_agg(distinct p.display_name, '|') from public.content_review_outcomes o join public.persons p on p.id = o.reviewer_person_id where o.course_id in ('${uuid(pertama)}', '${uuid(course)}')`);
  harus(rec, /Dikembalikan ke penyusun/.test(r) && r.includes(ALASAN_KEMBALI) && /Disetujui/.test(r), "both outcomes, and the reason");
  harus(rec, nama.split("|").every((n) => r.includes(n)), "the reviewer is named");
  harus(rec, r.includes(RINGKASAN), "the correction's own summary");
});

// ─────────────────────────────── T13–T15 · Uji Cepat at Level 3 (W6.7)
const KUNCI_SOAL = new Map([
  ["Bilangan manakah yang termasuk kelipatan 4?", "16"],
  ["Kelipatan 5 yang keempat adalah ....", "20"],
  ["Kelipatan persekutuan terkecil dari 3 dan 4 adalah ....", "12"],
  ["Tiga kelipatan 6 yang pertama adalah ....", "6, 12, 18"],
  [SOAL_C5_SINGKAT, "10"],
]);
let ujiCepat = "";
await step("T13", `W6.7: the Guru launches an Uji Cepat of three of the chapter's questions for «${KELAS}»`, async (rec) => {
  if (!la) return terhalang(rec, "not given to the class (T10)");
  const modul = sql(`select id from public.modules where course_id = '${uuid(course)}' order by ordinal limit 1`);
  await G.goto(`${APP}/mengajar/${S.kelas}/uji-cepat`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(G);
  if (!harus(rec, !/Uji Cepat sedang berjalan/.test(norm(await G.locator("main").innerText())), "no Uji Cepat is already running")) return;
  await G.locator("#pin-bab").selectOption(modul);
  await G.getByRole("button", { name: "Tampilkan soal bab ini", exact: true }).click();
  await G.waitForURL((u) => u.searchParams.get("bab") === modul, { timeout: SLOW });
  await G.waitForLoadState("networkidle");
  const baris = G.locator("ol.pin-cepat-pilih > li");
  const n = await baris.count();
  harus(rec, (await G.locator("ol.pin-cepat-pilih .pin-opsi-kunci").count()) === 0, `${n} question(s) offered, no key shown`);
  for (let i = 0; i < 3 && i < n; i++) await baris.nth(i).locator('input[type="checkbox"][name="butir"]').check();
  await G.getByRole("button", { name: "Lanjut ke tinjauan", exact: true }).click();
  await G.waitForURL((u) => u.searchParams.get("tahap") === "tinjau", { timeout: SLOW });
  await G.getByRole("button", { name: "Sediakan Uji Cepat sekarang", exact: true }).click();
  const jalan = await G.getByText("Uji Cepat sedang berjalan").first().waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  await shot(G, "t13-uji-cepat");
  ujiCepat = sql(`select coalesce((select aa.id::text from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
    where aa.node_id = '${S.kelas}' and d.mode::text = 'QUICK' order by aa.created_at desc limit 1), '')`);
  harus(rec, jalan && !!ujiCepat, "«Uji Cepat sedang berjalan»");
});

await step("T14", "W6.7: the learner hands it in; no certificate comes of it (J5.7)", async (rec) => {
  if (!ujiCepat || !kartu) return terhalang(rec, !ujiCepat ? "no Uji Cepat (T13)" : "the learner did not sign in (T11)");
  await M.goto(`${APP}/belajar`, { waitUntil: "networkidle", timeout: SLOW });
  await closeTour(M);
  const tautan = M.locator(`a[href="/belajar/asesmen/${ujiCepat}"]`);
  if (!harus(rec, (await tautan.count()) > 0, "Belajar offers the Uji Cepat")) return;
  await tautan.first().click();
  await M.waitForURL((u) => u.pathname === `/belajar/asesmen/${ujiCepat}`, { timeout: SLOW });
  await M.locator("main button[type=submit].pin-primary").first().click();
  let dijawab = 0;
  for (let i = 0; i < 10; i++) {
    const stem = M.locator("h2.pin-stem").first();
    await stem.waitFor({ state: "visible", timeout: SLOW });
    const raw = await stem.innerText();
    const benar = KUNCI_SOAL.get(norm(raw));
    const opts = M.locator("ul.pin-opsi button.pin-op");
    let idx = 0;
    for (let j = 0; j < await opts.count(); j++) if (norm(await opts.nth(j).locator("span").nth(1).innerText()) === benar) idx = j;
    await opts.nth(idx).click();
    const simpan = M.getByRole("button", { name: /^(Kunci|Simpan) jawaban ini$/ });
    if (await simpan.count()) { await simpan.click(); await M.getByRole("button", { name: "Tersimpan", exact: true }).waitFor({ timeout: SLOW }); }
    dijawab += 1;
    const next = M.getByRole("button", { name: "Berikutnya", exact: true });
    if (await next.count()) {
      await next.click();
      await M.waitForFunction((prev) => document.querySelector("h2.pin-stem")?.innerText !== prev, raw, { timeout: SLOW });
      continue;
    }
    await M.getByRole("button", { name: "Kumpulkan", exact: true }).click();
    const tanya = M.locator('[aria-labelledby="kumpulkan-tanya"]');
    if (await tanya.waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false)) await tanya.getByRole("button", { name: "Kumpulkan", exact: true }).click();
    await M.waitForURL((u) => u.pathname.endsWith("/hasil") || u.pathname === "/belajar", { timeout: 60000 });
    break;
  }
  await M.waitForLoadState("networkidle");
  await shot(M, "t14-dikumpulkan");
  const selesai = sql(`select count(*) from public.assessment_sessions s where s.assessment_assignment_id = '${uuid(ujiCepat)}' and s.submitted_at is not null`);
  harus(rec, dijawab === 3 && selesai === "1", `answered ${dijawab}, handed in ${selesai}`);
  const sertifikat = sql(`select count(*) from public.certificates c join public.assessment_sessions s on s.id = c.session_id where s.assessment_assignment_id = '${uuid(ujiCepat)}'`);
  const teks = norm(await M.locator("main").innerText().catch(() => ""));
  // the page's own content, not the learner's menu: a learner who already holds a certificate (GS-15) is offered
  // «Sertifikat» there, whatever this Uji Cepat did
  const tautanSertifikat = await M.locator('main a[href*="/sertifikat"]').count();
  harus(rec, sertifikat === "0", `no certificate for the Uji Cepat in the database (${sertifikat})`);
  harus(rec, !/sertifikat/i.test(teks) && tautanSertifikat === 0, `the page the learner lands on names or links no certificate (${tautanSertifikat} link(s) in its content)`);
});

await step("T15", "W6.7: «Lihat hasil»: the class figure on its base first, the learner one step below (W2.4)", async (rec) => {
  if (!ujiCepat) return terhalang(rec, "no Uji Cepat (T13)");
  await G.goto(`${APP}/mengajar/${S.kelas}/uji-cepat`, { waitUntil: "networkidle", timeout: SLOW });
  const lihat = G.locator(`a[href="/mengajar/${S.kelas}/uji-cepat/hasil?penugasan=${ujiCepat}"]`).first();
  if (!harus(rec, (await lihat.count()) > 0, "the running Uji Cepat leads to «Lihat hasil»")) return;
  await lihat.click();
  await G.waitForURL((u) => u.pathname.endsWith("/uji-cepat/hasil"), { timeout: SLOW });
  await G.waitForLoadState("networkidle");
  await shot(G, "t15-hasil");
  const kelas = G.locator(".pin-cepat-kelas");
  const dinilai = await kelas.getAttribute("data-dinilai").catch(() => null);
  const terdaftar = await kelas.getAttribute("data-terdaftar").catch(() => null);
  const teksKelas = norm(await kelas.innerText().catch(() => ""));
  rec.catatan.push(`the class figure reads «${teksKelas}»`);
  harus(rec, dinilai === "1" && (await kelas.getAttribute("data-ambang").catch(() => null)) === "5" && !/%/.test(teksKelas) && /Sekarang 1 murid; perlu 5/.test(teksKelas) && new RegExp(`1 dari ${terdaftar} murid`).test(teksKelas), `D-176: one score of ${terdaftar} is below the threshold of five — no class average, the not-yet line «Sekarang 1 murid; perlu 5» and the base`);
  const halaman = norm(await G.locator("main").innerText());
  const angkaDi = halaman.indexOf("Rata-rata nilai kelas");   // hle mengajar.cepat.hasil.kelas
  harus(rec, halaman.includes(PELAJAR) && angkaDi !== -1 && angkaDi < halaman.indexOf(PELAJAR), "the learner is listed below the figure");
});

// ─────────────────────────────── T16 · who the history may name (read only)
// Each call runs as the reader (their Auth id as PostgREST would carry it, role authenticated, or anon) inside a
// read-only transaction that writes nothing and ends in a rollback.
const sebagai = (email, q) => {
  const uid = email ? sql(`select id from auth.users where lower(email) = lower(${lit(email)}) limit 1`) : "";
  if (email && !uid) throw new Error(`no Auth user for ${email}`);
  const peran = email ? "authenticated" : "anon";
  const klaim = email ? `{"sub":"${uuid(uid)}","role":"authenticated"}` : `{"role":"anon"}`;
  return execFileSync("psql", [DB, "-qAt", "-v", "ON_ERROR_STOP=1",
    "-c", "begin transaction read only",
    "-c", `select set_config('request.jwt.claims', ${lit(klaim)}, true), set_config('request.jwt.claim.sub', ${lit(uid)}, true)`,
    "-c", `set local role ${peran}`,
    "-c", q, "-c", "rollback"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim().split("\n").filter((l) => l !== "" && !/^\s*$/.test(l)).slice(1).join("\n");
};
await step("T16", "read only: nama_riwayat_paket tells the author the reviewer, and tells the same school's Dekan, another school's administrator and an anonymous caller nobody", async (rec) => {
  if (!pertama || !course) return terhalang(rec, "no reviewed package (T5–T8)");
  const panggil = `select count(*) filter (where x.person_id is not null) || '|' || count(*) filter (where x.person_id not in (select o.reviewer_person_id from public.content_review_outcomes o where o.course_id in ('${uuid(pertama)}', '${uuid(course)}') union select n.written_by_person_id from public.course_revision_notes n where n.course_id in ('${uuid(pertama)}', '${uuid(course)}') and n.written_by_person_id is not null)) from public.nama_riwayat_paket(array['${uuid(pertama)}', '${uuid(course)}']::uuid[]) x`;
  const kabag = sql(`select a.person_id from public.accounts a join auth.users u on u.id = a.auth_user_id where lower(u.email) = lower(${lit(mail("kabag"))}) limit 1`);
  const namaKabag = (email) => sebagai(email, `select count(*) from public.nama_riwayat_paket(array['${uuid(pertama)}', '${uuid(course)}']::uuid[]) x where x.person_id = '${uuid(kabag)}'`);
  const guru = sebagai(mail("guru"), panggil).split("|");
  harus(rec, Number(guru[0]) >= 1 && guru[1] === "0" && namaKabag(mail("guru")) === "1", `the author is told ${guru[0]} name(s), the reviewer among them, none beyond the package`);
  const guruBaris = sebagai(mail("guru"), `select count(*) from public.persons p where p.id = '${uuid(kabag)}'`);
  rec.catatan.push(`the author reading the reviewer's person row directly: ${guruBaris} row(s)`);
  harus(rec, sebagai(mail("dekan"), panggil).split("|")[0] === "0", "the same school's Dekan (no Studio capability) is told nobody");
  if (SEKOLAH_LAIN) {
    const lain = `goldenschool+${SEKOLAH_LAIN}-admin@pintarselalu.com`;
    harus(rec, sebagai(lain, panggil).split("|")[0] === "0", `another school's administrator («${SEKOLAH_LAIN}») is told nobody`);
  } else rec.catatan.push("another school's administrator: not checked (GS_OTHER_SLUG not given)");
  let anon = "";
  try { anon = sebagai(null, panggil); } catch (e) { anon = String(e.stderr ?? e.message ?? e); }
  harus(rec, /permission denied/i.test(anon), "an anonymous caller is refused");
});

// ─────────────────────────────── the record
await browser.close();
const tally = hasil.reduce((t, r) => ({ ...t, [r.verdict]: (t[r.verdict] ?? 0) + 1 }), {});
writeFileSync(join(OUT, "golden-school-studio.json"), JSON.stringify({ sekolah: SLUG, judul: JUDUL, hasil }, null, 2));
log(`TALLY ${JSON.stringify(tally)}`);
const merah = hasil.filter((r) => r.verdict !== "PASS");
if (merah.length) { log(`RED: ${merah.map((r) => `${r.id} ${r.verdict}`).join(", ")}`); process.exit(1); }
log("GREEN");
