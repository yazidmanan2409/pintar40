# Phase 1 status

**1 October 2026.** The Phase 0 and Phase 1 exit package for independent review (ChatGPT) and Yazid's acceptance.

- **PHASE 0: COMPLETE.**
- **PHASE 1: COMPLETE** (pending review).
- **Updated 1 Oct, after review.** The journey coverage cross-check (`PINTAR-4.0-JOURNEY-COVERAGE-CROSS-CHECK-2026-10-01.md`) and the owner rulings M1–M10 and T1–T4 (D-085) are applied; so are corrections K1–K4. §4.2 and §5–§6 reflect them.
- **READY FOR INDEPENDENT PHASE-EXIT REVIEW: YES.**
- Nothing in Phase 2 has started.

---

## 1. Phase 0: the preserved state, with evidence

Each item was already satisfied, so no change was made to meet it.

| Requirement | Evidence (read-only, 1 Oct) |
|---|---|
| `main` preserved | `origin/main` = `28d3015`, unchanged since the BOB-42 merge. Its tree equals the gated `f86ace7` outside `docs/coordination/` (git diff; D-034). |
| Held lane commits preserved | **Bob:** `claude/quirky-meitner-a04smj` at `3724f4d` (BOB-26 `cf7dd87`, BOB-50 `1246835`, BOB-51 `4f11303`). **Daisy:** `ux-1/daisy-experience` at `77d71ad` (DAISY-20 and DAISY-40 `59696ad`, DAISY-39 `957e314`). **Lana:** `claude/adoring-feynman-njmjll` at `f197e80`. All three sessions are idle; Bob and Daisy left resume notes in their lanes. |
| Staging preserved | 132 migrations applied. The version set's hash equals `main`'s 132 files (`34781793…`). The app's commit is **not machine-confirmed**: the last app-written audit rows came from build `daa5721` (30 Sep 00:51–00:59). Nothing was reset. |
| Production preserved | 111 migrations (= `5b5b68d`). 1 person, 1 auth user, 0 evaluation personas, 0 sessions, 0 certificates; last sign-in 30 Sep. Postgres 17.6.1.166. |
| Audit evidence preserved | The reports in `docs/reports/` (audit, independent review, response, convergence review) on the coordinator branch. Actions logs for CI #246 and audit #55 (runs 36708706264 and 36708709106). **RISK:** Actions logs expire under GitHub's retention, and the audit artifacts are kept for 14 days. |
| No feature work | The team has been paused since `f663c38`. The hourly coordinator routine is disabled. No lane was messaged in Phase 0 or Phase 1. |
| No new people on production | Production holds 1 person. Sign-up is disabled on both projects (GATE-0-FACTS; identity-facts run 36653019569), and only provisioning creates people. The rule needs no mechanism. |
| Containment | **None needed.** The two open identity holes (self-rename; a password change without the current password) can only be used by the one existing account, on itself. A certificate from an Uji Cepat needs a class, students and an assignment, and production has none. |

## 2. What changed in governance and process (Phase 1)

**Created** in `docs/recovery/`:
- `RECOVERY-CHARTER.md`;
- `PINTAR-4.0-SCOPE-INVENTORY.md`;
- `EVIDENCE-MODEL.md`;
- `JOURNEY-OWNERSHIP.md`;
- `RECOVERY-BOARD.md`;
- `GOLDEN-SCHOOL-CONTRACT.md`;
- this file.

**Recorded:** D-084 in `docs/coordination/DECISIONS.md` (Yazid's rulings of 1 Oct, and the decisions they amend).

**Retired:**
- `docs/coordination/BOARD.md` has a banner: it is the historical ticket record; `RECOVERY-BOARD.md` is the operational board.
- The release checklist has a banner: its rows are engineering detail, and "63/84 PASS" is no longer a readiness measure. The Markdown was re-rendered from its data file; the Word copy was not regenerated.

**Replaced:**

| Before | After |
|---|---|
| The 7-step gate (CI → diff read → audit → merge → board → fast-forward → staging) | Test Levels 1–3 and the independent reviewer (`EVIDENCE-MODEL.md`) |
| Lane completion | Journey ownership |
| Yazid as the relay | Direct cross-session messages, and the board in git |

## 3. What did NOT change in the product

- **No code, migration, test or workflow changed.**
- **No Supabase or Vercel setting was touched.**
- **Production and staging were not modified;** every database query was read-only.
- **No branch other than the coordinator's was written.** `main` was not fast-forwarded: it stays `28d3015` and pins the baseline.
- **No held work was landed.**
- **No lane was asked to resume.**
- **No ticket was created.**

## 4. The reclassified status (the honest baseline)

**Evidence on `main` `28d3015`:**
- CI #246 (run 36708706264, green): executable tests only.
- Audit #55 job B (run 36708709106): 31 PASS and 1 NOTE.
  - Its school is born by SQL (W0).
  - Several steps are direct requests (S3, S12).
  - S21 reaches the tests by typed URL and skips the lessons.

**Not counted:**
- staging runs on older commits;
- the job A crawl (it records pages but asserts nothing);
- code inspection;
- production reads (a different commit);
- source-text-only tests.

**No Level 3 run exists, and staging's app commit is not machine-confirmed.** So nothing is DEPLOYED, JOURNEY-PROVEN or HUMAN-ACCEPTED.

### 4.1 The headline: connected journeys

| Journey | BUILT | TESTED | DEPLOYED | JOURNEY-PROVEN | HUMAN-ACCEPTED | Current break (known; the first Golden School run will confirm it) |
|---|---|---|---|---|---|---|
| J1 Platform operation | part | part | unconfirmed | no run | — | A school is born by hand-typed SQL; the C1 path is not built |
| J2 Identity | part | part | unconfirmed | no run | — | Staff sign in only by magic link (Supabase's mailer: 2 per hour; reports "sent" when it did not send). Gate 3 is held; Gates 4–8 are not built |
| J3 School setup | part | part | unconfirmed | no run | — | No signposted way for a school admin to add a teacher (K1). No pass-mark setting, card re-issue, whole-class cards (M7) or class move (M9) |
| J4 Content | part | part | unconfirmed | no run | — | The head of department's review queue has never been walked; media playback is untested |
| J5 Teaching | part | part | unconfirmed | no run | — | Uji Cepat screens are not run on `main`; no Uji Cepat score; **a single Uji Cepat can certify (DEFECT)** |
| J6 Learning | part | part | unconfirmed | no run | — | Lessons are not run on `main`'s code; offline and reload have never been run in a browser |
| J7 Evidence | part | part | unconfirmed | no run | — | Figures have never appeared on a deployed environment |
| J8 Certificate | part | database only | unconfirmed | no run | — | No certificate has ever been issued outside tests; the rules are changing |
| J9 Educator as learner | no | no | — | — | — | Not built |
| J10 Help and support | part | part | unconfirmed | no run | — | «Laporkan masalah» is not built |

**The Golden School spine (GS-00 to GS-21) has no run yet (Phase 3).**

### 4.2 The P0 rows, walked back

| | Was (checklist v2.3) | Now |
|---|---|---|
| The 84 P0 rows | 63 PASS, 15 PARTIAL, 6 N-T | **TESTED 38 · BUILT 42 · DEPLOYED 0 · JOURNEY-PROVEN 0 · HUMAN-ACCEPTED 0** (after K2); capacity: 3 NOT RUN, 1 NOT MET |

**All 115 flow rows:** TESTED 38 · BUILT 66 · NOT BUILT 5 · UNVERIFIED 5 · NOT MET 1 (after K1 and K2).

**K3: the click evidence is thinner than these notes suggest.** No state changes, because executable tests that do not click still count for TESTED.
- **Typed URLs:** audit #55 reaches the teacher's, Studio and learner pages by typed URL (S13, S14, S17, S18, S21, S22). S19 reads the chapter link, then navigates to its address.
- **Direct requests:** intake and cards are RPCs or direct POSTs (S9, S10, S20).
- **Unasserted steps:** S5 asserts no landing (BOB06-R01 covers it); S23 asserts comprehension, not net gain.
- **Consequence:** Level 2 slices and the Golden School must reach every page by clicking (`EVIDENCE-MODEL.md` §3).

The detail follows. A row is TESTED only when its whole expected behaviour was run on `main`'s code; a row that was partly tested stays BUILT, with the tested part named.

#### Flow rows

| Row | Gate | Was | Now | Evidence or gap |
|---|---|---|---|---|
| STU-01 | P0 | PASS | **BUILT** | Partly tested: S1 (email link) and S11 (class card) pass. The wrong or expired link is only a NOTE (S1b), not asserted. |
| STU-02 | P0 | PASS | **TESTED** | S11 lands on /belajar. |
| STU-03 | P0 | PASS | **TESTED** | S11 greets by first name with an honest empty state; S19 offers the next step. |
| STU-04 | P0 | PASS | **BUILT** | Not run on main. Last walked on staging run 7 (older commit). |
| STU-05 | P0 | PASS | **BUILT** | Partly tested: S19 reaches the orientation. 'Looking is not committing' is not asserted on main. |
| STU-06 | P0 | PASS | **BUILT** | Partly tested: S21 presses Mulai. 'No session before the press' last shown on staging run 12 (older commit). |
| STU-07 | P0 | PARTIAL | **BUILT** | Partly tested: S21 counts the answers exactly. Changing an answer and reloading are not run. |
| STU-08 | P1 | N-T | **UNVERIFIED** | Not established that pause/resume exists. |
| STU-09 | P0 | N-T | **BUILT** | The outbox exists (database tests F09). Losing the network in a browser has never been run. |
| STU-10 | P0 | PASS | **TESTED** | S21: five pre-tests finalized at the planned scores (online path). |
| STU-11 | P0 | PARTIAL | **BUILT** | Lesson reading is not in audit #55 (S21 jumps by typed URL). Last read on staging runs 14-16 (older commits). Media playback never tested (D-050). |
| STU-12 | P1 | PARTIAL | **BUILT** | Known defect: the hint checker rejects ordinary hints (N5). |
| STU-13 | P0 | PASS | **BUILT** | Partly tested: the post-test exists and completes (S21). It was reached by typed URL, not by the link. |
| STU-14 | P0 | PASS | **TESTED** | S21: five post-tests completed at the planned scores. |
| STU-15 | P0 | PASS | **BUILT** | Partly tested: S21 checks 'Terjawab tepat N dari M'. Meaning, growth and 'no rank' are not asserted. |
| STU-16 | P1 | N-T | **UNVERIFIED** | Never run. |
| STU-17 | P1 | N-T | **BUILT** | Database tests only (F04). Never shown in a browser; no certificate has ever been issued outside tests. |
| STU-18 | P0 | PASS | **BUILT** | Not run on main. Last seen on staging run 12 (older commit). |
| STU-19 | P0 | PARTIAL | **BUILT** | Partly tested: the sign-out control (S11) and this-device-only (BOB05-R01). The shared-tablet walk has never been run. |
| STU-20 | P1 | PARTIAL | **BUILT** | The switch is present. English has never been walked. |
| EDU-01 | P0 | PASS | **TESTED** | S13 lands on /mengajar; BOB06-R01 covers every role's landing. |
| EDU-02 | P1 | PARTIAL | **BUILT** | Not walked with live work. |
| EDU-03 | P0 | PASS | **TESTED** | S13 states the school, class and year. |
| EDU-04 | P0 | PARTIAL | **BUILT** | Partly tested: the class shows (S13). Refusal of another class's address is not run on main. |
| EDU-05 | P0 | PASS | **TESTED** | S18 finds the published lesson on Siapkan. |
| EDU-06 | P0 | PASS | **TESTED** | S18 (WIB window); DAISY-14-TANGGAL-01 (executes batasHari). |
| EDU-07 | P1 | PARTIAL | **BUILT** | Partly tested: launch, finish and relaunch run in the database (BOB42-S01). The Atur → Tinjau → Tersedia screens are not run on main. |
| EDU-08 | P1 | PASS | **BUILT** | Not run on main. Last seen on staging run 15 (older commit). |
| EDU-09 | P0 | PARTIAL | **TESTED** | S22 shows the participation counts (5/5); integrity and Question Health access refused (database tests F06). |
| EDU-10 | P1 | FAIL | **NOT BUILT** | There is no Uji Cepat score screen (M12). |
| EDU-11 | P2 | N-T | **UNVERIFIED** | Never run. |
| EDU-12 | P0 | PASS | **TESTED** | S22: figures from official evidence equal the plan, on the audit stack (D-064). On staging the figures are always absent (synthetic school). |
| EDU-13 | P2 | N-T | **BUILT** | The page exists. Never tested. |
| EDU-14 | P0 | PASS | **TESTED** | S13 sign-out control; BOB05-R01 this-device-only. |
| HOD-01 | P0 | PASS | **TESTED** | S16 lands on /pimpinan. |
| HOD-02 | P0 | PARTIAL | **BUILT** | Partly tested: the Bagian is shown (S16). Refusal outside it is not run on main. |
| HOD-03 | P0 | N-T | **BUILT** | The review queue has never been walked. |
| HOD-04 | P0 | PARTIAL | **BUILT** | Partly tested: four-eyes holds (S17, with a school admin as reviewer; F02-T02). A head of department has never walked it. |
| HOD-05 | P0 | PASS | **TESTED** | S17: 'Kunci terbitan' is its own named step, done by the second person. |
| HOD-06 | P2 | BLOCKED | **BUILT** | Needs 30 answers per question; never exercised. |
| HOD-07 | P1 | N-T | **BUILT** | Database boundary tests only (F06). |
| HOD-08 | P1 | N-T | **BUILT** | Never walked by a head of department. |
| HOD-09 | P0 | PASS | **TESTED** | S23: Kelas 1A figures on /pimpinan. |
| HOD-10 | P0 | PASS | **BUILT** | The capability map denies publishing (read on the production database, 24 Sep). No test on main is named. |
| HOD-11 | P0 | PASS | **BUILT** | Keluar appears in S16's page text but is not asserted. |
| DEA-01 | P0 | PASS | **TESTED** | BOB06-R01 (running app): the dean lands on /pimpinan. |
| DEA-02 | P0 | N-T | **BUILT** | The page exists. Never tested. |
| DEA-03 | P0 | PASS | **TESTED** | DAISY-07-LAPORAN-02 (rendered over HTTP, seeded school). |
| DEA-04 | P2 | PARTIAL | **BUILT** | The queue is fed since BOB-39 (source test only). |
| DEA-05 | P2 | N-T | **UNVERIFIED** | Never run. |
| DEA-06 | P0 | PASS | **BUILT** | The capability map (production read, 24 Sep). No test on main is named. |
| DEA-07 | P0 | PASS | **BUILT** | Keluar is present. Never asserted for the dean. |
| ADM-01 | P0 | PASS | **TESTED** | S4 grants the role; S5 lands on /konfigurasi. |
| ADM-02 | P1 | N-I | **NOT BUILT** | There is no readiness list on the admin's home. |
| ADM-03 | P0 | PASS | **BUILT** | Partly tested: S7 builds Bagian, Tingkat and Kelas on the screen. 'Confirm before deactivating' is not run. |
| ADM-04 | P1 | PARTIAL | **BUILT** | The current year exists; there is no screen for years. |
| ADM-05 | P0 | PARTIAL | **BUILT** | Partly tested: the platform admin creates staff (S3, S12). A school admin has no signposted way to add a teacher; an unsignposted route exists and has never been walked (K1): a break in the chain. |
| ADM-06 | P1 | FAIL | **BUILT** | Corrected by K1. A school admin can give a staff role to a person recorded through a name-only intake row (BOB-21; F10-G03, a database test). Nothing signposts this, it has never been walked, and the refusal copy says only the platform admin can. The platform admin's grant was walked (S4, S12). |
| ADM-07 | P0 | PASS | **TESTED** | S8 (refusal with a reason), S9 (intake), S10 (card); F10-M01, F10-M02. |
| ADM-08 | P1 | N-I | **NOT BUILT** | There is no re-issue of a lost card or PIN, and no correction of a wrong email (M6). |
| ADM-09 | P0 | PASS | **TESTED** | S14, S15 and S15b; BOB02-X01 (executes the reader on two tools' files). |
| ADM-10 | P0 | PARTIAL | **BUILT** | Partly tested: media files upload (S14). Playback never tested (D-050). |
| ADM-11 | P0 | PASS | **TESTED** | S17: seven named steps. |
| ADM-12 | P0 | PASS | **TESTED** | S17 (refused until findings are reviewed, then published); S14 and S15b (school preselected, national library refused). |
| ADM-13 | P0 | PASS | **TESTED** | S18. |
| ADM-14 | P0 | PASS | **TESTED** | S15c and S18 (both tests open on assignment); F13 database tests. |
| ADM-15 | P0 | PASS | **BUILT** | Partly tested: pre-test → post-test → result (S21). Lessons are skipped and tests are reached by typed URL. Last read end to end on staging run 12 (older commit). |
| ADM-16 | P0 | PASS | **BUILT** | Corrected by K2. DAISY-07-LAPORAN-02 renders the reports over HTTP, but they print raw decimals and blank rows (cross-check W9), so "with correct figures" is not met. |
| ADM-17 | P2 | N-T | **BUILT** | Never tested. |
| ADM-18 | P1 | N-T | **BUILT** | The layout page exists. Revocation and the number-collision risk (N8) have never been tested. |
| ADM-19 | P2 | N-T | **BUILT** | Never tested. |
| ADM-20 | P0 | PASS | **BUILT** | Audit rows exist on staging and production. No test on main is named for this row. |
| ADM-21 | P2 | N-T | **UNVERIFIED** | Never run (needs two years). |
| ADM-22 | P0 | PASS | **BUILT** | Partly tested: Keluar asserted on Konfigurasi only (S2). |
| SYS-01 | P0 | PASS | **TESTED** | S1 lands on /konfigurasi. |
| SYS-02 | P1 | PARTIAL | **BUILT** | Health and environment are shown. Never tested. |
| SYS-03 | P2 | N-I | **NOT BUILT** | Today hand-typed SQL (W0). The ruled scripted operator path (C1) does not exist yet. |
| SYS-04 | P0 | PASS | **TESTED** | F01-T04 (INV-16 anti-escalation, audited) and F08-P07 (first administrator only), both database tests. |
| SYS-05 | P2 | PARTIAL | **BUILT** | The form exists. No canonical content exists. |
| SYS-06 | P1 | N-T | **BUILT** | Database tests only. |
| SYS-07 | P1 | PARTIAL | **BUILT** | The sections exist. Never tested. |
| SYS-08 | P1 | FAIL | **NOT MET** | One SYSTEM_ADMIN only (D-001). An operational act, not code. |
| SYS-09 | P0 | PASS | **TESTED** | S2: sign-out control on Konfigurasi. |
| PUB-01 | P0 | PASS | **TESTED** | F01-R08 (anonymous /masuk assets, running app). |
| PUB-02 | P0 | PASS | **TESTED** | P2: sign-up refused, 422 signup_disabled (local stack). Production is read separately (REL-07). |
| PUB-03 | P1 | PASS | **BUILT** | Database tests only (F04). No valid certificate page has ever been opened; none has ever been issued. |
| PUB-04 | P0 | PASS | **TESTED** | P1 (API 404 and page); F01-R07. |
| PUB-05 | P1 | PASS | **BUILT** | Database tests only. The page is never run. |
| PUB-06 | P0 | PASS | **BUILT** | Partly tested: the not-found answer is minimal (P1). The valid-token surface is never run. |
| PUB-07 | P0 | PASS | **TESTED** | P3: PINTAR's own localized page. |
| X-01 | P0 | PASS | **BUILT** | Partly tested: S3-S12 pass, but the school is born by SQL (W0) and staff roles are given by the platform admin, not the school admin. |
| X-02 | P0 | PASS | **TESTED** | S14 and S15c. |
| X-03 | P0 | PASS | **TESTED** | S17. |
| X-04 | P0 | PASS | **TESTED** | S17. |
| X-05 | P0 | PARTIAL | **BUILT** | Partly tested: the eligible learner sees it (S18, S19). The ineligible case is not run. |
| X-06 | P0 | PASS | **TESTED** | S19 orientation; S21 start, answers and finish. |
| X-07 | P0 | PARTIAL | **BUILT** | Lesson reading is not run on main (see STU-11). |
| X-08 | P0 | PASS | **TESTED** | S21. |
| X-09 | P0 | PARTIAL | **BUILT** | Partly tested: the result (S21). The certificate state has never been walked. |
| X-10 | P0 | PASS | **TESTED** | S22 (official evidence, audit stack). |
| X-11 | P1 | N-T | **BUILT** | Never walked. |
| X-12 | P0 | PASS | **TESTED** | DAISY-07-LAPORAN-02; S23. |
| X-13 | P0 | PARTIAL | **BUILT** | Partly tested: device-only sign-out (BOB05-R01). The next-person walk has never been run. |
| U-NAV | P0 | PASS | **BUILT** | Partly tested: some screens are reached by clicking (S2, S19). The audit itself still uses typed URLs (S21). |
| U-AUTH | P0 | PASS | **TESTED** | F01-R01 (running app refuses unauthenticated access); F01-T02 to T04 (tenant isolation, database). |
| U-TRUTH | P0 | PASS | **BUILT** | Partly tested: upload (S14) and publish (S17). A universal claim cannot be proven by examples. |
| U-LOC | P0 | PASS | **BUILT** | Partly tested: BOB07-R01 (running app) and P3. BOB07-K01 reads source only. |
| U-EMPTY | P1 | PARTIAL | **BUILT** | Never tested as a rule. |
| U-DEVICE | P0 | PARTIAL | **BUILT** | Partly tested: card idle and device-only sign-out (BOB05-R01). 320 px only on older commits, for a few screens. |
| U-CONTEXT | P0 | PASS | **BUILT** | Partly tested: S13 and S14 show the context. |
| U-AUDIT | P0 | PASS | **BUILT** | Audit rows exist. No test on main is named. |
| U-PRIV | P0 | PASS | **BUILT** | Partly tested: DAISY-10-SAPA-02 (running app); P1. |
| U-RECOVER | P1 | FAIL | **NOT BUILT** | No self-service recovery: Gates 4-5 not started; card re-issue missing (ADM-08). |
| U-ERR | P0 | PASS | **BUILT** | Partly tested: P3 (localized not-found). The error-page reference is only checked in source. |
| U-PERF | P0 | PASS | **BUILT** | Last measured on staging on older commits (28-30 Sep). Never measured on main's code. |

#### Capacity rows

| Row | Gate | Was | Now | Evidence or gap |
|---|---|---|---|---|
| CAP-01 | P0 | N-T | **NOT RUN** | Card sign-in wave. Never run. |
| CAP-02 | P0 | N-T | **NOT RUN** | L1 assessment. Never run. |
| CAP-03 | — | N-T | **NOT RUN** | L2. Never run. |
| CAP-04 | — | N-T | **NOT RUN** | L3. Never run. |
| CAP-05 | — | N-T | **NOT RUN** | L4. Never run. |
| CAP-06 | — | N-T | **NOT RUN** | L5. Never run. |
| CAP-07 | P0 | N-T | **NOT RUN** | Spike recovery. Never run. |
| CAP-08 | P0 | PARTIAL | **NOT MET** | The staging project exists, but its compute tier is not matched to production. |
| CAP-09 | P1 | N-T | **NOT RUN** | Never measured. |
| CAP-10 | — | N-I | **NOT BUILT** | Lists do not page (M14). |

#### Release conditions (evaluated at Phase 8, against a release candidate)

| Row | Gate | Was | Now | Evidence or gap |
|---|---|---|---|---|
| REL-01 | P0 | PASS | **MET for main's code** | CI #246 on f86ace7 (D-034). No release candidate exists. |
| REL-02 | P0 | FAIL | **NOT MET** | Superseded as a measure by the Phase 8 conditions (D-084). |
| REL-03 | P0 | PASS | **NOT MET for main** | Production holds 111 migrations; the repository 132; staging 132 (identical set, hash checked). |
| REL-04 | P0 | PASS | **Production 5b5b68d only** | Read on 23-24 Sep. Never run for main. |
| REL-05 | P0 | PASS | **Production 5b5b68d only** | Deploy 013. |
| REL-06 | P0 | PASS | **Production 5b5b68d only** | Run 35935767367. |
| REL-07 | P0 | PASS | **MET on both projects** | Read 30 Sep (identity-facts run 36653019569). |
| REL-08 | P0 | N-I | **NOT MET** | PINTAR's email path has sent nothing on staging (email_send_log empty). |
| REL-09 | P0 | NOT VERIFIED | **NOT MET** | No verified offline copies of the production keys. |
| REL-10 | P0 | PASS | **Production 5b5b68d only** | Rollback c358f58. |
| REL-11 | P0 | PASS | **MET** | Production holds 1 person, 1 account and 3 institutions; no personas (read 1 Oct). |
| REL-13 | — | N-I | **NOT BUILT** | 'Laporkan masalah' (BOB-15, DAISY-12) does not exist. |
| REL-12 | — | N/A | **N/A** | After go-live. |

### 4.3 Gate and ticket verdicts, walked back

| Verdict | Now |
|---|---|
| Identity Gate 0 (rulings, facts) | Done (C-09); not code |
| Gate 1 (BOB-12, card route) | BUILT, TESTED (BOB12 and F15 tests). Staging acceptance never done (the forwarding key was never added) |
| Gate 2 (BOB-24, identity foundation) | BUILT, TESTED (F16 database tests) |
| Gate 2E (BOB-25, email) | BUILT, TESTED (F17, BOB25 tests). **PINTAR's own path has never sent an email on staging** (`email_send_log` empty) |
| Gate 3 (BOB-26 with DAISY-20) | **NOT BUILT** (held on lanes; their GATE PASS stays a lane-level record) |
| Gates 4–8 | NOT BUILT |
| Every "MERGED" or "GATE PASS" ticket on `main` | BUILT; TESTED as far as its own executable tests go (all green in CI #246). None is DEPLOYED-confirmed or JOURNEY-PROVEN |
| "Accepted on staging" (BOB-22, BOB-23; runs 12–16) | Evidence from older commits, with service-key staff sessions in a synthetic school. **It does not carry forward** |
| Certificate design "closed pending the physical proof" (D-080) | A design approval, not product evidence |
| CONTENT PASS (Lana) | A content review verdict. It stands as content, not as a product state |

## 5. Conflicts with existing canonical decisions

| # | Conflict | Resolution |
|---|---|---|
| CF1 | D-005(1) and REL-02 require "no operator steps", but C1 makes school birth an operator path | D-084: C1's scripted, audited school birth is the **one** permitted operator action. Hand SQL stays forbidden |
| CF2 | D-012 (the gate) and D-028 (the checklist's PASS as the go-live gate) | Amended by D-084 for the recovery: Levels 1–3 plus the reviewer; go-live = Phase 8; the checklist rows are detail |
| CF3 | D-064: "staging remains synthetic", but the Golden School needs official evidence on staging | Amended by D-084 for the Golden School only (fabricated identities, production posture) |
| CF4 | The convergence review's Phase 7 cited D-031's L1 (one school of 400). D-035 had superseded the sizes (L1 = the first cohort, about 1,000), and D-083 left that cohort open | The charter is corrected (L1 = the first real deployment's size); owner ruling O3 |
| CF5 | STU-01 lets students sign in by email link; C14 removes the everyday magic link; activation is staff-only (C17) | Resolved by D-085 (M2); see CF10 |
| CF6 | D-013 has the coordinator write through the database where no screen exists | Unchanged, except school birth, which uses C1 (D-084) |
| CF7 | Owner technical tasks given earlier (the staging email test's browser-console send; configuration screenshots) break the new hard rule | **Withdrawn.** Email-path proof becomes Phase 2 machine verification |
| CF8 | D-052(b) (a pilot of 20–30) and D-058(b) (3–5 educators) read as rivals | Not a conflict: the charter sequences them (3–5 walk → pilot → wider) |
| CF9 | D-043 (Actions minutes are finite) against Level 3 running on merges and nightly | Not a conflict; Phase 2 must design within D-043 and the budget alert |
| CF10 | **M2 against STU-01.** STU-01 ("Sign in by email link or class card") lets students use an email link | M2 supersedes STU-01's email-link half. The class card and PIN is the one student model. STU-01's text should be amended when the checklist is next rendered |
| CF11 | **M6 against D-029.** D-029 refuses every import into the national library, for every role, the platform admin included. M6 requires standard content prepared and governed centrally | M6, the later ruling, amends D-029: standard content enters the library through a governed central path. D-029's protection against school imports into the library can stay. **Not stated by any ruling:** which PINTAR role prepares and approves standard content (G2) |
| CF12 | **M6 against the checklist's gate for SYS-05** (P2, after go-live) | M6 brings central distribution into normal 4.0 operation; the inventory sets J1.5 to EC. Approving O1 confirms this |
| CF13 | **M3's "mastery target".** D-078 (as amended) and D-081 define one passing rule: mastery ≥ the sealed school mark, plus the safety gate. They forbid a second definition | **Reading:** M3's target is that sealed school mark. The readiness tiers (fixed 0.60 and 0.80 bands, J7.7) are not the target. **Confirm with O1** |
| CF14 | **T1 against D-009, D-055(e) and C4.** All three say class-card sessions are "unchanged" (60 minutes idle, no lock). C11 never asks class-card users the device question | T1 revises D-009, D-055(e) and C4 for students. **Reading:** because class-card users are never asked (C11), the lock applies to every class-card session. **Confirm with O1.** Lock and expiry values, and wrong-PIN handling on resume, are set in implementation (T1) |
| CF15 | **M4 and M5 against D-069(b).** M4/M5 let a teacher see a learner's evidence and submitted answers within their teaching scope. D-069(b) gives a professional-learning facilitator no individual answers, and the head of department and dean no answers | **Reading:** D-069(b), the specific rule, keeps governing professional-learning Kelas; M4 and M5 govern academic classes. **Confirm with O1** |
| CF16 | **M8 against D2 (the 18 Sep sign-in ruling) and C3.** D2 and C3 require identity-neutral answers and folded a throttle into "sent" (`masuk/actions.ts:73`) | M8 forbids claiming "sent" against PINTAR's own evidence. Neutral copy that claims no send satisfies both; the fold into "sent" is superseded (cross-check W6 stays a defect) |
| CF17 | **M1 against Golden School C1's "nothing else".** C1 said the script creates the school and nothing else | M1 governs: the process establishes the minimum institutional foundation for handover. The Golden School contract is updated; exactly what the foundation holds is specified in Phase 2, with nothing that normal school operation does |

**Interactions to respect (not contradictions):**
- **The class-card PIN.** The sign-in screen tells students to enter "the PIN shown on the card" (`hle.ts:1901`), so holding the card is enough to sign in. T1's PIN resume and M7's "credential security" work within that design. W17 (no revoke or re-issue) stays a defect.
- **M3 reassignment.** A reassignment creates its own pre-test and post-test (D-008), which may share no item with each other (D-040). Item supply is a Phase 4 design question, not new scope.
- **T4's profile photo.** Where a photo is shown must respect D-020's shared-screen privacy.
- **M9 and W7.** Today a student who leaves a class loses access to their own certificate (W7). M9 makes that defect matter more.

## 6. For Yazid: remaining rulings

**Resolved by D-085 (1 Oct):**
- M1 and M2 (Phase 1);
- M3–M10 (the cross-check);
- T1–T4.

**Needed to close Phase 1:**
- **O1. Approve the scope inventory** (`PINTAR-4.0-SCOPE-INVENTORY.md`, now with D-085). Approving it also confirms three readings, unless Yazid says otherwise:
  - **CF13:** the mastery target is the sealed school mark;
  - **CF14:** the student lock applies to every class-card session;
  - **CF15:** D-069(b) still governs professional-learning Kelas.

**Not needed before Phase 2** (each says when it is needed):
- **G1. The student profile photo.** T4 permits a profile photo. Is a student profile photo something 4.0 must build, or only permitted if a profile exists? The inventory records it as permitted (J8.8). Needed before Phase 5.
- **G2. Who prepares and approves PINTAR standard content centrally** (M6; CF11). Needed before the M6 work in Phase 4.
- **B1 and B2. Built with no scope source** (inventory §11): class feedback rounds, and the evaluation hub and personas. Count in 4.0 or not; needed before Phase 5.
- **O3. The size of the first real deployment,** which sets L1 (the open item of D-083). Needed before Phase 7.
- **Already open:** the readiness-tier words (D-082(e)), needed before UI/UX POLISHED.

## 7. One-time owner actions before Phase 2 (the complete list)

1. **Create the staging test mailbox** on PINTAR's mail domain, able to receive at a fresh address each run (plus-addressing or a catch-all), and **enter its credentials as GitHub secrets.**
   - The coordinator gives the secret names when Phase 2 is authorised.
   - Never paste credentials into chat.
2. **Set a GitHub Actions spending alert** in GitHub's billing settings.

**Only if Phase 2's first read-only check shows they are needed:**
- a Vercel token that can read deployments, environment metadata and logs (if the existing `VERCEL_TOKEN` cannot);
- the production SMTP password (if the email-path check finds it stale).

**Everything else Phase 2 needs is already held by GitHub:**
- `VERCEL_TOKEN`;
- both Supabase access tokens;
- the production database password and the staging database URL;
- `PINTAR_SMTP_PASSWORD`.

## 8. Read-only checks made for Phase 0 and Phase 1

- Git refs and trees.
- Staging and production: migration counts and the staging version-set hash.
- Staging `audit_log.build_sha`.
- Production: people, personas and auth users.
- GitHub Actions run lists and the logs of CI #246 and audit #55.
- The session list (lane reachability).

No write was made anywhere except the coordinator branch.
