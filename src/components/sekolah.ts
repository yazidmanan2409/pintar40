/**
 * WHICH SCHOOLS A SCHOOL PICKER MAY OFFER, AND WHICH ONE IT STARTS ON
 * (DAISY-05; audit S7b). Shared by every picker that chooses a school to work
 * in: Struktur sekolah now, and the Studio picker (DAISY-06).
 *
 * A school here is a place where people teach and learn: an active tenant of
 * kind INSTITUTION that the reader administers. The national library ("PINTAR
 * Kurikulum Nasional", tenant_kind PLATFORM_CANONICAL) is a tenant too, and
 * sorted by name it came first, so a platform admin opening Konfigurasi
 * started inside it. It has no classes and no students, and it is never
 * offered. Neither is a school that has been deactivated.
 *
 * ALLOW-LISTED, NOT DENY-LISTED. Only INSTITUTION is offered, so a tenant kind
 * added later stays out until somebody decides it belongs, and a row read
 * without its kind or its state offers nothing.
 *
 * Pure: the page reads the rows (with tenant_kind and is_active) and knows
 * whom the reader administers; this decides the list and where it starts. It
 * decides nothing about authority: the database decides again on every act,
 * and BOB-08(f) makes it refuse the canonical tenant as well.
 */
export type SekolahBaris = {
  id: string;
  name: string;
  tenant_kind: string | null;
  is_active: boolean | null;
};

/** The schools on offer, in the order they were read. */
export function sekolahDitawarkan<T extends SekolahBaris>(
  semua: readonly T[],
  dikelola: (id: string) => boolean,
): T[] {
  return semua.filter((s) => s.tenant_kind === "INSTITUTION" && s.is_active === true && dikelola(s.id));
}

/** The school asked for, if it is on offer; otherwise the first on offer; otherwise none. */
export function sekolahDipilih<T extends { id: string }>(
  ditawarkan: readonly T[],
  diminta?: string | null,
): T | null {
  return ditawarkan.find((s) => s.id === diminta) ?? ditawarkan[0] ?? null;
}
