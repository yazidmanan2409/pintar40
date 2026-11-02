"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * W3.5 · THE ONE DIALOG (Batch 2; Daisy, components/Dialog, approved question 6; JQ2(a)). PINTAR's default
 * confirmation stays in the page; a dialog is only for a short, consequential question asked from a place with no room
 * for one, such as «Keluar dari semua perangkat?» from the account menu.
 *
 * The native <dialog>, opened with showModal(): it holds focus, Esc closes it, and focus returns to what opened it.
 * A title, one or two sentences of consequence, the actions at the end (the safe one first); under 640 px they stack,
 * the safe one last. For a destructive act, focus starts on the safe button: put it first, and showModal() focuses it
 * (never React's autoFocus, which focuses at mount, while the dialog is still closed).
 */
export default function Dialog({
  terbuka, judul, idJudul, onTutup, children, aksi,
}: {
  terbuka: boolean;
  judul: string;
  idJudul: string;
  onTutup: () => void;
  children: ReactNode;
  /** The actions: the safe one first. */
  aksi: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const pembuka = useRef<Element | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (terbuka && !d.open) {
      pembuka.current = document.activeElement;
      d.showModal();
    } else if (!terbuka && d.open) {
      d.close();
    }
  }, [terbuka]);
  return (
    <dialog
      ref={ref}
      className="pin-dialog"
      aria-labelledby={idJudul}
      onClose={() => {
        onTutup();
        const p = pembuka.current;
        if (p instanceof HTMLElement) p.focus();
      }}
    >
      <div className="pin-dialog-isi">
        <h2 id={idJudul}>{judul}</h2>
        {children}
        <div className="pin-dialog-aksi">{aksi}</div>
      </div>
    </dialog>
  );
}
