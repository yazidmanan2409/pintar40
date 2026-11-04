/**
 * C1 · W3.8 — the report body and its A4 print: Ringkasan Kelas and Ringkasan Sekolah.
 * Design specimen, not application code. Run from the repository root, after the design
 * system's harness has written its tokens (sistem-desain/render/tokens.css):
 *
 *   npx tsx docs/coordination/ux/completion-4.0/C1/buat-c1.mts
 *
 * Words: the copy table at engineering commit 0b19707, unchanged; the report title is
 * G6's labelled slot, never filled. Metric labels are the approved words in the copy
 * table («Peserta», «Kenaikan» …; G2 confirms their use at class and school level).
 * Figures, people and schools are invented: this specimen lays out values, it defines
 * and computes none.
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
const kerja = mkdtempSync(join(tmpdir(), "c1-"));
for (const f of ["hle.ts", "tanggal.ts"]) writeFileSync(join(kerja, f), execSync(`git show ${KOMIT}:src/lib/${f}`, { cwd: repo }));
const hle = await import(join(kerja, "hle.ts"));
const kata = (k: string, isi: Record<string, string | number> = {}) => {
  let v: string = hle.t(k, "educator", { locale: "id" });
  if (!v || v === k) throw new Error(`no words for ${k}`);
  for (const [a, b] of Object.entries(isi)) v = v.replace(`{${a}}`, String(b));
  return v;
};
const angka = (n: number) => hle.format.number(n, "id");
const persen = (x: number) => hle.format.percent(x, "id");
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ikon = (n: string) => `<i data-ikon="${n}"></i>`;
const slotMerek = `<span class="c1-slot" role="img" aria-label="Pintar (master pending F-11)">Pintar <small>(master pending F-11)</small></span>`;
/** G6 (D-135(e)): the report's title is Dr Gladys's. A labelled slot, never filled. */
const SLOT_JUDUL = { kelas: "[G6 · judul laporan kelas]", sekolah: "[G6 · judul laporan sekolah]" };
const slotJudul = (j: "kelas" | "sekolah") => `<span class="c1-slot-kata" data-slot="G6">${SLOT_JUDUL[j]}</span>`;

// ── the entries, as generate_report returns them (shape only) ──────────────
type Status = "ok" | "below_minimum" | "not_permitted" | "deprecated" | "no_evidence";
type Nilai = { jenis: "satu"; teks: string } | { jenis: "pita"; baris: Array<[string, number]>; populasi: [number, number, number] } | { jenis: "isi"; baris: Array<[string, string]> } | { jenis: "daftar"; baris: Array<[string, string]> };
type Entri = { label?: string; status: Status; nilai?: Nilai; kalimat?: string; ada?: [number, number]; muncul?: string };
const pernyataan: Record<Exclude<Status, "ok">, string> = {
  below_minimum: "laporan.metrik.belum_cukup_data", not_permitted: "laporan.metrik.bukan_untuk_anda",
  deprecated: "laporan.metrik.diganti", no_evidence: "laporan.metrik.belum_ada_bukti",
};

const PITA = (m: number, b: number, p: number, belum: number): Nilai => ({ jenis: "pita", baris: [["kesiapan.siap_sertifikasi", m], ["kesiapan.perlu_review", b], ["kesiapan.butuh_pendampingan", p], ["kesiapan.belum_post_test", belum]], populasi: [m + b + p + belum, m + b + p, belum] });
const KELAS_PENUH: Entri[] = [
  { label: "metrik.peserta.label", status: "ok", nilai: { jenis: "satu", teks: angka(28) }, kalimat: kata("metrik.peserta.arti") },
  { label: "metrik.pemahaman.label", status: "ok", nilai: { jenis: "satu", teks: persen(0.72) }, kalimat: kata("tindakan.lanjut") },
  { label: "metrik.kenaikan.label", status: "ok", nilai: { jenis: "satu", teks: `+${angka(18)} ${kata("mengajar.bukti.poin")}` }, kalimat: kata("tindakan.lanjut") },
  { label: "metrik.kesiapan.label", status: "ok", nilai: PITA(9, 11, 4, 4), kalimat: kata("tindakan.fokus_pita") },
  { label: "metrik.topik.label", status: "ok", nilai: { jenis: "isi", baris: [["Pecahan senilai", persen(0.81)], ["Menyederhanakan pecahan", persen(0.68)], ["Membandingkan pecahan", persen(0.54)], ["Pecahan dalam kehidupan sehari-hari", persen(0.7)]] }, kalimat: kata("metrik.topik.arti") },
  { label: "metrik.miskonsepsi.label", status: "ok", nilai: { jenis: "daftar", baris: [["Menjumlahkan alih-alih mengalikan", "Tunjukkan dengan model luas bahwa pembilang dan penyebut dikalikan dengan bilangan yang sama."], ["Menganggap penyebut yang lebih besar berarti pecahan yang lebih besar", "Bandingkan 1/4 dan 1/8 dengan potongan kue yang sama besar."]] }, kalimat: kata("metrik.miskonsepsi.arti") },
];
const KELAS_TANPA_IZIN: Entri[] = KELAS_PENUH.map((e, i) => (i === 5 ? { status: "not_permitted" } : e));
const KELAS_BELUM: Entri[] = [
  { label: "metrik.peserta.label", status: "ok", nilai: { jenis: "satu", teks: angka(3) }, kalimat: kata("metrik.peserta.arti") },
  { label: "metrik.pemahaman.label", status: "below_minimum", ada: [3, 5], muncul: "laporan.muncul.akhir" },
  { label: "metrik.kenaikan.label", status: "below_minimum", ada: [2, 5], muncul: "laporan.muncul.awal_akhir" },
  { label: "metrik.kesiapan.label", status: "below_minimum", ada: [3, 5], muncul: "laporan.muncul.akhir" },
  { label: "metrik.topik.label", status: "below_minimum", ada: [3, 5], muncul: "laporan.muncul.akhir" },
  { label: "metrik.miskonsepsi.label", status: "no_evidence", muncul: "laporan.muncul.miskonsepsi" },
];
const SEKOLAH_PENUH: Entri[] = [
  { label: "metrik.peserta_institusi.label", status: "ok", nilai: { jenis: "satu", teks: angka(412) }, kalimat: kata("metrik.peserta_institusi.arti") },
  { label: "metrik.kenaikan_institusi.label", status: "ok", nilai: { jenis: "satu", teks: `+${angka(14)} ${kata("mengajar.bukti.poin")}` }, kalimat: kata("tindakan.lanjut") },
  { label: "metrik.gerbang_keselamatan.label", status: "ok", nilai: { jenis: "satu", teks: persen(0.93) }, kalimat: kata("tindakan.fokus") },
  { label: "metrik.kredensial.label", status: "ok", nilai: { jenis: "satu", teks: angka(37) }, kalimat: kata("metrik.kredensial.arti") },
  { label: "metrik.kompetensi.label", status: "ok", nilai: { jenis: "daftar", baris: [["Bilangan", `${persen(0.74)} · ${angka(388)} murid`], ["Aljabar", `${persen(0.66)} · ${angka(301)} murid`], ["Geometri dan pengukuran", `${persen(0.69)} · ${angka(274)} murid`], ["Membaca teks informasi", `${persen(0.77)} · ${angka(352)} murid`]] }, kalimat: kata("metrik.kompetensi.arti") },
  { label: "metrik.perbandingan_kohort.label", status: "ok", nilai: { jenis: "daftar", baris: [["Kelas 7 (2026/2027)", `${persen(0.71)} · ${angka(140)} murid`], ["Kelas 8 (2026/2027)", `${persen(0.68)} · ${angka(138)} murid`], ["Kelas 9 (2026/2027)", `${persen(0.75)} · ${angka(134)} murid`], ["Kelas 7 (2025/2026)", `${persen(0.66)} · ${angka(129)} murid`]] }, kalimat: kata("metrik.perbandingan_kohort.arti") },
];
const SEKOLAH_KOSONG: Entri[] = [
  { label: "metrik.peserta_institusi.label", status: "no_evidence", ada: [0, 1], muncul: "laporan.muncul.penilaian" },
  { label: "metrik.kenaikan_institusi.label", status: "no_evidence", ada: [0, 10], muncul: "laporan.muncul.awal_akhir" },
  { label: "metrik.gerbang_keselamatan.label", status: "no_evidence", ada: [0, 10], muncul: "laporan.muncul.akhir" },
  { label: "metrik.kredensial.label", status: "no_evidence", muncul: "laporan.muncul.sertifikat" },
  { label: "metrik.kompetensi.label", status: "no_evidence", ada: [0, 10], muncul: "laporan.muncul.akhir" },
  { label: "metrik.perbandingan_kohort.label", status: "no_evidence", ada: [0, 5], muncul: "laporan.muncul.akhir" },
];

// ── one entry ────────────────────────────────────────────────────────────────
let nomor = 0;
function entriHtml(e: Entri): string {
  const id = `m${++nomor}`;
  // A metric the reader may not see carries no label: the refusal must not disclose what it withheld.
  const judul = e.label && e.status !== "not_permitted" ? `<h2 class="c1-m-judul" id="${id}">${kata(e.label)}</h2>` : "";
  const bagian = (kelas: string, isi: string) => `<section class="c1-m ${kelas}"${judul ? ` aria-labelledby="${id}"` : ` aria-label="${esc(kata(pernyataan.not_permitted))}"`}>${judul}${isi}</section>`;
  if (e.status !== "ok") {
    const isi = [kata(pernyataan[e.status]), e.ada ? kata("ketiadaan.jumlah.murid", { have: angka(e.ada[0]), needed: angka(e.ada[1]) }) : null, e.muncul ? kata(e.muncul) : null].filter(Boolean).map((x) => `<p>${x}</p>`).join("");
    return bagian(`c1-m-belum${e.status === "not_permitted" ? " c1-m-tanpa" : ""}${e.label && e.status !== "not_permitted" && isSatu(e) ? " c1-m-satu" : ""}`, `<div class="c1-ket">${isi}</div>`);
  }
  const n = e.nilai!;
  if (n.jenis === "satu") return bagian("c1-m-satu", `<p class="c1-stat">${n.teks}</p><p class="c1-kalimat">${e.kalimat}</p>`);
  if (n.jenis === "pita") return bagian("c1-m-lebar", `<p class="c1-kalimat">${e.kalimat}</p>
    <p class="c1-sub">${kata("kesiapan.pita.judul", { n: angka(n.populasi[1]) })}</p>
    <dl class="c1-isi">${n.baris.map(([k, v]) => `<div><dt>${kata(k)}</dt><dd>${angka(v)} <span>${kata("mengajar.bukti.murid")}</span></dd></div>`).join("")}</dl>
    <p class="c1-meta">${angka(n.populasi[0])} ${kata("kesiapan.populasi.murid")} · ${angka(n.populasi[1])} ${kata("kesiapan.populasi.sudah")} · ${angka(n.populasi[2])} ${kata("kesiapan.populasi.belum")}</p>
    <p class="c1-meta">${kata("kesiapan.catatan")}</p>`);
  if (n.jenis === "isi") return bagian("c1-m-lebar", `<p class="c1-kalimat">${e.kalimat}</p><dl class="c1-isi">${n.baris.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("")}</dl>`);
  return bagian("c1-m-lebar", `<p class="c1-kalimat">${e.kalimat}</p><ul class="c1-daftar">${n.baris.map(([k, v]) => `<li><strong>${esc(k)}</strong><span>${esc(v)}</span></li>`).join("")}</ul>`);
}
const isSatu = (e: Entri) => ["metrik.peserta.label", "metrik.pemahaman.label", "metrik.kenaikan.label", "metrik.peserta_institusi.label", "metrik.kenaikan_institusi.label", "metrik.gerbang_keselamatan.label", "metrik.kredensial.label"].includes(e.label ?? "");
/** Template order is the school's (W8-02). Consecutive single figures share a row; everything else is full width. */
function badan(entri: Entri[]): string {
  const out: string[] = [];
  let baris: string[] = [];
  const tutup = () => { if (baris.length) { out.push(`<div class="c1-baris-satu">${baris.join("")}</div>`); baris = []; } };
  for (const e of entri) {
    const satu = (e.status === "ok" && e.nilai?.jenis === "satu") || (e.status !== "ok" && e.status !== "not_permitted" && isSatu(e));
    if (satu) baris.push(entriHtml(e)); else { tutup(); out.push(entriHtml(e)); }
  }
  tutup();
  return out.join("");
}

// ── the page ─────────────────────────────────────────────────────────────────
const WAKTU = "4 Nov 2026, 10.52 WIB";
const SEKOLAH = "SMP Cahaya Kaliandra";
type Lembar = { kode: string; judul: string; jenis: "kelas" | "sekolah"; entri: Entri[] | null; cetak?: boolean };
function halaman(l: Lembar): string {
  nomor = 0;
  const kelas = l.jenis === "kelas";
  const h1 = kelas ? "Kelas 7A" : SEKOLAH;
  // BarisLingkup: the school, the class, its school year (three levels: the Breadcrumb's rule). The school report names
  // no single year (it covers every one), so it has no scope line: the school is its title.
  const lingkup = kelas ? `<ol class="pds-scope" aria-label="Lokasi"><li><span>${SEKOLAH}</span></li><li><span>Kelas 7A</span></li><li><span aria-current="page">TA 2026/2027</span></li></ol>` : "";
  const ada = l.entri && l.entri.length > 0;
  const semuaKosong = ada && l.entri!.every((e) => e.status !== "ok");
  const tempat: Array<[string, string]> = [["Pimpinan", "chart-no-axes-column"], ["Studio", "square-pen"]];
  const kepalaCetak = `${SLOT_JUDUL[l.jenis]} · ${SEKOLAH}${kelas ? " · Kelas 7A · TA 2026/2027" : ""}`;
  return `<style>@page { @top-left { content: "${kepalaCetak.replace(/"/g, '\\"')}"; } @top-right { content: "${WAKTU}"; } }</style>
  <div class="pds pds-jalan c1">
  <section class="pds-lewati-induk" data-shell data-shell-statis aria-label="${esc(l.judul)}">
  <a class="pds-lewati" href="#c1-isi">Langsung ke isi</a>
  <div class="pds-shell-host"><div class="pds-shell">
    <nav class="pds-nav" aria-label="${kata("nav.tempat")}">
      <div class="pds-nav-kepala">${slotMerek}</div>
      <ul class="pds-nav-daftar">${tempat.map(([t, i], n) => `<li><a href="#" class="pds-nav-item"${n === 0 ? ' aria-current="page"' : ""}>${ikon(i)}<span class="pds-nav-label">${t}</span></a></li>`).join("")}</ul>
      <div class="pds-nav-bawah"><div class="pds-identity" style="cursor:default"><span class="pds-avatar" aria-hidden="true">EP</span><div><strong>Eko Prasetyo</strong><small>Kepala departemen · ${SEKOLAH}</small></div></div>
      <button type="button" class="pds-nav-item pds-nav-keluar">${ikon("log-out")}<span class="pds-nav-label">${kata("sesi.keluar")}</span></button></div>
    </nav>
    <div class="pds-main">
      <header class="pds-bar">${slotMerek}<span class="pds-bar-tempat" aria-hidden="true">Pimpinan</span><button type="button" class="pds-btn pds-btn-secondary">${kata("sesi.keluar")}</button><button type="button" class="pds-btn pds-btn-icon" aria-label="${kata("nav.menu")}">${ikon("menu")}</button></header>
      <main class="pds-main-isi c1-isi-utama" id="c1-isi" tabindex="-1">
        ${lingkup}
        <div class="pds-pagehead c1-kepala"><div>
          <p class="c1-alis">${slotJudul(l.jenis)}</p>
          <h1 class="pds-title">${h1}</h1>
          ${l.entri ? `<p class="pds-intro">${kata(kelas ? "laporan.cakupan.kelas" : "laporan.cakupan.sekolah", { waktu: WAKTU })}</p>` : ""}
        </div>
        <div class="pds-actions c1-aksi"><a href="#" class="pds-back">${ikon("chevron-left")}${kata("nav.pimpinan", "staff")}</a><button type="button" class="pds-btn pds-btn-secondary">${kata("laporan.cetak")}</button></div></div>
        ${!ada ? `<div class="pds-empty"><p>${kata("laporan.kosong")}</p></div>` : `${semuaKosong ? `<div class="pds-well"><p>${kata("laporan.tak_ada_angka")}</p></div>` : ""}<div class="c1-badan">${badan(l.entri!)}</div>`}
      </main>
    </div>
  </div></div></section></div>`;
}

const LEMBAR: Lembar[] = [
  { kode: "kelas-penuh", judul: "Ringkasan Kelas · every figure shown", jenis: "kelas", entri: KELAS_PENUH, cetak: true },
  { kode: "kelas-tanpa-izin", judul: "Ringkasan Kelas · one figure not shown for this reader", jenis: "kelas", entri: KELAS_TANPA_IZIN },
  { kode: "kelas-belum", judul: "Ringkasan Kelas · under five («not yet»)", jenis: "kelas", entri: KELAS_BELUM, cetak: true },
  { kode: "kelas-kosong", judul: "Ringkasan Kelas · nothing to show", jenis: "kelas", entri: null },
  { kode: "sekolah-penuh", judul: "Ringkasan Sekolah · every school year", jenis: "sekolah", entri: SEKOLAH_PENUH, cetak: true },
  { kode: "sekolah-tanpa-angka", judul: "Ringkasan Sekolah · no figure yet, each said why", jenis: "sekolah", entri: SEKOLAH_KOSONG },
];

// ── render and check ─────────────────────────────────────────────────────────
const GAYA = readFileSync(join(sini, "c1.css"), "utf8");
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
  writeFileSync(join(sini, `${l.kode}.html`), html);
  for (const w of [1280, 820, 390, 320]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(RENDER, `${l.kode}-${w}.png`), fullPage: true });
    const masalah: string[] = [];
    const ukur = await page.evaluate(`(() => {
      var kecil = [];
      document.querySelectorAll("a, button, select, input").forEach(function (e) { var r = e.getBoundingClientRect(); if (!r.width) return; if (r.height < 24 || r.width < 24) kecil.push(e.tagName + " " + Math.round(r.width) + "x" + Math.round(r.height)); });
      var tanpa = [].filter.call(document.querySelectorAll(".c1-m-tanpa"), function (m) { return m.querySelector("h2"); }).length;
      var tanpaKalimat = [].filter.call(document.querySelectorAll(".c1-m:not(.c1-m-belum)"), function (m) { return !m.querySelector(".c1-kalimat") || !m.querySelector(".c1-kalimat").textContent.trim(); }).length;
      var slot = document.querySelectorAll("[data-slot=G6]").length;
      return { lebar: document.documentElement.scrollWidth, kecil: kecil, tanpa: tanpa, tanpaKalimat: tanpaKalimat, slot: slot,
        mentah: (document.body.innerText.match(/\\b(metrik|laporan|kesiapan|tindakan)\\.[a-z_.]+/g) || []) };
    })()`) as { lebar: number; kecil: string[]; tanpa: number; tanpaKalimat: number; slot: number; mentah: string[] };
    if (ukur.lebar > w + 1) masalah.push(`sideways scroll ${ukur.lebar} at ${w}`);
    if (ukur.kecil.length) masalah.push(`targets under 24 px: ${ukur.kecil.join(", ")}`);
    if (ukur.tanpa) masalah.push("a withheld figure discloses its label");
    if (ukur.tanpaKalimat) masalah.push("a figure without its sentence (S-3)");
    if (ukur.slot !== 1) masalah.push("the G6 title slot is not drawn exactly once");
    if (ukur.mentah.length) masalah.push(`raw keys: ${ukur.mentah.join(", ")}`);
    if (l.entri) {
      const judulKini = await page.evaluate(`[].map.call(document.querySelectorAll(".c1-m-judul"), function (h) { return h.textContent; })`) as string[];
      const harap = l.entri.filter((e) => e.label && e.status !== "not_permitted").map((e) => kata(e.label!));
      if (judulKini.join("|") !== harap.join("|")) masalah.push("figures out of the template's order");
    }
    await page.addScriptTag({ content: axe });
    const pelanggaran = await page.evaluate(`axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }).then(function (r) { return r.violations.map(function (v) { return v.id + " (" + v.nodes.length + ": " + v.nodes.slice(0,2).map(function(n){return n.target.join(" ");}).join(" | ") + ")"; }); })`) as string[];
    masalah.push(...pelanggaran.map((v) => `axe ${v}`));
    if (w === 1280 || w === 320) {
      const tab: string[] = [];
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press("Tab");
        const f = await page.evaluate(`(function () { var a = document.activeElement; if (!a || a === document.body) return ""; var cs = getComputedStyle(a); var cincin = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2) || /rgb/.test(cs.boxShadow); return a.tagName.toLowerCase() + " «" + (a.getAttribute("aria-label") || a.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 50) + "»" + (cincin ? "" : "  NO RING"); })()`) as string;
        if (!f) break;
        tab.push(f);
        if (/NO RING/.test(f)) masalah.push(`no focus ring: ${f}`);
      }
      const pohon = await page.locator("main").ariaSnapshot();
      writeFileSync(join(JALAN, `${l.kode}-${w}.txt`), `${l.judul} at ${w} px: the Tab order from the top of the page\n${tab.map((x, i) => `${String(i + 1).padStart(2)}. ${x}`).join("\n")}\n\nThe accessibility tree of the main region\n${pohon}\n`);
    }
    if (masalah.length) gagal++;
    laporan.push(`${masalah.length ? "FAIL" : "ok  "} ${l.kode} @${w}${masalah.length ? "\n      " + masalah.join("\n      ") : ""}`);
    await ctx.close();
  }
  if (l.cetak) {
    const ctx = await browser.newContext({ viewport: { width: 794, height: 1123 } });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(RENDER, `${l.kode}-a4.png`), fullPage: true });
    // the browser's own print: @page margins and margin boxes are the page's CSS, not the PDF call's
    await page.pdf({ path: join(RENDER, `${l.kode}-a4.pdf`), preferCSSPageSize: true, printBackground: true });
    const halamanPdf = Number(/Pages:\s+(\d+)/.exec(execSync(`pdfinfo "${join(RENDER, `${l.kode}-a4.pdf`)}"`).toString())?.[1] ?? 0);
    const kepalaAda = html.includes(`@top-left { content: "${SLOT_JUDUL[l.jenis]}`);
    const harapHal: Record<string, number> = { "kelas-penuh": 2, "kelas-belum": 1, "sekolah-penuh": 2 };
    if (halamanPdf !== harapHal[l.kode]) { gagal++; laporan.push(`FAIL ${l.kode} @A4 pages ${halamanPdf}, expected ${harapHal[l.kode]}`); }
    if (!kepalaAda) { gagal++; laporan.push(`FAIL ${l.kode} @A4 header line without the G6 slot`); }
    const tampak = await page.evaluate(`[".pds-nav", ".pds-bar", ".pds-lewati", ".c1-aksi"].filter(function (s) { var e = document.querySelector(s); return e && e.offsetParent !== null; })`) as string[];
    if (tampak.length) { gagal++; laporan.push(`FAIL ${l.kode} @A4\n      printed: ${tampak.join(", ")}`); } else laporan.push(`ok   ${l.kode} @A4`);
    await ctx.close();
  }
}
await browser.close();
const ringkas = `${LEMBAR.length} pages × 4 widths (+ A4 for ${LEMBAR.filter((l) => l.cetak).length}): ${gagal} with a failure\n\n${laporan.join("\n")}\n`;
writeFileSync(join(RENDER, "laporan.txt"), ringkas);
console.log(ringkas);
process.exit(gagal ? 1 : 0);
