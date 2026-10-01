/**
 * D-085 M9 (J3.12, ADM-J13) — A STUDENT MOVES CLASS; THEIR HISTORY DOES NOT.
 *
 * Konfigurasi's «Pindah kelas» reads with these and writes through
 * `move_learner_to_class` (supabase/migrations/20261027100000), which decides
 * every move again as the signed-in administrator. Nothing here authorizes:
 * the reads run under that administrator's own row security, and a page that
 * offered a move the database refuses would only get the refusal back.
 */
import type { SimpulStruktur } from "./struktur-kontrak";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = any;

/** One student in a Kelas (or a Tingkat) now: the open placement the move closes. */
export type MuridDiKelas = { penempatan: string; orang: string; nama: string };

function rows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

/**
 * The students in exactly this Kelas now, by name: an open membership
 * (`valid_to is null`) of an enrolment still in force (PENDING, recorded and
 * not yet signed in, or ACTIVE), as the teacher's roster and Aktivasi count
 * them. Each carries the membership a move closes.
 */
export async function muridDiKelas(c: Db, kelas: string): Promise<MuridDiKelas[]> {
  const { data: anggota } = await c
    .from("memberships")
    .select("id, enrollment_id")
    .eq("node_id", kelas)
    .is("valid_to", null);
  const baris = rows<{ id: string; enrollment_id: string }>(anggota);
  if (baris.length === 0) return [];

  const { data: daftar } = await c
    .from("enrollments")
    .select("id, person_id, status")
    .in("id", [...new Set(baris.map((b) => String(b.enrollment_id)))]);
  const berlaku = new Map(
    rows<{ id: string; person_id: string; status: string }>(daftar)
      .filter((e) => e.status === "PENDING" || e.status === "ACTIVE")
      .map((e) => [String(e.id), String(e.person_id)]),
  );
  const orangIds = [...new Set(berlaku.values())];
  if (orangIds.length === 0) return [];

  const { data: orang } = await c.from("persons").select("id, display_name").in("id", orangIds);
  const nama = new Map(rows<{ id: string; display_name: string }>(orang).map((p) => [String(p.id), String(p.display_name)]));

  const seen = new Set<string>();
  const out: MuridDiKelas[] = [];
  for (const b of baris) {
    const p = berlaku.get(String(b.enrollment_id));
    if (!p || seen.has(p) || !nama.has(p)) continue;
    seen.add(p);
    out.push({ penempatan: String(b.id), orang: p, nama: nama.get(p)! });
  }
  return out.sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

/**
 * Where a student of `dari` may be moved. From a Kelas: every other active
 * Kelas of the same school in the same academic year (another year is the
 * rollover's work). From a Tingkat (J3.6: a learner the intake placed in the
 * Tingkat only): the active Kelas of that Tingkat. In name order.
 */
export function tujuanPindah(rows: readonly SimpulStruktur[], dari: string): SimpulStruktur[] {
  const asal = rows.find((k) => k.node_id === dari && (k.level === "KELAS" || k.level === "TINGKAT"));
  if (!asal) return [];
  return rows
    .filter((k) => k.level === "KELAS" && k.is_active && k.node_id !== dari
      && (asal.level === "KELAS" ? k.academic_year === asal.academic_year : k.parent_id === asal.node_id))
    .sort((a, b) => a.name.localeCompare(b.name, "id", { numeric: true, sensitivity: "base" }));
}

/**
 * The places «Pindah kelas» starts from: every active Kelas, and each active
 * Tingkat that holds learners placed in it directly (not yet in a Kelas).
 */
export function asalPindah(rows: readonly SimpulStruktur[]): { kelas: SimpulStruktur[]; tingkat: SimpulStruktur[] } {
  return {
    kelas: rows.filter((r) => r.level === "KELAS" && r.is_active),
    tingkat: rows.filter((r) => r.level === "TINGKAT" && r.is_active && (r.active_members ?? 0) > 0),
  };
}

/** A Kelas as the page names it: «Kelas 1A (2026/2027)». */
export function namaKelas(k: Pick<SimpulStruktur, "name" | "academic_year">): string {
  return k.academic_year ? `${k.name} (${k.academic_year})` : k.name;
}
