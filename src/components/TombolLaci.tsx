"use client";

import { useEffect, useRef, useState } from "react";
import Ikon from "./Ikon";

/**
 * E1 §1 «Under 1024 px» (D-170(c)): the staff shell's menu button and its drawer, the design system's `pds-drawer`
 * (D-172 P4): «Buka menu» opens it as a modal (the page behind it is `inert`), focus moves to its first item, and
 * «Tutup menu» or Escape closes it and returns focus to the button.
 *
 * Before script has loaded the shell's checkbox opens the same menu (a slow classroom tablet, D-138 step 3); once this
 * button is mounted it marks the shell (`data-laci-js`) and the checkbox is no longer drawn, so there is one control.
 * At 1024 px and wider the navigation is always shown and neither control is drawn.
 */
export default function TombolLaci({ buka: kataBuka, tutup: kataTutup }: { buka: string; tutup: string }) {
  const tombol = useRef<HTMLButtonElement>(null);
  const [terbuka, setTerbuka] = useState(false);

  useEffect(() => {
    const shell = tombol.current?.closest<HTMLElement>(".pin-staf");
    if (!shell) return;
    shell.dataset.laciJs = "";
    const layar = window.matchMedia("(max-width: 1023px)");
    const lebar = () => { if (!layar.matches) setTerbuka(false); };
    layar.addEventListener("change", lebar);
    return () => layar.removeEventListener("change", lebar);
  }, []);

  useEffect(() => {
    const shell = tombol.current?.closest<HTMLElement>(".pin-staf");
    const laci = shell?.querySelector<HTMLElement>(".pin-laci");
    if (!shell || !laci) return;
    if (!terbuka) {
      delete shell.dataset.laci;
      laci.removeAttribute("role"); laci.removeAttribute("aria-modal"); laci.removeAttribute("aria-label");
      return;
    }
    shell.dataset.laci = "buka";
    laci.setAttribute("role", "dialog"); laci.setAttribute("aria-modal", "true"); laci.setAttribute("aria-label", kataBuka);
    // the page behind the drawer cannot be reached while it is open
    // every sibling along the shell's path to <body>, so a wrapper holding both the shell and the page is not missed
    const luar: HTMLElement[] = [];
    for (let el: HTMLElement | null = shell; el && el !== document.body; el = el.parentElement) {
      for (const sib of el.parentElement?.children ?? []) if (sib !== el && sib instanceof HTMLElement && !sib.inert) luar.push(sib);
    }
    luar.forEach((el) => { el.inert = true; });
    laci.querySelector<HTMLElement>("a[href], button:not([disabled])")?.focus();
    const kunci = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); setTerbuka(false); tombol.current?.focus(); } };
    document.addEventListener("keydown", kunci);
    return () => { luar.forEach((el) => { el.inert = false; }); document.removeEventListener("keydown", kunci); };
  }, [terbuka, kataBuka]);

  return (
    <button ref={tombol} type="button" className="pin-laci-js" aria-expanded={terbuka} aria-controls="pin-laci-isi"
      onClick={() => { setTerbuka((b) => !b); if (terbuka) tombol.current?.focus(); }} data-laci-tombol="">
      <Ikon nama={terbuka ? "x" : "menu"} />
      <span className="pin-sr">{terbuka ? kataTutup : kataBuka}</span>
    </button>
  );
}
