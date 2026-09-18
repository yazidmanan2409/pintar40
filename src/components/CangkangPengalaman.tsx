import Link from "next/link";
import { t, type Locale } from "@/lib/hle";
import PengalihBahasa from "./PengalihBahasa";
import MerekPintar from "./MerekPintar";
import TombolBantuan from "./tur/TombolBantuan";

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
 *
 * BANTUAN, ADDED IN UX-1 §F. The shell had no help entry — two learner tabs,
 * one educator tab, and the language switch — so the tour's last step ("help
 * can always be found here") had nowhere true to point and Daisy's proposed
 * header control stands rather than being withdrawn (L-5). It is on the two
 * shells that have a landing to return to, and on neither of the other two:
 * §G-3 forbids a tour or a tip inside an assessment in progress and on the
 * public verification page, and a Help entry whose content is "start the tour"
 * would be offering exactly that.
 *
 * A FOURTH, ADDED IN SLICE 3: `pengajar`, the educator's shell. It is the
 * learner shell's shape with the educator's own destination, and it carries ONE
 * tab because Slice 3 builds one surface. The reviewed concept showed three —
 * Kelas, Materi, Akun — and the other two have no route yet; a tab that goes
 * nowhere is a promise the product cannot keep, so it is absent until the slice
 * that builds it arrives rather than present and inert.
 */
export default function CangkangPengalaman({
  locale,
  kind = "learner",
  current,
}: {
  locale: Locale;
  kind?: "learner" | "public" | "focus" | "pengajar";
  current?: "belajar" | "sertifikat" | "kelas";
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

  if (kind === "pengajar") {
    return (
      <header className="pin-top pin-shell pin-noprint">
        <MerekPintar />
        <nav className="pin-tabs" aria-label={t("app.name", "educator", { locale })}>
          <Link href="/mengajar" aria-current={current === "kelas" ? "page" : undefined}>
            {t("nav.kelas", "educator", { locale })}
          </Link>
        </nav>
        <span className="pin-spacer" />
        <TombolBantuan locale={locale} persona="educator" beranda="/mengajar" />
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
        {/* A stable anchor for the tour's certificate step. It names a place,
            and naming a place grants nothing: what is behind this tab is
            decided by the certificate's own authority, not by the tour. */}
        <Link
          href="/belajar/sertifikat"
          data-tur="sertifikat"
          aria-current={current === "sertifikat" ? "page" : undefined}
        >
          {t("nav.sertifikat", "learner", { locale })}
        </Link>
      </nav>
      <span className="pin-spacer" />
      <TombolBantuan locale={locale} persona="learner" beranda="/belajar" />
      <PengalihBahasa locale={locale} />
    </header>
  );
}
