/**
 * D-152(a) (Batch 4): A CLASS-CARD LEARNER WHO BECOMES STAFF. The contract between /api/akun/kartu-ke-email and
 * Aktivasi's «Murid yang menjadi staf».
 *
 * The learner's card account becomes an email account: the same person, account, PINTAR ID and history. The card
 * stops working at once and every session of it ends; the person activates the email account with a code sent to the
 * new address (username, PIN, password, name), and only then may the school give them a staff role (CR-91 unchanged).
 * Who converted it, as what, when and why is recorded (account.card_converted_to_email).
 */
export const STATUS_KARTU_JADI_EMAIL = {
  PERMINTAAN_DITOLAK: 403,
  LAYANAN_TIDAK_TERSEDIA: 503,
  BELUM_MASUK: 401,
  /** the caller may not provision people in the learner's school */
  DITOLAK: 403,
  /** a reason of 10 to 500 characters */
  ALASAN_WAJIB: 400,
  EMAIL_TIDAK_SAH: 400,
  /** an account already uses that address */
  EMAIL_TERPAKAI: 409,
  /** the person has no class card */
  KARTU_TIDAK_ADA: 404,
  PERMINTAAN_TIDAK_SAH: 400,
} as const;
export type KodeKartuJadiEmail = keyof typeof STATUS_KARTU_JADI_EMAIL;

/** authorize_card_conversion's refusals (PR040 detail) to this contract's codes */
export const KODE_KARTU_JADI_EMAIL_DARI_DB: Record<string, KodeKartuJadiEmail> = {
  REASON_REQUIRED: "ALASAN_WAJIB",
  EMAIL_INVALID: "EMAIL_TIDAK_SAH",
  EMAIL_TAKEN: "EMAIL_TERPAKAI",
  CARD_NOT_FOUND: "KARTU_TIDAK_ADA",
};

export type JawabanKartuJadiEmail =
  | { ok: true; email: string }
  | { ok: false; code: KodeKartuJadiEmail; ref?: string };

export function bacaJawabanKartuJadiEmail(isi: unknown): JawabanKartuJadiEmail {
  const o = (isi && typeof isi === "object" ? isi : {}) as Record<string, unknown>;
  if (o.ok === true && typeof o.email === "string" && o.email.includes("@")) return { ok: true, email: o.email };
  if (o.ok === false && typeof o.code === "string" && o.code in STATUS_KARTU_JADI_EMAIL) {
    return { ok: false, code: o.code as KodeKartuJadiEmail, ...(typeof o.ref === "string" && /^[A-Z0-9]{6}$/.test(o.ref) ? { ref: o.ref } : {}) };
  }
  return { ok: false, code: "LAYANAN_TIDAK_TERSEDIA" };
}
