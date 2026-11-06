/**
 * W9.19 (CAP-09; U-PERF, W6.2): WHO IS SIGNED IN, AS THE PROXY ASKS IT ON EVERY REQUEST.
 *
 * The proxy used to ask Auth's server (`getUser()`, GET /auth/v1/user) on every request, prefetches included. On
 * staging that was the largest cost left in a page load. The proxy runs near the requester, so from GitHub's runner
 * the call crossed the Pacific: p50 733 ms through IAD, against 16 ms through SIN (journey run 42174494519, 6 Nov).
 *
 * Here the session's access token is verified instead (`getClaims()`):
 * - **Asymmetric signing key (ES256, RS256):** verified locally against the project's published keys, fetched from
 *   /auth/v1/.well-known/jwks.json and cached; no call to Auth per request.
 * - **Symmetric secret (HS256), or no WebCrypto:** auth-js asks Auth's server about the token (`getUser(token)`), so
 *   it is never weaker than before.
 * - **Expired:** an expired token is refreshed first, as `getUser()` did, and the new cookies reach the response
 *   through the same cookie adapter.
 * - **Refused:** a token whose signature does not verify, or that names no subject, is nobody: the proxy treats the
 *   request as signed out.
 *
 * What it does not decide:
 * - **Whether the session is still alive.** That stays the database's answer. `sesi_periksa` is asked on every
 *   signed-in request but a prefetch, and answers a session ended («Keluar», «Keluar semua», the 60-minute and
 *   3-PIN ends) as BERAKHIR, and a locked one as TERKUNCI.
 * - **Access to data.** PostgREST verifies the same token on every read and write, and every policy still decides.
 *   The proxy is a router, not the boundary.
 *
 * Only the fields the proxy reads are returned: the person's auth id (`sub`) and their address.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type PenggunaProksi = { id: string; email: string | undefined };

export async function penggunaTerverifikasi(supabase: Pick<SupabaseClient, "auth">): Promise<PenggunaProksi | null> {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data) return null;
  const klaim = data.claims as { sub?: unknown; email?: unknown };
  if (typeof klaim.sub !== "string" || klaim.sub === "") return null;
  return { id: klaim.sub, email: typeof klaim.email === "string" ? klaim.email : undefined };
}
