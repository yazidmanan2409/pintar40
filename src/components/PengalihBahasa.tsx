"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { t, type Locale } from "@/lib/hle";
import { LOCALE_COOKIE } from "@/lib/locale-kontrak";

/**
 * Pengalih Bahasa Antarmuka — the interface-language switch.
 *
 * It writes a cookie and a localStorage mirror, then asks Next to re-render the
 * current route. It calls no action and no endpoint: switching language is not
 * an event that happened to the account, it is how this reader would like the
 * page written, and PINTAR does not record that.
 *
 * The control is on the page rather than buried in a settings screen because a
 * stranger opening a verification link has no account to hold a setting — see
 * the public verification page, which renders this same component.
 */
export default function PengalihBahasa({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function choose(next: Locale) {
    if (next === locale) return;
    // A year is long enough that a learner never meets this control twice by
    // accident, and short enough that a shared classroom machine forgets.
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    try {
      window.localStorage.setItem(LOCALE_COOKIE, next);
    } catch {
      // A browser that refuses storage still gets the cookie; the mirror is a
      // convenience, never the source of truth.
    }
    startTransition(() => router.refresh());
  }

  return (
    <div className="pin-lang" role="group" aria-label={t("bahasa.label", "public", { locale })}>
      <button type="button" aria-pressed={locale === "id"} onClick={() => choose("id")}>
        {t("bahasa.id", "public", { locale })}
      </button>
      <button type="button" aria-pressed={locale === "en"} onClick={() => choose("en")}>
        {t("bahasa.en", "public", { locale })}
      </button>
    </div>
  );
}
