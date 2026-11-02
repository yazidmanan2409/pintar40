"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TandaTautan from "@/components/TandaTautan";

/**
 * Studio's own pages as the design's Tabs (08-migration.md, «.pin-switch → Tabs»; D-140, review RV-13): 44 px targets,
 * the current page marked by weight and its underline, `aria-current` for a screen reader. Which tabs a reader gets is
 * decided by the layout (CR-87, studio-tab.ts); this draws them and marks where the reader is, nothing more.
 * Studio's home is current only on itself; any other tab is current on its own pages too.
 *
 * W1.1 (Batch 3; Daisy, J1Terbit finding F10): on a narrow screen the tabs scroll sideways in their row, and while more
 * of them lie past the right edge that edge fades (`pin-switch-lebih`), so the reader sees that more tabs follow. The
 * class is set from the row's own scroll position, as Daisy's bundle.js sets `pds-tabs-lebih`.
 */
export default function TabStudio({ tab, label }: { tab: ReadonlyArray<readonly [string, string]>; label: string }) {
  const jalan = usePathname() ?? "";
  const baris = useRef<HTMLElement>(null);
  const kini = (href: string) => (href === "/studio" ? jalan === "/studio" : jalan === href || jalan.startsWith(`${href}/`));

  useEffect(() => {
    const el = baris.current;
    if (!el) return;
    const ukur = () => {
      const lebih = el.scrollWidth > el.clientWidth + 1 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      el.classList.toggle("pin-switch-lebih", lebih);
    };
    ukur();
    el.addEventListener("scroll", ukur, { passive: true });
    window.addEventListener("resize", ukur);
    return () => {
      el.removeEventListener("scroll", ukur);
      window.removeEventListener("resize", ukur);
    };
  }, [tab]);

  return (
    <nav ref={baris} className="pin-switch" aria-label={label}>
      {tab.map(([href, text]) => (
        <Link key={href} href={href} aria-current={kini(href) ? "page" : undefined}>{text}<TandaTautan /></Link>
      ))}
    </nav>
  );
}
