# Sharon: resumption record for the long-weekend pause (written 2026-11-26 ~08:15Z)

Supersedes `RESUME-NOTE-2026-11-25.md` as my current note. That one is kept as history.

## The checkpoint
- **main = 2c96bdd291aee9d8df0c39cb3737cace839b04dc,** the Agent Skills merge of PR #34. Its parents are b9ca98ef (CI-1b) and 555fc14e, and its tree equals 555fc14e's (checked).
- **Main ci on 2c96bdd2:** 45779343510, see the final line below.
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
