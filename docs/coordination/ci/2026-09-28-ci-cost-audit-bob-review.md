# Bob's review of the CI cost audit (28 Sep 2026)

This reviews `2026-09-28-ci-cost-audit.md`, as asked after BOB-10's hand-off. Nothing in CI has changed.

## S1–S3: every job and verdict kept? Yes, with one condition on S2 and one correction to S3

**S1: fail fast.** Keeps every job and every verdict.
- The heavy jobs gain `needs: check`. When `check` passes they all run exactly as today; when it fails they are skipped, which is a missing result and not a changed one.
- `selftest` already waits for `[check, migrations-clean, migrations-upgrade-path, red-case]` (ci.yml:1761), so nothing downstream changes.
- **One note:** on a failing `check`, `SELFTEST_CI_UPSTREAM` (F01-R04) would see "skipped" for the heavy jobs. That only matters on a run that is already red.

**S2: group the static red cases.** Keeps every verdict, **but only if each step starts from a clean tree.** The audit says these cases "share no state"; on disk, they do:
- `static-permissive-policy` writes a migration file, `supabase/migrations/20990101000000_red_case.sql`.
- `static-raw-evidence-read`, `static-duplicate-engine` and `static-second-verification-route` each write files under `src/`.
- Today the "Inject the deliberate defect" step (ci.yml:183) runs once per matrix job, so each case gets a fresh checkout.

In one job, the next case would run with the previous case's plant still present. Every case asserts that *its own* test is red and names its own reason, so a leftover plant can't turn a red into a pass. But it could turn an unrelated test red, and it breaks the claim that each defect is proven in isolation.

- **Condition:** each case becomes its own step with `if: always()`. The step begins with `git clean -fdq && git checkout -- .`, plants its own defect, and is judged on its own. `static-fable06-gates` already removes each plant after its case (`rm -rf src/app/redcase…`, `git checkout -- …`), so it fits as it is.
- **Verification to add:** after the grouped job, `git status --porcelain` must be empty.

**S3: cache dependencies.** Keeps every job and verdict. **The saving is likely smaller than estimated:** every job already has `actions/setup-node` with `cache: npm` (ci.yml:50, 71, 95, 181, 1769), so `npm ci` installs from the cached `~/.npm` and downloads nothing.
- What remains to save is the unpack and postinstall step, which includes the Supabase CLI binary.
- **Caching `node_modules` itself** is safe if the key covers `package-lock.json`, the OS and the Node version, so that any change misses the cache.
- Measure before adopting, as the audit already says.

## S4: which `db-*` red cases can share a stack

**Evidence (local, 28 Sep).** I built one fresh database: every migration (120), the seed set and the lifecycle files, as `local-stack` does. On it I ran all 15 `db-*` gates except `db-table-without-rls`, one after another, each exactly as `ci.yml` has it: its step's `run:` text, extracted with a YAML parser, with the same environment.
- **Baseline:** a schema digest before any gate. It covers every public function body, policy, trigger, index, constraint and client grant.
- **After each gate:** the gate's exit code, the digest again, and every DB suite (233 rows across fable01–14, quick-canonical and evaluation) as a clean recheck.

| gate | exit | time | digest vs baseline | recheck |
|---|---|---|---|---|
| db-fable04-gates | 0 | 20 s | same | 233/233 |
| db-fable05-gates | 0 | 28 s | same | 233/233 |
| db-task1-gates | 0 | 22 s | same | 233/233 |
| db-task2-gates | 0 | 18 s | same | 233/233 |
| db-fable06-gates | 0 | 115 s | same | 233/233 |
| db-tour-gates | 0 | 73 s | same | 233/233 |
| db-wp1-gates | 0 | 115 s | same | 233/233 |
| db-wp7-gates | 0 | 25 s | same | 233/233 |
| db-wp8-gates | 0 | 23 s | same | 233/233 |
| db-r1-gates | 0 | 34 s | same | 233/233 |
| db-bob01-gates | 0 | 38 s | same | 233/233 |
| db-bob02-gates | 0 | 24 s | same | 233/233 |
| db-bob03-gates | 0 | 22 s | same | 233/233 |
| db-bob04-gates | 0 | 26 s | same | 233/233 |
| db-bob06-gates | 0 | 21 s | same | 233/233 |

- **Every planted defect** turned its gate red for its declared reason on the shared stack; exit 0 means each `red`/harness assertion held.
- The 79 harness plants also proved their gates in the same order on the shared stack: 15, 10, 9, 9, 6, 6, 14 and 10 across the eight harness gates.
- The whole sequence took about 10 minutes of gate time on one stack, against 15 stack boots of about 2.5–3 minutes each today.

**Safe to share: all 15 except `db-table-without-rls`.** Why they're clean:
- **The inline gates** (fable04, fable05, task1, task2, fable06, tour, wp1) plant each defect inside `begin; … rollback;`.
- **The harness gates** (wp7, wp8, r1, bob01–04, bob06) use `plants.mjs`, which checks that the schema digest moved and then came back for every plant.

**Must keep its own stack: `db-table-without-rls`.** Its defect is a migration file injected before the stack boots, so it can only be proven by a boot that applies it.

**The one real risk, and how to contain it.** Two extra steps are not transactional:
- `db-r1-gates`' F09-C01 swaps `handle_new_auth_user`;
- `db-bob01-gates`' F10-C01 swaps `create_kelas`.

Each saves the original definition and restores it before its assertions, and on a passing run the digest proves the restore. But if one of them **fails** between plant and restore, the defect stays on the stack. In a shared job, the gates after it would then run against a planted schema, and their verdicts in that run couldn't be trusted. (The run is already red, but it would report misleading second failures.)

Mitigations:
- one step per gate, with `if: always()`;
- a digest step after each gate that fails loudly when the schema moved, so the first failure is named and the later ones are marked as running on a dirty stack;
- put the two non-transactional gates last in their group.

**Suggested shape, if a decision is recorded after 5 Oct.** Three shared-stack jobs of about 3–4 minutes of gate time each, instead of 15 separate boots. For example, split by time:
- **A:** fable06, tour, fable04, task1;
- **B:** wp1, fable05, task2, wp7, wp8;
- **C:** bob01–04, bob06, r1, with r1 and bob01 last.

`db-table-without-rls` stays alone. That is 4 boots instead of 16, which saves about 12 boots (about 30–36 billed minutes of boot time per run) at a similar wall-clock time. Each gate still runs and reports on its own.

**What this evidence does not cover.** It was one local run, on Postgres 16 outside the Supabase CLI stack; CI's containers weren't used. Before switching, run the grouped jobs once with a planted failure in the middle gate of a group, to see the digest step name it.
