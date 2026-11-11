"use server";

import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { catatAkuntabilitas } from "@/app/api/_akuntabilitas/catat";
import { tujuanMasuk } from "@/app/masuk/actions";
import type { HasilTukar } from "@/lib/tukar-kontrak";

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
 *
 * BOB-38: IT ANSWERS SUCCESS, IT DOES NOT REDIRECT. A redirect thrown from a
 * server action rejects the caller's promise, and the page read every
 * rejection as a dead link, so each successful sign-in drew S14 first. The
 * destination is returned instead and the page leaves for it
 * (src/lib/tukar-kontrak.ts).
 *
 * B1 (execution requirement 2): a sign-in by link is recorded HERE, when the link is used, not when it was asked for:
 * a success with the user Auth signed in, or one failure (TAUTAN_TIDAK_BERLAKU) for a link that could not be used.
 * The link names no identifier this side can hash.
 */
export async function tukarKode(kode: string, lanjut: string): Promise<HasilTukar> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.exchangeCodeForSession(kode);
  await catatAkuntabilitas(await headers(), "auth/callback", !error && data.user?.id
    ? { jenis: "SIGN_IN_OK", cara: "LINK", hasil: "OK", authUserId: data.user.id }
    : { jenis: "SIGN_IN_FAILED", cara: "LINK", hasil: "TAUTAN_TIDAK_BERLAKU" });
  // ONE OUTCOME FOR EXPIRED AND ALREADY-USED. Distinguishing them tells a
  // person holding a forwarded link which of the two happened, which is
  // information about somebody else's activity.
  if (error) return { ok: false };
  return { ok: true, tujuan: await tujuanMasuk(lanjut) };
}
