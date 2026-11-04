"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { alamatBagian } from "@/lib/bagian-konfigurasi";
import { supabaseServer } from "@/lib/supabase/server";
import { rujukan } from "@/lib/galat-kontrak";
import { halamanLaporan, kodeGalatLaporan, rujukanLaporan } from "@/lib/lapor-masalah-kontrak";

/**
 * BOB-15 + DAISY-12 (D-037 step 2): «Laporkan masalah». Each action is one database call as the signed-in person;
 * who may report, who may move a report and what is attached are the database's. A refusal comes back as its code.
 */
function str(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

/** Send a report. The page, reference and screenshot come from the form; the device from this request. */
export async function kirimLaporanAksi(fd: FormData): Promise<void> {
  const halaman = halamanLaporan(str(fd, "dari"));
  const ref = rujukanLaporan(str(fd, "ref"));
  const balik = (q: Record<string, string>): never => {
    const p = new URLSearchParams({ dari: halaman, ...(ref ? { ref } : {}), ...q });
    redirect(`/lapor?${p.toString()}`);
  };
  const lakukan = str(fd, "lakukan"), harapan = str(fd, "harapan"), terjadi = str(fd, "terjadi");
  if (!lakukan || !harapan || !terjadi) balik({ kode: "REPORT_INPUT_INVALID" });
  const tangkapan = str(fd, "tangkapan") || null;
  const perangkat = (await headers()).get("user-agent")?.slice(0, 300) ?? null;
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("submit_support_report", {
    p_page: halaman, p_error_ref: ref, p_did: lakukan, p_expected: harapan, p_happened: terjadi,
    p_stops_class: fd.get("hentikan") === "ya", p_device: perangkat, p_screenshot: tangkapan,
  });
  if (error) {
    const kode = kodeGalatLaporan(error);
    if (kode !== "REPORT_FAILED") balik({ kode });
    const r = rujukan();
    console.error(`[lapor ${r}] submit_support_report failed`, error.code, error.message);
    balik({ kode, rujukan: r });
  }
  revalidatePath("/lapor/saya");
  redirect("/lapor/saya?hasil=diterima");
}

/** Move a report forward with the next step for its reporter (the school's Admin sekolah, or Admin platform). */
export async function pindahkanLaporanAksi(fd: FormData): Promise<void> {
  const laporan = str(fd, "laporan");
  const status = str(fd, "status");
  const langkah = str(fd, "langkah");
  // E-K4: the answer comes back to the report's own row, on the list's page it was moved from
  const hal = str(fd, "hal_lapor");
  const baris = /^[0-9a-f-]{36}$/i.test(laporan) ? laporan : null;
  const balik = (q: Record<string, string>): never => {
    const u = new URLSearchParams({ bagian: "laporan-masalah", ...q });
    if (baris) u.set("baris", baris);
    if (/^[1-9]\d{0,4}$/.test(hal)) u.set("hal_lapor", hal);
    // B1: on the problem reports' own page, at the report's row
    redirect(alamatBagian("laporan-masalah", u, baris ? `laporan-${baris}` : "laporan-masalah"));
  };
  if (!/^[0-9a-f-]{36}$/i.test(laporan)) balik({ lapor: "REPORT_NOT_ALLOWED" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("move_support_report", { p_report: laporan, p_status: status, p_next_step: langkah });
  if (error) {
    const kode = kodeGalatLaporan(error);
    if (kode === "REPORT_FAILED") console.error("[lapor] move_support_report failed", error.code, error.message);
    balik({ lapor: kode });
  }
  revalidatePath("/konfigurasi");
  balik({ lapor: "MOVED" });
}
