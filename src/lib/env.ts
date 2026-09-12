// Environment contract. Fails loud at boot for anything security-relevant.
// Service-role and pepper values are server-only and never imported by
// client components (see selftest bundle scan, INV-37).

export const isDevelopment = process.env.NODE_ENV === "development";

export function publicSupabaseUrl(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!v) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  return v;
}

export function publicSupabaseAnonKey(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!v) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  return v;
}

/** Server-only. Absent in the browser bundle by construction. */
export function serviceRoleKey(): string {
  const v = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!v) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set (server-only)");
  return v;
}

/** Server-only pepper for classroom-card PIN derivation. ≥32 chars outside development. */
export function cardPepper(): string {
  const v = process.env.CARD_PEPPER;
  if (!v) throw new Error("CARD_PEPPER is not set (server-only)");
  if (!isDevelopment && v.length < 32) throw new Error("CARD_PEPPER must be at least 32 characters outside development");
  return v;
}

/** The running build's commit SHA, stamped onto audit rows when available. */
export function buildSha(): string | null {
  return process.env.PINTAR_BUILD_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null;
}
