import { t, type HleEvent } from "@/lib/hle";
import type { DataKartu } from "@/lib/aktivasi-kontrak";

/**
 * W3.20 / DAISY-24 — THE PINTAR DIGITAL CARD'S PRESENTATION RULES (D-074 and its addendum; D-120 Q16 freeze).
 *
 * Pure presentation over the card's own data (`DataKartu`, read by `GET /api/akun/kartu` from my_identity_card):
 * nothing here reads, adds or drops a fact. The database lists the contexts in its own order; the card shows them
 * in THE CARD'S order, which is:
 *
 * - ALPHABETICAL by the Terminology v1 role names (D-074(5), (11)), then by the school's name so two roles of the
 *   same name at two schools are deterministic too. Chosen solely because it is deterministic and non-hierarchical:
 *   it is not seniority, not `display_role`, not tenure, and no later version may re-sort it by authority.
 * - THE COLOUR is the family colour of the FIRST role in that list (D-074 addendum (4)). A presentation rule only:
 *   it does not mark a primary role.
 * - ONE SCHOOL: the roles on one line («Guru · Kepala departemen»), the school beneath. SEVERAL SCHOOLS: one role
 *   with its school per line (D-074(6)). A role with no school (Admin platform) beside a role at a school is two
 *   different places, so it takes the several-schools form: the role alone on its own line, never under a school
 *   it does not belong to.
 * - CAPACITY: the 4.0 card is proven for up to TWO role and school pairs (D-074(10)). More is an unresolved
 *   presentation exception returned for product handling: the card never shrinks its type, truncates or leaves a
 *   role out, so every line is still drawn and the state is marked (`lebihDariDua`) for the screen to carry.
 *
 * The card face is Bahasa Indonesia only (round 2, «Already decided by Yazid»), so the role names are always the
 * Indonesian Terminology v1 names, whatever the page's language.
 */

/** The six families (D-074(1)); each takes its colour token in experience.css (`--kp-<keluarga>`). */
export type Keluarga = "murid" | "guru" | "kadep" | "dekan" | "admin-sekolah" | "admin-platform";

/** Each role's family. A role not named here has no family colour (none is invented). */
export const KELUARGA_PERAN: Readonly<Record<string, Keluarga>> = {
  STUDENT: "murid",
  EDUCATOR: "guru",
  HEAD_OF_DEPARTMENT: "kadep",
  DEAN: "dekan",
  INSTITUTION_ADMIN: "admin-sekolah",
  SYSTEM_ADMIN: "admin-platform",
};

/** D-074(10): the card is proven for up to this many current role and school pairs. */
export const KAPASITAS_PASANGAN = 2;

/** The Terminology v1 name of a role, as the card writes it (Indonesian). */
export function namaPeranKartu(peran: string): string {
  return t(`role.${peran}` as HleEvent, "staff", { locale: "id" });
}

/** One line of the lower field: a role part (600) and a school part (400); either may be absent. */
export type BarisBab = { peran: string | null; sekolah: string | null };

export type SusunanKartu = {
  /** the contexts in the card's order */
  urut: DataKartu["konteks"];
  /** the first role's family, or null when there is none to take */
  keluarga: Keluarga | null;
  baris: BarisBab[];
  /** how many role and school pairs the card carries */
  pasangan: number;
  /** D-074(10): more pairs than the card is proven for — the unresolved presentation exception */
  lebihDariDua: boolean;
};

const urutan = new Intl.Collator("id", { sensitivity: "base", numeric: true });

export function susunKartu(konteks: DataKartu["konteks"]): SusunanKartu {
  const urut = [...konteks].sort((a, b) =>
    urutan.compare(namaPeranKartu(a.peran), namaPeranKartu(b.peran)) || urutan.compare(a.institusi ?? "", b.institusi ?? ""));
  const keluarga = urut.length ? KELUARGA_PERAN[urut[0].peran] ?? null : null;
  const tempat = new Set(urut.map((k) => k.institusi ?? null));
  let baris: BarisBab[] = [];
  if (urut.length && tempat.size === 1) {
    const sekolah = urut[0].institusi ?? null;
    baris = [{ peran: urut.map((k) => namaPeranKartu(k.peran)).join(" · "), sekolah: null }];
    if (sekolah) baris.push({ peran: null, sekolah });
  } else {
    baris = urut.map((k) => ({ peran: namaPeranKartu(k.peran), sekolah: k.institusi ?? null }));
  }
  return { urut, keluarga, baris, pasangan: urut.length, lebihDariDua: urut.length > KAPASITAS_PASANGAN };
}
