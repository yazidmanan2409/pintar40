# 05 — PINTAR Authorization Matrix

*Baseline amendment (2026-09-12): rows added for enrollment/membership/
transfer, Learning Assignment, Publish Readiness, Quick Assessment,
Question Health, MCQ Quality Findings, report templates, integrity signals,
evidence eligibility, profile/identity snapshot, session termination/
extension, and AI intelligence contexts. `CAN_FLASH_QUIZ` renamed
`CAN_QUICK_ASSESSMENT`.*

UI visibility is never authorization. Every cell below must be enforced at
the **database/RLS** layer independent of the application server, and
independently again at the **application/API** layer — the two must never
be allowed to drift (one shared authorization primitive, called from both,
per the ground-zero rule in FABLE-01 §4). The **UI** layer only reflects
what the lower two layers already allow.

Roles: STUDENT(1) · EDUCATOR(2) · HEAD_OF_DEPARTMENT(3) · DEAN(4) ·
INSTITUTION_ADMIN(5) · SYSTEM_ADMIN(6) · SERVICE (server-only, service_role)
· PUBLIC (anonymous, Mini-PINTAR/verification only).

Learners (STUDENT) are authorized through an ACTIVE Enrollment/Membership,
not through a Role Assignment. Staff roles are authorized through scoped
Role Assignments.

## Content (Source/Course/Module/Lesson/Item/Option)

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Read (published + assigned, own tenant, no answer key) | ✅ (assigned only) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read answer key / rationale-to-correct mapping | ❌ | ❌ (own drafts only, pre-freeze) | ✅ (in review) | ❌ | ✅ | ✅ | ✅ |
| Ingest (Easy Upload / Structured Package Import) | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Create draft / edit pre-freeze | ❌ | ✅ (own drafts) | ✅ | ❌ | ✅ | ✅ | ✅ |
| Read Publish Readiness + MCQ Quality Findings | ❌ | ✅ (own drafts) | ✅ | ❌ | ✅ | ✅ | ✅ |
| Acknowledge WARNING-level quality finding | ❌ | ❌ | ✅ (not own draft) | ❌ | ✅ | ✅ | — |
| Review (approve) | ❌ | ❌ | ✅ (not own draft) | ❌ | ✅ (not own draft) | ✅ (not own draft) | — |
| Freeze release | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | — |
| Publish/withdraw | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ (never; human only — INV-32) |
| Edit post-freeze | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (immutable — INV-04, no exceptions) |

## Learning Assignment (PUBLISH ≠ ASSIGN)

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Create/end assignment for a class | ❌ | ✅ (own classes) | ✅ (own dept) | ❌ | ✅ | ✅ | — |
| Move an ACTIVE assignment to a corrected release (governed policy) | ❌ | ❌ | ✅ (own dept, not-started learners only) | ❌ | ✅ (per doc 08 policy, audited) | ✅ | — |
| Read own assignments | ✅ (own only) | ✅ (own classes) | ✅ | ✅ (read) | ✅ | ✅ | ✅ |

## Assessment sessions & responses

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Create own session | ✅ (ACTIVE membership, assignment OPEN) | — | — | — | — | — | — |
| Continue own session (INV-27) | ✅ (own, active, before deadline, no INV-17 event) | — | — | — | — | — | — |
| Read own session/responses | ✅ (own only) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Read any learner's raw responses | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ only |
| Read cohort-aggregate (no learner id) | ❌ | ✅ (own classes) | ✅ (own dept) | ✅ (own institution) | ✅ | ✅ | ✅ |
| Submit/finalize | ✅ (own session, server-computed) | — | — | — | — | — | ✅ |
| Launch Quick Assessment (`CAN_QUICK_ASSESSMENT`) | ❌ | ✅ (own eligible classes + eligible banks) | ✅ | ❌ | ✅ | ✅ | — |
| Configure assessment definition | ❌ | ❌ (Quick Assessment parameters only, within governed limits) | ✅ | ❌ | ✅ | ✅ | — |
| Extend a session's authoritative deadline (audited) | ❌ | ✅ (own classes, within governed limit) | ✅ | ❌ | ✅ | ✅ | — |
| Terminate a session administratively (audited, INV-17) | ❌ | ❌ | ✅ (own dept) | ❌ | ✅ | ✅ | ✅ (security intervention) |
| Manage EXAM-tier bank / cooling | ❌ | ❌ | ✅ (review readiness only) | ❌ | ✅ | ✅ | ✅ |

## Identity, enrollment, membership, transfer

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Edit own profile (photo, mutable fields where policy permits) | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) | — |
| Read a learner's current profile | ✅ (own) | ✅ (own classes) | ✅ (own dept) | ❌ | ✅ (own institution) | ✅ | ✅ |
| Create/end enrollment; create/close membership; period rollover | ❌ | ❌ | ❌ | ❌ | ✅ (own institution) | ✅ | ✅ |
| Request transfer (`CAN_AUTHORIZE_TRANSFER`) | per policy (learner/guardian) | ❌ | ❌ | ❌ | ✅ (sending or receiving) | ✅ | — |
| Authorize transfer | per policy (consent) | ❌ | ❌ | ❌ | ✅ (counterpart institution) | ✅ | — |
| Read portable record of a transferred-in learner | ✅ (own) | ✅ (own classes) | ✅ (own dept) | ❌ | ✅ | ✅ | ✅ |
| Read the sending institution's institution-scoped records after transfer | ❌ | ❌ | ❌ | ❌ | ❌ (receiving institution, always) | ✅ | ✅ |

## Certificates

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Issue (system-triggered; identity snapshot taken) | — | — | — | — | — | — | ✅ |
| Read own certificate | ✅ (own only, incl. classroom-card identity) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Public verification read (pass/predikat/institution/date/validity only) — the one canonical route | ✅ anon | ✅ anon | ✅ anon | ✅ anon | ✅ anon | ✅ anon | ✅ |
| Revoke | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | — |
| Manage template/numbering prefix | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | — |
| Alter an issued certificate's identity snapshot | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (immutable — INV-30) |

## Roles, scopes, and organisation

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Grant a role ≤ own rank, within own scope | ❌ | ❌ | ❌ (HoD does not grant) | ❌ | ✅ (below INST_ADMIN) | ✅ (any) | — |
| Self-grant above STUDENT | ❌ (blocked, INV-16) | ❌ | ❌ | ❌ | ❌ | ❌ | — |
| Edit organisation hierarchy / Academic Periods | ❌ | ❌ | ❌ | ❌ | ✅ (own institution) | ✅ | — |
| System-wide config switches (maintenance, registration lock, feature flags) | ❌ | ❌ | ❌ | ❌ | ❌ (own-institution scoped switches only) | ✅ | — |

## Intelligence, reporting, Question Health, integrity

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Read own Peta Bacaan Personal / own results | ✅ (own only) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Read Class Learning Intelligence (Standard Report) | ❌ | ✅ (own classes) | ✅ (own dept) | ❌ | ✅ | ✅ | ✅ |
| Read Institutional Learning Intelligence (Standard Report) | ❌ | ❌ | ❌ | ✅ (own institution) | ✅ | ✅ | ✅ |
| Create/edit Institution Report Templates (`CAN_MANAGE_REPORT_TEMPLATES`) — selection/order/visual/title/branding only | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | — |
| Redefine a catalogue metric's meaning/calculation | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (catalogue changes are a PINTAR release, not a runtime action) | — |
| Read Question Health signals | ❌ | ✅ (own classes' items) | ✅ (own dept) | ❌ | ✅ | ✅ | ✅ |
| Review/decide a Question Health signal (`CAN_REVIEW_QUESTION_HEALTH`) | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | — |
| Read integrity review signals (no verdicts) | ❌ | ✅ (own classes) | ✅ (own dept) | ❌ | ✅ | ✅ | ✅ |
| Record an integrity review decision (`CAN_REVIEW_INTEGRITY`, human only, audited) | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ (never automatic) |
| Override evidence eligibility (new audited record, never an edit) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Any Studio capability (author/review/freeze/publish) | ❌ | (per content matrix) | (per content matrix) | **❌ — always, by design (INV-19)** | (per content matrix) | (per content matrix) | — |

## AI intelligence contexts (principals, not roles)

| Context | May read | May never read | May write |
|---|---|---|---|
| Authoring Intelligence Context (inside Studio/server, governed production) | sources, draft items incl. correctness/rationale/misconception map, taxonomy | learner PII beyond what the task needs; other tenants' content | AI-produced *proposals* with provenance, into INGESTED/STRUCTURED only — never APPROVED/FROZEN/PUBLISHED |
| Learner Assistance Intelligence Context | the learner-sanitized item shape (same as STUDENT), the learner's own stage/persona, lesson text | answer keys, correctness, misconception-to-answer mappings, grading secrets, other learners' data (INV-31) | assistance text, validated against INV-02 before serving; telemetry only |

## Public (anonymous) surface

| Action | PUBLIC |
|---|---|
| Certificate verification (one canonical route) | ✅ |
| Mini-PINTAR public trial session (`PUBLIC_DEMO` mode, `PUBLIC_DEMO` evidence class) | ✅ (rate-limited; no persistence beyond the demo's own scope; never eligible for anything official) |
| Anything else | ❌ |

## Audit trail

| Action | STUDENT | EDUCATOR | HoD | DEAN | INST_ADMIN | SYS_ADMIN | SERVICE |
|---|---|---|---|---|---|---|---|
| Write audit record | ❌ (system writes on their behalf) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ only (append-only) |
| Read audit trail | ❌ | ❌ | ❌ (own actions only, if surfaced) | ❌ | ✅ (own institution) | ✅ | ✅ |
| Update/delete audit record | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ (append-only — INV-18) |

## Privileged/service-role-only operations (never reachable by any client role)

- Deriving `person_id`/`learner_id` for writes from the authenticated session.
- Computing/recomputing scores and safety-gate results; stamping engine and
  scoring-policy versions.
- Issuing signed URLs for asset reads.
- Uploading to storage (server route only; no client ever holds a bucket
  write policy).
- Signing/verifying certificate HMACs; taking the identity snapshot.
- Writing audit records.
- Classifying evidence (`evidence_class`, channel) at write time.
- Running Question Health, metric and psychometric computations over
  eligible evidence.
- Calling the AI Provider Gateway (no client ever holds provider credentials).
- Executing a transfer or a period rollover.

Every row above must be expressible as an automated test per the
verification contract (doc 16): authenticate as the denied role, attempt
the action via direct API/REST call (not through UI), assert refusal. A ✅
cell needs the positive-path test; a ❌ cell needs the negative-path
(refusal) test.
