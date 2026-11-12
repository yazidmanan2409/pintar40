# C1w · F-1 correction pass: completion page

**A correction pass on closed C1w, after B1 and before B2.** Source: `C1W-F1-CORRECTION.md` (`claude/bob-41-master-plan`
`da1d3709dde87533dafea2e8cf39dbfa0c222e00`), Sharon's six acceptance requirements. Review: Sharon, once, on the exact
commit; **Daisy too, because one teacher screen changes** (below).

## What holds now

- **Sharon: BLOCKED on `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49` for one reader** (`C1W-F1-CORRECTION.md` §0 on
  `claude/bob-41-master-plan` at `8b93cc785d70420fc6bf0b272a0e9eb8f29b8e4e`). The learner's own review,
  `session_review`, showed the sealed rationale beside the in-force mark. Her requirements 1 to 5 are verified;
  requirement 6 was short by that reader.
- **Her correction is its own commit after it** («Correction pass» below), for her recheck of that item alone.
- **Her judgments, all accepted:**
  - the accessor `hasil_murid_id`;
  - D-060 unchanged with no new catalogue, ruled explicitly for `class.misconceptions` (row 1) and
    `item.correctness_rate` (row 5a);
  - row 5b left as is.
- **Register, not in this pass:**
  - F1-R1's remainder, Daisy's: whether any other screen shows a rationale beside a mark, and whether the learner's
    screen says why the explanation is absent;
  - F1-R2, the Question Health marker;
  - row 5b, for the owner, with the 4.5 statistics work;
  - F1-R1b, a key correction clearing the explanations it makes stale, its own commit.

**Rule (THE PLAN §7.7, O41-21).** Every view that marks an answer, or derives a misconception or a remediation from
that mark, reads the key in force for the sitting through one accessor. It never reads the sealed key directly. The
original marking stays visible in history.

## As built

Migration `20270117100000_every_view_of_a_corrected_answer_marks_it_by_the_key_in_force.sql`:

- **One reader:** `kunci_berlaku_sesi(session)` returns the key in force from the basis of `hasil_murid_id`. It
  returns rows only for sittings with a governed correction; with no argument it returns them all as one set.
  `nilai_jawaban_berlaku` now goes through it.
- **Fallback:** every corrected reader falls back to exactly its old expression where the reader returns nothing. An
  in-migration check proves that removing the named fragments gives back each earlier definition byte for byte.
- **Accessor, for every view: `hasil_murid_id`.** A key in force is recorded only on a governed correction's basis.
  `hasil_terkini_id` can point at an ordinary recalculation, which records no key. Wherever a basis exists the two
  name the same result: an ordinary recalculation after a correction is refused (PR011), and a correction supersedes
  an earlier ordinary one.

## Impact list (brief §8) and the completeness search (requirement 6)

| # | Object | What it read | Decision | Test, plant |
|---|---|---|---|---|
| 1 | `service_cohort_misconceptions`, the source of `class.misconceptions` | `NOT o.is_correct` | **Corrected.** The reader is joined once per query, not per answer | F13-K01, K06; bob04-10; C1W-J02 |
| 2 | `teacher_question_evidence` | the mark through `grade_response`; `is_key` from `o.is_correct` | **Corrected.** The mark goes through `nilai_jawaban_berlaku`, and `is_key` is the key in force. Where it differs from the sealed key, each option also carries `was_key` and the question `key_corrected` | F13-K02, K07; bob04-11, bob04-12; C1W-J02 |
| 3 | `reading_map` remediation join | `not o2.is_correct` | **Corrected** | F13-K03, K08; bob04-13; C1W-J02 |
| 4 | `session_misconceptions` | `not o.is_correct` | **Corrected** | F13-K04, K09; bob04-14 |
| 5a | `service_item_statistics` `correct_count` and `correctness_rate` (`item.correctness_rate`, shown to heads of department and admins; also read by `recompute_question_health`) | `o.is_correct` | **Corrected:** an educator-facing figure that counted answers wrong that the result in force counts right. The catalogue meaning ("share answered correctly") is unchanged. The four 4.5 statistics defects are not touched | F13-K05, K10; bob04-15 |
| 5b | `service_distractor_uptake`, its scoped view, and `calc_item_distractor_uptake` | the `is_correct` flag per option | **Not changed.** It counts choices and marks no answer; a per-sitting key would split one option's row in two, which changes the figure's shape. **Residual for Sharon:** the flag still shows the sealed key, and changing it would be a catalogue question | — |
| 6 | `learning_delta` | results only (through `hasil_murid_id` since C1w) | Not a marking view; unchanged | — |
| — | `session_review` | `nilai_jawaban_berlaku` for the mark; **the sealed option's `rationale` beside it** | ~~Already correct; now goes through the reader~~ *(superseded: Sharon found the rationale stale, «Correction pass» below)*. The mark goes through the reader; **the rationale is withheld where the mark changed** | C1W-S05; F13-K13 to K15; bob04-16 |
| — | `evaluate_session`, `grade_response`, `finalize_session`, `recompute_result`, the correction's own scoring, preview and impact functions | original or governed scoring | Must stay as they are (requirement 2) | — |
| — | Content and authoring functions, and the `assert_*` checks | carry or compare keys | Mark no sitting's answer | — |
| — | `src/`: Studio's question bank and review page | the question's own key | Not a sitting's view | — |

The full database search is recorded with the evidence. No planted defect, and none of the CI file's red cases,
targeted the changed objects. C12-S01 now reads the new migration (restated, with a note). The two migration-count
pins move from 233 to 234 (restated, with notes).

## Sharon's six requirements

| # | Requirement | Evidence |
|---|---|---|
| 1 | Each of the three named views reads the result-in-force accessor, with its own red-first test | F13-K01 to K03 and C1W-J02, all red on `2ea60c85e4f855eca2175749c4270a170922ee33`; row 4 and row 5a too (K04, K05) |
| 2 | History immutable | F13-K11: the sealed question, its options, the release digest, the original results, the presented items and the responses are byte-identical after the correction and after every view read. `riwayat_hasil_sesi` reads SEALED 0.6667, then KEY_CORRECTED 1.0000 (current). The migration writes no row |
| 3 | Uncorrected sittings unchanged | F13-K06 to K10 compare each view with its exact previous definition. A whole-database comparison (the seed plus an uncorrected class of 35) found all five readers identical row for row |
| 4 | `class.misconceptions` catalogue definition unchanged | F13-K12: the catalogue fingerprint (MC-10, definitions, sources and calculators) is identical before and after. **For Sharon (D-060):** the migration declares `CATALOGUE: unchanged (D-060(c))` and publishes no new catalogue, because only governed-corrected sittings move and none exists on a deployed database. If she reads it as a change of meaning, it is the owner's catalogue decision |
| 5 | THE PLAN §8.5 journey 3 across the corrected views | C1W-J02, through the running app with eleven learners: a key corrected and confirmed; six learners at 100% and five at 67% in force, the sealed results kept; «Bukti» names A's misconception and not B's; «Lihat per soal» shows 6 of 11 right, B as the key and «kunci aslinya A»; in «Peta Bacaan» the learner who chose B gets no remediation and the learner who chose A gets A's. The checks agree. The journey removes its committed data and proves none is left |
| 6 | Completeness search | The table above. ~~Complete~~ *(superseded: short by `session_review`'s rationale; corrected in «Correction pass»)* |

**The cohort view stays set-based** (class of 35):

| | Before | After |
|---|---|---|
| Uncorrected, class read | 4.80 ms | 4.89 ms |
| Corrected, class read | 4.95 ms | 4.96 ms |

The reader runs once per query.

## The teacher's screen changes (for Daisy)

`/mengajar/[kelas]/soal`: «Kunci» marks the key in force. A corrected question shows one new line,
`mengajar.soal.kunci_diperbaiki`:
- «Kunci soal ini sudah diperbaiki. Jawaban di sini dinilai dengan kunci yang berlaku sekarang; kunci aslinya {asli}.»
- «This question's key was corrected. The answers here are marked by the key in force now; its original key was {asli}.»

The class misconception figure and the reading map look the same; their figures are now corrected.

## Next state of each consequential action (SYSTEM-INTEGRITY-4.1 §3a)

None new. The pass makes the readers agree with an existing correctable action, the governed key correction (O41-22).

## Cross-module inventory (SYSTEM-INTEGRITY-4.1 §2, §4 row "C1w F-1 pass")

| Interface | Checked how | Evidence | Limitation |
|---|---|---|---|
| Every reader that marks an answer, or derives a misconception or remediation | Each one listed in the table above, with its decision | F13-K01 to K12; plants bob04-10 to 15 | Row 5b is left as is (a residual for Sharon) |
| The learner's result and reading map | Corrected result in force; the remediation follows it | C1W-J02, F13-K03 | — |
| The teacher's evidence and the class figure | Key in force, original key named; class misconception counts only answers wrong by the key in force | C1W-J02, F13-K01, F13-K02 | — |
| Certificates and their review | Unchanged; they already read the result in force (C1w) | C1W-S06, C1W-A02 | — |
| History | Original marking kept and readable | F13-K11 | — |
| Uncorrected sittings | Identical, row for row | F13-K06 to K10; whole-database comparison | Seed ids are random, so the comparison is against the exact previous definitions |

**Transitions (§3):** corrections and result supersession: K01 to K12 and J02. Historical records and sealed content: K11.
Transfer, suspension, deletion and recovery: not applicable (no change to who reads what).

## Not done, recorded

- **Row 5b:** the per-option key flag in distractor uptake. A catalogue question, for Sharon.
- **Authored rationale text** of an option that is now right can still read «Ini belum tepat»: it is authored content,
  outside F-1.
- **Test tooling:** the planted-defect harness's schema digest now includes view definitions; without that, a plant
  that changes only a view would be rejected as having matched nothing. The CI file's echo text for the learning-cycle
  gate still says "nine defects" (cosmetic).
- **C1W-J02** leaves its synthetic learner accounts behind, as C1W-J01 does. Classes, sittings and enrolments are
  removed.

## Correction pass: the learner's review (Sharon, `C1W-F1-CORRECTION.md` §0 item 2)

**As built** (migration `20270117120000_a_corrected_answer_is_not_explained_by_the_sealed_key.sql`):
- In `session_review`, where the chosen answer's mark by the key in force differs from its sealed mark
  (`grade_response`), the rationale is null. The mark stays the key in force's.
- Where no governed correction exists, `nilai_jawaban_berlaku` falls back to `grade_response`. The two marks are then
  equal, and every row is returned as before.
- The sealed option keeps its authored text; only this reader withholds it.
- The migration's own check: removing the one fragment gives back the previous definition byte for byte.

**Tests, red first on `4131d7a2cbd30df3f18603e66ec3f08b7c25ad49`:**
- **The world:** a pre-test has no review, so `selftest.f13_ulasan` corrects a POST-TEST question. Two learners sit
  it; on its first question Y one chooses B and one A; Y's key is then corrected from A to B by the school's own two
  people.

| Test | What it shows | On `4131d7a2` |
|---|---|---|
| F13-K13 | The now-right answer: marked right, no rationale (before: wrong, «Ini belum tepat.») | **red**: right beside «Ini belum tepat.» |
| F13-K14 | The now-wrong answer: marked wrong, no rationale, never «Ini tepat.» | **red**: wrong beside «Ini tepat.» |
| F13-K15 | Before the correction every row carries its option's sealed mark and rationale; after it every row but Y's is byte-identical | green, by nature: it guards against the correction reaching too far |
| Plant bob04-16 | Puts the sealed rationale back: F13-K13 red | the gate's control count moves from 17 to 20 green rows |
| Migration-count pins | 235 to 236 (restated, with notes) | — |

**What the learner sees:** the corrected question's mark with no explanation under it. Whether the screen says why is
Daisy's (F1-R1's remainder).

**Next state:** none new. The reader now agrees with the existing correctable action.
