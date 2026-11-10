/**
 * A1 · sitting control: the contract with the sitting, attempt and window acts of migration 20270114100000
 * (tambah_waktu_pengerjaan, akhiri_pengerjaan, lanjutkan_pengerjaan, tutup_pengerjaan_ditahan, minta_percobaan,
 * putuskan_percobaan, percobaan_antrean, ubah_jadwal_penugasan, daftar_pengerjaan, pengerjaan_saya).
 * Pure: no database, no React.
 */
import type { HleEvent } from "./hle";

/** Every code a signed-in caller can be answered (PR170, code in DETAIL). The scheduler's own code never reaches a screen. */
export const KODE_PENGERJAAN_DB = [
  "SITTING_NOT_ALLOWED", "SITTING_PROFESSIONAL", "SITTING_REASON_REQUIRED", "SITTING_NOTE_TOO_LONG",
  // the race: the sitting ended (its deadline, the learner's hand-in, another act) before this change was saved
  "SITTING_ALREADY_ENDED",
  "SITTING_FROZEN", "SITTING_NOT_FROZEN", "SITTING_LEARNER_SUSPENDED",
  "SITTING_END_KIND_INVALID", "SITTING_MINUTES_INVALID", "SITTING_EXTEND_LIMIT", "SITTING_NO_DEADLINE",
  "ATTEMPT_NOT_LIMITED", "ATTEMPT_SITTING_OPEN", "ATTEMPT_NOT_NEEDED", "ATTEMPT_REQUEST_OPEN",
  "ATTEMPT_DECISION_NOT_ALLOWED", "ATTEMPT_OWN_REQUEST", "ATTEMPT_ALREADY_DECIDED", "ATTEMPT_REASON_REQUIRED",
  "WINDOW_NOT_ALLOWED", "WINDOW_ASSIGNMENT_ENDED", "WINDOW_INVALID", "WINDOW_UNCHANGED", "WINDOW_NOT_CHANGEABLE",
] as const;
export const KODE_PENGERJAAN = [...KODE_PENGERJAAN_DB, "SITTING_FAILED"] as const;
export type KodePengerjaan = (typeof KODE_PENGERJAAN)[number];

export function kodePengerjaanDariGalat(e: { code?: string | null; details?: string | null } | null | undefined): KodePengerjaan {
  if (e?.code === "PR170" && typeof e.details === "string" && (KODE_PENGERJAAN_DB as readonly string[]).includes(e.details)) {
    return e.details as KodePengerjaan;
  }
  return "SITTING_FAILED";
}

export function kunciKodePengerjaan(kode: KodePengerjaan): HleEvent {
  return `pengerjaan.galat.${kode.toLowerCase()}` as HleEvent;
}

/** Whether a code is one of this contract's (a page told a code by its address reads it back through this). */
export function kodePengerjaanDari(v: string | undefined | null): KodePengerjaan | null {
  return v && (KODE_PENGERJAAN as readonly string[]).includes(v) ? (v as KodePengerjaan) : null;
}

/**
 * What the learner's own acts are answered once the teacher ended the sitting (the DETAIL beside 4.0's PR002 and
 * PR003), each with a notice of its own; a sitting ended with its assignment keeps 4.0's SESSION_ENDED_BY_SCHOOL.
 */
export const KODE_PESERTA_DIAKHIRI = ["SESSION_ENDED_SCORED", "SESSION_ENDED_NOT_COUNTED", "SESSION_ENDED_BY_SCHOOL"] as const;

/** The two ways a teacher ends a sitting (akhiri_pengerjaan's p_cara); there is no default. */
export const CARA_AKHIRI = ["SCORED", "NOT_COUNTED"] as const;
export type CaraAkhiri = (typeof CARA_AKHIRI)[number];

/** daftar_pengerjaan's `keadaan`: the state of a learner's latest sitting of one instrument in one class. */
export const KEADAAN_PENGERJAAN = [
  "NOT_STARTED", "OPEN", "FROZEN", "HANDED_IN", "ENDED_SCORED", "ENDED_NOT_COUNTED", "ENDED_BY_DEADLINE",
  "ENDED_WITH_ASSIGNMENT", "ENDED_OTHER", "EXPIRED_UNSCORED",
] as const;
export type KeadaanPengerjaan = (typeof KEADAAN_PENGERJAAN)[number];

/** One row of daftar_pengerjaan. No score and no rank; the reasons are the teacher's own and the approver's. */
export type BarisPengerjaan = {
  person_id: string; nama: string; sesi_id: string | null; jumlah_sesi: number; keadaan: KeadaanPengerjaan; status: string | null;
  mulai: string | null; tenggat: string | null; sisa_detik: number | null; diperpanjang: number | null;
  ditahan_sejak: string | null; sisa_ditahan_detik: number | null; murid_aktif: boolean;
  berakhir_pada: string | null; dihitung: boolean | null;
  percobaan_terpakai: number; batas_percobaan: number | null; percobaan_diizinkan: boolean; izin_belum_dipakai: boolean;
  permintaan_id: string | null; permintaan_status: "PENDING" | "APPROVED" | "DECLINED" | null; permintaan_pada: string | null;
  permintaan_alasan: string | null; permintaan_oleh_saya: boolean | null; keputusan_pada: string | null; keputusan_alasan: string | null;
};

/** pengerjaan_saya's answer: the learner's own sitting, how it stands and how it ended; never why, never who. */
export type PengerjaanSaya = {
  status: string; ditahan: boolean;
  penutupan: "DEADLINE" | "TEACHER_SCORED" | "TEACHER_NOT_COUNTED" | "ASSIGNMENT_ENDED" | "OTHER" | null;
  dihitung: boolean; tenggat: string | null; diperpanjang: number; percobaan_diizinkan: boolean;
};
