import { tujuanInternal } from "@/lib/tujuan";

/**
 * BOB-38: WHAT THE CALLBACK PAGE DOES WITH THE EXCHANGE'S ANSWER.
 *
 * `tukarKode` used to redirect on success and return only on a refusal, and
 * the page treated any settled promise as the refusal. But a server action
 * that redirects REJECTS its caller's promise with the redirect, so every
 * successful sign-in fell into the `.catch` and drew S14 («Tautan ini sudah
 * tidak berlaku») until the role home had rendered.
 *
 * Success is now explicit: the action answers `{ ok: true, tujuan }` with the
 * destination `tujuanMasuk` resolved (a carried `lanjut` still wins, else the
 * role's home), and the page leaves for it with `location.replace`, so the used
 * callback is not left in history. Anything else is S14, as before: an expired
 * or already-used link, a link opened in another browser, a failed request.
 * The destination is narrowed once more here, through the one helper, and a
 * shape that is not a path lands on `/`, which resolves to the role's home.
 */
export type HasilTukar = { ok: true; tujuan: string } | { ok: false };

export function sesudahTukar(hasil: unknown): { pergi: string } | { mati: true } {
  if (hasil && typeof hasil === "object" && (hasil as { ok?: unknown }).ok === true) {
    return { pergi: tujuanInternal((hasil as { tujuan?: unknown }).tujuan, "/") };
  }
  return { mati: true };
}
