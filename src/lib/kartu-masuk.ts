import "server-only";
import { cardEmail, deriveCardSecret, kunciJedaKartu } from "@/lib/card";
import { rujukan } from "@/lib/galat-kontrak";
import { STATUS_KARTU, type JawabanRuteKartu, type KodeKartuRute } from "@/lib/kartu-kontrak";

/**
 * BOB-12: A CLASS CARD SIGNS IN (`POST /masuk/kartu`), decided here and wired
 * in src/app/api/masuk/kartu/route.ts. Every step's outside call is passed in,
 * so the whole decision can be driven by a test (BOB12-K01).
 *
 * In order:
 *  1. Same origin, else CARD_REQUEST_REFUSED. A foreign page must not be able
 *     to sign a device in as someone else (login CSRF).
 *  2. The card and PIN, digits only. Empty or absurd: CARD_NOT_MATCHED, and
 *     nothing is asked.
 *  3. The card's cooldown (card_signin_attempt), BEFORE Auth: a wait is
 *     CARD_COOLDOWN, and Auth is not asked. Every number typed is counted,
 *     existing or not.
 *  4. Auth judges the card and PIN. A match signs in and clears the card's
 *     record; a non-match of any kind is the one CARD_NOT_MATCHED, and counts.
 *     Auth's own rate limit is CARD_RATE_LIMITED and an unreachable Auth is
 *     CARD_UNAVAILABLE; only those, which judged no PIN, are taken back
 *     (jenisGalatAuth).
 */

export type GalatAuth = { status?: number; code?: string; name?: string };

export type AlatKartu = {
  /** card_signin_attempt: seconds to wait, 0 to go ahead. Throws when the database cannot be asked. */
  catat(kunci: string): Promise<number>;
  /** card_signin_settle */
  selesaikan(kunci: string, hasil: "MASUK" | "TIDAK_DINILAI"): Promise<void>;
  /** Auth's password sign-in; `jeda` is Auth's Retry-After, when it gave one. */
  masuk(email: string, sandi: string): Promise<{ error: GalatAuth | null; jeda?: string | null }>;
  /** Where the newly signed-in person goes (tujuanMasuk). */
  tujuan(lanjut: unknown): Promise<string>;
  /**
   * CR-91 (D-145(a)): `kartu_bukan_staf()`, asked AS THE NEW SESSION. False when this card's person holds a staff role
   * (a class card is a learner's alone). Throws when it cannot be asked.
   */
  bukanStaf(): Promise<boolean>;
  /** Ends the new session: a card session CR-91 does not let stand. */
  keluar(): Promise<void>;
  /** Server-side log: a reference and what failed, never a card number or PIN. */
  catatGalat(ref: string, apa: string): void;
};

export type HasilRuteKartu = { status: number; body: JawabanRuteKartu; retryAfter?: number };

const PANJANG_MAKS = 32;

function gagal(code: KodeKartuRute, extra: { tunggu?: number; ref?: string } = {}): HasilRuteKartu {
  return {
    status: STATUS_KARTU[code],
    body: { ok: false, code, ...extra },
    ...(extra.tunggu ? { retryAfter: extra.tunggu } : {}),
  };
}

function angka(v: unknown): string {
  return typeof v === "string" ? v.replace(/\D/g, "") : "";
}

/** Retry-After as whole seconds, when it is one (1 s to 1 h); an HTTP date is not guessed at. */
export function detikJeda(v: string | null | undefined): number | null {
  const t = (v ?? "").trim();
  if (!/^\d{1,5}$/.test(t)) return null;
  const n = Number(t);
  return n >= 1 && n <= 3600 ? n : null;
}

/**
 * Same origin, by the two signals a browser sets and a page cannot choose. A
 * route handler, unlike the server action it replaces, gets no origin check
 * from Next, so this is it:
 *  - `Sec-Fetch-Site`, when sent, must be `same-origin` (a cross-site or
 *    same-site POST, or one the person did not start from a page, is refused);
 *  - `Origin`, when sent, must be PINTAR's configured origin or the origin the
 *    request was addressed to (the rule Next applies to server actions);
 *  - with neither, the request is refused: every browser sends at least one.
 */
export function asalSendiri(headers: Headers, asalAplikasi: string | null): boolean {
  const situs = headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (situs && situs !== "same-origin") return false;
  const origin = headers.get("origin");
  if (!origin) return situs === "same-origin";
  if (origin === "null") return false;
  const izin = new Set<string>();
  if (asalAplikasi) {
    try { izin.add(new URL(asalAplikasi).origin); } catch { /* not configured */ }
  }
  const host = (headers.get("x-forwarded-host") ?? headers.get("host"))?.split(",")[0]?.trim();
  if (host) {
    const proto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    for (const p of proto ? [proto] : ["https", "http"]) izin.add(`${p}://${host}`);
  }
  return izin.has(origin);
}

/**
 * Auth's refusal, read for two things: what the person is told, and whether
 * the attempt is taken back. ONLY an answer that says nothing about the card
 * or PIN is taken back: Auth's own rate limit (429), Auth failing (5xx), and
 * the request never answered (a network failure or this route's timeout, both
 * AuthRetryableFetchError). Any other refusal counts: a 4xx is a judgement of
 * the credential, and an error that fits none of these is counted too, since
 * nothing shows the PIN went unjudged.
 */
export function jenisGalatAuth(e: GalatAuth): { jenis: "TIDAK_COCOK" | "DIBATASI" | "TIDAK_TERSEDIA"; ambilKembali: boolean } {
  if (e.status === 429 || e.code === "over_request_rate_limit") return { jenis: "DIBATASI", ambilKembali: true };
  if (e.name === "AuthRetryableFetchError" || (e.status !== undefined && e.status >= 500)) return { jenis: "TIDAK_TERSEDIA", ambilKembali: true };
  if (e.status !== undefined && e.status >= 400) return { jenis: "TIDAK_COCOK", ambilKembali: false };
  return { jenis: "TIDAK_TERSEDIA", ambilKembali: false };
}

export async function masukDenganKartu(
  masukan: { origin: boolean; kartu: unknown; pin: unknown; lanjut: unknown },
  alat: AlatKartu,
): Promise<HasilRuteKartu> {
  if (!masukan.origin) return gagal("CARD_REQUEST_REFUSED");
  const kartu = angka(masukan.kartu);
  const pin = angka(masukan.pin);
  if (!kartu || !pin || kartu.length > PANJANG_MAKS || pin.length > PANJANG_MAKS) return gagal("CARD_NOT_MATCHED");

  const kunci = kunciJedaKartu(kartu);
  let tunggu: number;
  try {
    tunggu = await alat.catat(kunci);
  } catch (e) {
    const ref = rujukan();
    alat.catatGalat(ref, `the card cooldown could not be asked: ${e instanceof Error ? e.message : "unknown"}`);
    return gagal("CARD_UNAVAILABLE", { ref });
  }
  if (tunggu > 0) return gagal("CARD_COOLDOWN", { tunggu });

  let jawaban: Awaited<ReturnType<AlatKartu["masuk"]>>;
  try {
    jawaban = await alat.masuk(cardEmail(kartu), deriveCardSecret(kartu, pin));
  } catch (e) {
    // thrown, not answered: nothing shows Auth left the PIN unjudged, so it counts
    jawaban = { error: { name: "Unexpected", code: e instanceof Error ? e.message : "unknown" } };
  }

  if (jawaban.error) {
    const { jenis, ambilKembali } = jenisGalatAuth(jawaban.error);
    if (jenis === "TIDAK_COCOK") return gagal("CARD_NOT_MATCHED");
    if (ambilKembali) {
      await alat.selesaikan(kunci, "TIDAK_DINILAI").catch((e) =>
        alat.catatGalat(rujukan(), `an unjudged attempt was not taken back: ${e instanceof Error ? e.message : "unknown"}`));
    }
    if (jenis === "DIBATASI") {
      const detik = detikJeda(jawaban.jeda);
      return gagal("CARD_RATE_LIMITED", detik ? { tunggu: detik } : {});
    }
    const ref = rujukan();
    alat.catatGalat(ref, `Auth could not be asked (${jawaban.error.status ?? 0} ${jawaban.error.code ?? jawaban.error.name ?? ""})`);
    return gagal("CARD_UNAVAILABLE", { ref });
  }

  // CR-91 (D-145(a)): a class card is a learner's alone. The database already refuses a card for staff and a staff role
  // for a card; this asks once more at the moment of authentication, as the new session, and FAILS CLOSED: a card
  // whose person holds a staff role, or a question that cannot be asked, ends the session before anything is served.
  // The attempt stays counted (no MASUK settle), and nothing in the answer says why.
  let bukanStaf = false;
  let tidakTerjawab = false;
  try {
    bukanStaf = await alat.bukanStaf();
  } catch {
    tidakTerjawab = true;
  }
  if (!bukanStaf) {
    await alat.keluar().catch((e) =>
      alat.catatGalat(rujukan(), `a refused card session could not be ended: ${e instanceof Error ? e.message : "unknown"}`));
    const ref = rujukan();
    alat.catatGalat(ref, tidakTerjawab
      ? "CR-91: the card's staff check could not be asked; the session was ended"
      : "CR-91: a class card whose person holds a staff role was refused; the session was ended");
    return gagal(tidakTerjawab ? "CARD_UNAVAILABLE" : "CARD_REQUEST_REFUSED", { ref });
  }

  await alat.selesaikan(kunci, "MASUK").catch((e) =>
    alat.catatGalat(rujukan(), `a signed-in card's record was not cleared: ${e instanceof Error ? e.message : "unknown"}`));
  return { status: 200, body: { ok: true, tujuan: await alat.tujuan(masukan.lanjut) } };
}
