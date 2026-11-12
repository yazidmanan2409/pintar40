import { t, type HleEvent, type Locale, type Persona } from "@/lib/hle";
import type { KataKaki } from "@/components/laporan/AksiLaporan";

/** B2: the footer's words and the print's result lines, in the page's language and persona, for AksiLaporan. */
export function kataKaki(locale: Locale, persona: Persona): KataKaki {
  const s = (k: HleEvent) => t(k, persona, { locale });
  return {
    resmi: s("laporan.cetak.kaki.resmi"), peramban: s("laporan.cetak.kaki.peramban"), pendek: s("laporan.cetak.kaki.pendek"),
    gagal: s("laporan.cetak.gagal"), ditolak: s("laporan.cetak.ditolak"), locale: locale === "en" ? "en" : "id",
  };
}
