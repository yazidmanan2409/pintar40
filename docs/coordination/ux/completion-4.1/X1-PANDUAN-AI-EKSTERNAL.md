# X-1 · The teacher's guide to using their own AI, in Indonesian (Daisy, 16 Nov 2026)

> **What holds now:**
> - **The teacher-facing guide and both prompts are final from my side** (§A, §B, §C), pending one thing.
>   - ~~**Sharon:** the data warning (§A.2), point 2.~~ **Taken in (16 Nov, 13:50):** Sharon's review (`X1-DATA-WARNING-54bce354.md` at `918c4586`). §A.2 is rewritten to lead with the rule, with all five additions and the optional exam line. Her Q2 lines are added, citing no law. Q3 widens the checklist.
>   - ~~**Second Eye's paste test** (point 5): it decides one rule in the prompts, marked ⟨TES⟩.~~ **Decided (16 Nov, 15:50), on Second Eye's test** (`X1-PASTE-TEST.md`, his C2w branch at `ecfd1042`):
>     - quoted text kept literal quotes in the usual case, a rendered chat table, and PINTAR stored them unflagged;
>     - so both prompts now say **one paragraph per cell, no line breaks**, which is clean on both paths;
>     - the cost is the paragraphs. The teacher can split them **in the workbook cell before upload** (step 3). Studio on `main` has no lesson-body editor, so the guide does not promise one.
> - **§A.5's message list is unconfirmed.** No real AI output was tested: ruling 42 allows no external calls. The owner's walkthrough (§6 of Bob's draft) is where it is confirmed.
>   - ~~**The answer on common first names** (point 3), given provisionally in §D.~~ Accepted by Sharon, widened: any learner known at the school, and no real local detail.
> - **Checked against the product on `main`.**
>   - Every column header in Bob's draft matches `unggah-kontrak.ts` `KOLOM` exactly, and so does every list value: Tingkat berpikir, Kegunaan, Tingkat kesulitan, Benar, Jenjang, and the labels A–E.
>   - **Five details in the draft did not match the product**, and are corrected here (§E).
> - **Where it lives** (point 1): **one page, `docs/onboarding/PANDUAN-AI-SENDIRI.md`**, as the source. A **printable A4 PDF** is built from it for schools. One text, two forms; never two texts.
> - **Read:** `docs/onboarding/AI-EKSTERNAL-PANDUAN-DRAF.md` at `ba98d0df`; `src/lib/unggah-kontrak.ts` and the `studio.*` strings in `src/lib/hle.ts` on `main`.

---

## §A · Panduan untuk guru

# Memakai AI Anda sendiri untuk menyiapkan materi PINTAR

Anda boleh memakai AI yang sudah Anda punya (Claude, ChatGPT, Gemini, Qwen, DeepSeek atau yang lain) untuk membuat **draf** pelajaran dan soal, lalu mengunggahnya ke PINTAR.
- PINTAR tidak memungut biaya tambahan untuk materi yang Anda unggah dengan cara ini.
- PINTAR tidak memerlukan kata sandi atau kunci AI Anda.

### 1 · Anda tetap penulisnya

AI hanya membuat draf. Anda yang memeriksa dan bertanggung jawab atas isinya.
- **Setiap soal harus punya tepat satu jawaban benar, dan kuncinya harus benar.** Kunci yang salah adalah kesalahan paling berat pada sebuah soal.
- Setelah diunggah, materi menjadi **draf**, sama seperti materi yang Anda tulis sendiri. Pendidik lain meninjaunya sebelum materi dapat diterbitkan.

### 2 · Sebelum mulai: yang tidak boleh masuk ke AI

**Aturannya: jangan memasukkan apa pun yang dapat mengenali seorang murid, langsung maupun bila digabung dengan keterangan lain.** Contohnya: «murid kelas 5A yang rumahnya dekat pasar dan baru pindah bulan lalu» tidak menyebut nama, tetapi orang di sekolah tahu siapa dia.

Jadi jangan pernah memasukkan:
- **Data murid:**
  - nama;
  - NISN, NIK atau ID PINTAR;
  - tanggal lahir;
  - alamat, nomor telepon atau email;
  - data orang tua atau wali.
- **Catatan tentang murid:**
  - nilai, jawaban atau laporan;
  - kehadiran;
  - catatan perilaku;
  - keadaan kesehatan atau kebutuhan khusus.
- **Tulisan atau karya murid sendiri, walaupun tanpa nama.**
- **Daftar kelas, foto, tangkapan layar PINTAR, dan berkas yang diunduh dari PINTAR.**
- **Kata sandi, tautan masuk, kode undangan, dan tautan akun atau kelas mana pun.**
- **Data pribadi guru lain, dan data sekolah yang tidak untuk umum.**
- **Soal ujian yang harus tetap rahasia.**
- **Materi yang bukan hak Anda.** Pakai hanya materi Anda sendiri, materi sekolah, atau materi yang lisensinya mengizinkan.

**Tentang layanan AI itu sendiri:**
- Apa pun yang Anda tempel ke AI di luar PINTAR diolah oleh perusahaan AI itu, menurut aturannya sendiri. PINTAR tidak dapat melihatnya dan tidak dapat menariknya kembali.
- Apakah teks Anda disimpan atau dipakai untuk melatih AI bergantung pada aturan layanan itu dan pengaturan akun Anda. **Pakai akun yang disetujui sekolah, dan periksa pengaturannya lebih dulu.**
- **Anda dan sekolah Anda bertanggung jawab atas apa yang Anda tempel.**

### 3 · Langkah-langkahnya

1. Di **Studio › Buat Paket**, pada bagian **Unggah buku kerja pelajaran**, pilih **Unduh templat Excel**. Bila perlu, unduh juga **Unduh contoh isian** untuk melihat contohnya.
2. Salin salah satu perintah di bawah (A atau B) ke AI Anda. Ganti setiap **[isi]** dan tempel materi Anda di tempat yang disediakan.
3. AI menjawab dengan satu tabel untuk setiap lembar. Salin setiap tabel ke lembar yang sama namanya di templat, mulai dari **baris 2**. Baris 1 sudah berisi judul kolom. Isi pelajaran dari AI datang sebagai satu paragraf. Bila perlu, bagi menjadi beberapa paragraf langsung di selnya (di Excel: Alt+Enter) sebelum mengunggah.
4. Unggah buku kerja itu di **Studio › Buat Paket**.
   - PINTAR memeriksa setiap baris lebih dulu.
   - Bila ada yang salah, PINTAR menyebut lembarnya, barisnya dan masalahnya, dan **belum menyimpan apa pun**.
   - Perbaiki baris itu, lalu unggah lagi.
5. Baca setiap pelajaran, setiap soal dan kuncinya. Perbaiki yang salah, lalu pilih **Ajukan untuk ditinjau**.

**Bila AI Anda dapat membuat berkas Excel sendiri,** Anda boleh memintanya langsung mengisi templat itu. Menyalin tabel tetap berhasil untuk AI mana pun.

### 4 · Sebelum mengunggah: periksa lima hal

- [ ] Tidak ada data yang dapat mengenali murid (lihat bagian 2) di mana pun, **termasuk dalam soal cerita**. Ganti nama yang sama dengan nama murid yang Anda kenal di sekolah, dan hindari rincian setempat yang nyata (nama jalan, toko atau tetangga).
- [ ] Setiap soal punya tepat satu «Ya» di kolom **Benar**.
- [ ] Setiap pilihan punya **Alasan**.
- [ ] Setiap **Kode soal** di lembar Pilihan juga ada di lembar Soal.
- [ ] Setiap **No bab** dan **No pelajaran** di lembar Soal ada di lembar Pelajaran.

### 5 · Bila PINTAR menyebut masalah

PINTAR menyebut lembar dan barisnya. Yang paling sering muncul dari jawaban AI:

| Pesan PINTAR | Yang perlu Anda lakukan |
|---|---|
| «Alasan pilihan belum diisi. …» | Tulis alasan pilihan itu: mengapa benar, atau kesalahan berpikir apa yang membuatnya salah. Bisa juga minta AI melengkapinya |
| «Belum ada pilihan yang ditandai benar.» | Tulis «Ya» pada jawaban yang benar |
| «Pilihan ganda hanya boleh satu jawaban benar. …» | Tentukan satu jawaban yang benar. Ubah yang lain menjadi «Tidak» |
| «Nomor bab ini tidak ada di lembar Bab.» / «Nomor pelajaran ini tidak ada …» | Samakan nomornya dengan lembar Bab dan lembar Pelajaran |
| «Kode soal ini tidak ada di lembar Soal.» | Samakan kode di lembar Pilihan dengan lembar Soal |
| «Label pilihan harus A, B, C, D atau E.» | Tulis hurufnya saja, tanpa titik atau kurung |
| «Isi kolom ini tidak ada dalam daftar pilihannya.» | Pakai salah satu isian yang disebut di lembar **Cara mengisi** di templat |
| «Kolom wajib ini tidak ada di baris judul lembar.» | Jangan ubah baris 1. Salin tabel mulai baris 2 |

*(Unconfirmed: the most common messages from real AI output are seen first at the owner's walkthrough. The table changes only if they differ.)*

### 6 · Batasnya

- Satu buku kerja berisi **satu kursus utuh**. Soal dari perintah B masuk ke buku kerja kursus baru, atau ke versi berikutnya dari kursus yang sudah ada. Untuk menambah beberapa soal ke pelajaran yang sudah ada, tulis langsung di Studio.
- PINTAR tidak menangani masalah layanan AI di luar PINTAR, akunnya atau biayanya.

---

## §B · Perintah A: satu kursus dengan pelajaran dan soalnya

```text
Anda membantu seorang guru menyiapkan materi pelajaran untuk PINTAR. Pakai HANYA materi di bawah. Jangan menyebut nama orang sungguhan dan jangan menyebut murid mana pun. Bila soal cerita memerlukan tokoh, pakai nama rekaan.

Mata pelajaran: [isi]
Jenjang: [SD, SMP atau SMA]
Kelas: [misalnya Kelas 4 atau Kelas X]
Judul kursus: [isi]
Tujuan pembelajaran: [isi]
Banyak soal pilihan ganda untuk setiap pelajaran: [misalnya 5]

MATERI:
[tempel materi Anda di sini]

Jawab dengan LIMA tabel, satu untuk setiap lembar, masing-masing diberi judul nama lembarnya. Baris pertama setiap tabel berisi judul kolom PERSIS seperti ini, dengan urutan yang sama:

Lembar Kursus:    Judul kursus | Mata pelajaran | Jenjang | Kelas | Konteks
Lembar Bab:       No bab | Judul bab
Lembar Pelajaran: No bab | No pelajaran | Judul pelajaran | Ringkasan | Isi pelajaran | Tujuan pembelajaran | Tingkat berpikir | Media | Transkrip
Lembar Soal:      Kode soal | No bab | No pelajaran | Jenis soal | Pertanyaan | Bacaan | Petunjuk | Kegunaan | Tingkat kesulitan | Kelompok paralel | Identitas soal
Lembar Pilihan:   Kode soal | Pilihan | Teks pilihan | Benar | Alasan | Kode miskonsepsi

Aturan:
1. Lembar Kursus hanya satu baris.
2. Biarkan kosong: Konteks, Media, Transkrip, Jenis soal, Kelompok paralel, Identitas soal dan Kode miskonsepsi.
3. No bab dan No pelajaran berupa angka 1, 2, 3 dan seterusnya. No bab tidak boleh kembar. No pelajaran tidak boleh kembar di dalam bab yang sama.
4. Isi pelajaran ditulis untuk murid, dalam bahasa Indonesia yang baik dan sesuai kelasnya.
5. Tulis setiap isian dalam satu paragraf saja. Jangan memakai baris baru di dalam sel.
6. Tingkat berpikir diisi salah satu dari: Mengingat, Memahami, Menerapkan, Menganalisis, Mengevaluasi, Mencipta.
7. Kode soal ditulis S1, S2, S3 dan seterusnya, tidak boleh kembar, dan dipakai lagi di lembar Pilihan.
8. Kegunaan dikosongkan untuk latihan, atau diisi "Pemetaan awal" atau "Cek penguasaan".
9. Tingkat kesulitan diisi Mudah, Sedang atau Sulit.
10. Petunjuk boleh membantu murid berpikir, tetapi tidak boleh menyebut jawabannya.
11. Setiap soal punya empat pilihan berlabel A, B, C dan D. Tulis hurufnya saja.
12. Di kolom Benar, TEPAT SATU pilihan diisi "Ya". Pilihan lain diisi "Tidak".
13. Setiap pilihan WAJIB punya Alasan: mengapa pilihan itu benar, atau kesalahan berpikir apa yang membuatnya salah.
14. Pilihan yang salah harus masuk akal bagi murid yang keliru, bukan asal salah.
15. Jangan menulis apa pun di luar lima tabel itu.
```

## §C · Perintah B: soal saja, untuk pelajaran yang sudah ada di buku kerja Anda

```text
Anda membantu seorang guru membuat soal pilihan ganda untuk PINTAR. Pakai HANYA materi di bawah. Jangan menyebut nama orang sungguhan dan jangan menyebut murid mana pun. Bila soal cerita memerlukan tokoh, pakai nama rekaan.

Kelas: [misalnya Kelas 4]
No bab: [angka]
No pelajaran: [angka]
Kode soal dimulai dari: [misalnya S11]
Tujuan pembelajaran: [isi]
Banyak soal: [misalnya 10]
Tingkat kesulitan: [Mudah, Sedang atau Sulit]

MATERI:
[tempel materi pelajaran di sini]

Jawab dengan DUA tabel, masing-masing diberi judul nama lembarnya. Baris pertama setiap tabel berisi judul kolom PERSIS seperti ini, dengan urutan yang sama:

Lembar Soal:    Kode soal | No bab | No pelajaran | Jenis soal | Pertanyaan | Bacaan | Petunjuk | Kegunaan | Tingkat kesulitan | Kelompok paralel | Identitas soal
Lembar Pilihan: Kode soal | Pilihan | Teks pilihan | Benar | Alasan | Kode miskonsepsi

Aturan:
1. Biarkan kosong: Jenis soal, Kelompok paralel, Identitas soal dan Kode miskonsepsi.
2. No bab dan No pelajaran sama dengan yang ditulis di atas, di setiap baris.
3. Tulis setiap isian dalam satu paragraf saja. Jangan memakai baris baru di dalam sel.
4. Kode soal dimulai dari kode di atas, lalu naik satu-satu (misalnya S11, S12, S13), tidak boleh kembar, dan dipakai lagi di lembar Pilihan.
5. Kegunaan dikosongkan untuk latihan, atau diisi "Pemetaan awal" atau "Cek penguasaan".
6. Tingkat kesulitan diisi seperti di atas, di setiap baris.
7. Petunjuk boleh membantu murid berpikir, tetapi tidak boleh menyebut jawabannya.
8. Setiap soal punya empat pilihan berlabel A, B, C dan D. Tulis hurufnya saja.
9. Di kolom Benar, TEPAT SATU pilihan diisi "Ya". Pilihan lain diisi "Tidak".
10. Setiap pilihan WAJIB punya Alasan: mengapa pilihan itu benar, atau kesalahan berpikir apa yang membuatnya salah.
11. Pilihan yang salah harus masuk akal bagi murid yang keliru, bukan asal salah.
12. Jangan menulis apa pun di luar dua tabel itu.
```

---

## §D · Notes for the reviewers (English)

**Point 3, common first names in word problems (provisional; R-3 decides the rule for the product):**
- The prompts ask the AI for **invented names**.
- The checklist asks the teacher to replace any name that matches a learner **known at the school** (Sharon's widening), and to avoid real local detail.
- **Neither the prompt nor PINTAR can know a class's names, so the teacher's check is the safeguard.**
- If R-3's rule later blocks names at upload, the guide will name that rule. Until then it promises no check PINTAR does not make.

**The register and terms:**
- «Anda», with «guru» as the reader and «murid» for learners.
- «draf», «Ajukan untuk ditinjau», «Studio › Buat Paket», «Unduh templat Excel» and «Unduh contoh isian»: the product's own labels.
- «ID PINTAR» as PINTAR's own term.
- No «pemberitahuan» or «notifikasi»: DAISY-25 checked.

**Prompt B:** written out in full. The draft's "[the same rules as Prompt A …]" would make teachers assemble a prompt from two pieces.

**Point 5 (paste test): decided.** The prompts ask for one paragraph per cell (see What holds now).

**English version of the guide:** not made. The guide is for Indonesian schools, as the prompts are. Say if the owner wants one.

## §E · Five details in the draft that did not match the product

| # | Draft | Product (`main`) | Now |
|---|---|---|---|
| 1 | «Studio › Unggah» | the nav label is «Buat Paket»; the section is «Unggah buku kerja pelajaran» | «Studio › Buat Paket» |
| 2 | «Unduh templat» | «Unduh templat Excel» | as the product |
| 3 | "submit it for review" | the button is «Ajukan untuk ditinjau» | as the product |
| 4 | Prompt A: «No pelajaran … tidak kembar» | the importer refuses a repeat **within the same chapter** (`lesson_number_repeated`) | rule 3 says so |
| 5 | Prompt B referred to Prompt A's rules | — | written out in full |

**§5's messages are quoted from `studio.paket.masalah.*` as they are.** If any of them changes, the guide changes with it, as with the headers.
