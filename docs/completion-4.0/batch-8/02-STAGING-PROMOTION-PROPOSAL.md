# Consolidated staging promotion: proposal for review (5 Nov 2026)

**Status: PROPOSAL ONLY.** Nothing here is authorised yet. No merge, migration or deployment happens until the owner
has reviewed this page and authorised it separately. Production is out of scope entirely.

**Authority for preparing it:** owner, 5 Nov: «Authorize preparation of one consolidated staging promotion proposal
covering the current verified branch, including the migration, deployment order, rollback strategy and affected
journeys. Do not authorize the actual merge, migration or deployment until that proposal is reviewed.»

**How the facts below were read:**
- The repository at the branch head.
- Staging, read only: `begin transaction read only`, SELECT only, through the Supabase connector on 5 Nov. Counts,
  digests and fingerprints only; no person, name, address or answer was read.
- Production was not read.

## 1. What would be promoted

| | |
|---|---|
| Branch | `claude/awesome-rubin-bqxp6p` |
| Candidate head | the head of the pull request opened for this promotion (§4 step 1). The code head verified so far is **`c9fec859`**: CI [41972257722](https://github.com/yazidmanan2409/pintar40/actions/runs/41972257722) green; journeys [41972261935](https://github.com/yazidmanan2409/pintar40/actions/runs/41972261935) green, both jobs, Batch 8 walk 9/9. The commits after it are this page, the rollback script and one staging-only tool (§6). CI and journeys run again on the final head before any merge. |
| Base | `main` at `3412075` (the Batch 5 merge). `main` is an ancestor of the branch: no conflict. |
| Size | 151 commits; 348 files |
| Database | **two migrations**, 194 and 195 (§2); staging is at 193 |

**What the 151 commits hold, by authority.** Each was developed on the branch under its own ruling and verified in CI
and the journeys. None has been on staging.

| Work | Authority | What changes on staging |
|---|---|---|
| Batch 6: the certificate as designed, the Digital Card (CR80), the email status (four provable states), the A4 print of each surface | D-159, D-160, D-164 | new screens and prints; no migration |
| D-161 branding direction recorded; today's logo stays in every slot | D-161, D-160(a) | words only; no logo asset changes (F-11) |
| D-177 corrections: back links, one pager grammar, result placement, terminology («paket», «Nomor Registrasi Sekolah», «PINTAR ID»), A1 question review, A2/A3 Uji Cepat figure from five scores, C1/C2 working context, E-K1–K9 | D-166 to D-177 | words and screens; no migration |
| E1 + E2: the integrated navigation (rail, collapse, context control, drawer) | D-170, D-171 | every signed-in page's shell |
| B1: Konfigurasi as an index and one page per section | D-166, D-169 | Konfigurasi |
| D1: the identity emails in Daisy's frame | D-165, D-177 scope note | **the emails staging sends** (see §5, decision P6) |
| Retrospective corrections (R0–R6) and the reverse reconciliation (E-RB-1..10) | D-178 to D-181 | small screen and wording fixes |
| D-183: exposed questions never give a real verdict | D-183, D-184, D-185 | **migration 194** |
| Batch 8: W6.1 rule-level tests; W6.10 walks; `/akun` under an evaluation persona; the Uji Penguasaan waits for the Pemetaan Awal | D-186 | **migration 195**; one page |

## 2. The two migrations

### 194 · `20261228100000_exposed_questions_never_give_a_real_verdict` (D-183)

- **What it adds:** `exposed_content_marks` (260 sha256 fingerprints, no text, append-only), five functions and two
  `before insert` triggers. In a school that is not synthetic, these refuse to **assign**, or to **start a new
  sitting** of, an OFFICIAL Pemetaan Awal or Uji Penguasaan over an exposed chapter (`PR050 ASSIGN_EXPOSED_CONTENT`).
- **What it replaces:** nothing that existed at 193.
- **What it writes:** only its own marks. No other row is written, and no sitting or assignment is changed.
- **On staging today (read only):**
  - Nine of staging's 19 non-synthetic schools hold an open cycle assignment of an exposed chapter: one chapter each,
    two open assignments each (18), and 96 sittings, of which one is open.
  - After 194, those 96 sittings stay exactly as they are (D-185 option 2), and the open one can still be finished: the
    trigger acts on a new sitting only. A new sitting or a new assignment of those chapters is refused.
  - These are the schools D-184 classified (`d184-staging-klasifikasi.md`), whose table sums to 96 sittings. The «106»
    written in D-184's text and in D-185 does not match that table; the records may want that one figure corrected.
  - The other open cycle assignments in non-synthetic schools (eleven chapters, among them five corrections) carry no
    exposed title or question and are unaffected.
  - The synthetic schools keep working (D-183(2)). The load-test school also uses an exposed chapter, and it stays
    allowed because it is synthetic.

### 195 · `20261229100000_the_mastery_check_waits_for_the_mapping` (W6.10)

- **What it changes:** one function, `may_start_assessment`, re-emitted with one added refusal, `PRE_TEST_NOT_FINALIZED`.
  The Uji Penguasaan of a chapter given with a Pemetaan Awal waits for the learner's Pemetaan Awal to be FINALIZED.
  The screens already held this order; this makes the database hold it too.
- **What it writes:** nothing.
- **On staging today (read only):**
  - 1,110 existing Uji Penguasaan sittings have no finished Pemetaan Awal. All are in synthetic schools; none is in a
    non-synthetic school. They are the load test's history (§6).
  - They stay as they are. The four still open can be finished; only a *new* start is refused.

### Prerequisites, read on staging on 5 Nov (to be read again immediately before the merge)

| Fact | Read |
|---|---|
| Migrations applied | 193; latest `20261227100000` (= the repository's first 193) |
| 194's objects | absent (`exposed_content_marks`, `course_is_exposed`) |
| `may_start_assessment` | `md5(prosrc)` = `c9b3f4ce04f07edc20f0124b0815ce45`, the 193 text; no order rule |

## 3. Compatibility during the deployment window

A push to `main` starts two things at once:
- Vercel builds the staging app from `main` (`pintar40-staging`, Git-connected, «Only build production»);
- `staging.yml` applies the pending migrations.

So for a few minutes the new app may run against the database at 193, or the old app against 195. **Both are safe:**

- **New app, database at 193.** Every database function the branch's app calls (198 names, read from `src`) is
  defined in `main`'s 193 migrations. The app reads nothing that 194 or 195 adds; the new refusal code
  `ASSIGN_EXPOSED_CONTENT` is only shown when the database raises it.
- **Old app, database at 195.** 194 only adds. 195 re-creates `may_start_assessment` with the same signature, the same
  grants and the same answer shape; the old screens already never start an Uji Penguasaan before the Pemetaan Awal.

**No production workflow is triggered by the merge:**
- `deploy-supabase-production` and `deploy-vercel-production` run only on a change to `.github/deploy-request.txt` or
  `.github/vercel-request.txt`, and the branch changes neither.
- The branch changes no `supabase/config.toml`.
- The branch's seven `staging-*-request.txt` changes are the Batch 5 staging verification records of 3 Nov. Their
  workflows trigger on pushes to the branch only, never to `main`.

## 4. Proposed order (each step only after the owner authorises the promotion)

1. **Pull request.** Open a pull request into `main` from the branch. CI and the journeys run on its final head and must
   both be green. It is mergeable `clean`, with no bypass of the branch rules.
2. **Backup (owner).** The owner confirms a physical staging backup less than 24 hours old, with a restore available
   (D-158's rule, as for Batch 5).
3. **Staging is quiet.** No one is testing on staging during the window (D-036). The staging freeze is lifted for the
   window only.
4. **Read-only pre-check.**
   - The three facts of §2, read again.
   - The preservation digests, by Batch 5's method (`batch-5/evidence/staging/preservation-before.txt`): whole-row
     digests of Dr Gladys's demonstration school and of every result, official result, certificate and integrity
     record outside the test schools.
5. **Merge.** A merge commit pinned to the verified head (`expectedHeadSha`). No rebase, no force-push.
6. **What the merge starts, watched:**
   - `staging.yml` (migrations 194 and 195; it checks that staging's count equals the repository's, 195);
   - `ci` on `main`;
   - the Vercel staging build.
   It must start no production workflow.
7. **Read-only post-check.**
   - 195 migrations.
   - 194's objects present: 20 TITLE and 240 STEM marks.
   - `may_start_assessment` holds the order rule.
   - The preservation digests are unchanged.
   - The 96 sittings in the nine schools are unchanged.
8. **Staging walks, existing tools only** (no new test is added for this promotion):
   - found a fresh synthetic test school with `found-school.yml`;
   - the Golden School regressions GS-01 to GS-21;
   - Studio;
   - the Batch 5 walk;
   - accessibility on staging.
   The new features are already proven in CI and the journeys on the candidate head. Staging proves that they run
   there and that nothing regresses.
9. **Report, then restore the freeze.** A staging verification report in the Batch 5 format.

## 5. Decisions this proposal needs from the owner

| # | Decision | Why |
|---|---|---|
| P-1 | **Authorise the merge and staging deployment** of the commits in §1, including Batch 6, whose promotion gate (D-159) has not yet been passed | D-159, D-177, D-186: each stops at a protected gate |
| P-2 | **Identity emails on staging (D1, P6).** Staging sends through PINTAR's real mailbox, so after the merge staging's sign-in, activation and recovery emails use D1's new frame. D1's scope note does not approve sending to real inboxes (P6). Choose: **(a)** allow the new emails on staging for the dedicated synthetic test accounts only (D1 test plan); or **(b)** hold D1 back: a revert of D1's template change before the merge, which needs its own CI run | D-165, the D-177 scope note of 4 Nov |
| P-3 | The words awaiting Dr Gladys (K1: Part A, B1–B36) appear on staging as Daisy proposed them, listed as pending; they are not accepted by this promotion | D-177 as applied, D-179(c) |
| P-4 | The staging records from these walks stay test data and are never promoted to production | D-185(3) |

## 6. Prepared with this proposal

- **`ROLLBACK-194-195.sql`** (this folder). Not a migration, and never applied by any workflow. It returns staging's
  schema to 193:
  - `may_start_assessment` goes back to its 193 text, checked against staging's md5;
  - 194's objects are removed;
  - the two `schema_migrations` rows are removed;
  - one transaction that commits only if its own checks pass.

  **Tested locally on a 195 database:**
  - the checks passed;
  - `may_start_assessment`'s md5 became `c9b3f4ce…`, exactly staging's;
  - the sittings were untouched;
  - `supabase migration up` then re-applied 194 and 195 cleanly (195 migrations, 260 marks, the order rule back).
- **`audit/perf/l1.mjs` adapted (staging-only tool).**
  - **Why:** the L1 wave (CAP-02, `perf-l1.yml` mode `wave`) started each learner's Uji Penguasaan directly. That is
    where staging's 1,110 sittings without a Pemetaan Awal came from, and after 195 every one of those starts would be
    refused.
  - **The change:** it now sits each learner's Pemetaan Awal in setup, untimed and outside the measured calls, as
    `l1-browser.mjs` (mode `browser`) has always done. The measured wave is unchanged.
  - **Checked:** its setup query plans on a local database at 195, and the file passes a syntax check. It can only run
    on staging, so its first run there is its proof.

## 7. Rollback strategy

| Problem after the merge | Rollback |
|---|---|
| The app only | Vercel: promote staging's previous READY deployment (built from `3412075`). The database stays at 195; §3 shows the old app is safe on it. |
| A migration | The owner runs `ROLLBACK-194-195.sql` as the database owner. The app may stay, since §3 shows the new app is safe at 193. |
| Everything | Run the rollback script, then push a **revert commit** of the merge to `main`: a new commit, with history not rewritten. `staging.yml` then finds 193 = 193, and Vercel rebuilds the old app. |
| Data | The physical backup of step 2 is the recovery point. Neither migration writes a row outside its own marks, so a data restore should not be needed. |

## 8. After staging carries the implementation

| Item | What runs | Authority needed |
|---|---|---|
| W6.2 U-PERF re-measured | `perf-staging.yml` probes and `concurrency.mjs` (30 staff sessions, synthetic staff) | covered once P-1 is given |
| W6.8 the 50-student test | `perf-l1.yml` mode `browser` with 50 learners of the synthetic load-test school: the real app, the Pemetaan Awal sat in setup, synthetic identities and data only | covered once P-1 is given |
| W6.9 release checklist v2.8 | regenerated from the evidence of W6.2, W6.8 and step 8; stale PASS rows re-proved or marked | none |
| J2.7 staff transition | the owner-authorised staging rehearsal | **separate authorisation** |
| W6.6, K1–K7 | recorded dependencies; no completed engineering work is reopened | owner, Dr Gladys |

Not in scope: production, real-school data, Dr Gladys's records and walkthrough (after the internal acceptance gates),
and the final logo (F-11).
