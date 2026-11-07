import { format, t, type HleEvent, type Locale } from "@/lib/hle";
import type { CatatanPengembangan, KeadaanUji, PaketPeserta, PesertaCatatan } from "@/lib/pengembangan-kontrak";

/**
 * CONTOH LAPORAN 6-fasilitator (Daisy, «DESIGN DIRECTION APPROVED», 7 Nov; owner D-195(3)): EVERY PARTICIPANT'S STEPS,
 * PERSON BY PERSON, AND NOTHING ADDED UP.
 *
 * One table per package: a row per participant, alphabetical, never ordered by result; a column per step (Sudah mulai ·
 * Pemetaan Awal · Pelajaran selesai · Uji Penguasaan · Hasil · Selesai), each cell that person's own fact in words, a
 * filled mark when done. The columns are the ones the database returned to this reader (professional_learning_record):
 * the facilitator, the Kepala departemen and the Dekan get progress and the result, Admin sekolah enrolment,
 * participation and completion only. D-069(b) stands: no participant count, no column total, no headline figure. The
 * one lead is a list of people, who has not begun, by name. Never an answer, never an integrity signal (D-069(c)).
 * Plain markup (no next/link), so its test renders it outside Next.
 */
const urutNama = (a: { nama: string }, b: { nama: string }) => a.nama.localeCompare(b.nama, "id", { sensitivity: "base" });

export type BarisPaket = { orang: PesertaCatatan; paket: PaketPeserta };

/** The record as one group per package (by its title), its participants alphabetical; who has none listed apart. */
export function susunCatatan(isi: CatatanPengembangan): { paket: Array<{ judul: string; baris: BarisPaket[] }>; tanpaPaket: PesertaCatatan[] } {
  const peta = new Map<string, BarisPaket[]>();
  for (const orang of [...isi.peserta].sort(urutNama)) {
    for (const paket of orang.paket) {
      const kunci = paket.judul;
      peta.set(kunci, [...(peta.get(kunci) ?? []), { orang, paket }]);
    }
  }
  return {
    paket: [...peta.entries()].sort(([a], [b]) => a.localeCompare(b, "id")).map(([judul, baris]) => ({ judul, baris })),
    tanpaPaket: isi.peserta.filter((o) => o.paket.length === 0).sort(urutNama),
  };
}

export default function KomposisiPengembangan({ isi, locale }: { isi: CatatanPengembangan; locale: Locale }) {
  const s = (k: string) => t(k as HleEvent, "staff", { locale });
  const { paket, tanpaPaket } = susunCatatan(isi);
  const penuh = isi.kolom === "FULL";
  const tanda = (selesai: boolean, teks: string) => (
    <><i className="pin-lk-tanda" data-selesai={selesai ? "" : undefined} aria-hidden="true" />{teks}</>
  );
  const uji = (k: KeadaanUji) => tanda(k === "SELESAI", s(`pengembangan.status.${k}`));
  const belumMulai = [...new Set(isi.peserta.filter((o) => o.paket.length > 0 && o.paket.every((p) => !p.mulai)).map((o) => o.nama))];

  return (
    <div className="pin-lk">
      <section className="pin-lk-inti" aria-labelledby="pd-a" data-lk="langkah">
        <h2 className="pin-lk-h" id="pd-a"><span className="pin-lk-huruf" aria-hidden="true">A</span><span>{s("pengembangan.langkah")}</span></h2>
        {belumMulai.length > 0 ? (
          <p className="pin-lk-kalimat" data-lk-kalimat="">{s("pengembangan.belum_mulai").replace("{daftar}", belumMulai.join(", "))}</p>
        ) : null}
        <p className="pin-lk-arti">{s(penuh ? "pengembangan.urutan_hasil" : "pengembangan.urutan")}</p>
        {paket.map(({ judul, baris }) => (
          <div key={judul} className="pin-lk-kisi-wadah" data-pd-paket="">
            <p className="pin-lk-arti"><strong>{s("pengembangan.kolom.paket")}:</strong> {judul}</p>
            <table className="pin-lk-tabel pin-lk-kisi-tabel">
              <caption className="pin-sr">{s("pengembangan.judul")} · {judul}</caption>
              <thead>
                <tr>
                  <th scope="col">{s("pengembangan.kolom.peserta")}</th>
                  <th scope="col">{s("pengembangan.kolom.mulai")}</th>
                  <th scope="col">{s("pengembangan.kolom.pemetaan")}</th>
                  {penuh ? <th scope="col">{s("pengembangan.kolom.pelajaran")}</th> : null}
                  <th scope="col">{s("pengembangan.kolom.penguasaan")}</th>
                  {penuh ? <th scope="col">{s("pengembangan.kolom.hasil")}</th> : null}
                  <th scope="col">{s("pengembangan.kolom.selesai")}</th>
                </tr>
              </thead>
              <tbody>
                {baris.map(({ orang, paket: p }) => (
                  <tr key={`${orang.id}-${p.id}`}>
                    <th scope="row">
                      {orang.nama}
                      {orang.terdaftar === "PENDING" ? <small>{s("pengembangan.daftar.PENDING")}</small> : null}
                    </th>
                    <td>{tanda(p.mulai, s(p.mulai ? "pengembangan.ya" : "pengembangan.belum"))}</td>
                    <td>{uji(p.pemetaan)}</td>
                    {penuh ? (
                      <td>{p.pelajaran
                        ? tanda(p.pelajaran.jumlah > 0 && p.pelajaran.selesai >= p.pelajaran.jumlah,
                          s("pengembangan.pelajaran_dari").replace("{n}", format.number(p.pelajaran.selesai, locale)).replace("{m}", format.number(p.pelajaran.jumlah, locale)))
                        : "—"}</td>
                    ) : null}
                    <td>{uji(p.penguasaan)}</td>
                    {penuh ? (
                      <td>{p.hasil
                        ? <>{p.hasil.tercapai === null ? null : <>{s(p.hasil.tercapai ? "pengembangan.tercapai" : "pengembangan.belum_tercapai")} · </>}{format.percent(p.hasil.penguasaan, locale)}</>
                        : "—"}</td>
                    ) : null}
                    <td>{tanda(p.selesai, s(p.selesai ? "pengembangan.ya" : "pengembangan.belum"))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {tanpaPaket.length > 0 ? (
          <p className="pin-lk-arti" data-pd-tanpa-paket="">{s("pengembangan.tanpa_paket").replace("{daftar}", tanpaPaket.map((o) => o.nama).join(", "))}</p>
        ) : null}
        <p className="pin-lk-arti">{s("pengembangan.tanda")}</p>
      </section>

      <section className="pin-lk-bagian" data-lk="tentang">
        <h2 className="pin-lk-h"><span className="pin-lk-huruf" aria-hidden="true">B</span><span>{s("pengembangan.tentang_catatan")}</span></h2>
        <p className="pin-lk-arti">{s(penuh ? "pengembangan.arti" : "pengembangan.arti_terbatas")}</p>
        <p className="pin-lk-arti">{s("pengembangan.tanpa_jawaban")}</p>
      </section>
    </div>
  );
}
