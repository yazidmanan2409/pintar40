import { t, type HleEvent, type Locale } from "@/lib/hle";
import TombolKirim from "@/components/TombolKirim";
import { terbitUlangSertifikatAksi } from "@/app/konfigurasi/sertifikat/actions";

/** What sertifikat_koreksi_pratinjau returns, as the panel reads it. */
export type PratinjauGanti = {
  status: string; nomor: string; berubah: boolean;
  nama_tercetak: string | null; nama_kini: string | null;
  sekolah_tercetak: string | null; sekolah_kini: string | null;
  kursus_tercetak: string | null; kursus_kini: string | null;
  pengganti: { id: string; nomor: string; status: string } | null;
};

/**
 * W2.22 (owner, 9 Nov): «TERBITKAN ULANG» beside «Cabut» on an issued certificate. What is written on the certificate
 * stands beside what is recorded now, line by line, and only what differs is marked; with nothing different there is no
 * form, only the sentence that says to correct the record first. The reason is required (10–300 characters). The act
 * is terbitUlangSertifikatAksi's: the database prepares the replacement and the server signs and seals it; the original
 * is kept and its public check says it was replaced.
 */
export default function FormTerbitUlang({ locale, id, pratinjau }: { locale: Locale; id: string; pratinjau: PratinjauGanti }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const baris: Array<[HleEvent, string | null, string | null]> = [
    ["sertifikat.kelola.kolom.pemegang", pratinjau.nama_tercetak, pratinjau.nama_kini],
    ["sertifikat.kelola.kolom.sekolah", pratinjau.sekolah_tercetak, pratinjau.sekolah_kini],
    ["sertifikat.kelola.kolom.kursus", pratinjau.kursus_tercetak, pratinjau.kursus_kini],
  ];
  return (
    <div className="pin-koreksi pin-ganti" data-ganti={id}>
      <h3>{s("sertifikat.ganti.judul")}</h3>
      <p className="pin-sub">{s("sertifikat.ganti.arti")}</p>
      <table className="pin-ganti-banding">
        <thead>
          <tr>
            <th scope="col"><span className="pin-sr">{s("sertifikat.ganti.bagian")}</span></th>
            <th scope="col">{s("sertifikat.ganti.tercetak")}</th>
            <th scope="col">{s("sertifikat.ganti.kini")}</th>
          </tr>
        </thead>
        <tbody>
          {baris.map(([k, lama, kini]) => (
            <tr key={k} data-berubah={lama !== kini ? "ya" : "tidak"}>
              <th scope="row">{s(k)}</th>
              <td>{lama ?? "—"}</td>
              <td>{kini ?? "—"}{lama !== kini ? <span className="pin-pill pin-info">{s("sertifikat.ganti.berubah")}</span> : null}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {pratinjau.berubah ? (
        <form action={terbitUlangSertifikatAksi} data-ganti-form={id}>
          <input type="hidden" name="sertifikat" value={id} />
          <div className="pin-bidang">
            <label htmlFor="ganti-alasan" className="pin-bidang-label">{s("sertifikat.ganti.alasan")}</label>
            <p id="ganti-alasan-petunjuk" className="pin-hint">{s("sertifikat.ganti.alasan.arti")}</p>
            <textarea id="ganti-alasan" name="alasan" className="pin-input pin-alasan-isian" required minLength={10} maxLength={300}
              aria-describedby="ganti-alasan-petunjuk" />
          </div>
          <div className="pin-actions">
            <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.memproses")}>{s("sertifikat.ganti.tombol")}</TombolKirim>
          </div>
        </form>
      ) : (
        <p className="pin-meta" data-ganti-sama="">{s("sertifikat.ganti.sama")}</p>
      )}
    </div>
  );
}
