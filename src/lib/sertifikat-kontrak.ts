/**
 * The certificate contract as the Experience reads it: the column list, the
 * four states, and what each state may render.
 *
 * DELIBERATELY A MODULE OF ITS OWN WITH NO PRIVILEGED IMPORT, for the same
 * reason `src/lib/certificates/verification.ts` is: a page, a component and a
 * test all need these, and importing them from the module that holds
 * `server-only` and a Supabase client would pull that whole graph in behind
 * them. UX1-S1-CERT-COLS-01 and UX1-S1-CERT-ELIGIBLE-01 assert against exactly
 * these values, and a test that could not import them without a server runtime
 * would be a test nobody runs.
 */

/** The ten columns, and no other. Q-11. */
export const LIST_COLUMNS =
  "id, session_id, institution_id, certificate_number, verification_token, status, issued_at_iso, revoked_at, revoked_reason, supersedes_certificate_id";

export type CertificateStatus = "ELIGIBLE" | "ISSUED" | "REVOKED" | "SUPERSEDED";

export type CertificateRow = {
  id: string;
  session_id: string;
  institution_id: string;
  certificate_number: string | null;
  verification_token: string | null;
  status: CertificateStatus;
  issued_at_iso: string;
  revoked_at: string | null;
  revoked_reason: string | null;
  supersedes_certificate_id: string | null;
};

/** What `my_certificate(p_session)` returns: seven fields, no key material. */
export type CertificateDetail = {
  certificate_id: string;
  certificate_number: string;
  verification_token: string;
  status: CertificateStatus;
  issued_at_iso: string;
  predikat: string | null;
  name_as_issued: string;
};

/**
 * A certificate renders as a credential only once it has been issued.
 *
 * WHY ELIGIBLE SHOWS NOTHING (OBSERVED, hosted, 2026-09-16). `certificate_prepare`
 * creates the row as ELIGIBLE with `verification_token`, `certificate_number`,
 * `issued_at_iso` and an identity snapshot ALREADY ASSIGNED — and
 * `verify_certificate` refuses an ELIGIBLE token. A link shown in this state
 * would send a stranger to "not found" for a certificate the learner had just
 * been shown as real. So while a certificate is ELIGIBLE the QR code, the
 * verification link, the copy-link action, the print action, the certificate
 * number and the name-as-issued are all suppressed.
 *
 * Under the V-6a ruling ELIGIBLE is the DEFAULT state in Slice 1, not an edge
 * case: nothing issues yet.
 */
export function rendersCredential(status: CertificateStatus): boolean {
  return status !== "ELIGIBLE";
}

/** Only an ISSUED certificate is a credential to present. */
export function rendersVerification(status: CertificateStatus): boolean {
  return status === "ISSUED";
}
