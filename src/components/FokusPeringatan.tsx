"use client";

import { useEffect, useRef } from "react";

/**
 * FokusPeringatan — A2b (Daisy's batch 2 review, BL-1): after a refused form comes back with what was entered, focus
 * moves to its refusal (the nearest role="alert" before this marker, within the same region), so a keyboard or
 * screen-reader user hears why before the form again. It draws nothing of its own.
 */
export default function FokusPeringatan() {
  const tanda = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const wilayah = tanda.current?.closest("section") ?? document.body;
    const peringatan = [...wilayah.querySelectorAll<HTMLElement>('[role="alert"]')].pop();
    if (!peringatan) return;
    if (!peringatan.hasAttribute("tabindex")) peringatan.setAttribute("tabindex", "-1");
    peringatan.focus();
  }, []);
  return <span ref={tanda} hidden data-fokus-peringatan="" />;
}
