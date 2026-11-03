import type { HleEvent } from "./hle";

/**
 * BOB-15 + DAISY-12 (D-037 step 2): «LAPORKAN MASALAH»'S CONTRACT. Pure: no database, no React, no server.
 *
 * A member of staff reports a problem from the page it happened on. They write three things (what they did, what they
 * expected, what happened) and may say it stops a class; PINTAR attaches the page, any error reference, the device
 * and an optional screenshot, and the database adds their role, school, build and time. The report is received at
 * once and its status (Diterima → Ditangani → Selesai) and next step are theirs to follow under «Laporan saya».
 * The school's Admin sekolah moves their school's reports; Admin platform any (D-037 tiers; D-101(f)).
 *
 * The database refuses with SQLSTATE PR100 and the code in DETAIL; this file maps those codes and nothing else.
 */

export const STATUS_LAPORAN = ["DITERIMA", "DITANGANI", "SELESAI"] as const;
export type StatusLaporan = (typeof STATUS_LAPORAN)[number];

export const KODE_LAPORAN_DB = [
  "REPORT_NOT_STAFF", "REPORT_INPUT_INVALID", "REPORT_NOT_ALLOWED", "REPORT_STATUS_INVALID", "REPORT_NEXT_STEP_REQUIRED",
] as const;
export type KodeLaporan = (typeof KODE_LAPORAN_DB)[number] | "REPORT_FAILED";

/** A database error as a report code: PR100 with a known DETAIL, else REPORT_FAILED. */
export function kodeGalatLaporan(e: { code?: string | null; details?: string | null } | null | undefined): KodeLaporan {
  if (e?.code === "PR100" && typeof e.details === "string" && (KODE_LAPORAN_DB as readonly string[]).includes(e.details)) {
    return e.details as KodeLaporan;
  }
  return "REPORT_FAILED";
}

/** The copy key of a code (D-014). */
export function kunciKodeLaporan(k: KodeLaporan): HleEvent {
  return `lapor.kode.${k.toLowerCase()}` as HleEvent;
}

/** The copy key of a status. */
export function kunciStatusLaporan(s: StatusLaporan): HleEvent {
  return `lapor.status.${s}` as HleEvent;
}

/** The status a report may move to next, in order: forward only. */
export function langkahBerikut(s: StatusLaporan): StatusLaporan[] {
  return s === "DITERIMA" ? ["DITANGANI", "SELESAI"] : s === "DITANGANI" ? ["SELESAI"] : [];
}

/** The PINTAR page a report is about, or "/" when the address carried none worth keeping. */
export function halamanLaporan(v: string | null | undefined): string {
  const p = (v ?? "").trim();
  if (!/^\/[^\s]{0,299}$/.test(p) || p.startsWith("//") || p.startsWith("/lapor")) return "/";
  return p;
}

/** An error reference as the page showed it, or null. */
export function rujukanLaporan(v: string | null | undefined): string | null {
  const r = (v ?? "").trim();
  return /^[A-Za-z0-9-]{1,64}$/.test(r) ? r : null;
}

/** Where «Laporkan masalah» goes from a page, carrying that page and any reference. */
export function alamatLapor(halaman: string, rujukan?: string | null): string {
  const q = new URLSearchParams({ dari: halamanLaporan(halaman) });
  const r = rujukanLaporan(rujukan);
  if (r) q.set("ref", r);
  return `/lapor?${q.toString()}`;
}

/** A screenshot's own name as the upload asks for it: one fresh id and the picture's kind, never the file's name. */
export function namaTangkapan(id: string, jenisBerkas: string): string | null {
  const ext = jenisBerkas === "image/png" ? "png" : jenisBerkas === "image/jpeg" ? "jpg" : jenisBerkas === "image/webp" ? "webp" : null;
  return ext && /^[0-9a-f-]{36}$/.test(id) ? `laporan/${id}.${ext}` : null;
}

/** The largest screenshot accepted, in bytes. */
export const BATAS_TANGKAPAN = 5 * 1024 * 1024;

/**
 * W2.10 (Batch 4; CR-49, CAP-10): which rows one page of the triage list reads, the open reports coming before the
 * finished ones. `terbuka` and `selesai` are inclusive ranges within each (one row more than a page in all, so the next
 * page's existence is known), or null where the page reads none of that kind.
 */
export function rentangTriase(halaman: number, ukuran: number, nTerbuka: number): { terbuka: [number, number] | null; selesai: [number, number] | null } {
  const dari = (Math.max(1, Math.floor(halaman)) - 1) * ukuran;
  const sampai = dari + ukuran;
  return {
    terbuka: dari < nTerbuka ? [dari, Math.min(sampai, nTerbuka - 1)] : null,
    selesai: sampai >= nTerbuka ? [Math.max(0, dari - nTerbuka), sampai - nTerbuka] : null,
  };
}
