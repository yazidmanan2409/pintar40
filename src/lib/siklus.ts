/**
 * WHERE A LEARNER IS, AND WHAT THEY SHOULD DO NEXT.
 *
 * The Slice-2 home is not a dashboard. One panel carries the single most
 * appropriate next action and everything below it is quiet — which only works
 * if "most appropriate" is DERIVED rather than guessed from list order. This
 * module is that derivation, and it is deliberately pure: it takes the rows
 * the engine already returned and returns a position and a ranking. No client,
 * no fetch, no clock.
 *
 * Pure because it is the one piece of Slice 2 that can be wrong in a way
 * nobody sees. A misplaced dot on a trail is visible; a home that quietly
 * recommends the wrong thing looks exactly like a home that recommends the
 * right one. So it is a function over data, and UX1-S2-POSISI-01 drives it
 * through every state a cycle can be in without needing a database.
 *
 * NOTHING HERE DECIDES AUTHORITY. A position is a reading of state the server
 * already gave us; whether a learner may start an assessment is
 * `may_start_assessment()`'s answer and is asked separately, every time.
 */
import type { CycleState } from "@/lib/assessment-engine";
import type { AssignmentEntry, LessonEntry } from "@/lib/assessment-engine/types";

/** The five steps of one learning cycle, in the order they happen. */
export const LANGKAH = ["PEMETAAN", "PETA", "PELAJARAN", "PENGUASAAN", "HASIL"] as const;
export type Langkah = (typeof LANGKAH)[number];

/** The copy key for each step. The enum itself never reaches a screen. */
export const LANGKAH_KEY = {
  PEMETAAN: "cycle.step.pretest",
  PETA: "cycle.step.map",
  PELAJARAN: "cycle.step.lesson",
  PENGUASAAN: "cycle.step.posttest",
  HASIL: "cycle.step.result",
} as const;

export type Posisi = {
  langkah: Langkah;
  /** Index into LANGKAH: what the trail fills, rings and leaves hollow. */
  indeks: number;
  /** Lessons finished and lessons in the course, for the status line. */
  pelajaranSelesai: number;
  pelajaranTotal: number;
  /** True once the whole cycle is behind the learner. */
  selesai: boolean;
  /**
   * W2.12 (RV-7): whether this chapter has a Pemetaan Awal to take at all. A chapter without one still starts at
   * PEMETAAN (the Uji Penguasaan waits on it), but nothing may offer «Mulai Pemetaan Awal» for it: the offer led to a
   * refusal page. Optional so a position built elsewhere reads as "has one".
   */
  pemetaanAda?: boolean;
};

const FINAL = "FINALIZED";

/**
 * BOB-22. WHAT A SAVED POSITION MEANS: the number of pages the learner has
 * reached, 1 to N (0: never opened). The player shows pages counted from 0, so
 * the page on screen saves as its index + 1, a learner resumes on the page
 * before the count, and a lesson is read when the count reaches its total -- the
 * database's own rule too (lesson_progress_within_total: furthest <= total).
 * The player saved the index itself, so the last page of N saved N-1 and no
 * lesson ever counted as read. These three are the only places the meaning
 * lives; LessonPlayer uses the first two, every reader the third.
 */
export function posisiTersimpan(halaman: number): number {
  return Math.max(0, Math.floor(halaman)) + 1;
}

/** The page (counted from 0) a learner resumes on, from what was saved. */
export function halamanMulai(posisi: number, jumlahHalaman: number): number {
  const akhir = Math.max(0, jumlahHalaman - 1);
  return Math.min(akhir, Math.max(0, Math.floor(Number.isFinite(posisi) ? posisi : 0) - 1));
}

/**
 * BOB-23. WHETHER A PAGE ON SCREEN IS SAVED: only when it reaches beyond what
 * is already saved, and then as its count. `tersimpan` starts at the server's
 * `startAt` and follows every save. Idle, a re-render, or going back saves
 * nothing; each page newly reached saves once. The player ran its save on
 * every render instead, and each save re-rendered the page.
 */
export function perluDisimpan(halaman: number, tersimpan: number): number | null {
  const posisi = posisiTersimpan(halaman);
  return posisi > (Number.isFinite(tersimpan) ? tersimpan : 0) ? posisi : null;
}

/**
 * BOB-23 round 2. WHETHER A SAVE HAS JUST MADE THE LESSON READ: its result is
 * ok and the server's furthest count reaches the total. The page's closing
 * action (Uji Penguasaan, once every lesson is read) is decided when the page
 * renders, and a save no longer redraws the page -- so on exactly this save,
 * and no other, the player asks for one refresh. perluDisimpan already
 * guarantees the save is the one that crossed: it saves only beyond what was
 * saved.
 */
export function menjadiDibaca(hasil: { ok: boolean; furthest?: number } | null | undefined, total: number): boolean {
  return Boolean(hasil?.ok) && total > 0 && (hasil?.furthest ?? 0) >= total;
}

/**
 * W5. WHAT A SAVE LEAVES BEHIND. A save the server acknowledged raises what the
 * server holds (its own furthest count when it gives one); a save that failed
 * leaves it where it was, and the player's mark of what is saved returns there,
 * so the next page turn tries again instead of believing it was saved. Before
 * W5 the mark moved on before the answer came back and stayed there, so a lost
 * save of the last page left the lesson unread with nothing to try it again.
 */
export function setelahSimpan(
  hasil: { ok: boolean; furthest?: number } | null | undefined,
  posisi: number,
  kini: { diServer: number; tersimpan: number },
): { diServer: number; tersimpan: number } {
  if (!hasil?.ok) return { diServer: kini.diServer, tersimpan: kini.diServer };
  const f = Number.isFinite(hasil.furthest) ? (hasil.furthest as number) : posisi;
  const diServer = Math.max(kini.diServer, f);
  return { diServer, tersimpan: Math.max(kini.tersimpan, diServer) };
}

/** W5. «Posisi bacaan tersimpan.» is said of the page on screen only when the server holds it. */
export function posisiDiServer(halaman: number, diServer: number): boolean {
  return Number.isFinite(diServer) && diServer >= posisiTersimpan(halaman);
}

/** A lesson counts as read when the learner reached its last page. */
export function lessonRead(l: Pick<LessonEntry, "furthest_position" | "total_positions">): boolean {
  const total = l.total_positions ?? 0;
  return total > 0 && l.furthest_position >= total;
}

/**
 * Where this learner stands in one cycle.
 *
 * Read downwards: the first condition that holds wins, and they are ordered
 * from the end of the cycle backwards. That ordering is the whole trick — a
 * learner who has finished the Mastery Check is at the result even if they
 * never opened a single lesson, because the cycle is a record of what happened
 * and not a checklist somebody has to satisfy in order.
 */
export function posisi(state: CycleState, lessons: readonly LessonEntry[]): Posisi {
  const total = lessons.length;
  const read = lessons.filter(lessonRead).length;
  const base = { pelajaranSelesai: read, pelajaranTotal: total, pemetaanAda: Boolean(state.pre_assignment) };

  if (state.post_status === FINAL) {
    return { langkah: "HASIL", indeks: 4, ...base, selesai: true };
  }
  // A Mastery Check that is open, paused or submitted-but-unscored is still
  // the thing in front of the learner.
  if (state.post_session) {
    return { langkah: "PENGUASAAN", indeks: 3, ...base, selesai: false };
  }
  if (state.pre_status !== FINAL) {
    return { langkah: "PEMETAAN", indeks: 0, ...base, selesai: false };
  }
  // Mapping is done, so the reading map exists. Whether the learner is AT the
  // map or past it is the difference between having read nothing and having
  // read something.
  if (total > 0 && read >= total) {
    return { langkah: "PENGUASAAN", indeks: 3, ...base, selesai: false };
  }
  if (read > 0) {
    return { langkah: "PELAJARAN", indeks: 2, ...base, selesai: false };
  }
  return { langkah: "PETA", indeks: 1, ...base, selesai: false };
}

/**
 * The ranking behind "the one thing".
 *
 * THE ORDER IS YAZID'S RULING (D-088(d), W18): continue what the learner is
 * doing before asking them to begin something new. A running session first
 * (`peringkat` below); then the lesson they are reading (PELAJARAN), then a
 * chapter whose mapping is done and whose lessons wait (PETA); then the
 * Mastery Check of a chapter whose lessons are all read (PENGUASAAN); then the
 * next chapter's Pemetaan Awal (PEMETAAN). A finished cycle ranks last -- it is
 * not work, it is a result to collect. Until W18 an untaken Mastery Check led
 * and a new chapter's mapping came before unread lessons, so one chapter's
 * test displaced another chapter's reading merely because the test existed.
 *
 * Lower is more urgent, so the caller sorts ascending and takes the first.
 */
export const URUTAN: Record<Langkah, number> = {
  PELAJARAN: 0,
  PETA: 1,
  PENGUASAAN: 2,
  PEMETAAN: 3,
  HASIL: 4,
};

export type Kandidat = {
  tugas: AssignmentEntry;
  posisi: Posisi;
  /** True when a session for this step is already open or paused. */
  berjalan: boolean;
  /**
   * UX-40: a finished chapter whose result its learner has not opened yet (`my_new_results`). A new result is the
   * next step; once opened it is a card like any other finished chapter.
   */
  hasilBaru?: boolean;
};

/**
 * Rank the learner's assignments and hand back the one the home should lead
 * with, plus the rest in the same order.
 *
 * An assignment with a session ALREADY RUNNING jumps every other rank, whatever
 * step it belongs to: a learner who left a Mastery Check open mid-way has one
 * obvious next action and it is not a lesson in another subject.
 */
export function peringkat(kandidat: readonly Kandidat[]): {
  utama: Kandidat | null;
  sisa: Kandidat[];
} {
  const urut = [...kandidat].sort((a, b) => {
    if (a.berjalan !== b.berjalan) return a.berjalan ? -1 : 1;
    // UX-40: a result not yet seen comes straight after a session left open, ahead of beginning or continuing other work
    const ba = Boolean(a.hasilBaru && a.posisi.selesai), bb = Boolean(b.hasilBaru && b.posisi.selesai);
    if (ba !== bb) return ba ? -1 : 1;
    const d = URUTAN[a.posisi.langkah] - URUTAN[b.posisi.langkah];
    if (d !== 0) return d;
    // A stable tie-break that is not list position: the assignment closer to
    // finishing its lessons is the one with less left to do.
    const ra = a.posisi.pelajaranTotal > 0 ? a.posisi.pelajaranSelesai / a.posisi.pelajaranTotal : 0;
    const rb = b.posisi.pelajaranTotal > 0 ? b.posisi.pelajaranSelesai / b.posisi.pelajaranTotal : 0;
    if (ra !== rb) return rb - ra;
    return a.tugas.title.localeCompare(b.tugas.title);
  });
  // A cycle that is entirely behind the learner is never "the one thing": the
  // home would be telling somebody to go and look at something they finished.
  // UX-40: unless its result is NEW -- not yet opened -- and then opening it is the next step.
  // W2.12 (RV-7): a chapter waiting on a Pemetaan Awal that does not exist has nothing to start, so it leads only
  // when nothing else waits, and then the panel says why there is no button.
  const utama = urut.find((k) => (k.hasilBaru && k.posisi.selesai) || (!k.posisi.selesai && !tanpaPemetaan(k.posisi)))
    ?? urut.find((k) => !k.posisi.selesai) ?? null;
  return { utama, sisa: urut.filter((k) => k !== utama) };
}

/**
 * W2.12 (RV-7): A STEP WITH NOTHING BEHIND IT. The chapter waits on a Pemetaan Awal that does not exist, so there is
 * nothing to start: no button offers it, it never leads the home while real work waits, and its status line says
 * plainly that the Pemetaan Awal is not ready yet and whom to ask.
 */
export function tanpaPemetaan(p: Posisi): boolean {
  return p.langkah === "PEMETAAN" && p.pemetaanAda === false;
}

/** The status line under a trail: which step, and how far through it. */
export function statusKey(p: Posisi): string {
  if (tanpaPemetaan(p)) return "cycle.pemetaan.belum_ada";
  switch (p.langkah) {
    case "PEMETAAN": return "siklus.di.pemetaan";
    case "PETA": return "siklus.di.peta";
    case "PELAJARAN": return "siklus.di.pelajaran";
    case "PENGUASAAN": return "siklus.di.penguasaan";
    case "HASIL": return "siklus.di.hasil";
  }
}

/**
 * D-085 M3 (W4), with the school's sealed mark (D-088(b), BOB-49): COMPLETION AND MASTERY ARE TWO TRUTHS. A finished
 * Uji Penguasaan is completion; whether the mastery target was met is the session's own verdict (`session_outcome.lulus`,
 * from the mark sealed on the attempt). Null when there is no verdict to tell: a Pemetaan Awal, or no mark sealed.
 */
export type Ketuntasan = "TERCAPAI" | "BELUM";

export function ketuntasan(o: { diagnostik?: boolean | null; lulus?: boolean | null } | null | undefined): Ketuntasan | null {
  if (!o || o.diagnostik !== false || typeof o.lulus !== "boolean") return null;
  return o.lulus ? "TERCAPAI" : "BELUM";
}

/** A part below the target, and the lesson to read again for it (when the reading map names one). */
export type BagianUlang = { kode: string; nama: string; penguasaan: number; lessonId: string | null; pelajaran: string | null };

/**
 * M3: below target, PINTAR points at what to review. The objectives whose own mastery is under the sealed mark, lowest
 * first, each with its name and the lesson the reading map ties it to. Pure; nothing is invented: an objective the map
 * does not name keeps its code and no lesson.
 */
export function bagianUlang(
  perDomain: Record<string, { penguasaan: number } | undefined> | null | undefined,
  ambang: number | null | undefined,
  peta: ReadonlyArray<{ kode: string; pernyataan: string; pelajaran: string }>,
  lessons: ReadonlyArray<{ lesson_id: string; judul: string }>,
): BagianUlang[] {
  if (ambang == null || !perDomain) return [];
  const kartu = new Map(peta.map((k) => [k.kode, k]));
  const idPelajaran = new Map(lessons.map((l) => [l.judul, l.lesson_id]));
  return Object.entries(perDomain)
    .filter(([, v]) => v && typeof v.penguasaan === "number" && v.penguasaan < ambang)
    .map(([kode, v]) => {
      const k = kartu.get(kode);
      return {
        kode,
        nama: k?.pernyataan || kode,
        penguasaan: (v as { penguasaan: number }).penguasaan,
        lessonId: k ? idPelajaran.get(k.pelajaran) ?? null : null,
        pelajaran: k?.pelajaran ?? null,
      };
    })
    .sort((a, b) => a.penguasaan - b.penguasaan || a.kode.localeCompare(b.kode));
}
