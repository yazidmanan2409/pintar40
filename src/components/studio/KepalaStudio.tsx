"use client";

import { usePathname } from "next/navigation";

/**
 * A5 B10 (D-173(a)): STUDIO'S OWN HEAD BELONGS TO STUDIO'S INDEX PAGES, NOT TO A PACKAGE'S PAGE.
 *
 * Studio's head («Studio» as the h1, and its tabs) is drawn on Studio's own pages. A package's page has its own head,
 * as J1Terbit draws it: the back link «Studio», then the package's title as the page's one h1 (Hierarchy: one
 * `t-page` per page). So the layout's head steps aside under /studio/paket/.
 */
export default function KepalaStudio({ children }: { children: React.ReactNode }) {
  const rute = usePathname() ?? "";
  return rute.startsWith("/studio/paket/") ? null : <>{children}</>;
}
