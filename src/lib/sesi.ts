import { stringFromBase64URL } from "@supabase/ssr";

/**
 * BOB-05 (D-009) — HOW LONG A SIGNED-IN DEVICE STAYS SIGNED IN WHILE IDLE.
 *
 * A classroom card is used on shared devices: its session ends after 60
 * minutes without a request. An email account is personal: 7 days. Supabase
 * Auth has one project-wide idle setting and no notion of account kinds, so the
 * limit lives in the browser's own cookie lifetime: every response that sets
 * or refreshes the auth cookies gives them this Max-Age, and the proxy re-sends
 * them on each signed-in request, so the lifetime slides with activity and the
 * browser itself forgets an idle session. @supabase/ssr always writes its own
 * 400-day default, whatever cookieOptions say, so the override happens where
 * the cookies are written (src/proxy.ts, src/lib/supabase/server.ts).
 *
 * Pure: no secret, no server-only import; the proxy and the server client use
 * the same definitions, and the card address has one definition (card.ts uses
 * domainKartu()).
 */
export const UMUR_SESI = {
  /** a classroom card: 60 minutes idle */
  kartu: 60 * 60,
  /** an email account: 7 days idle */
  email: 7 * 24 * 60 * 60,
} as const;

/** The Auth address domain classroom cards sign in under. */
export function domainKartu(): string {
  return (process.env.CARD_EMAIL_DOMAIN ?? "cards.pintar.internal").toLowerCase();
}

/** Whether an Auth address is a classroom card's: card-<digits>@<the card domain>, exactly. */
export function adalahAlamatKartu(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  const at = e.lastIndexOf("@");
  return at > 0 && /^card-\d+$/.test(e.slice(0, at)) && e.slice(at + 1) === domainKartu();
}

/** The idle lifetime, in seconds, of a session signed in as this address. */
export function umurSesi(email: string | null | undefined): number {
  return adalahAlamatKartu(email) ? UMUR_SESI.kartu : UMUR_SESI.email;
}

/** An auth-token cookie of @supabase/ssr, whole or one of its chunks — never the PKCE code verifier. */
const COOKIE_SESI = /^(sb-.+-auth-token)(?:\.(\d+))?$/;

export function adalahCookieSesi(name: string): boolean {
  return COOKIE_SESI.test(name);
}

/**
 * The address of the session in the auth cookies being written, or null.
 * @supabase/ssr stores the session as "base64-" + base64url(JSON), split into
 * name.0, name.1, … when it is long; the chunks are joined in order.
 */
export function alamatDariCookieSesi(cookies: ReadonlyArray<{ name: string; value: string }>): string | null {
  const bagian = new Map<string, Array<[number, string]>>();
  for (const { name, value } of cookies) {
    const m = COOKIE_SESI.exec(name);
    if (!m || !value) continue;
    const daftar = bagian.get(m[1]) ?? [];
    daftar.push([m[2] === undefined ? -1 : Number(m[2]), value]);
    bagian.set(m[1], daftar);
  }
  for (const daftar of bagian.values()) {
    const utuh = daftar.sort((a, b) => a[0] - b[0]).map(([, v]) => v).join("");
    try {
      const json = utuh.startsWith("base64-") ? stringFromBase64URL(utuh.slice("base64-".length)) : utuh;
      const sesi = JSON.parse(json) as { user?: { email?: unknown } };
      if (typeof sesi?.user?.email === "string") return sesi.user.email;
    } catch {
      // not a session we can read: leave the lifetime as the library set it
    }
  }
  return null;
}
