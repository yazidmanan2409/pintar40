"use client";

import { useActionState } from "react";
import { t, type HleEvent, type Locale } from "@/lib/hle";
import { tanggal } from "@/lib/tanggal";
import BarisHasil from "@/components/BarisHasil";
import TombolKirim from "@/components/TombolKirim";
import { cariRiwayatEmail, type BarisRiwayat, type HasilRiwayat } from "@/app/konfigurasi/email-uji/actions";

/**
 * J1.9 (D-098(c)): what happened to an email, as the send log knows it. One
 * field (an address or a reference) and one press; the answer is the sends,
 * newest first, each with what became of it. "Diterima server email" is the
 * most PINTAR can know: no inbox delivery is claimed.
 */
const JENIS: Record<string, HleEvent> = {
  KODE_AKTIVASI: "emailuji.r.jenis.KODE_AKTIVASI",
  KODE_ULANG: "emailuji.r.jenis.KODE_ULANG",
  PEMULIHAN_PASSWORD: "emailuji.r.jenis.PEMULIHAN_PASSWORD",
  PASSWORD_DIUBAH: "emailuji.r.jenis.PASSWORD_DIUBAH",
  KARTU_DIGITAL: "emailuji.r.jenis.KARTU_DIGITAL",
  PEMBERITAHUAN_KEAMANAN: "emailuji.r.jenis.PEMBERITAHUAN_KEAMANAN",
  UJI_PENGIRIMAN: "emailuji.r.jenis.UJI_PENGIRIMAN",
};

export function kunciHasil(b: Pick<BarisRiwayat, "hasil" | "batas">): HleEvent {
  if (b.hasil === "REFUSED_LIMIT") return b.batas === "GLOBAL" ? "emailuji.r.hasil.BATAS_UMUM" : "emailuji.r.hasil.BATAS_ALAMAT";
  return `emailuji.r.hasil.${b.hasil}` as HleEvent;
}

/** When the email was asked for: a record, so the timestamp («9 Okt 2026, 07.30 WIB»; W3.3, RV-16). */
function waktu(iso: string, locale: Locale): string {
  return tanggal(iso, "cap", locale) || iso;
}

export default function RiwayatEmail({ locale }: { locale: Locale }) {
  const s = (k: HleEvent) => t(k, "staff", { locale });
  const [hasil, cari] = useActionState<HasilRiwayat | null, FormData>(cariRiwayatEmail, null);

  return (
    <section className="pin-akt-orang" aria-labelledby="riwayat-email">
      <h2 id="riwayat-email">{s("emailuji.r.judul")}</h2>
      <p className="pin-meta">{s("emailuji.r.intro")}</p>
      <form className="pin-actions" action={cari}>
        <label className="pin-akt-isian">
          <span className="pin-meta">{s("emailuji.r.label")}</span>
          <input className="pin-input" type="text" name="cari" autoComplete="off" spellCheck={false} required />
        </label>
        <TombolKirim className="pin-btn" sibuk={s("tombol.memeriksa")}>{s("emailuji.r.tombol")}</TombolKirim>
      </form>
      {hasil === null ? null : hasil.k === "ada" ? (
        <ul className="pin-lap-baris">
          {hasil.baris.map((b) => (
            <li key={b.id}>
              <span>
                <strong>{s(JENIS[b.jenis] ?? "emailuji.r.jenis.lain")}</strong> · {waktu(b.diminta, locale)}
              </span>
              <span>
                {s(kunciHasil(b))}
                {b.kodeSmtp !== null && b.hasil === "REFUSED_BY_HOST" ? <> ({s("emailuji.r.kode")} <span className="pin-num">{b.kodeSmtp}</span>)</> : null}
                {" · "}{s("emailuji.rujukan")} <span className="pin-num">{b.id}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <BarisHasil nada={hasil.k === "kosong" ? "netral" : "gagal"}>{s(`emailuji.r.${hasil.k}` as HleEvent)}</BarisHasil>
      )}
    </section>
  );
}
