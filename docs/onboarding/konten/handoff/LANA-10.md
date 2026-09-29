# LANA-10: SMA XI Geografi Bab 1, Posisi Strategis Indonesia, Potensi Sumber Daya Alam, dan Pengaruhnya Terhadap Kehidupan

Source: the student book "Geografi untuk SMA/MA Kelas XI (Edisi Revisi)" (Budi Handoyo, Nisa
Maulia), Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2024, Bab I, pp. 1-66
(`sma11-geografi-ch1-lesson.pdf`). The book has no answer keys, so every key is mine.

## Content

Seven text lessons, 33 pages, following the book's sections. They address the student as the
book does ("kalian").

1. **Letak Astronomis Indonesia** (A.1)
   - The span and the four boundary points.
   - The tropical belt, taken from Gambar 1.3 and put into words.
   - 15° an hour; the three zones (Keppres 41/1987).
   - The provinces in each zone, from Gambar 1.4, as three lines.
   - The advantages.
2. **Letak Geografis Indonesia** (A.2)
   - Two continents and two oceans.
   - The monsoons.
   - The crossroads of world shipping.
   - The four advantages.
   - One short "Coba pikirkan" with no key.
3. **Letak Geologis Indonesia** (A.3)
   - Two mountain belts, three plates, two shelves.
   - The Sunda and Sahul shelves.
   - The inner and outer arcs.
   - Topography and climate.
   - Earthquakes, with the book's dated figures.
4. **Pengertian dan Klasifikasi Sumber Daya Alam** (B.1)
   - Classification by jenis, sifat and potensi, with the book's examples.
5. **Potensi Hutan dan Laut Indonesia** (B.2, first part)
   - Forests: the extent (BPS/databoks 2023) and the kinds by function.
   - The sea.
   - Mangroves.
   - Fisheries.
   - Coral reefs.
6. **Potensi dan Sebaran Bahan Tambang** (B.2, second part)
   - The A/B/C classes of mining materials.
   - Oil and gas.
   - Coal.
   - Nickel, iron ore and bauxite.
   - Gold, copper and tin.
7. **Pengelolaan Sumber Daya Alam yang Berkelanjutan** (B.3)
   - Forestry and farming.
   - Mining and industry.
   - The sea.
   - Tourism.
   - Recap of the chapter.

**No figures and no Markdown tables.** What a figure shows is put into words:

- the coordinates;
- the provinces in each time zone;
- the climate belts;
- the two monsoons, as the map labels them;
- the forest chart.

Tables are written one fact per line. The generator asserts that no lesson contains a table row.

The Aktivitas are not turned into questions.

## Every fact is traced

- **The fact table.** `FAKTA` holds **100 facts**, each with its page (pp. 4-55) and the book's
  own wording.
- **Every option names its fact.** Every option of every question names the fact it rests on,
  and the generator checks that the option's content words appear in that fact's quotation. A
  distractor is a true fact that answers a different question: for example, Pulau Rote is the
  southern boundary, offered where the northern one is asked. Writing the options this way kept
  them in the book's own wording: the check rejected 8 of my first paraphrases.
- **Quotations checked against the book.** `--kutipan <book text>` checks every quotation
  against the book's extracted text, ignoring spacing, punctuation and the fi/fl ligatures the
  PDF drops. Result: **98 of 100 found**. The two others are read from figures: Gambar 1.3,
  whose labels the PDF text lays out in another order, and Gambar 1.21, an image with no text.
  The generator allows only those two.
- **What is computed and asserted:**
  - The span 6° LU–11° LS, 95° BT–141° BT is the four boundary points rounded down to whole
    degrees. The span is 45°20' of longitude, which is three 15° belts: the three zones.
  - Clock times across zones, from the GMT offsets.
  - The earthquake averages: 71.628 in 11 years gives 6.512 a year, 543 a month and 18 a day.
  - Nickel: 1,6 / 3,3 = 48,48%. Gold: 2.600 / 59.000 = 4,4%.
  - Coal production rises every year.
- **The feature models:**
  - The province → time zone model, from Gambar 1.4: 18 WIB, 12 WITA and 4 WIT provinces.
  - The inner and outer arc lists. Maluku is left out, because Seram and Buru are on the outer
    arc.
  - The resource classification on the book's three axes. A resource is placed on an axis only
    where the book lists it there.
  - The A/B/C mining classes.
  - Each model's entries are asserted to appear in their fact's quotation.

## Questions

31 questions: 4 pre-test, 8 post-test and 19 practice.

- **Format:** every question is single-answer with options A–D.
- **Answer positions:** A=8, B=8, C=8, D=7. The correct option is never strictly the longest.
- **Pre-test:** samples four lessons.
- **Post-test:** covers all seven lessons.
- **Not a repeat of the book's assessment (pp. 57-63).** The generator asserts that:
  - no post-test question shares a topic with a book assessment item (the topics are listed in
    the generator);
  - no post-test key is a book assessment key;
  - no post-test question repeats a lesson's worked example.
- **Misconception codes: 15**, SMA11-G-B1-01…15. The book has no Miskonsepsi section, so all 15
  come from the distractors. Examples: boundary directions swapped, one kind of letak mistaken
  for another, time-zone direction, the monsoons swapped, inner and outer arcs swapped. The
  workbook's Kode miskonsepsi column is empty.

## Checks

```
$ python3 docs/onboarding/konten/sma11_geografi_bab1.py --kutipan <book text>
SMA11-Geografi-Bab1.xlsx: lessons 7 (33 pages), questions 31 (pre 4, post 8, practice 19), answers A=8 B=8 C=8 D=7
SMA11-Geografi-Bab1-miskonsepsi.csv: 15 codes
facts traced: 100 (pages 4-55)
quotations found in the book's text: 98 of 100; figures read by eye: zona_iklim, hutan_luas
assertions passed: 858

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SMA11-Geografi-Bab1.xlsx docs/onboarding/konten/SMA11-Geografi-Bab1.paket.json
docs/onboarding/konten/SMA11-Geografi-Bab1.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA11-Geografi-Bab1.paket.json
questions 31: pre 4, post 8, practice 19; answers A=8 B=8 C=8 D=7; correct option strictly longest in 0
TOTAL: 0 ERROR, 31 WARNING (WEAK_MISCONCEPTION_LINKAGE 31)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA11-Geografi-Bab1.paket.json --miskonsepsi docs/onboarding/konten/SMA11-Geografi-Bab1-miskonsepsi.csv
TOTAL: 0 ERROR, 0 WARNING
```

- Without `--kutipan` the generator runs everything else and passes 857 assertions. The one
  extra assertion checks the quotations against the book's text.
- The SD5 Bab 1-9 generators re-run unchanged. Their xlsx files were restored, because only the
  timestamps change.
- `npm run lint`: 0 errors, and the 2 warnings that were already there.

## Book errors and inconsistencies

I checked these against the page images. None is copied into the workbook; where two figures
disagree, the lessons use the dated, sourced one and say which.

1. **Sea area and coastline:**
   - p. 23 gives 5,9 juta km² of sea and 95.161 km of coastline (Arianto, 2020).
   - The p. 24 infographic gives the coastline as "95,181km".
   - The p. 27 infographic gives the sea as 5,8 juta km².
   - Lesson 5 uses p. 23's figures.
2. **Forest cover:**
   - Gambar 1.21 (p. 21, BPS via databoks 2023) states 101,22 juta ha, but its seven parts add
     up to **100,1**.
   - The p. 16 infographic gives different figures (Papua 38,2 … Jawa 3), in which Jawa
     outranks Bali-Nusa Tenggara; p. 21 has them the other way round (1,6 and 2,7).
   - Lesson 5 and LT11 use p. 21 and ask only for the largest region, Papua, which both sources
     agree on.
3. **p. 46:** "Gorontalo, Sulawesi Utara". Gambar 1.4 (p. 6) lists Gorontalo as a province of
   its own. Not used.
4. **p. 22:** the forest list is headed "berdasarkan fungsinya". The next list begins "Selain
   pembagian berdasarkan jenisnya, hutan juga … berdasarkan fungsinya", but both lists give the
   same three functions. Lesson 5 gives one list, by function.
5. **p. 36:** coal production for 2018 and 2019 is cited to "(BPS, 2017)".
6. **p. 33:** TSCF is expanded as "Trillion Square Cubic Feet".
7. **Gambar 1.8** labels the monsoons "Muson Barat" and "Muson Timur", while the text (p. 8)
   says "muson barat laut" and "muson tenggara". The lessons use the text's names and mention
   the figure's.
8. **Typos:**
   - "Loekseumawe" (p. 31);
   - "(Rai & Anaperta, 202)1" (p. 39);
   - "alumunium" (p. 24; quoted as printed in the fact table).
9. **p. 37:** nickel reserves are dated "sepanjang tahun lalu" without a year, so the lesson
   gives the 21% without a date.

## Questions for the coordinator

Three statements look doubtful from outside the book. The brief says to use no outside facts, so
I did not correct them. I kept them out of every question and, where I could, out of the
lessons:

- p. 13 lists Gunung Leuser among the 127 active volcanoes. Lesson 3 names only the others.
- p. 39 places Pulau Derawan in Kalimantan Selatan. Not used.
- p. 34 calls LNG "tidak mudah terbakar" in the same breath as a fuel. Not used.

The book's boundary points, including Sungai Fly in Merauke, Provinsi Papua, are taught as the
book gives them. Should any of these be raised with the book's authors?
