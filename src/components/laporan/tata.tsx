import { t, type HleEvent, type Locale, type Persona } from "@/lib/hle";

/**
 * THE REPORTS' SHARED GRAMMAR (CONTOH LAPORAN; Daisy's fidelity check KESETIAAN.md, 7 Nov).
 *
 * daftarKata (#1): a list said as a sentence says it — «A dan B», «A, B, dan C» — and «serta» before the last item
 * when a name already holds «dan» («Penjumlahan dan pengurangan pecahan serta Pecahan campuran»). The specimens' own
 * helper; English «and».
 *
 * JudulBagian (#4, #4b): every section's heading is the same — the letter and the title, outside any card, 22/28 600 —
 * and the letter is READ, not hidden: a screen reader hears «Bagian C, Kenaikan» (G-02).
 */
export function daftarKata(xs: readonly string[], locale: Locale): string {
  const isi = xs.filter((x) => x.trim() !== "");
  if (isi.length <= 1) return isi.join("");
  const dan = locale === "en" ? "and" : "dan";
  const sambung = locale !== "en" && isi.some((x) => / dan /.test(x)) ? "serta" : dan;
  return `${isi.slice(0, -1).join(", ")} ${sambung} ${isi[isi.length - 1]}`;
}

export function JudulBagian({ huruf, judul, id, persona = "staff", locale }: {
  huruf: string; judul: string; id?: string; persona?: Persona; locale: Locale;
}) {
  return (
    <h2 className="pin-lk-h" id={id}>
      <span className="pin-lk-huruf"><span className="pin-sr">{t("laporan.bagian" as HleEvent, persona, { locale })} </span>{huruf}</span>
      <span>{judul}</span>
    </h2>
  );
}
