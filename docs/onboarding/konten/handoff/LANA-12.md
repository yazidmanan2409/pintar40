# LANA-12: SMA XI Geografi Bab 3, Lingkungan dan Kependudukan

Source: the student book "Geografi untuk SMA/MA Kelas XI (Edisi Revisi)" (Budi Handoyo, Nisa
Maulia), Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2024, Bab III, pp. 137-194.
The book has no answer keys, so every key is mine.

## Content

Seven text lessons, 32 pages. They follow sections A and B in order, and address the student as
"kalian".

1. **Lingkungan Hidup dan Ekosistem** (A.1)
   - Lingkungan hidup, ekologi, ekosistem and etika lingkungan.
   - Producers, consumers and decomposers.
   - Abiotic and social-cultural surroundings.
   - Natural (water, land) against man-made surroundings, with one "Coba pikirkan" that has no key.
2. **Manfaat dan Kualitas Lingkungan** (A.2-A.3)
   - Six benefits.
   - Daya dukung.
   - IKLH and its three indicators, with the rise 66,55 → 70,27 (KLHK 2021) worked out as 3,72.
   - Natural and social-cultural factors.
3. **Masalah Lingkungan dan Upaya Mengatasinya** (A.4-A.5)
   - Global warming and the ozone layer.
   - Air pollution and acid rain; water pollution (Citarum 2018).
   - Sea, soil and population pressure.
   - One remedy for each problem.
4. **Dinamika dan Pertumbuhan Penduduk** (B.1)
   - Penduduk; the UN projection; Indonesia's "sedang" category.
   - The three growth formulas, with a worked example on fresh numbers.
   - Census (de facto, de jure, canvasser, householder; the seven censuses).
   - Registration and survey.
5. **Sumber Daya Manusia dan Komposisi Penduduk** (B.2-B.3)
   - SDM, micro against macro; quantity against quality.
   - Distribution by island (BPS 2020), one line per region.
   - Age groups, generations, bonus demografi and ageing population.
   - Sex ratio 102, worked out in two steps.
   - The three pyramids, and Indonesia's 2020 shares.
6. **Kualitas dan Pengembangan SDM** (B.4-B.5)
   - IPM; Mulyadi's (2003) policies.
   - Health (AHH) and education.
   - Developing SDM, including turn over.
7. **Masalah Kependudukan dan Upaya Mengatasinya** (B.6-B.7, with the chapter recap)
   - Four problems.
   - Tabel 3.1, one line per period.
   - KB and health services; transmigration with the book's totals; education and farming.

**No figures, no tables.** Tabel 3.1 (growth rate per period) and the regional shares are written
one fact per line. The generator asserts that no lesson contains a table row.

**Book errors kept out.** The generator asserts that no lesson contains "permukaan matahari", "107
jiwa" or "1.49%" (items 1-3 below), and that no question rests on the error-record fact.

## Every fact is traced

- **The fact table.** `FAKTA` holds **103 facts**, each with its page (pp. 140-184) and the book's
  own words. One fact (`fotosintesis_matahari`) is kept only as the record of error 1.
- **Every option names its fact**, and the generator checks the option's content words against
  that fact's quotation. The check rejected one wording ("pemanasan global" against the
  mechanism quote), which now rests on the book's own sentence about pemanasan global (p. 152).
  One option corrects the book's spelling ("persentase" for p. 171's "presentase"); `EJAAN` maps
  it back for the check.
- **Quotations checked against the book.** `--kutipan` finds **103 of 103** in the book's text.
- **What is computed and asserted:**
  - IKLH: 70,27 − 66,55 = 3,72, above the target 68,71; the two other differences (1,56, 2,16)
    that serve as distractors;
  - the six regional shares add up to 100%; 151,59 and 58,56 of 270,2 juta give 56,10% and 21,68%;
  - the 2020 age groups add up to 100%;
  - 136,66 + 133,54 = 270,20 juta; their ratio is 102; 50,58% are men;
  - 251.755 + 386.188 = 637.943 transmigrant families;
  - Tabel 3.1: highest 1971-1980, lowest 2010-2020;
  - the three growth formulas, used by the lesson's example and by PA3, PB4 and L10 on fresh
    numbers; the sex-ratio rule, used by L14 on fresh numbers;
  - the three book inconsistencies in items 2-4 below.
- **The models, built from the book's own lists:** producers, consumers and decomposers; the
  abiotic and cultural components; the three pyramids and their example countries; the ways of
  collecting population data.

## Questions

31 questions: 4 pre-test, 8 post-test and 19 practice.

- **Format:** every question has one answer among four options, A–D.
- **Answer positions:** A=8, B=8, C=8, D=7. The correct option is never strictly the longest.
- **Pre-test:** samples lessons 1, 3, 4 and 7.
- **Post-test:** covers all seven lessons; 7 are Sedang and 1 (total growth) is Sulit.
- **Not a repeat of the book's assessment (pp. 185-191).** The generator asserts that:
  - no post-test question shares a topic with any of the book's 25 assessment items (all listed
    in the generator);
  - no post-test answer contains a book assessment key (lingkungan hidup, kualitas lingkungan,
    etika, sensus, registrasi, efek rumah kaca, sampah, 102);
  - the post-test's growth question uses different numbers from the lesson's example.
- **Misconception codes: 15**, SMA11-G-B3-01…15, all drawn from the distractors (the book has no
  Miskonsepsi section). The workbook's Kode miskonsepsi column is empty.

## Checks

```
$ python3 docs/onboarding/konten/sma11_geografi_bab3.py --kutipan <book text>
SMA11-Geografi-Bab3.xlsx: lessons 7 (32 pages), questions 31 (pre 4, post 8, practice 19), answers A=8 B=8 C=8 D=7
SMA11-Geografi-Bab3-miskonsepsi.csv: 15 codes
facts traced: 103 (pages 140-184)
quotations found in the book's text: 103 of 103; figures read by eye: none
assertions passed: 866          (865 without --kutipan)

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SMA11-Geografi-Bab3.xlsx docs/onboarding/konten/SMA11-Geografi-Bab3.paket.json
docs/onboarding/konten/SMA11-Geografi-Bab3.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA11-Geografi-Bab3.paket.json
questions 31: pre 4, post 8, practice 19; answers A=8 B=8 C=8 D=7; correct option strictly longest in 0
TOTAL: 0 ERROR, 31 WARNING (WEAK_MISCONCEPTION_LINKAGE 31)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA11-Geografi-Bab3.paket.json --miskonsepsi docs/onboarding/konten/SMA11-Geografi-Bab3-miskonsepsi.csv
TOTAL: 0 ERROR, 0 WARNING
```

- Geografi Bab 1 (857), Bab 2 (855) and SD5 Bab 1-9 re-run unchanged. Their xlsx files were
  restored, because only the timestamps change.
- `npm run lint`: 0 errors and the 2 warnings that were already there.

## Book errors and inconsistencies

None is copied into the workbook.

1. **p. 143:** "proses fotosintesis dapat terjadi di sekitar permukaan matahari". It should be the
   water surface.
2. **p. 168:** population density went from 124 (2010) to 107 (2020) jiwa/km², and the book calls
   this an increase. Both figures also conflict with the 141 jiwa/km² on the same page
   (270,2 juta : 1,92 juta km² ≈ 141, asserted). The lesson gives no density figure.
3. **p. 181:** the growth rate is said to have fallen "sejak tahun 1971", but Tabel 3.1 has
   2000-2010 (1,49%) above 1990-2000 (1,44%). The lesson lists the table and makes no trend claim.
4. **p. 160:** 1,49% is "sekitar empat juta jiwa per tahun", while the target 1,19% is 1-2 juta; at
   the same population 1,19% would be over 3 juta. The 1,49% (BPS 2021) also differs from Tabel
   3.1's 1,25% for 2010-2020. The lesson keeps only the category "sedang" (1-2% a year).
5. **p. 149:** the acronym IKL is used both for Kualitas Lahan (in IKLH) and for Indeks Kesehatan Lingkungan;
   Gambar 3.9 labels it IKTL. The lesson uses the text's "Kualitas Lahan (IKL)".
6. **Assessment item 3:** angka harapan sekolah cannot be derived from the data given.
7. **Assessment item 4:** a table of UHH is used to infer stillbirths, which it does not show.
8. **Typos:** "piramina" and "Pirimida" in figure captions; "defortasi"; a stray "z" on p. 164.

## Round 2 (coordinator's review)

- **Greenhouse mechanism.** Lesson 3 now says only that pemanasan global comes from the effect of
  greenhouse gases and raises the Earth's temperature, followed by its effects. The "reflected back
  to Earth" sentence is gone, and so is its fact. L7 is replaced by a traced question on an effect
  of pemanasan global (key: lapisan es di kutub mencair dan permukaan air laut naik, `gw_dampak`),
  still at B.
- **CFC.** Lesson 3, L9's key and PA2's rationale now say "gas klorin dari CFC"; bromine is gone.
- **PB1.** The stem drops "hanya" ("peran produsen dapat dilakukan oleh …"), with the same key.
  D is now an abiotic group (air, tanah, udara, dan cahaya matahari). The producer fact is split so
  that no traced quotation says "hanya".
- **The generator asserts** that no lesson and no question contains "dipantulkan", "bromida" or
  "hanya dapat dilakukan".
- **Nits:**
  - L4's distractor C is now "oksigen untuk bernapas bagi makhluk hidup" (traced to p. 147,
    `oksigen`).
  - L3's rationale says "Keempatnya".
  - L16 says "persentase".
  - Lesson 2 says "Indeks Kualitas Lahan (IKL)".
- Answer positions are unchanged: A=8, B=8, C=8, D=7.

## Questions for the coordinator

None. Six claims look doubtful from outside the book, and I left them out of every question and
lesson, as agreed for Bab 1 and 2. The first three were raised in the coordinator's review:

- that greenhouse gases reflect solar radiation back to the Earth (p. 152). They absorb the heat
  the Earth gives off;
- "gas klorin dan bromida" in CFCs (p. 152). CFCs carry chlorine; bromine comes from halons;
- that the producer role "hanya dapat dilakukan oleh tumbuhan yang berklorofil" (p. 142); alga and
  phytoplankton are producers too;

- greenhouse gases thinning the ozone layer, and CO listed as a greenhouse gas (p. 152);
- "Pada tahun 2010 … akan meningkat 150%" for ocean acidity (p. 155);
- lingkungan buatan made of "hanya satu jenis" (p. 146).
