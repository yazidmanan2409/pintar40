/**
 * BOB-41 (post-login review #6, D-061): WHAT A QUESTION-HEALTH REVIEWER MAY
 * RECORD FROM WHERE THE QUESTION STANDS.
 *
 * Bank Soal drew its review form only at SIGNAL_RAISED and offered
 * UNDER_REVIEW, ACKNOWLEDGED_OK and ACTION_TAKEN there. But
 * question_health_transitions allows only SIGNAL_RAISED -> UNDER_REVIEW from
 * there, so the other two were refused, and after UNDER_REVIEW no form was
 * drawn: a review could never be concluded. The page now offers only the
 * reviewer's transitions that are legal from the item's current state. The
 * database still decides; this only stops the page offering what it refuses.
 */
export type KeputusanTinjauan = "UNDER_REVIEW" | "ACKNOWLEDGED_OK" | "ACTION_TAKEN";

/** The states a reviewer acts on; every item in one of them is listed, whatever its age. */
export const SEDANG_DITINJAU = ["SIGNAL_RAISED", "UNDER_REVIEW"] as const;

export function pilihanTinjauan(state: string | null | undefined): KeputusanTinjauan[] {
  if (state === "SIGNAL_RAISED") return ["UNDER_REVIEW"];
  if (state === "UNDER_REVIEW") return ["ACKNOWLEDGED_OK", "ACTION_TAKEN"];
  return [];
}
