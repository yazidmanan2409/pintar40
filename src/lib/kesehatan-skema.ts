import HARAPAN from "./kesehatan-skema.json";

/**
 * BOB-19: WHAT A HEALTHY SCHEMA READS, ONE RULE FOR TWO READERS.
 *
 * `platform_schema_lint()` returns counts and flags. Some are right at 0, some
 * at 1, 2 or true, and some are only information. The Konfigurasi health card
 * used to call anything other than 0 a problem, so a clean, fully migrated
 * database read "Perlu perhatian".
 *
 * The expected value of each check lives in ./kesehatan-skema.json, and that
 * file is the only list. F01-T13 (selftest/db/fable01.sql) loads the same file
 * and compares the lint against it key by key. The card judges with
 * `nilaiSkema` below. A check is right when it reads exactly its expected value.
 * A key the lint does not return is wrong, not skipped. A key that is not in the
 * file is information, and neither reader judges it.
 */
export type NilaiHarapan = number | boolean;
export type KunciSkema = keyof typeof HARAPAN;

export const HARAPAN_SKEMA: Readonly<Record<KunciSkema, NilaiHarapan>> = HARAPAN;
export const KUNCI_SKEMA = Object.keys(HARAPAN) as KunciSkema[];

export type HasilSkema = {
  /** Every check reads its expected value. */
  sehat: boolean;
  /** The checks that do not, in the file's order. */
  menyimpang: KunciSkema[];
  /** How many checks were judged. */
  jumlah: number;
};

export function nilaiSkema(lint: Record<string, unknown>): HasilSkema {
  const menyimpang = KUNCI_SKEMA.filter((k) => lint[k] !== HARAPAN_SKEMA[k]);
  return { sehat: KUNCI_SKEMA.length > 0 && menyimpang.length === 0, menyimpang, jumlah: KUNCI_SKEMA.length };
}
