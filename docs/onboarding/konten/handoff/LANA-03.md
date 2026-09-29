# LANA-03: SD5 Matematika Bab 3, Bilangan Pecahan

Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Fitrianawati, Surtiani, Istiandaru),
Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022, Bab 3, pp. 97-112
(`sd5_matematika_3_lesson.pdf`, 16 pages).

## The source is thin

This guide gives the chapter's scope, but not its content:

- **What it gives:** subbab A (membandingkan dan mengurutkan), B (penjumlahan) and C
  (pengurangan), each with penyebut sama and berbeda and with pecahan campuran; the Kelas 4
  review it opens with; and its misconceptions.
- **What it lacks:** worked examples, and the Uji Kompetensi questions. The Ayo Berlatih key is
  mostly pictures, and the Uji Kompetensi key is final answers only; both belong to the student
  book, which Yazid does not have ("the pdf is all i have", 28 Sep).

So every example and number here is PINTAR's own, within that scope, and each is proven by the
generator with `fractions.Fraction`. No book exercise is used.

## Content

Six text lessons, 23 pages:

1. Pecahan, Pecahan Senilai, dan Pecahan Campuran (the review the guide opens with, p. 99)
2. Membandingkan dan Mengurutkan Pecahan (subbab A; the ribbon ordering 2 1/4, 2 2/5, 2 1/2 m
   from the key on p. 104)
3. Penjumlahan Pecahan (subbab B)
4. Penjumlahan Pecahan Campuran (subbab B)
5. Pengurangan Pecahan (subbab C)
6. Pengurangan Pecahan Campuran dan Soal Cerita (subbab C), with the recap

The lessons use the player's fraction bar, `[[visual:pecahan|a/b]]`, eight times, all proper
fractions as the player requires. Simplifying uses FPB and making denominators equal uses KPK,
both from Bab 2.

30 questions: 4 pre-test, 8 post-test, 18 practice. Answers A=7 B=8 C=8 D=7; the correct option
is never the strictly longest.

- **Post-test** covers comparing, ordering mixed numbers, adding (biasa and campuran with
  carrying), subtracting (biasa and campuran with borrowing), and a one-step and a two-step word
  problem. It uses fresh fractions: no post-test problem is one a lesson works through, and no
  post-test answer is one of the book's Uji Kompetensi keys.
- **No distractor equals the answer in value.** The generator asserts this for every numeric
  question, so a distractor can never be, say, 4/8 when the answer is 1/2.
- **Workbook cells are text**, so Excel cannot turn 3/8 into a date.
- **Misconception codes: 14**, SD5-M-B3-01…14. Codes 02 and 06 are the book's own (pp. 104, 107,
  109). The workbook's Kode miskonsepsi column is empty.

## Checks

```
$ python3 docs/onboarding/konten/sd5_matematika_bab3.py
SD5-Matematika-Bab3.xlsx: lessons 6 (23 pages), questions 30 (pre 4, post 8, practice 18), answers A=7 B=8 C=8 D=7
SD5-Matematika-Bab3-miskonsepsi.csv: 14 codes
assertions passed: 576

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SD5-Matematika-Bab3.xlsx docs/onboarding/konten/SD5-Matematika-Bab3.paket.json
docs/onboarding/konten/SD5-Matematika-Bab3.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab3.paket.json
questions 30: pre 4, post 8, practice 18; answers A=7 B=8 C=8 D=7; correct option strictly longest in 0
TOTAL: 0 ERROR, 30 WARNING (WEAK_MISCONCEPTION_LINKAGE 30)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab3.paket.json --miskonsepsi docs/onboarding/konten/SD5-Matematika-Bab3-miskonsepsi.csv
TOTAL: 0 ERROR, 0 WARNING
```

## Book errors

1. **Unverifiable keys.** The Uji Kompetensi key (p. 110: 3/5, 13/60, 7/40, 1, then
   Benar/Salah) and most of the Ayo Berlatih key (p. 104, pictures) cannot be checked: their
   questions are in the student book, not in this guide. None is used. The generator asserts that
   no post-test answer equals one of these keys.
2. **The ribbon order (p. 104) checks out:** 2 1/4 < 2 2/5 < 2 1/2 m.
3. **Objectives numbered wrongly (p. 97):** 1.1-1.4 in Bab 3; they should be 3.1-3.4.
4. **Section labels:** subbab A's teacher table (p. 103) mentions adding in the comparing section,
   and subbab C (p. 107) says "Setelah mempelajari bagian B ini".
5. **Pages 110-111 are laid out out of order:** Diferensiasi and Refleksi appear after the
   Rubrik heading, and Remedial is split around the Uji Kompetensi key. No effect on content.
