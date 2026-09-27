/**
 * BOB-01 — THE SCHOOL-STRUCTURE CONTRACT (D-006). Pure: no database, no React,
 * no server. The "Struktur sekolah" screen (DAISY-05) builds on exactly this
 * file, `src/lib/struktur.ts` (the list) and the five actions in
 * `src/app/konfigurasi/actions.ts`.
 *
 * WHAT THE SCREEN SHOWS is three levels, Bagian → Tingkat → Kelas. The
 * database also holds a hidden Jenjang (one per school) above every Bagian and
 * a hidden Reguler under each Bagian; they are created automatically, never
 * listed, and never renamed or deactivated from here.
 *
 * WHO. An Admin sekolah of the school, or an Admin platform. Everyone else,
 * and anyone acting on another school's node, gets `STRUCTURE_NOT_ALLOWED` --
 * the same answer an unknown node gets.
 *
 * ERRORS (D-011). The database refuses with SQLSTATE PR020 and the stable
 * code in DETAIL; `kodeGalatStruktur` reads that and nothing else. Its message
 * is developer text and never reaches a screen. Every code has a copy key in
 * `KUNCI_GALAT_STRUKTUR`; a static test fails if the database can raise a code
 * this file does not name, or a code here has no sentence in both languages.
 */
import type { HleEvent } from "./hle";

// ═════════════════════════════════════════════════════════════ the list

export type TingkatanStruktur = "BAGIAN" | "TINGKAT" | "KELAS";

/** One row of `school_structure(p_institution)`, exactly as it returns it. */
export type SimpulStruktur = {
  node_id: string;
  level: TingkatanStruktur;
  /**
   * The parent the screen shows: null for a Bagian, the Bagian for a Tingkat
   * (the hidden Reguler between them is skipped), the Tingkat for a Kelas.
   */
  parent_id: string | null;
  name: string;
  /** "2026/2027" for a Tingkat or Kelas; null for a Bagian. */
  academic_year: string | null;
  is_active: boolean;
  /** Students placed now, for a Tingkat or Kelas; null for a Bagian. */
  active_members: number | null;
};

export type KelasTersusun = SimpulStruktur & { level: "KELAS" };
export type TingkatTersusun = SimpulStruktur & { level: "TINGKAT"; kelas: KelasTersusun[] };
export type BagianTersusun = SimpulStruktur & { level: "BAGIAN"; tingkat: TingkatTersusun[] };

/**
 * The flat list as a tree, Bagian → Tingkat → Kelas, each level in name order
 * (a Tingkat also by year). A row whose parent is missing from the list is
 * dropped rather than shown loose; that cannot happen for a list the database
 * returned whole.
 */
export function susunStruktur(rows: readonly SimpulStruktur[]): BagianTersusun[] {
  const urut = (a: SimpulStruktur, b: SimpulStruktur) =>
    a.name.localeCompare(b.name, "id", { numeric: true, sensitivity: "base" }) ||
    (a.academic_year ?? "").localeCompare(b.academic_year ?? "");
  const kelas = rows.filter((r): r is KelasTersusun => r.level === "KELAS");
  const tingkat: TingkatTersusun[] = rows
    .filter((r) => r.level === "TINGKAT")
    .map((t) => ({ ...t, level: "TINGKAT" as const, kelas: kelas.filter((k) => k.parent_id === t.node_id).sort(urut) }));
  return rows
    .filter((r) => r.level === "BAGIAN")
    .map((b) => ({
      ...b,
      level: "BAGIAN" as const,
      tingkat: tingkat.filter((t) => t.parent_id === b.node_id).sort(urut),
    }))
    .sort(urut);
}

// ═════════════════════════════════════════════════════ the academic year

/** "2026/2027", "2026 / 2027" → "2026/2027"; anything else → null. */
export function tahunAjaranBaku(teks: string): string | null {
  const m = /^\s*(\d{4})\s*\/\s*(\d{4})\s*$/.exec(teks);
  if (!m) return null;
  const y = Number(m[1]);
  if (Number(m[2]) !== y + 1 || y < 2000 || y > 2098) return null;
  return `${y}/${y + 1}`;
}

/**
 * The academic year a date falls in, in Jakarta: it starts on 1 July. For a
 * form's default only -- the database decides what a year is.
 */
export function tahunAjaranPada(tanggal: Date): string {
  const jakarta = new Date(tanggal.getTime() + 7 * 60 * 60 * 1000);
  const y = jakarta.getUTCFullYear();
  const mulai = jakarta.getUTCMonth() >= 6 ? y : y - 1;
  return `${mulai}/${mulai + 1}`;
}

// ═══════════════════════════════════════════════════════════ the codes

/** Every code the database raises with SQLSTATE PR020. */
export const KODE_STRUKTUR_DB = [
  "STRUCTURE_NOT_ALLOWED",
  "STRUCTURE_NAME_INVALID",
  "STRUCTURE_NAME_TAKEN",
  "STRUCTURE_YEAR_INVALID",
  "STRUCTURE_YEAR_MISMATCH",
  "STRUCTURE_PARENT_INVALID",
  "STRUCTURE_PARENT_INACTIVE",
  "STRUCTURE_NODE_INVALID",
  "STRUCTURE_HAS_ACTIVE_CHILDREN",
  "STRUCTURE_HAS_MEMBERS",
  "STRUCTURE_HAS_STAFF",
  // BOB-08
  "STRUCTURE_NOT_A_SCHOOL",
  "STRUCTURE_YEAR_OUT_OF_RANGE",
  "STRUCTURE_PLACE_INACTIVE",
] as const;

/**
 * Every code a structure action or read can return: the database's, plus two
 * of the server's own. `STRUCTURE_INPUT_INVALID`: a required choice (the
 * school, the Bagian, the Tingkat, the node) was missing or not an id, so
 * nothing was sent. `STRUCTURE_FAILED`: anything else -- the database was
 * unreachable, or refused in a way this contract does not name; it comes with
 * a short reference that is also written to the server log.
 */
export type KodeStruktur = (typeof KODE_STRUKTUR_DB)[number] | "STRUCTURE_INPUT_INVALID" | "STRUCTURE_FAILED";

export type HasilStruktur =
  | { ok: true; id: string }
  | { ok: false; code: KodeStruktur; ref?: string };

export type HasilDaftarStruktur =
  | { ok: true; rows: SimpulStruktur[] }
  | { ok: false; code: KodeStruktur; ref?: string };

/** The shape a Supabase/PostgREST error arrives in; only these fields are read. */
export type GalatDb = { code?: string | null; details?: string | null } | null | undefined;

/**
 * A refusal, as its stable code. PR020 carries the code in DETAIL. A caller
 * the database will not even let execute the function (42501, which is what an
 * anonymous request gets) is not allowed either. Everything else is
 * `STRUCTURE_FAILED`: never the database's own words.
 */
export function kodeGalatStruktur(e: GalatDb): KodeStruktur {
  if (e?.code === "PR020" && typeof e.details === "string"
      && (KODE_STRUKTUR_DB as readonly string[]).includes(e.details)) {
    return e.details as KodeStruktur;
  }
  if (e?.code === "42501") return "STRUCTURE_NOT_ALLOWED";
  return "STRUCTURE_FAILED";
}

/** The copy key for each code (D-014). Daisy owns the wording, not the keys. */
export const KUNCI_GALAT_STRUKTUR: Record<KodeStruktur, HleEvent> = {
  STRUCTURE_NOT_ALLOWED: "config.struktur.galat.tidak_berwenang",
  STRUCTURE_NAME_INVALID: "config.struktur.galat.nama_tidak_sah",
  STRUCTURE_NAME_TAKEN: "config.struktur.galat.nama_dipakai",
  STRUCTURE_YEAR_INVALID: "config.struktur.galat.tahun_tidak_sah",
  STRUCTURE_YEAR_MISMATCH: "config.struktur.galat.tahun_tidak_cocok",
  STRUCTURE_PARENT_INVALID: "config.struktur.galat.induk_tidak_sah",
  STRUCTURE_PARENT_INACTIVE: "config.struktur.galat.induk_nonaktif",
  STRUCTURE_NODE_INVALID: "config.struktur.galat.simpul_tidak_sah",
  STRUCTURE_HAS_ACTIVE_CHILDREN: "config.struktur.galat.masih_ada_anak",
  STRUCTURE_HAS_MEMBERS: "config.struktur.galat.masih_ada_murid",
  STRUCTURE_HAS_STAFF: "config.struktur.galat.masih_ada_staf",
  STRUCTURE_NOT_A_SCHOOL: "config.struktur.galat.bukan_sekolah",
  STRUCTURE_YEAR_OUT_OF_RANGE: "config.struktur.galat.tahun_di_luar",
  STRUCTURE_PLACE_INACTIVE: "config.struktur.galat.tempat_nonaktif",
  STRUCTURE_INPUT_INVALID: "config.struktur.galat.isian_kurang",
  STRUCTURE_FAILED: "config.struktur.galat.gagal",
};

/** A short reference for a failure nobody named, to quote to support. */
export function rujukanGalat(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0");
}
