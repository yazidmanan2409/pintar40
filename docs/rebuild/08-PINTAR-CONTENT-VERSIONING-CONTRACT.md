# 08 — PINTAR Content Versioning Contract

## What "frozen" means

FROZEN means: a SHA-256 hash has been computed over exactly the columns
that define *what is taught* — lesson bodies, items, options, rationales,
blueprints — and from that moment, any UPDATE to those specific columns on
those specific rows is rejected at the database level. Freezing is
permanent; there is no "unfreeze."

The hash deliberately **excludes** `created_at`, `status`, reviewer
metadata, and release/provenance fields — so operations that only touch
those (e.g. attaching a certificate binding, correcting a typo in an
unrelated non-hashed column, if any exists) never change the taught-content
hash. If in doubt about whether a column belongs inside or outside the
hash, it belongs inside — the hash is meant to answer "did the actual
teaching content change," and erring toward including a field is the safe
default.

## What may still change after freeze

Nothing that is part of the hash. Non-hashed metadata may still change:
release-to-certificate bindings (additive, per INV-05), display-only
labels that were explicitly scoped outside the hash at design time (must
be an explicit, documented list — not an assumption). If a field's
in/out-of-hash status is ambiguous when it's added, resolve it before
shipping the migration that adds the field, not after.

## What requires a new release

Any change to a hashed column, always. There is no "minor fix, no new
release needed" exception — a hash that can be edited without a new
release isn't providing the guarantee it exists for.

## How typo corrections are handled

A typo in a FROZEN, PUBLISHED lesson requires a new release: STRUCTURED
(or later, depending on how much re-review the correction needs) →
VALIDATED → IN_REVIEW → APPROVED → FROZEN → PUBLISHED, superseding the
prior release. There is no "hotfix a frozen row" path, ever — this is
intentional friction, not an oversight to smooth away later.

### Implementation note (FABLE-05, ADR-0016) — a correction is a new COURSE

The contract above says "a new release". What FABLE-05 had to decide is
what the release is a release *of*, because a frozen course's rows cannot
be edited to produce it: `content_is_sealed` and
`enforce_taught_content_immutable` refuse every write, which is INV-04
doing its job.

So a correction is a **new course, deep-copied from the sealed one**
(`create_course_revision`), carrying a lineage pointer on every node it
creates — `supersedes_course_id`, `supersedes_module_id`,
`supersedes_lesson_id`, `supersedes_learning_objective_id`,
`supersedes_item_id`. The copy lands at the content lifecycle's entry
state and then walks the ordinary path above. Its release chains to the
predecessor through the existing `plp_releases.supersedes_release_id`.

Three things this does **not** do, and each is asserted:

- it does not relax `content_is_sealed` or the immutability trigger — the
  revision works *around* them by inserting into a new, unsealed course,
  never *through* them;
- it does not re-point any existing assignment, session, result,
  certificate or evidence row;
- it does not change the content hash basis. The revision's release hashes
  its own content exactly as any first release does, and the predecessor's
  stored hash is byte-identical before and after the whole operation.

**A correction is therefore never an edit.** The predecessor course, its
rows, and all evidence bound to them are preserved permanently and stay
immutable. "What did this learner see" is still answered by looking up
that specific release, and the answer is still frozen.

The copy carries **no empirical value**: `empirical_difficulty`,
`empirical_discrimination` and `empirical_evidence_count` are NULL on
every revised item, because a revised item has no evidence of its own and
inheriting another item's numbers would state a measurement never taken.

Correcting a live assignment onto the successor uses
`move_learning_assignment_release`, whose course check reads the lineage
chain rather than requiring an exact course match — without that, every
correction would be refused on its first use, since a revision is a new
course.

## How incorrect misconception mappings are handled

Same as above — the `misconception_code` on an Option is part of the
hashed content. Fixing a wrong mapping is a new release. (The taxonomy
entry itself, `MisconceptionTaxonomy`, is append-only and separate from
this — see domain model doc.)

## How historical assessment results are protected

Every Assessment Session records the exact `plp_release_id` it was taken
against, at creation time. A later release superseding that one never
alters the historical session's interpretability — you can always ask
"what did this learner see" and get a frozen, unambiguous answer by
looking up that specific release.

## How a certificate proves which curriculum release was assessed

The Certificate carries `plp_release_id` as a permanent, non-signature
field (per INV-05) — outside the HMAC payload so identity-model or
key-version changes never alter it, but permanently attached so the claim
"this credential reflects mastery of exactly this frozen content" remains
independently verifiable by looking up the release's own hash.

## How a new release affects existing learners

Not retroactively. A learner who completed a session under Release N keeps
that session's history exactly as recorded. A learner starting a *new*
session after Release N+1 is published gets N+1's content. There is no
migration of in-flight or historical evidence to a newer release.

## How a new release affects active assessment sessions

An assessment session in progress stays bound to the release it was
created under, even if that release is superseded mid-session. Publishing
a new release must never invalidate or silently alter a session already in
`IN_PROGRESS`/`PAUSED` state.

## How a new release affects already-issued certificates

Not at all. A certificate's `plp_release_id` binding and its hash remain
valid and verifiable indefinitely, regardless of how many later releases
supersede the one it points to. Verifying an old certificate never requires
the referenced release to still be the "current" one — only that it still
exists and its hash still matches.

## Canonical hashing/versioning rules (conceptual)

- One hash per release, computed once, at the FROZEN transition, over a
  fixed, documented column set.
- Semantic version label (e.g. `1.0.0`, `1.1.0`) is a human-readable
  companion to the hash, not a replacement for it — the hash is the
  cryptographic guarantee; the version number is for humans reading a
  changelog.
- A `supersedes` pointer chains releases; the chain is always walkable in
  both directions (what came before, what came after) for audit purposes.
- Cross-institution content sharing (if a V1 feature — see doc 09) does not
  change these rules: a shared release is still one frozen, hashed object,
  regardless of how many institutions publish it.

  *Implementation note (FABLE-05, ADR-0015).* What V1 built is narrower than
  "cross-institution sharing": a `PLATFORM_CANONICAL` tenant owns a release
  and grants named institutions permission to teach it
  (`release_distributions`). Institution-to-institution sharing (OD-4) stays
  LATER and is not expressible — the grant refuses any release whose owner is
  not canonical. The rule above holds unchanged either way: a distributed
  release is one frozen, hashed object, and the hash basis does not know or
  care how many institutions were authorized to teach from it.
