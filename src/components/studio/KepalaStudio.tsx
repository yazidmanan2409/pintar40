"use client";

import { usePathname } from "next/navigation";

/**
 * A5 B10 (D-173(a)): STUDIO'S OWN HEAD BELONGS TO STUDIO'S INDEX PAGES, NOT TO A PACKAGE'S PAGE.
 *
 * Studio's head («Studio» as the h1, and its tabs) is drawn on Studio's own pages. A package's page has its own head,
 * as J1Terbit draws it: the back link «Studio», then the package's title as the page's one h1 (Hierarchy: one
 * `t-page` per page). So the layout's head steps aside under /studio/paket/, and under /studio/tinjau/kunci/, whose page
 * has its own h1 and whose refusal (Z-2, Z-3) must be the first heading in Studio's <main>.
 */
export default function KepalaStudio({ children }: { children: React.ReactNode }) {
  const rute = usePathname() ?? "";
  // Z-2 (Daisy's condition (a), 19 Nov): a key correction's page draws its own h1 too, and its refusal must be the first
  // heading in Studio's <main>; so the head steps aside there as well
  return rute.startsWith("/studio/paket/") ? null : rute.startsWith("/studio/tinjau/kunci/") ? null : <>{children}</>;
}
