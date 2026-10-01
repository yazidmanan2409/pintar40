/**
 * W2 (T1, D-085) — WHAT A DEVICE REMEMBERS BELONGS TO THE PERSON, NEVER TO THE DEVICE.
 *
 * The lesson player keeps the page a learner reached, and the media player the
 * second a recording reached, in this browser's storage. Both were keyed by the
 * lesson or the file alone, and «Keluar» never cleared them, so on a shared
 * classroom computer the next student opened the lesson at the previous
 * student's page and saved it as their own progress (journey cross-check W2).
 *
 * Every key now carries the signed-in person. With no person there is nothing to
 * read and nothing is written. The old person-less keys are removed unread: there
 * is no way to know whose they were. The server's record (BOB-22) stays the
 * position that counts; this is only "never resume behind where I was".
 */
export type Penyimpanan = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const kunciPelajaran = (orang: string, pelajaran: string) => `pintar.lesson.${orang}.${pelajaran}`;
export const kunciMedia = (orang: string, path: string) => `pintar.media.${orang}.${path}`;
const warisanPelajaran = (pelajaran: string) => `pintar.lesson.${pelajaran}`;
const warisanMedia = (path: string) => `pintar.media.${path}`;

/** This browser's storage, or null where there is none (the server, a locked-down browser). */
export function penyimpananPerangkat(): Penyimpanan | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function angka(s: Penyimpanan, k: string): number {
  try {
    const v = Number(s.getItem(k) ?? 0);
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

function buang(s: Penyimpanan, k: string) {
  try { s.removeItem(k); } catch { /* nothing stored */ }
}

/** The page this person last reached in this lesson on this device (0 when none). */
export function bacaHalaman(s: Penyimpanan | null, orang: string | null, pelajaran: string): number {
  if (!s) return 0;
  buang(s, warisanPelajaran(pelajaran));
  return orang ? angka(s, kunciPelajaran(orang, pelajaran)) : 0;
}

/** Remember the furthest page this person reached; never moves back. */
export function simpanHalaman(s: Penyimpanan | null, orang: string | null, pelajaran: string, halaman: number): void {
  if (!s || !orang) return;
  const k = kunciPelajaran(orang, pelajaran);
  try { s.setItem(k, String(Math.max(halaman, angka(s, k)))); } catch { /* unavailable */ }
}

/** The second this person last reached in this recording on this device (0 when none). */
export function bacaDetik(s: Penyimpanan | null, orang: string | null, path: string): number {
  if (!s) return 0;
  buang(s, warisanMedia(path));
  return orang ? angka(s, kunciMedia(orang, path)) : 0;
}

export function simpanDetik(s: Penyimpanan | null, orang: string | null, path: string, detik: number): void {
  if (!s || !orang) return;
  try { s.setItem(kunciMedia(orang, path), String(Math.floor(detik))); } catch { /* unavailable */ }
}
