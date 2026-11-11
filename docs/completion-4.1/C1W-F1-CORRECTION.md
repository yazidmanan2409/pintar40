# C1w · finding F-1 · mandatory correction before promotion

> **Coordination record.** Owner's decision of 11 November 2026, accepting Sharon's classification. Kept by the Chief
> Architect. THE PLAN (`THE-PLAN.md`, owner approved) is **not amended**: its §7.7 already says that F-1 is placed by
> Sharon's classification and that, if a blocker, it is corrected in C1w's one correction pass before promotion.

## 1 · Status

| | |
|---|---|
| **Finding** | F-1 (THE PLAN §7.7): after a governed key correction, some derived views still mark answers by the original key, and so contradict the result in force |
| **Class** | **Mandatory pre-promotion blocker** (Sharon's classification, accepted by the owner) |
| **C1w** | Technically **CLOSED** on `3a190dbf`. **NOT promotion-ready** until F-1 is corrected, independently reviewed and verified |
| **Where it belongs** | A narrowly scoped **C1w correction pass**. Not C2w |
| **State** | Scheduled (§3). **Not started.** |

## 2 · What does not change

1. B1 continues uninterrupted.
2. B2 and A2 are unaffected.
3. The approved batch sequence B1 → B2 → A2 → C2w → A3 → C3w → Z is unchanged.
4. THE PLAN requires no amendment.
5. No merge, pull request, staging promotion, production deployment or production database change is authorized.

## 3 · Schedule

- **Not while Second Eye is executing B1.**
- **When:** at the first batch boundary, after B1 closes and before B2 opens. The pass is small, C1w's code is then
  still the most recent work on those views, and it keeps the work branch from carrying a known evidence defect
  through further batches. If B1's close makes that boundary unsuitable, the next boundary (after B2) is acceptable.
- **Latest:** before C2w's completion page is written (C2w places annotations beside these same views), and before any
  request to promote C1w. A request to promote without it is escalated to the owner.
- It is a correction pass on a closed batch, not a batch: it opens no new scope and takes one review.

## 4 · Scope of the pass

**Rule (THE PLAN §7.7).** Every view that marks an answer right or wrong, or derives a misconception or a remediation
from that marking, reads the key in force for the sitting through the one accessor (`hasil_terkini_id` and the
recorded basis), never the sealed key directly. The original marking stays visible in history.

**The three identified views, and what is known of each:**

| View or path | Evidence |
|---|---|
| `service_cohort_misconceptions`, which supplies the catalogue figure `class.misconceptions` | **Verified directly by Sharon** |
| The teacher's per-question evidence | Reported by Second Eye. **Not yet independently confirmed.** Second Eye verifies it in the pass, red first |
| The reading-map remediation paths | Reported by Second Eye. **Not yet independently confirmed.** Second Eye verifies it in the pass, red first |

If either unconfirmed path turns out not to be defective, that is recorded with the test that shows it, and the
guarding test is kept.

## 5 · Acceptance requirements (Sharon's six; all required)

1. All three identified views use the result-in-force accessor, and each has its own red-first regression test.
2. Historical results and sealed content remain immutable.
3. Uncorrected sittings keep identical behaviour and figures.
4. The existing `class.misconceptions` catalogue definition is unchanged, unless Sharon determines otherwise.
5. THE PLAN §8.5 journey 3 passes across the corrected views.
6. The pre-flight's completeness search (THE PLAN §4.1, P1) identifies and resolves every additional affected
   correctness, misconception or remediation path.

The mandatory pre-flight of THE PLAN §4.1 (P1 to P6) applies to the pass in full, including plants and the inline red
cases, before any push.

## 6 · Review

- **Sharon:** once, against the pass's exact commit. PASS or BLOCKED.
- **Daisy:** only if the correction changes learner-facing or teacher-facing presentation, wording or interaction.
  A view that shows the same screen with corrected figures needs no UX review. The Chief Architect decides this from
  the pass's diff and asks her if so.

## 7 · Escalation to the owner

Only for: a material architectural conflict; a proposed change to a catalogue definition; a failed acceptance gate; a
request to promote without the correction. No owner decision is needed at this stage.

## 8 · Log

| Date | Entry |
|---|---|
| 11 Nov 2026 | F-1 classified a mandatory pre-promotion blocker (Sharon; accepted by the owner). Recorded. Pass scheduled for the boundary after B1. B1 not interrupted |
