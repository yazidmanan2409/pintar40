/**
 * AUTH CORRECTION (owner, 11 Nov 2026; AUTH-SUSPENDED-SIGNIN-CORRECTION.md): Auth's own refusal of a LOCKED account,
 * one suspended or closed (and so also one anonymised), whose Auth user is banned until akun_terkunci_sampai()
 * (supabase/migrations/20270116130000). Every sign-in method answers it exactly as its own ordinary non-match and
 * counts it like one; only the server log says why, with a reference and never the identifier (AKUN_TERKUNCI_LOG).
 * A genuine outage is not this: it stays the method's own "unavailable" answer.
 */
export function akunTerkunci(e: { code?: string } | null | undefined): boolean {
  return e?.code === "user_banned";
}

export const AKUN_TERKUNCI_LOG = "Auth refused a locked (suspended or closed) account; answered as the ordinary non-match";
