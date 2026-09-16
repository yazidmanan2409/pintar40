import type { Locale } from "@/lib/hle";

/**
 * The interface-language preference, as a name and a parse.
 *
 * DELIBERATELY A MODULE OF ITS OWN WITH NO SERVER IMPORT, for the same reason
 * `src/lib/certificates/verification.ts` is: the switch is a client component
 * and it needs the cookie's name, and importing that name from the module that
 * calls `next/headers` would pull the server runtime into a browser bundle.
 * A shared constant is the honest way to share a constant.
 */
export const LOCALE_COOKIE = "pintar-lang";
export const DEFAULT_LOCALE: Locale = "id";

export function parseLocale(value: string | undefined | null): Locale {
  return value === "en" ? "en" : DEFAULT_LOCALE;
}
