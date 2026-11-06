/**
 * A3 · D3 — the Uji Cepat class figure for a small group: one presentation per option the
 * owner may choose under O3 (a threshold of 5, another threshold, or none), and zero scored
 * learners under every option. Drawn now, built only after O3. Specimen, not application code:
 *
 *   npx tsx docs/coordination/ux/completion-4.0/A3/buat-a3.mts
 *
 * The page is A2's accepted composition. Under a threshold the figure follows D-172's «not yet»
 * pattern (P14), as the reports' figures do. People and scores are invented.
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
const kerja = mkdtempSync(join(tmpdir(), "a3-"));
for (const f of ["hle.ts", "tanggal.ts"]) writeFileSync(join(kerja, f), execSync(`git show 0b19707:src/lib/${f}`, { cwd: repo }));
const hle = await import(join(kerja, "hle.ts"));
/** A2's accepted words, and A3's two new ones (README §5). */
const NEW: Record<string, string> = {
  "mengajar.cepat.hasil.kelas": "Rata-rata nilai kelas",
  "mengajar.cepat.hasil.belum": "Belum ada nilai. Rata-rata nilai kelas muncul di sini setelah ada yang mengumpulkan.",
  "mengajar.cepat.hasil.belum_cukup": "Belum cukup nilai untuk menampilkan rata-rata kelas.",
  "mengajar.cepat.hasil.muncul": "Rata-rata nilai kelas muncul setelah cukup murid dinilai.",
};
const kata = (k: string, isi: Record<string, string | number> = {}) => {
  let v: string = NEW[k] ?? hle.t(k, "educator", { locale: "id" });
  if (!v || v === k || v === "—") throw new Error(`no words for ${k}`);
  for (const [a, b] of Object.entries(isi)) v = v.replace(`{${a}}`, String(b));
  return v;
};
const angka = (n: number) => hle.format.number(n, "id");
const persen = (x: number) => hle.format.percent(x, "id");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ikon = (n: string) => `<i data-ikon="${n}"></i>`;
const slotMerek = `<span class="pds-merek">PINTAR</span>`;
const TOTAL = 28;
const NAMA = ["Adinda Putri", "Bagas Saputra", "Cahya Ramadhani", "Dimas Pratama", "Elok Wulandari", "Fajar Nugroho"];

type Lembar = { kode: string; judul: string; ambang: number | null; dinilai: number[]; sedang: number };
function halaman(l: Lembar): string {
  const n = l.dinilai.length;
  const rata = n ? l.dinilai.reduce((a, b) => a + b, 0) / n : 0;
  const tampil = n > 0 && (l.ambang === null || n >= l.ambang);
  const dasar = kata("mengajar.cepat.hasil.dasar", { n: angka(n), total: angka(TOTAL), benda: kata("mengajar.bukti.murid") });
  // the class first (A2 K4): the figure, its base at body size, its explanation; or, under a threshold, «not yet» (P14)
  const kelas = n === 0
    ? `<div class="pds-empty" data-a3="nol"><p>${kata("mengajar.cepat.hasil.belum")}</p></div>`
    : tampil
      ? `<section class="c1-m c1-m-satu a3-kelas" aria-label="${kata("mengajar.cepat.hasil.kelas")}" data-a3="angka"><p class="c1-m-judul">${kata("mengajar.cepat.hasil.kelas")}</p><p class="c1-stat">${persen(rata)}</p><p class="a3-dasar">${dasar}</p><p class="c1-meta">${kata("mengajar.cepat.hasil.arti")}</p></section>`
      : `<section class="c1-m c1-m-satu c1-m-belum a3-kelas" aria-label="${kata("mengajar.cepat.hasil.kelas")}" data-a3="belum"><p class="c1-m-judul">${kata("mengajar.cepat.hasil.kelas")}</p><div class="c1-ket"><p>${kata("mengajar.cepat.hasil.belum_cukup")}</p><p>${kata("ketiadaan.jumlah.murid", { have: angka(n), needed: angka(l.ambang!) })}</p><p>${kata("mengajar.cepat.hasil.muncul")}</p></div><p class="a3-dasar">${dasar}</p></section>`;
  // one step below (A2 K6): each learner, alphabetical; every option keeps the rows (this teacher already sees each score)
  const baris = NAMA.map((nm, i) => {
    const k = i < n ? "sudah" : i < n + l.sedang ? "sedang" : "belum";
    const badge = k === "sudah" ? `<span class="pds-badge pds-badge-ok">${ikon("check")}${kata("mengajar.siapa.sudah")}</span>` : k === "sedang" ? `<span class="pds-badge pds-badge-info">${kata("mengajar.siapa.sedang")}</span>` : `<span class="pds-badge">${kata("mengajar.siapa.belum")}</span>`;
    const nilai = k === "sudah" ? persen(l.dinilai[i]) : k === "sedang" ? "—" : "—";
    return `<tr><td>${nm}</td><td>${badge}</td><td class="pds-angka">${nilai}</td></tr>`;
  }).join("");
  const rincian = `<section class="pds-section" aria-labelledby="a3-rinci"><h2 id="a3-rinci">${kata("mengajar.cepat.hasil.rincian")}</h2><p class="pds-intro">${kata("mengajar.cepat.hasil.rincian.arti")}</p>
    <div class="pds-table-wrap"><table class="pds-table"><caption class="pds-sr">${kata("mengajar.cepat.hasil.rincian")} · Kelas 7A</caption><thead><tr><th scope="col">${kata("mengajar.cepat.hasil.kolom.nama")}</th><th scope="col">${kata("mengajar.cepat.hasil.kolom.keadaan")}</th><th scope="col" class="pds-angka">${kata("mengajar.cepat.hasil.kolom.nilai")}</th></tr></thead><tbody>${baris}</tbody></table></div>
    <nav class="pds-pager" aria-label="${esc(kata("koleksi.halaman.label", { benda: "murid" }))}"><span>${kata("koleksi.menampilkan", { dari: "1", sampai: "6", total: angka(TOTAL), benda: "murid" })}</span><span class="pds-pager-gerak"><span class="pds-btn pds-btn-secondary" aria-disabled="true">${ikon("chevron-left")}<span class="pds-btn-teks">${kata("koleksi.sebelumnya")}</span></span><span class="pds-pager-posisi">${kata("koleksi.posisi", { n: "1", total: "5" })}</span><a href="#" class="pds-btn pds-btn-secondary"><span class="pds-btn-teks">${kata("koleksi.berikutnya")}</span>${ikon("chevron-right")}</a></span></nav></section>`;
  return `<div class="pds pds-jalan c1">
  <section class="pds-lewati-induk" data-shell data-shell-statis aria-label="${esc(l.judul)}">
  <a class="pds-lewati" href="#a3-isi">Langsung ke isi</a>
  <div class="pds-shell-host"><div class="pds-shell">
    <nav class="pds-nav" aria-label="${kata("nav.tempat")}"><div class="pds-nav-kepala">${slotMerek}</div>
      <ul class="pds-nav-daftar"><li><a href="#" class="pds-nav-item" aria-current="page">${ikon("users")}<span class="pds-nav-label">Mengajar</span></a></li><li><a href="#" class="pds-nav-item">${ikon("square-pen")}<span class="pds-nav-label">Studio</span></a></li></ul>
      <div class="pds-nav-bawah"><div class="pds-identity" style="cursor:default"><span class="pds-avatar" aria-hidden="true">CL</span><div><strong>Citra Lestari</strong><small>Guru · SMP Cahaya Kaliandra</small></div></div>
      <button type="button" class="pds-nav-item pds-nav-keluar">${ikon("log-out")}<span class="pds-nav-label">${kata("sesi.keluar")}</span></button></div></nav>
    <div class="pds-main">
      <header class="pds-bar">${slotMerek}<span class="pds-bar-tempat" aria-hidden="true">Mengajar</span><button type="button" class="pds-btn pds-btn-secondary">${kata("sesi.keluar")}</button><button type="button" class="pds-btn pds-btn-icon" aria-label="${kata("nav.menu")}">${ikon("menu")}</button></header>
      <main class="pds-main-isi" id="a3-isi" tabindex="-1">
        <p><a href="#" class="pds-back">${ikon("chevron-left")}${kata("mengajar.cepat.hasil.kembali")}</a></p>
        <ol class="pds-scope" aria-label="Lokasi"><li><a href="#">SMP Cahaya Kaliandra</a></li><li><a href="#">Kelas 7A</a></li><li><span aria-current="page">TA 2026/2027</span></li></ol>
        <div class="pds-pagehead"><div><p class="c1-alis-biasa">${kata("mengajar.cepat.eyebrow")} · Bab 3 · Pecahan senilai</p><h1 class="pds-title">${kata("mengajar.cepat.hasil.judul")}</h1></div></div>
        ${kelas}
        <div class="pds-actions"><a href="#" class="pds-btn pds-btn-secondary">${kata("mengajar.bukti.per_soal")}</a></div>
        ${rincian}
      </main></div></div></div></section></div>`;
}

const LEMBAR: Lembar[] = [
  { kode: "ambang5-kurang", judul: "Threshold 5 (O3 a) · 3 of 28 scored: not yet", ambang: 5, dinilai: [0.9, 0.7, 0.8], sedang: 2 },
  { kode: "ambang5-cukup", judul: "Threshold 5 (O3 a) · 5 of 28 scored: the figure", ambang: 5, dinilai: [0.9, 0.7, 0.8, 0.6, 0.75], sedang: 1 },
  { kode: "ambangN-kurang", judul: "Another threshold, here 10 (O3 b) · 7 of 28 scored: not yet", ambang: 10, dinilai: [0.9, 0.7, 0.8, 0.6, 0.75, 0.85, 0.65], sedang: 0 },
  { kode: "tanpa-ambang", judul: "No threshold (O3 c, today) · 1 of 28 scored: the figure, its base read with it", ambang: null, dinilai: [1], sedang: 3 },
  { kode: "nol", judul: "Zero scored · the same under every option", ambang: 5, dinilai: [], sedang: 4 },
];

const C1 = join(repo, "docs/coordination/ux/completion-4.0/C1");
const GAYA = readFileSync(join(C1, "c1.css"), "utf8") + readFileSync(join(C1, "c1b.css"), "utf8") + `
.a3-kelas { max-width: var(--measure-narrow); }
/* A2 K4: the base is part of the figure: body size, ink-1, directly under it — in every option */
.a3-dasar { font-size: 16px; line-height: 24px; color: var(--ink-1); }
.pds-pager [aria-disabled="true"] { color: var(--ink-3); cursor: default; }`;
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
for (const l of LEMBAR) {
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(l.judul)}</title><style>${tokens}</style><style>${bundleCss}</style><style>${GAYA}</style><script>${bundleJs}</script></head><body>${halaman(l)}<script>Pintar.siapkan();</script></body></html>`;
  writeFileSync(join(RENDER, `${l.kode}.html`), html);
  const n = l.dinilai.length;
  const harap = n === 0 ? "nol" : l.ambang === null || n >= l.ambang ? "angka" : "belum";
  for (const w of [1280, 820, 390, 320]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(RENDER, `${l.kode}-${w}.png`), fullPage: true });
    const masalah: string[] = [];
    const u = await page.evaluate(`(() => {
      var k = document.querySelector("[data-a3]"); var kecil = [];
      document.querySelectorAll("a, button").forEach(function (e) { var r = e.getBoundingClientRect(); if (!r.width) return; if (r.height < 24 || r.width < 24) kecil.push(e.tagName + " " + Math.round(r.width) + "x" + Math.round(r.height)); });
      var dasar = document.querySelector(".a3-dasar");
      return { lebar: document.documentElement.scrollWidth, kecil: kecil, keadaan: k ? k.getAttribute("data-a3") : "", angka: !!document.querySelector(".a3-kelas .c1-stat"),
        dasar: dasar ? parseFloat(getComputedStyle(dasar).fontSize) : 0, baris: document.querySelectorAll(".pds-table tbody tr").length,
        pertama: (function () { var m = document.querySelector("main"); var kids = [].filter.call(m.children, function (c) { return !c.matches("p, ol, .pds-pagehead"); }); return kids[0] === k; })() };
    })()`) as { lebar: number; kecil: string[]; keadaan: string; angka: boolean; dasar: number; baris: number; pertama: boolean };
    if (u.lebar > w + 1) masalah.push(`sideways scroll ${u.lebar} at ${w}`);
    if (u.kecil.length) masalah.push(`targets under 24 px: ${u.kecil.join(", ")}`);
    if (u.keadaan !== harap) masalah.push(`class state «${u.keadaan}», expected «${harap}»`);
    if (harap !== "angka" && u.angka) masalah.push("a class figure under the threshold");
    if (harap !== "nol" && u.dasar < 16) masalah.push("the base smaller than body size");
    if (!u.pertama) masalah.push("the class panel is not the first content");
    if (u.baris !== NAMA.length) masalah.push("the drill-down lost its rows");
    await page.addScriptTag({ content: axe });
    const v = await page.evaluate(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }).then(function (r) { return r.violations.map(function (v) { return v.id + " (" + v.nodes.length + ")"; }); })`) as string[];
    masalah.push(...v.map((x) => `axe ${x}`));
    if (w === 1280 || w === 320) writeFileSync(join(JALAN, `${l.kode}-${w}.txt`), `${l.judul} at ${w} px\n\n${await page.locator("main").ariaSnapshot()}\n`);
    if (masalah.length) gagal++;
    laporan.push(`${masalah.length ? "FAIL" : "ok  "} ${l.kode} @${w}${masalah.length ? "\n      " + masalah.join("\n      ") : ""}`);
    await ctx.close();
  }
}
await browser.close();
const ringkas = `${LEMBAR.length} states × 4 widths: ${gagal} with a failure\n\n${laporan.join("\n")}\n`;
writeFileSync(join(RENDER, "laporan.txt"), ringkas);
console.log(ringkas);
process.exit(gagal ? 1 : 0);
