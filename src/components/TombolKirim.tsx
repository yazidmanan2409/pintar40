"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
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
 * Pages are server components; this is the one client piece a form needs.
 * UX: a whole-form lock, so a form's every way of submitting is covered.
 */
export default function TombolKirim({
  children,
  sibuk,
  disabled,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "children"> & {
  /** The button's words at rest. */
  children: ReactNode;
  /** The words while the form is being saved: "Menyimpan…" or the step's own. */
  sibuk: ReactNode;
}) {
  const { pending } = useFormStatus();
  const tombol = useRef<HTMLButtonElement>(null);
  const terkirim = useRef(false);

  useEffect(() => {
    const form = tombol.current?.form;
    if (!form) return;
    const jaga = (e: Event) => {
      if (e.target !== form) return;
      if (terkirim.current) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      terkirim.current = true;
    };
    document.addEventListener("submit", jaga, true);
    return () => document.removeEventListener("submit", jaga, true);
  }, []);

  // The answer came back (or never started): the form may be sent again.
  useEffect(() => {
    if (!pending) terkirim.current = false;
  }, [pending]);

  return (
    <button {...rest} ref={tombol} type="submit" disabled={pending || disabled} aria-busy={pending ? "true" : undefined}>
      {pending ? sibuk : children}
    </button>
  );
}
