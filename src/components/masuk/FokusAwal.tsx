"use client";

import { useEffect } from "react";

/**
 * MOVE FOCUS TO THE HEADING THIS SURFACE ARRIVES WITH.
 *
 * S15 is decided on the server — arriving at the sign-in screen with a live
 * session is a different screen, not a variation of this one — so there is no
 * client state machine on it to move focus the way S5, S13 and S14 do. Without
 * this, the heading carries `tabindex="-1"` and nothing ever focuses it: a
 * keyboard reader lands at the top of the document and a screen-reader user is
 * told nothing about the surface that replaced the form they expected.
 *
 * It renders nothing. It exists to do the one thing a server component cannot.
 */
export default function FokusAwal() {
  useEffect(() => {
    const el = document.querySelector("[data-fokus-awal]");
    if (el instanceof HTMLElement) el.focus();
  }, []);
  return null;
}
