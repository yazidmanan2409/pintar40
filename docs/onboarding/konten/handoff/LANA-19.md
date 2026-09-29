# LANA-19: SMA X Matematika Bab 5, Persamaan dan Fungsi Kuadrat

Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
dkk.), Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, ISBN 978-623-118-558-7,
Bab 5, pp. 129-176 (the ch5 PDF, 48 pages). The chapter has no numbered Contoh. Its worked
examples are:
- the factorisations (pp. 136-142);
- the completed squares (p. 144);
- the new-roots examples (pp. 146-147);
- Gambar 5.10 and K-L-M (pp. 157-162);
- the fence and the book price (pp. 165-166).

These are checked here. Latihan 5.1-5.10 and the Uji Kompetensi have no keys, so every key is
mine, and every key is computed. The method, notation and gate are Bab 1's.

## Also in this commit: the LT2 correction to Bab 4 (your LANA-18 point)

- **Before:** LT2 C («6») said «Ruas kanan dikurangkan (7 − 1) sambil ruas kiri dijumlahkan.
  Jumlahkan kedua ruas: 2x = 8.»
  - As you noted, that procedure gives 2x = 6 and x = 3, which is option A, not 6.
- **After:** «Hasil 7 − 1 = 6 langsung dianggap nilai x. Jumlahkan kedua persamaan: 2x = 8, jadi
  x = 4.»
  - The text now sits in `LT2_C`.
  - An assertion checks 7 − 1 = 6 ≠ 4, 7 + 1 = 8, 8 : 2 = 4, that the text names 7 − 1 = 6 as
    the value taken for x, and that the old wording is gone.
- **Diff:** the rebuilt `SMA10-Matematika-Bab4.paket.json` differs from `8e43079` in that one
  `rationale` string only (json diff, 1 line).
- **Bab 4 after the fix:**
  - 3.317 assertions with `--kutipan` (3.316 without), 25 of 26 quotations;
  - periksa_mutu 0/0 with the CSV;
  - the package rebuilds byte-identically;
  - keys, options and positions are unchanged.
- **For Bab 5** I kept this in mind: every distractor has an assertion that computes the
  distractor's own value by the procedure its rationale describes. For example, PB6's (−3, 32)
  is f(b/(2a)) = f(−3) = 32, and PB3's (x + 6)² = 43 is 7 + 36.

## Content

Six text lessons, 25 pages. They address the student as «kamu». Every worked example states its
question first and answers it, including the book's open explorations.

1. **Persamaan Kuadrat**
   - ax² + bx + c = 0 with a ≠ 0; b and c may be 0; polynomial of degree 2; akar.
   - Recognising examples.
   - Sisi persegi: x² = 16 → 4 m, with −4 rejected.
   - Two numbers: product 63, sum 16 → x² − 16x + 63 = 0 → 7 and 9.
   - Menjabarkan.
2. **Menyelesaikan dengan Faktorisasi**
   - Ubin: x² + 3x + 2 = (x + 1)(x + 2).
   - The zero-product step; a(x − x_{1})(x − x_{2}).
   - For a = 1: product c, sum b.
   - The root −3 example gives b = 5.
   - For a ≠ 1: 3x² + 13x − 10 by the ac-method, splitting the middle term → (3x − 2)(x + 5).
   - 2x² − 18x = 2x(x − 9), and a warning not to divide by x.
3. **Melengkapi Kuadrat Sempurna**
   - (x + m)² = x² + 2mx + m², so add (b/2)².
   - x² + 14x = 32 → (x + 7)² = 81 → 2 and −16.
   - x² + 4x + 2 = 0 → −2 ± √2.
   - For a ≠ 1: divide first.
4. **Rumus Kuadrat dan Diskriminan**
   - The formula.
   - Eksplorasi 5.1's vehicle, answered: v² + 24v − 2.560 = 0, D = 104², v = 40 km/jam,
     checked as 8 h − 5 h = 3 h.
   - The discriminant cases, with D < 0 stated as «tidak ada akar real».
   - x_{1} + x_{2} = −b/a and x_{1} × x_{2} = c/a.
   - The 2p, 2q example (x² + 8x + 12 = 0), with pq = c/a.
5. **Grafik Fungsi Kuadrat**
   - x² as value lines.
   - The roles of a, c and D.
   - The axis x = −b/(2a); the vertex, also as D/(−4a).
   - Gambar 5.10's f(x) = x² − 2x − 3 in full: (0, −3); (−1, 0), (3, 0); x = 1; (1, −4).
   - The three forms.
6. **Mengonstruksi Fungsi Kuadrat dan Nilai Optimum**
   - K-L-M both ways.
   - Eksplorasi 5.10's fence, answered: 6x + 4y = 96, L = 72x − 4,5x², so x = 8, y = 12 and
     288 m².
   - The book price, answered: R = 900x − 0,25x², so 1.800 buku and Rp810.000.
   - The chapter recap.

Not used as sources:
- the Pengayaan (nrich);
- the fuel-economy regression data (Tabel 5.2);
- the Babylonian history and the electricity tariff;
- the ubin colour conventions;
- the graph-picture items (Uji Kompetensi 7).

**Notation:**
- «−» as the minus sign; squares as Unicode superscripts (x²).
- Subscripts as x_{1}.
- Roots as √5, √(b² − 4ac) and (−b ± √(b² − 4ac))/(2a).
- Points as (1, −4); decimal comma (4,5x²).
- Graphs become value lines.

`notasi()` passes everywhere. A lesson-level check now also rejects «salah» (and «salah satu»,
reworded).

## Every number is proven, every fact is traced

- **Roots:** `akar()` gives exact roots over fractions when D is a perfect square. Irrational
  roots (−2 ± √2, 2 ± √5, 1 ± √5) are checked by substitution in floating point, to 10⁻¹².
- **Factorisations:** every factorisation in the lessons and questions is expanded back and
  compared with `nilai()` over a range of x. The three forms of x² − 2x − 3 agree for x from
  −9 to 8.
- **Vertices and maxima:** vertices come from `puncak()`. The fence maximum is also checked by a
  brute-force search on a grid.
- **Distractors:** every distractor value is computed by its stated wrong procedure.
- **The book's Latihan and Uji items are solved, checked and not used:**
  - Latihan 5.2 nos. 1-6 and pipe 10 (B = 72 min);
  - Uji 1 (25) and Uji 2 (7, −2);
  - Uji 5 (0 and 300 min; maximum 6,75 mg/L at 150 min).
- **Assertions:** 3.377 with `--kutipan` (3.376 without).
- **FAKTA:** 48 facts (pp. 131-169). `--kutipan` finds **47 of 48** in the text layer. The one
  it cannot find, `akar_baru_salah` (the p. 147 final equation), is printed as an image; I read
  it by eye, and it sits in `GAMBAR`. `pq_tanda` (p. 146) is also in `GAMBAR`, but its symbols
  survive in the text layer, so the check finds it.
- **Nine facts are kept only as the book-error record** (`REKAMAN`).

## Questions

32 questions: 4 pre-test, 8 post-test and 20 practice.

- **Answer positions:** A=8, B=8, C=8, D=8. The correct option is never strictly the longest.
- **Pre-test:** lessons 1, 2, 4 and 5.
- **Post-test:** covers all six lessons. 7 are Sedang and 1 is Sulit (PB8).

  | Item | Question | Numbers |
  |---|---|---|
  | PB1 | modelling | panjang = lebar + 3, luas 40 cm² |
  | PB2 | factorisation, a ≠ 1 | 2x² + x − 6 → 3/2, −2 |
  | PB3 | completing the square | x² + 6x = 7 → (x + 3)² = 16 |
  | PB4 | discriminant | 9x² − 12x + 4 → kembar |
  | PB5 | sum and product | x² − 7x + 10 |
  | PB6 | vertex | x² − 6x + 5 → (3, −4) |
  | PB7 | direction and D | −x² + 2x − 3 |
  | PB8 | maximum | pagar 40 m di tepi tembok → 200 m² |

  The generator asserts that these share nothing with `BUKU`, and that no post-test stem
  contains the book's expressions or numbers.
- **Misconception codes: 15**, SMA10-M-B5-01…15. Each is used by at least one distractor.

## Checks

```
$ python3 docs/onboarding/konten/sma10_matematika_bab5.py --kutipan <book text>
SMA10-Matematika-Bab5.xlsx: lessons 6 (25 pages), questions 32 (pre 4, post 8, practice 20), answers A=8 B=8 C=8 D=8
SMA10-Matematika-Bab5-miskonsepsi.csv: 15 codes
facts traced: 48 (pages 131-169)
quotations found in the book's text: 47 of 48; figures read by eye: akar_baru_salah
assertions passed: 3377          (3376 without --kutipan)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA10-Matematika-Bab5.paket.json --miskonsepsi docs/onboarding/konten/SMA10-Matematika-Bab5-miskonsepsi.csv
questions 32: pre 4, post 8, practice 20; answers A=8 B=8 C=8 D=8; correct option strictly longest in 0
TOTAL: 0 ERROR, 0 WARNING
```

- Without the CSV there are 32 WEAK_MISCONCEPTION_LINKAGE warnings only, as usual.
- **Rebuild:** a second run gives a byte-identical package (Bab 5 and Bab 4).
- **Regression:**
  - SD5 Bab 1-9, Geografi Bab 1-4 and SMA10 Bab 1-3 re-run and pass unchanged.
  - Bab 4 changes only by LT2.
- `npm run lint`: 0 errors, the 2 old warnings.

## Book errors and inconsistencies

None is copied into the workbook; `DILUAR` markers assert that the wording is absent.

1. **pp. 146-147, the second new-roots example.** The roots of x² + 4x − 21 = 0 are 3 and −7,
   and the new roots are 1/(2p) and 1/(2q).
   - The book writes «pq = −c/a = 21»; in fact pq = c/a = −21.
   - It then gets P + Q = 4/21, B/A = 4/21 and PQ = 1/84.
   - It ends with **x² + 4/21 x − 1/84 = 0**, which is wrong. The sum is 2/21 and the product
     is −1/84, so the equation is x² − 2/21 x − 1/84 = 0.
   - All of this is asserted, including that the book's equation misses the root 1/6.
   - The lesson uses only the first example (2p, 2q), which is correct.
2. **p. 146, first example:** «pq = −c/a = 3». The value 3 is right, but the formula is c/a,
   and −c/a would give −3. The lesson states x_{1} × x_{2} = c/a, and an assertion counts its
   two occurrences.
3. **pp. 148 and 158:** for D < 0, «dua akar imajiner (berbeda)». The roots are non-real
   complex numbers, for example −2 ± 2i for x² + 4x + 8, not purely imaginary ones. The lesson
   says «tidak ada akar real». DILUAR: «imajiner».
4. **p. 159, Latihan 5.8 no. 4:** the costs 0, 500, 400, 500, 800, 1.300 for 0-50 items are not
   quadratic, because the second differences are not constant. Symmetry about 20 needs 800 at 0,
   which makes every second difference 200 (asserted).
5. **p. 169, Uji Kompetensi 6:** the table gives J(p) = 2p/3, so sales rise with price. The
   profit (p − 2.000) × 2p/3 then opens upward and has no maximum (asserted), although part c
   asks for the price that maximises profit.
6. **p. 164, Latihan 5.9 no. 1:** the vertex (2, 6) through (1, 7) gives x² − 4x + 10 with
   D = −24 < 0. The requested factor form a(x − p)(x − q) with real p and q does not exist.
7. **Typos and notation:**
   - p. 133: «quadatrus» (quadratus);
   - p. 154: «titik minimum dari y = x² adalah 0, 0» (parentheses missing);
   - p. 137: «menjadi a(x − x₁)(x − x₂)» is missing «= 0».
8. **p. 131:** the electricity tariff «Rp1.467,28 per kWh untuk batas daya 1300 VA» and the
   «biaya awal 75.124» are presented as fact without a date or source. They are kept out.

Checked and consistent (no error):
- Eksplorasi 5.1 no. 3 (40 km/jam).
- All factorisations on pp. 136-142.
- x² + 14x = 32 gives 2 and −16.
- The first new-roots example.
- Gambar 5.10: x² − 2x − 3.
- K-L-M: a = 1, b = −2, c = −3, both ways.
- Latihan 5.7 nos. 1-3: t² + 5, −t² + 6t and −2x² + 100x all fit.
- Latihan 5.8 no. 3: maximum 17 at t = 3.
- Latihan 5.10 no. 1: 2t against t² + 2t.
- Latihan 5.2: every item is solvable, and the pipe problem gives B = 72 min.

## Assumption for the coordinator

- **Eksplorasi 5.10 (fence):** I read the figure as three pens of width x in a row, with two long
  sides of 3x and four sides of y, so 6x + 4y = 96. The book gives no answer.
  - The lesson states this reading, and the result is 288 m².
  - No question rests on it; PB8 is a different, wall-side fence.

## Round 2 (coordinator's review)

1. **Lesson 2, the zero-product rule, is now stated in the direction the step uses:** «Jika hasil
   kali dua bilangan sama dengan nol, maka sedikitnya satu bilangan itu nol. Jadi x + 1 = 0 atau
   x + 2 = 0.» An assertion checks the new sentence and the absence of the old converse.
2. **Lesson 3, square roots:**
   - Step 2 now reads «Ada dua bilangan yang kuadratnya 81, yaitu 9 dan −9, jadi x + 7 = 9 atau
     x + 7 = −9.»
   - The note reads «Ingat: √81 = 9, tetapi persamaan (x + 7)² = 81 dipenuhi oleh x + 7 = 9 dan
     juga oleh x + 7 = −9.»
   - Asserted: the old sentence is absent, «√81 = 9» is present, 9² = (−9)² = 81 and
     isqrt(81) = 9.
3. **LT8 D, the signed pair:**
   - The rationale now reads «Itu dua bilangan pemecah suku tengah, karena (−6) × (−1) = 2 × 3 dan
     (−6) + (−1) = −7; keduanya bukan akar-akarnya.»
   - So that the option names the same pair as its rationale, the option text changed too, from
     «6 dan 1» to «−6 dan −1». Say if you would rather keep «6 dan 1» with a rationale about the
     dropped signs.
   - Asserted: (−6)(−1) = 2 × 3, (−6) + (−1) = −7, the split 2x² − 6x − x + 3 equals 2x² − 7x + 3
     for x from −5 to 5, and neither −6 nor −1 is a root.
   - The key and the answer position are unchanged.
4. **Optional point, taken:** lesson 1 now says «Ruas kiri persamaan kuadrat adalah polinom dengan
   pangkat tertinggi 2.»

**Gate after round 2:**
- Bab 5: 3.379 assertions with `--kutipan` (3.378 without), 47 of 48 quotations.
- periksa_mutu is 0/0 with the CSV, and the package rebuilds byte-identically.
- Against `3c94b6c`, the package differs only in lessons 1, 2 and 3 and LT8 D (option and
  rationale).
- The Bab 4 LT2 correction rides along unchanged.
- The regression is unchanged; lint shows 0 errors and the 2 old warnings.
