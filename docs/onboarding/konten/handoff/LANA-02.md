# LANA-02: SD5 Matematika Bab 2, KPK dan FPB

Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Fitrianawati, Surtiani, Istiandaru),
Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022, Bab 2, pp. 43-96
(`sd5_matematika_2_lesson.pdf`, 54 pages).

## Content

Six text lessons in the book's subbab order:

1. Kelipatan
2. Kelipatan Persekutuan dan KPK, with the book's swimming-schedule problem
3. Faktor
4. Faktor Persekutuan dan FPB, with the book's birthday-package problem
5. Bilangan Prima dan Faktorisasi Prima (Eratosthenes, pohon faktor)
6. KPK dan FPB dengan Faktorisasi Prima; choosing KPK or FPB in a word problem; recap

Each page explains one idea, works an example step by step, says why where it helps, and
most end with a "Coba" and a way for the student to check it. "Pembagian berulang" (p. 82) is left
out on purpose: the book says to teach it only after the concept, as an optional technique.

32 questions: 4 pre-test, 8 post-test, 20 practice. Answers A=9 B=8 C=8 D=7.

- **Pre-test**, one skill each: multiples, factors, primes, a first KPK.
- **Post-test** covers the chapter objectives: KPK, factors, FPB, primes, factorisation, KPK by
  factorisation, and a KPK and an FPB word problem. It uses fresh numbers. Bab 2's numbers are
  small and recur everywhere, so the generator checks freshness per problem: no post-test
  question works on a number set that a lesson or the book's exercises work on.
- **Practice** goes from listing multiples to three-number KPK, month-end dates, and evaluating
  statements (objective 2.13).
- **Misconception codes**: 21, SD5-M-B2-01…21. Codes 01-07, 09 and 10 are the book's own
  Miskonsepsi sections (pp. 58, 74, 83-84); the rest come from the reasoning behind the
  distractors. The workbook's Kode miskonsepsi column is empty.

## Checks

```
$ python3 docs/onboarding/konten/sd5_matematika_bab2.py
SD5-Matematika-Bab2.xlsx: lessons 6 (24 pages), questions 32 (pre 4, post 8, practice 20), answers A=9 B=8 C=8 D=7
SD5-Matematika-Bab2-miskonsepsi.csv: 21 codes
assertions passed: 600

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SD5-Matematika-Bab2.xlsx docs/onboarding/konten/SD5-Matematika-Bab2.paket.json
docs/onboarding/konten/SD5-Matematika-Bab2.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab2.paket.json
questions 32: pre 4, post 8, practice 20; answers A=9 B=8 C=8 D=7; correct option strictly longest in 1
TOTAL: 0 ERROR, 32 WARNING (WEAK_MISCONCEPTION_LINKAGE 32)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab2.paket.json --miskonsepsi docs/onboarding/konten/SD5-Matematika-Bab2-miskonsepsi.csv
TOTAL: 0 ERROR, 0 WARNING
```

The 32 warnings are the pending misconception codes, one per question, as in Bab 1. The doctrine
lexicon is clean on every student-readable field and on the CSV's remediation.

## Book errors

Checked against the page images. None is copied into the workbook; lessons use the correct values.

1. **p. 89, Uji Kompetensi 3 (traffic lights):** KPK(15, 24, 36) = 360 detik = 6 menit, so
   15.30 + 6 menit is **15.36**. The key says 15.41.
2. **p. 83, Miskonsepsi 2:** "KPK = 2 × 2 × 2 × 2 × 3 × 3 × 3 = 3.888". Those factors make 432;
   all the factors of 36 and 108 are 2⁴ × 3⁵ = 3.888 (= 36 × 108).
3. **p. 82, Soal Tambahan 3:** KPK(24, 30, 54) is written "2 × 3 × 2 × 2 × 5 × 2 × 2 = 1.080".
   Those factors make 480. The value 1.080 is right: 2 × 2 × 2 × 3 × 3 × 3 × 5.
4. **p. 65, Ayo Berlatih (factors):** the factors of 36 are shown without 6. The factors of 54
   are shown with 4 (not a factor) and without 6.
5. **p. 81, pohon faktor for 260:** 130 splits into 3 and 65; it should be 2 and 65. The written
   answer, 2 × 2 × 5 × 13, is right.
6. **p. 60, KPK key:** the multiples of 6 read "6, 12, 18, 24, 32, 36, …" (32 should be 30), and
   the multiples of 3 skip 9. The KPKs are right.
7. **p. 57:** Asep's every-3-days schedule jumps from 29 Agustus to 4 September, skipping
   1 September. The conclusion (4 September) is right.
8. **Terminology:** "kelipatan persekutuan terbesar (KPK)" (Kata Kunci p. 44; also p. 45) should be
   terkecil. "Faktor persekutuan terkecil" (Skema p. 46; p. 66) should be terbesar. On p. 73, the
   common factors of 18 and 24 are given as "2, 3, dan 6", omitting 1.
9. **Typos:** rubric "80, 120, dan 16" for 160 (p. 90); a kue-kacang table headed "Banyaknya siswa
   tiap kelompok" (p. 94).
