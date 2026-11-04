# X12 · «paket», «kursus», «course»: the consolidated terminology decision (for Dr Gladys and the owner) · 4 Nov 2026

**Authority:** owner, 4 Nov, D-171(c). **Research and writing only:** nothing is renamed, no sheet, database identifier or school file is touched.

**The approved term:** **Paket Pembelajaran** / **Learning Package** (Terminology v1, `docs/coordination/ux/TERMINOLOGY-V1-FREEZE-PACKAGE.md`; `studio.paket.judul`).

## 1. What was swept

| Source | What reaches people | Hits |
|---|---|---|
| The copy table (`src/lib/hle.ts`, Indonesian and English) | every screen, email, report, certificate and PDF name | **85 keys** (Appendix) |
| The workbook's own words (`src/lib/unggah-kontrak.ts`, `src/components/unggah/templat.ts`, `src/lib/contoh-buku-kerja.ts`) | the downloaded template: the sheet «Kursus», the column «Judul kursus» and its note «Nama kursus seperti yang dilihat guru dan murid.» | the sheet name and one column |
| Text the database writes | assessment titles «Pemetaan awal — ‹title›», «Cek penguasaan — ‹title›»; the finding place «Bank soal untuk paket ini» | none wrong (W4.1 already moved «kursus» → «paket», `20261211100000`) |
| The identity emails | — | **0** |
| Reports (Ringkasan, Pimpinan) | — | **0** |
| Learner pages and the public verification page | — | **0** |
| The certificate's PDF name | «Sertifikat Penguasaan · ‹the package's title›» | **no term in the visible text**; `{kursus}` is the placeholder's internal name |

**Not user-facing, and not to be renamed:** the database's `courses`, `course_id`, `plp_releases`; the problem codes (`WORKBOOK_COURSE_ROW_MISSING`, …); the copy keys' own names (`studio.unggah.buka_kursus`, …); TypeScript names (`judulKursus`, `bukuKerjaKePaket`); fixture file names (`*.paket.json`).

## 2. Which words name the same thing, and which are genuinely different

| # | Concept | Approved word (Terminology v1) | Where | Same entity as 1? |
|---|---|---|---|---|
| 1 | **The Studio object:** one authored package with its chapters, lessons and questions, its review, releases and revisions (`courses` and its lineage) | **Paket Pembelajaran**, short form **paket** (ruling 2); English **Learning Package** / **package** | Studio, Konfigurasi «Yang menunggu», Uji Cepat sources, Pustaka PINTAR | — |
| 2 | **The workbook's course sheet and the import structure** | **Kursus** (ruling 14: «the sheet, the import structure, «Buka kursus» right after import») | the template, its checks, the upload counts | **Describes 1** (one row = one package) but is a *file format's* name, kept on purpose |
| 3 | **The JSON format** | **paket JSON**, **Paket Terstruktur** (ruling 13: a format, not the Studio object) | Studio › Unggah | a different concept: a file format |
| 4 | **The package assigned to a professional-learning participant** | «paket» today | the PD record (`pengembangan.*`) | **Same as 1** (the package title per participant) |
| 5 | **What a certificate certifies** | «Kursus» today | Konfigurasi › Sertifikat, the list's column | **Same as 1** (the mastered package's title) |
| 6 | **Learning material, as a teacher gives it to a class** | **Materi** (Terminology v1) | Siapkan, «Materi disediakan», «Materi Uji Cepat» | the same package seen from the class; Terminology v1 keeps «Materi» there, distinct from «Paket Pembelajaran» |

## 3. The findings

| Group | Keys | Finding | Under the existing rulings |
|---|---|---|---|
| 1 · compliant | 19 | «paket» / «Paket Pembelajaran», English «package» / «Learning Package» | nothing to do |
| **2 · Indonesian right, English «course»** | **38** | e.g. «Perbaiki paket ini» / «Correct this course»; «Paket ini belum disetujui…» / «This course has not been approved yet…» | **residue of ruling 2:** the English must say «package» / «Learning Package». A4 corrected six of these (the send-back); the other 32 are the same defect |
| **3 · «kursus» for the Studio object** | **4** | «Paket ini tidak berisi kursus.»; «Kursus yang mau diperbaiki tidak ada di sekolah ini.»; «Kursus ini sudah pernah diperbaiki…»; «Kursus asli dan semua catatan murid tetap utuh…» | **residue of ruling 2** (retired word for the Studio object) |
| 4 · workbook structure | 9, plus the template's sheet and column | «Lembar Kursus …», «Satu buku kerja berisi satu kursus…», «Judul kursus», the upload count «Kursus» | **kept by ruling 14.** A4 (Daisy) proposes «Satu buku kerja berisi satu paket» for the template sentence; that, and the sheet name itself, is **C9** |
| 5 · format | 10 | «paket JSON», «Paket Terstruktur» | kept by ruling 13 |
| 6 · certificate | 2 | the column «Kursus» / «Course»; the PDF name (no term) | **open:** ruling 2 retires «kursus» for the Studio object, and this is the same entity |
| 7 · PD record | 3 | «Paket» per participant | consistent with ruling 2; **open:** whether a staff record says «Paket» or «Materi» (row 6) |

**One conflict inside the existing wording:** ruling 14 keeps «Buku kerja sudah menjadi kursus, bab…», but the copy table now says «Buku kerja sudah menjadi paket: bab, pelajaran, dan soal.» (`studio.langkah.susun.arti`). One of the two is to be confirmed.

## 4. The decision asked of Dr Gladys and the owner (one decision, five points)

| # | Point | Recommendation | Alternatives |
|---|---|---|---|
| T1 | **The Studio object, everywhere it is meant:** «Paket Pembelajaran» / «paket»; English «Learning Package» / «package» (groups 2 and 3: 42 keys) | **Confirm** (it applies ruling 2; no new word) | — |
| T2 | **The workbook sheet «Kursus» and its column «Judul kursus»** | **Keep in this template version** (ruling 14): every school's template and filled workbook keeps importing; change only with a versioned template (§5) | rename to «Paket» with the next template version, under §5 |
| T3 | **The template's sentences about the sheet** (C9; A4's proposal «Satu buku kerja berisi satu paket»; the «…menjadi paket / kursus» conflict) | follow T2: while the sheet is «Kursus», a sentence that names the sheet says «Kursus»; a sentence about the result says «paket» («Buku kerja sudah menjadi paket…» stays) | name the sheet and the object alike |
| T4 | **The certificate list's column** (Konfigurasi › Sertifikat) | «Paket Pembelajaran» / «Learning Package» (same entity, ruling 2) | «Materi»; keep «Kursus» as an exception |
| T5 | **The PD record's «Paket»** | keep «Paket» (same entity; the record is read by staff) | «Materi» |

C3 (A4's «arah berpikir» in a teacher's hint) is separate and stays Dr Gladys's.

## 5. If the workbook's names ever change (T2's alternative): what it would take

- **Template versioning:** the template has **no version marker today**. A version cell (for example on the Kursus sheet's header row, or a hidden sheet) is added first, in a template version of its own.
- **Import compatibility:** the importer finds sheets by name (`kunciJudul`, `src/lib/unggah-kontrak.ts:274`). A renamed sheet makes every existing workbook fail (`WORKBOOK_SHEET_MISSING`). So the importer would accept **both** names, the old and the new, for at least the life of every template already given to schools.
- **Regression tests over existing templates:**
  - every template PINTAR has handed out (the current «Unduh contoh isian» and any earlier one in the repository's history) still imports, with the same counts;
  - the fixtures (`audit/fixtures/*.paket.json`, `selftest/fixtures/bob02/…`) still import;
  - a workbook with the new name imports to the same package;
  - a workbook with neither name is refused with `WORKBOOK_SHEET_MISSING`, naming both.
- **Existing school files are never edited.**

## 6. Once decided: how it is applied (not authorised now)

- **One change set** over the keys the decision names (the Appendix lists them by group), in both languages, and nothing else.
- **One focused cross-feature regression check** (D-168): a static test over the rendered copy table, the workbook's headings and the database-written titles. It refuses «kursus» / «course» for the Studio object outside an allow-list of the workbook-structure keys (group 4) and the format keys (group 5). The allow-list is the decision itself, so a later string cannot drift back.
- The existing copy guards stay green (every key in the table; no internal word; DAISY-04).

## Appendix · the 85 keys, by group

### Group 1 · compliant (19 keys)

| Key | Indonesian | English |
|---|---|---|
| `studio.soal.judul` | Soal dalam paket ini | The questions in this package |
| `studio.soal.kosong` | Paket ini belum berisi soal. | This package has no questions yet. |
| `config.menunggu.studio` | paket menunggu tindakan atau tinjauan Anda di Studio | packages waiting for your action or review in Studio |
| `studio.paket.masalah.package_too_large` | Paket ini terlalu besar untuk sekali unggah. | This package is too large for one upload. |
| `studio.paket.masalah.package_could_not_be_saved` | Paket ini belum bisa disimpan. Coba lagi, atau hubungi Admin platform. | This package could not be saved. Try again, or contact the platform administrator. |
| `studio.paket.masalah.lain` | Ada bagian paket yang belum bisa diterima. | Part of the package cannot be accepted yet. |
| `studio.paket.kode.package_has_problems` | Paket ini belum bisa diterima. Perbaiki baris yang disebut lalu unggah lagi. | This package cannot be accepted yet. Fix the rows listed and upload again. |
| `studio.nav.unggah` | Buat Paket | Create a package |
| `studio.kuis.sumber_sekolah` | Paket sekolah Anda | Your school's packages |
| `studio.kuis.bab_kosong` | Belum ada bab yang bisa dipakai untuk Uji Cepat. Buat paket sekolah Anda, atau tunggu bab Pustaka PINTAR dibuka untuk sekolah Anda. | No chapter is available for a Quick Assessment yet. Create your school's package, or wait for a PINTAR Library chapter to be opened to your school. |
| `studio.paket.judul` | Paket Pembelajaran | Learning Package |
| `studio.paket.kunci_peringatan` | Setelah dikunci, isi paket ini tidak dapat diubah lagi. Perbaikan berikutnya dibuat sebagai salinan baru. | Once locked, this package's content cannot be changed again. A later correction is made as a new copy. |
| `studio.paket.kosong` | Belum ada paket di sini. | There is nothing here yet. |
| `studio.unggah.judul` | Buat Paket Pembelajaran | Create a Learning Package |
| `studio.kanonik.penjelasan` | Paket yang disusun PINTAR dan diizinkan untuk sekolah Anda. Bisa ditugaskan, tidak bisa disunting. | Packages PINTAR wrote and opened to your school. They can be assigned; they cannot be edited. |
| `studio.kanonik.kosong` | Belum ada paket PINTAR yang diizinkan untuk sekolah Anda. | No PINTAR package has been opened to your school yet. |
| `studio.kanonik.ditarik` | Izin untuk paket ini sudah berakhir. Murid yang sedang mengerjakan tetap bisa menyelesaikannya; pengerjaan baru tidak dibuka lagi. | The permission for this package has ended. Students already working on it can finish; no new attempt opens. |
| `studio.bank.intro` | Soal-soal di bank sekolah Anda. Angka dari pengerjaan murid baru muncul setelah cukup murid menjawab sebuah soal; bila angka itu menandai soal, peninjau mencatat keputusannya di sini. Untuk mengubah soal, unggah buku kerja yang sudah diperbaiki di Buat Paket. | The questions in your school's bank. Figures from student work appear only once enough students have answered a question; when they flag one, a reviewer records the decision here. To change a question, upload a corrected workbook in Create a package. |
| `galat.draft_created` | Paket dibuat. | Package created. |

### Group 2 · Indonesian right, English «course» (38 keys)

| Key | Indonesian | English |
|---|---|---|
| `studio.paket.masalah.revision_not_released` | Paket yang mau diperbaiki belum dikunci. Hanya paket yang sudah dikunci yang diperbaiki dengan cara ini. | The course being corrected has not been locked. Only a locked course is corrected this way. |
| `studio.paket.kode.package_not_allowed` | Anda tidak berwenang menyusun paket di sekolah ini. | You are not allowed to author courses in this school. |
| `studio.paket.kode.package_school_not_allowed` | Pilih sekolah. Unggahan menjadi Paket Pembelajaran sekolah, bukan pustaka platform. | Choose a school. An upload becomes a school's course, not the platform library. |
| `studio.terbitan.kode.release_school_not_allowed` | Terbitan dibuat dari Paket Pembelajaran sekolah, bukan dari pustaka nasional. | A release is made from a school's course, not from the national library. |
| `studio.terbitan.kode.release_course_not_approved` | Paket ini belum disetujui. Terbitan dibuat dari paket yang sudah disetujui. | This course has not been approved yet. A release is made from an approved course. |
| `studio.terbitan.kode.release_exists` | Paket ini sudah punya terbitan. Untuk koreksi, buat revisi paket. | This course already has a release. To correct it, create a revision of the course. |
| `studio.terbitan.kode.release_same_person` | Penyusun paket tidak bisa mengunci terbitannya sendiri. Minta rekan yang lain. | The author of a course cannot lock its own release. Ask a colleague. |
| `studio.terbitan.kode.release_not_ready` | Paket ini belum siap terbit. Selesaikan temuan yang tercantum di halaman ini. | This course is not ready to publish. Resolve the findings listed on this page. |
| `studio.terbitan.kode.release_input_invalid` | Terbitan atau paket tidak dikenali. | The release or course was not recognised. |
| `studio.langkah.bukan_penyusun` | bukan penyusun paket ini | not this course's author |
| `studio.langkah.tunggu.penyusun` | Anda menyusun paket ini, jadi langkah ini diambil orang kedua. Minta rekan yang disebut di atas. | You wrote this course, so a second person takes this step. Ask a colleague named above. |
| `studio.hambatan.readiness_no_release` | Paket ini belum memiliki terbitan: mulai dari langkah Buat terbitan. | This course has no release yet: start at Create the release. |
| `studio.hambatan.readiness_not_sealed` | Isi paket belum dikunci pada langkah Kunci terbitan. Setelah dikunci, isinya tidak dapat diubah lagi. | The course content is not locked yet at Lock the release. Once locked, it cannot be changed. |
| `studio.langkah.susun.arti` | Buku kerja sudah menjadi paket: bab, pelajaran, dan soal. Lihat seperti murid untuk memeriksa tampilannya, lalu tandai sudah tersusun. | The workbook has become a course with chapters, lessons and questions. See it as a student to check how it looks, then mark it as put together. |
| `studio.langkah.ajukan.arti` | Kirim paket ini kepada rekan yang boleh menyetujuinya. Persetujuannya harus dari orang lain, bukan dari penyusun. | Send this course to a colleague who may approve it. The approval must come from someone other than its author. |
| `studio.langkah.buat.arti` | Terbitan adalah versi Paket Pembelajaran yang nanti dipakai murid. Terbitan dibuat dari paket yang sudah disetujui. | A release is the version of the course that students will use. It is made from an approved course. |
| `studio.langkah.terbit.nanti` | Paket ini terbit setelah langkah 7. | This course is published after step 7. |
| `studio.langkah.ditarik.arti` | Terbitan ini sudah ditarik dari peredaran. Untuk memperbaikinya, buat salinan paket di bawah. | This release has been withdrawn from circulation. To correct it, make a copy of the course below. |
| `studio.paket.revisi` | Perbaiki paket ini | Correct this course |
| `studio.paket.revisi_terbaru` | Paket ini sudah diperbaiki. Buka perbaikannya; materi baru untuk kelas memakai perbaikan itu | This course has been corrected. Open the correction; new learning for classes uses it |
| `studio.paket.revisi_penjelasan` | Perbaiki buku kerjanya, lalu unggah sebagai perbaikan paket ini. Paket asli tetap utuh beserta seluruh catatan pengerjaan murid; perbaikan menjadi versi berikutnya, ditinjau dan diterbitkan seperti biasa. | Correct the workbook, then upload it as a correction of this course. The original stays whole, with every record of student work; the correction becomes the next version, reviewed and published as usual. |
| `studio.unggah.revisi` | Perbaikan dari paket yang sudah ada? | A correction of an existing course? |
| `studio.unggah.revisi_bukan` | Bukan, ini paket baru | No, this is a new course |
| `studio.unggah.ringkasan_arti` | Dicatat di riwayat perbaikan paket, dengan nama Anda dan tanggalnya. | Kept in the course's correction history, with your name and the date. |
| `studio.unggah.buka_kursus` | Buka paket | Open the course |
| `galat.step_taken` | Paket ini maju ke langkah berikutnya. | This course has moved on to its next step. |
| `galat.revision_created` | Salinan baru paket ini dibuat, dan Anda sekarang melihatnya. | A new copy of this course was made, and you are now looking at it. |
| `studio.konten.kode.content_transition_invalid` | Paket ini sudah tidak berada di langkah itu, mungkin karena rekan baru saja mengambilnya. Muat ulang halaman untuk melihat langkah yang berlaku sekarang. | This course is no longer at that step, perhaps because a colleague has just taken it. Reload the page to see the current step. |
| `studio.konten.kode.content_author_unknown` | PINTAR tidak tahu siapa penyusun paket ini, jadi tidak dapat memastikan bahwa persetujuannya dari orang lain. Sampaikan kepada yang mengurus PINTAR di sekolah Anda. | PINTAR does not know who wrote this course, so it cannot confirm that the approval comes from someone else. Tell whoever looks after PINTAR at your school. |
| `studio.konten.kode.content_reviewer_is_author` | Anda menyusun paket ini, jadi persetujuannya harus dari orang lain. Minta rekan yang disebut di langkah Setujui isi. | You wrote this course, so the approval must come from someone else. Ask a colleague named at the Approve the content step. |
| `studio.konten.kode.content_author_immutable` | Penyusun paket tidak dapat diganti. | A course\u2019s author cannot be changed. |
| `studio.kembali.judul` | Kembalikan paket ini ke penyusun? | Send this course back to its author? |
| `studio.kembali.arti` | Paket kembali ke langkah Susun isi. Penyusun membaca alasan Anda, memperbaikinya, lalu mengajukannya lagi untuk ditinjau. Alasan dan nama Anda tercatat di Riwayat perbaikan. | The course goes back to the Put the content together step. Its author reads your reason, corrects it, and sends it for review again. Your reason and your name are kept in the Correction history. |
| `studio.kembali.jalan_unggah` | Isi diperbaiki di buku kerjanya: unggah buku kerja perbaikan, dan perbaikannya menjadi versi berikutnya dari paket ini. Bila isinya tidak perlu diubah, tandai sudah tersusun lagi lalu ajukan kembali. | The content is corrected in its workbook: upload the corrected workbook, and the correction becomes this course\u2019s next version. If nothing in the content needs to change, mark it as put together again and send it for review again. |
| `galat.sent_back` | Paket ini dikembalikan ke penyusun beserta alasan Anda. | This course was sent back to its author with your reason. |
| `galat.sendback_not_reviewer` | Mengembalikan paket ke penyusun bukan wewenang Anda di sekolah ini. | Sending a course back to its author is not yours to do in this school. |
| `galat.sendback_not_in_review` | Paket ini sudah tidak berada di langkah Setujui isi, mungkin karena rekan baru saja mengambilnya. Muat ulang halaman untuk melihat langkah yang berlaku sekarang. | This course is no longer at the Approve the content step, perhaps because a colleague has just taken it. Reload the page to see the step it is at now. |
| `galat.sendback_reviewer_is_author` | Anda menyusun paket ini, jadi yang mengembalikannya harus orang lain. | You wrote this course, so someone else sends it back. |

### Group 3 · «kursus» for the Studio object (ruling-2 residue) (4 keys)

| Key | Indonesian | English |
|---|---|---|
| `studio.paket.masalah.package_empty` | Paket ini tidak berisi kursus. | This package contains no course. |
| `studio.paket.masalah.revision_course_unknown` | Kursus yang mau diperbaiki tidak ada di sekolah ini. | The course being corrected is not in this school. |
| `studio.paket.masalah.revision_not_latest` | Kursus ini sudah pernah diperbaiki. Pilih versi terbarunya. | This course has already been corrected. Choose its newest version. |
| `studio.unggah.revisi_arti` | Kursus asli dan semua catatan murid tetap utuh. Perbaikan menjadi versi berikutnya, ditinjau dan diterbitkan seperti biasa; setelah terbit, materi baru untuk kelas memakai versi itu. | The original course and every student record stay whole. The correction becomes the next version, reviewed and published as usual; once published, new learning for classes uses it. |

### Group 4 · workbook structure (ruling 14) (9 keys)

| Key | Indonesian | English |
|---|---|---|
| `studio.paket.masalah.workbook_course_row_missing` | Lembar Kursus belum berisi baris data. | The Kursus sheet has no data row. |
| `studio.paket.masalah.workbook_course_rows_many` | Satu buku kerja untuk satu kursus: lembar Kursus hanya boleh satu baris. | One workbook is one course: the Kursus sheet may have only one row. |
| `studio.paket.masalah.course_title_missing` | Judul kursus belum diisi. | The course title is empty. |
| `studio.paket.masalah.course_context_unknown` | Konteks kursus tidak dikenal. | The course context is not recognised. |
| `studio.paket.masalah.revision_one_course` | Buku kerja perbaikan berisi tepat satu kursus. | A corrected workbook holds exactly one course. |
| `studio.templat.cara.1` | Satu buku kerja berisi satu kursus. Isi lima lembar berikutnya: Kursus, Bab, Pelajaran, Soal, dan Pilihan. | One workbook holds one course. Fill in the next five sheets: Kursus, Bab, Pelajaran, Soal and Pilihan. |
| `studio.templat.batas.kursus` | Kursus | Courses |
| `studio.templat.satu_kursus` | Satu kursus per buku kerja: satu baris data di lembar Kursus. | One course per workbook: one data row on the Kursus sheet. |
| `studio.unggah.hitung.courses` | Kursus | Courses |

### Group 5 · format (ruling 13) (10 keys)

| Key | Indonesian | English |
|---|---|---|
| `studio.paket.masalah.package_json_unreadable` | Isi paket tidak terbaca sebagai JSON. | The package cannot be read as JSON. |
| `studio.paket.masalah.package_shape_invalid` | Bagian paket ini tidak berbentuk yang diharapkan. | This part of the package is not in the expected shape. |
| `studio.unggah.mudah_penjelasan` | Tempel paket JSON dari sistem lain. PINTAR memeriksanya dan menanyakan yang belum pasti sebelum menyimpan apa pun. | Paste a JSON package from another system. PINTAR checks it and asks about anything unclear before it saves anything. |
| `studio.unggah.terstruktur` | Paket Terstruktur | Structured package |
| `studio.unggah.terstruktur_penjelasan` | Untuk paket yang sudah dibuat mesin dalam format baku. | For packages a machine has already produced in a standard format. |
| `studio.unggah.json_judul` | Untuk sistem lain: paket JSON | For other systems: JSON packages |
| `studio.unggah.json_arti` | Untuk paket yang dibuat sistem lain. Guru dan sekolah memakai buku kerja di atas. | For packages another system produces. Teachers and schools use the workbook above. |
| `studio.unggah.isi_json` | Isi paket (JSON) | Package content (JSON) |
| `studio.unggah.periksa_mudah` | Periksa paket JSON | Check the JSON package |
| `studio.unggah.periksa_terstruktur` | Periksa paket terstruktur | Check the structured package |

### Group 6 · certificate (2 keys)

| Key | Indonesian | English |
|---|---|---|
| `sertifikat.kelola.kolom.kursus` | Kursus | Course |
| `sertifikat.berkas` | Sertifikat Penguasaan · {kursus} | Certificate of Mastery · {kursus} |

### Group 7 · professional-learning record (3 keys)

| Key | Indonesian | English |
|---|---|---|
| `pengembangan.arti` | Catatan baca-saja per peserta dan paket. Bukan penilaian kinerja dan bukan peringkat. | A read-only record per participant and package. It is not a performance appraisal and not a ranking. |
| `pengembangan.paket_kosong` | Belum ada paket yang diberikan. | No package has been given yet. |
| `pengembangan.kolom.paket` | Paket | Package |
