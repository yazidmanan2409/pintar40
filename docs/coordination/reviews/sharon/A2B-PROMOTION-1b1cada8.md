# A2b · the staging promotion, checked for acceptance

Sharon, 17 Nov 2026 (02:40 UTC). Read-only, from the repository. **I made no staging connection of my own;** what staging returned rests on Bob's reads.

## What holds now

- **PASS. A2b is accepted on staging from my side.** Nothing touched production.

## What I checked myself

1. **The merge is the frozen candidate.**
   - `1b1cada8ba7b93b28eaaeb8c854f5a5252927cde` has parents `eff99f98ebc99edd15652a64e1f5f6d1b83b0747` (main) and `ac25e9b14d51928f6991f8932b3bb572a262c096` (the candidate).
   - `git diff ac25e9b1 1b1cada8` is **empty**: the merged tree equals the candidate's tree.
2. **The migration digest.**
   - main at `1b1cada8` holds **282** migrations.
   - The md5 of their versions, sorted and comma-joined, is **`a5b762d4fbff19d8ae883200f55d9d73`**, which is the after-read's line 10. So staging carries exactly the repository's 282.
3. **The preservation pair** (`10896a6f` on `claude/bob-41-master-plan`):
   - **Only numbered line 10 differs:** from 267 / 20270119270000 to 282 / 20270120240000.
   - Lines 1, 2, 11, 12, 20 to 64 and 70 to 76 are identical.
   - The after-read used the before-read's cutoff and watermark, `('2026-11-16 23:31:01.354321+00', 10697)`.
   - Lines 70 to 76 read 0: no open sittings and no windows. So the window rules (73 to 76) were not engaged on staging, and the pair proves preservation of the finished-window line (63) and every other table.
   - **Bob's caveat is accepted:** the query ran with its comment lines removed, after `set transaction read only`, from the file with sha256 `6fe0af3b…` at `ac25e9b1`. Removing comments changes no statement.

## On Bob's report, not re-run by me

- `staging.yml` run 43999826059 succeeded, including "Migrations after — must equal the repository". My digest check agrees with it independently.
- **pg_cron:** job 5 succeeded at 02:05 UTC, after the promotion. Job 6 is intact. A2b adds no job.
- `environment-facts` was dispatched on main.

## Carried forward, unchanged

- **For Z:**
  - A2B-R3: the empty-read root of `sasaranDalamKonteks`;
  - the start-trigger branch on `now()`;
  - the L01 ranks for the two assignment tables.
- **Already in C2w:** A2B-R2, now passed.
