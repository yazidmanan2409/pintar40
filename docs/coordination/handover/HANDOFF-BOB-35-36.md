# Bob → coordinator: BOB-35 and BOB-36 (4.0 reproducibility defects, one CI run)

**SHA:** `ae7d9a5` (code), on top of BOB-24's hand-off `57c4312`. `main` is still `73c0be5`, merged in as `d823bc9`.
- **BOB-35:** `ba161bb`, its own commit.
- **BOB-36:** `ae7d9a5`, its own commit.
- **Manifest:** v118. BOB-35 took 117 and BOB-36 took 118; you set the final number. The manifest holds 425 ids: BOB-24's 423, plus F05-T14b and F04-T04d.
- **One `ci.yml` run for both:** @@CI@@.
- **Built after BOB-24's CI #230 was dispatched,** as ruled, and exactly to your ruling of 29 Sep.

## CHANGED

### BOB-35: a corrected-release move never leaves mixed provenance (INV-04, INV-29)
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

### BOB-36: a launched Uji Cepat keeps its rules (INV-29)
**The invariant (Yazid, 29 Sep), stated in the migration's header:**
> Once any assessment session references an ad-hoc/Uji Cepat definition, fields that affect historical interpretation or verdict must no longer be mutable in place. Subsequent changes require an appropriate new definition/version rather than rewriting history.

**Migration `20261023100000_a_launched_quick_assessment_keeps_its_rules.sql`** (the 129th): one BEFORE UPDATE trigger on `assessment_definitions`, `assessment_definitions_quick_rules_fixed`.
- **When it refuses.** When `OLD.is_ad_hoc` is true and any `assessment_sessions` row cites the definition, a change to any of INV-29's twelve interpretive fields is refused with **PR061 `QUICK_RULES_FIXED`**. This applies to **every role, the owner included**.
  - The twelve fields are `save_assessment_definition`'s list: mode, bank_type, item_count, difficulty_mix, safety_critical_minimum, passing_rules, shuffle_policy, hesitation_window_seconds, allows_pause, offline_tolerant, late_sync_grace_seconds and attempt_limit.
- **The status changes that legitimately continue: none.** An Uji Cepat is created at INGESTED by `launch_quick_assessment`, and no product path moves it on: the Studio's status steps select `is_ad_hoc = false`, and nothing else writes an Uji Cepat definition's status. So once it has been sat, its status is held too, with the same code.
- **What does continue:** the title (the Studio's rename) and the review fields.
- **Before its first session,** an Uji Cepat definition stays editable.
- **Deletion once sat** is already refused by the sessions' foreign key; the test shows it.
- **SECURITY DEFINER existence check,** so a teacher's own row-level view of sessions cannot decide whether history exists.
- **Nothing else changes:** no grant is revoked, nothing is backfilled, and a definition that is not ad hoc is never read by the trigger, so the drafting path is untouched. `launch_quick_assessment`, BOB-32's codes and BOB-33's title are unchanged.

### D-060
Neither change touches grading, paper assembly, drawing or a metric: `eligible_items_for_definition`, `assemble_session`, the scoring functions and the metric catalogue are untouched. So **neither the metric catalogue version nor `engine_version` was bumped.**

BOB-35 changes which definition a moved assignment names, and that was always the target release's own. BOB-36 only refuses writes.

## PROOF

**Red on today's code** (a database at `57c4312`'s 127 migrations, with the final tests):
```
F04-T04d  an edit after the sitting changed the finished session's verdict from true to false; after a session
          exists the teacher rewrote in place: passing_rules, mode, bank_type, item_count, difficulty_mix,
          safety_critical_minimum, shuffle_policy, hesitation_window_seconds, allows_pause, offline_tolerant,
          late_sync_grace_seconds, attempt_limit, status; the owner rewrote a sat Uji Cepat's passing_rules
F05-T14   a release was moved after a learner had started under the assignment; the refused move changed the
          started assignment anyway; a refused move left a move row; the cycle's POST_TEST assignment still names
          the v1.0 definition; learning_cycle still names the v1.0 definition; the move wrote no audit row naming the cycle
F05-T14b  the session records v1.1's release but was assembled from the v1.0 course's definition; 6 of 6 presented
          item(s) come from another course than the release the session records (a certificate would cite v1.1 for
          v1.0 items); a session citing v1.1's release with v1.0's definition was inserted; a move to a release with
          no cycle definition was accepted; 1 session(s) in this database record a release whose course is not their items' course
```
**Green with both migrations**, and every other DB row stays green (256 of 256).

**The tests, against your list:**
- **F05-T14b (new): the reproduction.**
  1. v1.0 is assigned afresh and moved to v1.1 before anyone starts.
  2. A learner starts. The session's release, its definition and all its presented items are v1.1's, so `certificate_prepare` cites what was sat.
  3. A **direct mixed INSERT** (the same session with v1.0's definition) is refused `SESSION_RELEASE_MISMATCH`.
  4. A target with no cycle definition refuses the move: v1.1's POST_TEST definition is taken out of APPROVED for this one check, and that is undone.
  5. The **closure query** runs, see below.
  6. **Prior rows are untouched:** a digest of every session, presented item, result and certificate under the started assignment is identical before and after.
- **F05-T14, restated for (c), a changed requirement.**
  - It used to move an assignment a learner had finished under. That move is now refused `RELEASE_MOVE_STARTED`, and nothing moves: not the release, the course, a move row or the history.
  - **A move before any start** moves the assignment, its course and its cycle's POST_TEST definition to v1.1's own. It writes one move row with `learners_left_in_place` 0 and an audit line naming the cycle.
  - The lineage refusals are kept.
- **F04-T04d (new).**
  - A learner finishes a launched Uji Cepat. The teacher's direct `passing_rules` edit, the other eleven fields and status are each refused `QUICK_RULES_FIXED`, and the finished verdict stays.
  - **The owner is refused too**, and **deletion** is refused by the foreign key.
  - The session and result are unchanged, the title can still be corrected, and an Uji Cepat nobody has sat is still editable.
- **Both tests undo what they create,** so the suites rerun clean. F04-T04d is its own function, `selftest.f04_quick_rules`, called by `run_fable04` and by the gate suite `run_bob36`.
- **Unaffected and green:** F04-T04 and F04-T04c (BOB-33), BOB32-K01, fable04, the move tests (F05-T14, and fable02's), the learning-cycle suite (fable13), the certificate tests and the F-series.

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

**Plants, two new gates:**

| plant | gate | defect | red |
|---|---|---|---|
| bob35-1 | db-bob35-gates (`run_fable05`, control 23) | the root check lets everything through | F05-T14b a session citing v1.1's release with v1.0's definition was inserted |
| bob35-2 | db-bob35-gates | the move leaves the cycle behind | F05-T14 the cycle's POST_TEST assignment still names the v1.0 definition |
| bob35-3 | db-bob35-gates | a started cycle is moved | F05-T14 a release was moved after a learner had started under the assignment |
| bob35-4 | db-bob35-gates | a target with no cycle definition is moved to | F05-T14b a move to a release with no cycle definition was accepted |
| bob36-1 | db-bob36-gates (`run_bob36`, control 1) | the trigger lets every edit through | F04-T04d an edit after the sitting changed the finished session's verdict from true to false |
| bob36-2 | db-bob36-gates | only the pass mark is held | F04-T04d after a session exists the teacher rewrote in place: mode, bank_type, … |
| bob36-3 | db-bob36-gates | the owner is exempt | F04-T04d the owner rewrote a sat Uji Cepat's passing_rules |

`ci.yml`'s red-case matrix gains `db-bob35-gates` and `db-bob36-gates`, with the same harness and four proofs.

**Restated for the changed requirement:** UX1-BRAND-02 and UX1-TUR-ORANG-01, the migration tripwires, move 127 → 128 (BOB-35) → 129 (BOB-36), with the reasons beside them. There is no table, column or mark, and no tour RPC.

**Local, every database with an `en-US` ICU collation, on `ae7d9a5`:**
- **Full suite, fresh database, clean build:** 393 passed, 0 failed, 31 justified skips.
  - Passed: F05-T14, F05-T14b, F04-T04, F04-T04c, F04-T04d, BOB32-K01, F06-P19, F06-P20, F06-P21, F06-S01, and both tripwires at 129.
  - One unjustified skip, UX1-PIMPINAN-AKSES-01 (network), as before.
- **Plants:** 121 of 121 proved their gate on a copy taken straight after the seeds. That is 114, plus bob35-1..4 and bob36-1..3.
- **Shared red cases:** all 19 gates, `db-bob35-gates` and `db-bob36-gates` included, exited 0 on one shared stack, and so did the older heredoc gates `db-fable04-gates` and `db-fable05-gates`. The schema digest stayed the same, and every recheck was 256 of 256.

## CI
@@CIDETAIL@@

## CONTRACT
- **New refusals**, stable codes in DETAIL:
  - **PR060** `SESSION_RELEASE_MISMATCH`: any session insert.
  - **PR060** `RELEASE_MOVE_STARTED` and `RELEASE_MOVE_NO_CYCLE_DEFINITION`: `move_learning_assignment_release`.
  - **PR061** `QUICK_RULES_FIXED`: a direct update of a sat Uji Cepat definition.
- **`move_learning_assignment_release`:** same signature and grants. On success it now also repoints the cycle, and its audit line carries `cycle`.
- **No new client RPC.**

## MIGRATIONS
`20261022100000` and `20261023100000`, both additive: two trigger functions, two triggers, and one function redefined. Both are lane-only and unmerged, with no backfill and no rewrite. The seeded database holds no session that (a) would have refused.

## COPY
None in this change (D-014). One thing for Daisy: in the Studio, `moveReleaseAction` passes a refusal through `kodeGalat`, so the two new move refusals reach the page as ACTION_FAILED with a logged reference. A sentence of their own ("a learner has already started: assign it afresh"; "that version has no post-test yet") would need codes in `galat-kontrak.ts` and copy in `hle.ts`, which are Daisy's. No learner-facing path can reach `SESSION_RELEASE_MISMATCH` once the move carries the cycle.

## QUESTIONS
1. **The copy above:** should the Studio name the two move refusals (a DAISY ticket), or is ACTION_FAILED with a reference acceptable for 4.0?

## READY
Yes, for the one `ci.yml` run for both, then your one audit at the gate.

---
### Summary (ready to paste)
```
BOB-35 and BOB-36 (4.0 reproducibility defects), ready for the gate; one ci.yml run for both.
Code at ae7d9a5 (BOB-35 ba161bb, BOB-36 ae7d9a5), on top of BOB-24's 57c4312; main 73c0be5. Manifest v118 (you set the final).
- BOB-35, migration 20261022100000:
  (a) a session INSERT whose release isn't its definition's course is refused, PR060 SESSION_RELEASE_MISMATCH;
  (b) the move repoints PRE/POST to the target's cycle definitions, or is refused RELEASE_MOVE_NO_CYCLE_DEFINITION;
  (c) the move is refused once any session exists, RELEASE_MOVE_STARTED.
- BOB-36, migration 20261023100000: once a session cites an Uji Cepat, its 12 INV-29 fields are fixed for every role
  (PR061 QUICK_RULES_FIXED), and its status too, since no status change continues. The title and an unsat definition
  stay editable; deletion is refused by the FK.
- Red on today's code: F05-T14b (6/6 items from v1.0 under v1.1), F04-T04d (verdict true -> false), F05-T14. Green with both.
- Restated: F05-T14 for (c); fable06 fixtures wp6_pd_session and wp6_evidence_session, which built mixed-provenance sessions.
- Closure query: 0 sessions whose release's course differs from their items'.
- Local: suite 393/0; plants 121/121 (db-bob35-gates 4, db-bob36-gates 3); shared 19 gates, recheck 256/256.
- D-060: no grading, assembly, drawing or metric change; catalogue and engine_version unchanged.
- Question: the two move refusals show as ACTION_FAILED with a reference in the Studio (codes and copy are Daisy's).
```
