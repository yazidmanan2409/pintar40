/**
 * Sertifikat PINTAR, round 2: Yazid's revised Modern composition, refined.
 *
 * Yazid chose the direction after round 1 (dd292f6) and drew it. This file sets
 * that composition down once, with the refinements the brief allows
 * (typography, alignment, spacing, proportion). It adds nothing. Structure,
 * decided by Yazid: Achievement → Issuer → Verification.
 *
 *   HEADER       «SERTIFIKAT PENGUASAAN» upper-left; the PINTAR wordmark upper-right on its baseline
 *                (brand correction, 5 Oct: it replaces «PINTAR SELALU» in type; nothing else changed)
 *   ACHIEVEMENT  the name (dominant), «telah menuntaskan», the course; centred. The course's
 *                middle dot stays with the subject: a line never starts «· Bab 5»
 *   RECORD       Predikat, Tanggal terbit, Nomor sertifikat: one restrained block,
 *                centred on the page's axis, labels meeting values at a gutter. The
 *                number is one indivisible display value (Yazid, 30 Sep): it never
 *                breaks, not even at «/»; when space is tight the layout adapts, then
 *                the type, never the identifier (ukuranNomor)
 *   THE LINE     the card's warm gold, at the card's proportion (176 of 297 mm)
 *   ISSUER       the band in the learning context's accent: «Diterbitkan oleh», the school
 *   VERIFICATION a quiet group at the foot: «Periksa keaslian», its sentence, the
 *                printed link; the QR in generous clear space
 *
 * Round 1's grammar (../sertifikat.mts) is left as it was; its tokens, fonts,
 * QR drawing and colour helpers are reused from there. Design only: not
 * application code. Millimetres at actual size, A4 portrait.
 */
import { WARNA, AKSEN, abuHex, rasio, svgQr, esc, css as cssR1, TENANG, type Konteks, type Warna } from "../sertifikat.mjs";

export { WARNA, AKSEN, abuHex, rasio, esc, TENANG, type Konteks };
export const A4 = { w: 210, h: 297 } as const;

/**
 * THE GRID (mm).
 * `tepi`: the text margin. `sisiPita`: the band and the line stop this far from
 * each edge: inside every office printer's unprintable margin, so the band always
 * prints whole and never ends in an accidental white sliver (the reference drew
 * it to the edge; see README §2). `garis`: the line's centre, the card's
 * proportion. `pita`: the band's height. `rekamBawah`: the record block's last
 * row ends this far above the line. `verifikasi`: the verification group's top.
 */
export const TATA = { tepi: 20, atas: 22, sisiPita: 10, garis: 176, pita: 34, rekamBawah: 16, verifikasi: 236 } as const;
export const GARIS_MM = 0.75; // the card's width: approved for the physical proof (Yazid, 30 Sep); frozen only if the print works beside the card family
export const QR_MM = 26; // the symbol, modules only
export const KOLOM_TEKS = 92; // the verification text column: holds the 16-character stress link grouped, at 9 pt, on one line (89.5 mm)
export const CELAH_QR = 12; // between the text and the QR's modules

export type Gaya = { huruf: "Plus Jakarta Sans" | "IBM Plex Mono" | "Helvetica Neue"; berat: 400 | 500 | 600; pt: number; baris: number; spasi: number; kata?: number; kapital?: boolean; tangga: string; peran: string; warna: string };
/**
 * Every size is a step of the app's token ladder (the sheet renders at 96 dpi,
 * so 1 pt = 1.333 px). Round 1's three print-only 7 pt sizes are gone: the
 * labels take the ladder's own eyebrow (12 px = 9 pt, 600, capitals, tracked),
 * as the reference draws them, and the link is one line at 9 pt.
 */
export const GAYA: Record<string, Gaya> = {
  kepala: { peran: "«SERTIFIKAT PENGUASAAN»", huruf: "Plus Jakarta Sans", berat: 600, pt: 12, baris: 1.15, spasi: 0.12, kata: 0.1, kapital: true, tangga: "body 16 px", warna: "the accent" },
  // The canonical wordmark (brand correction, 5 Oct). Its cap height is the header's (12 pt × 0.745 = 3.15 mm),
  // so the two header words keep their balance; 17.75 mm wide in the stand-in face, over the 15 mm print minimum.
  merek: { peran: "PINTAR, the canonical wordmark (5 Oct)", huruf: "Helvetica Neue", berat: 500, pt: 12.5, baris: 1, spasi: 0.05, kapital: true, tangga: "the wordmark (cap height = the header's)", warna: "PINTAR green #245F55" },
  nama: { peran: "Recipient's name", huruf: "Plus Jakarta Sans", berat: 600, pt: 33, baris: 1.05, spasi: -0.018, tangga: "name-print 44 px", warna: "ink #1F2A33" },
  diberikan: { peran: "«telah menuntaskan»", huruf: "Plus Jakarta Sans", berat: 400, pt: 12, baris: 1.25, spasi: 0, tangga: "body 16 px", warna: "ink-2 #4E5A64" },
  kursus: { peran: "Course title", huruf: "Plus Jakarta Sans", berat: 600, pt: 16.5, baris: 1.25, spasi: -0.005, tangga: "subhead 22 px", warna: "ink #1F2A33" },
  label: { peran: "Labels (Predikat, Tanggal terbit, Nomor sertifikat, Diterbitkan oleh)", huruf: "Plus Jakarta Sans", berat: 600, pt: 9, baris: 1.15, spasi: 0.14, kata: 0.1, kapital: true, tangga: "eyebrow 12 px", warna: "ink-3 #5F6A73; paper on the band" },
  nilai: { peran: "Predikat and date", huruf: "Plus Jakarta Sans", berat: 600, pt: 12.75, baris: 1.25, spasi: 0, tangga: "card 17 px", warna: "ink #1F2A33" },
  nomor: { peran: "Certificate number", huruf: "IBM Plex Mono", berat: 500, pt: 12, baris: 1.25, spasi: 0.02, tangga: "body 16 px", warna: "ink #1F2A33" },
  sekolah: { peran: "Issuing school", huruf: "Plus Jakarta Sans", berat: 600, pt: 16.5, baris: 1.25, spasi: -0.005, tangga: "subhead 22 px", warna: "paper #FBFAF7 on the band" },
  periksa: { peran: "«Periksa keaslian»", huruf: "Plus Jakarta Sans", berat: 600, pt: 9, baris: 1.15, spasi: 0.14, kata: 0.1, kapital: true, tangga: "eyebrow 12 px", warna: "ink #1F2A33" },
  arti: { peran: "Verification sentence", huruf: "Plus Jakarta Sans", berat: 400, pt: 9, baris: 1.5, spasi: 0.005, kata: 0.05, tangga: "eyebrow 12 px", warna: "ink-2 #4E5A64" },
  tautan: { peran: "Printed link", huruf: "IBM Plex Mono", berat: 500, pt: 9, baris: 1.25, spasi: 0, tangga: "eyebrow 12 px", warna: "ink #1F2A33" },
};
const gayaCss = (g: Gaya) =>
  `font-family:'${g.huruf}';font-weight:${g.berat};font-size:${g.pt}pt;line-height:${g.baris};letter-spacing:${g.spasi}em;${g.kata ? `word-spacing:${g.kata}em;` : ""}${g.kapital ? "text-transform:uppercase;" : ""}`;

export function css(akar: string, statis?: string): string {
  return `${cssR1(akar, statis)}
.s2 { position: relative; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-kerning: normal; text-rendering: geometricPrecision; }
.s2 * { box-sizing: border-box; margin: 0; }
.s2 .abs { position: absolute; }
${Object.entries(GAYA).map(([k, g]) => `.s2 .t-${k} { ${gayaCss(g)} }`).join("\n")}
.s2 .t-nama, .s2 .t-kursus, .s2 .t-sekolah { overflow-wrap: break-word; text-wrap: balance; }
/* the number and the link are single values: no break anywhere in them, «/» included */
.s2 .t-nomor, .s2 .t-tautan { white-space: nowrap; }
.s2 .t-arti { text-wrap: pretty; }
/* The wordmark: its cap height normalised to Helvetica Neue's 0.714 so a stand-in proof face draws the
   same cap height; the box trimmed to the letters. A proof until the outlined master replaces it. */
.s2 .t-merek { font-family: "Helvetica Neue", "Neue Helvetica", Helvetica, Arial, sans-serif; font-synthesis: none; font-size-adjust: cap-height 0.714; text-box: trim-both cap alphabetic; white-space: nowrap; margin-right: -0.05em; }
`;
}

/** The words, from the app's copy table (the render script fills them); «Diterbitkan oleh» borrows verifikasi.institusi. */
export type Kata = { jenis: string; diberikan: string; predikat: string; tanggal: string; nomor: string; periksa: string; arti: string; penerbit: string };

/** One certificate as issued: the name, the course and the school as they were at issuance. */
export type Data = {
  sekolah: string; nama: string; kursus: string; predikat: string; tanggal: string;
  /** stored form, e.g. «A14CD7ST/00001» */
  nomor: string;
  /** the QR's content (the full https link, or its uppercase alphanumeric form) */
  isiQr: string;
  /** the link as printed: no protocol, e.g. «verifikasi.pintarselalu.com/K7M4QX9P2HDT» */
  tautan: string;
  matriks: number[][];
  konteks: Konteks;
};

export type Opsi = {
  /** the sheet's own paper: the screen's warm white, or "" for print */
  kertas?: string;
  abu?: boolean;
  garisMm?: number;
  /** the number with the PINTAR ID in its 4 + 4 display form, a space between (study) */
  nomor44?: boolean;
  /** the 4 + 4 form drawn as a gap, with no space character: the text stays the stored form (study) */
  nomorCelah?: boolean;
  /** the token printed in groups of four, «K7M4-QX9P-2HDT» (study; depends on Bob's route) */
  tokenKelompok?: boolean;
  /** as the reference drew them (studies for the before/after sheet) */
  pitaPenuh?: boolean;
  sekolahKapital?: boolean;
  rekamKiri?: boolean;
  bingkai?: boolean;
};

const mm = (v: number) => `${+v.toFixed(3)}mm`;
const abuWarna = (w: Warna): Warna => Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v.startsWith("#") ? abuHex(v) : v])) as Warna;

/**
 * THE NUMBER NEVER BREAKS (Yazid's ruling 2, 30 Sep): «A14CD7ST/00001» is one
 * indivisible display value, in every case. When space is tight, first the
 * layout adapts: the record's value column is `1fr` with the number as its
 * minimum, so a longer number moves the axis to the left instead of wrapping.
 * Past what the record can hold beside its labels, the type steps down the
 * ladder (12 pt body → 10.5 pt meta → 9.75 pt fine). Plex Mono is monospaced, so
 * the width is exact: characters × (0.6 em advance + 0.02 em tracking).
 */
export const NOMOR_MUAT_MM = A4.w - 2 * TATA.tepi - 8 - 42; // beside «NOMOR SERTIFIKAT» (≈ 38 mm) and the 8 mm gutter
export const lebarNomorMm = (n: string, pt: number) => n.length * (0.6 + 0.02) * pt * (25.4 / 72);
export function ukuranNomor(n: string): number {
  for (const pt of [12, 10.5, 9.75]) if (lebarNomorMm(n, pt) <= NOMOR_MUAT_MM) return pt;
  return 9.75; // no identifier of the proposed form comes near this; the layout checks would report it
}

/** «A14CD7ST/00001» → «A14C D7ST/00001» (the ID's 4 + 4 display form, IDENTITY-4.0 §4). */
export const nomor44 = (n: string) => n.replace(/^([0-9A-Z]{4})([0-9A-Z]{4})\//, "$1 $2/");
/** the token in groups of four, with hyphens (Crockford Base32 ignores them) */
export const tautanKelompok = (t: string) => t.replace(/\/([0-9A-Z]+)$/, (_, k: string) => `/${k.match(/.{1,4}/g)!.join("-")}`);

/** One certificate, one A4 sheet. */
export function sertifikat(d: Data, k: Kata, o: Opsi = {}): string {
  const w = o.abu ? abuWarna(WARNA) : WARNA;
  const aksen = o.abu ? abuHex(AKSEN[d.konteks]) : AKSEN[d.konteks];
  const g = o.garisMm ?? GARIS_MM;
  const { tepi, atas, sisiPita, garis, pita, rekamBawah, verifikasi } = TATA;
  const lebar = A4.w - 2 * tepi;
  const kiriPita = o.pitaPenuh ? 0 : sisiPita;
  const lebarPita = A4.w - 2 * kiriPita;
  const latar = o.kertas === undefined ? w.kertas : o.kertas || "transparent";
  const nomor = o.nomor44 ? nomor44(d.nomor) : d.nomor;
  const tautan = o.tokenKelompok ? tautanKelompok(d.tautan) : d.tautan;

  // THE RECORD: three rows, labels right-aligned to the page's axis, values left-aligned from it
  const baris = (label: string, nilaiHtml: string, kelas: string, gaya = "") =>
    `<p class="t-label" style="text-align:${o.rekamKiri ? "left" : "right"};color:${w.tinta3}">${esc(label)}</p><p class="${kelas}" style="color:${w.tinta};${gaya}">${nilaiHtml}</p>`;
  const ptNomor = ukuranNomor(nomor);
  const celah = o.nomorCelah ? d.nomor.match(/^([0-9A-Z]{4})([0-9A-Z]{4}\/.*)$/) : null;
  const nomorHtml = celah ? `${esc(celah[1])}<span style="margin-left:0.5em">${esc(celah[2])}</span>` : esc(nomor);
  const rekam = `<div class="abs s2-rekam" style="left:${mm(tepi)};width:${mm(lebar)};bottom:${mm(A4.h - garis + g / 2 + rekamBawah)};display:grid;grid-template-columns:${o.rekamKiri ? "54mm 1fr" : "1fr 1fr"};column-gap:8mm;row-gap:5mm;align-items:baseline">
${baris(k.predikat, esc(d.predikat), "t-nilai")}${baris(k.tanggal, esc(d.tanggal), "t-nilai")}${baris(k.nomor, nomorHtml, "t-nomor", ptNomor < GAYA.nomor.pt ? `font-size:${ptNomor}pt` : "")}</div>`;

  // THE ACHIEVEMENT: centred between the header and the record, and never closer to either than 10 mm
  const pencapaian = `<div class="abs s2-capaian" style="left:${mm(tepi)};width:${mm(lebar)};top:${mm(atas + 14)};bottom:${mm(A4.h - garis + g / 2 + rekamBawah + 30)};display:flex;flex-direction:column;justify-content:center;text-align:center">
  <p class="t-nama" style="color:${w.tinta}">${esc(d.nama)}</p>
  <p class="t-diberikan" style="color:${w.tinta2};margin-top:6mm">${esc(k.diberikan)}</p>
  <p class="t-kursus" style="color:${w.tinta};margin-top:2mm">${esc(d.kursus).replace(/ · /g, "\u00a0· ")}</p>
</div>`;

  // THE ISSUER: the band, the line lying on its top edge (drawn after it, over its first half-width)
  const penerbit = `<div class="abs s2-pita" style="left:${mm(kiriPita)};width:${mm(lebarPita)};top:${mm(garis)};height:${mm(pita)};background:${aksen};display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:${mm(g / 2 + 3)} ${mm(tepi - kiriPita + 6)} 3mm">
  <p class="t-label" style="color:${w.kertas}">${esc(k.penerbit)}</p>
  <p class="t-sekolah" style="color:${w.kertas};margin-top:2.2mm;${o.sekolahKapital ? "text-transform:uppercase;letter-spacing:0.04em;" : ""}">${esc(d.sekolah)}</p>
</div>
<svg class="abs s2-garis" style="left:${mm(kiriPita)};top:${mm(garis - g / 2)};width:${mm(lebarPita)};height:${mm(g)}" viewBox="0 0 ${lebarPita} ${g}" preserveAspectRatio="none"><rect width="${lebarPita}" height="${g}" fill="${w.emas}"/></svg>`;

  // THE VERIFICATION: one centred group, the text column and the QR; the QR's quiet zone is clear paper
  const n = d.matriks.length;
  const q = TENANG * (QR_MM / n);
  const lebarGrup = KOLOM_TEKS + CELAH_QR + QR_MM;
  const kiriGrup = (A4.w - lebarGrup) / 2;
  const verif = `<div class="abs s2-periksa" style="left:${mm(kiriGrup)};width:${mm(KOLOM_TEKS)};top:${mm(verifikasi)}">
  <p class="t-periksa" style="color:${w.tinta}">${esc(k.periksa)}</p>
  <p class="t-arti" style="color:${w.tinta2};margin-top:2mm">${esc(k.arti)}</p>
  <p class="t-tautan" style="color:${w.tinta};margin-top:2.6mm">${esc(tautan)}</p>
</div>
<div class="abs s2-kode" style="left:${mm(kiriGrup + KOLOM_TEKS + CELAH_QR - q)};top:${mm(verifikasi - q)}">${svgQr(d.matriks, QR_MM, "", w.hijau)}</div>`;

  // The header row: the title stays exactly where it was (it has the deeper baseline, so the row's
  // top is its top); the wordmark sits on the same baseline at the right margin.
  const kepala = `<div class="abs s2-kepala" style="left:${mm(tepi)};right:${mm(tepi)};top:${mm(atas)};display:flex;justify-content:space-between;align-items:baseline">
<p class="t-kepala merek-jenis" style="color:${aksen}">${esc(k.jenis)}</p>
<p class="t-merek merek" style="color:${w.hijau}">PINTAR</p></div>`;

  const tepiGaris = o.bingkai ? `<div class="abs" style="inset:0;border:0.25mm solid rgba(31,42,51,0.18);pointer-events:none"></div>` : "";
  return `<div class="s2" style="width:${mm(A4.w)};height:${mm(A4.h)};background:${latar};">${kepala}${pencapaian}${rekam}${penerbit}${verif}${tepiGaris}</div>`;
}
