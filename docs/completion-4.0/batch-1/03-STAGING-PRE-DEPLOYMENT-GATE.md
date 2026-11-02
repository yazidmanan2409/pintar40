# Batch 1 · Staging pre-deployment gate (D-146) · 2 Nov 2026

**Status: the gate is prepared; staging remains UNCHANGED.**

Deployment waits on two owner actions that D-146 does not include:
1. **explicit authorisation to merge Batch 1 into `main`.** Staging's migrations apply only on a push to `main` (`staging.yml`: `if: github.ref == 'refs/heads/main'`), and its app follows `main`;
2. **branch protection on `main`, enabled and confirmed by the owner** (D-145(e)). Claude cannot read or set it from this session.

Nothing was written to staging. Every staging fact below came from read-only SELECTs.

## 1. The candidate

| | |
|---|---|
| Branch | `claude/awesome-rubin-bqxp6p` |
| Candidate commit | the branch head carrying this document (code last changed at `dabafa5`, CI green) |
| Diff over staging (`001a357`) | Batch 0 (harness, guard, CI pins, documents) + Batch 1 (4 migrations, CR-91 app checks, `langkah_konten` action, F-4 corpus and removals) |
| Migrations to apply | 178–181 (`20261211100000` … `20261214100000`), forward-only, in order; effects in `02-MIGRATIONS-AND-EFFECTS.md` |

## 2. Staging as it is now (read 2 Nov 2026, 03:47 UTC)

| Fact | Value |
|---|---|
| Migrations applied | **177**, latest `20261210100000` (= `001a357`) |
| `platform_environment` | `production`. Staging runs in production posture; no Batch 1 migration depends on it |
| Class-card accounts / with an active staff role | 1,353 / **0**. Migration 179's closing check passes |
| `evaluation_personas` rows | 0. B15/B16 are seed-only; staging is unaffected |
| Latest audit row | 7,813 |

### 2.1 Dr Gladys's demonstration school: «Sekolah Demo PINTAR» (`sekolah-demo-pintar`)

| Fact | 9 Oct baseline (EVIDENCE.md) | 2 Nov (now) |
|---|---|---|
| Active places | 6 | **6** |
| Active roles | INSTITUTION_ADMIN 1, EDUCATOR 1, HEAD_OF_DEPARTMENT 1, DEAN 1 | **same** |
| Official results | 10 | **10** |
| Issued certificates | 3 | **3** |
| Audit rows at the school | 91 | **91** |
| Courses | — | 1 (APPROVED: SD5 Bab 1, the exposed chapter; F-4 inventory §2) |
| Enrolments / accounts | — | 5 / 8 |

**Unchanged since the 9 Oct baseline.**

## 3. Does Batch 1 touch the demonstration school?

| Migration | Writes on staging | The demo school |
|---|---|---|
| 178 | 4 `doctrine_lexicon` rows (platform reference); `learner_readable_fields` gains a column | Not touched. Its findings keep their words until its package is next checked, which nobody will do |
| 179 | None (guards, functions) | Not touched. Its class cards (if any) belong to learners; the check passes |
| 180 | 1 `content_status_transitions` row | Not touched |
| 181 | None (a new empty table, functions, triggers) | Not touched. Its approved course gains no outcome row (outcomes begin with 181) |

**Verification writes go only to fresh test schools:**
- The Golden School walk makes its own school each run.
- The journeys run on a local stack.
- The CR-91 and send-back checks on staging use a new, clearly named test school (`sekolah-uji-b1-<date>`).
- **Nothing is written to `sekolah-demo-pintar`.**
- §2.1 is re-read after the deploy and must match.

## 4. Recovery and failure plan (staging)

| Point | Plan |
|---|---|
| Recovery point | Supabase's native daily backup of staging (G2 proved a native restore of staging: 157 tables identical, 8 min). **Before the merge, the owner confirms in the dashboard that a backup newer than 26 h exists.** Claude cannot read staging's backup list without the management token |
| A migration fails mid-push | `db push` stops; that migration rolls back; staging stays at the last good one. **Batch 1's four migrations are independent of each other's data**, so any prefix is a consistent schema for the *previous* app. Action: stop, keep the run log, find the cause, fix forward on the branch; no improvised fix on staging (D-146 §7) |
| Push completes, the app misbehaves | The previous app (`001a357`) runs on database 181 (`02-MIGRATIONS-AND-EFFECTS.md`, compatibility). Redeploy it while the cause is found. **Forward-only: redeploying old code does not reverse the database**, and nothing here needs reversing to keep staging safe |
| Data damaged (not expected: the migrations write no school data) | Restore the native backup: an owner action, separately authorised |

## 5. Gate checklist

| Condition (D-146 §4) | State |
|---|---|
| Candidate identified by commit | Yes (§1) |
| Local and branch tests pass | Local: full suite **673/0** (+1 CI-only justified skip), every DB suite 319/0 on a fresh database. Branch CI `dabafa5` GREEN (674/0/0); journeys `9f534a7` GREEN (completion report §2.3) |
| Migration contents and dependencies reviewed | Yes (`02-MIGRATIONS-AND-EFFECTS.md`); applied cleanly from empty locally (181) several times |
| Staging's actual schema verified | 177 = `001a357`'s set, read 2 Nov (§2) |
| Recovery and contingency documented and feasible | §4; one owner confirmation outstanding (a recent backup) |
| Known security and data-integrity risks addressed | CR-91 closed in DB and app; no unresolved finding against Batch 1 (completion report §6) |
| Within Batch 1 scope | Yes |
| **Merge authorisation and verified branch protection** | **Outstanding: owner** |
