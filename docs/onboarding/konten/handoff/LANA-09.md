# LANA-09: SD5 Matematika Bab 9, Bilangan Cacah Sampai 1.000.000

Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Fitrianawati, Surtiani, Istiandaru),
Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022, Bab 9, pp. 395-416
(`sd5_matematika_9_lesson.pdf`, 22 pages). This is the last chapter of the book.

## Content

Six text lessons, 26 pages:

1. Membaca dan Menulis Bilangan Sampai 1.000.000 (A)
   - The Jepara wardrobe, Rp979.875.
   - Reading by groups of three, with "ribu" said once.
   - Zeros that hold a place.
   - Writing from words.
   - Satu juta.
2. Nilai Tempat (A)
   - The book's product table, digit by digit.
   - A digit's place and its value: the digit, its place and its value are three different
     things.
   - Each place is worth ten times the one to its right.
3. Membandingkan Bilangan (B)
   - The signs.
   - Count the digits first: 99.999 < 100.000.
   - Then compare from the left, never from the back (the book's Miskonsepsi).
4. Mengurutkan Bilangan dan Pola Bilangan (B)
   - The products put in order, cheapest to dearest.
   - Ascending and descending order.
   - The book's patterns: steps of 1.000 and of 20.
5. Komposisi dan Dekomposisi Bilangan (C)
   - Breaking 678.987 into place values.
   - 2 ratus ribuan + 3 ribuan + 3 puluhan + 5 satuan = 203.035.
   - Money in notes: Ibu's Rp443.000.
   - Several ways to make Rp250.000.
6. Memecahkan Masalah dengan Bilangan Sampai 1.000.000
   - The Uji Kompetensi 5 situations: how much short, a price from the change, which total is
     larger.
   - Borrowing across zeros, step by step.
   - Recap of the chapter.

The lessons add no content beyond the book. The overview (p. 397) promises a subbab D on
operations, but the chapter does not have one. Lesson 6 covers only the operations that
Uji Kompetensi 5 itself uses.

**Every number word is computed.** `terbilang()` writes Indonesian number words. It reproduces
all eight of the book's correct readings before any question uses it.

Each slip that a distractor names is computed by its own function:

- `baca_ribu_ganda`: "ribu" said twice, which is the book's own slip;
- `tanpa_nol`: dropped zeros;
- `lebih_besar_dari_belakang`: comparing from the back;
- `lebih_besar_angka_depan`: comparing only the first digits;
- `kurang_terbalik`: taking the smaller digit from the larger in every column, never borrowing.

## Questions

28 questions: 4 pre-test, 8 post-test and 16 practice.

- **Answer positions:** A=7, B=7, C=7, D=7. The correct option is never strictly the longest.
- **Pre-test:** samples four lessons: reading, place, comparing and composing.
- **Post-test:** covers all six lessons.
- **Freshness.** The generator asserts the following for the post-test:
  - No number with two or more non-zero digits in a stem or answer is one the book or a lesson
    uses. Round place values such as 700.000 in a decomposition are exempt.
  - No run of three values from PB4's list or PB5's pattern appears, in order, in a book list.
    This is the in-order rule from Bab 8.
  - The generator's other checks forced two changes:
    - PB4's first list sorted "from the back" into exactly the descending order, so two
      distractors would have been the same mistake. The list was changed so that the two
      differ.
    - LT9 listed its prices in the stem, so the stem gave the answer away; the stem no longer
      lists them.
- **Distractors and the answer's value:** in every question whose options are all numbers, no
  distractor has the answer's value; the generator asserts this.
- **Misconception codes: 11**, SD5-M-B9-01…11.
  - 01 and 05 are the book's own Miskonsepsi (pp. 402 and 406).
  - 10 is the book's note on story problems (p. 409).
  - The rest come from the distractors:
    - 02: dropped zeros;
    - 03: places swapped;
    - 04: digit, place and value mixed up;
    - 06: the number of digits ignored;
    - 07: the order reversed;
    - 08: the wrong step in a pattern;
    - 09: counting notes instead of their value;
    - 11: satu juta written wrongly.
  - The workbook's Kode miskonsepsi column is empty.

## Checks

```
$ python3 docs/onboarding/konten/sd5_matematika_bab9.py
SD5-Matematika-Bab9.xlsx: lessons 6 (26 pages), questions 28 (pre 4, post 8, practice 16), answers A=7 B=7 C=7 D=7
SD5-Matematika-Bab9-miskonsepsi.csv: 11 codes
assertions passed: 493

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SD5-Matematika-Bab9.xlsx docs/onboarding/konten/SD5-Matematika-Bab9.paket.json
docs/onboarding/konten/SD5-Matematika-Bab9.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab9.paket.json
questions 28: pre 4, post 8, practice 16; answers A=7 B=7 C=7 D=7; correct option strictly longest in 0
TOTAL: 0 ERROR, 28 WARNING (WEAK_MISCONCEPTION_LINKAGE 28)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab9.paket.json --miskonsepsi docs/onboarding/konten/SD5-Matematika-Bab9-miskonsepsi.csv
TOTAL: 0 ERROR, 0 WARNING
```

The Bab 1-8 generators re-run unchanged: 579, 600, 576, 587, 553, 508, 563 and 702 assertions.
Their xlsx files were restored, because only the timestamps change. `npm run lint` gives 0 errors
and the 2 warnings that were already there.

## Book errors

I checked these against the page images. None is copied into the workbook.

1. **Uji Kompetensi 3 (pp. 410-413): none of the three keys matches its question.**

   | Item | Question | Right answer | Book's key |
   |---|---|---|---|
   | 3a | "3 lembar sepuluh ribuan, 7 lembar seribuan, dan 1 lembar seribuan" | 38.000 | 327.100 |
   | 3b | "3 lembar sepuluh ribuan dan 4 satuan" | 30.004 | 505.401 |
   | 3c | "2 lembar sepuluh ribuan, 7 lembar seribuan, dan 9 lembar seratusan" | 27.900 | 857.259 |

   The keys look as if they belong to other questions.
2. **Uji Kompetensi 4d (p. 410) is keyed Salah, but the statement is true.** It says "678.987
   mempunyai komposisi enam ratus ribuan, tujuh puluh ribuan, delapan ribuan, sembilan ratusan,
   delapan puluhan dan tujuh satuan", and that is exactly right. The rubric's copy (p. 413)
   says "delapan ratusan", which would make Salah correct. The two copies of the item differ.
3. **p. 403, the Ayo Berlatih key:** 296.575 is read "Dua ratus ribu sembilan puluh enam ribu
   lima ratus tujuh puluh lima", saying "ribu" twice. The right reading is "dua ratus sembilan
   puluh enam ribu lima ratus tujuh puluh lima". Lesson 1 teaches this slip as the thing to
   avoid.
4. **Uji Kompetensi 1b (p. 411) has the same slip in the question:** "Sembilan ratus ribu tiga
   puluh tiga ribu empat ratus tiga". The key, 933.403, is read "sembilan ratus tiga puluh tiga
   ribu empat ratus tiga".
5. **Scope and labels:**
   - The Ayo Berlatih pattern 2b (p. 406) runs to 1.100.000, beyond the chapter's 1.000.000.
   - Tabel 9.1 names subbab C "… Sampai 100.000".
   - The objectives are numbered 1.1-1.8.
   - The overview describes a subbab D on operations that the chapter does not contain
     (p. 397).
   - The apersepsi says that "Bab I" covered numbers to 100.000.
6. **Checked and correct:**
   - Every other reading in Ayo Berlatih 2 and Uji Kompetensi 2.
   - The place-value table and the places of the digit 9 (p. 403).
   - All five comparisons (p. 406).
   - Patterns 2a and 2c.
   - Uji Kompetensi 1a (550.303).
   - Uji Kompetensi 4 a, b, c and e (203.035 ≠ 203.305).
   - All four Uji Kompetensi 5 pairs: Rp7.000, Rp354.500, Rp234.600, Rp567.000.

## Questions for the coordinator

None. This completes SD5 Matematika, Bab 1-9.
