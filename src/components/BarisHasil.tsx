"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * BarisHasil — THE RESULT LINE OF A SAVE (DAISY-18, D-047).
 *
 * WHERE THE ACTION WAS. The line sits next to the form that was sent, not
 * only at the top of the page, and it is the one thing a reader looks for
 * after a click: so it is `role="status"` (read out without taking focus),
 * and when it appears it brings itself into view. After "Berikan peran" the
 * page used to land at the top of the section with the answer below the fold.
 *
 * Idle → Working (TombolKirim, DAISY-17) → Success / Error (here): one
 * pattern, two shared pieces. The words are the caller's, from the copy
 * table; this draws them and nothing else.
 *
 * A result that is more than a line (the activation's card and PIN, a
 * workbook check's counts) keeps its own look through `kelas`, and is still
 * announced, placed and brought into view the same way.
 */
export default function BarisHasil({
  nada,
  children,
  id,
  kelas,
}: {
  /** ok: it was done; gagal: it was not; netral: neither, a note. */
  nada: "ok" | "gagal" | "netral";
  children: ReactNode;
  id?: string;
  /** A block result's own class, in place of the line's. */
  kelas?: string;
}) {
  const baris = useRef<HTMLDivElement>(null);
  useEffect(() => {
    baris.current?.scrollIntoView({ block: "nearest" });
  }, []);
  return (
    <div ref={baris} id={id} className={`${kelas ?? "pin-msg pin-hasil"} pin-hasil-${nada}`} role="status">
      {children}
    </div>
  );
}
