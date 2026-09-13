/**
 * The shape of the public verification response, and the one state that is not
 * a database status.
 *
 * Deliberately a module of its own with NO privileged import. The page needs
 * the `TIDAK SAH` constant to render the invalid case, and importing it from
 * the API route would pull `@/lib/supabase/service` into the page's module
 * graph — textually invisible to F01-S03, and exactly the indirection that rule
 * exists to prevent. A shared constant is the honest way to share a constant.
 */

/** D3b: the closed public payload. Adding a field here is a D3b change. */
export type VerificationResponse = {
  pass: boolean | null;
  predikat: string | null;
  institution: string | null;
  date: string | null;
  validity: string | null;
};

/**
 * Reported when the recomputed HMAC does not match the stored signature. No
 * certificate row ever carries it: `certificate_status` is ELIGIBLE / ISSUED /
 * REVOKED / SUPERSEDED, and this is the verifier's verdict, not the issuer's.
 */
export const TAMPERED = "TIDAK SAH";

/**
 * The verification decision itself: does the stored signature match a
 * recomputation over the stored payload, and therefore what may this
 * certificate's validity be reported as?
 *
 * Pure and free of any privileged import, so the decision the public route
 * relies on can be exercised directly against real stored rows without a
 * PostgREST endpoint in front of it. The route is the adapter that fetches the
 * two rows and calls this; F04-S01 asserts statically that it calls exactly
 * this and nothing else, F04-S04 drives this over a real sealed certificate,
 * and F04-S05 drives the whole handler in CI.
 *
 * `validity` can only be DOWNGRADED here. A certificate the issuer already
 * marked REVOKED stays revoked whether or not the signature checks out; one
 * whose signature fails becomes TIDAK SAH whatever the issuer said. There is no
 * input to this function that turns an invalid certificate into a valid one.
 */
export function decideValidity(
  projected: VerificationResponse,
  material: { canonical_payload: unknown; signature: string | null; key_version: number | null },
  verify: (payload: Record<string, unknown>, keyVersion: number, signature: string) => boolean,
): VerificationResponse {
  const signed =
    material.signature !== null &&
    material.key_version !== null &&
    verify(material.canonical_payload as Record<string, unknown>, material.key_version, material.signature);
  return {
    pass: projected.pass,
    predikat: projected.predikat,
    institution: projected.institution,
    date: projected.date,
    validity: signed ? projected.validity : TAMPERED,
  };
}
