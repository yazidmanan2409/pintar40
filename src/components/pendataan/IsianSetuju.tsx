"use client";

import { useEffect, useRef } from "react";
import { catatNiat } from "./niatMencatat";

/**
 * POLISH3 (UX-08): THE JOB FIELD OF AN APPROVING FORM, WHICH ALSO SAYS "START".
 *
 * The page's approval forms stay plain forms posting to WP5A's actions, with
 * their TombolKirim. This is their hidden `pekerjaan` field, and it watches its
 * own form: when the form is submitted it leaves the note (niatMencatat) that
 * the driver drawn by the redirect takes to start recording. The action still
 * decides everything; if the approval is refused, no driver reads the note.
 *
 * A second submit stopped by TombolKirim's guard never reaches this listener,
 * because that guard stops the event before it reaches the form.
 */
export default function IsianSetuju({ pekerjaan }: { pekerjaan: string }) {
  const isian = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const form = isian.current?.form;
    if (!form) return;
    const catat = () => catatNiat(pekerjaan);
    form.addEventListener("submit", catat);
    return () => form.removeEventListener("submit", catat);
  }, [pekerjaan]);
  return <input ref={isian} type="hidden" name="pekerjaan" value={pekerjaan} />;
}
