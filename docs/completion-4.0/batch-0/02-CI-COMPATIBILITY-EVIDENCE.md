# Batch 0 · Deliverable 2 · CI compatibility evidence (2 Nov 2026)

**B0-A:** verify the runner environment rather than assume it; make the minimum change; keep every assertion; run CI and the journeys on the development branch; record run ids.

**Scope note:** every run below is on the **development branch, against a local Supabase stack on the runner**. None is a staging or Golden School verification (authorisation §B0-D); those write to staging and are not authorised in Batch 0.

## 1. What the runner actually provides (probe, run 41374709799 and 41374792031)

`.github/workflows/runner-probe.yml` (read only; commits 8675b26, aa3e165). It ran on both images:

| | `ubuntu-latest` | `ubuntu-24.04` |
|---|---|---|
| OS (ImageOS / version) | **Ubuntu 26.04.1** (ubuntu26, 20261026.180.1) | Ubuntu 24.04.5 |
| Node (image) / npm | v24.22.1 / 11.19.1 | v22.23.4 / 10.9.9 |
| Node given to JavaScript actions | v24.22.1 (Node 20 actions forced to 24, warning) | v24.22.1 |
| Docker / Compose | 29.4.2 (API 1.54, min 1.40) / v5.1.3 | 28.0.4 (API 1.48, min 1.24) / v2.38.2 |
| psql, pg_dump (image) | 18.6 | 16.15 |
| Python | 3.14.4 | 3.12.3 |
| PGDG repository for the codename | available (HTTP 200) | available |
| **Local Supabase stack** (CLI 2.117, `.github/actions/local-stack`): start, all migrations, seed, psql fingerprint | **works**: 177 migrations, PostgreSQL 17.6 | **works**: 177 migrations, PostgreSQL 17.6 |

The risk Phase 0 named (Docker 29's minimum API against the Supabase CLI's client; the image's psql 18 against a PostgreSQL 17 server) **did not materialise**.

## 2. What was actually broken

**History, corrected.** The last CI before Batch 0, run 37930520507 on 9 Oct, was **green**. CI had **not failed** since. It had **not run**. Phase 0's «no CI since the runner change» described a risk as if it were a failure (corrected in A, D, E, G).

| Workflow | On `ubuntu-latest` (Ubuntu 26.04) | Cause |
|---|---|---|
| `ci.yml` (18 jobs, no browser) | **Green, unchanged**: run **41375753148** on 0fb65bb, 18/18 jobs, strict selftest **661 passed, 0 failed, 0 skipped** | — |
| `audit-journeys.yml` (both jobs) | **Red**: run **41377378758**, both jobs failed at «Install the browser» | `npx playwright install --with-deps chromium` with **Playwright 1.55.0**: «BEWARE: your OS is not officially supported … Cannot install dependencies for ubuntu26.04-x64 with Playwright 1.55.0! … ERROR: Playwright does not support chromium on ubuntu26.04-x64» |
| 15 other workflows that install a Playwright browser (staging walks, perf, diagnose) | Same failure, by the same step | Same |

## 3. The minimum change (commit 871767d)

**Pin the 17 jobs that install a Playwright browser** (in 15 workflow files) to **`runs-on: ubuntu-24.04`**, each with a comment naming the cause and run. Nothing else changed:
- no test, step, assertion, timeout or version changed;
- `ci.yml` stays on `ubuntu-latest`, where it is green;
- no selftest asserts `runs-on` (checked).

**Why a pin rather than a Playwright upgrade:**
- It is the smaller change.
- The authorisation prefers pinned environments.
- Probe 41374792031 proved the local stack on 24.04.
- An upgrade changes the browsers the journeys measure.

The upgrade remains the long-term route: see §6.

**Exercised in Batch 0:** `audit-journeys.yml` only (§4). The other 14 files are pinned identically but **not run**. They write to staging or production-like targets, or are dispatched from `main`. They are **IMPLEMENTED — NOT VERIFIED** until their next authorised run.

## 4. Runs on the branch

| Run | Workflow | Head | Result |
|---|---|---|---|
| 41374709799 | runner probe | 8675b26 | Green (image facts) |
| 41374792031 | runner probe + stack | aa3e165 | Green on both images (§1) |
| **41375753148** | **ci** | 0fb65bb | **Green 18/18; selftest 661/0/0** |
| 41377378758 | audit-journeys (A crawl, B Dr Gladys's path) | c1a2c22 | **Red**: browser install on Ubuntu 26.04 (§2). The finding that led to §3 |
| **41377773745** | **audit-journeys** | 871767d (pinned) | *see §4.1* |
| *(final)* | ci | Batch 0 head | *see §4.1* |

### 4.1 After the pin

*Filled in from the runs; see the completion report (deliverable 1) for the final state.*

## 5. Local verification

| Check | Result |
|---|---|
| `tsc --noEmit` | rc 0 |
| `eslint` (whole repository) | rc 0 (4 warnings, all pre-existing in `audit/`) |
| Selftest SEC-G01/G02 (targeted), red then green | Red on a disabled allow check and on a planted undeclared package; green after |
| Job-A replica (crawl, 14 personas) with the accessibility harness | Crawl GREEN (0 broken); baseline recorded (deliverable 3) |
| Full selftest locally | *see deliverable 1* |

## 6. Remaining platform risks (not fixed in Batch 0, by design)

| Risk | Consequence | Recommended handling |
|---|---|---|
| The 24.04 pin is temporary: GitHub retires images on its own schedule | Browser jobs break again when 24.04 is withdrawn | In Batch 2 (or earlier if GitHub announces a date), upgrade Playwright to a version that supports Ubuntu 26.04, and re-baseline the journeys and the accessibility harness on it as one change |
| Node 20 actions (`checkout@v4`, `setup-node@v4`, `upload-artifact@v4`, `github-script@v7`) run on Node 24 by force | Works today (warning); fails when GitHub removes the shim | Bump to their Node 24 majors in Batch 1 as a separate, CI-proven change |
| Supabase CLI 2.117 (2.122 available) | None observed | Leave (Phase 0 W0.2: the CLI bump is for later) |

## 7. CI minutes

**Billing: GitHub reports 0 billable ms** for this public repository (run usage of 41374792031). The 400-minute ceiling is a governance limit.

Measured runner minutes, all Batch 0 runs on the branch (compute / rounded up per job), are in deliverable 1 §4.
