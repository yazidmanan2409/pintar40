# Ruling 79 · the consolidated findings ledger (draft 1; Bob, 24 Nov 2026; track 3a)

**THE AUDIT IS OPEN (ruling 94, 24 Nov 2026).** 4.1's gates are closed: D2-R is on main `429b7dcc` and on staging at 309, accepted by the owner. Findings are made on main (`429b7dcc` or later), on synthetic data, in approved environments only. Scope is ruling 79's: no new features, no policy changes, nothing on production. The fixes are ONE consolidated revision.

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

## Observations from the harness (builder, 24 Nov, `claude/audit-79-world` `f3c05c5b`): recorded, not yet judged

| L-id | Observation | Source | Dimension | Journey | Proposed severity | Notes |
|---|---|---|---|---|---|---|
| L-35 | After a rollover, «Terima perpindahan» on the old request is still ACCEPTED (REQUESTED → AUTHORIZED). The refusal comes only at «Laksanakan», and **the old request then stays AUTHORIZED**, a dangling row. On a new request, the learner lands in the receiving school's *current* year (2026/27), although the sending school had promoted them to 2027/28 | J9 step 2 capture | B, E | J9 | **4.5** (Sharon, 24 Nov: not a 4.1 correctness defect) | It fails closed by V5's design: nothing is written, the refusal is named, and a new request works. **4.5, joined to the rollover race:** (a) the acceptance step refuses a closed source enrolment by name, before AUTHORIZED; (b) a transfer whose source has closed becomes EXPIRED or CANCELLED, with its cause. **Year placement: intended.** `to_academic_period_id` is the receiving school's own choice, and schools keep their own calendars. A 4.5 UX note: show the receiving admin the sender's latest period and outcome when choosing. **Audit check:** the sender's promotion record stays readable to the receiver through `portable_visibility`. **Human side (builder's J9 capture, run 15 at `078c8f2d`, `08-b-laksanakan.png` and `13-b-dilaksanakan.png`):**
- After the refusal, the stale «Disetujui» row **still offers «Laksanakan» and «Tolak»**, even after the new request is «Selesai».
- The refusal names the next step, but only for the *sending* school.
- The row shows its origin as «Qori Ananda · — →», with no source school.

**Significant, confirmed by Daisy.** The human fix, for 4.5 with Sharon: (1) the stale row stops offering «Laksanakan»; (2) the refusal also tells the receiver «Tolak permintaan ini. Permintaan baru dari sekolah asal akan muncul di daftar ini.»; (3) once a newer request for the same learner is «Selesai», the stale row closes itself or reads as superseded. The placement stays 4.5 (Sharon), with (b) above becoming the fix that stops «Laksanakan» being offered. |
| L-36 | The last usable Admin PINTAR's own row offers only «Perpanjang», never «Lepaskan»: ROLE_LAST_PLATFORM_ADMIN guards a release the screen doesn't offer | J12 step 6 | E | J12 | **Improvement**, per Daisy's f19d202c rule: a missing control with no reason given. The row reads «Hendra Kusuma · Admin PINTAR · … · Perpanjang», with no «satu-satunya admin yang aktif». `peran.berakhir.terakhir` is drawn only when `pemegang_terakhir` is set (`konfigurasi/page.tsx:2092`), and for the last platform admin it isn't | The prevention itself is right; the row should say why |
| L-37 | On the W18 state, the school summary's «semua» sentence is «…dari semua bukti sekolah ini…». The script's «Semua bidang kompetensi yang punya angka…» doesn't appear, because several domains are withheld | J11 step 4 | — | J11 | **No finding** | The capture (`56a8c25a`) shows the scope line, and names the withheld domains and cohort comparisons on the same page |

**An environment fact, not a finding:** `/api/email/uji` rejects 127.0.0.1 as cross-origin (`BUKAN_ASAL_SAMA`), because Next reports the origin as localhost. A deployment with one hostname has no such split.
| L-38 | The receiving admin's transfer row shows its origin as «Qori Ananda · — →», with no source school, so the admin decides without knowing where the learner comes from | J9 capture (`078c8f2d`); Daisy | B, E | J9 | **Significant** by Daisy's rule. The builder's capture (`11-b-masuk-baru.png`, `12-b-diterima.png`, `13-b-dilaksanakan.png`) shows that **new requests show «—» too, in every state**. The source school is named only on the «Permintaan pindah masuk» card («dari SMP Sintetis Flamboyan (FLB)»), which disappears once the request is accepted. From «Disetujui» onwards, nothing names the source | The fix: show the source school's name as it was when the request was made. Goes with L-35 |

## The owner's /konfigurasi sidebar observations (24 Nov, via Daisy `SIDEBAR-KONFIG-CATATAN.md`, `762312ca`): decided, held for the audit's ONE consolidated revision

The owner: «you and bob decide what's best». Daisy decided and Bob agrees; Daisy confirmed the mapping on 24 Nov. **Nothing is built now.** These rows go into the audit's consolidated revision, together with whatever its visual-consistency pass finds.

| L-id | Observation | Source | Dimension | Journey | Proposed severity | Decision |
|---|---|---|---|---|---|---|
| L-39 (K-1) | The «›» chevrons are misaligned. The row is justify-between over three children (the title, the chevron and a zero-width TandaTautan), so the chevron sits mid-row | Owner, staging /konfigurasi | B | J8, J12 (the admin lists), plus the visual pass | **Improvement**: a defect, not taste; fix it with the sibling sweep (Daisy) | Pin the chevron right. Check **every** list that uses this row (sibling sweep) |
| L-40 (K-2) | «Masuk sebagai» crowds the name | Owner | B | Every journey (the chrome) | Improvement | Two rows; the name gets the full width |
| L-41 (K-3) | «Keluar» lacks a visible control boundary | Owner | G | Every journey | Improvement: the label carries the control, so it is not a 1.4.11 blocker (Daisy) | A neutral outline, `--line-control` (3.4:1, which passes WCAG 1.4.11). Not orange (it isn't in the palette), not gold (2.5:1 fails, and gold is the certificate's colour), not amber (it means attention) |
| L-42 (K-4) | The ID / EN control is unclear | Owner | B, F (room taken from the sidebar) | Every journey | Improvement | A text switch, «ID · EN»: targets of at least 24 px, with `aria-pressed` |

## Carried from D2-R's frozen candidate (`177ab4d2`, ruling 93; Bob, 24 Nov)

| L-id | Observation | Source | Dimension | Journey | Proposed severity | Notes |
|---|---|---|---|---|---|---|
| L-43 | **R-f's staff display is not drawn.** Spec R-f / D2R-F01: the attempt ordinal is shown «on the learner's result and in authorised staff views only». The learner's result draws «Kesempatan ke-{n}». The teacher's sittings read carries `daftar_pengerjaan.percobaan_ke`, but the teacher's sittings screen doesn't draw it | D2-R hand-off item 131, disclosed to Sharon and Daisy before their PASS on `5550e508` | B | J3, J5 | **Significant**, confirmed by Daisy: on retakes a teacher can't tell attempt 1 from attempt 2, which J3 needs | No wording is missing: «Kesempatan» is Daisy's learner **and** teacher word (spec §7.3). The ordinal's restriction (no certificate, no public page) **is** enforced. Not changed on the frozen candidate, by ruling 93. Fix it in the audit's consolidated revision |

## J2 walked (Daisy, `AUDIT-79-TEMUAN-J2.md` `7755a3d8` on ux-1/daisy-experience; local build of main `429b7dcc`; 24 Nov)

Ten findings: 3 Significant, 7 Improvement, none Critical. Still open for J2: the screen-reader, throttled and reduced-motion passes, from the builder's CI capture run on `00fe853d` or later.

| L-id | Observation | Source | Dimension | Journey | Severity | Notes |
|---|---|---|---|---|---|---|
| L-44 (J2-1) | `/belajar/{t}/sertifikat` says «Sertifikat Anda sedang disiapkan … akan muncul di sini» on a pass that can never certify (non-OFFICIAL, INV-20: every demo and preview school), while the result page correctly shows nothing (§13) | J2 | B, E | J2 | **Significant** | **A sibling of D2-R's `keadaanSertifikat`, missed by D2-R's sweep:** the certificate page doesn't follow the same three states. Fix: the page follows §13, and where no certificate is possible it says so and promises nothing. Record it as an L-8 / sibling-defect lesson |
| L-45 (J2-2) | The teacher's `/mengajar` home says «Tidak ada yang menunggu keputusan Anda hari ini.» while a learner is blocked on «minta lanjut», and the learner is told it «tampil di daftar kelas guru Anda» | J2 | A, E | J2, J4 | **Significant** | A waiting request becomes the teacher's «one thing first» |
| L-46 (J2-3) | With every lesson read, «Siap untuk Uji Penguasaan» still says «Mulailah dari kartu paling atas…» | J2 | B | J2 | **Significant** | The agreed line is «Semua pelajaran sudah dibaca.» |
| L-47 (J2-4) | «sisa 259191 menit» | J2 | A | J2 | Improvement | A human unit (days/hours) |
| L-48 (J2-5) | «Selesai · target tercapai» and «mencapai target» beside «Lulus» | J2 | B | J2 | Improvement | Evidence for L-33 |
| L-49 (J2-6) | The Belajar card says «dipelajari lagi»; the page says «baca lagi» | J2 | B | J2 | Improvement | One term: «baca lagi» |
| L-50 (J2-7) | The result's last three lines run together at 390 | J2 | G | J2 | Improvement | Spacing |
| L-51 (J2-8) | Two page numbers on one lesson screen | J2 | B | J2 | Improvement | — |
| L-52 (J2-9) | The five-step dots have no labels at 390 | J2 | F, G | J2 | Improvement | — |
| L-53 (J2-10) | «Keluar» is outlined on mobile but not on desktop; ID / EN is heavy | J2 | B | Every journey | Improvement | Goes with L-41 and L-42 |

## J3 walked (Daisy, `AUDIT-79-TEMUAN-J3.md` `20d3fdc9` on ux-1/daisy-experience; the audit world at `00fe853d`; 24 Nov)

Nine findings: 5 Significant, 4 Improvement, none Critical. **The core cross-role check holds:** the verdict is the same on all three surfaces; only the words differ (L-33). Not walked here: W7b, W8 and the screen-reader, throttled and reduced-motion passes (from the builder's capture run). **Ruling 95 applies:** these rows feed the common-cause analysis (`AUDIT-79-COMMON-CAUSES.md`), not one patch each.

| L-id | Observation | Dimension | Journey | Severity | Notes |
|---|---|---|---|---|---|
| L-54 (J3-1) | While a retake is open, the learner's result page is a 404 («Halaman ini tidak ada»); the teacher's side shows `hasil.ulang_berjalan` | B, C | J3 | **Significant** | The agreed design keeps the previous result in force, with `hasil.ulang_berjalan` |
| L-55 (J3-2) | After the retake, the teacher's record shows two Uji Penguasaan rows with no attempt number and nothing marked as current, the older first, each with «Minta membaca lagi» | B | J3 | **Significant** | **Widens L-43** |
| L-56 (J3-3) | After approval, the learner's start page says «Tidak ada lagi yang menunggu…» at the top, with «Uji Penguasaan dapat dikerjakan sekali lagi · Mulai» further down | B, H | J3 | **Significant** | — |
| L-57 (J3-4) | After approval, the result still says «Tanyakan kepada guru Anda kapan dapat mengulang.», and the chapter offers no way into the retake | H, B | J3 | **Significant** | — |
| L-58 (J3-5) | The approver's page: «1 permintaan kesempatan tambahan menunggu persetujuan», then «Bagian A · Keputusan — Tidak ada keputusan yang menunggu Anda.» | B | J3 | **Significant** | The same shape as L-45 |
| L-59 (J3-6) | After a not-yet-passed result, the chapter's map still marks every section «Sudah kuat» (from the Pemetaan Awal), while the result says «Baca lagi: …» | B, H | J3 | Improvement | The same root as L-46 |
| L-60 (J3-7) | The retake request is offered only in the sittings list's «Atur» panel, not on the learner's record beside the result | F, A | J3 | Improvement | — |
| L-61 (J3-8) | One verdict, three wordings on the learner's own pages | B | J3 | Improvement | With L-33 and L-48 |
| L-62 (J3-9) | Approving a retake is one press, while refusing needs a reason | E | J3 | No change proposed | Noted for the E pass |

## J4 walked (Daisy, `AUDIT-79-TEMUAN-J4.md` `f7130620`; the local audit world; 24 Nov)

**«Work kept» holds on every branch walked:** permission → resume at 2 of 6; offline, an answer held and sent on reconnect (the DB agrees); the teacher's scored end used exactly the saved answers. J4-2 confirms L-45 at a second school, and J4-5 confirms L-47; neither is a new row. Not walked: time running out, maintenance (J12), not-counted, and the SR, throttled and reduced-motion passes.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-63 (J4-1) | A learner whose sitting the teacher ended isn't told so: the result reads «Belum lulus … 2 dari 6», as if handed in. The teacher's row says «Diakhiri 17.41 WIB · jawaban yang ada dinilai» | B, D | J4 | **Significant** | **C-2** (the teacher's end reached the teacher's screen only) | «Uji Penguasaan ini diakhiri oleh guru Anda pada {waktu}. Jawaban yang sudah tersimpan dinilai.», plus a not-counted variant on the start page. **Ruling 96: preserve the circumstances under which an assessment ended**, so the learner understands why the result was produced |
| L-64 (J4-3) | An open sitting's card reads «Siap untuk Uji Penguasaan» + «Lanjutkan» | B | J4 | Improvement | **C-2** (the step derivation has no «in progress» step for the Uji Penguasaan) | «Uji Penguasaan sedang berjalan» |
| L-65 (J4-4) | «Sedang luring» is a hard word for children | A | J4 | Improvement | Wording only | «Tidak tersambung ke internet. …» |

## Found by the consumer check of `my_cycle_state` (Bob, 24 Nov; Sol's qualification 1)

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-66 | While a retake is open, a certificate earned on an earlier attempt loses its chapter title in the certificate list: the list maps certificates through `my_cycle_state.post_session`, the latest *begun* sitting (`belajar/sertifikat/page.tsx:71`). Also, `adaHasilTertutup` falls back to the pre-test while a retake is open (`hasil-belajar.ts:59`) | B, C | J3 (retake open) | Improvement (it degrades gracefully: the date and status stay) | **C-1** | To be confirmed by the builder's J3 capture with a retake open |

## J7 walked (Daisy, `AUDIT-79-TEMUAN-J7.md` `2002b662`; the local audit world W14, with certificates issued through the route; 24 Nov)

**What works:** the three-step correction proposal with its exact impact preview; «Hasil asli tetap tersimpan»; «Sedang ditinjau» agreeing everywhere; K-05 on the public page.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-67 (J7-1) | Under «Sedang ditinjau», a certificate whose result was recalculated to a fail (67 → 50%, target 60) offers «Konfirmasi berlaku» exactly like a still-passing one: one press, no confirmation, no words naming the effect. Afterwards the **public check reads «Berlaku · HASIL Lulus»**, while the learner's own result says «Belum lulus» | E, C, D | J7 | **CRITICAL, provisionally (ruling 96).** **Sharon's assessment, superseded by her addendum** (`AUDIT79-J7-1.md`, 24 Nov): **a CONFIRMED integrity defect, CRITICAL by nature; she agrees with the provisional class.** Against the approved policy (D-2 §1.2; C1w O41-21/22), a certificate asserts that the criteria were met by the result in force. Nothing sanctions confirming a now-failing result: once recalculated to a fail it is DITINJAU until decided, and the only consistent decision is DICABUT. **Mitigations, not a downgrade:** absent on production (111 < migration 229), no real certificate exists, staging is synthetic. **What the public check may show:**
  - review open: DITINJAU, with «Seperti saat diterbitkan · Lulus»;
  - still passing and confirmed: BERLAKU;
  - failing and decided: DICABUT only;
  - reissued: DIGANTIKAN;
  - it NEVER states the recalculated result publicly.
  **Her three proposed fixes, none built, for the owner:** (1) the DB refuses CONFIRMED when the result in force fails; (2) a defensive read-side invariant: `verify_certificate` gives BERLAKU only while the result in force passes, otherwise DITINJAU or DICABUT; (3) the staging count (done: 0). Exposure: production (111) doesn't have the flow (it arrives in migration 229). On **staging (309), read-only at about 11:00Z: 0 certificate reviews in total** (0 open, 0 open-and-now-failing, 0 confirmed-and-now-failing; 66 certificates). Nothing to revoke. **Classification: CRITICAL, confirmed by Sharon** | **C-7 (new)** | Daisy: should the button exist at all on a now-failing result? At least, a confirmation that names the effect, with «Cabut» suggested. **Ruling 96: three facts, each communicated truthfully and distinctly: the original passing result, the recalculated result, and the certificate's current validity**. **Sharon's enforcement:** in the database, `putuskan_tinjauan_sertifikat` refuses CONFIRMED when `sertifikat_layak_dengan(...)` on the result in force is false (`CERT_REVIEW_RESULT_NO_LONGER_PASSES`), so only REVOKED remains. `verify_certificate` reads «pass» from the sealed issue payload, so a dialog cannot make a public «Berlaku · Lulus» true. The UI offers only «Cabut» on a now-failing row, naming the effect. Red first: a direct RPC refusal, and a still-passing review confirms as today. **Owner policy question:** may an institution «keep» an award whose result was recalculated to a fail? If so, it is a distinct decision whose public read says something true, never «Berlaku · Lulus» |
| L-68 (J7-2) | A certificate under review still tells its holder the check page confirms it is «masih berlaku»; the public page says «tidak dinyatakan berlaku» | B, C | J7 | **Significant** | C-3 | — |
| L-69 (J7-3) | The second person is told nothing waits for them (Studio home, /pimpinan, the queue's own empty line) while a correction waits for them | A, E | J7 | **Significant** | C-4 | The third sighting of C-4 |
| L-70 (J7-4) | The reissue panel says «tidak pernah dihitung ulang» right after a recalculation | B | J7 | **Significant** | C-3 | — |
| L-71 (J7-5) | Only the admin can flag a wrong key; the teacher and the head of department see it but can't act | A, F | J7 | Improvement | **C-8 (new)** | — |
| L-72 (J7-6) | Keys are shown as letters only («A → B») | A | J7 | Improvement | Wording / layout | — |
| L-73 (J7-7) | Step 2 is wordy | A | J7 | Improvement | Wording | — |
| L-74 (J7-8) | One verdict, different words | B | J7 | Improvement | C-6 (L-33) | — |

## J10 walked: the signed-out paths (Daisy, `AUDIT-79-TEMUAN-J10.md` `4dd5afc3`; the local audit world; 24 Nov)

**[S] holds: no existence oracle was seen.** A wrong PIN, an unknown ID and a reset account all read the same, and the reopening confirmation says «Jika akun itu memang sudah ditutup …». **Also holds:** the reveal button is named; the ways out are named; a double press made one REOPEN request; there is no time promise; Back doesn't resend. **Left for the builder's run:** the email path (no mail service locally), the session lock, PIN recovery expiring, and the SR, throttled and reduced-motion passes. **Ruling 96:** any account-specific disclosure is Sharon's decision.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-75 (J10-1) | A closed account signing in with the **correct** password reads «Email, username, atau password belum cocok», so the owner is sent to retype or reset a right password | A, D | J10 | **Significant** | **C-9 (new)** | Daisy proposes that, once the password is proven, «Akun ini sudah ditutup. Anda dapat meminta dibuka kembali.» + the link is not an oracle. With a wrong password the refusal is unchanged. **Sharon's decision (`AUDIT79-J10-L75-L76.md`): ACCEPTABLE for a PASSWORD account**, on three conditions: (1) only after the password is proven server-side; (2) the wrong-password path is unchanged (status, body, counting, jeda-equalised timing); (3) reopening forces a new password at the first sign-in after it. **For the learner's PIN/card sign-in: do NOT disclose.** A PIN is low-entropy, so disclosure would make a PIN-confirmation oracle for a reopenable account. **BLOCKED on L-78** |
| L-76 (J10-2) | A learner whose PIN was reset gets «tidak cocok, periksa keduanya» on PIN recovery | A | J10 | Improvement | C-9 | One line for everyone, revealing nothing about the account: «Bila PIN Anda baru diatur ulang oleh sekolah, pulihkan lewat email atau tanyakan kepada admin sekolah.» **Sharon: CONFIRMED, it reveals nothing**, provided it shows on EVERY PIN-recovery refusal, never conditioned on a reset, with response and timing unchanged |
| L-77 (J10-3) | The reopening form's short-message check is only the browser's bubble | G | J10 | Improvement | Layout | The page's own line by the field |

## Raised by Sharon from J10 (24 Nov): a possible existing state oracle, under test

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-78 | Closed and suspended accounts are banned in Supabase Auth, and Auth's token endpoint is callable directly with the public anon key. **If Auth answers `user_banned` before checking the password, an account's closed state is already public to anyone who knows its email**, whatever PINTAR's screens say | D | J10 | **CONFIRMED (Second Eye, 24 Nov 11:33Z).** **Sharon (`AUDIT79-L78.md`): HIGH now, a PRODUCTION BLOCKER (PR-22), and Critical by nature once real minors hold accounts** (a suspension can be a safeguarding act). A second oracle: on a banned account, the right password takes 71 ms and a wrong one 27 ms. **Fix: CI-2** | — | **The test (Second Eye, local stack only):** `/auth/v1/token?grant_type=password` directly, 20 calls each: banned + right password; banned + wrong password; ordinary + wrong password. Record status, error_code, body and median time, and do the same for the card path. If `user_banned` doesn't depend on the password, stop: it's an existing oracle, and the fix belongs at the Auth layer. L-75 waits on this |

## J5 walked in part (Daisy, `AUDIT-79-TEMUAN-J5.md` `01441d33`; 24 Nov)

**Covered:** Ayu's /mengajar, 8A and 8C, «Siapkan» to its last step, Bukti, Uji Cepat and Langkah. **For the builder's J5 run:** running an Uji Cepat (late joiner, a stop), «Minta membaca lagi» sent, «Ubah jadwal», «Tambah waktu», and the SR, throttled and reduced-motion passes. J5-5 repeats L-47 and L-64; it is not a new row.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-79 (J5-1) | «Statistika Dasar» reads «Siap disediakan» on the class page and the Siapkan list. Its review step says «Batas ketuntasan belum ditetapkan … belum bisa disediakan», yet still offers «Sediakan …», which the database refuses (ASSIGN_PASS_MARK_MISSING) | B, E | J5 | **Significant** | C-3, C-7 | Readiness is derived three ways; the action is offered although its rule refuses it (the same shape as L-35) |
| L-80 (J5-2) | The home's «Layak dikerjakan lebih dulu» suggests the «(8B)» copy for 8A, which already runs that chapter, and doesn't mention 8C, which has nothing | A, H | J5 | Improvement | C-4 | Partly world data (same-name publications): **the builder confirms** |
| L-81 (J5-3) | 8C's Langkah offers Uji Cepat, which dead-ends with no link onward | H | J5 | Improvement | C-7 | — |
| L-82 (J5-4) | Siapkan's certificate step still says «bila murid memenuhi capaian» | B | J5 | Improvement | C-6 | **A D2-R §4 sibling missed by its sweep** (like L-44): it should say «lulus Uji Penguasaan» |

**J10 confidentiality marking (Daisy, `c3dc8088`; ruling 96):** L-75 reveals the closed state, but only to the holder of the correct password; Sharon decides, and it's blocked on L-78. **The no-reveal fallback** is one line for everyone: «Bila akun Anda sudah ditutup, password yang benar pun tidak dapat dipakai untuk masuk. Minta dibuka kembali.» L-76 and L-77 reveal nothing.

## J6 walked (Daisy, `AUDIT-79-TEMUAN-J6.md` `6b1c6d0f`; 24 Nov)

**AI provenance holds:**
- each draft reads «Draf dari AI · Disusun dengan AI (penyedia lokal (stand-in), …) … diminta oleh …»;
- the head counts «5 dari 8 soal disusun dengan AI»;
- the learner preview has no AI wording;
- W13 has no AI button.

**World question (builder):** W12's second AI request was ADMITTED (two DRAFTED) rather than refused AI_JATAH_HABIS, probably because the stand-in settles far below its reservation, so «allowance used up» wasn't reachable. **From the builder's run:** «Ajukan» → reviewer → approval, the ceilings, a learner-data source, and a stale form. The app must run with `PINTAR_AI_STUB_HARNESS=1` and the `PINTAR_SMTP_*` sink, as in CI.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-83 (J6-1) | The package head says only «Perlu tindakan · Ada yang bisa Anda selesaikan sekarang»; the step itself is named only at the bottom | A, H | J6 | Improvement | C-4 | — |
| L-84 (J6-2) | «Terima» gives no confirmation line | D | J6 | Improvement | — | — |
| L-85 (J6-3) | The AI allowance is never shown before a request | A | J6 | Improvement | — | **Sharon decides** whether a figure may be shown to teachers |

**J2, the builder's capture run (`da220028`), judged by Daisy (addendum to AUDIT-79-TEMUAN-J2.md, `61829330`):**
- **No help on a lesson (L3): not a finding, and not a D2-R regression.** Lesson help comes from the lesson's worked example: the seeded Pecahan lessons show it, and W3's lessons have none. R-d removed help only from certifying sittings. The builder adds a worked example to one W3 lesson.
- **The SR double drawing is not reproduced** at Pemetaan Awal q1. The builder sends the state and the ARIA excerpt; if confirmed, it's Significant (G).
- **The name absent from the public page (L8):** holds, the intended privacy boundary.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-86 | The certificate's verification address is shown on screen as text plus «Salin tautan verifikasi», not as a link | A, G | J2 | Improvement | — | On screen, a link («Buka halaman pemeriksaan»); on paper it stays text plus the QR |
| L-87 | «Soal 1/3» is exposed to the screen reader as img | G | J2 | Improvement | — | Text or a status |

## J8 walked in part (Daisy, `AUDIT-79-TEMUAN-J8.md` `8f20190a`, as W15's admin; 24 Nov)

**Covered:** every Konfigurasi sub-page while empty, Pendataan, Aktivasi, the structure built through the screens, a wrong year, a wrong school code. **Holds:** the readiness list updates and points to each step, and the empty states guide well. **L-39 is confirmed at a second school** (the chevrons end at x 801–879). **Left for the builder:** roles with dates, the planted-error workbook, printed cards, a renamed rule, the last admin's refusals, and the SR, throttled and reduced-motion passes.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-88 (J8-1) | Three fields (an empty Bagian name, the school code «A-1», a short reopening message) are refused only by the browser's bubble, never by PINTAR's own line. The Tingkat's year field does give PINTAR's refusal | G, A | J8, J10 | Improvement | **C-10 (new)** | **Absorbs L-77.** One rule: PINTAR's line by the field, announced, with the value kept |
| L-89 (J8-2) | «2026/27» and «2026/2027» for the same year | B | J8 | Improvement | C-6 | One format |
| L-90 (J8-3) | Old ✓ confirmations pile up | G | J8 | Improvement | — | — |
| L-91 (J8-4) | Kelas are added one per submission (about 20 for a 600-learner school) | F | J8 | Improvement | — | Allow «1A, 1B, 1C» |
| L-92 (J8-5) | A bare «Belum ada.» on Sistem & Konfigurasi | A | J8 | Improvement | — | — |
| L-93 (J8-6) | «Struktur sekolah di atas», but it isn't above | B | J8 | Improvement | — | — |

**L-78 result** (Second Eye, `docs/completion-4.1/audit-79/L78-AUTH-BANNED-LOCAL.md`, `e59276ce` on `claude/l78-auth-banned`, local stack from main `429b7dcc`, synthetic accounts, no code change; stopped after round 1 as instructed). `POST /auth/v1/token?grant_type=password` with the anon key:

| Case | Status | error_code | Time |
|---|---|---|---|
| (a) banned, right password | 400 | `user_banned` | 71 ms (first call) |
| (b) banned, wrong password | 400 | `user_banned` | 27 ms |
| (c) ordinary, wrong password | 400 | `invalid_credentials` | 28 ms |
| (d) ordinary, right password | 200 | — | 42 ms |

- **(b) ≠ (c), and (a) = (b):** Auth answers the ban BEFORE checking the password. Anyone holding the public anon key and an email learns whether that account is closed or suspended.
- **Cards too:** a card's Auth email is derived from its number (`card-<n>@<CARD_EMAIL_DOMAIN>`). Card 7002 (suspended) with a wrong password gives `user_banned`; card 7001 gives `invalid_credentials`. A card number alone, with no PIN, reveals whether that learner's account is suspended.
- **PINTAR's own routes mask it.** `/masuk/kartu` answers 401 CARD_NOT_MATCHED alike for (a), (b) and (c), because `akunTerkunci` maps `user_banned` to the ordinary non-match. A direct call to Auth bypasses the mask.
- Suspension and closure both set the same `banned_until` (2999-12-31) through `akun_kunci`, so Auth tells «locked» apart, but not which kind.

**Exposure, by migration order (no production read):** `banned_until` is first used by migration 221 (`20270113130000`). **Production (111) does not have the mechanism, so nobody is banned there and nothing leaks.** **Staging (309) has it, and its accounts are synthetic.** **L-75 stays unbuilt, and the existing protections stay (ruling 96).** **Sharon withdraws L-75 as designed:** after CI-2 there is no proven-password path, so everyone sees one line instead: «Bila akun Anda ditutup atau ditangguhkan, Anda dapat meminta dibuka kembali.», with the link.

## J9, J11 and J12 walked (Daisy, with the builder's harnesses run locally at 1280, 390 and 320; 24 Nov). **All twelve journeys now have a TEMUAN file.**

**J9** (`AUDIT-79-TEMUAN-J9.md` `5a9b299b`): L-35 and L-38 confirmed. The refused step changed nothing (the data is identical). **J11** (`c30b115a`): L-37 holds; the withheld domains are named with reasons on the summary. **J12** (`1d4cfad0`): for the builder's CI run, L5 (the test email; no mail sink) and L6.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-94 (J9-1) | The year-end promotion review doesn't mention a learner's open transfer, and promoting her strands it | E, H | J9 | **Significant** | C-7 | **The upstream cause of L-35.** Name each learner with an open transfer in the review, with its consequence |
| L-95 (J9-2) | A duplicate line, «4 naik ke 8A» | B | J9 | Improvement | — | — |
| L-96 (J9-3) | «menunggu persetujuan dari pihak lain» doesn't name the other school | A | J9 | Improvement | — | Name it (Kenari). Within the transfer's own parties, so no disclosure issue |
| L-97 (J11-1) | /pimpinan's «— · 10 murid» gives no reason, and its legend «— berarti data belum cukup» is false for a row withheld for privacy | B, C | J11 | Improvement | C-6 | Two reasons share one mark |
| L-98 (J11-2) | «dari 10» is unexplained | A | J11 | Improvement | — | — |
| L-99 (J12-1) | The maintenance warning tells learners «… dan keluar sebelum pemeliharaan dimulai», but signing out mid-test triggers A3's teacher-permission lock. **Following PINTAR's own instruction blocks them** | E, H | J12 | **Significant** | **C-11 (new)** | — |
| L-100 (J12-2) | «Batalkan» (red) sits beside a «Batal» link | B, E | J12 | Improvement | — | — |
| L-101 (J12-3) | «Mulai sekarang» (starting maintenance early) has no confirmation naming its effect on people told «30 menit» | E | J12 | Improvement | C-7 | — |
| — (J12-4) | The welcome tour covers the learner observer captures | — | J12 | **Harness, not product** | — | The builder fixes the capture |

**The builder's captures, committed (`claude/audit-79-world`; 24 Nov):** J2 at `audit/79/tangkapan/da220028/j2/` (`d62f967e`; walks at 1280/390/320/EN, SR, reduced motion, throttled, four branches); J2 L3 with the worked example (`567cc4da`); J3 at `audit/79/tangkapan/6792ecb9/j3/` (`3c1af1ae`; walks, the three passes, W7a/b and W8 on all three surfaces). Every walk reached its last screen. CI run 20 on `d3f02681` (the merge plus J2): PASSED.
- **RETRACTED: the «SR double drawing» was the builder's script artefact** (one snapshot printed twice), not the product. No question page repeats a heading. The only repeats are on the certificate page («Periksa keaslian» and the holder's name, the certificate plus its print preview); Daisy judges.
- **L-54 extended:** after W7b (the retake ended, not counted), the learner's result page still answers «Halaman ini tidak ada». The same C-1 cause.
- **L-43 confirmed in every J3 state:** the teacher's «Hasil resmi» never shows «Kesempatan ke-{n}».
- **W8 (the gate unreadable):** the learner sees counts with no verdict («5 dari 6 soal dijawab tepat · Kesempatan ke-1»); the teacher sees «83% belum dapat disimpulkan apakah target tercapai…». Daisy judges whether the learner's page should say why there is no verdict.
- **«Minta membaca lagi»'s pre-tick:** correct in every state (no pre-tick for W8, as scripted).
- **World data (Bob, routine): L-80 and J3's same-name publications are world artefacts.** The world published per-class copies of one chapter; a real school publishes once and gives it to several classes. **Approved:** one chapter for both classes, with the attempt limit on its shared definition; W3–W6 and J2/J3 reloaded and re-checked. L-80 is then re-judged on the corrected world.

## The J2 and J3 captures judged (Daisy, `e45994dc`, an addendum in each TEMUAN; 24 Nov)

Throttled and reduced motion: everything reached, nothing seen. **EN holds**, but the public check ran signed-out in ID: the builder re-runs that page in EN. **At 320** the header takes about a third of the screen (evidence for L-40 and L-42). L-54 (W7b) and L-43 are confirmed. **Good news:** after W7b the learner's card already says «Asesmen ini tidak dihitung dan tidak memakai kesempatan Anda …» (L-63's not-counted case), though it sits under «Siap untuk … / Lanjutkan» (L-64).

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-102 (J3-10) | **W8, the gate unreadable:** the learner gets counts with no decision and no reason, while the teacher reads «belum dapat disimpulkan …» with its reason | B, C | J3 | **Significant** | C-3 | «Keputusan lulus untuk Uji Penguasaan ini belum dapat ditentukan sekarang. Hasil Anda tetap tersimpan. Buka halaman ini lagi nanti.» |
| L-103 (J2-11) | The certificate's A4 preview is read in full by the screen reader: two h1 «{nama}», two «Periksa keaslian», two QR images | G | J2 | Improvement | — | Hide the duplicate preview from the accessibility tree |

**J4 captured** (builder, `1a4b8b76`, `audit/79/tangkapan/f606a740/j4/`): 10 walks, each reaching its last screen, including the three branches left for the builder. Daisy judges. The builder's observations:
- **Ended without counting:** consistent on all surfaces («diakhiri tanpa dihitung … tidak memakai kesempatan»).
- **Time ran out while away:** the sitting is EXPIRED, the teacher reads «Waktu habis», and the test page says «Tidak ada yang perlu dilanjutkan». **The learner's home still offers «Lanjutkan Uji Penguasaan»: siblings disagree** (C-2, the step derivation; with L-64).
- **Maintenance:** the banner, the page and the learner's «tetap dapat diselesaikan» show as designed. The teacher's row reads «sisa 259199 menit» (L-47 again).
- **The learner's result page is «Halaman ini tidak ada» in all three branch states** (L-54, C-1).
- **For Daisy (J7):** a reissue is possible only once the certificate's data has changed.

**J4 judged from the captures (Daisy, `3a1ba2f1`): J4 is CLOSED for builder lines.**
- **L-63 widened:** for time running out, the learner reads «… sudah selesai atau sudah ditutup» (a vague «atau») while the teacher reads «Waktu habis · jawaban yang ada dinilai». Fix: one sentence per way the sitting ended (ruling 96): «Waktu Uji Penguasaan ini habis pukul {waktu}. Jawaban yang sudah tersimpan dinilai.» + «Lihat hasil».
- **L-63's not-counted half is already met** on the learner's card, though it's labelled «Lanjutkan» where it means start again (L-64).
- **L-47 and L-54 are confirmed.** The tour covered the capture again (the builder's `lewatiTur` fixes it).
- **J7 (the script, not the product):** «Terbitkan ulang» is for changed printed data. After a recalculation the choice is «Konfirmasi berlaku» or «Cabut». Daisy's script is corrected; L-70 stands.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-104 (J4-6) | «Akhiri dan nilai» asks first; «Akhiri tanpa menghitung» ends without asking | E | J4 | Improvement | C-7 | Both ask, each naming its effect |

**The world corrected and re-captured** (builder, `8661fa51`; 24 Nov 14:36Z):
- **L-80:** one chapter given to two classes (`dunia.berikan`), with the per-class copies gone. **L-80 is withdrawn as a world artefact**; J5's home suggestion is re-captured on this world and re-judged.
- **J3 and J4 re-captured** (`87769a6b/j3/` `f308d1ad`; `f308d1ad/j4/` `7bc68907`). The earlier `6792ecb9/j3/` and `f606a740/j4/` are **superseded**; J2's captures aren't affected. On the corrected world, J4's teacher home reads «Tidak ada yang menunggu keputusan Anda hari ini.» (L-45's territory: Daisy checks it against a waiting request).
- **W12:** L = 306, so the remaining allowance is 12,585. Verified locally: the first request is admitted, and the identical second is refused AI_JATAH_HABIS.
- **J2's public check in EN** (`f370213f/j2/…/standar-en-1280/`): «STATUS Valid · RESULT Passed». The holder's name is not on the page in EN either.

**The C-4 waiting-state captures** (builder, `e0aa6294`; partial walks, `AUDIT_SAMPAI`):
- **L-45 is evidenced:** the teacher's /mengajar home reads «Tidak ada yang menunggu keputusan Anda hari ini.» WHILE Galih's request to continue waits (`f308d1ad/j4/sebagian-menunggu-…/02-guru-mengajar-menunggu.png`).
- **L-58 is evidenced:** /pimpinan shows «1 permintaan kesempatan tambahan menunggu persetujuan» directly above «BAGIAN A KEPUTUSAN · Tidak ada keputusan yang menunggu Anda.» (`87769a6b/j3/sebagian-menunggu-…/08-…png`).
- **L-69 is evidenced** while the correction waits (`63ff05e9/j7/sebagian-L2-…`): Studio's home, /pimpinan Bagian A and the queue's own empty line all say nothing waits.

**J7 captured** (`5e0d0392`, `audit/79/tangkapan/63ff05e9/j7/`): 7 walks, plus Daisy's «not walked» items.
- «Cabut» completed: the public check reads «Dicabut … tidak lagi berlaku · Seperti saat diterbitkan HASIL Lulus».
- The reissue completed: the old certificate reads «Digantikan», the new one «Berlaku».
- L-68 and L-70 hold.
- Ratih's own page opens the replaced certificate first after the reissue, with «Buka sertifikat yang baru»; Daisy judges.
- «Cabut» is reached by Shift+Tab, because focus opens on «Batal»; Daisy judges.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-105 | **A revoked or replaced certificate prints as a clean, valid-looking certificate through the browser's own print.** The page stops offering «Cetak» once revoked or replaced, but print media drops the «dicabut»/«digantikan» banner: Citra's revoked 7QD8E0DJ/00001 prints as hers, and Ratih's replaced one prints with her old name and number. Under review, the print doesn't mention the review either (deliberate per a code comment: the QR resolves to the live status) | C, D | J7 | **HIGH (Sharon, `AUDIT79-L105.md`)**: the integrity of a printed credential. The QR is mitigation, not a control, since most people receiving a paper never scan it. Not Critical: it needs the holder's deliberate print, and the public check tells the truth. **Fix before the first real certificate**, the same gate as L-67. Not a production blocker | C-3; **CI-1's principle covers it** (P7 named the card and its print; ruling 96's three facts apply to paper) | **CI-1b** (Bob, routine, under ruling 99): a small follow-up, app and print stylesheet only, after CI-1, which stays frozen. Not AR-79. DICABUT/DIGANTIKAN print no credential (a notice with the date, QR and link, or an unremovable full-page mark; the banner is never display:none in print). DITINJAU prints a fixed line (the school is reviewing it; check the QR; the print date). BERLAKU prints as today. Proofs are taken from the rendered PDF of each state, with a plant hiding the banner in print. Daisy writes the words. **Added (Daisy, J7-10):** every printed copy carries a way to check the paper alone, the check address and/or the QR; Sharon confirms what may be printed |

**J7 judged from the captures (Daisy, `0749d8ca`):** J3, J4 and J7 have no open builder lines. L-45 and L-58 are evidenced in the builder's own run. Focus opening on «Batal» is the right default, and the question names the effect: **not a finding.** On L-105, Daisy proposed Critical for revoked and Significant for replaced; **Sharon's HIGH stands** (her classification is binding on integrity). **Daisy adds that no printed copy, valid ones included, carries a check address:** the check opens by link token, so the paper alone can't be checked. **That is added to CI-1b's scope**, and Sharon confirms what the paper may carry.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-106 (J7-9) | After a reissue, the holder's «Lihat sertifikat» opens the replaced /00001, and «Buka sertifikat yang baru» goes to the public check page, not her own page | B, H | J7 | **Significant** | C-1 (the chain's current end isn't the authority) | Open the chain's current end |
| L-107 (J7-11) | The certificate table doesn't fit at 1280; «Keadaan» is cut | G | J7 | Improvement | — | — |
| L-108 (J7-12) | The panel heading reads «CABUT SERTIFIKAT» even when it holds the reissue | B | J7 | Improvement | — | — |
| L-109 (J7-13) | The confirmed line doesn't name whose certificate | A | J7 | Improvement | — | — |
| L-110 (J4-7) | The sidebar popover opens off-screen | G | J4 | Improvement | — | — |
| L-111 (J3-11) | Bagian C's headings run together; the footer is misaligned | G | J3 | Improvement | — | — |

**J10 captured** (builder, `6b248975`, `audit/79/tangkapan/d70f3222/j10/`): 8 walks, all reaching their last screen.
- The email path is real: the code goes to the mail sink, and an unknown address gets the identical screen. [S] holds.
- PIN recovery's expiry reads correctly. An unknown ID, a wrong PIN and a reset PIN all read the same line, so there's no oracle.
- The real-time session lock works: the warning at 243 s, the lock at 303 s, then the counted retries and the session ending PIN_GAGAL.
- Every weak-PIN rule gives its own reason.
- J10-1 and J10-3 are reproduced.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-112 | **An open welcome tour keeps a shared computer from locking.** On /belajar on a shared computer with the tour open, /api/sesi/detak fired at 242, 307 and 487 s with no input, and the session stayed BUKA for the 9 minutes sampled. With the tour skipped, it locks at 303 s. The tour reopens at each sign-in until dismissed, so a first-days learner who walks away stays signed in | [S], E | J10 | **HIGH (Sharon, `AUDIT79-L112.md`)**: the shared-computer lock is a confidentiality control, and with the tour open it never fires. Not a pilot blocker on personal devices; **must be fixed before any shared-computer use** | **C-11, traced by Sharon:** PenjagaSesi counts `scroll` (window, capture) as human activity, but browsers fire trusted scroll events for programmatic and layout scrolls. Tur.tsx borrows body padding, calls scrollBy and re-measures on scroll, so the 240 s warning's reflow fires a scroll, which clears the warning and sends a heartbeat | **AR-79, under Sharon's conditions:** count only keydown, pointerdown, touchstart, wheel and pointermove with real movement; drop scroll, or count it only within about 1 s of a wheel, touch or key; the warning or lock render never counts, only «Masih di sini»; red-first real-browser tests (tour open, no input, locks at about 300 s; programmatic scroll and focus count as nothing); sweep every component that scrolls, focuses or changes height on its own, plus looping media. Evidence: `d70f3222/j10/j10-cabang-tur-terbuka/` |
| L-113 | «Komputer siapa ini?» promises «Anda bisa mengubah pilihan ini nanti di Akun saya», but a learner's «Akun saya» has no «Komputer ini» section (staff only, `src/app/akun/page.tsx`) | A, D, [S] | J10 | **Significant (Daisy, J10-4)**: it's the setting that protects a learner on a lab computer, and «Komputer pribadi» stays signed in for 7 days with no promised way back | Principle 4 (an unsupported promise) | **AR-79:** the learner gets «Komputer ini». Move the existing block above the `if (!staf)` return in `src/app/akun/page.tsx`; no new words (the akun.perangkat.* lines already read right). Check the learner header reaches «Akun saya». Daisy's fallback promise text applies only if the builder shows the question returns per browser. The walk reached /perangkat only by typing its address |

**J10 judged (Daisy, `AUDIT-79-TEMUAN-J10.md`, `5d0096b7`):** all builder lines are closed.
- **Holds:** the email path; PIN recovery's expiry; the lock and its retries; the card and reset locks; the 61-minute end; the weak-PIN reasons.
- J10-1, J10-2 and J10-3 are reproduced. J10-3's bubble is the browser's English on an Indonesian page, so it joins C-10.
- **L-112's UX side** (the severity stays Sharon's HIGH), all into AR-79 with L-112, with no new words:
  - nothing on screen shows the protection is paused;
  - the lock warning must sit above the tour;
  - when the lock comes, the tour closes unmarked and returns at the next sign-in.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-114 (J10-5) | The tour's note and the lock warning ask for attention at the same moment | B, E | J10 | Improvement | C-11 | With L-112 in AR-79 |
| L-115 (J10-6) | Two sign-in layouts: /terkunci and /perangkat have no panel and cramped spacing; «Minta akun dibuka kembali» isn't an h1 | G, F | J10 | Improvement | — | The visual pass; the h1 is an accessibility fix in AR-79 |
| L-116 (J10-7) | /perangkat, opened from Akun saya, still says «ubah nanti di Akun saya» | A | J10 | Improvement | Principle 4 | With L-113 |
| L-117 (J10-8) | Three wrong PINs end with the same line as the 60-minute end | A | J10 | Improvement (optional, Daisy) | C-6 | AR-79 if within scope; Sharon confirms the distinct line reveals nothing to a stranger |

**J5's remaining parts walked (Daisy, `dde3c077`, with the builder's `j5.mjs` at `6b248975`, 1280):**
- L1 to L5 reached their end; L7 and L8 were judged from the screens they reached; L6 needs OFFICIAL evidence.
- **Holds:** «Siapkan» an Uji Cepat; the teacher's running view (a count, not a judgement); the emergency stop's learner side; the late joiner's window counted from when it was given; «Ubah jadwal»'s own date words.
- **Harness notes, sent to the builder:**
  - L2 must tab to the checked radio;
  - L6 needs OFFICIAL evidence;
  - L7 must fill «Alasan» and type the date independent of locale;
  - the result page needs `?penugasan=`.
- **World question for the builder:** can a real school show «Sudah mengumpulkan» beside «Belum ada Uji Penguasaan dari murid ini»? If yes, it becomes «…yang dapat dihitung…».

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-118 (J5-6) | **The learner isn't told how long an Uji Cepat stays open.** The start page shows «DITUTUP · Rabu, 25 Nov 2026», with no time, and the sitting's clock counts up. A late joiner has 28 minutes, which the teacher sees («Sisa waktu 28 menit») and he doesn't | F, B, C | J5 | **Significant** | C-3 | «Ditutup pukul {jam} WIB (sisa {n} menit)»; remaining time in the sitting for a windowed assessment; one quiet notice at 5 minutes |
| L-119 (J5-7) | «Tambah waktu» is offered on a sitting with no time limit, and drawn in the danger style | F, V | J5 | Improvement | C-7; widens L-47 | «Tanpa batas waktu · jadwal ditutup {tanggal}» with no «Tambah waktu»; a normal button where it's offered |
| L-120 (J5-8) | «Ubah jadwal»'s required «Alasan» is held only by the browser's bubble | G | J5 | Improvement | C-10 | With L-88 and L-77 |
| L-121 (J5-9) | One Uji Cepat shows two times in two formats (03:16 raw against 03.20 WIB) | H, B | J5 | Improvement | C-6; C-3 | One label from one timestamp |
| L-122 (J5-10) | A result link missing its parameter gets a permission refusal | H | J5 | Improvement | Next to C-9 (a refusal naming the wrong cause) | «Uji Cepat ini tidak ditemukan. Buka dari halaman Uji Cepat kelas.» + the link |
| L-123 (J5-11) | During an emergency stop, the teacher gets the learner's page («buka lagi asesmen tersebut») | H | J5 | Improvement | C-6 | Daisy's staff variant |

**J6's remaining parts walked (Daisy, `6a50d36f`, her own scripts at `6b248975`, 1280; there is no builder harness for J6):**
- **Holds:**
  - learner data is refused before anything is sent, and the text is kept;
  - the allowance is used up on the second request (W12, so Daisy's world question closes);
  - the provider ceiling's words are honest;
  - «Ajukan» says honestly that no notification is sent;
  - the reviewer's Studio home counts the package;
  - provenance survives to approval.
- J6-2 (L-84) is confirmed.
- **Left for the builder:** the stale form (`AI_TUJUAN_LAIN`), the «already passed» refusal, and the SR, throttled and reduced-motion passes.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-124 (J6-4) | **«Tandai lolos pemeriksaan» is offered, and accepted, before any content check has run.** The check, run after submission, found 4 findings, and the reviewer approves a package already marked «lolos». Lock-step re-checks at publication | E, B, [S] | J6 | **SIGNIFICANT (Sharon): it touches the integrity of the approval record**, since the record says «lolos» for content no check had passed and the reviewer relied on it. It stays Significant only while the publication re-check provably refuses publishing with an open mandatory finding, and that becomes a test. **If any path approves or publishes without that re-check, it's HIGH** | C-7 | **AR-79, under Sharon's conditions:** draw the button only after a check on the current content. (a) Bind the mark to the exact content it checked: store the check run id and the package revision or content hash with it. (b) The database refuses the mark when no completed check exists for the current revision or a mandatory finding is open, and refuses approval when the mark is stale. Red-first tests: a mark before any check is refused; a mark after a clean check is accepted; an edit after the mark leaves it stale and approval is refused; publishing with an open mandatory finding is refused |
| L-125 (J6-5) | After any refusal, the rights statement comes back unticked while the source is kept, so the resend is refused again | F | J6 | Improvement | — | Keep the tick, or say to tick it again |
| L-126 (J6-6) | Allowance and ceiling refusals leave `ai_permintaan.hasil` empty, while the learner-data refusal is recorded | [S] | J6 | **SIGNIFICANT (Sharon): an accountability gap in the AI request ledger.** Not urgent, since AI is active nowhere; **it must be done before C3w-2's activation** | — | **AR-79, under Sharon's conditions:** every refusal records a closed reason code in `ai_permintaan.hasil`, in the same transaction as the refusal (e.g. ALLOWANCE_EXHAUSTED, PLATFORM_CEILING, NOT_ENTITLED, REFUSED_PERSONAL_DATA), with no free text and no request content; a CHECK so a terminal row can't have an empty `hasil`; a test that each refusal path leaves exactly its code |

**L-124, Bob's code check against main `429b7dcc` (24 Nov 20:55Z): the observation is restated.**
- **The app path does run the check.** `advanceContentAction` (`src/app/studio/actions.ts` ~l.88): for `to = VALIDATED`, it calls `validate_course_content` and `run_mcq_quality` first, and refuses with `CONTENT_CHECK_ERRORS` while any unacknowledged ERROR is open (Daisy F8, UX-01).
- **So Daisy's press ran the check inside the button.** The 4 findings seen afterwards are `WEAK_MISCONCEPTION_LINKAGE`, which is a **WARNING** (`20261211100000`, l.173), not a mandatory finding. The «lolos» mark was true by the current rule.
- **What does hold:**
  - (1) **The database doesn't enforce it.** `langkah_konten` and `enforce_content_status` allow DRAFT→VALIDATED with no completed check and with ERRORs open. That's a one-check rule, breaking principle 3, so a direct RPC call marks «lolos» unchecked.
  - (2) **The mark isn't bound to the content it checked** (Sharon's (a)).
  - (3) **UX:** the step tells the author to run the check first, but the button runs it silently, and the warnings it found aren't surfaced at the moment of marking. Daisy re-words this.
- **Severity stays Sharon's.** Her conditions (a) and (b) and the red-first tests apply unchanged; they're exactly the database half. The HIGH test (any approve or publish path without the re-check) is still to be proven in AR-79's red-first tests.
- **Sharon (20:53Z): L-124 stays SIGNIFICANT on the restated facts.**
  - A direct `langkah_konten` call to VALIDATED sets the mark; it doesn't approve or publish, so it isn't the HIGH path. The HIGH test stays the approve and publish paths: each re-runs the check on the current content and refuses with an open ERROR, whatever the mark says.
  - **Addition:** the reviewer's approval screen and RPC must not treat VALIDATED as "checked". Approval runs, or reads, a check of the current revision itself, so an unchecked direct mark changes nothing downstream.
  - (a), (b) and the red-first tests stand as the database half.

**J6-4's UX half re-worded (Daisy, `ccbd7d70`):** the step's words now match the button. After marking: «✓ Diperiksa: tidak ada yang wajib diperbaiki · {n} saran.» + «Lihat temuan». When refused: «Belum lolos: {n} temuan wajib diperbaiki.» Her misreading is logged as ANTISIPASI DAISY-J6, for the closure report's lessons.

**J8's remaining parts walked (Daisy, `92eb2040`, her own scripts at `6b248975`, W15, 1280):**
- **Holds:**
  - intake is all-or-nothing, with an exact approval summary;
  - one-press class cards with a printable sheet;
  - a role ending today is accepted and flagged at once;
  - the last admin has no «Lepaskan» on their own row, and «Tutup akun saya» is refused with a way out;
  - 600 learners take about 120 actions.
- **Left for the builder** (not walkable on W15): pass marks, which need a lesson; a renamed rule, which needs a package; the passes.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-127 (J8-7) | **Two different children with the same name can't be entered.** «Siti Aminah; 2001» and «Siti Aminah; 2002» are both refused as «kembar»; NIS is read but can't be mapped, and «Perbaiki berkas» is impossible advice for two real children | F, C, [S] | J8 | **Significant** | C-7 (a rule assuming names are unique) | A warning, not a refusal, with «Dua orang berbeda» / remove one; or an identifying column. **Sharon** confirms the identity rule (no silent merge of two children; no wrong split of one) and whether NIS may be stored and shown |
| L-128 (J8-8) | The intake check's errors name row numbers (off by the header row), not people; no restart; the list isn't kept | C, F | J8 | Improvement | C-7 | Names and spreadsheet row numbers; «Mulai pendataan baru» with the list kept |
| L-129 (J8-9) | A learner is offered in «Berikan peran», and the refusal says «bukan wewenang Anda» to the only admin; the real cause is her class card | C, H | J8 | Improvement | Next to C-9 (a refusal naming the wrong cause) | Mark learners in the list; the refusal names the card and the way to convert it |
| L-130 (J8-10) | A role with no «Berlaku sampai» is held only by the browser's bubble | G | J8 | Improvement | C-10 | — |
| L-131 (J8-11) | After the cards are made, the counts still say learners are waiting, and each PIN is shown twice on the page | B, F, [S] | J8 | Improvement | C-3 | Counts update; PINs once, on the sheet. **Sharon** confirms the PIN display rule |
| L-132 (J8-12) | Aturan Asesmen shows its full form at a school with no package; the empty select is held by the browser's bubble | F, C | J8 | Improvement | C-7; C-10 | Say a package must exist first, with the link, and no form |
| L-133 (J8-13) | The last admin's refusal begins «Permintaan ini tidak diajukan» on an immediate close | H | J8 | Improvement (optional) | C-6 | «Akun Anda belum dapat ditutup: …» |

**Sharon on J8 (21:12Z):**
- **L-127, the identity rule.** A name is never identity, and name plus birth date isn't proof either.
  - (1) **With a school identifier (NIS) on both rows:** the same NIS in the same school is the same person, refused as a duplicate. A different NIS means different people, never «kembar».
  - (2) **With no NIS:** the same name and same birth date is a *possible* duplicate. Warn, require the admin's explicit «Dua orang berbeda», and audit that choice. Never auto-merge, never auto-split. The same name with a different birth date means different people.
  - **NIS may be stored** as a per-school attribute of the person:
    - unique within the institution;
    - shown only to that school's staff with intake or admin rights;
    - never on the certificate, the public check, other learners' views, or exports outside the school;
    - never a sign-in;
    - never matched across schools.
  - **Kept:** no merge without an admin's decision; the decision audited; no new cross-school identifier.
  - **L-127 stays Significant, in AR-79** under these rules.
- **L-131, the PIN rule.** A PIN is a secret shown **once**:
  - at creation, to the authorised staff member, for printing;
  - never in a URL, never stored in plaintext, never re-shown on reload. After leaving the page, the only route is a reset.
  - Once, on the sheet only, as Daisy proposes.
  - **The real check is whether a reload or Back re-shows PINs.** Assert `Cache-Control: no-store`, PINs kept out of history state, and that the server can't return them a second time. **If a reload does re-show them, that's a separate, higher finding.**
  - (PenjagaSesi's comment says every page is sent no-store; that is to be proven, not assumed.) **This is assigned to the builder's J8 capture:** make the cards, then Reload and Back, recording the response headers and the screen.

**J5 captured (builder, `9be73ecf`, `audit/79/tangkapan/d41ed05c/j5/`):** 7 walks reached their last screen, with Daisy's harness notes applied (L6 on OFFICIAL evidence, labelled).
- The stop, the late joiner (28:30 left), «Tambah waktu», «Minta membaca lagi» and «Ubah jadwal» all completed.
- «Belum ada nilai» on Cendekia is a world artefact (a synthetic school).
- Daisy judges the capture.

**The builder's two code answers:**
1. **«Komputer siapa ini?» is asked per browser and person,** not once per account. `device_contexts` is keyed by the hash of the httpOnly `pintar_perangkat` cookie plus `auth_user_id` (`20261117100000`, l.23–25 and l.165–178; `src/proxy.ts` l.260–266). A new browser or cleared cookies asks again; class cards are never asked.
   - **For L-113:** Daisy's recommendation stands (the learner gets «Komputer ini»), and her fallback wording is now known to be true if it's ever needed.
   - Code comments say «a staff person», but an email learner is asked too (`d70f3222/j10/…/08-perangkat-pertama.png`). The comment is corrected in AR-79.
2. **Yes, a real school can show «Sudah mengumpulkan» beside «Belum ada Uji Penguasaan dari murid ini», by one path:** an integrity reviewer's downward `evidence_class_overrides` (`enforce_evidence_override`; `official_sessions` keeps only OFFICIAL, `20260912194513`). The sitting still reads as submitted, but no longer counts. So Daisy's conditional wording becomes a finding:

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-134 (J5, conditional confirmed) | After an integrity reviewer downgrades a sitting's evidence, the teacher reads «Sudah mengumpulkan» beside «Belum ada Uji Penguasaan dari murid ini di kelas ini» | B | J5 | Improvement | C-3 | «Belum ada Uji Penguasaan yang dapat dihitung dari murid ini di kelas ini.» (Daisy). Whether the teacher may learn that a reclassification happened is **Sharon's**; the proposed words don't say it |
- **Sharon on L-134 (21:20Z): Daisy's neutral wording is the right boundary.** The teacher is **not** told that a sitting was set aside by an integrity review.
  - An integrity outcome implies possible misconduct by a named learner. The teacher's need is only operational: the sitting doesn't count, so what comes next.
  - **The teacher sees:** «…yang dapat dihitung…» plus the ordinary next step (e.g. a retake through the usual approval), with no reason.
  - **Who may know why:** the integrity reviewer and those the existing referral process names. The learner is told by that process.
  - **Test (AR-79):** the teacher's reads, screen and RPC, for an overridden sitting carry no reason, reviewer or override record; only the counts and the "not countable" state.
  - This is principle 5 (confidentiality throughout the system) applied to an integrity outcome.

**J9, J11 and J12's passes walked (Daisy, `73708759`, `b98f480f`, `b8b97097`, with the builder's harnesses at `6b248975`, 1280: EN, SR, throttled, reduced motion).** Every journey's local walk is now done.
- **J9:** every pass reached the end with the same outcome, and the SR tree is good. The [S] suspended-requester case is still the builder's.
- **J11:** every pass reached the end; EN and the print view are good; the SR tree exposes the chart as a list.
- **J12:** L1 to L4 hold in every pass, and the SR tree is good. L5 and L6 need Mailpit, so they stay with CI's run.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-135 (J9-4) | **In EN, /konfigurasi's transfers section stays wholly Indonesian** (title, status, Laksanakan/Tolak, the refusal, the request form). Its words are hard-coded in `konfigurasi/page.tsx` (around l.1899), although `pindah.*` EN keys exist | D, H | J9 | **Significant** | C-6 (words chosen per screen, bypassing the keys) | One page-wide fix with L-140: every string through `t()`; a sweep for hard-coded strings in `konfigurasi/page.tsx` and its siblings |
| L-136 (J9-5) | The promotion's h1 is untranslated | D | J9 | Improvement | C-6 | With L-135 |
| L-137 (J9-6) | EN grammar, and a duplicated «4 up to 8A» | H | J9 | Improvement | — | With L-95 |
| L-138 (J11-3) | The section letters differ between /pimpinan and the summary (E vs D for Kesiapan bukti) | B | J11 | Improvement | C-6 | One lettering |
| L-139 (J11-4) | An empty list, and inconsistent regions, in the accessibility tree | G | J11 | Improvement | — | — |
| L-140 (J12-5) | In EN, Konfigurasi's action results and the section heading stay Indonesian although the EN keys exist | D | J12 | Improvement | C-6, likely the same cause as L-135 | One page-wide fix with L-135 |

**J5's capture judged (Daisy, `8d3f5d67`):**
- **Every finding stands.** J5-6 and J5-7 are confirmed in the capture's own words («Tambah 10 menit … Batas baru 24 Mei 2027»).
- **Holds:** the stop's learner path completes; «Minta membaca lagi» on OFFICIAL evidence reads honestly and reaches Sinta; «Ubah jadwal» saves.
- **L-134 is widened:** the Uji Cepat result page reads «Belum ada nilai … setelah ada yang mengumpulkan» beside 3 submitted.
- **Harness notes, for the builder:**
  - (e) the EN walk is EN only at L1, because `pilihBahasa` runs once and every later sign-in returns ID. **The builder determines whether that's the harness or the product** (the language not being kept across sign-in would be a finding). EN is re-run.
  - (f) the tour covers Sinta's request card.

**J8-7's words fitted to Sharon's identity rule (Daisy, `951f2bc5`):**
- NIS and birth date become optional mappable columns, with the visibility line.
- The same NIS is refused, naming both rows.
- With no NIS but the same name and date, each pair gets a choice («Dua orang berbeda» / «Orang yang sama: hapus baris {b}»), which is recorded, and «Catat» is held until every pair is chosen.
- **For Sharon:** the same name with neither NIS nor birth date is treated as a possible duplicate (warn), since nothing separates them.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-141 (J5-12) | «Minta membaca lagi» pre-ticks the whole chapter, not the lessons of the unmet objective; «target 60%» floats | F, B | J5 | Improvement | C-5 (recommendations not from the result in force) | Pre-tick the unmet objective's lessons |
- **Sharon on L-127 (21:35Z): CONFIRMED.** The same name with neither NIS nor birth date is a possible duplicate, with a per-pair admin choice, recorded, and «Catat» held until every pair is chosen.
  - **Amendment:** «Orang yang sama: hapus baris {b}» removes only that import row. It never merges or deletes an existing person record, which stays a separate, audited admin act.
  - It becomes an AR-79 test.

**The PIN-reload probe (builder, `6de5b9f4`, `audit/79/tangkapan/9c3a67db/j8/pin-muat-ulang/`, with fixture w15-kartu and three invented learners per class):** measured against Sharon's PIN rule.
- **Shown once, at creation:** holds.
- **Never on Reload, leaving, Back, or Forward then Back:** holds. Every time there were 0 PINs visible, 0 in the DOM, 0 in history.state, 0 in the URL, and 0 in session or local storage. The bfcache didn't restore the page (`persisted=false`).
- **No plaintext storage:** holds. Only the derived password goes to Auth.
- **No second return:** holds. Each call draws a fresh card and PIN (`api/akun/aktivasi/route.ts` :97–103; `api/akun/kartu-kelas` :62); the sheet lives only in `useState` (`FormAktivasi.tsx`:117).
- **Documents** are sent `private, no-cache, no-store, max-age=0, must-revalidate`.
- **The one gap is L-142 below.** No higher finding: L-131 stays an Improvement.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-142 | **The six `POST /api/akun/aktivasi` responses that carry the PINs have no Cache-Control at all.** The route answers with plain `NextResponse.json` (`route.ts` l.50–122; the PIN at :106), against the BOB-26 contract «Every answer is JSON, no-store» (`aktivasi-kontrak.ts`:9). The single-card reissue route does set it, through `_jawab.ts`:5 | [S] | J8 | **SIGNIFICANT (Sharon, 21:50Z): a confidentiality gap on secret-bearing responses.** Proxies, service workers, a shared machine's disk cache and back-forward restoration are exactly the risks no-store exists for, and BOB-26 promises it. No exposure is observed, so it isn't HIGH | A sibling route missed by the contract's own helper (C-3's kind: a second path re-derives what a shared helper guarantees) | **AR-79:** answer through `_jawab`; a test that EVERY `/api` response carrying a PIN, code, token or secret has `Cache-Control: no-store`; a sweep of all such routes; **a static guard:** no `/api` route on the secret-bearing list may call `NextResponse.json` directly |

**J6 captured (builder, `11c269e2`, `audit/79/tangkapan/ddae57a9/j6/`):** 7 walks reached their last screen; EN is EN throughout, and W13 has no AI word.
- **The stale form:** with an objective replaced, the refusal is AI_TUJUAN_LAIN, «Tujuan pembelajaran pelajaran ini sudah berubah…». (Removing the only objective gives AI_TANPA_TUJUAN instead.)
- **«Already passed»:** from a second tab opened before the mark, the refusal is AI_PAKET_LOLOS_PERIKSA.
- **Confirmed in the capture:** J6-6 / L-126 (AI_PLAFON leaves `hasil` empty); J6-2 / L-84; J6-5 / L-125; the allowance (AI_JATAH_HABIS).
- **L-124 in the capture:** the mark is accepted without a separate check (the button runs it, per Bob's code reading). «Periksa isi sekarang» then finds «Tidak satu pun pengecoh tertaut ke miskonsepsi» (a WARNING), and the package is approved by the second person.
  - **This is not yet the HIGH case:** an approval over WARNINGs is the current rule.
  - **Still to be proven in AR-79's red-first tests:** that approval and publication refuse with an open ERROR, whatever the mark says.
- **New, for Daisy and Sharon:** «Tandai sudah tersusun» and «Tandai lolos pemeriksaan» go through while an AI draft still waits for its decision. Only «Ajukan» is held («1 soal masih draf dari AI…»).
  - So a package can carry «lolos» while a draft no one has accepted sits in it.
  - **Proposed L-143**, with severity pending: is a pending AI draft part of the content the mark vouches for?

**J5's harness notes (builder, `4b1de38a`):**
- **(e) was the harness, not the product.** The language cookie `pintar-lang` is kept a year (`locale-klien.ts`:22), and sign-out never clears it (`keluar/route.ts`:37–38, `masuk/actions.ts`:183). The harness's fallback cleared every cookie; it's fixed with `lupakanSesi`.
- **J10's EN walk had the same fault,** so both J5's and J10's EN walks are re-run.
- **(f)** The tour is dismissed on /belajar.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-143 | «Tandai sudah tersusun» and «Tandai lolos pemeriksaan» go through while an AI draft still awaits its accept-or-delete decision; only «Ajukan» is held. So a package can be «lolos» with an unaccepted draft in it (builder, J6 `11c269e2`) | E, B, [S] | J6 | **SIGNIFICANT (Sharon, 21:50Z)**: a pending draft is part of what the mark vouches for, and a draft nobody has accepted isn't checked content. Publication's re-check and the held «Ajukan» keep it from reaching learners. **HIGH if any publish or approve path ignores a pending draft** | C-7 | **AR-79, joining L-124's binding:** refuse BOTH marks while any draft awaits a decision, in the database (`langkah_konten`), not only the screen; the mark binds the revision and requires no pending draft; approval re-checks both. Red-first tests: the mark is refused with a pending draft; accepted after the decision; a draft added after the mark makes it stale. Daisy gives the words |

**J6's capture judged (Daisy, `1c4977e6`):** every finding stands, and J6's builder lines are closed.
- **Holds:** AI_TUJUAN_LAIN reads clearly; AI_PAKET_LOLOS_PERIKSA from a second tab is honest, and the button is gone on reload; the held «Ajukan» → accept → submit → the second person's count → approval; W13 shows nothing; EN is clean.
- **L-143's UX side**, fitted to Sharon's ruling that **both** marks are refused while a draft waits:
  - the cause is C-3: the «undecided drafts» fact is derived only at «Ajukan»;
  - both marks are held like «Ajukan»; under each: «**{n} soal masih draf dari AI.** Terima atau hapus setiap draf sebelum paket ditandai tersusun.» + «Lihat draf pertama» (EN: «**{n} questions are still AI drafts.** Accept or delete each draft before the package is marked as composed.»; the lolos variant follows the same pattern);
  - the SEKARANG block counts the waiting drafts.
  - Daisy's fallback (marking allowed) lapses under Sharon's ruling.
- EN judgement on J5 and J10 is held until the re-runs land.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-144 (J6-7) | The held «Ajukan» is a disabled button, with its reason in a separate paragraph, so a keyboard or SR user never reaches it | G | J6 | Improvement | — | `aria-disabled` plus `aria-describedby`; the press goes to the first draft. **The same pattern applies to every held button in AR-79** (L-143's two marks included) |

## W2 · Severities complete (Daisy, `AUDIT-79-KEPARAHAN.md` `e0958ce7`, 24 Nov 21:55Z; reconciled by Bob)

**Daisy's scale:**
- **Critical:** someone relies on something false with consequences outside PINTAR.
- **Significant:** misled about one's own state or task, blocked with no way round, or siblings contradicting each other on the main fact.
- **Improvement:** the rest. An accessibility failure on a core task with no alternative path counts as Significant.

**Her result:** 2 Critical proposed, 28 Significant, 76 Improvement (2 optional); not findings: J3-9 and J12-4.

**Reconciled against binding classifications** (Sharon's are binding on integrity, access, privacy and confidentiality):

| Item | Daisy | Binding | Ledger |
|---|---|---|---|
| J7-1 / L-67 | Critical (proposed) | Critical (ruling 96; Sharon's addendum) | **Critical** |
| J7-10 revoked / L-105 | Critical (proposed) | **HIGH** (Sharon: needs the holder's deliberate print, and the public check tells the truth) | **HIGH**. Daisy's proposal is noted, not adopted. It's fixed before the first real certificate (CI-1b) |
| L-112 | Significant (proposed) | **HIGH** (Sharon, 20:02Z) | **HIGH** (PR-23) |
| L-143 | Significant (proposed) | Significant (Sharon, 21:50Z) | Significant |
| J10-1 / L-75 | Significant | Significant; the disclosure is withdrawn by ruling 98, and the neutral line is kept (CI-2) | Significant, resolved by CI-2's general line |
| J6-4 / L-124, J6-6 / L-126 | as ruled | Significant (Sharon) | Significant |
| L-35 | Significant | Significant, **placed in 4.5** (Sharon) | Significant, 4.5 (named in the closure report) |

**Cause families ranked Significant as causes, with their rows staying Improvement:**
- C-10: browser-bubble validation on 5 screens (L-77, L-88, L-120, L-130, L-132).
- C-6-EN: Konfigurasi outside the word lookup (L-135, L-136, L-140). L-135 is Significant on its own.

**Two observations, adopted for W6's order:**
1. 18 of the 28 Significant findings come from C-3 and C-4, so they're fixed in the shared layer, not page by page.
2. Certificates hold both top-severity rows and four Significants, and the certificate is the one output that leaves PINTAR, so certificates go first (CI-1, then CI-1b, then the AR-79 certificate items).

**Lines not raised by Daisy** (L-1 to L-43 and the builder's and Sharon's own rows) keep the severities the ledger already gives them, set by their source and by Sharon where [S]. Daisy needn't re-rank them.
- **L-143's lolos-mark line (Daisy, `98657ab2`):**
  - ID: «**{n} soal masih draf dari AI.** Terima atau hapus setiap draf sebelum paket ditandai lolos pemeriksaan.»
  - EN: «**{n} questions are still AI drafts.** Accept or delete each draft before the package is marked as passing the check.»
  - Singular, ID: «**1 soal masih draf dari AI.** Terima atau hapus draf ini sebelum paket ditandai lolos pemeriksaan.»
  - Singular, EN: «**1 question is still an AI draft.** Accept or delete it before the package is marked as passing the check.»
  - Both marks use L-144's pattern: `aria-disabled` (focusable) plus `aria-describedby`; the press goes to the first waiting draft, with «Lihat draf pertama» / «See the first draft».
  - A database refusal (e.g. a draft made in another tab) uses the same sentence.
  - KEPARAHAN is updated to Sharon's ruling.

**The EN re-captures (builder):**
- **J5:** `7b3c7891`, `4b1de38a/j5/j5/standar-en-1280/`. It's EN throughout, and the tour is dismissed. It supersedes only `d41ed05c/…/standar-en-1280`.
- **J10:** `541bab59`, `73ead4a3/j10/j10/standar-en-1280/`. It's EN throughout. It supersedes only `d70f3222/…/standar-en-1280`.
  - It exposed a wrong EN label in the harness's own matcher (`lupa.nama_lain`), now fixed. That's harness, not product.
- Daisy judges both.
- **The builder's next step is J8,** with fixture w15-paket (one labelled draft package, so a pass mark can be set), then J9, J11 and J12.

**The J5 and J10 EN re-captures judged (Daisy, `37efc889`):** EN holds in both, and harness note (e) is closed. J5-6, J5-7 and J5-11 stand in EN, and J10-5 is confirmed in EN. **J5's and J10's builder lines are fully closed.**

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-145 (J5-13) | «handed in» and «submitted» on one EN page | H | J5 | Improvement | C-6 | One EN term |
| L-146 (J5-14) | «Ask for a direction to think in…» and «An Admin PINTAR…» read awkwardly in EN | H | J5 | Improvement (optional) | — | Daisy's EN wording |
| L-147 (J10-9) | The recovery email goes out in the default language (an ID subject) for an EN user, although `email.pulih.subjek` has EN | D | J10 | Improvement | C-6 | Send it in the request page's language. It reveals nothing about the account: the language comes from the requester's page, not from the account |

**J8 captured (builder, `9874ea1b`, `audit/79/tangkapan/434e2c7f/j8/`):** 7 walks reached their last screen, keyboard only, with labelled fixtures w15-paket and w15-staf.
- **Holds:**
  - the year and code refusals keep the value;
  - a pass mark with its reason;
  - the planted-error check names each row and records nothing until all are readable;
  - the clean list is recorded, «5 orang tercatat»;
  - a role ending today is flagged;
  - the printed cards (two across: name, number, card number, PIN, sign-in address);
  - the renamed rule («Cara hasil dibaca tidak berubah», still v1);
  - the last admin can't end their own role, and the account close is refused with the way out.
- Daisy judges the capture.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-148 (CORRECTED below, 23:50Z) | **Bulk intake records learners only** (`PERAN_PENDATAAN = ["STUDENT"]`, BOB-10 interim, `pendataan-kontrak.ts`:334–345), **but the list page says «Ini daftar guru atau staf: catat tanpa kelas»**; a staff list mapped that way is refused row by row («Murid hanya bisa ditempatkan di Kelas…») | A, F | J8 | Pending Daisy (proposed Significant: an unsupported promise on a set-up task) | Principle 4; C-3 | **Bob checked the code** (`pendataan-kontrak.ts`:322–346): BOB-10 (M5b, interim) **deliberately** refuses every staff role at intake «until the intake has a staff path», and the mapping offers only STUDENT. So the defect is the page's leftover promise («Ini daftar guru atau staf…»), plus the refusal shown: a staff list gets the learner-placement line, not the intake's own `pendataan.masalah.staf` («a staff row is not recorded by the bulk intake yet»), which is **C-12**. **AR-79:** the page stops promising staff intake, and staff rows get their own true line. **The staff path itself is M5b, a feature, so it's out of AR-79's scope and named in the closure report** |
| L-149 (WITHDRAWN below, 23:50Z) | **«Peran & akses» finds only people with an ACTIVE enrolment** (`school_people_page`): a search for the school's own admin finds no one, so **a new school can't reach any staff member to give a role** (the world needed fixture w15-staf) | F, E | J8 | Pending Daisy (proposed Significant: blocked from a task they must do, with no way round), and Sharon (who may be offered for a role) | C-7 (a read assuming a prerequisite the flow never creates) | **Bob's code read:** `school_people_page` (`20261230100000`) lists a school's ACTIVE *enrolments* (staff included, via `member_kind`), so a person reaches «Peran & akses» only once enrolled. With intake refusing staff rows (L-148, BOB-10), **a new school's staff have no in-product path to an enrolment, hence none to a role.** Whether a platform path exists (account requests, Admin PINTAR provisioning) is to be confirmed by the builder in J12's world. **If none exists, this is a set-up blocker for a real school's first day**, so it's escalated to the owner with the closure report, or sooner if Daisy rates it Significant and Sharon agrees. The fix is a feature (M5b's staff path), so its placement is the owner's |
| L-150 | A pass mark of 150 is held only by the browser («Value must be less than or equal to 100.») | G | J8 | Improvement | C-10 | With L-88 |
| L-151 | A name row «Citra 123 <b>» passes intake unflagged | C | J8 | **Improvement: data quality, not a security gap (Sharon, `J8-L151-L149-ACCESS.md` `cabe37ed`)**. Print is React plus `window.print`; email goes through `esc()` with a CR/LF subject guard; there is no CSV export | — | **AR-79, Sharon's rules:** (1) encode on output, never filter on input; (2) refuse control, bidi and zero-width characters at storage, with a `display_name` CHECK plus an intake row error, and a step 0 count first; (3) flag digits and markup at intake for the admin to confirm, without refusing them; (4) any future CSV export neutralises cells starting with `= + - @` TAB CR, and quotes per RFC 4180 |
- **Sharon on L-149's access boundary** (`cabe37ed`), binding on any widening of «Peran & akses»:
  - **Who searches:** INSTITUTION_ADMIN over that school, as today.
  - **Who is found:** only persons linked to that school, through an `institutional_identities` row there or any enrolment there. Never a global search, never someone known only to another school.
  - **Fields:** `person_id`, `display_name`, this school's institutional id, kind and status. No email, no auth id, nothing from another school, no suspension category.
  - **Search:** a substring of at least 2 characters, at most 50 rows.
  - **The role grant itself** re-checks the boundary, and refuses an outsider the same way as an unknown person.
  - The registry row is updated, and the tests are listed in her record.
  - Neither item blocks CI-2.

**J8's capture judged (Daisy, `dedd4e9e`). L-148 and L-149 are CORRECTED by her reproduction** (local `6b248975`; no `src` change up to `50ba47f7`):
- A staff list with Tempat and Peran left «Tidak dipakai» and «Ini daftar guru atau staf» ticked records them («✓ 2 orang tercatat», no class enrolment). Both are then offered in «Berikan peran», and Sari was **granted** Guru 1A (`role_assignments` EDUCATOR).
- **So the page's promise works as worded, and a new school's staff do reach «Peran & akses».**
- The builder's run had chosen Tempat and Program = «Guru dan Staf», and only that is refused.
- **Bob's 23:38Z code reading was wrong:** `PERAN_PENDATAAN` governs the role column, not staff without a class. That reading said intake records learners only, and that a new school had no staff path. Both were overstatements, now withdrawn. (A lesson for the closure report: a code reading is a hypothesis until the path is walked.)

**The restatements:**
- **L-148 (Significant, proposed by Daisy):** staff units are offered as Tempat or Program, then refused with the LEARNER line. **AR-79:** don't offer them; add a guidance line under Tempat (Daisy's ID and EN); and if one slips through, use the existing `pendataan.masalah.staf`. Cause: C-7 and C-12.
- **L-149: not a finding.** Staff recorded without a class are found. Only the seeded admin isn't, and a real school's first admin already holds the role. **Withdrawn**, and the builder's path check is answered by Daisy's reproduction. Sharon's access boundary (`cabe37ed`) stays on record for any future widening.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-152 (J8-14) | **The last admin releasing their own role is told «Peran Anda sendiri diubah atau diakhiri oleh admin lain.»** That's false, said to the only admin, and the staff page offers «Lepaskan» on it | A, E | J8 | **Significant** (Daisy) | C-12 (a refusal naming a false cause); C-7 (an action offered that can't succeed) | Show it disabled, with the close-refusal cause (Daisy's ID and EN). The school-level sibling of L-36 (the last Admin PINTAR), so both are fixed together |
| L-153 (J8-15) | The staff page's role card collapses and overlaps at 1280 | G | J8 | Improvement | — | Visual pass |

- **L-150 is confirmed** (C-10).
- **Holds:** a pass mark of 70 with its scope; the rule rename keeps its settings; the card PDF.
- **For the builder:** re-take capture 03 (caught mid-submit).

**J9 captured (builder, `1ed2d250`, `audit/79/tangkapan/25fe5ea9/j9/`):** 7 walks reached their last screen. These are the first committed J9 captures. J1, J11 and J12 have none yet; J11 is running, then J12, then J1.
- **EN:** the whole transfers section stays in ID, results and refusal included, although the EN keys exist. **This confirms L-135** in the builder's own run, after one more harness cause was fixed (the language cookie mirrored to localhost and 127.0.0.1). The J8 EN walk didn't show it.
- **The J9 [S] case** («ruling 73's own-authority rule, if W16 also holds a suspended requester») **is not walkable today, by design.**
  - Ruling 73 (C′) decided that a pending transfer from a since-suspended administrator completes only by **re-confirmation, placed at 4.5** (readiness register PR-3: GAP, needed before any real transfer, not for the one-school pilot).
  - The builder's code read (`transfer_execute` `20270123150000`; nothing reads the requester's authority at a later step) is exactly that recorded gap, not a new finding.
  - It's named in the closure report under PR-3 and 4.5.

**L-149: the builder's code reading disagrees with Daisy's reproduction.**
- **The builder says:** `issue_institutional_id` is service_role only, called by the import pipeline. The fourth source, «persons awaiting a first role», «can only be learners».
- **Daisy says:** a staff list with Peran and Tempat «Tidak dipakai» IS recorded, through that same import pipeline, as persons with no role and no class, who then appear in «Berikan peran» and were granted Guru.
- **Bob:** the two fit if a row with no role passes `import_row_problems` (it refuses STAFF roles, not role-less rows). A reproduction outranks a reading, so L-149 stays withdrawn **pending the builder's own walk of Daisy's exact steps** (requested at 23:52Z). If that walk fails, L-149 returns and goes to the owner as material.
- **L-152's access angle (Sharon asked whether a server-side last-admin guard exists).** Bob, from the code: **it does.**
  - `role_assignments_guard` (`20270113170000`, B0, reinforced in `20270123170000`) sits on the UPDATE that writes `revoked_at`, so **every revoking path passes it** (`revoke_role`, `akhiri_tugas_staf`, `ubah_peran`, `buka_kembali_akun`, and any later one).
  - It locks the school's `institutions` row FOR UPDATE before counting usable holders, so two admins revoking each other can't both pass.
  - It refuses **`ROLE_LAST_SCHOOL_ADMIN`** (true cause, naming no one) unless the actor is an active platform admin. The words exist (`peran.galat.role_last_school_admin`).
  - (Sharon's read of `revoke_role` in `20261111100000` is the function's last definition, but the guard is the trigger, not the function.)
  - **So L-152 is UX:** the database refuses correctly, but the screen shows «…diakhiri oleh admin lain» and offers «Lepaskan». **AR-79** traces why the staff-page path maps the refusal to the wrong line (C-12), and draws the button disabled with the true cause.

**J11 captured (builder, `eccb71ad`, `audit/79/tangkapan/1ed2d250/j11/`):** 7 walks reached their last screen, on W18 at the bootstrap (OFFICIAL evidence, labelled synthetic). The printed summary is kept as a PDF, and EN stayed EN. Daisy judges it.
- **Sharon on L-152 (23:59Z, corrected at `dbb12f12`): confirmed UX.** The B0 race exists (`b0.test.ts` ~568–631). Removing the lock is covered only statically (line 192 checks for `for update`), so **AR-79 adds a dynamic plant:** drop the FOR UPDATE, run the same race, and it must go red. Non-blocking.

**J9 and J11 captures judged (Daisy, `fe44851d`): both match her local passes, with no new findings, and both are CLOSED.**
- **J9:** the outcome is the same in every walk, and EN confirms L-135. At 390 and 320 the refusal wraps in full and the actions stay side by side. The [S] line is ruling 73 / 4.5.
- **J11:** J11-1 to J11-4 stand; 390 and 320 stack without sideways scroll; the print view keeps every withheld reason.
- **Remaining:** the J12 capture (running), then J1.

**L-149 CONFIRMED WITHDRAWN by the builder's own walk** (`0a424d0b`, `audit/79/tangkapan/96e42ac5/j8/standar-id-1280/` screens 20–27, on W15 **without** the w15-staf fixture, which J8 no longer uses):
- The «Guru dan Staf» mapping is still refused (L-148, screens 17–19).
- With Tempat and Peran «Tidak dipakai» and staff ticked: «✓ 2 orang tercatat di sekolah ini». Both are offered in «Berikan peran», and Siti Rahma was granted Guru 1A.
- DB: Dodi has institutional id AGR0000079D, no roles, 0 enrolments. Siti has AGR000006G9 and EDUCATOR@1A, with 0 enrolments.
- **The disagreement is settled by the walk.** Daisy's reproduction was right; the builder's code reading and Bob's both missed the role-less row path. J8's capture 03 was re-taken.

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-154 | **With «Ini daftar guru atau staf» ticked, the approval screen still says «Peran: Murid 2» and labels each name «Murid»**, so the admin approves «learners» while recording staff (screen 22) | B, A | J8 | **Significant (Daisy, `629ea2ac`)** | C-3 (the summary derives the kind from the role column, not from the staff choice) | The approval summary reads the staff choice: «Staf tanpa kelas: 2», with no «Murid» label |
- **L-154's words (Daisy, `629ea2ac`, ID and EN in TEMUAN-J8):** when the tick is set:
  - the summary reads «Guru atau staf (tanpa kelas) · {n}», and each name's label reads «Guru atau staf»;
  - above the button: «Orang-orang ini dicatat tanpa kelas dan tanpa peran. Perannya Anda berikan sesudahnya di Peran & akses; akunnya diaktifkan dengan email.»;
  - done: «✓ {n} guru atau staf tercatat di sekolah ini. Langkah berikutnya: berikan perannya di Peran & akses.»
  - **For the builder:** check whether Aktivasi offers «Buat kartu kelas» (a learner card) to staff recorded this way. If it does, they should get email activation only (L-129's family).

**J12 captured (builder, `a47f76a0`, `audit/79/tangkapan/0a424d0b/j12/`):** 7 walks reached their last screen, with the observer tour fix in. The slow-network walk was cut by a container restart at L4 and re-walked on its own.
- L6: the last Admin PINTAR's row offers no «Lepaskan», but doesn't say why (L-36).
- L5: the cross-origin refusal at 127.0.0.1 is a harness-address artefact, and it went through from localhost.
- Daisy judges the capture. **J1's capture is running; it's the last one.**

| L-id | Observation | Dimension | Journey | Severity | Cause | Notes |
|---|---|---|---|---|---|---|
| L-155 | **Staff recorded through «Ini daftar guru atau staf» are offered «Buat kartu kelas» (a LEARNER card) until they hold a staff role, and the database would accept it.** They are also counted in Konfigurasi's «murid tanpa kelas» and its placement list. **A staff member whose role lapses becomes «a learner» again** (Siti Rahma's Guru role ends today) | E, B, [S] | J8 | **Pending Sharon and Daisy** (proposed Significant; Sharon judges the credential side: a low-entropy PIN card for a staff member) | **C-1: no authoritative record of what a person is.** «Ini daftar guru atau staf» is browser state only (`BacaDanPetakan.tsx`:55, :85) and records nothing. `boleh_kartu = not memegang_peran_staf(p)` (`20261224100000`:43); `memegang_peran_staf` means only a live staff role (`20261212100000`:32); `authorize_account_activation` refuses a card only on that test; `murid_tanpa_kelas` (`20270112170000`:257) uses the same test | **The same root as L-154.** AR-79: record at intake that the person was entered as staff (a person attribute, or an `institutional_identities` kind), and have the card offer, the database's card refusal, the «murid tanpa kelas» count and the approval summary all read it. Sharon sets the rule for a lapsed staff role |
