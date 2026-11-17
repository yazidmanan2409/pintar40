# The judges' guide (E, local evaluation): Indonesian review (Daisy, 17 Nov 2026)

> **What holds now:**
> - **PASS with edits.** The meaning of every rule is unchanged. The edited text is §2, ready to send.
> - **One question for Bob before sending** (Q-1). **One practical risk** in the CSV step (Q-2).
> - **The column names stay as they are:** `benar`, `keselarasan`, `pengecoh`, `bahasa`, `beban_tinjau`, `alasan`. They are clear to a teacher, and the guide now explains `beban_tinjau` in words.
> - **Read:** `docs/completion-4.1/e-local/PANDUAN-JURI.md` at `9e3589ed` on `claude/bob-41-master-plan`.

## 1 · Edits, and why

| # | Draft | Edited | Why |
|---|---|---|---|
| 1 | The header: «Draf … ditinjau Daisy sebelum dikirim», and «rubrik … (`E-DECISION-PACK.md` §4 dan rencana §5)» | Removed from the judges' copy. The internal header stays in the repository only | File names and our reviewers mean nothing to a teacher |
| 2 | «pertanyaan (stem)» | «pokok soal (pertanyaannya)» | «pokok soal» is the term teachers meet in item-writing guidance. «stem» is English |
| 3 | The 0–2 scale | Adds one line: «Untuk semua kolom: makin tinggi nilainya, makin baik.» | `beban_tinjau` runs 2 = best. Without the line, "burden 2" reads as *more* burden |
| 4 | «beban_tinjau» explained only by its values | Adds «(seberapa banyak perbaikan yang diperlukan)» | The column name stays. The phrase says what it means |
| 5 | «Kolom alasan wajib diisi untuk setiap soal: satu atau dua kalimat, terutama bila …» | «Kolom **alasan** wajib diisi untuk setiap soal, satu atau dua kalimat. Bila Anda memberi nilai 0 atau 1 di kolom mana pun, sebutkan kekurangannya.» | "Required for every question, especially when …" reads as half-required. The rule (required for all) is unchanged |
| 6 | «… juri ketiga bila ada perbedaan penilaian» | «… J3 bila penilaian J1 dan J2 berbeda» | The names used everywhere else |
| 7 | «soal yang nilai 0–2-nya berbeda **dua** angka» | «soal yang, di salah satu kolom 0–2, nilainya dari J1 dan J2 berbeda **dua** angka (misalnya 0 dan 2)» | The draft's phrase is hard to parse. The example fixes it |
| 8 | «sendiri-sendiri» | «secara mandiri» | More natural in a work instruction |
| 9 | «(Kamis, 09.00–12.00 WIB)» | «(Kamis, 19 November 2026, 09.00–12.00 WIB)» | The date in the text, once |
| 10 | «Bila sebuah soal tidak muncul di lembar Anda, itu disengaja» | «Bila lembar Anda berisi kurang dari 60 soal, itu disengaja» | §1 promises 60. This says what the judge will actually notice |

## 2 · The edited guide (to send)

```markdown
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

Soal-soal ini disusun dengan bantuan AI. **Anda tidak diberi tahu sumbernya, dan tidak perlu menebaknya.** Nilailah setiap soal seperti Anda menilai soal yang diajukan rekan guru: apakah soal ini layak dipakai untuk murid Anda?

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
  - soal yang ditandai oleh pemeriksa kunci, dengan catatan alasannya. Catatan itu hanya bahan pertimbangan, sama bobotnya dengan alasan seorang juri;
  - soal yang, di salah satu kolom 0–2, nilainya dari J1 dan J2 berbeda **dua** angka (misalnya 0 dan 2).

  Untuk soal-soal itu saja, J3 mengisi kolom yang diminta. **Keputusan J3 untuk kolom benar bersifat final.**
- **Waktu:** kira-kira 2–3 jam untuk J1 dan J2 (Kamis, 19 November 2026, 09.00–12.00 WIB), dan kira-kira satu jam untuk J3 (hari yang sama, mulai 13.00 WIB).

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
- Bila lembar Anda berisi kurang dari 60 soal, itu disengaja. Soal yang formatnya rusak tidak ditampilkan, dan sudah dihitung terpisah.
- Pertanyaan tentang cara menilai dapat diajukan kepada Pak Yazid. Pertanyaan tentang isi sebuah soal jangan didiskusikan.

Terima kasih atas waktu dan keahlian Anda.
```

## 3 · For Bob before sending

- **Q-1 · «pemeriksa kunci».**
  - A judge will ask: who or what is that?
  - If it is an automatic check, say «pemeriksaan kunci otomatis». If it is a person, «seorang pemeriksa kunci».
  - I left the draft's word, because I do not know which, and the rubric is frozen.
- **Q-2 · The CSV on an Indonesian Excel.**
  - Excel set to Indonesian saves CSV with **semicolons** («;») as separators, because the comma is the decimal mark there.
  - It may also change the text encoding, which would garble «alasan» with accented or curly characters.
  - **Either accept both separators and UTF-8 or Windows-1252 on import, or send the sheet as `.xlsx`.**
  - This is not a language point, but the judges will meet it on Thursday.

## 4 · Anticipation

Not product defects. Q-2 was found by **question 5** (where it renders: a teacher's own Excel, set to Indonesian).
