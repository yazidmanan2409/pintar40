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
};

/** Every evidence component is told the language; none of them guesses it. */
export type BuktiProps = { locale?: Locale };
