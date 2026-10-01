/**
 * J3.2 (ADM-02, P1) — WHAT SETUP REMAINS, ON THE SCHOOL ADMIN'S HOME.
 *
 * Konfigurasi is where a school admin lands. It showed a class count and a
 * fixed three-step guide, never what was actually done (cross-check ADM-J02:
 * MISSING). This reads three facts the page already holds, for the school it
 * shows, and says for each whether it is done and where to do it:
 *
 *   kelas  an active Kelas exists (Struktur sekolah);
 *   murid  students are placed in a Kelas (Pendataan);
 *   guru   every active Kelas has a teacher: an active Guru (EDUCATOR) role
 *          scoped to the Kelas or to a place above it (Peran & akses).
 *
 * Nothing here decides anything: it counts what the reader may already see.
 * Whether a learner has signed in yet is not counted as setup (ADM-J16 leaves
 * that reading to Yazid).
 */
import type { SimpulStruktur } from "./struktur-kontrak";

export type LangkahPersiapan =
  | { kunci: "kelas"; selesai: boolean; jumlah: number }
  | { kunci: "murid"; selesai: boolean; jumlah: number }
  | { kunci: "guru"; selesai: boolean; tanpaGuru: string[] };

/** One role as the page reads it from role_assignments. */
export type PeranTerbaca = { role: string; scope_node_id: string | null; valid_until: string; revoked_at?: string | null };

/**
 * The three steps for one school. `kelas` is the school's structure rows (only
 * active Kelas count); `jalur` gives each node's path from the school's root
 * (its own id last), so a Guru scoped above a Kelas covers it, as has_scope
 * does; `sekarang` is the clock a role's validity is read against.
 */
export function persiapanSekolah(
  kelas: readonly SimpulStruktur[],
  peran: readonly PeranTerbaca[],
  jalur: ReadonlyMap<string, readonly string[]>,
  sekarang: number,
): LangkahPersiapan[] {
  const aktif = kelas.filter((k) => k.level === "KELAS" && k.is_active);
  const murid = aktif.reduce((n, k) => n + (k.active_members ?? 0), 0);
  const guru = peran.filter((p) => p.role === "EDUCATOR" && !p.revoked_at && p.scope_node_id
    && Date.parse(p.valid_until) > sekarang);
  const tanpaGuru = aktif
    .filter((k) => {
      const jalan = jalur.get(k.node_id) ?? [k.node_id];
      return !guru.some((p) => jalan.includes(p.scope_node_id!));
    })
    .map((k) => (k.academic_year ? `${k.name} (${k.academic_year})` : k.name))
    .sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
  return [
    { kunci: "kelas", selesai: aktif.length > 0, jumlah: aktif.length },
    { kunci: "murid", selesai: murid > 0, jumlah: murid },
    { kunci: "guru", selesai: aktif.length > 0 && tanpaGuru.length === 0, tanpaGuru },
  ];
}
