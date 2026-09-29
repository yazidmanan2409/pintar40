# Bob → coordinator: BOB-35 (a corrected-release move never leaves mixed provenance)

**SHA:** `ba161bb`, its own commit, then the gate's fix round `91d0cb6` and its test fixture `c0d82c3`. The lane head is `c0d82c3`. `main` `9e72564` (DAISY-30) came in as `de588a4`, and `ffcd7dc` (DAISY-29) came in earlier as `9bad5e5`.
- **Manifest:** F05-T14b and F05-C01 (new), and F05-T14 restated. The lane's manifest is v120 with 429 ids (the union with `main`'s DAISY-30-TEKS-01), as you directed at the merge.
- **CI:** the lane-head run named in the next commit. It is the one run for the lane head, carrying BOB-24's fix, BOB-34, BOB-35 and BOB-36, and you gate the four as one integration with one audit.
- **Built** after BOB-24's first run was dispatched, exactly to your ruling of 29 Sep.

## CHANGED
**The invariant (Yazid, 29 Sep), stated in the migration's header:**
> The release/content provenance recorded for an assessment session and certificate must correspond to the content and assessment definitions actually used by that learner. A corrected-release move must never create mixed old/new provenance.

**Migration `20261022100000_a_session_is_one_course.sql`** (the 128th):
- **(a) At the root:** `assessment_sessions_release_is_its_course`, a trigger on **INSERT only** (SECURITY DEFINER, with a pinned search path).
  - A session whose `plp_release_id` is not a release of its definition's course (or of its module's course) is refused with **PR060 `SESSION_RELEASE_MISMATCH`**.
  - Existing rows are never re-validated or rewritten.
  - Every path that opens a session is held by it: the learning cycle, Uji Cepat, and any later one.
- **(b) The move carries the cycle.** `move_learning_assignment_release` is 20260915130000's body re-emitted, with two additions.
  - In the same transaction it repoints the cycle's PRE_TEST and POST_TEST `assessment_assignments` to the target release's cycle definitions. It selects them with `release_cycle_definition(to_release, mode)`, the selection `assign_release` uses.
  - `learning_cycle` is updated to name them.
  - If the target has no such definition, the move is refused with **PR060 `RELEASE_MOVE_NO_CYCLE_DEFINITION`**.
  - The audit line gains `cycle`: each mode's from and to definition.
- **(c) No move once the cycle has started.** If any session exists under the assignment (by its learning assignment or by its assessment assignments), the move is refused with **PR060 `RELEASE_MOVE_STARTED`**.
  - A row lock makes a start and a move take turns.
  - `learners_left_in_place` is therefore 0 by construction.
  - A correction after a class has started is a new assignment, not in this ticket.
- **Unchanged:** every earlier refusal, the lineage and owner widening, the move row and release pin, and the grants (`authenticated` only).

### Fix round (`91d0cb6`): (c) under concurrency, as the gate found
**The defect.** `start_learning_session` reads its assessment assignment and learning assignment with plain SELECTs, so the move's `FOR UPDATE` never made a start wait. The race ran like this:
1. The move locks the row and finds no session.
2. A start that already read the old release and definition inserts its session, and (a) passes it, because the row agrees with itself.
3. The move commits, leaving a pre-test on the old release under a cycle pointing to the new one (INV-24).

The comment claiming the lock made them take turns was not true.

**The fix, in `20261022100000` (in place, D-026), without re-emitting the start.** When a session names a learning assignment, `assessment_sessions_release_is_its_course` now:
1. takes **`FOR KEY SHARE`** on that row: the lightest lock that waits for the move's `FOR UPDATE`, and one concurrent starts share;
2. re-reads the assignment's current `plp_release_id` and the assessment assignment's current `assessment_definition_id`. The trigger is VOLATILE, so under READ COMMITTED those reads see a committed move;
3. refuses a session that no longer matches, with PR060 `SESSION_RELEASE_MISMATCH` (message: «the assignment moved to another release while this attempt was starting: start again»). The learner's retry starts on the new release.

In the other order, the start holds the lock and the move waits, then sees the session and refuses `RELEASE_MOVE_STARTED`. The comment is corrected.

**D-031, the cost on the start path:** one shared row lock and two primary-key reads per session. Starts never wait on each other. They wait only on a move in flight, which is rare and brief.

## D-060
The change touches no grading, paper assembly, drawing or metric: `eligible_items_for_definition`, `assemble_session`, the scoring functions and the metric catalogue are untouched. It changes which definition a moved assignment names, and that was always the target release's own. So **neither the metric catalogue version nor `engine_version` was bumped.**

## PROOF
**Red on today's code** (a database without `20261022100000`, with the final tests):
```
F05-T14   a release was moved after a learner had started under the assignment; the refused move changed the
          started assignment anyway; a refused move left a move row; the cycle's POST_TEST assignment still names
          the v1.0 definition; learning_cycle still names the v1.0 definition; the move wrote no audit row naming the cycle
F05-T14b  the session records v1.1's release but was assembled from the v1.0 course's definition; 6 of 6 presented
          item(s) come from another course than the release the session records (a certificate would cite v1.1 for
          v1.0 items); a session citing v1.1's release with v1.0's definition was inserted; a move to a release with
          no cycle definition was accepted; 1 session(s) in this database record a release whose course is not their items' course
```
**Green with the migration**, and every other DB row stays green (256 of 256).

**The tests, against your list:**
- **F05-T14b (new): the reproduction.**
  1. v1.0 is assigned afresh and moved to v1.1 before anyone starts.
  2. A learner starts. The session's release, its definition and all its presented items are v1.1's, so `certificate_prepare` cites what was sat.
  3. A **direct mixed INSERT** (the same session with v1.0's definition) is refused `SESSION_RELEASE_MISMATCH`.
  4. A target with no cycle definition refuses the move: v1.1's POST_TEST definition is taken out of APPROVED for this one check, and that is undone.
  5. The **closure query** runs, see below.
  6. **Prior rows are untouched:** a digest of every session, presented item, result and certificate under the started assignment is identical before and after.
  - It undoes what it creates, so the suite reruns clean.
- **F05-T14, restated for (c), a changed requirement.**
  - It used to move an assignment a learner had finished under. That move is now refused `RELEASE_MOVE_STARTED`, and nothing moves: not the release, the course, a move row or the history.
  - **A move before any start** moves the assignment, its course and its cycle's POST_TEST definition to v1.1's own. It writes one move row with `learners_left_in_place` 0 and an audit line naming the cycle.
  - The lineage refusals are kept.
- **F05-C01 (new, fix round): the race** (`runMoveStartRace` in `run.ts`, with fixture `selftest.f05_race_fixture`).
  1. A move is held open with `pg_sleep` after locking the assignment and finding no session.
  2. A learner starts against it.
  3. Then the move commits.
  - **Red on the trigger before the fix:** `1 session(s) under the moved assignment cite the release it moved from (a pre-test and post-test could come from two releases)`.
  - **Green now:** the start waits, is refused `SESSION_RELEASE_MISMATCH`, and no session cites the old release. It was green on consecutive runs.
  - **Its fixture builds its own target** (`c0d82c3`, test-only).
    - The first version reused the v1.1 revision `run_fable05` leaves behind. But the suites after fable05 withdraw School A's canonical grants (QAC-T03 does), so in the full proof on `de588a4` it failed at its fixture: `no published v1.1 revision distributed to School A`. CI would have failed the same way.
    - `f05_race_fixture` now restores the v1.0 grant if it was withdrawn, and takes v1.1 from `selftest.f05_published_revision`. That helper reuses a published revision and restores its grant, or else makes one and walks it to PUBLISHED as F05-T14's setup does.
    - Checked after the QAC and EVAL suites: green twice, and red on the pre-fix trigger.
- **F05-T14b gains two deterministic cases (fix round):**
  - A session that agrees with itself (v1.0's release and definition) but cites the release its assignment has moved from is refused.
  - A mixed session **outside any assignment** (the Uji Cepat path) is refused. Only the root course check can catch it, so plant bob35-1 now reads it.
- **Unaffected and green:** the move tests (F05-T14, and fable02's), the learning-cycle suite (fable13), the certificate tests and the F-series.

**Restated fixtures (a changed requirement):** fable06's `wp6_pd_session` and `wp6_evidence_session`.
- They copied a real session onto another course's release (the professional-development one) and kept its definition. That is exactly the mixed provenance (a) now refuses, and F06-P19, P20 and P21 went red at insert.
- Through the new `wp6_definition_for`, they now cite a definition of the release's own course, the template's copied field for field. Every figure those tests read is what it was.

**The closure query (BOB-35)**, run over the proof database after the full suite:
```sql
select count(distinct ss.id)
  from public.assessment_sessions ss
  join public.plp_releases r on r.id = ss.plp_release_id
  join public.presented_items pi on pi.session_id = ss.id
  join public.items i on i.id = pi.item_id
  join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
 where m.course_id <> r.course_id;
```
- **0 rows.** The proof database holds 8 committed sessions with presented items (most suites roll back), and none records a release whose course is not its items' course.
- The same check run on the definition, a session whose definition's course is not its release's course, is also **0 of 8**.
- Inside F05-T14b, the query runs again while that run's own sessions still exist, so it covers the moved learner's session too. It returns 0 with the migrations, and 1 without them (the reproduced session).

**Plants, a new gate** `db-bob35-gates` (`run_fable05`, control 23), five plants since the fix round:

| plant | defect | red |
|---|---|---|
| bob35-1 | the root check lets everything through | F05-T14b a session outside any assignment citing v1.1's release with v1.0's definition was inserted |
| bob35-2 | the move leaves the cycle behind | F05-T14 the cycle's POST_TEST assignment still names the v1.0 definition |
| bob35-3 | a started cycle is moved | F05-T14 a release was moved after a learner had started under the assignment |
| bob35-4 | a target with no cycle definition is moved to | F05-T14b a move to a release with no cycle definition was accepted |
| bob35-5 | a start that raced the move is kept (no re-read) | F05-T14b a session citing the release its assignment moved from was inserted |

`ci.yml`'s red-case matrix gains `db-bob35-gates`.

**Restated for the changed requirement:** the migration tripwires (UX1-BRAND-02 and UX1-TUR-ORANG-01) move 127 → 128, with the reason beside them. There is no table, column or mark.

**Local, on the lane head `c0d82c3`:** every database is built with an `en-US` ICU collation, and with Supabase's default privileges emulated (see BOB-24's CI section):
- **Full suite, fresh database, clean build:** 397 passed, 0 failed, 31 justified skips. The one unjustified skip is UX1-PIMPINAN-AKSES-01 (network), as in every proof before.
  - F16-I01..N01, F16-C01..C03, F05-C01, BOB34-K01, BOB32-K01, F05-T14, F05-T14b, F04-T04, F04-T04c, F04-T04d, F06-N02, F06-P19..P21, F06-S01 and DAISY-30-TEKS-01 all passed.
  - Both migration tripwires passed at 129.
- **Plants:** 123 of 123 proved their gate on a copy taken straight after the seeds. That includes db-bob24-gates 14, db-bob35-gates 5 and db-bob36-gates 4.
- **Shared red cases:** all 19 gates exited 0 on one shared stack. The schema digest stayed the same, and every recheck was 256 of 256.
- **BOB-35's closure query over the proof database:** 0 of 8 committed sessions with items.

## CI
- **the lane-head run named in the next commit**, `workflow_dispatch` on `claude/quirky-meitner-a04smj` at the commit carrying these hand-offs. That commit is docs only; the code is at `c0d82c3`.
- **The previous run, CI #235** (run `36551388380`, on `d4e4ce6`, code `9bad5e5`), was **green**. It is superseded by the gate's fix round for BOB-35 (`91d0cb6`) and BOB-36 (`ec0f65c`), and by the DAISY-30 merge.
- It is the one run for BOB-24's fix, BOB-34, BOB-35 and BOB-36, as directed.
- The red-case matrix carries `db-bob24-gates`, `db-bob35-gates` and `db-bob36-gates`.
- I don't poll it: you read it at the gate.

## CONTRACT
- **New refusals**, stable codes in DETAIL:
  - **PR060** `SESSION_RELEASE_MISMATCH`: any session insert.
  - **PR060** `RELEASE_MOVE_STARTED` and `RELEASE_MOVE_NO_CYCLE_DEFINITION`: `move_learning_assignment_release`.
- **`move_learning_assignment_release`:** same signature and grants. On success it now also repoints the cycle, and its audit line carries `cycle`.
- **No new client RPC.**

## MIGRATIONS
`20261022100000`, additive: one trigger function and trigger, and one function redefined. It is lane-only and unmerged, with no backfill and no rewrite. The seeded database holds no session that the new check would refuse.

## COPY
None, as ruled.
- The two move refusals reach the Studio's «Koreksi» form as ACTION_FAILED with a reference. They get their own sentences in DAISY-31.
- `SESSION_RELEASE_MISMATCH` stays ACTION_FAILED, as ruled. Since the fix round, one product path can reach it: a learner who presses start in the moment a class's release is being moved. That learner sees the generic failure once, and the retry starts on the new release. No copy is added; if you want a sentence for it, it would go with DAISY-31.

## QUESTIONS
None.

## READY
Yes, in the one run on the lane head, gated with BOB-24, BOB-34 and BOB-36.

---
### Summary (ready to paste)
```
BOB-35 (ba161bb + fix round 91d0cb6), ready for the gate in the lane head's run (the lane-head run named in the next commit) with BOB-24, BOB-34 and BOB-36.
Migration 20261022100000:
  (a) a session INSERT whose release isn't its definition's course is refused, PR060 SESSION_RELEASE_MISMATCH;
  (b) the move repoints PRE/POST to the target's cycle definitions, or is refused RELEASE_MOVE_NO_CYCLE_DEFINITION;
  (c) the move is refused once any session exists, RELEASE_MOVE_STARTED;
      fix round: a starting session takes FOR KEY SHARE on its assignment and re-checks its current release
      and definition, so a start that raced a move is refused SESSION_RELEASE_MISMATCH (F05-C01 red, then green).
Red on today's code: F05-T14b (6/6 items from v1.0 under v1.1) and F05-T14; green now.
Restated: F05-T14 for (c); fable06 fixtures wp6_pd_session and wp6_evidence_session (they built mixed-provenance sessions).
Closure query: 0. Gate db-bob35-gates, 5 plants. D-031: one shared row lock and two PK reads per start. D-060: no grading, assembly, drawing or metric change.
```
