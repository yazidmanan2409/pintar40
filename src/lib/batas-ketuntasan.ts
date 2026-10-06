/**
 * D-088(b), D-081, BOB-49 / DAISY-38 — THE SCHOOL'S PASS MARK, PER LESSON.
 *
 * A school admin sets each lesson's «Batas ketuntasan» (a whole percentage,
 * 0–100) on Konfigurasi; a teacher reads it, read-only, before giving the lesson
 * to a class, and is refused the lesson while it is unset. The database keeps
 * every change (`school_pass_marks`, append-only, audited) and seals the mark
 * onto each assignment and attempt (supabase/migrations/20261102100000), so a
 * change applies to what is given afterwards and never rewrites a result.
 *
 * These are the reads and the one rule a form needs; the database decides again
 * who may read and who may set.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = any;

export type RiwayatBatas = { percent: number; set_at: string; reason: string; set_by: string | null };
export type PelajaranBatas = {
  course_id: string; title: string; subject: string; grade_label: string; canonical: boolean;
  /** the current mark, or null while the school has not set one */
  percent: number | null;
  /** every change, newest first */
  history: RiwayatBatas[];
};

/** Every lesson the school can give, with its mark and history; null when the reader may not read the school's. */
export async function pelajaranDanBatas(c: Db, sekolah: string): Promise<PelajaranBatas[] | null> {
  const { data, error } = await c.rpc("school_pass_mark_lessons", { p_institution: sekolah });
  if (error || !Array.isArray(data)) return null;
  return data as PelajaranBatas[];
}

/**
 * The lesson's current mark for the school: a whole percentage, null when it is not set,
 * undefined when it could not be read (the page then says nothing rather than something untrue).
 */
export async function batasPelajaran(c: Db, sekolah: string, course: string): Promise<number | null | undefined> {
  const { data, error } = await c.rpc("school_pass_mark", { p_institution: sekolah, p_course: course });
  if (error || !data || typeof data !== "object") return undefined;
  const p = (data as { percent: unknown }).percent;
  return typeof p === "number" ? p : null;
}

/** A form's mark: a whole number from 0 to 100 written as digits, or null. «60», never «60,5» or «-1». */
export function bacaPersen(raw: string): number | null {
  const t = raw.trim();
  if (!/^\d{1,3}$/.test(t)) return null;
  const n = Number(t);
  return n >= 0 && n <= 100 ? n : null;
}
