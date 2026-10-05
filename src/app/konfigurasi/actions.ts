"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { kodeGalatStruktur, rujukanGalat, type HasilStruktur } from "@/lib/struktur-kontrak";
import { kodeGalat, queryHasil, type HasilAksi } from "@/lib/galat-kontrak";
import { bacaPersen } from "@/lib/batas-ketuntasan";

/**
 * Config Studio actions (FABLE-01 §10). Every action is a thin call to an
 * existing database RPC acting AS THE SIGNED-IN USER: authority, lifecycle
 * rules and audit rows are decided and written by the database (doc 05,
 * INV-16/18/23/25). Nothing here checks a display role, and nothing here
 * invents policy — transfer consent/authorization policy is OD-9.
 *
 * Results return to the page as a calm status line (`?hasil=…`) anchored to
 * the section that was used. BOB-07 (D-011): the line is told a code and draws
 * the copy table's sentence; the database's own words go to the server log
 * beside the reference the reader is shown.
 */

function back(section: string, h: HasilAksi): never {
  redirect(`/konfigurasi?${queryHasil(section, h).toString()}#${section}`);
}

/** A refusal as its code; one nobody named is logged with the reference the page shows. */
function ditolak(fn: string, error: { code?: string | null; message?: string | null } | null): HasilAksi {
  const kode = kodeGalat(error);
  if (kode !== "ACTION_FAILED") return { ok: false, kode };
  const ref = rujukanGalat();
  console.error(`[konfigurasi ${ref}] ${fn} failed`, error?.code, error?.message);
  return { ok: false, kode, ref };
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function uuidOrNull(v: string): string | null {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v : null;
}

export async function rolloverAction(fd: FormData): Promise<void> {
  const institution = uuidOrNull(str(fd, "institution"));
  const fromPeriod = uuidOrNull(str(fd, "from_period"));
  const toPeriod = uuidOrNull(str(fd, "to_period"));
  const mapping: Array<{ from_node: string; to_node: string }> = [];
  for (const [k, v] of fd.entries()) {
    const m = /^map\[([0-9a-f-]{36})\]$/i.exec(k);
    const to = uuidOrNull(String(v));
    if (m && to) mapping.push({ from_node: m[1], to_node: to });
  }
  if (!institution || !fromPeriod || !toPeriod || fromPeriod === toPeriod || mapping.length === 0) {
    back("rollover", { ok: false, kode: "ROLLOVER_INPUT_INCOMPLETE" });
  }
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("period_rollover", {
    p_institution: institution,
    p_from_period: fromPeriod,
    p_to_period: toPeriod,
    p_mapping: mapping,
  });
  back("rollover", error ? ditolak("period_rollover", error) : { ok: true, kode: "ROLLOVER_DONE", n: Number(data ?? 0) });
}

export async function transferRequestAction(fd: FormData): Promise<void> {
  const fromEnrollment = uuidOrNull(str(fd, "from_enrollment"));
  const toInstitution = uuidOrNull(str(fd, "to_institution"));
  const toPeriod = uuidOrNull(str(fd, "to_period"));
  const toProgramme = uuidOrNull(str(fd, "to_programme"));
  const reason = str(fd, "reason");
  if (!fromEnrollment || !toInstitution || !toPeriod) {
    back("transfers", { ok: false, kode: "TRANSFER_INPUT_INCOMPLETE" });
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("transfer_request", {
    p_from_enrollment: fromEnrollment,
    p_to_institution: toInstitution,
    p_to_period: toPeriod,
    p_to_programme: toProgramme,
    p_reason: reason || null,
    p_consent: {},
  });
  back("transfers", error ? ditolak("transfer_request", error) : { ok: true, kode: "TRANSFER_REQUESTED" });
}

export async function transferAuthorizeAction(fd: FormData): Promise<void> {
  const id = uuidOrNull(str(fd, "transfer"));
  if (!id) back("transfers", { ok: false, kode: "ACTION_NOT_FOUND" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("transfer_authorize", { p_transfer: id, p_consent: {} });
  back("transfers", error ? ditolak("transfer_authorize", error) : { ok: true, kode: "TRANSFER_AUTHORIZED" });
}

export async function transferExecuteAction(fd: FormData): Promise<void> {
  const id = uuidOrNull(str(fd, "transfer"));
  if (!id) back("transfers", { ok: false, kode: "ACTION_NOT_FOUND" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("transfer_execute", { p_transfer: id });
  back("transfers", error ? ditolak("transfer_execute", error) : { ok: true, kode: "TRANSFER_EXECUTED" });
}

export async function transferRejectAction(fd: FormData): Promise<void> {
  const id = uuidOrNull(str(fd, "transfer"));
  if (!id) back("transfers", { ok: false, kode: "ACTION_NOT_FOUND" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("transfer_reject", { p_transfer: id, p_reason: str(fd, "reason") || null });
  back("transfers", error ? ditolak("transfer_reject", error) : { ok: true, kode: "TRANSFER_REJECTED" });
}

const GRANTABLE = new Set(["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"]);

export async function grantRoleAction(fd: FormData): Promise<void> {
  const person = uuidOrNull(str(fd, "person"));
  const role = str(fd, "role");
  const scope = uuidOrNull(str(fd, "scope"));
  const until = str(fd, "valid_until");
  if (!person || !GRANTABLE.has(role) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    back("roles", { ok: false, kode: "ROLE_INPUT_INCOMPLETE" });
  }
  if (role !== "SYSTEM_ADMIN" && !scope) back("roles", { ok: false, kode: "ROLE_SCOPE_REQUIRED" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("grant_role", {
    p_person: person,
    p_role: role,
    p_scope_node: role === "SYSTEM_ADMIN" ? null : scope,
    p_valid_until: `${until}T23:59:59+07:00`,
  });
  back("roles", error ? ditolak("grant_role", error) : { ok: true, kode: "ROLE_GRANTED" });
}

export async function revokeRoleAction(fd: FormData): Promise<void> {
  const id = uuidOrNull(str(fd, "assignment"));
  // D-097(a): a revocation states why; the database asks again (revoke_role)
  const alasan = str(fd, "alasan");
  if (!id) back("roles", { ok: false, kode: "ACTION_NOT_FOUND" });
  if (!alasan || alasan.length > 300) back("roles", { ok: false, kode: "ROLE_REASON_REQUIRED" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("revoke_role", { p_assignment: id, p_reason: alasan });
  back("roles", error ? ditolak("revoke_role", error) : { ok: true, kode: "ROLE_REVOKED" });
}

/**
 * D-085 M9 (J3.12, ADM-J13) — «Pindah kelas». One call, as the signed-in
 * administrator: `move_learner_to_class` closes the student's Kelas
 * membership with MOVED and opens one in the chosen Kelas, together or not at
 * all. It returns to the destination's list, where the student now stands; a
 * refusal returns to the class they were in.
 */
export async function pindahKelasAction(fd: FormData): Promise<void> {
  const penempatan = uuidOrNull(str(fd, "penempatan"));
  const kelas = uuidOrNull(str(fd, "kelas"));
  const dari = uuidOrNull(str(fd, "dari"));
  const sekolah = uuidOrNull(str(fd, "sekolah"));
  const kembali = (h: HasilAksi, tampil: string | null): never => {
    const q = queryHasil("pindah", h);
    if (tampil) q.set("dari", tampil);
    if (sekolah) q.set("sekolah", sekolah);
    redirect(`/konfigurasi?${q.toString()}#pindah`);
  };
  if (!penempatan || !kelas) kembali({ ok: false, kode: "MOVE_INPUT_INCOMPLETE" }, dari);
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("move_learner_to_class", { p_membership: penempatan, p_kelas: kelas });
  if (error) kembali(ditolak("move_learner_to_class", error), dari);
  kembali({ ok: true, kode: "LEARNER_MOVED" }, kelas);
}

/**
 * BOB-44 / DAISY-32 (D-069(e), D-070(c)): «Daftarkan sebagai peserta». One call, as the signed-in administrator:
 * `enrol_for_professional_learning` places an existing person who holds a staff role at the school in a
 * professional-learning Kelas or Tingkat, reusing their enrolment for the year, and audits it. It creates no person,
 * account or number. Every rule is the database's; a refusal comes back as its code.
 */
export async function daftarkanPesertaAction(fd: FormData): Promise<void> {
  const orang = uuidOrNull(str(fd, "orang"));
  const tempat = uuidOrNull(str(fd, "tempat"));
  const sekolah = uuidOrNull(str(fd, "sekolah"));
  const kembali = (h: HasilAksi): never => {
    const q = queryHasil("peserta", h);
    if (sekolah) q.set("sekolah", sekolah);
    redirect(`/konfigurasi?${q.toString()}#peserta`);
  };
  if (!orang || !tempat) kembali({ ok: false, kode: "PD_INPUT_INCOMPLETE" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("enrol_for_professional_learning", { p_person: orang, p_node: tempat });
  if (error) kembali(ditolak("enrol_for_professional_learning", error));
  revalidatePath("/konfigurasi");
  kembali({ ok: true, kode: "PD_ENROLLED" });
}

/**
 * D-088(b), BOB-49: the school admin sets a lesson's pass mark (a whole percentage and a reason). The database decides
 * who may (the school's INSTITUTION_ADMIN), keeps the change as a new row, audits it and seals it only onto what is
 * given afterwards.
 */
export async function tetapkanBatasAction(fd: FormData): Promise<void> {
  const sekolah = uuidOrNull(str(fd, "sekolah"));
  const pelajaran = uuidOrNull(str(fd, "pelajaran"));
  const persen = bacaPersen(str(fd, "persen"));
  const alasan = str(fd, "alasan");
  const kembali = (h: HasilAksi): never => {
    const q = queryHasil("ketuntasan", h);
    if (sekolah) q.set("sekolah", sekolah);
    redirect(`/konfigurasi?${q.toString()}#ketuntasan`);
  };
  if (!sekolah || !pelajaran || persen === null || !alasan || alasan.length > 300) {
    kembali({ ok: false, kode: "PASS_MARK_INPUT_INCOMPLETE" });
  }
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("set_school_pass_mark", {
    p_institution: sekolah, p_course: pelajaran, p_percent: persen, p_reason: alasan,
  });
  if (error) kembali(ditolak("set_school_pass_mark", error));
  kembali({ ok: true, kode: (data as { changed?: boolean } | null)?.changed === false ? "PASS_MARK_UNCHANGED" : "PASS_MARK_SET" });
}

/**
 * W8-02 — an institution assembles one of its own report templates.
 *
 * The form sends the metrics the administrator ticked, in the order the
 * catalogue listed them, each with the visualization they chose from the ones
 * that metric permits. Nothing else travels: no formula, no meaning, no
 * audience, no minimum sample — those are PINTAR's and this action has no
 * argument that could carry them.
 *
 * Authority is `save_report_template`'s, which asks for
 * CAN_MANAGE_REPORT_TEMPLATES in the named institution before it resolves
 * anything, and the row guards ask again on every write. This action checks
 * nothing and decides nothing; it shapes a form into one RPC call.
 */
export async function saveReportTemplateAction(fd: FormData): Promise<void> {
  const institution = uuidOrNull(str(fd, "institution"));
  const template = uuidOrNull(str(fd, "template"));
  const standardReport = str(fd, "standard_report");
  const titleKey = str(fd, "title_key");
  const metrics: Array<{ metric_id: string; visualization: string }> = [];
  for (const [k, v] of fd.entries()) {
    const m = /^metric\[(.+)\]$/.exec(k);
    const visualization = String(v);
    if (m && visualization) metrics.push({ metric_id: m[1], visualization });
  }
  if (!institution || !standardReport || !/^[a-z][a-z0-9_.]+$/.test(titleKey) || metrics.length === 0) {
    back("intelligence", { ok: false, kode: "TEMPLATE_INPUT_INCOMPLETE" });
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("save_report_template", {
    p_institution: institution,
    p_standard_report: standardReport,
    p_title_key: titleKey,
    p_metrics: metrics,
    p_template: template,
  });
  back("intelligence", error ? ditolak("save_report_template", error) : { ok: true, kode: "TEMPLATE_SAVED", n: metrics.length });
}

// ═══════════════════════════════════════════════════ BOB-01: school structure

/**
 * BOB-01 — THE FIVE STRUCTURE ACTS (D-006): create a Bagian, a Tingkat or a
 * Kelas, rename one, deactivate one. Each is one call to the database function
 * of the same purpose, acting AS THE SIGNED-IN USER; who may do it, every rule
 * about names and years, the hidden Jenjang and Reguler, and the audit row are
 * the database's. This file carries a form to that call and brings back a
 * code.
 *
 * SHAPED FOR `useActionState(action, null)`: each takes the previous result
 * and the form, and returns `HasilStruktur` -- `{ ok: true, id }` or
 * `{ ok: false, code, ref? }` -- never the database's own words (D-011). After
 * any result the screen re-reads the list rather than trusting it: a create
 * whose response was lost has still happened, and a retry then answers
 * STRUCTURE_NAME_TAKEN.
 *
 *   buatBagianAksi           institusi, nama, untuk ("murid" | "guru")
 *   buatTingkatAksi          bagian, nama, tahun_ajaran
 *   buatKelasAksi            tingkat, nama, tahun_ajaran (optional; must be the Tingkat's)
 *   ubahNamaStrukturAksi     simpul, nama
 *   nonaktifkanStrukturAksi  simpul, alasan
 */
async function struktur(fn: string, args: Record<string, string | boolean | null>): Promise<HasilStruktur> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc(fn, args);
  if (error || typeof data !== "string") {
    // BOB-08 (d): the list is re-read after a refusal too, not only after a
    // success. A refusal (a name another admin just took, a Tingkat just
    // deactivated) is when the page most needs to show what is there now.
    revalidatePath("/konfigurasi", "layout");
    const code = kodeGalatStruktur(error);
    if (code !== "STRUCTURE_FAILED") return { ok: false, code };
    const ref = rujukanGalat();
    console.error(`[struktur ${ref}] ${fn} failed`, error?.code, error?.message);
    return { ok: false, code, ref };
  }
  revalidatePath("/konfigurasi", "layout");
  return { ok: true, id: data };
}

const KURANG: HasilStruktur = { ok: false, code: "STRUCTURE_INPUT_INVALID" };

export async function buatBagianAksi(_prev: HasilStruktur | null, fd: FormData): Promise<HasilStruktur> {
  const institusi = uuidOrNull(str(fd, "institusi"));
  if (!institusi) return KURANG;
  // BOB-43 / DAISY-32: what the Bagian is for, asked once and never changed; a boolean, so nothing here names the context
  return struktur("create_bagian", { p_institution: institusi, p_name: str(fd, "nama"), p_for_educators: str(fd, "untuk") === "guru" });
}

export async function buatTingkatAksi(_prev: HasilStruktur | null, fd: FormData): Promise<HasilStruktur> {
  const bagian = uuidOrNull(str(fd, "bagian"));
  if (!bagian) return KURANG;
  return struktur("create_tingkat", {
    p_bagian_node: bagian,
    p_name: str(fd, "nama"),
    p_academic_year: str(fd, "tahun_ajaran"),
  });
}

export async function buatKelasAksi(_prev: HasilStruktur | null, fd: FormData): Promise<HasilStruktur> {
  const tingkat = uuidOrNull(str(fd, "tingkat"));
  if (!tingkat) return KURANG;
  return struktur("create_kelas", {
    p_tingkat_node: tingkat,
    p_name: str(fd, "nama"),
    p_academic_year: str(fd, "tahun_ajaran") || null,
  });
}

export async function ubahNamaStrukturAksi(_prev: HasilStruktur | null, fd: FormData): Promise<HasilStruktur> {
  const simpul = uuidOrNull(str(fd, "simpul"));
  if (!simpul) return KURANG;
  return struktur("rename_school_node", { p_node: simpul, p_name: str(fd, "nama") });
}

export async function nonaktifkanStrukturAksi(_prev: HasilStruktur | null, fd: FormData): Promise<HasilStruktur> {
  const simpul = uuidOrNull(str(fd, "simpul"));
  // D-097(a): a deactivation states why; the database asks again (STRUCTURE_REASON_REQUIRED)
  const alasan = str(fd, "alasan");
  if (!simpul || !alasan || alasan.length > 300) return KURANG;
  return struktur("deactivate_school_node", { p_node: simpul, p_reason: alasan });
}

