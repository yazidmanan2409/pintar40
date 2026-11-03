import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { keluarPerangkatIni } from "@/lib/keluar";
import { COOKIE_HADIR, COOKIE_SELESAI, opsiTanda } from "@/lib/tanda-keluar";
import { akhiriSesiPenilai } from "@/lib/evaluation";

/**
 * Sign out. CHANGED FOR ADR-0020: if the signer-out is currently a persona,
 * the evaluation session is ended SERVER-SIDE first.
 *
 * Clearing the cookie alone would leave a live `evaluation_sessions` row behind
 * — an evaluator recorded as still viewing as someone they have left, an
 * occupied persona nobody can assume, and a pairing that keeps stamping any
 * action the token could still take. `exit_persona` is a no-op when the caller
 * is not a persona, so this costs an ordinary sign-out one refused RPC and
 * nothing else.
 *
 * BOB-05 (D-009): the sign-out ends THIS device's session only.
 */
export async function POST(request: NextRequest) {
  const supabase = await supabaseServer();
  await supabase.rpc("exit_persona");
  // this device only (D-009, BOB-05): the person's other sessions stay
  await keluarPerangkatIni(supabase);
  // ADR-0020 «evaluator logout terminates both»: an evaluator's own session, set aside while a persona was active, is
  // ended at Auth too and its cookies removed (a no-op for everyone else)
  await akhiriSesiPenilai();
  // L3 (D-132(e)): the sign-out mark. The session's context ended with its row (sesi_akhiri_inti); the mark keeps a
  // stale continuation from this session out of the next sign-in on this browser (src/lib/tanda-keluar.ts).
  const ke = NextResponse.redirect(new URL("/", request.url), { status: 303 });
  ke.cookies.set(COOKIE_HADIR, "", { path: "/", maxAge: 0 });
  for (const c of request.cookies.getAll().filter((x) => x.name.startsWith("pintar-penilai."))) ke.cookies.set(c.name, "", { path: "/", maxAge: 0 });
  ke.cookies.set(COOKIE_SELESAI, "1", opsiTanda(request.nextUrl.protocol === "https:"));
  return ke;
}
