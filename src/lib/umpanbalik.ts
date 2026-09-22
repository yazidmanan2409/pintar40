import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { bacaHasil, type Hasil, type Kuesioner, type Pertanyaan } from "@/lib/umpanbalik-kontrak";

/**
 * THE FEEDBACK DATA LAYER — WP7C.
 *
 * ═══ FOUR READS, AND NOT ONE OF THEM DECIDES ANYTHING ═══
 *
 * WP7B authorizes every one of them, in the database, from the caller's own
 * session:
 *
 *   my_feedback_cycles()      takes no person — the person IS the session —
 *                             and returns the caller's own open cycles with
 *                             their own answered state. No peer, no list of who
 *                             responded, no count of any kind.
 *   feedback_questionnaire()  refuses anyone the cycle did not ask, in the same
 *                             sentence it uses for a cycle that does not exist.
 *   feedback_cycles           RLS: the subject of the cycle, or Management over
 *                             its class. Not the learners. Not the institution's
 *                             administrator.
 *   feedback_result()         the ONE path from a cycle to a number, and the one
 *                             place that decides whether a reader may have it.
 *
 * So there is no gate in this file and there could not be a useful one. What
 * this module chooses is what is OFFERED; what is PERMITTED was settled before
 * the call returned. The lesson WP6 paid for: presentation context is not
 * entitlement.
 *
 * ═══ THE TABLE THAT IS NOT IMPORTED ═══
 *
 * `feedback_responses` appears nowhere in this file, in any component, or in
 * any route. It carries no person and no clock, so reading it would leak
 * nothing by itself — and it is still never read, because the moment a surface
 * aggregates raw answers it has built a second, ungoverned path to a number
 * that no threshold stands in front of. The published snapshot is computed once
 * at close, by the endpoint, and is the only aggregate that exists.
 * UX1-UB-MENTAH-01 asserts this across the whole tree.
 *
 * ═══ AND NO COUNT IS EVER ASKED FOR ═══
 *
 * There is no `count` in this module. Not of opportunities, not of responses,
 * not of who has answered — not even one the surface would throw away. A
 * running total is the differencing attack the whole architecture exists to
 * prevent, and the safest place for it not to exist is at the point where a
 * query would have been written.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Db = any;

async function db(): Promise<Db> {
  return (await supabaseServer()) as unknown as Db;
}

function rows<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : data == null ? [] : [data as T];
}

// ─────────────────────────────────────────────────────────── the learner
export type SiklusSaya = {
  id: string;
  kelas: string | null;
  guru: string | null;
  sudahDijawab: boolean;
};

/**
 * The open cycles this learner was asked to answer, and whether they already
 * have. Empty for everybody else — including an educator who teaches the class,
 * who has no opportunity row and therefore no cycle of their own here.
 *
 * NOTE WHAT IS ABSENT FROM THE RETURN. No classmate, no participation, no
 * count, no ordering by time. The endpoint orders by class and educator name,
 * which carries nothing about when anybody answered.
 */
export async function siklusSaya(): Promise<SiklusSaya[] | null> {
  const c = await db();
  const { data, error } = await c.rpc("my_feedback_cycles");
  // NULL WHEN IT COULD NOT ASK, and an empty array when the answer is "none".
  // The submission path needs those apart: after an uncertain press, "you have
  // no open cycles" and "I could not reach the database" lead to opposite
  // things being said to a learner.
  if (error) return null;
  return rows<Record<string, unknown>>(data).map((r) => ({
    id: String(r.cycle_id),
    kelas: (r.class_name as string) ?? null,
    guru: (r.subject_name as string) ?? null,
    sudahDijawab: r.already_answered === true,
  }));
}

/**
 * The governed sheet one eligible learner is being asked, as keys. Null when
 * the endpoint refused — which it does in one sentence for a cycle that does
 * not exist, one that is not theirs, and one that has closed, so this layer
 * cannot tell those apart either and the surface offers the same calm page.
 * That indistinguishability is the point: it is what stops this endpoint being
 * used to discover that a class is being asked about its teacher.
 */
export async function kuesioner(siklus: string): Promise<Kuesioner | null> {
  const c = await db();
  const { data, error } = await c.rpc("feedback_questionnaire", { p_cycle: siklus });
  if (error || !data) return null;
  const p = data as Record<string, unknown>;
  const mentah = Array.isArray(p.questions) ? (p.questions as unknown[]) : [];
  const questions: Pertanyaan[] = mentah.flatMap((e) => {
    const q = (e ?? {}) as Record<string, unknown>;
    if (typeof q.question_key !== "string" || typeof q.label_key !== "string") return [];
    const opsi = Array.isArray(q.options) ? (q.options as unknown[]) : [];
    return [{
      question_key: q.question_key,
      label_key: q.label_key,
      ordinal: Number(q.ordinal) || 0,
      options: opsi.flatMap((o) => {
        const x = (o ?? {}) as Record<string, unknown>;
        if (typeof x.option_key !== "string" || typeof x.label_key !== "string") return [];
        return [{ option_key: x.option_key, label_key: x.label_key, ordinal: Number(x.ordinal) || 0 }];
      }),
    }];
  });
  if (questions.length === 0) return null;
  return {
    cycle_id: String(p.cycle_id ?? siklus),
    class_name: (p.class_name as string) ?? null,
    subject_name: (p.subject_name as string) ?? null,
    already_answered: p.already_answered === true,
    questions,
  };
}

// ────────────────────────────────────── who a class may be asked about
export type SubjekKelas = { id: string; nama: string };

/**
 * The educators an authorized Management caller may open a round about, for
 * ONE class. Two columns and nothing else — no email, no account, no
 * institutional identity, no enrolment, no other role, no cycle, no
 * participation, no count.
 *
 * ═══ IT IS A FEEDBACK CONTRACT, NOT A STAFF DIRECTORY ═══
 *
 * ADR-0023 §Decision 1 refused the one-line version of this — teaching
 * `person_visible_to_me` about educators — because a learner-visibility
 * predicate that starts answering about colleagues is a different product
 * decision reached by accident, and it would have widened every surface that
 * predicate governs. So this asks one question, for one class, of the role set
 * that operates the cycle, and the answer is useful for nothing else.
 *
 * ═══ AND IT AUTHORIZES NOTHING ═══
 *
 * `feedback_subjects_for_class` refuses a non-Management caller in the same
 * sentence `open_feedback_cycle` uses, and reads the SAME subject rule the
 * endpoint enforces — one rule, read twice, so the two cannot drift. A row
 * here is a description of the world a moment ago, never a claim about what
 * will be permitted: opening re-authorizes and re-validates independently, and
 * this layer holds no token and caches nothing.
 *
 * NULL WHEN IT COULD NOT ASK — a caller who is not Management over this class,
 * or a read that failed — and an empty array when the honest answer is "nobody".
 * The surface needs those apart: "you may not ask" and "there is no one to ask
 * about" are different sentences.
 */
export async function subjekKelas(node: string): Promise<SubjekKelas[] | null> {
  const c = await db();
  const { data, error } = await c.rpc("feedback_subjects_for_class", { p_node: node });
  if (error) return null;
  return rows<Record<string, unknown>>(data).flatMap((r) => {
    const id = r.person_id == null ? "" : String(r.person_id);
    if (!id) return [];
    return [{ id, nama: String(r.display_name ?? "") }];
  });
}

// ──────────────────────────────────────────── the subject, and Management
export type SiklusKelas = {
  id: string;
  keadaan: string;
  kelas: string;
  guru: string | null;
  /** The teaching relationship the cycle asserts, for naming the subject. */
  guruId: string;
};

/**
 * The cycles over one or more classes, as RLS hands them back.
 *
 * WHO GETS WHAT IS THE POLICY'S ANSWER: `subject_person_id = current_person_id()
 * or management_scope_over_node(scope_node_id)`. An educator therefore receives
 * their own cycles and no colleague's; a head of department receives the ones
 * over classes in their scope; an institution's administrator receives none,
 * because administering a school is not being told what its children said about
 * a named teacher. This function passes a node filter for PRESENTATION — which
 * page you are on — and the policy decides the rest.
 *
 * THE COLUMNS ARE CHOSEN, NOT SELECTED WHOLE. `opened_at`, `closed_at`,
 * `opened_by_person_id` and `threshold_version` are all readable here and none
 * of them is asked for: a chronology is not needed to render a state, and the
 * threshold version is a label whose only job in this product is to be the
 * number's hiding place.
 */
export async function siklusKelas(nodes: readonly string[]): Promise<SiklusKelas[]> {
  if (nodes.length === 0) return [];
  const c = await db();
  const { data, error } = await c
    .from("feedback_cycles")
    .select("id, state, scope_node_id, subject_person_id")
    .in("scope_node_id", nodes);
  if (error) return [];
  const mentah = rows<Record<string, unknown>>(data);
  if (mentah.length === 0) return [];

  const orang = [...new Set(mentah.map((r) => String(r.subject_person_id)))];
  const simpul = [...new Set(mentah.map((r) => String(r.scope_node_id)))];
  const [{ data: p }, { data: n }, subjek] = await Promise.all([
    c.from("persons").select("id, display_name").in("id", orang),
    c.from("org_nodes").select("id, name").in("id", simpul),
    // THE GOVERNED IDENTITY, ONE CALL PER CLASS THAT ACTUALLY HAS A ROUND —
    // bounded by the rounds on this page rather than by the classes in scope.
    Promise.all(simpul.map((x) => subjekKelas(x))),
  ]);
  const kelas = new Map(rows<Record<string, unknown>>(n).map((x) => [String(x.id), String(x.name ?? "")]));

  // WHERE THE SUBJECT'S NAME COMES FROM, AND WHY IT IS TWO SOURCES.
  //
  // The feedback contract is preferred: `feedback_subjects_for_class` exists to
  // give this Experience the display identity it needs, and it is the reason a
  // Management reader no longer meets an em dash where a teacher's name belongs.
  // ADR-0023's own gap table is the record of why `persons` alone was never
  // enough — it is learner-shaped, and it answered about the first educator this
  // path met only because that fixture happened to enrol them as a learner too.
  //
  // `persons` is kept BENEATH it rather than removed, for two honest reasons:
  // an educator whose assignment has since ended is no longer a candidate and
  // the contract has nothing to say about them (ADR-0023's carried residual),
  // and this same function serves the SUBJECT's own view of their round, where
  // the Management-only discovery call is refused. Neither source widens
  // anything: both are RLS-governed and return only what this reader may
  // already see. Where both are silent the em dash stands, which is the honest
  // answer rather than a guess.
  const nama = new Map(rows<Record<string, unknown>>(p).map((x) => [String(x.id), String(x.display_name ?? "")]));
  for (const daftar of subjek) {
    for (const orangnya of daftar ?? []) {
      if (orangnya.nama) nama.set(orangnya.id, orangnya.nama);
    }
  }

  return mentah
    .map((r) => ({
      id: String(r.id),
      keadaan: String(r.state ?? ""),
      kelas: kelas.get(String(r.scope_node_id)) ?? "",
      guru: nama.get(String(r.subject_person_id)) ?? null,
      guruId: String(r.subject_person_id),
    }))
    .sort((a, b) => a.kelas.localeCompare(b.kelas) || (a.guru ?? "").localeCompare(b.guru ?? ""));
}

/** One cycle, if this reader may see that it exists at all. */
export async function siklus(id: string): Promise<SiklusKelas | null> {
  const c = await db();
  const { data, error } = await c
    .from("feedback_cycles")
    .select("id, state, scope_node_id, subject_person_id")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const r = data as Record<string, unknown>;
  const [{ data: p }, { data: n }] = await Promise.all([
    c.from("persons").select("display_name").eq("id", String(r.subject_person_id)).maybeSingle(),
    c.from("org_nodes").select("name").eq("id", String(r.scope_node_id)).maybeSingle(),
  ]);
  return {
    id: String(r.id),
    keadaan: String(r.state ?? ""),
    kelas: String((n as Record<string, unknown> | null)?.name ?? ""),
    guru: ((p as Record<string, unknown> | null)?.display_name as string) ?? null,
    guruId: String(r.subject_person_id),
  };
}

/**
 * THE ONLY PATH FROM A CYCLE TO A NUMBER, and this layer adds nothing to it.
 * `feedback_result` withholds every figure while the cycle is open and forever
 * if it closed below the anonymity threshold, returning a statement key in its
 * place; a refusal reaches here as an error and becomes the withheld case,
 * which carries no figure either. There is no shape this function can return
 * that has a number in it unless the database published one.
 */
export async function hasil(siklusId: string): Promise<Hasil> {
  const c = await db();
  const { data, error } = await c.rpc("feedback_result", { p_cycle: siklusId });
  if (error) return bacaHasil(null);
  return bacaHasil(data);
}
