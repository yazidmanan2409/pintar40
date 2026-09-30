import { createHmac, timingSafeEqual } from "node:crypto";
import { HALAMAN_AKTIVASI } from "@/lib/aktivasi-kontrak";
import { cardPepperJikaAda } from "@/lib/env";

/**
 * BOB-26: THE PROXY HOLDS A SET-UP REQUIRED SESSION TO THE WIZARD
 * (src/proxy.ts). This file is what the hold decides with.
 *
 * WHERE A HELD SESSION MAY GO: the wizard's page and its routes, signing out,
 * and every path a signed-out visitor may reach. Everything else redirects to
 * the wizard, or, for an /api/ route, answers 403 `setup_required`.
 *
 * WHAT IT COSTS: the set-up state is one database read, asked only for an
 * email account (a class card has no set-up, C13) and only until it is known
 * to be settled. COMPLETE and NOT_APPLICABLE never go back to REQUIRED, so the
 * proxy then remembers it in an httpOnly cookie for that Auth user, signed
 * with a key derived from the server's pepper under a label of its own. A
 * forged or another user's cookie does not verify, and the database is asked
 * again. Without a pepper (a development box), nothing is remembered.
 */
export const COOKIE_SIAP = "pintar_siap";

export function jalurBebasSaatAktivasi(path: string): boolean {
  return path === HALAMAN_AKTIVASI || path.startsWith(`${HALAMAN_AKTIVASI}/`) || path.startsWith("/api/aktifkan/") || path === "/keluar";
}

function kunci(): Buffer | null {
  const lada = cardPepperJikaAda();
  return lada ? createHmac("sha256", lada).update("pintar/setup-settled/v1").digest() : null;
}

function tanda(k: Buffer, userId: string): string {
  return createHmac("sha256", k).update(`siap|${userId}`).digest("base64url");
}

/** The cookie's value for this Auth user, or null when nothing can be remembered. */
export function nilaiSiap(userId: string): string | null {
  const k = kunci();
  return k ? `${userId}.${tanda(k, userId)}` : null;
}

/** True only for this user's own cookie, signed with this server's key. */
export function siapTersimpan(userId: string, nilai: string | undefined): boolean {
  const k = kunci();
  if (!k || !nilai) return false;
  const titik = nilai.lastIndexOf(".");
  if (titik < 0 || nilai.slice(0, titik) !== userId) return false;
  const a = Buffer.from(nilai.slice(titik + 1)), b = Buffer.from(tanda(k, userId));
  return a.length === b.length && timingSafeEqual(a, b);
}
