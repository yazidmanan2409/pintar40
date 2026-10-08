# 06 · Tests, audits and evidence

**As of:** 8 Oct 2026. `main` = `8202139` (its code is the same as `dab5c12`).
**How this was made.** Read only, from the repository and from GitHub run metadata (GET requests only). No test, audit or workflow was run for this document.

Markers used below:
- **[verified]**: read in this session, from the file or run cited;
- **[from facts]**: from the coordinator's fact sheet of 8 Oct;
- **[unverified]**: inferred, or not checked.

**The evidence rule.** `docs/recovery/EVIDENCE-MODEL.md` (D-084) defines a ladder of five states:
1. **BUILT**: the code is on `main`.
2. **TESTED**: an executable test passed on that `main` commit.
3. **DEPLOYED**: staging is machine-read to run that commit and its migrations.
4. **JOURNEY-PROVEN**: the latest Level 3 Golden School run on that deployed commit passed.
5. **HUMAN-ACCEPTED**: the designated person walked it unaided.

Nothing carries forward to a new commit, and the latest red supersedes an earlier green. Read that file before you claim any state.

---

## 1. The test system (`selftest/`)

### 1.1 The runner and the manifest

- **The runner** is `selftest/run.ts` (`npm run selftest` = `npx tsx selftest/run.ts`). It runs **exactly** the manifest. It exits non-zero when:
  - any test fails;
  - any manifest id goes unreported;
  - a runner reports an id the manifest does not list;
  - any test is skipped. A skip is accepted only with `--accept-justified-skips`, and only where the manifest gives a `skip_justification`.

  The flags are listed in 05 §2.6.
- **The manifest** is `selftest/manifest.json`: contract `pintar-selftest`, **version 185**, **651 entries** [verified]. Each entry has `id`, `runner` and `proves`, and some also have `skip_justification`, `requires` or `how`.

| Runner | Entries | What it runs |
|---|---|---|
| `static` | **298** | `selftest/static.test.ts` (plus the per-work-item `*.test.ts` files it pulls in): the repository and the production build. No database, no network |
| `db` | **296** | `selftest/db/*.sql` (**24 files**: `fable01.sql` … `fable22.sql`, `fable05t1_quick_canonical.sql`, `fable05t2_evaluation.sql`), applied with `psql` to `$SUPABASE_DB_URL`. Two concurrency legs (F02-C01, F07-C01) run over two real connections from `run.ts` |
| `app` | **57** | `selftest/app.test.ts`: black-box HTTP against a production-mode `next start` and the local Supabase Auth and Storage, with real persona JWTs |

- **Test contracts.** Each id names its phase and kind, for example:
  - `F06-S04`: a FABLE-06 **S**tatic test. It proves that every static or app test's `proves` string names the artefact its predicate inspects, so the manifest's own metadata is tested.
  - `F01-T13`: the schema lint (every table has RLS; see 05 §2.5).
  - `F17-N01`: a refusal test.
  - `L4-C01` (`selftest/l4.test.ts`): no `xlsx`, `xlsm`, `xls`, `csv` or `json` under `public/`, and no link to one from the upload panel.
  - `PENUTUPAN-M04`.

  Work-item test files sit beside each other in `selftest/` (`bob*.test.ts`, `l4.test.ts`, `penutupan.test.ts`, …; 96 entries in the folder).
- **Plants (controlled reds)** are SQL defects: `selftest/plants/*.sql`, declared in `selftest/plants/plants.json`. `npm run plants -- list|run --gate=<gate>` runs them (`scripts/dev/README.md`). CI uses the same harness.
- **The development loop** (`scripts/dev/README.md`) runs targeted tests first (`npm run selftest:only -- 'F07-*'`), then the full manifest **once** as the completion gate, then CI once.

### 1.2 Red cases in CI

The `ci.yml` job `red-case` has **11 matrix groups covering 30 cases**:
- 5 static cases;
- `db-table-without-rls`, on its own;
- 5 grouped db jobs.

Each case injects a deliberate defect: a permissive policy, a table without RLS, a raw-evidence read, a second engine, a second verification route, or gate defects for FABLE-04, FABLE-05, FABLE-06, ADR-0018, ADR-0020, WP1, WP7, WP8, BOB-xx and others. **The named check must go red for its own reason.** Selftest CI-W02 keeps the set equal to the 30 cases. A green CI run therefore means that the tests pass **and** that each guard can still fail. See `ci.yml` lines 233–1986.

### 1.3 Latest local result [from facts and the L4 report §9]

The coordinator's container, 8 Oct:

| Check | Result |
|---|---|
| Full selftest | **649 passed / 1 failed**. The failure was PENUTUPAN-M04. It was fixed in `dab5c12` by moving the example workbook to `docs/onboarding/contoh/`, after which M04 and L4-C01 passed on their own |
| Local crawl | Exit 0 |
| Local journeys | 74 PASS, S23q FAIL, BD11 blocked (it needs Firefox and WebKit) |

649 + 1 = 650 against 651 manifest entries. The facts do not explain the missing one **[unverified]**.

---

## 2. The audit system (`audit/`)

`audit-journeys.yml` is **dispatch only** (D-012: run on the candidate at the gate; D-025: never on push). It runs the release's own code in production mode on port 3999 against a **local** Supabase stack on the runner. It never touches production or staging. Input `plant` (none/crawl/journey/both) is the controlled red (EVIDENCE-MODEL §5). `supabase/config.toml` is edited inside the runner only (05 §2.2).

| Job | Script | What it does |
|---|---|---|
| **A** "every role's screens in the seeded world" | `audit/crawl.mjs` (305 lines) | Signs in **14 personas** (SYSTEM_ADMIN, INSTITUTION_ADMIN, DEAN, HEAD_OF_DEPARTMENT, EDUCATOR, STUDENT, across the demo, demo+data and official schools) with real GoTrue sessions. Walks every internal link breadth first, up to `MAX_PAGES` (default 45) per persona. **Read only, nothing submitted.** Records status, refusal and error pages, console errors, failed requests and screenshots. Re-checks **each page at 320 px wide**: a page wider than the window is broken (X.6, U-DEVICE, D-046). Also checks for raw figures such as `0.75` (W9) |
| **B** "Gladys's path from an empty production-like database" | `audit/journey.mjs` (4,303 lines) plus `audit/c12.mjs` | Migrations only, no seed, as in production: one SYSTEM_ADMIN and two real schools. Each `step(id, title, fn)` records PASS / FAIL / BLOCKED with what was observed and a screenshot. Operator-done steps are marked OPERATOR. Mail goes to a Mailpit sink. BD11 runs on Chromium, Firefox and WebKit. The code has **77 `step(` call sites: 66 in `journey.mjs` and 11 (C12a–C12k) in `c12.mjs`** [verified]. The latest run reported **76 verdicts** (75 PASS + 1 FAIL). Why one call site produced no verdict is **[unverified]** |

### 2.1 Staging walks (`audit/staging/`)

These run against **hosted staging**, from the `staging-*` workflows, which are started by request files (05 §1.4). Scripts:
- the Golden School walks: `golden-school.mjs`, `golden-school-admin.mjs`, `golden-school-murid.mjs`, `golden-school-laporan.mjs`;
- the human and operator setups: `human-setup.mjs`, `platform-operator.mjs`;
- the other walks: `journey.mjs` (D-050), `bantuan-browser.mjs`, `kode-ulang.mjs`, `kode-ulang-walk.mjs`;
- helpers: `masuk.mjs` (sign-in helper), `pendataan.mjs`, `mailbox_link.py`.

### 2.2 The Golden School (Level 3)

**The contract** is `docs/recovery/GOLDEN-SCHOOL-CONTRACT.md` §5. It defines the spine GS-00 … GS-22, from founding the school to recovery and a late-added learner.
- **GS-00 is a machine precondition.** Every walk first calls `environment-facts.yml` with scope `staging` and stops unless staging runs `main`'s commit and migrations (CR-60).
- **A typed URL in Level 3 is a bypass, and a bypass is a FAIL** (EVIDENCE-MODEL §3).

**Latest Golden School runs** [verified via the API]:

| Workflow | Run | Commit | Time (UTC) | Result |
|---|---|---|---|---|
| `staging-golden-school.yml` | 37743344493 | `7e4d6c4` | 8 Oct 07:25 | success (cited in D-133(a)) |
| `staging-golden-school-admin.yml` | 37709418935 | `6174f50` | 8 Oct 00:45 | success |
| `staging-golden-school-murid.yml` | 37710220867 | `06c388d` | 8 Oct 00:54 | success |
| `staging-golden-school-laporan.yml` | 37710983410 | `e9e7793` | 8 Oct 01:03 | success |

**No Golden School walk has run since staging moved to `dab5c12`.** Under EVIDENCE-MODEL rule 3 (nothing carries forward), `dab5c12` is therefore not JOURNEY-PROVEN on staging. Confirm this reading with the owner before you claim otherwise.

---

## 3. The CI evidence model

- **E1 proof reuse** (D-128(b), D-133(g); `audit/ci/proof-reuse.mjs`). See 05 §1.1–1.2. The pattern is:
  1. dispatch CI on the working-branch head;
  2. fast-forward `main` to the same commit;
  3. main's push run cancels as **ALREADY PROVEN** and names the earlier run.

  The deploy gates look up `ci.yml` runs with `head_sha=<release>&status=success` (`deploy-*-production.yml` line 105). They find the dispatch run, because it ran on the identical SHA. **A `cancelled` main run is expected and is not a failure.** It is not evidence on its own either: the evidence is the run it names.
- **`verdict` job.** A run is green only when every job ran and succeeded. A skipped or cancelled job makes the run fail. `success` is the only conclusion that counts.
- **Annotations** that `audit-journeys.yml` writes as `::notice` lines, visible on the run page:

  | Annotation | Written by | Meaning |
  |---|---|---|
  | **«Crawl A GREEN»** | `audit/crawl.mjs` line 292 | Job A found no broken page for any persona, 320 px included. Otherwise the annotation reads «Crawl A RED, n broken», followed by up to 10 «Crawl A broken ×n» errors |
  | **«Journey B tally»** | `audit/journey.mjs` line 4293 | A JSON count of verdicts by kind (PASS / FAIL / BLOCKED …) |
  | **«Journey B verdicts»** | `audit/journey.mjs` line 4294 | The list `<step id> <verdict>` for every step |

  The same appears in the step summary as «### Crawl A: GREEN|RED» and «### Journey B: GREEN|RED, n step(s) FAIL or BLOCKED».
- **The run conclusion of `audit-journeys.yml` is `failure` while S23q fails.** That is expected under D-123 and D-133(b). Read the verdicts: the accepted state is **"crawl GREEN; job B 75 PASS, 1 FAIL (S23q)"**, and it is never "fully green" (L4 report §9).

---

## 4. The latest evidence

| What | Run | Commit | Result | Source |
|---|---|---|---|---|
| CI | **37775379355** (dispatch, working branch, 8 Oct 12:13 UTC) | `dab5c12` | success, **18/18 jobs** | D-136(a); API [verified: success] |
| Main's CI | 37782331321 (push, 13:10 UTC) | `dab5c12` | cancelled = ALREADY PROVEN (E1) | facts; API [verified: cancelled] |
| Journeys | **37775382999** (12:13 UTC) | `dab5c12` | Crawl A **GREEN**. Job B **75 PASS, 1 FAIL**: **S23q** (CR-52, governed exception under D-123; **not a pass**). BD11 PASS on three engines. Run conclusion `failure` (expected; §3) | D-136(a); L4 report §9; API [verified: failure] |
| Environment facts | **37782586725** (dispatch on `main`, 13:12 UTC) | `dab5c12` | success. **Staging:** `dab5c12`, 177/177 migrations, GREEN. **Production:** `5b5b68d`, 111 migrations at that commit, database not read | facts; API [verified: success] |

The open items behind this evidence are listed in 07; S23q / CR-52 is one of them.

---

## 5. The CI allowance

- The figures: **1,792 of 1,900 minutes used, 108 left**. They were counted from **2026-10-06T12:20:23Z** (D-136(d); L4 report §9; `docs/reports/PINTAR-4.0-MORNING-HANDOFF-2026-10-08.md` line 29).
- **This is the coordinator's estimate method, not GitHub billing.** The estimating script is not in the repository **[unverified how it rounds]**.
  - The start instant equals the creation time of environment-facts run 37462540525. Why that anchor was chosen is not recorded.
  - `actions-spend.yml` / `audit/ci/actions-spend.mjs` is a separate daily report of billed minutes per workflow (D-090). Its figures may differ.
- **A full cycle (CI + journeys) costs about 125–147 minutes**, so it does not fit in what is left. D-136(d): a further allowance is the owner's to grant, and **until then no CI is dispatched**; local verification continues. Get the owner's word on the allowance before your first dispatch.

---

## 6. Independent reviews and audits: index

"The Second Eye" is the independent reviewer role in this project. Sometimes the owner acts in it ("Yazid, as Second Eye", D-107). Its verdicts are recorded in D-128, D-133 and D-136.

In the tables:
- **Added** and **Last** are git commit dates [verified with `git log`].
- **SE** is the number of times the file mentions «Second Eye».

The files were selected because they are under `docs/reports/`, or under `docs/coordination/` with "review" or "audit" in the name. In all, 119 files under those two folders mention «Second Eye», «audit» or «review»; the tables give the review and audit ones.

### 6.1 Closure, L1–L4 and Second Eye verdicts

| Path | Added | Last | SE | What |
|---|---|---|---|---|
| `docs/reports/PINTAR-4.0-CLOSURE-L4-2026-10-08.md` | 2026-10-08 | 2026-10-08 | 7 | L4. Second Eye AMBER (findings 1–8), then AMBER-light (N1–N4), then **GREEN** (§7–§9) |
| `docs/reports/PINTAR-4.0-CLOSURE-L3-2026-10-08.md` | 2026-10-08 | 2026-10-08 | 5 | L3 closure; Second Eye final review |
| `docs/reports/PINTAR-4.0-CLOSURE-L3-ADDENDUM-2026-10-08.md` | 2026-10-08 | 2026-10-08 | 5 | L3 addendum |
| `docs/reports/PINTAR-4.0-L3-CRITERIA-AUDIT-2026-10-08.md` | 2026-10-08 | 2026-10-08 | 1 | L3 criteria audit |
| `docs/reports/PINTAR-4.0-L3-BOB19-OPTION-B-EVIDENCE-2026-10-08.md` | 2026-10-08 | 2026-10-08 | 5 | BOB19-K01 Option B evidence; §8 is the final review |
| `docs/reports/PINTAR-4.0-L3-BOB19-OPTION-B-PLAN-2026-10-08.md` | 2026-10-08 | 2026-10-08 | 1 | Plan reviewed by the Second Eye |
| `docs/reports/PINTAR-4.0-L3-WORKING-CONTEXT-DESIGN-2026-10-07.md` | 2026-10-07 | 2026-10-08 | 2 | L3 design (D-132), reviewed before any code |
| `docs/reports/PINTAR-4.0-CLOSURE-L1-2026-10-07.md` | 2026-10-07 | 2026-10-07 | 2 | L1 |
| `docs/reports/PINTAR-4.0-CLOSURE-L2-2026-10-07.md` | 2026-10-07 | 2026-10-07 | 2 | L2 |
| `docs/reports/PINTAR-4.0-D127-WORKING-CONTEXT-AND-CLOSURE-STREAMS-2026-10-07.md` | 2026-10-07 | 2026-10-07 | 7 | D-127 closure streams |
| `docs/reports/PINTAR-4.0-DG-19-37-INVESTIGATION-2026-10-07.md` | 2026-10-07 | 2026-10-07 | 1 | DG investigation |
| `docs/reports/PINTAR-4.0-BATCH-4-WALK-SHEET-2026-10-07.md` | 2026-10-07 | 2026-10-07 | 1 | Batch 4 walk sheet |
| `docs/reports/PINTAR-4.0-MORNING-HANDOFF-2026-10-08.md` | 2026-10-08 | 2026-10-08 | 1 | Morning handoff, 8 Oct |

### 6.2 Closure register and status

| Path | Added | Last | SE | What |
|---|---|---|---|---|
| `docs/reports/PINTAR-4.0-CLOSURE-REGISTER-2026-10-06.md` (+ `.pdf`) | 2026-10-06 | 2026-10-07 | 9 | The closure register (CR rows) |
| `docs/reports/PINTAR-4.0-CLOSURE-STATUS-2026-10-07.md` | 2026-10-06 | 2026-10-06 | 0 | Status of the register |
| `docs/reports/PINTAR-4.0-CLOSURE-BATCH-0-2026-10-06.md` | 2026-10-06 | 2026-10-06 | 0 | Batch 0 |
| `docs/reports/PINTAR-4.0-CLOSURE-BATCH-3-2026-10-06.md` | 2026-10-06 | 2026-10-06 | 0 | Batch 3 |
| `docs/reports/PINTAR-4.0-CLOSURE-BATCH-3B-2026-10-07.md` | 2026-10-06 | 2026-10-07 | 0 | Batch 3B |
| `docs/reports/PINTAR-4.0-COMPLETE-STATUS-2026-10-06.md` (+ `.pdf`) | 2026-10-06 | 2026-10-06 | 6 | Complete status, 6 Oct |
| `docs/reports/PINTAR-4.0-OWNER-RULINGS-2026-10-06.md` (+ `.pdf`) | 2026-10-06 | 2026-10-06 | 1 | Owner rulings |
| `docs/reports/PINTAR-4.0-Q10-GRADE-LABELS-2026-10-06.md` (+ `.pdf`) | 2026-10-06 | 2026-10-06 | 3 | Q10 grade labels |

### 6.3 Independent reviews and audits, 28 Sep – 5 Oct

| Path | Added | Last | SE | What |
|---|---|---|---|---|
| `docs/reports/PINTAR-4.0-INDEPENDENT-REVIEW-2026-10-01.md` | 2026-10-01 | 2026-10-01 | 0 | Independent review |
| `docs/reports/PINTAR-4.0-AUDIT-RESPONSE-TO-INDEPENDENT-REVIEW-2026-10-01.md` | 2026-10-01 | 2026-10-01 | 1 | Response to it |
| `docs/reports/PINTAR-4.0-PROJECT-REALITY-AUDIT-2026-10-01.md` | 2026-10-01 | 2026-10-01 | 0 | Project reality audit |
| `docs/reports/PINTAR-4.0-CONVERGENCE-REVIEW-2026-10-01.md` | 2026-10-01 | 2026-10-01 | 0 | Convergence review |
| `docs/reports/PINTAR-4.0-EFFICIENCY-AUDIT-2026-10-02.md` | 2026-10-02 | 2026-10-02 | 0 | Whole-system efficiency audit (D-090, D-091) |
| `docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md` | — | 2026-10-06 | — | #150 backup/DR review. **Verdict NOT PASS** (B1–B7 with the owner) [from facts] |
| `docs/coordination/reviews/D-101-RECOVERY-AUTHORITY-CONFORMANCE.md` | 2026-10-05 | 2026-10-05 | 0 | D-101 conformance review |
| `docs/reports/ARCHITECTURE-HORIZON-REVIEW-2026-09-29.md` | 2026-09-29 | 2026-09-29 | 2 | Architecture horizon review |
| `docs/reports/POST-LOGIN-60S-UX-REVIEW-2026-09-29.md` | 2026-09-29 | 2026-09-29 | 1 | Post-login UX review (source of D-061) |
| `docs/reports/ROADMAP-STATUS-2026-09-29.md` (+ `.pdf`) | 2026-09-29 | 2026-09-29 | 1 | Roadmap status |
| `docs/reports/YAZID-DECISION-BRIEFS-2026-09-30.md` (+ `.pdf`) | 2026-09-30 | 2026-09-30 | 1 | Decision briefs |
| `docs/coordination/design/PASS-MARK-AND-GRADE-SEMANTICS-REVIEW.md` | 2026-09-30 | 2026-09-30 | 0 | Pass-mark semantics review |
| `docs/coordination/auth/2026-09-28-identity-login-architecture-review.md` | 2026-09-28 | 2026-09-29 | 0 | Identity/login architecture review |
| `docs/coordination/ci/2026-09-28-ci-cost-audit.md` | 2026-09-27 | 2026-09-28 | 0 | CI cost audit |
| `docs/coordination/ci/2026-09-28-ci-cost-audit-bob-review.md` | 2026-09-28 | 2026-09-28 | 0 | Bob's review of it |
| `docs/reports/FABLE-01-03-TEST-AND-FIX-REPORT.md` | 2026-09-12 | 2026-09-13 | 0 | Early test and fix report |

### 6.4 Other evidence

- **Second Eye mentions in `docs/coordination/`:** `DECISIONS.md`, `BOARD.md`, `walkthrough-gladys/EVIDENCE.md`, `walkthrough-gladys/OBSERVER-SHEET.md`, and the Daisy briefs (`briefs/DAISY-BATCH-4*-2026-10-07.md`, `briefs/DAISY-SERTIFIKAT-ROUND-*.md`, `briefs/DAISY-KARTU-PINTAR-ROUND-2.md`).
- **Golden School evidence per step:** `docs/recovery/GOLDEN-SCHOOL-CONTRACT.md` "Status, 6 Oct 2026".

---

## 7. Run index (GitHub Actions, read on 8 Oct with GET requests)

Branch `claude/awesome-rubin-bqxp6p` is the coordinator's working branch.

Read the conclusions this way:
- A `cancelled` push run on `main` right after a successful dispatch on the same SHA is E1 proof reuse (§3).
- `failure` on `audit-journeys.yml` since 6 Oct includes the governed S23q FAIL. Read the run's «Journey B verdicts» before you treat it as a regression.

### 7.1 `ci.yml`: last 40 of 367 runs

| Run ID | SHA | Created (UTC) | Event | Branch | Conclusion |
|---|---|---|---|---|---|
| 37782331321 | `dab5c12` | 2026-10-08 13:10Z | push | `main` | cancelled |
| 37775379355 | `dab5c12` | 2026-10-08 12:13Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37766144556 | `e7fb612` | 2026-10-08 10:50Z | push | `main` | cancelled |
| 37762170301 | `e7fb612` | 2026-10-08 10:14Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37743909195 | `9a37114` | 2026-10-08 07:30Z | push | `main` | success |
| 37742974393 | `bf18bc0` | 2026-10-08 07:21Z | push | `main` | cancelled |
| 37739842180 | `bf18bc0` | 2026-10-08 06:50Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37729629430 | `f27ffb3` | 2026-10-08 04:53Z | push | `main` | cancelled |
| 37726912124 | `f27ffb3` | 2026-10-08 04:19Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37722876255 | `36c89dd` | 2026-10-08 03:28Z | push | `main` | cancelled |
| 37720147696 | `36c89dd` | 2026-10-08 02:54Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37708857395 | `d66485e` | 2026-10-08 00:38Z | push | `main` | cancelled |
| 37703610493 | `d66485e` | 2026-10-07 23:40Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37595704726 | `0387286` | 2026-10-07 08:43Z | push | `main` | cancelled |
| 37592132508 | `0387286` | 2026-10-07 08:11Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37584213073 | `8ee3585` | 2026-10-07 06:55Z | push | `main` | cancelled |
| 37580997224 | `8ee3585` | 2026-10-07 06:20Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37551984401 | `bd4c0fa` | 2026-10-07 00:26Z | push | `main` | success |
| 37549911642 | `bd4c0fa` | 2026-10-07 00:03Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37493596839 | `9a46bf5` | 2026-10-06 16:10Z | push | `main` | success |
| 37489874488 | `9a46bf5` | 2026-10-06 15:43Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37486231374 | `a28b4d2` | 2026-10-06 15:17Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37483042122 | `bcc3b7a` | 2026-10-06 14:55Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37458146396 | `7912372` | 2026-10-06 11:42Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37455602363 | `0a27ec7` | 2026-10-06 11:19Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37453037724 | `3b1c89b` | 2026-10-06 10:55Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | cancelled |
| 37450773138 | `0d80c36` | 2026-10-06 10:35Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37450178108 | `d0d06cb` | 2026-10-06 10:30Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | cancelled |
| 37449744168 | `43d9438` | 2026-10-06 10:26Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | cancelled |
| 37447512132 | `2ae8230` | 2026-10-06 10:06Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37447501290 | `2ae8230` | 2026-10-06 10:06Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | cancelled |
| 37430770665 | `3a7501b` | 2026-10-06 07:36Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37430424265 | `dff288a` | 2026-10-06 07:33Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | cancelled |
| 37425505226 | `9631bf6` | 2026-10-06 06:45Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37421222152 | `f49280e` | 2026-10-06 05:58Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37416489180 | `df7c170` | 2026-10-06 05:01Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37415061854 | `c13589f` | 2026-10-06 04:43Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37412506567 | `cc2307e` | 2026-10-06 04:11Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37409454539 | `9133ffc` | 2026-10-06 03:32Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37401454517 | `e6cb045` | 2026-10-06 01:53Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |

### 7.2 `audit-journeys.yml`: last 40 of 115 runs

| Run ID | SHA | Created (UTC) | Event | Branch | Conclusion |
|---|---|---|---|---|---|
| 37775382999 | `dab5c12` | 2026-10-08 12:13Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37762173449 | `e7fb612` | 2026-10-08 10:14Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37739845001 | `bf18bc0` | 2026-10-08 06:50Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37726914297 | `f27ffb3` | 2026-10-08 04:19Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37720149799 | `36c89dd` | 2026-10-08 02:54Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37705723825 | `07bbf57` | 2026-10-08 00:03Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37703613326 | `d66485e` | 2026-10-07 23:40Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | cancelled |
| 37592135705 | `0387286` | 2026-10-07 08:11Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37581007813 | `8ee3585` | 2026-10-07 06:20Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37547178658 | `db62bd7` | 2026-10-06 23:33Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37531719996 | `e03e239` | 2026-10-06 21:08Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37487347244 | `0652d21` | 2026-10-06 15:25Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37366709177 | `514d826` | 2026-10-05 19:57Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37363240451 | `6a0df7a` | 2026-10-05 19:25Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37353180694 | `62a09b6` | 2026-10-05 18:04Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37348856438 | `4543c4c` | 2026-10-05 17:29Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37267985806 | `2d5e0bc` | 2026-10-05 05:29Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 37266092326 | `5e6dff4` | 2026-10-05 05:03Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37264373758 | `b04ec6d` | 2026-10-05 04:38Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37262466524 | `5e4e18f` | 2026-10-05 04:12Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37260826024 | `834ff26` | 2026-10-05 03:47Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37259694459 | `012b28d` | 2026-10-05 03:30Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 37258286723 | `577b4cd` | 2026-10-05 03:09Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 36971987994 | `7c76be5` | 2026-10-02 06:06Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 36957344279 | `38944b5` | 2026-10-02 02:48Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 36954714221 | `155c0d5` | 2026-10-02 02:14Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 36952453693 | `39806c7` | 2026-10-02 01:45Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 36950730580 | `cdfa12a` | 2026-10-02 01:23Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 36949669675 | `b7f3d66` | 2026-10-02 01:10Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 36947660368 | `30ca311` | 2026-10-02 00:46Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 36945887601 | `be0f767` | 2026-10-02 00:25Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 36943813231 | `6acf127` | 2026-10-02 00:00Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 36943034831 | `53af0ec` | 2026-10-01 23:51Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 36942147694 | `02ad871` | 2026-10-01 23:41Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 36940522441 | `948b506` | 2026-10-01 23:23Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 36936950209 | `4681f01` | 2026-10-01 22:45Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 36935810990 | `2d9a05e` | 2026-10-01 22:33Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |
| 36934008587 | `2aa16cd` | 2026-10-01 22:16Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 36932598674 | `d0836b8` | 2026-10-01 22:02Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 36854683142 | `a4bd5a3` | 2026-10-01 11:19Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | failure |

### 7.3 `environment-facts.yml`: all 28 runs

| Run ID | SHA | Created (UTC) | Event | Branch | Conclusion |
|---|---|---|---|---|---|
| 37782586725 | `dab5c12` | 2026-10-08 13:12Z | workflow_dispatch | `main` | success |
| 37766343961 | `e7fb612` | 2026-10-08 10:52Z | workflow_dispatch | `main` | success |
| 37743180546 | `bf18bc0` | 2026-10-08 07:23Z | workflow_dispatch | `main` | success |
| 37730111943 | `f27ffb3` | 2026-10-08 04:59Z | workflow_dispatch | `main` | success |
| 37723418842 | `36c89dd` | 2026-10-08 03:35Z | workflow_dispatch | `main` | success |
| 37703052434 | `886554b` | 2026-10-07 23:34Z | schedule | `main` | success |
| 37544292482 | `b5be891` | 2026-10-06 23:02Z | schedule | `main` | success |
| 37529584356 | `b5be891` | 2026-10-06 20:51Z | workflow_dispatch | `main` | success |
| 37462540525 | `d9d2187` | 2026-10-06 12:20Z | push | `claude/awesome-rubin-bqxp6p` | success |
| 37438389611 | `12b480b` | 2026-10-06 08:46Z | workflow_dispatch | `main` | success |
| 37437396764 | `a64b9b6` | 2026-10-06 08:37Z | workflow_dispatch | `main` | success |
| 37430955533 | `808ae6e` | 2026-10-06 07:38Z | workflow_dispatch | `main` | success |
| 37395804279 | `7452004` | 2026-10-06 00:47Z | schedule | `main` | success |
| 37239568800 | `e9ccfd6` | 2026-10-04 22:19Z | schedule | `main` | success |
| 37180843026 | `60577f7` | 2026-10-04 05:46Z | push | `claude/awesome-rubin-bqxp6p` | success |
| 37157341242 | `f6c43a4` | 2026-10-03 22:07Z | schedule | `main` | success |
| 37075161667 | `28a71b3` | 2026-10-02 22:56Z | schedule | `main` | success |
| 36991150849 | `13055b9` | 2026-10-02 09:40Z | workflow_dispatch | `main` | success |
| 36974711352 | `6d2412d` | 2026-10-02 06:40Z | workflow_dispatch | `main` | success |
| 36959373374 | `38944b5` | 2026-10-02 03:15Z | workflow_dispatch | `main` | success |
| 36949805301 | `8dd506a` | 2026-10-02 01:12Z | workflow_dispatch | `main` | success |
| 36946153615 | `17add37` | 2026-10-02 00:28Z | workflow_dispatch | `main` | success |
| 36939345900 | `89c1d2d` | 2026-10-01 23:10Z | schedule | `main` | success |
| 36933136726 | `6fe83d4` | 2026-10-01 22:07Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 36847910762 | `5a3bbf3` | 2026-10-01 10:14Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 36843169893 | `94ce754` | 2026-10-01 09:30Z | workflow_dispatch | `claude/awesome-rubin-bqxp6p` | success |
| 36810110411 | `b70c478` | 2026-10-01 03:21Z | push | `claude/awesome-rubin-bqxp6p` | success |
| 36809944475 | `2309fd6` | 2026-10-01 03:19Z | push | `claude/awesome-rubin-bqxp6p` | failure |

To refresh this index, read only:

```
gh api "repos/yazidmanan2409/pintar40/actions/workflows/ci.yml/runs?per_page=40"
```
