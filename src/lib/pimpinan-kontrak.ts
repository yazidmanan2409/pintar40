import type { Envelope } from "@/components/bukti";

/**
 * THE MANAGEMENT SURFACE'S PURE CONTRACT — no database, no React, no server.
 *
 * Everything here is a mapping from a value the BACKEND produced onto something
 * a reader can be shown. Nothing here decides anything: not who may read, not
 * whether evidence is enough, not what a decision means. Those answers already
 * exist in the database and this module's whole job is to carry them without
 * changing them.
 *
 * IT IS A SEPARATE FILE SO IT CAN BE TESTED WITHOUT A DATABASE. `pimpinan.ts`
 * is `server-only` and every function in it is a read; a guard that wanted to
 * check the state machine or the readiness reading would have had to stand up a
 * Postgres to do it. These are the parts a static test can drive directly, and
 * UX1-PIMPINAN-KEPUTUSAN-01 and UX1-PIMPINAN-KESIAPAN-01 drive them.
 */

// ═══════════════════════════════════════════════════ 1. R5, read and not redone

/** The three states WP3 declared. Spelled here only to be mapped, never shown. */
export type Kesiapan = "NOT_YET_EVALUABLE" | "INSUFFICIENT_EVIDENCE" | "SUFFICIENT_EVIDENCE";

const KESIAPAN: readonly string[] = [
  "NOT_YET_EVALUABLE",
  "INSUFFICIENT_EVIDENCE",
  "SUFFICIENT_EVIDENCE",
];

/**
 * WHICH OF THE THREE THIS FIGURE IS — TAKEN FROM THE ENVELOPE AND NOWHERE ELSE.
 *
 * `metric_evaluate` computes this with `evidence_readiness(have, needed)`
 * against `metric_definitions.minimum_sample`, which is governed per
 * interpretation and differs by what is being interpreted — 1 for a participant
 * count, 5 for comprehension, 10 for an institution-wide outcome, 30 for an item
 * statistic. Re-deriving it here from `have` and `needed` would be this file
 * inventing a threshold policy beside the governed one, and the two would drift
 * the first time a catalogue version changed. So the comparison is not made here
 * and the numbers are not compared here.
 *
 * NULL ON A REFUSAL, AND THAT IS THE BACKEND'S DOING TOO. Readiness is a fact
 * about a population's evidence, and `metric_evaluate` deliberately omits it
 * when the reader may not see the population — "there is not enough evidence
 * about a class you cannot see" is still a fact about a class you cannot see. A
 * surface that defaulted the missing field to a state would be handing back the
 * fact the evaluator withheld.
 */
export function kesiapan(entry: Pick<Envelope, "readiness">): Kesiapan | null {
  const r = entry.readiness;
  return typeof r === "string" && KESIAPAN.includes(r) ? (r as Kesiapan) : null;
}

/**
 * The sentence for each state, as an HLE key.
 *
 * THE ENVELOPE'S OWN `statement_key` STILL WINS where one is carried — the
 * evaluator knows more about why this particular figure is absent than a state
 * map does. This exists for the SECTION heading and the summary line, which are
 * about the group of figures rather than about any one of them.
 *
 * NONE OF THE THREE IS A RESULT. "No qualifying evidence yet" is not a low
 * score, "not enough of it yet" is not a failure, and neither is rendered in a
 * tone that could be read as one: the readiness section carries the `info`
 * ground and never `attention` or `blocked`.
 */
export const KESIAPAN_KUNCI: Record<Kesiapan, string> = {
  NOT_YET_EVALUABLE: "pimpinan.kesiapan.belum_ada",
  INSUFFICIENT_EVIDENCE: "pimpinan.kesiapan.belum_cukup",
  SUFFICIENT_EVIDENCE: "pimpinan.kesiapan.cukup",
};

/**
 * Sorting the three so a summary reads in the same order every time: what can
 * be said, then what is short, then what has not started. An ORDER, and a fixed
 * one, so a reader learns the shape of the page rather than re-reading it.
 */
export const KESIAPAN_URUT: readonly Kesiapan[] = [
  "SUFFICIENT_EVIDENCE",
  "INSUFFICIENT_EVIDENCE",
  "NOT_YET_EVALUABLE",
] as const;

/**
 * How many figures sit in each state, for the one summary line the readiness
 * section carries. Envelopes with no readiness — refusals — are counted in none
 * of them and are not counted anywhere else either: a refusal must not become
 * an entry in a tally that tells the reader something was withheld.
 */
export function hitungKesiapan(entries: readonly Envelope[]): Record<Kesiapan, number> {
  const out: Record<Kesiapan, number> = {
    NOT_YET_EVALUABLE: 0,
    INSUFFICIENT_EVIDENCE: 0,
    SUFFICIENT_EVIDENCE: 0,
  };
  for (const e of entries) {
    const k = kesiapan(e);
    if (k) out[k] += 1;
  }
  return out;
}

// ═══════════════════════════════════════════ 2. a Management decision, as read

export type KeluargaKeputusan =
  | "INTEGRITY_REFERRAL"
  | "LEARNING_INTERVENTION"
  | "PROGRAMME_OPERATIONAL_FOLLOW_UP";

export type KeadaanKeputusan = "AWAITING_REVIEW" | "UNDER_REVIEW" | "DECIDED";

export type HasilKeputusan =
  | "NO_FURTHER_ACTION"
  | "LEARNER_SUPPORT_ARRANGED"
  | "ESCALATED_TO_INSTITUTION";

/**
 * A decision row as the surface reads it. `subjek` is present only when the
 * database returned the person — `persons_select` runs through
 * `person_visible_to_me`, so a subject this reader may not see simply does not
 * arrive, and the card renders without a name rather than with a placeholder
 * standing in for one.
 */
export type Keputusan = {
  id: string;
  keluarga: KeluargaKeputusan;
  keadaan: KeadaanKeputusan;
  hasil: HasilKeputusan | null;
  simpul: string;
  simpulNama: string | null;
  institusi: string;
  subjek: string | null;
  sumberTabel: string;
  diangkatPada: string;
  catatan: string | null;
  diputuskanPada: string | null;
};

/** No enum on a screen. Every one of these is turned into a telling first. */
export const KELUARGA_KUNCI: Record<KeluargaKeputusan, string> = {
  INTEGRITY_REFERRAL: "pimpinan.keluarga.integritas",
  LEARNING_INTERVENTION: "pimpinan.keluarga.pembelajaran",
  PROGRAMME_OPERATIONAL_FOLLOW_UP: "pimpinan.keluarga.program",
};

export const KEADAAN_KUNCI: Record<KeadaanKeputusan, string> = {
  AWAITING_REVIEW: "pimpinan.keadaan.menunggu",
  UNDER_REVIEW: "pimpinan.keadaan.ditangani",
  DECIDED: "pimpinan.keadaan.selesai",
};

export const HASIL_KUNCI: Record<HasilKeputusan, string> = {
  NO_FURTHER_ACTION: "pimpinan.hasil.tidak_ada",
  LEARNER_SUPPORT_ARRANGED: "pimpinan.hasil.pendampingan",
  ESCALATED_TO_INSTITUTION: "pimpinan.hasil.diteruskan",
};

/** Every outcome the database will accept, in the order they are offered. */
export const HASIL_SEMUA: readonly HasilKeputusan[] = [
  "LEARNER_SUPPORT_ARRANGED",
  "ESCALATED_TO_INSTITUTION",
  "NO_FURTHER_ACTION",
] as const;

/**
 * WHAT THIS DECISION IS WAITING ON — the four-part chain, per family.
 *
 * The approved Management design fixes the chain and its order: what the
 * evidence supports, what is not yet known, a possible next step, your decision.
 * The first three are SENTENCES ABOUT THE EVIDENCE and they differ by family,
 * because what an integrity referral supports is not what a programme follow-up
 * supports. They are copy, declared here so the card cannot compose one.
 *
 * "What is not yet known" is not decoration on this surface. An integrity
 * referral's own migration says the note "records one observed thing, and
 * nothing more"; a card that showed only what was referred, with no line saying
 * what remains unknown, would be inviting the reader to treat a referral as a
 * finding. PINTAR proposes; a human decides; and the human is told what they are
 * deciding without.
 */
export const RANTAI: Record<KeluargaKeputusan, { didukung: string; belum: string; langkah: string }> = {
  INTEGRITY_REFERRAL: {
    didukung: "pimpinan.rantai.integritas.didukung",
    belum: "pimpinan.rantai.integritas.belum",
    langkah: "pimpinan.rantai.integritas.langkah",
  },
  LEARNING_INTERVENTION: {
    didukung: "pimpinan.rantai.pembelajaran.didukung",
    belum: "pimpinan.rantai.pembelajaran.belum",
    langkah: "pimpinan.rantai.pembelajaran.langkah",
  },
  PROGRAMME_OPERATIONAL_FOLLOW_UP: {
    didukung: "pimpinan.rantai.program.didukung",
    belum: "pimpinan.rantai.program.belum",
    langkah: "pimpinan.rantai.program.langkah",
  },
};

/**
 * THE STATE MACHINE, MIRRORED RATHER THAN INVENTED.
 *
 * `advance_management_decision` accepts AWAITING_REVIEW → UNDER_REVIEW,
 * AWAITING_REVIEW → DECIDED and UNDER_REVIEW → DECIDED, and refuses every other
 * move including all of them out of DECIDED. This returns exactly that set, so
 * the surface offers what the database will accept and nothing more — a control
 * that produced a refusal would be the page promising something the product does
 * not do.
 *
 * It is a mirror and the test treats it as one: UX1-PIMPINAN-KEPUTUSAN-01 reads
 * the transitions out of the migration and fails if this disagrees, so the two
 * cannot drift.
 */
export function langkahBerikut(keadaan: KeadaanKeputusan): readonly KeadaanKeputusan[] {
  switch (keadaan) {
    case "AWAITING_REVIEW":
      return ["UNDER_REVIEW", "DECIDED"];
    case "UNDER_REVIEW":
      return ["DECIDED"];
    default:
      return [];
  }
}

/** Is a human still owed something here? The home's headline counts these. */
export function menunggu(k: Pick<Keputusan, "keadaan">): boolean {
  return k.keadaan !== "DECIDED";
}

/**
 * THE GROUND A CARD SITS ON, FROM ITS STATE AND NEVER FROM ITS FAMILY.
 *
 * The approved design tinted the integrity card `blocked` and the feedback card
 * `attention` — a tone per SUBJECT. That is carried forward as a tone per STATE
 * instead, deliberately: `blocked` on an integrity referral says the referral
 * itself is a bad thing, and the referral is a request for a human to look,
 * raised by an educator who reviewed something and chose to pass it on. Tinting
 * it red would be the page reaching a conclusion the note explicitly does not
 * carry, about a learner who is named on the card.
 *
 * So the ground says how far along the DECISION is, which is a fact about the
 * queue and about nobody. Colour is never the only carrier: every card also
 * names its state in words.
 */
export function nada(keadaan: KeadaanKeputusan): "attention" | "info" | "ok" {
  switch (keadaan) {
    case "AWAITING_REVIEW":
      return "attention";
    case "UNDER_REVIEW":
      return "info";
    default:
      return "ok";
  }
}

/**
 * READING ORDER: WHAT IS HOLDING SOMEONE ELSE UP, FIRST.
 *
 * Waiting before taken-up before decided, and inside each, the oldest first.
 * The approved design's line says it out loud on the page — "it is an order, not
 * a ranking" — and it is true of this function: there is no score, no weight, no
 * priority and no urgency in it. Two decisions raised in the same second sort by
 * id so the order is stable across renders rather than left to the database.
 */
const BERAT: Record<KeadaanKeputusan, number> = {
  AWAITING_REVIEW: 0,
  UNDER_REVIEW: 1,
  DECIDED: 2,
};

export function urutan(rows: readonly Keputusan[]): Keputusan[] {
  return [...rows].sort((a, b) => {
    const w = BERAT[a.keadaan] - BERAT[b.keadaan];
    if (w !== 0) return w;
    const t = Date.parse(a.diangkatPada) - Date.parse(b.diangkatPada);
    if (Number.isFinite(t) && t !== 0) return t;
    return a.id.localeCompare(b.id);
  });
}
