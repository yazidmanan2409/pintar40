import Link from "next/link";
import { format, t, type HleEvent, type Locale, type Persona } from "@/lib/hle";
import type { BabHasil } from "@/lib/hasil-belajar";
import { persenJujur } from "@/components/laporan/KomposisiKelas";
import { daftarKata, JudulBagian } from "@/components/laporan/tata";

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
 * Never a class figure, a peer or a rank. Its links are next/link (the learner's own pages).
 */
export default function KomposisiMurid({ bab, locale, persona = "learner" }: { bab: readonly BabHasil[]; locale: Locale; persona?: Persona }) {
  const s = (k: string) => t(k as HleEvent, persona, { locale });
  const selesai = bab.filter((b) => b.keadaan === "SELESAI");
  const berjalan = bab.filter((b) => b.keadaan === "BERJALAN");
  const dinilai = selesai.filter((b) => b.tercapai !== null);
  const capai = dinilai.filter((b) => b.tercapai === "TERCAPAI").length;
  const ulang = selesai.filter((b) => b.ulang.length > 0);
  // Daisy's §11: a certifying row's sections are «baca lagi», pass or not; the others keep «pelajari lagi»
  const ulangBiasa = ulang.filter((b) => !b.bersertifikasi);
  const bacaLagi = ulang.filter((b) => b.bersertifikasi);
  // the teacher line (C) stays where it was: on a result below the target
  const ulangBelum = ulangBiasa.filter((b) => b.tercapai === "BELUM");
  // Daisy's §12: a certifying «Belum lulus» row's C line quotes the «baca lagi» its section B shows
  const bacaBelum = bacaLagi.filter((b) => b.tercapai === "BELUM");
  const adaB = selesai.some((b) => b.bagian.length > 0) || bacaLagi.length > 0;

  let kalimat: string;
  if (selesai.length === 0) kalimat = s("hasilbelajar.belum_ada");
  else if (dinilai.length > 0 && capai === dinilai.length) kalimat = s("hasilbelajar.semua_capai");
  else if (dinilai.length > 0) kalimat = s("hasilbelajar.capai").replace("{n}", format.number(capai, locale)).replace("{m}", format.number(dinilai.length, locale));
  else kalimat = s("hasilbelajar.selesai").replace("{n}", format.number(selesai.length, locale));
  // Reporting Quality Gate (9 Nov): with a real chapter's objectives (each a sentence) more than two parts to study
  // again ran into a paragraph of 25 lines on a phone; the lead then counts them and points to section B, which lists
  // every one of them by chapter
  const nUlang = ulangBiasa.reduce((n, b) => n + b.ulang.length, 0);
  const daftarUlang = nUlang > 2 ? "" : ulangBiasa.map((b) => `${daftarKata(b.ulang, locale)} (${b.judul})`).join("; ");
  const nBaca = bacaLagi.reduce((n, b) => n + b.ulang.length, 0);
  const daftarBaca = nBaca > 2 ? "" : bacaLagi.map((b) => `${daftarKata(b.ulang, locale)} (${b.judul})`).join("; ");

  return (
    <div className="pin-lk">
      <section className="pin-lk-bagian" aria-labelledby="hb-a" data-lk="bab">
        <JudulBagian huruf={"A"} judul={s("hasilbelajar.a")} id="hb-a" persona={persona} locale={locale} />
        <div className="pin-lk-inti">
        <p className="pin-lk-kalimat" data-lk-kalimat="">{kalimat}</p>
        {daftarUlang ? <p className="pin-lk-kalimat-sub">{s("hasilbelajar.ulang").replace("{daftar}", daftarUlang)}</p> : null}
        {nUlang > 2 ? <p className="pin-lk-kalimat-sub" data-ulang-banyak="">{s("hasilbelajar.ulang_banyak").replace("{n}", format.number(nUlang, locale))}</p> : null}
        {daftarBaca ? <p className="pin-lk-kalimat-sub" data-baca-lagi="">{s("hasilbelajar.baca_lagi").replace("{daftar}", daftarBaca)}</p> : null}
        {nBaca > 2 ? <p className="pin-lk-kalimat-sub" data-baca-lagi-banyak="">{s("hasilbelajar.baca_lagi_banyak").replace("{n}", format.number(nBaca, locale))}</p> : null}
        {selesai.length > 0 ? (
          <ul className="pin-lk-pita-ket" aria-hidden="true">
            <li><i className="pin-lk-titik-ket" data-awal="" />{s("hasilbelajar.awal")}</li>
            <li><i className="pin-lk-titik-ket" />{s("hasilbelajar.akhir")}</li>
            <li><i className="pin-lk-garis-ket" />{s("hasilbelajar.target")}</li>
          </ul>
        ) : null}
        <ul className="pin-lk-baris">
          {bab.map((b) => {
            if (b.keadaan === "DITUTUP_AWAL") {
              // Daisy (435a2856, §2.1): the Tes awal the learner finished before the material closed, kept, with no target
              return (
                <li key={b.tugas} data-keadaan="ditutup-awal">
                  <span className="pin-lk-nama">{b.judul}</span>
                  <span className="pin-lk-jalur" aria-hidden="true" />
                  <span className="pin-lk-nilai">{s("hasilbelajar.ditutup_awal").replace("{persen}", b.awal !== null ? format.percent(b.awal, locale) : "")}</span>
                  {b.ditarik ? <small className="pin-lk-ditarik" data-ditarik="">{s("hasilbelajar.ditarik")}</small> : null}
                </li>
              );
            }
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
                  {/* D2-R (R-h, Daisy §3): a certifying result's verdict word is «Lulus» / «Belum lulus»; the counts line is unchanged */}
                  {b.tercapai ? <small className={kurang ? "pin-lk-bawah" : undefined}>{s(b.bersertifikasi ? (kurang ? "hasil.belum_lulus" : "hasil.lulus") : kurang ? "hasilbelajar.belum_capai" : "hasilbelajar.tercapai")}</small> : null}
                </span>
                {/* Ruling 74a item 4, Daisy's C-1: after a certifying «Lulus», the certificate, in the existing words */}
                {b.bersertifikasi && b.tercapai === "TERCAPAI" ? <small data-sertifikat="" className="pin-noprint"><Link className="pin-noprint" href={`/belajar/${b.tugas}/sertifikat`}>{s("siklus.lihat_sertifikat")}</Link></small> : null}
                {/* Z (Daisy's Z3-A C-1): the gate case says why, directly after the figures; neutral, no icon */}
                {b.gerbang ? <small className="pin-meta" data-gerbang="">{s("hasilbelajar.gerbang")}</small> : null}
                {b.ditarik ? <small className="pin-lk-ditarik" data-ditarik="">{s("hasilbelajar.ditarik")}</small> : null}
                {/* Z V2 (R-22): a retake open, said neutrally; the result above stays the finished one. D14: recalculated */}
                {b.ulangBerjalan ? <small className="pin-meta" data-ulang-berjalan="">{s("hasil.ulang_berjalan")}</small> : null}
                {b.dihitungUlang ? <small className="pin-meta" data-dihitung-ulang="">{s("hasil.dihitung_ulang")}</small> : null}
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
        </div>
      </section>

      {adaB ? (
        <section className="pin-lk-bagian" data-lk="bagian">
          <JudulBagian huruf={"B"} judul={s("hasilbelajar.b")} persona={persona} locale={locale} />
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
          {/* Daisy's §11: a certifying chapter's sections to read again, by name only (no figure), marked «baca lagi» */}
          {bacaLagi.map((b) => (
            <div key={b.tugas} className="pin-lk-kelompok" data-hb-bab="" data-baca-lagi="">
              <h3>{b.judul}</h3>
              <ul className="pin-lk-daftar">
                {b.ulang.map((nama) => (
                  <li key={nama} data-bawah="">
                    <span>{nama}</span>
                    <span className="pin-lk-nilai"><small className="pin-lk-bawah">{s("hasilbelajar.baca_lagi_tanda")}</small></span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      <section className="pin-lk-bagian" data-lk="berikutnya">
        <JudulBagian huruf={adaB ? "C" : "B"} judul={s("laporan.komposisi.berikutnya")} persona={persona} locale={locale} />
        <ul className="pin-lk-langkah">
          {berjalan.map((b) => (
            <li key={b.tugas}><Link href={`/belajar/${b.tugas}`}>{s("hasilbelajar.lanjutkan").replace("{judul}", b.judul)}</Link></li>
          ))}
          {ulangBelum.length > 0 ? <li>{s("hasilbelajar.berikutnya_ulang").replace("{daftar}", ulangBelum.map((b) => b.judul).join(", "))}</li> : null}
          {bacaBelum.length > 0 ? <li>{s("hasilbelajar.berikutnya_baca_lagi").replace("{daftar}", bacaBelum.map((b) => b.judul).join(", "))}</li> : null}
          {selesai.map((b) => (
            <li key={b.tugas}><Link href={`/belajar/${b.tugas}/hasil`}>{s("hasilbelajar.buka_bab").replace("{judul}", b.judul)}</Link></li>
          ))}
          {capai > 0 ? <li><Link href="/belajar/sertifikat">{s("hasilbelajar.sertifikat")}</Link></li> : null}
        </ul>
      </section>
    </div>
  );
}
