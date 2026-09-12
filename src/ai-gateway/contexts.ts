/**
 * Intelligence contexts — the boundary FABLE-03 §6 opens, and nothing more.
 *
 * INV-31: the Learner Assistance Intelligence Context receives the SANITIZED
 * learner item shape and structurally cannot receive `is_correct`,
 * rationale-to-correct mappings or `misconception_code`. That is enforced
 * three ways here, because a type alone is a promise and not a boundary:
 *
 *   1. `buildLearnerAssistanceContext` accepts `LearnerItem` — a type with no
 *      answer-key field to pass.
 *   2. It re-runs the engine's `sanitize()`, which throws on any answer-key
 *      key present at runtime. Feeding it an authoring row is refused, not
 *      quietly narrowed.
 *   3. The context it returns is rebuilt field by field from an allow-list, so
 *      a field that somehow survived is still not carried forward.
 *
 * WHAT THIS IS NOT. There is no provider here, no routing, no model name, no
 * key, and no call. FABLE-03 §6 says contracts and provenance only, and doc
 * 09 keeps multi-provider routing out of V1 — so this file describes the
 * shape a request would have to take and refuses to build an unsafe one. The
 * assistance a learner actually receives in this phase is authored text
 * served by `open_assistance()`, re-checked against INV-02 in the database.
 */
import { sanitize, type LearnerItem } from "@/lib/assessment-engine";

/** Stage tiers from FABLE-00's progressive-assistance table. */
export type Stage = "SD" | "SMP" | "SMA" | "UNIVERSITAS";

export type LearnerAssistanceContext = {
  readonly kind: "LEARNER_ASSISTANCE";
  /** Provenance: which contract produced this, so a log can be read later. */
  readonly contract: "PINTAR-AI-CONTEXT/1";
  readonly stage: Stage;
  /** Which of the three progressive levels is being asked for. */
  readonly level: 1 | 2 | 3;
  /** Exactly the sanitized learner item — no wider, no narrower. */
  readonly item: LearnerItem;
};

/** Stage strings as authored on a course, mapped to the doctrine's tiers. */
export function toStage(courseStage: string | null | undefined): Stage {
  const s = (courseStage ?? "").trim().toUpperCase();
  if (s.startsWith("SD")) return "SD";
  if (s.startsWith("SMP")) return "SMP";
  if (s.startsWith("SMA") || s.startsWith("SMK")) return "SMA";
  return "UNIVERSITAS";
}

export function buildLearnerAssistanceContext(
  item: LearnerItem, stage: string | null, level: 1 | 2 | 3,
): LearnerAssistanceContext {
  // (2) and (3): refuse an authoring shape outright, then rebuild from the
  // sanitized one rather than passing the caller's object through.
  const safe = sanitize(item as unknown);
  return {
    kind: "LEARNER_ASSISTANCE",
    contract: "PINTAR-AI-CONTEXT/1",
    stage: toStage(stage),
    level,
    item: {
      item_type: safe.item_type,
      stem: safe.stem,
      stimulus: safe.stimulus ?? null,
      opsi: safe.opsi.map((o) => ({ posisi: o.posisi, teks: o.teks })),
    },
  };
}
