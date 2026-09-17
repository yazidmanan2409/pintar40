import { t, type HleEvent, type Locale } from "@/lib/hle";

/**
 * TahapKomitmen — the three stages of an act that changes something for
 * learners: set it up, look at what will happen, then do it.
 *
 * THE MIDDLE STAGE IS THE POINT. Slice 2 ruled that looking is not committing
 * for a learner entering an assessment; the same rule is what this strip makes
 * visible for an educator making something available. The review stage is a
 * page with no effect, and naming it as a stage of its own is how the educator
 * knows there is still a step between here and the learners.
 *
 * It is a strip of words, not a progress bar: three names, the current one
 * marked, the passed ones quieter. No percentage, because there is no
 * proportion of a decision.
 */
export default function TahapKomitmen({
  tahap,
  nama,
  locale = "id",
}: {
  /** Which stage is current, zero-based. */
  tahap: number;
  nama: [HleEvent, HleEvent, HleEvent];
  locale?: Locale;
}) {
  return (
    <ol className="pin-tahap">
      {nama.map((k, i) => (
        <li
          key={k}
          className={i < tahap ? "pin-done" : undefined}
          aria-current={i === tahap ? "step" : undefined}
        >
          {t(k, "educator", { locale })}
        </li>
      ))}
    </ol>
  );
}
