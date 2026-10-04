import { t, format, type HleEvent, type Locale } from "@/lib/hle";

export type NamaDicatat = { baris: number; nama: string; peran: string; baru: boolean };

/**
 * D-077(3), DAISY-20: THE COMPLETE LIST OF NAMES, before the one approval.
 *
 * Every row of the intake, in its row order, with the name exactly as it will
 * be recorded and the role it is recorded with: not a sample, because the
 * point is to catch a misspelt name before it becomes a person's record. A
 * row for a person already registered says so, as the count above does.
 *
 * A LARGE INTAKE SCROLLS INSIDE ITS OWN BOX, so the approval below stays one
 * scroll away, and the box is a labelled region that takes keyboard focus, so
 * it can be scrolled without a pointer.
 *
 * The copy never says a name appears on a card: students have no PINTAR card
 * in 4.0 (C17).
 *
 * Presentational, so the guard renders it as drawn.
 */
export default function DaftarNama({ locale, nama }: { locale: Locale; nama: NamaDicatat[] }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  return (
    <>
      <h3 id="pin-data-nama" className="pin-ml">{s("pendataan.nama.judul")}</h3>
      <p className="pin-meta">{s("pendataan.nama.arti")}</p>
      <div className="pin-data-nama" role="region" aria-labelledby="pin-data-nama" tabIndex={0}>
        <ol className="pin-list">
          {nama.map((r) => (
            <li key={r.baris}>
              <span className="pin-num">{format.number(r.baris, locale)}</span>
              <span className="pin-data-nama-nama">{r.nama}</span>
              <span className="pin-data-nama-peran">
                {t(`role.${r.peran}` as HleEvent, "staff", { locale })}
                {r.baru ? null : <> · {s("pendataan.nama.sudah")}</>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
