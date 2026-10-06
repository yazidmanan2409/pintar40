import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { dalamLingkup, type Simpul } from "@/lib/mengajar";
import type { Envelope } from "@/components/bukti";
import type {
  HasilKeputusan, KeadaanKeputusan, KeluargaKeputusan, Keputusan,
} from "@/lib/pimpinan-kontrak";
import { jenisTerlihat } from "@/lib/struktur-kontrak";

/**
 * THE MANAGEMENT DATA LAYER — WP4.
 *
 * What `src/lib/pengajar.ts` is to the educator surface, this is to the
 * Management surface: one module the routes call, and no route reaching past it
 * into a table on its own.
 *
 * ═══ WHAT DECIDES WHO IS MANAGEMENT, AND IT IS NOT THIS FILE ═══
 *
 * `management_scope_over_node(node)` does. WP2 declares it: "Does the caller
 * hold an active Management role — the WP1 set, HEAD_OF_DEPARTMENT or DEAN —
 * whose assigned scope contains this node? Deliberately not a rank test:
 * INSTITUTION_ADMIN and SYSTEM_ADMIN outrank both and hold no Management
 * decision authority."
 *
 * So the gate is one backend call per candidate node, and this module reads no
 * role name anywhere — the `role` column is never selected, so it cannot. That
 * matters for more than tidiness: `metric_evaluate`'s own `allowed_audiences`
 * DOES include INSTITUTION_ADMIN for most of the catalogue, so a surface that
 * decided "is this person Management" from what the evaluator would answer
 * would hand an administrator the academic Management experience, which WP4 §3
 * forbids. The evaluator answers "may this reader see this figure". It does not
 * answer "is this reader Management", and only one function does.
 *
 * ═══ WHAT THE SCOPE LIST IS, AND WHAT IT IS NOT ═══
 *
 * `lingkupPimpinan()` returns the nodes the DATABASE confirmed. The descendants
 * in `cabang()` are then found by `jalur` containment IN POSTGRES and re-checked
 * here — the same belt-and-braces `src/lib/mengajar.ts` was built with, for the
 * same reason: a filter run in the browser over a school-wide population is
 * exactly what the WP1 ruling forbids, and a silent drop would let the query rot
 * undetected, so a leak throws.
 *
 * And it decides nothing. Every read reached from it is independently
 * authorized: `metric_evaluate` re-checks the audience and the containment,
 * `management_decisions` is bounded by its own RLS policy,
 * `management_learner_detail` refuses and audits on its own authority, and the
 * roster is `person_visible_to_me` / `membership_readable` under
 * CAN_VIEW_LEARNER_ROSTER. This module chooses what is OFFERED. It never widens
 * what is PERMITTED.
 */

export class PimpinanError extends Error {}

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = any;

async function db(): Promise<Db> {
  return (await supabaseServer()) as unknown as Db;
}

function rows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

// ═══════════════════════════════════════════════════════ 1. the Management scope

export type SimpulPimpinan = {
  id: string;
  nama: string;
  kind: string;
  institusi: string;
  /** Root-to-self, inclusive. Presentation and containment; never authority. */
  jalur: string[];
};

/**
 * THE NODES THIS READER IS MANAGEMENT OVER.
 *
 * Two steps, and the second one is the only one that decides:
 *
 *   1. CANDIDATES — the viewer's own grants. `role_assignments_select` permits
 *      `person_id = current_person_id()`, so this is the reader asking about
 *      themselves and nothing wider. The `role` column is not selected.
 *   2. THE ANSWER — `management_scope_over_node` per distinct candidate node.
 *      It applies the role set AND the active-assignment window AND the jalur
 *      containment, so none of those three is mirrored here. A revoked grant, an
 *      expired one and an educator's grant all come back false without this file
 *      knowing why, which is the point.
 *
 * An empty list means "not Management", and every Management route renders the
 * one refusal page for it. It does not mean "no data".
 */
export async function lingkupPimpinan(): Promise<SimpulPimpinan[]> {
  return lingkupPimpinanDari(await db());
}

/**
 * `lingkupPimpinan` over a given client (BOB-08: driven in selftest/bob08.test.ts).
 *
 * BOB-08 (Daisy, 25 Sep): THE CANDIDATES ARE THE GRANTS STILL IN FORCE. A
 * revoked or expired grant decided nothing -- management_scope_over_node
 * refuses it -- but its node was still offered in the picker, which then led
 * to the one refusal page. The same window the database applies is asked for
 * here: not revoked, begun, and not yet ended.
 */
export async function lingkupPimpinanDari(c: Db, kini: Date = new Date()): Promise<SimpulPimpinan[]> {
  const sekarang = kini.toISOString();
  const { data: hibah } = await c
    .from("role_assignments")
    .select("scope_node_id")
    .is("revoked_at", null)
    .lte("valid_from", sekarang)
    .gt("valid_until", sekarang);
  const kandidat = [
    ...new Set(
      rows<{ scope_node_id: string | null }>(hibah)
        .map((r) => r.scope_node_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  if (kandidat.length === 0) return [];

  const dijawab = await Promise.all(
    kandidat.map(async (id) => {
      const { data, error } = await c.rpc("management_scope_over_node", { p_node: id });
      return error ? null : data === true ? id : null;
    }),
  );
  const milik = dijawab.filter((id): id is string => id !== null);
  if (milik.length === 0) return [];

  const { data: simpul } = await c
    .from("org_nodes")
    .select("id, name, kind, institution_id, jalur")
    .in("id", milik);

  return rows<{ id: string; name: string; kind: string; institution_id: string; jalur: string[] | null }>(simpul)
    .map((n) => ({
      id: String(n.id),
      nama: String(n.name),
      kind: String(n.kind),
      institusi: String(n.institution_id),
      jalur: Array.isArray(n.jalur) ? n.jalur.map(String) : [],
    }))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

/**
 * Is this node one the reader stands over? Asked of the DATABASE, every time,
 * for every node that arrives from a URL. A hand-edited `[simpul]` segment is
 * checked here and refused by the same function that bounds the decision queue.
 */
export async function simpulDalamLingkup(node: string): Promise<SimpulPimpinan | null> {
  const c = await db();
  const { data, error } = await c.rpc("management_scope_over_node", { p_node: node });
  if (error || data !== true) return null;
  const { data: n } = await c
    .from("org_nodes")
    .select("id, name, kind, institution_id, jalur")
    .eq("id", node)
    .limit(1);
  const row = rows<{ id: string; name: string; kind: string; institution_id: string; jalur: string[] | null }>(n)[0];
  if (!row) return null;
  return {
    id: String(row.id),
    nama: String(row.name),
    kind: String(row.kind),
    institusi: String(row.institution_id),
    jalur: Array.isArray(row.jalur) ? row.jalur.map(String) : [],
  };
}

/**
 * The legitimate descendants of the scopes this reader holds — the branch of
 * the school they stand over, for navigating into.
 *
 * FILTERED IN POSTGRES (`jalur=ov.{…}`), because `org_nodes_select` is
 * `is_member_of_institution` and returns the whole school to any member of it.
 * Then re-checked here, and a node outside the scopes THROWS rather than being
 * quietly dropped: a department that is not this reader's appearing under "your
 * scope" is precisely the failure the WP1 ruling exists to prevent, and a silent
 * drop would let a regression in the query go unnoticed.
 */
export async function cabang(scopes: readonly string[]): Promise<SimpulPimpinan[]> {
  if (scopes.length === 0) return [];
  return cabangDari(await db(), scopes);
}

/** `cabang` over a given client (BOB-06: so the evidence planner can be driven in a test). */
/**
 * W11 (MGT-J05, D-006, D-027): WHERE A READER CAN GO FROM A NODE. The parts below
 * it that a screen may show (Bagian, Tingkat, Kelas), never the node itself and
 * never the hidden Jenjang or Reguler, which `cabang` returns with the rest.
 */
export function bagianDiBawah<T extends { id: string; kind: string }>(node: string, bawah: readonly T[]): T[] {
  return bawah.filter((n) => n.id !== node && jenisTerlihat(n.kind));
}

export async function cabangDari(c: Db, scopes: readonly string[]): Promise<SimpulPimpinan[]> {
  if (scopes.length === 0) return [];
  const { data } = await c
    .from("org_nodes")
    .select("id, name, kind, institution_id, jalur, is_active")
    .overlaps("jalur", [...scopes])
    .order("name");

  const out: SimpulPimpinan[] = [];
  for (const n of rows<Simpul & { institution_id: string; is_active?: boolean | null }>(data)) {
    if (!dalamLingkup(n, scopes)) {
      throw new PimpinanError("the scope read returned a node outside this reader's Management scope");
    }
    if (n.is_active === false) continue;
    out.push({
      id: String(n.id),
      nama: String(n.name),
      kind: String(n.kind),
      institusi: String(n.institution_id),
      jalur: Array.isArray(n.jalur) ? n.jalur.map(String) : [],
    });
  }
  return out;
}

// ═══════════════════════════════════════════════════════ 2. decisions awaiting

/**
 * THE DECISIONS THIS READER MAY SEE, AND THE POLICY DECIDES WHICH.
 *
 * `management_decisions_select` is `management_scope_over_node(scope_node_id) or
 * raised_by_person_id = current_person_id()`. There is no filter here beyond
 * ordering: adding a `.eq("scope_node_id", …)` would look like narrowing and
 * would in fact be second-guessing a policy that has already answered, and the
 * second disjunct — an integrity reviewer seeing what became of their own
 * referral — would be the first thing it broke.
 *
 * THE CONTEXT IS FETCHED SEPARATELY AND MAY COME BACK EMPTY. The node name and
 * the subject's name are two more RLS-bounded reads, not embedded joins: a
 * subject this reader may not see under `person_visible_to_me` simply does not
 * arrive, and the card renders without a name rather than with a placeholder
 * standing in for one.
 */
export async function keputusanSaya(): Promise<Keputusan[]> {
  const c = await db();
  const { data, error } = await c
    .from("management_decisions")
    .select(
      "id, family, state, outcome, scope_node_id, institution_id, subject_person_id, " +
        "source_table, raised_at, raised_note, decided_at, raised_by_person_id",
    )
    .order("raised_at", { ascending: true });
  if (error) throw new PimpinanError("the decision queue could not be read");

  type Baris = {
    id: string; family: string; state: string; outcome: string | null;
    scope_node_id: string; institution_id: string; subject_person_id: string | null;
    source_table: string; raised_at: string; raised_note: string | null; decided_at: string | null;
    raised_by_person_id: string;
  };
  const baris = rows<Baris>(data);
  if (baris.length === 0) return [];

  const simpulIds = [...new Set(baris.map((r) => r.scope_node_id))];
  const orangIds = [...new Set(baris.map((r) => r.subject_person_id).filter((x): x is string => !!x))];

  // CR-76 (D-123(4)): the reader's own open integrity referrals wait for another person; ask whether anyone else may decide
  const { data: saya } = await c.rpc("current_person_id");
  const milikSaya = (r: Baris) => saya != null && String(r.raised_by_person_id) === String(saya);
  const tunggu = baris.filter((r) => milikSaya(r) && r.family === "INTEGRITY_REFERRAL" && r.state !== "DECIDED");
  const lain = new Map<string, boolean | null>(await Promise.all(tunggu.map(async (r) => {
    const { data } = await c.rpc("management_decision_independent_decider", { p_decision: r.id });
    return [String(r.id), typeof data === "boolean" ? data : null] as [string, boolean | null];
  })));

  const [{ data: simpul }, orang] = await Promise.all([
    c.from("org_nodes").select("id, name").in("id", simpulIds),
    orangIds.length
      ? c.from("persons").select("id, display_name").in("id", orangIds)
      : Promise.resolve({ data: [] }),
  ]);

  const namaSimpul = new Map(
    rows<{ id: string; name: string }>(simpul).map((n) => [String(n.id), String(n.name)]),
  );
  const namaOrang = new Map(
    rows<{ id: string; display_name: string }>((orang as { data: unknown }).data)
      .map((p) => [String(p.id), String(p.display_name)]),
  );

  return baris.map((r) => ({
    id: String(r.id),
    keluarga: r.family as KeluargaKeputusan,
    keadaan: r.state as KeadaanKeputusan,
    hasil: (r.outcome as HasilKeputusan | null) ?? null,
    simpul: String(r.scope_node_id),
    simpulNama: namaSimpul.get(String(r.scope_node_id)) ?? null,
    institusi: String(r.institution_id),
    subjek: r.subject_person_id ? namaOrang.get(String(r.subject_person_id)) ?? null : null,
    sumberTabel: String(r.source_table),
    diangkatPada: String(r.raised_at),
    catatan: r.raised_note ? String(r.raised_note) : null,
    diputuskanPada: r.decided_at ? String(r.decided_at) : null,
    olehSaya: milikSaya(r),
    pemutusLain: lain.get(String(r.id)) ?? null,
  }));
}

// ═══════════════════════════════════════════════════════ 3. governed evidence

/**
 * The figures asked for at a node, and at the institution around it.
 *
 * WHICH METRICS, AND WHY THESE. The node set is what a calculator declares it
 * computes over a NODE; the tenant set is what it computes over the whole
 * school. Both are asked for because Management legitimately reads at both
 * altitudes — a dean assigned at the faculty root is permitted the institution
 * figures, a head of department standing over one department is not, and it is
 * `audience_on_node` inside the evaluator that decides which, not this list.
 *
 * NOTHING HERE COMPUTES. Every number comes back from `metric_evaluate`, which
 * re-authorizes against this reader and applies the WP1 source boundary before a
 * calculator sees a row. A figure assembled in TypeScript would be a number that
 * reached a screen without passing the catalogue.
 */
const METRIK_SIMPUL = [
  "class.participants",
  "class.comprehension",
  "class.net_gain",
  "class.readiness_distribution",
] as const;

const METRIK_INSTITUSI = [
  "institution.participants",
  "institution.net_gain",
  "institution.safety_gate_pass_rate",
  "institution.competency_outcomes",
] as const;

/**
 * A REFUSAL IS NOT RENDERED HERE, AND THAT IS THE DESIGNED BEHAVIOUR RATHER THAN
 * A GAP. `not_permitted` deliberately carries no label precisely so a refusal
 * cannot disclose what it withheld — which is why the educator's evidence screen
 * does not ask for question health at all instead of drawing a locked card for
 * it. Management asks at two altitudes and one of them is routinely not theirs,
 * so a stack of blank cards would disclose by COUNT what the missing label was
 * withholding. They are dropped, and the reader is shown what they may see.
 */
function terbaca(e: Envelope): boolean {
  return e.status !== "not_permitted" && e.status !== "unavailable";
}

export async function buktiPimpinan(node: string, institusi: string): Promise<Envelope[]> {
  return buktiPimpinanDari(await db(), node, institusi);
}

/**
 * BOB-06 (audit B6c): A CLASS FIGURE IS ASKED OF A CLASS. The class
 * calculators count the sessions whose class is exactly the node asked, so a
 * class figure asked at a department or a faculty is structurally empty and
 * read as "not enough evidence yet". At a class node the class figures are
 * asked of it, as before; anywhere else only the school's figures are asked
 * here, and the classes of the branch each answer for themselves through
 * `buktiPerKelas`. Scope is unchanged: every figure is still decided per
 * reader by `metric_evaluate`, and the classes come from `cabang`, which
 * throws on a node outside the reader's scope.
 */
function mintaDari(c: Db, institusi: string) {
  return async (metric: string, p_node: string): Promise<Envelope> => {
    const { data, error } = await c.rpc("metric_evaluate", {
      p_metric_id: metric,
      p_node,
      p_institution: institusi,
    });
    if (error) return { status: "unavailable" } as Envelope;
    return (data ?? { status: "unavailable" }) as Envelope;
  };
}

/** `buktiPimpinan` over a given client (BOB-06: driven in selftest/bob06.test.ts). */
export async function buktiPimpinanDari(c: Db, node: string, institusi: string): Promise<Envelope[]> {
  const minta = mintaDari(c, institusi);
  const { data: simpul } = await c.from("org_nodes").select("kind").eq("id", node).maybeSingle();
  const diKelas = (simpul as { kind?: string } | null)?.kind === "CLASS";
  const out = await Promise.all([
    ...(diKelas ? METRIK_SIMPUL.map((m) => minta(m, node)) : []),
    ...METRIK_INSTITUSI.map((m) => minta(m, institusi)),
  ]);
  return out.filter(terbaca);
}

/**
 * One class of the reader's branch and the class figures it answers for itself.
 * HOD-J05: `murid` is how many learners the class has now (its roster, the same
 * read as «Murid pada bagian ini»), so «Peserta» is read against the class; null
 * when the roster could not be read. Never subtracted from a figure: the
 * figures pool every official session, the roster is today's.
 */
export type BuktiKelas = { kelas: SimpulPimpinan; bukti: Envelope[]; murid: number | null };

/**
 * BOB-06 (B6c): THE CLASS FIGURES OF EACH CLASS IN THIS BRANCH, asked of that
 * class. The node itself when it is a class; otherwise every active class
 * below it that `cabang` returns, in its order. A class none of whose figures
 * the reader may see comes back with an empty list, so a screen can say so
 * per class rather than count what was withheld. Nothing is summed across
 * classes (WP7C: nothing here adds two classes together).
 */
export async function buktiPerKelas(node: string): Promise<BuktiKelas[]> {
  return buktiPerKelasDari(await db(), node);
}

export async function buktiPerKelasDari(c: Db, node: string): Promise<BuktiKelas[]> {
  const kelas = (await cabangDari(c, [node])).filter((n) => n.kind === "CLASS");
  return Promise.all(
    kelas.map(async (k) => {
      const minta = mintaDari(c, k.institusi);
      const [bukti, murid] = await Promise.all([
        Promise.all(METRIK_SIMPUL.map((m) => minta(m, k.id))),
        daftarMuridDari(c, k.id).then((d) => d.length, () => null),
      ]);
      return { kelas: k, bukti: bukti.filter(terbaca), murid };
    }),
  );
}

// ═══════════════════════════════════════════════════════ 4. roster, then one

export type MuridDalamLingkup = { id: string; nama: string; simpul: string };

/**
 * LEVEL 2 — the roster, which is not an individual act.
 *
 * Three RLS-bounded reads and no RPC: `membership_readable`,
 * `enrollment_readable` and `person_visible_to_me` all honour
 * CAN_VIEW_LEARNER_ROSTER, which DEAN and HEAD_OF_DEPARTMENT hold over their own
 * assigned subtree. A learner in the next department does not come back, and
 * this module does not have to know that.
 *
 * NO RESULT, NO MASTERY, NO ORDER BUT THE ALPHABET. A roster that arrived
 * pre-sorted by how learners are doing would be a ranking wearing a list's
 * clothes, and the individual record is Level 3 — it is not read to render a
 * list, which is why nothing here touches `management_learner_detail`.
 */
export async function daftarMurid(node: string): Promise<MuridDalamLingkup[]> {
  return daftarMuridDari(await db(), node);
}

/**
 * W10 (HOD-J06): THE ROSTER OF A PART OF THE SCHOOL IS EVERY CLASS BELOW IT.
 * Learners are members of classes, never of a department, so a roster that
 * matched the node exactly read «Belum ada murid…» for every department. The
 * branch comes from `cabangDari`, which throws on a node outside the reader's
 * scope; the reads stay RLS-bounded as above, and a learner in two classes of
 * the branch is listed once. Only open memberships count, as on the teacher's
 * roster (pengajar.ts) and Aktivasi.
 */
export async function daftarMuridDari(c: Db, node: string): Promise<MuridDalamLingkup[]> {
  const simpul = [...new Set([node, ...(await cabangDari(c, [node])).map((n) => n.id)])];
  // a closed membership (valid_to set) is a class the learner has left. BOB-45 (D-069(b)G): «Murid pada bagian ini»
  // lists learners only -- a place for educators' professional learning holds participants, who are seen on its
  // professional-learning record instead (D-070(a)); the place's kind is the database's (member_kind)
  const { data: anggota } = await c
    .from("memberships")
    .select("enrollment_id, node_id, node:org_nodes(member_kind)")
    .in("node_id", simpul)
    .is("valid_to", null);
  const enrolIds = [
    ...new Set(rows<{ enrollment_id: string; node: { member_kind: string | null } | null }>(anggota)
      .filter((m) => m.node?.member_kind !== "PARTICIPANT")
      .map((m) => String(m.enrollment_id))),
  ];
  if (enrolIds.length === 0) return [];

  const { data: daftar } = await c
    .from("enrollments")
    .select("id, person_id, status")
    .in("id", enrolIds);
  // still enrolled: PENDING (recorded, not yet signed in) or ACTIVE, as the teacher's roster counts them
  const aktif = rows<{ id: string; person_id: string; status: string }>(daftar)
    .filter((e) => e.status === "PENDING" || e.status === "ACTIVE");
  const orangIds = [...new Set(aktif.map((e) => String(e.person_id)))];
  if (orangIds.length === 0) return [];

  const { data: orang } = await c
    .from("persons")
    .select("id, display_name")
    .in("id", orangIds);

  return rows<{ id: string; display_name: string }>(orang)
    .map((p) => ({ id: String(p.id), nama: String(p.display_name), simpul: node }))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

/** One learner's record as `management_learner_detail` returns it. */
export type RincianMurid = {
  person_id: string;
  display_name: string | null;
  enrolment_status: string | null;
  academic_period: string | null;
  programme: string | null;
  placement: Array<{ node_id: string; kind: string; name: string }>;
  /**
   * D-088(i): the places the learner has left, each with its year, dates and why it ended. `placement` above is
   * where the learner is now (open placements only); an ended one is never shown as current.
   */
  placement_history?: Array<{ node_id: string; kind: string; name: string; academic_year: string | null; from: string; until: string; reason: string | null }>;
  official_results: Array<{ mode?: string; mastery?: number | null; safety_gate_passed?: boolean | null }>;
  /** R5, carried by the record too, computed against the same governed minimum. */
  official_results_readiness?: string;
  catalogue_version: string | null;
};

/**
 * LEVEL 3 — one named learner, opened on purpose.
 *
 * THROUGH THE ENDPOINT, WHICH IS WHAT MAKES IT DELIBERATE. WP1 is explicit that
 * a row predicate cannot tell a roster read from opening a person, so this is an
 * RPC and arriving through it IS the act. It authorizes on its own
 * (`audience_scope_over_learner` over the WP1 role set), reads the academic
 * record inside the boundary that authorized the reader, and writes
 * `learner_detail.opened` in the same transaction — so a returned record and a
 * recorded open cannot come apart.
 *
 * NOTHING IS ADDED TO IT HERE. No approval dialog, no purpose code, no
 * justification field: the ruling says the opening needs none of those, and a
 * form asking for one would be this surface inventing a governance step the
 * product deliberately does not have. A refusal returns null and the route
 * renders the one refusal page — the same page an out-of-scope node renders, so
 * "not yours" and "not there" are indistinguishable from outside.
 */
export async function rincianMurid(orang: string, institusi: string): Promise<RincianMurid | null> {
  const c = await db();
  const { data, error } = await c.rpc("management_learner_detail", {
    p_person: orang,
    p_institution: institusi,
  });
  if (error || !data) return null;
  return data as RincianMurid;
}
