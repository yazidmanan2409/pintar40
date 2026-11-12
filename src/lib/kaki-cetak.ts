import { t, type HleEvent, type Locale, type Persona } from "@/lib/hle";
import type { KataKaki } from "@/components/laporan/AksiLaporan";

/** Daisy's B2-R-A1 line, split around its {pilih}: the chooser's own name is the link. */
function bagi(kalimat: string, tautan: string): { sebelum: string; tautan: string; sesudah: string } {
  const i = kalimat.indexOf("{pilih}");
  return i < 0 ? { sebelum: kalimat, tautan: "", sesudah: "" } : { sebelum: kalimat.slice(0, i), tautan, sesudah: kalimat.slice(i + "{pilih}".length) };
}

/** B2: the footer's words and the print's result lines, in the page's language and persona, for AksiLaporan. */
export function kataKaki(locale: Locale, persona: Persona): KataKaki {
  const s = (k: HleEvent) => t(k, persona, { locale });
  return {
    resmi: s("laporan.cetak.kaki.resmi"), peramban: s("laporan.cetak.kaki.peramban"), pendek: s("laporan.cetak.kaki.pendek"),
    gagal: s("laporan.cetak.gagal"), ditolak: s("laporan.cetak.ditolak"),
    ditolakKonteks: bagi(s("laporan.cetak.ditolak.konteks"), s("entry.title")),
    locale: locale === "en" ? "en" : "id",
  };
}
