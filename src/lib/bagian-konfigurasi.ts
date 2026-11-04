/**
 * B1 (D-166(a)): KONFIGURASI IS AN INDEX AND ONE PAGE PER SECTION. The one table of its sections, their pages and
 * their groups on the index, read by the page, its actions, the problem report's action and the index's forwarding
 * of an older address, so a section's address is written in one place.
 *
 * E-B1-1: every older address keeps working. `?bagian=<section>` on the index goes to that section's page with every
 * parameter it carried (the result line, the form's origin, the list's page); an older `#<section>` is forwarded to
 * the section's page by the index (a fragment never reaches the server). A section's id on its page is unchanged, so
 * `#<section>` and `#laporan-<id>` still land on the same element.
 */
export const BAGIAN_KONFIGURASI = [
  "struktur", "ketuntasan", "rollover", "system",
  "pindah", "transfers",
  "roles", "peserta", "audit",
  "laporan", "intelligence",
  "laporan-masalah", "pemeliharaan",
] as const;
export type BagianKonfigurasi = (typeof BAGIAN_KONFIGURASI)[number];

export const adalahBagian = (b: unknown): b is BagianKonfigurasi =>
  typeof b === "string" && (BAGIAN_KONFIGURASI as readonly string[]).includes(b);

/**
 * The index's five groups (B1 §1), each an h2 over its sections' rows, in task order: setup first, because a new
 * school can do nothing until it has a structure (DAISY-05), then the people, then what is read, then support. A group
 * none of whose sections the context draws is absent. The group words are presentation (B1 §5), pending copy approval.
 */
export const KELOMPOK_KONFIGURASI: ReadonlyArray<{ kunci: string; bagian: readonly BagianKonfigurasi[] }> = [
  { kunci: "config.kelompok.sekolah", bagian: ["struktur", "ketuntasan", "rollover", "system"] },
  { kunci: "config.kelompok.murid", bagian: ["pindah", "transfers"] },
  { kunci: "config.kelompok.staf", bagian: ["roles", "peserta", "audit"] },
  { kunci: "config.kelompok.laporan", bagian: ["laporan", "intelligence"] },
  { kunci: "config.kelompok.dukungan", bagian: ["laporan-masalah", "pemeliharaan"] },
];

/** A section's page, with its query and fragment when given. */
export function alamatBagian(bagian: BagianKonfigurasi, q?: URLSearchParams | string, jangkar?: string): string {
  const query = q === undefined ? "" : typeof q === "string" ? q : q.toString();
  return `/konfigurasi/${bagian}${query ? `?${query}` : ""}${jangkar ? `#${jangkar}` : ""}`;
}

/** The section an older fragment names: a section's own id, or a problem report's row (`laporan-<id>`). */
export function bagianDariJangkar(jangkar: string): BagianKonfigurasi | null {
  const h = jangkar.replace(/^#/, "");
  if (adalahBagian(h)) return h;
  if (/^laporan-[0-9a-f-]{36}$/.test(h)) return "laporan-masalah";
  return null;
}

/**
 * E-B1-1: the parameters each section's own GET forms and pagers carry. An older address to the single page that names
 * no section but carries one of these (Peran & akses's two-step appointments, Pindah kelas's «Lihat», the maintenance
 * check, the transfer search, a list's page) belongs to that section; the index sends it there with every parameter.
 * `periksa=skema` is the index's own (the system check).
 */
const PARAMETER_BAGIAN: ReadonlyArray<readonly [string, BagianKonfigurasi]> = [
  ["angkat", "roles"], ["pertama", "roles"], ["hal_peran", "roles"],
  ["dari", "pindah"],
  ["pm_cek", "pemeliharaan"], ["hal_jendela", "pemeliharaan"], ["hal_pengumuman", "pemeliharaan"],
  ["cari_sekolah", "transfers"], ["hal_pindah", "transfers"],
  ["hal_jejak", "audit"], ["hal_sekolah", "system"],
  ["lapor", "laporan-masalah"], ["hal_lapor", "laporan-masalah"],
];
export function bagianDariParameter(sp: Record<string, unknown>): BagianKonfigurasi | null {
  if (adalahBagian(sp.bagian)) return sp.bagian;
  return PARAMETER_BAGIAN.find(([k]) => sp[k] !== undefined && sp[k] !== "")?.[1] ?? null;
}
