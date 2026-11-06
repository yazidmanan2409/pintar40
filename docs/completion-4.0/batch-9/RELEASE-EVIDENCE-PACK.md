# Release evidence pack (W9.18): the skeleton, kept current until the production release

This file is what Gate 6 asks to be "current" (`G-FINAL-ACCEPTANCE-MATRIX` §4) before the owner's explicit approval of the production change.

**How it is kept:**
- one row per item the gate and the mandate (§10) name;
- each row says where its evidence comes from and its state today;
- the levels are kept apart: local, CI, staging, human, production.

**Two things this pack never does:** set `RELEASE_SHA`, or start a production run. Both belong to the release itself and need the owner's separate authorisation.

## The candidate

| | |
|---|---|
| Accepted candidate (commit) | **not yet named**: the head that passes Gates 1–5 |
| `RELEASE_SHA` in `deploy-supabase-production.yml` and `deploy-vercel-production.yml` | still the earlier releases' (`c358f586…`, `5b5b68d4…`). Set to the accepted candidate **in the release commit only** (DR-S05) |
| CI on that commit | — (both deploy workflows refuse without a successful `ci.yml` run on `RELEASE_SHA`) |
| Production database | not read in 4.0 (F-5: how production reaches migration 162, then the candidate) |

## Gate 6 items

| # | Item | Evidence from | State (6 Nov) |
|---|---|---|---|
| 1 | The exact production baseline | the upgrade rehearsal's read of production (W9.10, with the owner's permission) | NOT STARTED: F-5, F-18 |
| 2 | Rehearsed upgrade on a representative copy | W9.10 on a scratch copy (`batch-0/07-MIGRATION-162-BRIEF.md`) | NOT STARTED: F-18 (billable restore) |
| 3 | Recovery path for every migration | the rollback scripts per batch (`batch-8/ROLLBACK-194-195.sql`, tested from 193–196) and the restore readiness (W9.12) | PARTIAL: rollbacks tested; W9.12's six restore findings open |
| 4 | Auth and mail verified by received headers | W9.13 | IN PROGRESS: SMTP, SPF/DKIM/DMARC owner actions |
| 5 | Staff transition done; magic link retired | W9.14 | PARTIAL (6 Nov): the magic link is off in the candidate; the rehearsal waits on the owner (J2.7 on staging, W9.10 on a copy) |
| 6 | Backup verified (off-platform; escrow; second administrators) | W9.5, W9.6, W9.7 | BLOCKED: owner and external (#150) |
| 7 | DNS live (`verifikasi.pintarselalu.com`) | W9.15 | BLOCKED: owner |
| 8 | Release checklist v2.8 | W6.9 (`batch-8/evidence/w69-bukti-pemeriksaan.md`) | IN PROGRESS: rows marked only with staging evidence |
| 9 | Capacity at the chosen tier (CAP-01, CAP-02, CAP-07, CAP-08) | W9.3, W9.4; W6.8 measured on staging's current tier | BLOCKED: owner (F-15) |
| 10 | Legal gate | W9.11 (counsel, F-16) | BLOCKED: external |
| 11 | Production watch on | W9.8, `production-watch.yml` | NOT STARTED (at release) |
| 12 | Support named; same-day answer | W9.16 | BLOCKED: owner |
| 13 | Critical journeys on production; the production-applicable acceptance checks repeated (sign-in by each route, mail received, QR verification, one learner and one teacher scenario observed) | the staging walks' own scripts, pointed at production after the release | NOT STARTED (after the deploy) |
| 14 | The owner's explicit approval of the production change | the owner, in writing | — |

## Release mechanics already in place (W9.18)

- Both deploy workflows run only from `main` and only on an edit of their request file (D-004).
- Both refuse unless the checked-out commit is `RELEASE_SHA` and `ci.yml` succeeded on it.
- The production apply job, `staging.yml` and the restore rehearsal run the **same toolchain**: Node 22 and Supabase CLI 2.117.0.
  - **Node 22 (5 Nov):** Node 20 is past its end of life.
  - **Staging proves it first:** it is the first of the three to run after the change reaches `main`.
