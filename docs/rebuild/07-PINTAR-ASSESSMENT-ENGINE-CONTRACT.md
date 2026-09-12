# 07 — PINTAR Assessment Engine Contract

The highest-risk domain in the product. Every operation below is
`INPUT → SERVER ACTION → DATABASE EFFECT → CLIENT OUTPUT`; the client
output is always the learner-facing sanitized shape, never the authoring
shape.

## Session creation

```
INPUT: learner identity (from session, not request body), assignment/blueprint id
SERVER: verify assignment is OPEN and learner-eligible (scope, no disallowed
        repeat exposure per blueprint's repetition_policy); draw items
        respecting difficulty mix, safety-critical minimum, bank_type
        isolation (INV-12), exposure/cooling for EXAM items, shuffle policy
DB: session row (CREATED), presented_item rows, exposure counters incremented
CLIENT OUTPUT: sanitized item stream — stem/stimulus/options text and type
        only; no is_correct, no rationale-to-correct mapping, no
        misconception_code
```

## Randomization rules

- Shuffle is **seeded and deterministic per session** — reproducible for
  audit/debugging, but the seed itself is never derivable by the client.
- Option position (A/B/C/D) shuffles independently of item order, with a
  uniform-distribution guarantee across a paper (no systematic bias to one
  slot — carries over the anti-bias doctrine from FABLE-05).
- EXAM-tier items respect a cooling period; the draw query excludes any
  item still within its configured cooling window for the requesting
  cohort.

## Pre-test / post-test separation

- Distinct Assignments, distinct Blueprints. The blueprint's
  `repetition_policy` field is the single source of truth for whether
  pre/post share items (default: no shared exposure within one learner's
  pair, unless a blueprint explicitly opts into shared items for a
  controlled growth measurement — a product decision, not an engineering
  default; see open decision in doc 11 if unconfirmed).
- A learner with only a pre-test or only a post-test attempt is tracked as
  a distinct segment (single-attempt), never silently defaulted into a
  delta calculation.

## Sibling/parallel-item exclusion

Where a blueprint defines parallel item sets (e.g. equivalent-difficulty
retakes), the assembler must never present two items from the same
parallel-set to the same learner within a policy-defined window — this is
a named blueprint field (`parallel_set_id` + exclusion window), not an ad
hoc check.

## Answer-key isolation & sanitized payloads

- The authoring representation (full item incl. correctness, rationale,
  misconception code) exists only in Studio-facing and server-internal
  code paths.
- The learner-facing representation is a distinct, explicitly sanitized
  type — never "the same object with some fields hidden by the UI." If a
  new field is added to the authoring Item type, the sanitizer must be
  updated in the same change, or the new field defaults to excluded until
  explicitly allow-listed (allow-list, not block-list, sanitization).

## Server-side grading

- Every response is graded server-side against the authoring
  representation at submission time (not deferred to a batch job) — the
  learner never receives immediate right/wrong feedback that could leak
  the key, except where the blueprint's stage explicitly allows immediate
  rationale (`PRACTICE` tier only, per doc 02's question-bank model).
- Diagnostic distractor processing: a wrong response is mapped through its
  chosen Option's `misconception_code` into Misconception Evidence at
  submission time — not deferred.

## Assistance behaviour

- Hesitation timer runs server-side (server tracks time-since-last-
  interaction per item), not purely client-side — a client-side-only timer
  is spoofable and also can't reliably survive tab switches/refreshes.
- Assistance content is looked up per stage/persona (Human Language Engine)
  and validated against the same hint-leak constraint as authored hints
  (INV-02) before being served — dynamically generated assistance text is
  not exempt from that check.

## Scoring, mastery, growth, safety gate

- Score and per-domain mastery are computed at finalize time from raw
  `response_submitted` events for that session only.
- Growth/delta requires both a FINALIZED pre-test and post-test session for
  the same learner and course; computed on read, not stored as a mutable
  running value.
- Safety gate: computed independently of overall score (INV-10); a session
  can score high and still fail via the gate.

## Result finalization

```
INPUT: learner's submit action (or system timeout)
SERVER: lock responses; compute score/mastery/safety-gate server-side;
        idempotency check (has this session already been finalized?)
DB: result fields written once; session → SUBMITTED → FINALIZED
CLIENT OUTPUT: Hasil view — score, safety-gate banner, per-domain
        breakdown, review accordion, delta if applicable, certificate CTA
        if eligible
```

## Retry / concurrency / idempotency

- Finalize is idempotent per session id — a duplicate finalize call
  (double-click, network retry) must observe the already-computed result,
  never recompute a second, potentially different one.
- Submission after timeout: the system marks the session EXPIRED and
  auto-finalizes with whatever responses were recorded up to the timeout,
  per the blueprint's stated timeout policy — never silently discarding a
  learner's recorded work.
- Network interruption mid-session: the client resumes against the
  server-authoritative session state (current item, remaining time) on
  reconnect — it never reconstructs state from client-local storage alone.

## Assessment evidence immutability

Once a session is FINALIZED, its responses, timings, and computed results
are immutable except for the append-only certificate-issuance-retry marker
described in the state-machine doc. A later content correction (a new PLP
release) never retroactively changes a past session's recorded result —
the session's `plp_release_id` binding is exactly what makes this safe
(the session is forever interpretable against the release it was actually
taken under).
