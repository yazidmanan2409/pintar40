/**
 * Kartu PINTAR, round 1: the render script. Run from the repository root:
 *
 *   KARTU_PY=/path/to/venv/bin/python npx tsx docs/coordination/ux/kartu-pintar/buat-kartu.mts
 *
 * KARTU_PY is a Python with requirements.txt installed (default: python3).
 *
 * It builds every render in render/ from the one grammar in kartu.mts, writes
 * the A4 test sheet, runs the checks (contrast, safe margin, name length,
 * forbidden words, PDF geometry) and the QR decode tests (uji-qr.py), and
 * writes render/laporan.txt. It exits non-zero if a check fails.
 *
 * Samples only: every person, school and PINTAR ID here is invented, and the
 * QR encodes https://contoh.pintar.invalid/id/A14CD7ST, a domain that can never
 * exist (RFC 2606). The words on the card are proposals, not copy.
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { qrMatrix } from "../../../../src/lib/qr.js";
import { bingkaiEmail, LOGO_BAKU } from "../email-frame/bingkai.mjs";
import * as K from "./kartu.mjs";

const AKAR = process.cwd();
const DIR = join(AKAR, "docs/coordination/ux/kartu-pintar");
const RENDER = join(DIR, "render");
const KERJA = join(tmpdir(), "kartu-pintar-kerja");
mkdirSync(RENDER, { recursive: true });
mkdirSync(KERJA, { recursive: true });
const PY = process.env.KARTU_PY ?? "python3";
const py = (...a: string[]) => execFileSync(PY, [join(DIR, "uji-qr.py"), ...a], { maxBuffer: 1 << 26 }).toString();

const URL_CONTOH = "https://contoh.pintar.invalid/id/A14CD7ST";
if (new URL(URL_CONTOH).hostname.split(".").pop() !== "invalid") throw new Error("the sample QR must point at a .invalid domain");
const LOGO = `data:image/png;base64,${readFileSync(join(AKAR, "public/brand/pintar-selalu-logo.png")).toString("base64")}`;
const W = K.WARNA;
const laporan: string[] = [];
let gagal = 0;
const catat = (s: string) => { laporan.push(s); };
const f2 = (x: number) => x.toFixed(2);

// ── the samples: invented people and schools ──────────────────────────────────
const ORANG: Record<K.Keluarga, K.Orang> = {
  murid: { nama: "Bagas Saputra", peran: ["murid"], sekolah: "SMP Cahaya Kaliandra", id: "7Q2Z0D9K" },
  guru: { nama: "Ratna Dewi Kusumawardani", peran: ["guru"], sekolah: "SMP Cahaya Kaliandra", id: "A14CD7ST" },
  kadep: { nama: "Nur'aini Rahmawati", peran: ["kadep"], sekolah: "SMA Bukit Asri Kaliandra", id: "5S8B1HMR" },
  dekan: { nama: "Muhammad Rizky Aditya Pratama", peran: ["dekan"], sekolah: "Sekolah Cendekia Kaliandra", id: "D0W3Z27E" },
  adminSekolah: { nama: "Sukarmi", peran: ["adminSekolah"], sekolah: "Sekolah Menengah Kejuruan Teknologi dan Rekayasa Nusa Kaliandra Timur", id: "B8K5S1GX" },
  adminPlatform: { nama: "Laras Pramesti", peran: ["adminPlatform"], sekolah: null, id: "2ZNV07YD" },
};
const UTAMA = ORANG.guru; // the detail card; its ID is the one the sample QR carries
const PANJANG: K.Orang = { nama: "Ni Luh Putu Ayu Kartika Maharani Suryaningsih", peran: ["guru"], sekolah: "SMA Bukit Asri Kaliandra", id: "Q8ZB2D0S" };
const DUA_PERAN: K.Orang = { nama: "Nur'aini Rahmawati", peran: ["guru", "kadep"], sekolah: "SMA Bukit Asri Kaliandra", id: "5S8B1HMR" };
const TANPA_SEKOLAH_OPSI = { ...ORANG.adminPlatform, sekolah: "Platform PINTAR" };
for (const o of [...Object.values(ORANG), PANJANG, DUA_PERAN]) {
  if (!/^[0-9A-HJKMNP-TV-Z]{8}$/.test(o.id)) throw new Error(`not a Crockford Base32 PINTAR ID: ${o.id}`);
}

// ── the QR variants ───────────────────────────────────────────────────────────
const segno = JSON.parse(py("matriks", URL_CONTOH));
const M = qrMatrix(URL_CONTOH).map((r: boolean[]) => r.map((x) => (x ? 1 : 0)));
const MODUL = 0.7; // mm, variants A and B
const QR: Record<string, K.VarianQr> = {
  A: { kode: "A", nama: "Plain", matriks: M, versi: (M.length - 17) / 4, ecc: "M", modul: MODUL, sumber: "src/lib/qr.ts (the app's own encoder)" },
  B: { kode: "B", nama: "PINTAR tile", matriks: M, versi: (M.length - 17) / 4, ecc: "M", modul: MODUL, sumber: "src/lib/qr.ts (the app's own encoder)", ubin: true },
  C1: { kode: "C1", nama: "Logo at the centre, same module size", matriks: segno.H.matriks, versi: segno.H.versi, ecc: "H", modul: MODUL, sumber: "segno (level H)", lubang: [11, 7] },
  C2: { kode: "C2", nama: "Logo at the centre, same footprint as A", matriks: segno.H.matriks, versi: segno.H.versi, ecc: "H", modul: +(M.length * MODUL / segno.H.matriks.length).toFixed(3), sumber: "segno (level H)", lubang: [11, 7] },
};
const QR_UTAMA = QR.B; // the recommended back (README §G)

// ── page scaffolding ──────────────────────────────────────────────────────────
const MEJA = "#E6E3DC";
const halaman = (judul: string, badan: string, tambahan = "", statis?: string) => `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${judul}</title>
<style>${K.css(AKAR, statis)}
html, body { margin: 0; }
body { background: ${MEJA}; color: ${W.tinta}; font-family: 'Plus Jakarta Sans'; text-rendering: geometricPrecision; font-kerning: normal; }
.lembar { padding: 8mm; }
.lembar h1 { font: 600 11pt 'Plus Jakarta Sans'; margin: 0 0 1.2mm; letter-spacing: -0.01em; }
.lembar .sub { font: 400 7pt/1.45 'Plus Jakarta Sans'; color: ${W.tinta2}; margin: 0 0 6mm; max-width: 190mm; }
.lembar h2 { font: 600 8pt 'Plus Jakarta Sans'; margin: 0 0 3mm; }
.kisi { display: grid; grid-template-columns: repeat(3, 85.6mm); gap: 7mm 6mm; margin-bottom: 8mm; }
.ket { font: 400 5.6pt/1.45 'Plus Jakarta Sans'; color: ${W.tinta2}; margin-top: 1.6mm; }
.ket b { font-weight: 600; color: ${W.tinta}; }
.buruk { color: #8C3B3B; font-weight: 600; }
table.spek { border-collapse: collapse; font: 400 6pt/1.4 'Plus Jakarta Sans'; }
table.spek th { font-weight: 600; text-align: left; padding: 1mm 3mm 1mm 0; border-bottom: 0.2mm solid rgba(31,42,51,.24); vertical-align: bottom; }
table.spek td { padding: 1mm 3mm 1mm 0; border-bottom: 0.2mm solid rgba(31,42,51,.12); vertical-align: top; }
${tambahan}</style></head><body>${badan}</body></html>`;

const require_ = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require_("playwright");
const browser = await chromium.launch();
type Potret = { lebar: number; tinggi?: number; skala: number; gelap?: boolean; elemen?: string; transparan?: boolean };
async function potret(html: string, nama: string, o: Potret): Promise<string> {
  const f = join(KERJA, nama.replace(/\.png$/, ".html"));
  writeFileSync(f, html);
  const ctx = await browser.newContext({ viewport: { width: o.lebar, height: o.tinggi ?? 400 }, deviceScaleFactor: o.skala, colorScheme: o.gelap ? "dark" : "light" });
  const p = await ctx.newPage();
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  const keluar = join(RENDER, nama);
  if (o.elemen) await p.locator(o.elemen).first().screenshot({ path: keluar, omitBackground: !!o.transparan });
  else await p.screenshot({ path: keluar, fullPage: true });
  await ctx.close();
  return keluar;
}
const mmPx = (mmv: number) => mmv * 96 / 25.4; // CSS px per mm

// ── OKLCH lightness, for the rank-ladder picture ─────────────────────────────
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
// Contrast: every text/background pair the card uses, measured
// ════════════════════════════════════════════════════════════════════════════
type Pasangan = { apa: string; teks: string; latar: string; min: number; palet?: K.Palet };
const PASANGAN: Pasangan[] = [
  { apa: "front · name (ink) on paper", teks: W.tinta, latar: W.kertas, min: 4.5 },
  { apa: "front · PINTAR ID (ink-2) on paper", teks: W.tinta2, latar: W.kertas, min: 4.5 },
  { apa: "front · wordmark (PINTAR green) on paper", teks: W.hijau, latar: W.kertas, min: 4.5 },
  { apa: "back · instruction (ink) on paper", teks: W.tinta, latar: W.kertas, min: 4.5 },
  { apa: "back · PINTAR ID label (ink-3) on paper", teks: W.tinta3, latar: W.kertas, min: 4.5 },
  { apa: "back · PINTAR ID (ink) on paper", teks: W.tinta, latar: W.kertas, min: 4.5 },
  { apa: "back · small text (ink-3) on paper", teks: W.tinta3, latar: W.kertas, min: 4.5 },
  { apa: "back · QR modules (green) on paper (A, C)", teks: W.hijau, latar: W.kertas, min: 4.5 },
  { apa: "back · QR modules (green) on the tile (B)", teks: W.hijau, latar: W.hijauLembut, min: 4.5 },
  { apa: "back · PINTAR ID (green) on the tile (B)", teks: W.hijau, latar: W.hijauLembut, min: 4.5 },
];
for (const palet of ["yazid", "setara"] as K.Palet[]) {
  for (const k of K.KELUARGA) {
    PASANGAN.push({ apa: `front · role and school on ${K.PERAN[k]} (${palet})`, teks: K.tintaBab(palet, k), latar: K.PALET[palet][k], min: 4.5, palet });
  }
}
catat("CONTRAST (WCAG 2.x; every text on the card is small text, so each pair needs 4.5:1)");
for (const p of PASANGAN) {
  const r = K.rasio(p.teks, p.latar);
  const kurang = r < p.min;
  if (kurang && p.palet !== "yazid") gagal++; // Yazid's HEX is shown as given; its shortfalls are the finding
  catat(`  ${p.apa}: ${p.teks} on ${p.latar} = ${f2(r)}:1${kurang ? "  BELOW 4.5" : ""}`);
}
// the alternatives weighed for the text on the colour layer (README §4)
const ALTERNATIF = { "paper #FBFAF7": W.kertas, "white #FFFFFF": "#FFFFFF", "surface-2 #F3F1EC": "#F3F1EC", "ink #1F2A33": W.tinta };
const tabelAlternatif: string[][] = [];
for (const palet of ["yazid", "setara"] as K.Palet[]) {
  for (const k of K.KELUARGA) {
    const latar = K.PALET[palet][k];
    tabelAlternatif.push([palet, K.PERAN[k], latar, f2(oklch(latar)[0]), ...Object.values(ALTERNATIF).map((t) => f2(K.rasio(t, latar)))]);
  }
}
catat("");
catat("PALETTE: Yazid's HEX -> equal lightness (OKLCH: L lightness 0-1, C chroma, H hue in degrees)");
for (const k of K.KELUARGA) {
  const [a, b] = [oklch(K.PALET.yazid[k]), oklch(K.PALET.setara[k])];
  catat(`  ${K.PERAN[k]}: ${K.PALET.yazid[k]} (L ${a[0].toFixed(3)} C ${a[1].toFixed(3)} H ${a[2].toFixed(0)}) -> ${K.PALET.setara[k]} (L ${b[0].toFixed(3)} C ${b[1].toFixed(3)} H ${b[2].toFixed(0)}); dL ${(b[0] - a[0]).toFixed(3)}, dC ${(b[1] - a[1]).toFixed(3)}, dH ${(b[2] - a[2]).toFixed(0)}`);
}
for (const palet of ["yazid", "setara"] as K.Palet[]) {
  const j = JSON.parse(py("jarak", ...K.KELUARGA.map((k) => K.PALET[palet][k]))) as Record<string, Array<[number, number, number]>>;
  for (const [penglihatan, pas] of Object.entries(j)) {
    catat(`  ${palet}, ${penglihatan}: closest pairs (CIEDE2000) ${pas.slice(0, 3).map(([a, b, d]) => `${K.PERAN[K.KELUARGA[a]]}/${K.PERAN[K.KELUARGA[b]]} ${d}`).join("; ")}; median ${pas[Math.floor(pas.length / 2)][2]}`);
  }
}
catat("");
catat(`TEXT COLOUR ALTERNATIVES ON THE COLOUR LAYER (columns: ${Object.keys(ALTERNATIF).join(" | ")})`);
for (const r of tabelAlternatif) catat(`  ${r[0]} ${r[1]} ${r[2]} (OKLCH L ${r[3]}): ${r.slice(4).join(" | ")}`);

// ════════════════════════════════════════════════════════════════════════════
// A. The six fronts: Yazid's colours and the equal-lightness variant
// ════════════════════════════════════════════════════════════════════════════
const ketDepan = (palet: K.Palet, k: K.Keluarga) => {
  const latar = K.PALET[palet][k];
  const t = K.tintaBab(palet, k);
  const r = K.rasio(t, latar);
  const nt = t === W.kertas ? "paper" : "ink";
  return `<b>${K.PERAN[k]}</b> · ${latar} · OKLCH L ${f2(oklch(latar)[0])} · text ${nt} ${t} <span class="${r < 4.5 ? "buruk" : ""}">${f2(r)}:1${r < 4.5 ? " (below 4.5)" : ""}</span>`;
};
const kisiEnam = (palet: K.Palet) =>
  `<div class="kisi">${K.KELUARGA.map((k) => `<div>${K.depan(ORANG[k], palet)}<p class="ket">${ketDepan(palet, k)}</p></div>`).join("")}</div>`;
const tangga = () => {
  const baris = (palet: K.Palet) => K.KELUARGA.map((k) => {
    const L = oklch(K.PALET[palet][k])[0];
    return `<div style="text-align:center"><div style="height:22mm;display:flex;align-items:flex-end;justify-content:center"><div style="width:14mm;height:${(L * 30).toFixed(2)}mm;background:${K.PALET[palet][k]};border-radius:1mm 1mm 0 0"></div></div><p class="ket" style="margin-top:1mm">${K.PERAN[k]}<br>L ${f2(L)}</p></div>`;
  }).join("");
  return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;max-width:250mm">
<div><h2>Lightness, Yazid's HEX (bar height = OKLCH L)</h2><div style="display:grid;grid-template-columns:repeat(6,1fr)">${baris("yazid")}</div></div>
<div><h2>Lightness, equal-lightness variant</h2><div style="display:grid;grid-template-columns:repeat(6,1fr)">${baris("setara")}</div></div></div>`;
};
await potret(halaman("A · six fronts", `<div class="lembar" style="width:${3 * 85.6 + 2 * 6}mm">
<h1>A · The six fronts, one grammar</h1>
<p class="sub">Same layout, type and sizes on all six; only the colour layer changes. Top: Yazid's working HEX as given, each card taking the better of paper or ink for its text. Bottom: the equal-lightness variant, the same hue directions at one lightness, so one text colour (the paper, #FBFAF7) serves all six and no card is lighter or darker than another. Samples are invented.</p>
<h2>Yazid's working HEX</h2>${kisiEnam("yazid")}
<h2>Equal-lightness variant (proposed)</h2>${kisiEnam("setara")}
${tangga()}</div>`), "A-enam-depan.png", { lebar: Math.ceil(mmPx(3 * 85.6 + 2 * 6 + 16)), skala: 3 });

// A2. The review question: six cards on a table, logos partly covered
const meja = (palet: K.Palet) => {
  const letak: Array<[number, number, number]> = [[4, 6, -4], [80, 2, 3], [158, 8, -2], [10, 66, 2.5], [86, 70, -3.5], [162, 64, 5]];
  return `<div style="position:relative;width:258mm;height:130mm;background:#CFC9BE;border-radius:2mm;overflow:hidden">${K.KELUARGA.map((k, i) => {
    const [x, y, r] = letak[i];
    return `<div style="position:absolute;left:${x}mm;top:${y}mm;transform:rotate(${r}deg);filter:drop-shadow(0 0.4mm 0.6mm rgba(0,0,0,.18))">${K.depan(ORANG[k], palet)}
<div style="position:absolute;left:3.5mm;top:3.4mm;width:21mm;height:6mm;background:#EDE7D6;transform:rotate(-2deg);box-shadow:0 0.2mm 0.4mm rgba(0,0,0,.2)"></div></div>`;
  }).join("")}</div>`;
};
await potret(halaman("A2 · on a table", `<div class="lembar" style="width:258mm">
<h1>A2 · The review question: six cards on a table, wordmarks covered</h1>
<p class="sub">Top: Yazid's HEX. Bottom: the equal-lightness variant. On top the lightness runs from Murid (lightest) to Admin platform (darkest), nearly the order of seniority, and the text flips from ink to paper along the way; below, every card carries the same weight. The wordmarks are covered: the two layers alone say PINTAR.</p>
<h2>Yazid's working HEX</h2>${meja("yazid")}<div style="height:6mm"></div><h2>Equal-lightness variant</h2>${meja("setara")}</div>`),
  "A2-meja.png", { lebar: Math.ceil(mmPx(258 + 16)), skala: 2.4 });

// A3. Stress cases and the open questions
const kartuKet = (html: string, ket: string) => `<div>${html}<p class="ket">${ket}</p></div>`;
await potret(halaman("A3 · stress cases", `<div class="lembar" style="width:${3 * 85.6 + 2 * 6}mm">
<h1>A3 · Stress cases and the two open questions</h1>
<p class="sub">The six fronts above already carry a four-word name (Dekan), a single-word name (Admin sekolah), an apostrophe (Kepala departemen) and a long school name (Admin sekolah). Here: a six-word name, the Admin platform school line, and the two-role question. Equal-lightness colours.</p>
<h2>Names and schools</h2><div class="kisi">
${kartuKet(K.depan(PANJANG, "setara"), "<b>Six-word name</b>: wraps at a word to a second line and grows upward; never shrunk, never cut. Measured below: every sample stays within two lines.")}
${kartuKet(K.depan(ORANG.adminSekolah, "setara"), "<b>Single-word name, long school</b> (68 characters): the school wraps at a word in the colour layer, which has room for the role and three lines of school.")}
${kartuKet(K.depan(ORANG.kadep, "setara"), "<b>Apostrophe</b>: shown as stored (Nur'aini). A typographic apostrophe (’) would be a display rule to decide, not a data change.")}
</div>
<h2>Admin platform has no school: how the line reads (question for Yazid)</h2><div class="kisi">
${kartuKet(K.depan(ORANG.adminPlatform, "setara"), "<b>Proposed: no second line.</b> The role stands alone; nothing is invented.")}
${kartuKet(K.depan(TANPA_SEKOLAH_OPSI, "setara"), "<b>Option, not proposed: «Platform PINTAR».</b> Reads as where the role lives, but it could be read as an affiliation or employer.")}
<div><p class="ket" style="margin-top:0"><b>Rejected: «Semua sekolah» or «Seluruh sekolah».</b> It describes a scope of access, which is a permission claim (D-059(d)).</p></div>
</div>
<h2>A person with two roles, e.g. Guru and Kepala departemen (question for Yazid, not settled)</h2><div class="kisi">
${kartuKet(K.depan({ ...DUA_PERAN, peran: ["guru"] }, "setara") + `<div style="height:3mm"></div>` + K.depan({ ...DUA_PERAN, peran: ["kadep"] }, "setara"), "<b>(a) One card per role.</b> Each card is one chapter; the PINTAR ID and QR are the same on both.")}
${kartuKet(K.depan(DUA_PERAN, "setara"), "<b>(b) One card, both roles written.</b> Here in the Guru colour: which colour, and in which order, is part of the question.")}
${kartuKet(K.depan(DUA_PERAN, "setara", { warnaBab: K.PALET.setara.kadep }), "<b>(b) again, in the Kepala departemen colour.</b> A rule such as «the most recent role» or «the person chooses» would decide it.")}
</div></div>`), "A3-kasus-uji.png", { lebar: Math.ceil(mmPx(3 * 85.6 + 2 * 6 + 16)), skala: 3 });

// ════════════════════════════════════════════════════════════════════════════
// B. One card, front and back, in detail (bleed, trim, safe margin, grid)
// ════════════════════════════════════════════════════════════════════════════
const BLEED = K.UKURAN.bleed;
const panduan = (belakangnya: boolean) => {
  const { lebar: Wc, tinggi: Hc, sudut: R, aman } = K.UKURAN;
  const g = (x: number, y: number, w: number, h: number, gaya: string, r = 0) =>
    `<div style="position:absolute;left:${x}mm;top:${y}mm;width:${w}mm;height:${h}mm;${gaya};border-radius:${r}mm;box-sizing:border-box"></div>`;
  const label = (x: number, y: number, t: string, warna = "#B0306A") => `<div style="position:absolute;left:${x}mm;top:${y}mm;font:600 3.4pt 'Plus Jakarta Sans';color:${warna};white-space:nowrap;background:rgba(251,250,247,.85);padding:0 0.4mm;border-radius:0.4mm">${t}</div>`;
  const b = BLEED;
  let s = g(b, b, Wc, Hc, "border:0.12mm solid #B0306A", R) // trim, with the 3.18 mm corners
    + g(b + aman, b + aman, Wc - 2 * aman, Hc - 2 * aman, "border:0.1mm dashed #1F6FB2") // safe margin
    + g(b + K.TATA.tepi, b, 0, Hc, "border-left:0.08mm dotted #5F6A73") + g(b + Wc - K.TATA.tepi, b, 0, Hc, "border-left:0.08mm dotted #5F6A73");
  if (!belakangnya) s += g(0, b + K.TATA.lapis, Wc + 2 * b, 0, "border-top:0.1mm dotted #1F2A33");
  s += label(b + 0.6, 0.1, `bleed ${b} mm`, "#5F6A73") + label(b + aman + 0.5, b + aman + 0.3, "safe margin 3 mm", "#1F6FB2") + label(b + K.TATA.tepi + 0.4, b + Hc - aman - 1.8, "text margin 6 mm", "#5F6A73");
  if (!belakangnya) s += label(b + Wc - 44, b + K.TATA.lapis - 2.1, `light layer ${K.TATA.lapis} mm · colour layer ${f2(Hc - K.TATA.lapis)} mm`, "#1F2A33");
  else {
    const p = K.letakQr(QR_UTAMA);
    s += g(b + p.kiri, b + p.atas, p.sisi, p.sisi, "border:0.1mm dashed #B0306A") + label(b + p.kiri - 14, b + p.atas - 2, `QR and its 4-module quiet zone, ${f2(p.sisi)} mm square`, "#B0306A");
  }
  return s;
};
const detail = (muka: string, belakangnya: boolean) => `<div style="position:relative;display:inline-block">${muka}${panduan(belakangnya)}</div>`;
await potret(halaman("B · detail", `<div class="lembar">
<h1>B · One card in detail: front and back at CR80, with bleed</h1>
<p class="sub">CR80: 85.60 × 53.98 mm, corners 3.18 mm. Pink: the trim. Blue dashes: the 3 mm safe margin (all type and the QR, quiet zone included, stay inside it). Grey dots: the 6 mm text margin. Colour runs 2 mm past the trim on every edge it touches. Front: the light layer (30 mm) carries what is permanent, the colour layer (23.98 mm) the current chapter. Back: the same for every family.</p>
<div style="display:flex;gap:8mm;align-items:flex-start">${detail(K.depan(UTAMA, "setara", { bleed: BLEED }), false)}${detail(K.belakang(UTAMA, QR_UTAMA, LOGO, { bleed: BLEED }), true)}</div>
<div style="display:flex;gap:10mm;margin-top:8mm">${K.depan(UTAMA, "setara")}${K.belakang(UTAMA, QR_UTAMA, LOGO)}</div></div>`),
  "B-detail.png", { lebar: Math.ceil(mmPx(2 * 89.6 + 8 + 16)), skala: 5 });

// ════════════════════════════════════════════════════════════════════════════
// C. Typography specification
// ════════════════════════════════════════════════════════════════════════════
const layarPx = (pt: number, lebarKartuPx: number) => (pt * 25.4 / 72) * lebarKartuPx / K.UKURAN.lebar;
const CONTOH_GAYA: Record<string, [string, string, string]> = {
  nama: ["kp-nama", "Ratna Dewi Kusumawardani", `ink ${W.tinta} on paper`],
  id: ["kp-id", "A14C D7ST", `ink-2 ${W.tinta2} on paper (front); ink on paper (back)`],
  peran: ["kp-peran", "Kepala departemen", "paper on the family colour"],
  sekolah: ["kp-sekolah", "SMK Teknologi dan Rekayasa Nusa Kaliandra Timur", "paper on the family colour"],
  petunjuk: ["kp-petunjuk", K.KATA_BELAKANG.petunjuk, `ink ${W.tinta} on paper`],
  merek: ["kp-merek", "PINTAR", `PINTAR green ${W.hijau} on paper`],
  label: ["kp-label", "PINTAR ID", `ink-3 ${W.tinta3} on paper`],
  kecil: ["kp-kecil", "pintarselalu.com", `ink-3 ${W.tinta3} on paper`],
};
const kontrasGaya: Record<string, string> = {
  nama: f2(K.rasio(W.tinta, W.kertas)), id: f2(K.rasio(W.tinta2, W.kertas)),
  peran: `${f2(Math.min(...K.KELUARGA.map((k) => K.rasio(W.kertas, K.PALET.setara[k]))))} to ${f2(Math.max(...K.KELUARGA.map((k) => K.rasio(W.kertas, K.PALET.setara[k]))))}`,
  sekolah: "", petunjuk: f2(K.rasio(W.tinta, W.kertas)), merek: f2(K.rasio(W.hijau, W.kertas)),
  label: f2(K.rasio(W.tinta3, W.kertas)), kecil: f2(K.rasio(W.tinta3, W.kertas)),
};
const barisGaya = Object.entries(K.GAYA).map(([k, g]) => {
  const [kelas, contoh, warna] = CONTOH_GAYA[k];
  const latar = k === "peran" || k === "sekolah" ? K.PALET.setara.kadep : W.kertas;
  const tinta = k === "peran" || k === "sekolah" ? W.kertas : "";
  return `<tr><td><b>${g.peran}</b></td>
<td style="background:${latar};color:${tinta};padding:1.4mm 2mm"><span class="kp"><span class="${kelas}" style="display:inline-block;${tinta ? `color:${tinta}` : ""}">${contoh}</span></span></td>
<td>${g.huruf}</td><td>${g.berat}</td><td>${g.pt} pt<br><span style="color:${W.tinta3}">${f2(g.pt * 25.4 / 72)} mm em</span></td><td>${g.baris}</td><td>${g.spasi ? `${g.spasi} em` : "0"}${g.kapital ? ", caps" : ""}${g.kata ? `; words +${g.kata} em` : ""}</td><td>${warna}</td><td>${kontrasGaya[k] ? `${kontrasGaya[k]}:1` : "as role"}</td>
<td>${layarPx(g.pt, 358).toFixed(1)} px<br>${layarPx(g.pt, 266).toFixed(1)} px</td></tr>`;
}).join("");
const mirip = (huruf: string, berat: number) => `<span style="font-family:'${huruf}';font-weight:${berat};font-size:9pt;letter-spacing:0.06em">0D 17 2Z 5S 8B</span>`;
await potret(halaman("C · typography", `<div class="lembar" style="width:250mm">
<h1>C · Typography: two families, four sizes, three weights</h1>
<p class="sub">PINTAR's own typefaces, self-hosted in the app (public/fonts, both SIL OFL 1.1, so printing and embedding are allowed). Plus Jakarta Sans at 400 and 600, the app's two weights; IBM Plex Mono 500, the app's one mono weight, for the PINTAR ID. Samples below are at actual size in the sheet; this render is 4×. «On screen» is the size in CSS px when the whole card is 358 px wide (a phone, full width) and 266 px wide (the email at 320 px, as measured).</p>
<table class="spek"><tr><th>Style</th><th>Sample (actual size)</th><th>Typeface</th><th>Weight</th><th>Size</th><th>Line height</th><th>Tracking</th><th>Colour</th><th>Contrast</th><th>On screen<br>358 / 266</th></tr>${barisGaya}</table>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:7mm">
<div><h2>Look-alike characters at card size (9 pt)</h2>
<table class="spek"><tr><td>IBM Plex Mono 500 (chosen)</td><td>${mirip("IBM Plex Mono", 500)}</td></tr>
<tr><td>Plus Jakarta Sans 600</td><td>${mirip("Plus Jakarta Sans", 600)}</td></tr>
<tr><td>Plus Jakarta Sans 400</td><td>${mirip("Plus Jakarta Sans", 400)}</td></tr></table>
<p class="ket">Plex Mono's zero carries a dot, so 0 never reads as D (or O); its 1 has a flag and a foot, its 2 a curved top, its 8 two closed bowls against B's flat spine. Plus Jakarta Sans's zero is a plain oval: fine in a name, weaker in a code. I, L, O and U never occur in an ID.</p></div>
<div><h2>Hierarchy and the smallest size</h2>
<p class="ket" style="font-size:6.5pt">1. Name (12 pt, 600). 2. PINTAR ID (9 pt mono), set with the name as one identity block. 3. Role (7.5 pt, 600) and school (7.5 pt, 400): the chapter, one size, told apart by weight. 4. The wordmark and labels (6.5 pt caps, tracked): present, never loud.<br><br><b>Smallest printed size: 6.5 pt.</b> At 6.5 pt the x-height of Plus Jakarta Sans is about 1.2 mm, the practical floor for an office laser or inkjet before the counters of a, e and s fill in. Only non-essential text uses it (wordmark, the «PINTAR ID» label, the website). Everything a person must read is 7.5 pt or larger, and nothing small is reversed out of colour at weight 400 below 7.5 pt.</p></div></div></div>`),
  "C-tipografi.png", { lebar: Math.ceil(mmPx(250 + 16)), skala: 4 });

// ════════════════════════════════════════════════════════════════════════════
// E. The A4 test sheet at 100%, with crop marks (the PDF), then D uses its decode results
// ════════════════════════════════════════════════════════════════════════════
type Slot = { html: string; ket: string } | { kalibrasi: true } | null;
const A4 = { w: 210, h: 297 };
const CELAH = 14; // mm between trims, for bleed + crop marks
const KOLOM = [(A4.w - 2 * K.UKURAN.lebar - CELAH) / 2, (A4.w - 2 * K.UKURAN.lebar - CELAH) / 2 + K.UKURAN.lebar + CELAH];
const ATAS = 26.5;
const barisY = (r: number) => ATAS + r * (K.UKURAN.tinggi + CELAH);
const TANDA = { jarak: 3, panjang: 3.5, tebal: 0.1 }; // crop marks: start 3 mm off the trim (clear of the 2 mm bleed)
function tandaPotong(x: number, y: number): string {
  const { lebar: w, tinggi: h } = K.UKURAN;
  const { jarak: j, panjang: p, tebal: t } = TANDA;
  const garis = (x0: number, y0: number, lw: number, lh: number) => `<div style="position:absolute;left:${x0}mm;top:${y0}mm;width:${lw}mm;height:${lh}mm;background:#000"></div>`;
  let s = "";
  for (const [cx, sx] of [[x, -1], [x + w, 1]] as const) {
    for (const [cy, sy] of [[y, -1], [y + h, 1]] as const) {
      s += garis(sx < 0 ? cx - j - p : cx + j, cy - t / 2, p, t); // horizontal, at the trim's y
      s += garis(cx - t / 2, sy < 0 ? cy - j - p : cy + j, t, p); // vertical, at the trim's x
    }
  }
  return s;
}
const kalibrasi = (x: number, y: number) => `<div style="position:absolute;left:${x}mm;top:${y}mm;width:${K.UKURAN.lebar}mm;height:${K.UKURAN.tinggi}mm;border:0.1mm solid ${W.tinta3};border-radius:${K.UKURAN.sudut}mm;box-sizing:border-box;padding:5mm 6mm">
<p style="font:600 7pt 'Plus Jakarta Sans';margin:0 0 1.5mm">Periksa skala · check the scale</p>
<p style="font:400 6.5pt/1.4 'Plus Jakarta Sans';margin:0 0 3mm;color:${W.tinta2}">Garis tepi kotak ini tepat 85,6 × 53,98 mm (CR80), dan garis di bawah tepat 50 mm. Jika ukurannya lain, pencetak mengubah skala: cetak ulang pada 100%.</p>
<div style="position:relative;width:50mm;height:3mm;border-bottom:0.2mm solid #000">${[0, 10, 20, 30, 40, 50].map((t) => `<div style="position:absolute;left:${t - 0.1}mm;bottom:0;width:0.2mm;height:${t % 50 ? 1.5 : 3}mm;background:#000"></div>`).join("")}</div>
<p style="font:400 6pt 'Plus Jakarta Sans';margin:1mm 0 0;color:${W.tinta2}">0 · 10 · 20 · 30 · 40 · 50 mm</p></div>`;
type Letak = { halaman: number; slot: number; x: number; y: number };
const letakKasus: Array<{ kode: string; nama: string; l: Letak; v: K.VarianQr }> = [];
function lembarA4(no: number, judul: string, slot: Slot[], qrDi: Record<number, K.VarianQr> = {}): string {
  let s = `<div class="a4" style="position:relative;width:${A4.w}mm;height:${A4.h}mm;overflow:hidden;background:#fff;page-break-after:always">
<p style="position:absolute;left:${KOLOM[0]}mm;top:6mm;margin:0;font:600 9.5pt 'Plus Jakarta Sans'">Kartu PINTAR · putaran 1 · ${judul} <span style="font-weight:400;color:${W.tinta3}">(halaman ${no} dari 3)</span></p>
<p style="position:absolute;left:${KOLOM[0]}mm;top:10.6mm;margin:0;font:600 7.5pt 'Plus Jakarta Sans'">Cetak pada 100% (ukuran sebenarnya). Jangan pilih «Sesuaikan dengan halaman». · Print at 100%, no fit-to-page.</p>
<p style="position:absolute;left:${KOLOM[0]}mm;top:14.2mm;margin:0;font:400 6pt 'Plus Jakarta Sans';color:${W.tinta2}">Potong di tanda potong. Semua orang, sekolah dan PINTAR ID di sini contoh rekaan; QR membuka https://contoh.pintar.invalid/…, alamat yang tidak pernah ada.</p>`;
  slot.forEach((sl, i) => {
    const x = KOLOM[i % 2], y = barisY(Math.floor(i / 2));
    if (!sl) return;
    if ("kalibrasi" in sl) { s += kalibrasi(x, y); return; }
    s += `<div style="position:absolute;left:${x - BLEED}mm;top:${y - BLEED}mm">${sl.html}</div>${tandaPotong(x, y)}
<p style="position:absolute;left:${x}mm;width:${K.UKURAN.lebar}mm;top:${y + K.UKURAN.tinggi + 3.2}mm;margin:0;text-align:center;font:400 5.5pt 'Plus Jakarta Sans';color:${W.tinta3}">${sl.ket}</p>`;
    if (qrDi[i]) letakKasus.push({ kode: qrDi[i].kode, nama: sl.ket, l: { halaman: no - 1, slot: i, x, y }, v: qrDi[i] });
  });
  return s + "</div>";
}
const cetakDepan = (o: K.Orang, palet: K.Palet, opsi: Parameters<typeof K.depan>[2] = {}) => K.depan(o, palet, { bleed: BLEED, ...opsi });
const cetakBelakang = (v: K.VarianQr) => K.belakang(UTAMA, v, LOGO, { bleed: BLEED });
const hal1: Slot[] = [...K.KELUARGA.map((k) => ({ html: cetakDepan(ORANG[k], "setara"), ket: `Depan · ${K.PERAN[k]} · setara ${K.PALET.setara[k]}` })),
  { html: cetakBelakang(QR_UTAMA), ket: `Belakang · QR ${QR_UTAMA.kode} (${QR_UTAMA.nama}), untuk kartu Guru di atas` }, { kalibrasi: true }];
const hal2: Slot[] = [...K.KELUARGA.map((k) => ({ html: cetakDepan(ORANG[k], "yazid"), ket: `Depan · ${K.PERAN[k]} · HEX Yazid ${K.PALET.yazid[k]}` })),
  { html: cetakBelakang(QR.A), ket: "Belakang · QR A (Plain)" }, { kalibrasi: true }];
const hal3: Slot[] = [
  { html: cetakBelakang(QR.A), ket: "QR A · Plain · 3-M · modul 0,70 mm" },
  { html: cetakBelakang(QR.B), ket: "QR B · PINTAR tile · 3-M · modul 0,70 mm" },
  { html: cetakBelakang(QR.C1), ket: `QR C1 · logo di tengah · ${QR.C1.versi}-H · modul ${String(QR.C1.modul).replace(".", ",")} mm` },
  { html: cetakBelakang(QR.C2), ket: `QR C2 · logo di tengah · ${QR.C2.versi}-H · modul ${String(QR.C2.modul).replace(".", ",")} mm` },
  { html: cetakDepan(PANJANG, "setara"), ket: "Depan · nama enam kata" },
  { html: cetakDepan(DUA_PERAN, "setara"), ket: "Depan · dua peran (pertanyaan, belum diputuskan)" },
  { html: cetakDepan(ORANG.adminPlatform, "setara"), ket: "Depan · Admin platform tanpa sekolah (usulan)" },
  { kalibrasi: true }];
// Chromium snaps boxes to whole CSS pixels (0.26 mm). The sheet is laid out ten
// times larger and printed at 0.1, so that snapping is 0.026 mm; the PDF is then
// set to exactly A4 and measured (below).
py("huruf", join(AKAR, "public/fonts/plus-jakarta-sans-latin.woff2"), KERJA);
const htmlA4 = halaman("Kartu PINTAR · A4 100%", `<div style="zoom:10">${lembarA4(1, "enam depan dan satu belakang", hal1, { 6: QR_UTAMA })
  + lembarA4(2, "HEX Yazid, untuk dibandingkan", hal2, { 6: QR.A })
  + lembarA4(3, "studi QR dan kasus uji", hal3, { 0: QR.A, 1: QR.B, 2: QR.C1, 3: QR.C2 })}</div>`,
  `@page { size: A4; margin: 0; } body { background: #fff; } .a4:last-child { page-break-after: auto; }`, KERJA);
const PDF = join(RENDER, "E-A4-100persen.pdf");
{
  const f = join(KERJA, "E-A4.html");
  writeFileSync(f, htmlA4);
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: PDF, width: "210mm", height: "297mm", scale: 0.1, printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
  await ctx.close();
}

// ════════════════════════════════════════════════════════════════════════════
// F. In context: the email frame at 600 and 320 px, light and dark; a phone screen
// ════════════════════════════════════════════════════════════════════════════
// the card as the email carries it: a PNG at twice its display width, the hairline on
const depanPng = await potret(halaman("depan", `<div style="padding:0;display:inline-block">${K.depan(UTAMA, "setara", { garis: true })}</div>`, "body{background:transparent}"),
  "F-kartu-depan.png", { lebar: 400, skala: 880 / mmPx(K.UKURAN.lebar), elemen: ".kp", transparan: true });
const belakangPng = await potret(halaman("belakang", `<div style="display:inline-block">${K.belakang(UTAMA, QR_UTAMA, LOGO, { garis: true })}</div>`, "body{background:transparent}"),
  "F-kartu-belakang.png", { lebar: 400, skala: 880 / mmPx(K.UKURAN.lebar), elemen: ".kp", transparan: true });
const ALT_DEPAN = `Kartu PINTAR, sisi depan: ${UTAMA.nama}, PINTAR ID ${K.tampilId(UTAMA.id)}, Guru, ${UTAMA.sekolah}.`;
const ALT_BELAKANG = "Kartu PINTAR, sisi belakang: kode QR ke halaman masuk PINTAR.";
const blokKartu = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px 0;">
<tr><td align="center" style="padding:0 0 12px 0;"><img src="file://${depanPng}" width="440" alt="${K.esc(ALT_DEPAN)}" style="display:block;width:100%;max-width:440px;height:auto;border:0;"></td></tr>
<tr><td align="center"><img src="file://${belakangPng}" width="440" alt="${K.esc(ALT_BELAKANG)}" style="display:block;width:100%;max-width:440px;height:auto;border:0;"></td></tr></table>`;
const email = bingkaiEmail({
  subjek: "Kartu PINTAR Anda",
  pratinjau: `Simpan kartu ini. PINTAR ID Anda: ${K.tampilId(UTAMA.id)}.`,
  judul: "Kartu PINTAR Anda",
  isi: [
    { jenis: "paragraf", teks: `Halo, ${UTAMA.nama}. Ini kartu PINTAR Anda.` },
    { jenis: "paragraf", teks: "@@KARTU@@" },
    { jenis: "rincian", baris: [["PINTAR ID", K.tampilId(UTAMA.id)], ["Peran", "Guru"], ["Sekolah", UTAMA.sekolah!]] },
    { jenis: "paragraf", teks: "Kartu ini juga ada di Akun saya." },
    { jenis: "tombol", teks: "Masuk ke PINTAR", href: "https://contoh.pintar.invalid/masuk" },
  ],
  alasan: "Anda menerima email ini karena akun PINTAR Anda baru saja aktif.",
});
// as the frame's own prototype does: the production logo URL, served from the repository for the render
const htmlEmail = email.html.replace(LOGO_BAKU, `file://${AKAR}/public/brand/pintar-selalu-logo.png`).replace(/<p class="pin-teks"[^>]*>@@KARTU@@<\/p>/, blokKartu);
if (!htmlEmail.includes(depanPng)) throw new Error("the card block was not placed in the email");
const emailPng: Record<string, string> = {};
for (const [lebar, gelap] of [[600, false], [600, true], [320, false], [320, true]] as const) {
  const nama = `F-email-${lebar}-${gelap ? "gelap" : "terang"}.png`;
  const f = join(KERJA, nama.replace(".png", ".html"));
  writeFileSync(f, htmlEmail);
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
// a phone: the card in Akun saya (a context mock; the screen itself is DAISY-20's)
const ponsel = `<div style="width:390px;min-height:844px;background:${W.kertas};font-family:'Plus Jakarta Sans';color:${W.tinta}">
<div style="height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;border-bottom:1px solid rgba(31,42,51,.12);background:#fff">
<img src="${LOGO}" alt="PINTAR" style="height:32px;display:block"><span style="font-size:14px;color:${W.tinta2}">Keluar</span></div>
<div style="padding:24px 16px">
<p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:${W.tinta3}">Akun saya</p>
<h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:600">Kartu PINTAR Anda</h1>
<img src="file://${depanPng}" alt="${K.esc(ALT_DEPAN)}" style="display:block;width:100%;height:auto">
<img src="file://${belakangPng}" alt="${K.esc(ALT_BELAKANG)}" style="display:block;width:100%;height:auto;margin-top:12px">
<div style="margin-top:20px;border-top:1px solid rgba(31,42,51,.12)">${[["PINTAR ID", K.tampilId(UTAMA.id), true], ["Peran", "Guru", false], ["Sekolah", UTAMA.sekolah!, false]].map(([k, v, mono]) =>
  `<div style="display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid rgba(31,42,51,.12);font-size:14px"><span style="color:${W.tinta3}">${k}</span><span style="${mono ? "font-family:'IBM Plex Mono';font-weight:500;letter-spacing:.06em;" : ""}font-size:${mono ? 15 : 14}px;text-align:right">${v}</span></div>`).join("")}</div>
<a style="display:block;margin-top:24px;height:52px;line-height:52px;text-align:center;border-radius:8px;background:${W.hijau};color:#fff;font-weight:600;font-size:16px;text-decoration:none">Unduh kartu</a>
</div></div>`;
await potret(halaman("ponsel", ponsel, "body{background:#FBFAF7}"), "F-ponsel-390.png", { lebar: 390, tinggi: 844, skala: 2 });

// ════════════════════════════════════════════════════════════════════════════
// Checks on the rendered cards: safe margin, name length, forbidden words
// ════════════════════════════════════════════════════════════════════════════
{
  const semua = [...K.KELUARGA.flatMap((k) => [K.depan(ORANG[k], "setara"), K.depan(ORANG[k], "yazid")]), K.depan(PANJANG, "setara"), K.depan(DUA_PERAN, "setara"), K.depan(TANPA_SEKOLAH_OPSI, "setara"),
    ...Object.values(QR).map((v) => K.belakang(UTAMA, v, LOGO))];
  const f = join(KERJA, "cek.html");
  writeFileSync(f, halaman("cek", `<div style="display:flex;flex-wrap:wrap;gap:10mm;padding:10mm">${semua.join("")}</div>`));
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const p = await ctx.newPage();
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  const px = 96 / 25.4;
  const hasil = await p.evaluate(({ aman, px }: { aman: number; px: number }) => {
    const keluar: string[] = [];
    const nama: number[] = [];
    const teks: string[] = [];
    document.querySelectorAll(".kp-trim").forEach((trim, i) => {
      const t = trim.getBoundingClientRect();
      const batas = { l: t.left + aman * px, r: t.right - aman * px, a: t.top + aman * px, b: t.bottom - aman * px };
      trim.querySelectorAll("p, .kp-merek, img, svg").forEach((el) => {
        const r = el.getBoundingClientRect();
        // text boxes: measure the ink line, not the box's own width
        const range = document.createRange(); range.selectNodeContents(el);
        const rr = el.tagName === "P" || el.classList.contains("kp-merek") ? range.getBoundingClientRect() : r;
        if (rr.left < batas.l - 0.5 || rr.right > batas.r + 0.5 || rr.top < batas.a - 0.5 || rr.bottom > batas.b + 0.5) keluar.push(`card ${i}: ${el.tagName.toLowerCase()}${el.className ? "." + el.className : ""} "${(el.textContent ?? "").slice(0, 30)}"`);
      });
      trim.querySelectorAll(".kp-nama").forEach((el) => nama.push(Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight))));
      teks.push((trim as HTMLElement).innerText);
      trim.querySelectorAll("img").forEach((im) => teks.push(im.getAttribute("alt") ?? ""));
    });
    return { keluar, nama, teks: teks.join(" \n ") };
  }, { aman: K.UKURAN.aman, px });
  catat("");
  catat(`SAFE MARGIN (3 mm): ${hasil.keluar.length ? `${hasil.keluar.length} element(s) outside: ${hasil.keluar.join("; ")}` : "every text line, the logo and every QR (quiet zone included) inside, on all " + semua.length + " faces"}`);
  gagal += hasil.keluar.length;
  const maks = Math.max(...hasil.nama);
  catat(`NAME LENGTH: lines per name ${hasil.nama.join(", ")}; the longest sample ("${PANJANG.nama}", ${PANJANG.nama.length} characters) takes ${maks} line(s); limit 2`);
  if (maks > 2) gagal++;
  // never on the card: PIN, password, email address, date of birth, or any claim the QR verifies anything
  const TERLARANG = ["pin", "password", "kata sandi", "sandi", "verifikasi", "verify", "verified", "autentik", "authentic", "asli", "keaslian", "sah", "resmi", "official", "cek keaslian", "scan to check", "lahir", "tanggal lahir"];
  const kena = TERLARANG.filter((w) => new RegExp(`(?<![\\p{L}\\p{N}])${w}(?![\\p{L}\\p{N}])`, "iu").test(hasil.teks));
  const emailAddr = /[\w.+-]+@[\w-]+\.[\w.]+/.test(hasil.teks);
  catat(`FORBIDDEN ON THE CARD (PIN, password, email address, date of birth, any verify/authentic claim): ${kena.length || emailAddr ? `FOUND ${kena.join(", ")}${emailAddr ? " an email address" : ""}` : "none found on any face, including image alt text"}`);
  gagal += kena.length + (emailAddr ? 1 : 0);
  // the scan's control: a planted word must be caught
  const kontrol = TERLARANG.filter((w) => new RegExp(`(?<![\\p{L}\\p{N}])${w}(?![\\p{L}\\p{N}])`, "iu").test("Pindai untuk verifikasi kartu asli"));
  catat(`  control (planted «verifikasi … asli»): caught ${kontrol.join(", ") || "NOTHING"}`);
  if (!kontrol.length) gagal++;
  await ctx.close();
}
await browser.close();

// ════════════════════════════════════════════════════════════════════════════
// PDF geometry and the QR decode tests
// ════════════════════════════════════════════════════════════════════════════
const manifest = {
  url: URL_CONTOH,
  pdf: PDF,
  kasus: letakKasus.flatMap(({ kode, nama, l, v }) => {
    const p = K.letakQr(v);
    return [
      { kode: `${kode}@${l.halaman + 1}`, nama: `${v.nama}, page ${l.halaman + 1} (QR crop)`, halaman: l.halaman, kotak: [l.x + p.kiri, l.y + p.atas, p.sisi, p.sisi], simpan: join(KERJA, `qr-${l.halaman}-${kode}.png`) },
      { kode: `${kode}@${l.halaman + 1}·card`, nama: `${v.nama}, page ${l.halaman + 1} (the whole back: the decoder must find the QR)`, halaman: l.halaman, kotak: [l.x, l.y, K.UKURAN.lebar, K.UKURAN.tinggi], simpan: join(KERJA, `kartu-${l.halaman}-${kode}.png`), sapu: false },
    ];
  }),
  layar: [
    { kode: "screen", nama: "email 320 px, light, the whole screenshot (2x)", png: emailPng["F-email-320-terang.png"] },
    { kode: "screen", nama: "email 600 px, dark, the whole screenshot (2x)", png: emailPng["F-email-600-gelap.png"] },
    { kode: "screen", nama: "phone 390 px, the whole screenshot (2x)", png: join(RENDER, "F-ponsel-390.png") },
  ],
};
// only page 1's back and page 3's four variants are decoded (page 2 repeats A)
manifest.kasus = manifest.kasus.filter((k) => k.halaman !== 1);
const MANIFEST = join(KERJA, "manifest.json");
writeFileSync(MANIFEST, JSON.stringify(manifest));
const HASIL = join(RENDER, "uji-qr.json");
py("uji", MANIFEST, HASIL);
type Batas = { dpi: number | null; blur_px: number | null; kontras: number | null; miring: number | null };
const uji = JSON.parse(readFileSync(HASIL, "utf8")) as Array<{ kode: string; nama: string; uji: Array<{ nama: string; zxing: boolean; opencv: boolean }>; batas?: { zxing: Batas; opencv: Batas } }>;
catat("");
catat("QR DECODE TESTS (zxing-cpp and OpenCV; PASS = the exact sample link came back)");
for (const u of uji) {
  const lulus = u.uji.filter((x) => x.zxing).length, lulusCv = u.uji.filter((x) => x.opencv).length;
  catat(`  ${u.kode} ${u.nama}: zxing ${lulus}/${u.uji.length}, opencv ${lulusCv}/${u.uji.length}`);
  for (const x of u.uji) catat(`      ${x.nama}: zxing ${x.zxing ? "PASS" : "FAIL"}, opencv ${x.opencv ? "PASS" : "FAIL"}`);
  if (u.batas) for (const dec of ["zxing", "opencv"] as const) {
    const x = u.batas[dec];
    catat(`      ${dec} limits (last value before the first failure): every scale down to ${x.dpi} dpi; blur up to sigma ${x.blur_px} px at 300 dpi (${x.blur_px === null ? "-" : f2(x.blur_px * 25.4 / 300)} mm); contrast down to ${x.kontras} of the original; tilt up to ${x.miring} deg`);
  }
  // the actual-size read must pass on both decoders; stress failures are findings, not build failures
  if (!u.uji[0].zxing || !u.uji[0].opencv) gagal++;
}
const geometri = JSON.parse(py("a4", PDF)) as { halaman: number; ukuran_mm: number[]; per_halaman: Array<Array<[number, number, number, number, string]>>; fonts: string[] };
catat("");
catat(`PDF: ${geometri.halaman} pages, set to ${geometri.ukuran_mm.join(" × ")} mm. Fonts embedded: ${geometri.fonts.join(", ")}.`);
if (Math.abs(geometri.ukuran_mm[0] - 210) > 0.01 || Math.abs(geometri.ukuran_mm[1] - 297) > 0.01) gagal++;
if (geometri.fonts.some((f) => /Type3/.test(f))) { gagal++; catat("  a Type3 font is embedded"); }
{
  // measured on page 1: each card's paper (89.60 × 57.98 with bleed) and its colour layer (89.60 × 25.98), and the scale box
  const d = geometri.per_halaman[0];
  const kertas = d.filter((r) => r[4] === "f" && Math.abs(r[3] - 57.98) < 0.2);
  const lapis = d.filter((r) => r[4] === "f" && Math.abs(r[3] - 25.98) < 0.2);
  const kotak = d.filter((r) => r[4] === "s");
  const lebar = (rs: typeof d) => rs.map((r) => `${r[2].toFixed(2)} × ${r[3].toFixed(2)}`);
  const galat = Math.max(...[...kertas.map((r) => Math.max(Math.abs(r[2] - 89.6), Math.abs(r[3] - 57.98))), ...lapis.map((r) => Math.max(Math.abs(r[2] - 89.6), Math.abs(r[3] - 25.98)))]);
  catat(`  page 1, measured in the PDF: ${kertas.length} card papers ${[...new Set(lebar(kertas))].join(", ")} mm (89.60 × 57.98 expected: trim 85.60 × 53.98 plus 2 mm bleed); ${lapis.length} colour layers ${[...new Set(lebar(lapis))].join(", ")} mm (89.60 × 25.98 expected); scale box stroke ${lebar(kotak).join(", ")} mm (85.50 × 53.88 expected, the 0.1 mm line's centre); largest error ${galat.toFixed(3)} mm`);
  if (kertas.length !== 7 || lapis.length !== 6 || galat > 0.05) gagal++;
}

// print shift
const cmyk = JSON.parse(py("cmyk", ...K.KELUARGA.map((k) => K.PALET.yazid[k]), ...K.KELUARGA.map((k) => K.PALET.setara[k]), W.hijau, W.kertas, W.hijauLembut, W.tinta));
catat("");
catat("PRINT SHIFT (sRGB -> MuPDF's built-in CMYK profile -> sRGB; CIEDE2000; an estimate, not the printer's own profile)");
for (const c of cmyk) catat(`  ${c.hex}: CMYK ${c.cmyk.join("/")} -> ${c.kembali}, dE2000 ${c.de2000}`);

// ════════════════════════════════════════════════════════════════════════════
// D. The QR study sheet (it needs the decode results)
// ════════════════════════════════════════════════════════════════════════════
{
  const b2 = await chromium.launch();
  const ringkas = (kode: string) => {
    const a = uji.find((u) => u.kode === `${kode}@3`)!, c = uji.find((u) => u.kode === `${kode}@3·card`)!;
    const n = a.uji.length;
    const z = a.batas!.zxing, o = a.batas!.opencv;
    return `8 fixed tests: zxing ${a.uji.filter((x) => x.zxing).length}/${n}, OpenCV ${a.uji.filter((x) => x.opencv).length}/${n} (QR crop); zxing ${c.uji.filter((x) => x.zxing).length}/${n}, OpenCV ${c.uji.filter((x) => x.opencv).length}/${n} (whole back).<br>Limits, zxing / OpenCV: scale ${z.dpi} / ${o.dpi} dpi; blur ${z.blur_px} / ${o.blur_px} px; contrast ${z.kontras} / ${o.kontras}; tilt ${z.miring}° / ${o.miring}°.`;
  };
  const kolom = Object.values(QR).map((v) => {
    const p = K.letakQr(v);
    const n = v.matriks.length;
    const lubang = v.lubang ? `${v.lubang[0]} × ${v.lubang[1]} modules knocked out (${(100 * v.lubang[0] * v.lubang[1] / (n * n)).toFixed(1)}% of the symbol; level H restores about 30%)` : "none";
    return `<div>${K.belakang(UTAMA, v, LOGO)}<table class="spek" style="margin-top:2mm;width:85.6mm">
<tr><th colspan="2">${v.kode} · ${v.nama}</th></tr>
<tr><td>Version, level</td><td>${v.versi}-${v.ecc} (${n} × ${n} modules), byte mode, ${URL_CONTOH.length} characters</td></tr>
<tr><td>Module</td><td>${v.modul.toFixed(3)} mm</td></tr>
<tr><td>Symbol</td><td>${f2(n * v.modul)} mm; with the 4-module quiet zone ${f2(p.sisi)} mm${v.ubin ? `; the tile ${f2(p.sisi)} × ${f2(p.tinggi)} mm` : ""}</td></tr>
<tr><td>Centre mark</td><td>${lubang}</td></tr>
<tr><td>Encoder</td><td>${v.sumber}</td></tr>
<tr><td>Decode</td><td>${ringkas(v.kode)}</td></tr></table></div>`;
  });
  const f = join(KERJA, "D-qr-studi.html");
  writeFileSync(f, halaman("D · QR study", `<div class="lembar" style="width:${2 * 85.6 + 8}mm">
<h1>D · The QR study: one sample link, four treatments</h1>
<p class="sub">Every symbol encodes ${URL_CONTOH} (${URL_CONTOH.length} characters, the length of a real /id/ link). PINTAR-green modules on a light ground on every card; never inverted. A and B use the app's own encoder (level M); C needs level H for its centre mark, so it grows (C1, same module) or its modules shrink (C2, same footprint as A). Decode: 8 tests each, at 300 dpi from the A4 PDF, then downscaled, blurred, angled, faded and all at once (README §7).</p>
<div style="display:grid;grid-template-columns:repeat(2,85.6mm);gap:8mm">${kolom.join("")}</div></div>`));
  const ctx = await b2.newContext({ viewport: { width: Math.ceil(mmPx(2 * 85.6 + 8 + 16)), height: 400 }, deviceScaleFactor: 4 });
  const p = await ctx.newPage();
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: join(RENDER, "D-qr-studi.png"), fullPage: true });
  // a page-1 preview of the A4 sheet, for a quick look without opening the PDF
  await b2.close();
}
execFileSync(PY, ["-c", `
import pymupdf
d = pymupdf.open(${JSON.stringify(PDF)})
for i in range(len(d)):
    d[i].get_pixmap(dpi=110).save(${JSON.stringify(join(RENDER, "E-A4-halaman-"))} + str(i + 1) + ".png")
`]);

writeFileSync(join(RENDER, "laporan.txt"), laporan.join("\n") + "\n");
console.log(laporan.join("\n"));
console.log(gagal ? `\n${gagal} problem(s)` : "\nall checks passed");
process.exit(gagal ? 1 : 0);
