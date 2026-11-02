"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { isSystemAdmin } from "@/lib/auth";
import { sekolahDari, wajibDalamKonteks } from "@/lib/konteks-server";
import { BATAS, bacaBukuKerja } from "@/lib/xlsx";
import { tenggangDetik } from "@/lib/aturan-asesmen";
import {
  bukuKerjaKePaket, kodeGalatPaket,
  type HasilPaket, type HitunganPaket, type KodePaket, type MasalahPaket, type MediaPaket,
} from "@/lib/unggah-kontrak";
import {
  KODE_HAMBATAN,
  kodeGalatTerbitan, type Hambatan, type HasilTerbitan, type KesiapanTerbit,
} from "@/lib/terbitan-kontrak";
import {
  kodeGalat, kodeGalatKonten, queryHasil, rujukan, type HasilAksi, type KodeGalat, type KodeKonten,
} from "@/lib/galat-kontrak";

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

/**
 * BOB-07 (D-011): the page is told a CODE (`kode`, and `ref` for a failure
 * nobody named), and draws its sentence from the copy table. The database's
 * own words go to the server log beside the same reference, never to the page.
 */
function back(path: string, section: string, h: HasilAksi): never {
  // a path may carry its own query (L4: the page and the row a refused edit came from), joined, never replaced
  redirect(`${path}${path.includes("?") ? "&" : "?"}${queryHasil(section, h).toString()}#${section}`);
}

/** A refusal as its code; one nobody named is logged with the reference the page shows. */
function ditolak(fn: string, error: { code?: string | null; details?: string | null; message?: string | null } | null,
                 kode: KodeGalat | KodeKonten = kodeGalat(error)): HasilAksi {
  if (kode !== "ACTION_FAILED") return { ok: false, kode };
  const ref = rujukan();
  console.error(`[studio ${ref}] ${fn} failed`, error?.code, error?.message);
  return { ok: false, kode, ref };
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
 * compares it with what it meant to touch; a shortfall is a refusal. The content step's own check now runs inside
 * the database, in the same transaction as its writes (langkah_konten, W1.13).
 */
const TIDAK_DIKENALI: HasilAksi = { ok: false, kode: "ACTION_NOT_FOUND" };
const KURANG: HasilAksi = { ok: false, kode: "ACTION_INPUT_INVALID" };

// ---------------------------------------------------------------- lifecycle

export async function advanceContentAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  const to = str(fd, "to");
  if (!course || !to) back("/studio", "paket", TIDAK_DIKENALI);
  // L3 (§2.11): the chapter is the working context's, or the chooser offers its school's (values kept)
  await wajibDalamKonteks({ sekolah: await sekolahDari("kursus", course) }, "paket");

  // W1.13 (Batch 1): the whole step (items, lessons, modules, the chapter's rules, the course) is ONE transaction in
  // the database, as the caller: `langkah_konten` makes the same writes this action used to make one request at a
  // time, with the same expectations, and a refusal or a shortfall undoes all of it. The reviewer of record is the
  // caller (APPROVED); enforce_content_status still decides every edge.
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("langkah_konten", { p_course: course, p_ke: to });
  // BOB-07: the content step's refusal, named (DAISY-06's step list shows it); a shortfall is ACTION_UNCHANGED (F-05)
  if (error) back(`/studio/paket/${course}`, "paket", ditolak("langkah_konten", error, kodeGalatKonten(error)));
  back(`/studio/paket/${course}`, "paket", { ok: true, kode: "STEP_TAKEN" });
}

/**
 * W1.6 (Batch 3 screen): THE REVIEWER SENDS THE PACKAGE BACK TO ITS AUTHOR, with a reason. One database function,
 * `kembalikan_paket` (20261214100000), as the signed-in reviewer: CAN_REVIEW in the school, not the author, the
 * package in review, a reason of 10 to 1000 characters; it records the outcome, steps the whole tree back in one
 * transaction and audits it. Typed for useActionState (the in-page confirmation keeps the reason typed into it when
 * the answer is a refusal): a refusal is its code (KODE_KEMBALI), never the database's words.
 */
export async function kembalikanPaketAksi(_prev: HasilAksi | null, fd: FormData): Promise<HasilAksi> {
  const course = uuidOrNull(str(fd, "course"));
  if (!course) return TIDAK_DIKENALI;
  await wajibDalamKonteks({ sekolah: await sekolahDari("kursus", course) }, "paket");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("kembalikan_paket", { p_course: course, p_alasan: str(fd, "alasan") });
  // a refusal of the step it takes inside (enforce_content_status) is named as a content step's is
  if (error) return ditolak("kembalikan_paket", error, kodeGalatKonten(error));
  revalidatePath("/studio", "layout");
  return { ok: true, kode: "SENT_BACK" };
}

export async function runValidationAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  if (!course) back("/studio", "paket", TIDAK_DIKENALI);
  await wajibDalamKonteks({ sekolah: await sekolahDari("kursus", course) }, "temuan");
  const supabase = await supabaseServer();
  const a = await supabase.rpc("validate_course_content", { p_course: course });
  if (a.error) back(`/studio/paket/${course}`, "temuan", ditolak("validate_course_content", a.error));
  const b = await supabase.rpc("run_mcq_quality", { p_course: course });
  if (b.error) back(`/studio/paket/${course}`, "temuan", ditolak("run_mcq_quality", b.error));
  back(`/studio/paket/${course}`, "temuan", { ok: true, kode: "CHECK_RUN" });
}

export async function acknowledgeFindingAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  const finding = uuidOrNull(str(fd, "finding"));
  const kind = str(fd, "kind");
  if (!course || !finding) back("/studio", "temuan", TIDAK_DIKENALI);
  await wajibDalamKonteks({ sekolah: await sekolahDari("kursus", course) }, "temuan");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("acknowledge_finding", {
    p_kind: kind, p_finding: finding, p_note: str(fd, "catatan") || null,
  });
  back(`/studio/paket/${course}`, "temuan", error ? ditolak("acknowledge_finding", error) : { ok: true, kode: "FINDING_ACKNOWLEDGED" });
}

/** The most findings one group press acknowledges: more than a chapter's check writes, so a forged post stays bounded. */
const TEMUAN_SEKALIGUS_MAKS = 500;

/**
 * W1.5 (Batch 3; UX-01): ONE KIND OF FINDING, ACKNOWLEDGED AS A GROUP. The question check writes one finding per
 * question (28 «Tidak satu pun pengecoh tertaut ke miskonsepsi» for one chapter on staging), and the reviewer pressed
 * «Sudah saya tinjau» 28 times. The group (src/components/studio/TemuanKelompok.tsx) sends every finding of its kind
 * with one note, and this calls the SAME database function once per finding, as the reviewer: acknowledge_finding
 * still decides each one (CAN_REVIEW in the owning school, never the content's author, a WARNING only, not yet
 * acknowledged) and writes each its own audit row. No new path to the tables, no migration.
 *
 * Each acknowledgement is its own transaction, as it was one press at a time. A refusal stops the group at that
 * finding and says why; the ones before it stay acknowledged (each audited), and the rest stay on the page.
 */
export async function acknowledgeFindingsGroupAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  const kind = str(fd, "kind");
  const semua = fd.getAll("finding").map((v) => uuidOrNull(String(v)));
  const findings = [...new Set(semua.filter((f): f is string => f !== null))];
  if (!course || findings.length === 0 || findings.length !== semua.length) back("/studio", "temuan", TIDAK_DIKENALI);
  if (findings.length > TEMUAN_SEKALIGUS_MAKS) back(`/studio/paket/${course}`, "temuan", KURANG);
  await wajibDalamKonteks({ sekolah: await sekolahDari("kursus", course) }, "temuan");
  const supabase = await supabaseServer();
  const catatan = str(fd, "catatan") || null;
  let n = 0;
  for (const finding of findings) {
    const { error } = await supabase.rpc("acknowledge_finding", { p_kind: kind, p_finding: finding, p_note: catatan });
    if (error) back(`/studio/paket/${course}`, "temuan", ditolak("acknowledge_finding", error));
    n++;
  }
  back(`/studio/paket/${course}`, "temuan", { ok: true, kode: "FINDINGS_ACKNOWLEDGED", n });
}

// ---------------------------------------------------------------- releases
//
// BOB-03. Every step is one database function (create_release,
// freeze_release, publish_release, withdraw_release); the database decides
// who may take it, from which state, and refuses with a PR040 code. Nothing
// here writes plp_releases itself.

function gagalTerbitan(fn: string, error: { code?: string | null; details?: string | null; message?: string } | null,
                       release?: string): HasilTerbitan {
  const code = kodeGalatTerbitan(error);
  if (code !== "RELEASE_FAILED") return { ok: false, code, release };
  const ref = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0");
  console.error(`[terbitan ${ref}] ${fn} failed`, error?.code, error?.message);
  return { ok: false, code, release, ref };
}

async function buatTerbitan(course: string | null): Promise<HasilTerbitan> {
  await wajibDalamKonteks({ sekolah: await sekolahDari("kursus", course) });
  if (!course) return { ok: false, code: "RELEASE_INPUT_INVALID" };
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("create_release", { p_course: course });
  if (error || !data) return gagalTerbitan("create_release", error);
  const r = data as { release: string; version_label: string };
  revalidatePath("/studio", "layout");
  return { ok: true, release: r.release, status: "INGESTED", versi: r.version_label };
}

async function kunciTerbitan(release: string | null): Promise<HasilTerbitan> {
  await wajibDalamKonteks({ sekolah: await sekolahDari("terbitan", release) });
  if (!release) return { ok: false, code: "RELEASE_INPUT_INVALID" };
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("freeze_release", { p_release: release });
  if (error || !data) return gagalTerbitan("freeze_release", error, release);
  const r = data as { ok: boolean; readiness: KesiapanTerbit; blockers: Hambatan[] | null };
  revalidatePath("/studio", "layout");
  // a blocked course is not sealed: the result carries why, and the findings
  // the validators just wrote are on the package page
  if (!r.ok) {
    // DAISY-16: a blocker code the catalogue does not know is logged under a
    // reference the Terbit step shows beside the general line; the code itself
    // never reaches the page
    const hambatan = r.blockers ?? [];
    const asing = hambatan.filter((x) => !(KODE_HAMBATAN as readonly string[]).includes(x?.code));
    const ref = asing.length > 0 ? rujukan() : undefined;
    if (ref) console.error(`[studio ${ref}] freeze_release returned blocker code(s) the catalogue does not know`, asing.map((x) => x?.code));
    return { ok: false, code: "RELEASE_NOT_READY", release, kesiapan: r.readiness, hambatan, ref };
  }
  return { ok: true, release, status: "FROZEN", kesiapan: r.readiness, hambatan: r.blockers ?? [] };
}

async function terbitkan(release: string | null): Promise<HasilTerbitan> {
  await wajibDalamKonteks({ sekolah: await sekolahDari("terbitan", release) });
  if (!release) return { ok: false, code: "RELEASE_INPUT_INVALID" };
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("publish_release", { p_release: release });
  if (error) return gagalTerbitan("publish_release", error, release);
  revalidatePath("/studio", "layout");
  revalidatePath("/mengajar", "layout");
  return { ok: true, release, status: "PUBLISHED" };
}

async function tarikTerbitan(release: string | null, alasan: string): Promise<HasilTerbitan> {
  await wajibDalamKonteks({ sekolah: await sekolahDari("terbitan", release) });
  if (!release) return { ok: false, code: "RELEASE_INPUT_INVALID" };
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("withdraw_release", { p_release: release, p_reason: alasan });
  if (error) return gagalTerbitan("withdraw_release", error, release);
  revalidatePath("/studio", "layout");
  revalidatePath("/mengajar", "layout");
  return { ok: true, release, status: "SUPERSEDED" };
}

/**
 * THE TYPED CONTRACT (DAISY-06; src/lib/terbitan-kontrak.ts, LANGKAH_TERBITAN).
 * Each takes (prev, FormData) and resolves to a HasilTerbitan.
 *
 *   buatTerbitanAksi   course            APPROVED course → release INGESTED
 *   kunciTerbitanAksi  release           → FROZEN, or RELEASE_NOT_READY with blockers
 *   terbitkanAksi      release           FROZEN → PUBLISHED (READY only)
 *   tarikTerbitanAksi  release, alasan   PUBLISHED → SUPERSEDED
 */
export async function buatTerbitanAksi(_prev: HasilTerbitan | null, fd: FormData): Promise<HasilTerbitan> {
  return buatTerbitan(uuidOrNull(str(fd, "course")));
}

export async function kunciTerbitanAksi(_prev: HasilTerbitan | null, fd: FormData): Promise<HasilTerbitan> {
  return kunciTerbitan(uuidOrNull(str(fd, "release")));
}

export async function terbitkanAksi(_prev: HasilTerbitan | null, fd: FormData): Promise<HasilTerbitan> {
  return terbitkan(uuidOrNull(str(fd, "release")));
}

export async function tarikTerbitanAksi(_prev: HasilTerbitan | null, fd: FormData): Promise<HasilTerbitan> {
  return tarikTerbitan(uuidOrNull(str(fd, "release")), str(fd, "alasan"));
}

export async function createRevisionAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  if (!course) back("/studio", "paket", TIDAK_DIKENALI);
  await wajibDalamKonteks({ sekolah: await sekolahDari("kursus", course) }, "revisi");
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("create_course_revision", { p_course: course });
  if (error || !data) back(`/studio/paket/${course}`, "revisi", ditolak("create_course_revision", error));
  back(`/studio/paket/${data as string}`, "paket", { ok: true, kode: "REVISION_CREATED" });
}

export async function moveReleaseAction(fd: FormData): Promise<void> {
  const course = uuidOrNull(str(fd, "course"));
  const assignment = uuidOrNull(str(fd, "assignment"));
  const release = uuidOrNull(str(fd, "release"));
  if (!course || !assignment || !release) back("/studio", "koreksi", KURANG);
  await wajibDalamKonteks({ sekolah: await sekolahDari("kursus", course) }, `koreksi-${assignment}`);
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("move_learning_assignment_release", {
    p_assignment: assignment, p_to_release: release, p_reason: str(fd, "alasan"),
  });
  back(`/studio/paket/${course}`, "koreksi", error ? ditolak("move_learning_assignment_release", error) : { ok: true, kode: "ASSIGNMENT_MOVED" });
}

// ------------------------------------------------------------- distribution

export async function grantDistributionAction(fd: FormData): Promise<void> {
  const release = uuidOrNull(str(fd, "release"));
  const institution = uuidOrNull(str(fd, "institution"));
  if (!release || !institution) back("/studio/kanonik", "izin", KURANG);
  // L3 (§2.11, C7): giving the library is the library's act, in Pustaka PINTAR's context; the school is named here
  await wajibDalamKonteks({ sekolah: await sekolahDari("terbitan", release) }, "izin-beri");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("grant_release_distribution", {
    p_release: release, p_institution: institution, p_reason: str(fd, "alasan") || null,
  });
  back("/studio/kanonik", "izin", error ? ditolak("grant_release_distribution", error) : { ok: true, kode: "DISTRIBUTION_GRANTED" });
}

export async function withdrawDistributionAction(fd: FormData): Promise<void> {
  const distribution = uuidOrNull(str(fd, "distribusi"));
  if (!distribution) back("/studio/kanonik", "izin", TIDAK_DIKENALI);
  {
    const { data: izin } = await (await supabaseServer()).from("release_distributions").select("plp_release_id").eq("id", distribution).limit(1);
    await wajibDalamKonteks({ sekolah: await sekolahDari("terbitan", (izin?.[0] as { plp_release_id?: string } | undefined)?.plp_release_id) }, "izin-tarik");
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("withdraw_release_distribution", {
    p_distribution: distribution, p_reason: str(fd, "alasan"),
  });
  back("/studio/kanonik", "izin", error ? ditolak("withdraw_release_distribution", error) : { ok: true, kode: "DISTRIBUTION_WITHDRAWN" });
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
  // L3 (§2.11; D-127 Q11): an upload is aimed at the working context's own place, never an unnamed or unintended one
  await wajibDalamKonteks({ sekolah: institution }, kind === "STRUCTURED_PACKAGE" ? "terstruktur" : "mudah");
  if (!institution) return { ok: false, code: "PACKAGE_INPUT_INVALID" };
  // D-085 M10: a correction names the course it corrects and says what changed; the database checks both
  // (package_revision_problems). A value that is not a course reference is refused, never dropped into a new course.
  const revisi = uuidOrNull(str(fd, "revisi"));
  if (str(fd, "revisi") && !revisi) return { ok: false, code: "PACKAGE_INPUT_INVALID" };
  const paket = await paketDari(fd);
  if (!paket.ok) return { ok: false, code: paket.code, problems: paket.problems };
  // CR-87 (D-127 Q7): the JSON package is the platform operator's alone; a school's people send the workbook
  if (paket.asal === "JSON" && !(await isSystemAdmin())) return { ok: false, code: "PACKAGE_NOT_ALLOWED" };
  const supabase = await supabaseServer();
  const { data: batch, error } = await supabase
    .from("ingest_batches")
    .insert({
      institution_id: institution, source_kind: kind, raw_payload: paket.paket,
      revises_course_id: revisi, change_summary: revisi ? str(fd, "ringkasan").slice(0, 4000) || null : null,
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
  await wajibDalamKonteks({ sekolah: await sekolahDari("batch", batch) }, "pertanyaan");
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
function ringkas(h: HasilPaket): HasilAksi {
  if (h.ok) return { ok: true };
  return { ok: false, kode: h.code, ref: h.ref,
           masalah: (h.problems ?? []).slice(0, 5).map((p) => ({ code: p.code, sheet: p.sheet, row: p.row })) };
}

export async function easyUploadAction(fd: FormData): Promise<void> {
  const h = await siapkan(fd, "EASY_UPLOAD");
  back("/studio/unggah", h.ok ? "pertanyaan" : "mudah", ringkas(h));
}

export async function structuredImportAction(fd: FormData): Promise<void> {
  const h = await siapkan(fd, "STRUCTURED_PACKAGE");
  back("/studio/unggah", h.ok ? "pertanyaan" : "terstruktur", ringkas(h));
}

export async function confirmMappingAction(fd: FormData): Promise<void> {
  const h = await konfirmasi(uuidOrNull(str(fd, "batch")));
  // BOB-19 (coordinator, 28 Sep): the new course's page says the package was made
  if (h.ok && h.courses && h.courses[0]) back(`/studio/paket/${h.courses[0]}`, "paket", { ok: true, kode: "DRAFT_CREATED" });
  back("/studio/unggah", "pertanyaan", ringkas(h));
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
  // CR-84 (4): the school is the chapter's own, never a second choice that could disagree with it (INV-13)
  const course = uuidOrNull(str(fd, "course"));
  if (!existing && !course) back("/studio/definisi", "definisi", KURANG);
  if (existing && !course) await wajibDalamKonteks({ sekolah: await sekolahDari("definisi", existing) }, "definisi");
  if (course) {
    const { data: bab } = await supabase.from("courses").select("institution_id").eq("id", course).maybeSingle();
    if (!bab) back("/studio/definisi", "definisi", TIDAK_DIKENALI);
    await wajibDalamKonteks({ sekolah: bab.institution_id as string }, "definisi");
    put("institution_id", bab.institution_id);
  }
  put("course_id", course);
  put("module_id", uuidOrNull(str(fd, "module")));
  put("title", str(fd, "judul"));
  put("mode", str(fd, "mode"));
  put("bank_type", str(fd, "bank"));
  put("item_count", num(fd, "jumlah"));
  put("safety_critical_minimum", num(fd, "keselamatan"));
  put("hesitation_window_seconds", num(fd, "ragu"));
  // W1.3 (RV-14): Aturan Asesmen asks the send grace in minutes; the database keeps seconds (a hand-made post's
  // seconds, `tenggang`, as before). The server's bounds decide either way.
  put("late_sync_grace_seconds", tenggangDetik(num(fd, "tenggang_menit"), num(fd, "tenggang")));
  put("attempt_limit", num(fd, "percobaan"));
  put("shuffle_policy", str(fd, "acak"));
  payload.allows_pause = str(fd, "jeda") === "on";
  payload.offline_tolerant = str(fd, "luring") === "on";
  // L4 (CR-85): one number per difficulty band; a band left empty is not in the mix (the server checks the rest)
  const mix: Record<string, number> = {};
  for (const b of ["MUDAH", "SEDANG", "SULIT"]) { const n = num(fd, `komposisi_${b}`); if (n !== null) mix[b] = n; }
  if (Object.keys(mix).length > 0) payload.difficulty_mix = mix;
  // FD-9: no passing rule is taken here; a definition's passing rule is no longer read for a verdict, the school's
  // own pass mark is (20261102100000; D-081, D-088(b))

  const { data, error } = await supabase.rpc("save_assessment_definition", {
    p_definition: existing, p_payload: payload,
  });
  const row = Array.isArray(data) ? data[0] : data;
  // L4 (CR-88, CR-84 (3)): a row's edit returns to its own page; a refused edit also reopens that row, so the form whose
  // typed values SimpanIsian gives back is there. A saved edit opens no row (a new version leaves the old one listed).
  // A new rule returns to the first page.
  const hal = Number(str(fd, "hal"));
  const kembali = existing
    ? `/studio/definisi?${new URLSearchParams({
      hal: String(Number.isInteger(hal) && hal >= 1 ? hal : 1), ...(error ? { ubah: existing } : {}),
    }).toString()}`
    : "/studio/definisi";
  back(kembali, "definisi", error
    ? ditolak("save_assessment_definition", error, kodeGalatKonten(error))
    : { ok: true, kode: row?.created_new_version ? "DEFINITION_NEW_VERSION" : "DEFINITION_KEPT" });
}

export async function recordIntegrityReviewAction(fd: FormData): Promise<void> {
  const signal = uuidOrNull(str(fd, "sinyal"));
  if (!signal) back("/studio/integritas", "integritas", TIDAK_DIKENALI);
  await wajibDalamKonteks({ sekolah: await sekolahDari("sinyal", signal) }, "integritas");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("record_integrity_review", {
    p_signal: signal, p_decision: str(fd, "keputusan"), p_note: str(fd, "catatan") || null,
  });
  back("/studio/integritas", "integritas", error ? ditolak("record_integrity_review", error) : { ok: true, kode: "REVIEW_RECORDED" });
}

export async function recordQuestionHealthReviewAction(fd: FormData): Promise<void> {
  const item = uuidOrNull(str(fd, "soal"));
  if (!item) back("/studio/bank", "kesehatan", TIDAK_DIKENALI);
  await wajibDalamKonteks({ sekolah: await sekolahDari("soal", item) }, "kesehatan");
  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("record_question_health_review", {
    p_item: item, p_decision: str(fd, "keputusan"), p_note: str(fd, "catatan") || null,
  });
  back("/studio/bank", "kesehatan", error ? ditolak("record_question_health_review", error) : { ok: true, kode: "REVIEW_RECORDED" });
}

// CR-84 (D-127 Q4): Studio's own Uji Cepat launcher and its certificate layout picker left the human UI with their
// pages. The one human Uji Cepat journey is the class's own (/mengajar/[kelas]/uji-cepat, D-085 T2), which launches
// through launch_selected_quick_assessment and so through launch_quick_assessment, kept with its proofs. The
// certificate is the one frozen design (CR-06, D-073(b)), and its number the holder's own (D-120 Q1): Studio had
// nothing left to set there; save_certificate_template stays in the database.
