"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { rujukan } from "@/lib/galat-kontrak";
import { sekolahDari, wajibDalamKonteks } from "@/lib/konteks-server";
import { sekolahSertifikat } from "@/lib/sertifikat-sekolah";
import {
  kodeKoreksiDariGalat, kodeSoalDariGalat, type MasalahSoal, type SoalDraf,
} from "@/lib/soal-kontrak";
import { LABEL_PILIHAN, alamatSoal, kemasMasalah, soalDariIsian } from "@/lib/soal-layar";

/**
 * C1w on the screens: the item workbench's acts (Daisy, TINJAUAN-A1-C1W Q5 and Q6, O41-19).
 *
 * Each is one call to the database's own function, as the signed-in person: ubah_soal_draf, tambah_soal_draf,
 * hapus_soal_draf, buang_draf (PR180), ajukan_koreksi_kunci, tegaskan_koreksi_kunci, tolak_koreksi_kunci and
 * putuskan_tinjauan_sertifikat (PR190). Authority, the draft's state, the revision the editor read, the two people and
 * the audit rows are the database's; nothing here decides any of them. The page is told a CODE and draws its sentence
 * from the copy table (hle.ts); a failure nobody named is logged beside the reference the page shows.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const id = (fd: FormData, k: string) => (UUID.test(str(fd, k)) ? str(fd, k) : null);
const pelajaranDari = (fd: FormData) => (/^[1-9]\d{0,3}$/.test(str(fd, "pelajaran")) ? str(fd, "pelajaran") : "1");

function catat(fn: string, e: { code?: string | null; message?: string | null } | null): string {
  const ref = rujukan();
  console.error(`[studio ${ref}] ${fn} failed`, e?.code, e?.message);
  return ref;
}

// ───────────────────────────────────────────────────────────── the draft editor (Q5)

export async function simpanSoalAksi(fd: FormData): Promise<void> {
  const course = id(fd, "course");
  const item = id(fd, "item");
  const revisi = Number.parseInt(str(fd, "revisi"), 10);
  if (!course) redirect("/studio");
  const pelajaran = pelajaranDari(fd);
  if (!item || !Number.isFinite(revisi)) redirect(alamatSoal(course, { pelajaran, c1h: "gagal", c1: "DRAFT_UNKNOWN" }));
  // L3 (§2.11): the question's school is the working context's, or the chooser offers it (values kept)
  await wajibDalamKonteks({ sekolah: await sekolahDari("soal", item) }, `soal-${item}`);
  const soal: SoalDraf = soalDariIsian((k) => str(fd, k), LABEL_PILIHAN);
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("ubah_soal_draf", { p_item: item, p_revisi: revisi, p_soal: soal });
  if (error) {
    const kode = kodeSoalDariGalat(error);
    const ref = kode === "DRAFT_FAILED" ? catat("ubah_soal_draf", error) : undefined;
    // the stale save (Daisy, missing state 1): the form stays open, so the page names who saved since
    redirect(alamatSoal(course, { pelajaran, c1h: "gagal", c1: kode, c1s: item, ref, ubah: item }));
  }
  const h = data as { ok: boolean; masalah?: MasalahSoal[]; kembali_ke_periksa?: boolean } | null;
  if (!h?.ok) {
    redirect(alamatSoal(course, { pelajaran, c1h: "gagal", c1: "MASALAH", c1s: item, c1m: kemasMasalah(h?.masalah ?? []), ubah: item }));
  }
  redirect(alamatSoal(course, { pelajaran, c1h: "ok", c1: h?.kembali_ke_periksa ? "TERSIMPAN_PERIKSA" : "TERSIMPAN", c1s: item }));
}

export async function tambahSoalAksi(fd: FormData): Promise<void> {
  const course = id(fd, "course");
  const lesson = id(fd, "lesson");
  if (!course) redirect("/studio");
  const pelajaran = pelajaranDari(fd);
  if (!lesson) redirect(alamatSoal(course, { pelajaran, c1h: "gagal", c1: "DRAFT_UNKNOWN" }));
  await wajibDalamKonteks({ sekolah: await sekolahDari("kursus", course) }, `tambah-${lesson}`);
  const guna = str(fd, "kegunaan");
  const soal: SoalDraf = {
    ...soalDariIsian((k) => str(fd, k), LABEL_PILIHAN),
    use: guna === "PRE_TEST" || guna === "POST_TEST" ? guna : null,
    item_type: "MCQ_SINGLE",
  };
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("tambah_soal_draf", { p_lesson: lesson, p_soal: soal });
  if (error) {
    const kode = kodeSoalDariGalat(error);
    const ref = kode === "DRAFT_FAILED" ? catat("tambah_soal_draf", error) : undefined;
    redirect(alamatSoal(course, { pelajaran, c1h: "gagal", c1: kode, ref, tambah: lesson }));
  }
  const h = data as { ok: boolean; item?: string; masalah?: MasalahSoal[] } | null;
  if (!h?.ok) redirect(alamatSoal(course, { pelajaran, c1h: "gagal", c1: "MASALAH", c1m: kemasMasalah(h?.masalah ?? []), tambah: lesson }));
  redirect(alamatSoal(course, { pelajaran, c1h: "ok", c1: "DITAMBAH", c1s: h?.item }));
}

export async function hapusSoalAksi(fd: FormData): Promise<void> {
  const course = id(fd, "course");
  const item = id(fd, "item");
  const revisi = Number.parseInt(str(fd, "revisi"), 10);
  if (!course) redirect("/studio");
  const pelajaran = pelajaranDari(fd);
  if (!item || !Number.isFinite(revisi)) redirect(alamatSoal(course, { pelajaran, c1h: "gagal", c1: "DRAFT_UNKNOWN" }));
  await wajibDalamKonteks({ sekolah: await sekolahDari("soal", item) }, `soal-${item}`);
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("hapus_soal_draf", { p_item: item, p_revisi: revisi });
  if (error) {
    const kode = kodeSoalDariGalat(error);
    const ref = kode === "DRAFT_FAILED" ? catat("hapus_soal_draf", error) : undefined;
    redirect(alamatSoal(course, { pelajaran, c1h: "gagal", c1: kode, c1s: item, ref, ubah: item }));
  }
  redirect(alamatSoal(course, { pelajaran, c1h: "ok", c1: "DIHAPUS" }));
}

export async function buangDrafAksi(fd: FormData): Promise<void> {
  const course = id(fd, "course");
  if (!course) redirect("/studio");
  await wajibDalamKonteks({ sekolah: await sekolahDari("kursus", course) }, "buang");
  const supabase = await supabaseServer();
  // the title is read before it is gone, so Studio can say which draft was discarded
  const { data: c } = await supabase.from("courses").select("title").eq("id", course).maybeSingle();
  const { error } = await supabase.rpc("buang_draf", { p_course: course, p_catatan: null });
  if (error) {
    const kode = kodeSoalDariGalat(error);
    const ref = kode === "DRAFT_FAILED" ? catat("buang_draf", error) : undefined;
    redirect(alamatSoal(course, { c1h: "gagal", c1: kode, ref, jangkar: "buang" }));
  }
  const q = new URLSearchParams({ dibuang: String(c?.title ?? "").slice(0, 200) });
  redirect(`/studio?${q.toString()}`);
}

// ───────────────────────────────────────────────────────────── the wrong key (Q6)

export async function ajukanKoreksiAksi(fd: FormData): Promise<void> {
  const course = id(fd, "course");
  const item = id(fd, "item");
  if (!course) redirect("/studio");
  const pelajaran = pelajaranDari(fd);
  const kunci = str(fd, "kunci").toUpperCase();
  const alasan = str(fd, "alasan");
  if (!item) redirect(alamatSoal(course, { pelajaran, c1h: "gagal", c1: "CORRECTION_UNKNOWN" }));
  await wajibDalamKonteks({ sekolah: await sekolahDari("soal", item), atauPlatform: true }, `soal-${item}`);
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("ajukan_koreksi_kunci", { p_item: item, p_kunci: kunci ? [kunci] : [], p_alasan: alasan });
  if (error) {
    const kode = kodeKoreksiDariGalat(error);
    const ref = kode === "CORRECTION_FAILED" ? catat("ajukan_koreksi_kunci", error) : undefined;
    redirect(alamatSoal(course, { pelajaran, c1h: "gagal", c1: kode, c1s: item, ref, kunci: item, langkah: "1" }));
  }
  redirect(alamatSoal(course, { pelajaran, c1h: "ok", c1: "KOREKSI_TERKIRIM", c1s: item }));
}

function kembaliKoreksi(koreksi: string, q: Record<string, string | undefined>): never {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v) p.set(k, v);
  redirect(`/studio/tinjau/kunci/${koreksi}?${p.toString()}#hasil`);
}

export async function tegaskanKoreksiAksi(fd: FormData): Promise<void> {
  const koreksi = id(fd, "koreksi");
  if (!koreksi) redirect("/studio/tinjau");
  await wajibDalamKonteks({ sekolah: await sekolahDari("kursus", str(fd, "course")), atauPlatform: true }, "hasil");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("tegaskan_koreksi_kunci", { p_correction: koreksi });
  if (error) {
    const kode = kodeKoreksiDariGalat(error);
    kembaliKoreksi(koreksi, { hasil: "gagal", kode, ref: kode === "CORRECTION_FAILED" ? catat("tegaskan_koreksi_kunci", error) : undefined });
  }
  kembaliKoreksi(koreksi, { hasil: "ok", kode: "DITEGASKAN" });
}

export async function tolakKoreksiAksi(fd: FormData): Promise<void> {
  const koreksi = id(fd, "koreksi");
  if (!koreksi) redirect("/studio/tinjau");
  await wajibDalamKonteks({ sekolah: await sekolahDari("kursus", str(fd, "course")), atauPlatform: true }, "hasil");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("tolak_koreksi_kunci", { p_correction: koreksi, p_alasan: str(fd, "alasan") });
  if (error) {
    const kode = kodeKoreksiDariGalat(error);
    kembaliKoreksi(koreksi, { hasil: "gagal", kode, ref: kode === "CORRECTION_FAILED" ? catat("tolak_koreksi_kunci", error) : undefined });
  }
  kembaliKoreksi(koreksi, { hasil: "ok", kode: "DITOLAK" });
}

// ───────────────────────────────────────────────────────────── the certificate under review (O41-19)

export async function putuskanTinjauanAksi(fd: FormData): Promise<void> {
  const tinjauan = id(fd, "tinjauan");
  const keputusan = str(fd, "keputusan");
  const back = (q: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(q)) if (v) p.set(k, v);
    redirect(`/konfigurasi/sertifikat?${p.toString()}#ditinjau`);
  };
  if (!tinjauan) back({ tinjau: "gagal", kode: "CERT_REVIEW_UNKNOWN" });
  await wajibDalamKonteks({ sekolah: await sekolahSertifikat(str(fd, "sertifikat")), atauPlatform: true }, "ditinjau");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("putuskan_tinjauan_sertifikat", {
    p_review: tinjauan, p_keputusan: keputusan, p_alasan: str(fd, "alasan"),
  });
  if (error) {
    const kode = kodeKoreksiDariGalat(error);
    back({ tinjau: "gagal", kode, ref: kode === "CORRECTION_FAILED" ? catat("putuskan_tinjauan_sertifikat", error) : undefined, baris: tinjauan ?? undefined });
  }
  back({ tinjau: keputusan === "REVOKED" ? "dicabut" : "dikonfirmasi" });
}
