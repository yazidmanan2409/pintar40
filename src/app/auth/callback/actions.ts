"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { tujuanMasuk } from "@/app/masuk/actions";

/**
 * THE CODE EXCHANGE, as an action rather than as a route.
 *
 * It used to be a route handler that redirected. A route handler cannot show
 * anybody anything: the browser sits on a blank document while the exchange
 * happens, and when it fails it redirects to a protected page, is bounced to
 * the sign-in screen, and the person is left to work out for themselves that
 * their link had aged out. S13 and S14 exist to answer that, which means the
 * browser has to land on something that renders immediately and then does the
 * work — so the page renders and this does the work.
 *
 * It stays on the server because the exchange sets the session cookie, and a
 * server action is the one thing a client component can call that still can.
 */
export async function tukarKode(kode: string, lanjut: string): Promise<{ ok: false }> {
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(kode);
  // ONE OUTCOME FOR EXPIRED AND ALREADY-USED. Distinguishing them tells a
  // person holding a forwarded link which of the two happened, which is
  // information about somebody else's activity.
  if (error) return { ok: false };
  redirect(await tujuanMasuk(lanjut));
}
