import "server-only";
import { namaBab } from "@/lib/nama-bab";
import * as engine from "@/lib/assessment-engine";
import { bagianUlang, ketuntasan, type Ketuntasan } from "@/lib/siklus";
import { namaTujuan } from "@/components/siklus/PerTujuan";

/**
 * D-195(1), CONTOH LAPORAN 1-murid: EVERY CHAPTER A LEARNER HAS WORKED ON, SIDE BY SIDE, FROM THEIR OWN RESULTS.
 *
 * Nothing new is read and nothing is computed that a chapter's own result page (/belajar/[tugas]/hasil) does not
 * already show: per assignment, the same engine reads in the same caller's session — the cycle state, the Uji
 * Penguasaan's outcome (its mastery, the mark sealed on it, per objective), the review's count of right answers, the
 * Pemetaan Awal → Uji Penguasaan comparison, the reading map's names and the lessons. The verdict is the session's own
 * (ketuntasan, D-088(b)); the parts to study again are bagianUlang's. Only the caller's own work: no class figure, no
 * peer, no rank. A chapter whose reads fail is shown as not finished rather than guessed.
 */
export type BagianBab = { kode: string; nama: string; benar: number; total: number; ulang: boolean };

export type BabHasil = {
  tugas: string;
  judul: string;
  keadaan: "SELESAI" | "BERJALAN";
  /** Pemetaan Awal and Uji Penguasaan mastery, when each is finished (the comparison's own figures). */
  awal: number | null;
  akhir: number | null;
  /** The mark sealed on the Uji Penguasaan; null: none sealed. */
  ambang: number | null;
  tercapai: Ketuntasan | null;
  benar: number;
  total: number;
  bagian: BagianBab[];
  /** The parts below the target, by name, lowest first (bagianUlang). */
  ulang: string[];
};

export async function hasilBelajar(db: engine.EngineClient): Promise<BabHasil[]> {
  const tugas = await engine.myAssignments(db);
  const bab = await Promise.all(tugas.map(async (a): Promise<BabHasil | null> => {
    // Reporting Quality Gate (9 Nov): a title that already begins with its subject («Matematika Kelas 5 · Bab 1») is not
    // prefixed with it again («Matematika · Matematika Kelas 5 · Bab 1»)
    const judul = namaBab(a.subject, a.title);
    const state = await engine.cycleState(db, a.learning_assignment_id).catch(() => null);
    if (!state) return null;
    const mulai = Boolean(state.pre_session || state.post_session);
    if (!state.post_session || state.post_status !== "FINALIZED") {
      return mulai ? { tugas: a.learning_assignment_id, judul, keadaan: "BERJALAN", awal: null, akhir: null, ambang: null, tercapai: null, benar: 0, total: 0, bagian: [], ulang: [] } : null;
    }
    const [outcome, review, delta, peta, pelajaran] = await Promise.all([
      engine.outcome(db, state.post_session).catch(() => null),
      engine.review(db, state.post_session).catch(() => []),
      engine.delta(db, a.learning_assignment_id).catch(() => null),
      engine.readingMap(db, state.post_session).catch(() => []),
      engine.lessons(db, a.learning_assignment_id).catch(() => []),
    ]);
    if (!outcome) return { tugas: a.learning_assignment_id, judul, keadaan: "BERJALAN", awal: null, akhir: null, ambang: null, tercapai: null, benar: 0, total: 0, bagian: [], ulang: [] };
    const tercapai = ketuntasan(outcome);
    const ulang = tercapai === "BELUM" ? bagianUlang(outcome.per_domain, outcome.ambang, peta, pelajaran) : [];
    const kodeUlang = new Set(ulang.map((u) => u.kode));
    const nama = namaTujuan(peta);
    return {
      tugas: a.learning_assignment_id,
      judul,
      keadaan: "SELESAI",
      awal: delta?.status === "LENGKAP" ? delta.awal : null,
      akhir: outcome.penguasaan,
      ambang: outcome.ambang ?? null,
      tercapai,
      benar: review.filter((r) => r.benar === true).length,
      total: review.length,
      bagian: Object.entries(outcome.per_domain ?? {}).map(([kode, d]) => ({
        kode, nama: nama.get(kode) ?? kode, benar: d.benar, total: d.total, ulang: kodeUlang.has(kode),
      })),
      ulang: ulang.map((u) => u.nama),
    };
  }));
  return bab.filter((b): b is BabHasil => b !== null);
}
