import type { supabaseServer } from "@/lib/supabase/server";

/**
 * BOB19-K01, THE OWNER'S RULING OF 8 OCT (OPTION B): A SCHOOL'S FIRST ADMINISTRATOR, AND ONLY THEN THE PLATFORM'S LIST.
 *
 * A school context never shows the platform's general list of people without a role. The one exception is the
 * appointment of a school's FIRST administrator:
 * - by an active SYSTEM_ADMIN (the database decides: persons_awaiting_first_role refuses anyone else);
 * - in Mengelola · a school that has no active Admin sekolah;
 * - of a person recorded at no school (no institutional identity anywhere) who holds nothing (no role, enrolment or
 *   transfer: persons_awaiting_first_role's own predicate);
 * - as Admin sekolah at the school's own root, never another role or place.
 *
 * Every other school-role grant names one of the school's own people: those the school has recorded who hold nothing
 * there yet (persons_awaiting_first_role_at), or those it already knows by an active role, an active enrolment or a
 * transfer (the roles form's two groups). The page offers exactly these and the server actions refuse anything else.
 * The database still decides every grant (role_assignments_guard) and audits it; nothing here grants or widens.
 *
 * Shared by Konfigurasi's page and its two actions, so what is offered and what is accepted are one rule.
 */
type Klien = Awaited<ReturnType<typeof supabaseServer>>;

/** True when the school has an active Admin sekolah now (not revoked, inside its validity). */
export async function adaAdminSekolah(supabase: Klien, sekolah: string): Promise<boolean> {
  const kini = new Date().toISOString();
  const { data, error } = await supabase.from("role_assignments").select("id")
    .eq("institution_id", sekolah).eq("role", "INSTITUTION_ADMIN").is("revoked_at", null)
    .lte("valid_from", kini).gt("valid_until", kini).limit(1);
  // a read that fails answers «has one»: the exception stays closed
  return error ? true : (data ?? []).length > 0;
}

/** The school's own root node (kind INSTITUTION), where its first administrator is appointed; null if unreadable. */
export async function akarSekolah(supabase: Klien, sekolah: string): Promise<string | null> {
  const { data } = await supabase.from("org_nodes").select("id")
    .eq("institution_id", sekolah).eq("kind", "INSTITUTION").limit(1).maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

/**
 * The first administrator's candidates: the platform's people who hold nothing AND are recorded at no school. Empty
 * for anyone the database refuses the platform's list, and empty when either read fails (closed, never guessed).
 */
export async function calonAdminPertama(supabase: Klien): Promise<Array<{ person_id: string; display_name: string }>> {
  const { data, error } = await supabase.rpc("persons_awaiting_first_role");
  if (error || !Array.isArray(data) || data.length === 0) return [];
  const calon = data as Array<{ person_id: string; display_name: string }>;
  const { data: tercatat, error: galat } = await supabase.from("institutional_identities").select("person_id")
    .in("person_id", calon.map((p) => p.person_id));
  if (galat) return [];
  const diSekolah = new Set(((tercatat ?? []) as Array<{ person_id: string }>).map((r) => r.person_id));
  return calon.filter((p) => !diSekolah.has(p.person_id));
}

/**
 * Whether a person is one of the school's own for an ordinary grant: recorded there and holding nothing there yet,
 * or known there by an active role, an active enrolment or a transfer. Exactly the roles form's offer in a school.
 */
export async function orangSekolah(supabase: Klien, sekolah: string, orang: string): Promise<boolean> {
  const [menunggu, peran, enrolmen, pindah] = await Promise.all([
    supabase.rpc("persons_awaiting_first_role_at", { p_institution: sekolah }),
    supabase.from("role_assignments").select("id").eq("institution_id", sekolah).eq("person_id", orang).is("revoked_at", null).limit(1),
    supabase.from("enrollments").select("id").eq("institution_id", sekolah).eq("person_id", orang).eq("status", "ACTIVE").limit(1),
    supabase.from("transfers").select("id").eq("person_id", orang)
      .or(`from_institution_id.eq.${sekolah},to_institution_id.eq.${sekolah}`).limit(1),
  ]);
  const daftar = (menunggu.data ?? []) as Array<{ person_id: string }>;
  return daftar.some((p) => p.person_id === orang)
    || (peran.data ?? []).length > 0 || (enrolmen.data ?? []).length > 0 || (pindah.data ?? []).length > 0;
}
