import { format, t, type HleEvent, type Locale, type Persona } from "@/lib/hle";
import type { BabHasil } from "@/lib/hasil-belajar";
import { persenJujur } from "@/components/laporan/KomposisiKelas";

/**
 * CONTOH LAPORAN 1-murid (Daisy, «DESIGN DIRECTION APPROVED», 7 Nov; owner D-195(1)): EVERY CHAPTER, ONE PAGE, THE
 * LEARNER'S OWN WORK ONLY.
 *
 * A «Hasil per bab»: a sentence counted from the learner's own chapters (how many finished chapters reached their
 * target, and what to study again, by part and chapter), then one row per chapter on the same 0–100% scale, Pemetaan
 * Awal as a light mark and Uji Penguasaan as the bar, the chapter's own sealed target as its line; a bar that stops
 * short of its target is amber and says so (G-03). A chapter still under way says so, with no figure.
 * B «Bagian per bab»: each chapter's parts on their own light ground (R1-01), one square per question, filled when
 * answered right; a part below the target says «pelajari lagi».
 * C «Apa berikutnya»: continue the chapter under way; each chapter's own result page, kept as it is; the certificates.
 * Never a class figure, a peer or a rank. Plain markup (no next/link), so its test renders it outside Next.
 */
export default function KomposisiMurid({ bab, locale, persona = "learner" }: { bab: readonly BabHasil[]; locale: Locale; persona?: Persona }) {
  const s = (k: string) => t(k as HleEvent, persona, { locale });
  const selesai = bab.filter((b) => b.keadaan === "SELESAI");
  const berjalan = bab.filter((b) => b.keadaan === "BERJALAN");
  const dinilai = selesai.filter((b) => b.tercapai !== null);
  const capai = dinilai.filter((b) => b.tercapai === "TERCAPAI").length;
  const ulang = selesai.filter((b) => b.ulang.length > 0);

  let kalimat: string;
  if (selesai.length === 0) kalimat = s("hasilbelajar.belum_ada");
  else if (dinilai.length > 0 && capai === dinilai.length) kalimat = s("hasilbelajar.semua_capai");
  else if (dinilai.length > 0) kalimat = s("hasilbelajar.capai").replace("{n}", format.number(capai, locale)).replace("{m}", format.number(dinilai.length, locale));
  else kalimat = s("hasilbelajar.selesai").replace("{n}", format.number(selesai.length, locale));
  const daftarUlang = ulang.map((b) => `${b.ulang.join(s("hasilbelajar.serta"))} (${b.judul})`).join("; ");

  return (
    <div className="pin-lk">
      <section className="pin-lk-inti" aria-labelledby="hb-a" data-lk="bab">
        <h2 className="pin-lk-h" id="hb-a"><span className="pin-lk-huruf" aria-hidden="true">A</span><span>{s("hasilbelajar.a")}</span></h2>
        <p className="pin-lk-kalimat" data-lk-kalimat="">{kalimat}</p>
        {daftarUlang ? <p className="pin-lk-kalimat-sub">{s("hasilbelajar.ulang").replace("{daftar}", daftarUlang)}</p> : null}
        {selesai.length > 0 ? (
          <ul className="pin-lk-pita-ket" aria-hidden="true">
            <li><i className="pin-lk-titik-ket" data-awal="" />{s("hasilbelajar.awal")}</li>
            <li><i className="pin-lk-titik-ket" />{s("hasilbelajar.akhir")}</li>
            <li><i className="pin-lk-garis-ket" />{s("hasilbelajar.target")}</li>
          </ul>
        ) : null}
        <ul className="pin-lk-baris">
          {bab.map((b) => {
            if (b.keadaan === "BERJALAN") {
              return (
                <li key={b.tugas} data-keadaan="berjalan">
                  <span className="pin-lk-nama">{b.judul}</span>
                  <span className="pin-lk-jalur" aria-hidden="true" />
                  <span className="pin-lk-nilai">{s("hasilbelajar.berjalan")}</span>
                </li>
              );
            }
            const v = b.akhir;
            const kurang = b.tercapai === "BELUM";
            return (
              <li key={b.tugas} data-bawah={kurang ? "" : undefined}>
                <span className="pin-lk-nama">{b.judul}</span>
                <span className="pin-lk-jalur" aria-hidden="true">
                  {v !== null ? <span className="pin-lk-isi" style={{ width: `${Math.max(0, Math.min(1, v)) * 100}%` }} /> : null}
                  {b.awal !== null ? <span className="pin-lk-titik" data-awal="" style={{ left: `${Math.max(0, Math.min(1, b.awal)) * 100}%` }} /> : null}
                  {b.ambang !== null ? <span className="pin-lk-target" style={{ left: `${b.ambang * 100}%` }} /> : null}
                </span>
                <span className="pin-lk-nilai">
                  {s("hasilbelajar.nilai").replace("{b}", format.number(b.benar, locale)).replace("{t}", format.number(b.total, locale))}
                  {b.tercapai ? <small className={kurang ? "pin-lk-bawah" : undefined}>{s(kurang ? "hasilbelajar.belum_capai" : "hasilbelajar.tercapai")}</small> : null}
                </span>
                {/* the text equivalent of the row's picture */}
                <span className="pin-sr">
                  {v !== null ? `${s("hasilbelajar.akhir")}: ${persenJujur(v, locale, [b.ambang])}. ` : ""}
                  {b.awal !== null ? `${s("hasilbelajar.awal")}: ${persenJujur(b.awal, locale, [b.ambang])}. ` : ""}
                  {b.ambang !== null ? `${s("hasilbelajar.target")}: ${format.percent(b.ambang, locale)}.` : ""}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="pin-lk-arti">{s("siklus.delta_arti")}</p>
      </section>

      {selesai.some((b) => b.bagian.length > 0) ? (
        <section className="pin-lk-bagian" data-lk="bagian">
          <h2 className="pin-lk-h"><span className="pin-lk-huruf" aria-hidden="true">B</span><span>{s("hasilbelajar.b")}</span></h2>
          <p className="pin-lk-arti">{s("hasilbelajar.b_arti")}</p>
          {selesai.filter((b) => b.bagian.length > 0).map((b) => (
            <div key={b.tugas} className="pin-lk-kelompok" data-hb-bab="">
              <h3>{b.judul}</h3>
              <ul className="pin-lk-daftar">
                {b.bagian.map((g) => (
                  <li key={g.kode} data-bawah={g.ulang ? "" : undefined}>
                    <span>{g.nama}</span>
                    <span className="pin-lk-nilai">
                      <span className="pin-lk-kotak" aria-hidden="true">
                        {Array.from({ length: Math.max(0, g.total) }, (_, i) => <i key={i} data-isi={i < g.benar ? "" : undefined} />)}
                      </span>
                      {s("hasilbelajar.nilai").replace("{b}", format.number(g.benar, locale)).replace("{t}", format.number(g.total, locale))}
                      {g.ulang ? <small className="pin-lk-bawah">{s("hasilbelajar.pelajari_lagi")}</small> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      <section className="pin-lk-bagian" data-lk="berikutnya">
        <h2 className="pin-lk-h"><span className="pin-lk-huruf" aria-hidden="true">{selesai.some((b) => b.bagian.length > 0) ? "C" : "B"}</span><span>{s("laporan.komposisi.berikutnya")}</span></h2>
        <ul className="pin-lk-langkah">
          {berjalan.map((b) => (
            <li key={b.tugas}><a href={`/belajar/${b.tugas}`}>{s("hasilbelajar.lanjutkan").replace("{judul}", b.judul)}</a></li>
          ))}
          {ulang.length > 0 ? <li>{s("hasilbelajar.berikutnya_ulang").replace("{daftar}", ulang.map((b) => b.judul).join(", "))}</li> : null}
          {selesai.map((b) => (
            <li key={b.tugas}><a href={`/belajar/${b.tugas}/hasil`}>{s("hasilbelajar.buka_bab").replace("{judul}", b.judul)}</a></li>
          ))}
          {capai > 0 ? <li><a href="/belajar/sertifikat">{s("hasilbelajar.sertifikat")}</a></li> : null}
        </ul>
      </section>
    </div>
  );
}
