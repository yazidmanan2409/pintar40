/**
 * BOB-28 (D-088(e)): A LOST OR DAMAGED CLASS CARD IS RE-ISSUED. The contract
 * between /api/akun/kartu-kelas and Aktivasi's «Kartu hilang atau rusak».
 *
 * A new card number and PIN for the same learner: the same person, the same
 * sign-in identity and the same history; the old number signs nobody in and
 * every session of the old card ends. Who re-issued it, as what, when and why
 * (HILANG or RUSAK) is recorded. The PIN is shown once, here, and kept nowhere.
 */
export const ALASAN_KARTU_ULANG = ["HILANG", "RUSAK"] as const;
export type AlasanKartuUlang = (typeof ALASAN_KARTU_ULANG)[number];

export const STATUS_KARTU_ULANG = {
  PERMINTAAN_DITOLAK: 403,
  LAYANAN_TIDAK_TERSEDIA: 503,
  BELUM_MASUK: 401,
  /** the caller may not provision people in the learner's school */
  DITOLAK: 403,
  ALASAN_TIDAK_SAH: 400,
  /** the person has no class card */
  KARTU_TIDAK_ADA: 404,
} as const;
export type KodeKartuUlang = keyof typeof STATUS_KARTU_ULANG;
export type JawabanKartuUlang =
  | { ok: true; kartu: { nama: string; card: string; pin: string } }
  | { ok: false; code: KodeKartuUlang; ref?: string };

export function bacaJawabanKartuUlang(isi: unknown): JawabanKartuUlang {
  const o = (isi && typeof isi === "object" ? isi : {}) as Record<string, unknown>;
  const k = (o.kartu ?? {}) as Record<string, unknown>;
  if (o.ok === true && typeof k.nama === "string" && /^[0-9]{10}$/.test(String(k.card)) && /^[0-9]{6}$/.test(String(k.pin))) {
    return { ok: true, kartu: { nama: k.nama, card: String(k.card), pin: String(k.pin) } };
  }
  if (o.ok === false && typeof o.code === "string" && o.code in STATUS_KARTU_ULANG) {
    return { ok: false, code: o.code as KodeKartuUlang, ...(typeof o.ref === "string" && /^[A-Z0-9]{6}$/.test(o.ref) ? { ref: o.ref } : {}) };
  }
  return { ok: false, code: "LAYANAN_TIDAK_TERSEDIA" };
}
