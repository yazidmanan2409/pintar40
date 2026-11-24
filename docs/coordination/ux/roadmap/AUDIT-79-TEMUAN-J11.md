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

## The passes walked locally (24 Nov 21:50): EN, screen reader, throttled, reduced motion, the print view

I ran the builder's harness `audit/perjalanan/j11.mjs` at `6b248975`, at 1280, once per pass. **Every pass reached its last screen.**

### Holds
- **EN:**
  - the school summary and its print view are fully in English, apart from the school's own content names (objectives, cohorts);
  - every withheld figure keeps its reason («not shown because each was taken by fewer than 10 students», «… a student moved class and took it again …»);
  - «Evidence that is not yet enough is not a poor result.»
- **Screen reader:**
  - the dot chart is exposed as a list with each objective's figure, the weak one named («… 40% Perlu penguatan»);
  - each «Bagian» has its heading;
  - the scope line is read first.
- **Throttled:** L1 takes 16 s, against 0.7–1.3 s for the later steps. The figures are the same.
- **Reduced motion:** nothing animates.
- **The print view (EN)** carries the scope line and every withheld reason. The edge-to-edge print view in the capture is media emulation; the PDF has its margins.

### New findings

| # | Finding | Siblings | Cause | Dim. | Fix |
|---|---|---|---|---|---|
| J11-3 | **The same letters name different sections on two pages for the same person.** On /pimpinan: A Keputusan · B Yang didukung bukti · C Penguasaan per topik · D Per kelas · **E Kesiapan bukti** · F Perlu diketahui. On the school summary: A Capaian kompetensi · B Angka utama · **C Perbandingan angkatan · D Kesiapan bukti** · E Apa berikutnya. The summary's own E says «Bagian D di atas, «Kesiapan bukti» …», which on /pimpinan is E. | **Disagree** (the letter for one section) | C-6 | H | Either drop the letters on the summary (its headings are enough), or keep one letter per section across both pages |
| J11-4 | Screen reader: Bagian C on the summary exposes an **empty list** before its three «belum ditampilkan» lines. And Bagian A and D are `region`s while B, C and E are not. | — | — | G | Render the withheld cohorts as the list's items (or drop the empty list). Make every Bagian a region, or none. |

**J11's «left for the builder» lines are closed**, except the PDF-to-screen visual comparison, which is the builder's artifact (`cetak.pdf`). Mine matched the screen content in EN.

## Capture judgement · the builder's committed J11 (`1ed2d250/j11`, `eccb71ad`), 25 Nov 00:05

Seven walks, every one reaching its last screen. They match my local passes, and J11-1 to J11-4 stand.
- **390 and 320 hold:** /pimpinan stacks every Bagian at 320 without sideways scroll. The topic table becomes per-topic lists (one class per line, with its count and need). The summary and its print view keep every withheld reason.
- **J11's «left for the builder» lines are closed**, including the PDF against the screen (`cetak.pdf`, matching).
