import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { rentangTriase, type StatusLaporan } from "@/lib/lapor-masalah-kontrak";
import { zonaSah, type ZonaSekolah } from "@/lib/hle";

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
  /** the report's school's zone (the owner's ruling, 10 Nov): its time is written on that school's clock; WIB with none */
  zona: ZonaSekolah;
  tangkapan: string | null;
  build: string | null;
  perangkat: string | null;
};

type Baris = {
  id: string; created_at: string; page: string; error_ref: string | null; did: string; expected: string; happened: string;
  stops_class: boolean; status: StatusLaporan; next_step: string | null; reporter_role: string; reporter_person_id: string;
  institution_id: string | null; screenshot_path: string | null; build_sha: string | null; device: string | null;
  reporter: { display_name: string } | null; institution: { name: string; zona_waktu?: unknown } | null;
};

const KOLOM = "id, created_at, page, error_ref, did, expected, happened, stops_class, status, next_step, reporter_role, "
  + "reporter_person_id, institution_id, screenshot_path, build_sha, device, reporter:persons!support_reports_reporter_person_id_fkey(display_name), "
  + "institution:institutions(name, zona_waktu)";

function ubah(r: Baris): LaporanMasalah {
  return {
    id: r.id, dibuat: r.created_at, halaman: r.page, rujukan: r.error_ref, lakukan: r.did, harapan: r.expected,
    terjadi: r.happened, hentikanKelas: r.stops_class, status: r.status, langkah: r.next_step, peran: r.reporter_role,
    pelapor: r.reporter?.display_name ?? "", sekolah: r.institution?.name ?? null, zona: zonaSah(r.institution?.zona_waktu), tangkapan: r.screenshot_path,
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
 * ones first, a stopped class first among them, then the oldest waiting first; the finished ones after, the newest
 * first. Row security decides the set.
 *
 * W2.10 (Batch 4; CR-49, CAP-10): one page at a time (20), in that order, the database doing the ordering, so a
 * platform with every school's reports never reads them all; `lagi` says whether another page follows. The open
 * reports are counted first, so a page that crosses from the open ones to the finished ones reads both.
 */
export async function laporanTriase(sekolah: readonly string[] | null, halaman = 1, ukuran = 20): Promise<{ isi: LaporanMasalah[]; lagi: boolean }> {
  const c = await supabaseServer();
  const lingkup = sekolah ? (sekolah.length ? [...sekolah] : ["00000000-0000-0000-0000-000000000000"]) : null;
  const dasar = (kolom: string, opsi?: { count: "exact"; head: true }) => {
    const q = c.from("support_reports").select(kolom, opsi);
    return lingkup ? q.in("institution_id", lingkup) : q;
  };
  const { count: terbuka } = await dasar("id", { count: "exact", head: true }).neq("status", "SELESAI");
  const nTerbuka = terbuka ?? 0;
  const { terbuka: rTerbuka, selesai: rSelesai } = rentangTriase(halaman, ukuran, nTerbuka);
  const baris: Baris[] = [];
  if (rTerbuka) {
    const { data } = await dasar(KOLOM).neq("status", "SELESAI")
      .order("status").order("stops_class", { ascending: false }).order("created_at").order("id")
      .range(...rTerbuka);
    baris.push(...((data ?? []) as unknown as Baris[]));
  }
  if (rSelesai) {
    const { data } = await dasar(KOLOM).eq("status", "SELESAI").order("created_at", { ascending: false }).order("id")
      .range(...rSelesai);
    baris.push(...((data ?? []) as unknown as Baris[]));
  }
  return { isi: baris.slice(0, ukuran).map(ubah), lagi: baris.length > ukuran };
}
