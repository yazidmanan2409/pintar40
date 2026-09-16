/**
 * The official PINTAR SELALU mark.
 *
 * THE SUPPLIED ARTWORK, RENDERED AND NOTHING ELSE. `public/brand/pintar-selalu-logo.png`
 * is the file Yazid supplied, byte for byte: not redrawn, not recoloured, not
 * cropped, not set as HTML text, and not reconstructed in any way. This
 * component's whole job is to put it on the page at a size somebody chose by
 * looking at it.
 *
 * WHAT THE ARTWORK IS, because it shapes the treatment: 766 x 429, fully
 * opaque, two full-bleed bands — pale #E7EEF0 above with dark letterforms, dark
 * #224F55 below with reversed ones, split almost exactly at the halfway line.
 * It is a block with its own ground rather than a transparent wordmark, so it
 * will read as a rectangle on any surface it sits on. That is the logo. The
 * design answer is clear space around it, not a background trick behind it.
 *
 * (The dark band is within a hair of the approved primary, #245F55, which is
 * why the mark sits in this palette without argument.)
 *
 * HEIGHT IS SET IN CSS AND WIDTH IS NEVER SET. The intrinsic ratio supplies the
 * width, so no edit can squash the letterforms. The `width`/`height` attributes
 * below are the artwork's OWN pixel dimensions, present so the browser reserves
 * the correct box before the image loads — a layout shift in a header is the
 * one place a reader always notices.
 *
 * NOT A LINK, on either shell. The learner already has tabs; the public
 * verification page deliberately offers no way into PINTAR, because somebody
 * who came to check a certificate should not be invited to go wandering.
 */

/** The artwork's own dimensions. Not a design scale — the file's. */
const INTRINSIC_WIDTH = 766;
const INTRINSIC_HEIGHT = 429;

/** The brand name, as it appears in the artwork. A proper noun; never translated. */
const NAMA = "PINTAR SELALU";

export default function MerekPintar({ standalone = false }: { standalone?: boolean }) {
  return (
    /* A plain <img>, deliberately, and the same choice BarisLingkup made.
       next/image exists to size, lazy-load and re-encode photographs of unknown
       provenance; this is a 29KB mark of fixed dimensions that must render
       immediately in a header and must not be re-encoded, since re-encoding is
       a way of altering artwork we were told not to alter. */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/pintar-selalu-logo.png"
      alt={NAMA}
      width={INTRINSIC_WIDTH}
      height={INTRINSIC_HEIGHT}
      className={`pin-merek${standalone ? " pin-merek-standalone" : ""}`}
    />
  );
}
