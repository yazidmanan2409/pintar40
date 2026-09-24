/**
 * THE TEACHING CONTEXT, AND WHAT IT IS NOT.
 *
 * UX-1 Slice 3 rests on a distinction the platform draws and the previous
 * scope picker did not:
 *
 *     VISIBLE TO ACCOUNT  ≠  SELECTED TEACHING CONTEXT  ≠  AUTHORIZATION
 *
 * `org_nodes_select` and `classes_select` are `is_member_of_institution(...)`
 * (20260912004431_authorization.sql:292-293, 300-301), so the database returns
 * EVERY node and EVERY class in the school to any member of it — a learner
 * included. A screen that listed them under "the classes you may see" would be
 * claiming a boundary the database does not draw, which is the claim the Slice-3
 * ruling forbids.
 *
 * So the teaching context is derived from the one thing that IS bounded: the
 * educator's OWN role grants. `role_assignments_select` permits
 * `person_id = current_person_id()` (:336-338), and each grant carries the
 * `scope_node_id` the school attached it to. A class is in the teaching context
 * when it sits inside one of those grants' subtrees — the same containment test
 * `has_scope()` itself performs (`v_jalur @> array[ra.scope_node_id]`, :70), on
 * the same column.
 *
 * NO ROLE NAME IS READ ANYWHERE IN THIS MODULE. `src/lib/lingkup.ts` is right
 * that a picker built from role names would be the UI deciding authority. This
 * one is built from the GRANT'S TARGET NODE, which is a fact about where the
 * school put you, not a label the UI is interpreting. The `role` column is not
 * selected, so it cannot be.
 *
 * AND IT DECIDES NOTHING. Every action reached from this context is
 * independently authorized server-side and would be refused without this module
 * agreeing: `can_on_node('CAN_QUICK_ASSESSMENT', node)` for a quick assessment,
 * `can_in_institution('CAN_ASSIGN_LEARNING', inst)` for an assignment or an
 * extension, `metric_evaluate`'s own `allowed_audiences` check for evidence.
 * This module chooses what is OFFERED. It never widens what is PERMITTED, and
 * INV-37 is unaffected: security stays at the server/data boundary.
 *
 * WHY THE PREDICATE IS ALSO WRITTEN HERE, when the query already applies it.
 * The read below filters IN POSTGRES (`jalur=ov.{…}`), because a filter run in
 * the browser over a school-wide population is exactly what the ruling forbids.
 * `dalamLingkup` then re-checks what came back and the caller refuses outright
 * if anything outside the grants survived — the same belt-and-braces shape
 * `sanitize()` uses in the assessment engine, where the database has already
 * projected and TypeScript re-projects so that a regression in the query
 * surfaces as a thrown error instead of as a row on a screen.
 *
 * This module is pure. The reads that use it live in `src/lib/pengajar.ts`.
 */

/** A grant, as this module reads it: the target node, and nothing else. */
export type Hibah = {
  scope_node_id: string | null;
  institution_id: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  revoked_at?: string | null;
};

/** An org node, as this module reads it. `jalur` is root-to-self, inclusive. */
export type Simpul = {
  id: string;
  name: string;
  kind: string;
  jalur: string[] | null;
  is_active?: boolean | null;
  institution_id: string;
  academic_period_id?: string | null;
};

/** A class inside the teaching context. */
export type KelasMengajar = {
  id: string;
  nama: string;
  institusi: string;
  periode: string | null;
};

export class LingkupError extends Error {}

/**
 * The grants that are live right now. RLS bounds WHOSE grants come back; it
 * does not bound WHEN, because the policy asks about the person and not about
 * the clock. An expired or revoked grant is not a teaching context.
 */
export function hibahAktif(rows: readonly Hibah[], now: Date = new Date()): Hibah[] {
  const t = now.getTime();
  return rows.filter((r) => {
    if (r.revoked_at != null) return false;
    if (r.scope_node_id == null) return false;
    const from = r.valid_from ? Date.parse(r.valid_from) : Number.NEGATIVE_INFINITY;
    const until = r.valid_until ? Date.parse(r.valid_until) : Number.POSITIVE_INFINITY;
    return t >= from && t < until;
  });
}

/** The distinct scope nodes those grants point at. */
export function nodeLingkup(rows: readonly Hibah[], now?: Date): string[] {
  return [...new Set(hibahAktif(rows, now).map((r) => String(r.scope_node_id)))];
}

/**
 * THE CONTAINMENT PREDICATE, mirroring `v_jalur @> array[ra.scope_node_id]`.
 *
 * `jalur` is the ancestor path from the institution root down to AND INCLUDING
 * the node itself (20260912004244_organisation.sql:52, 83, 92), so a grant on a
 * class contains that class, and a grant on a department contains every class
 * beneath it. A node with no path is not in anyone's scope: fail closed, the
 * same way every authorization primitive in this codebase does.
 */
export function dalamLingkup(node: Pick<Simpul, "jalur">, lingkup: readonly string[]): boolean {
  const jalur = node.jalur;
  if (!Array.isArray(jalur) || jalur.length === 0) return false;
  return lingkup.some((s) => jalur.includes(s));
}

/**
 * The classes of the teaching context, in reading order.
 *
 * THIS IS THE RE-CHECK, NOT THE FILTER. The query already applied the same
 * containment in Postgres. Anything here that is outside the grants means the
 * query stopped doing its job, and a class from another teacher's department
 * rendering under "your teaching scope" is precisely the failure the whole
 * module exists to prevent — so it throws rather than quietly dropping the row,
 * because a silent drop would let the query rot undetected.
 */
export function kelasDalamLingkup(
  nodes: readonly Simpul[],
  lingkup: readonly string[],
): KelasMengajar[] {
  const out: KelasMengajar[] = [];
  for (const n of nodes) {
    if (n.kind !== "CLASS") {
      throw new LingkupError(`the class read returned a ${n.kind} node`);
    }
    if (!dalamLingkup(n, lingkup)) {
      throw new LingkupError("the class read returned a node outside this person's grants");
    }
    if (n.is_active === false) continue;
    out.push({
      id: n.id,
      nama: n.name,
      institusi: n.institution_id,
      periode: n.academic_period_id ?? null,
    });
  }
  return out.sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}
