# Z9 · ruling 86: is CI equivalent to the local pre-flight? — Sharon

**Work:** `docs/completion-4.1/batches/z/z-evidence/EQUIVALENCE.md` on `claude/z` at `9a819a7c`, against `.github/workflows/ci.yml` and `selftest/run.ts` at the same commit.
Read-only. The diff from the candidate `7615d6b1` is 8 files, all under `docs/`; I confirmed it.

**Verdict: CONFIRMED, equivalent, with three conditions on how the run is recorded.**

## (a) The app-runner tests really run in CI's `selftest` job

- `npm run selftest` is `tsx selftest/run.ts` without `--accept-justified-skips`. By `run.ts` (lines 5–10), a SKIP for a missing facility is a failure unless that flag is passed, and CI never passes it.
  - So every `app` test, the HTTP and journey-like ones with Mailpit, either runs or fails the job. None can be silently skipped.
- The job provides every facility the app runner needs:
  - the local stack (fresh reset);
  - Mailpit on the same ports and flags;
  - `SELFTEST_APP_PORT=3999`;
  - the stack's keys;
  - `PINTAR_BUILD_SHA = github.sha`.
- `run.ts` builds afresh (`ensureFreshBuild`) and checks the build identity.
- The red-case groups' `--accept-justified-skips` is limited to their `--only=` single-test probes. That is right for a red case; the strict run is the `selftest` job's.

## (b) The plant gates are exercised against the candidate's code

- Every job, `red-case` included, does `actions/checkout@v4` on the run's sha, then `npm ci`.
- The only cache is `setup-node`'s `cache: npm`, which caches downloaded packages, not a build.
- There is no `actions/cache` of `.next`, `node_modules` or any result anywhere in `ci.yml`.
- Each db group plants its gates (`plants.mjs run --gate=…`) against a stack started in that job from that checkout.

## Also checked

- **The component map holds:**
  - lint, typecheck and build identity run the same commands;
  - the build runs twice;
  - the manifest's 1389 ids run strict;
  - 21 gates hold the 175 plants;
  - the same 11 matrix groups run;
  - CI adds clean migrations, the upgrade path, baseline parity and `verdict`.
- **The count reconciliation is right:** F01-R04 can only run in CI.
- **`PINTAR_AI_STUB_HARNESS`** is set nowhere in `.github/`, so my C3w-1 condition holds.

## Conditions on the run of record

1. **The proof-reuse gate (`reuse`, `audit/ci/proof-reuse.mjs`).**
   - The dispatch on `9a819a7c` may cancel itself as **ALREADY PROVEN** if an earlier authoritative run covers the same code. That outcome is never green.
   - The run of record must be one in which **every job executed** on the candidate's code. Name it in the evidence:
     - the run id and attempt;
     - the sha;
     - the `verdict` job green.
   - If the gate names an earlier run instead, that run must itself meet this, on code identical to `7615d6b1`.
2. **One attempt, whole.** All jobs must be green in the same attempt.
   - A job re-run to clear a failure is recorded under ruling 83's classification (INFRA, with its cause), never silently.
   - A failure in test code is a FAIL, not INFRA.
3. **The journeys** (`audit-journeys.yml`) run once on the same sha, as stated, and their result is recorded beside the CI run.

**No gap group is needed** under ruling 86's gap clause.
