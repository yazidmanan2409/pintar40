# PINTAR 4.0 — End-to-End User Flow & Release Checklist

> **RETIRED AS THE READINESS MEASURE, 1 Oct 2026 (D-084). The rows below stay as engineering detail. Their PASS counts are not a readiness measure. PINTAR's status is the journey status in docs/recovery/PHASE-1-STATUS.md under docs/recovery/EVIDENCE-MODEL.md; go-live is Phase 8 of docs/recovery/RECOVERY-CHARTER.md.**

**v2.5 — 2 October 2026 (status on main 38944b5, batch 7; v2 of 24 Sep kept as the baseline).** Rendered from `docs/coordination/checklist/checklist_data.py`; edit there and re-render. The Word copy for Yazid comes from the same data.

| | |
|---|---|
| **Baseline** | PINTAR 4.0 as built. Canonical decisions D-001…D-037 (docs/coordination/DECISIONS.md); board BOB-/DAISY- tickets (BOARD.md). |
| **Purpose** | Prove that every intended flow exists, can be reached, holds together end to end, and respects the role boundary — and decide whether a release may go live. |
| **Method** | Inspect the release candidate as a user: automated browser journeys on a production-like copy, walkthroughs by hand, then read-only production checks after deploy. A route, function or component existing is not a PASS. |
| **Gate rule** | No push to live unless every P0 check is PASS on the release candidate, and every P1 check is PASS or accepted in writing by Yazid (DECISIONS.md). |
| **Owner** | Coordinator (Claude) runs and records it; Bob and Daisy fix; Yazid accepts P1 exceptions; Gladys does the final acceptance walkthrough. |

> Calm on the surface. Rigorous underneath. One meaningful next action is obvious, while authorization, evidence and state transitions stay correct.

## Row counts (engineering detail, not a readiness measure) (main after batch 7 (M3 read-again, C1, J6.13, X.6, D-006, J6.14) `38944b5`, 2 Oct 2026)

P0 checks only; each must be PASS on the release candidate before any push to live. The baseline of 24 Sep 2026 (main `78b0f55`) is kept beside each row.

**Evidence now:** main 38944b5 carries batch 7 and is on staging with 145 migrations (staging.yml run 36959297570: migrations equal the repository, sign-in boundary and email asserted). Its CI is green (run 36957342031) and its browser audit green: crawl A with the 320 px gate and job B 52 PASS, 1 NOTE, 0 FAIL from an empty production-like database (run 36957344279). On staging after the push: environment facts GREEN (run 36959373374); staging walk 009 20 PASS, 1 NOTE, 1 NOT RUN, no 5xx, no page error (run 36959504927); the first Golden School founded by the C1 step (found-school.yml run 36959472214) and its first administrator appointed by the screens and signed in by the real email link (run 36959505012, G0-G5 PASS). Production is unchanged (5b5b68d, 111 migrations).

| Section | P0 checks | PASS | PARTIAL | FAIL | BLOCKED | N-I | N-T | PASS at baseline |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Student / Murid | 15 | 14 | 1 | 0 | 0 | 0 | 0 | 1 |
| Educator / Guru | 8 | 8 | 0 | 0 | 0 | 0 | 0 | 1 |
| Head of department / Kepala departemen | 8 | 8 | 0 | 0 | 0 | 0 | 0 | 1 |
| Dean / Dekan | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 1 |
| School admin / Admin sekolah | 14 | 13 | 1 | 0 | 0 | 0 | 0 | 1 |
| System admin / Admin platform | 3 | 3 | 0 | 0 | 0 | 0 | 0 | 2 |
| Anonymous visitor and certificate verifier | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 4 |
| The cross-role scenario | 12 | 10 | 2 | 0 | 0 | 0 | 0 | 0 |
| Capacity | 4 | 0 | 2 | 1 | 0 | 0 | 1 | 0 |
| Universal checks | 10 | 10 | 0 | 0 | 0 | 0 | 0 | 2 |
| **Total** | **84** | **76** | **6** | **1** | **0** | **0** | **1** | **13** |

**Baseline, for comparison:** 13 PASS · 11 PARTIAL · 33 FAIL · 22 BLOCKED · 1 N-I · 3 N-T. **Evidence at baseline:** Audit journeys run 35952344955 (harness 39ad60e, app main 78b0f55): Gladys's path from an empty production-like database, 15 PASS · 5 FAIL · 1 BLOCKED · 1 note, with one operator (SQL) step (W1); the seeded-world crawl of 14 personas; the public probes P1–P3. Plus CI, selftests and read-only production checks, as cited per row.

**Verdict now:** 76 of 84 P0 checks pass (baseline 13). NO-GO. main 38944b5 (batch 7) is on staging with 145 migrations; production still runs 5b5b68d (111). What stands between main and go-live, by owner: Yazid — the production Supabase SMTP password; the readiness tier wording (D-082(e)); the card and certificate physical proofs; the forwarding key at staging acceptance (D-062(c), needed before CAP-01 means anything); REL-09's recovery copies (D-066); the D-029 question for PINTAR's own chapters (M6); the production read permission for the restore rehearsal; the compute tier before production (CAP-08, D-089: Micro failed L1 at 1,000 learners; the upgrade follows a successful capacity test; initial testing held to 50 people at once); a cross-school read of whether each school's admin has signed in (SYS-02). Held for the joint landing (Gate 3) — BOB-26 with DAISY-20 and BOB-50: X-09's certificates, EDU-10, U-RECOVER. Coordinator — the Golden School's spine past GS-03 (structure, pass mark, staff, students and cards, content, review: GS-04 to GS-09); the L1 rerun waits for the compute decision, with the harness unchanged so it stays comparable (D-089; CAP-01 after the forwarding key).

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
**How:** AUTO automated test or harness step · LOAD load test on staging (D-031) · RUN walked by hand with screenshots · PROD read-only check on production · CODE code or database inspection.  
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

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) | Now (38944b5) |
|---|---|---|---|---|---|---|
| STU-01 | Sign in by email link or class card. | The intended account gets in. A wrong or expired link gives a clear, localized way back, which names the same-device rule. | AUTO · RUN | P0 | **PASS**: email link and class card both sign in (journey S1, S11); the expired-link screen names the same-device rule (DAISY-01). Cross-device links fail by design (M1, P1). | **PASS**: the email link and the class card sign in on every audit (S1, S11), the card through BOB-12's route since DAISY-13 (audit #52: S11 and five more in S21); staging J07 and J13. The route's staging acceptance waits for the forwarding key (D-062(c)). |
| STU-02 | Arrive after sign-in. | Lands on /belajar (D-010), not a generic page. | AUTO | P0 | **FAIL**: lands on / (journey S11). BOB-06, DAISY-03. | **PASS**: lands on /belajar (S11, BOB-06). |
| STU-03 | Read the /belajar home. | One obvious next action; a clear 'nothing assigned yet'; greeted by first name only (D-020). | AUTO · RUN | P0 | **PARTIAL**: the empty state is clear (S11); the greeting uses the full name. DAISY-10. | **PASS**: greeted by first name only, 'Halo, Ani' (S11, DAISY-10); the empty state is clear, and with an assignment /belajar offers the next step (S19). |
| STU-04 | Open an assigned lesson. | Shows the trail and context without starting any assessment. | RUN | P0 | **BLOCKED**: nothing can be assigned (B3, B4). | **PASS**: on staging: the assignment page shows the trail and the chapter (run 7, J08); opening it and its orientation starts nothing ("session before pressing: none", read from the database). |
| STU-05 | Open the pre-test orientation. | Explains what is about to happen, truthfully; looking is not committing. | RUN · AUTO | P0 | **BLOCKED** by B4. The orientation renders in the seeded world. | **PASS**: the pre-test orientation opens from /belajar (S19); the window opens at the school's midnight, which S18 checks at any hour (DAISY-14). |
| STU-06 | Explicitly start the pre-test. | Only the explicit press creates the session, exactly once; refusals are understandable. | AUTO · RUN | P0 | **BLOCKED** by B4. The engine is covered by the release's selftests. | **PASS**: only the press on "Mulai Pemetaan Awal" creates the session (staging J08: none before the press, FINALIZED after); exactly once and the offline outbox are selftests (R1); a pre-test not prepared is refused in words (audit A). |
| STU-07 | Answer items; change answers; reload. | One player; no keys before review; answers sync correctly. | AUTO · RUN | P0 | **BLOCKED** by B4. The engine is covered by selftests (the R1 outbox family). | **PASS**: answers are counted exactly (staging J08, J11, J13); an unsaved last answer is kept at «Kumpulkan» (W3); a student changes a saved post-test answer and reloads mid-test: the test reopens at the next unsaved question and the result counts the changed answer (S21, student 2; runs 36954714221 and 36957344279). |
| STU-08 | Pause and resume where allowed. | Only where the assessment rules permit. | RUN | P1 | **N-T** | **N-T** (unchanged) |
| STU-09 | Lose and regain the network. | Answers are kept; offline is shown apart from refused. | AUTO · RUN | P0 | **BLOCKED** by B4. The outbox is covered by selftests. | **PASS**: on the audit stack: in S21 a student loses the network at a post-test question; the page says «Sedang luring…» (never «sudah ditutup»), the answer stays on the device and is not called saved, and when the network returns it goes through and reads «Tersimpan»; the result equals the plan (run 36952453693, branch 39806c7, on its way to main). |
| STU-10 | Finish the pre-test. | Finalizes only when every answer has synced; nothing is silently lost. | AUTO | P0 | **BLOCKED** by B4. Covered by selftests (R1). | **PASS**: on the online path: 4 of 4 answered and finalized, the score equal to the plan (staging J08, J13); offline is STU-09. |
| STU-11 | Read the lesson. | Text, and media where present, load; the place is kept. | RUN | P0 | **BLOCKED** by B2/B3. Media playback FAILs in the seeded world: /api/assets/read-url answers 404 for the lesson audio and video (crawl; M9, P1). | **PARTIAL**: . Media half OUT OF SCOPE for the first testing phases (D-050): not tested, not PASS. Text half PASS on staging: every lesson read to its last page by clicking, every position saved in full and every lesson read, and nothing repeats while a lesson is open since BOB-23 (runs 14-16; run 16: the seven lessons of SMA X Bab 1). |
| STU-12 | Use hints. | Help without revealing the answer; valid hints are not rejected. | CODE · RUN | P1 | **PARTIAL**: the hint checker rejects ordinary hints (N5). | **PARTIAL** (unchanged) |
| STU-13 | Reach the post-test. | It exists for the assigned lesson and never ends in a 404. | AUTO · RUN | P0 | **FAIL**: the pre-test link ends in a 404 (seeded official school, crawl). BOB-04. | **PASS**: on staging since BOB-22: after reading, the home ("Siap untuk Uji Penguasaan", 2 links), the assignment page and the last lesson link to the post-test (run 12, J10); J11 opened it from a link. Never a 404 (BOB04-K01). |
| STU-14 | Complete the post-test. | The same resilient engine as the pre-test. | AUTO · RUN | P0 | **BLOCKED** by B4. | **PASS**: on staging: five students completed the post-test by clicking; each result equals the planned answers (run 12, J11, J13). |
| STU-15 | Read the result. | Mastery with its meaning, own growth; no rank, class average or other learner. | RUN | P0 | **BLOCKED** by B4. | **PASS**: on staging: the page says 88% with "Terjawab tepat 7 dari 8 soal", the growth 50% → 88%, the questions to review; no rank, class average or other learner (run 12, J12). |
| STU-16 | Review feedback. | Permitted review only; no internals. | RUN | P1 | **BLOCKED** by B4. | **N-T**: unblocked; not yet walked. |
| STU-17 | Certificate state. | Not eligible → no certificate; eligible → 'being prepared'; issued → actions. Rendering never issues one. | AUTO · RUN | P1 | **BLOCKED** by B4. The lifecycle is covered by selftests (F04). Real certificates now, since the schools are real (D-003). | **N-T**: unblocked; not yet walked. The lifecycle is covered by selftests (F04). |
| STU-18 | Finish all work. | An honest 'nothing more to do', or the next expectation. | RUN | P0 | **BLOCKED** | **PASS**: on staging: "Apa berikutnya" after the result lists what is open next (run 12, J12). Since v2.3 (J6.13): with every chapter finished and nothing waiting, the home says «Tidak ada lagi yang menunggu» and where new work will appear, instead of «Ini yang sedang berjalan hari ini.» (S21f, runs 36950730580 and 36952453693; J613-K01). |
| STU-19 | Sign out on a shared tablet. | Keluar on every screen; ends this device's session only; Back and refresh do not resume. Class-card sessions end after 60 minutes idle (D-009). | AUTO · RUN | P0 | **FAIL**: no Keluar on /belajar (S11). DAISY-02, BOB-05. | **PASS**: on one computer, «Keluar», then Back and refresh land on /masuk with nothing of the first student; the next student signs in and finds only their own home and the lesson at its first page (S21c, W2); a card session ends after 60 minutes idle (BOB-05). |
| STU-20 | Switch language. | Every learner screen switches ID ↔ EN; content is not translated. | AUTO | P1 | **PARTIAL**: the ID/EN switch is on every learner screen (crawl); the English rendering has not been walked. | **PASS**: «EN» switches the home, the lesson's page counter and buttons, and the test's controls; the lesson's text is unchanged; «ID» switches back (S21g, run 36957344279). The first walk found the lesson and test players Indonesian whatever the reader chose (fixed in batch 7: J614-K01). |

## 4. Educator / Guru — the teaching journey

Prepare, assign, run Uji Cepat and read class evidence.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) | Now (38944b5) |
|---|---|---|---|---|---|---|
| EDU-01 | Sign in. | Lands on /mengajar (D-010), with no management or admin leakage. | AUTO | P0 | **FAIL**: lands on / (S13). BOB-06, DAISY-03. | **PASS**: lands on /mengajar (S13, BOB-06). |
| EDU-02 | Educator home. | One meaningful next action; honest empty states. | RUN | P1 | **PARTIAL**: the empty state is clear; not walked with live work. | **PASS**: walked with live work: «Keadaan hari ini», «Lihat bukti», «Lihat nama murid» (S21b, S22; staging J14). |
| EDU-03 | Choose the teaching context. | The class, school and year are stated plainly. | AUTO | P0 | **PASS**: 'SD Zayd Pintar Selalu / Kelas 1A / 2026/2027' (S13). | **PASS** (unchanged) |
| EDU-04 | Read the roster. | Only permitted classes; another class's address is refused. | AUTO · RUN | P0 | **PARTIAL**: the class shows (S13); the cross-class address is not re-walked. Scope is enforced server-side (selftests). | **PASS**: the roster is read by clicking and a learner's record opened from it (S22); a teacher whose class was taken away is refused it (S26b); a learner who moved class is no longer the old teacher's (S25, D-088(i)). |
| EDU-05 | Prepare learning. | Find a published lesson and prepare the assignment. | RUN | P0 | **FAIL**: 'Belum ada materi' (S13). BOB-02, BOB-03. | **PASS**: the teacher finds the published SD 5 Bab 1 on Siapkan and reviews it (S18). |
| EDU-06 | Assign learning. | Bound to class, release and dates; the dates are enforced, in WIB. | RUN · CODE | P0 (dates P1) | **BLOCKED** by B3; the dates are not enforced (M10, P1). | **PASS**: assigning makes the learning assignment with both tests open, from 00:00:00 to 23:59:59 WIB of the chosen days at any hour (S18; DAISY-14-TANGGAL-01). |
| EDU-07 | Launch Uji Cepat. | Atur → Tinjau → Tersedia with an explicit commit. | RUN | P1 | **BLOCKED**: no chapters or items exist (B2). | **PASS**: on staging: the teacher chooses the chapter, ticks 5 questions, reviews and launches (T2); the student's paper is exactly the 5; the teacher reads the hand-in (staging walk 008, Q3–Q5, run 36951544367; audit S26e). BOB-42's window end is checked on staging by EDU-09's new J14 line. |
| EDU-08 | A learner finds the Uji Cepat. | An eligible learner can start it; non-response stays neutral. | RUN | P1 | **BLOCKED** | **PASS**: on staging: the student found the Uji Cepat under «Bisa dikerjakan sekarang», took it and handed it in, and the teacher's count moved (run 15, Q4-Q5). Runs 13, 14 and 16 could not launch one (BOB-42). |
| EDU-09 | Monitor progress. | Participation and evidence, without judgment; no integrity or Question Health access. | RUN · CODE | P0 | **PARTIAL**: counts exist (code); not walked with live work. | **PASS**: «Lihat nama murid» (S21b), «Lihat per soal» with the questions the class found hard (S22, M5), the Uji Cepat hand-in counted (staging Q5); «Keadaan hari ini» lists no Uji Cepat whose window has ended (staging J14, walk 009, run 36959504927: 0 rows while every earlier walk's had ended; BOB-42). |
| EDU-10 | See the Uji Cepat result. | The score is visible where designed. | RUN | P1 | **FAIL**: no score screen for anyone (M12). | **FAIL** (unchanged) |
| EDU-11 | Extend a deadline. | It works with a reason and an audit trail, within scope. | RUN | P2 | **N-T** | **N-T** (unchanged) |
| EDU-12 | Read class evidence. | Evidence sufficiency is explicit; no fabricated zeros. | RUN | P0 | **BLOCKED**: no evidence yet (B3, B4). | **PASS**: on the audit stack (D-064): with five students' official evidence, Lihat bukti reads «Pemahaman 75%» and «+35 poin», exactly the plan's values, and shows mastery by part; the misconception figure stays absent and says why (no codes yet, D-063). Insufficiency stays explicit where evidence is not official (staging J14, by design). Audit #52, S21-S22. |
| EDU-13 | What next. | Assistive, not authoritative. | RUN | P2 | **N-T** | **N-T** (unchanged) |
| EDU-14 | Sign out. | Keluar present; this device only. | AUTO | P0 | **FAIL**: no Keluar on /mengajar (S13). DAISY-02. | **PASS**: Keluar on /mengajar (S13, DAISY-02). |

## 5. Head of department / Kepala departemen — review and oversight

Review and freeze sound work; read department evidence.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) | Now (38944b5) |
|---|---|---|---|---|---|---|
| HOD-01 | Sign in and land. | Lands on /pimpinan; /studio/tinjau is one click away. | AUTO | P0 | **FAIL**: lands on /; /pimpinan is not linked (M15). DAISY-03, BOB-06. | **PASS**: lands on /pimpinan (S16, BOB-06); Studio is a tab on it (DAISY-11). |
| HOD-02 | See their scope. | The Bagian is shown; outside it is refused. | AUTO · RUN | P0 | **PARTIAL**: /pimpinan shows 'Kelas Rendah' (S16); the cross-scope address is not re-walked. | **PASS**: /pimpinan shows the department, its roster lists every learner (S23, W10); the school's root and the other school, typed as addresses, refuse the head of department (S23, HOD-02). |
| HOD-03 | See work waiting for review. | The queue is understandable, with an honest empty state. | RUN | P0 | **BLOCKED**: no content (B2). | **PASS**: the head of department reaches Studio → «Antrean Tinjauan» by clicking; before Bab 1 is sent it says «Tidak ada yang menunggu tinjauan Anda.» exactly when nothing of the school waits; once sent it lists Bab 1, which opens on its package page with «Setujui isi» offered (S17t, run 36957344279). |
| HOD-04 | Review content. | Records the review; never publishes by itself; the author cannot approve their own work. | AUTO · RUN | P0 | **BLOCKED** by B2. The four-eyes rule is enforced in the database (selftests). | **PASS**: the head of department is Bab 1's reviewer: reads every question, key and reason (28 of 28, 112 of 112 options, 28 keys), approves, makes and locks the release; the author is never offered the second person's step (S17, D-088(h), HOD-05, GS-09). |
| HOD-05 | Freeze approved content. | An explicit, labelled step with its status visible. | RUN | P0 | **FAIL**: three identical 'Konfirmasi' buttons (M11). DAISY-06, BOB-03. | **PASS**: 'Kunci terbitan' is its own named step with the current status shown; the lock succeeds for the second person (S17, DAISY-06). |
| HOD-06 | Question Health. | Signals as observations, with human review recorded. | RUN | P2 | **BLOCKED**: needs 30 answers per question. | **BLOCKED** (unchanged) |
| HOD-07 | Integrity signals. | Reviewed by a human; never changes a score; learners cannot see them. | RUN · AUTO | P1 | **N-T**: in a live flow. The boundary is covered by selftests. | **N-T** (unchanged) |
| HOD-08 | Assign and run Uji Cepat. | Within scope. | RUN | P1 | **BLOCKED** by B2/B3. | **N-T**: unblocked; not yet walked. |
| HOD-09 | Read the department report. | Scoped figures that carry their standing. | RUN | P0 | **FAIL**: class figures are asked at the wrong level (B6c). BOB-06, DAISY-07. | **PASS**: , now with figures: Pimpinan's «Per kelas» shows Kelas 1A «Ada angka»: Peserta 5, Pemahaman 75%, the net gain 35% (audit #52, S23); each class answers for itself and an absent figure says why (BOB-06, DAISY-07). |
| HOD-10 | Try to publish. | A clear, non-leaky refusal. | CODE · AUTO | P0 | **PASS**: the capability map gives Kepala departemen no CAN_PUBLISH (live database). | **PASS** (unchanged) |
| HOD-11 | Sign out. | Keluar present. | AUTO | P0 | **FAIL**: no Keluar on /pimpinan. DAISY-02. | **PASS**: Keluar on /pimpinan (S16, DAISY-02). |

## 6. Dean / Dekan — read-only evidence

Read school evidence and reports; seniority grants no capability.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) | Now (38944b5) |
|---|---|---|---|---|---|---|
| DEA-01 | Sign in and land. | Lands on /pimpinan (D-010). | AUTO | P0 | **FAIL**: lands on /; /pimpinan is not linked (M15, crawl). | **PASS**: lands on /pimpinan (BOB06-R01, every role redirected home; CI #191). |
| DEA-02 | School summary. | A few numbers, each with its standing. | RUN | P0 | **BLOCKED**: no evidence yet. | **PASS**: a dean onboarded by the school admin's screens (Pendataan, Aktivasi, «Dekan» at the school) signs in by the email link, reads the school on /pimpinan, opens «Buka ringkasan sekolah» by clicking (no raw decimal), and Konfigurasi, Aktivasi, Studio and Pendataan refuse the dean (S23d, runs 36954714221 and 36957344279). |
| DEA-03 | Open a report. | Reachable by clicking, at the right scope. | RUN | P0 | **FAIL**: the summary pages are not linked and need a typed ID (B6b). BOB-06, DAISY-07. | **PASS**: from Pimpinan the dean opens the school summary and each class summary by clicking, at their own scope (DAISY-07-LAPORAN-02, against the seeded school, CI #197 and #199 (26/26)). |
| DEA-04 | Decision queue and briefing. | Honest states. | RUN | P2 | **PARTIAL**: the queue exists but no screen feeds it. | **PARTIAL** (unchanged) |
| DEA-05 | Certificate aggregates. | Aggregate and verification information only. | RUN | P2 | **N-T** | **N-T** (unchanged) |
| DEA-06 | Try Studio or a write. | Refused; seniority grants nothing. | CODE · AUTO | P0 | **PASS**: DEAN holds no capability (live database). | **PASS** (unchanged) |
| DEA-07 | Sign out. | Keluar present. | AUTO | P0 | **FAIL**: no Keluar on /pimpinan (code on main: only Konfigurasi has one). DAISY-02. | **PASS**: Keluar on /pimpinan (DAISY-02). |

## 7. School admin / Admin sekolah — from an empty school to a running one

The journey Gladys and each school admin make first. Every step must work without SQL.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) | Now (38944b5) |
|---|---|---|---|---|---|---|
| ADM-01 | Receive the role; sign in. | Given by Gladys; lands on /konfigurasi. | AUTO | P0 | **PARTIAL**: the grant works (S4) and the admin signs in (S5), but lands on /. BOB-06. | **PASS**: the grant works (S4) and the school admin lands on /konfigurasi (S5, BOB-06). |
| ADM-02 | What needs doing. | Home shows the remaining setup. | RUN | P1 | **N-I**: Konfigurasi is a set of sections, with no readiness list. | **PASS**: «Persiapan sekolah» on Konfigurasi says what is done and what remains: Kelas, students placed, every Kelas with a teacher (S7, S12b). |
| ADM-03 | Build the school structure. | Create Bagian, Tingkat and Kelas on a screen; the hidden nodes are automatic; confirm before deactivating. | AUTO · RUN | P0 | **FAIL**: no screen. The backend is merged (BOB-01); the screen is DAISY-05. | **PASS**: Bagian, Tingkat and Kelas built on the Struktur sekolah screen, no SQL (S7, DAISY-05). |
| ADM-04 | The academic year. | The current year exists and structure is tied to it. | CODE | P1 | **PARTIAL**: 2026/2027 exists for both schools; no screen for years (P2 for next year). | **PARTIAL** (unchanged) |
| ADM-05 | Add staff. | Create the person and account, then give the role, with no later unexplained failure. | AUTO | P0 | **PARTIAL**: Gladys can (S3, S4). A school admin cannot give staff roles (M2, P1). No email is sent, and the copy now says so (DAISY-01). | **PASS**: people are created by the screens: the first school admin through «Orang baru» by clicking (S3, J1.4), staff by Pendataan, Aktivasi and Peran & akses (S12, S16, S23d, S26b). Peran & akses offers the school first by its own name, then its Bagian, Tingkat and Kelas, never a hidden level (D-006, D006-K01). |
| ADM-06 | Give and revoke staff roles. | Allowed roles only; no self-grant; no escalation. | AUTO · CODE | P1 | **FAIL** for the school admin (M2); PASS for Gladys. | **PASS**: the school admin grants (S12, S23d), revokes (S24) and replaces a teacher (S26b) by the screens, choosing only D-006's scopes. |
| ADM-07 | Add students. | Intake into a Kelas; places that are not a Kelas are refused with a reason; staff are never turned into students. | AUTO | P0 | **PARTIAL**: intake into a Kelas works (S9); a school-level place is now refused at validation, with the reason in Indonesian (BOB-01; S8 on this baseline). Staff rows are still a trap (BOB-10). Pickers show hidden nodes (BOB-09). | **PASS**: intake into a Kelas works (S9); a place that is not a Kelas or Tingkat is refused at validation with a reason (BOB-01); staff rows are refused at validation with a reason and never become students (BOB-10: F10-M01, CI #210; audit #30 S8 shows both refusals and nobody recorded); pickers offer only Bagian, Tingkat and Kelas by path (BOB-09). |
| ADM-08 | Correct account mistakes. | Fix a wrong email; re-issue a lost card or PIN. | RUN | P1 | **N-I** (M6). | **N-I** (unchanged) |
| ADM-09 | Import a lesson. | A file picker and template; a workbook saved by Microsoft Excel and one saved by Google Sheets both import (D-030); problems per row, in Indonesian; never into the canonical library (D-029). | AUTO · RUN | P0 | **FAIL**: text boxes only; both paths fail (S14, S15). BOB-02, DAISY-06. | **PASS**: file picker, template, problems per row in Indonesian, media, save; never into the national library (S14, S15b, DAISY-06). A workbook saved by Microsoft Excel and one saved by Google Sheets both import, in CI (BOB02-X01 counts 2 real applications; K01; BOB-16 reads Google Sheets' N.0 as N). The template keeps typed text as text in Excel and LibreOffice (DAISY-15, DAISY-06-TEMPLAT-01) and in Google Sheets (Yazid's round trip on 27 Sep: 78.145 and 007 come back as text with the Text format). |
| ADM-10 | Check the imported content and media. | Text, questions and media exist and play. | RUN | P0 (media P1) | **FAIL**: no content can be imported; media playback fails (M9). | **PARTIAL**: . Playback OUT OF SCOPE for the first testing phases (D-050): not tested, not PASS. Text, questions and media files exist on staging after the teacher's own upload (staging journey J04: 6 lessons, 28 questions, 4 media files uploaded because Studio will not save the workbook without them). |
| ADM-11 | Move content through its lifecycle. | Understandable steps, with the current status shown. | RUN | P0 | **FAIL** (M11). DAISY-06. | **PASS**: seven named steps with the current one marked, no 'Konfirmasi' (S17, DAISY-06). |
| ADM-12 | Publish. | Only ready content; the right school selected by default. | AUTO · RUN | P0 | **FAIL**: no release can be created (B3); Studio defaults to the national library (M8, S14). BOB-03, DAISY-06. | **PASS**: published only after the content check's findings were reviewed; before that it was refused in plain words (S17). SD is preselected; the national library is not offered (S14, S15b). |
| ADM-13 | Assign the published lesson. | The right class, release and dates. | RUN | P0 | **BLOCKED** by B3. | **PASS**: assigned to Kelas 1A with both tests, the window in WIB (S18). |
| ADM-14 | Pre-test and post-test exist. | Created on assignment; never a 404 (D-008). | AUTO | P0 | **FAIL** (B4). BOB-04. | **PASS**: both tests are made at upload and opened on assignment (S15c, S18); no 404 by construction (BOB04-K01). |
| ADM-15 | A student completes the journey. | Pre-test → lesson → post-test → result. | AUTO · RUN | P0 | **BLOCKED** | **PASS**: on staging: pre-test → every lesson → post-test → result, by clicking, for five students (run 12, J08–J13). |
| ADM-16 | The school report. | Reachable by clicking, with correct figures. | RUN | P0 | **FAIL** (B6b). BOB-06, DAISY-07. | **PASS**: Konfigurasi → Laporan opens the school summary and each Kelas's summary by clicking (DAISY-07-LAPORAN-02, against the seeded school, CI #197 and #199 (26/26)); the figures are BOB-06's standard reports. |
| ADM-17 | Report templates. | Compose from approved metrics; cannot change their meaning. | RUN | P2 | **N-T** | **N-T** (unchanged) |
| ADM-18 | Certificates. | Template and revocation; numbers never collide. | RUN · CODE | P1 | **N-T**: collision risk (N8). | **N-T** (unchanged) |
| ADM-19 | Transfer a student. | Governed request → authorize → execute. | RUN | P2 | **N-T** | **PASS**: «Pindah kelas» moves a learner; what they did stays with the old class (M9, S25). |
| ADM-20 | Audit trail. | Consequential actions leave a trace. | CODE | P0 | **PASS**: audit rows written for every production action so far (live database). | **PASS** (unchanged) |
| ADM-21 | Year rollover. | Correct, and history preserved. | RUN | P2 | **N-T**: needs two years. | **PASS**: next year's Tingkat and Kelas are made and the whole class carried forward, one not yet signed in too (S27, runs 36954714221 and 36957344279). One earlier failure (run 36952453693) was not seen again; its cause was not established. |
| ADM-22 | Sign out. | Keluar on every admin screen. | AUTO | P0 | **PARTIAL**: Konfigurasi has it; Pendataan, Aktivasi and Studio do not. DAISY-02. | **PASS**: Keluar on Konfigurasi, Pendataan, Aktivasi and Studio (DAISY-02). |

## 8. System admin / Admin platform

Operate the platform. Today this is Gladys alone (D-001).

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) | Now (38944b5) |
|---|---|---|---|---|---|---|
| SYS-01 | Sign in and land. | Lands on /konfigurasi. | AUTO | P0 | **PARTIAL**: signs in (S1) but lands on /. BOB-06. | **PASS**: lands on /konfigurasi (S1, BOB-06). |
| SYS-02 | Platform state. | Health, environment and schools, within platform scope. | RUN | P1 | **PARTIAL**: Konfigurasi shows system health and environment. | **PARTIAL**: Konfigurasi shows the environment and, on «Jalankan pemeriksaan», «Semua pemeriksaan lolos» (S2, walked). Whether each school's administrator has signed in needs a new cross-school read of sign-in facts: waiting for Yazid. |
| SYS-03 | Create a school. | A product flow, or an explicitly recorded operator path. | CODE | P2 | **N-I**: operator path only, recorded under D-013 (both schools exist). | **PASS**: on staging: a school is founded by one versioned, audited operator step (C1: found-school.yml run 36959472214, «SD Golden School GS-001», audited school.founded with the run); its first administrator is then appointed by the platform operator's screens and signs in by the real email link (run 36959505012). A school's birth on production stays Yazid's approval (M1). |
| SYS-04 | Grant SYSTEM_ADMIN. | Only an active SYSTEM_ADMIN; explicit and audited. | AUTO | P0 | **PASS**: enforced in the database (INV-16 selftests). | **PASS** (unchanged) |
| SYS-05 | Distribute canonical content. | Grant or withdraw; a school sees only what it may use. | RUN | P2 | **PARTIAL**: the form exists; no canonical content exists. | **PARTIAL**: PINTAR's standard chapters distributed to a school show on «Siapkan materi» as «Materi sekolah» (M6, S26d). A PINTAR chapter end to end waits on the D-029 question. |
| SYS-06 | Platform-only controls. | Restricted and audited. | AUTO | P1 | **N-T**: in a live flow (selftests cover it). | **N-T** (unchanged) |
| SYS-07 | Audit and feature flags. | Discoverable. | RUN | P1 | **PARTIAL**: Konfigurasi has audit and flags sections. | **PARTIAL** (unchanged) |
| SYS-08 | Succession. | A second SYSTEM_ADMIN before 2027-09-23. | PROD | P1 | **FAIL**: one admin only. Action for Yazid and Gladys after onboarding. | **FAIL** (unchanged) |
| SYS-09 | Sign out. | Keluar present. | AUTO | P0 | **PASS**: on Konfigurasi. | **PASS** (unchanged) |

## 9. Anonymous visitor and certificate verifier

What a stranger can see and do, and what they must never learn.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) | Now (38944b5) |
|---|---|---|---|---|---|---|
| PUB-01 | Open /masuk as a stranger. | The page, logo and fonts load. | AUTO · PROD | P0 | **PASS**: F01-R08; front-door check this morning (run 35935767367). | **PASS** (unchanged) |
| PUB-02 | Try to sign up. | Refused; no alternate path. | AUTO · PROD | P0 | **PASS**: disable_signup verified at deploy; harness probe P2. | **PASS** (unchanged) |
| PUB-03 | Open a valid certificate token. | The status word first, then only the bounded facts. | AUTO | P1 | **PASS** (AUTO): selftests F04. No production certificate exists yet. | **PASS** (unchanged) |
| PUB-04 | Open a random token. | A privacy-preserving not-found; no existence oracle. | AUTO · PROD | P0 | **PASS**: F01-R07 in CI; harness probe P1. | **PASS** (unchanged) |
| PUB-05 | Eligible but not issued. | No QR, link or number exposed. | AUTO | P1 | **PASS** (AUTO): selftests. | **PASS** (unchanged) |
| PUB-06 | Look for leaks. | No signature, key version, answers or account data. | AUTO · CODE | P0 | **PASS**: assert_public_surface; five-field response. | **PASS** (unchanged) |
| PUB-07 | An unknown page. | PINTAR's own localized not-found, not a framework page. | AUTO | P0 | **FAIL**: Next.js default English 404 (harness probe P3). DAISY-04. | **PASS**: PINTAR's own localized not-found (P3, DAISY-04). |

## 10. The cross-role scenario — the check that decides go-live

One lesson, end to end, through the app (D-005). Run it last, after the role journeys.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) | Now (38944b5) |
|---|---|---|---|---|---|---|
| X-01 | The admin prepares the school. | Structure, staff, students and roles, with no SQL or typed addresses. | AUTO · RUN | P0 | **FAIL**: structure needs SQL (B1). | **PASS**: structure, staff roles, cards and intake without SQL (S3-S12); a place that is not a Kelas or Tingkat and a staff row are refused at intake with reasons (BOB-01, BOB-10); a school admin sees and names their own staff and finds a newly recorded teacher in their own waiting list (BOB-20, D-048), and grants only to a person with a relationship with that school (BOB-21, D-049: F10-G01, G02). A teacher moving from another school waits for the staff-link workflow (backlog, D-049); the platform admin's grant covers it meanwhile. |
| X-02 | Get a lesson into PINTAR. | The import succeeds, with problems per row. | AUTO · RUN | P0 | **FAIL** (B2). | **PASS**: the workbook upload (S14) and the real SD 5 Bab 1 whole (S15c). |
| X-03 | Review and freeze. | The four-eyes rule holds; the lifecycle is truthful. | AUTO · RUN | P0 | **BLOCKED** | **PASS**: review and lock by a second person, the author never offered them (S17). |
| X-04 | Publish. | Admin publishes ready content only. | AUTO · RUN | P0 | **FAIL** (B3). | **PASS**: refused until the content check's findings were reviewed, then published (S17). |
| X-05 | Assign. | The right class; the eligible learner sees it and the ineligible one does not. | AUTO · RUN | P0 | **BLOCKED** | **PASS**: the class is assigned and the eligible learners see it (S18, S19); a learner moved out of the class before a chapter was given to it finds no such chapter on her home and its address is refused to her (S26d2). |
| X-06 | Pre-test. | Orientation → start → answers → truthful finish. | AUTO · RUN | P0 | **FAIL** (B4). | **PASS**: on staging: orientation → the press → 4 answers → FINALIZED at the planned score (run 12, J08; J13 for four more). |
| X-07 | Lesson. | The material loads and progress persists. | RUN | P0 | **BLOCKED** | **PARTIAL**: the text material loads and progress persists (runs 14-16, J09), and the save loop is gone (BOB-23); media out of scope for the first testing phases (D-050). |
| X-08 | Post-test. | Exists and completes. | AUTO · RUN | P0 | **FAIL** (B4). | **PASS**: on staging: the post-test is offered by a link and completes for five students (run 12, J10, J11, J13). |
| X-09 | Result and certificate state. | Clear and honest. | RUN | P0 | **BLOCKED** | **PARTIAL**: the result is clear and honest, and says «Target tercapai» or «Belum mencapai target» against the school's sealed mark (M3, W4: S21, S21d; staging J12). The certificate state needs official evidence from a real school and BOB-50, held for the joint landing (D-082(d)). |
| X-10 | The educator reads evidence. | Visible, without judgment. | RUN | P0 | **BLOCKED** | **PASS**: the teacher sees who has handed in, without judgment (staging J14; audit S22 «5 / 5»), and the class figures from official evidence equal the plan (audit #52, S22, D-064). Staging stays synthetic by design. |
| X-11 | The head of department reviews signals. | Observations stay observations. | RUN | P1 | **BLOCKED** | **N-T**: unblocked; not yet walked. |
| X-12 | Dean and admin read reports. | The right scope, carrying their standing. | RUN | P0 | **FAIL** (B6). | **PASS**: the dean (Pimpinan) and the school admin (Konfigurasi → Laporan) each reach the reports of their own scope by clicking, and a figure they may not read is never linked (DAISY-07-LAPORAN-02, against the seeded school, CI #197 and #199 (26/26)). |
| X-13 | Everyone signs out. | The next person never continues as the last. | AUTO · RUN | P0 | **FAIL** (B5). | **PASS**: one computer, two students: after «Keluar» the next student finds only their own home and the lesson at its first page (S21c, W2); the card idle limit (BOB-05). |

## 11. Capacity — 150 schools, 60,000 students (D-031, D-035)

Run on the staging project (D-036) with production's compute tier, never on production. Rows marked Onboarding block registrations beyond that point until they pass: 1,000 students by 1 Nov, 5,000 by 1 Dec.

| ID | Checkpoint | Expected | How | Gate | Baseline (main 78b0f55) | Now (38944b5) |
|---|---|---|---|---|---|---|
| CAP-01 | The 1 Nov morning: 1,000 students sign in with class cards within 10 minutes (L1, D-035). | Every valid card gets in; a refusal for load says so plainly, never 'wrong card or PIN'; no student is locked out by another school's traffic. | LOAD | P0 | **N-T**: no load harness or staging project yet (C-06). Risk found at review: sign-in and session refresh reach Supabase Auth from PINTAR's server, so all students share that address's limit (bursts of 30), and the card screen reports a 429 as a wrong PIN. BOB-12. | **N-T** (unchanged) |
| CAP-02 | The 1 Nov cohort (1,000 students) sits a synchronized assessment (L1): start, answer, change answers, sync, lose and regain the network, submit, results, teachers open reports. | No answer lost or duplicated; server errors < 0.1%; answer save p95 < 1 s, p99 < 3 s; no pool exhaustion. | LOAD | P0 | **N-T**: needs BOB-04 (the assessment exists) and C-06. | **FAIL**: on staging: L1 NOT MET (perf-l1.yml run 36964437916, 1,000 synthetic learners in 16 shards, sessions made ahead). 0 answers lost, 0 duplicated, every finished sitting has its result; but answer save p95 11,664 ms (limit 1 s) and p99 29,660 ms (limit 3 s); server errors 73 of 54,812 calls = 0.133% (limit 0.1%), 504s while waiting for a database connection (PostgREST PGRST003: the pool was exhausted); 996 of 1,000 finished (4 refused PR006 after a failed save the harness does not resend). The database's CPU reached 98%; the assistance poll is 36% of calls. The 10-learner trial before it was clean (run 36963146820). Staging is not production's tier (CAP-08); the card sign-in wave (CAP-01) and teachers' reports during the wave were not part of this run. AT 50 AT ONCE (the initial-testing limit, D-089(d); the efficiency audit, docs/reports/PINTAR-4.0-EFFICIENCY-AUDIT-2026-10-02.md): three synchronized runs on the same Micro, every learner sat and handed in, 0 answers lost or duplicated, every result present, 0 server errors, no pool timeout, the database's CPU at most 18%. Through the RPC journey D-031 is met (run 36969517374 before the changes: save p95 327 ms; run 36982765324 after: 289 ms). Through the real app in Chromium (run 36979562623) the save p95 is 1,366 ms from GitHub's US runners (limit 1 s; 1,830 ms with 4 learners, the database at 3%): not met as measured; not measured from where learners are. CAP-02 (1,000) stays FAIL. |
| CAP-03 | The 1 Dec cohort at once (L2: 5,000 students, 10 schools). | The D-031 pass criteria hold. | LOAD | Onboarding: 1 Dec | **N-T** | **N-T** (unchanged) |
| CAP-04 | L3: 10,000 students at once. | The D-031 pass criteria hold. | LOAD | Onboarding: >5,000 students | **N-T** | **N-T** (unchanged) |
| CAP-05 | L4: 20,000 students at once. | The D-031 pass criteria hold. | LOAD | Onboarding: >10,000 students | **N-T** | **N-T** (unchanged) |
| CAP-06 | L5: 60,000 students at once (150 schools). | Where PINTAR degrades is found and recorded, with the fix or tier that moves it. | LOAD | Onboarding: >20,000 students | **N-T** | **N-T** (unchanged) |
| CAP-07 | Recovery after each spike. | The database returns to its baseline within 10 minutes; queued answers sync; nobody is signed out by the spike. | LOAD | P0 | **N-T** | **PARTIAL**: after the 1,000-learner wave the database was back at its baseline in 194 s (limit 10 minutes; CPU 98% → about 1%, backends 34 → 24; run 36964437916). Queued answers syncing after the spike and nobody being signed out were not measured: the harness does not run the player's outbox, and sessions were made ahead. At 50: back at baseline in 89 s (RPC, before the changes) and 25 s (the real app). The RPC run after the changes (36982765324) reads 'not seen': the CPU was back at idle, but PostgREST kept 5 connections opened during the wave, idle, and the harness's rule counts connections (recorded as read; the rule counting idle pooled connections is noted for the owner). |
| CAP-08 | Where the load runs. | A staging Supabase project on production's compute tier; never production (D-013). | CODE · PROD | P0 | **N-I**: no staging project yet (Yazid; C-06, C-07, D-036). | **PARTIAL**: staging (pintar-staging) and production are both on Micro (60 connections, 1 GB, 2 shared cores; staging read 2 Oct). The L1 run on staging's Micro failed D-031 at 1,000 learners (run 36964437916). The tier is a pre-production capacity decision, made on capacity testing before production; the upgrade follows a successful result (D-089). Initial testing is held to 50 people at once. |
| CAP-09 | Hot paths are index-backed. | pg_stat_statements and the Performance Advisor show no unindexed or per-row query on sign-in, assessment write, learner home or teacher class view (README gate rule 9). | CODE · LOAD | P1 | **N-T** (BOB-13). | **N-T** (unchanged) |
| CAP-10 | Lists that grow with schools. | Konfigurasi and Pendataan lists page; nothing loads every person at once (M14). | RUN · CODE | Onboarding: >10 schools | **N-I** (BOB-13). | **N-I** (unchanged) |

## 12. Universal checks (every flow)

| ID | Check | Gate | Baseline | Now (38944b5) |
|---|---|---|---|---|
| U-NAV | Navigation: every intended screen is reachable by clicking. | P0 | **FAIL**: Aktivasi, Studio and Pimpinan are unlinked (M3, M15). | **PASS**: Aktivasi, Studio, Pimpinan (S2, DAISY-03, DAISY-11) and now the report pages (DAISY-07) are reached by clicking. |
| U-AUTH | Authorization: a direct address outside role or scope fails closed; navigation is never the security boundary. | P0 | **PASS**: every destination refuses server-side (gate review of DAISY-02/03); RLS everywhere. | **PASS** (unchanged) |
| U-TRUTH | Truthfulness: success means a real change happened. | P0 | **FAIL**: Studio upload shows a reference code and creates nothing (S14). PASS for structure and activation (selftests). | **PASS**: the upload creates what it says (S14); publishing refuses until ready (S17). |
| U-LOC | Language: no raw database or framework English text; ID and EN are equivalent. | P0 | **FAIL**: raw errors (M7); English 404 (P3). BOB-07, DAISY-04. | **PASS**: every server action and route answers with a code, never the database's words (BOB-07: BOB07-K01 walks src/app, K02 the content refusals, R01 live); release blockers are codes (BOB-17) read in plain words in both languages, an unknown one as a general line with a reference (DAISY-16: DAISY-16-HAMBATAN-01, audit #32 S17); PINTAR's own localized 404 (P3). |
| U-EMPTY | Empty states: 'not yet' is never shown as failure, and absence is never shown as a finding. | P1 | **PARTIAL**: the '(0/5)' cards promise figures (DAISY-07). | **PARTIAL** (unchanged) |
| U-DEVICE | Phone, touch and shared device: usable at 320px; Keluar everywhere; idle timeout for class cards. | P0 | **FAIL** (B5). DAISY-02, BOB-05. | **PASS**: crawl A opens every page it reaches for 14 roles at 320 px and fails on any page wider than the window. 34 pages failed first (Konfigurasi, three Studio forms, the report pages); after the fix none (0 of 269 locally; the CI crawl green, run 36952453693). Keluar everywhere (DAISY-02); the card idle limit (BOB-05). |
| U-CONTEXT | The school, class or department is visible before any consequential action. | P0 | **PARTIAL**: yes on /mengajar; Studio defaults to the wrong school (M8). | **PASS**: the school is shown and preselected in Studio (S14); class, school and year on /mengajar (S13). |
| U-AUDIT | Consequential actions leave a trace. | P0 | **PASS** (live database). | **PASS** (unchanged) |
| U-PRIV | Privacy: no existence oracle; no keys or integrity internals for learners; no learner full name on shared screens (D-020). | P0 | **PARTIAL**: the greeting uses the full name; the staff strip could name a learner (caught at the gate, DAISY-02). | **PASS**: no learner full name on / or /belajar (DAISY-10-SAPA-02); no existence oracle (P1). |
| U-RECOVER | Recovery without SQL where the product claims self-service. | P1 | **FAIL**: account corrections (M6). | **FAIL**: account corrections (finding M6 of 24 Sep). Since v2.2: a platform-admin name correction, audited, comes with BOB-26 (correct_person_name, D-077), held for the joint landing; password recovery is Gates 4 and 5 (BOB-27, BOB-28). BOB-26's guard refuses any password write without PINTAR's permit, so recovery runs only through PINTAR. |
| U-ERR | Error pages are PINTAR's own and show a reference, never a stack trace. | P0 | **FAIL**: framework defaults (P3). DAISY-04. | **PASS**: PINTAR's own error and not-found pages with a reference (DAISY-04). |
| U-PERF | Responsiveness on staging: sign-in acknowledges at once and reaches a usable first screen in 3 s or less (gate: under 5 s); a typical menu click takes 1.5 s or less, and 95% take under 3 s; no timeout or error with 30 active staff sessions for 10 minutes; no pathological repeated requests (request counts recorded); auth, RLS and permission decisions unchanged. A click that saves is acknowledged at once and cannot be submitted twice; representative writes are timed. | P0 | **NOT VERIFIED** (added 27 Sep, D-046). | **PASS** (again): the lesson page's save loop is gone since BOB-23 (accepted on staging run 14; runs 15 and 16: nothing in the second idle window, J09). The rest stands from 28 Sep, after BOB-18: the page usable 1.0-3.3 s after sign-in, clicks median 1.16 s and all under 3 s (run 36359917724); 30 sessions for 10 minutes, 2,429 clicks, 0 failed, click p95 1.2-1.5 s (run 36361820806); a menu click answers within 100 ms (DAISY-18). Those runs did not hold a lesson page open; BOB-23's acceptance covers that page. |

## 13. Release-day checks (production, read-only)

Run after the migrations and the deploy of the release candidate. None of them writes to production.

| ID | Check | Gate | At baseline | Now (38944b5) |
|---|---|---|---|---|
| REL-01 | CI is green on the exact release commit, strict selftest included. | P0 | **PASS** for the live release 5b5b68d (run 35850275026). | **PASS** for main 8dd506a's code: each batch reached main only after CI and the browser walk were green on its head (batch 6: CI 36947657438, walk 36947660368). |
| REL-02 | The audit journeys pass on the release candidate with zero operator (SQL) steps, and every P0 flow check above is PASS. | P0 | **FAIL**: on main 78b0f55 (this baseline). | **FAIL**: not every P0 check passes yet (see the summary). |
| REL-03 | Migrations are applied to production before the app, in order; the count equals the repository's. | P0 | **PASS** for the live release: production 111 = release 5b5b68d. main has 112 (BOB-01), applied with the sprint 1 release. | **PASS** for the live release (production 111 = 5b5b68d). main and staging carry 143 (environment facts run 36949805301); the branch carries 145. |
| REL-04 | Launch readiness is 17/17, and every assert_* passes (including the evaluation boundary, canonical tenants and official bootstrap). | P0 | **PASS**: this morning, on production. | **PASS** (unchanged) |
| REL-05 | Every functional step of the deploy is green: front door, closed verification 404, activation refusal, Auth boundary. | P0 | **PASS**: deploy 013. | **PASS** (unchanged) |
| REL-06 | The external front-door check says FRONT DOOR OK. | P0 | **PASS**: run 35935767367. | **PASS** (unchanged) |
| REL-07 | Auth: sign-up disabled; site_url is the origin; a single callback. | P0 | **PASS** (deploy 013 read-back). | **PASS** (unchanged), read again 30 Sep (identity-facts run 36653019569): sign-up disabled on both projects; site_url is each project's origin (https://staging.pintarselalu.com, https://app.pintarselalu.com); one callback each (<origin>/auth/callback*). |
| REL-08 | Authentication email and settings (restated 30 Sep, D-065; the 24 Sep wording tested Supabase's default-email path, which D-057 retired). (i) Sending, capacity and deliverability: every identity email (activation code, resend, recovery, password changed, Digital Card, security notices) goes through PINTAR's own sender path (BOB-25) with its per-address and global limits enforced and a refused send reported as not sent; the mail host's hourly capacity is recorded; production mail from that path passes SPF, DKIM and DMARC. Supabase's own email limit governs only the break-glass fallback. Evidence: BOB-25's gate tests (limits and refusals, red then green) and its staging send; at Gate 8, a send from production through the same path to the M6 inboxes, whose received headers show SPF, DKIM and DMARC = PASS; the domain's published records (identity-facts.yml, DNS job); the host's plan and hourly limit from the host's own record (M1). (ii) Settings: the Gate 3 password policy (BOB-26) with the leaked-password check on; a direct password change needs the current password; TOTP enrolment off; email codes 6 digits, valid 10 minutes. The policy must not prevent PINTAR's existing class-card credential mechanism from creating or authenticating card accounts; that mechanism is not changed here. Evidence: the settings read back by identity-facts.yml (staging; production from main), which proves these Supabase settings only; class-card compatibility by Supabase's actual behaviour on staging once the Gate 3 policy is set (a new card made and signed in, an existing card signed in), observed rather than assumed, including whether admin-created credentials are subject to the policy. (iii) Templates: Supabase's own templates carry a minimal Bahasa Indonesia break-glass fallback; the emails people receive are PINTAR's. Evidence: the approved fallback texts, reviewed in the repository; identity-facts.yml showing each deployed template custom and with the approved file's hash (which proves it is the approved file, not its language); PINTAR's own emails as received from the (i) sends. Production settings change only at Gate 8, with Yazid's approval (D-039). | P0 | **NOT VERIFIED**: Yazid, in the Supabase dashboard (against the 24 Sep wording). | **N-I**: , in progress, on the restated check (Gates 2E, 3 and 8). (i) PINTAR's own sender path, BOB-25, is on main and staging. Its staging proof send is not yet made: the first attempt answered 503 NILAI_TIDAK_SAH for PINTAR_SMTP_HOST; the value was corrected and redeployed (1 Oct); the send log has no row yet. BOB-51 gives the platform admin a button for this proof. Supabase's own path: its SMTP password was stale on both projects (535, 30 Sep 19:05 WIB). Staging is fixed (1 Oct); production is unconfirmed. (ii) Gate 3's settings come with BOB-26 (gated, held for the joint landing) from one file, supabase/auth-identitas.json: codes of 6 digits valid 10 minutes; passwords of at least 8 with no required kinds and the leaked-password check (D-082(a)); current password and reauthentication required; TOTP enrolment off. staging.yml writes and reads them back; identity-facts.yml compares them. (iii) The code and card emails are DAISY-20's on DAISY-19's frame (joint landing); Supabase's own templates stay the break-glass fallback. |
| REL-09 | Before the first production class card or certificate is issued, the intended production CARD_PEPPER and CERT_SECRET_KEY_V1 are set and verified offline recovery copies exist (D-066). CARD_PEPPER is never changed once cards exist, except through an explicit reissuance procedure; when a newer certificate key version is introduced, the earlier versions' verification material is kept. | P0 | **NOT VERIFIED**: Yazid. | **NOT VERIFIED**: Yazid (board C-11), before the first production card or certificate (D-066). Production has 0 cards today, so nothing is yet bound to the current values. |
| REL-10 | A rollback point is recorded and the release is logged in RELEASES.md. | P0 | **PASS** for 5b5b68d (rollback c358f58). | **PASS** (unchanged) |
| REL-11 | No test data exists in production; production data changed only through audited steps (D-013, D-017). | P0 | **PASS**: 1 person, 1 account, 2 schools, all recorded. | **PASS** (unchanged) |
| REL-13 | Support is live before 1 Nov: 'Laporkan masalah' works for staff; tier 1 (school admins, Gladys's team) and tier 2 (coordinator) are named; a report that stops a class is answered the same school day (D-037). | P0 (1 Nov) | **N-I**: BOB-15, DAISY-12; interim form for staging tests (C-07). | **N-I** (unchanged) |
| REL-12 | After go-live and onboarding, Gladys walks X-01…X-13 on production with real data and signs off. | P0 (post-deploy) | **N/A**: until the sprint 1 release. | **N/A** (unchanged) |

## 14. Known findings and where they are fixed

| Ref | Finding | Fix | State |
|---|---|---|---|
| B1 | No screen for classes | BOB-01; DAISY-05 | FIXED (S7) |
| B2 | Lesson upload does not work | BOB-02; DAISY-06 upload half | FIXED (S14, S15c) |
| B3 | No release or publish path | BOB-03; DAISY-06 Terbit step | FIXED on the candidate (S17) |
| B4 | Pre-test and post-test never created | BOB-04 | FIXED: made at upload, opened on assignment (S18, S19); answering not yet driven |
| B5 | No sign-out | DAISY-02; BOB-05 | FIXED on the candidate (Keluar everywhere; this device only; card idle 60 min) |
| B6 | Reports unreachable or empty | (a) D-003; (b)(c) BOB-06; DAISY-07 | FIXED on main: standard reports and class figures (BOB-06), one click away (DAISY-07) |
| M4 | Everyone lands on the generic page | BOB-06 | FIXED on the candidate (S1, S5, S11, S13, S16) |
| M8 | Studio defaults to the national library | DAISY-06; D-029 | FIXED (S14, S15b) |
| M9 | Lesson media do not play | BOB-11 | OPEN |
| M10 | Assignment window shifted by 7 hours | DAISY-14 | FIXED (S18; DAISY-14-TANGGAL-01) |
| M11 | Unlabelled lifecycle steps | DAISY-06 Terbit step | FIXED on the candidate (S17) |
| M5 | Intake traps | BOB-01 (fixed part); BOB-10 | OPEN: a school-level place (S8), staff rows |
| M7 | Raw English errors | DAISY-04 (pages); BOB-07 (actions, routes); BOB-17 and DAISY-16 (release blockers) | PARTLY FIXED: pages, and every action and route answers with a code (BOB07-K01); the release blockers are left |
| GS-1 | A number typed in a text column (an option like 78.145) becomes a number in Excel or Google Sheets; Google Sheets also stores whole numbers as N.0 | BOB-16 (reader); DAISY-15 (template columns as Text) | FIXED (BOB-16 reader; DAISY-15 template; Google Sheets round trip, 27 Sep) |
| Capacity | Card sign-in shares the server's Auth limit; a 429 reads as a wrong PIN | BOB-12 (contract published 25 Sep); DAISY-13 | OPEN, before 1 Nov |
| M1–M15, N2–N15 | The rest of the audit report | BOARD backlog and tickets | OPEN unless listed above |
| D-006 scopes (2 Oct) | Peran & akses offers every place as a role scope, the hidden «Jenjang» and «Reguler» levels included, labelled "School · place" in alphabetical order, so the school itself comes last. Given «Dekan» at the first "SD Zayd…" entry, the dean was scoped to «Jenjang» and Pimpinan named it (audit S23d). | The scope list shows the school first by its own name, then Bagian, Tingkat and Kelas; no hidden level (D-006). | FIXED in batch 7 (D006-K01; walked green in S23d) |
| J6.14 players (2 Oct) | After «EN» the lesson still read «Halaman 1/3» and the test «Simpan jawaban ini»: the lesson and question players asked for their words with no language (audit S21g). | Every learner screen switches between ID and EN; the school's content is never translated (J6.14, STU-20). | FIXED in batch 7 (J614-K01; walked green in S21g) |

## 15. Run record (kept for every run, in RELEASES.md)

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

## 16. Completion rule

A role is complete only when a person can enter through the intended door, find the next action, finish the consequential work, receive a truthful outcome, recover or be refused safely, and sign out — without SQL, typed addresses, developer help or knowledge of PINTAR's internals.

Go-live rule: every P0 check is PASS on the release candidate and in the release-day checks; every P1 check is PASS or accepted by Yazid in DECISIONS.md; P2 checks are on the board.

The acceptance scenario, in order: set up a school → add classes and people → import, review and publish a lesson → assign it → a learner completes the pre-test, lesson and post-test → the learner sees the result and certificate state → the educator, head of department and management see the evidence → everyone signs out safely.

## Appendix A — sources

- docs/coordination/DECISIONS.md: D-001…D-037 (canonical; overrides older specs where they differ, e.g. landings D-010).
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
- New section: capacity (D-031), 150 schools and 60,000 students, with load levels L1–L5 that gate onboarding.

## Appendix C — what changed in v2.1, v2.2 and v2.3

- A 'Now' column beside every baseline, re-marked on 25 Sep against the Integration 8 candidate (7bbbd23): DAISY-06's Terbit step, BOB-05 and BOB-06 on top of main be34191.
- The audit journey now carries D-005 end to end: S14 the workbook upload as Gladys does it; S17 the real SD 5 Bab 1 taken to Terbit by two people, with the content check's findings reviewed first; S18 the teacher assigns it; S19 the student reaches the pre-test.
- Checks unblocked by BOB-03 and BOB-04 are N-T until the audit answers the tests; they no longer read BLOCKED.
- New findings: M10 is live. Siapkan reads the teacher's days as UTC, so an assignment opens at 07:00 WIB and closes at 06:59 WIB the day after its last (S18). DAISY-14.
- Counts: the summary counts the Now column; the baseline's counts stay beside it.
- Re-marked on 25 Sep against Integration 9 on main (1e46714): DAISY-14 fixes M10 (the assignment window is the school's calendar day: EDU-06, STU-05, ADM-13; S18), BOB-07 answers every action and route with a code (U-LOC moves; the release blockers are left for BOB-17 and DAISY-16), and BOB-16 reads a Google Sheets workbook as its author saw it, now in CI.
- Re-marked on 27 Sep against Integration 10 on main (6074833): DAISY-07 puts the reports one click away (DEA-03, ADM-16, X-12, HOD-09 and U-NAV now PASS), DAISY-15 keeps typed text as text in the template (GS-1: Google Sheets' round trip left), Daisy reworded BOB-07's 26 messages, and BOB-08 closes the structure's side doors (no direct writes, nobody placed in a deactivated place, a year near now, the library not a school).
- 27 Sep: Yazid's Google Sheets round trip on the new template passes (78.145 and 007 stay text); GS-1 is fixed.
- 27 Sep: U-PERF added as a must-pass check (D-046): responsive is part of PASS. It FAILs on today's evidence; BOB-18 is next for Bob.
- Re-marked on 28 Sep against Integration 11 on main (b24a95b): BOB-18 removes the unnecessary work behind the slow pages (the schema lint on every Konfigurasi load, 16 permission calls per Studio click, repeated reads) and refuses a duplicate grant in the database; BOB-09's pickers offer only Bagian, Tingkat and Kelas, by path (ADM-07 still PARTIAL for BOB-10); DAISY-17 acknowledges every save at once and saves it once. U-PERF waits for its measurement on staging.
- 28 Sep: U-PERF passes: one session and 30 sessions for 10 minutes on staging after BOB-18, with no error.
- Re-marked on 28 Sep against Integration 12 on main (f48da56): the intake refuses staff rows with a reason (BOB-10; ADM-07 PASS), lesson media play for learners and in Studio's preview (BOB-11; STU-11 and ADM-10 wait only for the walk on staging), every click and save says it was heard (DAISY-18), and the health card judges by F01-T13's own list (BOB-19).
- Re-marked on 28 Sep against Integration 13 (15bfc99): release blockers are codes read in plain words (BOB-17, DAISY-16; U-LOC PASS); the audit ran clean for the first time (27 PASS, 1 NOTE, 0 FAIL), Studio to the student's pre-test included.
- Re-marked on 28 Sep against Integration 14 (c2e8e4b): a school admin sees and names their own staff (BOB-20, D-048); audit clean again.
- Re-marked on 28 Sep against Integration 15 (9062cbe): a school admin grants only to a person with a relationship with that school (BOB-21, D-049); X-01 PASS; audit clean again.
- 28 Sep (D-050, D-052): the first testing phases cover lessons and multiple-choice questions, not video, audio or presentations; STU-11's media half and ADM-10's playback are out of scope for it and stay unresolved, never PASS.
- Re-marked on 28 Sep against main 1f3b0f1 (BOB-22, LANA-01) with the D-050 staging journey (runs 7, 11, 12): the student's path from pre-test through every lesson to post-test and result passes by clicking; U-PERF back to FAIL on the lesson page's save loop (BOB-23).
- 30 Sep (D-065, D-066): REL-08 restated to the PINTAR-controlled authentication email (D-057) and verified by the coordinator through the read-only identity-facts.yml, not a dashboard look; REL-09 now says when the copies must exist (before the first production card or certificate) and that neither secret may be lost or silently replaced.
- 30 Sep (Yazid, on the coordinator's review): REL-08 corrected: class cards must stay creatable and usable under the Gate 3 policy; each clause names evidence that can prove it (the settings read proves settings only); production deliverability (SPF, DKIM, DMARC on PINTAR's sender path) added to (i); REL-07's facts moved to REL-07.
- 30 Sep, v2.2: re-marked on main daa5721. EDU-12 and X-10 PASS on the audit stack (D-064, audit #52); U-PERF PASS again (BOB-23); EDU-07 FAIL (P1) on the Uji Cepat that never ends (BOB-42, D-067); EDU-08 PASS (run 15).
- 1 Oct, v2.3: status on main 28d3015 (BOB-25, DAISY-19, BOB-42). No P0 status changes. EDU-07 FAIL → PARTIAL (P1), fixed by BOB-42 and awaiting the staging walk; REL-01, REL-03 and REL-08 updated; notes on X-09, ADM-05 and U-RECOVER for D-076 to D-082 and the gated BOB-26, BOB-50 and DAISY-20.
- 2 Oct, v2.4: status on main 8dd506a (staging walk 008 green) with the branch's walks. P0 PASS 63 → 67: EDU-04, STU-09, X-13 and U-DEVICE (320 px now a crawl gate); DEA-02 N-T → PARTIAL. P1/P2 to PASS: ADM-02, EDU-02, EDU-07 (T2 on staging), ADM-19; SYS-03 built (C1). New finding: Peran & akses offers D-006's hidden levels as role scopes (ADM-05, ADM-06, DEA-02 stay PARTIAL until fixed). ADM-21 regressed in the latest run, under diagnosis. The checklist stays engineering detail since D-084; readiness is the journey status.
- 2 Oct, v2.5: status on main 38944b5 (batch 7). P0 PASS 67 → 76: ADM-05 (D-006 fixed), DEA-02, HOD-02, HOD-03, HOD-04, STU-07, STU-19, X-05, EDU-09 (staging walk 009). P1/P2 to PASS: ADM-06, STU-20 (after the J6.14 player fix), ADM-21, SYS-03 (the first Golden School). Findings: D-006 scopes fixed; a new one, the players' language (J6.14), found and fixed in the same batch.
- 2 Oct, v2.5, later: the L1 load on staging (run 36964437916, 1,000 synthetic learners). CAP-02 N-T → FAIL (no answer lost or duplicated, but answer save p95 11.7 s, p99 29.7 s, server errors 0.133%, the connection pool exhausted); CAP-07 N-T → PARTIAL (the database back at baseline in 194 s). P0 PASS stays 76.
- 2 Oct, v2.5, D-089: the L1 result stands as evidence that Micro does not meet D-031 at 1,000 synchronized students; no rerun now; staging and production stay on Micro; CAP-08 is decided before production on capacity testing; initial testing held to 50 people at once.
- 2 Oct, v2.5, later: 50 at once on Micro (D-089(d)). The draw reads its marks by index (start: -24% time, -52% buffers, measured) and the player never has two assistance checks in flight. Three runs at 50: safe (no loss, no duplicate, no error, the database at most 18% CPU); D-031's save p95 met through the RPC journey (289 ms) and not through the real app measured from the US (1,366 ms). CAP-02 stays FAIL (1,000), CAP-07 PARTIAL. P0 PASS stays 76.
