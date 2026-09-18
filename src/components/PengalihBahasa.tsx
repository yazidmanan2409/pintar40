"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { t, type Locale } from "@/lib/hle";
import { simpanBahasa } from "@/lib/locale-klien";

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
    // The write itself lives in `simpanBahasa` because the tour's card carries
    // the same control over an inert page: one preference, one mechanism.
    simpanBahasa(next);
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
