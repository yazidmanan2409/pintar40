/**
 * THE assessment engine (FABLE-03 §0, INV-26). Every route in the learning
 * cycle calls this module and nothing else; Phase 4 extends it and never
 * creates a second one.
 *
 * WHERE THE LOGIC LIVES, AND WHY IT IS NOT HERE. Assembly, sanitization,
 * grading, the safety gate and finalize are database functions. That is not
 * an accident of convenience: FABLE-02 grants SELECT on `items` and
 * `item_options` behind a CAN_DRAFT policy, and a STUDENT holds no
 * capability, so a learner cannot read one row of the bank through any client
 * path. A sanitizer written here would have to run as `service_role` and hold
 * the whole authoring row — answer key included — in a Node process, and "the
 * sanitizer" would quietly become "whatever that code forgot to drop". The
 * answer key never leaves Postgres. This module is the single typed surface
 * over those functions, and INV-26 is checked both ways: one implementation
 * in SQL (each migration's verification block) and one caller in TypeScript
 * (F03-S01).
 *
 * IT HOLDS NO PRIVILEGE. Every function here takes the caller's own Supabase
 * client. The RPCs are SECURITY DEFINER granted to `authenticated` and derive
 * the learner from `current_person_id()`, so identity comes from the JWT
 * inside the database (INV-08) and this module never imports
 * `@/lib/supabase/service`. That also leaves FABLE-01's F01-S03 rule — the
 * service-role client appears only under `src/app/api/` — exactly as written.
 */
import {
  ANSWER_KEY_FIELDS, LEARNER_ITEM_KEYS,
  type AssignmentEntry, type AssistanceLevel, type AssistanceState, type Delta,
  type LearnerAnswer, type LearnerItem, type LessonEntry, type Outcome,
  type PaperEntry, type ReadingMapCard,
  type OpenAssessment,
  type Orientation,
} from "./types";

/**
 * Structurally typed so this module never names a concrete client. A
 * `SupabaseClient` satisfies it; so does a test double.
 */
export type EngineClient = {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{
    data: unknown;
    error: { message: string; code?: string; details?: string | null } | null;
  }>;
};

/**
 * A refusal from the database, carrying its STABLE CODE when it has one (R1):
 * PR001 receipt conflict (detail = the server's highest client_seq), PR002 the
 * session accepts nothing more, PR006 answers still pending, PR007 late-sync
 * window open. A client decides what to do from the code, never from the prose.
 */
export class EngineError extends Error {
  readonly code: string | null;
  readonly detail: string | null;
  constructor(message: string, code: string | null = null, detail: string | null = null) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}

async function call(db: EngineClient, fn: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await db.rpc(fn, args ?? {});
  if (error) throw new EngineError(error.message, error.code ?? null, error.details ?? null);
  return data;
}

function rows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : data == null ? [] : [data as T];
}

/**
 * The last line of defence for INV-01, and the only place a payload from the
 * database is turned into a `LearnerItem`. The database has already projected
 * through the allow-list; this re-projects by the same key list and refuses
 * outright if an answer-key field is present, so a regression in the SQL
 * surfaces as a thrown error here rather than as a field on a screen.
 */
export function sanitize(raw: unknown): LearnerItem {
  const src = (raw ?? {}) as Record<string, unknown>;
  for (const forbidden of ANSWER_KEY_FIELDS) {
    if (forbidden in src) {
      throw new EngineError(`the item payload carried "${forbidden}" (INV-01)`);
    }
  }
  const out: Record<string, unknown> = {};
  for (const key of LEARNER_ITEM_KEYS) if (key in src) out[key] = src[key];
  const opsi = Array.isArray(out.opsi) ? (out.opsi as Array<Record<string, unknown>>) : [];
  out.opsi = opsi.map((o) => ({ posisi: Number(o.posisi), teks: String(o.teks) }));
  return out as LearnerItem;
}

// ---------------------------------------------------------------- assignments
export async function myAssignments(db: EngineClient): Promise<AssignmentEntry[]> {
  return rows<AssignmentEntry>(await call(db, "my_learning_assignments"));
}

/**
 * Defect (10 Nov): what was and is assigned to the learner, with its status (ACTIVE, ENDED, WITHDRAWN). Closing a lesson
 * stops new work; its outcome stays seen. Only results pages read this; starting work reads myAssignments.
 */
export async function myLearningHistory(db: EngineClient): Promise<AssignmentEntry[]> {
  return rows<AssignmentEntry>(await call(db, "my_learning_history"));
}

/**
 * D-195(4): whether one of the caller's OWN learning assignments is professional learning (jenis_belajar_saya,
 * 20270102100000): true, false for a school's curriculum, null for anything else or an unread answer.
 */
export async function isProfessionalLearning(db: EngineClient, learningAssignmentId: string): Promise<boolean | null> {
  try {
    const v = await call(db, "jenis_belajar_saya", { p_learning_assignment: learningAssignmentId });
    return typeof v === "boolean" ? v : null;
  } catch {
    return null;
  }
}

export async function lessons(db: EngineClient, learningAssignmentId: string): Promise<LessonEntry[]> {
  return rows<LessonEntry>(await call(db, "learner_lessons", { p_learning_assignment: learningAssignmentId }));
}

export async function recordProgress(
  db: EngineClient, learningAssignmentId: string, lessonId: string,
  position: number, total?: number,
): Promise<number> {
  return Number(await call(db, "record_lesson_progress", {
    p_learning_assignment: learningAssignmentId, p_lesson: lessonId,
    p_position: position, p_total: total ?? null,
  }));
}

export type CycleState = {
  pre_assignment: string | null; pre_session: string | null; pre_status: string | null;
  post_assignment: string | null; post_session: string | null; post_status: string | null;
};

export async function cycleState(db: EngineClient, learningAssignmentId: string): Promise<CycleState> {
  const r = rows<CycleState>(await call(db, "my_cycle_state", { p_learning_assignment: learningAssignmentId }));
  return r[0] ?? { pre_assignment: null, pre_session: null, pre_status: null,
                   post_assignment: null, post_session: null, post_status: null };
}

/**
 * UX-40: the caller's own learning assignments whose finished Uji Penguasaan result has not been opened yet, and the
 * act of opening one. Neither is evidence; both are the database's answer for the caller alone.
 */
export async function newResults(db: EngineClient): Promise<Set<string>> {
  const r = rows<{ learning_assignment_id: string }>(await call(db, "my_new_results"));
  return new Set(r.map((x) => x.learning_assignment_id));
}

/** D14 (owner, 9 Nov): whether the caller's own sitting was recalculated after it was sealed: a yes/no, no figure. */
export async function sesiDihitungUlang(db: EngineClient, sessionId: string): Promise<boolean> {
  return (await call(db, "sesi_saya_dihitung_ulang", { p_session: sessionId })) === true;
}

export async function noteResultSeen(db: EngineClient, sessionId: string): Promise<boolean> {
  return Boolean(await call(db, "note_result_seen", { p_session: sessionId }));
}

export type SessionState = {
  status: string; mode: string; allows_pause: boolean;
  authoritative_deadline: string | null; started_at: string | null; submitted_at: string | null;
  item_count: number; answered_count: number;
  hesitation_window_seconds: number | null; stage: string | null;
};

export async function sessionState(db: EngineClient, sessionId: string): Promise<SessionState> {
  return rows<SessionState>(await call(db, "session_state", { p_session: sessionId }))[0];
}

// ------------------------------------------------------------------- sessions
export async function mayStart(db: EngineClient, assessmentAssignmentId: string): Promise<{ ok: boolean; reason: string }> {
  const r = rows<{ ok: boolean; reason: string }>(
    await call(db, "may_start_assessment", { p_assessment_assignment: assessmentAssignmentId }));
  return r[0] ?? { ok: false, reason: "UNKNOWN" };
}

export async function startSession(db: EngineClient, assessmentAssignmentId: string): Promise<string> {
  return String(await call(db, "start_learning_session", { p_assessment_assignment: assessmentAssignmentId }));
}

export async function paper(db: EngineClient, sessionId: string): Promise<PaperEntry[]> {
  const raw = rows<{ presented_item_id: string; posisi: number; muatan: unknown }>(
    await call(db, "session_paper", { p_session: sessionId }));
  return raw.map((r) => ({ presentedItemId: r.presented_item_id, posisi: r.posisi, item: sanitize(r.muatan) }));
}

export async function answersSoFar(db: EngineClient, sessionId: string) {
  return rows<{ presented_item_id: string; client_seq: number; posisi: unknown; received_at: string }>(
    await call(db, "session_answers", { p_session: sessionId }));
}

export async function answer(
  db: EngineClient, presentedItemId: string, clientSeq: number, value: LearnerAnswer,
  receiptMode: "LIVE" | "REPLAYED" | "LATE_SYNC" = "LIVE", clientAssertedAt?: string,
): Promise<{ response_id: string; outcome: string }> {
  const r = rows<{ response_id: string; outcome: string }>(
    await call(db, "record_answer", {
      p_presented_item: presentedItemId, p_client_seq: clientSeq, p_jawaban: value,
      p_client_asserted_at: clientAssertedAt ?? null, p_receipt_mode: receiptMode,
    }));
  return r[0];
}

export async function noteItemView(db: EngineClient, presentedItemId: string): Promise<string> {
  return String(await call(db, "note_item_view", { p_presented_item: presentedItemId }));
}

export async function pause(db: EngineClient, sessionId: string) {
  return String(await call(db, "pause_session", { p_session: sessionId }));
}
export async function resume(db: EngineClient, sessionId: string) {
  return String(await call(db, "resume_session", { p_session: sessionId }));
}
/**
 * Finish, declaring what the learner took: `manifest` maps each presented item
 * to the highest client_seq this client issued for it. The database refuses
 * (PR006) until it holds a receipt at or above every entry (I-R1).
 */
export async function finish(
  db: EngineClient, sessionId: string, manifest: Record<string, number> | null,
): Promise<string> {
  return String(await call(db, "finish_my_session", { p_session: sessionId, p_manifest: manifest }));
}

// ------------------------------------------------------------------ assistance
export async function assistanceState(db: EngineClient, presentedItemId: string): Promise<AssistanceState> {
  const r = rows<Record<string, unknown>>(
    await call(db, "assistance_state", { p_presented_item: presentedItemId }))[0] ?? {};
  return {
    windowSeconds: r.window_seconds == null ? null : Number(r.window_seconds),
    dwellSeconds: r.dwell_seconds == null ? null : Number(r.dwell_seconds),
    due: r.due === true,
    stage: (r.stage as string) ?? null,
    answered: r.answered === true,
    highestOpen: Number(r.highest_open ?? 0),
    nextLevel: r.next_level == null ? null : Number(r.next_level),
  };
}

export async function openAssistance(db: EngineClient, presentedItemId: string, level: number): Promise<AssistanceLevel> {
  const r = rows<AssistanceLevel>(
    await call(db, "open_assistance", { p_presented_item: presentedItemId, p_level: level }));
  return r[0];
}

export async function dismissAssistance(db: EngineClient, presentedItemId: string): Promise<void> {
  await call(db, "dismiss_assistance", { p_presented_item: presentedItemId });
}

// --------------------------------------------------------------------- results
export async function outcome(db: EngineClient, sessionId: string): Promise<Outcome | null> {
  return (await call(db, "session_outcome", { p_session: sessionId })) as Outcome | null;
}

export async function review(db: EngineClient, sessionId: string) {
  return rows<{
    posisi: number; stem: string; is_safety_critical: boolean;
    jawaban_teks: string | null; benar: boolean | null; alasan: string | null; arah: string | null;
  }>(await call(db, "session_review", { p_session: sessionId }));
}

export async function readingMap(db: EngineClient, sessionId: string): Promise<ReadingMapCard[]> {
  return rows<ReadingMapCard>(await call(db, "reading_map", { p_session: sessionId }));
}

export async function delta(db: EngineClient, learningAssignmentId: string): Promise<Delta> {
  return (await call(db, "learning_delta", { p_learning_assignment: learningAssignmentId })) as Delta;
}

/**
 * Q-12: the assessments a learner may start that no learning assignment names.
 * Adds no authority — the RPC returns what `may_start_assessment()` accepts.
 */
export async function openAssessments(db: EngineClient): Promise<OpenAssessment[]> {
  return rows<OpenAssessment>(await call(db, "my_open_assessments"));
}

/** D-085 M3 (J5.12): a teacher's open request to this learner to read lessons of a chapter again. */
export type PermintaanUlang = {
  request_id: string;
  learning_assignment_id: string;
  course_title: string;
  requested_at: string;
  requested_by: string | null;
  lessons: Array<{ lesson_id: string; title: string; read: boolean }> | null;
};

/** The learner's open requests to read again, oldest first; one closes when every lesson in it has been read. */
export async function lessonReviews(db: EngineClient): Promise<PermintaanUlang[]> {
  return rows<PermintaanUlang>(await call(db, "my_lesson_reviews"));
}

/**
 * Orientation BEFORE the act that starts an assessment. Null means the learner
 * may not start this one — the RPC is gated by `may_start_assessment()` and
 * returns no row rather than a row with a disabled button, so a caller cannot
 * accidentally render an orientation for something that is closed or spent.
 */
export async function orientation(db: EngineClient, assessmentAssignmentId: string): Promise<Orientation | null> {
  const r = rows<Orientation>(
    await call(db, "assessment_orientation", { p_assessment_assignment: assessmentAssignmentId }));
  return r[0] ?? null;
}

export * from "./types";

// --------------------------------------------------------------- FABLE-04
/**
 * The learner's own certificate for their own session. Ownership is enforced
 * inside the RPC by `session_is_mine`; this module holds no privilege and
 * passes no identity (INV-08).
 */
export async function myCertificate(client: EngineClient, sessionId: string) {
  const found = rows<{
    certificate_id: string;
    certificate_number: string;
    verification_token: string;
    status: string;
    issued_at_iso: string;
    predikat: string | null;
    name_as_issued: string;
    institution_as_issued: string | null;
    course_subject_as_issued: string | null;
    course_title_as_issued: string | null;
    language_as_issued: string | null;
  }>(await call(client, "my_certificate", { p_session: sessionId }));
  return found[0] ?? null;
}

/**
 * An integrity signal on the caller's own session (§6). Recorded, never
 * scoring input: `assert_integrity_never_scores()` asserts that no scoring
 * function or view can read the table at all.
 */
export async function recordIntegritySignal(
  client: EngineClient,
  sessionId: string,
  category: "VISIBILITY_CHANGE" | "NAVIGATION" | "RECONNECT" | "RAPID_OPTION_CHANGE" | "SUBMISSION_ANOMALY",
  observation: Record<string, unknown> = {},
) {
  await call(client, "record_integrity_signal", {
    p_session: sessionId,
    p_category: category,
    p_observation: observation,
  });
}
