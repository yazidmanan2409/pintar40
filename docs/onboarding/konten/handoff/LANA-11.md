# LANA-11: SMA XI Geografi Bab 2, Keragaman Hayati Indonesia dan Dunia

Source: the student book "Geografi untuk SMA/MA Kelas XI (Edisi Revisi)" (Budi Handoyo, Nisa
Maulia), Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2024, Bab II, pp. 67-136
(`sma11-geografi-ch2-lesson.pdf`, 70 pages). The book has no answer keys, so every key is mine.

## Content

Seven text lessons, 34 pages. They follow sections A-G in order, and address the student as
"kalian".

1. **Pengertian dan Arti Penting Flora dan Fauna** (A.1-A.2)
   - Flora, fauna and endemism.
   - Food: rice and sago, with the book's 2014 UP4B areas.
   - Health and the economy.
   - The tiger in the food chain.
2. **Ragam dan Permasalahan Flora Fauna Indonesia** (A.3)
   - Rain in the west and in the east.
   - Tabel 2.1 and 2.2 (LIPI, 2014), written one line per fact.
   - Overexploitation.
   - Extinction threats, with the book's dated figures.
3. **Persebaran Bioma Dunia** (B.1)
   - Grassland (prairie, steppe, savanna).
   - Desert and tundra.
   - Tropical forest.
   - Deciduous forest and taiga.
4. **Wilayah Fauna Dunia Menurut Wallace** (B.2)
   - The eight regions of 1876, where each lies and its animals.
   - One "Coba pikirkan" with no key.
5. **Sebaran Flora dan Fauna di Indonesia** (C)
   - The Wallace and Weber lines, with Gambar 2.40 put into words.
   - The four flora regions.
   - The three fauna regions.
6. **Faktor yang Memengaruhi Sebaran Flora dan Fauna** (D)
   - 0,5 °C every 100 m, with a worked example and a "Coba".
   - Gambar 2.44's height zones as four lines.
   - Humidity classes.
   - Rain and soil.
   - People, animals and plants.
7. **Manfaat dan Pelestarian Flora dan Fauna** (E-G)
   - Benefits.
   - Bioregional management.
   - Conservation (UU No. 5/1990).
   - In situ and ex situ.
   - AKKM.

**No figures, no tables.** Gambar 2.40 (the Wallace and Weber lines) and Gambar 2.44 (the height
zones and their crops) are put into words, and Tabel 2.1 and 2.2 are written one fact per line.
The generator asserts that no lesson contains a table row.

**Contradictions left out.** Where the book contradicts itself, the lessons use only the parts
that are consistent and leave the contradiction out:

- taiga is not called "one tree species";
- the steppe is described only by its short grass and shrubs;
- kiwi is not listed as a bird of Papua;
- lemur is not listed as a tundra mammal;
- Maluku is never asked about;
- Leuser is not named, as in Bab 1.

## Every fact is traced

- **The fact table.** `FAKTA` holds **122 facts**, each with its page (pp. 70-125) and the
  book's own words.
- **Every option names its fact.** Every option of every question names the fact it rests on,
  and the generator checks that the option's content words appear in that fact's quotation. The
  check rejected 12 of my first option wordings until they used the book's words.
- **Quotations checked against the book.** `--kutipan` checks every quotation against the
  book's extracted text. **121 of 122 are found.** The one not found is Gambar 2.44, the height
  zones, whose labels the PDF text lays out out of order; the generator allows only that one.
- **What is computed and asserted:**
  - the sago areas: 5,2 < 5,5 < 6,5 juta ha;
  - the Tabel 2.1 and 2.2 counts, and which group is largest and smallest;
  - the 0,5 °C-per-100-m rule, used by one post-test question and the lesson's two worked
    examples;
  - the book's assessment item 9, which has no correct option (below).
- **The models, built from the book's own lists:**
  - Wallace's 8 regions, each with its places, asserted against its quotation;
  - Indonesia's three fauna regions, with their islands and animals;
  - plants by humidity: xerophyta, mesophyta, hygrophyta, tropophyta;
  - the height zones and their crops (Gambar 2.44);
  - in situ against ex situ.

## Questions

30 questions: 4 pre-test, 8 post-test and 18 practice.

- **Format:** every question has one answer among four options, A–D.
- **Answer positions:** A=8, B=7, C=8, D=7. The correct option is never strictly the longest.
- **Pre-test:** samples four lessons.
- **Post-test:** covers all seven lessons; 7 are Sedang and 1 is Sulit.
- **Not a repeat of the book's assessment (pp. 127-134).** The generator asserts that:
  - no post-test question shares a topic with any of the book's 25 assessment items (all listed
    in the generator);
  - no post-test answer is one of the book's assessment keys (taiga, hutan hujan tropis,
    Ethiopian, Nearktik, eksploitasi);
  - the post-test's temperature question uses different heights and temperatures from the
    lesson's examples.
- **Misconception codes: 14**, SMA11-G-B2-01…14, all drawn from the distractors (the book has
  no Miskonsepsi section). The workbook's Kode miskonsepsi column is empty.

## Checks

```
$ python3 docs/onboarding/konten/sma11_geografi_bab2.py --kutipan <book text>
SMA11-Geografi-Bab2.xlsx: lessons 7 (34 pages), questions 30 (pre 4, post 8, practice 18), answers A=8 B=7 C=8 D=7
SMA11-Geografi-Bab2-miskonsepsi.csv: 14 codes
facts traced: 122 (pages 70-125)
quotations found in the book's text: 121 of 122; figures read by eye: zona_suhu
assertions passed: 858          (857 without --kutipan)

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SMA11-Geografi-Bab2.xlsx docs/onboarding/konten/SMA11-Geografi-Bab2.paket.json
docs/onboarding/konten/SMA11-Geografi-Bab2.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA11-Geografi-Bab2.paket.json
questions 30: pre 4, post 8, practice 18; answers A=8 B=7 C=8 D=7; correct option strictly longest in 0
TOTAL: 0 ERROR, 30 WARNING (WEAK_MISCONCEPTION_LINKAGE 30)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA11-Geografi-Bab2.paket.json --miskonsepsi docs/onboarding/konten/SMA11-Geografi-Bab2-miskonsepsi.csv
TOTAL: 0 ERROR, 0 WARNING
```

- Geografi Bab 1 (857 assertions) and SD5 Bab 1-9 re-run unchanged. Their xlsx files were
  restored, because only the timestamps change.
- `npm run lint`: 0 errors and the 2 warnings that were already there.

## Book errors and inconsistencies

I checked these against the page images. None is copied into the workbook.

1. **p. 110:** "Daerah yang terletak pada lintang 90° di daerah khatulistiwa". The equator is
   0°; 90° is the pole (the book's own tundra section, p. 86, has the sun reaching only 23½°).
   The lesson leaves this sentence out.
2. **Taiga, p. 89:** "bioma yang hanya terdiri atas satu spesies pohon", while the same page
   lists spruce, alder, birch and juniper.
3. **Steppe, p. 84:** it is placed "di daerah dengan curah hujan tinggi", yet its plants are
   "tahan terhadap kelembapan rendah". It is described as short grass, and then "Contohnya,
   berupa rumput-rumput tinggi". The rainfall also conflicts with p. 112 (200-1.000 mm).
4. **Kiwi:** p. 100 calls it endemic to the Oceanik region, but p. 99 lists it for Australian
   and p. 109 among the birds of eastern Indonesia.
5. **Lemur:** p. 92 says it is found only on Madagaskar, but p. 87 lists it as a tundra mammal.
6. **Komodo and anoa** are given as endemics of the Oriental region (p. 98). The book also says:
   - Oriental covers only western Indonesia (p. 97);
   - komodo and anoa belong to Wallacea, central Indonesia (p. 107).
7. **Maluku:** p. 106 puts it in the east ("bagian timur (Maluku dan Papua)"); p. 107 puts
   Kepulauan Maluku in Wallacea, the centre. No question asks about Maluku.
8. **Birds:** Tabel 2.2 (p. 79) gives 1.600 kinds; p. 114 gives 1.519. The lesson uses the
   table.
9. **Jati, p. 75:** "banyak ditemukan di kawasan pulau Jawa dan pulau Kalimantan", then "di
   Kalimantan dan Sumatra … tidak dapat tumbuh secara maksimal".
10. **Harimau:** p. 92 lists it among Ethiopian grassland mammals, while p. 97 makes it khas
    Oriental. The lessons use Oriental.
11. **Gambar 2.40:** two different dashed lines are both labelled "Garis Weber".
12. **Aktivitas 2.5 (p. 118)** repeats Aktivitas 2.4 (p. 114) word for word. It is about fauna
    but is placed after the section on benefits.
13. **The book's assessment item 9 (p. 129) has no correct option.** 2.400 : 30 × 0,008 ton =
    0,64 ton; the options are 0,008, 0,08, 0,8, 8 and 80 ton. The generator asserts this.
14. **Against Bab 1:** p. 77 gives the coastline as 95.181 km and the sea as 7 juta km² (of about
    9 juta km² in all). Bab 1 p. 23 says 95.161 km and 5,9 juta km².
15. **Labels and typos:**
    - the Refleksi (p. 136) asks about "materi dalam Bab III";
    - "Timur-Timur" (p. 102);
    - "ulir" among the critical plants (p. 81), while Gambar 2.11 shows ulin;
    - "Gunung Louser" (p. 122).

## Questions for the coordinator

None. Four claims look doubtful from outside the book, and I left them out of every question, as
agreed for Bab 1:

- penguins in the Arctic (p. 87);
- Parangkusumo placed in Jawa Tengah (p. 111);
- kuskus called "kanguru pohon" (p. 108);
- the year 1929 for Eijkman's finding (p. 115).
