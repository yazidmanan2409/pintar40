import { t, format, type HleEvent, type Locale } from "@/lib/hle";
import {
  susunStruktur,
  KUNCI_GALAT_STRUKTUR,
  type BagianTersusun,
  type KodeStruktur,
  type SimpulStruktur,
  type TingkatanStruktur,
} from "@/lib/struktur-kontrak";

/**
 * THE STRUKTUR SEKOLAH SCREEN, AS DATA (DAISY-05; D-006, D-022, D-027).
 *
 * Pure and free of React, so the guard can read exactly what the screen draws
 * without a browser or a database. The panel (PanelStruktur.tsx) renders this
 * and adds only the forms.
 *
 * ═══ ONLY BAGIAN, TINGKAT AND KELAS ═══
 *
 * `school_structure` returns the three visible levels and never the hidden
 * Jenjang (one per school) or Reguler (one per Bagian, D-027), and the
 * contract's `susunStruktur`, which builds the tree, takes only those three
 * levels from whatever it is given. DAISY-05-STRUKTUR-01 plants a Jenjang and
 * a Reguler in the rows to prove neither reaches the screen.
 *
 * ═══ WHAT A REFUSAL SAYS ═══
 *
 * Every code BOB-01 can return has its own sentence, through the contract's
 * own map of code to copy key; the database's words never reach the screen
 * (D-011). A failure nobody named carries the short reference the server
 * logged, so Gladys has something to quote.
 */

/** The tree the screen draws, each level with its active places first. */
export function pohonStruktur(rows: readonly SimpulStruktur[]): BagianTersusun[] {
  const aktifDulu = <T extends { is_active: boolean }>(xs: T[]): T[] => [
    ...xs.filter((x) => x.is_active),
    ...xs.filter((x) => !x.is_active),
  ];
  return aktifDulu(susunStruktur(rows)).map((b) => ({
    ...b,
    tingkat: aktifDulu(b.tingkat).map((tk) => ({ ...tk, kelas: aktifDulu(tk.kelas) })),
  }));
}

/** Rename and deactivate are offered on an active place only (no reactivation, D-022). */
export function bolehDiubah(simpul: Pick<SimpulStruktur, "is_active">): boolean {
  return simpul.is_active;
}

/** Something can be added under a place only while it is active. */
export function bolehDitambahi(simpul: Pick<SimpulStruktur, "is_active">): boolean {
  return simpul.is_active;
}

const s = (k: HleEvent, locale: Locale) => t(k, "staff", { locale });

/** The sentence for a refusal from an action; a failure nobody named carries its reference. */
export function kalimatGagal(kode: KodeStruktur, ref: string | undefined, locale: Locale): string {
  const kalimat = s(KUNCI_GALAT_STRUKTUR[kode] ?? KUNCI_GALAT_STRUKTUR.STRUCTURE_FAILED, locale);
  return ref ? `${kalimat} ${s("config.struktur.rujukan", locale)} ${ref}` : kalimat;
}

/**
 * The sentence when the list itself could not be read. A refusal to read says
 * so; anything else is "cannot be shown right now", never "not saved", because
 * nothing was being saved.
 */
export function kalimatGagalBaca(kode: KodeStruktur, ref: string | undefined, locale: Locale): string {
  const kalimat = kode === "STRUCTURE_NOT_ALLOWED"
    ? s(KUNCI_GALAT_STRUKTUR.STRUCTURE_NOT_ALLOWED, locale)
    : s("config.struktur.gagal_baca", locale);
  return ref ? `${kalimat} ${s("config.struktur.rujukan", locale)} ${ref}` : kalimat;
}

/** "12 murid" / "1 student"; nothing for a Bagian, which places nobody itself. */
export function jumlahMurid(n: number | null, locale: Locale): string | null {
  if (n === null) return null;
  return `${format.number(n, locale)} ${s(n === 1 ? "config.struktur.murid.satu" : "config.struktur.murid.banyak", locale)}`;
}

/** The words for a level, for an action on it, and for its example. */
export const KUNCI_JENIS: Record<TingkatanStruktur, HleEvent> = {
  BAGIAN: "config.struktur.jenis.BAGIAN",
  TINGKAT: "config.struktur.jenis.TINGKAT",
  KELAS: "config.struktur.jenis.KELAS",
};
export const KUNCI_TAMBAH: Record<TingkatanStruktur, HleEvent> = {
  BAGIAN: "config.struktur.tambah.BAGIAN",
  TINGKAT: "config.struktur.tambah.TINGKAT",
  KELAS: "config.struktur.tambah.KELAS",
};
export const KUNCI_CONTOH: Record<TingkatanStruktur, HleEvent> = {
  BAGIAN: "config.struktur.contoh.BAGIAN",
  TINGKAT: "config.struktur.contoh.TINGKAT",
  KELAS: "config.struktur.contoh.KELAS",
};
