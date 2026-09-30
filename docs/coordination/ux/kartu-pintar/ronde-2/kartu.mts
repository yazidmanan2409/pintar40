/**
 * Kartu PINTAR, round 2: the refined grammar (input to DAISY-24, Gate 7).
 *
 * Yazid's direction (round 2): a warm-white upper field, a thin warm-gold line,
 * a deep muted family-colour lower field. This file writes that grammar down
 * once. Every family, every sample and every test goes through `depan` (front)
 * and `belakang` (back), so the cards cannot drift apart: a family changes one
 * colour, nothing else. Round 1's files are left as they were, for comparison.
 *
 * Design only: not application code. Samples, not copy. Units are millimetres at
 * actual size (CR80) unless a name says otherwise.
 */

/** CR80 (ISO/IEC 7810 ID-1). `aman`: the safe margin for type and the QR; `bleed`: colour past the trim. */
export const UKURAN = { lebar: 85.6, tinggi: 53.98, sudut: 3.18, aman: 3, bleed: 2 } as const;

/**
 * The grid, shared by both faces.
 * `garis`: the centre of the warm-gold line, 32 mm from the top on the front AND the back.
 * `tepi`: the text margin. `atas`: the header's top. `jarakAtas` / `jarakBawah`: the
 * space between the line and the text above it / below it.
 */
export const TATA = { tepi: 6, atas: 5.2, garis: 32, jarakAtas: 4.4, jarakBawah: 4.0 } as const;

/** The line's width. 0.75 mm is the recommendation (README §C); 0.50 and 1.00 are compared. */
export const GARIS_MM = 0.75;

export type Warna = {
  kertas: string; tinta: string; tinta2: string; tinta3: string;
  hijau: string; hijauLembut: string; emas: string;
};

/** The app's tokens (src/app/globals.css), plus one new candidate: the warm-gold line. */
export const WARNA: Warna = {
  kertas: "#FBFAF7", // --surface-0: the card's paper; in print, unprinted stock
  tinta: "#1F2A33", // --ink-1
  tinta2: "#4E5A64", // --ink-2
  tinta3: "#5F6A73", // --ink-3
  hijau: "#245F55", // --pintar-primary
  hijauLembut: "#E3EFEC", // --pintar-primary-soft: the QR tile
  // CANDIDATE, not a token: ochre at OKLCH 0.711 / 0.105 / 85, placed midway in
  // lightness between the paper and the family colours, so it stands ~2.4:1
  // from both, in colour and in greyscale (README §C)
  emas: "#C09C4F",
};

export type Keluarga = "murid" | "guru" | "kadep" | "dekan" | "adminSekolah" | "adminPlatform";
export const KELUARGA: Keluarga[] = ["murid", "guru", "kadep", "dekan", "adminSekolah", "adminPlatform"];

/** Terminology v1 (D-068) role names, exactly as written there. */
export const PERAN: Record<Keluarga, string> = {
  murid: "Murid", guru: "Guru", kadep: "Kepala departemen", dekan: "Dekan",
  adminSekolah: "Admin sekolah", adminPlatform: "Admin platform",
};

export type Palet = "r1" | "terpisah" | "zaitun";
/**
 * `r1`: round 1's equal-lightness set (two pairs too close: 0.024 and 0.029 in OKLab).
 * `terpisah` ("separated", proposed): one lightness (OKLab L 0.487), hues spread so
 *   every pair is at least 0.056 apart; Murid takes the free hue, plum (README §4).
 * `zaitun` ("olive"): the same method with Murid kept in the green-yellow arc; shown
 *   so the one free choice is visible.
 */
export const PALET: Record<Palet, Record<Keluarga, string>> = {
  r1: { murid: "#436478", guru: "#466754", kadep: "#406766", dekan: "#51607D", adminSekolah: "#695E53", adminPlatform: "#5B6167" },
  terpisah: { murid: "#725471", guru: "#446A4B", kadep: "#2E6973", dekan: "#515E83", adminSekolah: "#7A5648", adminPlatform: "#5E6062" },
  zaitun: { murid: "#67612F", guru: "#426B4D", kadep: "#2D6A72", dekan: "#4F5E87", adminSekolah: "#7A5642", adminPlatform: "#5F5F60" },
};

// ── colour arithmetic ───────────────────────────────────────────────────────
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
/** Greyscale that keeps luminance, so every contrast ratio is the same as in colour. */
export const abuHex = (hex: string) => {
  const v = Math.round(Math.min(1, Math.max(0, gam(luminans(hex)))) * 255).toString(16).padStart(2, "0").toUpperCase();
  return `#${v}${v}${v}`;
};
export const abuWarna = (w: Warna): Warna => Object.fromEntries(Object.entries(w).map(([k, v]) => [k, abuHex(v)])) as Warna;

// ── typography: two families, four sizes, three weights ─────────────────────
export type Gaya = {
  peran: string; huruf: "Plus Jakarta Sans" | "IBM Plex Mono"; berat: 400 | 500 | 600;
  pt: number; baris: number; spasi: number /* em */; kata?: number /* word spacing, em */; kapital?: boolean; warna: string;
};
/**
 * Plus Jakarta Sans's word space is 0.17 em (0.48 mm at 8 pt), narrow enough for
 * ink spread to close it, so the small styles add some (round 1 §3).
 */
export const GAYA: Record<string, Gaya> = {
  merek: { peran: "PINTAR SELALU (header)", huruf: "Plus Jakarta Sans", berat: 600, pt: 6.5, baris: 1, spasi: 0.16, kata: 0.12, kapital: true, warna: "PINTAR green #245F55" },
  nama: { peran: "Person name", huruf: "Plus Jakarta Sans", berat: 600, pt: 12, baris: 1.15, spasi: -0.01, warna: "ink #1F2A33" },
  id: { peran: "PINTAR ID", huruf: "IBM Plex Mono", berat: 500, pt: 9, baris: 1.2, spasi: 0.06, warna: "ink-2 #4E5A64 (front); PINTAR green (tile)" },
  peran: { peran: "Role", huruf: "Plus Jakarta Sans", berat: 600, pt: 8, baris: 1.3, spasi: 0, kata: 0.06, warna: "paper #FBFAF7 on the family colour" },
  sekolah: { peran: "School", huruf: "Plus Jakarta Sans", berat: 400, pt: 8, baris: 1.3, spasi: 0.005, kata: 0.06, warna: "paper #FBFAF7 on the family colour" },
  petunjuk: { peran: "QR instruction", huruf: "Plus Jakarta Sans", berat: 400, pt: 8, baris: 1.35, spasi: 0.005, kata: 0.06, warna: "ink #1F2A33" },
  situs: { peran: "URL", huruf: "Plus Jakarta Sans", berat: 400, pt: 6.5, baris: 1.3, spasi: 0.02, warna: "ink-3 #5F6A73" },
};
const gayaCss = (g: Gaya) =>
  `font-family:'${g.huruf}';font-weight:${g.berat};font-size:${g.pt}pt;line-height:${g.baris};letter-spacing:${g.spasi}em;${g.kata ? `word-spacing:${g.kata}em;` : ""}${g.kapital ? "text-transform:uppercase;" : ""}`;

/**
 * Fonts from the app's own self-hosted files (public/fonts, SIL OFL 1.1).
 * `statis`: a folder with static 400 and 600 instances cut from the same variable
 * file, for the PDF, so it embeds TrueType rather than Type3 outlines.
 */
export function css(akar: string, statis?: string): string {
  const f = (n: string) => `url("file://${akar}/public/fonts/${n}") format("woff2")`;
  const pjs = statis
    ? [400, 600].map((w) => `@font-face { font-family: "Plus Jakarta Sans"; font-weight: ${w}; src: url("file://${statis}/plus-jakarta-sans-${w}.ttf") format("truetype"); }`).join("\n")
    : `@font-face { font-family: "Plus Jakarta Sans"; font-weight: 200 800; src: ${f("plus-jakarta-sans-latin.woff2")}; }`;
  return `
${pjs}
@font-face { font-family: "IBM Plex Mono"; font-weight: 500; src: ${f("ibm-plex-mono-500-latin.woff2")}; }
.kp { position: relative; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-kerning: normal; text-rendering: geometricPrecision; }
.kp * { box-sizing: border-box; margin: 0; }
.kp-trim { position: absolute; }
.kp-merek { ${gayaCss(GAYA.merek)} white-space: nowrap; }
.kp-nama { ${gayaCss(GAYA.nama)} overflow-wrap: break-word; }
.kp-id { ${gayaCss(GAYA.id)} white-space: nowrap; }
.kp-bab-baris { ${gayaCss(GAYA.sekolah)} }
.kp-peran { font-weight: ${GAYA.peran.berat}; letter-spacing: ${GAYA.peran.spasi}em; }
.kp-sekolah { font-weight: ${GAYA.sekolah.berat}; }
.kp-petunjuk { ${gayaCss(GAYA.petunjuk)} }
.kp-situs { ${gayaCss(GAYA.situs)} }
`;
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
/** «A14C D7ST»: stored as 8 characters, shown 4 + 4 (IDENTITY-4.0 §4). */
export const tampilId = (id: string) => `${id.slice(0, 4)} ${id.slice(4)}`;

/** One current role at one school (a chapter). `sekolah` is null for Admin platform. */
export type Bab = { peran: Keluarga; sekolah: string | null };
export type Orang = { nama: string; id: string; bab: Bab[] };

const mm = (v: number) => `${+v.toFixed(3)}mm`;

export type OpsiMuka = {
  /** colour past the trim, for print (mm); 0 = the screen card, with its rounded corners */
  bleed?: number;
  /** on screen only: the app's one hairline round the card, so its paper reads on a white page */
  garisTepi?: boolean;
  /** the warm-gold line's width, mm */
  garisMm?: number;
  /** render in greyscale (luminance kept) */
  abu?: boolean;
  /** the palette; `warnaBab` overrides the family colour (the open multi-role question) */
  palet?: Palet;
  warnaBab?: string;
  /** several schools: one line per role with its school ("pasangan"), or roles then schools ("terpisah") */
  susunan?: "pasangan" | "terpisah";
};

function bingkai(isi: string, latar: string, kelas: string, o: OpsiMuka): string {
  const { lebar: W, tinggi: H, sudut: R } = UKURAN;
  const b = o.bleed ?? 0;
  const tepi = o.garisTepi && !b
    ? `<div style="position:absolute;inset:0;border-radius:${mm(R)};border:0.2mm solid rgba(31,42,51,0.16);"></div>`
    : "";
  return `<div class="kp ${kelas}" style="width:${mm(W + 2 * b)};height:${mm(H + 2 * b)};background:${latar};border-radius:${b ? 0 : mm(R)};">
<div class="kp-trim" style="left:${mm(b)};top:${mm(b)};width:${mm(W)};height:${mm(H)};">${isi}</div>${tepi}</div>`;
}

/** The line: the same geometry on both faces, full bleed across the card. */
function garisEmas(w: Warna, lebarGaris: number, b: number): string {
  return `<div class="kp-garis" style="position:absolute;left:${mm(-b)};width:${mm(UKURAN.lebar + 2 * b)};top:${mm(TATA.garis - lebarGaris / 2)};height:${mm(lebarGaris)};background:${w.emas};"></div>`;
}

/**
 * The chapter's lines: role(s) and school(s), each line a list of spans (role 600,
 * school 400, one size). Nothing is invented: an absent school is no line.
 * One school: the roles on one line («Guru · Kepala departemen»), the school below.
 * Several schools (open question, README §F): "pasangan" pairs each role with its
 * school, one line each; "terpisah" gives the roles, then the schools.
 */
export type Rentang = { teks: string; tebal: boolean };
export function barisBab(bab: Bab[], susunan: "pasangan" | "terpisah" = "pasangan"): Rentang[][] {
  const sekolahUnik = [...new Set(bab.map((x) => x.sekolah).filter((s): s is string => !!s))];
  const peran = { teks: bab.map((x) => PERAN[x.peran]).join(" · "), tebal: true };
  if (sekolahUnik.length <= 1) return sekolahUnik.length ? [[peran], [{ teks: sekolahUnik[0], tebal: false }]] : [[peran]];
  if (susunan === "terpisah") return [[peran], [{ teks: sekolahUnik.join(" · "), tebal: false }]];
  return bab.map((x) => [{ teks: PERAN[x.peran], tebal: true }, ...(x.sekolah ? [{ teks: ` · ${x.sekolah}`, tebal: false }] : [])]);
}

/**
 * FRONT. Above the line, what is permanent: «PINTAR SELALU», the name, the PINTAR ID.
 * Below it, the current chapter: the role and the school, read at render time.
 * A family changes one thing: the colour below the line.
 */
export function depan(o: Orang, opsi: OpsiMuka = {}): string {
  const b = opsi.bleed ?? 0;
  const g = opsi.garisMm ?? GARIS_MM;
  const w = opsi.abu ? abuWarna(WARNA) : WARNA;
  const { lebar: W, tinggi: H } = UKURAN;
  const warnaAsli = opsi.warnaBab ?? PALET[opsi.palet ?? "terpisah"][o.bab[0].peran];
  const warna = opsi.abu ? abuHex(warnaAsli) : warnaAsli;
  const baris = barisBab(o.bab, opsi.susunan);
  const isi = `
<div style="position:absolute;left:${mm(-b)};top:${mm(TATA.garis)};width:${mm(W + 2 * b)};height:${mm(H - TATA.garis + b)};background:${warna};"></div>
${garisEmas(w, g, b)}
<p class="kp-merek merek" style="position:absolute;left:${mm(TATA.tepi)};top:${mm(TATA.atas)};color:${w.hijau};">PINTAR SELALU</p>
<div style="position:absolute;left:${mm(TATA.tepi)};width:${mm(W - 2 * TATA.tepi)};bottom:${mm(H - TATA.garis + g / 2 + TATA.jarakAtas)};">
  <p class="kp-nama" style="color:${w.tinta};">${esc(o.nama)}</p>
  <p class="kp-id" style="margin-top:1.3mm;color:${w.tinta2};">${esc(tampilId(o.id))}</p>
</div>
<div class="kp-bab" style="position:absolute;left:${mm(TATA.tepi)};width:${mm(W - 2 * TATA.tepi)};top:${mm(TATA.garis + g / 2 + TATA.jarakBawah)};color:${w.kertas};">
  ${baris.map((b) => `<p class="kp-bab-baris">${b.map((r) => `<span class="${r.tebal ? "kp-peran" : "kp-sekolah"}">${esc(r.teks)}</span>`).join("")}</p>`).join("\n  ")}
</div>`;
  return bingkai(isi, w.kertas, "kp-depan", opsi);
}

// ── QR ───────────────────────────────────────────────────────────────────────
export type VarianQr = { kode: string; nama: string; matriks: number[][]; versi: number; ecc: "M" | "Q" | "H"; sumber: string };
export const TENANG = 4; // quiet zone, modules (ISO/IEC 18004 minimum)
export const PITA_ID = 3.9; // mm under the quiet zone for the ID, inside the tile

/**
 * The tile: centred, from just inside the top safe margin down to 2 mm above the
 * line. Its height sets the module: the symbol and its full 4-module quiet zone
 * fill a square, and the ID sits BELOW the quiet zone, never in it.
 */
export function letakUbin(v: VarianQr, lebarGaris = GARIS_MM): { kiri: number; atas: number; sisi: number; tinggi: number; modul: number; simbol: number } {
  const n = v.matriks.length;
  const atas = UKURAN.aman + 0.6;
  const bawah = TATA.garis - lebarGaris / 2 - 2.0;
  const tinggi = bawah - atas;
  const sisi = tinggi - PITA_ID;
  const modul = sisi / (n + 2 * TENANG);
  return { kiri: (UKURAN.lebar - sisi) / 2, atas, sisi, tinggi, modul, simbol: n * modul };
}

/** One QR as inline SVG: vector modules, printed at the printer's own resolution. */
export function svgQr(v: VarianQr, modul: number, latar: string, modulWarna: string): string {
  const n = v.matriks.length;
  const q = TENANG;
  let d = "";
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (v.matriks[r][c]) {
        let e = c;
        while (e < n && v.matriks[r][e]) e++;
        d += `M${c} ${r}h${e - c}v1h-${e - c}z`;
        c = e;
      } else c++;
    }
  }
  const sisi = (n + 2 * q) * modul;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${mm(sisi)}" height="${mm(sisi)}" viewBox="${-q} ${-q} ${n + 2 * q} ${n + 2 * q}" shape-rendering="crispEdges" style="display:block">
<rect x="${-q}" y="${-q}" width="${n + 2 * q}" height="${n + 2 * q}" fill="${latar}"/><path d="${d}" fill="${modulWarna}"/></svg>`;
}

export const KATA_BELAKANG = {
  // proposed in round 1; Yazid's decision (README §7)
  petunjuk: "Pindai untuk membuka halaman masuk PINTAR.",
  situs: "pintarselalu.com",
};

/**
 * BACK. The same for every family. The front's grammar, not a copy of it: the
 * same paper, the same line at the same height, the same type. Above the line,
 * the PINTAR tile (green modules on the soft-green tile, the ID beneath); below
 * it, on paper, what the QR does and the website, centred on the tile's axis.
 */
export function belakang(o: Orang, v: VarianQr, opsi: OpsiMuka & { petunjuk?: string } = {}): string {
  const b = opsi.bleed ?? 0;
  const g = opsi.garisMm ?? GARIS_MM;
  const w = opsi.abu ? abuWarna(WARNA) : WARNA;
  const p = letakUbin(v, g);
  const { lebar: W, tinggi: H } = UKURAN;
  const isi = `
${garisEmas(w, g, b)}
<div class="kp-ubin" style="position:absolute;left:${mm(p.kiri)};top:${mm(p.atas)};width:${mm(p.sisi)};height:${mm(p.tinggi)};background:${w.hijauLembut};border-radius:1.6mm;overflow:hidden;">
${svgQr(v, p.modul, w.hijauLembut, w.hijau)}
<p class="kp-id kp-id-ubin" style="position:absolute;left:0;right:0;top:${mm(p.sisi + 0.15)};text-align:center;color:${w.hijau};padding-left:0.06em;">${esc(tampilId(o.id))}</p></div>
<p class="kp-petunjuk" style="position:absolute;left:${mm(TATA.tepi)};width:${mm(W - 2 * TATA.tepi)};top:${mm(TATA.garis + g / 2 + TATA.jarakBawah)};text-align:center;color:${w.tinta};">${esc(opsi.petunjuk ?? KATA_BELAKANG.petunjuk)}</p>
<p class="kp-situs" style="position:absolute;left:${mm(TATA.tepi)};width:${mm(W - 2 * TATA.tepi)};bottom:${mm(TATA.tepi - 0.4)};text-align:center;color:${w.tinta3};">${KATA_BELAKANG.situs}</p>`;
  void H;
  return bingkai(isi, w.kertas, "kp-belakang", opsi);
}
