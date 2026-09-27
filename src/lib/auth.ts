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
export const currentViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("my_profile").select("person_id, display_name, display_role").maybeSingle();
  return {
    authUserId: user.id,
    personId: data?.person_id ?? null,
    displayName: data?.display_name ?? null,
    displayRole: (data?.display_role as DisplayRole) ?? null,
  };
});

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
