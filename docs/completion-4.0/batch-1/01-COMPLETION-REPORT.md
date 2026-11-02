# Batch 1 · Completion report: Data Model and Security (2 Nov 2026)

**Authorisation:** D-145 (Batch 1, conditional GO), D-146 (staging freeze lifted for Batch 1 verification only), D-144 (roadmap compatibility).

**Branch:** `claude/awesome-rubin-bqxp6p`.

**Verdict: IMPLEMENTED — NOT FULLY VERIFIED** (D-145(f)):
- everything is implemented and verified locally and on the branch;
- **staging verification has not run**, because staging deploys only from `main` and the merge needs the owner's explicit authorisation and verified branch protection (D-146; `03-STAGING-PRE-DEPLOYMENT-GATE.md`).

**Boundaries kept:**
- Nothing merged to `main`.
- Nothing written to staging (read-only SELECTs only).
- Production untouched.
- No history rewritten.

## 1. What was built

| Item | What | Commits |
|---|---|---|
| **CR-91**: class cards are a learner's alone (D-145(a)) | **Database invariant, both sides:** no person holds a class-card account and a staff role that is not revoked or expired (future-dated included). Trigger `accounts_card_is_learners` covers every account path: the activation grant, the seed/day-zero branch, a re-point. Trigger `role_assignments_card_holds_no_role` covers every grant path: `grant_role`, the first admin, bootstrap, import, seed; it fires before the general guard. `authorize_account_activation` and `authorize_card_reissue` refuse by name (42501 CARD_FOR_STAFF). The migration refuses to apply over a database that already breaks the rule. **App:** the card sign-in asks `kartu_bukan_staf()` as the new session and fails closed (session ended for this device only, attempt not settled, generic code). Aktivasi offers «kartu», single or whole-class, only where the database says `boleh_kartu`. **Educator-as-learner unchanged** (email account, Belajar + Mengajar) | `17e49ab`, `fa767f6` |
| **W1.6**: send back to the author | Edge `IN_REVIEW → VALIDATION_FAILED`, legal only inside `kembalikan_paket(course, reason)`: CAN_REVIEW, not the author, a reason of 10–1000 characters; outcome recorded; `content.sent_back` audited. **Correction path:** a sent-back draft is corrected in its line by a correction upload (`package_revision_problems`), or marked structured again and resubmitted. Screen and words: Batch 3 | `a683371`, `fa767f6` |
| **W1.8**: reviewer and approver in the history | `content_review_outcomes` (append-only; readable by the school's authors and reviewers): SENT_BACK with its reason, and APPROVED (written by trigger from the verified reviewer), each with reviewer and author | `a683371` |
| **W1.13**: atomic content step | `langkah_konten(course, to)`: the whole tree (items, lessons, modules, the chapter's rules, the course) in **one transaction**, SECURITY INVOKER, so row-level security and `enforce_content_status` decide as before. A refusal or shortfall undoes everything. `advanceContentAction` makes the one call | `a683371`, `fa767f6` |
| **W4.1**: approved v1 wording in the database | C29, C30 («siswa» → «murid» in coaching and question-quality findings); D23 («Bank soal untuk paket ini»); UX-17: a finding names the workbook's column («kolom Isi pelajaran»), never the database column; B15/B16 persona labels in the seed. **Not applied:** C31 (retained by ruling 7); the English rule's and RV-15's wording (no approved text); nothing awaiting Dr Gladys | `fbbc946` |
| **F-4**: public answer keys (D-145(b)) | **82 keyed files removed** from the active tree by forward commits (20 builds, 20 workbooks, 20 generators, 20 misconception maps, the 2 misfiled fixtures). Synthetic corpus and fixtures (`docs/onboarding/konten-sintetis/`, `audit/fixtures/sd5-sintetis-bab{1,2}`). Every test, audit and workflow re-pointed. The guard recognises keyed content in any file. Inventory of the 619 exposed items and their usage. The new-identity rule. **Private store: owner** | `1efe7dd` … `58e0d22`, `9f534a7` |

**Migrations:** 178–181, forward-only. Effects, existing-data impact and app/database compatibility are in `02-MIGRATIONS-AND-EFFECTS.md`.

## 2. Verification

### 2.1 Red → green (each test fails on the old code or schema, passes on the new)

| Proof | Red (before) | Green (after) |
|---|---|---|
| F23-C01 … C05 (DB, CR-91) | On the schema without migration 179: staff got card accounts through three paths; card learners got three staff roles; the new checks did not exist | All pass |
| CR91-K01, K02 (app) | Old app: a card whose person holds a staff role signed in (200); the form offered «kartu» to a Guru | Both pass |
| F23-W01 … W04, F23-T01 (DB, W1.6/W1.8/W1.13/W4.1) | The functions, the edge, the outcome record and the wording did not exist. W01 plants a step that fails at its last table: with the old five-request action the tree would be left mixed; with `langkah_konten` nothing moves | All pass |
| F23-C06 (educator-as-learner) | Green before and after: the regression guard | Pass |
| F-4 changed tests (L4-C01/P01, PENUTUPAN-M04, DAISY-30-TEKS-01, SEC-G01/G02) | Each shown red on a deliberately broken fixture | Green on the corpus |

### 2.2 Whole suite

| Run | Result |
|---|---|
| **Local, full manifest** (fresh stack, CI-like), integrated tree `cd048d0` | **673 passed, 0 failed**; 1 justified CI-only skip (F01-R04) |
| Local, every DB suite on a fresh database | 319 rows, 0 failing |
| Local typecheck / lint | 0 / 0 errors |
| **CI (branch)**, `dabafa5` | **GREEN**: 18/18 jobs; strict selftest **674 passed, 0 failed, 0 skipped**; every red case proved its gate (§2.3) |
| **Journeys (branch, local stack; Chromium for the crawl, three engines for job B)**, `9f534a7` | **GREEN**: A (every role's screens, seeded world) and B (Gladys's path from an empty production-like database) both succeeded |
| **Staging** (deploy, facts, staging crawl, Golden School on fresh synthetic data) | **NOT RUN**: blocked on the merge authorisation (§5) |

**The first full run found 323 failures; every one was traced and fixed, none suppressed:**
- **One cause aborted a whole runner:** the probe-cleanup helper could not delete a probe course past the new outcome table. The helper now removes outcomes like pass marks.
- **One real defect:** the CR-91 sign-out used supabase-js's default **global** scope, which would have ended the person's sessions on every device. It now uses `keluarPerangkatIni`, this session only (BOB05-K01).
- **Project contracts**, fixed at their cause:
  - coded refusals, one per raise and readable by the classifier (BOB07-K01/K02, BOB32-K02);
  - ADR-0021 rights restated on re-emitted functions;
  - the learner-RPC ownership walk (`kartu_bukan_staf` through `current_person_id()`);
  - the readiness rights baseline;
  - the two migration-count tripwires, moved after re-reading their rulings.
- **Two tests restated** where their rule now lives (PENUTUPAN-F01 in `langkah_konten`; the DAISY-09 fixture names a learner).
- **Two failures were environment only** (the F-4 agent's temporary worktree duplicated the frozen documents); the worktree is removed.

### 2.3 CI on the branch

| Run | Commit | Result |
|---|---|---|
| `ci` 41384760756 | `9f534a7` | **RED**: 2 of 18 jobs. The red-case gates for bob35 and fable05 run `run_fable05()` more than once on one database; its cleanup `f05_reset` could not delete its own approved probe course past the new `content_review_outcomes` foreign key. The same defect class as `purge_probe_content` (§2.2), in a second helper; the local full run had not caught it because it runs each suite once |
| `audit-journeys` 41384764104 | `9f534a7` | **GREEN**: jobs A and B |
| `ci` 41387912678 | `dabafa5` | **GREEN**: 18/18 jobs, strict selftest 674/0/0 (F01-R04 runs in CI), verdict green |

**Fix (`dabafa5`), not a suppression:**
- `f05_reset` removes only its own probe courses' outcome rows, with the history trigger off for that statement (as `purge_probe_content`).
- Reproduced locally first: the suite failed on its second run; after the fix three consecutive runs were 25/0, the bob35 gate proved 5/5 plants, and the FABLE-05 red-case step ran clean end to end.
- The same review found `audit/import-staging.mjs`, which replaces an unreleased staging draft by deleting it. It now **refuses** a draft that has review history, rather than deleting history or failing on the key.

Between `9f534a7` and `dabafa5` only documents, that helper and that script changed, so the journeys result on `9f534a7` stands for the app.

## 3. Staging pre-deployment gate (D-146)

Prepared: `03-STAGING-PRE-DEPLOYMENT-GATE.md`.
- **Staging read-only:** 177 migrations; **Dr Gladys's «Sekolah Demo PINTAR» is exactly at its 9 Oct baseline** (6 places, 4 roles, 10 official results, 3 certificates, 91 audit rows).
- **No Batch 1 migration writes to it.** Verification would use a new test school.
- **Outstanding:**
  - the merge authorisation;
  - verified branch protection;
  - the owner's confirmation that staging has a backup newer than 26 h.

## 4. CI minutes (D-145(d): 600, rounded up per job)

Every run created on the repository since the Batch 1 ledger opened (2 Nov, 03:03 UTC), each job's minutes rounded up:

| Run | Workflow | Jobs | Minutes |
|---|---|---|---|
| 41384760756 | ci (`9f534a7`, red) | 18 | 56 |
| 41384764104 | audit-journeys (`9f534a7`) | 2 | 45 |
| 41387912678 | ci (`dabafa5`, green) | 18 | 62 |
| **Total** | | | **163 of 600** |

GitHub bills 0 for this public repository; the ceiling is counted as runner-minutes regardless.

## 5. Remaining dependencies and owner decisions

| # | Item | Needed for |
|---|---|---|
| 1 | **Authorise the Batch 1 merge into `main`**, after enabling and confirming **branch protection** (deliverable 4 §6 R-1 of Batch 0) | Staging verification → Batch 1 PASS |
| 2 | Confirm staging has a native backup newer than 26 h | The staging recovery point |
| 3 | **F-4:** create the private content store and its access list; mark the chapters used for real assessment; confirm no real use on production; optionally the exposure flag (F-4 inventory §3.4, a class B provision) | F-4 steps 1 and 5 (regeneration before real use) |
| 4 | The owner's personal address in three files (Batch 0 security report §4.1): keep, or replace with a role address after the merge | — |
| 5 | Wording with no approved text: the English coaching rule's label, and RV-15's bootstrap school name | W4.1 remainder |
| 6 | Dr Gladys's written terminology answers (Batch 0 deliverable 8) | Batch 7 |
| **For Batch 2** | **F-12: commission Daisy** (the five designs gate batch 3); and nothing else blocks Batch 2's shared components | Batch 2 start, batch 3 |

## 6. Unresolved security and data-integrity findings

- **No open finding against Batch 1's code.**
- **Known limits, recorded:**
  - **The history scan judges an old file by its current declaration:** older real-content versions of the example workbook are not flagged in `--history`. The CI and pre-commit modes are unaffected, and the workbook is in the inventory.
  - **Exposed keys remain public in history and in any copy taken** (D-143): F-4's regeneration is the remedy, not hiding.
  - **Reviews before migration 181 have no outcome row;** their reviewer stays on the course row and in the audit log.

## 7. Roadmap compatibility (D-144): known items only

| Item | Class | Note |
|---|---|---|
| `content_review_outcomes` (who reviewed, why sent back, when) | A (required by W1.8) | It is also the review evidence 4.5 Report Intelligence and Educator Growth would read. Built for 4.0's need, not beyond it |
| Regenerated items under new identities | A (F-4 rule) | Keeps 4.5 Question Intelligence free of exposed-item statistics |
| The CR-91 invariant (card ≠ staff) | A | 4.1 cross-device and QR-assisted transfer extend sessions; the invariant is per person and account, so a transferred session carries no new power |
| Exposure flag on exposed courses | **B: not built**, owner decision | F-4 inventory §3.4 |

## 8. GO / NO-GO

- **Batch 1 on the branch: GO.** Complete, verified locally and on the branch.
- **Batch 1 overall: NOT YET PASS.** It is **IMPLEMENTED — NOT FULLY VERIFIED** until the staging verification runs (D-145(f)).

**Recommendation:**
1. The owner enables and confirms branch protection on `main`, confirms a recent staging backup, and authorises the Batch 1 merge.
2. Claude then deploys to staging through the normal path and runs the staging verification (facts, staging crawl, a Golden School walk on fresh synthetic data, the CR-91 and send-back checks in a new test school, the demo school re-read).
3. Claude restores the freeze and reports PASS or FAIL.
4. Batch 2 starts only on the owner's separate authorisation.

**STOP.** No Batch 2 work. No Dr Gladys walkthrough.
