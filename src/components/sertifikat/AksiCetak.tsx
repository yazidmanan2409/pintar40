"use client";

import { useEffect } from "react";

/**
 * Print, or save as PDF — whichever the reader's browser offers.
 *
 * It calls the browser's own print, on the A4 sheet this page already rendered.
 * There is no server-side PDF, no download endpoint and no job: a certificate
 * that had to be fetched again to be printed would be a second place the
 * credential is assembled, and the printed sheet must be the one on screen.
 *
 * THE SAVED FILE IS NAMED FOR WHAT IT IS (DAISY-36(3); Daisy, sertifikat/ronde-2
 * §7): «Simpan sebagai PDF» suggests the document's title as the file name, so
 * while the page prints — by this button or by the browser's own Print — the
 * title is `judulBerkas` («Sertifikat Penguasaan · <the course>»), and the tab's
 * own title returns afterwards. It names the course, never the person: a shared
 * computer's tab bar and history never carry a person's name (W3.1).
 */
export default function AksiCetak({ label, judulBerkas }: { label: string; judulBerkas?: string }) {
  useEffect(() => {
    if (!judulBerkas) return;
    let semula: string | null = null;
    const sebelum = () => {
      if (semula === null) semula = document.title;
      document.title = judulBerkas;
    };
    const sesudah = () => {
      if (semula !== null) document.title = semula;
      semula = null;
    };
    window.addEventListener("beforeprint", sebelum);
    window.addEventListener("afterprint", sesudah);
    return () => {
      window.removeEventListener("beforeprint", sebelum);
      window.removeEventListener("afterprint", sesudah);
      sesudah();
    };
  }, [judulBerkas]);

  return (
    <button type="button" className="pin-btn pin-primary" onClick={() => window.print()}>
      {label}
    </button>
  );
}
