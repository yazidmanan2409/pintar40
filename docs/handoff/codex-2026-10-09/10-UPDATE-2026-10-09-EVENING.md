# PINTAR 4.0 · Handoff delta: 9 Oct 2026, evening (D-137 → D-140)

**From:** Claude (the coordinator). **Written:** 9 Oct 2026, about 13:00–13:40 UTC, at the owner's instruction «Final one-hour work window and handoff».
**What this is:** a delta on top of files 00–09, which describe the state at about 13:20 UTC on **8 Oct**. Files 00–09 are kept as written. Where a fact below supersedes one there, this file says so; 00 §0 points here.
**Evidence classes, never merged:** *implemented* (code exists) → *locally verified* (this container) → *CI verified* (GitHub Actions on the commit) → *staging verified* (the running staging application) → *human accepted* (a person, by name). **No capability gained human acceptance in this period.**

---

## 1. The state at the stop (verified 9 Oct, about 13:40 UTC)

| Item | State | Source |
|---|---|---|
| main | **8851988** (D-138/D-140 application pass, steps 1–5 and the first D-140 fixes) | `git rev-parse origin/main` |
| Working branch | `claude/awesome-rubin-bqxp6p` at the commit holding this file (see §11). **17 commits ahead of main** before this handoff, main an ancestor (fast-forward possible) | `git log origin/main..HEAD` |
| Staging app | **8851988**, deployment `dpl_35dkbHYVBk2iJ63tNGcPhF4i8SzF`, `staging.pintarselalu.com` | facts run 37911713146 (GREEN) |
| Staging database | **177 migrations**, equal to main's (no migration was added after 8851988; `git diff 8851988..HEAD -- supabase/` is empty) | facts run 37911713146 |
| Production | **5b5b68d**, untouched in this period (no release since 23 Sep; D-004) | facts runs; no production workflow run |
| Unmerged, CI-proven code | **Fix batch A** (44cebee, 42990bd, b117a72) and **batch B / RV-10** (001a357): branch only. Head **001a357**: CI 37930520507 18/18, journeys 37930524012 green, local suite 658/0. See §2, §3 | |
| Dr Gladys's second walkthrough | **NOT READY.** The walkthrough-blocking defect RV-10 is fixed on the branch but **not on staging**; batch A is not on staging either. See §8 | |

Superseded from 00 §1: main is no longer 8202139/dab5c12; staging is no longer dab5c12; the design lane is now being applied to `src` (D-138); the CI allowance line is replaced by §9.

## 2. What was done since the 8 Oct handoff

### 2.1 Decisions recorded (all in `docs/coordination/DECISIONS.md`)

- **D-137** (9 Oct): the known-issues batch landed on main 894ae01: **CR-52** (Bank Soal filter by use and the author's difficulty band; key and reasons shown only to CAN_DRAFT holders), **CR-92** («Komputer siapa ini?» opens on the declared choice), **L4 finding 6** (Peran & akses paged), English mode names. **The S23q exception was closed** (journeys 37876329363: 76 PASS, 0 FAIL). The CI allowance was exceeded on the owner's word (1,913 of 1,900).
- **D-138** (9 Oct): the UI/UX application stage began. Daisy's frozen design (`ux-1/daisy-experience`, c42fecb) is applied to `src`. Log: `docs/reports/PINTAR-4.0-APPLICATION-PASS-LOG.md`.
- **D-139** (9 Oct): **1,000 additional CI minutes** from 2026-10-09T06:00:33Z, counted with `audit/ci/actions-spend.mjs`.
- **D-140** (9 Oct): close current findings; prepare staging for Dr Gladys; **walkthrough freeze**; after the walkthrough classify findings A–F and wait; then this handoff and STOP.

### 2.2 Landed on main (8202139 → 8851988)

`git log --oneline 8202139..8851988` lists 31 commits. In order of effect:
1. **894ae01** (with 4693d4d): the D-137 known-issues batch.
2. **Application pass step 1, tokens** (643eb9e): token set v3 in `src/app/globals.css`, v2 names as aliases; the frozen certificate keeps its sizes (ce1ba94).
3. **Step 2, primitives** (26a288b, 3ded8bd, ce1ba94, 95b1209): Button, fields, segmented control, tabs, result lines at 44 px; guard UX1-V3-TARGET-01.
4. **Step 3, shells** (9fc1ca5): the staff AppShell (left navigation from 1024 px, top bar and menu below), the learner top bar.
5. **Steps 4–5 and the first D-140 fixes** (8cfe97e, 7429fc6, f5ce56f, 8851988): v3 components on the surfaces they use; copy owed (`11-validation.md` §4) and Terminology v1 (D-134, D-138(c)); Jejak audit in words (DG-11); the tour veil on Dialog's layer tokens (OP-8); AP-5 (navigation offset), AP-6 (sub-44 px Tailwind controls), AP-7 (test instruments read the assembled page).
6. Crawl change 5559111: every page keeps a 320 px screenshot (AP-3).

### 2.3 On the branch only (after 8851988)

| Commit | What | Class |
|---|---|---|
| 0f55f1b | Dr Gladys's guide (`docs/onboarding/PINTAR-Panduan-Walkthrough-Sekolah-Demo.md`): «surel» → «email», two lines, as the screens say (Terminology v1 E1–E9) | document; held off main by the owner's word until verified. The screens say «email» (journey P3: «Masuk dengan email atau username»); CI on 001a357 runs on a tree containing it. **Needs the owner's yes to go to main with the code** |
| b8588b0, ee7efbb, b506abe, ccb3da0 | Golden School walk on staging, school `sekolah-uji-daisy-885` (request files only) | walk evidence, §3.4 |
| 5d16b2e | Pass log: the independent review of 8851988, RV-1 … RV-24 recorded OPEN | record |
| c8b7c6f, 812efbd | Golden School walk scripts: failures become GitHub annotations; the menu is opened under 1024 px as a person would; the population pattern without `\b`; failures keep the locator line | test instrument |
| 75b8721, 9314127, 76ab5ea, c5c9e2a | Golden School diagnostic re-walk, school `sekolah-uji-daisy-885b` (request files only) | walk evidence, §3.4 |
| **44cebee** | **Fix batch A**: RV-1, RV-2, RV-3, RV-4, RV-5 (partial), RV-6, RV-12, RV-13, RV-17; new `src/lib/kata-halaman.ts`, `src/components/studio/TabStudio.tsx`; guard **D140-SAJI-01** | code |
| 42990bd | D140-SAJI-01's manifest text names its artefacts (F06-S04) | test record |
| b117a72 | Journey S23l restated for RV-1 (the form shows «Halaman: Mengajar»; the stored path is still checked) | test instrument |
| 61cdf61 | Pass log: batch A record, the walkthrough readiness classification, two corrections | record |
| **001a357** | **Batch B, RV-10** (approved by the owner: «Fix RV-10 only»): Studio's home and a published package's headline; guard **D140-STUDIO-01** | code |
| (this commit) | this file, 00 §0, the pass log's final state | record |

Files changed by batches A and B (code): `src/lib/kata-halaman.ts` (new), `src/lib/hle.ts`, `src/app/lapor/page.tsx`, `src/app/lapor/saya/page.tsx`, `src/components/keamanan/CatatanKeamanan.tsx`, `src/components/NavKonteks.tsx`, `src/components/TabTempat.tsx`, `src/components/CangkangPengalaman.tsx`, `src/app/akun/page.tsx`, `src/app/konfigurasi/page.tsx`, `src/app/konfigurasi/email-uji/page.tsx`, `src/app/konfigurasi/keamanan/page.tsx`, `src/app/experience.css`, `src/components/studio/TabStudio.tsx` (new), `src/app/studio/layout.tsx`, `src/app/studio/page.tsx`, `src/app/studio/paket/[course]/page.tsx`; tests `selftest/experience.test.ts`, `selftest/manifest.json`, `audit/journey.mjs`.

## 3. Verification, exactly as observed

### 3.1 On main 8851988 (what staging runs)

- CI on the branch commit with identical code: green; main run 37911489553 **cancelled itself as ALREADY PROVEN** (E1; 1 job success, 7 cancelled).
- Environment facts **37911713146: GREEN** (staging = main's code, 177 = 177 migrations, email settings present).
- **Golden School walk, school `sekolah-uji-daisy-885`:** steps 1–3 green (37911971442, 37912319567, 37913241956); **step 4 (reports, certificate, recovery, shared computer, public check) FAILED**, run 37914110104: 10 PASS, 7 FAIL, 1 NOT RUN (L1–L4, R2, N1, X1 red; R3 not run).
- **Diagnosis:** the step 4 failures were in the walk scripts, not the application. L1–L4: the population check used `\b`, which fails because `textContent` joins elements («mengerjakanTidak»). R2: the walk runs at 820 px, where «Akun saya» sits in the opened menu (OP-9), and the script did not open the menu. N1: the same menu cause (the walk could not sign out the way it expected); X1 followed. Fixed in 812efbd.
- **Diagnostic re-walk, school `sekolah-uji-daisy-885b`, on staging 8851988 with the fixed scripts: ALL FOUR GREEN** (37916711364, 37917177366, 37918037282, 37919391328). This is the staging behaviour evidence for 8851988.
- **Independent review of 8851988** (read-only, from the crawl screenshots of identical code; the container cannot reach staging): 24 findings RV-1 … RV-24, 2 BLOCKER, 15 MAJOR, 7 MINOR, all recorded OPEN (pass log, 5d16b2e). Its limits are in the pass log (not seen: an assessment in progress, a result page, an issued certificate, 1024–1279 px, and others).

### 3.2 Fix batch A (44cebee … b117a72)

- **CI 37917925527 on 44cebee, attempt 1:** one red-case job died before any test body: the runner's port 54322 was already bound, so the stack never started. That was an infrastructure failure, re-run once as the rules allow. **Attempt 2:** that job green; **selftest 657 passed, 1 failed: F06-S04** (D140-SAJI-01's `proves` did not name the artefact). A real defect, fixed in 42990bd.
- CI 37921432883 on 42990bd: **cancelled by the coordinator** (the head was about to change with b117a72; it needed a run of its own).
- **CI 37927976617 on b117a72: success** (all jobs). This is batch A's CI evidence.
- Journeys 37927979286 on b117a72: **cancelled by the coordinator** once RV-10 was approved (the final head needed its own run). No result.
- **Local journeys on 42990bd:** 74 PASS; **S23l FAIL** on its stale check (it expected the old path «/mengajar» on the form; restated in b117a72); **BD11 BLOCKED locally** (Firefox and WebKit are not in the container; BD11 runs only in CI).
- **Local crawl on the fresh build of batch A** (389 pages, 14 personas): 0 broken, 0 wider than 320 px, 0 over 3 s; one refusal (boot-siswa, RV-7). The 320 and 1280 px screenshots were reviewed by the coordinator: RV-1, RV-2, RV-3, RV-4, RV-6, RV-13 and RV-17 seen fixed.

**Stale evidence, reported and corrected (pass log, 61cdf61):**
- A local «656 passed» was reported for batch A. It was a stale result file from 08:06. That run had not started, because the local Docker daemon had stopped.
- The first local crawl of batch A ran on an old `.next` build (the script skips the build when one exists), so its screenshots showed the old screens.
- Both were redone and the corrections are recorded. **The suite evidence for batch A is CI's** (37927976617).

### 3.3 Batch B, RV-10 (001a357)

- **Locally verified:** guard D140-STUDIO-01 PASS on 001a357; **FAIL on the old Studio pages, for both reasons** (shown by stashing the two page changes); F06-S04 PASS (363 static/app tests name their artefact); `tsc` 0; `eslint` 0 errors.
- **CI 37930520507: success 18/18; journeys 37930524012: success; fresh local suite 658/0; local crawl clean.** Details in §3.5.
- **Not staging verified.** Nothing after 8851988 is on staging.

### 3.4 Golden School walks this period (all on staging)

| School | Commit on staging | Result | Runs |
|---|---|---|---|
| `sekolah-uji-baseline-894` | 894ae01 | 4/4 green (the D-138 baseline) | 37879198761, 37879701505, 37881020645, 37884383500 |
| `sekolah-uji-daisy-885` | 8851988 | steps 1–3 green; step 4 FAIL (walk-script defects, §3.1) | 37911971442, 37912319567, 37913241956, 37914110104 |
| `sekolah-uji-daisy-885b` | 8851988 | **4/4 green** with the fixed scripts | 37916711364, 37917177366, 37918037282, 37919391328 |

These schools are synthetic and stay on staging. **Sekolah Demo PINTAR**, Dr Gladys's specimen, was not touched by any of these walks.

### 3.5 Final verification of the head 001a357 (batches A and B together), at the stop

| Check | Run / place | Result |
|---|---|---|
| CI | **37930520507** on 001a357 | **success, 18/18 jobs** (selftest contract, every red case, both migration paths, lint, typecheck, build) |
| Journeys | **37930524012** on 001a357 | **success**: job A (crawl, every role's screens) and job B (the journeys, BD11 in Chromium, Firefox and WebKit) both green. Job B fails on any FAIL step (S23q's failure made such runs `failure` before D-137), so success means no step failed. The exact PASS count was not read: the job log is not readable from this container; the run's «Journey B verdicts» summary has it |
| Local suite, fresh | database reset, build, full suite on 001a357 (12:38 UTC) | **658 passed, 0 failed**, 1 justified local skip; D140-STUDIO-01 and D140-SAJI-01 PASS |
| Local crawl, same build | 389 pages, 14 personas | 0 broken, 0 wider than 320 px, 0 over 3 s; one refusal (boot-siswa, RV-7). Studio home reads «Tidak ada yang menunggu tindakan Anda di Studio.»; the published package reads «Terbit · Paket ini sudah terbit. Guru dapat menyediakannya untuk kelas mereka.»; «siap diterbitkan» appears on no crawled page |
| Local journeys | — | **stopped by the coordinator at the end of the work window**, before a result (supplementary; CI's journeys above are the evidence) |
| Independent review | — | **not run on batches A and B.** The 8851988 review's findings were checked against the new screenshots by the coordinator only. A second-eye look at the staging screens is a READY condition (§8) |

**RV-10 status:** implemented, locally verified, **CI verified** (37930520507, 37930524012). Not staging verified. Not human accepted.
**Batch A status:** implemented, locally verified, CI verified (37927976617 on b117a72, and again within 001a357). Not staging verified.

## 4. Current environments (exact)

- **main:** 8851988. The landing rule is a procedure: `main` reports `protected: false` (file 05). Each push to main this period was approved by the owner for that push only (8851988: «Approved to fast-forward main to … 8851988»). There is no standing push rule.
- **Branch:** `claude/awesome-rubin-bqxp6p`, ahead of main by the commits in §2.3. Fast-forward possible.
- **Staging:** app 8851988, `dpl_35dkbHYVBk2iJ63tNGcPhF4i8SzF`; database 177 migrations; facts 37911713146 GREEN.
- **Production:** app 5b5b68d; its database is not read (owner permission needed); untouched.
- **Migrations:** none added this period after 8851988. Nothing is partly applied anywhere.
- **Deployments:** one staging deployment in this period, 8851988, after the owner's push approval. No production deployment.

## 5. The Daisy application pass (D-138): where it stands

| Step | State | Notes |
|---|---|---|
| 1 Tokens | **staging verified** (in 8851988) | the frozen certificate keeps its sizes |
| 2 Primitives | **staging verified** (in 8851988) | known limits in the pass log: TARGET-01 does not see inline or Tailwind heights outside the shared strings; FEEDBACK-01 renders on the server only |
| 3 Shells | **staging verified** (in 8851988); Daisy's navigation **order** and the **current-page mark** fixed in batch A (CI verified, not on staging) | OP-1 (no icon rail at 1024–1279 px) and OP-2 (no group labels) are recorded deviations; OP-9 (name and «Akun saya» in the menu under 1024 px) decided |
| 4a Learner | PARTIAL | Alert, result line, type ladder applied; composition not redrawn |
| 4b Mengajar | PARTIAL | Disclosure, pending dot, type ladder |
| 4c Pimpinan | PARTIAL | RV-9 open (repeated labels, «(0/5)» unexplained, touching cards) |
| 4d Konfigurasi | PARTIAL | batch A: primary and destructive buttons, template labels, 320 px fields and audit table. Open: RV-16 (ISO dates in text, native date inputs), RV-18, RV-24 |
| 4e Pendataan, Aktivasi | PARTIAL | RV-22 open (field widths, uppercase label) |
| 4f Studio | PARTIAL, the least migrated with Konfigurasi | batch A: tabs (RV-13). Batch B: the RV-10 contradictions. Open: RV-14, RV-21, RV-23 |
| 5 Copy | built; Terminology v1 applied in the copy table | OP-5 (strings held in migrations and seeds), OP-6, OP-7 open |

**Screens still awaiting design work:**
- the **report pages** Ringkasan Kelas and Ringkasan Sekolah: no app shell, no class, school or period named (RV-11);
- **«Laporkan masalah»** still has the old top header, not the shell (seen in the batch A crawl);
- Konfigurasi's long single page (index, sections; RV-24);
- Studio's package page (a long question list; RV-21 native markers);
- Aturan Asesmen (RV-14).

**Accessibility gaps known:**
- the file control's words are the browser's (RV-5);
- native date inputs (RV-16);
- native 13 px checkboxes in Aturan Asesmen (RV-14);
- the select chevron icon not drawn (step 2 limit);
- 44 px Radio and Checkbox rows not applied (step 2 limit);
- the tour's focus box and ring (RV-19).

The crawl checks width, breakage and time at 320 and 1280 px on every page. **No automated contrast or screen-reader audit ran in this period** beyond the token contrast test (UX1-S0-CONTRAST-01).

## 6. Findings: status of each, and what changed

The full RV table and the readiness classification are in the pass log (`docs/reports/PINTAR-4.0-APPLICATION-PASS-LOG.md`, «Independent review of the application on 8851988», «Fix batch A», «Walkthrough readiness classification»).

| Finding | At 8 Oct handoff | Now | Evidence class now |
|---|---|---|---|
| RV-1 page path on «Laporkan masalah» (BLOCKER) | did not exist (found 9 Oct) | fixed in 44cebee | CI verified (37927976617); locally seen; **not on staging** |
| RV-2 raw event code in the security record (BLOCKER) | — | fixed in 44cebee | CI verified; locally seen; not on staging |
| RV-3, RV-4, RV-6, RV-12, RV-13, RV-17 | — | fixed in 44cebee | CI verified; locally seen; not on staging |
| RV-5 file control | — | PARTIAL (styled; the words are the browser's) | CI verified; not on staging |
| **RV-10 Studio contradictions (walkthrough-BLOCKING)** | — | fixed in 001a357, guard red on the old pages | **CI verified** (37930520507, 37930524012); locally verified; **not on staging** |
| RV-7, RV-8, RV-9, RV-11, RV-14, RV-15, RV-16, RV-18 … RV-24 | — | **OPEN**, NON-BLOCKING for the walkthrough, each with its reason in the pass log | — |
| OP-1, OP-2 | — | OPEN (deviations) | |
| OP-3 / AP-1 wordmark | — | BLOCKED (font licence, CR-56) | |
| OP-4 / CR-41 transfers | — | PARTIAL (a cross-school directory is an authorization decision) | |
| OP-5, OP-6, OP-7 | — | OPEN; OP-6 and OP-7 kept for Dr Gladys's terminology decision | |
| OP-8 tour veil, OP-9 staff bar | — | DECIDED, recorded | staging verified (in 8851988) |
| AP-2 … AP-7 | — | fixed, each with a guard | staging verified (in 8851988) |
| **CR-52 / S23q** | «unresolved governed exception, FAILS in every run» (files 00 §5, 02, 04 §12, 06, 07 P1, 09) | **CLOSED by D-137** | see §7 |
| CR-92 | open (07) | fixed in 4693d4d (D-137) | CI verified (37876327609); staging verified (894ae01 and later) |
| L4 finding 6 (Peran & akses paging) | open (07) | fixed (D-137) | CI and staging verified |
| DG-11 (Jejak audit in words) | open | fixed in 8851988; the reviewer confirmed it | staging verified (by screenshots of identical code, and the S23j journey) |
| DG-28, DG-29 (Aturan Asesmen labels) | open | applied in step 4f | in 8851988; staging verified by the crawl of identical code only |
| DG-01 … DG-37 otherwise | as in 08 §… and `docs/reports/PINTAR-4.0-DG-19-37-INVESTIGATION-2026-10-07.md` | **not re-audited item by item in this period.** Only DG-11, DG-28, DG-29 (and CR-52, CR-92, L4-6 via D-137) changed | |
| CR-91 class-card trust boundary | HOLD | HOLD (unchanged) | |
| #150 backup/DR B3–B9 | NOT PASS | unchanged | |
| L4 answer-key incident (04 §11) | recorded | unchanged; the source workbooks and keys are still under `docs/onboarding/` | |

## 7. CR-52 / S23q: the contradiction, reconciled

- **What the 8 Oct handoff says** (00 §5 headline 1, 02 lines 42 and 70, 04 §12, 06 §3, 07 P1, 09): S23q is an unresolved governed exception that fails in every journey run (latest then: 37775382999 on dab5c12, 75 PASS, 1 FAIL).
- **What happened after it:** commit 4693d4d (Bank Soal filter, key and reasons for CAN_DRAFT holders), landed with 894ae01. Journeys **37876329363 on 894ae01: crawl GREEN, 76 PASS, 0 FAIL**. **D-137** records the exception closed. The application pass baseline (pass log, «Baseline») repeats it.
- **Since then, S23q has passed in every journey run read in this period:**
  - the local journeys on 42990bd;
  - the local journeys on 26a288b and 95b1209, which were 75 PASS with only BD11 BLOCKED locally.
- **The contradiction this evening:** at about 11:40 UTC the coordinator told the owner that S23q / CR-52 «also stays open». **That was wrong**: it repeated the 8 Oct handoff text without checking D-137. The owner then asked for the reconciliation, and the pass log carries the correction (61cdf61).
- **Resolution:** CR-52 / S23q is **CLOSED** (D-137). It is CI verified (37876327609 plus journeys 37876329363) and staging verified (894ae01 and every later staging commit, through the Golden School walks). It is **not human accepted**: Dr Gladys has not seen the bank.
- **Files 00, 02, 04, 06, 07 and 09 still carry the 8 Oct statement.** It is historically true of dab5c12 and **superseded** by this section; it was left as written.

## 8. Dr Gladys's second walkthrough: **NOT READY**

**Why:**
1. **RV-10**, classified walkthrough-blocking because it sits on her journey 4 («Lihat bab itu … bagaimana bab itu sampai ke murid»), is fixed only on the branch (001a357). Staging still shows «Siap · Paket ini siap diterbitkan» on a published chapter, and «Belum ada paket di sini.» above the listed packages.
2. **Batch A** (RV-1 and RV-2, the two review BLOCKERs, plus the others) is CI verified but **not on staging**.
3. **The owner's own condition:** «We will not invite Dr Gladys until the blocking defect is fixed and verified on staging.»

**The conditions for READY:**
1. CI and journeys green on the final head.
2. The owner's approval of one fast-forward push of main to that head, including the guide commit 0f55f1b or not, by the owner's word.
3. Staging deployed from it, with facts GREEN: app = that commit, 177 migrations.
4. A fresh four-step Golden School walk green on it.
5. An independent re-check of the RV-10 and batch A screens on staging. The container cannot reach staging, so that is a human look or a staging screenshot walk.
6. The re-pin of `docs/coordination/walkthrough-gladys/EVIDENCE.md` §1–2 to the new specimen, then the freeze (D-140(d)).

**Non-blocking items she will meet, known in advance and not to be treated as breaks:**
- RV-11: the report page names no class.
- RV-16: ISO dates in Konfigurasi.
- RV-5: the browser's file-control words.
- OP-5: pre-v1 wording held in the database.
- OP-6, OP-7: her terminology decisions.

## 9. CI budget (D-139)

- **Allowance:** 1,000 minutes from 2026-10-09T06:00:33Z. This is the coordinator's estimate method (`audit/ci/actions-spend.mjs`), not GitHub billing.
- **Used at 12:31 UTC:** **503** estimated (22 runs; 439 compute minutes). The largest items:
  - CI 37917925527: 128 (two attempts);
  - CI 37927976617: 73;
  - CI 37904669215: 72;
  - journeys 37905702260: 52;
  - cancelled journeys 37927979286: 40;
  - cancelled CI 37921432883: 36;
  - the Golden School walks: about 99 in all.
- **Final, read at the stop (about 13:05 UTC):** **616 used** (22 runs; 544 compute minutes), including CI 37930520507 (70) and journeys 37930524012 (44). **About 384 remain.**
- **Tomorrow's sequence** (§10) needs about 60–70: the main E1 check, facts, a four-step Golden School walk and a possible facts re-read. A further full CI and journeys cycle (about 125) would fit once more.

## 10. Next steps: the shortest safe sequence (not started tonight)

1. The verified head is **001a357** (CI 37930520507, journeys 37930524012, both green). The branch commits after it are documents only (`docs/handoff/**`, `docs/reports/**`). **Fast-forward main to 001a357 itself, not the branch tip:** `docs/handoff/**` is not on CI's skipped paths (00 §4), so a main push including this handoff would start a full CI run instead of E1's ALREADY PROVEN.
2. The owner decides on the guide commit 0f55f1b, which is on the path from main to the head. If it must not go, the code commits need a new main-bound line and a fresh CI.
3. The owner approves **one** fast-forward of main to the verified head. Verify the fast-forward from the actual main HEAD first.
4. Main's CI should cancel itself as ALREADY PROVEN (E1). Staging deploys from main.
5. Run environment facts: app = that commit, 177 migrations, GREEN.
6. Run a fresh four-step Golden School walk with a new slug: found the school (`found-school.yml`), then the four request files in order.
7. Run a staging look at the RV-10 and batch A screens (Studio home, a published package, «Laporkan masalah», Keamanan akun, the navigation at 320 and 1280 px). The container cannot reach staging.
8. Re-pin `docs/coordination/walkthrough-gladys/EVIDENCE.md` and `OBSERVER-SHEET.md` to the new commit and to Sekolah Demo PINTAR's state. Record the freeze.
9. Report READY to the owner. Dr Gladys is invited by the owner. From her sign-in: no code, copy, migration or deployment (D-140(d)).
10. After her walk: record, classify A–F, update this handoff, and STOP (D-140(e)–(g)).

## 11. Where things are, and what is not here

- **Pass log:** `docs/reports/PINTAR-4.0-APPLICATION-PASS-LOG.md`.
- **Decisions:** `docs/coordination/DECISIONS.md` D-137 … D-140.
- **Walkthrough instruments:**
  - `docs/onboarding/PINTAR-Panduan-Walkthrough-Sekolah-Demo.md`, her guide;
  - `docs/coordination/walkthrough-gladys/OBSERVER-SHEET.md`;
  - `docs/coordination/walkthrough-gladys/EVIDENCE.md`. Still pinned to the 6 Oct specimen 12b480b; POSTPONED; not yet re-pinned.
- **Design source:** `ux-1/daisy-experience`, `docs/coordination/ux/sistem-desain/project/` (c42fecb). Not on main.
- **Walk scripts:** `audit/staging/golden-school*.mjs`, triggered by `.github/staging-golden-school*-request.txt` (the last line is `slug: <slug>`) on a branch push; founding is `found-school.yml` (inputs `nama`, `slug`).
- **Coordinator-local evidence, not in the repository** (the container is ephemeral):
  - the crawl screenshots (`jobA-out/`, 389 pages at 1280 and 320 px);
  - the local journey output;
  - the spend ledger JSON.
  They can be regenerated from the commits with `audit/crawl.mjs` and `audit/journey.mjs`. GitHub run artefacts hold the CI equivalents.
- **Not readable from this container:**
  - the staging site itself (network policy);
  - GitHub job-log blobs through `gh` (read through the GitHub MCP tool or the check-run annotations instead).
- **Started and not finished:** none in code. The local journey replica on 001a357 was stopped before a result (§3.5). Nothing is partly applied on staging or production. The local `supabase/config.toml` is clean.
- **The handoff commit:** the commit that adds this line on `claude/awesome-rubin-bqxp6p` (see `git log -- docs/handoff/codex-2026-10-09/10-UPDATE-2026-10-09-EVENING.md`).

## 12. After the owner's approval (9 Oct, about 17:10–17:45 UTC): staging READY and FROZEN

This supersedes §1's «Dr Gladys: NOT READY» and §8. The earlier text stays as the state at the stop.

1. **Main fast-forwarded 8851988 → 001a357**, on the owner's approval for that one push, guide commit 0f55f1b included. It was checked as a clean fast-forward from the actual main HEAD first. The session's automatic permission check refused the push once and accepted it after an explicit approval sentence. **No standing push rule exists.**
2. **Main's CI 37964671673:** «ALREADY PROVEN by CI run 37930520507 on 001a357 … this run cancels itself and is not evidence» (E1). All 8 jobs show `cancelled`, because the proof job is cancelled with the run after printing its verdict.
3. **Environment facts 37964868797: GREEN.**
   - Staging: deployment `dpl_EcwRYkkSG1hGqGjocvmVC6cKAhEg` (READY), commit **001a357**, 177 migrations applied = 177 at the commit, email settings present.
   - Production: `dpl_3GshvyyNaC5bwZQ1M8vTFLHyEMLE`, **5b5b68d**, 111 at its commit, database not read; 669 code files differ from main (a release is a deliberate step, D-004).
   - No migration ran: none was added.
4. **Golden School walk on staging 001a357, school `sekolah-uji-daisy-001a`: all four green.** Runs: found 37965014304; first administrator 37965100845; admin setup and the chapter's publication 37965480454; students 37966534672; reports, certificate, recovery, shared computer and public check 37967468474.
5. **Sekolah Demo PINTAR, re-read on staging, read only** (Supabase connector, SELECT only, 17:20 UTC): unchanged from the 6 Oct baseline.
   - 6 active places; roles INSTITUTION_ADMIN, EDUCATOR, HEAD_OF_DEPARTMENT and DEAN, 1 each;
   - 10 official results; 3 ISSUED certificates;
   - 0 problem reports; 91 audit rows at the school.
   - The latest audit row on staging is 7690.
6. **The walkthrough instruments are re-pinned:** `docs/coordination/walkthrough-gladys/EVIDENCE.md` §0 (new specimen, baseline re-read, the non-blocking items she may meet). The OBSERVER-SHEET is unchanged; its «what the demo school held» still matches the re-read.
7. **RV-10 and batch A are now staging verified by deployment and walk:** staging runs the exact commit CI and the journeys proved. The RV-10 screens themselves were **not looked at on the live staging site by machine**, because this container cannot reach it. The local crawl of 001a357 shows them corrected. **The owner's own look at Studio on staging** (its home, and the published Bab page of Sekolah Demo PINTAR) before inviting her is the remaining human check.
8. **The verdict, given to the owner: GO for Dr Gladys's second walkthrough on staging 001a357**, subject to that look.
   - **Staging is FROZEN** (D-140(d)): no code, UI, copy, migration or deployment until she signs off.
   - The branch takes records only.
   - After her walk: classify the findings A–F, update this handoff, and STOP (D-140(e)–(g)).
9. **CI budget after this:** about 616 + 2 (main E1) + 1 (facts) + about 51 (the walk) ≈ **670 of 1,000**. This is an estimate, not re-read with the ledger after the walk.
