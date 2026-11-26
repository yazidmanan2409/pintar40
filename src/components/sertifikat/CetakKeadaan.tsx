import { t, format, type Locale, type HleEvent } from "@/lib/hle";
import { tautanCetak } from "@/lib/sertifikat-lembar";
import KodeVerifikasi from "./KodeVerifikasi";
import TanggalCetak from "./TanggalCetak";

/**
 * CI-1b (L-105, HIGH; Sharon AUDIT79-L105.md; Daisy CI1B-KATA.md @cfc65eb6): A PRINTED COPY CARRIES THE STATE.
 *
 * Before CI-1b, a revoked or replaced certificate printed as the on-screen card (the name as issued, «Telah dinyatakan
 * memenuhi kriteria kelulusan …», the number) with its banner stepping aside in print: a clean, valid-looking
 * credential. Both parts here are PRINT-ONLY (`pin-cetak-saja`): the screen is unchanged, its banners already say the
 * state.
 *
 *   PemberitahuanCetak  DICABUT / DIGANTIKAN: printed IN PLACE OF the certificate. A notice, not a mark (Daisy: a mark
 *                       leaves the credential on the paper, to be cropped or photocopied away): the public check's own
 *                       heading, the statement, «Lembar ini bukan sertifikat.», the QR and the printed link, the print
 *                       date. No name, no pass sentence, no course, and never the replacement's number: a paper can
 *                       reach a stranger, and it says no more than the public check does.
 *   BarisDitinjauCetak  DITINJAU: one fixed line above the printed certificate, which still prints with its QR.
 *                       «Keadaannya saat ini» keeps it true however the review ends; no reason is printed.
 */
export function PemberitahuanCetak({
  keadaan, nomor, sekolah, terbitIso, tanggalIso, url, locale, zona,
}: {
  keadaan: "DICABUT" | "DIGANTIKAN";
  nomor: string;
  sekolah: string | null;
  terbitIso: string;
  /** DICABUT: the revocation; DIGANTIKAN: the replacement's issue (null when it is not stored, Daisy §2). */
  tanggalIso: string | null;
  url: string;
  locale: Locale;
  zona: string | null | undefined;
}) {
  const s = (k: string) => t(k as HleEvent, "learner", { locale });
  const tanggal = (iso: string) => format.date(iso, locale, zona);
  const kunci = keadaan === "DIGANTIKAN" && !tanggalIso ? "cetak.DIGANTIKAN.isi_tanpa_tanggal" : `cetak.${keadaan}.isi`;
  const isi = s(kunci)
    .replace("{nomor}", nomor)
    .replace("{sekolah}", sekolah ?? "")
    .replace("{tanggal_terbit}", tanggal(terbitIso))
    .replace(keadaan === "DICABUT" ? "{tanggal_cabut}" : "{tanggal_ganti}", tanggalIso ? tanggal(tanggalIso) : "");
  const [periksaAwal, periksaAkhir] = s("cetak.periksa").split("{alamat}");
  return (
    <section className="pin-cetak-saja pin-cetak-pemberitahuan" data-cetak-pemberitahuan={keadaan} lang={locale}>
      <h1>{s(`cetak.${keadaan}.judul`)}</h1>
      <p className="pin-cetak-isi">{isi}</p>
      <p className="pin-cetak-bukan">{s("cetak.bukan_sertifikat")}</p>
      <div className="pin-cetak-periksa">
        <div data-cetak-qr="">
          <KodeVerifikasi url={url} label={s("sertifikat.periksa.judul")} cetak />
        </div>
        <p>{periksaAwal}<span className="pin-cetak-alamat">{tautanCetak(url)}</span>{periksaAkhir ?? ""}</p>
      </div>
      <p className="pin-cetak-kaki"><TanggalCetakKalimat locale={locale} zona={zona} /></p>
    </section>
  );
}

export function BarisDitinjauCetak({ locale, zona }: { locale: Locale; zona: string | null | undefined }) {
  const baris = t("cetak.DITINJAU.baris", "learner", { locale });
  const titik = baris.indexOf(":");
  const label = titik > 0 ? baris.slice(0, titik + 1) : "";
  const sisa = titik > 0 ? baris.slice(titik + 1) : baris;
  const [sebelum, sesudah] = sisa.split("{tanggal_cetak}");
  return (
    <p className="pin-cetak-saja pin-cetak-ditinjau" data-cetak-ditinjau="" lang={locale}>
      {label ? <strong>{label}</strong> : null}{sebelum}<TanggalCetak awal={format.date(new Date().toISOString(), locale, zona)} locale={locale} zona={zona} />{sesudah ?? ""}
    </p>
  );
}

/** «Dicetak {tanggal_cetak}.», the date the paper leaves the printer (TanggalCetak re-writes it at «beforeprint»). */
function TanggalCetakKalimat({ locale, zona }: { locale: Locale; zona: string | null | undefined }) {
  const [sebelum, sesudah] = t("cetak.tanggal_cetak", "learner", { locale }).split("{tanggal_cetak}");
  return <>{sebelum}<TanggalCetak awal={format.date(new Date().toISOString(), locale, zona)} locale={locale} zona={zona} />{sesudah ?? ""}</>;
}
