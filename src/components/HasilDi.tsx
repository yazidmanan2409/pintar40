import BarisHasil from "./BarisHasil";

/**
 * HasilDi — A SAVE'S RESULT, AT THE FORM THAT SENT IT (DAISY-18, D-047).
 *
 * Every action reports which part of its page it answers (`bagian`, BOB-07's
 * queryHasil). A page places one of these next to each form, naming the
 * part(s) that form reports as; only the matching one draws, in the shared
 * BarisHasil. `kalimat` is the page's own sentence for the result (Studio's
 * outcomeLine, Konfigurasi's result), never text from the address.
 */
export default function HasilDi({
  q,
  bagian,
  kalimat,
}: {
  q: { bagian?: string; hasil?: string };
  bagian: string | readonly string[];
  kalimat: string | null;
}) {
  const cocok = typeof bagian === "string" ? q.bagian === bagian : bagian.includes(q.bagian ?? "");
  if (!cocok || !q.hasil || !kalimat) return null;
  return <BarisHasil nada={q.hasil === "ok" ? "ok" : "gagal"}>{kalimat}</BarisHasil>;
}
