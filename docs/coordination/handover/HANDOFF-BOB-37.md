READY FOR GATE: CI #240 (run 36639112983) green on 0fd83f7882bc8bfec68d409f0803e31057709a5a

# Bob → coordinator: BOB-37 (per-topic mastery can show)

**SHA:** `7c6657d`, its own commit, and `dc268b5` (the db-wp1 plant restated, below). `main` is merged in twice: `375d84f` as `9d6ebed`, and `1393c38` (D-062(a)) as `0fd83f7`.
- **Manifest:** F06-P23. The lane's manifest is v126 with 438 ids.
- **CI:** CI #240 (run `36639112983`, https://github.com/yazidmanan2409/pintar40/actions/runs/36639112983) on `0fd83f7882bc8bfec68d409f0803e31057709a5a`, green.
- EDU-12, X-10. Found by Daisy tracing UX-26 and verified by you.

## CHANGED
**The defect.**
- `assessment_results.per_domain` holds one object per objective, `{benar, total, penguasaan}`. That is the scoring's own shape since `20260913091500`, and `evaluate_session` is its only writer. Every seeded result holds it too.
- `calc_class_topic_mastery` and `calc_institution_competency_outcomes` (last emitted in `20260923110000`) kept only values whose JSON type is `number`. No stored value ever was one.
- So both always answered nothing. The teacher's «Penguasaan per bagian» and the school's competency outcomes could never appear, whatever had been sat.

**Migration `20261025100000_per_topic_mastery_reads_the_recorded_objects.sql`** (the 131st):
- **Both calculators read each objective's recorded `penguasaan`** and average it over the learners, one latest result per session as before.
  - **Why `penguasaan` and not a recomputation from `benar`/`total`:** it is the figure the scoring recorded for that learner and that objective, stamped with the result's `scoring_policy_version`. A calculator that recomputed it would be a second scoring engine.
  - **What the metrics mean:** «Rata-rata penguasaan kelas pada tiap topik» and «Rata-rata penguasaan pada tiap ranah yang diukur», which is the average of the learners' figures. It is not a pooled benar/total, and plant bob37-3 holds that difference.
  - **Your ruling (29 Sep):** averaging each learner's recorded `penguasaan` (0.55 and 0.625 in the test) is correct. It matches the catalogue's meaning, and MC-1's calculator averaged too. Kept as built.
  - An entry with no numeric `penguasaan` is not counted.
- **Everything else in both bodies is `20260923110000`'s, unchanged:**
  - the scoped sources;
  - the POST_TEST filter;
  - the rounding to 4 places and the grouping;
  - the `sample` (the most learners any one objective has);
  - the output shape the surfaces already read: `{objective: average}` for the class, and `[{competency, mean_score, learners}]` for the school.
  - The calculators' grants are as they were: the client roles are revoked by name, and the ACL is otherwise unchanged.
- **No stored result is rewritten.** Nothing in the migration writes `assessment_results` or any evidence table.

## PROOF
- **F06-P23** (db, `selftest/db/fable06.sql`, every row rolled back). It is self-contained in fable06: `selftest.bob37_learner` is fable06's own helper, built on `wp2_school`, so it runs where the red-case jobs load `fable0*.sql` alone.
  - **The fixture:** five learners in a class of their own, under the demo school's real cohort. Each has a FINALIZED Cek penguasaan copied from the real one, and each result holds the scoring's own objects under two objectives used nowhere else, so every figure is exact:
    - **BOB37-A:** 1, 0.5, 0, 0.25 (1 of 4) and 1. The average is 0.55; a pooled benar/total would be 6/12 = 0.5.
    - **BOB37-B:** four learners sat it, at 1, 0.5, 0.75 and 0.25, so 0.625.
  - **Red on today's code** (`651b160`'s migrations, with this fable06.sql, on a fresh stack loading only `fable0*.sql`):
    `four learners should be below the minimum of 5 with 4 counted, the teacher's figure said {"have": 0, "needed": 5, "status": "below_minimum", …, "catalogue_version": "MC-2"}; the class's per-topic mastery did not show for five learners: {"have": 0, "needed": 5, "status": "below_minimum", …}; the school's competency outcomes hold nothing for the two objectives, expected BOB37-A 0.55 over 5 and BOB37-B 0.625 over 4; the school's competency outcomes should count at least the five learners against the minimum of 10, they said {"have": 0, "needed": 10, …}; the live metric catalogue is MC-2, not MC-3`.
  - **Green now:**
    - **The teacher's «Penguasaan per bagian»:** `class.topic_mastery`, asked through `metric_evaluate` by the Head of Department over the class, the way the surface asks it, is `ok` with `{"BOB37-A": 0.55, "BOB37-B": 0.625}` over 5.
    - **The school's competency outcomes**, from `calc_institution_competency_outcomes` inside the school's bound boundary, are BOB37-A 0.55 over 5 learners and BOB37-B 0.625 over 4.
- **Preserved, with tests (all in F06-P23):**
  - **The minimum sample is unchanged.** With four learners the class figure is `below_minimum`, with `have` 4 and `needed` 5. The school's figure is counted against its unchanged minimum of 10.
  - **The audiences are unchanged.** The Head of Department reads the class figure and the school admin is counted against the school's; every audience is asserted identical in MC-3 below.
  - **MC-3 is MC-2 copied forward.** Every definition is compared column by column, minimum sample and audiences included, and so are the readiness tiers, the question-health thresholds and the declared sources.
- **Plants:** a new gate, `db-bob37-gates` (`run_fable06`, control 35).
  - **bob37-1** turns F06-P23 red with `the class's per-topic mastery did not show for five learners`: the class calculator keeps only bare numbers again.
  - **bob37-2** turns F06-P23 red with `the school's competency outcomes hold nothing for the two objectives`: the school calculator keeps only bare numbers again.
  - **bob37-3** turns F06-P23 red with `the class's per-topic mastery is {"BOB37-A": 0.5000`: the class calculator pools benar/total instead of averaging the recorded `penguasaan`.
- **Restated for the changed requirement:**
  - The migration tripwires move 130 → 131, with the reason beside them.
  - `db-bob39-gates`' control (`run_fable06`) moves 34 → 35, for the new row.
  - **The db-wp1 plant «the metric route reopened to Management»** (red case 14 in `ci.yml`, `dc268b5`), kept as you ruled.
    - **What it plants:** it builds a rogue catalogue, MC-99, in which learner.result is open to Management again, and requires F06-P12 to go red for `metric route`.
    - **Why it needed changing:** it made MC-99 by superseding `'MC-2'` by name. Once BOB-37 made MC-3 the live catalogue, `enforce_catalogue_header` refused that update (`catalogue version MC-2 is already superseded by MC-3`). So the plant planted nothing, F06-P12 stayed green, and the job failed. My first local proof on `7c6657d` showed exactly that.
    - **The change:** the plant now reads `public.current_metric_catalogue()` and supersedes whichever catalogue is live, planting the same defect. A later catalogue cannot turn it into a no-op. F06-P12 and its expected reason are unchanged.
    - On a fresh stack the job's 13 red cases all ran, and F06-P12 went red for `metric route`.
- **Local, on fresh CI-shaped databases** (a new cluster after the container restarted; each database built with the Supabase CLI's migrations and the seeds, and no selftest file until the job loads what CI loads; `en-US` ICU collation; Supabase's default privileges emulated):
  - **full suite** on `0fd83f7`: 406 passed, 0 failed, 31 justified skips. The one unjustified skip, UX1-PIMPINAN-AKSES-01, needs network, as before. F06-P23 passed, and so did BOB18-K01, which reads the merged `vercel.json`.
  - **plants:** 127 of 127 proved their gates, bob37-1 to bob37-3 among them.
  - **every db red-case gate in the `ci.yml` matrix** (21; db-table-without-rls left to CI), each on its own new stack, from scripts freshly extracted from the current `ci.yml`: all exited 0 after really running. db-wp1-gates turned 39 rows red, db-fable06-gates 39 and db-tour-gates 24, and db-bob37-gates proved 3 of 3 plants.
- **A defect in my own local tooling, found and fixed along the way.** My extractor of the gates' scripts from `ci.yml` de-indented a block by its least-indented line. So in five inline gates (fable04, fable05, task1, task2 and wp1) the heredoc terminators stayed indented, bash read the rest of the script as one heredoc, and the job exited 0 without planting anything.
  - The same warning is in my older local shared-run logs for fable04, fable05, task1 and task2. So my earlier local "all shared gates exit 0" claims were empty for those four; CI always ran them properly.
  - The extractor now strips exactly the YAML block's indentation. All seven changed scripts were rerun on fresh stacks and really ran, with no heredoc warning.
  - None of this touches the repository.

## CI
- **CI #240 (run `36639112983`, https://github.com/yazidmanan2409/pintar40/actions/runs/36639112983), green, 32 of 32 jobs.** It was a `workflow_dispatch` on `claude/quirky-meitner-a04smj` at `0fd83f7882bc8bfec68d409f0803e31057709a5a`, with `main` `1393c38` merged in, and I watched it to the end.
- The job list includes `red case · db-bob37-gates`, `red case · db-wp1-gates`, `red case · db-fable06-gates` and `red case · db-tour-gates`, all green, and the strict selftest contract.
- The red-case matrix gains `db-bob37-gates`.

## CONTRACT
Both calculators keep their signatures and output shapes, so no surface changes. `metric_evaluate` now cites `catalogue_version: "MC-3"`, and so will new report snapshots. There is no new client RPC.

## MIGRATIONS
`20261025100000`: two calculator bodies redefined, and catalogue MC-3 published, which is rows copied forward from MC-2. It is additive, lane-only and unmerged, with no backfill. No stored result is rewritten.

## COPY
None.

## D-060
- **Metric catalogue: bumped to MC-3.** The migration changes what two metric calculations return (D-060 (a)). MC-3 is MC-2 copied forward:
  - the definitions and readiness tiers, as `publish_metric_catalogue` copies them;
  - the question-health thresholds and the declared sources, which `20260923110000` found MC-2 also needed.
- Every minimum sample, audience, label, meaning, scope, visualization, threshold and source is identical. The migration's terminal check and F06-P23 both assert it.
- MC-2 is unchanged (D-060 (e)).
- **Engine:** `engine_version` is unchanged, because nothing here grades, assembles or finalizes.

## QUESTIONS
None. As the board says, the Daisy follow-up is not in this ticket: once figures appear, the teacher's rows need objective names, as UX-26 gave the learner.

## READY
Yes.

---
### Summary (ready to paste)
```
BOB-37 (7c6657d), ready for the gate in CI #240 (run 36639112983) on 0fd83f7.
Migration 20261025100000: calc_class_topic_mastery and calc_institution_competency_outcomes average each learner's
recorded penguasaan from the {benar, total, penguasaan} objects the scoring writes (they kept only bare numbers, so both
always answered nothing). Output shapes unchanged; no stored result rewritten. D-060: catalogue bumped to MC-3, MC-2
copied forward with every definition, minimum sample and audience identical; engine unchanged.
F06-P23 red on today's code (have 0 with five learners; school outcomes empty; MC-2 live), green now (0.55 / 0.625,
the average of recorded penguasaan, not pooled 0.5); minimum sample unchanged (4 learners below 5). Gate db-bob37-gates
(3 plants). Tripwires 131; db-bob39-gates control 35.
```
