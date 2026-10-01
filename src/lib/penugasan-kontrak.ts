/**
 * BOB-04 — ASSIGNING A LESSON'S CONTRACT (D-008, audit B4). Pure: no database,
 * no React, no server.
 *
 * ONE STEP. `sediakanMateri` (src/app/mengajar/actions.ts) calls
 * assign_release(release, class, from, until), which makes the learning
 * assignment and both assessment assignments of the cycle -- Pemetaan awal
 * and Cek penguasaan, open for the same window -- in one transaction, or
 * refuses with one of the codes below and makes nothing. The teacher reads the
 * code's sentence on the page they chose the lesson from.
 *
 * WHAT A LESSON NEEDS. An approved PRE_TEST and POST_TEST definition in its
 * course (made from the questions marked "Pemetaan awal" and "Cek penguasaan"
 * when a lesson package is confirmed, BOB-02/BOB-04), enough questions for
 * each, and a post-test that can be drawn apart from the pre-test and its
 * parallel questions (INV-24).
 *
 * THE LEARNER. /belajar/[tugas]/pemetaan and /penguasaan never answer 404: a
 * lesson whose test is not there shows `cycle.pemetaan.belum_ada` or
 * `cycle.penguasaan.belum_ada`, and an assignment that is not the reader's
 * shows the one refusal page (HalamanPenolakan), as every other refusal does.
 */
import type { HleEvent } from "./hle";

/** Every code assign_release raises with SQLSTATE PR050 (code in DETAIL). */
export const KODE_PENUGASAN_DB = [
  "ASSIGN_NOT_ALLOWED",
  "ASSIGN_CLASS_INVALID",
  "ASSIGN_RELEASE_NOT_PUBLISHED",
  "ASSIGN_WINDOW_INVALID",
  "ASSIGN_EXISTS",
  "ASSIGN_PRE_TEST_MISSING",
  "ASSIGN_POST_TEST_MISSING",
  "ASSIGN_PRE_TEST_TOO_SHORT",
  "ASSIGN_POST_TEST_TOO_SHORT",
  "ASSIGN_CYCLE_OVERLAP",
  // D-088(b): raised by the assignment's seal (assessment_assignments_the_pass_mark_is_sealed), same SQLSTATE and DETAIL
  "ASSIGN_PASS_MARK_MISSING",
] as const;

/**
 * Every code the assign action can return: the database's, plus
 * `ASSIGN_INPUT_INVALID` (the class or lesson was missing, nothing was sent)
 * and `ASSIGN_FAILED` (anything else; a short reference goes to the server log).
 */
export type KodePenugasan = (typeof KODE_PENUGASAN_DB)[number] | "ASSIGN_INPUT_INVALID" | "ASSIGN_FAILED";

export type HasilPenugasan =
  | { ok: true; learningAssignment: string; preAssignment: string; postAssignment: string }
  | { ok: false; code: KodePenugasan; ref?: string };

/** A database error as an assignment code: PR050 with a known DETAIL, else ASSIGN_FAILED. */
export function kodeGalatPenugasan(e: { code?: string | null; details?: string | null } | null | undefined): KodePenugasan {
  if (e?.code === "PR050" && typeof e.details === "string"
      && (KODE_PENUGASAN_DB as readonly string[]).includes(e.details)) {
    return e.details as KodePenugasan;
  }
  if (e?.code === "42501") return "ASSIGN_NOT_ALLOWED";
  return "ASSIGN_FAILED";
}

/** Read a code back from the page's query string; anything unknown is ASSIGN_FAILED. */
export function kodePenugasanDari(v: string | undefined | null): KodePenugasan | null {
  if (!v) return null;
  const semua: readonly string[] = [...KODE_PENUGASAN_DB, "ASSIGN_INPUT_INVALID", "ASSIGN_FAILED"];
  return (semua.includes(v) ? v : "ASSIGN_FAILED") as KodePenugasan;
}

/** The copy key for each code (D-014). */
export function kunciKodePenugasan(code: KodePenugasan): HleEvent {
  return `mengajar.sedia.kode.${code.toLowerCase()}` as HleEvent;
}
