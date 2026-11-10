import Link from "next/link";
import { t, format, type Locale } from "@/lib/hle";
import type { Orientation } from "@/lib/assessment-engine/types";
import { tanggal } from "@/lib/tanggal";

/**
 * SCREEN D — ORIENTATION BEFORE COMMITMENT.
 *
 * What a learner may know before the act that starts an assessment: what it
 * is, how many questions, when it closes, what they will be able to do inside
 * it, and how session activity is recorded. Then one button that starts it and
 * one way back out.
 *
 * LOOKING IS NOT COMMITTING (ruled 2026-09-17). Rendering this page reads
 * `assessment_orientation()`, which creates no session, stamps no `started_at`
 * and spends no attempt. The start is a FORM POST rather than a link, on
 * purpose: a link is something a router prefetches, a browser pre-renders and
 * a learner's thumb brushes on a scroll, and any of those would silently spend
 * the single attempt a PAPER assessment allows. The commitment needs a verb.
 *
 * NO DURATION, AND NONE DERIVED (ruled 2026-09-17). The reviewed concept
 * carried an estimated time. No legitimate duration fact exists, and a
 * plausible-looking number is worse than no number: a learner arranges their
 * afternoon around "40 minutes" and the arrangement is the product's fault.
 * `Orientation` has no such field, and this component computes none from item
 * count, hesitation window or anything else.
 *
 * THE CALLER DECIDES WHETHER THIS RENDERS AT ALL. `assessment_orientation()`
 * is gated by `may_start_assessment()` and returns no row when the learner may
 * not begin, so a page that has no orientation shows the refusal — never a
 * disabled version of this screen, which would be an orientation for something
 * that cannot be entered.
 */
export default function OrientasiAsesmen({
  orientasi,
  locale,
  mode,
  eyebrow,
  judul,
  mulai,
  kembali,
  zona,
}: {
  orientasi: Orientation;
  locale: Locale;
  /** The assessment's school's zone (the owner's ruling, 10 Nov): its closing day on that clock; WIB when none. */
  zona?: string | null;
  /**
   * DAISY-25: which assessment this introduces. The Pemetaan Awal is not a test
   * of the learner, and says so (`pretest.intro`); the Uji Penguasaan has its
   * own line (`posttest.intro`). It used to show the post-test's line for both.
   */
  mode: "PEMETAAN" | "PENGUASAAN";
  /** Course and chapter — where this assessment sits. */
  eyebrow: string;
  /** What this assessment is called to a learner. */
  judul: string;
  /** The form that starts it. A POST, never a link. */
  mulai: React.ReactNode;
  /** The way out, which is always offered. */
  kembali: { href: string; label: string };
}) {
  const s = (k: Parameters<typeof t>[0]) => t(k, "learner", { locale });

  // Only affordances that actually exist. Pause is shown when the definition
  // allows it and hidden when it does not, rather than promised and refused.
  const bisa: Array<Parameters<typeof t>[0]> = ["siklus.bisa.tandai"];
  if (orientasi.allows_pause) bisa.push("siklus.bisa.jeda");
  if (orientasi.hesitation_window_seconds != null) bisa.push("siklus.bisa.arah");

  return (
    <>
      <div className="pin-head">
        <p className="pin-eyebrow">{eyebrow}</p>
        <h1 className="pin-h1">{judul}</h1>
        <p className="pin-intro">{s(mode === "PEMETAAN" ? "pretest.intro" : "posttest.intro")}</p>
      </div>

      <div className="pin-orient">
        {/* The facts that are true: how many questions, and when it closes.
            Rendered through the same compact fact summary the certificate and
            the commitment shell use, so it stacks on a narrow surface without
            restating the rule. */}
        <dl className="pin-facts">
          <div>
            <dt>{s("siklus.jumlah_soal")}</dt>
            <dd className="pin-num">{format.number(orientasi.item_count, locale)}</dd>
          </div>
          {orientasi.closes_at ? (
            <div>
              <dt>{s("siklus.ditutup")}</dt>
              <dd className="pin-num">{tanggal(orientasi.closes_at, "hari", locale, zona)}</dd>
            </div>
          ) : null}
        </dl>

        <div>
          <p className="pin-eyebrow">{s("siklus.bisa_lakukan")}</p>
          <ul className="pin-bisa">
            {bisa.map((k) => (
              <li key={k}>{s(k)}</li>
            ))}
          </ul>
        </div>

        {/* Q-15, VERBATIM AS RULED. A quiet paragraph on the well, never an
            alert: the ruling says these records are observation and not
            judgment, and a bordered warning box would say the opposite of the
            words inside it. No category is listed and no device is named. */}
        <div className="pin-catatan">
          <strong>{s("siklus.catatan.judul")}</strong>
          {s("siklus.catatan.isi")}
        </div>

        <div className="pin-actions">
          {mulai}
          <Link className="pin-btn" href={kembali.href}>
            {kembali.label}
          </Link>
        </div>
      </div>
    </>
  );
}
