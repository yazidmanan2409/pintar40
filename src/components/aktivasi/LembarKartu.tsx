"use client";

import { t, type HleEvent, type Locale } from "@/lib/hle";
import BarisHasil from "@/components/BarisHasil";
import { KeMasuk } from "./HasilAktivasi";
import { alamatMasuk } from "./alamat";

export type KartuCetak = { nama: string; nomorInduk: string; card: string; pin: string; kelas?: string };

/**
 * M7 (D-085) — A CLASS'S CARDS AS A PRACTICAL PRINTABLE SET.
 *
 * One card per learner: the name, the school's number for them, the card
 * number, the PIN, and where to sign in. No photo (T4). The PINs exist here and
 * on the paper only: they came back once from `/api/akun/aktivasi` and PINTAR
 * keeps none, so the screen says to print or write them down now. Printing
 * shows this sheet alone (experience.css), two cards across, none split.
 *
 * A learner whose card was not made is named with the sentence for that path,
 * on screen only; their own row on Aktivasi stays, so they can be done singly.
 */
export default function LembarKartu({ locale, kelas, kartu, gagal }: {
  locale: Locale;
  kelas: string;
  kartu: KartuCetak[];
  gagal: Array<{ nama: string; kunci: HleEvent }>;
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const alamat = alamatMasuk();
  return (
    <section className="pin-akt-lembar" aria-labelledby="pin-akt-lembar-judul">
      <h2 id="pin-akt-lembar-judul">{s("aktivasi.kelas.lembar")} · {kelas}</h2>
      {kartu.length > 0 ? (
        <>
          <div className="pin-noprint">
            <BarisHasil nada="ok">{s("aktivasi.kelas.sekali")}</BarisHasil>
            <div className="pin-actions">
              <button type="button" className="pin-btn pin-primary" onClick={() => window.print()}>
                {s("aktivasi.kelas.cetak")}
              </button>
            </div>
          </div>
          <p className="pin-meta"><KeMasuk s={s} sebelum="aktivasi.kartu_arti" sesudah="aktivasi.kartu_arti.lalu" /></p>
          <ul className="pin-grid2 pin-akt-kartu-set">
            {kartu.map((k) => (
              <li key={k.card} className="pin-akt-kartu">
                <p><strong>{k.nama}</strong> · <span className="pin-num">{k.nomorInduk}</span>{k.kelas ? <> · {k.kelas}</> : null}</p>
                <dl className="pin-akt-kartu-isi">
                  <div><dt>{s("aktivasi.kelas.nomor")}</dt><dd className="pin-num">{k.card}</dd></div>
                  <div><dt>PIN</dt><dd className="pin-num">{k.pin}</dd></div>
                </dl>
                <p className="pin-meta">{alamat ?? s("aktivasi.halaman_masuk")}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {gagal.length > 0 ? (
        <div className="pin-noprint">
          <BarisHasil nada="gagal">{s("aktivasi.kelas.belum")}</BarisHasil>
          <ul className="pin-akt-gagal">
            {gagal.map((g, i) => (
              <li key={`${g.nama}-${i}`}><strong>{g.nama}</strong>: {s(g.kunci)}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
