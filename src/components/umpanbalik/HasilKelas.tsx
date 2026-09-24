import { t, format, type HleEvent, type Locale, type Persona } from "@/lib/hle";
import { bagian, type Hasil } from "@/lib/umpanbalik-kontrak";

/**
 * WHAT ONE CLASS SAID — the only surface in PINTAR that renders a feedback
 * figure, and the only one that could.
 *
 * ═══ ONE COMPONENT FOR THE SUBJECT AND FOR MANAGEMENT, ON PURPOSE ═══
 *
 * §14 says Management consumes the same governed snapshot as the educator, at
 * the same grain: one class, one subject. Two components would be two chances
 * for one of them to show a little more than the other, and the one that showed
 * more would be the one nobody was watching. So there is one, it takes the
 * result and nothing else, and it has no prop that could widen it — no reader
 * role, no "detailed" flag, no toggle.
 *
 * ═══ THREE CASES, AND TWO OF THEM HAVE NO NUMBER TO PRINT ═══
 *
 * The result arrives as a discriminated union, so this component cannot reach
 * past the case it is in: while a cycle is collecting and after one that closed
 * below the anonymity threshold, there is no `total` and no `entri` in scope AT
 * ALL. That is the difference between a surface that chooses not to show a
 * figure and one that has none — and it is why the suppression guard can assert
 * the rendered output of those two states carries no response-derived digit
 * rather than having to enumerate the places a digit might appear.
 *
 * ═══ THE WITHHELD SENTENCE STANDS ALONE ═══
 *
 * It is rendered from the key WP7B bound to the cycle and NOTHING is appended
 * to it. Not a count, not a requirement, not a proportion, not "nearly there",
 * and deliberately not `KartuKetiadaan` — which exists for a statistical
 * readiness floor and appends `have/needed` because a reader who knows a measure
 * needs five and has three can act on that. Here the missing number is the
 * secret. Same shape of absence, opposite obligation.
 *
 * ═══ AND NOTHING HERE IS A VERDICT ═══
 *
 * Five marginals, each option with the count that chose it. No mean of the
 * four-point scale, no composite, no "overall", no comparison with another
 * class or another educator, no band, no colour that means good or bad. The
 * bars are one neutral tone and the count is always written beside them, so the
 * figure never lives in the bar's length alone.
 */
export default function HasilKelas({
  hasil,
  locale = "id",
  persona = "educator",
}: {
  hasil: Hasil;
  locale?: Locale;
  persona?: Persona;
}) {
  const s = (k: string) => t(k as HleEvent, persona, { locale });

  // ── STILL COLLECTING. One sentence. No figure exists in this branch.
  if (hasil.jenis === "terkumpul") {
    return (
      <p className="pin-msg pin-msg-note pin-ub-pernyataan" role="status">
        {s(hasil.kunciPernyataan)}
      </p>
    );
  }

  // ── WITHHELD. The canonical statement, whole, with nothing after it.
  if (hasil.jenis === "ditahan") {
    return (
      <p className="pin-msg pin-msg-note pin-ub-pernyataan" role="status">
        {s(hasil.kunciPernyataan)}
      </p>
    );
  }

  return (
    <div className="pin-ub-hasil">
      {/* THE FINAL TOTAL, WHICH IS A PUBLISHED FACT RATHER THAN A RUNNING ONE.
          It exists only because the cycle closed above the threshold; there was
          never a moment in this product when a reader could watch it rise. */}
      <p className="pin-meta">
        {s("umpanbalik.hasil.total")}{": "}
        <span className="pin-num">{format.number(hasil.total, locale)}</span>
      </p>
      <p className="pin-mm">{s("umpanbalik.hasil.arti")}</p>

      <ol className="pin-ub-daftar">
        {hasil.entri.map((q) => (
          <li key={q.question_key}>
            <h3 className="pin-ml">{s(q.label_key)}</h3>
            <ul className="pin-ub-marginal">
              {q.options.map((o) => {
                const lebar = bagian(o.responses, hasil.total);
                return (
                  <li key={o.option_key}>
                    <span className="pin-ub-label">{s(o.label_key)}</span>
                    {/* The bar is decoration for a number that is already
                        written: a reader who cannot see it, or cannot tell the
                        tones apart, loses nothing. */}
                    <span className="pin-ub-batang" aria-hidden="true">
                      <span style={{ width: `${lebar}%` }} />
                    </span>
                    <span className="pin-num pin-ub-angka">
                      {format.number(o.responses, locale)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
