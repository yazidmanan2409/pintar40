/**
 * §5b and L1–L4 (owner, 9 Nov): the screens' contract with tangguhkan_akun, aktifkan_kembali_akun, minta_akun,
 * permintaan_akun_saya, permintaan_akun_antrean and hapus_data_pribadi (migration 20270113130000). Pure.
 */
export const KODE_AKUN_DB = [
  "ACCOUNT_NOT_ALLOWED", "ACCOUNT_SELF", "ACCOUNT_UNKNOWN", "ACCOUNT_CATEGORY_INVALID", "ACCOUNT_NOTE_REQUIRED",
  "ACCOUNT_ALREADY_SUSPENDED", "ACCOUNT_NOT_SUSPENDED", "ACCOUNT_CONFIRM_REQUIRED", "ACCOUNT_LEARNER_VIA_SCHOOL",
  "ACCOUNT_REQUEST_OPEN", "ACCOUNT_REQUEST_INVALID", "ACCOUNT_NOT_CLOSED",
  // Sharon §16 finding 5 (6faef690): a live platform role does not close itself
  "ACCOUNT_PLATFORM_ROLE",
  // owner ruling 2 (9 Nov): a closed account is reopened only from its request
  "ACCOUNT_REOPEN_VIA_REQUEST",
  // L1-F4 (Sharon §3a.3): an attachment gained since the closure began stops the deletion; the request stays open
  "ACCOUNT_LIVE_ATTACHMENT",
] as const;
// ACCOUNT_PHOTO_PENDING (Sharon §16 finding 2): the data is deleted, a photo file not yet; pressing again finishes it
export const KODE_AKUN = [...KODE_AKUN_DB, "ACCOUNT_PHOTO_PENDING", "ACCOUNT_FAILED"] as const;
export type KodeAkun = (typeof KODE_AKUN)[number];

/** A platform suspension's categories (§4), in tangguhkan_akun's own list and order. CLOSED_AT_REQUEST is never chosen. */
// owner ruling 3 (9 Nov): no DISCIPLINARY; a school's discipline is never a platform-wide suspension
export const KATEGORI_TANGGUH = ["SECURITY", "ADMINISTRATIVE", "OTHER"] as const;
export const JENIS_PERMINTAAN = ["CLOSE", "DELETE_PERSONAL_DATA", "REOPEN"] as const;
export const KEADAAN_PERMINTAAN = ["RECEIVED", "IN_PROGRESS", "DONE", "DECLINED"] as const;

export function kodeAkunDariGalat(e: { code?: string | null; details?: string | null } | null | undefined): KodeAkun {
  if (e?.code === "PR140" && typeof e.details === "string" && (KODE_AKUN_DB as readonly string[]).includes(e.details)) {
    return e.details as KodeAkun;
  }
  return "ACCOUNT_FAILED";
}

export function kodeAkunDari(v: string | undefined | null): KodeAkun | null {
  if (!v) return null;
  return ((KODE_AKUN as readonly string[]).includes(v) ? v : "ACCOUNT_FAILED") as KodeAkun;
}
