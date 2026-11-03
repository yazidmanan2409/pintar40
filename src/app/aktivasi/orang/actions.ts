"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { detailPr040 } from "@/app/api/aktifkan/_wizard";

/**
 * W2.2 (CR-14, D-077(3)) and W2.3 (CR-15, F-8 / D-152(b)): THE PLATFORM ADMIN CORRECTS A NAME OR A USERNAME.
 *
 * Each asks its database function with the reader's own client: correct_person_name and correct_username refuse
 * everyone but the platform admin (42501), want a reason (REASON_REQUIRED), and audit the correction themselves
 * (identity.name_corrected, identity.username_corrected; from, to, reason). Nothing here decides; the answer comes back
 * to the person's panel as ?hasil=…&kode=… and is said there.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function kembali(orang: string, bagian: "nama" | "username", hasil: "ok" | "gagal", kode?: string): never {
  const q = new URLSearchParams({ pilih: orang, bagian, hasil });
  if (kode) q.set("kode", kode);
  redirect(`/aktivasi/orang?${q.toString()}#koreksi`);
}

async function jalankan(fd: FormData, bagian: "nama" | "username") {
  const orang = String(fd.get("orang") ?? "");
  const nilai = String(fd.get("nilai") ?? "").trim();
  const alasan = String(fd.get("alasan") ?? "");
  if (!UUID.test(orang)) kembali("", bagian, "gagal", "PERMINTAAN_TIDAK_SAH");
  const supabase = await supabaseServer();
  const { error } = bagian === "nama"
    ? await supabase.rpc("correct_person_name", { p_person: orang, p_name: nilai, p_reason: alasan })
    : await supabase.rpc("correct_username", { p_person: orang, p_name: nilai, p_reason: alasan });
  if (!error) kembali(orang, bagian, "ok");
  const detail = detailPr040(error);
  kembali(orang, bagian, "gagal", error.code === "42501" ? "DITOLAK" : detail && /^[A-Z_]+$/.test(detail) ? detail : "LAYANAN_TIDAK_TERSEDIA");
}

export async function koreksiNamaAksi(fd: FormData) {
  await jalankan(fd, "nama");
}

export async function koreksiUsernameAksi(fd: FormData) {
  await jalankan(fd, "username");
}
