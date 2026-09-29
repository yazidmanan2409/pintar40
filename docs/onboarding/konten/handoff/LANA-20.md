# LANA-20: SMA X Matematika Bab 6, Representasi dan Interpretasi Data

Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
dkk.), Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, ISBN 978-623-118-558-7,
Bab 6, pp. 177-238 (the ch6 PDF, 62 pages). The chapter has no numbered Contoh. Its worked
examples are checked here:
- the histogram areas;
- the OSIS clothes;
- the shoe sales (Tabel 6.4-6.6);
- the median interpolation;
- the download speeds;
- the solar and wind box plots;
- Bima's scatter plot.

Latihan 6.1-6.6 and the Uji Kompetensi have no keys, so every key is mine, and every key is
computed. The method, notation and gate are Bab 1's.

## Content

Six text lessons, 22 pages. They address the student as «kamu». Every worked example states its
question first and answers it.

1. **Histogram dan Diagram Batang** (A.1)
   - The differences: quantitative data in intervals against categories; bars that touch
     against bars with gaps; area against length.
   - The area example: 2 × 8 + 2 × 16 = 48 = 4 × 12, with the merged class correctly named 0–4.
   - Dani's misleading chart: the axis starts at 60, so 90 and 70 appear as 30 and 10.
   - One «Coba pikirkan».
2. **Frekuensi Relatif** (A.2)
   - Percentages that sum to 100%.
   - The book's own question answered: 16% of 200 = 32.
   - My own comparison: 14/40 = 35% against 9/25 = 36%.
3. **Modus, Median, dan Mean** (B.1 a-c)
   - Definitions and jangkauan.
   - The book's median-position rule, applied to n = 15 and n = 10.
   - OSIS: mean 6, median 5,5, modus 3 and 5, range 7.
   - With 20 and 22 added: mean 8,5, median 6,5, modus unchanged.
   - When to use each measure, in the book's words.
4. **Ukuran Pemusatan Data Kelompok** (B.1 d-e)
   - The 30 shoe sales; nilai tengah and tepi.
   - Grouped mean 42,6 against the single-data mean ≈ 42,53.
   - Kelas modus 43–45.
   - Median by interpolation: 42,875 against 43.
5. **Kuartil dan Box Plot** (B.2, C.1)
   - The quartile positions; n = 20.
   - The shoe box plot: 38, 41, 43, 44, 46; IQR 3.
   - Pencilan beyond 1,5 × IQR.
   - The download speeds with the **corrected** upper fence 29,25; the lower fence is 19,25.
   - 36 is an outlier and is drawn as a separate point, with the whisker ending at 27.
6. **Diagram Pencar dan Korelasi** (C.2)
   - Bima's data (a partial list of value lines).
   - Positive, negative and none; strong and moderate.
   - **Korelasi bukan sebab-akibat**, with Bima's case and an ice-cream and swimming example.
   - The chapter recap.

Not used:
- the Covid and vaccine figures (p. 179);
- the Covid table (Tabel 6.1);
- the 1998 Olympics chart;
- the PM2.5, AI and social-media data sets;
- the Pengayaan (grouped quartiles and percentiles, the KTP poster);
- the rainfall and cattle data;
- standard deviation, which the Uji Kompetensi asks for but the chapter never teaches.

**Notation:**
- x̄ = Σx : n; Q1, Q2, Q3; decimal comma; «−» as the minus sign.
- Tables, charts and number lines become value lines.
- `notasi()` passes; lessons are also checked to contain no «salah».

## Every number is proven, every fact is traced

- **Statistics code.** `ukuran()` implements the book's position rule (n × 1/4, 1/2, 3/4; a whole
  number → the middle of two data, otherwise round up). `rerata()`, `modus()` and
  `pencilan_batas()` work on Fractions.
- **Data checked against the book:**
  - Tabel 6.4, re-read (25 sales, «45 muncul dua kali»);
  - with the 5 late sales it reproduces Tabel 6.5 and 6.6 exactly;
  - the grouped mean, the interpolation and the five-number summary are computed from it;
  - the download, solar and wind data reproduce every quartile and fence in the book, except
    the one book error below;
  - Tabel 6.3 sums to 100% in both columns;
  - Bima's correlation is r > 0,99, and every pair of points is co-monotone.
- **Distractors:** every distractor value is computed by the procedure its rationale names. For
  example, LT18's 29,75 is 26 + 3,75, and PB5's 14,5 is the lower class limits weighted by the
  frequencies.
- **Assertions:** 3.356 with `--kutipan` (3.355 without).
- **FAKTA:** 49 facts (pp. 179-229). `--kutipan` finds **49 of 49**. Twelve facts are kept only
  as the book-error record.

## Questions

32 questions: 4 pre-test, 8 post-test and 20 practice.

- **Answer positions:** A=8, B=8, C=8, D=8. The correct option is never strictly the longest.
- **Pre-test:** lessons 1, 3, 5 and 6.
- **Post-test:** covers all six lessons. 7 are Sedang and 1 is Sulit (PB7).

  | Item | Question | Numbers |
  |---|---|---|
  | PB1 | histogram frequency | luas batang |
  | PB2 | relative frequency | 12% of 250 → 30 |
  | PB3 | mean update | 4 tests at 75, then 85 → 77 |
  | PB4 | outlier and centre | 4, 4, 5, 5, 6, 30 → median 5 |
  | PB5 | grouped mean | 10–14, 15–19, 20–24 → 16,5 |
  | PB6 | IQR | 12 sorted data → 8,5 |
  | PB7 | outlier fence | Q1 = 20, Q3 = 28 → 42 |
  | PB8 | correlation and cause | es krim dan orang tenggelam |

  The generator asserts that these share nothing with `BUKU`, and that no post-test stem
  contains the book's data.
- **LT18** uses the book's own p. 208 slip (29,75) as a named distractor. The lessons are checked
  to be free of 29,75.
- **Misconception codes: 14**, SMA10-M-B6-01…14. Each is used by at least one distractor.

## Checks

```
$ python3 docs/onboarding/konten/sma10_matematika_bab6.py --kutipan <book text>
SMA10-Matematika-Bab6.xlsx: lessons 6 (22 pages), questions 32 (pre 4, post 8, practice 20), answers A=8 B=8 C=8 D=8
SMA10-Matematika-Bab6-miskonsepsi.csv: 14 codes
facts traced: 49 (pages 179-229)
quotations found in the book's text: 49 of 49; figures read by eye: none
assertions passed: 3356          (3355 without --kutipan)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA10-Matematika-Bab6.paket.json --miskonsepsi docs/onboarding/konten/SMA10-Matematika-Bab6-miskonsepsi.csv
questions 32: pre 4, post 8, practice 20; answers A=8 B=8 C=8 D=8; correct option strictly longest in 0
TOTAL: 0 ERROR, 0 WARNING
```

- **Fixed before hand-off:**
  - The length assertion caught three strictly-longest keys:
    - PB6: «7» became «15,5» (Q3);
    - LT3: a distractor became «tidak ada; nilai 90 memang tiga kali nilai 70»;
    - LT14: «19,5» became «28,75», the class limit 20 used instead of the boundary 19,5.
  - periksa_mutu flagged one IMPLAUSIBLE_DISTRACTOR: LT4 «50%» became «50% dari banyak data».
- **Rebuild:** a second run gives a byte-identical package.
- **Regression:** SD5 Bab 1-9, Geografi Bab 1-4 and SMA10 Bab 1-5 re-run and pass unchanged.
- `npm run lint`: 0 errors, the 2 old warnings.

## Book errors and inconsistencies

None is copied into the workbook; `DILUAR` markers assert that the wording is absent.

1. **p. 208, the upper outlier fence:** «Q3 + 1.5 x IQR = 26 + 3.75 = 29,75». Q3 is 25,5, which
   the book computed a few lines earlier, so the fence is 29,25 (asserted). The conclusion
   (36 is an outlier) still holds.
   - The same page says the outlier gives a long upper whisker. On a box plot the outlier is
     drawn as a separate point, and the whisker ends at 27.
   - The page also writes decimals with points: «1.5», «3.75».
2. **p. 204: «Median = Q1»** should read Median = Q2.
3. **p. 215: correlation read as cause and effect.** «dapat disimpulkan hubungan sebab-akibat …
   makin banyak buku yang dibaca, maka nilai ujian bahasa akan makin baik». The book itself says
   on p. 219 that not every correlation is causal. The lesson teaches that correlation is not
   causation.
4. **p. 184:** after merging, the class is called «kelas 2–4 pada histogram kanan». It is the
   class 0–4 (area 48 = 4 × 12).
5. **p. 193:** modus and median are «tidak terpengaruh» by outliers. That is overstated: in the
   book's own OSIS example the median moves from 5,5 to 6,5. The lesson says the median «berubah
   sedikit».
6. **p. 198:** «panjang kelas sama dengan 2», but the classes 37–39, 40–42, … each hold three
   sizes (asserted).
7. **pp. 198-199:** Tabel 6.5 and 6.6 hold 30 sales, which is Tabel 6.4 plus the 5 late ones
   from Eksplorasi 6.3. Latihan 6.3 no. 1 calls Tabel 6.6 «Tabel 6.4 kita ubah», but Tabel 6.4
   has 25 (asserted). The lesson says «30 ukuran sepatu».
8. **p. 179, the Covid figures:**
   - 3% of 6.000 is 180, not 200;
   - 5 of 40.000 is 0,0125%, so «300 kali» is about 240 (asserted).
   These health claims are kept out entirely.
9. **Pengayaan, pp. 225-227:**
   - «P10 = data ke 85/100» should be P85;
   - «Hitunglah S65» should be P65;
   - «35% warga menunggu lebih dari 46,31 menit» should be 48,31;
   - the P90 step is headed «P65».
10. **p. 229:** «2 musim, yaitu musim panas dan musim hujan». Indonesia's seasons are kemarau
    and hujan. Kept out.
11. **Typos:** «pata tahun 2020» (p. 180); «0.06 kilowatt hour» and «14.4 kWh» (p. 209).

Checked and consistent (no error):
- Tabel 6.5 and 6.6 against the data.
- The grouped median 42,875.
- The download quartiles 23, 24 and 25,5.
- The solar and wind five-number summaries, IQRs and fences.
- Tabel 6.3 sums.
- Uji Kompetensi 3 (Dodi: mean 80, median 80).
- Uji Kompetensi 4 (69,2).

## Questions for the coordinator

None.
