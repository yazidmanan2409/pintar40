# ADR-0010 — D3a and D3b: an opaque token, and a closed public payload

**Date:** 2026-09-14
**Phase:** FABLE-04
**Status:** Accepted — decisions taken by Yazid, 2026-09-13 (D3a Option A; D3b "no name")
**Supersedes:** the earlier five-field certificate payload, withdrawn by the phase prompt.
**Superseded by:** nothing.

---

## 1. D3a — the verification identifier is not the certificate number

**Decided: an opaque high-entropy token, distinct from the certificate number.**

The certificate number is a human-facing, institution-scoped, structured
identifier. Structure is exactly what makes it unsafe as a public lookup key:
anything a person can read off one certificate and increment is an enumeration
oracle for every other certificate that institution ever issued.

`certificates.verification_token` is therefore a separate column: at least 43
characters of URL-safe randomness, derived from nothing — not from the
certificate number, not from the session id, not from the person, not from a
sequence. F04-T10 asserts each of those non-derivations explicitly rather than
asserting "it looks random".

Two consequences fall out and are deliberate:

- **An unknown token returns no row at all.** Not an error, not a "not found"
  object that differs in shape from a found one. There is no existence oracle
  and no distinguishable timing between a well-formed unknown token and a
  malformed one.
- **An `ELIGIBLE` certificate — prepared but not yet sealed — returns nothing
  either.** A credential that has not been issued is not a credential.

## 2. D3b — the public payload carries no name

**Decided: exactly `pass · predikat · institution · date · validity/revocation
state`. No name, no photo, no score internals, no internal version string.**

This is not a preference; it is the frozen baseline read literally. Doc 02's
Verification Record enumerates the public-safe fields and doc 05's matrix cell
says "only". No exception clause exists anywhere in the baseline, so none is
written here.

The reasoning that makes it sit right: **a verifier already holds the
certificate.** The document carries the holder's identity, rendered from the
immutable snapshot. What a verifier needs from a public URL is confirmation
that *this credential* is valid and not revoked — not a second copy of the
identity, which would turn a verification endpoint into a people-search
endpoint for anyone who has ever scanned a QR code.

## 3. The exclusion is structural, and asserted three ways

A template that simply omits the name is one careless edit from leaking it. So:

1. `verify_certificate` **does not read** the snapshot's `name_as_issued`,
   `photo_path`, `photo_content_hash` or `display_name` columns at all, and
   `assert_public_surface()` fails the build against the function source if it
   ever does.
2. The projection is asserted by **set equality** on the OUT parameter names —
   `pass,predikat,institution,date,validity` — not by a "does not contain a
   name" scan, which would pass for any sixth field nobody thought to forbid.
3. A **probe is planted**: migration 0044 creates the leaky six-field version
   first, proves the gate goes red naming both reasons, drops it, and only then
   creates the real one. The assertion is demonstrated to bite before it is
   trusted.

That third point caught a genuine defect in the assertion itself. The first
version read `prorettype`, which for a `RETURNS TABLE` function is `record` and
carries no attributes — so the field check returned NULL for every function and
"caught" the probe for the wrong reason. It now reads `proargnames` /
`proargmodes`.

## 4. D4 (OD-10) is deferred, and the schema is built for both answers

Whether the certificate template shows a photo is **OD-10**, unanswered. The
snapshot therefore captures the name as issued and an optional photo storage
path plus content hash; rendering uses the name only. When OD-10 is answered
either way, no migration is needed — which is the whole reason to capture the
photo binding now rather than after issuance has begun, since a snapshot taken
later would no longer be the identity the certificate was issued against.
