import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { buildSha, publicSupabaseAnonKey, publicSupabaseUrl } from "@/lib/env";

/**
 * Per-request Supabase client acting AS THE SIGNED-IN USER (anon key + the
 * user's session cookie). Every read/write goes through RLS. This is the
 * default client for pages and route handlers.
 */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(publicSupabaseUrl(), publicSupabaseAnonKey(), {
    global: { headers: buildHeaders() },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; the proxy refreshes sessions.
        }
      },
    },
  });
}

/** Provenance header for audit rows; absent when no build SHA is configured. */
export function buildHeaders(): Record<string, string> {
  const sha = buildSha();
  return sha && /^[0-9a-f]{7,40}$/.test(sha) ? { "x-pintar-build": sha } : {};
}
