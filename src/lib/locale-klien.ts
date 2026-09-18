"use client";

import { LOCALE_COOKIE } from "./locale-kontrak";
import type { Locale } from "./hle";

/**
 * WRITING THE INTERFACE-LANGUAGE PREFERENCE, IN ONE PLACE.
 *
 * Extracted from `PengalihBahasa` when the tour gained its own language
 * control: the tour's card sits over an inert page, so the header switch is
 * unreachable while a step is open and the dialog needs one of its own (§E).
 * Two controls must not become two mechanisms — that is how the cookie and the
 * mirror start to disagree — so both call this.
 *
 * It is a preference, not an event. Nothing is sent anywhere: no action, no
 * endpoint, no RPC, no column. How a reader would like the page written is not
 * something that happened to their account.
 */
export function simpanBahasa(next: Locale): void {
  // A year is long enough that a learner never meets this control twice by
  // accident, and short enough that a shared classroom machine forgets.
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  try {
    window.localStorage.setItem(LOCALE_COOKIE, next);
  } catch {
    // A browser that refuses storage still gets the cookie; the mirror is a
    // convenience, never the source of truth.
  }
}
