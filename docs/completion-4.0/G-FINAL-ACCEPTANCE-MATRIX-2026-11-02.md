# G · Final acceptance matrix: the criteria for «ready for Dr Gladys» (2 Nov 2026)

PINTAR 4.0 is ready for Dr Gladys's walkthrough only when **every** criterion below holds and the owner has approved Gate 6 (mandate §11–12).

**Coverage:** the 127 mandatory lines of the inventory (`B-FEATURE-COMPLETENESS-MATRIX`; J4.2, J4.9 and J5.9 are class C), every screen (63 routes) and every gate.

## 1. Per-line criteria (each of the 127 mandatory lines)

A line is **ACCEPTED** only when all ten hold. These are the mandate's §3 conditions, made checkable.

| # | Condition | Evidence that proves it |
|---|---|---|
| 1 | Full approved behaviour exists | Code reference; the line's requirement and the rulings cited in matrix B |
| 2 | UI complete on the approved design | The screen's J composition or 08 rows applied; the independent review compares it side by side with the design |
| 3 | Authorization, isolation and audit enforced | A database test red on a planted defect; an audit row asserted |
| 4 | Valid, invalid and failure paths correct | Tests and a browser step for each failure the line names |
| 5 | Integrated with dependents | The journey that crosses it (Level 2 journeys, Level 3 Golden School) |
| 6 | Automated verification passes | CI on the release candidate |
| 7 | Browser verification passes | Journeys (Chromium, Firefox, WebKit) and/or the Golden School on staging, on the candidate's code |
| 8 | A person completes the task unaided | An internal acceptance record (§3) |
| 9 | Accessibility and usability met | Clean axe; keyboard walk; NVDA/TalkBack on its key screens; 320 px and 200 % zoom |
| 10 | Evidence current, traceable, reproducible | Run ids on the candidate SHA (EVIDENCE-MODEL rule 3: nothing carries forward) |

**Today: 0 of 127 ACCEPTED.**
- 72 are functionally VERIFIED on 9 Oct evidence, but fail condition 2 (design) and condition 8 (human).
- The rest are open as listed in matrix B.

## 2. Per-screen design criteria (63 routes, design reconciliation §2)

| Surface | Routes | Required | Today |
|---|---|---|---|
| Learner | `/belajar/*` (12) | J4 composition; 08 rows; skip link and title | COMPONENTS ONLY |
| Mengajar | `/mengajar/*` (10) | J1 part two, J2, J3, J5; 08 rows | J2, J5 NOT APPLIED; others COMPONENTS ONLY |
| Pimpinan and reports | `/pimpinan/*`, `/dekan/ringkasan`, `/edukator/ringkasan`, `/pengembangan` | **Daisy's report design (F-12)**; 08 rows; empty state | Reports: NO APPROVED COMPOSITION; others COMPONENTS ONLY |
| Konfigurasi | `/konfigurasi`, `/keamanan`, `/email-uji` | **Daisy's split or index (F-12)**; Collection; date helper | COMPONENTS ONLY; Tailwind-composed |
| Pendataan, Aktivasi | 3 | 08 Form layout, FileField | COMPONENTS ONLY |
| Studio | `/studio/*` (10) | J1 part one; **Daisy's question review (F-12)**; 08 rows | Tailwind-composed; J1 not applied |
| Context and account | `/`, `/akun`, `/lapor`, `/lapor/saya` | **Daisy's chooser (F-12)**; J2 account menu | Chooser: NO APPROVED COMPOSITION |
| Auth and session | `/masuk*`, `/aktifkan`, `/perangkat`, `/terkunci` | Component specs; J7 | COMPONENTS ONLY; lock ≈ full |
| Public | `/verifikasi`, `/id`, `/pemeliharaan` | Frozen card and certificate (F-11) | COMPONENTS ONLY |
| Evaluation | `/evaluasi` and the band | J6 | NOT APPLIED |

**Every screen also needs:**
- a skip link and its own page title;
- no clipping at 320 px;
- clean axe;
- keyboard operation;
- final terminology, with no placeholder awaiting a word.

## 3. Internal human acceptance scenarios (Gate 6)

These are unscripted tasks, done by people who did not build PINTAR, observed and recorded per mandate §11 (goal, starting state, actions, outcome, confusion, evidence, verdict). **Together they cover every journey**, so every mandatory line is exercised by at least one scenario.

| Scenario | Who | Covers lines |
|---|---|---|
| S-1 Found a school and hand it over | Platform admin | J1.1–J1.4, J1.6, J1.9, J3.1, J3.2 |
| S-2 Set up the school: structure, staff, roles, pass mark, report template | School admin | J3.3–J3.9, J3.11, J2.2 |
| S-3 Enrol and activate staff and students; print class cards | School admin, staff, students | J2.1–J2.5, J2.8, J2.16, J2.19, J3.6, J3.7 |
| S-4 **Studio: a new chapter end to end.** Upload (with one error fixed) → review (one send-back) → approve → publish → teacher assigns → learner opens | Guru, head of department, school admin, learner | J4.1, J4.3–J4.8, J4.10, J4.12, J5.4 |
| S-5 PINTAR-standard content distributed and used | Platform admins (two), teacher, learner | J1.5, J4.11, J5.4 |
| S-6 Teach: prepare, Uji Cepat with score, read class and learner evidence, reassign reading | Teacher, head of department | J5.1–J5.8, J5.10–J5.14 |
| S-7 Learn: lesson, Pemetaan Awal, Uji Penguasaan, result, next step; interruption and reload | Learner | J6.1–J6.15 |
| S-8 Lead: read class and school reports; decision queue | Head of department, dean, school admin | J7.1–J7.5, J7.7–J7.9 |
| S-9 Integrity: refer, decide, the referrer sees the outcome; learner privacy kept | Head of department, dean | J7.6, J9.5 |
| S-10 Certificates: issue, print A4, scan QR, verify anonymously, revoke | Learner, school admin, anonymous | J8.1–J8.6, J8.8 |
| S-11 Recovery: forgotten password, PIN recovery, lost card, wrong email, wrong name, username | Staff, learner, school admin, platform admin | J2.9–J2.15, J2.17, J2.18, J2.20, J2.21, J2.4 |
| S-12 Sessions and devices: shared computer lock, sign out, Back after sign-out, «Keluar semua» | All | J2.9, J2.10, J2.20, X.2 |
| S-13 Move, transfer, roll over a year | School admins (two schools), platform admin | J3.4, J3.10, J3.12 |
| S-14 Educator as learner | Teacher, school admin | J9.1–J9.8 |
| S-15 Help: report a problem, follow it in «Laporan saya»; see an error page | Any | J10.1, J10.2 |
| S-16 Universal checks: by clicking only, 320 px, ID/EN, keyboard, screen reader | Observer with an accessibility user | X.1–X.12 |

Release lines R.1–R.8 are proven by Gates 4–5 (§4), not by scenarios.

## 4. Gate criteria (GO / NO-GO)

| Gate | GO only when | NO-GO when |
|---|---|---|
| **0 · Baseline verified** | These seven documents accepted by the owner; every approved requirement accounted for; one register; dependencies and contradictions disclosed | Any requirement unaccounted for, or a contradiction undisclosed |
| **1 · Functional completeness** | All 127 lines satisfy conditions 1, 3, 4, 5, 6, 7; no SQL-only operation (X.9, REL-02) | Any line IN PROGRESS, NOT STARTED or IMPLEMENTED — NOT VERIFIED; any operator step |
| **2 · Design completeness** | Every route meets §2; every J composition applied; the five new designs applied; terminology final; accessibility checks (axe, keyboard, NVDA, TalkBack, 200 %, contrast) pass | Any screen COMPONENTS ONLY; any word placeholder; any accessibility failure |
| **3 · End to end** | Every journey class in mandate §8 green on fresh data, success and failure paths, three engines; the Studio proof (W6.5); CR-59 rule-level tests; U-PERF re-measured; no release-blocking regression | Any red journey; any undocumented operator step |
| **4 · Operational readiness** | CR-91 enforced and the security suite green; answer keys out of the repository; **#150 PASS** (criteria confirmed, F-5); L1 PASS at the chosen tier and CAP-01 burst; legal gate closed in writing; second admins and custodians named and proven; break-glass rehearsed; support tiers named; mail capacity recorded | Any #150 B-item open; capacity unproven; legal open; a security hold |
| **5 · Production verified** | Rehearsed upgrade (F-18) green; production = the approved candidate (facts); Auth and mail verified by received headers; staff transition done; magic link retired; DNS live; watch on; critical journeys pass on production; **owner GO recorded** | Any mandatory production check failing; a migration without a tested recovery path |
| **6 · Final internal acceptance** | Scenarios S-1 … S-16 pass unaided; defects fixed and retested; matrix B 127/127 ACCEPTED; the evidence pack current; **explicit owner approval** | Any scenario failing; any known incompleteness |
| **→ Dr Gladys** | Gate 6 passed | Anything before it |

## 5. Where we are against it today

| Gate | Status |
|---|---|
| 0 | **Submitted for approval** (this package) |
| 1 | NO-GO: 22 IMPLEMENTED — NOT VERIFIED, 22 IN PROGRESS, 4 NOT STARTED, 10 BLOCKED |
| 2 | NO-GO: no screen has its full composition; no screen-reader or zoom pass done |
| 3 | NO-GO: no CI since the runner change; Studio proof not run; CR-59 not built |
| 4 | NO-GO: #150 NOT PASS; L1 FAIL on Micro; legal not started; CR-91 held; answer keys in the (public) repository |
| 5 | NO-GO: production `5b5b68d`, 669 code files behind |
| 6 | NO-GO: 0 scenarios run |
