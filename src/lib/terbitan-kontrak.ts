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

// ═══════════════════════════════════════════════════════════ the blockers

/**
 * BOB-17 (D-011) — WHAT HOLDS A RELEASE, AS CODES. `publish_readiness`,
 * `freeze_release` and `studio_package_state` return each blocker as one of
 * these codes with its parameters, never a sentence. Daisy's Terbit step and
 * the package page (DAISY-16) show each through its copy key; an unknown code
 * shows the general line, never the code.
 *
 * The findings checks, one blocker per lesson (and per pattern for a question):
 *   READINESS_TEXT_ERROR       an error found in the learner's text        BLOCKS
 *   READINESS_TEXT_WARNING     a warning in the text not yet acknowledged
 *   READINESS_ITEM_ERROR       an error found in a question                BLOCKS
 *   READINESS_ITEM_WARNING     a warning on a question not yet acknowledged
 * The package's own state (studio_package_state only):
 *   READINESS_NOT_VALIDATED    parts not yet through the technical check
 *   READINESS_RETURNED         parts returned to be fixed                  BLOCKS
 *   READINESS_AWAITING_REVIEW  parts waiting for academic approval
 *   READINESS_NO_RELEASE       the package has no release yet
 *   READINESS_NOT_SEALED       the content is not sealed yet
 */
export const KODE_HAMBATAN = [
  "READINESS_TEXT_ERROR",
  "READINESS_TEXT_WARNING",
  "READINESS_ITEM_ERROR",
  "READINESS_ITEM_WARNING",
  "READINESS_NOT_VALIDATED",
  "READINESS_RETURNED",
  "READINESS_AWAITING_REVIEW",
  "READINESS_NO_RELEASE",
  "READINESS_NOT_SEALED",
] as const;
export type KodeHambatan = (typeof KODE_HAMBATAN)[number];

/** The codes that make a package BLOCKED rather than ACTION_REQUIRED. */
export const HAMBATAN_MENAHAN: readonly KodeHambatan[] = ["READINESS_TEXT_ERROR", "READINESS_ITEM_ERROR", "READINESS_RETURNED"];

/**
 * One blocker as the database returns it. Only the parameters its code uses
 * are present:
 *   count      how many (every code but NO_RELEASE and NOT_SEALED)
 *   lesson_id  the lesson it is about, and `lesson` its title -- null when a
 *              finding is about the course or a chapter as a whole (the four
 *              findings codes)
 *   pattern    the question-quality pattern (the two ITEM codes), one of
 *              POLA_MUTU_SOAL today; a new pattern may arrive, and shows the
 *              general pattern line
 */
export type Hambatan = {
  code: string;
  count?: number;
  lesson_id?: string | null;
  lesson?: string | null;
  pattern?: string | null;
};

/** The question-quality patterns run_mcq_quality names today (for their copy). */
export const POLA_MUTU_SOAL = [
  "ANSWER_POSITION_SKEW",
  "CORRECT_OPTION_LENGTH_IMBALANCE",
  "IMPLAUSIBLE_DISTRACTOR",
  "STEM_REVEALS_ANSWER",
] as const;

/** A blocker's copy key; an unknown code gets the general line (D-014). */
export function kunciHambatan(h: Pick<Hambatan, "code">): HleEvent {
  return ((KODE_HAMBATAN as readonly string[]).includes(h.code)
    ? `studio.hambatan.${h.code.toLowerCase()}`
    : "studio.hambatan.lain") as HleEvent;
}

/** A pattern's copy key; an unknown pattern gets the general pattern line. */
export function kunciPola(pola: string | null | undefined): HleEvent {
  return ((POLA_MUTU_SOAL as readonly string[]).includes(pola ?? "")
    ? `studio.hambatan.pola.${(pola as string).toLowerCase()}`
    : "studio.hambatan.pola.lain") as HleEvent;
}

/**
 * One blocker as a line: its count, its sentence, its pattern and its lesson,
 * each from the copy table. Pure: the caller passes its own `s` (a copy
 * lookup) and `angka` (a number in the reader's locale).
 */
export function kalimatHambatan(h: Hambatan, s: (k: HleEvent) => string, angka: (n: number) => string): string {
  // DAISY-16: a code the catalogue does not know reads as the general line alone -- no count,
  // pattern or lesson hung on a sentence that is not about them
  if (!(KODE_HAMBATAN as readonly string[]).includes(h?.code)) return s("studio.hambatan.lain");
  const jumlah = typeof h.count === "number" ? `${angka(h.count)} ` : "";
  const pola = h.pattern !== undefined && h.pattern !== null ? ` (${s(kunciPola(h.pattern))})` : "";
  const pelajaran = h.lesson ? ` · ${s("studio.hambatan.pelajaran")} ${h.lesson}` : "";
  return `${jumlah}${s(kunciHambatan(h))}${pola}${pelajaran}`;
}

/** Whether these blockers stop the release (BLOCKED) or only need action. */
export function kesiapanDari(hambatan: readonly Hambatan[]): KesiapanTerbit {
  if (hambatan.some((h) => (HAMBATAN_MENAHAN as readonly string[]).includes(h.code))) return "BLOCKED";
  return hambatan.length > 0 ? "ACTION_REQUIRED" : "READY";
}

export type HasilTerbitan =
  | { ok: true; release: string; status: "INGESTED" | "FROZEN" | "PUBLISHED" | "SUPERSEDED";
      versi?: string; kesiapan?: KesiapanTerbit; hambatan?: Hambatan[] }
  | { ok: false; code: KodeTerbitan; release?: string; kesiapan?: KesiapanTerbit; hambatan?: Hambatan[]; ref?: string };

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
