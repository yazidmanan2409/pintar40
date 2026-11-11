"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { COOKIE_HADIR, COOKIE_SELESAI, opsiTanda } from "@/lib/tanda-keluar";
import { supabaseServer } from "@/lib/supabase/server";
import { keluarPerangkatIni } from "@/lib/keluar";
import { appUrl } from "@/lib/env";
import { tujuanInternal } from "@/lib/tujuan";
import { TAUTAN_MASUK_CADANGAN } from "@/lib/aktivasi-kontrak";
import { catatAkuntabilitas, normalPengenal } from "@/app/api/_akuntabilitas/catat";

/**
 * WHAT THE SIGN-IN SCREEN IS TOLD, AND WHAT IT IS NOT.
 *
 * TWO outcomes, and the set is deliberately this small. `terkirim` is the
 * ordinary answer; it is also the answer for an address nobody has (L-2), and
 * since the D2 ruling it is also the answer when the provider refuses the send
 * as too soon. `gagal` is a failure of the REQUEST — network, mail transport,
 * server — which is a fact about the attempt and not about the address.
 *
 * There is no outcome for "no such account", and there is no longer one for
 * "held", because either of them would answer a question the screen must not
 * answer.
 */
export type HasilKirim = "terkirim" | "gagal";

export async function sendMagicLink(formData: FormData): Promise<HasilKirim> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  // L-1. Narrowed BEFORE it is embedded in the email, so a poisoned
  // destination never reaches a learner's inbox at all. The callback narrows
  // it again on the way back, for the link nobody here built.
  // BOB-06 (D-010): none asked for stays none, and the link then carries none.
  const next = tujuanInternal(formData.get("lanjut"), "");
  if (!email) return "gagal";
  // BOB-26 (C14): the magic link is the fallback behind one switch; off, nothing is sent
  if (!TAUTAN_MASUK_CADANGAN) return "gagal";
  const supabase = await supabaseServer();
  const origin = appUrl();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // L-2. THIS PRODUCT IS INSTITUTION-PROVISIONED. An unknown email address
      // proves nothing and is owed nothing: authentication demonstrates access
      // to an identity a school has already created, and it does not create
      // one. Without this flag the Supabase default is `true`, an unknown
      // address becomes an `auth.users` row, and `on_auth_user_created` then
      // gives it a `persons` row and an `accounts` row -- a stranger
      // self-provisioning a PINTAR identity from the sign-in form.
      shouldCreateUser: false,
      emailRedirectTo: next ? `${origin}/auth/callback?lanjut=${encodeURIComponent(next)}` : `${origin}/auth/callback`,
    },
  });
  // AND THE ANSWER IS THE SAME EITHER WAY. With creation off, an unknown
  // address comes back as an error where a known one comes back clean, and
  // returning that difference would hand an unauthenticated visitor an
  // account-existence oracle -- trading one defect for another. So the refusal
  // that MEANS "no such provisioned identity" is reported as the ordinary
  // outcome, and only a genuine failure of the request is reported as one.
  //
  // Deliberately not a pre-check against the database: asking "does this email
  // exist" before asking Supabase to send the link would rebuild the same
  // oracle in our own code, one round-trip earlier.
  //
  // D2 (Sauron, 2026-09-18): A RATE-LIMIT REFUSAL IS FOLDED IN HERE TOO, and
  // the held-resend surface is suppressed. The provider may throttle sends
  // however it likes; what the screen must never do is let repeated presses
  // separate a provisioned address from an unknown one. It would have: with
  // `shouldCreateUser: false` an unknown address never reaches the provider's
  // throttle at all, so a held resend could only ever mean "this address is
  // real". That is the enumeration boundary the conditional copy exists to
  // close, and it is frozen.
  //
  // The fold is honest as well as safe. The throttle fires BECAUSE a link went
  // out recently, so "if that address is linked, a sign-in link has been sent
  // there" is describing the one already in the person's inbox.
  //
  // D-057(d) (29 Sep) AMENDS D2 NARROWLY: a resend countdown is allowed ONLY on
  // the verification and recovery CODE screens (Gate 3's /aktifkan, Gate 4 and
  // 5's recovery), and there it is one number for everybody, whether or not
  // the identity exists: `kirimUlangDalam` from BOB-25's limit table, never a
  // per-address state (src/app/api/aktifkan/kode, src/lib/aktivasi.ts). This
  // screen keeps D2 whole: no countdown, no held state, one answer.
  // B1 (execution requirement 2): a request for an address PINTAR does not know is one failed sign-in by link, holding
  // only the governed hash of the address; sending a link to a known address is not a sign-in and writes nothing (the
  // success is the callback's, when the link is used). Written before the answer, which stays the same either way.
  if (error && tidakTerdaftar(error)) {
    await catatAkuntabilitas(await headers(), "masuk/tautan", { jenis: "SIGN_IN_FAILED", cara: "LINK", hasil: "TAUTAN_TIDAK_TERDAFTAR", diketik: normalPengenal("nama", email) });
  }
  if (!error || tidakTerdaftar(error) || terlaluSering(error)) return "terkirim";
  return "gagal";
}

/**
 * The shape Supabase returns when `shouldCreateUser` is false and the address
 * belongs to nobody. Matched on the stable error CODE, with the HTTP status and
 * the message text as fallbacks for older gateways -- narrow on purpose, so a
 * real outage still reports as an outage rather than being swallowed by a
 * privacy rule.
 */
function tidakTerdaftar(error: { code?: string; status?: number; message?: string }): boolean {
  if (error.code === "otp_disabled" || error.code === "signup_disabled") return true;
  if (error.status === 422 && /signups? not allowed|otp_disabled/i.test(error.message ?? "")) return true;
  return false;
}

/**
 * THE SEND WAS REFUSED AS TOO SOON. Recognised so it can be FOLDED INTO the
 * ordinary outcome, never so it can be shown: S6 is suppressed by the D2
 * ruling, and this function exists to make sure a throttle is not mistaken for
 * a transport failure and reported as one — which would put the distinguishable
 * state back through the other door.
 *
 * No timer, no countdown, no cooldown, no retry-after and no policy lives in
 * this screen's sign-in link. The condition is the provider's; the screen's
 * answer to it is the same answer it gives everybody. (The code screens' one
 * uniform countdown, D-057(d), is theirs and is described above.)
 */
function terlaluSering(error: { code?: string; status?: number }): boolean {
  if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") return true;
  return error.status === 429;
}

// BOB-12: the class card signs in through POST /masuk/kartu
// (src/app/api/masuk/kartu/route.ts), which counts every card's failed
// attempts before Auth is asked. The server action that did it before is gone:
// an action is a public endpoint, and it would have walked around that count.

/**
 * Where a newly signed-in person goes.
 *
 * The destination they were heading for when they were interrupted, if it
 * survives the L-1 narrowing; otherwise the home their role actually uses.
 * Bob's helper already takes the fallback as a parameter, so this changes
 * nothing about what it accepts -- only what a refusal falls back to, which
 * §7.3 of the handoff rules is the role's home and NOT an error the person
 * never chose and cannot act on.
 *
 * BOB-06 (D-010): "/" is not a destination. It is the entry page, which no
 * interruption produces (the proxy never sends a visitor away from it), and
 * links written before this fix carry it for "none"; taken as asked for, it
 * beat the role's home and management looped back to the sign-in screen.
 */
export async function tujuanMasuk(raw: unknown): Promise<string> {
  // L3 (CR-83; D-132): EVERY ARRIVAL GOES THROUGH /mulai. It runs once the proxy has made this session's row, takes
  // the door (carried here as /mulai?pintu=…) or the page asked for, and sets the working context by C4, C5 and C9.
  // D-010's ranking no longer chooses among several purposes (D-132(i)); /mulai keeps it only for an evaluation
  // persona, which has no context (C10).
  const lanjut = tujuanInternal(raw, "");
  if (lanjut === "" || lanjut === "/") return "/mulai";
  if (lanjut === "/mulai" || lanjut.startsWith("/mulai?")) return lanjut;
  return `/mulai?lanjut=${encodeURIComponent(lanjut)}`;
}

/**
 * S15's sign-out. It ends the EVALUATION session first, exactly as `/keluar`
 * does and for the same reason (ADR-0020): clearing the cookie alone would
 * leave a live `evaluation_sessions` row behind. `exit_persona` is a no-op for
 * an ordinary caller, so this costs one refused RPC and nothing else.
 *
 * It returns to the sign-in screen rather than to `/`, because the person
 * pressed it ON the sign-in screen: they are signing out in order to sign in
 * as somebody else, which is the whole reason S15 offers it.
 */
export async function keluarDariSesi(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.rpc("exit_persona");
  // B1: who is signing out, read before the session ends (one event, after the sign-out, before the answer)
  const { data: pengguna } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  // this device only (D-009, BOB-05), exactly as /keluar
  await keluarPerangkatIni(supabase);
  if (pengguna.user?.id) await catatAkuntabilitas(await headers(), "masuk/keluar", { jenis: "SIGN_OUT", hasil: "OK", authUserId: pengguna.user.id });
  // L3 (D-132(e)): marked as /keluar marks it, so the person signing in next carries nothing of this session
  const toples = await cookies();
  toples.set(COOKIE_HADIR, "", { path: "/", maxAge: 0 });
  toples.set(COOKIE_SELESAI, "1", opsiTanda(appUrl().startsWith("https:")));
  redirect("/masuk");
}

/**
 * S15's "Lanjutkan". The destination is resolved server-side for the same
 * reason every other one is: `tujuanMasuk` needs the session to know the role,
 * and the narrowing must not be something a client can skip.
 */
export async function lanjutkanSesi(formData: FormData): Promise<void> {
  redirect(await tujuanMasuk(formData.get("lanjut")));
}
