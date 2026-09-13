# 08 — PINTAR Content Versioning Contract

*Baseline amendment (2026-09-12): certificate binding corrected (release
identity and hash are inside the signed payload); release-correction /
active-learner policy added; "what must be versioned" generalized beyond
content to assessment definitions, engine and scoring policy; publication
vs assignment separated.*

## What "frozen" means

FROZEN means: a SHA-256 hash has been computed over exactly the columns
that define *what is taught* — lesson bodies, items, options, rationales,
misconception links, assessment definitions — and from that moment, any
UPDATE to those specific columns on those specific rows is rejected at the
database level. Freezing is permanent; there is no "unfreeze."

`APPROVED ≠ FROZEN`. APPROVED is a human governance fact (reviewer sign-off).
FROZEN is a technical fact (hash computed, rows locked). A release is
publishable only when both hold.

The hash deliberately **excludes** `created_at`, `status`, reviewer
metadata, and release/provenance fields — so operations that only touch
those never change the taught-content hash. If in doubt about whether a
column belongs inside or outside the hash, it belongs inside.

## What may still change after freeze

Nothing that is part of the hash. Non-hashed metadata may still change:
display-only labels explicitly scoped outside the hash at design time (an
explicit, documented list — not an assumption). If a field's in/out-of-hash
status is ambiguous when it's added, resolve it before shipping the
migration that adds the field, not after.

## What requires a new release

Any change to a hashed column, always. There is no "minor fix, no new
release needed" exception.

## What else must be versioned (beyond content)

Historical evidence must be interpretable under the rules it was produced
with (INV-29). The versioned identities are:

```
Content Release           (plp_release_id + content hash)
Assessment Definition     (id + version)
Assessment Engine         (engine_version)
Scoring Policy/Config     (scoring_policy_version)
        → Result
```
Version anything whose change could materially alter interpretation of
historical evidence (passing rules, safety-critical sets, weighting,
partial-credit, timeout/late-sync policy, hesitation bounds if they affect
telemetry semantics). Do not version meaningless implementation details.
Metric catalogue definitions are versioned the same way so a historical
report can state which definition of a metric it used (historical report
provenance — doc 09, FOUNDATION NOW).

## How typo corrections are handled

A typo in a FROZEN, PUBLISHED lesson requires a new release: STRUCTURED
(or later, depending on how much re-review the correction needs) →
VALIDATED → IN_REVIEW → APPROVED → FROZEN → PUBLISHED, superseding the
prior release. There is no "hotfix a frozen row" path, ever — this is
intentional friction, not an oversight to smooth away later. Publish
Readiness (doc 04 §1a) makes this path calm: for a valid package it should
feel closer to re-uploading a corrected file than administering a database.

## How incorrect misconception mappings are handled

Same as above — the `misconception_code` on an Option is part of the
hashed content. Fixing a wrong mapping is a new release. (The taxonomy
entry itself is append-only and separate from this — see domain model doc.)

## How historical assessment results are protected

Every Assessment Session records the exact `plp_release_id`, definition
version, engine version and scoring policy version it was taken under, at
creation/finalization. A later release superseding that one never alters
the historical session's interpretability — you can always ask "what did
this learner see, and under which rules was it scored" and get a frozen,
unambiguous answer.

## How a certificate proves which curriculum release was assessed

The Certificate's **signed payload** (INV-05) includes `plp_release_id`
**and the release's content hash**, the assessment definition id/version,
the learner identity snapshot (or its hash), the result, the issuance time,
the certificate number and the `key_version`. Verification recomputes the
HMAC over the stored canonical payload under the key named by
`key_version`; changing the protected release binding — or any other
protected field — causes verification failure. The earlier design that
placed `plp_release_id` outside the payload is withdrawn: it would have
allowed the binding to be swapped without detection. Identity-model churn
is handled by the *snapshot* (INV-30), not by leaving the binding unsigned.

## Publication is not assignment

Publishing a release makes it available within the institution. Learners
receive content only through a Learning Assignment (doc 02, doc 04 §4).
This separation is what makes the correction policy below expressible.

## How a corrected release affects existing learners (release-correction / active-learner policy)

Existing learner history **never silently mutates.** When Chapter 4 v1.0
has been used by 1,000 learners and a correction produces v1.1:

| Learner state under the Learning Assignment | Default behaviour | Governed alternative |
|---|---|---|
| **Completed** (post-test FINALIZED) | Remains historically v1.0 — sessions, results, certificates untouched | None. History is never rewritten. |
| **Active** (any session IN_PROGRESS/PAUSED, or lessons in progress) | Remains pinned to the authorized v1.0 | Explicit, audited governed intervention by `CAN_ASSIGN_LEARNING` (e.g. a safety-relevant correction), which moves *future* sessions only; in-progress sessions stay bound to the release they were created under |
| **Not started** | May be moved to v1.1 by an explicit authorized action on the Learning Assignment | The move records actor, reason, affected learner set, old and new release (INV-18) |

There is no automatic migration of in-flight or historical evidence to a
newer release, and no automatic re-pointing of not-started learners either
— every reassignment is an explicit, auditable act. The policy in force is
recorded on the Learning Assignment.

## How a new release affects active assessment sessions

An assessment session in progress stays bound to the release it was
created under, even if that release is superseded mid-session. Publishing
a new release must never invalidate or silently alter a session already in
`IN_PROGRESS`/`PAUSED` state.

## How a new release affects already-issued certificates

Not at all. A certificate's signed release binding remains valid and
verifiable indefinitely, regardless of how many later releases supersede
the one it points to. Verifying an old certificate never requires the
referenced release to still be the "current" one — only that it still
exists and its hash still matches the signed hash.

## Canonical hashing/versioning rules (conceptual)

- One hash per release, computed once, at the FROZEN transition, over a
  fixed, documented column set.
- Semantic version label (e.g. `1.0.0`, `1.1.0`) is a human-readable
  companion to the hash, not a replacement for it.
- A `supersedes` pointer chains releases; the chain is always walkable in
  both directions for audit purposes.
- Internal version designations (including "PINTAR 4.0") never appear on
  certificates, verification pages, learner/educator/administrator
  surfaces, emails, reports or public documentation; release versions of
  *content* are shown where a learner or verifier legitimately needs them.
- Cross-institution content sharing (LATER — doc 09) does not change these
  rules: a shared release is still one frozen, hashed object, regardless of
  how many institutions publish it.
