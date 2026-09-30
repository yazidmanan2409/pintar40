/**
 * Kartu PINTAR, round 1 design exploration (input to DAISY-24, Gate 7).
 *
 * The card's grammar, written once. Every family and every sample goes through
 * the same two functions, `depan` (front) and `belakang` (back), so the six
 * cards cannot drift apart: a family changes one colour, nothing else.
 *
 * Nothing here is application code. It is the design written down precisely
 * enough to render the same way every time. The words are samples, not copy.
 * Units are millimetres at actual size (CR80) unless a name says otherwise.
 */

/** CR80 (ISO/IEC 7810 ID-1). `aman` = the safe margin for type and the QR; `bleed` = colour past the trim. */
export const UKURAN = { lebar: 85.6, tinggi: 53.98, sudut: 3.18, aman: 3, bleed: 2 } as const;

/**
 * The grid. `tepi`: the text margin (6 mm, inside the 3 mm safe margin).
 * `lapis`: the light layer's height. The colour layer takes the rest (23.98 mm).
 */
export const TATA = { tepi: 6, atas: 5.2, lapis: 30, bawahLapis: 4.4, bawahBab: 5 } as const;

/**
 * Plus Jakarta Sans's word space is 0.17 em: 0.45 mm at 7.5 pt, narrow enough
 * for ink spread to close it on an office printer. The small styles add 0.06 em
 * (0.61 mm in all at 7.5 pt). The name, at 12 pt, keeps the font's own space.
 */
/** The app's own tokens (src/app/globals.css), and nothing else. */
export const WARNA = {
  kertas: "#FBFAF7", // --surface-0: the card's paper; in print, unprinted stock
  tinta: "#1F2A33", // --ink-1
  tinta2: "#4E5A64", // --ink-2
  tinta3: "#5F6A73", // --ink-3
  hijau: "#245F55", // --pintar-primary
  hijauLembut: "#E3EFEC", // --pintar-primary-soft
} as const;

export type Keluarga = "murid" | "guru" | "kadep" | "dekan" | "adminSekolah" | "adminPlatform";
export const KELUARGA: Keluarga[] = ["murid", "guru", "kadep", "dekan", "adminSekolah", "adminPlatform"];

/** Terminology v1 (D-068) role names, exactly as written there. */
export const PERAN: Record<Keluarga, string> = {
  murid: "Murid", guru: "Guru", kadep: "Kepala departemen", dekan: "Dekan",
  adminSekolah: "Admin sekolah", adminPlatform: "Admin platform",
};

export type Palet = "yazid" | "setara";
/**
 * `yazid`: the working colours as given. `setara` ("equal"): the same hue
 * directions moved to one lightness, so one text colour serves all six and no
 * card is lighter or darker than another. Every change is in the README.
 */
export const PALET: Record<Palet, Record<Keluarga, string>> = {
  yazid: {
    murid: "#789EB5", guru: "#688F78", kadep: "#587F7D",
    dekan: "#465B70", adminSekolah: "#686560", adminPlatform: "#393E41",
  },
  setara: {
    murid: "#436478", guru: "#466754", kadep: "#406766",
    dekan: "#51607D", adminSekolah: "#695E53", adminPlatform: "#5B6167",
  },
};
export const NAMA_WARNA: Record<Keluarga, string> = {
  murid: "Slate Blue", guru: "Deep Sage", kadep: "Deep Teal",
  dekan: "Deep Navy", adminSekolah: "Deep Stone", adminPlatform: "Charcoal",
};

// ── contrast (WCAG 2.x), the same formula as the email frame's README ─────────
const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
export const luminans = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const rasio = (a: string, b: string) => {
  const [x, y] = [luminans(a), luminans(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/**
 * The text colour on a family's colour layer. On `setara` it is always the
 * paper itself. On `yazid` no single colour works, so each card takes the
 * better of paper and ink; the README table shows which pairs still fall short.
 */
export function tintaBab(palet: Palet, k: Keluarga): string {
  const latar = PALET[palet][k];
  if (palet === "setara") return WARNA.kertas;
  return rasio(WARNA.kertas, latar) >= rasio(WARNA.tinta, latar) ? WARNA.kertas : WARNA.tinta;
}

// ── typography: two families, four sizes, three weights ─────────────────────
export type Gaya = {
  peran: string; huruf: "Plus Jakarta Sans" | "IBM Plex Mono"; berat: 400 | 500 | 600;
  pt: number; baris: number; spasi: number /* em */; kata?: number /* word spacing, em */; kapital?: boolean; warna: string;
};
export const GAYA: Record<string, Gaya> = {
  nama: { peran: "Person name", huruf: "Plus Jakarta Sans", berat: 600, pt: 12, baris: 1.15, spasi: -0.01, warna: "ink #1F2A33" },
  id: { peran: "PINTAR ID", huruf: "IBM Plex Mono", berat: 500, pt: 9, baris: 1.2, spasi: 0.06, warna: "ink-2 #4E5A64" },
  peran: { peran: "Role", huruf: "Plus Jakarta Sans", berat: 600, pt: 7.5, baris: 1.3, spasi: 0, kata: 0.06, warna: "paper #FBFAF7 on the family colour" },
  sekolah: { peran: "School", huruf: "Plus Jakarta Sans", berat: 400, pt: 7.5, baris: 1.3, spasi: 0.005, kata: 0.06, warna: "paper #FBFAF7 on the family colour" },
  petunjuk: { peran: "QR instruction", huruf: "Plus Jakarta Sans", berat: 400, pt: 7.5, baris: 1.35, spasi: 0.005, kata: 0.06, warna: "ink #1F2A33" },
  merek: { peran: "PINTAR wordmark", huruf: "Plus Jakarta Sans", berat: 600, pt: 6.5, baris: 1, spasi: 0.14, kapital: true, warna: "PINTAR green #245F55" },
  label: { peran: "Label (PINTAR ID)", huruf: "Plus Jakarta Sans", berat: 600, pt: 6.5, baris: 1, spasi: 0.08, kapital: true, warna: "ink-3 #5F6A73" },
  kecil: { peran: "Small supporting text", huruf: "Plus Jakarta Sans", berat: 400, pt: 6.5, baris: 1.3, spasi: 0.01, kata: 0.06, warna: "ink-3 #5F6A73" },
};
const gayaCss = (g: Gaya) =>
  `font-family:'${g.huruf}';font-weight:${g.berat};font-size:${g.pt}pt;line-height:${g.baris};letter-spacing:${g.spasi}em;${g.kata ? `word-spacing:${g.kata}em;` : ""}${g.kapital ? "text-transform:uppercase;" : ""}`;

/**
 * Fonts from the app's own self-hosted files (public/fonts, SIL OFL 1.1).
 * `statis`: a folder with static 400 and 600 instances cut from the same
 * variable file, for the PDF (uji-qr.py huruf), so the PDF embeds TrueType.
 */
export function css(akar: string, statis?: string): string {
  const f = (n: string) => `url("file://${akar}/public/fonts/${n}") format("woff2")`;
  const pjs = statis
    ? [400, 600].map((w) => `@font-face { font-family: "Plus Jakarta Sans"; font-weight: ${w}; src: url("file://${statis}/plus-jakarta-sans-${w}.ttf") format("truetype"); }`).join("\n")
    : `@font-face { font-family: "Plus Jakarta Sans"; font-weight: 200 800; src: ${f("plus-jakarta-sans-latin.woff2")}; }
@font-face { font-family: "Plus Jakarta Sans"; font-weight: 200 800; src: ${f("plus-jakarta-sans-latin-ext.woff2")}; unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1E00-1E9F, U+1EF2-1EFF; }`;
  return `
${pjs}
@font-face { font-family: "IBM Plex Mono"; font-weight: 500; src: ${f("ibm-plex-mono-500-latin.woff2")}; }
.kp { position: relative; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-kerning: normal; text-rendering: geometricPrecision; }
.kp * { box-sizing: border-box; margin: 0; }
.kp-trim { position: absolute; }
.kp-merek { ${gayaCss(GAYA.merek)} color: ${WARNA.hijau}; }
.kp-nama { ${gayaCss(GAYA.nama)} color: ${WARNA.tinta}; overflow-wrap: break-word; }
.kp-id { ${gayaCss(GAYA.id)} color: ${WARNA.tinta2}; white-space: nowrap; }
.kp-peran { ${gayaCss(GAYA.peran)} }
.kp-sekolah { ${gayaCss(GAYA.sekolah)} }
.kp-petunjuk { ${gayaCss(GAYA.petunjuk)} color: ${WARNA.tinta}; }
.kp-label { ${gayaCss(GAYA.label)} color: ${WARNA.tinta3}; }
.kp-kecil { ${gayaCss(GAYA.kecil)} color: ${WARNA.tinta3}; }
`;
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** «A14C D7ST»: stored as 8 characters, shown 4 + 4 (IDENTITY-4.0 §4). */
export const tampilId = (id: string) => `${id.slice(0, 4)} ${id.slice(4)}`;

export type Orang = {
  nama: string;
  /** one family; two only for the open two-role question */
  peran: Keluarga[];
  /** null: no school (Admin platform) */
  sekolah: string | null;
  id: string;
};

const mm = (v: number) => `${+v.toFixed(3)}mm`;

export type OpsiMuka = {
  /** colour past the trim, for print (mm); 0 = the screen card, with its rounded corners */
  bleed?: number;
  /** on screen only: the app's one hairline round the card, so its paper reads on a white page */
  garis?: boolean;
};

/** The frame both faces share: trim box, optional bleed, rounded corners on screen only. */
function bingkai(isi: string, latar: string, kelas: string, o: OpsiMuka): string {
  const { lebar: W, tinggi: H, sudut: R } = UKURAN;
  const b = o.bleed ?? 0;
  const garis = o.garis && !b
    ? `<div style="position:absolute;inset:0;border-radius:${mm(R)};border:0.2mm solid rgba(31,42,51,0.16);"></div>`
    : "";
  return `<div class="kp ${kelas}" style="width:${mm(W + 2 * b)};height:${mm(H + 2 * b)};background:${latar};border-radius:${b ? 0 : mm(R)};">
<div class="kp-trim" style="left:${mm(b)};top:${mm(b)};width:${mm(W)};height:${mm(H)};">${isi}</div>${garis}</div>`;
}

/**
 * FRONT. Two layers, the logo's own geometry (PINTAR over SELALU, light over dark):
 *   the light layer carries what is permanent: the wordmark, the name, the PINTAR ID;
 *   the colour layer carries the current chapter: the role and the school, read at render time.
 * The colour layer is the only thing a family changes.
 * `bab`: where the chapter sits. "garis" (chosen) hangs it from the split; "bawah",
 * at the card's foot, was the first try and is kept so the comparison can be re-rendered.
 */
export function depan(o: Orang, palet: Palet, opsi: OpsiMuka & { warnaBab?: string; tintaBab?: string; bab?: "bawah" | "garis" } = {}): string {
  const b = opsi.bleed ?? 0;
  const { lebar: W, tinggi: H } = UKURAN;
  const k = o.peran[0];
  const warna = opsi.warnaBab ?? PALET[palet][k];
  const tinta = opsi.tintaBab ?? tintaBab(palet, k);
  const peran = o.peran.map((p) => PERAN[p]).join(" · ");
  const isi = `
<div style="position:absolute;left:${mm(-b)};top:${mm(TATA.lapis)};width:${mm(W + 2 * b)};height:${mm(H - TATA.lapis + b)};background:${warna};"></div>
<div class="kp-merek" style="position:absolute;left:${mm(TATA.tepi)};top:${mm(TATA.atas)};">PINTAR</div>
<div class="kp-orang" style="position:absolute;left:${mm(TATA.tepi)};width:${mm(W - 2 * TATA.tepi)};bottom:${mm(H - TATA.lapis + TATA.bawahLapis)};">
  <p class="kp-nama">${esc(o.nama)}</p>
  <p class="kp-id" style="margin-top:1.3mm;">${esc(tampilId(o.id))}</p>
</div>
<div class="kp-bab" style="position:absolute;left:${mm(TATA.tepi)};width:${mm(W - 2 * TATA.tepi)};${(opsi.bab ?? "garis") === "garis" ? `top:${mm(TATA.lapis + TATA.bawahLapis)}` : `bottom:${mm(TATA.bawahBab)}`};color:${tinta};">
  <p class="kp-peran">${esc(peran)}</p>
  ${o.sekolah ? `<p class="kp-sekolah">${esc(o.sekolah)}</p>` : ""}
</div>`;
  return bingkai(isi, WARNA.kertas, "kp-depan", opsi);
}

// ── QR ───────────────────────────────────────────────────────────────────────
export type VarianQr = {
  kode: string;
  nama: string;
  matriks: number[][];
  versi: number;
  ecc: "M" | "Q" | "H";
  modul: number; // mm
  sumber: string;
  ubin?: boolean; // a tile in PINTAR's soft green, with the ID under the symbol
  lubang?: [number, number]; // a centre knock-out for the logo, in modules [wide, high] (needs level H)
};
export const TENANG = 4; // quiet zone, modules (ISO/IEC 18004 minimum)

/**
 * One QR as inline SVG: vector modules, so it prints at the printer's own
 * resolution. `logo` (a data: or file: URL) fills the knock-out, if there is one.
 */
export function svgQr(v: VarianQr, latar: string, logo?: string): string {
  const n = v.matriks.length;
  const q = TENANG;
  const [lw, lh] = v.lubang ?? [0, 0];
  const c0 = (n - lw) / 2, r0 = (n - lh) / 2;
  const diLubang = (r: number, c: number) => lw > 0 && r >= r0 && r < r0 + lh && c >= c0 && c < c0 + lw;
  let d = "";
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (v.matriks[r][c] && !diLubang(r, c)) {
        let e = c;
        while (e < n && v.matriks[r][e] && !diLubang(r, e)) e++;
        d += `M${c} ${r}h${e - c}v1h-${e - c}z`;
        c = e;
      } else c++;
    }
  }
  let tanda = "";
  if (lw > 0 && logo) {
    // the logo's own artwork (766 x 429), inset by 0.6 of a module on every side
    const w = lw - 1.2, h = w * 429 / 766;
    tanda = `<image href="${logo}" x="${c0 + 0.6}" y="${r0 + (lh - h) / 2}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  const sisi = (n + 2 * q) * v.modul;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${mm(sisi)}" height="${mm(sisi)}" viewBox="${-q} ${-q} ${n + 2 * q} ${n + 2 * q}" shape-rendering="crispEdges" style="display:block">
<rect x="${-q}" y="${-q}" width="${n + 2 * q}" height="${n + 2 * q}" fill="${latar}"/><path d="${d}" fill="${WARNA.hijau}"/>${tanda}</svg>`;
}

/**
 * Where the QR sits on the back, in trim coordinates (the decode test reads these).
 * The symbol's right edge sits on the 6 mm text margin (for the tile, the tile's
 * edge does), unless the quiet zone would then cross the 3 mm safe margin; it is
 * centred vertically.
 */
export function letakQr(v: VarianQr): { kiri: number; atas: number; sisi: number; tinggi: number; simbol: number } {
  const n = v.matriks.length;
  const simbol = n * v.modul;
  const tenang = TENANG * v.modul;
  const keterangan = v.ubin ? 4.4 : 0; // the tile's ID strip under the symbol
  const sisi = simbol + 2 * tenang;
  // plain: the symbol's edge on the margin; tile: the tile's edge on the margin (the tile is what the eye sees)
  const kanan = v.ubin ? TATA.tepi + tenang : Math.max(TATA.tepi, UKURAN.aman + tenang); // symbol edge to trim
  const kiri = UKURAN.lebar - kanan - simbol - tenang;
  const tinggi = sisi + keterangan;
  const atas = (UKURAN.tinggi - tinggi) / 2;
  return { kiri, atas, sisi, tinggi, simbol };
}

export const KATA_BELAKANG = {
  // sample wording, proposed, not decided (README §QR instruction)
  petunjuk: "Pindai untuk membuka halaman masuk PINTAR.",
  label: "PINTAR ID",
  situs: "pintarselalu.com",
};

/**
 * BACK. The same for every family: paper, the PINTAR logo, one line on what the
 * QR does, the PINTAR ID, and the QR in PINTAR green. It mirrors the front's
 * grid: the logo where the front has its wordmark, the text on the same 6 mm
 * margin, and the QR standing on the right.
 */
export function belakang(o: Orang, v: VarianQr, logo: string, opsi: OpsiMuka & { petunjuk?: string } = {}): string {
  const p = letakQr(v);
  const lebarKolom = p.kiri - TATA.tepi - 3;
  const qr = v.ubin
    ? `<div style="position:absolute;left:${mm(p.kiri)};top:${mm(p.atas)};width:${mm(p.sisi)};height:${mm(p.tinggi)};background:${WARNA.hijauLembut};border-radius:1.6mm;overflow:hidden;">
${svgQr(v, WARNA.hijauLembut, logo)}<p class="kp-id" style="position:absolute;left:0;right:0;top:${mm(p.sisi - TENANG * v.modul + 1.6)};text-align:center;color:${WARNA.hijau};">${esc(tampilId(o.id))}</p></div>`
    : `<div style="position:absolute;left:${mm(p.kiri)};top:${mm(p.atas)};">${svgQr(v, WARNA.kertas, logo)}</div>`;
  const idDiKolom = v.ubin
    ? ""
    : `<p class="kp-label" style="margin-top:3.2mm;">${KATA_BELAKANG.label}</p><p class="kp-id" style="margin-top:1.1mm;color:${WARNA.tinta};">${esc(tampilId(o.id))}</p>`;
  const isi = `${qr}
<img src="${logo}" alt="PINTAR" style="position:absolute;left:${mm(TATA.tepi)};top:${mm(TATA.atas)};height:6.4mm;width:auto;display:block;">
<div style="position:absolute;left:${mm(TATA.tepi)};width:${mm(lebarKolom)};bottom:${mm(TATA.bawahBab)};">
  <p class="kp-petunjuk">${esc(opsi.petunjuk ?? KATA_BELAKANG.petunjuk)}</p>
  ${idDiKolom}
  <p class="kp-kecil" style="margin-top:3.2mm;">${KATA_BELAKANG.situs}</p>
</div>`;
  return bingkai(isi, WARNA.kertas, "kp-belakang", opsi);
}
