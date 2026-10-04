/**
 * DAISY-40: WHICH OF THE LEARNER'S ASSIGNMENTS A CERTIFICATE BELONGS TO.
 *
 * A certificate row carries its `session_id`. The certificate page,
 * `/belajar/[tugas]/sertifikat`, takes a learning assignment and finds its
 * certificate through `my_cycle_state(tugas).post_session`. So the list finds a
 * row's assignment by the same read, inverted: each assignment's Uji
 * Penguasaan session, mapped back to that assignment. A row whose session is
 * no assignment's current post session has no page that opens it, and gets no
 * link.
 *
 * The list used to key this map by `learning_assignment_id` and look it up by
 * `session_id`, so no row ever found its assignment, every row lost its title,
 * and every link fell back to `/belajar/<session id>/sertifikat`, a page that
 * cannot open.
 *
 * Pure, so the guard runs it as the page does.
 */
export type AsalSertifikat = { subject: string; grade: string; title: string; tugas: string };

export type SiklusTugas = {
  assignment: { learning_assignment_id: string; subject: string; grade_label: string; title: string };
  /** `my_cycle_state(assignment).post_session`: the session its certificate is for, or null. */
  postSession: string | null;
};

export function petaSesi(siklus: SiklusTugas[]): Map<string, AsalSertifikat> {
  const peta = new Map<string, AsalSertifikat>();
  for (const { assignment: a, postSession } of siklus) {
    if (!postSession || peta.has(postSession)) continue;
    peta.set(postSession, { subject: a.subject, grade: a.grade_label, title: a.title, tugas: a.learning_assignment_id });
  }
  return peta;
}
