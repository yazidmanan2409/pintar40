/**
 * THE A4 CERTIFICATE SHEET'S GRAMMAR, as Daisy froze it (sertifikat/ronde-2, D-076, D-120 Q16; built under D-160).
 *
 * Pure values and two pure functions, with no import, so the component, the stylesheet's guard and the tests all
 * read the same numbers. The millimetres are written again in `.pin-sheet` (src/app/experience.css), because CSS
 * cannot import a module; B6C-SHEET-01 holds the two to each other.
 *
 *   HEADER        top at 22 mm: «SERTIFIKAT PENGUASAAN» upper-left in the accent; the wordmark slot upper-right, on
 *                 the title's baseline, at the wordmark's cap height (3.15 mm), never under 15 mm wide
 *   ACHIEVEMENT   name 33 pt, «telah menuntaskan» 12 pt, the course 16.5 pt, centred between 36 mm and the record
 *   RECORD        Predikat, Tanggal terbit, Nomor sertifikat: labels right-aligned to the page's axis, ending 16 mm
 *                 above the line; the number in IBM Plex Mono 12 pt, never broken (Yazid's ruling 2)
 *   THE LINE      warm gold, centred at 176 mm, 0.75 mm
 *   ISSUER        the band, 176-210 mm, inset 10 mm each side: «Diterbitkan oleh» 9 pt over the school 16.5 pt
 *   VERIFICATION  top at 236 mm, 130 mm wide, centred: a 92 mm text column, a 12 mm gap, a 26 mm QR with its 4-module
 *                 quiet zone clear
 */
export const LEMBAR = {
  lebar: 210,
  tinggi: 297,
  tepi: 20,
  atas: 22,
  sisiPita: 10,
  garis: 176,
  garisTebal: 0.75,
  pitaTinggi: 34,
  rekamBawah: 16,
  verifikasi: 236,
  kolomTeks: 92,
  celahQr: 12,
  qr: 26,
  tenang: 4,
} as const;

/** The verification group's width and left edge: centred on the sheet. */
export const GRUP_VERIFIKASI = LEMBAR.kolomTeks + LEMBAR.celahQr + LEMBAR.qr; // 130
export const KIRI_VERIFIKASI = (LEMBAR.lebar - GRUP_VERIFIKASI) / 2; // 40

/**
 * THE NUMBER NEVER BREAKS (ruling 2). When space is tight the record's axis moves first (the value column is `1fr`
 * with the number as its minimum); past what the record holds beside «NOMOR SERTIFIKAT» (120 mm) the type steps
 * down the ladder, 12 → 10.5 → 9.75 pt. Plex Mono is monospaced, so the width is exact: characters × (0.6 em
 * advance + 0.02 em tracking).
 */
export const NOMOR_MUAT_MM = LEMBAR.lebar - 2 * LEMBAR.tepi - 8 - 42;
export const TANGGA_NOMOR = [12, 10.5, 9.75] as const;
export type UkuranNomor = (typeof TANGGA_NOMOR)[number];
export const lebarNomorMm = (nomor: string, pt: number) => nomor.length * (0.6 + 0.02) * pt * (25.4 / 72);
export function ukuranNomor(nomor: string): UkuranNomor {
  for (const pt of TANGGA_NOMOR) if (lebarNomorMm(nomor, pt) <= NOMOR_MUAT_MM) return pt;
  return 9.75;
}

/**
 * The printed link: the verification URL the page builds, without `https://` (Daisy §2: «the sheet prints the link
 * without the protocol»). The QR holds the URL whole; the token and the host are never changed.
 */
export const tautanCetak = (url: string) => url.replace(/^https:\/\//, "");

/** The accent, by learning context and never by role (Daisy §5): plum for academic, sage for professional learning. */
export type KonteksSertifikat = "akademik" | "profesi";
