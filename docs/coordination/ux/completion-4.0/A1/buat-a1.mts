/**
 * A1 · W1.2 — the question review on Studio's package page («Soal dalam paket ini»).
 * Design specimen, not application code. Run from the repository root, after the
 * design system's harness has written its tokens (sistem-desain/render/tokens.css):
 *
 *   npx tsx docs/coordination/ux/completion-4.0/A1/buat-a1.mts
 *
 * Words: the copy table at engineering commit 0b19707 (read with `git show`), plus
 * the new keys in NEW (the T table in README §5). Components and tokens: the frozen
 * design system (sistem-desain/project). People and content are invented.
 *
 * Writes render/<state>-<width>.png, jalan/<state>-<width>.txt (the Tab order and the
 * accessibility tree) and render/laporan.txt (axe WCAG 2.2 AA, sideways scroll,
 * targets, and the composition's own rules).
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const sini = dirname(fileURLToPath(import.meta.url));
const repo = join(sini, "..", "..", "..", "..", "..");
const DS = join(repo, "docs/coordination/ux/sistem-desain");
const KOMIT = "0b19707";

// ── words ───────────────────────────────────────────────────────────────────
const kerja = mkdtempSync(join(tmpdir(), "a1-"));
for (const f of ["hle.ts", "tanggal.ts"]) writeFileSync(join(kerja, f), execSync(`git show ${KOMIT}:src/lib/${f}`, { cwd: repo }));
const hle = await import(join(kerja, "hle.ts"));

/** New keys (README §5). Presentation; none is a protected term. */
export const NEW: Record<string, { id: string; en: string }> = {
  "studio.soal.ringkas": { id: "{soal} soal dalam {pelajaran} pelajaran", en: "{soal} questions in {pelajaran} lessons" },
  "studio.soal.pelajaran_label": { id: "Pelajaran", en: "Lesson" },
  "studio.soal.pelajaran_dari": { id: "Pelajaran {i} dari {n}", en: "Lesson {i} of {n}" },
  "studio.soal.posisi": { id: "Soal {i} dari {n}", en: "Question {i} of {n}" },
  "studio.soal.buka": { id: "Buka", en: "Open" },
  "studio.soal.kesulitan.MUDAH": { id: "Mudah", en: "Easy" },
  "studio.soal.kesulitan.SEDANG": { id: "Sedang", en: "Medium" },
  "studio.soal.kesulitan.SULIT": { id: "Sulit", en: "Hard" },
  "studio.soal.miskonsepsi": { id: "Miskonsepsi", en: "Misconception" },
  "studio.soal.bacaan": { id: "Bacaan", en: "Reading passage" },
  "studio.soal.gagal": { id: "PINTAR belum bisa membuka soal paket ini. Muat ulang halaman ini; jika tetap gagal, hubungi admin sekolah Anda.", en: "PINTAR couldn't open this package's questions. Reload this page; if it still fails, contact your school's administrator." },
};
const kata = (k: string, isi: Record<string, string | number> = {}) => {
  let v: string = NEW[k] ? NEW[k].id : hle.t(k, "staff", { locale: "id" });
  for (const [a, b] of Object.entries(isi)) v = v.replace(`{${a}}`, String(b));
  return v;
};
const angka = (n: number) => hle.format.number(n, "id");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ikon = (n: string) => `<i data-ikon="${n}"></i>`;
/** The wordmark: a placeholder at the slot's size (the commission §4; master pending F-11). */
const slotMerek = `<span class="a1-slot" role="img" aria-label="Pintar (master pending F-11)">Pintar <small>(master pending F-11)</small></span>`;

// ── invented content (sample content, not copy) ────────────────────────────
type Opsi = { label: string; isi: string; kunci: boolean; alasan: string; miskonsepsi?: string };
type Soal = { peran: string | null; bank: string; kesulitan: "MUDAH" | "SEDANG" | "SULIT" | null; stimulus?: string; pertanyaan: string; opsi: Opsi[] };
type Pelajaran = { judul: string; soal: Soal[] };
const s = (peran: string | null, kesulitan: Soal["kesulitan"], pertanyaan: string, opsi: Array<[string, boolean, string, string?]>, stimulus?: string): Soal =>
  ({ peran, bank: "PRACTICE", kesulitan, pertanyaan, stimulus, opsi: opsi.map(([isi, kunci, alasan, miskonsepsi], i) => ({ label: "ABCDE"[i], isi, kunci, alasan, miskonsepsi })) });
const BAB: Pelajaran[] = [
  { judul: "Pelajaran 1 · Apa itu pecahan senilai", soal: [
    s("PRE_TEST", "MUDAH", "Pecahan manakah yang senilai dengan 1/2?", [["2/4", true, "2/4 = 1/2 karena pembilang dan penyebut sama-sama dikali 2."], ["1/4", false, "1/4 adalah setengah dari 1/2.", "Menganggap penyebut yang lebih besar berarti pecahan yang lebih besar"], ["2/3", false, "2/3 lebih besar dari 1/2."], ["3/4", false, "3/4 lebih besar dari 1/2."]]),
    s("POST_TEST", "SEDANG", "Isilah titik-titik: 3/5 = .../15", [["9", true, "5 dikali 3 menjadi 15, jadi 3 juga dikali 3 menjadi 9."], ["5", false, "Hanya penyebut yang diubah.", "Mengubah penyebut tanpa mengubah pembilang"], ["13", false, "Menambahkan 10 pada pembilang dan penyebut tidak menghasilkan pecahan senilai.", "Menjumlahkan alih-alih mengalikan"], ["3", false, "Pembilang tidak diubah sama sekali."]], "Rina punya 3 dari 5 kelereng merah. Ia ingin menulis bagian kelereng merah itu sebagai pecahan berpenyebut 15 tanpa mengubah nilainya."),
    s(null, "MUDAH", "Gambar menunjukkan 4 dari 8 bagian diarsir. Pecahan senilai yang paling sederhana adalah ....", [["1/2", true, "4/8 disederhanakan dengan membagi 4 menjadi 1/2."], ["4/8", false, "Ini senilai, tetapi belum paling sederhana."], ["1/4", false, "Bagian yang diarsir adalah separuh, bukan seperempat."]]),
    s(null, "SULIT", "Manakah yang BUKAN pecahan senilai dengan 6/9?", [["2/3", false, "6/9 dibagi 3 menjadi 2/3, jadi senilai."], ["12/18", false, "6/9 dikali 2 menjadi 12/18, jadi senilai."], ["4/6", false, "4/6 dan 6/9 sama-sama senilai dengan 2/3."], ["8/12", false, "8/12 = 2/3, jadi senilai."], ["9/12", true, "9/12 = 3/4, tidak senilai dengan 2/3.", ]]),
  ] },
  { judul: "Pelajaran 2 · Mengalikan pembilang dan penyebut", soal: Array.from({ length: 5 }, (_, i) => s(null, (["MUDAH", "SEDANG", "SULIT"] as const)[i % 3], `Soal latihan ${i + 1}: 2/7 = .../${7 * (i + 2)}`, [[`${2 * (i + 2)}`, true, `7 dikali ${i + 2}, jadi 2 juga dikali ${i + 2}.`], [`${2 + 7 * (i + 1)}`, false, "Menambah, bukan mengalikan.", "Menjumlahkan alih-alih mengalikan"], ["2", false, "Pembilang tidak diubah."]])) },
  { judul: "Pelajaran 3 · Menyederhanakan pecahan", soal: Array.from({ length: 5 }, (_, i) => s(null, "SEDANG", `Sederhanakan ${(i + 2) * 3}/${(i + 2) * 6}.`, [["1/2", true, "Pembilang dan penyebut dibagi dengan FPB-nya."], [`${i + 2}/${2 * (i + 2)}`, false, "Senilai, tetapi belum paling sederhana."], ["1/3", false, "Penyebut dibagi dengan bilangan yang berbeda."]])) },
  { judul: "Pelajaran 4 · Membandingkan pecahan", soal: Array.from({ length: 4 }, (_, i) => s(null, null, `Bandingkan ${i + 1}/4 dan ${i + 2}/8.`, [["Lebih besar", i > 0, "Samakan penyebutnya lebih dulu."], ["Lebih kecil", false, "Penyebut 8 tidak membuat pecahan lebih besar.", "Menganggap penyebut yang lebih besar berarti pecahan yang lebih besar"], ["Sama", i === 0, "1/4 = 2/8."]])) },
];
// The 320 px edge case: five long options, each with a long reason.
const PANJANG: Pelajaran = { judul: "Pelajaran 6 · Pecahan dalam kehidupan sehari-hari", soal: [
  s("POST_TEST", "SULIT", "Ibu memotong sebuah kue menjadi 12 potong yang sama besar. Budi memakan 3 potong, Sari memakan 2 potong, dan Ayah memakan 1 potong. Pecahan manakah yang menyatakan bagian kue yang sudah dimakan, dalam bentuk paling sederhana?", [
    ["Setengah dari seluruh kue, karena 3 + 2 + 1 = 6 potong dari 12 potong, dan 6/12 disederhanakan menjadi 1/2", true, "Jumlah potongan yang dimakan adalah 6 dari 12. Pembilang dan penyebut dibagi 6, sehingga 6/12 = 1/2."],
    ["Seperenam dari seluruh kue, karena ada enam potong yang dimakan oleh tiga orang yang berbeda", false, "Banyaknya potong yang dimakan (6) dibaca sebagai penyebut, padahal penyebutnya adalah jumlah semua potong (12).", "Menukar pembilang dan penyebut"],
    ["Tiga perdua belas, karena Budi memakan potongan paling banyak dibandingkan Sari dan Ayah", false, "Hanya bagian Budi yang dihitung; bagian Sari dan Ayah tidak ikut dijumlahkan."],
    ["Enam perdua belas, karena 6/12 sudah merupakan bentuk yang paling sederhana dan tidak bisa dibagi lagi", false, "6/12 masih bisa disederhanakan: pembilang dan penyebut sama-sama habis dibagi 6.", "Menganggap pecahan sudah paling sederhana tanpa memeriksa FPB"],
    ["Dua pertiga dari seluruh kue, karena tersisa sepertiga kue yang belum dimakan oleh siapa pun", false, "Sisa kue adalah 6 dari 12, yaitu setengah, bukan sepertiga."],
  ]),
] };

// ── the section, as composed ─────────────────────────────────────────────────
function opsiHtml(o: Opsi): string {
  const kunci = o.kunci ? `<span class="pds-badge pds-badge-ok a1-kunci">${ikon("check")}${kata("studio.soal.kunci")}</span>` : "";
  return `<li class="${o.kunci ? "pin-opsi pin-opsi-kunci" : "pin-opsi"}">
    <span class="a1-huruf" aria-hidden="true">${o.label}</span>
    <div class="a1-opsi-isi">
      <p class="a1-opsi-teks"><span class="pds-sr">${o.label}. </span>${esc(o.isi)}${o.kunci ? ` ${kunci}` : ""}</p>
      <p class="a1-alasan"><strong>${kata("studio.soal.alasan")}:</strong> ${esc(o.alasan)}</p>
      ${o.miskonsepsi ? `<p class="a1-miskonsepsi"><strong>${kata("studio.soal.miskonsepsi")}:</strong> ${esc(o.miskonsepsi)}</p>` : ""}
    </div>
  </li>`;
}
function soalHtml(q: Soal, nomor: number, total: number): string {
  const meta = [kata("studio.soal.posisi", { i: angka(nomor), n: angka(total) }), q.peran ? hle.enumLabel("mode", q.peran, "id") : hle.enumLabel("bank", q.bank, "id"), q.kesulitan ? kata(`studio.soal.kesulitan.${q.kesulitan}`) : null].filter(Boolean).join(" · ");
  return `<li class="pin-soal" id="soal-${nomor}">
    <article aria-labelledby="soal-${nomor}-batang">
      <p class="a1-meta">${meta}</p>
      ${q.stimulus ? `<div class="a1-bacaan"><p class="a1-bacaan-label">${kata("studio.soal.bacaan")}</p><p>${esc(q.stimulus)}</p></div>` : ""}
      <h4 class="t-stem-compact a1-batang" id="soal-${nomor}-batang">${esc(q.pertanyaan)}</h4>
      <ol class="a1-opsi" aria-label="${kata("studio.soal.posisi", { i: angka(nomor), n: angka(total) })}">${q.opsi.map(opsiHtml).join("")}</ol>
    </article>
  </li>`;
}
type Keadaan = { kode: string; judul: string; pelajaran: Pelajaran[]; ke: number; totalSoal: number; totalPelajaran: number; awalNomor: number; gagal?: boolean; daftarPelajaran?: string[] };
function bagianSoal(k: Keadaan): string {
  const kepala = `<h2>${kata("studio.soal.judul")}</h2><p class="pds-ink-2">${kata("studio.soal.arti")}</p>`;
  if (k.gagal) return `<section class="pds-section" id="soal" aria-labelledby="soal-judul">${kepala.replace("<h2", '<h2 id="soal-judul"')}<p class="pds-result pds-result-blocked" role="alert">${ikon("circle-alert")}<span>${kata("studio.soal.gagal")}</span></p></section>`;
  if (k.totalSoal === 0) return `<section class="pds-section" id="soal" aria-labelledby="soal-judul">${kepala.replace("<h2", '<h2 id="soal-judul"')}<div class="pds-empty"><p>${kata("studio.soal.kosong")}</p></div></section>`;
  const l = k.pelajaran[k.ke];
  const daftar = k.daftarPelajaran ?? k.pelajaran.map((p) => `${p.judul} (${angka(p.soal.length)} ${kata("studio.soal.jumlah")})`);
  const pilih = `<form class="a1-lompat" action="#soal" onsubmit="return false"><label class="pds-label" for="${k.kode}-pelajaran">${kata("studio.soal.pelajaran_label")}</label>
    <span class="a1-lompat-baris"><span class="pds-select"><select id="${k.kode}-pelajaran">${daftar.map((d, i) => `<option${i === k.ke ? " selected" : ""}>${esc(d)}</option>`).join("")}</select>${ikon("chevron-down")}</span>
    <button type="submit" class="pds-btn pds-btn-secondary">${kata("studio.soal.buka")}</button></span></form>`;
  const pager = (posisi: string) => `<nav class="pds-pager a1-pager" aria-label="${kata("studio.soal.pelajaran_label")}${posisi}">
    <span class="pds-pager-posisi">${kata("studio.soal.pelajaran_dari", { i: angka(k.ke + 1), n: angka(k.totalPelajaran) })}</span>
    <span class="pds-pager-gerak">
      ${k.ke > 0 ? `<a href="#soal" class="pds-btn pds-btn-secondary" data-sebelum>${ikon("chevron-left")}<span class="pds-btn-teks">${kata("koleksi.sebelumnya")}</span></a>` : `<span class="pds-btn pds-btn-secondary" data-sebelum aria-disabled="true">${ikon("chevron-left")}<span class="pds-btn-teks">${kata("koleksi.sebelumnya")}</span></span>`}
      ${k.ke < k.totalPelajaran - 1 ? `<a href="#soal" class="pds-btn pds-btn-secondary" data-sesudah><span class="pds-btn-teks">${kata("koleksi.berikutnya")}</span>${ikon("chevron-right")}</a>` : `<span class="pds-btn pds-btn-secondary" data-sesudah aria-disabled="true"><span class="pds-btn-teks">${kata("koleksi.berikutnya")}</span>${ikon("chevron-right")}</span>`}
    </span></nav>`;
  return `<section class="pds-section" id="soal" aria-labelledby="soal-judul">
    ${kepala.replace("<h2", '<h2 id="soal-judul"')}
    <p class="a1-ringkas">${kata("studio.soal.ringkas", { soal: angka(k.totalSoal), pelajaran: angka(k.totalPelajaran) })}</p>
    ${pilih}
    <div class="a1-pelajaran" role="group" aria-labelledby="${k.kode}-l-judul">
      <h3 class="t-subsection a1-pelajaran-judul" id="${k.kode}-l-judul" tabindex="-1">${esc(l.judul)} <small>${angka(l.soal.length)} ${kata("studio.soal.jumlah")}</small></h3>
      <ol class="a1-soal-daftar">${l.soal.map((q, i) => soalHtml(q, k.awalNomor + i, k.totalSoal)).join("")}</ol>
    </div>
    ${pager(" (bawah)")}
  </section>`;
}
function halaman(k: Keadaan): string {
  const tempat = [["Konfigurasi", "settings"], ["Pendataan", "file-spreadsheet"], ["Aktivasi akun", "user-check"], ["Studio", "square-pen"]];
  return `<div class="pds pds-jalan a1">
  <section class="pds-lewati-induk" data-shell data-shell-statis aria-label="${esc(k.judul)}">
  <a class="pds-lewati" href="#a1-isi">Langsung ke isi</a>
  <div class="pds-shell-host"><div class="pds-shell">
    <nav class="pds-nav" aria-label="${kata("nav.tempat")}">
      <div class="pds-nav-kepala">${slotMerek}</div>
      <ul class="pds-nav-daftar">${tempat.map(([t, i]) => `<li><a href="#" class="pds-nav-item"${t === "Studio" ? ' aria-current="page"' : ""}>${ikon(i)}<span class="pds-nav-label">${t}</span></a></li>`).join("")}</ul>
      <div class="pds-nav-bawah"><div class="pds-identity" style="cursor:default"><span class="pds-avatar" aria-hidden="true">HW</span><div><strong>Hendra Wijaya</strong><small>Kepala departemen · SMP Cahaya Kaliandra</small></div></div>
      <button type="button" class="pds-nav-item pds-nav-keluar">${ikon("log-out")}<span class="pds-nav-label">${kata("sesi.keluar")}</span></button></div>
    </nav>
    <div class="pds-main">
      <header class="pds-bar">${slotMerek}<span class="pds-bar-tempat" aria-hidden="true">Studio</span><button type="button" class="pds-btn pds-btn-secondary">${kata("sesi.keluar")}</button><button type="button" class="pds-btn pds-btn-icon" aria-label="Buka menu">${ikon("menu")}</button></header>
      <main class="pds-main-isi" id="a1-isi" tabindex="-1">
        <div class="pds-pagehead"><div><p><a href="#" class="pds-back">${ikon("chevron-left")}${kata("studio.title")}</a></p><h1 class="pds-title">Matematika · Bab 3 · Pecahan senilai</h1></div></div>
        <section class="pds-section a1-dibangun"><h2>${kata("studio.paket.judul")}</h2><p class="pds-ink-2">The package's state, findings and the learner preview, as built (not part of this composition).</p></section>
        ${bagianSoal(k)}
        <section class="pds-section a1-dibangun"><h2>${kata("studio.langkah.judul")}</h2><p class="pds-ink-2">«Langkah menuju terbit», as built, after the questions (D-088(h); J1). «Setujui isi» comes after the reviewer has read them.</p></section>
      </main>
    </div>
  </div></div></section></div>`;
}

const GAYA = readFileSync(join(sini, "a1.css"), "utf8");
const jumlah = BAB.reduce((a, p) => a + p.soal.length, 0);
const KEADAAN: Keadaan[] = [
  { kode: "penuh", judul: "Lesson 1 of 4 (the first view)", pelajaran: BAB, ke: 0, totalSoal: jumlah, totalPelajaran: BAB.length, awalNomor: 1 },
  { kode: "tengah", judul: "Lesson 3 of 4 (mid-package)", pelajaran: BAB, ke: 2, totalSoal: jumlah, totalPelajaran: BAB.length, awalNomor: 1 + BAB[0].soal.length + BAB[1].soal.length },
  { kode: "besar", judul: "2,000 questions in 500 lessons (lesson 237)", pelajaran: Array.from({ length: 500 }, (_, i) => (i === 236 ? { ...BAB[2], judul: "Pelajaran 237 · Menyederhanakan pecahan" } : { judul: `Pelajaran ${i + 1}`, soal: [] })), ke: 236, totalSoal: 2000, totalPelajaran: 500, awalNomor: 945,
    daftarPelajaran: Array.from({ length: 500 }, (_, i) => `Pelajaran ${i + 1}${i === 236 ? " · Menyederhanakan pecahan" : ""} (4 soal)`) },
  { kode: "panjang", judul: "Five long options (the 320 px case)", pelajaran: [...BAB, BAB[0], PANJANG], ke: 5, totalSoal: 24, totalPelajaran: 6, awalNomor: 24 },
  { kode: "kosong", judul: "A package with no questions", pelajaran: [], ke: 0, totalSoal: 0, totalPelajaran: 0, awalNomor: 0 },
  { kode: "gagal", judul: "The questions cannot be read", pelajaran: [], ke: 0, totalSoal: 0, totalPelajaran: 0, awalNomor: 0, gagal: true },
];

// ── render and check ─────────────────────────────────────────────────────────
const RENDER = join(sini, "render"), JALAN = join(sini, "jalan");
mkdirSync(RENDER, { recursive: true }); mkdirSync(JALAN, { recursive: true });
const tokens = readFileSync(join(DS, "render/tokens.css"), "utf8").replace(/url\("\/(fonts\/[^"]+)"\)/g, (_, f) => `url("file://${repo}/public/${f}")`);
const bundleCss = readFileSync(join(DS, "project/components/bundle.css"), "utf8");
const bundleJs = readFileSync(join(DS, "project/components/bundle.js"), "utf8");
const req = createRequire(join(execSync("npm root -g").toString().trim(), "x.js"));
const { chromium } = req("playwright");
const axe = readFileSync(join(repo, "node_modules/axe-core/axe.min.js"), "utf8");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const laporan: string[] = [];
let gagal = 0;
for (const k of KEADAAN) {
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(k.judul)}</title><style>${tokens}</style><style>${bundleCss}</style><style>${GAYA}</style><script>${bundleJs}</script></head><body>${halaman(k)}<script>Pintar.siapkan();</script></body></html>`;
  writeFileSync(join(sini, `${k.kode}.html`), html);
  for (const w of [1280, 820, 390, 320]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(RENDER, `${k.kode}-${w}.png`), fullPage: true });
    const masalah: string[] = [];
    const ukur = await page.evaluate(`(() => {
      var kecil = [];
      document.querySelectorAll("a, button, select, input, summary").forEach(function (e) {
        if (e.closest("[hidden]")) return; var r = e.getBoundingClientRect(); if (!r.width) return;
        if (r.height < 24 || r.width < 24) kecil.push(e.tagName + " " + Math.round(r.width) + "x" + Math.round(r.height));
      });
      var kunci = document.querySelectorAll(".pin-opsi-kunci");
      var kunciKata = [].every.call(kunci, function (o) { return /Kunci/.test(o.textContent); });
      return { lebar: document.documentElement.scrollWidth, kecil: kecil, kunci: kunci.length, kunciKata: kunciKata,
               soal: document.querySelectorAll("#soal li.pin-soal").length, opsi: document.querySelectorAll(".pin-opsi").length,
               alasan: document.querySelectorAll(".pin-opsi .a1-alasan").length, details: document.querySelectorAll("#soal details").length };
    })()`) as { lebar: number; kecil: string[]; kunci: number; kunciKata: boolean; soal: number; opsi: number; alasan: number; details: number };
    if (ukur.lebar > w + 1) masalah.push(`sideways scroll ${ukur.lebar} at ${w}`);
    if (ukur.kecil.length) masalah.push(`targets under 24 px: ${ukur.kecil.join(", ")}`);
    if (!ukur.kunciKata) masalah.push("a key not written as «Kunci»");
    if (ukur.soal && ukur.kunci !== ukur.soal) masalah.push(`${ukur.soal} questions but ${ukur.kunci} keys`);
    if (ukur.alasan !== ukur.opsi) masalah.push("an option without its reason");
    if (ukur.details) masalah.push("a question hidden in a disclosure");
    if (ukur.soal) {
      const awal = await page.evaluate(`document.querySelector("#soal .a1-meta").textContent`) as string;
      const harap = kata("studio.soal.posisi", { i: angka(k.awalNomor), n: angka(k.totalSoal) });
      if (!awal.startsWith(harap)) masalah.push(`numbering: «${awal}» does not start «${harap}»`);
    }
    await page.addScriptTag({ content: axe });
    const pelanggaran = await page.evaluate(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }).then(function (r) { return r.violations.map(function (v) { return v.id + " (" + v.nodes.length + ")"; }); })`) as string[];
    masalah.push(...pelanggaran.map((v) => `axe ${v}`));
    if (w === 1280 || w === 320) {
      const tab: string[] = [];
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press("Tab");
        const f = await page.evaluate(`(function () { var a = document.activeElement; if (!a || a === document.body) return ""; var cs = getComputedStyle(a); var cincin = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2) || /rgb/.test(cs.boxShadow); return a.tagName.toLowerCase() + " «" + (a.getAttribute("aria-label") || a.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 50) + "»" + (cincin ? "" : "  NO RING"); })()`) as string;
        if (!f) break;
        tab.push(f);
        if (/NO RING/.test(f)) masalah.push(`no focus ring: ${f}`);
      }
      const pohon = await page.locator("#soal").ariaSnapshot();
      writeFileSync(join(JALAN, `${k.kode}-${w}.txt`), `${k.judul} at ${w} px: the Tab order from the top of the page\n${tab.map((x, i) => `${String(i + 1).padStart(2)}. ${x}`).join("\n")}\n\nThe accessibility tree of «Soal dalam paket ini»\n${pohon}\n`);
    }
    if (masalah.length) gagal++;
    laporan.push(`${masalah.length ? "FAIL" : "ok  "} ${k.kode} @${w}${masalah.length ? "\n      " + masalah.join("\n      ") : ""}`);
    await ctx.close();
  }
}
await browser.close();
const ringkas = `${KEADAAN.length} states × 4 widths: ${gagal} with a failure\n\n${laporan.join("\n")}\n`;
writeFileSync(join(RENDER, "laporan.txt"), ringkas);
console.log(ringkas);
process.exit(gagal ? 1 : 0);
