/**
 * BOB-26's CONTRACT, AS DAISY-20's SCREENS READ IT.
 *
 * A TRANSCRIPTION, AND A TEMPORARY ONE. BOB-26 published its contract before
 * its build (docs/coordination/handover/BOB-26-CONTRACT.md, Bob's lane,
 * 8b3e3d5) so the screens could start. The contract ships its typed form as
 * `src/lib/aktivasi-kontrak.ts`; until that file lands, this one holds what
 * the screens need from §0–§5 — the paths, each route's codes and statuses,
 * and the data shapes — and nothing in DAISY-20 restates a code anywhere
 * else. When BOB-26's build is merged, this file becomes a re-export of his
 * and every screen keeps compiling against the contract's own names.
 *
 * The codes are the contract (D-011); the words are the screens' (D-014).
 */

/** Where each request goes (§1). Signed-out doors are rewritten by the proxy. */
export const JALUR = {
  kode: "/aktifkan/kode",
  verifikasi: "/aktifkan/verifikasi",
  masukPassword: "/masuk/password",
  keadaan: "/api/aktifkan/keadaan",
  username: "/api/aktifkan/username",
  password: "/api/aktifkan/password",
  pin: "/api/aktifkan/pin",
  nama: "/api/aktifkan/nama",
  selesai: "/api/aktifkan/selesai",
  kartu: "/api/akun/kartu",
  kirimKartu: "/api/akun/kartu/kirim",
} as const;

/** Every route may answer these (§0). */
const UMUM = { PERMINTAAN_DITOLAK: 403, LAYANAN_TIDAK_TERSEDIA: 503 } as const;
/** Every wizard route may answer these as well as its own (§3). */
const WIZARD = { ...UMUM, BELUM_MASUK: 401, TIDAK_BERLAKU: 403, SETUP_SUDAH_SELESAI: 409 } as const;

/** Each route's codes and their HTTP statuses (§2–§4). */
export const STATUS = {
  kode: { ...UMUM, EMAIL_TIDAK_SAH: 400 },
  verifikasi: { ...UMUM, KODE_TIDAK_COCOK: 400, KODE_TUNGGU: 429, KODE_DIBATASI: 429 },
  masukPassword: { ...UMUM, MASUK_TIDAK_COCOK: 401, MASUK_TUNGGU: 429, MASUK_DIBATASI: 429 },
  keadaan: { ...UMUM, BELUM_MASUK: 401 },
  username: {
    ...WIZARD,
    USERNAME_LENGTH: 422, USERNAME_CHARACTERS: 422, USERNAME_START: 422, USERNAME_EMAIL_SHAPE: 422,
    USERNAME_ID_SHAPE: 422, USERNAME_NUMBER: 422, USERNAME_RESERVED: 422,
    USERNAME_TAKEN: 409, USERNAME_ALREADY_SET: 409,
  },
  password: { ...WIZARD, PASSWORD_LEMAH: 422, PASSWORD_TERLALU_PANJANG: 422 },
  pin: {
    ...WIZARD,
    PIN_FORMAT: 422, PIN_REPEATED: 422, PIN_SEQUENCE: 422, PIN_PATTERN: 422, PIN_KEYPAD: 422, PIN_YEAR: 422, PIN_COMMON: 422,
    PIN_ALREADY_SET: 409, PIN_REUSED: 409,
  },
  nama: { ...WIZARD, NAMA_TIDAK_SAH: 422, NAMA_SUDAH_DIKONFIRMASI: 409 },
  selesai: { ...WIZARD, SETUP_BELUM_LENGKAP: 409 },
  kartu: { ...UMUM, BELUM_MASUK: 401, TIDAK_BERLAKU: 403 },
  kirimKartu: { ...UMUM, BELUM_MASUK: 401, TIDAK_BERLAKU: 403 },
} as const;
export type Rute = keyof typeof STATUS;
/** A route's own codes; distributes over a union of routes, so a sentence reader takes any. */
export type KodeRute<R extends Rute> = R extends Rute ? keyof (typeof STATUS)[R] & string : never;

/** The steps, in the journey's order (D-054(b), D-077). */
export const LANGKAH = ["USERNAME", "PASSWORD", "PIN", "NAMA"] as const;
export type Langkah = (typeof LANGKAH)[number];

/** §5: the password policy, from the one canonical setting. */
export type AturanPassword = {
  panjangMin: number;
  karakterWajib: ("HURUF_KECIL" | "HURUF_BESAR" | "ANGKA" | "SIMBOL")[];
  cekBocor: boolean;
  panjangMaks: 72;
};
/** Why a password was refused (§3.3). */
export type AlasanPassword = "PANJANG" | "BOCOR" | "KARAKTER";

/** §3.1: where the wizard stands. */
export type KeadaanAktivasi = {
  ok: true;
  keadaan: "REQUIRED" | "COMPLETE" | "NOT_APPLICABLE";
  berikutnya: Langkah | "SELESAI" | null;
  langkah: {
    username: string | null;
    password: boolean;
    pin: boolean;
    nama: { nama: string; dikonfirmasi: boolean };
  };
  /** An active staff role; false for a learner-only email account (C17). */
  staf: boolean;
  /** Only when `staf`; displayed 4 + 4. */
  pintarId: string | null;
  aturanPassword: AturanPassword;
  berlakuMenit: number;
};

/** §3.6 and §4: what became of the card email. */
export type StatusKartu = "TERKIRIM" | "BELUM_TERKIRIM" | "TIDAK_ADA";

/** The staff roles a card may state (§4). A statement, never authority (D-059). */
export type PeranKartu = "SYSTEM_ADMIN" | "INSTITUTION_ADMIN" | "DEAN" | "HEAD_OF_DEPARTMENT" | "EDUCATOR";

/** §4: the card's data, read at render time from current records. */
export type DataKartu = {
  nama: string;
  pintarId: string;
  /** What the QR encodes: `${origin}/id/${pintarId}`. */
  tautanId: string;
  konteks: { peran: PeranKartu; institusi: string | null }[];
};

/** §5: the two identity emails' data (`src/lib/email/identitas.ts` in BOB-26's build). */
export type DataEmailKode = { kode: string; berlakuMenit: number; nama: string };
export type DataEmailKartu = DataKartu & { tautanAkun: string };

/**
 * §2.3: the magic link stays on /masuk as a fallback behind this one switch
 * until C14 turns it off, in the release where activation, password sign-in,
 * email recovery and the transition all work.
 */
export const TAUTAN_MASUK_CADANGAN = true;
