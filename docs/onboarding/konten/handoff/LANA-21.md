# LANA-21: SMA X Matematika Bab 7, Peluang

Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
dkk.), Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, ISBN 978-623-118-558-7,
Bab 7, pp. 239-269 (the ch7 PDF, 31 pages). The chapter has no numbered Contoh. Its worked
examples are checked here:
- the six two-dice probabilities on pp. 244-245, all correct;
- the relative frequency 8/20;
- the 5/36 of Eksplorasi 7.3.

Latihan 7.1-7.6 and the Uji Kompetensi have no keys, so every key is mine, and every key is
computed. The method, notation and gate are Bab 1's.

## Content

Six text lessons, 22 pages. They address the student as «kamu». Every worked example states its
question first and answers it.

1. **Ruang Sampel dan Peluang**
   - Peluang from 0 to 1; S, n(S), titik sampel.
   - One die, two coins, two dice (36 outcomes); (3, 2) ≠ (2, 3).
   - P(A) = n(A) : n(S), with P(genap) = 1/2 and P(jumlah 11) = 1/18.
2. **Distribusi Peluang**
   - The full distribution of the sum of two dice as value lines; it sums to 1.
   - Why P(7) ≠ 1/11: the 11 sums are not equally likely.
   - At least 9 → 5/18; not more than 9 → 1 − 6/36 = 5/6.
   - Two coins: 1/4, 1/2, 1/4.
3. **Frekuensi Relatif dan Frekuensi Harapan**
   - 8/20 = 0,4; relative frequency approaches the theoretical probability.
   - Fh = P × n, shown with both the theoretical 1/2 (100 of 200) and the book's experimental 0,4
     (80).
   - Fh is an expectation, not a certainty, and need not be a whole number (50/6 ≈ 8,3).
4. **Kejadian Saling Lepas**
   - «Atau» means one or both.
   - Disjoint events, and the Venn diagram with no overlap.
   - **P(A ∪ B) = P(A) + P(B)**.
   - Jumlah 7 or doubles → 1/3; jumlah 3 or 4 → 5/36.
   - «Angka 2» or «jumlah 2» are disjoint → 1/3 (the book's example, checked).
5. **Kejadian Tidak Saling Lepas**
   - P(A ∪ B) = P(A) + P(B) − P(A ∩ B).
   - Doubles or jumlah 8 → 5/18, and why 11/36 would count (4, 4) twice.
   - One die: genap or > 3 → 2/3, checked by listing.
6. **Kejadian Saling Bebas dan Aturan Perkalian**
   - P(A dan B) = P(A) × P(B).
   - Not a double, then a double → 5/36, checked by the area model: 180 of 1.296.
   - Bags with and without replacement: 35/144 against 35/132.
   - The chapter recap.

Not used:
- the Covid, rain and blood-group hook questions;
- the transport survey, which is class data;
- the lamp, film and left-handedness Latihan;
- tetrahedral and octahedral dice;
- the nontransitive dice;
- Buffon's needle (Pengayaan).

**Notation:**
- Probabilities as fractions (5/36) or decimal commas (0,56); P(A ∪ B) and P(A ∩ B).
- Sample-space grids become value lines.
- `notasi()` passes; lessons are checked to contain no «salah».

## Every number is proven, every fact is traced

- **Enumeration:** every probability is computed by enumerating its sample space with exact
  Fractions. The sample spaces are one die, two dice (36), two and three coins, the bag, and the
  pairs of two-dice throws (1.296).
- **Book examples:** the book's six worked probabilities on pp. 244-245 are all reproduced.
- **Lesson 2:** its distribution is asserted to be exactly the computed one.
- **Distractors:** every distractor value is computed by the procedure its rationale names. For
  example, PB7's 7/36 subtracts the intersection twice, and PB8's 7/12 answers «6 atau gambar»
  instead of «dan».
- **Latihan 7.3 (checked, not used):** the lamps total 300; not left-handed: 0,77 × 10.000 =
  7.700; the film survey totals 80, with horror 30 of 480.
- **Assertions:** 3.329 with `--kutipan` (3.328 without).
- **FAKTA:** 31 facts (pp. 241-259). `--kutipan` finds **30 of 31**. The one it cannot find,
  `aturan_lepas`, is the p. 255 rule, which is typeset as an image; I read it by eye, and it sits
  in `GAMBAR`.
- **Nine facts are kept only as the book-error record** (`REKAMAN`).

## Questions

32 questions: 4 pre-test, 8 post-test and 20 practice.

- **Answer positions:** A=8, B=8, C=8, D=8. The correct option is never strictly the longest.
- **Pre-test:** lessons 1, 2, 4 and 6.
- **Post-test:** covers all six lessons. 7 are Sedang and 1 is Sulit (PB7).

  | Item | Question | Numbers |
  |---|---|---|
  | PB1 | complement in a bag | 3 merah, 5 biru, 2 hijau → 1/2 |
  | PB2 | distribution | jumlah ≥ 10 → 1/6 |
  | PB3 | expected frequency | angka 6 in 240 throws → 40 |
  | PB4 | relative frequency | 28 of 50 → 0,56 |
  | PB5 | disjoint «atau» | jumlah 3 atau 11 → 1/9 |
  | PB6 | addition rule | 0,5 + 0,4 − 0,2 → 0,7 |
  | PB7 | not disjoint | doubles or jumlah 10 → 2/9 |
  | PB8 | independent «dan» | dadu 6 dan gambar → 1/12 |

  The generator asserts that these share nothing with `BUKU`, and that no post-test stem
  contains the book's items (jumlah 11, jumlah 8, jumlah 5, 66, 14 kali, 0,23, Sani, Oka,
  12 bola, oktahedral, tetrahedron, tidak dobel).
- **Misconception codes: 12**, SMA10-M-B7-01…12. Each is used by at least one distractor.

## Checks

```
$ python3 docs/onboarding/konten/sma10_matematika_bab7.py --kutipan <book text>
SMA10-Matematika-Bab7.xlsx: lessons 6 (22 pages), questions 32 (pre 4, post 8, practice 20), answers A=8 B=8 C=8 D=8
SMA10-Matematika-Bab7-miskonsepsi.csv: 12 codes
facts traced: 31 (pages 241-259)
quotations found in the book's text: 30 of 31; figures read by eye: aturan_lepas
assertions passed: 3329          (3328 without --kutipan)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA10-Matematika-Bab7.paket.json --miskonsepsi docs/onboarding/konten/SMA10-Matematika-Bab7-miskonsepsi.csv
questions 32: pre 4, post 8, practice 20; answers A=8 B=8 C=8 D=8; correct option strictly longest in 0
TOTAL: 0 ERROR, 0 WARNING
```

- **Fixed before hand-off:** the length assertion caught two keys that were strictly the longest.
  - PB8: «1/8» became «7/12».
  - LT12: a distractor became «tepat 100 kali, karena 1/2 × 200 = 100 pasti terjadi».
  - One forbidden-number check was too broad: «0,2» from the Sani and Oka item also appears
    legitimately in PB6. It now forbids the names instead.
- **Rebuild:** a second run gives a byte-identical package.
- **Regression:** SD5 Bab 1-9, Geografi Bab 1-4 and SMA10 Bab 1-6 re-run and pass unchanged.
- `npm run lint`: 0 errors, the 2 old warnings.

## Book errors and inconsistencies

None is copied into the workbook; `DILUAR` markers assert that the wording is absent.

1. **p. 255, the addition rule for disjoint events** is printed as «P(A ∪ B) = P(A atau B)», which
   only renames the left side. The rule itself, P(A) + P(B), is missing. Lesson 4 states
   P(A ∪ B) = P(A) + P(B), and an assertion checks that it is there.
2. **p. 253:** «jika kamu melempar dadu yang sama sebanyak 66 kali, kamu akan mendapatkan angka
   genap sebanyak 26 kali … 80 kali».
   - That states an expectation as a certainty; the next sentence then says it is not
     guaranteed.
   - The expected value is 26,4, and it need not be rounded to a whole number.
   - The lesson treats Fh as an estimate, and LT12 drills this.
3. **p. 259:** «Pilihan bola pertama tidak memengaruhi pilihan bola kedua» is stated before the
   condition that makes it true (the ball is put back). The lesson states the two cases
   separately: with replacement 35/144, without 35/132.
4. **p. 256:**
   - «Pada Gambar 7.4» refers to the Venn diagrams, which are Gambar 7.5 (Gambar 7.4 is the
     students' conversation).
   - Latihan 7.4 no. 1 names the probability of «jumlah 5» as «P(A)» twice; the second should
     be P(B).
5. **p. 246, table numbering:** the text says «Tabel 7.2 distribusi peluang», but the caption is
   «Tabel 7.1», a number already used for the sample space. The coin table on p. 248 is also
   «Tabel 7.2».
6. **Typos:**
   - p. 243: «… dengan peluang mendapatkan angka yang berbeda» is printed twice in one question;
   - p. 258: «Sepanag»;
   - p. 257: Eksplorasi 7.3's steps begin at 5.
7. **p. 241:** the hook question about Covid-19 exposure is kept out.

Checked and consistent (no error):
- The six worked probabilities on pp. 244-245: 1/18, 1/3, 1/36, 5/18, 5/6 and 5/18.
- The relative frequency 8/20 = 2/5 = 0,4.
- The 5/36 of Eksplorasi 7.3.
- Latihan 7.3's data sets.

## Questions for the coordinator

None.
