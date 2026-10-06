/**
 * Sertifikat PINTAR, round 1 (D-073): the grammar, written down once.
 *
 * The certificate inherits the Kartu PINTAR artifact language (round 2, with
 * Yazid's rulings of 30 Sep): warm-white paper, Plus Jakarta Sans with IBM Plex
 * Mono for identifiers, negative space, the thin warm-gold line #C09C4F, a deep
 * muted accent, the PINTAR-green QR, and «PINTAR SELALU» set in type. The card
 * answers "who is this person now"; the certificate answers "what did this
 * person achieve, at that time".
 *
 * Three constants hold in every direction, so the family is recognisable before
 * a word is read:
 *   1. THE LINE sits where it sits on the card: 59.3 % of the height (32 of
 *      53.98 mm there, 176 of 297 mm here). Above it, the statement (who, what);
 *      below it, the record (who issued it, when, the number, the evidence).
 *      As on the card, the statement sits ON the line and grows upward.
 *   2. THE RECORD BLOCK at the foot is the same in every direction: date and
 *      number on the left; «Periksa keaslian», its sentence and the printed link;
 *      the green QR on the right, its modules on the measure.
 *   3. «PINTAR SELALU» is a colophon at the foot: small, tracked, PINTAR green,
 *      away from the issuer and from anywhere a signature would stand.
 *
 * Design only: not application code. Samples, not copy. Millimetres at actual
 * size (A4 portrait) unless a name says otherwise.
 */

export const A4 = { w: 210, h: 297 } as const;

/**
 * `tepi`: the side margin (text measure 162 mm). `atas`: the heading's top.
 * `garis`: the centre of the warm-gold line, the card's proportion (0.5928 × 297).
 * `diAtasGaris`: space between the statement and the line. `diBawahGaris`: between
 * the line and what is below it. `rekamAtas`: the record row's top edge (fixed, so
 * a long number grows down and never moves the QR). `kaki`: the colophon's bottom
 * edge, from the sheet's bottom.
 * `pitaLuar`: the Modern band runs this far into the side margin, beyond the measure.
 */
export const TATA = { tepi: 24, atas: 26, garis: 176, diAtasGaris: 12, diBawahGaris: 8, rekamAtas: 236, kaki: 12, pitaLuar: 12 } as const;
export const UKUR = A4.w - 2 * TATA.tepi; // the measure

/** The line's width. The card's 0.75 mm, carried forward; 1.0 and 1.5 are compared for distance (README §G). */
export const GARIS_MM = 0.75;

export type Warna = {
  kertas: string; tinta: string; tinta2: string; tinta3: string;
  hijau: string; hijauLembut: string; emas: string; garisHalus: string;
};
/** The app's tokens and the card's line: nothing new. */
export const WARNA: Warna = {
  kertas: "#FBFAF7", // --surface-0: the screen's paper; in print, the stock (never printed)
  tinta: "#1F2A33", // --ink-1
  tinta2: "#4E5A64", // --ink-2
  tinta3: "#5F6A73", // --ink-3
  hijau: "#245F55", // --pintar-primary: the QR and the colophon
  hijauLembut: "#E3EFEC", // --pintar-primary-soft: only in the QR study's tile variant
  emas: "#C09C4F", // the card's artifact-signature candidate (ruling 2, 30 Sep)
  garisHalus: "#D5D2CB", // a placeholder's outline (photo, logo): not part of the certificate
};

/**
 * THE ACCENT, BY LEARNING CONTEXT, NEVER BY ROLE (for Yazid). The context is
 * `courses.learning_context` (WP6A). Starting points, as asked: an academic
 * certificate takes the Murid family colour, a professional-learning one the
 * Guru family colour, both from the card's approved palette. One lightness
 * (OKLab L 0.487): no context is louder than the other, and in greyscale the
 * two are the same grey, because the accent carries no information.
 */
export type Konteks = "ACADEMIC" | "PROFESSIONAL_DEVELOPMENT";
export const AKSEN: Record<Konteks, string> = { ACADEMIC: "#725471", PROFESSIONAL_DEVELOPMENT: "#446A4B" };
export const NAMA_KONTEKS: Record<Konteks, string> = { ACADEMIC: "academic (Murid family plum)", PROFESSIONAL_DEVELOPMENT: "professional learning (Guru family sage)" };

/** The three layouts the schema already names (certificate_templates.layout). */
export type Arah = "CLASSIC" | "MODERN" | "MINIMAL";
export const ARAH: Arah[] = ["CLASSIC", "MODERN", "MINIMAL"];

// ── colour arithmetic (as the card's) ───────────────────────────────────────
const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const gam = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
export const luminans = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const rasio = (a: string, b: string) => {
  const [x, y] = [luminans(a), luminans(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
export const abuHex = (hex: string) => {
  const v = Math.round(Math.min(1, Math.max(0, gam(luminans(hex)))) * 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${v}${v}${v}`;
};
const abuWarna = (w: Warna): Warna => Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v.startsWith("#") ? abuHex(v) : v])) as Warna;

// ── typography: two families, three weights ─────────────────────────────────
export type Gaya = {
  peran: string; huruf: "Plus Jakarta Sans" | "IBM Plex Mono"; berat: 400 | 500 | 600;
  pt: number; baris: number; spasi: number; kata?: number; kapital?: boolean; warna: string;
  /** the token-ladder step this size is (globals.css), or why it has none */
  tangga: string;
};
/**
 * THE SIZES ARE THE APP'S LADDER. The sheet renders at 96 dpi (794 × 1123 px is
 * A4), so 1 pt is 1.333 px, and every size that can be a ladder step is one:
 * name-print 44 px = 33 pt, subhead 22 = 16.5, course 20 = 15, card 17 = 12.75,
 * body 16 = 12, meta 14 = 10.5, fine 13 = 9.75, eyebrow 12 = 9 (PINTAR-DESIGN-
 * SKILL-SPEC §6: "named rather than free"). Leading is the ladder's too (tight
 * 1.15 · heading 1.25 · body 1.5), except the name, which keeps the built
 * sheet's 1.05. THREE PRINT-ONLY SIZES sit below the screen ladder, flagged
 * rather than slipped in: the 7 pt labels, colophon and printed link. On paper at
 * arm's length, 9 pt tracked capitals would shout; 7 pt capitals (cap height
 * 1.84 mm) are the ordinary size for a label on a printed form.
 */
export const GAYA: Record<string, Gaya> = {
  merek: { peran: "«PINTAR SELALU» (colophon)", huruf: "Plus Jakarta Sans", berat: 600, pt: 7, baris: 1, spasi: 0.16, kata: 0.12, kapital: true, warna: "PINTAR green #245F55", tangga: "print only (9.33 px)" },
  jenis: { peran: "Heading «Sertifikat Penguasaan»", huruf: "Plus Jakarta Sans", berat: 600, pt: 10.5, baris: 1.25, spasi: 0.16, kata: 0.1, kapital: true, warna: "the accent", tangga: "meta 14 px (Classic: body 16 px, 12 pt)" },
  nama: { peran: "Recipient's name", huruf: "Plus Jakarta Sans", berat: 600, pt: 33, baris: 1.05, spasi: -0.018, warna: "ink #1F2A33", tangga: "name-print 44 px" },
  diberikan: { peran: "«telah menuntaskan»", huruf: "Plus Jakarta Sans", berat: 400, pt: 12, baris: 1.25, spasi: 0, warna: "ink-2 #4E5A64", tangga: "body 16 px" },
  kursus: { peran: "Course title", huruf: "Plus Jakarta Sans", berat: 600, pt: 16.5, baris: 1.25, spasi: -0.005, warna: "ink #1F2A33", tangga: "subhead 22 px" },
  label: { peran: "Labels (Predikat, Tanggal terbit, Nomor sertifikat, Diterbitkan oleh)", huruf: "Plus Jakarta Sans", berat: 600, pt: 7, baris: 1.15, spasi: 0.14, kata: 0.1, kapital: true, warna: "ink-3 #5F6A73 (paper on the Modern band)", tangga: "print only (9.33 px)" },
  predikat: { peran: "Predikat", huruf: "Plus Jakarta Sans", berat: 600, pt: 15, baris: 1.15, spasi: -0.005, warna: "ink #1F2A33", tangga: "course 20 px" },
  sekolah: { peran: "Issuing school", huruf: "Plus Jakarta Sans", berat: 600, pt: 12.75, baris: 1.25, spasi: -0.005, warna: "ink (paper on the Modern band)", tangga: "card 17 px" },
  tanggal: { peran: "Date", huruf: "Plus Jakarta Sans", berat: 400, pt: 12, baris: 1.25, spasi: 0, warna: "ink #1F2A33", tangga: "body 16 px" },
  nomor: { peran: "Certificate number", huruf: "IBM Plex Mono", berat: 500, pt: 9, baris: 1.5, spasi: 0.02, warna: "ink #1F2A33", tangga: "eyebrow 12 px" },
  periksa: { peran: "«Periksa keaslian»", huruf: "Plus Jakarta Sans", berat: 600, pt: 9.75, baris: 1.25, spasi: 0, warna: "ink #1F2A33", tangga: "fine 13 px" },
  arti: { peran: "Verification sentence", huruf: "Plus Jakarta Sans", berat: 400, pt: 9, baris: 1.5, spasi: 0.005, kata: 0.05, warna: "ink-2 #4E5A64", tangga: "eyebrow 12 px" },
  tautan: { peran: "Printed link", huruf: "IBM Plex Mono", berat: 500, pt: 7, baris: 1.5, spasi: 0, warna: "ink-2 #4E5A64", tangga: "print only (9.33 px)" },
  kecil: { peran: "Placeholder text (photo, logo studies only)", huruf: "Plus Jakarta Sans", berat: 600, pt: 6.5, baris: 1.25, spasi: 0.12, kapital: true, warna: "ink-3 #5F6A73", tangga: "study only" },
};
const gayaCss = (g: Gaya) =>
  `font-family:'${g.huruf}';font-weight:${g.berat};font-size:${g.pt}pt;line-height:${g.baris};letter-spacing:${g.spasi}em;${g.kata ? `word-spacing:${g.kata}em;` : ""}${g.kapital ? "text-transform:uppercase;" : ""}`;

/** The same fonts as the card: the app's own OFL files; static PJS instances for the PDF. */
export function css(akar: string, statis?: string): string {
  const f = (n: string) => `url("file://${akar}/public/fonts/${n}") format("woff2")`;
  const pjs = statis
    ? [400, 600].map((w) => `@font-face { font-family: "Plus Jakarta Sans"; font-weight: ${w}; src: url("file://${statis}/plus-jakarta-sans-${w}.ttf") format("truetype"); }`).join("\n")
    : `@font-face { font-family: "Plus Jakarta Sans"; font-weight: 200 800; src: ${f("plus-jakarta-sans-latin.woff2")}; }`;
  return `
${pjs}
@font-face { font-family: "IBM Plex Mono"; font-weight: 500; src: ${f("ibm-plex-mono-500-latin.woff2")}; }
.sr { position: relative; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-kerning: normal; text-rendering: geometricPrecision; color: ${WARNA.tinta}; }
.sr * { box-sizing: border-box; margin: 0; }
.sr .abs { position: absolute; }
${Object.entries(GAYA).map(([k, g]) => `.sr .s-${k} { ${gayaCss(g)} }`).join("\n")}
.sr .s-nama, .sr .s-kursus, .sr .s-sekolah { overflow-wrap: break-word; text-wrap: pretty; }
.sr .s-nomor, .sr .s-tautan { overflow-wrap: anywhere; }
.sr .s-label { margin-bottom: 1.3mm; }
`;
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
/**
 * Identifiers break only where their own structure allows, and deterministically
 * (Plex Mono is monospaced, so a line's capacity is exact): the number breaks
 * after a «/», keeping «2026/00042» whole, and only a school code too long for
 * one line breaks after its own «-»; the link breaks after «/verifikasi/», so its
 * 43-character code is one line. Nothing is inserted: no hyphen appears that is
 * not in the text.
 */
export const MAJU_MONO = 0.6; // IBM Plex Mono's advance, em
export const kapasitas = (lebarMm: number, pt: number, spasiEm = 0) => Math.floor(lebarMm / ((MAJU_MONO + spasiEm) * pt * 25.4 / 72) + 1e-9);
export function barisNomor(n: string, lebarMm: number, pt = 9, spasiEm = 0.02): string[] {
  const c = kapasitas(lebarMm, pt, spasiEm);
  const bagian = n.split("/");
  const token = bagian.length >= 4
    ? [...bagian.slice(0, -2).map((b) => `${b}/`), `${bagian[bagian.length - 2]}/${bagian[bagian.length - 1]}`]
    : [n];
  const baris: string[] = [];
  let kini = "";
  const taruh = (t: string) => {
    if ((kini + t).length <= c) { kini += t; return; }
    if (kini) { baris.push(kini); kini = ""; }
    if (t.length <= c) { kini = t; return; }
    for (const p of t.split(/(?<=-)/)) { // too long for a line: its own hyphens
      if ((kini + p).length <= c) { kini += p; continue; }
      if (kini) baris.push(kini);
      kini = p;
      while (kini.length > c) { baris.push(kini.slice(0, c)); kini = kini.slice(c); }
    }
  };
  token.forEach(taruh);
  if (kini) baris.push(kini);
  return baris;
}
/** The link: the 43-character code alone on its last line; the part before it breaks after its own «/» or «.» only if it must. */
export function barisTautan(u: string, lebarMm: number, pt = 7): string[] {
  const i = u.indexOf("/verifikasi/");
  if (i < 0) return [u];
  const c = kapasitas(lebarMm, pt);
  const depan = u.slice(0, i + 12), kode = u.slice(i + 12);
  const baris: string[] = [];
  let kini = "";
  for (const p of depan.split(/(?<=[/.])/)) {
    if ((kini + p).length <= c) { kini += p; continue; }
    if (kini) baris.push(kini);
    kini = p;
  }
  if (kini) baris.push(kini);
  return [...baris, kode];
}

// ── the words ────────────────────────────────────────────────────────────────
/**
 * The certificate's words. The render script fills them from src/lib/hle.ts
 * (the app's own copy table, D-014) wherever a key exists; `penerbit` has no
 * sertifikat key yet and borrows the verification page's «Diterbitkan oleh»
 * (verifikasi.institusi) as a PROPOSAL.
 */
export type Kata = { jenis: string; diberikan: string; predikat: string; tanggal: string; nomor: string; periksa: string; arti: string; penerbit: string };

/** One certificate, as the record holds it. `tanggal` is already formatted (format.date, Jakarta). */
export type Data = {
  sekolah: string; nama: string; kursus: string; predikat: string; tanggal: string; nomor: string;
  url: string; matriks: number[][]; konteks: Konteks;
};

export type Opsi = {
  /** the sheet's own paper: the screen's warm white, or "" for print (the stock, unprinted) */
  kertas?: string;
  abu?: boolean;
  garisMm?: number;
  /** override the accent (studies only) */
  aksen?: string;
  /** Version B: a placeholder photo, «FOTO — CONTOH» (not implemented; OD-10) */
  foto?: boolean;
  /** the hypothetical school logo, «LOGO SEKOLAH — CONTOH» (not implemented; Q-7) */
  logo?: boolean;
  /** the QR study: green modules on the card's soft-green tile instead of on paper */
  ubin?: boolean;
  /** the QR symbol's side, modules only, mm */
  qrMm?: number;
  /** a thin outline round the sheet, for boards on a coloured ground */
  bingkai?: boolean;
  /** CLASSIC only: carry Modern's band (the seam) on the centred axis (README §B) */
  pita?: boolean;
};

// ── QR ───────────────────────────────────────────────────────────────────────
export const TENANG = 4; // quiet zone, modules
/** The symbol's side (modules only). The module follows the version: 0.703 mm at version 5, 0.634 at 6. */
export const QR_MM = 26;
export function svgQr(matriks: number[][], sisiMm: number, latar: string, modul: string): string {
  const n = matriks.length;
  const q = TENANG;
  let d = "";
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (matriks[r][c]) {
        let e = c;
        while (e < n && matriks[r][e]) e++;
        d += `M${c} ${r}h${e - c}v1h-${e - c}z`;
        c = e;
      } else c++;
    }
  }
  const m = sisiMm / n;
  const luar = (n + 2 * q) * m;
  return `<svg class="sr-qr" xmlns="http://www.w3.org/2000/svg" width="${+luar.toFixed(3)}mm" height="${+luar.toFixed(3)}mm" viewBox="${-q} ${-q} ${n + 2 * q} ${n + 2 * q}" shape-rendering="crispEdges" style="display:block">
${latar ? `<rect x="${-q}" y="${-q}" width="${n + 2 * q}" height="${n + 2 * q}" fill="${latar}"/>` : ""}<path d="${d}" fill="${modul}"/></svg>`;
}

const mm = (v: number) => `${+v.toFixed(3)}mm`;

/**
 * THE RECORD BLOCK: identical in every direction. One row, top-aligned at
 * `TATA.rekamAtas`: the facts (60 mm), the
 * verification text (64 mm), the QR (26 mm). The QR's modules fill their column
 * exactly, so its edge is on the measure; its 4-module quiet zone runs into the
 * gutter and the margin, where nothing is printed.
 */
export const REKAM = { fakta: 60, celah: 6, qr: QR_MM } as const;
function rekam(d: Data, k: Kata, w: Warna, o: Opsi): string {
  const sisi = o.qrMm ?? QR_MM;
  const q = TENANG * (sisi / d.matriks.length);
  const periksa = UKUR - REKAM.fakta - 2 * REKAM.celah - sisi;
  const nomor = barisNomor(d.nomor, REKAM.fakta, GAYA.nomor.pt, GAYA.nomor.spasi).map(esc).join("<br>");
  return `
<div class="abs sr-rekam" style="left:${mm(TATA.tepi)};width:${mm(UKUR)};top:${mm(TATA.rekamAtas)};display:grid;grid-template-columns:${mm(REKAM.fakta)} ${mm(periksa)} ${mm(sisi)};column-gap:${mm(REKAM.celah)};align-items:start">
  <div class="sr-fakta">
    <p class="s-label" style="color:${w.tinta3}">${esc(k.tanggal)}</p>
    <p class="s-tanggal" style="color:${w.tinta}">${esc(d.tanggal)}</p>
    <p class="s-label" style="color:${w.tinta3};margin-top:5mm">${esc(k.nomor)}</p>
    <p class="s-nomor" style="color:${w.tinta};white-space:nowrap">${nomor}</p>
  </div>
  <div class="sr-periksa">
    <p class="s-periksa" style="color:${w.tinta}">${esc(k.periksa)}</p>
    <p class="s-arti" style="color:${w.tinta2};margin-top:1.2mm">${esc(k.arti)}</p>
    <p class="s-tautan" style="color:${w.tinta2};margin-top:2.4mm;white-space:nowrap">${barisTautan(d.url, periksa, GAYA.tautan.pt).map(esc).join("<br>")}</p>
  </div>
  <div class="sr-kode" style="width:${mm(sisi)};height:${mm(sisi)};margin-top:0.6mm">
    <div style="margin:${mm(-q)};${o.ubin ? "border-radius:1.6mm;overflow:hidden;" : ""}">${svgQr(d.matriks, sisi, o.ubin ? w.hijauLembut : "", w.hijau)}</div>
  </div>
</div>`;
}

function kaki(w: Warna, rata: "kiri" | "tengah"): string {
  return `<p class="abs s-merek merek" style="${rata === "kiri" ? `left:${mm(TATA.tepi)}` : `left:0;right:0;text-align:center;padding-left:0.16em`};bottom:${mm(TATA.kaki)};color:${w.hijau};white-space:nowrap">PINTAR SELALU</p>`;
}

/**
 * The line is drawn AFTER the band, and the band starts under the line's centre,
 * so the two overlap by half the line's width: no renderer can leave a hairline
 * of paper between them (a band starting at the line's lower edge showed one at 600 dpi).
 */
function garisEmas(w: Warna, lebar: number, kiri: number, kanan: number): string {
  // drawn as an SVG rectangle, not a CSS background: a browser prints it with
  // «Background graphics» off (the current sheet's green rule is a background, and does not)
  return `<svg class="abs sr-garis" style="left:${mm(kiri)};top:${mm(TATA.garis - lebar / 2)};width:${mm(kanan - kiri)};height:${mm(lebar)}" viewBox="0 0 ${+(kanan - kiri).toFixed(3)} ${lebar}" preserveAspectRatio="none"><rect width="${+(kanan - kiri).toFixed(3)}" height="${lebar}" fill="${w.emas}"/></svg>`;
}

function foto(w: Warna, x: number, y: number): string {
  return `<div class="abs sr-foto" style="left:${mm(x)};top:${mm(y)};width:30mm;height:40mm;border:0.25mm solid ${w.garisHalus};background:#EFEDE8;display:flex;align-items:center;justify-content:center;text-align:center"><p class="s-kecil" style="color:${w.tinta3}">Foto —<br>contoh</p></div>`;
}
function logo(w: Warna, x: number, y: number, sisi = 18): string {
  return `<div class="abs sr-logo" style="left:${mm(x)};top:${mm(y)};width:${mm(sisi)};height:${mm(sisi)};border:0.25mm dashed ${w.tinta3};border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center"><p class="s-kecil" style="color:${w.tinta3};font-size:5pt">Logo<br>sekolah —<br>contoh</p></div>`;
}

function badanSheet(isi: string, w: Warna, o: Opsi, arah: Arah): string {
  const latar = o.kertas === undefined ? w.kertas : o.kertas || "transparent";
  const tepi = o.bingkai ? `<div class="abs" style="inset:0;border:0.25mm solid rgba(31,42,51,0.18);pointer-events:none"></div>` : "";
  return `<div class="sr sr-${arah.toLowerCase()}" style="width:${mm(A4.w)};height:${mm(A4.h)};background:${latar};">${isi}${tepi}</div>`;
}

/**
 * THE STATEMENT: heading, name, «telah menuntaskan», course, Predikat. In MODERN
 * and MINIMAL it sits on the line (its last line `diAtasGaris` above it) and a
 * longer name or course grows upward into the empty paper, as the card's name
 * grows upward from its line. CLASSIC centres it between the heading and the line.
 */
function pernyataan(d: Data, k: Kata, w: Warna, rata: "kiri" | "tengah", lebar: number, kiri: number): string {
  const ta = rata === "tengah" ? "text-align:center;" : "";
  return `
  <p class="s-nama" style="color:${w.tinta};${ta}">${esc(d.nama)}</p>
  <p class="s-diberikan" style="color:${w.tinta2};margin-top:5.5mm;${ta}">${esc(k.diberikan)}</p>
  <p class="s-kursus" style="color:${w.tinta};margin-top:1.6mm;${ta}">${esc(d.kursus)}</p>
  <div style="margin-top:8mm;${ta}"><p class="s-label" style="color:${w.tinta3}">${esc(k.predikat)}</p><p class="s-predikat" style="color:${w.tinta}">${esc(d.predikat)}</p></div>`;
  void lebar; void kiri;
}

function penerbit(d: Data, k: Kata, warnaLabel: string, warnaSekolah: string, rata: "kiri" | "tengah"): string {
  const ta = rata === "tengah" ? "text-align:center;" : "";
  return `<p class="s-label" style="color:${warnaLabel};${ta}">${esc(k.penerbit)}</p><p class="s-sekolah" style="color:${warnaSekolah};${ta}">${esc(d.sekolah)}</p>`;
}

/** One certificate, one A4 sheet. */
export function sertifikat(arah: Arah, d: Data, k: Kata, o: Opsi = {}): string {
  const w = o.abu ? abuWarna(WARNA) : WARNA;
  const aksenAsli = o.aksen ?? AKSEN[d.konteks];
  const aksen = o.abu ? abuHex(aksenAsli) : aksenAsli;
  const g = o.garisMm ?? GARIS_MM;
  const { tepi, atas, garis, diAtasGaris, diBawahGaris, pitaLuar } = TATA;
  const dariBawahGaris = A4.h - garis + g / 2; // the line's top edge, from the sheet's bottom
  let isi = "";

  if (arah === "MODERN") {
    // the card, narrowed: paper, the line, and the accent below it, carrying the issuer
    const atasJenis = o.logo ? atas + 24 : atas;
    isi += o.logo ? logo(w, tepi, atas - 2) : "";
    isi += `<p class="abs s-jenis" style="left:${mm(tepi)};top:${mm(atasJenis)};color:${aksen}">${esc(k.jenis)}</p>`;
    isi += o.foto ? foto(w, A4.w - tepi - 30, atas) : "";
    isi += `<div class="abs sr-pernyataan" style="left:${mm(tepi)};width:${mm(UKUR)};bottom:${mm(dariBawahGaris + diAtasGaris)};">${pernyataan(d, k, w, "kiri", UKUR, tepi)}</div>`;
    isi += `<div class="abs sr-pita" style="left:${mm(pitaLuar)};width:${mm(A4.w - 2 * pitaLuar)};top:${mm(garis)};background:${aksen};padding:${mm(5 + g / 2)} ${mm(tepi - pitaLuar)} 5.4mm;">${penerbit(d, k, w.kertas, w.kertas, "kiri")}</div>`;
    isi += garisEmas(w, g, pitaLuar, A4.w - pitaLuar);
    isi += rekam(d, k, w, o) + kaki(w, "kiri");
  } else if (arah === "MINIMAL") {
    // type, one line, the QR: the accent is only the heading
    const atasJenis = o.logo ? atas + 24 : atas;
    isi += o.logo ? logo(w, tepi, atas - 2) : "";
    isi += `<p class="abs s-jenis" style="left:${mm(tepi)};top:${mm(atasJenis)};color:${aksen}">${esc(k.jenis)}</p>`;
    isi += o.foto ? foto(w, A4.w - tepi - 30, atas) : "";
    isi += `<div class="abs sr-pernyataan" style="left:${mm(tepi)};width:${mm(UKUR)};bottom:${mm(dariBawahGaris + diAtasGaris)};">${pernyataan(d, k, w, "kiri", UKUR, tepi)}</div>`;
    isi += garisEmas(w, g, tepi, A4.w - tepi);
    isi += `<div class="abs sr-penerbit" style="left:${mm(tepi)};width:${mm(UKUR)};top:${mm(garis + g / 2 + diBawahGaris)};">${penerbit(d, k, w.tinta3, w.tinta, "kiri")}</div>`;
    isi += rekam(d, k, w, o) + kaki(w, "kiri");
  } else {
    // CLASSIC: a centred axis; the heading carries the accent and a short line of its own colour's partner, the gold
    const atasJenis = o.logo ? atas + 24 : atas + 4;
    isi += o.logo ? logo(w, (A4.w - 18) / 2, atas - 2) : "";
    isi += `<p class="abs s-jenis" style="left:0;right:0;top:${mm(atasJenis)};text-align:center;padding-left:0.2em;color:${aksen};font-size:12pt;letter-spacing:0.2em">${esc(k.jenis)}</p>`;
    isi += o.foto ? foto(w, (A4.w - 30) / 2, atasJenis + 12) : "";
    const atasBlok = o.foto ? atasJenis + 58 : atasJenis + 14;
    isi += `<div class="abs sr-pernyataan" style="left:${mm(tepi)};width:${mm(UKUR)};top:${mm(atasBlok)};bottom:${mm(dariBawahGaris + diAtasGaris)};display:flex;flex-direction:column;justify-content:center">${pernyataan(d, k, w, "tengah", UKUR, tepi)}</div>`;
    if (o.pita) {
      isi += `<div class="abs sr-pita" style="left:${mm(pitaLuar)};width:${mm(A4.w - 2 * pitaLuar)};top:${mm(garis)};background:${aksen};padding:${mm(5 + g / 2)} ${mm(tepi - pitaLuar)} 5.4mm;">${penerbit(d, k, w.kertas, w.kertas, "tengah")}</div>`;
      isi += garisEmas(w, g, pitaLuar, A4.w - pitaLuar);
    } else {
      isi += garisEmas(w, g, tepi, A4.w - tepi);
      isi += `<div class="abs sr-penerbit" style="left:${mm(tepi)};width:${mm(UKUR)};top:${mm(garis + g / 2 + diBawahGaris)};">${penerbit(d, k, w.tinta3, w.tinta, "tengah")}</div>`;
    }
    isi += rekam(d, k, w, o) + kaki(w, "tengah");
  }
  return badanSheet(isi, w, o, arah);
}
