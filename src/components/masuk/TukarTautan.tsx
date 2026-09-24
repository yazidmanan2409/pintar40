"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { tukarKode } from "@/app/auth/callback/actions";
import { useSiap } from "./siap";

/**
 * S13 · exchanging, and S14 · the link is no longer valid.
 *
 * S13 IS NOT A DEAD END. A screen with no focusable element and a silent
 * spinner is exactly that for a screen reader, so the block is a polite live
 * region and focus moves to the heading on arrival. Nothing else is offered:
 * there is nothing useful for a person to do during a token exchange, and a
 * button would only invite them to interrupt it.
 *
 * ONE MESSAGE COVERS EXPIRED AND ALREADY-USED, because telling somebody
 * holding a forwarded link which of the two happened is telling them about
 * somebody else's activity. The wording covers both honestly: a link works
 * once, and only for a while.
 *
 * THE NEW LINK STARTS CLEAN (Sauron, D1). The button goes to the sign-in
 * screen carrying no destination, so the next successful sign-in lands on the
 * person's role home rather than resuming an intent that crossed a failed
 * authentication.
 */
export default function TukarTautan({
  locale,
  kode,
  lanjut,
}: {
  locale: Locale;
  /** Null when there is nothing to exchange, which renders S14 at once. */
  kode: string | null;
  lanjut: string;
}) {
  const s = (k: HleEvent) => t(k, "public", { locale });
  const siap = useSiap();
  const [mati, setMati] = useState(kode === null);
  const judulRef = useRef<HTMLHeadingElement>(null);
  const sudah = useRef(false);

  useEffect(() => {
    if (kode === null || sudah.current) return;
    sudah.current = true;
    // On success the action redirects and this component goes away with the
    // page; the only thing that returns is a refusal.
    void tukarKode(kode, lanjut).then(() => setMati(true)).catch(() => setMati(true));
  }, [kode, lanjut]);

  useEffect(() => {
    judulRef.current?.focus();
  }, [mati]);

  if (mati) {
    return (
      <div className="pin-form">
        <span className="pin-disc pin-disc-attention" aria-hidden="true">🕐</span>
        <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("auth.link_h_exp")}</h1>
        <p className="pin-lede-m">{s("auth.link_p_exp")}</p>
        {/* The likeliest reason a fresh link lands here is that it was opened
            somewhere other than where it was asked for (audit M1), so the way
            out is said next to the button that takes it. */}
        <p className="pin-msg pin-msg-note">{s("auth.link_same")}</p>
        <div className="pin-stack">
          <Link className="pin-mbtn pin-mbtn-1" href="/masuk">{s("auth.link_again")}</Link>
        </div>
      </div>
    );
  }

  // The exchange is the client's work, so if the client never started there is
  // nothing in flight and saying "please wait" would be a lie told to somebody
  // who could wait for ever. The heading stays — the link has not been judged —
  // and the note says what actually happened and what to do (D2's bounded
  // failure behaviour).
  return (
    <div className="pin-form" role="status" aria-live="polite">
      <span className="pin-disc pin-disc-primary" aria-hidden="true">
        {siap ? <span className="pin-putar" /> : null}
      </span>
      <h1 className="pin-mh1" tabIndex={-1} ref={judulRef}>{s("auth.link_h_exch")}</h1>
      <p className="pin-lede-m">{s(siap ? "auth.link_p_exch" : "auth.belum_siap")}</p>
    </div>
  );
}
