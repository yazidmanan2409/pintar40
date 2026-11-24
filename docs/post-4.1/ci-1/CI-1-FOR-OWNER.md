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
7. **The staging run concluded `success`** (API, 22:27:06Z). Staging reads **310 / `20270125100000`**.
8. **AFTER** (`promotion/preservation-CI1-staging-AFTER.txt`), read-only, with BEFORE's cutoff and watermark: compared mechanically, **only line 10 moves**; the other 65 lines are identical. (One transcription slip, a lost trailing space on line 76, was caught by the diff and corrected to the verbatim output. Disclosed in the checks file.)
9. **After-promotion checks** (`promotion/after-promotion-CI1-staging.txt`):
   - v6-pre-request OK, c3w-r3-bahan OK;
   - the three new functions are present, and the S-1 refusal is in place;
   - the one registry row is there;
   - no anon grant on any certificate function (verify_certificate is service-role only, as before);
   - **60 issued certificates read BERLAKU, 6 revoked, none DITINJAU**, as step 0 predicted.
10. **Sharon (22:38Z): PASS, conditional ONLY on the V6 hosted re-read** (her CI-1-VERIFY addendum).
    - She read the staging run from the API (success), checked that main's tree equals 94ce6727's, and did her own diff: only line 10 moves.
    - She found that the migration writes only its registry row, that public and staff validity agree, and that step 0's prediction matches.
    - She verified from the evidence, the repo and the API. She did not query staging herself: her standing rule is no staging access unless the owner authorises her in her own session.
11. **The V6 re-read** (22:42:25Z): periksa md5 `2b4a0444…` is unchanged, and the counter baseline is 178,026. **It needs one staging request after 22:42:25Z** (the owner's page load, as for Z and D2-R), then Bob re-reads. **CI-1 isn't closed until that's shown.**
12. **The V6 re-read after the owner's staging sign-in** (22:44:34Z): 178,216, **+190** over the 178,026 baseline; the md5 is unchanged. **V6's hosted condition is met.**
13. **Main's ci on the merge** (45500905491): **FAILURE**, read from the API.
    - Bob read the logs: the only failure is R1-K01's control (the pre-existing clock bug, disclosed above), with selftest skipped as a consequence. It's not CI-1's code.
    - The merged tree equals `94ce6727`'s, whose full CI was green.
    - Main stays red in the evening window until CI-2 or H-1 carries the fix.
14. **Sharon's condition (V6) is met.** She is asked to record her FINAL. CI-1 is declared closed on staging when she does.
15. **Sharon: FINAL, PASS on CI-1's staging promotion** (22:48Z). V6 is met (md5 unchanged, counter +190). She read main's ci 45500905491 from the API at 22:49Z (failure) and judged it the test-side clock defect. The window is more precisely 17:00–24:00Z (UTC `current_date` against WIB, UTC+7). The PR ci on the same tree, 45439475500, ran 16:38–17:15Z (success), which fits. **It doesn't change the verdict.**
    - **Condition carried forward (Sharon):** main has no green full run at `93b93134`, so **no production promotion takes main while its ci is red**. CI-2's clock fix must land and main's ci must go green on the exact commit first. This is recorded in the readiness register (PR-25).

## CI-1: CLOSED ON STAGING (24 Nov 22:50Z)

- **Merged:** main `93b93134`, with a tree equal to the frozen `94ce6727`.
- **Promoted:** staging 309 → 310, with only line 10 moving.
- **After-promotion checks and V6:** met.
- **Sharon:** FINAL PASS.
- **Still open:**
  - **L-105 (printed certificates) under CI-1b:** its rectification and independent verification remain mandatory (ruling 101);
  - **production:** untouched at 111, a separate authorisation, under PR-25's condition.
