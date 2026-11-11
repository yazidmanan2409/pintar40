import Link from "next/link";
import { t, hariIniSekolah, type HleEvent, type Locale } from "@/lib/hle";
import type { Penugasan } from "@/lib/pengajar";
import { kunciKodePengerjaan, type KodePengerjaan } from "@/lib/pengerjaan-kontrak";
import { isi } from "@/lib/pengerjaan-tampil";
import { bagianJakarta, geserZona, kataZona } from "@/lib/tanggal";
import { ubahJadwalAksi } from "@/app/mengajar/pengerjaan-aksi";
import TombolKirim from "@/components/TombolKirim";
import BarisHasil from "@/components/BarisHasil";
import FokusPanel from "@/components/FokusPanel";
import TanggalDenganGema from "@/components/bentuk/TanggalDenganGema";

/**
 * A1 «Ubah jadwal» on the class page, opened from one material's row beside «Akhiri atau tarik» (Daisy,
 * TINJAUAN-A1-C1W Q4). The lesson's own window, in days on the school's clock as «Sediakan» took them, with a reason;
 * the database changes the lesson's dates and its assessments' together and records before and after
 * (ubah_jadwal_penugasan). A student already working keeps their own deadline, and the panel says so before the act.
 */
export default function UbahJadwal({ kelasId, tugas, zona, kode, locale }: {
  kelasId: string;
  tugas: Penugasan;
  zona: string | null;
  kode: KodePengerjaan | null;
  locale: Locale;
}) {
  const s = (k: HleEvent) => t(k, "educator", { locale });
  const kursus = tugas.kursus || s("mengajar.akhiri.tanpa_judul");
  const hari = (v: string | null) => {
    const p = bagianJakarta(v, geserZona(zona));
    return p ? `${p.tahun}-${String(p.bulan).padStart(2, "0")}-${String(p.hari).padStart(2, "0")}` : "";
  };
  const hariIni = hariIniSekolah(new Date(), zona ?? undefined);
  const kata = kataZona(zona);
  return (
    <form id="jadwal" action={ubahJadwalAksi} className="pin-sec pin-ulang pin-akhiri" data-jadwal={tugas.id} aria-labelledby="pin-jadwal-judul" tabIndex={-1}>
      <FokusPanel id="jadwal" kunci={`${tugas.id}:${kode ?? ""}`} />
      <input type="hidden" name="kelas" value={kelasId} />
      <input type="hidden" name="penugasan" value={tugas.id} />
      <h2 id="pin-jadwal-judul">{isi(s("jadwal.judul"), { kursus })}</h2>
      <p className="pin-sub">{s("jadwal.catatan")}</p>
      {kode ? <BarisHasil nada="gagal">{s(kunciKodePengerjaan(kode))}</BarisHasil> : null}
      <div className="pin-isian">
        <label htmlFor="jadwal-mulai">{isi(s("jadwal.mulai"), { zona: kata })}</label>
        <TanggalDenganGema id="jadwal-mulai" name="mulai" required defaultValue={hari(tugas.mulai) || hariIni} locale={locale} untuk="educator" />
      </div>
      <div className="pin-isian">
        <label htmlFor="jadwal-sampai">{isi(s("jadwal.sampai"), { zona: kata })}</label>
        <TanggalDenganGema id="jadwal-sampai" name="sampai" min={hariIni} defaultValue={hari(tugas.sampai)} keterangan="jadwal-sampai-arti" kosong={s("mengajar.siap.sampai.kosong")} locale={locale} untuk="educator" />
        <p id="jadwal-sampai-arti" className="pin-hint">{s("jadwal.sampai.arti")}</p>
      </div>
      <div className="pin-isian">
        <label htmlFor="jadwal-alasan">{s("mengajar.akhiri.alasan")}</label>
        <textarea id="jadwal-alasan" name="alasan" className="pin-input" rows={3} minLength={10} maxLength={300} required aria-describedby="jadwal-alasan-arti" />
        <p id="jadwal-alasan-arti" className="pin-hint">{s("mengajar.akhiri.alasan.arti")}</p>
      </div>
      <div className="pin-actions">
        <TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.menyimpan")}>{s("jadwal.tombol")}</TombolKirim>
        <Link className="pin-btn pin-quiet" href={`/mengajar/${encodeURIComponent(kelasId)}#materi`}>{s("mengajar.akhiri.tutup")}</Link>
      </div>
    </form>
  );
}
