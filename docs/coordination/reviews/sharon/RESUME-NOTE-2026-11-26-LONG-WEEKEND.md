# Sharon: resumption record for the long-weekend pause (written 2026-11-26 ~08:15Z)

Supersedes `RESUME-NOTE-2026-11-25.md` as my current note. That one is kept as history.

## The checkpoint
- ~~**main = 2c96bdd291aee9d8df0c39cb3737cace839b04dc,** the Agent Skills merge of PR #34.~~ **main = a72203d80304ed0934f316682ee739653973218a** (the A1-S08 fix, PR #35, ruling 106, on top of the Agent Skills merge 2c96bdd2). Its parents are b9ca98ef (CI-1b) and 555fc14e, and its tree equals 555fc14e's (checked).
- **Main ci on 2c96bdd2:** 45779343510 concluded **failure**, so ~~the checkpoint is clean~~ ~~**the checkpoint is NOT clean**~~ the checkpoint was not clean at 2c96bdd2; **it is CLEAN at a72203d8** (see the end).
- **Staging:** at 311 (CI-2 closed on staging). **Production:** untouched at 111.
- **My branch:** `claude/gracious-lamport-0m1qjr`. All my records are pushed, with nothing uncommitted.

## Closed since the last note
- **CI-2 (L-78):** closed on staging (311). PR-22 stays open for production.
- **CI-1b (L-105):** FINAL PASS at 5cd81f9d, merged as b9ca98ef (ruling 104), main ci 45774017397 success. **Closed.** Record: `CI-1B-PREREVIEW-8126759c.md`.
- **Agent Skills:** confirmed at f83c8d50; 555fc14e content-identical; ci 45774171563 success; merged as 2c96bdd2. Record: `ENG-SKILLS-REVIEW-ecf2b5cc.md`.
- **IP protection:** PARKED until 4.1 is formally closed. The records are off-repo with the owner (the consolidated record, sha256 `5d799006d65026dd…`, plus Bob's Part C). **PR-26** (reassessment before every major release) is standing.

## Open for me on resumption, only on the owner's instruction
1. **AR-A (certificates), the pre-build review.** It is the first AR-79 batch, built by Second Eye from 2c96bdd2.
   - **What I review:** any change to an RPC contract, to what `verify_certificate` (the public check) reveals, or to the reissue/revoke panel.
   - **Binding text:** the AR-79 plan at 88ee3db8 and my records, which govern where they differ.
   - **Carry in:** the screen's unknown-review banner, which AR-A owns (CI-1b ledger).
2. **AR-B (L-112, PR-23), the pre-build review.** Binding text: `AUDIT79-L112.md` plus pre-review B1.
3. **Then each AR-79 batch in turn,** with a pre-build review wherever a database rule, an RPC contract or a confidentiality boundary is touched, and a verification after.
4. **The AR-79 ledger from CI-1b** (non-blocking):
   - the non-PDF fail-closed sweep;
   - journey.mjs's 65 swallowed waits (and about 77 in the other scripts);
   - the certificate-only static check;
   - F04-S04 (the harness DDL racing pg_cron);
   - CI-W54322 (the port clash);
   - DR-D02 «fetch failed».
5. **Standing carry-overs for production:**
   - 311 goes with or before any promotion that brings migration 221 or later (PR-22);
   - step 0s first, including L-155's production step 0 via readiness;
   - no MCQ_MULTI while production is at 111;
   - PR-23 gates any use on shared computers.

## During the break
- No development, reviews, merges or deployments; staging and production are untouched.
- The skills monitoring runs passively to 10 Dec.
- I escalate only an immediate, material security or operational incident.

## Standing rules
- Reviews are read-only. I don't query staging without the owner's authorisation in my own session.
- Run results come from the API conclusion, with the time read, written as "required: … green". I also check that the evidence tool was actually present (the B2J lesson).
- Superseded text is struck through, never deleted.
- Security-sensitive findings stay off the public repository.
- **Before escalating, I search the decisions log** (the D-143 lesson).

---
**Final line (read from the API at ~08:47Z):** main ci 45779343510 on 2c96bdd2 is status=completed, **conclusion=failure**, updated 08:38:17Z.
- **The failing job,** per Bob: «selftest contract», 1449 passed and 1 failed.
- **The failure:** A1-S08, a race between the test and the real pg_cron `*/5` job `pengerjaan_tutup_berkala`. It is the same family as F04-S04.
- **Why it is test-only and pre-existing:** 555fc14e, with the identical tree, passed (45774171563), and the test file is unchanged.
- **No rerun,** because a test body ran. Bob has escalated to the owner, and there is no fix or revert without the owner.
- **My read:** not a security or data incident; it is a test-reliability defect. On resumption, closing the checkpoint is the owner's call: an authorised rerun, or a test fix that pauses the job during A1-S08. I verify whichever is chosen.

---
**Checkpoint CLEAN (read from the API at ~10:56Z):**
- **main ci 45798622469 on a72203d8:** status=completed, **conclusion=success**, updated 10:49:02Z.
- **The merge:** a72203d8, with parents 2c96bdd2 and c3824c3a. **Its tree equals c3824c3a's** (checked with git).
- **PR ci 45792146106:** success (10:08:38Z), per Bob.
- **Closed:** A1-S08 (my record `A1-S08-FIX-c3824c3a.md`) and the Agent Skills implementation phase.
- **My two AR-79 ledger notes:** A1-S09 and DR-D02 can pass without exercising their race; a pause should refuse a non-local database.
- **The pause began at 10:51Z.** Development resumes only on the owner's instruction, starting with the AR-A pre-build.
