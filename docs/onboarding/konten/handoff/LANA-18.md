# LANA-18: SMA X Matematika Bab 4, Sistem Persamaan dan Pertidaksamaan Linear

Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
dkk.), Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, ISBN 978-623-118-558-7,
Bab 4, pp. 107-128 (the ch4 PDF). The chapter has no numbered Contoh. Its worked material is:
- the stationery packs (p. 110);
- Kinan's balls (Eksplorasi 4.1);
- Tabel 4.1 and its eliminations (pp. 114-116);
- Pak Eko's fruit (Eksplorasi 4.2);
- Kiki's budget (Eksplorasi 4.3).

Latihan 4.1-4.2 and the Uji Kompetensi have no keys, so every key is mine, and every key is
computed. The method, notation and gate are Bab 1's.

## Content

Six text lessons, 21 pages, in the book's order. They address the student as «kamu». Every
worked example states its question first and answers it, including the book's open
explorations.

1. **Sistem Persamaan Linear Dua Variabel** («Ayo, Mengingat Kembali»)
   - The definition, and what makes an equation linear.
   - The stationery packs, answered by eliminasi, substitusi and a check: buku Rp2.000, pensil
     Rp4.000.
2. **Sistem Persamaan Linear Tiga Variabel** (Eksplorasi 4.1)
   - Kinan's balls solved in full. y is eliminated from (1) × 2 − (2), giving 3x + 4z = 2.950;
     with (3) this gives x = 650, z = 250 and y = 450, checked in (2).
   - A solution satisfies *all* equations.
   - One «Coba pikirkan» (why three weighings), which LT8 answers.
3. **Banyaknya Solusi** (the p. 114 box, Tabel 4.1)
   - The three cases, with their graphs described in words.
   - The three Tabel 4.1 systems, each eliminated:
     - (−1, 2);
     - 0 = 5 → no solution;
     - 0 = 0 → many solutions.
   - The three-variable rule read from elimination, with one example of my own that gives
     0 = −2.
4. **Pertidaksamaan Linear dan Daerah Hasil** (Eksplorasi 4.2)
   - Pak Eko's model in ons.
   - Boundary lines: dashed for < and >, solid for ≤ and ≥.
   - The boundaries meet at (15/13, 20/13).
   - The test point (0, 0) for both inequalities.
   - Irisan.
   - The exploration answered: (2, 1), that is apel 2 ons and jeruk 1 ons, works; (1, 2) does not.
5. **Sistem Pertidaksamaan Linear dalam Masalah** (Eksplorasi 4.3)
   - Kiki's model, with its units stated («dalam ribuan rupiah»).
   - x and y are whole numbers and y ≥ 1.
   - The region read.
   - The possibilities as value lines:
     - y = 1 → x = 14…23;
     - y = 3 → x = 14…19;
     - y = 5 → x = 14 or 15;
     - so at most 5 perlombaan.
   - One affordable pair and one unaffordable pair.
6. **Memodelkan Masalah**
   - Steps for building a model.
   - When to use an equation and when to use an inequality.
   - Translating «lebih dari», «setidaknya», «paling banyak» and «tidak lebih dari».
   - Rina's books and pens, checked at two points.
   - The chapter recap.

The Pengayaan game, the GeoGebra item and the self-assessment are not question sources.

**Notation:**
- «−» as the minus sign; ≤ ≥ < >; points written as (2, 3); decimal comma.
- Graphs become statements about lines.
- Equation lists carry their labels (1)…(4).

`notasi()` passes on every text.

## Every number is proven, every fact is traced

- **Exact solving.** `selesaikan()` does Gauss-Jordan elimination over fractions, and
  `memenuhi()` substitutes each solution back into its system. Every system in the lessons and
  questions is solved and checked this way.
- **The book's own Latihan and Uji Kompetensi systems** are solved the same way:
  - Asep: 55, 90 and 110;
  - Bonar: many solutions;
  - Bu Wati: none;
  - Pak Musa: none;
  - Uji 3: Rp90.000, Rp100.000 and Rp80.000;
  - Uji 4: 1/10, 1/3 and 1/12 kg;
  - Uji 6: 180/29, 360/29 and 380/29;
  - Latihan 4.1 no. 4d: many solutions.
  These are checked and not used.
- **Solution counts.** `banyak_solusi_2()` classifies two-variable systems by their determinant
  and consistency. Every «satu / tidak ada / banyak» claim is computed.
- **Inequality claims.** Each is evaluated at its point, including every distractor point.
- **Kiki's possibilities.** The full set is enumerated.
- **Assertions:** 3.316 with `--kutipan` (3.315 without).
- **FAKTA:** 26 facts (pp. 109-126). `--kutipan` finds **25 of 26**. The missing one,
  `kiki_ribu`, is the p. 122 model «20x + 40y ≤ 500», which is typeset as an image; I read it by
  eye, and it sits in `GAMBAR`.
- **Seven facts are kept only as the book-error record** (`REKAMAN`).

## Questions

32 questions: 4 pre-test, 8 post-test and 20 practice.

- **Answer positions:** A=8, B=8, C=8, D=8. The correct option is never strictly the longest.
- **Pre-test:** lessons 1, 3, 4 and 6.
- **Post-test:** covers all six lessons. 6 are Sedang, 1 is Mudah (PB6) and 1 is Sulit (PB7).

  | Item | Question | Numbers |
  |---|---|---|
  | PB1 | two-variable system | Rp58.000, Rp32.000 → jeruk Rp6.000 |
  | PB2 | three-variable solution | x + y + z = 9, 2x − y + z = 5, x + 2y − z = 4 → (2, 3, 4) |
  | PB3 | number of solutions | x + 3y = 5, 2x + 6y = 10 → banyak |
  | PB4 | graph | 2x − y = 3, 4x − 2y = 8 → sejajar |
  | PB5 | point in a system | 2x + y ≤ 8, x − y > 1 → (3, 1) |
  | PB6 | boundary line | x + 2y ≥ 6 → utuh |
  | PB7 | modelling | 60 kursi, 20 kursi lipat |
  | PB8 | reading a system | Rp30.000, Rp50.000, Rp300.000 |

  - PB2's three distractors each satisfy only the first equation. This is asserted, and it
    drills «memenuhi semua persamaan».
  - The generator asserts that the post-test shares nothing with `BUKU`, and that no
    post-test stem contains the book's numbers.
- **Misconception codes: 11**, SMA10-M-B4-01…11. Each is used by at least one distractor.

## Checks

```
$ python3 docs/onboarding/konten/sma10_matematika_bab4.py --kutipan <book text>
SMA10-Matematika-Bab4.xlsx: lessons 6 (21 pages), questions 32 (pre 4, post 8, practice 20), answers A=8 B=8 C=8 D=8
SMA10-Matematika-Bab4-miskonsepsi.csv: 11 codes
facts traced: 26 (pages 109-126)
quotations found in the book's text: 25 of 26; figures read by eye: kiki_ribu
assertions passed: 3316          (3315 without --kutipan)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA10-Matematika-Bab4.paket.json
TOTAL: 0 ERROR, 32 WARNING (WEAK_MISCONCEPTION_LINKAGE 32)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA10-Matematika-Bab4.paket.json --miskonsepsi docs/onboarding/konten/SMA10-Matematika-Bab4-miskonsepsi.csv
questions 32: pre 4, post 8, practice 20; answers A=8 B=8 C=8 D=8; correct option strictly longest in 0
TOTAL: 0 ERROR, 0 WARNING
```

- **Fixed before hand-off:**
  - `periksa_mutu` flagged 12 uses of «salah» (DOCTRINE_LEXICON) in lessons, rationales and
    one remediation.
  - Each became «tidak benar», or «keliru» in misconception labels, for example «0 > 13 tidak
    benar».
  - «salah satu» was rephrased too.
- **Rebuild:** a second run gives a byte-identical package.
- **Regression:**
  - SD5 Bab 1-9, Geografi Bab 1-4 and SMA10 Bab 1-2 re-run and pass unchanged.
  - Bab 3 is changed on purpose (below).
- `npm run lint`: 0 errors, the 2 old warnings.

## Also changed: Bab 3 (your optional LANA-17 point)

- Lesson 5 now opens: «Sudut 30°, 45°, dan 60° disebut **sudut istimewa**, karena nilai
  perbandingan trigonometrinya dapat ditentukan secara eksak dari segitiga sederhana.»
- An assertion guards the new sentence and the absence of the old one.
- Bab 3 re-runs: 3.362 assertions with `--kutipan` (3.361 without), 40 of 41 quotations.
- periksa_mutu is 0/0 with the CSV, and the package rebuilds byte-identically.
- Only that one sentence changed. No question changed.

## Book errors and inconsistencies

None is copied into the workbook; `DILUAR` markers assert that the wording is absent.

1. **p. 115 against Tabel 4.1 (p. 114):**
   - The no-solution example in the table is 3x − 2y = 1 and 6x − 4y = 7.
   - The elimination on the next page uses 6x − 4y = 5 and reaches 0 = −3.
   - With the table's 7, the result is 0 = 5 (asserted). The lesson uses the table's system and
     0 = 5.
2. **p. 115: «didapatkan sebuah ketidaksamaan».** 0 = −3 is a false equation, not a
   ketidaksamaan: in this very chapter, «pertidaksamaan» and «ketidaksamaan» name inequalities.
   The lesson says «pernyataan yang tidak pernah benar».
3. **p. 115:** the sentence on three possible solution counts is printed twice in a row.
4. **p. 113:** steps 10 and 11 of Eksplorasi 4.1 are empty numbers.
5. **p. 122, Kiki's model «20x + 40y ≤ 500»:** it is written in thousands of rupiah, but the
   units are never stated. The lesson says «Dalam ribuan rupiah». It also adds the conditions
   the model leaves out: x and y are whole numbers and y ≥ 1.
6. **p. 126, Uji Kompetensi 2:** at 4% and 6% on Rp100.000.000, the interest is at least
   Rp4.000.000 for every split, so «setidaknya Rp550.000» is always met (asserted). The
   question cannot test what it intends; perhaps a monthly figure or a different sum was meant.

Checked and consistent (no error):
- Tabel 4.1 no. 1 gives (−1, 2).
- The pp. 115-116 eliminations for one solution and many solutions are right.
- Pak Eko's lines meet at (15/13, 20/13), as drawn.
- Kinan's balls: 650, 450 and 250 g.
- The Latihan systems behave as their questions expect: Bonar has many solutions, Bu Wati and
  Pak Musa have none.
- Uji 3, 4 and 6 have unique solutions (Uji 6's are the fractions above).

## Questions for the coordinator

None.
