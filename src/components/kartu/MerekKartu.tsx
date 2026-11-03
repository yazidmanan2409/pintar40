import MerekPintar from "@/components/MerekPintar";

/**
 * THE WORDMARK SLOT OF THE PINTAR DIGITAL CARD (D-120 Q16; D-160(a)).
 *
 * The frozen card carries the canonical PINTAR wordmark top left: on the 6 mm text margin, its cap top at 5.57 mm,
 * cap height 2.9 mm, about 16.4 mm wide (never under 15 mm) — kartu-pintar ronde-2 §L. The licensed outlined master
 * does not exist yet (F-11), so today's approved logo (MerekPintar, the supplied artwork, untouched) is placed in that
 * exact slot and size: the slot is the box, and the artwork sits in it at the slot's height with its own ratio
 * (experience.css `.pin-kd-merek`). The wordmark is never typeset as live text.
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
