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
  auth: { signOut(options: { scope: "local" }): Promise<unknown> };
}): Promise<void> {
  await supabase.auth.signOut({ scope: "local" });
}
