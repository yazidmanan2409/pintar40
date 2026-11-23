# Z9 · ruling 84's targeted CI diagnostic (stream A)

**Why.** CI 45244823300 on the candidate f5700bd1 was red in the strict selftest only. C3W-C32, C3W-C36 and C3W-C310
failed together with «the scenario could not run: ERROR: invalid input syntax for type uuid: ""». All three share one
world (AWAL in `selftest/c3w-c3.test.ts`). Locally the three passed, alone and in the GREEN full pre-flight.

**Runs** (one dispatch each; ci.yml cut down on two throwaway branches, both deleted after this record):

| Branch | Base | Commit | Run | Step A (the three alone) | Step B (C1W-*, C2W-*, C3W-*, in the strict order) |
|---|---|---|---|---|---|
| `claude/z9-diag-cand` | candidate f5700bd1 | 4282e7d6 | 45255845865 | PASS 3/3 | PASS (C3W 3/3) |
| `claude/z9-diag-main` | main 01bba241 (C3w-1, 300) | a44a7cd9 | 45255856276 | PASS 3/3 | **FAIL: C3W-C32, C36, C310**, the same error as CI |

- **Setup:** both runs used the strict job's runner (ubuntu-latest, 4 CPUs), its local-stack action, Mailpit and env (`diag-ci.yml`).
- **Clocks:** the runner and the database were on UTC 20:09Z. That is 03:09 the next day in Jakarta.
- **Instrumentation:** `diag-patch.mjs` made the C3W world print each step's name and result, or its sqlerrm. It also printed ai_minta_draf's whole answer, and each c1.* setting's name as EMPTY or set. No secrets, emails or names were printed.
- **Kept:** the full logs (`*.log`) and their C3W lines (`*.summary.txt`).
- **Not counted:** the attempt-2 rerun of 45244823300 was cancelled before its strict job ran any test (ruling 84).

## What the diagnostic showed (main, step B: `main-45255856276.summary.txt`)

- **Not the request:** Bob's first hypothesis is ruled out. `diag_minta` = `{"ok": true, …, "permintaan": <uuid>}`, and `t_minta`, `t_coba` and `t_kirim` were all set.
- **The earliest failed step is `c310_aju`:** `22P02: invalid input syntax for type uuid: ""`, with `c310_duduk = 0|1`. So no generated question was presented on the learner's pre-test, `c1.xs` was `''`, and the next unguarded cast stopped the world (`error sqlstate=22P02`).
- **The candidate passes the same step:** in both its steps it reads `c310_duduk = 1|1`.

## Root cause (test-only; on main since C3w-1, not a Z change)

- The world's package (`selftest.f13_paket(…, 3, 2, …)`) has 3 PRE_TEST questions and 2 POST_TEST questions.
- The pre-test's `item_count` is 3, so it presents all 3 PRE_TEST questions.
- The generated drafts X and Y were chosen as the package's first two questions **by uuid order**. That covers all 5 questions, so it is random per run.
- When both landed on the 2 POST_TEST questions (1 chance in 10), no generated question was on the paper. That is the failure above. It is chance, not the candidate's code: main failed it once of its two runs here, and the candidate passed both of its runs.

## Fix (test-only; red first)

`selftest/c3w-c3.test.ts`:

1. X and Y are chosen from the PRE_TEST questions (`soalKe … and i.cycle_role = 'PRE_TEST'`), so they are always on the paper.
2. **The diagnostic line (Bob 19:49Z / 20:00Z):** if `c1.xs` is still empty after the sitting, the world says so by name. It gives the count of generated drafts presented and the role of X and Y, instead of a bare `''::uuid`.

Red first, local, on a fresh stack:

- `merah-1-x-y-post-test.txt`: X and Y forced onto POST_TEST questions, the CI failure exactly, deterministically: C32, C36 and C310 all fail with `invalid input syntax for type uuid: ""`.
- `merah-2-guard-names-c1xs.txt`: the same plant with the fix's guard: «the C3W world: c1.xs is EMPTY (no generated question on the learner's paper; generated drafts presented 0, of x POST_TEST, y POST_TEST)».
- With the fix: C3W-C32, C36 and C310 PASS, 10 runs out of 10 (30/30).
