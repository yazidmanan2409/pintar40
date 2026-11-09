import { t, type HleEvent, type Locale } from "@/lib/hle";
import type { Envelope } from "@/components/bukti";

/**
 * Shared reading of a report envelope for the FABLE-06 surfaces.
 *
 * THE ENVELOPE NEVER REACHES A SCREEN. `metric_evaluate` returns a `status` --
 * `ok`, `below_minimum`, `deprecated`, `not_permitted`, `unavailable` -- and
 * every one of those is an internal word. This module is the only place that
 * reads them, and it converts each into an HLE key before anything renders.
 *
 * S-2: "we looked and there is not enough yet" and "this is not for you" are
 * DIFFERENT SENTENCES, because they are different facts about the world. The
 * database already distinguishes them; losing that distinction in the telling
 * would be the surface undoing the work the evaluator did.
 *
 * UX-1 SLICE 0. The envelope type and the four-way absence reading now live
 * with the evidence components in `src/components/bukti`, and this module is
 * the adapter onto them: one definition of the envelope, one definition of
 * which absence a status is. The report surfaces themselves are Slice 6's and
 * are unchanged here -- they keep this module's exports, which is why the
 * exports kept their names.
 */
export type Entry = Envelope;

export const s = (k: string, persona: "educator" | "staff" = "educator", locale: Locale = "id") =>
  t(k as HleEvent, persona, { locale });

/**
 * The sentence a reader sees in place of a number. Never the status itself, and never «(0/5)» (W3.9, RV-9; CR-46):
 * how far a figure is from appearing is its own sentence, `kalimatJumlah` («Sekarang 3 murid; perlu 5.»), drawn
 * beside this one where the evidence counted is students.
 */
export function omissionText(e: Entry, locale: Locale = "id"): string {
  return s(e.statement_key ?? "laporan.metrik.tidak_dikenal", "educator", locale);
}

/**
 * S-3, the 3-lens rule made mechanical: a number is never rendered without a sentence beside it. OWNER RULING O1
 * (9 Nov) with Daisy's lines (KESIAPAN-LAPORAN-5cca6a5f §5): the sentence says where the figure's explanation is in
 * PINTAR, never a teaching act, and it is the SAME whatever the value, so two figures can never give opposite
 * directions («Ulangi…» beside «Tidak perlu diulang…» was the defect). The educator decides the next step; the page
 * says so once (laporan.anda_memutuskan). A figure with no value keeps its own «not yet» sentence (omissionText), so
 * insufficient evidence is still told apart from a finding. A metric with no line gets its own MEANING.
 */
export function actionText(e: Entry, locale: Locale = "id"): string {
  switch (e.label_key) {
    case "metrik.pemahaman.label":
      return s("tindakan.lihat_topik", "educator", locale);
    case "metrik.kenaikan.label":
    case "metrik.kenaikan_institusi.label":
      return s("tindakan.baca_kenaikan", "educator", locale);
    case "metrik.kesiapan.label":
      // the bands are what supports naming who is in «Perlu penguatan» (section E): a place, not an instruction
      return s("tindakan.lihat_nama", "educator", locale);
    case "metrik.gerbang_keselamatan.label":
      return s("tindakan.lihat_soal", "educator", locale);
  }
  return e.meaning_key ? s(e.meaning_key, "educator", locale) : s("tindakan.tunggu", "educator", locale);
}

/** Readiness tier keys are HLE keys already; the enum never appears. */
export function tierLabel(key: string, locale: Locale = "id"): string {
  return s(key, "educator", locale);
}

/**
 * L-8, repaired. This class string carried four untokenized values --
 * `rounded-xl`, `border-black/10`, `bg-white` and `shadow-sm` -- into every
 * report card on two surfaces. Three of them had no token behind them at all
 * and the fourth, the shadow, is not in the design language: UX-0-07 has no
 * elevation, because a calm surface separates by hairline and ground rather
 * than by float. It is now the evidence card the components render, so the two
 * report surfaces move to token set v2 without their markup changing.
 */
export const card = "pin-metric";
