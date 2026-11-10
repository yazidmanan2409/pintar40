/**
 * B0 · administrator lock-out protection: the contract with the role guard's last-holder refusals, perpanjang_peran,
 * peran_akan_berakhir and peran_pemegang_terakhir (migration 20270113170000). Pure: no database, no React.
 */
import type { HleEvent } from "./hle";

/** Every code a signed-in caller can be answered (PR160, code in DETAIL). The operator's codes never reach a screen. */
export const KODE_PERAN_DB = [
  "ROLE_LAST_PLATFORM_ADMIN", "ROLE_LAST_SCHOOL_ADMIN",
  "ROLE_RENEW_NOT_ALLOWED", "ROLE_RENEW_NOT_LIVE", "ROLE_RENEW_SELF", "ROLE_RENEW_UNTIL_INVALID", "ROLE_RENEW_REASON_REQUIRED",
  "ROLE_READ_NOT_ALLOWED", "ROLE_EXPIRY_DAYS_INVALID",
] as const;
// ROLE_BUSY: two changes to one school's administrators met and the database stopped one (40P01); nothing was written
export const KODE_PERAN = [...KODE_PERAN_DB, "ROLE_BUSY", "ROLE_FAILED"] as const;
export type KodePeran = (typeof KODE_PERAN)[number];

/** The refusals recorded afterwards by catat_penolakan_peran (the refused transaction itself keeps nothing). */
export const KODE_PERAN_DICATAT = ["ROLE_LAST_PLATFORM_ADMIN", "ROLE_LAST_SCHOOL_ADMIN", "ROLE_RENEW_SELF"] as const;

export function kodePeranDariGalat(e: { code?: string | null; details?: string | null } | null | undefined): KodePeran {
  if (e?.code === "PR160" && typeof e.details === "string" && (KODE_PERAN_DB as readonly string[]).includes(e.details)) {
    return e.details as KodePeran;
  }
  if (e?.code === "40P01") return "ROLE_BUSY";
  return "ROLE_FAILED";
}

export function kunciKodePeran(kode: KodePeran): HleEvent {
  return `peran.galat.${kode.toLowerCase()}` as HleEvent;
}
