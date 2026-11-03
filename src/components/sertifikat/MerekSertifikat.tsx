/**
 * THE WORDMARK SLOT ON THE PRINTED CERTIFICATE: the one place the sheet shows PINTAR's mark (D-120 Q16, D-160(a)).
 *
 * Q16 put the canonical PINTAR wordmark in the header's upper right, on «SERTIFIKAT PENGUASAAN»'s baseline, at the
 * old line's cap height (3.15 mm), never under 15 mm wide (Daisy, sertifikat/ronde-2 «The wordmark correction»). Its
 * licensed outlined master does not exist yet (F-11), so D-160(a) places TODAY's approved logo, the supplied
 * `public/brand/pintar-selalu-logo.png` (the artwork MerekPintar renders), in that exact slot and size. It is
 * artwork, never live text.
 *
 * THE SLOT IS THE WORDMARK'S LETTERS. The supplied file is a block with its own ground (766 × 429): «PINTAR» in
 * dark letters on a pale band over «SELALU» reversed on a dark band. Its «PINTAR» letters occupy the slot, measured
 * from the file: the letters' box is x 65-690, y 59-170 (a 112 px cap height, baseline at 171). Set at a 3.15 mm cap
 * height, those letters are 17.6 mm wide (the stand-in face's 17.75; over the 15 mm floor) and sit on the title's
 * baseline at the right margin. The rest of the block (its pale ground above and either side, the «SELALU» band
 * below) lies outside the slot, as the artwork's own ground.
 *
 * ONE FILE TO SWAP. When the licensed master arrives, this file changes and nothing else: its `src`, and `HURUF`
 * becomes the master's own box (an outlined wordmark is trimmed to its letters, so the offsets go to zero).
 * Until then the file is MerekPintar's (`BERKAS_MEREK`), so the asset keeps one module that names it.
 * `.pin-s-merek` in experience.css reads only the custom properties set here.
 *
 * Its accessible name is «PINTAR» (the Wordmark card). Not a link.
 */

import { BERKAS_MEREK } from "@/components/MerekPintar";

/** The artwork (MerekPintar's, 766 × 429), and where its «PINTAR» letters are in it. Not a design scale: the file's. */
const BERKAS = BERKAS_MEREK;
const HURUF = { kiri: 65, atas: 59, lebar: 626, tinggi: 112 } as const;
/** The wordmark's cap height on the sheet (12 pt × 0.745), Daisy's measure. */
export const TINGGI_HURUF_MM = 3.15;

const mm = (px: number) => `${+((px * TINGGI_HURUF_MM) / HURUF.tinggi).toFixed(3)}mm`;

/** The slot's geometry in millimetres, derived from the two boxes above: read by `.pin-s-merek`. */
export const SLOT_MEREK = {
  "--merek-slot-lebar": mm(HURUF.lebar),
  "--merek-slot-tinggi": mm(HURUF.tinggi),
  "--merek-lebar": mm(BERKAS.lebar),
  "--merek-kiri": mm(-HURUF.kiri),
  "--merek-atas": mm(-HURUF.atas),
} as const;

export default function MerekSertifikat() {
  return (
    <span className="pin-s-merek" style={SLOT_MEREK as React.CSSProperties}>
      {/* A plain <img>, as MerekPintar: the supplied artwork is never re-encoded. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BERKAS.src} alt="PINTAR" width={BERKAS.lebar} height={BERKAS.tinggi} />
    </span>
  );
}
