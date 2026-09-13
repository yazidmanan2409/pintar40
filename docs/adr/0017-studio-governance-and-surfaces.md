# ADR-0017 — Studio governance and the one calm state

**Status:** Accepted · **Date:** 2026-09-15 · **Phase:** FABLE-05

## Context

FABLE-05 gives the capability model its UI. Building it surfaced two gaps in the
governance underneath, and one design question about where the surface state is
computed.

## Decision

### 1. Two capability checks the content state machine was missing

`enforce_content_status` already refused an illegal edge and already required a
reviewer distinct from the author on APPROVED. It did **not** ask whether the
caller holds `CAN_REVIEW`, and it asked nothing at all on PUBLISHED →
SUPERSEDED. So an EDUCATOR — who holds `CAN_DRAFT` and passes the content UPDATE
policy — could approve a colleague's item by naming that colleague as reviewer,
and could withdraw a published release.

Both are refusals the Studio brief states plainly ("enforced server-side, not by
hiding a button"; "publish/withdraw restricted to `CAN_PUBLISH` only"). Both
checks were added **in the guard every write already passes through**, beside the
FROZEN and PUBLISHED checks, not in a new gate alongside it. The recorded
reviewer must also be the caller, so "approve" cannot be performed on someone
else's behalf by naming them.

This changed the seeds and FABLE-02's suite: an approval is now an act with an
actor, not a field two statements fill in. The fixtures approve **as** the Head
of Department, which is what they always meant.

### 2. The one calm state is composed, not recomputed

The brief asks for a single surface state — `Ready` / `Action Required` /
`Blocked` — over three things that are separate underneath, and says so itself:
"Technical validation, academic validation and publish readiness are separate
underneath; the user sees one state and a plain-language list."

`publish_readiness` stays exactly the findings gate it is — it is what
`enforce_release_publish_readiness` consults at the moment of publication, and
changing its status computation would have changed when a release may publish.
`studio_package_state` is the **composition**: it READS `publish_readiness`
rather than reimplementing it (asserted structurally — a second findings count
would be a second validator) and adds the lifecycle facts a human can act on.

Composing it in the database rather than in the page means the API and the UI
cannot disagree about what a package's state is.

**No lifecycle enum, evidence class or version string reaches its output**, and
that is asserted by pattern rather than reviewed by eye (§12).

### 3. Bounds live in the database

`assessment_definition_bounds`, one row per mode. `save_assessment_definition`
reads it; the route reads neither. The brief forbids hardcoded item counts and
windows in route code, and a bound that lives in a page cannot be enforced when
someone posts the form by hand.

### 4. INV-29, literally

The twelve interpretation-affecting fields are **named**, not inferred. A change
to any of them writes a NEW definition version rather than editing the row that
existing sessions already cite as provenance; a change of title alone edits in
place. Editing interpretation under an existing result would silently restate
what that result meant.

### 5. Review decisions are decisions, never verdicts

`record_integrity_review` accepts three values that describe what the REVIEWER
did — `NO_CONCERN`, `DISCUSSED_WITH_LEARNER`, `REFERRED_TO_INSTITUTION`. None is
a finding about the learner. The decision is an audit row: the signal is not
mutated into carrying an outcome, and no second log table exists (doc 16).

`record_question_health_review` walks the existing
`question_health_transitions` graph and computes nothing. While FABLE-06 has not
run there is nothing to review, which the surface says honestly rather than
hiding.

`acknowledge_finding` refuses an ERROR outright: an ERROR is repaired in the
content, never acknowledged away. A WARNING is acknowledged by a `CAN_REVIEW`
holder who is not the content's author.

### 6. OD-10 is held by a constraint, not a convention

`certificate_templates.identity_presentation` is pinned to `NAME_ONLY` by a
check constraint and is not a parameter of the save RPC. OD-10 is unanswered;
when it is answered, changing the constraint is a deliberate migration rather
than something a later edit can do by accident. Nothing here touches the public
verification payload, which stays fixed at
`{pass, predikat, institution, date, validity}`.

### 7. Staff-only copy keys

Studio is staff-only, and staff Indonesian legitimately uses words the HLE
forbids on a learner screen — "Menunggu tindakan Anda" is the ordinary way to
say a queue is waiting for you, while the same word on a child's screen is the
system telling them to wait.

`studio.*` and `config.*` are declared staff-only. This is a statement about
AUDIENCE, not an exemption: `t()` still throws if such a key is rendered for a
learner or the public, which is the protection wanted; `renderAll()` simply
stops asking for a rendering that would be a bug. F05-S03 asserts the other half
— that no learner-facing route references one.

## Consequences

* Seeds and FABLE-02 updated to approve as the reviewer of record.
* Eleven new `STAFF` client RPCs, each registered in the same statement as its
  grant.
* Two new tables (`assessment_definition_bounds`, `certificate_templates`), both
  with RLS forced and a `record_class_registry` row.
* `functions_executable_by_anon` stays 0 and `anon_reachable_http_paths` stays 2:
  Studio adds no anonymous surface.
