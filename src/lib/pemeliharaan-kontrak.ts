/**
 * #148 (D-094, D-100(b)(c)): MAINTENANCE AND NOTICES, THE CONTRACT. Pure: no database, no React, no server.
 *
 * PLANNED maintenance is announced to the people it reaches from T-60 minutes, refuses a new assessment sitting from
 * T-15, and stops their requests at T=0, except a sitting already running, which drains: it continues, its answers
 * are kept and it can be handed in (D-100(b)). EMERGENCY interruption is Admin platform's «Hentikan sekarang»: it
 * stops affected activity at once, running sittings included, finalises and discards nothing, and every request is
 * answered with the truth until it ends (D-100(c)). The database decides all of it (PostgREST's pre-request answers
 * PT503 with PINTAR_PEMELIHARAAN or PINTAR_DIHENTIKAN); a page reads `pintar_status_saya` once as it begins and the
 * browser times T-60/30/15 itself, with no polling (D-094(d)).
 */

import { geserZona, jam } from "./tanggal";

export const HALAMAN_PEMELIHARAAN = "/pemeliharaan";

/** The phrase «Hentikan sekarang» is confirmed with, typed (D-094(h)); the database checks the same words. */
export const KONFIRMASI_HENTIKAN = "HENTIKAN SEKARANG";

export type JenisPemeliharaan = "PLANNED" | "EMERGENCY";
export type KeadaanPemeliharaan = "TERJADWAL" | "MENJELANG" | "AKTIF" | "BERAKHIR";

/** A window that reaches this reader: active, or starting within the hour. */
export type JendelaSaya = {
  id: string;
  jenis: JenisPemeliharaan;
  keadaan: KeadaanPemeliharaan;
  mulai: string;
  selesai: string | null;
  pesan: string | null;
  /** the reader controls it (its school's Admin sekolah, Admin platform), so it never stops them */
  menguasai: boolean;
  /** the reader has a sitting under way, which drains through planned maintenance */
  berjalan: boolean;
  /** the reader handed in an assessment since the window began */
  terkumpul: string | null;
  /** A2a: the classes an EMERGENCY class stop holds (null for a school or platform stop) */
  kelas: string[] | null;
  /** A2a: the reader also has another class or school, so the stop reaches them there too (Daisy's line) */
  kelasLain: boolean;
};

export type PengumumanSaya = { id: string; pesan: string; sampai: string };

export type StatusSaya = {
  pemeliharaan: JendelaSaya[];
  pengumuman: PengumumanSaya[];
  /** what stops this reader's requests now: the pre-request's own answer */
  terhenti: JenisPemeliharaan | null;
  /** the database's clock as it answered, which every state is decided by */
  sekarang: string | null;
};

export const STATUS_KOSONG: StatusSaya = { pemeliharaan: [], pengumuman: [], terhenti: null, sekarang: null };

const teks = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);
const waktu = (v: unknown): string | null => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : null);

/** The database's answer read back, trusting nothing: a row of the wrong shape is dropped. */
export function bacaStatusSaya(data: unknown): StatusSaya {
  if (!data || typeof data !== "object") return STATUS_KOSONG;
  const d = data as Record<string, unknown>;
  const jendela: JendelaSaya[] = [];
  for (const r of Array.isArray(d.pemeliharaan) ? d.pemeliharaan : []) {
    const x = (r ?? {}) as Record<string, unknown>;
    const mulai = waktu(x.mulai);
    if (!teks(x.id) || !mulai || (x.jenis !== "PLANNED" && x.jenis !== "EMERGENCY")) continue;
    if (!["TERJADWAL", "MENJELANG", "AKTIF"].includes(String(x.keadaan))) continue;
    jendela.push({
      id: x.id as string, jenis: x.jenis, keadaan: x.keadaan as KeadaanPemeliharaan, mulai, selesai: waktu(x.selesai),
      pesan: teks(x.pesan), menguasai: x.menguasai === true, berjalan: x.berjalan === true, terkumpul: waktu(x.terkumpul),
      kelas: Array.isArray(x.kelas) && x.kelas.length > 0 && x.kelas.every((k) => typeof k === "string" && k.length > 0) ? (x.kelas as string[]) : null,
      kelasLain: x.kelas_lain === true,
    });
  }
  const pengumuman: PengumumanSaya[] = [];
  for (const r of Array.isArray(d.pengumuman) ? d.pengumuman : []) {
    const x = (r ?? {}) as Record<string, unknown>;
    const sampai = waktu(x.sampai);
    if (teks(x.id) && teks(x.pesan) && sampai) pengumuman.push({ id: x.id as string, pesan: x.pesan as string, sampai });
  }
  const terhenti = d.terhenti === "PLANNED" || d.terhenti === "EMERGENCY" ? d.terhenti : null;
  return { pemeliharaan: jendela, pengumuman, terhenti, sekarang: waktu(d.sekarang) };
}

/** PostgREST's refusal during a window (PT503), as the kind of window; anything else is not maintenance. */
export function galatPemeliharaan(e: { code?: string | null; message?: string | null } | null | undefined): JenisPemeliharaan | null {
  if (e?.code !== "PT503") return null;
  if (e.message === "PINTAR_DIHENTIKAN") return "EMERGENCY";
  if (e.message === "PINTAR_PEMELIHARAAN") return "PLANNED";
  return null;
}

/** The paths that still answer while a window stops this reader: its own page, and leaving. */
export function jalurSaatPemeliharaan(path: string): boolean {
  return path === HALAMAN_PEMELIHARAAN || path === "/keluar";
}

/** Where a sitting is taken: its copy says an answer counts once «Tersimpan» shows (D-094(e)). */
export function permukaanAsesmen(path: string): boolean {
  return path.startsWith("/belajar/asesmen/");
}

/**
 * The warning a planned window gives at a moment, timed by the browser (D-094(c)(d)): 60, 30 or 15 for the last
 * hour's three notices, 0 once it has begun, null before the hour. `selisihMs` is the server's clock minus the
 * browser's, measured once as the page arrived, so a browser whose clock is wrong still warns on time.
 */
export function tahapPeringatan(mulai: string, sekarangMs: number, selisihMs = 0): 60 | 30 | 15 | 0 | null {
  const sisa = Date.parse(mulai) - (sekarangMs + selisihMs);
  if (!Number.isFinite(sisa)) return null;
  if (sisa <= 0) return 0;
  if (sisa <= 15 * 60_000) return 15;
  if (sisa <= 30 * 60_000) return 30;
  if (sisa <= 60 * 60_000) return 60;
  return null;
}

/** Whole minutes left, rounded up, never below 1 before the start. */
export function menitTersisa(mulai: string, sekarangMs: number, selisihMs = 0): number {
  return Math.max(1, Math.ceil((Date.parse(mulai) - (sekarangMs + selisihMs)) / 60_000));
}

/** The next moment the warning changes, in ms from now, or null once it has begun. */
export function tahapBerikutMs(mulai: string, sekarangMs: number, selisihMs = 0): number | null {
  const sisa = Date.parse(mulai) - (sekarangMs + selisihMs);
  if (!Number.isFinite(sisa) || sisa <= 0) return null;
  for (const batas of [60, 30, 15, 0]) {
    const tunggu = sisa - batas * 60_000;
    if (tunggu > 0) return tunggu;
  }
  return null;
}

/** A time of day as a reader in Indonesia reads it: «22.00» (WIB, Asia/Jakarta, unless a school's zone is given). */
// W3.3 (Batch 2; RV-16): from the one date helper, «22.00» in both languages (24-hour with a full stop, never «22:00»).
export function jamWib(iso: string, zona?: string | null): string {
  return jam(iso, zona);
}

/** The window that matters most to this reader now: an emergency, else an active window, else the nearest. */
export function jendelaUtama(s: StatusSaya): JendelaSaya | null {
  const urut = [...s.pemeliharaan].sort((a, b) =>
    (a.jenis === "EMERGENCY" ? 0 : 1) - (b.jenis === "EMERGENCY" ? 0 : 1)
    || (a.keadaan === "AKTIF" ? 0 : 1) - (b.keadaan === "AKTIF" ? 0 : 1)
    || Date.parse(a.mulai) - Date.parse(b.mulai));
  return urut[0] ?? null;
}

// ------------------------------------------------------------------ the administrator's side

/* The controls' refusals (PR110) are the action contract's: KODE_PEMELIHARAAN in galat-kontrak.ts. */

/** A window as the administrator's list returns it. */
export type JendelaKelola = {
  id: string;
  jenis: JenisPemeliharaan;
  keadaan: KeadaanPemeliharaan;
  platform: boolean;
  sekolah: string[];
  mulai: string;
  selesai: string | null;
  diakhiri: string | null;
  pesan: string | null;
  alasan: string;
  menguasai: boolean;
};

export type PengumumanKelola = {
  id: string;
  pesan: string;
  terbit: string;
  sampai: string;
  ditarik: string | null;
  platform: boolean;
  boleh: boolean;
};

/** W2.10: one page of each, and whether another page of each follows. */
export type DaftarKelola = { pemeliharaan: JendelaKelola[]; pengumuman: PengumumanKelola[]; lagiPemeliharaan: boolean; lagiPengumuman: boolean };

/** The administrator's list read back, dropping anything of the wrong shape. */
export function bacaDaftarKelola(data: unknown): DaftarKelola {
  const d = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const jendela: JendelaKelola[] = [];
  for (const r of Array.isArray(d.pemeliharaan) ? d.pemeliharaan : []) {
    const x = (r ?? {}) as Record<string, unknown>;
    const mulai = waktu(x.mulai);
    if (!teks(x.id) || !mulai || (x.jenis !== "PLANNED" && x.jenis !== "EMERGENCY") || !teks(x.alasan)) continue;
    if (!["TERJADWAL", "MENJELANG", "AKTIF", "BERAKHIR"].includes(String(x.keadaan))) continue;
    jendela.push({
      id: x.id as string, jenis: x.jenis, keadaan: x.keadaan as KeadaanPemeliharaan, platform: x.platform === true,
      sekolah: Array.isArray(x.sekolah) ? x.sekolah.filter((s): s is string => typeof s === "string") : [],
      mulai, selesai: waktu(x.selesai), diakhiri: waktu(x.diakhiri), pesan: teks(x.pesan), alasan: x.alasan as string,
      menguasai: x.menguasai === true,
    });
  }
  const pengumuman: PengumumanKelola[] = [];
  for (const r of Array.isArray(d.pengumuman) ? d.pengumuman : []) {
    const x = (r ?? {}) as Record<string, unknown>;
    const terbit = waktu(x.terbit);
    const sampai = waktu(x.sampai);
    if (!teks(x.id) || !teks(x.pesan) || !terbit || !sampai) continue;
    pengumuman.push({
      id: x.id as string, pesan: x.pesan as string, terbit, sampai, ditarik: waktu(x.ditarik),
      platform: x.platform === true, boleh: x.boleh === true,
    });
  }
  return { pemeliharaan: jendela, pengumuman, lagiPemeliharaan: d.lagi_pemeliharaan === true, lagiPengumuman: d.lagi_pengumuman === true };
}

/**
 * A local date and time typed into the form (`datetime-local`, no zone) read on the clock of the school the window or
 * notice is for (the owner's ruling, 10 Nov: institutions.zona_waktu, WIB, WITA or WIT), as an instant; WIB for the
 * whole platform, several schools, or none (D-094(e) speaks WIB, and the form's label says which). Null when it is not
 * a date and time.
 */
export function waktuSekolah(nilai: string | null | undefined, zona?: string | null): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(nilai ?? "").trim());
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - geserZona(zona));
  return Number.isNaN(d.getTime()) || +m[4] > 23 || +m[5] > 59 ? null : d.toISOString();
}

/** The same, read as WIB. */
export function waktuWib(nilai: string | null | undefined): string | null {
  return waktuSekolah(nilai, "Asia/Jakarta");
}
