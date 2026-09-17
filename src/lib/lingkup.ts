import "server-only";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * The scopes this viewer may choose between (UX-1 Slice 0, S0.6).
 *
 * IT LISTS WHAT THE DATABASE ALREADY RETURNS TO THIS VIEWER, AND NOTHING ELSE.
 * Two plain RLS selects — `org_nodes` and `classes` — under the caller's own
 * session. It never consults a role name, and it never derives a scope from
 * one: a role is display (FABLE-01 §4), and a picker built from role names
 * would be the UI deciding authority, which doc 05 forbids and INV-37 is there
 * to catch.
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
  /** The node path, outermost first. Presentation; never authority. */
  path?: string[];
};

export async function myScopes(): Promise<ScopeOption[]> {
  const db = await supabaseServer();
  const [nodes, classes] = await Promise.all([
    db.from("org_nodes").select("id, name, kind").order("name"),
    db.from("classes").select("id, name").order("name"),
  ]);

  const out: ScopeOption[] = [];
  for (const n of nodes.data ?? []) {
    out.push({ id: String(n.id), label: String(n.name), kind: "node" });
  }
  for (const c of classes.data ?? []) {
    out.push({ id: String(c.id), label: String(c.name), kind: "class" });
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
