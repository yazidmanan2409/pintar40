# LANA-08: SD5 Matematika Bab 8, Data

Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Fitrianawati, Surtiani, Istiandaru),
Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022, Bab 8, pp. 345-394
(`sd5_matematika_8_lesson.pdf`, 50 pages).

## Content

Six text lessons, 28 pages, two for each subbab:

1. Mengumpulkan Data dengan Turus (A)
   - Anggi's donut sales as data for a decision.
   - Tally marks in fives.
   - Frekuensi: the vegetable data (Tabel 8.4).
   - Crossing off each record so none is missed or counted twice.
2. Membaca Tabel Frekuensi (A)
   - The frequency table.
   - Nisa, Lukas and Asep's statements checked against it.
   - A value and its frequency, which are not the same thing (the Ayo Berlatih scores).
   - Totals, and "kurang dari 70".
3. Membuat Piktogram (B)
   - The key.
   - The apem data (key 4) with ¾, ½ and ¼ pictures.
   - Why Kamis needs 9¼ pictures, not 9.
   - Title, labels and pictures of the same size.
4. Membaca dan Menganalisis Piktogram (B)
   - Pak Chandra's tomato pictogram: read the key first.
   - Totals, rises and falls.
   - Highest minus lowest, worked two ways (the book's Catatan).
5. Diagram Batang dan Skalanya (C)
   - The bar chart of how pupils get to school.
   - Vertical and horizontal bar charts.
   - The medal chart's scale: 5 steps between 0 and 20, so 4 a step; 38 lies between 36 and 40.
   - Pak Bajuri's catfish: the total, a quarter of it.
   - The book's mistakes to avoid with scales.
6. Diagram Batang Ganda dan Membandingkan Diagram (C)
   - Asep's two diagrams on different scales.
   - The real data, shown as a double bar chart.
   - When two data sets should not be combined.
   - Recap of the chapter.

**No pictures.** The player draws no charts, so the generator writes each chart as lines of text
built from the data:

- **Pictograms:** a row of ● with ◕ ◐ ◔ for ¾, ½ and ¼ of a picture. `piktogram()` asserts that
  every row is worth its data value.
- **Bars:** a run of █, one block per unit.
- **Tallies:** in fives, written `||||/`.

The player shows each line as its own paragraph and collapses runs of spaces, so a label cannot
be padded into a column. Each bar therefore starts its line and its label follows, so all bars
begin at the left edge and their lengths can be compared. Each pictogram row keeps its label
first ("Senin: ● ● …").

The coordinator may want to look at these lines in the player: this is the first chapter that
shows data as text.

## Questions

29 questions: 4 pre-test, 8 post-test and 17 practice.

- **Answer positions:** A=8, B=7, C=7, D=7. The correct option is never strictly the longest.
- **Pre-test:** samples four lessons: tally marks, a pictogram key, a scale and comparing two
  diagrams.
- **Post-test:** covers all six lessons.
- **Freshness.** The generator asserts the following for the post-test:
  - No run of three values from a post-test data list appears, in order, in any of the book's
    data lists. The lessons use the book's data.
  - No answer is a key the book or a lesson gives.
  - No pictogram key and count is one that the book or a lesson reads.
  - I first tried a looser check: any three numbers in common with a book table. It flagged
    every small set by chance; for example, the 24 counts in the donut table cover every number
    from 0 to 7.
  - The ordered check caught a real overlap. PB5's first pictogram counts (4, 7, 5, 2) shared a
    run with Pak Chandra's tomato rows (5, 7, 10, 6, 2). PB5 now uses 3, 8, 6, 1.
- **Distractors and the answer's value:** in every question whose options are all numbers, no
  distractor has the answer's value; the generator asserts this.
- **Misconception codes: 13**, SD5-M-B8-01…13.
  - 01-09 are the book's own Miskonsepsi:
    - p. 356: missed or double-counted data;
    - p. 362: the key ignored; parts of pictures; one picture taken to be one item; pictures of
      different sizes;
    - pp. 378-379: scale values misread; scales drawn wrong; comparing bar heights across
      scales; missing title, labels or key.
  - 10-13 come from the distractors:
    - 10: an answer that is not what was asked;
    - 11: a tally group counted as 4 or as 1;
    - 12: highest and lowest swapped;
    - 13: a data value and its frequency swapped.
  - The workbook's Kode miskonsepsi column is empty.

## Checks

```
$ python3 docs/onboarding/konten/sd5_matematika_bab8.py
SD5-Matematika-Bab8.xlsx: lessons 6 (28 pages), questions 29 (pre 4, post 8, practice 17), answers A=8 B=7 C=7 D=7
SD5-Matematika-Bab8-miskonsepsi.csv: 13 codes
assertions passed: 702

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SD5-Matematika-Bab8.xlsx docs/onboarding/konten/SD5-Matematika-Bab8.paket.json
docs/onboarding/konten/SD5-Matematika-Bab8.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab8.paket.json
questions 29: pre 4, post 8, practice 17; answers A=8 B=7 C=7 D=7; correct option strictly longest in 0
TOTAL: 0 ERROR, 29 WARNING (WEAK_MISCONCEPTION_LINKAGE 29)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab8.paket.json --miskonsepsi docs/onboarding/konten/SD5-Matematika-Bab8-miskonsepsi.csv
TOTAL: 0 ERROR, 0 WARNING
```

The Bab 1-7 generators re-run unchanged: 579, 600, 576, 587, 553, 508 and 563 assertions. Their
xlsx files were restored, because only the timestamps change. `npm run lint` gives 0 errors and
the 2 warnings that were already there.

## Book errors

I checked these against the page images. None is copied into the workbook.

1. **p. 354, bayam.** The text says "ada 8 anak yang menyukai sayuran bayam". Tabel 8.4 (p. 353)
   gives bayam **7**, in both the tally and the frequency column. The 8 is wortel.
2. **Uji Kompetensi 2, Nisa's savings (pp. 384-388):**
   - The pictogram rows are 4¼, 6, 5¼, 4½ and 5¾ pictures. With Rp4.000 a picture, that is
     Rp17.000, 24.000, 21.000, 18.000 and 23.000. The total is Rp103.000, which is what the key
     uses.
   - The keyed bar diagram A shows week 3 at **Rp20.000**, not Rp21.000, so it adds up to
     Rp102.000. Diagram B also shows week 3 at Rp20.000.
   - The key's reason for rejecting B (week 2 shown as Rp21.000) is right.
   - The pictogram's axis label reads "Banyaknya Siswa" for weeks, and its key is not printed.
3. **Pengayaan menu (p. 393):** the sample menu lists nasi goreng at 300 kkal, but Tabel 8.11
   (p. 391) gives **330 kkal**. With 330 the day comes to 1.523 kkal, not 1.493, and the snack
   allowance to 2.050 − 1.523 = 527 kkal, not 557. The protein total, 70,7 g, is right.
4. **Uji Kompetensi 3, internet users (p. 389):** the bar for men aged 25-34 is labelled
   "9,30%", but it is drawn at 19,3%, the value the key uses. The axis title reads "Presentase".
5. **Leftovers from other chapters:**
   - p. 373: the diagram-batang lesson ends by asking for "makna dari memotong kertas" and "manfaat
     faktor bilangan".
   - p. 390: the Pengayaan is to be "terkait dengan KPK dan FPB".
   - The Pengayaan cites "Tabel 8.9" for Tabel 8.11 (p. 392).
   - The rubric cites "Tabel 8.13" for Tabel 8.9 (p. 387).
6. **Checked and correct:**
   - Tabel 8.4 and all three statement keys.
   - The score table:
     - highest score 100, scored by 1 pupil;
     - 2 + 1 + 5 = 8 pupils in remedi.
   - The apem pictogram, row by row, and the total, 198 × Rp300 = Rp59.400.
   - The tomato keys: 60 kg; rises in weeks 2-3; falls of 8 kg in weeks 4 and 5; a spread of
     16 kg.
   - The medal readings from the bars: 65, 47, 38, 72, 69. That gives falls of 18 and 9, and
     72 + 84 + 111 = 267.
   - The catfish: 122 kg; 48 kg is more than 30,5 kg; Rp2.684.000.
   - The pupils' table and every key in (ii)-(vi).
   - The calorie readings, with Asep 255 kkal and Lukas 1.620 kkal.
   - The library keys: order, and 36 − 24 = 12.
   - The internet totals, the order of the age groups, and 34,10 − 30,70 = 3,40.

## Questions for the coordinator

None. The text charts are the one new thing to look at in the player.
