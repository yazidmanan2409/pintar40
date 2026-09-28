import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { buildSha, publicSupabaseAnonKey, publicSupabaseUrl } from "@/lib/env";
import { alamatDariCookieSesi, adalahCookieSesi, cookieYangBerubah, umurSesi } from "@/lib/sesi";

/**
 * Per-request Supabase client acting AS THE SIGNED-IN USER (anon key + the
 * user's session cookie). Every read/write goes through RLS. This is the
 * default client for pages and route handlers.
 */
export async function supabaseServer(opsi: { tulisJikaBerubah?: boolean } = {}) {
  const cookieStore = await cookies();
  return createServerClient(publicSupabaseUrl(), publicSupabaseAnonKey(), {
    global: { headers: buildHeaders() },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(semua) {
        // BOB-23: a caller that must not re-render its page writes only what a
        // write would change (see cookieYangBerubah); the default is unchanged.
        const cookiesToSet = opsi.tulisJikaBerubah
          ? cookieYangBerubah(semua, (name) => cookieStore.get(name)?.value)
          : semua;
        // BOB-05 (D-009): a signed-in session lives 60 minutes idle on a
        // classroom card, 7 days on an email account -- never the library's
        // 400 days. A deletion (maxAge 0) stays a deletion.
        const alamat = alamatDariCookieSesi(cookiesToSet);
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value,
              adalahCookieSesi(name) && alamat && options?.maxAge !== 0 ? { ...options, maxAge: umurSesi(alamat) } : options));
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
