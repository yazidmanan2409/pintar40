"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { kodeAkunDariGalat, type KodeAkun } from "@/lib/akun-kontrak";

/**
 * §5b and L4 (owner, 9 Nov): the PINTAR Administrator's own acts on one identity, each one call with the reader's own
 * client: tangguhkan_akun and aktifkan_kembali_akun (and hapus_data_pribadi, behind its route) refuse anyone but an active SYSTEM_ADMIN, and
 * the administrator's own account. Platform-scoped by the database's rule; the answer comes back as ?hasil=…&kode=….
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PID = /^[0-9A-HJKMNP-TV-Z]{8}$/;

function kembali(pid: string, hasil: "ok" | "gagal", kode?: KodeAkun, apa?: string): never {
  const q = new URLSearchParams({ hasil });
  if (PID.test(pid)) q.set("pid", pid);
  if (kode) q.set("kode", kode);
  if (apa) q.set("apa", apa);
  redirect(`/konfigurasi/keamanan?${q.toString()}#akun-platform`);
}

export async function tangguhkanAkunAksi(fd: FormData): Promise<void> {
  const orang = String(fd.get("orang") ?? ""); const pid = String(fd.get("pid") ?? "");
  if (!UUID.test(orang)) kembali(pid, "gagal", "ACCOUNT_UNKNOWN");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("tangguhkan_akun", {
    p_person: orang, p_kategori: String(fd.get("kategori") ?? ""), p_catatan: String(fd.get("catatan") ?? "").trim() || null,
  });
  if (error) kembali(pid, "gagal", kodeAkunDariGalat(error));
  kembali(pid, "ok", undefined, "tangguh");
}

export async function aktifkanKembaliAksi(fd: FormData): Promise<void> {
  const orang = String(fd.get("orang") ?? ""); const pid = String(fd.get("pid") ?? "");
  if (!UUID.test(orang)) kembali(pid, "gagal", "ACCOUNT_UNKNOWN");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("aktifkan_kembali_akun", { p_person: orang, p_alasan: String(fd.get("alasan") ?? "") });
  if (error) kembali(pid, "gagal", kodeAkunDariGalat(error));
  kembali(pid, "ok", undefined, "aktif");
}

// L4 «Hapus data pribadi» is a route (src/app/api/akun/hapus-data), so the photo files are removed with the data.

/**
 * Owner ruling 2 (9 Nov): an Admin PINTAR reopens a closed account from its request in the queue, after confirming the
 * person's identity, and says how (buka_kembali_akun decides: SYSTEM_ADMIN, an open REOPEN request of a closed account,
 * 10–300 characters). The tick is the form's: nothing is sent without it.
 */
export async function bukaKembaliAksi(fd: FormData): Promise<void> {
  const permintaan = String(fd.get("permintaan") ?? "");
  if (!UUID.test(permintaan) || fd.get("diverifikasi") !== "ya") kembali("", "gagal", "ACCOUNT_NOTE_REQUIRED");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("buka_kembali_akun", { p_request: permintaan, p_cara_verifikasi: String(fd.get("cara") ?? "").trim() });
  if (error) kembali("", "gagal", kodeAkunDariGalat(error));
  kembali("", "ok", undefined, "buka");
}
