/**
 * W2.5 (Batch 5; CR-05): the answers the certificate revocation can give, each with its sentence in hle.ts
 * (`sertifikat.cabut.gagal.<kode>`). A guard (B5-CABUT-K01) holds every code to a sentence in both languages.
 */
export const KODE_CABUT = ["ALASAN_WAJIB", "SUDAH_DICABUT", "DITOLAK", "TIDAK_DITEMUKAN", "LAYANAN_TIDAK_TERSEDIA"] as const;
export type KodeCabut = (typeof KODE_CABUT)[number];

/** The states a listed certificate can be in (ELIGIBLE is no certificate yet, and is never listed). */
export const KEADAAN_SERTIFIKAT = ["ISSUED", "REVOKED", "SUPERSEDED"] as const;
export type KeadaanSertifikat = (typeof KEADAAN_SERTIFIKAT)[number];

/**
 * The database's refusal of revoke_certificate, as one of the screen's codes. Only the code leaves the server; the
 * database's own words never reach the screen.
 */
export function kodeDariGalat(e: { code?: string; message?: string; details?: string | null }): KodeCabut {
  const pesan = e.message ?? "";
  if (e.details === "CERTIFICATE_ALREADY_REVOKED" || /already revoked/.test(pesan)) return "SUDAH_DICABUT";
  if (/records why/.test(pesan)) return "ALASAN_WAJIB";
  if (/requires CAN_PUBLISH/.test(pesan) || e.code === "42501") return "DITOLAK";
  if (/unknown certificate/.test(pesan)) return "TIDAK_DITEMUKAN";
  return "LAYANAN_TIDAK_TERSEDIA";
}

/**
 * W2.22 (owner, 9 Nov): «Terbitkan ulang», the replacement of an erroneous issued certificate. The codes
 * sertifikat_koreksi_siapkan and sertifikat_koreksi_segel raise (PR120, code in DETAIL), plus the screen's own two;
 * each has its sentence in hle.ts (`sertifikat.ganti.gagal.<kode>`). A guard (W222-K01) holds them to the migration.
 */
export const KODE_GANTI_DB = [
  "CERT_NOT_ALLOWED", "CERT_NOT_ISSUED", "CERT_REASON_REQUIRED", "CERT_NOTHING_CHANGED", "CERT_KEY_INVALID", "CERT_REPLACEMENT_INVALID",
] as const;
export const KODE_GANTI = [...KODE_GANTI_DB, "TIDAK_DITEMUKAN", "LAYANAN_TIDAK_TERSEDIA"] as const;
export type KodeGanti = (typeof KODE_GANTI)[number];

/** A refusal of the replacement, as one of the screen's codes: PR120 by its DETAIL, 42501 as not allowed, else unavailable. */
export function kodeGantiDariGalat(e: { code?: string; details?: string | null } | null | undefined): KodeGanti {
  if (e?.code === "PR120" && typeof e.details === "string" && (KODE_GANTI_DB as readonly string[]).includes(e.details)) {
    return e.details as KodeGanti;
  }
  if (e?.code === "42501") return "CERT_NOT_ALLOWED";
  return "LAYANAN_TIDAK_TERSEDIA";
}
