# C3 evaluation · request prompt v2

The text between the markers is sent **byte-identical** to every provider:
- the system or instruction slot is empty, and the whole request is one user message;
- `{{MATERIAL}}` is replaced by the chapter's frozen material file;
- `kit.mjs request` writes the exact bytes and their SHA-256.

**v2 (Daisy, 9 Nov, `TINJAUAN-89374424.md` §3, on `ux-1/daisy-experience` `72c13cd4`):**
- no direct address (the owner's «Anda» ruling; neutral or a character);
- the JSON fields listed in the text, so that providers without a structured-output feature receive the same
  conditions;
- «pengecoh» (Studio's word);
- Indonesian number and money formats;
- everyday Indonesian contexts with varied names;
- «Kelas 5».

Sharon confirms that the field list matches `item-schema.json` before the paid run. Known difference from a real
Studio draft: no difficulty level is asked for. v1 is kept for the record.

<!-- BEGIN PROMPT -->
Anda membantu seorang guru SD menyusun soal pilihan ganda untuk Matematika Kelas 5. Soal Anda adalah DRAF: seorang guru akan memeriksa, memperbaiki, dan menyetujui setiap soal sebelum dipakai.

Bahan di bawah berisi tujuan pembelajaran bab ini, miskonsepsi yang sudah dikenal, dan materi pelajarannya. Pakai hanya bahan ini.

Tugas: susun tepat 15 soal pilihan ganda untuk bab ini.

Aturan setiap soal:
1. Bahasa Indonesia yang baku, jelas, dan sesuai untuk murid Kelas 5 SD. Jangan menyapa murid secara langsung; tulis soal dengan kalimat netral atau dengan tokoh, misalnya «Rina mengumpulkan …».
2. Pokok soal (stem) tidak ambigu dan dapat dijawab dari materi.
3. Tepat empat pilihan berlabel A, B, C, D. Tepat satu pilihan benar.
4. Setiap pengecoh (pilihan salah) mewakili satu miskonsepsi yang nyata: pakai kode dari daftar miskonsepsi bila cocok; bila tidak ada yang cocok, tulis kode «BARU» dan jelaskan miskonsepsinya dalam satu kalimat. Tidak boleh ada pengecoh yang sebenarnya juga benar.
5. Setiap soal menilai satu tujuan pembelajaran; tulis kodenya (misalnya B1-T2). Sebarkan soal ke semua tujuan bab ini.
6. Tulis satu kalimat alasan mengapa kunci jawaban benar.
7. Jangan menyalin contoh dari materi apa adanya; buat bilangan atau konteks baru yang setara.
8. Tulis bilangan dan uang dengan cara Indonesia: koma untuk desimal (2,5) dan titik untuk ribuan (Rp15.000). Pakai konteks sehari-hari di Indonesia dan nama tokoh yang beragam.

Jawab hanya dengan JSON, tanpa teks lain. Bentuknya: satu objek dengan «items», berisi 15 soal. Setiap soal memuat «stem»; «options» (empat objek dengan «label» A–D dan «body»); «key» (A–D); «distractors» (tiga objek dengan «label», «misconception_code», dan «misconception»); «objective_code»; dan «key_rationale».

{{MATERIAL}}
<!-- END PROMPT -->
