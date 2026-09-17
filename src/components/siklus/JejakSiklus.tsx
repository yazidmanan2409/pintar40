import { t, type Locale } from "@/lib/hle";
import { LANGKAH, LANGKAH_KEY, type Posisi } from "@/lib/siklus";

/**
 * THE CYCLE TRAIL. Where the learner is in five steps, and nothing else.
 *
 * Filled = behind them, ring = here, hollow = not yet. NO STATUS COLOUR
 * anywhere in it: a learner part-way through a cycle is not in a warning
 * state, they are part-way through, and an amber step would tell them
 * otherwise about their own ordinary progress.
 *
 * It is a LIST, not a navigation. The steps are not links — a trail that can
 * be clicked is a menu pretending to be a map, and the one next action lives
 * in the panel above it. Screen readers get the position as words through
 * `aria-current` and the status line that always sits directly below.
 *
 * On a phone the names are dropped by CSS, not by markup: the dots keep
 * "where in five" and the status line under the trail carries "which one",
 * so nothing is hidden that is not said in words a line further down.
 */
export default function JejakSiklus({ posisi, locale }: { posisi: Posisi; locale: Locale }) {
  return (
    <ol className="pin-jejak">
      {LANGKAH.map((langkah, i) => {
        const done = i < posisi.indeks;
        const now = i === posisi.indeks;
        return (
          <li
            key={langkah}
            className={`pin-jstep${done ? " pin-done" : ""}${now ? " pin-now" : ""}`}
            aria-current={now ? "step" : undefined}
          >
            <span className="pin-dot" aria-hidden="true" />
            <span className="pin-jname">{t(LANGKAH_KEY[langkah], "learner", { locale })}</span>
          </li>
        );
      })}
    </ol>
  );
}
