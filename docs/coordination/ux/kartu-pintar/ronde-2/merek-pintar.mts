/**
 * Kartu PINTAR, round 2: THE WORDMARK CORRECTION (5 Oct). Run from the repository root:
 *
 *   npx tsx docs/coordination/ux/kartu-pintar/ronde-2/merek-pintar.mts
 *
 * The card's design freeze was reopened for one thing only: the canonical PINTAR wordmark replaces
 * «PINTAR SELALU». This script draws every front before and after from the one grammar in
 * kartu.mts (the "before" is the same card with the old line put back), measures the wordmark on
 * each, and writes render/L-merek-PINTAR.png and render/L-laporan.txt. It exits non-zero if a check
 * fails. The wordmark is a PROOF in the viewer's stand-in face (Helvetica Neue is not available
 * here); the print proof is re-made from the outlined master once its font licence is verified.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import * as K from "./kartu.mjs";

const AKAR = process.cwd();
const DIR = join(AKAR, "docs/coordination/ux/kartu-pintar/ronde-2");
const RENDER = join(DIR, "render");
const KERJA = join(tmpdir(), "kartu-pintar-merek");
mkdirSync(RENDER, { recursive: true });
mkdirSync(KERJA, { recursive: true });

// The same invented people as buat-kartu.mts, plus its longest name.
const S = { smp: "SMP Cahaya Kaliandra", sma: "SMA Bukit Asri Kaliandra", sek: "Sekolah Cendekia Kaliandra", smk: "Sekolah Menengah Kejuruan Teknologi dan Rekayasa Nusa Kaliandra Timur" };
const ORANG: Record<K.Keluarga, K.Orang> = {
  murid: { nama: "Bagas Saputra", id: "7Q2Z0D9K", bab: [{ peran: "murid", sekolah: S.smp }] },
  guru: { nama: "Ratna Dewi Kusumawardani", id: "A14CD7ST", bab: [{ peran: "guru", sekolah: S.smp }] },
  kadep: { nama: "Nur'aini Rahmawati", id: "5S8B1HMR", bab: [{ peran: "kadep", sekolah: S.sma }] },
  dekan: { nama: "Muhammad Rizky Aditya Pratama", id: "D0W3Z27E", bab: [{ peran: "dekan", sekolah: S.sek }] },
  adminSekolah: { nama: "Sukarmi", id: "B8K5S1GX", bab: [{ peran: "adminSekolah", sekolah: S.smk }] },
  adminPlatform: { nama: "Laras Pramesti", id: "2ZNV07YD", bab: [{ peran: "adminPlatform", sekolah: null }] },
};
const PANJANG: K.Orang = { nama: "Ni Luh Putu Ayu Kartika Maharani Suryaningsih", id: "Q8ZB2D0S", bab: [{ peran: "guru", sekolah: S.sma }] };

// The old line exactly as the frozen card set it (round 2, 30 Sep), for the "before".
const LAMA = `<p class="kp-lama merek" style="position:absolute;left:${K.TATA.tepi}mm;top:${K.TATA.atas}mm;color:${K.WARNA.hijau};font-family:'Plus Jakarta Sans';font-weight:600;font-size:6.5pt;line-height:1;letter-spacing:0.16em;word-spacing:0.12em;text-transform:uppercase;white-space:nowrap">PINTAR SELALU</p>`;
const sebelum = (html: string) => html.replace(/<p class="kp-merek merek"[^>]*>PINTAR<\/p>/, LAMA);

const X = K.MEREK.tinggiHuruf;
const kartu = (html: string, nama: string) => `<figure data-nama="${nama}"><div class="kp-bingkai">${html}</div><figcaption>${nama}</figcaption></figure>`;
const enam = K.KELUARGA.map((k) => kartu(K.depan(ORANG[k], { garisTepi: true }), K.PERAN[k]));
const halaman = `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Kartu PINTAR · koreksi merek</title>
<style>${K.css(AKAR)}
html, body { margin: 0; } body { background: #E6E3DC; color: #1F2A33; font-family: 'Plus Jakarta Sans'; }
.lembar { padding: 8mm; width: 290mm; }
h1 { font: 600 11pt 'Plus Jakarta Sans'; margin: 0 0 1.2mm; } h2 { font: 600 8pt 'Plus Jakarta Sans'; margin: 6mm 0 3mm; }
.sub { font: 400 7pt/1.45 'Plus Jakarta Sans'; color: #4E5A64; margin: 0 0 4mm; max-width: 270mm; }
.kisi { display: grid; grid-template-columns: repeat(3, 85.6mm); gap: 7mm 6mm; }
.dua { display: grid; grid-template-columns: repeat(2, 85.6mm); gap: 6mm; }
figure { margin: 0; } figcaption { font: 400 7pt/1.4 'Plus Jakarta Sans'; color: #4E5A64; margin-top: 1.4mm; }
.zum { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6mm; }
.zum .jendela { width: 130mm; height: 40mm; overflow: hidden; position: relative; border-radius: 1mm; background: #FBFAF7; }
.zum .jendela > div { transform: scale(3); transform-origin: 0 0; position: absolute; left: 0; top: 0; }
.ruang { position: absolute; outline: 0.15mm dashed #808A91; pointer-events: none; }
</style></head><body><div class="lembar">
<h1>Kartu PINTAR: the wordmark correction (5 Oct)</h1>
<p class="sub">The freeze is reopened only to replace «PINTAR SELALU» with the canonical PINTAR wordmark. Nothing else on the card changes: not the layout, the information, the colours, the type or the dimensions. Same place (the 6 mm margin, the old cap top at 5.57 mm), same green. Its size follows the wordmark's 15 mm print minimum: cap height ${X} mm. The wordmark here is a proof in a stand-in face; the print proof is re-made from the outlined master.</p>
<h2>Before and after (Guru, actual size)</h2>
<div class="dua">${kartu(sebelum(K.depan(ORANG.guru, { garisTepi: true })), "Before: «PINTAR SELALU» in Plus Jakarta Sans 600, 6.5 pt")}${kartu(K.depan(ORANG.guru, { garisTepi: true }), "After: the PINTAR wordmark, cap height " + X + " mm")}</div>
<h2>The corner at 3×, with the wordmark's clear space (X = ${X} mm) dashed</h2>
<div class="zum"><div class="jendela"><div>${sebelum(K.depan(ORANG.guru))}</div></div><div class="jendela" data-zum="sesudah"><div>${K.depan(ORANG.guru)}</div></div></div>
<h2>All six families, after</h2>
<div class="kisi">${enam.join("")}</div>
<h2>The longest name, after</h2>
<div class="dua">${kartu(K.depan(PANJANG, { garisTepi: true }), "Ni Luh Putu Ayu Kartika Maharani Suryaningsih")}</div>
</div></body></html>`;

const require_ = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require_("playwright");
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 3 });
const p = await ctx.newPage();
const f = join(KERJA, "merek.html");
writeFileSync(f, halaman);
await p.goto(`file://${f}`);
await p.evaluate(() => document.fonts.ready);

// Measure every "after" card: the wordmark's box (trimmed to cap height and baseline), its margins,
// and the clear space to the name below it.
type Ukur = { nama: string; tinggi: number; lebar: number; kiri: number; atas: number; keNama: number; wajah: string };
const lebarLama: number = await p.evaluate(() => document.querySelector(".kp-lama")!.getBoundingClientRect().width / (96 / 25.4));
const ukur: Ukur[] = await p.evaluate(() => {
  const px = 96 / 25.4;
  return [...document.querySelectorAll("figure")].filter((f) => f.querySelector(".kp-merek")).map((f) => {
    const kartu = f.querySelector(".kp-trim")!.getBoundingClientRect();
    const m = f.querySelector(".kp-merek")!.getBoundingClientRect();
    const rg = document.createRange(); rg.selectNodeContents(f.querySelector(".kp-nama")!);
    const n = rg.getBoundingClientRect();
    return {
      nama: f.querySelector("figcaption")!.textContent ?? "", tinggi: m.height / px, lebar: m.width / px,
      kiri: (m.left - kartu.left) / px, atas: (m.top - kartu.top) / px, keNama: (n.top - m.bottom) / px,
      wajah: getComputedStyle(f.querySelector(".kp-merek")!).fontFamily,
    };
  });
});
// The face Chromium actually drew the wordmark in (the stack names Helvetica Neue first; this says what was found).
const cdp = await ctx.newCDPSession(p);
await cdp.send("DOM.enable"); await cdp.send("CSS.enable");
const { root } = await cdp.send("DOM.getDocument");
const { nodeId } = await cdp.send("DOM.querySelector", { nodeId: root.nodeId, selector: ".kp-merek" });
const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
const wajahNyata = fonts.map((f: { familyName: string }) => f.familyName).join(", ");
// Dash the clear space on the 3x "after" corner.
await p.evaluate((x) => {
  const j = document.querySelector('[data-zum="sesudah"] > div')!;
  const m = j.querySelector(".kp-merek") as HTMLElement;
  const r = document.createElement("div");
  r.className = "ruang";
  Object.assign(r.style, { left: `calc(${m.offsetLeft}px - ${x}mm)`, top: `calc(${m.offsetTop}px - ${x}mm)`, width: `calc(${m.offsetWidth}px + ${2 * x}mm)`, height: `calc(${m.offsetHeight}px + ${2 * x}mm)` });
  m.parentElement!.appendChild(r);
}, X);
await p.screenshot({ path: join(RENDER, "L-merek-PINTAR.png"), fullPage: true });
await browser.close();

const laporan: string[] = ["Kartu PINTAR · the wordmark correction (5 Oct) · measured on render", `X (cap height) = ${X} mm; print minimum 15 mm wide; safe margin ${K.UKURAN.aman} mm`, `Before: «PINTAR SELALU», ${lebarLama.toFixed(1)} mm wide (its box, the last letter's tracking included)`, ""];
let gagal = 0;
for (const u of ukur) {
  const masalah: string[] = [];
  if (Math.abs(u.tinggi - X) > 0.05) masalah.push(`cap height ${u.tinggi.toFixed(2)} mm, not ${X}`);
  if (u.lebar < 15) masalah.push(`only ${u.lebar.toFixed(1)} mm wide`);
  if (u.kiri < X || u.atas < X) masalah.push("clear space to the card's edge under X");
  if (u.keNama < X) masalah.push(`the name is ${u.keNama.toFixed(1)} mm below, under X`);
  if (masalah.length) gagal++;
  laporan.push(`${masalah.length ? "FAIL" : "ok  "} ${u.nama.padEnd(48)} cap ${u.tinggi.toFixed(2)} mm · ${u.lebar.toFixed(1)} mm wide · left ${u.kiri.toFixed(2)} · top ${u.atas.toFixed(2)} · name ${u.keNama.toFixed(1)} mm below${masalah.length ? " · " + masalah.join("; ") : ""}`);
}
laporan.push("", `Face asked for: ${ukur[0]?.wajah}`, `Face drawn here: ${wajahNyata}. Helvetica Neue is not installed in this environment, so this is a stand-in proof of place and size, not of the letterforms.`);
writeFileSync(join(RENDER, "L-laporan.txt"), laporan.join("\n") + "\n");
console.log(laporan.join("\n"));
if (gagal) process.exit(1);
