# Staging journey: lessons and MCQs end to end (D-050), 28 Sep

**Where PINTAR is (D-052):** working toward **ENGINEERING COMPLETE**. 5 Oct is a tentative milestone, not a gate.

**Question (Yazid, 28 Sep, scope corrected by D-050):** does the whole learning journey work on real staging, through PINTAR's own screens: school and content set-up → lesson prepared → pre-test MCQ → publish → assign to the synthetic class → a synthetic student signs in through the real student flow → opens the assigned learning → completes the pre-test → progresses through the lesson → completes the post-test → sees the result or next state → the educator sees the corresponding evidence? And, separately, do the MCQ Question Bank workflows intended for this phase work? Video, audio and presentations are out of scope.

**Where:** https://staging.pintarselalu.com, in **Sekolah Uji Kinerja (sintetis)** only (D-046(c)), as its synthetic school admin and synthetic teacher, with synthetic students the admin records and activates on the way (approved 28 Sep). Content: SD 5 Matematika Bab 1 (6 lessons, 28 questions: 4 marked for the pre-test, 8 for the post-test).

**How:** `staging · learning journey (D-050)` (`.github/workflows/staging-journey.yml`, `audit/staging/journey.mjs`), dispatch only, from `main`. Every action is a click on PINTAR's own screens. Staging's database is only read, in read-only transactions, to confirm what the screens claim. Each student answers to a plan (how many right), so the result pages are checked against numbers known in advance.

**Evidence runs** (`staging · learning journey (D-050)`, all on 28 Sep, staging serving the commit under test):

| Run | What it proves |
|---|---|
| **6** (36384235023) | J00–J05 in one piece: sign-in, intake, cards, the teacher's upload, and Studio to **published** with two people (33 warnings reviewed one by one). J06 stopped on a harness wait. |
| **7** (36385162363) | Continuing from run 6's published lesson (`reuse_published`, recorded as such): J06–J14 and Q1–Q5: assign, five students through both tests and the lessons, results, the teacher's evidence, Bank Soal, Uji Cepat. **The student half of the proof.** |
| **8** (36386479657) | J00–J06 again in one piece (fresh upload → published → assigned). Its student steps do not count: run 7's assignment of the same lesson was still open in the same class, so the students' home showed that one (test-data collision). |
| **10** (36391571297) | LANA-01 round 2 (`content_ref` `69398c9`): J04–J07 on Lana's Bab 1 (5 text lessons, 31 questions): upload, publish with two people (31 warnings reviewed), assign. Its student steps stopped on a harness assumption (H): the class holds earlier runs' Bab 1 assignments, so the home's next-action panel showed another one, and this run's was linked only from its card; fixed in `1afae39` (open from the panel or the card). |
| **11** (36393140655) | LANA-01 again, with that fix: J04–J08 and J11–J13 PASS; five students' results equal the plan. J09/J10 FAIL (P, BOB-22, as before). J14: the evidence page's "Keadaan hari ini" showed run 8's still-open Uji Cepat ("1/45") instead of this assignment (S: leftover open activity in the class; the one-activity view is UX-06). |
| **12** (36395986289) | **BOB-22's acceptance** on `main` `b1c55a1` (LANA-01's Bab 1): J00–J13 PASS. J09: every lesson saved in full and read; J10: the post-test linked from the home, the assignment page and the last lesson; J11 reached it by a link (no typed address). J09's new idle measurement shows **BOB-23** on staging: 9 saves and about 40 page fetches in 8 s on one lesson page. J14 and Q3–Q5 as run 11 (S: the class's leftover Uji Cepat). |
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
| D1 | **P** | A lesson read to its last page never counts as read (0-based save vs a count rule), so no click leads to the post-test | **BOB-22**: blocks ENGINEERING COMPLETE |
| D2 | **S** (config) | Staging sends at most 2 sign-in emails per hour; behind it Namecheap Stellar allows 50 per hour per domain, shared with production | Educator-pilot readiness item (D-052): reassess for 20–30 people when the pilot approaches. **D-053: the domain moves to Namecheap Stellar Business before external educator testing** (10,000 outgoing emails per hour per domain), and PINTAR is not designed around the current 50/hour. Supabase's own hourly limit (`rate_limit_email_sent`, 2 on staging) is a separate setting, sized and set through the Auth-settings workflow before testing. Nothing changes now. |
| D3 | **S** (by design) | Class figures never appear in a synthetic school; not provable in Sekolah Uji Kinerja | Yazid: prove them another way (below) |
| D4 | P (product gap) | Misconception codes cannot be registered anywhere, so every question warns at publish | Yazid decision, then Bob (board, Lana lane) |
| D5 | **P** (proven from source) | "Buat salinan untuk diperbaiki" does not copy a question's pre-test/post-test mark (`create_course_revision`, last defined before `items.cycle_role` existed); the copy's tests then draw from every question, practice included | A 4.0 defect: belongs to ENGINEERING COMPLETE, whatever the date (D-052(e)) |
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

## Readiness by gate (D-052)

| Gate | State | What stands before it |
|---|---|---|
| **ENGINEERING COMPLETE** | **Current gate, not yet reached** | **BOB-22** (students cannot reach the post-test by clicking). The revision-copy defect (D5). The 4.0 items still on the board. A decision on how misconception codes are registered (D4): the taxonomy, the class "misconceptions" figure and the question check already exist, but no screen or package can register a code, so the flow is incomplete. |
| UI/UX POLISHED | Later | The UX Polish Register (UX-01…06, plus the late question check and one-by-one acknowledgements) and the terminology inventory, in the dedicated pass. |
| YAZID GREEN LIGHT | Later | Yazid walks the complete experience. |
| GLADYS GREEN LIGHT | Later | Only after Yazid's green light. |
| EDUCATOR PILOT (20–30) | Later | Operational readiness is prepared then, not now: accounts and school set-up (staff are created by the platform admin one at a time today); mail capacity for 20–30 first sign-ins (Supabase's limit, Namecheap's 50/hour per domain shared with production); pilot classes of 5 or more students so class figures can appear; educators asked to launch Uji Cepat, the only way practice questions reach students; the tester brief (drafted, `docs/onboarding/PINTAR-Panduan-Penguji-Pilot.md`) and the report form. Class figures with official evidence are still NOT PROVEN (a synthetic school cannot show them, by design). |

**Technical (the journey works on staging):** yes, apart from BOB-22. Upload, the question check, two-person publishing, assignment, card sign-in, the pre-test, lessons, the post-test, scoring and results all work through the screens, and every result matched the answers given. The one break is that a student cannot get from the lessons to the post-test without typing its address.

**Tester-facing usability:** for the UI/UX pass, not a reason to hold engineering: 33 one-by-one warning reviews per lesson (UX-01), a Bank Soal with nothing to act on (UX-02), an Uji Cepat titled Uji Penguasaan (UX-05), an evidence page that counts only the pre-test (UX-06).
