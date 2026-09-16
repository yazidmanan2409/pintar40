import Link from "next/link";
import { t, type Locale } from "@/lib/hle";
import PengalihBahasa from "./PengalihBahasa";

/**
 * The Experience shell: a wordmark, where you are, and the language switch.
 *
 * TWO KINDS, AND THE DIFFERENCE MATTERS. A signed-in learner gets the tabs,
 * because they have somewhere to go. A stranger holding a verification link
 * gets the wordmark and the name of what this page is, and NO NAVIGATION — a
 * verification page that offered a way into PINTAR would be inviting somebody
 * who came to check a certificate to go looking at something else.
 *
 * The language switch is on both, because the reader of a public verification
 * page has no account to carry a preference in (S0.3).
 */
export default function CangkangPengalaman({
  locale,
  kind = "learner",
  current,
}: {
  locale: Locale;
  kind?: "learner" | "public";
  current?: "belajar" | "sertifikat";
}) {
  if (kind === "public") {
    return (
      <header className="pin-top pin-shell pin-noprint">
        <span className="pin-wordmark">{t("app.name", "public", { locale })}</span>
        <span className="pin-sub">{t("verifikasi.situs", "public", { locale })}</span>
        <span className="pin-spacer" />
        <PengalihBahasa locale={locale} />
      </header>
    );
  }

  return (
    <header className="pin-top pin-shell pin-noprint">
      <span className="pin-wordmark">{t("app.name", "learner", { locale })}</span>
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
