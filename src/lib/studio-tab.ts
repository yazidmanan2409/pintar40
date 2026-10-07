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
 *   bank        CAN_REVIEW_QUESTION_HEALTH: Bank Soal as built is Question Health, which a teacher does not reach
 *               (J5.8, EDU-09; HOD-06)
 *   integritas  CAN_REVIEW_INTEGRITY: Kepala departemen, Admin sekolah, Admin platform; never a teacher (J5.8; HOD-07,
 *               X-11; CR-75, CR-77; D-070(i))
 *
 * Inside a tab, two parts are the platform operator's alone: the JSON package import on Buat Paket (D-127 Q7) and the
 * library's grant and withdrawal on Pustaka PINTAR (ADR-0015; CR-87 (4)).
 *
 * Pure: the layout and each page ask it, and the tests drive it with nothing else loaded.
 */

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
    bank: punya("CAN_REVIEW_QUESTION_HEALTH"),
    integritas: punya("CAN_REVIEW_INTEGRITY"),
  };
  return TAB_STUDIO.filter((t) => boleh[t]);
}

/** The platform operator (Admin platform): the JSON package import and the library's grants are theirs alone. */
export function operatorPintar(peran: readonly string[] | null | undefined): boolean {
  return (peran ?? []).includes("SYSTEM_ADMIN");
}
