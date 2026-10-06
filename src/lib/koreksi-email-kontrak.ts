/**
 * CR-13 (D-120 QN1): A STAFF MEMBER'S WRONG EMAIL IS CORRECTED. The contract of /api/akun/email; its screen is the
 * people list's, in slice S7 (Daisy).
 *
 * Before activation the school's admin (CAN_PROVISION_PEOPLE in the person's school) or the platform admin corrects
 * it; after activation the platform admin only. Either way a reason is given and kept, every outstanding code and
 * session ends, and the correction is audited (identity.email_corrected). Before activation a set-up begun through
 * the wrong address is undone; after it, the old and the new address are told.
 */
export const STATUS_KOREKSI_EMAIL = {
  PERMINTAAN_DITOLAK: 403,
  LAYANAN_TIDAK_TERSEDIA: 503,
  BELUM_MASUK: 401,
  /** the caller may not correct this person's email (after activation: the platform admin only) */
  DITOLAK: 403,
  /** a person id, an address and a reason are each needed */
  PERMINTAAN_TIDAK_SAH: 400,
  ALASAN_WAJIB: 400,
  EMAIL_TIDAK_SAH: 400,
  /** that is already the person's address */
  EMAIL_SAMA: 409,
  /** another account holds that address */
  EMAIL_TERPAKAI: 409,
  /** the person has no email account (a learner, a class card, an evaluation persona) */
  AKUN_EMAIL_TIDAK_ADA: 404,
} as const;
export type KodeKoreksiEmail = keyof typeof STATUS_KOREKSI_EMAIL;
export type JawabanKoreksiEmail =
  | { ok: true; sudahAktif: boolean }
  | { ok: false; code: KodeKoreksiEmail; ref?: string };

/** The database's refusal (PR040 detail) as the route's code. */
export const KODE_DARI_DB: Record<string, KodeKoreksiEmail> = {
  REASON_REQUIRED: "ALASAN_WAJIB",
  EMAIL_INVALID: "EMAIL_TIDAK_SAH",
  EMAIL_UNCHANGED: "EMAIL_SAMA",
  EMAIL_TAKEN: "EMAIL_TERPAKAI",
  EMAIL_ACCOUNT_NOT_FOUND: "AKUN_EMAIL_TIDAK_ADA",
};

export function bacaJawabanKoreksiEmail(isi: unknown): JawabanKoreksiEmail {
  const o = (isi && typeof isi === "object" ? isi : {}) as Record<string, unknown>;
  if (o.ok === true && typeof o.sudahAktif === "boolean") return { ok: true, sudahAktif: o.sudahAktif };
  if (o.ok === false && typeof o.code === "string" && o.code in STATUS_KOREKSI_EMAIL) {
    return { ok: false, code: o.code as KodeKoreksiEmail, ...(typeof o.ref === "string" && /^[A-Z0-9]{6}$/.test(o.ref) ? { ref: o.ref } : {}) };
  }
  return { ok: false, code: "LAYANAN_TIDAK_TERSEDIA" };
}
