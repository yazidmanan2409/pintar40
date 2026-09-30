# PINTAR Terminology v1: change-impact list (draft, no implementation)

**Status: draft for Yazid's review. Nothing is implemented.** No string, key, copy-table row (`src/lib/hle.ts`), template, seed or code was changed. This list maps the proposal onto the real strings, as step 1 of the proposal's process asks.

- **Evidence base:** Daisy's inventory `ux/PINTAR-4.0-TERMINOLOGY-INVENTORY.md`, taken at `main` `4df914a` (29 Sep). Exact texts were checked against `src/lib/hle.ts` where a line is cited.
- **Rules applied:** only those in `ux/TERMINOLOGY-V1-PROPOSAL.md` (§2 dictionary, §3 distinctions and content boundary, §4 priorities, §5 navigation grammar). **The proposal is not canonical.** D-006, D-007, D-008, D-010, D-014 and D-015 stay in force until Yazid freezes v1.
- **Not applied:** anything the proposal does not decide. Those rows say "Check (Yazid)", and section I lists them as questions.

## Reviewing it quickly (coordinator's note)

- **102 rows are mechanical («No»):** the same rule applied to many strings, such as «siswa» → «murid», «pengajar» → «guru», «surel» → «email», or «Penilaian awal» → «Pemetaan Awal». They can be accepted or rejected **per rule, by section**, without reading each row.
- **1 row corrects a false sentence** (B1: /konfigurasi also admits Admin sekolah).
- **64 rows are «Check (Yazid)»,** and they collapse into the **24 questions in section I**. Answering those settles them.
- **One thing to weigh (question I-2):** rows D1–D37 swap a short «kursus» / «paket» for «Paket Pembelajaran» mid-sentence (e.g. «Penyusun Paket Pembelajaran tidak dapat diganti»). This follows §3, but it can read heavy. The proposal's own wish for plain Bahasa argues for allowing «paket» once the context is set.
- **Checked by the coordinator:** all 130 cited `hle.ts` lines carry the key and text the rows quote (the six that did not match on one line continue on the next and do match). The decision numbers cited were checked against `DECISIONS.md`.

## Counts

| Section | Rows | No | Yes | Check (Yazid) | — (no change) |
|---|---|---|---|---|---|
| A. Assessment vocabulary | 23 | 15 | 0 | 8 | 0 |
| B. Role names | 17 | 8 | 1 | 8 | 0 |
| C. People and school | 33 | 27 | 0 | 6 | 0 |
| D. Content vocabulary | 55 | 35 | 0 | 12 | 8 |
| E. Other dictionary items | 30 | 15 | 0 | 14 | 1 |
| F. Navigation | 29 | 2 | 0 | 16 | 11 |
| **Total (A–F)** | **187** | **102** | **1** | **64** | **20** |
| G. Kept on purpose · H. Not wording · I. Open questions | lists, not rows | | | | |

Canonical decisions the rows touch (rows citing each): D-006 (12), D-007 (11), D-008 (12), D-010 (13), D-014 (9), D-015 (2), D-016 (1), D-019 (6), D-021 (1), D-029 (3), D-037 (2), D-040 (2).

Checked and not touched by any row: D-009 (the rows on «Keluar» change nothing), D-018, D-020 (first-name greeting: no greeting string holds a dictionary term), D-022, D-054 and D-055 (their quoted phrases are not in any row).

## How to read the tables

- **Current (id):** the exact Bahasa text, from Table 1 of the inventory or its §1.2. Long strings are trimmed with «…» to the phrase that matters.
- **Proposed (id):** the minimal edit. Only the term in question changes, and the rest stays verbatim. "no change" means the row was considered and kept. "—" means the proposal names no replacement.
- **Key / source:** "T1 #n" is the Table 1 row number, then `hle.ts:line` and the key. "§1.2.x" rows are text outside the copy table, cited by `file:line`.
- **Semantic change?**
  - **No:** same meaning, only the word changes.
  - **Yes:** the concept boundary or the sentence's claim changes.
  - **Check (Yazid):** it is unclear whether the word means the concept, or the proposal does not decide.
  - **— (no change):** kept on purpose.
- **Canonical decision affected:**
  - Lists the D-numbers whose ruled wording the change would alter or rely on.
  - **D-008** on a row means the current text uses D-008's workbook-mark spelling («Pemetaan awal», «Cek penguasaan»).
  - **D-014** on a §1.2 row means the text lives outside `hle.ts` (a migration, a seed or `unggah-kontrak.ts`). A change there touches that file, not the copy table.
- **One term per row.** A string with two terms has one row in each section, cross-referenced. For example, T1 #378 has «Kepala Departemen» (B6) and «pengajar» (C17).
- **Capitalisation:**
  - Role names are written as the proposal writes them (Admin sekolah, Admin platform, Kepala departemen, Dekan), mid-sentence too. `hle.ts` already does this in «Hanya Admin platform yang…» (T1 #58).
  - «guru» and «murid» stay lowercase in running prose, as `hle.ts` writes them («Tanyakan kepada guru.»).
- **Keys never change** (D-014: key names are the contract). For example, `aktivasi.dengan_surel` keeps its name even when its text says «email».

---

## A. Assessment vocabulary (proposal §4.1)

Mapping applied: PRE_TEST → Pemetaan Awal · POST_TEST → Uji Penguasaan · QUICK → Uji Cepat · STANDALONE → Asesmen Mandiri · PAPER → Tes di Kertas.

| # | Current (id) | Proposed (id) | Key / source | Screen(s) | Reason (proposal rule) | Semantic change? | Canonical decision affected |
|---|---|---|---|---|---|---|---|
| A1 | «Penilaian awal» | «Pemetaan Awal» | T1 #995 · hle.ts:1407 · `jenis.mode.PRE_TEST` | /studio/definisi; /pimpinan/[simpul]/murid/[orang] | §4.1 PRE_TEST (inventory §2.2) | No | — |
| A2 | «Penilaian akhir» | «Uji Penguasaan» | T1 #993 · hle.ts:1408 · `jenis.mode.POST_TEST` | same | §4.1 POST_TEST | No | — |
| A3 | «Penilaian cepat» | «Uji Cepat» | T1 #997 · hle.ts:1409 · `jenis.mode.QUICK` | same | §4.1 QUICK; D-015 says "Uji Cepat everywhere" | No | D-015 (row currently departs from it) |
| A4 | «Penilaian mandiri» | «Asesmen Mandiri» | T1 #998 · hle.ts:1410 · `jenis.mode.STANDALONE` | /studio/definisi | §4.1 STANDALONE ("prefer over Penilaian mandiri") | No | — |
| A5 | «Lembar kertas» | «Tes di Kertas» | T1 #992 · hle.ts:1415 · `jenis.mode.PAPER` | /studio/definisi | §4.1 PAPER ("prefer over Lembar kertas") | No | — |
| A6 | «Asesmen mandiri» | «Asesmen Mandiri» | T1 #441 · hle.ts:3110 · `mengajar.instrumen.STANDALONE` | /mengajar/[kelas]/siapkan | §4.1; capitalisation only | No | — |
| A7 | «Tes di kertas» | «Tes di Kertas» | T1 #433 · hle.ts:3121 · `mengajar.instrumen.PAPER` | /mengajar/[kelas]/siapkan | §4.1; capitalisation only | No | — |
| A8 | «Belum mengerjakan penilaian akhir» | «Belum mengerjakan Uji Penguasaan» | T1 #528 · hle.ts:1463 · `kesiapan.belum_post_test` | /mengajar/[kelas]/bukti | §4.1 POST_TEST (key and en name the post-test) | No | — |
| A9 | «Rata-rata penguasaan kelas pada penilaian akhir.» | «Rata-rata penguasaan kelas pada Uji Penguasaan.» | T1 #654 · hle.ts:1429 · `metrik.pemahaman.arti` | reports (18 routes) | §4.1 POST_TEST (en already «Mastery Check») | No | — |
| A10 | «Pemetaan awal untuk pelajaran ini belum disiapkan. …» | «Pemetaan Awal untuk pelajaran ini belum disiapkan. …» | T1 #182 · hle.ts:3039 · `cycle.pemetaan.belum_ada` | learner refusal h1, /belajar/[tugas]/pemetaan | §4.1; capitalisation; names the learner's assessment, not the mark | No | D-008 |
| A11 | «Cek penguasaan untuk pelajaran ini belum disiapkan. …» | «Uji Penguasaan untuk pelajaran ini belum disiapkan. …» | T1 #183 · hle.ts:3040 · `cycle.penguasaan.belum_ada` | learner refusal h1, /belajar/[tugas]/penguasaan | §4.1 POST_TEST; names the learner's assessment | No | D-008 |
| A12 | «…cukup murid menyelesaikan Cek penguasaan.» | «…cukup murid menyelesaikan Uji Penguasaan.» | T1 #619 · hle.ts:2166 · `laporan.muncul.akhir` | reports (18 routes) | §4.1 POST_TEST | No | D-008 |
| A13 | «…menyelesaikan Pemetaan awal dan Cek penguasaan. …» | «…menyelesaikan Pemetaan Awal dan Uji Penguasaan. …» | T1 #620 · hle.ts:2167 · `laporan.muncul.awal_akhir` | reports (18 routes) | §4.1 PRE_TEST, POST_TEST | No | D-008 |
| A14 | «Materi ini belum punya Pemetaan awal. Tandai soal Pemetaan awal lalu terbitkan ulang.» | «Materi ini belum punya Pemetaan Awal. Tandai soal Pemetaan awal lalu terbitkan ulang.» (2nd use kept: it is the workbook mark) | T1 #486 · hle.ts:3032 · `mengajar.sedia.kode.assign_pre_test_missing` | /mengajar/[kelas]/siapkan, …/uji-cepat | §4.1; the 1st use names the assessment, the 2nd tells the teacher which mark to set | Check (Yazid) | D-008 |
| A15 | «Materi ini belum punya Cek penguasaan. Tandai soal Cek penguasaan lalu terbitkan ulang.» | «Materi ini belum punya Uji Penguasaan. Tandai soal Cek penguasaan lalu terbitkan ulang.» (2nd use kept) | T1 #484 · hle.ts:3033 · `mengajar.sedia.kode.assign_post_test_missing` | same | as A14 | Check (Yazid) | D-008 |
| A16 | «Soal Pemetaan awal di materi ini kurang dari yang diminta.» | «Soal Pemetaan Awal di materi ini…» only if the workbook mark is renamed; else no change | T1 #487 · hle.ts:3034 · `…assign_pre_test_too_short` | same | "soal Pemetaan awal" = questions carrying the mark | Check (Yazid) | D-008 |
| A17 | «Soal Cek penguasaan di materi ini kurang dari yang diminta.» | «Soal Uji Penguasaan di materi ini…» only if the mark is renamed | T1 #485 · hle.ts:3035 · `…assign_post_test_too_short` | same | as A16 | Check (Yazid) | D-008 |
| A18 | «Soal Cek penguasaan berada di kelompok paralel yang sama dengan soal Pemetaan awal, …» | «Soal Uji Penguasaan … dengan soal Pemetaan Awal, …» only if the marks are renamed | T1 #479 · hle.ts:3036 · `…assign_cycle_overlap` | same | refers to marked questions in a parallel group | Check (Yazid) | D-008, D-040 |
| A19 | «Satu kelompok paralel berisi soal Pemetaan awal sekaligus soal Cek penguasaan. …» | «…soal Pemetaan Awal sekaligus soal Uji Penguasaan. …» only if the marks are renamed | T1 #1143 · hle.ts:2130 · `studio.paket.masalah.item_parallel_cycle_mixed` | Studio upload problems | workbook rows; D-040 quotes both marks | Check (Yazid) | D-008, D-040 |
| A20 | Workbook dropdown Soal · Kegunaan: `Latihan`, `Pemetaan awal`, `Cek penguasaan` | `Pemetaan Awal`, `Uji Penguasaan` (only with a new D- entry) | §1.2.4a · unggah-kontrak.ts:43 (`KEGUNAAN`, maps label → PRE_TEST/POST_TEST) | workbook template from /studio/unggah | §4.1 "everywhere"; but these are D-008's marks and the parser's accepted values (import contract) | Check (Yazid) | D-008, D-007, D-014 |
| A21 | Guidance row 34: `Pemetaan awal atau Cek penguasaan (D-008); kosongkan untuk Latihan.` | follows A20 | §1.2.4a · unggah-kontrak.ts:87 | workbook sheet «Cara mengisi» | follows A20; also prints the decision id «D-008» (see H) | Check (Yazid) | D-008, D-014 |
| A22 | «Pemetaan selesai. Peta bacaan Anda sudah siap.» | «Pemetaan Awal selesai. Peta bacaan Anda sudah siap.» | T1 #240 · hle.ts:2300 · `pretest.done` | /belajar/[tugas]/peta | §4.1 "everywhere for PRE_TEST"; short form (see I-2) | No | — |
| A23 | «Selesaikan pemetaan» | «Selesaikan Pemetaan Awal» | T1 #241 · hle.ts:2299 · `pretest.finish` | assessment player (id-only) | as A22 | No | — |

**Considered, not in this section:**
- **«Mastery Check» in an Indonesian string:** none found.
- **«Kuis» as a word:** none; it appears only in the route `/studio/kuis`.
- **«Penguasaan»** alone (T1 #198, #598) and in «Penguasaan per topik» (#667) is the mastery figure, not POST_TEST. Kept.
- **Modes outside the §4.1 mapping** (TEST, EXAM, PRACTICE, PUBLIC_DEMO): open question I-3.
- **Generic «penilaian»** (e.g. «Aturan Penilaian», «penilaian resmi», «penilaian pertamanya» T1 #622): open question I-4.

---

## B. Role names (proposal §4.2)

The role labels themselves are already the dictionary's words, so they are kept: T1 #165 «Dekan», #166 «Guru», #167 «Kepala departemen», #168 «Admin sekolah», #169 «Murid», #170 «Admin platform» (hle.ts:2254-2259).

| # | Current (id) | Proposed (id) | Key / source | Screen(s) | Reason (proposal rule) | Semantic change? | Canonical decision affected |
|---|---|---|---|---|---|---|---|
| B1 | «Halaman ini hanya untuk pengelola sistem.» | «Halaman ini hanya untuk Admin sekolah dan Admin platform.» | T1 #918 · hle.ts:1985 · `config.refused` | /konfigurasi refusal | §4.2. The sentence is inaccurate today: the gate also admits Admin sekolah (konfigurasi/page.tsx:73-78; inventory §3.5 G). A plain swap to «Admin platform» would keep the error | Yes | D-010 |
| B2 | «Halaman ini untuk kepala program dan dekan, pada bagian sekolah yang mereka pimpin.» | «Halaman ini untuk Kepala departemen dan Dekan, pada bagian sekolah yang mereka pimpin.» | T1 #544 · hle.ts:1513 · `pimpinan.ditolak` | /pimpinan/* refusal | §4.2; gate admits H, D (inventory §3.2); en already «heads of department and deans» | No | D-010, D-006 |
| B3 | «Halaman ini untuk administrator sekolah.» | «Halaman ini untuk Admin sekolah.» | T1 #752 · hle.ts:1626 · `pendataan.ditolak` | /pendataan refusal | §2 "replace administrator sekolah"; gate admits IA only | No | D-010 |
| B4 | «Halaman ini untuk pengelola data sekolah.» | «Halaman ini untuk Admin sekolah dan Admin platform.» | T1 #80 · hle.ts:2686 · `aktivasi.ditolak` | /aktivasi refusal | §2 "replace pengelola data sekolah"; gate admits IA and SA (aktivasi/page.tsx:30-47), so «Admin sekolah» alone would be narrower | Check (Yazid) | D-010 |
| B5 | «Halaman ini untuk staf pengelola isi. …» | — (no dictionary word covers the four roles Studio admits) | T1 #1200 · hle.ts:2446 · `studio.refused` | /studio/* refusal | §4.2; gate admits Guru, Kepala departemen, Admin sekolah, Admin platform (D-021) | Check (Yazid) | D-021 |
| B6 | «…Keduanya ditinjau Kepala Departemen, bukan pengajar.» | «…Keduanya ditinjau Kepala departemen, bukan pengajar.» | T1 #378 · hle.ts:3193 · `mengajar.bukti.kaki` | /mengajar/[kelas]/bukti | §4.2 capitalisation (for «pengajar» see C17) | No | — |
| B7 | «…Persetujuan dan penerbitan dilakukan Kepala Departemen dan sekolah.» | «…dilakukan Kepala departemen dan sekolah.» | T1 #457 · hle.ts:3209 · `mengajar.langkah.f6w` | /mengajar/[kelas]/langkah | §4.2 capitalisation | No | — |
| B8 | «…Hanya admin platform yang bisa membuat orang di luar pendataan.» | «…Hanya Admin platform yang bisa…» | T1 #83 · hle.ts:2714 · `aktivasi.galat.baru_ditolak` | /aktivasi | §4.2 capitalisation | No | — |
| B9 | «…Coba lagi, atau hubungi admin platform.» | «…atau hubungi Admin platform.» | T1 #1170 · hle.ts:2142 · `studio.paket.masalah.package_could_not_be_saved` | Studio upload | §4.2 capitalisation («Paket» see D31) | No | — |
| B10 | «…Hubungi admin sekolah Anda.» | «…Hubungi Admin sekolah Anda.» | T1 #157 · hle.ts:2274 · `entry.kosong` | / | §4.2 capitalisation («Akun» see C32) | No | — |
| B11 | «…sampaikan kode rujukan di bawah kepada pengelola sekolah Anda.» | «…kepada Admin sekolah Anda.» | T1 #39 · hle.ts:3125 · `galat.arti` | error page, every route and role | §2 "pengelola … and similar". Learners read it too, and D-037 says students tell their teacher | Check (Yazid) | D-037 |
| B12 | «…kepada yang mengurus PINTAR di sekolah Anda.» (5 strings) | «…kepada Admin sekolah Anda.» | T1 #23 (staff variant) · hle.ts:1831 `tolak.arti`; #33 · 2637 `galat.action_failed`; #420 · 3175 `mengajar.cepat.tolak.izin`; #424 · 3177 `mengajar.cepat.tolak.umum`; #1048 · 2670 `studio.konten.kode.content_author_unknown` | refusal page (staff), Studio, /mengajar/[kelas]/uji-cepat | a description chosen in DAISY-17, not a role name; "and similar when they mean that role" | Check (Yazid) | D-037 |
| B13 | «Untuk pengelola pertama sebuah sekolah. …» | «Untuk Admin sekolah pertama sebuah sekolah. …» | T1 #72 · hle.ts:2701 · `aktivasi.baru.arti` | /aktivasi | §2; the person has no role yet at this step («beri peran di Konfigurasi») | Check (Yazid) | — |
| B14 | «Menyusun templat laporan memerlukan wewenang pengelola institusi.» | «…memerlukan wewenang Admin sekolah.» | T1 #634 · hle.ts:1949 · `laporan.templat.tak_berwenang` | /konfigurasi #intelligence (id-only) | §2 role and «institusi». Which roles hold `CAN_MANAGE_REPORT_TEMPLATES` was not verified; the line also shows when no metric exists (konfigurasi/page.tsx:629-630) | Check (Yazid) | — |
| B15 | Evaluation persona label `Administrator Sekolah` (INSTITUTION_ADMIN) | `Admin sekolah` | §1.2.8 · supabase/seed/human_evaluation.sql:412; shown at evaluasi/page.tsx:41,56 and _evaluation-banner.tsx:23 | /evaluasi and the banner | §2 "replace administrator sekolah" | No | D-014 |
| B16 | Evaluation persona labels `Penelaah & Penerbit` (HEAD_OF_DEPARTMENT), `Pimpinan Sekolah` (DEAN) | `Kepala departemen`, `Dekan`? | §1.2.8 · human_evaluation.sql:410-411 | /evaluasi and the banner | §4.2; the labels describe what the persona does, not only the role | Check (Yazid) | D-014 |
| B17 | Seed display names `Kaprodi Bootstrap`, `Kaprodi Alpha (sintetis)`, `Kaprodi Siklus (sintetis)`, `Admin Platform (sintetis)` | per dictionary, if names are in scope | §1.2.8 · official_bootstrap.sql:94-103; synthetic.sql:100-108; learning_cycle.sql:85 | wherever a person's name shows (non-production seeds) | the inventory treats people's names as data, not terminology ("Limits") | Check (Yazid) | D-014 |

---

## C. People and school (proposal §2)

| # | Current (id) | Proposed (id) | Key / source | Screen(s) | Reason (proposal rule) | Semantic change? | Canonical decision affected |
|---|---|---|---|---|---|---|---|
| C1 | «Dari pengerjaan siswa» | «Dari pengerjaan murid» | T1 #1001 · hle.ts:2625 · `studio.bank.empiris` | /studio/bank | Learner → Murid | No | — |
| C2 | «…Angka dari pengerjaan siswa baru muncul setelah cukup siswa menjawab…» | «…pengerjaan murid … cukup murid menjawab…» | T1 #1002 · hle.ts:2622 · `studio.bank.intro` | /studio/bank | Learner → Murid («Buat Paket» see D41) | No | — |
| C3 | «Sudah dibicarakan dengan siswa» | «Sudah dibicarakan dengan murid» | T1 #1036 · hle.ts:2612 · `studio.integritas.DISCUSSED_WITH_LEARNER` | /studio/integritas | Learner → Murid | No | — |
| C4 | «…bukan kesimpulan tentang siswa.» | «…bukan kesimpulan tentang murid.» | T1 #1040 · hle.ts:2609 · `studio.integritas.penjelasan` | /studio/integritas | Learner → Murid | No | — |
| C5 | «…Siswa yang sedang mengerjakan tetap bisa menyelesaikannya; …» | «…Murid yang sedang mengerjakan…» | T1 #1042 · hle.ts:2601 · `studio.kanonik.ditarik` | /studio/kanonik | Learner → Murid («paket» see D35) | No | — |
| C6 | «Terbitan adalah versi kursus yang nanti dipakai siswa. …» | «…yang nanti dipakai murid. …» | T1 #1077 · hle.ts:2226 · `studio.langkah.buat.arti` | /studio/paket/[course] | Learner → Murid («kursus» see D10) | No | — |
| C7 | «…Lihat seperti siswa untuk memeriksa tampilannya, …» | «…Lihat seperti murid untuk…» | T1 #1100 · hle.ts:2214 · `studio.langkah.susun.arti` | /studio/paket/[course] | Learner → Murid; quotes C8's link, so they change together | No | — |
| C8 | «Lihat seperti siswa» | «Lihat seperti murid» | T1 #1194 · hle.ts:2483 · `studio.paket.pratinjau` | /studio/kanonik, /studio/paket/[course] | Learner → Murid | No | — |
| C9 | «…beserta seluruh catatan pengerjaan siswa. …» | «…catatan pengerjaan murid. …» | T1 #1196 · hle.ts:2491 · `studio.paket.revisi_penjelasan` | /studio/paket/[course] | Learner → Murid | No | — |
| C10 | «…Siswa baru melihatnya setelah Anda menugaskannya ke kelas.» | «…Murid baru melihatnya…» | T1 #1198 · hle.ts:2489 · `studio.paket.terbit_bukan_tugas` | /studio/paket/[course] | Learner → Murid | No | — |
| C11 | «…sudah ada siswa yang mulai mengerjakannya. …» | «…sudah ada murid yang mulai…» | T1 #1259 · hle.ts:2151 · `studio.terbitan.kode.release_move_started` | /studio/paket/[course] #koreksi | Learner → Murid | No | — |
| C12 | «Pilih peserta didik, lalu isi kode sekolah tujuan…» | «Pilih murid, lalu isi…» | T1 #68 · hle.ts:2639 · `galat.transfer_input_incomplete` | /konfigurasi #transfers | Learner → Murid | No | — |
| C13 | «Peserta didik (pendaftaran aktif)» | «Murid (pendaftaran aktif)» | T1 #896 · hle.ts:2005 · `config.label.enrollment` | /konfigurasi (id-only) | Learner → Murid | No | — |
| C14 | «Perpindahan peserta didik» | «Perpindahan murid» | T1 #928 · hle.ts:1987 · `config.section.transfers` | /konfigurasi section menu | Learner → Murid | No | — |
| C15 | «Setiap fungsi peserta didik memeriksa kepemilikan» | «Setiap fungsi murid memeriksa kepemilikan»? | T1 #872 · hle.ts:1967 · `config.kesehatan.cek.learner_rpcs_guarded_ok` | /konfigurasi schema-health list | technical line about learner functions | Check (Yazid) | — |
| C16 | «Peserta» (metric name, ×2) | «Murid»? | T1 #663 · hle.ts:1426 `metrik.peserta.label`; #661 · 1442 `metrik.peserta_institusi.label` | reports | counts learners who took an assessment ("participants"); «Murid» alone may read as all learners | Check (Yazid) | — |
| C17 | «…ditinjau Kepala Departemen, bukan pengajar.» | «…bukan guru.» | T1 #378 · hle.ts:3193 · `mengajar.bukti.kaki` | /mengajar/[kelas]/bukti | Teacher → Guru (case see B6) | No | — |
| C18 | «…bukan bagian dari peran pengajar.» | «…bukan bagian dari peran guru.» | T1 #460 · hle.ts:3210 · `mengajar.langkah.quiet` | /mengajar/[kelas]/langkah | Teacher → Guru («bagian» see E24) | No | — |
| C19 | «Pengajar itu tidak lagi tercatat mengajar kelas ini.» | «Guru itu tidak lagi tercatat…» | T1 #671 · hle.ts:3019 · `umpanbalik.buka.bukan_pengajar` | feedback rounds | Teacher → Guru | No | — |
| C20 | «Tidak ada pengajar yang bisa ditanyakan untuk kelas ini.» | «Tidak ada guru yang bisa…» | T1 #676 · hle.ts:3013 · `umpanbalik.buka.kosong` | /pimpinan/…/umpan-balik/kelas/[kelas] | Teacher → Guru | No | — |
| C21 | «Pilih pengajar yang akan ditanyakan kepada kelas ini.» | «Pilih guru yang akan…» | T1 #678 · hle.ts:3012 · `umpanbalik.buka.sub` | same | Teacher → Guru | No | — |
| C22 | «…putaran tentang pengajar itu pada periode ini.» | «…putaran tentang guru itu…» | T1 #680 · hle.ts:3018 · `umpanbalik.buka.sudah_ada` | feedback rounds | Teacher → Guru | No | — |
| C23 | «…untuk satu kelas dan satu pengajarnya.» | «…dan satu gurunya.» | T1 #707 · hle.ts:3006 · `umpanbalik.kelas.sub` | /pimpinan/[simpul]/umpan-balik | Teacher → Guru | No | — |
| C24 | «Tur untuk pengajar» | «Tur untuk guru» | T1 #1355 · hle.ts:2729 · `tur.nama.pengajar` | help panel (47 routes) | Teacher → Guru | No | — |
| C25 | «Membicarakannya dengan pendidik di bagian ini, …» | «Membicarakannya dengan guru di bagian ini, …» | T1 #590 · hle.ts:1560 · `pimpinan.rantai.pembelajaran.langkah` | /pimpinan/* | Teacher → Guru («bagian» see E30) | No | — |
| C26 | «Institusi» (form label) | «Sekolah» | T1 #626 · hle.ts:1937 · `laporan.templat.institusi` | /konfigurasi #intelligence (id-only) | School → Sekolah; the Studio pickers already say «Sekolah» (inventory §1.2.11) | No | — |
| C27 | «Pilih institusi, isi kunci judul, …» | «Pilih sekolah, isi kunci judul, …» | T1 #64 · hle.ts:2643 · `galat.template_input_incomplete` | /konfigurasi | School → Sekolah | No | — |
| C28 | «…penafsiran tingkat institusi. …» | «…tingkat sekolah…»? | T1 #538 · hle.ts:1510 · `pimpinan.batas` | /pimpinan | School → Sekolah, but «tingkat sekolah» could read as the structure unit «Tingkat» | Check (Yazid) | D-006 |
| C29 | MCQ findings: «Siswa yang paham pola ujian…»; «…mengapa siswa memilihnya.» | «Murid yang paham…»; «…mengapa murid memilihnya.» | §1.2.6 · supabase/migrations/20260919090000_staff_authoring_rpcs_check_their_capability.sql:104-107, :151-154 | /studio/paket/[course] #temuan | Learner → Murid | No | D-014 |
| C30 | Coaching findings: «Menyebut pekerjaan siswa "salah"…», «kata menghakimi tentang siswa», «…yang bisa dicoba siswa.», «status internal bocor ke teks siswa», «…bagi siswa…», «istilah bukti internal bocor ke teks siswa», «…teks yang dibaca siswa.» | «siswa» → «murid» in each | §1.2.6 · 20260912200500_validator_and_publish_readiness.sql:68-87 | /studio/paket/[course] #temuan | Learner → Murid | No | D-014 |
| C31 | Seed display names `Siswa Bootstrap`, `Siswa Alpha Satu/Dua (sintetis)`, `Siswa Beta Satu (sintetis)`, `Siswa Siklus Email/Kartu (sintetis)` | per dictionary, if names are in scope | §1.2.8 · official_bootstrap.sql:94-103; synthetic.sql:100-108; learning_cycle.sql:598,603 | wherever a person's name shows (non-production seeds) | names are data (inventory "Limits") | Check (Yazid) | D-014 |
| C32 | «Akun Anda belum terhubung dengan kelas atau tugas apa pun. …» | no change | T1 #157 · hle.ts:2274 · `entry.kosong` | / | orang ≠ akun: the class or assignment belongs to the person, not the login | Check (Yazid) | — |
| C33 | «Akun Anda belum dipasangkan dengan kelas mana pun.» | no change | T1 #1070 · hle.ts:2469 · `studio.kuis.tanpa_kelas` | /studio/kuis (id-only) | as C32 | Check (Yazid) | — |

**Considered, not in this section:**
- **«edukator»** appears only in the route `/edukator/ringkasan`, never as visible text.
- **«pengajaran»** ("teaching", T1 #679, #716, #745) and **«Pendidikan»** ("education", #131) are not «pengajar» or «pendidik».
- **«institusi» in T1 #634** is covered by B14.

---

## D. Content vocabulary (proposal §3)

Boundary applied:
- **Paket Pembelajaran** is the Studio object.
- **Materi** is what a teacher provides and a learner learns. Teacher and learner uses of «materi» are already consistent (see G).
- **Kursus** stays only where the workbook format needs it (D-007's sheet «Kursus»).

| # | Current (id) | Proposed (id) | Key / source | Screen(s) | Reason (proposal rule) | Semantic change? | Canonical decision affected |
|---|---|---|---|---|---|---|---|
| D1 | «Salinan baru kursus ini dibuat, …» | «Salinan baru Paket Pembelajaran ini dibuat, …» | T1 #54 · hle.ts:2659 · `galat.revision_created` | Studio | §3: the Studio object | No | — |
| D2 | «Kursus ini maju ke langkah berikutnya.» | «Paket Pembelajaran ini maju ke langkah berikutnya.» | T1 #63 · hle.ts:2656 · `galat.step_taken` | Studio | §3 | No | — |
| D3 | «Kursus ini belum memiliki terbitan: …» | «Paket Pembelajaran ini belum memiliki terbitan: …» | T1 #1027 · hle.ts:2204 · `studio.hambatan.readiness_no_release` | Studio | §3 | No | — |
| D4 | «Isi kursus belum dikunci pada langkah Kunci terbitan. …» | «Isi Paket Pembelajaran belum dikunci…» | T1 #1028 · hle.ts:2205 · `studio.hambatan.readiness_not_sealed` | Studio | §3 («Isi» see D49) | No | — |
| D5 | «Penyusun kursus tidak dapat diganti.» | «Penyusun Paket Pembelajaran tidak dapat diganti.» | T1 #1047 · hle.ts:2676 · `studio.konten.kode.content_author_immutable` | Studio | §3 | No | — |
| D6 | «PINTAR tidak tahu siapa penyusun kursus ini, …» | «…penyusun Paket Pembelajaran ini, …» | T1 #1048 · hle.ts:2670 · `studio.konten.kode.content_author_unknown` | Studio | §3 (role phrase see B12) | No | — |
| D7 | «Anda menyusun kursus ini, jadi persetujuannya harus dari orang lain. …» | «Anda menyusun Paket Pembelajaran ini, …» | T1 #1052 · hle.ts:2671 · `studio.konten.kode.content_reviewer_is_author` | Studio | §3 | No | — |
| D8 | «Kursus ini sudah tidak berada di langkah itu, …» | «Paket Pembelajaran ini sudah tidak berada…» | T1 #1056 · hle.ts:2667 · `studio.konten.kode.content_transition_invalid` | Studio | §3 | No | — |
| D9 | «Kirim kursus ini kepada rekan yang boleh menyetujuinya. …» | «Kirim Paket Pembelajaran ini kepada rekan…» | T1 #1072 · hle.ts:2220 · `studio.langkah.ajukan.arti` | /studio/paket/[course] | §3 | No | — |
| D10 | «Terbitan adalah versi kursus … Terbitan dibuat dari kursus yang sudah disetujui.» | «…versi Paket Pembelajaran … dari Paket Pembelajaran yang sudah disetujui.» | T1 #1077 · hle.ts:2226 · `studio.langkah.buat.arti` | /studio/paket/[course] | §3 («siswa» see C6) | No | — |
| D11 | «bukan penyusun kursus ini» | «bukan penyusun Paket Pembelajaran ini» | T1 #1080 · hle.ts:2186 · `studio.langkah.bukan_penyusun` | /studio/paket/[course] | §3 | No | — |
| D12 | «…Untuk memperbaikinya, buat salinan kursus di bawah.» | «…buat salinan Paket Pembelajaran di bawah.» | T1 #1082 · hle.ts:2238 · `studio.langkah.ditarik.arti` | /studio/paket/[course] | §3 | No | — |
| D13 | «Kursus ini terbit setelah langkah 7.» | «Paket Pembelajaran ini terbit setelah langkah 7.» | T1 #1105 · hle.ts:2236 · `studio.langkah.terbit.nanti` | /studio/paket/[course] | §3 | No | — |
| D14 | «Anda menyusun kursus ini, jadi langkah ini diambil orang kedua. …» | «Anda menyusun Paket Pembelajaran ini, …» | T1 #1110 · hle.ts:2190 · `studio.langkah.tunggu.penyusun` | /studio/paket/[course] | §3 | No | — |
| D15 | «Anda tidak berwenang menyusun kursus di sekolah ini.» | «…menyusun Paket Pembelajaran di sekolah ini.» | T1 #1127 · hle.ts:2144 · `studio.paket.kode.package_not_allowed` | Studio upload | §3 | No | — |
| D16 | «Pilih sekolah. Unggahan menjadi kursus sekolah, bukan pustaka platform.» | «…Unggahan menjadi Paket Pembelajaran sekolah, …» | T1 #1128 · hle.ts:2146 · `studio.paket.kode.package_school_not_allowed` | Studio upload | §3; states D-029's rule | No | D-029 |
| D17 | «Kursus ini belum disetujui. Terbitan dibuat dari kursus yang sudah disetujui.» | «Paket Pembelajaran ini belum disetujui. … dari Paket Pembelajaran yang…» | T1 #1254 · hle.ts:2156 · `studio.terbitan.kode.release_course_not_approved` | Studio | §3 | No | — |
| D18 | «Kursus ini sudah punya terbitan. Untuk koreksi, buat revisi kursus.» | «Paket Pembelajaran ini sudah punya terbitan. … buat revisi Paket Pembelajaran.» | T1 #1255 · hle.ts:2157 · `studio.terbitan.kode.release_exists` | Studio | §3 | No | — |
| D19 | «Terbitan atau kursus tidak dikenali.» | «Terbitan atau Paket Pembelajaran tidak dikenali.» | T1 #1257 · hle.ts:2162 · `studio.terbitan.kode.release_input_invalid` | Studio | §3 | No | — |
| D20 | «Kursus ini belum siap terbit. …» | «Paket Pembelajaran ini belum siap terbit. …» | T1 #1261 · hle.ts:2160 · `studio.terbitan.kode.release_not_ready` | Studio | §3 | No | — |
| D21 | «Penyusun kursus tidak bisa mengunci terbitannya sendiri. …» | «Penyusun Paket Pembelajaran tidak bisa…» | T1 #1264 · hle.ts:2159 · `studio.terbitan.kode.release_same_person` | Studio | §3 | No | — |
| D22 | «Terbitan dibuat dari kursus sekolah, bukan dari pustaka nasional.» | «…dari Paket Pembelajaran sekolah, …» | T1 #1265 · hle.ts:2155 · `studio.terbitan.kode.release_school_not_allowed` | Studio | §3; states D-029's rule | No | D-029 |
| D23 | Finding location `Bank soal untuk kursus ini` | `Bank soal untuk Paket Pembelajaran ini` | §1.2.6 · 20260919090000_…capability.sql:165-168 | /studio/paket/[course] #temuan | §3 | No | D-014 |
| D24 | «Buka kursus» | «Buka Paket Pembelajaran» | T1 #1273 · hle.ts:2582 · `studio.unggah.buka_kursus` | /studio/unggah, after saving | §3. It opens `/studio/paket/[course]` (inventory §3.5 B, PanelUnggah :286), but it sits right after the workbook whose sheet is «Kursus» | Check (Yazid) | — |
| D25 | «Buku kerja sudah menjadi kursus, bab, pelajaran, dan soal. …» | no change proposed | T1 #1100 · hle.ts:2214 · `studio.langkah.susun.arti` | /studio/paket/[course] | the list mirrors the workbook sheets (D-007: "turned into course, chapters, lessons, questions") | Check (Yazid) | D-007 |
| D26 | «Paket dibuat.» | «Paket Pembelajaran dibuat.» | T1 #46 · hle.ts:2666 · `galat.draft_created` | Studio | §2 canonical term; short form, see I-2 | No | — |
| D27 | «Belum ada paket di sini.» | «Belum ada Paket Pembelajaran di sini.» | T1 #1131 · hle.ts:2492 · `studio.paket.kosong` | /studio, /studio/bank, … | §2; short form | No | — |
| D28 | «Paket asli tetap utuh …» | «Paket Pembelajaran asli tetap utuh …» | T1 #1196 · hle.ts:2491 · `studio.paket.revisi_penjelasan` | /studio/paket/[course] | §2 («siswa» see C9) | No | — |
| D29 | «…sebelum paket ini bisa lanjut.» | «…sebelum Paket Pembelajaran ini bisa lanjut.» | T1 #1210 · hle.ts:2480 · `studio.state.explain.BLOCKED` | /studio/paket/[course] | §2 («isinya» see D49) | No | — |
| D30 | «Paket ini siap diterbitkan.» | «Paket Pembelajaran ini siap diterbitkan.» | T1 #1211 · hle.ts:2478 · `studio.state.explain.READY` | /studio/paket/[course] | §2 | No | — |
| D31 | «Paket ini belum bisa disimpan. …» | «Paket Pembelajaran ini belum bisa disimpan. …» | T1 #1170 · hle.ts:2142 · `…package_could_not_be_saved` | Studio upload | §2 "importable container" (role see B9) | No | — |
| D32 | «Paket ini belum bisa diterima. Perbaiki baris yang disebut lalu unggah lagi.» | «Paket Pembelajaran ini belum bisa diterima. …» | T1 #1125 · hle.ts:2147 · `studio.paket.kode.package_has_problems` | Studio upload | §2 "importable container" | No | — |
| D33 | «Belum ada paket PINTAR yang diizinkan untuk sekolah Anda.» | «Belum ada Paket Pembelajaran PINTAR yang diizinkan…» | T1 #1045 · hle.ts:2600 · `studio.kanonik.kosong` | /studio/kanonik | §2 "publishable container" | No | — |
| D34 | «Paket yang disusun PINTAR dan diizinkan untuk sekolah Anda. …» | «Paket Pembelajaran yang disusun PINTAR…» | T1 #1046 · hle.ts:2599 · `studio.kanonik.penjelasan` | /studio/kanonik | §2 | No | — |
| D35 | «Izin untuk paket ini sudah berakhir. …» | «Izin untuk Paket Pembelajaran ini sudah berakhir. …» | T1 #1042 · hle.ts:2601 · `studio.kanonik.ditarik` | /studio/kanonik | §2 («Siswa» see C5) | No | — |
| D36 | «…Buat paket sekolah Anda, atau tunggu bab Pustaka PINTAR…» | «…Buat Paket Pembelajaran sekolah Anda, …» | T1 #1059 · hle.ts:2467 · `studio.kuis.bab_kosong` | /studio/kuis (id-only) | §2 | No | — |
| D37 | «Paket sekolah Anda» | «Paket Pembelajaran sekolah Anda» | T1 #1069 · hle.ts:2460 · `studio.kuis.sumber_sekolah` | /studio/kuis (id-only) | §2 | No | — |
| D38 | Upload problems: «Ada bagian paket yang belum bisa diterima.», «Paket ini tidak berisi kursus.», «Isi paket tidak terbaca sebagai JSON.», «Bagian paket ini tidak berbentuk yang diharapkan.», «Paket ini terlalu besar untuk sekali unggah.» | «Paket Pembelajaran …»? («kursus» in #1171 kept as the format term) | T1 #1149 · 2143; #1171 · 2101; #1172 · 2100; #1173 · 2103; #1174 · 2102 (`studio.paket.masalah.*`) | Studio upload | these may concern a raw JSON package rather than the Studio object | Check (Yazid) | — |
| D39 | JSON forms: «Isi paket (JSON)», «Untuk paket yang dibuat sistem lain. …», «Untuk sistem lain: paket JSON», «Tempel paket JSON dari sistem lain. …», «Periksa paket JSON», «Periksa paket terstruktur», «Untuk paket yang sudah dibuat mesin dalam format baku.» | no change proposed | T1 #1282 · 2588; #1283 · 2587; #1284 · 2586; #1307 · 2502; #1308 · 2589; #1309 · 2590; #1324 · 2504 | /studio/unggah (closed disclosure) | is a JSON «paket» the Paket Pembelajaran or a file format? | Check (Yazid) | D-007 |
| D40 | «Paket Terstruktur» | no change | T1 #1323 · hle.ts:2503 · `studio.unggah.terstruktur` | /studio/unggah | D-007 names the JSON path «Paket Terstruktur» | — (no change) | D-007 |
| D41 | «Buat Paket» (Studio sub-nav), and «…di Buat Paket.» in T1 #1002 | — (see F14) | T1 #1120 · hle.ts:2448 · `studio.nav.unggah`; #1002 · 2622 | /studio/* | §2 term is «Paket Pembelajaran»; §5 wants a noun for a destination | Check (Yazid) | — |
| D42 | «Anda belum dapat menyusun materi di sekolah mana pun.» | no change proposed | T1 #1319 · hle.ts:2550 · `studio.unggah.tanpa_sekolah` | /studio/unggah | Studio authoring: «materi» (what a teacher provides) or the Studio object? | Check (Yazid) | — |
| D43 | «Bahan Uji Cepat ini sudah tidak tersedia untuk sekolah Anda, …» | «Materi Uji Cepat ini…»? | T1 #1071 · hle.ts:2468 · `studio.kuis.tidak_tersedia` | /studio/kuis (id-only) | «bahan» = the chapter the Uji Cepat draws on | Check (Yazid) | — |
| D44 | «Urutan mengikuti kurikulum sekolah. …» | no change proposed | T1 #467 · hle.ts:3071 · `mengajar.materi.sub` | /mengajar/[kelas] | the school's own curriculum, not a PINTAR object | Check (Yazid) | — |
| D45 | «…materi di luar kurikulum akademik, …» | no change proposed | T1 #670 · hle.ts:3021 · `umpanbalik.buka.bukan_akademik` | feedback rounds | echoes the Kursus-sheet context «Akademik» | Check (Yazid) | — |
| D46 | «Setiap jalur kurikulum berbentuk benar» | no change proposed | T1 #873 · hle.ts:1982 · `config.kesehatan.cek.malformed_jalur` | /konfigurasi schema-health list | technical line | Check (Yazid) | — |
| D47 | Tenant name `PINTAR Kurikulum Nasional` | no change | §1.2.8 · 20260915100000_canonical_tenant_kind.sql:246 | /studio/kanonik, /studio/kuis, scope rows | a name fixed by D-029 | — (no change) | D-029 |
| D48 | Studio step names «Susun isi», «Periksa isi», «Setujui isi», and the lines that name them («…menunggu langkah Setujui isi», «…lolos langkah Periksa isi», «Menyetujui isi bukan wewenang Anda…», «…di langkah Setujui isi.», «Periksa isi sekarang», «Pemeriksaan isi selesai. …», «Jalankan pemeriksaan isi…») | no change proposed | T1 #1101 · 2213; #1094 · 2216; #1097 · 2222; #1098 · 2224; #1024 · 2203; #1029 · 2201; #1051 · 2668; #1052 · 2671; #1188 · 2240; #43 · 2657; #1093 · 2217 | /studio/paket/[course], Studio | «isi» = the Studio object's content; §3 does not say whether it becomes «materi» | Check (Yazid) | — |
| D49 | Other «isi» meaning the Studio object's content: «Isi kursus…», «bagian isi dikembalikan…», «Isi baru selalu dimulai dari unggahan. …», «Menarik isi yang sudah terbit…», «Isi ini dikembalikan…», «…memeriksa isinya…», «…membaca isinya…», «…pada isinya…» | no change proposed | T1 #1028 · 2205; #1030 · 2202; #1049 · 2677; #1057 · 2675; #1081 · 2192; #1089 · 2229; #1096 · 2223; #1210 · 2480 | Studio | as D48 | Check (Yazid) | — |
| D50 | «Lembar Kursus belum berisi baris data.»; «Satu buku kerja untuk satu kursus: lembar Kursus hanya boleh satu baris.» | no change | T1 #1178 · hle.ts:2092; #1179 · 2093 (`studio.paket.masalah.workbook_course_*`) | Studio upload | the workbook sheet «Kursus» (§3, D-007) | — (no change) | D-007 |
| D51 | Template: «Kursus» (limit row); «Satu buku kerja berisi satu kursus. …»; «Satu kursus per buku kerja: …» | no change | T1 #1217 · 2527; #1224 · 2510; #1244 · 2536 (`studio.templat.*`) | /studio/unggah; workbook «Cara mengisi» | workbook format (D-007: one course per workbook) | — (no change) | D-007 |
| D52 | «Kursus» (upload count, beside Bab, Pelajaran, Soal, Pilihan) | no change | T1 #1276 · hle.ts:2560 · `studio.unggah.hitung.courses` | /studio/unggah | mirrors the sheet names | — (no change) | D-007 |
| D53 | «Judul kursus belum diisi.»; «Konteks kursus tidak dikenal.» | no change | T1 #1136 · 2104; #1132 · 2108 | Studio upload | name the Kursus-sheet columns «Judul kursus», «Konteks» | — (no change) | D-007 |
| D54 | Template sheets `Kursus` …, header `Judul kursus`, guidance `Nama kursus seperti yang dilihat guru dan murid.`, `Satu kursus per buku kerja: …` | no change | §1.2.4a · unggah-kontrak.ts:53, :58; hle.ts:2536 | workbook template | workbook format (D-007) | — (no change) | D-007 |
| D55 | «isi» that is not the content concept: the Pelajaran column «Isi pelajaran» (#1152, #1229) and the verb "fill in" (#56, #64, #68, #711, #795, #943, #1187, #1224, #1225, #1274) | no change | T1 as listed | various | not the content concept | — (no change) | D-007 (for «Isi pelajaran») |

**Considered:** «konten» is in no rendered Bahasa string. It appears only in the seed notes «Konten fixture…» and «Konten peragaan…» (§1.2.8), which are data. «bahan pertimbangan» / «bahan refleksi» (T1 #583, #1040, #691) use «bahan» in its everyday sense (see G).

---

## E. Other dictionary items (proposal §2)

| # | Current (id) | Proposed (id) | Key / source | Screen(s) | Reason (proposal rule) | Semantic change? | Canonical decision affected |
|---|---|---|---|---|---|---|---|
| E1 | «PINTAR tidak mengirim surel ke orang ini. …» | «PINTAR tidak mengirim email ke orang ini. …» | T1 #75 · hle.ts:2704 · `aktivasi.baru.ok` | /aktivasi | Email, not surel | No | D-019 |
| E2 | «, lalu mengetik alamat surel ini. …» | «, lalu mengetik alamat email ini. …» | T1 #76 · hle.ts:2705 · `aktivasi.baru.ok.lalu` | /aktivasi | Email | No | D-019 |
| E3 | «Aktifkan dengan surel» | «Aktifkan dengan email» | T1 #79 · hle.ts:2696 · `aktivasi.dengan_surel` | /aktivasi | Email. D-019 quotes this button as «Aktifkan dengan surel» | No | D-019 |
| E4 | «…Alamat surel ini mungkin sudah dipakai akun lain. …» | «…Alamat email ini mungkin…» | T1 #84 · hle.ts:2715 · `aktivasi.galat.dipakai` | /aktivasi | Email | No | — |
| E5 | «Alamat surel ini belum lengkap. …» | «Alamat email ini belum lengkap. …» (= /masuk's T1 #129) | T1 #90 · hle.ts:2712 · `aktivasi.galat.surel` | /aktivasi | Email | No | — |
| E6 | «…dengan alamat surel, … PINTAR tidak mengirim surel atau pesan apa pun.» | «…dengan alamat email, … mengirim email atau pesan…» | T1 #92 · hle.ts:2691 · `aktivasi.intro` | /aktivasi | Email | No | D-019 |
| E7 | «Alamat surel» | «Alamat email» (= /masuk's T1 #127) | T1 #99 · hle.ts:2695 · `aktivasi.surel` | /aktivasi | Email | No | — |
| E8 | «PINTAR tidak mengirim surel ke orang ini. …» | «…mengirim email ke orang ini. …» | T1 #100 · hle.ts:2707 · `aktivasi.surel_arti` | /aktivasi | Email | No | D-019 |
| E9 | «, lalu mengetik alamat surel ini. …» | «, lalu mengetik alamat email ini. …» | T1 #101 · hle.ts:2708 · `aktivasi.surel_arti.lalu` | /aktivasi | Email | No | D-019 |
| E10 | «Pertanyaan» (progress label in the player) | «Soal» | T1 #244 · hle.ts:2296 · `pretest.progress` | assessment player (id-only) | Soal = assessment question; the same player already says «Daftar soal», «Jumlah soal» | No | — |
| E11 | «Butir wajib» (metric name) | «Soal wajib» | T1 #637 · hle.ts:1446 · `metrik.gerbang_keselamatan.label` | reports, /mengajar/[kelas]/bukti | Soal = default assessment-question term | No | — |
| E12 | «…seluruh butir wajib.» | «…seluruh soal wajib.» | T1 #636 · hle.ts:1447 · `metrik.gerbang_keselamatan.arti` | reports | as E11 («Bagian murid» see E27) | No | — |
| E13 | «…menjawab butir ini dengan benar.» | «…menjawab soal ini dengan benar.» | T1 #640 · hle.ts:1455 · `metrik.item_benar.arti` | reports | as E11 | No | — |
| E14 | «…pada butir ini.» | «…pada soal ini.» | T1 #656 · hle.ts:1457 · `metrik.pengecoh.arti` | reports | as E11 | No | — |
| E15 | «Posisi butir ini dalam lembar soal…» | «Posisi soal ini dalam lembar soal…» | T1 #664 · hle.ts:1459 · `metrik.posisi.arti` | reports | as E11 | No | — |
| E16 | «Butir wajib selalu disertakan … butir itu … Urutan ini soal seberapa sering butir ditampilkan, bukan soal mutunya.» | — | T1 #610 · hle.ts:1478 · `kesehatan.catatan_paparan` | /edukator/ringkasan | the minimal edit would put «soal» (question) beside «soal» ("a matter of") | Check (Yazid) | — |
| E17 | Feedback questionnaire: «Masih ada pertanyaan yang belum dijawab.», «Lima pertanyaan, …», «…pada lima pertanyaan yang sama…», «Semua pertanyaan perlu dijawab.» | no change proposed | T1 #684 · 2928; #686 · 2919; #692 · 2949; #709 · 2941 | feedback rounds | survey questions, not assessment questions. Are they "conversational prompts"? | Check (Yazid) | — |
| E18 | «Pertanyaan» as a question's stem: «Pertanyaan belum diisi.», «pertanyaannya membocorkan jawaban», template header `Pertanyaan`, finding «Kata khas pada pertanyaan…» / «Ganti kata itu di pertanyaan…» | no change proposed | T1 #1145 · 2125; #1023 · 2211; §1.2.4a unggah-kontrak.ts:84; §1.2.6 20260919090000_…:120-123 | Studio upload, workbook | the Soal-sheet column for the stem, not the item | Check (Yazid) | D-007 |
| E19 | «putaran» alone: «Mulai putaran», «Tutup putaran ini», «Putaran ini sudah ditutup.» … (15 strings) | no change | T1 #668, #672, #679, #680, #706, #736, #737, #740, #741, #742, #744, #745, #746, #748, #749 (hle.ts:2977-3024) | feedback-round pages and their result lines | "Putaran alone only where the context is already obvious": each sits on a feedback page | — (no change) | — |
| E20 | «Peta Bacaan Personal», «Peta bacaan Anda», «Lihat peta bacaan», «Peta Bacaan menunjukkan bagian yang perlu dibaca…» and other mentions; SD variant «…memilih bacaan yang pas.» | no change proposed | T1 #185 · 2283; #219 · 2302; #240 · 2300; #269 · 2391; #278 · 2403; #285 · 2398; #1359, #1361, #1395, #1407, #1409; #242 (stage SD, hle.ts:1373) | /belajar/*, tours | Bacaan "only where it really is a reading": the map lists lessons and parts to read | Check (Yazid) | — |
| E21 | «Posisi bacaan tersimpan.» | no change proposed | T1 #209 · hle.ts:2320 · `lesson.saved` | lesson page | «bacaan» here = the lesson being read | Check (Yazid) | — |
| E22 | «Bagian bacaan» | no change proposed | T1 #214 · hle.ts:2308 · `map.page` | lesson page | «bacaan» for a lesson, and «Bagian» in the sense "part" | Check (Yazid) | D-006 |
| E23 | «Penguasaan per bagian» | — (the learner side now reads «Per tujuan pembelajaran», `hasil.domain`) | T1 #372 · hle.ts:3188 · `mengajar.bukti.bagian` | /mengajar/[kelas]/bukti | Bagian: avoid it as "part". The rows are objectives (inventory §3.5 H) | Check (Yazid) | D-006 |
| E24 | «bagian dari» ("part of"): «…dapat menjadi bagian dari bukti pembelajaran…», «…bukan bagian dari peran pengajar.», «Kode ini menjadi bagian dari nomor induk…», «Tempat itu bukan bagian dari sekolah ini.» | — | T1 #399 · 3136; #460 · 3210; #767 · 1637; #797 · 1689 | Uji Cepat, langkah, /pendataan | Bagian: avoid it as "part"; no replacement named | Check (Yazid) | D-006 |
| E25 | «bagian layanan sekolah» ("the school's service desk") | — | T1 #318 · 1814; #1344 · 2751; #1386 · 2828 | certificate, help, tour | as E24 | Check (Yazid) | D-006 |
| E26 | Studio «bagian»: «bagian isi …» (×3), «Ada bagian paket…», «Bagian paket ini…», «Anda menyusun bagian ini, …», «…di bagian Temuan…» (×2) | — | T1 #1024, #1029, #1030, #1149, #1173, #1267, #1093, #1096 | Studio | as E24 | Check (Yazid) | D-006 |
| E27 | «Bagian murid yang…» ("share of learners") | — | T1 #636 · 1447; #640 · 1455 | reports | as E24 | Check (Yazid) | D-006 |
| E28 | «…bagian yang perlu dibaca lebih dulu…» (×2); «…bagian yang perlu diulang…» (×2) | — | T1 #1361 · 2766; #1409 · 2801; #1365 · 2771; #1413 · 2805 | tours | as E24 | Check (Yazid) | D-006 |
| E29 | «…tombol sediakan di bagian akhir.» | — | T1 #498 · hle.ts:3086 · `mengajar.siap.intro` | /mengajar/[kelas]/siapkan | as E24 | Check (Yazid) | D-006 |
| E30 | Management scope, lowercase: «Bagian sekolah», «…bagian sekolah ini.», «Belum ada kelas di bagian ini.», «Murid pada bagian ini» … (15 strings) | no change proposed | T1 #58, #159, #542, #544, #557, #569, #570, #576, #577, #589, #590, #592, #704, #705, #731 | /pimpinan/*, /, Konfigurasi roles | the scope a Kepala departemen leads is a structural Bagian, but a Dekan's is the school (D-006) | Check (Yazid) | D-006 |

**Considered, no change:**
- **Memuat… vs Sedang…:** no misuse found. «Memuat halaman…» (T1 #5) is page loading. «Sedang memeriksa tautan…» (#138) and «Sedang memeriksa…» (#818) are ongoing operations. The button states («Memeriksa…», «Memproses…», «Menyimpan…» …) follow proposal §6.
- **Keluar:** «Keluar» (T1 #18) and «Keluar dari sesi ini» (#134) both sign out. «Keluar dari peragaan» (#1330) already follows the rule.
- **Pengaturan:** «Pengaturan platform disimpan.» (T1 #51) and «Ubah pengaturan» (#425) name actual settings. «Konfigurasi» is not used as a synonym.
- **Conversational «pertanyaan»** is kept: T1 #318, #1369, #1386.
- **The Soal-sheet column «Bacaan»** («Teks yang dibaca sebelum menjawab.», unggah-kontrak.ts:85) really is a reading. Kept.

---

## F. Navigation (proposal §5)

**Kept by the grammar, not listed:** 21 of the 26 label/H1 differences in inventory §3.5 A (A1–A7, A9–A21, A27). Each is a noun or an action label opening a page with a purposeful heading, which §5 allows; A3 («Pimpinan» → «Apa yang menunggu Anda») is the proposal's own example. The other five (A8, A22, A23, A24, A26) are in F4, F10, F12, F13 and F14 below.

**Rule for the chosen name:** D-010 names four homes: Belajar, Mengajar, Pimpinan, Konfigurasi. The dictionary names Pendataan. Every other destination's single name is "Check (Yazid)".

| # | Current (id) | Proposed (id) | Key / source | Screen(s) | Reason (proposal rule) | Semantic change? | Canonical decision affected |
|---|---|---|---|---|---|---|---|
| F1 | `/belajar`: «Belajar» (learner tab) | keep: chosen name «Belajar» | T1 #8 · hle.ts:1821 · `nav.belajar` (CangkangPengalaman.tsx:245) | learner shell | D-010 names the home Belajar | — (no change) | D-010 |
| F2 | `/belajar`: «Pembelajaran Saya» (educator tabs, eyebrow) | «Belajar» | T1 #11 · hle.ts:2860 · `nav.pembelajaran` (CangkangPengalaman.tsx:144, :228) | educator/staff shells | §5 one destination, one name; D-010 | No | D-010 |
| F3 | `/belajar`: «Saya mau belajar» (door on `/`) | — | T1 #158 · hle.ts:2266 · `entry.learner` (app/page.tsx:11-16) | / | §5 wants a short noun for a destination; the doors are first-person sentences (inventory §3.5 C) | Check (Yazid) | D-010 |
| F4 | `/belajar`: «Beranda» (back link; learner eyebrow) | back link names Belajar (wording not named); eyebrow — | T1 #254 · hle.ts:2372 · `siklus.beranda` ([tugas]/page.tsx:82) | /belajar/[tugas], orientation | §5 Back: name the destination where ambiguous; «Beranda» also labels `/studio` (E3); A24 | Check (Yazid) | D-010 |
| F5 | `/belajar`: «Pembelajaran Anda» (section heading) | — | T1 #280 · hle.ts:2387 · `siklus.milik_anda` | /belajar | a heading may state a purpose, but §5 lists it among /belajar's identities | Check (Yazid) | D-010 |
| F6 | `/belajar`: «Kembali ke Belajar» (refusal back), «Tur halaman Belajar», «halaman Belajar» in text | keep | T1 #24 · 1843; #1354 · 2728; #271, #413, #492, #500, #1411 | refusal pages, help, text | already name the destination Belajar (for the sertifikat exception see F12) | — (no change) | D-010 |
| F7 | `/mengajar`: «Kelas» (tab, back link), «Saya mengajar» (door) | D-010 names the home «Mengajar» | T1 #9 · 2835 `nav.kelas`; #447 · 3026 `mengajar.kembali`; #155 · 2267 `entry.educator` | all shells, / | «Kelas» was DAISY-03's choice and is also D-006's structure word | Check (Yazid) | D-010, D-006 |
| F8 | `/pimpinan`: «Pimpinan» (tab), «Saya memimpin bagian sekolah» (door), «Kembali» (back) | name «Pimpinan» kept; door — | T1 #13 · 2838; #159 · 2272 `entry.pimpinan`; #561 · 1514 `pimpinan.kembali` | shells, / | D-010; door as F3; plain «Kembali» is fine where there is no ambiguity | Check (Yazid) | D-010 |
| F9 | `/konfigurasi`: «Konfigurasi» (tab), «Saya mengelola sekolah» (door) | name «Konfigurasi» kept; door — | T1 #10 · 2841; #160 · 2268 `entry.staff` | shells, / | D-010; door as F3 | Check (Yazid) | D-010 |
| F10 | `/pendataan`: «Pendataan» (tab), «Menambahkan orang» (Konfigurasi place link) | link reads «Pendataan» (h1 «Menambahkan orang» stays) | T1 #12 · 2839 `nav.pendataan`; #757 · 1624 `pendataan.judul` at konfigurasi/page.tsx:244 | /konfigurasi | dictionary: Pendataan; §5 noun for a destination (A26, D5). The link reuses the h1's key, so the change is at the call site, not the string | No | D-016 |
| F11 | `/aktivasi`: «Aktivasi akun» (both navs); h1 «Aktifkan akun» | no change | T1 #6 · 2840; #94 · 2688 | /aktivasi | one name already; noun label + purposeful heading | — (no change) | — |
| F12 | `/belajar/sertifikat`: «Sertifikat» (tab), «Semua sertifikat» (back), «Buka» (educator), «Kembali ke Belajar» (refusal back, A22) | — ; the refusal back should name this place, not «Belajar» | T1 #14 · 1822; #329 · 1794; #24 · 1843 ([tugas]/sertifikat/page.tsx:211) | /belajar/[tugas]/sertifikat | §5 Back: name the destination | Check (Yazid) | — |
| F13 | `/belajar/[tugas]`: «Lihat semua langkah», «Buka» (lanjut rows), back «Perjalanan belajar Anda» | — | T1 #277 · 2376; #189 · 2280 `cycle.title` | /belajar, lanjut, peta, pelajaran, hasil | actions are fine; the back label names the cycle, not the assignment (A23, D8) | Check (Yazid) | — |
| F14 | `/studio/unggah`: «Buat Paket» (sub-nav), «Susun materi sendiri» (langkah card); h2 «Buat Paket Pembelajaran» | — | T1 #1120 · 2448; #456 · 3208; #1285 · 2500 | /studio/*, /mengajar/[kelas]/langkah | §5 wants a noun for a destination; «Buat Paket» is a verb phrase (A8, D12) | Check (Yazid) | — |
| F15 | `/studio/paket/[course]`: course-title links, «Buka kursus», list heading «Paket Pembelajaran» | — (see D24) | T1 #1273 · 2582; #1123 · 2481 | /studio, /studio/unggah | §3 boundary + §5 (D13) | Check (Yazid) | — |
| F16 | `/dekan/ringkasan`: «Ringkasan sekolah · ‹school›», «Buka ringkasan sekolah», h1 «Ringkasan Sekolah» | no change (only the case differs) | T1 #916 · 2179; #568 · 2175; #611 · 1493 | /konfigurasi, /pimpinan | one name already (A18, D14) | — (no change) | — |
| F17 | `/edukator/ringkasan`: class names under «Ringkasan per kelas», «Buka ringkasan kelas ini» | no change | T1 #915 · 2180; #567 · 2176 | /konfigurasi, /pimpinan | one name already (D15) | — (no change) | — |
| F18 | `/`: «Mau ke mana hari ini?» (refusal back button = the h1), «Ke halaman awal» (not-found, error) | — | T1 #161 · 2265; #41 · 3128 | refusal, not-found, error, /evaluasi | two names for the start page (D16, A21) | Check (Yazid) | — |
| F19 | `/mengajar/[kelas]/siapkan`: «Siapkan materi», «Siapkan ‹course› untuk ‹class›», «Siapkan materi berikutnya untuk kelas ini», tour «Menyediakan materi» | no change | T1 #497 · 3084; #452 · 3204; #1383 · 2823 | /mengajar/* | all actions (verb + object), which §5 allows (D9) | — (no change) | — |
| F20 | `/mengajar/[kelas]/siapa`: «Lihat murid yang belum mengumpulkan», «Lihat siapa yang sudah mengumpulkan» | no change | inventory §3.5 D10 | /mengajar/[kelas]/* | actions (D10) | — (no change) | — |
| F21 | `/mengajar/[kelas]/bukti`: «Lihat bukti»; tour step «Apa yang sudah bisa disimpulkan» | no change | inventory §3.5 D11 | /mengajar/[kelas] | action + heading (D11) | — (no change) | — |
| F22 | `/pimpinan/[simpul]/murid`, `/pendataan/[pekerjaan]` | no change | inventory §3.5 D17, D18 | — | consistent already | — (no change) | — |
| F23 | `/belajar/[tugas]/penguasaan`: «Mulai / Lanjutkan Uji Penguasaan», «Uji Penguasaan» (last-lesson button) | no change | inventory §3.5 D21, E9 | /belajar/* | already the dictionary's name | — (no change) | — |
| F24 | `/belajar/[tugas]/pelajaran/[pelajaran]`: «Lanjutkan pelajaran», «Mulai pelajaran», «Buka pelajarannya», «Pelajaran berikutnya / sebelumnya» | no change | inventory §3.5 D22 | /belajar/* | actions (D22) | — (no change) | — |
| F25 | «Beranda» for two places: `/belajar` and `/studio` | — | T1 #254 · 2372; #1113 · 2447 `studio.nav.beranda` | learner pages, Studio | §5 one name per destination, and here one name for two destinations (E3; A7) | Check (Yazid) | — |
| F26 | «Sertifikat» for two places: `/belajar/sertifikat` and `/studio/sertifikat` | — | T1 #14 · 1822; #1118 · 2453 | shells, Studio | as F25 (E2) | Check (Yazid) | — |
| F27 | «Uji Cepat» for two places: `/mengajar/[kelas]/uji-cepat` and `/studio/kuis` | — (the name itself stays, D-015) | T1 #367 · 3067; #1117 · 2455 | /mengajar/[kelas], Studio | as F25 (E1) | Check (Yazid) | D-015 |
| F28 | «Lihat seperti siswa» for two places (release outline, lesson preview) | word per C8; the two places — | T1 #1194 · 2483 | /studio/kanonik, /studio/paket/[course] | as F25 (E6) | Check (Yazid) | — |
| F29 | «Buka», «Kembali» for many places | plain «Kembali» where there is no ambiguity | inventory §3.5 E7 | various | §5 Back rule; ambiguity is decided case by case | Check (Yazid) | — |

Not listed: English-only differences (inventory §3.5 D19, D20, E5), since the proposal is about Indonesian. E4 «Umpan balik kelas» is an eyebrow/heading on two pages, not a navigation label. E8 «Keluar» is covered in section E.

---

## G. Kept on purpose (proposal §3 distinctions)

These look alike in inventory Table 2, but §3 keeps them apart. No row proposes merging them.

- **orang ≠ akun**
  - «Pendataan membuat catatan orang di sekolah ini. Pendataan tidak membuat akun, …» (T1 #831, hle.ts:1708).
  - «Orang ini mungkin sudah punya akun, …» (T1 #85, hle.ts:2713).
  - «Akun yang bisa masuk» (T1 #830).
- **materi ≠ Paket Pembelajaran**
  - Teacher: «Materi untuk kelas ini» (T1 #465, hle.ts:3070) and «…akan melihat materi ini di halaman Belajar mereka.» (#492).
  - Studio: «Paket Pembelajaran» (T1 #1123, hle.ts:2481).
- **hasil ≠ bukti**
  - «Hasilnya tercatat sebagai bukti pembelajaran…» (T1 #415, hle.ts:3155).
  - «Hasilnya menjadi bukti pembelajaran seperti asesmen lain.» (T1 #455, hle.ts:3207).
- **laporan ≠ ringkasan**
  - «Laporan» (section, T1 #914) beside «Ringkasan sekolah» (T1 #916).
  - «Templat laporan» (T1 #628) and the summary page «Ringkasan Sekolah» (T1 #611). Its key is `laporan.institusi.judul`, and keys do not change (D-014).
- **peran ≠ wewenang**
  - «Peran diberikan.» (T1 #55) vs «Langkah ini bukan wewenang Anda.» (T1 #35).
  - «Angka ini tidak ditampilkan untuk peran Anda.» (T1 #616).
- **simpan ≠ selesai**
  - «Simpan jawaban ini» → «Tersimpan» (T1 #227, #228, hle.ts:2335-2336) and «Simpan & Jeda» (#234).
  - Contrast «Selesaikan pemetaan» (#241) and «Kumpulkan» (#236).

Also kept, as look-alikes that are not the dictionary's concepts:
- «pengajaran» ("teaching"), «Pendidikan» ("education");
- «penerbit» (a certificate's issuer, T1 #319, #354);
- «bahan pertimbangan» / «bahan refleksi»;
- «Ini bukan ujian» and «Pemetaan Awal bukan ujian» (not a mode name);
- the six `role.*` labels.

---

## H. Not wording (out of scope of this list, noted only)

- **English that is never shown:** 203 rendered strings have an English telling that no screen displays, and 18 more are shown in English on some screens only. See the inventory's "What the evidence shows" and §1.2.10, and proposal §7.1. This is a rendering defect.
- **Objective codes on the teacher's evidence page:** the topic rows print codes such as `MTK5-P1`. See `src/app/mengajar/[kelas]/bukti/page.tsx:153` and `src/components/bukti/BarisKesiapan.tsx:37` (inventory §1.2.7, proposal §7.3).
- **UUID prefixes on screen:** `short()` on /studio/integritas (`integritas/page.tsx:56`) and the /studio home fallback (`studio/page.tsx:32,52`). There are also /konfigurasi fallbacks and the release option labelled by an id prefix on /studio/kanonik (`kanonik/page.tsx:91`) (inventory §1.2.7).
- **Other identifiers:**
  - enum values (`PRACTICE`, `ITEMS_AND_OPTIONS` …), metric ids, audit action codes;
  - the decision id «D-008» printed in the workbook guidance (`unggah-kontrak.ts:87`).
  - See inventory §1.2.7 and §1.2.4a.
- **English inconsistencies, counts only (inventory §2.1):**
  - learner: "student(s)" 46 vs "learner(s)" 30;
  - teacher: "teacher(s)" 20 vs "educator(s)" 10;
  - school: "school(s)" 115 vs "institution" 5.

---

## I. Open questions for Yazid (cases the dictionary does not decide)

1. **Workbook marks (A14–A21):** do «Pemetaan awal» / «Cek penguasaan» stay as the workbook's Kegunaan values (D-008), or do the template, the parser (`unggah-kontrak.ts:43`) and D-008 change together in a new D- entry? Filled workbooks, such as Lana's chapters (D-051), carry the current values.
2. **Short forms:** may «pemetaan» (A22–A23) and «paket» (D26–D37) stand alone where the context is obvious, as §2 allows for «Putaran»?
3. **Modes outside §4.1:** one name each for TEST («Penilaian» / «Tes»), EXAM («Ujian»), PRACTICE («Latihan») and PUBLIC_DEMO («Peragaan publik» / «Demonstrasi») (inventory §2.2)?
4. **Generic "assessment":** «penilaian» or «asesmen» («Aturan Penilaian», «penilaian resmi», «Selama asesmen…»)? Does «penilaian pertamanya» (T1 #622) mean PRE_TEST?
5. **Refusal role words:** which words for Studio's four roles (B5)? Is «Admin sekolah dan Admin platform» right for /aktivasi (B4)?
6. **Unnamed helpers:** is «yang mengurus PINTAR di sekolah Anda» (B12) a role to replace, or deliberate? The same question applies to «pengelola sekolah» on the error page learners also see (B11).
7. **Other role phrases:** «pengelola pertama sebuah sekolah» (B13), «pengelola institusi» (B14), and the evaluation personas and seed names (B15–B17, C31): are they in scope, and what do they become?
8. **Metric name «Peserta»** (C16): «Murid», or keep it for "participants"?
9. **«tingkat institusi»** (C28): which word avoids a clash with the structure unit «Tingkat»?
10. **Schema-health lines** (C15, D46): are they technical enough to keep?
11. **Orang vs akun** (C32, C33): «Akun Anda belum terhubung/dipasangkan dengan kelas»: keep, or name the person?
12. **«isi» as Studio content** (D48–D49): «materi», «Paket Pembelajaran», or keep? This includes the step names «Susun isi / Periksa isi / Setujui isi».
13. **JSON packages** (D38–D39): is a JSON «paket» a Paket Pembelajaran or a file format? «Paket Terstruktur» stays (D-007).
14. **Studio objects and «kursus»:** «Buka kursus» (D24), «Buku kerja sudah menjadi kursus, …» (D25), «menyusun materi» in Studio (D42), «Bahan Uji Cepat» (D43), «kurikulum sekolah / akademik» (D44–D45).
15. **Feedback questions** (E17): are they "conversational prompts" (keep «pertanyaan») or «soal»? And the Soal-sheet column «Pertanyaan» for the stem (E18)?
16. **«butir» → «soal» where «soal» also means "a matter of"** (E16).
17. **Bacaan** (E20–E22): is «Peta Bacaan» a map of readings, or of lessons? And «Posisi bacaan», «Bagian bacaan»?
18. **«bagian» meaning "part"** (E22–E29): what replaces it? The proposal says to avoid it but names no word.
19. **Management scope** (E30): «bagian sekolah» for the scope of a Kepala departemen (a Bagian) or a Dekan (the school): one word for both?
20. **/mengajar's name** (F7): «Kelas» (DAISY-03, also a D-006 word) or D-010's «Mengajar»?
21. **Home doors** (F3, F8, F9): the first-person doors on `/`: keep as sentences, or nouns per §5?
22. **Destination names** not fixed by D-010 or the dictionary:
    - `/belajar/sertifikat` (F12) and `/belajar/[tugas]` (F13);
    - `/studio/unggah` (F14) and `/studio/paket/[course]` (F15);
    - the start page `/` (F18);
    - labels shared by two places: «Beranda», «Sertifikat», «Uji Cepat», «Lihat seperti …» (F25–F28).
23. **«Program» as a visible field** (T1 #600, #804, #894), although D-006/D-027 hide PROGRAMME: this is outside the proposal. Should it be recorded for UI/UX POLISHED?
24. **Persona mismatch:** the Uji Cepat refusal on the educator's page ends with the staff wording (T1 #420, inventory §3.5 G). That is a persona question, not the dictionary.
