# FABLE-04 — Assessment Engine, Certificates & Verification

Depends on Phases 1–3.

## 1. Assessment session assembly

A server-side session assembler that, given a course/module and blueprint,
selects items respecting: difficulty mix, safety-critical minimum, shuffle
flags, and (for post-test) exclusion of items already seen at a rate that
would compromise psychometric validity. Session state (current item,
flags, pause state, elapsed time) is server-authoritative — the client is a
view onto it, not the source of truth, so a refresh or device switch can't
be used to reset a timer or reroll items.

## 2. Scoring

- `learner_id` is derived server-side from the authenticated session, never
  trusted from the request body.
- Final score/pass determination is computed server-side from raw item
  responses at finalize time — never trust a client-submitted summary.
- Recompute independently at certificate-issuance time as a second,
  deliberately redundant gate against the same raw responses.

## 3. Certificates — cryptographic core

```
payload = `${user_id}|${score}|${timestamp_iso}|${certificate_number}|${key_version}`
hash    = HMAC-SHA256(payload, SECRET_KEY[key_version])
```
- Design the keyring from the first migration: `key_version SMALLINT
  DEFAULT 1` column, secrets read from versioned env vars
  (`CERT_SECRET_KEY_V1`, `_V2`, …), old keys demoted to verify-only once
  rotated. Do not ship a single non-versioned secret and plan to add
  versioning "later" — that ordering is what made rotation impossible in a
  prior build.
- Verification recomputes and compares with a timing-safe equality check
  (e.g. `crypto.timingSafeEqual`), never `===` on the hash strings.
- Secret must be ≥32 chars; the app throws at boot in production if unset.
- `timestamp_iso` is stored as the exact string used inside the HMAC
  payload — don't reformat it on read.
- Duplicate the signed identity (e.g. a `subject_hmac`-style column)
  alongside the FK, so identity-model changes later can never silently
  change what an already-printed certificate's hash covers.

## 4. Certificate numbering & idempotency

- One certificate numbering scheme, tied to the session id with a UNIQUE
  constraint, so concurrent finalize calls can never mint two numbers for
  one session.
- Only formal stages (post-test / exam) certify. Practice never scores;
  pre-test is a starting point, never an achievement.
- Certificate issuance never blocks or fails the learner's results view —
  if issuance errors, the results still render, and a retry path exists on
  next load.

## 5. Public verification — one route, not two

Build exactly one canonical public verification surface (e.g.
`/verifikasi/[id]`). It returns pass/predikat/institution/date only — never
score internals or other personal data. If you need a QR-friendly short
path too, make it a permanent redirect to the canonical route, not a second
independent implementation.

## 6. Storage of certificate records

Certificates persist in Postgres from the first migration — never as an
in-process in-memory store (that doesn't survive a restart or a second
server instance). Verify this by actually restarting the app between
issuing and verifying a certificate in testing.

## Acceptance checklist — as an automated suite (must be green before Phase 5)

- [ ] Test: a certificate issued, then verified after a full process
      restart, still verifies correctly.
- [ ] Test: firing two concurrent finalize requests for the same session
      produces exactly one certificate row.
- [ ] Test: tampering with any byte of a certificate's payload or hash makes
      verification fail; assert the code path uses a timing-safe compare
      (not just that it returns false).
- [ ] Test: a classroom-card learner can fetch their own certificate via
      their own profile/certificates endpoint.
- [ ] Static check: only one verification URL shape exists in the routes
      (or a second exists only as a redirect to it).
- [ ] Test: issuing under key `_V1`, then adding `_V2` and pointing new
      issuance at it, leaves the `_V1` certificate still verifiable.

Add these to the running `selftest` suite alongside Phases 1–3's tests.
