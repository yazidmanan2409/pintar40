import "server-only";
import { supabaseServer } from "@/lib/supabase/server";
import { pilihanTempat, type SimpulPohon } from "@/lib/struktur-kontrak";

/**
 * The scopes this ACCOUNT may see (UX-1 Slice 0, S0.6).
 *
 * IT LISTS WHAT THE DATABASE ALREADY RETURNS TO THIS VIEWER, AND NOTHING ELSE.
 * Two plain RLS selects under the caller's own session. It never consults a role
 * name, and it never derives a scope from one: a role is display (FABLE-01 §4),
 * and a picker built from role names would be the UI deciding authority, which
 * doc 05 forbids and INV-37 is there to catch.
 *
 * WHAT THAT ACTUALLY RETURNS, MEASURED (UX-1 Slice 3). `org_nodes_select` and
 * `classes_select` are both `is_member_of_institution(...)`
 * (20260912004431_authorization.sql:292-293, 300-301). They are bounded by the
 * SCHOOL, not by the viewer's own grants — a learner is a member too and gets
 * the same list. So this is "everything your account may read", which is a
 * legitimate thing to offer a picker and is NOT a teaching context and NOT an
 * authorization boundary. A surface that needs "the classes I teach" must not
 * use this: `src/lib/mengajar.ts` derives that from the viewer's own
 * `role_assignments`, and Slice 3's copy says which of the two it is showing.
 *
 * `classes` IS KEYED ON `node_id`. It has no `id` and no `name` column
 * (20260912004244_organisation.sql:145-152): the name belongs to the org node,
 * and the class row carries the subject and the lifecycle status. This function
 * asked it for `id, name` from Slice 0 until Slice 3's reconciliation measured
 * the table — the read could not succeed and the picker was quietly fed by the
 * `org_nodes` select alone. It now reads the columns that exist and uses them
 * for what they are: the subject annotates the CLASS node that already carries
 * the name, rather than being emitted as a second option for the same place.
 *
 * SLUGS ARE PRESENTATION AND NEVER AN EXISTENCE ORACLE. A node this viewer may
 * not read simply does not come back from the select, so an unauthorized slug
 * and a nonexistent one arrive at the same page in the same state and the
 * surface renders the same refusal for both — the single refusal page of P7,
 * which is why it has no slot for a reason.
 */
export type ScopeOption = {
  id: string;
  label: string;
  kind: "node" | "class";
  /** The class's subject, when the node is a class. Presentation only. */
  subject?: string;
  /** The node path, outermost first. Presentation; never authority. */
  path?: string[];
};

export async function myScopes(): Promise<ScopeOption[]> {
  return myScopesDari(await supabaseServer());
}

/**
 * `myScopes` over a given client (BOB-09: driven in selftest/bob09.test.ts).
 *
 * ONLY BAGIAN, TINGKAT AND KELAS, LABELLED BY PATH (D-006). The school root and
 * the hidden Jenjang and Reguler are never offered; the label is the visible
 * path and year from `pilihanTempat`, the same rule the intake uses.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function myScopesDari(db: any): Promise<ScopeOption[]> {
  const [nodes, periods, classes] = await Promise.all([
    db.from("org_nodes").select("id, name, kind, parent_id, jalur, academic_period_id, is_active").order("name"),
    db.from("academic_periods").select("id, name"),
    db.from("classes").select("node_id, subject"),
  ]);

  const subject = new Map<string, string>();
  for (const c of (classes.data ?? []) as Array<{ node_id: string; subject: string }>) {
    subject.set(String(c.node_id), String(c.subject));
  }
  const year = new Map<string, string>();
  for (const p of (periods.data ?? []) as Array<{ id: string; name: string }>) year.set(String(p.id), String(p.name));

  return pilihanTempat((nodes.data ?? []) as SimpulPohon[], year).map((p) => {
    const isClass = p.level === "KELAS";
    return {
      id: p.id,
      label: p.label,
      kind: isClass ? "class" : "node",
      ...(isClass && subject.has(p.id) ? { subject: subject.get(p.id) } : {}),
      path: p.jalur,
    };
  });
}

/**
 * Resolve a chosen scope. Returns null for a scope this viewer cannot see —
 * which, per the note above, covers "not yours" and "not there" identically.
 */
export async function resolveScope(id: string | undefined): Promise<ScopeOption | null> {
  if (!id) return null;
  const all = await myScopes();
  return all.find((s) => s.id === id) ?? null;
}
