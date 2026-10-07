import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import type { StatusLaporan } from "@/lib/lapor-masalah-kontrak";

export * from "@/lib/lapor-masalah-kontrak";

/**
 * BOB-15 + DAISY-12 (D-037 step 2): the reads of «Laporkan masalah». Each is one read under support_reports' own row
 * security: a reporter sees their own, a school's Admin sekolah their school's, Admin platform all. Nothing here
 * decides who may see what.
 */
export type LaporanMasalah = {
  id: string;
  dibuat: string;
  halaman: string;
  rujukan: string | null;
  lakukan: string;
  harapan: string;
  terjadi: string;
  hentikanKelas: boolean;
  status: StatusLaporan;
  langkah: string | null;
  peran: string;
  pelapor: string;
  sekolah: string | null;
  tangkapan: string | null;
  build: string | null;
  perangkat: string | null;
};

type Baris = {
  id: string; created_at: string; page: string; error_ref: string | null; did: string; expected: string; happened: string;
  stops_class: boolean; status: StatusLaporan; next_step: string | null; reporter_role: string; reporter_person_id: string;
  institution_id: string | null; screenshot_path: string | null; build_sha: string | null; device: string | null;
  reporter: { display_name: string } | null; institution: { name: string } | null;
};

const KOLOM = "id, created_at, page, error_ref, did, expected, happened, stops_class, status, next_step, reporter_role, "
  + "reporter_person_id, institution_id, screenshot_path, build_sha, device, reporter:persons!support_reports_reporter_person_id_fkey(display_name), "
  + "institution:institutions(name)";

function ubah(r: Baris): LaporanMasalah {
  return {
    id: r.id, dibuat: r.created_at, halaman: r.page, rujukan: r.error_ref, lakukan: r.did, harapan: r.expected,
    terjadi: r.happened, hentikanKelas: r.stops_class, status: r.status, langkah: r.next_step, peran: r.reporter_role,
    pelapor: r.reporter?.display_name ?? "", sekolah: r.institution?.name ?? null, tangkapan: r.screenshot_path,
    build: r.build_sha, perangkat: r.device,
  };
}

/** «Laporan saya»: the reader's own reports, newest first. */
export async function laporanSaya(): Promise<LaporanMasalah[]> {
  const c = await supabaseServer();
  const { data: saya } = await c.rpc("current_person_id");
  if (!saya) return [];
  const { data } = await c.from("support_reports").select(KOLOM).eq("reporter_person_id", saya)
    .order("created_at", { ascending: false }).limit(50);
  return ((data ?? []) as unknown as Baris[]).map(ubah);
}

/**
 * The triage list: the reports of the schools this reader administers (or every report, for Admin platform), open
 * ones first, a stopped class first among them, then the oldest waiting first. Row security decides the set.
 */
export async function laporanTriase(sekolah: readonly string[] | null): Promise<LaporanMasalah[]> {
  const c = await supabaseServer();
  let q = c.from("support_reports").select(KOLOM);
  if (sekolah) q = q.in("institution_id", sekolah.length ? [...sekolah] : ["00000000-0000-0000-0000-000000000000"]);
  const { data } = await q.order("created_at", { ascending: true }).limit(200);
  const urut: Record<StatusLaporan, number> = { DITERIMA: 0, DITANGANI: 1, SELESAI: 2 };
  return ((data ?? []) as unknown as Baris[]).map(ubah)
    .sort((a, b) => urut[a.status] - urut[b.status] || Number(b.hentikanKelas) - Number(a.hentikanKelas)
      || (a.status === "SELESAI" ? b.dibuat.localeCompare(a.dibuat) : a.dibuat.localeCompare(b.dibuat)));
}
