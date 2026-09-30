# LANA-23: [UJI INTERNAL] Strategi Pembelajaran, Bab 2: Klasifikasi dan Pemilihan Strategi Pembelajaran

**Internal demo only** (D-069(g), D-070(d), (e)). Same rules as LANA-22:
- it lives on `claude/adoring-feynman-njmjll` in `content/_uji-internal/strategi-pembelajaran/`;
- it is never merged to `main`, and never sent to production or Pustaka PINTAR;
- it is deleted after the demo unless rights are obtained;
- the scans are not committed.

## Source

*Strategi Pembelajaran* (Nurhasanah, Jayadi, Sa'diyah, Syafrimen), EDU PUSTAKA 2019, ISBN
978-623-90461-7-0. Bab II, pp. 37–82 of the print.

**The scan:** 28 pages of the typed manuscript, like Bab 1. Every page cited here is a page of that
scan. Pages ii and vi are front-matter pages.

| Section | Print (Daftar Isi) | Scan |
|---|---|---|
| A | 38 | 1 |
| B | 44 | 4 |
| C | 53 | 10 |
| D | 59 | 13 |
| E | 70 | 20 |
| F | 76 | 24 |
| G | 81 | 28 |

## Content

Seven text lessons, one per section A–G, with 31 pages in total. **No sections were merged.**
- **Why not merge G:** G is short (one scan page), but it is where the choosing happens, and it
  draws on lessons 2–6.
- **Length:** 290–474 words per lesson.
- **Marking and voice:** «[UJI INTERNAL]» is on the course, the chapter and all seven lesson titles.
  Lesson 1 opens with the notice and the full citation. Every lesson addresses the reader as «Anda»
  (asserted).
- **Order within each lesson:** concept, then what it means for the educator, then a classroom
  situation.
- **Format:** lists only. No tables, images or diagrams; the book's tables and cycle diagrams
  become numbered lists.
- **Naming:**
  - The lessons use the book's «Empirik».
  - Lesson 1 says once that it is the group Bab 1 calls «melalui pengalaman». An assertion checks
    that this phrase appears exactly once in all learner text, and only in lesson 1.
  - Lesson 5's title is «Strategi Pembelajaran Empirik».

| # | Title (after «[UJI INTERNAL] ») | Sections | Classroom situation |
|---|---|---|---|
| 1 | Klasifikasi Strategi Pembelajaran | The basis of a classification (Raka Joni); arranging teacher and learners; handling the message (ekspositorik and heuristik, deduktif and induktif); the five Saskatchewan groups | SMA Fisika: one lesson, classified on three bases in each half |
| 2 | Strategi Pembelajaran Langsung | Definition (procedural and declarative); the five phases; strengths and limits; combine with other strategies | SMP Matematika: half the class goes wrong after the demonstration |
| 3 | Strategi Pembelajaran Tidak Langsung | Definition; when it fits (Robertson and Lang); how the teacher facilitates (scaffolding, wait time); strengths and weaknesses | SMA Geografi flood problem: a hint question, and open solutions |
| 4 | Strategi Pembelajaran Interaktif | Definition (constructivist, learners' questions); features and the role of questions; the seven stages (Faire and Cosgrove); strengths and weaknesses | IPA IX egg in salt water: select questions, compare with the first guesses |
| 5 | Strategi Pembelajaran Empirik | Definition; Kolb's basis; the four-stage cycle (feeling, watching, thinking, doing) | SMA Ekonomi market simulation, with reflection before the concept |
| 6 | Strategi Pembelajaran Mandiri | Basic idea (modules, short steps); what the teacher controls (time, material quality); activity and evidence of mastery | A long enrichment unit that learners stall on |
| 7 | Memilih Strategi Pembelajaran yang Tepat | Method as part of strategy; the six criteria; weighing them with lessons 2–6 | SMA Sejarah: two goals, two strategies in one meeting |

## Every statement is traced, every key verified

The method is LANA-22's.
- **Trace file:** `StrategiPembelajaran-Bab2-jejak.md` is generated. It traces each lesson section
  and each option to its facts and pages.
- **Section check:** the generator asserts that every section is listed in `JEJAK` with its facts.
  There are 32 sections, counting lesson 1's opening.
- **FAKTA: 155 facts,** on scan pp. 1–28 and front-matter pp. ii and vi.
  - `--kutipan` finds **152 of 155** in the scans' text.
  - The other three are printed as images, and I read them by eye (`GAMBAR`):
    - Tabel 3.1, the five phases, p. 9;
    - Gambar 3.2, the interactive stages, p. 17;
    - Tabel 3.2, Kolb's four abilities, p. 23.
  - Every fact outside the error record is used. 16 facts are kept only as the book-error record.
- **Verbatim check:** no run of 10 or more words of learner text appears in the book. The longest
  shared run is 8 words: «tidak langsung sering disebut inkuiri induktif pemecahan masalah», the
  list of names.
- **Assertions:** 6.413 with `--kutipan` (6.411 without).

## Questions

20 questions: 4 Pemetaan awal, 8 Cek penguasaan (Uji Penguasaan) and 8 Latihan (at most 2 per
lesson; lesson 3 has 2). There are no misconception codes (out of scope).
- **Answer positions:** A=5, B=5, C=5, D=5. The key is never strictly the longest option.
- **Pre-test:** lessons 1, 2, 4 and 7.
- **Post-test:** covers all seven lessons. 7 are Sedang and 1 is Sulit (PB8).

**LANA-22's rules, applied from the start:**
- **Distractors:** every distractor is a move or reading a practising teacher might really make,
  and the chapter rules it out by a named fact. The Alasan says which.
- **Absolute wording:** `MUTLAK` asserts that no distractor carries «apa pun», «satu-satunya», «sama
  persis», «sama sekali», «hanya», «selalu», «pasti», «tentu», «tidak perlu» or «menjamin» unless
  the key does. PB4's key and its options share «hanya», because the book's own diagnosis (p. 16)
  says the interaction is «hanya … antara siswa pandai dengan guru».
- **One kind of answer per question:** a stem that asks what to do or choose («… lakukan?», «… pilih?»)
  is asserted to have four actions, each beginning with a verb. PB1 and PB4 ask «apa yang paling
  tepat menjelaskan …», and all their options are diagnoses. The label questions (PA1–PA4, LT1,
  LT6, LT8) have four labels of the same kind.
- **Post-test situations:** no post-test stem shares an 8-word run with any lesson. By design, no
  post-test reuses a lesson's classroom situation.
  - I changed PB5 from a market simulation (lesson 5's) to a heating experiment.
  - I changed PB6 from a long unit (lesson 6's) to a psychomotor sewing module.
  - I changed PB7 from Sejarah testimonies (lesson 7's) to comparing advertisements.
  - I rewrote the closing situations of lessons 3 and 4, so PB3 and PB4 stand apart from them.
- **Stems:** 18 of 20 describe a situation; LT2 and LT4 are direct conceptual questions.

| Item | Lesson | Asks | Key |
|---|---|---|---|
| PB1 | 1 | Diagnosis: 38 mixed readers, one worksheet, one pace | Klasikal assumes equal ability |
| PB2 | 2 | Action: procedures fine, discussion weak | Combine direct instruction with another strategy |
| PB3 | 3 | Action: many terms to recall before the exam, while using discovery | Direct for the terms, discovery for reasoning |
| PB4 | 4 | Diagnosis: the same four top learners always answer | Interaction only teacher and able learners, not multi-directional |
| PB5 | 5 | Action: experiment, then straight to the concept | Time to reflect before the concept (Kolb) |
| PB6 | 6 | Action: a print module for a sewing skill; theory fine, stitches poor | Add demonstration or video and monitored practice |
| PB7 | 7 | Choice: judge misleading adverts, 32 learners, no funds | Indirect or interactive, small groups, printed copies |
| PB8 | 2 | Action (Sulit): phases in the wrong order and missing | Rebuild the five phases in order |

## Checks

```
$ python3 content/_uji-internal/strategi-pembelajaran/strategi_pembelajaran_bab2.py --kutipan <bab2.txt>,<depan.txt>
StrategiPembelajaran-Bab2.xlsx: lessons 7 (31 pages), questions 20 (pre 4, post 8, practice 8), answers A=5 B=5 C=5 D=5
facts traced: 155 (scan pages 1-28, front matter 4); book-error record 16; lesson sections traced 32
quotations found in the book's text: 152 of 155; figures read by eye: tabel31, gambar32, tabel32
longest run of words shared with the book: 8 (lesson 3 isi: «tidak langsung sering disebut inkuiri induktif pemecahan masalah»)
assertions passed: 6413

$ python3 docs/onboarding/konten/periksa_mutu.py …/StrategiPembelajaran-Bab2.paket.json
questions 20: pre 4, post 8, practice 8; answers A=5 B=5 C=5 D=5; correct option strictly longest in 0
TOTAL: 0 ERROR, 20 WARNING (WEAK_MISCONCEPTION_LINKAGE 20)
```

- **Warnings:** the 20 warnings are the acknowledged WEAK_MISCONCEPTION_LINKAGE (no codes, out of
  scope).
- **The package:**
  - Kursus: Jenjang «Guru», Kelas «Guru», Mata pelajaran «Pengembangan Kompetensi».
  - Konteks: «Pengembangan profesi».
- **Rebuild:** a second run gives a byte-identical package.
- **Bab 1:** the Bab 1 generator re-runs and passes, and its package is untouched.
- **Fixed before hand-off:** the generator's copies of the periksa_mutu rules caught:
  - 10 stems that revealed their answer: PA3, PA4, PB1, PB2, PB3, PB5, PB8, LT3, LT5, LT7;
  - 11 keys that were strictly the longest option: PA1, PA3, PB1, PB2, PB3, PB5, PB8, LT2, LT3, LT4,
    LT5;
  - 2 rationales with «salah satu».

  On my own read, I then replaced LT2's distractors, which had described other strategies, with
  claims about direct instruction that the chapter contradicts. I also reworded PB7 B, which had
  called 32 learners a large class.

## Book errors and inconsistencies

None is copied into the workbook; `DILUAR` markers assert that the wording is absent.

1. **p. 1: a race and skin-colour example.**
   - The book illustrates classification with human «warna kulit» and «ras mongoloid, ras
     kaukasoid, dan ras negroid».
   - This is an outdated racial typology, and it is kept out. Lesson 1 explains «dasar
     klasifikasi» without an example.
   - Also on p. 1: «Dasar kualifikasi» (for klasifikasi) and «struktus».
2. **p. 2: «program pendidikan jarak jauh ini»** is text left over from a distance-learning module.
   It is kept out.
3. **Numbering:** the chapter's figures and tables are numbered as if in chapter 3 (Gambar
   3.1–3.4, Tabel 3.1–3.2). No lesson cites them by number.
4. **p. 5: «efektif untuk menentukan informasi».**
   - Bab 1 (p. 9) has «memperluas informasi».
   - Lesson 2 keeps only «membangun keterampilan tahap demi tahap».
5. **pp. 5–7: terms used interchangeably.** The section on the strategy says «model», «metode» and
   «strategi» pembelajaran langsung, although Bab 1 separates the three terms. The lessons say
   «pembelajaran langsung» or «strategi».
6. **p. 6: «cara yang palig efektif»** for low achievers. The lesson says «efektif», without the
   superlative.
7. **p. 7:**
   - «dalam hal ini adalah pembelajaran matematika» is left over from a mathematics source.
   - «siswa akan kehilangan perhatian setelah 10-15 menit» is a precise figure with no source.
   - Both are kept out.
8. **p. 11: «pendekatan langsung antara lain memiliki karakteristik … investigasi».** This should
   read tidak langsung; the same list is attributed to tidak langsung a few lines later.
9. **Garbled passages:** the scaffolding definition on p. 12, and the closing sentence of section C
   on p. 13. The lessons paraphrase only what is clear.
10. **p. 16:**
    - The paragraph breaks off mid-sentence: «agar siswa termotivasi dalam komunikasi multiarah,
      maka».
    - «Usmanr (1990)».
    - The seven stages are credited both to «Faire Cosgrove dalam vaille dan Grady (2007:117)»
      and to «Faire dan Cosgrove (Harlen, 1996:28)». Lesson 4 says «Mengikuti Faire dan
      Cosgrove».
11. **Section E naming:**
    - The heading says «Empirik», but the text on p. 20 says «melalui pengalaman».
    - Gambar 3.1 on p. 4 says «pengalaman (experiental)».
    - «Experiental» should be experiential throughout.
    - p. 20 also repeats «berorientasi pada siswa».
12. **p. 21:**
    - «daripada efektif» should be afektif.
    - «apabila salah satu elemen tidak ada, maka kedua elemen lainnya tidak efektif» is overstated,
      and it is kept out.
13. **Kolb's fourth stage has three names:** implementasi (p. 22), aplikasi (p. 23) and eksperimen
    (p. 24); Tabel 3.2 calls it Active experimentation. Lesson 5 says «penerapan atau eksperimen
    aktif».
14. **p. 24:**
    - «ditunjukkan dengan roses refleksi» should say the experience is followed by reflection.
    - The worked example stops after its first stage («pertama, pengalaman konkret»), and
      section F begins.
15. **p. 25: «untuk mengatasi kesulitan mengajar bagi guru yang kurang kompeten»** is kept out.
16. **p. 26: the Carroll model is garbled.**
    - «keberhasilan belajar = waktu yang diperlukan dan waktu yang digunakan» has no ratio.
    - The next sentences call both variables «waktu yang digunakan» and swap numerator and
      denominator.
    - The formula is kept out. Lesson 6 keeps only what the page states plainly: the two variables
      the provider controls, time given and instructional quality.
17. **p. 27: «Masyarakat kita … belum berbudaya membaca»** is a generalisation, and it is kept out.
18. **p. 28:** the criteria list opens with a stray «1.». The scan ends at criterion f. See question
    1.
19. **Typos:**
    - p. 3: «dedukatif», «stratgei», «peasan»;
    - p. 9: «eternity» (eternit);
    - p. 10: «pengambilang», «Guur»;
    - pp. 13 and 20: «keinginntahuan», «krtis»;
    - p. 27: «seft-test», «fortofolio»;
    - p. 28: «farativ».

## Questions for the coordinator

1. **Is section G complete in the scan?** The scan ends on p. 28 at criterion f. The Daftar Isi puts
   G at p. 81 and Bab III at p. 83, so G may run onto a page the scan lacks.
   - Lesson 7 uses only what p. 28 holds: method as part of strategy, and the six criteria.
   - If there is a further page, please send it and I will add it.
2. **The p. 1 race example is left out entirely.** Please confirm that is right for the demo.

## Round 2 (coordinator's review of `dc4e6f3`)

1. **A 10-word verbatim run in lesson 6.** The scan's text layer joins «diambilkapan», so the old
   check missed the run.
   - The run check now compares with spaces, punctuation and the scan's page breaks removed, and
     matches a run wherever its letters appear consecutively in the book.
   - Lesson 6 now reads «tes baku yang boleh ditempuh kapan pun peserta didik siap, kolokium, atau
     portofolio».
   - The new check also found a 9-word run in lesson 3 («… sering disebut inkuiri, induktif,
     pemecahan masalah, pengambilan …»), which is within the limit. I rephrased it anyway
     («dikenal juga dengan nama …»).
   - The longest shared run is now 8 words, an ordinary phrase: «bila peserta didik perlu mengingat
     materi dengan cepat».
   - Bab 1 is not changed. Under the new comparison its longest run is still 9 words, the
     attributed UU definition.
2. **No count in lesson 7.**
   - The heading is now «Kriteria pemilihan», and the list is bulleted, not numbered.
   - The summary says «sejumlah kriteria»; the objective says «kriteria pemilihan yang disebut bab
     ini».
   - An assertion checks that lesson 7 contains neither «enam» nor «keenam».
   - It holds only what p. 28 holds.
3. **PB7's key** is now «memakai strategi interaktif: kelompok kecil menelaah fotokopi kedua iklan
   dan saling menanggapi penilaiannya».
   - The reuse check now covers every post-test option as well as every stem: no 8-word run may
     be shared with any lesson.
   - The key is still at D, and its fact is still `kriteria_a`.
4. **PB1 C** is now a diagnosis a teacher might really make: «satu guru tidak cukup untuk 38
   peserta didik, sehingga yang dibutuhkan terutama team teaching».
   - The chapter rules it out (`klasikal`, p. 2): a klasikal class of about 35–45 is taught by one
     teacher.
   - The problem is the assumption of equal ability, not the number of teachers.
5. **PA4** now asks «Kriteria pemilihan mana yang paling jelas tidak terpenuhi …».

**Optional, taken:** LT6's stem now says «apa yang mereka amati dan alami selama kunjungan itu».

**Your answers:**
- Section G stays with what p. 28 holds, with no count. Whether p. 82 continues the list is for
  Yazid.
- Leaving out the race example is confirmed.

**Gate after round 2:**
- 6.447 assertions with `--kutipan` (6.445 without); 152 of 155 quotations found (3 read by eye).
- The longest verbatim run is 8 words.
- periksa_mutu is 0 ERROR, with the 20 acknowledged WEAK_MISCONCEPTION_LINKAGE warnings.
- The package rebuilds byte-identically.
- Against `dc4e6f3`, the package differs in exactly ten fields:
  - the bodies of lessons 3, 6 and 7, and lesson 7's summary and objective;
  - the PA4 and LT6 stems;
  - the PB1 C text and Alasan;
  - the PB7 D text.

## After the pass: section G closed (Yazid)

Yazid sent the fuller manuscript (52 pages). Its pp. 1–28 are identical to the Bab 2 scan, section
G ends at criterion f, and Bab III starts on p. 29. This is a demonstration, so the manuscript is
enough.
- Lesson 7 names «enam kriteria» again, and the list is numbered.
- The check that forbade a count is replaced by one that requires «enam kriteria».
- Nothing else changed.
