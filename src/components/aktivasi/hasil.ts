import type { HleEvent } from "@/lib/hle";

/**
 * WHAT AN ACTIVATION'S ANSWER MEANS TO THE ADMINISTRATOR (DAISY-09, D-019,
 * D-011).
 *
 * `/api/akun/aktivasi` answers `{ ok, error, detail }`. `error` is one of a
 * handful of stable words the route writes itself; `detail` is the database's
 * or Auth's own English sentence, and it is never shown: D-011 keeps raw server
 * text off a reader's screen. Each word maps to a plain sentence in hle.ts,
 * chosen for the path that was taken, because "refused" means something
 * different for a recorded person than for a new one.
 *
 * The same shape check as /masuk runs before anything is sent, so a missing
 * `@` is told here in the reader's own words rather than coming back as a
 * refusal that names the wrong cause.
 *
 * Pure and free of React, so the guard reads exactly what the form shows.
 */
export type ModeAktivasi = "EMAIL" | "CLASSROOM_CARD" | "NEW_PERSON";

export type JawabanAktivasi = {
  ok: boolean;
  error?: string;
  card?: string;
  pin?: string;
  detail?: string | null;
};

/** The words the route itself writes into `error`. */
export const GALAT_RUTE = ["mode", "unauthenticated", "email", "person_id", "refused", "email_taken", "create_failed", "CONTEXT_OTHER_PLACE"] as const;

/**
 * S-15 (SAPU-VERIFIED): THE ROUTE'S WORD FOR AN ACCOUNT AUTH DID NOT CREATE. Only an address Auth reports as already
 * registered is `email_taken`; an outage, a rate limit or an Auth that could not be reached is `create_failed`, so an
 * administrator is never told to change a correct address because of an outage.
 */
export function galatBuat(e: { code?: string | null; status?: number; message?: string | null }): "email_taken" | "create_failed" {
  return e.code === "email_exists" || (e.status === 422 && /already (?:been )?registered|already exists/i.test(e.message ?? ""))
    ? "email_taken" : "create_failed";
}

/**
 * The same permissive shape check as /masuk (LayarMasuk): it catches a missing
 * `@` or a cut-off domain and refuses nothing a real school address could be.
 */
export function surelLengkap(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

/** What is missing before the request may go, or null when it may. */
export function isianKurang(mode: ModeAktivasi, isian: { nama?: string; surel?: string }): HleEvent | null {
  if (mode === "NEW_PERSON" && !(isian.nama ?? "").trim()) return "aktivasi.galat.nama";
  if (mode !== "CLASSROOM_CARD" && !surelLengkap(isian.surel ?? "")) return "aktivasi.galat.surel";
  return null;
}

/**
 * The sentence for an activation that did not happen. `null` is no answer at
 * all: the request never reached PINTAR, or what came back was not the
 * route's answer.
 */
export function kunciGagal(mode: ModeAktivasi, jawaban: JawabanAktivasi | null): HleEvent {
  if (!jawaban) return "aktivasi.galat.jaringan";
  switch (jawaban.error) {
    case "unauthenticated":
      return "aktivasi.galat.sesi";
    case "email":
      return "aktivasi.galat.surel";
    case "refused":
      return mode === "NEW_PERSON" ? "aktivasi.galat.baru_ditolak" : "aktivasi.galat.ditolak";
    // S-15: «mungkin sudah dipakai» only when Auth said the address is registered; anything else is a try-again
    case "email_taken":
      return mode === "CLASSROOM_CARD" ? "aktivasi.galat.kartu" : "aktivasi.galat.dipakai";
    case "create_failed":
      return mode === "CLASSROOM_CARD" ? "aktivasi.galat.kartu" : "aktivasi.galat.buat_gagal";
    default:
      return "aktivasi.gagal";
  }
}
