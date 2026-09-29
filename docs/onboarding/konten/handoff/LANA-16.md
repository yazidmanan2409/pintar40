# LANA-16: SMA X Matematika Bab 2, Barisan dan Deret

Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
dkk.), Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, ISBN 978-623-118-558-7,
Bab 2, pp. 35-70 (the ch2 PDF). Its Contoh are worked; Latihan and Uji Kompetensi have no keys,
so every key is mine, and every key is computed. The method, notation and gate are Bab 1's.

## Content

Six text lessons, 25 pages, in the book's order. They address the student as «kamu», as the
book does. Every Contoh states its question before its steps and answers it in the lesson.

1. **Barisan Aritmetika** (A.1)
   - The meja–kursi pattern 4, 6, 8, 10 as value lines; barisan bilangan; U_{1}, …, U_{n}.
   - The definition of barisan aritmetika and b = U_{n} − U_{n−1}; a negative beda.
   - The gedung (20, 24, …) → baris ke-15 = 76; U_{n} = a + (n − 1)b.
   - The book's own unanswered question: 20 people need 9 tables (2n + 2 = 20).
   - Contoh 1 (U_{n} = 3n) and Contoh 2 (b = Rp5.000, a = Rp50.000).
2. **Barisan Geometri** (A.2)
   - The kue halves and the paper folds 2, 4, 8, 16.
   - The definition of barisan geometri and r = U_{n}/U_{n−1}; adding against multiplying.
   - The bacteria: U_{n} = a × r^{n−1}. After 20 hours: U_{11} = 2 × 3¹⁰ = 118.098 (see book
     error 1).
   - Contoh 3 (r = 3) and Contoh 4 (r = 3/2, positive because lengths are; U_{3} = 36 cm).
   - One «Coba pikirkan»: the book's «Berpikir Kritis» on negative ratios.
3. **Deret Aritmetika** (B.1)
   - Jabat tangan 1, 3, 6, 10; the definitions of deret bilangan and deret aritmetika.
   - Gauss's pairing → 5.050, told as «sebuah cerita terkenal», with no age or class.
   - The derivation of S_{n} = n/2 × (2a + (n − 1)b) = n/2 × (a + U_{n}); a check on Gauss.
   - Contoh 5 = 1.695.
4. **Deret Geometri** (B.2)
   - The derivation of S_{n} = a(rⁿ − 1)/(r − 1) = a(1 − rⁿ)/(1 − r), r ≠ 1.
   - The book's question «Apa yang terjadi jika r = 1?» answered: S_{n} = n × a.
   - Contoh 6 = 14.520, with a term-by-term check.
5. **Deret Geometri Tak Hingga** (B.3)
   - The paper pieces: partial sums 1/2, 3/4, 7/8, 15/16.
   - Konvergen (|r| < 1) and divergen (|r| > 1), in the book's words for konvergen.
   - The derivation (1 − r)S = a, S_{∞} = a/(1 − r) for |r| < 1, and why rⁿ → 0 matters.
   - One worked example of my own with a negative ratio: 10 − 5 + 5/2 − … = 20/3.
6. **Bunga Tunggal dan Bunga Majemuk** (C)
   - The OJK definitions of bunga simpanan and bunga pinjaman.
   - Bunga tunggal: Angga's Rp1.000.000 at 5% → 1.050.000 … 1.200.000; barisan aritmetika,
     U_{n} = 1.050.000 + (n − 1) × 50.000.
   - Bunga majemuk: 1.050.000; 1.102.500; 1.157.625; barisan geometri, r = 1,05,
     U_{n} = 1.050.000 × 1,05^{n−1}.
   - The chapter recap.

The Covid table (Eksplorasi 2.6), the Pengayaan on Fibonacci and the Eksplorasi activities are
not question sources.

**Notation**, as in Bab 1:
- «×» and «:»; decimal comma; thousands point; «−» as the minus sign.
- Superscripts for integer and one-letter exponents (3⁹, rⁿ); ^{…} for the rest (r^{n−1},
  1,05^{n−1}); subscripts as _{…} (U_{n}, S_{∞}); never nested.
- Tables as value lines: «tahun ke-2 → 1.050.000 + 50.000 = 1.100.000».

`notasi()` asserts all of this on every lesson, summary, stem, option, rationale and petunjuk. It
also caught one thing I had missed: an option starting with «|r|» reads as a table row. PB8's
options are therefore written «−1 < r < 1» and «r > 1 atau r < −1».

## Every number is proven, every fact is traced

- **Numbers.** Every number in a lesson, key and distractor is computed with exact fractions and
  asserted next to where it is used.
  - The helpers `ua`/`sa`/`ug`/`sg` compute U_{n} and S_{n}.
  - Every sum is added term by term and checked against both of the book's formulas, so the
    formulas themselves are proven on every use.
- **Assertions:** 3.380 with `--kutipan` (3.379 without).
- **FAKTA.** It holds 46 facts (pp. 38-66), each with its page and the book's words. Every
  option names the fact it rests on; computed options mark it with «=». `--kutipan` finds
  **46 of 46** quotations in the book's text.
- **Formulas** were read from the page images (pp. 41, 47, 54-57, 61). The text layer loses
  subscripts, superscripts and fractions.
- **Ten facts are kept only as the book-error record** (`REKAMAN`). No question may rest on them.

## Questions

32 questions: 4 pre-test, 8 post-test and 20 practice. Each has a single answer among four
options, A–D.

- **Answer positions:** A=8, B=8, C=8, D=8. The correct option is never strictly the longest
  (asserted; periksa_mutu agrees).
- **Pre-test:** lessons 1, 2, 3 and 6: beda of 7, 11, 15; rasio of 3, 6, 12; 1 + … + 10;
  bunga tunggal on Rp200.000.
- **Post-test:** covers all six lessons. 6 are Sedang, 1 is Mudah (PB1) and 1 is Sulit (PB2).
- **No reuse of the book's items.** The generator lists every Contoh, Latihan 2.1-2.6 and Uji
  Kompetensi item next to each post-test question's own numbers and asserts that they are
  disjoint:

  | Item | Question | Numbers |
  |---|---|---|
  | PB1 | suku ke-n aritmetika | 5, 9, 13, 17 → U₂₀ |
  | PB2 | which row (n from U_{n}) | 18 chairs, +3, 60 chairs |
  | PB3 | suku ke-n geometri | 2, 6, 18 → U₆ |
  | PB4 | deret aritmetika | cans 3, +2, 12 tiers |
  | PB5 | deret geometri | Rp2.000 doubling, 6 weeks |
  | PB6 | S_{∞} | 18 + 6 + 2 + … |
  | PB7 | bunga majemuk | Rp4.000.000, 10%, 2 years |
  | PB8 | convergence condition | −1 < r < 1 |

  It also asserts that no post-test stem contains a book item's numbers (13 + 16, 120 unit,
  3.240, Rp70.000, 16 cm, 108, 4 + 2 + 1, 4 + 12, 1.000.000, 10.000.000, 2.500.000,
  3.000.000, 324, 9.837, 762, 192, 30.000, 28.500, 64, 32).
- **Misconception codes: 14**, SMA10-M-B2-01…14, all drawn from the distractors. Every code is
  used by at least one distractor (asserted). The workbook's Kode miskonsepsi column is empty.
- **LT8** is deliberately the book's own trap: 3 cells doubling for 5 hours gives U₆ = 96. The
  distractor 48 = U₅ carries the n − 1 misconception.

## Checks

```
$ python3 docs/onboarding/konten/sma10_matematika_bab2.py --kutipan <book text>
SMA10-Matematika-Bab2.xlsx: lessons 6 (25 pages), questions 32 (pre 4, post 8, practice 20), answers A=8 B=8 C=8 D=8
SMA10-Matematika-Bab2-miskonsepsi.csv: 14 codes
facts traced: 46 (pages 38-66)
quotations found in the book's text: 46 of 46; figures read by eye: none
assertions passed: 3380          (3379 without --kutipan)

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SMA10-Matematika-Bab2.xlsx docs/onboarding/konten/SMA10-Matematika-Bab2.paket.json
docs/onboarding/konten/SMA10-Matematika-Bab2.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA10-Matematika-Bab2.paket.json
TOTAL: 0 ERROR, 32 WARNING (WEAK_MISCONCEPTION_LINKAGE 32)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA10-Matematika-Bab2.paket.json --miskonsepsi docs/onboarding/konten/SMA10-Matematika-Bab2-miskonsepsi.csv
questions 32: pre 4, post 8, practice 20; answers A=8 B=8 C=8 D=8; correct option strictly longest in 0
TOTAL: 0 ERROR, 0 WARNING
```

- **Rebuild:** a second run gives a byte-identical package.
- **Regression:**
  - SD5 Bab 1-9, Geografi Bab 1-4 and SMA10 Bab 1 re-run and pass.
  - Their xlsx files were restored, because only the timestamps change.
  - No tracked file changed.
- `npm run lint`: 0 errors and the 2 warnings that were already there.

## Book errors and inconsistencies

None is copied into the workbook; `DILUAR` markers assert that the wording is absent.

1. **p. 47, Eksplorasi 2.4 (bacteria):** it counts «20 jam : 2 jam = 10 kali → n = 10» and
   stops at U₁₀ = 2 × 3⁹ = 39.366, although U₁ = 2 is the starting count.
   - Ten divisions after U₁ reach U₁₁ = 2 × 3¹⁰ = 118.098. U₁₀ is the count after 18 hours
     (asserted).
   - The lesson gives U_{11} and says why. LT8 practises exactly this step.
2. **p. 65, Eksplorasi 2.8 table:** the 5% interest is computed as «50% × 1.000.000 = 50.000»,
   in all four rows. 50% would be 500.000 (asserted). The lesson writes 5%.
3. **p. 60:** for |r| < 1, «nilai rⁿ makin kecil, namun selalu merupakan bilangan positif».
   - This is false for negative r: (−1/2)³ < 0 (asserted).
   - The lesson says rⁿ «makin dekat ke 0» and works a negative-ratio example.
4. **p. 61, divergent series:** «Sₙ makin lama makin besar … Dikatakan nilai Sₙ = ±∞».
   - For r < −1 the partial sums swing in sign: 1, −1, 3, −5 for r = −2 (asserted).
   - r = ±1 falls under neither heading.
   - The lesson says only that the sum does not tend to a fixed value, and answers the book's own
     «Apa yang terjadi jika r = 1?» separately.
5. **p. 52, Gauss:** «Ketika duduk di kelas 4 SD … yang saat itu masih berusia 10 tahun». The
   anecdote is traditional and its details vary between sources. The lesson keeps the method,
   told as «sebuah cerita terkenal», with no class or age.
6. **p. 53:** the illustration writes «50.50» for 5.050.
7. **p. 58, Contoh 6:** «ratio» for rasio.
8. **p. 66, Eksplorasi 2.9:** «setelah disimpan  tahun» has lost its n, and the answer line
   reads «U1 = …» where Uₙ is meant.
9. **p. 64, Latihan 2.5 no. 10:** with π = 22/7, the smallest area 154 cm² gives r = 7, but
   1.368 cm² gives no whole radius. 1.386 cm² would give r = 21 (asserted). This is probably a
   digit swap.
10. **p. 56, Eksplorasi 2.6:** the Covid-19 table (4, 12, 36, 108, 324 patients in
    January-May 2020) is presented as data «dari Gugus Covid-19 kota tersebut». It is plainly
    hypothetical. It is kept out, and so are Latihan 2.5 no. 8's Covid figures.

Checked and consistent (no error):
- Latihan 2.3 no. 2 gives n = 7.
- Latihan 2.3 no. 3 gives n = 7 and Y = 96.
- Uji Kompetensi 4 gives 638.
- Uji Kompetensi 5 gives S = 1.

## Questions for the coordinator

None.
