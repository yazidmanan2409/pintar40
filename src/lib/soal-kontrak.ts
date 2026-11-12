/**
 * C1w · the item workbench: the contract with the draft editor, the question history, the publication and
 * withdrawal states, the governed answer-key correction and the certificate review of migrations 20270115100000
 * (soal_tolak, PR180) and 20270115110000 (koreksi_tolak, PR190). Pure: no database, no React.
 */
import type { HleEvent } from "./hle";

// ───────────────────────────────────────────────────────────── the draft editor, the history, the revision (PR180)

/** Every code soal_tolak raises (PR180, code in DETAIL). */
export const KODE_SOAL_DB = [
  "DRAFT_NOT_ALLOWED", "DRAFT_UNKNOWN", "DRAFT_SUBMITTED", "DRAFT_SEALED",
  // two authors on one draft: the question was saved by someone else after this editor read it
  "DRAFT_EDIT_CONFLICT",
  "DRAFT_IN_USE", "DRAFT_LAST_TEST_QUESTION", "DRAFT_SHAPE_INVALID", "DRAFT_NOTE_TOO_LONG",
  "REVISION_NOT_HEAD", "REVISION_NOT_PUBLISHED", "REVISION_OPEN_EXISTS", "REVISION_SUMMARY_REQUIRED",
  "QUESTION_NOT_VISIBLE", "RELEASE_STATE_NOT_VISIBLE",
] as const;
export const KODE_SOAL = [...KODE_SOAL_DB, "DRAFT_FAILED"] as const;
export type KodeSoal = (typeof KODE_SOAL)[number];

export function kodeSoalDariGalat(e: { code?: string | null; details?: string | null } | null | undefined): KodeSoal {
  if (e?.code === "PR180" && typeof e.details === "string" && (KODE_SOAL_DB as readonly string[]).includes(e.details)) {
    return e.details as KodeSoal;
  }
  return "DRAFT_FAILED";
}
export function kunciKodeSoal(kode: KodeSoal): HleEvent {
  return `studio.soal.galat.${kode.toLowerCase()}` as HleEvent;
}

/**
 * The problems a save returns (ubah_soal_draf, tambah_soal_draf: `{ ok: false, masalah }`), all at once. Every one but
 * the last two is the upload's own code, so the screen says it with the upload's sentence (kunciMasalahPaket); these
 * two are the editor's own.
 */
export const MASALAH_SOAL_SENDIRI = ["ITEM_OBJECTIVE_UNKNOWN", "ITEM_USE_NO_TEST"] as const;
export const MASALAH_SOAL_DARI_UNGGAH = [
  "ITEM_QUESTION_MISSING", "TEXT_TOO_LONG", "ITEM_OPTIONS_TOO_FEW", "ITEM_OPTIONS_TOO_MANY", "OPTION_LABEL_INVALID",
  "OPTION_LABEL_REPEATED", "OPTION_TEXT_MISSING", "OPTION_REASON_MISSING", "OPTION_CORRECT_INVALID",
  "OPTION_MISCONCEPTION_UNKNOWN", "ITEM_CORRECT_MISSING", "ITEM_CORRECT_TOO_MANY", "ITEM_USE_UNKNOWN",
] as const;
export function kunciMasalahSoal(kode: (typeof MASALAH_SOAL_SENDIRI)[number]): HleEvent {
  return `studio.soal.masalah.${kode.toLowerCase()}` as HleEvent;
}

/** One problem of a save: which field, and for an option its label. */
export type MasalahSoal = { code: string; field?: string; label?: string };

/** The question an editor sends (ubah_soal_draf's and tambah_soal_draf's p_soal). */
export type SoalDraf = {
  /** Daisy Q5 field 1, «Bacaan» (optional); an editor that omits it leaves the reading as it is */
  stimulus?: string;
  stem: string;
  options: Array<{ label: string; body: string; is_correct: boolean; rationale: string; misconception_code?: string | null }>;
  objective_ids?: string[];
  /** tambah_soal_draf only: practice (null), or one of the package's tests */
  use?: "PRE_TEST" | "POST_TEST" | null;
  item_type?: "MCQ_SINGLE" | "MCQ_MULTI";
};

/** What a save changed, by name (item_draft_edits.changed, riwayat_soal's `perubahan`): never the text. */
export type PerubahanSoal = {
  stimulus?: true;
  stem?: true;
  options?: Array<{ label: string; kind: "ADDED" | "REMOVED" | "CHANGED" }>;
  key?: { from: string[]; to: string[] };
  rationale?: string[];
  misconception?: string[];
  objectives?: true;
};

/** The question identity column's problems (package_identity_problems), each at its sheet and row. */
export const KODE_IDENTITAS_SOAL = [
  "ITEM_IDENTITY_UNKNOWN", "ITEM_IDENTITY_NO_PREDECESSOR", "ITEM_IDENTITY_OTHER_COURSE", "ITEM_IDENTITY_NOT_PREDECESSOR",
  "ITEM_IDENTITY_REPEATED",
] as const;
export type KodeIdentitasSoal = (typeof KODE_IDENTITAS_SOAL)[number];
export function kunciMasalahIdentitas(kode: KodeIdentitasSoal): HleEvent {
  return `studio.soal.identitas.${kode.toLowerCase()}` as HleEvent;
}

/** keadaan_terbitan's `keadaan` (Daisy, C1-B2): never the teacher's «Ditarik». */
export const KEADAAN_TERBITAN = ["BERJALAN", "DIGANTIKAN", "DIHENTIKAN_PENERBIT"] as const;
export type KeadaanTerbitan = (typeof KEADAAN_TERBITAN)[number];

// ───────────────────────────────────────────────────────────── the key correction and the certificate review (PR190)

/** Every code koreksi_tolak raises (PR190, code in DETAIL). */
export const KODE_KOREKSI_DB = [
  "CORRECTION_NOT_ALLOWED", "CORRECTION_UNKNOWN", "CORRECTION_ITEM_NOT_PUBLISHED", "CORRECTION_NOT_IN_HEAD",
  "CORRECTION_OPEN_REVISION", "CORRECTION_KEY_INVALID", "CORRECTION_KEY_UNCHANGED", "CORRECTION_REASON_REQUIRED",
  "CORRECTION_PENDING", "CORRECTION_ALREADY_DECIDED", "CORRECTION_OWN_PROPOSAL", "CORRECTION_CONFIRM_NOT_ALLOWED",
  "CORRECTION_PROPOSER_LAPSED", "CORRECTION_STALE", "CORRECTION_NOT_READY", "CORRECTION_SITTING_NOT_AFFECTED",
  "CORRECTION_CONCURRENT", "RESULT_NOT_VISIBLE",
  "CERT_REVIEW_UNKNOWN", "CERT_REVIEW_NOT_ALLOWED", "CERT_REVIEW_DECIDED", "CERT_REVIEW_DECISION_INVALID",
  "CERT_REVIEW_REASON_REQUIRED",
] as const;
export const KODE_KOREKSI = [...KODE_KOREKSI_DB, "CORRECTION_FAILED"] as const;
export type KodeKoreksi = (typeof KODE_KOREKSI)[number];

export function kodeKoreksiDariGalat(e: { code?: string | null; details?: string | null } | null | undefined): KodeKoreksi {
  if (e?.code === "PR190" && typeof e.details === "string" && (KODE_KOREKSI_DB as readonly string[]).includes(e.details)) {
    return e.details as KodeKoreksi;
  }
  return "CORRECTION_FAILED";
}
export function kunciKodeKoreksi(kode: KodeKoreksi): HleEvent {
  return `studio.koreksi.galat.${kode.toLowerCase()}` as HleEvent;
}

/** koreksi_kunci_dampak's counts, by the recalculation's own rule. `daftar` is absent for platform content. */
export type DampakKoreksi = {
  sesi_selesai: number; sekolah: number; hasil_berubah: number; putusan_target_berubah: number;
  sertifikat_ditinjau: number; sertifikat_baru_layak: number; sesi_terbuka: number;
  daftar?: Array<{ sesi: string; nama: string | null; nama_tempat: string | null; mode: string; sebelum: number | null;
    sesudah: number | null; berubah: boolean; lulus_sebelum: boolean | null; lulus_sesudah: boolean | null; sertifikat_ditinjau: boolean;
    /** L1-F4 (§3b Option A): newly earned for a person whose personal data was deleted: earned, not issued */
    sertifikat_tidak_diterbitkan?: boolean }>;
  koreksi: string; status: "PENDING" | "CONFIRMED" | "DECLINED"; kunci_lama: string[]; kunci_baru: string[]; alasan: string;
  konten_platform: boolean; boleh_tegaskan: boolean; milik_sendiri: boolean;
};

/** verify_certificate's `validity`: DITINJAU is a third, neutral state, never the mark of «Berlaku». */
export const VALIDITAS_SERTIFIKAT = ["BERLAKU", "DITINJAU", "DICABUT", "DIGANTIKAN"] as const;
export type ValiditasSertifikat = (typeof VALIDITAS_SERTIFIKAT)[number];

/** The two decisions on a certificate under review (putuskan_tinjauan_sertifikat's p_keputusan); there is no default. */
export const KEPUTUSAN_TINJAUAN = ["CONFIRMED", "REVOKED"] as const;
export type KeputusanTinjauan = (typeof KEPUTUSAN_TINJAUAN)[number];

/** riwayat_hasil_sesi's `jenis` of each result in a sitting's chain. */
export const JENIS_HASIL = ["SEALED", "RECALCULATED", "KEY_CORRECTED"] as const;
