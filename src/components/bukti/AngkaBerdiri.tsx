import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import type { Envelope } from "./types";

/**
 * AngkaBerdiri — a figure with its standing.
 *
 * S-3, the three-lens rule, made into a component: a number is never rendered
 * without the sentence that says what it MEANS, the sample it rests on, and
 * what to DO about it. The four parts arrive together or the component is the
 * wrong one to use — which is the point of it being a component rather than a
 * layout each surface repeats and each surface forgets a lens of.
 *
 * The action sentence is supplied by the caller, because what to do about a
 * figure depends on the rule that reads it, and that rule lives with the
 * surface. What this component guarantees is that the slot cannot be empty.
 */
export default function AngkaBerdiri({
  entry,
  value,
  action,
  locale = "id",
  persona = "educator",
}: {
  entry: Envelope;
  /** The figure as a human reads it. Pre-formatted, because only the caller
      knows whether it is a percentage, a count or a duration. */
  value: string;
  action: string;
  locale?: Locale;
  persona?: "educator" | "staff";
}) {
  const s = (k: string) => t(k as HleEvent, persona, { locale });
  const sample = entry.sample ?? entry.have;
  const needed = entry.needed;

  return (
    <div className="pin-metric">
      {entry.label_key ? <span className="pin-ml">{s(entry.label_key)}</span> : null}
      <span className="pin-mv pin-num">{value}</span>
      {entry.meaning_key ? <span className="pin-mm">{s(entry.meaning_key)}</span> : null}
      {sample != null ? (
        <span className="pin-ms pin-num">
          {t("bukti.dari", persona, { locale })} {format.number(sample, locale)}{" "}
          {t("bukti.murid", persona, { locale })}
          {needed != null
            ? ` · ${t("bukti.minimum", persona, { locale })} ${format.number(needed, locale)}`
            : ""}
        </span>
      ) : null}
      <span className="pin-ma">{action}</span>
    </div>
  );
}
