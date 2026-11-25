# H-1 · for the owner's authorisation (Bob, 24 Nov 2026)

**What it fixes:**
- **The pre-flight heartbeat** (the test harness's check that the machine is alive) read a test step's own database reset as a dead machine. It voided whole local test runs tonight (at 366 s and 1449 s) and forced reruns.
- **The pre-existing R1-K01 test-clock defect** (ported from CI-2's `6aceed28`). It makes **main's own ci red every evening (17:00–24:00Z)**, including on CI-1's merge `93b93134` (Sharon's PR-25).

It's a test harness and test files only: **no product code, no migration, no workflow.**

| | |
|---|---|
| **PR** | [#32](https://github.com/yazidmanan2409/pintar40/pull/32), `claude/h1` → `main`, frozen head **`7716f228`** |
| **Files** | `scripts/dev/preflight.sh`, `scripts/dev/README.md`, `selftest/db/r1.sql` (1 line), `selftest/db/fable37.sql` |
| **ci** | **45499450461: completed, success, attempt 1** (API, 22:52Z). It ran inside the clock window, so it also proves the clock fix. It is H-1's first full selftest run in CI |
| **Earlier ci** | 45492159358 on `73fc4ab1`: failure, root-caused by Bob from the log to the clock defect alone (selftest skipped), and fixed by the port |
| **Red and green** | heartbeat: VOID on main's harness, PASS with the fix (4 RESET beats); grace 0 → INFRA (the bound holds); a database stopped with no reset → INFRA (the control holds). Clock: 46/1 at `73fc4ab1`, 47/0 ported |
| **Review** | Bob read the diff and found nothing to change. Harness and test only, so there's no product-safety review. **Sharon** has the repo's test-reliability lessons on record |
| **Journeys** | Not needed: no product change |

**Asked:**
1. **Authorise the merge** of PR #32 at `7716f228`, as a merge commit.
   - The PR is "behind" main (CI-1's merge) with no conflict. Its files don't overlap CI-1's.
   - **No staging promotion is involved:** there's no migration, so `staging.yml` doesn't run.
2. **After the merge:** Bob reads main's ci on the merge commit from the API. Green there closes PR-25's first half (main green on an exact commit).

**Its relation to CI-2:** CI-2 carries the same clock fix (`6aceed28`), content identical. Once H-1 is merged, CI-2's copy is a no-op and merges without conflict.

**Production is not touched.**

## Executed under ruling 102 (24 Nov 2026, Bob)

1. **PR #32's description is corrected** to `7716f228`, the ported clock fix and its evidence.
2. **The candidate is unchanged:** the head is `7716f22865d7150dd55d0c4b7e6c724f9c294e14`. ci 45499450461 on it: every job success, including «verdict».
3. **First merge attempt: refused by branch protection** («Required status check "verdict · green only when every job ran and succeeded" is expected»). The repository requires the branch to be up to date with main, and main had moved on (CI-1's merge `93b93134`).
4. **The branch was updated by GitHub's update-branch**, a merge commit with no history rewrite: the new head is **`ac91df3f`** (parents `7716f228` and `93b93134`).
   - **The reviewed change is unchanged:** the diff of the PR against main is byte-identical to the reviewed diff (sha256 `647f5beff9cb2c08…` both ways; 4 files, +55/−19).
5. **Next:** ci on `ac91df3f` is read from the API; merge only on its verdict success; then main's full ci on the merge commit is read before PR-25's first half is closed.
6. **The ci on `ac91df3f`** (45505466200): completed, **success**, attempt 1 (API, 23:30Z). Re-checked just before the merge: the head is still `ac91df3f`, and the diff against main is still sha256 `647f5bef…`.
7. **Merged** as a merge commit, pinned to `ac91df3f`: main **`f1e35bb9`** (parents `93b93134` and `ac91df3f`). **Its tree equals `ac91df3f`'s.** No staging run, as expected (no migration).
8. **Main's full ci on `f1e35bb9`:** run **45510549989**, in progress. It's read from the API before PR-25's first half is closed (ruling 102).
9. **Main's full ci on `f1e35bb9`** (45510549989): completed, **success**, attempt 1 (API, 00:08Z, 25 Nov). **All 18 jobs succeeded, including selftest**, and the R1 group ran inside the clock window. **PR-25's first half is met** (ruling 102).

## H-1: CLOSED (25 Nov 00:08Z)
