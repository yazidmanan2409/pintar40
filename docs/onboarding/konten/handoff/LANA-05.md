# LANA-05: SD5 Matematika Bab 5, Luas Daerah Bangun Datar

Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Fitrianawati, Surtiani, Istiandaru),
Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022, Bab 5, pp. 177-246
(`sd5_matematika_5_lesson.pdf`, 70 pages).

## Content

Six text lessons, 23 pages, in the book's subbab order. Subbab B (seven shapes) is split in three,
the way the book derives each formula from the one before by cutting and rearranging.

1. Apakah Luas Daerah Itu? (A: tiles, persegi satuan, cm² and m², half squares)
2. Luas Persegi Panjang dan Persegi (B)
3. Luas Segitiga dan Jajargenjang (B: from the rectangle; tinggi, not the slanted side)
4. Luas Trapesium, Belah Ketupat, dan Layang-Layang (B), with a table of all formulas
5. Luas Bangun Gabungan (C: splitting, subtracting, a path round a pool, a roof on a square)
6. Hubungan Keliling dan Luas (D: the same keliling with different luas and the reverse; a
   square is also a rectangle), with the recap

**Shapes as walks.** As in Bab 4 (the LANA-04 gate asked to keep this), shapes are described in
words, and composite shapes as a walk around the edge. The generator checks every walk:

- `jalan()` checks that the walk closes and gives its perimeter;
- `luas_ortogonal()` gives the true area, so the answer and the perimeter and bounding-rectangle
  distractors are proven.

Formulas are computed with exact halves (`fractions.Fraction`), and
`persegi_panjang_terluas()` enumerates every rectangle with a given keliling for the subbab D
questions.

## Questions

30 questions: 4 pre-test, 8 post-test, 18 practice. Answers A=8 B=7 C=8 D=7; the correct option
is never the strictly longest.

- **Post-test** covers a rectangle, a triangle and a parallelogram (each with its slanted side
  given as a trap), a trapezoid, a kite, an L-shaped room given as a walk, a path round a pool,
  and the largest rectangle for a given rope. No post-test question works on a measure set that
  a lesson or the book works through, and no post-test answer is one of the book's keys.
- **Distractors and the answer's value:** in every question whose options are numbers, no
  distractor has the answer's value; the generator asserts this. There are no form questions,
  so there are no exceptions. Three questions (PA1, LT16, LT17) have options that are
  statements, not values.
- **Misconception codes: 14**, SD5-M-B5-01…14. 02, 04 and 09 are the book's own Miskonsepsi
  (pp. 199, 227, 235); 07 is the slip in the book's own pool key (book error 1). The workbook's
  Kode miskonsepsi column is empty.

## Checks

```
$ python3 docs/onboarding/konten/sd5_matematika_bab5.py
SD5-Matematika-Bab5.xlsx: lessons 6 (23 pages), questions 30 (pre 4, post 8, practice 18), answers A=8 B=7 C=8 D=7
SD5-Matematika-Bab5-miskonsepsi.csv: 14 codes
assertions passed: 553

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SD5-Matematika-Bab5.xlsx docs/onboarding/konten/SD5-Matematika-Bab5.paket.json
docs/onboarding/konten/SD5-Matematika-Bab5.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab5.paket.json
questions 30: pre 4, post 8, practice 18; answers A=8 B=7 C=8 D=7; correct option strictly longest in 0
TOTAL: 0 ERROR, 30 WARNING (WEAK_MISCONCEPTION_LINKAGE 30)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab5.paket.json --miskonsepsi docs/onboarding/konten/SD5-Matematika-Bab5-miskonsepsi.csv
TOTAL: 0 ERROR, 0 WARNING
```

## Book errors

Checked against the page images. None is copied into the workbook; lesson 5 teaches the pool
path correctly.

1. **p. 243, Soal Pengayaan (pool):** the text says the path round the 15 m × 6 m pool is 1 m
   wide, but the key (and its figure) uses an outside of 16 m × 7 m, which adds only 0.5 m per
   side. With a 1 m path on every side the outside is 17 m × 8 m, so the path is 136 − 90 =
   **46 m²**, not 22 m². The number of boxes changes too: 46 m² ÷ 0.16 m² = 287.5, so 288 tiles
   and 58 boxes, not 28.
2. **Uji Kompetensi 4 (figure B, p. 236):** the grid shows the trapezoid's parallel sides are 1
   and 2 squares. So p. 237's working (2 × 4 + 3 × 2 + ½ × (2 + 1) × 4 = **20**) is right, and
   the rubric on p. 241 (½ × (3 + 1) × 4, giving 22) is wrong. The key gives two answers for
   one question.
3. **p. 218, trapesium activity:** asked whether the new parallelogram's height equals the
   trapezoid's, the answer given is "Sama … 2 satuan", followed at once by "setengahnya". The
   height halves (to 1); the calculation 7 × 1 = 7 is right.
4. **Labels:** p. 219 says "tinggi persegi panjang" in the trapesium result (it is a
   jajargenjang); p. 226's summary box for the kite says "Luas daerah belah ketupat"; the
   Refleksi for subbab C (p. 232) says "Subbab B"; the Pengayaan guidance (p. 242) says "keliling
   bangun datar" in the luas chapter.
5. **p. 186, floor plan:** the ruang tamu is described as 3 m × 4 m but counted as 13 m². It is
   3 m × 4 m plus the 1 m² beside the bathroom, so 13 m² and the house total of 39 m² are right;
   only the description is loose.
6. **Checked and correct:** Uji Kompetensi 1 (216 cm²), 2 (224 cm²), 3 (22, both ways); the
   triangle, parallelogram, trapezoid, rhombus and kite derivations (8, 10, 8, 7, 4, 10); the
   60 cm wire table (largest 15 × 15 = 225 cm²).
