# ADR-0015 — Canonical content distribution

**Status:** Accepted · **Date:** 2026-09-15 · **Phase:** FABLE-05
**Supersedes:** nothing. **Superseded by:** nothing.

## Context

PINTAR authors a canonical library that many schools teach from. Nothing in
FABLE-01–04 could express that: every content table carries `institution_id NOT
NULL`, every RLS predicate reads it, and every evidence row records it, so
content belonged to exactly one tenant and was invisible to every other. FABLE-05
§5 is unbuildable without a way to say "PINTAR wrote this, and School A may
teach it".

Two shapes were available and both were rejected before this one:

* **A nullable ownership column on the seven content tables** (`is_canonical`,
  or `owner_kind`). It forks every RLS predicate, every provenance column and
  every content-hash input, and leaves two definitions of "who owns this row"
  that can disagree.
* **A parallel `canonical_*` hierarchy.** A second content model, a second
  lifecycle, a second freeze, a second quality gate — the "second engine" doc 16
  forbids, four times over.

## Decision

**Canonical content is owned by an institution, like everything else.** One new
column says what KIND of tenant that is.

### 1. `institutions.tenant_kind`

`INSTITUTION | PLATFORM_CANONICAL`, `NOT NULL`, defaulting to `INSTITUTION` so
every existing row keeps its meaning. Immutable once written, in both
directions: flipping a school to canonical would retroactively reclassify every
session it has recorded, and flipping a canonical tenant to a school would make
its distributed content suddenly institution-owned under every predicate below.
Neither has a correct answer, so neither is permitted.

**No new ownership column on any content table.** Every existing FK, RLS
predicate, provenance column and hash input keeps working because none of them
can tell the difference.

### 2. `tenant_kind` and the D1 bootstrap are different concerns

A canonical tenant is not synthetic — its content is real and taught to real
learners — so `non_synthetic_institutions` moves. D1 (ADR-0008) refuses a
non-synthetic tenant outside production unless it is the single declared
OFFICIAL-evidence bootstrap, because `derive_evidence_class` reads
`is_synthetic`.

The two are separable, and the reason is structural rather than rhetorical: a
canonical tenant **cannot mint evidence of any class**, because evidence is
derived from the ENROLMENT's institution and a canonical tenant holds no
enrolments — ever, enforced by a trigger on `enrollments` and asserted by
`assert_canonical_tenants()`. It owns content and produces none.

So D1's insert guard is **narrowed by naming the new case, not by deleting the
old one** — an ordinary non-synthetic school outside production is still refused
with the same message — and the assertion is **split** rather than widened:

| fact | question it answers | counter |
|---|---|---|
| `is_synthetic` | may this tenant's sessions become OFFICIAL evidence? | `non_synthetic_institutions` |
| `is_official_bootstrap` | is this the one tenant permitted to answer yes outside production? | `official_bootstrap_tenants` |
| `tenant_kind` | does this tenant own content for others to teach? | `platform_canonical_tenants` |

All three are separately visible in `platform_schema_lint`, so a reader can
subtract and see how many non-synthetic tenants are ordinary schools.
`derive_evidence_class` is asserted to read **neither** flag.

### 3. `release_distributions` — the grant

`(plp_release_id, institution_id, status, authorized_by_person_id, authorized_at,
withdrawn_by_person_id, withdrawn_at, reason)`. Append-only and audited
(INV-18). One live grant per pair; re-granting after a withdrawal writes a NEW
row, so the history reads as a sequence of decisions rather than a mutable flag.

* Only a **`PLATFORM_CANONICAL`-owned** release may be distributed, and only a
  **`PUBLISHED`** one — distribution is downstream of publication.
* Authority is a platform act: `is_system_admin()` or `CAN_PUBLISH` in the
  **owning canonical tenant**. A consuming institution can never grant itself,
  because it holds no role assignment there.
* Granting and withdrawing each write exactly one audit row, and withdrawal
  never deletes anything.

**Withdrawal is INV-27, not INV-17.** It refuses NEW sessions from the next
attempt and does not interrupt a learner who has legitimately started, exactly as
an assignment window closing does not. INV-17 governs authorization revoked from
a PERSON; a distribution withdrawal is a content-supply decision between two
institutions, and a learner mid-attempt is neither party to it nor at fault.
Completed evidence, results and certificates are untouched permanently.

### 4. One predicate, deliberately conjunctive

`release_is_distributed_to(release, institution)` is true only when the release
is owned by a `PLATFORM_CANONICAL` tenant **and** an ACTIVE grant to that
institution exists. Drop either half and the predicate admits
institution-to-institution sharing, which is exactly what it exists to refuse.
Every relaxation below reads it, so there is one place a future change happens
and one definition that can never disagree with itself.

### 5. Five guards relaxed, not two

FABLE-05's brief named two and called the session provenance guard "the hard
blocker; nothing else stands between a learner and canonical content". It is the
hard blocker but it is not the last one. Building the flow found three more
guards comparing a content row's institution to a learner's:

| guard | what it did | what it does |
|---|---|---|
| `enforce_session_provenance()` | release and definition must belong to the enrolment's institution | …or be canonical content distributed to it; a canonical definition rides its release's grant and is never reachable alone |
| `move_learning_assignment_release()` | target release must belong to the institution and to the same course | …or be canonical content distributed to it, and of any course in this course's lineage chain |
| `enforce_assignment_status()` | stamped the assignment's `institution_id` **from the artefact** | stamps it from the **node's** institution — the school making the decision — and CHECKS the artefact against the predicate |
| `enforce_presented_item_immutable()` | item's owner must equal the session's institution (INV-01) | …or be a canonical owner whose release is distributed to it |
| `enforce_lesson_progress()` | stamped progress `institution_id` **from the lesson** | stamps it from the **learner's enrolment** and checks the lesson |

The last three were defects, not scope: the assignment and progress stamps would
have handed a school's own rows to the canonical tenant, and the presented-item
guard meant no learner ever reached a question. Both stamp changes are proven
equivalent over every existing row, because for institution-owned content the
node's institution and the artefact's owner are the same value.

**INV-01 is not weakened; it is stated correctly.** What it protects is that a
learner never sees another TENANT'S item by accident. "Another tenant" never
meant a canonical library a school was deliberately authorized to teach from —
that authorization did not exist when the guard was written. School B's item is
still refused in School C's session, with or without a distribution row
(F05-T08, and the migration's own probe).

### 6. Reading, not writing

`CAN_DRAFT`, `CAN_REVIEW`, `CAN_FREEZE_RELEASE` and `CAN_PUBLISH` remain keyed to
the OWNING tenant, and no school holds a role assignment in the canonical tenant,
so the write refusal is structural rather than a policy rule. Reading goes
through three named SECURITY DEFINER accessors — `distributed_releases`,
`distributed_release_outline`, `distributed_lesson_preview` — registered in
`client_rpc_registry`, rather than through a widened content policy. The seven
content SELECT policies are asserted unchanged.

**No new capability was invented.** A `CAN_READ_CANONICAL` would be a capability
whose name invites a later author to treat it as an authoring grant; the
accessors gate on `CAN_ASSIGN_LEARNING` or `CAN_DRAFT`, which already mean what
is needed.

The preview carries no item, option, correctness mapping or rationale. This is
not a narrowing of anything that existed — a school could read none of it before
— it is the smallest widening that makes "visible, assignable, previewable, no
authoring action" true.

### 7. `record_class_registry`

Institution-owned content keeps `INSTITUTION_SCOPED`. Canonical content belongs
to no institution, so the transfer question does not arise for it — recorded
through `tenant_kind` in the registry's notes, deliberately **not** a third
`record_portability` value. A new enum label would need its own ADR and would
imply canonical content participates in transfer, which it does not.

### 8. The FABLE-06 hook

`content_ownership_lineage`, a `security_invoker` view returning exactly the rows
the caller could already read, joined to the two dimensions FABLE-06 needs:
the owner's `tenant_kind`, and the lineage pointers. It computes nothing.

**FABLE-06 inherits this as a requirement, not a hint:** it remains blocked until
its aggregation grain distinguishes canonical-global from institution-local, and
it may aggregate across an item lineage **only where the metric's own semantics
permit it**.

## The E2 boundary, named explicitly

E2 was deferred on 2026-09-13 and **split into two questions**. This ADR names
both so silence is never mistaken for a decision:

1. **An ad-hoc or school Quick Assessment drawing authorized canonical items.**
   Scheduled as its own ADR, **after FABLE-05 and before FABLE-06**. Not decided
   here.
2. **Arbitrary mixed-owner papers.** Deferred pending that analysis.

FABLE-05 made neither harder, and the obligations are recorded so a later change
can be checked against them:

* `eligible_items_for_definition` is **unchanged**, including its
  `i.institution_id = d.institution_id` predicate, and that predicate was copied
  nowhere new.
* No code, constraint, view or function added in this phase assumes a
  definition's items share its `institution_id`.
* Item ownership stays readable from the item row and its owner's `tenant_kind`
  — which is what `content_ownership_lineage` exposes.
* "One owner per paper" is baked into neither the Definition builder, nor the
  Publish Readiness projection, nor the quality machinery.

## Consequences

* `non_synthetic_institutions` moves from 1 to 2 in every environment, declared
  and paired with `platform_canonical_tenants`.
* Two new counters and one new assertion (`canonical_tenants_ok`).
* Institution-to-institution sharing (OD-4) stays LATER, and nothing added here
  makes it expressible.
* A future second canonical tenant is permitted; the model does not assume one.

## Alternatives rejected

* **Widening the seven content SELECT policies.** The same predicate would
  answer "may I edit this?" and "may I look at this?", which is how a read grant
  quietly becomes a write grant.
* **A `record_portability` value for canonical content.** An enum change
  implying canonical content participates in transfer, which it does not.
* **Letting the distribution grant name any two institutions.** Expressible
  institution-to-institution sharing, with OD-4 unanswered.
