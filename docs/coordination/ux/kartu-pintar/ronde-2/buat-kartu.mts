/**
 * Kartu PINTAR, round 2: the render script. Run from the repository root:
 *
 *   KARTU_PY=/path/to/venv/bin/python npx tsx docs/coordination/ux/kartu-pintar/ronde-2/buat-kartu.mts
 *
 * KARTU_PY is a Python with requirements.txt installed (default: python3).
 * It builds every render in render/ from the one grammar in kartu.mts, writes the
 * A4 proof, runs the checks (contrast, colour distances, safe margin, quiet zone,
 * name length, forbidden words, PDF geometry), the QR decode tests and the
 * gold-line study, and writes render/laporan.txt. It exits non-zero if a check fails.
 *
 * Samples only: every person, school and PINTAR ID is invented, and the QR
 * encodes https://contoh.pintar.invalid/id/A14CD7ST (RFC 2606: never exists).
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { qrMatrix } from "../../../../../src/lib/qr.js";
import { bingkaiEmail, LOGO_BAKU } from "../../email-frame/bingkai.mjs";
import * as K from "./kartu.mjs";
import { KARTU_LAIN, BELAKANG_LAIN } from "./kartu-lain.mjs";

const AKAR = process.cwd();
const DIR = join(AKAR, "docs/coordination/ux/kartu-pintar/ronde-2");
const RENDER = join(DIR, "render");
const KERJA = join(tmpdir(), "kartu-pintar-r2-kerja");
mkdirSync(RENDER, { recursive: true });
mkdirSync(KERJA, { recursive: true });
const PY = process.env.KARTU_PY ?? "python3";
const py = (...a: string[]) => execFileSync(PY, [join(DIR, "uji-qr.py"), ...a], { maxBuffer: 1 << 26 }).toString();

const URL_CONTOH = "https://contoh.pintar.invalid/id/A14CD7ST";
if (new URL(URL_CONTOH).hostname.split(".").pop() !== "invalid") throw new Error("the sample QR must point at a .invalid domain");
const W = K.WARNA;
const laporan: string[] = [];
let gagal = 0;
const catat = (s: string) => { laporan.push(s); };
const f2 = (x: number) => x.toFixed(2);
const f3 = (x: number) => x.toFixed(3);

// ── samples: invented people and schools ──────────────────────────────────────
const S = { smp: "SMP Cahaya Kaliandra", sma: "SMA Bukit Asri Kaliandra", sek: "Sekolah Cendekia Kaliandra", smk: "Sekolah Menengah Kejuruan Teknologi dan Rekayasa Nusa Kaliandra Timur" };
const ORANG: Record<K.Keluarga, K.Orang> = {
  murid: { nama: "Bagas Saputra", id: "7Q2Z0D9K", bab: [{ peran: "murid", sekolah: S.smp }] },
  guru: { nama: "Ratna Dewi Kusumawardani", id: "A14CD7ST", bab: [{ peran: "guru", sekolah: S.smp }] },
  kadep: { nama: "Nur'aini Rahmawati", id: "5S8B1HMR", bab: [{ peran: "kadep", sekolah: S.sma }] },
  dekan: { nama: "Muhammad Rizky Aditya Pratama", id: "D0W3Z27E", bab: [{ peran: "dekan", sekolah: S.sek }] },
  adminSekolah: { nama: "Sukarmi", id: "B8K5S1GX", bab: [{ peran: "adminSekolah", sekolah: S.smk }] },
  adminPlatform: { nama: "Laras Pramesti", id: "2ZNV07YD", bab: [{ peran: "adminPlatform", sekolah: null }] },
};
const UTAMA = ORANG.guru; // its ID is the one the sample QR carries
const PANJANG: K.Orang = { nama: "Ni Luh Putu Ayu Kartika Maharani Suryaningsih", id: "Q8ZB2D0S", bab: [{ peran: "guru", sekolah: S.sma }] };
// several roles, listed alphabetically by their Terminology v1 names (README §F: the rule is a proposal)
const urutAbjad = (bab: K.Bab[]) => [...bab].sort((a, b) => K.PERAN[a.peran].localeCompare(K.PERAN[b.peran], "id"));
const DUA_PERAN: K.Orang = { nama: "Nur'aini Rahmawati", id: "5S8B1HMR", bab: urutAbjad([{ peran: "kadep", sekolah: S.sma }, { peran: "guru", sekolah: S.sma }]) };
const DUA_SEKOLAH: K.Orang = { nama: "Hendra Wicaksono", id: "M4TQ9VXC", bab: urutAbjad([{ peran: "kadep", sekolah: S.sma }, { peran: "guru", sekolah: S.smp }]) };
for (const o of [...Object.values(ORANG), PANJANG, DUA_PERAN, DUA_SEKOLAH]) {
  if (!/^[0-9A-HJKMNP-TV-Z]{8}$/.test(o.id)) throw new Error(`not a Crockford Base32 PINTAR ID: ${o.id}`);
}

// ── the QR: the app's own encoder, level M, unchanged ─────────────────────────
const M = qrMatrix(URL_CONTOH).map((r: boolean[]) => r.map((x) => (x ? 1 : 0)));
const QR: K.VarianQr = { kode: "ubin", nama: "PINTAR tile", matriks: M, versi: (M.length - 17) / 4, ecc: "M", sumber: "src/lib/qr.ts (the app's own encoder, unchanged)" };
const UBIN = K.letakUbin(QR);

// ── pages ────────────────────────────────────────────────────────────────────
const MEJA = "#E6E3DC";
const halaman = (judul: string, badan: string, tambahan = "", statis?: string) => `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${judul}</title>
<style>${K.css(AKAR, statis)}
html, body { margin: 0; }
body { background: ${MEJA}; color: ${W.tinta}; font-family: 'Plus Jakarta Sans'; text-rendering: geometricPrecision; font-kerning: normal; }
.lembar { padding: 8mm; }
.lembar h1 { font: 600 11pt 'Plus Jakarta Sans'; margin: 0 0 1.2mm; letter-spacing: -0.01em; }
.lembar .sub { font: 400 7pt/1.45 'Plus Jakarta Sans'; color: ${W.tinta2}; margin: 0 0 6mm; max-width: 200mm; }
.lembar h2 { font: 600 8pt 'Plus Jakarta Sans'; margin: 0 0 3mm; }
.kisi { display: grid; grid-template-columns: repeat(3, 85.6mm); gap: 7mm 6mm; margin-bottom: 8mm; }
.ket { font: 400 5.8pt/1.45 'Plus Jakarta Sans'; color: ${W.tinta2}; margin-top: 1.6mm; }
.ket b { font-weight: 600; color: ${W.tinta}; }
.buka { color: #8A5F00; font-weight: 600; }
table.spek { border-collapse: collapse; font: 400 6pt/1.4 'Plus Jakarta Sans'; }
table.spek th { font-weight: 600; text-align: left; padding: 1mm 3mm 1mm 0; border-bottom: 0.2mm solid rgba(31,42,51,.24); vertical-align: bottom; }
table.spek td { padding: 1mm 3mm 1mm 0; border-bottom: 0.2mm solid rgba(31,42,51,.12); vertical-align: top; }
.tutup .merek { position: relative; }
.tutup .merek::after { content: ""; position: absolute; left: -1.2mm; right: -1.2mm; top: -1mm; bottom: -1mm; background: #EDE7D6; box-shadow: 0 0.2mm 0.4mm rgba(0,0,0,.25); transform: rotate(-1.5deg); }
${tambahan}</style></head><body>${badan}</body></html>`;

const require_ = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require_("playwright");
const browser = await chromium.launch();
type Potret = { lebar: number; tinggi?: number; skala: number; gelap?: boolean; elemen?: string; transparan?: boolean; ke?: string };
async function potret(html: string, nama: string, o: Potret): Promise<string> {
  const f = join(KERJA, nama.replace(/\.png$/, ".html"));
  writeFileSync(f, html);
  const ctx = await browser.newContext({ viewport: { width: o.lebar, height: o.tinggi ?? 400 }, deviceScaleFactor: o.skala, colorScheme: o.gelap ? "dark" : "light" });
  const p = await ctx.newPage();
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  const keluar = join(o.ke ?? RENDER, nama);
  if (o.elemen) await p.locator(o.elemen).first().screenshot({ path: keluar, omitBackground: !!o.transparan });
  else await p.screenshot({ path: keluar, fullPage: true });
  await ctx.close();
  return keluar;
}
const mmPx = (v: number) => (v * 96) / 25.4;
const LEBAR3 = Math.ceil(mmPx(3 * 85.6 + 2 * 6 + 16));

// ── OKLCH, for the palette tables ─────────────────────────────────────────────
function oklch(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
}

// ════════════════════════════════════════════════════════════════════════════
// Colour: the six, how far apart, contrast, print shift
// ════════════════════════════════════════════════════════════════════════════
type Jarak = Record<string, Array<{ i: number; j: number; oklab: number; de2000: number }>>;
const jarak: Record<K.Palet, Jarak> = {} as Record<K.Palet, Jarak>;
catat("FAMILY COLOURS (OKLCH: L lightness, C chroma, H hue)");
for (const palet of ["r1", "terpisah", "zaitun"] as K.Palet[]) {
  jarak[palet] = JSON.parse(py("jarak", ...K.KELUARGA.map((k) => K.PALET[palet][k])));
  catat(`  ${palet}: ${K.KELUARGA.map((k) => { const [l, c, h] = oklch(K.PALET[palet][k]); return `${K.PERAN[k]} ${K.PALET[palet][k]} (${f3(l)} / ${f3(c)} / ${h.toFixed(0)})`; }).join("; ")}`);
  for (const vis of ["normal", "deuteranopia", "protanopia"]) {
    const pas = [...jarak[palet][vis]].sort((a, b) => a.oklab - b.oklab);
    catat(`    ${vis}: closest ${pas.slice(0, 3).map((p) => `${K.PERAN[K.KELUARGA[p.i]]}/${K.PERAN[K.KELUARGA[p.j]]} ${p.oklab.toFixed(4)}`).join("; ")}`);
  }
}
{
  const min = Math.min(...jarak.terpisah.normal.map((p) => p.oklab));
  catat(`  CHECK: proposed set, smallest OKLab distance ${min.toFixed(4)} (target at least 0.056, Yazid's HEX's own minimum)`);
  if (min < 0.056) gagal++;
  const Ls = K.KELUARGA.map((k) => oklch(K.PALET.terpisah[k])[0]);
  catat(`  CHECK: proposed set, OKLab lightness ${f3(Math.min(...Ls))} to ${f3(Math.max(...Ls))} (one lightness)`);
  if (Math.max(...Ls) - Math.min(...Ls) > 0.005) gagal++;
}
catat("  all 15 pairs, proposed set (OKLab / CIEDE2000; normal | deuteranopia):");
for (let n = 0; n < 15; n++) {
  const a = jarak.terpisah.normal[n], d = jarak.terpisah.deuteranopia[n];
  catat(`    ${K.PERAN[K.KELUARGA[a.i]]} / ${K.PERAN[K.KELUARGA[a.j]]}: ${a.oklab.toFixed(4)} / ${a.de2000} | ${d.oklab.toFixed(4)} / ${d.de2000}`);
}
// the line and the brand green against the families
catat("");
catat("CONTRAST (WCAG 2.x; all card text is small text, 4.5:1)");
type Pas = { apa: string; teks: string; latar: string; min: number };
const PAS: Pas[] = [
  { apa: "front · the PINTAR wordmark (PINTAR green) on paper", teks: W.hijau, latar: W.kertas, min: 4.5 },
  { apa: "front · name (ink) on paper", teks: W.tinta, latar: W.kertas, min: 4.5 },
  { apa: "front · PINTAR ID (ink-2) on paper", teks: W.tinta2, latar: W.kertas, min: 4.5 },
  { apa: "back · QR modules (green) on the tile", teks: W.hijau, latar: W.hijauLembut, min: 4.5 },
  { apa: "back · PINTAR ID (green) on the tile", teks: W.hijau, latar: W.hijauLembut, min: 4.5 },
  { apa: "back · instruction (ink) on paper", teks: W.tinta, latar: W.kertas, min: 4.5 },
  { apa: "back · URL (ink-3) on paper", teks: W.tinta3, latar: W.kertas, min: 4.5 },
  ...K.KELUARGA.map((k) => ({ apa: `front · role and school (paper) on ${K.PERAN[k]}`, teks: W.kertas, latar: K.PALET.terpisah[k], min: 4.5 })),
];
for (const p of PAS) {
  const r = K.rasio(p.teks, p.latar);
  if (r < p.min) gagal++;
  catat(`  ${p.apa}: ${p.teks} on ${p.latar} = ${f2(r)}:1${r < p.min ? "  BELOW" : ""}`);
}
catat(`  the line (not text; structure): ${W.emas} on paper ${f2(K.rasio(W.emas, W.kertas))}:1; on the families ${K.KELUARGA.map((k) => `${K.PERAN[k]} ${f2(K.rasio(W.emas, K.PALET.terpisah[k]))}`).join(", ")}`);
catat(`  the line in greyscale: ${K.abuHex(W.emas)} between paper ${K.abuHex(W.kertas)} and the families ${[...new Set(K.KELUARGA.map((k) => K.abuHex(K.PALET.terpisah[k])))].join(" / ")}`);
const cmyk = JSON.parse(py("cmyk", ...K.KELUARGA.map((k) => K.PALET.terpisah[k]), W.emas, W.hijau, W.hijauLembut, W.kertas)) as Array<{ hex: string; cmyk: number[]; kembali: string; de2000: number }>;
catat("");
catat("PRINT SHIFT (sRGB -> MuPDF's built-in CMYK profile -> sRGB; an estimate)");
for (const c of cmyk) catat(`  ${c.hex}: CMYK ${c.cmyk.join("/")} -> ${c.kembali}, dE2000 ${c.de2000}`);

// ════════════════════════════════════════════════════════════════════════════
// A. The six fronts, and the palette study
// ════════════════════════════════════════════════════════════════════════════
const kisiEnam = (palet: K.Palet, ket = true) =>
  `<div class="kisi">${K.KELUARGA.map((k) => `<div>${K.depan(ORANG[k], { palet })}${ket ? `<p class="ket"><b>${K.PERAN[k]}</b> · ${K.PALET[palet][k]} · paper on it ${f2(K.rasio(W.kertas, K.PALET[palet][k]))}:1</p>` : ""}</div>`).join("")}</div>`;
const matriksJarak = (palet: K.Palet, vis: string) => {
  const d = (i: number, j: number) => jarak[palet][vis].find((p) => (p.i === i && p.j === j) || (p.i === j && p.j === i))!.oklab;
  return `<table class="spek"><tr><th></th>${K.KELUARGA.map((k) => `<th>${K.PERAN[k]}</th>`).join("")}</tr>${K.KELUARGA.map((a, i) => `<tr><td><b>${K.PERAN[a]}</b></td>${K.KELUARGA.map((_, j) => {
    if (i === j) return `<td style="color:#999">—</td>`;
    const v = d(i, j);
    return `<td style="${v < 0.056 ? "color:#8C3B3B;font-weight:600" : ""}">${v.toFixed(3)}</td>`;
  }).join("")}</tr>`).join("")}</table>`;
};
const swatch = (palet: K.Palet) => `<div style="display:flex;gap:2mm;margin-bottom:2mm">${K.KELUARGA.map((k) => `<div style="text-align:center"><div style="width:26mm;height:9mm;border-radius:1mm;background:${K.PALET[palet][k]}"></div><p class="ket" style="margin-top:0.8mm">${K.PERAN[k]}<br>${K.PALET[palet][k]}</p></div>`).join("")}</div>`;
await potret(halaman("A · six fronts", `<div class="lembar" style="width:${3 * 85.6 + 2 * 6}mm">
<h1>A · The six fronts, final candidates</h1>
<p class="sub">One grammar. Warm-white upper field, the warm-gold line, a deep muted family colour below. Above the line what is permanent (the PINTAR wordmark, the name, the PINTAR ID); below it the current chapter (role and school). The six colours share one lightness (OKLab L 0.487) and are spread in hue until every pair is at least 0.056 apart. Samples are invented.</p>
${kisiEnam("terpisah")}
<h2>The palette: round 1 → proposed (and the olive alternative)</h2>
<p class="ket" style="margin:0 0 1mm">Round 1 (two pairs too close)</p>${swatch("r1")}
<p class="ket" style="margin:0 0 1mm"><b>Proposed</b>: plum Murid, sage Guru, petrol Kepala departemen, navy Dekan, clay Admin sekolah, slate Admin platform</p>${swatch("terpisah")}
<p class="ket" style="margin:0 0 1mm">Alternative: Murid kept in the green-yellow arc (olive), everything else re-solved</p>${swatch("zaitun")}
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:5mm">
<div><h2>Every pair, OKLab distance, normal vision (proposed)</h2>${matriksJarak("terpisah", "normal")}<p class="ket">Target: at least 0.056 (Yazid's HEX never came closer than 0.0565). Red: below it. Round 1: Murid/Dekan 0.024, Guru/Kepala departemen 0.029.</p></div>
<div><h2>Every pair, simulated deuteranopia (proposed)</h2>${matriksJarak("terpisah", "deuteranopia")}<p class="ket">At one lightness, red-green colour blindness leaves only the blue-yellow axis, so some pairs meet. The role is always written, so no one loses the information (D-059).</p></div></div></div>`),
  "A-enam-depan.png", { lebar: LEBAR3, skala: 3 });

// ════════════════════════════════════════════════════════════════════════════
// B. The Guru card in detail
// ════════════════════════════════════════════════════════════════════════════
const BLEED = K.UKURAN.bleed;
const panduan = (belakangnya: boolean) => {
  const { lebar: Wc, tinggi: Hc, sudut: R, aman } = K.UKURAN;
  const g = (x: number, y: number, w: number, h: number, gaya: string, r = 0) =>
    `<div style="position:absolute;left:${x}mm;top:${y}mm;width:${w}mm;height:${h}mm;${gaya};border-radius:${r}mm;box-sizing:border-box"></div>`;
  const label = (x: number, y: number, t: string, warna = "#B0306A") => `<div style="position:absolute;left:${x}mm;top:${y}mm;font:600 3.4pt 'Plus Jakarta Sans';color:${warna};white-space:nowrap;background:rgba(251,250,247,.9);padding:0 0.4mm;border-radius:0.4mm">${t}</div>`;
  const b = BLEED;
  let s = g(b, b, Wc, Hc, "border:0.12mm solid #B0306A", R) + g(b + aman, b + aman, Wc - 2 * aman, Hc - 2 * aman, "border:0.1mm dashed #1F6FB2")
    + g(b + K.TATA.tepi, b, 0, Hc, "border-left:0.08mm dotted #5F6A73") + g(b + Wc - K.TATA.tepi, b, 0, Hc, "border-left:0.08mm dotted #5F6A73");
  s += label(b + 0.6, 0.1, `bleed ${b} mm`, "#5F6A73") + label(b + aman + 0.5, b + aman + 0.3, "safe margin 3 mm", "#1F6FB2");
  s += label(b + Wc - 30, b + K.TATA.garis + 1.2, `line centre ${K.TATA.garis} mm, ${K.GARIS_MM} mm wide`, "#1F2A33");
  if (belakangnya) {
    const q = K.TENANG * UBIN.modul;
    s += g(b + UBIN.kiri + q, b + UBIN.atas + q, UBIN.simbol, UBIN.simbol, "border:0.1mm dashed #B0306A") + label(b + UBIN.kiri + UBIN.sisi + 1, b + UBIN.atas + 1, `symbol ${f2(UBIN.simbol)} mm`, "#B0306A")
      + label(b + UBIN.kiri + UBIN.sisi + 1, b + UBIN.atas + 4, `quiet zone 4 modules, ${f2(q)} mm, inside the tile`, "#B0306A")
      + label(b + UBIN.kiri + UBIN.sisi + 1, b + UBIN.atas + 7, `module ${f3(UBIN.modul)} mm`, "#B0306A")
      + label(b + UBIN.kiri + UBIN.sisi + 1, b + UBIN.atas + UBIN.sisi + 0.6, "PINTAR ID below the quiet zone", "#B0306A");
  } else s += label(b + K.TATA.tepi + 0.4, b + Hc - aman - 1.8, "text margin 6 mm", "#5F6A73");
  return s;
};
const detail = (muka: string, belakangnya: boolean) => `<div style="position:relative;display:inline-block">${muka}${panduan(belakangnya)}</div>`;
await potret(halaman("B · detail", `<div class="lembar">
<h1>B · The Guru card, front and back, at CR80 with bleed</h1>
<p class="sub">85.60 × 53.98 mm, corners 3.18 mm. Pink: the trim. Blue dashes: the 3 mm safe margin. Grey dots: the 6 mm text margin. Colour and the line run 2 mm past the trim. The line's centre is 32 mm from the top on both faces. Back: the symbol keeps its full 4-module quiet zone inside the tile, and the ID sits below it.</p>
<div style="display:flex;gap:8mm;align-items:flex-start">${detail(K.depan(UTAMA, { bleed: BLEED }), false)}${detail(K.belakang(UTAMA, QR, { bleed: BLEED }), true)}</div>
<div style="display:flex;gap:10mm;margin-top:8mm">${K.depan(UTAMA)}${K.belakang(UTAMA, QR)}</div></div>`),
  "B-guru-detail.png", { lebar: Math.ceil(mmPx(2 * 89.6 + 8 + 16)), skala: 5 });

// ════════════════════════════════════════════════════════════════════════════
// C. The gold-line study (renders for measurement, then the sheet)
// ════════════════════════════════════════════════════════════════════════════
const LEBAR_GARIS = [0.5, 0.75, 1.0];
const kasusGaris: Array<Record<string, unknown>> = [];
{
  // print-resolution pairs (1200 dpi), with and without the line
  const skala1200 = 1200 / 96;
  for (const w of LEBAR_GARIS) {
    for (const [muka, html] of [["front", (g: number) => K.depan(UTAMA, { garisMm: g })], ["back", (g: number) => K.belakang(UTAMA, QR, { garisMm: g })]] as const) {
      const pasang: string[] = [];
      for (const g of [w, 0]) {
        pasang.push(await potret(halaman("g", `<div style="display:inline-block">${html(g)}</div>`, "body{background:#fff}"), `garis-${muka}-${w}-${g}.png`, { lebar: 400, skala: skala1200, elemen: ".kp", ke: KERJA }));
      }
      kasusGaris.push({ nama: `${muka} ${w} mm, print`, lebar: w, muka, ukuran: "print", cetak: true, dengan: pasang[0], tanpa: pasang[1], px_mm: 1200 / 25.4, y_mm: K.TATA.garis, simpan: join(KERJA, `crop-${muka}-${w}.png`) });
    }
  }
  // screen sizes: the card at 440 (email 600), 358 (phone), 266 (email 320) px wide, at 1x and 2x
  for (const w of LEBAR_GARIS) {
    for (const lebarPx of [440, 358, 266]) {
      for (const dpr of [1, 2]) {
        const pasang: string[] = [];
        for (const g of [w, 0]) {
          pasang.push(await potret(halaman("g", `<div style="display:inline-block">${K.depan(UTAMA, { garisMm: g })}</div>`, "body{background:#fff}"), `layar-${w}-${lebarPx}-${dpr}-${g}.png`, { lebar: 500, skala: (lebarPx / mmPx(K.UKURAN.lebar)) * dpr, elemen: ".kp", ke: KERJA }));
        }
        kasusGaris.push({ nama: `front ${w} mm on screen, card ${lebarPx} px at ${dpr}x`, lebar: w, muka: "front", ukuran: `${lebarPx}px@${dpr}x`, dengan: pasang[0], tanpa: pasang[1], px_mm: (lebarPx * dpr) / K.UKURAN.lebar, y_mm: K.TATA.garis, simpan: join(KERJA, `layar-crop-${w}-${lebarPx}-${dpr}.png`) });
      }
    }
  }
}
writeFileSync(join(KERJA, "garis.json"), JSON.stringify({ kasus: kasusGaris }));
type HasilGaris = { nama: string; lebar: number; muka: string; ukuran: string; warna?: number; abu?: number; kantor?: number; kantor_abu?: number; layar?: number };
const garis = JSON.parse(py("garis", join(KERJA, "garis.json"))) as HasilGaris[];
catat("");
catat("THE GOLD LINE (peak OKLab difference between the card with and without the line; about 0.02 is just noticeable, 0.05 plainly visible)");
for (const g of garis) {
  catat(`  ${g.nama}: ${g.warna !== undefined ? `colour ${g.warna}, greyscale ${g.abu}, office print (simulated) ${g.kantor}, office print greyscale ${g.kantor_abu}` : `${g.layar}${g.layar! < 0.02 ? "  (below just-noticeable)" : ""}`}`);
}
{
  const nilai = (w: number, ukuran: string) => garis.find((g) => g.lebar === w && g.ukuran === ukuran && (ukuran !== "print" || g.muka === "front"))!;
  const crop = (w: number, muka: string, jenis: string) => `<img src="file://${join(KERJA, `crop-${muka}-${w}-${jenis}.png`)}" style="height:16mm;display:block;border:0.2mm solid rgba(31,42,51,.15)">`;
  const layarCrop = (w: number, px: number, dpr: number) => `<img src="file://${join(KERJA, `layar-crop-${w}-${px}-${dpr}.png`)}" style="height:14mm;display:block;image-rendering:pixelated;border:0.2mm solid rgba(31,42,51,.15)">`;
  const html = `<div class="lembar" style="width:250mm">
<h1>C · The warm-gold line: 0.50, 0.75 and 1.00 mm</h1>
<p class="sub">The line is structure and recognition, not decoration: identical on every family, at the same height on both faces. Its colour, the candidate ${W.emas} (ochre, OKLCH 0.711 / 0.105 / 85), sits midway in lightness between the paper and the family colours, so it separates from both by the same ratio (about 2.4:1), in colour and in greyscale. No metallic effect, no gradient. Crops: 22 × 9 mm of the card's right edge round the line, at 600 dpi; «office print» is a simulation (15% dot gain, 0.04 mm ink spread); the real test is page 2 of the A4 proof.</p>
<table class="spek"><tr><th>Width</th><th>Front, colour</th><th>Front, greyscale</th><th>Front, office print (sim.)</th><th>Back, colour</th><th>Back, office print greyscale (sim.)</th></tr>
${LEBAR_GARIS.map((w) => `<tr><td><b>${w.toFixed(2)} mm</b></td><td>${crop(w, "front", "warna")}</td><td>${crop(w, "front", "abu")}</td><td>${crop(w, "front", "kantor")}</td><td>${crop(w, "back", "warna")}</td><td>${crop(w, "back", "kantor_abu")}</td></tr>`).join("")}
<tr><td></td><td colspan="5" class="ket">In print every width is plainly visible: the line changes the card by ${nilai(0.5, "print").warna} in colour, ${nilai(0.5, "print").abu} in greyscale and ${nilai(0.5, "print").kantor} in the simulated office print, at 0.50, 0.75 and 1.00 mm alike. In print the width is a question of character, not survival: 1.00 mm starts to read as a stripe, 0.50 mm as an edge, <b>0.75 mm as structure (recommended)</b>.</td></tr></table>
<h2 style="margin-top:6mm">On screen: the front at the size each context shows it (pixels enlarged 8×, nearest neighbour)</h2>
<table class="spek"><tr><th>Width</th>${[440, 358, 266].flatMap((px) => [1, 2].map((d) => `<th>card ${px} px, ${d}x<br>${px === 440 ? "email 600" : px === 358 ? "phone" : "email 320"}; ${f2((px * d) / 85.6)} device px per mm</th>`)).join("")}</tr>
${LEBAR_GARIS.map((w) => `<tr><td><b>${w.toFixed(2)} mm</b></td>${[440, 358, 266].flatMap((px) => [1, 2].map((d) => `<td>${layarCrop(w, px, d)}<span>${nilai(w, `${px}px@${d}x`).layar!.toFixed(3)} · ${f2((w * px * d) / K.UKURAN.lebar)} px</span></td>`)).join("")}</tr>`).join("")}</table>
<p class="ket">Numbers: the peak OKLab difference the line makes (about 0.02 is just noticeable, 0.05 plainly visible), then the line's width in device pixels. Only one case weakens: the 266 px card (the email at 320 px) on a 1× screen, where a 0.50 or 0.75 mm line (1.6 or 2.3 px) blends into the edge it sits on and shows as a warm seam (0.099), still above noticeable. At 2× and above, as on almost every phone, every width is a clean line.</p></div>`;
  await potret(halaman("C · line", html), "C-garis-emas.png", { lebar: Math.ceil(mmPx(266)), skala: 3 });
}

// ════════════════════════════════════════════════════════════════════════════
// D. Typography, with the PINTAR wordmark and the name-consistency panel
// ════════════════════════════════════════════════════════════════════════════
{
  const layarPx = (pt: number, lebarKartu: number) => ((pt * 25.4) / 72) * (lebarKartu / K.UKURAN.lebar);
  const CONTOH: Record<string, [string, string, string]> = {
    merek: ["kp-merek", "PINTAR", W.hijau], nama: ["kp-nama", "Ratna Dewi Kusumawardani", W.tinta], id: ["kp-id", "A14C D7ST", W.tinta2],
    peran: ["kp-bab-baris kp-peran", "Kepala departemen", W.kertas], sekolah: ["kp-bab-baris", "SMA Bukit Asri Kaliandra", W.kertas],
    petunjuk: ["kp-petunjuk", K.KATA_BELAKANG.petunjuk, W.tinta], situs: ["kp-situs", K.KATA_BELAKANG.situs, W.tinta3],
  };
  const kontras: Record<string, string> = {
    merek: f2(K.rasio(W.hijau, W.kertas)), nama: f2(K.rasio(W.tinta, W.kertas)), id: `${f2(K.rasio(W.tinta2, W.kertas))} (tile ${f2(K.rasio(W.hijau, W.hijauLembut))})`,
    peran: `${f2(Math.min(...K.KELUARGA.map((k) => K.rasio(W.kertas, K.PALET.terpisah[k]))))}–${f2(Math.max(...K.KELUARGA.map((k) => K.rasio(W.kertas, K.PALET.terpisah[k]))))}`,
    sekolah: "as role", petunjuk: f2(K.rasio(W.tinta, W.kertas)), situs: f2(K.rasio(W.tinta3, W.kertas)),
  };
  const baris = Object.entries(K.GAYA).map(([k, g]) => {
    const [kelas, contoh, warna] = CONTOH[k];
    const latar = k === "peran" || k === "sekolah" ? K.PALET.terpisah.kadep : W.kertas;
    return `<tr><td><b>${g.peran}</b></td><td style="background:${latar};padding:1.4mm 2mm"><span class="kp"><span class="${kelas}" style="display:inline-block;color:${warna}">${contoh}</span></span></td>
<td>${g.huruf}</td><td>${g.berat}</td><td>${g.pt} pt</td><td>${g.baris}</td><td>${g.spasi} em${g.kapital ? ", caps" : ""}${g.kata ? `; words +${g.kata} em` : ""}</td><td>${g.warna}</td><td>${kontras[k]}</td><td>${layarPx(g.pt, 358).toFixed(1)} / ${layarPx(g.pt, 266).toFixed(1)} px</td></tr>`;
  }).join("");
  const mirip = (h: string, b: number) => `<span style="font-family:'${h}';font-weight:${b};font-size:9pt;letter-spacing:0.06em">0D 17 2Z 5S 8B</span>`;
  await potret(halaman("D · type", `<div class="lembar" style="width:252mm">
<h1>D · Typography: two families, four sizes, three weights</h1>
<p class="sub">Plus Jakarta Sans 400/600 and IBM Plex Mono 500: the app's own OFL files (public/fonts), licensed for print and embedding. Samples at actual size (this render is 4×). Sizes 12 · 9 · 8 · 6.5 pt. «On screen»: CSS px when the card is 358 px (phone) and 266 px (email 320) wide.</p>
<table class="spek"><tr><th>Style</th><th>Sample (actual size)</th><th>Typeface</th><th>Weight</th><th>Size</th><th>Line height</th><th>Tracking</th><th>Colour</th><th>Contrast</th><th>On screen</th></tr>${baris}</table>
<div style="display:grid;grid-template-columns:1.1fr 1fr;gap:8mm;margin-top:6mm">
<div><h2>PINTAR: the canonical wordmark (brand correction, 5 Oct)</h2>
<p class="ket" style="font-size:6.5pt">The canonical PINTAR wordmark replaces «PINTAR SELALU» (the card's freeze reopened for this alone, 5 Oct): Helvetica Neue 65 Medium, capitals, tracking +50, PINTAR green ${W.hijau} (7.08:1), on the 6 mm margin with its cap top where the old line's was (5.57 mm). Cap height 2.9 mm (16.4 mm wide in the stand-in face; the outlined master fixes the exact width, never under 15 mm): the wordmark's 15 mm print minimum sets the size. Everything else on the card is unchanged. Rendered here in a stand-in face until the outlined master replaces it.</p>
<h2 style="margin-top:4mm">Do the front and back read as one name?</h2>
<div style="display:flex;gap:4mm;align-items:center;background:${W.kertas};padding:3mm;border-radius:1mm">
<div><p class="ket" style="margin:0 0 1mm">Front header</p><span class="kp"><span class="kp-merek" style="color:${W.hijau}">PINTAR</span></span></div>
<div><p class="ket" style="margin:0 0 1mm">Back instruction</p><span class="kp"><span class="kp-petunjuk" style="color:${W.tinta}">${K.KATA_BELAKANG.petunjuk}</span></span></div>
<div><p class="ket" style="margin:0 0 1mm">Back URL</p><span class="kp"><span class="kp-situs" style="color:${W.tinta3}">${K.KATA_BELAKANG.situs}</span></span></div></div>
<p class="ket"><span class="buka">Resolved (5 Oct):</span> the front, the back's instruction, the app and the emails all name PINTAR. PT ZAYD PINTAR SELALU is the company and pintarselalu.com the address; neither is the product's name.</p></div>
<div><h2>Look-alike characters at card size (9 pt)</h2>
<table class="spek"><tr><td>IBM Plex Mono 500 (kept)</td><td>${mirip("IBM Plex Mono", 500)}</td></tr><tr><td>Plus Jakarta Sans 600</td><td>${mirip("Plus Jakarta Sans", 600)}</td></tr></table>
<p class="ket">Kept under examination, as asked: Plex Mono's dotted zero never reads as D; 1 has a flag and a foot; 2 a curved top against Z's straight one; 5's flat top against S; 8's two closed bowls against B's flat spine. No reason found to depart.<br><br><b>Changes from round 1:</b> role and school 7.5 → 8 pt (the lower field has room; on the 266 px email card 8 pt is 8.8 px instead of 8.2) and the QR instruction to 8 pt, so the chapter and the instruction share one size; «PINTAR SELALU» replaces «PINTAR» (0.14 → 0.16 em, words +0.12 em). Smallest printed size stays 6.5 pt (x-height 1.23 mm), for the header and the URL only.</p></div></div></div>`),
    "D-tipografi.png", { lebar: Math.ceil(mmPx(252 + 16)), skala: 4 });
}

// ════════════════════════════════════════════════════════════════════════════
// F. Stress cases and the open questions
// ════════════════════════════════════════════════════════════════════════════
const kk = (html: string, ket: string) => `<div>${html}<p class="ket">${ket}</p></div>`;
const NETRAL = K.PALET.terpisah.adminPlatform;
await potret(halaman("F · stress", `<div class="lembar" style="width:${3 * 85.6 + 2 * 6}mm">
<h1>F · Stress cases and the open product questions</h1>
<p class="sub">Names are never shrunk and never cut: they wrap at a word and grow upward. Nothing is invented to fill space. Undecided questions are labelled so.</p>
<h2>Names, schools, Admin platform</h2><div class="kisi">
${kk(K.depan(PANJANG), "<b>Six-word name</b> (45 characters): two lines at 12 pt, growing upward.")}
${kk(K.depan(ORANG.adminSekolah), "<b>One-word name, long school</b> (68 characters): the school wraps at a word below the line.")}
${kk(K.depan(ORANG.kadep), "<b>Apostrophe</b>: shown as stored (Nur'aini).")}
${kk(K.depan(ORANG.dekan), "<b>Four-word name.</b>")}
${kk(K.depan(ORANG.adminPlatform), "<b>Admin platform</b>: «Admin platform» with no second line (Yazid's decision). The space stays empty.")}
<div></div></div>
<h2>Several roles at one school: one card, roles listed, colour <span class="buka">UNDECIDED</span></h2><div class="kisi">
${kk(K.depan(DUA_PERAN, { warnaBab: K.PALET.terpisah.guru }), "<span class='buka'>Undecided</span> · <b>(a) the colour of the role held longest</b> (here Guru, held since 2019; Kepala departemen since 2024). The dates are never on the card.")}
${kk(K.depan(DUA_PERAN, { warnaBab: NETRAL }), `<span class='buka'>Undecided</span> · <b>(b) one shared neutral for any card with several roles.</b> Finding: at this lightness the neutral is already Admin platform's slate (${NETRAL}); this card would look like an Admin platform card. A distinct neutral needs another lightness, which reopens the ladder.`)}
<div><p class="ket" style="margin-top:0"><b>Order: alphabetical by the Terminology v1 names</b> («Guru · Kepala departemen»), following the app's own rule for people: «Alphabetical, and that is the only order. There is no ranking to offer» (src/lib/pengajar.ts:193). Not by seniority, and not by the app's <code>display_role</code>, «the highest role assignment» (src/lib/pembelajaran.ts:21-22), which must not set the colour either. The rule is a proposal for Yazid.</p></div>
</div>
<h2>Roles at two different schools: how the school line reads <span class="buka">UNDECIDED</span></h2><div class="kisi">
${kk(K.depan(DUA_SEKOLAH, { warnaBab: K.PALET.terpisah.guru, susunan: "pasangan" }), "<span class='buka'>Undecided</span> · <b>(i) one line per role, with its school.</b> Unambiguous; takes a line per school.")}
${kk(K.depan(DUA_SEKOLAH, { warnaBab: K.PALET.terpisah.guru, susunan: "terpisah" }), "<span class='buka'>Undecided</span> · <b>(ii) the roles, then the schools.</b> Shorter, but it no longer says which role is at which school.")}
<div><p class="ket" style="margin-top:0">Both shown in the Guru colour only because the colour question above is open. A third answer, one card per school, would give one person two cards with the same PINTAR ID; that is an identity-architecture question, not shown.</p></div>
</div></div>`), "F-kasus-uji.png", { lebar: LEBAR3, skala: 3 });

// ════════════════════════════════════════════════════════════════════════════
// G. The recognition test
// ════════════════════════════════════════════════════════════════════════════
{
  const letakMeja: Array<[number, number, number]> = [[4, 6, -4], [80, 2, 3], [158, 8, -2], [10, 66, 2.5], [86, 70, -3.5], [162, 64, 5]];
  const meja = (kartu: string[], letak: Array<[number, number, number]>, tinggi: number, tutup: boolean, lebar = 258) => `<div class="${tutup ? "tutup" : ""}" style="position:relative;width:${lebar}mm;height:${tinggi}mm;background:#CFC9BE;border-radius:2mm;overflow:hidden">${kartu.map((h, i) => {
    const [x, y, r] = letak[i];
    return `<div style="position:absolute;left:${x}mm;top:${y}mm;transform:rotate(${r}deg);filter:drop-shadow(0 0.4mm 0.6mm rgba(0,0,0,.18))">${h}</div>`;
  }).join("")}</div>`;
  const enam = K.KELUARGA.map((k) => K.depan(ORANG[k]));
  // the mixed table: six PINTAR and seven others, shuffled, every brand name covered
  const campur = [KARTU_LAIN[0].html, enam[1], KARTU_LAIN[4].html, enam[3], KARTU_LAIN[2].html, enam[0], KARTU_LAIN[5].html, enam[5], KARTU_LAIN[1].html, enam[2], KARTU_LAIN[6].html, enam[4], KARTU_LAIN[3].html];
  const letakCampur: Array<[number, number, number]> = [];
  for (let i = 0; i < 13; i++) letakCampur.push([6 + (i % 4) * 88 + ((i * 7) % 4), 6 + Math.floor(i / 4) * 60 + ((i * 3) % 4), ((i * 37) % 11) - 5]);
  letakCampur[12] = [138, 6 + 3 * 60 + 2, 3];
  const belakangHtml = K.belakang(UTAMA, QR);
  const belakangTutup = belakangHtml.replace('class="kp-petunjuk"', 'class="kp-petunjuk merek"').replace('class="kp-situs"', 'class="kp-situs merek"');
  await potret(halaman("G · recognition", `<div class="lembar" style="width:362mm">
<h1>G · The recognition test: is it PINTAR before it is read?</h1>
<p class="sub">1: the six as they are. 2: the PINTAR wordmark covered. 3: the six among seven other cards, every brand name covered on all thirteen. The others are invented organisations, drawn plainly and competently in ordinary typefaces; one (Yayasan, green two-band) deliberately shares PINTAR's structure without the line. 4: the back with every «PINTAR» covered, beside two other backs.</p>
<h2>1 · As they are</h2>${meja(enam, letakMeja, 130, false)}
<h2 style="margin-top:6mm">2 · The PINTAR wordmark covered</h2>${meja(enam, letakMeja, 130, true)}
<h2 style="margin-top:6mm">3 · Among other cards, every brand name covered</h2>${meja(campur, letakCampur, 252, true, 362)}
<h2 style="margin-top:6mm">4 · The back, «PINTAR» covered, beside two other backs</h2>
<div class="tutup" style="display:flex;gap:8mm;background:#CFC9BE;padding:6mm;border-radius:2mm">${belakangTutup}${BELAKANG_LAIN.map((b) => b.html).join("")}</div></div>`),
    "G-uji-pengenalan.png", { lebar: Math.ceil(mmPx(362 + 16)), skala: 2.2 });
}

// ════════════════════════════════════════════════════════════════════════════
// I. The A4 proof at 100% (the PDF); E and H use its results
// ════════════════════════════════════════════════════════════════════════════
type Slot = { html: string; ket: string } | { kalibrasi: true } | { lipat: string; ket: string } | null;
const A4 = { w: 210, h: 297 };
const CELAH = 14;
const KOLOM = [(A4.w - 2 * K.UKURAN.lebar - CELAH) / 2, (A4.w - 2 * K.UKURAN.lebar - CELAH) / 2 + K.UKURAN.lebar + CELAH];
const ATAS = 26.5;
const barisY = (r: number) => ATAS + r * (K.UKURAN.tinggi + CELAH);
const TANDA = { jarak: 3, panjang: 3.5, tebal: 0.1 };
const garisHitam = (x0: number, y0: number, w: number, h: number) => `<div style="position:absolute;left:${x0}mm;top:${y0}mm;width:${w}mm;height:${h}mm;background:#000"></div>`;
function tandaPotong(x: number, y: number, w: number = K.UKURAN.lebar, h: number = K.UKURAN.tinggi): string {
  const { jarak: j, panjang: p, tebal: t } = TANDA;
  let s = "";
  for (const [cx, sx] of [[x, -1], [x + w, 1]] as const) {
    for (const [cy, sy] of [[y, -1], [y + h, 1]] as const) {
      s += garisHitam(sx < 0 ? cx - j - p : cx + j, cy - t / 2, p, t);
      s += garisHitam(cx - t / 2, sy < 0 ? cy - j - p : cy + j, t, p);
    }
  }
  return s;
}
const kalibrasi = (x: number, y: number) => `<div style="position:absolute;left:${x}mm;top:${y}mm;width:${K.UKURAN.lebar}mm;height:${K.UKURAN.tinggi}mm;border:0.1mm solid ${W.tinta3};border-radius:${K.UKURAN.sudut}mm;box-sizing:border-box;padding:5mm 6mm">
<p style="font:600 7pt 'Plus Jakarta Sans';margin:0 0 1.5mm">Periksa skala · check the scale</p>
<p style="font:400 6.5pt/1.4 'Plus Jakarta Sans';margin:0 0 3mm;color:${W.tinta2}">Garis tepi kotak ini tepat 85,6 × 53,98 mm (CR80), dan garis di bawah tepat 50 mm. Jika ukurannya lain, pencetak mengubah skala: cetak ulang pada 100%.</p>
<div style="position:relative;width:50mm;height:3mm;border-bottom:0.2mm solid #000">${[0, 10, 20, 30, 40, 50].map((t) => `<div style="position:absolute;left:${t - 0.1}mm;bottom:0;width:0.2mm;height:${t % 50 ? 1.5 : 3}mm;background:#000"></div>`).join("")}</div>
<p style="font:400 6pt 'Plus Jakarta Sans';margin:1mm 0 0;color:${W.tinta2}">0 · 10 · 20 · 30 · 40 · 50 mm</p></div>`;
type LetakQr = { kode: string; nama: string; halaman: number; x: number; y: number };
const letakQr: LetakQr[] = [];
function lembarA4(no: number, dari: number, judul: string, slot: Slot[], qrDi: Record<number, string> = {}): string {
  let s = `<div class="a4" style="position:relative;width:${A4.w}mm;height:${A4.h}mm;overflow:hidden;background:#fff;page-break-after:always">
<p style="position:absolute;left:${KOLOM[0]}mm;top:6mm;margin:0;font:600 9.5pt 'Plus Jakarta Sans'">Kartu PINTAR · putaran 2 · ${judul} <span style="font-weight:400;color:${W.tinta3}">(halaman ${no} dari ${dari})</span></p>
<p style="position:absolute;left:${KOLOM[0]}mm;top:10.6mm;margin:0;font:600 7.5pt 'Plus Jakarta Sans'">Cetak pada 100% (ukuran sebenarnya). Jangan pilih «Sesuaikan dengan halaman». · Print at 100%, no fit-to-page.</p>
<p style="position:absolute;left:${KOLOM[0]}mm;top:14.2mm;margin:0;font:400 6pt 'Plus Jakarta Sans';color:${W.tinta2}">Potong di tanda potong. Semua orang, sekolah dan PINTAR ID di sini contoh rekaan; QR membuka https://contoh.pintar.invalid/…, alamat yang tidak pernah ada.</p>`;
  for (let i = 0; i < slot.length; i++) {
    const sl = slot[i];
    const x = KOLOM[i % 2], y = barisY(Math.floor(i / 2));
    if (!sl) continue;
    if ("kalibrasi" in sl) { s += kalibrasi(x, y); continue; }
    if ("lipat" in sl) {
      // a front/back pair across both columns: back on the left, front on the right, sharing the fold
      const x0 = (A4.w - 2 * K.UKURAN.lebar) / 2;
      s += `<div style="position:absolute;left:${x0 - BLEED}mm;top:${y - BLEED}mm">${sl.lipat}</div>${tandaPotong(x0, y, 2 * K.UKURAN.lebar)}`
        + garisHitam(x0 + K.UKURAN.lebar - 0.05, y - 6.5, 0.1, 1.2) + garisHitam(x0 + K.UKURAN.lebar - 0.05, y - 4.7, 0.1, 1.2) + garisHitam(x0 + K.UKURAN.lebar - 0.05, y - 2.9, 0.1, 0.6)
        + garisHitam(x0 + K.UKURAN.lebar - 0.05, y + K.UKURAN.tinggi + 2.3, 0.1, 0.6) + garisHitam(x0 + K.UKURAN.lebar - 0.05, y + K.UKURAN.tinggi + 3.5, 0.1, 1.2) + garisHitam(x0 + K.UKURAN.lebar - 0.05, y + K.UKURAN.tinggi + 5.3, 0.1, 1.2)
        + `<p style="position:absolute;left:${x0 + 3}mm;width:${K.UKURAN.lebar - 9}mm;top:${y + K.UKURAN.tinggi + 3.2}mm;margin:0;font:400 5.5pt/1.35 'Plus Jakarta Sans';color:${W.tinta3}">${sl.ket}</p>`;
      if (qrDi[i]) letakQr.push({ kode: qrDi[i], nama: sl.ket, halaman: no - 1, x: x0, y });
      i++; // the pair takes both columns of the row
      continue;
    }
    s += `<div style="position:absolute;left:${x - BLEED}mm;top:${y - BLEED}mm">${sl.html}</div>${tandaPotong(x, y)}
<p style="position:absolute;left:${x}mm;width:${K.UKURAN.lebar}mm;top:${y + K.UKURAN.tinggi + 3.2}mm;margin:0;text-align:center;font:400 5.5pt 'Plus Jakarta Sans';color:${W.tinta3}">${sl.ket}</p>`;
    if (qrDi[i]) letakQr.push({ kode: qrDi[i], nama: sl.ket, halaman: no - 1, x, y });
  }
  return s + "</div>";
}
const cd = (o: K.Orang, opsi: K.OpsiMuka = {}) => K.depan(o, { bleed: BLEED, ...opsi });
const cb = (opsi: K.OpsiMuka = {}) => K.belakang(UTAMA, QR, { bleed: BLEED, ...opsi });
/** The fold pair: back on the left, front on the right, one piece of paper; the bleed only on the outer edges. */
const lipat = (abu: boolean) => {
  const b = BLEED;
  const kiri = K.belakang(UTAMA, QR, { bleed: b, abu }), kanan = K.depan(UTAMA, { bleed: b, abu });
  return `<div style="position:relative;width:${2 * K.UKURAN.lebar + 2 * b}mm;height:${K.UKURAN.tinggi + 2 * b}mm;overflow:hidden">
<div style="position:absolute;left:0;top:0;width:${K.UKURAN.lebar + b}mm;height:100%;overflow:hidden">${kiri}</div>
<div style="position:absolute;left:${K.UKURAN.lebar + b}mm;top:0;width:${K.UKURAN.lebar + b}mm;height:100%;overflow:hidden"><div style="position:absolute;left:-${b}mm;top:0">${kanan}</div></div></div>`;
};
const HAL = 4;
const hal1: Slot[] = [...K.KELUARGA.map((k) => ({ html: cd(ORANG[k]), ket: `Depan · ${K.PERAN[k]} · ${K.PALET.terpisah[k]}` })), { html: cb(), ket: "Belakang · sama untuk semua peran" }, { kalibrasi: true }];
const hal2: Slot[] = [
  { lipat: lipat(false), ket: "Lipat: potong di tanda luar, lipat ke belakang di tanda tengah, balik ke samping." }, null,
  { lipat: lipat(true), ket: "Lipat, skala abu-abu." }, null,
  { html: cd(UTAMA, { garisMm: 0.5 }), ket: "Garis emas 0,50 mm" }, { html: cd(UTAMA, { garisMm: 0.75 }), ket: "Garis emas 0,75 mm (usulan)" },
  { html: cd(UTAMA, { garisMm: 1.0 }), ket: "Garis emas 1,00 mm" }, { kalibrasi: true }];
const hal3: Slot[] = [
  { html: cd(PANJANG), ket: "Nama enam kata" }, { html: cd(ORANG.adminPlatform), ket: "Admin platform, tanpa baris kedua" },
  { html: cd(DUA_PERAN, { warnaBab: K.PALET.terpisah.guru }), ket: "Dua peran (a): warna peran terlama · BELUM DIPUTUSKAN" }, { html: cd(DUA_PERAN, { warnaBab: NETRAL }), ket: "Dua peran (b): satu warna netral · BELUM DIPUTUSKAN" },
  { html: cd(DUA_SEKOLAH, { warnaBab: K.PALET.terpisah.guru, susunan: "pasangan" }), ket: "Dua sekolah (i): per peran · BELUM DIPUTUSKAN" }, { html: cd(DUA_SEKOLAH, { warnaBab: K.PALET.terpisah.guru, susunan: "terpisah" }), ket: "Dua sekolah (ii): peran lalu sekolah · BELUM DIPUTUSKAN" },
  { html: cb(), ket: "Belakang (untuk uji pindai)" }, { html: cb({ garisMm: 0.5 }), ket: "Belakang, garis 0,50 mm (untuk uji pindai)" }];
const hal4: Slot[] = [...K.KELUARGA.map((k) => ({ html: cd(ORANG[k], { abu: true }), ket: `Depan · ${K.PERAN[k]} · skala abu-abu` })), { html: cb({ abu: true }), ket: "Belakang · skala abu-abu" }, { kalibrasi: true }];
py("huruf", join(AKAR, "public/fonts/plus-jakarta-sans-latin.woff2"), KERJA);
const htmlA4 = halaman("Kartu PINTAR · putaran 2 · A4 100%", `<div style="zoom:10">${lembarA4(1, HAL, "enam depan dan belakang", hal1, { 6: "p1-back" })
  + lembarA4(2, HAL, "lipat depan–belakang dan garis emas", hal2, { 0: "p2-fold", 2: "p2-fold-grey" })
  + lembarA4(3, HAL, "kasus uji", hal3, { 6: "p3-back", 7: "p3-back-0.50" })
  + lembarA4(4, HAL, "skala abu-abu", hal4, { 6: "p4-back-grey" })}</div>`,
  `@page { size: A4; margin: 0; } body { background: #fff; } .a4:last-child { page-break-after: auto; }`, KERJA);
const PDF = join(RENDER, "I-A4-100persen.pdf");
{
  const f = join(KERJA, "I-A4.html");
  writeFileSync(f, htmlA4);
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: PDF, width: "210mm", height: "297mm", scale: 0.1, printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
  await ctx.close();
}

// ════════════════════════════════════════════════════════════════════════════
// H. In context: email 600 and 320, light and dark; a phone
// ════════════════════════════════════════════════════════════════════════════
const depanPng = await potret(halaman("depan", `<div style="display:inline-block">${K.depan(UTAMA, { garisTepi: true })}</div>`, "body{background:transparent}"), "H-kartu-depan.png", { lebar: 400, skala: 880 / mmPx(K.UKURAN.lebar), elemen: ".kp", transparan: true });
const belakangPng = await potret(halaman("belakang", `<div style="display:inline-block">${K.belakang(UTAMA, QR, { garisTepi: true })}</div>`, "body{background:transparent}"), "H-kartu-belakang.png", { lebar: 400, skala: 880 / mmPx(K.UKURAN.lebar), elemen: ".kp", transparan: true });
const ALT_DEPAN = `Kartu PINTAR, sisi depan: ${UTAMA.nama}, PINTAR ID ${K.tampilId(UTAMA.id)}, Guru, ${S.smp}.`;
const ALT_BELAKANG = "Kartu PINTAR, sisi belakang: kode QR ke halaman masuk PINTAR.";
const emailPng: Record<string, string> = {};
{
  const blok = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px 0;">
<tr><td align="center" style="padding:0 0 12px 0;"><img src="file://${depanPng}" width="440" alt="${K.esc(ALT_DEPAN)}" style="display:block;width:100%;max-width:440px;height:auto;border:0;"></td></tr>
<tr><td align="center"><img src="file://${belakangPng}" width="440" alt="${K.esc(ALT_BELAKANG)}" style="display:block;width:100%;max-width:440px;height:auto;border:0;"></td></tr></table>`;
  const email = bingkaiEmail({
    subjek: "Kartu PINTAR Anda", pratinjau: `Simpan kartu ini. PINTAR ID Anda: ${K.tampilId(UTAMA.id)}.`, judul: "Kartu PINTAR Anda",
    isi: [
      { jenis: "paragraf", teks: `Halo, ${UTAMA.nama}. Ini kartu PINTAR Anda.` },
      { jenis: "paragraf", teks: "@@KARTU@@" },
      { jenis: "rincian", baris: [["PINTAR ID", K.tampilId(UTAMA.id)], ["Peran", "Guru"], ["Sekolah", S.smp]] },
      { jenis: "paragraf", teks: "Kartu ini juga ada di Akun saya." },
      { jenis: "tombol", teks: "Masuk ke PINTAR", href: "https://contoh.pintar.invalid/masuk" },
    ],
    alasan: "Anda menerima email ini karena akun PINTAR Anda baru saja aktif.",
  });
  const html = email.html.replace(LOGO_BAKU, `file://${AKAR}/public/brand/pintar-selalu-logo.png`).replace(/<p class="pin-teks"[^>]*>@@KARTU@@<\/p>/, blok);
  if (!html.includes(depanPng)) throw new Error("the card block was not placed in the email");
  for (const [lebar, gelap] of [[600, false], [600, true], [320, false], [320, true]] as const) {
    const nama = `H-email-${lebar}-${gelap ? "gelap" : "terang"}.png`;
    const f = join(KERJA, nama.replace(".png", ".html"));
    writeFileSync(f, html);
    const ctx = await browser.newContext({ viewport: { width: lebar, height: 900 }, deviceScaleFactor: 2, colorScheme: gelap ? "dark" : "light" });
    const p = await ctx.newPage();
    await p.goto(`file://${f}`);
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: join(RENDER, nama), fullPage: true });
    const cek = await p.evaluate(() => ({ lebarDok: document.documentElement.scrollWidth, kartu: Array.from(document.querySelectorAll("img[alt^='Kartu PINTAR']")).map((i) => Math.round(i.getBoundingClientRect().width)) }));
    catat(`email ${lebar} ${gelap ? "dark" : "light"}: page width ${cek.lebarDok} px (no sideways scroll: ${cek.lebarDok <= lebar}), card shown ${cek.kartu.join(" and ")} px wide`);
    if (cek.lebarDok > lebar) gagal++;
    emailPng[nama] = join(RENDER, nama);
    await ctx.close();
  }
  const LOGO = `data:image/png;base64,${readFileSync(join(AKAR, "public/brand/pintar-selalu-logo.png")).toString("base64")}`;
  const ponsel = `<div style="width:390px;min-height:844px;background:${W.kertas};font-family:'Plus Jakarta Sans';color:${W.tinta}">
<div style="height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid rgba(31,42,51,.12);background:#fff">
<img src="${LOGO}" alt="PINTAR" style="height:32px;display:block"><span style="font-size:14px;color:${W.tinta2}">Keluar</span></div>
<div style="padding:24px 16px">
<p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${W.tinta3}">Akun saya</p>
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:600">Kartu PINTAR Anda</h1>
<img src="file://${depanPng}" alt="${K.esc(ALT_DEPAN)}" style="display:block;width:100%;height:auto">
<img src="file://${belakangPng}" alt="${K.esc(ALT_BELAKANG)}" style="display:block;width:100%;height:auto;margin-top:12px">
<div style="margin-top:20px;border-top:1px solid rgba(31,42,51,.12)">${[["PINTAR ID", K.tampilId(UTAMA.id), true], ["Peran", "Guru", false], ["Sekolah", S.smp, false]].map(([k, v, mono]) =>
    `<div style="display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid rgba(31,42,51,.12);font-size:14px"><span style="color:${W.tinta3}">${k}</span><span style="${mono ? "font-family:'IBM Plex Mono';font-weight:500;letter-spacing:.06em;" : ""}font-size:${mono ? 15 : 14}px;text-align:right">${v}</span></div>`).join("")}</div>
<a style="display:block;margin-top:24px;height:52px;line-height:52px;text-align:center;border-radius:8px;background:${W.hijau};color:#fff;font-weight:600;font-size:16px;text-decoration:none">Unduh kartu</a>
</div></div>`;
  await potret(halaman("ponsel", ponsel, "body{background:#FBFAF7}"), "H-ponsel-390.png", { lebar: 390, tinggi: 844, skala: 2 });
}

// ════════════════════════════════════════════════════════════════════════════
// Checks on the rendered faces: safe margin, quiet zone, name length, forbidden words
// ════════════════════════════════════════════════════════════════════════════
{
  const semua = [...K.KELUARGA.map((k) => K.depan(ORANG[k])), K.depan(PANJANG), K.depan(DUA_PERAN), K.depan(DUA_SEKOLAH, { susunan: "pasangan" }), K.depan(DUA_SEKOLAH, { susunan: "terpisah" }),
    K.belakang(UTAMA, QR), ...LEBAR_GARIS.map((g) => K.belakang(UTAMA, QR, { garisMm: g })), ...LEBAR_GARIS.map((g) => K.depan(UTAMA, { garisMm: g }))];
  const f = join(KERJA, "cek.html");
  writeFileSync(f, halaman("cek", `<div style="display:flex;flex-wrap:wrap;gap:10mm;padding:10mm">${semua.join("")}</div>`));
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const p = await ctx.newPage();
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  const hasil = await p.evaluate(({ aman, px, garis, tenang, sisi, modul }: { aman: number; px: number; garis: number; tenang: number; sisi: number; modul: number }) => {
    const keluar: string[] = [], tenangMasalah: string[] = [], garisMasalah: string[] = [];
    const nama: number[] = [];
    const teks: string[] = [];
    document.querySelectorAll(".kp-trim").forEach((trim, i) => {
      const t = trim.getBoundingClientRect();
      const batas = { l: t.left + aman * px, r: t.right - aman * px, a: t.top + aman * px, b: t.bottom - aman * px };
      trim.querySelectorAll("p, svg, .kp-ubin").forEach((el) => {
        const range = document.createRange(); range.selectNodeContents(el);
        const rr = el.tagName === "P" ? range.getBoundingClientRect() : el.getBoundingClientRect();
        if (rr.left < batas.l - 0.5 || rr.right > batas.r + 0.5 || rr.top < batas.a - 0.5 || rr.bottom > batas.b + 0.5) keluar.push(`face ${i}: ${el.tagName.toLowerCase()}.${el.getAttribute("class") ?? ""} "${(el.textContent ?? "").slice(0, 24)}"`);
        // text never crosses the line: above-line text ends above it, below-line text starts below it
        if (el.tagName === "P") {
          const gy = t.top + garis * px;
          if (rr.top < gy && rr.bottom > gy) garisMasalah.push(`face ${i}: "${(el.textContent ?? "").slice(0, 24)}"`);
        }
      });
      // the ID in the tile must start below the symbol's 4-module quiet zone
      const ubin = trim.querySelector(".kp-ubin");
      const idUbin = trim.querySelector(".kp-id-ubin");
      if (ubin && idUbin) {
        const u = ubin.getBoundingClientRect();
        const kotak = ubin.querySelector("svg")!.getBoundingClientRect(); // the symbol and its quiet zone, this face's own
        const range = document.createRange(); range.selectNodeContents(idUbin);
        const r = range.getBoundingClientRect();
        if (r.top < kotak.bottom - 0.5) tenangMasalah.push(`face ${i}: ID top ${((r.top - u.top) / px).toFixed(2)} mm, quiet zone ends ${((kotak.bottom - u.top) / px).toFixed(2)} mm (${tenang} modules)`);
        void sisi; void modul;
      }
      trim.querySelectorAll(".kp-nama").forEach((el) => nama.push(Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight))));
      teks.push((trim as HTMLElement).innerText);
    });
    return { keluar, tenangMasalah, garisMasalah, nama, teks: teks.join(" \n ") };
  }, { aman: K.UKURAN.aman, px: 96 / 25.4, garis: K.TATA.garis, tenang: K.TENANG, sisi: UBIN.sisi, modul: UBIN.modul });
  catat("");
  catat(`SAFE MARGIN (3 mm): ${hasil.keluar.length ? `${hasil.keluar.length} outside: ${hasil.keluar.join("; ")}` : `every text line, every QR and tile inside, on all ${semua.length} faces`}`);
  catat(`QUIET ZONE: ${hasil.tenangMasalah.length ? `INTRUDED: ${hasil.tenangMasalah.join("; ")}` : `the tile's ID starts below the full 4-module quiet zone on every back (round 1's tile put it 1.6 mm below the symbol, inside the 2.8 mm zone; corrected)`}`);
  catat(`THE LINE: ${hasil.garisMasalah.length ? `text crosses it: ${hasil.garisMasalah.join("; ")}` : "no text touches it on any face"}`);
  gagal += hasil.keluar.length + hasil.tenangMasalah.length + hasil.garisMasalah.length;
  const maks = Math.max(...hasil.nama);
  catat(`NAME LENGTH: lines per name ${hasil.nama.join(", ")}; the longest sample (45 characters) takes ${maks}; limit 2`);
  if (maks > 2) gagal++;
  const TERLARANG = ["pin", "password", "kata sandi", "sandi", "verifikasi", "verify", "verified", "autentik", "authentic", "asli", "keaslian", "sah", "resmi", "official", "cek keaslian", "scan to check", "lahir", "tanggal lahir", "berlaku", "valid"];
  const kena = TERLARANG.filter((w) => new RegExp(`(?<![\\p{L}\\p{N}])${w}(?![\\p{L}\\p{N}])`, "iu").test(hasil.teks));
  const emailAddr = /[\w.+-]+@[\w-]+\.[\w.]+/.test(hasil.teks);
  catat(`FORBIDDEN ON THE CARD (PIN, password, email address, date of birth, validity, any verify/authentic/official claim): ${kena.length || emailAddr ? `FOUND ${kena.join(", ")}${emailAddr ? " an email address" : ""}` : "none found on any face"}`);
  gagal += kena.length + (emailAddr ? 1 : 0);
  const kontrol = TERLARANG.filter((w) => new RegExp(`(?<![\\p{L}\\p{N}])${w}(?![\\p{L}\\p{N}])`, "iu").test("Kartu resmi, berlaku sampai 2027"));
  catat(`  control (planted «resmi … berlaku»): caught ${kontrol.join(", ") || "NOTHING"}`);
  if (!kontrol.length) gagal++;
  await ctx.close();
}
await browser.close();

// ════════════════════════════════════════════════════════════════════════════
// The PDF measured, and the QR decode tests
// ════════════════════════════════════════════════════════════════════════════
const geometri = JSON.parse(py("a4", PDF)) as { halaman: number; ukuran_mm: number[]; per_halaman: Array<Array<[number, number, number, number, string]>>; fonts: string[] };
catat("");
catat(`PDF: ${geometri.halaman} pages, set to ${geometri.ukuran_mm.join(" × ")} mm. Fonts embedded: ${geometri.fonts.join(", ")}.`);
if (Math.abs(geometri.ukuran_mm[0] - 210) > 0.01 || Math.abs(geometri.ukuran_mm[1] - 297) > 0.01) gagal++;
if (geometri.fonts.some((f) => /Type3/.test(f))) { gagal++; catat("  a Type3 font is embedded"); }
{
  const d = geometri.per_halaman[0];
  const kertas = d.filter((r) => r[4] === "f" && Math.abs(r[3] - 57.98) < 0.2);
  const lapis = d.filter((r) => r[4] === "f" && Math.abs(r[3] - (K.UKURAN.tinggi - K.TATA.garis + BLEED)) < 0.2);
  const garisD = d.filter((r) => r[4] === "f" && Math.abs(r[3] - K.GARIS_MM) < 0.05);
  const lebar = (rs: typeof d) => [...new Set(rs.map((r) => `${r[2].toFixed(2)} × ${r[3].toFixed(2)}`))];
  const galat = Math.max(...kertas.map((r) => Math.max(Math.abs(r[2] - 89.6), Math.abs(r[3] - 57.98))), ...lapis.map((r) => Math.abs(r[2] - 89.6)), ...garisD.map((r) => Math.abs(r[3] - K.GARIS_MM)));
  catat(`  page 1, measured: ${kertas.length} card papers ${lebar(kertas).join(", ")} mm (89.60 × 57.98 expected); ${lapis.length} colour fields ${lebar(lapis).join(", ")} mm (89.60 × ${f2(K.UKURAN.tinggi - K.TATA.garis + BLEED)}); ${garisD.length} lines ${lebar(garisD).join(", ")} mm (89.60 × ${K.GARIS_MM}); largest error ${galat.toFixed(3)} mm`);
  if (kertas.length !== 7 || lapis.length !== 6 || garisD.length !== 7 || galat > 0.05) gagal++;
}
const manifest = {
  url: URL_CONTOH, pdf: PDF,
  kasus: letakQr.flatMap(({ kode, nama, halaman: h, x, y }) => {
    const ubin = kode.endsWith("0.50") ? K.letakUbin(QR, 0.5) : UBIN;
    const lipatKiri = kode.startsWith("p2-fold") ? (A4.w - 2 * K.UKURAN.lebar) / 2 : x;
    return [
      { kode, nama: `${nama} (tile crop)`, halaman: h, kotak: [lipatKiri + ubin.kiri, y + ubin.atas, ubin.sisi, ubin.sisi], simpan: join(KERJA, `qr-${kode}.png`) },
      { kode: `${kode}·card`, nama: `${nama} (the whole back)`, halaman: h, kotak: [lipatKiri, y, K.UKURAN.lebar, K.UKURAN.tinggi], simpan: join(KERJA, `kartu-${kode}.png`), sapu: false },
    ];
  }),
  layar: [
    { kode: "screen", nama: "email 320 px, light, the whole screenshot (2x)", png: emailPng["H-email-320-terang.png"] },
    { kode: "screen", nama: "email 600 px, dark, the whole screenshot (2x)", png: emailPng["H-email-600-gelap.png"] },
    { kode: "screen", nama: "phone 390 px, the whole screenshot (2x)", png: join(RENDER, "H-ponsel-390.png") },
  ],
};
writeFileSync(join(KERJA, "manifest.json"), JSON.stringify(manifest));
const HASIL = join(RENDER, "uji-qr.json");
py("uji", join(KERJA, "manifest.json"), HASIL);
type Batas = { dpi: number | null; blur_px: number | null; kontras: number | null; miring: number | null };
const uji = JSON.parse(readFileSync(HASIL, "utf8")) as Array<{ kode: string; nama: string; uji: Array<{ nama: string; zxing: boolean; opencv: boolean }>; batas?: { zxing: Batas; opencv: Batas } }>;
catat("");
catat(`QR DECODE TESTS: the tile, version ${QR.versi}-${QR.ecc}, module ${f3(UBIN.modul)} mm, symbol ${f2(UBIN.simbol)} mm, with its quiet zone ${f2(UBIN.sisi)} mm; tile ${f2(UBIN.sisi)} × ${f2(UBIN.tinggi)} mm (zxing-cpp and OpenCV; PASS = the exact sample link came back)`);
for (const u of uji) {
  catat(`  ${u.kode} ${u.nama}: zxing ${u.uji.filter((x) => x.zxing).length}/${u.uji.length}, opencv ${u.uji.filter((x) => x.opencv).length}/${u.uji.length}`);
  for (const x of u.uji) catat(`      ${x.nama}: zxing ${x.zxing ? "PASS" : "FAIL"}, opencv ${x.opencv ? "PASS" : "FAIL"}`);
  if (u.batas) for (const dec of ["zxing", "opencv"] as const) {
    const x = u.batas[dec];
    catat(`      ${dec} limits: every scale down to ${x.dpi} dpi; blur up to sigma ${x.blur_px} px at 300 dpi; contrast down to ${x.kontras}; tilt up to ${x.miring} deg`);
  }
  if (!u.uji[0].zxing || !u.uji[0].opencv) gagal++;
}

// ════════════════════════════════════════════════════════════════════════════
// E. The QR tile sheet (needs the decode results)
// ════════════════════════════════════════════════════════════════════════════
{
  const b2 = await chromium.launch();
  const baris = uji.filter((u) => !u.kode.includes("·card") && u.batas).map((u) => {
    const z = u.batas!.zxing, o = u.batas!.opencv;
    const kartu = uji.find((x) => x.kode === `${u.kode}·card`)!;
    return `<tr><td>${u.nama.replace(" (tile crop)", "")}</td><td>${u.uji.filter((x) => x.zxing).length}/8 · ${u.uji.filter((x) => x.opencv).length}/8</td><td>${kartu.uji.filter((x) => x.zxing).length}/8 · ${kartu.uji.filter((x) => x.opencv).length}/8</td><td>${z.dpi} / ${o.dpi} dpi</td><td>${z.blur_px} / ${o.blur_px} px</td><td>${z.kontras} / ${o.kontras}</td><td>${z.miring}° / ${o.miring}°</td></tr>`;
  }).join("");
  const q = K.TENANG * UBIN.modul;
  const f = join(KERJA, "E-qr.html");
  writeFileSync(f, halaman("E · QR", `<div class="lembar" style="width:240mm">
<h1>E · The PINTAR QR tile, refined</h1>
<p class="sub">PINTAR-green modules on the soft-green tile; never inverted; no logo in the matrix. The app's own symbol (src/lib/qr.ts), version ${QR.versi}-${QR.ecc}, ${M.length} × ${M.length} modules, byte mode, the ${URL_CONTOH.length}-character sample link. The tile fills the space above the line, so its height sets the module: <b>${f3(UBIN.modul)} mm</b> (round 1's tile: 0.700 mm). The full 4-module quiet zone (${f2(q)} mm) is inside the tile on every side, and the ID sits below it.</p>
<div style="display:flex;gap:8mm;align-items:flex-start">${K.belakang(UTAMA, QR)}
<table class="spek"><tr><th colspan="2">The tile</th></tr>
<tr><td>Symbol</td><td>${f2(UBIN.simbol)} mm square (${M.length} modules)</td></tr>
<tr><td>With the quiet zone</td><td>${f2(UBIN.sisi)} mm square (${M.length + 8} modules)</td></tr>
<tr><td>Tile</td><td>${f2(UBIN.sisi)} × ${f2(UBIN.tinggi)} mm, corners 1.6 mm, ${W.hijauLembut}</td></tr>
<tr><td>Position</td><td>centred; top ${f2(UBIN.atas)} mm; bottom 2.0 mm above the line</td></tr>
<tr><td>ID</td><td>9 pt Plex Mono, ${W.hijau} on the tile (${f2(K.rasio(W.hijau, W.hijauLembut))}:1), below the quiet zone</td></tr>
<tr><td>Modules</td><td>${W.hijau} on ${W.hijauLembut}, ${f2(K.rasio(W.hijau, W.hijauLembut))}:1</td></tr></table></div>
<h2 style="margin-top:6mm">Decode: 8 fixed tests per case, then graded limits (zxing / OpenCV)</h2>
<table class="spek"><tr><th>Case (from the A4 PDF at 300 dpi)</th><th>Tile crop</th><th>Whole back</th><th>Scale down to</th><th>Blur up to</th><th>Contrast down to</th><th>Tilt up to</th></tr>${baris}</table>
<p class="ket">Fixed tests: actual size; 150 and 100 dpi; blur sigma 1.5 and 2.5 px; tilted 25° and turned 8°; faded to 35%; all combined with noise and JPEG. Limits: the last value that still decoded before the first failure. Round 1's tile (0.700 mm modules): 50 / 75–90 dpi, blur 4.25 / 3 px, contrast 0.15 / 0.05, tilt 72.5° / 50°.</p></div>`));
  const ctx = await b2.newContext({ viewport: { width: Math.ceil(mmPx(240 + 16)), height: 400 }, deviceScaleFactor: 4 });
  const p = await ctx.newPage();
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: join(RENDER, "E-qr-ubin.png"), fullPage: true });
  await b2.close();
}
execFileSync(PY, ["-c", `
import pymupdf
d = pymupdf.open(${JSON.stringify(PDF)})
for i in range(len(d)):
    d[i].get_pixmap(dpi=110).save(${JSON.stringify(join(RENDER, "I-A4-halaman-"))} + str(i + 1) + ".png")
`]);

writeFileSync(join(RENDER, "laporan.txt"), laporan.join("\n") + "\n");
console.log(laporan.join("\n"));
console.log(gagal ? `\n${gagal} problem(s)` : "\nall checks passed");
process.exit(gagal ? 1 : 0);
