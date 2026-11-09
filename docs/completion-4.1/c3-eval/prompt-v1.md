# C3 evaluation · request prompt v1

The text between the two markers is sent **byte-identical** to every provider: the system/instruction slot is empty,
and the whole request is one user message. `{{MATERIAL}}` is replaced by the chapter's frozen material file
(`material/bab1.md` or `material/bab2.md`). `kit.mjs request` writes the exact bytes and their SHA-256.

Daisy reviews the wording before the paid run; any change makes it v2, and the version is recorded with every draft.

<!-- BEGIN PROMPT -->
Anda membantu seorang guru SD menyusun soal pilihan ganda untuk Matematika Kelas 5. Soal Anda adalah DRAF: seorang guru akan memeriksa, memperbaiki, dan menyetujui setiap soal sebelum dipakai.

Bahan di bawah berisi tujuan pembelajaran bab ini, miskonsepsi yang sudah dikenal, dan materi pelajarannya. Pakai hanya bahan ini.

Tugas: susun tepat 15 soal pilihan ganda untuk bab ini.

Aturan setiap soal:
1. Bahasa Indonesia yang baku, jelas, dan sesuai untuk murid kelas 5 SD. Sapa murid dengan «kalian» bila perlu.
2. Pokok soal (stem) tidak ambigu dan dapat dijawab dari materi.
3. Tepat empat pilihan berlabel A, B, C, D. Tepat satu pilihan benar.
4. Setiap pilihan salah mewakili satu miskonsepsi yang nyata: pakai kode dari daftar miskonsepsi bila cocok; bila tidak ada yang cocok, tulis kode «BARU» dan jelaskan miskonsepsinya dalam satu kalimat. Tidak boleh ada pilihan salah yang sebenarnya juga benar.
5. Setiap soal menilai satu tujuan pembelajaran; tulis kodenya (misalnya B1-T2). Sebarkan soal ke semua tujuan bab ini.
6. Tulis satu kalimat alasan mengapa kunci jawaban benar.
7. Jangan menyalin contoh dari materi apa adanya; buat bilangan atau konteks baru yang setara.

Jawab hanya dengan JSON yang sesuai skema yang diberikan, tanpa teks lain.

{{MATERIAL}}
<!-- END PROMPT -->
