import type { HleEvent } from "@/lib/hle";
import { KODE_TERBITAN_DB, kunciKodeTerbitan, type KodeTerbitan } from "@/lib/terbitan-kontrak";
import {
  KODE_MASALAH_PAKET, KODE_TOLAK_PAKET, LEMBAR, kunciKodePaket, kunciMasalahPaket, type KodePaket,
} from "@/lib/unggah-kontrak";

/**
 * BOB-07 (D-011) — THE STABLE CODES A SERVER ACTION ANSWERS WITH.
 *
 * A refusal reaches a reader as one of these codes and the copy table's
 * sentence for it, never as the database's or Auth's own words. Those go to
 * the server log next to a short reference, and the reader is shown the
 * reference (`ACTION_FAILED`). The codes are the contract between the actions
 * and the banners that show them; the words are Daisy's (D-014).
 *
 * The domain contracts keep their own codes and are reused here unchanged:
 * releases (terbitan-kontrak.ts, PR040), packages (unggah-kontrak.ts, PR030)
 * and school structure (struktur-kontrak.ts, PR020).
 *
 * Pure: the actions build the result, the pages read it back, and the tests
 * drive both with nothing else loaded.
 */

/** Any action. */
export const KODE_GALAT = [
  "ACTION_NOT_ALLOWED",     // the database refused this reader (42501, or a capability rule)
  "ACTION_NOT_FOUND",       // what the form named is not there, or not visible to this reader
  "ACTION_INPUT_INVALID",   // the form is incomplete or a value is not the right shape
  "ACTION_ALREADY_EXISTS",  // a unique rule: it is already there
  "ACTION_UNCHANGED",       // nothing changed: row-level security filtered it to no rows (F-05)
  "ACTION_PLACE_INACTIVE",  // BOB-08: the place chosen has been deactivated (PR020 STRUCTURE_PLACE_INACTIVE)
  "ACTION_FAILED",          // anything else; the reader is given a reference to quote
] as const;

/**
 * DAISY-31 (BOB-35): THE TWO REFUSALS A RELEASE MOVE CAN MEET, from Studio's
 * «Koreksi» (`move_learning_assignment_release`). The session/release
 * invariant raises them as SQLSTATE PR060 with the code in DETAIL:
 * - RELEASE_MOVE_STARTED: a learner has already started the assignment, so a
 *   correction is a new assignment (INV-24);
 * - RELEASE_MOVE_NO_CYCLE_DEFINITION: the target release has no pre-test and
 *   post-test for the cycle to move with.
 * PR060's other refusal (SESSION_RELEASE_MISMATCH) and PR061's
 * (QUICK_RULES_FIXED) are not a reader's to act on: they stay ACTION_FAILED,
 * with a reference, whatever their message says.
 */
export const KODE_PINDAH = ["RELEASE_MOVE_STARTED", "RELEASE_MOVE_NO_CYCLE_DEFINITION"] as const;

/**
 * D-085 M9: THE FOUR REFUSALS OF A CLASS MOVE, from Konfigurasi's «Pindah
 * kelas» (`move_learner_to_class`), SQLSTATE PR070 with the code in DETAIL:
 * - MOVE_NOT_CURRENT: the placement has already ended (a second press, or a
 *   move made meanwhile), or the enrolment has;
 * - MOVE_NOT_A_KELAS: the placement or the destination is not a Kelas;
 * - MOVE_SAME_KELAS: the learner is already in the destination;
 * - MOVE_OTHER_YEAR: the destination is in another academic year (the
 *   rollover's work, not a move's);
 * - MOVE_ALREADY_IN_KELAS (J3.6): placing a learner from their Tingkat, who
 *   already has a Kelas in it; they move from that Kelas.
 * Not allowed (42501) stays ACTION_NOT_ALLOWED and a deactivated Kelas
 * ACTION_PLACE_INACTIVE, as for every action. Any other PR070 is ACTION_FAILED.
 */
export const KODE_PINDAH_KELAS = ["MOVE_NOT_CURRENT", "MOVE_NOT_A_KELAS", "MOVE_SAME_KELAS", "MOVE_OTHER_YEAR", "MOVE_ALREADY_IN_KELAS"] as const;

/**
 * D-088(b), BOB-49: a lesson whose pass mark the school has not set cannot be given to a class or launched as an Uji
 * Cepat. The assignment's seal raises PR050 with ASSIGN_PASS_MARK_MISSING in DETAIL; every other PR050 is the assign
 * contract's (penugasan-kontrak.ts) and stays ACTION_FAILED here.
 */
export const KODE_KETUNTASAN = ["PASS_MARK_MISSING"] as const;

/**
 * A content step (Studio steps 1–4, `advanceContentAction`): each refusal
 * `enforce_content_status` can raise, named. `kodeGalatKonten` reads them from
 * the database's message, which carries no code of its own; BOB07-K02 reads
 * every `raise` of the migration that last defines the trigger and requires a
 * code for each, so a new refusal cannot arrive without one.
 */
export const KODE_KONTEN = [
  "CONTENT_TRANSITION_INVALID",
  "CONTENT_REVIEW_NOT_ALLOWED",
  "CONTENT_REVIEWER_REQUIRED",
  "CONTENT_AUTHOR_UNKNOWN",
  "CONTENT_REVIEWER_IS_AUTHOR",
  "CONTENT_REVIEWER_NOT_CALLER",
  "CONTENT_SEAL_NOT_ALLOWED",
  "CONTENT_PUBLISH_NOT_ALLOWED",
  "CONTENT_WITHDRAW_NOT_ALLOWED",
  "CONTENT_AUTHOR_IMMUTABLE",
  "CONTENT_CREATED_NOT_INGESTED",
] as const;

/** A form the reader has to complete; each says what is missing. */
export const KODE_ISIAN = [
  "ROLLOVER_INPUT_INCOMPLETE",
  "TRANSFER_INPUT_INCOMPLETE",
  "ROLE_INPUT_INCOMPLETE",
  "ROLE_SCOPE_REQUIRED",
  "FLAG_KEY_INVALID",
  "TEMPLATE_INPUT_INCOMPLETE",
  "SCHOOL_REQUIRED",
  "MOVE_INPUT_INCOMPLETE",
  "PASS_MARK_INPUT_INCOMPLETE",
] as const;

/** A success that says more than "saved"; `n`, when given, follows the sentence. */
export const KODE_SUKSES = [
  "ROLLOVER_DONE",          // n: memberships moved
  "TEMPLATE_SAVED",         // n: metrics in the template
  "DEFINITION_NEW_VERSION",
  "DEFINITION_KEPT",
  // DAISY-18 (D-047): the key actions say what was done, not only "saved"
  "ROLE_GRANTED", "ROLE_REVOKED",
  "TRANSFER_REQUESTED", "TRANSFER_AUTHORIZED", "TRANSFER_EXECUTED", "TRANSFER_REJECTED",
  "FLAG_SAVED", "PLATFORM_SETTING_SAVED",
  "STEP_TAKEN", "CHECK_RUN", "FINDING_ACKNOWLEDGED", "REVISION_CREATED", "ASSIGNMENT_MOVED",
  "DISTRIBUTION_GRANTED", "DISTRIBUTION_WITHDRAWN", "REVIEW_RECORDED", "CERTIFICATE_SAVED", "QUICK_CHECK_LAUNCHED",
  // BOB-19: a confirmed upload opens its new course, which says so
  "DRAFT_CREATED",
  // D-085 M9: a learner moved to another Kelas
  "LEARNER_MOVED",
  // D-088(b): a lesson's pass mark set, or already that value
  "PASS_MARK_SET", "PASS_MARK_UNCHANGED",
] as const;

export type KodePindah = (typeof KODE_PINDAH)[number];
export type KodePindahKelas = (typeof KODE_PINDAH_KELAS)[number];
export type KodeKetuntasan = (typeof KODE_KETUNTASAN)[number];
/** What `kodeGalat` answers: any action's codes, a release move's two (DAISY-31) and a class move's four (M9). */
export type KodeGalat = (typeof KODE_GALAT)[number] | KodePindah | KodePindahKelas | KodeKetuntasan;
export type KodeKonten = (typeof KODE_KONTEN)[number];
export type KodeIsian = (typeof KODE_ISIAN)[number];
export type KodeSukses = (typeof KODE_SUKSES)[number];

/** Every code a banner may carry: these and the domain contracts' own. */
export type KodeHasil = KodeGalat | KodeKonten | KodeIsian | KodeSukses | KodeTerbitan | KodePaket;

/** A problem of a package upload, at its sheet and row. */
export type MasalahHasil = { code: string; sheet?: string; row?: number };

/** What an action carries back to the page it came from. */
export type HasilAksi =
  | { ok: true; kode?: KodeSukses; n?: number }
  | { ok: false; kode: KodeHasil; ref?: string; masalah?: MasalahHasil[] };

type GalatDb = { code?: string | null; details?: string | null; message?: string | null } | null | undefined;

/**
 * Any action's refusal, from the database's error: its SQLSTATE first, then
 * the few shapes the database words its own refusals in. Everything else is
 * ACTION_FAILED, which the caller logs with a reference.
 */
export function kodeGalat(e: GalatDb): KodeGalat {
  const state = e?.code ?? "";
  const pesan = e?.message ?? "";
  if (state === "PR020" && e?.details === "STRUCTURE_PLACE_INACTIVE") return "ACTION_PLACE_INACTIVE";
  // DAISY-31: a release move's two refusals by their DETAIL; every other PR060
  // and PR061 is ACTION_FAILED before any message pattern can reword it
  if (state === "PR060" && (KODE_PINDAH as readonly string[]).includes(e?.details ?? "")) return e!.details as KodePindah;
  if (state === "PR060" || state === "PR061") return "ACTION_FAILED";
  // D-088(b): no school pass mark for the lesson
  if (state === "PR050" && e?.details === "ASSIGN_PASS_MARK_MISSING") return "PASS_MARK_MISSING";
  // M9: a class move's four refusals by their DETAIL, and no other PR070
  if (state === "PR070") {
    return (KODE_PINDAH_KELAS as readonly string[]).includes(e?.details ?? "") ? e!.details as KodePindahKelas : "ACTION_FAILED";
  }
  if (state === "42501" || /permission denied|\brequires CAN_[A-Z_]+|\bnot allowed\b|\bmay not\b|\bonly (?:a|an|the) [A-Z_]+/i.test(pesan)) {
    return "ACTION_NOT_ALLOWED";
  }
  if (state === "23505") return "ACTION_ALREADY_EXISTS";
  if (state === "P0002" || /\bnot found\b|\bno such\b|\bunknown\b|\bdoes not exist\b/i.test(pesan)) return "ACTION_NOT_FOUND";
  if (["22P02", "22023", "22007", "22008", "23502", "23514", "22001", "22003"].includes(state)) return "ACTION_INPUT_INVALID";
  return "ACTION_FAILED";
}

/**
 * The patterns of `enforce_content_status`'s refusals, in the order the
 * trigger checks them. Anchored at the start, so a message that only quotes
 * one cannot be taken for it.
 */
const POLA_KONTEN: ReadonlyArray<readonly [RegExp, KodeKonten]> = [
  [/^content rows are created at INGESTED/, "CONTENT_CREATED_NOT_INGESTED"],
  [/^illegal content transition /, "CONTENT_TRANSITION_INVALID"],
  [/^approving content requires CAN_REVIEW/, "CONTENT_REVIEW_NOT_ALLOWED"],
  [/^APPROVED requires a reviewer/, "CONTENT_REVIEWER_REQUIRED"],
  [/^APPROVED requires a known author/, "CONTENT_AUTHOR_UNKNOWN"],
  [/^the reviewer may not be the author/, "CONTENT_REVIEWER_IS_AUTHOR"],
  [/^the recorded reviewer is the caller/, "CONTENT_REVIEWER_NOT_CALLER"],
  [/^sealing content requires CAN_FREEZE_RELEASE/, "CONTENT_SEAL_NOT_ALLOWED"],
  [/^publishing requires CAN_PUBLISH/, "CONTENT_PUBLISH_NOT_ALLOWED"],
  [/^withdrawing published content requires CAN_PUBLISH/, "CONTENT_WITHDRAW_NOT_ALLOWED"],
  [/^author_person_id is immutable/, "CONTENT_AUTHOR_IMMUTABLE"],
];

/** A content step's refusal: the trigger's own, else any action's. */
export function kodeGalatKonten(e: GalatDb): KodeKonten | KodeGalat {
  const pesan = (e?.message ?? "").replace(/^ERROR:\s*/i, "");
  for (const [pola, kode] of POLA_KONTEN) if (pola.test(pesan)) return kode;
  return kodeGalat(e);
}

/** A short reference for a failure nobody named; the same one goes to the log. */
export function rujukan(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "0");
}

const SEMUA_KODE = new Set<string>([
  ...KODE_GALAT, ...KODE_PINDAH, ...KODE_PINDAH_KELAS, ...KODE_KETUNTASAN, ...KODE_KONTEN, ...KODE_ISIAN, ...KODE_SUKSES,
  ...KODE_TERBITAN_DB, "RELEASE_INPUT_INVALID", "RELEASE_FAILED",
  ...KODE_TOLAK_PAKET, "PACKAGE_HAS_PROBLEMS", "PACKAGE_INPUT_INVALID", "PACKAGE_FAILED",
]);

/** The copy key of a code (D-014). A code this file does not know is ACTION_FAILED's. */
export function kunciKode(kode: string): HleEvent {
  if (!SEMUA_KODE.has(kode)) return "galat.action_failed";
  // the definition's two outcomes already had their sentences
  if (kode === "DEFINITION_NEW_VERSION") return "studio.definisi.versi_baru";
  if (kode === "DEFINITION_KEPT") return "studio.definisi.tetap";
  // a release move's refusals are the release's own family of sentences
  if ((KODE_PINDAH as readonly string[]).includes(kode)) return `studio.terbitan.kode.${kode.toLowerCase()}` as HleEvent;
  if (kode.startsWith("RELEASE_")) return kunciKodeTerbitan(kode as KodeTerbitan);
  if (kode.startsWith("PACKAGE_")) return kunciKodePaket(kode as KodePaket);
  if (kode.startsWith("CONTENT_")) return `studio.konten.kode.${kode.toLowerCase()}` as HleEvent;
  return `galat.${kode.toLowerCase()}` as HleEvent;
}

// ------------------------------------------------------------------ transport

/** The query a redirect carries: hasil, kode, ref, n, masalah. Codes only. */
export function queryHasil(bagian: string, h: HasilAksi): URLSearchParams {
  const q = new URLSearchParams({ bagian, hasil: h.ok ? "ok" : "gagal" });
  if (h.kode) q.set("kode", h.kode);
  if (h.ok && typeof h.n === "number" && Number.isFinite(h.n)) q.set("n", String(Math.trunc(h.n)));
  if (!h.ok && h.ref) q.set("ref", h.ref);
  if (!h.ok && h.masalah?.length) {
    q.set("masalah", h.masalah.slice(0, 5)
      .map((m) => [m.code, m.sheet ?? "", m.row ?? ""].join(":")).join(","));
  }
  return q;
}

export type QueryHasil = { hasil?: string; kode?: string; ref?: string; n?: string; masalah?: string };

/**
 * The query read back, trusting nothing: a code it does not know, a reference
 * or a count of the wrong shape and a sheet PINTAR does not have are dropped,
 * so no text typed into an address can reach the banner.
 */
export function bacaHasil(q: QueryHasil): {
  ok: boolean; kode: string | null; ref: string | null; n: number | null; masalah: MasalahHasil[];
} | null {
  if (q.hasil !== "ok" && q.hasil !== "gagal") return null;
  const kode = q.kode && SEMUA_KODE.has(q.kode) ? q.kode : null;
  const ref = q.ref && /^[A-Z0-9]{6}$/.test(q.ref) ? q.ref : null;
  const n = q.n && /^\d{1,7}$/.test(q.n) ? Number(q.n) : null;
  const masalah: MasalahHasil[] = [];
  for (const bagian of (q.masalah ?? "").split(",").slice(0, 5)) {
    const [code, sheet, row] = bagian.split(":");
    if (!code || !(KODE_MASALAH_PAKET as readonly string[]).includes(code)) continue;
    masalah.push({
      code,
      sheet: sheet && (LEMBAR as readonly string[]).includes(sheet) ? sheet : undefined,
      row: row && /^\d{1,6}$/.test(row) ? Number(row) : undefined,
    });
  }
  return { ok: q.hasil === "ok", kode, ref, n, masalah };
}

/**
 * THE BANNER'S SENTENCE: the surface's own "saved" or "not saved", the code's
 * sentence, a count after it, each package problem at its place, and the
 * reference to quote. `s` is the surface's translator, `awal` its two
 * prefixes. Null when there is nothing to say.
 */
export function kalimatHasil(
  q: QueryHasil,
  s: (k: HleEvent) => string,
  awal: { ok: HleEvent; gagal: HleEvent },
): string | null {
  const h = bacaHasil(q);
  if (!h) return null;
  const bagian = [s(h.ok ? awal.ok : awal.gagal)];
  if (h.kode) bagian.push(s(kunciKode(h.kode)) + (h.n !== null ? ` ${h.n}.` : ""));
  for (const m of h.masalah) {
    bagian.push(s(kunciMasalahPaket(m.code)) + (m.sheet ? ` (${m.sheet}${m.row ? ` ${m.row}` : ""})` : ""));
  }
  if (h.ref) bagian.push(`${s("galat.rujukan")}: ${h.ref}.`);
  return bagian.join(" ");
}
