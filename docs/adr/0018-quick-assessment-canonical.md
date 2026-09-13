# ADR-0018 — Quick Assessment over authorized canonical content

**Status:** Accepted · **Date:** 2026-09-13 · **Phase:** decided in the
FABLE-05 → FABLE-06 window; implemented in the bounded task that follows

> Drafted by Claude 1 in the FABLE-05 → FABLE-06 window and committed here with
> the next free number. The decision below is that draft's; the sections marked
> **Implementation note** are what building it actually found, recorded beside
> the decision rather than in a separate place.

## Problem

FABLE-05 made platform-owned canonical content assignable by authorized
institutions. An educator can now teach an authorized canonical chapter — and
then cannot run the obvious Quick Assessment over it. A returning PINTAR 3.0
educator will hit this in the first hour of the pilot.

## Current mechanism, measured live at 0060

Two independent same-institution constraints stand in the way:

1. **`launch_quick_assessment`** resolves the module's course, then refuses
   `'that module belongs to another institution (INV-13)'` if the module's
   institution differs from the class node's.
2. **`eligible_items_for_definition`** filters `i.institution_id =
   d.institution_id`. The ad-hoc definition is created **owned by the school**,
   so every canonical item is filtered out and the draw returns nothing.

Both are correct as written for institution-owned content. Neither knows about
distribution.

## The exact architectural gap

There is no gap in the *evidence* model, the *hash* model, or *tenant
isolation*. The gap is that **item eligibility is expressed as ownership
equality where the governing relation is now authorization** —
`release_is_distributed_to(release, institution)`, introduced in FABLE-05 and
already the predicate every other relaxation reads.

Ad-hoc definitions are additionally exempt from `enforce_taught_content_immutable`
and may never enter a release (ADR-0011), so this touches **no** content hash.

## Considered options

- **A — Generalize the existing eligibility path**, keyed on `is_ad_hoc`, using
  the existing distribution predicate. One owner per ad-hoc paper.
- **B — Generalize eligibility for all definitions**, canonical and
  institutional items mixable in any paper. This *is* the deferred arbitrary
  mixed-owner question.
- **C — A second, parallel eligibility function** for the canonical case.
- **D — Copy canonical items into the institution** so ownership matches.

## Decision

**A.** Extend the **existing** `eligible_items_for_definition` and
`launch_quick_assessment` with the distribution predicate, gated on
`is_ad_hoc = true`.

**The boundary, decided explicitly rather than left to implementation: one
content owner per ad-hoc paper.** At creation the Quick Assessment resolves to
exactly one source — either a module of the school's own course, or a module of
**one** authorized canonical release. It never draws from both.

Rejected: **B** is the deferred question and remains deferred. **C** would be a
second eligibility path — the shape INV-26 exists to prevent, and the reason the
project has one engine. **D** contradicts the whole point of FABLE-05: canonical
content is not cloned, and copying would transfer ownership, mutate the item
identity Question Health depends on, and break `content_is_sealed` besides.

### Implementation note — how the relaxation reaches the rows

`eligible_items_for_definition` is SECURITY **INVOKER**, and 0020's terminal
block refuses it as DEFINER by name. Under RLS, `items_select` reads
`can_in_institution('CAN_DRAFT', institution_id)`: a school holds no role
assignment in the canonical tenant, so canonical rows are not merely filtered
out of that function's result — they are invisible to its caller. A relaxed
`WHERE` clause alone would therefore have been **vacuous** on the direct call
path while appearing to work from inside `launch_quick_assessment`, which is
SECURITY DEFINER and bypasses RLS as the table owner.

So the canonical branch reads through a named SECURITY DEFINER accessor,
`authorized_canonical_items()` — the pattern ADR-0015 §0056 established and gave
its reasons for. The seven content SELECT policies are unchanged. The accessor
carries **no** eligibility logic: tier, scope, cooling and exclusion all stay in
`eligible_items_for_definition`, which remains the only engine (INV-26).

The accessor **takes no argument**. The first draft took the consuming
institution as a parameter and `assert_engine_takes_no_identity` refused it: a
LEARNER-classified entry point must not accept a caller-supplied identity. The
assertion was right. The institution is now derived from the caller's own
memberships, so there is no id to substitute — a stronger control than checking
one, because it removes the substitution rather than refusing it.

It is classified **LEARNER** because a paper is drawn by `assemble_session`
running as the learner, who holds no capability anywhere. Gating it on
FABLE-05's staff read predicate (`caller_may_read_distributed_release`) made the
learner's draw return an empty pool; widening *that* predicate to admit learners
would have made a canonical lesson body learner-previewable, which is a
different and much larger decision. The gate here is `is_member_of_institution`
— staff assignment or active enrolment, the relationship the rest of the
platform already means by "belongs to this school".

## Reason for the single-owner boundary

Three reasons, in order of weight:

1. **It leaves the general question genuinely undecided.** Allowing mixing later
   is additive; forbidding it later is not. Choosing "one owner" now costs
   nothing and preserves both future answers.
2. **FABLE-06's aggregation grain is not settled.** A mixed paper would put
   canonical-global and institution-local items in one instrument before anyone
   has decided how Question Health separates those signals.
3. **It is explainable to an educator.** "Quick-check the chapter you taught" is
   one chapter. A paper mixing two owners has no natural product story yet.

### Implementation note — where the boundary is enforced

`enforce_ad_hoc_single_owner(definition)` is called at creation by
`launch_quick_assessment`, before the assignment exists, and again at draw time
by `assemble_session`, so a definition written directly by a holder of
`CAN_DRAFT` is refused too. It returns immediately for every non-ad-hoc
definition.

Measured while testing it: through the authorized path a two-owner ad-hoc paper
is **not reachable at all**. It would need an item owned by the school inside a
lesson owned by the canonical tenant, and `enforce_taught_content_immutable`
refuses that write for as long as the canonical course is sealed — which a
published release makes it. That refusal is the boundary's first line and is
asserted (QAC-T08). The guard behind it would then never fire, and an unfired
guard is an unproven one, so the suite forces the condition past that first line
— an unsealed canonical course, a distribution row written directly — and
requires the guard to refuse by name. Both halves are in the acceptance suite;
the guard is planted dead in CI and must take QAC-T08 red with it.

## Authorization rule

An item is eligible for an **ad-hoc** definition `d` owned by institution `X`
when it satisfies the existing bank-tier and scope rules **and** either:

- `i.institution_id = X` — unchanged behaviour, or
- the item's course has a release `R` owned by a `PLATFORM_CANONICAL` tenant
  with `release_is_distributed_to(R, X)` true.

`launch_quick_assessment` applies the same test to the module before creating
anything. **No other definition type is affected**, and
`eligible_items_for_definition` retains its exact current behaviour for every
non-ad-hoc definition — asserted as set equality in both directions over every
such definition that exists (QAC-T09), not as absence of error.

## Lifecycle on distribution withdrawal

Consistent with FABLE-05's withdrawal semantics rather than a second rule:

- **Withdrawal blocks new use.** A new Quick Assessment over that canonical
  release is refused from the next attempt, and a session cannot be started
  against an existing one.
- **It does not interrupt a session already legitimately started.** Withdrawal
  is a distribution act, not an INV-17 event; INV-27 governs, exactly as an
  assignment window closing does not stop a learner mid-attempt.
- **Completed evidence, results and certificates are untouched, permanently.**
- The already-created assessment assignment **remains a row**. It produces no
  new sessions, and Studio says why in plain language. It is not deleted,
  cancelled or rewritten — nothing in this system deletes history.

## Evidence, provenance and hash

Unchanged, and this is why the decision is small. The session records the
**canonical** item and release identity through `presented_items` and
`assessment_sessions.plp_release_id`, and the **school's** `institution_id`,
`enrollment_id`, `class_node_id` and `evidence_class` — the latter derived from
the school's tenant by the existing cap model.

**No hash implication.** Ad-hoc definitions are outside the frozen
`PINTAR-CONTENT-SHA256/1` payload by ADR-0011 and can never enter a release.
INV-04 is untouched, and QAC-T10 proves it by digest rather than by reading.

### Implementation note — two things found by building

**The launcher rebranded the definition's tenant.** `launch_quick_assessment`
read the class's institution into `v_inst` and then overwrote it with the
module's course's institution. For institution-owned content the two are
identical and the overwrite is invisible; the moment eligibility follows
authorization it is not. The definition, the assignment and the audit row would
all have been stamped with the canonical tenant's id for a quick assessment a
school launched for its own class — the same failure 0059 repaired one layer
down. It failed closed rather than silently (0059's assignment guard refuses a
foreign-owned definition when no learning assignment carries a grant, and a
quick assessment carries none), so no database holds a wrong row. Repaired in
0062; the module's owner is now a separate variable that is tested, never
copied.

**A quick assessment could not be taken.** `start_learning_session` refused any
assignment naming no learning assignment — and a quick assessment names none by
construction — so since FABLE-04 a quick assessment could be launched and never
answered, canonical or not. That was a deliberate phase boundary rather than a
defect, but this ADR's acceptance requires a learner to complete one, so the
boundary closes in 0062 for **ad-hoc** assignments only, through the existing
opener, the existing assembler and the existing provenance guard. The release
the session cites is resolved from the content the definition is bound to: **a
PUBLISHED release** of that course owned by the school, or a PUBLISHED canonical
release it holds an active grant for. Where neither exists the learner is refused
in plain language.

The `PUBLISHED` requirement is the amendment below, not part of the original
0062: see **Amendment — 0063**.

## Tenant isolation

Unchanged and re-asserted. The relaxation reads `release_is_distributed_to`,
whose conjunct `owner.tenant_kind = 'PLATFORM_CANONICAL'` makes School B →
School C **structurally impossible** regardless of any row. Institution-created
supplementary items remain invisible to every other tenant.

## The deferred case, named again

**Arbitrary mixed-owner composition — canonical and institution-owned items in
one paper — remains deferred.** This ADR does not decide it, does not create a
mechanism that presumes either answer, and must not be cited as precedent.
Institution-to-institution sharing (OD-4) remains LATER.

## Touched

`eligible_items_for_definition`; `launch_quick_assessment`; `assemble_session`
(one gated guard call); `start_learning_session` (one gated branch); new
`authorized_canonical_items()` and `enforce_ad_hoc_single_owner()`; the Studio
Quick Assessment surface; one `client_rpc_registry` row. **No new table. No
policy change. No enum change.**

## Invariants affected

INV-12 (bank tier — unchanged, re-asserted), INV-13 (unchanged, re-asserted),
INV-26 (one engine — no second eligibility path), INV-33 (provenance
unchanged), INV-04 (untouched — asserted). None is amended.

## Amendment — 0063: an ad-hoc session cites a PUBLISHED release

**Status:** Accepted · **Date:** 2026-09-13 · **Raised by:** Claude 1's second
reading of Task 1 (F1, gate blocker) · **Reproduced and repaired in migration
0063 before the gate closed.**

0062's ad-hoc release resolution carried **no status filter**. A school
authoring its own course holds a release row at `INGESTED` long before it
publishes anything, and that row satisfied the own-institution arm — so a quick
assessment over the school's own unfinished chapter opened a session and cited an
**unsealed** release.

That is a contract violation, not a rough edge. Doc 07 makes the session's
`plp_release_id` binding the reason "a later content correction never
retroactively changes a past session's recorded result"; doc 08 makes the same
binding the reason anyone can "always ask what did this learner see … and get a
frozen, unambiguous answer". Both guarantees are conditional on the cited release
being sealed. `enforce_taught_content_immutable` only fires when
`content_is_sealed(course)` is true, so against an unsealed release **the items
the learner answered remain editable and the binding pins nothing**. Reproduced
against a seeded database at 0062: the session opened, and the stem of a
presented item was then updated successfully after the fact.

**The amendment:** the ad-hoc release resolution requires `r.status =
'PUBLISHED'`, applied to the whole predicate rather than to one arm, so the rule
is stated once and holds for both:

- **own content** — publication is what puts a release in use: the repository's
  own `content_status_transitions` records the `FROZEN → PUBLISHED` edge as
  "made available to the institution". (Migration 0063 attributes this to a doc
  08 clause that is not in the repository's copy of that document; see the
  version-divergence note under Amendment — 0064.) PUBLISHED also implies
  sealed, which is what the binding needs;
- **canonical content** — `grant_release_distribution` already refuses to
  distribute anything that is not PUBLISHED, so the authorized path was never
  exposed. Stating the rule here anyway means this path no longer depends on a
  check living in another function: a distribution row written by any means
  other than that RPC cannot make an unsealed release citable.

**Publication, not merely sealing, is the gate.** A `FROZEN` release is sealed
and is still refused, because doc 08 puts publication upstream of use.

**A first draft of this amendment went further and was wrong.** 0063 required
`PUBLISHED` alone, which also refused a release that had been published and later
`SUPERSEDED`. I argued that superseding is how a correction propagates, so
drawing from replaced content should stop. Claude 1's addendum objected, and
0064 is the correction — see **Amendment — 0064** below. The rule this ADR now
carries is `status in ('PUBLISHED','SUPERSEDED')`: **sealed, and was published**.

QAC-T11 exercises one own-content course in four states — INGESTED, FROZEN,
PUBLISHED, SUPERSEDED — with the same pool, so the only variable is the release's
status; QAC-T12 puts supersession and withdrawal side by side on canonical
content.

Nothing in the canonical path this ADR was written for changes; the amendment
**narrows**. No new capability, no new object, no policy change, no enum change.

### Also recorded from that reading (non-blocking, not amendments)

- **`authorized_canonical_items()` is course-scoped, not release-scoped.** It
  requires that *some* release of the item's course be distributed. Those are the
  same set only because copy-forward (ADR-0016) makes a course's item set stable —
  a correction is a new course, so every release of one course describes the same
  content. That is an argued equivalence, not an enforced one, and it is now
  named in the function's own `comment` so a later change to the revision model
  cannot quietly invalidate it.
- **The distribution-must-be-PUBLISHED rule lives in a function, not in a table
  constraint.** No client path can bypass it (`release_distributions` has no
  client write policy and no client grants), and after this amendment the
  session path does not rely on it at all. Left as it is; recorded so the
  structural argument is not mistaken for a schema guarantee.

## Amendment — 0064: supersession is not withdrawal

**Status:** Accepted · **Date:** 2026-09-13 · **Raised by:** Claude 1's addendum
to the second reading · **Corrects the amendment above, which overshot F1.**

F1 needed the cited release to be **sealed** (otherwise the session's
`plp_release_id` pins nothing) and to have been **published** (doc 08: publication
is upstream of use). That pair is exactly `PUBLISHED | SUPERSEDED` — the two
content statuses that are both sealed and were published. `FROZEN` is the one
sealed status that never was, and stays refused.

0063 required `PUBLISHED` alone. **The extra strictness was mine, not the
baseline's**, and two facts I did not check say it was wrong — both measured
before accepting the correction:

1. **Release status gates new sessions nowhere else.**
   `enforce_session_provenance` checks ownership and distribution, never status.
   A learner can start a new *learning-cycle* session against a `SUPERSEDED`
   release today — including one withdrawn by `withdraw_release`. 0063 made the
   ad-hoc path stricter than the learning-cycle path for the same content.
2. **Correction here is never automatic.** ADR-0016 kept `NOT_STARTED_ONLY`, an
   audit row per move, and "the refusal of any automatic move": moving a school
   onto a corrected release is an explicit, audited act. 0063 produced that
   move's effect automatically and silently, triggered by something the content
   owner did elsewhere. Doc 08 is consistent: an in-progress session "stays bound
   to the release it was created under, even if that release is superseded".

The operational cost was real too: a consuming school can neither publish
canonical content nor grant itself a successor, so a canonical supersede would
have silently stopped Quick Assessment for every school holding the old grant.

**The audited lever for "stop using this" already exists** —
`withdraw_release_distribution`, enforced through `release_is_distributed_to`,
with an audit row. 0063 duplicated it in an automatic, unaudited form. QAC-T12
pins the pair: superseding the release leaves the school using it; withdrawing
the distribution stops it.

### A version divergence, not a bad citation — and it cuts both ways

An earlier draft of this section said the policy Claude 1 quoted "is not in this
repository's doc 08" and implied the citation did not check out. **That was
wrong, and it is corrected here rather than left standing.**

The repository's copy of doc 08 **predates the 2026-09-12 baseline amendment**.
The evidence is mechanical and internal to this repository: of the sixteen
`docs/rebuild/` baseline documents, exactly **one** — doc 03 — carries a
`*Baseline amendment (2026-09-12)*` marker. Doc 08 carries none, has no
"release-correction / active-learner policy" section, and still contains the
`N+1` sentence that amendment replaced. So the two readings were of consecutive
versions of the same rule: the amending text and the text it superseded. Neither
party invented anything, and the loose one-liner I relied on is the older.

**The same gap caught me, on the clause I leaned on hardest.** "Publication is
not assignment — publishing a release makes it available within the institution"
is quoted as doc 08's in migration 0063, in migration 0064, and above in this
ADR. It appears **nowhere in this repository's `docs/`**. I adopted it from
review and attributed it to a document I never checked — the symmetric error to
the one I was flagging, made in the same breath.

**Migration 0063 cannot be corrected**: it is applied to `main` and to hosted,
and migrations are forward-only. This paragraph is the correction of record for
it. 0064 had reached no canonical environment and carries the accurate
attribution.

**The rule itself does not depend on the contested clause.** Refusing `FROZEN`
rests on text that *is* in this repository and is machine-readable:
`content_status_transitions` records the `FROZEN → PUBLISHED` edge with the note
**"made available to the institution"**. Publication is what makes a release
available; a sealed-but-never-published release therefore must not be citable.
That is the ground the rule stands on here.

### Left as it is, and named

`withdraw_release` also sets `SUPERSEDED`, so that status means both "replaced by
a successor" and "withdrawn by its owner", and this predicate admits both. That
is not a looseness introduced here — the learning-cycle path admits a new session
against a withdrawn release today, which was measured. Whether a withdrawn
*release* should stop new sessions is a platform-wide question for both paths,
decided once, with its own ADR. QAC-T12 pins the behaviour as it stands so a
later decision changes a test rather than discovering a surprise.

## Layer-3 concerns

Two, unchanged from the draft and **not** discharged here. First, whether the
single-owner boundary is actually enforced or merely not-exercised — an auditor
should try to build a two-owner ad-hoc paper directly, and should read QAC-T08's
two halves critically. Second, whether the generalized predicate admits anything
beyond canonical-with-grant; the conjunct is the whole control and it should be
attacked, not read. Layer-3 is not performed and is not claimed.
