import Link from "next/link";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import type { HasilSkema } from "@/lib/kesehatan-skema";

/**
 * THE KONFIGURASI HEALTH CARD (BOB-19).
 *
 * It judges the schema by the one rule F01-T13 uses (src/lib/kesehatan-skema),
 * so a clean, fully migrated database reads "Semua pemeriksaan lolos". A check
 * that is not as expected is named in words, so "Perlu perhatian" says where to
 * look.
 *
 * Five states: not a platform administrator; not checked yet (BOB-18 (b):
 * the check runs only when asked, and its link never prefetches); the check
 * could not run (a reference, never the database's words); healthy;
 * needs attention.
 */
export type KeadaanKesehatan =
  | { jenis: "bukan_admin" }
  | { jenis: "belum" }
  | { jenis: "gagal"; rujukan: string }
  | { jenis: "diperiksa"; hasil: HasilSkema };

const PERIKSA = "/konfigurasi?periksa=skema";

export default function KartuKesehatan({ locale, keadaan, kelas, tautan }: {
  locale: Locale;
  keadaan: KeadaanKesehatan;
  /** The card's own class and its links' class, the page's. */
  kelas: string;
  tautan: string;
}) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const periksa = (label: HleEvent) => (
    <Link href={PERIKSA} prefetch={false} className={tautan}>{s(label)}</Link>
  );
  return (
    <div className={`${kelas} pin-sehat`}>
      <p className="pin-sehat-label">{s("config.card.health")}</p>
      {keadaan.jenis === "bukan_admin" ? (
        <p className="pin-sehat-kata">{s("config.kesehatan.bukan_admin")}</p>
      ) : keadaan.jenis === "belum" ? (
        periksa("config.card.health.periksa")
      ) : keadaan.jenis === "gagal" ? (
        <>
          <p className="pin-sehat-gagal">
            {s("config.kesehatan.gagal")} {s("galat.rujukan")}: {keadaan.rujukan}.
          </p>
          {periksa("config.kesehatan.ulang")}
        </>
      ) : keadaan.hasil.sehat ? (
        <>
          <p className="pin-sehat-tanda"><span className="pin-pill pin-ok">{s("config.kesehatan.sehat")}</span></p>
          <p className="pin-sehat-label">{keadaan.hasil.jumlah} {s("config.kesehatan.jumlah")}</p>
          {periksa("config.kesehatan.ulang")}
        </>
      ) : (
        <>
          <p className="pin-sehat-tanda"><span className="pin-pill pin-attention">{s("config.kesehatan.perhatian")}</span></p>
          <p className="pin-sehat-kata">{s("config.kesehatan.menyimpang")}</p>
          <ul className="pin-sehat-daftar">
            {keadaan.hasil.menyimpang.map((k) => <li key={k}>{s(`config.kesehatan.cek.${k}` as HleEvent)}</li>)}
          </ul>
          {periksa("config.kesehatan.ulang")}
        </>
      )}
    </div>
  );
}
