# LANA-17: SMA X Matematika Bab 3, Perbandingan Trigonometri

Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
dkk.), Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, ISBN 978-623-118-558-7,
Bab 3, pp. 71-106 (the ch3 PDF). The chapter has no numbered Contoh; its worked examples are
the shadows (p. 81), the pyramid (p. 91) and the kite (pp. 93-94). Latihan 3.1-3.7 and the Uji
Kompetensi have no keys, so every key is mine, and every key is computed. The method, notation
and gate are Bab 1's.

## Content

Six text lessons, 24 pages. They address the student as «kamu». Every worked example states its
question before its steps and answers it in the lesson.

1. **Sisi-Sisi Segitiga Siku-Siku** (opening, «Ayo, Mengingat Kembali», A.1)
   - Trigonometri as indirect measurement.
   - Pythagoras a² + b² = c², with 3-4-5.
   - Rasio: the ruler 1/100 → 300 cm.
   - The three similarity conditions; 3-4-5 against 6-8-10.
   - Sisi depan, sisi samping and sisi miring, and why the names swap between 30° and 60°.
2. **Perbandingan Tangen** (A.2, A.3)
   - The shadow ratio 114 : 200 = 0,57, «sekitar 30°».
   - tan θ = sisi depan/sisi samping; tan depends only on the angle.
   - The teen's shadow two ways: 29.600 : 114 ≈ 259,65 = 148 : 0,57, asserted equal.
   - Tree: 0,75 × 12 = 9 m.
3. **Sinus dan Cosinus** (B.1)
   - The three definitions, with 6-8-10.
   - The pyramid: sin 41° ≈ 0,66 → 396 m; cos 41° ≈ 0,75 → 450 m. It is checked against
     Pythagoras: 396² + 450² = 359.316 against 360.000, a difference from rounding, which the
     lesson says.
   - sin rises and cos falls, as value lines.
   - The kite, answered: the book leaves Surya's error for discussion. The height counts from the
     hand, 3,5 − 0,6 = 2,9 m, so the rope is ≈ 2,9 : 0,34 ≈ 8,5 m. The same result, 8,5, comes
     with sin 20° unrounded (asserted).
4. **Hubungan Antarperbandingan Trigonometri** (B.1 «Tahukah Kamu», B.2, the p. 102 box)
   - sin² α + cos² α = 1 from Pythagoras, with 8-15-17.
   - tan = sin/cos.
   - sec, csc and cot.
   - Komplemen: sin α = cos β, cos α = sin β, tan α = cot β.
5. **Sudut Istimewa** (B.3)
   - The equilateral triangle with side 2 → 1, √3, 2.
   - The isosceles right triangle → 1, 1, √2.
   - All nine exact values as value lines, with decimals.
   - The ladder: 6 m at 60° → 3√3 m and 3 m, checked 27 + 9 = 36.
6. **Menerapkan Perbandingan Trigonometri**
   - Choosing sin, cos or tan by the known and wanted sides.
   - Sudut elevasi.
   - The water tower with eye height: 20 × tan 45° + 1,5 = 21,5 m.
   - The chapter recap.

The Eksplorasi activities, the klinometer Pengayaan, the GeoGebra and QR items and the Everest
video are not question sources. The klinometer page supplies only the word «elevasi».

**Notation:**
- Degrees as «30°».
- Squares as Unicode superscripts: a², sin² α.
- Exact values as √3/2, √2/2, √3/3; roots of longer radicands in parentheses: √(2² − 1²).
- Decimal comma: 0,57 and 259,65.

`notasi()` runs on every lesson, summary, stem, option, rationale and petunjuk. A new check
asserts that no lesson writes degrees as «30o» or «derajat».

## Every number is proven, every fact is traced

- **Exact values.** For 30°, 45° and 60°, the squares of sin, cos and tan are exact fractions
  (1/4, 3/4, 1/3; 1/2, 1/2, 1; 3/4, 1/4, 3).
  - Each is asserted against math.sin/cos/tan (to 10⁻¹²), and each satisfies s² + c² = 1 and
    s²/c² = t² exactly.
  - Every printed value is asserted in the same way, with 1/√2 = √2/2 and 1/√3 = √3/3 included.
  - Lesson 5 is asserted to contain each of the nine values exactly as printed.
- **Identities.** sin² + cos² = 1, tan = sin/cos and sin d = cos (90° − d) are checked for every
  whole degree from 1° to 89°. sin rising and cos falling are checked from 0° to 90°.
- **Pythagoras.** Every triangle is checked exactly, in the lessons, the questions and the book's
  figures: 3-4-5, 6-8-10, 5-12-13, 7-24-25, 8-15-17, 9-12-15, 9-40-41, 10-24-26, 12-35-37 and
  20-21-29; KLM 3, 2, √13; the ladder 3√3, 3, 6.
- **Calculator values**, rounded as the book rounds them and asserted: sin 41° ≈ 0,66,
  cos 41° ≈ 0,75, sin 20° ≈ 0,34, cos 43° ≈ 0,73, tan 55° ≈ 1,43, and arctan 0,57 ≈ 29,7°.
- **Assertions:** 3.361 with `--kutipan` (3.360 without).
- **FAKTA:** 41 facts (pp. 73-102). `--kutipan` finds **40 of 41** in the text layer. The one
  it cannot find is `surya_satuan`, Surya's working on p. 94, which is printed as an image; I
  read it from the page image, and it sits in `GAMBAR`.
- **Twelve facts are kept only as the book-error record** (`REKAMAN`).

## Questions

32 questions: 4 pre-test, 8 post-test and 20 practice.

- **Answer positions:** A=8, B=8, C=8, D=8. The correct option is never strictly the longest.
- **Pre-test:** lessons 1, 2, 3 and 5 (6-8 → 10; tan from 9-12-15; the definition of sin;
  sin 30°).
- **Post-test:** covers all six lessons. 6 are Sedang, 1 is Mudah (PB1) and 1 is Sulit (PB7).

  | Item | Question | Numbers |
  |---|---|---|
  | PB1 | Pythagoras | 7 dm, 24 dm |
  | PB2 | tan by shadows | 3 m, 4 m, 20 m |
  | PB3 | sin | 10 m ladder, sin θ = 0,8 |
  | PB4 | sin² + cos² = 1 | sin α = 12/37 |
  | PB5 | komplemen | sin α = 0,6 → cos β |
  | PB6 | special angle, tan | 12 m, 30° → 4√3 m |
  | PB7 | choose cos, then divide | 9 m, 60° → 18 m |
  | PB8 | which ratio | papan landai (sinus) |

  The generator asserts that these share nothing with the book's items or worked examples,
  listed in `BUKU`. It also asserts that no post-test stem contains the book's numbers: 114,
  148, 305, 600 m, 41°, 3,5 m, 0,47, 4/3, 814, 1.151, 150 m, 200 m, 400 m, 52 m, 4/5, 5/13,
  8 cm, 120 m, 50 m, 20/29, 75°, 3,2 m, 70° and 40°.
- **Misconception codes: 13**, SMA10-M-B3-01…13. Each is used by at least one distractor.
- Distractors are drawn from real errors:
  - swapping sin/cos/tan;
  - an inverted ratio;
  - multiplying where one should divide;
  - forgetting the observer's height (LT11);
  - the angle taken as a fraction of 90°, so 30° → 1/3;
  - sin = 1 − cos;
  - complement taken from 180°;
  - additive instead of proportional reasoning.

## Checks

```
$ python3 docs/onboarding/konten/sma10_matematika_bab3.py --kutipan <book text>
SMA10-Matematika-Bab3.xlsx: lessons 6 (24 pages), questions 32 (pre 4, post 8, practice 20), answers A=8 B=8 C=8 D=8
SMA10-Matematika-Bab3-miskonsepsi.csv: 13 codes
facts traced: 41 (pages 73-102)
quotations found in the book's text: 40 of 41; figures read by eye: surya_satuan
assertions passed: 3361          (3360 without --kutipan)

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SMA10-Matematika-Bab3.xlsx docs/onboarding/konten/SMA10-Matematika-Bab3.paket.json
docs/onboarding/konten/SMA10-Matematika-Bab3.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA10-Matematika-Bab3.paket.json
TOTAL: 0 ERROR, 32 WARNING (WEAK_MISCONCEPTION_LINKAGE 32)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA10-Matematika-Bab3.paket.json --miskonsepsi docs/onboarding/konten/SMA10-Matematika-Bab3-miskonsepsi.csv
questions 32: pre 4, post 8, practice 20; answers A=8 B=8 C=8 D=8; correct option strictly longest in 0
TOTAL: 0 ERROR, 0 WARNING
```

- **Fixed before hand-off:**
  - the pre-test first sampled only three lessons; PA2 became the definition of sin (lesson 3);
  - LT1's fourth option was far longer than the one-word sides, so it was shortened to
    «tidak ada».
- **Rebuild:** a second run gives a byte-identical package.
- **Regression:**
  - SD5 Bab 1-9, Geografi Bab 1-4 and SMA10 Bab 1-2 re-run and pass.
  - Their xlsx files were restored; no tracked file changed.
- `npm run lint`: 0 errors, the 2 old warnings.

## Book errors and inconsistencies

None is copied into the workbook; `DILUAR` markers assert that the wording is absent.

1. **pp. 79 and 81: «tan 30° = 0,57».**
   - tan 30° = √3/3 ≈ 0,577, which rounds to 0,58 (asserted).
   - The 0,57 is the ratio of Gambar 3.15 (114 : 200), whose angle is about 29,7°.
   - The lesson says the ratio is 0,57 and the angle «sekitar 30°», and gives tan 30° = √3/3 in
     lesson 5.
2. **p. 80, Latihan 3.2 no. 1:** the figure marks 70° with sides 15 cm (opposite) and 7 cm
   (adjacent). 15/7 ≈ 2,14, but tan 70° ≈ 2,75 (asserted). The figure cannot be drawn as
   labelled.
3. **p. 94, Latihan 3.5 no. 1:** in the 3-4-5 triangle, ∠P = 53,2° and ∠Q = 36,8°. The angles
   are ≈ 53,1° and ≈ 36,9° (asserted). The sides pass Pythagoras.
4. **p. 94, Surya's working** (image): «x cm = 10,29 m» mixes cm and m in one line.
5. **p. 92:** the Pythagoras step prints «a²/c² + b²/c² + c²/c²». The last «+» should be «=».
6. **p. 93:** an editor's note is printed in the book: «Sebaiknya persamaan terakhir dimasukkan
   ke dalam kotak».
7. **p. 96:** «tan 55° = 1.43» uses a decimal point.
8. **p. 89:** «Piramida Giza, piramida yang tertua dan terbesar di dunia».
   - It is not the oldest; the Step Pyramid of Djoser is older.
   - The Giza name and the claim are kept out.
   - The lesson's pyramid is a model with θ = 41° and a 600 m edge, as in the book's replica
     scenario. The real pyramid's edge is far shorter, so no real pyramid is named.
9. **p. 75:** Eratosthenes «2.000 tahun yang lalu … perkiraan bilangan yang sama» is vague and
   doubtful as stated (his estimate is dated to about 2.200 years ago, and its accuracy is
   debated). It is kept out.
10. **Typos:**
    - p. 90: «setangah diagonal alas» (Gambar 3.20).
    - p. 100: Latihan 3.7 no. 3 repeats its first sentence.
    - p. 73: «trigono … metri» is loose etymology (Greek trigōnon and metron). The lesson says
      only that the word comes from Greek and means «pengukuran segitiga».

Checked and consistent (no error):
- Gambar 3.7: 3-4-5 and 6-8-10.
- Latihan 3.5: 5-12-13.
- Latihan 3.7: ABC 5-12-13, and KLM 3, 2, √13 with 33,7° and 56,3°.
- Uji Kompetensi 1: 20-21-29.
- Latihan 3.4 no. 5: 1.151 and 814 give AB ≈ 813,8, which fits the drawn right angle at A.
- The pyramid's 396 and 450 against 600: the difference is only rounding.
- 148 : 0,57 = 259,65, and 148 × 200 : 114 = 259,65.

## Assumption for the coordinator

- **The kite (p. 93):** «sudut ∠KIT sebesar 20°» has no figure in my PDF.
  - I read it, as Surya does, as the angle between the rope and the horizontal at the hand.
  - The lesson states this: «Tali membentuk sudut 20° dengan garis mendatar».
  - If ∠KIT is another angle, only that example changes; no question rests on it.
