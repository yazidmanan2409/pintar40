import Link from "next/link";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { MENIT_TAMBAHAN, kunciKodePengerjaan, menitDari, tindakanUntuk, type BarisPengerjaan, type KodePengerjaan, type Tindakan } from "@/lib/pengerjaan-kontrak";
import { isi, waktuSekolah } from "@/lib/pengerjaan-tampil";
import { akhiriSesiAksi, lanjutkanSesiAksi, mintaKesempatanAksi, tambahWaktuAksi, tutupDitahanAksi } from "@/app/mengajar/pengerjaan-aksi";
import KonfirmasiBahaya from "@/components/KonfirmasiBahaya";
import TombolKirim from "@/components/TombolKirim";
import BarisHasil from "@/components/BarisHasil";
import FokusPanel from "@/components/FokusPanel";

/**
 * A1 «Atur»: THE ACT PANEL UNDER «Siapa yang sudah mengumpulkan», opened from one learner's row (Daisy, TINJAUAN-A1-C1W
 * Q4). One panel at a time, in the page, never a dialog.
 *
 * ONLY THE ACTS THAT APPLY (tindakanUntuk): an act that cannot apply is absent, not disabled. Each act is its own
 * form with its own reason (10 to 300 characters, recorded) and ends in the one destructive confirmation; a request
 * and a resume change nothing that is lost, so they are plain. The database decides every act again
 * (CAN_MANAGE_SITTINGS over the sitting's own place) and a refusal comes back here with its sentence, beside the act
 * that was refused: among them «the sitting ended before your change was saved».
 *
 * A HELD SITTING IS «DITAHAN». The teacher is never told why it is held; only that it waits for them.
 */
export default function AturPengerjaan({ kelasId, kelasNama, penugasan, baris, instrumen, sertifikat, zona, locale, kode, tindakan, kembali }: {
  /** A2a: the class's name, for the stopped-class refusal («Kelas {kelas} …») */
  kelasNama?: string;
  kelasId: string;
  penugasan: string;
  baris: BarisPengerjaan;
  /** the instrument's name as the page says it («Uji Penguasaan») */
  instrumen: string;
  /** whether this instrument can lead to a certificate (the Uji Penguasaan), for the request's second sentence */
  sertifikat: boolean;
  zona: string | null;
  locale: Locale;
  kode: KodePengerjaan | null;
  /** the act a refusal came back from */
  tindakan: string | null;
  kembali: string;
}) {
  const s = (k: HleEvent) => t(k, "educator", { locale });
  const ada = tindakanUntuk(baris);
  const sesi = baris.sesi_id ?? "";
  const nama = baris.nama;
  const tersembunyi = (
    <>
      <input type="hidden" name="kelas" value={kelasId} />
      <input type="hidden" name="penugasan" value={penugasan} />
      <input type="hidden" name="sesi" value={sesi} />
    </>
  );
  const alasan = (untuk: Tindakan) => (
    <div className="pin-isian">
      <label htmlFor={`atur-${untuk}-alasan`}>{s("mengajar.akhiri.alasan")}</label>
      <textarea id={`atur-${untuk}-alasan`} name="alasan" className="pin-input" rows={3} minLength={10} maxLength={300} required
        aria-describedby={`atur-${untuk}-alasan-arti`} />
      <p id={`atur-${untuk}-alasan-arti`} className="pin-hint">{s("mengajar.akhiri.alasan.arti")}</p>
    </div>
  );
  const pesan = (k: KodePengerjaan) => s(kunciKodePengerjaan(k)).replace("{kelas}", kelasNama ?? "");
  const galat = (untuk: Tindakan) => (kode && tindakan === untuk ? <BarisHasil nada="gagal">{pesan(kode)}</BarisHasil> : null);
  const pilihan = (kunci: HleEvent, nilai: string) => {
    const [depan, ...sisa] = s(kunci).split(": ");
    return (
      <li>
        <label className="pin-cepat-centang">
          <input type="radio" name="cara" value={nilai} required aria-describedby={`atur-cara-${nilai}-arti`} />
          <span><strong>{depan}</strong>{sisa.length > 0 ? `: ${sisa.join(": ")}` : ""}</span>
        </label>
        <p id={`atur-cara-${nilai}-arti`} className="pin-hint">{s(`${kunci}.arti` as HleEvent)}</p>
      </li>
    );
  };
  const sisaDitahan = menitDari(baris.sisa_ditahan_detik);

  return (
    <section id="atur" className="pin-sec pin-ulang pin-akhiri pin-atur" aria-labelledby="pin-atur-judul" data-atur={sesi} tabIndex={-1}>
      <FokusPanel id="atur" kunci={`${sesi}:${kode ?? ""}:${tindakan ?? ""}`} />
      <h2 id="pin-atur-judul">{isi(s("atur.panel.judul"), { nama })}</h2>
      {/* a refusal that names no act of this panel (the act no longer applies: the sitting moved on) is said once, here */}
      {kode && !(ada as string[]).includes(tindakan ?? "") ? <BarisHasil nada="gagal">{pesan(kode)}</BarisHasil> : null}
      {ada.length === 0 ? <p className="pin-sub" data-atur-kosong="">{s("atur.panel.tanpa_tindakan")}</p> : null}

      {ada.includes("waktu") ? (
        <form action={tambahWaktuAksi} className="pin-atur-tindakan pin-atur-waktu" data-atur-tindakan="waktu">
          {tersembunyi}
          <h3>{s("atur.waktu.judul")}</h3>
          {galat("waktu")}
          <div className="pin-isian">
            <label htmlFor={`atur-waktu-menit-${sesi}`}>{s("atur.waktu.pilih")}</label>
            <select id={`atur-waktu-menit-${sesi}`} name="menit" className="pin-input" defaultValue={MENIT_TAMBAHAN[0]} data-atur-menit="">
              {MENIT_TAMBAHAN.map((n) => <option key={n} value={n}>{isi(s("atur.waktu.menit"), { n })}</option>)}
            </select>
          </div>
          {alasan("waktu")}
          {/* the confirmation says the chosen minutes back with the new deadline on the school's clock (one drawn per
              choice; the stylesheet shows the chosen one's) */}
          {MENIT_TAMBAHAN.map((n) => (
            <div key={n} className="pin-actions" data-menit-untuk={n}>
              <KonfirmasiBahaya id={`atur-waktu-${n}-${sesi}`} sibuk={s("tombol.menyimpan")} tombol={s("atur.waktu.judul")} ya={s("atur.waktu.judul")} batal={s("mengajar.akhiri.batal")}
                tanya={isi(s("atur.waktu.tanya"), { n, nama, waktu: waktuSekolah(baris.tenggat ? new Date(Date.parse(baris.tenggat) + n * 60_000).toISOString() : null, zona, locale) })} />
            </div>
          ))}
        </form>
      ) : null}

      {ada.includes("akhiri") ? (
        <form action={akhiriSesiAksi} className="pin-atur-tindakan pin-atur-akhiri" data-atur-tindakan="akhiri">
          {tersembunyi}
          <h3>{s("atur.akhiri.judul")}</h3>
          {galat("akhiri")}
          {/* no default: the teacher chooses, and the choice is recorded */}
          <fieldset>
            <legend>{s("atur.akhiri.legenda")}</legend>
            <ul>
              {pilihan("atur.akhiri.dinilai", "SCORED")}
              {pilihan("atur.akhiri.tidak", "NOT_COUNTED")}
            </ul>
          </fieldset>
          {alasan("akhiri")}
          {/* the act's words follow the choice (both drawn; the stylesheet shows the chosen one, and neither before a choice) */}
          <div className="pin-actions" data-cara-untuk="SCORED">
            <KonfirmasiBahaya id={`atur-nilai-${sesi}`} sibuk={s("tombol.menyimpan")} tombol={s("atur.akhiri.tombol_nilai")} ya={s("atur.akhiri.tombol_nilai")}
              batal={s("mengajar.akhiri.batal")} tanya={isi(s("atur.akhiri.tanya_nilai"), { instrumen, nama })} akibat={<p>{s("atur.akhiri.dinilai.arti")}</p>} />
          </div>
          <div className="pin-actions" data-cara-untuk="NOT_COUNTED">
            <KonfirmasiBahaya id={`atur-tidak-${sesi}`} sibuk={s("tombol.menyimpan")} tombol={s("atur.akhiri.tombol_tidak")} ya={s("atur.akhiri.tombol_tidak")}
              batal={s("mengajar.akhiri.batal")} tanya={isi(s("atur.akhiri.tanya_tidak"), { instrumen, nama })} akibat={<p>{s("atur.akhiri.tidak.arti")}</p>} />
          </div>
        </form>
      ) : null}

      {ada.includes("lanjut") ? (
        <form action={lanjutkanSesiAksi} className="pin-atur-tindakan" data-atur-tindakan="lanjut">
          {tersembunyi}
          <h3>{s("atur.lanjut.judul")}</h3>
          {galat("lanjut")}
          <p className="pin-sub">{sisaDitahan !== null ? isi(s("atur.lanjut.arti"), { n: sisaDitahan }) : s("atur.lanjut.arti_tanpa_batas")}</p>
          {alasan("lanjut")}
          <div className="pin-actions"><TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.menyimpan")}>{s("atur.lanjut.judul")}</TombolKirim></div>
        </form>
      ) : null}

      {ada.includes("tutup") ? (
        <form action={tutupDitahanAksi} className="pin-atur-tindakan" data-atur-tindakan="tutup">
          {tersembunyi}
          <h3>{s("atur.akhiri.tombol_tidak")}</h3>
          {galat("tutup")}
          <p className="pin-sub">{s("atur.akhiri.tidak.arti")}</p>
          {alasan("tutup")}
          <div className="pin-actions">
            <KonfirmasiBahaya id={`atur-tutup-${sesi}`} sibuk={s("tombol.menyimpan")} tombol={s("atur.akhiri.tombol_tidak")} ya={s("atur.akhiri.tombol_tidak")}
              batal={s("mengajar.akhiri.batal")} tanya={isi(s("atur.akhiri.tanya_tidak"), { instrumen, nama })} akibat={<p>{s("atur.akhiri.tidak.arti")}</p>} />
          </div>
        </form>
      ) : null}

      {ada.includes("minta") ? (
        <form action={mintaKesempatanAksi} className="pin-atur-tindakan" data-atur-tindakan="minta">
          {tersembunyi}
          <h3>{s("atur.minta.judul")}</h3>
          {galat("minta")}
          <p className="pin-sub">{s("atur.minta.arti")}</p>
          {sertifikat ? <p className="pin-sub">{s("atur.minta.sertifikat")}</p> : null}
          {alasan("minta")}
          <div className="pin-actions"><TombolKirim className="pin-btn pin-primary" sibuk={s("tombol.mengirim")}>{s("atur.minta.tombol")}</TombolKirim></div>
        </form>
      ) : null}

      <p><Link className="pin-btn pin-quiet" href={kembali}>{s("mengajar.akhiri.tutup")}</Link></p>
    </section>
  );
}
