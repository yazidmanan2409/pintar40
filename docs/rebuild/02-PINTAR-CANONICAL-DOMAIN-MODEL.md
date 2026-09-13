# 02 — PINTAR Canonical Domain Model

*Baseline amendment (2026-09-12): learner identity now transcends the
institution; Academic Period, Enrollment, Membership and Transfer are
first-class; evidence provenance and eligibility are first-class; Learning
Assignment is distinct from Publication; Question Health, MCQ Quality
Findings, Publish Readiness, the Canonical Metric Catalogue, Integrity
Signals and the provider-neutral AI Gateway are added; the certificate
binding is corrected (release identity is inside the signed payload).*

The conceptual model, independent of any SQL table shape. Read before
designing schema. "Tenant boundary" means the scope (institution/programme/
cohort) that isolates the entity from other tenants' data — see
`05-PINTAR-AUTHORIZATION-MATRIX.md` for how boundaries are enforced.

Governing principle for every entity below: **calm on the surface, rigorous
underneath.** The model may be as rigorous as evidence, provenance and
security require; the surfaces built on it must never expose that rigor as
complexity to a learner, educator or administrator.

## Organisation

**Institution** — the top-level tenant. Owner: system admin (creation),
institution admin (operation). Tenant boundary: itself. Children: faculties.
Mutable (name, config) at any time; never deleted, only deactivated (its
history — certificates, releases, enrollments — must remain queryable).

**Faculty / Department / Programme** — a strict containment chain under
Institution. Each carries an ancestor-path back to its institution. Moving
a node re-parents its whole subtree; deletion is blocked while any child or
any historical record (release, certificate, session, enrollment) references
it — deactivate, don't delete.

**Academic Period** — an institution-defined bounded time span (academic
year, semester, term) under which Enrollments and Memberships are dated.
Owner: institution admin. Append-only: a new year is a new Academic Period,
never an edit to the old one. Every Enrollment, Membership, Learning
Assignment and Assessment Assignment references exactly one Academic Period.

**Cohort** — a bounded group of learners under a Programme, within an
Academic Period. Membership is *not* a mutable list on the Cohort — it is
the set of Class/Cohort Membership records (below) whose validity interval
covers the moment being asked about. "Who was in Cohort X on date D" is
always answerable from those records, without snapshots.

**Class** — an operational instance of teaching (a specific educator,
subject, cohort, Academic Period, time window). Has its own lifecycle (see
state machines doc). A class period lapsing must be enforceable in real time
against *new* sessions; its effect on in-progress sessions follows the
start-eligibility ≠ continue-permission rule (doc 04 §5).

## Identity, enrollment and authorization

**Person** — one human being, platform-wide, independent of any
institution. Owner: self (profile) / platform (identity integrity). Carries
the lifelong learning identity the Doctrine points toward ("a lifelong
learning passport … belonging to every individual"). Never deleted outright
once any evidence or credential references it — anonymized per doc 06
retention rules. A Person is **never structurally owned by an institution.**

**Learner Identity** — the Person acting in the learner role. Same entity;
the term is used where the learner-specific record (profile, photo, learning
history) is meant. Carries **profile photo support** and mutable display
attributes; these are the *current* profile, never the historical identity
of an issued credential (see Certificate Identity Snapshot).

**Account** — a login credential set (email, classroom-card identity —
same downstream model) attached to exactly one Person. A Person may hold
more than one Account over time (e.g. a school-issued card and a later
personal email); Accounts are linked to the Person, evidence is attributed
to the Person.

**Institution Enrollment** — the dated fact that a Person is (was) enrolled
at an Institution: (person, institution, academic period, programme where
applicable, valid_from, valid_to, status, how it ended). Owner: institution
admin. Append-only in history — an enrollment ends, it is never deleted or
overwritten. This is the boundary between "portable learner evidence" and
"institution-scoped records" (see Transfer). A Person may hold several
Enrollments over a lifetime and, where policy permits, concurrently.

**Class / Cohort Membership** — the dated fact that an Enrollment placed a
learner in a Class or Cohort: (enrollment, class/cohort, academic period,
valid_from, valid_to). Append-only. A learner's class is **never
overwritten** when the academic year changes — a new Academic Period creates
new Membership records; the old ones close with a `valid_to`. Historical
membership is reconstructable for any date.

Worked example (canonical): Student A → School B → Academic Year 2026/27 →
Class 5A; later Student A → School C → Academic Year 2027/28 → Class 6B.
One Person, two Enrollments, two Memberships. Never two unrelated students.

**Transfer** — an explicit, authorized, auditable act moving a learner's
*portable* record from one Enrollment context to another (School B → School
C), whether or not both institutions use PINTAR. Owner: the authorizing
institution admins (sending and receiving) under the transfer policy; the
learner (or guardian, per policy) is a party, not a bystander. A Transfer
has its own lifecycle (doc 04) and records exactly which record classes
were carried. Transfer is a *learner-record* capability and is distinct from
institution-to-institution *content* sharing (doc 09, LATER).

*Transfer invariant:* portable learner evidence (verified academic
progression, completed learning evidence, mastery history, credentials where
policy permits) may transfer; institution-scoped records (administrative
notes, internal investigations, integrity cases, audit material, staff
annotations) do not transfer automatically. Historical School B evidence
remains bound to the School B Enrollment; new School C evidence belongs to
the School C Enrollment. Nothing is re-parented or rewritten.

**Role** — a display label derived from active Role Assignments; never
itself the authority.

**Scope** — a (level, node) pointer into the Organisation hierarchy an
Assignment applies to.

**Capability** — a named permission (`CAN_DRAFT`, `CAN_REVIEW`,
`CAN_FREEZE_RELEASE`, `CAN_PUBLISH`, `CAN_ASSIGN_LEARNING`,
`CAN_QUICK_ASSESSMENT`, `CAN_AUTHORIZE_TRANSFER`, `CAN_REVIEW_QUESTION_HEALTH`,
`CAN_MANAGE_REPORT_TEMPLATES`, `CAN_REVIEW_INTEGRITY`, …) derived from Role,
never assigned directly to a user. (`CAN_QUICK_ASSESSMENT` replaces the
earlier `CAN_FLASH_QUIZ` name; same meaning.)

**Role Assignment** (`user_scope_assignments` equivalent) — the actual grant
for staff and administrators: (person, role, scope, valid_until). Source of
truth for all authorization. Time-bounded; auto-expires. Immutable once used
to gate an action already taken. Learners are authorized through their
Enrollment/Membership, not through a Role Assignment.

## Learning content

**PLP (PINTAR Learning Package)** — the canonical container: one Source →
Course → Module → Lesson → Item tree plus its Assessment Definitions and
Misconception Taxonomy references, as of one version. Not a database
table — a conceptual unit that a Release freezes a snapshot of. **PINTAR
owns this canonical content model.** External tools (NotebookLM, Claude,
Gemini, a human author, a publisher's export) are *producers* of material
that is converted into it; none of them is PINTAR's CMS, and no producer's
concepts appear in this model.

**Content Ingestion** — the two paths by which material enters the PLP
domain, converging on the same canonical entities:
- *Easy Upload* — a folder, ZIP or loose files. PINTAR recognizes likely
  asset roles and structure, infers what it safely can, and asks the
  uploader to confirm the rest. Never silently guesses a mapping that
  affects what a learner will see.
- *Structured Package Import* — a machine-produced canonical package for
  industrial-scale ingestion.
Both produce a package in the INGESTED state of the content lifecycle.

**PLP Release** — an immutable, hashed, versioned snapshot of a PLP at a
point in the lifecycle (FROZEN or later). Owner: Head of Department (freeze)
/ Institution Admin (publish). Tenant boundary: institution (cross-institution
sharing is a LATER capability — doc 09). Historical reproducibility
requirement: **absolute** — any certificate or session ever tied to a
release must be able to reconstruct exactly what was taught, forever, even
after supersession. `APPROVED ≠ FROZEN`: approval is academic/human
governance; FROZEN is the immutable technical release identity.

**Publish Readiness** — a *derived projection* over a package (not a
lifecycle state) answering "can this be published, and if not, exactly
why." Computed from technical validation, academic validation, MCQ Quality
Findings and governance state, surfaced as `READY` / `ACTION_REQUIRED` /
`BLOCKED` with a plain-language list of what prevents publication. See doc
04 §1a.

**Lesson** — body + summary + worked examples + media, under a Module.
Mutable while its release is not yet FROZEN; immutable after.

**Source / Source Version** — the textbook/guideline citation record.
Append-only; a new edition is a new Source Version, never an edit to an old
one (page-precise citations must never silently drift).

**Media** — an asset (video/audio/PDF/diagram-directive) attached to a
Lesson. Owner: Studio. Never stored as a public URL — always referenced by
path, resolved to a signed URL at render time.

**Learning Assignment** — the act of making a published PLP Release
available to specific learners. `PUBLISH ≠ ASSIGN`: publishing a release
makes it *available to the institution*; a Learning Assignment makes it
*expected of a class/cohort*. Fields (minimum): release, subject/course,
grade/context, class or cohort, academic period, availability window,
required/optional, learning-cycle configuration (which Dr. Gladys stages
apply and their assessment definitions), assigned_by, assigned_at, and the
release-correction policy in force (doc 08). Model:
`PLP Release → Learning Assignment → Class/Cohort → Learners`.

## Assessment

**Question bank** — conceptually three isolated pools: PRACTICE, TEST,
EXAM (see rebuild note in FABLE-02 §3 for the enforced one-way exclusion).
Not a table — a tag/partition on Item.

**Item** — one question: stem/stimulus, type, options, objective links,
misconception links, safety-critical flag, bank tier, `parallel_group`
(sibling set for equivalent items), *authored/predicted difficulty*. Owner:
author (Studio). Immutable once its release is FROZEN. Item type is
extensible and source-reflective; every type is rendered and scored by the
one assessment engine (doc 07), never by a type-specific engine.

**Option** — one Item's answer choice: text, correctness, required
rationale, misconception code. Same mutability as Item.

**Misconception** — a taxonomy entry (code, label, description, required
remediation). Append-only; codes are never reused for a different meaning
once any Option references them (that would silently rewrite history).

**MCQ Quality Finding** — a pre-publication, automated finding against an
Item or a whole bank: exploitable-pattern classes such as correct-option
length imbalance, grammatical cues, systematically more precise correct
answers, implausible distractors, stem wording exposing the answer,
answer-position regularities, over-use of all/none constructions, weak
misconception linkage, suspicious bank-wide regularities. Severity-graded;
ERROR-level findings block Publish Readiness, WARNING-level findings are
shown and must be acknowledged by a reviewer. Findings detect *exploitable
patterns*, never enforce cosmetic uniformity (options are not forced to
equal length).

**Assessment Definition** (formerly "Assessment Blueprint") — versioned,
named rule-set (item count, difficulty mix, safety-critical minimum,
passing rule, hesitation window bounds, shuffle policy, pre/post separation
mode, assessment mode) referenced by an Assessment Assignment — never
hardcoded per-route. A change to any rule that could alter interpretation
of a result is a new Definition version.

**Assessment Mode** — a policy/presentation profile applied by the one
engine: `LEARNING_CYCLE_PRETEST`, `LEARNING_CYCLE_POSTTEST`, `PRACTICE`,
`TEST`, `EXAM`, `QUICK_ASSESSMENT`, `PUBLIC_DEMO`, and (foundation only)
`PAPER`. Modes differ in policy and presentation; they share the engine,
the item model, the sanitizer, scoring and evidence recording.

**Assessment Assignment** — a configured instance of an Assessment
Definition applied to a Class/Cohort/time window (a specific pre-test,
post-test, practice quiz, formal exam, or a teacher's Quick Assessment).
Conceptually distinct from Learning Assignment; a Learning Assignment's
learning-cycle configuration may *generate* its Assessment Assignments.

**Teacher Quick Assessment** — an Assessment Assignment in
`QUICK_ASSESSMENT` mode created by an educator for an eligible class from an
eligible bank in roughly one minute (Class → Quick Test → Subject/Topic →
Count/Time → Launch), without administrator or developer involvement. It is
a *surface* over the one engine, not an engine.

## Learning evidence

**Evidence Provenance** — every meaningful assessment/learning evidence
record must be able to establish: learner identity (Person), institution,
enrollment, academic period, class/cohort where relevant, learning
assignment, content release, assessment definition (and version),
assessment session, engine version, scoring policy/configuration version,
evidence channel, authoritative timestamp, and evidence class. These are
recorded at write time, never inferred later.

**Evidence Channel** — how the evidence entered PINTAR: `ONLINE`,
`PAPER_MANUAL_ENTRY` (foundation only), `PAPER_IMPORTED` (foundation only),
`PUBLIC_DEMO`.

**Evidence Class** — the eligibility classification of the evidence:
`OFFICIAL` (legitimate learner evidence in an institutional context),
`PREVIEW` (educator/staff preview), `SYNTHETIC` (automated testing / persona
harness / synthetic organisations), `PUBLIC_DEMO` (Mini-PINTAR / public
trial). Only `OFFICIAL` evidence is eligible for institutional analytics,
Question Health, empirical psychometrics, certificates, official learner
mastery and production reporting. Eligibility is **structural** (doc 06):
ineligible evidence cannot reach those consumers by construction, not by a
developer remembering a filter.

**Assessment Session** — one learner's attempt at one Assessment
Assignment. Owner: the learner (data subject); authoritative source of
truth: the server. Server-authoritative state (current item, authoritative
deadline, flags) — the client never owns this state, though it may hold a
durable, replayable outbox of not-yet-acknowledged responses (doc 07,
resilience). Carries its full Evidence Provenance. Immutable once finalized,
except append-only audit fields.

**Presented Item** — the record of which item was shown, in which position,
to which session — needed for exposure/cooling and psychometrics.
Immutable once written.

**Response** — a learner's answer to one Presented Item: value, timing,
whether changed (if allowed), final submission, idempotency key, whether
received live or replayed after reconnection. Immutable once the session
finalizes. This is scoring-relevant evidence.

**Hesitation Signal / Assistance Offer / Assistance Usage** — timing and
interaction telemetry around the assistance system. **Never** scoring
evidence — physically separated (own table/columns, unreadable by any
scoring view). Used for analytics and item design only. Hesitation timing
is configurable per Assessment Definition within platform-governed bounds,
never hardwired.

**Integrity Signal** — proportionate forensic evidence from the assessment
surface: item displayed, option selected/changed, navigation, timestamps,
hint/help events, visibility changes, reconnect events, submission events.
Never an academic score input. Patterns raise *review signals* for a human,
never verdicts. Webcam/microphone/screen capture and raw keylogging are
outside the baseline (doc 09, PARK).

**Misconception Evidence** — derived from a wrong Response mapped through
its Option's misconception code. Aggregatable per-cohort; the aggregate
must never expose an individual learner_id.

**Pre-test diagnosis / Personal Reading Map / Post-test Result / Mastery
Result / Safety Gate Result** — all *derived* from Responses at
well-defined computation points (doc 07). None is writable by the client;
all are recomputed server-side, and the safety gate and mastery result are
recomputed a second time, independently, at certificate issuance. Every
Result records the engine version and scoring policy version it was computed
under (historical scoring reproducibility, doc 08).

## Credentials

**Certificate** — an issued credential. Its **signed payload** (HMAC-SHA256
under a versioned key) binds, at minimum: certificate identity/number,
learner identity snapshot (or its hash), the relevant result, issuance
time, the canonical content release identity **and its content hash**, the
assessment definition identity/version, and the signing key version.
Changing any protected field — including the release binding — must cause
verification failure. Owner: issued by the system on behalf of the
institution. Immutable once issued; never edited — a wrong certificate is
revoked/superseded, never patched. Historical reproducibility: **absolute**
— verifiable indefinitely, even after the signing key rotates (old keys
become verify-only, never deleted). The earlier design that kept
`plp_release_id` outside the signature payload is **withdrawn**.

**Certificate Identity Snapshot** — the immutable, certificate-time copy (or
immutable reference/hash) of the identity attributes the certificate
presents: name as issued, and photo reference/hash where the certificate
template includes one. Later changes to the Person's profile (photo, display
name where policy permits, other mutable data) never alter an issued
certificate. Current profile state and historical credential identity are
separate concerns.

**Verification Record** — the public-safe read of a Certificate
(pass/predikat/institution/date, plus validity/revocation state). Not a
separate stored entity — a projection computed at request time. Exactly one
canonical public verification route exists.

**Revocation / Supersession** — a Certificate can be marked revoked (fraud,
error) but the row and its verification history are never deleted — the
public verification response changes to reflect revocation, the record
itself doesn't disappear.

## Intelligence

**Item Statistics / Empirical Difficulty** — server-computed aggregates
over *eligible* Responses for one Item, recalculated on a cadence with a
minimum-evidence threshold. Derived, not source-of-truth — recomputable
from raw Responses at any time. **Authored/predicted difficulty and
empirically estimated difficulty are separate fields**; empirical fields
hold only values produced by a valid method over sufficient legitimate
evidence, and are otherwise honestly empty. No seeded or fabricated
empirical values, ever.

**Question Health** — the longitudinal observation of how each Item behaves
in legitimate evidence: correctness rate, distractor uptake, position
effects, drift over time, and (LATER) discrimination and fit. When
minimum-evidence thresholds are met and a pattern is detected (e.g. an item
almost always correct, or almost always wrong), PINTAR raises a *signal for
educator review*. PINTAR never autonomously concludes "too easy", "invalid"
or "curriculum wrong" — possible explanations include legitimate
difficulty, wording, distractors, prerequisite weakness, lesson weakness or
a widespread misconception. **PINTAR observes, learns and highlights.
Educators interpret and decide.** Uses `OFFICIAL` evidence only. Lifecycle
in doc 04 §9.

**Misconception Aggregate** — cohort-level rollup of Misconception
Evidence, tenant-scoped, no individual learner identifiable.

**Canonical Metric Catalogue** — the PINTAR-owned definitions (name,
meaning, calculation, evidence eligibility, minimum sample, allowed
visualizations, allowed audiences) of every metric that may appear in any
report. Institutions never redefine a metric's meaning or calculation.

**Standard Report** — a PINTAR-defined assembly of catalogue metrics for a
role and purpose (educator class intelligence, institutional intelligence,
learner results).

**Institution Report Template** — an institution's saved customization of a
Standard Report: metric selection from the catalogue, ordering, supported
visualization choice, title, branding. Never a formula, never SQL. "The
evidence stays the same; only the telling changes."

**Educator Briefing / Institutional Briefing** — a generated narrative
artefact (see lifecycle doc) built from catalogue metrics and aggregates,
at defined read-time budgets. Never raw aggregates rendered as-is.

**Curriculum-Improvement Recommendation** — a Studio-facing suggestion
generated when a Misconception Aggregate or Question Health signal crosses a
threshold on one Item/Option. Always a suggestion for a human reviewer —
never an automatic content edit.

**AI Provider Gateway** — the single, provider-neutral conceptual boundary
through which any AI capability (drafting items, mapping prerequisites,
generating distractors, producing learner-facing assistance language,
summarizing evidence) is requested. PINTAR owns the capability contracts,
canonical schemas, validation, provenance, governance and workflow on its
side of the boundary; providers supply capabilities on the other side.
**No provider (Claude, NotebookLM, Gemini, OpenAI, …) is part of this
domain model.** Provider identity is provenance metadata on an AI-produced
artefact, nothing more. `AI proposes → PINTAR validates → humans govern.`

**Authoring Intelligence Context** — the privileged context available to AI
capabilities during governed content production (sources, answer keys,
misconception maps). Exists only inside Studio/server code paths.

**Learner Assistance Intelligence Context** — the context available to any
AI capability that produces learner-facing output. Structurally excludes
answer keys, correctness, misconception-to-answer mappings, grading secrets
and any privileged assessment data. Security through data boundaries, not
AI obedience: a prompt instruction "do not reveal" is never the control.

**AI Provenance** — for any AI-produced artefact: capability contract,
provider/model identifier, request/response identifiers, validation result,
human reviewer/approver. Required before an AI-produced item may enter
review; never a substitute for human approval.

## Governance

**Review** — a human action transitioning content between lifecycle
states, always attributed to a specific reviewer, always distinct from the
content's author for the same item.

**Approval** — sign-off, recorded with reviewer id + timestamp; does not by
itself make content immutable (see Freeze).

**Publication** — the act of making a FROZEN release live/available within
the institution; restricted to `CAN_PUBLISH`. Does not assign it to any
learner (see Learning Assignment). No external AI/content tool may publish.

**Audit Record** — an append-only log entry for role grants/revocations,
enrollment/membership changes, transfers, item edits, release freezes,
publications, learning-assignment moves between releases, certificate
issuance/revocation, integrity reviews, evidence-eligibility overrides and
administrative session terminations. Never read by any scoring or
UI-decision logic — exists for accountability only.

## Textual ERD (major relationships)

```
Institution 1─* Faculty 1─* Department 1─* Programme 1─* Cohort 1─* Class
Institution 1─* AcademicPeriod
Person 1─* Account
Person 1─* InstitutionEnrollment *─1 Institution   (dated, append-only)
InstitutionEnrollment 1─* ClassCohortMembership *─1 Class/Cohort   (dated, append-only)
InstitutionEnrollment(from) ─ Transfer ─ InstitutionEnrollment(to)   (explicit, audited)
Person 1─* RoleAssignment (staff; scoped to any organisation level)
Source 1─* SourceVersion 1─* Course 1─* Module 1─* Lesson 1─* LearningObjective
LearningObjective *─* Item (via objective_ids)
Item 1─* Option; Option *─1 Misconception; Item *─0/1 ParallelGroup
Item 1─* MCQQualityFinding
Module 1─* AssessmentDefinition (versioned)
Course/Module ⇒ (frozen at) PLPRelease ─ PublishReadiness (derived)
PLPRelease 1─* LearningAssignment *─1 Class/Cohort  (PUBLISH ≠ ASSIGN)
LearningAssignment 1─* AssessmentAssignment *─1 AssessmentDefinition
AssessmentAssignment 1─* AssessmentSession (per learner; carries full provenance:
    person, enrollment, period, class, release, definition version,
    engine version, scoring policy version, channel, evidence class)
AssessmentSession 1─* PresentedItem 1─1 Response
AssessmentSession 1─* IntegritySignal (never scoring)
Response *─1 Misconception (via chosen Option, when wrong)
AssessmentSession 1─0/1 Certificate (signed payload binds release id + hash,
    definition version, identity snapshot, key version)
Certificate 1─1 CertificateIdentitySnapshot
Eligible(OFFICIAL) evidence only ⇒ ItemStatistics / QuestionHealth /
    MisconceptionAggregate / MetricCatalogue values
MetricCatalogue ⇒ StandardReport ⇒ InstitutionReportTemplate
AI capability ⇒ AIProviderGateway (provider is provenance, not a domain entity)
```
