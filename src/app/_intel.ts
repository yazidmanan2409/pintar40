import { t, type HleEvent, type Locale } from "@/lib/hle";
import { variantOf, type Envelope } from "@/components/bukti";

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

/** The sentence a reader sees in place of a number. Never the status itself. */
export function omissionText(e: Entry, locale: Locale = "id"): string {
  if (e.statement_key) {
    const base = s(e.statement_key, "educator", locale);
    if (variantOf(e) === "belum_cukup" && e.needed != null) {
      return `${base} (${e.have ?? 0}/${e.needed})`;
    }
    return base;
  }
  return s("laporan.metrik.tidak_dikenal", "educator", locale);
}

/**
 * S-3, the 3-lens rule made mechanical: a number is never rendered without a
 * sentence saying what to do about it. This returns that sentence, and a metric
 * with no rule gets its own MEANING rather than nothing -- an unexplained
 * figure is the thing the rule forbids.
 */
export function actionText(e: Entry, locale: Locale = "id"): string {
  const v = typeof e.value === "number" ? e.value : Number(e.value);
  switch (e.label_key) {
    case "metrik.pemahaman.label":
      if (Number.isFinite(v)) return v < 0.6 ? s("tindakan.ulangi", "educator", locale) : s("tindakan.lanjut", "educator", locale);
      break;
    case "metrik.kenaikan.label":
    case "metrik.kenaikan_institusi.label":
      if (Number.isFinite(v)) return v <= 0 ? s("tindakan.ulangi", "educator", locale) : s("tindakan.lanjut", "educator", locale);
      break;
    case "metrik.kesiapan.label":
      // D-095: the bands' own sentence names them; the safety-gate figure keeps tindakan.fokus
      return s("tindakan.fokus_pita", "educator", locale);
    case "metrik.gerbang_keselamatan.label":
      if (Number.isFinite(v)) return v < 1 ? s("tindakan.fokus", "educator", locale) : s("tindakan.lanjut", "educator", locale);
      break;
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
