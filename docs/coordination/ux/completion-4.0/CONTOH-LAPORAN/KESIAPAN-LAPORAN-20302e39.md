# Short re-check on 20302e39 (Daisy, 9 Nov 2026)

**Commit reviewed:** `claude/awesome-rubin-bqxp6p` at exactly **`20302e39`**. The branch has since moved to `e6758218`, which I did not review. I only read the branch. My previous report was on `e8a5efb9` (`8dac7681`); the dispositions are in matrix §13.

**Evidence:** `verifikasi-20302e39/`. Screenshot names refer to `layar/<page>-<language>-<width>.jpg` (full page), and `…-layar-<width>.jpg` for the first screen; `teks.json` holds each page's text.

## How this was verified

1. The stack was rebuilt from nothing (`supabase db reset`), then `laporan-lokal.mjs`.
2. `next build` and `next start -p 3999`.
3. **The real recalculation, twice** (`alat/vD14.sql`, with your `\gset` correction; local only). For learner `lap-5b-10` in 5B:
   - a corrected key, then `recompute_result` by a platform SYSTEM_ADMIN on her **Bab 1 Uji Penguasaan** (sealed 0% → 12.5%, `per_domain` re-scored);
   - the same for her **Bab 2 Pemetaan Awal** (sealed 0% → 25%).
4. Her chapter results, «Hasil belajar» and her Bab 2 reading map, in Indonesian and English, at 1280 and 390 px. The Admin sekolah's Ringkasan Sekolah at 1280 and 390 px (`alat/vO.mjs`).

**Not re-run:** the full 120-view walk. Nothing in these items is shared behaviour beyond the pages captured.

## Answers

| # | Item | Answer |
|---|---|---|
| 1 | B1, the gate below its minimum | **Confirmed**, with one sentence left over (C1) |
| 2 | B2 | **Confirmed** |
| 3 | B3 | **Confirmed** |
| 4 | «hasil» wording on a shown gate | **Not seen:** this world has one applicable sitting, so the gate stays below its minimum. The copy reads correctly |
| 5 | The mover sentence | **Not seen:** this world has no mover. The copy reads correctly |
| 6 | O-B3 | **Confirmed in meaning, position and English.** One comprehension finding for the learner's wording (C2) |

## 1. B1

**Confirmed** (`admin-sekolah-1280`, B): «Soal wajib · Belum cukup data untuk menampilkan angka ini. Dari hasil Uji Penguasaan yang memuat soal wajib, baru 1 murid; perlu 10. 80 hasil Uji Penguasaan lain berasal dari uji tanpa soal wajib, jadi tidak dihitung, baik sebagai lulus maupun tidak.» This draw has 80, not 51.

**C1, one sentence left over.** The card then ends with the generic «Angka ini muncul setelah cukup murid menyelesaikan Uji Penguasaan.» Here that is not true: 80 more sittings have been finished and none counts. Use «…setelah cukup murid mengerjakan Uji Penguasaan yang memuat soal wajib.», or drop the line, since the sentence before already says what is missing.

## 2. B2

**Confirmed** (`admin-sekolah-1280`, E): «PINTAR menunjukkan; langkah berikutnya Anda yang memutuskan. Bagian D di atas, «Kesiapan bukti», menyebut kelas yang buktinya belum cukup.» Section D is «Kesiapan bukti» on the same page.

## 3. B3

**Confirmed** (`murid-bab-uji-id-1280`, `-390`): «Penguasaan 0% · Terjawab tepat **0 dari 8** soal», both sealed. The notice now names the count: «Hasil ini kemudian dihitung ulang. Penguasaan dan jumlah jawaban tepat di atas, serta sertifikat Anda, tetap hasil yang disegel; laporan guru dapat menampilkan hasil yang dihitung ulang.»

«Hasil belajar» agrees (`murid-hasil-id-1280`):
- Bab 1 reads «0 dari 8 soal · Uji Penguasaan: 0%».
- Bab 2's recalculated Pemetaan Awal keeps its sealed «Pemetaan Awal: 0%».

## 4. The shown gate's «hasil» wording

**Not seen.** `laporan.sekolah.dasar_gerbang` reads «Dari {s} hasil Uji Penguasaan yang memuat soal wajib, milik {n} murid.» It names the unit (results) and the learners, and matches the withheld line's «hasil Uji Penguasaan lain». The English «From {s} Mastery Check results that hold required items, from {n} students» is fine; «that include required items» would read more naturally.

## 5. The mover sentence

**Not seen.** `laporan.sekolah.ranah_tertahan.pindah.*` and `…angkatan_belum.pindah` read clearly («…karena ada murid yang pindah kelas lalu mengerjakannya lagi, sehingga hasil murid itu dapat terbaca dari angka sekolah»). They say why without naming who.

## 6. O-B3

**Position and wording:** under «Tinjau kembali», above question 1, at 1280 and 390 px (`murid-bab-uji-id-390`, `-en-390`): «Tanda «Sudah tepat» dan «Belum tepat» pada soal-soal di bawah mengikuti jawaban benar yang sudah diperbaiki, jadi bisa berbeda dari hasil yang disegel di atas (0 dari 8 soal tepat). Hasil yang disegel dan sertifikat Anda tidak berubah.» It is set as a quiet grey panel, not a warning.

**Below it:** question 4 now says «Sudah tepat» beside the sealed «0 dari 8».

**English:** it names the badges the learner sees, «That is right» and «Not right yet».

**The reading map** (`murid-peta-id-390`, `-en-1280`) shows its note at the top, before the first card: «Peta ini mengikuti jawaban benar yang sudah diperbaiki, jadi bisa berbeda dari hasil Pemetaan Awal yang disegel. Hasil yang disegel tidak berubah.»

**Nothing implies that the sealed result or the certificate changed.** The figure, the count, the per-objective «0/2» and the certificate are each said to stay. Only the badges and the map are said to follow the corrected answers.

**Can a first-time learner tell the two apart?** The structure does it: the sealed card above, the note at the boundary, and the corrected badges below.

**C2, the wording, for Dr Gladys.** The distinction rests on one word, **«disegel»**, used four times across the learner's three notices. A Grade 5 learner does not know what a sealed result is. The teacher's page needs the word; the learner's does not. Suggested wording for the learner, with the same meaning:
- **Review:** «Tanda «Sudah tepat» dan «Belum tepat» di bawah memakai jawaban benar yang sudah diperbaiki, jadi bisa berbeda dari hasil di atas (0 dari 8 soal tepat). Hasil di atas dan sertifikat Anda tetap seperti semula.»
- **Map:** «Peta ini memakai jawaban benar yang sudah diperbaiki, jadi bisa berbeda dari hasil Pemetaan Awal Anda. Hasil itu tetap seperti semula.»
- **Card notice:** «Hasil ini kemudian dihitung ulang. Penguasaan dan jumlah jawaban tepat di atas, serta sertifikat Anda, tetap seperti semula; laporan guru dapat menampilkan hasil yang dihitung ulang.»

**English, also C2:** the learner's notes say «the corrected answer key», while the Indonesian avoids «kunci jawaban» on purpose (20302e39, DAISY-26). «the corrected answers» would keep the two languages saying the same thing.

## Not seen

- **Staging.**
- **NVDA / TalkBack.**
- **A4 print of these pages.**
- **PD reports.**
- **A shown safety gate** (item 4).
- **A mover** (item 5).
- **The head after `20302e39`.**
- **The owner's acceptance.**
