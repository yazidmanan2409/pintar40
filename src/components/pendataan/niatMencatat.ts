/**
 * POLISH3 (UX-08): THE PRESS THAT APPROVES IS THE PRESS THAT RECORDS.
 *
 * An administrator approved with «Ya, catat orang-orang ini» (or, after the
 * first fifty, «Sudah saya periksa, lanjutkan sisanya») and then had to find a
 * second button, «Mulai mencatat» / «Lanjutkan», before anyone was recorded.
 * Both first buttons already say that recording follows.
 *
 * The approval is WP5A's (konfirmasiAksi, periksaPercontohanAksi), and the
 * action redirects back to the job with nothing to say it has just been
 * pressed. So the press leaves a note here, in the browser's memory, and the
 * driver (Penggerak) that the redirect draws takes it once and starts.
 *
 * WHY MEMORY, AND NOTHING THAT OUTLIVES THE TAB. §10: recording is never started
 * because a page opened or stayed open. A note that only this press can write,
 * that the next Penggerak for that job takes and removes, and that a reload,
 * another tab, another person or a later visit never sees, keeps that rule.
 * A note older than two minutes is ignored: the approval it came from did not
 * lead straight here.
 *
 * The note is written by IsianSetuju, the job field inside each approving
 * form. Without script the plain form still posts, and the driver's own button is
 * there as before. So the old two presses are the fallback, never a dead end.
 */
const catatan = new Map<string, number>();

/** Two minutes: longer than any approval takes to come back. */
export const NIAT_BERLAKU_MS = 2 * 60 * 1000;

/** The approving press: this job may start recording when it comes back. */
export function catatNiat(pekerjaan: string, kini: number = Date.now()): void {
  catatan.set(pekerjaan, kini);
}

/** Is there a fresh note for this job? Reading does not take it. */
export function adaNiat(pekerjaan: string, kini: number = Date.now()): boolean {
  const saat = catatan.get(pekerjaan);
  return saat !== undefined && kini - saat >= 0 && kini - saat < NIAT_BERLAKU_MS;
}

/** Take the note, once: true only for the first reader of a fresh note. */
export function ambilNiat(pekerjaan: string, kini: number = Date.now()): boolean {
  const ada = adaNiat(pekerjaan, kini);
  catatan.delete(pekerjaan);
  return ada;
}
