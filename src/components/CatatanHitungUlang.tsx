import { format, t, type Locale } from "@/lib/hle";

/** The prefix tegaskan_koreksi_kunci writes before a governed correction's reason (recomputation_reason). */
export const AWALAN_KOREKSI = "KOREKSI_KUNCI: ";

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
  const mentah = typeof alasan === "string" && alasan.trim() !== "" ? alasan.trim() : null;
  // C1w (O41-21, O41-22): a governed key correction records its reason under the KOREKSI_KUNCI prefix. The teacher reads
  // Daisy's reason «Kunci jawaban satu soal diperbaiki» and the correction's own words, never the prefix; and the
  // corrected result is the learner's too, so the note says that rather than D14's «the original stays theirs»
  const dikoreksi = mentah !== null && mentah.startsWith(AWALAN_KOREKSI);
  const sebab = dikoreksi ? mentah.slice(AWALAN_KOREKSI.length).trim() : mentah;
  return (
    <small className="pin-meta pin-hitung-ulang" data-dihitung-ulang="" data-dikoreksi={dikoreksi ? "" : undefined}>
      {s(dikoreksi ? "mengajar.murid1.dikoreksi" : "mengajar.murid1.dihitung_ulang")
        .replace("{baru}", format.percent(baru, locale)).replace("{asli}", format.percent(asli, locale))}
      {sebab ? <> {s(dikoreksi ? "mengajar.murid1.dikoreksi_alasan" : "mengajar.murid1.dihitung_ulang_alasan").replace("{alasan}", sebab)}</> : null}
    </small>
  );
}
