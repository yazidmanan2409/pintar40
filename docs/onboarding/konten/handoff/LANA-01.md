# LANA-01: SD5 Matematika Bab 1, Bilangan Cacah sampai 100.000

## Round 2 (after GATE: FAIL @ 9545a39)

- **Blocking finding fixed.** Lesson 1, "Menulis bilangan dengan angka": "...akan bergeser ke tempat
  yang salah" now reads "...angka 3 terakhir bergeser ke tempat lain dan bilangannya menjadi 5.033
  (lima ribu tiga puluh tiga), jauh lebih kecil." The generator asserts 5.033.
- "salah" also removed from the CSV (three descriptions and the label of SD5-M-B1-10, now
  "Operasi tidak sesuai pertanyaan"). Studio reads only remediation, but labels and descriptions
  may reach teachers later. The only "salah" left is "salah satu", which the lexicon allows.
- **periksa_mutu.py now runs the doctrine lexicon.** It uses Studio's six patterns from
  `public.doctrine_lexicon`, case-insensitive, with the same severities. They are applied to every
  field in `public.learner_readable_fields`: lesson title, summary, body and objective; question
  stem, stimulus and petunjuk; option body and Alasan; and, with `--miskonsepsi`, the CSV's
  remediation.
- **IMPLAUSIBLE_DISTRACTOR is counted once per question**, as Studio does.
- **Calibration.** On the pre-LANA-01 package (a536edd) the checker gives
  `TOTAL: 0 ERROR, 33 WARNING (ANSWER_POSITION_SKEW 1, IMPLAUSIBLE_DISTRACTOR 4,
  WEAK_MISCONCEPTION_LINKAGE 28)`, as staging did. On the failed commit's package it gives the one
  ERROR staging raised (lesson 1 body_markdown, "salah"). Red test: a CSV whose remediation says
  "salah", "malas" and "PINTAR 4.0" gives 2 ERROR and 1 WARNING; "salah satu" gives none.

## Round 1

Source: Buku Panduan Guru Matematika untuk SD/MI Kelas V (Fitrianawati, Surtiani, Istiandaru),
Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, 2022, Bab 1, pp. 15-42
(`sd5_matematika_1_lesson.pdf`, 28 pages).

## What changed from the earlier Bab 1 workbook

- **Media lessons 5 and 6 removed** (D-050). Their only teaching text, a recap of the chapter,
  is now the last page ("Rangkuman Bab 1") of the new lesson 5. The transcripts in `transkrip/`
  are no longer referenced; they are left in place for whoever owns the media round.
- **Lesson 4 split in two**, following subbab D: 4 "Operasi Hitung" (add with carrying, subtract
  with borrowing, multiply by splitting the multiplier, long division, checking by the inverse)
  and 5 "Memecahkan Masalah Sehari-hari" (four steps, a one-step and a two-step worked problem,
  recap). Every page teaches one idea: a short explanation, a worked example step by step, why it
  works, and a "Coba" to try.
- **Post-test now fresh.** PB6 (38.000), PB7 (67.032 : 147) and PB8 (Rp35.000 / Paket B = 8.500)
  were the book's own Uji Kompetensi items, and their answers were worked in the lessons. They are
  replaced with new numbers and situations. The generator now asserts that no number in a
  post-test question appears in a lesson or in the book's exercises, and that no post-test answer
  is in the book's keys.
- **Practice questions no longer repeat a lesson's worked example** (e.g. 567 × 107, Rp34.000,
  Nisa's Rp47.000, Paket A, Ibu Saga's 2 ways). Each has its own numbers.
- **Answers spread over A-D**: A=7 B=8 C=8 D=8 (was A=21 B=5 C=2 D=0, an ANSWER_POSITION_SKEW).
  The correct option is never the strictly longest option.
- **Comparison questions**: the 1-character options `>` `<` `=` were IMPLAUSIBLE_DISTRACTOR
  warnings; they now read "lebih kecil dari (<)" etc.
- **Every distractor comes from a named mistake** (18 codes, `SD5-Matematika-Bab1-miskonsepsi.csv`),
  and its Alasan describes that mistake. The workbook's Kode miskonsepsi column is still empty.
- **Attribution line** in the form the brief asks for, from the PDF's title page.

## New tool: periksa_mutu.py

The brief names `docs/onboarding/konten/periksa_mutu.py`, but it was not on main or any branch.
I wrote it in this lane from Studio's own SQL (`run_mcq_quality` in
`supabase/migrations/20260919090000_staff_authoring_rpcs_check_their_capability.sql`), with the
same tokenising (single spaces, lower case, LIKE semantics) and thresholds. It also runs
`hint_reveals_answer_shape` and the upload contract's per-option rules. `--miskonsepsi <csv>`
counts the CSV's proposed codes as linked, to show the pass once the codes are filled in.
Please check it against the SQL before relying on it for other chapters.

## Checks

```
$ python3 docs/onboarding/konten/sd5_matematika_bab1.py
SD5-Matematika-Bab1.xlsx: lessons 5 (23 pages), questions 31 (pre 4, post 8, practice 19), answers A=7 B=8 C=8 D=8
SD5-Matematika-Bab1-miskonsepsi.csv: 18 codes
assertions passed: 579

$ npx tsx docs/onboarding/konten/ke-paket.ts docs/onboarding/konten/SD5-Matematika-Bab1.xlsx docs/onboarding/konten/SD5-Matematika-Bab1.paket.json
docs/onboarding/konten/SD5-Matematika-Bab1.paket.json: media none

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab1.paket.json
questions 31: pre 4, post 8, practice 19; answers A=7 B=8 C=8 D=8; correct option strictly longest in 0
TOTAL: 0 ERROR, 31 WARNING (WEAK_MISCONCEPTION_LINKAGE 31)

$ python3 docs/onboarding/konten/periksa_mutu.py docs/onboarding/konten/SD5-Matematika-Bab1.paket.json --miskonsepsi docs/onboarding/konten/SD5-Matematika-Bab1-miskonsepsi.csv
TOTAL: 0 ERROR, 0 WARNING
```

The 31 WEAK_MISCONCEPTION_LINKAGE warnings are expected: one per question, because the codes
are not registered yet. They clear once the codes are registered and filled in.

## Book errors

1. **Uji Kompetensi 4d (key, p. 36):** 567 × 107 is given as 55.566. It is 60.669; 55.566 is
   567 × 98. The lesson teaches 60.669, and the generator asserts both.
2. **Ayo Berlatih D no. 2 (key, p. 35):** the answers (Rp49.000, Rp121.500, Rp47.000, ...) depend
   on a fruit price table that is only in the student book, not in this PDF, so they cannot be
   checked. None of those items is used as printed. The only one reused is Nisa's
   100.000 − 53.000 = 47.000, which is self-contained.
3. Typos only, with no effect on content: "depalan" for "delapan" (p. 25), "memberli" (p. 40).

All other keys used were checked and are right: 50.303, 89.054, 54.534, 456, 38.000, 34.000,
97.500, 2 ways for Rp59.000, 55.000 / Paket B / 8.500, and both pengayaan ways for Rp56.900.
