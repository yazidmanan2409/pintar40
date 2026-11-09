import { targetKelasDari } from "@/lib/target-kelas";
import "server-only";
import { bagianJakarta } from "@/lib/tanggal";
import { supabaseServer } from "@/lib/supabase/server";
import { alamatPilih } from "@/lib/konteks";
import { susunHasilUjiCepat, type HasilUjiCepat, type SesiHasil } from "@/lib/hasil-ujicepat";
import { alihkan, jalurIni, konteksHalaman, tempatSaya } from "@/lib/konteks-server";
import {
  kelasDalamLingkup, nodeLingkup,
  type Hibah, type KelasMengajar, type Simpul,
} from "@/lib/mengajar";

/**
 * THE EDUCATOR DATA LAYER — UX-1 Slice 3.
 *
 * What the learner cycle has in `src/lib/assessment-engine`, the educator
 * surface has here: one module the routes call, and no route reaching past it
 * into a table on its own. Unlike the engine this one reads TABLES as well as
 * RPCs, because most of what an educator may see is RLS-bounded SELECT rather
 * than a SECURITY DEFINER function — so the client type carries both.
 *
 * IT HOLDS NO PRIVILEGE. Every read is the caller's own session under RLS, and
 * nothing here imports the service-role client. Where authorization is
 * institution-wide rather than node-bound (V2 — assignment reads and writes,
 * session and result reads, `metric_evaluate`, `extend_session_deadline`), this
 * module NARROWS THE QUERY to the selected class and the surfaces say "selected",
 * never "yours". The narrowing is a presentation choice made in Postgres, and no
 * copy in Slice 3 claims it is an authorization boundary.
 *
 * WHAT IS DELIBERATELY ABSENT, and stays absent:
 *   - per-item responses. `responses_select` and `presented_items_select` are
 *     CAN_REVIEW_INTEGRITY only and an EDUCATOR does not hold it; the service
 *     statistics views are revoked from `authenticated` outright. Nothing here
 *     reads them, and no screen promises them.
 *   - question health and integrity signals. Those belong to the Head of
 *     Department, and the educator surface names the omission rather than
 *     reconstructing it from a different table.
 *   - per-learner mastery. `assessment_results` IS readable to a holder of
 *     CAN_VIEW_LEARNER_RESULT over the node the evidence was produced in --
 *     since R6 that is an organizational reach, not an institution-wide one,
 *     and an educator's reach is the classes they are assigned. This module
 *     never selects it either way: a class number computed here would be a
 *     number that reached a screen without passing through the metric
 *     catalogue, which is the failure migration 0072 was written to close.
 */

export type StaffClient = {
  from(table: string): {
    select(columns?: string, options?: { count?: "exact"; head?: boolean }): never;
  };
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

export class PengajarError extends Error {}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = any;

async function db(): Promise<Db> {
  return (await supabaseServer()) as unknown as Db;
}

function rows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

// ═══════════════════════════════════════════════════ 1. the teaching context

export type Konteks = {
  kelas: KelasMengajar[];
  /** The scope nodes the grants point at. Presentation never shows these. */
  lingkup: string[];
  institusi: { id: string; nama: string } | null;
  periode: string | null;
};

/**
 * The classes in this educator's teaching scope.
 *
 * Two reads, and the difference between them is the whole point:
 *
 *   1. `role_assignments` UNDER RLS, narrowed to this person. That read is
 *      authorization-bounded — the set of grants cannot be widened by the
 *      caller. It is narrowed to self because the policy also admits an
 *      INSTITUTION_ADMIN reading other people's grants over their scope, and
 *      another person's grant is not this person's teaching context.
 *   2. `org_nodes` filtered IN POSTGRES by `jalur` overlap with those grants.
 *      That read is institution-wide under RLS and the overlap is a query
 *      predicate, not a boundary. `kelasDalamLingkup` then re-checks every row
 *      and throws if one escaped, so a regression in the filter is an error
 *      rather than a stranger's class on the screen.
 */
export async function konteks(): Promise<Konteks> {
  const c = await db();
  const { data: me } = await c.rpc("current_person_id");
  if (!me) return { kelas: [], lingkup: [], institusi: null, periode: null };

  // L3 (CR-83; D-132 C2): THE CLASSES OF THE WORKING CONTEXT. Mengajar · a school shows that school's classes from
  // the person's TEACHING appointments there (Guru; Kepala departemen, HOD-08), never from administrative authority:
  // an Admin sekolah's grant at the school's root no longer brings every class in. No context that serves Mengajar,
  // no classes. An evaluation persona keeps the pre-L3 reading (C10). The database decides every act either way.
  const kh = await konteksHalaman();
  if (kh === null || (kh !== "TANPA_KONTEKS" && (kh.tujuan !== "MENGAJAR" || kh.tempat === null))) {
    return { kelas: [], lingkup: [], institusi: null, periode: null };
  }

  const { data: hibah } = await c
    .from("role_assignments")
    .select("role, scope_node_id, institution_id, valid_from, valid_until, revoked_at")
    .eq("person_id", me);

  const mengajar = kh === "TANPA_KONTEKS"
    ? rows<Hibah>(hibah)
    : rows<Hibah & { role?: string }>(hibah).filter((h) =>
        // the pair's roles are the database's: exactly the teaching appointments that give Mengajar here
        h.institution_id === kh.tempat && typeof h.role === "string" && kh.peran.includes(h.role));
  const lingkup = nodeLingkup(mengajar);
  if (lingkup.length === 0) return { kelas: [], lingkup: [], institusi: null, periode: null };

  const { data: simpul } = await c
    .from("org_nodes")
    .select("id, name, kind, jalur, is_active, institution_id, academic_period_id, member_kind")
    .eq("kind", "CLASS")
    .overlaps("jalur", lingkup);

  const kelas = kelasDalamLingkup(rows<Simpul>(simpul), lingkup);
  // the school named is the context's own; every class listed is in it (L3: no longer the first class's school)
  const institusiId = kh === "TANPA_KONTEKS" ? kelas[0]?.institusi ?? null : kh.tempat;

  let institusi: Konteks["institusi"] = null;
  let periode: string | null = null;
  if (institusiId) {
    const [inst, per] = await Promise.all([
      c.from("institutions").select("id, name").eq("id", institusiId).limit(1),
      kelas[0]?.periode
        ? c.from("academic_periods").select("name").eq("id", kelas[0].periode).limit(1)
        : Promise.resolve({ data: [] }),
    ]);
    const i = rows<{ id: string; name: string }>(inst.data)[0];
    if (i) institusi = { id: i.id, nama: i.name };
    periode = rows<{ name: string }>(per.data)[0]?.name ?? null;
  }
  return { kelas, lingkup, institusi, periode };
}

/**
 * Resolve one class of the teaching context.
 *
 * Returns null for a class that is not in it — which covers "not in your scope"
 * and "does not exist" identically, so a hand-edited URL and a typo arrive at
 * the same refusal. A slug is not an existence oracle (S0.6), and the refusal
 * page has no slot for a reason precisely so that it cannot become one.
 */
export async function kelas(id: string): Promise<{ konteks: Konteks; ini: KelasMengajar } | null> {
  const k = await konteks();
  const ini = k.kelas.find((x) => x.id === id);
  if (ini) return { konteks: k, ini };
  // L3 (§2.6, §2.11): a class of another school this person teaches is never opened, or acted on, in this context,
  // and the context is never switched silently: the chooser offers that school's Mengajar and continues here.
  // Anything else is the same refusal as before: a slug is not an existence oracle.
  if (/^[0-9a-f-]{36}$/.test(id)) {
    const { data } = await (await db()).from("org_nodes").select("institution_id").eq("id", id).eq("kind", "CLASS").limit(1);
    const sekolah = rows<{ institution_id: string }>(data)[0]?.institution_id;
    if (sekolah && (await tempatSaya()).some((p) => p.tujuan === "MENGAJAR" && p.tempat === sekolah)) {
      await alihkan(alamatPilih({ untuk: "MENGAJAR", tempat: sekolah, alasan: "lain", lanjut: await jalurIni() }));
    }
  }
  return null;
}

// ═════════════════════════════════════════════════════ 2. one class's facts

export type Murid = { id: string; nama: string };
export type FaktaKelas = {
  mapel: string | null;
  murid: Murid[];
  /** When the roster last changed: `max(memberships.valid_from)` over open rows. */
  rosterBerubah: string | null;
};

/**
 * The class's subject and its roster.
 *
 * THE ROSTER IS THE ONE SET ON THIS SURFACE THE DATABASE ITSELF BOUNDS.
 * `memberships_select` admits `has_scope('EDUCATOR', node_id)` and
 * `persons_select` goes through `person_visible_to_me()`, whose educator branch
 * is the same subtree containment — so a learner outside this educator's grants
 * does not come back at all. There is no redaction and no placeholder, because
 * there is no row to redact.
 *
 * `classes` IS KEYED ON `node_id`. It has no `id` and no `name`: the name lives
 * on the org node, and the class row carries the subject and the lifecycle
 * status. The Slice-0 scope picker asked it for `id, name` and got neither,
 * which is the defect this slice's reconciliation surfaced.
 */
export async function faktaKelas(nodeId: string): Promise<FaktaKelas> {
  const c = await db();
  const [kls, anggota] = await Promise.all([
    c.from("classes").select("node_id, subject, status").eq("node_id", nodeId).limit(1),
    c
      .from("memberships")
      .select("valid_from, enrollment:enrollments(person:persons(id, display_name))")
      .eq("node_id", nodeId)
      .is("valid_to", null),
  ]);

  type Baris = {
    valid_from: string | null;
    enrollment: { person: { id: string; display_name: string } | null } | null;
  };
  const daftar = rows<Baris>(anggota.data);

  const murid: Murid[] = [];
  const seen = new Set<string>();
  for (const b of daftar) {
    const p = b.enrollment?.person;
    if (!p || seen.has(p.id)) continue;
    seen.add(p.id);
    murid.push({ id: p.id, nama: p.display_name });
  }
  // Alphabetical, and that is the only order. There is no ranking to offer and
  // no "needs attention first": either would be a judgment the contract cannot
  // support and the ruling forbids.
  murid.sort((a, b) => a.nama.localeCompare(b.nama, "id"));

  const berubah = daftar
    .map((b) => b.valid_from)
    .filter((x): x is string => Boolean(x))
    .sort()
    .pop() ?? null;

  return {
    mapel: rows<{ subject: string }>(kls.data)[0]?.subject ?? null,
    murid,
    rosterBerubah: berubah,
  };
}

// ═══════════════════════════════════════════ 3. material, released and given

export type Terbitan = {
  id: string;
  courseId: string;
  kursus: string;
  versi: string;
  terbitPada: string | null;
  pelajaran: number;
  /** D-085 M6: the school's own material, or PINTAR's standard material distributed to the school */
  asal: "SEKOLAH" | "PINTAR";
};

export type Penugasan = {
  id: string;
  courseId: string;
  releaseId: string;
  kursus: string;
  status: string;
  mulai: string | null;
  sampai: string | null;
  /** The window has closed. Read here so no component consults a clock. */
  berakhir: boolean;
  /** W16: the window has not opened yet (a future «Mulai»). */
  belumMulai: boolean;
};

/**
 * Published releases this school may teach, newest first. BOB-43: given a class, only those that class may be given --
 * the database answers which (releases_matching_place), so this file never compares a release with a place itself.
 */
export async function terbitan(institusi: string, kelas?: string): Promise<Terbitan[]> {
  const c = await db();
  const { data } = await c
    .from("plp_releases")
    .select("id, course_id, version_label, published_at, status, course:courses(title, subject)")
    .eq("institution_id", institusi)
    // PUBLISHED only: a withdrawn release (SUPERSEDED) keeps its published_at
    // and must never be offered for a new assignment (BOB-03)
    .eq("status", "PUBLISHED")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  type Baris = {
    id: string; course_id: string; version_label: string; published_at: string | null;
    course: { title: string; subject: string } | null;
  };
  const sekolah: Terbitan[] = rows<Baris>(data).map((r) => ({
    id: r.id,
    courseId: r.course_id,
    kursus: r.course?.title ?? "",
    versi: r.version_label,
    terbitPada: r.published_at,
    pelajaran: 0,
    asal: "SEKOLAH",
  }));
  // D-085 M10: new learning uses the current release -- of each line of corrections, the newest published one
  const out = terbaruPerGaris(sekolah, await garisSekolah(institusi));
  // D-085 M6: PINTAR's standard material is prepared once and distributed to the school; the teacher sees it beside
  // the school's own, its origin said. `distributed_releases` answers the school's staff only (CAN_ASSIGN_LEARNING or
  // CAN_DRAFT where it is distributed), and assign_release decides again whether it may be given.
  const { data: dist } = await c.rpc("distributed_releases");
  const semua = [...out, ...pintarDariDistribusi(rows<Distribusi>(dist), institusi)];
  if (!kelas || semua.length === 0) return semua;
  return cocokKelas(kelas, semua);
}

/**
 * UX-37: the releases each of several classes may be given, from ONE read of the school's releases and one
 * releases_matching_place per class (the database decides each fit, as `terbitan(institusi, kelas)` asks it).
 */
export async function terbitanKelas(institusi: string, kelasIds: readonly string[]): Promise<Map<string, Terbitan[]>> {
  const out = new Map<string, Terbitan[]>();
  if (kelasIds.length === 0) return out;
  const semua = await terbitan(institusi);
  await Promise.all(kelasIds.map(async (k) => { out.set(k, semua.length === 0 ? [] : await cocokKelas(k, semua)); }));
  return out;
}

/** BOB-43: of these releases, the ones this class may be given, as the database answers. */
async function cocokKelas(kelas: string, semua: Terbitan[]): Promise<Terbitan[]> {
  const c = await db();
  const { data: cocok, error } = await c.rpc("releases_matching_place", { p_node: kelas, p_releases: semua.map((t) => t.id) });
  // unread is none offered: assign_release would refuse a mismatch anyway, and offering it would be the lie
  if (error) return [];
  const boleh = new Set(rows<string | { releases_matching_place: string }>(cocok)
    .map((r) => (typeof r === "string" ? r : r.releases_matching_place)));
  return semua.filter((t) => boleh.has(t.id));
}

/**
 * D-085 M10: each of the school's courses mapped to the first course of its line (the one that supersedes nothing).
 * A correction is a new course superseding the one it corrects (ADR-0016), so the line is what a teacher means by
 * "this chapter". Read under the reader's own row security (CAN_DRAFT in the school).
 */
export async function garisSekolah(institusi: string): Promise<Map<string, string>> {
  const c = await db();
  const { data } = await c.from("courses").select("id, supersedes_course_id").eq("institution_id", institusi);
  return akarGaris(rows<{ id: string; supersedes_course_id: string | null }>(data));
}

/** Pure: each course's line root, following supersedes_course_id upwards (a broken or cyclic pointer stops the walk). */
export function akarGaris(kursus: ReadonlyArray<{ id: string; supersedes_course_id: string | null }>): Map<string, string> {
  const induk = new Map(kursus.map((k) => [k.id, k.supersedes_course_id]));
  const akar = new Map<string, string>();
  for (const k of kursus) {
    let kini = k.id;
    const lewat = new Set<string>([kini]);
    for (let atas = induk.get(kini); atas && !lewat.has(atas); atas = induk.get(kini)) {
      kini = atas;
      lewat.add(kini);
    }
    akar.set(k.id, kini);
  }
  return akar;
}

/** Pure: of each line, only its newest published release, in the list's own order (M10: new learning uses the current). */
export function terbaruPerGaris<T extends { courseId: string; terbitPada: string | null }>(daftar: readonly T[], akar: ReadonlyMap<string, string>): T[] {
  const garis = (t: T) => akar.get(t.courseId) ?? t.courseId;
  const terbaru = new Map<string, T>();
  for (const t of daftar) {
    const kini = terbaru.get(garis(t));
    if (!kini || String(t.terbitPada ?? "") > String(kini.terbitPada ?? "")) terbaru.set(garis(t), t);
  }
  return daftar.filter((t) => terbaru.get(garis(t)) === t);
}

/**
 * D-085 M10: the courses a corrected workbook may name -- locked (FROZEN, PUBLISHED or SUPERSEDED, by the course's
 * own status or a release's, as content_is_sealed reads it) and the newest of their line, so a line never forks. The
 * database decides (package_revision_problems); this only offers what it would accept. Pure.
 *
 * W1.6 (Batch 3): a draft a reviewer sent back (VALIDATION_FAILED, the send-back's state) is corrected in its line
 * too, as package_revision_problems now accepts (paket_dikembalikan, 20261214100000), so the package page's «Unggah
 * buku kerja perbaikan» lands on it here. The database still checks that a reviewer sent it back.
 */
export function bisaDikoreksi<K extends { id: string; supersedes_course_id: string | null; status: string }>(
  kursus: readonly K[], rilis: ReadonlyArray<{ course_id: string; status: string }>,
): K[] {
  const tersegel = (st: string) => st === "FROZEN" || st === "PUBLISHED" || st === "SUPERSEDED";
  const dikoreksi = new Set(kursus.map((k) => k.supersedes_course_id).filter(Boolean));
  const rilisTersegel = new Set(rilis.filter((r) => tersegel(r.status)).map((r) => r.course_id));
  return kursus.filter((k) => !dikoreksi.has(k.id)
    && (tersegel(k.status) || rilisTersegel.has(k.id) || k.status === "VALIDATION_FAILED"));
}

type Distribusi = {
  plp_release_id: string; version_label: string; published_at: string | null; course_id: string; course_title: string;
  consuming_institution_id: string; distribution_status: string; supersedes_release_id: string | null;
};

/**
 * M6: the standard releases a school may give now, from what `distributed_releases` returns: distributed to this
 * school and ACTIVE, published, and the newest of their line (a release another listed release corrects is left out,
 * so a corrected chapter is offered once). Pure, so a test drives it without a database.
 */
export function pintarDariDistribusi(dist: readonly Distribusi[], institusi: string): Terbitan[] {
  const milik = dist.filter((d) => d.consuming_institution_id === institusi && d.distribution_status === "ACTIVE" && d.published_at);
  const dikoreksi = new Set(milik.map((d) => d.supersedes_release_id).filter(Boolean));
  const seen = new Set<string>();
  return milik
    .filter((d) => !dikoreksi.has(d.plp_release_id))
    .filter((d) => (seen.has(d.plp_release_id) ? false : (seen.add(d.plp_release_id), true)))
    .sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)))
    .map((d) => ({
      id: d.plp_release_id,
      courseId: d.course_id,
      kursus: d.course_title,
      versi: d.version_label,
      terbitPada: d.published_at,
      pelajaran: 0,
      asal: "PINTAR" as const,
    }));
}

/** What has already been made available to one class. */
export async function penugasan(nodeId: string): Promise<Penugasan[]> {
  return (await penugasanKelas([nodeId])).get(nodeId) ?? [];
}

/** UX-37: what has already been made available to each of several classes, in one read. */
export async function penugasanKelas(nodeIds: readonly string[]): Promise<Map<string, Penugasan[]>> {
  const out = new Map<string, Penugasan[]>(nodeIds.map((k) => [k, []]));
  if (nodeIds.length === 0) return out;
  const c = await db();
  const { data } = await c
    .from("learning_assignments")
    .select("id, node_id, course_id, plp_release_id, status, available_from, available_until, course:courses(title)")
    .in("node_id", [...nodeIds]);

  type Baris = {
    id: string; node_id: string; course_id: string; plp_release_id: string; status: string;
    available_from: string | null; available_until: string | null;
    course: { title: string } | null;
  };
  for (const r of rows<Baris>(data)) out.get(r.node_id)?.push(penugasanDari(r));
  return out;
}

function penugasanDari(r: {
  id: string; course_id: string; plp_release_id: string; status: string;
  available_from: string | null; available_until: string | null; course: { title: string } | null;
}): Penugasan {
  return {
    id: r.id,
    courseId: r.course_id,
    releaseId: r.plp_release_id,
    kursus: r.course?.title ?? "",
    status: r.status,
    mulai: r.available_from,
    sampai: r.available_until,
    berakhir: Boolean(r.available_until && Date.parse(r.available_until) <= Date.now()),
    belumMulai: Boolean(r.available_from && Date.parse(r.available_from) > Date.now()),
  };
}

/**
 * W16: THE STATUS A TEACHER READS FOR ONE CLASS'S MATERIAL. A future «Mulai» is
 * «Dijadwalkan», never «Tersedia»: learners cannot open it until that day.
 */
export function statusMateri(x: Pick<Penugasan, "status" | "berakhir" | "belumMulai">):
  "mengajar.status.belum" | "mengajar.status.selesai" | "mengajar.status.dijadwalkan" | "mengajar.status.tersedia"
  | "mengajar.status.diakhiri" | "mengajar.status.ditarik" {
  // W2.21: an assignment ended or withdrawn on the record says so, never «Belum disediakan»
  if (x.status === "ENDED") return "mengajar.status.diakhiri";
  if (x.status === "WITHDRAWN") return "mengajar.status.ditarik";
  if (x.status !== "ACTIVE") return "mengajar.status.belum";
  if (x.berakhir) return "mengajar.status.selesai";
  if (x.belumMulai) return "mengajar.status.dijadwalkan";
  return "mengajar.status.tersedia";
}

/**
 * The Badge tone of a material's state (Batch 3 closure; Daisy, J1Terbit step 7 and J2Kelas): «Tersedia» is done, so
 * it is the ok Badge (its ✓ is drawn by .pin-pill.pin-ok); every other state is neutral. The word carries the state.
 */
export function nadaMateri(k: ReturnType<typeof statusMateri>): "pin-ok" | "pin-neutral" {
  return k === "mengajar.status.tersedia" ? "pin-ok" : "pin-neutral";
}

/** W2.21: an assignment still in force (DRAFT or ACTIVE): the one that holds the class's place for its release. */
export function masihBerlaku(x: Pick<Penugasan, "status">): boolean {
  return x.status === "ACTIVE" || x.status === "DRAFT";
}

/** W2.21: what ending one assignment would touch (akhiri_penugasan_pratinjau), or null when the database refuses. */
export type PratinjauAkhiri = {
  status: string; kursus: string; kelas: string; selesai: number; belumMulai: number;
  berjalan: Array<{ personId: string; nama: string }>;
};
export async function pratinjauAkhiri(penugasanId: string): Promise<PratinjauAkhiri | null> {
  const c = await db();
  const { data, error } = await c.rpc("akhiri_penugasan_pratinjau", { p_la: penugasanId });
  if (error || !data) return null;
  const d = data as { status: string; kursus: string | null; kelas: string | null; selesai: number; belum_mulai: number;
                      berjalan: Array<{ person_id: string; nama: string }> | null };
  return {
    status: d.status, kursus: d.kursus ?? "", kelas: d.kelas ?? "", selesai: Number(d.selesai) || 0,
    belumMulai: Number(d.belum_mulai) || 0,
    berjalan: (d.berjalan ?? []).map((b) => ({ personId: b.person_id, nama: b.nama })),
  };
}

/** The chapters of one course, in curriculum order. */
export async function bab(courseId: string): Promise<Array<{ id: string; judul: string; urutan: number }>> {
  const c = await db();
  const { data } = await c
    .from("modules")
    .select("id, title, ordinal")
    .eq("course_id", courseId)
    .order("ordinal", { ascending: true });
  return rows<{ id: string; title: string; ordinal: number }>(data).map((m) => ({
    id: m.id, judul: m.title, urutan: m.ordinal,
  }));
}

/** How many lessons and how many questions a release carries. */
export async function isiTerbitan(t: Pick<Terbitan, "id" | "courseId" | "asal">): Promise<{ pelajaran: number; soal: number }> {
  if (t.asal === "PINTAR") return isiPintar(t.id);
  const courseId = t.courseId;
  const c = await db();
  const { data: mods } = await c.from("modules").select("id").eq("course_id", courseId);
  const ids = rows<{ id: string }>(mods).map((m) => m.id);
  if (ids.length === 0) return { pelajaran: 0, soal: 0 };
  const [les, def] = await Promise.all([
    c.from("lessons").select("id", { count: "exact", head: true }).in("module_id", ids),
    c.from("assessment_definitions").select("item_count").eq("course_id", courseId),
  ]);
  const soal = rows<{ item_count: number }>(def.data).reduce((n, d) => n + (d.item_count ?? 0), 0);
  return { pelajaran: les.count ?? 0, soal };
}

type Instrumen = { mode: string; judul: string; soal: number; percobaan: number | null };

/** The cycle instruments a release carries: what a learner will actually receive. */
export async function instrumen(t: Pick<Terbitan, "id" | "courseId" | "asal">): Promise<Instrumen[]> {
  if (t.asal === "PINTAR") return instrumenPintar(t.id);
  const courseId = t.courseId;
  const c = await db();
  const { data } = await c
    .from("assessment_definitions")
    .select("title, mode, item_count, attempt_limit")
    .eq("course_id", courseId)
    .neq("mode", "QUICK");
  type Baris = { title: string; mode: string; item_count: number; attempt_limit: number | null };
  const urut: Record<string, number> = { PRE_TEST: 0, POST_TEST: 1, STANDALONE: 2 };
  return rows<Baris>(data)
    .map((d) => ({ mode: d.mode, judul: d.title, soal: d.item_count, percobaan: d.attempt_limit }))
    .sort((a, b) => (urut[a.mode] ?? 9) - (urut[b.mode] ?? 9));
}

// D-085 M6: a teacher's own row security cannot read a canonical course's modules or tests, so a PINTAR chapter is
// read through the distribution gate: distributed_release_outline for its lessons, distributed_release_instruments
// for the two tests assign_release will give (release_cycle_definition). Counts and titles; never an item.
async function instrumenPintar(releaseId: string): Promise<Instrumen[]> {
  const c = await db();
  const { data } = await c.rpc("distributed_release_instruments", { p_release: releaseId });
  type Baris = { mode: string; title: string; item_count: number; attempt_limit: number | null };
  return rows<Baris>(data).map((d) => ({ mode: d.mode, judul: d.title, soal: d.item_count, percobaan: d.attempt_limit }));
}

async function isiPintar(releaseId: string): Promise<{ pelajaran: number; soal: number }> {
  const c = await db();
  const [{ data: garis }, alat] = await Promise.all([
    c.rpc("distributed_release_outline", { p_release: releaseId }),
    instrumenPintar(releaseId),
  ]);
  const pelajaran = new Set(rows<{ lesson_id: string | null }>(garis).map((g) => g.lesson_id).filter(Boolean)).size;
  return { pelajaran, soal: alat.reduce((n, a) => n + (a.soal ?? 0), 0) };
}

/** D-085 T2: one question an Uji Cepat on a chapter may carry, as the teacher chooses it. No key, no reason. */
export type SoalPilihan = {
  id: string;
  pelajaran: number;
  judulPelajaran: string;
  topik: string | null;
  tanya: string;
  stimulus: string | null;
  opsi: Array<{ label: string; body: string }>;
  /** MUDAH, SEDANG or SULIT, from the question's predicted difficulty */
  tingkat: string;
  /** two questions in one parallel group are versions of one question: only one may be chosen */
  kelompok: string | null;
  /** marked for the chapter's Pemetaan Awal or Uji Penguasaan, so the teacher can leave it for that */
  peran: string | null;
};

/** The chapter's questions an Uji Cepat for this class may carry (quick_assessment_choices), in lesson order. */
export async function soalUjiCepat(kelasId: string, babId: string): Promise<SoalPilihan[]> {
  const c = await db();
  const { data, error } = await c.rpc("quick_assessment_choices", { p_node: kelasId, p_module: babId });
  if (error) return [];
  type Baris = {
    item_id: string; lesson_ordinal: number; lesson_title: string; topic: string | null; stem: string; stimulus: string | null;
    options: Array<{ label: string; body: string }> | null; band: string; parallel_group: string | null; cycle_role: string | null;
  };
  return rows<Baris>(data).map((b) => ({
    id: b.item_id, pelajaran: b.lesson_ordinal, judulPelajaran: b.lesson_title, topik: b.topic, tanya: b.stem,
    stimulus: b.stimulus, opsi: Array.isArray(b.options) ? b.options : [], tingkat: b.band, kelompok: b.parallel_group,
    peran: b.cycle_role,
  }));
}

/**
 * The ticked questions read back from the address, trusting nothing: only ids the chapter offers, each once, in the
 * chapter's own order. A value may be one id, a comma-joined list, or several (repeated checkboxes).
 */
export function pilihanSah(nilai: string | string[] | undefined, tersedia: readonly SoalPilihan[]): SoalPilihan[] {
  const dikirim = new Set((Array.isArray(nilai) ? nilai : nilai ? [nilai] : []).flatMap((x) => x.split(",")).map((x) => x.trim()));
  return tersedia.filter((q) => dikirim.has(q.id));
}

// ═══════════════════════════════════════════════ 4. what is open right now

export type Berjalan = {
  id: string;
  nodeId: string;
  /** OPEN or CLOSED, in effect: an OPEN assignment whose window has passed is CLOSED (BOB-42). Never rendered as a word. */
  keadaan: string;
  judul: string;
  mode: string;
  soal: number;
  dibuka: string | null;
  ditutup: string | null;
  /** Minutes left in the window, floored at zero. Null when it never closes. */
  sisaMenit: number | null;
  adHoc: boolean;
  /** Sessions that reached SUBMITTED or FINALIZED. A count, never a judgment. */
  mengumpulkan: number;
  /** Sessions that exist at all: somebody opened it. */
  mulai: number;
};

/** One assessment assignment as `berjalan` reads it. */
export type BarisTugasAsesmen = {
  id: string; node_id: string; status: string; opens_at: string | null; closes_at: string | null;
  definition: { title: string; mode: string; item_count: number; is_ad_hoc: boolean } | null;
};
/** One session as `berjalan` reads it: whose, of which assignment, how far. */
export type BarisSesiAsesmen = { assessment_assignment_id: string; person_id: string; status: string };

/**
 * BOB-42 (D-067): THE WINDOW DECIDES. Nothing moves an assignment from OPEN to
 * CLOSED when its `closes_at` passes (there is no job, by design), so an OPEN
 * assignment whose window has passed is CLOSED for every reader here. Learners
 * were never affected: `my_open_assessments` already reads the window.
 */
export function keadaanEfektif(status: string, ditutup: string | null, sekarang: number, dibuka: string | null = null): string {
  // W16: one whose window has not opened yet is not running either; learners cannot see it until then
  if (status === "OPEN" && dibuka !== null && Date.parse(dibuka) > sekarang) return "SCHEDULED";
  return status === "OPEN" && ditutup !== null && Date.parse(ditutup) <= sekarang ? "CLOSED" : status;
}

/**
 * The assignments in the states asked for, each in its effective state, with
 * its counts. Pure over the rows already read, so a test drives it with a
 * clock of its own.
 *
 * M9 (D-085): `anggota`, when given, is each class's roster now (node id →
 * person ids of its open memberships). A learner who has moved to another
 * class is then not counted against the roster they left, so «Mengumpulkan»
 * never reads 5 of 4; what they did stays in the class's figures, which read
 * the session's own class. Without it every session counts, as before.
 */
export function pilihBerjalan(
  baris: readonly BarisTugasAsesmen[],
  sesi: readonly BarisSesiAsesmen[],
  keadaan: readonly string[],
  sekarang: number,
  anggota?: ReadonlyMap<string, ReadonlySet<string>>,
): Berjalan[] {
  const kumpul = new Map<string, Set<string>>();
  const mulai = new Map<string, Set<string>>();
  const simpulTugas = new Map(baris.map((b) => [b.id, b.node_id]));
  for (const s of sesi) {
    const a = s.assessment_assignment_id;
    if (anggota && !anggota.get(simpulTugas.get(a) ?? "")?.has(s.person_id)) continue;
    if (!mulai.has(a)) mulai.set(a, new Set());
    mulai.get(a)!.add(s.person_id);
    if (s.status === "SUBMITTED" || s.status === "FINALIZED") {
      if (!kumpul.has(a)) kumpul.set(a, new Set());
      kumpul.get(a)!.add(s.person_id);
    }
  }
  return baris
    .map((b) => ({ b, efektif: keadaanEfektif(b.status, b.closes_at, sekarang, b.opens_at) }))
    .filter(({ efektif }) => keadaan.includes(efektif))
    .map(({ b, efektif }) => ({
      id: b.id,
      nodeId: b.node_id,
      keadaan: efektif,
      judul: b.definition?.title ?? "",
      mode: b.definition?.mode ?? "",
      soal: b.definition?.item_count ?? 0,
      dibuka: b.opens_at,
      ditutup: b.closes_at,
      sisaMenit: b.closes_at
        ? Math.max(0, Math.round((Date.parse(b.closes_at) - sekarang) / 60_000))
        : null,
      adHoc: Boolean(b.definition?.is_ad_hoc),
      mengumpulkan: kumpul.get(b.id)?.size ?? 0,
      mulai: mulai.get(b.id)?.size ?? 0,
    }));
}

/**
 * The assessments open in one or more classes, with their submission counts.
 *
 * `assessment_sessions_select` is `can_in_institution('CAN_ASSIGN_LEARNING')`,
 * so the database would return every class in the school. The query is narrowed
 * to the selected nodes, and every surface that renders these numbers says they
 * are counts rather than a measure of anybody.
 *
 * BOB-42: each assignment is returned in its EFFECTIVE state (keadaanEfektif).
 * Asking for CLOSED therefore also reads the OPEN rows, since one whose window
 * has passed is closed; asking for OPEN alone returns only windows still open.
 */
export async function berjalan(
  nodeIds: string[],
  keadaan: string[] = ["OPEN"],
): Promise<Berjalan[]> {
  if (nodeIds.length === 0) return [];
  const c = await db();
  const tersimpan = keadaan.includes("CLOSED") ? [...new Set([...keadaan, "OPEN"])] : keadaan;
  const { data } = await c
    .from("assessment_assignments")
    .select("id, node_id, status, opens_at, closes_at, definition:assessment_definitions(title, mode, item_count, is_ad_hoc)")
    .in("node_id", nodeIds)
    .in("status", tersimpan);

  const buka = rows<BarisTugasAsesmen>(data);
  if (buka.length === 0) return [];

  const [{ data: sesi }, roster] = await Promise.all([
    c
      .from("assessment_sessions")
      .select("assessment_assignment_id, person_id, status")
      .in("assessment_assignment_id", buka.map((b) => b.id)),
    // M9: who is in each class now, so a learner who moved away is not counted here
    c
      .from("memberships")
      .select("node_id, enrollment:enrollments(person_id)")
      .in("node_id", [...new Set(buka.map((b) => b.node_id))])
      .is("valid_to", null),
  ]);
  let anggota: Map<string, Set<string>> | undefined;
  if (!roster.error) {
    anggota = new Map();
    for (const r of rows<{ node_id: string; enrollment: { person_id: string } | null }>(roster.data)) {
      if (!r.enrollment) continue;
      if (!anggota.has(r.node_id)) anggota.set(r.node_id, new Set());
      anggota.get(r.node_id)!.add(r.enrollment.person_id);
    }
  }

  return pilihBerjalan(buka, rows<BarisSesiAsesmen>(sesi), keadaan, Date.now(), anggota);
}

/** CONTOH LAPORAN (approved 7 Nov): the class's one sealed Uji Penguasaan mark (src/lib/target-kelas.ts). */
export { satuTarget } from "@/lib/target-kelas";
export async function targetKelas(nodeId: string): Promise<number | null> {
  return targetKelasDari(await db(), nodeId);
}

/**
 * UX-37: WHAT WAITS ON THE TEACHER IN ONE CLASS — the acts of «Yang bisa Anda lakukan sekarang» (/langkah) that the
 * class's state puts there, and only those: an open assessment some of the class has not submitted yet (f1, the
 * first such), and published material the class may be given but does not have (f4, the newest). The Uji Cepat,
 * «Lihat bukti» and «Susun materi sendiri» are always on /langkah and wait on nobody, so they are not here. Pure, so
 * /langkah and the home read the same answer from the same rows and a test drives it without a database.
 */
export type Menunggu =
  | { key: "f1"; belum: number; href: string }
  | { key: "f4"; href: string };

export function menungguKelas(
  kelasId: string,
  buka: ReadonlyArray<Pick<Berjalan, "id" | "nodeId" | "mengumpulkan">>,
  murid: number,
  punya: ReadonlySet<string>,
  terbit: ReadonlyArray<Pick<Terbitan, "id">>,
): Menunggu[] {
  const out: Menunggu[] = [];
  const tertunda = buka.find((b) => b.nodeId === kelasId && b.mengumpulkan < murid) ?? null;
  if (tertunda) {
    out.push({ key: "f1", belum: Math.max(0, murid - tertunda.mengumpulkan), href: `/mengajar/${kelasId}/siapa?penugasan=${tertunda.id}` });
  }
  const calon = terbit.filter((r) => !punya.has(r.id));
  if (calon.length > 0) out.push({ key: "f4", href: `/mengajar/${kelasId}/siapkan?terbitan=${calon[0].id}` });
  return out;
}

/**
 * UX-37: what waits in each class of the teaching context, for the home. Batched: the open assessments and the
 * headcounts the home has already read are passed in; the classes' material is ONE read, the school's releases one
 * read, and the database's fit of a release to a class one call per class (BOB-43, as /langkah asks it).
 */
export async function menungguBeranda(
  kelas: readonly KelasMengajar[],
  buka: ReadonlyArray<Pick<Berjalan, "id" | "nodeId" | "mengumpulkan">>,
  murid: Readonly<Record<string, { murid: number } | undefined>>,
): Promise<Record<string, Menunggu[]>> {
  if (kelas.length === 0) return {};
  const ids = kelas.map((k) => k.id);
  const [tugas, terbit] = await Promise.all([penugasanKelas(ids), terbitanKelas(kelas[0].institusi, ids)]);
  return Object.fromEntries(kelas.map((k) => [k.id, menungguKelas(
    k.id, buka, murid[k.id]?.murid ?? 0,
    new Set((tugas.get(k.id) ?? []).map((x) => x.releaseId)), terbit.get(k.id) ?? [],
  )]));
}

/**
 * EDU-J23, EDU-J24: WHO, IN THREE LISTS. The same three states «Lihat bukti»
 * counts (W8, hitungKeadaan): submitted; started and not submitted (a session
 * of any other state, so also one that ran out or was ended); not started (no
 * session at all). A learner is in exactly one list, the roster's alphabetical
 * order is kept in each, and none is a ranking.
 */
export function pisahSiapa(
  roster: readonly Murid[],
  sesi: ReadonlyArray<{ person_id: string; status: string }>,
): { sudah: Murid[]; sedang: Murid[]; belum: Murid[] } {
  const ada = new Set(sesi.map((s) => s.person_id));
  const done = new Set(
    sesi.filter((s) => s.status === "SUBMITTED" || s.status === "FINALIZED").map((s) => s.person_id),
  );
  return {
    sudah: roster.filter((m) => done.has(m.id)),
    sedang: roster.filter((m) => !done.has(m.id) && ada.has(m.id)),
    belum: roster.filter((m) => !ada.has(m.id)),
  };
}

/** Who in this class has submitted one assessment, who has started it, and who has not started. */
export async function siapa(
  assignmentId: string,
  roster: Murid[],
): Promise<{ sudah: Murid[]; sedang: Murid[]; belum: Murid[] }> {
  const c = await db();
  const { data } = await c
    .from("assessment_sessions")
    .select("person_id, status")
    .eq("assessment_assignment_id", assignmentId);
  return pisahSiapa(roster, rows<{ person_id: string; status: string }>(data));
}

/**
 * M4 (D-085): ONE LEARNER, FOR THE TEACHER WHO TEACHES THEM.
 *
 * Where one learner of this class stands on each of the class's assessments, by
 * the same three states /siapa lists (pisahSiapa), and their official results
 * as the catalogue gives an EDUCATOR standing over them: `learner.result` through
 * `metric_evaluate`, which authorizes the reader over the learner itself
 * (audience_over_learner). Nothing is computed here, and nothing about
 * integrity, answers (M5) or other learners is read.
 */
export type KeadaanMurid = "sudah" | "sedang" | "belum";

export function keadaanSatu(orang: string, sesi: ReadonlyArray<{ person_id: string; status: string }>): KeadaanMurid {
  const p = pisahSiapa([{ id: orang, nama: "" }], sesi);
  return p.sudah.length > 0 ? "sudah" : p.sedang.length > 0 ? "sedang" : "belum";
}

export type HasilResmi = {
  sesi: string; mode: string; penguasaan: number | null; judul: string | null;
  /** D-085 M3, D-088(b): the mark sealed on that attempt, when the teacher's read of it carries one */
  batas: number | null;
  /** Owner decision E1: the sitting's result was recomputed after it was sealed; `asli` is the sealed original, which a
   *  certificate and the learner's own page keep */
  dihitungUlang?: boolean;
  asli?: number | null;
  /** D14: the reason the recalculation was recorded with, shown beside the note */
  alasan?: string | null;
};

export type CatatanMurid = {
  tugas: Array<{ id: string; judul: string; mode: string; keadaan: KeadaanMurid }>;
  hasil: Amplop;
  daftarHasil: HasilResmi[];
  /** D-085 M3 (J5.12): each of the learner's sittings in this class, by the assessment it belongs to. */
  tugasSesi: Record<string, string>;
};

export async function catatanMurid(kelasId: string, institusi: string, orang: string): Promise<CatatanMurid> {
  const c = await db();
  const [{ data: amplop, error }, tugas] = await Promise.all([
    c.rpc("metric_evaluate", { p_metric_id: "learner.result", p_node: orang, p_institution: institusi }),
    berjalan([kelasId], ["OPEN", "CLOSED"]),
  ]);
  const hasil = (error ? { status: "unavailable" } : amplop ?? { status: "unavailable" }) as Amplop;
  // D-085 M3, D-088(b): the mark is read from the assignment, where it is sealed and from which every attempt copies
  // it unchanged; a teacher holds no grant on assessment_sessions.pass_mark (the table's client grant is per column)
  const [{ data: sesiData }, { data: segelData }] = tugas.length > 0
    ? await Promise.all([
        c.from("assessment_sessions").select("id, assessment_assignment_id, person_id, status")
          .eq("person_id", orang).in("assessment_assignment_id", tugas.map((x) => x.id)),
        c.from("assessment_assignments").select("id, pass_mark").in("id", tugas.map((x) => x.id)),
      ])
    : [{ data: [] }, { data: [] }];
  const segel = new Map(rows<{ id: string; pass_mark: number | string | null }>(segelData)
    .map((x) => [x.id, x.pass_mark == null ? null : Number(x.pass_mark)]));
  return susunCatatan(orang, tugas.map((x) => ({ ...x, batas: segel.get(x.id) ?? null })), rows<SesiMurid>(sesiData), hasil);
}

type SesiMurid = { id: string; assessment_assignment_id: string; person_id: string; status: string };

/** The record from what was read: pure, so a test drives exactly what the page shows. */
export function susunCatatan(
  orang: string,
  tugas: ReadonlyArray<Pick<Berjalan, "id" | "judul" | "mode"> & { batas?: number | null }>,
  sesi: readonly SesiMurid[],
  hasil: Amplop,
): CatatanMurid {
  const milikNya = sesi.filter((x) => x.person_id === orang);
  const judulTugas = new Map(tugas.map((x) => [x.id, x.judul]));
  const judulSesi = new Map(milikNya.map((x) => [x.id, judulTugas.get(x.assessment_assignment_id) ?? null]));
  // an attempt carries its assignment's sealed mark (BOB-49 copies it on insert and never changes either)
  const batasTugas = new Map(tugas.map((x) => [x.id, x.batas ?? null]));
  const batasSesi = new Map(milikNya.map((x) => [x.id, batasTugas.get(x.assessment_assignment_id) ?? null]));
  const nilai = hasil.status === "ok" && Array.isArray(hasil.value)
    ? (hasil.value as Array<{ session_id?: unknown; mode?: unknown; mastery?: unknown; recomputed?: unknown; sealed_mastery?: unknown; recomputation_reason?: unknown }>)
    : [];
  return {
    tugasSesi: Object.fromEntries(milikNya.map((x) => [x.id, x.assessment_assignment_id])),
    tugas: tugas.map((x) => ({
      id: x.id, judul: x.judul, mode: x.mode,
      keadaan: keadaanSatu(orang, milikNya.filter((y) => y.assessment_assignment_id === x.id)),
    })),
    hasil,
    daftarHasil: nilai.map((v) => ({
      sesi: String(v.session_id ?? ""),
      mode: String(v.mode ?? ""),
      penguasaan: typeof v.mastery === "number" ? v.mastery : v.mastery == null ? null : Number(v.mastery),
      judul: judulSesi.get(String(v.session_id ?? "")) ?? null,
      batas: batasSesi.get(String(v.session_id ?? "")) ?? null,
      dihitungUlang: v.recomputed === true,
      asli: v.recomputed === true && v.sealed_mastery != null && Number.isFinite(Number(v.sealed_mastery)) ? Number(v.sealed_mastery) : null,
      alasan: v.recomputed === true && typeof v.recomputation_reason === "string" ? v.recomputation_reason : null,
    })),
  };
}

/**
 * W2.18 (J5.13): THE OBJECTIVES THIS LEARNER HAS NOT YET REACHED, IN WORDS. The database answers
 * (tujuan_belum_tercapai, 20261225100000): the objectives, by their statement, that the learner's latest official Uji
 * Penguasaan in this class recorded below the mark sealed on that attempt -- the class's «Penguasaan per tujuan
 * pembelajaran» reading narrowed to one learner, judged by the learner's own result's rule. It returns no figure (a
 * number reaches a staff screen only through the catalogue), no item and no answer, and nothing at all to a reader who
 * does not teach this class or about a learner not in it. Unread is none listed.
 */
export type TujuanBelum = { id: string | null; pernyataan: string };

export async function tujuanBelum(kelasId: string, orang: string): Promise<TujuanBelum[]> {
  const c = await db();
  const { data, error } = await c.rpc("tujuan_belum_tercapai", { p_class: kelasId, p_learner: orang });
  if (error) return [];
  return rows<{ objective_id: string | null; statement: string }>(data)
    .filter((r) => typeof r.statement === "string" && r.statement.trim() !== "")
    .map((r) => ({ id: r.objective_id, pernyataan: r.statement }));
}

/**
 * D-195(5), CONTOH LAPORAN 2-guru section E: THE LEARNERS OF THIS CLASS IN THE LOWEST BAND, BY NAME, for the teacher
 * who teaches it. The database answers who (murid_perlu_penguatan, 20270102100000: calc_class_readiness_distribution's
 * own band rule, the learner's identity and name only, nothing to a reader who does not teach the class), and
 * tujuan_belum_tercapai what each is to study again. No figure, no item, no answer. Unread is null (no section drawn),
 * so a failed read never says «nobody».
 */
export type MuridPenguatan = {
  id: string; nama: string; ulang: string[];
  /** The latest Uji Penguasaan's questions right out of its questions (KESETIAAN #5); null when not recorded. */
  benar: number | null; total: number | null;
  /** false: a required question was not right (the safety gate, which alone places a learner in this band). */
  soalWajibTepat: boolean | null;
};

export async function perluPenguatan(kelasId: string): Promise<MuridPenguatan[] | null> {
  const c = await db();
  const { data, error } = await c.rpc("murid_perlu_penguatan", { p_class: kelasId });
  if (error) return null;
  const orang = rows<{ person_id: string; display_name: string | null; benar: number | null; total: number | null; soal_wajib_tepat: boolean | null }>(data)
    .filter((r) => typeof r.person_id === "string");
  const ulang = await Promise.all(orang.map((o) => tujuanBelum(kelasId, o.person_id)));
  return orang.map((o, i) => ({
    id: o.person_id, nama: o.display_name ?? "", ulang: ulang[i].map((u) => u.pernyataan),
    benar: typeof o.total === "number" && o.total > 0 ? o.benar : null, total: typeof o.total === "number" && o.total > 0 ? o.total : null,
    soalWajibTepat: typeof o.soal_wajib_tepat === "boolean" ? o.soal_wajib_tepat : null,
  }));
}

/**
 * KESETIAAN #6: THE CLASS'S SCORE LINE, ONE DOT PER LEARNER, for the class's teacher only (sebaran_murid_kelas,
 * 20270103100000): each learner's latest official Uji Penguasaan mastery and band, by the readiness calculator's own
 * rule, with no identity at all. Unread is null (no strip drawn).
 */
export type TitikMurid = { mastery: number; pita: "mantap" | "berkembang" | "penguatan" };
const PITA_TIER: Record<string, TitikMurid["pita"]> = {
  "kesiapan.siap_sertifikasi": "mantap", "kesiapan.perlu_review": "berkembang", "kesiapan.butuh_pendampingan": "penguatan",
};

export async function sebaranKelas(kelasId: string): Promise<TitikMurid[] | null> {
  const c = await db();
  const { data, error } = await c.rpc("sebaran_murid_kelas", { p_class: kelasId });
  if (error) return null;
  return rows<{ mastery: number | string; tier_key: string }>(data)
    .map((r) => ({ mastery: Number(r.mastery), pita: PITA_TIER[r.tier_key] }))
    .filter((r): r is TitikMurid => Number.isFinite(r.mastery) && Boolean(r.pita));
}

/**
 * KESETIAAN #7: THE BEFORE → AFTER PAIR BEHIND «KENAIKAN» (kenaikan_awal_akhir, 20270103100000): the mean Pemetaan Awal
 * and the mean Uji Penguasaan over exactly the (learner, chapter) pairs class.net_gain reads, given only when the
 * reader's own Kenaikan evaluates «ok». «TIDAK» when the database answers with no pair: the page then says the two
 * cannot be compared yet, never a figure; «DILINDUNGI» when there are pairs but their means are withheld (decision 7);
 * null when the read failed (nothing drawn).
 */
export type AwalAkhir = { awal: number; akhir: number; pasangan: number } | "TIDAK" | "DILINDUNGI";

export async function awalAkhirKelas(kelasId: string): Promise<AwalAkhir | null> {
  const c = await db();
  const { data, error } = await c.rpc("kenaikan_awal_akhir", { p_class: kelasId });
  if (error) return null;
  const r = rows<{ awal: number | string | null; akhir: number | string | null; pasangan: number }>(data)[0];
  if (!r) return "TIDAK";
  // owner decision 7, Sharon's finding 1: there ARE pairs, but their means would expose a small chapter or a chapter's
  // few unpaired learners beside the chapter rows: withheld, which is not «cannot be compared»
  if ((r.awal == null || r.akhir == null) && Number(r.pasangan) > 0) return "DILINDUNGI";
  if (r.awal == null || r.akhir == null) return "TIDAK";
  return { awal: Number(r.awal), akhir: Number(r.akhir), pasangan: Number(r.pasangan) };
}

// ═══════════════════════════════════════════════════ 5. the quick assessment

export type BatasUjiCepat = {
  soalMin: number;
  soalMax: number;
  percobaan: number | null;
};

/**
 * The QUICK bounds, READ rather than restated.
 *
 * `assessment_definition_bounds` is where a bound is (0057). The form offers
 * what this row permits; `launch_quick_assessment` checks the same numbers
 * again on the way in, so a hand-posted value is refused by the database and
 * not by this form.
 */
export async function batasUjiCepat(): Promise<BatasUjiCepat | null> {
  const c = await db();
  const { data } = await c
    .from("assessment_definition_bounds")
    .select("item_count_min, item_count_max, attempt_limit_max")
    .eq("mode", "QUICK")
    .limit(1);
  const b = rows<{ item_count_min: number; item_count_max: number; attempt_limit_max: number | null }>(data)[0];
  return b
    ? { soalMin: b.item_count_min, soalMax: b.item_count_max, percobaan: b.attempt_limit_max }
    : null;
}

/** The minute windows the surface offers. Inside the RPC's own 5–60 bound. */
export const JENDELA_MENIT = [10, 15, 30] as const;

// ═════════════════════════════════════════ 5b. asking learners to read again

/**
 * D-085 M3 (J5.12): the teacher may give existing material back to the learners who need it. One row per learner
 * of the class: under the chapter's sealed target on their latest finished Uji Penguasaan («bawah»), not finished
 * yet («belum»), or at or over it («capai»). Recorded mastery and the sealed mark only: no second definition of
 * mastery (D-086(b)).
 */
export type BarisUlang = { id: string; nama: string; penguasaan: number | null; status: "bawah" | "belum" | "capai" };

/** Pure: those under the target first (lowest first), then those not finished, then the rest; by name within each. */
export function urutUlang(
  murid: ReadonlyArray<{ id: string; nama: string }>,
  penguasaan: ReadonlyMap<string, number | null>,
  batas: number | null,
): BarisUlang[] {
  const peringkat = { bawah: 0, belum: 1, capai: 2 } as const;
  return murid
    .map((m): BarisUlang => {
      const p = penguasaan.has(m.id) ? penguasaan.get(m.id) ?? null : null;
      const status = p === null ? "belum" : batas !== null && p < batas ? "bawah" : "capai";
      return { id: m.id, nama: m.nama, penguasaan: p, status };
    })
    .sort((a, b) => peringkat[a.status] - peringkat[b.status]
      || (a.status === "bawah" ? (a.penguasaan ?? 0) - (b.penguasaan ?? 0) : 0)
      || a.nama.localeCompare(b.nama));
}

export type BahanUlang = {
  /** The learning assignment (the chapter as given to the class) and the Uji Penguasaan it was reached from. */
  tugas: string;
  penugasan: string;
  judul: string;
  batas: number | null;
  murid: BarisUlang[];
  pelajaran: Array<{ id: string; judul: string }>;
  permintaan: Array<{ id: string; orang: string; nama: string; kapan: string; dibaca: number; jumlah: number }>;
};

/**
 * What «Minta membaca lagi» needs, from an Uji Penguasaan of this class: the chapter, its sealed mark, the class's
 * learners with their latest recorded mastery on it (through the catalogue's `learner.result`, as the learner's
 * record reads it), the chapter's lessons, and the requests already made. Null when the assessment is not this
 * class's Uji Penguasaan.
 */
export async function bahanUlang(kelasId: string, institusi: string, penugasan: string): Promise<BahanUlang | null> {
  const c = await db();
  const { data: aaRows } = await c.from("assessment_assignments")
    .select("id, node_id, pass_mark, learning_assignment_id, definition:assessment_definitions(mode)")
    .eq("id", penugasan).eq("node_id", kelasId).limit(1);
  type BarisAa = { id: string; pass_mark: number | string | null; learning_assignment_id: string | null; definition: { mode: string } | null };
  const aa = rows<BarisAa>(aaRows)[0];
  if (!aa || !aa.learning_assignment_id || aa.definition?.mode !== "POST_TEST") return null;
  const { data: laRows } = await c.from("learning_assignments").select("id, course_id, plp_release_id").eq("id", aa.learning_assignment_id).limit(1);
  const la = rows<{ id: string; course_id: string; plp_release_id: string }>(laRows)[0];
  if (!la) return null;

  const [fakta, { data: sesi }, { data: kursus }, { data: mods }, { data: minta }] = await Promise.all([
    faktaKelas(kelasId),
    c.from("assessment_sessions").select("id, person_id, finalized_at").eq("assessment_assignment_id", aa.id).eq("status", "FINALIZED"),
    c.from("courses").select("title").eq("id", la.course_id).limit(1),
    c.from("modules").select("id, ordinal, lessons(id, ordinal, title)").eq("course_id", la.course_id),
    c.from("lesson_review_requests").select("id, person_id, requested_at, items:lesson_review_items(lesson_id, read_at)")
      .eq("learning_assignment_id", la.id).order("requested_at", { ascending: false }),
  ]);

  // the chapter's lessons, in order: the school's own course, or a PINTAR chapter's outline (M6)
  type Mod = { ordinal: number; lessons: Array<{ id: string; ordinal: number; title: string }> };
  let pelajaran = rows<Mod>(mods).sort((a, b) => a.ordinal - b.ordinal)
    .flatMap((m) => [...(m.lessons ?? [])].sort((a, b) => a.ordinal - b.ordinal).map((l) => ({ id: l.id, judul: l.title })));
  let judul = rows<{ title: string }>(kursus)[0]?.title ?? "";
  if (pelajaran.length === 0) {
    const { data: garis } = await c.rpc("distributed_release_outline", { p_release: la.plp_release_id });
    const g = rows<{ module_ordinal: number; lesson_id: string | null; lesson_ordinal: number; lesson_title: string }>(garis)
      .filter((x) => x.lesson_id);
    pelajaran = g.sort((a, b) => a.module_ordinal - b.module_ordinal || a.lesson_ordinal - b.lesson_ordinal)
      .map((x) => ({ id: x.lesson_id as string, judul: x.lesson_title }));
    if (!judul) judul = (await terbitan(institusi)).find((t) => t.id === la.plp_release_id)?.kursus ?? "";
  }

  // each learner's latest finished attempt, and the mastery the catalogue records for it
  const terakhir = new Map<string, { id: string; at: string }>();
  for (const x of rows<{ id: string; person_id: string; finalized_at: string | null }>(sesi)) {
    const kini = terakhir.get(x.person_id);
    if (!kini || String(x.finalized_at ?? "") > kini.at) terakhir.set(x.person_id, { id: x.id, at: String(x.finalized_at ?? "") });
  }
  const penguasaan = new Map<string, number | null>();
  await Promise.all(fakta.murid.filter((m) => terakhir.has(m.id)).map(async (m) => {
    const { data: amplop, error } = await c.rpc("metric_evaluate", { p_metric_id: "learner.result", p_node: m.id, p_institution: institusi });
    const nilai = !error && amplop && (amplop as Amplop).status === "ok" && Array.isArray((amplop as Amplop).value)
      ? ((amplop as Amplop).value as Array<{ session_id?: unknown; mastery?: unknown }>) : [];
    const v = nilai.find((r) => String(r.session_id ?? "") === terakhir.get(m.id)?.id)?.mastery;
    penguasaan.set(m.id, typeof v === "number" ? v : v == null ? null : Number(v));
  }));
  const batas = aa.pass_mark == null ? null : Number(aa.pass_mark);
  const nama = new Map(fakta.murid.map((m) => [m.id, m.nama]));
  type BarisMinta = { id: string; person_id: string; requested_at: string; items: Array<{ lesson_id: string; read_at: string | null }> | null };
  return {
    tugas: la.id,
    penugasan: aa.id,
    judul,
    batas,
    murid: urutUlang(fakta.murid, penguasaan, batas),
    pelajaran,
    permintaan: rows<BarisMinta>(minta).map((r) => ({
      id: r.id, orang: r.person_id, nama: nama.get(r.person_id) ?? "—", kapan: r.requested_at,
      dibaca: (r.items ?? []).filter((i) => i.read_at).length, jumlah: (r.items ?? []).length,
    })),
  };
}

// ═══════════════════════════════════════════════════════════ 6. the evidence

export type Amplop = {
  status: string;
  label_key?: string;
  meaning_key?: string;
  statement_key?: string;
  value?: unknown;
  sample?: number;
  have?: number;
  needed?: number;
  /** CR-81 (D-123(3)): the class's population beside the readiness bands (placed, assessed, not yet). */
  population?: { placed: number; assessed: number; not_yet: number };
  /** Owner decision 7: what was withheld to protect a smaller group (see Envelope.withheld). */
  withheld?: { reason: string; needed?: number; count?: number; chapters?: number };
  /** Kenaikan's pairs (see Envelope.pairs). */
  pairs?: number;
};

/**
 * The four class metrics this surface asks for, in the order Slice 3 fixed.
 *
 * NAMED HERE, NOT DERIVED FROM A TEMPLATE. `generate_report` needs a saved
 * `report_templates` row and saving one is CAN_MANAGE_REPORT_TEMPLATES, which
 * an educator does not hold — so an educator's evidence screen cannot depend on
 * a template existing. Each metric is asked for directly and `metric_evaluate`
 * re-authorizes every one against this viewer, returning `not_permitted`
 * without a label if the answer is no.
 *
 * `class.misconceptions` is on this list and `item.*` is not. The first is
 * granted to EDUCATOR by the catalogue itself and returns
 * {code, label, remediation, occurrences} for the class with no learner and no
 * item in it; the second is Head of Department's and is never asked for here.
 */
export const METRIK_KELAS = [
  "class.comprehension",
  "class.net_gain",
  "class.topic_mastery",
  "class.misconceptions",
  "class.readiness_distribution",
] as const;

export async function bukti(nodeId: string, institusi: string): Promise<Amplop[]> {
  const c = await db();
  const out = await Promise.all(
    METRIK_KELAS.map(async (m) => {
      const { data, error } = await c.rpc("metric_evaluate", {
        p_metric_id: m,
        p_node: nodeId,
        p_institution: institusi,
      });
      if (error) return { status: "unavailable" } as Amplop;
      return (data ?? { status: "unavailable" }) as Amplop;
    }),
  );
  return out;
}

/**
 * The catalogue's minimum for a metric.
 *
 * The `ok` envelope carries `value` and `sample` but NOT `needed` — only the
 * `below_minimum` branch does. So "from 22 · minimum 20" needs this second
 * read, which `metric_definitions_select` grants to any signed-in person. It is
 * never invented from the sample, and a metric with no catalogue row gets no
 * minimum rather than a plausible one.
 */
export async function minimumMetrik(): Promise<Record<string, number>> {
  const c = await db();
  const { data: versi } = await c.rpc("current_metric_catalogue");
  if (!versi) return {};
  const { data } = await c
    .from("metric_definitions")
    .select("metric_id, minimum_sample")
    .eq("catalogue_version", versi)
    .in("metric_id", [...METRIK_KELAS]);
  const out: Record<string, number> = {};
  for (const r of rows<{ metric_id: string; minimum_sample: number }>(data)) {
    out[r.metric_id] = r.minimum_sample;
  }
  return out;
}

// ═══════════════════════════════════════════ 7. who is reading, and a summary

/** The reader's own name, as the school stored it. */
export async function saya(): Promise<{ nama: string } | null> {
  const c = await db();
  const { data: me } = await c.rpc("current_person_id");
  if (!me) return null;
  const { data } = await c.from("persons").select("display_name").eq("id", me).limit(1);
  const p = rows<{ display_name: string }>(data)[0];
  return p ? { nama: p.display_name } : null;
}

/** Subject and headcount for several classes at once, for the home's list. */
export async function ringkasKelas(
  nodeIds: string[],
): Promise<Record<string, { mapel: string | null; murid: number }>> {
  const out: Record<string, { mapel: string | null; murid: number }> = {};
  if (nodeIds.length === 0) return out;
  const c = await db();
  const [kls, anggota] = await Promise.all([
    c.from("classes").select("node_id, subject").in("node_id", nodeIds),
    c.from("memberships").select("node_id, enrollment_id").in("node_id", nodeIds).is("valid_to", null),
  ]);
  for (const id of nodeIds) out[id] = { mapel: null, murid: 0 };
  for (const r of rows<{ node_id: string; subject: string }>(kls.data)) {
    if (out[r.node_id]) out[r.node_id].mapel = r.subject;
  }
  const seen = new Set<string>();
  for (const r of rows<{ node_id: string; enrollment_id: string }>(anggota.data)) {
    const key = `${r.node_id}:${r.enrollment_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (out[r.node_id]) out[r.node_id].murid += 1;
  }
  return out;
}

export type SatuHal = {
  kelasId: string;
  kelasNama: string;
  terbitanId: string;
  kursusId: string;
  kursus: string;
  terbitPada: string | null;
  lanjutan: boolean;
};

/**
 * THE ONE THING WORTH DOING FIRST — derived from state, never from a to-do list.
 *
 * A published release the school owns that one class in the teaching context
 * does not have an assignment for. The class that is ALREADY being taught that
 * course wins over a class that has never had it, because a continuation is a
 * decision somebody is already waiting on and a first assignment is not.
 *
 * BOB-40 (post-login review #3, D-061) — IT FITS THE CLASS. It
 * proposed any published release the class did not have, comparing nothing,
 * so a Grade 5 teacher could be told an SMA course came first. Classes carry no
 * subject or grade; courses do. So a (class, release) pair is a candidate only
 * when the class already holds an assignment whose course has the release's
 * course's subject, stage and grade_label (the next release of a lineage the
 * class takes included). A class with no assignment gets no course suggestion:
 * its first material comes through «Siapkan materi», which lists every
 * published release, unchanged. The order among candidates is as it was.
 *
 * NOT A CHAPTER. The reviewed concept named one ("Bab 4 is published but not
 * yet available to 10A"), and PINTAR does not release chapters: `plp_releases`
 * is per COURSE and the chapters are `modules` inside it. So the sentence names
 * the material the school actually published and the class it is not available
 * to, which is the same fact at the granularity the contract carries it.
 *
 * ABSENT WHEN THERE IS NOTHING. There is no "you're all caught up" card with an
 * illustration; there is one quiet line, or there is a decision.
 */
export type KunciKursus = { subject: string | null; stage: string | null; grade_label: string | null };

/** BOB-40: the choice itself, over rows already read, so it can be driven as it stands. */
export function pilihSatuHal(
  kelas: Array<{ id: string; nama: string }>,
  terbit: Array<{ id: string; courseId: string; kursus: string; terbitPada: string | null }>,
  tugas: Map<string, Array<{ releaseId: string; courseId: string }>>,
  kunci: Map<string, KunciKursus>,
): SatuHal | null {
  const sidik = (courseId: string) => {
    const k = kunci.get(courseId);
    return k ? JSON.stringify([k.subject ?? "", k.stage ?? "", k.grade_label ?? ""]) : null;
  };
  const kandidat: SatuHal[] = [];
  for (const k of kelas) {
    const t = tugas.get(k.id) ?? [];
    const punyaTerbitan = new Set(t.map((x) => x.releaseId));
    const punyaKursus = new Set(t.map((x) => x.courseId));
    const cocok = new Set(t.map((x) => sidik(x.courseId)).filter((x): x is string => x !== null));
    for (const r of terbit) {
      if (punyaTerbitan.has(r.id)) continue;
      const sr = sidik(r.courseId);
      if (sr === null || !cocok.has(sr)) continue;
      kandidat.push({
        kelasId: k.id,
        kelasNama: k.nama,
        terbitanId: r.id,
        kursusId: r.courseId,
        kursus: r.kursus,
        terbitPada: r.terbitPada,
        lanjutan: punyaKursus.has(r.courseId),
      });
    }
  }
  if (kandidat.length === 0) return null;
  kandidat.sort((a, b) => {
    if (a.lanjutan !== b.lanjutan) return a.lanjutan ? -1 : 1;
    return String(b.terbitPada ?? "").localeCompare(String(a.terbitPada ?? ""));
  });
  return kandidat[0];
}

export async function satuHal(kelas: KelasMengajar[]): Promise<SatuHal | null> {
  if (kelas.length === 0) return null;
  const institusi = kelas[0].institusi;
  const [terbit, semua] = await Promise.all([
    terbitan(institusi),
    Promise.all(kelas.map(async (k) => ({ k, t: await penugasan(k.id) }))),
  ]);
  if (terbit.length === 0) return null;

  // the subject, stage and grade of every course in play, in one read
  const kursusIds = [...new Set([...terbit.map((r) => r.courseId), ...semua.flatMap(({ t }) => t.map((x) => x.courseId))])];
  const c = await db();
  const { data } = await c.from("courses").select("id, subject, stage, grade_label").in("id", kursusIds);
  const kunci = new Map(rows<KunciKursus & { id: string }>(data).map((r) => [r.id, r]));

  return pilihSatuHal(
    semua.map(({ k }) => ({ id: k.id, nama: k.nama })),
    terbit,
    new Map(semua.map(({ k, t }) => [k.id, t])),
    kunci,
  );
}

/**
 * W16: WHEN THERE IS NO SUGGESTION, IS THERE STILL A CLASS WAITING? BOB-40
 * suggests no course to a class with no assignment (nothing to fit it by), and
 * the home then said «Tidak ada yang menunggu keputusan Anda hari ini.» even
 * when the school had published material and a class had none. The first such
 * class, in the order the home lists them, is named instead, and sent to
 * «Siapkan materi», which lists every published release; no course is proposed.
 */
export function pilihKelasTanpaMateri(
  kelas: Array<{ id: string; nama: string }>,
  adaTerbitan: boolean,
  punyaMateri: ReadonlySet<string>,
): { kelasId: string; kelasNama: string } | null {
  if (!adaTerbitan) return null;
  const k = kelas.find((x) => !punyaMateri.has(x.id));
  return k ? { kelasId: k.id, kelasNama: k.nama } : null;
}

export async function kelasTanpaMateri(kelas: KelasMengajar[]): Promise<{ kelasId: string; kelasNama: string } | null> {
  if (kelas.length === 0) return null;
  const c = await db();
  const [terbit, tugas] = await Promise.all([
    terbitan(kelas[0].institusi),
    c.from("learning_assignments").select("node_id").in("node_id", kelas.map((k) => k.id)),
  ]);
  return pilihKelasTanpaMateri(
    kelas.map((k) => ({ id: k.id, nama: k.nama })),
    terbit.length > 0,
    new Set(rows<{ node_id: string }>(tugas.data).map((r) => r.node_id)),
  );
}

/**
 * The clock, read on the server as one more input to the page.
 *
 * A server component that calls `Date.now()` while rendering is reaching for a
 * value that is not part of its inputs, which is the property React's purity
 * rule exists to protect. Reading it here — beside the rows whose freshness it
 * is used to describe — makes it an input like any other, and means there is
 * exactly one clock per request rather than one per expression.
 */
export function waktu(): { iso: string; jam: number } {
  const now = new Date();
  // the hour on Jakarta's clock, from the one date helper (W3.3, RV-16)
  const jam = bagianJakarta(now)?.jam ?? 0;
  return { iso: now.toISOString(), jam };
}

// ═══════════════════════════════════════════ 8. the Uji Cepat score (W2.4)

/**
 * W2.4 (CR-27, J5.6; D-120 Q8): one Uji Cepat of this class, scored for its teacher. Null when the assignment is not
 * this class's Uji Cepat. A READ OF WHAT EXISTS, no new path: the class now (faktaKelas), its sittings of this
 * assignment (as `berjalan` and `siapa` read them), and each finished learner's official result through the
 * catalogue (`learner.result`, which authorizes the reader over that learner, as the learner's record and
 * «Minta membaca lagi» read it). What the evaluator does not give is not shown (susunHasilUjiCepat).
 */
export async function hasilUjiCepat(
  kelasId: string,
  institusi: string,
  penugasan: string,
): Promise<{ tugas: Berjalan; hasil: HasilUjiCepat } | null> {
  const [semua, fakta] = await Promise.all([berjalan([kelasId], ["OPEN", "CLOSED"]), faktaKelas(kelasId)]);
  const tugas = semua.find((b) => b.id === penugasan && b.adHoc && b.mode === "QUICK");
  if (!tugas) return null;
  const c = await db();
  const { data } = await c
    .from("assessment_sessions")
    .select("id, person_id, status, finalized_at")
    .eq("assessment_assignment_id", penugasan);
  const sesi = rows<SesiHasil & { finalized_at: string | null }>(data)
    .sort((a, b) => String(a.finalized_at ?? "").localeCompare(String(b.finalized_at ?? "")));
  const dalamKelas = new Set(fakta.murid.map((m) => m.id));
  const selesai = sesi.filter((x) => x.status === "FINALIZED" && dalamKelas.has(x.person_id));
  const nilai = new Map<string, number | null>();
  await Promise.all([...new Set(selesai.map((x) => x.person_id))].map(async (orang) => {
    const { data: amplop, error } = await c.rpc("metric_evaluate", { p_metric_id: "learner.result", p_node: orang, p_institution: institusi });
    const isi = !error && amplop && (amplop as Amplop).status === "ok" && Array.isArray((amplop as Amplop).value)
      ? ((amplop as Amplop).value as Array<{ session_id?: unknown; mastery?: unknown }>) : [];
    const milik = new Set(selesai.filter((x) => x.person_id === orang).map((x) => x.id));
    for (const v of isi) {
      const id = String(v.session_id ?? "");
      if (!milik.has(id) || v.mastery == null) continue;
      const m = Number(v.mastery);
      if (Number.isFinite(m)) nilai.set(id, m);
    }
  }));
  return { tugas, hasil: susunHasilUjiCepat(fakta.murid, sesi, nilai) };
}
