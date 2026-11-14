# Sharon's Monday handover: A2a change C

Written Sat 14 Nov 2026, 08:30 UTC, at the owner's weekend shutdown. Branch `claude/gracious-lamport-0m1qjr`.

## Verified state

- **Everything on `claude/a2a-change-c` up to `a6ce33e7c9b5c8d8797d78c5d2b4f8efad5c6361` is read. Nothing is open as a blocker.**
- **The chain of verdicts, in this folder:**
  - `A2A-C-T01-768eb032`;
  - `A2A-C-DRAFTS-e076520c`;
  - `A2A-C-DRAFTS-6-8-c3cbe3c4`;
  - `A2A-C-BEFORE-FREEZE-8bc74097`, with its 04:50 addendum;
  - `A2A-C-11-14-35ee833a`;
  - `A2A-C-15-22-c3e88873`, with its addendum on the approved rules;
  - `A2A-C-C18-1-AND-23-28`;
  - `A2A-C-30-8cbda9cc`, with its addendum;
  - `A2A-C-32-ca063fb3`;
  - `A2A-C-37-a6ce33e7`;
  - `A2A-C-33-36-a6ce33e7`.
- **Closed:** B1, R1, R2, C7-1, C7-2, C7-3, C9-1, C9-2, C10-1 (with K1 and K2), C15-1, N1, C17-1, C18-1 (in development), C19-1, C30-1 (my false alarm) and C30-2.
- **Change A** is merged (`0ea4b8ad`). Its result review was a PASS at `2cea0564`.

## The result review of C's frozen candidate (Bob names the commit Monday)

**First, the diff `a6ce33e7..<frozen>`:** anything after my last read is read in full.

**Then the whole of C against `0ea4b8ad`, checking each approved rule against the code, not only that the tests pass:**
1. **The fence:**
   - two functions with `SET lock_timeout`, taken only inside the database (A2A-F01);
   - B1 (the fence before the window row), and the `kind` invariant;
   - required change 3 (persons and accounts before the fence);
   - C19-1 (the evaluator before the shared fence).
2. **One instant for EMERGENCY:** the hook, protection and marking judge "affected" at `T_stop`. REG-A2A-09, the join refusal, stays unbuilt.
3. **The hold and the shift:**
   - the holding window recorded on the sitting;
   - the chain judged as of each window's `T_stop`;
   - one grace helper;
   - no marking at the lift;
   - the credit given once, under the watermark;
   - D1 (the pending credit inside `pengerjaan_tenggat_efektif`, and every HARUS reader reading through it or after a touch);
   - C30-2's composition with A1's hold.
4. **The writers:**
   - every writer of a sitting goes through `pengerjaan_pagar` first (A2A-C702);
   - first-touch release and credit;
   - the refusals: SITTING_CLASS_STOPPED, SITTING_FENCE_BUSY, ASSIGN_CLASS_STOPPED, PROMO_STOPPED, and the reschedule refusal.
5. **The closer:** small committed batches under the fence, with held and protected sittings excluded (R1, R2). The search_path exception is enforced (A2A-C714).
6. **The lock order:**
   - A2A-L01 is green, and every exception is named;
   - C9-2's single exception covers exactly seven functions, with its condition asserted;
   - (a): no lifecycle row after the fence, except the two mechanical cases.
7. **Readers:** A2A-T01's table is complete, A2A-C708's structural rule holds, and Daisy §3's separate read stands.
8. **Privileges:** every new function revoked from PUBLIC, and from `anon` and `service_role` where it is internal; client RPCs registered with a body check.
9. **The defect table:** each defect caught in development or in acceptance, and whether it could reasonably have been anticipated, as in my change A review.

**Change B (the scale job, scenario 8) must show these, on C's frozen commit:**
- the lift's work under the exclusive fence ≤ 0.5 s, **with no marking batch run before the lift** (50,000 affected sittings);
- the release batch's credit throughput;
- the cost per call of D1's pending-credit read, in the hook's or the player's path;
- and the page's existing numbers:
  - R1's skip count;
  - R2's 5 s at p95;
  - the activation's work ≤ 0.5 s;
  - the shared takers refused while the exclusive side waits, counted. (My 2.0 s correction: they are refused, not delayed by 0.5 s.)
- I also read B itself: its early read and its review.

**At promotion, Bob's eight hosted reads** (listed with their expected answers in `A2A-C-BEFORE-FREEZE-8bc74097.md` §2(c)), read-only, as a stop condition:
1. the cron job, its owner and its command;
2. the procedures' owner;
3. the job's runs;
4. no client or `service_role` EXECUTE;
5. the fence's `SET` clauses;
6. the triggers' mode is O;
7. the roles, and `session_replication_role`;
8. no open EMERGENCY window without `t_stop`.

**Add:** `pg_cron` is present wherever the lint runs (A2A-C714 reads `cron.job`).

## Open, not blocking

- **Register:**
  - REG-A2A-01 (two enrolments at once);
  - REG-A2A-02 (the permit's `KEY SHARE` first);
  - REG-A2A-03 (`FOR NO KEY UPDATE`);
  - REG-A2A-04 (row 4's race);
  - REG-A2A-05 to -07 (C2's list);
  - REG-A2A-09 (the join refusal);
  - a guard-marker note: a direct table write by `service_role` could clear a hold without a shift.
- **To confirm in the result review:**
  - O1's rule for a departure's sitting preserved through a stop, after the lift. On the page as "still to build" at commit 12; check that it was built.
  - The note that the header of change A's migration `20270118100000` says "Not reached today", which is wrong. The correction belongs on the page and in the next migration that touches `recovery_assist_school`.
- **A2b:** my early read (`A2B-EARLY-READ-d711d4b2.md`) lists five page items, carried before A2b's build.
- **Daisy:** her screens and words are hers. I review only what touches a lock, a privilege or a decision.
