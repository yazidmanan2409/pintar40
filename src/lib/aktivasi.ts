import "server-only";
import { kunciIdentitas } from "@/lib/card";
import { rujukan } from "@/lib/galat-kontrak";
import { detikJeda, jenisGalatAuth, type GalatAuth } from "@/lib/kartu-masuk";
import { PENGATURAN } from "@/lib/pengaturan-auth";
import {
  HALAMAN_AKTIVASI,
  STATUS_MASUK_PASSWORD,
  STATUS_MINTA_KODE,
  STATUS_VERIFIKASI,
  type JawabanMasukPassword,
  type JawabanMintaKode,
  type JawabanVerifikasi,
  type KodeMasukPassword,
  type KodeMintaKode,
  type KodeVerifikasi,
} from "@/lib/aktivasi-kontrak";

/**
 * BOB-26 (Gate 3): THE SIGNED-OUT HALF, decided here and wired in
 * src/app/api/aktifkan/{kode,verifikasi} and src/app/api/masuk/password. Every
 * outside call is passed in, so each decision can be driven by a test, as
 * BOB-12's card sign-in is (src/lib/kartu-masuk.ts).
 *
 * ONE RULE FOR ALL THREE: nothing a signed-out visitor sees separates an
 * address or a username that exists from one that does not (C1, C3, C9, D2).
 */

export type Hasil<B> = { status: number; body: B; retryAfter?: number };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PANJANG_MAKS = 320;

export function normalisasiEmail(v: unknown): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

/** The code as typed or pasted: digits only, so «482 913», «482913» and «482-913» are one (the row's acceptance). */
export function angkaKode(v: unknown): string {
  return typeof v === "string" ? v.replace(/\D/g, "") : "";
}

function gagal<K extends string, B>(status: Record<K, number>, code: K, extra: { tunggu?: number; ref?: string } = {}): Hasil<B> {
  return { status: status[code], body: { ok: false, code, ...extra } as B, ...(extra.tunggu ? { retryAfter: extra.tunggu } : {}) };
}

// ═══════════════════════════════════════════════════ asking for a code
export type AlatMintaKode = {
  /** activation_code_target: the account and name to send to, or null (no such REQUIRED account). Throws when the database cannot be asked. */
  sasaran(email: string): Promise<{ authUserId: string; nama: string } | null>;
  /** email_resend_seconds */
  jedaKirimUlang(): Promise<number>;
  /**
   * D-098(c): email_sending_wait, seconds until PINTAR can send at all (0 = now): the GLOBAL limit or a
   * recent refusal by the host, never anything about an address. Throws when it cannot be asked, or when
   * the sending settings are missing (a code could never be sent).
   */
  jedaPengiriman(): Promise<number>;
  /** D-098(c): code_request_pace on the keyed hash, seconds to wait (0 = counted, go ahead). Every address alike. */
  catatPermintaan(kunci: string): Promise<number>;
  /** issue the code and send it; runs after the answer has gone. Never throws into the answer. */
  kirim(sasaran: { authUserId: string; nama: string }, ulang: boolean): Promise<void>;
  /** schedule work after the response (Next's after()); a test runs it inline */
  nanti(kerja: () => Promise<void>): void;
  catatGalat(ref: string, apa: string): void;
};

export async function mintaKode(
  masukan: { origin: boolean; email: unknown; ulang: unknown },
  alat: AlatMintaKode,
): Promise<Hasil<JawabanMintaKode>> {
  if (!masukan.origin) return gagal<KodeMintaKode, JawabanMintaKode>(STATUS_MINTA_KODE, "PERMINTAAN_DITOLAK");
  const email = normalisasiEmail(masukan.email);
  if (!email || email.length > PANJANG_MAKS || !EMAIL.test(email)) {
    return gagal<KodeMintaKode, JawabanMintaKode>(STATUS_MINTA_KODE, "EMAIL_TIDAK_SAH");
  }
  // D-098(c): WHAT PINTAR KNOWS BEFORE IT ANSWERS, IT SAYS, and the same for every address. If it cannot send
  // now, or codes were asked for this address too often, nobody is told a code is coming and nothing is sent.
  // Both are asked before the lookup, so neither can depend on whether the address has an account.
  let tungguKirim: number;
  let tungguMinta = 0;
  try {
    tungguKirim = await alat.jedaPengiriman();
    if (tungguKirim <= 0) tungguMinta = await alat.catatPermintaan(kunciIdentitas("minta-kode", email));
  } catch (e) {
    const ref = rujukan();
    alat.catatGalat(ref, `the sending state could not be asked: ${e instanceof Error ? e.message : "unknown"}`);
    return gagal<KodeMintaKode, JawabanMintaKode>(STATUS_MINTA_KODE, "LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  if (tungguKirim > 0) return gagal<KodeMintaKode, JawabanMintaKode>(STATUS_MINTA_KODE, "EMAIL_TUNGGU", { tunggu: tungguKirim });
  if (tungguMinta > 0) return gagal<KodeMintaKode, JawabanMintaKode>(STATUS_MINTA_KODE, "MINTA_KODE_TUNGGU", { tunggu: tungguMinta });

  let sasaran: Awaited<ReturnType<AlatMintaKode["sasaran"]>>;
  let jeda: number;
  try {
    [sasaran, jeda] = await Promise.all([alat.sasaran(email), alat.jedaKirimUlang()]);
  } catch (e) {
    const ref = rujukan();
    alat.catatGalat(ref, `the activation lookup could not be asked: ${e instanceof Error ? e.message : "unknown"}`);
    return gagal<KodeMintaKode, JawabanMintaKode>(STATUS_MINTA_KODE, "LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  if (sasaran) {
    const s = sasaran;
    const ulang = masukan.ulang === "1" || masukan.ulang === true;
    alat.nanti(() => alat.kirim(s, ulang).catch((e) =>
      alat.catatGalat(rujukan(), `an activation code was not sent: ${e instanceof Error ? e.name : "unknown"}`)));
  }
  // THE SAME ANSWER FOR EVERY ADDRESS: a code is being sent if the address is a REQUIRED account. Not "has
  // been sent": the send runs after this answer, and what PINTAR learns of it (a refusal by the host) it tells
  // everybody from then on, through email_sending_wait above.
  return { status: 200, body: { ok: true, kirimUlangDalam: jeda, berlakuMenit: PENGATURAN.berlakuMenit } };
}

// ═══════════════════════════════════════════════════ typing the code
export type AlatVerifikasi = {
  /** identity_attempt('CODE_VERIFY', key): seconds to wait, 0 to go ahead */
  catat(kunci: string): Promise<number>;
  selesaikan(kunci: string, hasil: "OK" | "NOT_JUDGED"): Promise<void>;
  /** Auth's verifyOtp (type email); on a match the session cookies are set */
  verifikasi(email: string, kode: string): Promise<{ error: GalatAuth | null; jeda?: string | null }>;
  /** the signed-in person's set-up state, asked with the new session */
  keadaan(): Promise<string>;
  tujuan(lanjut: unknown): Promise<string>;
  catatGalat(ref: string, apa: string): void;
};

export async function verifikasiKode(
  masukan: { origin: boolean; email: unknown; kode: unknown },
  alat: AlatVerifikasi,
): Promise<Hasil<JawabanVerifikasi>> {
  type K = KodeVerifikasi; type B = JawabanVerifikasi;
  if (!masukan.origin) return gagal<K, B>(STATUS_VERIFIKASI, "PERMINTAAN_DITOLAK");
  const email = normalisasiEmail(masukan.email);
  const kode = angkaKode(masukan.kode);
  // A malformed address or code is a wrong code: nothing is asked and nothing counts.
  if (!EMAIL.test(email) || email.length > PANJANG_MAKS || kode.length !== PENGATURAN.panjangKode) {
    return gagal<K, B>(STATUS_VERIFIKASI, "KODE_TIDAK_COCOK");
  }
  const kunci = kunciIdentitas("kode-alamat", email);
  let tunggu: number;
  try {
    tunggu = await alat.catat(kunci);
  } catch (e) {
    const ref = rujukan();
    alat.catatGalat(ref, `the code counter could not be asked: ${e instanceof Error ? e.message : "unknown"}`);
    return gagal<K, B>(STATUS_VERIFIKASI, "LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  if (tunggu > 0) return gagal<K, B>(STATUS_VERIFIKASI, "KODE_TUNGGU", { tunggu });

  let jawaban: Awaited<ReturnType<AlatVerifikasi["verifikasi"]>>;
  try {
    jawaban = await alat.verifikasi(email, kode);
  } catch (e) {
    jawaban = { error: { name: "Unexpected", code: e instanceof Error ? e.message : "unknown" } };
  }
  if (jawaban.error) {
    const { jenis, ambilKembali } = jenisGalatAuth(jawaban.error);
    if (jenis === "TIDAK_COCOK") return gagal<K, B>(STATUS_VERIFIKASI, "KODE_TIDAK_COCOK");
    if (ambilKembali) {
      await alat.selesaikan(kunci, "NOT_JUDGED").catch(() => alat.catatGalat(rujukan(), "an unjudged code attempt was not taken back"));
    }
    if (jenis === "DIBATASI") {
      const detik = detikJeda(jawaban.jeda);
      return gagal<K, B>(STATUS_VERIFIKASI, "KODE_DIBATASI", detik ? { tunggu: detik } : {});
    }
    const ref = rujukan();
    alat.catatGalat(ref, `Auth could not verify (${jawaban.error.status ?? 0} ${jawaban.error.code ?? jawaban.error.name ?? ""})`);
    return gagal<K, B>(STATUS_VERIFIKASI, "LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  await alat.selesaikan(kunci, "OK").catch(() => alat.catatGalat(rujukan(), "a matched code's record was not cleared"));
  const keadaan = await alat.keadaan().catch(() => "REQUIRED");
  return { status: 200, body: { ok: true, tujuan: keadaan === "COMPLETE" ? await alat.tujuan(null) : HALAMAN_AKTIVASI } };
}

// ═══════════════════════════════════════════════════ signing in with a password
/**
 * Every failure is answered no sooner than this after the request began, so a
 * name nobody has and a wrong password take the same time (the row's "similar
 * timing"). A success is not delayed: it reveals nothing a failure hides.
 */
export const LANTAI_GAGAL_MS = 800;

/** Auth is asked for an unknown name too, as this address, so both paths make the same call. */
export const ALAMAT_TIADA = "tidak-ada@masuk.pintar.invalid";

export type AlatMasukPassword = {
  /** signin_resolve: the address an email or username signs in as, or null */
  resolusi(identitas: string): Promise<string | null>;
  catat(kunci: string): Promise<number>;
  selesaikan(kunci: string, hasil: "OK" | "NOT_JUDGED"): Promise<void>;
  masuk(email: string, password: string): Promise<{ error: GalatAuth | null; jeda?: string | null }>;
  keadaan(): Promise<string>;
  tujuan(lanjut: unknown): Promise<string>;
  tunggu(ms: number): Promise<void>;
  sekarang(): number;
  catatGalat(ref: string, apa: string): void;
};

export async function masukPassword(
  masukan: { origin: boolean; identitas: unknown; password: unknown; lanjut: unknown },
  alat: AlatMasukPassword,
): Promise<Hasil<JawabanMasukPassword>> {
  type K = KodeMasukPassword; type B = JawabanMasukPassword;
  const mulai = alat.sekarang();
  const tolak = async (code: K, extra: { tunggu?: number; ref?: string } = {}) => {
    const sisa = LANTAI_GAGAL_MS - (alat.sekarang() - mulai);
    if (sisa > 0) await alat.tunggu(sisa);
    return gagal<K, B>(STATUS_MASUK_PASSWORD, code, extra);
  };
  if (!masukan.origin) return gagal<K, B>(STATUS_MASUK_PASSWORD, "PERMINTAAN_DITOLAK");
  const identitas = typeof masukan.identitas === "string" ? masukan.identitas.trim().toLowerCase() : "";
  const password = typeof masukan.password === "string" ? masukan.password : "";
  if (!identitas || !password || identitas.length > PANJANG_MAKS || password.length > 1024) return tolak("MASUK_TIDAK_COCOK");

  let email: string | null;
  try {
    email = await alat.resolusi(identitas);
  } catch (e) {
    const ref = rujukan();
    alat.catatGalat(ref, `the sign-in name could not be resolved: ${e instanceof Error ? e.message : "unknown"}`);
    return tolak("LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  // per account when the name resolves (an email and a username share it), per name typed when it does not
  const kunci = kunciIdentitas("masuk-password", email ? `akun|${email.toLowerCase()}` : `nama|${identitas}`);
  let tunggu: number;
  try {
    tunggu = await alat.catat(kunci);
  } catch (e) {
    const ref = rujukan();
    alat.catatGalat(ref, `the sign-in counter could not be asked: ${e instanceof Error ? e.message : "unknown"}`);
    return tolak("LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  if (tunggu > 0) return tolak("MASUK_TUNGGU", { tunggu });

  let jawaban: Awaited<ReturnType<AlatMasukPassword["masuk"]>>;
  try {
    jawaban = await alat.masuk(email ?? ALAMAT_TIADA, password);
  } catch (e) {
    jawaban = { error: { name: "Unexpected", code: e instanceof Error ? e.message : "unknown" } };
  }
  if (jawaban.error || !email) {
    const e = jawaban.error ?? { status: 400, code: "invalid_credentials" };
    const { jenis, ambilKembali } = jenisGalatAuth(e);
    if (jenis === "TIDAK_COCOK") return tolak("MASUK_TIDAK_COCOK");
    if (ambilKembali) {
      await alat.selesaikan(kunci, "NOT_JUDGED").catch(() => alat.catatGalat(rujukan(), "an unjudged sign-in was not taken back"));
    }
    if (jenis === "DIBATASI") {
      const detik = detikJeda(jawaban.jeda);
      return tolak("MASUK_DIBATASI", detik ? { tunggu: detik } : {});
    }
    const ref = rujukan();
    alat.catatGalat(ref, `Auth could not be asked (${e.status ?? 0} ${e.code ?? e.name ?? ""})`);
    return tolak("LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  await alat.selesaikan(kunci, "OK").catch(() => alat.catatGalat(rujukan(), "a signed-in account's record was not cleared"));
  const keadaan = await alat.keadaan().catch(() => "REQUIRED");
  return { status: 200, body: { ok: true, tujuan: keadaan === "REQUIRED" ? HALAMAN_AKTIVASI : await alat.tujuan(masukan.lanjut) } };
}
