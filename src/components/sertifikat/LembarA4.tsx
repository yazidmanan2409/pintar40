"use client";

import { useEffect, useRef } from "react";

/**
 * The A4 sheet, scaled whole.
 *
 * 794 × 1123 px is 210 × 297 mm at 96 dpi: the paper, not a design scale. The
 * composition NEVER REFLOWS — institution at the top, name and achievement at
 * the optical centre, facts and verification in the lower third — because what
 * a reader sees on a phone has to be what comes out of the printer. So the
 * sheet keeps its size at every screen width and only its `transform: scale`
 * changes, and on `@media print` the transform is dropped entirely.
 *
 * The scale is the one value that cannot be a token: it is measured from the
 * container at runtime (token lint exemption, with this sentence as the reason).
 */
export default function LembarA4({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const sheet = el.firstElementChild as HTMLElement | null;
    if (!sheet) return;
    const fit = () => {
      const scale = Math.min(1, el.clientWidth / 794);
      sheet.style.transform = `scale(${scale})`;
      el.style.height = `${Math.round(1123 * scale)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="pin-printwell">
      <div className="pin-sheetbox" ref={box}>{children}</div>
    </div>
  );
}
