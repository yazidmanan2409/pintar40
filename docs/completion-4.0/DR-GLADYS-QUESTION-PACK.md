# PINTAR 4.0 · Questions for Dr Gladys, in one sitting (4 Nov 2026)

**Why this exists:** Daisy's design work is complete except where it waits on your words. Every open terminology question is here, in one place, with what is shown today, the options and a recommendation. You do not need the other documents to answer.

**How to answer:**
- Part A, the decisions: **one line each**, e.g. «A3: (a)».
- Part B, the new copy: **OK**, or your wording, per row.

Anything you leave blank stays as it is today. The approved terminology (Terminology v1) is kept unless a row says otherwise.

**Who decides:** each row is yours, except where it says «with the owner».

---

## Part A · Decisions

### A1 · The six context expressions (G1; D-132(m)): words for screens that exist but are blank today

PINTAR shows **nothing** today where these go; the code holds empty slots (`src/lib/istilah-menunggu.ts`).

| Slot | When it appears | Where |
|---|---|---|
| `context.manage_label` | the short name of the «managing» context (there is «Mengajar» and «Belajar», but no word for managing) | the context control, top of the navigation |
| `context.not_held` | someone is sent to the chooser because they do not hold the purpose they asked for | the chooser `/`, above the doors |
| `context.other_context` | the page asked for belongs to another of their contexts | the chooser `/` |
| `context.invalid` | the context they were in is no longer theirs | the chooser `/` |
| `context.other_school` | an action is refused because its target is in another school than the one they are working in | under the form that was refused |
| `context.choose_place` | the question when a purpose has several places (schools) | the chooser `/`, the heading over the doors |

**Please give six short Indonesian phrases** (and English if you wish). They must not blame the person and must not imply any authority. Suggestions, to accept or replace:

| Slot | Suggestion |
|---|---|
| `context.manage_label` | «Mengelola» |
| `context.not_held` | «Akun Anda tidak memegang pilihan itu. Pilih salah satu di bawah.» |
| `context.other_context` | «Halaman itu ada di tempat kerja Anda yang lain. Pilih tempatnya di bawah.» |
| `context.invalid` | «Tempat kerja itu sudah tidak berlaku untuk akun Anda. Pilih tempat lain.» |
| `context.other_school` | «Ini ada di sekolah lain. Pindah ke sekolah itu dulu lewat «Mau ke mana hari ini?».» |
| `context.choose_place` | «Di sekolah mana?» |

### A2 · Report labels at class and school level (G2; RV-9, W3.9)

The class card and the school card both show **«Peserta»** (learners assessed) and **«Kenaikan»** (average gain). The longer labels exist in the database:

| Key | Today (shown) | Longer label available |
|---|---|---|
| `metrik.peserta.label`, `metrik.peserta_institusi.label` | «Peserta» | «Murid yang dinilai di kelas ini» / «… di sekolah ini» |
| `metrik.kenaikan*.label` | «Kenaikan» | «Rata-rata kenaikan penguasaan di kelas ini» / «… di sekolah ini» |

Note that «Peserta» also means a professional-learning participant elsewhere.

| Option | Effect |
|---|---|
| (a) keep «Peserta» / «Kenaikan» | as approved today (D-157(a)) |
| (b) **the longer labels** (recommended) | no clash with professional-learning «peserta»; says which level |
| (c) your wording | |

### A3 · The heading of a teacher's evidence rows (UX-41)

The rows are now each named by their learning objective. The heading is **«Penguasaan per bagian»**.

| Option | |
|---|---|
| (a) keep «Penguasaan per bagian» | |
| (b) **«Penguasaan per tujuan pembelajaran»** (Daisy's DAISY-29 wording; recommended, it says what the rows are) | |

### A4 · The two report titles (G6; D-135(e))

They are blank slots in the design today, on screen and in the printed header.

| Report | Suggestion |
|---|---|
| the class report | «Ringkasan Kelas» (the current page name) |
| the school report | «Ringkasan Sekolah» |

Accept, or give the titles.

### A5 · «arah berpikir» in a teacher's hint (C3)

The Studio rule for hints («Petunjuk ini menyebut jawabannya. Tulis petunjuk yang mengarahkan cara berpikir.») reuses your learner-cycle term «arah berpikir».

| Option | |
|---|---|
| (a) **reuse it** (recommended: one name for one thing) | |
| (b) another phrase for teachers | |

### A6 · «paket», «kursus», «course» (X12; C9), **with the owner**

Terminology v1 already says the Studio object is «Paket Pembelajaran» (short form «paket»), and keeps «Kursus» for the workbook sheet. 46 strings still disagree. The full list is in `docs/completion-4.0/X12-TERMINOLOGY-PAKET.md`.

| # | Question | Recommendation |
|---|---|---|
| T1 | «Paket Pembelajaran» / «Learning Package» everywhere the Studio object is meant (42 keys) | confirm |
| T2 | the workbook sheet «Kursus» and its column «Judul kursus» | keep in this template version (renaming breaks every school's filled workbook unless the importer accepts both names) |
| T3 | template sentences: while the sheet is «Kursus», a sentence naming the sheet says «Kursus»; a sentence about the result says «paket» | confirm |
| T4 | the certificate list's column, today «Kursus» | «Paket Pembelajaran» |
| T5 | the professional-learning record's «Paket» | keep |

### A7 · The professional-learning footnote (C2)

On a professional-learning class's «Lihat bukti», the ordinary footnote is **false** («… sinyal integritas. Keduanya ditinjau Kepala departemen, bukan guru.»): professional-learning integrity signals are not shown to school leadership (D-069(c)).

| Option | |
|---|---|
| (a) **no footnote** on the professional-learning page (recommended: nothing there needs it) | |
| (b) your sentence | |

### A8 · The words for platform environments and the seed school (B1)

The current words collide with existing terms: «Pengembangan» is professional learning; «uji» is the assessments.

| Item | Today | Daisy's proposal |
|---|---|---|
| environment names (platform administrators only) | `development` / `staging` / `production` (raw English) | «Internal» / «Pra-produksi» / «Produksi» |
| the development seed school | «PINTAR Bootstrap (OFFICIAL evidence — development and CI only)» | «Sekolah Contoh PINTAR» |

OK, or your words.

### A9 · `auth.link_sent` (G5)

The approved sign-in message says «…tautan masuk sudah dikirim ke sana». PINTAR cannot confirm an email arrived (D-160(d)).

| Option | |
|---|---|
| (a) keep | |
| (b) **«…tautan masuk sudah kami serahkan ke server email untuk alamat itu.»** (recommended: claims only what is known) | |

### A10 · The identity emails' context line

In the card email: «Akun PINTAR Anda di {sekolah}.» But a PINTAR ID belongs to the person, not the school.

| Option | |
|---|---|
| (a) keep | |
| (b) **«Peran Anda tercatat di {sekolah}.»** (recommended: states where the roles are, not that the account belongs there) | |
| (c) your wording | |

---

## Part B · New copy to approve: OK, or your wording

**Presentation words Daisy proposed in accepted designs.** The owner has accepted each design; the words wait for you.

| # | Key | Indonesian | English | Where |
|---|---|---|---|---|
| B1 | `studio.langkah.terbit.nanti` | Paket ini terbit setelah langkah Terbitkan. | This package is published after the Publish step. | Studio step list |
| B2 | (B9) | Versi pertama · belum terbit | First version · not yet published | Studio versions |
| B3 | (B11) | Temuan ditinjau oleh orang kedua, bukan oleh penyusun paket. | Findings are reviewed by a second person, not by the package's author. | Studio findings, author only |
| B4 | A2 | Rata-rata nilai kelas | Class average score | Uji Cepat result (accepted, D-170) |
| B5 | `ketiadaan.jumlah.peserta` | Sekarang {have} peserta; perlu {needed}. | {have} participants so far; {needed} needed. | every professional-learning «not yet» line |
| B6 | `koleksi.menampilkan_tanpa_total` | Menampilkan {dari}–{sampai} {benda} | Showing {dari}–{sampai} {benda} | long lists without a total |
| B7 | `alasan.nonaktif.jawab` (E3) | Pilih satu jawaban dulu. | Choose one answer first. (shown today; this pack earlier said «Choose an answer first.»: confirm one) | a learner's disabled button |
| B8 | `alasan.nonaktif.periksa` (E3) | Pilih buku kerja dulu. | Choose a workbook first. | Studio upload |
| B9 | `pengembangan.pelajaran_dari` | {n} dari {m} | {n} of {m} | professional-learning record |
| B10 | `pengembangan.ditolak` | Catatan ini untuk fasilitator, Kepala departemen, Dekan, dan Admin sekolah tempat ini. | This record is for the facilitator, the Head of department, the Dean and the school administrator of this place. | the record's refusal |
| B11 | `mengajar.bukti.siapa_peserta` | Lihat nama peserta | See the participants' names | professional-learning «Lihat bukti» |
| B12 | `mengajar.bukti.pd.arti` | Kelas pengembangan profesi tidak menghasilkan angka akademik kelas. Kemajuan dan hasil setiap peserta tercatat di Catatan pengembangan profesi. | A professional-learning class produces no academic class figure. Each participant's progress and result is in the professional-learning record. | professional-learning «Lihat bukti» |
| B13 | `mengajar.bukti.pd.buka` | Buka catatan pengembangan profesi | Open the professional-learning record | as above |
| B14 | `lapor.triase.arti_platform` (B1) | Laporan dari staf semua sekolah, yang menghentikan kelas lebih dahulu. Sekolah menyelesaikan yang dapat diselesaikannya; tim PINTAR menindaklanjuti sisanya. | Reports from the staff of every school, those stopping a class first. Each school resolves what it can; the PINTAR team follows up the rest. | Konfigurasi, «Seluruh platform» only |

**Words engineering wrote, never reviewed (G4).** Please read them on the screens or in `src/lib/hle.ts` by key prefix. Say «OK» per group, or mark the strings to change:

| # | Group | Keys |
|---|---|---|
| B15 | certificate revocation and management | `sertifikat.kelola.*`, `sertifikat.cabut.*`, `tolak.kembali_sertifikat` |
| B16 | integrity review | `studio.integritas.*` |
| B17 | report coverage lines | `laporan.cakupan.*` |
| B18 | a teacher's per-learner page | `mengajar.murid1.tujuan*` |
| B19 | missing lesson media | `lesson.media.tidak_ada*` |
| B20 | the activation waiting list | `aktivasi.tunggu.*` |
| B21 | Batch 6 | `sertifikat.berkas`, the English «has met the mastery standard in» (`sertifikat.diberikan`), `akun.kartu.depan` / `.belakang`, and the email-status words (`emailuji.r.hasil.*`, `emailuji.r.arti`, `aktifkan.w_kartu_terkirim`, `akun.terkirim`, `emailuji.terkirim`) |

**Words added during the D-177 corrections (4 Nov), implemented as proposed and waiting for you:** OK, or your wording, per row.

| # | Key | Indonesian | English | Where |
|---|---|---|---|---|
| B22 | `kembali.riwayat` | Kembali ke halaman sebelumnya | Back to the previous page | a way back that returns to wherever the reader came from (the reports, «Laporkan masalah») |
| B23 | `koleksi.posisi.terbuka` | Halaman {n} | Page {n} | a long list's pager when its total is not counted (with B6) |
| B24 | `koleksi.benda.*` | laporan · jadwal pemeliharaan · pengumuman · sekolah · perpindahan · peran · catatan · pengerjaan ditinjau · definisi asesmen | reports · maintenance windows · notices · schools · transfers · roles · entries · reviewed sittings · assessment definitions | the noun in each pager's count line |
| B25 | `laporan.metrik.tanpa_nama` | Ukuran ini belum punya nama | This measure has no name yet | a report figure whose name the copy table lacks |
| B26 | `studio.soal.miskonsepsi` | Pemahaman keliru | Misunderstanding | an option's misconception, in the reviewer's question list |
| B27 | `pendataan.buka.gagal` | Berkas itu belum bisa dibuka sebagai pendataan. Periksa isinya, lalu coba lagi. | That file could not be opened as an intake. Check its contents, then try again. | Pendataan, under the file form |

### Part B, added by the retrospective (4 Nov; D-178): words the audit built or changed

| # | Key | Indonesian | English | Where |
|---|---|---|---|---|
| B28 | `studio.soal.ringkas` · `.pelajaran_label` · `.pelajaran_dari` · `.posisi` · `.buka` · `.bacaan` · `.gagal` · `.pager_label` | «{soal} soal dalam {pelajaran} pelajaran» · «Pelajaran» · «Pelajaran {i} dari {n}» · «Soal {i} dari {n}» · «Buka» · «Bacaan» · «PINTAR belum bisa membuka soal paket ini. Muat ulang halaman ini; jika tetap gagal, hubungi admin sekolah Anda.» · «Pelajaran dalam paket ini» | «{soal} questions in {pelajaran} lessons» · «Lesson» · «Lesson {i} of {n}» · «Question {i} of {n}» · «Open» · «Reading passage» · «PINTAR couldn't open this package's questions. …» · «Lessons in this package» | Studio's question review (Daisy's A1, built in the retrospective, R3-1). The words are Daisy's A1 table; the pager uses the one pager's «Sebelumnya» / «Berikutnya» (X-KONSISTENSI K6) |
| B29 | `config.refused` (E-B1-2) | Halaman ini hanya untuk Admin sekolah atau Admin platform. | This page is for school administrators and platform administrators only. | Konfigurasi's refusal. The two languages now say the same thing |
| B30 | the optional field's mark, one word (A4 C3/D7, R3-2) | «(opsional)» everywhere. It replaces «(tidak wajib)» on /lapor's screenshot, «(pilihan)» on the maintenance message, «(boleh kosong)» on Studio's note, and two inline «(opsional)» | «(optional)» | every optional field. Daisy's rule, accepted in A4; confirm the word |
| B31 | `aktivasi.staf.arti` (R4-7) | (unchanged) | «… They stay the same person: the same school registration number, classes and all their learning stay. …» (was «their PINTAR ID») | Aktivasi. The English now names the identifier the Indonesian names (B2) |

### Part B, found missing while preparing the K1–K7 pack (4 Nov)

| # | Key | Indonesian | English | Where |
|---|---|---|---|---|
| B32 | `config.kelompok.*` | Sekolah dan tahun ajaran · Murid · Staf dan akses · Laporan dan templat · Dukungan | School and school year · Students · Staff and access · Reports and templates · Support | the group names in the staff navigation and Konfigurasi |
| B33 | `config.pemeliharaan.tabrakan.*` | «Perhatian.» · «{n} asesmen dijadwalkan berlangsung selama periode ini.» · «Asesmen terakhir diperkirakan selesai …» · «Pertimbangkan memulai pemeliharaan setelah …» · «Tidak ada asesmen yang dijadwalkan selama periode ini.» | «Please note.» · «{n} assessments are scheduled to run during this period.» · «The last assessment is expected to finish on …» · «Consider starting maintenance after …» · «No assessment is scheduled during this period.» | scheduling maintenance over assessments (H19) |
| B34 | `mengajar.cepat.hasil.belum` | Belum ada nilai. Rata-rata nilai kelas muncul di sini setelah ada yang mengumpulkan. | today «… The class average appears here …»; proposed «The class average score appears here once someone has handed in.», to match B4 (minor finding 1, `04-REKONSILIASI-BALIK.md` §7) | Uji Cepat result, before any score |
| B35 | `mengajar.sedia.kode.assign_exposed_content` (D-183, added 4 Nov) | Soal Pemetaan Awal dan Cek penguasaan pelajaran ini pernah terbuka untuk umum, jadi tidak dapat dipakai sebagai penilaian di sekolah. Gunakan versi pelajaran yang soalnya sudah diganti. | This lesson's Pemetaan Awal and Cek penguasaan questions were once made public, so they cannot be used as an assessment in a school. Use a version of the lesson whose questions have been replaced. | Siapkan, when a teacher gives a class an exposed chapter |
| B36 | `evaluasi.akun_tidak_ada` (W6.10 J1.8, added 5 Nov) | Halaman akun tidak tersedia dalam MODE PERAGAAN. Sudut pandang peragaan tidak punya akun, PIN, atau PINTAR ID sendiri. | The account page is not available in DEMONSTRATION MODE. A demonstration point of view has no account, PIN or PINTAR ID of its own. | Mode Peragaan, when a persona opens /akun |
| B37 | `emailuji.alasan.ditahan_uji` (P-2, added 5 Nov) | Tidak dikirim: di luar PINTAR produksi, email hanya dikirim ke alamat milik PINTAR atau alamat uji. | Not sent: outside production PINTAR, email goes only to PINTAR's own addresses or test addresses. | Konfigurasi › Kirim email uji, platform administrator only, never on production |
| B38 | `config.cari_orang.*` (W2.17, added 5 Nov) | «Cari orang menurut nama» · «Cari orang» · «Daftar di bawah memuat paling banyak 50 orang: yang terbaru terdaftar, atau yang namanya cocok dengan pencarian.» | «Find a person by name» · «Find the person» · «The list below holds at most 50 people: the most recently enrolled, or those whose name matches the search.» | Konfigurasi › Pindah sekolah and › Peran dan akses, above the people picker |
| B39 | `cycle.none`, `siklus.habis.isi`, `tur.nt.1.*`, `tur.sm.1.*`, `studio.kanonik.penjelasan`, `studio.kanonik.hanya_baca` (W2.14, added 5 Nov) | «Belum ada materi yang **disediakan** untuk Anda.» · «Semua yang disediakan untuk Anda sudah selesai…» · tour: «Semua yang disediakan untuk Anda ada di sini…» · Studio: «Bisa disediakan untuk kelas, tidak bisa disunting.» · «Hanya dapat dibaca dan disediakan untuk kelas.» (was «ditugaskan») | «made available to you / to classes» (was «assigned») | the learner home and tour, the Studio canonical library; one verb with Siapkan → Sediakan (UX-19). Staff placement keeps «ditugaskan / menugaskan» |

Already settled, nothing to answer: the school registration number («Nomor Registrasi Sekolah», D-174 / D-175), and «PINTAR ID» as the identifier's name.

---

## What your answers unblock

| Answers | Unblocks |
|---|---|
| A1 | the chooser and the navigation's final closure (E1 + E2), and Gate 2 |
| A2, A3, A4 | the report pages' final terminology (C1), and Gate 2 |
| A5, A6 | the Studio words (A4) and the application-wide terminology fix (X12) |
| A7, A10 | the professional-learning page (C2) and the identity emails (D1) |
| A8, A9 | Konfigurasi's platform view (B1) and the sign-in message |
| Part B | every new word in the accepted designs, and E4, Daisy's last open item; B28–B31 the words the retrospective built or changed; B32–B34 the keys found missing from this pack; B35 the exposure refusal (D-183); B36 the demonstration-mode account refusal (W6.10 J1.8); B37 the test-email hold outside production (P-2); B38 the people search above Konfigurasi's pickers (W2.17); B39 one verb for giving a package to a class (W2.14) |

**Gate 2 (Terminology final, G:81) needs every A and B answered.** A placeholder left anywhere is a NO-GO.
