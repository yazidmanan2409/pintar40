"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { kodeGalatStruktur, rujukanGalat, type HasilStruktur } from "@/lib/struktur-kontrak";

/**
 * Config Studio actions (FABLE-01 §10). Every action is a thin call to an
 * existing database RPC acting AS THE SIGNED-IN USER: authority, lifecycle
 * rules and audit rows are decided and written by the database (doc 05,
 * INV-16/18/23/25). Nothing here checks a display role, and nothing here
 * invents policy — transfer consent/authorization policy is OD-9.
 *
 * Results return to the page as a calm status line (`?hasil=…`) anchored to
 * the section that was used.
 */

type Outcome = { ok: boolean; detail?: string };

function back(section: string, outcome: Outcome): never {
  const q = new URLSearchParams({ bagian: section, hasil: outcome.ok ? "ok" : "gagal" });
  if (outcome.detail) q.set("detail", outcome.detail.slice(0, 300));
  redirect(`/konfigurasi?${q.toString()}#${section}`);
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
    back("rollover", { ok: false, detail: "lengkapi tahun ajaran asal, tujuan, dan minimal satu pemetaan kelas" });
  }
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("period_rollover", {
    p_institution: institution,
    p_from_period: fromPeriod,
    p_to_period: toPeriod,
    p_mapping: mapping,
  });
  back("rollover", error ? { ok: false, detail: error.message } : { ok: true, detail: `${data ?? 0} keanggotaan dipindahkan` });
}

export async function transferRequestAction(fd: FormData): Promise<void> {
  const fromEnrollment = uuidOrNull(str(fd, "from_enrollment"));
  const toInstitution = uuidOrNull(str(fd, "to_institution"));
  const toPeriod = uuidOrNull(str(fd, "to_period"));
  const toProgramme = uuidOrNull(str(fd, "to_programme"));
  const reason = str(fd, "reason");
  if (!fromEnrollment || !toInstitution || !toPeriod) {
    back("transfers", { ok: false, detail: "pendaftaran asal, kode sekolah tujuan dan kode tahun ajaran tujuan wajib diisi" });
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
  back("transfers", error ? { ok: false, detail: error.message } : { ok: true });
}

export async function transferAuthorizeAction(fd: FormData): Promise<void> {
  const id = uuidOrNull(str(fd, "transfer"));
  if (!id) back("transfers", { ok: false });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("transfer_authorize", { p_transfer: id, p_consent: {} });
  back("transfers", error ? { ok: false, detail: error.message } : { ok: true });
}

export async function transferExecuteAction(fd: FormData): Promise<void> {
  const id = uuidOrNull(str(fd, "transfer"));
  if (!id) back("transfers", { ok: false });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("transfer_execute", { p_transfer: id });
  back("transfers", error ? { ok: false, detail: error.message } : { ok: true });
}

export async function transferRejectAction(fd: FormData): Promise<void> {
  const id = uuidOrNull(str(fd, "transfer"));
  if (!id) back("transfers", { ok: false });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("transfer_reject", { p_transfer: id, p_reason: str(fd, "reason") || null });
  back("transfers", error ? { ok: false, detail: error.message } : { ok: true });
}

const GRANTABLE = new Set(["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN", "SYSTEM_ADMIN"]);

export async function grantRoleAction(fd: FormData): Promise<void> {
  const person = uuidOrNull(str(fd, "person"));
  const role = str(fd, "role");
  const scope = uuidOrNull(str(fd, "scope"));
  const until = str(fd, "valid_until");
  if (!person || !GRANTABLE.has(role) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    back("roles", { ok: false, detail: "pilih orang, peran, dan tanggal berlaku" });
  }
  if (role !== "SYSTEM_ADMIN" && !scope) back("roles", { ok: false, detail: "peran sekolah memerlukan lingkup" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("grant_role", {
    p_person: person,
    p_role: role,
    p_scope_node: role === "SYSTEM_ADMIN" ? null : scope,
    p_valid_until: `${until}T23:59:59+07:00`,
  });
  back("roles", error ? { ok: false, detail: error.message } : { ok: true });
}

export async function revokeRoleAction(fd: FormData): Promise<void> {
  const id = uuidOrNull(str(fd, "assignment"));
  if (!id) back("roles", { ok: false });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("revoke_role", { p_assignment: id });
  back("roles", error ? { ok: false, detail: error.message } : { ok: true });
}

export async function setFlagAction(fd: FormData): Promise<void> {
  const institution = uuidOrNull(str(fd, "institution"));
  const key = str(fd, "key");
  const enabled = str(fd, "enabled") === "on";
  if (!institution || !/^[a-z][a-z0-9_.]{1,80}$/.test(key)) back("flags", { ok: false, detail: "kunci fitur: huruf kecil, angka, titik, garis bawah" });
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("feature_flags")
    .upsert({ key, institution_id: institution, enabled, updated_at: new Date().toISOString() }, { onConflict: "key,institution_id" })
    .select("enabled");
  // F-05: an upsert RLS filtered to nothing reports no error; read back instead
  back("flags", error ? { ok: false, detail: error.message }
    : (data ?? []).length === 1 && data![0].enabled === enabled ? { ok: true } : { ok: false, detail: "tidak ada perubahan" });
}

export async function setPlatformConfigAction(fd: FormData): Promise<void> {
  const key = str(fd, "key");
  if (!["maintenance_mode", "registration_lock"].includes(key)) back("flags", { ok: false });
  const value = str(fd, "value") === "on";
  const supabase = await supabaseServer();
  const { error, count } = await supabase
    .from("platform_config")
    .update({ value, updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("key", key);
  back("flags", error ? { ok: false, detail: error.message } : count ? { ok: true } : { ok: false, detail: "tidak ada perubahan" });
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
    back("intelligence", { ok: false, detail: "pilih institusi, kunci judul, dan minimal satu metrik" });
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("save_report_template", {
    p_institution: institution,
    p_standard_report: standardReport,
    p_title_key: titleKey,
    p_metrics: metrics,
    p_template: template,
  });
  back("intelligence", error ? { ok: false, detail: error.message } : { ok: true, detail: `${metrics.length} metrik` });
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
 *   buatBagianAksi           institusi, nama
 *   buatTingkatAksi          bagian, nama, tahun_ajaran
 *   buatKelasAksi            tingkat, nama, tahun_ajaran (optional; must be the Tingkat's)
 *   ubahNamaStrukturAksi     simpul, nama
 *   nonaktifkanStrukturAksi  simpul
 */
async function struktur(fn: string, args: Record<string, string | null>): Promise<HasilStruktur> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc(fn, args);
  if (error || typeof data !== "string") {
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
  return struktur("create_bagian", { p_institution: institusi, p_name: str(fd, "nama") });
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
  if (!simpul) return KURANG;
  return struktur("deactivate_school_node", { p_node: simpul });
}
