/**
 * CR-87 (D-127 Q4, Q7, Q8; D-129(g)): WHO SEES WHICH STUDIO TAB, FROM CANON.
 *
 * Studio admitted everyone holding any Studio capability and showed every one of them all nine tabs. Each tab is now
 * shown only to the people its canon names. Hiding a tab makes nothing safe: every action is still the database's to
 * refuse, and each page answers a person it is not for by sending them to Studio's home.
 *
 *   beranda     everyone Studio admits (D-021)
 *   unggah      CAN_DRAFT: Guru, Kepala departemen, Admin sekolah, Admin platform (D-007, D-021; J4.1)
 *   tinjau      CAN_REVIEW: the reviewer, never the author's own work (J4.3, J4.4; HOD-01, HOD-03)
 *   kanonik     CAN_DRAFT or CAN_ASSIGN_LEARNING, the read accessors' own gate (ADR-0015; D-120 Q7, M6)
 *   definisi    Admin sekolah and Admin platform: «not ordinary teacher UI … its narrow administrative/operator
 *               ownership» (D-127 Q8), the admin-gated configuration of FABLE-01 §10 and doc 09, as the pass mark is
 *               the school admin's (D-081 Q2)
 *   bank        CAN_DRAFT or CAN_REVIEW_QUESTION_HEALTH (owner ruling F-7, 2 Nov, Batch 3 closure; QN5, J4.8): a teacher
 *               who authors browses their own school's bank with its keys and reasons; Question Health inside it (its
 *               signals, the evidence figures and the review form) stays the reviewer's (J4.9, J5.8, EDU-09; HOD-06)
 *   integritas  CAN_REVIEW_INTEGRITY: Kepala departemen, Admin sekolah, Admin platform; never a teacher (J5.8; HOD-07,
 *               X-11; CR-75, CR-77; D-070(i))
 *
 * Inside a tab, two parts are the platform operator's alone: the JSON package import on Buat Paket (D-127 Q7) and the
 * library's grant and withdrawal on Pustaka PINTAR (ADR-0015; CR-87 (4)).
 *
 * Pure: the layout and each page ask it, and the tests drive it with nothing else loaded.
 */

/**
 * The capabilities that are Studio's: the ones Studio asks the database about (studio_capabilities, src/app/studio/_lib.ts)
 * and the only ones that can give a Studio tab. A grant's other capabilities (a dean's CAN_VIEW_LEARNER_ROSTER) give
 * none, so a shell never offers Studio to someone Studio would refuse (D-021).
 */
export const KEMAMPUAN_STUDIO = [
  "CAN_DRAFT", "CAN_REVIEW", "CAN_FREEZE_RELEASE", "CAN_PUBLISH",
  "CAN_ASSIGN_LEARNING", "CAN_REVIEW_QUESTION_HEALTH", "CAN_REVIEW_INTEGRITY",
  // ADDED for ADR-0018: the Quick Assessment affordance asks the database
  // whether this viewer may launch one, the same way every other Studio
  // control does. The RPC re-asks it per class node, so this only decides
  // whether the page is worth showing.
  "CAN_QUICK_ASSESSMENT",
] as const;

export const TAB_STUDIO = ["beranda", "unggah", "tinjau", "kanonik", "definisi", "bank", "integritas"] as const;
export type TabStudio = (typeof TAB_STUDIO)[number];

/** The tabs a person sees, from the capabilities Studio's database answer gives them and their active roles. */
export function tabStudio(kemampuan: ReadonlySet<string>, peran: readonly string[]): TabStudio[] {
  const punya = (k: string) => kemampuan.has(k);
  const admin = peran.includes("INSTITUTION_ADMIN") || peran.includes("SYSTEM_ADMIN");
  const boleh: Record<TabStudio, boolean> = {
    beranda: kemampuan.size > 0,
    unggah: punya("CAN_DRAFT"),
    tinjau: punya("CAN_REVIEW"),
    kanonik: punya("CAN_DRAFT") || punya("CAN_ASSIGN_LEARNING"),
    definisi: admin && punya("CAN_DRAFT"),
    bank: punya("CAN_DRAFT") || punya("CAN_REVIEW_QUESTION_HEALTH"),
    integritas: punya("CAN_REVIEW_INTEGRITY"),
  };
  return TAB_STUDIO.filter((t) => boleh[t]);
}

/** The platform operator (Admin platform): the JSON package import and the library's grants are theirs alone. */
export function operatorPintar(peran: readonly string[] | null | undefined): boolean {
  return (peran ?? []).includes("SYSTEM_ADMIN");
}
