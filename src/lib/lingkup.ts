import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

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
  const db = await supabaseServer();
  const [nodes, classes] = await Promise.all([
    db.from("org_nodes").select("id, name, kind").order("name"),
    db.from("classes").select("node_id, subject"),
  ]);

  const subject = new Map<string, string>();
  for (const c of (classes.data ?? []) as Array<{ node_id: string; subject: string }>) {
    subject.set(String(c.node_id), String(c.subject));
  }

  const out: ScopeOption[] = [];
  for (const n of (nodes.data ?? []) as Array<{ id: string; name: string; kind: string }>) {
    const id = String(n.id);
    const isClass = n.kind === "CLASS";
    out.push({
      id,
      label: String(n.name),
      kind: isClass ? "class" : "node",
      ...(isClass && subject.has(id) ? { subject: subject.get(id) } : {}),
    });
  }
  return out;
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
