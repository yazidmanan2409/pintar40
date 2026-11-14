"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { wajibDalamKonteks } from "@/lib/konteks-server";
import { kodeGalat, rujukan } from "@/lib/galat-kontrak";
import { adalahUuid, dariForm, kodekan, urai } from "@/lib/kenaikan";

/**
 * «KENAIKAN KELAS DAN KELULUSAN»: the two presses of the flow (src/components/kenaikan/KenaikanKelas.tsx). Nothing here
 * decides. «Tinjau hasil» asks kenaikan_tetapkan for its preview (it writes nothing) and opens the review with the
 * decisions; a refusal returns to the decisions with its code and the choices kept. «Konfirmasi» asks it to apply them,
 * whole or not at all, and opens the outcome, which the database reads back (kenaikan_hasil). The working context's
 * school must be the class's (§2.11).
 */
type Langkah = "keputusan" | "tinjau" | "selesai";

function ke(kelas: string, tahun: string, langkah: Langkah, extra: Record<string, string> = {}): never {
  const q = new URLSearchParams({ kn_kelas: kelas, kn_tahun: tahun, kn_langkah: langkah, ...extra });
  redirect(`/konfigurasi/rollover?${q.toString()}#rollover`);
}

async function sekolahKelas(kelas: string): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("org_nodes").select("institution_id").eq("id", kelas).maybeSingle();
  return (data as { institution_id?: string } | null)?.institution_id ?? null;
}

function kodeDari(error: { code?: string | null; message?: string | null; details?: string | null; hint?: string | null } | null, fn: string): Record<string, string> {
  const kode = kodeGalat(error);
  // A2a M-1: the refusal during a stop says how many learners are held (its HINT, digits only)
  if (kode === "PROMO_STOPPED") return { kn_kode: kode, kn_n: /^\d+$/.test(error?.hint ?? "") ? error!.hint! : "" };
  if (kode !== "ACTION_FAILED") return { kn_kode: kode };
  const ref = rujukan();
  console.error(`[kenaikan ${ref}] ${fn} failed`, error?.code, error?.message);
  return { kn_kode: kode, kn_ref: ref };
}

export async function tinjauKenaikanAksi(fd: FormData): Promise<void> {
  const kelas = String(fd.get("kelas") ?? "");
  const tahun = String(fd.get("tahun") ?? "");
  if (!adalahUuid(kelas) || !adalahUuid(tahun)) redirect("/konfigurasi/rollover#rollover");
  const keputusan = dariForm(fd.entries());
  await wajibDalamKonteks({ sekolah: await sekolahKelas(kelas) }, "rollover");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("kenaikan_tetapkan", {
    p_kelas: kelas, p_tahun_baru: tahun, p_keputusan: keputusan, p_guru_ditinjau: false, p_terapkan: false,
  });
  const d = kodekan(keputusan);
  if (error) ke(kelas, tahun, "keputusan", { kn_d: d, ...kodeDari(error, "kenaikan_tetapkan (preview)") });
  ke(kelas, tahun, "tinjau", { kn_d: d });
}

export async function terapkanKenaikanAksi(fd: FormData): Promise<void> {
  const kelas = String(fd.get("kelas") ?? "");
  const tahun = String(fd.get("tahun") ?? "");
  const d = String(fd.get("d") ?? "");
  if (!adalahUuid(kelas) || !adalahUuid(tahun)) redirect("/konfigurasi/rollover#rollover");
  const keputusan = urai(d);
  await wajibDalamKonteks({ sekolah: await sekolahKelas(kelas) }, "rollover");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("kenaikan_tetapkan", {
    p_kelas: kelas, p_tahun_baru: tahun, p_keputusan: keputusan, p_guru_ditinjau: fd.get("guru_ditinjau") === "ya", p_terapkan: true,
  });
  if (error) ke(kelas, tahun, "tinjau", { kn_d: kodekan(keputusan), ...kodeDari(error, "kenaikan_tetapkan") });
  ke(kelas, tahun, "selesai");
}
