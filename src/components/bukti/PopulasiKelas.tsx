import { format, t, type HleEvent, type Locale } from "@/lib/hle";
import type { Populasi } from "./types";

/**
 * CR-81 (D-123(3)): THE CLASS'S POPULATION, SAID APART FROM ITS BANDS.
 *
 * «"Belum mengerjakan" belongs to class/readiness population reporting, never to the performance distribution
 * denominator.» The bands are drawn over the assessed alone; this line says how many learners the class has, how
 * many have sat the Uji Penguasaan and how many have not, and it is said whether or not the bands may be shown yet.
 * Counts only: nobody is named and no performance is implied. The presentation is Daisy's (S6).
 */
export default function PopulasiKelas({ populasi, locale = "id", entri }: { populasi?: Populasi | null; locale?: Locale; entri?: string }) {
  if (!populasi) return null;
  const s = (k: string) => t(k as HleEvent, "educator", { locale });
  const n = (x: number) => format.number(Number(x) || 0, locale);
  return (
    // entri: where a report draws its participants figure as this line, the figure's label (data-lk-entri)
    <p className="pin-meta" data-lk-entri={entri || undefined}>
      {n(populasi.placed)} {s("kesiapan.populasi.murid")} · {n(populasi.assessed)} {s("kesiapan.populasi.sudah")} ·{" "}
      {n(populasi.not_yet)} {s("kesiapan.populasi.belum")}
    </p>
  );
}
