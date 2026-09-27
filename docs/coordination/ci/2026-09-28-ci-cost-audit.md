# CI cost and efficiency audit (28 Sep 2026)

Requested by Yazid on 28 Sep. The principle: **keep the assurance, remove the unnecessary work.** This page is investigation only; nothing in CI has been changed.

## Method

- **Source:** GitHub's Actions API. Every run created 21–28 Sep (207 runs), with every job of every attempt, its runner labels and its start and finish times.
- **Billed minutes** are counted per job, each rounded **up** to the whole minute, which is how GitHub bills.
- **Runner:** every job ran on `ubuntu-latest`. There are no larger or paid-tier runners.
- **The billing check:** Yazid's dollar figures divided by these minutes give $0.0052–0.0060 per minute on every day, consistent with GitHub's Linux 2-core rate. So the minute counts track the bill. The `/timing` endpoint reports 0 ms for this repository, so it was not used.

## A. Where the money went on 24 Sep (about $16.93, about 3,234 billed minutes)

| Workflow | Runs | Billed min | Share |
|---|---|---|---|
| `ci` | 35 | 2,928 | **91%** |
| audit · end-to-end journeys | 17 | 228 | 7% |
| content · draft transcripts | 1 | 39 | 1% |
| staging, credential audit, other | 22 | 39 | 1% |

**One green CI run** costs **88 billed minutes at the median** (70–99 across 21 green runs), about **$0.50**. It runs 26 jobs in parallel. CI #204 (28 Sep, 70 job-minutes before rounding), broken down:

| Part of the run | Share |
|---|---|
| **Starting a fresh local Supabase stack, then migrations and seed** | **30%** |
| Checks and tests (the assurance) | 51% |
| `npm ci` | 11% |
| Build | 3% |
| Runner overhead | 2% |

- **The stack boots:** **16 of the 26 jobs** are `red case · db-*` jobs, and each boots its own stack, taking about 2.5–3 min per boot.
- **Rounding:** 6 jobs take under a minute each but are billed a full minute each.

**How 24 Sep's 35 CI runs split.** These views overlap, since a run can be both cancelled and pushed, so they don't add up.

| View | Runs | Billed min | Notes |
|---|---|---|---|
| Triggered by a **push**, main and lanes | 11 | 635 | For example, `b5f8cb5` was tested twice, #158 on the coordinator lane and #159 on main; likewise `8956259`, #155 and #157 |
| Lane dispatches | 20 (Bob 9, Daisy 11) | 1,932 | Several runs per ticket, while fixing in CI |
| Gate (integration) runs | 4 | 361 | |
| **Whole-workflow reruns** | 3 runs | **371 extra** | #161 ran 4 attempts and was then cancelled |
| Cancelled | 7 | 618 | |
| Failed | 5 | 247 | |

**The case that cost most for nothing:** in **#168**, only the 1-minute `install · lint · typecheck · build` job failed, and **the other 25 jobs still ran, 72 billed minutes in all.**

**The days around it:**

| Day | Billed min | $ (Yazid) | CI runs |
|---|---|---|---|
| 22 Sep | 1,023 | 6.15 | 15 |
| 23 Sep | 1,492 | 8.77 | 25 (**24 pushed** from lanes) |
| **24 Sep** | **3,234** | **16.93** | 35 |
| 25 Sep | 664 | 4.01 | 7 |
| 27 Sep | 812 | 4.36 | 8 |

## B. Necessary cost: independent assurance (REQUIRED)

- **One CI run per lane hand-off.** It is the lane's own evidence, on the lane's exact code.
- **One gate CI run per integration that combines lanes.** The combined tree is code no lane has tested; Integration 11 is an example.
- **One audit per gate.** An end-to-end journey on a clean stack, independent of CI.
- **Failed runs that caught real defects.** For example, #177 (the FABLE-05 gates) and #194 (the selftest contract).
- **The 16 red-case jobs' planted defects and every migration check.** Each proves that its gate goes red for the right reason. Keep all of them.

## C. Waste and redundancy

| # | Finding | Evidence | Class | Status |
|---|---|---|---|---|
| W1 | CI on every push to a lane, and again on main for the same commit | 24 Sep: 11 runs, 635 min; 23 Sep: 24 pushed runs | REDUCIBLE | **Fixed on 24 Sep** (D-025: lanes dispatch only; D-043: `[skip ci]` on board commits, and a lane's run is reused when main moved only by documents). **No pushed CI run since 25 Sep.** |
| W2 | Whole-workflow reruns | 371 extra min on 24 Sep | REDUCIBLE | **Fixed on 24 Sep** (D-043: diagnose before any rerun). **No reruns since 25 Sep.** |
| W3 | Iterating in CI instead of locally | Daisy 11 and Bob 9 runs on 24 Sep | REDUCIBLE | **Fixed on 24 Sep** (D-043: local first, one run per hand-off). 7–8 runs a day since. |
| W4 | A cheap check fails but the heavy jobs run anyway | #168: 72 min for a 1-minute failure; #163 and #164 | REDUCIBLE | **Open**, see S1 |
| W5 | Sub-minute jobs billed a full minute each, each with its own `npm ci` | 6 jobs per run | REDUCIBLE | **Open**, see S2 |
| W6 | `npm ci` from scratch in 25 jobs | about 7.6 min per run | REDUCIBLE | **Open**, see S3 |
| W7 | 16 separate stack boots per run | about 21 min per run (30%) | UNCERTAIN | **Open**, see S4; Bob to establish |
| W8 | The app is built twice per run (the check job, then the selftest job) | about 2 min per run | UNCERTAIN | Marginal: passing the build between jobs costs time too |

**The expensive days were mostly temporary, process-driven cost (W1–W3),** and the 24–25 Sep process changes have already removed it. The **structural cost** is about 88 billed minutes per CI run. It stays with every future hand-off, which is where S1–S4 act.

## D. Proposed optimizations (none made yet)

| # | Now | Proposed | Saving | Why assurance is unchanged | Risk | How it's verified |
|---|---|---|---|---|---|---|
| **S1** Fail fast | All 26 jobs start together | The 25 heavy jobs wait for `install · lint · typecheck · build` (about 1.5 min) | A failing lint, type or build costs about 2 min instead of 70–90 (24 Sep: about 110 min). Green runs: nothing saved, and about 1.5 min slower. | Every job still runs whenever the cheap job passes. A heavy job's own failure is unaffected. | Low. One cost: when lint fails, the heavy results arrive only on the next run, which is needed anyway. | One run with a planted lint error must stop at about 2 min. One green run must still run all 26 jobs. |
| **S2** Group the static red cases | 6 sub-minute jobs, each with `npm ci` | One job, each case its own step with `if: always()`, so every verdict still runs and reports | About 5–6 billed min per run (about 6%) | The same cases and the same "red for the right reason" checks, each still in its own process. These cases share no state. | Low | Plant each static defect: its own step must go red, and the others must still run. |
| **S3** Cache dependencies | `npm ci` from scratch in 25 jobs | Restore `node_modules` from a cache keyed on `package-lock.json`, falling back to `npm ci` | About 4–5 min per run, if restoring beats installing (to be measured) | The same lockfile gives the same dependencies, and any lockfile change misses the cache | Low | Time one run before and after, and a lockfile change must miss the cache. |
| **S4** Share stacks between db red cases (Bob to establish) | 16 stack boots | Group the DB plant sets that are applied and removed in isolation onto shared stacks. Cases needing a defective migration at boot keep their own stack. | Up to about 15–20 min per run (20–25%) | Only if each plant is fully removed before the next one, which must be proven and not assumed | **Medium.** A leftover plant could mask another gate's red. | Every plant must still turn its gate red, and a clean recheck must be green between groups. |

**Not proposed:**
- merging lane CI into the gate;
- skipping the gate for integrations that combine lanes;
- path filters on migration, RLS or security jobs (a workflow-level `paths:` filter was already rejected in `ci.yml` for this reason);
- deleting any red case or selftest.

## E. What 24 Sep would have cost

This is an estimate: the evidence doesn't allow an exact figure.

- **Under today's process (W1–W3 fixed), with S1–S3:** about 17 necessary CI runs (about 13 lane hand-offs and 4 gates) at about 77 min each is about 1,310 min. Add about 120 min of audits and 78 min of other work: **about 1,500 billed minutes, roughly $8–9 instead of $16.93.** Most of that saving is already real: 25 and 27 Sep cost $4.01 and $4.36.
- **Per run going forward:** about $0.50 today, about $0.44 with S1–S3, and about $0.35 if S4 proves safe.

## F. Plan and gate impact

- **S1–S3** keep every job, check and red case. They change only order (S1), grouping of static steps (S2) and caching (S3). The canonical gates, lane responsibilities, the integration process (D-043), the audit's independence, staging and release are unchanged.
- **Recommended:** S1–S3 as one small, verified CI change, **after the pre-5-Oct work.** They're low-risk but touch the gate's own machinery, so not during the week before testers.
- **S4** changes the job topology. It needs Bob's evidence, then a recorded decision, after 5 Oct.
- **Temporary versus structural:**
  - The 22–24 Sep spike was temporary. It came from integration-period process, and that process is already fixed.
  - The structural cost is about 88 billed minutes per CI run. At normal pace, 4–6 runs a working day, that is about $45–65 a month: close to the $50 budget before any audits. That is why S1–S4 matter after 4.0.
