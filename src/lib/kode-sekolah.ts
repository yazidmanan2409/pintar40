/**
 * S-04 (SAPU-VERIFIED): A SCHOOL CODE'S SHAPE, by reserve_institution_namespace's own rule
 * (20260926100000_a_school_gives_a_person_a_number.sql): upper(btrim(code)) is exactly three of A–Z or 0–9. btrim trims
 * spaces only, as here. The shape is fully knowable before the database is asked, so it is said as the shape; «maybe
 * already taken» is left for the refusals that are not.
 */
export function kodeSekolahSah(kode: string): boolean {
  return /^[A-Z0-9]{3}$/.test(kode.replace(/^ +| +$/g, "").toUpperCase());
}
