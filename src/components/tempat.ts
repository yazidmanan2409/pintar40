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

/** A door on the home page: the learner's place or one of the staff places. */
export type Pintu = "/belajar" | Tempat;

/**
 * THE HOME PAGE'S DOORS FOR SOMEBODY SIGNED IN (DAISY-03, D-010): only the
 * places the reader actually holds.
 *
 * STAFF PLACES COME FROM ACTIVE ROLES ONLY, never from `display_role`, which is
 * "the most senior thing about this person" (pembelajaran.ts) and can outlive
 * the assignment behind it. A staff door therefore means a role held today.
 * BELAJAR is the learner's: `role_assignments` forbids STUDENT and a learner
 * is an enrolment, so it is the display role that says so. A student is
 * therefore never sent to /mengajar, and no door leads to a page that would
 * refuse its reader.
 *
 * FAILS CLOSED. Roles that could not be read (null) open no staff door. An
 * empty list is an honest answer: the page says so instead of guessing.
 */
export function pintuMasuk(displayRole: string | null, peran: readonly string[] | null): Pintu[] {
  const belajar: Pintu[] = displayRole === "STUDENT" ? ["/belajar"] : [];
  return [...belajar, ...tempatDariPeran(peran)];
}
