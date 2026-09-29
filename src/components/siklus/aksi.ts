import type { HleEvent } from "@/lib/hle";
import type { Langkah } from "@/lib/siklus";

/**
 * DAISY-26 (UX-21): A BUTTON IS NAMED FOR WHERE IT GOES.
 *
 * The home panel used to say «Mulai» for both tests, «Buka» for the result and
 * for the assignment's own page, and «Lanjutkan» both as its eyebrow and as the
 * button that opened the page the second button also opened. A learner could
 * not tell from the words which test would start or which page would open.
 *
 * So every step's button says the step: the Pemetaan Awal and the Uji
 * Penguasaan by name, «Lanjutkan» only when a session is already open, and the
 * lessons «Mulai» until one has been read. The home panel, its cards and the
 * assignment's page all ask this one function, so the three cannot drift.
 */
export function labelTujuan(
  tujuan: Langkah,
  keadaan: { berjalan?: boolean; belumMembaca?: boolean } = {},
): HleEvent {
  switch (tujuan) {
    case "PEMETAAN": return keadaan.berjalan ? "siklus.aksi.pemetaan_lanjut" : "siklus.aksi.pemetaan";
    case "PETA": return "siklus.lihat_peta";
    case "PELAJARAN": return keadaan.belumMembaca ? "siklus.aksi.pelajaran_mulai" : "siklus.aksi.pelajaran";
    case "PENGUASAAN": return keadaan.berjalan ? "siklus.aksi.penguasaan_lanjut" : "siklus.aksi.penguasaan";
    case "HASIL": return "siklus.aksi.hasil";
  }
}

/**
 * DAISY-26 (UX-05): WHAT AN ASSESSMENT IS CALLED, BY ITS OWN KIND.
 *
 * The cycle's two tests and a teacher's Quick Assessment share one player, and
 * a Quick Assessment borrows the Uji Penguasaan's treatment. It used to borrow
 * its name too: a learner opening an Uji Cepat met «Uji Penguasaan». The kind
 * comes from the assessment itself (`assessment_orientation().mode`). A kind
 * with no product name of its own returns null, and the caller shows the
 * assessment's own title rather than a name that belongs to something else.
 */
export function kunciNamaAsesmen(jenis: string | null | undefined): HleEvent | null {
  switch (jenis) {
    case "PRE_TEST": return "pretest.title";
    case "POST_TEST": return "posttest.title";
    case "QUICK": return "ujicepat.title";
    default: return null;
  }
}
