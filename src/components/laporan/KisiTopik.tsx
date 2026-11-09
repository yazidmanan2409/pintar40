import { format, t, type HleEvent, type Locale } from "@/lib/hle";
import { kalimatJumlah, type Envelope } from "@/components/bukti";
import { nilaiMetrik } from "@/lib/nilai-metrik";
import { persenJujur } from "@/components/laporan/KomposisiKelas";
import { daftarKata, JudulBagian } from "@/components/laporan/tata";

/**
 * CONTOH LAPORAN 3-kadep (Daisy, «DESIGN DIRECTION APPROVED», 7 Nov): TOPICS × CLASSES, FOR A PATTERN OR ONE CLASS.
 *
 * A head of department's question is whether a difficulty is a pattern across the branch or one class. Each cell is
 * that class's own «Penguasaan per topik» figure, the envelope its teacher's report reads, re-authorized for this
 * reader: its value, a short bar on 0–100% and the class's own target tick; below its target it is amber AND says
 * «di bawah target» (G-03). Reading across a row shows a pattern; reading down a column shows one class. Drawn with
 * no colour ramp, so it needs no new token. A class whose figure the reader may not see is left out without a word
 * about it (the refusal discloses nothing). Classes only, named by class, never by teacher; no student. The table IS
 * its text equivalent.
 *
 * KESETIAAN (Daisy's fidelity check, 7 Nov): under each class its base («29 dari 32 murid», its own readiness
 * envelope's population); a class without enough evidence says so once, in its header, its cells «—» (#13); the
 * class's Kenaikan as the foot row (#14); a list said as a sentence (#1); the section lettered and read (#4); the
 * scrolling grid a focusable, named region (#15).
 *
 * The lead sentence counts only: the topics below their target in more than half of the classes that have the
 * figure. Nothing is summed or averaged across classes (WP7C).
 */
type Baris = { objective_id?: string | null; code?: string; competency?: string; title?: string | null; mean_score?: number | null };
export type KolomKisi = {
  id: string; nama: string; topik: Envelope | null | undefined; target: number | null | undefined;
  /** The class's own readiness envelope's population: who is placed, who has sat. */
  populasi?: { placed?: number; assessed?: number } | null;
  /** The class's own Kenaikan envelope. */
  kenaikan?: Envelope | null;
};

export function susunKisi(kolom: readonly KolomKisi[]) {
  const ada = kolom.filter((k) => k.topik && k.topik.status !== "not_permitted" && k.topik.status !== "unavailable");
  const baris = new Map<string, string>();
  // V2 (Daisy's N3): a short title never stands alone; the objective's statement goes under it
  const pernyataan = new Map<string, string>();
  const nilai = new Map<string, Map<string, number>>();
  for (const k of ada) {
    if (k.topik?.status !== "ok" || !Array.isArray(k.topik.value)) continue;
    const isi = new Map<string, number>();
    for (const b of k.topik.value as Baris[]) {
      const kunci = b.objective_id ?? b.code ?? b.competency ?? "";
      if (!kunci || typeof b.mean_score !== "number") continue;
      // V2: the short title where it names the objective unambiguously (MC-9), else the statement
      if (!baris.has(kunci)) baris.set(kunci, (b.title && b.title.trim() !== "" ? b.title : b.competency) ?? kunci);
      if (!pernyataan.has(kunci) && b.title && b.title.trim() !== "" && b.competency && b.competency.trim() !== b.title.trim()) {
        pernyataan.set(kunci, b.competency);
      }
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
  // Reporting Quality Gate (9 Nov): the lead sentence may say «no topic is below target» only where it could have found
  // one: at least two classes with the figure AND a target this reader can read. A Dekan reads no class's target
  // (assessment_assignments is the authors' and assigners' read), and was told «Tidak ada topik yang di bawah target»
  // over cells that were below it.
  const bertarget = berangka.filter((k) => typeof k.target === "number").length;
  return { kolom: ada, baris: [...baris.entries()], pernyataan, nilai, pola, berangka: berangka.length, bertarget };
}

export default function KisiTopik({ kolom, locale, huruf = "A" }: { kolom: readonly KolomKisi[]; locale: Locale; huruf?: string }) {
  const s = (k: string) => t(k as HleEvent, "staff", { locale });
  const { kolom: ada, baris, pernyataan, nilai, pola, berangka, bertarget } = susunKisi(kolom);
  // N4 (Daisy): the meaning line and the key say only what is drawn: every class's target, some classes', or none
  const targetSemua = bertarget > 0 && bertarget === berangka;
  const artiKunci = bertarget === 0 ? "laporan.kisi.arti_tanpa_target" : targetSemua ? "laporan.kisi.arti" : "laporan.kisi.arti_sebagian";
  const kunciKunci = bertarget === 0 ? "laporan.kisi.tanpa_target" : targetSemua ? "laporan.kisi.kunci" : "laporan.kisi.kunci_sebagian";
  if (ada.length === 0) return null;
  const adaKenaikan = ada.some((k) => k.kenaikan?.status === "ok");
  return (
    // #15: more classes than an A4 portrait page holds legibly print on a landscape page
    <section className="pin-lk pin-lk-kisi" aria-labelledby="pin-kisi" data-lk="kisi" data-kisi-lebar={ada.length > 6 ? "" : undefined}>
      <div className="pin-lk-bagian">
        <JudulBagian huruf={huruf} judul={s("metrik.topik.label")} id="pin-kisi" locale={locale} />
        <div className="pin-lk-inti">
          {berangka > 0 && bertarget >= 2 ? (
            <p className="pin-lk-kalimat" data-lk-kalimat="">
              {pola.length > 2
                ? s("laporan.kisi.pola_banyak").replace("{n}", format.number(pola.length, locale))
                : pola.length > 0 ? s("laporan.kisi.pola").replace("{daftar}", daftarKata(pola, locale)) : s("laporan.kisi.tanpa_pola")}
            </p>
          ) : null}
          <p className="pin-lk-arti" data-kisi-arti={artiKunci}>{s(artiKunci)}</p>
          {/* a narrow screen scrolls the grid sideways: the region takes keyboard focus so it can be scrolled without a mouse (axe scrollable-region-focusable) */}
          <div className="pin-lk-kisi-wadah" role="region" tabIndex={0} aria-labelledby="pin-kisi">
            <table className="pin-lk-tabel pin-lk-kisi-tabel">
              <thead>
                <tr>
                  <th scope="col" className="pin-lk-kol-nama">{s("laporan.komposisi.kolom_topik")}</th>
                  {ada.map((k) => {
                    const punya = nilai.has(k.id);
                    const pop = k.populasi;
                    return (
                      <th key={k.id} scope="col" data-kisi-kelas={k.id}>
                        {k.nama}
                        {punya && typeof pop?.assessed === "number" && typeof pop?.placed === "number"
                          ? <small data-kisi-dasar="">{s("laporan.kisi.dasar").replace("{n}", format.number(pop.assessed, locale)).replace("{m}", format.number(pop.placed, locale))}</small> : null}
                        {punya && typeof k.target === "number"
                          ? <small>{s("laporan.komposisi.target").replace("{p}", format.percent(k.target, locale))}</small> : null}
                        {/* KESETIAAN #13: a class without enough evidence says so once, here; its cells are «—» */}
                        {!punya ? <small data-kisi-belum="">{(k.topik && kalimatJumlah(k.topik, locale, "staff")) || s("laporan.kisi.belum")}</small> : null}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {baris.map(([kunci, nama]) => (
                  <tr key={kunci}>
                    <th scope="row">{nama}{pernyataan.get(kunci) ? <span className="pin-lk-pernyataan">{pernyataan.get(kunci)}</span> : null}</th>
                    {ada.map((k) => {
                      const v = nilai.get(k.id)?.get(kunci);
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
                            {bawah ? <span className="pin-sr">{` ${s("mengajar.murid1.di_bawah_target")}`}</span> : null}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              {adaKenaikan ? (
                <tfoot>
                  <tr data-kisi-kenaikan="">
                    <th scope="row">{s("metrik.kenaikan.label")}</th>
                    {ada.map((k) => (
                      <td key={k.id} className={k.kenaikan?.status === "ok" ? undefined : "pin-lk-sel-kosong"}>
                        {k.kenaikan?.status === "ok" && Number.isFinite(Number(k.kenaikan.value))
                          ? <b>{nilaiMetrik("class.net_gain", Number(k.kenaikan.value), locale)}</b> : "—"}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              ) : null}
            </table>
          </div>
          {/* A3 (owner, 9 Nov): at phone width the grid is STACKED, one topic at a time with each class's figure under it;
              the same cells, the same marks, read down instead of across. Only one of the two is ever displayed (CSS), so a
              screen reader meets the figures once. */}
          <div className="pin-lk-kisi-tumpuk" data-kisi-tumpuk="">
            <dl className="pin-lk-kisi-kelas">
              {ada.map((k) => {
                const punya = nilai.has(k.id);
                const pop = k.populasi;
                return (
                  <div key={k.id}>
                    <dt>{k.nama}</dt>
                    <dd>
                      {[
                        punya && typeof pop?.assessed === "number" && typeof pop?.placed === "number"
                          ? s("laporan.kisi.dasar").replace("{n}", format.number(pop.assessed, locale)).replace("{m}", format.number(pop.placed, locale)) : null,
                        punya && typeof k.target === "number" ? s("laporan.komposisi.target").replace("{p}", format.percent(k.target, locale)) : null,
                        !punya ? (k.topik && kalimatJumlah(k.topik, locale, "staff")) || s("laporan.kisi.belum") : null,
                      ].filter(Boolean).join(" · ")}
                    </dd>
                  </div>
                );
              })}
            </dl>
            <ul className="pin-lk-kisi-topik">
              {baris.map(([kunci, nama]) => (
                <li key={kunci}>
                  <p className="pin-lk-kisi-nama">{nama}{pernyataan.get(kunci) ? <span className="pin-lk-pernyataan">{pernyataan.get(kunci)}</span> : null}</p>
                  <dl>
                    {ada.map((k) => {
                      const v = nilai.get(k.id)?.get(kunci);
                      const tg = typeof k.target === "number" ? k.target : null;
                      const bawah = v !== undefined && tg !== null && v < tg;
                      return (
                        <div key={k.id}>
                          <dt>{k.nama}</dt>
                          <dd className={v === undefined ? "pin-lk-sel-kosong" : undefined}>
                            {v === undefined ? "—" : (
                              <span className="pin-lk-sel" data-bawah={bawah ? "" : undefined}>
                                <b>{persenJujur(v, locale, [tg])}</b>
                                <span className="pin-lk-mini" aria-hidden="true">
                                  <i style={{ width: `${Math.max(0, Math.min(1, v)) * 100}%` }} />
                                  {tg !== null ? <u style={{ left: `${tg * 100}%` }} /> : null}
                                </span>
                                {bawah ? <span className="pin-sr">{` ${s("mengajar.murid1.di_bawah_target")}`}</span> : null}
                              </span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </li>
              ))}
              {adaKenaikan ? (
                <li data-kisi-kenaikan="">
                  <p className="pin-lk-kisi-nama">{s("metrik.kenaikan.label")}</p>
                  <dl>
                    {ada.map((k) => (
                      <div key={k.id}>
                        <dt>{k.nama}</dt>
                        <dd className={k.kenaikan?.status === "ok" ? undefined : "pin-lk-sel-kosong"}>
                          {k.kenaikan?.status === "ok" && Number.isFinite(Number(k.kenaikan.value))
                            ? <b>{nilaiMetrik("class.net_gain", Number(k.kenaikan.value), locale)}</b> : "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ) : null}
            </ul>
          </div>
          {/* F3 (Daisy, 9 Nov): the key explains the target line and amber only where a target is drawn */}
          <p className="pin-lk-arti" data-kisi-kunci={kunciKunci}>{s(kunciKunci)}</p>
        </div>
      </div>
    </section>
  );
}
