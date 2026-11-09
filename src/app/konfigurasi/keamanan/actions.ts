"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { kodeAkunDariGalat, type KodeAkun } from "@/lib/akun-kontrak";

/**
 * §5b and L4 (owner, 9 Nov): the PINTAR Administrator's own acts on one identity, each one call with the reader's own
 * client: tangguhkan_akun, aktifkan_kembali_akun and hapus_data_pribadi refuse anyone but an active SYSTEM_ADMIN, and
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

export async function hapusDataPribadiAksi(fd: FormData): Promise<void> {
  const permintaan = String(fd.get("permintaan") ?? "");
  if (!UUID.test(permintaan)) kembali("", "gagal", "ACCOUNT_REQUEST_INVALID");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("hapus_data_pribadi", { p_request: permintaan, p_catatan: String(fd.get("catatan") ?? "").trim() || null });
  if (error) kembali("", "gagal", kodeAkunDariGalat(error));
  kembali("", "ok", undefined, "hapus");
}
