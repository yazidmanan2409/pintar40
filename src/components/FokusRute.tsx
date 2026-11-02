"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * W3.1 (Batch 2; WCAG 2.4.1, 2.4.3): AFTER A NAVIGATION INSIDE PINTAR, THE NEXT TAB STARTS AT THE TOP AGAIN.
 *
 * A link followed inside the application does not reload the document, so the browser keeps its Tab starting point
 * on the link that was pressed, and the first Tab on the new page jumps past «Langsung ke isi» (found by the crawl:
 * /aktivasi reached from the navigation). On every change of page this puts the starting point back where a fresh page
 * load puts it, just before the skip link, by focusing this empty, unfocusable-by-Tab marker.
 *
 * It never takes focus a page has placed for itself: a heading that announces a new step (pin-mh1), the tour's card,
 * a dialog, or anything inside the page's content (#isi) keeps it.
 */
export default function FokusRute() {
  const rute = usePathname();
  const pertama = useRef(true);
  const awal = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (pertama.current) { pertama.current = false; return; }
    const e = document.activeElement;
    const milikHalaman = e && e !== document.body
      && (e.closest("#isi") || e.closest("dialog, [role='dialog'], .pin-tur-kartu, .pin-bantuan"));
    if (!milikHalaman) awal.current?.focus({ preventScroll: true });
  }, [rute]);
  return <span ref={awal} id="awal" tabIndex={-1} className="pin-awal" />;
}
