import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { keluarPerangkatIni } from "@/lib/keluar";

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
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
