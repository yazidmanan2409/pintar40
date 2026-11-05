/**
 * THE WORDMARK SLOT ON THE PRINTED CERTIFICATE: the one place the sheet shows PINTAR's mark (D-120 Q16, D-160(a)).
 *
 * Q16 put the canonical PINTAR wordmark in the header's upper right, on «SERTIFIKAT PENGUASAAN»'s baseline, at the
 * old line's cap height (3.15 mm), never under 15 mm wide (Daisy, sertifikat/ronde-2 «The wordmark correction»).
 *
 * TEXT ONLY (owner directive, 5 Nov 2026, D-192): the supplied artwork is no longer used. The slot holds the word
 * «PINTAR» in the device's sans-serif (Arial, Helvetica, sans-serif; no font file), bold, teal #075056, with the
 * wordmark's tracking, at the slot's cap height: Arial's capitals are 0.716 of its size, so 3.15 mm of cap height is
 * a 4.4 mm size, and the six letters with their tracking are about 19.5 mm wide (over the 15 mm floor). As live
 * text it sits on the title's baseline by itself (`.pin-s-kepala` aligns by baseline).
 *
 * Its accessible name is its text, «PINTAR». Not a link.
 */

import { NAMA_MEREK } from "@/components/MerekPintar";

/** The wordmark's cap height on the sheet (12 pt × 0.745), Daisy's measure. */
export const TINGGI_HURUF_MM = 3.15;
/** Arial's cap height as a share of its size (the stack's first face). */
export const RASIO_HURUF_KAPITAL = 0.716;
/** The size that gives the cap height above, in millimetres: read by `.pin-s-merek` as `--merek-ukuran`. */
export const UKURAN_MEREK_MM = +(TINGGI_HURUF_MM / RASIO_HURUF_KAPITAL).toFixed(2);

export default function MerekSertifikat() {
  return (
    <span className="pin-s-merek" style={{ "--merek-ukuran": `${UKURAN_MEREK_MM}mm` } as React.CSSProperties}>
      {NAMA_MEREK}
    </span>
  );
}
