import { format, t, type Locale } from "@/lib/hle";

/**
 * OWNER DECISIONS E1 AND D14 (9 Nov): THE TEACHER'S NOTE ON A RECALCULATED SITTING, BESIDE THE FIGURE IT EXPLAINS.
 *
 * A sitting recalculated after it was sealed has two figures: the latest, which every report reads, and the sealed
 * original, which the certificate and the learner's own result page keep. The note sits directly under the figure the
 * teacher reads, says both, and gives the reason the recalculation was recorded with. It says nothing when the two
 * figures agree: a recalculation that changed nothing has nothing to explain.
 *
 * Pure (no data access), so a test renders exactly what the page shows.
 */
export default function CatatanHitungUlang({ baru, asli, alasan, locale = "id" }: {
  baru: number | null;
  asli: number | null | undefined;
  alasan?: string | null;
  locale?: Locale;
}) {
  if (baru === null || asli === null || asli === undefined || asli === baru) return null;
  const s = (k: Parameters<typeof t>[0]) => t(k, "educator", { locale });
  const sebab = typeof alasan === "string" && alasan.trim() !== "" ? alasan.trim() : null;
  return (
    <small className="pin-meta pin-hitung-ulang" data-dihitung-ulang="">
      {s("mengajar.murid1.dihitung_ulang").replace("{baru}", format.percent(baru, locale)).replace("{asli}", format.percent(asli, locale))}
      {sebab ? <> {s("mengajar.murid1.dihitung_ulang_alasan").replace("{alasan}", sebab)}</> : null}
    </small>
  );
}
