import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { konteksHalaman } from "@/lib/konteks-server";
import type { Kemajuan } from "@/lib/pendataan-kontrak";
import { pilihanTempat, type SimpulPohon } from "@/lib/struktur-kontrak";

/**
 * THE INTAKE DATA LAYER — WP5B.
 *
 * Every read here is the caller's own session under RLS or a WP5A endpoint
 * that authorizes itself. Nothing in this module decides who may provision:
 * `can_on_node('CAN_PROVISION_PEOPLE', institution)` does, and the frontend
 * asks it rather than reasoning about roles. WP5A puts that capability on
 * INSTITUTION_ADMIN and SYSTEM_ADMIN and says in the migration why a head of
 * department and a dean do not have it — "Management is academic judgement and
 * provisioning is not" — so a WP4 Management reader arriving here is refused by
 * the same function that bounds the job list.
 *
 * THE BROWSER IS NOT THE JOB OWNER. Nothing in this module holds job state,
 * caches progress or remembers what an earlier call did. Every function is a
 * fresh read of durable state, which is what makes a closed laptop, a dropped
 * network and a different machine all the same thing to this surface.
 */

export class PendataanError extends Error {}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = any;

async function db(): Promise<Db> {
  return (await supabaseServer()) as unknown as Db;
}

function rows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

// ═════════════════════════════════════════ 1. may this reader provision at all

export type Sekolah = {
  id: string;
  nama: string;
  /** The reserved namespace, or null when the school has none yet. */
  kode: string | null;
  /** True once at least one institutional ID exists, which freezes the code. */
  beku: boolean;
};

/**
 * THE SCHOOLS THIS READER MAY PROVISION PEOPLE FOR.
 *
 * Candidates come from the reader's own `role_assignments` — the policy
 * permits `person_id = current_person_id()`, so this is the reader asking about
 * themselves — and the ANSWER comes from `can_on_node('CAN_PROVISION_PEOPLE',
 * …)` per candidate institution. No role name is read and the `role` column is
 * never selected: the capability model decides, exactly as it does for Studio.
 *
 * An empty list means "not an institution administrator here", and every intake
 * route renders the one refusal page for it.
 */
export async function sekolahPendataan(): Promise<Sekolah[]> {
  // L3 (CR-83; D-127 Q2): the working context's school only (a place, not «Seluruh platform», which records nobody);
  // an evaluation persona keeps every school it provisions for (C10). The database decides each act.
  const kh = await konteksHalaman();
  if (kh === null || (kh !== "TANPA_KONTEKS" && kh.tempat === null)) return [];
  const semua = await sekolahPendataanSemua();
  return kh === "TANPA_KONTEKS" ? semua : semua.filter((x) => x.id === kh.tempat);
}

async function sekolahPendataanSemua(): Promise<Sekolah[]> {
  const c = await db();
  const { data: hibah } = await c.from("role_assignments").select("institution_id");
  const kandidat = [
    ...new Set(
      rows<{ institution_id: string | null }>(hibah)
        .map((r) => r.institution_id)
        .filter((x): x is string => typeof x === "string" && x.length > 0),
    ),
  ];
  if (kandidat.length === 0) return [];

  const dijawab = await Promise.all(
    kandidat.map(async (id) => {
      const { data, error } = await c.rpc("can_on_node", {
        p_capability: "CAN_PROVISION_PEOPLE",
        p_node: id,
      });
      return error ? null : data === true ? id : null;
    }),
  );
  const milik = dijawab.filter((x): x is string => x !== null);
  if (milik.length === 0) return [];

  const [{ data: inst }, { data: identitas }] = await Promise.all([
    c.from("institutions").select("id, name, namespace").in("id", milik),
    // FROZEN IS A FACT ABOUT THE WORLD, NOT A SETTING. The namespace becomes
    // immutable the moment one ID exists under it -- a database trigger says
    // so -- and this read is how the screen knows to stop offering an edit it
    // would be refused. `institutional_identities_select` admits a holder of
    // CAN_PROVISION_PEOPLE, so this is a legitimate read for this reader.
    c.from("institutional_identities").select("institution_id").in("institution_id", milik).limit(500),
  ]);
  const sudahTerbit = new Set(
    rows<{ institution_id: string }>(identitas).map((r) => String(r.institution_id)),
  );

  return rows<{ id: string; name: string; namespace: string | null }>(inst)
    .map((i) => ({
      id: String(i.id),
      nama: String(i.name),
      kode: i.namespace ? String(i.namespace) : null,
      beku: sudahTerbit.has(String(i.id)),
    }))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

// ═══════════════════════════════════════════════════════ 2. the jobs, as stored

export type RingkasPekerjaan = {
  id: string;
  institusi: string;
  state: string;
  total: number;
  dibuat: string;
  selesaiPada: string | null;
};

/**
 * EVERY JOB THIS SCHOOL HAS, NEWEST FIRST — which is the whole of the resume
 * experience's discovery half. An administrator who closed their laptop during
 * a thousand-row import comes back to this list and finds the job sitting
 * exactly where the database left it; they are never asked for the spreadsheet
 * again, because the rows are already in `import_rows`.
 *
 * Bounded by `import_jobs_select`, which is this school's only.
 */
export async function pekerjaanSekolah(institusi: string): Promise<RingkasPekerjaan[]> {
  const c = await db();
  const { data } = await c
    .from("import_jobs")
    .select("id, institution_id, state, row_count, created_at, completed_at")
    .eq("institution_id", institusi)
    .order("created_at", { ascending: false })
    .limit(20);
  return rows<{
    id: string; institution_id: string; state: string;
    row_count: number; created_at: string; completed_at: string | null;
  }>(data).map((j) => ({
    id: String(j.id),
    institusi: String(j.institution_id),
    state: String(j.state),
    total: Number(j.row_count ?? 0),
    dibuat: String(j.created_at),
    selesaiPada: j.completed_at ? String(j.completed_at) : null,
  }));
}

/**
 * THE AUTHORITATIVE PROGRESS READ, AND THE ONLY SOURCE OF A NUMBER ON SCREEN.
 *
 * `import_progress` counts from rows that committed. Nothing in WP5B adds to
 * it, interpolates between two of its answers, or keeps a running total beside
 * it — so what an administrator reads and what the database holds are the same
 * thing, including after a response was lost and the browser has no idea what
 * happened.
 *
 * Returns null for a job of another school and for a job id that is nobody's,
 * because `import_job_for_admin` raises the same sentence for both.
 */
export async function kemajuan(pekerjaan: string): Promise<Kemajuan | null> {
  const c = await db();
  const { data, error } = await c.rpc("import_progress", { p_job: pekerjaan });
  if (error || !data) return null;
  return data as Kemajuan;
}

/** WP5A's own preview, for the screen a human confirms on. Writes nothing. */
export async function pratinjau(pekerjaan: string): Promise<Record<string, unknown> | null> {
  const c = await db();
  const { data, error } = await c.rpc("import_preview", { p_job: pekerjaan });
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

export type BarisPekerjaan = {
  ordinal: number;
  state: string;
  nama: string | null;
  identitas: string | null;
  masalah: string | null;
};

/**
 * THE ROWS THEMSELVES — which is what makes the pilot checkpoint a real check
 * rather than a ceremony. An administrator asked to confirm that fifty people
 * are right has to be able to SEE the fifty and the institutional IDs PINTAR
 * generated for them; a checkpoint with nothing to inspect is a dialog box.
 *
 * `display_name` comes back out of the row's own stored payload rather than
 * from `persons`, because that is what the administrator submitted and what
 * they are checking. The institutional ID comes from the provisioned row.
 */
export async function barisPekerjaan(
  pekerjaan: string,
  opsi: { sampai?: number; keadaan?: string } = {},
): Promise<BarisPekerjaan[]> {
  const c = await db();
  let q = c
    .from("import_rows")
    .select("ordinal, state, payload, institutional_id, failure_reason")
    .eq("job_id", pekerjaan)
    .order("ordinal");
  if (opsi.sampai) q = q.lte("ordinal", opsi.sampai);
  if (opsi.keadaan) q = q.eq("state", opsi.keadaan);
  const { data } = await q.limit(200);
  return rows<{
    ordinal: number; state: string; payload: Record<string, unknown>;
    institutional_id: string | null; failure_reason: string | null;
  }>(data).map((r) => ({
    ordinal: Number(r.ordinal),
    state: String(r.state),
    nama: typeof r.payload?.display_name === "string" ? r.payload.display_name : null,
    identitas: r.institutional_id ? String(r.institutional_id) : null,
    masalah: r.failure_reason ? String(r.failure_reason) : null,
  }));
}

// ═══════════════════════════════════════════════ 3. the places a row can name

export type Tempat = {
  id: string;
  /** The place by its visible path and year (BOB-09), e.g. "SMA · Kelas X · X IPS 1 · 2026/2027". */
  nama: string;
  /** For a Bagian: its hidden Reguler, which is what `programme_id` takes. */
  program?: string;
};

/**
 * THE ORGANIZATIONAL NODES AN ADMINISTRATOR CAN PUT PEOPLE IN.
 *
 * Offered by NAME so nobody has to paste a uuid into a spreadsheet — which is
 * the only reason the mapping screen has a "one value for everyone" source at
 * all. It decides nothing: `import_row_problems` checks on every row that the
 * node belongs to this institution AND sits inside the caller's provisioning
 * scope, and it checks again at confirmation and again at provisioning time.
 *
 * ONLY BAGIAN, TINGKAT AND KELAS (BOB-09, D-006). The hidden Jenjang and
 * Reguler and the school root are never offered; each place is named by its
 * visible path and year (`pilihanTempat`), and a Bagian carries its Reguler so
 * the Program field can offer the Bagian by name.
 */
export async function tempatSekolah(institusi: string): Promise<Tempat[]> {
  return tempatSekolahDari(await db(), institusi);
}

/** `tempatSekolah` over a given client (BOB-09: driven in selftest/bob09.test.ts). */
export async function tempatSekolahDari(c: Db, institusi: string): Promise<Tempat[]> {
  const [simpul, periode] = await Promise.all([
    c.from("org_nodes")
      .select("id, name, kind, parent_id, jalur, academic_period_id, is_active")
      .eq("institution_id", institusi)
      .order("name")
      .limit(2000),
    c.from("academic_periods").select("id, name").eq("institution_id", institusi),
  ]);
  const tahun = new Map(rows<{ id: string; name: string }>(periode.data).map((p) => [String(p.id), String(p.name)]));
  return pilihanTempat(rows<SimpulPohon>(simpul.data), tahun).map((p) => ({
    id: p.id,
    nama: p.label,
    ...(p.program ? { program: p.program } : {}),
  }));
}
