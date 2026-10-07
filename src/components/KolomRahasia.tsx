"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes, type Ref } from "react";

/**
 * CR-86 (D-127 Q6, D-128): THE ONE SECRET FIELD.
 *
 * Every password, PIN and reusable or recovery secret PINTAR asks for is typed here, and nowhere else (PENUTUPAN-R01
 * holds `src/` to it). Dr Gladys's session found nine secret fields behaving four ways; the worst was activation's,
 * where one eye inside the first box also revealed the confirmation box beneath it, which had no control of its own
 * (DG-37). So, for every secret:
 *   - masked by default;
 *   - its reveal belongs to this field alone: a labelled pressed-state toggle that names the field it controls, so no
 *     control ever reveals another field;
 *   - nothing re-masks it while the person is reading it (no timer: a PIN that re-hides itself while a child is
 *     comparing it against a printed card is a small cruelty), and the person's own submit re-masks it, so a refusal
 *     that follows never leaves a secret on a shared screen.
 * Emailed one-time codes are not secrets here (D-127 Q10): they are read and transcribed, and stay plain fields.
 */
export default function KolomRahasia({ bungkus, tampilkan, sembunyikan, ref, ...input }:
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    /** the field's frame: `pin-inp`, with `pin-inp-big` or `pin-inp-salah` as the screen needs */
    bungkus: string;
    /** the reveal control's two names, from the copy table */
    tampilkan: string;
    sembunyikan: string;
    ref?: Ref<HTMLInputElement>;
  }) {
  const [tampil, setTampil] = useState(false);
  const sendiri = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const form = sendiri.current?.form;
    if (!form) return;
    const tutup = () => setTampil(false);
    form.addEventListener("submit", tutup);
    return () => form.removeEventListener("submit", tutup);
  }, []);

  const pasang = (el: HTMLInputElement | null) => {
    sendiri.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as { current: HTMLInputElement | null }).current = el;
  };

  return (
    <span className={bungkus}>
      <input {...input} ref={pasang} type={tampil ? "text" : "password"} />
      <button
        type="button" className="pin-lihat"
        aria-pressed={tampil}
        aria-label={tampil ? sembunyikan : tampilkan}
        aria-controls={input.id}
        onClick={() => setTampil((v) => !v)}
      >
        <span aria-hidden="true">{tampil ? "🚫" : "👁"}</span>
      </button>
    </span>
  );
}
