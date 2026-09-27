import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";

export type DisplayRole =
  | "STUDENT" | "EDUCATOR" | "HEAD_OF_DEPARTMENT" | "DEAN" | "INSTITUTION_ADMIN" | "SYSTEM_ADMIN" | null;

export type Viewer = {
  authUserId: string;
  personId: string | null;
  displayName: string | null;
  displayRole: DisplayRole;
};

/**
 * Who is signed in, as the database sees them (my_profile view under RLS).
 * `displayRole` is display only — never used as authority (FABLE-01 §4).
 *
 * ONCE PER REQUEST (BOB-18, D-046). A layout, its page and the session strip
 * each ask; React's `cache` answers the second and third from the first, so a
 * click asks Auth for the user and reads the profile once. The cache lives
 * for one server render and is never shared between requests or people.
 */
export const currentViewer = cache(async (): Promise<Viewer | null> => viewerDari(await supabaseServer()));

/** `currentViewer` over a given client (BOB-18: driven in selftest/bob18.test.ts). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function viewerDari(supabase: any): Promise<Viewer | null> {
  // No session cookie, no call: an anonymous page asks Supabase nothing. This
  // reads the cookie and decides nothing -- `getUser` below is the check.
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  // With a session, the check and the profile go side by side: my_profile is
  // read under the same session's RLS and needs nothing from the check but
  // the cookie both carry. A session Auth refuses gets null either way.
  const [{ data: { user } }, { data }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("my_profile").select("person_id, display_name, display_role").maybeSingle(),
  ]);
  if (!user) return null;
  return {
    authUserId: user.id,
    personId: data?.person_id ?? null,
    displayName: data?.display_name ?? null,
    displayRole: (data?.display_role as DisplayRole) ?? null,
  };
}

/** Authority checks always go to the shared database primitives (doc 05). Asked once per request. */
export const isSystemAdmin = cache(async (): Promise<boolean> => {
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("is_system_admin");
  return data === true;
});

export async function hasScope(minRole: Exclude<DisplayRole, null>, nodeId: string): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("has_scope", { p_min_role: minRole, p_node: nodeId });
  return data === true;
}

export async function canOnNode(capability: string, nodeId: string): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("can_on_node", { p_capability: capability, p_node: nodeId });
  return data === true;
}
