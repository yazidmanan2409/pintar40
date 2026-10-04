import type { DataKartu } from "@/lib/aktivasi-kontrak";

/**
 * BOB-26 (D-079(a)): THE DATA GATE 3'S EMAILS CARRY. Bob's half of each email:
 * the shape and the values, never markup or copy. The templates that render
 * them are src/components/email/identitas.ts (DAISY-20's), each a Templat<D>
 * of src/lib/email/templat.ts.
 */

/** KODE_AKTIVASI and KODE_ULANG. */
export type DataEmailKode = {
  /** the code as issued, digits only; the template spaces it for reading */
  kode: string;
  /**
   * How long it is valid, in minutes: the canonical `mailer_otp_exp`
   * (supabase/auth-identitas.json, D-079 addendum), never a number typed into
   * a template.
   */
  berlakuMenit: number;
  /** the person's current name */
  nama: string;
};

/** KARTU_DIGITAL: the card's data (read at send time, D-059) and where Akun saya is. */
export type DataEmailKartu = DataKartu & { tautanAkun: string };

/** PASSWORD_DIUBAH (BOB-27, D-055(f)): the owner is told their password changed, when, and that every session ended. */
export type DataEmailPasswordDiubah = {
  nama: string;
  /** when the password changed, ISO; the template says it in the school's time zone */
  waktu: string;
  /** where to start a recovery if it was not them */
  tautanLupa: string;
};
