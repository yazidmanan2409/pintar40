/**
 * ANONYMOUS STUDENT → EDUCATOR FEEDBACK — the pure half.
 *
 * ═══ WHAT THIS MODULE IS FOR ═══
 *
 * WP7B's privacy claim is that no ordinary authorized path can produce a
 * respondent → answer pair. The database keeps that claim by never putting the
 * two halves in the same row. THIS FILE'S JOB IS NOT TO RE-DECIDE ANY OF THAT —
 * it decides nothing about who may read what — but to make the shapes the
 * backend hands out impossible to render wrongly:
 *
 *   · a result is read into a DISCRIMINATED UNION, so "published" is a case a
 *     surface has to be in rather than a field it can reach past;
 *   · a state that cannot be recognised becomes the NON-published case, so a
 *     shape nobody anticipated degrades into silence rather than into numbers;
 *   · the three states carry three DECLARED copy keys, so no key is ever
 *     composed from a database value;
 *   · the submission outcomes are a declared map over WP7B's own sentences, so
 *     no surface renders the database's wording and no unrecognised failure is
 *     reported as either success or failure.
 *
 * ═══ THERE IS NO THRESHOLD IN THIS FILE, AND THERE IS NO ARITHMETIC ═══
 *
 * ADR-0022 §Decision 2: the anonymity threshold is data, bound per cycle, and
 * no authorization or result path contains the number. The same rule applies
 * here. Nothing below knows what five is, nothing subtracts a count from it,
 * and nothing can: the WITHHELD case carries a statement key and has no numeric
 * field at all, so a surface that wanted to print "3 of 5" would have nothing
 * to print it from.
 *
 * This is also why the withheld state does NOT reuse `KartuKetiadaan`. That
 * component exists for a STATISTICAL readiness floor and appends `have/needed`
 * on purpose, because a reader who knows a measure needs five of five and has
 * three can act on that. An ANONYMITY floor is the opposite: the missing count
 * is exactly the thing that must not be derivable. Same-looking absence,
 * opposite obligation.
 */

// ─────────────────────────────────────────────────────── the governed sheet
/** One closed option a learner may choose. Keys only; the words are the HLE's. */
export type Pilihan = { option_key: string; label_key: string; ordinal: number };

/** One governed question, with its closed options. FQ-1 has five, with four each. */
export type Pertanyaan = {
  question_key: string;
  label_key: string;
  ordinal: number;
  options: Pilihan[];
};

export type Kuesioner = {
  cycle_id: string;
  class_name: string | null;
  subject_name: string | null;
  already_answered: boolean;
  questions: Pertanyaan[];
};

/** What the learner has chosen so far: question_key → option_key. */
export type Jawaban = Record<string, string>;

/**
 * THE WHOLE SHEET OR NONE OF IT, agreeing with the endpoint rather than
 * enforcing it. `submit_feedback` refuses a partial sheet by name, because a
 * half-answered questionnaire makes the published marginals disagree about how
 * many people answered — and "how many answered THIS question" is a
 * per-question count nobody asked for. The surface asks the same question
 * first so a learner is told before they press rather than after.
 */
export function lengkap(kuesioner: Kuesioner, jawaban: Jawaban): boolean {
  if (kuesioner.questions.length === 0) return false;
  return kuesioner.questions.every((q) => {
    const dipilih = jawaban[q.question_key];
    return typeof dipilih === "string" && q.options.some((o) => o.option_key === dipilih);
  });
}

/** How many of the governed questions still have no answer. Never rendered as
 *  a response figure — it is about this one learner's own unfinished sheet. */
export function belumTerjawab(kuesioner: Kuesioner, jawaban: Jawaban): number {
  return kuesioner.questions.filter((q) => !jawaban[q.question_key]).length;
}

// ──────────────────────────────────────────────────────────── the result
/**
 * WP7B's three cycle states. The enum's own values, never rendered: each one
 * reaches a screen through the declared map below and through nothing else.
 */
export type Keadaan = "OPEN" | "PUBLISHED" | "WITHHELD";

const KEADAAN_KUNCI: Record<Keadaan, string> = {
  OPEN: "umpanbalik.keadaan.terbuka",
  PUBLISHED: "umpanbalik.keadaan.terbit",
  WITHHELD: "umpanbalik.keadaan.ditahan",
};

/**
 * The telling for a cycle's state, or null for a value this release does not
 * know. Null renders NOTHING — a state nobody anticipated must not arrive on a
 * screen as its own identifier, which is the leak F05-S03 exists to prevent.
 */
export function keadaanKunci(state: string | null | undefined): string | null {
  return (state && KEADAAN_KUNCI[state as Keadaan]) ?? null;
}

export function keadaanDikenal(state: string | null | undefined): state is Keadaan {
  return state === "OPEN" || state === "PUBLISHED" || state === "WITHHELD";
}

/** One option's marginal, from the immutable published snapshot. */
export type MarginalPilihan = {
  option_key: string;
  label_key: string;
  ordinal: number;
  responses: number;
};

/** One question's marginals. No joint distribution exists and none is derived. */
export type MarginalPertanyaan = {
  question_key: string;
  label_key: string;
  ordinal: number;
  options: MarginalPilihan[];
};

/**
 * WHAT A READER MAY HAVE, AS THREE CASES RATHER THAN ONE OBJECT WITH HOLES.
 *
 * `terbit` is the only case carrying a number, so a component reading
 * `hasil.total` must first have established it is in that case. A shape with an
 * optional `total_responses` would have let a surface print it in every state
 * and be wrong only sometimes — which is how this kind of leak actually
 * happens.
 */
export type Hasil =
  | { jenis: "terkumpul"; kunciPernyataan: string }
  | { jenis: "ditahan"; kunciPernyataan: string }
  | { jenis: "terbit"; total: number; entri: MarginalPertanyaan[] };

/** The canonical statement a reader receives instead of any figure. WP7B binds
 *  it per cycle through the threshold version; this is the fallback for a
 *  payload that somehow carries none, so a withheld cycle is never wordless. */
export const PERNYATAAN_DITAHAN = "umpanbalik.hasil.belum_cukup_tanggapan";
const PERNYATAAN_TERKUMPUL = "umpanbalik.hasil.belum_ditutup";

function angka(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0;
}

/**
 * Reads `feedback_result`'s payload. FAILS TOWARDS SILENCE, deliberately:
 * anything that is not an unambiguous PUBLISHED snapshot becomes a statement
 * and no numbers. A malformed payload, a null, a state this release has never
 * heard of and a published row with no entries all land in the same place —
 * the reader is told the result is not being shown, which is true, rather than
 * being shown a partial aggregate that nobody governed.
 */
export function bacaHasil(payload: unknown): Hasil {
  const p = (payload ?? {}) as Record<string, unknown>;
  const state = typeof p.state === "string" ? p.state : null;

  if (state === "PUBLISHED") {
    const mentah = Array.isArray(p.entries) ? (p.entries as unknown[]) : [];
    const entri: MarginalPertanyaan[] = mentah.flatMap((e) => {
      const q = (e ?? {}) as Record<string, unknown>;
      if (typeof q.question_key !== "string" || typeof q.label_key !== "string") return [];
      const opsi = Array.isArray(q.options) ? (q.options as unknown[]) : [];
      return [{
        question_key: q.question_key,
        label_key: q.label_key,
        ordinal: angka(q.ordinal),
        options: opsi.flatMap((o) => {
          const x = (o ?? {}) as Record<string, unknown>;
          if (typeof x.option_key !== "string" || typeof x.label_key !== "string") return [];
          return [{
            option_key: x.option_key,
            label_key: x.label_key,
            ordinal: angka(x.ordinal),
            responses: angka(x.responses),
          }];
        }),
      }];
    });
    // A snapshot that carried no marginals would be an aggregate with nothing
    // in it; that is not a published result and is not rendered as one.
    if (entri.length > 0) {
      return { jenis: "terbit", total: angka(p.total_responses), entri };
    }
  }

  if (state === "OPEN") {
    return { jenis: "terkumpul", kunciPernyataan: kunciAman(p.statement_key, PERNYATAAN_TERKUMPUL) };
  }
  return { jenis: "ditahan", kunciPernyataan: kunciAman(p.statement_key, PERNYATAAN_DITAHAN) };
}

/**
 * The statement key the database named, but only if it is one this release
 * declares. WP7B stores the key in a table a SYSTEM_ADMIN may republish, so an
 * unrecognised value is possible; rendering it raw would put a developer
 * identifier on a learner-facing screen, and falling back keeps the sentence.
 */
const PERNYATAAN_DIKENAL = new Set([PERNYATAAN_DITAHAN, PERNYATAAN_TERKUMPUL]);
function kunciAman(v: unknown, jatuh: string): string {
  return typeof v === "string" && PERNYATAAN_DIKENAL.has(v) ? v : jatuh;
}

/**
 * The share of one option's marginal, for the bar beside its count.
 *
 * ONLY EVER CALLED IN THE PUBLISHED CASE. There is no distribution in the other
 * two, so there is nothing here for them to be a share of — which is why the
 * suppression guard can assert that the open and withheld surfaces carry no
 * response-derived number at all rather than having to check each one.
 *
 * The bar is never the only channel: the count is rendered as text beside it.
 */
export function bagian(responses: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((responses / total) * 100)));
}

// ───────────────────────────────────────────────────── submitting, and after
/**
 * WHAT HAPPENED TO A SUBMISSION, in the words the product uses rather than the
 * database's.
 *
 *   tercatat     it committed on this press
 *   sudah        it had already committed — a retry after a lost acknowledgement,
 *                a double press, a second tab. WP7B refuses the second write by
 *                row lock, so this is the endpoint confirming the answers are
 *                safe rather than reporting a failure
 *   tutup        the cycle closed before the press landed
 *   bukan_milik  there is no feedback of theirs here any more
 *   belum_lengkap the endpoint refused a partial sheet
 *   belum_terkirim it did NOT commit, established by re-reading the learner's
 *                own durable state rather than guessed from a thrown error
 *   tak_pasti    NOTHING IS KNOWN, and the re-read could not settle it either
 *
 * THE LAST TWO ARE DIFFERENT ON PURPOSE. §7 forbids telling a learner to send
 * again blindly after an uncertain network result — and the cure for blindness
 * is to look. `submit_feedback` commits the eligibility flip and the answers in
 * ONE transaction, so `my_feedback_cycles` afterwards is an authoritative
 * answer to "did it land": answered means it did, whatever the browser saw.
 * Only when that read itself cannot be made does the learner get `tak_pasti`,
 * and then they are pointed at the page rather than at the button.
 */
export type SebabKirim =
  | "tercatat" | "sudah" | "tutup" | "bukan_milik" | "belum_lengkap"
  | "belum_terkirim" | "tak_pasti";

/** True when the learner's answers are recorded, however that was established. */
export function sudahTercatat(sebab: SebabKirim): boolean {
  return sebab === "tercatat" || sebab === "sudah";
}

/**
 * WP7B's own sentences, mapped to outcomes. DECLARED rather than matched by
 * shape: the migration raises these exact phrases, the guard compares this map
 * against the migration in both directions, and a phrase that stops being
 * raised or starts being raised shows up as a failing test rather than as a
 * learner reading a developer's sentence.
 *
 * `a feedback sheet is answered whole: 3 of 5 question(s) answered` is the one
 * backend sentence carrying figures. They are about this learner's OWN
 * unfinished sheet rather than about anybody's responses — but it is still the
 * database's wording, so it is mapped like the rest and never rendered.
 */
export const SEBAB: ReadonlyArray<{ frasa: string; sebab: SebabKirim }> = [
  { frasa: "you have already answered this feedback cycle", sebab: "sudah" },
  { frasa: "this feedback cycle has closed", sebab: "tutup" },
  // The response trigger's own wording. `submit_feedback` checks the state
  // first, so this is only reachable when a round closes between that check and
  // the insert -- a real race, with the same meaning for the learner.
  { frasa: "this feedback cycle is closed and accepts no further answers", sebab: "tutup" },
  { frasa: "there is no feedback of yours to give here", sebab: "bukan_milik" },
  { frasa: "answering a feedback cycle requires a signed-in learner", sebab: "bukan_milik" },
  { frasa: "a feedback sheet is answered whole", sebab: "belum_lengkap" },
  { frasa: "an answer sheet is one option per question", sebab: "belum_lengkap" },
  { frasa: "this feedback cycle asks no such question", sebab: "belum_lengkap" },
  { frasa: "that is not one of the offered answers", sebab: "belum_lengkap" },
];

/**
 * AN UNRECOGNISED FAILURE IS `tak_pasti`, NEVER A FAILURE.
 *
 * §7: a learner must not be told to submit again blindly after an uncertain
 * result. A dropped connection, a proxy timeout and a slept laptop all reach
 * this function as something that is not one of WP7B's sentences, and the
 * answers may well have committed — so the honest report is that nothing is
 * known, and the caller re-reads the learner's own durable state before saying
 * anything to them.
 */
export function sebabKirim(pesan: string | null | undefined): SebabKirim {
  if (!pesan) return "tak_pasti";
  const m = pesan.toLowerCase();
  for (const { frasa, sebab } of SEBAB) if (m.includes(frasa)) return sebab;
  return "tak_pasti";
}

/** The sentence shown for each outcome. Declared, so none is ever composed. */
export const KUNCI_KIRIM: Record<SebabKirim, string> = {
  tercatat: "umpanbalik.kirim.tercatat",
  sudah: "umpanbalik.kirim.sudah",
  tutup: "umpanbalik.kirim.tutup",
  bukan_milik: "umpanbalik.kirim.bukan_milik",
  belum_lengkap: "umpanbalik.kirim.belum_lengkap",
  belum_terkirim: "umpanbalik.kirim.belum_terkirim",
  tak_pasti: "umpanbalik.kirim.tak_pasti",
};

// ═══════════════════════════════════════════ closing a round (WP7D, Management)
/**
 * WHAT HAPPENED TO A CLOSE REQUEST.
 *
 * ═══ THE FRONTEND DOES NOT LEARN WHAT THE ROUND BECAME, AND THAT IS THE POINT ═══
 *
 * `close_feedback_cycle` returns the new state, and the surface deliberately
 * throws that away. Whether a round became PUBLISHED or WITHHELD is decided by
 * counting consumed opportunities against the threshold version the cycle bound
 * — inside the endpoint, in one transaction, with the number never leaving it —
 * and a client that read the returned state would be a client that had learned
 * something about how many people answered.
 *
 * So the outcomes below are about the REQUEST, never about the result. What the
 * round became is discovered the same way it is discovered at any other moment:
 * by re-reading `feedback_result`, which is the one path from a cycle to a
 * number and the one place that decides whether this reader may have it.
 *
 *   tertutup        the round closed on this press
 *   sudah_tertutup  it was already closed — an earlier press whose answer was
 *                   lost, a second tab, or somebody else having closed it
 *   bukan_wewenang  not Management over that class, or no such round. WP7B
 *                   refuses both in one sentence, so this surface cannot tell
 *                   them apart either
 *   subjek          the subject of a round does not close their own
 *   belum_tertutup  it did NOT close, established by re-reading the round
 *                   rather than guessed from a thrown error
 *   tak_pasti       nothing is known, and the re-read could not settle it
 */
export type SebabTutup =
  | "tertutup" | "sudah_tertutup" | "bukan_wewenang" | "subjek"
  | "belum_tertutup" | "tak_pasti";

/** True when collection has ended, however that was established. */
export function sudahDitutup(sebab: SebabTutup): boolean {
  return sebab === "tertutup" || sebab === "sudah_tertutup";
}

/**
 * WP7B's own refusal sentences, mapped. Declared rather than matched by shape,
 * and compared against the migration in both directions by UX1-UB-TUTUP-01, so
 * a sentence the endpoint stops raising or starts raising is a failing test
 * rather than a Management user reading a developer's words.
 *
 * `the anonymity threshold this cycle bound (…) is gone` is deliberately NOT
 * mapped: it is a platform fault rather than something its reader did, and it
 * falls through to the re-read, which reports what is actually true — the round
 * is still open. A sentence invented for it here would be guessing at a cause.
 */
export const SEBAB_TUTUP: ReadonlyArray<{ frasa: string; sebab: SebabTutup }> = [
  { frasa: "closing a feedback cycle is for a HEAD_OF_DEPARTMENT or DEAN standing over that class", sebab: "bukan_wewenang" },
  { frasa: "the subject of a feedback cycle does not close their own cycle", sebab: "subjek" },
  { frasa: "this feedback cycle is already", sebab: "sudah_tertutup" },
];

/** An unrecognised failure is never reported as a failure: see `SebabKirim`. */
export function sebabTutup(pesan: string | null | undefined): SebabTutup {
  if (!pesan) return "tak_pasti";
  const m = pesan.toLowerCase();
  for (const { frasa, sebab } of SEBAB_TUTUP) if (m.includes(frasa.toLowerCase())) return sebab;
  return "tak_pasti";
}

/** The sentence shown for each outcome. Declared, so none is ever composed. */
export const KUNCI_TUTUP: Record<SebabTutup, string> = {
  tertutup: "umpanbalik.tutup.tertutup",
  sudah_tertutup: "umpanbalik.tutup.sudah",
  bukan_wewenang: "umpanbalik.tutup.bukan_wewenang",
  subjek: "umpanbalik.tutup.subjek",
  belum_tertutup: "umpanbalik.tutup.belum",
  tak_pasti: "umpanbalik.tutup.tak_pasti",
};

/**
 * MAY THIS ROUND BE CLOSED AT ALL? A presentation question with one input: the
 * state WP7B is already showing this reader. It offers nothing in a terminal
 * state — there is no reopen, no reset and no republish to offer — and it
 * decides nothing, because `close_feedback_cycle` asks every one of its own
 * questions again and would refuse a request this returned true for.
 */
export function bolehDitutup(keadaan: string | null | undefined): boolean {
  return keadaan === "OPEN";
}
