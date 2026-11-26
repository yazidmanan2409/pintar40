"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

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
 * own title returns afterwards, after a print or a cancelled one (E-D2-1). It names the course, never the person: a shared
 * computer's tab bar and history never carry a person's name (W3.1).
 *
 * THE STATE AT PRINT TIME (CI-1b, L-105; Daisy CI1B-KATA requirement 3): the press re-reads the certificate from the
 * server (router.refresh) and prints only once that read has landed. A certificate revoked or replaced since the page
 * loaded re-renders as such: this button is no longer on the page, so nothing prints, and the page now shows the
 * banner (and prints the notice). SegarkanKeadaan re-reads on focus too.
 */
export default function AksiCetak({ label, judulBerkas }: { label: string; judulBerkas?: string }) {
  const router = useRouter();
  const [membaca, mulai] = useTransition();
  // a press waiting for its re-read; a ref, so landing the read never renders twice
  const ingin = useRef(false);
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

  // the re-read has landed and this button is still on the page: the certificate is still printable as it stands
  useEffect(() => {
    if (!ingin.current || membaca) return;
    ingin.current = false;
    const semula = document.title;
    if (judulBerkas) document.title = judulBerkas;
    window.print();
    document.title = semula;
  }, [membaca, judulBerkas]);

  return (
    // E-D2-1: the browser's print returns when its dialog closes, printed or cancelled; the tab's title is put back
    // then too, for a browser that sends no «afterprint» on a cancel
    <button type="button" className="pin-btn pin-primary" aria-busy={membaca || undefined} onClick={() => {
      ingin.current = true;
      mulai(() => router.refresh());
    }}>
      {label}
    </button>
  );
}
