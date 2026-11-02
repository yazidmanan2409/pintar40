# A · Current state, verified 2 Nov 2026

**Phase 0 of the Final Completion Mandate (D-142).** Every fact here was read on 2 Nov 2026 from GitHub, Vercel (through the read-only facts workflow), Supabase staging (read-only SQL) or the repository. Nothing was changed.
- **[verified]** means read today.
- **[recorded]** means taken from a record and not re-read today.

## 1. The repository is public, by the owner's choice

**Owner, 2 Nov:** «Correct - i changed it this morning». The change was deliberate, **not an incident** (D-143). The consequences below are recorded for decisions F-4 and F-16, not as a breach.

**The repository `yazidmanan2409/pintar40` is PUBLIC.** [verified]
- `gh api repos/yazidmanan2409/pintar40` returns `"private": false, "visibility": "public"`, and an anonymous request returns HTTP 200.
- On 9 Oct the handoff recorded it as private [recorded, `docs/handoff/codex-2026-10-09/05-INFRASTRUCTURE-AND-ACCESS.md` §1.1].
- The repository's `updated_at` is 2 Nov 2026 00:24 UTC. That *may* be the moment it changed; it is not proven.
- Forks 0, stars 0.

**What is therefore readable by anyone:**
- The 20 content packages `docs/onboarding/konten/*.paket.json`, with **619 correct-answer markers**.
- Their source `.xlsx` workbooks, generators and misconception files.
- The withheld example build carrying the live SD 5 Bab 1 keys (`docs/onboarding/contoh/`).
- Git history, including the copy once served from `public/contoh/`.
- The ministry-derived material (content rights, Q5).
- The production Supabase project reference and the entire governance record.

`main` has no branch protection [recorded].

**The coordinator has not changed any repository setting.** What follows from the repository being public, and what must not be committed from now on, is in F-1 and F-4.

## 2. Code and branches [verified]

| Item | Fact |
|---|---|
| `main` | **`001a357`** (9 Oct 2026, «D-140 batch B (RV-10)») |
| Working branch | `claude/awesome-rubin-bqxp6p` = `main` + documents only (no `src/`, `supabase/`, `audit/`, `selftest/` difference). Tip before this phase: `88bdf80` |
| Commits since 9 Oct | Documents only (the 2 Nov plan and D-141). **No code change since 9 Oct** |
| Other branches | `ux-1/daisy-experience` `cc96030` (Daisy's frozen design, APPLICATION READY on `c42fecb`), Lana's content branches, Pete's website, `gate/*` snapshots: all inactive since 8 Oct or earlier |
| Migration files | **177** in `supabase/migrations/` (latest `20261210100000`) |

## 3. Environments [verified]

| Environment | App | Database | Source |
|---|---|---|---|
| **Staging** (`staging.pintarselalu.com`, Vercel `pintar40-staging`, Supabase `keijhmdtsgrfvnvocfvk`) | deployment `dpl_EcwRYkkSG1hGqGjocvmVC6cKAhEg`, commit **`001a357`**, READY | **177 migrations applied** (`supabase_migrations.schema_migrations`: 177, max `20261210100000`) = main's | facts run **41369061652** (2 Nov, GREEN); direct read-only SQL |
| **Production** (`app.pintarselalu.com`, Vercel `pintar40`, Supabase `trtlvibiybwixfumjrrx`) | deployment `dpl_3GshvyyNaC5bwZQ1M8vTFLHyEMLE`, commit **`5b5b68d`** (23 Sep), READY. 669 code files differ from main | **Not read** (needs owner permission); 111 migration files at its commit | Same run |
| Staging email settings | All four SMTP names present (names only) | — | Same run |
| Supabase projects | `pintar` (old), `pintar-production`, `pintar-staging`: all ACTIVE_HEALTHY | — | Supabase API, 2 Nov |

**Facts history since 9 Oct:**
- Nightly runs green on every night except **26 Oct** (run 40417406153). That night the read of staging's deployment timed out.
- It recovered the next night. Nothing changed.

**Staging freeze** (D-140(d), D-141(a)) is still in force.

**Sekolah Demo PINTAR** (Dr Gladys's specimen) is unchanged since 9 Oct:
- 6 places; 4 roles; 10 official results; 3 certificates; 0 reports; 91 audit rows.
- **No role has been granted to anyone on staging since 9 Oct.**
- Every staging write since then is the coordinator's own Golden School walk (`sekolah-uji-daisy-001a`).

So Dr Gladys's Studio attempt (D-141(b)) is not visible on staging under her own account. She may have used production's 23 Sep Studio, another person's account, or screenshots.

## 4. Verification state [verified unless noted]

| Check | Last run | On | Result |
|---|---|---|---|
| CI | **37930520507** | `001a357` | success 18/18. Main's run 37964671673 was ALREADY PROVEN by it |
| Journeys (crawl + journeys, three engines) | **37930524012** | `001a357` | success |
| Golden School walk (Level 3, staging) | 37965014304 … 37967468474 | staging `001a357` | 4/4 green, school `sekolah-uji-daisy-001a` [recorded 9 Oct] |
| Local full suite | 9 Oct | `001a357` | 658 passed, 0 failed [recorded] |
| **Any CI build since 9 Oct** | — | — | **None until Batch 0.** The 9 Oct run (37930520507) was green. Batch 0 (2 Nov, branch): `ci.yml` green on Ubuntu 26.04 (41375753148, 661/0/0); browser jobs needed a 24.04 pin (`batch-0/02`) |

**Consequence:** the first CI build may need fixes before it can verify anything. 71 jobs use the unpinned `ubuntu-latest`. CI reads `psql` from the runner image [verified in workflow files].

## 5. CI allowance [verified with the coordinator's ledger, `audit/ci/actions-spend.mjs`]

- **D-139:** 1,000 minutes from 2026-10-09T06:00:33Z.
- **Used: 776** (215 runs, 656 compute minutes). Of that: CI 383, journeys 136, staging walks 140, the daily-spend job 84, facts 27, operator 6.
- **Remaining: about 224.**
- The scheduled jobs alone cost about 4 minutes a day.
- **Billing (verified 2 Nov, Batch 0):** the repository is public (D-143), and GitHub reports **0 billable ms** for the Batch 0 runs (run usage of 41374792031). The minute allowance is a governance limit, not a cost (Batch 0 report §CI).

## 6. Infrastructure and capacity [recorded]

- **Compute:** staging and production are both on the Micro tier.
- **Load test:** L1 failed on Micro (run 36964437916: p95 11.7 s, connection pool exhausted, CPU 98 %).
- **Auth IP forwarding:** off (D-092(c)).

## 7. Backup and disaster recovery (#150) [recorded, `docs/recovery/BACKUP-DR-REVIEW-2026-10-05.md`, D-104 … D-111]

**Verdict: NOT PASS.**

- **Closed:** B1 (hosted restore) and B2 (production backups seen).
- **Open:** B3 to B9.
- **B3 matters most.** Without the machine-readable backup read (token C1), G6 refuses every production migration.
- The off-platform backup (WP-B) is built but has never run on real infrastructure (no AWS account yet).
- Escrow custody: R1 has no possession proof; **R2's custodian is unnamed** (`docs/recovery/custody.json`).

## 8. Human acceptance

**None recorded for any journey.** Dr Gladys's second walkthrough is deferred (D-141). Under the mandate (D-142) it happens only after Gate 6.
