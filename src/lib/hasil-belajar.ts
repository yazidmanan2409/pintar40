import "server-only";
import { namaBab } from "@/lib/nama-bab";
import * as engine from "@/lib/assessment-engine";
import { alasanBelum, bagianUlang, hitunganSegel, ketuntasan, type Ketuntasan } from "@/lib/siklus";
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
  /** DITUTUP_AWAL (Daisy, 435a2856 §2.1): the lesson closed after a finished Tes awal and before its Uji Penguasaan */
  keadaan: "SELESAI" | "BERJALAN" | "DITUTUP_AWAL";
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
  /** owner ruling (10 Nov): the assignment was withdrawn; the result is kept and not counted in class figures */
  ditarik?: boolean;
  /** Z V2 (R-22): a retake of this Uji Penguasaan is open; the result shown is the earlier, finished one */
  ulangBerjalan?: boolean;
  /** D14: the result shown was recalculated after it was sealed; the summary says so, as the chapter page does */
  dihitungUlang?: boolean;
  /** Z (Daisy's Z3-A C-1): «belum mencapai target» because a must-be-right question was missed, the figure meeting the mark */
  gerbang?: boolean;
  /** D2-R (R-h): a certifying result (the sitting's captured purpose): «Lulus» / «Belum lulus», counts only, no parts */
  bersertifikasi?: boolean;
};

/**
 * Daisy (bcecb425, B3): whether the learner has a result in a lesson that is no longer assigned (ended, withdrawn, or
 * of a Kelas they left), read from the same history Hasil Belajar reads. /belajar asks this only when no assigned
 * lesson has a result, so a learner whose lessons have all closed still has the way to their results.
 */
export async function adaHasilTertutup(db: engine.EngineClient, aktif: Set<string>): Promise<boolean> {
  const tugas = await engine.myLearningHistory(db).catch(() => []);
  for (const a of tugas) {
    if (aktif.has(a.learning_assignment_id)) continue;
    const state = await engine.cycleState(db, a.learning_assignment_id).catch(() => null);
    if (state && ((state.post_session && state.post_status === "FINALIZED") || (state.pre_session && state.pre_status === "FINALIZED"))) return true;
  }
  return false;
}

export async function hasilBelajar(db: engine.EngineClient): Promise<BabHasil[]> {
  // B2 (Sharon's change 3): WHICH chapters are shown, in which state and from which sittings, is the database's one read
  // (hasil_belajar_sesi_saya), the same one a print's record is made from; the titles are the learner's history's.
  // defect (10 Nov), kept by that read: a closed lesson's outcome stays seen; an unfinished one of a closed lesson is no
  // longer «in progress», but a finished Tes awal stays as one quiet row (Daisy, 435a2856 §2.1)
  const [tugas, tampil] = await Promise.all([engine.myLearningHistory(db), engine.myResultsShown(db)]);
  const perTugas = new Map(tugas.map((a) => [a.learning_assignment_id, a]));
  const bab = await Promise.all(tampil.map(async (t): Promise<BabHasil | null> => {
    const a = perTugas.get(t.learning_assignment_id);
    if (!a) return null;
    // Reporting Quality Gate (9 Nov): a title that already begins with its subject («Matematika Kelas 5 · Bab 1») is not
    // prefixed with it again («Matematika · Matematika Kelas 5 · Bab 1»)
    const judul = namaBab(a.subject, a.title);
    const berjalan: BabHasil = { tugas: a.learning_assignment_id, judul, keadaan: "BERJALAN", awal: null, akhir: null, ambang: null, tercapai: null, benar: 0, total: 0, bagian: [], ulang: [] };
    if (t.keadaan === "BERJALAN") return berjalan;
    if (t.keadaan === "DITUTUP_AWAL") {
      if (!t.pre_session) return null;
      const awal = await engine.outcome(db, t.pre_session).catch(() => null);
      if (!awal || awal.penguasaan === null || awal.penguasaan === undefined) return null;
      return { tugas: a.learning_assignment_id, judul, keadaan: "DITUTUP_AWAL", awal: awal.penguasaan, akhir: null, ambang: null,
               tercapai: null, benar: 0, total: 0, bagian: [], ulang: [], ...(a.status === "WITHDRAWN" ? { ditarik: true } : {}) };
    }
    if (!t.post_session) return null;
    // D2-R (R-h): the outcome first; a certifying result's review is never asked for (the database refuses it too)
    const outcome = await engine.outcome(db, t.post_session).catch(() => null);
    const bersertifikasi = outcome?.bersertifikasi === true;
    const tanpaTinjauan: Awaited<ReturnType<typeof engine.review>> = [];
    const [review, delta, peta, pelajaran, dihitungUlang] = await Promise.all([
      bersertifikasi ? Promise.resolve(tanpaTinjauan) : engine.review(db, t.post_session).catch(() => tanpaTinjauan),
      engine.delta(db, a.learning_assignment_id).catch(() => null),
      engine.readingMap(db, t.post_session).catch(() => []),
      engine.lessons(db, a.learning_assignment_id).catch(() => []),
      // D14: as the chapter page asks it; a failed read claims nothing
      engine.sesiDihitungUlang(db, t.post_session).catch(() => false),
    ]);
    if (!outcome) return berjalan;
    const tercapai = ketuntasan(outcome);
    // Z K-01: the missed must-be-right question's objectives are what to study again too (as the chapter page lists them)
    // D2-R (R-h, 74b): a certifying result names what to read again from its own list, with no figure
    const ulang = tercapai !== "BELUM" ? []
      : bersertifikasi ? bagianUlang(null, null, peta, pelajaran, outcome.tujuan_gerbang_kode ?? [], outcome.tujuan_ulang ?? [])
      : bagianUlang(outcome.per_domain, outcome.ambang, peta, pelajaran, outcome.tujuan_gerbang_kode ?? []);
    const kodeUlang = new Set(ulang.map((u) => u.kode));
    const nama = namaTujuan(peta);
    return {
      tugas: a.learning_assignment_id,
      judul,
      keadaan: "SELESAI",
      ditarik: a.status === "WITHDRAWN",
      awal: delta?.status === "LENGKAP" ? delta.awal : null,
      akhir: outcome.penguasaan,
      ambang: outcome.ambang ?? null,
      tercapai,
      // Daisy's B3: the sealed result's own count, as the chapter page says it
      benar: hitunganSegel(outcome.ringkasan, review).benar,
      total: hitunganSegel(outcome.ringkasan, review).total,
      // D2-R (R-h): a certifying result's sections carry no figure, so its parts are not drawn as counts
      bagian: bersertifikasi ? [] : Object.entries(outcome.per_domain ?? {}).map(([kode, d]) => ({
        kode, nama: nama.get(kode) ?? kode, benar: d.benar ?? 0, total: d.total ?? 0, ulang: kodeUlang.has(kode),
      })),
      ulang: ulang.map((u) => u.nama),
      ...(t.ulang_berjalan === true ? { ulangBerjalan: true } : {}),
      // Daisy's Z3-A C-1: the gate case says why, after the figures (alasanBelum, the chapter page's own reason)
      ...(alasanBelum(outcome) === "GERBANG" ? { gerbang: true } : {}),
      // a governed correction is marked as such on the chapter page (dikoreksi), not as a recalculation
      ...(dihitungUlang === true && !outcome.dikoreksi ? { dihitungUlang: true } : {}),
      ...(bersertifikasi ? { bersertifikasi: true } : {}),
    };
  }));
  // the learner's history's order, as before
  const urutan = new Map(tugas.map((a, i) => [a.learning_assignment_id, i]));
  return bab.filter((b): b is BabHasil => b !== null).sort((x, y) => (urutan.get(x.tugas) ?? 0) - (urutan.get(y.tugas) ?? 0));
}
