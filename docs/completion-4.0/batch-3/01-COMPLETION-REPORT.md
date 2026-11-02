# Batch 3 · Studio and teaching: completion report (2 Nov 2026)

**Authority:** owner, 2 Nov: «Batch 2 accepted / Batch 3 development GO».
**Branch:** `claude/awesome-rubin-bqxp6p`. Nothing was merged to `main` or deployed to staging. Production and Dr Gladys's demonstration records were not touched. The staging freeze is unchanged.

## Verdict: development complete, except two blocked items. STOP at the promotion gate.

Every Batch 3 item is built and guarded, except two:
- **W1.2** (the question-review layout) waits on Daisy;
- **W1.11** (who the Question Bank is for) waits on owner decision F-7.

The exit gate's W6.5 Studio proof passes as a **local** browser walk. Two parts of the exit gate still need separate authority or another reviewer:
- the same proof **on staging**;
- the side-by-side check of J1Terbit and J5 against their compositions.

## 1. Requirements

| Item | What it asked | Status | Evidence |
|---|---|---|---|
| W1.1 | J1Terbit on the package page: done steps collapsed, the current step in a panel, «✓ Diterbitkan», the tab-edge fade | **DONE** | STUDIO3A-J1-01 (rendered, id and en); walk U3–U9; `evidence/w65/09-buat-dan-kunci.png` |
| W1.2 | The question-review layout | **BLOCKED (Daisy)**: her frozen system has no composition. The review still reads every question, key and reason (D-088(h)), in `pin-*` classes. | `02-DAISY-QUESTIONS.md` A1 |
| W1.3 | Aturan Asesmen: hints, limits in minutes and words, 44 px choices | **DONE** | STUDIO3B-ATURAN-01; `src/lib/aturan-asesmen.ts` |
| W1.4 | Release in fewer presses; every step says what it did | **DONE**: create and lock in one press (2 presses instead of 3); each step's result shows in the next panel, a refusal in its own panel | STUDIO3A-LANGKAH-01; walk U8 («one press created and locked the release») |
| W1.5 | The question check runs before lock; findings acknowledged as a group; misconception feedback asserted in a browser | **DONE** | STUDIO3B-TEMUAN-01, STUDIO3B-KELIRU-01 (journey step S22m); walk U8 (findings acknowledged by kind) |
| W1.6 (screens) | Send back to the author | **DONE** | STUDIO3A-KEMBALI-01; F23-W02/W03 (Batch 1 data); walk U4–U7 |
| W1.7 | Studio home count cards link to their lists; the list shows status | **DONE** | STUDIO3A-BERANDA-01 |
| W1.8 (screens) | «Riwayat perbaikan»: who reviewed and approved | **DONE**. The walk found the author was told the reason but not who gave it. Fixed by migration `20261215100000` (`nama_riwayat_paket`, §3). | STUDIO3A-RIWAYAT-01; **F23-W05** (red without the function, green with it); walk U5, U12 |
| W1.9 | Wording: «murid», no «(D-008)», the locale passed, 320 px | **DONE**, including the Unggah correction words now saying «paket» | STUDIO3A-BAHASA-01, STUDIO3B-KATA-01 |
| W1.10 | An example-only workbook | **DONE**. It is the walk's starting point. | STUDIO3B-CONTOH-01; walk U0 |
| W1.11 | The Question Bank for the people QN5 meant | **BLOCKED (owner, F-7)** | none |
| W1.12 | The author is never offered «Sudah saya tinjau» | **DONE**, also on the grouped findings | STUDIO3A-AKUI-01 (restated for the group mount) |
| W1.14 | The other Studio pages on the 08 rows | **DONE**: all 11 Studio surfaces, no Tailwind left; the token lint reads them all | STUDIO3B-KELAS-01; UX1-S0-TOKEN-01 (RESET_SURFACES) |
| W2.4 | Uji Cepat score: the class first, the learners one step below | **DONE** | MENGAJAR3-HASIL-01; walk U15 («Nilai kelas 100% · 1 dari 1 murid sudah dinilai»); `evidence/w65/16-uji-cepat-hasil.png` |
| W3.11 | J5 Jendela on Siapkan; J1 part two «✓ Disediakan» | **DONE** | MENGAJAR3-JENDELA-01, MENGAJAR3-SEDIA-01; walk U10 |
| W3.17 | Mengajar: badges at 320 px (RV-20); result words | **DONE**, with one named exception: the Uji Cepat launch's success leaves its form (Daisy D5) | MENGAJAR3-KIRIM-01 |
| W3.18 | Studio and Mengajar 08 rows | **DONE**: no bare `pin-empty` line under `src/app/mengajar` (16 Empty states); every Studio page on `pin-*` | MENGAJAR3-KOSONG-01 (extended); W1.14 above |
| W6.5 | The Studio end-to-end proof | **DONE locally (16/16); staging NOT RUN**, which needs a separate authorization | §2 |
| W6.7 | Uji Cepat at Level 3, with the score and no certificate | **DONE locally** | walk U13–U15 |

**Matrix lines:**
- **J4.1, J4.3–J4.6, J4.10, J4.12, J5.4–J5.7:** built and proved locally.
- **J4.4:** its question-review part waits on W1.2.
- **J4.8 (W1.11):** waits on F-7.
- **Remaining:** «VERIFIED with design complete» needs the staging W6.5 run and Daisy's answers.

## 2. The W6.5 / W6.7 proof (`audit/studio-ujung.mjs`)

**Where it runs:**
- A browser walk by the screens.
- In the seeded **official** school («PINTAR Bootstrap», development and CI only).
- Four people: a Guru (5B), the head of department, the school admin and a learner.
- Every outcome is read back from the database.
- In CI, job A of `audit-journeys.yml` runs it after the crawl.

| Step | What happened | Result |
|---|---|---|
| U0 | The Guru downloads «Unduh contoh isian» and makes it her own, never-imported chapter | PASS |
| U1 | Her first upload is refused at «Lembar Soal, baris 2, kolom Tingkat kesulitan»; «Belum ada yang disimpan»; no course is made | PASS |
| U2 | She fixes the row; the check passes; the chapter is saved as a draft, with her as its author | PASS |
| U3 | Susun → Periksa → Ajukan; she is offered neither «Setujui isi» nor «Kembalikan ke penyusun» | PASS |
| U4 | The head of department sends it back once with a reason. The confirmation opens with focus in the reason box, and a six-character reason does not pass the form. Recorded: SENT_BACK, the reason, the reviewer. | PASS |
| U5 | The Guru reads the reason, **who gave it** and when, and the way to the correction upload | PASS (after the §3 fix) |
| U6–U7 | She uploads the correction as the next version of the line, with what changed (C5 shortened), and submits again | PASS |
| U8 | The head of department approves and acknowledges the findings by kind. One press creates and locks the release. The author is offered neither step, and the head of department is not offered «Terbitkan». | PASS |
| U9 | The admin publishes («✓ Diterbitkan») and sets the line's pass mark (70%) | PASS |
| U10 | The Guru gives the chapter to 5B on Siapkan: «✓ Disediakan», «Materi disediakan untuk kelas ini. Mulai … · Sampai …» | PASS |
| U11 | The learner finds it on Belajar and opens it at its Pemetaan Awal; no key or reason is shown | PASS |
| U12 | «Riwayat perbaikan»: the send-back with its reason and reviewer, the correction with its writer, the approval with its reviewer | PASS |
| U13–U15 | An Uji Cepat of three of the chapter's questions: no key shown; the learner hands it in; **no certificate**; «Lihat hasil» shows the class figure on its base, then the learner | PASS |

Evidence: `evidence/w65/` (the run's JSON, its log and 11 screenshots).

## 3. Defects found and fixed during the batch

1. **The author was told the reason but not the reviewer (W1.8).** A Guru's row security does not reach the head of department's person record, so the name was empty for the one reader the history exists for. Fixed by migration `20261215100000_a_package_names_who_reviewed_it.sql`:
   - `nama_riwayat_paket` is SECURITY DEFINER with a pinned search_path, has a STAFF registry row and ends in a verification block.
   - It returns only the names recorded on the packages asked for, and only to a reader who may work on that school in Studio.
   - F23-W05 proves the author cannot read that person record directly, is still given the name, and that another school's admin gets nothing.
2. **A refusal on a published package was no longer shown (BOB07-R01).** The J1Terbit panel had moved the result line into the current step's panel; the published and withdrawn panels now show it too.
3. **W1.14 was left half done between the two Studio agents.** Studio home, the package page and the review queue still used Tailwind; all three are now on `pin-*`.
4. **W1.5's grouped findings were not mounted** on the package page; they are now.
5. **«kursus» in the Unggah correction words** became «paket» (W1.9).

## 4. Tests and CI

| | Result |
|---|---|
| Local suite, fresh database (static, app and db) | **693 passed, 0 failed** |
| New guards | STUDIO3A-* (7), STUDIO3B-* (6), MENGAJAR3-* (5), F23-W05. Each was red without its change and green with it: the agents reset `src` to 405bb19; F23-W05 was run with the function dropped. |
| Restated, rule unchanged, each marked `RESTATED FOR …` | DAISY-06-TERBIT-01, DAISY-18-DENGAR-01, D140-STUDIO-01, DAISY-14-TANGGAL-01, TANGGAL-02/03, BOB07-K02, L4-K01, CR52-B01, PENUTUPAN-J01/I01, POLISH2-STUDIO-01, STUDIO3A-AKUI-01, STUDIO3A-RIWAYAT-01, two UX-14/16 heading pins |
| Baselines | Migrations 181 → 182 (UX1-BRAND-02, UX1-TUR-ORANG-01), with the reason written beside each |
| Branch CI | §6 |

No test was weakened or removed.

## 5. Notes for the owner

- **W1.4 is two transactions in one press, not one.**
  - Each step stays atomic: «Buat terbitan» and «Kunci terbitan» are BOB-03's own typed actions.
  - If the lock is refused, the release stays created (a valid state), and the panel says what blocks the lock.
  - Making both one transaction would need a new database function. Say if you want that.
- **A synthetic school's Uji Cepat score page says «Belum ada nilai».** Synthetic results are never official evidence, and the learner record behaves the same way. The walk therefore runs in the seeded official school. On staging, the Golden School is non-synthetic.
- **Grouped acknowledgement is one transaction per finding**, as single presses were. A refusal stops the group at that finding.
- **Questions for Daisy:** `02-DAISY-QUESTIONS.md` has the W1.2 composition and 33 questions on which her system is silent, each with what is built today.

## 6. CI on the branch

(Filled in when the runs complete.)

## 7. Still open

| | Needs |
|---|---|
| W1.2 question-review layout | Daisy's composition |
| W1.11 Question Bank | Owner decision F-7 |
| W6.5 on staging (the exit gate) | A separate authorization: merge, deploy, then the walk against a fresh Golden School |
| J1Terbit and J5 side by side with their compositions | The independent review |
| 33 design and wording answers | Daisy |

**STOP at the Batch 3 promotion gate for owner review.**
