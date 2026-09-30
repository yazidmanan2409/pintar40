import "server-only";
import { supabaseService } from "@/lib/supabase/service";

/**
 * BOB-25 part (5), C-09: A CODE IS ISSUED BY AUTH AND CARRIED BY PINTAR.
 *
 * Supabase Auth issues the activation or recovery code through the admin
 * `generate_link` endpoint and returns it as `email_otp`. Auth sends nothing
 * for an admin link; PINTAR's own email carries the code (kirim.ts), and
 * `verifyOtp` checks it (Gate 3). This lives under src/app/api/ because it uses
 * the service-role client, which F01-S03 allows nowhere else.
 *
 * IT CAN NEVER CREATE AN AUTH USER. The caller names an existing user by id;
 * the email is read from that user, so an address that has no user cannot
 * reach generate_link through here. Who may receive a code at all (a
 * provisioned person whose set-up is unfinished, D-054(a)) is the caller's
 * rule (Gate 3), decided before this is called.
 *
 * The code is returned to the caller for one email and nothing else: it is
 * never logged, stored or returned to a browser.
 */
export async function terbitkanKodeEmail(authUserId: string): Promise<{ email: string; kode: string } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(authUserId)) return null;
  const db = supabaseService();
  const { data: pengguna, error: galatPengguna } = await db.auth.admin.getUserById(authUserId);
  const email = pengguna?.user?.email;
  if (galatPengguna || !email) return null;
  const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
  const kode = data?.properties?.email_otp;
  if (error || !kode) return null;
  return { email, kode };
}
