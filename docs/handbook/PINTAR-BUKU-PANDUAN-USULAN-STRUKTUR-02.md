# PINTAR Buku Panduan · Proposed structure for Draft 02

**For owner review. This is a proposal, not the handbook. The handbook (Draft 01a) has not been rewritten.**

- Prepared by: Pete, 17 November 2026
- Responds to: "PINTAR 5.0 Handbook: Usability Improvements"
- Builds on: `PINTAR-BUKU-PANDUAN-LENGKAP-DRAFT-01.md` (Draft 01a) and `PINTAR-HANDBOOK-FEATURE-COVERAGE.md`

The handbook stays in Bahasa Indonesia. This proposal is in English so that we can discuss it, but every title it proposes for the handbook is given in Indonesian.

---

## 1. What changes, in one page

| Area | Draft 01a | Proposed Draft 02 |
|---|---|---|
| **Version framing** | Organised partly by version: separate chapters for 4.5 and 5.0, a version guide, and version tags in reader text. | **One unified PINTAR handbook.** No per-version chapters and no version tags in reader text. Each feature is explained where its user needs it. Status is tracked only in a draft layer that is stripped before publication (§2). |
| **Getting started** | Readers go from Bab 1 to their role chapter. | **"15 Hal yang Paling Sering Dilakukan di PINTAR"** as Bab 3, in a fixed seven-part format (§4). |
| **Pictures** | 11 illustration placeholders; no screenshots. | **About 55 screenshot slots** with fixed capture rules, plus **14 diagrams and infographics**, each answering one question (§5, §6). |
| **Finding answers** | A short "Saya ingin…" appendix. | **Four indexes**: alphabetical, by role, "Saya ingin…", and troubleshooting by symptom, all built from one source list (§7). |
| **4.5 and 5.0 ideas** | Bagian III, written as "the future". | Folded into the role chapters and two thematic chapters ("Memahami bukti", "Dari bukti ke tindakan"), written in the present tense *only once built and accepted*. |
| **Scope** | Complete. | Still complete. Nothing is cut for length. |

---

## 2. Writing for 5.0 while 4.1 to 5.0 are still being built

The handbook will be published only after 5.0 is complete and accepted, so the reader-facing text describes the accepted product with no version labels. Most of 4.2–5.0 does not exist yet, so drafting needs a second layer that readers never see.

**Draft status markers (stripped at publication).** Each section, quick task, screenshot slot and diagram carries one marker. The marker shows how much of the text is verified:

| Marker | Meaning for the draft text |
|---|---|
| `⟦DRAF · terverifikasi⟧` | Written from a built screen on staging. Steps and screen text have been checked. |
| `⟦DRAF · dalam pengembangan⟧` | Being built. Written from approved scope; steps not yet verified. |
| `⟦DRAF · direncanakan⟧` | Planned (4.2). Describes the intended experience only. No invented buttons or steps. |
| `⟦DRAF · arah⟧` | Approved direction (4.5, 5.0). Concept only, until it is planned and built. |
| `⟦DRAF · belum ditetapkan⟧` | Version open, candidate, or possibly never built. |

This replaces today's 〔4.0〕 / 〔4.2 · direncanakan〕 tags. The feature-coverage file keeps the per-feature version and status record.

**Rule before publication.** Every instruction, screenshot, diagram and index entry is reconciled against the accepted 5.0 product, and every marker must read `terverifikasi`. Anything not in accepted 5.0 is removed, or moved to a short, honest list (next point).

**Items that may not be in 5.0 at all.** Some items may not be in 5.0:
- integrated AI drafting, which ruling 44 removes from the roadmap if no provider qualifies;
- retention enforcement (version unassigned);
- assessment time limits (a candidate);
- the eight items deferred "later than 4.2";
- access from outside the school.

**Decision O-3:** for anything in this list that is not in the accepted 5.0, should the book (a) leave it out completely, or (b) list it briefly in one appendix, "Yang belum ada di PINTAR"? I recommend (b). Schools ask about these things, and a clear "not available" answer is useful.

---

## 3. Proposed table of contents

Chapter numbers are new. Where a section comes from Draft 01a, its old number is shown in brackets so the mapping can be checked. Nothing in Draft 01a is dropped; the full mapping is in §8.

### Bagian awal
- Sampul dan halaman judul
- Catatan untuk peninjau *(draft only)*
- Prakata *(from Prakata; version history removed)*
- Daftar isi *(clickable in the digital edition)*

### Bagian I · Mulai di sini

**Bab 1 · Mengenal PINTAR** *(1.1–1.5)*
- 1.1 PINTAR dalam satu kalimat
- 1.2 Masalah yang ingin dibantu PINTAR
- 1.3 Dari tujuan pembelajaran ke langkah mengajar berikutnya · **[Diagram D-02]**
- 1.4 Siklus belajar PINTAR · **[Diagram D-01]**
- 1.5 Apa yang bukan PINTAR

**Bab 2 · Cara memakai buku ini** *(2.1, 2.3, 2.4; new 2.4–2.6)*
- 2.1 Dua cara membaca: belajar dari awal, atau langsung mencari jawaban
- 2.2 Cara membaca teks layar «…»
- 2.3 Kotak khusus: *Mengapa begini?*, *Contoh*, *Jika ada kendala*
- 2.4 Cara membaca tangkapan layar dan anotasi bernomor *(new)*
- 2.5 Cara membaca diagram: siapa memutuskan, apa yang dicatat PINTAR *(new; explains the diagram legend, §6)*
- 2.6 Empat indeks di akhir buku *(new)*

**Bab 3 · 15 Hal yang Paling Sering Dilakukan di PINTAR** *(new; see §4)*
- Peta tugas: which tasks belong to which role · **[Infografik D-13]**
- Tugas 1 to Tugas 15

**Bab 4 · Prinsip PINTAR dalam keseharian** *(old Bab 3; content kept)*

**Bab 5 · Siapa melakukan apa** *(old Bab 4)*
- 5.1 Peran dan lingkup
- 5.2 Enam peran di PINTAR
- 5.3 Tanggung jawab yang bukan peran tersendiri (peninjau, fasilitator, kepala sekolah) *(principal role still marked [Perlu konfirmasi])*
- 5.4 Pintu masuk menurut peran
- 5.5 Batas persetujuan: siapa boleh menyetujui, menerbitkan, dan mengoreksi · **[Diagram D-10]** *(new section, gathered from 8.1, 10.2 and 18.1)*
- 5.6 Jabatan, pelaksana tugas, dan peran di dua sekolah *(old 4.5)*

**Bab 6 · Dasar yang sama untuk semua pengguna** *(old Bab 5)*
- 6.1 Bahasa
- 6.2 Mengaktifkan akun · SS-01 to SS-03
- 6.3 Masuk ke PINTAR · SS-04, SS-05
- 6.4 Komputer bersama dan komputer pribadi · SS-06, SS-07
- 6.5 Keluar
- 6.6 Lupa password atau PIN, dan mengganti password · SS-09
- 6.7 Akun saya dan Kartu PINTAR · SS-08
- 6.8 Pemeliharaan dan penghentian sementara · SS-45
- 6.9 Waktu dan zona waktu
- 6.10 Ketika sesuatu gagal
- 6.11 Tur PINTAR dan Bantuan · SS-47
- 6.12 Cara masuk dan keamanan staf yang lain *(old 5.12; WhatsApp sign-in and unusual-access checks, only if in 5.0)*

### Bagian II · Panduan untuk setiap peran

**Bab 7 · Admin PINTAR** *(old Bab 6; 6.10 folded into the sections it concerns)*

**Bab 8 · Admin sekolah** *(old Bab 7)*
- 8.1 Satu tahun bersama PINTAR · **[Infografik D-14: lini masa tahun ajaran]**
- 8.2 Masuk pertama kali dan Persiapan sekolah · SS-10 · **[Diagram D-03]**
- 8.3 Struktur sekolah dan tahun ajaran · SS-11
- 8.4 Batas ketuntasan
- 8.5 Mendata murid dan staf, termasuk satu orang di luar pendataan berkas · SS-12
- 8.6 Mengaktifkan akun: kartu kelas murid dan aktivasi staf · SS-13
- 8.7 Kartu hilang atau PIN terlupa · SS-14
- 8.8 Peran staf, jabatan, dan pelaksana tugas · SS-15
- 8.9 Memindahkan murid antarkelas · SS-16
- 8.10 Perpindahan murid ke sekolah lain · SS-17 · **[Diagram D-08]**
- 8.11 Murid keluar dan kembali; staf yang pindah tugas; serah terima kelas
- 8.12 Kenaikan kelas dan kelulusan · SS-18 · **[Diagram D-15]**
- 8.13 Menjadwalkan pemeliharaan · SS-44
- 8.14 Kesempatan tambahan untuk murid · SS-36
- 8.15 Sertifikat sekolah · SS-41
- 8.16 Catatan masuk dan cetak · SS-43
- 8.17 Ekspor data sekolah, laporan periode lalu, jejak audit, dan dukungan
- 8.18 Mengoreksi catatan dan struktur sekolah

**Bab 9 · Pimpinan: Kepala departemen dan Dekan** *(old Bab 8, plus 8.9, 8.10 and 15.7)*
- 9.1 Dua peran pimpinan
- 9.2 Lingkup yang Anda pimpin
- 9.3 Halaman Pimpinan: apa yang menunggu Anda · SS-39
- 9.4 Ringkasan Sekolah dan Ringkasan Kelas · SS-40
- 9.5 Membaca laporan dengan jujur · **[Diagram D-05]**
- 9.6 Catatan integritas
- 9.7 Mendukung guru, tanpa peringkat
- 9.8 Mengatur evaluasi guru di institusi · SS-53 · **[Diagram D-09]**
- 9.9 Perbaikan di tingkat bagian dan sekolah · SS-54

**Bab 10 · Guru** *(old Bab 9, plus 9.12–9.14 and 15.3–15.4)*
- 10.1 Perjalanan seorang guru
- 10.2 Halaman Mengajar · SS-24
- 10.3 Menyediakan materi untuk kelas · SS-24
- 10.4 Apa yang dialami murid
- 10.5 Uji Cepat · SS-25
- 10.6 Uji Penguasaan dan Mode Ujian · SS-55
- 10.7 Membaca bukti kelas · SS-32, SS-33 · **[Diagram D-05]**
- 10.8 Melihat hasil seorang murid · SS-34
- 10.9 Memutuskan langkah berikutnya, dan mencatat tindak lanjut · SS-51 · **[Diagram D-05]**
- 10.10 Mengatur sesi asesmen satu murid · SS-35
- 10.11 Ketika asesmen terganggu · **[Diagram D-06]**
- 10.12 Ketika kunci jawaban dikoreksi · **[Diagram D-07]**
- 10.13 Bila murid berpindah perangkat
- 10.14 Penjelasan yang tenang di layar guru · SS-50 *(old 9.13, 14.5)*

**Bab 11 · Menyusun dan meninjau materi di Studio** *(old Bab 10, plus 10.12 and 14.3)*
- 11.1 Mengapa ada Studio
- 11.2 Siapa melakukan apa di Studio
- 11.3 Menyusun Paket Pembelajaran · SS-19
- 11.4 Dari draf sampai terbit · SS-21, SS-23 · **[Diagram D-04]**
- 11.5 Meninjau materi, dan catatan peninjau · SS-22
- 11.6 Aturan Asesmen dan pemahaman keliru
- 11.7 Mengoreksi materi yang sudah terbit
- 11.8 Memperbaiki kunci jawaban yang keliru · SS-37, SS-38 · **[Diagram D-07]**
- 11.9 Menyiapkan soal dengan bantuan AI · SS-20 *(the integrated-AI part only if qualified and accepted; ruling 44)*
- 11.10 Kesehatan soal dan Kecerdasan Soal · SS-48

**Bab 12 · Murid** *(old Bab 11; 11.14 folded in)*
- 12.1 Perjalanan seorang murid · **[Diagram D-16]**
- 12.2 Kartu kelas dan masuk · SS-05
- 12.3 Komputer yang dipakai bersama · SS-07
- 12.4 Halaman Belajar · SS-26
- 12.5 Pemetaan Awal · SS-27
- 12.6 Peta Bacaan Personal dan pelajaran · SS-28, SS-29
- 12.7 Uji Penguasaan · SS-30
- 12.8 Hasil · SS-31
- 12.9 Sertifikat
- 12.10 Pemberitahuan khusus
- 12.11 Melanjutkan di perangkat lain
- 12.12 Bahasa dan jenjang
- 12.13 Akun dan meninggalkan PINTAR

**Bab 13 · Pengembangan profesi, evaluasi, dan pertumbuhan guru** *(old Bab 12, plus 8.9, 14.8, 15.5 and 16.6)*

Gathering these into one chapter answers your task 15. It also makes the separation between them visible at a glance.
- 13.1 Empat jenis catatan yang selalu dipisahkan · **[Infografik D-11]**
- 13.2 Program pengembangan profesi: fasilitator · SS-46
- 13.3 Program pengembangan profesi: peserta · SS-46
- 13.4 Evaluasi resmi: apa yang dialami guru, dan haknya untuk menanggapi · SS-53 · **[Diagram D-09]**
- 13.5 Pertumbuhan Guru: tujuan yang dipilih sendiri · SS-52
- 13.6 Kesepakatan Pertumbuhan Bersama
- 13.7 Batas yang dijaga: siapa melihat apa · **[Infografik D-12]**

**Bab 14 · Memeriksa keaslian sertifikat** *(old Bab 13; for the public, employers and families)* · SS-42

### Bagian III · Dari bukti ke tindakan
*(Replaces old Bagian III. These chapters explain how PINTAR reasons, for every reader. They are written in the present tense and only describe what accepted 5.0 does.)*

**Bab 15 · Memahami bukti** *(old 14.1–14.7, 14.9)*
- 15.1 Empat jenis pernyataan · SS-49
- 15.2 Memeriksa soal sebelum menilai murid
- 15.3 Identitas kompetensi
- 15.4 Contoh lengkap: pecahan
- 15.5 Sejarah yang dapat dijelaskan
- 15.6 Hal yang tidak dilakukan PINTAR

**Bab 16 · Dari bukti ke tindakan: siklus perbaikan** *(old 15.1–15.4, 15.6, 15.8, 15.9)*
- 16.1 Siklus perbaikan PINTAR · **[Diagram D-17]**
- 16.2 Tiga hal yang dapat dikatakan tentang sebuah intervensi
- 16.3 Jalur belajar yang diatur
- 16.4 Bagaimana semuanya saling berhubungan
- 16.5 Hal yang tidak dilakukan PINTAR

### Bagian IV · Perjalanan terpadu di sekolah

**Bab 17 · Perjalanan yang menghubungkan semuanya** *(old Bab 16; version tags removed)*
- Journeys A–I.
- Journey J (access from outside the school) only if it is in 5.0.
- Each journey opens with its diagram where one exists: A → D-03, C → D-06, G → D-08, F → D-09.

### Bagian V · Bantuan

**Bab 18 · Pertanyaan umum** *(old Bab 17; expanded after it is reconciled with `PERTANYAAN-SEKOLAH-DRAF-1.md`)*

**Bab 19 · Ketika sesuatu tidak berjalan seperti biasa** *(old Bab 18)*
- 19.1 Prinsip yang berlaku di semua situasi
- 19.2 Situasi dan langkah pemulihan, as a table and one short procedure per situation
- 19.3 Mencetak laporan resmi

### Lampiran
- A · Glosarium *(old Lampiran C, expanded)*
- B · Yang belum ada di PINTAR *(if you choose option (b) for O-3)*
- C · Untuk sekolah yang memperbarui dari versi sebelumnya *(**Decision O-4**: a short "what changed when you upgraded" note, for example the one-time account set-up and the username. I recommend including it.)*
- D · Daftar tangkapan layar, diagram, dan infografik

### Indeks *(new; see §7)*
- Indeks A · Alfabetis
- Indeks B · Menurut peran
- Indeks C · "Saya ingin…"
- Indeks D · Mengatasi masalah, menurut gejala

**Removed from the reader's book** (they move to the coverage file):
- the version guide (old 1.6 and Lampiran A);
- version tags;
- the "next version" sections (old 6.10, 7.18, 9.12–9.14, 11.14, 12.6);
- the list of things still to be decided (old 14.11);
- the open-items appendix (old Lampiran B).

---

## 4. Bab 3 · 15 Hal yang Paling Sering Dilakukan di PINTAR

### 4.1 Format of every quick task

Each task fits on one or two printed pages and uses the same seven headings.

| Heading | Rule |
|---|---|
| **Untuk siapa** | Role names exactly as on screen, for example «Guru», «Admin sekolah». |
| **Tujuan** | One sentence, from the user's point of view. |
| **Sebelum mulai** | At most four prerequisites, each one linked. |
| **Langkah-langkah** | At most nine numbered steps; quoted screen text in «…»; one screenshot per decisive step. If there is a role branch, two short lists, for example "Staf" and "Murid". |
| **Hasilnya** | What the user sees when the task has succeeded, quoting the screen message where there is one. |
| **Jika ada kendala** | Two to four common problems, each with its recovery and a link. |
| **Baca juga** | Links to the full sections and the related "Saya ingin…" entries. |

There are no explanations of *why* in the quick tasks; the "why" lives in the role chapters. Each task has an anchor (`#tugas-01` to `#tugas-15`) so that the index and the role chapters can link to it.

### 4.2 Your shortlist, checked against the feature register and the workflows

I checked each proposed task against the feature register in the coverage file and the role journeys. Most stand as proposed. The changes I recommend:

| # | Proposed title | Recommendation | Reason | Roles | Readiness now |
|---|---|---|---|---|---|
| 1 | Mengaktifkan akun dan masuk ke PINTAR | **Keep.** Two branches: staff (activation by email) and learners (class card). | The most common first task. It includes the one-time set-up after the upgrade. | All | Verified (4.0) |
| 2 | Mengatur profil dan memulihkan akses akun | **Rename: "Mengelola Akun saya dan memulihkan akses"**. It covers a forgotten password, a forgotten PIN and a lost card. | PINTAR has no self-editable profile: a person confirms their name once (D-077) and the username cannot be changed. "Profil" would promise something that does not exist. A lost card is the most frequent support request. | All | Verified, except changing the password while signed in (4.2) |
| 3 | Menyiapkan sekolah, kelas, guru, dan murid | **Keep, and state the hand-off:** Admin PINTAR opens the school; Admin sekolah follows «Persiapan sekolah». | Two roles take part, and readers need to know who starts. | Admin PINTAR, Admin sekolah | Verified (4.0) |
| 4 | Menambahkan atau memindahkan murid ke kelas | **Keep.** | Frequent all year. | Admin sekolah | Moving and bulk import verified. Adding one person outside a bulk import is planned (4.2). |
| 5 | Membuat dan mengubah materi pembelajaran di Studio | **Keep.** Make clear that changing published material produces a new version. | Released versions are protected, so "mengubah" has a specific meaning. | Guru (author) | Verified (4.0); the question workbench is in development (4.1) |
| 6 | Meninjau dan menyetujui materi atau soal | **Extend: "Meninjau, menyetujui, dan menerbitkan materi"** | Approving and publishing are different permissions (a Kepala departemen cannot publish), and the author never approves their own work. One task should show the whole boundary. | Reviewers, publishers | Verified (4.0) |
| 7 | Menyediakan materi pembelajaran untuk kelas | **Keep.** | Uses the frozen verb «Sediakan». | Guru | Verified (4.0) |
| 8 | Mengikuti Pemetaan Awal dan melihat arahan belajar | **Keep, and name «Peta Bacaan Personal».** | Uses the product's own term instead of "arahan". | Murid | Verified (4.0) |
| 9 | Mempelajari materi dan mengerjakan latihan | **Keep, and add the step-by-step help.** | "Latihan" exists in the product as a question purpose; **verify** that learners see it under that word. | Murid | Verified (4.0); term to check |
| 10 | Mengadakan Uji Cepat atau Uji Penguasaan | **Keep, with two clearly separate branches.** | They work differently: the teacher runs a Uji Cepat live in class with a duration, while a Uji Penguasaan comes with the material made available («Sediakan»). Mode Ujian joins this task once it is built. | Guru | Uji Cepat and Uji Penguasaan verified; Mode Ujian planned (4.2) |
| 11 | Melihat hasil belajar seorang murid | **Keep.** | — | Guru, Pimpinan | Verified (4.0); past periods planned (4.2) |
| 12 | Membaca ringkasan hasil belajar seluruh kelas | **Keep.** Include "how not to over-read the numbers". | Honest reading is a core principle (old 8.5). | Guru, Pimpinan | Verified (4.0); fuller explanations are approved direction (4.5) |
| 13 | Membantu murid yang membutuhkan penguatan | **Keep.** | Bridges evidence to action. | Guru | The next-step decision is verified (4.0); recording interventions is approved direction (5.0) |
| 14 | Mengelola dan memeriksa sertifikat | **Keep, with two branches:** the school (issue, revoke, replace) and anyone (check authenticity). | — | Admin sekolah, public | Verified (4.0, completed in 4.1) |
| 15 | Meninjau perkembangan pembelajaran dan pertumbuhan profesional guru | **Change: "Mengikuti pengembangan profesi dan menetapkan tujuan pertumbuhan".** Class learning progress is already covered by Tasks 11 and 12. | As written, it joins learner progress and teacher growth in one task, which the handbook keeps strictly apart. Formal evaluation and private growth must also stay separate. A combined task could suggest that learner results feed teacher growth or evaluation. | Guru (Peserta), Fasilitator | Professional development verified (4.0); growth goals are approved direction (5.0) |

**Frequent tasks not on the shortlist.** Each of these is frequent or high-stakes in the real workflows. **Decision O-2:** should one of them replace a task above, or should they be listed after the 15 under "Tugas lain yang sering dilakukan", each with a link to its full section? I recommend the second, to keep the number at fifteen.
- Membantu murid saat asesmen berlangsung: «Tambah waktu», «Akhiri tanpa menghitung», kesempatan tambahan. *(4.1, in development)*
- Memperbaiki kunci jawaban yang keliru. *(4.1; it is also in your "Saya ingin…" examples)*
- Kenaikan kelas dan kelulusan di akhir tahun. *(Annual, but it affects every learner.)*
- Murid pindah sekolah. *(It is in your "Saya ingin…" examples.)*
- Menjadwalkan pemeliharaan. *(4.1)*

### 4.3 How a quick task will look (sample layout)

The sample uses only screen text already verified in the code. It is a layout sample, not final wording.

> **Tugas 1 · Mengaktifkan akun dan masuk ke PINTAR** `⟦DRAF · terverifikasi⟧`
>
> **Untuk siapa:** semua staf (Guru, Kepala departemen, Dekan, Admin sekolah) dan murid.
> **Tujuan:** Anda dapat masuk ke PINTAR dengan akun Anda sendiri.
> **Sebelum mulai:** sekolah sudah mendata Anda (Bab 8.5). Staf: buka email yang didaftarkan sekolah. Murid: siapkan kartu kelas.
>
> **Langkah-langkah · Staf**
> 1. Buka halaman «Aktifkan akun PINTAR Anda», lalu masukkan email Anda. · [SS-01]
> 2. Masukkan kode aktivasi dari email.
> 3. «Pilih username». Pilih dengan teliti: «username tidak bisa diganti». · [SS-02]
> 4. «Buat password», lalu «Buat PIN pribadi».
> 5. «Periksa nama Anda», lalu pilih «Sudah benar» atau «Ubah nama». · [SS-03]
>
> **Langkah-langkah · Murid**
> 1. Di halaman masuk, «Masukkan nomor kartu dan PIN yang tertera pada kartu.» · [SS-05]
>
> **Hasilnya:** «Akun Anda sudah aktif. Mulai sekarang, masuk dengan email atau username, dan password Anda.»
> **Jika ada kendala:** Kode tidak sampai → periksa folder Spam (6.2). «Belum cocok…» → periksa nomor kartu dan PIN (6.3). Murid lupa PIN → «Lupa PIN? Tanyakan kepada guru.» (Tugas 2).
> **Baca juga:** 6.2, 6.3, 6.4, 12.2 · Indeks C: "Saya ingin masuk ke PINTAR".

---

## 5. Screenshot plan

### 5.1 Capture rules

1. **Source.** Capture only from the completed and accepted 5.0 build, on the acceptance environment, never production. Earlier trial captures may be used for layout work, but are replaced before publication.
2. **Data.** Use only an **approved demonstration school and personas**. The code already has evaluation personas, which are excluded from account set-up. **Decision O-5:** approve one demonstration dataset (school name, class names, people), with names that clearly cannot belong to real people. No real person's data ever appears, not even blurred.
3. **What the screen must show.** Indonesian interface, light theme, the default text size, and the same demonstration date throughout the book.
4. **Sizes.**
   - Staff screens: 1280 px wide.
   - Learner screens: a 390 px phone width, because many learners use phones.
   - Where the layout changes meaningfully, a second capture at the other size.
   - Export at 2× for print, then scale down for the digital edition.
5. **Crop to the task.** Show the relevant part of the screen. Keep enough context, such as the page title, for the reader to recognise where they are.
6. **Annotation grammar.**
   - Numbered circles in deep teal `#075056`, with white numbers, matching the numbers of the steps.
   - A thin teal outline for the element that matters.
   - Nothing else on the image: no arrows from all directions, no added text over the interface.
   - The annotation only points; the caption explains.
7. **Never edit the interface.** No retouching of labels, no compositing of states that cannot appear together, no invented elements. If the screen changes, recapture it.
8. **Text alternative.** Every screenshot has a caption and alt text that describe what it shows, so the steps still work for a reader using a screen reader.
9. **Repeatable.** Capture with a script (the same approach as the website's CDP screenshot tooling), so the whole set can be recaptured when a screen changes. Each slot records its route and the state needed to reach it.
10. **Verification.** Before publication, each screenshot is checked against the numbered steps it illustrates: same labels, same order, same result.

**Placeholder format in the draft:**

> `[Tangkapan layar SS-12 · Pendataan: pratinjau berkas dengan satu baris bermasalah · Layar: /pendataan · Sorot: pesan kesalahan dengan lembar dan baris · Anotasi: 1, 2 · Data: demo · ⟦DRAF · terverifikasi⟧]`

### 5.2 Screenshot slots

"First time" and "decision" mark the moments your brief prioritises. The **Layar** column says whether the screen exists today on staging (✓), is being built (◐), or is not built yet (○).

| Slot | Section | Moment shown | Highlight | Why it matters | Layar |
|---|---|---|---|---|---|
| SS-01 | 6.2, T1 | «Aktifkan akun PINTAR Anda»: email field | email field, send-code action | first time | ✓ |
| SS-02 | 6.2, T1 | «Pilih username», with its warning | the warning line | decision (cannot be changed) | ✓ |
| SS-03 | 6.2, T1 | «Periksa nama Anda» | «Sudah benar» / «Ubah nama» | decision (name on certificates) | ✓ |
| SS-04 | 6.3 | Staff sign-in | email or username, password | first time | ✓ |
| SS-05 | 6.3, 12.2, T1 | Learner sign-in with class card | card number, PIN | first time | ✓ |
| SS-06 | 6.4 | «Komputer siapa ini?» | the two choices | decision | ✓ |
| SS-07 | 6.4, 12.3 | «PINTAR terkunci» | PIN field, «Bukan akun Anda?» | recovery | ✓ |
| SS-08 | 6.7, T2 | «Akun saya» with Kartu PINTAR (demo, marked as an example) | PINTAR ID, «Keluar dari semua perangkat» | first time | ✓ |
| SS-09 | 6.6, T2 | «Lupa password?» | username or email field | recovery | ✓ |
| SS-10 | 8.2, T3 | «Persiapan sekolah» checklist | the remaining items | first time | ✓ |
| SS-11 | 8.3, T3 | Creating a class | class name, year | first time | ✓ |
| SS-12 | 8.5, T3 | Data import preview with one faulty row | sheet, row, problem | recovery | ✓ |
| SS-13 | 8.6, T3 | Printing class cards | print action | first time | ✓ |
| SS-14 | 8.7, T2 | «Kartu hilang atau rusak» | issuing a new card | recovery | ✓ |
| SS-15 | 8.8 | Assigning a staff role | role, scope | decision | ✓ |
| SS-16 | 8.9, T4 | «Pindah kelas» confirmation | target class, reason | decision | ✓ |
| SS-17 | 8.10 | Offering a transfer to another school | the offer | decision | ✓ |
| SS-18 | 8.12 | Year-end promotion: recording each learner's outcome | the outcome per learner | decision (cannot be undone in one go today) | ✓ |
| SS-19 | 11.3, T5 | Studio › Buat Paket: «Unduh templat Excel» | template, sample | first time | ✓ |
| SS-20 | 11.9, T5 | Workbook check: a sheet, row and problem reported | the error line | recovery | ✓ |
| SS-21 | 11.4, T5 | «Ajukan untuk ditinjau» | the action | decision | ✓ |
| SS-22 | 11.5, T6 | Review with reviewer notes beside a question | the note | decision | ◐ |
| SS-23 | 11.4, T6 | Publishing | publish action, version | decision | ✓ |
| SS-24 | 10.3, T7 | «Sediakan» material for a class | class, closing date | decision | ✓ |
| SS-25 | 10.5, T10 | Uji Cepat: choose questions, «Sediakan Uji Cepat sekarang» | duration | decision | ✓ |
| SS-26 | 12.4, T8 | Learner's «Belajar» page (phone) | the next step | first time | ✓ |
| SS-27 | 12.5, T8 | Starting the Pemetaan Awal (phone) | start action | first time | ✓ |
| SS-28 | 12.6, T8 | Peta Bacaan Personal (phone) | the suggested order | first time | ✓ |
| SS-29 | 12.6, T9 | Step-by-step help in a lesson (phone) | help levels | first time | ✓ |
| SS-30 | 12.7, T10 | Uji Penguasaan, with the connection message (phone) | answer saved | recovery | ✓ |
| SS-31 | 12.8 | Learner's result (phone) | official result | first time | ✓ |
| SS-32 | 10.7, T12 | «Lihat bukti»: class summary | the class conclusion | decision | ✓ |
| SS-33 | 10.7, T12 | «Per soal»: how many answered correctly and which answer was chosen | most-chosen wrong answer | decision | ✓ |
| SS-34 | 10.8, T11 | One learner's official result | the attempt, the rules used | — | ✓ |
| SS-35 | 10.10 | One learner's session: «Tambah waktu», «Akhiri tanpa menghitung» | the two actions, the reason field | decision | ◐ |
| SS-36 | 8.14 | Extra attempt: requested by one person, approved by another | the two people | decision | ◐ |
| SS-37 | 11.8 | Answer-key correction: the proposal | the proposed key, reason | decision | ◐ |
| SS-38 | 11.8 | Answer-key correction: second person's approval and the affected results | affected count, before and after | decision | ◐ |
| SS-39 | 9.3 | «Pimpinan»: items waiting | the waiting list | — | ✓ |
| SS-40 | 9.4 | School summary (Dekan) | the explanation of how much data there is | decision | ✓ |
| SS-41 | 8.15, T14 | Certificate management: «Cabut» with a reason | reason, final warning | decision | ✓ |
| SS-42 | 14, T14 | Public certificate check page | status, issuing school | first time | ✓ |
| SS-43 | 8.16, 19.3 | An official print with its reference number | the reference footer | — | ✓ |
| SS-44 | 8.13 | Scheduling maintenance | the time window, notice | decision | ◐ |
| SS-45 | 6.8 | Maintenance notice as a learner sees it | the notice | — | ◐ |
| SS-46 | 13.2–13.3, T15 | Professional development: participant view | the programme, own results | first time | ✓ |
| SS-47 | 6.11 | Tur PINTAR and Bantuan | the tour start | first time | ✓ |
| SS-48 | 11.10 | Kesehatan soal and Kecerdasan Soal | a question flagged for checking | decision | ✓ / ○ (Kecerdasan Soal) |
| SS-49 | 15.1 | The four kinds of statement in a report | the evidence label | — | ○ |
| SS-50 | 10.14 | A calm explanation on the teacher's screen | the explanation and its basis | — | ○ |
| SS-51 | 10.9, T13 | Recording a follow-up (intervention) | the action, when to look again | decision | ○ |
| SS-52 | 13.5, T15 | A teacher's own growth goal | private by default | decision | ○ |
| SS-53 | 9.8, 13.4 | Formal evaluation with the teacher's response | the response, who can read it | decision | ○ |
| SS-54 | 9.9 | A department-level improvement cycle | the cycle stage | — | ○ |
| SS-55 | 10.6 | Mode Ujian | exam conditions | decision | ○ |

Planned 4.2 screens without slots yet (data export, past-period reports, two-school context selection) get slots when the 4.2 plan defines them. No slot is designed against an imagined screen.

---

## 6. Diagram and infographic plan

### 6.1 Visual grammar (one system for the whole book)

- **Colour.**
  - Deep teal `#075056` (the PINTAR brand colour, D-192) for PINTAR's own records and steps; deep teal `#05393D` for headings; pale teal `#DCE6E3` for grouping areas.
  - Charcoal and neutral greys for text and lines.
  - One amber accent, used only for exceptions and interruptions.
  - Meaning is never carried by colour alone: shape and label always carry it too, which also keeps diagrams readable when printed in black and white.
- **Who decides.** A **person decision** is drawn as a rounded box with a small person symbol and the role name ("Guru memutuskan"). A **PINTAR action** is a plain box ("PINTAR mencatat", "PINTAR menghitung ulang"). No diagram shows PINTAR deciding something reserved for educators. Every diagram includes this legend.
- **One question per diagram.** It is written as the diagram's title, for example "Apa yang terjadi bila asesmen terputus?".
- **Readable on a phone and on paper.**
  - Vertical flow, top to bottom.
  - At most about 8 steps per diagram; split it if more are needed.
  - Text at least 9 pt in print and 14 px on screen; no text smaller than body captions.
  - Diagrams are SVG, so they stay sharp at any size.
- **Text equivalent.** Under each diagram, a short numbered list says the same thing in words. It serves screen readers and readers who prefer text.
- **Consistent symbols.** The same shape always means the same thing: decision, PINTAR record, exception, end state. The website's diagrams already use this palette and type.

### 6.2 Diagrams

Your ten subjects are D-01 to D-10. D-11 to D-17 are additions where Draft 01a already planned an illustration or where a decision needs one.

| ID | Principal question (the title) | Type | Place | Decisions and exceptions shown | Depends on |
|---|---|---|---|---|---|
| **D-01** | Bagaimana siklus belajar di PINTAR berjalan? | Cycle: seven stages with the way back | 1.4, 17 | teacher decides the next step; the way back when evidence is not enough | 4.0 (built) |
| **D-02** | Bagaimana tujuan pembelajaran menjadi langkah mengajar berikutnya? | Four-step strip | 1.3 | the teacher's judgement at the last step | 4.0 |
| **D-03** | Dari sekolah bergabung sampai sesi belajar pertama: apa urutannya? | Swimlane: Admin PINTAR → Admin sekolah → Guru → Murid | 8.2, T3, Journey A | who hands over to whom; "data entry does not create accounts" | 4.0 |
| **D-04** | Bagaimana materi disusun, ditinjau, disetujui, dan diterbitkan? | Flow with a review loop and a second-person gate | 11.4, T6 | the author cannot approve; a Kepala departemen approves but does not publish; a revision creates a new version | 4.0 (+4.1 notes) |
| **D-05** | Bagaimana membaca hasil asesmen lalu memutuskan langkah mengajar berikutnya? | Decision flow: evidence → is there enough data? → which objective, which question → teacher decides | 10.7, 10.9, 9.5, T12, T13 | "not enough data yet" branch; the teacher decides, PINTAR does not | 4.0, refined after 4.5 |
| **D-06** | Apa yang terjadi bila asesmen terganggu? | Branching flow: connection lost / device off / maintenance / emergency stop / abandoned | 10.11, 19.2, Journey C | what is preserved; who acts; "the interruption is never the learner's fault" | 4.1 (in development) |
| **D-07** | Bagaimana kunci jawaban yang keliru dikoreksi, dan hasil yang terdampak dihitung ulang? | Flow with a second-person gate and a before/after result card | 11.8, 10.12, T-extra | two people; the original result stays traceable; one result counts; certificates under review | 4.1 (in development) |
| **D-08** | Bila murid pindah sekolah, catatan apa yang ikut dan apa yang tetap? | Two-school diagram with arrows only for what moves | 8.10, Journey G | what the receiving school sees; old results and certificates stay intact | 4.0; the receiving-school view needs verification |
| **D-09** | Bagaimana evaluasi resmi dan pertumbuhan guru berjalan, dan apa yang dipisahkan? | Two parallel lanes (formal evaluation; private growth) with a visible wall between them | 13.4, 9.8, Journey F | the teacher's right to respond; growth goals stay private unless shared; no learner data in an evaluation without policy | 4.5 / 5.0 direction |
| **D-10** | Siapa boleh melakukan apa, dan di mana batas persetujuannya? | Matrix infographic: six roles × key actions (approve, publish, correct key, grant extra attempt, read learner results) | 5.5 | approval boundaries; "seniority adds no right to change" | 4.0–4.1 (from role capabilities) |
| D-11 | Empat jenis catatan apa yang selalu dipisahkan? | Infographic: academic learning, professional development, formal evaluation, private growth | 13.1 | none flow into each other without policy | 4.0–5.0 |
| D-12 | Siapa dapat melihat hasil saya? | Infographic per role (learner, teacher in PD) | 13.7, 12.8 | the Admin sekolah does not read learner results | 4.0 |
| D-13 | Tugas mana yang untuk saya? | Task map: the 15 tasks grouped by role | Bab 3 | — | editorial |
| D-14 | Apa yang dikerjakan Admin sekolah sepanjang tahun ajaran? | Timeline 1 July → 30 June | 8.1 | year-end promotion; maintenance windows | 4.0 |
| D-15 | Bagaimana kenaikan kelas dan kelulusan berjalan? | Three-step flow | 8.12 | outcome per learner; correction for one learner | 4.0 |
| D-16 | Apa perjalanan seorang murid dari kartu kelas sampai sertifikat? | Vertical journey (phone-first) | 12.1 | help levels; retake rules | 4.0 |
| D-17 | Bagaimana siklus perbaikan berjalan, dari bukti sampai refleksi? | Cycle: seven steps | 16.1, 9.9 | the teacher chooses the action; PINTAR records and shows what happened, but does not claim cause | 5.0 direction |

**Drafting order.** D-01 to D-04, D-10 and D-14 to D-16 can be drafted now from built and verified behaviour. D-06 and D-07 follow 4.1 acceptance. D-05 is drafted now and refined after 4.5. D-09, D-11 and D-17 stay as labelled placeholders until 4.5 and 5.0 are planned, because drawing them now would mean inventing the process.

---

## 7. Reference index plan

### 7.1 One source, four indexes

All four indexes are generated from one structured source file kept beside the handbook (`docs/handbook/indeks-sumber.csv` or similar). Each row contains:
- the term or question;
- the index or indexes it belongs to;
- the roles it concerns;
- the target section anchor;
- an optional symptom or screen message.

The source file avoids four lists drifting apart, and lets a check script confirm that:
- every target anchor exists;
- every heading and every glossary term has at least one index entry;
- every screen message quoted in the troubleshooting index still exists in the product's screen text.

This extends the cross-reference check already run on Draft 01a.

- **Digital edition:** every reference is a link (`#bab-8-10`, `#tugas-04`).
- **Print edition:** page numbers are filled in by the layout tool only once pagination is final. Until then, the index shows section numbers.

### 7.2 Indeks A · Alfabetis
Features, screen terms («Sediakan», «Kartu PINTAR»), concepts (batas ketuntasan, Peta Bacaan Personal), tasks and common problems, with sub-entries. For example:
- Kartu kelas
  - hilang atau rusak, 8.7, Tugas 2
  - mencetak, 8.6
  - masuk dengan, 6.3, 12.2

Synonyms readers may use point to the product's term: "siswa → lihat Murid", "operator sekolah → lihat Admin sekolah", "kepala sekolah → lihat 5.3". The expected size is about 300 to 400 entries.

### 7.3 Indeks B · Menurut peran
One page per reader group: Admin PINTAR; Admin sekolah; Kepala departemen; Dekan; Guru; Murid; Peserta and Fasilitator pengembangan profesi; and *Pemeriksa sertifikat* (the public). Each page lists that role's quick tasks first, then their sections grouped by activity (first use, everyday, end of year, problems).

### 7.4 Indeks C · "Saya ingin…"
Everyday language, grouped by topic (akun dan masuk, sekolah dan kelas, materi, asesmen, hasil, sertifikat, pengembangan profesi, masalah). It includes your examples, for instance:
- Saya ingin membuat kelas baru → 8.3, Tugas 3
- Saya ingin memberikan materi kepada murid → 10.3, Tugas 7 *(the entry teaches the screen word: "di PINTAR disebut «Sediakan»")*
- Saya ingin mengetahui siapa yang membutuhkan bantuan → 10.7, 10.9, Tugas 13
- Saya ingin memperbaiki soal yang keliru → 11.7, 11.8
- Saya lupa PIN → 6.6, 8.7, Tugas 2
- Murid saya pindah sekolah → 8.10, Journey G
- Saya ingin memeriksa sertifikat → 14, Tugas 14

The expected size is about 80 to 120 entries. It replaces old Lampiran E.

### 7.5 Indeks D · Mengatasi masalah, menurut gejala
Organised by **what the reader sees or experiences**, quoting the screen message where there is one. Each entry gives a likely cause, what to do, and a link to the procedure. For example:

| Gejala | Kemungkinan penyebab | Lakukan | Baca |
|---|---|---|---|
| «Belum cocok. Coba periksa nomor kartu dan PIN, lalu coba sekali lagi.» | card number or PIN mistyped (the message is the same whatever the cause, by design) | check the card; ask the teacher | 6.3, Tugas 2 |
| The activation page appears every time I sign in | account set-up not yet finished after the upgrade | finish the remaining steps | 6.2, Lampiran C |
| The activation code has not arrived | spam folder, or the registered address is wrong | check spam, resend, contact the school | 6.2 |
| «Masih ada murid di sini. Pindahkan mereka dulu.» when deactivating a class | the class still has learners | move them first | 8.3, 8.9 |

Security thresholds, counts and check order are never given; entries say "setelah beberapa kali salah" and point to the administrator, as in Draft 01a. The expected size is about 60 to 80 entries, aligned with Bab 19.

---

## 8. Mapping from Draft 01a (nothing is lost)

| Draft 01a | Goes to |
|---|---|
| Catatan peninjau, Prakata | unchanged (the reviewer note is removed at publication) |
| Bab 1.1–1.5 | Bab 1 |
| 1.6 version table | coverage file; optional Lampiran C |
| Bab 2 | Bab 2 (version-tag section removed; new 2.4–2.6) |
| Bab 3 | Bab 4 |
| Bab 4 | Bab 5 (+ new 5.5) |
| Bab 5 | Bab 6 |
| Bab 6 (6.10 split) | Bab 7 |
| Bab 7 (7.18 split into the sections it concerns) | Bab 8 |
| Bab 8.1–8.8 | Bab 9.1–9.7 |
| 8.9, 8.10 | 9.8, 9.9, 13.4 |
| Bab 9.1–9.11 | Bab 10 |
| 9.12 | 10.6 (Mode Ujian); time limits only if built |
| 9.13, 9.14 | 10.14, 10.9 |
| Bab 10 | Bab 11 (10.12 → 11.10) |
| Bab 11 | Bab 12 |
| Bab 12 | Bab 13 |
| Bab 13 | Bab 14 |
| Bab 14 | Bab 15; 14.8 → 13.4; 14.10 into the role chapters; 14.11 → coverage file |
| Bab 15 | Bab 16; 15.5 → 13.5–13.6; 15.7 → 9.9 |
| Bab 16 | Bab 17 |
| Bab 17 | Bab 18 |
| Bab 18 | Bab 19 (18.3 removed: it lists version limits) |
| Lampiran A | coverage file |
| Lampiran B | Lampiran B "Yang belum ada di PINTAR" (if option (b)) |
| Lampiran C | Lampiran A Glosarium |
| Lampiran D | Lampiran D (expanded to screenshots, diagrams and infographics) |
| Lampiran E | Indeks C |

---

## 9. Proposed working sequence after approval

1. **Restructure.** Move Draft 01a into the new chapter order and replace version tags with draft markers. Content stays the same; this is checked with a word count and a cross-reference check before and after.
2. **Write the 15 quick tasks.** Tasks that are verified on staging get full steps now. The others get a labelled outline only.
3. **Add every screenshot and diagram placeholder** in the agreed format, and draft the diagrams that can be drawn from built behaviour (§6.2).
4. **Build the index source** and generate the four indexes, with the check script.
5. **Reconcile with the internal FAQ** (`PERTANYAAN-SEKOLAH-DRAF-1.md`) and grow Bab 18.
6. **At each acceptance (4.1, 4.2, 4.5, 5.0):** verify the affected sections, update the markers, and trial-capture screenshots.
7. **After 5.0 acceptance:**
   - final screenshot capture;
   - full verification against the product;
   - removal of all draft markers;
   - pagination and page numbers in the index;
   - native-speaker edit;
   - owner approval.

## 10. Decisions for the owner

| # | Decision | My recommendation |
|---|---|---|
| O-1 | Approve the unified structure (§3), including folding 4.5 and 5.0 into the role chapters and two thematic chapters. | Approve. |
| O-2 | The quick-task list (§4.2): accept the four title changes, and choose whether the five frequent tasks become "Tugas lain yang sering dilakukan" or replace any of the 15. | Accept the changes; add the five as "Tugas lain". |
| O-3 | Features not in the accepted 5.0: leave them out, or list them in one short appendix. | A short appendix. |
| O-4 | Include Lampiran C, a short note for schools upgrading from the earlier version. | Include it. |
| O-5 | Approve one demonstration school and dataset for all screenshots. | Reuse or extend the existing evaluation personas, with clearly fictional names. |
| O-6 | Print and digital formats, and the layout tool (this decides how page references are produced). | Decide before step 7. |
| O-7 | Role for a school principal (still open; Bob has raised it). | Until a ruling, the book recommends none. |
