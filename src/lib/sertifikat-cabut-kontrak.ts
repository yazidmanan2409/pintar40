/**
 * W2.5 (Batch 5; CR-05): the answers the certificate revocation can give, each with its sentence in hle.ts
 * (`sertifikat.cabut.gagal.<kode>`). A guard (B5-CABUT-K01) holds every code to a sentence in both languages.
 */
export const KODE_CABUT = ["ALASAN_WAJIB", "SUDAH_DICABUT", "DITOLAK", "TIDAK_DITEMUKAN", "LAYANAN_TIDAK_TERSEDIA"] as const;
export type KodeCabut = (typeof KODE_CABUT)[number];

/** The states a listed certificate can be in (ELIGIBLE is no certificate yet, and is never listed). */
export const KEADAAN_SERTIFIKAT = ["ISSUED", "REVOKED", "SUPERSEDED"] as const;
export type KeadaanSertifikat = (typeof KEADAAN_SERTIFIKAT)[number];
