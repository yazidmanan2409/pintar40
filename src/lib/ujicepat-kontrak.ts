/**
 * BOB-32 (UX-03's server half, D-011): WHY A QUICK ASSESSMENT WAS NOT LAUNCHED.
 *
 * `sediakanUjiCepat` used to send every refusal of `launch_quick_assessment`
 * to the same `?cepat=gagal`, so a teacher could not tell a chapter with too
 * few questions from a count out of range. It now passes one of these codes,
 * and for a refusal nobody named, a reference the server log carries too:
 *
 *   ?cepat=gagal&kode=<code>[&ref=<ABC123>]
 *
 * The words are the page's (Daisy, D-014); this file holds the codes only.
 *
 * The database raises these refusals as sentences (SQLSTATE P0001), so they
 * are matched here by the sentence's fixed opening, anchored, exactly as the
 * content trigger's are in galat-kontrak.ts. BOB32-K01 reads each sentence out
 * of the migration that defines the function, so a reworded refusal fails
 * the test rather than silently falling through to QUICK_FAILED.
 */
export const KODE_UJI_CEPAT = [
  "QUICK_BANK_TOO_SMALL",       // the chapter's bank holds fewer drawable questions than asked for
  "QUICK_COUNT_OUT_OF_RANGE",   // the number of questions is outside 3 to 20
  "QUICK_MINUTES_OUT_OF_RANGE", // the time window is outside 5 to 60 minutes
  "QUICK_NOT_ALLOWED",          // no CAN_QUICK_ASSESSMENT over this class, or another school's chapter
  "QUICK_NOT_FOUND",            // the class or chapter is not there (or is not a class)
  "QUICK_PASS_MARK_MISSING",    // D-088(b): the school has not set this lesson's pass mark (PR050, by its DETAIL)
  "QUICK_SELECTION_COUNT",      // D-085 T2: fewer or more questions chosen than an Uji Cepat carries, or one twice (PR050)
  "QUICK_SELECTION_NOT_OFFERED", // D-085 T2: a chosen question the chapter does not offer an Uji Cepat (PR050)
  "QUICK_SELECTION_SIBLINGS",   // D-085 T2: two chosen questions are versions of one question (PR050)
  "QUICK_CONTEXT_MISMATCH",     // BOB-43: the chapter is for another kind of place than this class (PR050 ASSIGN_CONTEXT_MISMATCH)
  "QUICK_FAILED",               // anything else: the teacher is given a reference to quote
] as const;
export type KodeUjiCepat = (typeof KODE_UJI_CEPAT)[number];

const POLA: ReadonlyArray<readonly [RegExp, KodeUjiCepat]> = [
  [/^this module has \d+ drawable question\(s\) at the [A-Z_]+ tier; a \d+ question quick assessment cannot be filled/, "QUICK_BANK_TOO_SMALL"],
  [/^a quick assessment carries between 3 and 20 questions, not /, "QUICK_COUNT_OUT_OF_RANGE"],
  [/^a quick assessment runs between 5 and 60 minutes, not /, "QUICK_MINUTES_OUT_OF_RANGE"],
  [/^launching a quick assessment requires CAN_QUICK_ASSESSMENT over this class/, "QUICK_NOT_ALLOWED"],
  [/^that module belongs to another institution \(INV-13\)/, "QUICK_NOT_ALLOWED"],
  [/^unknown class /, "QUICK_NOT_FOUND"],
  [/^unknown module /, "QUICK_NOT_FOUND"],
  [/^a quick assessment is launched for a class or cohort, not a /, "QUICK_NOT_FOUND"],
];

type GalatDb = { code?: string | null; details?: string | null; message?: string | null } | null | undefined;

/** The code of `launch_quick_assessment`'s refusal. */
export function kodeUjiCepat(e: GalatDb): KodeUjiCepat {
  // D-088(b): the assignment's seal refuses a lesson with no school pass mark, by SQLSTATE and DETAIL, not by words
  if (e?.code === "PR050" && e?.details === "ASSIGN_PASS_MARK_MISSING") return "QUICK_PASS_MARK_MISSING";
  // BOB-43: the assignment boundary refuses material of another context, by SQLSTATE and DETAIL
  if (e?.code === "PR050" && e?.details === "ASSIGN_CONTEXT_MISMATCH") return "QUICK_CONTEXT_MISMATCH";
  // D-085 T2: the chosen launch's own refusals, by SQLSTATE and DETAIL
  if (e?.code === "PR050" && (e?.details === "QUICK_SELECTION_COUNT" || e?.details === "QUICK_SELECTION_NOT_OFFERED"
      || e?.details === "QUICK_SELECTION_SIBLINGS")) return e.details;
  const pesan = (e?.message ?? "").replace(/^ERROR:\s*/i, "");
  for (const [pola, kode] of POLA) if (pola.test(pesan)) return kode;
  if (e?.code === "42501") return "QUICK_NOT_ALLOWED";
  return "QUICK_FAILED";
}

/**
 * The refusal read back from the address, trusting nothing: a code this file
 * does not know and a reference of the wrong shape are dropped, so no text
 * typed into an address reaches the page.
 */
export function bacaGagalUjiCepat(q: { cepat?: string; kode?: string; ref?: string }): { kode: KodeUjiCepat | null; ref: string | null } | null {
  if (q.cepat !== "gagal") return null;
  const kode = q.kode && (KODE_UJI_CEPAT as readonly string[]).includes(q.kode) ? (q.kode as KodeUjiCepat) : null;
  const ref = q.ref && /^[A-Z0-9]{6}$/.test(q.ref) ? q.ref : null;
  return { kode, ref };
}

/**
 * BOB-34: where a refused launch goes. The code (and, for QUICK_FAILED, the
 * reference), and the teacher's own choices as they sent them, so the page's
 * form reopens with the chapter, the questions ticked (D-085 T2: `butir`,
 * which replaced the count) and the time they picked rather than resetting.
 * The page reads and validates `bab`, `butir` and `menit` itself; no stage
 * parameter, so it lands on the form, where the choice is changed.
 */
export function alamatTolakUjiCepat(
  kode: KodeUjiCepat,
  pilihan: { bab: string; butir: string; menit: string },
  ref?: string | null,
): string {
  const q = new URLSearchParams({ cepat: "gagal", kode });
  if (ref) q.set("ref", ref);
  for (const k of ["bab", "butir", "menit"] as const) if (pilihan[k]) q.set(k, pilihan[k]);
  return `/uji-cepat?${q.toString()}`;
}
