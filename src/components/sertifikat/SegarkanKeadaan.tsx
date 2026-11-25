"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * CI-1b (Daisy's requirement 3; Bob, 25 Nov): THE PRINT IS DECIDED BY THE STATE AT PRINT TIME, as far as a page can
 * know it. Whenever the reader comes back to the tab (focus, or the tab shown again), the page re-reads the
 * certificate from the server: a certificate revoked or replaced meanwhile re-renders as such, loses «Cetak» and its
 * sheet, and prints the notice. «Cetak» itself re-reads before it prints (AksiCetak).
 *
 * THE RESIDUAL, NAMED: a page left open and never refocused, then printed with the browser's own Print, prints the
 * state it last read. Every print carries the QR and the link to the live check, which says the truth (Sharon decides
 * whether that is accepted; a server-rendered print view is the option that would close it).
 */
export default function SegarkanKeadaan() {
  const router = useRouter();
  useEffect(() => {
    let terakhir = Date.now();
    const segarkan = () => {
      if (document.visibilityState !== "visible" || Date.now() - terakhir < 2000) return;
      terakhir = Date.now();
      router.refresh();
    };
    window.addEventListener("focus", segarkan);
    document.addEventListener("visibilitychange", segarkan);
    return () => {
      window.removeEventListener("focus", segarkan);
      document.removeEventListener("visibilitychange", segarkan);
    };
  }, [router]);
  return null;
}
