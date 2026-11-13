/**
 * E5 «Akhiri tugas di sekolah ini» and §11 «Ubah peran & tanggung jawab» (owner, 9 Nov): the screen's contract with
 * akhiri_tugas_staf, peran_orang and ubah_peran (migration 20270113120000). Pure: no database, no React.
 */
import type { HleEvent } from "./hle";

/** Every code the three functions raise (PR130, code in DETAIL). */
export const KODE_STAF_DB = [
  "STAFF_NOT_ALLOWED", "STAFF_SELF", "STAFF_NOT_ACTIVE", "STAFF_CATEGORY_INVALID", "STAFF_REASON_REQUIRED", "STAFF_DATE_INVALID",
  "ROLE_STALE", "ROLE_NOTHING", "ROLE_NOT_ALLOWED", "ROLE_SCOPE_INVALID", "ROLE_UNTIL_INVALID", "ROLE_ADMIN_UNCONFIRMED", "ROLE_REMOVE_INVALID",
  // Sharon §15 (6faef690): a person with no tie to this school is not read
  "STAFF_UNKNOWN",
] as const;
export const KODE_STAF = [...KODE_STAF_DB, "STAFF_FAILED"] as const;
export type KodeStaf = (typeof KODE_STAF)[number];

/** E5's categories (ACCOUNT-LIFECYCLE-INVENTORY.md §4), in akhiri_tugas_staf's own list and order. */
export const KATEGORI_AKHIR = ["RETIREMENT", "RESIGNATION", "DISMISSAL", "TRANSFER", "CONTRACT_END", "CORRECTION", "OTHER"] as const;
export type KategoriAkhir = (typeof KATEGORI_AKHIR)[number];
/** The order the screen offers them (Daisy, TINJAUAN-89374424 §1.3); «Dicatat keliru» is set apart on the screen. */
export const URUTAN_KATEGORI: readonly KategoriAkhir[] = ["RETIREMENT", "RESIGNATION", "TRANSFER", "CONTRACT_END", "DISMISSAL", "OTHER", "CORRECTION"];

/** The roles a school gives (never SYSTEM_ADMIN; INSTITUTION_ADMIN only at the school's own node, with its second press). */
export const PERAN_SEKOLAH = ["EDUCATOR", "HEAD_OF_DEPARTMENT", "DEAN", "INSTITUTION_ADMIN"] as const;

/** The responsibilities role_capabilities names, plus the management-decision rule: each has words of its own. */
export const TANGGUNG_JAWAB = [
  "CAN_DRAFT", "CAN_REVIEW", "CAN_FREEZE_RELEASE", "CAN_PUBLISH", "CAN_ASSIGN_LEARNING", "CAN_QUICK_ASSESSMENT", "CAN_AUTHORIZE_TRANSFER",
  "CAN_REVIEW_QUESTION_HEALTH", "CAN_MANAGE_REPORT_TEMPLATES", "CAN_REVIEW_INTEGRITY", "CAN_VIEW_LEARNER_ROSTER", "CAN_VIEW_LEARNER_RESULT",
  "CAN_PROVISION_PEOPLE", "CAN_MANAGE_SITTINGS", "MANAGEMENT_DECISION",
] as const;

export function kunciTanggungJawab(tj: string): HleEvent {
  return `staf.tj.${tj.toLowerCase()}` as HleEvent;
}

export function kodeStafDariGalat(e: { code?: string | null; details?: string | null } | null | undefined): KodeStaf {
  if (e?.code === "PR130" && typeof e.details === "string" && (KODE_STAF_DB as readonly string[]).includes(e.details)) {
    return e.details as KodeStaf;
  }
  if (e?.code === "42501") return "STAFF_NOT_ALLOWED";
  return "STAFF_FAILED";
}

export function kodeStafDari(v: string | undefined | null): KodeStaf | null {
  if (!v) return null;
  return ((KODE_STAF as readonly string[]).includes(v) ? v : "STAFF_FAILED") as KodeStaf;
}
