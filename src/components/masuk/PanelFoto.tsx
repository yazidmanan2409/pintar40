import { t, type Locale } from "@/lib/hle";

/**
 * THE RIGHT-HAND PANEL — and the photograph that is not in it yet.
 *
 * ASSET REQUIRED (handoff §5.1). No licensed, provenanced image has been
 * selected. The design names a real Indonesian classroom, faces in the upper
 * two-thirds, `object-position:60% 40%`, cleared for use with model releases
 * where people are identifiable. None of that exists, and none of it is mine
 * to choose: a stock photograph, a generated one or one found anywhere would
 * be a licence PINTAR does not hold on a screen every child sees.
 *
 * So this builds the composition with a FLAT PLACEHOLDER — `--ink-1`, the
 * label where the render's credit pill sits, obviously temporary and
 * impossible to mistake for a finished screen. It does not block development.
 * It blocks release.
 *
 * WHAT IS REAL HERE. The sentence. It is the only thing on the sign-in screen
 * that describes the product, and what it describes is a limit: PINTAR helps
 * make sense of what is happening in learning, and the decision stays with
 * people. On a phone the photograph goes and the sentence stays, because the
 * picture was the decoration and the sentence was the content.
 *
 * TWO GRADIENTS, BOTH NECESSARY (§5.3, §6.4). One is anchored to the image and
 * sets the mood; the second is anchored to the TEXT BLOCK, so the darkening
 * follows the type wherever it lands. With only the first, the tablet heading
 * measured 1.56:1 over a bright classroom wall — a clear AA failure at one
 * breakpoint with one image. Simplifying this back to one gradient
 * reintroduces it.
 */
export default function PanelFoto({ locale }: { locale: Locale }) {
  const s = (k: Parameters<typeof t>[0]) => t(k, "public", { locale });
  return (
    <div className="pin-vis" aria-hidden="true">
      <div className="pin-vis-foto">
        <span className="pin-vis-tanda">{s("auth.placeholder")}</span>
      </div>
      <div className="pin-vis-scrim" />
      <div className="pin-say">
        <h2 className="pin-say-h">{s("auth.say_h")}</h2>
        <p className="pin-say-p">{s("auth.say_p")}</p>
      </div>
    </div>
  );
}

/** The same sentence, as text, for the width where the photograph is removed. */
export function KalimatPonsel({ locale }: { locale: Locale }) {
  const s = (k: Parameters<typeof t>[0]) => t(k, "public", { locale });
  return (
    <div className="pin-phonesay">
      <h2>{s("auth.say_h")}</h2>
      <p>{s("auth.say_p")}</p>
    </div>
  );
}
