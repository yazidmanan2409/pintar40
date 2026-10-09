"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import TandaTautan from "@/components/TandaTautan";

/**
 * Studio's own pages as the design's Tabs (08-migration.md, «.pin-switch → Tabs»; D-140, review RV-13): 44 px targets,
 * the current page marked by weight and its underline, `aria-current` for a screen reader. Which tabs a reader gets is
 * decided by the layout (CR-87, studio-tab.ts); this draws them and marks where the reader is, nothing more.
 * Studio's home is current only on itself; any other tab is current on its own pages too.
 */
export default function TabStudio({ tab, label }: { tab: ReadonlyArray<readonly [string, string]>; label: string }) {
  const jalan = usePathname() ?? "";
  const kini = (href: string) => (href === "/studio" ? jalan === "/studio" : jalan === href || jalan.startsWith(`${href}/`));
  return (
    <nav className="pin-switch" aria-label={label}>
      {tab.map(([href, text]) => (
        <Link key={href} href={href} aria-current={kini(href) ? "page" : undefined}>{text}<TandaTautan /></Link>
      ))}
    </nav>
  );
}
