import MerekPintar from "@/components/MerekPintar";

/**
 * THE WORDMARK SLOT OF THE PINTAR DIGITAL CARD (D-120 Q16; D-160(a)).
 *
 * The frozen card carries the canonical PINTAR wordmark top left: on the 6 mm text margin, its cap top at 5.57 mm,
 * cap height 2.9 mm, 18.0 mm wide (never under 15 mm) — kartu-pintar ronde-2 §L, widened by Daisy's H28 (6 Nov) for
 * the Inter word (17.1 mm of ink). The licensed outlined master
 * does not exist (F-11); by the owner's directive of 5 Nov 2026 (D-192) the wordmark is TEXT: MerekPintar's «PINTAR»
 * in the device's sans-serif, teal #075056, set at the slot's cap height (experience.css `.pin-kd-merek`).
 *
 * THE ONE-FILE SWAP. When the master exists, this component's child is the one thing that changes; the slot, the
 * card and every other face stay as frozen. Self-contained on purpose: the certificate has its own wordmark slot,
 * and the two are not coupled here.
 */
export default function MerekKartu() {
  return (
    <span className="pin-kd-merek">
      <MerekPintar />
    </span>
  );
}
