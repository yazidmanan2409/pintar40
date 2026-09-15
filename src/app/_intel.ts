import { t, type HleEvent } from "@/lib/hle";

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
 */
export type Entry = {
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

export const s = (k: string, persona: "educator" | "staff" = "educator") =>
  t(k as HleEvent, persona);

/** The sentence a reader sees in place of a number. Never the status itself. */
export function omissionText(e: Entry): string {
  if (e.statement_key) {
    const base = s(e.statement_key);
    if (e.status === "below_minimum" && e.needed != null) {
      return `${base} (${e.have ?? 0}/${e.needed})`;
    }
    return base;
  }
  return s("laporan.metrik.tidak_dikenal");
}

/**
 * S-3, the 3-lens rule made mechanical: a number is never rendered without a
 * sentence saying what to do about it. This returns that sentence, and a metric
 * with no rule gets its own MEANING rather than nothing -- an unexplained
 * figure is the thing the rule forbids.
 */
export function actionText(e: Entry): string {
  const v = typeof e.value === "number" ? e.value : Number(e.value);
  switch (e.label_key) {
    case "metrik.pemahaman.label":
      if (Number.isFinite(v)) return v < 0.6 ? s("tindakan.ulangi") : s("tindakan.lanjut");
      break;
    case "metrik.kenaikan.label":
    case "metrik.kenaikan_institusi.label":
      if (Number.isFinite(v)) return v <= 0 ? s("tindakan.ulangi") : s("tindakan.lanjut");
      break;
    case "metrik.kesiapan.label":
      return s("tindakan.fokus");
    case "metrik.gerbang_keselamatan.label":
      if (Number.isFinite(v)) return v < 1 ? s("tindakan.fokus") : s("tindakan.lanjut");
      break;
  }
  return e.meaning_key ? s(e.meaning_key) : s("tindakan.tunggu");
}

/** Readiness tier keys are HLE keys already; the enum never appears. */
export function tierLabel(key: string): string {
  return s(key);
}

export const card = "rounded-xl border border-black/10 bg-white p-4 shadow-sm";
