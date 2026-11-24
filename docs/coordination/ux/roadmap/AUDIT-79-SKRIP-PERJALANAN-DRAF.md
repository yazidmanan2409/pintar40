# Ruling 79 audit · journey scripts, first sketch (Daisy, 23 Nov 2026)

> **What holds now:**
> - **Status:** a design-only draft, written while idle, as Bob allowed. **Nothing runs until 4.1's gates close.** Bob consolidates the final set.
> - **Contents:** twelve journeys, each with:
>   - who;
>   - the synthetic starting state;
>   - the steps;
>   - the failure branches walked (the ruling 81 test: understands what happened, work kept, next step clear);
>   - the dimensions it exercises;
>   - the hand-offs to Sharon and Second Eye.
> - **Dimensions:** **A** first use · **B** cross-feature and cross-role truth · **C** errors and recovery · **D** empty and uncertain states · **E** consequential actions · **F** effort · **G** accessibility · **H** educational and emotional tone.
> - **Every journey is walked:**
>   - at 1280, 390 and 320;
>   - by keyboard;
>   - once with a screen reader (the landmarks, live regions and focus path);
>   - once on a throttled network;
>   - once with reduced motion.
> - **Each finding** is classed Critical / Significant / Improvement, by human impact.
> - **Input carried over:**
>   - the open audit notes N-13 (links in text not underlined) and N-18 (h1 at body size);
>   - Option B of R-10;
>   - the "later" rows of `SAPU-KONSISTENSI-706fe8c5.md` (T-01, T-04 to T-08, T-10 to T-12; S-06, S-14, S-16; K-06, K-08, K-09);
>   - N-15, N-16 and N-17;
>   - the 4.1 walkthrough plan's tasks and measures, as a source and not a substitute (that walkthrough stays after 5.0).
> - **Synthetic data only, in approved environments.** No real names, no production.
> - **Ruling 88 (24 Nov):** fixtures may include multi-answer items («Pilihan ganda banyak jawaban»), especially for J2, J3 and J7. AI drafts stay single-answer (ruling 81).

## The twelve journeys

| # | Journey | Role | Dimensions |
|---|---|---|---|
| J1 | A school's first day: account activation by class card, first sign-in, the tour | Young learner (SD) | A, G, H, F |
| J2 | A chapter's whole cycle: Pemetaan Awal → Peta Bacaan → lessons → Uji Penguasaan → result → certificate | Learner (SMP) | B, D, H, G |
| J3 | Missing a must-be-right question, a retake request, the retake, the new result | Learner and teacher, then approver | B, C, H, E |
| J4 | A sitting interrupted: device change, offline, permission to continue, recovery on another session | Learner and teacher | C, D, G |
| J5 | Preparing and giving a chapter, Uji Cepat in class, reading the class's evidence, «Minta membaca lagi» | Teacher | A, B, F, D |
| J6 | Authoring a package with AI drafts: target lesson, decisions, submit, review, approval | Teacher-author, then reviewer | B, E, H, C |
| J7 | A key correction after results exist: the correction, recalculation, the certificate under review, public verification | Reviewer, school admin, an outside verifier | B, E, D, H |
| J8 | Setting up a school year: structure, pass marks, staff roles with dates, intake by workbook | School admin | A, E, F, C |
| J9 | The year-end promotion, then a transfer between schools across it | School admin (two schools) | E, B, C |
| J10 | Locked out: forgot the password (email and PIN paths), the session lock, a closed account's reopening request | Learner and staff, signed out | C, G, H |
| J11 | Reading the school: reports, withheld figures, readiness bands, a printed summary | Leader (pimpinan) | B, D, H |
| J12 | Operating PINTAR: maintenance planned, extended and ended early; an emergency stop; a test email; platform roles | Admin PINTAR | E, C, D, B |

## The scripts (outline)

**J1 · First day (SD).**
- **Start:** a class of synthetic learners with printed class cards; nobody has activated.
- **Steps:**
  1. sign in by card number and card PIN;
  2. make a personal PIN;
  3. «Komputer siapa ini?»;
  4. the tour;
  5. find today's task.
- **Failure branches:**
  - a wrong card PIN three times;
  - a mistyped card number;
  - a weak PIN refused;
  - the shared-computer choice made wrongly, then changed in Akun saya.
- **Watch for:**
  - reading level and the words a 9-year-old meets first (H);
  - time and steps to the first task (F);
  - touch targets at 320 (G).
- **Hand-offs:**
  - **Sharon:** card and PIN pacing.
  - **Second Eye:** the steps timed and repeatable.

**J2 · One chapter, start to certificate.**
- **Start:** an assigned chapter with lessons, a sealed pass mark, and a certifying Uji Penguasaan.
- **Steps:**
  1. Pemetaan Awal;
  2. read the map's order (now «Sudah kuat» and the line under it);
  3. lessons with stepwise help;
  4. «Siap untuk Uji Penguasaan»;
  5. the test;
  6. the result;
  7. the certificate.
- **Failure and uncertain branches:**
  - a lesson left halfway, then resumed;
  - the result before the pass mark exists (no verdict);
  - «Belum dapat disimpulkan» wherever evidence is thin.
- **Watch for:**
  - every claim word against its evidence (B, H): the sweep's Q3 method, now walked rather than read.

**J3 · The gate, the retake and the new result.**
- **Start:** a learner at 90 % against 75 % who misses one must-be-right item.
- **Walked by three people, each comparing what they see:**
  - the learner: `hasil.target.belum_gerbang`;
  - the teacher: `mengajar.murid1.gerbang`, and «Minta membaca lagi» pre-ticked;
  - the approver: `kesempatan.baris.hasil_gerbang`.
- **Then:**
  1. the retake request and its approval;
  2. while open, `hasil.ulang_berjalan` on both sides;
  3. the retake abandoned (the line goes, the earlier result stays);
  4. a second retake finished (the new result replaces).
- **Also:** the gate unknown (`…tak_diketahui`) on all three surfaces.
- **The audit's core cross-role truth check (B):** one verdict everywhere.

**J4 · An interrupted sitting.**
- **Start:** a learner mid-Uji Penguasaan.
- **Branches:**
  - the network lost and returned;
  - the device changed;
  - permission needed («Beri tahu guru Anda juga: Uji Penguasaan · Pecahan»);
  - the teacher allows;
  - recovery on another session;
  - time runs out during the gap;
  - the teacher ends the sitting.
- **Each branch:** the ruling 81 three questions, from the learner's and the teacher's side.

**J5 · A teacher's week.**
- **Start:** a teacher new to PINTAR, with two classes.
- **Steps:**
  1. «Siapkan» a chapter (the window, «Sampai» empty);
  2. an Uji Cepat in class (the minutes chosen; a learner joins late; one is held by a stop);
  3. read «Bukti» and the topic grid;
  4. «Minta membaca lagi»;
  5. «Ubah jadwal»;
  6. the Atur panel's «Tambah waktu».
- **Watch for:**
  - first-use clarity without the tour (A);
  - the steps per weekly task (F);
  - empty states for a class with no results yet (D).

**J6 · Authoring with AI.**
- **Start:** a draft package; AI is entitled at the school.
- **Steps:**
  1. the target lesson and source;
  2. drafts;
  3. edit one, accept one, delete one;
  4. «Ajukan» held, then submitted;
  5. the reviewer's count;
  6. approval.
- **Branches:**
  - the source has learner data (refused);
  - the allowance is used up;
  - the provider ceiling;
  - the package is already marked as passing the check;
  - a stale form (`AI_TUJUAN_LAIN`).
- **Watch for:**
  - provenance honest to staff, and invisible to learners (B, H);
  - nothing promised that the allowance can't keep.

**J7 · A correction after the fact.**
- **Start:** results and a certificate exist; a key is found wrong.
- **Steps:**
  1. propose the correction;
  2. the second person approves;
  3. results are recalculated, with the old figure shown beside the new;
  4. the certificate is «Sedang ditinjau»;
  5. an outside verifier opens the public link («Seperti saat diterbitkan»);
  6. the review is settled, either reissued or revoked.
- **Watch for:**
  - the learner's, teacher's and verifier's views agreeing at each moment (B);
  - consequential wording before each irreversible step (E).

**J8 · A school year set up.**
- **Start:** an empty school.
- **Steps:**
  1. structure (Kelas · Tingkat · Bagian);
  2. pass marks, 1–100;
  3. staff roles with «Berlaku sampai», including today;
  4. intake by workbook, with planted errors;
  5. activation cards printed.
- **Branches:**
  - a role without a date (S-02's fix);
  - a school code of the wrong shape;
  - a workbook that fails its check.
- **Watch for:**
  - the effort count for a 600-learner school (F);
  - every refusal naming its field (C).

**J9 · Promotion and transfer.**
- **Start:** two synthetic schools; a learner with an open transfer request.
- **Steps:**
  1. the year-end promotion runs at school A;
  2. school B presses «Terima perpindahan» (`TRANSFER_SOURCE_CLOSED`);
  3. school A makes a new request;
  4. B accepts.
- **Watch for:**
  - both schools understanding who acts next (B, C);
  - nothing changed by the refused step (E).

**J10 · Locked out.**
- **Signed-out paths:**
  - forgot the password by email, by username, and by PINTAR ID + PIN (with the time running out);
  - the session lock (PIN, then card PIN, three tries);
  - a closed account's reopening request (short message refused, double press, Back).
- **Watch for:**
  - no existence oracle anywhere (Sharon);
  - every wait sentence naming the right thing (network, name, address);
  - the screen reader's announcements.

**J11 · Reading the school.**
- **Start:** a school with mixed evidence: some domains withheld, some classes moved.
- **Steps:**
  1. Pimpinan's report;
  2. readiness bands;
  3. «Belum cukup bukti»;
  4. the printed summary.
- **Watch for:**
  - every «semua» or «all» against what was judged (D, B);
  - tone towards learners and teachers in a leader's view (H).

**J12 · Operating PINTAR.**
- **Start:** an Admin PINTAR on a quiet day.
- **Steps:**
  1. plan maintenance;
  2. extend it;
  3. end it early;
  4. an emergency stop and its end;
  5. a test email;
  6. a platform role renewed, then the last-admin refusal.
- **Watch for:**
  - what learners and teachers see at each moment (B);
  - every consequential step confirmed in words that name the effect (E);
  - «Admin PINTAR» throughout (T-03).

## Still to decide (for Bob)

1. **Each journey's owner for evidence capture:** Second Eye by default; Sharon on J7, J9, J10 and J12's protection points.
2. **Whether Dr Gladys's educational reading applies to J2, J3 and J11.** This goes through the owner, per ruling 79.
3. **The synthetic world:** one shared world for all twelve, or per-journey fixtures. A shared world tests cross-role truth better (B).
