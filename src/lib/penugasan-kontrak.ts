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
  // BOB-43: raised by the assignment boundary (enforce_assignment_context) on both assignment tables, same SQLSTATE
  "ASSIGN_CONTEXT_MISMATCH",
  // D-183 (F-4(f)): raised by the exposure guard (assessment_assignments_zz_exposed_is_not_assessed) when a school that is
  // not synthetic is given a Pemetaan Awal or Cek penguasaan whose questions were publicly exposed, same SQLSTATE
  "ASSIGN_EXPOSED_CONTENT",
] as const;

/**
 * W2.21 (owner, 9 Nov): every code akhiri_penugasan and akhiri_penugasan_pratinjau raise (penugasan_tolak, PR050 with
 * the code in DETAIL) when a teacher ends or withdraws an assignment. Kept apart from assign_release's list: ending is
 * its own act with its own refusals (ASSIGN_NOT_ALLOWED is shared, with its own sentence for each act's page).
 */
export const KODE_AKHIRI_DB = [
  "ASSIGN_NOT_ALLOWED",
  "ASSIGN_NOT_LIVE",
  "ASSIGN_KIND_INVALID",
  "ASSIGN_REASON_REQUIRED",
  "ASSIGN_IN_PROGRESS",
] as const;

/**
 * Every code the assign action can return: the database's, plus
 * `ASSIGN_INPUT_INVALID` (the class or lesson was missing, nothing was sent)
 * and `ASSIGN_FAILED` (anything else; a short reference goes to the server log).
 */
export type KodePenugasan = (typeof KODE_PENUGASAN_DB)[number] | (typeof KODE_AKHIRI_DB)[number] | "ASSIGN_INPUT_INVALID" | "ASSIGN_FAILED";

export type HasilPenugasan =
  | { ok: true; learningAssignment: string; preAssignment: string; postAssignment: string }
  | { ok: false; code: KodePenugasan; ref?: string };

/** A database error as an assignment code: PR050 with a known DETAIL, else ASSIGN_FAILED. */
export function kodeGalatPenugasan(e: { code?: string | null; details?: string | null } | null | undefined): KodePenugasan {
  if (e?.code === "PR050" && typeof e.details === "string"
      && ([...KODE_PENUGASAN_DB, ...KODE_AKHIRI_DB] as readonly string[]).includes(e.details)) {
    return e.details as KodePenugasan;
  }
  if (e?.code === "42501") return "ASSIGN_NOT_ALLOWED";
  return "ASSIGN_FAILED";
}

/** Read a code back from the page's query string; anything unknown is ASSIGN_FAILED. */
export function kodePenugasanDari(v: string | undefined | null): KodePenugasan | null {
  if (!v) return null;
  const semua: readonly string[] = [...KODE_PENUGASAN_DB, ...KODE_AKHIRI_DB, "ASSIGN_INPUT_INVALID", "ASSIGN_FAILED"];
  return (semua.includes(v) ? v : "ASSIGN_FAILED") as KodePenugasan;
}

/** The copy key for each code (D-014). */
export function kunciKodePenugasan(code: KodePenugasan): HleEvent {
  return `mengajar.sedia.kode.${code.toLowerCase()}` as HleEvent;
}
