/**
 * BOB-12: WHAT THE CARD SIGN-IN ROUTE ANSWERS (`POST /masuk/kartu`). The codes
 * are the contract (D-011); the words are the screen's (DAISY-13,
 * src/components/masuk/kartu.ts, D-014).
 *
 *   200  { ok: true, tujuan }                 signed in; go to `tujuan`
 *   401  CARD_NOT_MATCHED                     card or PIN did not match, or the card cannot sign in
 *   429  CARD_COOLDOWN, tunggu + Retry-After  this card number was tried too often
 *   429  CARD_RATE_LIMITED (+ tunggu)         Auth's per-address limit refused the sign-in
 *   403  CARD_REQUEST_REFUSED                 not asked from PINTAR's own page
 *   503  CARD_UNAVAILABLE, ref                Auth or the database could not be asked
 *
 * No code separates a card that exists from one that does not, or a wrong card
 * from a wrong PIN.
 */
export const STATUS_KARTU = {
  CARD_NOT_MATCHED: 401,
  CARD_COOLDOWN: 429,
  CARD_RATE_LIMITED: 429,
  CARD_REQUEST_REFUSED: 403,
  CARD_UNAVAILABLE: 503,
} as const;
export type KodeKartuRute = keyof typeof STATUS_KARTU;

export type JawabanRuteKartu =
  | { ok: true; tujuan: string }
  | { ok: false; code: KodeKartuRute; tunggu?: number; ref?: string };
