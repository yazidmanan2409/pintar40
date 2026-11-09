import { t, type HleEvent, type Locale } from "@/lib/hle";
import { tanggal } from "@/lib/tanggal";
import TombolKirim from "@/components/TombolKirim";
import BarisHasil from "@/components/BarisHasil";
import Kosong from "@/components/Kosong";
import { aktifkanKembaliAksi, tangguhkanAkunAksi } from "@/app/konfigurasi/keamanan/actions";
import { KATEGORI_TANGGUH, type KodeAkun } from "@/lib/akun-kontrak";

export type KeadaanAkun = {
  person_id: string; nama: string | null; pintar_id: string | null; anonim: boolean;
  tangguh: { kategori: string; sejak: string; catatan: string | null } | null;
};
export type BarisPermintaan = { id: string; person_id: string; nama: string; pintar_id: string; kind: string; status: string; created_at: string; ditutup: boolean };

/**
 * §5b and L2–L4 (owner, 9 Nov), the PINTAR Administrator's part of Keamanan akun: one identity found by its PINTAR ID,
 * suspended with a category and a note or reactivated with a reason; and the queue of the people's own requests, where
 * a closed account's request to delete personal data is carried out. A closure at the person's request reads as a
 * closure, never as a suspension.
 */
export default function AkunPlatform({ locale, pid, akun, antrean, hasil, apa, kode, ulang }: {
  locale: Locale; pid: string; akun: KeadaanAkun | null; antrean: BarisPermintaan[];
  hasil: string | undefined; apa: string | undefined; kode: KodeAkun | null; ulang?: string;
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  return (
    <section className="pin-sec" id="akun-platform" aria-labelledby="pin-akun-platform">
      <h2 id="pin-akun-platform">{s("keamanan.akun.judul")}</h2>
      <p className="pin-sub">{s("keamanan.akun.arti")}</p>
      {hasil === "ok" ? <BarisHasil nada="ok">{s(`keamanan.akun.ok.${apa === "aktif" ? "aktif" : apa === "hapus" ? "hapus" : "tangguh"}` as HleEvent)}</BarisHasil> : null}
      {hasil === "gagal" ? <BarisHasil nada="gagal">{s(`akun.tinggal.galat.${(kode ?? "ACCOUNT_FAILED").toLowerCase()}` as HleEvent)}</BarisHasil> : null}
      {/* Sharon §16 finding 2: the data is deleted and a photo file is not yet; one press finishes it */}
      {hasil === "gagal" && kode === "ACCOUNT_PHOTO_PENDING" && ulang ? (
        <form action="/api/akun/hapus-data" method="post" data-hapus-foto-ulang={ulang}>
          <input type="hidden" name="permintaan" value={ulang} />
          <TombolKirim className="pin-btn" sibuk={s("tombol.memproses")}>{s("keamanan.permintaan.hapus_foto_ulang")}</TombolKirim>
        </form>
      ) : null}
      <form method="get" action="/konfigurasi/keamanan" className="pin-isian" data-cari-akun="">
        <label htmlFor="akun-pid">{s("keamanan.akun.cari")}</label>
        <input id="akun-pid" name="pid" className="pin-input" defaultValue={pid} maxLength={8} autoComplete="off" />
        <button type="submit" className="pin-btn">{s("keamanan.akun.cari_tombol")}</button>
      </form>
      {pid && !akun ? <p className="pin-meta">{s("keamanan.akun.tidak_ada")}</p> : null}
      {akun ? (
        <div className="pin-koreksi" data-akun-platform={akun.person_id}>
          <h3>{akun.nama ?? "—"} · <span className="pin-num">{akun.pintar_id}</span></h3>
          {akun.tangguh ? (
            <>
              <p className="pin-meta" data-akun-keadaan={akun.tangguh.kategori}>
                {s(akun.tangguh.kategori === "CLOSED_AT_REQUEST" ? "keamanan.akun.ditutup" : "keamanan.akun.ditangguhkan")}
                {" "}{tanggal(akun.tangguh.sejak, "baca", locale)}
                {akun.tangguh.kategori !== "CLOSED_AT_REQUEST" ? ` · ${s(`keamanan.akun.kategori.${akun.tangguh.kategori.toLowerCase()}` as HleEvent)}` : ""}
              </p>
              <form action={aktifkanKembaliAksi} data-aktifkan-akun="">
                <input type="hidden" name="orang" value={akun.person_id} />
                <input type="hidden" name="pid" value={pid} />
                <div className="pin-isian">
                  <label htmlFor="akun-aktif-alasan">{s("keamanan.akun.alasan")}</label>
                  <textarea id="akun-aktif-alasan" name="alasan" className="pin-input" rows={2} minLength={10} maxLength={300} required />
                </div>
                <TombolKirim className="pin-btn" sibuk={s("tombol.memproses")}>
                  {s(akun.tangguh.kategori === "CLOSED_AT_REQUEST" ? "keamanan.akun.buka_lagi" : "keamanan.akun.aktifkan")}
                </TombolKirim>
              </form>
            </>
          ) : (
            <form action={tangguhkanAkunAksi} data-tangguhkan-akun="">
              <input type="hidden" name="orang" value={akun.person_id} />
              <input type="hidden" name="pid" value={pid} />
              <p className="pin-meta">{s("keamanan.akun.akibat")}</p>
              <div className="pin-isian">
                <label htmlFor="akun-kategori">{s("keamanan.akun.kategori")}</label>
                <select id="akun-kategori" name="kategori" className="pin-input" required defaultValue="">
                  <option value="" disabled>—</option>
                  {KATEGORI_TANGGUH.map((k) => <option key={k} value={k}>{s(`keamanan.akun.kategori.${k.toLowerCase()}` as HleEvent)}</option>)}
                </select>
              </div>
              <div className="pin-isian">
                <label htmlFor="akun-catatan">{s("keamanan.akun.catatan")}</label>
                <textarea id="akun-catatan" name="catatan" className="pin-input" rows={2} maxLength={300} />
              </div>
              <TombolKirim className="pin-btn pin-bahaya" sibuk={s("tombol.memproses")}>{s("keamanan.akun.tangguhkan")}</TombolKirim>
            </form>
          )}
        </div>
      ) : null}

      <h3>{s("keamanan.permintaan.judul")}</h3>
      {antrean.length === 0 ? <Kosong jenis="belum" kalimat={s("keamanan.permintaan.kosong")} /> : (
        <ul className="pin-list" data-antrean-akun={antrean.length}>
          {antrean.map((r) => (
            <li key={r.id} className="pin-row" data-permintaan={r.id}>
              <span className="pin-title">{r.nama} · <span className="pin-num">{r.pintar_id}</span></span>
              <span className="pin-rowmeta">{s(`akun.tinggal.jenis.${r.kind.toLowerCase()}` as HleEvent)} · {tanggal(r.created_at, "baca", locale)}</span>
              {r.kind === "DELETE_PERSONAL_DATA" && r.ditutup ? (
                // Sharon §16 finding 2: a route, so the photo files go with the data (src/app/api/akun/hapus-data)
                <form action="/api/akun/hapus-data" method="post" data-hapus-data={r.id}>
                  <input type="hidden" name="permintaan" value={r.id} />
                  <TombolKirim className="pin-btn pin-bahaya" sibuk={s("tombol.memproses")}>{s("keamanan.permintaan.hapus")}</TombolKirim>
                </form>
              ) : <span className="pin-meta">{s("keamanan.permintaan.belum_ditutup")}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
