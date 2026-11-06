/**
 * The PINTAR wordmark: TEXT ONLY (owner directive, 5 Nov 2026, D-192), in Inter (owner directive, 7 Nov 2026, D-193).
 *
 * The supplied PINTAR SELALU artwork is no longer used anywhere in the application. The wordmark is the word «PINTAR»,
 * set in Inter Bold (`--font-wordmark`: Inter, Arial, Helvetica, sans-serif; Inter 700 is self-hosted under the OFL in
 * public/fonts/, Arial only while it loads), bold,
 * in the brand teal #075056 (`--merek-warna`), with the wordmark's tracking. Nothing here is an image, so nothing can
 * be squashed, re-encoded or licensed.
 *
 * SIZE IS SET IN CSS, as before: each surface sets `--merek-tinggi` (the box the artwork used to fill) and the letters
 * are sized from it (`.pin-merek`), so every caller and every slot keeps the place it had.
 *
 * THE DEFAULT, AND ONE DAY NOT THE ONLY ONE. Per the institution-mark ruling of 2026-09-17, an institution with an
 * approved mark of its own would display it in this position instead. This component is still the one place that
 * substitution happens, and the one module that draws the mark (UX1-BRAND-02).
 *
 * NOT A LINK, on either shell. The learner already has tabs; the public verification page deliberately offers no way
 * into PINTAR, because somebody who came to check a certificate should not be invited to go wandering.
 */

/** The wordmark's word. A proper noun; never translated. */
export const NAMA_MEREK = "PINTAR";

export default function MerekPintar({ standalone = false }: { standalone?: boolean }) {
  return <span className={`pin-merek${standalone ? " pin-merek-standalone" : ""}`}>{NAMA_MEREK}</span>;
}
