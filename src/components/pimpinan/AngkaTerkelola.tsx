import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import type { Envelope } from "@/components/bukti";

/**
 * A GOVERNED FIGURE ON THE MANAGEMENT SURFACE — label, value, meaning, sample.
 *
 * WHY THIS IS NOT `AngkaBerdiri`, WHICH ALREADY EXISTS AND IS THE RIGHT SHAPE.
 * `AngkaBerdiri` guarantees a fourth slot: what to DO about the figure. On the
 * educator's evidence screen that slot is filled by `actionText()`, which picks
 * a sentence by comparing the value with 0.6, with 0 and with 1. Those three
 * numbers are the SURFACE's, not the catalogue's — no `metric_definitions` row
 * declares them — and on a class screen read by the teacher of that class they
 * are a teaching heuristic the teacher can weigh.
 *
 * On a Management screen the same sentence becomes something else. "Ulangi
 * bagian ini" under a department's comprehension figure is PINTAR telling a dean
 * what a department should do, on a threshold no contract carries, about
 * educators and learners the dean can act on. WP4 forbids exactly that: no
 * unsupported causal statement, and no interpretation the backend did not make.
 *
 * SO THE THIRD LENS MOVES RATHER THAN DISAPPEARING. What to do about something
 * lives on this surface in the decision chain — "LANGKAH YANG MUNGKIN", written
 * per decision family and attached to a decision a human is actually being asked
 * to make. A figure here carries the catalogue's own MEANING and stops there,
 * which is the most PINTAR knows about it.
 *
 * THE SAMPLE IS PART OF THE FIGURE, not a footnote to it: a number that arrived
 * with its evidence count is a number a reader can weigh, and WP3's whole
 * distinction is about how much qualifying evidence stands behind a claim.
 */
export default function AngkaTerkelola({
  entry,
  value,
  locale = "id",
}: {
  entry: Envelope;
  /** Pre-formatted, because only the caller knows the unit. */
  value: string;
  locale?: Locale;
}) {
  const s = (k: string) => t(k as HleEvent, "staff", { locale });
  const sample = entry.sample ?? entry.have;

  return (
    <div className="pin-metric">
      {entry.label_key ? <span className="pin-ml">{s(entry.label_key)}</span> : null}
      <span className="pin-mv pin-num">{value}</span>
      {entry.meaning_key ? <span className="pin-mm">{s(entry.meaning_key)}</span> : null}
      {typeof sample === "number" ? (
        <span className="pin-meta">
          {s("pimpinan.bukti.dari")} {format.number(sample, locale)}
        </span>
      ) : null}
    </div>
  );
}
