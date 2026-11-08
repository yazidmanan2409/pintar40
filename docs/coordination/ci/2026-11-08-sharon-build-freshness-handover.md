# PINTAR 4.0 — Sharon Build-Freshness Handover (session saved 8 Nov 2026)

8 November 2026. Infrastructure only: no product code, migration, manifest entry or deploy.

> **Durable record.** This replaces the session-only draft given to Second Eye on 8 Nov. Everything needed to resume is
> here; nothing depends on that session's temporary storage.

## 0. Session status at close

| | |
|---|---|
| Branch | `claude/gracious-lamport-0m1qjr` |
| Verified commit (the safeguard) | `04abab88b80c8e02c2da81bf1cdda7ef1a4f6e62` (CI 42438430634 green) |
| Branch head after this record | a documentation-only commit on top of `04abab88`, adding this file and nothing else |
| Integration | **Done by Second Eye.** Merged into `claude/awesome-rubin-bqxp6p` as merge commit `9535f65d` ("Merge Sharon's build-freshness safeguard (04abab88, CI 42438430634 green) into the readiness candidate"). Contained in Second Eye's verified baseline `5919a370` and their checkpoint `2e7ff7c6`. |
| `main` | `c4944fab`. Does **not** contain this work, and must not receive it separately (see section 8). |
| Deploys | none |

### Verified, pending, blocked and not tested

| State | Item |
|---|---|
| **Verified** | Exact-commit CI on `04abab88`: run 42438430634, 18/18 jobs, strict selftest 874/0/0, one fingerprinted build. |
| **Verified** | CI on `289b49af`: run 42436460751, 17/17 jobs, 874/0/0 (earlier evidence). |
| **Verified** | `selftest:build-identity` 11/11, locally and in CI; the planted guard and missing-declaration failures are caught; real `next build` reuse/rebuild cases run locally (section 5). |
| **Verified** | Clean merge, typecheck, 11/11 regression tests and `CI-W01`–`03` on `04abab88` merged with Second Eye's `25163332`. Second Eye then integrated it (`9535f65d`). |
| **Pending (Second Eye owns it)** | CI and journeys on Second Eye's combined candidate. Its strict selftest log should show exactly one `building production bundle (.next/BUILD_ID missing)…` followed by `built and recorded`. Second Eye records which of their runs covers `5919a370`. |
| **Blocked** | nothing |
| **Not tested** | A local full-manifest run with real Supabase credentials (this container had none; locally `F01-R01` returns 500 for that reason only, and it passes in CI). `audit-journeys.yml` and `diagnose-journeys.yml` were not changed and not run by Sharon: they call `npm run build` and drive the app directly, not through the selftest, so the fingerprint does not apply to them. |

### Owner rulings and constraints this work followed

These are taken from the owner directives of 8 Nov.
- **No shortcuts:** no weakening or skipping of any test, and no unverified shortcut around freshness verification.
- **Opt-out:** keep an explicit opt-out env var. `SELFTEST_REUSE_BUILD=1` is local only, and is refused in CI.
- **Identity:** build identity must be a deterministic fingerprint (content, config, lockfile, environment, revision), not mtimes. A Git checkout must never silently reuse another revision's bundle.
- **Explicit dependency:** replace the hand-kept list with an explicit dependency, and keep it simple.
- **Coordination:** don't disturb Second Eye's candidate or runs. CI was dispatched only after their runs finished, and their branch was never modified.
- **Restrictions:** no merge to `main`, no deploy. Second Eye owns integration.
- **Overhead:** preserve the low measured fingerprint overhead.

## 1. Final branch and commit

- Branch: `claude/gracious-lamport-0m1qjr`
- Commit: **`04abab88b80c8e02c2da81bf1cdda7ef1a4f6e62`**
- Base: `main` at `c4944fab`. Four commits, merged as one unit:

| Commit | What it does |
|---|---|
| `cb78c992` | First, mtime-based staleness check (superseded by the next commit) |
| `aa144fe9` | SHA-256 fingerprint; the explicit `build` dependency; the regression tests |
| `289b49af` | CI: the selftest owns its build; `SELFTEST_REUSE_BUILD` is refused in CI |
| `04abab88` | The fingerprint also covers files outside `src/` that `src/` imports |

## 2. Files changed

9 files; nothing under `src/`, `supabase/`, `public/`, or `selftest/manifest.json`.

| File | Change |
|---|---|
| `selftest/build-identity.ts` | new: the fingerprint and the build/rebuild/reuse decision |
| `selftest/build-identity.check.ts` | new: 11 regression tests (node:test) and the `.next` access guard |
| `selftest/lib.ts` | `build` facility, `Context.bundleDir`, `compiledBundle()`, `contextFor()`, `selectionNeedsBuild()` |
| `selftest/run.ts` | the build step before static and app tests; per-test context; mtime code and hand-kept list removed |
| `selftest/static.test.ts` | `F01-S03`: `requires: ["build"]`, `compiledBundle`, one message reworded |
| `selftest/experience.test.ts` | `UX1-S0-MUAT-01`: `requires: ["build"]`, `compiledBundle` (lines 64 and 3461–3540 only) |
| `.github/workflows/ci.yml` | `check` job: one added step; `selftest` job: its separate `npm run build` removed |
| `package.json` | the `selftest:build-identity` script |
| `docs/handoff/codex-2026-10-09/05-INFRASTRUCTURE-AND-ACCESS.md` | the `SELFTEST_REUSE_BUILD` row |

## 3. Technical behavior

- **Build identity is deterministic.** After every successful build the selftest writes a SHA-256 fingerprint to `.next/pintar-selftest-build.json`. It covers:
  - the content of `src/` and `public/`, plus every file outside them that their code reaches by relative import, followed transitively (today only `supabase/auth-identitas.json`);
  - `next.config.*`, `tsconfig.json`, `postcss.config.*` and `package.json`;
  - `package-lock.json`, and `node_modules/.package-lock.json` for the installed tree;
  - the `.env` files Next loads, plus `NODE_ENV`, `NEXT_PUBLIC_*` and every literal `process.env` name that `src/` or `next.config.*` reads (values are hashed, never written);
  - `git rev-parse HEAD`.
- **Reuse requires an exact match.** `.next` is reused only when the recorded fingerprint and `BUILD_ID` both match. Otherwise it rebuilds:
  - a changed source, config, lockfile, installed-tree or env input, with the changed part named in the log;
  - another Git revision;
  - a `.next` with no fingerprint, such as one from a plain `npm run build`;
  - a `BUILD_ID` that differs from the recorded one.

  If inputs change during a build, it builds once more and then refuses.
- **Every decision is logged:**
  - `building production bundle (<reason>)…`
  - `built and recorded: fingerprint … (revision …, build …)`
  - `reusing production bundle: fingerprint … matches …`
- **The override.** Locally, `SELFTEST_REUSE_BUILD=1` keeps a stale bundle, with a `!!! STALE BUILD REUSED` warning, and never stands in for a missing build. It **throws** when `CI` or `GITHUB_ACTIONS` is `"true"`.
- **Tests that read compiled output declare it.** Such a test declares `requires: ["build"]` and reads through `compiledBundle(ctx)`.
  - The runner verifies the build whenever a selected test needs `build` or `app`.
  - It hands the bundle path only to tests that declared `build`; one that didn't fails with an explicit error.
  - A guard fails `check` if any `selftest/` file reaches `.next` directly.
- **CI.** The selftest job runs `npm run selftest` alone, so the bundle it tests is the one it fingerprinted. `npm run build` is exactly `next build`, with no hooks, and the selftest runs that same command with the step's env. This removes a duplicate build of about 30 s per run.

## 4. CI run IDs and results

| Run | Commit | Result |
|---|---|---|
| [42438430634](https://github.com/yazidmanan2409/pintar40/actions/runs/42438430634) (ci #507) | `04abab88` (final) | **success, 18/18 jobs** |
| [42436460751](https://github.com/yazidmanan2409/pintar40/actions/runs/42436460751) (ci #506) | `289b49af` | success, 17/17 jobs (earlier evidence) |

Run 42438430634, in detail:
- **`check` job 128602534138:** lint (0 errors), typecheck, `selftest:build-identity` 11/11 (`# pass 11`, `# fail 0`), build.
- **Strict selftest job 128604789615:** `874 passed, 0 failed, 0 skipped, 0 contract problem(s) → GREEN`. Next.js ran once:
  - `[build] production bundle for the selected tests`
  - `building production bundle (.next/BUILD_ID missing)…`
  - `built and recorded: fingerprint 64acf6522a90 (revision 04abab88b80c, …)`
  - then `[app] starting production-mode app`.

  `F01-S03` and `UX1-S0-MUAT-01` PASS through the new `build` dependency. `F01-R01` PASS; it fails locally only for lack of credentials, which is not acceptance evidence.
- **Your runs were not overlapped.** I dispatched only after your runs (CI 505, journeys 213) had finished.

## 5. Regression evidence

- **`npm run selftest:build-identity`: 11/11, locally and in CI.** The tests cover:
  - a missing build;
  - unchanged inputs (reused even after a touch);
  - changed source: an edit, an added or deleted file, CSS, `public/`, or a file outside `src/` that `src/` imports;
  - changed config, lockfile, installed tree or env (an unrelated env var or docs file does not rebuild);
  - a switched Git revision: back to an older commit, or a docs-only commit;
  - an untrusted `.next` (no fingerprint, or `BUILD_ID` replaced);
  - inputs changing mid-build;
  - the override: loud, never for a missing build, and refused in CI;
  - a static test needing the bundle triggers verification;
  - a test without the declaration fails;
  - the no-direct-`.next` guard.
- **Planted failures are caught:**
  - the original direct `.next` read put back in `F01-S03` → the guard fails;
  - `requires: ["build"]` removed from `F01-S03` → `threw: … does not declare requires: ["build"]`.
- **Real `next build` runs locally:**
  - a missing build is built, and unchanged inputs are reused;
  - an edit to `globals.css` rebuilds, and reverting it gives the identical fingerprint back;
  - an edit to `supabase/auth-identitas.json` rebuilds;
  - the override warns;
  - a plain `npm run build` is rebuilt.
- **Compatibility with your latest head, `25163332`:** clean merge, and clean with `main` (`c4944fab`). On the merged tree, typecheck is clean, `selftest:build-identity` passes 11/11 and `CI-W01`/`CI-W02`/`CI-W03` pass.

## 6. Performance overhead

Measured on an unchanged checkout (462 files under `src/` and `public/`):

| What | Cost |
|---|---|
| Fingerprint, first call (including `git rev-parse`) | about 100 ms |
| Fingerprint, warm | about 36 ms (22 ms before the import scan) |

- A reuse computes the fingerprint once; a build computes it three times.
- Hashing all of `node_modules` (900 MB, 23,351 files) would take about 5.5 s per call, so the installed tree is identified by npm's 210 KB `node_modules/.package-lock.json`.
- The net effect on a CI run is about 30 s saved per run (one build instead of two).

## 7. Known limitations

1. **Only listed inputs are covered.** A file the build reads by some means other than a relative import is not fingerprinted: an `fs` read during the build, or a new root-level config file. None exists today. Adding one means extending `selftest/build-identity.ts`.
2. **Computed env names are not seen.** `src/lib/certificates/keyring.ts` reads `CERT_SECRET_KEY_V<n>` by a name built at runtime. Every route is dynamic (`ƒ`), so these are read at request time and are not baked into the bundle. `NEXT_PUBLIC_*`, which Next does inline, is always included.
3. **Hand edits inside `node_modules` are not detected.** The installed tree is identified by npm's own record of it, so an edit that bypasses npm goes unnoticed.
4. **One extra local rebuild after each commit.** The revision is part of the fingerprint, so a docs-only commit also causes one rebuild. That is the intended trade-off.
5. **Two behaviour changes:**
   - A local `.next` from a plain `npm run build` is rebuilt once.
   - If a needed build fails, tests that declare `build` report SKIP (`facility missing: build`) rather than FAIL. A strict run still fails on that SKIP, and the converted tests have no `skip_justification`.

## 8. Integration instructions (followed by Second Eye: merge `9535f65d`)

1. Merge commit `04abab88b80c8e02c2da81bf1cdda7ef1a4f6e62` into your branch with a merge commit:

   ```bash
   git fetch origin claude/gracious-lamport-0m1qjr
   git merge --no-ff 04abab88b80c8e02c2da81bf1cdda7ef1a4f6e62
   ```

   Expect no conflicts. Against your `25163332` the merge is clean, and your `experience.test.ts` hunks start at line 6277; mine end at line 3540.
2. On the combined head, run:

   ```bash
   npm run typecheck && npm run -s selftest:build-identity
   ```

   Expect a clean typecheck and `# pass 11`.
3. Dispatch CI and journeys once on that exact head, as planned. In the strict selftest job, expect:
   - `[build] production bundle for the selected tests`
   - `building production bundle (.next/BUILD_ID missing)…`
   - `built and recorded: fingerprint …`, exactly once
   - then the tally.
4. From now on, any test that reads `.next` declares `requires: ["build"]` and uses `compiledBundle(ctx, …)`. Otherwise `selftest:build-identity` fails in `check`.
5. Do not set `SELFTEST_REUSE_BUILD` in any workflow; CI refuses it. Locally, use it only knowingly, and its output is never acceptance evidence.
6. Nothing in this branch should be merged to `main` or deployed separately. It travels inside your candidate.


## 9. How the numbers were measured (so they can be re-measured)

- **Overhead:** call `computeBuildIdentity(repoRoot, process.env)` from `selftest/build-identity.ts` 12 times in one `npx tsx` process. Take the first call, then the median of calls 3–12. This was run on the unchanged checkout, with the page cache warm and then dropped; both gave the same result.
- **Comparison point:**

  ```bash
  find node_modules -type f -print0 | xargs -0 cat | sha256sum
  ```

  This took 5.5 s for 900 MB and 23,351 files.
- **Out-of-`src/` imports:** a scan of `src/` for relative specifiers that resolve outside `src/` and `public/`. On 8 Nov the only one was `supabase/auth-identitas.json`, imported by `src/lib/pengaturan-auth.ts`.

## 10. Session history (why it looks like this)

1. **`cb78c992`:** the first fix compared `.next/BUILD_ID`'s mtime with the newest input. The owner rejected mtimes as identity.
2. **`aa144fe9`:** the fingerprint and the `build` facility, plus `compiledBundle()` and the 11 regression tests, replacing the hand-kept `STATIC_TESTS_READING_BUILD`.
3. **`289b49af`:**
   - CI built twice, because a plain `npm run build` carries no fingerprint, so the selftest job now owns the build.
   - A `postbuild` hook was rejected, because it would also run in Vercel's production builds.
   - `SELFTEST_REUSE_BUILD` is refused in CI.
4. **`04abab88`:** while writing the handoff, I found that `supabase/auth-identitas.json` (imported by `src/`) was outside the fingerprint. Imports leaving `src/` are now followed. This was re-verified by CI run 42438430634.

## 11. First action for the next session

**None for Sharon. This work is complete and integrated.** If a later change reports a build problem, start from section 3 here and `selftest/build-identity.ts`, and run:

```bash
npm run -s selftest:build-identity
```

The only open item belongs to Second Eye: confirm that their combined-candidate CI run's strict selftest shows exactly one fingerprinted build (section 0, Pending).
