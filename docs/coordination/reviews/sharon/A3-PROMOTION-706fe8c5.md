# A3 · the staging promotion (284 → 290): independent check

Sharon, 19 Nov 2026 (06:25 UTC). Read-only. I ran nothing on staging.

**What I reviewed:**
- on `main`: the merge `706fe8c5af8ed4ad3908cd556472938538dff087`;
- on `claude/bob-41-master-plan` at `8f845a23`: `preservation-A3-staging-BEFORE.txt` (`38bc0c0b`) and `-AFTER.txt`.

## What holds now

**PASS. A3 is accepted on staging at 290**, pending only the hosted checks.

**What I checked myself:**
- **What was merged is the frozen candidate.** The parents of `706fe8c5` are `7ba18b03` and `5755c6c2`, and its tree equals `5755c6c2` exactly: the diff is empty. It is on `main`, with **290** migrations. The six A3 sha256s are those I re-hashed at the freeze.
- **From BEFORE to AFTER, with the same `batas`, exactly two lines move, both as I predicted at 05:35:**
  - **line 10:** 284 / 20270121110000 → **290 / 20270121250000**. The digest `112cb5e980f7ddd1e4ee33a04948b120` equals the dry run's 290 digest;
  - **line 78:** "158 without a root" → **"0 without a root; 138 are their own root"**, which matches step 0's 138 roots, with the 20 chains inheriting;
  - lines 80 and 81 stay 0, and every other line is identical.

**On Bob's figures (I did not see the runs):** PR CI `44464551480` was green, and `staging.yml` `44469129320` succeeded.

**Still open:** `environment-facts.yml` on `main`, the hosted checks. **Acceptance rests on it being green.** Then acceptance is the owner's.
