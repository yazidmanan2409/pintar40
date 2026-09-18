"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { deriveCardSecret } from "@/lib/card";
import { appUrl } from "@/lib/env";
import { tujuanInternal } from "@/lib/tujuan";

export async function sendMagicLink(formData: FormData): Promise<{ ok: boolean }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  // L-1. Narrowed BEFORE it is embedded in the email, so a poisoned
  // destination never reaches a learner's inbox at all. The callback narrows
  // it again on the way back, for the link nobody here built.
  const next = tujuanInternal(formData.get("lanjut"));
  if (!email) return { ok: false };
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
      emailRedirectTo: `${origin}/auth/callback?lanjut=${encodeURIComponent(next)}`,
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
  return { ok: !error || tidakTerdaftar(error) };
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

export async function signInWithCard(formData: FormData): Promise<void> {
  const card = String(formData.get("kartu") ?? "").replace(/\D/g, "");
  const pin = String(formData.get("pin") ?? "").replace(/\D/g, "");
  // L-1. A server action is reachable by a caller that never rendered the
  // form, so the hidden field is untrusted input however it was drawn.
  const next = tujuanInternal(formData.get("lanjut"));
  if (!card || !pin) redirect("/masuk?kartu=gagal");
  const supabase = await supabaseServer();
  const host = process.env.CARD_EMAIL_DOMAIN ?? "cards.pintar.internal";
  const { error } = await supabase.auth.signInWithPassword({
    email: `card-${card}@${host}`,
    password: deriveCardSecret(card, pin),
  });
  if (error) redirect("/masuk?kartu=gagal");
  redirect(next);
}

export async function signOut(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/?keluar=1");
}
