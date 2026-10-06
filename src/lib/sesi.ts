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

/** BOB-29: the card number inside a classroom card's Auth address, or null for any other address. */
export function nomorKartuDariAlamat(email: string | null | undefined): string | null {
  if (!email || !adalahAlamatKartu(email)) return null;
  return email.toLowerCase().slice("card-".length, email.lastIndexOf("@"));
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

/**
 * BOB-23. THE COOKIES A WRITE WOULD ACTUALLY CHANGE. @supabase/ssr hands its
 * session back to setAll on every request that restores it from the cookie,
 * value unchanged. Written from a server action, that no-op write is a cookie
 * mutation, and Next answers it by re-rendering the whole page
 * (x-action-revalidated) -- which is what fed the lesson player's save loop.
 * Keeps a cookie whose value differs from the request's (a refreshed session)
 * and every deletion; drops the rest. The idle lifetime does not depend on
 * the dropped writes: the proxy re-sends the session cookies with it on every
 * signed-in request, a server action's included.
 */
export function cookieYangBerubah<T extends { name: string; value: string; options?: { maxAge?: number } }>(
  cookiesToSet: ReadonlyArray<T>, nilaiSekarang: (name: string) => string | undefined,
): T[] {
  return cookiesToSet.filter((k) => k.options?.maxAge === 0 || !k.value || nilaiSekarang(k.name) !== k.value);
}

/**
 * BOB-23 (D-009 kept). WHEN THE PROXY RE-SENDS THE SESSION ON A SERVER ACTION.
 * Re-sending the auth cookies with their lifetime is what slides the idle
 * limit, and on a server action every cookie written makes Next re-render the
 * whole page. So a page request always re-sends (it renders anyway), and an
 * action re-sends only once JEDA_GESER_AKSI has passed since the last re-send,
 * which a companion cookie records. Continuous action-only work -- lesson
 * saves, answer sync -- keeps a card's session alive: the lifetime left never
 * falls below its limit minus the interval. At most one redraw per interval,
 * never one per save. The one place the cookie lifetime is decided (Gate 6's
 * heartbeat, D-055, belongs here too).
 */
export const COOKIE_GESER = "pintar-sesi-geser";
export const JEDA_GESER_AKSI = 5 * 60;

export function perluGeserSesi(p: { aksi: boolean; sekarang: number; terakhir: string | undefined; umur: number }): boolean {
  if (!p.aksi) return true;
  const t = Number(p.terakhir);
  if (!p.terakhir || !Number.isFinite(t) || t > p.sekarang) return true;
  return p.sekarang - t >= Math.min(JEDA_GESER_AKSI, Math.floor(p.umur / 4));
}
