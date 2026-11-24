# Ruling 79 · the consolidated findings ledger (draft 1; Bob, 24 Nov 2026; track 3a)

Proposed dimensions, journeys and severities are Bob's, for Daisy to confirm. **Known gap:** the «next batch / not blocking» notes in pre-Z reviews (A2b-D8, B1, B2, C2w-Kanonik) are not yet swept; Daisy adds them. Items marked ✓main were re-checked open on main 61a6ff9e.


> **What this is:** every human-experience finding that was deferred rather than fixed, and is bound for the Human Experience, Consistency & Trust Audit (ruling 79; MASTER-SEQUENCE §2b; NEXT-SEQUENCE-89 track 3a), in one de-duplicated table. Dimensions, journeys and severities are **proposed**; Daisy confirms the mapping.
> - **Read-only sweep** of `origin/ux-1/daisy-experience` (`821f7d60`), `origin/claude/bob-41-master-plan` (`e28dac84`), `origin/claude/z` (`a8d9ff27`) and `origin/main` (`61a6ff9e`). Daisy's review records live on `ux-1/daisy-experience` under `docs/coordination/ux/completion-4.1/` (there is no `reviews/daisy/` directory on any of the four branches).
> - **"Still open" was spot-checked on `main` `61a6ff9e`** by grepping the key or string where that was cheap (marked ✓main). Rows not marked were not re-checked.
> - **Severity is by human impact:** Critical / Significant / Improvement. No Critical candidate was found.
> - **Phase-bound rows (L-26 to L-30)** are already assigned to 4.5 (former 4.2, ruling 72). They are listed so the audit's journeys *observe* them. Their fixes stay in 4.5.
> - **Source shorthand:** `DX` = `origin/ux-1/daisy-experience`, path `docs/coordination/ux/completion-4.1/…`; `BM` = `origin/claude/bob-41-master-plan`, path `docs/completion-4.1/…`. The sha is the file's last commit on that branch.

## 1 · The twelve journeys (Daisy's draft)

Source: `DX` `docs/coordination/ux/roadmap/AUDIT-79-SKRIP-PERJALANAN.md` (FINAL, `a06e13e9`, `ux-1/daisy-experience`). J-ids, roles and dimensions are unchanged from the draft; the titles below follow the final file.

| Id | Title | Who | Dimensions |
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

Every journey is walked at 1280, 390 and 320, by keyboard, once with a screen reader, once throttled, once with reduced motion (draft, header).

## 2 · The ledger

| L-id | Finding (one line, plain) | Source (file + sha/branch + item id) | Dim. | Journey | Severity | Notes |
|---|---|---|---|---|---|---|
| L-01 | Links inside running text are never underlined app-wide; in a success line the link colour is close to the text colour, so a link is told by colour alone | `DX` `TINJAUAN-C3W-1-RONDE2-bc6e50da.md` `b0f66be4`, N-13; carried in the draft's header | G | J6 (Studio result line); every journey | **Significant** | ✓main: `globals.css:435` still `text-decoration: none` (underline on hover only). System-wide, a WCAG 1.4.1 question |
| L-02 | On «Minta akun dibuka kembali» the page's `h1` is drawn at body size under a large brand | `DX` `TINJAUAN-Z4B-954aa9bc.md` `081b9a7b`, N-18 | G | J10 | Improvement | Pre-existing; Daisy marked it for the ruling 79 audit. Check other signed-out pages for the same |
| L-03 | Page titles break badly at 320 px; no record closes it | `BM` `Z-READINESS.md` §5 and §6 (`e28dac84`), R-15 cosmetic «titles breaking at 320 px»; `BM` `closure/Z-READINESS-CLOSURE-TABLE.md` (`e28dac84`), "OPEN / uncertain" | G | All journeys at 320; first met in J1 | Improvement | Z6's sweep checked framed overflow and the bar's place word, not titles. The closure table proposes "ruling 79 audit, dimension G" |
| L-04 | On «Minta membaca lagi» a lone lowercase «target 60%» sits outdented above the «Murid» group it qualifies; it should be a sentence inside the group («Target bab ini: 60%.») | `DX` `TINJAUAN-Z6-f322c25c.md` `9b1b5d68`, sweep run 2; first raised in `TINJAUAN-Z3A-36299159.md` `5722aa8f` §3(c) | G | J3, J5 | Improvement | **Merged:** Z3-A (c) and Z6 run 2 are the same item. ✓main: `mengajar/[kelas]/ulang/page.tsx:80` unchanged. Same at every width |
| L-05 | At 390 and 320 the breadcrumb's second line begins with a bare «/»; the separator should stay with the item before it | `DX` `TINJAUAN-Z6-f322c25c.md` `9b1b5d68`, sweep run 2 (capture `ulang-target-390`) | G | J5 | Improvement | Likely a shared Breadcrumb rule, so every breadcrumb page |
| L-06 | A refusal's reason is announced twice to a screen reader: the inline line and the result line say the same sentence | `DX` `TINJAUAN-Z5-bc5749ff.md` `ca1f4a30` §4, N-19 (Z5 captures 08 and 09) | G | J8 | Improvement | Optional, later. One live region is enough. Not re-checked on main |
| L-07 | At 320, «Laporkan masalah» on the bar's second line wraps between its words, because it shares the width with «Keluar» and the menu | `DX` `TINJAUAN-Z5-bc5749ff.md` `ca1f4a30`, recheck, N-20 | G | J1 (and every shell at 320) | Improvement | Allowed by the whole-word rule and readable; letting the second line span the full width is polish |
| L-08 | Four states were never seen by the sweep for lack of fixtures: Uji Cepat result and certificate list with no rows; `/studio/tinjau/kunci` with no pending correction; Studio's package page beyond N-8 | `DX` `TINJAUAN-Z6-f322c25c.md` `9b1b5d68`, sweep run 2 ("not a silent pass") | D | J5 (Uji Cepat), J7 (kunci, certificates), J6 (package page) | Improvement (unknown until walked) | Daisy routed them explicitly to J5 and J7. Severity may rise once seen States map to W11, W14 and W12 (Daisy) |
| L-09 | Should `/aktivasi/orang` also get R-11's stacked blocks on a phone, instead of the framed table? | `DX` `TINJAUAN-Z6-f322c25c.md` `9b1b5d68` §1 ("a later question, not a defect") | G | J8 (intake and cards) | Improvement | The framed table is accepted by design; this is an effort/readability question at 390/320 |
| L-10 | R-10 Option B: the 14-section Konfigurasi list on every sub-page (Option A, the shared «Tempat kerja Anda» navigation, was built) | `DX` draft header ("Option B of R-10"); `DX` `Z-SIAP-DAISY-7ba18b03.md` `94fba9cc` §1 item 1 (superseded spec) | F | J8, J12 | Improvement | The audit judges whether admins lose their way between sections |
| L-11 | The integrity count line has never been seen rendered | `BM` `Z-READINESS.md` R-13 and §6 (`e28dac84`); `EXECUTION-PLAN.md:80` on main | D | J12 (Konfigurasi health), J8 | Improvement (unverified) | Closure table: "named in neither D2-R nor the audit"; §6 now sends it to this ledger, checked in the audit's captures |
| L-12 | «Materi tanpa judul» (an untitled assignment) has never been seen rendered | `BM` `Z-READINESS.md` R-13 and §6 (`e28dac84`) | D | J5, J2 | Improvement (unverified) | ✓main: the key still exists in `hle.ts`. The synthetic world needs an untitled assignment |
| L-13 | «Jadwal materi ini tidak dapat diubah.» does not say why when the cause is lasting (e.g. content no longer shared), so the teacher can't tell what to do | `BM` `batches/sapu/SAPU-VERIFIED.md` `d24cbdc8` S-06 ("later: name the cause, SQL"); `DX` `SAPU-KONSISTENSI-706fe8c5.md` `39a5d254` S-06; `DX` `TINJAUAN-Z5-bc5749ff.md` §4 | C | J5 («Ubah jadwal») | Improvement | **Merged:** three sources, one item. «saat ini» was dropped in Z (✓main `hle.ts:4406`). The remainder needs the server to separate its guards: the audit records the experience; the fix touches SQL (Sharon) |
| L-14 | «Semua bab yang selesai sudah mencapai target.» counts only chapters with a verdict; a finished chapter with no verdict is silently inside "all" | `BM` `SAPU-VERIFIED.md` `d24cbdc8` K-06; `DX` `SAPU-KONSISTENSI-706fe8c5.md` K-06 | D | J2 (Hasil Belajar) | Improvement | Legacy sessions only (verified). ✓main: `KomposisiMurid.tsx:30` |
| L-15 | The SD tour's step 6 promises results showing "what you have mastered and what to practise"; the result page shows counts and parts to study, with nothing labelled mastered | `BM` `SAPU-VERIFIED.md` K-08 (⚑ model on `tur.nt.5.isi`); `DX` `SAPU-KONSISTENSI-706fe8c5.md` K-08 | H | J1 | Improvement (Significant if the SD tour is switched on) | The SD tour is dormant. ✓main: `tur.sd.6.isi` unchanged J1 grades the SD tour if it is on (Daisy) |
| L-16 | The learner's certificate page says «Hasil Uji Penguasaan Anda sudah memenuhi syarat…» from the pass alone; a passed non-official or non-certifying sitting then waits for a certificate that never comes | `BM` `SAPU-VERIFIED.md` K-09; `DX` `SAPU-KONSISTENSI-706fe8c5.md` K-09 | B | J2, J7 | Improvement | URL-only; rises to Significant if J2 or J7 finds a link to it (Daisy) |
| L-17 | One concept, four names: a report row is «topik», «tujuan pembelajaran», «bagian» («Penguasaan per bagian») or «bidang kompetensi»/«ranah» depending on the screen | `BM` `SAPU-VERIFIED.md` T-01; `DX` `SAPU-KONSISTENSI-706fe8c5.md` T-01 | B | J2, J5, J11 | **Significant** | The largest wording item; one pass. Teacher, learner and leader should be able to say they are reading the same thing. ✓main: `mengajar.bukti.bagian` «Penguasaan per bagian» |
| L-18 | The pass mark is per course, but several keys call the unit «pelajaran» where the sibling Siapkan refusals say «materi» | `BM` `SAPU-VERIFIED.md` T-04; `DX` `SAPU-KONSISTENSI-706fe8c5.md` T-04 | B | J8, J5 | Improvement | Part of the one wording pass (T-01, T-04 to T-12) |
| L-19 | Mode labels differ between two teacher tables: EN «Assessment» vs «Test»; «Peragaan publik» vs «Demonstrasi» | `BM` `SAPU-VERIFIED.md` T-05; `DX` `SAPU-KONSISTENSI-706fe8c5.md` T-05 | B | J5 | Improvement | ✓main: `jenis.mode.TEST` EN «Assessment», `mengajar.instrumen.TEST` EN «Test» |
| L-20 | English admin copy names the structure «Section/Grade/Class» against the kept «Kelas · Tingkat · Bagian»; «school year» and «academic year» both used | `BM` `SAPU-VERIFIED.md` T-06; `DX` `SAPU-KONSISTENSI-706fe8c5.md` T-06 | B | J8, J9 | Improvement | Follow DAISY-05; «school year» |
| L-21 | English says «learner» on teacher surfaces against «student» almost everywhere else | `BM` `SAPU-VERIFIED.md` T-07; `DX` `SAPU-KONSISTENSI-706fe8c5.md` T-07 | B | J4, J5 | Improvement | ✓main: 11 EN strings still contain «learner» |
| L-22 | Attempt and sitting have mixed words: Studio «Batas percobaan» vs «kesempatan»; EN «session» for a sitting; «pengerjaan» as «attempt» | `BM` `SAPU-VERIFIED.md` T-08; `DX` `SAPU-KONSISTENSI-706fe8c5.md` T-08 | B | J3, J4, J6 | Improvement | «kesempatan»; «sitting» |
| L-23 | «Peserta» labels a count of students on leaders' metrics, where the explanation says «murid» | `BM` `SAPU-VERIFIED.md` T-10; `DX` `SAPU-KONSISTENSI-706fe8c5.md` T-10 | B | J11 | Improvement | ✓main: `metrik.peserta.label` ID «Peserta» (EN already «Students») |
| L-24 | English uses «institution» for school and «educator» for teacher in places | `BM` `SAPU-VERIFIED.md` T-11; `DX` `SAPU-KONSISTENSI-706fe8c5.md` T-11 | B | J11, J8 | Improvement | ✓main: «institution» still appears in `hle.ts` (Z7 removed one instance via `laporan.templat.tak_berwenang`) |
| L-25 | Minor tail of term splits: «classroom card» vs «class card»; «Kartu PINTAR» lowercased; «wali kelas» as «homeroom»/«class teacher»; one «surel»; a sitting's «batas waktu» as «deadline» vs «time limit» | `BM` `SAPU-VERIFIED.md` T-12; `DX` `SAPU-KONSISTENSI-706fe8c5.md` T-12 | B | J1, J4 | Improvement | ✓main: «classroom card» ×3 |
| L-26 | The maintenance collision advice («Pertimbangkan memulai … setelah …») is computed from `closes_at`, not from running sittings, so it can advise the wrong start | `BM` `Z-READINESS.md` R-12 (`e28dac84`), N-3; `DX` `Z-SIAP-DAISY-7ba18b03.md` §3 N-3 | E | J12 | Significant (phase-bound: 4.5) | Same root as V-2 (no duration). Closure table: deferred → 4.5. The audit observes; the fix stays in 4.5 |
| L-27 | A «Lainnya» maintenance row reads «Alasan (dicatat): …» instead of a named reason | `BM` `Z-READINESS.md` R-12, N-5; `DX` `Z-SIAP-DAISY-7ba18b03.md` §3 N-5 | H | J12 | Improvement (phase-bound: 4.5) | Needs `maintenance_list` to return the code |
| L-28 | The row's «sisa … menit» on an A3 screen comes from the assignment's `closes_at`, not the sitting's own time | `BM` `Z-READINESS.md` R-20 (`e28dac84`), M3 | B | J4 | Significant (phase-bound: 4.5) | Goes with N-3 (L-26). Time-remaining words a learner or teacher acts on. Closure table: deferred → 4.5 |
| L-29 | Schools affected by a key correction hear of it in-app only («Yang menunggu»); the email was not built | `DX` `TINJAUAN-Z8B-04c78339.md` `7ed39412` (C1-R5); `DX` `R15-DAISY-7ba18b03.md` `087b5848`; `BM` `Z-READINESS.md` §5 (PETE-12, Review P) | B | J7 | Improvement (phase-bound: 4.5) | In-app half confirmed closed in Z8 |
| L-30 | The 4.0 "broader audit presentation" (how Jejak audit reads to an admin) | `BM` `Z-READINESS.md` §5 (`e28dac84`), R-15 «4.0, Daisy: broader audit presentation»; closure table → 4.5 | F | J12, J8 | Improvement (phase-bound: 4.5) | Its siblings (first-Tab scroll, 15 px header strip) are closed as accepted |

### D2-R observations (note only, not findings)

From `BM` `D2-CERTIFICATE-CONDITIONS-SPEC.md` §6.4 (`3b5edd66`). These are **recorded against D2-R, never as 4.1 defects**, and are not graded here:
- **N-D1:** before D2-R, observers will see today's certificate title, the «Predikat», and hints inside Uji Penguasaan. Scripts must not present them as final. (H/B; J2, J7)
- **N-D2:** the handbook and teacher guidance say "hints are available in the test"; that becomes false after D2-R. (H; J5, J2)

If the audit's journeys run on `claude/next-base` plus D2-R (NEXT-SEQUENCE-89 track 3), both notes should be moot by then; J2 and J7 confirm it.

### Counts by primary dimension

| A | B | C | D | E | F | G | H | Total |
|---|---|---|---|---|---|---|---|---|
| 0 | 10 | 1 | 4 | 1 | 2 | 7 | 5 | 30 |

- **B:** L-16 to L-20, L-22, L-23, L-25, L-28, L-29. **C:** L-13. **D:** L-08, L-11, L-12, L-14. **E:** L-26. **F:** L-10, L-30. **G:** L-01, L-02, L-03, L-05, L-06, L-07, L-09. **H:** L-04, L-15, L-21, L-24, L-27.
- **A has no primary row.** J1 meets L-03, L-07, L-15 and L-25 as first-use exposure.
- **Plus two D2-R notes** (N-D1, N-D2), ungraded.
- **Significant candidates (5):** L-01, L-16, L-17; and phase-bound L-26, L-28. **Critical: none.**

## 3 · Exclusions

**Fixed on `main` `61a6ff9e` (spot-checked where marked ✓):**
- **N-14** (`tujuan_arti` after K-01), matched word for word at Z3-A.
- **N-15** (failed objectives read in `perluPenguatan`): ✓ `pengajar.ts:1098` now null with `tujuan_gagal`.
- **N-16** (reopen wait sentence): ✓ `buka_kembali.galat.tunggu` is «Tunggu sebentar, lalu coba lagi.»
- **N-17** (button width held through «✓»): ✓ `TombolKirim.tsx:154` holds the width while `pending || tuntas`.
- **Z3-A C-1, C-2 and (b); Z5 C-1, C-2, (a) and (b); Z7 C-1 to C-3; Z6 defects (1), (4), (5) and (6).** Rechecked PASS by Daisy.
- **«Menga jar»:** did not reproduce on the merged tree.
- **The REOPEN «—» form on Akun saya:** fixed at `944520b0`.
- **R-15 cosmetic items:** Kenaikan «·» join and group order, «Tambah Tingkat» year, X12 «Paket Pembelajaran».
- **R-15 4.0 items:** audit-run Tab scroll and 15 px strip, closed as accepted.
- **Sweep rows fixed in Z (ruling 78):** S-01 to S-05 and S-07 to S-16; K-01 to K-05 and K-07; T-02, T-03 and T-09.
- **The rest:** S-06's «saat ini» half; N-1, N-2, N-8 and N-9; R-10 Option A; R-11; R-26 items 1 to 4; A1-R1, R2 and R4; C1-R2 and C1-R4 (in-app); C1-R5 in-app.

**Security, DB or integrity only (Sharon's phases or 4.5):**
- R-2, R-3, R-4, R-6, R-14, R-23 and R-25.
- R-24: consent is the owner's (OD-9); rollover is 4.5.
- Sharon's R-15 items: run-guard order; re-check at approval; statistics after a revision; confirmer preference.
- K-07's pass-mark floor (done in Z anyway).
- K-01's gate-objective SQL.

**Bound to D2-R, not the audit:**
- the night-issued certificate date (R-13, → D2-R step 1f);
- the printed «Predikat» under review (C1-R4, → D2-R R-c);
- D2 §6.4, kept above as notes only.

**Not findings:**
- 4.2→4.5 design commitments in `DX` `docs/coordination/ux/roadmap/TINJAUAN-AUDIT-PERENCANAAN-63c66ba9.md` (Exam Mode, context line, export, past reports and others). These are feature design for 4.5.
- The 4.1 walkthrough plan (`WALKTHROUGH-41-RENCANA-OBSERVASI.md`). It is a source of tasks and measures, not a findings list, and the walkthrough stays after 5.0.

**Not swept (outside the listed sources):**
- **What:** the "next batch / not blocking" notes in pre-Z reviews: A2b-D8 B1 and B2, B1-40e89308, B2-546d9eb7 and C2W-KANONIK.
- **Why it matters:** some may already be closed and some may be audit-bound.
- **Next step:** worth one pass before the ledger is committed.

**Open questions for the consolidator:**
- the evidence owner per journey;
- whether the educational reader (through the owner) reads J2, J3 and J11;
- one shared synthetic world or per-journey fixtures.

L-08, L-11 and L-12 need the world to hold empty, untitled and integrity states.

## Added from Daisy's register read (24 Nov, `fef73844`)

| L-id | Finding | Source | Dimension | Journey | Proposed severity | Notes |
|---|---|---|---|---|---|---|
| L-31 | «Laporkan masalah» promises «dalam satu hari sekolah» and «hari sekolah yang sama» while PR-12 and PR-15 are open | `BACA-REGISTER-PR12-15-19.md` `fef73844` | C | J5 | **Significant** | The register owns the fix (PR-12/PR-15, or softened strings); J5 observes it |
| L-32 | The error page has no «Laporkan masalah» link carrying the reference code, and tells a learner «pengelola sekolah Anda» where the product says «guru Anda» | same | C, B | J10 | Improvement | — |
| L-33 | One verdict in two words: «Lulus» for the learner (after D2-R) and «tercapai» for the teacher | Daisy, `LEDGER-79-KONFIRMASI-689f8a35.md` `3b40e31f` | B | J3 | Significant (candidate) | J3 confirms or drops it |


**Confirmed by Daisy (24 Nov, `LEDGER-79-KONFIRMASI-689f8a35.md`, `3b40e31f`).**
- **Totals:** 33 rows. **Significant:** L-01, L-17, L-31 and L-33 are open; L-26 and L-28 are bound to a later phase. **Critical:** none.
- **The pre-Z sweep found nothing new:**
  - A2b-D8's N-1 and N-2 were fixed in Z7; its N-5 is L-27.
  - B1-R1 to R5 were closed at the B2 visit, and B2 left nothing open.
  - C2w-Kanonik's N-6 and N-7 were fixed before C3w-1.
- **Journey ids** refer to her final scripts (`AUDIT-79-SKRIP-PERJALANAN.md`, `a06e13e9`). The ids are unchanged from the draft.| L-34 | «Matematika · Matematika Kelas 5 …»: the subject is repeated before a course title that already names it | Daisy, `TINJAUAN-D2R-42f6f432.md` (`6a96917c`), N-21; predates D2-R | B | J2 | Improvement | — |
