/**
 * BOB-06 (D-010; audit B6b) — WHICH TEMPLATE A SUMMARY READS.
 *
 * Every school carries PINTAR's standard class and school reports from the
 * moment it exists (migration 20261011100000, `is_standard`), and may assemble
 * its own through `save_report_template`. A summary reads the template of the
 * school its scope node belongs to: the school's own latest assembly when it
 * has one, and PINTAR's standard one otherwise. Never another school's, and
 * never "the first row the reader can see", which is what the two summary
 * pages did when no school had any.
 *
 * Pure: the server half is src/lib/laporan.ts.
 */
export type LaporanStandar = "class_learning_intelligence" | "institution_learning_intelligence";

export type BarisTemplat = {
  id: string;
  institution_id: string;
  standard_report: string;
  template_version: number;
  is_standard: boolean;
  title_key: string;
};

export function pilihTemplat(
  baris: readonly BarisTemplat[],
  institusi: string,
  standar: LaporanStandar,
): BarisTemplat | null {
  const milik = baris.filter((t) => t.institution_id === institusi && t.standard_report === standar);
  const sendiri = milik
    .filter((t) => !t.is_standard)
    .sort((a, b) => b.template_version - a.template_version || a.id.localeCompare(b.id));
  return sendiri[0] ?? milik.find((t) => t.is_standard) ?? null;
}
