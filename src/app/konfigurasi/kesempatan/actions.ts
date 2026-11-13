"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { sekolahDari, wajibDalamKonteks } from "@/lib/konteks-server";
import { ALAMAT_ANTREAN, kodePengerjaanDariGalat, type TempatAntrean } from "@/lib/pengerjaan-kontrak";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A1 (O41-16): THE DECISION ON A REQUEST FOR ANOTHER ATTEMPT. putuskan_percobaan decides who may: a holder of
 * CAN_REVIEW_INTEGRITY over the sitting's place, never the requester, never the learner, never a platform admin. This
 * passes the press on and returns to the queue the decision was taken from (one of its two places, named by a key
 * and never by a path from the form).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bersih = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export async function putuskanKesempatanAksi(fd: FormData): Promise<void> {
  const tempat: TempatAntrean = bersih(fd.get("tempat")) === "pimpinan" ? "pimpinan" : "konfigurasi";
  const alamat = ALAMAT_ANTREAN[tempat];
  const sambung = alamat.includes("?") ? "&" : "?";
  const id = bersih(fd.get("permintaan")), putusan = bersih(fd.get("putusan"));
  if (!UUID.test(id) || (putusan !== "setuju" && putusan !== "tolak")) redirect(alamat);
  // §2.11: the request's class is in the active context, or the chooser offers its school first (a narrowing; the
  // database decides the act)
  await wajibDalamKonteks({ sekolah: await sekolahDari("simpul", bersih(fd.get("kelas"))) });
  const db = (await supabaseServer()) as any;
  const { error } = await db.rpc("putuskan_percobaan", { p_permintaan: id, p_setuju: putusan === "setuju", p_alasan: bersih(fd.get("alasan")) || null });
  if (error) {
    const kode = kodePengerjaanDariGalat(error);
    if (kode === "SITTING_FAILED") console.error("[kesempatan] putuskan_percobaan failed", error?.code, error?.message);
    redirect(`${alamat}${sambung}${new URLSearchParams({ k_kode: kode, untuk: id }).toString()}#k-${id}`);
  }
  redirect(`${alamat}${sambung}k_hasil=${putusan}#pin-kesempatan-hasil`);
}
