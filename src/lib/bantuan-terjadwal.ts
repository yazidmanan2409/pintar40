/**
 * ASK THE SERVER ABOUT HELP WHEN THERE IS SOMETHING TO ASK (owner ruling, 2 Oct; whole-system efficiency audit).
 *
 * The question player used to ask "is help due?" every 5 s while a question was on screen: 23 server actions, 23
 * Auth round trips and 30% of a learner's RPC time per sitting, almost every answer "not yet", and asked even where
 * the assessment offers no help. The server stays the authority on whether help is due (assistance_state: the
 * hesitation window against the time since the question was first viewed, on the server's clock, and not once it is
 * answered). What changes is WHEN the player asks: at the point the server's own figures say help could become due,
 * and not again unless something the server counts has changed.
 *
 * Pure and free of React, so selftest/eff.test.ts executes exactly what the player runs.
 */

/** A little after the window, so the server's own dwell has passed it when the check arrives. */
export const SELISIH_MS = 500;

/**
 * How long to wait before asking about help, from the server's figures: null when there is nothing to ask —
 * the assessment offers no help (no window), the question is answered, or help is already due (the offer is on
 * screen; the player asks again only after the learner opens a level or answers).
 */
export function jedaBantuan(s: { windowSeconds: number | null; dwellSeconds: number | null; due: boolean; answered: boolean }): number | null {
  if (s.windowSeconds == null || s.answered || s.due) return null;
  const sisa = s.windowSeconds - (s.dwellSeconds ?? 0);
  return Math.max(0, Math.round(sisa * 1000)) + SELISIH_MS;
}

/**
 * The first ask for a question just shown: the assessment's window, less the time the server says the question has
 * already been on screen (its first view, measured by the server action). Unknown dwell asks after the whole window;
 * the server's answer then corrects it. Null when the assessment offers no help or the question is answered.
 */
export function jedaAwal(windowSeconds: number | null, dwellSeconds: number | null, answered: boolean): number | null {
  return jedaBantuan({ windowSeconds, dwellSeconds, due: false, answered });
}

/**
 * OFFLINE ONLY (owner ruling, option A). While the page believes the learner is offline, ask something light every
 * `ms` whether the network is back; on the first yes, say so once and stop. Nothing runs while online: the page
 * starts this only on entering offline mode (a browser `offline` event, or an authoritative request that never
 * arrived) and stops it on recovery. The probe must not touch the server's authority (a static file the proxy
 * does not see), and it decides nothing but the offline notice.
 *
 * Returns the function that stops it.
 */
export function periksaSaatLuring(probe: () => Promise<boolean>, pulih: () => void, ms: number): () => void {
  let berhenti = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const sekali = async () => {
    if (berhenti) return;
    let ok = false;
    try { ok = await probe(); } catch { ok = false; }
    if (berhenti) return;
    if (ok) { berhenti = true; pulih(); return; }
    timer = setTimeout(() => { void sekali(); }, ms);
  };
  timer = setTimeout(() => { void sekali(); }, ms);
  return () => { berhenti = true; if (timer !== undefined) clearTimeout(timer); };
}

/** A static file outside the proxy's matcher (src/proxy.ts excludes /brand/): no session check, no database. */
export const ALAMAT_PERIKSA = "/brand/pintar-selalu-logo.png";
