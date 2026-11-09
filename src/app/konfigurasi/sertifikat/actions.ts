"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { KODE_CABUT, kodeDariGalat, kodeGantiDariGalat, type KodeCabut, type KodeGanti } from "@/lib/sertifikat-cabut-kontrak";
import { supabaseService } from "@/lib/supabase/service";
import { assertKeyringUsable, signingKeyVersion, signPayload } from "@/lib/certificates/keyring";
import { type CanonicalPayload } from "@/lib/certificates/sign";
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

export async function cabutSertifikatAksi(fd: FormData) {
  const id = String(fd.get("sertifikat") ?? "");
  const alasan = String(fd.get("alasan") ?? "").trim();
  if (!UUID.test(id)) kembali("", "gagal", "TIDAK_DITEMUKAN");
  if (!alasan) kembali(id, "gagal", "ALASAN_WAJIB");
  await wajibDalamKonteks({ sekolah: await sekolahSertifikat(id), atauPlatform: true }, "cabut", { pilih: id });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("revoke_certificate", { p_certificate: id, p_reason: alasan });
  if (!error) kembali(id, "ok");
  const kode = kodeDariGalat(error);
  kembali(id, "gagal", KODE_CABUT.includes(kode) ? kode : "LAYANAN_TIDAK_TERSEDIA");
}

/**
 * W2.22 (owner, 9 Nov): «TERBITKAN ULANG», the replacement of an erroneous issued certificate.
 *
 * The admin's own client asks sertifikat_koreksi_siapkan, which decides everything (CAN_PUBLISH in the certificate's
 * school, an ISSUED original, a reason of 10–300 characters, something that would change) and prepares the replacement
 * not yet public. Only then does this server sign its payload with the keyring, as /api/certificates/issue does, and
 * seal it with the service client (sertifikat_koreksi_segel, service only), which supersedes the original in the same
 * transaction. A failed signature leaves the replacement unsealed and the original as it was; pressing again signs the
 * same replacement.
 */
function kembaliGanti(id: string, hasil: "ok" | "gagal", kode?: KodeGanti): never {
  const q = new URLSearchParams({ pilih: id, hasil, jenis: "ganti" });
  if (kode) q.set("kode", kode);
  redirect(`/konfigurasi/sertifikat?${q.toString()}#cabut`);
}

export async function terbitUlangSertifikatAksi(fd: FormData) {
  const id = String(fd.get("sertifikat") ?? "");
  const alasan = String(fd.get("alasan") ?? "").trim();
  if (!UUID.test(id)) kembaliGanti("", "gagal", "TIDAK_DITEMUKAN");
  await wajibDalamKonteks({ sekolah: await sekolahSertifikat(id), atauPlatform: true }, "cabut", { pilih: id });
  try {
    assertKeyringUsable();
  } catch {
    kembaliGanti(id, "gagal", "LAYANAN_TIDAK_TERSEDIA");
  }
  const versi = signingKeyVersion();
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("sertifikat_koreksi_siapkan", { p_certificate: id, p_reason: alasan, p_key_version: versi });
  const baris = Array.isArray(data) ? (data[0] as { certificate_id: string; canonical_payload: CanonicalPayload } | undefined) : undefined;
  if (error || !baris) kembaliGanti(id, "gagal", kodeGantiDariGalat(error));
  const tanda = signPayload(baris.canonical_payload, versi);
  const { error: e2 } = await supabaseService().rpc("sertifikat_koreksi_segel", {
    p_replacement: baris.certificate_id, p_key_version: versi, p_signature: tanda,
  });
  if (e2) kembaliGanti(id, "gagal", kodeGantiDariGalat(e2));
  kembaliGanti(id, "ok");
}
