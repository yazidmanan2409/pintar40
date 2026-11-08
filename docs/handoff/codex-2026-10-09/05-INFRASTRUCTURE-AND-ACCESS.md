# 05 · Infrastructure and access

**As of:** 8 Oct 2026. `main` = `8202139` (its code is the same as `dab5c12`; `aad799b` and `8202139` change only documents).
**How this was made.** Read only, from the repository at `8202139` and from GitHub run metadata (GET requests only). Nothing was dispatched, deployed or changed.
**Secrets.** This file gives variable **names** only. It contains no value, token, database URL or password. If you find a value in a file, do not copy it into a document or a log.

Markers used below: **[verified]** = read from the cited file or run in this session; **[from facts]** = from the coordinator's verified fact sheet of 8 Oct (environment-facts run 37782586725); **[unverified]** = inferred or not checked; confirm it before you rely on it.

---

## 1. GitHub

### 1.1 Repository and branches

| Item | Value | Source |
|---|---|---|
| Repository | `github.com/yazidmanan2409/pintar40`, **private**, default branch `main` | `gh api repos/…` GET [verified] |
| Trunk | `main`, the only source of production. Only the coordinator merges into it | D-004 (`docs/coordination/DECISIONS.md` line 11) |
| Coordinator's working branch | `claude/awesome-rubin-bqxp6p` (= `8202139`, the same as main) | facts; the push filters of many workflows name this branch (§1.3) |
| Lane branches | Bob `claude/quirky-meitner-a04smj`; Daisy `ux-1/daisy-experience` (`cc96030`, design documents only) | D-004; facts |
| Branch protection on `main` | **None on GitHub** (`protected: false`). The landing rule below is a **procedure**. GitHub does not enforce it | `gh api repos/…/branches/main` GET [verified] |

**The landing rule (D-133(g), on top of E1 / D-128(b)).** `main` receives only:
1. a commit that already has a successful `ci.yml` run on **that identical commit** (E1: "identical commit means identical commit; no fuzzy equivalence on main"), or
2. a commit that changes **only documents CI skips** (the path filter in §1.2).

A staging request file (`.github/staging-*-request.txt`) reaches `main` only inside the next proven code landing.

The usual sequence, as seen in the run history (§06 run index):
1. Work on the working branch.
2. Dispatch `ci.yml` **once** on its head (D-025, D-091(a)).
3. When it is green, fast-forward `main` to that same commit.
4. The push run on `main` then cancels itself as **ALREADY PROVEN**.

For example, CI 37775379355 on `dab5c12` (dispatch on the working branch) succeeded. Main's push run 37782331321 on `dab5c12` was then `cancelled` (proven) [verified via the API].

### 1.2 `ci.yml`: push filter, skipped paths, proof reuse

- **Triggers** (`.github/workflows/ci.yml` lines 8–56): `push` to `main` only; `pull_request`; `workflow_dispatch`. A lane does not start CI by pushing. It dispatches CI once per hand-off (D-025).
- **Paths CI skips on a push to main.** CI does not start when a push changes only these:
  - `docs/coordination/**`, `docs/reports/**` and `docs/deployment/**`,
  - and only files with one of these extensions: `.md`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.docx`, `.xlsx`, `.csv`, `.txt`, `.html`.

  Code anywhere is **never** skipped. `docs/audit` and `docs/onboarding` are never skipped, because tests read them. The source of truth is `audit/ci/proof-reuse.mjs`: `UNREAD_DIRS` × `INERT`, plus the regex for `.github/staging-*-request.txt`. Selftest CI-W02 keeps that file and the filter consistent.
  - **This handoff folder (`docs/handoff/`) is NOT in the skipped set** [verified]. A push to `main` that touches it starts a full CI run.
- **Job `reuse`** ("proof · runners free, code not already proven", `ci.yml` line 79; script `audit/ci/proof-reuse.mjs`). It runs before anything else is queued:
  - **DEFERRED · NOT PROVEN.** If another run's job has waited more than 10 min for a runner, this run cancels itself.
  - **ALREADY PROVEN.**
    - On `main`: only when a successful run exists for the **identical** commit (E1).
    - On a working branch: an earlier successful `push`/`workflow_dispatch` run counts when all of these hold:
      - its strict selftest succeeded;
      - it is no more than 72 h old;
      - it differs from this commit only in unread documents.
    - In either case the run cancels itself and names the earlier run.
  - Neither outcome is ever green: the conclusion is `cancelled`, or `failure` if the cancel does not take effect.
  - The deploy gates accept only `success`. This job needs `actions: write`, and only to cancel its own run.
- **Jobs (18 in a full run)** [verified, matches "18/18" in D-136]:
  - `reuse`;
  - `check` (lint, typecheck, build);
  - `migrations-clean`;
  - `migrations-upgrade-path`;
  - `red-case`, a matrix of **11 groups covering 30 planted cases**, max-parallel 15;
  - `baseline-parity`;
  - `selftest` (strict, local stack);
  - `verdict`.
- **Concurrency:** `ci-${head_ref || ref_name}`, `cancel-in-progress: true`. A newer run supersedes an older one on the same branch.

### 1.3 Every workflow (45 files in `.github/workflows/`)

How to read the columns:
- **Trigger:** D = `workflow_dispatch`, P = `push` (branch, plus path filter), S = `schedule`, C = `workflow_call`.
- **Touches:**
  - **none**: a local stack or GitHub only;
  - **staging R / W**: reads or writes the staging environment;
  - **prod R / W**: reads or writes the production environment.
- **"main-only guard"** means the job has `if: github.ref == 'refs/heads/main'` [verified for the 5 rows marked].

Columns: Workflow | Purpose | Trigger | Touches

**CI, audit and spend**

| Workflow | Purpose | Trigger | Touches |
|---|---|---|---|
| `ci.yml` | The verification contract: lint, types, build, migrations, red cases, strict selftest, verdict | P `main` (path filter §1.2); `pull_request`; D | none (local stack) |
| `audit-journeys.yml` | Job A crawl and job B journeys on a local stack (06 §2) | D only (D-012, D-025); input `plant` ∈ none/crawl/journey/both | none (local stack; never production) |
| `actions-spend.yml` | Daily billed-minutes report per workflow (D-090) | S `41 1 * * *`; D; P working branch (own files) | none (GitHub API, `actions: read`) |
| `diagnose-journeys.yml` | Composed-journey diagnostic | P `main` on `.github/journeys-request.txt`; D | none (header: "touches no hosted system") |
| `content-draft-transcripts.yml` | Speech-to-text drafts for lesson media | D | none |

**Production (D-004: from `main` only)**

| Workflow | Purpose | Trigger | Touches |
|---|---|---|---|
| `deploy-supabase-production.yml` | Apply migrations to production. Requires a green `ci.yml` run on the release SHA, plus a completed backup no older than 26 h | P `main` on `.github/deploy-request.txt`; D. Main-only guard | **prod W** |
| `deploy-vercel-production.yml` | Deploy the frozen `RELEASE_SHA` to Vercel project `pintar40`, then write the origin into production Auth. Requires a green `ci.yml` run on that SHA. Never mints durable secrets | P `main` on `.github/vercel-request.txt`; D. Main-only guard | **prod W** (Vercel and Supabase Auth) |
| `configure-supabase-auth.yml` | Production Auth configuration (sign-in boundary) | P `main` on `.github/auth-request.txt`; D. Main-only guard | **prod W** |
| `configure-supabase-smtp.yml` | Production Auth custom SMTP | P `main` on `.github/smtp-request.txt`; D. Main-only guard | **prod W** |
| `diagnose-vercel-origin.yml` | Forensics: what the production origin serves | P `main` on `.github/diagnose-request.txt`; D | prod R |
| `check-front-door.yml` | Production sign-in page and its assets are served | P working branch (own file); D | prod R |
| `production-watch.yml` | Hourly external watch on production; opens or closes an issue. **Off unless** var `PINTAR_PRODUCTION_WATCH` = `on` | S `17 * * * *`; D | prod R; GitHub issues W |
| `escrow-durable-secrets.yml` | Escrow (or first mint) `CARD_PEPPER` and `CERT_SECRET_KEY_V1` outside Vercel | D. Environment `escrow` | **prod W** (Vercel env), S3 W |
| `recover-durable-secret.yml` | Recover one durable secret from escrow into Vercel | D. Environment `production-recovery` | **prod W** |

**Staging: database, deploy and app origin**

| Workflow | Purpose | Trigger | Touches |
|---|---|---|---|
| `staging.yml` | Applies pending migrations to staging; sets and asserts the staging Auth/SMTP boundary; optional `initialise` | P `main` on `supabase/migrations/**`, `supabase/auth-identitas.json`, itself; D | **staging W** |
| `staging-app-origin.yml` | Sets `NEXT_PUBLIC_APP_URL` on `pintar40-staging` and rebuilds. Refuses any other project | D | **staging W** (Vercel) |
| `found-school.yml` | Founds a school on staging (D-084 C1). Calls `environment-facts.yml` first | D | **staging W** |
| `staging-import-lesson.yml` | Imports a lesson package into a staging school | D | **staging W** |

**Staging: performance**

| Workflow | Purpose | Trigger | Touches |
|---|---|---|---|
| `staging-perf-seed.yml` | Synthetic school for U-PERF | D | **staging W** |
| `perf-staging.yml` | Performance probes and journeys on staging (D-046) | D | staging W (one rename and its rename back) |
| `perf-l1.yml` | L1 load: 1,000 learners (seed / wave / browser) | D | **staging W** |

**Staging: journeys and walks**

| Workflow | Purpose | Trigger | Touches |
|---|---|---|---|
| `staging-journey.yml` | The learning journey through PINTAR's screens (D-050) | D | **staging W** |
| `staging-journey-human.yml` | The same journey with a real teacher sign-in | P working branch on `.github/staging-journey-human-request.txt` | **staging W** |
| `staging-human-setup.yml` | One human user on staging | P working branch on `.github/staging-human-request.txt` | **staging W** |
| `staging-platform-operator.yml` | Staging Platform Operator identity (D-088(a)) | P working branch on `.github/staging-platform-operator-request.txt` | **staging W** |
| `staging-golden-school.yml` | Golden School GS-02, GS-03 (after GS-00) | P working branch on `.github/staging-golden-school-request.txt` | **staging W** |
| `staging-golden-school-admin.yml` | GS-04 to GS-11 | P working branch on `…-admin-request.txt` | **staging W** |
| `staging-golden-school-murid.yml` | GS-07, GS-12 to GS-16 | P working branch on `…-murid-request.txt` | **staging W** |
| `staging-golden-school-laporan.yml` | GS-17 to GS-21 | P working branch on `…-laporan-request.txt` | **staging W** |
| `staging-bantuan-browser.yml` | Assistance and offline notice in a real browser | P working branch on `.github/staging-bantuan-browser-request.txt` | **staging W** |
| `staging-kode-ulang.yml` | Resend countdown (CR-18) | P working branch on `.github/staging-kode-ulang-request.txt` | staging R/W (sign-in screens) [unverified whether it writes] |
| `phase1-mailbox-check.yml` | Staging test mailbox check | P working branch on `.github/phase1-mailbox-request.txt` | staging mailbox R |
| `check-smtp-secret.yml` | Checks that `PINTAR_SMTP_PASSWORD` still logs in (no send) | P working branch (own file); D | mail server R |

**Both environments, read only**

| Workflow | Purpose | Trigger | Touches |
|---|---|---|---|
| `environment-facts.yml` | What each environment runs (app commit, migrations). GS-00 for the walks | S `17 19 * * *`; D; P working branch (own file); C | staging R; prod R (Vercel only; prod DB not read) |
| `identity-facts.yml` | Gate 0 Auth settings facts | D | staging R; prod R |
| `audit-identify-credentials.yml` | Identifies each credential by what it can reach (GET only) | D | staging R; prod R |

**Backup and recovery (#150)**

| Workflow | Purpose | Trigger | Touches |
|---|---|---|---|
| `backup-offsite.yml` | Nightly encrypted off-site backup. Gated by var `PINTAR_OFFSITE_BACKUP` | S `0 20 * * *`; D. Environment `backup` | prod R, staging R; S3 W; issues W |
| `backup-credential.yml` | Set or revoke the `pintar_backup` database credential | D. Environment `backup`; input staging/production | **prod W** or **staging W** |
| `staging-backup-path.yml` | Staging backup path check | D | staging R |
| `recovery-facts.yml` | Backup configuration of both projects (GET only) | D | staging R; prod R |
| `recovery-target.yml` | Is the recorded project the right one, and does it carry its settings? | D | staging R or prod R |
| `restore-rehearsal.yml` | Restore staging's backup into an empty local stack | D | staging R |
| `recovery-rehearsal.yml` | Runbook proven on a **copy** of staging (`…-DELETE-ME` project) | D. Environment `staging-recovery-drill` | copy W; staging R |
| `restore-drill.yml` | Monthly restore drill. Gated by var `PINTAR_RECOVERY_DRILL` | S `41 21 1 * *`; D. Environment `staging-recovery-drill` | S3 R; staging data |
| `key-possession-check.yml` | Quarterly custodian key check. Gated by var `PINTAR_POSSESSION_CHECK` | S `23 2 1 1,4,7,10 *`; D | none (encrypts only) |

Notes:
- The "Touches" column comes from each file's header comments, its secrets and its project references. The R/W split is **[verified from headers]** for the production rows, the `staging.yml` row and the read-only rows. It is **[unverified]** in detail for the backup and recovery rows: read each file's header before you dispatch one.
- The last production deploy runs were on **23 Sep 2026, from Bob's branch** `claude/quirky-meitner-a04smj`:
  - Vercel 35851746640;
  - Supabase 35845602075.

  That was **before** D-004 (24 Sep) moved the production triggers to `main`. Production has not been redeployed since [verified via the API]: production is at `5b5b68d`, with 111 migrations [from facts].

### 1.4 Request files: they start environment actions

> **Warning.** Editing and pushing one of these files **is** the trigger. This is not documentation. Never edit, reformat, rename or "tidy" any `.github/*-request.txt` file unless you intend to run its workflow against a real environment. A push to `main` that touches a production request file runs a production action.

How it works: the workflow's `on.push.paths` names exactly one request file, and there is no other way in except `workflow_dispatch`. Each file is a log of attempts (`attempt: NNN`, the release SHA, its purpose, what is expected). You add a new attempt entry at the top, commit, and push to the branch the filter names. Production workflows also refuse any ref other than `main`.

| File | Branch that triggers | Workflow | Environment |
|---|---|---|---|
| `.github/vercel-request.txt` | `main` | `deploy-vercel-production.yml` | **production** (last attempt 013, release `5b5b68d`, 23 Sep) |
| `.github/deploy-request.txt` | `main` | `deploy-supabase-production.yml` | **production** (last attempt 005) |
| `.github/auth-request.txt` | `main` | `configure-supabase-auth.yml` | **production** |
| `.github/smtp-request.txt` | `main` | `configure-supabase-smtp.yml` | **production** |
| `.github/diagnose-request.txt` | `main` | `diagnose-vercel-origin.yml` | production, read |
| `.github/journeys-request.txt` | `main` | `diagnose-journeys.yml` | none |
| `.github/staging-*-request.txt` (9 files) | `claude/awesome-rubin-bqxp6p` | the `staging-*` walk of the same name (§1.3) | **staging, write** |
| `.github/phase1-mailbox-request.txt` | `claude/awesome-rubin-bqxp6p` | `phase1-mailbox-check.yml` | staging mailbox |
| `.github/identity-request.txt`, `.github/preflight-request.txt` | — | **No workflow in the repository references them** [verified]. Their text names `verify-identity.yml` and `verify-production-preflight.yml`, which do not exist on `main`. They are historical | — |

Two consequences:
- The `staging-*` triggers listen on the **coordinator's working branch name**. If you work on a different branch, they will not fire. If you push to that branch name, they will.
- `proof-reuse.mjs` treats staging request files as "unread". Changing one does not invalidate CI proof, but it does start a staging walk.

### 1.5 Permissions

- **Workflow token.** Every workflow declares `contents: read`. The exceptions:
  - `ci.yml` job `reuse`: `actions: write`, to cancel its own run;
  - `actions-spend.yml`, `deploy-*`: `actions: read`;
  - `backup-offsite.yml`, `production-watch.yml`: `issues: write`.
- **GitHub environments** used: `backup`, `escrow`, `production-recovery`, `staging-recovery-drill`. Their protection rules could not be read through this session's proxy **[unverified]**. Ask the owner whether they require reviewers.
- **What Codex needs on GitHub:**
  - write access to push branches and dispatch workflows;
  - admin, or the owner's help, to read or set repository **secrets**, **variables** and **environments**.

  Merging to `main` is the coordinator's role (D-004). Agree with the owner who holds it now.

### 1.6 Commit conventions

- **`[skip ci]`** in a commit message stops **every** push-triggered workflow for that push. That includes `staging.yml` (migrations) and the request-file workflows, not only `ci.yml`.
  - It is used for documents-only or workflow-only commits that need no CI, **never to bypass a gate** (D-043(7)).
  - It is also used for a merge whose code is already proven, with the run named in the message (D-034, D-091(a)).
  - If a `[skip ci]` commit adds a migration, `staging.yml` is **dispatched** by hand instead (D-091(a)).
  - 134 of the last 400 commits across all branches carry it [verified].
  - Whether Vercel's Git integration honours `[skip ci]` is **[unverified]**.
- **Attribution trailers.** Recent commits end with a `Co-Authored-By: Claude <model> <noreply@anthropic.com>` line and a `Claude-Session: https://claude.ai/code/session_…` line [verified on `8202139`]. Use your own team's attribution. Do not copy Claude's session links.
- Commit subjects are plain English sentences that name the work item (CR-nn, D-nnn, GS-nn, L1–L4).

---

## 2. Supabase

### 2.1 Projects

| Environment | Project ref | Notes |
|---|---|---|
| staging | `keijhmdtsgrfvnvocfvk` (dashboard name "pintar-staging") | Test data allowed (D-036). Database posture `production`, with sample data off (D-038) |
| production | `trtlvibiybwixfumjrrx` (dashboard name "pintar-production") | Only reviewed, auditable changes (D-013). **Its database was not read on 8 Oct** (that needs owner permission) [from facts] |

The refs are written into the workflows' `env:` blocks (for example, `staging.yml` lines 59–60) and are checked before any connection is made.

### 2.2 `supabase/config.toml`

This is the **local** Supabase CLI configuration. It is not the hosted projects' settings.
- `project_id = "pintar40"`; Postgres `major_version = 17`.
- `[db.seed] sql_paths` loads six seeds in this order, from `supabase/seed/`:
  1. `00_local_fixtures.sql`
  2. `synthetic.sql`
  3. `learning_cycle.sql`
  4. `official_bootstrap.sql`
  5. `human_evaluation.sql`
  6. `activated_staff.sql`
- `[auth] site_url = "http://127.0.0.1:3000"`.

**It is edited temporarily, and those edits are never committed.** `audit-journeys.yml` (lines 72–77 and 166–170) changes it with `sed`, inside the runner's checkout:
- `site_url` and `additional_redirect_urls` are pointed at the app port 3999;
- the first `enable_signup` is set to `false` (production posture);
- job B also raises `email_sent`.

The coordinator's local runs did the same [facts; the local scripts are not in the repository]. If you reproduce a job locally, run `git checkout -- supabase/config.toml` before you commit. A committed change here would change every developer's and every CI stack.

### 2.3 Migrations

- **Directory:** `supabase/migrations/`. **177 files on `main`** [verified; matches facts].
- **Naming:** `YYYYMMDDHHMMSS_snake_case_description.sql`, one linear series. Examples:
  - `20260912004158_foundation_base.sql` (the first);
  - `20261210100000_a_session_knows_what_it_is_here_to_do.sql` (the last).

  Later files are named as sentences that state the behaviour.
- **The timestamps are ordering keys, not calendar dates.** 63 files carry dates after 8 Oct 2026, up to 2026-12-10 [verified]. A new migration must sort after the last one: use a timestamp later than `20261210100000`.
- CI checks that the recorded history equals the repository, in one linear series (`ci.yml` job `migrations-clean`). It also checks the upgrade path from the previous schema (`migrations-upgrade-path`).
- Each migration carries its own terminal verification block (ADR-0014; see the header of `deploy-supabase-production.yml`). A failing block rolls the migration back.

### 2.4 How migrations reach each environment

| Environment | Path | Gate |
|---|---|---|
| Local / CI | `supabase db reset --local` (`.github/actions/local-stack/action.yml`) | — |
| **Staging** | `staging.yml`, on push to `main` touching `supabase/migrations/**` (or by dispatch). It checks the count afterwards | Whatever reached `main` (the landing rule) |
| **Production** | `deploy-supabase-production.yml`, from `main`, only by editing `.github/deploy-request.txt` | D-004 (main only; the job refuses other refs); green `ci.yml` on the release SHA; a completed production backup ≤ 26 h old (#150 G6; read with `PRODUCTION_SUPABASE_BACKUPS_READ_TOKEN`). The release itself is Gate 8 / the REL items (`docs/coordination/BOARD.md` C-11; `docs/coordination/RELEASE-CHECKLIST.md`) |

Current state [from facts, run 37782586725]:
- staging: 177 applied = 177 on main;
- production: 111 (release `5b5b68d`), **66 behind**.

### 2.5 How RLS is verified

- **Red cases in CI** (`ci.yml` job `red-case`, from line 233). A defect is planted, and the named check must go red for the right reason:
  - `db-table-without-rls` plants a table without RLS, as a migration. The DB contract must go red on **F01-T13** (schema lint).
  - `static-permissive-policy` plants a `using (true)` policy for `anon`. The static contract must go red.
  - The db groups (30 cases in total) plant authorization and tenancy defects. Each plant must prove four things: `scripts/dev/README.md` "Plants"; `selftest/plants/plants.json`.
- **Selftest db suites** (`selftest/db/fable01.sql` … `fable22.sql`). 16 manifest entries explicitly prove RLS or row-security properties [verified by text match on `proves`], for example F17-N01, F15-N01 and F16-N01. Many more prove role and tenancy refusals.

### 2.6 Local development

1. Install with `npm ci`. The Supabase CLI is a devDependency (`supabase ^2.117.0`); run it with `npx supabase`.
2. Start the stack with `npx supabase start`. CI excludes unneeded services: `-x studio,imgproxy,realtime,edge-runtime,logflare,vector,supavisor,postgres-meta,mailpit`, as in `.github/actions/local-stack/action.yml`.
3. Seed with `npx supabase db reset --local`. It applies every migration, then the six seeds of §2.2.
   - For fast iteration: `npm run db:golden` builds a fingerprinted golden DB, and `npm run db:clone -- scratch` clones it (`scripts/dev/golden-db.sh`). The golden DB is **not** clean-install evidence.
4. Run the selftest: `npx tsx selftest/run.ts` (= `npm run selftest`). Environment: `SUPABASE_DB_URL` (local), plus the app variables of §4.3 with **synthetic** values. CI's are inline in `ci.yml` lines 2027–2058; they are local-only placeholders.
   - No flag: **strict**. Any FAIL, skip, unreported id or unlisted id exits non-zero. This is what CI runs.
   - `--accept-justified-skips` (= `npm run selftest:local`): a skip is accepted only where the manifest gives a `skip_justification`.
   - `--only=ID,ID` or bare patterns (`npm run selftest:only -- 'F07-*'`): a targeted run. A pattern that matches nothing is a failure.
   - Needs `psql` for db tests. For email tests it needs a Mailpit sink on 127.0.0.1:54324/54325 (`manifest.json` → `facilities`).
5. The audits (06 §2) run with Playwright against a local production build on port 3999.

---

## 3. Vercel

| Project | Environment | Domain | How it deploys | Source |
|---|---|---|---|---|
| `pintar40-staging` | staging | `staging.pintarselalu.com` (canonical since 24 Sep); `pintar40-staging.vercel.app` stays attached | **Git-connected to `main`**, Production environment only, Ignored Build Step "Only build production". Every push to `main` deploys staging | `docs/deployment/STAGING.md` lines 6 and 45; `vercel.json` (`git.deploymentEnabled`: only `main`) |
| `pintar40` | production | `app.pintarselalu.com` (custom domain). Deployment Protection is `all_except_custom_domains`, so `*.vercel.app` URLs need a Vercel login | **Only by `deploy-vercel-production.yml`** (`vercel deploy --prebuilt --prod` of the frozen `RELEASE_SHA`), started by editing `.github/vercel-request.txt` on `main` | `deploy-vercel-production.yml` env block; `docs/deployment/D-039-ENVIRONMENT-PROVISIONING.md` line 41 |

Notes:
- Region: `sin1` (`vercel.json`).
- **Production changes only by a deliberate release request.** The production project is "deployed by workflow" (D-039 doc). It is not deployed by Git. Production is still at `5b5b68d` while `main` is at `dab5c12` (facts). That would not be possible if production auto-deployed `main`. Confirm in the Vercel dashboard that `pintar40` has no Git connection **[unverified in the dashboard]**.
- Current deployments [from facts]:
  - staging `dpl_DPokDbtekCiuLmhzkdENbKbYCQJZ`, app commit `dab5c12`;
  - production `dpl_3GshvyyNaC5bwZQ1M8vTFLHyEMLE`, app commit `5b5b68d`;
  - 661 code files differ from main.
- Vercel applies a changed environment variable only to a **new** deployment (BOARD C-11 note). Redeploy after you change one.
- The agent container's network policy refuses Vercel and the Supabase API. That is why deploys run on GitHub runners (header of `deploy-vercel-production.yml`). Your environment may differ.

---

## 4. Secrets and variables (names only)

### 4.1 GitHub Actions secrets: 26 names referenced as `secrets.X`

`GITHUB_TOKEN` (`github.token`) is built in. It is used by `ci.yml`, `actions-spend.yml`, `deploy-*`, `backup-offsite.yml` and `production-watch.yml`, and is not counted here.

| Name | Used by (workflow) | Purpose |
|---|---|---|
| `VERCEL_TOKEN` | deploy-vercel-production, staging-app-origin, environment-facts, found-school, staging-golden-school(-admin/-murid/-laporan), staging-journey, perf-staging, escrow-durable-secrets, recover-durable-secret, recovery-rehearsal, diagnose-vercel-origin, configure-supabase-auth, audit-identify-credentials | Vercel API and CLI (both projects) |
| `PRODUCTION_SUPABASE_ACCESS_TOKEN` | configure-supabase-auth, configure-supabase-smtp, deploy-vercel-production, escrow-durable-secrets, identity-facts, recovery-target, audit-identify-credentials | Supabase Management API, scoped to production |
| `STAGING_SUPABASE_ACCESS_TOKEN` | staging, staging-* walks, perf-*, identity-facts, recovery-facts, recovery-target, restore-rehearsal, staging-backup-path, audit-identify-credentials | Management API, scoped to staging only (`staging.yml` stops if production answers it) |
| `SUPABASE_ACCESS_TOKEN` | audit-identify-credentials | Legacy name, checked for identity only (credential incident, 24 Sep) |
| `STAGING_SUPABASE_DB_URL` | staging, environment-facts, found-school, all staging walks, perf-l1, backup-credential, restore-rehearsal, recovery-rehearsal, staging-backup-path, audit-identify-credentials | Staging Postgres connection |
| `SUPABASE_PROD_DB_PASSWORD` | deploy-supabase-production, configure-supabase-auth, backup-credential, audit-identify-credentials | Production `postgres` password (through the pooler) |
| `PRODUCTION_SUPABASE_BACKUPS_READ_TOKEN` | deploy-supabase-production, production-watch, recovery-facts | "C1": can read production backups only |
| `PRODUCTION_DB_BACKUP_PASSWORD` | backup-offsite, backup-credential | "C2": the `pintar_backup` role, production |
| `STAGING_DB_BACKUP_PASSWORD` | backup-offsite, backup-credential | `pintar_backup` role, staging |
| `PRODUCTION_SUPABASE_STORAGE_S3_KEY_ID`, `PRODUCTION_SUPABASE_STORAGE_S3_SECRET` | backup-offsite | Production Storage through its S3 protocol (2 names) |
| `STAGING_SUPABASE_STORAGE_S3_KEY_ID`, `STAGING_SUPABASE_STORAGE_S3_SECRET` | backup-offsite | Staging Storage through its S3 protocol (2 names) |
| `AWS_BACKUP_WRITER_KEY_ID`, `AWS_BACKUP_WRITER_SECRET` | backup-offsite, escrow-durable-secrets | AWS S3 (ap-southeast-1, Object Lock; D-107 D1), writer (2 names) |
| `AWS_BACKUP_READER_KEY_ID`, `AWS_BACKUP_READER_SECRET` | restore-drill, recovery-rehearsal, recover-durable-secret | AWS S3 reader ("C5") (2 names) |
| `RECOVERY_PRIVATE_KEY`, `RECOVERY_KEY_PASSPHRASE` | recover-durable-secret (environment `production-recovery`) | OpenPGP recovery key for the durable-secret escrow (2 names) |
| `STAGING_DRILL_PRIVATE_KEY` | restore-drill, recovery-rehearsal | R3, the staging-drill-only decryption key (D-107 D2) |
| `REHEARSAL_SUPABASE_ACCESS_TOKEN`, `REHEARSAL_SUPABASE_DB_URL`, `REHEARSAL_STORAGE_S3_KEY_ID`, `REHEARSAL_STORAGE_S3_SECRET`, `REHEARSAL_VERCEL_BYPASS` | recovery-rehearsal | The throw-away staging copy for the O8 rehearsal (5 names) |
| `PINTAR_SMTP_PASSWORD` | staging, configure-supabase-smtp, check-smtp-secret, recovery-rehearsal, audit-identify-credentials | Password of the `noreply@` mailbox. It is written into Supabase Auth SMTP. The same mailbox serves staging and production (D-036) |
| `GS_MAILBOX_PASSWORD` | staging-golden-school*, staging-journey-human, staging-platform-operator, phase1-mailbox-check, recovery-rehearsal | The Golden School test mailbox. Automation reads sign-in mail from it |

The rows above hold 26 distinct names. `audit-identify-credentials.yml` exists because a secret was once overwritten by mistake. Treat secret names as claims, and identify each credential by what it can reach.

### 4.2 GitHub Actions variables: 9 names referenced as `vars.X`

| Name | Used by | Purpose |
|---|---|---|
| `ACTIONS_DAILY_MINUTES_BUDGET` | actions-spend | Daily billed-minutes alarm threshold (default 600) |
| `PINTAR_PRODUCTION_WATCH` | production-watch | `on` turns on the hourly watch |
| `PINTAR_OFFSITE_BACKUP` | backup-offsite | Turns on the nightly backup |
| `PINTAR_RECOVERY_DRILL` | restore-drill | Turns on the monthly drill |
| `PINTAR_POSSESSION_CHECK` | key-possession-check | Turns on the quarterly check |
| `PINTAR_BACKUP_BUCKET` | backup-offsite, escrow, recover, restore-drill, recovery-rehearsal | S3 bucket name |
| `PINTAR_BACKUP_RECIPIENTS_STAGING` | backup-offsite | OpenPGP recipients for staging bundles |
| `PINTAR_APP_URL` | configure-supabase-auth, deploy-vercel-production | Overrides the production origin (unset = `app.pintarselalu.com`) |
| `PINTAR_CONFIGURE_AUTH` | configure-supabase-auth | Gate on the deploy workflow's Auth step |

The current values of these variables (which switches are on) were **not read** **[unverified]**.

### 4.3 Application runtime (`process.env.X` in `src/`, and `.env.example`): 15 names

These are set in each Vercel project's environment.

| Name | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | src (client and server) | Supabase API URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | src | Public anon key |
| `NEXT_PUBLIC_APP_URL` | src (16 sites), `src/app/api/_email/pengaturan.ts` | Canonical origin, built into the bundle |
| `SUPABASE_SERVICE_ROLE_KEY` | src (server only) | Service role. Marked Sensitive in production (D-082(f)) |
| `SUPABASE_AUTH_FORWARDING_KEY` | `src/lib/auth-forwarding.ts` | Secret API key (`sb_secret_…` shape) for forwarding the client IP to Auth. When it is absent, nothing is forwarded |
| `CARD_PEPPER` | src | **Durable.** Derives class-card PINs. Never rotate it once cards exist (D-066) |
| `CARD_EMAIL_DOMAIN` | `src/lib/sesi.ts` | Domain for card identities (default `cards.pintar.internal`) |
| `CERT_SECRET_KEY_V1` (then `_V2`, …) | `src/lib/certificates/keyring.ts` (its only reader) | **Durable.** Certificate signing keyring. Add versions; never delete one |
| `PINTAR_SMTP_HOST`, `PINTAR_SMTP_PORT`, `PINTAR_SMTP_USER`, `PINTAR_SMTP_PASSWORD` | `src/app/api/_email/pengaturan.ts` | PINTAR's own email sender (BOB-25). The host is strictly validated. Present on staging [from facts] (4 names) |
| `PINTAR_BUILD_SHA` | `src/lib/env.ts` | Build commit (CI sets it) |
| `VERCEL_GIT_COMMIT_SHA` | `src/lib/env.ts` | Fallback build commit (Vercel sets it) |
| `NODE_ENV` | src | Standard |

### 4.4 Test and audit harness (`selftest/`, `audit/`): 16 names

These are local or CI only, and hold synthetic values.

| Name | Used by | Purpose |
|---|---|---|
| `SUPABASE_DB_URL` | selftest (54 sites), audit/journey.mjs | Local stack database |
| `ADMIN_DB_URL` | selftest, scripts | Admin connection for some suites |
| `PINTAR_PG_BIN` | selftest, scripts | Path to the Postgres binaries |
| `SELFTEST_APP_PORT` | selftest/run.ts | App port (CI 3999) |
| `SELFTEST_REUSE_BUILD` | selftest/run.ts, selftest/build-identity.ts | `1` = reuse a `.next` whose recorded fingerprint (source, config, lockfile, installed tree, build env, git revision) no longer matches; logged loudly. Otherwise a mismatched or unfingerprinted `.next` is rebuilt |
| `SELFTEST_CI_UPSTREAM` | selftest/run.ts | Upstream CI job results (F01-R04) |
| `PINTAR_SELFTEST_RSC` | selftest/run.ts | Internal re-exec guard (`react-server` condition) |
| `APP_URL`, `APP_DIR` | audit/crawl.mjs, audit/journey.mjs | App under audit, and its directory (2 names) |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | audit | Local stack API (2 names) |
| `MAILPIT_URL` | audit/journey.mjs | Mail sink API |
| `OUT_DIR`, `MAX_PAGES` | audit | Output folder; crawl page limit (default 45) (2 names) |
| `AUDIT_PLANT` | audit/crawl.mjs, audit/journey.mjs | Controlled red (`crawl`/`journey`/`both`) |
| `STARVED_MINUTES`, `MAX_AGE_HOURS` | audit/ci/proof-reuse.mjs | Proof-reuse thresholds (10 min, 72 h) (2 names) |

**Total names listed in §4: 66** (26 secrets + 9 variables + 15 runtime + 16 harness). That is **65 distinct names**, because `PINTAR_SMTP_PASSWORD` appears in §4.1 and §4.3.

Two kinds of name are not listed:
- `scripts/` reads about 80 more internal names (for example `BACKUP_*`, `ESCROW_*`, `DRILL_*`, `TARGET_*`). Workflows fill them from the secrets above.
- Workflows also set non-secret `env:` constants such as the project refs.

---

## 5. What Codex must set up independently

**Claude's authenticated sessions do not transfer.** The GitHub access, Supabase and Vercel reach, and any tokens used in Claude's sessions are bound to those sessions and to the owner's accounts. Nothing in this handoff grants access. Ask the owner (Yazid) for each of these:

1. **GitHub.** Collaborator access to `yazidmanan2409/pintar40`: write, to push branches and dispatch workflows. Admin, or the owner acting for you, to view or set secrets, variables and environments. Agree who merges to `main` (D-004).
2. **Supabase.** Your own personal access tokens, or a seat in the organization, for staging (`keijhmdtsgrfvnvocfvk`) and, only if the owner approves, production (`trtlvibiybwixfumjrrx`). Reading the production database needs explicit owner permission [facts]. The workflows' tokens stay as repository secrets. You do not need to see them to dispatch a workflow.
3. **Vercel.** Team access to `pintar40-staging`, and to `pintar40` only if approved. A Vercel token only if you will run the CLI outside GitHub Actions.
4. **SMTP.** The `noreply@pintarselalu.com` mailbox and the Golden School test mailbox belong to the owner. You do not need their passwords for local work: the selftest uses a Mailpit sink.
5. **AWS (backups) and recovery keys.** These are held by the owner and custodians (D-107). Codex should not need them.
6. **CI allowance.** CI time is a budget the owner grants. See 06 §5. Do not dispatch CI or journeys until the owner confirms the allowance.
