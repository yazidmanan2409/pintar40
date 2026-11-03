import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publicSupabaseAnonKey, publicSupabaseUrl } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { accessTokenExpiry, sisihkanSesiPenilai, writePersonaSessionCookie } from "@/lib/evaluation";

/**
 * Persona assumption — the privileged half (ADR-0020, Task 2 §8).
 *
 * THE SPLIT, AND WHY IT IS HERE AND NOT IN A LIB. F01-S03 permits the
 * service-role client only under `src/app/api/`, and that rule predates this
 * feature and is better than it. Same shape as certificate issuance: the
 * caller's authority is checked with the CALLER'S OWN client, and only the
 * privileged step runs with the service one.
 *
 * WHAT THIS ROUTE MUST NEVER DO, because the failure of any of these is silent
 * and pinned by EVAL-S01:
 *   1. persist, return or log a refresh token for a persona session;
 *   2. mint or renew a persona session anywhere else;
 *   3. sign a persona in with a credential — there is none to use;
 *   4. record an expiry that is not the minted token's own `exp`.
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const personaId = String(form?.get("persona_id") ?? "");
  const back = new URL("/evaluasi", request.url);
  if (!personaId) {
    back.searchParams.set("galat", "1");
    return NextResponse.redirect(back, { status: 303 });
  }

  const caller = await supabaseServer();
  const { data: { user } } = await caller.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/masuk", request.url), { status: 303 });

  // The evaluator gate is the DATABASE's, asked under the evaluator's own
  // token, before anything is minted. A non-evaluator never reaches the mint.
  const { error: hubError } = await caller.rpc("evaluation_hub");
  if (hubError) {
    back.searchParams.set("galat", "1");
    return NextResponse.redirect(back, { status: 303 });
  }
  const { data: me } = await caller.from("my_profile").select("person_id").maybeSingle();
  const evaluatorPersonId = me?.person_id as string | undefined;
  if (!evaluatorPersonId) {
    back.searchParams.set("galat", "1");
    return NextResponse.redirect(back, { status: 303 });
  }

  const service = supabaseService();
  const { data: personaRows } = await service
    .from("evaluation_personas").select("id, person_id").eq("id", personaId).limit(1);
  const personaPersonId = personaRows?.[0]?.person_id as string | undefined;
  if (!personaPersonId) {
    back.searchParams.set("galat", "1");
    return NextResponse.redirect(back, { status: 303 });
  }
  const { data: accountRows } = await service
    .from("accounts").select("auth_user_id").eq("person_id", personaPersonId).limit(1);
  const personaAuthUserId = accountRows?.[0]?.auth_user_id as string | undefined;
  if (!personaAuthUserId) {
    back.searchParams.set("galat", "1");
    return NextResponse.redirect(back, { status: 303 });
  }
  const { data: personaUser } = await service.auth.admin.getUserById(personaAuthUserId);
  const email = personaUser?.user?.email;
  if (!email) {
    back.searchParams.set("galat", "1");
    return NextResponse.redirect(back, { status: 303 });
  }

  // MINT. The persona has no password — the seed gives it none and
  // `assert_evaluation_boundary` refuses a database where one appears — so an
  // admin link consumed immediately is the only way a persona session exists.
  const { data: link } = await service.auth.admin.generateLink({ type: "magiclink", email });
  const hashedToken = link?.properties?.hashed_token;
  if (!hashedToken) {
    back.searchParams.set("galat", "1");
    return NextResponse.redirect(back, { status: 303 });
  }
  // persistSession:false and autoRefreshToken:false are the control, not
  // hygiene: this client must be incapable of keeping or renewing what it gets.
  const oneShot = createClient(publicSupabaseUrl(), publicSupabaseAnonKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: verified } = await oneShot.auth.verifyOtp({ token_hash: hashedToken, type: "email" });
  const accessToken = verified?.session?.access_token;
  if (!accessToken) {
    back.searchParams.set("galat", "1");
    return NextResponse.redirect(back, { status: 303 });
  }
  // The refresh token is present in `verified.session` and is deliberately never
  // destructured, stored, returned or logged. Reading it is the renewal path
  // this design does not have.
  const expiresAt = accessTokenExpiry(accessToken);

  // The expiry recorded is the one THIS SERVER read out of the token it just
  // minted. `assume_persona` is service-role-only precisely so that this
  // assertion can only be made by the party able to make it truthfully; the
  // database stores it, it does not verify the JWT.
  const { error: assumeError } = await service.rpc("assume_persona", {
    p_evaluator: evaluatorPersonId,
    p_persona: personaId,
    p_token_expires_at: expiresAt.toISOString(),
  });
  if (assumeError) {
    back.searchParams.set("galat", "1");
    return NextResponse.redirect(back, { status: 303 });
  }

  // the evaluator's own session is set aside, unchanged, to be put back when they leave (not lost: ADR-0020's
  // «exit to the Hub, then assume»; owner, Batch 5 promotion gate)
  await sisihkanSesiPenilai();
  await writePersonaSessionCookie(accessToken, expiresAt);
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
