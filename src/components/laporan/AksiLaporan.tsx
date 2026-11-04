"use client";

import Link from "next/link";

/**
 * HOD-J09: A REPORT HAS A WAY BACK AND CAN BE PRINTED.
 *
 * The two report pages are reached from /pimpinan and from Konfigurasi, and
 * had no way back but the browser's own and no print. «Kembali» returns to the
 * page the reader came from, with its place kept (the class panel, the chosen
 * school); opened with nothing behind it, it goes to the reader's doors (/).
 * «Cetak laporan» is the browser's print of this page; the row itself, and the
 * signed-in strip, do not print.
 */
export default function AksiLaporan({ kembali, cetak }: { kembali: string; cetak: string }) {
  return (
    <div className="pin-actions pin-noprint">
      <Link
        href="/"
        className="pin-btn pin-quiet"
        data-kembali="riwayat"
        onClick={(e) => {
          if (window.history.length > 1) {
            e.preventDefault();
            window.history.back();
          }
        }}
      >
        ← {kembali}
      </Link>
      <button type="button" className="pin-btn pin-primary" onClick={() => window.print()}>
        {cetak}
      </button>
    </div>
  );
}
