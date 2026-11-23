import { notFound } from "next/navigation";
import * as engine from "@/lib/assessment-engine";

/**
 * R-8 (X-2; Daisy, X2-CATATAN-DESAIN.md): ONE OWNERSHIP GUARD FOR EVERY PAGE UNDER /belajar/[tugas]/.
 *
 * An id that is not one of the learner's learning assignments (a classmate's link, an old bookmark, a mistyped address,
 * an assessment-assignment id) answers exactly as the assignment's main page always has: «not found». The guard runs
 * before any learning-state read, so the database's own «not assigned to you» exception never becomes the generic error
 * page with a reference code.
 *
 * - "Not yours" and "does not exist" are one answer: nothing tells a learner that another class's assignment exists.
 * - A genuine failure stays the error page: a failed read of the learner's own assignments is not «not found».
 * - `jugaMilik` is the one other way a page may still be the learner's own (the certificate of a chapter their class
 *   has since moved on from). It is asked only when the assignment is not among today's.
 * - `daftar` is the learner's assignments when the page has already read them (it is not read twice).
 */
type Daftar = { daftar?: readonly engine.AssignmentEntry[] };
export async function tugasSaya(db: engine.EngineClient, tugas: string, opsi?: Daftar): Promise<engine.AssignmentEntry>;
export async function tugasSaya(
  db: engine.EngineClient, tugas: string, opsi: Daftar & { jugaMilik: () => Promise<boolean> },
): Promise<engine.AssignmentEntry | null>;
export async function tugasSaya(
  db: engine.EngineClient,
  tugas: string,
  opsi: Daftar & { jugaMilik?: () => Promise<boolean> } = {},
): Promise<engine.AssignmentEntry | null> {
  const daftar = opsi.daftar ?? (await engine.myAssignments(db));
  const mine = daftar.find((a) => a.learning_assignment_id === tugas) ?? null;
  if (!mine && !(opsi.jugaMilik && (await opsi.jugaMilik().catch(() => false)))) notFound();
  return mine;
}
