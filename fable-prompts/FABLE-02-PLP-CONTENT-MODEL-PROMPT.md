# FABLE-02 — The PLP Content Model, Assessment Definitions, Evidence Schema & Studio Data Layer

*Synchronized to the Architecture Baseline (docs/rebuild/01–16). Controlling
documents for this phase: 02 (Learning content; Assessment; Learning
evidence; Intelligence), 03 (INV-01–04, 11, 12, 20, 22, 24, 29, 33, 35), 04
§1–2, §4, §9, 06, 08. This is the schema phase: every table later phases
write evidence into is created here, with provenance and structural
eligibility from its first migration.*

Depends on Phase 1 (Person/enrollment model, roles, tenancy, RLS pattern,
storage contract, audit trail, engineering system) being in place, its
checklist green and its mini audit gate closed.

## 1. Content hierarchy

```
Source / SourceVersion   (textbook edition, ISBN, page-precise citations — append-only; OD-3 before real content)
  → Course                (subject × jenjang/stage × grade label)
    → Module               (chapter, ordered)
      → Lesson              (body_markdown + summary + worked examples + media)
        → LearningObjective  (Bloom level, is_core flag)
        → Item                (stem/stimulus, item_type, objective_ids, is_safety_critical BOOLEAN NOT NULL,
                               bank_type, parallel_group NULLABLE, predicted_difficulty)
          → ItemOption          (label, text, is_correct, rationale REQUIRED, misconception_code)
AssessmentDefinition  (versioned, per module/course: mode, pool type, item_count, difficulty mix,
                        safety-critical minimum, passing rules, hesitation window within platform bounds,
                        shuffle policy, pause/offline_tolerant flags, late-sync grace, attempt limits)
MisconceptionTaxonomy (code, label, description, remediation — NOT NULL; append-only; codes never reused)
PLPRelease            (one frozen/published snapshot, content_sha256, semantic version label,
                        supersedes chain, institution/tenant scope)
MCQQualityFinding     (item or bank, pattern class, severity ERROR|WARNING, evidence, acknowledged_by/at)
```

Every table here carries `institution_id`/tenant scope per Phase 1 §5.
`predicted_difficulty` (authored/provisional) and any **empirical** field
are **separate columns**; empirical fields are NULL until legitimately
computed from sufficient `OFFICIAL` evidence — **never seeded, never
defaulted to look complete** (doc 02 "Item Statistics").

**Naming:** "AssessmentDefinition" replaces the earlier "AssessmentBlueprint".
A change to any rule that could alter the interpretation of a result is a
new Definition version (INV-29).

## 2. Content lifecycle — enforce in schema, not just convention (doc 04 §1, INV-22)

```
INGESTED → STRUCTURED → VALIDATED → IN_REVIEW → APPROVED → FROZEN → PUBLISHED → SUPERSEDED
                      ↘ VALIDATION_FAILED
```
- A status-transition trigger rejects any move that skips a required step
  or reverses out of FROZEN/PUBLISHED/SUPERSEDED; the only regression is
  VALIDATED → VALIDATION_FAILED (→ STRUCTURED to fix).
- APPROVED sets a human reviewer id + timestamp (reviewer ≠ author,
  enforced). It does **not** lock the row. **APPROVED ≠ FROZEN.**
- FROZEN computes `content_sha256` over what is taught only (lesson bodies,
  items, options, rationales, misconception links, assessment definitions)
  — exclude `created_at`, `status`, reviewer and release/provenance
  metadata — and a trigger makes the taught-content columns immutable from
  that point on (INV-04). If a column's in/out-of-hash status is ambiguous,
  it goes inside, and the decision is recorded before the migration ships
  (doc 08).
- PUBLISHED makes a release *available to the institution*; it assigns
  nothing to any learner (PUBLISH ≠ ASSIGN — §10). Publication is a human
  `CAN_PUBLISH` action; no SERVICE/AI path can set PUBLISHED (INV-32).
- A release can SUPERSEDE a prior release; keep the chain queryable in both
  directions. Sessions and certificates bound to the old release are never
  touched.
- **Publish Readiness** is a derived projection (doc 04 §1a), not a status:
  a server function returns `READY` / `ACTION_REQUIRED` / `BLOCKED` plus the
  exact blockers (technical validation, academic approval, FROZEN, ERROR
  findings, unacknowledged WARNING findings). The FROZEN → PUBLISHED
  transition re-checks the same conditions server-side (INV-35). Studio UI
  for it is Phase 5.

## 3. Three-tier question bank isolation (INV-12)

Every item carries a `bank_type`: `PRACTICE` | `TEST` | `EXAM`, enforced at
the database level:

- A SQL-level constraint/check makes it impossible for a `PRACTICE`- or
  `TEST`-configured assessment to draw an `EXAM`-tier item — one-way
  exclusion, `EXAM` never leaks down.
- `PRACTICE`: immediate rationales, unlimited retries. `TEST`: controlled
  class windows, limited attempts. `EXAM`: high-stakes, strictly isolated
  and audited.
- Exposure & cooling: track how many times an `EXAM` item has been
  delivered and to which cohort; support an admin-set cooling period
  enforced by the session assembler (Phase 3/4), not just documented.
- **`parallel_group`**: items that are equivalent siblings share a group id.
  The assembler never presents two members of one group to the same learner
  within the definition's window, and the standard learning-cycle post-test
  excludes every item **and every sibling** of every item presented in that
  learner's pre-test (INV-24). Provide the exclusion as a database function
  the assembler must call; there is no configurable "repetition policy" on
  learning-cycle definitions.

## 4. Item types (doc 02 "Item"; OD-8)

An extensible, source-reflective **item-type registry** (enum/discriminated
union with a per-type renderer/scorer contract), not a hardcoded switch:
`MCQ_SINGLE`, `MCQ_MULTI`, `NUMERIC`/step-work, `GRID`,
`TRUE_FALSE_BATTERY`, `MATCHING`, `IMAGE_ANCHORED` are registered types. A
new type is added to the registry and the sanitizer allow-list — never a
second engine (INV-26). Which non-MCQ types receive real V1 content and
learner-UI polish is **OD-8 (ask the product owner once OD-3 is settled)**;
do not force a source item into MCQ_SINGLE, and do not build UI for a type
with no confirmed content.

## 5. Doctrine constraints — enforced by the database

- Any hint/scaffold column (`petunjuk`, `arah_berpikir`, or equivalent) gets
  a regex CHECK constraint blocking it from containing the correct option's
  text or letter, including narrowing ("not A or C") — INV-02.
- `ItemOption.rationale` is `NOT NULL` and non-empty for every option
  (INV-03). `MisconceptionTaxonomy.remediation` is `NOT NULL`.
- `Item.is_safety_critical` is `NOT NULL` with a default of false; the
  definition's safety-critical minimum references it (INV-10).

## 6. Lesson media

One JSONB column on `Lesson`, not a separate media table per type.
- A CHECK constraint rejects any `audio.url`/`video.url` entry missing a
  non-empty transcript field — accessibility enforced at the data layer.
- A trigger blocks writing `media` on any lesson bound to a
  FROZEN/PUBLISHED/SUPERSEDED release.
- Media objects reference storage paths only (Phase 1 §7 private bucket +
  signed-URL contract) — never a public URL.

## 7. Evidence, session and telemetry schema (doc 06; INV-11, INV-20, INV-28, INV-29, INV-33) — created here, written by Phases 3–4

Create, with RLS closed and provenance NOT NULL from the first migration:

- **AssessmentSession**: full **Evidence Provenance** — `person_id`,
  `institution_id`, `enrollment_id`, `academic_period_id`,
  `class_id`/`cohort_id` (nullable where irrelevant),
  `learning_assignment_id`, `assessment_assignment_id`, `plp_release_id`,
  `assessment_definition_id` + version, `engine_version`,
  `scoring_policy_version`, `evidence_channel` (`ONLINE` |
  `PAPER_MANUAL_ENTRY` | `PAPER_IMPORTED` | `PUBLIC_DEMO`),
  `evidence_class` (`OFFICIAL` | `PREVIEW` | `SYNTHETIC` | `PUBLIC_DEMO`),
  `mode`, status (enumerated: `CREATED, IN_PROGRESS, PAUSED, SUBMITTED,
  EXPIRED, TERMINATED, FINALIZED` with a transition trigger — doc 04 §5),
  **`authoritative_deadline`**, shuffle seed (server-only), termination
  reason. Provenance columns are immutable after insert (INV-33).
  `evidence_class` is derived at write time: `SYNTHETIC` if the tenant is
  synthetic, `PREVIEW` if created via preview/dev tooling, `PUBLIC_DEMO` for
  the public mode, else `OFFICIAL` — never client-supplied.
- **PresentedItem** (session, item, position) — immutable.
- **Response**: value, `idempotency_key (session_id, presented_item_id,
  client_seq)` with a UNIQUE constraint, `received_at` (server),
  `client_asserted_at` (nullable), `receipt_mode` (`LIVE` | `REPLAYED` |
  `LATE_SYNC`), final flag; append-only where the definition allows changes
  (INV-28).
- **Result** (mastery, per-domain, safety gate, delta inputs) with
  `engine_version` and `scoring_policy_version` NOT NULL; immutable; a
  recomputation writes a **new** Result row linked to the original, never an
  UPDATE (INV-29).
- **Telemetry tables** (hesitation/assistance) — physically separate;
  **no scoring view or function may reference them** (INV-11), asserted by
  a schema-lint test. Hesitation events reference the definition's
  configured window, never a constant.
- **IntegritySignal** (category-7 events: visibility change, navigation,
  reconnect, rapid option change, submission anomaly) — separate from
  scoring; never a verdict column.
- **Session audit events** (deadline extension, termination) go to the
  Phase 1 audit table, not a new log.
- **Eligibility views** — the only read path for analytics, Question
  Health, psychometrics, reporting and certificate eligibility:
  `official_sessions`, `official_responses`, `official_results` (and an
  `evidence_class_override` table whose latest audited row the views
  honour). The database roles/grants used by those consumers have **no
  SELECT on the raw tables**. A CI lint fails any analytics/psychometric/
  reporting/certification code path that references a raw evidence table.
- **Retention shape** (FOUNDATION NOW): learner-identifying fields on
  evidence are grouped so an anonymization job can replace them while
  keeping the evidentiary shape and provenance; institution-configurable
  retention window column exists on Institution but no job runs and **no
  duration is defaulted** (OD-5).
- Paper channels exist only as enum values validated by the schema; no
  paper workflow (doc 09 FOUNDATION NOW).

## 8. Views and aggregates

- A public/anon-safe lesson view exposing only FROZEN/PUBLISHED content.
- No view exposing item stems/options/hints is ever anon- or
  authenticated-readable, even if its name suggests "public" — item content
  is a harvestable question bank on its own. Grant these service_role-only,
  and name them so the restriction is obvious.
- A cohort-misconception aggregate view (no individual learner id) —
  tenant-scoped by `institution_id`, **reading `official_responses` only**.
- A per-item statistics view (correctness rate, distractor uptake, position
  effects, response-time) over `official_responses`, with a
  minimum-evidence count exposed so consumers can honour thresholds. No
  Rasch/IRT computation here (LATER).
- **QuestionHealth** table per item with lifecycle `INSUFFICIENT_EVIDENCE →
  OBSERVING → SIGNAL_RAISED → UNDER_REVIEW → {ACKNOWLEDGED_OK |
  ACTION_TAKEN}` (doc 04 §9), transition-enforced; signal computation is
  Phase 6, review surface is Phase 5/6.

## 9. Validator ("coaching validator") and MCQ Quality checks

One validator that scans **every field a learner can read**: stem,
stimulus, option text, hints/scaffolding, lesson body markdown, lesson media
transcripts, misconception remediation text. It flags forbidden-doctrine
words as errors and distinguishes them from legitimate field-of-study
language. Output format is coaching: Lokasi · Masalah · Mengapa penting ·
Cara memperbaiki, always with a concrete fix. Adding a learner-readable
column later means adding it to this validator in the same migration
(Lesson 10).

**MCQ Quality / Testwiseness** (doc 07; Lesson 14) runs at STRUCTURED →
VALIDATED and writes `MCQQualityFinding` rows: correct-option length
imbalance, grammatical cues, systematically more precise correct answers,
implausible distractors, stem wording exposing the answer, answer-position
patterns across a bank, over-use of all/none constructions, weak
misconception linkage, suspicious bank-wide regularities. Findings are
severity-graded; they detect **exploitable patterns**, never enforce
cosmetic uniformity (options are not forced to equal length). ERROR-level
findings block Publish Readiness; WARNING-level findings must be
acknowledged by `CAN_REVIEW`. The Phase 2 test fixtures include the
adversarial banks from doc 16 §4.

## 10. Learning Assignment and Assessment Assignment schema (doc 02; doc 04 §4)

- **LearningAssignment** (`PLP Release → Class/Cohort`): release, subject/
  course, grade/context, class or cohort, academic period, availability
  window, required/optional, learning-cycle configuration, release-correction
  policy, `assigned_by`, `assigned_at`; lifecycle `DRAFT → ACTIVE → ENDED` /
  `WITHDRAWN`. A release change on an ACTIVE assignment is an explicit
  audited action recording actor, reason, affected learner set, old and new
  release — completed learners untouched, in-progress sessions stay bound
  to their release, not-started learners may move (doc 08).
- **AssessmentAssignment** (`AssessmentDefinition → Class/Cohort/window`):
  lifecycle `DRAFT → SCHEDULED → OPEN → CLOSED`. `CLOSED` stops new
  sessions only; it never touches in-progress sessions (INV-27).
- A learning-cycle Learning Assignment generates its pre-test and post-test
  Assessment Assignments from two distinct definitions.

## 11. Ingestion pipeline (data layer only — Studio UI is Phase 5)

- **Structured Package Import**: an ingest function that takes a
  machine-produced canonical package (from any producer — AI or human) and
  creates rows at `INGESTED`, with a raw-import table keeping the original
  payload for provenance.
- **Easy Upload** (data layer): a function that accepts a folder/ZIP/loose
  files manifest, recognizes likely asset roles and structure, returns an
  inferred mapping with confidence plus the questions a human must confirm,
  and only then creates `INGESTED` rows. Never silently guesses a mapping
  that changes what a learner sees.
- **AI provenance** fields on ingested artefacts (capability contract,
  provider/model identifier, request id, validation result, human
  reviewer) — provider identity is metadata; no provider-named table or
  enum exists (INV-32). No vendor-specific parser (doc 09 PARK).

## Acceptance checklist — selftest contract (must be green before Phase 3)

- [ ] INV-02: saving a hint containing the correct answer's text (or
      narrowing to two options) fails at the database level via REST.
- [ ] INV-03: saving an `ItemOption` with an empty rationale fails.
- [ ] INV-04 / INV-22: freezing computes a hash unchanged by a subsequent
      metadata-only update; editing taught-content columns on a frozen row
      fails; every non-adjacent/reverse transition is rejected except
      VALIDATED → VALIDATION_FAILED; setting PUBLISHED via a SERVICE/ingest
      path is refused (INV-32).
- [ ] INV-35: Publish Readiness returns BLOCKED with the correct blocker for
      each adversarial fixture (2–3× longer correct options; ~70% one
      position; implausible distractors; stem-copied wording); READY once
      resolved and FROZEN with approval recorded; FROZEN → PUBLISHED refused
      while BLOCKED.
- [ ] INV-12: an `EXAM`-tier item cannot be drawn into a `PRACTICE`- or
      `TEST`-configured session; a cooled `EXAM` item is excluded for its
      cohort.
- [ ] INV-24: the exclusion function, given a learner's pre-test presented
      items, returns a candidate set with an empty intersection of item ids
      and of `parallel_group`s; attempting to configure overlap on a
      learning-cycle definition is rejected.
- [ ] The coaching validator catches a forbidden word planted in lesson
      body text, transcript and option text, and does not flag a planted
      legitimate domain term.
- [ ] No view exposing item content is readable by an anon or authenticated
      REST call (INV-01).
- [ ] INV-13: the cohort-misconception view returns different result sets
      in the scope of two synthetic institutions.
- [ ] INV-33: inserting a session without channel/class/enrollment/release/
      definition/engine/policy fields fails; updating a provenance column
      fails; `evidence_class` supplied by the client is ignored/derived.
- [ ] INV-20: sessions seeded as SYNTHETIC, PREVIEW and PUBLIC_DEMO never
      appear in `official_*` views; the analytics role has no SELECT on raw
      evidence tables; the CI lint fails a planted direct read.
- [ ] INV-11: schema-lint asserts no scoring view/function references a
      telemetry table.
- [ ] INV-28: inserting two responses with the same idempotency key yields
      one row (second is acknowledged, not duplicated).
- [ ] INV-29: a Result cannot be inserted without `engine_version` and
      `scoring_policy_version`; UPDATE on a Result is refused.
- [ ] Predicted vs empirical: empirical difficulty columns are NULL for
      every seeded item; the seed contains no empirical values.
- [ ] Learning/Assessment Assignment: `CLOSED` on an assessment assignment
      does not change any session row; a release move on an ACTIVE learning
      assignment writes an audit row and refuses to touch sessions bound to
      the old release.
- [ ] Ingestion: a structured package and an Easy Upload manifest both land
      at `INGESTED`; the Easy Upload path returns confirmation questions
      rather than guessing an ambiguous role; no provider-named schema object
      exists (schema-lint).

Add these to the running `selftest` manifest alongside Phase 1's tests —
`npm run selftest` must stay green for both phases together. Then: mini
audit (answer-key leakage, raw-evidence reads, provider concepts, unsafe
`SECURITY DEFINER`, unversioned scoring); fix; gate.
