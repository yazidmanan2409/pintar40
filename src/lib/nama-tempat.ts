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

/**
 * H9 (Daisy, C1): a report names the page it was opened from. The two places that open a report say so in its address
 * (`dari`); the way back is then named by that place and still returns to the page as the reader left it (history).
 * Opened from anywhere else, it is the history-back, named as one.
 */
export const ASAL_LAPORAN: Readonly<Record<string, { ke: string; nama: HleEvent }>> = {
  pimpinan: { ke: "/pimpinan", nama: "nav.pimpinan" },
  konfigurasi: { ke: "/konfigurasi#laporan", nama: "config.laporan.judul" },
};
export function asalLaporan(dari: unknown): { ke: string; nama: HleEvent } {
  return (typeof dari === "string" && Object.hasOwn(ASAL_LAPORAN, dari) ? ASAL_LAPORAN[dari] : null) ?? { ke: "/", nama: KEMBALI_RIWAYAT };
}
