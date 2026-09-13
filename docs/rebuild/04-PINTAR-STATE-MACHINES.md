# 04 — PINTAR State Machines

*Baseline amendment (2026-09-12): APPROVED ≠ FROZEN stated explicitly;
Publish Readiness projection added (§1a); Enrollment, Membership and
Transfer lifecycles added (§3a–3c); Learning Assignment separated from
Assessment Assignment (§4); session lifecycle gains start-eligibility ≠
continue-permission semantics, TERMINATED, and resilience/replay rules
(§5); pre/post separation rewritten to zero overlap (§6); certificate
lifecycle records the identity snapshot (§7); Question Health lifecycle
added (§9).*

Every significant lifecycle, modeled explicitly. UI code must never encode
lifecycle rules implicitly — it reads/writes through these transitions only.
Every lifecycle is an enumerated status plus an enforced transition table
or trigger, never an open string column.

## 1. PLP content lifecycle

```
INGESTED → STRUCTURED → VALIDATED → IN_REVIEW → APPROVED → FROZEN → PUBLISHED → SUPERSEDED
                      ↘ VALIDATION_FAILED
```
| Transition | Actor/capability | Prerequisite | Server validation | DB consequence | Audit | Reversible? | Becomes immutable? |
|---|---|---|---|---|---|---|---|
| → INGESTED | `CAN_DRAFT` (Easy Upload or Structured Package Import) | Files/package received | Schema-shape or asset-role recognition; uploader confirms inferred roles where needed | Row created; AI provenance recorded if AI-produced | Yes | N/A | No |
| INGESTED → STRUCTURED | System | Payload maps to relational entities | Structural parse succeeds | Relational rows populated | Yes | No | No |
| STRUCTURED → VALIDATED / VALIDATION_FAILED | System (validator) | — | Technical validation + coaching validator + MCQ Quality checks run | Validation report and Quality Findings stored | Yes | VALIDATION_FAILED → STRUCTURED allowed (fix and re-run) | No |
| VALIDATED → IN_REVIEW | `CAN_DRAFT` submits | Technical validation passed | — | Status change | Yes | Yes, back to STRUCTURED for edits | No |
| IN_REVIEW → APPROVED | `CAN_REVIEW`, ≠ author | Reviewer distinct from author; zero unresolved ERROR-level findings; WARNING-level findings acknowledged | Server enforces reviewer≠author | Reviewer id + timestamp recorded | Yes | Edits still allowed pre-freeze (returns to STRUCTURED) | No |
| APPROVED → FROZEN | `CAN_FREEZE_RELEASE` | APPROVED | Compute content hash over taught-content columns only | Row(s) become immutable; release row created with hash + version | Yes | **No** | **Yes** |
| FROZEN → PUBLISHED | `CAN_PUBLISH` (human only) | Publish Readiness = READY | Readiness conditions re-checked server-side | Release available to the institution (not yet assigned to any learner) | Yes | Withdraw → SUPERSEDED, not back to FROZEN | Already immutable |
| PUBLISHED → SUPERSEDED | `CAN_PUBLISH` (withdraw) or new release published | — | — | Old release chain-linked, still queryable | Yes | No | Already immutable |

**APPROVED ≠ FROZEN.** APPROVED is academic/human governance (a reviewer
signed off). FROZEN is the immutable technical release identity (hash
computed, rows locked). Both are required; neither implies the other.

**Forbidden transitions:** any skip (e.g. INGESTED → APPROVED), any move out
of FROZEN/PUBLISHED/SUPERSEDED back to an earlier state, any edit to a
FROZEN row's taught-content columns, any publication by a non-human actor.

## 1a. Publish Readiness (derived projection, not a state)

Computed on read for any package at STRUCTURED or later:

| Surface state | Meaning | Computed from |
|---|---|---|
| `READY` | Can be published now | technical validation passed ∧ academic approval recorded ∧ FROZEN ∧ zero unresolved ERROR findings ∧ all WARNING findings acknowledged |
| `ACTION_REQUIRED` | A human can fix it in Studio; list says exactly what | WARNING findings unacknowledged, or missing metadata, or awaiting review/freeze |
| `BLOCKED` | Cannot proceed until specific items are corrected | VALIDATION_FAILED, or ERROR-level MCQ Quality Finding, or missing rationale/misconception link, or unresolved safety-language hit |

The projection separates *technical validation*, *academic validation* and
*publish readiness* internally, and always returns a plain-language list of
blockers. Acceptance: an administrator uploads a complete, valid externally
generated chapter/book package, sees READY (or exactly what is not), fixes
it, previews, publishes and assigns — with no developer, database or
AI-agent intervention.

## 2. Review/approval sub-lifecycle (per item, inside IN_REVIEW)

```
IN_REVIEW → (validator coaching findings and MCQ Quality Findings resolved) → APPROVED
```
Author and reviewer are always different identities for the same item —
enforced server-side. Multiple review rounds are allowed (APPROVED requires
zero unresolved ERROR-level findings, not zero rounds).

## 3. Class lifecycle

```
SCHEDULED → ACTIVE → ENDED
                   ↘ CANCELLED (from SCHEDULED only)
```
`ACTIVE` bounds when new assessment sessions may be created against the
class. Ending a class does not interrupt in-progress sessions — only the
INV-17 events do (see §5). A class belongs to exactly one Academic Period.

## 3a. Institution Enrollment lifecycle

```
PENDING → ACTIVE → ENDED { reason: COMPLETED | TRANSFERRED_OUT | WITHDRAWN | EXPIRED }
        ↘ CANCELLED (from PENDING only)
```
Append-only: ending an enrollment closes `valid_to`; it is never deleted.
A new period at the same institution is normally the *same* enrollment with
new Memberships (§3b); institution policy may instead issue per-period
enrollments — either way, nothing is overwritten.

## 3b. Class / Cohort Membership lifecycle

```
ACTIVE (valid_from) → CLOSED (valid_to) { reason: PERIOD_ROLLOVER | MOVED | ENROLLMENT_ENDED }
```
A period rollover (e.g. 400 learners moving to the next year) is a bulk
operation that *closes* current memberships and *creates* new ones under the
new Academic Period. It never updates a `class_id` in place. Every
membership change is audited (INV-18, INV-23).

## 3c. Transfer lifecycle

```
REQUESTED → AUTHORIZED → EXECUTED
          ↘ REJECTED      ↘ (no reversal; a mistaken transfer is corrected by a new, audited transfer)
          ↘ CANCELLED (before EXECUTED)
```
| Transition | Actor | Prerequisite | Consequence |
|---|---|---|---|
| → REQUESTED | `CAN_AUTHORIZE_TRANSFER` at sending *or* receiving institution, or the learner/guardian per policy | Source enrollment exists | Transfer row lists requested record classes |
| REQUESTED → AUTHORIZED | The counterpart institution admin (both sides must be recorded) and any consent the policy requires | Policy checks pass | Authorization recorded |
| AUTHORIZED → EXECUTED | System | — | Receiving enrollment created (ACTIVE); sending enrollment ENDED (TRANSFERRED_OUT); portable record classes made readable to the receiving institution; institution-scoped records untouched; audit written |

Only both-PINTAR transfers execute in-platform; an outbound transfer to a
non-PINTAR institution produces an authorized *export* of the portable
record (doc 06 retention/departure rules) and ends the enrollment.

## 4. Assignment lifecycles

**Learning Assignment** (PLP Release → Class/Cohort):
```
DRAFT → ACTIVE → ENDED
      ↘ WITHDRAWN (from DRAFT or ACTIVE; learners who completed keep history)
```
An ACTIVE Learning Assignment may have its `release` moved to a corrected
release **only** by an explicit `CAN_ASSIGN_LEARNING` action governed by
the release-correction policy (doc 08): completed learners are untouched,
in-progress learners stay pinned unless a governed intervention says
otherwise, not-started learners may move. Every move is audited.

**Assessment Assignment** (Assessment Definition → Class/Cohort/window):
```
DRAFT → SCHEDULED → OPEN → CLOSED
```
`OPEN` is when learners may **start** new sessions. `CLOSED` stops new
session creation and **does not** interrupt in-progress sessions — those
continue to their own authorized deadline (§5, INV-27). Quick Assessment
creates an Assessment Assignment that goes DRAFT → OPEN in one educator
action.

## 5. Assessment-session lifecycle

```
CREATED → IN_PROGRESS ⇄ PAUSED → SUBMITTED → FINALIZED
                     ↘ EXPIRED (authoritative deadline reached) → FINALIZED
                     ↘ TERMINATED (INV-17 event) → FINALIZED (with whatever was recorded, marked TERMINATED)
```
| Transition | Actor | Prerequisite (start eligibility) | Server validation | Consequence |
|---|---|---|---|---|
| → CREATED | Learner (via API) | Assignment OPEN; learner has an ACTIVE Membership in the assigned class/cohort; no disallowed repeat exposure | Definition-driven item draw; EXAM-tier isolation (INV-12); pre/post zero-overlap (INV-24) | Session row with full provenance (INV-33) and an **authoritative deadline** computed from the definition; PresentedItem rows |
| CREATED → IN_PROGRESS | Learner | Continue permission (below) | — | First response accepted |
| IN_PROGRESS → PAUSED | Learner ("Simpan & Jeda") | Continue permission | — | Server-authoritative elapsed time frozen (if definition allows pause) |
| PAUSED → IN_PROGRESS | Learner | Continue permission | — | Timer resumes server-side |
| IN_PROGRESS → SUBMITTED | Learner (explicit submit) | Continue permission; all required items answered or definition allows partial | Idempotent per session | Responses locked |
| any active → EXPIRED | System | Authoritative deadline reached (plus governed late-sync grace, doc 07) | — | Auto-submitted with whatever was recorded |
| any active → TERMINATED | System on an INV-17 event (authorization revocation, institutional/scope revocation, security intervention, explicit authorized administrative termination) | — | Reason and actor recorded, audited | Recorded work retained; session cannot continue |
| SUBMITTED/EXPIRED/TERMINATED → FINALIZED | System | — | Score + safety gate computed server-side (INV-09, INV-10) with engine/policy versions recorded (INV-29) | Result rows written, immutable |

**Continue permission** is evaluated on every scored action and depends
only on: the session is in an active state, the authoritative deadline has
not passed, and no INV-17 event applies. It does **not** depend on the
Assessment Assignment window still being OPEN, nor on the Class still being
ACTIVE. Example: window closes 10:00; a learner who started at 09:55
continues to the session's own deadline.

**Authorized extensions:** an educator/administrator with the capability
may extend a session's authoritative deadline; the extension, actor and
reason are audited. There is no silent extension.

**Resilience/replay:** a client may hold a durable local outbox of responses
not yet acknowledged; on return it replays them with their idempotency keys
(INV-28). The server accepts each exactly once, orders by presented item and
client sequence, and marks replayed responses as such. The client never
reconstructs *session state* (current item, deadline, status) locally — it
re-reads it from the server; only unacknowledged *responses* are replayed.

Concurrency/idempotency: a duplicate finalize call for the same session
must be idempotent — the second call observes the already-finalized result,
never recomputes a second one.

## 6. Pre-Test / Post-Test relationship (a constraint between two independent sessions)

- Pre-test session and post-test session are separate Assessment-session
  instances against separate Assessment Assignments, both generated by the
  Learning Assignment's learning-cycle configuration.
- For the standard Dr. Gladys cycle the post-test draw excludes **every
  item id presented in the learner's pre-test and every item sharing a
  `parallel_group` with any of them** (INV-24). The assessments measure
  equivalent objectives with independent items. This is not configurable on
  `LEARNING_CYCLE_*` definitions.
- A controlled-overlap anchor design (for future psychometric linking) is a
  distinct, explicit assessment mode that does not yet exist (doc 09,
  LATER) — it will never be implemented by relaxing INV-24.
- A learner's delta (post − pre) is only computed once both sessions are
  FINALIZED; a single-attempt learner (pre-only or post-only) is tracked
  separately and never silently defaulted into a delta of zero.
- Pre-test is diagnostic: it never yields pass/fail, and wrong responses are
  misconception evidence feeding the Personal Reading Map.

## 7. Certificate lifecycle

```
ELIGIBLE → ISSUED → (VERIFIED any number of times) → REVOKED
                                                     ↘ SUPERSEDED (reissue for correction)
```
| Transition | Actor | Prerequisite | Consequence | Reversible? |
|---|---|---|---|---|
| → ELIGIBLE | System | Session FINALIZED with `OFFICIAL` evidence class, POSTTEST/EXAM stage, passed incl. safety gate | — | N/A |
| ELIGIBLE → ISSUED | System (idempotent, keyed on session id) | Independent server-side score recomputation confirms pass | Certificate Identity Snapshot taken; canonical payload (INV-05) built and signed with current `key_version`; row created | **No** |
| ISSUED → VERIFIED | Anyone (the one public route) | — | Read-only; no state change | N/A |
| ISSUED → REVOKED | Institution Admin / System Admin | Documented reason | Public verification response changes to "revoked"; row retained | No (a corrected certificate is a new ISSUED row, chain-linked) |

Issuance failure must never fail the learner's results view — the result
renders regardless; a retry path re-attempts ELIGIBLE → ISSUED on next load.
`PUBLIC_DEMO`, `PREVIEW` and `SYNTHETIC` sessions can never reach ELIGIBLE.

## 8. Briefing lifecycle

```
COLLECTING → GENERATING → READY → REVIEWED → ARCHIVED
```
`COLLECTING` holds until the minimum-sample threshold is met over
`OFFICIAL` evidence (an honest "not enough data" state is shown, not a
fabricated one — doc 01, Lesson 6). `REVIEWED` marks that the target
educator/dean opened it; informational only.

## 9. Question Health and curriculum-improvement lifecycle

Per Item, longitudinal, over `OFFICIAL` evidence only:
```
INSUFFICIENT_EVIDENCE → OBSERVING → SIGNAL_RAISED → UNDER_REVIEW → { ACKNOWLEDGED_OK | ACTION_TAKEN }
                                                                          ↘ (new observation window)
```
| Transition | Actor | Prerequisite | Consequence |
|---|---|---|---|
| → OBSERVING | System | Minimum-evidence threshold met (defined per signal type, never a tiny sample) | Basic signals computed (correctness rate, distractor uptake, position effects) |
| OBSERVING → SIGNAL_RAISED | System | A defined pattern threshold crossed (e.g. nearly-always-correct, nearly-always-wrong, distractor never chosen) | Signal listed for educator/reviewer; **no autonomous conclusion recorded** |
| SIGNAL_RAISED → UNDER_REVIEW | `CAN_REVIEW_QUESTION_HEALTH` | — | Reviewer assigned |
| UNDER_REVIEW → ACKNOWLEDGED_OK | Reviewer | Human judgement (e.g. legitimately hard) | Signal suppressed for a governed window, decision audited |
| UNDER_REVIEW → ACTION_TAKEN | Reviewer | Human decision to revise | Feeds a Curriculum-Improvement Recommendation → new content edit → new release; never an automatic content edit |

LATER extensions (drift detection, discrimination, empirical Rasch/IRT
calibration, cohort comparisons) add signal types to this lifecycle; they
do not add a second lifecycle.
