# 02 — PINTAR Canonical Domain Model

The conceptual model, independent of any SQL table shape. Read before
designing schema. "Tenant boundary" means the scope (institution/programme/
cohort) that isolates the entity from other tenants' data — see
`05-PINTAR-AUTHORIZATION-MATRIX.md` for how boundaries are enforced.

## Organisation

**Institution** — the top-level tenant. Owner: system admin (creation),
institution admin (operation). Tenant boundary: itself. Children: faculties.
Mutable (name, config) at any time; never deleted, only deactivated (its
history — certificates, releases — must remain queryable).

**Faculty / Department / Programme** — a strict containment chain under
Institution. Each carries an ancestor-path back to its institution. Moving
a node re-parents its whole subtree; deletion is blocked while any child or
any historical record (release, certificate, session) references it —
deactivate, don't delete.

**Cohort** — a bounded group of learners under a Programme, with a start/
end period. Immutable membership snapshot once any assessment session tied
to it is FROZEN-equivalent (a cohort's roster as-of a session must be
reconstructable even if membership later changes).

**Class** — an operational instance of teaching (a specific educator,
subject, cohort, time window). Has its own lifecycle (see state machines
doc). A class period lapsing must be enforceable in real time against
in-progress sessions.

## Identity and authorization

**User** — one account (email or classroom-card identity — same downstream
model, per Lesson 7/rebuild rule). Owner: self (profile) / institution admin
(provisioning). Never deleted outright once any evidence (response,
certificate) references it — anonymize, don't delete, per PDP-style
retention rules.

**Role** — a display label derived from active Role Assignments; never
itself the authority.

**Scope** — a (level, node) pointer into the Organisation hierarchy an
Assignment applies to.

**Capability** — a named permission (`CAN_DRAFT`, `CAN_REVIEW`,
`CAN_FREEZE_RELEASE`, `CAN_PUBLISH`, `CAN_FLASH_QUIZ`, …) derived from Role,
never assigned directly to a user.

**Assignment** (`user_scope_assignments` equivalent) — the actual grant:
(user, role, scope, valid_until). Source of truth for all authorization.
Time-bounded; auto-expires. Immutable once used to gate an action already
taken (audit requires knowing what was true at the time).

## Learning content

**PLP (PINTAR Learning Package)** — the canonical container: one Source →
Course → Module → Lesson → Item tree plus its Assessment Blueprints and
Misconception Taxonomy references, as of one version. Not a database
table — a conceptual unit that a Release freezes a snapshot of.

**PLP Release** — an immutable, hashed, versioned snapshot of a PLP at a
point in the lifecycle (FROZEN or later). Owner: Head of Department (freeze)
/ Institution Admin (publish). Tenant boundary: institution (or shared
across institutions if explicitly licensed — a V1 scope question, see doc
09). Historical reproducibility requirement: **absolute** — any certificate
or session ever tied to a release must be able to reconstruct exactly what
was taught, forever, even after supersession.

**Lesson** — body + summary + worked examples + media, under a Module.
Mutable while its release is not yet FROZEN; immutable after.

**Source / Source Version** — the textbook/guideline citation record.
Append-only; a new edition is a new Source Version, never an edit to an old
one (page-precise citations must never silently drift).

**Media** — an asset (video/audio/PDF/diagram-directive) attached to a
Lesson. Owner: Studio. Never stored as a public URL — always referenced by
path, resolved to a signed URL at render time.

## Assessment

**Question bank** — conceptually three isolated pools: PRACTICE, TEST,
EXAM (see rebuild note in FABLE-02 §3 for the enforced one-way exclusion).
Not a table — a tag/partition on Item.

**Item** — one question: stem/stimulus, type, options, objective links,
misconception links, safety-critical flag, bank tier. Owner: author
(Studio). Immutable once its release is FROZEN.

**Option** — one Item's answer choice: text, correctness, required
rationale, misconception code. Same mutability as Item.

**Misconception** — a taxonomy entry (code, label, description, required
remediation). Append-only; codes are never reused for a different meaning
once any Option references them (that would silently rewrite history).

**Assessment Blueprint** — versioned, named rule-set (item count,
difficulty mix, safety-critical minimum, passing rule, hesitation
threshold, shuffle policy) referenced by an Assessment Assignment — never
hardcoded per-route.

**Assessment Assignment / Preset** — a configured instance of a Blueprint
applied to a Class/Cohort/time window (a specific pre-test, post-test,
practice quiz, formal exam).

## Learning evidence

**Assessment Session** — one learner's attempt at one Assignment. Owner:
the learner (data subject); authoritative source of truth: the server.
Server-authoritative state (current item, elapsed time, flags) — the client
never owns this state. Immutable once finalized, except append-only audit
fields (e.g. certificate-issuance retry marker).

**Presented Item** — the record of which item was shown, in which position,
to which session — needed for exposure/cooling and psychometrics.
Immutable once written.

**Response** — a learner's answer to one Presented Item: value, timing,
whether changed (if allowed), final submission. Immutable once the session
finalizes. This is scoring-relevant evidence.

**Hesitation Signal / Assistance Offer / Assistance Usage** — timing and
interaction telemetry around the assistance system. **Never** scoring
evidence — physically separated (own table/columns, unreadable by any
scoring view). Used for analytics and item design only.

**Misconception Evidence** — derived from a wrong Response mapped through
its Option's misconception code. Aggregatable per-cohort; the aggregate
must never expose an individual learner_id (that's a privacy boundary, not
just a display choice).

**Pre-test diagnosis / Personal Reading Map / Post-test Result / Mastery
Result / Safety Gate Result** — all *derived* from Responses at
well-defined computation points (see Assessment Engine Contract, doc 07).
None of these is itself writable by the client; all are recomputed
server-side, and the safety gate and mastery result are recomputed a second
time, independently, at certificate-issuance.

## Credentials

**Certificate** — an issued credential: learner, score, timestamp,
certificate number, `plp_release_id`, `key_version`, HMAC hash. Owner:
issued by the system on behalf of the institution. Immutable once issued;
never edited — a wrong certificate is revoked/superseded, never patched.
Historical reproducibility: **absolute** — its hash must remain verifiable
indefinitely, even after the signing key rotates (old keys become
verify-only, never deleted).

**Curriculum/Release Binding** — the `plp_release_id` on a Certificate,
outside the HMAC payload but still permanently attached — lets a
certificate prove *which* frozen content the learner was assessed against
without being vulnerable to identity-model churn.

**Verification Record** — the public-safe read of a Certificate
(pass/predikat/institution/date only). Not a separate stored entity — a
view/projection, computed at request time from the Certificate.

**Revocation / Supersession** — a Certificate can be marked revoked (fraud,
error) but the row and its verification history are never deleted — the
public verification response changes to reflect revocation, the record
itself doesn't disappear.

## Intelligence

**Item Statistics / Empirical Difficulty** — server-computed aggregates
over Responses for one Item, recalculated on a cadence (e.g. N≥30 new
responses). Derived, not source-of-truth — must be recomputable from raw
Responses at any time, never treated as authoritative if it disagrees with
a fresh recomputation.

**Misconception Aggregate** — cohort-level rollup of Misconception
Evidence, tenant-scoped, no individual learner identifiable.

**Educator Briefing / Institutional Briefing** — a generated narrative
artefact (see lifecycle doc) built from the above aggregates, at defined
read-time budgets (~60s / ~90s). Never the aggregates themselves rendered
raw.

**Curriculum-Improvement Recommendation** — a Studio-facing suggestion
generated when a Misconception Aggregate crosses a convergence threshold on
one Item/Option. Always a suggestion for a human reviewer — never an
automatic content edit.

## Governance

**Review** — a human action transitioning content between lifecycle
states, always attributed to a specific reviewer, always distinct from the
content's author for the same item.

**Approval** — sign-off, recorded with reviewer id + timestamp; does not by
itself make content immutable (see Freeze).

**Publication** — the act of making a FROZEN release live/visible to
learners; restricted to `CAN_PUBLISH`.

**Audit Record** — an append-only log entry for role grants/revocations,
item edits, release freezes, and certificate issuance/revocation. Never
read by any scoring or UI-decision logic — exists for accountability only.

## Textual ERD (major relationships)

```
Institution 1─* Faculty 1─* Department 1─* Programme 1─* Cohort 1─* Class
Institution 1─* User (via Assignment, scoped to any level above)
Source 1─* SourceVersion 1─* Course 1─* Module 1─* Lesson 1─* LearningObjective
LearningObjective *─* Item (via objective_ids)
Item 1─* Option; Option *─1 Misconception
Module 1─* AssessmentBlueprint
Course/Module ⇒ (frozen at) PLPRelease 1─* Certificate (via plp_release_id)
Class + AssessmentBlueprint ⇒ Assignment 1─* AssessmentSession (per learner)
AssessmentSession 1─* PresentedItem 1─1 Response
Response *─1 Misconception (via chosen Option, when wrong)
AssessmentSession 1─0/1 Certificate
Cohort/Class + time window ⇒ Misconception Aggregate / Item Statistics
                            ⇒ Educator Briefing (per class) / Institutional Briefing (per institution)
```
