/**
 * DAISY-22 × BOB-28: THE SECURITY NOTICE (PEMBERITAHUAN_KEAMANAN), in the
 * PINTAR frame. Only src/app/api/_email/keamanan.ts imports this file; the
 * data shape is src/lib/email/identitas.ts (DataEmailKeamanan).
 *
 * One email per event (C7), in two voices: to the OWNER («Pemulihan dengan PIN
 * untuk akun Anda dikunci…», with the way to an email recovery when it was not
 * them) and to the PLATFORM ADMIN (which PINTAR ID, what happened, when). It
 * carries the PINTAR ID, which is not a secret, and the time; never a PIN, a
 * code, a password, an address or anything about where the attempt came from.
 */
import { type HleEvent } from "@/lib/hle";
import { tanggal } from "@/lib/tanggal";
import type { Templat } from "@/lib/email/templat";
import type { DataEmailKeamanan } from "@/lib/email/identitas";
import { tampilPintarId } from "@/lib/aktivasi-kontrak";
import { bingkaiEmail, kata, type Blok } from "./bingkai";

export const templatKeamanan: Templat<DataEmailKeamanan> = (data, konteks) => {
  // the formal form with its time, «4 Oktober 2026 pukul 15.00 WIB», from the one date helper (W3.3, RV-16)
  const kapan = tanggal(data.waktu, "resmiJam") || data.waktu;
  const p = data.peristiwa.toLowerCase();
  const k = (akhir: string) => kata(`email.aman.${p}.${akhir}` as HleEvent);
  const admin = data.untuk === "ADMIN";
  const isi: Blok[] = [
    { jenis: "paragraf", teks: admin ? k("isi_admin") : k("isi") },
    { jenis: "rincian", baris: [[kata("email.aman.id"), tampilPintarId(data.pintarId)], [kata("email.aman.waktu"), kapan]] },
  ];
  if (admin) {
    isi.push({ jenis: "catatan", teks: kata("email.aman.admin_catatan") });
  } else {
    isi.push({ jenis: "catatan", nada: "perhatian", teks: k("bukan_anda") });
    isi.push({ jenis: "tombol", teks: kata("email.aman.tombol"), href: data.tautanLupa, cadangan: true });
  }
  return bingkaiEmail(
    {
      subjek: admin ? `${k("subjek_admin")} · ${tampilPintarId(data.pintarId)}` : k("subjek"),
      pratinjau: admin ? k("isi_admin") : k("isi"),
      judul: admin ? k("subjek_admin") : k("judul"),
      isi,
      alasan: kata(admin ? "email.aman.alasan_admin" : "email.aman.alasan"),
    },
    konteks,
  );
};

