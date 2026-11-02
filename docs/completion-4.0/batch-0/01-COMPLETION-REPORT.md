# Batch 0 · Deliverable 1 · Completion report (2 Nov 2026)

**Authorisation:** «PINTAR 4.0 — CONDITIONAL AUTHORIZATION · Batch 0 · Verification Infrastructure and Phase 0 Corrections» (owner, 2 Nov).

**Directive received during the batch:** D-144 (future roadmap architecture). Recorded; no scope change.

**Branch:** `claude/awesome-rubin-bqxp6p`. Nothing merged to `main`, nothing deployed, staging and production untouched.

**These are development-branch results against local stacks. They are not a staging, Golden School or production verification.**

## 1. Outcome by work item

| Item | Status | One line | Deliverable |
|---|---|---|---|
| **B0-A** CI compatibility | **VERIFIED — INTERNAL ACCEPTANCE PENDING** (branch) | Image verified by probe. `ci.yml` green unchanged on Ubuntu 26.04. Playwright 1.55 cannot install a browser there, so 17 browser jobs were pinned to `ubuntu-24.04`. Journeys green after the pin. 14 pinned workflows not exercisable in Batch 0 | 02 |
| **B0-B** Accessibility harness | **VERIFIED — INTERNAL ACCEPTANCE PENDING** (harness); baseline recorded, **not clean** | axe, title, skip link, keyboard walk, overflow and clipping at 320/640/1024/1280 px. The same figures locally and in CI | 03 |
| **B0-C** Public-repository safeguards | **VERIFIED — INTERNAL ACCEPTANCE PENDING** | Full reachable history scanned: **0 credentials**. Answer keys inventoried (43 + 4; two hidden in `audit/fixtures/`). Guard, hook and SEC-G01/G02 proven red then green | 04 |
| **B0-D** Evidence | **DONE** | This report; run ids §3 | 01, 02, 03, 04 |
| Corrections 1–6 | **DONE** (documents); owner decisions open | Visibility; F-4 plan; critical path; Migration 162 brief; acceptance before production; terminology brief | 05, 06 (= E), 07, 08 |
| Batch 1 entry conditions | **DONE** | START: S-1 … S-7; MERGE: M-1 … M-4 | 09 |
| GO / NO-GO | **DONE** | GO for the owner to authorise Batch 1 once F-3, F-4a/b and an allowance are given | 10 |

**Deliverable 6 is E itself**, rewritten in place: batches 9–11 reordered; schedule, lanes, critical path and assumptions. There is no duplicate plan or register.

## 2. Findings that change earlier statements

1. **CI was not broken by the runner change.** The 9 Oct run was green; nothing had run since. The real incompatibility was narrower: Playwright on Ubuntu 26.04. Corrected in A, B, C, D, E, G.
2. **Two real chapters sat under `audit/fixtures/`.** A path-based allowance would have hidden live answer keys. The guard now requires every keyed file to be declared, wherever it sits.
3. **A database stopped at migration 162 runs neither app.** The production app breaks in four places; the candidate needs 163–177. F-5 is restated: upgrade once, to the full candidate, rehearsed on a restored copy.
4. **Dr Gladys's universal terms reverse v1 rows** (Institusi, Pendidik and Peserta Didik are v1 Replace words). Her proposal is not yet recorded in her own words; a written question set is ready.
5. **A new accessibility finding:** learner screens are 674–675 px wide in a 640 px window (1280 at 200 % zoom). The 320 px check could not see it. Added to W3.10.

## 3. Verification evidence

| What | Where | Result |
|---|---|---|
| Runner probe | 41374709799, 41374792031 | Both images described; local stack and 177 migrations work on both |
| CI | **41375753148** (0fb65bb) | **18/18; selftest 661 passed, 0 failed, 0 skipped** |
| Journeys before the pin | 41377378758 (c1a2c22) | Red: browser install on 26.04 (the finding) |
| **Journeys after the pin** | **41377773745** (871767d) | **Green**: A crawl 14.1 min, B Dr Gladys's path 29.3 min. A11y baseline in the step summary identical to the local run |
| **Final CI on the Batch 0 head** | **41378821622** (1a040d4) | **18/18; selftest 661 passed, 0 failed, 0 skipped** |
| Local | this container | tsc 0; eslint 0 (4 pre-existing warnings); full selftest **660/0** + 1 CI-only justified skip; job-A replica crawl GREEN |
| Security scan | local, `sensitive-scan --history` + entropy sweep | 0 credentials (deliverable 4) |
| Staging (read only) | one aggregate count | 0 synthetic or bootstrap accounts on staging |

## 4. CI minutes

**Billing:** 0 billable ms (public repository, D-143; GitHub run usage).

| Run | Runner-minutes (compute) | Rounded up per job |
|---|---:|---:|
| 41374709799 runner probe | 0.2 | 2 |
| 41374792031 runner probe + stack | 6.9 | 10 |
| 41375753148 ci | 51.2 | 61 |
| 41377378758 audit-journeys (red, the finding) | 6.0 | 8 |
| 41377773745 audit-journeys (after the pin) | 43.4 | 45 |
| 41378821622 ci (Batch 0 head) | 50.8 | 61 |
| **Total** | **158.5** | **187** |

**Ceiling 400: 187 used (47 %), 213 unused.** One full verification cycle measured here (CI ≈ 61 + journeys ≈ 45 = **≈ 106**, rounded up) sets E's per-batch figure. The Golden School walk (≈ 50, D-139 ledger) is in addition and was not run in Batch 0.

## 5. Environment and credential limitations

- **No staging or production verification** was authorised. The Golden School walks, staging facts and production watch were not run.
- **14 pinned workflows were not exercised** (they write to staging or run from `main`).
- **Branch protection cannot be read or set from this session.** The owner sets and confirms it (M-1).
- **gitleaks could not be downloaded** («Code from External» refused). The scan used the in-repository scanner plus an independent entropy sweep.
- **The repository clone is shallow** (64 commits locally; the history scan fetched every branch and PR ref, 1,547 commits). Velocity could not be measured from git, so the schedule's durations are stated assumptions (E).
- **My own setup errors during local verification**, recorded so the figures are understood:
  - the first local suite runs had the mail-sink port held by the stack's own mail container, and then a stale app on port 3999;
  - the 30 failures they produced were environment, not code (shown by CI 661/0 and the clean local rerun 660/0);
  - one cleanup trap failed harmlessly; `supabase/config.toml` is unchanged.
- **Observed, not investigated** (left for Batch 1 triage):
  - 5 HTTP 500s on `/api/assets/read-url` for seeded lesson media in the local crawl;
  - «The destination stream closed early» lines in job B's server log;
  - the job still passed.

## 6. What happens next

**STOP.** Batch 1 does not start until the owner authorises it (deliverable 9). The recommendation and the open decisions are in deliverable 10.
