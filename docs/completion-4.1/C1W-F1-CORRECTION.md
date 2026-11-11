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
- **Release (owner's instruction of 11 Nov, evening: "after B1 formally closes, schedule the C1w F-1 correction pass
  before B2").** This pass is **released to Second Eye at the moment B1 formally closes**, that is, when Sharon and
  Daisy have each given PASS on B1's exact candidate. No further word from the Chief Architect or the owner is needed
  to start it. **B2 opens after this pass has Sharon's PASS.** The engineer's brief is §9.
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

## 8 · Preliminary impact list (Chief Architect, read-only, at `3a190dbf`)

This is a starting point for the pre-flight's P1 search, **not a substitute for it**. It was made by reading the
latest definition of every function and view that reads `item_options.is_correct` or calls `grade_response`. Nothing
was run.

**How a correction is stored today.** `tegaskan_koreksi_kunci` does not change the sealed question's options: it sets
`is_correct` on the new revision only (`M/20270115110000…:942`). For an affected sitting the key in force is in the
corrected result's recorded basis (`assessment_result_bases.basis -> 'soal' -> item -> 'kunci'`), and C1w already has
one reader of it, `nilai_jawaban_berlaku(session, item, value)` (`:1132`), which falls back to `grade_response` when
the sitting has no governed correction. C1w re-pointed the **score** in `session_review` and `reading_map` to it
(`:1124-1128`). Anything that still reads the sealed option's `is_correct` for a sitting's answer is a candidate.

| # | Object (latest definition) | What still reads the sealed key | Shown to | Standing |
|---|---|---|---|---|
| 1 | `service_cohort_misconceptions` (view, `M/20261202100000…:126-140`), read through `scoped_service_cohort_misconceptions`; supplies `class.misconceptions` | counts an answer as a misconception by `NOT o.is_correct` (`:137`) | teacher, report | **Verified by Sharon** |
| 2 | `teacher_question_evidence` (`M/20261124100000…`) | each answer's mark by `grade_response` (line 40 of the function); each option's `is_key` from `o.is_correct` (line 62) | teacher | Reported by Second Eye; to confirm |
| 3 | `reading_map` (`M/20261202100000…:66`) | the score is already corrected by C1w, but the remediation join still takes the chosen option by `not o2.is_correct` (`:116`) | learner | Reported by Second Eye; to confirm |
| 4 | `session_misconceptions` (`M/20261202100000…:49-63`) | `not o.is_correct` (`:60`) | learner's and teacher's sitting views | **Additional candidate.** Not among the three named; found by this reading |
| 5 | Item statistics and option views of `M/20260928100000…:109-147` (`correct_count`, the per-option rows, the misconception counts), and `calc_item_distractor_uptake` (`M/20260923110000…`) | per-question aggregates over the sealed question's own options | teacher (Question Health), reports | **Additional candidate, to be classified.** See the note below |
| 6 | `learning_delta` (`M/20260913091500…`) | reads `is_correct` | reports | To check in P1 whether it marks answers or only carries the option |

**Not candidates (checked):** `evaluate_session`, `grade_response`, `submit_session` (the original scoring, which
must stay as it was: requirement 2); `excluded_items_for_post_test` (already reads the key in force); the content,
package, draft and copy functions (they carry options; they mark no answer).

**Note on row 5.** These are statistics of a question, not views of a sitting, and correcting the item statistics in
general is recorded as 4.5 work (roadmap reconciliation §2). Requirement 6 still requires that the pass **decide and
record** them. The Chief Architect's reading: the pass corrects them only where a figure shown to an educator would
count an answer wrong that the result in force counts right; it does not undertake the four 4.5 defects. If closing
row 5 would change the definition of any catalogue figure, that is a proposed catalogue-definition change and is
escalated (§7), not done.

## 9 · Brief for the engineer

**Scope.** Rows 1 to 4 are corrected. Rows 5 and 6 are decided by P1 and recorded, each with its reason. Anything
else P1 finds is added to the table and treated the same way. Nothing outside F-1 is touched.

**Design guidance (routine; within C1w's existing mechanism, no new architecture).**
1. **One reader of the key in force.** Do not add a second mechanism beside `nilai_jawaban_berlaku`. Where a view
   needs the key itself and not a score (the `not is_correct` joins, `is_key`), take it from the same source: the
   basis of `hasil_murid_id(session)` for that question, else the sealed options. If a helper returning the key in
   force for (sitting, question) is added, `nilai_jawaban_berlaku` is expressed through it, so there is one place.
2. **Which accessor.** Requirement 1 says "the result-in-force accessor". The key in force for a sitting is recorded
   only on a governed correction's basis, which is what `hasil_murid_id` resolves; an ordinary recalculation
   (`hasil_terkini_id` may point to one) changes no key. State on the correction's page which accessor each view
   uses and why, so Sharon reviews the choice and not a guess.
3. **Uncorrected sittings (requirement 3).** Every corrected read falls back to exactly today's expression, so a
   sitting with no governed correction produces byte-identical rows. Prove it with a before-and-after comparison of
   each view over an uncorrected world, not only by reasoning.
4. **The cohort view is set-based.** `service_cohort_misconceptions` aggregates every response of a class. Join the
   governing basis once per sitting; do not call a function per response row. Record the view's plan or timing
   before and after on a class-sized fixture.
5. **`class.misconceptions` (requirement 4).** The figure's definition, name, version label and denominator do not
   change. Only which answers count as wrong changes, and only for corrected sittings. If that cannot be done without
   touching the catalogue row, stop and escalate.
6. **History (requirement 2).** No sealed result, basis, option or response is updated. The original marking stays
   readable through the result chain (`riwayat_hasil_sesi`).
7. **`is_key` in the teacher's evidence (row 2).** After a correction the teacher must not be shown the old key as
   the key. Show the key in force. Whether the original key is also shown, and how, is presentation: if the screen
   changes, Daisy reviews it (§6).

**Tests (red first, each failing on `3a190dbf`).** One per corrected view (requirement 1): a sitting whose answer
was wrong by the original key and right by the corrected one no longer appears as a misconception in rows 1 and 4, is
marked right in row 2, and is not sent to remediate that question in row 3; and the converse case (right by the
original, wrong by the corrected) appears. One uncorrected-world identity test per view (requirement 3). §8.5
journey 3 across the corrected views (requirement 5). Plants: restoring the sealed-key read in any one view turns its
test red.

**Before any push:** THE PLAN §4.1, P1 to P6, in full. **Then:** the exact commit to Sharon, once.

## 10 · Log

| Date | Entry |
|---|---|
| 11 Nov 2026 | F-1 classified a mandatory pre-promotion blocker (Sharon; accepted by the owner). Recorded. Pass scheduled for the boundary after B1. B1 not interrupted |
| 11 Nov 2026 (evening) | Owner: continue under the approved plan overnight; schedule this pass after B1 closes and before B2. Release rule recorded in §3. Preliminary impact list (§8) and the engineer's brief (§9) added |
| 11 Nov 2026 (late) | Owner approved a second, separate small correction at the same boundary (`AUTH-SUSPENDED-SIGNIN-CORRECTION.md`). Sequence: B1 closes → this pass and that one, each with Sharon's review → B2 |
| 11 Nov 2026 (late) | B1 closed on `1fc719b5` (Sharon PASS, Daisy PASS, CI and journeys green). This pass is released. Order at the boundary: the suspended sign-in correction first, then this pass; B2 after both have Sharon's PASS |
