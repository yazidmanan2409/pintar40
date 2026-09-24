# PINTAR 4.0 — End-to-End User Flow & Release Checklist

**v2 — 24 September 2026 (improves the 24 Sep draft).** Rendered from `docs/coordination/checklist/checklist_data.py`; edit there and re-render. The Word copy for Yazid comes from the same data.

| | |
|---|---|
| **Baseline** | PINTAR 4.0 as built. Canonical decisions D-001…D-030 (docs/coordination/DECISIONS.md); board BOB-/DAISY- tickets (BOARD.md). |
| **Purpose** | Prove that every intended flow exists, can be reached, holds together end to end, and respects the role boundary — and decide whether a release may go live. |
| **Method** | Inspect the release candidate as a user: automated browser journeys on a production-like copy, walkthroughs by hand, then read-only production checks after deploy. A route, function or component existing is not a PASS. |
| **Gate rule** | No push to live unless every P0 check is PASS on the release candidate, and every P1 check is PASS or accepted in writing by Yazid (DECISIONS.md). |
| **Owner** | Coordinator (Claude) runs and records it; Bob and Daisy fix; Yazid accepts P1 exceptions; Gladys does the final acceptance walkthrough. |

> Calm on the surface. Rigorous underneath. One meaningful next action is obvious, while authorization, evidence and state transitions stay correct.

## Baseline at a glance (main `78b0f55`, 24 Sep 2026)

P0 checks only; each must be PASS on the release candidate before any push to live.

**Evidence:** Audit journeys run 35952344955 (harness 39ad60e, app main 78b0f55): Gladys's path from an empty production-like database, 15 PASS · 5 FAIL · 1 BLOCKED · 1 note, with one operator (SQL) step (W1); the seeded-world crawl of 14 personas; the public probes P1–P3. Plus CI, selftests and read-only production checks, as cited per row.

| Section | P0 checks | PASS | PARTIAL | FAIL | BLOCKED | N-I | N-T |
|---|---:|---:|---:|---:|---:|---:|---:|
| Student / Murid | 15 | 1 | 1 | 3 | 10 | 0 | 0 |
| Educator / Guru | 8 | 1 | 2 | 3 | 2 | 0 | 0 |
| Head of department / Kepala departemen | 8 | 1 | 1 | 4 | 2 | 0 | 0 |
| Dean / Dekan | 5 | 1 | 0 | 3 | 1 | 0 | 0 |
| School admin / Admin sekolah | 14 | 1 | 4 | 7 | 2 | 0 | 0 |
| System admin / Admin platform | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
| Anonymous visitor and certificate verifier | 5 | 4 | 0 | 1 | 0 | 0 | 0 |
| The cross-role scenario | 12 | 0 | 0 | 7 | 5 | 0 | 0 |
| Universal checks | 9 | 2 | 2 | 5 | 0 | 0 | 0 |
| **Total** | **79** | **13** | **11** | **33** | **22** | **0** | **0** |

**Verdict on this baseline:** 13 of 79 P0 checks pass. NO-GO for any new release until the sprint 1 tickets land and the full run is repeated on the release candidate. The live release (5b5b68d) stays as it is.

## 1. How to use this checklist

1. Run each role as a real journey, from sign-in to its natural end state, and sign out. Never inspect only isolated screens.
2. Mark each check PASS, FAIL, PARTIAL, BLOCKED, N-I (not implemented), N-T (not tested) or N/A, and record the evidence: harness step, screenshot, test id or query.
3. A route that exists is not a PASS. The person must reach it through the intended navigation, without typing an address.
4. A backend function that exists is not a PASS. The screen must call it and report the true outcome.
5. A screen that shows success after a zero-row or no-op change is a FAIL.
6. A refusal or empty state passes only when it is honest, understandable in the reader's language, and leaks nothing protected.
7. Test Bahasa Indonesia and English. Educational content is never auto-translated.
8. For a person with more than one role, check how they choose where to go, and that changing context never widens authority.
9. For assessments: looking, rendering, prefetching or translating an orientation page never consumes an attempt. Commitment is an explicit press.
10. Record defects against the flow ID. The coordinator turns each into a BOB- or DAISY- ticket.
11. Never create test people, classes or content in production (D-013, D-017). Pre-release runs use the production-like copy; production checks are read-only.

**Gate:** P0 blocks go-live · P1 is fixed before go-live or accepted in writing by Yazid · P2 is tracked after go-live.  
**How:** AUTO automated test or harness step · RUN walked by hand with screenshots · PROD read-only check on production · CODE code or database inspection.  
**Status:** PASS · FAIL · PARTIAL · BLOCKED (by another failing check) · N-I not implemented · N-T not yet tested · N/A.

## 2. Roles and where they land

| Role | Lands on (D-010) | Purpose | Authority boundary |
|---|---|---|---|
| Student / Murid | /belajar | Know what to do next; learn; be assessed; understand the result; completion and certificate | Own data and sessions only; never compared with other learners; no staff capability |
| Educator / Guru | /mengajar | Prepare and assign learning; run Uji Cepat; see class evidence without PINTAR making the judgment | Draft, assign, Uji Cepat within own classes; no Question Health or integrity review |
| Head of department / Kepala departemen | /pimpinan (review in /studio/tinjau) | Review and freeze sound work; read department evidence; Question Health and integrity review | Review, freeze, assign, Uji Cepat within own Bagian; cannot publish |
| Dean / Dekan | /pimpinan | Read school evidence and reports; make human decisions | Read only; no Studio or write capability because of seniority |
| School admin / Admin sekolah | /konfigurasi (+ /pendataan, /aktivasi, /studio) | Get the school running: structure, people, roles, content, publishing, reports | Own school only; publishes; cannot change what a metric means |
| System admin / Admin platform | /konfigurasi | Operate the platform: schools, distribution, flags, audit, system admins | Platform-wide; SYSTEM_ADMIN is granted only by a SYSTEM_ADMIN |
| Anonymous / verifier | /masuk, /verifikasi/[token] | Sign in; verify a certificate without an account | Only the bounded public facts; no existence oracle |

Landings follow D-010 as built. The older specification's three-door routes (/kelas, /kelas/tinjauan, /sekolah, /sekolah/platform) do not exist in the product and are not used here.

## 3. Student / Murid — the learning journey

From sign-in to result and certificate state, on a shared tablet.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) |
|---|---|---|---|---|---|
| STU-01 | Sign in by email link or class card. | The intended account gets in. A wrong or expired link gives a clear, localized way back, which names the same-device rule. | AUTO · RUN | P0 | **PASS**: email link and class card both sign in (journey S1, S11); the expired-link screen names the same-device rule (DAISY-01). Cross-device links fail by design (M1, P1). |
| STU-02 | Arrive after sign-in. | Lands on /belajar (D-010), not a generic page. | AUTO | P0 | **FAIL**: lands on / (journey S11). BOB-06, DAISY-03. |
| STU-03 | Read the /belajar home. | One obvious next action; a clear 'nothing assigned yet'; greeted by first name only (D-020). | AUTO · RUN | P0 | **PARTIAL**: the empty state is clear (S11); the greeting uses the full name. DAISY-10. |
| STU-04 | Open an assigned lesson. | Shows the trail and context without starting any assessment. | RUN | P0 | **BLOCKED**: nothing can be assigned (B3, B4). |
| STU-05 | Open the pre-test orientation. | Explains what is about to happen, truthfully; looking is not committing. | RUN · AUTO | P0 | **BLOCKED** by B4. The orientation renders in the seeded world. |
| STU-06 | Explicitly start the pre-test. | Only the explicit press creates the session, exactly once; refusals are understandable. | AUTO · RUN | P0 | **BLOCKED** by B4. The engine is covered by the release's selftests. |
| STU-07 | Answer items; change answers; reload. | One player; no keys before review; answers sync correctly. | AUTO · RUN | P0 | **BLOCKED** by B4. The engine is covered by selftests (the R1 outbox family). |
| STU-08 | Pause and resume where allowed. | Only where the assessment rules permit. | RUN | P1 | **N-T** |
| STU-09 | Lose and regain the network. | Answers are kept; offline is shown apart from refused. | AUTO · RUN | P0 | **BLOCKED** by B4. The outbox is covered by selftests. |
| STU-10 | Finish the pre-test. | Finalizes only when every answer has synced; nothing is silently lost. | AUTO | P0 | **BLOCKED** by B4. Covered by selftests (R1). |
| STU-11 | Read the lesson. | Text, and media where present, load; the place is kept. | RUN | P0 | **BLOCKED** by B2/B3. Media playback FAILs in the seeded world: /api/assets/read-url answers 404 for the lesson audio and video (crawl; M9, P1). |
| STU-12 | Use hints. | Help without revealing the answer; valid hints are not rejected. | CODE · RUN | P1 | **PARTIAL**: the hint checker rejects ordinary hints (N5). |
| STU-13 | Reach the post-test. | It exists for the assigned lesson and never ends in a 404. | AUTO · RUN | P0 | **FAIL**: the pre-test link ends in a 404 (seeded official school, crawl). BOB-04. |
| STU-14 | Complete the post-test. | The same resilient engine as the pre-test. | AUTO · RUN | P0 | **BLOCKED** by B4. |
| STU-15 | Read the result. | Mastery with its meaning, own growth; no rank, class average or other learner. | RUN | P0 | **BLOCKED** by B4. |
| STU-16 | Review feedback. | Permitted review only; no internals. | RUN | P1 | **BLOCKED** by B4. |
| STU-17 | Certificate state. | Not eligible → no certificate; eligible → 'being prepared'; issued → actions. Rendering never issues one. | AUTO · RUN | P1 | **BLOCKED** by B4. The lifecycle is covered by selftests (F04). Real certificates now, since the schools are real (D-003). |
| STU-18 | Finish all work. | An honest 'nothing more to do', or the next expectation. | RUN | P0 | **BLOCKED** |
| STU-19 | Sign out on a shared tablet. | Keluar on every screen; ends this device's session only; Back and refresh do not resume. Class-card sessions end after 60 minutes idle (D-009). | AUTO · RUN | P0 | **FAIL**: no Keluar on /belajar (S11). DAISY-02, BOB-05. |
| STU-20 | Switch language. | Every learner screen switches ID ↔ EN; content is not translated. | AUTO | P1 | **PARTIAL**: the ID/EN switch is on every learner screen (crawl); the English rendering has not been walked. |

## 4. Educator / Guru — the teaching journey

Prepare, assign, run Uji Cepat and read class evidence.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) |
|---|---|---|---|---|---|
| EDU-01 | Sign in. | Lands on /mengajar (D-010), with no management or admin leakage. | AUTO | P0 | **FAIL**: lands on / (S13). BOB-06, DAISY-03. |
| EDU-02 | Educator home. | One meaningful next action; honest empty states. | RUN | P1 | **PARTIAL**: the empty state is clear; not walked with live work. |
| EDU-03 | Choose the teaching context. | The class, school and year are stated plainly. | AUTO | P0 | **PASS**: 'SD Zayd Pintar Selalu / Kelas 1A / 2026/2027' (S13). |
| EDU-04 | Read the roster. | Only permitted classes; another class's address is refused. | AUTO · RUN | P0 | **PARTIAL**: the class shows (S13); the cross-class address is not re-walked. Scope is enforced server-side (selftests). |
| EDU-05 | Prepare learning. | Find a published lesson and prepare the assignment. | RUN | P0 | **FAIL**: 'Belum ada materi' (S13). BOB-02, BOB-03. |
| EDU-06 | Assign learning. | Bound to class, release and dates; the dates are enforced, in WIB. | RUN · CODE | P0 (dates P1) | **BLOCKED** by B3; the dates are not enforced (M10, P1). |
| EDU-07 | Launch Uji Cepat. | Atur → Tinjau → Tersedia with an explicit commit. | RUN | P1 | **BLOCKED**: no chapters or items exist (B2). |
| EDU-08 | A learner finds the Uji Cepat. | An eligible learner can start it; non-response stays neutral. | RUN | P1 | **BLOCKED** |
| EDU-09 | Monitor progress. | Participation and evidence, without judgment; no integrity or Question Health access. | RUN · CODE | P0 | **PARTIAL**: counts exist (code); not walked with live work. |
| EDU-10 | See the Uji Cepat result. | The score is visible where designed. | RUN | P1 | **FAIL**: no score screen for anyone (M12). |
| EDU-11 | Extend a deadline. | It works with a reason and an audit trail, within scope. | RUN | P2 | **N-T** |
| EDU-12 | Read class evidence. | Evidence sufficiency is explicit; no fabricated zeros. | RUN | P0 | **BLOCKED**: no evidence yet (B3, B4). |
| EDU-13 | What next. | Assistive, not authoritative. | RUN | P2 | **N-T** |
| EDU-14 | Sign out. | Keluar present; this device only. | AUTO | P0 | **FAIL**: no Keluar on /mengajar (S13). DAISY-02. |

## 5. Head of department / Kepala departemen — review and oversight

Review and freeze sound work; read department evidence.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) |
|---|---|---|---|---|---|
| HOD-01 | Sign in and land. | Lands on /pimpinan; /studio/tinjau is one click away. | AUTO | P0 | **FAIL**: lands on /; /pimpinan is not linked (M15). DAISY-03, BOB-06. |
| HOD-02 | See their scope. | The Bagian is shown; outside it is refused. | AUTO · RUN | P0 | **PARTIAL**: /pimpinan shows 'Kelas Rendah' (S16); the cross-scope address is not re-walked. |
| HOD-03 | See work waiting for review. | The queue is understandable, with an honest empty state. | RUN | P0 | **BLOCKED**: no content (B2). |
| HOD-04 | Review content. | Records the review; never publishes by itself; the author cannot approve their own work. | AUTO · RUN | P0 | **BLOCKED** by B2. The four-eyes rule is enforced in the database (selftests). |
| HOD-05 | Freeze approved content. | An explicit, labelled step with its status visible. | RUN | P0 | **FAIL**: three identical 'Konfirmasi' buttons (M11). DAISY-06, BOB-03. |
| HOD-06 | Question Health. | Signals as observations, with human review recorded. | RUN | P2 | **BLOCKED**: needs 30 answers per question. |
| HOD-07 | Integrity signals. | Reviewed by a human; never changes a score; learners cannot see them. | RUN · AUTO | P1 | **N-T**: in a live flow. The boundary is covered by selftests. |
| HOD-08 | Assign and run Uji Cepat. | Within scope. | RUN | P1 | **BLOCKED** by B2/B3. |
| HOD-09 | Read the department report. | Scoped figures that carry their standing. | RUN | P0 | **FAIL**: class figures are asked at the wrong level (B6c). BOB-06, DAISY-07. |
| HOD-10 | Try to publish. | A clear, non-leaky refusal. | CODE · AUTO | P0 | **PASS**: the capability map gives Kepala departemen no CAN_PUBLISH (live database). |
| HOD-11 | Sign out. | Keluar present. | AUTO | P0 | **FAIL**: no Keluar on /pimpinan. DAISY-02. |

## 6. Dean / Dekan — read-only evidence

Read school evidence and reports; seniority grants no capability.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) |
|---|---|---|---|---|---|
| DEA-01 | Sign in and land. | Lands on /pimpinan (D-010). | AUTO | P0 | **FAIL**: lands on /; /pimpinan is not linked (M15, crawl). |
| DEA-02 | School summary. | A few numbers, each with its standing. | RUN | P0 | **BLOCKED**: no evidence yet. |
| DEA-03 | Open a report. | Reachable by clicking, at the right scope. | RUN | P0 | **FAIL**: the summary pages are not linked and need a typed ID (B6b). BOB-06, DAISY-07. |
| DEA-04 | Decision queue and briefing. | Honest states. | RUN | P2 | **PARTIAL**: the queue exists but no screen feeds it. |
| DEA-05 | Certificate aggregates. | Aggregate and verification information only. | RUN | P2 | **N-T** |
| DEA-06 | Try Studio or a write. | Refused; seniority grants nothing. | CODE · AUTO | P0 | **PASS**: DEAN holds no capability (live database). |
| DEA-07 | Sign out. | Keluar present. | AUTO | P0 | **FAIL**: no Keluar on /pimpinan (code on main: only Konfigurasi has one). DAISY-02. |

## 7. School admin / Admin sekolah — from an empty school to a running one

The journey Gladys and each school admin make first. Every step must work without SQL.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) |
|---|---|---|---|---|---|
| ADM-01 | Receive the role; sign in. | Given by Gladys; lands on /konfigurasi. | AUTO | P0 | **PARTIAL**: the grant works (S4) and the admin signs in (S5), but lands on /. BOB-06. |
| ADM-02 | What needs doing. | Home shows the remaining setup. | RUN | P1 | **N-I**: Konfigurasi is a set of sections, with no readiness list. |
| ADM-03 | Build the school structure. | Create Bagian, Tingkat and Kelas on a screen; the hidden nodes are automatic; confirm before deactivating. | AUTO · RUN | P0 | **FAIL**: no screen. The backend is merged (BOB-01); the screen is DAISY-05. |
| ADM-04 | The academic year. | The current year exists and structure is tied to it. | CODE | P1 | **PARTIAL**: 2026/2027 exists for both schools; no screen for years (P2 for next year). |
| ADM-05 | Add staff. | Create the person and account, then give the role, with no later unexplained failure. | AUTO | P0 | **PARTIAL**: Gladys can (S3, S4). A school admin cannot give staff roles (M2, P1). No email is sent, and the copy now says so (DAISY-01). |
| ADM-06 | Give and revoke staff roles. | Allowed roles only; no self-grant; no escalation. | AUTO · CODE | P1 | **FAIL** for the school admin (M2); PASS for Gladys. |
| ADM-07 | Add students. | Intake into a Kelas; places that are not a Kelas are refused with a reason; staff are never turned into students. | AUTO | P0 | **PARTIAL**: intake into a Kelas works (S9); a school-level place is now refused at validation, with the reason in Indonesian (BOB-01; S8 on this baseline). Staff rows are still a trap (BOB-10). Pickers show hidden nodes (BOB-09). |
| ADM-08 | Correct account mistakes. | Fix a wrong email; re-issue a lost card or PIN. | RUN | P1 | **N-I** (M6). |
| ADM-09 | Import a lesson. | A file picker and template; a workbook saved by Microsoft Excel and one saved by Google Sheets both import (D-030); problems per row, in Indonesian; never into the canonical library (D-029). | AUTO · RUN | P0 | **FAIL**: text boxes only; both paths fail (S14, S15). BOB-02, DAISY-06. |
| ADM-10 | Check the imported content and media. | Text, questions and media exist and play. | RUN | P0 (media P1) | **FAIL**: no content can be imported; media playback fails (M9). |
| ADM-11 | Move content through its lifecycle. | Understandable steps, with the current status shown. | RUN | P0 | **FAIL** (M11). DAISY-06. |
| ADM-12 | Publish. | Only ready content; the right school selected by default. | AUTO · RUN | P0 | **FAIL**: no release can be created (B3); Studio defaults to the national library (M8, S14). BOB-03, DAISY-06. |
| ADM-13 | Assign the published lesson. | The right class, release and dates. | RUN | P0 | **BLOCKED** by B3. |
| ADM-14 | Pre-test and post-test exist. | Created on assignment; never a 404 (D-008). | AUTO | P0 | **FAIL** (B4). BOB-04. |
| ADM-15 | A student completes the journey. | Pre-test → lesson → post-test → result. | AUTO · RUN | P0 | **BLOCKED** |
| ADM-16 | The school report. | Reachable by clicking, with correct figures. | RUN | P0 | **FAIL** (B6b). BOB-06, DAISY-07. |
| ADM-17 | Report templates. | Compose from approved metrics; cannot change their meaning. | RUN | P2 | **N-T** |
| ADM-18 | Certificates. | Template and revocation; numbers never collide. | RUN · CODE | P1 | **N-T**: collision risk (N8). |
| ADM-19 | Transfer a student. | Governed request → authorize → execute. | RUN | P2 | **N-T** |
| ADM-20 | Audit trail. | Consequential actions leave a trace. | CODE | P0 | **PASS**: audit rows written for every production action so far (live database). |
| ADM-21 | Year rollover. | Correct, and history preserved. | RUN | P2 | **N-T**: needs two years. |
| ADM-22 | Sign out. | Keluar on every admin screen. | AUTO | P0 | **PARTIAL**: Konfigurasi has it; Pendataan, Aktivasi and Studio do not. DAISY-02. |

## 8. System admin / Admin platform

Operate the platform. Today this is Gladys alone (D-001).

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) |
|---|---|---|---|---|---|
| SYS-01 | Sign in and land. | Lands on /konfigurasi. | AUTO | P0 | **PARTIAL**: signs in (S1) but lands on /. BOB-06. |
| SYS-02 | Platform state. | Health, environment and schools, within platform scope. | RUN | P1 | **PARTIAL**: Konfigurasi shows system health and environment. |
| SYS-03 | Create a school. | A product flow, or an explicitly recorded operator path. | CODE | P2 | **N-I**: operator path only, recorded under D-013 (both schools exist). |
| SYS-04 | Grant SYSTEM_ADMIN. | Only an active SYSTEM_ADMIN; explicit and audited. | AUTO | P0 | **PASS**: enforced in the database (INV-16 selftests). |
| SYS-05 | Distribute canonical content. | Grant or withdraw; a school sees only what it may use. | RUN | P2 | **PARTIAL**: the form exists; no canonical content exists. |
| SYS-06 | Platform-only controls. | Restricted and audited. | AUTO | P1 | **N-T**: in a live flow (selftests cover it). |
| SYS-07 | Audit and feature flags. | Discoverable. | RUN | P1 | **PARTIAL**: Konfigurasi has audit and flags sections. |
| SYS-08 | Succession. | A second SYSTEM_ADMIN before 2027-09-23. | PROD | P1 | **FAIL**: one admin only. Action for Yazid and Gladys after onboarding. |
| SYS-09 | Sign out. | Keluar present. | AUTO | P0 | **PASS**: on Konfigurasi. |

## 9. Anonymous visitor and certificate verifier

What a stranger can see and do, and what they must never learn.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) |
|---|---|---|---|---|---|
| PUB-01 | Open /masuk as a stranger. | The page, logo and fonts load. | AUTO · PROD | P0 | **PASS**: F01-R08; front-door check this morning (run 35935767367). |
| PUB-02 | Try to sign up. | Refused; no alternate path. | AUTO · PROD | P0 | **PASS**: disable_signup verified at deploy; harness probe P2. |
| PUB-03 | Open a valid certificate token. | The status word first, then only the bounded facts. | AUTO | P1 | **PASS** (AUTO): selftests F04. No production certificate exists yet. |
| PUB-04 | Open a random token. | A privacy-preserving not-found; no existence oracle. | AUTO · PROD | P0 | **PASS**: F01-R07 in CI; harness probe P1. |
| PUB-05 | Eligible but not issued. | No QR, link or number exposed. | AUTO | P1 | **PASS** (AUTO): selftests. |
| PUB-06 | Look for leaks. | No signature, key version, answers or account data. | AUTO · CODE | P0 | **PASS**: assert_public_surface; five-field response. |
| PUB-07 | An unknown page. | PINTAR's own localized not-found, not a framework page. | AUTO | P0 | **FAIL**: Next.js default English 404 (harness probe P3). DAISY-04. |

## 10. The cross-role scenario — the check that decides go-live

One lesson, end to end, through the app (D-005). Run it last, after the role journeys.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) |
|---|---|---|---|---|---|
| X-01 | The admin prepares the school. | Structure, staff, students and roles, with no SQL or typed addresses. | AUTO · RUN | P0 | **FAIL**: structure needs SQL (B1). |
| X-02 | Get a lesson into PINTAR. | The import succeeds, with problems per row. | AUTO · RUN | P0 | **FAIL** (B2). |
| X-03 | Review and freeze. | The four-eyes rule holds; the lifecycle is truthful. | AUTO · RUN | P0 | **BLOCKED** |
| X-04 | Publish. | Admin publishes ready content only. | AUTO · RUN | P0 | **FAIL** (B3). |
| X-05 | Assign. | The right class; the eligible learner sees it and the ineligible one does not. | AUTO · RUN | P0 | **BLOCKED** |
| X-06 | Pre-test. | Orientation → start → answers → truthful finish. | AUTO · RUN | P0 | **FAIL** (B4). |
| X-07 | Lesson. | The material loads and progress persists. | RUN | P0 | **BLOCKED** |
| X-08 | Post-test. | Exists and completes. | AUTO · RUN | P0 | **FAIL** (B4). |
| X-09 | Result and certificate state. | Clear and honest. | RUN | P0 | **BLOCKED** |
| X-10 | The educator reads evidence. | Visible, without judgment. | RUN | P0 | **BLOCKED** |
| X-11 | The head of department reviews signals. | Observations stay observations. | RUN | P1 | **BLOCKED** |
| X-12 | Dean and admin read reports. | The right scope, carrying their standing. | RUN | P0 | **FAIL** (B6). |
| X-13 | Everyone signs out. | The next person never continues as the last. | AUTO · RUN | P0 | **FAIL** (B5). |

## 11. Universal checks (every flow)

| ID | Check | Gate | Baseline |
|---|---|---|---|
| U-NAV | Navigation: every intended screen is reachable by clicking. | P0 | **FAIL**: Aktivasi, Studio and Pimpinan are unlinked (M3, M15). |
| U-AUTH | Authorization: a direct address outside role or scope fails closed; navigation is never the security boundary. | P0 | **PASS**: every destination refuses server-side (gate review of DAISY-02/03); RLS everywhere. |
| U-TRUTH | Truthfulness: success means a real change happened. | P0 | **FAIL**: Studio upload shows a reference code and creates nothing (S14). PASS for structure and activation (selftests). |
| U-LOC | Language: no raw database or framework English text; ID and EN are equivalent. | P0 | **FAIL**: raw errors (M7); English 404 (P3). BOB-07, DAISY-04. |
| U-EMPTY | Empty states: 'not yet' is never shown as failure, and absence is never shown as a finding. | P1 | **PARTIAL**: the '(0/5)' cards promise figures (DAISY-07). |
| U-DEVICE | Phone, touch and shared device: usable at 320px; Keluar everywhere; idle timeout for class cards. | P0 | **FAIL** (B5). DAISY-02, BOB-05. |
| U-CONTEXT | The school, class or department is visible before any consequential action. | P0 | **PARTIAL**: yes on /mengajar; Studio defaults to the wrong school (M8). |
| U-AUDIT | Consequential actions leave a trace. | P0 | **PASS** (live database). |
| U-PRIV | Privacy: no existence oracle; no keys or integrity internals for learners; no learner full name on shared screens (D-020). | P0 | **PARTIAL**: the greeting uses the full name; the staff strip could name a learner (caught at the gate, DAISY-02). |
| U-RECOVER | Recovery without SQL where the product claims self-service. | P1 | **FAIL**: account corrections (M6). |
| U-ERR | Error pages are PINTAR's own and show a reference, never a stack trace. | P0 | **FAIL**: framework defaults (P3). DAISY-04. |

## 12. Release-day checks (production, read-only)

Run after the migrations and the deploy of the release candidate. None of them writes to production.

| ID | Check | Gate | Status today |
|---|---|---|---|
| REL-01 | CI is green on the exact release commit, strict selftest included. | P0 | **PASS** for the live release 5b5b68d (run 35850275026). |
| REL-02 | The audit journeys pass on the release candidate with zero operator (SQL) steps, and every P0 flow check above is PASS. | P0 | **FAIL**: on main 78b0f55 (this baseline). |
| REL-03 | Migrations are applied to production before the app, in order; the count equals the repository's. | P0 | **PASS** for the live release: production 111 = release 5b5b68d. main has 112 (BOB-01), applied with the sprint 1 release. |
| REL-04 | Launch readiness is 17/17, and every assert_* passes (including the evaluation boundary, canonical tenants and official bootstrap). | P0 | **PASS**: this morning, on production. |
| REL-05 | Every functional step of the deploy is green: front door, closed verification 404, activation refusal, Auth boundary. | P0 | **PASS**: deploy 013. |
| REL-06 | The external front-door check says FRONT DOOR OK. | P0 | **PASS**: run 35935767367. |
| REL-07 | Auth: sign-up disabled; site_url is the origin; a single callback. | P0 | **PASS** (deploy 013 read-back). |
| REL-08 | Supabase settings: the email rate limit fits a school's morning; the password policy allows class cards; the magic-link email is Indonesian and names the same-device rule. | P0 | **NOT VERIFIED**: Yazid, in the Supabase dashboard. |
| REL-09 | Offline copies of CARD_PEPPER and CERT_SECRET_KEY_V1 exist. | P0 | **NOT VERIFIED**: Yazid. |
| REL-10 | A rollback point is recorded and the release is logged in RELEASES.md. | P0 | **PASS** for 5b5b68d (rollback c358f58). |
| REL-11 | No test data exists in production; production data changed only through audited steps (D-013, D-017). | P0 | **PASS**: 1 person, 1 account, 2 schools, all recorded. |
| REL-12 | After go-live and onboarding, Gladys walks X-01…X-13 on production with real data and signs off. | P0 (post-deploy) | **N/A**: until the sprint 1 release. |

## 13. Known findings and where they are fixed

| Ref | Finding | Fix | State |
|---|---|---|---|
| B1 | No screen for classes | Backend MERGED (BOB-01); screen DAISY-05 | OPEN |
| B2 | Lesson upload does not work | BOB-02 in progress; DAISY-06 | OPEN |
| B3 | No release or publish path | BOB-03; DAISY-06 | OPEN |
| B4 | Pre-test and post-test never created | BOB-04 | OPEN |
| B5 | No sign-out | DAISY-02 (changes required); BOB-05 | OPEN |
| B6 | Reports unreachable or empty | (a) demo schools: FIXED by D-003; (b)(c) BOB-06, DAISY-07 | PARTLY FIXED |
| M5a | Intake accepts wrong places | BOB-01 | FIXED on main |
| New | Intake enrols into the newest year, not the Kelas's year | BOB-01 (F10-M02) | FIXED on main |
| N1, N6 | Activation copy; one name for Uji Cepat | DAISY-01 | FIXED on main |
| Front door | Logo and fonts redirected for strangers | 5b5b68d | FIXED, live |
| M1–M15, N2–N15 | See the audit report | BOARD backlog and sprint 1 tickets | OPEN |

## 14. Run record (kept for every run, in RELEASES.md)

| Field | What to record |
|---|---|
| Release candidate | Commit SHA on main, and the migrations it carries |
| Harness run | Workflow run ID of 'audit · end-to-end journeys' on that exact SHA |
| CI run | Workflow run ID of CI on that exact SHA (REL-01) |
| Walked by hand | Who walked the RUN checks, on which devices (phone and desktop), in which languages |
| P0 result | Count of P0 checks: PASS / total. Go-live needs every one |
| P1 exceptions | Each P1 not PASS, with the D- number of Yazid's written acceptance |
| New defects | Flow ID → BOB-/DAISY- ticket, opened on BOARD.md |
| Release-day checks | REL-01…REL-11 results, after the deploy, on production (read-only) |
| Decision | GO or NO-GO, by the coordinator, recorded in RELEASES.md |
| Sign-off | Gladys, after REL-12 |

## 15. Completion rule

A role is complete only when a person can enter through the intended door, find the next action, finish the consequential work, receive a truthful outcome, recover or be refused safely, and sign out — without SQL, typed addresses, developer help or knowledge of PINTAR's internals.

Go-live rule: every P0 check is PASS on the release candidate and in the release-day checks; every P1 check is PASS or accepted by Yazid in DECISIONS.md; P2 checks are on the board.

The acceptance scenario, in order: set up a school → add classes and people → import, review and publish a lesson → assign it → a learner completes the pre-test, lesson and post-test → the learner sees the result and certificate state → the educator, head of department and management see the evidence → everyone signs out safely.

## Appendix A — sources

- docs/coordination/DECISIONS.md: D-001…D-030 (canonical; overrides older specs where they differ, e.g. landings D-010).
- docs/coordination/BOARD.md: tickets BOB-01…10, DAISY-01…11, backlog.
- docs/audit/PINTAR-4.0-ISSUES-AND-STATUS-2026-09-24.md: the 36 audit findings.
- Audit harness: audit/journey.mjs (steps S1–S16, P1–P3) and audit/crawl.mjs; workflow 'audit · end-to-end journeys'.
- PINTAR-4.0 Experience, Core DB/Backend, Frontend Implementation, Continuity and Load-Resilience specifications: role goals and boundaries (evidence, not coordination authority).
- The 24 September draft of this checklist (Yazid), which v2 keeps and extends.

## Appendix B — what changed from the 24 September draft

- Routes and landings corrected to the product as built and to D-010 (/belajar, /mengajar, /pimpinan, /konfigurasi); the non-existent /kelas and /sekolah routes are removed.
- Every check now has a Gate (P0 blocks go-live; P1 needs a fix or Yazid's written acceptance; P2 after go-live), a How (AUTO / RUN / PROD / CODE) and a Baseline status with its evidence and ticket.
- New checks: STU-20 language; PUB-07 unknown page; U-ERR error pages; the D-009 sign-out rules (this device only, 60-minute idle for class cards); D-020 first names; the release-day checks REL-01…12.
- New section: release-day production checks (read-only), including the Supabase settings and secret custody only Yazid can confirm.
- Rule added: never create test data in production; pre-release runs use a production-like copy (D-013, D-017).
- The known-findings list now maps each finding to its ticket and current state.
