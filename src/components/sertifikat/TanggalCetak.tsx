"use client";

import { useEffect, useRef } from "react";
import { format, type Locale } from "@/lib/hle";

/**
 * The print date (CI-1b; Daisy's «Dicetak {tanggal_cetak}»): the server writes the day the page was rendered, and
 * the browser re-writes it as the paper is printed («beforeprint»), so a page left open overnight prints tomorrow's
 * date. Written into the node directly: the print layout is taken synchronously after «beforeprint», before React
 * would render a state change. On the issuing school's clock, in the certificate's own form («24 November 2026»).
 */
export default function TanggalCetak({ awal, locale, zona }: { awal: string; locale: Locale; zona: string | null | undefined }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const tulis = () => { if (ref.current) ref.current.textContent = format.date(new Date().toISOString(), locale, zona); };
    window.addEventListener("beforeprint", tulis);
    return () => window.removeEventListener("beforeprint", tulis);
  }, [locale, zona]);
  return <span ref={ref} suppressHydrationWarning>{awal}</span>;
}
