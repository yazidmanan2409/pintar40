/**
 * D-088(k) (Yazid, 2 Oct; D-085 M5) — WHICH QUESTIONS THE CLASS FOUND HARD, AND
 * WHO MAY NEED HELP. TEACHING EVIDENCE, NOT SURVEILLANCE.
 *
 * `teacher_question_evidence` (supabase/migrations/20261101100000) answers the
 * class's teacher, and only from sittings already handed in: per question how
 * many answered and how many were right, with its options and key; per learner
 * the option they submitted. This module reads it and orders it the way a
 * teacher uses it: the question fewest answered rightly first, the count of
 * learners on each option, and the names of those who did not answer it
 * rightly — nothing about time, devices, integrity or Question Health, which
 * the read never returns.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = any;

/** is_key: the key in force (C1w F-1, O41-21); was_key, only where the question's key was corrected: the sealed key. */
export type OpsiSoal = { label: string; body: string; is_key: boolean; was_key?: boolean };
export type SoalKelas = {
  item_id: string; stem: string; stimulus: string | null; options: OpsiSoal[];
  presented: number; answered: number; right: number;
  /** the question's key in force is not its sealed key (a governed correction) */
  key_corrected?: boolean;
};
export type JawabanMurid = { item_id: string; chosen: string | null; right: boolean };
export type MuridKelas = { person_id: string; name: string; answers: JawabanMurid[] };
export type BuktiSoal = { sittings: number; questions: SoalKelas[]; learners: MuridKelas[] };

export type SoalTersusun = {
  soal: SoalKelas;
  /** learners on each option, by label */
  pilihan: Record<string, number>;
  /** who did not answer it rightly, by name: the option they chose, or null when they left it */
  perluBantuan: Array<{ nama: string; pilihan: string | null }>;
};

/** The class's handed-in evidence for one assessment, or null when the reader is not its teacher. */
export async function buktiSoal(c: Db, penugasan: string, kelas: string): Promise<BuktiSoal | null> {
  const { data, error } = await c.rpc("teacher_question_evidence", { p_assignment: penugasan, p_class: kelas });
  if (error || !data) return null;
  return data as BuktiSoal;
}

/**
 * The questions as a teacher reads them: the smallest share answered rightly first (ties keep the
 * assessment's own order); each with how many learners chose each option and who did not answer it
 * rightly. Pure, so it is tested without a database.
 */
export function susunBuktiSoal(b: BuktiSoal): SoalTersusun[] {
  const bagian = (q: SoalKelas) => (q.presented > 0 ? q.right / q.presented : 1);
  return b.questions
    .map((soal, i) => {
      const pilihan: Record<string, number> = {};
      const perluBantuan: Array<{ nama: string; pilihan: string | null }> = [];
      for (const m of b.learners) {
        const j = m.answers.find((a) => a.item_id === soal.item_id);
        if (!j) continue;
        if (j.chosen) pilihan[j.chosen] = (pilihan[j.chosen] ?? 0) + 1;
        if (!j.right) perluBantuan.push({ nama: m.name, pilihan: j.chosen });
      }
      perluBantuan.sort((x, y) => x.nama.localeCompare(y.nama, "id"));
      return { soal, pilihan, perluBantuan, i };
    })
    .sort((x, y) => bagian(x.soal) - bagian(y.soal) || x.i - y.i)
    .map(({ soal, pilihan, perluBantuan }) => ({ soal, pilihan, perluBantuan }));
}
