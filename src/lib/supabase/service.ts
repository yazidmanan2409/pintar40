import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicSupabaseUrl, serviceRoleKey } from "@/lib/env";

/**
 * Privileged client (service_role). Server-only by the "server-only" import
 * guard — bundling this into a client component fails the build. Used ONLY
 * for the operations doc 05 lists as service-role-only (signed upload URLs,
 * signed read URLs). Never for reads on behalf of a user: those go through
 * supabaseServer() and RLS.
 */
export function supabaseService() {
  return createClient(publicSupabaseUrl(), serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
