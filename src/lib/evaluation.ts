import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { publicSupabaseUrl } from "@/lib/env";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Human Evaluation persona switching — the server half (ADR-0020, Task 2).
 *
 * THE ONE PROPERTY EVERYTHING ELSE RESTS ON. A persona's authorization ends
 * when its ACCESS TOKEN dies, and nothing renews it. That is the whole expiry
 * control: at the token's `exp` the platform rejects the JWT before any PINTAR
 * code runs, so `auth.uid()` is null, `current_person_id()` is null, and every
 * authenticated path refuses — for all five personas, including the learner,
 * who holds no role and whom no database-side lever could have bounded.
 *
 * So this file must never:
 *   1. persist, return, log or expose a refresh token for a persona session;
 *   2. mint or renew a persona session anywhere but `assumePersona` below;
 *   3. give a persona a credential anybody can use independently;
 *   4. record an evaluation-session expiry that differs from the token's.
 *
 * Those four are pinned by EVAL-S01, which reads this file. They are written as
 * prohibitions rather than intentions because the failure of any one of them is
 * silent: the facility keeps working, and the boundary is simply gone.
 *
 * ON (4) AND WHAT THE DATABASE IS AND IS NOT DOING. `assume_persona` stores the
 * expiry this module passes it, verbatim — it does not decode the JWT and
 * cannot verify the claim. The stored value is therefore **bound to a value
 * asserted by the trusted server under the service-role trust boundary**, not
 * independently derived by the database. That is why `assume_persona` is
 * revoked from `authenticated` and granted to `service_role` alone: the
 * assertion is only as trustworthy as the caller, so only the caller that
 * minted the token may make it.
 *
 * WHERE THE PRIVILEGED HALF LIVES. Minting is in
 * `src/app/api/evaluation/assume/route.ts`, not here. F01-S03 permits the
 * service-role client only under `src/app/api/`, and that rule is older than
 * this feature and better than it: the same split the certificate route uses.
 * This module holds only what the caller's own session can do.
 */

/** The `exp` claim of a Supabase access token, as a Date. Never trusts a caller. */
export function accessTokenExpiry(accessToken: string): Date {
  const parts = accessToken.split(".");
  if (parts.length !== 3) throw new Error("persona access token is not a JWT");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as { exp?: number };
  if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
    throw new Error("persona access token carries no exp claim");
  }
  return new Date(payload.exp * 1000);
}

/** The cookie `@supabase/ssr` keeps the session in, derived from the project ref. */
export function sessionCookieName(): string {
  const host = new URL(publicSupabaseUrl()).hostname;
  const ref = host.split(".")[0];
  return `sb-${ref}-auth-token`;
}

/**
 * Write the persona's session cookie with NO refresh material, and with the
 * cookie's own lifetime tied to the token's. Two independent reasons the
 * session cannot outlive the token: the JWT stops verifying, and the cookie
 * carrying it is gone.
 */
export async function writePersonaSessionCookie(accessToken: string, expiresAt: Date) {
  const jar = await cookies();
  const session = {
    access_token: accessToken,
    // empty, not omitted: the SSR client reads this shape, and an empty value
    // gives it nothing to renew with rather than a token it would happily use.
    refresh_token: "",
    token_type: "bearer",
    expires_at: Math.floor(expiresAt.getTime() / 1000),
    expires_in: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
  };
  jar.set(sessionCookieName(), `base64-${Buffer.from(JSON.stringify(session)).toString("base64")}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export type PersonaCard = {
  persona_id: string;
  label: string;
  role_perspective: string;
  institution_name: string;
  ordinal: number;
};

/** The personas this viewer may assume. Refuses a non-evaluator by name. */
export async function evaluationHub(): Promise<{ personas: PersonaCard[]; refused: boolean }> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("evaluation_hub");
  if (error) return { personas: [], refused: true };
  return { personas: (data ?? []) as PersonaCard[], refused: false };
}

export type EvaluationState = {
  evaluation_session_id: string;
  label: string;
  role_perspective: string;
  institution_name: string;
  expires_at: string;
  expired: boolean;
};

/**
 * The banner's source of truth. Read from the evaluation session on every
 * render — never from client state — so the indicator survives a refresh and
 * cannot be dismissed (ADR-0020).
 */
export const evaluationState = cache(async (): Promise<EvaluationState | null> => {
  // W3.13: asked once per request -- the band and the page title inside the room (F9) share the answer
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("evaluation_state");
  if (error || !Array.isArray(data) || data.length === 0) return null;
  return data[0] as EvaluationState;
});

/**
 * Leave a persona. The session is ended SERVER-SIDE first — a cookie clear
 * alone would leave a live pairing behind and a token still stamping audit
 * rows — and only then is the cookie dropped.
 */
export async function exitPersona(): Promise<void> {
  const supabase = await supabaseServer();
  await supabase.rpc("exit_persona");
  const jar = await cookies();
  jar.delete(sessionCookieName());
}
