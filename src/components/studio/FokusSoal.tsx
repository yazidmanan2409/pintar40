"use client";

import { useEffect } from "react";

/**
 * A1 (D-166(b)): AFTER THE LESSON JUMP OR THE PAGER, FOCUS IS ON THE LESSON'S HEADING.
 *
 * The jump is a plain GET to the package page and the pager a link with `?pelajaran=n`; either way the new lesson
 * replaces the old one in place, so a keyboard or screen-reader user is put on its heading (`#pin-soal-pelajaran`,
 * tabindex -1) rather than left on the button or at the top of the page. Drawn only when the address names a lesson,
 * so a plain visit to the package page keeps its own focus. Draws nothing.
 */
export default function FokusSoal({ pelajaran }: { pelajaran: number }) {
  useEffect(() => {
    document.getElementById("pin-soal-pelajaran")?.focus();
  }, [pelajaran]);
  return null;
}
