# LANA-14: SD 5 Matematika, one voice across Bab 1–9 (the consistency pass)

I read the nine chapters together, in a student's order: every lesson, stem, option, rationale
and petunjuk. The book texts (Buku Panduan Guru Matematika Kelas V, 2022, Bab 1–9) decided
between two wordings where the book has a term.

- **Scope:** wording and notation only. There are no new lessons and no new questions.
- **Keys:** no key changed. A script compared every question against HEAD and asserts that no
  key, answer position or misconception code moved.
- **Misconception codes:** they stay in the CSVs. MISKONSEPSI text was left untouched, so all
  nine CSVs are byte-identical to HEAD.

## The rules applied everywhere

1. **Voice.** Lessons, stems and petunjuk address the student as «kalian», which is the book's
   voice. «kamu» and «-mu» are gone, and every lesson objective now opens «Kalian dapat …»
   (it was «Murid dapat …»).
2. **Correct-option rationale opens with «Benar.»** 57 of them opened with «Tepat.»
   instead, mostly in Bab 6–9 (listed below). «tepat» stays where it is part of a stem ("Pernyataan manakah yang
   tepat?") or of an option.
3. **«dahulu», not «dulu».** The book writes «dahulu» throughout. 25 places are changed, in
   Bab 1, 3, 4, 5 and 6; Bab 8 and 9 already used «dahulu».
4. **Number sequences and orderings with thousands points, fractions or units use «; »**, as Bab
   9 and all the ordering options already did. Short whole-number lists (kelipatan 3: 3, 6, 9,
   …) keep commas.
5. **Option case follows the stem.**
   - After a stem ending «...», an option completes the sentence and starts lowercase.
   - After a stem ending «?», an option starts with a capital.
6. **Money** is «Rp» followed directly by the number, with a thousands point and no «,00».
7. Checked and already consistent, so unchanged:
   - decimal comma (30,5 kg; 24,75 kg);
   - thousands point on every number of 1.000 or more (no misses; years and times excepted);
   - «×», «:» and the minus sign «−» (no hyphen used as minus);
   - units spaced from the number (5 cm, 36 m², 60°);
   - «pukul 03.00» for times;
   - «**Coba:**» followed by «_Periksa: …_»;
   - a «Rangkuman Bab N» ending every chapter.

## Where chapters disagreed

| Topic | Before | Now | Why |
|---|---|---|---|
| Segitiga sama kaki | Bab 4 L2: «**dua** sisi yang sama panjang (kaki) dan satu sisi lain (alas)» | «setidaknya **dua** sisi yang sama panjang, yaitu kakinya. Sisi ketiga disebut alas.» | Bab 7 L4: sama kaki has at least 2 equal sides, and a sama sisi triangle is also sama kaki. |
| Trapesium siku-siku | Bab 6 LT2: «Bangun manakah yang mempunyai tepat 2 sudut yang besarnya 90°?», key «Trapesium siku-siku» | «… yang **dapat** mempunyai tepat 2 sudut …»; rationale: a trapesium siku-siku with only one pair of parallel sides has exactly 2 right angles. **Same key.** | Bab 7 L5 defines trapesium as «setidaknya sepasang sisi sejajar», so a persegi panjang is also a trapesium siku-siku, with 4 right angles. |
| Sudut lancip | Bab 7 L2 recalls «kurang dari 90°» | «lebih dari 0° dan kurang dari 90°» | Bab 6 L4's definition (a 0° angle is sudut nol). |
| Layang-layang | Bab 4 L3: sides «berdampingan» | «berurutan» | Bab 7's word (the book's, Bab 7). |
| Jajargenjang side | Bab 5: «sisi miring» (L3, PB3 stem, LT8 stem, rangkuman) | «sisi samping»; the rangkuman now names both: «sisi samping jajargenjang dan sisi miring segitiga bukan tinggi» | Bab 4's word (the book's, Bab 4: «sisi alas» and «sisi samping»). «sisi miring» stays for triangles. |
| Keliling persegi panjang | Bab 5 rationales: «2 × (13 + 7)» | «(2 × 13) + (2 × 7)» | Bab 4 L3 teaches «(2 × panjang) + (2 × lebar)», the book's form; Bab 5 used a form never taught. |
| Comparison signs | Bab 9 L3: «< berarti kurang dari», «> berarti lebih dari», «Ujung yang terbuka menghadap bilangan yang lebih besar» | «< artinya lebih kecil dari», «> artinya lebih besar dari», «Ujung lancip tanda selalu menunjuk ke bilangan yang lebih kecil» | Bab 1 L2's names and rule, the ones the student met first. The book (Bab 9) also says «lebih besar dari». |
| Borrowing | Bab 9 L6, PB8 C, LT14 C, LT16 C: «di setiap kolom» | «di setiap tempat» | Bab 1 L4 and LT13 use «tempat». |
| Whole numbers | Bab 5 PB8, LT18; Bab 7 LT2: «bilangan bulat» | «bilangan cacah» | «bilangan cacah» is the course's term (Bab 1, Bab 9); «bilangan bulat» is never taught. |
| Title | Bab 9: «Bilangan Cacah **Sampai** 1.000.000» (course title, BAB, L1 and L6 titles) | «sampai» | Bab 1: «Bilangan Cacah sampai 100.000». **The course title changes.** Nothing is uploaded yet, but whoever uploads should know. |

## Every change, by chapter and question code

**Bab 1**
- **Lessons:**
  - L1: «kalian belajar»; «di rumah kalian».
  - L2: «Rp38.500; Rp42.000; Rp45.500»; «85.350; 85.400; 85.450; ...».
  - L3: «Kalian punya».
  - L4: heading «Periksa jawaban kalian».
  - L5: «jawaban kalian»; rangkuman «dahulu».
  - Every objective: «Kalian dapat».
- **Questions:**
  - LT1: options A–D in lowercase (the stem ends «...»).
  - LT6, LT7: sequences use «; ».
  - PB8 D rationale and LT2 petunjuk: «dahulu».

**Bab 2**
- **Lessons:**
  - L1: «giliran kalian … kalian bertepuk tangan»; «Pola apa yang kalian lihat?».
  - Objectives.
- **Questions:** LT13 and LT19: «Benar.».

**Bab 3**
- **Lessons:**
  - L1: «yang kalian pelajari».
  - L2: ringkasan and heading «dahulu» (×3); «**2 1/4 m; 2 2/5 m; 2 1/2 m**».
  - L3: «dahulu».
  - L4: heading «dahulu»; «menurut kalian».
  - L6: rangkuman «dahulu».
  - Objectives.
- **Questions:**
  - «dahulu» in the rationales of PB1 A, PB3 A, PB5 A, LT6 C and LT9 A, and in the petunjuk of
    LT6 and LT16.
  - LT18: «Benar.».

**Bab 4**
- **Lessons:**
  - L2: segitiga sama kaki «setidaknya dua».
  - L3: «berurutan».
  - L6: «Bayangkan kalian».
  - Objectives.
- **Questions:**
  - LT5: petunjuk «dahulu»; D rationale «dahulu».
  - PA4 and LT2: «Benar.».

**Bab 5**
- **Lessons:**
  - L3: heading and text «sisi samping».
  - L4: «dahulu».
  - L6: rangkuman line on tinggi.
  - Objectives.
- **Questions:**
  - PB3 and LT8: stems «sisi samping».
  - Perimeter form «(2 × …) + (2 × …)» in PA2 C, PB1 A, PB3 C, LT3 B and LT8 C.
  - PB8 and LT18: «bilangan cacah».
  - «dahulu» in PB4 C, PB7 petunjuk, LT9 C and LT12 B.
  - PA1 and LT16: «Benar.».

**Bab 6**
- **Lessons:**
  - L1: «Kalian dapat membuat».
  - L2: «dahulu».
  - L3 and L6: «kalian membaca».
  - L4: «**45°; 95°; 180°; 270°**».
  - Objectives.
- **Questions:**
  - LT2: stem «dapat mempunyai»; rationale as in the table above.
  - «Benar.» in PA1, PA4, PB7, LT2, LT3, LT6, LT13, LT14, LT15 and LT18.

**Bab 7**
- **Lessons:**
  - L2: «kalian sudah mengenal»; sudut lancip «lebih dari 0° dan kurang dari 90°».
  - L5: «kalian belajar», «kalian akan mempelajari».
  - Objectives.
- **Questions:**
  - LT2: «bilangan cacah».
  - LT8 B, LT12 C and LT17 D: capitalised «Tidak ada …» (the stem ends «?»).
  - «Benar.» in PA1, PA3, PA4, PB3, PB5, PB6, PB7, PB8, LT1, LT4, LT6, LT10, LT13, LT14, LT15,
    LT16, LT18 and LT19.

**Bab 8**
- **Lessons:** objectives.
- **Questions:**
  - PB8: options A–D in lowercase, «tepat; …» and «kurang tepat; …» (the stem ends «...»).
  - «Benar.» in PA4, PB3, PB7, PB8, LT1, LT2, LT6, LT7, LT8, LT13, LT14, LT16 and LT17.

**Bab 9**
- **Titles:** the course, BAB, and the L1 and L6 titles use «sampai».
- **Lessons:**
  - L1: «Rp979.875».
  - L3: the sign names and the pointed-end rule.
  - L6: «di setiap tempat».
  - Objectives.
- **Questions:**
  - Capitalised «Tidak dapat dibandingkan» in PA3 D and LT7 D, and «Puluh ribuan» in PB2 B and
    LT5 C (the stems end «?»).
  - PB8: petunjuk «jawaban kalian»; C rationale «tempat».
  - LT14 C and LT16 C: «tempat».
  - «Benar.» in PA1, PA3, PB3, PB4, LT1, LT6, LT7, LT8 and LT13.

The full before-and-after list, one line per changed field (252 lines), came from comparing
every lesson, stem, option, rationale and petunjuk with HEAD. I can attach it if the gate wants
it.

## Checks

All nine chapters:

| | Assertions | ke-paket | Rebuilt twice | periksa_mutu | with CSV |
|---|---|---|---|---|---|
| Bab 1 | 579 | media none | byte-identical | 0 ERROR | 0 / 0 |
| Bab 2 | 600 | media none | byte-identical | 0 ERROR | 0 / 0 |
| Bab 3 | 576 | media none | byte-identical | 0 ERROR | 0 / 0 |
| Bab 4 | 587 | media none | byte-identical | 0 ERROR | 0 / 0 |
| Bab 5 | 553 | media none | byte-identical | 0 ERROR | 0 / 0 |
| Bab 6 | 508 | media none | byte-identical | 0 ERROR | 0 / 0 |
| Bab 7 | 563 | media none | byte-identical | 0 ERROR | 0 / 0 |
| Bab 8 | 702 | media none | byte-identical | 0 ERROR | 0 / 0 |
| Bab 9 | 493 | media none | byte-identical | 0 ERROR | 0 / 0 |

- Assertion counts are the same as at the gates (LANA-01…09).
- Without the CSV, periksa_mutu reports only the usual WEAK_MISCONCEPTION_LINKAGE warnings.
- Answer positions are unchanged.
- The correct option is strictly longest in 0 questions, except Bab 2's one. That one was
  already there at HEAD, and at its gate.
- The nine CSVs are unchanged.
- `npm run lint`: 0 errors and the 2 warnings that were already there.

## Left as they are (for the coordinator to rule on if wanted)

- **MISKONSEPSI text** (teacher-facing, in the CSVs) still has «dulu», «kolom» and, in Bab 5,
  «sisi miring» for a parallelogram. I left it untouched while its approval is open.
- **«lebih besar dari» / «lebih besar daripada»** both appear. Both are standard, and changing
  them would touch almost every rationale.
- **«punya» / «mempunyai»** both appear (Bab 1 uses «punya» in L1–L3).
- **Markdown tables** remain in the SD5 lessons, as passed at their gates. The Geografi rule of
  one fact per line was not applied back to SD5.
- **Trapezoid legs:** Bab 4 PB4 calls them «sisi miring», while Bab 7 calls a trapezoid's legs
  «kaki». Both are used in the book for their own chapter.

## Questions for the coordinator

1. The Bab 9 course title changes to «Bilangan Cacah sampai 1.000.000». Is that acceptable for
   the upload, or should the title stay and only the lesson titles change?
2. Should MISKONSEPSI text also get «dahulu» and «tempat», once its approval is settled?
