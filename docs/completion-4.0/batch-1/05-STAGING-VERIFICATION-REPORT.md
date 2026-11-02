# Batch 1 · Staging verification report (2 Nov 2026)

**Authority:** owner's «Batch 1 Protected Merge & Staging Verification — CONDITIONAL GO» and «GO — SUBJECT TO GREEN PR CHECKS» (D-147), under D-145 and D-146.

**Verdict: Batch 1 PASS on staging.**
- Every required verification ran on the deployed candidate and passed.
- Dr Gladys's demonstration school and every existing assessment record are unchanged.
- **The staging freeze is restored** (D-147(e)).
- Production was not touched. No Batch 2 work.

**What this PASS does not mean:**
- It is not human acceptance.
- It is not Gate 5 or 6.
- The send-back has **no screen yet**: Batch 3 builds it. On staging, its database behaviour was verified as the school's own people, not through a screen (§4.2).

## 1. Protected merge

| Item | Evidence |
|---|---|
| Ruleset enforced | GitHub's rules API for `main`: `pull_request`, `required_status_checks` (`verdict · green only when every job ran and succeeded`, app 15368, strict), `non_fast_forward`, `deletion`. PR #3 read `mergeable_state: blocked` while the check ran, `clean` after it passed |
| Candidate | PR #3 head `6743f04` (code last changed at `d4cc538`). CI on the PR: run 41396610763, 18/18, verdict green |
| Merge | `430544b`, through the PR with `expectedHeadSha` pinned; a merge commit; no bypass |
| What the merge triggered | Only `ci` (41398310519, green, 63 min) and `staging · database and sign-in` (41398310527). No production workflow: each production workflow is gated by a request file this PR does not touch |
| Separate from the PR | The staging accessibility walk (`audit/staging/a11y-staging.mjs`, `.github/workflows/staging-a11y.yml`) was committed on the branch after the merge (`0896d78`). It is verification tooling only, runs from the branch, and is not on `main` |

## 2. Recovery readiness and pre-deployment checks

| Check | Result |
|---|---|
| Backup | Scheduled physical backup, 1 Nov 23:40 UTC (owner). It **excludes Storage objects**; Batch 1 writes none |
| Migration preconditions (read-only, before the merge) | 177 migrations; 0 card holders with a staff role (179's closing check); 11 learner-readable columns, 6 lexicon rules, and no «siswa» after 178's updates (computed); 180's edge absent |
| Recovery plan | `03-STAGING-PRE-DEPLOYMENT-GATE.md` §4. It was not needed |

## 3. Deployment

| Fact | Evidence |
|---|---|
| Migrations | Staging run 41398310527: every step green, including «Migrations after — must equal the repository». **181 applied** (`20261211100000` … `20261214100000` added) |
| App = candidate | Environment facts 41400103860 GREEN: staging's app commit is `main`'s code, and its migrations equal the files at that commit. GS-00 re-checked this inside every Golden School run |
| Sign-in boundary | Re-written and read back in the same staging run; the live sign-in round trip passed |

## 4. Verification on staging

All writes went into a new test school, **«Sekolah Uji B1 1102» (`sekolah-uji-b1-1102`)**, founded by `found-school.yml` (run 41400107343).

### 4.1 Golden School on fresh synthetic data (the application's own screens)

| Step | Run | Result | Batch 1 evidence inside it |
|---|---|---|---|
| GS-01–03: first administrator | 41400228976 | PASS | — |
| GS-04–11: structure, staff, upload of the **synthetic** chapter (F-4), review and publication with the head of department, given to the class | 41400643297 | PASS | **W1.13:** the app's step `langkah_konten` moved the whole tree; all 18 items, every lesson and module APPROVED. **W1.8:** one APPROVED outcome, reviewer = the head of department, author a different person |
| GS-07 cards, GS-12–16: class cards made on Aktivasi; learners sign in with them and sit both tests | 41401958860 | PASS | **CR-91:** Aktivasi offered cards for learners, and the card sign-in route's new check (`kartu_bukan_staf`) let each learner in |
| GS-17–21: every role's reports, certificate, card re-issue, recovery, the shared computer, the public check | 41403668209 | PASS | **CR-91:** `authorize_card_reissue` re-issued learners' cards; the card lock and «Bukan akun Anda?» on a shared computer |

### 4.2 Security and content checks as the test school's people (database, nothing persisted)

**How they ran:**
- One statement on staging acted as the test school's teacher, head of department, administrator and a card learner (their own sign-in identities).
- It ended by raising, so nothing it did was kept.
- Afterwards, a read confirmed nothing persisted: no probe course, no SENT_BACK outcome, no role on any card account.

**What this is and is not:**
- It is not a screen journey; the owner noted rollback checks do not replace those.
- Where a screen exists, the journeys in §4.1 cover it.
- The send-back has no screen until Batch 3.
- A card for staff cannot be created through any screen, so a staff card being refused at sign-in cannot be shown on staging without planting legacy data, which was not done. CI covers it (CR91-K01, F23-C04).

| Check | Result |
|---|---|
| The author sends the package back | Refused, 42501 SENDBACK_NOT_REVIEWER |
| The head of department, reason «kurang» | Refused, SENDBACK_REASON_MISSING |
| Sending back an approved package | Refused, SENDBACK_NOT_IN_REVIEW |
| The head of department, with a reason | **Accepted:** course VALIDATION_FAILED, **0** tree rows left behind; one SENT_BACK outcome (reviewer = head of department, author = teacher, the reason kept); one `content.sent_back` audit row; `paket_dikembalikan` true |
| Correction path | The author marked the sent-back draft structured again: accepted |
| A staff role for a card learner | Refused, 42501 STAFF_ROLE_FOR_CARD |
| A card account re-pointed to the teacher | Refused, 42501 CARD_FOR_STAFF |
| `kartu_bukan_staf()` | true for the card learner; true for the teacher (who has no card) |
| Card holders with a staff role, platform-wide | **0** |

### 4.3 Accessibility (the Batch 0 harness on staging)

Run 41402855483: every staff role of the test school signed in, and every working context plus the public pages were checked (**11 screens, 22 page checks**). axe ran on all of them.

| Finding | Staging | Batch 0 baseline (local crawl) |
|---|---|---|
| Title missing or only «PINTAR» | 11/11 | 39/39 |
| No skip link as the first Tab stop | 11/11 | 39/39 |
| A focus stop without a visible indicator | 1 | 1 |
| axe violations | `label` (critical), 1 screen: `/lapor` | the same rule, the same screen |
| Wider than the window, or clipped text, at 320 / 640 / 1024 / 1280 px | 0 | — |

**No new accessibility finding from Batch 1.** The recorded ones are the Batch 0 baseline, scheduled for later batches.

### 4.4 Regression

- CI on `main` after the merge: run 41398310519, green.
- CI and browser journeys on the candidate: `d4cc538` (`04-STAGING-CLOSEOUT-PRE-MERGE.md` §2).
- The four Golden School steps are the regression walk on staging (§4.1).

## 5. Preservation

| Fact | Before (2 Nov, pre-merge) | After verification |
|---|---|---|
| «Sekolah Demo PINTAR»: active roles / official results / assessment results / certificates / enrolments / courses | 4 / 10 / 10 / 3 / 5 / 1 | **4 / 10 / 10 / 3 / 5 / 1** |
| Its audit rows (last id) | 91 | **91** (last id 6,860, older than this work) |
| Assessment results, all schools | 1,521 | 1,532 = 1,521 + **11 in the test school** |
| Card holders with a staff role | 0 | 0 |

- **Nothing was written to the demonstration school.**
- **No existing assessment record changed or disappeared.**

## 6. CI minutes (D-145(d): 600)

| | Minutes |
|---|---|
| Earlier Batch 1 runs (reports 01 and 04) | 284 |
| PR CI 61, `main` CI 63, staging migrations 2, facts 1, founding 2, Golden School 5 + 11 + 10 + 21, accessibility 6 | 182 |
| **Total** | **466 of 600** |

## 7. Freeze and stop

- **Staging freeze restored (D-147(e)):** nothing changes on staging or `main` without a new owner authorisation.
- The test school `sekolah-uji-b1-1102` stays on staging as evidence; it is synthetic.
- The branch carries only the verification records after the merge.

**Remaining owner items** (from the Batch 1 report, unchanged):
- F-4's private store and real-use marking;
- the personal address in three files;
- wording with no approved text;
- commissioning Daisy for Batch 2/3.

**One operational note:** a card learner who becomes staff needs their account replaced (`04-…` §3).

**STOP for owner review.** No Batch 2. No Dr Gladys walkthrough.
