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
  /** an open sitting the teacher resumed after it was held */
  dilanjutkan?: boolean;
  penutupan: "DEADLINE" | "TEACHER_SCORED" | "TEACHER_NOT_COUNTED" | "ASSIGNMENT_ENDED" | "OTHER" | null;
  dihitung: boolean; tenggat: string | null; diperpanjang: number; percobaan_diizinkan: boolean;
};

// ───────────────────────────────────────────────────────────── A1 on the screens (Daisy, TINJAUAN-A1-C1W Q4, §A1·N1, §A1·N2)

/** The acts of the «Atur» panel. */
export const TINDAKAN = ["waktu", "akhiri", "minta", "lanjut", "tutup"] as const;
export type Tindakan = (typeof TINDAKAN)[number];

/** «Tambah waktu» offers these minutes and no others. */
export const MENIT_TAMBAHAN = [5, 10, 15, 30] as const;

/**
 * The acts that apply to one learner's row. An act that cannot apply is ABSENT, never disabled, and a row with no act
 * gets no «Atur» link at all:
 *   open                                   extra time (while it has a deadline and fewer than three extensions) and ending it
 *   held, the learner reinstated           resume, or close without counting
 *   held, the account still suspended      nothing
 *   handed in or ended, no attempt left    request one more (never while a request waits or a granted one is unused)
 *   not started                            nothing
 */
export function tindakanUntuk(b: Pick<BarisPengerjaan, "keadaan" | "tenggat" | "diperpanjang" | "murid_aktif" | "percobaan_terpakai"
  | "batas_percobaan" | "permintaan_status" | "izin_belum_dipakai" | "sesi_id">): Tindakan[] {
  if (!b.sesi_id) return [];
  if (b.keadaan === "OPEN") return [...(b.tenggat !== null && (b.diperpanjang ?? 0) < 3 ? ["waktu" as const] : []), "akhiri"];
  if (b.keadaan === "FROZEN") return b.murid_aktif ? ["lanjut", "tutup"] : [];
  if (b.keadaan === "NOT_STARTED") return [];
  const habis = b.batas_percobaan !== null && b.percobaan_terpakai >= b.batas_percobaan;
  return habis && b.permintaan_status !== "PENDING" && !b.izin_belum_dipakai ? ["minta"] : [];
}

/** Whole minutes of a number of seconds, rounded down and never below zero («sisa 12 menit»). */
export const menitDari = (detik: number | null | undefined): number | null =>
  detik === null || detik === undefined ? null : Math.max(0, Math.floor(detik / 60));

/** One row of percobaan_antrean: a waiting request the reader may decide (or their own, which they may not). */
export type BarisAntrean = {
  id: string; person_id: string; nama: string; kelas_id: string | null; kelas: string | null; assessment_assignment_id: string;
  judul: string; mode: string; diminta_oleh: string; nama_peminta: string; diminta_pada: string; alasan: string;
  percobaan_terpakai: number; batas_percobaan: number | null; milik_sendiri: boolean;
  kursus: string | null; hasil_terakhir: number | null; target: number | null;
};

/** Where the approver's queue is drawn: a school admin's own page under Konfigurasi, a head of department's own home. */
export const ALAMAT_ANTREAN = { konfigurasi: "/konfigurasi/kesempatan", pimpinan: "/pimpinan?kesempatan=buka" } as const;
export type TempatAntrean = keyof typeof ALAMAT_ANTREAN;

/** How the learner's player says a sitting ended under it: each ending its own notice (A1-B1), never one for all. */
export type AkhirPemain = "dinilai" | "tidak_dihitung" | "sekolah" | "waktu_habis";
export const KUNCI_AKHIR_PEMAIN: Record<AkhirPemain, HleEvent> = {
  dinilai: "sync.diakhiri_guru_dinilai",
  tidak_dihitung: "sync.diakhiri_guru_tidak_dihitung",
  sekolah: "sync.diakhiri_sekolah",
  waktu_habis: "sync.waktu_habis",
};
/** From pengerjaan_saya's answer: which ending the open player must say, or null while the sitting is still the learner's. */
export function akhirDariKeadaan(k: Pick<PengerjaanSaya, "status" | "penutupan"> | null | undefined): AkhirPemain | null {
  if (!k) return null;
  if (k.penutupan === "TEACHER_SCORED") return "dinilai";
  if (k.penutupan === "TEACHER_NOT_COUNTED") return "tidak_dihitung";
  if (k.penutupan === "ASSIGNMENT_ENDED" && k.status === "TERMINATED") return "sekolah";
  // ended by its deadline: said only once it has been scored (inside the late-sync window the learner's answers still travel)
  if (k.penutupan === "DEADLINE" && k.status === "FINALIZED") return "waktu_habis";
  return null;
}
/** From a refusal's code and DETAIL (PR002 on an answer, PR003 on a hand-in): the ending it names, or null. */
export function akhirDariGalat(code: string | null | undefined, detail: string | null | undefined): AkhirPemain | null {
  if (detail === "SESSION_ENDED_SCORED") return "dinilai";
  if (detail === "SESSION_ENDED_NOT_COUNTED") return "tidak_dihitung";
  if (code === "PR003") return "sekolah";
  return null;
}

/**
 * What a chapter's card on Belajar adds for the learner (Daisy, Q5 and §A1·N1): the sitting is held; the teacher resumed
 * it; the teacher ended it as not counted; it ended at its deadline; an approved further attempt waits. Never a
 * reason, never a waiting or a declined request.
 */
export type CatatanBab = {
  jenis: "ditahan" | "lanjut" | "tidak_dihitung" | "waktu_habis" | "sekali_lagi";
  instrumen: "PRE_TEST" | "POST_TEST";
  /** whole minutes left on a resumed sitting, when it has a deadline */
  sisaMenit: number | null;
};
const TERBUKA = ["CREATED", "IN_PROGRESS", "PAUSED"];
/** From one instrument's latest sitting, its learner-side reading and whether a granted attempt waits. Pure. */
export function catatanDari(instrumen: CatatanBab["instrumen"], status: string | null, k: PengerjaanSaya | null, izin: boolean, sekarang: number): CatatanBab | null {
  const dasar = { instrumen, sisaMenit: null };
  if (status !== null && TERBUKA.includes(status) && k) {
    if (k.ditahan) return { ...dasar, jenis: "ditahan" };
    if (k.dilanjutkan) return { ...dasar, jenis: "lanjut", sisaMenit: k.tenggat ? Math.max(0, Math.floor((Date.parse(k.tenggat) - sekarang) / 60_000)) : null };
    return null;
  }
  if (izin) return { ...dasar, jenis: "sekali_lagi" };
  if (status === "TERMINATED" && k?.penutupan === "TEACHER_NOT_COUNTED") return { ...dasar, jenis: "tidak_dihitung" };
  if (status === "FINALIZED" && k?.penutupan === "DEADLINE") return { ...dasar, jenis: "waktu_habis" };
  return null;
}
