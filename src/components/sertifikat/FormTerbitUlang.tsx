import { t, type HleEvent, type Locale } from "@/lib/hle";
import TombolKirim from "@/components/TombolKirim";

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
 * is /api/sertifikat/ganti's: the database prepares the replacement and the server signs and seals it; the original
 * is kept and its public check says it was replaced.
 */
export default function FormTerbitUlang({ locale, id, pratinjau }: { locale: Locale; id: string; pratinjau: PratinjauGanti }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const baris: Array<[HleEvent, string | null, string | null]> = [
    ["sertifikat.kelola.kolom.pemegang", pratinjau.nama_tercetak, pratinjau.nama_kini],
    ["sertifikat.kelola.kolom.sekolah", pratinjau.sekolah_tercetak, pratinjau.sekolah_kini],
    // Daisy (bcecb425, B6): one word in this panel, the one its sentences use (X12 ruling 2: «paket» for the package)
    ["sertifikat.ganti.paket", pratinjau.kursus_tercetak, pratinjau.kursus_kini],
  ];
  return (
    <div className="pin-koreksi pin-ganti" data-ganti={id}>
      <h3>{s("sertifikat.ganti.judul")}</h3>
      <p className="pin-sub">{s("sertifikat.ganti.arti")}</p>
      {/* Daisy (TINJAUAN-6faef690 §2): «Data», not «Bagian» (a structure level); each differing row says «berbeda» in words;
          the result last, always «sama», because a replacement never re-derives it */}
      <table className="pin-ganti-banding">
        <thead>
          <tr>
            <th scope="col">{s("sertifikat.ganti.bagian")}</th>
            <th scope="col">{s("sertifikat.ganti.tercetak")}</th>
            <th scope="col">{s("sertifikat.ganti.kini")}</th>
            <th scope="col">{s("sertifikat.ganti.berubah")}</th>
          </tr>
        </thead>
        <tbody>
          {baris.map(([k, lama, kini]) => (
            <tr key={k} data-berubah={lama !== kini ? "ya" : "tidak"}>
              <th scope="row">{s(k)}</th>
              {/* Daisy (bcecb425, B6): on a phone each row is drawn as a block, each value with its own label (data-label) */}
              <td data-label={s("sertifikat.ganti.tercetak")}>{lama ?? "—"}</td>
              <td data-label={s("sertifikat.ganti.kini")}>{kini ?? "—"}</td>
              <td>{lama !== kini ? <span className="pin-pill pin-info">{s("sertifikat.ganti.berbeda")}</span> : null}</td>
            </tr>
          ))}
          <tr data-berubah="tidak" data-ganti-hasil="">
            <th scope="row">{s("sertifikat.ganti.hasil")}</th>
            <td colSpan={2}>{s("sertifikat.ganti.hasil_arti")}</td>
            <td>{s("sertifikat.ganti.sama_kata")}</td>
          </tr>
        </tbody>
      </table>
      {pratinjau.berubah ? (
        <form method="post" action="/api/sertifikat/ganti" data-ganti-form={id}>
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
