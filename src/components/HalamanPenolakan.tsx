import Link from "next/link";
import { namaTempat } from "@/lib/nama-tempat";
import { t, type HleEvent, type Locale, type Persona } from "@/lib/hle";
import KakiPintar from "./KakiPintar";
import MerekPintar from "./MerekPintar";
import SesiSaya from "./SesiSaya";

/**
 * HalamanPenolakan — ONE refusal page, for unauthorized, nonexistent and
 * expired alike (P7).
 *
 * THE POINT IS THAT THEY ARE THE SAME PAGE. A refusal that differs by cause is
 * an existence oracle: "you may not see this" and "this does not exist" are two
 * answers, and a reader who can tell them apart has learned something about
 * what exists that the refusal was there to withhold. So the caller passes a
 * copy key for the sentence its own audience needs to read, and passes nothing
 * about WHY — because this component has no slot for a reason, there is no
 * accidental way to leak one.
 *
 * It renders; it does not decide. What the server decided is already decided
 * by the time a page renders this, and wiring an existing refusal path through
 * here changes no decision — only the way the outcome is told.
 */
export default function HalamanPenolakan({
  messageKey = "auth.not_yet",
  locale = "id",
  persona = "learner",
  backHref = "/belajar",
  backKey,
  backLabel,
}: {
  messageKey?: HleEvent;
  locale?: Locale;
  persona?: Persona;
  backHref?: string;
  backKey?: HleEvent;
  /** E-K1: the destination's own name, already in the reader's language, when it is a page and not a place (a class). */
  backLabel?: string;
}) {
  const s = (k: HleEvent) => t(k, persona, { locale });
  return (
    <main id="isi" tabIndex={-1} className="pin-col">
      <section className="pin-refusal">
        <MerekPintar standalone />
        <h1>{s(messageKey)}</h1>
        <p className="pin-intro">{s("tolak.arti")}</p>
        <Link className="pin-btn" href={backHref}>{backLabel ?? s(backKey ?? (backHref === "/belajar" ? "tolak.kembali" : namaTempat(backHref) ?? "tolak.kembali"))}</Link>
        {/* DAISY-02. A refusal is often somebody signed in as the wrong
            account, so the way out is here too. Drawn only when signed in, and
            it names the reader only if they hold a staff role (S15, D-020). */}
        <SesiSaya locale={locale} persona={persona} varian="penolakan" />
      </section>

      <KakiPintar className="pin-noprint" />
    </main>
  );
}
