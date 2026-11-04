import BarisHasil from "./BarisHasil";

/**
 * HasilDi — A SAVE'S RESULT, AT THE FORM THAT SENT IT (DAISY-18, D-047).
 *
 * Every action reports which part of its page it answers (`bagian`, BOB-07's
 * queryHasil). A page places one of these next to each form, naming the
 * part(s) that form reports as; only the matching one draws, in the shared
 * BarisHasil. `kalimat` is the page's own sentence for the result (Studio's
 * outcomeLine, Konfigurasi's result), never text from the address.
 *
 * E-K4 (D-173(d)): in a list whose rows each act, the row's own HasilDi (`baris`) answers that row; the list's line
 * (`barisDiHalaman`) answers only a result whose row is not on the page (a new version, a row that left the list).
 */
export default function HasilDi({
  q,
  bagian,
  kalimat,
  baris,
  barisDiHalaman,
}: {
  q: { bagian?: string; hasil?: string; baris?: string };
  bagian: string | readonly string[];
  kalimat: string | null;
  /** E-K4: this line belongs to one row of a list; it draws only for the result that names that row. */
  baris?: string;
  /** E-K4: for the list's own line, the rows on this page: a result naming one of them is drawn in that row instead. */
  barisDiHalaman?: readonly string[];
}) {
  const cocok = typeof bagian === "string" ? q.bagian === bagian : bagian.includes(q.bagian ?? "");
  if (!cocok || !q.hasil || !kalimat) return null;
  if (baris !== undefined ? q.baris !== baris : !!q.baris && !!barisDiHalaman?.includes(q.baris)) return null;
  return <BarisHasil nada={q.hasil === "ok" ? "ok" : "gagal"}>{kalimat}</BarisHasil>;
}
