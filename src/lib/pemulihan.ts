import "server-only";
import { kunciIdentitas } from "@/lib/card";
import { rujukan } from "@/lib/galat-kontrak";
import { detikJeda, jenisGalatAuth, type GalatAuth } from "@/lib/kartu-masuk";
import { PENGATURAN, periksaPassword, type AlasanPasswordLemah } from "@/lib/pengaturan-auth";
import { angkaKode, tungguSebelumMenjawab, type AlatMintaKode, type Hasil } from "@/lib/aktivasi";
import {
  STATUS_LUPA_KODE,
  STATUS_LUPA_PASSWORD,
  STATUS_LUPA_PERIKSA,
  type JawabanLupaKode,
  type JawabanLupaPassword,
  type JawabanLupaPeriksa,
  type KodeLupaKode,
  type KodeLupaPassword,
  type KodeLupaPeriksa,
} from "@/lib/aktivasi-kontrak";

/**
 * BOB-27 (Gate 4): «LUPA PASSWORD?», decided here and wired in
 * src/app/api/masuk/lupa/{kode,periksa,password}. Every outside call is passed
 * in, so each decision can be driven by a test, as Gate 3's are.
 *
 * THE RULES (IDENTITY-4.0 §9, C1, C3, D-055(f), D-098(c)):
 *   - asking: the same answer for every name; D-098(c)'s waits first; a code
 *     only to an active email account, after the answer has gone;
 *   - checking: one wrong-code answer for wrong, expired, used or nobody's,
 *     counted per name; Auth is asked for nobody's name too, with an address
 *     nobody has, so both take the same path; a match signs nobody in and gives
 *     the browser a single-use, ten-minute recovery grant;
 *   - the new password: only with a live grant; the rules first; every session
 *     of the person ends (Auth's admin write does it); this browser signs in
 *     with the new password; the owner is told by email, after the answer.
 */

const PANJANG_MAKS = 320;

function gagal<K extends string, B>(status: Record<K, number>, code: K, extra: { tunggu?: number; ref?: string; alasan?: AlasanPasswordLemah[] } = {}): Hasil<B> {
  return { status: status[code], body: { ok: false, code, ...extra } as B, ...(extra.tunggu ? { retryAfter: extra.tunggu } : {}) };
}

/** An email address or a username, as typed: trimmed and lower-cased (usernames are canonical lowercase, C9). */
export function normalisasiNama(v: unknown): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

// ═══════════════════════════════════════════════════ asking for a recovery code
export type SasaranPemulihan = { authUserId: string; nama: string };
export type AlatMintaPemulihan = Pick<AlatMintaKode, "jedaPengiriman" | "catatPermintaan" | "jedaKirimUlang" | "nanti" | "catatGalat"> & {
  /** recovery_code_target: an active email account by address or username, or null. Throws when it cannot be asked. */
  sasaran(nama: string): Promise<SasaranPemulihan | null>;
  /** issue the code and send it; runs after the answer has gone. Never throws into the answer. */
  kirim(sasaran: SasaranPemulihan): Promise<void>;
};

export async function mintaKodePemulihan(
  masukan: { origin: boolean; nama: unknown },
  alat: AlatMintaPemulihan,
): Promise<Hasil<JawabanLupaKode>> {
  type K = KodeLupaKode; type B = JawabanLupaKode;
  if (!masukan.origin) return gagal<K, B>(STATUS_LUPA_KODE, "PERMINTAAN_DITOLAK");
  const nama = normalisasiNama(masukan.nama);
  if (!nama || nama.length > PANJANG_MAKS) return gagal<K, B>(STATUS_LUPA_KODE, "IDENTITAS_KOSONG");
  let tunggu: Awaited<ReturnType<typeof tungguSebelumMenjawab>>;
  try {
    tunggu = await tungguSebelumMenjawab(alat, nama);
  } catch (e) {
    const ref = rujukan();
    alat.catatGalat(ref, `the sending state could not be asked: ${e instanceof Error ? e.message : "unknown"}`);
    return gagal<K, B>(STATUS_LUPA_KODE, "LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  if (tunggu) return gagal<K, B>(STATUS_LUPA_KODE, tunggu.kode, { tunggu: tunggu.detik });
  let sasaran: SasaranPemulihan | null;
  let jeda: number;
  try {
    [sasaran, jeda] = await Promise.all([alat.sasaran(nama), alat.jedaKirimUlang()]);
  } catch (e) {
    const ref = rujukan();
    alat.catatGalat(ref, `the recovery lookup could not be asked: ${e instanceof Error ? e.message : "unknown"}`);
    return gagal<K, B>(STATUS_LUPA_KODE, "LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  if (sasaran) {
    const s = sasaran;
    alat.nanti(() => alat.kirim(s).catch((e) =>
      alat.catatGalat(rujukan(), `a recovery code was not sent: ${e instanceof Error ? e.name : "unknown"}`)));
  }
  // THE SAME ANSWER FOR EVERY NAME: a code is being sent if the name is an active account's.
  return { status: 200, body: { ok: true, kirimUlangDalam: jeda, berlakuMenit: PENGATURAN.berlakuMenit } };
}

// ═══════════════════════════════════════════════════ checking the recovery code
export type AlatPeriksaPemulihan = {
  /** identity_attempt('CODE_VERIFY', key): seconds to wait, 0 to go ahead */
  catat(kunci: string): Promise<number>;
  selesaikan(kunci: string, hasil: "OK" | "NOT_JUDGED"): Promise<void>;
  /** recovery_code_target with the account's address, or null. Throws when it cannot be asked. */
  sasaran(nama: string): Promise<{ authUserId: string; email: string } | null>;
  /** Auth's verifyOtp on a client that keeps no session; the session it makes is ended at once. */
  verifikasi(email: string, kode: string): Promise<{ error: GalatAuth | null; jeda?: string | null }>;
  /** recovery_grant_issue, and the browser's httpOnly grant. Throws when it cannot be given. */
  beriIzin(authUserId: string): Promise<void>;
  catatGalat(ref: string, apa: string): void;
};

/** Auth is asked for nobody's name too, as an address nobody has, so both paths make the same call. */
export function alamatTiada(kunci: string): string {
  return `tiada-${kunci.slice(0, 16)}@pulih.pintar.invalid`;
}

export async function periksaKodePemulihan(
  masukan: { origin: boolean; nama: unknown; kode: unknown },
  alat: AlatPeriksaPemulihan,
): Promise<Hasil<JawabanLupaPeriksa>> {
  type K = KodeLupaPeriksa; type B = JawabanLupaPeriksa;
  if (!masukan.origin) return gagal<K, B>(STATUS_LUPA_PERIKSA, "PERMINTAAN_DITOLAK");
  const nama = normalisasiNama(masukan.nama);
  const kode = angkaKode(masukan.kode);
  // A missing name or a malformed code is a wrong code: nothing is asked and nothing counts.
  if (!nama || nama.length > PANJANG_MAKS || kode.length !== PENGATURAN.panjangKode) return gagal<K, B>(STATUS_LUPA_PERIKSA, "KODE_TIDAK_COCOK");
  const kunci = kunciIdentitas("kode-alamat", nama);
  let tunggu: number;
  let sasaran: Awaited<ReturnType<AlatPeriksaPemulihan["sasaran"]>>;
  try {
    tunggu = await alat.catat(kunci);
    sasaran = tunggu > 0 ? null : await alat.sasaran(nama);
  } catch (e) {
    const ref = rujukan();
    alat.catatGalat(ref, `the recovery check could not be asked: ${e instanceof Error ? e.message : "unknown"}`);
    return gagal<K, B>(STATUS_LUPA_PERIKSA, "LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  if (tunggu > 0) return gagal<K, B>(STATUS_LUPA_PERIKSA, "KODE_TUNGGU", { tunggu });

  let jawaban: Awaited<ReturnType<AlatPeriksaPemulihan["verifikasi"]>>;
  try {
    jawaban = await alat.verifikasi(sasaran?.email ?? alamatTiada(kunci), kode);
  } catch (e) {
    jawaban = { error: { name: "Unexpected", code: e instanceof Error ? e.message : "unknown" } };
  }
  if (jawaban.error) {
    const { jenis, ambilKembali } = jenisGalatAuth(jawaban.error);
    if (jenis === "TIDAK_COCOK") return gagal<K, B>(STATUS_LUPA_PERIKSA, "KODE_TIDAK_COCOK");
    if (ambilKembali) {
      await alat.selesaikan(kunci, "NOT_JUDGED").catch(() => alat.catatGalat(rujukan(), "an unjudged recovery attempt was not taken back"));
    }
    if (jenis === "DIBATASI") {
      const detik = detikJeda(jawaban.jeda);
      return gagal<K, B>(STATUS_LUPA_PERIKSA, "KODE_DIBATASI", detik ? { tunggu: detik } : {});
    }
    const ref = rujukan();
    alat.catatGalat(ref, `Auth could not verify (${jawaban.error.status ?? 0} ${jawaban.error.code ?? jawaban.error.name ?? ""})`);
    return gagal<K, B>(STATUS_LUPA_PERIKSA, "LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  if (!sasaran) return gagal<K, B>(STATUS_LUPA_PERIKSA, "KODE_TIDAK_COCOK");
  try {
    await alat.beriIzin(sasaran.authUserId);
  } catch (e) {
    const ref = rujukan();
    alat.catatGalat(ref, `the recovery grant could not be given: ${e instanceof Error ? e.message : "unknown"}`);
    return gagal<K, B>(STATUS_LUPA_PERIKSA, "LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  await alat.selesaikan(kunci, "OK").catch(() => alat.catatGalat(rujukan(), "a matched recovery code's record was not cleared"));
  return { status: 200, body: { ok: true } };
}

// ═══════════════════════════════════════════════════════ the new password
export type AlatPasswordPemulihan = {
  /** recovery_grant_permit on the grant's hash: the account it is for, or null for no live grant. Throws otherwise. */
  izin(): Promise<{ authUserId: string; email: string } | null>;
  /** Auth's admin password write; Auth ends every session of the person. */
  setel(authUserId: string, password: string): Promise<{ error: { code?: string; reasons?: string[]; status?: number } | null }>;
  /** this browser signs in with the new password */
  masuk(email: string, password: string): Promise<{ error: GalatAuth | null }>;
  /** the grant cookie goes */
  buangIzin(): Promise<void>;
  /** the owner is told by email; runs after the answer */
  kabari(authUserId: string): Promise<void>;
  nanti(kerja: () => Promise<void>): void;
  tujuan(): Promise<string>;
  catatGalat(ref: string, apa: string): void;
};

const ALASAN_AUTH: Record<string, AlasanPasswordLemah> = { length: "PANJANG", characters: "KARAKTER", pwned: "BOCOR" };

export async function gantiPasswordPemulihan(
  masukan: { origin: boolean; password: unknown },
  alat: AlatPasswordPemulihan,
): Promise<Hasil<JawabanLupaPassword>> {
  type K = KodeLupaPassword; type B = JawabanLupaPassword;
  if (!masukan.origin) return gagal<K, B>(STATUS_LUPA_PASSWORD, "PERMINTAAN_DITOLAK");
  const password = typeof masukan.password === "string" ? masukan.password : "";
  const cek = periksaPassword(password);
  if (cek.terlaluPanjang) return gagal<K, B>(STATUS_LUPA_PASSWORD, "PASSWORD_TERLALU_PANJANG");
  if (cek.alasan.length) return gagal<K, B>(STATUS_LUPA_PASSWORD, "PASSWORD_LEMAH", { alasan: cek.alasan });

  let akun: Awaited<ReturnType<AlatPasswordPemulihan["izin"]>>;
  try {
    akun = await alat.izin();
  } catch (e) {
    const ref = rujukan();
    alat.catatGalat(ref, `the recovery permit could not be given: ${e instanceof Error ? e.message : "unknown"}`);
    return gagal<K, B>(STATUS_LUPA_PASSWORD, "LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  if (!akun) {
    await alat.buangIzin();
    return gagal<K, B>(STATUS_LUPA_PASSWORD, "PEMULIHAN_BERAKHIR");
  }
  const { error } = await alat.setel(akun.authUserId, password);
  if (error) {
    if (error.code === "weak_password") {
      const alasan = (error.reasons ?? []).map((r) => ALASAN_AUTH[r]).filter(Boolean);
      return gagal<K, B>(STATUS_LUPA_PASSWORD, "PASSWORD_LEMAH", { alasan: alasan.length ? [...new Set(alasan)] : ["PANJANG"] });
    }
    const ref = rujukan();
    alat.catatGalat(ref, `the new password could not be set (${error.code ?? error.status ?? ""})`);
    return gagal<K, B>(STATUS_LUPA_PASSWORD, "LAYANAN_TIDAK_TERSEDIA", { ref });
  }
  // The password is set and every session of the person has ended; the grant is spent (the guard ended it).
  await alat.buangIzin();
  const id = akun.authUserId;
  alat.nanti(() => alat.kabari(id).catch((e) =>
    alat.catatGalat(rujukan(), `the password-changed email was not sent: ${e instanceof Error ? e.name : "unknown"}`)));
  const masuk = await alat.masuk(akun.email, password).catch((e) => ({ error: { name: "Unexpected", code: e instanceof Error ? e.message : "unknown" } as GalatAuth }));
  // The password changed either way; if this browser could not sign in, the person signs in with it normally.
  return { status: 200, body: { ok: true, tujuan: masuk.error ? "/masuk" : await alat.tujuan() } };
}
