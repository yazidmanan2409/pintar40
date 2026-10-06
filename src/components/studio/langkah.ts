import type { HleEvent } from "@/lib/hle";

/**
 * THE STEPS FROM AN UPLOADED COURSE TO "TERBIT" (DAISY-06, audit M11).
 *
 * The package page used to offer "Konfirmasi", "Konfirmasi", "Tinjau",
 * "Setujui", "Setujui & Kunci" and "Terbitkan" side by side, with nothing to
 * say which came first, which one the reader was at, or why one of them would
 * be refused. This names seven steps in the order the database takes them,
 * says which one a course is at, and who may take it.
 *
 * THE ORDER IS THE DATABASE'S, NOT THIS FILE'S. Steps 1-4 are the content
 * lifecycle's own edges (content_status_transitions: INGESTED -> STRUCTURED
 * -> VALIDATED -> IN_REVIEW -> APPROVED, taken by advanceContentAction), and
 * steps 5-7 are BOB-03's release functions (LANGKAH_TERBITAN in
 * terbitan-kontrak.ts). A guard reads both and fails if this list drifts.
 *
 * WHO. A step names the capability that takes it. Two steps are the second
 * person's: approving the content (enforce_content_status refuses a reviewer
 * who is its author) and locking the release (RELEASE_SAME_PERSON). The roles
 * shown beside each step are the school roles whose capability map holds that
 * capability, and a guard reads them from role_capabilities.
 *
 * DECIDES NOTHING. A button shown here is a courtesy: every one of them calls
 * a path that asks the database again, and a refusal comes back as its code's
 * sentence.
 *
 * Pure and free of React, so the guard can read exactly what the page draws.
 */
export type KunciLangkah = "susun" | "periksa" | "ajukan" | "setujui" | "buat" | "kunci" | "terbitkan";

export type Kemampuan = "CAN_DRAFT" | "CAN_REVIEW" | "CAN_FREEZE_RELEASE" | "CAN_PUBLISH";

export type Langkah = {
  kunci: KunciLangkah;
  kemampuan: Kemampuan;
  /** The second person's step: its taker may not be the course's author. */
  orangKedua: boolean;
  /** The school roles holding `kemampuan` (the platform administrator holds them all). */
  peran: readonly string[];
  /**
   * How it is taken: a content-lifecycle edge (the course moves to `ke`), a
   * BOB-03 release action, or nothing to press.
   */
  jalan: { isi: "STRUCTURED" | "VALIDATED" | "IN_REVIEW" | "APPROVED" }
       | { terbitan: "buatTerbitanAksi" | "kunciTerbitanAksi" | "terbitkanAksi" };
};

const PENYUSUN = ["EDUCATOR", "HEAD_OF_DEPARTMENT", "INSTITUTION_ADMIN"] as const;
const PENINJAU = ["HEAD_OF_DEPARTMENT", "INSTITUTION_ADMIN"] as const;
const PENERBIT = ["INSTITUTION_ADMIN"] as const;

export const LANGKAH: readonly Langkah[] = [
  { kunci: "susun", kemampuan: "CAN_DRAFT", orangKedua: false, peran: PENYUSUN, jalan: { isi: "STRUCTURED" } },
  { kunci: "periksa", kemampuan: "CAN_DRAFT", orangKedua: false, peran: PENYUSUN, jalan: { isi: "VALIDATED" } },
  { kunci: "ajukan", kemampuan: "CAN_DRAFT", orangKedua: false, peran: PENYUSUN, jalan: { isi: "IN_REVIEW" } },
  { kunci: "setujui", kemampuan: "CAN_REVIEW", orangKedua: true, peran: PENINJAU, jalan: { isi: "APPROVED" } },
  { kunci: "buat", kemampuan: "CAN_FREEZE_RELEASE", orangKedua: false, peran: PENINJAU, jalan: { terbitan: "buatTerbitanAksi" } },
  { kunci: "kunci", kemampuan: "CAN_FREEZE_RELEASE", orangKedua: true, peran: PENINJAU, jalan: { terbitan: "kunciTerbitanAksi" } },
  { kunci: "terbitkan", kemampuan: "CAN_PUBLISH", orangKedua: false, peran: PENERBIT, jalan: { terbitan: "terbitkanAksi" } },
];

/** The course's status at each content step, the one that step starts from. */
const DARI_ISI: Record<string, KunciLangkah> = {
  INGESTED: "susun",
  // returned for correction: the only way back is to STRUCTURED, which is step 1's edge
  VALIDATION_FAILED: "susun",
  STRUCTURED: "periksa",
  VALIDATED: "ajukan",
  IN_REVIEW: "setujui",
  APPROVED: "buat",
};

export type FaktaPaket = {
  /** courses.status */
  statusKursus: string;
  /** The course's latest release, if it has one. */
  terbitan: { status: string } | null;
};

/**
 * Where a course stands. `kini` is the step to take next; "terbit" when its
 * release is published, "ditarik" when that release was withdrawn, and null
 * for a state no step leads from (the page then shows the steps without a
 * current one rather than guess).
 */
export type Posisi = { kini: KunciLangkah | "terbit" | "ditarik" | null; dikembalikan: boolean };

export function posisiPaket(f: FaktaPaket): Posisi {
  const dikembalikan = f.statusKursus === "VALIDATION_FAILED";
  if (f.terbitan) {
    if (f.terbitan.status === "PUBLISHED") return { kini: "terbit", dikembalikan };
    if (f.terbitan.status === "SUPERSEDED") return { kini: "ditarik", dikembalikan };
    if (f.terbitan.status === "FROZEN") return { kini: "terbitkan", dikembalikan };
    return { kini: "kunci", dikembalikan };
  }
  return { kini: DARI_ISI[f.statusKursus] ?? null, dikembalikan };
}

/** Each step as done, current or still to come. */
export function keadaanLangkah(p: Posisi): Array<{ langkah: Langkah; keadaan: "selesai" | "kini" | "nanti" }> {
  const i = p.kini === "terbit" || p.kini === "ditarik" ? LANGKAH.length
    : p.kini === null ? -1 : LANGKAH.findIndex((l) => l.kunci === p.kini);
  return LANGKAH.map((langkah, n) => ({
    langkah,
    keadaan: i < 0 ? "nanti" : n < i ? "selesai" : n === i ? "kini" : "nanti",
  }));
}

/**
 * Whether THIS reader may take a step: "boleh"; "penyusun" when they hold the
 * capability but wrote the course and the step is the second person's; or
 * "wewenang" when they do not hold the capability in this school. A second
 * person's step for a reader or an author PINTAR could not read offers no
 * button: whether they are the same person is unknown, and the database would
 * refuse an unknown author anyway.
 */
export type Boleh = "boleh" | "penyusun" | "wewenang";

export function bolehMengambil(
  l: Langkah,
  kemampuan: readonly string[],
  saya: string | null,
  penyusun: string | null,
): Boleh {
  if (!kemampuan.includes(l.kemampuan)) return "wewenang";
  if (!l.orangKedua) return "boleh";
  if (saya === null || penyusun === null) return "wewenang";
  return saya === penyusun ? "penyusun" : "boleh";
}

/** Copy keys for a step (D-014). */
export function kunciSalinan(k: KunciLangkah, bagian: "judul" | "arti" | "tombol"): HleEvent {
  return `studio.langkah.${k}.${bagian}` as HleEvent;
}
