/**
 * BOB-03 — THE RELEASE PATH'S CONTRACT (audit B3). Pure: no database, no
 * React, no server. DAISY-06 builds the Studio's release buttons on exactly
 * this file and the typed actions in src/app/studio/actions.ts.
 *
 * THE PATH. A course is written (CAN_DRAFT) and approved by a second person
 * (CAN_REVIEW); then its release is created, frozen and published. Each step
 * below names the function the action calls, the capability that may take it,
 * and the state it starts from. The Studio shows a button only to someone who
 * holds the capability, and only in that state; the database refuses anything
 * else with the codes in KODE_TERBITAN_DB.
 *
 * FOUR EYES. A release is authored by its course's author, whoever creates
 * it, and the database refuses its approval by that author. Freezing IS that
 * approval, so the course's author never sees a working "Kunci" button on
 * their own course's release: RELEASE_SAME_PERSON.
 *
 * READINESS. "Kunci" runs both content validators first. A course they block
 * is not sealed; the result carries the blockers and the findings appear on
 * the package page to fix. Warnings are acknowledged by a reviewer before
 * "Terbitkan", which needs READY.
 */
import type { HleEvent } from "./hle";

// ═══════════════════════════════════════════════════════════ the steps

export type LangkahTerbitan = {
  /** The typed action in src/app/studio/actions.ts. */
  aksi: "buatTerbitanAksi" | "kunciTerbitanAksi" | "terbitkanAksi" | "tarikTerbitanAksi";
  /** The database function it calls. */
  fungsi: "create_release" | "freeze_release" | "publish_release" | "withdraw_release";
  /** Who may take it. */
  kemampuan: "CAN_FREEZE_RELEASE" | "CAN_PUBLISH";
  /** What must be true first: the course's status, or the release's. */
  dari: { kursus: "APPROVED" } | { terbitan: readonly string[] };
  /** Where it leaves the release. */
  ke: "INGESTED" | "FROZEN" | "PUBLISHED" | "SUPERSEDED";
  /** The form fields it reads. */
  isian: readonly string[];
};

export const LANGKAH_TERBITAN: readonly LangkahTerbitan[] = [
  { aksi: "buatTerbitanAksi", fungsi: "create_release", kemampuan: "CAN_FREEZE_RELEASE",
    dari: { kursus: "APPROVED" }, ke: "INGESTED", isian: ["course"] },
  { aksi: "kunciTerbitanAksi", fungsi: "freeze_release", kemampuan: "CAN_FREEZE_RELEASE",
    dari: { terbitan: ["INGESTED", "STRUCTURED", "VALIDATED", "IN_REVIEW", "APPROVED"] }, ke: "FROZEN", isian: ["release"] },
  { aksi: "terbitkanAksi", fungsi: "publish_release", kemampuan: "CAN_PUBLISH",
    dari: { terbitan: ["FROZEN"] }, ke: "PUBLISHED", isian: ["release"] },
  { aksi: "tarikTerbitanAksi", fungsi: "withdraw_release", kemampuan: "CAN_PUBLISH",
    dari: { terbitan: ["PUBLISHED"] }, ke: "SUPERSEDED", isian: ["release", "alasan"] },
] as const;

// ═══════════════════════════════════════════════════════════ the codes

/** Every code the database raises with SQLSTATE PR040 (code in DETAIL). */
export const KODE_TERBITAN_DB = [
  "RELEASE_NOT_ALLOWED",
  "RELEASE_PUBLISH_NOT_ALLOWED",
  "RELEASE_SCHOOL_NOT_ALLOWED",
  "RELEASE_COURSE_NOT_APPROVED",
  "RELEASE_EXISTS",
  "RELEASE_STATE_INVALID",
  "RELEASE_SAME_PERSON",
  "RELEASE_NOT_READY",
  "RELEASE_REASON_REQUIRED",
] as const;

/**
 * Every code a release action can return: the database's, plus two of the
 * server's own. `RELEASE_INPUT_INVALID`: the course or release was missing or
 * not an id, so nothing was sent. `RELEASE_FAILED`: anything else; it comes
 * with a short reference that is also written to the server log.
 * `RELEASE_NOT_READY` also comes back from "Kunci" as a result rather than a
 * refusal, with the readiness and its blockers.
 */
export type KodeTerbitan = (typeof KODE_TERBITAN_DB)[number] | "RELEASE_INPUT_INVALID" | "RELEASE_FAILED";

/** READY, ACTION_REQUIRED (warnings to acknowledge) or BLOCKED (errors to fix). */
export type KesiapanTerbit = "READY" | "ACTION_REQUIRED" | "BLOCKED";

export type HasilTerbitan =
  | { ok: true; release: string; status: "INGESTED" | "FROZEN" | "PUBLISHED" | "SUPERSEDED";
      versi?: string; kesiapan?: KesiapanTerbit; hambatan?: string[] }
  | { ok: false; code: KodeTerbitan; release?: string; kesiapan?: KesiapanTerbit; hambatan?: string[]; ref?: string };

/**
 * A refusal, as its stable code. A caller the database will not even let
 * execute the function (42501) is not allowed either. Everything else is
 * RELEASE_FAILED: never the database's own words.
 */
export function kodeGalatTerbitan(e: { code?: string | null; details?: string | null } | null | undefined): KodeTerbitan {
  if (e?.code === "PR040" && typeof e.details === "string"
      && (KODE_TERBITAN_DB as readonly string[]).includes(e.details)) {
    return e.details as KodeTerbitan;
  }
  if (e?.code === "42501") return "RELEASE_NOT_ALLOWED";
  return "RELEASE_FAILED";
}

/** The copy key for each code (D-014). */
export function kunciKodeTerbitan(code: KodeTerbitan): HleEvent {
  return `studio.terbitan.kode.${code.toLowerCase()}` as HleEvent;
}
