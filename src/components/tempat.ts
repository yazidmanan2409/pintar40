import { berandaPeran } from "@/lib/beranda";
import type { DisplayRole } from "@/lib/auth";
import { t, type HleEvent, type Locale, type Persona } from "@/lib/hle";

/**
 * A PERSON'S OTHER PLACES, OFFERED AND NOT GRANTED (DAISY-03, D-010).
 *
 * Every staff shell used to show only its own area, so a teacher who is also a
 * head of department had no way from Kelas to Pimpinan, and a dean or head of
 * department could not reach Pimpinan at all without typing it (audit M15).
 *
 * ═══ WHICH PLACES: D-010's MAP, THROUGH BOB'S FUNCTION ═══
 *
 * D-010 says where each role belongs: Guru → Mengajar, Kepala departemen and
 * Dekan → Pimpinan, Admin sekolah and Admin platform → Konfigurasi. That map
 * is implemented once, in `berandaPeran`, and this reads it rather than
 * restating it, so the shell and the landing after sign-in (BOB-06) cannot
 * disagree about where somebody's place is.
 *
 * ═══ A TAB DECIDES NOTHING ═══
 *
 * The roles come from the reader's own active role assignments, and a tab is
 * an offer. Every destination still asks its own gate on arrival and refuses
 * through the one refusal page, which now also carries a way out (DAISY-02).
 * Nothing here widens what anybody may do.
 *
 * Pure and free of React, so the guard can read exactly what a shell draws.
 */
export type Tempat = "/mengajar" | "/pimpinan" | "/konfigurasi";

/** Display order, and the only places a staff shell offers. */
const URUTAN: readonly Tempat[] = ["/mengajar", "/pimpinan", "/konfigurasi"];

const LABEL: Record<Tempat, HleEvent> = {
  "/mengajar": "nav.kelas",
  "/pimpinan": "nav.pimpinan",
  "/konfigurasi": "nav.konfigurasi",
};

/** The staff places a set of active roles leads to, per D-010. */
export function tempatDariPeran(peran: readonly string[] | null): Tempat[] {
  if (!peran) return [];
  const rumah = new Set(peran.map((p) => berandaPeran(p as DisplayRole)));
  return URUTAN.filter((x) => rumah.has(x));
}

/** Exactly the links a shell draws: the places, less the ones it already has. */
export function daftarTempat(
  tempat: readonly Tempat[],
  kecuali: readonly Tempat[],
  locale: Locale,
  persona: Persona,
): Array<{ href: Tempat; label: string }> {
  return tempat
    .filter((x) => !kecuali.includes(x))
    .map((x) => ({ href: x, label: t(LABEL[x], persona, { locale }) }));
}

/**
 * STUDIO, OFFERED BY ROLE (DAISY-11, D-021). Studio is not anybody's home, so
 * it is not one of D-010's places above: it is where content is drafted, and
 * the tab is shown to every role whose capability map includes drafting
 * (CAN_DRAFT) -- Guru, Kepala departemen, Admin sekolah and Admin platform. A
 * dean holds no Studio capability and is not offered it.
 *
 * A ROLE RULE, ON PURPOSE. Asking the database for the capability in every
 * school on every page is what D-021 decided against; the role list is read
 * from the capability map by a guard, so the two cannot drift apart unnoticed.
 * The tab decides nothing: Studio's own layout still asks the database and
 * refuses a person who holds no capability in any school.
 */
export const PERAN_STUDIO: readonly string[] = ["EDUCATOR", "HEAD_OF_DEPARTMENT", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"];

/** Whether a shell offers the Studio tab. Roles that could not be read offer nothing. */
export function tawarkanStudio(peran: readonly string[] | null): boolean {
  return !!peran && peran.some((p) => PERAN_STUDIO.includes(p));
}


