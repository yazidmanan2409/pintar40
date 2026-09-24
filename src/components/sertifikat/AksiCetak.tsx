"use client";

/**
 * Print, or save as PDF — whichever the reader's browser offers.
 *
 * It calls the browser's own print, on the A4 sheet this page already rendered.
 * There is no server-side PDF, no download endpoint and no job: a certificate
 * that had to be fetched again to be printed would be a second place the
 * credential is assembled, and the printed sheet must be the one on screen.
 */
export default function AksiCetak({ label }: { label: string }) {
  return (
    <button type="button" className="pin-btn pin-primary" onClick={() => window.print()}>
      {label}
    </button>
  );
}
