"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { t, LOCALES, type Locale } from "@/lib/hle";
import { useFormStatus } from "react-dom";

/**
 * TombolKirim — THE SUBMIT BUTTON OF EVERY FORM THAT CALLS A SERVER ACTION
 * (DAISY-17, D-046(e)).
 *
 * A CLICK THAT SAVES SAYS SO AT ONCE AND SAVES ONCE. "Berikan peran" used to
 * show nothing for 10–15 seconds, so the reader clicked again, and the second
 * click made a second grant. This button reads its form's own status: from the
 * moment the form is submitted until the server's answer comes back it is
 * disabled, marked busy, and shows the step's pending word ("Menyimpan…" or
 * the step's own), passed in by the page in the reader's language.
 *
 * SAVES ONCE EVEN BEFORE THE PAGE REDRAWS. Disabling waits for React to render
 * the pending state; a double-click can land a second submit in between. So
 * the form's submit event is watched, in the capture phase at the document,
 * ahead of React's own listener: a second submit of the same form while the
 * first is still in flight is stopped there. The guard clears when the answer
 * comes back (pending turns false). It never disables the button inside its
 * own click, which would cancel the very submission it is guarding.
 *
 * v3 ActionFeedback (D-138 step 2):
 * - A WAIT OVER 3 SECONDS IS EXPLAINED. The line under the button says PINTAR
 *   is still working and a second press is not needed, in the page's own
 *   language (`<html lang>`), and goes when the answer comes back.
 * - COMPLETED ONLY WHEN THE SERVER SAYS SO. `selesai` is the result word
 *   («Tersimpan»), passed by the page only once the server has confirmed the
 *   act; the button then shows ✓ and that word, and returns to its verb as
 *   soon as the form is changed. Without `selesai` nothing is claimed. An
 *   email action never passes it (D-098(c)).
 *
 * Pages are server components; this is the one client piece a form needs.
 * UX: a whole-form lock, so a form's every way of submitting is covered.
 */
export default function TombolKirim({
  children,
  sibuk,
  selesai,
  disabled,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children"> & {
  /** The button's words at rest. */
  children: ReactNode;
  /** The words while the form is being saved: "Menyimpan…" or the step's own. */
  sibuk: ReactNode;
  /** The result word, given only once the server has confirmed the act. */
  selesai?: ReactNode;
}) {
  const { pending } = useFormStatus();
  const tombol = useRef<HTMLButtonElement>(null);
  const terkirim = useRef(false);
  const selesaiTuntas = useRef(false);
  const [lambat, setLambat] = useState(false);
  const [diubah, setDiubah] = useState(false);

  // A wait over 3 seconds is explained; the line goes with the wait.
  // (Both flags are cleared by the submit itself, below, so a new wait starts
  // without the last one's line and a new result is not hidden.)
  useEffect(() => {
    if (!pending) return;
    const jam = setTimeout(() => setLambat(true), 3000);
    return () => clearTimeout(jam);
  }, [pending]);

  // A completed button returns to its verb once there is something new to do.
  useEffect(() => {
    const form = tombol.current?.form;
    if (!form || selesai === undefined) return;
    const ubah = () => setDiubah(true);
    form.addEventListener("input", ubah);
    form.addEventListener("change", ubah);
    return () => {
      form.removeEventListener("input", ubah);
      form.removeEventListener("change", ubah);
    };
  }, [selesai]);

  useEffect(() => {
    const form = tombol.current?.form;
    if (!form) return;
    const jaga = (e: Event) => {
      if (e.target !== form) return;
      // Completed: the same form, unchanged, is not sent again (ActionFeedback).
      // Held here, at the submit, never inside the button's own click.
      if (selesaiTuntas.current) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (terkirim.current) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      terkirim.current = true;
      setLambat(false);
      setDiubah(false);
    };
    document.addEventListener("submit", jaga, true);
    return () => document.removeEventListener("submit", jaga, true);
  }, []);

  // The answer came back (or never started): the form may be sent again.
  useEffect(() => {
    if (!pending) terkirim.current = false;
  }, [pending]);

  const tuntas = !pending && selesai !== undefined && !diubah;
  useEffect(() => {
    selesaiTuntas.current = tuntas;
  }, [tuntas]);
  return (
    <>
      <button
        {...rest}
        ref={tombol}
        type="submit"
        disabled={pending || disabled}
        aria-busy={pending ? "true" : undefined}
        data-keadaan={tuntas ? "selesai" : undefined}
        aria-disabled={tuntas ? "true" : rest["aria-disabled"]}
      >
        {pending ? sibuk : tuntas ? <><span aria-hidden="true">✓</span> {selesai}</> : children}
      </button>
      {/* The live region is on the page from the start and only its words
          change: a region inserted at the moment it fills is often not read. */}
      <span className="pin-lambat" role="status">
        {pending && lambat ? t("tombol.lambat", "learner", { locale: bahasaHalaman() }) : ""}
      </span>
    </>
  );
}

/** The page's language, as the root layout writes it on `<html lang>`. */
function bahasaHalaman(): Locale {
  const lang = typeof document === "undefined" ? "" : document.documentElement.lang;
  return (LOCALES as readonly string[]).includes(lang) ? (lang as Locale) : "id";
}
