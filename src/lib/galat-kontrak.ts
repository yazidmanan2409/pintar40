import type { HleEvent } from "@/lib/hle";
import { istilah } from "@/lib/istilah-menunggu";
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
 * W1.6 (Batch 3 screen; Batch 1 data): THE FOUR REFUSALS OF A SEND-BACK, from the package page's «Kembalikan ke
 * penyusun» (`kembalikan_paket`, 20261214100000), 42501 or PR040 with the code in DETAIL:
 * - SENDBACK_NOT_REVIEWER: no CAN_REVIEW in the package's school (or no person in the session);
 * - SENDBACK_NOT_IN_REVIEW: the package is no longer in review (a colleague approved or sent it back meanwhile);
 * - SENDBACK_REVIEWER_IS_AUTHOR: the reader wrote the package (the same second person approval needs);
 * - SENDBACK_REASON_MISSING: the reason is not 10 to 1000 characters.
 * Read by their DETAIL before any message pattern, so the words of the database never decide them.
 */
export const KODE_KEMBALI = [
  "SENDBACK_NOT_REVIEWER", "SENDBACK_NOT_IN_REVIEW", "SENDBACK_REVIEWER_IS_AUTHOR", "SENDBACK_REASON_MISSING",
] as const;

/**
 * W2.15 (Batch 4, F-10 / D-152(c)): a transfer between schools by name, refused by transfer_minta, transfer_terima and
 * cari_sekolah_tujuan with PR040 and the DETAIL these codes come from (KODE_ANTAR_SEKOLAH_DARI_DB); the action maps them.
 */
export const KODE_ANTAR_SEKOLAH = [
  "TRANSFER_DESTINATION_INVALID", "TRANSFER_REASON_REQUIRED", "TRANSFER_OPEN", "TRANSFER_ENROLLMENT_NOT_ACTIVE",
  "TRANSFER_PERIOD_INVALID", "TRANSFER_PROGRAMME_INVALID", "TRANSFER_NOT_OPEN", "TRANSFER_SEARCH_SHORT",
  "TRANSFER_PERIOD_MISSING",
] as const;
export const KODE_ANTAR_SEKOLAH_DARI_DB: Record<string, (typeof KODE_ANTAR_SEKOLAH)[number]> = {
  DESTINATION_INVALID: "TRANSFER_DESTINATION_INVALID",
  REASON_REQUIRED: "TRANSFER_REASON_REQUIRED",
  TRANSFER_OPEN: "TRANSFER_OPEN",
  ENROLLMENT_NOT_ACTIVE: "TRANSFER_ENROLLMENT_NOT_ACTIVE",
  PERIOD_INVALID: "TRANSFER_PERIOD_INVALID",
  PROGRAMME_INVALID: "TRANSFER_PROGRAMME_INVALID",
  TRANSFER_NOT_OPEN: "TRANSFER_NOT_OPEN",
  TRANSFER_NOT_FOUND: "TRANSFER_NOT_OPEN",
  QUERY_TOO_SHORT: "TRANSFER_SEARCH_SHORT",
  TRANSFER_PERIOD_MISSING: "TRANSFER_PERIOD_MISSING",
};

/** BOB-44: enrolling a person for professional learning, refused by PR090 with the code in DETAIL. */
export const KODE_PESERTA = [
  "PD_NOT_ALLOWED", "PD_PLACE_INVALID", "PD_PLACE_NOT_FOR_EDUCATORS", "PD_PERSON_NOT_STAFF", "PD_ALREADY_ENROLLED",
  "PD_OTHER_PURPOSE",
] as const;

/**
 * #148 (D-094, D-100): maintenance. The controls refuse with PR110 and the code in DETAIL; PostgREST's pre-request
 * answers PT503 for a person a window stops (MAINTENANCE_ACTIVE), so an action they press says so.
 */
export const KODE_PEMELIHARAAN = [
  "MAINTENANCE_NOT_ALLOWED", "MAINTENANCE_INPUT_INVALID", "MAINTENANCE_NOT_OPEN", "MAINTENANCE_CONFIRMATION",
  "MAINTENANCE_NO_NEW_START", "NOTICE_INPUT_INVALID", "NOTICE_NOT_OPEN", "MAINTENANCE_ACTIVE",
] as const;

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
  "ROLE_REASON_REQUIRED",   // D-097(a): a revocation states why
  "TEMPLATE_INPUT_INCOMPLETE",
  "SCHOOL_REQUIRED",
  "MOVE_INPUT_INCOMPLETE",
  "PASS_MARK_INPUT_INCOMPLETE",
  "PD_INPUT_INCOMPLETE",
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
  // W2.15 (Batch 4): the receiving school accepted a transfer into its own school year
  "TRANSFER_ACCEPTED",
  "STEP_TAKEN", "CHECK_RUN", "FINDING_ACKNOWLEDGED", "REVISION_CREATED", "ASSIGNMENT_MOVED",
  // W1.5 (Batch 3; UX-01): one kind of finding acknowledged as a group; n: how many
  "FINDINGS_ACKNOWLEDGED",
  "DISTRIBUTION_GRANTED", "DISTRIBUTION_WITHDRAWN", "REVIEW_RECORDED", "CERTIFICATE_SAVED", "QUICK_CHECK_LAUNCHED",
  // BOB-19: a confirmed upload opens its new course, which says so
  "DRAFT_CREATED",
  // D-085 M9: a learner moved to another Kelas
  "LEARNER_MOVED",
  // D-088(b): a lesson's pass mark set, or already that value
  "PASS_MARK_SET", "PASS_MARK_UNCHANGED",
  // BOB-44: a person enrolled for professional learning
  "PD_ENROLLED",
  // #148: maintenance scheduled, started now, ended (or cancelled), stopped at once; a notice published or withdrawn
  "MAINTENANCE_SCHEDULED", "MAINTENANCE_STARTED", "MAINTENANCE_ENDED", "MAINTENANCE_STOPPED", "NOTICE_PUBLISHED", "NOTICE_WITHDRAWN",
  // W1.6: a package sent back to its author, with the reviewer's reason
  "SENT_BACK",
] as const;

/**
 * L3 (D-132 §2.11, (m)): A CONTEXT-BOUND HUMAN ACTION WHOSE TARGET IS OUTSIDE THE ACTIVE WORKING CONTEXT. Not a
 * database refusal: the action never reached the database. It travels like one, so the form's values are kept for
 * the person (CR-84 (3)) when they return through the chooser. Its own sentence is the semantic key
 * context.other_school, awaiting Dr Gladys's words (src/lib/istilah-menunggu.ts): until then the banner says only the
 * surface's own «not saved», which is true, and nothing invented.
 */
export const KODE_KONTEKS = ["CONTEXT_OTHER_PLACE"] as const;
export type KodeKonteks = (typeof KODE_KONTEKS)[number];

export type KodePindah = (typeof KODE_PINDAH)[number];
export type KodePindahKelas = (typeof KODE_PINDAH_KELAS)[number];
export type KodeKetuntasan = (typeof KODE_KETUNTASAN)[number];
export type KodePeserta = (typeof KODE_PESERTA)[number];
export type KodePemeliharaan = (typeof KODE_PEMELIHARAAN)[number];
export type KodeKembali = (typeof KODE_KEMBALI)[number];
/** What `kodeGalat` answers: any action's codes, a release move's two (DAISY-31) and a class move's four (M9). */
export type KodeGalat = (typeof KODE_GALAT)[number] | KodePindah | KodePindahKelas | KodeKetuntasan | KodePeserta | KodePemeliharaan
  | KodeKembali;
export type KodeKonten = (typeof KODE_KONTEN)[number];
export type KodeIsian = (typeof KODE_ISIAN)[number];
export type KodeSukses = (typeof KODE_SUKSES)[number];

/** Every code a banner may carry: these and the domain contracts' own. */
export type KodeHasil = KodeGalat | KodeKonten | KodeIsian | KodeSukses | KodeTerbitan | KodePaket | KodeKonteks
  | (typeof KODE_ANTAR_SEKOLAH)[number];

/** A problem of a package upload, at its sheet and row. */
export type MasalahHasil = { code: string; sheet?: string; row?: number };

/** What an action carries back to the page it came from. */
export type HasilAksi =
  | { ok: true; kode?: KodeSukses; n?: number }
  | { ok: false; kode: KodeHasil; ref?: string; masalah?: MasalahHasil[] };

type GalatDb = { code?: string | null; details?: string | null; message?: string | null } | null | undefined;

/**
 * CR-84 (D-127, D-128 L2): THE STUDIO REFUSALS WITH A KNOWN CAUSE, NAMED. The database functions behind Studio's forms
 * raise these in their own words, with no code (P0001), so each reached the screen as «Ada kendala» and a reference.
 * Each is read here to the existing code whose existing sentence is true of it; no new words (D-128(g): Daisy's words
 * for any refusal that needs its own sentence come later). Anchored at the start of the database's message, so a
 * message that only quotes one cannot be taken for it. BOB32-K02 reads every refusal of every function behind a
 * Studio form and fails on any that is still the catch-all, except the platform's own state («no scoring policy»).
 */
const POLA_STUDIO: ReadonlyArray<readonly [RegExp, KodeGalat]> = [
  // who is asking: no person in the session, an author acknowledging their own finding, a release whose assignment does
  // not allow a correction, an ad-hoc paper (launched, never configured), another school's chapter (INV-13)
  [/\brequires an authenticated actor\b/, "ACTION_NOT_ALLOWED"],
  [/^the author of the content does not acknowledge their own finding/, "ACTION_NOT_ALLOWED"],
  [/^this assignment does not permit a release correction/, "ACTION_NOT_ALLOWED"],
  [/^an ad-hoc instrument is launched, not configured/, "ACTION_NOT_ALLOWED"],
  [/^that (?:course|module) belongs to another institution/, "ACTION_NOT_ALLOWED"],
  [/^(?:authorizing|withdrawing) a distribution requires SYSTEM_ADMIN or CAN_PUBLISH/, "ACTION_NOT_ALLOWED"],
  // already there
  [/^this release is already distributed to this institution/, "ACTION_ALREADY_EXISTS"],
  [/^an open revision of this course already exists/, "ACTION_ALREADY_EXISTS"],
  // nothing changed: the thing has already moved on
  [/^this distribution is already /, "ACTION_UNCHANGED"],
  [/^a release move applies to an ACTIVE assignment/, "ACTION_UNCHANGED"],
  [/^a Question Health record does not move from /, "ACTION_UNCHANGED"],
  // W1.13 (Batch 1): langkah_konten, the one-transaction content step: a shortfall changed nothing (F-05)
  [/^a content step changed fewer rows than it meant to, so nothing was changed/, "ACTION_UNCHANGED"],
  [/^langkah_konten: an unknown status/, "ACTION_INPUT_INVALID"],
  // no longer available to choose
  [/^distribution is downstream of publication/, "ACTION_NOT_FOUND"],
  [/^the target release belongs to another institution/, "ACTION_NOT_FOUND"],
  [/^this question has no health record yet/, "ACTION_NOT_FOUND"],
  // a field is empty or not right: a reason left out, a choice outside what the form offers, a value outside the bounds
  [/^a withdrawal records why/, "ACTION_INPUT_INVALID"],
  [/^a distribution is granted to a school, not to another/, "ACTION_INPUT_INVALID"],
  [/^the target release is not another release of this course/, "ACTION_INPUT_INVALID"],
  [/^a reviewer records UNDER_REVIEW, ACKNOWLEDGED_OK or ACTION_TAKEN/, "ACTION_INPUT_INVALID"],
  [/^a new definition names its institution and its mode/, "ACTION_INPUT_INVALID"],
  [/^a definition is scoped to exactly one of a course or a module/, "ACTION_INPUT_INVALID"],
  [/^a definition carries a title a teacher can recognise/, "ACTION_INPUT_INVALID"],
  [/^no platform bounds are published for mode /, "ACTION_INPUT_INVALID"],
  [/^mode \S+ (?:carries between|permits at most|does not pause|does not tolerate an offline client)/, "ACTION_INPUT_INVALID"],
  [/^the (?:hesitation window|late-sync grace) for mode /, "ACTION_INPUT_INVALID"],
  [/^the difficulty mix totals /, "ACTION_INPUT_INVALID"],
  [/^the safety-critical minimum /, "ACTION_INPUT_INVALID"],
];

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
  // CR-84: a professional-learning observation is recorded, never referred (D-069(c)); the form offers no referral for one
  if (state === "PR090" && e?.details === "PD_SIGNAL_NOT_REFERRED") return "ACTION_NOT_ALLOWED";
  // BOB-44: professional learning's refusals by their DETAIL, and no other PR090
  if (state === "PR090") {
    return (KODE_PESERTA as readonly string[]).includes(e?.details ?? "") ? e!.details as KodePeserta : "ACTION_FAILED";
  }
  // #148: a maintenance control's refusals by their DETAIL, and the window that stops this person (PT503)
  if (state === "PR110") {
    return (KODE_PEMELIHARAAN as readonly string[]).includes(e?.details ?? "") ? e!.details as KodePemeliharaan : "ACTION_FAILED";
  }
  if (state === "PT503") return "MAINTENANCE_ACTIVE";
  // W1.6: a send-back's four refusals by their DETAIL (42501 or PR040), before any message pattern
  if ((state === "42501" || state === "PR040") && (KODE_KEMBALI as readonly string[]).includes(e?.details ?? "")) {
    return e!.details as KodeKembali;
  }
  const disebut = POLA_STUDIO.find(([pola]) => pola.test(pesan.replace(/^ERROR:\s*/i, "")));
  if (disebut) return disebut[1];
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
  // FD-9 (D-127 Q8): a rule for a chapter that has moved on starts again from the chapter's correction, an upload
  // (save_assessment_definition, 20261209100000); the sentence names that next action
  [/^a rule is set while its chapter is still being drafted/, "CONTENT_CREATED_NOT_INGESTED"],
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
  ...KODE_GALAT, ...KODE_PINDAH, ...KODE_PINDAH_KELAS, ...KODE_KETUNTASAN, ...KODE_PESERTA, ...KODE_PEMELIHARAAN, ...KODE_KONTEN,
  ...KODE_KEMBALI,
  ...KODE_ANTAR_SEKOLAH,
  ...KODE_ISIAN, ...KODE_SUKSES, ...KODE_KONTEKS,
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
/**
 * E-K4 (D-173(d)): A RESULT IS SAID WHERE ITS ACTION WAS. A section with more than one form (a list whose rows each
 * act, a confirmation panel, a separate «Hentikan sekarang») used to say every result once for the whole section, so a
 * row's revoke was answered under another form. Each such form now names itself in a hidden `asal` («cabut», «jendela»)
 * and posts the page of its list (`hal_*`); the action sends both back with the result, and the page draws the line
 * only at the form that matches. Validated here, so nothing typed into an address reaches the page as an origin.
 */
export const ASAL_HASIL = /^[a-z][a-z0-9-]{0,30}$/;
export function asalHasil(v: unknown): string | null {
  return typeof v === "string" && ASAL_HASIL.test(v) ? v : null;
}

export function queryHasil(bagian: string, h: HasilAksi, fd?: FormData): URLSearchParams {
  const q = new URLSearchParams({ bagian, hasil: h.ok ? "ok" : "gagal" });
  const asal = asalHasil(fd?.get("asal"));
  if (asal) q.set("asal", asal);
  // and the row it acted on, so a list draws the answer in that row
  const baris = fd?.get("baris");
  if (typeof baris === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(baris)) q.set("baris", baris);
  // the list's page comes back with its answer, so a row on page 2 is still on screen
  for (const [k, v] of fd ? [...fd.entries()] : []) {
    if (/^hal(_[a-z]+)?$/.test(k) && typeof v === "string" && /^[1-9]\d{0,4}$/.test(v)) q.set(k, v);
  }
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
  // L3: a code whose words are still Dr Gladys's says nothing of its own (src/lib/istilah-menunggu.ts)
  const menunggu = h.kode === "CONTEXT_OTHER_PLACE" ? istilah("context.other_school") : undefined;
  if (h.kode && menunggu !== null) bagian.push((menunggu ?? s(kunciKode(h.kode))) + (h.n !== null ? ` ${h.n}.` : ""));
  for (const m of h.masalah) {
    bagian.push(s(kunciMasalahPaket(m.code)) + (m.sheet ? ` (${m.sheet}${m.row ? ` ${m.row}` : ""})` : ""));
  }
  if (h.ref) bagian.push(`${s("galat.rujukan")}: ${h.ref}.`);
  return bagian.join(" ");
}

/** W2.15 (Batch 4): a transfer's refusal by its DETAIL (PR040), as a code of this contract, or undefined for any other. */
export function kodeAntarSekolah(e: GalatDb): (typeof KODE_ANTAR_SEKOLAH_DARI_DB)[string] | undefined {
  return e?.code === "PR040" && typeof e.details === "string" ? KODE_ANTAR_SEKOLAH_DARI_DB[e.details] : undefined;
}
