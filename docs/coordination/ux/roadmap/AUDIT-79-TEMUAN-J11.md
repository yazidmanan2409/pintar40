# Ruling 79 audit · J11, reading the school: findings (Daisy, 24 Nov 2026)

> **What holds now:**
> - **J11 walked** with the builder's harness (`audit/perjalanan/j11.mjs`), run locally on the audit world at 1280, 390 and 320, as W18's Kepala sekolah Retno Wulandari. **Every walk reached its last screen.**
>   - **Steps:** Pimpinan's page → a class with figures (8P) → «Belum cukup bukti» (8R) and «Kesiapan bukti» → the school summary → its print view and PDF.
>   - **Visual pass:** /pimpinan re-read at 390 in viewport sections (0 px sideways overflow).
> - **Captures:** `audit79-j11/`.
> - **2 findings, both Improvement.**
> - **L-37 holds:** the scope line «Angka dihitung … dari semua bukti sekolah ini, di setiap tahun ajaran, sampai saat itu.» sits on the same page as each withheld domain, named with its reason («… belum ditampilkan karena masing-masing dikerjakan kurang dari 10 murid.», «… karena ada murid yang pindah kelas lalu mengerjakannya lagi …»). Every «semua» sentence was recorded; the only one is that scope line, which is true.
> - **Also holds:**
>   - the readiness bands say what they are not («Pita tetap PINTAR … Bukan batas ketuntasan sekolah dan tidak menentukan sertifikat.»);
>   - «Belum cukup data» names what is missing and the threshold («Sekarang 1 murid; perlu 5»);
>   - nothing in the leader's view ranks or names learners;
>   - the tone towards teachers and learners is neutral.

## Improvement

| # | Finding | Siblings (same fact) | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J11-1 | In /pimpinan's «Capaian kompetensi», a withheld domain shows «— · 10 murid» with no reason beside it. The page's only legend (section C) says «Tanda — berarti data belum cukup». That is false for this row: 10 learners is enough, and it is withheld because a learner moved class (privacy). A leader is led to think more evidence is needed | **Disagree.** The school summary names the true reason («… karena ada murid yang pindah kelas …»); /pimpinan's «—» and legend don't | C-6 (one fact, words chosen per screen) | D, B | Under each «—», give its reason in a few words: «belum ditampilkan: kurang dari 10 murid» or «belum ditampilkan: menjaga hasil murid yang pindah kelas». The legend: «Tanda — berarti angka belum ditampilkan; alasannya tertulis di bawahnya.» |
| J11-2 | «Capaian kompetensi» ends with «dari 10» under «Rata-rata penguasaan pada tiap ranah yang diukur.», which doesn't say what it counts | The «Peserta» card uses «dari 14» clearly under its own number | — | H | «dari 10 ranah» (or remove it if it repeats the count) |

## Left for the builder

- The EN pass at 1280 (the harness runs it in CI);
- the screen reader, throttled and reduced-motion passes;
- the PDF (`cetak.pdf`) compared against the screen, which is a visual check from the builder's artifact.
