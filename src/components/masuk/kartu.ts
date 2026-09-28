import { format, type HleEvent, type Locale } from "@/lib/hle";

/**
 * THE CARD SCREEN READS ITS RESULT (DAISY-13, BOB-12 (c), audit M13).
 *
 * The class card signs in through BOB-12's route, `POST /masuk/kartu`, which
 * answers in JSON and never in the database's or Auth's words (D-011):
 *
 *   200  { ok: true, tujuan }         signed in; go where the route says
 *   401  CARD_NOT_MATCHED             card or PIN did not match
 *   429  CARD_COOLDOWN   + tunggu     this card number failed too often
 *   429  CARD_RATE_LIMITED (+ tunggu) too many sign-ins from one address
 *   403  CARD_REQUEST_REFUSED         not asked from PINTAR's own page
 *   503  CARD_UNAVAILABLE + ref       PINTAR could not check cards
 *
 * A NON-MATCH IS ONE SENTENCE, whichever of the two was wrong: the screen does
 * not know, and must not imply that it does. A WAIT IS NEVER "BELUM COCOK"
 * (M13): telling a child who typed the right PIN that it does not match, when
 * the real answer is "too many at once", sends them to the teacher for a new
 * card they do not need.
 *
 * THE WAIT IS THE ROUTE'S, NEVER INVENTED. The route gives it as `tunggu`
 * (seconds), with `Retry-After` for a cooldown; when neither is there the
 * screen says "a moment". The cooldown counts every card number submitted,
 * existing or not (BOB-12 design condition 4), so saying "wait" reveals
 * nothing about which cards exist. That is why this path may show a wait while
 * the email path, whose throttle does separate real addresses (D2), may not;
 * UX1-MASUK-KONTRAK-01 keeps that rule for every other sign-in file.
 *
 * Pure except `kirimKartu`, which is the one request.
 */
export const KODE_KARTU = {
  CARD_NOT_MATCHED: 401,
  CARD_COOLDOWN: 429,
  CARD_RATE_LIMITED: 429,
  CARD_REQUEST_REFUSED: 403,
  CARD_UNAVAILABLE: 503,
} as const;
export type KodeKartu = keyof typeof KODE_KARTU;

/** The request never answered, or answered with something that is not the contract. */
export type GagalKartu = { kode: KodeKartu | "CARD_OFFLINE"; tunggu: number | null; ref: string | null };
export type JawabanKartu = { k: "masuk"; tujuan: string } | ({ k: "gagal" } & GagalKartu);

/** A place inside PINTAR, or PINTAR's front door: never another site. */
export function tujuanAman(v: unknown): string {
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/";
}

function detik(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && /^\d+$/.test(v.trim()) ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 3600 ? Math.ceil(n) : null;
}

/**
 * The route's answer as the screen needs it. A known code wins; a body
 * without one is read by its status, so a contract that grows a code still
 * lands on the right sentence; anything else is "could not reach PINTAR".
 */
export function bacaJawabanKartu(status: number, body: unknown, jedaHeader: string | null): JawabanKartu {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (status === 200 && b.ok === true) return { k: "masuk", tujuan: tujuanAman(b.tujuan) };
  const dariKode = typeof b.code === "string" && b.code in KODE_KARTU ? (b.code as KodeKartu) : null;
  const dariStatus = (Object.keys(KODE_KARTU) as KodeKartu[]).find((k) => KODE_KARTU[k] === status && k !== "CARD_COOLDOWN") ?? null;
  const kode = dariKode ?? dariStatus ?? "CARD_OFFLINE";
  const menunggu = kode === "CARD_COOLDOWN" || kode === "CARD_RATE_LIMITED";
  return {
    k: "gagal",
    kode,
    tunggu: menunggu ? detik(b.tunggu) ?? detik(jedaHeader) : null,
    ref: kode === "CARD_UNAVAILABLE" && typeof b.ref === "string" && /^[A-Z0-9]{6}$/.test(b.ref) ? b.ref : null,
  };
}

/** The one request: the form as it is, to PINTAR's own route. */
export async function kirimKartu(fd: FormData): Promise<JawabanKartu> {
  try {
    const r = await fetch("/masuk/kartu", { method: "POST", body: fd, headers: { accept: "application/json" }, cache: "no-store" });
    const body = await r.json().catch(() => null);
    return bacaJawabanKartu(r.status, body, r.headers.get("retry-after"));
  } catch {
    return { k: "gagal", kode: "CARD_OFFLINE", tunggu: null, ref: null };
  }
}

/** A wait is a note, not an error: nothing the child typed was judged. */
export function menunggu(g: GagalKartu): boolean {
  return g.kode === "CARD_COOLDOWN" || g.kode === "CARD_RATE_LIMITED";
}

/** The sentence for a refusal, in the reader's language. Only these keys, only these parts. */
export function kalimatKartu(g: GagalKartu, s: (k: HleEvent) => string, locale: Locale): string {
  const tunggu = g.tunggu !== null
    ? `${s("auth.card_tunggu")} ${format.durasi(g.tunggu, locale)}${s("auth.card_lalu_coba")}`
    : s("auth.card_tunggu_sebentar");
  switch (g.kode) {
    case "CARD_NOT_MATCHED": return s("auth.card_failed");
    case "CARD_COOLDOWN": return `${s("auth.card_sering")} ${tunggu} ${s("auth.card_tanya_guru")}`;
    case "CARD_RATE_LIMITED": return `${s("auth.card_ramai")} ${tunggu}`;
    case "CARD_REQUEST_REFUSED": return s("auth.card_muat_ulang");
    case "CARD_UNAVAILABLE":
      return g.ref ? `${s("auth.card_tidak_tersedia")} ${s("auth.card_rujukan")}: ${g.ref}.` : s("auth.card_tidak_tersedia_singkat");
    default: return s("auth.card_putus");
  }
}
