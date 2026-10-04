import type { AlasanPasswordLemah, AturanPassword } from "@/lib/pengaturan-auth";

/**
 * BOB-26 (Gate 3): WHAT ACTIVATION, PASSWORD SIGN-IN AND AKUN SAYA'S CARD
 * ANSWER. The codes are the contract (D-011); the words are the screens'
 * (DAISY-20). The whole contract, with each route's fields, is
 * docs/coordination/handover/BOB-26-CONTRACT.md.
 *
 * Every answer is JSON, `no-store`: `{ ok: true, ... }` or
 * `{ ok: false, code, ... }` with the status below. No code separates an
 * address or username that exists from one that does not.
 */

/** The wizard's page (DAISY-20). The proxy holds a set-up REQUIRED session here. */
export const HALAMAN_AKTIVASI = "/aktifkan";

/**
 * C14's switch: the everyday magic link stayed on /masuk as a fallback until
 * activation, password sign-in, email recovery and the existing-staff
 * transition all worked. OFF since Gate 4 (BOB-27): «Lupa password?» is the
 * email recovery at HALAMAN_PEMULIHAN, an existing staff member who never
 * activated uses «Aktifkan akun», and `sendMagicLink` sends nothing. The
 * callback stays (C14: what is still technically needed stays).
 */
export const TAUTAN_MASUK_CADANGAN = false;

// ─────────────────────────────────────────────── shared by every route
export const STATUS_UMUM = {
  PERMINTAAN_DITOLAK: 403,
  LAYANAN_TIDAK_TERSEDIA: 503,
} as const;

// ─────────────────────────────────────────── POST /aktifkan/kode (signed out)
// D-098(c): two waits PINTAR knows BEFORE it answers, the same for every
// address: EMAIL_TUNGGU (PINTAR cannot send email now: its hourly limit is full
// or the mail server just refused) and MINTA_KODE_TUNGGU (codes were asked for
// this address too often, counted for every address, existing or not). Each
// carries `tunggu`, and with either no code is sent.
export const STATUS_MINTA_KODE = { ...STATUS_UMUM, EMAIL_TIDAK_SAH: 400, MINTA_KODE_TUNGGU: 429, EMAIL_TUNGGU: 503 } as const;
export type KodeMintaKode = keyof typeof STATUS_MINTA_KODE;
export type JawabanMintaKode =
  | { ok: true; kirimUlangDalam: number; berlakuMenit: number }
  | { ok: false; code: KodeMintaKode; tunggu?: number; ref?: string };

// ─────────────────────────────────── POST /aktifkan/periksa (signed out)
export const STATUS_VERIFIKASI = {
  ...STATUS_UMUM,
  KODE_TIDAK_COCOK: 400,
  KODE_TUNGGU: 429,
  KODE_DIBATASI: 429,
} as const;
export type KodeVerifikasi = keyof typeof STATUS_VERIFIKASI;
export type JawabanVerifikasi =
  | { ok: true; tujuan: string }
  | { ok: false; code: KodeVerifikasi; tunggu?: number; ref?: string };

// ─────────────────────────────────────── POST /masuk/password (signed out)
export const STATUS_MASUK_PASSWORD = {
  ...STATUS_UMUM,
  MASUK_TIDAK_COCOK: 401,
  MASUK_TUNGGU: 429,
  MASUK_DIBATASI: 429,
} as const;
export type KodeMasukPassword = keyof typeof STATUS_MASUK_PASSWORD;
export type JawabanMasukPassword =
  | { ok: true; tujuan: string }
  | { ok: false; code: KodeMasukPassword; tunggu?: number; ref?: string };

// ───────────────────────────────────────────────────── the wizard (signed in)
export const STATUS_WIZARD = {
  ...STATUS_UMUM,
  BELUM_MASUK: 401,
  TIDAK_BERLAKU: 403,
  SETUP_SUDAH_SELESAI: 409,
} as const;

export const KODE_USERNAME_TOLAK = [
  "USERNAME_LENGTH", "USERNAME_CHARACTERS", "USERNAME_START", "USERNAME_EMAIL_SHAPE",
  "USERNAME_ID_SHAPE", "USERNAME_NUMBER", "USERNAME_RESERVED",
] as const;
export const KODE_PIN_TOLAK = ["PIN_FORMAT", "PIN_REPEATED", "PIN_SEQUENCE", "PIN_PATTERN", "PIN_KEYPAD", "PIN_YEAR", "PIN_COMMON"] as const;

export const STATUS_USERNAME = {
  ...STATUS_WIZARD,
  ...Object.fromEntries(KODE_USERNAME_TOLAK.map((k) => [k, 422])) as Record<(typeof KODE_USERNAME_TOLAK)[number], 422>,
  USERNAME_TAKEN: 409,
  USERNAME_ALREADY_SET: 409,
} as const;
export const STATUS_PASSWORD = { ...STATUS_WIZARD, PASSWORD_LEMAH: 422, PASSWORD_TERLALU_PANJANG: 422 } as const;
export const STATUS_PIN = {
  ...STATUS_WIZARD,
  ...Object.fromEntries(KODE_PIN_TOLAK.map((k) => [k, 422])) as Record<(typeof KODE_PIN_TOLAK)[number], 422>,
  PIN_ALREADY_SET: 409,
  PIN_REUSED: 409,
} as const;
export const STATUS_NAMA = { ...STATUS_WIZARD, NAMA_TIDAK_SAH: 422, NAMA_SUDAH_DIKONFIRMASI: 409 } as const;
export const STATUS_SELESAI = { ...STATUS_WIZARD, SETUP_BELUM_LENGKAP: 409 } as const;

export type KodeUsername = keyof typeof STATUS_USERNAME;
export type KodePassword = keyof typeof STATUS_PASSWORD;
export type KodePin = keyof typeof STATUS_PIN;
export type KodeNama = keyof typeof STATUS_NAMA;
export type KodeSelesai = keyof typeof STATUS_SELESAI;

export type LangkahAktivasi = "USERNAME" | "PASSWORD" | "PIN" | "NAMA";
export const URUTAN_LANGKAH: readonly LangkahAktivasi[] = ["USERNAME", "PASSWORD", "PIN", "NAMA"];

export type KeadaanAktivasi = {
  ok: true;
  keadaan: "REQUIRED" | "COMPLETE" | "NOT_APPLICABLE";
  berikutnya: LangkahAktivasi | "SELESAI" | null;
  langkah: {
    username: string | null;
    password: boolean;
    pin: boolean;
    nama: { nama: string; dikonfirmasi: boolean };
  } | null;
  staf: boolean;
  pintarId: string | null;
  aturanPassword: AturanPassword;
  berlakuMenit: number;
};

export type JawabanUsername = { ok: true; username: string } | { ok: false; code: KodeUsername; ref?: string };
export type JawabanPassword = { ok: true } | { ok: false; code: KodePassword; alasan?: AlasanPasswordLemah[]; ref?: string };
export type JawabanPin = { ok: true } | { ok: false; code: KodePin; ref?: string };
export type JawabanNama = { ok: true; nama: string; diubah: boolean } | { ok: false; code: KodeNama; ref?: string };
export type StatusKartuEmail = "TERKIRIM" | "BELUM_TERKIRIM" | "TIDAK_ADA";
export type JawabanSelesai =
  | { ok: true; tujuan: string; kartu: StatusKartuEmail }
  | { ok: false; code: KodeSelesai; kurang?: LangkahAktivasi[]; ref?: string };

// ─────────────────────── «Lupa password?» (BOB-27, Gate 4), signed out
/** The recovery page: email or username → code → new password. */
export const HALAMAN_PEMULIHAN = "/masuk/lupa";
/** A checked recovery code's grant, held by the browser (httpOnly, ten minutes, single use). */
export const COOKIE_PEMULIHAN = "pintar_pulih";

// POST /masuk/lupa/kode: the same answer for every name, D-098(c)'s waits first
export const STATUS_LUPA_KODE = { ...STATUS_UMUM, IDENTITAS_KOSONG: 400, MINTA_KODE_TUNGGU: 429, EMAIL_TUNGGU: 503 } as const;
export type KodeLupaKode = keyof typeof STATUS_LUPA_KODE;
export type JawabanLupaKode =
  | { ok: true; kirimUlangDalam: number; berlakuMenit: number }
  | { ok: false; code: KodeLupaKode; tunggu?: number; ref?: string };

// POST /masuk/lupa/periksa: a match signs nobody in; it gives the grant
export const STATUS_LUPA_PERIKSA = { ...STATUS_UMUM, KODE_TIDAK_COCOK: 400, KODE_TUNGGU: 429, KODE_DIBATASI: 429 } as const;
export type KodeLupaPeriksa = keyof typeof STATUS_LUPA_PERIKSA;
export type JawabanLupaPeriksa = { ok: true } | { ok: false; code: KodeLupaPeriksa; tunggu?: number; ref?: string };

// POST /masuk/lupa/password: the new password, with the grant
export const STATUS_LUPA_PASSWORD = { ...STATUS_UMUM, PEMULIHAN_BERAKHIR: 410, PASSWORD_LEMAH: 422, PASSWORD_TERLALU_PANJANG: 422 } as const;
export type KodeLupaPassword = keyof typeof STATUS_LUPA_PASSWORD;
export type JawabanLupaPassword =
  | { ok: true; tujuan: string }
  | { ok: false; code: KodeLupaPassword; alasan?: AlasanPasswordLemah[]; ref?: string };

// ─────────────────────────────────────────────────────────── Akun saya's card
export type PeranKartu = "SYSTEM_ADMIN" | "INSTITUTION_ADMIN" | "DEAN" | "HEAD_OF_DEPARTMENT" | "EDUCATOR";
export type DataKartu = {
  nama: string;
  pintarId: string;
  /** what the QR encodes: the public ID page (IDENTITY-4.0 §5; the page is Gate 5) */
  tautanId: string;
  konteks: { peran: PeranKartu; institusi: string | null }[];
};
export const STATUS_KARTU_AKUN = { ...STATUS_UMUM, BELUM_MASUK: 401, TIDAK_BERLAKU: 403 } as const;
export type KodeKartuAkun = keyof typeof STATUS_KARTU_AKUN;
export type JawabanKartu = { ok: true; kartu: DataKartu } | { ok: false; code: KodeKartuAkun; ref?: string };
export type JawabanKirimKartu =
  | { ok: true; kartu: "TERKIRIM" | "BELUM_TERKIRIM"; tunggu?: number }
  | { ok: false; code: KodeKartuAkun; ref?: string };

/** The PINTAR ID as people read it: 4+4 ("A14C D7ST"). */
export function tampilPintarId(id: string): string {
  return id.length === 8 ? `${id.slice(0, 4)} ${id.slice(4)}` : id;
}

/**
 * A route's answer, read without trusting it: anything that is not one of
 * that route's own shapes is the general unavailable answer. The screens use
 * these instead of reading JSON themselves.
 */
function baca<T extends { ok: boolean }>(status: Record<string, number>, isi: unknown, sah: (o: Record<string, unknown>) => boolean): T {
  const o = (isi && typeof isi === "object" ? isi : {}) as Record<string, unknown>;
  if (o.ok === true && sah(o)) return o as T;
  if (o.ok === false && typeof o.code === "string" && o.code in status) {
    const hasil: Record<string, unknown> = { ok: false, code: o.code };
    if (typeof o.tunggu === "number" && o.tunggu > 0) hasil.tunggu = Math.ceil(o.tunggu);
    if (typeof o.ref === "string" && /^[A-Z0-9]{6}$/.test(o.ref)) hasil.ref = o.ref;
    if (Array.isArray(o.alasan)) hasil.alasan = o.alasan.filter((a) => a === "PANJANG" || a === "KARAKTER" || a === "BOCOR");
    if (Array.isArray(o.kurang)) hasil.kurang = o.kurang.filter((a) => (URUTAN_LANGKAH as readonly unknown[]).includes(a));
    return hasil as T;
  }
  return { ok: false, code: "LAYANAN_TIDAK_TERSEDIA" } as unknown as T;
}
const tujuanSah = (o: Record<string, unknown>) => typeof o.tujuan === "string" && o.tujuan.startsWith("/") && !o.tujuan.startsWith("//");

export const bacaJawabanMintaKode = (isi: unknown) => baca<JawabanMintaKode>(STATUS_MINTA_KODE, isi,
  (o) => typeof o.kirimUlangDalam === "number" && typeof o.berlakuMenit === "number");
export const bacaJawabanVerifikasi = (isi: unknown) => baca<JawabanVerifikasi>(STATUS_VERIFIKASI, isi, tujuanSah);
export const bacaJawabanMasukPassword = (isi: unknown) => baca<JawabanMasukPassword>(STATUS_MASUK_PASSWORD, isi, tujuanSah);
export const bacaJawabanLupaKode = (isi: unknown) => baca<JawabanLupaKode>(STATUS_LUPA_KODE, isi,
  (o) => typeof o.kirimUlangDalam === "number" && typeof o.berlakuMenit === "number");
export const bacaJawabanLupaPeriksa = (isi: unknown) => baca<JawabanLupaPeriksa>(STATUS_LUPA_PERIKSA, isi, () => true);
export const bacaJawabanLupaPassword = (isi: unknown) => baca<JawabanLupaPassword>(STATUS_LUPA_PASSWORD, isi, tujuanSah);
export const bacaJawabanUsername = (isi: unknown) => baca<JawabanUsername>(STATUS_USERNAME, isi, (o) => typeof o.username === "string");
export const bacaJawabanPassword = (isi: unknown) => baca<JawabanPassword>(STATUS_PASSWORD, isi, () => true);
export const bacaJawabanPin = (isi: unknown) => baca<JawabanPin>(STATUS_PIN, isi, () => true);
export const bacaJawabanNama = (isi: unknown) => baca<JawabanNama>(STATUS_NAMA, isi, (o) => typeof o.nama === "string");
export const bacaJawabanSelesai = (isi: unknown) => baca<JawabanSelesai>(STATUS_SELESAI, isi,
  (o) => tujuanSah(o) && (o.kartu === "TERKIRIM" || o.kartu === "BELUM_TERKIRIM" || o.kartu === "TIDAK_ADA"));
export const bacaJawabanKartu = (isi: unknown) => baca<JawabanKartu>(STATUS_KARTU_AKUN, isi,
  (o) => !!o.kartu && typeof (o.kartu as Record<string, unknown>).pintarId === "string");
export const bacaJawabanKirimKartu = (isi: unknown) => baca<JawabanKirimKartu>(STATUS_KARTU_AKUN, isi,
  (o) => o.kartu === "TERKIRIM" || o.kartu === "BELUM_TERKIRIM");
