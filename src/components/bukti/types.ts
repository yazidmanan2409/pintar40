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
 */
export type Envelope = {
  status: string;
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
