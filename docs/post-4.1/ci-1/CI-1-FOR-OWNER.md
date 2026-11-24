# CI-1 · for the owner's authorisation (Bob, 24 Nov 2026)

**What it fixes:** L-67 (Critical): a certificate could be publicly confirmed as «Berlaku · Lulus» on a result that had been recalculated to a fail. It was approved as a separate correction by ruling 97.

| | |
|---|---|
| **PR** | #30, `claude/ci-1` → `main`, frozen head **`94ce6727`** (parent `dfab09b6`: a test-only delta) |
| **Migration** | One: `20270125100000` (309 → 310), sha256 `2b450700…29e6` |
| **Acceptance runs** | ci **45439475500** GREEN; journeys **45441914637** GREEN, each in one attempt, on `94ce6727` |
| **Sharon** | **PASS, unconditional, on `94ce6727`** (`CI-1-VERIFY-dfab09b6.md`; the delta is a test-fixture fix, not a weakening, and both runs are green in one attempt) |
| **Daisy** | The refusal's words (`CI1-KATA.md`) are in the build |
| **Writes** | One metadata row (`client_rpc_registry`); no records written |

**What changes:**
- **The database refuses to confirm a certificate whose result in force no longer passes.** Only «Cabut» remains, and the refusal is named on screen.
- **One shared validity rule** governs the public check, the learner's certificate, card and print, and the staff list. «Dicabut» appears only for a real revocation; otherwise the certificate reads «Sedang ditinjau».
- **A policy toggle never changes an issued certificate:** the rule reads the sitting's captured status.
- **An evidence downgrade is surfaced to the school**, where it can be revoked.

**What it preserves:**
- historical records;
- the approved correction procedure;
- the public privacy boundaries.

**Asked, in sequence:**
1. **Authorise the merge** of PR #30 at `94ce6727`, as a merge commit.
2. **Authorise the staging promotion 309 → 310.** Step 0 and BEFORE are taken read-only before the merge, then AFTER (only line 10 moves) and the after-promotion checks. Sharon's verdict comes on AFTER, then the report to the owner.

**Production stays at 111. CI-1 isn't needed there until certificates are issued**, and its promotion there is a separate authorisation.

**One known exposure, test-only:** `selftest/db/r1.sql` on main fails R1-K01 in any CI run that reaches it between 16:00 and 24:00 UTC, a test-clock bug that predates CI-1. If main's CI runs after the merge in that window, R1-K01 can go red. The fix rides in CI-2's own commit. It isn't a product defect, and staging's promotion workflow doesn't run the selftests.

**Order with CI-2 and CI-1b:** each merges and promotes separately, with its own preservation evidence (ruling 98). CI-2 (the production blocker) is stacked on CI-1, and can be rebased to go first if the owner prefers.

**Run conclusions re-read by Bob from the GitHub API (24 Nov 21:38Z), under the new rule (plan of record §3d):**
- ci 45439475500: `completed`, conclusion `success`, attempt 1, head `94ce6727f9325426c328c3340365870593298192`, finished 17:15:49Z.
- journeys 45441914637: `completed`, conclusion `success`, attempt 1, the same head, finished 17:25:56Z.

CI-1's evidence stands as stated.

## Executed under ruling 101 (24 Nov 2026, Bob)

1. **PR #30's description is updated** to the frozen candidate `94ce6727` and the test-only C1W-S06 correction.
2. **Step 0 on staging** (`promotion/step0-CI1-staging.txt`), read-only, ~22:24Z: 309; 60 issued certificates, none with an open review, none whose result in force fails, so **no certificate changes state**.
3. **BEFORE** (`promotion/preservation-CI1-staging-BEFORE.txt`), read-only, 22:25:24Z: watermark `audit_id` 10705.
4. **Pre-merge check:**
   - the head is still `94ce6727f9325426c328c3340365870593298192`;
   - migration 310's sha256 is still `2b450700…29e6`;
   - main `429b7dcc` is the merge base, so there's no conflict;
   - both runs read `success` from the API.
5. **Merged** as a merge commit, pinned to the expected head: main **`93b93134`** (parents `429b7dcc`, `94ce6727`). **Its tree is identical to `94ce6727`'s.**
6. **Staging promotion:** `staging.yml` run **45500905721**, triggered by the push to main, which adds a migration.
