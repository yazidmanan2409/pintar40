/**
 * B1 · THE SIGN-IN RECORD: the contract with migration 20270116100000 (accountability_events; the writer
 * akuntabilitas_catat, the reader akuntabilitas_baca and akuntabilitas_sejak, the raiser akuntabilitas_tolak, PR200).
 * Pure: no database, no React, no secret. The server-only helper that writes is src/app/api/_akuntabilitas/catat.ts.
 *
 * C5: accountability, not surveillance. The record says that a person entered, failed to enter, left, or asked for a
 * print; nothing about what they read, how long they stayed or what they clicked.
 */
import type { HleEvent } from "./hle";

/** The four kinds of event. */
export const JENIS_AKUNTABILITAS = ["SIGN_IN_OK", "SIGN_IN_FAILED", "SIGN_OUT", "PRINT_REQUEST"] as const;
export type JenisAkuntabilitas = (typeof JENIS_AKUNTABILITAS)[number];

/** How a sign-in was made (a sign-out and a print have none). */
export const CARA_MASUK = ["PASSWORD", "CARD", "LINK", "CODE", "RECOVERY_PIN"] as const;
export type CaraMasuk = (typeof CARA_MASUK)[number];

/**
 * Every failure outcome: the route's own stable code, as the route answered it (never Auth's text). The sign-in link
 * has two of its own: a request for an address PINTAR does not know (the screen answers it as it answers every
 * address), and a link that could not be used at the callback.
 */
export const HASIL_GAGAL: Record<CaraMasuk, readonly string[]> = {
  PASSWORD: ["MASUK_TIDAK_COCOK", "MASUK_TUNGGU", "MASUK_DIBATASI", "LAYANAN_TIDAK_TERSEDIA", "PERMINTAAN_DITOLAK"],
  CARD: ["CARD_NOT_MATCHED", "CARD_COOLDOWN", "CARD_RATE_LIMITED", "CARD_REQUEST_REFUSED", "CARD_UNAVAILABLE"],
  LINK: ["TAUTAN_TIDAK_TERDAFTAR", "TAUTAN_TIDAK_BERLAKU"],
  CODE: ["KODE_TIDAK_COCOK", "KODE_TUNGGU", "KODE_DIBATASI", "LAYANAN_TIDAK_TERSEDIA", "PERMINTAAN_DITOLAK"],
  RECOVERY_PIN: ["ID_TIDAK_SAH", "PIN_KOSONG", "PIN_TIDAK_COCOK", "PIN_TERKUNCI", "PIN_TUNGGU", "PIN_DITANGGUHKAN", "AKUN_BELUM_AKTIF",
    "LAYANAN_TIDAK_TERSEDIA", "PERMINTAAN_DITOLAK"],
};
/** The password set after a recovery signs in with it: its refusals are that door's own (BOB-27). */
export const HASIL_GAGAL_PASSWORD_PEMULIHAN = ["PASSWORD_TERLALU_PANJANG", "PASSWORD_LEMAH", "PEMULIHAN_BERAKHIR"] as const;

/** Every failure code, each once. */
export const SEMUA_HASIL_GAGAL: readonly string[] = [...new Set([...Object.values(HASIL_GAGAL).flat(), ...HASIL_GAGAL_PASSWORD_PEMULIHAN])];

/** Every code akuntabilitas_tolak raises (PR200, code in DETAIL). Only ACCOUNTABILITY_NOT_ALLOWED reaches a screen. */
export const KODE_AKUNTABILITAS_DB = [
  "ACCOUNTABILITY_NOT_ALLOWED", "ACCOUNTABILITY_NOT_SERVICE", "ACCOUNTABILITY_EVENT_INVALID", "ACCOUNTABILITY_ORIGIN_INVALID",
  "ACCOUNTABILITY_HASH_INVALID", "ACCOUNTABILITY_RESOURCE_INVALID", "ACCOUNTABILITY_INSERT_ONLY", "ACCOUNTABILITY_NOT_A_SOURCE",
] as const;
export type KodeAkuntabilitasDb = (typeof KODE_AKUNTABILITAS_DB)[number];

/** One row as akuntabilitas_baca returns it. network_origin is null for everyone but the platform admin. */
export type BarisAkuntabilitas = {
  id: number; at: string; kind: JenisAkuntabilitas; method: CaraMasuk | null; outcome: string;
  person_id: string | null; nama: string | null; pintar_id: string | null; institution_ids: string[];
  network_origin: string | null; resource: { report: string; node_id?: string; learning_assignment_id?: string; assessment_assignment_id?: string } | null;
  print_ref: string | null;
};

/** A print's reference as the writer makes it: CTK-XXXX-XXXX in Crockford's alphabet. */
export const BENTUK_RUJUKAN_CETAK = /^CTK-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/;

/** A search the reader takes as a print reference (typed with or without its dashes, in any case), normalised; else null. */
export function rujukanCetakDari(q: string | null | undefined): string | null {
  const x = (q ?? "").toUpperCase().replace(/[\s-]/g, "");
  if (!/^CTK[0-9A-HJKMNP-TV-Z]{8}$/.test(x)) return null;
  return `CTK-${x.slice(3, 7)}-${x.slice(7, 11)}`;
}

export const kunciJenis = (k: JenisAkuntabilitas): HleEvent => `akuntabilitas.jenis.${k.toLowerCase()}` as HleEvent;
export const kunciCara = (c: CaraMasuk): HleEvent => `akuntabilitas.cara.${c.toLowerCase()}` as HleEvent;
/**
 * One key per failure outcome, worded as the sign-in screen's own refusal. CARD_COOLDOWN's key says «sering» (tried
 * too often), its sentence's own word: a key naming a cooldown is the held-resend copy the sign-in screen refuses.
 */
export const kunciHasil = (kode: string): HleEvent => `akuntabilitas.hasil.${kode.toLowerCase().replace("cooldown", "sering")}` as HleEvent;

/** The reader's refusal: PR200 with ACCOUNTABILITY_NOT_ALLOWED, or anything else it could not read. */
export function ditolakMembaca(e: { code?: string | null; details?: string | null } | null | undefined): boolean {
  return e?.code === "PR200" && e.details === "ACCOUNTABILITY_NOT_ALLOWED";
}

/** The page size of the reader (the reader asks for one more, to know there are more). */
export const UKURAN_AKUNTABILITAS = 50;

/**
 * B2 · THE PRINTED REPORT (THE PLAN §5.2; B2-COMPLETION.md §1–§3). The four report views that print through
 * «Cetak laporan», and what each sends as its scope. A learner's own results are person-scoped: the person is the
 * session's, never the request's (Sharon's change 1).
 */
export const LAPORAN_CETAK = ["ringkasan.kelas", "ringkasan.pengembangan", "ringkasan.simpul", "hasil.belajar"] as const;
export type LaporanCetak = (typeof LAPORAN_CETAK)[number];
export type PermintaanCetak = { laporan: LaporanCetak; simpul?: string | null };
/** The action's answer: the reference and the server's name and instant for the footer, or a refusal with no event. */
export type HasilCetak =
  | { ok: true; ref: string; nama: string; waktu: string }
  | { ok: false; kode: "CETAK_TIDAK_BOLEH" | "CETAK_GAGAL" };
