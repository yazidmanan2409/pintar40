// W6.5 · STUDIO END TO END, LOCALLY (Batch 3). The whole Studio path by the screens, in the seeded world, with four
// people of one school (the seeded official «PINTAR Bootstrap» school, development and CI only):
//
//   the author   a Guru (EDUCATOR of Kelas 5B), who writes a chapter that was never imported anywhere: the example
//                workbook Studio offers («Unduh contoh isian», W1.10), made her own (a new title, no «Contoh — » mark);
//   the reviewer the head of department (Matematika);
//   the publisher the school admin;
//   the learner  a learner of Kelas 5B.
//
// The path, every step pressed on a screen and every outcome read back from the database:
//   1. the Guru's first upload FAILS at the check, row by row (a question's difficulty is not one the column allows),
//      and nothing is saved; she fixes the row and the check passes; she saves it to Studio as a draft;
//   2. she takes it through «Tandai sudah tersusun», «Tandai lolos pemeriksaan», «Ajukan untuk ditinjau»;
//   3. the head of department sends it back ONCE with a reason («Kembalikan ke penyusun», W1.6); the Guru reads the
//      reason on her package page; she corrects the workbook and uploads it as the correction in the same line, and
//      submits again;
//   4. the head of department approves the content, then creates and locks the release (one press, W1.4); the author
//      is offered none of these steps; the head of department is refused «Terbitkan» (CAN_PUBLISH is the admin's);
//   5. the school admin publishes the chapter («Terbitkan» → «✓ Diterbitkan») and sets its pass mark;
//   6. the Guru gives it to Kelas 5B on Siapkan («✓ Disediakan», W3.11);
//   7. the learner finds it on Belajar and opens it;
//   8. W6.7, Uji Cepat at Level 3: the Guru launches an Uji Cepat of three of the chapter's questions in 5B, the
//      learner sits it, and the Guru reads the score page: the class figure first, on its base («n dari N murid sudah
//      dinilai»), then each learner one step below, the figure the learner was given.
// «Riwayat perbaikan» must then name the send-back with its reason and the approval, with who and when (W1.8).
//
// Synthetic content only (F-4): the example's own made-up chapter. Runs against a local stack, never staging or
// production. Writes a JSON record and screenshots to OUT_DIR, and exits 1 when any step fails.

import { chromium } from "playwright";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ubahBuku, ubahBaris, xmlTeks } from "./buku-kerja.mjs";

const APP = process.env.APP_URL ?? "http://127.0.0.1:3999";
const SB = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DB = process.env.SUPABASE_DB_URL;
const OUT = process.env.OUT_DIR ?? "audit-out/studio-ujung";
const SLOW = 30000;
const require = createRequire(join(process.env.APP_DIR ?? process.cwd(), "package.json"));
const { createServerClient } = require("@supabase/ssr");

// seed constants (supabase/seed), not secrets. The seeded OFFICIAL school («PINTAR Bootstrap», development and CI
// only): a learner's result there is official evidence, so W6.7's score page has a figure to show (in a synthetic
// school every result is SYNTHETIC and learner.result, rightly, gives none)
const ORANG = {
  guru: { key: "guru", tujuan: "MENGAJAR", email: "boot-guru@bootstrap.pintar.test", password: "Bootstrap-Guru-7741!" },
  kaprodi: { key: "kaprodi", tujuan: "MENGELOLA", email: "boot-kaprodi@bootstrap.pintar.test", password: "Bootstrap-Kaprodi-5528!" },
  admin: { key: "admin", tujuan: "MENGELOLA", email: "boot-admin@bootstrap.pintar.test", password: "Bootstrap-Admin-9163!" },
  murid: { key: "murid", tujuan: "BELAJAR", email: "boot-siswa@bootstrap.pintar.test", password: "Bootstrap-Siswa-3082!" },
};
// the chapter's own title: never imported anywhere, unique in the database for this run
const JUDUL = `Matematika Kelas 4 · Kelipatan Bilangan (disusun guru ${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")})`;
const ALASAN_KEMBALI = "Soal C5 terlalu panjang untuk murid kelas 4; mohon dipersingkat kalimatnya.";

mkdirSync(OUT, { recursive: true });
const sql = (q) => execFileSync("psql", [DB, "-At", "-v", "ON_ERROR_STOP=1", "-c", q], { encoding: "utf8" }).trim();
const esc = (s) => s.replace(/'/g, "''");
const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();

const langkah = [];
let gagal = false;
async function step(id, judul, fn) {
  const rec = { id, judul, verdict: "PASS", catatan: [], shots: [] };
  try {
    await fn(rec);
  } catch (e) {
    rec.verdict = "FAIL";
    rec.catatan.push(`error: ${String(e.message ?? e).split("\n")[0].slice(0, 300)}`);
  }
  if (rec.verdict !== "PASS") gagal = true;
  langkah.push(rec);
  console.log(`${rec.verdict.padEnd(5)} ${id} ${judul}\n      ${rec.catatan.join("\n      ")}`);
  return rec.verdict === "PASS";
}
const harus = (rec, ok, kata) => { rec.catatan.push(`${ok ? "ok" : "!!"} ${kata}`); if (!ok) rec.verdict = "FAIL"; return ok; };
async function shot(page, rec, nama) {
  const f = `${String(langkah.length + 1).padStart(2, "0")}-${nama}.png`;
  await page.screenshot({ path: join(OUT, f), fullPage: true }).catch(() => null);
  rec.shots.push(f);
}

async function cookies(p) {
  const jar = new Map();
  const client = createServerClient(SB, ANON, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => jar.set(name, value)) },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: p.email, password: p.password });
  if (error || !data.session) throw new Error(`sign-in failed for ${p.key}: ${error?.message ?? "no session"}`);
  const host = new URL(APP).hostname;
  return [...jar].map(([name, value]) => ({ name, value, domain: host, path: "/", httpOnly: false, secure: false, sameSite: "Lax" }));
}

// signed in as the person does it, then «Komputer pribadi saya» and the person's own door on the chooser
async function masuk(browser, p) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "id-ID", timezoneId: "Asia/Jakarta", acceptDownloads: true });
  await context.addCookies(await cookies(p));
  const page = await context.newPage();
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  if (new URL(page.url()).pathname === "/perangkat") {
    await page.locator('input[type="radio"][name="mode"][value="PERSONAL"]').check();
    await page.getByRole("button", { name: "Simpan pilihan" }).click();
    await page.waitForURL((u) => u.pathname !== "/perangkat", { timeout: SLOW }).catch(() => {});
    await page.waitForLoadState("networkidle");
  }
  await pilihPintu(page, p.tujuan);
  return { context, page };
}
async function pilihPintu(page, tujuan) {
  await page.goto(`${APP}/`, { waitUntil: "networkidle" });
  const pintu = page.locator('[data-pemilih="konteks"] button[data-konteks]');
  if (!(await pintu.count())) return;
  const kunci = await pintu.evaluateAll((bs) => bs.map((b) => b.getAttribute("data-konteks")));
  const pilih = kunci.find((k) => k === tujuan) ?? kunci.find((k) => k.split(":")[0] === tujuan) ?? kunci[0];
  await page.locator(`[data-pemilih="konteks"] button[data-konteks="${pilih}"]`).click();
  await page.waitForURL((u) => u.pathname !== "/", { timeout: SLOW }).catch(() => {});
  await page.waitForLoadState("networkidle");
}
async function tutupTur(page) {
  const lewati = page.getByRole("button", { name: /Lewati|Tutup tur|Selesai/ }).first();
  if (await lewati.isVisible().catch(() => false)) await lewati.click().catch(() => {});
}

// the workbook: read and rewritten in place (audit/buku-kerja.mjs)

// ═══════════════════════════════════════════════════════════════════════════ the walk
const browser = await chromium.launch();
const sesi = {};
for (const [k, p] of Object.entries(ORANG)) sesi[k] = await masuk(browser, p);
const { page: g } = sesi.guru;

let buku = null;
await step("U0", "the Guru opens Studio → Unggah and downloads «Unduh contoh isian»", async (rec) => {
  await g.goto(`${APP}/studio/unggah`, { waitUntil: "networkidle" });
  await shot(g, rec, "unggah");
  const tombol = g.getByRole("button", { name: "Unduh contoh isian" });
  harus(rec, (await tombol.count()) === 1, "Unggah offers «Unduh contoh isian»");
  const [unduh] = await Promise.all([g.waitForEvent("download", { timeout: SLOW }), tombol.click()]);
  buku = readFileSync(await unduh.path());
  harus(rec, buku.length > 1000 && buku.readUInt32LE(0) === 0x04034b50, `downloaded ${unduh.suggestedFilename()} (${buku.length} bytes)`);
});

const JUDUL_CONTOH = "Contoh — Matematika Kelas 4 · Kelipatan Bilangan";
const SOAL_C5 = "Lampu merah menyala setiap 2 menit dan lampu hijau setiap 5 menit. Keduanya menyala bersama pada menit ke-0. Pada menit ke berapa keduanya menyala bersama lagi?";
const SOAL_C5_SINGKAT = "Lampu merah menyala tiap 2 menit, lampu hijau tiap 5 menit. Mulai bersama, kapan menyala bersama lagi?";
const bukuGuru = (rusak, dikoreksi = false) => ubahBuku(buku, (lembar, xml) => {
  let x = xml.split(`>${xmlTeks(JUDUL_CONTOH)}</t>`).join(`>${xmlTeks(JUDUL)}</t>`);
  // the correction the reviewer asked for: question C5's sentence, shorter
  if (dikoreksi && lembar === "Soal") x = x.split(`>${xmlTeks(SOAL_C5)}</t>`).join(`>${xmlTeks(SOAL_C5_SINGKAT)}</t>`);
  // the mistake: question C1's difficulty is not one the column allows
  if (rusak && lembar === "Soal") x = ubahBaris(x, "C1", "Mudah", "Gampang");
  return x;
});
const kursusIni = () => sql(`select coalesce((select id::text from public.courses where title='${esc(JUDUL)}' order by created_at desc limit 1), '')`);
const tulisBerkas = (nama, b) => { const f = join(OUT, nama); writeFileSync(f, b); return f; };

async function periksaBuku(page, berkas) {
  await page.goto(`${APP}/studio/unggah`, { waitUntil: "networkidle" });
  await page.locator("#ung-berkas").setInputFiles(berkas);
  await page.getByRole("button", { name: "Periksa buku kerja" }).click();
  const lolos = page.getByText("Buku kerja lolos pemeriksaan.");
  await Promise.race([lolos.waitFor({ timeout: SLOW }).catch(() => {}), page.waitForTimeout(8000)]);
  return { lolos: await lolos.isVisible().catch(() => false), teks: norm(await page.locator("main").innerText().catch(() => "")) };
}

await step("U1", "the Guru's first upload fails at the check, row by row, and nothing is saved", async (rec) => {
  const sebelum = sql(`select count(*) from public.courses where title='${esc(JUDUL)}'`);
  const r = await periksaBuku(g, tulisBerkas("bab-guru-salah.xlsx", bukuGuru(true)));
  await shot(g, rec, "periksa-gagal");
  harus(rec, !r.lolos, "the check does not pass");
  const i = r.teks.indexOf("Paket ini belum bisa diterima");
  rec.catatan.push(`the page says: ${r.teks.slice(Math.max(0, i), i + 260)}`);
  harus(rec, /Lembar Soal, baris 2, kolom Tingkat kesulitan/.test(r.teks), "the refusal names the sheet, the row and the column (Soal, row 2, Tingkat kesulitan)");
  harus(rec, /Belum ada yang disimpan/.test(r.teks), "the page says nothing was saved");
  harus(rec, (await g.getByRole("button", { name: "Simpan ke Studio" }).count()) === 0 || !(await g.getByRole("button", { name: "Simpan ke Studio" }).isEnabled()), "nothing can be saved");
  harus(rec, sql(`select count(*) from public.courses where title='${esc(JUDUL)}'`) === sebelum, "no course was made");
});

let course = "";
const keadaan = () => sql(`select c.status || '|' || coalesce((select r.status::text from public.plp_releases r where r.course_id = c.id order by r.created_at desc limit 1), '-') from public.courses c where c.id='${course}'`);
await step("U2", "the Guru fixes the row; the check passes and the chapter is saved to Studio as a draft", async (rec) => {
  const r = await periksaBuku(g, tulisBerkas("bab-guru.xlsx", bukuGuru(false)));
  harus(rec, r.lolos, "«Buku kerja lolos pemeriksaan.»");
  await shot(g, rec, "periksa-lolos");
  await g.getByRole("button", { name: "Simpan ke Studio" }).click();
  const saved = await g.getByText("Tersimpan di Studio sebagai draf.").waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  await shot(g, rec, "tersimpan");
  harus(rec, saved, "«Tersimpan di Studio sebagai draf.»");
  course = kursusIni();
  harus(rec, !!course, `the course exists (${course || "none"}), state ${course ? keadaan() : "-"}`);
  const penyusun = sql(`select coalesce((select p.display_name from public.courses c join public.persons p on p.id = c.author_person_id where c.id='${course}'), '-')`);
  harus(rec, penyusun === sql(`select p.display_name from public.persons p join public.accounts a on a.person_id = p.id join auth.users u on u.id = a.auth_user_id where u.email='${ORANG.guru.email}'`), `its author is the Guru (${penyusun})`);
});

// press a step's button on the package page as `page`; the state it moved to (or null)
async function tekan(page, tombol, rec, nama) {
  await page.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
  const btn = page.getByRole("button", { name: tombol, exact: true });
  if (!(await btn.count())) { harus(rec, false, `«${tombol}» is offered (state ${keadaan()})`); return null; }
  const sebelum = keadaan();
  await btn.first().click();
  let sesudah = sebelum;
  for (let i = 0; i < 40 && sesudah === sebelum; i++) { await page.waitForTimeout(500); sesudah = keadaan(); }
  await page.waitForLoadState("networkidle");
  await shot(page, rec, nama);
  harus(rec, sesudah !== sebelum, `«${tombol}»: ${sebelum} → ${sesudah}`);
  return sesudah !== sebelum ? sesudah : null;
}
const ditawarkan = async (page, tombol) => {
  await page.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
  return (await page.getByRole("button", { name: tombol, exact: true }).count()) > 0;
};

await step("U3", "the Guru takes her draft to review: «Tandai sudah tersusun», «Tandai lolos pemeriksaan», «Ajukan untuk ditinjau»", async (rec) => {
  if (!course) { rec.verdict = "BLOCKED"; return; }
  for (const [tombol, nama] of [["Tandai sudah tersusun", "susun"], ["Tandai lolos pemeriksaan", "periksa"], ["Ajukan untuk ditinjau", "ajukan"]]) {
    if (!(await tekan(g, tombol, rec, nama))) return;
  }
  harus(rec, !(await ditawarkan(g, "Setujui isi")) && !(await ditawarkan(g, "Kembalikan ke penyusun")), "the author is offered neither «Setujui isi» nor «Kembalikan ke penyusun»");
});

const { page: h } = sesi.kaprodi;
await step("U4", "the head of department sends it back once, with a reason («Kembalikan ke penyusun»)", async (rec) => {
  if (!course || !keadaan().startsWith("IN_REVIEW")) { rec.verdict = "BLOCKED"; return; }
  await h.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
  const buka = h.getByRole("button", { name: "Kembalikan ke penyusun", exact: true });
  harus(rec, (await buka.count()) > 0 && (await h.getByRole("button", { name: "Setujui isi", exact: true }).count()) > 0, "the reviewer is offered «Setujui isi» and «Kembalikan ke penyusun»");
  await buka.first().click();
  const kotak = h.locator('.pin-konfirmasi textarea[name="alasan"]');
  await kotak.waitFor({ timeout: SLOW });
  harus(rec, await kotak.evaluate((el) => el === document.activeElement), "the confirmation opens with the reason box focused");
  // a reason under ten characters is refused by the form itself
  await kotak.fill("Pendek");
  harus(rec, !(await kotak.evaluate((el) => el.checkValidity())), "a six-character reason does not pass the form");
  await kotak.fill(ALASAN_KEMBALI);
  await shot(h, rec, "kembalikan-konfirmasi");
  const sebelum = keadaan();
  await h.locator('.pin-konfirmasi button[type="submit"]').click();
  let sesudah = sebelum;
  for (let i = 0; i < 40 && sesudah === sebelum; i++) { await h.waitForTimeout(500); sesudah = keadaan(); }
  await h.waitForLoadState("networkidle");
  await shot(h, rec, "dikembalikan");
  harus(rec, sesudah.startsWith("VALIDATION_FAILED"), `the package went back to its author: ${sebelum} → ${sesudah}`);
  const hasil = sql(`select o.outcome || '|' || coalesce(o.reason, '') || '|' || p.display_name from public.content_review_outcomes o join public.persons p on p.id = o.reviewer_person_id where o.course_id='${course}' order by o.decided_at desc limit 1`);
  harus(rec, hasil.startsWith(`SENT_BACK|${ALASAN_KEMBALI}|`), `recorded: ${hasil}`);
});

await step("U5", "the Guru reads the reason on her package page, with who and when, and the way to upload the correction", async (rec) => {
  await g.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
  await shot(g, rec, "guru-membaca-alasan");
  const teks = norm(await g.locator("main").innerText());
  harus(rec, teks.includes(ALASAN_KEMBALI), "the reason is on the page");
  const peninjau = sql(`select p.display_name from public.content_review_outcomes o join public.persons p on p.id = o.reviewer_person_id where o.course_id='${course}' order by o.decided_at desc limit 1`);
  harus(rec, new RegExp(`oleh ${peninjau.replace(/[()]/g, "\\$&")}`, "i").test(teks), `who sent it back is named («oleh ${peninjau}»)`);
  const jalan = g.locator('a[href*="/studio/unggah?revisi="]');
  harus(rec, (await jalan.count()) > 0, `a link to upload the correction (${await jalan.first().getAttribute("href").catch(() => "-")})`);
  rec.catatan.push(`the page says: ${teks.slice(Math.max(0, teks.indexOf(ALASAN_KEMBALI) - 200), teks.indexOf(ALASAN_KEMBALI) + 260)}`);
});

let pertama = "";
await step("U6", "the Guru uploads the corrected workbook as the next version of the same package, with what changed", async (rec) => {
  if (!course || !keadaan().startsWith("VALIDATION_FAILED")) { rec.verdict = "BLOCKED"; return; }
  pertama = course;
  await g.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
  await g.locator('a[href*="/studio/unggah?revisi="]').first().click();
  await g.waitForURL((u) => u.pathname === "/studio/unggah", { timeout: SLOW });
  await g.waitForLoadState("networkidle");
  harus(rec, (await g.locator("#ung-revisi").inputValue()) === course, "the upload opens with this package chosen as the one corrected");
  await g.locator("#ung-berkas").setInputFiles(tulisBerkas("bab-guru-perbaikan.xlsx", bukuGuru(false, true)));
  await g.locator("#ung-ringkasan").fill("Soal C5 dipersingkat sesuai catatan peninjau.");
  await g.getByRole("button", { name: "Periksa buku kerja" }).click();
  const lolos = await g.getByText("Buku kerja lolos pemeriksaan.").waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  harus(rec, lolos, "the corrected workbook passes the check");
  await g.getByRole("button", { name: "Simpan ke Studio" }).click();
  const saved = await g.getByText("Tersimpan di Studio sebagai draf.").waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  await shot(g, rec, "perbaikan-tersimpan");
  harus(rec, saved, "«Tersimpan di Studio sebagai draf.»");
  const baru = sql(`select coalesce((select id::text from public.courses where supersedes_course_id='${pertama}' order by created_at desc limit 1), '')`);
  harus(rec, !!baru && baru !== pertama, `the correction is the next version in the line (${baru || "none"})`);
  if (baru) course = baru;
  const soal = sql(`select count(*) from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id='${course}' and i.stem = '${esc(SOAL_C5_SINGKAT)}'`);
  harus(rec, soal === "1", "the new version carries the shortened question C5");
});

await step("U7", "the Guru submits the correction again", async (rec) => {
  if (!course || course === pertama) { rec.verdict = "BLOCKED"; return; }
  for (const [tombol, nama] of [["Tandai sudah tersusun", "susun-2"], ["Tandai lolos pemeriksaan", "periksa-2"], ["Ajukan untuk ditinjau", "ajukan-2"]]) {
    if (!(await tekan(g, tombol, rec, nama))) return;
  }
});

// Batch 3 closure (defect 1): the line is one package on Studio's home, at its newest version; the replaced version is
// history, opened from «Riwayat perbaikan», and is not counted in «Menunggu tindakan Anda»
await step("U7a", "Studio's home lists the package once, at its newest version; the version the correction replaced is not a package of its own", async (rec) => {
  if (!course || course === pertama) { rec.verdict = "BLOCKED"; return; }
  await pilihPintu(g, "MENGAJAR");
  await g.goto(`${APP}/studio`, { waitUntil: "networkidle" });
  await shot(g, rec, "beranda-satu-garis");
  const baris = g.locator("#paket a.pin-row").filter({ hasText: JUDUL });
  harus(rec, (await baris.count()) === 1, `the package is listed ${await baris.count()} time(s)`);
  harus(rec, (await g.locator(`#paket a[href="/studio/paket/${pertama}"]`).count()) === 0, "the replaced version is not listed as a package");
  harus(rec, (await g.locator(`#paket a[href="/studio/paket/${course}"]`).count()) === 1, "the newest version is the one listed");
  const terhitung = sql(`select count(*) from public.courses c where c.id = '${pertama}' and c.status in ('INGESTED','STRUCTURED','VALIDATION_FAILED')`);
  harus(rec, terhitung === "1", "the replaced version is still a draft by status (the case this measures)");
  await g.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
  harus(rec, (await g.locator(`#riwayat a[href="/studio/paket/${pertama}"]`).count()) > 0, "«Riwayat perbaikan» still opens the replaced version");
});

await step("U7b", "A1: the head of department reads the questions one whole lesson at a time: package-wide numbering, every key marked in words, every option's reason, the jump and the pager put focus on the lesson, and no sideways scroll at 320 px", async (rec) => {
  if (!keadaan().startsWith("IN_REVIEW")) { rec.verdict = "BLOCKED"; return; }
  await h.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
  const soal = h.locator("#soal");
  if (!harus(rec, (await soal.count()) === 1, "the package page has its question section")) return;
  harus(rec, (await soal.locator("details").count()) === 0, "no question is behind a disclosure");
  const nPelajaran = await soal.locator("#pin-soal-pilih option").count();
  const nBank = Number(sql(`select count(*) from public.items i join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id where m.course_id='${course}'`));
  const ringkas = norm(await soal.locator("[data-soal-ringkas]").innerText().catch(() => ""));
  harus(rec, ringkas.startsWith(`${nBank} soal dalam ${nPelajaran} pelajaran`), `the summary reads «${ringkas}» (${nBank} questions in the bank)`);
  const periksa = async (i) => {
    const meta = (await soal.locator("li.pin-soal .pin-soal-meta").allInnerTexts()).map(norm);
    const opsi = await soal.locator("li.pin-opsi").count();
    const alasan = await soal.locator("li.pin-opsi .pin-opsi-alasan").filter({ hasText: /^Alasan:/ }).count();
    const kunci = await soal.locator("li.pin-opsi-kunci").count();
    const kunciKata = await soal.locator("li.pin-opsi-kunci .pin-studio-kunci").filter({ hasText: "Kunci" }).count();
    harus(rec, opsi > 0 && alasan === opsi, `lesson ${i}: ${alasan} of ${opsi} options show their reason`);
    harus(rec, kunci === meta.length && kunciKata === kunci, `lesson ${i}: ${kunci} key(s) for ${meta.length} question(s), ${kunciKata} marked «Kunci» in words`);
    return meta;
  };
  const meta1 = await periksa(1);
  harus(rec, meta1.length > 0 && meta1[0].startsWith(`Soal 1 dari ${nBank}`), `the first question reads «${meta1[0] ?? ""}»`);
  await shot(h, rec, "a1-pelajaran-1");
  if (nPelajaran > 1) {
    // the jump: choose lesson 2 and press «Buka» (never on change)
    await soal.locator("#pin-soal-pilih").selectOption("2");
    harus(rec, !/[?&]pelajaran=2/.test(h.url()), "choosing a lesson alone does not move (WCAG 3.2.2)");
    await soal.getByRole("button", { name: "Buka", exact: true }).click();
    await h.waitForURL((u) => u.searchParams.get("pelajaran") === "2", { timeout: SLOW });
    await h.waitForLoadState("networkidle");
    await h.waitForFunction(() => document.activeElement?.id === "pin-soal-pelajaran", null, { timeout: SLOW }).catch(() => {});
    harus(rec, await h.evaluate(() => document.activeElement?.id === "pin-soal-pelajaran"), "after «Buka», focus is on the lesson's heading");
    const meta2 = await periksa(2);
    harus(rec, meta2.length === 0 || meta2[0].startsWith(`Soal ${meta1.length + 1} dari ${nBank}`), `lesson 2 starts at «${meta2[0] ?? "(no question)"}», after lesson 1's ${meta1.length}`);
    // the pager back to lesson 1, by its name
    await h.getByRole("link", { name: "Pelajaran sebelumnya", exact: true }).click();
    await h.waitForURL((u) => u.searchParams.get("pelajaran") === "1", { timeout: SLOW });
    await h.waitForFunction(() => document.activeElement?.id === "pin-soal-pelajaran", null, { timeout: SLOW }).catch(() => {});
    harus(rec, await h.evaluate(() => document.activeElement?.id === "pin-soal-pelajaran"), "after «Pelajaran sebelumnya», focus is on the lesson's heading");
    harus(rec, (await h.locator('[data-soal-pager] [data-pager="sebelum"][aria-disabled="true"]').count()) === 1, "on the first lesson, «Pelajaran sebelumnya» is disabled");
  } else {
    harus(rec, (await h.locator("[data-soal-pager]").count()) === 0, "one lesson: no pager");
  }
  // 320 px: the lesson with its options and reasons fits without sideways scroll
  const lebar = h.viewportSize();
  await h.setViewportSize({ width: 320, height: 800 });
  await h.waitForTimeout(300);
  const geser = await h.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await shot(h, rec, "a1-320");
  await h.setViewportSize(lebar ?? { width: 1280, height: 900 });
  harus(rec, geser <= 0, `at 320 px the page scrolls sideways by ${geser} px`);
});

await step("U8", "the head of department approves the content, reviews its findings, and creates and locks the release in one press; the author is offered none of it and the head of department is refused «Terbitkan»", async (rec) => {
  if (!keadaan().startsWith("IN_REVIEW")) { rec.verdict = "BLOCKED"; return; }
  if (!(await tekan(h, "Setujui isi", rec, "setujui"))) return;
  // findings: every WARNING acknowledged by the second person, by kind (W1.5), until none is left
  let akui = 0;
  for (let i = 0; i < 20; i++) {
    await h.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
    const b = h.getByRole("button", { name: /^Sudah saya tinjau/ });
    if (!(await b.count())) break;
    await b.first().click();
    await h.waitForLoadState("networkidle");
    await h.waitForTimeout(800);
    akui += 1;
  }
  const terbuka = sql(`select (select count(*) from public.mcq_quality_findings where course_id='${course}' and acknowledged_at is null and severity::text = 'WARNING')
    + (select count(*) from public.coaching_findings where course_id='${course}' and acknowledged_at is null and severity::text = 'WARNING')`);
  harus(rec, terbuka === "0", `findings acknowledged by kind in ${akui} press(es); WARNINGs left: ${terbuka}`);
  harus(rec, !(await ditawarkan(g, "Buat terbitan")) && !(await ditawarkan(g, "Kunci terbitan")), "the author is offered neither «Buat terbitan» nor «Kunci terbitan»");
  await h.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
  const judulPanel = norm(await h.locator("#lt-kini").innerText().catch(() => ""));
  harus(rec, /Buat terbitan · Kunci terbitan/.test(judulPanel), `the panel reads «${judulPanel}»`);
  const s2 = await tekan(h, "Kunci terbitan", rec, "buat-dan-kunci");
  harus(rec, !!s2 && /\|FROZEN$/.test(s2), `one press created and locked the release (${s2})`);
  harus(rec, !(await ditawarkan(h, "Terbitkan")), "the head of department is not offered «Terbitkan»");
});

const { page: a } = sesi.admin;
await step("U9", "the school admin publishes the chapter («Terbitkan» → «✓ Diterbitkan») and sets its pass mark", async (rec) => {
  if (!/\|FROZEN$/.test(keadaan())) { rec.verdict = "BLOCKED"; return; }
  await a.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
  await a.getByRole("button", { name: "Terbitkan", exact: true }).click();
  const sudah = await a.getByText("Diterbitkan").first().waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  await a.waitForTimeout(1000);
  await shot(a, rec, "diterbitkan");
  harus(rec, sudah, "the button answered «✓ Diterbitkan»");
  harus(rec, /\|PUBLISHED$/.test(keadaan()), `published (${keadaan()})`);
  // the pass mark is set on a published chapter (Konfigurasi lists those), before the teacher may give it
  const inst = sql(`select institution_id from public.courses where id='${course}'`);
  await a.goto(`${APP}/konfigurasi/ketuntasan?sekolah=${inst}&muat=${Date.now()}#ketuntasan`, { waitUntil: "networkidle" });
  await tutupTur(a);
  // a pass mark belongs to the lesson's line, kept under its first version (school_lesson_lines): the correction
  // made the published chapter the second version of the line the Guru began
  const akar = pertama || course;
  const baris = a.locator(`#ketuntasan li[data-pelajaran="${akar}"]`);
  if (harus(rec, (await baris.count()) > 0, "Konfigurasi → Batas ketuntasan lists the chapter")) {
    // B1: a record's one action opens its short form in place first
    await baris.locator("[data-buka-ubah]").click();
    await baris.locator('input[name="alasan"]').waitFor({ timeout: SLOW });
    await baris.locator('input[name="persen"]').fill("70");
    await baris.locator('input[name="alasan"]').fill("Keputusan rapat guru");
    await baris.getByRole("button", { name: "Tetapkan", exact: true }).click();
    await a.waitForURL((u) => u.searchParams.get("bagian") === "ketuntasan", { timeout: SLOW }).catch(() => {});
    const batas = sql(`select coalesce(max(m.percent)::text, '-') from public.school_pass_marks m where m.course_id='${akar}'
      and not exists (select 1 from public.school_pass_marks n where n.supersedes_id = m.id)`);
    harus(rec, batas === "70", `the pass mark is ${batas}%`);
  }
});

const KELAS = sql(`select n.id from public.org_nodes n join public.role_assignments ra on ra.scope_node_id = n.id join public.accounts ac on ac.person_id = ra.person_id join auth.users u on u.id = ac.auth_user_id where u.email='${ORANG.guru.email}' and ra.role = 'EDUCATOR' and ra.revoked_at is null limit 1`);
let la = "";
await step("U10", "the Guru gives the chapter to her class on Siapkan («✓ Disediakan»)", async (rec) => {
  if (!/\|PUBLISHED$/.test(keadaan())) { rec.verdict = "BLOCKED"; return; }
  await pilihPintu(g, "MENGAJAR");
  await g.goto(`${APP}/mengajar/${KELAS}/siapkan`, { waitUntil: "networkidle" });
  await tutupTur(g);
  const row = g.locator("a.pin-row").filter({ hasText: "disusun guru" }).first();
  if (!harus(rec, (await row.count()) > 0, "Siapkan offers the chapter")) return;
  await row.click();
  await g.waitForLoadState("networkidle");
  const sampai = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + 30 * 86400000));
  await g.locator("#pin-sampai").fill(sampai);
  await g.locator('form:has(input[name="terbitan"]) button[type="submit"]').first().click();
  await g.waitForURL((u) => u.searchParams.has("disediakan") || u.searchParams.has("kode"), { timeout: SLOW }).catch(() => {});
  await g.waitForLoadState("networkidle");
  const tombol = norm(await g.locator('form:has(input[name="terbitan"]) button[type="submit"]').first().innerText().catch(() => ""));
  const hasil = norm(await g.getByText("Materi disediakan untuk kelas ini.").first().innerText().catch(() => ""));
  await shot(g, rec, "disediakan");
  harus(rec, new URL(g.url()).searchParams.has("disediakan") && /✓\s*Disediakan/.test(tombol), `the button reads «${tombol}» on ${new URL(g.url()).pathname}`);
  harus(rec, /Materi disediakan untuk kelas ini\./.test(hasil), `the result line: «${hasil}»`);
  la = sql(`select coalesce((select id::text from public.learning_assignments where course_id='${course}' and node_id='${KELAS}' order by created_at desc limit 1), '')`);
  harus(rec, !!la, `the class holds the assignment (${la || "none"})`);
  // Batch 3 closure (defect 2): the card says what the class now has, never «Belum disediakan» beside «✓ Disediakan»
  const lencana = norm(await g.locator(".pin-paket .pin-prow .pin-pill").first().innerText().catch(() => ""));
  harus(rec, lencana === "Tersedia" && (await g.locator(".pin-paket .pin-prow .pin-pill.pin-ok").count()) === 1, `the card's badge reads «${lencana}»`);
  // Daisy, J1Terbit step 7: the way on is the class, whose «Materi untuk kelas ini» lists it «✓ Tersedia» with its window
  await g.locator(`main a.pin-btn[href="/mengajar/${KELAS}"]`).first().click();
  await g.waitForURL((u) => u.pathname === `/mengajar/${KELAS}`, { timeout: SLOW });
  await g.waitForLoadState("networkidle");
  const materi = g.locator(".pin-sec", { has: g.getByRole("heading", { name: "Materi untuk kelas ini" }) }).locator(".pin-row").filter({ hasText: JUDUL });
  await materi.first().scrollIntoViewIfNeeded().catch(() => {});
  await shot(g, rec, "kelas-tersedia");
  const barisMateri = norm(await materi.first().innerText().catch(() => ""));
  harus(rec, (await materi.locator(".pin-pill.pin-ok").count()) === 1 && /Tersedia/.test(barisMateri) && /Mulai .+ Sampai /.test(barisMateri),
    `the class page lists it «${barisMateri}»`);
});

// F-7 (owner ruling, 2 Nov, Batch 3 closure; QN5, J4.8): the teacher who authors browses her school's bank, with keys
// and reasons; Question Health inside it stays the reviewer's (no evidence figures, no review form)
await step("U10b", "the Guru opens Studio → «Bank Soal» by clicking: her school's questions with their keys and reasons, and no Question Health", async (rec) => {
  if (!course) { rec.verdict = "BLOCKED"; return; }
  await pilihPintu(g, "MENGAJAR");
  await g.goto(`${APP}/studio`, { waitUntil: "networkidle" });
  const tab = g.getByRole("link", { name: "Bank Soal" }).first();
  if (!harus(rec, (await tab.count()) > 0, "Studio offers the Guru «Bank Soal»")) return;
  await tab.click();
  await g.waitForURL((u) => u.pathname === "/studio/bank", { timeout: SLOW });
  await g.getByRole("heading", { name: "Bank Soal", exact: true }).waitFor({ timeout: SLOW }).catch(() => {});
  await g.locator("main li[data-soal]").first().waitFor({ timeout: SLOW }).catch(() => {});
  await shot(g, rec, "bank-guru");
  const ids = (await g.locator("main li[data-soal]").evaluateAll((els) => els.map((e) => e.getAttribute("data-soal")))).filter(Boolean);
  const sekolah = sql(`select institution_id::text from public.courses where id = '${course}'`);
  const asing = sql(`select count(*) from public.items where left(id::text, 8) = any(string_to_array('${ids.join(",")}', ',')) and institution_id <> '${sekolah}'`);
  harus(rec, ids.length > 0 && asing === "0", `${ids.length} question(s) listed, ${asing} of another school`);
  harus(rec, (await g.locator("main .pin-opsi-kunci").count()) > 0, "a question shows its key and reasons");
  harus(rec, (await g.locator('main form select[name="keputusan"]').count()) === 0, "no Question Health review form");
});

await step("U11", "the learner finds the chapter on Belajar and opens it", async (rec) => {
  if (!la) { rec.verdict = "BLOCKED"; return; }
  const { page: m } = sesi.murid;
  await m.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
  await tutupTur(m);
  await shot(m, rec, "belajar");
  const tautan = m.locator(`a[href*="/belajar/${la}"]`);
  if (!harus(rec, (await tautan.count()) > 0, "Belajar offers the chapter")) return;
  await tautan.first().click();
  await m.waitForURL((u) => u.pathname.startsWith(`/belajar/${la}`), { timeout: SLOW });
  await m.waitForLoadState("networkidle");
  await m.waitForFunction(() => !/Memuat halaman/.test(document.querySelector("main")?.innerText ?? "Memuat halaman"), null, { timeout: SLOW }).catch(() => {});
  await tutupTur(m);
  await shot(m, rec, "bab-dibuka");
  const teks = norm(await m.locator("main").innerText().catch(() => ""));
  harus(rec, /kelipatan bilangan/i.test(teks) && /Pemetaan Awal/.test(teks), `the chapter opens at ${new URL(m.url()).pathname}: «${teks.slice(0, 160)}»`);
  harus(rec, !/Kunci|Alasan:/.test(teks), "no key or reason is shown to the learner");
});

await step("U12", "«Riwayat perbaikan» names the send-back with its reason and the approval, with who and when", async (rec) => {
  if (!course || course === pertama) { rec.verdict = "BLOCKED"; return; }
  await g.goto(`${APP}/studio/paket/${course}`, { waitUntil: "networkidle" });
  const r = norm(await g.locator("#riwayat").innerText().catch(() => ""));
  await g.locator("#riwayat").scrollIntoViewIfNeeded().catch(() => {});
  await shot(g, rec, "riwayat");
  const nama = sql(`select string_agg(distinct p.display_name, '|') from public.content_review_outcomes o join public.persons p on p.id = o.reviewer_person_id where o.course_id in ('${pertama}', '${course}')`);
  harus(rec, /Dikembalikan ke penyusun/.test(r) && r.includes(ALASAN_KEMBALI) && /Disetujui/.test(r), "both outcomes, and the reason");
  harus(rec, nama.split("|").every((n) => r.includes(n)), `the reviewer named (${nama})`);
  harus(rec, r.includes("Soal C5 dipersingkat sesuai catatan peninjau."), "the correction's own summary");
  rec.catatan.push(`the history reads: ${r.slice(0, 500)}`);
  const audit = sql(`select coalesce(string_agg(action, ',' order by id), '-') from public.audit_log where target_id in ('${pertama}', '${course}')`);
  rec.catatan.push(`audit rows on the line: ${audit}`);
});

// ─────────────────────────────── W6.7 · Uji Cepat at Level 3 (CR-34), on the chapter just published
const KUNCI_SOAL = new Map([
  ["Bilangan manakah yang termasuk kelipatan 4?", "16"],
  ["Kelipatan 5 yang keempat adalah ....", "20"],
  ["Kelipatan persekutuan terkecil dari 3 dan 4 adalah ....", "12"],
  ["Tiga kelipatan 6 yang pertama adalah ....", "6, 12, 18"],
  [SOAL_C5_SINGKAT, "10"],
]);
let ujiCepat = "";
await step("U13", "W6.7: the Guru launches an Uji Cepat of three of the chapter's questions for 5B", async (rec) => {
  if (!la) { rec.verdict = "BLOCKED"; return; }
  const modul = sql(`select id from public.modules where course_id='${course}' order by ordinal limit 1`);
  await g.goto(`${APP}/mengajar/${KELAS}/uji-cepat`, { waitUntil: "networkidle" });
  await tutupTur(g);
  if (!harus(rec, !/Uji Cepat sedang berjalan/.test(norm(await g.locator("main").innerText())), "no Uji Cepat is already running in 5B")) return;
  await g.locator("#pin-bab").selectOption(modul);
  await g.getByRole("button", { name: "Tampilkan soal bab ini", exact: true }).click();
  await g.waitForURL((u) => u.searchParams.get("bab") === modul, { timeout: SLOW });
  await g.waitForLoadState("networkidle");
  const baris = g.locator("ol.pin-cepat-pilih > li");
  const n = await baris.count();
  harus(rec, (await g.locator("ol.pin-cepat-pilih .pin-opsi-kunci").count()) === 0, `${n} question(s) offered, no key shown`);
  for (let i = 0; i < 3 && i < n; i++) await baris.nth(i).locator('input[type="checkbox"][name="butir"]').check();
  await g.getByRole("button", { name: "Lanjut ke tinjauan", exact: true }).click();
  await g.waitForURL((u) => u.searchParams.get("tahap") === "tinjau", { timeout: SLOW });
  await g.getByRole("button", { name: "Sediakan Uji Cepat sekarang", exact: true }).click();
  const jalan = await g.getByText("Uji Cepat sedang berjalan").first().waitFor({ timeout: SLOW }).then(() => true).catch(() => false);
  await shot(g, rec, "uji-cepat-berjalan");
  ujiCepat = sql(`select coalesce((select aa.id::text from public.assessment_assignments aa join public.assessment_definitions d on d.id = aa.assessment_definition_id
    where aa.node_id='${KELAS}' and d.mode::text = 'QUICK' order by aa.created_at desc limit 1), '')`);
  harus(rec, jalan && !!ujiCepat, `«Uji Cepat sedang berjalan» (${ujiCepat || "none"})`);
});

await step("U14", "W6.7: the learner finds the Uji Cepat on Belajar and hands it in; no certificate comes of it (J5.7)", async (rec) => {
  if (!ujiCepat) { rec.verdict = "BLOCKED"; return; }
  const { page: m } = sesi.murid;
  await m.goto(`${APP}/belajar`, { waitUntil: "networkidle" });
  await tutupTur(m);
  const tautan = m.locator(`a[href="/belajar/asesmen/${ujiCepat}"]`);
  if (!harus(rec, (await tautan.count()) > 0, "Belajar offers the Uji Cepat")) return;
  await tautan.first().click();
  await m.waitForURL((u) => u.pathname === `/belajar/asesmen/${ujiCepat}`, { timeout: SLOW });
  await m.locator("main button[type=submit].pin-primary").first().click();
  let dijawab = 0;
  for (let i = 0; i < 10; i++) {
    const stem = m.locator("h2.pin-stem").first();
    await stem.waitFor({ state: "visible", timeout: SLOW });
    const raw = await stem.innerText();
    const benar = KUNCI_SOAL.get(norm(raw));
    const opts = m.locator("ul.pin-opsi button.pin-op");
    let idx = 0;
    for (let j = 0; j < await opts.count(); j++) if (norm(await opts.nth(j).locator("span").nth(1).innerText()) === benar) idx = j;
    await opts.nth(idx).click();
    const simpan = m.getByRole("button", { name: /^(Kunci|Simpan) jawaban ini$/ });
    if (await simpan.count()) { await simpan.click(); await m.getByRole("button", { name: "Tersimpan", exact: true }).waitFor({ timeout: SLOW }); }
    dijawab += 1;
    const next = m.getByRole("button", { name: "Berikutnya", exact: true });
    if (await next.count()) {
      await next.click();
      await m.waitForFunction((prev) => document.querySelector("h2.pin-stem")?.innerText !== prev, raw, { timeout: SLOW });
      continue;
    }
    await m.getByRole("button", { name: "Kumpulkan", exact: true }).click();
    const tanya = m.locator('[aria-labelledby="kumpulkan-tanya"]');
    if (await tanya.waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false)) await tanya.getByRole("button", { name: "Kumpulkan", exact: true }).click();
    await m.waitForURL((u) => u.pathname.endsWith("/hasil") || u.pathname === "/belajar", { timeout: 60000 });
    break;
  }
  await m.waitForLoadState("networkidle");
  await shot(m, rec, "uji-cepat-dikumpulkan");
  const selesai = sql(`select count(*) from public.assessment_sessions s where s.assessment_assignment_id='${ujiCepat}' and s.submitted_at is not null`);
  harus(rec, dijawab === 3 && selesai === "1", `answered ${dijawab}, handed in sittings ${selesai}`);
  // J5.7: a single Uji Cepat never issues a certificate, in the database or on the screen the learner lands on
  const sertifikat = sql(`select count(*) from public.certificates c join public.assessment_sessions s on s.id = c.session_id where s.assessment_assignment_id='${ujiCepat}'`);
  const teks = norm(await m.locator("main").innerText().catch(() => ""));
  harus(rec, sertifikat === "0" && !/sertifikat/i.test(teks) && (await m.locator('main a[href*="/sertifikat"]').count()) === 0,
    `no certificate for the Uji Cepat (${sertifikat} in the database; the page ${/sertifikat/i.test(teks) ? "mentions" : "does not mention"} one)`);
});

await step("U15", "W6.7: the Guru opens «Lihat hasil»: the class figure on its base first (below five scores, the not-yet state, D-176), each learner one step below", async (rec) => {
  if (!ujiCepat) { rec.verdict = "BLOCKED"; return; }
  await g.goto(`${APP}/mengajar/${KELAS}/uji-cepat`, { waitUntil: "networkidle" });
  const lihat = g.locator(`a[href="/mengajar/${KELAS}/uji-cepat/hasil?penugasan=${ujiCepat}"]`).first();
  if (!harus(rec, (await lihat.count()) > 0, "the running Uji Cepat leads to «Lihat hasil»")) return;
  await lihat.click();
  await g.waitForURL((u) => u.pathname.endsWith("/uji-cepat/hasil"), { timeout: SLOW });
  await g.waitForLoadState("networkidle");
  await shot(g, rec, "uji-cepat-hasil");
  const kelas = g.locator(".pin-cepat-kelas");
  const dinilai = await kelas.getAttribute("data-dinilai").catch(() => null);
  const terdaftar = await kelas.getAttribute("data-terdaftar").catch(() => null);
  const teksKelas = norm(await kelas.innerText().catch(() => ""));
  rec.catatan.push(`the class figure reads «${teksKelas}»`);
  harus(rec, dinilai === "1" && (await kelas.getAttribute("data-ambang").catch(() => null)) === "5" && !/%/.test(teksKelas) && /Sekarang 1 murid; perlu 5/.test(teksKelas) && new RegExp(`1 dari ${terdaftar} murid`).test(teksKelas), `D-176: one score of ${terdaftar} is below the threshold of five — no class average, the not-yet line «Sekarang 1 murid; perlu 5» and the base`);
  const murid = sql(`select p.display_name from public.persons p join public.accounts a on a.person_id = p.id join auth.users u on u.id = a.auth_user_id where u.email='${ORANG.murid.email}'`);
  const baris = norm(await g.locator("main").innerText());
  harus(rec, baris.indexOf(teksKelas.slice(0, 10)) < baris.indexOf(murid) && baris.includes(murid), `the learner «${murid}» is listed below the figure`);
});

writeFileSync(join(OUT, "studio-ujung.json"), JSON.stringify({ judul: JUDUL, langkah }, null, 2));
await browser.close();
process.exit(gagal ? 1 : 0);
