# ADR-0022 — Anonymous student → educator feedback: one identity-bearing row, a governed threshold, and a residual that is named rather than hidden

**Status:** Accepted · **Date:** 2026-09-22 · **Phase:** WP7B, migration
20260930100000 · **Scope:** schema, endpoints and the privacy claim they carry.
No change to evidence, assessment, metrics, certificates or Management's
existing authority.

## The claim this architecture exists to support

> No ordinary authorized PINTAR application or database path can produce a
> respondent → answer pair.

Not "the surface does not show it". Not "a policy hides it". The two halves of
a submission are written in one transaction and afterwards have no column in
common but the cycle they belong to.

## Decision 1 — eligibility and consumption are ONE row, not two tables

The WP7A investigation proposed separate `feedback_eligibility` and
`feedback_participations` tables. That shape was rejected **on privacy grounds,
not on tidiness**.

A separate participation table means a row **inserted at the moment a learner
submits**. An inserted row carries its own arrival whether or not anybody meant
to keep one: a position at the end of the heap, an `xmin` of its own, and the
standing temptation of the `created_at` that seventy-one other columns in this
schema have. Rows that arrive one at a time are a submission order.

`feedback_opportunities (cycle_id, person_id, consumed)` is written for every
eligible learner **in the single transaction that opens the cycle** and consumed
by flipping a boolean. Nothing arrives on the identity side at submission time.
The combined object keeps every property the pair had:

| property | how |
|---|---|
| immutable eligibility-at-open | rows may be inserted only by the opening transaction (the guard requires a transaction-local setting naming the cycle) and never deleted |
| exactly once | `update … where not consumed` takes the row lock; a retry, a double-click or a concurrent connection finds zero rows and is refused by name (F07-P04, F07-C01) |
| atomic | the flip and the answers commit together, so a lost acknowledgement leaves either both or neither |
| the learner's own state | one row, readable by its own person and by nobody else |
| no fine-grained timestamp | there is no timestamp column to have |

## Decision 2 — the threshold is data, bound per cycle

Five is PINTAR 4.0's canonical anonymity threshold (ruled). It lives in
`feedback_thresholds` as a published, versioned row with a statement key, and
each cycle **binds the version live when it opened**. No authorization path and
no result path contains the number; the migration's terminal block reads
`close_feedback_cycle` back and fails if it contains a numeric literal at all.

A republication therefore cannot change what an already-collected cycle was
promised — proven by publishing a threshold of one while a cycle bound to five
is open, and watching it still withhold (F07-P12, F07-P09).

## Decision 3 — below the threshold, nothing numeric exists to leak

`metric_evaluate` returns `have` and `needed` below its minimum, and the absence
card renders "(3/5)" on purpose: a statistical readiness floor is a fact a
reader may act on. **An anonymity floor is not that.** A closed cycle below the
threshold becomes `WITHHELD`, no result row is ever written, and every reader
receives exactly three keys — the cycle, the state, and the canonical statement
`umpanbalik.hasil.belum_cukup_tanggapan`.

The disclosure that a cycle is `WITHHELD` is a ruled one: Management is entitled
to know a round produced no publishable result. It is a bound, not a number.

## Decision 4 — Management opens and closes; the subject never does

Authority is `management_scope_over_node()` — the WP1/WP2 role set
{HEAD_OF_DEPARTMENT, DEAN} over the class. Deliberately **not**
`CAN_ASSIGN_LEARNING`, which an EDUCATOR holds: that gate would have let the
subject of a cycle open the cycle about themselves. F07-P01 measures that the
subject does hold that capability, so the reason the gate was not reused is a
fact in the suite rather than a remark in a comment.

The subject is refused as opener by a CHECK constraint as well as by the
endpoint: "the educator ran their own feedback round" is unrepresentable.

## Decision 5 — the teaching relationship is the one the repository has

PINTAR has no teaching-assignment table. What exists is a live EDUCATOR role
assignment whose scope contains the class, and that — only that — is what a
cycle asserts about its subject. The provenance a cycle records is exactly:
*this educator held teaching authority over this class when the cycle opened.*
Nothing more is claimed, and no subject/course relationship is invented.

The ACADEMIC boundary uses `courses.learning_context` (WP6A), the repository's
only context fact: a cycle refuses a class that any learning assignment reaches
with non-ACADEMIC material. An org node carries no context of its own — WP6's
own fixture hangs a professional-development CLASS off a PD department — so
`kind = 'CLASS'` alone would not have excluded PD.

## Accepted residuals, recorded rather than hidden

1. **Unanimity.** If every one of *k* respondents chooses the same option, each
   respondent's answer is implied by the published marginal. PINTAR 4.0 does not
   suppress unanimous cells (ruled). A reader who knows the respondent set can
   therefore learn an individual answer in that one case.
2. **Privileged infrastructure.** A holder of the service role, of superuser, of
   a backup or of the WAL can join the consumed opportunity to the responses
   written in the same transaction through `xmin`, and physical row adjacency
   within that transaction reconstructs a respondent's whole sheet. Transaction
   atomicity is **not** weakened to prevent this: the alternative loses
   exactly-once and all-or-nothing, which are worth more. The claim is about
   ordinary authorized paths, and this residual is why it is worded that way.
3. **Hosted logging.** Statement logging, `pg_stat_statements` and PITR are
   deployment settings outside this repository. A hosted `log_statement='all'`
   would log the submission call with its session context.
4. **A class smaller than the threshold** can open a cycle that can never
   publish. Refusing it would be a new product rule and would leak the roster
   size against the threshold; it is left as a Management judgement.

## Consequences

- Feedback is **not evidence**: `assert_feedback_is_not_evidence()` names the
  evidence consumers — every calculator, the evaluator, reports, certificates,
  Question Health, integrity and the learner projections — and fails if any of
  them reads a feedback relation, if the response table grows a re-identifying
  column or a clock, if a client role gains a grant on the raw answers, or if
  the submission path learns to write an audit row.
- Submission is the one mutating endpoint in PINTAR that writes **no** audit
  row. The cycle's opening and closing are audited instead, with no count on
  either path; accountability lives where the decisions are.
- Results are computed once, at close, into an immutable snapshot. There is no
  recompute path, and both terminal states are terminal.
