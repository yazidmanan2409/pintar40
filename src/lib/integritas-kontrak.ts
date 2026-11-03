/**
 * W2.7 (Batch 5; CR-75, CR-76, CR-77): one decided integrity observation as integrity_reviews_recorded answers it, and
 * the named steps of a referred case (Daisy, components/Progress «named steps»; 11-validation §3 GQ2).
 */
export type Tinjauan = {
  signal_id: string; session_id: string; institution_id: string; category: string; observed_at: string;
  decision: "NO_CONCERN" | "DISCUSSED_WITH_LEARNER" | "REFERRED_TO_INSTITUTION"; note: string | null;
  reviewed_at: string; reviewer_name: string | null;
  case_id: string | null; case_visible: boolean;
  case_state: "AWAITING_REVIEW" | "UNDER_REVIEW" | "DECIDED" | null;
  case_outcome: "NO_FURTHER_ACTION" | "LEARNER_SUPPORT_ARRANGED" | "ESCALATED_TO_INSTITUTION" | null;
  case_decided_at: string | null; case_note: string | null; case_raised_by_me: boolean; case_other_decider: boolean | null;
  lagi: boolean;
};

/** The case's steps, in order. */
export const LANGKAH_RUJUKAN = ["diteruskan", "ditinjau", "diputuskan"] as const;

/**
 * Which step the case is at, and the sentence that says what happens next:
 *  - waiting: for the referrer, another leader decides (pimpinan.menunggu_pemutus_lain), or nobody yet can
 *    (pimpinan.belum_ada_pemutus_lain, CR-76); for a leader who sees it, it waits in Pimpinan's queue;
 *  - under review: a leader is handling it;
 *  - decided: what the outcome means next.
 */
export function langkahRujukan(g: Pick<Tinjauan, "case_state" | "case_outcome" | "case_raised_by_me" | "case_other_decider">): {
  langkah: typeof LANGKAH_RUJUKAN; kini: number; kalimat: string;
} {
  if (g.case_state === "DECIDED") {
    return { langkah: LANGKAH_RUJUKAN, kini: 2, kalimat: `studio.integritas.rujukan.lanjut.${g.case_outcome ?? "NO_FURTHER_ACTION"}` };
  }
  if (g.case_state === "UNDER_REVIEW") return { langkah: LANGKAH_RUJUKAN, kini: 2, kalimat: "studio.integritas.rujukan.sedang" };
  const kalimat = g.case_raised_by_me
    ? (g.case_other_decider === false ? "pimpinan.belum_ada_pemutus_lain" : "pimpinan.menunggu_pemutus_lain")
    : "studio.integritas.rujukan.di_pimpinan";
  return { langkah: LANGKAH_RUJUKAN, kini: 1, kalimat };
}
