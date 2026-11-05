"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * E-K1 (D-173(d)): THE HISTORY-BACK, ONE COMPONENT. A way back named «Kembali ke halaman sebelumnya» (or by the place
 * it was opened from) returns to the page exactly as the reader left it: its query (an assignment, a revision, an
 * opened record) and its state. Only the browser's history holds that, so the link goes back in it; with nothing
 * behind it (a page opened on its own), it follows its address. The report pages (AksiLaporan) and «Laporkan
 * masalah» (/lapor) both use it, so the two ways back cannot drift apart (D-168).
 */
export default function TautanKembali({ href, className, children, jenis }: {
  href: string; className: string; children: ReactNode;
  /** data-kembali: "riwayat" when it is named as the history-back, "tempat" when by its place */
  jenis: "riwayat" | "tempat";
}) {
  return (
    <Link
      href={href}
      className={className}
      data-kembali={jenis}
      onClick={(e) => {
        if (window.history.length > 1) {
          e.preventDefault();
          window.history.back();
        }
      }}
    >
      {children}
    </Link>
  );
}
