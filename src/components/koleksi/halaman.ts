/** L4 (CR-88): the paging rule, with no React in it, so a test can execute it (see Penomoran.tsx). */
export const UKURAN = 20;

/** The page asked for (1-based), whatever the parameter held. */
export function halamanDiminta(v: string | string[] | undefined): number {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** One page of rows already read, and whether another follows. */
export function satuHalaman<T>(baris: readonly T[], halaman: number, ukuran = UKURAN): { isi: T[]; lagi: boolean } {
  const dari = (halaman - 1) * ukuran;
  return { isi: baris.slice(dari, dari + ukuran), lagi: baris.length > dari + ukuran };
}

/** The range to ask the database for: one row more than a page, so the next page's existence is known. */
export function rentang(halaman: number, ukuran = UKURAN): [number, number] {
  return [(halaman - 1) * ukuran, halaman * ukuran];
}

/**
 * The words a page link carries over: the section, the school, and every list's page. Anything else in the URL is
 * an action's one-time result or a pending step (a confirmation, a check, a report), never repeated by paging.
 */
const TETAP = new Set(["bagian", "sekolah"]);
const tetap = (k: string) => TETAP.has(k) || k === "hal" || k.startsWith("hal_");

/**
 * The link to page `n` of one list: the section, the school and the other lists' pages are kept, so two lists on one
 * page move independently; nothing else is.
 */
export function tautanHalaman(jalan: string, sp: Record<string, string | string[] | undefined>, kunci: string, n: number, jangkar = ""): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === kunci || !tetap(k) || v === undefined) continue;
    for (const x of Array.isArray(v) ? v : [v]) q.append(k, x);
  }
  q.set(kunci, String(n));
  return `${jalan}?${q.toString()}${jangkar ? `#${jangkar}` : ""}`;
}
