import { format, type HleEvent, type Locale } from "@/lib/hle";
import { JALUR, STATUS, LANGKAH, type AlasanPassword, type KodeRute, type Langkah, type Rute } from "./kontrak";

/**
 * WHAT BOB-26's ROUTES ANSWER, READ ONCE (DAISY-20).
 *
 * Every activation, sign-in and card request goes through `kirim`, and every
 * answer through `baca`. The screens never read a status, a body or an error's
 * text themselves (D-011): they get either the route's success body or one
 * refusal — a code from the contract (./kontrak.ts), a wait when the route
 * gave one, a reference when the server failed — and say it with `kalimat`.
 *
 * A KNOWN CODE WINS; a body without one is read by its status, so a code the
 * contract gains still lands on the right family of sentence; anything else,
 * a dropped connection included, is PUTUS: "could not reach PINTAR".
 *
 * NOTHING HERE CAN TELL ONE ADDRESS FROM ANOTHER. The contract answers every
 * signed-out request the same way for an address or username that exists and
 * one that does not (§0), and the readers keep only what the answer carries:
 * no code is invented from timing, and no wait is invented at all. A wait is
 * the route's own `tunggu` (or `Retry-After`), which is counted identically
 * whether or not the account exists (§2.2, §2.3).
 */

export type Gagal<R extends Rute> = {
  kode: KodeRute<R> | "PUTUS";
  /** Seconds, only when the route said how long. */
  tunggu: number | null;
  /** A support reference, only when the server failed. */
  ref: string | null;
  /** PASSWORD_LEMAH's reasons. */
  alasan: AlasanPassword[];
  /** SETUP_BELUM_LENGKAP's missing steps, in the journey's order. */
  kurang: Langkah[];
};
export type Jawaban<R extends Rute, T> = ({ ok: true } & T) | ({ ok: false } & Gagal<R>);

function detik(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && /^\d+$/.test(v.trim()) ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 86_400 ? Math.ceil(n) : null;
}

/** A route's answer as a screen needs it. Pure. */
export function baca<R extends Rute, T extends object>(
  rute: R,
  status: number,
  body: unknown,
  jedaHeader: string | null = null,
): Jawaban<R, T> {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (status >= 200 && status < 300 && b.ok === true) return b as { ok: true } & T;
  const peta = STATUS[rute] as Record<string, number>;
  const dariKode = typeof b.code === "string" && b.code in peta ? b.code : null;
  const dariStatus = Object.keys(peta).find((k) => peta[k] === status) ?? null;
  const kode = (dariKode ?? dariStatus ?? "PUTUS") as KodeRute<R> | "PUTUS";
  const menunggu = /TUNGGU|DIBATASI/.test(kode);
  return {
    ok: false,
    kode,
    tunggu: menunggu ? detik(b.tunggu) ?? detik(jedaHeader) : null,
    ref: kode === "LAYANAN_TIDAK_TERSEDIA" && typeof b.ref === "string" && /^[A-Za-z0-9-]{4,40}$/.test(b.ref) ? b.ref : null,
    alasan: Array.isArray(b.alasan) ? (b.alasan.filter((a) => a === "PANJANG" || a === "BOCOR" || a === "KARAKTER") as AlasanPassword[]) : [],
    kurang: Array.isArray(b.kurang) ? LANGKAH.filter((l) => (b.kurang as unknown[]).includes(l)) : [],
  };
}

/**
 * The one request: to PINTAR's own route, same origin, never cached. A form
 * is POSTed as it is (the contract takes form data, §0); no form is a GET.
 */
export async function kirim<R extends Rute, T extends object>(rute: R, fd?: FormData): Promise<Jawaban<R, T>> {
  try {
    const r = await fetch(JALUR[rute], {
      method: fd ? "POST" : "GET",
      body: fd,
      headers: { accept: "application/json" },
      cache: "no-store",
      credentials: "same-origin",
    });
    const body = await r.json().catch(() => null);
    return baca<R, T>(rute, r.status, body, r.headers.get("retry-after"));
  } catch {
    return baca<R, T>(rute, 0, null);
  }
}

/** A place inside PINTAR, or PINTAR's front door: never another site. */
export function tujuanAman(v: unknown): string {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/";
}

/**
 * A PERMISSIVE SHAPE CHECK, as the sign-in screen's: it catches a missing `@`
 * or a truncated domain before a request goes, and refuses nothing a real
 * school address could be.
 */
export function bentukEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

/**
 * THE CODE AS A PERSON TYPES OR PASTES IT: «482 913», «482913» and «482-913»
 * are the same code. The server reads digits only (§2.2); the field keeps
 * what was typed, and this is what is shown back and counted.
 */
export function hanyaAngka(v: string): string {
  return v.replace(/\D+/g, "");
}

/** A PINTAR ID in its display form, 4 + 4 (IDENTITY-4.0 §4): «A14C D7ST». */
export function id44(id: string): string {
  return /^[0-9A-Z]{8}$/.test(id) ? `${id.slice(0, 4)} ${id.slice(4)}` : id;
}

// ─────────────────────────────────────────────────────────── the sentences
type S = (k: HleEvent) => string;

/** Each code's own sentence. A code not here is said by its family below. */
const KALIMAT: Record<string, HleEvent> = {
  EMAIL_TIDAK_SAH: "auth.err_email",
  KODE_TIDAK_COCOK: "aktifkan.kode_salah",
  MASUK_TIDAK_COCOK: "auth.pw_gagal",
  PERMINTAAN_DITOLAK: "auth.card_muat_ulang",
  BELUM_MASUK: "aktifkan.belum_masuk",
  TIDAK_BERLAKU: "aktifkan.tidak_berlaku",
  SETUP_SUDAH_SELESAI: "aktifkan.sudah_selesai",
  SETUP_BELUM_LENGKAP: "aktifkan.belum_lengkap",
  USERNAME_LENGTH: "aktifkan.kode.USERNAME_LENGTH",
  USERNAME_CHARACTERS: "aktifkan.kode.USERNAME_CHARACTERS",
  USERNAME_START: "aktifkan.kode.USERNAME_START",
  USERNAME_EMAIL_SHAPE: "aktifkan.kode.USERNAME_EMAIL_SHAPE",
  USERNAME_ID_SHAPE: "aktifkan.kode.USERNAME_ID_SHAPE",
  USERNAME_NUMBER: "aktifkan.kode.USERNAME_NUMBER",
  USERNAME_RESERVED: "aktifkan.kode.USERNAME_RESERVED",
  USERNAME_TAKEN: "aktifkan.kode.USERNAME_TAKEN",
  USERNAME_ALREADY_SET: "aktifkan.kode.USERNAME_ALREADY_SET",
  PASSWORD_TERLALU_PANJANG: "aktifkan.kode.PASSWORD_TERLALU_PANJANG",
  PIN_FORMAT: "aktifkan.kode.PIN_FORMAT",
  PIN_REPEATED: "aktifkan.kode.PIN_REPEATED",
  PIN_SEQUENCE: "aktifkan.kode.PIN_SEQUENCE",
  PIN_PATTERN: "aktifkan.kode.PIN_PATTERN",
  PIN_KEYPAD: "aktifkan.kode.PIN_KEYPAD",
  PIN_YEAR: "aktifkan.kode.PIN_YEAR",
  PIN_COMMON: "aktifkan.kode.PIN_COMMON",
  PIN_ALREADY_SET: "aktifkan.kode.PIN_ALREADY_SET",
  PIN_REUSED: "aktifkan.kode.PIN_REUSED",
  NAMA_TIDAK_SAH: "aktifkan.kode.NAMA_TIDAK_SAH",
  NAMA_SUDAH_DIKONFIRMASI: "aktifkan.kode.NAMA_SUDAH_DIKONFIRMASI",
};
/** PASSWORD_LEMAH says each reason the route gave, in this order. */
const ALASAN: Record<AlasanPassword, HleEvent> = {
  PANJANG: "aktifkan.kode.PASSWORD_LEMAH.PANJANG",
  BOCOR: "aktifkan.kode.PASSWORD_LEMAH.BOCOR",
  KARAKTER: "aktifkan.kode.PASSWORD_LEMAH.KARAKTER",
};

/** The wait, as the route gave it; "a moment" when it gave none. Never invented. */
export function kalimatTunggu(tunggu: number | null, s: S, locale: Locale): string {
  return tunggu !== null
    ? `${s("auth.card_tunggu")} ${format.durasi(tunggu, locale)}${s("auth.card_lalu_coba")}`
    : s("auth.card_tunggu_sebentar");
}

/** A waiting answer is a note, not an error: nothing the person typed was judged. */
export function menunggu(g: { kode: string }): boolean {
  return /TUNGGU|DIBATASI/.test(g.kode);
}

/** The sentence for a refusal, in the reader's language. Only these keys, only these parts. */
export function kalimat<R extends Rute>(g: Gagal<R>, s: S, locale: Locale): string {
  const kode = g.kode as string;
  if (kode === "PASSWORD_LEMAH") {
    const sebab = g.alasan.length ? g.alasan : (["PANJANG"] as AlasanPassword[]);
    return sebab.map((a) => s(ALASAN[a])).join(" ");
  }
  if (kode === "KODE_TUNGGU") return `${s("aktifkan.kode_sering")} ${kalimatTunggu(g.tunggu, s, locale)}`;
  if (kode === "MASUK_TUNGGU") return `${s("auth.pw_sering")} ${kalimatTunggu(g.tunggu, s, locale)}`;
  if (/DIBATASI$/.test(kode)) return `${s("aktifkan.ramai")} ${kalimatTunggu(g.tunggu, s, locale)}`;
  if (kode === "LAYANAN_TIDAK_TERSEDIA") {
    return g.ref
      ? `${s("aktifkan.tidak_tersedia")} ${s("aktifkan.rujukan_arti")} ${s("auth.card_rujukan")}: ${g.ref}.`
      : s("aktifkan.tidak_tersedia");
  }
  if (kode in KALIMAT) return s(KALIMAT[kode]);
  return s("auth.card_putus");
}
