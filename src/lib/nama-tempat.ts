import type { HleEvent } from "@/lib/hle";

/**
 * E-K1 (D-173(d)): A BACK LINK NAMES WHERE IT GOES. Each surface's own place word (its tab, D-128(g)) — the one table
 * the navigation (NavKonteks) and every back link to a place read, so a link to «Pimpinan» is called «Pimpinan»
 * wherever it is drawn. A return that depends on how the reader arrived is not a place: it is the history-back,
 * named as such (`kembali.riwayat`), never a guessed place and never a bare «Kembali».
 */
export const LABEL_TEMPAT: Readonly<Record<string, HleEvent>> = {
  "/belajar": "nav.belajar",
  "/mengajar": "nav.kelas",
  "/pimpinan": "nav.pimpinan",
  "/konfigurasi": "nav.konfigurasi",
  "/pendataan": "nav.pendataan",
  "/aktivasi": "nav.aktivasi",
  "/studio": "nav.studio",
  "/": "entry.title",
};

/** The place word of a place's own address, or null for an address that is not a place. */
export function namaTempat(href: string): HleEvent | null {
  return LABEL_TEMPAT[href] ?? null;
}

/** The history-back's name: it returns to whatever page the reader came from. */
export const KEMBALI_RIWAYAT: HleEvent = "kembali.riwayat";
