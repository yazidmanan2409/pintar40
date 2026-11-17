/**
 * C2w · «Catatan peninjau»: the screens' contract with migration 20270121110000 (catatan_tolak, PR210), and the pure
 * rules the two disclosures draw by (Daisy, C2W-CATATAN-KATA.md at 535561ed). No database, no React.
 *
 * A note is about what a wrong option reveals of how learners think. It is never evidence: no score, no metric, no
 * learner reads it (assert_reviewer_notes_are_not_evidence). The screens only show what the database returns and say a
 * refusal by its code.
 */
import type { HleEvent } from "./hle";

/** Every code catatan_tolak raises (PR210, code in DETAIL). */
export const KODE_CATATAN_DB = [
  "NOTE_NOT_ALLOWED", "NOTE_LIBRARY_CONTENT", "NOTE_NOT_SEALED", "NOTE_OPTION_INVALID", "NOTE_TEXT_INVALID",
  "NOTE_EXISTS", "NOTE_NOT_CURRENT", "NOTE_OWNER_MISMATCH", "NOTE_IMMUTABLE", "NOTE_NOT_A_SOURCE",
] as const;
export const KODE_CATATAN = [...KODE_CATATAN_DB, "NOTE_FAILED"] as const;
export type KodeCatatan = (typeof KODE_CATATAN)[number];

export function kodeCatatanDariGalat(e: { code?: string | null; details?: string | null } | null | undefined): KodeCatatan {
  if (e?.code === "PR210" && typeof e.details === "string" && (KODE_CATATAN_DB as readonly string[]).includes(e.details)) {
    return e.details as KodeCatatan;
  }
  return "NOTE_FAILED";
}

/**
 * The sentence a refusal is said with. The form's own cases have Daisy's words; the codes no form can reach (an option
 * the question lacks, the table's own guards) say the existing «Langkah ini bukan wewenang Anda.», as an unknown or
 * unreadable question does (Daisy §2, «On existence»); a failure nobody named says the existing «not saved» sentence.
 */
export function kunciKodeCatatan(kode: KodeCatatan): HleEvent {
  switch (kode) {
    case "NOTE_TEXT_INVALID": case "NOTE_NOT_SEALED": case "NOTE_NOT_ALLOWED": case "NOTE_LIBRARY_CONTENT":
    case "NOTE_NOT_CURRENT": case "NOTE_EXISTS":
      return `studio.catatan.galat.${kode.toLowerCase()}` as HleEvent;
    case "NOTE_FAILED":
      return "studio.soal.galat.draft_failed";
    default:
      return "galat.action_not_allowed";
  }
}

/** One note as catatan_peninjau_studio and catatan_peninjau_kelas return it (catatan_peninjau_baris). */
export type Catatan = {
  id: string; item: string; versi: number; opsi: string; isi: string; pada: string;
  /** a platform-library note: its writer is «Peninjau PINTAR», never named to a school */
  pustaka: boolean; nama: string | null;
  menggantikan: string | null; digantikan: boolean; digantikan_pada: string | null;
  /** I-5: written on an earlier version whose key differs from the key in force */
  kunci_saat_itu: string | null; kunci_kini: string | null; sebelum_koreksi: boolean;
  /** catatan_peninjau_kelas only: the question the class was shown */
  soal?: string;
};

export function bacaCatatan(data: unknown): Catatan[] {
  if (!Array.isArray(data)) return [];
  return data.filter((c): c is Catatan => typeof c === "object" && c !== null
    && typeof (c as Catatan).id === "string" && typeof (c as Catatan).opsi === "string" && typeof (c as Catatan).isi === "string");
}

/** One option's block: the notes that hold now (newest first) and the ones they replaced (newest first, oldest last). */
export type BlokCatatan = { label: string; kini: Catatan[]; lama: Catatan[] };

/**
 * Per option, in the question's order. A reader is shown only the options that have a note; a reviewer every option,
 * so each has its form (Daisy §1).
 */
export function blokCatatan(label: readonly string[], catatan: readonly Catatan[], semua: boolean): BlokCatatan[] {
  const baru = (a: Catatan, b: Catatan) => (a.pada < b.pada ? 1 : a.pada > b.pada ? -1 : a.id < b.id ? 1 : -1);
  return label.map((l) => ({
    label: l,
    kini: catatan.filter((c) => c.opsi === l && !c.digantikan).sort(baru),
    lama: catatan.filter((c) => c.opsi === l && c.digantikan).sort(baru),
  })).filter((b) => semua || b.kini.length > 0 || b.lama.length > 0);
}

/** The note a replacement names: the current note of this option on the version on screen, if any. */
export function catatanKiniDi(catatan: readonly Catatan[], item: string, label: string): Catatan | null {
  return catatan.filter((c) => c.item === item && c.opsi === label && !c.digantikan)
    .sort((a, b) => (a.pada < b.pada ? 1 : -1))[0] ?? null;
}

/** The form the address opens («?catatan=<item>:<label>»), read strictly. */
export function bacaSasaranCatatan(nilai: string | undefined): { item: string; label: string } | null {
  const m = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):([A-E])$/i.exec(nilai ?? "");
  return m ? { item: m[1].toLowerCase(), label: m[2].toUpperCase() } : null;
}

/** Daisy §3: the date only, in the school's zone, its parts held together by non-breaking spaces. */
export const tanggalUtuh = (s: string) => s.replace(/ /g, " ");
