# Bob → coordinator: BOB-36 (a launched Uji Cepat keeps its rules)

**SHA:** `ae7d9a5`, its own commit. The lane head is `9bad5e5`, with `main` `ffcd7dc` (DAISY-29) merged in as `9bad5e5`.
- **Manifest:** F04-T04d (new). The lane's manifest is v119 with 427 ids, as you directed at the merge.
- **CI:** CI #235 (run `36551388380`, https://github.com/yazidmanan2409/pintar40/actions/runs/36551388380) on `d4e4ce6`. It is the one run for the lane head, carrying BOB-24's fix, BOB-34, BOB-35 and BOB-36, and you gate the four as one integration with one audit.
- **Built** after BOB-24's first run was dispatched, exactly to your ruling of 29 Sep.

## CHANGED
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

## D-060
The change touches no grading, paper assembly, drawing or metric: it only refuses writes. So **neither the metric catalogue version nor `engine_version` was bumped.**

## PROOF
**Red on today's code** (a database without `20261023100000`, with the final tests):
```
F04-T04d  an edit after the sitting changed the finished session's verdict from true to false; after a session
          exists the teacher rewrote in place: passing_rules, mode, bank_type, item_count, difficulty_mix,
          safety_critical_minimum, shuffle_policy, hesitation_window_seconds, allows_pause, offline_tolerant,
          late_sync_grace_seconds, attempt_limit, status; the owner rewrote a sat Uji Cepat's passing_rules
```
**Green with the migration**, and every other DB row stays green (256 of 256).

**The tests, against your list:**
- **F04-T04d (new).**
  - A learner finishes a launched Uji Cepat. The teacher's direct `passing_rules` edit, the other eleven fields and status are each refused `QUICK_RULES_FIXED`, and the finished verdict stays.
  - **The owner is refused too**, and **deletion** is refused by the sessions' foreign key.
  - The session and result are unchanged, the title can still be corrected, and an Uji Cepat nobody has sat is still editable.
  - It is its own function, `selftest.f04_quick_rules`, which undoes what it creates. `run_fable04` calls it, and so does the gate suite `run_bob36`.
- **Unaffected and green:** `launch_quick_assessment`, BOB-32 (BOB32-K01), BOB-33 (F04-T04c), F04-T04 and the rest of fable04.
  - A repeat run of `run_fable04` committed within the same clock minute trips F04-T04c. That comes from F04-T04's own two launches and predates this change. It is why the plant gate runs T04d alone.

**Plants, a new gate** `db-bob36-gates` (`run_bob36`, control 1):

| plant | defect | red |
|---|---|---|
| bob36-1 | the trigger lets every edit through | F04-T04d an edit after the sitting changed the finished session's verdict from true to false |
| bob36-2 | only the pass mark is held | F04-T04d after a session exists the teacher rewrote in place: mode, bank_type, … |
| bob36-3 | the owner is exempt | F04-T04d the owner rewrote a sat Uji Cepat's passing_rules |

`ci.yml`'s red-case matrix gains `db-bob36-gates`.

**Restated for the changed requirement:** the migration tripwires move 128 → 129, with the reason beside them.

**Local, on the lane head `9bad5e5`:** every database is built with an `en-US` ICU collation, and with Supabase's default privileges emulated (see BOB-24's CI section):
- **Full suite, fresh database, clean build:** 395 passed, 0 failed, 31 justified skips. The one unjustified skip is UX1-PIMPINAN-AKSES-01 (network), as in every proof before.
  - F16-I01..N01, F16-C01..C03, BOB34-K01, BOB32-K01, F05-T14, F05-T14b, F04-T04, F04-T04c, F04-T04d, F06-N02, F06-P19..P21 and F06-S01 all passed.
  - Both migration tripwires passed at 129.
- **Plants:** 121 of 121 proved their gate on a copy taken straight after the seeds. That includes db-bob24-gates 14, db-bob35-gates 4 and db-bob36-gates 3.
- **Shared red cases:** all 19 gates exited 0 on one shared stack. The schema digest stayed the same, and every recheck was 256 of 256.

## CI
- **CI #235 (run `36551388380`, https://github.com/yazidmanan2409/pintar40/actions/runs/36551388380) on `d4e4ce6`**, `workflow_dispatch` on `claude/quirky-meitner-a04smj` at the commit carrying these four hand-offs. That commit is docs only; the code is at `9bad5e5`.
- It is the one run for BOB-24's fix, BOB-34, BOB-35 and BOB-36, as directed.
- The red-case matrix carries `db-bob24-gates`, `db-bob35-gates` and `db-bob36-gates`.
- I don't poll it: you read it at the gate.

## CONTRACT
- **New refusal:** PR061 `QUICK_RULES_FIXED` on a direct update of a sat Uji Cepat definition, with the code in DETAIL.
- **No new client RPC,** and `launch_quick_assessment` is unchanged.

## MIGRATIONS
`20261023100000`, additive: one trigger function and trigger. It is lane-only and unmerged, with no backfill and no grant revoked.

## COPY
None, as ruled: `QUICK_RULES_FIXED` stays ACTION_FAILED, because no product path reaches it.

## QUESTIONS
None.

## READY
Yes, in the one run on the lane head, gated with BOB-24, BOB-34 and BOB-35.

---
### Summary (ready to paste)
```
BOB-36 (ae7d9a5), ready for the gate in the lane head's run (CI #235 (run `36551388380`, https://github.com/yazidmanan2409/pintar40/actions/runs/36551388380) on `d4e4ce6`) with BOB-24, BOB-34 and BOB-35.
Migration 20261023100000: once a session cites an Uji Cepat, its 12 INV-29 fields are fixed for every role, the owner
included (PR061 QUICK_RULES_FIXED), and its status too, since no status change continues. The title and an unsat
definition stay editable; deletion is refused by the FK.
Red on today's code: F04-T04d (verdict true -> false; all 12 fields and status rewritten); green now.
Gate db-bob36-gates, 3 plants. D-060: no grading, assembly, drawing or metric change.
```
