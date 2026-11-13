"use client";

import { useEffect } from "react";

/**
 * C1w (Daisy Q5, Q6): when an article turns into its form in place (`?ubah={item}#soal-{item}`), or a key correction
 * moves to its next step, focus goes to the form's heading (tabindex -1), so a keyboard or screen-reader user starts
 * where the change is. Draws nothing.
 */
export default function FokusJudul({ id }: { id: string }) {
  useEffect(() => {
    document.getElementById(id)?.focus();
  }, [id]);
  return null;
}
