# Panduan penilaian untuk juri · Evaluasi soal PINTAR

Untuk tiga guru juri (J1, J2, J3). Panduan ini menjelaskan aturan penilaian yang sudah ditetapkan; panduan ini tidak mengubah aturan apa pun.

## 1 · Apa yang Anda nilai

Anda menerima 60 soal pilihan ganda untuk Matematika SD Kelas 5, dari dua bab:
- **Bab 1:** Pola Bilangan;
- **Bab 2:** Data Sederhana.

Setiap soal mencantumkan:
- tujuan pembelajarannya;
- pokok soal (pertanyaannya);
- empat pilihan jawaban;
- kunci jawaban, dengan alasan singkat;
- untuk setiap pengecoh (pilihan yang salah), pemahaman keliru yang diwakilinya.

Nilailah setiap soal apa adanya, seperti Anda menilai soal yang diajukan rekan guru: apakah soal ini layak dipakai untuk murid Anda?

## 2 · Lima hal yang dinilai untuk setiap soal

| Kolom | Yang dinilai | Nilai |
|---|---|---|
| **benar** | **Ketepatan isi.** Kuncinya benar, pokok soalnya tidak ambigu, dan **tepat satu** pilihan yang benar | **1** = ya; **0** = tidak |
| **keselarasan** | **Kesesuaian dengan tujuan.** Soal mengukur tujuan yang tertulis, pada tingkat yang tepat untuk Kelas 5 | 0, 1 atau 2 |
| **pengecoh** | **Mutu pilihan yang salah.** Masuk akal bagi murid, masing-masing berasal dari pemahaman keliru yang nyata, dan tidak ada yang ternyata juga benar | 0, 1 atau 2 |
| **bahasa** | **Bahasa Indonesia.** Benar, wajar, sesuai untuk anak Kelas 5, dan memakai istilah yang lazim di kelas | 0, 1 atau 2 |
| **beban_tinjau** | **Seberapa banyak perbaikan yang diperlukan** sebelum Anda mau menyetujui soal ini | **2** = setujui apa adanya; **1** = cukup suntingan ringan; **0** = harus ditulis ulang atau ditolak |

**Untuk semua kolom: makin tinggi nilainya, makin baik.**

**Patokan untuk nilai 0–2:**
- **2:** baik; tidak ada yang perlu diperbaiki untuk hal ini.
- **1:** ada kekurangan kecil yang mudah diperbaiki.
- **0:** kekurangannya serius, atau hal ini tidak terpenuhi.

**Tentang kolom benar.** Beri **0** bila:
- kuncinya salah;
- ada lebih dari satu jawaban yang benar;
- tidak ada jawaban yang benar;
- pokok soalnya bisa dibaca dengan dua cara sehingga jawabannya berubah.

Nilai 0 di kolom ini dianggap kesalahan serius, jadi periksalah dengan teliti. Bila ragu, hitung sendiri jawabannya.

**Kolom alasan wajib diisi untuk setiap soal,** satu atau dua kalimat. Bila Anda memberi nilai 0 atau 1 di kolom mana pun, sebutkan kekurangannya. Alasan Anda akan dibaca oleh J3 bila penilaian J1 dan J2 berbeda.

## 3 · Cara bekerja

- **J1 dan J2** menilai **semua** soal, kelima kolomnya, **secara mandiri**.
  - Jangan berdiskusi dengan juri lain tentang soal mana pun sampai lembar Anda diserahkan.
  - Jangan memakai alat AI untuk membantu menilai.
- **J3** tidak menilai semua soal. Setelah lembar J1 dan J2 dicatat, J3 menerima daftar soal yang perlu diputuskan, bersama alasan kedua juri:
  - soal yang nilai **benar**-nya berbeda antara J1 dan J2;
  - soal yang ditandai oleh pemeriksa kunci, dengan catatan alasannya. Pemeriksa kunci adalah pemeriksaan terpisah oleh tim PINTAR: setiap soal dijawab tanpa melihat kuncinya, lalu ditandai bila jawabannya berbeda dari kunci. Catatan itu hanya bahan pertimbangan, sama bobotnya dengan alasan seorang juri;
  - soal yang, di salah satu kolom 0–2, nilainya dari J1 dan J2 berbeda **dua** angka (misalnya 0 dan 2).

  Untuk soal-soal itu saja, J3 mengisi kolom yang diminta. **Keputusan J3 untuk kolom benar bersifat final.**
- **Waktu:** kira-kira 2–3 jam untuk J1 dan J2. J3 bekerja setelah lembar J1 dan J2 dicatat, kira-kira satu jam. Pak Yazid akan menyampaikan tanggal dan jamnya.

## 4 · Mengisi lembar nilai

Anda menerima lembar nilai dalam bentuk tabel (CSV, dapat dibuka dengan Excel atau Google Sheets), satu baris per soal:

| Kolom | Isi |
|---|---|
| `item_id` | Sudah terisi, misalnya `B1-001`. Jangan diubah |
| `juri` | Sudah terisi: J1, J2 atau J3 |
| `benar` | 0 atau 1 |
| `keselarasan`, `pengecoh`, `bahasa`, `beban_tinjau` | 0, 1 atau 2 |
| `alasan` | Kalimat Anda |

Simpan sebagai CSV dengan nama yang sama, lalu kirimkan kepada Pak Yazid.

## 5 · Yang perlu diingat

- Nilailah soalnya, bukan gaya penulisnya.
- Bila lembar Anda berisi kurang dari 60 soal, itu disengaja dan sudah diperhitungkan.
- Pertanyaan tentang cara menilai dapat diajukan kepada Pak Yazid. Pertanyaan tentang isi sebuah soal jangan didiskusikan.

Terima kasih atas waktu dan keahlian Anda.
