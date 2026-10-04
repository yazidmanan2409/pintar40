/**
 * BOB-26's CONTRACT, AS DAISY-20's SCREENS READ IT.
 *
 * The contract is `src/lib/aktivasi-kontrak.ts` (BOB-26), and every code,
 * status, answer shape and reader comes from there: nothing here restates one.
 * This module adds only what the screens need that the contract file does not
 * export — where each request goes (the paths of BOB-26-CONTRACT.md §1, with
 * the code check at /aktifkan/periksa, INV-38) — and names each route's status
 * table under one key so the sentence reader can take any of them.
 *
 * The codes are the contract (D-011); the words are the screens' (D-014).
 */
import {
  STATUS_KARTU_AKUN, STATUS_LUPA_KODE, STATUS_LUPA_PASSWORD, STATUS_LUPA_PERIKSA, STATUS_LUPA_PIN, STATUS_MASUK_PASSWORD,
  STATUS_MINTA_KODE, STATUS_NAMA, STATUS_PASSWORD, STATUS_PIN, STATUS_PIN_BARU, STATUS_SELESAI, STATUS_USERNAME,
  STATUS_VERIFIKASI, STATUS_WIZARD,
} from "@/lib/aktivasi-kontrak";

export {
  TAUTAN_MASUK_CADANGAN, HALAMAN_AKTIVASI, HALAMAN_PEMULIHAN, URUTAN_LANGKAH as LANGKAH,
  type KeadaanAktivasi, type DataKartu, type PeranKartu,
  type LangkahAktivasi as Langkah, type StatusKartuEmail as StatusKartu,
} from "@/lib/aktivasi-kontrak";
export type { AturanPassword, AlasanPasswordLemah as AlasanPassword } from "@/lib/pengaturan-auth";
export type { DataEmailKode, DataEmailKartu } from "@/lib/email/identitas";

/** Where each request goes (§1). The signed-out doors are rewritten by the proxy. */
export const JALUR = {
  kode: "/aktifkan/kode",
  periksa: "/aktifkan/periksa",
  masukPassword: "/masuk/password",
  keadaan: "/api/aktifkan/keadaan",
  username: "/api/aktifkan/username",
  password: "/api/aktifkan/password",
  pin: "/api/aktifkan/pin",
  nama: "/api/aktifkan/nama",
  selesai: "/api/aktifkan/selesai",
  kartu: "/api/akun/kartu",
  kirimKartu: "/api/akun/kartu/kirim",
  // BOB-27 (Gate 4): «Lupa password?», signed out, rewritten by next.config.ts
  lupaKode: "/masuk/lupa/kode",
  lupaPeriksa: "/masuk/lupa/periksa",
  lupaPassword: "/masuk/lupa/password",
  // BOB-28 (Gate 5): recovery by PINTAR ID + PIN, signed out; and a new PIN, signed in
  lupaPin: "/masuk/lupa/pin",
  pinBaru: "/api/akun/pin",
} as const;

/** Each route's own status table, the contract's, under the route's key. */
export const STATUS = {
  kode: STATUS_MINTA_KODE,
  periksa: STATUS_VERIFIKASI,
  masukPassword: STATUS_MASUK_PASSWORD,
  keadaan: STATUS_WIZARD,
  username: STATUS_USERNAME,
  password: STATUS_PASSWORD,
  pin: STATUS_PIN,
  nama: STATUS_NAMA,
  selesai: STATUS_SELESAI,
  kartu: STATUS_KARTU_AKUN,
  kirimKartu: STATUS_KARTU_AKUN,
  lupaKode: STATUS_LUPA_KODE,
  lupaPeriksa: STATUS_LUPA_PERIKSA,
  lupaPassword: STATUS_LUPA_PASSWORD,
  lupaPin: STATUS_LUPA_PIN,
  pinBaru: STATUS_PIN_BARU,
} as const;
export type Rute = keyof typeof STATUS;
/** A route's own codes; distributes over a union of routes, so a sentence reader takes any. */
export type KodeRute<R extends Rute> = R extends Rute ? keyof (typeof STATUS)[R] & string : never;
