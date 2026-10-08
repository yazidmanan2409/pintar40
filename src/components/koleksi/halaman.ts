/** L4 (CR-88): the paging rule, with no React in it, so a test can execute it (see Penomoran.tsx). */
export const UKURAN = 20;

/** The page asked for (1-based), whatever the parameter held. */
export function halamanDiminta(v: string | string[] | undefined): number {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** One page of rows already read, and whether another follows. */
export function satuHalaman<T>(baris: readonly T[], halaman: number): { isi: T[]; lagi: boolean } {
  const dari = (halaman - 1) * UKURAN;
  return { isi: baris.slice(dari, dari + UKURAN), lagi: baris.length > dari + UKURAN };
}

/** The range to ask the database for: one row more than a page, so the next page's existence is known. */
export function rentang(halaman: number): [number, number] {
  return [(halaman - 1) * UKURAN, halaman * UKURAN];
}
