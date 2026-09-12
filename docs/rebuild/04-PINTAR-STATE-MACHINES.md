# 04 — PINTAR State Machines

Every significant lifecycle, modeled explicitly. UI code must never encode
lifecycle rules implicitly — it reads/writes through these transitions only.

## 1. PLP content lifecycle

```
INGESTED → STRUCTURED → VALIDATED → IN_REVIEW → APPROVED → FROZEN → PUBLISHED → SUPERSEDED
                      ↘ VALIDATION_FAILED
```
| Transition | Actor/capability | Prerequisite | Server validation | DB consequence | Audit | Reversible? | Becomes immutable? |
|---|---|---|---|---|---|---|---|
| → INGESTED | `CAN_DRAFT` (or system ingest) | Structured payload received | Schema-shape check | Row created | Yes | N/A | No |
| INGESTED → STRUCTURED | System | Payload maps to relational entities | Structural parse succeeds | Relational rows populated | Yes | No | No |
| STRUCTURED → VALIDATED / VALIDATION_FAILED | System (validator) | — | Coaching validator runs | Validation report stored | Yes | VALIDATION_FAILED → STRUCTURED allowed (fix and re-run) | No |
| VALIDATED → IN_REVIEW | `CAN_DRAFT` submits | Validation passed | — | Status change | Yes | Yes, back to STRUCTURED for edits | No |
| IN_REVIEW → APPROVED | `CAN_REVIEW`, ≠ author | Reviewer distinct from author | Server enforces reviewer≠author | Reviewer id + timestamp recorded | Yes | IN_REVIEW ← APPROVED not needed; edits still allowed pre-freeze | No |
| APPROVED → FROZEN | `CAN_FREEZE_RELEASE` | — | Compute content hash over taught-content columns only | Row(s) become immutable; release row created | Yes | **No** | **Yes** |
| FROZEN → PUBLISHED | `CAN_PUBLISH` | — | — | Learner-visible flag set | Yes | Withdraw → SUPERSEDED, not back to FROZEN | Already immutable |
| PUBLISHED → SUPERSEDED | `CAN_PUBLISH` (withdraw) or new release published | — | — | Old release chain-linked, still queryable | Yes | No | Already immutable |

**Forbidden transitions:** any skip (e.g. INGESTED → APPROVED), any move out
of FROZEN/PUBLISHED/SUPERSEDED back to an earlier state, any edit to a
FROZEN row's taught-content columns.

## 2. Review/approval sub-lifecycle (per item, inside IN_REVIEW)

```
IN_REVIEW → (validator coaching findings resolved) → APPROVED
```
Author and reviewer are always different identities for the same item —
enforced server-side. Multiple review rounds are allowed (APPROVED requires
zero unresolved ERROR-level findings, not zero rounds).

## 3. Class lifecycle

```
SCHEDULED → ACTIVE → ENDED
                   ↘ CANCELLED (from SCHEDULED only)
```
`ACTIVE` window bounds when scoped role grants for that class are valid and
when new assessment sessions may be created against it. Ending a class does
not retroactively invalidate in-progress sessions unless the class's scope
grant itself expires (see INV-17) — the two are independent controls.

## 4. Assessment-window / Assignment lifecycle

```
DRAFT → SCHEDULED → OPEN → CLOSED
```
`OPEN` is when learners may start new sessions. `CLOSED` stops new session
creation but does not retroactively fail in-progress sessions — those run
to their own session lifecycle's natural end or timeout.

## 5. Assessment-session lifecycle

```
CREATED → IN_PROGRESS → PAUSED → IN_PROGRESS → SUBMITTED → FINALIZED
                                             ↘ EXPIRED (timeout)
```
| Transition | Actor | Prerequisite | Server validation | Consequence |
|---|---|---|---|---|
| → CREATED | Learner (via API) | Assignment is OPEN, learner eligible, no disallowed repeat exposure | Blueprint-driven item draw, EXAM-tier isolation enforced (INV-12) | Session row + PresentedItem rows created |
| CREATED → IN_PROGRESS | Learner | — | — | First response accepted |
| IN_PROGRESS → PAUSED | Learner ("Simpan & Jeda") | — | — | Server-authoritative elapsed time frozen |
| PAUSED → IN_PROGRESS | Learner | Session not expired | — | Timer resumes server-side |
| IN_PROGRESS → SUBMITTED | Learner (explicit submit) or system (timeout → EXPIRED then auto-submit if policy allows) | All required items answered or blueprint allows partial | — | Responses locked |
| SUBMITTED → FINALIZED | System | — | Score + safety gate computed server-side (INV-09, INV-10) | Result rows written, immutable |
| any → EXPIRED | System | Elapsed time exceeds blueprint limit | — | Session auto-submitted with whatever was recorded |

Concurrency/idempotency: a duplicate finalize call for the same session
must be idempotent — the second call observes the already-finalized result,
never recomputes a second one (this is what makes certificate issuance
idempotent downstream, INV-07's sibling rule).

## 6. Pre-test / Post-test relationship (not a shared state machine, a constraint between two independent sessions)

- Pre-test session and post-test session are separate Assessment-session
  instances against separate Assignments.
- Item overlap between the two is governed by the Blueprint's repetition
  policy (e.g. `NO_PREVIOUS_EXPOSURE_IN_SESSION` or an explicit allowed-
  overlap-for-growth-measurement policy) — this must be a named, versioned
  Blueprint field, not implicit behavior.
- A learner's delta (post − pre) is only computed once both sessions are
  FINALIZED; a single-attempt learner (pre-only or post-only) is tracked
  separately and never silently defaulted into a delta of zero.

## 7. Certificate lifecycle

```
ELIGIBLE → ISSUED → (VERIFIED any number of times) → REVOKED
                                                     ↘ SUPERSEDED (reissue for correction)
```
| Transition | Actor | Prerequisite | Consequence | Reversible? |
|---|---|---|---|---|
| → ELIGIBLE | System | Session FINALIZED, POSTTEST/EXAM stage, passed incl. safety gate | — | N/A |
| ELIGIBLE → ISSUED | System (idempotent, keyed on session id) | Independent server-side score recomputation confirms pass | Certificate row created, HMAC signed with current key_version | **No** |
| ISSUED → VERIFIED | Anyone (public route) | — | Read-only; no state change | N/A (not a mutation) |
| ISSUED → REVOKED | Institution Admin / System Admin | Documented reason | Public verification response changes to "revoked"; row retained | No (revocation is final; a corrected certificate is a new ISSUED row, chain-linked) |

Issuance failure must never fail the learner's results view — the result
renders regardless; a retry path re-attempts ELIGIBLE → ISSUED on next load.

## 8. Briefing lifecycle

```
COLLECTING → GENERATING → READY → REVIEWED → ARCHIVED
```
`COLLECTING` holds until the cohort/institution's minimum-sample threshold
is met (an honest "not enough data" state is shown, not a fabricated one —
see rebuild rule in doc 01, Lesson 6). `REVIEWED` marks that the target
educator/dean opened it; this is informational only, never gates anything.

## 9. Curriculum-improvement recommendation lifecycle

```
DETECTED → SUGGESTED → (Studio reviewer: ACCEPTED → feeds a new content edit, or DISMISSED)
```
Always requires a human decision at the SUGGESTED step — a recommendation
never auto-applies a content change, per the domain model's governance
principle.
