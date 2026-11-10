/**
 * The learner-facing item shape (doc 07, "Answer-key isolation & sanitized
 * payloads"). This is a *distinct type*, not the authoring item with fields
 * hidden by the UI: there is no authoring type in this module at all, and no
 * code path in the application can obtain one.
 *
 * The database decides what belongs here — `session_paper()` projects through
 * `item_type_registry.sanitizer_allowlist`, so the allow-list is data, and a
 * field added to the authoring model is absent from this payload until
 * somebody adds it to a type's allow-list (doc 12, "new authoring fields
 * default to excluded"). The keys below mirror that allow-list; anything else
 * arriving in `muatan` is dropped by `sanitize()` rather than passed through.
 */
export const LEARNER_ITEM_KEYS = ["item_type", "stem", "stimulus", "opsi"] as const;

/** Keys that must never appear in a learner or assistance payload (INV-01, INV-31). */
export const ANSWER_KEY_FIELDS = [
  "is_correct", "rationale", "misconception_code", "petunjuk", "arah_berpikir",
  "label", "objective_ids", "predicted_difficulty", "empirical_difficulty",
] as const;

export type ItemType =
  | "MCQ_SINGLE" | "MCQ_MULTI" | "NUMERIC" | "GRID"
  | "TRUE_FALSE_BATTERY" | "MATCHING" | "IMAGE_ANCHORED";

/** One option as the learner sees it: a display position and its text. The
 *  authored label never crosses this boundary — see 0030's header. */
export type LearnerOption = { posisi: number; teks: string };

export type LearnerItem = {
  item_type: ItemType;
  stem: string;
  stimulus: string | null;
  opsi: LearnerOption[];
};

export type PaperEntry = {
  presentedItemId: string;
  posisi: number;
  item: LearnerItem;
};

/** What the learner sends back: display positions, never authored labels. */
export type LearnerAnswer =
  | { posisi: number }
  | { posisi: number[] };

export type AssistanceState = {
  windowSeconds: number | null;
  dwellSeconds: number | null;
  due: boolean;
  stage: string | null;
  answered: boolean;
  highestOpen: number;
  nextLevel: number | null;
};

export type AssistanceLevel = { level: number; kode: string; isi: string; stage: string | null };

export type Outcome = {
  penguasaan: number | null;
  per_domain: Record<string, { benar: number; total: number; penguasaan: number }>;
  ringkasan: Record<string, number>;
  diagnostik: boolean;
  gerbang_keselamatan?: boolean | null;
  lulus?: boolean | null;
  ambang?: number | null;
};

export type ReadingMapCard = {
  peringkat: number;
  tingkat: "PERLU_SEGERA" | "WAJIB" | "DISARANKAN" | "KUAT";
  kode: string;
  pernyataan: string;
  modul: string;
  pelajaran: string;
  halaman: string | null;
  alasan: string;
};

export type LessonEntry = {
  lesson_id: string;
  modul: string;
  urutan: number;
  judul: string;
  ringkasan: string | null;
  isi: string | null;
  contoh: unknown[];
  media: Array<{ jenis: string; path: string; transcript?: string }>;
  halaman: string | null;
  furthest_position: number;
  total_positions: number | null;
};

export type AssignmentEntry = {
  learning_assignment_id: string;
  course_id: string;
  plp_release_id: string;
  subject: string;
  stage: string;
  grade_label: string;
  title: string;
  pre_test_assignment: string | null;
  post_test_assignment: string | null;
  /** my_learning_history only: ACTIVE, ENDED or WITHDRAWN */
  status?: string;
};

export type Delta = {
  status: "LENGKAP" | "BELUM_ADA" | "BARU_PEMETAAN" | "BARU_PENGUASAAN";
  awal: number | null;
  akhir: number | null;
  selisih: number | null;
};

/**
 * An assessment a learner may start that NO learning assignment names — Quick
 * and Practice. Q-12's discovery root: `my_open_assessments()` takes no
 * argument and decides nothing, returning exactly the candidates
 * `may_start_assessment()` accepts, so discovery and authorization cannot
 * drift apart.
 */
export type OpenAssessment = {
  assessment_assignment_id: string;
  mode: string;
  title: string;
  node_id: string;
  node_name: string;
  item_count: number;
  opens_at: string | null;
  closes_at: string | null;
};

/**
 * What a learner may know about an assessment BEFORE the act that starts it.
 *
 * LOOKING IS NOT COMMITTING: `assessment_orientation()` creates no session,
 * stamps no `started_at` and spends no attempt. It is gated by the same
 * `may_start_assessment()` the start is gated by, so it returns NOTHING rather
 * than a row for an assessment the learner may not begin — which is why the
 * page reads a null here as a refusal and never as an empty orientation.
 *
 * There is NO DURATION FIELD, and none is derived. An estimated time was in
 * the reviewed concept and was ruled out on 2026-09-17: no legitimate duration
 * fact exists, and a plausible number a learner plans around is worse than no
 * number at all.
 */
export type Orientation = {
  mode: string;
  title: string;
  item_count: number;
  allows_pause: boolean;
  hesitation_window_seconds: number | null;
  opens_at: string | null;
  closes_at: string | null;
  attempt_limit: number | null;
  attempts_used: number;
};
