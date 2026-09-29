# LANA-15: SMA X Matematika Bab 1, Eksponen

Source: the student book "Matematika untuk SMA/MA/SMK/MAK Kelas X (Edisi Revisi)" (Dicky Susanto
dkk.), Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2023, ISBN 978-623-118-558-7,
Bab 1, pp. 1-34 (`sma10-math10-ch1-lesson.pdf`). Its Contoh are worked; Latihan and Uji
Kompetensi have no keys, so every key is mine, and every key is computed.

## Content

Seven text lessons, 33 pages, in the book's order. They address the student as «kamu», as the
book does.

1. **Definisi Eksponen** (A)
   - Perkalian berulang.
   - The pesan pattern 2ⁿ as value lines, including 1 = 2⁰.
   - The definition of aⁿ.
   - a⁻ⁿ, a^{1/n} and a^{m/n}.
   - One «Coba pikirkan».
2. **Sifat-Sifat Eksponen** (B)
   - 2¹ … 2¹⁰ as values.
   - Sifat 1-3, 4-5 and 6-7, with worked checks.
   - The book's Contoh 1 and 2.
3. **Fungsi Eksponensial dan Pertumbuhan Eksponen** (C, C.1)
   - The virus table 3ˣ as value lines.
   - The definition f(x) = n × aˣ; pertumbuhan with a > 1.
   - Contoh 3: 30 bacteria → 30.720.
   - Contoh 4: a = 2, x_{0} = 2.000, x_{10} = 2.048.000.
4. **Peluruhan Eksponen** (C.2)
   - The definition with 0 < a < 1.
   - Contoh 5: 50; 25; 12,5; 6,25 mikrogram.
   - 2ˣ against (1/2)ˣ as value lines.
   - One «Coba pikirkan».
5. **Bentuk Akar** (D)
   - a^{m/n} = (ⁿ√a)ᵐ = ⁿ√(aᵐ).
   - Contoh 6: 6x^{5/6}.
   - √(9 + 16) ≠ √9 + √16, answering the book's own «Berpikir Kritis» by computation.
   - Merasionalkan with sekawan.
6. **Logaritma** (the part after the Uji Kompetensi)
   - The 2.000-bacteria problem.
   - The definition: basis, numerus, hasil.
   - Tabel 1.4 as four lines.
   - Logaritma umum.
7. **Sifat-Sifat Logaritma**
   - Eight sifat.
   - Contoh 7 (the proof of sifat 4), Contoh 8 (= 7) and Contoh 9 (t ≈ 22,5).
   - The chapter recap.

The Pengayaan game and the Eksplorasi activities are not used as question sources.

**Notation**, as the brief asks:
- «×» and «:»; decimal comma; thousands point; «−» as the minus sign.
- Integer and one-letter exponents as Unicode superscripts: 2⁶, a⁻ⁿ, 3ˣ.
- Other exponents as ^{…}: a^{m/n}, 5^{2x−1}. Subscripts as _{…}: x_{0}.
- √ ∛ ∜ and ⁿ√, with parentheses when the radicand is longer than one symbol.
- Logarithm bases as leading superscripts, as the book writes them: ²log 8, ᵃlog b, ¹⁰log a.
- Graphs and tables are written as value lines: «x = 3 → f(3) = 6,25».

`notasi()` asserts all of this on every lesson, stem, option, rationale and petunjuk:
- ^ and _ appear only in brace form, and the braces balance;
- no LaTeX, no HTML and no table rows;
- no «x» between numbers;
- no decimal point;
- no ASCII hyphen as a minus sign.

## Every number is proven, every fact is traced

- **Numbers.** Every number in a lesson, key and distractor is computed with exact fractions and
  asserted next to where it is used. That includes:
  - every value line;
  - Contoh 1-9;
  - Contoh 9's 0,4771, 0,0212 and 22,5, rounded from Python's log10;
  - PB7's ²log 3 × ³log 16 = 4, checked in floating point.
- **Assertions:** 3.345 with `--kutipan` (3.344 without). Most of them are the notation check.
- **FAKTA.** It holds 30 facts (pp. 4-33), each with its page and the book's words. Every
  option names the fact it rests on; computed options mark it with «=». `--kutipan` finds
  **30 of 30** quotations in the book's text.
- **Formulas** were read from the page images, which I rendered at 110 dpi. The text layer loses
  superscripts and fraction layout, so formulas are proven by computation, not by quote.
- **Six facts are kept only as the book-error record** (`REKAMAN`). No question may rest on them.

## Questions

32 questions: 4 pre-test, 8 post-test and 20 practice. Every one has a single answer among four
options, A–D.

- **Answer positions:** A=8, B=8, C=8, D=8. The correct option is never strictly the longest;
  this is asserted, and periksa_mutu confirms it.
- **Pre-test:** lessons 1, 2, 3 and 6 (5⁴; 3⁴ · 3²; f(5) for 2ˣ; ²log 8).
- **Post-test:** covers all seven lessons; 7 are Sedang and 1 (PB3) is Sulit.
- **No reuse of the book's items.** The generator lists every Contoh, Latihan and Uji
  Kompetensi item next to each post-test question's own numbers, and asserts that they share
  none:

  | Item | Question | Numbers |
  |---|---|---|
  | PB1 | pangkat negatif | 4⁻² |
  | PB2 | sifat 1-3 | (a³)⁴ · a²/a⁵ |
  | PB3 | growth | 40 bacteria, every 20 minutes, 2 hours |
  | PB4 | decay | 243 mg, 2/3 remains each hour, 3 hours |
  | PB5 | rationalising | 10/√5 |
  | PB6 | exponent to logarithm | 4³ = 64 |
  | PB7 | sifat 8 | ²log 3 × ³log 16 |
  | PB8 | sifat 4 | (2a²b)³ |

  The generator also asserts that no post-test stem contains a book item's numbers (30
  bacteria, 50 mikrogram, 8.000, ²log 16 +, 2/(√3, 500 bacteria, E.coli).
- **Misconception codes: 15**, SMA10-M-B1-01…15, all drawn from the distractors. The workbook's
  Kode miskonsepsi column is empty.

## Checks

```
$ python3 docs/onboarding/konten/sma10_matematika_bab1.py --kutipan <book text>
SMA10-Matematika-Bab1.xlsx: lessons 7 (33 pages), questions 32 (pre 4, post 8, practice 20), answers A=8 B=8 C=8 D=8
SMA10-Matematika-Bab1-miskonsepsi.csv: 15 codes
facts traced: 30 (pages 4-33)
quotations found in the book's text: 30 of 30; figures read by eye: none
assertions passed: 3345          (3344 without --kutipan)

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SMA10-Matematika-Bab1.xlsx docs/onboarding/konten/SMA10-Matematika-Bab1.paket.json
docs/onboarding/konten/SMA10-Matematika-Bab1.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA10-Matematika-Bab1.paket.json
TOTAL: 0 ERROR, 32 WARNING (WEAK_MISCONCEPTION_LINKAGE 32)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SMA10-Matematika-Bab1.paket.json --miskonsepsi docs/onboarding/konten/SMA10-Matematika-Bab1-miskonsepsi.csv
questions 32: pre 4, post 8, practice 20; answers A=8 B=8 C=8 D=8; correct option strictly longest in 0
TOTAL: 0 ERROR, 0 WARNING
```

- **Fixed before hand-off:**
  - periksa_mutu flagged two IMPLAUSIBLE_DISTRACTOR warnings, in LT1 and LT6. Both distractors
    were rewritten.
  - My own length assertion caught two keys that were strictly the longest option, in PB1 and
    LT12. Both were reworded.
- **Regression:** SD5 Bab 1-9 and Geografi Bab 1-4 re-run unchanged. Their xlsx files were
  restored, because only the timestamps change.
- `npm run lint`: 0 errors and the 2 warnings that were already there.

## Book errors and inconsistencies

None is copied into the workbook; `DILUAR` markers assert that the wording is absent.

1. **Numbering:**
   - Bab 1 numbers its Eksplorasi and Latihan «2.1…2.6»;
   - the text refers to «Eksplorasi 1.1» and «1.3» (pp. 6, 10, 12).
2. **p. 7, definition 2:** a^{1/n} = p "adalah bilangan real positif" is stated for any a ≠ 0.
   For negative a and even n there is no such real p. The lesson states definitions 2 and 3 for
   a > 0, the book's own condition in sifat 6-7. The same condition is added to the
   bentuk-akar definition on p. 21, which gives none.
3. **Typos and mislabels:**
   - p. 7: «dan dan».
   - p. 8, sifat 7: «m/n dan p/n bilangan rasional» should read p/q; a stray comma in sifat 3.
   - p. 10: the heading «Fungsi Eksponenial».
   - p. 33, Latihan 2.6: headed «Sederhanakan bentuk akar» over logarithms.
   - «Petunjuki» and «Tips Penyelesain» throughout.
4. **p. 9, Latihan 2.1 no. 2b:** «bᵖ · b⁵ = 3⁹» has no answer unless b = 3.
5. **p. 15, Contoh 3:** it asks how many *new* bacteria grow by hour 5, then answers the total,
   30.720. The new ones would be 30.690 (asserted). The lesson asks for the total.
6. **p. 21:** «banyak dosis obat yang meluruh adalah f(1/2)». f gives the dose that remains, not
   the dose that has decayed. The lesson says «tersisa».
7. **p. 28:** «f(5,5) = 2.000(45,25) = 90.509», but 2.000 × 45,25 = 90.500 (asserted); with
   2^{5,5} ≈ 45,2548 it is about 90.510. The lesson leaves f(5,5) out.
8. **p. 30, sifat 7:** «ᵃlog b = … = 1/ᵇlog a» is undefined for b = 1, and the listed conditions
   do not exclude it. The lesson gives only ᵃlog b = ᵐlog b / ᵐlog a.
9. **p. 32, Contoh 9:**
   - «9.000.000 = 3.000.000(1 + 0,5)ᵗ» is a typo for 1 + 0,05. The next line has 0,05.
   - The conclusion «Arif membutuhkan waktu 22,5 tahun» reads a solution of 3 = 1,05ᵗ as a
     time, although the interest is added once a year.
   The lesson says only that the value of t satisfying the equation is about 22,5.
10. **Uji Kompetensi 1c (p. 26):** it states «p ≠ 0, q ≠ 0» for (p + q)/(√p − √q). It needs
    p, q > 0 and p ≠ q.

## Questions for the coordinator

None. Two items look doubtful from outside the book, and I left them out of every lesson and
question:

- **p. 17, Latihan 2.2 no. 2:** «Pada tahun 2015 kasus positif HIV-AIDS berjumlah sekitar 36 juta
  jiwa», with a 2% yearly rise, sourced to pusdatin.kemkes. About 36 juta is a worldwide count,
  not Indonesia's.
- **p. 28:** the claim «90.509 bakteri» at 5,5 hours (item 7 above).
