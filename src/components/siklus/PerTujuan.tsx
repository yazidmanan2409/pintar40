import { t, format, type Locale } from "@/lib/hle";
import type { Outcome, ReadingMapCard } from "@/lib/assessment-engine/types";

/**
 * POLISH3 (UX-26): HOW IT WENT, OBJECTIVE BY OBJECTIVE, EACH BY ITS NAME.
 *
 * The result's per-objective counts (`session_outcome().per_domain`) are keyed
 * by the learning objective's code: «B1P1» for an uploaded workbook, «MTK5-P1»
 * for seeded content. A learner read that code as the row's name. The name is
 * the objective's own statement, the same sentence the reading map shows, and
 * the learner can already read it: the engine's reading map of their own
 * session (engine.readingMap) returns each objective of the session's items
 * with its code and statement. Both are built from the same items, so every
 * row finds its name there.
 *
 * The heading says what the rows are, «Per tujuan pembelajaran» (the
 * workbook's own column), no longer «Per bagian»: a Bagian is a unit of the
 * school's structure (D-006).
 */
export default function PerTujuan({
  perDomain,
  peta,
  locale,
}: {
  perDomain: Outcome["per_domain"] | null | undefined;
  peta: readonly Pick<ReadingMapCard, "kode" | "pernyataan" | "pelajaran">[];
  locale: Locale;
}) {
  const baris = Object.entries(perDomain ?? {});
  if (baris.length === 0) return null;
  const nama = namaTujuan(peta);
  return (
    <section className="pin-sec">
      <h2>{t("hasil.domain", "learner", { locale })}</h2>
      <div className="pin-domain">
        {baris.map(([kode, d]) => (
          <div className="pin-drow" key={kode} data-tujuan={kode}>
            <span>{nama.get(kode) ?? kode}</span>
            <span className="pin-cnt pin-num">
              {format.number(d.benar, locale)}/{format.number(d.total, locale)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Each code's name: its statement, or its lesson's title when the statement is
 * empty. A code shared by two objectives with different statements (the
 * outcome counts them as one row) has no single name, and neither has a code
 * the map does not carry: those rows keep the code, the one true label left.
 */
export function namaTujuan(
  peta: readonly Pick<ReadingMapCard, "kode" | "pernyataan" | "pelajaran">[],
): Map<string, string> {
  const calon = new Map<string, Set<string>>();
  for (const k of peta) {
    const n = (k.pernyataan ?? "").trim() || (k.pelajaran ?? "").trim();
    if (!k.kode || !n) continue;
    calon.set(k.kode, (calon.get(k.kode) ?? new Set()).add(n));
  }
  const nama = new Map<string, string>();
  for (const [kode, n] of calon) if (n.size === 1) nama.set(kode, [...n][0]);
  return nama;
}
