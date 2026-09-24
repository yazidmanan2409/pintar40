"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { BATAS, bacaBukuKerja } from "@/lib/xlsx";
import {
  bukuKerjaKePaket, kodeGalatPaket,
  type HasilPaket, type HitunganPaket, type KodePaket, type MasalahPaket, type MediaPaket,
} from "@/lib/unggah-kontrak";

/**
 * Studio actions (FABLE-05).
 *
 * Every action is a thin call to an existing database RPC or an ordinary
 * table write, acting AS THE SIGNED-IN USER. Authority, lifecycle legality,
 * bounds and audit rows are the database's; nothing here re-decides any of
 * them, and nothing here holds a privileged client. An action that the server
 * refuses returns as a calm line on the page it came from, never a stack
 * trace (§4: "Every validator and quality finding shown as coaching").
 */

type Outcome = { ok: boolean; detail?: string };

function back(path: string, section: string, outcome: Outcome): never {
  const q = new URLSearchParams({ bagian: section, hasil: outcome.ok ? "ok" : "gagal" });
  if (outcome.detail) q.set("detail", outcome.detail.slice(0, 300));
  redirect(`${path}?${q.toString()}#${section}`);
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const num = (fd: FormData, key: string) => {
  const v = str(fd, key);
  return v === "" ? null : Number(v);
};
const uuidOrNull = (v: string): string | null =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v) ? v : null;

/**
 * NEVER TRUST A 2XX (F-05). An UPDATE that row-level security filters to zero
 * rows returns no error from PostgREST: the author was told "Tersimpan" while
 * nothing had changed. Every table write here reads back what it touched and
 * compares it with what it meant to touch; a shortfall is a refusal.
 */
const TIDAK_BERUBAH = "tidak ada yang berubah — perubahan ini di luar wewenang Anda atau sudah tidak berlaku";

/** The database's message is the coaching text; it is written for a human. */
function detailOf(error: { message?: string } | null): string | undefined {
  return error?.message?.replace(/^ERROR:\s*/i, "").slice(0, 300);
}

// ---------------------------------------------------------------- lifecycle

export async function advanceContentAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  const to = str(fd, "to");
  if (!course || !to) back("/studio", "paket", { ok: false, detail: "paket tidak dikenali" });

  const supabase = await supabaseServer();
  const { data: mods } = await supabase.from("modules").select("id").eq("course_id", course);
  const moduleIds = (mods ?? []).map((m) => m.id as string);
  const { data: lessons } = moduleIds.length
    ? await supabase.from("lessons").select("id").in("module_id", moduleIds)
    : { data: [] as Array<{ id: string }> };
  const lessonIds = (lessons ?? []).map((l) => l.id as string);
  const { data: itemRows } = lessonIds.length
    ? await supabase.from("items").select("id").in("lesson_id", lessonIds)
    : { data: [] as Array<{ id: string }> };
  const itemCount = (itemRows ?? []).length;

  // The reviewer of record is the caller; the database refuses anything else.
  const { data: me } = await supabase.rpc("current_person_id");
  const patch: Record<string, unknown> = { status: to };
  if (to === "APPROVED") patch.reviewed_by_person_id = me;

  // expected: every visible item and lesson, every visible module; definitions
  // may legitimately be none, so they are counted but not required
  for (const [table, column, ids, expected] of [
    ["items", "lesson_id", lessonIds, itemCount],
    ["lessons", "module_id", moduleIds, lessonIds.length],
    ["modules", "course_id", [course], moduleIds.length],
    ["assessment_definitions", "course_id", [course], -1],
  ] as const) {
    if (ids.length === 0) continue;
    const q = supabase.from(table).update(patch).in(column, ids as string[]);
    const { data, error } = table === "assessment_definitions"
      ? await q.eq("is_ad_hoc", false).select("id")
      : await q.select("id");
    if (error) back(`/studio/paket/${course}`, "paket", { ok: false, detail: detailOf(error) });
    if (expected >= 0 && (data ?? []).length !== expected) {
      back(`/studio/paket/${course}`, "paket", { ok: false, detail: TIDAK_BERUBAH });
    }
  }
  const { data: changed, error } = await supabase.from("courses").update(patch).eq("id", course).select("id");
  if (error) back(`/studio/paket/${course}`, "paket", { ok: false, detail: detailOf(error) });
  if ((changed ?? []).length !== 1) back(`/studio/paket/${course}`, "paket", { ok: false, detail: TIDAK_BERUBAH });
  back(`/studio/paket/${course}`, "paket", { ok: true });
}

export async function runValidationAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  if (!course) back("/studio", "paket", { ok: false, detail: "paket tidak dikenali" });
  const supabase = await supabaseServer();
  const a = await supabase.rpc("validate_course_content", { p_course: course });
  if (a.error) back(`/studio/paket/${course}`, "paket", { ok: false, detail: detailOf(a.error) });
  const b = await supabase.rpc("run_mcq_quality", { p_course: course });
  if (b.error) back(`/studio/paket/${course}`, "paket", { ok: false, detail: detailOf(b.error) });
  back(`/studio/paket/${course}`, "paket", { ok: true });
}

export async function acknowledgeFindingAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  const finding = uuidOrNull(str(fd, "finding"));
  const kind = str(fd, "kind");
  if (!course || !finding) back("/studio", "temuan", { ok: false, detail: "temuan tidak dikenali" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("acknowledge_finding", {
    p_kind: kind, p_finding: finding, p_note: str(fd, "catatan") || null,
  });
  back(`/studio/paket/${course}`, "temuan", { ok: !error, detail: detailOf(error) });
}

export async function freezeReleaseAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  const release = uuidOrNull(str(fd, "release"));
  if (!course || !release) back("/studio", "paket", { ok: false, detail: "terbitan tidak dikenali" });
  const supabase = await supabaseServer();
  for (const to of ["STRUCTURED", "VALIDATED", "IN_REVIEW", "APPROVED", "FROZEN"]) {
    const { data: current } = await supabase.from("plp_releases").select("status").eq("id", release).maybeSingle();
    if (!current) break;
    const order = ["INGESTED", "STRUCTURED", "VALIDATED", "IN_REVIEW", "APPROVED", "FROZEN", "PUBLISHED", "SUPERSEDED"];
    if (order.indexOf(current.status as string) >= order.indexOf(to)) continue;
    const { data: me } = await supabase.rpc("current_person_id");
    const patch: Record<string, unknown> = { status: to };
    if (to === "APPROVED") patch.reviewed_by_person_id = me;
    const { data: changed, error } = await supabase.from("plp_releases").update(patch).eq("id", release).select("id");
    if (error) back(`/studio/paket/${course}`, "paket", { ok: false, detail: detailOf(error) });
    if ((changed ?? []).length !== 1) back(`/studio/paket/${course}`, "paket", { ok: false, detail: TIDAK_BERUBAH });
  }
  // read back the one fact the author asked for, rather than inferring it
  const { data: after } = await supabase.from("plp_releases").select("status").eq("id", release).maybeSingle();
  if (after?.status !== "FROZEN") back(`/studio/paket/${course}`, "paket", { ok: false, detail: TIDAK_BERUBAH });
  back(`/studio/paket/${course}`, "paket", { ok: true });
}

export async function publishReleaseAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  const release = uuidOrNull(str(fd, "release"));
  if (!course || !release) back("/studio", "paket", { ok: false, detail: "terbitan tidak dikenali" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("publish_release", { p_release: release });
  back(`/studio/paket/${course}`, "paket", { ok: !error, detail: detailOf(error) });
}

export async function withdrawReleaseAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  const release = uuidOrNull(str(fd, "release"));
  if (!course || !release) back("/studio", "paket", { ok: false, detail: "terbitan tidak dikenali" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("withdraw_release", {
    p_release: release, p_reason: str(fd, "alasan"),
  });
  back(`/studio/paket/${course}`, "paket", { ok: !error, detail: detailOf(error) });
}

export async function createRevisionAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  if (!course) back("/studio", "paket", { ok: false, detail: "paket tidak dikenali" });
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("create_course_revision", { p_course: course });
  if (error || !data) back(`/studio/paket/${course}`, "paket", { ok: false, detail: detailOf(error) });
  back(`/studio/paket/${data as string}`, "paket", { ok: true });
}

export async function moveReleaseAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  const assignment = uuidOrNull(str(fd, "assignment"));
  const release = uuidOrNull(str(fd, "release"));
  if (!course || !assignment || !release) back("/studio", "koreksi", { ok: false, detail: "data tidak lengkap" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("move_learning_assignment_release", {
    p_assignment: assignment, p_to_release: release, p_reason: str(fd, "alasan"),
  });
  back(`/studio/paket/${course}`, "koreksi", { ok: !error, detail: detailOf(error) });
}

// ------------------------------------------------------------- distribution

export async function grantDistributionAction(fd: FormData): Promise<void> {
  const release = uuidOrNull(str(fd, "release"));
  const institution = uuidOrNull(str(fd, "institution"));
  if (!release || !institution) back("/studio/kanonik", "izin", { ok: false, detail: "data tidak lengkap" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("grant_release_distribution", {
    p_release: release, p_institution: institution, p_reason: str(fd, "alasan") || null,
  });
  back("/studio/kanonik", "izin", { ok: !error, detail: detailOf(error) });
}

export async function withdrawDistributionAction(fd: FormData): Promise<void> {
  const distribution = uuidOrNull(str(fd, "distribusi"));
  if (!distribution) back("/studio/kanonik", "izin", { ok: false, detail: "izin tidak dikenali" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("withdraw_release_distribution", {
    p_distribution: distribution, p_reason: str(fd, "alasan"),
  });
  back("/studio/kanonik", "izin", { ok: !error, detail: detailOf(error) });
}

// ----------------------------------------------------------------- ingestion

/**
 * BOB-02 — A LESSON PACKAGE, IN THREE STEPS, WHICHEVER DOOR IT CAME IN BY.
 *
 *   the workbook (D-007) ─┐
 *   Unggah Mudah (JSON)  ─┼─> a batch at RECEIVED ─> prepare_ingest_batch ─> (media uploads)
 *   Paket Terstruktur    ─┘      (the table write)     problems by code,        ─> confirm_ingest_batch
 *                                                      media paths, counts          course, chapters,
 *                                                                                   lessons, questions
 *
 * The database decides everything: CAN_DRAFT, every content rule, the media
 * paths, who confirmed. These actions carry a file or a JSON text to it and
 * bring back codes, never its words (D-011).
 *
 * TWO SHAPES. The three redirect actions below keep the forms on today's
 * /studio/unggah working end to end (Bug A: a confirmation wrote 'MAPPED',
 * which is not an ingest status; Bug B: a structured package was
 * materialised before anyone confirmed it). The typed actions after them --
 * unggahBukuKerjaAksi, siapkanPaketAksi, konfirmasiPaketAksi -- return
 * HasilPaket for useActionState, for DAISY-06's file picker and row list.
 */

type Asal = "EASY_UPLOAD" | "STRUCTURED_PACKAGE";

/** A workbook file, or a JSON text, as the package the database checks. */
async function paketDari(fd: FormData): Promise<
  { ok: true; paket: unknown; asal: "WORKBOOK" | "JSON" } | { ok: false; code: KodePaket; problems?: MasalahPaket[] }
> {
  const berkas = fd.get("berkas");
  if (berkas instanceof File && berkas.size > 0) {
    if (berkas.size > BATAS.berkas) return { ok: false, code: "PACKAGE_HAS_PROBLEMS", problems: [{ code: "WORKBOOK_TOO_LARGE" }] };
    const baca = bacaBukuKerja(new Uint8Array(await berkas.arrayBuffer()));
    if (!baca.ok) return { ok: false, code: "PACKAGE_HAS_PROBLEMS", problems: [{ code: baca.code }] };
    const paket = bukuKerjaKePaket(baca.lembar);
    if (!paket.ok) return { ok: false, code: "PACKAGE_HAS_PROBLEMS", problems: paket.problems };
    return { ok: true, paket: { format: "pintar-buku-kerja/1", ...paket.paket }, asal: "WORKBOOK" };
  }
  try {
    const paket = JSON.parse(str(fd, "isi") || "{}");
    return { ok: true, paket, asal: "JSON" };
  } catch {
    return { ok: false, code: "PACKAGE_HAS_PROBLEMS", problems: [{ code: "PACKAGE_JSON_UNREADABLE" }] };
  }
}

function gagal(fn: string, error: { code?: string | null; details?: string | null; message?: string } | null): HasilPaket {
  const code = kodeGalatPaket(error);
  if (code !== "PACKAGE_FAILED") return { ok: false, code };
  const ref = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0");
  console.error(`[paket ${ref}] ${fn} failed`, error?.code, error?.message);
  return { ok: false, code, ref };
}

/** Insert the batch and prepare it: problems, media paths, counts. */
async function siapkan(fd: FormData, kind: Asal): Promise<HasilPaket> {
  const institution = uuidOrNull(str(fd, "institution") || str(fd, "institusi"));
  if (!institution) return { ok: false, code: "PACKAGE_INPUT_INVALID" };
  const paket = await paketDari(fd);
  if (!paket.ok) return { ok: false, code: paket.code, problems: paket.problems };
  const supabase = await supabaseServer();
  const { data: batch, error } = await supabase
    .from("ingest_batches")
    .insert({
      institution_id: institution, source_kind: kind, raw_payload: paket.paket,
      producer_identifier: str(fd, "produsen") || (paket.asal === "WORKBOOK" ? "pintar-buku-kerja" : null),
      capability_contract: str(fd, "kontrak") || null,
      request_id: str(fd, "permintaan") || null,
    })
    .select("id").maybeSingle();
  if (error) return gagal("ingest_batches.insert", error);
  // F-05: an insert RLS filtered to nothing is a refusal, not a success
  if (!batch) return { ok: false, code: "PACKAGE_NOT_ALLOWED" };
  const { data, error: e2 } = await supabase.rpc("prepare_ingest_batch", { p_batch: batch.id });
  if (e2 || !data) return gagal("prepare_ingest_batch", e2);
  const r = data as { ok: boolean; problems: MasalahPaket[]; media: MediaPaket[]; counts: HitunganPaket };
  return r.ok
    ? { ok: true, batch: batch.id as string, counts: r.counts, media: r.media }
    : { ok: false, code: "PACKAGE_HAS_PROBLEMS", batch: batch.id as string, problems: r.problems, media: r.media };
}

async function konfirmasi(batch: string | null): Promise<HasilPaket> {
  if (!batch) return { ok: false, code: "PACKAGE_INPUT_INVALID" };
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("confirm_ingest_batch", { p_batch: batch });
  if (error || !data) return gagal("confirm_ingest_batch", error);
  const r = data as { ok: boolean; problems?: MasalahPaket[]; media?: MediaPaket[]; counts: HitunganPaket; courses?: string[] };
  if (!r.ok) return { ok: false, code: "PACKAGE_HAS_PROBLEMS", batch, problems: r.problems, media: r.media };
  revalidatePath("/studio", "layout");
  return { ok: true, batch, counts: r.counts, media: [], courses: r.courses ?? [] };
}

/** A result, as the calm line today's page shows: codes, never the database's words. */
function ringkas(h: HasilPaket): string | undefined {
  if (h.ok) return h.batch;
  const kode = (h.problems ?? []).slice(0, 5)
    .map((p) => p.code + (p.sheet ? ` (${p.sheet}${p.row ? ` ${p.row}` : ""})` : "")).join(", ");
  return [h.code, kode, h.ref].filter(Boolean).join(": ");
}

export async function easyUploadAction(fd: FormData): Promise<void> {
  const h = await siapkan(fd, "EASY_UPLOAD");
  back("/studio/unggah", h.ok ? "pertanyaan" : "mudah", { ok: h.ok, detail: ringkas(h) });
}

export async function structuredImportAction(fd: FormData): Promise<void> {
  const h = await siapkan(fd, "STRUCTURED_PACKAGE");
  back("/studio/unggah", h.ok ? "pertanyaan" : "terstruktur", { ok: h.ok, detail: ringkas(h) });
}

export async function confirmMappingAction(fd: FormData): Promise<void> {
  const h = await konfirmasi(uuidOrNull(str(fd, "batch")));
  if (h.ok && h.courses && h.courses[0]) redirect(`/studio/paket/${h.courses[0]}`);
  back("/studio/unggah", "pertanyaan", { ok: h.ok, detail: ringkas(h) });
}

/**
 * THE TYPED CONTRACT (DAISY-06). Each is (prev, FormData) => Promise<HasilPaket>.
 *
 *   unggahBukuKerjaAksi  institusi, berkas (.xlsx, at most 5 MB)
 *   siapkanPaketAksi     institusi, isi (the package JSON)
 *   konfirmasiPaketAksi  batch
 *
 * After a successful prepare, upload each `media[].path` through
 * POST /api/assets/upload-url { path } and PUT the file to the signed URL it
 * returns; then confirm. A confirmation before every file has arrived comes
 * back as PACKAGE_HAS_PROBLEMS with MEDIA_NOT_UPLOADED for each missing file.
 */
export async function unggahBukuKerjaAksi(_prev: HasilPaket | null, fd: FormData): Promise<HasilPaket> {
  const berkas = fd.get("berkas");
  if (!(berkas instanceof File) || berkas.size === 0) return { ok: false, code: "PACKAGE_INPUT_INVALID" };
  return siapkan(fd, "EASY_UPLOAD");
}

export async function siapkanPaketAksi(_prev: HasilPaket | null, fd: FormData): Promise<HasilPaket> {
  fd.delete("berkas");
  return siapkan(fd, "STRUCTURED_PACKAGE");
}

export async function konfirmasiPaketAksi(_prev: HasilPaket | null, fd: FormData): Promise<HasilPaket> {
  return konfirmasi(uuidOrNull(str(fd, "batch")));
}

// ------------------------------------------------------------------ panels

export async function saveDefinitionAction(fd: FormData): Promise<void> {
  const supabase = await supabaseServer();
  const existing = uuidOrNull(str(fd, "definisi"));
  const payload: Record<string, unknown> = {};
  const put = (k: string, v: unknown) => { if (v !== null && v !== "" && v !== undefined) payload[k] = v; };
  put("institution_id", uuidOrNull(str(fd, "institution")));
  put("course_id", uuidOrNull(str(fd, "course")));
  put("module_id", uuidOrNull(str(fd, "module")));
  put("title", str(fd, "judul"));
  put("mode", str(fd, "mode"));
  put("bank_type", str(fd, "bank"));
  put("item_count", num(fd, "jumlah"));
  put("safety_critical_minimum", num(fd, "keselamatan"));
  put("hesitation_window_seconds", num(fd, "ragu"));
  put("late_sync_grace_seconds", num(fd, "tenggang"));
  put("attempt_limit", num(fd, "percobaan"));
  put("shuffle_policy", str(fd, "acak"));
  payload.allows_pause = str(fd, "jeda") === "on";
  payload.offline_tolerant = str(fd, "luring") === "on";
  const mix = str(fd, "komposisi");
  if (mix) { try { payload.difficulty_mix = JSON.parse(mix); } catch { /* refused below by the server */ } }
  const rules = str(fd, "kelulusan");
  if (rules) { try { payload.passing_rules = JSON.parse(rules); } catch { /* refused below by the server */ } }

  const { data, error } = await supabase.rpc("save_assessment_definition", {
    p_definition: existing, p_payload: payload,
  });
  const row = Array.isArray(data) ? data[0] : data;
  const detail = error
    ? detailOf(error)
    : row?.created_new_version
      ? "versi-baru"
      : "tetap";
  back("/studio/definisi", "definisi", { ok: !error, detail });
}

export async function recordIntegrityReviewAction(fd: FormData): Promise<void> {
  const signal = uuidOrNull(str(fd, "sinyal"));
  if (!signal) back("/studio/integritas", "integritas", { ok: false, detail: "catatan tidak dikenali" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("record_integrity_review", {
    p_signal: signal, p_decision: str(fd, "keputusan"), p_note: str(fd, "catatan") || null,
  });
  back("/studio/integritas", "integritas", { ok: !error, detail: detailOf(error) });
}

export async function recordQuestionHealthReviewAction(fd: FormData): Promise<void> {
  const item = uuidOrNull(str(fd, "soal"));
  if (!item) back("/studio/bank", "kesehatan", { ok: false, detail: "soal tidak dikenali" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("record_question_health_review", {
    p_item: item, p_decision: str(fd, "keputusan"), p_note: str(fd, "catatan") || null,
  });
  back("/studio/bank", "kesehatan", { ok: !error, detail: detailOf(error) });
}

export async function saveCertificateTemplateAction(fd: FormData): Promise<void> {
  const institution = uuidOrNull(str(fd, "institution"));
  if (!institution) back("/studio/sertifikat", "sertifikat", { ok: false, detail: "pilih sekolah" });
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("save_certificate_template", {
    p_institution: institution,
    p_course: uuidOrNull(str(fd, "course")),
    p_module: uuidOrNull(str(fd, "module")),
    p_layout: str(fd, "tata_letak"),
    p_number_prefix: str(fd, "awalan"),
  });
  back("/studio/sertifikat", "sertifikat", { ok: !error, detail: detailOf(error) });
}

// ------------------------------------------------------------ quick assessment

/**
 * One action, one RPC (ADR-0018). Every authority question — may this person
 * quick-assess this class, is this chapter theirs or authorized to them, does
 * the paper resolve to one content owner, are there enough drawable questions
 * — is the database's, asked inside `launch_quick_assessment` as the signed-in
 * user. Nothing is pre-decided here, and the refusal a teacher reads is the
 * database's own sentence.
 */
export async function launchQuickAssessmentAction(fd: FormData): Promise<void> {
  const node = uuidOrNull(str(fd, "kelas"));
  const modul = uuidOrNull(str(fd, "modul"));
  const items = num(fd, "jumlah");
  const minutes = num(fd, "menit");
  if (!node || !modul) back("/studio/kuis", "kuis", { ok: false, detail: "kelas atau bab tidak dikenali" });

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("launch_quick_assessment", {
    p_node: node, p_module: modul, p_item_count: items, p_minutes: minutes,
  });
  back("/studio/kuis", "kuis", { ok: !error, detail: detailOf(error) });
}
