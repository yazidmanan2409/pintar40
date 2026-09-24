"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { t, type Locale } from "@/lib/hle";
import type { ScopeOption } from "@/lib/lingkup";

/**
 * PemilihLingkup — the scope picker.
 *
 * It offers exactly the list the server built from the viewer's own RLS reads
 * (see src/lib/lingkup.ts). It holds no authority, decides nothing, and cannot
 * be persuaded to offer a scope the database did not return: an option that is
 * not in `options` is not in the DOM.
 *
 * Choosing writes the id into the query string and re-renders the route. The
 * server re-resolves it against the same RLS read on every request, so a hand-
 * edited query string is checked by the database, not by this control.
 */
export default function PemilihLingkup({
  options,
  selected,
  param = "lingkup",
  locale = "id",
}: {
  options: ScopeOption[];
  selected?: string;
  param?: string;
  locale?: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  if (options.length === 0) {
    return <p className="pin-meta">{t("lingkup.kosong", "educator", { locale })}</p>;
  }

  function choose(value: string) {
    const next = new URLSearchParams(search.toString());
    if (value) next.set(param, value);
    else next.delete(param);
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="pin-picker">
      <label className="pin-meta" htmlFor="pin-lingkup">
        {t("lingkup.pilih", "educator", { locale })}
      </label>
      <select
        id="pin-lingkup"
        value={selected ?? ""}
        onChange={(e) => choose(e.target.value)}
      >
        <option value="">{t("lingkup.semua", "educator", { locale })}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
