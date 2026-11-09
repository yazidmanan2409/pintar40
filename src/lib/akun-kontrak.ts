/**
 * §5b and L1–L4 (owner, 9 Nov): the screens' contract with tangguhkan_akun, aktifkan_kembali_akun, minta_akun,
 * permintaan_akun_saya, permintaan_akun_antrean and hapus_data_pribadi (migration 20270113130000). Pure.
 */
export const KODE_AKUN_DB = [
  "ACCOUNT_NOT_ALLOWED", "ACCOUNT_SELF", "ACCOUNT_UNKNOWN", "ACCOUNT_CATEGORY_INVALID", "ACCOUNT_NOTE_REQUIRED",
  "ACCOUNT_ALREADY_SUSPENDED", "ACCOUNT_NOT_SUSPENDED", "ACCOUNT_CONFIRM_REQUIRED", "ACCOUNT_LEARNER_VIA_SCHOOL",
  "ACCOUNT_REQUEST_OPEN", "ACCOUNT_REQUEST_INVALID", "ACCOUNT_NOT_CLOSED",
] as const;
export const KODE_AKUN = [...KODE_AKUN_DB, "ACCOUNT_FAILED"] as const;
export type KodeAkun = (typeof KODE_AKUN)[number];

/** A platform suspension's categories (§4), in tangguhkan_akun's own list and order. CLOSED_AT_REQUEST is never chosen. */
export const KATEGORI_TANGGUH = ["SECURITY", "DISCIPLINARY", "ADMINISTRATIVE", "OTHER"] as const;
export const JENIS_PERMINTAAN = ["CLOSE", "DELETE_PERSONAL_DATA"] as const;
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
