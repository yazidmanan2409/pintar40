import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import type { Envelope } from "./types";

/**
 * KartuKetiadaan — the absence card, in four variants.
 *
 * S-2: "we looked and there is not enough yet" and "this is not for you" are
 * DIFFERENT SENTENCES, because they are different facts about the world. The
 * database already distinguishes them; a card that flattened them into "no
 * data" would be the surface undoing the work the evaluator did.
 *
 *   belum_cukup      the measurement ran and the sample is short — and it says
 *                    how short, because a reader who knows it needs five of
 *                    five and has three can act on that
 *   tidak_untuk_anda NO LABEL. Naming the metric would tell a reader exactly
 *                    what is being withheld from them, which is the leak the
 *                    refusal exists to prevent (it is why this variant renders
 *                    without a heading rather than with a greyed one)
 *   diganti          the figure was superseded by a newer measure
 *   menunggu         it is being calculated; come back
 *
 * The variant is DERIVED from the envelope's status, never passed in, so a
 * surface cannot choose a gentler sentence than the fact deserves.
 */
export type Variant = "belum_cukup" | "tidak_untuk_anda" | "diganti" | "menunggu";

export function variantOf(entry: Envelope): Variant {
  switch (entry.status) {
    case "below_minimum": return "belum_cukup";
    case "not_permitted": return "tidak_untuk_anda";
    case "deprecated": return "diganti";
    default: return "menunggu";
  }
}

const STATEMENT: Record<Variant, string> = {
  belum_cukup: "laporan.metrik.belum_cukup_data",
  tidak_untuk_anda: "laporan.metrik.bukan_untuk_anda",
  diganti: "laporan.metrik.diganti",
  menunggu: "laporan.metrik.tidak_dikenal",
};

export default function KartuKetiadaan({
  entry,
  action,
  locale = "id",
  persona = "educator",
}: {
  entry: Envelope;
  /** Optional: what to do while the figure is absent. */
  action?: string;
  locale?: Locale;
  persona?: "educator" | "staff";
}) {
  const s = (k: string) => t(k as HleEvent, persona, { locale });
  const variant = variantOf(entry);
  // The envelope's own statement key wins when it carries one: the evaluator
  // knows more about why this particular figure is missing than a variant map.
  const base = s(entry.statement_key ?? STATEMENT[variant]);
  const counted =
    variant === "belum_cukup" && entry.needed != null
      ? `${base} (${format.number(entry.have ?? 0, locale)}/${format.number(entry.needed, locale)})`
      : base;

  return (
    <div className="pin-metric">
      {/* No heading for `tidak_untuk_anda`: see the note above. */}
      {variant !== "tidak_untuk_anda" && entry.label_key ? (
        <span className="pin-ml">{s(entry.label_key)}</span>
      ) : null}
      <span className="pin-abs">{counted}</span>
      {action ? <span className="pin-ma">{action}</span> : null}
    </div>
  );
}
