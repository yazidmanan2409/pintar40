import KANONIK from "../../supabase/auth-identitas.json";

/**
 * BOB-26 (D-079 addendum): THE CODE'S VALIDITY AND THE PASSWORD RULES, READ
 * FROM THE ONE CANONICAL SETTING (supabase/auth-identitas.json).
 *
 * The same file sets Auth's `mailer_otp_exp` and password policy (staging.yml
 * writes it, identity-facts.yml fails on drift, config.toml mirrors it for the
 * local stack). So «berlaku selama N menit» and the rules a screen shows can
 * never drift from what Auth enforces: nothing here is typed twice.
 *
 * No secret, no environment: a browser component may import it.
 */

export type PengaturanIdentitas = {
  mailer_otp_length: number;
  mailer_otp_exp: number;
  password_min_length: number;
  password_required_characters: string;
  password_hibp_enabled: boolean;
};

export type KarakterWajib = "HURUF_KECIL" | "HURUF_BESAR" | "ANGKA" | "SIMBOL";

export type AturanPassword = {
  panjangMin: number;
  karakterWajib: KarakterWajib[];
  cekBocor: boolean;
  /** bcrypt reads 72 bytes and no more, so a longer password would be silently cut */
  panjangMaks: 72;
};

export type AlasanPasswordLemah = "PANJANG" | "KARAKTER" | "BOCOR";

const PERANGKAT: Record<string, KarakterWajib> = {
  abcdefghijklmnopqrstuvwxyz: "HURUF_KECIL",
  ABCDEFGHIJKLMNOPQRSTUVWXYZ: "HURUF_BESAR",
  "0123456789": "ANGKA",
};

/** Auth's `password_required_characters`: groups separated by ":", one character of each group required. */
export function karakterWajibDari(teks: string): KarakterWajib[] {
  if (!teks) return [];
  const hasil: KarakterWajib[] = [];
  for (const kelompok of teks.split(":")) {
    const huruf = /[a-z]/.test(kelompok), besar = /[A-Z]/.test(kelompok), angka = /[0-9]/.test(kelompok);
    if (PERANGKAT[kelompok]) hasil.push(PERANGKAT[kelompok]);
    else if (huruf && besar && angka) hasil.push("HURUF_KECIL", "HURUF_BESAR", "ANGKA");
    else if (!huruf && !besar && !angka && kelompok) hasil.push("SIMBOL");
    else throw new Error(`auth-identitas.json: a required-character group PINTAR does not read: ${kelompok}`);
  }
  return [...new Set(hasil)];
}

export function bacaPengaturan(sumber: { settings: PengaturanIdentitas } = KANONIK): {
  panjangKode: number;
  berlakuDetik: number;
  berlakuMenit: number;
  aturanPassword: AturanPassword;
} {
  const s = sumber.settings;
  if (!Number.isInteger(s.mailer_otp_exp) || s.mailer_otp_exp < 60 || s.mailer_otp_exp % 60 !== 0) {
    throw new Error("auth-identitas.json: mailer_otp_exp is whole minutes, at least one");
  }
  return {
    panjangKode: s.mailer_otp_length,
    berlakuDetik: s.mailer_otp_exp,
    berlakuMenit: s.mailer_otp_exp / 60,
    aturanPassword: {
      panjangMin: s.password_min_length,
      karakterWajib: karakterWajibDari(s.password_required_characters),
      cekBocor: s.password_hibp_enabled,
      panjangMaks: 72,
    },
  };
}

export const PENGATURAN = bacaPengaturan();

/**
 * The rules PINTAR can check itself, before Auth is asked: length and the
 * required kinds. The leaked-password check is Auth's (it answers
 * `weak_password` with reason `pwned`), so `BOCOR` comes from there.
 */
export function periksaPassword(password: string, aturan: AturanPassword = PENGATURAN.aturanPassword):
  { alasan: AlasanPasswordLemah[]; terlaluPanjang: boolean } {
  const alasan: AlasanPasswordLemah[] = [];
  if ([...password].length < aturan.panjangMin) alasan.push("PANJANG");
  const ada: Record<KarakterWajib, boolean> = {
    HURUF_KECIL: /[a-z]/.test(password),
    HURUF_BESAR: /[A-Z]/.test(password),
    ANGKA: /[0-9]/.test(password),
    SIMBOL: /[^A-Za-z0-9]/.test(password),
  };
  if (aturan.karakterWajib.some((k) => !ada[k])) alasan.push("KARAKTER");
  return { alasan, terlaluPanjang: new TextEncoder().encode(password).length > aturan.panjangMaks };
}
