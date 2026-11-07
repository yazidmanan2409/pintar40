import { format, t, type HleEvent, type Locale } from "@/lib/hle";
import type { Envelope } from "@/components/bukti";
import { persenJujur } from "@/components/laporan/KomposisiKelas";

/**
 * CONTOH LAPORAN 3-kadep (Daisy, «DESIGN DIRECTION APPROVED», 7 Nov): TOPICS × CLASSES, FOR A PATTERN OR ONE CLASS.
 *
 * A head of department's question is whether a difficulty is a pattern across the branch or one class. Each cell is
 * that class's own «Penguasaan per topik» figure, the envelope its teacher's report reads, re-authorized for this
 * reader: its value, a short bar on 0–100% and the class's own target tick; below its target it is amber AND says
 * «di bawah target» (G-03). Reading across a row shows a pattern; reading down a column shows one class. Drawn with
 * no colour ramp, so it needs no new token. A class without enough evidence says so in its column, never as a low
 * value; a class whose figure the reader may not see is left out without a word about it (the refusal discloses
 * nothing). Classes only, named by class, never by teacher; no student. The table IS its text equivalent.
 *
 * The lead sentence counts only: the topics below their target in more than half of the classes that have the
 * figure. Nothing is summed or averaged across classes (WP7C).
 */
type Baris = { objective_id?: string | null; code?: string; competency?: string; mean_score?: number };
export type KolomKisi = { id: string; nama: string; topik: Envelope | null | undefined; target: number | null | undefined };

export function susunKisi(kolom: readonly KolomKisi[]) {
  const ada = kolom.filter((k) => k.topik && k.topik.status !== "not_permitted" && k.topik.status !== "unavailable");
  const baris = new Map<string, string>();
  const nilai = new Map<string, Map<string, number>>();
  for (const k of ada) {
    if (k.topik?.status !== "ok" || !Array.isArray(k.topik.value)) continue;
    const isi = new Map<string, number>();
    for (const b of k.topik.value as Baris[]) {
      const kunci = b.objective_id ?? b.code ?? b.competency ?? "";
      if (!kunci || typeof b.mean_score !== "number") continue;
      if (!baris.has(kunci)) baris.set(kunci, b.competency ?? kunci);
      isi.set(kunci, b.mean_score);
    }
    nilai.set(k.id, isi);
  }
  const berangka = ada.filter((k) => nilai.has(k.id));
  // a pattern: below its own target in more than half of the classes that have the figure and a target
  const pola = [...baris.entries()].filter(([kunci]) => {
    const ukur = berangka.filter((k) => typeof k.target === "number" && nilai.get(k.id)!.has(kunci));
    const bawah = ukur.filter((k) => nilai.get(k.id)!.get(kunci)! < (k.target as number));
    return ukur.length >= 2 && bawah.length * 2 > ukur.length;
  }).map(([, nama]) => nama);
  return { kolom: ada, baris: [...baris.entries()], nilai, pola, berangka: berangka.length };
}

export default function KisiTopik({ kolom, locale }: { kolom: readonly KolomKisi[]; locale: Locale }) {
  const s = (k: string) => t(k as HleEvent, "staff", { locale });
  const { kolom: ada, baris, nilai, pola, berangka } = susunKisi(kolom);
  if (ada.length === 0) return null;
  return (
    <section className="pin-lk pin-lk-kisi" aria-labelledby="pin-kisi" data-lk="kisi">
      <div className="pin-lk-inti">
        <h2 className="pin-lk-h" id="pin-kisi"><span className="pin-lk-huruf" aria-hidden="true">A</span><span>{s("metrik.topik.label")}</span></h2>
        {berangka > 0 ? (
          <p className="pin-lk-kalimat" data-lk-kalimat="">
            {pola.length > 0 ? s("laporan.kisi.pola").replace("{daftar}", pola.join("; ")) : s("laporan.kisi.tanpa_pola")}
          </p>
        ) : null}
        <p className="pin-lk-arti">{s("laporan.kisi.arti")}</p>
        {/* a narrow screen scrolls the grid sideways: the region takes keyboard focus so it can be scrolled without a mouse (axe scrollable-region-focusable) */}
        <div className="pin-lk-kisi-wadah" role="region" tabIndex={0} aria-labelledby="pin-kisi">
          <table className="pin-lk-tabel pin-lk-kisi-tabel">
            <thead>
              <tr>
                <th scope="col">{s("laporan.komposisi.kolom_topik")}</th>
                {ada.map((k) => (
                  <th key={k.id} scope="col">
                    {k.nama}
                    {typeof k.target === "number" ? <small>{s("laporan.komposisi.target").replace("{p}", format.percent(k.target, locale))}</small> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {baris.map(([kunci, nama]) => (
                <tr key={kunci}>
                  <th scope="row">{nama}</th>
                  {ada.map((k) => {
                    const v = nilai.get(k.id)?.get(kunci);
                    if (!nilai.has(k.id)) return <td key={k.id} className="pin-lk-sel-kosong">{s("laporan.kisi.belum")}</td>;
                    if (v === undefined) return <td key={k.id} className="pin-lk-sel-kosong">—</td>;
                    const tg = typeof k.target === "number" ? k.target : null;
                    const bawah = tg !== null && v < tg;
                    return (
                      <td key={k.id}>
                        <span className="pin-lk-sel" data-bawah={bawah ? "" : undefined}>
                          <b>{persenJujur(v, locale, [tg])}</b>
                          <span className="pin-lk-mini" aria-hidden="true">
                            <i style={{ width: `${Math.max(0, Math.min(1, v)) * 100}%` }} />
                            {tg !== null ? <u style={{ left: `${tg * 100}%` }} /> : null}
                          </span>
                          {bawah ? <small className="pin-lk-bawah">{s("mengajar.murid1.di_bawah_target")}</small> : null}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
