/**
 * BOB-05 (D-009) — SIGN-OUT ENDS THIS DEVICE ONLY.
 *
 * supabase-js's signOut() with no options is scope "global": it revokes every
 * refresh token of the person, so pressing "Keluar" on the classroom's shared
 * tablet would also end their session on their phone, and a teacher leaving the
 * staff-room computer would be thrown out of the lesson they are running. Scope
 * "local" revokes this session's refresh token server-side and clears this
 * device's cookies; the person's other sessions stay.
 *
 * Every sign-out in src/ goes through here (BOB05-K01 asserts it).
 */
export async function keluarPerangkatIni(supabase: {
  rpc(fn: "sesi_akhiri_saya"): PromiseLike<unknown>;
  auth: { signOut(options: { scope: "local" }): Promise<unknown> };
}): Promise<void> {
  // BOB-29: PINTAR's own record of this session ends first, so the rest of its access token's life is refused by
  // the database too (a locked session may still leave). Unreadable, it holds nothing: Auth still signs out.
  await Promise.resolve(supabase.rpc("sesi_akhiri_saya")).catch(() => undefined);
  await supabase.auth.signOut({ scope: "local" });
}

/**
 * BOB-29: «KELUAR DARI SEMUA PERANGKAT», confirmed on Akun saya. Every session of the person ends in the database
 * (sesi_akhiri_semua: each recorded and audited, their Auth sessions deleted, so no refresh succeeds), then this
 * device's cookies go the ordinary way. Not Auth's global sign-out, which BOB-05 keeps out of src/.
 */
export async function keluarSemuaPerangkat(supabase: {
  rpc(fn: "sesi_akhiri_saya" | "sesi_akhiri_semua"): PromiseLike<{ error: unknown }>;
  auth: { signOut(options: { scope: "local" }): Promise<unknown> };
}): Promise<boolean> {
  const { error } = await supabase.rpc("sesi_akhiri_semua");
  if (error) return false;
  await keluarPerangkatIni(supabase);
  return true;
}

/**
 * BOB-27 (Gate 4): A RECOVERY CODE IS NOT A SIGN-IN. Auth's verifyOtp proves the
 * inbox by making a session; that session is ended here at once, scope "local"
 * (that session only), so the person's other sessions are neither ended nor
 * joined by a code check.
 */
export async function akhiriSesiVerifikasi(
  admin: { auth: { admin: { signOut(jwt: string, scope: "local"): Promise<unknown> } } },
  token: string,
): Promise<void> {
  await admin.auth.admin.signOut(token, "local");
}
