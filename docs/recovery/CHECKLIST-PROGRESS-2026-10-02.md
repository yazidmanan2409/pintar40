# PINTAR 4.0: progress against the release checklist

**As of 2 Oct 2026, 01:55 UTC.** Baseline: checklist v2.3 (1 Oct, main `28d3015`).

**P0: 66 of 84 pass with evidence in hand. On 1 Oct the count was 63.** Four more rows have browser walks written and running on the branch head `39806c7`: STU-09, HOD-03, DEA-02 and U-DEVICE. If those come back green, the count is 70. The verdict stays **NO-GO**. Still open:
- capacity, 4 rows;
- media playback, 3 rows, out of scope for the first testing phases (D-050);
- the certificate state, held with Gate 3;
- six walk gaps that are mine to close.

> Since D-084 the checklist is engineering detail, not the readiness measure. Readiness is the journey status under the evidence model. This report scores the checklist rows only.

## Where each environment stands

| Environment | Commit | Migrations | Latest evidence |
|---|---|---:|---|
| Production | `5b5b68d` | 111 | Untouched |
| Staging | main `8dd506a` | 143 | Environment facts GREEN (run 36949805301). Staging walk 008: 20 PASS, 1 NOTE, 1 NOT RUN; no 5xx, no page error (run 36951544367) |
| Branch head | `39806c7` | 145 | CI 36952451202 and browser walk 36952453693 running. The previous head `cdfa12a`: 47 PASS, 1 NOTE, 1 FAIL (S21d, a walk defect, since fixed) |

Next to main is batch 7: migrations 144–145, J6.13, X.6 and the new walks. Then staging, environment facts and staging walk 009.

## P0 rows by section

| Section | P0 | PASS 1 Oct | PASS now | Walk running | Still open |
|---|---:|---:|---:|---:|---|
| Student | 15 | 11 | 11 | 1 (STU-09) | STU-07, STU-11 (media), STU-19 |
| Educator | 8 | 6 | 7 | 0 | EDU-09 |
| Head of department | 8 | 5 | 5 | 1 (HOD-03) | HOD-02, HOD-04 |
| Dean | 5 | 4 | 4 | 1 (DEA-02) | none |
| School admin | 14 | 12 | 13 | 0 | ADM-10 (media) |
| Platform admin | 3 | 3 | 3 | 0 | none |
| Anonymous visitor | 5 | 5 | 5 | 0 | none |
| Cross-role scenario | 12 | 8 | 9 | 0 | X-05, X-07 (media), X-09 |
| Capacity | 4 | 0 | 0 | 0 | CAP-01, CAP-02, CAP-07, CAP-08 |
| Universal | 10 | 9 | 9 | 1 (U-DEVICE) | none |
| **Total** | **84** | **63** | **66** | **4** | **14** |

## P0 rows that moved or are moving

| Row | 1 Oct | Now | Evidence |
|---|---|---|---|
| EDU-04 Read the roster | PARTIAL | **PASS** | Roster read by clicking, a learner's record opened from it (S22). A teacher whose class was taken away is refused it (S26b). A moved learner is no longer the old teacher's (S25, D-088(i)) |
| ADM-05 Add staff | PARTIAL | **PASS** | The platform admin creates the first admin by the screen (S3, now clicked, J1.4) and grants the role (S4). The school admin onboards the teacher on Pendataan, Aktivasi and Peran & akses (S12) and a second teacher (S26b). Run 36950730580 |
| X-13 Everyone signs out | PARTIAL | **PASS** | One computer, two students: after «Keluar» the next student finds only their own home and the lesson at its first page (S21c, W2) |
| STU-09 Lose and regain the network | N-T | walk running | S21: the network drops at a post-test question. The page says «Sedang luring…» (never «sudah ditutup»). The answer stays on the device until the network returns, then reads «Tersimpan» |
| HOD-03 Work waiting for review | N-T | walk running | S17t: the head of department opens Studio → «Antrean Tinjauan» by clicking. It is empty before Bab 1 is sent. Once sent, it lists Bab 1, which opens with «Setujui isi» offered |
| DEA-02 School summary | N-T | walk running | S23d: a dean onboarded by the screens signs in by the email link. The dean reads /pimpinan and opens «Buka ringkasan sekolah» (no raw decimal). Every page that writes refuses the dean |
| U-DEVICE 320 px, Keluar, idle limit | PARTIAL | walk running | Crawl A now opens all 269 pages it reaches for 14 roles at 320 px and fails on any sideways scroll. 34 pages failed first. After the fix, 0 fail locally; the CI crawl is running |

## P0 rows still open

| Row | Status | What is missing | Whose |
|---|---|---|---|
| STU-07 Answer, change, reload | PARTIAL | Answers count exactly. An unsaved last answer is kept at «Kumpulkan» (W3, S21; staging J13). Changing an answer and reloading mid-test are not driven in a walk | Me |
| STU-19 Sign out on a shared tablet | PARTIAL | Walked in S21c, except pressing Back after «Keluar» | Me (one line in S21c) |
| EDU-09 Monitor progress | PARTIAL | «Lihat nama murid», «Lihat per soal» and the Uji Cepat count are walked (S21b, S22; staging J14, Q5). Not yet walked: an expired Uji Cepat leaving «Keadaan hari ini» (BOB-42) | Me |
| HOD-02 See their scope | PARTIAL | The department roster is walked (S23, W10). A head of department opening another department's address is not | Me |
| HOD-04 Review content | PARTIAL | The four-eyes rule is walked with the school admin as reviewer, who now sees every question, key and reason (D-088(h)). A head of department pressing «Setujui isi» is not walked | Me |
| X-05 Assign | PARTIAL | An ineligible learner not seeing the chapter is not checked | Me |
| X-09 Result and certificate state | PARTIAL | The result says whether the school's target was met (M3, W4: S21, S21d). The certificate state needs official evidence from a real school, plus BOB-50, held with Gate 3 | Owner (Gate 3); Golden School run |
| STU-11, ADM-10, X-07 Media | PARTIAL | Text, questions and keys pass. Media playback is out of scope for the first testing phases (D-050) | Owner ruling stands |
| CAP-01, CAP-02, CAP-07 Load | N-T | No 1,000-student run yet. The 30-session staging run passed (U-PERF) | Me (load harness); compute tier is the owner's (CAP-08) |
| CAP-08 Where load runs | PARTIAL | Staging exists; production compute not matched | Owner |

## P1 and P2 rows that moved

| Row | 1 Oct | Now | Evidence |
|---|---|---|---|
| ADM-02 What needs doing (P1) | N-I | **PASS** | «Persiapan sekolah» on Konfigurasi: Kelas, students placed, every Kelas with a teacher (S7, S12b) |
| ADM-06 Give and revoke staff roles (P1) | FAIL | **PASS** | The school admin grants (S12), revokes (S24) and replaces a teacher (S26b) |
| EDU-02 Educator home (P1) | PARTIAL | **PASS** | Walked with live work: «Keadaan hari ini», «Lihat bukti» (S21b, S22; staging J14) |
| EDU-07 Launch Uji Cepat (P1) | PARTIAL | **PASS** | T2 on staging: choose the chapter, tick 5 questions, review, launch. The student's paper is exactly those 5 (walk 008 Q3–Q5; audit S26e) |
| STU-20 Switch language (P1) | PARTIAL | walk written | S21g: «EN» switches the home and the lesson's chrome; the lesson text is unchanged; «ID» switches back (next push) |
| SYS-02 Platform state (P1) | PARTIAL | walk written | S2: environment shown; «Jalankan pemeriksaan» reads «Semua pemeriksaan lolos» (next push). Showing whether a school's admin has signed in needs a new cross-school read of sign-in facts: **waiting for owner** |
| ADM-19 Transfer a student (P2) | N-T | **PASS** | «Pindah kelas»: the learner moves, history stays with the old class (M9, S25) |
| ADM-21 Year rollover (P2) | N-T | **PASS** | Next year's Tingkat and Kelas made; the whole class carried forward (S27) |
| SYS-03 Create a school (P2) | N-I | built | C1: one versioned, audited operator step (migration 145) run only by `found-school.yml`. It founds the first Golden School on staging once main carries it |
| SYS-05 Distribute standard content (P2) | PARTIAL | built | M6: PINTAR's standard chapters show on «Siapkan materi» as «Materi sekolah» (S26d). A PINTAR chapter end to end waits on the D-029 question |

EDU-10 (the Uji Cepat score) is still FAIL; it sits with BOB-50, held for Gate 3. HOD-07 and X-11 (integrity review) are still N-T. SYS-08 (succession) is still FAIL for production. On staging, a Platform Operator now exists (D-088(a)).

## Built since 1 Oct with no checklist row of its own

| Item | What a person can now do | Evidence |
|---|---|---|
| M3 (D-085) | The result says «Target tercapai» or «Belum mencapai target». A teacher asks the learners under target to read lessons again and sees them read | S21, S21d, S22b (run 36949669675) |
| M4, M5 (D-085) | A teacher opens one learner's record. «Lihat per soal» shows the questions the class found hard | S22 |
| M7 (D-085) | Cards for a whole class in one press, as a printable set | S20 |
| M9 (D-085) | Move a student between classes | S25 |
| M10 (D-085) | Correct a published chapter forward as version 1.1.0, with what changed and why; the class is offered only the newest | S26f (run 36947660368) |
| T2 (D-085) | Uji Cepat: choose, select, review, launch | S26e; staging walk 008 |
| C1 (D-084) | A school is founded by one audited step, never hand SQL | C1-S01, C1-K01 |
| D-088(b) | The school sets each lesson's pass mark; every attempt is judged by its sealed mark | S17b, S18 |
| D-088(d), W18 | The learner's home continues the chapter being read before starting a new one | S26d |
| J6.13 | With everything finished, the home says «Tidak ada lagi yang menunggu» instead of "under way today" | S21f |
| X.6 | Every page fits a 320 px phone | Crawl A (local: 0 of 269; CI running) |

## Waiting for owner

- **Gate 3 landing** (BOB-26, DAISY-20, BOB-50, with T1, card re-issue and D2). It decides X-09's certificates, EDU-10 and U-RECOVER. Held; not merged.
- **M8, J8.8, J9, J2.9** («Keluar dari semua perangkat»). These touch sign-in, which stays unchanged.
- **D-029 versus M6**: whether a PINTAR chapter may be authored outside the canonical library.
- **Production**: the SMTP password; the database read permission for P2-D; the compute tier (CAP-08); a second platform admin (SYS-08).
- **New today**: a cross-school read of whether each school's admin has signed in (OPS-J04, part of SYS-02).

## Next, in order

1. Batch 7 to main when `39806c7`'s CI and walk are green. Then staging, environment facts and staging walk 009.
2. Found the first Golden School on staging with `found-school.yml`. The operator then appoints its first admin by the screens, who signs in by the email link (GS-01 to GS-03; the walk is written).
3. Close my six walk gaps: STU-07, STU-19's Back press, EDU-09, HOD-02, HOD-04, X-05.
4. The load runs for CAP-01, CAP-02 and CAP-07.

Sources: `docs/coordination/checklist/checklist_data.py` (v2.3 rows), `docs/recovery/JOURNEY-LOG.md`, `audit/journey.mjs` steps as cited, and GitHub Actions runs as cited.
