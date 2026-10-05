/**
 * Sertifikat PINTAR, round 2: THE WORDMARK CORRECTION (5 Oct). Run from the repository root:
 *
 *   KARTU_PY=/path/to/venv/bin/python npx tsx docs/coordination/ux/sertifikat/ronde-2/merek-pintar.mts
 *
 * KARTU_PY is the Python buat-ronde2.mts uses (segno, for the QR the certificates carry).
 * The certificate's design freeze was reopened for one thing only: the canonical PINTAR wordmark
 * replaces «PINTAR SELALU» in the header. This script draws the certificates before and after from
 * the one grammar in sertifikat2.mts (the "before" is the same sheet with the old line put back),
 * measures the header on each, and writes render/J-merek-PINTAR.png and render/J-laporan.txt. It
 * exits non-zero if a check fails. The wordmark is a PROOF in the viewer's stand-in face (Helvetica
 * Neue is not available here); the print proof is re-made from the outlined master once the font
 * licence is verified.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { t, format, type HleEvent } from "../../../../../src/lib/hle.js";
import * as S from "./sertifikat2.mjs";

const AKAR = process.cwd();
const DIR = join(AKAR, "docs/coordination/ux/sertifikat/ronde-2");
const RENDER = join(DIR, "render");
const KERJA = join(tmpdir(), "sertifikat-merek");
mkdirSync(RENDER, { recursive: true });
mkdirSync(KERJA, { recursive: true });
const PY = process.env.KARTU_PY ?? "python3";

// The words: the app's copy table (D-014), as buat-ronde2.mts takes them.
const s = (k: string, persona: "learner" | "public" = "learner") => t(k as HleEvent, persona, { locale: "id" });
const KATA: S.Kata = {
  jenis: s("sertifikat.jenis"), diberikan: s("sertifikat.diberikan"), predikat: s("sertifikat.predikat"),
  tanggal: s("sertifikat.tanggal"), nomor: s("sertifikat.nomor"), periksa: s("sertifikat.periksa.judul"),
  arti: s("sertifikat.periksa.arti"), penerbit: s("verifikasi.institusi", "public"),
};

// The same invented samples as buat-ronde2.mts, with the symbol it proposes (uppercase alphanumeric, Q).
const ASAL = "https://verifikasi.pintarselalu.com/";
const TGL = format.date("2026-09-14T02:12:40Z", "id");
type Isi = Omit<S.Data, "isiQr" | "tautan" | "matriks" | "tanggal">;
const SAMPEL: Array<[Isi, string]> = [
  [{ sekolah: "SMP Cahaya Kaliandra", nama: "Bagas Saputra", kursus: "Matematika · Bab 4: Sistem Persamaan Linear", predikat: "Sangat Baik", nomor: "7Q2Z0D9K/00001", konteks: "ACADEMIC" }, "K7M4QX9P2HDT"],
  [{ sekolah: "SMP Cahaya Kaliandra", nama: "Ratna Dewi Kusumawardani", kursus: "Pengembangan Profesi · Merancang Asesmen Formatif di Kelas", predikat: "Baik", nomor: "A14CD7ST/00001", konteks: "PROFESSIONAL_DEVELOPMENT" }, "3GW8N5RDZ1VB"],
  [{ sekolah: "Sekolah Menengah Kejuruan Teknologi dan Rekayasa Nusa Kaliandra Timur", nama: "Ni Luh Putu Ayu Kartika Maharani Suryaningsih", kursus: "Ilmu Pengetahuan Alam · Bab 7: Ekosistem, Interaksi Antarmakhluk Hidup, dan Pengaruh Manusia terhadap Keseimbangan Lingkungan", predikat: "Sangat Baik", nomor: "Q8ZB2D0S/00017", konteks: "ACADEMIC" }, "Q9TZ4M1XHE7C8KRD"],
];
const qr = JSON.parse(execFileSync(PY, [join(DIR, "qr.py"), JSON.stringify(SAMPEL.map(([, tok]) => [(ASAL + tok).toUpperCase(), "alphanumeric", "Q"]))]).toString()) as Array<{ matriks: number[][] }>;
const [A, P, L] = SAMPEL.map(([d, tok], i): S.Data => ({ ...d, tanggal: TGL, isiQr: (ASAL + tok).toUpperCase(), tautan: (ASAL + tok).replace(/^https:\/\//, ""), matriks: qr[i].matriks }));

// The old header exactly as the frozen sheet set it (round 2, 30 Sep), for the "before".
const mm = (v: number) => `${+v.toFixed(3)}mm`;
const sebelum = (html: string, d: S.Data) => html.replace(/<div class="abs s2-kepala"[\s\S]*?PINTAR<\/p><\/div>/, `<p class="abs t-kepala merek-jenis" style="left:${mm(S.TATA.tepi)};top:${mm(S.TATA.atas)};color:${S.AKSEN[d.konteks]}">${KATA.jenis}</p>
<p class="abs t-kepala merek-lama" style="right:${mm(S.TATA.tepi)};top:${mm(S.TATA.atas)};color:${S.WARNA.hijau};margin-right:-0.12em">PINTAR SELALU</p>`);

const sr = (d: S.Data) => S.sertifikat(d, KATA);
const LEBAR = 120; // each sheet drawn at 120 mm wide on the review page
const lembar = (html: string, ket: string, data = "") => `<figure ${data}><div class="kecil" style="width:${LEBAR}mm;height:${(LEBAR * S.A4.h) / S.A4.w}mm"><div style="zoom:${LEBAR / S.A4.w}">${html}</div></div><figcaption>${ket}</figcaption></figure>`;
const sudut = (html: string, data: string) => `<div class="jendela" ${data}><div>${html}</div></div>`;
const X = 3.15;
const halaman = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Sertifikat PINTAR · koreksi merek</title>
<style>${S.css(AKAR)}
html, body { margin: 0; } body { background: #E6E3DC; color: #1F2A33; font-family: 'Plus Jakarta Sans'; }
.lembar { padding: 8mm; width: 400mm; }
h1 { font: 600 13pt 'Plus Jakarta Sans'; margin: 0 0 1.4mm; } h2 { font: 600 9.5pt 'Plus Jakarta Sans'; margin: 7mm 0 3mm; }
.sub { font: 400 8pt/1.5 'Plus Jakarta Sans'; color: #4E5A64; margin: 0 0 4mm; max-width: 300mm; }
.baris { display: flex; gap: 8mm; align-items: flex-start; }
figure { margin: 0; } figcaption { font: 400 7.5pt/1.45 'Plus Jakarta Sans'; color: #4E5A64; margin-top: 2mm; max-width: ${LEBAR}mm; }
.kecil { overflow: hidden; box-shadow: 0 0.4mm 1.2mm rgba(0,0,0,.18); }
.jendela { width: 190mm; height: 42mm; overflow: hidden; position: relative; background: #FBFAF7; box-shadow: 0 0.4mm 1.2mm rgba(0,0,0,.18); }
.jendela > div { transform: scale(2); transform-origin: 0 0; position: absolute; left: -${2 * 105}mm; top: -${2 * 12}mm; }
.ruang { position: absolute; outline: 0.12mm dashed #808A91; pointer-events: none; }
</style></head><body><div class="lembar">
<h1>Sertifikat PINTAR: the wordmark correction (5 Oct)</h1>
<p class="sub">The freeze is reopened only to replace «PINTAR SELALU» with the canonical PINTAR wordmark. Nothing else on the certificate changes: not the layout, the information, the colours, the type or the dimensions. «SERTIFIKAT PENGUASAAN» stays exactly where it was; the wordmark takes the old line's place at the right margin, on the same baseline, at the same cap height (${X} mm, the header's), in the same green. The wordmark here is a proof in a stand-in face; the print proof is re-made from the outlined master.</p>
<h2>Before and after (the academic sample)</h2>
<div class="baris">${lembar(sebelum(sr(A), A), "Before: «PINTAR SELALU» in Plus Jakarta Sans 600, 12 pt, tracked 0.12 em", 'data-peran="sebelum"')}${lembar(sr(A), `After: the PINTAR wordmark, cap height ${X} mm, on the header's baseline`, 'data-peran="sesudah" data-nama="Akademik (Bagas Saputra)"')}</div>
<h2>The header's right half at 2×, with the wordmark's clear space (X = ${X} mm) dashed</h2>
${sudut(sebelum(sr(A), A), "")}<div style="height:4mm"></div>${sudut(sr(A), 'data-zum="sesudah"')}
<h2>The other samples, after</h2>
<div class="baris">${lembar(sr(P), "Professional learning (Ratna Dewi Kusumawardani)", 'data-peran="sesudah" data-nama="Profesional (Ratna Dewi Kusumawardani)"')}${lembar(sr(L), "The longest name, school and course", 'data-peran="sesudah" data-nama="Terpanjang (Ni Luh Putu Ayu …)"')}</div>
</div></body></html>`;

const require_ = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require_("playwright");
const browser = await chromium.launch({ args: ["--force-color-profile=srgb"] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.addInitScript("window.__name = (f) => f"); // tsx names the helpers inside evaluate(); the page needs the shim
const f = join(KERJA, "merek.html");
writeFileSync(f, halaman);
await p.goto(`file://${f}`);
await p.evaluate(() => document.fonts.ready);

// Measure in sheet millimetres (each sheet is zoomed; divide by its zoom). The title's box before and
// after must be the same; the wordmark's cap height is the trimmed box; its baseline is its bottom.
type Kotak = { kiri: number; atas: number; kanan: number; bawah: number };
type Ukur = { nama: string; judulSebelum: Kotak; judul: Kotak; dasarJudul: number; merek: Kotak; tepiKanan: number; namaAtas: number };
const ukur: Ukur[] = await p.evaluate((lebar) => {
  const px = 96 / 25.4;
  const kotak = (el: Element, s2: Element, z: number) => {
    const a = s2.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { kiri: (r.left - a.left) / px / z, atas: (r.top - a.top) / px / z, kanan: (r.right - a.left) / px / z, bawah: (r.bottom - a.top) / px / z };
  };
  // The title's baseline: a zero-height inline-block at the end of its line sits on the baseline.
  const dasar = (el: Element, s2: Element, z: number) => {
    const m = document.createElement("span"); m.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
    el.appendChild(m); const b = (m.getBoundingClientRect().top - s2.getBoundingClientRect().top) / px / z; m.remove(); return b;
  };
  const z = lebar / 210;
  const sblm = document.querySelector('[data-peran="sebelum"] .s2')!;
  const judulSebelum = kotak(sblm.querySelector(".merek-jenis")!, sblm, z);
  return [...document.querySelectorAll('[data-peran="sesudah"]')].map((fig) => {
    const s2 = fig.querySelector(".s2")!;
    const rg = document.createRange(); rg.selectNodeContents(s2.querySelector(".t-nama")!);
    return {
      nama: (fig as HTMLElement).dataset.nama ?? "", judulSebelum, judul: kotak(s2.querySelector(".merek-jenis")!, s2, z),
      dasarJudul: dasar(s2.querySelector(".merek-jenis")!, s2, z), merek: kotak(s2.querySelector(".t-merek")!, s2, z),
      tepiKanan: 210, namaAtas: (rg.getBoundingClientRect().top - s2.getBoundingClientRect().top) / px / z,
    };
  });
}, LEBAR);
// The face Chromium actually drew the wordmark in.
const cdp = await ctx.newCDPSession(p);
await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
const { root } = await cdp.send("DOM.getDocument");
const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: ".t-merek" });
const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
const wajahNyata = fonts.map((x: { familyName: string }) => x.familyName).join(", ");
// Dash the clear space on the 2x "after" header.
await p.evaluate((x) => {
  const j = document.querySelector('[data-zum="sesudah"] > div')!;
  const m = j.querySelector(".t-merek") as HTMLElement;
  const a = j.querySelector(".s2")!.getBoundingClientRect(), r = m.getBoundingClientRect();
  const z = 2;
  const d = document.createElement("div"); d.className = "ruang";
  Object.assign(d.style, { left: `calc(${(r.left - a.left) / z}px - ${x}mm)`, top: `calc(${(r.top - a.top) / z}px - ${x}mm)`, width: `calc(${r.width / z}px + ${2 * x}mm)`, height: `calc(${r.height / z}px + ${2 * x}mm)` });
  j.querySelector(".s2")!.appendChild(d);
}, X);
await p.screenshot({ path: join(RENDER, "J-merek-PINTAR.png"), fullPage: true });
await browser.close();

const f2 = (v: number) => v.toFixed(2);
const laporan: string[] = ["Sertifikat PINTAR · the wordmark correction (5 Oct) · measured on render, in sheet millimetres", `X (cap height) = ${X} mm (the header's: 12 pt × 0.745); print minimum 15 mm wide; nothing within 12 mm of the sheet's edge; header words at least 10 mm apart`, ""];
let gagal = 0;
for (const u of ukur) {
  const m = u.merek, j = u.judul, js = u.judulSebelum;
  const tinggi = m.bawah - m.atas, lebar = m.kanan - m.kiri, jarak = m.kiri - j.kanan;
  const masalah: string[] = [];
  const geser = Math.max(Math.abs(j.kiri - js.kiri), Math.abs(j.atas - js.atas), Math.abs(j.kanan - js.kanan), Math.abs(j.bawah - js.bawah));
  if (geser > 0.01) masalah.push(`the title moved ${f2(geser)} mm`);
  if (Math.abs(tinggi - X) > 0.05) masalah.push(`cap height ${f2(tinggi)} mm, not ${X}`);
  if (lebar < 15) masalah.push(`only ${f2(lebar)} mm wide`);
  if (Math.abs(m.bawah - u.dasarJudul) > 0.05) masalah.push(`baseline ${f2(m.bawah)} mm, the title's ${f2(u.dasarJudul)} mm`);
  if (jarak < 10) masalah.push(`header words ${f2(jarak)} mm apart`);
  if (m.atas < 12 || u.tepiKanan - m.kanan < 12) masalah.push("within 12 mm of the edge");
  if (u.namaAtas - m.bawah < X) masalah.push("the name inside the clear space");
  if (masalah.length) gagal++;
  laporan.push(`${masalah.length ? "FAIL" : "ok  "} ${u.nama.padEnd(42)} title unchanged (moved ${f2(geser)} mm) · wordmark cap ${f2(tinggi)} mm · ${f2(lebar)} mm wide · baseline ${f2(m.bawah)} (title ${f2(u.dasarJudul)}) · ${f2(jarak)} mm from the title · right margin ${f2(u.tepiKanan - m.kanan)} mm (the box carries the last letter's 0.05 em tracking, hung past the 20 mm margin as the old line hung its 0.12 em) · top ${f2(m.atas)} mm${masalah.length ? " · " + masalah.join("; ") : ""}`);
}
laporan.push("", `Face drawn here: ${wajahNyata}. Helvetica Neue is not installed in this environment, so this is a stand-in proof of place and size, not of the letterforms.`);
writeFileSync(join(RENDER, "J-laporan.txt"), laporan.join("\n") + "\n");
console.log(laporan.join("\n"));
if (gagal) process.exit(1);
