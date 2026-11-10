import { t, type Locale } from "@/lib/hle";
import { tanggal } from "@/lib/tanggal";

/**
 * E-A2-1 (RV-16, D-168): AN ASSESSMENT'S NAME, MADE IN ONE PLACE. An Uji Cepat has no title of its own: the database
 * stamps one at launch («Uji Cepat — 2026-11-02 20:26», part of a UNIQUE key, in one language, its date outside the
 * date helper), so every surface that names one names it from what it is and when it opened — «Uji Cepat · 2 Nov
 * 2026, 20.26 WIB» in the reader's language, the date through the one date helper — and adds no «Uji Cepat» of its own.
 * Every other assessment keeps the title its package gave it.
 */
export function judulAsesmen(a: { judul: string; mode: string; dibuka: string | null }, locale: Locale, zona?: string | null): string {
  if (a.mode !== "QUICK") return a.judul;
  const nama = t("jenis.mode.QUICK", "educator", { locale });
  // the owner's ruling (10 Nov): the moment it opened, on its school's clock when the caller knows the school
  const kapan = a.dibuka ? tanggal(a.dibuka, "cap", locale, zona) : "";
  return kapan ? `${nama} · ${kapan}` : nama;
}
