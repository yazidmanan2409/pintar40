import type { HleEvent } from "@/lib/hle";

/** The kinds of send the log records, in the copy table's words (J1.9). Shared by the history and the stuck list. */
export const JENIS_EMAIL: Record<string, HleEvent> = {
  KODE_AKTIVASI: "emailuji.r.jenis.KODE_AKTIVASI",
  KODE_ULANG: "emailuji.r.jenis.KODE_ULANG",
  PEMULIHAN_PASSWORD: "emailuji.r.jenis.PEMULIHAN_PASSWORD",
  PASSWORD_DIUBAH: "emailuji.r.jenis.PASSWORD_DIUBAH",
  KARTU_DIGITAL: "emailuji.r.jenis.KARTU_DIGITAL",
  PEMBERITAHUAN_KEAMANAN: "emailuji.r.jenis.PEMBERITAHUAN_KEAMANAN",
  UJI_PENGIRIMAN: "emailuji.r.jenis.UJI_PENGIRIMAN",
};

/** W2.19 (J1.9): a pending send older than this has waited too long on the email server: «tertahan». */
export const MENIT_TERTAHAN = 10;
