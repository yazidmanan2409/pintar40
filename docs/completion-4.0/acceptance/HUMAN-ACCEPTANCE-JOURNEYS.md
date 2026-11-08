# Human acceptance journeys: PINTAR 4.0 (8 Nov 2026)

**For:** the owner's first unscripted walkthrough, then internal testers, then (only once the readiness gate is met) Dr
Gladys's team.

**What this is:** realistic tasks a first-time school administrator, educator or school leader is given in plain words,
with no engineering guidance. Each task says what the person is asked and how the observer knows it is done. Nothing in a
task names a button, a menu or a screen: finding the way is what is being accepted.

**What this is not:** a test script. The automated walks already prove each step works (`batch-9/evidence/staging-p7.md`).
A green walk is never a human acceptance (owner, 7 Nov). A journey is accepted only by a person's recorded walk.

**Holds no password, PIN or real person's address.** Accounts are prepared as in `batch-9/evaluator-accounts.md` §2.
Each tester activates their own account.

---

## 1 · How a session runs

| | |
|---|---|
| Where | staging (`main` `c4944fab`), on a school prepared for the journey (§3). Never production; never Dr Gladys's school |
| Who | one tester and one observer. The observer reads the task aloud and then only watches |
| Devices | a laptop (1280 px or wider) for staff journeys; a phone (about 390 px) for at least H9 and H11, and once for H2 |
| Think aloud | the tester says what they expect and what they look for |
| Help | the observer does not help. If the tester asks, the observer says «Apa yang akan Anda lakukan jika Anda sendirian?». A tester who is truly stuck for 3 minutes may be given **one** hint; the hint is recorded and the journey is not accepted that session |
| Time | recorded per journey, from the task being read to «done» |

**What the observer records for every journey** (one line per finding):
- where the tester hesitated, guessed, went the wrong way or asked;
- the exact words that confused them;
- what they expected to happen and what happened;
- a class for each finding, the same as Daisy's (owner, 8 Nov):
  - **A, blocking:** could not complete or understand an essential journey;
  - **B, important:** completed, but with significant friction from inconsistency or ambiguity;
  - **C, cosmetic:** no material effect on comprehension or completion.

**A journey is accepted** when the tester completes it without a hint and the session records no A finding.

---

## 2 · The journeys

### School administrator

**H1 · Set the school up.** «Sekolah Anda baru saja dibuat di PINTAR. Siapkan susunannya: satu bagian "Kelas Tinggi", di dalamnya tingkat "Kelas 5", dan satu kelas "Kelas 5A".»
- Done when: the three exist and the tester can show where the school says what is still missing before teaching.

**H2 · Add the people.** «Catat seorang guru baru dan lima murid untuk Kelas 5A. Guru itu harus bisa masuk dengan emailnya sendiri dan mengajar Kelas 5A.»
- Done when: the teacher holds Guru at Kelas 5A and has been given account access by email; the five learners are in Kelas 5A.
- Note what the tester does with the school code if asked for one.

**H3 · Cards for the class.** «Murid Kelas 5A belum punya cara masuk. Siapkan kartu mereka dan cetak.»
- Done when: one card per learner is printed (or shown as the printable sheet), and the tester can say who was not given a card and why.

**H4 · A lost card.** «Kartu salah satu murid hilang. Pastikan kartu lama tidak bisa dipakai lagi dan murid itu tetap bisa belajar.»
- Done when: the old card is stopped and a new one is issued; the learner's results are untouched.

**H5 · The pass mark.** «Sekolah memutuskan batas ketuntasan 70% untuk bab yang baru terbit. Tetapkan.»
- Done when: the mark is set with a reason and the tester can show where it is visible.

### Educator (Guru)

**H6 · First sign-in.** «Anda menerima email dari PINTAR. Masuk untuk pertama kali.»
- Done when: the tester has their own password and lands where they teach.

**H7 · A chapter into Studio.** «Siapkan satu bab untuk kelas Anda. Mulailah dari contoh yang disediakan PINTAR, isi, lalu kirim untuk ditinjau.»
- Preparation: a workbook with one deliberate mistake (one question without a correct answer) is handed to the tester as "the colleague's draft".
- Done when: the tester has fixed the mistake the check reports and the chapter is waiting for review.
- Note whether the tester understood the check's message without help.

**H8 · A chapter sent back.** «Kepala departemen mengembalikan bab Anda. Perbaiki dan kirim lagi.»
- Done when: the tester can say why it was sent back and by whom, and has submitted the corrected version.

**H9 · Give the chapter to the class.** «Bab Anda sudah terbit. Berikan kepada Kelas 5A sampai akhir bulan depan.»
- Done when: Kelas 5A has the chapter until that date; the tester can say what pass mark applies.

**H10 · Understand the class.** «Setelah murid mengerjakan, siapa yang perlu dibantu, dan pada topik apa?»
- Preparation: a class with official results (the Golden School after GS-16).
- Done when: the tester names the learners in «Perlu penguatan» and the weakest topic, and opens one learner's page to say which objectives are not yet reached.
- Note whether every figure was understood without explanation (Visual Intelligence).

**H11 · A quick check in class.** «Lakukan uji cepat tiga soal sekarang juga, lalu lihat hasilnya.»
- Done when: the result is read, and the tester can say whether it gives a certificate.

**H12 · Forgotten password.** «Anda lupa password. Masuk kembali.»
- Done when: the tester is signed in with a new password; asked afterwards, the tester knows whether other browsers were signed out.

### Learner (on the class card)

**H13 · Learn a chapter.** «Masuk dengan kartu ini, kerjakan bab yang diberikan guru sampai selesai, dan lihat hasilmu.»
- Phone, 390 px.
- Done when: Pemetaan Awal, the lessons and Uji Penguasaan are done, the result is read, and a certificate is found if earned.

**H14 · A shared computer.** «Kamu meninggalkan komputer kelas lima menit. Lanjutkan pekerjaanmu.»
- Done when: the tester resumes at the same page with the card's PIN.

### School leadership

**H15 · Find where attention is needed.** As Kepala departemen: «Kelas mana di bagian Anda yang paling perlu perhatian, dan mengapa?»
- Done when: the tester names a class and a reason from the report, without help.

**H16 · The school's picture.** As Dekan: «Bagaimana kesiapan sekolah per mata pelajaran? Cetak ringkasannya untuk rapat.»
- Done when: the tester reads readiness per subject and prints the A4 summary; asked, the tester can say why some figures are withheld.

**H17 · Review a chapter.** As Kepala departemen: «Ada bab yang menunggu tinjauan Anda. Periksa soal-soalnya dan putuskan.»
- Done when: the tester has read the questions with their keys and either approved and locked the release or sent it back with a reason.

### Professional learning

**H18 · Teachers learning.** As Admin sekolah: «Buat tempat pengembangan profesi untuk guru, dengan satu kelas, seorang fasilitator, dan daftarkan dua guru sebagai peserta.»
- Done when: the place exists with its facilitator, the two are participants, and nothing was added to the learners' classes.

**H19 · Who sees a teacher's learning.** As the facilitator, then as one of the participants: «Lihat kemajuan peserta» / «Siapa yang bisa melihat hasil belajar Anda?»
- Done when: the facilitator reads the record; the participant can say who sees their result, from their own page.

### Anyone

**H20 · Check a certificate.** «Seseorang menunjukkan sertifikat PINTAR. Periksa apakah asli.»
- Done when: the tester opens the certificate's check and reads whether it is valid.

---

## 3 · Preparation per journey (engineering, before the session)

| Journeys | School state needed | How it is made (staging walks only; every write a press of PINTAR's buttons) |
|---|---|---|
| H1–H3, H6 | a newly founded school with its first administrator | `found-school.yml`, then GS-02/03 |
| H4, H5, H9–H14 | the Golden School after GS-04–16 | the admin and learner walks |
| H7, H8, H17 | the above, with a second chapter's draft submitted (H17) or sent back (H8) | the Studio walk, stopped at the step needed |
| H15, H16 | a school with official results in more than one class | the Golden School after GS-16 (one class: H15 reads «Per kelas»; a second class is an open preparation item) |
| H18, H19 | the Golden School with no PD place yet (H18); with the PD place (H19) | none (H18); `golden-school-pd.mjs` (H19) |
| H20 | an issued certificate | GS-18 |

The tester's own account is added to the prepared school by `evaluator-accounts.md` §2. The walks' accounts are never handed over.

---

## 4 · The record

Each session is recorded in `docs/completion-4.0/acceptance/sessions/<date>-<tester initials>.md`:
- the journey ids, the times, the outcome (accepted / not accepted);
- every finding with its class.

The ledger's «Human journey accepted» column (`H-ACCEPTANCE-STANDARD-AND-LEDGER.md` §3b) moves only from these records. A or B findings go to Daisy and the engineering lane; the journey is walked again after the correction.

| Journey | Batches it accepts |
|---|---|
| H1–H5 | 4 (administration), 6 (cards, print) |
| H6, H12 | 4 (identity) |
| H7, H8, H17 | 3 (Studio) |
| H9–H11 | 3, 5 (teaching), 9 (reports) |
| H13, H14 | 1, 2, 5, 6 (learner, shell, certificate) |
| H15, H16 | 5, 9 (reports) |
| H18, H19 | 5, 9 (professional learning, X5) |
| H20 | 5, 6 (certificate) |
