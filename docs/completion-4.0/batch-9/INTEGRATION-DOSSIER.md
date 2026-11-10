# Integration dossier · Batch 9 · the reports (D-195, KESETIAAN, X5 / D-196), in the form of H §2

**Status:** drafted 7 Nov against candidate `d18e24e4` (tree `b9b71877…`), promoted as `main` `c4944fab` (P-7, SAME); committed 8 Nov with check 5's platform-administrator gap closed. Every claim names its evidence; a check with gaps says so.

## 1. Dependencies

| Surface (page) | Reads (database) | Composition |
|---|---|---|
| `/edukator/ringkasan` (class), learners | `generate_report` → `metric_evaluate` per metric; `targetKelas`; `murid_perlu_penguatan`, `sebaran_murid_kelas` (teacher and class of learners only); `kenaikan_awal_akhir` | `KomposisiKelas` |
| `/edukator/ringkasan` (class), participants (D-196) | `professional_learning_record` only | `KomposisiPengembangan` |
| `/dekan/ringkasan` (school) | `generate_report`; `kesiapan_kelas_per_mapel` | `KomposisiSekolah`, `KesiapanMapel` |
| `/pimpinan` | each class's own envelope and sealed target | `KisiTopik`, `RingkasKesiapan` |
| `/belajar/hasil` | the learner's own engine reads | `KomposisiMurid` |
| `/belajar/[tugas]/hasil` | `jenis_belajar_saya` (via `isProfessionalLearning`) | the who-may-see sentence |
| `/pengembangan/[simpul]` | `professional_learning_record` | `KomposisiPengembangan` (shared with D-196) |
| `/konfigurasi` «Yang menunggu», «Laporan» | `persons_awaiting_account`; the structure | the links and reasons |
| `/aktivasi` | `kelas_dikecualikan_kartu` | «Tidak termasuk: …» |
| Print (A4) | the same pages | `KepalaCetak`; `@page laporan` and `laporan-lebar` |

## 2. Data contracts and consumers: one fact, one value

- **Kenaikan:** the class card, the department grid's Kenaikan row and the before/after pair use one pairing.
  - `kenaikan_awal_akhir`'s akhir − awal equals `calc_class_net_gain` over the same pairs and people: **F33-K01**.
  - The school figure equals an independent pairing: **F31-K01**.
- **The bands:** the named list, the dots and the distribution use one rule, `calc_class_readiness_distribution`'s.
  - **F32-E01:** the lowest-band count agrees.
  - **F33-S01:** the per-band counts are equal.
- **The template's entries:** the class summary shows every entry of the template in force, the participants figure included (as B's population line, labelled). Journey **S23t** (6 standard, then the school's 2); **LAPORAN-KELAS-01**.
- **Who sees a PD result:** the participant's sentence equals `professional_learning_record`'s audiences and the administrator's own page: **LAPORAN-PESERTA-01**.
- **Readiness per subject:** each (subject, class) row equals an independent count; the denominator is the active academic assignments: **F33-R01**.
- **Card exclusions:** each person once, by one reason; the reasons add up to the count: **F33-A01**, journey **B4-W8**.
- **Copy keys:** every key is in `src/lib/hle.ts`, in both languages (the copy table tests).

## 3. Authorisation and visibility, at the database

| Read | Given to | Refused (tested) | Evidence |
|---|---|---|---|
| `murid_perlu_penguatan` | the class's teacher, a class of learners | another class's teacher, the school admin, the learner, a teacher asking under another class, anonymous; a PD class's facilitator | F32-E01/E02, F33-P01 |
| `sebaran_murid_kelas` | the class's teacher, a class of learners | the Kepala departemen, the Dekan, another class's teacher, anonymous; a PD class's facilitator | F33-S01, F33-P01 |
| `kenaikan_awal_akhir` | whoever `metric_evaluate('class.net_gain')` admits | another class's teacher; a class under the minimum | F33-K01 |
| `kesiapan_kelas_per_mapel` | the Kadep, the Dekan and the admin over the node | the class's teacher; another school's Dekan | F33-R01 |
| `kelas_dikecualikan_kartu` | CAN_PROVISION_PEOPLE | a teacher | F33-A01 |
| `professional_learning_record` | facilitator, Kadep, Dekan (full); Admin sekolah (completion) | another Guru, another Kadep, a student | journey C12f (record), C12f2 (Ringkasan Kelas) |
| `jenis_belajar_saya` | the caller's own assignment | anyone else's | F32-J01 |

Every new function is SECURITY DEFINER with a pinned search_path, `execute` revoked from public and anon, and registered with its authorisation shape (the migrations' own final checks; the CI registry guard).

## 4. Design and terminology across connected surfaces

- **One grammar:**
  - Section letters with the letter read aloud (`JudulBagian`);
  - spoken lists (`daftarKata`);
  - the A4 header and footer (`KepalaCetak`);
  - tokens only (UX1-S0-TOKEN-01).
  - Daisy's fidelity reviews are reconciled: #1–#28 and X5-1–X5-9, her patch `d86f61b3` integrated (`batch-9/kesetiaan-implementasi.md`).
- **No academic word or figure on a PD surface:**
  - The PD class's summary reads no academic figure; LAPORAN-KELAS-PD-01 asserts no academic read precedes the branch.
  - Journey C12f2 finds no academic mark, band or promise.
- **Navigation is the reader's real places:**
  - The admin reaches the PD class's summary from Konfigurasi «Laporan» (C12f2).
  - The class reports are linked from Pimpinan exactly when their figures are the reader's (DAISY-07-LAPORAN-02).

## 5. Exceptional conditions and multi-context journeys

- **Not enough evidence (2b):** one lead says how far and what makes figures appear: LAPORAN-KELAS-01, DAISY-07-LAPORAN-02.
- **The pair is not comparable:** «Belum dapat dibandingkan» (LAPORAN-KELAS-03, F33-K01).
- **A refused reader:** one line in words, no names (LAPORAN-KELAS-PD-01, C12f2).
- **An empty PD class:** «Belum ada peserta di tempat ini.»
- **A staff member who is also learning:** the Guru enrolled as a participant holds Mengajar and Belajar, and their own result page says who sees it (C12d, LAPORAN-PESERTA-01).
- **A platform administrator** (8 Nov; D-132(g), D-195(5), D-069(b)):
  - **At the database (F33-PA01):** with no role at the school, they are given Kenaikan's aggregate pair (metric_evaluate admits the platform) and nothing personal: no name, no dot, no readiness per subject. professional_learning_record refuses them. Shown red: given the class's teacher role as well, the same reader gets 2 names and 6 dots.
  - **On staging (`golden-school-pd.mjs` D8):** in «Seluruh platform» a school's class report is not shown; the app sends the reader to the chooser to choose that school (L3). In the school's own context there is no learner by name, no dot, and no PD participant.

## 6. Regression

- **The academic class report:** LAPORAN-KELAS-01/-02/-03 and journey S23t.
- **The school and department reports:** LAPORAN-SEKOLAH-01/-02, LAPORAN-KISI-01; B5A-PIMPINAN-K01, D168-C1-2 and W9-K02 restated to the compositions with the same assertions.
- **The record page shared with D-196:** LAPORAN-FASILITATOR-01, C12f.
- **Migrations:** the baselines are 200; the upgrade path previous → HEAD and the clean install are both in CI.

## 7. End-to-end journeys

- **Job A:** every role's screens in the seeded school, including S23 (Pimpinan → the class summary), S23t (the school's template), the reports A4 walk and B4-W8.
- **Job B:** Gladys's path from an empty database, including C-12's PD world: C12f (the record by each audience and the refused), C12f2 (the PD class's Ringkasan Kelas by each audience, the refused, and 390 px).
- **Run of record:** journeys 42409388669 on `d18e24e4`, A and B green (B 79/79, C12f and C12f2 PASS).

## 8. Evidence

- CI on the candidate: 42409386105, every job green.
- Journeys on the candidate: 42409388669, A and B green.
- Local: the F32/F33 database suites 8/8; the report suite 11/11; renders at 1280, 390 and A4 (12 and 30 participants, the header repeated).

## 9. Cross-feature UX consistency (D-172)

- **Report actions:** «Kembali» and «Cetak laporan» use one component (`AksiLaporan`) on every report, with one gap before the first section (`.pin-actions + .pin-lk`, Daisy's patch).
- **Empty and refused states:** one component (`Kosong`).
- **Sideways-scrolling tables:** a focusable, named region on the department grid and the record (RB1-C1).
- **Gaps:**
  - no side-by-side comparison of the reports' filters or paging, because the reports have none;
  - no screen-reader pass by a person (W6.12).

## Verdict

- **Integration for Batch 9: evidence complete for checks 1–8** (check 5's platform-administrator gap closed 8 Nov: F33-PA01, staging D8).
- **Check 9 has one gap:** a person's screen-reader pass (W6.12; the script is `acceptance/SCREEN-READER-SCRIPT.md`).
- Per H §1 the gate is **partial** until that is closed. On staging since P-7: GS-17–21 18/18, Studio 19/19, Batch 5 6/6, X5 9/9 (`evidence/staging-p7.md`).
