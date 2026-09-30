/**
 * Sertifikat PINTAR, round 1 (D-073): the render script. Run from the repository root:
 *
 *   KARTU_PY=/path/to/venv/bin/python npx tsx docs/coordination/ux/sertifikat/buat-sertifikat.mts
 *
 * KARTU_PY is a Python with requirements.txt installed (the card's, unchanged).
 * It builds every render in render/ from the one grammar in sertifikat.mts, with
 * the words taken from the app's copy table (src/lib/hle.ts), writes the A4 PDF,
 * runs the checks (contrast, colour distances, print margins, overlaps, quiet
 * zone, line counts, required and forbidden words, PDF geometry), the QR decode
 * tests, the print simulations and the distance test, and writes
 * render/laporan.txt. It exits non-zero if a check fails.
 *
 * Samples only: every person, school, number and link is invented, and the QR
 * encodes https://contoh.pintar.invalid/verifikasi/… (RFC 2606: never exists).
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { qrMatrix } from "../../../../src/lib/qr.js";
import { t, format, type HleEvent } from "../../../../src/lib/hle.js";
import * as S from "./sertifikat.mjs";
import { sertifikatLain } from "./sertifikat-lain.mjs";

const AKAR = process.cwd();
const DIR = join(AKAR, "docs/coordination/ux/sertifikat");
const RENDER = join(DIR, "render");
const KERJA = join(tmpdir(), "sertifikat-r1-kerja");
mkdirSync(RENDER, { recursive: true });
mkdirSync(KERJA, { recursive: true });
const PY = process.env.KARTU_PY ?? "python3";
const py = (...a: string[]) => execFileSync(PY, [join(DIR, "uji-sertifikat.py"), ...a], { maxBuffer: 1 << 27 }).toString();

const laporan: string[] = [];
let gagal = 0;
const catat = (s: string) => { laporan.push(s); };
const f2 = (x: number) => x.toFixed(2);
const f3 = (x: number) => x.toFixed(3);
const W = S.WARNA;

// ── the words: the app's own copy table, D-014 ────────────────────────────────
const s = (k: string, persona: "learner" | "public" = "learner") => t(k as HleEvent, persona, { locale: "id" });
const KATA: S.Kata = {
  jenis: s("sertifikat.jenis"), diberikan: s("sertifikat.diberikan"), predikat: s("sertifikat.predikat"),
  tanggal: s("sertifikat.tanggal"), nomor: s("sertifikat.nomor"), periksa: s("sertifikat.periksa.judul"),
  arti: s("sertifikat.periksa.arti"),
  penerbit: s("verifikasi.institusi", "public"), // PROPOSAL: no sertifikat key yet; the verification page's own words
};
for (const [k, v] of Object.entries(KATA)) if (!v || /^[a-z]+(\.[a-z_]+)+$/.test(v)) throw new Error(`no copy for ${k}`);
const AKSI = { cetak: s("sertifikat.cetak"), salin: s("sertifikat.salin"), kembali: s("sertifikat.kembali"), unduh: "Unduh PDF", cetakSaja: "Cetak" }; // the last two: the brief's words, PROPOSAL

// ── the link and the QR ───────────────────────────────────────────────────────
const KODE = "q7Hn2VxR0tLb9KcWm4ZsYp6EdJf1uA8oGiTk3NvB5eQ"; // invented; the shape of a real token (32 random bytes, base64url)
if (!/^[A-Za-z0-9_-]{43}$/.test(KODE)) throw new Error("the sample code must be 43 base64url characters");
const URL5 = `https://contoh.pintar.invalid/verifikasi/${KODE}`;
const URL6 = `https://sertifikat.contoh.pintar.invalid/verifikasi/${KODE}`; // a longer host: the next version up
for (const u of [URL5, URL6]) if (new URL(u).hostname.split(".").pop() !== "invalid") throw new Error("sample links must be .invalid");
const PANJANG_PRODUKSI = "https://app.pintarselalu.com/verifikasi/".length + 43; // alamatMasuk's own note: production is app.pintarselalu.com
const matriks = (u: string) => qrMatrix(u).map((r: boolean[]) => r.map((x) => (x ? 1 : 0)));
const M5 = matriks(URL5), M6 = matriks(URL6);
const versi = (m: number[][]) => (m.length - 17) / 4;
const M_LAIN = matriks("https://contoh-lain.invalid/c/KCK-2026-0088");

// ── samples: invented people, schools, numbers ───────────────────────────────
const TGL = format.date("2026-09-14T02:12:40Z", "id"); // 09:12 in Jakarta
const DASAR = { tanggal: TGL, url: URL5, matriks: M5 };
const SAMPEL: Record<string, S.Data> = {
  akademik: { ...DASAR, sekolah: "SMP Cahaya Kaliandra", nama: "Bagas Saputra", kursus: "Matematika · Bab 4: Sistem Persamaan Linear", predikat: "Sangat Baik", nomor: "PINTAR/SMP-CAHAYA-KALIANDRA/2026/00042", konteks: "ACADEMIC" },
  profesional: { ...DASAR, sekolah: "SMP Cahaya Kaliandra", nama: "Ratna Dewi Kusumawardani", kursus: "Pengembangan Profesi · Merancang Asesmen Formatif di Kelas", predikat: "Baik", nomor: "PINTAR/SMP-CAHAYA-KALIANDRA/2026/00043", konteks: "PROFESSIONAL_DEVELOPMENT" },
  panjang: { ...DASAR, sekolah: "Sekolah Menengah Kejuruan Teknologi dan Rekayasa Nusa Kaliandra Timur", nama: "Ni Luh Putu Ayu Kartika Maharani Suryaningsih", kursus: "Ilmu Pengetahuan Alam · Bab 7: Ekosistem, Interaksi Antarmakhluk Hidup, dan Pengaruh Manusia terhadap Keseimbangan Lingkungan", predikat: "Baik", nomor: "PINTAR/SMK-TEKNOLOGI-DAN-REKAYASA-NUSA-KALIANDRA-TIMUR/2026/00042", konteks: "ACADEMIC" },
  ekstrem: { ...DASAR, sekolah: "Sekolah Menengah Atas Unggulan Terpadu Yayasan Pendidikan Cendekia Nusantara Kaliandra Barat Daya", nama: "Raden Mas Muhammad Rizky Aditya Pratama Wicaksono Hadiningrat Kusumo", kursus: "Pendidikan Pancasila dan Kewarganegaraan · Bab 5: Keberagaman Suku, Agama, Ras, dan Antargolongan dalam Bingkai Bhinneka Tunggal Ika di Lingkungan Sekolah dan Masyarakat", predikat: "Perlu Pendampingan", nomor: "PINTAR/SMA-UNGGULAN-TERPADU-YAYASAN-PENDIDIKAN-CENDEKIA-NUSANTARA-KALI/2026/12345", konteks: "ACADEMIC" },
  pendek: { ...DASAR, sekolah: "SMA Bukit Asri", nama: "Sukarmi", kursus: "Fisika · Bab 1: Besaran dan Satuan", predikat: "Cukup", nomor: "PINTAR/SMA-BUKIT-ASRI/2026/00007", konteks: "ACADEMIC" },
  apostrof: { ...DASAR, sekolah: "SMA Bukit Asri Kaliandra", nama: "Nur'aini Rahmawati", kursus: "Pengembangan Profesi · Bimbingan Konseling untuk Wali Kelas", predikat: "Sangat Baik", nomor: "PINTAR/SMA-BUKIT-ASRI-KALIANDRA/2026/00118", konteks: "PROFESSIONAL_DEVELOPMENT" },
};
const NOMOR_RE = /^PINTAR\/[A-Z0-9][A-Z0-9-]{1,62}\/\d{4}\/\d{5}$/; // upper(institutions.slug), 2-63 characters
for (const [k, d] of Object.entries(SAMPEL)) if (!NOMOR_RE.test(d.nomor)) throw new Error(`${k}: not a certificate number the migration can make: ${d.nomor}`);
const A = SAMPEL.akademik, P = SAMPEL.profesional;
const sr = (arah: S.Arah, d: S.Data, o: S.Opsi = {}) => S.sertifikat(arah, d, KATA, o);

// ── pages ────────────────────────────────────────────────────────────────────
const MEJA = "#E6E3DC";
const halaman = (judul: string, badan: string, tambahan = "", statis?: string) => `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${judul}</title>
<style>${S.css(AKAR, statis)}
html, body { margin: 0; }
body { background: ${MEJA}; color: ${W.tinta}; font-family: 'Plus Jakarta Sans'; text-rendering: geometricPrecision; font-kerning: normal; }
.lembar { padding: 8mm; }
.lembar h1 { font: 600 13pt 'Plus Jakarta Sans'; margin: 0 0 1.4mm; letter-spacing: -0.01em; }
.lembar .sub { font: 400 8pt/1.5 'Plus Jakarta Sans'; color: ${W.tinta2}; margin: 0 0 6mm; max-width: 250mm; }
.lembar h2 { font: 600 9.5pt 'Plus Jakarta Sans'; margin: 0 0 3mm; }
.baris { display: flex; gap: 8mm; align-items: flex-start; margin-bottom: 8mm; flex-wrap: wrap; }
.baris > * { flex: none; }
.ket { font: 400 7pt/1.45 'Plus Jakarta Sans'; color: ${W.tinta2}; margin-top: 2mm; }
.ket b { font-weight: 600; color: ${W.tinta}; }
.buka { color: #8A5F00; font-weight: 600; }
.bayang { box-shadow: 0 0.4mm 1.2mm rgba(0,0,0,.18); }
table.spek { border-collapse: collapse; font: 400 7pt/1.4 'Plus Jakarta Sans'; }
table.spek th { font-weight: 600; text-align: left; padding: 1.2mm 3.5mm 1.2mm 0; border-bottom: 0.2mm solid rgba(31,42,51,.24); vertical-align: bottom; }
table.spek td { padding: 1.2mm 3.5mm 1.2mm 0; border-bottom: 0.2mm solid rgba(31,42,51,.12); vertical-align: top; }
.tutup .merek::after { content: ""; position: absolute; left: -1.4mm; right: -1.4mm; top: -1.2mm; bottom: -1.2mm; background: #EDE7D6; box-shadow: 0 0.2mm 0.4mm rgba(0,0,0,.25); transform: rotate(-1.2deg); }
${tambahan}</style></head><body>${badan}</body></html>`;

const require_ = createRequire("/opt/node22/lib/node_modules/");
const { chromium } = require_("playwright");
const browser = await chromium.launch({ args: ["--force-color-profile=srgb"] });
type Potret = { lebar: number; tinggi?: number; skala: number; elemen?: string; ke?: string };
async function potret(html: string, nama: string, o: Potret): Promise<string> {
  const f = join(KERJA, nama.replace(/\.png$/, ".html"));
  writeFileSync(f, html);
  const ctx = await browser.newContext({ viewport: { width: o.lebar, height: o.tinggi ?? 400 }, deviceScaleFactor: o.skala });
  const p = await ctx.newPage();
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  const keluar = join(o.ke ?? RENDER, nama);
  if (o.elemen) await p.locator(o.elemen).first().screenshot({ path: keluar });
  else await p.screenshot({ path: keluar, fullPage: true });
  await ctx.close();
  return keluar;
}
const mmPx = (v: number) => (v * 96) / 25.4;
/** cap height on paper, from the fonts' OS/2 sCapHeight (read from public/fonts: PJS 745/1000, Plex Mono 698/1000) */
const tinggiKapital = (g: S.Gaya) => (g.pt * 25.4) / 72 * (g.huruf === "IBM Plex Mono" ? 0.698 : 0.745);
const kecil = (html: string, z: number, kelas = "") => `<div class="bayang ${kelas}" style="zoom:${z};width:${S.A4.w}mm;height:${S.A4.h}mm">${html}</div>`;
/** one sheet as a PNG at a given dpi, for boards, distance and print work */
async function lembarPng(html: string, nama: string, dpi: number, ke = KERJA): Promise<string> {
  return potret(halaman(nama, `<div style="display:inline-block">${html}</div>`, "body{background:#fff}"), nama, { lebar: 900, tinggi: 1200, skala: dpi / 96, elemen: ".sr", ke });
}

// ── OKLCH ─────────────────────────────────────────────────────────────────────
function oklch(hex: string): [number, number, number] {
  const [r, g, b] = [1, 3, 5].map((i) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const q = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * q;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * q;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * q;
  return [L, Math.hypot(a, bb), ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360];
}
const lch = (h: string) => { const [l, c, hh] = oklch(h); return `${f3(l)} / ${f3(c)} / ${hh.toFixed(0)}`; };

// ════════════════════════════════════════════════════════════════════════════
// Colour: contrast, the two accents, the near greens, print shift
// ════════════════════════════════════════════════════════════════════════════
const PUTIH = "#FFFFFF";
const AK = S.AKSEN.ACADEMIC, PR = S.AKSEN.PROFESSIONAL_DEVELOPMENT;
catat("SAMPLES: every person, school, number and link is invented. Words from src/lib/hle.ts (id), except «Diterbitkan oleh» (verifikasi.institusi, a PROPOSAL on the certificate).");
catat(`QR: sample link ${URL5.length} characters -> version ${versi(M5)}-M (${M5.length} modules); production link ${PANJANG_PRODUKSI} characters (app.pintarselalu.com) -> the same version; version 5-M holds 84 bytes, so 2 more characters of host move it to version 6. Longer-host sample ${URL6.length} characters -> version ${versi(M6)}.`);
if (versi(M5) !== 5 || versi(M6) !== 6) gagal++;
catat("");
catat("CONTRAST (WCAG 2.x; small text 4.5:1, the name and course are large text but held to 4.5:1 too). Paper: white in print, #FBFAF7 on screen");
type Pas = { apa: string; teks: string; latar: string; min: number };
const PAS: Pas[] = [
  { apa: "name, course, predikat, date, number, school (ink)", teks: W.tinta, latar: PUTIH, min: 4.5 },
  { apa: "«telah menuntaskan», verification sentence, link (ink-2)", teks: W.tinta2, latar: PUTIH, min: 4.5 },
  { apa: "labels (ink-3, 7 pt capitals)", teks: W.tinta3, latar: PUTIH, min: 4.5 },
  { apa: "«PINTAR SELALU» colophon (PINTAR green)", teks: W.hijau, latar: PUTIH, min: 4.5 },
  { apa: "QR modules (PINTAR green) on paper", teks: W.hijau, latar: PUTIH, min: 4.5 },
  { apa: "QR modules on the soft-green tile (study)", teks: W.hijau, latar: W.hijauLembut, min: 4.5 },
  { apa: "heading, academic accent", teks: AK, latar: PUTIH, min: 4.5 },
  { apa: "heading, professional accent", teks: PR, latar: PUTIH, min: 4.5 },
  { apa: "Modern band: school and label (paper) on the academic accent", teks: W.kertas, latar: AK, min: 4.5 },
  { apa: "Modern band: school and label (paper) on the professional accent", teks: W.kertas, latar: PR, min: 4.5 },
  { apa: "labels (ink-3) on screen paper", teks: W.tinta3, latar: W.kertas, min: 4.5 },
];
for (const p of PAS) {
  const r = S.rasio(p.teks, p.latar);
  if (r < p.min) gagal++;
  catat(`  ${p.apa}: ${p.teks} on ${p.latar} = ${f2(r)}:1${r < p.min ? "  BELOW" : ""}`);
}
catat(`  the gold line (structure, not text): ${W.emas} on white ${f2(S.rasio(W.emas, PUTIH))}:1; on the academic accent ${f2(S.rasio(W.emas, AK))}:1; on the professional ${f2(S.rasio(W.emas, PR))}:1`);
catat(`  greyscale: paper ${S.abuHex(PUTIH)}, gold ${S.abuHex(W.emas)}, academic ${S.abuHex(AK)}, professional ${S.abuHex(PR)}, PINTAR green ${S.abuHex(W.hijau)}: the two accents are one grey by design (the accent carries no information)`);
const jarakA = JSON.parse(py("jarak", AK, PR, W.hijau, W.emas)) as Record<string, Array<{ i: number; j: number; oklab: number; de2000: number }>>;
const NAMA4 = ["academic plum", "professional sage", "PINTAR green", "gold"];
catat("");
catat("COLOUR DISTANCES (OKLab / CIEDE2000; normal | deuteranopia | protanopia)");
for (let n = 0; n < jarakA.normal.length; n++) {
  const a = jarakA.normal[n], d = jarakA.deuteranopia[n], p = jarakA.protanopia[n];
  catat(`  ${NAMA4[a.i]} / ${NAMA4[a.j]}: ${a.oklab.toFixed(4)} / ${a.de2000} | ${d.oklab.toFixed(4)} / ${d.de2000} | ${p.oklab.toFixed(4)} / ${p.de2000}`);
}
const sageHijau = jarakA.normal.find((x) => x.i === 1 && x.j === 2)!;
catat(`  NOTE: the professional sage and the QR's PINTAR green are ${sageHijau.oklab.toFixed(4)} apart (OKLab): two different greens on one professional certificate (README §G).`);
const cmyk = JSON.parse(py("cmyk", AK, PR, W.emas, W.hijau, W.tinta, W.tinta2, W.tinta3, W.kertas)) as Array<{ hex: string; cmyk: number[]; kembali: string; de2000: number }>;
catat("");
catat("PRINT SHIFT (sRGB -> MuPDF's built-in CMYK profile -> sRGB; an estimate)");
for (const c of cmyk) catat(`  ${c.hex}: CMYK ${c.cmyk.join("/")} -> ${c.kembali}, dE2000 ${c.de2000}`);

// ════════════════════════════════════════════════════════════════════════════
// A. The three directions, each at 150 dpi, and the board
// ════════════════════════════════════════════════════════════════════════════
const NAMA_ARAH: Record<S.Arah, string> = { CLASSIC: "Classic", MODERN: "Modern", MINIMAL: "Minimal" };
const DESKRIPSI: Record<S.Arah, string> = {
  CLASSIC: "A centred axis. The heading carries the accent; the gold line runs the measure at the card's height; the issuer is centred under it. The composition schools already expect, without any of the ornament.",
  MODERN: "The card, narrowed: paper, the thin gold line, and the deep accent below it as a band that carries the issuer, exactly where the card carries the role and school. The statement sits on the line and grows upward.",
  MINIMAL: "Type, one gold line, the QR. The accent is only the heading. The least ink and the least colour; the most dependent on typography to be recognised.",
};
for (const a of S.ARAH) await lembarPng(sr(a, A), `A-${a.toLowerCase()}.png`, 150, RENDER);
await potret(halaman("A", `<div class="lembar" style="width:${3 * 105 + 16}mm">
<h1>A · Three directions: Classic, Modern, Minimal (academic sample)</h1>
<p class="sub">One grammar, three compositions; the names are the layouts the schema already has (certificate_templates.layout). Constant in all three: the gold line at the card's proportion (176 of 297 mm, as 32 of 53.98 on the card), the statement above it and the record below it, the same record block (date, number, verification, green QR), and «PINTAR SELALU» as a colophon at the foot. Shown at half size; every sheet is also a page of the A4 PDF at actual size.</p>
<div class="baris">${S.ARAH.map((a) => `<div style="width:105mm">${kecil(sr(a, A), 0.5)}<p class="ket"><b>${NAMA_ARAH[a]}</b> · ${DESKRIPSI[a]}</p></div>`).join("")}</div></div>`),
  "A-tiga-arah.png", { lebar: Math.ceil(mmPx(3 * 105 + 16 + 16)), skala: 2.4 });

// ════════════════════════════════════════════════════════════════════════════
// C. Academic and professional
// ════════════════════════════════════════════════════════════════════════════
await potret(halaman("C", `<div class="lembar" style="width:${3 * 105 + 16}mm">
<h1>C · The accent by learning context, never by role <span class="buka">(mapping for Yazid)</span></h1>
<p class="sub">Top: academic (a school's curriculum; courses.learning_context = ACADEMIC), starting from the Murid family plum ${AK}. Bottom: professional learning (PROFESSIONAL_DEVELOPMENT), starting from the Guru family sage ${PR}. Both from the card's approved palette, at the card's one lightness (OKLab L ${f3(oklch(AK)[0])} and ${f3(oklch(PR)[0])}), so neither context is louder and in greyscale they are the same grey. No other role colour is used, and nothing else changes: one grammar.</p>
<div class="baris">${S.ARAH.map((a) => `<div style="width:105mm">${kecil(sr(a, A), 0.5)}<p class="ket"><b>${NAMA_ARAH[a]} · academic</b> · ${AK}</p></div>`).join("")}</div>
<div class="baris">${S.ARAH.map((a) => `<div style="width:105mm">${kecil(sr(a, P), 0.5)}<p class="ket"><b>${NAMA_ARAH[a]} · professional</b> · ${PR}</p></div>`).join("")}</div>
<p class="ket" style="max-width:250mm"><b>What the colour does not do.</b> It does not say which context the certificate is in (colour is never needed to understand it; the course title says what was learned), it does not rank the two, and it is not the holder's role: the colour follows the course, not the person, so a Guru's academic certificate would be plum, and a certificate for a professional-development course sage, whoever holds it. <span class="buka">Two cautions for Yazid:</span> the plum and sage are the Murid and Guru card colours, so a reader who knows the cards may read them as roles; the sage band sits beside the QR's PINTAR green on a professional certificate, two greens ${sageHijau.oklab.toFixed(3)} apart (README §G); and on the wall (I) a sage band is close to an ordinary institutional green from 6 m, where the plum is not. Plum carries recognition better than sage.</p></div>`),
  "C-konteks.png", { lebar: Math.ceil(mmPx(3 * 105 + 16 + 16)), skala: 2.4 });

// ════════════════════════════════════════════════════════════════════════════
// D. Photo · E. Logo
// ════════════════════════════════════════════════════════════════════════════
await potret(halaman("D", `<div class="lembar" style="width:${2 * 126 + 8}mm">
<h1>D · Photo: Version A without (canonical), Version B with a placeholder <span class="buka">(Yazid's decision; not implemented)</span></h1>
<p class="sub">Modern, academic, at 60%. Version B places a 30 × 40 mm (3 × 4) photo top-right, level with the heading, on paper and inside the margins; the statement keeps its full measure below it. The placeholder is marked «FOTO — CONTOH»; no photo is ever invented.</p>
<div class="baris"><div style="width:126mm">${kecil(sr("MODERN", A), 0.6)}<p class="ket"><b>A · without</b>: complete as it is. The certificate states what was achieved; the verification page confirms the certificate, and neither needs a face.</p></div>
<div style="width:126mm">${kecil(sr("MODERN", A, { foto: true }), 0.6)}<p class="ket"><b>B · with a placeholder</b>: it fits without moving anything else.</p></div></div>
<p class="ket" style="max-width:250mm"><b>Why A is recommended.</b> Most holders are minors (Murid); a printed, shareable sheet with a child's photograph travels further than any screen. The snapshot already records a photo reference at issuance (photo_path and its hash, INV-30), but certificate_templates allows only NAME_ONLY (OD-10 unanswered), and the verification page never shows a photo («Nama pemegang tertera pada sertifikatnya»). A photo adds identity-checking value only where someone compares a face with a face, which is not how a PINTAR certificate is verified; and on A4 a face turns the certificate towards the ID card, which the brief warns against. If Yazid wants B, it needs: an answer to OD-10 and the NAME_ONLY constraint lifted; consent rules for minors; the snapshot's photo file kept as long as the certificate exists (the snapshot holds a path and a hash, not the image); and the verification page unchanged (still no photo).</p></div>`),
  "D-foto.png", { lebar: Math.ceil(mmPx(2 * 126 + 8 + 16 + 16)), skala: 2.4 });
await potret(halaman("E", `<div class="lembar" style="width:${2 * 126 + 8}mm">
<h1>E · School logo: without (canonical) and with a hypothetical logo <span class="buka">(Yazid's decision; not implemented)</span></h1>
<p class="sub">Modern, academic, at 60%. The canonical design is complete without a logo. The study places «LOGO SEKOLAH — CONTOH» (a hypothetical, marked so; Q-7 keeps any placeholder mark out of the product) top-left on paper, above the heading.</p>
<div class="baris"><div style="width:126mm">${kecil(sr("MODERN", A), 0.6)}<p class="ket"><b>Without</b>: the issuer is named in the band, «Diterbitkan oleh» and the school, in type.</p></div>
<div style="width:126mm">${kecil(sr("MODERN", A, { logo: true }), 0.6)}<p class="ket"><b>With (hypothetical)</b>: an 18 mm mark, top-left; the heading moves down 24 mm; nothing else moves.</p></div></div>
<p class="ket" style="max-width:250mm"><b>Why the logo is not on the band</b>, where the school's name is: a school's logo has its own colours and would sit on the plum or sage, or need a white patch, which is a pasted look. On paper, top-left, it reads as the issuer's mark without taking the band's job. <b>What a logo costs:</b> it is a file PINTAR would store and print for every school, at print quality, in colours PINTAR does not control; a low-resolution or badly cropped logo is the most common way a certificate starts to look unofficial. The certificate reads as the school's without it, because the school is the only issuer named.</p></div>`),
  "E-logo.png", { lebar: Math.ceil(mmPx(2 * 126 + 8 + 16 + 16)), skala: 2.4 });

// ════════════════════════════════════════════════════════════════════════════
// F. Typography, and the stress cases
// ════════════════════════════════════════════════════════════════════════════
{
  const CONTOH: Record<string, string> = {
    merek: "PINTAR SELALU", jenis: KATA.jenis, nama: A.nama, diberikan: KATA.diberikan, kursus: "Matematika · Bab 4", label: KATA.tanggal,
    predikat: "Sangat Baik", sekolah: A.sekolah, tanggal: TGL, nomor: A.nomor, periksa: KATA.periksa, arti: "Pindai kode ini atau buka tautannya.", tautan: URL5.slice(0, 41),
  };
  const WARNA_CONTOH: Record<string, string> = { merek: W.hijau, jenis: AK, diberikan: W.tinta2, label: W.tinta3, arti: W.tinta2, tautan: W.tinta2 };
  const baris = Object.entries(S.GAYA).filter(([k]) => k !== "kecil").map(([k, g]) => {
    const pt = g.pt;
    return `<tr><td><b>${g.peran}</b></td><td style="background:#fff;padding:1.4mm 2mm;max-width:120mm;overflow:hidden"><span class="sr" style="display:block;overflow:visible"><span class="s-${k}" style="display:block;color:${WARNA_CONTOH[k] ?? W.tinta};white-space:nowrap">${S.esc(CONTOH[k])}</span></span></td>
<td>${g.huruf} ${g.berat}</td><td>${pt} pt</td><td>${g.tangga}</td><td>${g.baris}</td><td>${g.spasi} em${g.kapital ? ", caps" : ""}${g.kata ? `; words +${g.kata} em` : ""}</td><td>${g.warna}</td><td>${tinggiKapital(g).toFixed(2)} mm</td></tr>`;
  }).join("");
  const stres = ["panjang", "ekstrem", "pendek", "apostrof"] as const;
  const kode = (d: S.Data) => d.nomor.split("/")[1].length;
  const [pj, ek] = [SAMPEL.panjang, SAMPEL.ekstrem];
  const KET_STRES: Record<string, string> = {
    panjang: `<b>Long</b>: a ${pj.nama.length}-character name (two lines), a ${pj.kursus.length}-character course (three), a ${pj.sekolah.length}-character school (one line on the band), a ${kode(pj)}-character school code (the number takes four lines, breaking only after its own «/» and «-»).`,
    ekstrem: `<b>Beyond realistic</b>: a ${ek.nama.length}-character name (three lines, the limit), a ${ek.kursus.length}-character course (four), a ${ek.sekolah.length}-character school (two lines; the band grows downward), a ${kode(ek)}-character school code (the schema's maximum is 63). Predikat «Perlu Pendampingan», the longest value (README: is it reachable?).`,
    pendek: "<b>Short</b>: a one-word name, a short course. Nothing stretches to fill: the space stays empty, as on the card.",
    apostrof: "<b>Apostrophe, professional</b>: Nur'aini, shown as recorded.",
  };
  await potret(halaman("F", `<div class="lembar" style="width:${4 * 84 + 24}mm">
<h1>F · Typography: two families, three weights</h1>
<p class="sub">Plus Jakarta Sans 400/600 and IBM Plex Mono 500 for identifiers: the app's own OFL files, the card's families. Samples at actual size (this render is 2.5×). Every size that can be a step of the app's token ladder is one (the sheet renders at 96 dpi, so 1 pt = 1.333 px; PINTAR-DESIGN-SKILL-SPEC §6, "named rather than free"); three print-only sizes sit below the screen ladder and are flagged. The smallest are the 7 pt capital labels and colophon (cap height ${tinggiKapital(S.GAYA.label).toFixed(2)} mm) and the 7 pt printed link. «Cap height» is the height of a capital on paper, from the fonts' own metrics (Plus Jakarta Sans 0.745 em, IBM Plex Mono 0.698 em).</p>
<table class="spek"><tr><th>Style</th><th>Sample (actual size)</th><th>Typeface</th><th>Size</th><th>Ladder step</th><th>Line</th><th>Tracking</th><th>Colour</th><th>Cap height</th></tr>${baris}</table>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:6mm;max-width:${4 * 84 + 8}mm">
<p class="ket" style="margin:0"><b>«PINTAR SELALU»</b> is set in type, as on the card: Plus Jakarta Sans 600, 7 pt, capitals, tracking 0.16 em and word space +0.12 em, PINTAR green. On the certificate it moves from the card's header to the foot, as a colophon: the smallest style on the sheet, away from the issuer (named in the band) and from where a signature would stand, with no verb («oleh», «didukung», «bersama») that could make it a party to the certificate. It is the only place PINTAR is named in words, apart from the number's own prefix («PINTAR/…») and, in production, the link's host.</p>
<p class="ket" style="margin:0"><b>Rules.</b> The name, the course and the school are never shrunk and never cut: they wrap at a word. The statement sits on the gold line and grows upward into the empty paper; the band grows downward; the record's top never moves. Identifiers break only after their own «/» (the number keeps «2026/00042» whole; a school code too long for a line breaks after its own «-») and the link after «/verifikasi/», so its 43-character code is one line. Nothing is inserted: no hyphen appears that is not in the text. Name limit: three lines at 33 pt, which holds a 68-character name.</p></div>
<h2 style="margin-top:7mm">Stress cases (40%)</h2>
<div class="baris">${stres.map((k) => `<div style="width:84mm">${kecil(sr("MODERN", SAMPEL[k]), 0.4)}<p class="ket">${KET_STRES[k]}</p></div>`).join("")}</div>
<div class="baris">${(["CLASSIC", "MINIMAL"] as S.Arah[]).map((a) => `<div style="width:84mm">${kecil(sr(a, SAMPEL.panjang), 0.4)}<p class="ket"><b>${NAMA_ARAH[a]}, long</b>.</p></div>`).join("")}
<div style="width:84mm">${kecil(sr("CLASSIC", SAMPEL.ekstrem), 0.4)}<p class="ket"><b>Classic, beyond realistic</b>: the centred statement has less room than the others (it starts below the heading).</p></div></div></div>`),
    "F-tipografi.png", { lebar: Math.ceil(mmPx(4 * 84 + 24 + 16 + 16)), skala: 2.5 });
}

// ════════════════════════════════════════════════════════════════════════════
// G. The accent and the gold: swatches, and the line at a distance
// ════════════════════════════════════════════════════════════════════════════
const LEBAR_GARIS = [0.5, 0.75, 1.0, 1.5];
const JARAK_GARIS = [0.5, 1, 2, 4];
type HasilJauh = { lembar: Array<{ kode: string; jarak: number; png: string }>; garis: Array<{ nama: string; lebar: number; abu: boolean; jarak: Record<string, number> }> };
let garisJauh: HasilJauh["garis"] = [];
{
  const kasus: Array<Record<string, unknown>> = [];
  for (const arah of ["MODERN", "MINIMAL"] as S.Arah[]) {
    for (const abu of [false, true]) {
      const tanpa = await lembarPng(sr(arah, A, { garisMm: 0, abu, kertas: "" }), `g-${arah}-${abu}-0.png`, 300);
      for (const w of LEBAR_GARIS) {
        const dengan = await lembarPng(sr(arah, A, { garisMm: w, abu, kertas: "" }), `g-${arah}-${abu}-${w}.png`, 300);
        kasus.push({ nama: `${NAMA_ARAH[arah]}${abu ? " greyscale" : ""} ${w} mm`, lebar: w, abu, dengan, tanpa, px_mm: 300 / 25.4, y_mm: S.TATA.garis, x_mm: [130, 184], jarak: JARAK_GARIS, arah });
      }
    }
  }
  writeFileSync(join(KERJA, "garis.json"), JSON.stringify({ garis: kasus }));
  garisJauh = (JSON.parse(py("jauh", join(KERJA, "garis.json"))) as HasilJauh).garis;
  catat("");
  catat("THE GOLD LINE AT A DISTANCE (peak OKLab difference the line makes, row by row across it, at the eye's resolution at each distance; about 0.02 just noticeable, 0.05 plainly visible)");
  for (const g of garisJauh) catat(`  ${g.nama}: ${JARAK_GARIS.map((d) => `${d} m ${g.jarak[String(d)]}`).join(", ")}`);
}
{
  const nilai = (arah: string, w: number, abu: boolean, d: number) => garisJauh.find((g) => g.nama === `${arah}${abu ? " greyscale" : ""} ${w} mm`)!.jarak[String(d)];
  const sel = (v: number) => `<td style="${v < 0.02 ? "color:#8C3B3B;font-weight:600" : v < 0.05 ? "color:#8A5F00" : ""}">${v.toFixed(3)}</td>`;
  const tabelGaris = (arah: string, abu: boolean) => `<table class="spek"><tr><th>Width</th>${JARAK_GARIS.map((d) => `<th>${d} m</th>`).join("")}</tr>${LEBAR_GARIS.map((w) => `<tr><td><b>${w.toFixed(2)} mm</b>${w === S.GARIS_MM ? " (card)" : ""}</td>${JARAK_GARIS.map((d) => sel(nilai(arah, w, abu, d))).join("")}</tr>`).join("")}</table>`;
  // crops at actual size: the seam (Modern) and the line (Minimal), 600 dpi
  const potong = async (arah: S.Arah, abu: boolean) => {
    const f = await potret(halaman("crop", `<div style="position:relative;width:70mm;height:22mm;overflow:hidden;background:#fff"><div style="position:absolute;left:-128mm;top:-${S.TATA.garis - 11}mm">${sr(arah, A, { abu, kertas: "" })}</div></div>`, "body{background:#fff}"), `G-crop-${arah}-${abu}.png`, { lebar: 400, skala: 600 / 96, elemen: "body > div", ke: KERJA });
    return `<img src="file://${f}" style="width:70mm;display:block;border:0.2mm solid rgba(31,42,51,.15)">`;
  };
  const sw = (hex: string, nama: string, teks = "") => `<div style="width:40mm"><div style="height:14mm;border-radius:1mm;background:${hex};${hex === PUTIH ? "border:0.2mm solid #ccc;" : ""}"></div><p class="ket"><b>${nama}</b><br>${hex} · OKLCH ${lch(hex)}<br>grey ${S.abuHex(hex)}${teks}</p></div>`;
  const cm = (hex: string) => cmyk.find((c) => c.hex === hex)!;
  await potret(halaman("G", `<div class="lembar" style="width:250mm">
<h1>G · The accent and the warm-gold line</h1>
<p class="sub">Nothing new: the two accents are the card's approved Murid and Guru colours, the line is the card's ${W.emas} at the card's 0.75 mm, the QR is PINTAR green. The line is drawn as a vector rectangle, not a CSS background, so a browser prints it even with «Background graphics» off; the band is a background marked print-color-adjust: exact (the PDF in J was made with background graphics off, and both are in it).</p>
<div class="baris">${sw(AK, "Academic accent", `<br>paper on it ${f2(S.rasio(W.kertas, AK))}:1 · CMYK ${cm(AK).cmyk.join("/")}, shift dE ${cm(AK).de2000}`)}${sw(PR, "Professional accent", `<br>paper on it ${f2(S.rasio(W.kertas, PR))}:1 · CMYK ${cm(PR).cmyk.join("/")}, shift dE ${cm(PR).de2000}`)}${sw(W.emas, "Warm-gold line", `<br>on white ${f2(S.rasio(W.emas, PUTIH))}:1, on plum ${f2(S.rasio(W.emas, AK))}:1, on sage ${f2(S.rasio(W.emas, PR))}:1 · CMYK ${cm(W.emas).cmyk.join("/")}, shift dE ${cm(W.emas).de2000}`)}${sw(W.hijau, "PINTAR green (QR, colophon)", `<br>on white ${f2(S.rasio(W.hijau, PUTIH))}:1 · shift dE ${cm(W.hijau).de2000}`)}${sw(PUTIH, "Paper (print)", "<br>never printed: the stock")}</div>
<h2>Where the gold goes: it owns the composition's one division</h2>
<p class="ket" style="max-width:240mm;margin-top:0">Of the brief's three ways for the line to own the composition (a single rule, a meeting with the accent, a recurring edge or alignment), each direction takes one: <b>Classic and Minimal</b> a single rule across the measure; <b>Modern</b> the meeting, the line lying on the band's top edge exactly as it lies on the card's colour field. In all three it sits at the card's height (59.3%), which is the recurring alignment across the family: a card and a certificate side by side divide at the same proportion. No metallic effect, foil, gradient or frame, and never more than one line.</p>
<div class="baris" style="margin-top:3mm">${await potong("MODERN", false)}${await potong("MODERN", true)}${await potong("MINIMAL", false)}${await potong("MINIMAL", true)}</div>
<p class="ket" style="margin-top:-5mm">Actual size (70 × 22 mm at 600 dpi): Modern's seam in colour and greyscale; Minimal's line in colour and greyscale.</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:4mm">
<div><h2>Modern: the line on the band, from a distance</h2>${tabelGaris("Modern", false)}<p class="ket">Greyscale:</p>${tabelGaris("Modern", true)}</div>
<div><h2>Minimal: the line on paper, from a distance</h2>${tabelGaris("Minimal", false)}<p class="ket">Greyscale:</p>${tabelGaris("Minimal", true)}</div></div>
<p class="ket" style="max-width:240mm">Peak OKLab difference the line makes against the same sheet without it, at the resolution an eye has at each distance (one arc-minute); amber below 0.05 (weak), red below 0.02 (not noticeable). <b>The line survives distance:</b> at every width tested it is still there at 4 m (lowest value ${Math.min(...garisJauh.flatMap((g) => Object.values(g.jarak))).toFixed(3)}; at the card's 0.75 mm never below ${Math.min(...garisJauh.filter((g) => g.lebar === S.GARIS_MM).flatMap((g) => Object.values(g.jarak))).toFixed(3)}), in colour and in greyscale. So width is a question of character, not visibility: 0.5 mm reads as an edge, 1.5 mm as a stripe, <b>0.75 mm, the card's, as structure (recommended; one signature, one width across the family, and it follows whatever the card's physical proof decides)</b>. What the line cannot do alone is make a sheet recognisable, because a thin rule is what many certificates have (I): on Modern it is the band's edge that makes the pair PINTAR's. <b>Does the gold deserve broader status?</b> The certificate supports it as the artifact signature (card and certificate, always structural, always one line); nothing here argues for it as a general UI accent.</p></div>`),
    "G-aksen-emas.png", { lebar: Math.ceil(mmPx(250 + 16 + 16)), skala: 3 });
}

// ════════════════════════════════════════════════════════════════════════════
// J. The A4 PDF at 100% (made with «Background graphics» off)
// ════════════════════════════════════════════════════════════════════════════
type Hal = { judul: string; html: string; qr?: { url: string; m: number[][]; ubin?: boolean; kode: string } };
const cetakan = (arah: S.Arah, d: S.Data, o: S.Opsi = {}) => sr(arah, d, { kertas: "", ...o });
const HALAMAN: Hal[] = [
  { judul: "Modern · akademik (usulan)", html: cetakan("MODERN", A), qr: { url: URL5, m: M5, kode: "modern-a" } },
  { judul: "Modern · pengembangan profesi", html: cetakan("MODERN", P), qr: { url: URL5, m: M5, kode: "modern-p" } },
  { judul: "Classic · akademik", html: cetakan("CLASSIC", A), qr: { url: URL5, m: M5, kode: "classic-a" } },
  { judul: "Minimal · akademik", html: cetakan("MINIMAL", A), qr: { url: URL5, m: M5, kode: "minimal-a" } },
  { judul: "Classic · pengembangan profesi", html: cetakan("CLASSIC", P) },
  { judul: "Minimal · pengembangan profesi", html: cetakan("MINIMAL", P) },
  { judul: "Modern · teks panjang", html: cetakan("MODERN", SAMPEL.panjang) },
  { judul: "Modern · melampaui kenyataan", html: cetakan("MODERN", SAMPEL.ekstrem) },
  { judul: "Modern · nama satu kata", html: cetakan("MODERN", SAMPEL.pendek) },
  { judul: "Modern · versi B, dengan foto (contoh)", html: cetakan("MODERN", A, { foto: true }) },
  { judul: "Modern · dengan logo sekolah (contoh)", html: cetakan("MODERN", A, { logo: true }) },
  { judul: "Modern · skala abu-abu", html: cetakan("MODERN", A, { abu: true }), qr: { url: URL5, m: M5, kode: "modern-abu" } },
  { judul: "Kajian QR · modul di atas ubin hijau muda", html: cetakan("MODERN", A, { ubin: true }), qr: { url: URL5, m: M5, ubin: true, kode: "ubin" } },
  { judul: "Kajian QR · tautan versi 6", html: cetakan("MODERN", { ...A, url: URL6, matriks: M6 }), qr: { url: URL6, m: M6, kode: "versi-6" } },
];
const JUMLAH = HALAMAN.length + 1;
py("huruf", join(AKAR, "public/fonts/plus-jakarta-sans-latin.woff2"), KERJA);
const sampul = `<div class="a4" style="position:relative;width:210mm;height:297mm;overflow:hidden;background:#fff;page-break-after:always;font-family:'Plus Jakarta Sans';color:${W.tinta}">
<div style="position:absolute;left:24mm;top:24mm;width:162mm">
<p style="margin:0;font:600 13pt 'Plus Jakarta Sans'">Sertifikat PINTAR · putaran 1 · A4</p>
<p style="margin:3mm 0 0;font:600 10pt 'Plus Jakarta Sans'">Cetak pada 100% («Ukuran sebenarnya»). Jangan pilih «Sesuaikan dengan halaman».</p>
<p style="margin:1mm 0 0;font:400 8.5pt 'Plus Jakarta Sans';color:${W.tinta2}">Print at 100% (Actual size); no fit-to-page. This PDF was made with «Background graphics» off, as a browser's print dialog opens.</p>
<p style="margin:6mm 0 2mm;font:600 8.5pt 'Plus Jakarta Sans'">Periksa skala · check the scale</p>
<div style="position:relative;width:100mm;height:4mm;border-bottom:0.2mm solid #000">${[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((x) => `<div style="position:absolute;left:${x - 0.1}mm;bottom:0;width:0;height:${x % 50 ? 2 : 4}mm;border-left:0.2mm solid #000"></div>`).join("")}</div>
<p style="margin:1mm 0 0;font:400 7.5pt 'Plus Jakarta Sans';color:${W.tinta2}">0 — 50 — 100 mm. Jika garis ini bukan tepat 100 mm, pencetak mengubah skala. (Garis dan tanda skala digambar sebagai garis tepi, bukan latar: latar tidak tercetak bila «Grafik latar» mati.)</p>
<div style="margin-top:5mm;width:50mm;height:50mm;border:0.2mm solid #000;box-sizing:border-box;display:flex;align-items:center;justify-content:center"><p style="margin:0;font:400 7.5pt 'Plus Jakarta Sans';color:${W.tinta2}">50 × 50 mm</p></div>
<p style="margin:8mm 0 2mm;font:600 8.5pt 'Plus Jakarta Sans'">Isi · contents</p>
<ol style="margin:0;padding-left:5mm;font:400 8.5pt/1.6 'Plus Jakarta Sans'" start="2">${HALAMAN.map((h) => `<li>${h.judul}</li>`).join("")}</ol>
<p style="margin:8mm 0 0;font:400 7.5pt/1.5 'Plus Jakarta Sans';color:${W.tinta2}">Halaman 2–${JUMLAH} adalah sertifikat persis seperti tercetak, tanpa catatan apa pun di lembarnya. Semua nama, sekolah, nomor dan tautan di sini contoh rekaan; QR membuka https://contoh.pintar.invalid/…, alamat yang tidak pernah ada. Uji: pindai QR dengan ponsel dari jarak 20–40 cm; lihat lembar dari 2 m; tutup «PINTAR SELALU» dengan jari.</p></div></div>`;
const htmlA4 = halaman("Sertifikat PINTAR · putaran 1 · A4 100%", `<div style="zoom:10">${sampul}${HALAMAN.map((h) => `<div class="a4" style="width:210mm;height:297mm;overflow:hidden;background:#fff;page-break-after:always">${h.html}</div>`).join("")}</div>`,
  `@page { size: A4; margin: 0; } body { background: #fff; } .a4:last-child { page-break-after: auto; }`, KERJA);
const PDF = join(RENDER, "J-A4-100persen.pdf");
{
  const f = join(KERJA, "J-A4.html");
  writeFileSync(f, htmlA4);
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: PDF, width: "210mm", height: "297mm", scale: 0.1, printBackground: false, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
  await ctx.close();
}

// ════════════════════════════════════════════════════════════════════════════
// Checks on the rendered sheets
// ════════════════════════════════════════════════════════════════════════════
{
  const semua: Array<{ nama: string; html: string; foto?: boolean; logo?: boolean; uji?: boolean }> = [
    ...S.ARAH.flatMap((a) => [A, P].map((d) => ({ nama: `${NAMA_ARAH[a]} ${d.konteks}`, html: sr(a, d) }))),
    ...S.ARAH.flatMap((a) => (["panjang", "ekstrem", "pendek", "apostrof"] as const).map((k) => ({ nama: `${NAMA_ARAH[a]} ${k}`, html: sr(a, SAMPEL[k]) }))),
    ...S.ARAH.flatMap((a) => [{ nama: `${NAMA_ARAH[a]} photo`, html: sr(a, A, { foto: true }), foto: true }, { nama: `${NAMA_ARAH[a]} logo`, html: sr(a, A, { logo: true }), logo: true }, { nama: `${NAMA_ARAH[a]} photo, long${a === "CLASSIC" ? " (probe)" : ""}`, html: sr(a, SAMPEL.panjang, { foto: true }), foto: true, uji: a === "CLASSIC" }, { nama: `${NAMA_ARAH[a]} photo, beyond realistic (probe)`, html: sr(a, SAMPEL.ekstrem, { foto: true }), foto: true, uji: true }]),
    { nama: "Classic with the band", html: sr("CLASSIC", A, { pita: true }) }, { nama: "Classic with the band, long", html: sr("CLASSIC", SAMPEL.ekstrem, { pita: true }) },
    { nama: "Modern, version 6", html: sr("MODERN", { ...A, url: URL6, matriks: M6 }) },
  ];
  const f = join(KERJA, "cek.html");
  writeFileSync(f, halaman("cek", `<div style="display:flex;flex-wrap:wrap;gap:10mm;padding:10mm">${semua.map((x) => `<div data-nama="${S.esc(x.nama)}">${x.html}</div>`).join("")}</div>`));
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
  const p = await ctx.newPage();
  await p.addInitScript("window.__name = (f) => f"); // tsx keeps function names with a helper the page does not have
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  const hasil = await p.evaluate(({ px, garis, tenang, qrMm }: { px: number; garis: number; tenang: number; qrMm: number }) => {
    // «(probe)» sheets are limit-finders: their findings are reported, not counted
    const masalah: string[] = [];
    const baris: Record<string, number[]> = { nama: [], kursus: [], sekolah: [], nomor: [] };
    const teks: Record<string, string> = {};
    document.querySelectorAll<HTMLElement>("[data-nama]").forEach((bungkus) => {
      const nama = bungkus.dataset.nama!;
      const lembar = bungkus.querySelector(".sr")!.getBoundingClientRect();
      const kotak = (r: DOMRect) => ({ x0: (r.left - lembar.left) / px, y0: (r.top - lembar.top) / px, x1: (r.right - lembar.left) / px, y1: (r.bottom - lembar.top) / px });
      const tinta = (el: Element) => { const rg = document.createRange(); rg.selectNodeContents(el); return kotak(rg.getBoundingClientRect()); };
      const q = (sel: string) => bungkus.querySelector(sel);
      // 1 · print margin: all ink at least 10 mm from every edge (the band 12 mm)
      bungkus.querySelectorAll(".sr p, .sr-kode svg path, .sr-foto, .sr-logo").forEach((el) => {
        const b = el.tagName === "P" ? tinta(el) : kotak(el.getBoundingClientRect());
        if (b.x0 < 9.9 || b.y0 < 9.9 || b.x1 > 200.1 || b.y1 > 287.1) masalah.push(`${nama}: ${(el.textContent ?? el.getAttribute("class") ?? "").slice(0, 30)} within 10 mm of the edge`);
      });
      const pita = q(".sr-pita");
      if (pita) { const b = kotak(pita.getBoundingClientRect()); if (b.x0 < 11.9 || b.x1 > 198.1) masalah.push(`${nama}: the band within 12 mm of the edge`); }
      // 2 · the statement: on paper above the line, clear of the heading, photo and logo
      const pern = tinta(q(".sr-pernyataan")!);
      const garisAtas = kotak(q(".sr-garis")!.getBoundingClientRect()).y0;
      if (pern.y1 > garisAtas - 9.9) masalah.push(`${nama}: the statement ends ${(garisAtas - pern.y1).toFixed(1)} mm above the line`);
      for (const sel of [".s-jenis", ".sr-foto", ".sr-logo"]) {
        const el = q(sel); if (!el) continue;
        const b = el.tagName === "P" ? tinta(el) : kotak(el.getBoundingClientRect());
        bungkus.querySelectorAll(".sr-pernyataan p").forEach((pp) => {
          const t = tinta(pp);
          const tumpang = t.x0 < b.x1 && t.x1 > b.x0 && t.y0 < b.y1 + 5 && t.y1 > b.y0;
          if (tumpang) masalah.push(`${nama}: «${(pp.textContent ?? "").slice(0, 20)}» within 5 mm of ${sel}`);
        });
      }
      // 3 · below the line: the band or the issuer clear of the record; the record clear of the colophon
      const bawahPenerbit = pita ? kotak(pita.getBoundingClientRect()).y1 : tinta(q(".sr-penerbit")!).y1;
      const rekam = kotak(q(".sr-rekam")!.getBoundingClientRect());
      if (bawahPenerbit > rekam.y0 - 10) masalah.push(`${nama}: issuer ends ${(rekam.y0 - bawahPenerbit).toFixed(1)} mm above the record`);
      const kaki = tinta(q(".s-merek")!);
      const bawahRekam = Math.max(tinta(q(".sr-fakta")!).y1, tinta(q(".sr-periksa")!).y1, kotak(q(".sr-kode svg")!.getBoundingClientRect()).y1);
      if (bawahRekam > kaki.y0 - 4) masalah.push(`${nama}: the record ends ${(kaki.y0 - bawahRekam).toFixed(1)} mm above the colophon`);
      // 4 · the QR's quiet zone (the svg's own box, symbol + 4 modules) touches nothing
      const zona = kotak(q(".sr-kode svg")!.getBoundingClientRect());
      bungkus.querySelectorAll(".sr p").forEach((pp) => {
        const t = tinta(pp);
        if (t.x0 < zona.x1 && t.x1 > zona.x0 && t.y0 < zona.y1 && t.y1 > zona.y0) masalah.push(`${nama}: «${(pp.textContent ?? "").slice(0, 20)}» inside the QR's quiet zone`);
      });
      const modul = (zona.x1 - zona.x0) / ((q(".sr-kode svg")!.getAttribute("viewBox")!.split(" ").map(Number)[2]));
      if (Math.abs((zona.x1 - zona.x0) - modul * (qrMm / modul + 2 * tenang)) > 0.05) masalah.push(`${nama}: quiet zone is not ${tenang} modules`);
      // 5 · no text crosses the line
      bungkus.querySelectorAll(".sr p").forEach((pp) => { const t = tinta(pp); if (t.y0 < garis && t.y1 > garis) masalah.push(`${nama}: «${(pp.textContent ?? "").slice(0, 20)}» crosses the line`); });
      // 6 · line counts
      const hitung = (sel: string) => { const el = q(sel) as HTMLElement | null; if (!el) return 0; return Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)); };
      baris.nama.push(hitung(".s-nama")); baris.kursus.push(hitung(".s-kursus")); baris.sekolah.push(hitung(".s-sekolah")); baris.nomor.push(hitung(".s-nomor"));
      teks[nama] = (bungkus.querySelector(".sr") as HTMLElement).innerText;
    });
    return { masalah, baris, teks };
  }, { px: 96 / 25.4, garis: S.TATA.garis, tenang: S.TENANG, qrMm: S.QR_MM });
  catat("");
  catat(`LAYOUT CHECKS on ${semua.length} sheets (all three directions × two contexts, four stress cases each, photo, logo, photo with the longest text, Classic with the band, version 6):`);
  const nyata = hasil.masalah.filter((m) => !m.includes("(probe)")), batas = hasil.masalah.filter((m) => m.includes("(probe)"));
  catat(`  print margin (all ink ≥ 10 mm from the edge; the band ≥ 12 mm), statement ≥ 10 mm above the line and ≥ 5 mm clear of heading/photo/logo, issuer ≥ 10 mm above the record, record ≥ 4 mm above the colophon, nothing in the QR's 4-module quiet zone, no text across the line: ${nyata.length ? `${nyata.length} PROBLEM(S)` : `all pass on the ${semua.filter((x) => !x.uji).length} sheets that count`}`);
  for (const m of nyata) catat(`    ${m}`);
  catat(`  PROBES (reported, not counted; they find the limits): ${batas.length ? batas.join("; ") : "none reached"}`);
  gagal += nyata.length;
  catat(`  lines: name ${Math.min(...hasil.baris.nama)}–${Math.max(...hasil.baris.nama)} (limit 3); course ${Math.min(...hasil.baris.kursus)}–${Math.max(...hasil.baris.kursus)}; school ${Math.min(...hasil.baris.sekolah)}–${Math.max(...hasil.baris.sekolah)}; number ${Math.min(...hasil.baris.nomor)}–${Math.max(...hasil.baris.nomor)}`);
  if (Math.max(...hasil.baris.nama) > 3) gagal++;
  // required words, once each; forbidden words, never
  const WAJIB = [KATA.jenis.toUpperCase(), KATA.diberikan, KATA.predikat.toUpperCase(), KATA.tanggal.toUpperCase(), KATA.nomor.toUpperCase(), KATA.penerbit.toUpperCase(), KATA.periksa, KATA.arti, "PINTAR SELALU"];
  const TERLARANG = ["skor", "nilai", "score", "tanda tangan", "ttd", "stempel", "cap", "segel", "resmi", "official", "sah", "identitas", "diverifikasi oleh", "didukung", "bekerja sama", "powered"];
  let kurang = 0, kena: string[] = [];
  for (const [nama, tx] of Object.entries(hasil.teks)) {
    for (const w of WAJIB) { const n = tx.split(w).length - 1; if (n !== 1) { kurang++; catat(`    ${nama}: «${w}» appears ${n} times`); } }
    const angka = tx.match(/\d+([.,]\d+)?\s*%|0[.,]\d{2}/g);
    if (angka) kena.push(`${nama}: a score-like number ${angka.join(", ")}`);
    for (const w of TERLARANG) if (new RegExp(`(?<![\\p{L}\\p{N}])${w}(?![\\p{L}\\p{N}])`, "iu").test(tx)) kena.push(`${nama}: «${w}»`);
    if (/FOTO/i.test(tx) !== !!semua.find((x) => x.nama === nama)!.foto) kena.push(`${nama}: photo placeholder where none was asked, or missing`);
  }
  catat(`  required, exactly once on every sheet (heading, «telah menuntaskan», Predikat, Tanggal terbit, Nomor sertifikat, Diterbitkan oleh, Periksa keaslian and its sentence, «PINTAR SELALU»): ${kurang ? `${kurang} MISSING OR REPEATED` : "all present, once"}`);
  catat(`  absent (score, signature, stamp or seal words, «resmi/official/sah», identity claims, co-issuer verbs; a photo except in Version B): ${kena.length ? `FOUND: ${kena.join("; ")}` : "none found"}`);
  const kontrol = TERLARANG.filter((w) => new RegExp(`(?<![\\p{L}\\p{N}])${w}(?![\\p{L}\\p{N}])`, "iu").test("Sertifikat resmi, skor 93%, tanda tangan kepala sekolah"));
  catat(`    control (planted «resmi … skor … tanda tangan»): caught ${kontrol.join(", ") || "NOTHING"}`);
  gagal += kurang + kena.length + (kontrol.length ? 0 : 1);
  await ctx.close();
}

// ════════════════════════════════════════════════════════════════════════════
// The PDF measured; the QR decoded from it
// ════════════════════════════════════════════════════════════════════════════
const geometri = JSON.parse(py("a4", PDF)) as { halaman: number; ukuran_mm: number[]; per_halaman: Array<Array<[string, number, number, number, number]>>; fonts: string[] };
catat("");
catat(`PDF: ${geometri.halaman} pages, set to ${geometri.ukuran_mm.join(" × ")} mm. Fonts embedded: ${geometri.fonts.join(", ")}. Made with «Background graphics» off.`);
if (geometri.halaman !== JUMLAH || Math.abs(geometri.ukuran_mm[0] - 210) > 0.01 || Math.abs(geometri.ukuran_mm[1] - 297) > 0.01) gagal++;
if (geometri.fonts.some((f) => /Type3/.test(f))) { gagal++; catat("  a Type3 font is embedded"); }
const qrUkur: Record<string, { modul: number; sisi: number }> = {};
const dekat = (a: string, b: string) => [1, 3, 5].every((i) => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)) <= 2);
for (let i = 1; i < geometri.halaman; i++) {
  const h = HALAMAN[i - 1];
  const bentuk = geometri.per_halaman[i];
  const emas = bentuk.filter((b) => dekat(b[0], S.abuHex(W.emas)) || dekat(b[0], W.emas));
  const pita = bentuk.filter((b) => [AK, PR, S.abuHex(AK)].some((c) => dekat(b[0], c)) && b[4] > 8);
  const hijau = bentuk.filter((b) => (dekat(b[0], W.hijau) || dekat(b[0], S.abuHex(W.hijau))) && b[3] > 20);
  const garisOk = emas.length === 1 && Math.abs(emas[0][4] - S.GARIS_MM) < 0.02 && Math.abs(emas[0][2] + emas[0][4] / 2 - S.TATA.garis) < 0.05;
  const modern = h.judul.startsWith("Modern") || h.judul.startsWith("Kajian");
  const pitaOk = modern ? pita.length === 1 && Math.abs(pita[0][1] - S.TATA.pitaLuar) < 0.05 : pita.length === 0;
  const sisi = hijau.length ? hijau[0][3] : 0;
  const n = h.qr ? h.qr.m.length : (h.html.includes(URL6) ? M6.length : M5.length);
  qrUkur[h.judul] = { modul: sisi / n, sisi };
  const qrOk = hijau.length === 1 && Math.abs(sisi - S.QR_MM) < 0.1 && Math.abs(hijau[0][1] + sisi - (S.A4.w - S.TATA.tepi)) < 0.1;
  catat(`  page ${i + 1} ${h.judul}: gold line ${emas.map((b) => `${f2(b[3])} × ${f3(b[4])} mm, centre ${f2(b[2] + b[4] / 2)} mm`).join("; ") || "MISSING"}${modern ? `; band ${pita.map((b) => `${f2(b[3])} × ${f2(b[4])} mm at x ${f2(b[1])}`).join("; ") || "MISSING (background graphics off?)"}` : ""}; QR ${f2(sisi)} mm, module ${f3(sisi / n)} mm, right edge ${hijau.length ? f2(hijau[0][1] + sisi) : "?"} mm`);
  if (!garisOk || !pitaOk || !qrOk) { gagal++; catat("    ^ geometry differs from the grammar"); }
}
const manifest = {
  url: URL5, pdf: PDF,
  kasus: HALAMAN.flatMap((h, i) => {
    if (!h.qr) return [];
    const sisi = S.QR_MM, q = S.TENANG * sisi / h.qr.m.length;
    const x = S.A4.w - S.TATA.tepi - sisi, y = S.TATA.rekamAtas + 0.6;
    return [
      { kode: h.qr.kode, nama: `${h.judul} (QR crop)`, halaman: i + 1, kotak: [x - q, y - q, sisi + 2 * q, sisi + 2 * q], simpan: join(KERJA, `qr-${h.qr.kode}.png`), url: h.qr.url },
      { kode: `${h.qr.kode}·sheet`, nama: `${h.judul} (the whole sheet)`, halaman: i + 1, kotak: [0, 0, 210, 297], simpan: join(KERJA, `lembar-${h.qr.kode}.png`), sapu: false, url: h.qr.url },
    ];
  }),
};
// the decoder takes one link per manifest; version 6 runs on its own
const uji: Array<{ kode: string; nama: string; uji: Array<{ nama: string; zxing: boolean; opencv: boolean }>; batas?: Record<"zxing" | "opencv", { dpi: number | null; blur_px: number | null; kontras: number | null; miring: number | null }> }> = [];
for (const url of [URL5, URL6]) {
  const m = { ...manifest, url, kasus: manifest.kasus.filter((k) => k.url === url) };
  const f = join(KERJA, `manifest-${url.length}.json`);
  writeFileSync(f, JSON.stringify(m));
  const out = join(KERJA, `uji-${url.length}.json`);
  py("uji", f, out);
  uji.push(...JSON.parse(readFileSync(out, "utf8")));
}
writeFileSync(join(RENDER, "uji-qr.json"), JSON.stringify(uji, null, 1));
catat("");
catat(`QR DECODE TESTS from the PDF at 300 dpi (zxing-cpp and OpenCV; PASS = the exact link came back). Symbol ${S.QR_MM} mm; module ${f3(S.QR_MM / M5.length)} mm at version 5, ${f3(S.QR_MM / M6.length)} mm at version 6`);
for (const u of uji) {
  catat(`  ${u.kode} ${u.nama}: zxing ${u.uji.filter((x) => x.zxing).length}/${u.uji.length}, opencv ${u.uji.filter((x) => x.opencv).length}/${u.uji.length}`);
  for (const x of u.uji) if (!x.zxing || !x.opencv) catat(`      ${x.nama}: zxing ${x.zxing ? "PASS" : "FAIL"}, opencv ${x.opencv ? "PASS" : "FAIL"}`);
  if (u.batas) for (const dec of ["zxing", "opencv"] as const) {
    const x = u.batas[dec];
    catat(`      ${dec} limits: down to ${x.dpi} dpi; blur up to sigma ${x.blur_px} px at 300 dpi; contrast down to ${x.kontras}; tilt up to ${x.miring} deg`);
  }
  if (!u.uji[0].zxing || !u.uji[0].opencv) gagal++;
}

// ════════════════════════════════════════════════════════════════════════════
// K. Print, simulated from the PDF; decoded again
// ════════════════════════════════════════════════════════════════════════════
type Sim = { kode: string; nama: string; sim: Record<string, { uji: Record<string, { zxing: boolean; opencv: boolean }>; modul: number; latar: number }> };
const SIM_NAMA: Record<string, string> = { warna: "office colour print", mono: "monochrome laser", hemat: "toner-saving (55% density)", f4_atas: "A4 on F4, top-left", f4_tengah: "A4 on F4, centred" };
const sim: Sim[] = [];
{
  const x = S.A4.w - S.TATA.tepi - S.QR_MM, y = S.TATA.rekamAtas + 0.6;
  const m = { url: URL5, pdf: PDF, kasus: [
    { kode: "modern-a", nama: "Modern · academic", halaman: 1, qr: [x, y, S.QR_MM, S.QR_MM], simpan: join(KERJA, "K-modern-a") },
    { kode: "modern-p", nama: "Modern · professional", halaman: 2, qr: [x, y, S.QR_MM, S.QR_MM], simpan: join(KERJA, "K-modern-p") },
    { kode: "minimal-a", nama: "Minimal · academic", halaman: 4, qr: [x, y, S.QR_MM, S.QR_MM], simpan: join(KERJA, "K-minimal-a") },
  ] };
  writeFileSync(join(KERJA, "cetak.json"), JSON.stringify(m));
  sim.push(...(JSON.parse(py("cetak", join(KERJA, "cetak.json"))) as Sim[]));
  catat("");
  catat("PRINT SIMULATIONS from the PDF (300 dpi; an estimate, not a proof: the real test is printing J)");
  for (const s_ of sim) for (const [k, v] of Object.entries(s_.sim)) {
    const lulus = Object.values(v.uji).filter((u) => u.zxing && u.opencv).length;
    catat(`  ${s_.nama} · ${SIM_NAMA[k]}: QR modules ${v.modul} on ${v.latar} (0-255); decoded by both in ${lulus}/${Object.keys(v.uji).length} tests (${Object.entries(v.uji).map(([n, u]) => `${n} ${u.zxing ? "z" : "-"}${u.opencv ? "o" : "-"}`).join(", ")})`);
    if (!v.uji["300 dpi"].zxing || !v.uji["300 dpi"].opencv) gagal++;
  }
}
{
  const img = (kode: string, k: string) => `file://${join(KERJA, `K-${kode}-${k}.png`)}`;
  // crops of the seam and the QR from each simulation, 300 dpi
  const crop = (kode: string, k: string, x: number, y: number, w: number, h: number, ox = 0, oy = 0) => `<div style="width:${w}mm;height:${h}mm;overflow:hidden;position:relative;border:0.2mm solid rgba(31,42,51,.15)"><img src="${img(kode, k)}" style="position:absolute;left:${-(x + ox)}mm;top:${-(y + oy)}mm;width:${k.startsWith("f4") ? 215 : 210}mm"></div>`;
  const kolom = ["warna", "mono", "hemat"];
  const lajur = (kode: string, judul: string) => `<h2>${judul}</h2><div class="baris">
<div style="width:58mm"><div class="bayang" style="width:58mm;height:${58 * 297 / 210}mm;background:${W.kertas};overflow:hidden"><div style="zoom:${58 / 210}">${sr(kode.startsWith("minimal") ? "MINIMAL" : "MODERN", kode.endsWith("p") ? P : A)}</div></div><p class="ket"><b>Screen</b>: the warm paper #FBFAF7</p></div>
${kolom.map((k) => `<div style="width:58mm"><img class="bayang" src="${img(kode, k)}" style="width:58mm;display:block"><p class="ket"><b>${SIM_NAMA[k]}</b> on white paper</p></div>`).join("")}</div>
<div class="baris" style="margin-top:-4mm">${kolom.map((k) => `<div>${crop(kode, k, 100, S.TATA.garis - 8, 60, 16)}<p class="ket" style="margin-top:1mm">${SIM_NAMA[k]}: the line, actual size</p></div>`).join("")}
${kolom.map((k) => `<div>${crop(kode, k, S.A4.w - S.TATA.tepi - S.QR_MM - 4, S.TATA.rekamAtas - 3.4, S.QR_MM + 8, S.QR_MM + 8)}<p class="ket" style="margin-top:1mm">QR, ${SIM_NAMA[k]}</p></div>`).join("")}</div>`;
  const f4 = (k: string) => `<div style="width:60mm"><div class="bayang" style="width:60mm;height:${60 * 330 / 215}mm;background:#fff;position:relative"><img src="${img("modern-a", k)}" style="width:60mm;display:block"></div><p class="ket"><b>${SIM_NAMA[k]}</b> (215 × 330 mm sheet): the certificate is complete and nothing is cut; the extra 33 mm is plain paper ${k === "f4_atas" ? "below the foot" : "above and below"}. Nothing in the design refers to the sheet's edge, so the composition is unchanged.</p></div>`;
  const tabel = sim.map((s_) => `<tr><td><b>${s_.nama}</b></td>${Object.keys(SIM_NAMA).map((k) => { const v = s_.sim[k]; const l = Object.values(v.uji).filter((u) => u.zxing && u.opencv).length; return `<td>${l}/${Object.keys(v.uji).length} · ${v.modul}/${v.latar}</td>`; }).join("")}</tr>`).join("");
  await potret(halaman("K", `<div class="lembar" style="width:${4 * 58 + 3 * 8}mm">
<h1>K · Print reality: office colour, monochrome, toner-saving, white paper, A4 on F4</h1>
<p class="sub">Simulated from the PDF (J) at 300 dpi: office colour is the page through a CMYK profile with 15% dot gain and 0.04 mm ink spread; monochrome is luminance with the same gain; toner-saving is monochrome at 55% density. Paper in print is the stock: white, not the screen's warm #FBFAF7, and no tint is ever printed (a full-page tint would print a white frame where the printer cannot reach). Colour is never needed: in monochrome the band is a dark grey field with the school knocked out, the line a mid-grey rule, and every word reads. These are estimates; the proof is J printed.</p>
${lajur("modern-a", "Modern · academic")}${lajur("modern-p", "Modern · professional")}${lajur("minimal-a", "Minimal · academic")}
<h2>A4 printed at 100% on F4 (Folio, 215 × 330 mm), common in Indonesian schools</h2><div class="baris">${f4("f4_atas")}${f4("f4_tengah")}
<div style="width:110mm"><table class="spek"><tr><th>QR after print</th>${Object.values(SIM_NAMA).map((n) => `<th>${n}</th>`).join("")}</tr>${tabel}</table><p class="ket">Each cell: decode tests passed by both decoders (actual size, 150 dpi, blur, the whole page at 150 dpi) · module / quiet-zone grey (0 black, 255 white). If the printer is set to «Fit to page» on F4, A4 grows by 2.4% (the width is the limit): the QR still decodes; the scale check on page 1 of J shows it.</p></div></div></div>`),
    "K-cetak.png", { lebar: Math.ceil(mmPx(4 * 58 + 3 * 8 + 32)), skala: 2.5 });
}

// ════════════════════════════════════════════════════════════════════════════
// I. The recognition test
// ════════════════════════════════════════════════════════════════════════════
const JARAK_LIHAT = [1, 2, 4, 8, 16];
{
  const lain = sertifikatLain(M_LAIN);
  // distance views: each PINTAR direction, and the six others, at 150 dpi
  const entri: Array<Record<string, unknown>> = [];
  for (const a of S.ARAH) {
    for (const abu of [false, true]) entri.push({ kode: `${a}-${abu}`, png: await lembarPng(sr(a, A, { abu }), `I-${a}-${abu}.png`, 150), px_mm: 150 / 25.4, jarak: JARAK_LIHAT, tampil_px: 300, simpan: join(KERJA, `I-${a}-${abu}`) });
  }
  for (let i = 0; i < lain.length; i++) {
    const png = await potret(halaman("lain", `<div style="display:inline-block">${lain[i].html}</div>`, "body{background:#fff}"), `I-lain-${i}.png`, { lebar: 1400, tinggi: 1200, skala: 150 / 96, elemen: ".sl", ke: KERJA });
    entri.push({ kode: `lain-${i}`, png, px_mm: 150 / 25.4, jarak: JARAK_LIHAT, tampil_px: lain[i].mendatar ? 420 : 300, simpan: join(KERJA, `I-lain-${i}`) });
  }
  // the wall: three PINTAR among the six, all brand names covered, at 100% size, then seen from 3 m
  const dinding = (tutup: string) => {
    const isi = [lain[0], { html: sr("MODERN", A), mendatar: false }, lain[1], lain[2], { html: sr("CLASSIC", A), mendatar: false }, lain[3], lain[4], { html: sr("MODERN", P), mendatar: false }, lain[5]];
    return `<div class="${tutup}" style="display:flex;flex-wrap:wrap;gap:40mm 36mm;align-items:center;justify-content:center;width:910mm;padding:40mm 30mm;background:#DCD7CD">${isi.map((x) => `<div style="box-shadow:0 1.5mm 4mm rgba(0,0,0,.22)">${x.html}</div>`).join("")}</div>`;
  };
  const dindingPng = await potret(halaman("wall", dinding("tutup"), "body{background:#DCD7CD}"), "I-dinding.png", { lebar: Math.ceil(mmPx(930)), tinggi: 800, skala: 0.5, ke: KERJA });
  entri.push({ kode: "dinding", png: dindingPng, px_mm: 0.5 * 96 / 25.4, jarak: [3, 6], tampil_px: 1600, simpan: join(KERJA, "I-dinding") });
  writeFileSync(join(KERJA, "jauh.json"), JSON.stringify({ lembar: entri }));
  const jauh = (JSON.parse(py("jauh", join(KERJA, "jauh.json"))) as HasilJauh).lembar;
  const png = (kode: string, d: number) => `file://${jauh.find((j) => j.kode === kode && j.jarak === d)!.png}`;
  const barisArah = (a: S.Arah) => `<div class="baris" style="gap:5mm">
<div style="width:52mm">${kecil(sr(a, A), 52 / 210)}<p class="ket"><b>${NAMA_ARAH[a]}</b>, as it is</p></div>
<div style="width:52mm">${kecil(sr(a, A), 52 / 210, "tutup")}<p class="ket">«PINTAR SELALU» covered</p></div>
<div style="width:52mm">${kecil(sr(a, A, { abu: true }), 52 / 210)}<p class="ket">greyscale</p></div>
${[2, 4, 8, 16].map((d) => `<div style="width:30mm"><img src="${png(`${a}-false`, d)}" style="width:30mm;display:block" class="bayang"><p class="ket">from ${d} m</p></div>`).join("")}</div>`;
  const barisLain = `<div class="baris" style="gap:5mm">${lain.map((x, i) => `<div style="width:${x.mendatar ? 42 : 30}mm"><img src="${png(`lain-${i}`, 4)}" style="width:${x.mendatar ? 42 : 30}mm;display:block" class="bayang"><p class="ket">${x.nama.split(" (")[0]}, 4 m</p></div>`).join("")}</div>`;
  await potret(halaman("I", `<div class="lembar" style="width:360mm">
<h1>I · The recognition test: is it PINTAR before it is read?</h1>
<p class="sub">For each direction: as it is; «PINTAR SELALU» covered; greyscale; and reduced until unreadable. «From d m» is what an eye resolves at that distance (one arc-minute per sample, then scaled back up): by 2 m the small text is gone, by 8 m the name blurs, at 16 m only masses and the strongest edges are left. Then the wall: the three PINTAR certificates among six others from invented organisations, drawn competently in ordinary typefaces, every brand name covered (one strip on each sheet), seen from 3 and 6 m.</p>
${S.ARAH.map(barisArah).join("")}
<h2>The six others, from 4 m</h2>${barisLain}
<h2 style="margin-top:4mm">The wall, every brand name covered, from 3 m</h2><img src="${png("dinding", 3)}" style="width:344mm;display:block">
<p class="ket">Left to right, top to bottom: Lingua (course), <b>PINTAR Modern</b>, Pusat Pelatihan Guru, Olimpiade Sains, <b>PINTAR Classic</b>, Museum, Klub Catur (the control: Modern's band without the line or the type), <b>PINTAR Modern professional</b>, Yayasan.</p>
<h2 style="margin-top:4mm">The same wall from 6 m</h2><img src="${png("dinding", 6)}" style="width:344mm;display:block">
<p class="ket" style="max-width:340mm"><b>What the wall shows.</b> With every brand name covered, the plum Modern is found at 3 and at 6 m by its seam: a deep band two-thirds down with the gold line on its edge. Classic and Minimal are calm and credible, and they sit among the others as a white sheet with a thin line; without the colophon nothing marks them as PINTAR's. The control (Klub Catur, a green band in the same place, no line, other type) shows the limit honestly: <b>a band alone is not ownable</b>. At 3 m what separates Modern from the control is the gold edge, the heading in the accent, PINTAR's type and the record row; at 6 m, mostly the band's colour, and there the <b>sage professional band comes close to the control's green</b> while the plum does not. The words «PINTAR» that remain uncovered (the number's prefix, the link's host) are unreadable from 2 m, so they do not help here.</p></div>`),
    "I-pengenalan.png", { lebar: Math.ceil(mmPx(360 + 32)), skala: 1.7 });
}

// ════════════════════════════════════════════════════════════════════════════
// H. The QR, with the decode results
// ════════════════════════════════════════════════════════════════════════════
{
  const rekamSaja = (d: S.Data, o: S.Opsi = {}) => `<div style="position:relative;width:170mm;height:44mm;overflow:hidden;background:#fff"><div style="position:absolute;left:-20mm;top:-${S.TATA.rekamAtas - 6}mm">${sr("MODERN", d, { kertas: "", ...o })}</div></div>`;
  const baris = uji.filter((u) => u.batas).map((u) => {
    const z = u.batas!.zxing, o = u.batas!.opencv;
    const lembar = uji.find((x) => x.kode === `${u.kode}·sheet`)!;
    return `<tr><td>${u.nama.replace(" (QR crop)", "")}</td><td>${u.uji.filter((x) => x.zxing).length}/8 · ${u.uji.filter((x) => x.opencv).length}/8</td><td>${lembar.uji.filter((x) => x.zxing).length}/8 · ${lembar.uji.filter((x) => x.opencv).length}/8</td><td>${z.dpi} / ${o.dpi} dpi</td><td>${z.blur_px} / ${o.blur_px} px</td><td>${z.kontras} / ${o.kontras}</td><td>${z.miring}° / ${o.miring}°</td></tr>`;
  }).join("");
  const q5 = S.TENANG * S.QR_MM / M5.length;
  const v6 = uji.find((u) => u.kode === "versi-6")!;
  const v6z = v6.uji.filter((x) => x.zxing).length, v6o = v6.uji.filter((x) => x.opencv).length;
  const v6Kalimat = `At version 6 zxing decodes it in ${v6z} of 8 tests and OpenCV, the weaker decoder, in ${v6o} (OpenCV's scale limit rises from ${uji.find((u) => u.kode === "modern-a")!.batas!.opencv.dpi} to ${v6.batas!.opencv.dpi} dpi): version 6 still works, with less margin, which is why the host should stay short.`;
  await potret(halaman("H", `<div class="lembar" style="width:250mm">
<h1>H · The verification QR</h1>
<p class="sub">It verifies, nothing else: it opens /verifikasi/&lt;code&gt;, which says whether this certificate was genuinely issued and is still valid (or revoked, or replaced), with the result, predikat, school and date, and never the name or a photo («Nama pemegang tertera pada sertifikatnya»). So the sentence beside it says what the page checks, the certificate, and nothing about the person. PINTAR green on paper, never inverted, no logo in it, the app's own encoder (src/lib/qr.ts, level M).</p>
<div class="baris">${rekamSaja(A)}<div style="width:70mm"><table class="spek">
<tr><td>Symbol</td><td>${S.QR_MM} mm square, modules only</td></tr>
<tr><td>Module</td><td>${f3(S.QR_MM / M5.length)} mm at version 5 (${M5.length} modules); ${f3(S.QR_MM / M6.length)} mm at version 6 (${M6.length})</td></tr>
<tr><td>Quiet zone</td><td>4 modules, ${f2(q5)} mm, clear paper; it runs into the gutter and margin</td></tr>
<tr><td>Position</td><td>top of the record row, ${S.TATA.rekamAtas + 0.6} mm; modules end on the measure (186 mm)</td></tr>
<tr><td>Colour</td><td>${W.hijau} on paper, ${f2(S.rasio(W.hijau, PUTIH))}:1</td></tr></table></div></div>
<h2>The link: why the module is sized for version 5, with version 6 in reserve</h2>
<p class="ket" style="max-width:240mm;margin-top:0">The real link is appUrl + «/verifikasi/» + a 43-character code. In production that is https://app.pintarselalu.com/verifikasi/… = <b>${PANJANG_PRODUKSI} characters</b>; the sample here is ${URL5.length}. Version 5-M holds exactly 84 bytes, so both are version 5, 37 modules, and a 26 mm symbol gives ${f3(S.QR_MM / M5.length)} mm modules. <b>Two more characters of host</b> (a www., a .co.id) and every certificate becomes version 6, 41 modules: ${f3(S.QR_MM / M6.length)} mm at the same size. ${v6Kalimat} The size is fixed, not the module, so the layout never changes with the host. Today's sheet draws a symbol of about 21 mm in ink, with a quiet zone of about 2.8 modules at version 5 inside a green border; this one is larger, green, and keeps the full four modules. <b>Found on the way:</b> in the first run, the longer sample host pushed the link's first line into the quiet zone, and zxing could not decode the symbol at all; the line now breaks after its own «/» or «.» when it must, and the layout check refuses anything in the quiet zone.</p>
<div class="baris" style="margin-top:3mm"><div>${rekamSaja({ ...A, url: URL6, matriks: M6 })}<p class="ket">Version 6 (the ${URL6.length}-character sample): the same 26 mm, denser.</p></div>
<div>${rekamSaja(A, { ubin: true })}<p class="ket">Study: modules on the card's soft-green tile (#E3EFEC). Not recommended for print: a tint prints as a dot screen, costs contrast in monochrome (${f2(S.rasio(S.abuHex(W.hijau), S.abuHex(W.hijauLembut)))}:1 against ${f2(S.rasio(S.abuHex(W.hijau), PUTIH))}:1), and adds nothing the green does not already say.</p></div></div>
<h2>Decode: 8 fixed tests per case, then graded limits (zxing / OpenCV)</h2>
<table class="spek"><tr><th>Case (from the A4 PDF at 300 dpi)</th><th>QR crop</th><th>Whole sheet</th><th>Scale down to</th><th>Blur up to</th><th>Contrast down to</th><th>Tilt up to</th></tr>${baris}</table>
<p class="ket" style="max-width:240mm">Round 1's method, unchanged: the PDF rasterised at 300 dpi; fixed tests at actual size, 150 and 100 dpi, blur sigma 1.5 and 2.5 px, a 25° tilt with an 8° turn, contrast faded to 35%, and all of them at once with noise and JPEG; then the last value that still decodes before the first failure. The print simulations in K are decoded as well. The physical test is J printed and scanned with ordinary phones.</p></div>`),
    "H-qr.png", { lebar: Math.ceil(mmPx(250 + 32)), skala: 2.5 });
}

// ════════════════════════════════════════════════════════════════════════════
// L. On screen · M. The action, both ways · B. The recommendation
// ════════════════════════════════════════════════════════════════════════════
const LOGO = `data:image/png;base64,${readFileSync(join(AKAR, "public/brand/pintar-selalu-logo.png")).toString("base64")}`;
const kepala = (lebar: number) => `<div style="height:56px;display:flex;align-items:center;gap:20px;padding:0 ${lebar > 600 ? 32 : 16}px;border-bottom:1px solid rgba(31,42,51,.12);background:#fff">
<img src="${LOGO}" alt="PINTAR" style="height:32px;display:block">${lebar > 600 ? `<span style="font-size:14px;color:${W.tinta2}">${s("nav.belajar")}</span><span style="font-size:14px;font-weight:600;color:${W.tinta}">${s("nav.sertifikat")}</span><span style="font-size:14px;color:${W.tinta2}">${s("nav.akun")}</span>` : ""}</div>`;
const tombol = (teks: string, utama = false) => `<span style="display:inline-flex;align-items:center;justify-content:center;height:48px;padding:0 20px;border-radius:8px;font-weight:600;font-size:15px;${utama ? `background:${W.hijau};color:#fff` : `background:#fff;color:${W.tinta};box-shadow:inset 0 0 0 1px rgba(31,42,51,.24)`}">${teks}</span>`;
const fakta = (d: S.Data) => `<div style="border-top:1px solid rgba(31,42,51,.12)">${[[KATA.predikat, d.predikat, false], [KATA.tanggal, d.tanggal, false], [KATA.nomor, d.nomor, true], [KATA.penerbit, d.sekolah, false]].map(([k, v, mono]) =>
  `<div style="display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid rgba(31,42,51,.12);font-size:14px"><span style="color:${W.tinta3}">${k}</span><span style="${mono ? "font-family:'IBM Plex Mono';font-weight:500;font-size:13px;" : ""}text-align:right">${mono ? nomorLayar(String(v)) : S.esc(String(v))}</span></div>`).join("")}</div>`;
/** on screen the number breaks where the sheet's does: only after its own «/», «2026/00042» whole */
function nomorLayar(n: string): string {
  const b = n.split("/");
  const t = [...b.slice(0, -2).map((x) => `${x}/`), `${b[b.length - 2]}/${b[b.length - 1]}`];
  return t.map((x) => `<span style="white-space:nowrap">${S.esc(x)}</span>`).join("<wbr>");
}
function layar(lebar: number, aksi: string, catatan = "") {
  const sempit = lebar < 600;
  const lebarLembar = sempit ? lebar - 32 : 560;
  const z = lebarLembar / mmPx(210);
  const lembar = `<div style="width:${lebarLembar}px;height:${Math.round(lebarLembar * 297 / 210)}px;box-shadow:0 1px 0 rgba(31,42,51,.12),0 0 0 1px rgba(31,42,51,.12);background:${W.kertas};overflow:hidden"><div style="zoom:${z}">${sr("MODERN", A)}</div></div>`;
  return `<div style="width:${lebar}px;background:${W.kertas};font-family:'Plus Jakarta Sans';color:${W.tinta}">${kepala(lebar)}
<div style="padding:24px ${sempit ? 16 : 32}px 40px;${sempit ? "" : "display:grid;grid-template-columns:560px 1fr;gap:40px;align-items:start"}">
<div>${sempit ? `<p style="margin:0 0 16px;font-size:14px;color:${W.tinta2}">← ${AKSI.kembali}</p>` : ""}${lembar}</div>
<div style="${sempit ? "margin-top:20px" : ""}">${sempit ? "" : `<p style="margin:0 0 16px;font-size:14px;color:${W.tinta2}">← ${AKSI.kembali}</p>`}
<div style="display:flex;flex-wrap:wrap;gap:12px">${aksi}</div>${catatan}
<div style="margin-top:24px">${fakta(A)}</div></div></div></div>`;
}
await potret(halaman("L390", layar(390, tombol(AKSI.cetak, true) + tombol(AKSI.salin)), `body{background:${W.kertas}}`), "L-layar-390.png", { lebar: 390, tinggi: 844, skala: 2 });
await potret(halaman("L1280", layar(1280, tombol(AKSI.cetak, true) + tombol(AKSI.salin)), `body{background:${W.kertas}}`), "L-layar-1280.png", { lebar: 1280, tinggi: 900, skala: 2 });
execFileSync(PY, ["-c", `
import pymupdf
d = pymupdf.open(${JSON.stringify(PDF)})
d[1].get_pixmap(dpi=59).save(${JSON.stringify(join(RENDER, "L-pdf-muat-halaman.png"))})
d[1].get_pixmap(dpi=96, clip=pymupdf.Rect(0, 150/25.4*72, 210/25.4*72, 297/25.4*72)).save(${JSON.stringify(join(RENDER, "L-pdf-100persen.png"))})
for i in range(len(d)):
    d[i].get_pixmap(dpi=110).save(${JSON.stringify(join(RENDER, "J-halaman-"))} + str(i + 1) + ".png")
`]);
{
  const catatanI = `<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:${W.tinta2}">Membuka dialog cetak peramban. Pilih pencetak, atau «Simpan sebagai PDF».</p>`;
  const catatanII = `<p style="margin:12px 0 0;font-size:13px;line-height:1.5;color:${W.tinta2}">«Unduh PDF» menyimpan berkas yang sama persis dengan yang tercetak.</p>`;
  const panel = (judul: string, isi: string, ket: string) => `<div style="width:390px"><p style="font:600 13px 'Plus Jakarta Sans';margin:0 0 8px">${judul}</p><div class="bayang" style="width:390px;height:1000px;overflow:hidden">${isi}</div><p class="ket" style="font-size:11px;max-width:390px">${ket}</p></div>`;
  await potret(halaman("M", `<div class="lembar" style="width:${3 * 390 + 2 * 30}px">
<h1>M · The action: (i) today's single action, (ii) «Unduh PDF» and «Cetak»</h1>
<p class="sub" style="max-width:1100px">Both on the recommended sheet, at 390 px. The sheet on screen is the printed sheet, scaled whole (LembarA4's rule), so what a reader sees is what leaves the printer; the facts below it are the same record in text, readable at phone size and selectable. The grey sentences under the buttons are PROPOSALS (no hle key).</p>
<div style="display:flex;gap:30px;align-items:flex-start">
${panel("(i) Today: «" + AKSI.cetak + "»", layar(390, tombol(AKSI.cetak, true) + tombol(AKSI.salin), catatanI), `<b>How it works:</b> window.print(); the browser's dialog does the rest, and «Simpan sebagai PDF» is one of its destinations. No server, no job, no file PINTAR keeps. <b>What the sheet must do so the reader sets nothing:</b> declare its own page (@page size A4, margin 0: no browser headers or footers, no shrink), print nothing but itself, and mark its colour print-color-adjust: exact (J was made with «Background graphics» off). <b>Weakness:</b> the dialog differs per browser and phone; on some phones «Save as PDF» is hard to find, and the result depends on the browser's print engine.`)}
${panel("(ii) «" + AKSI.unduh + "» and «" + AKSI.cetakSaja + "» <span class='buka'>(Yazid's decision)</span>", layar(390, tombol(AKSI.unduh, true) + tombol(AKSI.cetakSaja) + tombol(AKSI.salin), catatanII), `<b>Needs a server-generated PDF.</b> «Unduh PDF» downloads a file made on the server from the same canonical sheet (fonts embedded, exact A4, like J), named for instance Sertifikat-PINTAR-SMP-CAHAYA-KALIANDRA-2026-00042.pdf; «Cetak» opens the same file for printing. Every reader gets byte-identical output on every device. <b>Costs:</b> a render service on the server (headless Chromium or a PDF library), fonts on the server, a download endpoint that must enforce the same access as the page (only the holder, only ISSUED), and a decision whether the file is generated on request or stored. Today AksiCetak says plainly there is none.`)}
<div style="width:390px"><p style="font:600 13px 'Plus Jakarta Sans';margin:0 0 8px">Today, as printed (the baseline)</p><img class="bayang" src="file://${join(RENDER, "kini-cetak-bawaan-1.png")}" style="width:390px;display:block" onerror="this.remove()"><p class="ket" style="font-size:11px">Reproduced with the repository's review harness (the real KartuSertifikat, the real stylesheet) in Playwright's Chromium, printed as Chrome's dialog opens: the on-screen card prints first, the A4 sheet begins below it and breaks across two pages, the browser adds its date, title and address, and the sheet's green rule (a CSS background) is dropped. See kini-*.pdf and README §N.</p></div>
</div></div>`), "M-aksi.png", { lebar: 3 * 390 + 2 * 30 + 64, skala: 2 });
}
{
  await potret(halaman("B", `<div class="lembar" style="width:340mm">
<h1>B · Recommendation: one excellent certificate, Modern</h1>
<p class="sub">Modern is the only direction still PINTAR's when the words are gone, and it is so by its seam: a deep band two-thirds down with the gold line on its edge, the card's own division. On the wall with every brand name covered (I) the plum Modern is found at 3 and 6 m; Classic and Minimal are calm, credible certificates that sit among the others. One design is also what the Recognition Principle asks for: three layouts would give PINTAR three faces, and schools would choose between them. The test is honest about the limit: a band alone is not ownable (the control has one), so the seam works with the rest of the grammar (the gold edge, the heading in the accent, PINTAR's type, the record row) and not instead of it. If Yazid keeps a centred option for schools that want one, it should carry the seam too (right).</p>
<div class="baris"><div style="width:147mm">${kecil(sr("MODERN", A), 0.7)}<p class="ket"><b>Modern · academic</b> (the canonical certificate)</p></div>
<div style="width:84mm">${kecil(sr("MODERN", P), 0.4)}<p class="ket"><b>Modern · professional</b></p>
<div style="margin-top:6mm">${kecil(sr("MODERN", A, { abu: true }), 0.4)}<p class="ket"><b>Modern, monochrome</b>: nothing needs colour</p></div></div>
<div style="width:84mm">${kecil(sr("CLASSIC", A, { pita: true }), 0.4)}<p class="ket"><b>If a centred option is kept</b>: Classic with the seam. Not recommended over one design; shown so the choice is concrete.</p>
<div style="margin-top:6mm">${kecil(sr("MINIMAL", A), 0.4)}<p class="ket"><b>Minimal</b>: the fallback if the band is refused.</p></div></div></div></div>`),
    "B-rekomendasi.png", { lebar: Math.ceil(mmPx(340 + 32)), skala: 2.4 });
}
await browser.close();

writeFileSync(join(RENDER, "laporan.txt"), laporan.join("\n") + "\n");
console.log(laporan.join("\n"));
console.log(gagal ? `\n${gagal} problem(s)` : "\nall checks passed");
process.exit(gagal ? 1 : 0);
