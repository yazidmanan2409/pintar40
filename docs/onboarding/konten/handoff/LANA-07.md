# LANA-07: SD5 Matematika Bab 7, Membandingkan Ciri-Ciri Bangun Datar

Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Fitrianawati, Surtiani, Istiandaru),
Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022, Bab 7, pp. 285-344
(`sd5_matematika_7_lesson.pdf`, 60 pages).

## Content

Seven text lessons, 32 pages, in the book's order. Subbab A (segitiga) has four lessons and
subbab B (segi empat) has three. Seven is the upper limit; the book has eleven explorations.

1. Syarat Tiga Ruas Garis Membentuk Segitiga (7.1A)
   - The book's straw table.
   - Add the two shorter sides and compare with the longest.
   - "Sama dengan belum cukup": the book's 10, 5, 15 row.
2. Segitiga Menurut Besar Sudutnya (7.1B)
   - Lancip, siku-siku, tumpul.
   - Check all three angles.
3. Jumlah Sudut-Sudut dalam Segitiga (7.1C)
   - Asep's and Lukas's experiments give 180°.
   - Finding the third angle.
   - Why a triangle has at most one right or obtuse angle.
4. Segitiga Menurut Panjang Sisinya (7.1D)
   - Sama kaki, sama sisi, sembarang, with their angles and symmetries.
   - Worked angles: 45° for siku-siku sama kaki, which is the book's, and 40° for tumpul sama kaki.
   - "Bila semua ciri A dimiliki B, B adalah A": a sama sisi triangle is also sama kaki, but not
     the other way round.
5. Trapesium dan Jajargenjang (7.2A-C)
   - The book's inclusive trapesium, with a note that some books use "tepat sepasang".
   - Trapesium siku-siku and trapesium sama kaki.
   - A jajargenjang is a trapesium, but not a trapesium sama kaki.
6. Persegi Panjang, Belah Ketupat, dan Persegi (7.2D-F)
   - Which way the classification runs.
   - The straw experiment.
   - The ciri to add at each step.
7. Layang-Layang dan Belah Ketupat (7.2G)
   - Ciri of the layang-layang.
   - A belah ketupat is a layang-layang.
   - A symmetry table for every shape in the chapter.
   - Recap of the chapter.

**No pictures.** Every shape is given by its sides, its angles or a list of its ciri. The
generator checks every answer rather than typing it in:

- `bisa_segitiga()`, `sudut_ketiga()`, `jenis_sudut()` and `jenis_sisi()` handle the triangles.
- `CIRI` lists each quadrilateral's ciri the way the book does.
  - `tutup()` adds the ciri that the given ones force. For example, a jajargenjang with one right
    angle has four (p. 325), and two diagonals that are both sumbu simetri make a belah ketupat
    (p. 338).
  - `termasuk(x, y)` is the book's rule: x can be called y when every ciri of y is a ciri of x.
- The model reproduces every conclusion in the book before any question uses it:
  - jajargenjang ⊂ trapesium;
  - persegi panjang, belah ketupat ⊂ jajargenjang;
  - persegi ⊂ both;
  - belah ketupat ⊂ layang-layang;
  - a jajargenjang is not a trapesium sama kaki;
  - each "ciri yang harus ditambahkan".
- The symmetry table in lesson 7 is asserted against `SIMETRI_LIPAT`.

## Questions

31 questions: 4 pre-test, 8 post-test and 19 practice.

- **Answer positions:** A=8, B=8, C=7, D=8. The correct option is never strictly the longest.
- **Pre-test:** samples four lessons (the triangle rule, a missing angle, naming by sides,
  classifying a persegi panjang).
- **Post-test:** covers all seven lessons. PB3 tests lesson 2's naming by angle through a
  missing angle. Its items are:
  - a third straw;
  - a right triangle's other acute angle;
  - a triangle's kind from two angles;
  - a sama kaki triangle's base angles;
  - naming 6, 6, 6;
  - jajargenjang as a trapesium;
  - a jajargenjang with four equal sides;
  - a kite that is not a belah ketupat.
- **Freshness.** The generator asserts all of the following for the post-test:
  - No set of lengths is one the book or a lesson works through.
  - No angle in a stem is a lesson example.
  - No answer is a book key (45°, 60°, 90°, 180°) or a lesson answer.
  - No stem or answer repeats an Uji Kompetensi statement.
  - The check caught one overlap: PB3 first used 25° and 40°, and 40° is a lesson 2 example. It
    now uses 20° and 48°.
- **Distractors and the answer's value:** in every question whose options are all lengths or all
  angles, no distractor has the answer's value; the generator asserts this. There are no form
  questions.
- **Misconception codes: 11**, SD5-M-B7-01…11.
  - 01, 04, 08 and 09 are the book's own Miskonsepsi (pp. 312 and 338).
  - 02 (sum only equal to the third side), 03 (checking the wrong pair) and 06 (an unfinished
    step) come from the distractors.
  - So do 05, 07, 10 and 11: the angle sum, naming by sides, the trapesium definition and the
    number of symmetry axes.
  - The workbook's Kode miskonsepsi column is empty.

## Checks

```
$ python3 docs/onboarding/konten/sd5_matematika_bab7.py
SD5-Matematika-Bab7.xlsx: lessons 7 (32 pages), questions 31 (pre 4, post 8, practice 19), answers A=8 B=8 C=7 D=8
SD5-Matematika-Bab7-miskonsepsi.csv: 11 codes
assertions passed: 563

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SD5-Matematika-Bab7.xlsx docs/onboarding/konten/SD5-Matematika-Bab7.paket.json
docs/onboarding/konten/SD5-Matematika-Bab7.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab7.paket.json
questions 31: pre 4, post 8, practice 19; answers A=8 B=8 C=7 D=8; correct option strictly longest in 0
TOTAL: 0 ERROR, 31 WARNING (WEAK_MISCONCEPTION_LINKAGE 31)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab7.paket.json --miskonsepsi docs/onboarding/konten/SD5-Matematika-Bab7-miskonsepsi.csv
TOTAL: 0 ERROR, 0 WARNING
```

Bab 1-6 generators re-run unchanged: 579, 600, 576, 587, 553 and 508 assertions. Their xlsx files
were restored, because only the timestamps change. `npm run lint` gives 0 errors and the 2
warnings that were already there.

## Book errors

I checked these against the page images. None of them is copied into the workbook.

1. **p. 311, the conclusion is reversed.**
   - The box says "Segitiga sama sisi belum tentu dapat digolongkan sebagai segitiga sama kaki."
   - That contradicts p. 310 ("Segitiga sama sisi dapat digolongkan sebagai segitiga sama kaki"),
     Uji Kompetensi 4 (Benar), and the table directly above it.
   - It should read: segitiga sama kaki belum tentu dapat digolongkan sebagai segitiga sama sisi.
   - The table's last row also asks the question the wrong way round: "Apakah semua ciri-ciri
     segitiga sama kaki dimiliki oleh segitiga sama sisi? Tidak selalu". It means the ciri of the
     sama sisi triangle.
   - Lesson 4 teaches the correct direction.
2. **p. 337, sisi berurutan.** The belah ketupat is labelled A (left), C (top), B (right),
   D (bottom). Two of the six "pairs of consecutive sides" listed are opposite sides: AC with BD,
   and AD with BC. That does not change the answer (Ya), but it shows the wrong pairs.
3. **Labels:**
   - p. 309: after the sama sisi triangle, the heading asks about "ciri-ciri … segitiga sama
     kaki". It means sama sisi.
   - p. 329: the box headed "Sisi-sisi jajargenjang yang berhadapan sama panjang" checks the
     angles (∠A = ∠C, ∠D = ∠B), and it ends by asking about the sides again. It means the angles.
   - p. 331: "Berikut ini ciri-ciri jajargenjang yang sudah kita ketahui" introduces the belah
     ketupat's ciri.
   - p. 338: the subbab B Diferensiasi says "Subbab A".
4. **Typos:**
   - "besat" (p. 307);
   - "persegi panjangi" (p. 314);
   - "layang-layangi" (p. 336);
   - "segiitiga" (p. 304);
   - "dimiliiki" (pp. 310-311);
   - "pertamaagar" (p. 318).
5. **Not an error:** the speech bubble on p. 325 says "persegi panjang memiliki sudut siku-siku,
   sedangkan jajargenjang tidak." This is Asep's opinion, which the page asks pupils to test
   ("Coba pikirkan pendapat Asep … Bolehkah jajargenjang memiliki sudut siku-siku? Boleh"). The
   straw experiment then refutes it.
6. **Checked and correct:**
   - the straw table (p. 295: rows 1, 2 and 5 Bisa; rows 3 and 4 Tidak bisa; every sum
     column);
   - 45° and 60° (pp. 307-308);
   - the two-right-angles argument (p. 303);
   - the Uji Kompetensi key (p. 339: S S B B S B B S S B);
   - both Pengayaan keys (p. 343);
   - every symmetry count the book gives.

## Questions for the coordinator

None. The inclusive trapesium follows the book (p. 318). No question asks whether a persegi
panjang is a trapesium sama kaki, because the book does not say.
