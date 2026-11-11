"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { kelas as kelasKonteks } from "@/lib/pengajar";
import { zonaSekolah } from "@/lib/zona-sekolah";
import { waktuSekolah } from "@/lib/pemeliharaan-kontrak";
import { CARA_AKHIRI, MENIT_TAMBAHAN, kodePengerjaanDariGalat } from "@/lib/pengerjaan-kontrak";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A1 · THE TEACHER'S ACTS ON ONE SITTING AND ON A LESSON'S SCHEDULE. Each is one database function, which decides
 * everything (CAN_MANAGE_SITTINGS over the sitting's own place; the reason; whether the sitting is still open): this
 * file passes the form on and returns the teacher to the page the act was taken on, with the outcome or the refusal's
 * code. The context check is a presentation guard, as in actions.ts; the destination is derived, never taken whole
 * from the form.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bersih = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

type Tujuan = { kelas: string; penugasan: string; sesi: string };

/** The fields every act of the panel carries; anything malformed goes back to Mengajar. */
async function baca(fd: FormData): Promise<Tujuan> {
  const kelas = bersih(fd.get("kelas")), penugasan = bersih(fd.get("penugasan")), sesi = bersih(fd.get("sesi"));
  if (!UUID.test(kelas)) redirect("/mengajar");
  if (!UUID.test(penugasan) || !UUID.test(sesi) || !(await kelasKonteks(kelas))) redirect(`/mengajar/${encodeURIComponent(kelas)}`);
  return { kelas, penugasan, sesi };
}
const siapa = (t: Tujuan, isi: Record<string, string>, jangkar: string): never =>
  redirect(`/mengajar/${encodeURIComponent(t.kelas)}/siapa?${new URLSearchParams({ penugasan: t.penugasan, ...isi }).toString()}#${jangkar}`);
/** A refusal returns to the open panel with its code; a success to the list with its result line. */
const tolak = (t: Tujuan, tindakan: string, error: { code?: string | null; details?: string | null; message?: string } | null): never => {
  const kode = kodePengerjaanDariGalat(error);
  if (kode === "SITTING_FAILED") console.error(`[atur] ${tindakan} failed`, error?.code, error?.message);
  return siapa(t, { sesi: t.sesi, tindakan, kode }, "atur");
};
const berhasil = (t: Tujuan, hasil: string, lagi: Record<string, string> = {}): never => siapa(t, { hasil, untuk: t.sesi, ...lagi }, "pin-siapa-hasil");

export async function tambahWaktuAksi(fd: FormData): Promise<void> {
  const t = await baca(fd);
  const menit = Number(bersih(fd.get("menit")));
  const db = (await supabaseServer()) as any;
  const { error } = await db.rpc("tambah_waktu_pengerjaan", {
    p_session: t.sesi, p_menit: (MENIT_TAMBAHAN as readonly number[]).includes(menit) ? menit : null, p_alasan: bersih(fd.get("alasan")),
  });
  if (error) tolak(t, "waktu", error);
  berhasil(t, "waktu", { n: String(menit) });
}

export async function akhiriSesiAksi(fd: FormData): Promise<void> {
  const t = await baca(fd);
  const cara = bersih(fd.get("cara"));
  const db = (await supabaseServer()) as any;
  const { error } = await db.rpc("akhiri_pengerjaan", {
    p_session: t.sesi, p_cara: (CARA_AKHIRI as readonly string[]).includes(cara) ? cara : null, p_alasan: bersih(fd.get("alasan")),
  });
  if (error) tolak(t, "akhiri", error);
  berhasil(t, cara === "SCORED" ? "dinilai" : "tidak_dihitung");
}

export async function mintaKesempatanAksi(fd: FormData): Promise<void> {
  const t = await baca(fd);
  const db = (await supabaseServer()) as any;
  const { error } = await db.rpc("minta_percobaan", { p_session: t.sesi, p_alasan: bersih(fd.get("alasan")) });
  if (error) tolak(t, "minta", error);
  berhasil(t, "diminta");
}

export async function lanjutkanSesiAksi(fd: FormData): Promise<void> {
  const t = await baca(fd);
  const db = (await supabaseServer()) as any;
  const { error } = await db.rpc("lanjutkan_pengerjaan", { p_session: t.sesi, p_catatan: bersih(fd.get("alasan")) });
  if (error) tolak(t, "lanjut", error);
  berhasil(t, "dilanjutkan");
}

export async function tutupDitahanAksi(fd: FormData): Promise<void> {
  const t = await baca(fd);
  const db = (await supabaseServer()) as any;
  const { error } = await db.rpc("tutup_pengerjaan_ditahan", { p_session: t.sesi, p_alasan: bersih(fd.get("alasan")) });
  if (error) tolak(t, "tutup", error);
  berhasil(t, "tidak_dihitung");
}

/** «Ubah jadwal» on the class page's material row: a date and a time each, typed on the school's own clock, sent as instants. */
export async function ubahJadwalAksi(fd: FormData): Promise<void> {
  const kelas = bersih(fd.get("kelas")), la = bersih(fd.get("penugasan"));
  const mulaiTeks = bersih(fd.get("mulai")), sampaiTeks = bersih(fd.get("sampai"));
  if (!UUID.test(kelas)) redirect("/mengajar");
  const ctx = await kelasKonteks(kelas);
  if (!ctx || !UUID.test(la)) redirect(`/mengajar/${encodeURIComponent(kelas)}`);
  const db = (await supabaseServer()) as any;
  const zona = await zonaSekolah(db, ctx!.ini.institusi);
  // an opening that is not a date and a time is sent as none (the database refuses a window with no opening time); a
  // closing typed but unreadable is refused here, never read as «no end»
  const dari = waktuSekolah(mulaiTeks, zona), sampai = sampaiTeks ? waktuSekolah(sampaiTeks, zona) : null;
  if (sampaiTeks && !sampai) redirect(`/mengajar/${encodeURIComponent(kelas)}?${new URLSearchParams({ jadwal: la, kode: "WINDOW_INVALID" }).toString()}#jadwal`);
  const { error } = await db.rpc("ubah_jadwal_penugasan", {
    p_la: la, p_dari: dari, p_sampai: sampai,
    p_alasan: bersih(fd.get("alasan")),
  });
  if (error) {
    const kode = kodePengerjaanDariGalat(error);
    if (kode === "SITTING_FAILED") console.error("[jadwal] ubah_jadwal_penugasan failed", error?.code, error?.message);
    redirect(`/mengajar/${encodeURIComponent(kelas)}?${new URLSearchParams({ jadwal: la, kode }).toString()}#jadwal`);
  }
  redirect(`/mengajar/${encodeURIComponent(kelas)}?jadwal_diubah=ok#materi`);
}
