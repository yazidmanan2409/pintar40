/**
 * WHOSE NAME THE SESSION STRIP MAY SHOW (DAISY-02; S15, D-020).
 *
 * Decided by the READER, never by the page. The first version asked the page
 * ("is this a staff shell?"), and /mengajar renders the teaching shell for
 * anybody who reaches it, so a student who typed the address saw their own
 * full name printed on a shared tablet. The rule is now about who is reading:
 * a name is shown only to somebody who holds a staff role. A student holds
 * none, so a student is never named, on any page.
 *
 * FAILS CLOSED. Roles that could not be read (null) name nobody, and so does a
 * reader with no display name. Pure and free of React, so the guard can prove
 * the rule by reader role without a database.
 */
export const PERAN_STAF: readonly string[] = [
  "EDUCATOR",
  "HEAD_OF_DEPARTMENT",
  "DEAN",
  "INSTITUTION_ADMIN",
  "SYSTEM_ADMIN",
];

/** The name to show in the strip, or null for "Bukan akun Anda?". */
export function namaUntukStrip(nama: string | null, peran: readonly string[] | null): string | null {
  if (!nama || !peran) return null;
  return peran.some((p) => PERAN_STAF.includes(p)) ? nama : null;
}

/**
 * HOW THE HOME PAGE GREETS THE READER (D-020): a learner by first name only,
 * so a child still recognises their own account while the next child on a
 * shared tablet does not read a full name. Staff may be greeted in full, which
 * also spares "Halo, Dr." to somebody whose name begins with a title. Nobody
 * named means no name, never a placeholder word.
 */
export function namaSapaan(nama: string | null, peran: readonly string[] | null): string | null {
  const bersih = nama?.trim();
  if (!bersih) return null;
  if (peran && peran.some((p) => PERAN_STAF.includes(p))) return bersih;
  return bersih.split(/\s+/)[0];
}
