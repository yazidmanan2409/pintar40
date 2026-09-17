import Link from "next/link";
import { t, type Locale } from "@/lib/hle";
import PengalihBahasa from "./PengalihBahasa";
import MerekPintar from "./MerekPintar";

/**
 * The Experience shell: the mark, where you are, and the language switch.
 *
 * TWO KINDS, AND THE DIFFERENCE MATTERS. A signed-in learner gets the tabs,
 * because they have somewhere to go. A stranger holding a verification link
 * gets the wordmark and the name of what this page is, and NO NAVIGATION — a
 * verification page that offered a way into PINTAR would be inviting somebody
 * who came to check a certificate to go looking at something else.
 *
 * A THIRD, ADDED IN SLICE 2: `focus`, for a learner inside an assessment. Same
 * reasoning as the public shell from the opposite direction — there the
 * navigation would invite a stranger further in, here it would invite a
 * learner out of a task they are being timed on.
 *
 * The language switch is on all three, because the reader of a public
 * verification page has no account to carry a preference in (S0.3), and a
 * learner does not lose their language by starting an assessment.
 */
export default function CangkangPengalaman({
  locale,
  kind = "learner",
  current,
}: {
  locale: Locale;
  kind?: "learner" | "public" | "focus";
  current?: "belajar" | "sertifikat";
}) {
  // FOCUS. During an assessment the shell keeps the mark and the language and
  // drops the tabs. The engine survives navigating away — a session is server
  // state, not a page — but a header offering three ways out of a timed task
  // is inviting the learner to take one, and the cost of taking it is theirs.
  // The public verification shell already works this way for its own reason.
  if (kind === "focus") {
    return (
      <header className="pin-top pin-shell pin-noprint">
        <MerekPintar />
        <span className="pin-spacer" />
        <PengalihBahasa locale={locale} />
      </header>
    );
  }

  if (kind === "public") {
    return (
      <header className="pin-top pin-shell pin-noprint">
        <MerekPintar />
        <span className="pin-sub">{t("verifikasi.situs", "public", { locale })}</span>
        <span className="pin-spacer" />
        <PengalihBahasa locale={locale} />
      </header>
    );
  }

  return (
    <header className="pin-top pin-shell pin-noprint">
      <MerekPintar />
      <nav className="pin-tabs" aria-label={t("app.name", "learner", { locale })}>
        <Link href="/belajar" aria-current={current === "belajar" ? "page" : undefined}>
          {t("nav.belajar", "learner", { locale })}
        </Link>
        <Link href="/belajar/sertifikat" aria-current={current === "sertifikat" ? "page" : undefined}>
          {t("nav.sertifikat", "learner", { locale })}
        </Link>
      </nav>
      <span className="pin-spacer" />
      <PengalihBahasa locale={locale} />
    </header>
  );
}
