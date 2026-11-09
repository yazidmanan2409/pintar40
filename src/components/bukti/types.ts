import type { Locale } from "@/lib/hle";

/**
 * The `metric_evaluate` envelope, exactly as the database returns it.
 *
 * This is a copy of the shape `src/app/_intel.ts` already read, moved here so
 * the four evidence components consume the envelope directly rather than a
 * re-shaped version of it. Re-shaping is where a distinction gets lost: the
 * evaluator distinguishes "we looked and there is not enough yet" from "this is
 * not for you", and a component that received a single `empty: true` could not
 * tell the reader which happened.
 *
 * NOTHING HERE IS AN INTERNAL WORD ON A SCREEN. `status` is `ok`,
 * `below_minimum`, `deprecated`, `not_permitted` or `unavailable`; every one is
 * turned into an HLE key before it renders, and no component below puts
 * `status` in a text position.
 *
 * R5 ADDS `readiness` BESIDE `status`, NOT INSTEAD OF IT. `below_minimum` was
 * one word for two different facts -- nothing qualifying has happened yet, and
 * some has but not enough -- and those license different sentences. The
 * evaluator now says which, and carries the matching `statement_key`, so a
 * surface that already prefers the envelope's own statement key tells the
 * truthful one without deciding anything. It is absent on a refusal, on
 * purpose: readiness is a fact about a population's evidence, and a reader who
 * may not see the population may not have that fact either.
 */
export type Envelope = {
  status: string;
  /**
   * WP4. The evaluator has always returned this on every branch but
   * `not_permitted` and `unavailable`, and it was not read until a surface
   * asked for several figures at once and needed a stable React key for each.
   * It is an identifier and never a text position: no component below renders
   * it, and `metric_id` is in the internal-word class that UX1-S0-HLE-01 and
   * F06-R01 sweep for.
   */
  metric_id?: string;
  /** R5: NOT_YET_EVALUABLE | INSUFFICIENT_EVIDENCE | SUFFICIENT_EVIDENCE. Absent on a refusal. */
  readiness?: string;
  ordinal?: number;
  visualization?: string;
  label_key?: string;
  meaning_key?: string;
  statement_key?: string;
  value?: unknown;
  sample?: number;
  have?: number;
  needed?: number;
  /**
   * CR-81 (D-123(3)): the class's population beside its performance bands -- the learners placed in it now, those
   * assessed there, and those placed with no result yet. Who is in a class is no performance figure, so the evaluator
   * passes it through below the floor too; only the readiness distribution reports one.
   */
  population?: Populasi;
  /**
   * Owner decision 7: what the evaluator WITHHELD to protect a smaller group. `subgroup`: a combined figure (Pemahaman over
   * a class's chapters, the school's Kenaikan over its classes) is not shown because one of its parts has fewer than
   * `needed` learners; its learners (`have`) are still counted. `patterns`: `count` misconception patterns seen in fewer
   * than `needed` learners are not listed. Never a zero, never «no evidence».
   */
  withheld?: Ditahan;
  /** Owner (9 Nov): Kenaikan's unit, the (learner, chapter) pairs it averages over; `sample` stays the learners. */
  pairs?: number;
  /** D12: tests with no required question, shown beside the gate's figure and never counted as a pass. */
  not_applicable?: number;
  /** D12: the gate's value is a share of these applicable sittings; `sample` stays the learners. */
  sittings?: number;
};

export type Ditahan = { reason: "subgroup" | "patterns" | "not_applicable" | string; needed?: number; count?: number; chapters?: number; sittings?: number };

export type Populasi = { placed: number; assessed: number; not_yet: number };

/** Every evidence component is told the language; none of them guesses it. */
export type BuktiProps = { locale?: Locale };
