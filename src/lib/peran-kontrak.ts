/**
 * B0 · administrator lock-out protection: the contract with the role guard's last-holder refusals, perpanjang_peran,
 * peran_akan_berakhir and peran_pemegang_terakhir (migration 20270113170000). Pure: no database, no React.
 */
import type { HleEvent } from "./hle";
import { bagianJakarta, geserZona } from "./tanggal";

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

/** Whether a code is one of this contract's (a page told a code by its address reads it back through this). */
export function kodePeranDari(v: string | undefined | null): KodePeran | null {
  return v && (KODE_PERAN as readonly string[]).includes(v) ? (v as KodePeran) : null;
}

/** The expiry notice's windows: «Peran & akses» from 30 days before the end date, the holder's own home from 7. */
export const HARI_PERINGATAN = { kelola: 30, sendiri: 7 } as const;

/** One row of peran_akan_berakhir: a live role ending within the asked days, counted on the school's clock (`zona`). */
export type PeranBerakhir = {
  id: string; person_id: string; nama: string; role: string; scope_node_id: string | null; tempat: string | null;
  institution_id: string | null; valid_until: string; zona: string; sisa_hari: number; milik_sendiri: boolean; pemegang_terakhir: boolean;
};

/** The day after a role's current end, on its own clock: the earliest day a renewal may name (yyyy-mm-dd). */
export function hariSetelah(validUntil: string, zona: string): string {
  const p = bagianJakarta(validUntil, geserZona(zona));
  if (!p) return "";
  const besok = new Date(Date.UTC(p.tahun, p.bulan - 1, p.hari + 1, 12));
  return besok.toISOString().slice(0, 10);
}
