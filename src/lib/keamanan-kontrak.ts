/**
 * BOB-28 (C5 path (2), C7), D-101 (1): THE ASSISTED PIN-RECOVERY TOOL, the
 * contract between /api/keamanan/pemulihan and Konfigurasi › Keamanan.
 *
 * Look up one PINTAR ID (who, and the state of their PIN recovery), then an
 * audited reset with a stated reason: the ladder back to 0 and a NEW PIN
 * required; the owner and the security recipient are told. The Platform
 * Admin's, or a School Admin's for a person their school has (D-101); never
 * one's own; the database decides.
 */
export type KeadaanPemulihan = "NORMAL" | "LOCKED" | "SUSPENDED";

export type StatusPemulihan = {
  personId: string;
  nama: string;
  pintarId: string;
  keadaan: KeadaanPemulihan;
  /** ISO, while LOCKED */
  terkunciSampai: string | null;
  /** the old PIN matches nothing until a new one is set */
  pinBaruDitunggu: boolean;
  /** recovery by PIN is a staff email account's; without one there is nothing to recover */
  akunEmail: boolean;
};

export const STATUS_PEMULIHAN_ADMIN = {
  PERMINTAAN_DITOLAK: 403,
  LAYANAN_TIDAK_TERSEDIA: 503,
  BELUM_MASUK: 401,
  /** neither the Platform Admin nor a School Admin */
  DITOLAK: 403,
  /** D-101: one's own recovery is never reset with an administrator's authority */
  SENDIRI: 403,
  ID_TIDAK_SAH: 400,
  /** no person holds this ID */
  TIDAK_ADA: 404,
  ALASAN_KOSONG: 400,
} as const;
export type KodePemulihanAdmin = keyof typeof STATUS_PEMULIHAN_ADMIN;
export type JawabanStatusPemulihan = { ok: true; status: StatusPemulihan } | { ok: false; code: KodePemulihanAdmin; ref?: string };
export type JawabanAturUlang = { ok: true; status: StatusPemulihan } | { ok: false; code: KodePemulihanAdmin; ref?: string };

const KEADAAN = new Set(["NORMAL", "LOCKED", "SUSPENDED"]);

function bacaStatus(v: unknown): StatusPemulihan | null {
  const s = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  if (typeof s.personId !== "string" || typeof s.nama !== "string" || typeof s.pintarId !== "string" || !KEADAAN.has(String(s.keadaan))) return null;
  return {
    personId: s.personId, nama: s.nama, pintarId: s.pintarId, keadaan: s.keadaan as KeadaanPemulihan,
    terkunciSampai: typeof s.terkunciSampai === "string" ? s.terkunciSampai : null,
    pinBaruDitunggu: s.pinBaruDitunggu === true, akunEmail: s.akunEmail === true,
  };
}

/** Either answer, read without trusting it. */
export function bacaJawabanPemulihanAdmin(isi: unknown): JawabanStatusPemulihan {
  const o = (isi && typeof isi === "object" ? isi : {}) as Record<string, unknown>;
  const status = o.ok === true ? bacaStatus(o.status) : null;
  if (status) return { ok: true, status };
  if (o.ok === false && typeof o.code === "string" && o.code in STATUS_PEMULIHAN_ADMIN) {
    return { ok: false, code: o.code as KodePemulihanAdmin, ...(typeof o.ref === "string" && /^[A-Z0-9]{6}$/.test(o.ref) ? { ref: o.ref } : {}) };
  }
  return { ok: false, code: "LAYANAN_TIDAK_TERSEDIA" };
}
