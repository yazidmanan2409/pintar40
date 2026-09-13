import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { verifySignature } from "@/lib/certificates/keyring";
import { type CanonicalPayload } from "@/lib/certificates/sign";
import { decideValidity, type VerificationResponse } from "@/lib/certificates/verification";

/**
 * THE authoritative public certificate verification (INV-05, INV-38, D3b).
 *
 * WHY THIS EXISTS AT ALL. Until 0051 the public route reported `validity` from
 * `certificates.status` and never touched `signature`. INV-05's guarantee —
 * altering any protected field must fail verification — therefore did not hold
 * on the one path a printed QR code points at: alter the stored payload and the
 * page said BERLAKU. The tamper matrix passed because it exercised a different,
 * internal verifier. Two verification paths of unequal strength, which is the
 * shape INV-38 and INV-26 exist to prevent. Claude 1's review, finding 1.
 *
 * WHY HERE AND NOT IN THE PAGE. A recomputation needs three things at once: the
 * key, the stored payload, and an anonymous caller. The key is server-side by
 * design (a secret the database can read is a secret a database backup carries,
 * ADR-0007 §1), and the stored payload carries `result.score` and the identity
 * snapshot hash so it must never be anon-reachable. F01-S03 restricts
 * `@/lib/supabase/service` to `src/app/api/**` — it does not forbid it there,
 * and `/api/assets/read-url` has worked this way since FABLE-01. So the
 * privileged read moves to where the rule already allows it. No database
 * principal was added and F01-S03 is untouched. ADR-0013.
 *
 * WHAT LEAVES THIS HANDLER. Exactly D3b's five fields:
 * `{pass, predikat, institution, date, validity}`. Never a name, a photo, a
 * score, a key version, a signature, a payload, or an internal designation. The
 * projection itself is `verify_certificate`, still the single definition of
 * what is public and still asserted by set equality on its OUT parameters.
 *
 * VALIDITY CAN ONLY BE DOWNGRADED HERE. The database says ISSUED / REVOKED /
 * SUPERSEDED; this handler turns any of them into `TIDAK SAH` when the HMAC
 * does not match, and can never turn an invalid certificate into a valid one.
 *
 * NO EXISTENCE ORACLE. An unknown token, a malformed one and a prepared-but-
 * unissued one all return the same empty body with the same status, because
 * `verify_certificate` and `certificate_verification_material` apply the same
 * refusals in the same order.
 */
export const dynamic = "force-dynamic";

type Material = {
  canonical_payload: CanonicalPayload;
  signature: string | null;
  key_version: number | null;
};

export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const service = supabaseService();

  const { data: projected, error: projectionError } = await service.rpc("verify_certificate", {
    p_token: token,
  });
  if (projectionError || !Array.isArray(projected) || projected.length === 0) {
    // unknown, malformed, or not yet issued — indistinguishable by design
    return NextResponse.json({ found: false }, { status: 404 });
  }
  const row = projected[0] as VerificationResponse;

  const { data: material, error: materialError } = await service.rpc(
    "certificate_verification_material",
    { p_token: token },
  );
  if (materialError || !Array.isArray(material) || material.length === 0) {
    // the projection resolved and the material did not: the two disagree, which
    // is a fault rather than a verdict. Refuse rather than report BERLAKU.
    return NextResponse.json({ found: false }, { status: 404 });
  }
  const m = material[0] as Material;

  // The recomputation. `verifySignature` compares with crypto.timingSafeEqual
  // and returns false rather than throwing for a missing key version, so an
  // unconfigured deployment reports TIDAK SAH instead of an unverified BERLAKU.
  // The decision is `decideValidity`, which is pure and can only downgrade.
  const body: VerificationResponse = decideValidity(row, m, verifySignature);
  return NextResponse.json(body, { status: 200 });
}
