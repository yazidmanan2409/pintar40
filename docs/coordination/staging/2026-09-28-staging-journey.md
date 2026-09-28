# Staging journey for the 5 Oct internal test (D-050), 28 Sep

**Question (Yazid, 28 Sep, scope corrected by D-050):** does the whole learning journey work on real staging, through PINTAR's own screens: school and content set-up → lesson prepared → pre-test MCQ → publish → assign to the synthetic class → a synthetic student signs in through the real student flow → opens the assigned learning → completes the pre-test → progresses through the lesson → completes the post-test → sees the result or next state → the educator sees the corresponding evidence? And, separately, do the MCQ Question Bank workflows intended for this phase work? Video, audio and presentations are out of scope.

**Where:** https://staging.pintarselalu.com, in **Sekolah Uji Kinerja (sintetis)** only (D-046(c)), as its synthetic school admin and synthetic teacher, with synthetic students the admin records and activates on the way (approved 28 Sep). Content: SD 5 Matematika Bab 1 (6 lessons, 28 questions: 4 marked for the pre-test, 8 for the post-test).

**How:** `staging · learning journey (D-050)` (`.github/workflows/staging-journey.yml`, `audit/staging/journey.mjs`), dispatch only, from `main`. Every action is a click on PINTAR's own screens. Staging's database is only read, in read-only transactions, to confirm what the screens claim. Each student answers to a plan (how many right), so the result pages are checked against numbers known in advance.

**Evidence runs** (`staging · learning journey (D-050)`, all on 28 Sep, staging serving the commit under test):

| Run | What it proves |
|---|---|
| **6** (36384235023) | J00–J05 in one piece: sign-in, intake, cards, the teacher's upload, and Studio to **published** with two people (33 warnings reviewed one by one). J06 stopped on a harness wait. |
| **7** (36385162363) | Continuing from run 6's published lesson (`reuse_published`, recorded as such): J06–J14 and Q1–Q5: assign, five students through both tests and the lessons, results, the teacher's evidence, Bank Soal, Uji Cepat. **The student half of the proof.** |
| **8** (36386479657) | J00–J06 again in one piece (fresh upload → published → assigned). Its student steps do not count: run 7's assignment of the same lesson was still open in the same class, so the students' home showed that one (test-data collision). |
| 1, 2, 4, 5 | Harness problems, fixed as found (a boolean read as `true`; a redirect racing the next page; an acknowledgement counter reading the page too early). Run 4 was cancelled by the coordinator in error while it was working. |

## Results by step

Classes for anything not PASS: **P** product defect · **W/U** wording/UX · **S** test-data/setup · **H** harness.

| Step | What was done, by whom | Result | Evidence (run) |
|---|---|---|---|
| J00 | Synthetic admin and teacher open their homes | PASS (sign-in is a server-made session: the synthetic addresses get no mail; see *Exceptional setup*) | 6, 7, 8 |
| J01 | Admin saves the school code on Pendataan | PASS (code `UJK`, saved once, run 2) | 2 |
| J02 | Admin pastes 5 names, maps Tempat = Kelas Uji Kinerja A, Peran = Murid, Periksa → Ya, catat → Mulai mencatat | PASS: 5/5 PROVISIONED, enrolled, "Selesai" shown | 6, 7, 8 |
| J03 | Admin makes a class card for each (Aktivasi → Buat kartu kelas) | PASS: 5/5 (numbers and PINs masked) | 6, 7, 8 |
| J04 | Teacher uploads SD 5 Bab 1 workbook: Periksa buku kerja → media → Simpan ke Studio | PASS: 6 lessons, 28 questions, pre-test 4, post-test 8 (media uploaded because Studio requires them; not played, D-050) | 6, 8 |
| J05 | Teacher: tersusun, lolos pemeriksaan, ajukan. Admin: setujui, buat, kunci, reviews 33 warnings, terbitkan | PASS: PUBLISHED. The teacher is never offered Setujui/Kunci/Terbitkan. **UX-01:** the question check first runs at Kunci terbitan, so the reviewer approves with nothing to review and then acknowledges 33 warnings one at a time | 6, 8 |
| J06 | Teacher: Mengajar → kelas → Siapkan → the release → until +30 days → Sediakan | PASS: assigned; pre-test (4) and post-test (8) OPEN | 7, 8 |
| J07 | Student 1: /masuk → Gunakan kartu kelas → card + PIN | PASS: lands on /belajar, tour skipped, "Halo, Siswa", next action "Mulai dari Pemetaan Awal" | 7 |
| J08 | Student 1 opens the lesson, starts and answers the pre-test (2 of 4 right by plan) | PASS: FINALIZED, 50%, lands on the reading map | 7 |
| J09 | Student 1 reads all 6 lessons to their last page by clicking | **FAIL (P, BOB-22):** every lesson saves N-1 of N pages (1: 4/5, 2: 3/4, 3: 2/3, 4: 4/5, 5: 0/1, 6: 0/1); none counts as read | 7 (DB read confirms) |
| J10 | After reading: a way to Uji Penguasaan by clicking | **FAIL (P, BOB-22):** no link on the home, the assignment page or the last lesson; home stays "Peta bacaan sudah siap"; every lesson still says "Mulai" | 7 |
| J11 | Student 1 takes the post-test (7 of 8 right by plan) | PASS **only by typing the address** `/belajar/<tugas>/penguasaan` (workaround for J10, recorded); FINALIZED 88% | 7 |
| J12 | Student 1 reads the result | PASS: "88%", "Terjawab tepat 7 dari 8 soal", threshold 60%, "50% → 88%", 8 questions to review, no rank or class average. "Apa berikutnya" not proven (harness did not wait for it; fixed after) | 7 |
| J13 | Students 2–5: card sign-in, pre-test, a lesson, post-test (typed address), result | PASS: 25%→75%, 0%→63%, 75%→100%, 50%→50%, each exactly as planned; the database's mastery matches every page | 7 |
| J14 | Teacher: Lihat bukti; Langkah → who has not handed in | PASS for participation ("Mengumpulkan 5 / 25 · Pemetaan awal", "Belum mengerjakan 20"; Langkah links to the list). **Class figures NOT PROVEN (S):** all sessions in the synthetic school are `SYNTHETIC` evidence (0 official results), and class figures use official evidence only, so every figure honestly reads "Belum ada bukti yang memenuhi syarat (0/5)". **UX-06:** the page counts only the pre-test, not the post-test | 7 (DB read confirms) |
| Q1–Q2 | Bank Soal as teacher and as admin | PASS: the upload's 28 questions listed, none from another school. **UX-02:** read-only; every question says "Belum cukup bukti…" | 2, 5, 6, 7, 8 |
| Q3 | Teacher launches an Uji Cepat (5 questions, 10 min) from Bab 1 | PASS: "Uji Cepat sedang berjalan", 0 / 25 | 7 |
| Q4 | Student 1 finds it under "Bisa dikerjakan sekarang", takes it | PASS: FINALIZED (60%, 3 of 5 by plan). **UX-05:** it is titled "Uji Penguasaan" | 7 |
| Q5 | Teacher sees the hand-in | PASS: "Sudah mengumpulkan 1 / 25"; Siapa lists student 1 as handed in (the harness's case-sensitive match reported FAIL; fixed after) | 7 |
| Q6 | Question health (Head of Department) | NOT RUN: no Head of Department in the synthetic school; a health signal needs 30 answers per question | — |

**The MCQ Question Bank in this phase, as built:** questions enter only through the workbook upload (with Pemetaan awal / Cek penguasaan marks); Bank Soal lists them read-only; the question check and its per-warning review sit on the package page; Uji Cepat draws from the bank. There is **no screen to edit, retire or add a single question**: a correction means uploading a corrected workbook (a new course). Proven: upload, listing and scoping, the check and its review, Uji Cepat. Not proven: question health (Q6).

## Defects and findings

| # | Class | What | Where it goes |
|---|---|---|---|
| D1 | **P** | A lesson read to its last page never counts as read (0-based save vs a count rule), so no click leads to the post-test | **BOB-22**, 5 Oct blocker |
| D2 | **S** (config) | Staging sends at most 2 sign-in emails per hour | Yazid: raise it before 5 Oct (see *Staging accounts*) |
| D3 | **S** (by design) | Class figures never appear in a synthetic school; not provable in Sekolah Uji Kinerja | Yazid: prove them another way (below) |
| D4 | P (product gap) | Misconception codes cannot be registered anywhere, so every question warns at publish | Yazid decision, then Bob (board, Lana lane) |
| D5 | P, *source only* | "Buat salinan untuk diperbaiki" does not copy a question's pre-test/post-test mark (`create_course_revision` predates `items.cycle_role`), so a corrected copy would lose its tests | Bob to confirm; not on the D-050 path |
| UX-01…06 | W/U | See `docs/coordination/ux/UX-POLISH-REGISTER.md` | Daisy (and Bob for UX-01) |
| H1–H6 | H | Harness fixes in runs 1–8 | fixed |

## Exceptional setup actions (recorded, not repairs)
- Staff sign in with a server-made session (the harness's own; their addresses receive no mail). Students sign in through the real card flow.
- The workbook's four media files were uploaded because Studio will not save the workbook without them; none was played.
- Nothing on staging was written except by pressing PINTAR's buttons; the database was only read, in read-only transactions.
- Left behind in the synthetic school (removed with the staging reset): 5 copies of SD 5 Bab 1 (runs 6 and 8: published and assigned; runs 2, 4 and 5: stopped at lock), 30 synthetic students (their cards were never kept), one Uji Cepat. No data was repaired.

## Staging accounts: what exists for the testers today (read 28 Sep)

| | State on staging |
|---|---|
| People | Gladys (the one platform admin) and the synthetic staff and students of Sekolah Uji Kinerja. **No tester account exists yet.** |
| SD Zayd Pintar Selalu, SMA Zayd Pintar Selalu | No school code, no Bagian/Tingkat/Kelas, no staff, no students. SD Zayd holds one unpublished draft (SD 5 Bab 1, imported 24 Sep). |
| Creating staff | Only the platform admin can create a staff person (Aktivasi → "Orang baru di luar pendataan"; intake records students only). A person created that way has no relationship with a school yet, so their first role there is given by the platform admin too (D-049); after it, the school admin can give further roles. One form per person, then one grant per person. |
| Creating students | The school admin records them (Pendataan, a pasted list) and makes class cards (Aktivasi). The PIN is shown once; a lost card cannot be re-issued (ADM-08 is not built). |
| Staff sign-in | By email link, valid one hour, to be opened in the same device and browser. **Staging sends at most 2 sign-in emails per hour for the whole project** (`rate_limit_email_sent = 2`, read by the workflow's `limits` mode, run 36382909677); a second email to the same address waits 60 s (`smtp_max_frequency`). Students sign in with cards and send no email. |

## Tester readiness package

| Item | State |
|---|---|
| One-page tester brief in Bahasa Indonesia | Drafted: `docs/onboarding/PINTAR-Panduan-Penguji-5-Okt.md` (the D-050 sentence, sign-in, test data only, what to try by role, one problem per report, what to do when completely blocked). |
| Report form | The Google Form exists (Yazid, 27 Sep; `TESTER-REPORT-FORM.md`); not yet sent to the testers (D-045: sent when PINTAR is ready). |
| Accounts | Not provisioned (above). |
| UX Polish Register | `docs/coordination/ux/UX-POLISH-REGISTER.md`. |

## Remaining blockers before 5 Oct

| # | Blocker | Owner | Size |
|---|---|---|---|
| 1 | **BOB-22:** a lesson never counts as read, so students cannot reach Uji Penguasaan by clicking | Bob; coordinator gates and re-runs the journey | small |
| 2 | **Sign-in emails:** staging sends 2 per hour; ~150 staff testers need one each (and again on a new device) | Yazid: approve raising `rate_limit_email_sent` on staging and confirm the mail host's own hourly limit; the coordinator applies and reads it back | a setting |
| 3 | **Tester accounts:** none exist; SD Zayd and SMA Zayd have no code, structure or people | Yazid and Gladys's team: the tester list by role and school; the platform admin creates each staff person and gives the first role | ~2 actions per staff tester |
| 4 | **Content for testers:** SD Zayd's Bab 1 copy is an unpublished draft; SMA has none | Gladys's team (publishing is part of the test) or Lana's chapters as they pass the gate | — |
| 5 | **Class figures not yet shown anywhere:** they need official evidence (a real school, 5+ students through both tests); the synthetic school cannot show them by design | Yazid: accept that testers will be the first to see them, or allow one check in a real school | decision |

## Readiness

**Technical (the journey works on staging):** yes, apart from one defect. Upload, the question check, two-person publishing, assignment, card sign-in, the pre-test, lessons, the post-test, scoring and results all work through the screens, and every result matched the answers given. The one break is BOB-22: without typing an address a student cannot get from the lessons to the post-test.

**Tester-facing usability:** not yet. Beyond BOB-22, a tester will meet 33 one-by-one warning reviews per lesson (UX-01), a Bank Soal with nothing to act on (UX-02), an Uji Cepat titled Uji Penguasaan (UX-05), and an evidence page that counts only the pre-test (UX-06). None stops a tester, but each will be reported many times over; the brief warns about two of them.

**Operationally (can 150 people start on 5 Oct):** **not ready today.** No tester account exists, staging sends two sign-in emails an hour, and the test schools are empty. All three are fixable this week (items 2–4 above) if the tester list arrives early enough for the platform admin to create the staff accounts.

**Recommendation:** go for 5 Oct only if, by 2 Oct, BOB-22 is merged and the journey re-run green on staging, the email limit is raised and read back, and the tester accounts and school structure exist for at least the first cohort. Otherwise start with a smaller first cohort (Gladys's core team) on 5 Oct and widen once sign-in has held.

