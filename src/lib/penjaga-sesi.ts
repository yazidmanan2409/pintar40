import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cardPepperJikaAda } from "@/lib/env";
import { HALAMAN_AKTIVASI } from "@/lib/aktivasi-kontrak";
import { UMUR_SESI, umurSesi } from "@/lib/sesi";
import { HALAMAN_PERANGKAT, HALAMAN_TERKUNCI, type ModeSesi } from "@/lib/penjaga-sesi-kontrak";

export * from "@/lib/penjaga-sesi-kontrak";

/**
 * BOB-29 (Gate 6; IDENTITY-4.0 C4, C11, §7; D-085 T1, D-086(c)): A SHARED COMPUTER LOCKS AND RESUMES WITH THE PIN.
 *
 * What the proxy (src/proxy.ts) and the session routes decide with. The authority is the database: one row per
 * Auth session (device_sessions), its state computed from the clock, and PostgREST's pre-request refusing every
 * request of a locked or ended session (migration 20261117100000). This file only reads that state and turns it
 * into a page, a refusal or a cookie; it never decides a lock on its own.
 *
 *   SHARED    a staff person on a computer they did not declare their own (the default, C11)
 *   PERSONAL  a staff person on a computer they declared theirs: never locks; D-009's 7 days stand
 *   CARD      every class-card session (T1, D-086(c)); a learner is never asked about the computer
 *
 * Shared and card: 5 minutes without activity lock it; the same person's PIN resumes it; 3 wrong PINs end it;
 * 60 minutes locked end it. Another device is never affected.
 */
/** Where a locked session may still go: the lock screen, its PIN, and leaving. */
export function jalurSaatTerkunci(path: string): boolean {
  return path === HALAMAN_TERKUNCI || path === "/api/sesi/buka" || path === "/keluar";
}

/** Where «Komputer siapa ini?» does not interrupt: itself, leaving, the lock, the activation wizard, every route. */
export function jalurBebasPilih(path: string): boolean {
  return path === HALAMAN_PERANGKAT || path === HALAMAN_TERKUNCI || path === "/keluar" || path.startsWith("/api/")
    || path === HALAMAN_AKTIVASI || path.startsWith(`${HALAMAN_AKTIVASI}/`);
}

type Kepala = { get(name: string): string | null };

/** A prefetch is the browser's guess, not the person: it is never activity and never asks the database. */
export function adalahPrefetch(h: Kepala): boolean {
  return h.get("next-router-prefetch") === "1" || /prefetch/i.test(h.get("purpose") ?? "") || /prefetch/i.test(h.get("sec-purpose") ?? "");
}

/** A page the person opened (a link, the address bar, a reload): activity while the session is open. */
export function navigasiHalaman(method: string, h: Kepala): boolean {
  return method === "GET" && h.get("sec-fetch-dest") === "document" && !adalahPrefetch(h);
}

/** A request that wants a page back (not a route, not a server action, not a client navigation's data). */
export function mintaHalaman(path: string, h: Kepala): boolean {
  return !path.startsWith("/api/") && !h.get("next-action") && !h.get("rsc");
}

/** The Auth session's id inside an access token (its signature was checked by Auth already), or null. */
export function idSesiDariToken(token: string | null | undefined): string | null {
  const bagian = token?.split(".");
  if (!bagian || bagian.length !== 3) return null;
  try {
    const isi = JSON.parse(Buffer.from(bagian[1], "base64url").toString("utf8")) as { session_id?: unknown };
    const id = typeof isi.session_id === "string" ? isi.session_id.toLowerCase() : "";
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** A new browser's value. */
export function perangkatBaru(): string {
  return randomBytes(32).toString("base64url");
}

/** What the database keeps of this browser's value, or null for anything that is not one. */
export function hashPerangkat(nilai: string | null | undefined): string | null {
  if (!nilai || !/^[A-Za-z0-9_-]{43}$/.test(nilai)) return null;
  return createHash("sha256").update(`pintar/perangkat/v1|${nilai}`).digest("hex");
}

function kunciPribadi(): Buffer | null {
  const lada = cardPepperJikaAda();
  return lada ? createHmac("sha256", lada).update("pintar/session-personal/v1").digest() : null;
}

function tandaPribadi(k: Buffer, idSesi: string): string {
  return createHmac("sha256", k).update(`pribadi|${idSesi}`).digest("base64url");
}

/** The PERSONAL cookie's value for this session, or null when nothing can be remembered (no pepper). */
export function nilaiPribadi(idSesi: string): string | null {
  const k = kunciPribadi();
  return k ? `${idSesi}.${tandaPribadi(k, idSesi)}` : null;
}

/** True only for this session's own cookie, signed with this server's key. */
export function pribadiTersimpan(idSesi: string | null, nilai: string | undefined): boolean {
  const k = kunciPribadi();
  if (!k || !idSesi || !nilai) return false;
  const titik = nilai.lastIndexOf(".");
  if (titik < 0 || nilai.slice(0, titik) !== idSesi) return false;
  const a = Buffer.from(nilai.slice(titik + 1)), b = Buffer.from(tandaPribadi(k, idSesi));
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * HOW LONG THE BROWSER KEEPS THE SESSION'S COOKIES WHILE IDLE (BOB-05's sliding lifetime, by mode): a personal
 * computer D-009's 7 days; a shared computer and a class card 60 minutes, so a computer left unattended forgets
 * the session by itself as well (C4). Unknown (an evaluation persona, or the database unread): by the address, as
 * before.
 */
export function umurSesiMode(mode: ModeSesi | null, email: string | null | undefined): number {
  if (mode === "PERSONAL") return UMUR_SESI.email;
  if (mode === "SHARED" || mode === "CARD") return UMUR_SESI.kartu;
  return umurSesi(email);
}
