import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { catatanDari, type BarisAntrean, type BarisPengerjaan, type CatatanBab, type PengerjaanSaya } from "@/lib/pengerjaan-kontrak";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A1 · sitting control, the screens' reads (migration 20270114100000). Each is the database's own answer for the
 * caller: nothing here decides who may read or act.
 */

/**
 * The teacher's list for one class and one instrument (daftar_pengerjaan), or null when the database does not give it
 * to this reader (no CAN_MANAGE_SITTINGS over the class, a professional-learning class): the page then draws the
 * names and their three states as before, with no act.
 */
export async function daftarPengerjaan(kelas: string, penugasanAsesmen: string): Promise<BarisPengerjaan[] | null> {
  const c = (await supabaseServer()) as any;
  const { data, error } = await c.rpc("daftar_pengerjaan", { p_kelas: kelas, p_assessment_assignment: penugasanAsesmen });
  return error || !Array.isArray(data) ? null : (data as BarisPengerjaan[]);
}

/** The instruments of the lesson one assessment assignment belongs to (its Pemetaan Awal and its Uji Penguasaan). */
export async function instrumenSaudara(penugasanAsesmen: string): Promise<Array<{ id: string; mode: string }>> {
  const c = (await supabaseServer()) as any;
  const { data: ini } = await c.from("assessment_assignments").select("id, learning_assignment_id").eq("id", penugasanAsesmen).maybeSingle();
  if (!ini?.learning_assignment_id) return [];
  const { data } = await c.from("assessment_assignments")
    .select("id, definition:assessment_definitions(mode)").eq("learning_assignment_id", ini.learning_assignment_id);
  return ((data ?? []) as Array<{ id: string; definition: { mode: string } | null }>)
    .map((r) => ({ id: r.id, mode: r.definition?.mode ?? "" }))
    .filter((r) => r.mode === "PRE_TEST" || r.mode === "POST_TEST")
    .sort((a, b) => (a.mode === "PRE_TEST" ? 0 : 1) - (b.mode === "PRE_TEST" ? 0 : 1));
}

/** The approver's queue at one school (percobaan_antrean): empty for anyone who may decide nothing there. */
export async function antreanKesempatan(sekolah: string | null | undefined): Promise<BarisAntrean[]> {
  if (!sekolah) return [];
  const c = (await supabaseServer()) as any;
  const { data, error } = await c.rpc("percobaan_antrean", { p_institution: sekolah });
  return error || !Array.isArray(data) ? [] : (data as BarisAntrean[]);
}

/** How many waiting requests the reader may decide (their own requests are not theirs to decide). */
export async function jumlahKesempatanMenunggu(sekolah: string | null | undefined): Promise<number> {
  return (await antreanKesempatan(sekolah)).filter((r) => !r.milik_sendiri).length;
}

/** The learner's own sitting as the database tells it (pengerjaan_saya), or null. */
export async function pengerjaanSaya(sesi: string): Promise<PengerjaanSaya | null> {
  const c = (await supabaseServer()) as any;
  const { data, error } = await c.rpc("pengerjaan_saya", { p_session: sesi });
  return error || !data ? null : (data as PengerjaanSaya);
}

/** Whether an approved further attempt waits for the learner on one assessment assignment (percobaan_saya). */
export async function kesempatanSaya(penugasanAsesmen: string): Promise<boolean> {
  const c = (await supabaseServer()) as any;
  const { data, error } = await c.rpc("percobaan_saya", { p_assessment_assignment: penugasanAsesmen });
  return !error && data === true;
}

/**
 * A chapter's A1 note for its learner: the Uji Penguasaan's latest sitting when there is one, else the Pemetaan
 * Awal's. Two small reads of the caller's own (pengerjaan_saya, percobaan_saya); a failed read says nothing.
 */
export async function catatanBab(state: {
  pre_assignment: string | null; pre_session: string | null; pre_status: string | null;
  post_assignment: string | null; post_session: string | null; post_status: string | null;
}): Promise<CatatanBab | null> {
  const post = Boolean(state.post_session);
  const sesi = post ? state.post_session : state.pre_session;
  const status = post ? state.post_status : state.pre_status;
  const penugasan = post ? state.post_assignment : state.pre_assignment;
  if (!sesi || !penugasan) return null;
  const [k, izin] = await Promise.all([
    pengerjaanSaya(sesi).catch(() => null),
    status === "FINALIZED" || status === "TERMINATED" || status === "EXPIRED" ? kesempatanSaya(penugasan).catch(() => false) : Promise.resolve(false),
  ]);
  return catatanDari(post ? "POST_TEST" : "PRE_TEST", status, k, izin, Date.now());
}
