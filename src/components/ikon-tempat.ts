import type { NamaIkon } from "./Ikon";

/**
 * Each place's one icon in the staff navigation (the design system's AppShell, TEMPAT; Icons: one meaning per icon).
 * A place with no entry is drawn with its word alone.
 */
export const IKON_TEMPAT: Record<string, NamaIkon> = {
  "/mengajar": "users",
  "/belajar": "book-open",
  "/belajar/sertifikat": "award",
  "/pimpinan": "chart-no-axes-column",
  "/konfigurasi": "settings",
  "/pendataan": "file-spreadsheet",
  "/aktivasi": "user-check",
  "/studio": "square-pen",
  "/konfigurasi/keamanan": "shield",
  "/konfigurasi/email-uji": "mail",
  // E1: in the rail a place is its icon, so every place has one (Sertifikat sekolah had none and drew nothing there)
  "/konfigurasi/sertifikat": "award",
};
