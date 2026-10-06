# LANA-13: SMA XI Geografi Bab 4, Perubahan Iklim dan Kebencanaan

Source: the student book "Geografi untuk SMA/MA Kelas XI (Edisi Revisi)" (Budi Handoyo, Nisa
Maulia), Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2024, Bab IV, pp. 195-252
(`sma11-geografi-ch4-lesson.pdf`, 58 pages). The book has no answer keys, so every key is mine.
This is the last chapter: SMA XI Geografi is complete with Bab 1-4.

## Content

Seven text lessons, 33 pages. They follow sections A-D in order, and address the student as
"kalian".

1. **Perubahan Iklim dan Gejalanya** (A)
   - Iklim against cuaca (more than 30 years).
   - The definition of perubahan iklim and its elements.
   - Seven symptoms.
   - One "Coba pikirkan" with no key.
2. **Pemanasan Global sebagai Penyebab Perubahan Iklim** (B)
   - The definition.
   - The gases, which trap the heat the Earth's surface gives off (p. 201).
   - The four-step process.
   - The source of each gas.
3. **Pengaruh Perubahan Iklim terhadap Wilayah Indonesia** (C)
   - Islands.
   - The four coasts.
   - Six effects on land.
4. **Bencana dan Dinamikanya** (D.1.a)
   - Kerentanan (four kinds), ancaman, kapasitas.
   - Sitiarjo: 847 − 350 = 497 homes.
   - Semeru, without its casualty figures.
   - One "Coba pikirkan".
5. **Jenis dan Sebaran Bencana Alam** (D.1.b)
   - Gempa and tsunami.
   - Gunung berapi, longsor and banjir.
   - Kekeringan, karhutla and puting beliung.
6. **Mitigasi Bencana Alam** (D.2)
   - Definition and aims.
   - Structural against non-structural.
   - Mitigation for each of six disasters.
7. **Adaptasi Bencana Alam** (D.3, with the chapter recap)
   - Definition.
   - Adaptation for each disaster, including:
     - the three landslide strategies;
     - the five kinds of flood adaptation;
     - the four kinds at Desa Sungai Tohor.

**No figures, no tables.** The maps of disaster distribution (Gambar 4.25-4.43) are not
used; where the text names regions, the lesson gives them one per line.

## Every fact is traced

- **The fact table.** `FAKTA` holds **131 facts**, each with its page (pp. 198-243) and the
  book's own words. Six of them are kept only as the record of the book errors below
  (`REKAMAN`), and the generator asserts that no question rests on them.
- **Every option names its fact**, and the generator checks the option's content words against
  that fact's quotation. All options passed on the first run.
- **Quotations checked against the book.** `--kutipan` finds **131 of 131** in the book's text.
- **What is computed and asserted:**
  - Sitiarjo: 847 − 350 = 497;
  - the book's inconsistencies in items 1-4 below.
- **The models, built from the book's own lists:**
  - the greenhouse gases;
  - the four kinds of kerentanan;
  - the mitigation for each disaster (no activity listed twice);
  - the five kinds of flood adaptation;
  - the four kinds of adaptation at Sungai Tohor;
  - the three landslide strategies.
  Each is asserted against its quotation, except the mitigation lists, which are asserted to
  name no activity twice.
- **Kept out, and asserted.** Every doubtful statement listed under "Questions for the
  coordinator" has a marker word or phrase in `DILUAR`. The generator asserts that no lesson and
  no question contains any of them.

## Questions

32 questions: 4 pre-test, 8 post-test and 20 practice.

- **Format:** every question has one answer among four options, A–D.
- **Answer positions:** A=8, B=8, C=8, D=8. The correct option is never strictly the longest.
- **Pre-test:** samples lessons 2, 4, 5 and 7.
- **Post-test:** covers all seven lessons; 7 are Sedang and 1 (flood adaptation) is Sulit.
- **Not a repeat of the book's assessment (pp. 245-250).** The generator asserts that:
  - no post-test question shares a topic with any of the book's 25 items (all listed in the
    generator);
  - no post-test answer contains a book assessment key (karbon dioksida, rob, tsunami, kekeringan,
    pemutihan, emisi gas rumah kaca, suhu rata-rata, risiko bencana, banjir, tanah longsor, gempa
    bumi, konservatif, metan), checked as whole words;
  - no post-test question uses the lesson's examples (Sitiarjo, Semeru).
- **Misconception codes: 15**, SMA11-G-B4-01…15, all drawn from the distractors (the book has no
  Miskonsepsi section). The workbook's Kode miskonsepsi column is empty.

## Checks

```
$ python3 docs/onboarding/konten/sma11_geografi_bab4.py --kutipan <book text>
SMA11-Geografi-Bab4.xlsx: lessons 7 (33 pages), questions 32 (pre 4, post 8, practice 20), answers A=8 B=8 C=8 D=8
SMA11-Geografi-Bab4-miskonsepsi.csv: 15 codes
facts traced: 131 (pages 198-243)
quotations found in the book's text: 131 of 131; figures read by eye: none
assertions passed: 922          (921 without --kutipan)

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SMA11-Geografi-Bab4.xlsx docs/onboarding/konten/SMA11-Geografi-Bab4.paket.json
docs/onboarding/konten/SMA11-Geografi-Bab4.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA11-Geografi-Bab4.paket.json
questions 32: pre 4, post 8, practice 20; answers A=8 B=8 C=8 D=8; correct option strictly longest in 0
TOTAL: 0 ERROR, 32 WARNING (WEAK_MISCONCEPTION_LINKAGE 32)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA11-Geografi-Bab4.paket.json --miskonsepsi docs/onboarding/konten/SMA11-Geografi-Bab4-miskonsepsi.csv
TOTAL: 0 ERROR, 0 WARNING
```

- **Fixed before hand-off:**
  - periksa_mutu first flagged "gagal panen" in lesson 5 (DOCTRINE_LEXICON), so it is reworded.
  - Two stems gave their answer away (L6 "kepulauan", PB5 "gunung"), so both are reworded.
  - Five keys were strictly the longest option, so they were shortened or their distractors
    lengthened.
- **Regression:** Geografi Bab 1 (857), Bab 2 (855), Bab 3 (865) and SD5 Bab 1-9 re-run unchanged.
  Their xlsx files were restored, because only the timestamps change.
- `npm run lint`: 0 errors and the 2 warnings that were already there.

## Book errors and inconsistencies

None is copied into the workbook.

1. **p. 212:** "Ada 3 jenis kerentanan", followed by four (sosial, fisik, lingkungan, ekonomi).
   The lesson says four.
2. **Tsunami threshold:** p. 231 gives 6,5 SR as the lowest strength that makes a tsunami, but
   p. 216 has the 1994 Banyuwangi tsunami from a magnitude 5,9.
3. **p. 225:** the Riau emergency of "8 bulan (1 Januari–31 Oktober 2019)" is ten months. The
   source for 2019 data is dated "Detik, 2 Juli 2024".
4. **p. 203:** CO₂ is "paling banyak di atmosfer" and uap air is "paling melimpah" among the gases.
   The lesson uses neither superlative.
5. **Mislabelled or misnumbered:**
   - p. 199: symptom e is headed "Pencemaran udara meningkat", but describes ecosystem damage
     (coral bleaching, species, biodiversity). The lesson calls it "Ekosistem rusak".
   - p. 202: the process list is lettered h-k, continuing the symptoms' a-g.
6. **p. 198:** cuaca is "keadaan rata-rata udara", which conflicts with the same page's "cuaca
   berubah sewaktu-waktu". The lesson does not call cuaca an average.
7. **Assessment items 1 and 2 (p. 245)** each have a second defensible option: 1e "peningkatan suhu
   udara secara meluas" and 2e "peningkatan gas-gas pemanas".
8. **Garbled text, labels and typos:**
   - p. 217: the Pangandaran paragraph ends "… serta kawasan wisata pantai. hancurnya".
   - p. 220: "9 Januari 202" has no year.
   - Captions and names: "Kepualauan" (Gambar 4.6), "Putting Beliung", "Sulawessi" (Gambar 4.43
     legend), "Kalimatan Barat", "Bronto er al.".
   - p. 252: the Refleksi asks about "materi bab I".

## Round 2 (coordinator's review)

- **Tsunami mitigation (lesson 6).** The line keeps the shallow-sea centre (0–30 km) and the
  rising or falling fault, and drops "kekuatannya paling rendah 6,5 SR": it is a rule of thumb,
  not a floor, and p. 216's 5,9 contradicts it (book error 2).
- **N₂O is named one way throughout.** "Nitrous oksida", the book's own words on p. 201, is now
  used in the gas list, under sources, in L5's stem, and in PB2's and PA1's rationales.
  "Nitrogen oksida" is avoided because it usually means the NOx of Bab 3's acid rain.
- **Water vapour.** Lesson 2 keeps only "tidak dihasilkan langsung oleh manusia".
- **Volcano impacts (lesson 5).** "udara tercemar abu vulkanik dan gas vulkanik, seperti sulfur
  dioksida, nitrogen dioksida, dan hidrogen sulfida". PA1's rationale for B says "gas vulkanik".
- **Kept out, and asserted.** `DILUAR` now also holds "6,5", "paling rendah", "kadarnya
  dipengaruhi", "nitrogen oksida" and "tercemar abu vulkanik, seperti".
- Keys, answer positions and assertion counts are unchanged: 922 with `--kutipan`, 921
  without.

## Questions for the coordinator

None. These statements look false or doubtful from outside the book. I left them out of every
lesson and question, as agreed for Bab 1-3:

- **The greenhouse mechanism.**
  - p. 202 says "panas matahari pantulan dari permukaan bumi", and Gambar 4.4 labels
    "dipantulkan".
  - p. 201 has the sun's radiation "terperangkap".
  - The lesson uses only p. 201's "menangkap panas … yang dipancarkan kembali oleh permukaan
    bumi".
- **Greenhouse gases:**
  - N₂O "juga dikenal sebagai gas cairan" (p. 203); it is laughing gas (gas tertawa);
  - CO listed as a greenhouse gas "yang memiliki potensi pemanasan yang signifikan" (p. 203), as
    in Bab 3.
- **Warming and sea-level figures:**
  - "1.5 hingga 4.5°C (IPCC, 2021)" (pp. 199, 207): that range is the older equilibrium climate
    sensitivity, not an IPCC 2021 projection;
  - EPA putting forward climate change "sekitar tahun 1980-an" (p. 198);
  - Gambar 4.2: Indonesia losing 2.000 islands by 2030, and sea-level rise "akibat pengurangan
    salinitas";
  - islands that "hilang" or "kadang muncul dan kadang tenggelam" because of sea-level rise
    (p. 205).
- **Earthquake and tsunami figures:**
  - Aceh (p. 215): "tenggara Banda Aceh", M 9,1 at 30 km, 227.900 victims, with no date; that toll
    is for all countries;
  - Banyuwangi 1994 as magnitude 5,9 (p. 216) and Pangandaran 2006 as 6,8 SR (p. 217); both were
    much stronger;
  - "SR" for the Palu magnitude. The lesson keeps Palu's date and wave height only;
  - Palu and Aceh "keduanya dipicu oleh gempa bumi di dasar laut" (p. 216). The Palu tsunami also
    involved underwater landslides.
- **Casualty counts:** Merapi 1930 (1.367) and 2010 (341), and Semeru 2021 (34 dead; later counts
  are higher). Semeru is kept as an example without numbers.
- **Floods, drought and fires:**
  - the Jakarta flood of 1 January 2020 put down to "gegabahnya pengelolaan di daerah hulu"
    (p. 221);
  - the highest drought threat in "sebagian besar Pulau Sumatra, Jawa, Kalimantan, dan Papua"
    (p. 224);
  - karhutla "terutama … Kalimantan, Sumatra, dan Jawa" (p. 226);
  - in a drought all plants die "kecuali pohon jati dan kaktus", and drought "meningkatkan polusi"
    (p. 224).
- **Raised in the coordinator's review:**
  - 6,5 SR as a hard minimum for tsunamis (p. 231);
  - N₂O called both "nitrous oksida" (p. 201) and "nitrogen oksida" (pp. 202-203);
  - water vapour's level "dipengaruhi perubahan penggunaan lahan, polusi udara, dan industri"
    (p. 203);
  - SO₂, NO₂ and H₂S listed as "abu vulkanik" (p. 218).
- **Adaptation:**
  - "Berry John (1980)" (p. 239). The three landslide strategies are kept, without the name;
  - floodway or sudetan counted as "adaptasi budaya" (p. 240).
