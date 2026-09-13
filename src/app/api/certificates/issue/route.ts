import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseService } from "@/lib/supabase/service";
import { assertKeyringUsable, signingKeyVersion, signPayload } from "@/lib/certificates/keyring";
import { type CanonicalPayload } from "@/lib/certificates/sign";

/**
 * Certificate issuance (§7, §8).
 *
 * THE SPLIT. The database owns everything deterministic — the identity
 * snapshot, the number, the opaque token, `issued_at` and the canonical
 * payload. This route owns the key, and only the key: it signs the payload the
 * database produced and hands back a signature. The internal certificate
 * functions carry no client grant at all (§7), so they are reachable only from
 * here, with the service client.
 *
 * OWNERSHIP IS CHECKED WITH THE CALLER'S OWN CLIENT, NOT THE SERVICE ONE.
 * `session_is_mine` runs under the caller's JWT, so the answer comes from
 * `current_person_id()` inside the database. Passing a session id to the
 * service client without that check would be the FABLE-03 defect class again —
 * an internal function reachable with somebody else's resource id.
 *
 * ISSUANCE NEVER BLOCKS THE RESULTS VIEW (§8). Every failure here returns a
 * status the results page renders around; it never throws into the page, and
 * the next load retries because `certificate_prepare` is idempotent.
 */
export async function POST(request: Request) {
  let sessionId: string | null = null;
  try {
    const body = (await request.json()) as { session_id?: string };
    sessionId = body.session_id ?? null;
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }
  if (!sessionId) return NextResponse.json({ error: "session_id is required" }, { status: 400 });

  const caller = await supabaseServer();
  const { data: mine, error: mineError } = await caller.rpc("session_is_mine", { p_session: sessionId });
  if (mineError) return NextResponse.json({ error: "not available" }, { status: 403 });
  if (mine !== true) return NextResponse.json({ error: "not available" }, { status: 403 });

  try {
    assertKeyringUsable();
  } catch {
    // no key configured: the results page still renders, and a later load retries
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }

  const keyVersion = signingKeyVersion();
  const service = supabaseService();

  const { data: prepared, error: prepareError } = await service.rpc("certificate_prepare", {
    p_session: sessionId,
    p_key_version: keyVersion,
  });
  if (prepareError || !Array.isArray(prepared) || prepared.length === 0) {
    return NextResponse.json({ status: "not_eligible" }, { status: 200 });
  }
  const row = prepared[0] as {
    certificate_id: string;
    canonical_payload: CanonicalPayload;
    already_sealed: boolean;
  };
  if (row.already_sealed) {
    return NextResponse.json({ status: "issued", certificate_id: row.certificate_id }, { status: 200 });
  }

  const signature = signPayload(row.canonical_payload, keyVersion);
  const { error: sealError } = await service.rpc("certificate_seal", {
    p_certificate: row.certificate_id,
    p_key_version: keyVersion,
    p_signature: signature,
  });
  if (sealError) return NextResponse.json({ status: "pending" }, { status: 200 });

  return NextResponse.json({ status: "issued", certificate_id: row.certificate_id }, { status: 200 });
}
