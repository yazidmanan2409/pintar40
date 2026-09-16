import { cookies } from "next/headers";
import type { Locale } from "@/lib/hle";
import { LOCALE_COOKIE, parseLocale } from "./locale-kontrak";

/**
 * The interface language preference (UX-1 Slice 0, S0.3).
 *
 * PRESENTATION ONLY, AND STRUCTURALLY SO. There is no column, no RPC, no audit
 * write and no server action behind this: the preference lives in a cookie the
 * browser sets and the server reads, mirrored into localStorage so a reload
 * before the cookie round-trips still renders the language the reader chose.
 *
 * WHY THAT MATTERS MORE THAN IT LOOKS. UX1-S0-LANG-01 drives one learner cycle
 * and one staff session in `id` and again in `en` and asserts that the recorded
 * RPC call sequence and payloads are BYTE-IDENTICAL. That test can only hold if
 * the language never reaches the database — so the preference is deliberately
 * the one piece of reader state that has no server-side home. A future
 * institution default would be a column on the institution, read as a fallback
 * here; it would still not make the language an input to any request.
 *
 * Card learners inherit `id` until such a default exists (Q-21 neutral forms).
 */
export { DEFAULT_LOCALE, parseLocale, LOCALE_COOKIE } from "./locale-kontrak";

/** The language this request renders in. Never an authorization input. */
export async function currentLocale(): Promise<Locale> {
  const jar = await cookies();
  return parseLocale(jar.get(LOCALE_COOKIE)?.value);
}
