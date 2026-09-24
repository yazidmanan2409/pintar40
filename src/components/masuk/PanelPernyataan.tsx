import { t, type Locale } from "@/lib/hle";

/**
 * THE RIGHT-HAND PANEL: PINTAR'S OWN STATEMENT (DAISY-08, D-018).
 *
 * The panel was built for a photograph of a real Indonesian classroom that
 * PINTAR holds no licence for yet, and until one exists it showed a dark box
 * labelled "FOTO CONTOH" -- the first thing every visitor saw. D-018 replaces
 * it with a text panel: the one sentence on the sign-in screen that says what
 * PINTAR is, on the brand's own ground. A licensed photograph can replace the
 * ground later without a decision; the statement stays.
 *
 * NO GRADIENTS. The two darkenings existed to keep white type legible over a
 * bright classroom wall. On a flat brand ground there is no wall: white on
 * --pintar-primary measures about 7.4:1, and DAISY-08-PANEL-01 computes it
 * from the tokens so a later change of colour cannot quietly drop below AA.
 *
 * REAL CONTENT, READ ONCE. The panel used to be aria-hidden, as decoration,
 * while its phone twin below the form is hidden from the tablet width up, so a
 * screen reader on a tablet or desktop heard no statement at all. Now the panel
 * is read where it is shown, and at every width exactly one of the two is
 * displayed (the other is display:none, which removes it from the reading
 * order too).
 */
export default function PanelPernyataan({ locale }: { locale: Locale }) {
  const s = (k: Parameters<typeof t>[0]) => t(k, "public", { locale });
  return (
    <section className="pin-vis" aria-labelledby="pin-say-h">
      <div className="pin-say">
        <span className="pin-say-tanda" aria-hidden="true" />
        <h2 id="pin-say-h" className="pin-say-h">{s("auth.say_h")}</h2>
        <p className="pin-say-p">{s("auth.say_p")}</p>
      </div>
    </section>
  );
}

/** The same statement, below the form, at the width where the panel is not shown. */
export function KalimatPonsel({ locale }: { locale: Locale }) {
  const s = (k: Parameters<typeof t>[0]) => t(k, "public", { locale });
  return (
    <div className="pin-phonesay">
      <h2>{s("auth.say_h")}</h2>
      <p>{s("auth.say_p")}</p>
    </div>
  );
}
