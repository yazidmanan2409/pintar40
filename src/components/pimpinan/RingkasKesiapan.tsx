import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import type { Envelope } from "@/components/bukti";
import { KESIAPAN_KUNCI, KESIAPAN_URUT, hitungKesiapan } from "@/lib/pimpinan-kontrak";

/**
 * EVIDENCE READINESS — three states, told apart, and none of them a result.
 *
 * WP3 SPLIT ONE WORD INTO TWO FACTS and the whole point is that they license
 * different sentences: "no qualifying evidence has arrived yet" is not "some
 * arrived and there is not enough of it", and neither is "this figure is low".
 * The distance between the second and the third is where the harm is — a reader
 * who sees a figure withheld will supply the missing interpretation themselves
 * unless the page supplies the true one first, which is what the note under
 * these counts is for.
 *
 * THE STATE IS READ, NOT COMPUTED. `kesiapan()` takes the evaluator's own
 * `readiness` field and never compares `have` with `needed`: the governed
 * minimum differs per interpretation — 1 for a participant count, 5 for
 * comprehension, 10 for an institution-wide outcome — and a second copy of that
 * policy in TypeScript would drift from the catalogue the first time a version
 * changed.
 *
 * THE GROUND IS ALWAYS `info`. Not `attention`, not `blocked`: a figure PINTAR
 * may not yet interpret is not a warning, and tinting it like one would say in
 * colour precisely what the copy refuses to say in words. A count of zero in a
 * state is simply not drawn, so an empty state never renders as a nought.
 */
export default function RingkasKesiapan({
  entries,
  locale = "id",
}: {
  entries: readonly Envelope[];
  locale?: Locale;
}) {
  const s = (key: string) => t(key as HleEvent, "staff", { locale });
  const hitung = hitungKesiapan(entries);
  const ada = KESIAPAN_URUT.filter((k) => hitung[k] > 0);

  if (ada.length === 0) return null;

  return (
    <section className="pin-sec pin-kesiapan" aria-labelledby="pin-kesiapan">
      <h2 id="pin-kesiapan">{s("pimpinan.kesiapan.judul")}</h2>
      <ul className="pin-kesiapan-list">
        {ada.map((k) => (
          <li key={k}>
            <span className="pin-num">{format.number(hitung[k], locale)}</span>
            <span className="pin-mm">{s(KESIAPAN_KUNCI[k])}</span>
          </li>
        ))}
      </ul>
      <p className="pin-mm">{s("pimpinan.kesiapan.catatan")}</p>
    </section>
  );
}
