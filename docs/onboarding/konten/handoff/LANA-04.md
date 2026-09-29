# LANA-04: SD5 Matematika Bab 4, Keliling Bangun Datar

Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Fitrianawati, Surtiani, Istiandaru),
Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022, Bab 4, pp. 113-176
(`sd5_matematika_4_lesson.pdf`, 64 pages).

## Content

Six text lessons, 25 pages, in the book's subbab order. Subbab C (segi empat) is split in two
because it holds six shapes.

1. Apakah Keliling Itu? (A: the 100 m × 50 m field and the four runners' routes)
2. Keliling Segitiga (B: sembarang, sama sisi, sama kaki; finding a side from the keliling)
3. Keliling Persegi Panjang, Jajargenjang, dan Layang-Layang (C: two pairs of equal sides)
4. Keliling Persegi, Belah Ketupat, Trapesium, dan Segi Empat Sembarang (C; with a table of
   when multiplying is allowed)
5. Keliling Segi Banyak Beraturan (D: 5, 6 and 8 sides; finding a side)
6. Keliling Bangun Gabungan (E: outer edges only; finding unwritten sides; the
   bounding-rectangle shortcut and when a notch breaks it), with the recap

**No pictures.** The player draws only fraction bars, so every shape is described in words.
A bangun gabungan is given as a walk around its edge ("ke kanan 10 m, ke bawah 4 m, …"), which is
also what keliling means. The generator checks every walk:

- `jalan()` checks that the walk closes and gives its perimeter;
- `pelingkup()` gives the bounding rectangle's perimeter, to show where the shortcut holds and
  where a notch breaks it;
- `luas_ortogonal()` computes the area that "luas" distractors use.

The lesson teaches the kite correctly: its pairs of equal sides are **adjacent**, not opposite
(see book error 3).

## Questions

30 questions: 4 pre-test, 8 post-test, 18 practice. Answers A=7 B=8 C=8 D=7; the correct option
is never the strictly longest.

- **Post-test** covers segitiga sama kaki, persegi panjang, jajargenjang, trapesium, segi enam
  beraturan, finding a side from the keliling, an L-shaped garden given as a walk, and a fence
  with a gate. No post-test question works on a side set that a lesson or the book works
  through, and no post-test answer is one of the book's keys.
- **Distractors and the answer's value** (the corrected wording from the LANA-03 gate): in every
  question whose options are numbers, no distractor has the answer's value; the generator
  asserts this. This chapter has no form questions, so there are no exceptions. Two questions
  (PA4, LT2) have options that are descriptions, not values.
- **Misconception codes: 12**, SD5-M-B4-01…12. 01 and 07 are the book's own (p. 166); 02, 03 and
  05 are the slips its teacher tables anticipate. The workbook's Kode miskonsepsi column is
  empty.

## Checks

```
$ python3 docs/onboarding/konten/sd5_matematika_bab4.py
SD5-Matematika-Bab4.xlsx: lessons 6 (25 pages), questions 30 (pre 4, post 8, practice 18), answers A=7 B=8 C=8 D=7
SD5-Matematika-Bab4-miskonsepsi.csv: 12 codes
assertions passed: 587

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SD5-Matematika-Bab4.xlsx docs/onboarding/konten/SD5-Matematika-Bab4.paket.json
docs/onboarding/konten/SD5-Matematika-Bab4.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab4.paket.json
questions 30: pre 4, post 8, practice 18; answers A=7 B=8 C=8 D=7; correct option strictly longest in 0
TOTAL: 0 ERROR, 30 WARNING (WEAK_MISCONCEPTION_LINKAGE 30)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab4.paket.json --miskonsepsi docs/onboarding/konten/SD5-Matematika-Bab4-miskonsepsi.csv
TOTAL: 0 ERROR, 0 WARNING
```

## Book errors

Checked against the page images. None is copied into the workbook.

1. **p. 146, kite:** 2 + 2 + 4 + 4 is worked as "(2 × 2) + (2 × 4) = 4 + 8 = 16", then
   "kelilingnya 14 cm". It is 12 cm.
2. **pp. 173-174, Soal Pengayaan (paint):** the wall is 94 m, which is right; the generator
   reproduces it as a closed walk. But the question asks whether **18** galon (5 m each) is
   enough: 18 × 5 = 90 m < 94 m, so it is **not** enough (19 galon would be). The key argues with
   20 galon (100 m) and concludes "lebih dari cukup".
3. **p. 145, kite:** it says the kite's opposite sides are equal ("sisi-sisi yang berhadapan
   sama panjang"). In a kite the equal sides are adjacent. The lesson says so.
4. **pp. 166-167, Miskonsepsi 2 (right-hand example):** the working disagrees with its own
   figure. The top is drawn 20 cm but used as 18 cm; CE is stated 10 cm but 9 is used. Its answer
   of 82 cm cannot be relied on, so the example is not used. The left-hand example
   (2 × (12 + 20) = 64 cm) is right.
5. **Uji Kompetensi (pp. 168-169)** checks out: 24, 20, 80, 72 (the parallelogram's top taken
   from its opposite side, 16 cm) and 46 cm (an L-shape with no notch).
6. **Labels:** Tabel 4.8 (p. 143) says "persegi panjang" in the jajargenjang activity; step 8 on
   p. 157 says "segi lima" in the segi enam activity; the Refleksi for subbab E (p. 167) says
   "Subbab D"; "Ayo Berpikur Kritis" (p. 119).
