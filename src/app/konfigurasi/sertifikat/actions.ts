"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { KODE_CABUT, type KodeCabut } from "@/lib/sertifikat-cabut-kontrak";
import { wajibDalamKonteks } from "@/lib/konteks-server";
import { sekolahSertifikat } from "@/lib/sertifikat-sekolah";

/**
 * W2.5 (Batch 5; CR-05, ADM-18, J8.5): THE SCHOOL ADMIN REVOKES A CERTIFICATE.
 *
 * One act, asked of the database with the reader's own client: revoke_certificate refuses anyone without CAN_PUBLISH
 * in the certificate's school, wants a reason, refuses a second revocation (the first stands, D-093), and audits the
 * revocation itself (certificate.revoked: the reason, from and to). Before it acts, the certificate's school must be the
 * working context's (or «Seluruh platform», D-132(k)); otherwise the chooser offers that school and returns here.
 * Nothing here decides; the answer comes back to the certificate's panel as ?hasil=…&kode=… and is said there.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function kembali(id: string, hasil: "ok" | "gagal", kode?: KodeCabut): never {
  const q = new URLSearchParams({ pilih: id, hasil });
  if (kode) q.set("kode", kode);
  redirect(`/konfigurasi/sertifikat?${q.toString()}#cabut`);
}

/** The database's refusal, as one of the screen's codes. */
export async function kodeDariGalat(e: { code?: string; message?: string; details?: string | null }): Promise<KodeCabut> {
  const pesan = e.message ?? "";
  if (e.details === "CERTIFICATE_ALREADY_REVOKED" || /already revoked/.test(pesan)) return "SUDAH_DICABUT";
  if (/records why/.test(pesan)) return "ALASAN_WAJIB";
  if (/requires CAN_PUBLISH/.test(pesan) || e.code === "42501") return "DITOLAK";
  if (/unknown certificate/.test(pesan)) return "TIDAK_DITEMUKAN";
  return "LAYANAN_TIDAK_TERSEDIA";
}

export async function cabutSertifikatAksi(fd: FormData) {
  const id = String(fd.get("sertifikat") ?? "");
  const alasan = String(fd.get("alasan") ?? "").trim();
  if (!UUID.test(id)) kembali("", "gagal", "TIDAK_DITEMUKAN");
  if (!alasan) kembali(id, "gagal", "ALASAN_WAJIB");
  await wajibDalamKonteks({ sekolah: await sekolahSertifikat(id), atauPlatform: true }, "cabut");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("revoke_certificate", { p_certificate: id, p_reason: alasan });
  if (!error) kembali(id, "ok");
  const kode = await kodeDariGalat(error);
  kembali(id, "gagal", KODE_CABUT.includes(kode) ? kode : "LAYANAN_TIDAK_TERSEDIA");
}
