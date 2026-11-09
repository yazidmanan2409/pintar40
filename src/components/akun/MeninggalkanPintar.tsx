import { t, type HleEvent, type Locale } from "@/lib/hle";
import { tanggal } from "@/lib/tanggal";
import TombolKirim from "@/components/TombolKirim";
import BarisHasil from "@/components/BarisHasil";
import { mintaAkunAksi } from "@/app/akun/actions";
import { JENIS_PERMINTAAN, type KodeAkun } from "@/lib/akun-kontrak";

export type PermintaanSaya = { id: string; kind: string; status: string; created_at: string; decided_at: string | null };

/**
 * L1 (owner, 9 Nov: «Easy to join. Easy to leave. Never held hostage.»): «MENINGGALKAN PINTAR» on Akun saya, for
 * everyone. What leaving does, line by line and true of today: access, personal data, academic records, certificates,
 * the audit log and backups. Then the person's own requests with what became of each, and the two requests themselves,
 * each with one confirmation and nothing else: no retention offer, no detour, no support email. A learner (a person
 * with a live enrolment) is told the request is made through the school with the family, and offered no form.
 */
export default function MeninggalkanPintar({ locale, bisaMinta, permintaan, hasil, kode, persona }: {
  locale: Locale; bisaMinta: boolean; permintaan: PermintaanSaya[]; hasil: string | undefined; kode: KodeAkun | null;
  persona: "staff" | "learner";
}) {
  const s = (k: HleEvent) => t(k, persona, { locale });
  const terbuka = (k: string) => permintaan.some((p) => p.kind === k && (p.status === "RECEIVED" || p.status === "IN_PROGRESS"));
  return (
    <section className="pin-sec" id="meninggalkan" aria-labelledby="pin-meninggalkan">
      <h2 id="pin-meninggalkan">{s("akun.tinggal.judul")}</h2>
      <p className="pin-sub">{s("akun.tinggal.arti")}</p>
      <ul className="pin-tinggal-fakta">
        {(["akses", "data", "akademik", "sertifikat", "audit", "cadangan"] as const).map((k) => (
          <li key={k}>{s(`akun.tinggal.fakta.${k}` as HleEvent)}</li>
        ))}
      </ul>
      {hasil === "ok" ? <BarisHasil nada="ok">{s("akun.tinggal.ok")}</BarisHasil> : null}
      {hasil === "gagal" ? <BarisHasil nada="gagal">{s(`akun.tinggal.galat.${(kode ?? "ACCOUNT_FAILED").toLowerCase()}` as HleEvent)}</BarisHasil> : null}
      {permintaan.length > 0 ? (
        <ul className="pin-list" data-permintaan-saya={permintaan.length}>
          {permintaan.map((p) => (
            <li key={p.id} className="pin-row">
              <span className="pin-title">{s(`akun.tinggal.jenis.${p.kind.toLowerCase()}` as HleEvent)}</span>
              <span className="pin-rowmeta">{tanggal(p.created_at, "baca", locale)}</span>
              <span className="pin-pill pin-neutral">{s(`akun.tinggal.status.${p.status.toLowerCase()}` as HleEvent)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {bisaMinta ? (
        JENIS_PERMINTAAN.filter((j) => !terbuka(j)).map((j) => (
          <form key={j} action={mintaAkunAksi} className="pin-tinggal-minta" data-minta-akun={j}>
            <input type="hidden" name="jenis" value={j} />
            <h3>{s(`akun.tinggal.jenis.${j.toLowerCase()}` as HleEvent)}</h3>
            <p>{s(`akun.tinggal.akibat.${j.toLowerCase()}` as HleEvent)}</p>
            <label className="pin-cepat-centang">
              <input type="checkbox" name="konfirmasi" value="ya" required />
              <span>{s(`akun.tinggal.konfirmasi.${j.toLowerCase()}` as HleEvent)}</span>
            </label>
            <div className="pin-actions">
              <TombolKirim className={j === "CLOSE" ? "pin-btn pin-bahaya" : "pin-btn"} sibuk={s("tombol.memproses")}>
                {s(`akun.tinggal.tombol.${j.toLowerCase()}` as HleEvent)}
              </TombolKirim>
            </div>
          </form>
        ))
      ) : (
        <p className="pin-meta" data-tinggal-lewat-sekolah="">{s("akun.tinggal.lewat_sekolah")}</p>
      )}
    </section>
  );
}
