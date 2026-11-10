import { t, format, type HleEvent, type Locale } from "@/lib/hle";

/**
 * BarisKesiapan — one readiness tier, as a row.
 *
 * NO STATUS COLOUR, and that is the whole design. A readiness tier is a place a
 * child is standing today, not a verdict on them: painting "butuh pendampingan
 * ekstra" in the blocked red would tell a teacher glancing at a classroom
 * display which children are the problem. The bar is ink-3 for every tier, so
 * the distribution reads as a shape rather than as an alarm.
 *
 * The tier word comes from an HLE key (`kesiapan.*`), never from the enum.
 *
 * DAISY-25: A TOPIC IS NAMED BY THE CONTENT, NOT BY THE COPY TABLE. The same row
 * draws a class's mastery per topic (`calc_class_topic_mastery`). Its keys are
 * the content's own labels, not copy keys: looked up in the copy table they all
 * read "—", so a topic row passes `label`, shown as the content gives it.
 * (Corrected in POLISH3: those keys were learning-objective CODES. Since MC-4,
 * D-088(g), a topic row is the objective's own statement, one row per objective.)
 */
export default function BarisKesiapan({
  tierKey,
  label,
  count,
  total,
  locale = "id",
  persona = "educator",
  pernyataan,
}: ({ tierKey: string; label?: never } | { label: string; tierKey?: never }) & {
  /** V2 (Daisy's N3): where the label is a lesson's short title, the objective's statement on its own line under it */
  pernyataan?: string;
  count: number;
  total: number;
  locale?: Locale;
  persona?: "educator" | "staff";
}) {
  const share = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="pin-rrow">
      <span>
        {label !== undefined ? label : t(tierKey as HleEvent, persona, { locale })}
        {pernyataan ? <span className="pin-lk-pernyataan">{pernyataan}</span> : null}
      </span>
      <span className="pin-num" style={{ textAlign: "right" }}>
        {format.number(count, locale)}
      </span>
      {/* the only inline value in the component: a computed proportion, which
          is data rather than a design decision (token lint exemption) */}
      <div className="pin-rbar">
        <i style={{ width: `${share.toFixed(1)}%` }} />
      </div>
    </div>
  );
}
