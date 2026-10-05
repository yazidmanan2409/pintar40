/**
 * Sertifikat PINTAR, round 2 (D-076): the render script. Run from the repository root:
 *
 *   KARTU_PY=/path/to/venv/bin/python npx tsx docs/coordination/ux/sertifikat/ronde-2/buat-ronde2.mts
 *
 * KARTU_PY is a Python with ../requirements.txt installed (round 1's, unchanged).
 * It builds every render in render/ from the one grammar in sertifikat2.mts, with
 * the words taken from the app's copy table (src/lib/hle.ts); writes the A4 PDF
 * (E); runs the layout checks, the contrast table, the QR study (versions, decode
 * and stress with round 1's method, damage tolerance), the number and link tests
 * (reading, typing: what a PDF viewer and a browser hand back), the glyph test
 * for IBM Plex Mono at certificate size, and the print simulations; and writes
 * render/laporan.txt. It exits non-zero if a check fails.
 *
 * Samples only: every person, school, number and token is invented. The links
 * take the canonical verification domain Yazid approved on 30 Sep,
 * https://verifikasi.pintarselalu.com/<token>. It does not resolve until it is
 * set up (a production change); when it does, these invented tokens will read
 * as not found.
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { qrMatrix } from "../../../../../src/lib/qr.js";
import { t, format, type HleEvent } from "../../../../../src/lib/hle.js";
import * as S from "./sertifikat2.mjs";
import * as R1 from "../sertifikat.mjs";

const AKAR = process.cwd();
const DIR = join(AKAR, "docs/coordination/ux/sertifikat/ronde-2");
const R1DIR = join(AKAR, "docs/coordination/ux/sertifikat");
const RENDER = join(DIR, "render");
const KERJA = join(tmpdir(), "sertifikat-r2-kerja");
mkdirSync(RENDER, { recursive: true });
mkdirSync(KERJA, { recursive: true });
const PY = process.env.KARTU_PY ?? "python3";
const jalankan = (berkas: string, ...a: string[]) => execFileSync(PY, [berkas, ...a], { maxBuffer: 1 << 27 }).toString();
const py1 = (...a: string[]) => jalankan(join(R1DIR, "uji-sertifikat.py"), ...a);
const py2 = (...a: string[]) => jalankan(join(DIR, "uji-ronde2.py"), ...a);

const laporan: string[] = [];
let gagal = 0;
const catat = (s: string) => { laporan.push(s); };
const f1 = (x: number) => x.toFixed(1);
const f2 = (x: number) => x.toFixed(2);
const f3 = (x: number) => x.toFixed(3);
const W = S.WARNA;

// ── the words: the app's own copy table, D-014 ────────────────────────────────
const s = (k: string, persona: "learner" | "public" = "learner") => t(k as HleEvent, persona, { locale: "id" });
const KATA: S.Kata = {
  jenis: s("sertifikat.jenis"), diberikan: s("sertifikat.diberikan"), predikat: s("sertifikat.predikat"),
  tanggal: s("sertifikat.tanggal"), nomor: s("sertifikat.nomor"), periksa: s("sertifikat.periksa.judul"),
  arti: s("sertifikat.periksa.arti"),
  penerbit: s("verifikasi.institusi", "public"), // the verification page's own words; no sertifikat key yet
};
for (const [k, v] of Object.entries(KATA)) if (!v || /^[a-z]+(\.[a-z_]+)+$/.test(v)) throw new Error(`no copy for ${k}`);
if (KATA.penerbit !== "Diterbitkan oleh") throw new Error(`«Diterbitkan oleh» expected, found «${KATA.penerbit}»`);

// ── the link, the token, the QR ──────────────────────────────────────────────
const CROCKFORD = /^[0-9A-HJKMNP-TV-Z]+$/; // no I, L, O, U
const TOKEN = { bagas: "K7M4QX9P2HDT", ratna: "3GW8N5RDZ1VB", sukarmi: "7HV2C9QW4NMB", panjang: "Q9TZ4M1XHE7C8KRD", ekstrem: "R3DXW6JKP0TZ8FAE" } as const; // invented, one per certificate
for (const [k, v] of Object.entries(TOKEN)) if (!CROCKFORD.test(v) || ![12, 16].includes(v.length)) throw new Error(`${k}: not a 12- or 16-character Crockford token`);
const ASAL = "https://verifikasi.pintarselalu.com/";
const tautan = (tok: string) => ({ url: ASAL + tok, cetak: (ASAL + tok).replace(/^https:\/\//, ""), besar: (ASAL + tok).toUpperCase() });
const L12 = tautan(TOKEN.bagas), L16 = tautan(TOKEN.panjang);
if (L12.url.length !== 48 || L16.url.length !== 52) throw new Error("the 12-character link is 48 characters and the 16-character one 52");
const R1_URL = "https://contoh.pintar.invalid/verifikasi/q7Hn2VxR0tLb9KcWm4ZsYp6EdJf1uA8oGiTk3NvB5eQ"; // round 1's sample, V5-M
const bit = (m: boolean[][]) => m.map((r) => r.map((x) => (x ? 1 : 0)));

type Mode = "byte" | "alphanumeric";
type Qr = { kode: string; nama: string; isi: string; mode: Mode; ecc: string; versi: number; matriks: number[][]; sumber: string };
const SPEK: Array<[string, string, string, Mode, string]> = [
  ["byte-m", "byte, M: the app's encoder today", L12.url, "byte", "M"],
  ["an-m", "uppercase alphanumeric, M", L12.besar, "alphanumeric", "M"],
  ["an-q", "uppercase alphanumeric, Q", L12.besar, "alphanumeric", "Q"],
  ["an-h", "uppercase alphanumeric, H", L12.besar, "alphanumeric", "H"],
  ["byte-m-16", "16-character token: byte, M", L16.url, "byte", "M"],
  ["an-m-16", "16-character token: uppercase alphanumeric, M", L16.besar, "alphanumeric", "M"],
  ["an-q-16", "16-character token: uppercase alphanumeric, Q", L16.besar, "alphanumeric", "Q"],
];
const segno = JSON.parse(jalankan(join(DIR, "qr.py"), JSON.stringify(SPEK.map(([, , isi, mode, ecc]) => [isi, mode, ecc])))) as Array<{ versi: number; ecc: string; mode: string; matriks: number[][] }>;
const QR: Record<string, Qr> = {};
SPEK.forEach(([kode, nama, isi, mode, ecc], i) => {
  const z = segno[i];
  if (z.ecc !== ecc || z.mode !== mode) throw new Error(`${kode}: segno made ${z.mode} ${z.ecc}`);
  // byte symbols come from the app's own encoder, unchanged; segno's version must agree
  if (mode === "byte") {
    const m = bit(qrMatrix(isi));
    if ((m.length - 17) / 4 !== z.versi) throw new Error(`${kode}: the app's encoder makes version ${(m.length - 17) / 4}, segno ${z.versi}`);
    QR[kode] = { kode, nama, isi, mode, ecc, versi: z.versi, matriks: m, sumber: "src/lib/qr.ts (the app's encoder, unchanged)" };
  } else QR[kode] = { kode, nama, isi, mode, ecc, versi: z.versi, matriks: z.matriks, sumber: "segno (the app's encoder makes byte mode only)" };
});
const R1_M = bit(qrMatrix(R1_URL));
const QR_R1: Qr = { kode: "r1-v5", nama: "round 1: 83-character link, byte, M", isi: R1_URL, mode: "byte", ecc: "M", versi: (R1_M.length - 17) / 4, matriks: R1_M, sumber: "src/lib/qr.ts" };
/** THE PROPOSAL (see README §4): the symbol every certificate below carries */
const PILIHAN = "an-q";
const PILIHAN_16 = "an-q-16";
const modulMm = (q: { matriks: number[][] }) => S.QR_MM / q.matriks.length;

// ── samples: invented people and schools, as the card has them ────────────────
const TGL = format.date("2026-09-14T02:12:40Z", "id"); // 09:12 in Jakarta
const NOMOR_RE = /^[0-9A-HJKMNP-TV-Z]{8}\/\d{5}$/;
const data = (d: Omit<S.Data, "isiQr" | "tautan" | "matriks" | "tanggal">, tok: string, qr: Qr): S.Data =>
  ({ ...d, tanggal: TGL, isiQr: qr.isi, tautan: tautan(tok).cetak, matriks: qr.matriks });
const qrUntuk = (tok: string, kode: string, kode16: string): Qr => {
  const q = QR[tok.length === 16 ? kode16 : kode];
  // a symbol must carry this certificate's own link
  const baru = JSON.parse(jalankan(join(DIR, "qr.py"), JSON.stringify([[q.mode === "byte" ? tautan(tok).url : tautan(tok).besar, q.mode, q.ecc]])))[0];
  return q.mode === "byte" ? { ...q, isi: tautan(tok).url, matriks: bit(qrMatrix(tautan(tok).url)) } : { ...q, isi: tautan(tok).besar, matriks: baru.matriks, versi: baru.versi };
};
const SAMPEL: Record<string, S.Data> = {
  // Yazid's reference sample; his card's PINTAR ID (the card's student sample)
  akademik: data({ sekolah: "SMP Cahaya Kaliandra", nama: "Bagas Saputra", kursus: "Matematika · Bab 4: Sistem Persamaan Linear", predikat: "Sangat Baik", nomor: "7Q2Z0D9K/00001", konteks: "ACADEMIC" }, TOKEN.bagas, qrUntuk(TOKEN.bagas, PILIHAN, PILIHAN_16)),
  // the card's own sample, A14CD7ST: Ratna, a teacher, on her professional learning
  profesional: data({ sekolah: "SMP Cahaya Kaliandra", nama: "Ratna Dewi Kusumawardani", kursus: "Pengembangan Profesi · Merancang Asesmen Formatif di Kelas", predikat: "Baik", nomor: "A14CD7ST/00001", konteks: "PROFESSIONAL_DEVELOPMENT" }, TOKEN.ratna, qrUntuk(TOKEN.ratna, PILIHAN, PILIHAN_16)),
  // stress: the card's long name and long school; a long course; the 16-character token
  panjang: data({ sekolah: "Sekolah Menengah Kejuruan Teknologi dan Rekayasa Nusa Kaliandra Timur", nama: "Ni Luh Putu Ayu Kartika Maharani Suryaningsih", kursus: "Ilmu Pengetahuan Alam · Bab 7: Ekosistem, Interaksi Antarmakhluk Hidup, dan Pengaruh Manusia terhadap Keseimbangan Lingkungan", predikat: "Sangat Baik", nomor: "Q8ZB2D0S/00017", konteks: "ACADEMIC" }, TOKEN.panjang, qrUntuk(TOKEN.panjang, PILIHAN, PILIHAN_16)),
  pendek: data({ sekolah: "SMA Bukit Asri Kaliandra", nama: "Sukarmi", kursus: "Pengembangan Profesi · Literasi Data untuk Sekolah", predikat: "Cukup", nomor: "B8K5S1GX/00003", konteks: "PROFESSIONAL_DEVELOPMENT" }, TOKEN.sukarmi, qrUntuk(TOKEN.sukarmi, PILIHAN, PILIHAN_16)),
  // beyond realistic (round 1's probe): reported, not counted
  ekstrem: data({ sekolah: "Sekolah Menengah Atas Unggulan Terpadu Yayasan Pendidikan Cendekia Nusantara Kaliandra Barat Daya", nama: "Raden Mas Muhammad Rizky Aditya Pratama Wicaksono Hadiningrat Kusumo", kursus: "Pendidikan Pancasila dan Kewarganegaraan · Bab 5: Keberagaman Suku, Agama, Ras, dan Antargolongan dalam Bingkai Bhinneka Tunggal Ika di Lingkungan Sekolah dan Masyarakat", predikat: "Sangat Baik", nomor: "M4TQ9VXC/12345", konteks: "ACADEMIC" }, TOKEN.ekstrem, qrUntuk(TOKEN.ekstrem, PILIHAN, PILIHAN_16)),
};
for (const [k, d] of Object.entries(SAMPEL)) if (!NOMOR_RE.test(d.nomor)) throw new Error(`${k}: not a number of the proposed form: ${d.nomor}`);
const A = SAMPEL.akademik, P = SAMPEL.profesional;
/**
 * THE NUMBER NEVER BREAKS (Yazid's ruling 2): Yazid's own example, then two
 * lengths beyond any real form of the number, to prove what adapts when space
 * is tight: at 40 characters the layout (the axis moves), at 55 the type (a step
 * down the ladder). The identifier stays one line, exactly as stored.
 */
const NOMOR_STRES = [
  { kode: "contoh", nama: "Yazid's example", nomor: "123456XW/00001" },
  { kode: "40", nama: "40 characters (beyond the format)", nomor: "A14CD7STQ8ZB2D0SM4TQ9VXC7Q2Z0D9K/0000001" },
  { kode: "55", nama: "55 characters (beyond the format)", nomor: "A14CD7STQ8ZB2D0SM4TQ9VXC7Q2Z0D9KB8K5S1GX2ZNV07YD/000001" },
] as const;
for (const n of NOMOR_STRES) if (!/^[0-9A-HJKMNP-TV-Z]+\/\d+$/.test(n.nomor) || n.nomor.length !== (n.kode === "contoh" ? 14 : Number(n.kode))) throw new Error(`stress number ${n.kode} is malformed`);
const sr = (d: S.Data, o: S.Opsi = {}) => S.sertifikat(d, KATA, o);
/** a sheet with another QR variant (the study pages): the same certificate, another symbol */
const denganQr = (d: S.Data, q: Qr): S.Data => ({ ...d, isiQr: q.isi, matriks: q.matriks });

// ── pages ────────────────────────────────────────────────────────────────────
const MEJA = "#E6E3DC";
const halaman = (judul: string, badan: string, tambahan = "", statis?: string) => `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>${judul}</title>
<style>${S.css(AKAR, statis)}
html, body { margin: 0; }
body { background: ${MEJA}; color: ${W.tinta}; font-family: 'Plus Jakarta Sans'; text-rendering: geometricPrecision; font-kerning: normal; }
.lembar { padding: 8mm; }
.lembar h1 { font: 600 13pt 'Plus Jakarta Sans'; margin: 0 0 1.4mm; letter-spacing: -0.01em; }
.lembar .sub { font: 400 8pt/1.5 'Plus Jakarta Sans'; color: ${W.tinta2}; margin: 0 0 6mm; max-width: 270mm; }
.lembar h2 { font: 600 9.5pt 'Plus Jakarta Sans'; margin: 0 0 3mm; }
.baris { display: flex; gap: 8mm; align-items: flex-start; margin-bottom: 8mm; flex-wrap: wrap; }
.baris > * { flex: none; }
.ket { font: 400 7pt/1.45 'Plus Jakarta Sans'; color: ${W.tinta2}; margin-top: 2mm; }
.ket b { font-weight: 600; color: ${W.tinta}; }
.bayang { box-shadow: 0 0.4mm 1.2mm rgba(0,0,0,.18); }
table.spek { border-collapse: collapse; font: 400 7pt/1.4 'Plus Jakarta Sans'; }
table.spek th { font-weight: 600; text-align: left; padding: 1.2mm 3.5mm 1.2mm 0; border-bottom: 0.2mm solid rgba(31,42,51,.24); vertical-align: bottom; }
table.spek td { padding: 1.2mm 3.5mm 1.2mm 0; border-bottom: 0.2mm solid rgba(31,42,51,.12); vertical-align: top; }
.mono { font-family: 'IBM Plex Mono'; font-weight: 500; }
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
const kecil = (html: string, lebarMm: number) => `<div class="bayang" style="width:${lebarMm}mm;height:${(lebarMm * S.A4.h) / S.A4.w}mm;overflow:hidden"><div style="zoom:${lebarMm / S.A4.w}">${html}</div></div>`;
const PUTIH = "#FFFFFF";
const AK = S.AKSEN.ACADEMIC, PR = S.AKSEN.PROFESSIONAL_DEVELOPMENT;

// ════════════════════════════════════════════════════════════════════════════
// Contrast
// ════════════════════════════════════════════════════════════════════════════
catat("SAMPLES: every person, school, number and token is invented. Words from src/lib/hle.ts (id); «Diterbitkan oleh» is verifikasi.institusi.");
catat(`  Bagas Saputra carries his card's PINTAR ID (7Q2Z0D9K); Ratna Dewi Kusumawardani carries the card's sample A14CD7ST, so card and certificate samples agree person by person.`);
catat("");
catat("CONTRAST (WCAG 2.x; text 4.5:1). In print the paper is the stock (white); on screen #FBFAF7. The band's words are paper on the accent.");
type Pas = { apa: string; teks: string; latar: string; min: number };
const PAS: Pas[] = [
  { apa: "name, course, values, number, link (ink)", teks: W.tinta, latar: PUTIH, min: 4.5 },
  { apa: "«telah menuntaskan», verification sentence (ink-2)", teks: W.tinta2, latar: PUTIH, min: 4.5 },
  { apa: "record labels, 9 pt capitals (ink-3)", teks: W.tinta3, latar: PUTIH, min: 4.5 },
  { apa: "the PINTAR wordmark (PINTAR green)", teks: W.hijau, latar: PUTIH, min: 4.5 },
  { apa: "QR modules (PINTAR green) on paper", teks: W.hijau, latar: PUTIH, min: 4.5 },
  { apa: "«SERTIFIKAT PENGUASAAN», academic plum", teks: AK, latar: PUTIH, min: 4.5 },
  { apa: "«SERTIFIKAT PENGUASAAN», professional sage", teks: PR, latar: PUTIH, min: 4.5 },
  { apa: "band words on plum (paper #FBFAF7)", teks: W.kertas, latar: AK, min: 4.5 },
  { apa: "band words on sage (paper #FBFAF7)", teks: W.kertas, latar: PR, min: 4.5 },
  { apa: "the same, on screen paper: ink on #FBFAF7", teks: W.tinta3, latar: W.kertas, min: 4.5 },
];
for (const p of PAS) {
  const r = S.rasio(p.teks, p.latar);
  const rAbu = S.rasio(S.abuHex(p.teks), S.abuHex(p.latar));
  catat(`  ${p.apa}: ${f2(r)}:1 (greyscale ${f2(rAbu)}:1)${r < p.min ? "  BELOW" : ""}`);
  if (r < p.min || rAbu < p.min) gagal++;
}
const garisPlum = S.rasio(W.emas, AK), garisSage = S.rasio(W.emas, PR), garisKertas = S.rasio(W.emas, PUTIH);
catat(`  the gold line (non-text): against white ${f2(garisKertas)}:1, against plum ${f2(garisPlum)}:1, against sage ${f2(garisSage)}:1. It is structure, not information; nothing depends on seeing it.`);
catat(`  plum and sage in greyscale: ${S.abuHex(AK)} and ${S.abuHex(PR)} (${f2(S.rasio(S.abuHex(AK), S.abuHex(PR)))}:1 between them): in a monochrome print the band no longer tells the two apart. The words do: a professional-learning course title begins «Pengembangan Profesi ·».`);

// ════════════════════════════════════════════════════════════════════════════
// A · B · C · the sheets
// ════════════════════════════════════════════════════════════════════════════
const lembarPng = async (html: string, nama: string, dpi: number, ke = RENDER) =>
  potret(halaman(nama, `<div style="display:inline-block">${html}</div>`, "body{background:#fff}"), nama, { lebar: 900, tinggi: 1200, skala: dpi / 96, elemen: ".s2", ke });
await lembarPng(sr(A), "A-sertifikat-akademik.png", 150);
await lembarPng(sr(A, { kertas: "" }), "A-sertifikat-akademik-cetak.png", 150);
{
  const kolom = (d: S.Data, judul: string, ket: string) => `<div style="width:120mm">${kecil(sr(d), 120)}<p class="ket"><b>${judul}</b> ${ket}</p></div>`;
  await potret(halaman("B", `<div class="lembar" style="width:${3 * 120 + 2 * 8}mm">
<h1>B · Academic (plum) and professional learning (sage)</h1>
<p class="sub">The same grammar in both contexts: only the band and the heading take the accent. The band names the issuer; the course title says what was learned, so a professional-learning course begins «Pengembangan Profesi ·» and the context is never carried by the colour alone. Sage is not strengthened (D-076 §4). Right: both in print, side by side at the same scale, as a school would keep them.</p>
<div class="baris">${kolom(A, "Academic.", `Plum ${AK}; paper words on it ${f2(S.rasio(W.kertas, AK))}:1. Bagas Saputra, number ${A.nomor}.`)}${kolom(P, "Professional learning.", `Sage ${PR}; paper words on it ${f2(S.rasio(W.kertas, PR))}:1. Ratna Dewi Kusumawardani, number ${P.nomor} (the card's sample ID).`)}
<div style="width:120mm"><div style="display:flex;gap:4mm">${kecil(sr(A, { kertas: "" }), 58)}${kecil(sr(P, { kertas: "" }), 58)}</div><p class="ket"><b>In print, on white stock.</b> The screen's warm paper is never printed. Plum and sage differ by hue at nearly the same lightness, so the two sit as a pair; neither reads as the louder.</p></div></div></div>`),
    "B-plum-dan-sage.png", { lebar: Math.ceil(mmPx(3 * 120 + 2 * 8 + 16)), skala: 2 });
}
{
  const kolom = (d: S.Data, judul: string, ket: string) => `<div style="width:120mm">${kecil(sr(d), 120)}<p class="ket"><b>${judul}</b> ${ket}</p></div>`;
  await potret(halaman("C", `<div class="lembar" style="width:${3 * 120 + 2 * 8}mm">
<h1>C · Stress: a long name, a long course, a long school, the number, a 16-character token</h1>
<p class="sub">Nothing shrinks and nothing is cut. The name, the course and the school wrap and balance their lines; the achievement block re-centres in its space; the record, the line, the band and the verification group keep their places, so every certificate has the same skeleton. The number is a fixed 14 characters in any case. The 16-character link is one line (44 characters, ${f1(44 * 0.6 * 9 * 25.4 / 72)} mm of the ${S.KOLOM_TEKS} mm column).</p>
<div class="baris">${kolom(SAMPEL.panjang, "Long.", "The card's longest name, a long course and the card's long school, the 16-character token and its symbol.")}${kolom(SAMPEL.pendek, "Short.", "A one-word name: the block centres, nothing drifts to fill the space.")}${kolom(SAMPEL.ekstrem, "Beyond realistic (a probe).", "Round 1's limit-finder: three-line name, three-line course, two-line school. Reported, not a target.")}</div>
<h2>The number never breaks (Yazid, 30 Sep): one indivisible value, no break at «/», whatever its length</h2>
<p class="sub" style="margin-bottom:4mm">The record at actual size. When space is tight the layout adapts first (the value column takes the number's own width and the axis moves left), then the type steps down the app's ladder (12 → 10.5 → 9.75 pt); the identifier itself never breaks and never changes. The last two are longer than any real number, to prove the rule.</p>
<div class="baris" style="gap:8mm">${[{ nama: "As proposed", nomor: A.nomor }, { nama: "Yazid's example", nomor: NOMOR_STRES[0].nomor }, { nama: "Beyond the format", nomor: NOMOR_STRES[1].nomor }, { nama: "Beyond the format", nomor: NOMOR_STRES[2].nomor }].map((n) => `<div style="width:180mm"><div class="bayang" style="width:180mm;height:38mm;overflow:hidden;position:relative;background:${W.kertas}"><div style="position:absolute;left:-15mm;top:-125mm">${sr({ ...A, nomor: n.nomor })}</div></div><p class="ket"><b>${S.esc(n.nama)}</b> · ${n.nomor.length} characters · ${S.ukuranNomor(n.nomor)} pt${S.lebarNomorMm(n.nomor, S.GAYA.nomor.pt) > S.A4.w / 2 - S.TATA.tepi - 4 ? " · the axis moved left" : ""}${S.ukuranNomor(n.nomor) < S.GAYA.nomor.pt ? " · the type stepped down" : ""}. The page's text margin is 5 mm inside each edge of this view.</p></div>`).join("")}</div></div>`),
    "C-stres.png", { lebar: Math.ceil(mmPx(3 * 120 + 2 * 8 + 16)), skala: 2 });
}

// ════════════════════════════════════════════════════════════════════════════
// Layout checks, on every sheet in the round
// ════════════════════════════════════════════════════════════════════════════
type Uji = { nama: string; html: string; probe?: boolean; nomor?: string };
const SEMUA: Uji[] = [
  { nama: "A academic", html: sr(A), nomor: A.nomor }, { nama: "B professional", html: sr(P), nomor: P.nomor },
  ...NOMOR_STRES.map((n) => ({ nama: `C number, ${n.nama}`, html: sr({ ...A, nomor: n.nomor }), nomor: n.nomor })),
  { nama: "C long", html: sr(SAMPEL.panjang) }, { nama: "C short", html: sr(SAMPEL.pendek) },
  { nama: "C beyond realistic (probe)", html: sr(SAMPEL.ekstrem), probe: true },
  { nama: "A greyscale", html: sr(A, { abu: true }) },
  { nama: "A number 4+4", html: sr(P, { nomor44: true }) }, { nama: "A number 4+4 gap", html: sr(P, { nomorCelah: true }) },
  { nama: "C long, token grouped", html: sr(SAMPEL.panjang, { tokenKelompok: true }) },
  ...Object.values(QR).map((q) => ({ nama: `QR ${q.kode}`, html: sr(denganQr(A, q)) })),
];
const hasilLetak = await (async () => {
  const f = join(KERJA, "cek.html");
  writeFileSync(f, halaman("cek", `<div style="display:flex;flex-wrap:wrap;gap:10mm;padding:10mm">${SEMUA.map((x) => `<div data-nama="${S.esc(x.nama)}" data-probe="${x.probe ? 1 : 0}"${x.nomor ? ` data-nomor="${S.esc(x.nomor)}"` : ""}>${x.html}</div>`).join("")}</div>`));
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 1200 } });
  const p = await ctx.newPage();
  await p.addInitScript("window.__name = (f) => f"); // tsx keeps function names with a helper the page does not have
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  const r = await p.evaluate(({ px, garis, tenang, qrMm, pitaAtas, pitaBawah, kolom }: { px: number; garis: number; tenang: number; qrMm: number; pitaAtas: number; pitaBawah: number; kolom: number }) => {
    const masalah: string[] = [];
    const catatan: string[] = [];
    const baris: Record<string, Record<string, number>> = {};
    const jarak: Record<string, Record<string, number>> = {};
    document.querySelectorAll<HTMLElement>("[data-nama]").forEach((bungkus) => {
      const nama = bungkus.dataset.nama!;
      const probe = bungkus.dataset.probe === "1";
      const keluh = (m: string) => (probe ? catatan : masalah).push(`${nama}: ${m}`);
      const lembar = bungkus.querySelector(".s2")!.getBoundingClientRect();
      const kotak = (r: DOMRect) => ({ x0: (r.left - lembar.left) / px, y0: (r.top - lembar.top) / px, x1: (r.right - lembar.left) / px, y1: (r.bottom - lembar.top) / px });
      const tinta = (el: Element) => { const rg = document.createRange(); rg.selectNodeContents(el); return kotak(rg.getBoundingClientRect()); };
      const q = (sel: string) => bungkus.querySelector(sel)!;
      const hitung = (sel: string) => { const el = q(sel) as HTMLElement; return Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)); };
      // 1 · print margin: every word at least 12 mm from every edge; the band's ends 10 mm in
      bungkus.querySelectorAll(".s2 p").forEach((el) => {
        const b = tinta(el);
        if (b.x0 < 11.9 || b.y0 < 11.9 || b.x1 > 198.1 || b.y1 > 285.1) keluh(`«${(el.textContent ?? "").slice(0, 24)}» within 12 mm of the edge`);
      });
      const pita = kotak(q(".s2-pita").getBoundingClientRect());
      if (pita.x0 < 9.9 || pita.x1 > 200.1) keluh("the band within 10 mm of the edge");
      // 2 · the header: two words on one line each, apart
      const kiri = tinta(q(".merek-jenis")), kanan = tinta(q(".merek"));
      if (kanan.x0 - kiri.x1 < 10) keluh(`the header's two words are ${(kanan.x0 - kiri.x1).toFixed(1)} mm apart`);
      if (hitung(".merek-jenis") !== 1 || hitung(".merek") !== 1) keluh("a header word wraps");
      // 3 · the achievement: inside its space, clear of the header and the record
      const capaian = q(".s2-capaian") as HTMLElement;
      if (capaian.scrollHeight > capaian.clientHeight + 1) keluh(`the achievement overflows its space by ${((capaian.scrollHeight - capaian.clientHeight) / px).toFixed(1)} mm`);
      const nama_ = tinta(q(".t-nama")), kursus = tinta(q(".t-kursus"));
      const rekam = kotak(q(".s2-rekam").getBoundingClientRect());
      const kepalaBawah = Math.max(kiri.y1, kanan.y1);
      if (nama_.y0 - kepalaBawah < 14) keluh(`the name is ${(nama_.y0 - kepalaBawah).toFixed(1)} mm below the header`);
      if (rekam.y0 - kursus.y1 < 14) keluh(`the course ends ${(rekam.y0 - kursus.y1).toFixed(1)} mm above the record`);
      // 4 · the record: every value on one line, the labels meeting the values at the page's axis
      bungkus.querySelectorAll(".s2-rekam p").forEach((el) => { const h = el as HTMLElement; if (h.getBoundingClientRect().height / parseFloat(getComputedStyle(h).lineHeight) > 1.5) keluh(`«${h.textContent}» wraps in the record`); });
      const nomor = tinta(q(".t-nomor"));
      if (nomor.x1 > 190) keluh("the number runs past the column");
      // ruling 2: the number is one indivisible value, shown exactly as stored, on one line
      const elNomor = q(".t-nomor") as HTMLElement;
      if (bungkus.dataset.nomor && elNomor.textContent !== bungkus.dataset.nomor) keluh(`the number reads «${elNomor.textContent}», not «${bungkus.dataset.nomor}»`);
      if (hitung(".t-nomor") !== 1) keluh("the number breaks");
      // 5 · the line and the band: no word crosses them; the school stays inside the band
      bungkus.querySelectorAll(".s2 p").forEach((el) => {
        const b = tinta(el);
        if (b.y0 < garis && b.y1 > garis) keluh(`«${(el.textContent ?? "").slice(0, 20)}» crosses the line`);
      });
      const pitaEl = q(".s2-pita") as HTMLElement;
      if (pitaEl.scrollHeight > pitaEl.clientHeight + 1) keluh("the school overflows the band");
      const sekolah = tinta(q(".t-sekolah"));
      if (sekolah.y0 < pitaAtas + 3 || sekolah.y1 > pitaBawah - 2.5) keluh(`the school sits ${(sekolah.y0 - pitaAtas).toFixed(1)} / ${(pitaBawah - sekolah.y1).toFixed(1)} mm from the band's edges`);
      // 6 · the verification group: the link on one line inside its column; the QR's quiet zone clear
      const link = tinta(q(".t-tautan")), kolomEl = kotak(q(".s2-periksa").getBoundingClientRect());
      if (hitung(".t-tautan") !== 1) keluh("the link wraps");
      if (link.x1 > kolomEl.x0 + kolom + 0.05) keluh(`the link runs ${(link.x1 - kolomEl.x0 - kolom).toFixed(1)} mm past its column`);
      const svg = q(".s2-kode svg");
      const zona = kotak(svg.getBoundingClientRect());
      const n = Number(svg.getAttribute("viewBox")!.split(" ")[2]);
      if (Math.abs((zona.x1 - zona.x0) - (qrMm / (n - 2 * tenang)) * n) > 0.05) keluh(`the quiet zone is not ${tenang} modules`);
      bungkus.querySelectorAll(".s2 p").forEach((pp) => {
        const b = tinta(pp);
        if (b.x0 < zona.x1 && b.x1 > zona.x0 && b.y0 < zona.y1 && b.y1 > zona.y0) keluh(`«${(pp.textContent ?? "").slice(0, 20)}» inside the QR's quiet zone`);
      });
      if (zona.y1 > 287) keluh(`the QR's quiet zone ends ${(297 - zona.y1).toFixed(1)} mm from the foot`);
      const periksa = tinta(q(".s2-periksa"));
      if (periksa.y0 - pitaBawah < 12) keluh(`the verification group is ${(periksa.y0 - pitaBawah).toFixed(1)} mm below the band`);
      baris[nama] = { nama: hitung(".t-nama"), kursus: hitung(".t-kursus"), sekolah: hitung(".t-sekolah"), arti: hitung(".t-arti") };
      jarak[nama] = { namaKeKepala: nama_.y0 - kepalaBawah, kursusKeRekam: rekam.y0 - kursus.y1, rekamKeGaris: garis - rekam.y1, tautanMm: link.x1 - link.x0, kaki: 297 - Math.max(zona.y1, periksa.y1), nomorKiri: nomor.x0, nomorMm: nomor.x1 - nomor.x0, nomorPt: parseFloat(getComputedStyle(elNomor).fontSize) * 0.75 };
    });
    return { masalah, catatan, baris, jarak };
  }, { px: 96 / 25.4, garis: S.TATA.garis, tenang: S.TENANG, qrMm: S.QR_MM, pitaAtas: S.TATA.garis, pitaBawah: S.TATA.garis + S.TATA.pita, kolom: S.KOLOM_TEKS });
  await ctx.close();
  return r;
})();
catat("");
catat(`LAYOUT CHECKS on ${SEMUA.length} sheets (margins 12 mm for words, 10 mm for the band; the header apart; the achievement inside its space, 14 mm from the header and the record; every record value on one line; nothing across the line; the school inside the band; the link on one line inside its column; the QR's quiet zone ${S.TENANG} modules and clear; the foot clear): ${hasilLetak.masalah.length ? `${hasilLetak.masalah.length} PROBLEM(S)` : "all pass"}`);
for (const m of hasilLetak.masalah) catat(`  ${m}`);
if (hasilLetak.masalah.length) gagal += hasilLetak.masalah.length;
for (const m of hasilLetak.catatan) catat(`  (probe) ${m}`);
catat("  lines (name / course / school / verification sentence) and spaces (mm):");
for (const [n, b] of Object.entries(hasilLetak.baris as Record<string, Record<string, number>>)) {
  const j = hasilLetak.jarak[n];
  catat(`    ${n}: ${b.nama} / ${b.kursus} / ${b.sekolah} / ${b.arti}; name ${f1(j.namaKeKepala)} below the header, course ${f1(j.kursusKeRekam)} above the record, record ${f1(j.rekamKeGaris)} above the line, link ${f1(j.tautanMm)} mm long, foot ${f1(j.kaki)} mm clear`);
}
catat(`  THE NUMBER NEVER BREAKS (ruling 2): one line, exactly as stored, in every sheet above. What adapts when space is tight (the value column starts at ${f1(S.A4.w / 2 + 4)} mm on the axis):`);
for (const n of [{ nama: "A academic", nomor: A.nomor }, ...NOMOR_STRES.map((x) => ({ nama: `C number, ${x.nama}`, nomor: x.nomor }))]) {
  const j = (hasilLetak.jarak as Record<string, Record<string, number>>)[n.nama];
  catat(`    ${n.nomor} (${n.nomor.length} characters): ${f2(j.nomorPt)} pt, ${f1(j.nomorMm)} mm wide, starting at ${f1(j.nomorKiri)} mm${j.nomorKiri < S.A4.w / 2 + 3.9 ? " (the axis moved left)" : ""}${j.nomorPt < S.GAYA.nomor.pt ? " (the type stepped down the ladder)" : ""}`);
}

// ════════════════════════════════════════════════════════════════════════════
// E · The A4 PDF at 100% (made with «Background graphics» off)
// ════════════════════════════════════════════════════════════════════════════
type Hal = { judul: string; html: string; qr?: { isi: string; m: number[][]; kode: string } };
const cetakan = (d: S.Data, o: S.Opsi = {}) => sr(d, { kertas: "", ...o });
const halQr = (judul: string, d: S.Data, kode: string): Hal => ({ judul, html: cetakan(d), qr: { isi: d.isiQr, m: d.matriks, kode } });
const HALAMAN: Hal[] = [
  halQr("A · akademik (usulan)", A, "a"),
  halQr("B · pengembangan profesi (usulan)", P, "p"),
  halQr("C · teks panjang, token 16 karakter", SAMPEL.panjang, "c"),
  { judul: "C · nama satu kata", html: cetakan(SAMPEL.pendek) },
  { judul: "D · skala abu-abu", html: cetakan(A, { abu: true }), qr: { isi: A.isiQr, m: A.matriks, kode: "abu" } },
  halQr(`Kajian QR · byte V${QR["byte-m"].versi}-M (penyandi aplikasi hari ini)`, denganQr(A, { ...QR["byte-m"] }), "byte-m"),
  halQr(`Kajian QR · alfanumerik V${QR["an-m"].versi}-M (terkecil)`, denganQr(A, QR["an-m"]), "an-m"),
  halQr(`Kajian QR · alfanumerik V${QR["an-h"].versi}-H`, denganQr(A, QR["an-h"]), "an-h"),
  halQr(`Kajian QR · token 16, byte V${QR["byte-m-16"].versi}-M`, denganQr(SAMPEL.panjang, QR["byte-m-16"]), "byte-m-16"),
  { judul: "Kajian nomor · 4+4 (A14C D7ST/00001) dan tautan berkelompok (K7M4-QX9P-2HDT)", html: cetakan(P, { nomor44: true, tokenKelompok: true }) },
  { judul: "Kajian · pita selebar kertas, seperti gambar rujukan", html: cetakan(A, { pitaPenuh: true }) },
];
const JUMLAH = HALAMAN.length + 1;
py1("huruf", join(AKAR, "public/fonts/plus-jakarta-sans-latin.woff2"), KERJA);
const sampul = `<div class="a4" style="position:relative;width:210mm;height:297mm;overflow:hidden;background:#fff;page-break-after:always;font-family:'Plus Jakarta Sans';color:${W.tinta}">
<div style="position:absolute;left:24mm;top:24mm;width:162mm">
<p style="margin:0;font:600 13pt 'Plus Jakarta Sans'">Sertifikat PINTAR · putaran 2 · A4</p>
<p style="margin:3mm 0 0;font:600 10pt 'Plus Jakarta Sans'">Cetak pada 100% («Ukuran sebenarnya»). Jangan pilih «Sesuaikan dengan halaman».</p>
<p style="margin:1mm 0 0;font:400 8.5pt 'Plus Jakarta Sans';color:${W.tinta2}">Print at 100% (Actual size); no fit-to-page. This PDF was made with «Background graphics» off, as a browser's print dialog opens: the band and the line print because the sheet asks for its colours.</p>
<p style="margin:6mm 0 2mm;font:600 8.5pt 'Plus Jakarta Sans'">Periksa skala · check the scale</p>
<div style="position:relative;width:100mm;height:4mm;border-bottom:0.2mm solid #000">${[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((x) => `<div style="position:absolute;left:${x - 0.1}mm;bottom:0;width:0;height:${x % 50 ? 2 : 4}mm;border-left:0.2mm solid #000"></div>`).join("")}</div>
<p style="margin:1mm 0 0;font:400 7.5pt 'Plus Jakarta Sans';color:${W.tinta2}">0 — 50 — 100 mm. Jika garis ini bukan tepat 100 mm, pencetak mengubah skala.</p>
<div style="margin-top:5mm;width:${S.QR_MM}mm;height:${S.QR_MM}mm;border:0.2mm solid #000;box-sizing:border-box;display:flex;align-items:center;justify-content:center"><p style="margin:0;font:400 7pt 'Plus Jakarta Sans';color:${W.tinta2}">${S.QR_MM} × ${S.QR_MM} mm</p></div>
<p style="margin:1mm 0 0;font:400 7.5pt 'Plus Jakarta Sans';color:${W.tinta2}">The QR's modules fill exactly this square at 100%.</p>
<p style="margin:8mm 0 2mm;font:600 8.5pt 'Plus Jakarta Sans'">Isi · contents</p>
<ol style="margin:0;padding-left:5mm;font:400 8.5pt/1.6 'Plus Jakarta Sans'" start="2">${HALAMAN.map((h) => `<li>${S.esc(h.judul)}</li>`).join("")}</ol>
<p style="margin:8mm 0 0;font:400 7.5pt/1.5 'Plus Jakarta Sans';color:${W.tinta2}">Halaman 2–${JUMLAH} adalah sertifikat persis seperti tercetak, tanpa catatan apa pun di lembarnya. Semua nama, sekolah, nomor dan token di sini contoh rekaan. QR membuka verifikasi.pintarselalu.com, domain verifikasi PINTAR yang disetujui; alamat ini terbuka setelah domainnya disiapkan, dan token rekaan ini akan terbaca «tidak ditemukan». Uji: pindai QR dengan ponsel dari jarak 20–40 cm; bacakan nomornya kepada orang lain dan minta ia mengetiknya; ketik tautannya di ponsel.</p></div></div>`;
const htmlA4 = halaman("Sertifikat PINTAR · putaran 2 · A4 100%", `<div style="zoom:10">${sampul}${HALAMAN.map((h) => `<div class="a4" style="width:210mm;height:297mm;overflow:hidden;background:#fff;page-break-after:always">${h.html}</div>`).join("")}</div>`,
  `@page { size: A4; margin: 0; } body { background: #fff; } .a4:last-child { page-break-after: auto; }`, KERJA);
const PDF = join(RENDER, "E-A4-100persen-tanpa-sesuaikan.pdf");
{
  const f = join(KERJA, "E-A4.html");
  writeFileSync(f, htmlA4);
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: PDF, width: "210mm", height: "297mm", scale: 0.1, printBackground: false, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
  await ctx.close();
}
const geometri = JSON.parse(py1("a4", PDF)) as { halaman: number; ukuran_mm: number[]; per_halaman: Array<Array<[string, number, number, number, number]>>; fonts: string[] };
catat("");
catat(`E · PDF: ${geometri.halaman} pages, set to ${geometri.ukuran_mm.join(" × ")} mm. Fonts embedded: ${geometri.fonts.join(", ")}. Made with «Background graphics» off.`);
if (geometri.halaman !== JUMLAH || Math.abs(geometri.ukuran_mm[0] - 210) > 0.01 || Math.abs(geometri.ukuran_mm[1] - 297) > 0.01) { gagal++; catat("  ^ the PDF is not one A4 page per certificate"); }
if (geometri.fonts.some((f) => /Type3/.test(f))) { gagal++; catat("  a Type3 font is embedded"); }
const dekat = (a: string, b: string) => [1, 3, 5].every((i) => Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)) <= 2);
const kiriGrup = (S.A4.w - (S.KOLOM_TEKS + S.CELAH_QR + S.QR_MM)) / 2;
const QR_X = kiriGrup + S.KOLOM_TEKS + S.CELAH_QR, QR_Y = S.TATA.verifikasi;
for (let i = 1; i < geometri.halaman; i++) {
  const h = HALAMAN[i - 1];
  const bentuk = geometri.per_halaman[i];
  const abu = h.judul.includes("abu");
  const emas = bentuk.filter((b) => dekat(b[0], abu ? S.abuHex(W.emas) : W.emas));
  const pita = bentuk.filter((b) => [AK, PR, S.abuHex(AK)].some((c) => dekat(b[0], c)) && b[4] > 8);
  const hijau = bentuk.filter((b) => dekat(b[0], abu ? S.abuHex(W.hijau) : W.hijau) && b[3] > 20);
  const penuh = h.judul.includes("selebar");
  const x0 = penuh ? 0 : S.TATA.sisiPita;
  const garisOk = emas.length === 1 && Math.abs(emas[0][4] - S.GARIS_MM) < 0.02 && Math.abs(emas[0][2] + emas[0][4] / 2 - S.TATA.garis) < 0.05 && Math.abs(emas[0][1] - x0) < 0.05;
  const pitaOk = pita.length === 1 && Math.abs(pita[0][1] - x0) < 0.05 && Math.abs(pita[0][2] - S.TATA.garis) < 0.05 && Math.abs(pita[0][4] - S.TATA.pita) < 0.05;
  const sisi = hijau.length ? hijau[0][3] : 0;
  const qrOk = hijau.length === 1 && Math.abs(sisi - S.QR_MM) < 0.1 && Math.abs(hijau[0][1] - QR_X) < 0.1 && Math.abs(hijau[0][2] - QR_Y) < 0.1;
  catat(`  page ${i + 1} ${h.judul}: gold line ${emas.map((b) => `${f2(b[3])} × ${f3(b[4])} mm, centre ${f2(b[2] + b[4] / 2)} mm`).join("; ") || "MISSING"}; band ${pita.map((b) => `${f2(b[3])} × ${f2(b[4])} mm at x ${f2(b[1])}`).join("; ") || "MISSING"}; QR ${f2(sisi)} mm at (${hijau.length ? `${f2(hijau[0][1])}, ${f2(hijau[0][2])}` : "—"})`);
  if (!garisOk || !pitaOk || !qrOk) { gagal++; catat("    ^ geometry differs from the grammar"); }
}

// ════════════════════════════════════════════════════════════════════════════
// The QR study: decode and stress with round 1's method; damage; module size
// ════════════════════════════════════════════════════════════════════════════
type HasilUji = { kode: string; nama: string; uji: Array<{ nama: string; zxing: boolean; opencv: boolean }>; batas?: Record<"zxing" | "opencv", { dpi: number | null; blur_px: number | null; kontras: number | null; miring: number | null }> };
const tenangMm = (m: number[][]) => (S.TENANG * S.QR_MM) / m.length;
const kasusQr = HALAMAN.flatMap((h, i) => {
  if (!h.qr) return [];
  const q = tenangMm(h.qr.m);
  return [{ kode: h.qr.kode, nama: h.judul, halaman: i + 1, kotak: [QR_X - q, QR_Y - q, S.QR_MM + 2 * q, S.QR_MM + 2 * q], simpan: join(KERJA, `qr-${h.qr.kode}.png`), url: h.qr.isi, tenang: q }];
});
// round 1's own symbol, from round 1's own PDF, under the same tests
const R1_PDF = join(R1DIR, "render/J-A4-100persen.pdf");
const R1_X = R1.A4.w - R1.TATA.tepi - R1.QR_MM, R1_Y = R1.TATA.rekamAtas + 0.6, R1_Q = (R1.TENANG * R1.QR_MM) / R1_M.length;
const uji: HasilUji[] = [];
for (const isi of [...new Set(kasusQr.map((k) => k.url))]) {
  const f = join(KERJA, `manifest-${uji.length}.json`);
  writeFileSync(f, JSON.stringify({ url: isi, pdf: PDF, kasus: kasusQr.filter((k) => k.url === isi) }));
  const out = join(KERJA, `uji-${uji.length}.json`);
  py1("uji", f, out);
  uji.push(...(JSON.parse(readFileSync(out, "utf8")) as HasilUji[]));
}
if (existsSync(R1_PDF)) {
  const f = join(KERJA, "manifest-r1.json");
  writeFileSync(f, JSON.stringify({ url: R1_URL, pdf: R1_PDF, kasus: [{ kode: "r1-v5", nama: "Round 1 · Modern academic (its own PDF)", halaman: 1, kotak: [R1_X - R1_Q, R1_Y - R1_Q, R1.QR_MM + 2 * R1_Q, R1.QR_MM + 2 * R1_Q], simpan: join(KERJA, "qr-r1.png") }] }));
  py1("uji", f, join(KERJA, "uji-r1.json"));
  uji.push(...(JSON.parse(readFileSync(join(KERJA, "uji-r1.json"), "utf8")) as HasilUji[]));
}
writeFileSync(join(RENDER, "uji-qr.json"), JSON.stringify(uji, null, 1));
// damage: a grey patch grown over the symbol, clear of the finders
const kasusRusak = [
  ...kasusQr.filter((k) => ["a", "byte-m", "an-m", "an-h", "c", "byte-m-16"].includes(k.kode)).map((k) => ({ kode: k.kode, nama: k.nama, halaman: k.halaman, kotak: [QR_X, QR_Y, S.QR_MM], tenang: k.tenang, url: k.url, simpan: join(KERJA, `rusak-${k.kode}.png`), pdf: PDF })),
  ...(existsSync(R1_PDF) ? [{ kode: "r1-v5", nama: "Round 1 · Modern academic", halaman: 1, kotak: [R1_X, R1_Y, R1.QR_MM], tenang: R1_Q, url: R1_URL, simpan: join(KERJA, "rusak-r1.png"), pdf: R1_PDF }] : []),
];
type Rusak = { kode: string; nama: string; batas: Record<string, number> };
const rusak: Rusak[] = [];
for (const pdf of [...new Set(kasusRusak.map((k) => k.pdf))]) {
  const f = join(KERJA, `rusak-${rusak.length}.json`);
  writeFileSync(f, JSON.stringify({ pdf, kasus: kasusRusak.filter((k) => k.pdf === pdf) }));
  rusak.push(...(JSON.parse(py2("rusak", f)) as Rusak[]));
}
const QR_HAL: Record<string, Qr> = { a: QR[PILIHAN], p: QR[PILIHAN], abu: QR[PILIHAN], c: QR[PILIHAN_16], "byte-m": QR["byte-m"], "an-m": QR["an-m"], "an-h": QR["an-h"], "byte-m-16": QR["byte-m-16"], "r1-v5": QR_R1 };
catat("");
catat(`QR SYMBOLS for the 48-character link (12-character token) and the 52-character one (16): version and modules; at ${S.QR_MM} mm the module size.`);
for (const q of [...Object.values(QR), QR_R1]) catat(`  ${q.kode.padEnd(10)} ${q.nama}: version ${q.versi}-${q.ecc}, ${q.matriks.length} modules, ${f3(modulMm(q))} mm a module (${q.isi.length} characters; ${q.sumber})`);
catat(`  Smaller: uppercase alphanumeric. At M it is version ${QR["an-m"].versi} against byte's ${QR["byte-m"].versi}; at the same version as byte M it carries Q (25% recovery) where byte carries M (15%). Round 1's link needed version ${QR_R1.versi}.`);
catat("");
catat(`QR DECODE TESTS from the PDF at 300 dpi (round 1's method: zxing-cpp and OpenCV; PASS = the exact text came back)`);
const PX_PER_MM_PONSEL = 4000 / (2 * Math.tan((35 * Math.PI) / 180) * 1000); // a 12 MP phone, 70° across 4000 px: pixels per mm at 1 m
for (const u of uji) {
  const q = QR_HAL[u.kode.replace("·sheet", "")];
  catat(`  ${u.kode} ${u.nama}${q ? ` [V${q.versi}-${q.ecc}, ${f3(modulMm(q))} mm]` : ""}: zxing ${u.uji.filter((x) => x.zxing).length}/${u.uji.length}, opencv ${u.uji.filter((x) => x.opencv).length}/${u.uji.length}`);
  for (const x of u.uji) if (!x.zxing || !x.opencv) catat(`      ${x.nama}: zxing ${x.zxing ? "PASS" : "FAIL"}, opencv ${x.opencv ? "PASS" : "FAIL"}`);
  if (u.batas && q) for (const dec of ["zxing", "opencv"] as const) {
    const x = u.batas[dec];
    const modulPx = x.dpi ? (x.dpi / 25.4) * modulMm(q) : null;
    // the farthest a 12 MP phone camera still gives the symbol that many pixels a module
    const jauh = modulPx ? (PX_PER_MM_PONSEL * modulMm(q)) / modulPx : null;
    catat(`      ${dec} limits: down to ${x.dpi} dpi (${modulPx ? f2(modulPx) : "—"} px a module; about ${jauh ? f2(jauh) : "—"} m for a 12 MP phone); blur up to sigma ${x.blur_px} px; contrast down to ${x.kontras}; tilt up to ${x.miring} deg`);
  }
  // a certificate's own symbol must read at actual size; a study symbol's result is reported, not counted
  const sertifikatSendiri = ["a", "p", "c", "abu"].includes(u.kode);
  if (!u.uji[0].zxing || !u.uji[0].opencv) { if (sertifikatSendiri) gagal++; else catat("      ^ a study symbol, not the proposal: reported, not counted"); }
}
catat("");
catat("DAMAGE TOLERANCE: a grey patch over the lower-right of the symbol (a stain, a stamp's edge, a fold's wear), grown in 1% steps of the symbol's area; the largest each decoder still reads through");
for (const r of rusak) {
  const q = QR_HAL[r.kode];
  catat(`  ${r.kode.padEnd(10)} ${q ? `V${q.versi}-${q.ecc}` : ""}: zxing ${r.batas["zxing@300"]}% (150 dpi ${r.batas["zxing@150"]}%), opencv ${r.batas["opencv@300"]}% (150 dpi ${r.batas["opencv@150"]}%)`);
}

// ════════════════════════════════════════════════════════════════════════════
// D · Greyscale and office print, simulated from the PDF; decoded again
// ════════════════════════════════════════════════════════════════════════════
type Sim = { kode: string; nama: string; sim: Record<string, { uji: Record<string, { zxing: boolean; opencv: boolean }>; modul: number; latar: number }> };
const SIM_NAMA: Record<string, string> = { warna: "office colour print", mono: "monochrome laser", hemat: "toner-saving (55% density)", f4_atas: "A4 on F4, top-left", f4_tengah: "A4 on F4, centred" };
const sim: Sim[] = [];
for (const [kode, nama, hal, isi] of [["a", "A · academic", 1, A.isiQr], ["p", "B · professional", 2, P.isiQr]] as const) {
  const f = join(KERJA, `cetak-${kode}.json`);
  writeFileSync(f, JSON.stringify({ url: isi, pdf: PDF, kasus: [{ kode, nama, halaman: hal, qr: [QR_X, QR_Y, S.QR_MM, S.QR_MM], simpan: join(KERJA, `D-${kode}`) }] }));
  sim.push(...(JSON.parse(py1("cetak", f)) as Sim[]));
}
catat("");
catat("D · PRINT SIMULATIONS from the PDF (300 dpi; an estimate, not a proof: the real test is printing E)");
for (const s_ of sim) for (const [k, v] of Object.entries(s_.sim)) {
  const lulus = Object.values(v.uji).filter((u) => u.zxing && u.opencv).length;
  catat(`  ${s_.nama} · ${SIM_NAMA[k]}: QR modules ${v.modul} on ${v.latar} (0-255); decoded by both in ${lulus}/${Object.keys(v.uji).length} (${Object.entries(v.uji).map(([n, u]) => `${n} ${u.zxing ? "z" : "-"}${u.opencv ? "o" : "-"}`).join(", ")})`);
  if (!v.uji["300 dpi"].zxing || !v.uji["300 dpi"].opencv) gagal++;
}
// an office printer's unprintable margin, on the inset band and on the reference's full-bleed band
const TEPI = { laser: [4.2, 4.2, 4.2, 4.2], inkjet: [3, 3, 3, 12] } as const;
{
  const f = join(KERJA, "tepi.json");
  const penuh = HALAMAN.findIndex((h) => h.judul.includes("selebar")) + 1;
  writeFileSync(f, JSON.stringify({ pdf: PDF, kasus: [
    { halaman: 1, tepi: TEPI.laser, simpan: join(KERJA, "tepi-sisip-laser.png") },
    { halaman: penuh, tepi: TEPI.laser, simpan: join(KERJA, "tepi-penuh-laser.png") },
    { halaman: penuh, tepi: TEPI.inkjet, simpan: join(KERJA, "tepi-penuh-inkjet.png") },
  ] }));
  py2("tepi", f);
}
{
  const img = (n: string) => `file://${join(KERJA, n)}`;
  const kolom = ["warna", "mono", "hemat"];
  const crop = (src: string, x: number, y: number, w: number, h: number, lebarSumber = 210) => `<div style="width:${w}mm;height:${h}mm;overflow:hidden;position:relative;border:0.2mm solid rgba(31,42,51,.15)"><img src="${src}" style="position:absolute;left:${-x}mm;top:${-y}mm;width:${lebarSumber}mm"></div>`;
  const lajur = (kode: string, d: S.Data, judul: string) => `<h2>${judul}</h2><div class="baris">
<div style="width:58mm">${kecil(sr(d), 58)}<p class="ket"><b>Screen</b>: warm paper #FBFAF7</p></div>
<div style="width:58mm">${kecil(sr(d, { abu: true, kertas: "" }), 58)}<p class="ket"><b>Greyscale</b> (the grammar's own grey conversion)</p></div>
${kolom.map((k) => `<div style="width:58mm"><img class="bayang" src="${img(`D-${kode}-${k}.png`)}" style="width:58mm;display:block"><p class="ket"><b>${SIM_NAMA[k]}</b> on white paper</p></div>`).join("")}</div>
<div class="baris" style="margin-top:-4mm">${kolom.map((k) => `<div>${crop(img(`D-${kode}-${k}.png`), 70, S.TATA.garis - 5, 70, 10)}<p class="ket" style="margin-top:1mm">${SIM_NAMA[k]}: the line on the band, actual size</p></div>`).join("")}
<div>${crop(img(`D-${kode}-hemat.png`), QR_X - 4, QR_Y - 4, S.QR_MM + 8, S.QR_MM + 8)}<p class="ket" style="margin-top:1mm">QR, toner-saving</p></div></div>`;
  const tabel = sim.map((s_) => `<tr><td><b>${s_.nama}</b></td>${Object.keys(SIM_NAMA).map((k) => { const v = s_.sim[k]; const l = Object.values(v.uji).filter((u) => u.zxing && u.opencv).length; return `<td>${l}/${Object.keys(v.uji).length} · ${v.modul}/${v.latar}</td>`; }).join("")}</tr>`).join("");
  // the band's left end at the paper's edge, ×3: 24 × 44 mm of the sheet
  const tepiKolom = (n: string, ket: string) => `<div style="width:72mm"><div class="bayang" style="width:72mm;height:132mm;overflow:hidden;position:relative;background:#fff"><img src="${img(n)}" style="position:absolute;left:0;top:${-3 * (S.TATA.garis - 5)}mm;width:${3 * 210}mm"><div style="position:absolute;left:0;top:0;bottom:0;border-left:0.3mm dashed #8A5F00"></div></div><p class="ket">${ket}</p></div>`;
  await potret(halaman("D", `<div class="lembar" style="width:${5 * 58 + 4 * 8}mm">
<h1>D · Greyscale and office print</h1>
<p class="sub">Simulated from the PDF (E) at 300 dpi with round 1's method: office colour is the page through a CMYK profile with 15% dot gain and 0.04 mm ink spread; monochrome is luminance with the same gain; toner-saving is monochrome at 55% density. In greyscale plum and sage become nearly the same grey (${S.abuHex(AK)} and ${S.abuHex(PR)}); the certificate still says everything, because the band's meaning is in its words («Diterbitkan oleh», the school) and the context is in the course title. Nothing on the sheet depends on the colour.</p>
${lajur("a", A, "A · academic (plum)")}${lajur("p", P, "B · professional learning (sage)")}
<h2>The printer's own margin: why the band stops ${S.TATA.sisiPita} mm from the edge (the band's left end, ×3; the dashed line is the paper's edge)</h2><div class="baris">
${tepiKolom("tepi-penuh-laser.png", `<b>Full bleed, as the reference drew it, from an office laser</b> (${TEPI.laser[0]} mm it cannot print on every side): the band ends in a white sliver at both edges, of a width that differs by printer.`)}
${tepiKolom("tepi-penuh-inkjet.png", `<b>The same from an inkjet</b> (${TEPI.inkjet[0]} mm sides): a narrower sliver, never the same twice.`)}
${tepiKolom("tepi-sisip-laser.png", `<b>Inset ${S.TATA.sisiPita} mm (this round), from the same laser</b>: the band prints whole, with the same margin on every printer, and the line ends with it.`)}
<div style="width:${5 * 58 + 4 * 8 - 3 * 72 - 3 * 8}mm"><table class="spek"><tr><th>QR after print</th>${Object.values(SIM_NAMA).map((n) => `<th>${n}</th>`).join("")}</tr>${tabel}</table><p class="ket">Each cell: decode tests passed by both decoders (actual size, 150 dpi, blur, the whole page at 150 dpi) · module / quiet-zone grey (0 black, 255 white).</p></div></div></div>`),
    "D-abu-dan-cetak-kantor.png", { lebar: Math.ceil(mmPx(5 * 58 + 4 * 8 + 16)), skala: 2.5 });
}

// ════════════════════════════════════════════════════════════════════════════
// The number and the link: what a PDF viewer and a browser hand back
// ════════════════════════════════════════════════════════════════════════════
const PDF_NOMOR = join(KERJA, "nomor.pdf");
const VARIAN_NOMOR = [
  { kode: "utuh", nama: "unbroken, as stored", o: {} },
  { kode: "spasi", nama: "4+4 with a space", o: { nomor44: true } },
  { kode: "celah", nama: "4+4 as a gap, no space character", o: { nomorCelah: true } },
] as const;
{
  const html = halaman("nomor", `<div style="zoom:10">${VARIAN_NOMOR.map((v) => `<div class="a4" style="width:210mm;height:297mm;overflow:hidden;background:#fff;page-break-after:always">${cetakan(P, { ...v.o, tokenKelompok: false })}</div>`).join("")}</div>`, "@page { size: A4; margin: 0; } body{background:#fff}", KERJA);
  const f = join(KERJA, "nomor.html");
  writeFileSync(f, html);
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: PDF_NOMOR, width: "210mm", height: "297mm", scale: 0.1, printBackground: false, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
  await ctx.close();
}
type HasilTeks = { halaman: number; cari: Record<string, boolean>; kata_nomor: string[]; ada_di_teks: Record<string, boolean> };
const hasilTeks = JSON.parse(py2("teks", PDF_NOMOR, JSON.stringify(VARIAN_NOMOR.map((_, i) => ({ halaman: i, awal: P.nomor.slice(0, 4), cari: { tersimpan: P.nomor, spasi: S.nomor44(P.nomor), tautan: P.tautan } }))))) as HasilTeks[];
// on screen: a double-click on the number's first character, and a copy of the whole value
const layar = await (async () => {
  const f = join(KERJA, "nomor-layar.html");
  writeFileSync(f, halaman("nomor", `<div style="display:flex;gap:10mm;padding:10mm">${VARIAN_NOMOR.map((v) => `<div data-v="${v.kode}">${sr(P, v.o)}</div>`).join("")}</div>`));
  const ctx = await browser.newContext({ viewport: { width: 2600, height: 1300 } });
  const p = await ctx.newPage();
  await p.addInitScript("window.__name = (f) => f");
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  const out: Record<string, { klikGanda: string; salin: string; tautanKlikGanda: string }> = {};
  for (const v of VARIAN_NOMOR) {
    const el = p.locator(`[data-v="${v.kode}"] .t-nomor`);
    const b = await el.boundingBox();
    await p.mouse.dblclick(b!.x + 4, b!.y + b!.height / 2);
    const klikGanda = await p.evaluate(() => window.getSelection()!.toString());
    const salin = await p.evaluate((k: string) => { const e = document.querySelector(`[data-v="${k}"] .t-nomor`)!; const r = document.createRange(); r.selectNodeContents(e); const s = window.getSelection()!; s.removeAllRanges(); s.addRange(r); return s.toString(); }, v.kode);
    // near the end of the link's own text (the paragraph is wider than its words)
    const ujung = await p.evaluate((k: string) => { const e = document.querySelector(`[data-v="${k}"] .t-tautan`)!; const r = document.createRange(); r.selectNodeContents(e); const b = r.getBoundingClientRect(); return { x: b.right - 5, y: b.top + b.height / 2 }; }, v.kode);
    await p.mouse.dblclick(ujung.x, ujung.y);
    const tautanKlikGanda = await p.evaluate(() => window.getSelection()!.toString());
    out[v.kode] = { klikGanda, salin, tautanKlikGanda };
  }
  await ctx.close();
  return out;
})();
catat("");
catat(`THE NUMBER (${P.nomor}): what a reader gets back from each printed form (PyMuPDF for the PDF; Chromium for the screen)`);
VARIAN_NOMOR.forEach((v, i) => {
  const h = hasilTeks[i], l = layar[v.kode];
  catat(`  ${v.nama}: PDF search for the stored form ${h.cari.tersimpan ? "FINDS it" : "does not find it"}; for «${S.nomor44(P.nomor)}» ${h.cari.spasi ? "finds it" : "does not"}; the PDF's words: ${h.kata_nomor.map((w) => `«${w}»`).join(" ")}; on screen a double-click on its first character selects «${l.klikGanda}», and copying the value gives «${l.salin}»`);
});
catat(`  the link: a double-click on the token selects «${layar.utuh.tautanKlikGanda}»; the PDF search for «${P.tautan}» ${hasilTeks[0].cari.tautan ? "finds it" : "does not find it"}`);
if (!hasilTeks[0].cari.tersimpan || !hasilTeks[0].cari.tautan) { gagal++; catat("  ^ the unbroken number or the link cannot be found in its own PDF"); }

// ── IBM Plex Mono at certificate size: the pairs a reader could confuse ──────
/** the brief's pairs, 6/G, and E/F: a reference pair nobody confuses in print, to read the scores against */
const PASANGAN = [["0", "D"], ["1", "7"], ["2", "Z"], ["5", "S"], ["8", "B"], ["6", "G"], ["E", "F"]] as const;
const HURUF_UJI = [...new Set(PASANGAN.flat())];
{
  const kotakHuruf = (c: string, pt: number) => `<span class="g" data-c="${c}" data-pt="${pt}" style="display:inline-block;width:${pt * 0.6 * 1.6}pt;height:${pt * 1.4}pt;line-height:${pt * 1.4}pt;text-align:center;font:500 ${pt}pt 'IBM Plex Mono';color:#000;background:#fff">${c}</span>`;
  const html = halaman("huruf", `<div style="padding:4mm;background:#fff">${[S.GAYA.nomor.pt, S.GAYA.tautan.pt].map((pt) => `<div>${HURUF_UJI.map((c) => kotakHuruf(c, pt)).join("")}</div>`).join("")}</div>`, "body{background:#fff}");
  const f = join(KERJA, "huruf.html");
  writeFileSync(f, html);
  const ctx = await browser.newContext({ viewport: { width: 800, height: 400 }, deviceScaleFactor: 300 / 96 });
  const p = await ctx.newPage();
  await p.goto(`file://${f}`);
  await p.evaluate(() => document.fonts.ready);
  for (const pt of [S.GAYA.nomor.pt, S.GAYA.tautan.pt]) for (const c of HURUF_UJI) await p.locator(`.g[data-c="${c}"][data-pt="${pt}"]`).screenshot({ path: join(KERJA, `g-${pt}-${c}.png`) });
  await ctx.close();
}
type Beda = { pt: number; a: string; b: string; tajam: number; kabur: number; kasar: number };
const beda = JSON.parse(execFileSync(PY, ["-c", `
import cv2, json, sys, numpy as np
k = sys.argv[1]; pasangan = json.loads(sys.argv[2]); pts = json.loads(sys.argv[3])
out = []
def baca(pt, c):
    g = cv2.imread(f"{k}/g-{pt}-{c}.png", cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
    return 1 - g  # ink
def beda(a, b):
    # the share of ink that differs once the two glyphs are aligned on their boxes (0 same, 1 nothing shared)
    h = min(a.shape[0], b.shape[0]); w = min(a.shape[1], b.shape[1]); a = a[:h, :w]; b = b[:h, :w]
    return float(np.abs(a - b).sum() / max(1e-6, np.maximum(a, b).sum()))
for pt in pts:
    for x, y in pasangan:
        a, b = baca(pt, x), baca(pt, y)
        s = a.shape[1] / 1.0
        kab = lambda g: cv2.GaussianBlur(g, (0, 0), 1.5)  # an office copy at 300 dpi
        kas = lambda g: cv2.resize(cv2.resize(g, None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA), (g.shape[1], g.shape[0]), interpolation=cv2.INTER_LINEAR)  # 150 dpi, a phone photo
        out.append({"pt": pt, "a": x, "b": y, "tajam": round(beda(a, b), 3), "kabur": round(beda(kab(a), kab(b)), 3), "kasar": round(beda(kas(kab(a)), kas(kab(b))), 3)})
print(json.dumps(out))
`, KERJA, JSON.stringify(PASANGAN), JSON.stringify([S.GAYA.nomor.pt, S.GAYA.tautan.pt])]).toString()) as Beda[];
catat("");
catat(`IBM PLEX MONO at certificate size (the number at ${S.GAYA.nomor.pt} pt: cap height ${f2((S.GAYA.nomor.pt * 25.4 / 72) * 0.698)} mm; the link at ${S.GAYA.tautan.pt} pt: ${f2((S.GAYA.tautan.pt * 25.4 / 72) * 0.698)} mm). Share of ink that differs between the two glyphs of a pair (0 = identical): sharp at 300 dpi / an office copy (blur 1.5 px) / that copy photographed at 150 dpi`);
for (const b of beda) catat(`  ${b.pt} pt ${b.a}/${b.b}: ${f3(b.tajam)} / ${f3(b.kabur)} / ${f3(b.kasar)}`);
const acuan = beda.find((b) => b.a === "E" && b.pt === S.GAYA.nomor.pt)!;
const palingMirip = [...beda].filter((b) => b.a !== "E").sort((x, y) => x.kasar - y.kasar)[0];
catat(`  closest pair after copying and photographing: ${palingMirip.a}/${palingMirip.b} at ${palingMirip.pt} pt (${f3(palingMirip.kasar)}); the reference pair E/F, which nobody confuses in print, scores ${f3(acuan.kasar)} at ${acuan.pt} pt. Crockford Base32 has no I, L, O or U, so 1/I, 1/L and 0/O cannot arise.`);

// ════════════════════════════════════════════════════════════════════════════
// F · The verification detail
// ════════════════════════════════════════════════════════════════════════════
{
  const u = (kode: string) => uji.find((x) => x.kode === kode);
  const r = (kode: string) => rusak.find((x) => x.kode === kode);
  const baris = (kode: string, q: Qr) => {
    const x = u(kode), d = r(kode);
    const z = x?.batas?.zxing, o = x?.batas?.opencv;
    return `<tr><td><b>${kode === "a" ? "PROPOSAL · " : ""}${q.nama}</b></td><td>V${q.versi}-${q.ecc}</td><td>${q.matriks.length}</td><td>${f3(modulMm(q))} mm</td><td>${x ? `${x.uji.filter((y) => y.zxing && y.opencv).length}/${x.uji.length}` : "—"}</td><td>${z ? `${z.dpi} / ${o?.dpi}` : "—"}</td><td>${z ? `${z.blur_px} / ${o?.blur_px}` : "—"}</td><td>${d ? `${d.batas["zxing@300"]}% / ${d.batas["opencv@300"]}%` : "—"}</td></tr>`;
  };
  const simbol = (q: Qr, judul: string) => `<div style="width:${S.QR_MM + 2 * tenangMm(q.matriks) + 2}mm"><div style="background:#fff;width:max-content">${R1.svgQr(q.matriks, S.QR_MM, "", W.hijau)}</div><p class="ket"><b>${judul}</b><br>V${q.versi}-${q.ecc} · ${q.matriks.length} modules · ${f3(modulMm(q))} mm</p></div>`;
  const kiriV = (S.A4.w - (S.KOLOM_TEKS + S.CELAH_QR + S.QR_MM)) / 2 - 6;
  const potong = (d: S.Data, o: S.Opsi = {}) => `<div style="width:${S.KOLOM_TEKS + S.CELAH_QR + S.QR_MM + 12}mm;height:40mm;overflow:hidden;position:relative;background:#fff" class="bayang"><div style="position:absolute;left:${-kiriV}mm;top:${-(S.TATA.verifikasi - 6)}mm">${sr(d, { kertas: "", ...o })}</div></div>`;
  const nomorBaris = VARIAN_NOMOR.map((v, i) => `<tr><td><b>${v.nama}</b></td><td class="mono">${v.kode === "celah" ? `${S.esc(P.nomor.slice(0, 4))}<span style="margin-left:0.5em">${S.esc(P.nomor.slice(4))}</span>` : S.esc(v.kode === "spasi" ? S.nomor44(P.nomor) : P.nomor)}</td><td>${hasilTeks[i].cari.tersimpan ? "yes" : "no"}</td><td class="mono">${hasilTeks[i].kata_nomor.map((w) => S.esc(w)).join(" · ")}</td><td class="mono">${S.esc(layar[v.kode].klikGanda)}</td><td class="mono">${S.esc(layar[v.kode].salin)}</td></tr>`).join("");
  const pasangan = PASANGAN.map(([a, b]) => { const x = beda.find((y) => y.pt === S.GAYA.nomor.pt && y.a === a)!; return `<td style="text-align:center;padding-right:6mm${a === "E" ? ";color:#5F6A73" : ""}"><span class="mono" style="font-size:${S.GAYA.nomor.pt}pt">${a}${b}</span><br><span class="mono" style="font-size:${S.GAYA.nomor.pt * 4}pt;line-height:1">${a}${b}</span><br>${f3(x.kasar)}${a === "E" ? "<br>reference" : ""}</td>`; }).join("");
  await potret(halaman("F", `<div class="lembar" style="width:300mm">
<h1>F · The verification detail: the QR, the printed link, the number</h1>
<p class="sub">Everything at actual size unless marked. The QR holds the full https link; the sheet prints it without the protocol. Tests are round 1's (zxing-cpp and OpenCV on the PDF at 300 dpi, then scaled down, blurred, tilted, faded, and all at once with noise and JPEG), plus a damage sweep. Proposal: uppercase alphanumeric at level Q, version ${QR[PILIHAN].versi} for a 12- or a 16-character token alike.</p>
<h2>The verification area as printed (the proposal, 12- and 16-character tokens)</h2>
<div class="baris">${potong(A)}${potong(SAMPEL.panjang)}</div>
<h2>The symbols at actual size</h2>
<div class="baris">${simbol(QR_R1, "Round 1 · 83 characters, byte")}${simbol(QR["byte-m"], "48, byte (app today)")}${simbol(QR["an-m"], "48, alphanumeric M")}${simbol(QR["an-q"], "48, alphanumeric Q · proposal")}${simbol(QR["an-h"], "48, alphanumeric H")}${simbol(QR["an-q-16"], "52, alphanumeric Q · 16-char")}</div>
<table class="spek" style="margin-bottom:6mm"><tr><th>Symbol (on a certificate page of E)</th><th>Version</th><th>Modules</th><th>Module</th><th>Decode tests passed by both</th><th>Lowest dpi read (zxing / OpenCV)</th><th>Most blur read, px</th><th>Largest patch read (300 dpi)</th></tr>
${baris("r1-v5", QR_R1)}${baris("byte-m", QR["byte-m"])}${baris("an-m", QR["an-m"])}${baris("a", QR[PILIHAN])}${baris("an-h", QR["an-h"])}${baris("byte-m-16", QR["byte-m-16"])}${baris("c", QR[PILIHAN_16])}</table>
<h2>The printed link</h2>
<div class="baris" style="margin-bottom:4mm"><div><p class="mono" style="font-size:${S.GAYA.tautan.pt}pt;margin:0">${S.esc(L12.cetak)}</p><p class="ket">12 characters, as printed: ${L12.cetak.length} characters, ${f1(L12.cetak.length * 0.6 * S.GAYA.tautan.pt * 25.4 / 72)} mm. On screen a double-click on the token selects the token alone (on B: «${S.esc(layar.utuh.tautanKlikGanda)}»); a PDF search finds the whole printed link.</p></div>
<div><p class="mono" style="font-size:${S.GAYA.tautan.pt}pt;margin:0">${S.esc(L16.cetak)}</p><p class="ket">16 characters: ${L16.cetak.length} characters, ${f1(L16.cetak.length * 0.6 * S.GAYA.tautan.pt * 25.4 / 72)} mm.</p></div>
<div><p class="mono" style="font-size:${S.GAYA.tautan.pt}pt;margin:0">${S.esc(S.tautanKelompok(L12.cetak))}</p><p class="ket">Grouped (study): only if Bob's route ignores the hyphens, as Crockford decoding does. Not proposed.</p></div></div>
<h2>The number: what a reader gets back (${P.nomor}, the card's sample ID)</h2>
<table class="spek" style="margin-bottom:6mm"><tr><th>Printed as</th><th>Looks like</th><th>PDF search for the stored form</th><th>PDF words</th><th>Double-click on screen selects</th><th>Copying the value gives</th></tr>${nomorBaris}</table>
<h2>IBM Plex Mono at ${S.GAYA.nomor.pt} pt: the pairs a reader could confuse (actual size, ×4, and the share of ink that differs after an office copy photographed at 150 dpi)</h2>
<table class="spek"><tr>${pasangan}</tr></table></div>`),
    "F-verifikasi-detail.png", { lebar: Math.ceil(mmPx(316)), skala: 2.5 });
}

// ════════════════════════════════════════════════════════════════════════════
// H · Before and after: round 1's Modern (dd292f6) against round 2. Yazid's
//     reference image is not shown (D-082(b)) and is never read by this script:
//     it never enters the repository, not even as a thumbnail.
// ════════════════════════════════════════════════════════════════════════════
{
  // round 1's own sample and grammar, as it was
  const r1 = R1.sertifikat("MODERN", { sekolah: "SMP Cahaya Kaliandra", nama: "Bagas Saputra", kursus: "Matematika · Bab 4: Sistem Persamaan Linear", predikat: "Sangat Baik", tanggal: TGL, nomor: "PINTAR/SMP-CAHAYA-KALIANDRA/2026/00042", url: R1_URL, matriks: R1_M, konteks: "ACADEMIC" }, KATA);
  const PERUBAHAN: Array<[string, string, string, string]> = [
    ["Axis", "Left-aligned on a 24 mm margin", "One centred axis on a 20 mm margin", "Yazid's composition. A centred sheet reads as a certificate at first glance."],
    ["Header", "«SERTIFIKAT PENGUASAAN» alone, 10.5 pt; «PINTAR SELALU» a 7 pt colophon at the foot", "«SERTIFIKAT PENGUASAAN» upper-left in the accent, «PINTAR SELALU» upper-right in PINTAR green, both 12 pt capitals, in type", "Decided (D-074, D-076): the pair names what the paper is and whose system proves it, at one level, before the name."],
    ["Achievement", "Name, «telah menuntaskan», course and Predikat sat on the line and grew upward", "Name 33 pt, «telah menuntaskan» 12 pt, course 16.5 pt, centred in the space between the header and the record", "The name dominates; the course stays directly under the statement; a long name or course re-centres instead of climbing."],
    ["Record", "Predikat under the course; date and number at the foot, left", "Predikat, Tanggal terbit, Nomor sertifikat as one block of three rows, labels meeting values at the axis, 16 mm above the line", "Decided: one restrained record block. Labels right-aligned to the axis keep the block centred whatever the value lengths."],
    ["Number", "PINTAR/SMP-CAHAYA-KALIANDRA/2026/00042: carries the school's slug and the year, up to 70 characters, broken over two lines", "A14CD7ST/00001: the holder's PINTAR ID and their sequence, 14 characters, Plex Mono 12 pt, one indivisible value that never breaks", "Nothing mutable in the number. Unbroken, it is the one string a reader can search and copy (F). Approved 30 Sep, for students too (C17)."],
    ["Band", "Inset 12 mm, 5 mm padding, label and school left-aligned, school 12.75 pt", "Inset 10 mm, 34 mm tall, «Diterbitkan oleh» 9 pt capitals over the school at 16.5 pt, centred", "The issuer gets the weight Yazid's band gives it; the inset keeps it whole on every printer (D)."],
    ["Gold line", "0.75 mm at 176 mm, on the band's top edge", "Unchanged: 0.75 mm at 176 mm, the card's proportion", "Approved for the physical proof (30 Sep); frozen if the print works beside the card family."],
    ["Verification", "Three columns at the foot: facts, text, QR", "One centred group: «Periksa keaslian», its sentence, the printed link; the QR beside it in its quiet zone", "Decided: a quiet verification area, the QR in generous clear space."],
    ["Link", "https://…/verifikasi/ + 43 characters: 83 characters on two lines", "verifikasi.pintarselalu.com/K7M4QX9P2HDT: 40 characters, one line, no protocol", "The proposal (brief §2): a PINTAR-owned, typeable link; the QR holds the full https link."],
    ["QR", "Byte, version 5-M, 37 modules of 0.70 mm", `Uppercase alphanumeric, version ${QR[PILIHAN].versi}-Q, 33 modules of ${f2(modulMm(QR[PILIHAN]))} mm, same 26 mm`, "Bigger modules and 25% recovery at the same size: it reads from further away and through more blur than round 1's, and through a stain at least as large (F)."],
    ["Type sizes", "Three print-only 7 pt sizes (labels, colophon, link); the number 9 pt, Predikat 15 pt", "Every size a step of the app's ladder; the smallest is the eyebrow, 9 pt (12 px)", "One type system with the screen; nothing on the paper is smaller than the app ever sets."],
  ];
  const VS_REF: Array<[string, string]> = [
    ["«DI TERBITKAN OLEH»", "«Diterbitkan oleh», one word, as verifikasi.institusi (a slip, per the brief)"],
    ["«Matematika . Bab 4»", "«Matematika · Bab 4», the app's middle dot, kept with the subject at a line break"],
    ["The number and link placeholders", "The proposed forms, A14CD7ST/00001 and verifikasi.pintarselalu.com/<token>"],
    ["The band to the paper's edge", `Inset ${S.TATA.sisiPita} mm: an office printer cannot print the edge, so a full-bleed band ends in an accidental sliver (D). Approved 30 Sep`],
    ["The school in capitals", "The school as recorded: typography makes the hierarchy, not a change to the data. Approved 30 Sep"],
    ["A gold rule about 2.3 mm", `${S.GARIS_MM} mm, the card's: approved for the physical proof, frozen if the print works beside the card family`],
    ["Record labels in a left column", "Labels right-aligned to the axis, values from it: the block stays centred. Approved 30 Sep"],
  ];
  await potret(halaman("H", `<div class="lembar" style="width:${3 * 95 + 2 * 10 + 4}mm">
<h1>H · What changed from round 1</h1>
<p class="sub">Left: round 1's Modern as it was (dd292f6). Right: this round, Yazid's reference composition refined. Same person, same school, same course; the number and link take the proposed forms.</p>
<div class="baris" style="gap:10mm">
<div style="width:140mm">${kecil(r1, 140)}<p class="ket"><b>Round 1 · Modern</b></p></div>
<div style="width:140mm">${kecil(sr(A), 140)}<p class="ket"><b>Round 2</b>: the proposal</p></div></div>
<table class="spek" style="width:100%"><tr><th></th><th style="width:26%">Round 1</th><th style="width:30%">Round 2</th><th>Why</th></tr>
${PERUBAHAN.map(([a, b, c, d], i) => `<tr><td><b>${i + 1} · ${a}</b></td><td>${S.esc(b)}</td><td>${S.esc(c)}</td><td>${S.esc(d)}</td></tr>`).join("")}</table>
<h2 style="margin-top:6mm">Against the reference: its slips corrected, and the refinements</h2>
<table class="spek" style="width:100%"><tr><th style="width:30%">The reference</th><th>Round 2</th></tr>${VS_REF.map(([a, b]) => `<tr><td>${S.esc(a)}</td><td>${S.esc(b)}</td></tr>`).join("")}</table>
<p class="ket" style="margin-top:4mm">Nothing added: no photo, logo, signature, seal, border, watermark, flourish or celebratory graphic. Still decided and unchanged: Achievement → Issuer → Verification; the gold line; the band with «Diterbitkan oleh» and the school; the name dominant.</p></div>`),
    "H-sebelum-sesudah.png", { lebar: Math.ceil(mmPx(3 * 95 + 2 * 10 + 20)), skala: 2.5 });
}

await browser.close();
writeFileSync(join(RENDER, "laporan.txt"), laporan.join("\n") + "\n");
console.log(laporan.join("\n"));
console.log(gagal ? `\n${gagal} check(s) FAILED` : "\nall checks passed");
process.exit(gagal ? 1 : 0);
