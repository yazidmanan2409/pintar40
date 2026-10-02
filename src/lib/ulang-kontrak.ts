/**
 * D-085 M3 (J5.12): WHY A REQUEST TO READ AGAIN WAS NOT MADE.
 *
 * request_lesson_review refuses with SQLSTATE PR050 and one of these codes in
 * DETAIL; a teacher who may not ask for the class is 42501. The action passes
 * the code to the page, never the database's words (D-011, BOB-07): a DETAIL
 * this list does not name is the general refusal, with a reference the server
 * log carries.
 */
export const KODE_ULANG = [
  "REVIEW_NO_LEARNER",            // no learner chosen
  "REVIEW_NO_LESSON",             // no lesson chosen
  "REVIEW_TOO_MANY",              // more than 60 learners or 30 lessons at once
  "REVIEW_NOT_IN_CLASS",          // a learner chosen is not placed in the class now (D-088(i))
  "REVIEW_LESSON_NOT_IN_CHAPTER", // a lesson chosen is not part of the chapter
  "REVIEW_ASSIGNMENT_CLOSED",     // the chapter is no longer given to the class
  "REVIEW_NOT_ALLOWED",           // not the class's teacher (42501)
  "REVIEW_FAILED",                // anything else: a reference to quote
] as const;
export type KodeUlang = (typeof KODE_ULANG)[number];

type GalatDb = { code?: string | null; details?: string | null } | null | undefined;

/** The code of request_lesson_review's refusal, from the fixed list only. */
export function kodeUlang(e: GalatDb): KodeUlang {
  if (e?.code === "PR050") {
    const kode = KODE_ULANG.find((k) => k === e.details && k !== "REVIEW_NOT_ALLOWED" && k !== "REVIEW_FAILED");
    if (kode) return kode;
  }
  if (e?.code === "42501") return "REVIEW_NOT_ALLOWED";
  return "REVIEW_FAILED";
}

/** A code read back from the address, trusting nothing: one the list does not know is the general refusal. */
export function bacaKodeUlang(kode: string | undefined): KodeUlang {
  return (KODE_ULANG as readonly string[]).includes(kode ?? "") ? (kode as KodeUlang) : "REVIEW_FAILED";
}
