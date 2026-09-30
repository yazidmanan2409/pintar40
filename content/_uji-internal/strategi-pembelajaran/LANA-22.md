# LANA-22: [UJI INTERNAL] Strategi Pembelajaran, Bab 1: Pendahuluan

**Internal educator demo only** (D-069(g), D-070(d), (e)).
- Lives on `claude/adoring-feynman-njmjll` in `content/_uji-internal/strategi-pembelajaran/`.
- Never merged to `main`, never sent to production or Pustaka PINTAR.
- Deleted after the demo unless rights are obtained. The scans are not committed.

## Source

Dr. Siti Nurhasanah, M.Pd; Dr. (Cdt) Agus Jayadi, M.Pd; Dr. Rika Sa'diyah, M.Pd; Syafrimen, M.Ed,
Ph.D. *Strategi Pembelajaran*. Jakarta: Penerbit EDU PUSTAKA, 2019, Cetakan Pertama, ISBN
978-623-90461-7-0. Bab I «Pendahuluan», pp. 1–36 of the print.

**The scans:**
- **Front matter** (10 pages): cover, colophon on p. ii, Kata Sambutan, Daftar Isi.
- **Bab 1** (22 pages): **not the printed book**. It is the typed manuscript: Word layout, no printed
  page numbers, and page breaks that differ from the print.

**Every page cited here is a page of the Bab 1 scan.** Pages ii and vi are front-matter pages. The
Daftar Isi gives the sections' print pages, which match the scan roughly as follows:

| Section | Print (Daftar Isi) | Scan |
|---|---|---|
| A | 2 | 1 |
| B | 12 | 8 |
| C | 17 | 11 |
| D | 18 | 11 |
| E | 27 | 17 |

## Content

Five text lessons with 20 pages in total, one lesson per section A–E. No sections were merged.
Each takes a few minutes to read (337–529 words).
- **Reader:** a practising educator, addressed as «Anda».
- **[UJI INTERNAL]** is on the course title, the chapter title and all five lesson titles.
- **Opening of lesson 1:** it starts with «UJI INTERNAL / MATERI PERAGAAN — TIDAK UNTUK DISTRIBUSI
  PRODUKSI» and the full citation.
- **Attribution:** every lesson ends with an attribution line that also says «Materi uji internal,
  bukan untuk distribusi».
- **Order within each lesson:** concept, then what it means for the educator, then a classroom
  situation and the judgement it calls for. Lesson 4 closes with one reflection prompt.
- **Format:** lists only, no tables, no images and no diagrams. The book's hierarchy diagram
  becomes a numbered list.

| # | Title (after «[UJI INTERNAL] ») | Sections | Classroom situation |
|---|---|---|---|
| 1 | Pengertian Strategi Pembelajaran | Origin of «strategi» and its definition; pembelajaran against pengajaran; the seven components; the two traits (a plan, not yet action; aimed at a goal that is stated first) | SMP IPA teacher with slides but no measurable goal |
| 2 | Jenis-Jenis Strategi Pembelajaran | Newman and Logan's four elements; Rowntree; induktif and deduktif; the five Saskatchewan groups | SMA Biologi: microscope procedure (langsung) against a hypothesis from data (tidak langsung) |
| 3 | Sasaran Kegiatan Pembelajaran | Graded goals; belajar-mengajar as a system; the teacher's roles and the 12 aspects of the learner, grouped | Kelas V: three pupils stop finishing work; understand them before changing strategy |
| 4 | Tahapan Kegiatan Pembelajaran | Three stages; the seven opening moves; the four core steps; assessment and follow-up after a formative test | SMA Matematika teacher who explains all hour and sums up alone |
| 5 | Istilah dalam Strategi Pembelajaran | Pendekatan, strategi, metode, teknik and taktik as a hierarchy; model and desain (the house analogy); the method against strategy contrasts | Two teachers, one discussion method, different techniques by class, and different tactics by person |

**Kept out:** the book's claims that are dated, wrong, or merely asserted.
- The methods table on p. 21 says methods are «relatif kuno», «kaku dan baku», and «seni» against
  «ilmu». These are left out. Lesson 5 keeps only the contrasts the book argues: subject against
  goal, a criterion-referenced test, flexibility, and scope.
- The KTSP reference is left out.
- The «delapan unsur» count is left out.
- The Dewey attribution is left out.

## Every statement is traced, every key verified

- **Page trace (`JEJAK`):** every lesson section lists the facts it rests on, and the generator
  asserts that the list matches the lesson's sections exactly. There are 21 sections, counting
  lesson 1's opening.
- **Option trace:** every option (key and distractor) names the fact that decides it.
- **Trace file:** `StrategiPembelajaran-Bab1-jejak.md` is generated and holds the whole trace:
  sections, options and facts, with pages.
- **FAKTA: 135 facts.** They cover scan pp. 1–22, plus 4 front-matter facts on pp. ii and vi.
  - `--kutipan` finds **134 of 135** in the scans' text.
  - The one it cannot find, `hierarki`, is the diagram on p. 18 (Gambar 1.2 on p. 20). It is an
    image; I read it by eye, and it sits in `GAMBAR`.
  - Every fact outside the error record is used. 12 facts are kept only as the book-error record.
- **Keys:** every key is the option its fact supports. Each distractor names the fact that rules it
  out, and its Alasan says why. There are no computed values in this chapter.
- **Verbatim check:** with `--kutipan`, no run of 10 or more words of learner text appears in the
  book.
  - The longest shared run is 9 words: «proses interaksi peserta didik dengan pendidik dan sumber
    belajar», the statutory definition in UU No. 20 Tahun 2003, attributed as such.
  - Four 8–9-word runs were rephrased before hand-off.
- **Register:** every learner field is asserted free of «kalian», «kamu», «Hebat», «Keren», «pasti
  bisa», «luar biasa», «Selamat», «Ayo», «poin», «lencana», «bintang», «salah» (including «salah
  satu»), «gagal», «bodoh» and «malas». Every lesson addresses the reader as «Anda».
- **Assertions:** 5.955 with `--kutipan` (5.953 without).

## Questions

20 questions: 4 Pemetaan awal, 8 Cek penguasaan (Uji Penguasaan) and 8 Latihan. There are no
misconception codes (out of scope).
- **Answer positions:** A=5, B=5, C=5, D=5. The key is never strictly the longest option.
- **Checks in the generator:** it applies periksa_mutu's STEM_REVEALS_ANSWER, IMPLAUSIBLE_DISTRACTOR
  and CORRECT_OPTION_LENGTH_IMBALANCE rules to each question.
- **Pre-test:** lessons 1, 2, 4 and 5.
- **Post-test:** covers all five lessons. 7 are Sedang and 1 is Sulit (PB8).
- **Question form:** 17 of 20 stems are a situation («Seorang guru…», «Pada akhir pembelajaran…»,
  «Dua guru…»); every post-test stem is. No post-test stem shares an 8-word run with any lesson,
  so the post-test does not reuse a lesson's situation.

| Item | Lesson | What it asks |
|---|---|---|
| PB1 | 1 | Judge a «strategi» document that is not yet carried out: fitting, and check its goal |
| PB2 | 2 | IPS pupils form hypotheses from traffic data: the teacher's role is facilitator (tidak langsung) |
| PB3 | 3 | A new class mid-year: understand the learners' aspects before choosing a strategy |
| PB4 | 4 | A third of the class is below target on a formative test: remediation plus enrichment |
| PB5 | 5 | Two equal classes, one method, two personal styles: taktik, not teknik |
| PB6 | 5 | After choosing tidak langsung, the concrete classroom way: metode |
| PB7 | 4 | Worksheets handed out with no aim stated: the missing first core steps |
| PB8 | 3 | A good goal, but the room and the test do not fit: the system's parts do not support each other |

## Checks

```
$ python3 content/_uji-internal/strategi-pembelajaran/strategi_pembelajaran_bab1.py --kutipan <bab1.txt>,<depan.txt>
StrategiPembelajaran-Bab1.xlsx: lessons 5 (20 pages), questions 20 (pre 4, post 8, practice 8), answers A=5 B=5 C=5 D=5
facts traced: 135 (scan pages 1-22, front matter 4); book-error record 12; lesson sections traced 21
quotations found in the book's text: 134 of 135; figures read by eye: hierarki
longest run of words shared with the book: 9 (lesson 1 isi: «proses interaksi peserta didik dengan pendidik dan sumber belajar»)
assertions passed: 5955

$ npx tsx docs/onboarding/konten/ke-paket.ts …/StrategiPembelajaran-Bab1.xlsx …/StrategiPembelajaran-Bab1.paket.json
$ python3 docs/onboarding/konten/periksa_mutu.py …/StrategiPembelajaran-Bab1.paket.json
questions 20: pre 4, post 8, practice 8; answers A=5 B=5 C=5 D=5; correct option strictly longest in 0
TOTAL: 0 ERROR, 20 WARNING (WEAK_MISCONCEPTION_LINKAGE 20)
```

- **Warnings:** the 20 WEAK_MISCONCEPTION_LINKAGE warnings are the expected ones. Misconception codes
  are out of scope (§6), and the reviewer acknowledges them.
- **The package:**
  - Kursus: Jenjang «Guru», Kelas «Guru», Mata pelajaran «Pengembangan Kompetensi».
  - Konteks: «Pengembangan profesi», which is a value `KONTEKS` accepts in the upload contract.
- **Rebuild:** a second run gives a byte-identical package.
- **Fixed before hand-off:**
  - The generator's copies of the periksa_mutu rules caught four stems that gave away their answer
    (PA1, PB4, PB5, PB7) and four keys that were strictly the longest option (PB8, LT1, LT5, LT6).
  - The verbatim check caught one 10-word run in lesson 4; I rephrased it.
- **Nothing else touched:** nothing outside this folder changed, so the existing generators are
  untouched.

## Book errors and inconsistencies

None is copied into the workbook; `DILUAR` markers assert that the wording is absent.

1. **p. 3: the law reference** is «UU No. 20/2003, Bab I Pasal Ayat 20», with the article number
   missing. The lesson cites only «Undang-Undang No. 20 Tahun 2003».
2. **p. 5: «8) Ciri-ciri Pembelajaran»** is listed as a component of learning. It is not one, and
   nothing follows it. The lesson lists seven components.
3. **p. 18: the model definition.**
   - The book attributes it to «Dewey dalam Joyce dan Weil (1986)», but the definition is Joyce and
     Weil's own.
   - The Indonesian rendering adds content the English lacks: «tutorial setting» becomes «di luar
     kelas», and «to shape instructional material» becomes «menambahkan materi pengajaran».
   - Lesson 5 translates from the English line on the same page («di kelas maupun dalam tutorial …
     membentuk bahan ajar») and drops the Dewey attribution.
4. **p. 14: «delapan unsur pokok»,** but p. 15 lists three (interaktif, inspiratif, menyenangkan),
   and the article quoted on p. 3 names more. The lesson gives the qualities without a count.
5. **p. 3 and p. 14: PP No. 19 Tahun 2005 is cited as current.** See question 1 below.
6. **p. 19: «Kurikulum Tingkat Satuan Pendidikan»** is presented as current. It is kept out.
7. **Tabel 1.1 is numbered twice:** p. 5 (Konsep dan Sudut Pandang) and p. 21 (Perbedaan Metode
   dan Strategi). The diagram on p. 18 has no number, and the similar one on p. 20 is Gambar 1.2.
8. **Names:**
   - p. 10: «Seaman dan Fellnz (1989)» should be Fellenz; the names are kept out.
   - p. 9: «Saskatchewan Educational (1991)»; the lesson says «klasifikasi Saskatchewan (1991)».
   - p. 22: «Abddul Majid» should be Abdul Majid.
9. **Repeated text:**
   - p. 4 repeats a paragraph of p. 3, and then its own lines, with «psikomoto r».
   - p. 12 repeats a clause («menyenangkan ini harus diciptakan mulai dari awal pembelajaran»).
   - p. 13 repeats «siswa melihat bahwa materi», and «tidak berdiri» lacks «sendiri».
10. **Naming across chapters:** section B calls the fourth group «melalui pengalaman (experiential
    learning)», while the Bab 2 title in the Daftar Isi calls it «Empirik». Lesson 2 uses the Bab 1
    name; LANA-23 will reconcile the two.
11. **Typos:**
    - p. 1: «Definisi Starategi» (also p. 3: «starategi»), «yann», «pennting»;
    - p. 2: «stratçgos», and «designed to achieves»;
    - p. 8: «menentepkan», «etode; dan tekhnik»;
    - p. 9: «jeni-jenis», «dikemukaan», «digunakana», «demostrasi», «strateggi»;
    - p. 11: «saran atau tujuan» (sasaran), «kurikulerr», «sebgai»;
    - p. 18: «taching»;
    - p. 21: «antra»;
    - p. 22: «diatikan», «sekalkigus».

## Questions for the coordinator

1. **Lesson 4 on PP No. 19 Tahun 2005.** The regulation has since been replaced (PP 57/2021,
   amended by PP 4/2022); this is outside the book, so I have not written it into the lesson.
   - Lesson 4 attributes the qualities to the book's citation and adds one sentence: «Buku ini terbit
     tahun 2019; periksa rumusan standar proses yang berlaku saat ini.»
   - The first half traces to the colophon. The advice is mine.
   - Keep that sentence, or drop it?
2. **Page citations.** They refer to the manuscript scan, not the print, which is what I had; the
   Daftar Isi mapping is above. Is that enough for the gate, or do you want the print pages?

## Round 2 (coordinator's review of `29f1094`)

**What stayed:** stems, keys and answer positions are unchanged (A=5, B=5, C=5, D=5). Every new
option names its fact and has its own Alasan.

**Required: eight Uji Penguasaan distractors rewritten.** Each is now a move a teacher might really
make, which the chapter rules out.

| Option | Now | Ruled out by |
|---|---|---|
| PB3 A | Reuse the old class's strategy and adjust it after a few meetings | `aspek_1`: understand the learners first |
| PB3 C | Choose the strategy mainly from last semester's report grades | `aspek_3`: achievement is one aspect of twelve |
| PB4 D | Give those below target the same test again, without re-teaching | `formatif_kurang`: they re-study first |
| PB7 A | Show the material's use before handing out the worksheet | `manfaat`: an opening move; it does not say what or how |
| PB7 B | Ask about last week's material to link it to the worksheet | `materi_lalu`: an opening move; it does not state the aim |
| PB8 A | Switch the method to lecture to fit the room; keep the goal and test | `organisasi`: one component changed, the test still misses the goal |
| PB8 C | Rewrite the goal as recall to match the existing test | `roh`: the goal comes first; evaluation measures it |
| PB8 D | Rearrange the seats now and fix the test next semester | `kriteria_tes`: evaluation is a component now |

PB8, the only Sulit item, now asks the reader to choose between four single-component fixes and
the system view.

**Optional, taken: the absolute check.**
- `MUTLAK` lists 10 absolutes: «apa pun», «satu-satunya», «sama persis», «sama sekali», «hanya»,
  «selalu», «pasti», «tentu», «tidak perlu» and «menjamin».
- The generator asserts that no distractor carries one of them unless the key also does.
- The check flagged four more options, which I rewrote the same way:
  - PB1 B: sources belong in a separate part of the plan (`dua_ciri`);
  - PB5 D: the way discussions open reflects each teacher's plan, so it is strategy
    (`sifat_tujuan`);
  - PB7 D: explain everything first, then use the worksheet as reinforcement (`tidak_dominasi`);
  - LT1 A: pembelajaran is about outcomes and pengajaran about process (`satu_pihak`).

**Optional, taken: the Latihan options.**
- LT1 B: «keduanya bermakna sama; pembelajaran adalah sebutan yang lebih baru untuk pengajaran».
- LT5 D: wait a few weeks, since changes in teenagers often pass on their own.
- LT7 A: the core stage is the real lesson, and the opening and closing are extras.
- LT7 D: the time for each stage is fixed in the RPP and not changed during the lesson.

**Your answers:**
- Lesson 4's sentence stays exactly as written.
- Scan pages stand.

**Gate after round 2:**
- 6.155 assertions with `--kutipan` (6.153 without); 134 of 135 quotations found (`hierarki` read
  by eye).
- Verbatim is still at most 9 words.
- periksa_mutu is 0 ERROR, with the 20 acknowledged WEAK_MISCONCEPTION_LINKAGE warnings.
- The package rebuilds byte-identically.
- Against `29f1094`, the package differs in exactly the 16 options listed above, in their text and
  their Alasan. No other field changed.
