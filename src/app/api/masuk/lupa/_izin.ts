import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { COOKIE_PEMULIHAN } from "@/lib/aktivasi-kontrak";

/**
 * BOB-27: THE RECOVERY GRANT AS THE BROWSER HOLDS IT. A random token in an
 * httpOnly, same-site cookie for ten minutes; the database keeps its SHA-256
 * only (password_recovery_grants). The token allows one thing, a new password.
 */
const UMUR_DETIK = 600;
const BENTUK = /^[A-Za-z0-9_-]{43}$/;

export const hashIzin = (token: string) => createHash("sha256").update(token, "utf8").digest("hex");

export function tokenIzinBaru(): string {
  return randomBytes(32).toString("base64url");
}

export async function simpanIzin(token: string, aman: boolean): Promise<void> {
  (await cookies()).set(COOKIE_PEMULIHAN, token, { httpOnly: true, secure: aman, sameSite: "strict", path: "/", maxAge: UMUR_DETIK });
}

export async function bacaIzin(): Promise<string | null> {
  const v = (await cookies()).get(COOKIE_PEMULIHAN)?.value ?? "";
  return BENTUK.test(v) ? v : null;
}

export async function buangIzin(): Promise<void> {
  (await cookies()).set(COOKIE_PEMULIHAN, "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
}
