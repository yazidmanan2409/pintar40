"use client";

import { useEffect } from "react";
import { bagianDariJangkar, alamatBagian } from "@/lib/bagian-konfigurasi";

/**
 * E-B1-1 (B1, D-166(a)): an older address to a Konfigurasi section by its fragment (`/konfigurasi#roles`,
 * `/konfigurasi?muat=…#laporan-<id>`) reaches that section's page. A fragment never reaches the server, so the index
 * forwards it here, keeping the query and the fragment; any other fragment stays on the index. Draws nothing.
 */
export default function TerusBagian() {
  useEffect(() => {
    const b = bagianDariJangkar(window.location.hash);
    if (b) window.location.replace(alamatBagian(b, window.location.search.replace(/^\?/, ""), window.location.hash.slice(1)));
  }, []);
  return null;
}
