# ADR-0009 — D2: certificates are `INSTITUTION_SCOPED`

**Date:** 2026-09-14
**Phase:** FABLE-04
**Status:** Accepted — decision taken by Yazid, 2026-09-13 (Option A)
**Supersedes:** nothing. **Superseded by:** nothing.
**Amends:** nothing. Extends the record-class registry ADR-0001 established.

---

## 1. The question

FABLE-01 built a record-class registry: every table declares whether its rows
are `PORTABLE` (they follow the person across a transfer) or
`INSTITUTION_SCOPED` (they stay with the institution that produced them).
`certificates` and `certificate_identity_snapshots` are new tables and had to
declare one.

## 2. The decision, and why it is not obvious

**`INSTITUTION_SCOPED`, for both tables.**

The argument for `PORTABLE` is real and worth recording: a certificate is an
achievement, achievements belong to the learner, and a learner who transfers
schools does not stop having passed. On that reading a certificate is exactly
the kind of record portability exists for.

It loses to a stronger one. A certificate is an **institutional attestation**:
it says *this institution* certifies *this result* under *this release* of
*its* content, signed with a key the platform holds on that institution's
behalf. Carrying the row into a receiving institution would make that
institution appear to have attested something it never saw, and would put the
issuing institution's content release, passing threshold and scoring policy
into a tenant that uses none of them. INV-13 is not a filing convention here;
the row genuinely belongs to the issuer.

The learner does not lose the achievement. They hold the certificate, and the
public verification route confirms it against the issuer — which is precisely
what a credential is for, and why §9's route exists at all. Portability of the
*document* is a property of the document, not of the database row.

## 3. What follows mechanically

- Both tables carry `institution_id`, RLS scoped to it, and the tenant-immutability
  trigger FABLE-01 applies to every scoped table.
- A transfer carries neither table. F04-T13 asserts the registry rows and, in
  the same test, that no `certificate%` table appears in the `PORTABLE` set.
- Every certificate RPC takes the cross-tenant probe §9 makes mandatory: a
  learner from institution A attempting institution B's certificate, snapshot
  and revocation, each refused (F04-T12).

## 4. The identity snapshot follows the certificate, not the person

`certificate_identity_snapshots` could have been argued as portable on the
grounds that it holds identity attributes. It is not, and the reason is INV-30:
the snapshot exists so that *later profile changes never alter an issued
certificate*. A row that travelled with the person and remained editable in the
receiving tenant would defeat the invariant it was created to enforce. It is
immutable, institution-scoped, and read only by rendering and verification.
