# 07 — PINTAR Assessment Engine Contract

*Baseline amendment (2026-09-12): one authoritative engine with modes
(learning cycle, practice, test, exam, Quick Assessment, public demo, paper
foundation); zero pre/post overlap incl. parallel-group siblings; start
eligibility ≠ continue permission; resilience and exactly-once submission
with a durable client outbox; historical scoring reproducibility (engine
and scoring-policy versions); hesitation window configurable within
governed bounds; learner-assistance AI context boundary; MCQ Quality checks
referenced; extensible item types without a second engine.*

The highest-risk domain in the product. Every operation below is
`INPUT → SERVER ACTION → DATABASE EFFECT → CLIENT OUTPUT`; the client
output is always the learner-facing sanitized shape, never the authoring
shape.

## One authoritative engine (INV-26)

There is exactly one assessment domain: assembly, sanitization, timing,
response recording, grading, safety gate, mastery, evidence recording and
finalization. Everything that looks like "an assessment" to a user is a
**mode** of that engine with its own policy and presentation:

| Mode | Policy highlights | Presentation |
|---|---|---|
| `LEARNING_CYCLE_PRETEST` | Diagnostic, no pass/fail, misconception mapping, feeds Peta Bacaan | Calm diagnostic framing ("Pemetaan Awal") |
| `LEARNING_CYCLE_POSTTEST` | Mastery + safety gate; zero overlap with the learner's pre-test (INV-24); certificate-eligible | "Uji Penguasaan" |
| `PRACTICE` | Hints, immediate rationale, retries | Formative |
| `TEST` | Randomised, attempts limited | More formal |
| `EXAM` | No hints, identity confirmation, institution passing threshold, cooling | Formal |
| `QUICK_ASSESSMENT` | Educator-launched for an eligible class from an eligible bank; count/time chosen within governed limits; no admin/dev involvement | ~1 minute to launch |
| `PUBLIC_DEMO` | Mini-PINTAR; `PUBLIC_DEMO` evidence class; never eligible for anything official | Public trial |
| `PAPER` (foundation only) | Evidence enters through `PAPER_MANUAL_ENTRY`/`PAPER_IMPORTED` channels; no workflow in this baseline | — |

No mode has its own assembler, sanitizer, scorer or gate. New item types
(true/false battery, matching, image-anchored, and future source-reflective
types) are added to the item model and to the engine's type registry — a
new item type never means a new engine.

## Session creation (start eligibility)

```
INPUT: learner identity (from session, not request body), assessment assignment id
SERVER: verify assignment is OPEN, learner holds an ACTIVE membership in the
        assigned class/cohort, no disallowed repeat exposure; draw items
        respecting difficulty mix, safety-critical minimum, bank_type
        isolation (INV-12), exposure/cooling for EXAM items, shuffle policy,
        and — for LEARNING_CYCLE_POSTTEST — exclusion of every item id and
        every parallel_group sibling presented in this learner's pre-test
        (INV-24); compute the authoritative deadline from the definition
DB: session row (CREATED) with full evidence provenance (INV-33): person,
        enrollment, period, class, learning assignment, release, definition
        version, engine_version, scoring_policy_version, channel, class;
        presented_item rows; exposure counters incremented
CLIENT OUTPUT: sanitized item stream — stem/stimulus/options text and type
        only; no is_correct, no rationale-to-correct mapping, no
        misconception_code; plus the authoritative deadline and session id
```

## Continue permission (distinct from start eligibility — INV-27)

Every scored action re-checks, server-side, only: session is in an active
state; now < authoritative deadline (+ governed late-sync grace for
replayed responses); no INV-17 event (authorization/scope revocation,
security intervention, explicit authorized administrative termination). The
assignment window closing, or the class ending, is **not** a reason to
refuse continuation.

Authorized extensions change the session's own deadline through an audited
action; nothing else moves the deadline.

## Randomization rules

- Shuffle is **seeded and deterministic per session** — reproducible for
  audit/debugging, but the seed itself is never derivable by the client.
- Option position shuffles independently of item order, with a
  uniform-distribution guarantee across a paper (no systematic bias to one
  slot).
- EXAM-tier items respect a cooling period; the draw query excludes any
  item still within its configured cooling window for the requesting
  cohort.

## Pre-test / post-test separation

- Distinct Assessment Assignments, distinct Assessment Definitions, both
  generated from the Learning Assignment's learning-cycle configuration.
- Standard Dr. Gladys cycle: **zero identical items and zero
  `parallel_group` siblings** between a learner's pre-test and post-test
  (INV-24). The definitions measure equivalent objectives with independent
  items. This is not a configurable repetition policy on learning-cycle
  definitions.
- Any future controlled-overlap/anchor design is a distinct explicit mode
  (doc 09, LATER) with its own definition type; it never relaxes INV-24.
- A learner with only a pre-test or only a post-test attempt is tracked as
  a distinct segment (single-attempt), never silently defaulted into a
  delta calculation.
- Pre-test is diagnostic: wrong responses are misconception evidence, not
  lost marks; no pass/fail is produced.

## Sibling/parallel-item exclusion (general)

Where items belong to a `parallel_group`, the assembler never presents two
members of the same group to the same learner within the policy-defined
window — a named definition field, not an ad hoc check. Pre/post exclusion
(above) is the strict case of this rule.

## Answer-key isolation & sanitized payloads

- The authoring representation (full item incl. correctness, rationale,
  misconception code, quality findings) exists only in Studio-facing and
  server-internal code paths (Authoring Intelligence Context).
- The learner-facing representation is a distinct, explicitly sanitized
  type — never "the same object with some fields hidden by the UI." New
  authoring fields default to excluded until explicitly allow-listed.
- The **same sanitized type** is the only input any Learner Assistance
  Intelligence Context may receive (INV-31). Security through data
  boundaries, not AI obedience.

## Server-side grading

- Every response is graded server-side against the authoring
  representation at submission time (not deferred to a batch job) — the
  learner never receives immediate right/wrong feedback that could leak
  the key, except where the mode explicitly allows immediate rationale
  (`PRACTICE`).
- Diagnostic distractor processing: a wrong response is mapped through its
  chosen Option's `misconception_code` into Misconception Evidence at
  submission time — not deferred.
- Grading records `engine_version` and `scoring_policy_version` on the
  session and on every Result (INV-29).

## Assistance behaviour (Hesitation Window)

- The hesitation window is a **configurable parameter of the Assessment
  Definition within platform-governed bounds** (a minimum and maximum set
  by PINTAR), never a hard-coded constant. The Platform specification's
  "25 seconds" is one configured value, not architecture.
- Hints arrive progressively (principle → first step → full explanation),
  never reveal the answer (INV-02), never reduce the academic score because
  help was requested (INV-11), generate telemetry only, and remain
  physically separate from scoring.
- The hesitation timer runs server-side (time-since-last-interaction per
  item) — a client-only timer is spoofable and doesn't survive refreshes.
  While a client is offline no hesitation event is raised and no assistance
  is served (assistance requires the server).
- Assistance content is looked up per stage/persona and validated against
  INV-02 before being served — dynamically generated assistance text is not
  exempt.

## Resilience — no lost legitimate completed work (INV-28)

Architecture supports: durable answer state, local recovery where
appropriate, server synchronization, idempotent submission, reconnect
handling, browser/process interruption recovery, authoritative session
timing, auditable authorized extensions.

- **Server-authoritative state:** current item, status, deadline and
  accepted responses live on the server. The client re-reads session state
  on every (re)connection; it never reconstructs session *state* locally.
- **Durable client outbox:** each response the learner commits is written
  to durable local storage with an idempotency key
  `(session_id, presented_item_id, client_seq)` and a client-asserted
  timestamp, then sent. Unacknowledged responses survive tab close,
  browser crash and device restart, and are replayed on return.
- **Offline answering** is permitted only where the Assessment Definition
  allows it (`offline_tolerant`); when allowed, the client may continue
  presenting already-issued items and queuing responses. It never draws
  new items and never serves assistance offline.
- **Exactly-once acceptance:** the server enforces a unique constraint on
  the idempotency key; a duplicate replay is acknowledged, never
  re-recorded. Replayed responses are stored with `receipt_mode = REPLAYED`
  and both server-received and client-asserted times.
- **Late sync:** replayed responses arriving after the authoritative
  deadline but within a governed grace window are accepted as
  `LATE_SYNC` and scored; beyond the grace window they are retained as
  evidence but excluded from scoring, and the exclusion is visible to the
  educator. The grace window is a governed definition parameter, not a
  hidden constant.
- **Finalization exactly once:** finalize is idempotent per session id; a
  duplicate finalize call (double-click, network retry) observes the
  already-computed result, never a second one. Timeout finalization uses
  whatever was recorded, never discarding recorded work.

**Design acceptance scenario:** a learner answers 17 questions; the network
disappears; the learner answers another 8 (definition permits offline
continuation); the browser/process terminates; the learner returns. PINTAR
re-reads server state, replays the 8 queued responses exactly once, shows
25 recorded answers with no duplication and no silent loss, and finalizes
exactly once.

## Scoring, mastery, growth, safety gate

- Score and per-domain mastery are computed at finalize time from raw
  `response_submitted` events for that session only (LIVE, REPLAYED and
  in-grace LATE_SYNC receipts).
- Growth/delta requires both a FINALIZED pre-test and post-test session for
  the same learner and course; computed on read, not stored as a mutable
  running value.
- Safety gate: computed independently of overall score (INV-10); a session
  can score high and still fail mastery via the gate. Mastery requires the
  overall passing rule **and** 100% on safety-critical items where such
  content applies.

## Historical scoring reproducibility (INV-29)

```
Content Release (id + hash)
Assessment Definition (id + version)
Engine version
Scoring policy/configuration version
        → Result
```
Recording only an engine version is insufficient. Anything whose change
could materially alter interpretation of historical evidence — passing
rules, safety-critical sets, partial-credit rules, domain weightings,
timeout/late-sync policy — is part of the versioned scoring policy.
Implementation details that cannot change interpretation are not
versioned. A scoring bug discovered later is corrected by a **new**
scoring policy version and, where results must be corrected, by a
documented, audited recomputation that writes *new* Result rows linked to
the originals — never by editing historical results.

## Result finalization

```
INPUT: learner's submit action, system timeout, or an INV-17 termination
SERVER: lock responses; compute score/mastery/safety-gate server-side;
        stamp engine_version + scoring_policy_version; idempotency check
DB: result fields written once; session → SUBMITTED/EXPIRED/TERMINATED → FINALIZED
CLIENT OUTPUT: Hasil view — score, safety-gate banner, per-domain
        breakdown, review accordion, delta if applicable, certificate CTA
        if eligible (OFFICIAL evidence only)
```

## Quick Assessment (surface, not engine)

```
Teacher → Class → Quick Test → Subject/Topic → Question Count / Time → Launch
```
Creates an Assessment Assignment in `QUICK_ASSESSMENT` mode from an
eligible bank the educator's scope already covers, with parameters bounded
by governed limits, and opens it immediately. Every downstream step
(assembly, sanitization, timing, grading, evidence, Question Health
contribution) is the same engine and the same contract.

## Integrity evidence (proportionate)

The engine records category-7 events (item displayed, option
selection/change, navigation, timestamps, hint events, visibility changes,
reconnect events, submission events). They never enter scoring. Patterns
raise review signals for a human with `CAN_REVIEW_INTEGRITY`; no automatic
verdicts. No webcam/microphone/screen capture or raw keylogging exists in
the baseline.

## MCQ Quality / Testwiseness (pre-publication, feeds Publish Readiness)

Before any item reaches a learner, automated checks inspect items and banks
for exploitable patterns (length imbalance of the correct option,
grammatical cues, systematically more precise correct answers, implausible
distractors, stem wording exposing the answer, answer-position patterns,
all/none over-use, weak misconception linkage, bank-wide regularities).
Options are never forced to equal length. Every wrong option keeps its
authored rationale/misconception link (INV-03). Adversarial regression
fixtures (doc 16 §4) must be flagged appropriately by these checks.

## Assessment evidence immutability

Once a session is FINALIZED, its responses, timings, and computed results
are immutable except for append-only markers (certificate-issuance retry,
evidence-class override records). A later content correction (a new PLP
release) never retroactively changes a past session's recorded result — the
session's `plp_release_id` + definition version + engine/policy version
bindings are exactly what make this safe.
