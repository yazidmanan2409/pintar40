/**
 * W2.4 (CR-27, J5.6; D-120 Q8) · THE UJI CEPAT SCORE, FOR THE CLASS'S TEACHER: THE CLASS FIRST, EACH LEARNER BELOW.
 *
 * The owner ruled both, on the teacher's Uji Cepat result only: the class figure and each learner's score. Daisy's
 * grammar (11-validation.md §3, CR-27): «The class figure in `t-stat` with its base («18 dari 31»); the learners in a
 * Table one step below it».
 *
 * NOTHING IS SCORED HERE. A learner's score is the official result the catalogue gives this reader (`learner.result`
 * through `metric_evaluate`, which authorizes the teacher over that learner): the mastery recorded for that sitting,
 * the same figure the learner was told. A score the evaluator does not give (refused, not yet recorded, a sitting
 * still being finished) is no score: the row says so, and it is not in the class figure, so the class figure can
 * never carry a number the evaluator withheld.
 *
 * THE CLASS FIGURE is the mean of the scores shown beneath it, and it always carries its base: how many were scored,
 * of how many are in the class now (M9: a learner who has moved away is in neither). With no score yet there is no
 * figure, never a zero standing in for one.
 *
 * Pure, so a test drives exactly what the page shows.
 */

/** The same three states «Siapa yang sudah mengumpulkan» lists (pisahSiapa). */
export type KeadaanHasil = "sudah" | "sedang" | "belum";

export type BarisHasilMurid = {
  id: string;
  nama: string;
  keadaan: KeadaanHasil;
  /** The official score of the sitting (0..1), only as the evaluator gave it; null when there is none to show. */
  nilai: number | null;
};

export type HasilUjiCepat = {
  kelas: {
    /** The mean of the scores shown (0..1); null when no learner has one. */
    nilai: number | null;
    /** How many learners' scores make it. */
    dinilai: number;
    /** How many learners are in the class now. */
    terdaftar: number;
  };
  /** Every learner of the class now, in the roster's order. */
  murid: BarisHasilMurid[];
};

export type SesiHasil = { id: string; person_id: string; status: string };

const DIKUMPULKAN = new Set(["SUBMITTED", "FINALIZED"]);

/**
 * The page's figures from what was read.
 *
 * @param roster   the class now, in the order it is listed
 * @param sesi     every sitting of this Uji Cepat, oldest first (the latest scored sitting is the learner's score)
 * @param nilai    the score of each sitting the evaluator gave this reader, by sitting id; nothing else
 */
export function susunHasilUjiCepat(
  roster: ReadonlyArray<{ id: string; nama: string }>,
  sesi: readonly SesiHasil[],
  nilai: ReadonlyMap<string, number | null>,
): HasilUjiCepat {
  const murid = roster.map((m): BarisHasilMurid => {
    const milik = sesi.filter((x) => x.person_id === m.id);
    const keadaan: KeadaanHasil = milik.some((x) => DIKUMPULKAN.has(x.status)) ? "sudah" : milik.length > 0 ? "sedang" : "belum";
    let skor: number | null = null;
    for (const x of milik) {
      const v = nilai.get(x.id);
      if (DIKUMPULKAN.has(x.status) && typeof v === "number" && Number.isFinite(v)) skor = v;
    }
    return { id: m.id, nama: m.nama, keadaan, nilai: keadaan === "sudah" ? skor : null };
  });
  const ada = murid.map((m) => m.nilai).filter((v): v is number => v !== null);
  return {
    kelas: {
      nilai: ada.length === 0 ? null : ada.reduce((a, b) => a + b, 0) / ada.length,
      dinilai: ada.length,
      terdaftar: roster.length,
    },
    murid,
  };
}
