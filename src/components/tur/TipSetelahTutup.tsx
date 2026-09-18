"use client";

import { useEffect, useState } from "react";
import { t, type HleEvent, type Locale, type Persona } from "@/lib/hle";

/**
 * THE ONE TIP THE TOUR OWNS — shown once, after the tour closes, anchored to
 * the Bantuan control (§G-6a).
 *
 * WHAT IT IS FOR. A person who skips a tour has just made something disappear,
 * and the honest next sentence is where it went. That is all it says. Which of
 * the three sentences it says is decided before this component is reached, by
 * `akanMunculLagi` in the model, because a tip promising a return the product
 * will not make is worse than no tip at all.
 *
 * IT IS NOT GUIDANCE MODE (§O-5). No repainted canvas, no veil, no spotlight —
 * a small white card on the page exactly as it was. A tip is an offer, not a
 * mode, and repainting the page for one sentence would teach the green ground
 * to mean nothing in particular.
 *
 * IT IS NOT MODAL AND IT DOES NOT EXPIRE (§G, §K-11). No focus is taken, the
 * page stays live, any other interaction dismisses it, and there is no timeout
 * anywhere — a reader who needs longer than a designer guessed gets longer.
 */
export default function TipSetelahTutup({
  pesan,
  locale,
  persona,
  onTutup,
}: {
  pesan: HleEvent;
  locale: Locale;
  persona: Persona;
  onTutup: () => void;
}) {
  // `ada` is whether there is a control to anchor to at all; `kotak` is where,
  // and is deliberately absent on a phone where the stylesheet places it.
  const [ada, setAda] = useState(false);
  const [kotak, setKotak] = useState<{ top: number; right: number } | null>(null);

  // Anchored under the control it is about. If that control is not on this
  // page the tip is not drawn at all — a sentence pointing at nothing is worse
  // than silence, and the tour's own step already said where Help lives.
  useEffect(() => {
    function ukur() {
      const el = document.querySelector('[data-tur="bantuan"]');
      setAda(Boolean(el));
      // On a phone the tip spans the width by stylesheet, so it is deliberately
      // given no coordinates: an inline position would win over the media query.
      if (!el || window.matchMedia("(max-width: 560px)").matches) {
        setKotak(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setKotak({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    }
    ukur();
    window.addEventListener("resize", ukur);
    window.addEventListener("scroll", ukur, true);
    return () => {
      window.removeEventListener("resize", ukur);
      window.removeEventListener("scroll", ukur, true);
    };
  }, []);

  // "dismissed by the button or by any other interaction". Registered on the
  // next frame so the click that closed the tour does not close the tip in the
  // same gesture.
  useEffect(() => {
    let siap = false;
    const id = window.setTimeout(() => (siap = true), 0);
    function lain(e: Event) {
      if (!siap) return;
      const target = e.target as Element | null;
      if (target && target.closest(".pin-tip")) return;
      onTutup();
    }
    window.addEventListener("pointerdown", lain, true);
    window.addEventListener("keydown", lain, true);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointerdown", lain, true);
      window.removeEventListener("keydown", lain, true);
    };
  }, [onTutup]);

  // A sentence pointing at nothing is worse than silence: with no Bantuan
  // control on this page the tip is simply not drawn, and the tour's own last
  // step has already said where Help lives.
  if (!ada) return null;

  return (
    <div className="pin-tip" role="status" style={kotak ?? undefined}>
      <p className="pin-tip-isi">{t(pesan, persona, { locale })}</p>
      <button type="button" className="pin-btn pin-tip-ok" onClick={onTutup}>
        {t("tur.tip.mengerti", persona, { locale })}
      </button>
    </div>
  );
}
