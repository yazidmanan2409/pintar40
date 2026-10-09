import { format, t, type HleEvent, type Locale } from "@/lib/hle";
import { nilaiIsi, nilaiMetrik, urutkanPita } from "@/lib/nilai-metrik";
import type { Envelope } from "./types";
import PopulasiKelas from "./PopulasiKelas";

/**
 * W9 (J7.3, J7.4) — A FIGURE AS A READER READS IT, ROWS INCLUDED.
 *
 * The report pages printed a figure's raw value (`0.75`), a distribution's raw
 * counts beside raw keys, a cohort row with nothing in it (its rows carry a
 * node id and no label) and a competency row with its name and no score. This
 * draws each kind by what it is: one figure through `nilaiMetrik`; a
 * distribution's rows through `nilaiIsi` (a readiness tier by its own label);
 * a cohort row by the place's visible name with its mean mastery and learners;
 * a competency row with its mean score and learners; a misconception row with
 * its remediation, as before. Nothing here computes: every value is the
 * evaluator's.
 */
type Baris = Record<string, unknown>;

export default function NilaiLaporan({ entry, locale, tempat = {} }: {
  entry: Envelope;
  locale: Locale;
  /** The visible name of each place a row names (cohort rows), by id. */
  tempat?: Readonly<Record<string, string>>;
}) {
  const s = (k: string) => t(k as HleEvent, "educator", { locale });
  const v = entry.value;
  const murid = s("mengajar.bukti.murid");
  const persen = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? format.percent(x, locale) : "—");
  const jumlah = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? `${format.number(x, locale)} ${murid}` : null);

  if (Array.isArray(v)) {
    return (
      <ul className="pin-lap-baris">
        {(v as Baris[]).slice(0, 8).map((row, i) => {
          if (typeof row.cohort_node_id === "string") {
            return (
              <li key={i}>
                <span>{tempat[row.cohort_node_id] ?? "—"}</span>
                <span className="pin-num">{[persen(row.mean_mastery), jumlah(row.learners)].filter(Boolean).join(" · ")}</span>
              </li>
            );
          }
          if (typeof row.competency === "string") {
            return (
              <li key={i}>
                <span>{row.competency}</span>
                <span className="pin-num">{[persen(row.mean_score), jumlah(row.learners)].filter(Boolean).join(" · ")}</span>
              </li>
            );
          }
          return (
            <li key={i}>
              <span>{String(row.label ?? row.code ?? "")}</span>
              {row.remediation ? <span className="pin-meta">{String(row.remediation)}</span> : null}
            </li>
          );
        })}
      </ul>
    );
  }

  if (v !== null && typeof v === "object") {
    // D-095: PINTAR's fixed performance bands in band order, with the line that says what they are not
    const baris = urutkanPita(Object.entries(v as Record<string, unknown>));
    const pita = baris.some(([k]) => k.startsWith("kesiapan."));
    return (
      <>
      {/* CR-81 (GQ1, 11-validation.md §4): the bands' heading names the population they are drawn over */}
      {pita && entry.population ? (
        <p className="pin-ml">{s("kesiapan.pita.judul").replace("{n}", format.number(Number(entry.population.assessed) || 0, locale))}</p>
      ) : null}
      <dl className="pin-lap-isi">
        {baris.map(([k, n]) => (
          <div key={k}>
            {/* tier keys are copy keys; the readiness enum never renders */}
            <dt>{k.startsWith("kesiapan.") ? s(k) : k}</dt>
            <dd className="pin-num">{nilaiIsi(entry.metric_id, n, locale)}</dd>
          </div>
        ))}
      </dl>
      {pita ? <p className="pin-meta">{s("kesiapan.catatan")}</p> : null}
      {/* CR-81 (D-123(3)): the class's population, apart from the bands */}
      <PopulasiKelas populasi={entry.population} locale={locale} />
      </>
    );
  }

  return <p className="pin-lap-satu pin-num">{nilaiMetrik(entry.metric_id, v, locale)}</p>;
}
