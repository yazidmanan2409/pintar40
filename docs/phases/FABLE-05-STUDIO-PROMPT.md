# FABLE-05 — Studio: Authoring, Review, Freeze, Publish

Depends on Phases 1–4. This is where the capability model from Phase 1 §4
gets its UI, and where content actually enters the system as a first-class
workflow rather than direct seeding.

## 1. Studio home ("Beranda")

Task-first, not a dashboard of everything: items I authored awaiting
revision, items awaiting my review, open quality-blocker flags. A card with
zero count simply does not render — never show an empty-state "0" card.

## 2. Import / draft authoring (`CAN_DRAFT`)

- Structured import (e.g. CSV or a structured paste) plus manual authoring,
  both landing at `INGESTED` and running through the Phase 2 coaching
  validator before a human ever sees a raw error.
- User-facing verbs are "Create Learning Package / Assessment / Video" —
  never "Import / Parse / Validate" in the UI copy, even though that's
  literally what's happening underneath.

### Anti-bias distractor QA (the "11-year-old test")

Before an item can leave `INGESTED`/`STRUCTURED`, run automated psychometric
quality checks, surfaced as coaching (not raw warnings):

- **Character-length delta guard**: if the correct option's length deviates
  from the distractor average by more than ±15%, flag "Option Length Bias
  Detected" — the classic test-wiseness tell (correct answers written with
  more care/detail than distractors).
- If items are drafted or refined via an AI producer, inject an explicit
  authoring constraint: all options must be balanced in character length,
  grammatical structure, and specificity, so length alone never signals the
  answer.
- Seeded, deterministic option shuffling so the correct answer's position
  (A/B/C/D) is evenly distributed across an assessment paper, not
  systematically biased to one slot.

## 3. Review queue (`CAN_REVIEW`)

- Reviewer must differ from author on the same item (author/reviewer
  separation, enforced server-side, not just by UI hiding a button).
- Every validator finding shown as coaching (Lokasi · Masalah · Mengapa
  penting · Cara memperbaiki), never a raw error/stack trace.
- Approve transitions to APPROVED — a human sign-off, row still editable.

## 4. Item health / quality dashboard

Surfaces validator findings and empirical-difficulty outliers (from the
Phase 2 empirical-difficulty view) in the same coaching format. Include a
completeness report for lesson media missing transcripts — a quality report,
not framed as a violation report.

## 5. Freeze & publish (`CAN_FREEZE_RELEASE`, `CAN_PUBLISH`)

- "Approve & Freeze" button — visibly the moment content becomes immutable
  and hash-locked (Phase 2 §2). Make the immutability consequence legible in
  the UI copy, not just in a tooltip.
- Publish/withdraw restricted to `CAN_PUBLISH` only (Institution Admin,
  System Admin). Withdrawing a release must not delete it — it moves to
  SUPERSEDED, chain intact.

## 6. Media management

Asset upload UI wired to the Phase 1 §7 signed-upload contract exclusively
— confirm no code path in this phase's UI ever calls a client-side direct
storage `.upload()` with the anon key. This is the exact mistake to not
repeat.

## 7. Assessment preset builder & integrity control center

Part of the Super Admin & Configuration Studio shell from Phase 1 §10 —
this phase fills in its Assessment Engine panel:

- **Preset builder**: configure assessment rules without writing code —
  pool draw (via `AssessmentBlueprint`), time limits, passing mark, safety
  gate toggle, attempt limits, shuffle flags. No hardcoded item counts in
  route code (Phase 2's blueprint model already requires this; this is its
  admin-facing surface).
- **Integrity control center**: anti-cheating thresholds per mode
  (`PRACTICE`/`TEST`/`EXAM` from Phase 2 §3 — Learning/Controlled/Exam
  strictness), and a log view for tab-switch/focus-loss anomalies during
  `TEST`/`EXAM` sessions. Keep this coaching-framed for reviewers ("N
  anomalies flagged for review"), never an accusatory verdict rendered to
  the learner.
- **Certificate template manager** (ties into Phase 4): assign certificate
  layouts and numbering prefixes per module/course, from this same panel.

## 8. Psychometric calibration loop

- Rasch-model (or equivalent) empirical difficulty recalibration from
  completed sessions, gated at a minimum sample size (e.g. N≥30) before
  recalibrating any single item.
- Misconception-cohort aggregation feeding auto-generated content-
  improvement briefs once a distractor draws convergence above a threshold
  (e.g. ≥30% of wrong answers on one option) — surfaced to reviewers as a
  coaching-style suggestion, not an automatic content change.

## 9. Middleware coverage

Confirm (don't assume) that authentication/scope middleware covers every
route added in Phases 3–5, including in-progress learning and assessment
routes — an expired scope grant or class period must actually interrupt an
active session, not just block the dashboard shell around it.

## Acceptance checklist — as an automated suite (must be green before Phase 6)

- [ ] Test: an educator without `CAN_REVIEW` cannot approve their own
      drafted item via a direct API call (not just hidden UI).
- [ ] Test: an item with a >15% option-length delta is flagged by the
      anti-bias check before it can leave `INGESTED`/`STRUCTURED`.
- [ ] Test: a validator finding is served in Lokasi/Masalah/Mengapa
      penting/Cara memperbaiki shape (assert the response shape, not just
      eyeball the UI).
- [ ] Test: freezing a release via the API produces the same immutable,
      hash-locked result as the Phase 2 database-level test.
- [ ] Test: an Educator role cannot publish/withdraw a release via direct
      API call.
- [ ] Test: uploading a lesson asset through Studio's route never results
      in a client-holding anon key gaining direct storage write access
      (assert the upload request goes through the server route).
- [ ] Test: revoking a scope grant mid-session interrupts an in-progress
      assessment session for that user on its next server round-trip, not
      just their next page load.
- [ ] Test: a non-admin role hitting the preset builder / integrity center
      / certificate template manager endpoints gets a clean refusal.

Add these to the running `selftest` suite — it must stay green across
Phases 1–5 together before Phase 6 starts.
