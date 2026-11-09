"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { wajibDalamKonteks } from "@/lib/konteks-server";
import { batasHari } from "@/lib/hle";
import { zonaSekolah } from "@/lib/zona-sekolah";
import { kodeStafDariGalat, type KodeStaf } from "@/lib/staf-kontrak";

/**
 * E5 «Akhiri tugas di sekolah ini» and §11 «Ubah peran & tanggung jawab» (owner, 9 Nov). Each act is one call with the
 * reader's own client: akhiri_tugas_staf and ubah_peran decide everything (INSTITUTION_ADMIN of the school, never the
 * admin's own roles, the category, the reason, the date, the stale review, the role and its place, the second press for
 * Admin sekolah) and every grant and revocation passes role_assignments_guard. Before it acts, the school must be the
 * working context's. The answer comes back to the person's page as ?hasil=…&kode=….
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HARI = /^\d{4}-\d{2}-\d{2}$/;

function teks(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function kembali(orang: string, jenis: "ubah" | "akhiri", hasil: "ok" | "gagal", kode?: KodeStaf, sisa?: Record<string, string>): never {
  const q = new URLSearchParams({ orang, jenis, hasil, ...(sisa ?? {}) });
  if (kode) q.set("kode", kode);
  redirect(`/konfigurasi/staf?${q.toString()}#${jenis}`);
}

export async function akhiriTugasAksi(fd: FormData): Promise<void> {
  const orang = teks(fd, "orang");
  const sekolah = teks(fd, "sekolah");
  if (!UUID.test(orang) || !UUID.test(sekolah)) redirect("/konfigurasi/roles");
  await wajibDalamKonteks({ sekolah }, "roles", { orang });
  const tanggal = teks(fd, "tanggal");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("akhiri_tugas_staf", {
    p_person: orang, p_institution: sekolah, p_kategori: teks(fd, "kategori"), p_alasan: teks(fd, "alasan"),
    p_tanggal: HARI.test(tanggal) ? tanggal : null,
  });
  if (error) kembali(orang, "akhiri", "gagal", kodeStafDariGalat(error));
  kembali(orang, "akhiri", "ok");
}

export async function ubahPeranAksi(fd: FormData): Promise<void> {
  const orang = teks(fd, "orang");
  const sekolah = teks(fd, "sekolah");
  if (!UUID.test(orang) || !UUID.test(sekolah)) redirect("/konfigurasi/roles");
  await wajibDalamKonteks({ sekolah }, "roles", { orang });
  const cabut = fd.getAll("cabut").map(String).filter((x) => UUID.test(x));
  const peran = teks(fd, "tambah_peran");
  const tempat = teks(fd, "tambah_tempat");
  const sampai = teks(fd, "tambah_sampai");
  const supabase = await supabaseServer();
  // Sharon F1: the last day on this school's own clock (WIB, WITA or WIT)
  const tambah = peran && UUID.test(tempat) && HARI.test(sampai)
    ? [{ role: peran, scope_node_id: tempat, valid_until: batasHari(sampai, "akhir", await zonaSekolah(supabase, sekolah)) }]
    : [];
  const { error } = await supabase.rpc("ubah_peran", {
    p_person: orang, p_institution: sekolah, p_tambah: tambah, p_cabut: cabut, p_alasan: teks(fd, "alasan"),
    p_sidik: teks(fd, "sidik"), p_konfirmasi_admin: fd.get("konfirmasi_admin") === "ya", p_terapkan: true,
  });
  if (error) kembali(orang, "ubah", "gagal", kodeStafDariGalat(error));
  kembali(orang, "ubah", "ok");
}
