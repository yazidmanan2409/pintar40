# C2w · the staging promotion: independent check

Sharon, 18 Nov 2026 (09:30 UTC). Read-only. The same check as A2b's (`A2B-PROMOTION-1b1cada8.md`). I ran nothing on staging.

**What I reviewed:**
- on `main`: the merge `7ba18b03b47ec78f61b0e66cf1f11f1a4044534a`;
- on `claude/bob-41-master-plan`: `preservation-C2w-staging-BEFORE.txt` (`d688c7c7`) and `-AFTER.txt` (`5f18b25b`), and A2b's `preservation-A2b-staging-AFTER.txt`.

## What holds now

**PASS. C2w is accepted on staging at 284.** Two notes, neither a finding against the promotion.

**What I checked myself:**
- **What was merged is what I passed.**
  - The tree of `7ba18b03` equals that of `b57d897a` (`b26035ed…`).
  - `git diff --stat aa5f5741 b57d897a` is exactly one file, `docs/completion-4.1/batches/C2W-MERGE-HEAD.md` (8 lines), so the frozen candidate I passed is unchanged.
  - `7ba18b03` is on `main`, with **284** migrations, the last being `20270121110000`.
  - Its sha256 is `54b6569d…196`, the one I hashed for the candidate.
- **The before-read is continuous with A2b's after-read.** Lines 11–62 are identical wherever both reads have them (39 lines, 0 differ), and line 10 is identical (282, digest `a5b762d4…`). Nothing preserved moved between the two promotions.
- **From before to after, only line 10 moves:** 282 / 20270120240000 → **284 / 20270121110000**.
  - The versions digest goes `a5b762d4…` → `1374521acd2befd00c9d9e0f60ee7559`. That is the same 284 digest as the local dry run I passed (`210cc98e`).
  - Every other line is unchanged. Lines 65–68 read 0, 0, 0 and 0 on both reads.
- **The query:**
  - `preservation-C2w.sql` at `dfa542ab` (sha256 `1b686345…`), as the headers state;
  - the BEFORE read had `batas` null, and the AFTER read had the BEFORE's printed values (`2026-11-18 07:54:50.034681+00`, 10697);
  - both reads were read-only.

**On Bob's figures (I did not see the runs):**
- PR CI `44267902485` was green on `b57d897a`;
- `staging.yml` `44272691283` succeeded;
- `environment-facts` `44273100341` succeeded;
- pg_cron job 5 succeeded at 09:05 and 09:10 UTC, and job 6 is active.

**Notes:**
1. **Lines 65–68 are vacuous on staging:** staging holds no `release_distributions` rows. My P1 (line 68) is therefore proved by the local dry run's plants (`210cc98e`), not by staging itself. That is enough for this promotion. Say so in the acceptance, so nobody reads 0 as a test passed on staging data.
2. **The AFTER file's header has a truncated line:** "Run by Bob, 18 Nov 2026," ends with no time. It is cosmetic. Fix it in a follow-up commit; the data lines must not be touched.

**Still the owner's:** acceptance as he defines it. Nothing about production is implied.
