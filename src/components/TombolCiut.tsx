"use client";

import { useEffect, useRef, useState } from "react";
import Ikon from "./Ikon";

/** The reader's own choice, kept per device as a convenience (E1 §7); nothing depends on it. */
const KUNCI = "pin-nav-ciut";

/**
 * E1 (D-170(c), D-171(a)): the staff navigation's collapse control, the design system's AppShell toggle.
 *
 * The shell is the rail by default from 1024 to 1279 px and the full navigation from 1280 px, by CSS alone; the reader
 * may collapse it to the rail at 1280 and up (`data-ciut="ya"`) or expand it in the rail range (`data-ciut="tidak"`).
 *
 * THE TOGGLE NAMES THE STATE IT OFFERS, READ FROM THE RAIL'S OWN STATE (the navigation at its 72 px), never from a
 * label's CSS (owner, 4 Nov): «Lebarkan navigasi» with `aria-expanded="false"` in the rail, «Ciutkan navigasi» with
 * `aria-expanded="true"` when expanded, set on load and at every width change. Its name is its own text, visually
 * hidden beside the icon (no `aria-label`, S5). Without script the control cannot act, so it is drawn only once its
 * state is known: before that it is `hidden`, and the layout is the width's default.
 *
 * It also lets a rail tooltip be dismissed with Escape without moving the pointer or focus (WCAG 1.4.13).
 */
export default function TombolCiut({ ciutkan, lebarkan }: { ciutkan: string; lebarkan: string }) {
  const tombol = useRef<HTMLButtonElement>(null);
  const [rel, setRel] = useState<boolean | null>(null);

  useEffect(() => {
    const shell = tombol.current?.closest<HTMLElement>(".pin-staf");
    if (!shell) return;
    try {
      const simpan = window.localStorage.getItem(KUNCI);
      if (simpan === "ya" || simpan === "tidak") shell.dataset.ciut = simpan;
    } catch { /* storage refused: the width's default stands */ }
    const baca = () => setRel(shell.getBoundingClientRect().width <= 80);
    baca();
    const amati = new ResizeObserver(baca);
    amati.observe(shell);
    // Escape hides the tooltip of the item under focus or the pointer until it is left (1.4.13, dismissible)
    const tutupTip = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      shell.querySelectorAll<HTMLElement>(":focus, :hover").forEach((el) => {
        if (!el.matches("[data-tip-host]")) return;
        el.dataset.tipTutup = "";
        const buka = () => { delete el.dataset.tipTutup; el.removeEventListener("blur", buka); el.removeEventListener("mouseleave", buka); };
        el.addEventListener("blur", buka);
        el.addEventListener("mouseleave", buka);
      });
    };
    document.addEventListener("keydown", tutupTip);
    // The tooltip is position: fixed, so the navigation's own scrolling never clips it: placed beside its item
    // whenever the item is hovered or focused (the CSS shows it only in the rail, and only once it is placed)
    const letak = (e: Event) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-tip-host]");
      if (!el || !shell.contains(el)) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--tip-x", `${Math.round(r.right + 6)}px`);
      el.style.setProperty("--tip-y", `${Math.round(r.top + r.height / 2)}px`);
      el.dataset.tipXy = "";
    };
    shell.addEventListener("mouseover", letak);
    shell.addEventListener("focusin", letak);
    return () => {
      amati.disconnect(); document.removeEventListener("keydown", tutupTip);
      shell.removeEventListener("mouseover", letak); shell.removeEventListener("focusin", letak);
    };
  }, []);

  function tekan() {
    const shell = tombol.current?.closest<HTMLElement>(".pin-staf");
    if (!shell || rel === null) return;
    // Only a departure from the width's own default is kept: back at the default (the rail from 1024 to 1279 px, the
    // full navigation from 1280), the choice is cleared, so collapsing and expanding again at 1280 does not hold the
    // navigation open in the rail range.
    const relBawaan = window.matchMedia("(min-width: 1024px) and (max-width: 1279px)").matches;
    const relBaru = !rel;
    if (relBaru === relBawaan) {
      delete shell.dataset.ciut;
      try { window.localStorage.removeItem(KUNCI); } catch { /* a convenience only */ }
    } else {
      const pilihan = relBaru ? "ya" : "tidak";
      shell.dataset.ciut = pilihan;
      try { window.localStorage.setItem(KUNCI, pilihan); } catch { /* a convenience only */ }
    }
    setRel(shell.getBoundingClientRect().width <= 80);
  }

  return (
    <button ref={tombol} type="button" className="pin-ciut" hidden={rel === null} aria-expanded={rel === null ? undefined : !rel}
      onClick={tekan} data-ciut-tombol="">
      <Ikon nama={rel ? "panel-left-open" : "panel-left-close"} />
      <span className="pin-sr">{rel ? lebarkan : ciutkan}</span>
    </button>
  );
}
