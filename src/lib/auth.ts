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
 */
export async function currentViewer(): Promise<Viewer | null> {
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
}

/** Authority checks always go to the shared database primitives (doc 05). */
export async function isSystemAdmin(): Promise<boolean> {
  const supabase = await supabaseServer();
  const { data } = await supabase.rpc("is_system_admin");
  return data === true;
}

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
