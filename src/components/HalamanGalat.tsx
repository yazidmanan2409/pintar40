"use client";

import Link from "next/link";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import MerekPintar from "./MerekPintar";

/**
 * WHAT A READER SEES WHEN A PAGE FAILS (DAISY-04, D-011).
 *
 * Until now that was Next's own English default, on every screen, in a
 * product whose readers are mostly Indonesian children and teachers. This is
 * PINTAR's page instead: the mark, a calm sentence that blames nobody, a way
 * to try again and a way back to the start.
 *
 * ═══ NEVER THE MESSAGE; ONLY A REFERENCE ═══
 *
 * The error's own message is never drawn. On a server failure it can be a
 * database sentence in English, and D-011 is explicit that raw server text
 * does not reach a reader. What is drawn is the error's DIGEST -- the short
 * reference Next attaches to a server failure and prints beside it in the
 * server log -- so a school administrator can pass it on and somebody can find
 * the line. A failure with no digest shows no reference rather than a made-up
 * one.
 *
 * `role="alert"` so the change is announced: a page that fails after a tap
 * otherwise fails silently for somebody who cannot see it.
 */
export default function HalamanGalat({
  locale,
  rujukan,
  ulang,
}: {
  locale: Locale;
  /** The error's digest, or undefined. Never its message. */
  rujukan?: string;
  ulang: () => void;
}) {
  const s = (k: HleEvent) => t(k, "public", { locale });
  return (
    <main className="pin-col">
      <section className="pin-refusal" role="alert">
        <MerekPintar standalone />
        <h1>{s("galat.judul")}</h1>
        <p className="pin-intro">{s("galat.arti")}</p>
        {rujukan ? (
          <p className="pin-meta">
            {s("galat.rujukan")} <span className="pin-num">{rujukan}</span>
          </p>
        ) : null}
        <div className="pin-actions">
          <button type="button" className="pin-btn pin-primary" onClick={ulang}>
            {s("galat.ulang")}
          </button>
          <Link className="pin-btn" href="/">
            {s("galat.beranda")}
          </Link>
        </div>
      </section>
    </main>
  );
}
