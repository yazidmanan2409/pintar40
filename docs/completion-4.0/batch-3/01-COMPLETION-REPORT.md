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

## 0. Final engineering gate (owner, 2 Nov: «Batch 3 final engineering gate»)

| # | Owner's item | Answer |
|---|---|---|
| 1 | CI and browser journeys on the final code commit, with run IDs, results and tested SHA | §6 |
| 2 | Keep two-transaction create-and-lock; the interface must report the state, the refusal reason and the next action | **Kept; no new database function.** STUDIO3A-SEPARUH-01 renders the steps after the combined press created the release and its lock was refused (RELEASE_NOT_READY with a blocker). **State:** the current step «Kunci terbitan», «Buat terbitan · Selesai», and «Buat terbitan» done in the list. **Reason:** the refusal's sentence and what holds the lock back, as an alert. **Next action:** «Kunci terbitan» again, never «Buat terbitan». The test goes red when the press stops reporting the created release. A browser reaches this state only when the lock's readiness check finds an error after approval (warnings do not block it), so the proof is rendered from the press's real answer, through an optional starting answer the page never passes. |
| 3 | The existing F-7 request for W1.11 | §7.1, as written in F-OWNER-DECISIONS, with no new requirement |
| 4 | Daisy's W1.2 composition; blocking separated from cosmetic | Not obtainable from here: her system is unchanged since 8 Oct (`cc96030`) and contains no question-review composition. **`03-DAISY-W1.2-COMMISSION.md`** gives what the screen carries and the six decisions that are hers. **`02-DAISY-QUESTIONS.md`** is triaged: **blocking** A1 (W1.2), D1 (what the Uji Cepat class figure is) and D3 (a minimum group before it shows); **wording** 8; **cosmetic** 22. |
| 5 | The reviewer-name function reveals only package-specific reviewer identities, never arbitrary person records across schools | **Confirmed by design and by test.** `nama_riwayat_paket(p_courses uuid[])` takes package ids only, never a person id. It returns the display names of the people recorded on those packages as reviewers (`content_review_outcomes`) or correction writers (`course_revision_notes`). It answers only for packages whose school the caller may work on in Studio (CAN_DRAFT or CAN_REVIEW, the outcome table's own read policy). Two columns are returned, nothing is written, it is SECURITY DEFINER with a pinned search_path and a STAFF registry row, and anon is refused. **F23-W05** proves: the author is told the reviewer's name though they cannot read that person row; **another school's admin** and **the same school's Dekan** (no Studio capability) are told **nobody**; an unknown package id adds nobody; nobody is told a name not recorded on the packages; an anonymous call is refused 42501. A planted version returning every person failed on 8 counts. |
| 6 | A consolidated report and the remaining acceptance gaps | This report; §7 |

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
| Local suite, fresh database (static, app and db) | **694 passed, 0 failed** |
| New guards | STUDIO3A-* (8, incl. SEPARUH-01), STUDIO3B-* (6), MENGAJAR3-* (5), F23-W05. Each was red without its change and green with it: the agents reset `src` to 405bb19; F23-W05 was run with the function dropped. |
| Restated, rule unchanged, each marked `RESTATED FOR …` | DAISY-06-TERBIT-01, DAISY-18-DENGAR-01, D140-STUDIO-01, DAISY-14-TANGGAL-01, TANGGAL-02/03, BOB07-K02, L4-K01, CR52-B01, PENUTUPAN-J01/I01, POLISH2-STUDIO-01, STUDIO3A-AKUI-01, STUDIO3A-RIWAYAT-01, two UX-14/16 heading pins |
| Baselines | Migrations 181 → 182 (UX1-BRAND-02, UX1-TUR-ORANG-01), with the reason written beside each |
| Branch CI | §6: `ci` 41485243098 and `audit-journeys` 41485237768, both green on `8a75689` |

No test was weakened or removed.

## 5. Notes for the owner

- **W1.4 stays two transactions in one press** (owner, final gate item 2). A created but unlocked release is a recoverable state, and the page reports it (STUDIO3A-SEPARUH-01).
- **A synthetic school's Uji Cepat score page says «Belum ada nilai».** Synthetic results are never official evidence, and the learner record behaves the same way. The walk therefore runs in the seeded official school. On staging, the Golden School is non-synthetic.
- **Grouped acknowledgement is one transaction per finding**, as single presses were. A refusal stops the group at that finding.
- **Questions for Daisy:** `02-DAISY-QUESTIONS.md` has the W1.2 composition and 33 questions on which her system is silent, each with what is built today.

## 6. CI on the branch

**Tested SHA:** `8a7568929ac59bcfb405596cbfcf51982e2a3b39`. The app code there is the same as `0d3c6d0`; the commits after `0d3c6d0` change only the walk scripts.

| Workflow | Run | Result |
|---|---|---|
| `ci` (the protected check's suite: static, app, db, red cases, migrations clean and upgrade path, baseline parity, verdict) | **41485243098** | **success** |
| `audit-journeys` job A: every role's screens in the seeded world, then **the W6.5/W6.7 Studio walk** (16 legs) | **41485237768** | **success** |
| `audit-journeys` job B: Gladys's path from an empty, production-like database (69 steps; any FAIL or BLOCKED turns it red) | **41485237768** | **success** |

**How it got there (no app defect found):**

| SHA | Runs | What happened | Fix |
|---|---|---|---|
| `0d3c6d0` | ci 41456048517 **success**; journeys 41456052964 A **success**, B **red** | S17 and C12c: «no "Buat terbitan" button for the head of department». S17t: the review-queue link was not found by its exact title. 29 further steps were red or blocked as cascades (Bab 1 never published). | `8f9a023`: the walks press the approved combined button (W1.4) and require the release to END locked; the queue's whole-row link (W1.7) is matched by a name that begins with the title |
| `8f9a023` | ci 41474549982 **red**: the red-case job could not start its database (port 54322 already in use on the runner) **before any test ran**; journeys 41474544188 A **success**, B 67 PASS / 2 FAIL | C12c and S26f: the walk pressed only «Sudah saya tinjau»; grouped findings (W1.5) say «Sudah saya tinjau semuanya», so publishing was rightly refused | `8a75689`: the walks take either name and still press until no warning is left |
| `8a75689` | ci 41485243098 **success**; journeys 41485237768 **success** (A and B) | none | none |

The staging Golden School walk and the staging journey carry the same three updates, so the post-promotion staging run will not trip on them.


## 7. Remaining acceptance gaps

### 7.1 F-7 · who the Question Bank is for (W1.11, J4.8): the existing request, unchanged

**Today:** the bank (browse, filter, key and reason review, QN5) is gated as Question Health, so heads of department and admins reach it and teachers who author cannot.

| Option | Consequence |
|---|---|
| **Recommended (F-OWNER-DECISIONS):** teachers with CAN_DRAFT browse their own school's bank (QN5); Question Health signals stay head-of-department-only (J4.9) | W1.11 is built in Batch 3's terms: one gate and its guard, then J4.8 can close |
| Keep the bank as built (heads of department and admins only) | J4.8 is recorded as an accepted deviation from QN5; no build |
| No ruling | J4.8 stays E and cannot close; W1.11 stays blocked |

### 7.2 The rest

| Gap | Needs | Blocks |
|---|---|---|
| W1.2 question-review layout | Daisy's composition (commission ready) | W1.2, J4.4's review part |
| D1, D3 (the Uji Cepat class figure) | Daisy (D3 possibly also the owner) | W2.4's design sign-off; the figure is built as the mean, shown from 1 |
| F-7 | The owner (§7.1) | W1.11, J4.8 |
| W6.5 on staging | A separate authorization: merge, deploy, then the walk against a fresh Golden School. The staging walks already understand the combined press (8f9a023). | The exit gate |
| J1Terbit and J5 side by side with their compositions | The independent review | «design complete» on the matrix lines |
| 30 wording and cosmetic answers | Daisy | Copy and style only |

**STOP at the Batch 3 promotion gate.** No merge, no deploy, production untouched, no Batch 4.
