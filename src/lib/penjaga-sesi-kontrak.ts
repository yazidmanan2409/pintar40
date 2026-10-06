/**
 * BOB-29 (Gate 6): WHAT THE SCREEN AND THE SERVER SHARE about the shared-computer lock. Pure, with no secret and no
 * server-only import, so the lock screen and the inactivity clock read the same names and timings as the proxy.
 * The deciding is in the database and src/lib/penjaga-sesi.ts.
 */
export const HALAMAN_TERKUNCI = "/terkunci";
export const HALAMAN_PERANGKAT = "/perangkat";

/** The timings the screen keeps in step with the server (IDENTITY-4.0 §7). The server's are in sesi_keadaan. */
export const BATAS_SESI = {
  /** without activity, the session locks */
  kunciDetik: 5 * 60,
  /** the screen warns this long before */
  peringatanDetik: 4 * 60,
  /** activity reaches the server at most this often */
  detakDetik: 60,
} as const;

/**
 * THIS BROWSER, for «Komputer siapa ini?» (C11). A random value in an httpOnly cookie; the database keeps only its
 * SHA-256, per person. A declaration, not proof of ownership: losing the cookie only asks the question again, and
 * the safe answer is the default.
 */
export const COOKIE_PERANGKAT = "pintar_perangkat";
export const UMUR_PERANGKAT = 400 * 24 * 60 * 60;

/**
 * THIS SESSION IS ON A PERSONAL COMPUTER: the proxy then skips the database read. httpOnly, signed with a key
 * derived from the server's pepper under its own label, bound to the Auth session's id. Forged or another
 * session's, it does not verify and the database is asked. A personal session that was ended elsewhere is still
 * refused: by Auth (its session row is gone) and by the pre-request.
 */
export const COOKIE_PRIBADI = "pintar_pribadi";

/**
 * WHAT THE SCREEN NEEDS TO KNOW: SHARED or CARD, so it keeps the inactivity clock. Readable by the page, and
 * worthless to tamper with: deleted, the screen stops warning, and the server still locks at 5 minutes.
 */
export const COOKIE_JAGA = "pintar_jaga";

export type KeadaanSesi = "BUKA" | "TERKUNCI" | "BERAKHIR" | "TANPA";
export type ModeSesi = "SHARED" | "PERSONAL" | "CARD";
export type Penjagaan = {
  keadaan: KeadaanSesi;
  mode: ModeSesi | null;
  perluPilih: boolean;
  percobaanSisa: number | null;
  nama: string | null;
  bisaPin: boolean;
};

const KEADAAN: readonly string[] = ["BUKA", "TERKUNCI", "BERAKHIR", "TANPA"];
const MODE: readonly string[] = ["SHARED", "PERSONAL", "CARD"];

/** sesi_periksa's answer, read; anything else is null (the proxy then holds nothing: the database still refuses). */
export function bacaPenjagaan(x: unknown): Penjagaan | null {
  const o = (x && typeof x === "object" ? x : null) as Record<string, unknown> | null;
  if (!o || !KEADAAN.includes(String(o.keadaan))) return null;
  const sisa = Number(o.percobaan_sisa);
  return {
    keadaan: o.keadaan as KeadaanSesi,
    mode: MODE.includes(String(o.mode)) ? (o.mode as ModeSesi) : null,
    perluPilih: o.perlu_pilih === true,
    percobaanSisa: Number.isInteger(sisa) && sisa >= 0 && sisa <= 3 ? sisa : null,
    nama: typeof o.nama === "string" && o.nama.trim() ? o.nama : null,
    bisaPin: o.bisa_pin === true,
  };
}

/** The PIN a resume takes: a staff person's 4-digit personal PIN; a class card's own PIN (digits, as at sign-in). */
export function pinSahUntuk(mode: ModeSesi, pin: string): boolean {
  return mode === "CARD" ? /^\d{1,32}$/.test(pin) : /^\d{4}$/.test(pin);
}

/** What /api/sesi/buka answers: open (resume), still locked (and the tries left), or ended. */
export type JawabanBuka =
  | { ok: true; keadaan: "BUKA" }
  | { ok: false; code: "PIN_SALAH"; percobaanSisa: number }
  | { ok: false; code: "BERAKHIR" | "PIN_TIDAK_SAH" | "TANPA_PIN" | "LAYANAN_TIDAK_TERSEDIA" };

export function bacaJawabanBuka(x: unknown): JawabanBuka {
  const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
  if (o.ok === true && o.keadaan === "BUKA") return { ok: true, keadaan: "BUKA" };
  const sisa = Number(o.percobaanSisa);
  if (o.ok === false && o.code === "PIN_SALAH" && Number.isInteger(sisa) && sisa >= 1 && sisa <= 2) {
    return { ok: false, code: "PIN_SALAH", percobaanSisa: sisa };
  }
  if (o.ok === false && (o.code === "BERAKHIR" || o.code === "PIN_TIDAK_SAH" || o.code === "TANPA_PIN")) return { ok: false, code: o.code };
  return { ok: false, code: "LAYANAN_TIDAK_TERSEDIA" };
}
