# PINTAR 4.0: journey coverage cross-check

**1 October 2026.** A read-only cross-check of every item in the Human Journey & Reality Scenario Catalogue (`PINTAR-4.0-HUMAN-JOURNEY-AND-REALITY-SCENARIO-CATALOGUE-2026-10-01.md`, kept unchanged beside this file). Each item is checked against two things:
- the Phase 1 scope inventory (`PINTAR-4.0-SCOPE-INVENTORY.md`);
- `main` `28d3015` as a person would experience it.

- **It changes nothing.** This is not an audit, a rewrite or implementation work. No code, ticket, inventory line or canonical document was changed, and the catalogue was not reworded to fit the code.
- **Method:**
  - The coordinator classified each item's scope against the inventory and its sources.
  - Five read-only agents traced the implementation in the code, which is identical to `main` `28d3015`.
  - The only click evidence on `main`'s code is audit #55 job B. Code existence never counts as connection.
- **Scope classes:**
  - **SUPPORTED:** current 4.0 scope covers it, with its source.
  - **MISSING REQUIREMENT:** a human journey needs it, but no source establishes it. Yazid rules.
  - **ENHANCEMENT / LATER:** useful, but not needed for agreed 4.0.
- **Implementation classes:**
  - **CONNECTED:** the path exists, and a person went through it by clicking on `main`'s code. That happened only in audit #55 job B, on a local stack with a school born by SQL, so it is still **not** JOURNEY-PROVEN.
  - **PARTIAL:** part of the path works; a piece is missing or reached only by a shortcut.
  - **DISCONNECTED:** the pieces exist, but a person cannot get from one to the next.
  - **MISSING:** not on `main`.
  - **WRONG:** behaves against the human intent or an agreed rule.
  - **UNPROVEN:** appears to exist, but there is no evidence that a person can complete it.

---

## 1. Verdict

- **The inventory does not yet survive contact with ordinary human behaviour in full.**
  - 194 of 226 rows (222 items, plus 4 "what happens next" rows) are covered by existing 4.0 scope.
  - **24 rows, in eight groups, are human journeys that no existing source establishes** (M3–M10 below). They need Yazid's rulings before the inventory is approved.
  - Eight rows are enhancements.
- **Recommendation on O1:** hold the inventory approval, as ChatGPT advised.
  1. Yazid rules on M3–M10 (and the open M1 and M2): include, defer, or out.
  2. The coordinator folds the rulings into the inventory as new lines, each sourced to its ruling.
  3. Yazid approves the inventory once.

  Phase 1 then exits. None of the rulings is needed to *design* Phase 2's instruments, but the Golden School's spine depends on M3 (what "complete" means at GS-15) and on recovery (GS-21).
- **As built, the human journeys are mostly not connected.** Only **13 of 226** rows are connected by clicking on `main`'s code, and none is proven on a deployed environment. The rest:
  - 83 partial;
  - 59 unproven;
  - 16 disconnected;
  - 47 missing;
  - **8 wrong.**

## 2. Counts

| | Count |
|---|---|
| Scope: SUPPORTED | 194 |
| Scope: MISSING REQUIREMENT | 24 (groups M3–M10) |
| Scope: ENHANCEMENT / LATER | 8 |
| Implementation: CONNECTED | 13 |
| Implementation: PARTIAL | 83 |
| Implementation: UNPROVEN | 59 |
| Implementation: DISCONNECTED | 16 |
| Implementation: MISSING | 47 |
| Implementation: WRONG | 8 |

**Supported rows by implementation:**

| Implementation | Rows |
|---|---|
| CONNECTED | 13 |
| PARTIAL | 75 |
| UNPROVEN | 59 |
| DISCONNECTED | 12 |
| MISSING | 27 |
| WRONG | 8 |

The **27 supported but missing** rows are agreed 4.0 that is not on `main`:
- identity Gates 3–5 (ID-J04 to ID-J17, RS-01);
- card re-issue (ADM-J12, RS-04);
- C1 (OPS-J01, OPS-J02);
- the admin's readiness view (ADM-J02, OPS-J04);
- recovery (ADM-J17, OPS-J10);
- the Uji Cepat score (EDU-J20);
- "started, not finished" (EDU-J24);
- educator-as-learner (MGT-J08, RS-20).

**The 13 connected rows:**
- STU-J13, STU-J14, STU-J15;
- EDU-J14;
- ADM-J01, ADM-J03, ADM-J05;
- ID-J02, ID-J03;
- CNT-J09;
- ASM-J02, ASM-J04;
- CERT-J09.

## 3. New missing requirements: owner rulings (M3–M10)

Each group is something people will certainly do in a school, which no decision, checklist row or identity ruling establishes. M1 and M2 from Phase 1 remain open.

| # | The question for Yazid | Rows | What `main` does today |
|---|---|---|---|
| **M3** | **After the result.** What does "chapter complete" mean for a learner? What follows a low post-test result: review, reinforcement, another attempt? May a teacher assign remediation to selected students and see whether it helped? | STU-J10, STU-J23, RS-08, EDU-J29, EDU-J30 | The post-test does not allow a retry. Any finished post-test reads «Selesai». «Apa berikutnya» can tell a low scorer that everything assigned is done. Nothing records remediation |
| **M4** | **One learner, seen by the teacher.** What may a teacher see about one student in their class (results, answers, who is struggling)? | EDU-J04, EDU-J25, REP-J02 | The teacher's roster is names only. A per-learner record exists only for the head of department and the dean |
| **M5** | **Which questions the class got wrong.** After an Uji Cepat or an assignment, may a teacher see per-question results? EDU-09 today bars teachers from Question Health | EDU-J21, EDU-J26, REP-J04, RS-12 | Teachers have no question-level read. Question Health is for the head of department and the admin, at 30 answers per question |
| **M6** | **Standard content.** How is standard PINTAR content prepared centrally and given to schools in 4.0? | CNT-J01, CNT-J02 | D-029 refuses every import into the national library. The database accepts distributed releases, but Siapkan offers only the school's own. The grant form needs typed internal IDs |
| **M7** | **A whole class's cards.** Issuing (and printing) class cards for a whole class at once | ADM-J11 | One card per press. The PIN is shown once. No print sheet |
| **M8** | **Why didn't my email arrive?** The platform admin is the email-operations owner (D-057(b)), but has no view of sends, refusals and failures, or of stuck activations | OPS-J06, OPS-J09 | Nothing reads `email_send_log`. The sign-in screen says "sent" when the send was throttled |
| **M9** | **A student changes class.** Moving one student between classes within a school mid-term, with history kept | ADM-J13, RS-18 | Not possible. Re-intake is refused; ADM-19's transfer goes to another school |
| **M10** | **Correcting content.** How does a corrected workbook become a revision of the same course, so that new work uses it and evidence stays linked? | EDU-J11, CNT-J11, CNT-J12, CNT-J14, RS-13 | A re-upload makes an unrelated course. «Buat salinan untuk diperbaiki» makes a revision no screen can edit, though its copy promises editing. «Koreksi» never offers it |

## 4. Where the catalogue's intent meets an existing ruling (for Yazid's awareness)

These are classified by the existing ruling. They are surfaced because the catalogue expects something different. Changing any of them is Yazid's call.

- **T1. Students on shared computers** (RS-02, RS-03, STU-J17, ID-J19).
  - **The ruling:** D-009 and C4 keep a class-card session open for 60 idle minutes with no lock. Staff get a 5-minute PIN lock (D-055).
  - **What it means:** a student who walks away leaves their session open. The next student is inside it until someone presses «Bukan akun Anda?».
  - **A related defect, separate from T1:** STU-J18 (§5).
- **T2. Writing new questions on the spot for an Uji Cepat** (EDU-J19, RS-11).
  - **The ruling:** D-007 makes the workbook the only way questions enter.
  - **What it means:** a teacher with one minute can only use questions already in assigned material.
- **T3. Management assigning training to educators** (MGT-J07, EDU-J31, RS-20).
  - **The ruling:** D-069 and D-070 bound 4.0: the school enrols, a facilitator assigns, and the dean reads completion.
- **T4. A photo on the certificate** (CERT-J06). The certificate shows the holder's name only, as designed.

**ENHANCEMENT / LATER** (no source; not needed for agreed 4.0):
- free subject browsing (STU-J03);
- writing questions inside Uji Cepat (EDU-J19);
- a "system health" view for the school (ADM-J18);
- tracking whether an intervention worked (HOD-J08);
- management assigning training (MGT-J07);
- a school changing or leaving PINTAR (OPS-J08);
- generating lessons from source material (CNT-J07);
- report export or print (REP-J12).

## 5. Wrong or defective behaviour found while tracing

These are defects against **existing** scope, not new scope. **No tickets were created.**

Most were found by reading code, not by running it. Each one needs a test that goes red before its fix (Phase 4).

| # | Finding | Rows | Evidence |
|---|---|---|---|
| W1 | A single Uji Cepat requests and can issue a certificate (QUICK certifies; pass mark 0.6), while the Tinjau screen says it does not | EDU-J17, CERT-J02, STU-J25 | `20260914093000:62`; `ItemPlayer.tsx:159,327-331`; `hle.ts:3189` (BOB-50 held) |
| W2 | On a shared device, the lesson position is stored per device, not per person, and Keluar does not clear it. The next student starts there and saves it as their own progress | STU-J18 | `LessonPlayer.tsx:91-98,118-128`; `keluar.ts:16` |
| W3 | A post-test answer chosen without «Simpan jawaban ini» is silently dropped at «Kumpulkan», with no confirmation. A reload returns to question 1 | ASM-J04, ASM-J06 | `ItemPlayer.tsx:161,303-340,409-430` |
| W4 | Results never say whether the target was met (the engine's `lulus` is unused). The chapter reads «Selesai» at any score. /lanjut can tell a low scorer "all done" | STU-J09, STU-J10, REP-J01 | `hasil/page.tsx:72-83`; `siklus.ts:115-117`; `lanjut/page.tsx:131-138` |
| W5 | «Posisi bacaan tersimpan.» is always shown, even when the save failed | BD-06, RS-05 | `pelajaran` page `:88`; `LessonPlayer.tsx:127` |
| W6 | Sign-in says "sent" when the send was throttled (2 per hour for the whole project) | RS-23, OPS-J09 | `masuk/actions.ts:61-73,101-104` |
| W7 | **Certificates:** the list links to the wrong page (DAISY-40 held); the course and school name are read live, not as at issuance (D-078(c)); "being prepared" never ends on a synthetic school or without a key; leaving the class loses access to one's own certificate | CERT-J04, CERT-J10 | `belajar/sertifikat/page.tsx:81,95`; `20260914110000:158`; `[tugas]/sertifikat/page.tsx:60,70-74` |
| W8 | Lihat bukti counts learners who started but did not submit as «Belum mengerjakan». The started count is computed but never shown | BD-08, EDU-J24 | `KeadaanHariIni.tsx:76-80`; `pengajar.ts:409` |
| W9 | **Report pages:** print raw decimals («0.75»); render cohort rows blank; show competency outcomes as a count. **/pimpinan:** shows net gain as «35%» where Lihat bukti says «+35 poin» | REP-J06, HOD-J09, HOD-J03 | `dekan/ringkasan/page.tsx:101-135`; `edukator/ringkasan/page.tsx:118-152`; `pimpinan/page.tsx:296-307` |
| W10 | **A head of department over a department:** told «no figures» above classes that have them; the department roster reads empty | HOD-J01, HOD-J06 | `pimpinan.ts:357-365,412-417` |
| W11 | The management node page lists hidden «Reguler» and «Jenjang» nodes (against D-027) | MGT-J05 | `pimpinan.ts:189-211` |
| W12 | The misconception card promises a figure that cannot appear (D-063) | REP-J08, REP-J09 | `hle.ts:2184`; `muncul.ts:35` |
| W13 | Content copy promises editing («sunting bebas»; «Perbaiki…») where no editor exists | CNT-J10, CNT-J12 | `hle.ts:2208,2507` |
| W14 | The transfer form asks for codes but accepts only internal UUIDs; a transfer arrives without a Kelas | RS-19 | `konfigurasi/actions.ts:66-73`; `20260912004527:146-149` |
| W15 | The rollover count reports only the last class | ADM-J19 | `20260912004527:246` |
| W16 | **Teacher's view:** a future-start assignment reads as already open; the home says "nothing waiting" when published material exists | EDU-J16, EDU-J01 | `pengajar.ts:366-369,656-657` |
| W17 | **A lost class card cannot be revoked:** the PIN is printed on the card, there is no revoke or re-issue, and the 60-minute idle limit is a browser cookie lifetime, not a server-side end | RS-04, ID-J16, ID-J19 | `hle.ts:1901`; `20261005110000:213-222`; `sesi.ts:8-14` |
| W18 | The learner's ranking of assignments contradicts its documented order | STU-J12 | `siklus.ts:141-154`; `experience.test.ts:1906-1915` |
| W19 | Any signed-in user can rename themselves, unaudited (known; the BOB-26 fix is held) | BD-13 | `20260912004431:307-311` |

## 6. Corrections to the Phase 1 package

These are for reconciliation; the package itself was not edited.

- **K1. ADM-06: NOT BUILT → BUILT.**
  - **Found:** a school admin *can* give a staff role to a person recorded through a name-only intake row (BOB-21; F10-G03, a database test).
  - **The catch:** nothing tells the admin about this path, it has never been walked, and the refusal copy says only the platform admin can.
  - **Also corrected:** the board's J3 "current break" and ADM-05's note should read "no signposted way; never walked", not "cannot".
- **K2. ADM-16: TESTED → BUILT.**
  - **Why:** DAISY-07-LAPORAN-02 renders the page over HTTP, but the report prints raw decimals and blank rows, so "with correct figures" is not met (W9).
  - **The P0 walk-back becomes:** TESTED 38, BUILT 42 (was 39 and 41).
- **K3. The click evidence is thinner than the walk-back's notes suggest.** No state changes, because the evidence model accepts executable tests that do not click.
  - **Typed URLs in audit #55:**
    - the teacher's, Studio and learner pages are reached by typed URL (S13, S14, S17, S18, S21, S22);
    - S19 reads the chapter link, then navigates to its address instead of clicking.
  - **Direct requests:** intake and cards are RPCs or direct POSTs (S9, S10, S20).
  - **Unasserted steps:** S5 asserts no landing (BOB06-R01 covers it); S23 asserts comprehension but not net gain.
  - **Consequence for Phase 2:** the Level 2 slices and the Golden School must click.
- **K4. The board's "current break" entries are superseded by the more precise breaks in §7,** when the board is next generated.

## 7. Every item

The scope cell gives the inventory line and its canonical source, or the reason for the class. The implementation cells come from the code traces.

### Student journeys

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| STU-J01 | SUPPORTED — J6.1, J6.13 (STU-03, STU-18). An accomplishment overview across chapters is not named | **PARTIAL** | The home exists and card sign-in reaches it. There is no "what I have accomplished" summary, only a trail per chapter. On main the home was seen only empty (S11) and with one unstarted chapter (S19). | belajar/page.tsx:199-356; S11 (journey.mjs:384-403); S19 (811-834) |
| STU-J02 | SUPPORTED — J6.3, J6.1 (STU-11 'the place is kept'; STU-03) | **UNPROVEN** | The continuation logic exists: an open session gets «Lanjutkan…», the next unread lesson is offered, the saved page is kept. No run on main stops and resumes later. | belajar/page.tsx:104-124,176-189; siklus.ts:110-136,171-190; LessonPlayer.tsx:92-98 |
| STU-J03 | ENHANCEMENT / LATER — 4.0 learning is assignment-driven (STU-03, STU-04). Finding assigned work is J6.1; free subject browsing has no source | **PARTIAL** | There is no subject level. /belajar is one flat list of assigned chapters, with the subject as a label and a step trail. Nothing lets a person select a subject. | KartuTugas.tsx:100-117; belajar/page.tsx:258-286 |
| STU-J04 | SUPPORTED — J6.2, J6.5, J6.3, J6.10, J6.11, J6.13 (D-008; STU-04 to STU-18) | **PARTIAL** | S19 reads the chapter link but enters by typed URL. S21 types /pemetaan and /penguasaan and skips the lessons. There is no "activities" step. /lanjut is never reached on main. | journey.mjs:826-828,975-981; hasil/page.tsx:147-151 |
| STU-J05 | SUPPORTED — J6.3, J6.1 (STU-11; STU-03) | **UNPROVEN** | The incomplete state is shown (trail, «Lanjutkan»), and finished tests redirect instead of restarting. Returning to an incomplete chapter is never run on main. | pemetaan/page.tsx:33; penguasaan/page.tsx:80-81; aksi.ts:136-147 |
| STU-J06 | SUPPORTED — J6.5 to J6.9 (STU-05, STU-06, STU-07, STU-10) | **PARTIAL** | The orientation is reached by typed URL: the /belajar link is read, never clicked. Start, answers and «Selesaikan pemetaan» are clicked through to /peta. «Buka pelajarannya» on /peta is never clicked. | journey.mjs:826-828,975-978,918; peta/page.tsx:148-154 |
| STU-J07 | SUPPORTED — J6.3, J4.2 (STU-11; ADM-10; D-050(c)) | **UNPROVEN** | The lesson player saves pages and links to the next and previous lesson and to the post-test. No lesson is opened on main's code (S21 skips them). | pelajaran/[pelajaran]/page.tsx:76-105; LessonPlayer.tsx:114-128; PHASE-1-STATUS STU-11 |
| STU-J08 | SUPPORTED — J6.10 (STU-13, STU-14) | **PARTIAL** | S21 types /penguasaan with the lessons unread. At that moment the product offered no post-test link (the home offered «Lihat peta bacaan»). Start, answers and «Kumpulkan» are then clicked through to /hasil. | journey.mjs:979-981; siklus.ts:123-135; penguasaan/page.tsx:80 |
| STU-J09 | SUPPORTED — J6.11, J6.13, J8.2 (STU-15, STU-18, STU-17). 'Is the chapter complete?' is M3 | **PARTIAL** | /hasil shows the percentage, "Terjawab tepat" and the target, but never says whether the target was met (the engine's `lulus` is unused). The chapter shows «Selesai» whatever the score. Certificate state is unwalked. | hasil/page.tsx:72-83; assessment-engine/types.ts:66; siklus.ts:115-117 |
| STU-J10 | **MISSING REQUIREMENT** — M3: what a learner does after a low result (review, reinforcement, another attempt?) has no source. STU-15 and STU-16 cover reading the result only | **PARTIAL** | «Belum tepat» and per-item direction exist. There is no remediation and no retake (POST_TEST allows_retry=false). /lanjut can tell a low scorer that everything assigned is finished. | hasil/page.tsx:102-129; lanjut/page.tsx:131-138; hle.ts:2443; 20260914093000:54-55 |
| STU-J11 | SUPPORTED — J6.12 (STU-16, permitted review only) | **PARTIAL** | There is no history view. Finished chapters stay on /belajar («Lihat hasil», lessons still open) only while the assignment is ACTIVE and the learner is in the class. Coming back to review is never walked. | 20260913093000:106-125; belajar/[tugas]/page.tsx:119-135 |
| STU-J12 | SUPPORTED — J6.1 (STU-03 'one obvious next action') | **UNPROVEN** | The ranking and «Siap untuk Uji Penguasaan» exist, tested only by a pure unit test. No run on main has several assignments. The ranking contradicts its own documented order. | siklus.ts:141-154; experience.test.ts:1906-1915; belajar/page.tsx:195-251 |
| STU-J13 | SUPPORTED — J6.1, J6.13 (STU-03 'a clear nothing assigned yet'; STU-18) | **CONNECTED** | — | S11: card sign-in → /belajar shows «Belum ada materi yang ditugaskan untuk Anda.» (hle.ts:2297; belajar/page.tsx:260-274) |
| STU-J14 | SUPPORTED — J3.7, J2.19 (ADM-07 cards; STU-01; C17: students keep the class card) | **CONNECTED** | — (student side only: S10 made the card by direct POST, not through the /aktivasi form) | S11: «Gunakan kartu kelas» → «Masuk dengan kartu» → /belajar, «Halo, Ani»; journey.mjs:377,384-403 |
| STU-J15 | SUPPORTED — J2.19 (STU-01) | **CONNECTED** | — | S19 and S21: the same card signs in again by clicking (journey.mjs:813-819,966-972) |
| STU-J16 | SUPPORTED — J2.9 (D-009; STU-19) | **UNPROVEN** | S11 counts that the Keluar control is present. No step ever presses it. "This device only" rests on code and tests. | journey.mjs:123-125,400; keluar/route.ts:18-24; keluar.ts:13-17 |
| STU-J17 | SUPPORTED — J2.9, J2.20 (D-009 card sessions end after 60 min idle; D-020 first name only). See tension T1 | **UNPROVEN** | The pieces exist: Keluar, a 60-minute idle cookie for cards, /masuk not naming a live session, first-name greeting. The shared-device walk has never been run. | sesi.ts:20-25; masuk/page.tsx:67-87; belajar/page.tsx:92 |
| STU-J18 | SUPPORTED — J2.9 (X-13 'the next person never continues as the last'; STU-19) | **WRONG** | The lesson page index is stored per device (`pintar.lesson.<lessonId>`), not per person, and Keluar does not clear it. The next student starts on that page, and it is saved as their own progress, possibly marking the lesson read. Found by reading the code; never run. | LessonPlayer.tsx:91-98,118-128; siklus.ts:77-80; keluar.ts:16 |
| STU-J19 | SUPPORTED — J2.19, X.6 (card sign-in on any device; U-DEVICE) | **UNPROVEN** | State is kept on the server (sessions, lesson_progress). No device switch is ever run. | PermukaanAsesmen.tsx:113-124; LessonPlayer.tsx:92-98 |
| STU-J20 | SUPPORTED — J6.3, J6.7 (place kept server-side; pause and resume only where the assessment's rules allow, STU-08) | **UNPROVEN** | Designed for it (server state plus outbox replay) but never exercised. Answers still waiting in the outbox stay on the first device. | ItemPlayer.tsx:92-127,268-282 |
| STU-J21 | SUPPORTED — J6.11 (STU-15: mastery with its meaning, own growth) | **PARTIAL** | No overall "how am I doing" view. There is only the trail and status per chapter and each chapter's /hasil. | KartuTugas.tsx:93-117; hasil/page.tsx; S21 |
| STU-J22 | SUPPORTED — J6.1, J6.13 (STU-03, STU-18) | **PARTIAL** | The «Langkah berikutnya» panel offered the step in S19, but nobody clicked it. /lanjut «Apa berikutnya» and the ranking across several assignments are never seen on main. | PanelLanjut.tsx:35-60; journey.mjs:821-828; lanjut/page.tsx |
| STU-J23 | **MISSING REQUIREMENT** — M3: what 'chapter complete' means for a learner, and how it is explained, has no source (D-070(b) defines completion for professional learning only) | **PARTIAL** | The trail and status show the current step and "n dari m selesai". No reason is stated, and any finished post-test reads «Selesai». Never walked on main. | KartuTugas.tsx:93-110; siklus.ts:115-117; hle.ts:2410 |
| STU-J24 | SUPPORTED — J6.11 (STU-15) | **PARTIAL** | /hasil for a chapter explains the score (count, target, objectives, review) but says nothing on met or not met. After submitting an Uji Cepat the learner lands on /belajar with no result. Only "Terjawab tepat" is asserted (S21). | hasil/page.tsx:72-145; asesmen/[penugasan]/page.tsx:58; journey.mjs:984-986 |
| STU-J25 | SUPPORTED — J8.2 (STU-17) | **WRONG** | The certificate pages exist, but no certificate was ever issued or viewed on main. A single Uji Cepat scored at 60% or more can certify (QUICK certifies=true), against D-082(d). | 20260914093000:62; 20260922100000:143; ItemPlayer.tsx:327-331 |

### Educator journeys

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| EDU-J01 | SUPPORTED — J5.1, J5.8, J5.10 (EDU-02, EDU-09, EDU-13; D-061 #3) | **PARTIAL** | The teacher lands on /mengajar and sees one suggestion, the class list and open-test counts. Nothing names students who need attention (by design). "Nothing waiting today" shows when a class has no assignment yet, even if published material exists. | S13 landing; mengajar/page.tsx:114-133,160; pengajar.ts:656-657; hle.ts:3081; DaftarMurid.tsx:35 |
| EDU-J02 | SUPPORTED — J5.3 (EDU-04: permitted classes). There is no timetable ('today') in 4.0 | **PARTIAL** | There is no "today" or timetable. /mengajar lists every class in the teacher's scope. | S13 (sees Kelas 1A); mengajar/page.tsx:144-175; hle.ts:3087-3088 |
| EDU-J03 | SUPPORTED — J5.2, J5.8, J7.1 (EDU-03, EDU-09, EDU-12) | **UNPROVEN** | A link to /mengajar/[kelas] exists, but job B never rendered the class page. S13 and S18 typed /siapkan; S22 typed /bukti. | mengajar/page.tsx:160; journey.mjs:418,425,777,1013 |
| EDU-J04 | **MISSING REQUIREMENT** — M4: what a teacher may see about one student (results, answers) has no source; EDU-09 and EDU-12 are class-level | **MISSING** | The teacher's roster is names only, with no link and no per-student view. A per-learner record exists only for HoD/Dean (/pimpinan/[simpul]/murid/[orang]). | DaftarMurid.tsx:35; pengajar.ts:33-40; management_learner_detail (20260925100000) refuses anyone who is not HoD/Dean |
| EDU-J05 | SUPPORTED — J7.1 (EDU-12); the 60-second principle is D-061's review and D-052(b) polish | **PARTIAL** | Lihat bukti shows comprehension, gain and mastery by part. The misconception figure can never appear (D-063). S22 reached the page by typed URL. Nobody has measured whether a teacher understands it in 60 seconds. | S22; [kelas]/page.tsx:126; journey.mjs:1013; bukti/page.tsx |
| EDU-J06 | SUPPORTED — J5.4 (EDU-05, EDU-06: find, prepare, assign with dates) | **PARTIAL** | Siapkan lists only whole courses of the teacher's own school. There is no subject→chapter choice (a release is a whole course), no lesson preview from Siapkan, and no PINTAR library material. | S18; siapkan/page.tsx:94-115,128-176; pengajar.ts:240,640-646 |
| EDU-J07 | SUPPORTED — J5.4, J1.5 (SYS-05, P2). How standard content reaches the school is M6 | **DISCONNECTED** | The database accepts distributed (library) releases, but Siapkan offers only the school's own releases. The library is visible read-only in /studio/kanonik. | pengajar.ts:240; 20261010100000:471; studio/kanonik/page.tsx |
| EDU-J08 | SUPPORTED — J4.1 (D-029, D-021): a school's own package beside distributed content | **PARTIAL** | A supplement can only be a separate whole course uploaded as an Excel workbook. It cannot be attached to existing or central material, the teacher cannot publish it, and no teacher has done it. | studio/unggah; langkah.ts:47-61 (publisher = INSTITUTION_ADMIN); S14 by platform admin |
| EDU-J09 | SUPPORTED — J4.1 (D-007: lesson content v1 is the workbook; Studio for Guru, D-021). No in-app editor in 4.0 | **UNPROVEN** | A lesson is created by filling the Excel template outside PINTAR and uploading it; there is no editor in the product. Upload is proven only by the platform admin; no workbook written by a teacher exists. | S14, S15c; studio/unggah/page.tsx:25-28; reality audit §6 #7 |
| EDU-J10 | SUPPORTED — J4.1, J4.8 (D-007 Soal and Pilihan sheets; Question Bank D-050(a)) | **UNPROVEN** | Questions come only from the workbook or package; there is no question editor. No teacher has done it. | S14, S15c; studio/actions.ts:300-318; hle.ts:2638 |
| EDU-J11 | **MISSING REQUIREMENT** — M10: how corrected content reaches the same course has no source. D-007 makes the workbook the only edit surface; a re-upload creates a separate course; the revision copy (D-041) has no editor (trace B) | **PARTIAL** | No screen edits a draft; the app only changes status. "Editing" means re-uploading a corrected workbook, which creates a separate course. The old draft remains. | studio/actions.ts:68-113 (status-only updates); hle.ts:2638 |
| EDU-J12 | SUPPORTED — J4.2 (ADM-10: content and media checked before publishing) | **PARTIAL** | The Studio preview shows lesson text, objectives and media, but no questions. It is reachable from the package page, not from Siapkan. Job B never opened it. | pratinjau/[pelajaran]/page.tsx:7-13; paket/page.tsx:159-164; no pratinjau step in journey.mjs |
| EDU-J13 | SUPPORTED — J4.3, J4.5 (publishing is the school admin's step after a second person's review, ADM-12, HOD-10, D-041) | **UNPROVEN** | A teacher may take only steps 1–3 (up to «Ajukan»). HoD or admin approves and locks; admin publishes. S17 walked this with the platform admin and the school admin, never a teacher. /studio/tinjau has never been walked. | langkah.ts:47-61; role_capabilities 20260926100000:159-160; S17; HOD-03 N-T |
| EDU-J14 | SUPPORTED — J5.4 (EDU-06) | **CONNECTED** | — (but the entry to /siapkan was typed, and the class-page link was never clicked) | S18: clicks the row, then «Sediakan»; both tests opened; window in WIB. journey.mjs:777; [kelas]/page.tsx:120 |
| EDU-J15 | SUPPORTED — J5.4 (EDU-06: one class per assignment; several classes means repeating it) | **PARTIAL** | «Sediakan» commits to one class (a hidden kelas field). Several classes means repeating it per class. Never walked. | siapkan/page.tsx:187; mengajar/actions.ts:69-98 |
| EDU-J16 | SUPPORTED — J5.4 (EDU-06: dates enforced in WIB) | **UNPROVEN** | The «Mulai» date allows a future start, but this was never exercised (S18 used today). Teacher pages would show a not-yet-open assignment as "Tersedia"/"Berjalan". | siapkan/page.tsx:196-199; [kelas]/page.tsx:69-73; pengajar.ts:366-369; 20261010100000:522 |
| EDU-J17 | SUPPORTED — J5.5 (EDU-07, EDU-08; D-015; D-067) | **WRONG** | Atur → Tinjau → Sediakan → live count exists but was never clicked on main, and there is no results screen. When a learner finishes, a certificate is requested automatically (QUICK certifies; pass mark 0.6), while the Tinjau screen says it is not. | asesmen/[penugasan]/page.tsx:59; ItemPlayer.tsx:159,323-331; 20260914093000:62; 20261020100000:141; hle.ts:3189; BOB42-S01 is database-only |
| EDU-J18 | SUPPORTED — J5.5, J4.8 (Uji Cepat from bank questions) | **PARTIAL** | The teacher picks only chapter, count and window. Questions are drawn at random by the database and never shown before launch. Chapters come only from material already assigned to the class. | uji-cepat/page.tsx:163-213; mengajar/actions.ts:103-130; 20261020100000:163-166 |
| EDU-J19 | ENHANCEMENT / LATER — D-007: questions enter through the workbook. Writing new questions inside Uji Cepat has no source. See tension T2 | **MISSING** | There is no way to write new questions for an Uji Cepat. Items come only from imported workbooks. | uji-cepat/page.tsx; studio/kuis/page.tsx |
| EDU-J20 | SUPPORTED — J5.6 (EDU-10) | **MISSING** | There is no score screen. The live panel shows only the submitted count and minutes left (EDU-10 NOT BUILT, M12). | uji-cepat/page.tsx:41-46,126-145; PHASE-1 EDU-10 |
| EDU-J21 | **MISSING REQUIREMENT** — M5: per-question results for the teacher have no source; EDU-10 is the score only, and EDU-09 bars Question Health for teachers | **MISSING** | Educators have no question-level read: responses need CAN_REVIEW_INTEGRITY, which a teacher does not hold. | uji-cepat/page.tsx:36-41; pengajar.ts:22-26 |
| EDU-J22 | SUPPORTED — J5.8 (EDU-09) | **PARTIAL** | Counts are shown ("Mengumpulkan 5/5", S22). Names on /siapa are reachable only from a running Uji Cepat, or from Langkah while someone is still pending. Never opened. | S22; uji-cepat/page.tsx:151; langkah/page.tsx:55-66; KeadaanHariIni.tsx (no link) |
| EDU-J23 | SUPPORTED — J5.8 (EDU-09) | **PARTIAL** | /siapa shows only "sudah" and "belum mengumpulkan". Not started is not separated from in progress. Lihat bukti gives a count only. | pengajar.ts:450-475; siapa/page.tsx; KeadaanHariIni.tsx:79-84 |
| EDU-J24 | SUPPORTED — J5.8 (EDU-09). 'Started but not finished' is not named apart from 'not handed in' | **MISSING** | No screen shows "started but not finished". The started count (`mulai`) is computed but never rendered. | pengajar.ts:409; no screen uses it |
| EDU-J25 | **MISSING REQUIREMENT** — M4: naming which students struggle (beyond class figures and tier counts) has no source | **MISSING** | By design there is no per-learner signal for teachers: names are alphabetical only, and the readiness distribution has counts without names. | DaftarMurid.tsx:1-20,35; bukti/page.tsx:194-205; pengajar.ts:33-40 |
| EDU-J26 | **MISSING REQUIREMENT** — M5 | **MISSING** | Teachers have no question-level evidence. Question Health is for HoD and admin only (/studio/bank) and needs 30 answers per question. | pengajar.ts:22-29; bank/page.tsx:46; HOD-06 BLOCKED |
| EDU-J27 | SUPPORTED — J7.1 (EDU-12: mastery by part, the catalogue metric; D-060) | **PARTIAL** | «Penguasaan per bagian» is shown (S22), but for the whole class across all material, not per chapter. Reached by typed URL. | S22; bukti/page.tsx:31-35,138-158; journey.mjs:1013 |
| EDU-J28 | SUPPORTED — J7.1, J5.10 (EDU-12; EDU-13 assistive 'what next') | **PARTIAL** | The page only orders mastery by part. The misconception/remediation figure is always absent (D-063), there is no question evidence, and nothing suggests what to reteach. | bukti/page.tsx:138-188; S22 (misconceptions absent) |
| EDU-J29 | **MISSING REQUIREMENT** — M3: remediation for selected students has no source; re-assigning to the whole class is J5.4 | **MISSING** | Remediation cannot be assigned. It appears only as text inside the misconception figure, which is always absent. | bukti/page.tsx:184; mengajar/actions.ts:10-41 (the only two writes) |
| EDU-J30 | **MISSING REQUIREMENT** — M3 | **MISSING** | Nothing records remediation or its effect. | No remediation object in src or migrations |
| EDU-J31 | SUPPORTED — J9.1, J9.2 (D-069, D-070: the school enrols a staff member; a facilitator assigns). Management itself does not assign: tension T3 | **DISCONNECTED** | Learning pages work by enrolment, and teachers have a «Pembelajaran Saya» tab. But no product action enrols an existing Guru (the intake refuses people who already have a number); BOB-43/44 are TODO. | CangkangPengalaman.tsx:143; EDUCATOR-AS-LEARNER-ASSESSMENT.md:34,98-107; BOARD.md:244-245 |
| EDU-J32 | SUPPORTED — J9 (D-069, D-070) | **DISCONNECTED** | Same enrolment break. The professional-learning place (BOB-43) is not built. It works only after a direct database write; never run on main. | Same as EDU-J31; PHASE-1 J9 "Not built" |
| EDU-J33 | SUPPORTED — J9.4 (D-069(b): the participant sees their own progress) | **DISCONNECTED** | Same enrolment break. /belajar would show a Guru's own progress only after an enrolment made by direct database write. | Same; EDUCATOR-AS-LEARNER-ASSESSMENT.md:26-27 |
| EDU-J34 | SUPPORTED — J9 (D-069(g): Uji Penguasaan as participant) | **DISCONNECTED** | Same enrolment break. The tests themselves are not gated by role. | Same; BOARD.md:244-248 (BOB-43..47 TODO) |
| EDU-J35 | SUPPORTED — J9.7 (D-069(i)) | **DISCONNECTED** | Same enrolment break. It would use the existing certificate engine, which has never issued a certificate outside tests. | Same; PHASE-1 J8 |

### School administrator journeys

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| ADM-J01 | SUPPORTED — J3.1, J2.3 (ADM-01; D-054(b)) | **CONNECTED** | — (caveats: the account came from a direct POST in S3; there is no first-time guidance; staff sign in by magic link only) | S5 `magicSignIn` types the address, clicks, opens the Mailpit link (journey.mjs:79-91, 230-234). S5 asserts no landing path; "/konfigurasi" is only in the log. |
| ADM-J02 | SUPPORTED — J3.2 (ADM-02, P1) | **MISSING** | No readiness or "what's left" view. Struktur shows a fixed 3-step guide, not completion state. | ADM-02 N-I (PHASE-1-STATUS §4.2); PanelStruktur.tsx:87-91; konfigurasi/page.tsx:256-268 (only a class-count card) |
| ADM-J03 | SUPPORTED — J3.3 (ADM-03; D-006, D-022) | **CONNECTED** | — (rename and deactivate were never clicked) | S7 clicks Bagian → Tingkat → Kelas on Struktur sekolah (journey.mjs:249-289); PanelStruktur.tsx:271-366 unexercised; ADM-03 "confirm before deactivating not run" |
| ADM-J04 | SUPPORTED — J3.4 (ADM-04, P1) | **PARTIAL** | No screen for years. A year exists only as the Tingkat form's "Tahun ajaran" field, which creates the period silently. The audit's 2026/2027 came from W0 SQL, so the screen path never created a year. | PanelStruktur.tsx:231-244; structure_period 20261006100000:141-157; W0 journey.mjs:144-147; ADM-04 PARTIAL |
| ADM-J05 | SUPPORTED — J3.3 (ADM-03) | **CONNECTED** | — | S7 creates "Kelas 1A" by click; the row is confirmed in the DB (journey.mjs:276-283) |
| ADM-J06 | SUPPORTED — J3.5 (ADM-05) | **UNPROVEN** | No "add teacher" for a school admin: «Orang baru» is SYSTEM_ADMIN-only and intake refuses staff rows. In code, an unsignposted name-only intake row → Aktivasi → grant works, but it was never walked. | route.ts:53; FormAktivasi.tsx:114; 20261014100000:72-79; hle.ts:1713; 20261018100000:87-99; F10-G03 (DB). S12 is the platform admin by direct POST. |
| ADM-J07 | SUPPORTED — J3.5 (ADM-06; a role at a Kelas). There is no subject-level teacher scope in 4.0 (D-006) | **PARTIAL** | A class-scoped Guru grant exists. The school admin's grant to their own recorded staff is allowed but was never clicked. There is no subject assignment (scope is an org node only). | konfigurasi/page.tsx:506-531; S12 `grantViaForm` by platform admin (journey.mjs:108-127, 405-412); org_kind 20260912004244:5-6 |
| ADM-J08 | SUPPORTED — J3.6 (ADM-07) | **UNPROVEN** | /pendataan (code → file → map → Periksa → Konfirmasi → advance) exists and is linked, with no click evidence. The audit reserved the code and ran intake by RPC with a service-minted session. | konfigurasi/page.tsx:244; S8 journey.mjs:302-303; S9 347-369; S20 926-942; `apiSession` 92-99 |
| ADM-J09 | SUPPORTED — J3.6 (ADM-07) | **PARTIAL** | Placement happens only inside an intake row ("Tempat"). A student already recorded cannot be placed later: re-intake is refused ("already holds an institutional identity here"). The intake screen was never clicked. | BacaDanPetakan.tsx:84; 20261014100000:44-46; S9 via RPC |
| ADM-J10 | SUPPORTED — J3.7 (ADM-07; X-01) | **UNPROVEN** | The card button was never clicked: S10 opened /aktivasi, found the student by RPC, then made the card by direct POST. No print and no re-display; the PIN is shown once. | FormAktivasi.tsx:94-101; HasilAktivasi.tsx:51-61; journey.mjs:374-377; S11 card sign-in by click (384-403) |
| ADM-J11 | **MISSING REQUIREMENT** — M7: issuing and printing cards for a whole class has no source (cards are made one at a time, the PIN shown once) | **PARTIAL** | One card per person, one press each, PIN shown once, no batch or print sheet. S20's four cards were four direct POSTs. | FormAktivasi.tsx:46-48, 94-101; journey.mjs:944-950; reality audit §6 #6 |
| ADM-J12 | SUPPORTED — J2.21 (ADM-08, P1) | **MISSING** | No re-issue: anyone with an account leaves the Aktivasi list, and activation is refused ("already has an account"). | 20261005110000:213-221; 20261005120000:158-160; ADM-08 N-I |
| ADM-J13 | **MISSING REQUIREMENT** — M9: moving one student between classes within a school has no source; ADM-19's transfer goes to another school (trace C) | **MISSING** | No function or screen moves one student between classes. Re-intake is refused, rollover moves whole classes across periods, and transfer is cross-school. | 20261014100000:44-46; period_rollover 20260912004527:223-250 |
| ADM-J14 | SUPPORTED — J3.5 (ADM-06: revoke roles; dated role_assignments, D-059(f)) | **UNPROVEN** | The revoke button on Peran & akses exists and the school admin may revoke in scope, but it was never clicked. The teacher's account cannot be deactivated, and there is no class hand-over. | konfigurasi/page.tsx:491; revoke_role 20260912004431:222-231; F01-T04 (DB only) |
| ADM-J15 | SUPPORTED — J3.5 (ADM-05, ADM-06) | **UNPROVEN** | Built from unwalked pieces: the teacher is added via the unsignposted name-only intake (ADM-J06), then grant and revoke. Class continuity was never exercised. | As ADM-J06, J07, J14; RS-16 not walked |
| ADM-J16 | SUPPORTED — J3.2 (ADM-02 'home shows the remaining setup'). Reading activation as setup is an interpretation for Yazid to confirm | **PARTIAL** | Aktivasi lists only people with no account; its empty state says everyone "can already sign in". No counts, and no "has signed in" or card-delivered status. | 20261005110000:213-221; hle.ts:2710; F09-C02 (HTTP render only) |
| ADM-J17 | SUPPORTED — J2.21, J10.1 (ADM-08; D-037 tier 1 is the school admin; D-068(c)) | **MISSING** | The admin has no tool: no card or PIN re-issue, no email correction (M6), no staff recovery (Gates 4–5). The user can only re-request a magic link. | ADM-08 N-I; U-RECOVER NOT BUILT; recovery functions have no caller (20261021100000:1, 359-604) |
| ADM-J18 | ENHANCEMENT / LATER — Beyond ADM-02's remaining setup, no source gives a school admin a 'system health' view (SYS-02 is the platform's) | **MISSING** | The school admin's health card says only "A Platform administrator runs these checks". Otherwise there is just a class count and the raw audit list. | KartuKesehatan.tsx:40-41; hle.ts:1970; konfigurasi/page.tsx:256-268, 537-560 |
| ADM-J19 | SUPPORTED — J3.4 (ADM-21, P2) | **UNPROVEN** | The screens exist: a next-year Tingkat creates the period, and the Rollover form appears once there are ≥2 periods. Never run. The result count is wrong when several classes are mapped. | konfigurasi/page.tsx:383-427; 20260912004527:246; ADM-21 N-T; F01-T08 (DB only) |
| ADM-J20 | SUPPORTED — J3.3, J2.21, X.3 (ADM-03 deactivate with confirmation; ADM-08; D-077(e)) | **PARTIAL** | Structure rename and deactivate (with confirmation) exist but were never clicked. No correction for a person's name, email (M6), placement or a mistaken intake; persons are never deleted. | PanelStruktur.tsx:271-366; 20260912004321:20-23; ADM-08 N-I |

### Head of department journeys

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| HOD-J01 | SUPPORTED — J7.2 (HOD-01, HOD-09) | **PARTIAL** | A head of department scoped to a department does not get the school figures, so «Yang didukung bukti» says «Belum ada angka…» even though the classes below have figures. Figures sit only inside closed per-class panels. Readiness shows as a count of tiers (T1). | S16; S23; pimpinan/page.tsx:180-181,215-254,296-307; pimpinan.ts:357-365 |
| HOD-J02 | SUPPORTED — J7.2 (HOD-09: each class answers for itself) | **PARTIAL** | There is no comparison view. Each class is a separate closed panel, opened one at a time. Only one class (1A) has ever been walked. | pimpinan/page.tsx:222-251; S23 |
| HOD-J03 | SUPPORTED — J7.2 (HOD-09; per-topic mastery metric, D-060) | **PARTIAL** | Topic mastery is not requested on /pimpinan. It is one click away on the class summary, where it shows as objective codes with raw decimals. Never clicked in a browser. | pimpinan.ts:302-307; edukator/ringkasan/page.tsx:118-133; DAISY-07-LAPORAN-02 (HTTP only) |
| HOD-J04 | SUPPORTED — J7.2, J7.5 (HOD-09; the decision queue, D-061 #2) | **PARTIAL** | Each class's summary line says only «Ada angka» or «Belum ada angka». Management figures carry no attention or action sentence, by design. Nothing flags a class. | pimpinan/page.tsx:228-230; AngkaTerkelola.tsx:15-25; S23 |
| HOD-J05 | SUPPORTED — J7.2 (HOD-09 participation) | **PARTIAL** | /pimpinan shows «Peserta N» with no denominator and no not-started count. «Mengumpulkan X/Y» exists only on the teacher's Lihat bukti, which a head of department reaches only by typed URL (no Kelas tab). | pimpinan.ts:302-307; KeadaanHariIni.tsx:64-80; tempat.ts:41-45 |
| HOD-J06 | SUPPORTED — J7.2, J4.9 (aggregate → class: HOD-09; question signals: HOD-06). Student-level reading is M4 | **PARTIAL** | The class → roster → learner-record path exists but has never been walked. The department roster reads «Belum ada murid…» because it matches the exact node only. There is no question-level step. | pimpinan.ts:412-417,474-481; [simpul]/page.tsx:122-140; UX1-PIMPINAN-AKSES-01 |
| HOD-J07 | SUPPORTED — J4.9 (HOD-06, P2; D-061 #6) | **UNPROVEN** | Studio → Bank Soal question-health review exists (BOB-41), but it needs 30 answers per question and has never been exercised. It is not surfaced on /pimpinan, and Studio's counts are not links. | studio/bank/page.tsx:25-30; 20260918100000:313-318; studio/page.tsx:29-35 |
| HOD-J08 | ENHANCEMENT / LATER — Net gain per assignment exists (J7.1, J7.2). Tracking an 'intervention' has no source | **MISSING** | There is no intervention or over-time view. Class calculators pool all official sessions with no date or release filter. Net gain is pre→post within one assignment. | pimpinan.ts:302-314; 20260918110000:136-162 |
| HOD-J09 | SUPPORTED — J7.2 (HOD-09) | **PARTIAL** | Only per-class summaries exist; there is no department report. The report page has no way back except the browser's Back, prints raw decimals ("0.75") and has no print. Never clicked in a browser. | pimpinan/page.tsx:244,267-276; edukator/ringkasan/page.tsx:66-73,151; DAISY-07-LAPORAN-02 (HTTP) |
| HOD-J10 | SUPPORTED — J7.5 (DEA-04 queue; D-061 #2) | **PARTIAL** | Only integrity referrals reach «Keputusan» (BOB-39), and that path has never been walked. Studio review and question-health work is not counted on /pimpinan. Figures have no priority. | pimpinan/page.tsx:137-175; 20261024100000:53-58; studio/page.tsx:29-35 |

### Dean / management journeys

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| MGT-J01 | SUPPORTED — J7.3 (DEA-02) | **PARTIAL** | No dean has walked it by clicking (BOB06-R01 is an HTTP landing check). Most school figures need ≥10 learners. Structured figures show as counts (readiness tiers, number of competencies). | BOB06-R01; pimpinan/page.tsx:296-307; 20260918100000:303-312 |
| MGT-J02 | SUPPORTED — J7.3 (DEA-02, DEA-03) | **PARTIAL** | Management sees only figures derived from assessments (participants, comprehension, gain). There is no lesson or assignment progress. School gain needs ≥10 learners. No dean walk. | pimpinan.ts:302-314; 20260918100000:303-306 |
| MGT-J03 | SUPPORTED — J7.3 | **PARTIAL** | Only a head of department has read class comprehension (S23). School-level net gain and required-items figures need ≥10 learners and have appeared in no run. No dean walk. | S23; pimpinan.ts:309-314; 20260918100000:305-308 |
| MGT-J04 | SUPPORTED — J7.5 (DEA-04) | **PARTIAL** | The attention queue is fed only by Studio integrity referrals, never walked. The integrity review records only a session's first signal. Figures carry no attention, by design. | 20261024100000:53-58; studio/integritas/page.tsx:61; AngkaTerkelola.tsx:15-25 |
| MGT-J05 | SUPPORTED — J7.3 (DEA-03: reports at the right scope by clicking) | **PARTIAL** | «Lihat lebih rinci» opens a node page with no department figures (only school figures, or none). Below them is a flat alphabetical list of every node under it, hidden Reguler/Jenjang included. Never walked. | [simpul]/page.tsx:55-64,130-140; pimpinan.ts:189-211,357-365; D-027 |
| MGT-J06 | SUPPORTED — J7.3 (DEA-03) | **PARTIAL** | «Buka ringkasan sekolah» reaches /dekan/ringkasan, tested over HTTP only. The page has no way back, no print or export, and shows values raw. No dean has clicked it. | pimpinan/page.tsx:272-276; dekan/ringkasan/page.tsx:53-56,101-135; DAISY-07-LAPORAN-02 |
| MGT-J07 | ENHANCEMENT / LATER — D-069/D-070 bound 4.0: the school enrols, a facilitator assigns, management reads completion. Management assigning has no source. Tension T3 | **MISSING** | Educator-as-learner is not built. Intake refuses staff as learners, so management cannot assign training (D-069(g) has a Guru facilitator assign). | J9 "Not built"; D-069; BOB-43..47 not on main |
| MGT-J08 | SUPPORTED — J9.4 (D-070(a): the Dekan reads participation, progress, completion and result) | **MISSING** | There is no professional-learning record per PD Kelas, so nothing shows educator completion. | D-070(a); J9 not built |
| MGT-J09 | SUPPORTED — J7.3 (DEA-02 'each number with its standing'; D-060) | **PARTIAL** | A figure shows its meaning and «dari N» only, with no link to the learners or results behind it. Learner records are a separate path (never walked). Decision cards do not link to the session. | AngkaTerkelola.tsx:44-55; pimpinan.ts:474-481; KartuKeputusan.tsx:76-90 |
| MGT-J10 | SUPPORTED — J7.5 (DEA-04 decision queue and briefing) | **PARTIAL** | Only integrity referrals are ordered («oldest first»). With none, the page says nothing waits and gives no «start here» among the figures. | pimpinan/page.tsx:143-154; hle.ts:1527,1534 |

### Platform operations journeys

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| OPS-J01 | SUPPORTED — J1.1 (D-084 C1; SYS-03). Who acts on production is M1 | **MISSING** | No product path; the school is born by hand-typed SQL. | W0 journey.mjs:136-149; SYS-03 N-I |
| OPS-J02 | SUPPORTED — J1.1 (D-084 C1; D-013) | **MISSING** | The ruled C1 scripted, audited operator path does not exist. | DECISIONS.md:92 D-084(2); PHASE-1-STATUS §4.1 J1 |
| OPS-J03 | SUPPORTED — J1.4 (ADM-01; X-01) | **UNPROVEN** | The «Orang baru» form was never clicked: S3 is a direct POST, sends no email, and the person must be told out of band. Only the role grant (S4) was clicked. | FormAktivasi.tsx:114-140; journey.mjs:100-104, 211-228; hle.ts:2720 |
| OPS-J04 | SUPPORTED — J1.3 (SYS-02: schools within platform scope) | **MISSING** | Nothing shows whether the school admin signed in or the school is ready. The takeover itself depends on unwalked teacher onboarding. | ADM-02 N-I; S7b checks only the Struktur preselection (journey.mjs:291-299) |
| OPS-J05 | SUPPORTED — J1.3 (SYS-02) | **PARTIAL** | Only an on-request schema lint, the environment label and the last 50 audit rows. No signal for sign-ins, errors, email or uptime. Never clicked. | KartuKesehatan.tsx:24-41; konfigurasi/page.tsx:257-266; SYS-02 BUILT, never tested; reality audit §8 |
| OPS-J06 | **MISSING REQUIREMENT** — M8: diagnosing a failed onboarding (activation not received, not completed) without an engineer has no source | **MISSING** | No view of failed sign-ins, unsent links or stuck activations. /masuk says "sent" even when the send was throttled. | masuk/actions.ts:73; no reader of email_send_log or security_events in src |
| OPS-J07 | SUPPORTED — J1.7, J1.2 (C10 break-glass; D-001, SYS-08) | **PARTIAL** | Only a workaround: create a replacement admin (Orang baru + grant, unwalked) and revoke the old one. The existing account cannot be fixed. The sole SYSTEM_ADMIN has no recovery at all. | route.ts:53; admin_reset_recovery 20261021100000:593-604 (no caller); 20261004100000:24; SYS-08 FAIL |
| OPS-J08 | ENHANCEMENT / LATER — A school changing or leaving PINTAR has no source | **MISSING** | No screen to rename, deactivate or change a school (System section is read-only). No canonical way to move staff between schools. | konfigurasi/page.tsx:364-381; DECISIONS.md:57 D-049(d) |
| OPS-J09 | **MISSING REQUIREMENT** — M8: the platform admin is the email-operations owner (D-057(b)), but no source gives them a view of sends and failures | **MISSING** | Staff links go through Supabase's mailer (2 per hour) and the screen says "sent" either way. No send-log view. The email proof route has no button. | masuk/actions.ts:73; /api/email/uji (no caller in src); REL-08 NOT MET |
| OPS-J10 | SUPPORTED — J2.12, X.2 (C5 audited platform-admin reset; IDENTITY-4.0 §10) | **MISSING** | Administrator recovery is not built; the break-glass procedure is unwritten. `correct_username` and `admin_reset_recovery` exist with no screen. | 20261004100000:24; 20261021100000:560-604; SYS-08 FAIL |

### Identity and recovery journeys

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| ID-J01 | SUPPORTED — J2.3 (D-054(b); Gate 3) | **PARTIAL** | There is no activation screen, so there is no code, username, password or PIN step (Gate 3 held). Only the platform admin creates staff, PINTAR sends nothing, and the person must be told outside PINTAR to request a magic link. | api/akun/aktivasi/route.ts:53-63; hle.ts:2707; claim_username/set_my_pin (20261021100000:479,501) have no src caller; S3/S12 used a direct POST; S5/S13 sign-in clicked |
| ID-J02 | SUPPORTED — J2.5, J2.7 (Gate 3; C10) | **CONNECTED** | — (magic link only: the same link opened in another browser fails, S1b NOTE; the throttle is masked, see RS-23) | S1, S5, S13 (email link in the same browser, local mail sink); masuk/actions.ts:36-49 |
| ID-J03 | SUPPORTED — J2.19 (STU-01; C17). Students with email accounts: M2 | **CONNECTED** | — (the card itself was made by a direct POST, S10) | S11: «Gunakan kartu kelas» → card + PIN → /belajar, sign-out control present; api/masuk/kartu/route.ts:29-65 |
| ID-J04 | SUPPORTED — J2.5 (Gate 3; D-082(a): uniform answers and backoff kept) | **MISSING** | No password exists on main («tanpa kata sandi»). The only analogue is a wrong card PIN → «Belum cocok» plus a cooldown, tested over HTTP only. | hle.ts:1876,1910; LayarMasuk.tsx:305-347; DAISY-13-KARTU-02; BOB12-A01 |
| ID-J05 | SUPPORTED — J2.21 (students have no password in 4.0, C17; a lost card or PIN is re-issued by the school, ADM-08). Students with email accounts: M2 | **MISSING** | Students have no password (C17). For a forgotten PIN the screen says "ask the teacher", but /aktivasi only lists people who have no account, so the teacher cannot re-issue. | hle.ts:1914; 20261005110000:219; ADM-08 NOT BUILT |
| ID-J06 | SUPPORTED — J2.11, J2.12 (Gates 4-5) | **MISSING** | No password and no recovery (Gates 3–4). The only way back is another magic link (2 per hour per project). | IDENTITY-4.0 §9; masuk/actions.ts:36; api/_email/kode.ts:21 has no caller |
| ID-J07 | SUPPORTED — J2.11, J2.12; J1.7 for the sole platform admin (C10) | **MISSING** | Same as ID-J06. A sole platform admin who loses their mailbox has no product recovery. | 20261004100000:24; SYS-08 NOT MET |
| ID-J08 | SUPPORTED — J2.11 (Gate 4) | **MISSING** | No recovery email or code is ever sent. PINTAR's own mail path sends only the admin's delivery test. | kirimEmail is used only by api/email/uji/route.ts:4; kode.ts has no caller |
| ID-J09 | SUPPORTED — J2.18, J2.12, X.3 (C3 resend; PINTAR ID + PIN as the second path; no false success) | **MISSING** | No recovery flow. The sign-in analogue (a link that never arrives) is still reported as "sent": see RS-23. | masuk/actions.ts:73; U-RECOVER NOT BUILT |
| ID-J10 | SUPPORTED — J2.18, J2.14 (C3; PINTAR's send limits) | **MISSING** | No recovery. The analogue: «Kirim ulang» always returns the same "sent" screen, with no countdown. | LayarMasuk.tsx:120-155 |
| ID-J11 | SUPPORTED — J2.11, J2.15 (Gate 4; D-079 addendum: the real duration is shown) | **MISSING** | No recovery code. The analogue: an expired or used magic link shows «Tautan ini sudah tidak berlaku» with «Minta tautan baru» (reached in S1b). | TukarTautan.tsx:66-79; auth/callback/actions.ts:33 |
| ID-J12 | SUPPORTED — J2.11, J2.12 (Gates 4-5; C5 ladder) | **MISSING** | No code-entry screen anywhere. The Gate 2 attempt counters (service_role) have no caller. | 20261021100000:291-337,643-644 |
| ID-J13 | SUPPORTED — J2.11 (C12: other sessions end, the owner is informed) | **MISSING** | No change-password screen. There is a hole: any signed-in user can set a password through the Supabase API without the current one. | No updateUser in src; reality audit §7 |
| ID-J14 | SUPPORTED — J2.5, J2.11 | **MISSING** | No password exists, so there is nothing to attempt. Password sign-in (BOB-26) is held on a lane. | LayarMasuk.tsx (email + card only); RECOVERY-BOARD.md |
| ID-J15 | SUPPORTED — J2.5, J2.11 (sign in or recover by email or username, Gate 3 and Gate 4) | **MISSING** | No username is issued or shown. person_usernames exists only in the database (Gate 2), with no screen. | 20261021100000:109,479; no src caller |
| ID-J16 | SUPPORTED — J2.21 (ADM-08) | **MISSING** | No card re-issue or revocation: /aktivasi offers a card only to people with no account. A lost card stays a working credential. | 20261005110000:213-222; ADM-08 NOT BUILT |
| ID-J17 | SUPPORTED — J2.21 (ADM-08: the school re-issues the card and PIN) | **MISSING** | There is nothing to recover with (no password; students get no PINTAR ID screens, C17). The teacher cannot re-issue, so an operator is needed. | IDENTITY-4.0 C17; hle.ts:1914; U-RECOVER NOT BUILT |
| ID-J18 | SUPPORTED — J2.9 (D-009; STU-19; X-13) | **UNPROVEN** | «Keluar» has never been pressed in a browser on main. S2/S11/S13 only count the control, and the shared-tablet walk has never been run. | BarisSesi.tsx:59; keluar/route.ts:18-23; F01-R05, BOB05-R01 (HTTP); journey.mjs:123-125 |
| ID-J19 | SUPPORTED — J2.10, J2.20 (staff: 60 min locked or abandoned ends the session, C4; cards: 60 min idle, D-009) | **PARTIAL** | Closing the browser does not end the session: persistent cookies keep a card session 60 min and an email session 7 days, so the next person inherits it. The shared-device lock (C4, Gate 6) is absent. | sesi.ts:20-25; proxy.ts:80-98 (Max-Age); BOB05-R01 checks Max-Age only |
| ID-J20 | SUPPORTED — J2.10, J2.20 (staff PIN resume, D-055; a card session that ended means signing in again) | **UNPROVEN** | After idle expiry the proxy sends the person to /masuk?lanjut=…, then back to the page. Nobody has waited out a session on main. | proxy.ts:105-112; sesi.ts:20-25; BOB05-R01; BOB06-A01 |

### Content journeys

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| CNT-J01 | **MISSING REQUIREMENT** — M6: D-029 refuses every import into the national library, and SYS-05 (P2) distributes a library that holds nothing. How standard content is prepared centrally has no source | **MISSING** | Uploading into the canonical library is refused for every role (D-029); authoring there is backlog. | 20261007100000:461; S15b; D-029 |
| CNT-J02 | **MISSING REQUIREMENT** — M6 | **DISCONNECTED** | The grant form needs a typed school UUID and a release-id fragment. No canonical content can be created, and distributed releases never reach Siapkan. | kanonik/page.tsx:79-96; pengajar.ts:240; SYS-05 PARTIAL |
| CNT-J03 | SUPPORTED — J5.4 (EDU-05: published lessons on Siapkan). For 'standard' content, see M6 | **DISCONNECTED** | A teacher can browse distributed releases read-only in /studio/kanonik, but Siapkan offers only the school's own releases. | kanonik/page.tsx:52-74; pengajar.ts:240 |
| CNT-J04 | SUPPORTED — J4.1 (D-029: a school package beside distributed content) | **DISCONNECTED** | Central content cannot be assigned from Siapkan. Local content is a separate whole course with no link to it. | pengajar.ts:240; studio/unggah |
| CNT-J05 | SUPPORTED — J4.1 (D-007, D-029, D-021) | **UNPROVEN** | Workbook → seven steps → Siapkan is proven only with the platform admin and the school admin. No teacher has done it, and a teacher needs an admin to publish. | S14, S15c, S17, S18; langkah.ts:47-61 |
| CNT-J06 | SUPPORTED — J4.1, J4.2 (the workbook and its media, D-007). Raw sources such as a PDF are J07 | **PARTIAL** | Upload takes only the structured Excel workbook or JSON package, plus the media it names. No raw source material can be uploaded. No teacher has done it. | studio/actions.ts:300-318; S14 (platform admin) |
| CNT-J07 | ENHANCEMENT / LATER — D-007: content v1 is a workbook. Generating lessons or questions from source material has no source | **PARTIAL** | PINTAR turns the workbook into lessons and questions and builds both tests. Nothing generates lessons or questions. | S15c; ADM-14; unggah/page.tsx:12-20 |
| CNT-J08 | SUPPORTED — J4.3 (HOD-04; ADM-10) | **UNPROVEN** | The teacher can preview and run «Periksa isi», but cannot acknowledge findings or approve. Second-person review is proven only with the school admin (S17); /studio/tinjau has never been walked. | paket/page.tsx:186-205; S17; HOD-03 N-T |
| CNT-J09 | SUPPORTED — J4.1, J4.5 (problems per row; content-check findings, ADM-12) | **CONNECTED** | — (the package page was reached by typed URL) | S17: publishing refused in plain words until findings were reviewed, then published; S15b canonical upload refused |
| CNT-J10 | SUPPORTED — J4.1, X.4 (problems per row in Indonesian; D-011). Acting on the fix is M10 | **PARTIAL** | Findings carry «Cara memperbaiki», but no screen edits content. The "returned for correction" line says to fix it, with no editor. The only route is re-uploading as a new course. | paket/page.tsx:43-50; hle.ts:2208,2638; studio/actions.ts:68-113 |
| CNT-J11 | **MISSING REQUIREMENT** — M10 | **PARTIAL** | Corrected content can be published only as a new, unrelated upload. The returned draft cannot be fixed, the teacher lacks CAN_PUBLISH, and this has never been walked. | langkah.ts:47-61; hle.ts:2208 |
| CNT-J12 | **MISSING REQUIREMENT** — M10: D-041 provides withdraw and revision, but how a corrected workbook becomes that revision has no source | **DISCONNECTED** | «Buat salinan untuk diperbaiki» makes a revision that no screen can edit, though its copy says "sunting bebas". «Koreksi» lists only the same course's releases. Any started learner blocks a move. | paket/page.tsx:92,124,210-218; hle.ts:2507; 20261022100000:153 |
| CNT-J13 | SUPPORTED — X.2, J3.8 (sessions record the definition version; D-081(c); D-060) | **UNPROVEN** | Sessions are pinned to their release, moves after a start are refused, and a revision leaves the predecessor's hash intact. Database tests only. | F05-T12, F05-T14, F05-T14b |
| CNT-J14 | **MISSING REQUIREMENT** — M10 | **DISCONNECTED** | No product path sends new students to a corrected release. The revision cannot be edited and «Koreksi» never offers it. After any start the move is refused. | paket/page.tsx:124; 20261022100000:128,153; F05-T14 |

### Assessment journeys

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| ASM-J01 | SUPPORTED — J6.5 (STU-05, STU-06) | **PARTIAL** | The orientation is reached by typed URL (S19, S21). The deliberate press on «Mulai Pemetaan Awal» / «Mulai Uji Penguasaan» is clicked. | journey.mjs:828,975-980; PermukaanAsesmen.tsx:72-110; actions.ts:143-158 |
| ASM-J02 | SUPPORTED — J6.6 (STU-07) | **CONNECTED** | — (only forward «Berikutnya» was used; «Sebelumnya» and the post-test question list were never clicked) | S21 `jawab()` journey.mjs:889-923; ItemPlayer.tsx:519-538,629-648 |
| ASM-J03 | SUPPORTED — J6.6 (STU-07) | **UNPROVEN** | A changed answer is re-sent with a higher client_seq (on the post-test it needs «Simpan jawaban ini» again). Changing an answer is never driven. | ItemPlayer.tsx:284-295,409-430,574-583 |
| ASM-J04 | SUPPORTED — J6.9 (STU-10) | **CONNECTED** | — (but a choice made without «Simpan jawaban ini» is silently dropped at «Kumpulkan», and there is no confirmation before submitting) | S21: «Selesaikan pemetaan»/«Kumpulkan» → /peta, /hasil; 5 OFFICIAL post-tests FINALIZED (journey.mjs:918,1001-1003) |
| ASM-J05 | SUPPORTED — J5.4, J6.9 (the permitted time is the assignment window, EDU-06; at its end nothing may be silently lost, STU-10). No per-test timer exists or is in scope (trace A) | **PARTIAL** | There is no per-test time limit: the session deadline is the assignment's close time, and the orientation shows only the date. The player counts up and never shows time left. Expiry mid-test is never run. | 20260929100000:138; ItemPlayer.tsx:396-404; OrientasiAsesmen.tsx:85-88; hle.ts:3352-3360 |
| ASM-J06 | SUPPORTED — J6.6 (STU-07: reload) | **UNPROVEN** | A reload re-reads the server's answers and replays the outbox, but goes back to question 1 and loses unsaved post-test choices. Never driven. | ItemPlayer.tsx:161-163,268-282 |
| ASM-J07 | SUPPORTED — J6.7, J6.8 (STU-08 per the assessment's rules; the outbox, STU-09) | **UNPROVEN** | The open session survives, and the home puts it first with «Lanjutkan…». Never exercised. | belajar/page.tsx:117-121; siklus.ts:176; aksi.ts:141-144 |
| ASM-J08 | SUPPORTED — J6.8 (STU-09) | **UNPROVEN** | Each answer is written to the outbox before sending, with an offline banner. Database tests only (F09); never run in a browser. | ItemPlayer.tsx:129-137,284-295,499 |
| ASM-J09 | SUPPORTED — J6.8, J6.9 (STU-09, STU-10; the answer outbox is idempotent) | **UNPROVEN** | An unacknowledged entry stays in the outbox and is replayed; the same key is acknowledged rather than duplicated (INV-28). Database tests only. | ItemPlayer.tsx:14-21,214-251 |
| ASM-J10 | SUPPORTED — J6.8 (STU-09) | **UNPROVEN** | The browser's "online" event empties the outbox and records RECONNECT. Never exercised. | ItemPlayer.tsx:268-282,360-377 |
| ASM-J11 | SUPPORTED — J6.5, X.11 (STU-06 'exactly once'; D-046(e)) | **UNPROVEN** | «Kumpulkan» is disabled while finishing, a second finish returns the existing result, and certificate_prepare is idempotent. Never exercised. | ItemPlayer.tsx:303-305,640-647; 20261005100000:212-214 |
| ASM-J12 | SUPPORTED — J6.5 (STU-06 'refusals are understandable') | **UNPROVEN** | may_start_assessment enforces attempt_limit. Finished tests redirect to /peta or /hasil. A finished Uji Cepat reopens as the not-found page. Never exercised. | 20260913090000 may_start_assessment; pemetaan/page.tsx:33; penguasaan/page.tsx:81; asesmen/page.tsx:44-48 |
| ASM-J13 | SUPPORTED — J4.9, J4.3 (HOD-06; D-041) | **DISCONNECTED** | No teacher screen lets a teacher report a question: EDUCATOR lacks CAN_REVIEW_QUESTION_HEALTH and «Laporkan masalah» is not built. Review exists only in Studio /studio/bank, for heads of department and admins. | 20260912004158:60-62; studio/bank/page.tsx:25-31,101-113; mengajar/[kelas]/bukti/page.tsx:40 |
| ASM-J14 | SUPPORTED — J3.8, J7.8 (D-081(c) reproducible; INV-29; D-060) | **UNPROVEN** | Sealed content is immutable, a correction means a new workbook and release, and results are not rewritten. These are database guarantees only; never walked. | 20260929100000 enforce_taught_content_immutable; studio/bank/page.tsx:20-22 |
| ASM-J15 | SUPPORTED — J7.6 (HOD-07: never changes a score) | **UNPROVEN** | Integrity signals are recorded and never scored (assert_integrity_never_scores, database tests only). Human review on /studio/integritas is never walked. | ItemPlayer.tsx:342-377; actions.ts:73-90; selftest/db/fable04.sql:821; studio/integritas/page.tsx:1-9 |

### Results, reports and evidence journeys

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| REP-J01 | SUPPORTED — J6.11 (STU-15) | **PARTIAL** | /hasil is reached by clicking «Kumpulkan», but the post-test itself was opened by typed URL. Only "Terjawab tepat N dari M" is asserted. Nothing says whether the shown target was met. | journey.mjs:979-986; hasil/page.tsx:72-145 |
| REP-J02 | **MISSING REQUIREMENT** — M4 | **MISSING** | The teacher sees names only. Reading one learner's result exists only for HoD/Dean. | DaftarMurid.tsx:35; management_learner_detail; pengajar.ts:33-40 |
| REP-J03 | SUPPORTED — J7.1 (EDU-12) | **PARTIAL** | Class figures come from official evidence (S22: 75%, +35 poin, mastery by part). Misconceptions are absent (D-063), the view is whole-class only, and it was reached by typed URL. | S22; journey.mjs:1013; bukti/page.tsx |
| REP-J04 | **MISSING REQUIREMENT** — M5 | **MISSING** | Teachers have no question-level view. | pengajar.ts:22-26; bukti/page.tsx:43-47 |
| REP-J05 | SUPPORTED — J7.2 (HOD-09) | **PARTIAL** | There is no subject or department performance figure. Classes are never summed (by design), and school figures are refused at department scope. The reader goes class by class (S23). | pimpinan.ts:333-366; pimpinan/page.tsx:209-218; S23 |
| REP-J06 | SUPPORTED — J7.3 (DEA-02, DEA-03) | **WRONG** | The school summary prints raw decimals and competency names without scores. Cohort-comparison rows render blank (the code reads only label/competency/code). /pimpinan shows competency outcomes as a count. No dean walk. | dekan/ringkasan/page.tsx:119-134; 20260923110000:347-360; pimpinan/page.tsx:302 |
| REP-J07 | SUPPORTED — J7.3 (DEA-02 standing; D-060) | **PARTIAL** | Summary → evidence ends at another summary or a sample count. Report pages contain no links. S22 reached Lihat bukti by typed URL. | pimpinan/page.tsx:244; dekan and edukator ringkasan pages (no Link import); journey.mjs:1013 |
| REP-J08 | SUPPORTED — X.5, J7.1 (U-EMPTY; EDU-12 sufficiency explicit) | **UNPROVEN** | Empty states exist (reason per figure, and what will make it appear) but are tested over HTTP only. The misconception card promises a figure that cannot appear (D-063). | DAISY-07-LAPORAN-02; muncul.ts:29-53; hle.ts:2184 |
| REP-J09 | SUPPORTED — J7.1 (EDU-12: 'no fabricated zeros') | **PARTIAL** | Partial figures show have/needed and their reasons. S22 saw comprehension shown and misconceptions absent, but reached the page by typed URL. The misconception condition can never be met. | S22; _intel.ts:30-39; muncul.ts:35; D-063 |
| REP-J10 | SUPPORTED — J7.8 (D-060; evidence sealed to its release) | **UNPROVEN** | Evidence is version-stamped, but class calculators pool all releases and reports show no release or catalogue version. Never exercised. | 20260918110000:136-162; bukti/page.tsx:32-36; ringkasan pages |
| REP-J11 | SUPPORTED — J7.8 (D-060; immutable results) | **DISCONNECTED** | Every view stores a snapshot in generated_reports, but nothing in src/ reads it, so a person cannot reopen a past report. | 20260918120000:299-307; no "generated_reports" in src/ |
| REP-J12 | ENHANCEMENT / LATER — No source agrees an export or print of reports in 4.0 | **MISSING** | No export or print on /pimpinan or the report pages (only certificates have print). No agreed checklist row. | sertifikat/AksiCetak.tsx:13 |

### Certificate journeys

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| CERT-J01 | SUPPORTED — J8.1 (D-078 amended; D-081; D-082(d)) | **UNPROVEN** | S21 reaches the pre- and post-tests by typed URL and skips the lessons. The full cycle was clicked only on staging, on older commits. | journey.mjs:958; reality audit §6 row 12 |
| CERT-J02 | SUPPORTED — J8.1 | **WRONG** | A single Uji Cepat is certificate-eligible, against D-082(d). The pass mark is a hard-coded 0.6, not set by the school (D-081). | 20260914093000:62; 20260914103000:177; ItemPlayer.tsx:159,327; asesmen/[penugasan]/page.tsx:59; 20261010100000:127; BOB-50 held |
| CERT-J03 | SUPPORTED — J8.1, J8.2 (STU-17) | **UNPROVEN** | Never issued outside tests. Synthetic (staging) evidence can never be eligible, and the production key has no recovery copy (REL-09). | api/certificates/issue/route.ts:27-77; sertifikat.ts:143-156; F04-T09, F04-S04 |
| CERT-J04 | SUPPORTED — J8.2, J8.4 (STU-17; D-076, D-080) | **PARTIAL** | «Sertifikat» list rows link to /belajar/<session_id>/sertifikat (the map is keyed by assignment id but read by session id). my_cycle_state then raises → error page. Only result → «Langkah berikutnya» reaches the certificate. | belajar/sertifikat/page.tsx:52-60,81,95; [tugas]/sertifikat/page.tsx:60; 20261010100000:543-546; lanjut/page.tsx:86-98; DAISY-40 held |
| CERT-J05 | SUPPORTED — J8.2 (STU-17 'issued → actions'; D-080 physical proof). The actions are not enumerated | **UNPROVEN** | Printing uses the browser's print on the ISSUED page's A4 sheet. There is no download file, and it has never been run because no certificate has ever been shown. | AksiCetak.tsx:11-16; [tugas]/sertifikat/page.tsx:179-194 |
| CERT-J06 | SUPPORTED — J2.4, J8.3 (D-077 name confirmation; sealed at issuance). A photo is not part of the certificate (name only): tension T4 | **PARTIAL** | No photo is shown (NAME_ONLY; OD-10 open). The name is sealed from the snapshot, but the course and school name are read live, not as at issuance (D-078(c); BOB-48 TODO). | KartuSertifikat.tsx:21-23; [tugas]/sertifikat/page.tsx:79-85; 20260914103000:261-262 |
| CERT-J07 | SUPPORTED — J8.6 (PUB-03; D-080: the number and link) | **UNPROVEN** | The QR encodes the public /verifikasi/<token>. It has never been opened with a real token, because none exists. | KodeVerifikasi.tsx:16; [tugas]/sertifikat/page.tsx:120-122; proxy.ts:42 |
| CERT-J08 | SUPPORTED — J8.6 (PUB-03) | **UNPROVEN** | The page has never been opened with a valid token. BERLAKU is shown only by calling the route handler directly in a test. | verifikasi/[token]/page.tsx:81-137; api/verifikasi/[token]/route.ts:51-80; F04-S05, F04-T10 |
| CERT-J09 | SUPPORTED — J8.6 (PUB-04) | **CONNECTED** | — (a tampered signature, TIDAK SAH, is tested only at handler level, F04-S05) | P1: a random token → API 404 {found:false} and the page says «tidak ditemukan» (anonymous browser); F01-R07 |
| CERT-J10 | SUPPORTED — J8.3 (D-078(c); D-077(d)) | **WRONG** | The signature stays valid (the payload is stored). But the printed course and the verified school name are read live, so later edits change historical certificates (D-078(c)). | [tugas]/sertifikat/page.tsx:83-85; 20260914110000:158; F04-T09, F04-S04 |
| CERT-J11 | SUPPORTED — J8.7 (D-066(c): versioned keys) | **UNPROVEN** | Rotation exists in code (every key version is loaded; verification uses the stored version). Only a static test exercises it, and no key is backed up (REL-09). | keyring.ts:38-68,91-100; api/verifikasi route.ts:79; F04-S03; D-066(c) |

### High-probability reality scenarios

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| RS-01 | SUPPORTED — J2.21 (ADM-08). Students with email accounts: M2 | **MISSING** | No student password exists. A forgotten PIN sends the student to a teacher who cannot re-issue it, so an operator is required. | hle.ts:1914; 20261005110000:219; ADM-08 and U-RECOVER NOT BUILT |
| RS-02 | SUPPORTED — J2.20 (D-009: a card session ends after 60 min idle; first name only, D-020). Tension T1 | **UNPROVEN** | By design nothing locks a card session for 60 idle minutes (C4: class cards unchanged); the student returns to the same live session. Never walked on main. | sesi.ts:20-25; proxy.ts:80-98; IDENTITY-4.0 §7; STU-19, X-13 |
| RS-03 | SUPPORTED — J2.9, J2.20 (X-13; D-020; «Bukan akun Anda?»). Tension T1 | **PARTIAL** | A switch exists («Bukan akun Anda? Keluar» on every screen). Until someone presses it, the second student is inside the first student's session and sees their work. Never walked. | BarisSesi.tsx:11-19,59; belajar/page.tsx:88-92 (first name only) |
| RS-04 | SUPPORTED — J2.21 (ADM-08). A staff card is digital (C17) | **MISSING** | School staff cannot re-issue or revoke a card. A found card works, because the PIN is printed on it. | 20261005110000:213-222; hle.ts:1901; ADM-08 NOT BUILT |
| RS-05 | SUPPORTED — J6.3 (STU-11) | **UNPROVEN** | The page reached is saved to the server and to the device, and the home links the next unread lesson. Never run on main; a failed save is silent. | LessonPlayer.tsx:92-98,120-128; belajar/page.tsx:182-185 |
| RS-06 | SUPPORTED — J6.8 (STU-09) | **UNPROVEN** | Outbox plus «Sedang luring…»; finishing while offline is refused with «Belum tersambung…». Never run in a browser. | ItemPlayer.tsx:303-310,499; hle.ts:2446,2699 |
| RS-07 | SUPPORTED — J6.5, X.11 (STU-06; D-046(e)) | **UNPROVEN** | The button disables but its wording does not change; the finish is idempotent. Never exercised. | ItemPlayer.tsx:640-647; 20261005100000:212-214 |
| RS-08 | **MISSING REQUIREMENT** — M3 | **PARTIAL** | Low results get «Belum tepat» and directions. «Apa berikutnya» offers no remediation or retry, and may say all assigned work is done. Low scorers reached /hasil in S21; /lanjut never. | hasil/page.tsx:147-151; lanjut/page.tsx:131-138; hle.ts:2441-2443 |
| RS-09 | SUPPORTED — J6.13 (STU-18) | **PARTIAL** | With only finished chapters the home has no next-step panel, yet still says «Ini yang sedang berjalan hari ini.». The "nothing else waiting" message exists only on /lanjut. Never walked on main. | siklus.ts:186-189; belajar/page.tsx:215-219; hle.ts:2389 |
| RS-10 | SUPPORTED — J5.5 (EDU-07, EDU-08) | **PARTIAL** | Intent → class → chapter → launch → students answer exists, though never clicked on main. It breaks at "useful results": only a submitted count, no score and no per-question view. | uji-cepat/page.tsx:126-153; BOB42-S01 (database only); EDU-10 |
| RS-11 | SUPPORTED — J5.5, X.10 (no time target is set for preparing an Uji Cepat). Writing new questions on the spot is tension T2 | **PARTIAL** | Three short stages with defaults, but a hidden prerequisite: the class must already hold published, assigned material with enough QUICK-tier questions. Speed has never been measured. | uji-cepat/page.tsx:163,239-240; 20261020100000:163-166 |
| RS-12 | **MISSING REQUIREMENT** — M5 | **MISSING** | After the quiz the teacher gets only who submitted (/siapa). There are no scores and no per-question or per-student understanding. | siapa/page.tsx:14-33; uji-cepat/page.tsx:126-133 |
| RS-13 | **MISSING REQUIREMENT** — M10 for the correction. History staying as recorded is in scope (J3.8, D-041; BOB-36) | **DISCONNECTED** | The teacher cannot flag a question («Laporkan masalah» is not built) or reach Question Health review (HoD/admin, 30 answers). A fix needs an editor that no screen has. | REL-13 NOT BUILT; bank/page.tsx:46; HOD-06; hle.ts:2507 |
| RS-14 | SUPPORTED — J4.1, J1.5 (D-029; SYS-05) | **DISCONNECTED** | Central (distributed) content never reaches Siapkan, so local and central content cannot sit side by side for a class. | pengajar.ts:240; 20261010100000:471 |
| RS-15 | SUPPORTED — J3.5 (ADM-06: the school admin gives a Guru role at the Kelas) | **PARTIAL** | A substitute sees the class only after the platform admin grants Guru; the school admin cannot grant staff roles. There is no handover context. | ADM-06 NOT BUILT; S12 (grant form, platform admin); reality audit §6 #5 |
| RS-16 | SUPPORTED — J3.5, J2.3 (ADM-05, ADM-06; activation) | **PARTIAL** | Once granted, the new teacher sees the existing assignments and evidence. Onboarding needs the platform admin (the person was created by direct POST in S12), and sign-in is by magic link only (2 per hour). | S12, S13; api/akun/aktivasi/route.ts:52-58; reality audit §6 #5, #8 |
| RS-17 | SUPPORTED — J3.6 for the intake (ADM-07: one upload per class). Cards for the whole class are M7 | **PARTIAL** | Bulk intake by file exists (screen unwalked; the audit used RPC). Cards are one person and one press each, PIN shown once, no print sheet. | BacaDanPetakan.tsx; journey.mjs:347-369, 926-950; FormAktivasi.tsx:94-101 |
| RS-18 | **MISSING REQUIREMENT** — M9 | **MISSING** | No mid-term class move for a single student (see ADM-J13). | 20261014100000:44-46; 20260912004527:223-250 |
| RS-19 | SUPPORTED — J3.10 (ADM-19, P2: a governed transfer to another school) | **DISCONNECTED** | The form asks for "Kode sekolah/tahun ajaran tujuan" but accepts only internal UUIDs, which no screen shows. An executed transfer arrives without a Kelas. Never walked. | konfigurasi/page.tsx:470-471; hle.ts:2022-2023; konfigurasi/actions.ts:66-73; 20260912004527:146-149; ADM-19 N-T; F01-T10 (DB) |
| RS-20 | SUPPORTED — J9.2, J9.4 (D-069, D-070: admin enrols, facilitator assigns, Dekan reads completion). Tension T3 | **MISSING** | Educator-as-learner (D-069/D-070, BOB-43..47) is not built: no PD place, no staff enrolment, no completion record. | J9.1-J9.8 not built |
| RS-21 | SUPPORTED — J7.3, J7.5 (DEA-02; DEA-04) | **PARTIAL** | There is no principal role; the nearest is a dean at the school root. The dean's /pimpinan has never been walked, school figures need ≥10 learners, counts are meaningless (T1), and speed was never measured on main. | D-010; BOB06-R01; U-PERF; pimpinan/page.tsx:296-307 |
| RS-22 | SUPPORTED — J8.6, X.6 (PUB-03; U-DEVICE) | **UNPROVEN** | The public page exists and shows status, result, predikat, school and date (no name, by design). It has never been opened with a real token. | verifikasi/[token]/page.tsx:91-139; hle.ts:1783; P1 (random token only) |
| RS-23 | SUPPORTED — J2.14, J2.18, X.3 (sends logged and limited; no false success). Diagnosis is M8 | **WRONG** | A provider throttle (429; the limit is per project) is folded into «Periksa email Anda… tautan masuk sudah dikirim». The screen implies success when nothing was sent. No activation or recovery email exists. | masuk/actions.ts:61-73,101-104; LayarMasuk.tsx:139-147; hle.ts:1884-1889; staging 30 Sep (535, then 429) |
| RS-24 | SUPPORTED — J2.11, J2.12 (self-service recovery; C5 platform-admin reset) | **PARTIAL** | Staff have no password (magic link only). A new link works if it arrives; if not, only the platform admin's replacement-admin workaround remains, and the original account is unrecoverable. | masuk/actions.ts:73; route.ts:53; U-RECOVER NOT BUILT; reality audit §6 #8, #15 |
| RS-25 | SUPPORTED — X.11 (D-046(e) never submitted twice; D-047) | **PARTIAL** | Forms lock on submit (source-read test only) and the database refuses a duplicate assignment. Never run on a slow network. Sign-in resend always says "sent". Report links show no working state and have no loading screen. | TombolKirim.tsx:42-64; DAISY-17-KIRIM-01 (static); 20261010100000:484; masuk/actions.ts:73 |

### “Boring but deadly” browser scenarios

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| BD-01 | SUPPORTED — J6.5, J6.9, X.3 (exactly once; truthful state) | **UNPROVEN** | Back to a finished chapter test redirects to /peta or /hasil. Back to a finished Uji Cepat gives the not-found page. Never exercised. | pemetaan/page.tsx:33; penguasaan/page.tsx:81; asesmen/page.tsx:44-48 |
| BD-02 | SUPPORTED — J6.6 (STU-07 reload) | **UNPROVEN** | A lesson resumes at its saved page. An assessment reload goes back to question 1 and drops unsaved choices. Result pages re-read the server. Never exercised. | LessonPlayer.tsx:92-98; ItemPlayer.tsx:161-163; hasil/page.tsx:37-38 |
| BD-03 | SUPPORTED — X.11 (D-046(e)) | **UNPROVEN** | Form buttons block a second submit (TombolKirim); finishing and certificate_prepare are idempotent. Never exercised. | TombolKirim.tsx; ItemPlayer.tsx:303-305; 20261005100000:212-214; api/certificates/issue/route.ts |
| BD-04 | SUPPORTED — X.3, X.11 (truthful refusals; D-011). No rule names stale tabs | **UNPROVEN** | One outbox key per answer, PR001 renumbering, a "session closed" notice when another tab finishes, and lesson progress that never goes backwards. Selftests only. | ItemPlayer.tsx:83-95,234-247,624-628; 20260913093000:160-187 |
| BD-05 | SUPPORTED — X.3, X.11 (D-047; D-011). What happens to unsaved input is not specified | **UNPROVEN** | There is no designed answer for an action taken after idle expiry, except on /aktivasi. The proxy redirects page requests to /masuk. Never exercised. | proxy.ts:105-112; hle.ts:2733; sesi.ts:20-25 |
| BD-06 | SUPPORTED — X.11 (D-047: never leave the user wondering) | **UNPROVEN** | «Memulai…», «Mengirim jawaban yang tertunda…» and «Tersimpan» exist. «Kumpulkan» only disables. The lesson page always says «Posisi bacaan tersimpan.» even when the save failed. Never exercised. | TombolKirim.tsx; ItemPlayer.tsx:500,582,640-647; pelajaran page:88; LessonPlayer.tsx:127 |
| BD-07 | SUPPORTED — X.5 (U-EMPTY) | **PARTIAL** | Student and management empty states exist (S11; S16's queue sentence). The admin home gives no next action, the department roster is falsely empty, the misconception card over-promises, and U-EMPTY was never tested. | ADM-02, U-EMPTY; pimpinan.ts:412-417; S16 |
| BD-08 | SUPPORTED — J5.8, J7.1 (EDU-09; EDU-12) | **WRONG** | Lihat bukti collapses three states into two. Learners who started but did not submit are counted as «Belum mengerjakan» / "Not yet attempted". The started count is computed but never shown. Only 5/5 was run. | KeadaanHariIni.tsx:76-80; hle.ts:3219; pengajar.ts:382-386,409; S22 |
| BD-09 | SUPPORTED — X.2 (U-AUTH) | **UNPROVEN** | Refusal is shown over HTTP only: a student gets a calm refusal with no content on /konfigurasi and /pimpinan. Not run in a browser on main. | F01-R02; UX1-PIMPINAN-AKSES-01; aktivasi/page.tsx:42-46 |
| BD-10 | SUPPORTED — X.2, J10.2 (fail closed; PINTAR's own pages) | **UNPROVEN** | Never exercised. The code predicts a 404 for /belajar/<tugas>. A certificate bookmark after leaving the class or assignment makes my_cycle_state raise → error page, not the intended refusal. | belajar/[tugas]/page.tsx:31-32; [tugas]/sertifikat/page.tsx:60-65; 20260913093000:121-126 |
| BD-11 | SUPPORTED — J2.9 (STU-19: Back and refresh do not resume) | **UNPROVEN** | The server refuses the pre-sign-out cookie (F01-R05), but browser Back after «Keluar» has never been run. | keluar/route.ts:18-23; lib/keluar.ts:13-17; F01-R05 |
| BD-12 | SUPPORTED — J2.9, J2.10 (this device only; 'Keluar dari semua perangkat', D-055) | **UNPROVEN** | Two sessions coexist and Keluar ends only this device (HTTP test). A magic link fails on a second browser (S1b), so each device needs its own link. | BOB05-R01; lib/keluar.ts:13-17; S1b NOTE; TukarTautan.tsx:66-79 |
| BD-13 | SUPPORTED — J8.3, J2.17 (D-077(d)(e); dated roles and append-only enrolments, D-059(f)) | **PARTIAL** | Role changes keep history (rows are revoked and re-granted, never edited). Class change is missing. There is no admin name correction, yet any user can rename themselves via the API, unaudited, which rewrites the live name shown on historical records. | 20261018100000:42-50; 20260912004431:307-311; D-077 |
| BD-14 | SUPPORTED — J3.3, J3.4 (deactivate with confirmation; history preserved, ADM-21) | **PARTIAL** | A deactivated class disappears from /mengajar and its pages refuse, so there is no historical viewing. An ENDED class (classes.status) stays fully actionable. Never exercised. | mengajar.ts:138; pengajar.ts:171; 20261010100000:474 |
| BD-15 | SUPPORTED — J3.3, J2.21, J4.3 (ADM-03; ADM-08; D-041 withdraw; D-077(e)). No general undo; each object has its own correction | **PARTIAL** | Undo exists for structure, roles, a DRAFT intake (walk away before Konfirmasi) and transfers (reject); none was clicked. No correction for a wrong person record, email, card or class. | PanelStruktur.tsx:271-366; konfigurasi/actions.ts:103-138; pendataan/actions.ts:60-82; persons_no_delete |

### Cross-cutting: “what happens next?” (§15, one row per role)

| Item | Scope, with source or reason | Implementation | Where the human journey breaks | Evidence |
|---|---|---|---|---|
| X-15-STU | SUPPORTED — D-047; J6.1, J6.13 (STU-03, STU-18). 'This topic needs attention' is M3 | **PARTIAL** | The home's next step is proven by clicking (S11, S19). After a result, «Apa berikutnya» and «Tidak ada lagi yang menunggu» exist but were never walked on main (S21 used typed URLs). | S11, S19, S21; hasil/page.tsx:148; lanjut/page.tsx:134-136 |
| X-15-EDU | SUPPORTED — D-047; J5.8 ('who has not handed in'). 'Most struggled with Q4' is M5 | **PARTIAL** | «Mengumpulkan X/Y» is shown (S22, typed URL). The teacher cannot see which question caused difficulty (no item read; misconceptions absent). There is no Uji Cepat score, and halfway learners are mislabelled. | S22; bukti/page.tsx:40-44; EDU-10; D-063; KeadaanHariIni.tsx:76-80 |
| X-15-ADM | SUPPORTED — D-047; J3.2 (ADM-02 remaining setup) | **PARTIAL** | Refusals carry reasons (S8; S17's findings gate). Konfigurasi shows no setup status, pending work or account-readiness summary, and the health card is platform-admin only. | S8, S17; ADM-02; konfigurasi/page.tsx:173-182 |
| X-15-MGT | SUPPORTED — D-047; J7.3, J7.5 (DEA-02 standing; DEA-04 queue) | **PARTIAL** | The queue sentence is clear (S16). There is no «start here» beyond referrals and no "changed because". Readiness shows as a tier count (T1), and a department head is told «no figures» above classes that have them. | S16; pimpinan/page.tsx:143-152,180-181,296-307; READINESS-TIERS T1 |
