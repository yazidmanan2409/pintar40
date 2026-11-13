# A2a change A · result review · `2cea0564dcc12bede2e3ab3cb63236fce4d0b89e`

Sharon, 13 Nov 2026 (23:05 UTC). Read-only. **Frozen commit:** 13 commits on `main` at `a6b47466d3f8242b2740f81c186a5cb0f341eac0`.
- I read the diff in full, five migrations from `20270118100000` to `20270118140000`, and the exception table of `selftest/a2a-l01.test.ts` with its conditions and plants.
- I did not run the suites. Second Eye reports A2A-L01 to L06 green, with each plant red. CI on the PR confirms that.

## What holds now

- **PASS.** Bob may start the expensive steps: the pre-flight, the PR, CI and journeys.
- **Both deviations are accepted.**
- **One note for the page and the register, not a blocker:** the header of migration `20270118100000` still says "Not reached today".

## Verified

**The product changes:**
- **Commit 2** (`recovery_assist_school`): the early return for no current person or for oneself comes before `sekolah_memegang`. Volatility, security and grants are re-asserted by the migration's own check. Behaviour is preserved.
- **Commit 3:** the ten functions are as ruled at `40753420`.
- **C1** (`20270118120000`): as ruled.
  - `akhiri_pendaftaran` reads the person without a lock, locks the person, then locks the enrolment and re-checks it.
  - Commit 3's line is gone, and the migration asserts its absence.
  - `transfer_minta`, `transfer_request` and `handle_new_auth_user` take the person first, so rows 7 and 9 are in C1's commit.
- **Row 3** (`hitung_ulang_koreksi_kunci`): the learner first. No deadlock claimed.
- **Row 4** (`recompute_result`): the learner, then the sitting, before the head result is read. The structural check asserts the order of all three. No deadlock claimed; the race is REG-A2A-04.
- **Every change is made from the function's own definition, with one anchor that must occur exactly once.** Signatures, owners, grants and security are kept.

**The exceptions (A2A-L01), each with its condition as ruled:**
- **`audit_write`:** the single foreign key, and `v_eval_actor` filled only from an open evaluation session; the reason names the persona's and the evaluator's rows.
- **The password guard's early return:** the guard's first line is asserted. Every caller named in the path must have no `UPDATE auth.users` that sets `encrypted_password`, and GoTrue is never covered. The plant P6 is reported.
- **The permit:**
  - the repository check, with three plants (`delete`, `for update`, `deleteUser`);
  - `akun_kunci`'s `FOR NO KEY UPDATE` and no `FOR UPDATE`, from the catalogue;
  - the person before the account.
- **New `auth.users` rows:** only from `handle_new_auth_user` as an INSERT trigger on `auth.users`.
- **The window, "PENDING B1":** removed in (C).
- **REG-A2A-01, row 11:** named, with its register fix.
- **Same-row re-locks:** each names its variable, with the mechanical check `dipegangDulu`.
- **Plants P1, P1b, P2, P3, P5 and P6 are each required to be reported** before the engine's reading is trusted.

**The deviations:**
1. Rows 3 and 4 are in two commits (`e73842e1…` and `2cea0564…`), not one. Accepted: the content is as ruled, and pushed history is not rewritten.
2. Permit condition 2 is asserted inside A2A-L01, not by editing `20270117190000`. Accepted, and right: a migration deployed to staging is not edited.

**Also checked:**
- REG-A2A-04 (row 4's race): no claim is made.
- A2A-L06 found row 7 not real. The person-first line in the transfer request stays: a `KEY SHARE`, harmless.
- REG-A2A-05 to -07 (C2's list): none touches A2a's objects.
- My two page additions are on `claude/a2a` at `4a407986`.

## Note (non-blocking; page and register)

- `20270118100000`'s header says "Not reached today … only the planner's order … kept `sekolah_memegang` from being called". **A2A-L02 shows it was reached on `main`.**
- The code is right; the comment is wrong. A deployed migration's comment is not edited.
- **Record the correction on the page,** and in the next migration that touches `recovery_assist_school`.

## Defects found in change A

| Defect | Caught in | Could reasonably have been anticipated? |
|---|---|---|
| Auth's recovery write: `auth.users` → persons, reachable (A2A-L02) | development (A2A-L01, then raced) | yes, Q3. My early read also called it latent: Q5, I reasoned from the planner and did not ask for the race |
| `finalize_session` against the hold, and nine siblings | development | yes, Q3: A1 added the hold after the person without asking who writes a sitting and then reaches its learner |
| `akhiri_pendaftaran`: enrolment → person (C1) | development (my read of commits 3 and 4) | yes, Q3: the enrolment trigger takes the person on every write |
| Rows 7 and 9, which C1 would have made into cycles | development | yes, Q2: a flip of one side must flip every writer on that side |
| Row 3: key correction, sitting before learner | development | yes, Q3 |
| Row 4: recompute against the correction recalculation | development; my first pairing was wrong (the unique slot) | yes, Q3 |
| The permit's key on `auth.users` (declared, not real) | development | no: foreign keys were not counted before R1 |
| Row 11: two enrolments at once (registered) | development | yes, Q3 |
| The engine's own defects (commits 4 and 7: first breach only, a memoised under-report, scan order, two misreadings, unranked enrolments) | development | yes, Q5: who checks the checker |
| B1: the window row against the fence (the page, before code) | design | yes, Q3, at my own required change 3 |

**None was caught in acceptance:** acceptance has not started.
