import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicSupabaseAnonKey, publicSupabaseUrl } from "@/lib/env";
import { buildHeaders } from "@/lib/supabase/server";

/**
 * Client for the PUBLIC surface: the anon key and no session at all.
 *
 * Deliberately NOT supabaseServer(), which attaches the visitor's cookie and
 * therefore acts as `authenticated` when a signed-in user happens to open a
 * public page. The public verification route must behave identically for
 * everyone and must never borrow a visitor's privileges to answer a question
 * any stranger may ask — so the principal here is fixed at `anon`, and the
 * only thing `anon` can execute is the one projection function declared in
 * public_surface_registry (FABLE-04 §9).
 *
 * Deliberately NOT supabaseService() either: FABLE-01 §7 keeps the service
 * role inside src/app/api/, and F01-S03 enforces it.
 */
export function supabaseAnon() {
  return createClient(publicSupabaseUrl(), publicSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: buildHeaders() },
  });
}
