# C1w · finding F-1 · mandatory correction before promotion

> **Coordination record.** Owner's decision of 11 November 2026, accepting Sharon's classification. Kept by the Chief
> Architect. THE PLAN (`THE-PLAN.md`, owner approved) is **not amended**: its §7.7 already says that F-1 is placed by
> Sharon's classification and that, if a blocker, it is corrected in C1w's one correction pass before promotion.

## 0 · What holds now (overrides anything below that differs)

1. **Sharon: BLOCKED on `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49`, for one reader:** the learner's own review,
   `session_review`, shows the sealed rationale beside the in-force mark. Requirements 1 to 5 are verified;
   requirement 6 is short by that reader.
2. **The correction (hers):** in `session_review`, when the chosen option's correctness under the key in force
   differs from its sealed `is_correct`, return **no rationale** for it (null). Every other row and every uncorrected
   sitting stays byte-identical. Tests red first on that commit: the now-right answer shows `benar` true and no
   rationale calling it wrong; a now-wrong answer shows no sealed rationale calling it right; an uncorrected sitting's
   review is byte-identical; a plant restores the sealed rationale.
3. **Her judgments, all accepted:** the accessor `hasil_murid_id`; D-060 unchanged with no new catalogue, **ruled
   explicitly for both `class.misconceptions` (row 1) and `item.correctness_rate` (row 5a)**; row 5b left as is.
4. **F1-R1 is settled by item 2** as to the learner's review: it is a reader's choice, inside F-1, and is not an
   owner decision. What remains of F1-R1 is Daisy's establishing pass: whether any **other** screen shows a rationale
   beside a mark, and whether the learner's screen should say why the explanation is absent (her wording).
5. **Register, not in this pass:**
   - **F1-R2:** a Question Health screen that shows both the correctness rate (in force) and distractor uptake's key
     flag (sealed) for a corrected item says «kunci diperbaiki», so the flag is not read as the key in force.
   - **Row 5b for the owner, with the 4.5 item-statistics work:** whether distractor uptake's key flag should itself
     move is a catalogue question.
5a. **Daisy: PASS on `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49` for the teacher's screen and for her L-1
   confirmation** (record: `ux-1/daisy-experience` at `34004af2f22055420b4c3b9f0473aae2dd986674`). **One statement
   in her review is contradicted by the code and is not relied on:** that no screen tied to a sitting shows a
   rationale (§9d). Sharon's blocker stands.
5b. **F1-R1 has a second, larger part (§9d): the corrected revision itself carries stale authored text,** which
   future learners will meet. It is outside F-1 and is **put to the owner.**
6. **Next:** the fix is a new commit; Sharon rechecks that alone. Daisy's F-1 visit continues on
   `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49` for the teacher's screen, and she reviews the learner's review on the
   fix commit if its screen or wording changes.

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

## 9a · Chief Architect's read of the candidate (12 Nov 2026)

Read-only, of `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49` on `claude/system-integrity-4.0` (one migration,
`M/20270117100000…`; tests; six planted defects; one line on the teacher's per-question screen; the engineer's page
`docs/completion-4.1/batches/C1W-F1-COMPLETION.md`). The engineer reports the local pre-flight green on the suite
(1088 passed, 0 failed) and the planted defects (162 of 162). CI and journeys on this commit are not yet confirmed by
this read.

| Brief (§9) | As built | Standing |
|---|---|---|
| One reader of the key in force | `kunci_berlaku_sesi(session)` is the only reader of a basis's key; `nilai_jawaban_berlaku` is re-expressed through it; the migration refuses to finish unless each corrected reader takes the key from it and none keeps the sealed-key read | Met |
| Which accessor, and why | `hasil_murid_id`, reasoned in the migration header and on the page | Met; Sharon reviews the choice |
| Uncorrected sittings identical | Every corrected read is `coalesce(key in force, sealed key)`; tests F13-K06 to K10 compare each view with its exact previous definition, plus a whole-database comparison | Met |
| The cohort view is set-based | The reader is joined once per query, not called per response; class read timed before and after (4.80 to 4.89 ms uncorrected, 4.95 to 4.96 ms corrected) | Met |
| `class.misconceptions` definition unchanged | The catalogue fingerprint is identical before and after (F13-K12); no new catalogue published | Met as built; **Sharon rules** on whether that reading of D-060 is right |
| History immutable | F13-K11: sealed question, options, digest, original results, presented items and responses byte-identical | Met |
| `is_key` on the teacher's evidence | The key in force; where it differs, each option also carries `was_key`, and the screen says so in one line | Met; **Daisy reviews the line** |
| Journey 3 across the corrected views | C1W-J02, through the running app with eleven learners | Met |
| Plants | Six, each restoring the sealed-key read in one view | Met |

**The impact list of §8, as disposed by the pass:**

| Row | Disposition |
|---|---|
| 1 `service_cohort_misconceptions` | Corrected |
| 2 `teacher_question_evidence` | Corrected (mark and `is_key`) |
| 3 `reading_map` remediation | Corrected |
| 4 `session_misconceptions` (the additional candidate) | Corrected |
| 5a `service_item_statistics` correct count and rate | **Corrected.** An educator-facing figure that counted an answer wrong that the result in force counts right. It is also read by `recompute_question_health` |
| 5b distractor uptake's per-option key flag | **Not changed, deliberately.** It counts choices and marks no answer; a per-sitting key would split one option's row in two, which changes the figure's shape. A catalogue question, put to Sharon |
| 6 `learning_delta` | Not a marking view; unchanged |

**Two points for Sharon, in the Chief Architect's words:**

1. **Row 5a changes a figure that a catalogue entry describes** (`item.correctness_rate`), in the same way row 1
   changes `class.misconceptions`: the definition is untouched, and only corrected sittings move. If she accepts that
   reading for row 1 she will likely accept it for 5a, but it is the same D-060 question asked twice, and it also
   moves Question Health for a corrected question. It should be ruled explicitly, not by inference.
2. **Row 5b leaves a visible disagreement:** after a correction, distractor uptake still flags the old key as the
   key, beside figures that now use the new one. Leaving it is right for this pass. If Sharon agrees it is a
   catalogue matter, it is recorded as a finding for the owner with the 4.5 item-statistics work, where the figure's
   shape is already to be reconsidered.

**The wording added (Daisy's to review):** «Kunci soal ini sudah diperbaiki. Jawaban di sini dinilai dengan kunci
yang berlaku sekarang; kunci aslinya {asli}.»

## 9b · With the reviewers (12 Nov 2026)

The engineer's review prompts were handed to Sharon and Daisy for
`4131d7a2cbd30df3f18603e66ec3f08b7c25ad49`. Evidence stated in them: 1088 passed, 0 failed; 162 of 162 planted
defects; 11 of 11 groups; CI run `43142431230` success on the first attempt; journeys run `43142435769` success.

**Two additions from the Chief Architect, sent with the prompts' follow-up:**

1. **Sharon, row 5a explicitly.** The prompt asks for her D-060 judgment in terms of `class.misconceptions`. The pass
   also changed `service_item_statistics`' correct count, which the catalogue describes as `item.correctness_rate`
   and which `recompute_question_health` reads. It is the same question asked of a second figure, and of Question
   Health for a corrected question. Her ruling should name it (§9a point 1).
2. **A consequence the engineer recorded as "not done", raised to a finding (F1-R1).** After a correction, an option
   that is now right can still carry its authored rationale «Ini belum tepat». The engineer is right that it is
   authored content and not this pass's to rewrite. But ask *and then what?*: wherever a rationale is shown beside a
   marked answer, a learner or teacher can read "correct" and, next to it, the author's sentence that it is not. That
   is the same contradiction F-1 exists to remove, moved from the mark to the words.
   - **To establish (Daisy, in this visit, where she can):** on which screens a rationale is shown for a sitting's
     answer (the learner's review, the teacher's per-question evidence), and what a corrected question shows there.
   - ~~**Not decided here.** Possible treatments range from not showing a rationale for an option whose correctness
     changed on that sitting, to asking the correcting educator to revise the rationale as part of the correction.
     Both touch C1w's approved correction flow, so it is brought to the owner with the reviewers' findings, not
     built.~~ (**Superseded, 12 Nov:** Sharon ruled the learner's review a reader inside F-1 and required the first
     treatment there; §0 items 2 and 4. It does not touch the correction flow and needs no owner decision.)

## 9c · Sharon's review (12 Nov 2026), in brief

- **Blocker:** `session_review` gives a learner `benar` from the key in force (since `M/20270115110000`) and `alasan`
  from the sealed option's rationale. On a corrected sitting a learner who chose the now-right option sees their
  answer marked right beside «Ini belum tepat», in every mode the review opens for (only PRE_TEST refuses it). The
  text is authored, but serving it beside an in-force mark is a reader's choice, and requirement 6 covers every
  reader that marks an answer or derives remediation from it.
- **Verified:** one accessor for all corrected readers, with the migration refusing a bare sealed read; history
  immutable; uncorrected sittings identical, by assertion and on data; catalogue untouched; journey 3; boundaries
  unchanged (`teacher_question_evidence` keeps its checks; the reader is revoked from clients; the withdrawal
  exclusion still reaches both class-wide views).
- **Question Health (row 5a's effect):** a corrected item's state can move, for example a signal raised by the wrong
  key clearing. Every move is an audited transition naming the catalogue version, and an item in a human-decided
  state is skipped, so a reviewer's decision is not overwritten. Nothing to change.
- **A sitting still open when its key was corrected** keeps the sealed key until it finalises and is recomputed,
  consistent with its own result in force.

**Chief Architect's note.** §9b raised the rationale as a finding and wrongly expected it to need the owner. Sharon's
classification is the better one: the contradiction is produced by what a reader chooses to serve, so it is F-1's
own defect and its fix belongs here.

## 9d · Daisy's review, and what it establishes about F1-R1 (12 Nov 2026)

**Accepted, all at 1280, 390 and 320 px with axe clean:** «Kunci» marks the key in force and the counts follow it;
the new line sits below the options and reads «… kunci aslinya A.», and a teacher cannot mistake the two keys;
uncorrected questions are unchanged; the class figure and reading map are unchanged in form and corrected.

**Her L-1 confirmation: accepted.** Suspended (right or wrong password), closed, unknown and active-with-wrong-
password all get the same 401 and wording; activation code, recovery code and recovery PIN answer identically across
the cases; the record's rows read as ordinary mistakes for both admins; reinstatement works; a real outage is still
503. Not done locally, by her statement: the card door, recovery with the right PIN, and AUTH-A01's setup; she relies
on CI for those.

**One statement not relied on.** Her review says learners never see a rationale beside a mark. The learner's result
page does show one: `src/app/belajar/[tugas]/hasil/page.tsx` renders `r.alasan` from `session_review` inside each
question's collapsed disclosure (the `pin-why` line), read by the Chief Architect in the 4.0 code. It is easy to
miss because the disclosure is closed unless a safety-critical question was missed. **Sharon's blocker is therefore
confirmed in the screen as well as in the function.** Daisy is asked to open that disclosure for a corrected sitting
when she looks at the fix (THE PLAN's rendered check already says "every disclosure opened").

**What she found in Studio is the larger matter.** On the **corrected revision** of the question:

- the option that is now the key (B) carries «Kunci» and, beside it, «Alasan: Ini belum tepat.»; the option that
  was the key (A) carries «Ini tepat.»;
- B, now the key, still names a misconception («Pemahaman keliru: …»);
- the screen on which the second person confirms the correction shows no rationales, so nobody sees what the
  correction will leave contradictory.

**Why this is larger than the blocker (Chief Architect).** Sharon's fix removes the stale rationale from the review
of a sitting that was corrected **after it was sat**, by comparing the key in force with the sealed option. On the
corrected revision the sealed option *is* the new key, so that comparison finds nothing, and the stale text stays.
Assignments are moved to the corrected revision, so **every learner who sits the question from then on** can be
shown "right" beside «Ini belum tepat», or "not yet" beside «Ini tepat», in their own result. The wrong-key
correction fixes the mark and leaves the explanation wrong for everyone afterwards. The same holds for the
misconception: a learner who now picks the old key (wrong) is told nothing, and the new key carries a misconception
that no longer describes an error.

This is in C1w's approved correction flow, not in a reader, so it is **not** part of F-1 and is the owner's to
decide.

**Options.**

| Option | What happens at a key correction | Consequence |
|---|---|---|
| **A (recommended as the minimum)** | On the corrected revision, the rationale and the misconception code are **cleared** on every option whose correctness changed. The confirmation screen says which options lose their text. The revision is marked in Studio as needing its explanations written | No learner is ever shown an explanation that contradicts their mark. An absent explanation is honest; a wrong one is not. The educator writes new text through the ordinary revision path. Small, mechanical, and it preserves the two-person rule unchanged |
| B | The person proposing the correction must supply the new rationale and misconception for each affected option, and the second person confirms them with the key | The corrected revision is complete at once. But it enlarges the correction act, slows an urgent fix of a wrong key, and changes C1w's approved two-step flow more deeply |
| C | Leave as is | Learners after the correction are shown contradictory explanations indefinitely |

**Recommendation:** A now, as a small C1w correction before Z, with Sharon's and Daisy's review; B can be considered
later as an improvement on top of A. Sealed history is untouched in every option: the original revision keeps its
text as it was sat.

## 10 · Log

| Date | Entry |
|---|---|
| 11 Nov 2026 | F-1 classified a mandatory pre-promotion blocker (Sharon; accepted by the owner). Recorded. Pass scheduled for the boundary after B1. B1 not interrupted |
| 11 Nov 2026 (evening) | Owner: continue under the approved plan overnight; schedule this pass after B1 closes and before B2. Release rule recorded in §3. Preliminary impact list (§8) and the engineer's brief (§9) added |
| 11 Nov 2026 (late) | Owner approved a second, separate small correction at the same boundary (`AUTH-SUSPENDED-SIGNIN-CORRECTION.md`). Sequence: B1 closes → this pass and that one, each with Sharon's review → B2 |
| 11 Nov 2026 (late) | B1 closed on `1fc719b5` (Sharon PASS, Daisy PASS, CI and journeys green). This pass is released. Order at the boundary: the suspended sign-in correction first, then this pass; B2 after both have Sharon's PASS |
| 12 Nov 2026 | Candidate pushed: `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49`. Read by the Chief Architect (§9a). For Sharon and Daisy once CI and journeys are green on it |
| 12 Nov 2026 | CI `43142431230` and journeys `43142435769` success on `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49`. With Sharon and Daisy. Two additions from the Chief Architect (§9b): row 5a to be ruled explicitly; finding F1-R1 on rationale text after a correction |
| 12 Nov 2026 | Sharon: BLOCKED on `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49` for `session_review`'s rationale only; requirements 1 to 5 verified; accessor, D-060 (rows 1 and 5a) and row 5b accepted. §0 added. Register F1-R2 opened |

> **Correction to this log (12 Nov 2026, 03:45 UTC, read from the clock).** Entries dated 12 Nov after 01:45 UTC carried times that were estimated, not read from a clock, and several were later than the actual time. Those times have been removed. The order of the entries is correct.
| 12 Nov 2026 (about 04:00 UTC) | Daisy: PASS on `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49` for the teacher's screen and her L-1 confirmation. Her statement that no sitting screen shows a rationale is contradicted by the learner's result page (§9d). Her Studio finding raised to the owner as the second part of F1-R1 |
