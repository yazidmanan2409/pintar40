# LANA-06: SD5 Matematika Bab 6, Sudut

Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Fitrianawati, Surtiani, Istiandaru),
Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022, Bab 6, pp. 247-284
(`sd5_matematika_6_lesson.pdf`, 38 pages).

## Content

Six text lessons, 23 pages, in the book's subbab order. Subbab C (mengukur dan membandingkan) is
split in three: the protractor; kinds of angle by size, reflex angles and comparing; and angles
on a clock, which the book's own exercises and Uji Kompetensi use throughout.

1. Sudut Siku-Siku (A: the folded-paper checker; any orientation)
2. Pengertian dan Jenis Sudut (B: kaki and titik sudut; a rounded corner is not an angle;
   lancip, siku-siku, tumpul)
3. Mengukur Sudut dengan Busur Derajat (C: degrees; the two scales; read the one whose 0 is on
   the first leg; check with the kind)
4. Jenis Sudut Menurut Besarnya dan Membandingkan Sudut (C: nol to satu putaran; refleks =
   360° − the angle; leg length does not matter)
5. Sudut pada Jam (C: 30° a number; the hour hand moves)
6. Melukis Sudut dan Memecahkan Masalah (D: drawing with the protractor; 360° round a point;
   180° on a line; the book's tile pattern with the correct 54°), with the recap

**No pictures.** The player draws no angles, so every angle comes from something described in
words: clock hands, a turn, a folded paper, or a protractor reading ("kaki kedua melewati angka 65
pada skala dalam dan 115 pada skala luar"). The generator computes these, so every clock answer
and slip is checked, not typed:

- `sudut_jam()` gives the smaller angle between the hands (the hour hand moving half a degree a
  minute);
- `jarum_pendek_diam()` gives the slip where the hour hand is left on the hour;
- `bacaan_busur()` gives the readings on both protractor scales;
- `jenis()` classifies an angle by its size.

## Questions

30 questions: 4 pre-test, 8 post-test, 18 practice. Answers A=8 B=7 C=8 D=7; the correct option
is never the strictly longest.

- **Post-test** covers the kinds of angle, reading a protractor, a whole-hour and a half-hour
  clock, a reflex angle, angles on a straight line, comparing angles with different leg lengths,
  and a tile gap round a point.
- **Freshness, adapted to angles:**
  - A clock question is fresh when its time is not one the book or a lesson works through;
    every whole-hour angle (30°, 60°, …, 180°) is already some book key, so the answer cannot be
    the test there.
  - Every other post-test answer is checked against the book's keys for the same kind of
    problem, and its angles against the lesson examples.
  - The tile question is checked by its whole set of tiles.
  - The check caught one overlap (PB8 against lesson 6's first tile example); I changed the
    lesson example.
- **Distractors and the answer's value:** in every question whose options are angles, no
  distractor has the answer's value; the generator asserts this. There are no form questions.
- **Misconception codes: 10**, SD5-M-B6-01…10. 01, 02, 04 and 05 are the book's own Miskonsepsi
  (pp. 255, 260, 264, 266, 274-275). The workbook's Kode miskonsepsi column is empty.

## Checks

```
$ python3 docs/onboarding/konten/sd5_matematika_bab6.py
SD5-Matematika-Bab6.xlsx: lessons 6 (23 pages), questions 30 (pre 4, post 8, practice 18), answers A=8 B=7 C=8 D=7
SD5-Matematika-Bab6-miskonsepsi.csv: 10 codes
assertions passed: 508

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SD5-Matematika-Bab6.xlsx docs/onboarding/konten/SD5-Matematika-Bab6.paket.json
docs/onboarding/konten/SD5-Matematika-Bab6.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab6.paket.json
questions 30: pre 4, post 8, practice 18; answers A=8 B=7 C=8 D=7; correct option strictly longest in 0
TOTAL: 0 ERROR, 30 WARNING (WEAK_MISCONCEPTION_LINKAGE 30)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab6.paket.json --miskonsepsi docs/onboarding/konten/SD5-Matematika-Bab6-miskonsepsi.csv
TOTAL: 0 ERROR, 0 WARNING
```

## Book errors

Checked against the page images. None is copied into the workbook.

1. **p. 277, Uji Kompetensi 3 (tiles):** the regular pentagon's triangle is labelled 72°, 56°,
   56°, which adds up to 184°. The base angles are **54°**: 72 + 54 + 54 = 180, and 2 × 54 = 108,
   the angle the key then uses.
2. **p. 278:** the key leaves both tile gaps blank ("adalah ...."). They are **54°** for Pola 1
   (a square and two pentagons: 360 − 90 − 108 − 108) and **36°** for Pola 2 (three pentagons).
   Lesson 6 uses Pola 1.
3. **Uji Kompetensi 2 (roads), pp. 276-277:** the four angles in the key (110° + 90° + 25° + 130°)
   add up to 355°, so they cannot be the four angles round one crossing point. The map is in the
   student book, so I cannot tell whether the roads meet at more than one point or a value is
   off. Noted, not used.
4. **Checked and correct:** all eight clock keys (pp. 267-268: 30°, 90°, 120°, 135°, 60°, 90°,
   150°, 45°); Uji Kompetensi 1 (30°, 120°, 180°); the fans (135° largest); both ways of
   measuring the reflex angle (240°); the kinds in the Ayo Berlatih key (p. 261).
5. **Labels:** Tabel 6.2 (p. 254) is titled "…Pembelajaran Tabel Frekuensi" and subbab A's
   intro says "materi tentang pengumpulan data" (p. 252); the subbab B Refleksi says "topik
   terkait piktogram" (p. 262); Tabel 6.4 (p. 274) heads its criteria column "Banyaknya
   Pengunjung"; the Uji Kompetensi item 1 is titled "Pengunjung Perpustakaan" (p. 276). These
   are left over from another chapter's template.
