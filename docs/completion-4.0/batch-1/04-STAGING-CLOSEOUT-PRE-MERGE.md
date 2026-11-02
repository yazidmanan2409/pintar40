# Batch 1 · Staging closeout: pre-merge record (2 Nov 2026)

**Authority:** owner's «Batch 1 Staging Closeout: CONDITIONAL GO» (2 Nov), under D-146.

**Status: the pre-merge conditions Claude can meet are met. Two are open and need the owner (§1).**
- **The merge is not authorised, and `main` is not protected.**
- Nothing was merged. Nothing was written to staging. Production was not touched.

## 1. Conditions before the merge

| # | Condition | State | Evidence |
|---|---|---|---|
| 1 | `main` branch protection enabled, applicable checks enforced | **NOT MET: owner** | GitHub's public branch API, read 2 Nov: `main` → `protected: false`, required checks `[]`, enforcement `off`. Claude may not change repository settings (Batch 0 boundary) |
| 2a | A recent staging backup | **Owner to confirm** | Needs the Supabase dashboard (Database → Backups): a native backup newer than 26 h. Claude has no read of the backup list |
| 2b | Migration compatibility | Met | `02-MIGRATIONS-AND-EFFECTS.md`. Staging re-read 2 Nov: still 177 migrations (latest `20261210100000`); **0** card holders with a staff role, so migration 179's closing check passes |
| 2c | A feasible recovery procedure | Met, subject to 2a | `03-STAGING-PRE-DEPLOYMENT-GATE.md` §4 |
| 3 | The final candidate verified, including changes after the earlier journeys run | **Met** | §2 |
| 4 | Explicit owner authorisation of the protected merge | **NOT GIVEN** | The closeout message says it does not authorise the merge |
| 7 | Educator-as-learner and role transitions under CR-91 | **Met** (database and app) | §3 |

## 2. The final release candidate: `d4cc538`

| Run | Result |
|---|---|
| `ci` 41391068557 on `d4cc538` | **GREEN**: 18/18 jobs; strict selftest **675 passed, 0 failed, 0 skipped**; every red case proved its gate; verdict green |
| `audit-journeys` 41391072019 on `d4cc538` | **GREEN**: A (every role's screens, seeded world) and B (Gladys's path from an empty production-like database) |

**Changes since the earlier journeys run (`9f534a7`), all now covered by the runs above:**
- `dabafa5`: FABLE-05's test cleanup; the staging import refuses to delete review history.
- `d4cc538`: the role-transition test (§3).
- Documents only.

## 3. CR-91: educator-as-learner and role transitions

| Test | Proves |
|---|---|
| F23-C06 | An enrolled Guru keeps one EMAIL account and holds Belajar and Mengajar through it |
| F23-C01 | A role that **starts tomorrow** already blocks a card |
| **F23-C07 (new)** | A Guru, not yet activated, whose role is **revoked** through `revoke_role` (with its reason), and a person whose role has **expired**, are offered a card and granted it. Once either holds the card, a staff role is refused (42501 STAFF_ROLE_FOR_CARD). **Red** with staff status planted to ignore revocation and expiry (8 problems); green on migration 179 |
| F23-C03 / C04 | A card learner cannot be granted a staff role by any path; a legacy card-plus-role session is ended at sign-in |

**Operational consequence (no change made):**
- A learner who signs in with a class card and later becomes staff cannot be given the staff role while the card is their account.
- No path in the product turns a card account into an email account (one account per person).
- That is CR-91 working as approved. Such a person needs their account replaced, which is a support operation for the owner to decide when it first arises. It does not block staging verification.

## 4. Preservation baseline (staging, read-only, 2 Nov)

| Fact | Value |
|---|---|
| Migrations | 177 |
| «Sekolah Demo PINTAR»: active roles / official results / audit rows | 4 / 10 / 91 (= the 9 Oct baseline) |
| Assessment results, all schools | 1,521 |
| Latest audit row | 7,813 |

After the deploy, these are re-read:
- the demo school must be identical;
- the platform-wide result count must not fall.

## 5. CI minutes (D-145(d): 600)

| Run | Minutes |
|---|---|
| Batch 1 report runs (`9f534a7` ci, journeys; `dabafa5` ci) | 163 |
| `ci` 41391068557 (`d4cc538`) | 75 |
| `audit-journeys` 41391072019 (`d4cc538`) | 46 |
| **Total** | **284 of 600** |

## 6. After the owner acts

**Owner actions:**
1. Enable protection on `main`:
   - require a pull request;
   - require the status check **`verdict · green only when every job ran and succeeded`** (CI's verdict job);
   - require the branch to be up to date;
   - block force-push and deletion;
   - include administrators.
2. Confirm the staging backup.
3. Authorise the Batch 1 merge.

**Claude then:**
1. Opens the pull request from `claude/awesome-rubin-bqxp6p` into `main`.
2. Lets the protected checks run, and merges only when they pass. This is the normal path; `staging.yml` applies 178–181 on that push.
3. Runs the staging verification:
   - facts and migrations;
   - the CR-91 and send-back checks in a new test school `sekolah-uji-b1-<date>`;
   - the staging crawl with accessibility;
   - a Golden School walk on fresh synthetic data;
   - the §4 re-read.
4. Restores the freeze.
5. Reports PASS or FAIL.
