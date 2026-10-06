# PINTAR 4.0 evidence model

**Adopted 1 October 2026 (D-084).** It replaces PASS as the primary readiness state. "63/84 PASS" is retired as a measure of readiness.

## 1. The five states

| State | Means |
|---|---|
| **BUILT** | The code is on `main`. Work on a lane or a gate branch, or held, is not BUILT. |
| **TESTED** | BUILT, and an **executable** Level 1 or Level 2 test has run the relevant behaviour successfully on that `main` commit. |
| **DEPLOYED** | TESTED, and staging is **confirmed by a machine read** to be running that exact code commit and migration set. |
| **JOURNEY-PROVEN** | DEPLOYED, and the **latest Level 3 Golden School run** on that deployed commit passed the journey unaided, from the front door, with no bypass. |
| **HUMAN-ACCEPTED** | JOURNEY-PROVEN, and the designated person walked the journey through the front door without technical help. The record holds the commit, the date and no blocking issue. |

**Below the ladder:**
- **NOT BUILT:** the code is not on `main`.
- **UNVERIFIED:** the evidence cannot even establish BUILT.

## 2. Rules

1. **The states form a ladder.** Each state requires all the states below it, and a row shows the highest state that is true.
2. **Every state is pinned to evidence:** a commit, a run (an id or URL), a time, the level, and who or what produced it.
3. **Nothing carries forward.** A new deployed commit with no run since is shown as unproven at JOURNEY-PROVEN. "PASS (unchanged)" no longer exists.
4. **The latest red supersedes earlier green.** A red latest run drops the row to the highest state that is still true.
5. **Human acceptance never outranks a red machine run.** It stays on record with its commit and date as history.

## 3. Precise meanings

- **"That commit".** Two commits whose trees differ only under `docs/coordination/` are the same code (D-034). Any other difference needs new evidence.
- **"Executable test".** A test that runs code: the `db` and `app` runners, a `static` test that executes a module, or a browser step that asserts an outcome.
  - **Does not count:**
    - a test that only reads source text;
    - a crawl that records pages without asserting anything;
    - code inspection;
    - a screenshot;
    - anything relayed by a person.
- **Operator-assisted evidence** (SQL, typed internal routes, service-role sessions, direct requests in place of screens):
  - may support BUILT or TESTED;
  - never supports JOURNEY-PROVEN;
  - a bypass in a Level 3 run is always a FAIL.
- **"Confirmed by a machine read".** DEPLOYED needs a machine read of the app's build commit and of the applied migration set, both at the time of the run.
  - Phase 2's environment-facts check will do this.
  - Until then, DEPLOYED can be claimed only with an equivalent recorded read. Today none exists for the app's commit.
  - [6 Oct: the check exists. `environment-facts.yml` runs nightly and on dispatch, for example run 37438389611.]
- **Universal rows** (navigation, truthfulness, language, and others) cannot be proven by examples. They are TESTED only when a test covers the rule, not a sample.
- **Partly tested.** A row is TESTED only when its whole expected behaviour was run. Otherwise it stays BUILT, with the tested part named.
- **Clicking (K3, 1 Oct).** A Level 2 slice and the Golden School reach each page by clicking from the previous one.
  - In Level 3, a typed URL is a bypass and therefore a FAIL.
  - In Level 2, a typed URL must be declared, and the step it replaces cannot prove the connection.

## 4. Test levels (implemented in Phase 2)

| Level | What | When | Where |
|---|---|---|---|
| **1** | Component and security tests (lint, typecheck, build, unit, RLS, tenancy, authorization, concurrency, integrity, cryptography) | Every relevant change, before merge | CI, local stack |
| **2** | A browser slice of each journey the change touches. A file-to-journey map decides which; if unclear, all slices run | Before merge | CI, local stack (branches are not deployed, D-062(a)) |
| **3** | The complete Golden School (`GOLDEN-SCHOOL-CONTRACT.md`) | **On dispatch, at the controlled points (D-120, QN6):** after each closure slice that changes what a Golden School step covers (the affected steps), before each gate (the whole walk), and before a release. Never automatically on a merge and never nightly. Documentation-only changes never trigger it | Deployed staging. The commit and migration set are read before and after the run (GOLDEN-SCHOOL-CONTRACT «Status»); asserting them inside the run is CR-60 |

[6 Oct, corrected by D-120: this row said «every merge to `main` that changes `src/` or `supabase/`; nightly». Level 3 never ran that way. It runs on dispatch, by editing a request file, and the model now says so rather than claim evidence that is not produced.]

## 5. Trusting a test or an instrument

- **Every new journey test and every new truth instrument must first show, once, that it can fail.** It runs against a deliberately broken step and goes red, and that controlled red is recorded before its green counts.
- **Where:** only in controlled environments (the local stack or staging). Never by an experiment on production.
- **The pattern** is the existing red-case "plant" practice, applied to journeys.

## 6. Reporting

- **The headline is the journey status,** in this order:
  1. Journey;
  2. BUILT, TESTED, DEPLOYED, JOURNEY-PROVEN, HUMAN-ACCEPTED;
  3. Current break;
  4. Evidence commit;
  5. Evidence run and time.
- **"Current break"** is the first unaided failure in the latest Level 3 run.
  - Steps explored beyond it through labelled bypasses stay FAIL.
  - The headline is how far PINTAR travelled unaided.
- **Status is generated from runs** wherever possible (Phase 2). Only HUMAN-ACCEPTED is recorded by hand: who, the commit, the date, and any blocking issue.
- **Checklist rows remain as engineering detail,** labelled with these states. PASS counts are never reported as readiness.
