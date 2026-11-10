import type { HleEvent } from "@/lib/hle";

/**
 * WHAT WILL MAKE AN ABSENT FIGURE APPEAR (DAISY-07, audit B6).
 *
 * An absence card already says WHY a figure is not there -- nothing
 * qualifying yet, or not enough -- and how far along it is (have/needed). A
 * head of department reading "Belum cukup data" still had to guess what would
 * change that. This names, per metric, the evidence its calculator counts, so
 * the card can say what will make the figure appear:
 *
 *   penilaian    any official assessment a student finishes (participants)
 *   akhir        the Cek penguasaan (POST_TEST) results
 *   awal_akhir   students who finished both the Pemetaan awal and the Cek
 *                penguasaan (gain is the difference, so only both count)
 *   miskonsepsi  wrong answers sharing a misconception code
 *   sertifikat   the school's issued certificates
 *
 * THE MAP IS READ FROM THE CALCULATORS, NOT WRITTEN FROM MEMORY. A guard reads
 * each calculator's body in the migrations and fails if its source (the
 * assessment modes it filters on, or the table it counts) disagrees with the
 * kind named here, and fails if a class or school metric in the catalogue has
 * no entry. Item metrics are not shown to management and have none.
 *
 * Pure: KartuKetiadaan and the summary pages read it.
 */
export type Syarat = "penilaian" | "akhir" | "awal_akhir" | "miskonsepsi" | "sertifikat";

export const SYARAT_METRIK: Readonly<Record<string, Syarat>> = {
  "class.participants": "penilaian",
  "class.comprehension": "akhir",
  "class.net_gain": "awal_akhir",
  "class.readiness_distribution": "akhir",
  "class.topic_mastery": "akhir",
  "class.misconceptions": "miskonsepsi",
  "institution.participants": "penilaian",
  "institution.net_gain": "awal_akhir",
  "institution.safety_gate_pass_rate": "akhir",
  "institution.cohort_comparison": "akhir",
  "institution.competency_outcomes": "akhir",
  "institution.verified_credentials": "sertifikat",
};

/**
 * The sentence saying what will make this figure appear, for a figure that is
 * short of evidence (`below_minimum`), or null: a refusal, a retired measure
 * or a figure PINTAR could not compute is not waiting on students.
 */
export function kunciMuncul(e: { status: string; metric_id?: string; withheld?: { reason: string } }): HleEvent | null {
  if (e.status !== "below_minimum" || !e.metric_id) return null;
  // owner decision 7, Daisy's A7 (9 Nov): a WITHHELD figure (a small part, or D12's «not applicable») is explained once,
  // by its own sentence, with its actual reason; no second «it will appear when…» line, no pointer to another section
  if (e.withheld) return null;
  // Daisy (20302e39): the gate appears only once enough students sit a check WITH required questions; more sittings of
  // checks without them never make it appear, so its line says so (its evidence kind stays «akhir»)
  if (e.metric_id === "institution.safety_gate_pass_rate") return "laporan.muncul.gerbang";
  const syarat = SYARAT_METRIK[e.metric_id];
  return syarat ? (`laporan.muncul.${syarat}` as HleEvent) : null;
}
