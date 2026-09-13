# FABLE-03 — The Learning Experience (Dr. Gladys Learning Cycle)

*Synchronized to the Architecture Baseline (docs/rebuild/01–16). Controlling
documents for this phase: 07 (engine contract — this phase creates the one
engine module and its core services), 04 §5–6, 06, 03 (INV-01, 02, 08–11,
24, 26–28, 31). Certificates and the public verification route are Phase 4,
not this phase.*

Depends on Phases 1–2 (green and audit-gated). This phase builds the
learner-facing product end to end for one seeded course before any
Studio/authoring UI exists — content for this phase is seeded through the
Phase 2 ingestion functions into a **synthetic** tenant (its evidence is
`SYNTHETIC`; real content waits on OD-3).

## The cycle

```
QR/link arrival → onboarding (passwordless, or classroom-card PIN for young learners)
  1. PRE-TEST "Pemetaan Awal"            (mode LEARNING_CYCLE_PRETEST)
  2. PETA BACAAN PERSONAL                 (personal reading map)
  3. Lesson(s) via the multimodal lesson player
  4. POST-TEST "Uji Penguasaan"           (mode LEARNING_CYCLE_POSTTEST — zero overlap with the pre-test)
  5. HASIL (results) + delta vs. pre-test + certificate CTA if passed (issuance itself is Phase 4)
```
A learner sees only content **assigned** to them through a Learning
Assignment for a class/cohort they hold an ACTIVE Membership in (PUBLISH ≠
ASSIGN). Pre-test and post-test sessions are created against the two
Assessment Assignments the Learning Assignment generated.

## 0. The one assessment engine — created here, completed in Phase 4 (INV-26)

Create a single engine module (e.g. `lib/assessment-engine/`) that owns:
session creation with start-eligibility checks, item draw (definition
rules, bank isolation, cooling, INV-24 exclusion via the Phase 2 function,
seeded shuffle), the **allow-list sanitizer** producing the learner-facing
item type, response acceptance with idempotency keys, continue-permission
checks, server-side grading with misconception mapping, finalize with
score/mastery/safety gate, and evidence provenance stamping (engine and
scoring-policy versions). Every route in this phase calls this module.
Phase 4 extends **this module** with the remaining modes, full
resilience/replay and Quick Assessment; it never creates a second one. Add
the code-search CI check now: a second implementation of assembly, the
sanitizer, scoring or the safety gate fails the build.

Start eligibility (INV-27): assignment OPEN + ACTIVE membership + no
disallowed repeat exposure. Continue permission on every scored action:
session active, before its `authoritative_deadline`, no INV-17 event — the
assignment window closing or the class ending does **not** stop a learner
who legitimately started.

## 1. Pre-test — "Pemetaan Awal"

- No pass/fail messaging anywhere on this screen or its result; the pre-test
  is diagnostic and never scores pass/fail.
- No rationale reveal. Wrong responses become misconception evidence at
  submission (doc 07 "Server-side grading").
- Progress shown as dots, never a percent bar or countdown-feeling timer.
- Keyboard nav: A–D selects an option, Enter/→ advances, ← goes back.

## 2. Peta Bacaan Personal (reading map)

Not a results page. One card per competency domain, sorted safety-missed →
wajib (mandatory) → disarankan (recommended) → kuat (strong), each with a
chapter/page reference and a plain-language reason a non-technical learner
understands. Derived (recomputable) from the pre-test's misconception
evidence (doc 06 category 5).

## 3. Multimodal lesson player

- Paginated reading, split at heading boundaries, with a dot page tracker.
- Audio/video with playback-rate control, resumable position, and a
  clickable transcript. Watching is participation, never mastery.
- Worked examples revealed step by step, not all at once.
- PDF companions (slide deck / module summary) via signed URLs only.
- Any fraction/ratio-style diagram is drawn live from a data directive
  (e.g. a `[[visual:...]]` line interpreted client-side), not shipped as a
  static image asset.
- Reading progress persists both locally (survives refresh) and server-side,
  and never regresses.
- The lesson served is the exact release the Learning Assignment binds; a
  newer release published mid-course is never swapped in silently (doc 08).

## 4. Post-test — "Uji Penguasaan"

- Formal framing: counting-up timer, pause ("Simpan & Jeda", where the
  definition allows), flag-for-review ("tandai"), a navigator drawer showing
  per-item status. The session's `authoritative_deadline` is the server's;
  the client displays it, never computes it.
- No auto-advance on option selection — the learner explicitly confirms.
- **Zero overlap** with this learner's pre-test: no identical item, no
  `parallel_group` sibling (INV-24) — enforced in the draw, not in UI.
- Safety gate: safety-critical items must be answered correctly (100%,
  where such content applies — INV-10) for mastery, independent of overall
  score.
- Resilience, minimum for this phase (full replay hardening in Phase 4): a
  **durable local outbox** of unacknowledged responses keyed
  `(session_id, presented_item_id, client_seq)`; on reconnect/return the
  client re-reads session state from the server and replays the outbox;
  the server accepts each key exactly once (INV-28). Session *state* is
  never reconstructed locally.

## 5. Item interaction types, learner-facing

Build learner UI for `MCQ_SINGLE` and `MCQ_MULTI` now, plus every other
registered type that the product owner has confirmed real V1 content for
(**OD-8**, contingent on OD-3). Numeric/step-work entry is validated against
the final answer plus step-keyword synonyms, not exact string match. Every
type renders through the engine's per-type renderer contract; none gets its
own scoring path. Do not build polished UI for a type with no confirmed
content, and do not force a source item into MCQ_SINGLE.

## 6. Hesitation-triggered assistance (doc 07 "Assistance behaviour")

- The hesitation window is read from the Assessment Definition, bounded by
  platform-governed limits (Phase 2); the client displays, the server
  decides. No constant in code.
- Reveals as an inline pill, never a modal or banner; hints arrive
  progressively (principle → first step → full explanation) and never
  reveal the answer.
- Copy by stage per FABLE-00's assistance table (🤔/💡/🧭 variants) via the
  Human Language Engine.
- Assistance content — authored or dynamically generated — is validated
  against INV-02 before it is served. Any AI involvement runs in the
  **Learner Assistance Intelligence Context**: its input is the sanitized
  learner item shape only; it structurally cannot receive `is_correct`,
  rationale-to-correct mappings or `misconception_code` (INV-31). Route it
  through the `ai-gateway/` boundary reserved in Phase 1 — contracts and
  provenance only; no multi-provider routing (FOUNDATION NOW).
- Assistance requires connectivity; no hesitation event is raised and no
  hint is served offline.
- Log `hesitation_threshold_reached`, `assistance_offered`,
  `assistance_opened`, `assistance_dismissed`, `assistance_level_used` to
  the Phase 2 telemetry tables — verify no scoring view or calculation reads
  them (INV-11). Requesting help never changes the score.

## 7. Hasil (results)

Score header, safety-gate banner (framed via preferred-language copy, never
forbidden words), per-domain breakdown, a review accordion with wrong
safety-critical items pinned/auto-expanded, delta vs. pre-test (only when
both sessions are FINALIZED; single-attempt learners are never defaulted to
a zero delta), certificate CTA when eligible (`OFFICIAL` evidence only;
issuance in Phase 4). Results are computed server-side at finalize and
stamped with `engine_version`/`scoring_policy_version` (INV-09, INV-29);
finalize is idempotent.

## 8. Onboarding

- Passwordless email/magic-link for most learners.
- Classroom-card PIN flow for young learners, sharing the same Person and
  downstream session/attempt model as email users (no separate "identity
  that certificates can't see").
- Onboarding links a learner to their existing Person and ACTIVE Enrollment;
  it never creates a second Person for someone already known (INV-23).

## 9. Calm surface

No lifecycle enum, evidence class, engine/policy version, release hash or
"PINTAR 4.0" appears on any learner screen. Every learner-facing string
passes through the Human Language Engine. Design tokens from Phase 1 only.

## Acceptance checklist — selftest contract (must be green before Phase 4)

- [ ] Scripted end-to-end test (via API, headless where UI is unavoidable):
      pre-test → reading map → lesson → post-test → results, for both an
      email-onboarded learner and a classroom-card learner, in a synthetic
      tenant; both sessions carry full provenance and `SYNTHETIC` class.
- [ ] INV-24: for the seeded learner, the post-test presented set has an
      empty intersection with the pre-test's item ids and `parallel_group`s,
      across the whole bank.
- [ ] INV-26: the code-search check fails a planted second scorer/sanitizer.
- [ ] INV-01: the learner-facing item payload contains no `is_correct`,
      rationale-to-correct mapping or `misconception_code` (allow-list
      contract test diffing authoring vs sanitized types).
- [ ] INV-31: the assistance-context payload equals the sanitized type;
      building it from the authoring representation is refused.
- [ ] INV-27: close the assessment assignment window while a session is
      active; the next response is accepted; new session creation is refused.
      Revoke the learner's scope (INV-17); the next scored action is refused.
- [ ] INV-28: replaying an outbox with a duplicate key yields one response
      row; killing the client mid-session and returning restores the
      server's presented items and accepted responses without loss.
- [ ] Refreshing/re-fetching mid-lesson resumes at the same or later
      position, never earlier.
- [ ] INV-10: a safety-critical item answered wrong fails mastery even when
      the overall score would otherwise pass.
- [ ] INV-11: two identical response sets, one with hints used, score
      identically; the hesitation trigger never fires before the configured
      window (fast-forwarded clock), and never fires offline.
- [ ] A planted forbidden word never appears in any generated
      assistance/feedback string, for at least one item of each built type.
- [ ] INV-08 / INV-09: a forged `person_id` or client-submitted score in a
      finalize request is ignored; the server-computed values are used;
      duplicate finalize is idempotent.
- [ ] Copy/route inventory: no internal enum, version string or "PINTAR 4.0"
      on any learner route.

Add these to the running `selftest` manifest alongside Phases 1–2's tests.
Then: mini audit (answer-key leakage incl. AI contexts, duplicate engine,
telemetry joins, learner routes without middleware); fix; gate.
