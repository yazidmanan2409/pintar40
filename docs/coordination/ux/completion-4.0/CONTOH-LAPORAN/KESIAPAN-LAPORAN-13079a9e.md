# Reporting presentation re-verification (Daisy, 9 Nov 2026)

**Commit reviewed:** `claude/awesome-rubin-bqxp6p` at **`13079a9e`**. I only read that branch. My previous report was on `94160304` (`ef7e01b8`).

**Evidence:** `verifikasi-13079a9e/`. Screenshot names refer to `laporan/<reader>-<page>-<width>.jpg`; a name without a width covers 1280, 390 and 320.

## How this was verified

1. The stack was rebuilt from nothing (`supabase db reset`), then `laporan-lokal.mjs` (7 classes, 66 learners, 166 sittings).
2. `next build` and `next start -p 3999`.
3. `audit/laporan-jalan.mjs`: **120 views, all HTTP 200, none scrolls sideways** (`laporan/`, with `laporan-jalan.json` holding each page's text).
4. `audit/siap-jalan.mjs`: **8/10 PASS, 2 NOT EXERCISED, 0 FAIL** (`temuan/siap-jalan-ringkasan.json`).
5. R9's refusal pressed again at each width (`temuan/`).

**Recalculation (E1), staged by me:** the world has no recalculated sitting, so I staged one, local and synthetic.
- **The sitting:** Adi Hidayat's latest 5B Uji Penguasaan, sealed at 12.5% (1 of 8 correct).
- **The new row:** an `assessment_results` row superseding it, mastery 25%, reason «ANSWER_KEY_CORRECTED (Daisy local fixture)». It was inserted with triggers off.
- **Not changed:** the answers' own marking.
- **What I looked at afterwards** (`dihitung-ulang/`, script `alat/vE1.mjs`): the teacher's learner page, the Ringkasan Kelas and «Lihat bukti» for 5B, and the learner's own result pages.

## Verdicts

| # | Item | Verdict |
|---|---|---|
| 1 | N1, the decision sentence on «Lihat bukti» | **READY** |
| 2 | N2 / Decision 7, «not yet» versus withheld | **READY** in the states. **NOT READY** on one pointer (A2) |
| 3 | N3, the statement under every short title | **READY** on «Lihat bukti» and Ringkasan Kelas. **NOT READY** in the Pimpinan grid at 390 and 320 px (A3) |
| 4 | N4, a grid with no readable target | **READY** |
| 5 | School page (Admin) | **NOT READY:** a vacuous «Soal wajib 100%» (A1) and «atau» reasons (A5) |
| 6 | Kenaikan wording | **READY** with one change suggested (§6) |
| 7 | Withheld states (Kenaikan pair, misconceptions) | **READY** |
| 8 | Further items | Chapter result, «Per kelas» and Temuan padding **READY**. The count in «Yang menunggu» is **NOT READY** (cosmetic) |
| 9 | E1, learner and teacher consistency | **READY** on the teacher's side, with two improvements. **One question for Second Eye** and **one for the owner** (§9) |
| 10 | English | **NOT READY:** three copy errors (A4) |

**Accuracy findings.** Each is a figure or sentence that does not say what the evidence says:

| # | Finding | Where | Smallest correction |
|---|---|---|---|
| **A1** | **«Soal wajib 100% · Dari 51 murid yang mengerjakan Uji Penguasaan»** on the school page. Neither world chapter has a required question (0 of 18 each; only «Pecahan Senilai» has 2). So 50 of the 51 «passed» a gate their test did not contain. The learner's own chapter page now says «Uji ini tidak berisi soal penting yang wajib dijawab tepat» for the same sittings, so the two modules contradict each other | `admin-sekolah` (B); `murid-hasil-bab` | Count only sittings whose test has a required question. If none has one, say «Belum ada Uji Penguasaan yang berisi soal wajib.» rather than a percentage. This is Second Eye's to confirm in `institution.safety_gate_pass_rate`; the class bands («…atau soal wajib belum tepat») are unaffected |
| **A2** | **«3 dari 8 topik masih di bawah target»** on 5C, where only 4 of the 8 topics have a figure; the other 4 are «Belum cukup data: 3 murid; perlu 5». The denominator counts topics with no figure, so a reader concludes that 5 are fine | `guru-ringkasan-5C`, `guruEn-ringkasan-5C` («3 of 8 topics») | «3 dari 4 topik yang punya angka masih di bawah target; 4 topik lain belum cukup data.» |
| **A3** | **The Pimpinan grid at 390 and 320 px.** The statement sits in a column about 115 px wide: a row becomes 6–10 lines, and «membandingkan,» runs into «50%» with no gap. At 320 px the second class column is cut at the frame's edge (the region scrolls, the page does not) | `kadepIpa-pimpinan-390`, `-320`; `kadep-pimpinan`, `dekan-pimpinan` | Below 640 px, give the topic cell the full row width (title, then the statement on its own line), with the values on the row beneath. Or keep the title alone in the cell and put the statement in the row's accessible description, shown on tap. At 1280 px the grid is fine |
| **A4** | **English copy says something else:** | | |
| | (a) «You answered 3 of 8 questions» means 3 attempted. The Indonesian «Terjawab tepat 3 dari 8 soal» means 3 correct | `muridEn-hasil-bab`, `siklus.tepat_dari` (`hle.ts:4183`) | «Correct: 3 of 8 questions» |
| | (b) «Calculated from 36 pairs of a **Pre-assessment** and a Mastery Check…», then «The average **Initial Mapping** → …» in the same section. Two names for one test | `guruEn-ringkasan-5B`, `laporan.komposisi.kenaikan_dari_pasangan` (`hle.ts:2705`) | «Initial Mapping» |
| | (c) «1 learners», «1 students so far» | `guruEn-bukti-5B`, `dekanEn-pimpinan` | Singular forms |
| **A5** | **The school page gives reasons joined by «atau»** where PINTAR knows which applies. «Matematika · Angkatan 5 · 2026/27: belum ditampilkan — kurang dari 5 murid, **atau** ada kelas di dalamnya yang mengerjakan suatu bab dengan terlalu sedikit murid». The cohort has some 35 learners, so the first reason is not the true one. Section A likewise: «…kurang dari 10 murid, **atau** di salah satu kelas…». The reader has to guess what is uncertain | `admin-sekolah` | Name the reason that applies: «belum ditampilkan: ada kelas di dalamnya yang mengerjakan suatu bab dengan kurang dari 5 murid». Naming the reason, without the class or chapter, discloses nothing more |
| **A6** | **Screen readers hear the wrong thing in section B.** The chapter row reads «57% · 22 murid **di bawah target**»: the hidden words follow the count, so a screen reader says that 22 learners are below target. In English: «62% · 22 students below target» | `KomposisiKelas.tsx:352`; every Ringkasan Kelas with chapters | Put the `pin-sr` words directly after the percentage: «57% di bawah target · 22 murid» |
| **A7** | **«Hasil tiap bab yang sudah cukup ada di «Per bab»»** points to a heading that is not shown anywhere. Section B introduces the chapters with «Setiap bab, terpisah:», and «Lihat bukti» has no chapter list at all | `guru-bukti-5C`, `guru-ringkasan-5C` | Show `metrik.bab.label` («Penguasaan per bab») as the visible name of section B's chapter list. From «Lihat bukti», point to «Ringkasan Kelas, bagian B (Penguasaan per bab)» |

## 1. N1: the decision sentence on «Lihat bukti»

**READY.** «PINTAR menunjukkan; langkah berikutnya Anda yang memutuskan.» appears once, as the first line of Kesimpulan, on 5B and 5C (`guru-bukti-5B`, `guru-bukti-5C`). In English it reads «PINTAR shows; you decide the next step.» (`guruEn-bukti-5B`).

## 2. N2 / Decision 7: «not yet» versus withheld

**The three states are told apart, and only the right one appears in each place:**
- **Not enough** (5D, 4 learners): «Belum cukup data untuk menampilkan angka ini. Sekarang 4 murid; perlu 5.» throughout. Pemahaman says the same plus «ada bab yang baru dikerjakan kurang dari 5 murid» (`kadep-ringkasan-5D`).
- **Withheld** (5C, 7 learners; Bab 2 has 3): «Angka gabungan ini tidak ditampilkan agar hasil bagian yang dikerjakan sedikit murid tidak dapat dihitung darinya. Sudah 7 murid mengerjakan Uji Penguasaan; ada bab yang baru dikerjakan kurang dari 5 murid. Angka ini muncul setelah setiap bab dikerjakan cukup murid.» (`guru-bukti-5C`).
- **«Belum ada bukti»** appears only on 5E (nobody sat) and for «Sertifikat terbit» (none issued yet).

**Is withheld clear, and clearly different from «not enough»?** Yes. It says how many have sat, why the figure is held back, and when it will appear. Three words slow a first-time reader:
- «angka **gabungan**»: say «Pemahaman kelas ini»;
- «hasil **bagian**»: here it means a chapter; «bagian» is also the report's word for sections and for topics;
- the pointer to «Per bab» (A7).

**Suggested two sentences** (for Dr Gladys):

> «Pemahaman kelas ini belum ditampilkan: Bab 2 baru dikerjakan 3 murid, dan hasil mereka dapat dihitung dari angka gabungan. Hasil Bab 1 ada di Ringkasan Kelas, bagian B.»

## 3. N3: the statement under every short title

- **«Lihat bukti» «Penguasaan per bagian»:** **READY.** The title, then the statement, then the bar, at every width (`guru-bukti-5C-320`). C: the values still print without «%» («21», «43»).
- **Ringkasan Kelas A:** **READY,** as on `94160304`.
- **Ringkasan Sekolah A:** every row is withheld in this world, so no title or statement is shown. «tujuan pembelajaran» replaces «ranah» in every sentence (`laporan.sekolah.*`).
- **The Pimpinan grid** (Matematika head, Dekan, IPA head): **READY at 1280 px. NOT READY at 390 and 320 px** (A3).

## 4. N4: a grid with no readable target

**READY.** On IPA, «Bu Ratna» reads «Setiap sel adalah angka «Penguasaan per topik» kelas itu sendiri.» with no «terhadap target». There is no target line, no amber, no lead sentence, and the key «Belum ada target kelas yang dapat dibaca di sini, jadi tabel ini tidak menandai angka di bawah target. Tanda — berarti data belum cukup.» (`kadepIpa-pimpinan`).

The Matematika head keeps the target sentence, the line and the lead (`kadep-pimpinan`). The Dekan's mixed grid (targets readable in 5B–5F, not in 5G and 5H) says «…against that class's target where its target can be read… only in classes whose target can be read; elsewhere no figure is marked as below target», which is exact (`dekanEn-pimpinan`).

**C:** with no target, IPA's grid has no lead at all. A neutral one would still give the 60-second answer without comparing to a target: «Yang paling rendah di kedua kelas: Rata-rata Sederhana (28% dan 53%).»

## 5. School page (Admin)

- **Section A:** **READY (E2).** One sentence: «Sudah ada hasil untuk 10 tujuan pembelajaran, tetapi belum ada yang dapat ditampilkan…». It is long; see A5.
- **Kenaikan:** **READY.** «Angka gabungan ini tidak ditampilkan… Sudah 50 murid punya Pemetaan Awal dan Uji Penguasaan; ada kelas yang baru punya kurang dari 5 murid seperti itu.»
- **«Angkatan tidak tercatat saat Uji Penguasaan · 6 murid · 65%»:** **READY.** A row of its own, never placed under today's structure.
- **«Soal wajib 100%»:** **NOT READY** (A1).

(`admin-sekolah`)

## 6. Kenaikan wording

**Seen:** «Rata-rata selisih penguasaan sebelum dan sesudah pembelajaran, dihitung per murid per bab: murid yang mengerjakan dua bab dihitung dua kali.», then «+31 poin · Dihitung dari 36 pasangan Pemetaan Awal dan Uji Penguasaan bab yang sama, milik 22 murid.» (`guru-ringkasan-5B`).

**Understandable? Mostly.** The «pasangan» line is clear, because it says what a pair is. But «**dihitung dua kali**» reads like a counting error to a teacher. Suggested:

> «…dihitung per bab: murid yang mengerjakan dua bab memberi dua pasangan.»

«Dari 22 murid · minimum 5» on «Lihat bukti» and «36 pasangan… milik 22 murid» on Ringkasan Kelas agree.

## 7. Withheld states

**READY.**
- **5C Kenaikan:** «+34 poin · Dihitung dari 10 pasangan … milik 7 murid. Rata-rata sebelum dan sesudah tidak ditampilkan: bersama angka per bab, keduanya dapat membuka hasil sekelompok kecil murid. Kenaikan di atas tetap dihitung dari semua pasangan.» (`guru-ringkasan-5C`).
- **Misconceptions:** «7 pola lain ada di «Lihat bukti».» and «3 pola lain baru dialami kurang dari 5 murid, jadi belum ditampilkan sebagai pola kelas.» on 5B. On 5G: «14 pola lain baru dialami…» (`kadepIpa-ringkasan-5G`). The two lines say two different things (more patterns elsewhere; patterns too rare to show), and they read that way.

## 8. Further items

| Item | Verdict | Evidence |
|---|---|---|
| Chapter result | **READY** | «Uji ini tidak berisi soal penting yang wajib dijawab tepat.» (`murid-hasil-bab`). It contradicts the school's «Soal wajib 100%» (A1) |
| Pimpinan «Per kelas» | **READY** | «5A · Sudah ada yang mengerjakan; angkanya belum dapat ditampilkan», the same for 5D, and «5E · Belum ada angka». It now agrees with the grid (`kadep-pimpinan`) |
| «1 murid» in «Yang menunggu» | **NOT READY (cosmetic)** | The words are no longer glued, but at 390 and 320 px the «1» now stands on a line of its own above the link, like a list marker (`admin-persiapan-390`, `-320`). The number should start the link's first line |
| Temuan padding at 390 px | **READY** | The cards now have inner padding at 390 and 320 px (`temuan/r9-layar-390`) |

## 9. E1: learner and teacher consistency

**What each person sees** (`dihitung-ulang/`):

| | Teacher (`guru-murid`) | Learner (`murid-bab-1`, `murid-hasil`) |
|---|---|---|
| The figure | «Cek penguasaan — … Bab 2 · **25%** · di bawah target · target 70%» | «Penguasaan **13%** · Terjawab tepat 1 dari 8 soal» |
| The note | «Hasil sesi ini dihitung ulang setelah disegel. Laporan memakai hasil terbaru (25%); sertifikat dan halaman hasil murid tetap memakai hasil asli yang disegel (13%).» | none (sealed contract) |

**Is the difference understandable to the teacher? Yes.** The note names both numbers and says which page shows which, so a teacher can explain it if the learner's page differs. **Two improvements, wording only:**
1. **Put the note right under the 25%.** Mark the figure itself («25% · dihitung ulang»). Today the note comes after «Minta membaca lagi», in the smallest type, and at 390 px it reads as a footnote to the link.
2. **Say why.** `recomputation_reason` exists. «…dihitung ulang setelah disegel, **karena kunci jawabannya diperbaiki**…» tells the teacher it is a correction, not a re-marking of the learner.

Shorter, as the Visual Intelligence grammar asks:

> «Dihitung ulang setelah disegel (kunci jawaban diperbaiki). Laporan memakai 25%; murid dan sertifikatnya tetap melihat 13%.»

**For Second Eye (data, not wording):** on the same teacher's Ringkasan Kelas, section E still says «Adi Hidayat (5B) · **1 dari 8 soal tepat**», next to his 25% (2 of 8). My staging changed only the result row, not the answers' marking, so this may come from my setup. The question is: after a real key correction, do «x dari 8 soal tepat» (section E), «Lihat per soal» and «Tujuan pembelajaran yang belum tercapai» follow the recalculated marking? If they do not, the teacher sees two different scores for one sitting. If they do, the teacher's list of objectives to restudy can differ from the learner's «Pelajari lagi», which follows the sealed result. In that case the note should also say: «Daftar tujuan di bawah memakai hasil terbaru.»

**For the owner (not changed; escalation only):** the learner sees no sign that anything changed. If a teacher says «nilaimu 25%» and the learner's page says 13%, the learner cannot reconcile them. One option leaves the sealed result and certificate untouched: a neutral line on the learner's own result, «Gurumu dapat melihat hasil yang dihitung ulang untuk uji ini.» That would change what the learner page shows, so it is the owner's decision under the sealed-result contract. I have not proposed it to engineering.

## 10. English

**NOT READY** (A4).

**Otherwise consistent:** «Class summary», «Mastery by topic», «Strong / Developing / Needs strengthening», «Gain», «Initial Mapping», «Mastery Check», the refusal page, and the grid key with partial targets.

**Indonesian by design** (content, not interface): assignment titles («Pemetaan awal — …», «Cek penguasaan — …»), short titles, statements, misconception names and their remedies.

**C:** «students» and «learners» alternate within one section («24 learners in this class · 22 have taken…», «Results of the 22 students…»).

## 11. Educational usefulness for a first-time educator

Ringkasan Kelas 5B and 5C, «Lihat bukti» and the school page, read as someone opening PINTAR for the first time:

| Question | Answered? | Where it falls short |
|---|---|---|
| What does the report establish? | **Yes.** The lead gives the count and the lowest topic; Kesimpulan gives the class figures | A2's denominator overstates what is established on 5C. A1's 100% establishes nothing |
| What evidence is there? | **Yes.** «24 murid di kelas ini · 22 sudah mengerjakan · 2 belum», «Dari 22 murid · minimum 5», «36 pasangan… milik 22 murid» | — |
| Why is a figure withheld? | **Yes,** and it is told apart from «not enough» | «Angka gabungan», «bagian», and «atau» reasons where one is known (A5) |
| What remains uncertain? | **Partly.** «Pita… dari bab mana pun», «Bukan batas ketuntasan sekolah», and the 59,5% kept with its decimal at the band edge are honest | The decimal is not explained. A one-off «(belum dibulatkan: dekat batas 60%)» would make the precision read as intended |
| Where to look next? | **Yes.** O1's lines and «Apa berikutnya» name places | A7: «Per bab» names a heading that is not shown |

**On grammar:** the withheld explanations have grown to three or four sentences each (5C Pemahaman; school A). The Visual Intelligence grammar is one sentence for what is shown, plus where to look. The suggestions in §2 and A5 keep that: one sentence for the reason, one for where.

## What I did not see

- **Staging.**
- **NVDA / TalkBack.** A6 is read from the order of the hidden text, not heard.
- **The A4 print.**
- **PD reports.**
- **A real recalculation** (a corrected answer key). E1 was judged on my staged result row, and §9's question is open.
- **Ringkasan Sekolah A with visible rows:** every competency is withheld in this world.
- **Numerical integrity.** A1's premise (no required questions in either chapter) I checked in the database; the calculator is Second Eye's.
- **The owner's acceptance.**
