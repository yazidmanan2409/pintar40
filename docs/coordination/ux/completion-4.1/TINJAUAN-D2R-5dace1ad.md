# D2-R · Recheck at the final head (Daisy, 24 Nov 2026)

> **What holds now:**
> - **§9, §10 and §11 PASS as written. 1f's C-1 is closed.**
> - **One finding for a decision, H-1, rated Significant:** the Hasil Belajar row and its print still show the percentages, which the result page withholds.
> - **§12 (the certifying C line)** is not on this head yet, as expected.
> - **Read:** a local build of `claude/d2r` at `5dace1ad`, with a fresh database reset and a fresh synthetic report world.
>   - **Learner:** one (5B) with «Lulus» in Bab 2, at 75 % with one section below the mark, and «Belum lulus» in Bab 1.
>   - **Teacher:** filed two test reports.
>   - **Widths:** 1280, 390 and 320. 0 px sideways overflow everywhere.
> - **Captures:** `d2r-layar-5dace1ad/`.

## 1 · What holds

| Check | Seen |
|---|---|
| **Pass, before issue** (`d2r2-lulus-sebelum-terbit-390`) | «Lulus.» + its line → «Sertifikat Anda sedang disiapkan.» → «Lihat sertifikat» → «Baca lagi:» (one section) + the §6 note → «6 dari 8 soal dijawab tepat · Kesempatan ke-1» → the §8 line. No retake line, and no `disiapkan.arti`. This is §9 exactly |
| **Pass, after issue** (`d2r2-lulus-sesudah-terbit-390`) | The same, with «Lihat sertifikat» alone |
| **Not passed** | Unchanged from 1f, and correct |
| **Hasil Belajar row** | «Lulus. Lihat sertifikat» is the link only. Section B marks «baca lagi», and section A's summary reads «Ada 4 bagian yang disarankan untuk dibaca lagi; semuanya ditandai «baca lagi» di bagian B.» This is §11 |
| **Support, ordinary** (`d2r2-lapor-biasa-320`) | «Langkah berikutnya: Laporan ini sudah tersimpan. Admin sekolah Anda dan tim PINTAR dapat membacanya.» |
| **Support, stops a class** (`d2r2-lapor-kelas-390`) | «… ditandai menghentikan kelas. Admin sekolah Anda dan tim PINTAR melihat tanda itu, dan laporan ini tampil lebih dulu di antara laporan yang belum ditangani.» There is no time promise anywhere. This is §10 |

## 2 · H-1 · The summary shows the figures that the result page withholds (Significant; decision needed)

- **Seen:** on certifying rows, the Hasil Belajar row and its print read:
  - «Uji Penguasaan: 63%. Pemetaan Awal: 25%. Target bab ini: 70%.» and «… 75% … 50% …»;
  - «Penguasaan Anda pada Pemetaan Awal dibandingkan dengan Uji Penguasaan.»
- **Why it matters:** this is the same learner and the same result, one page apart. The result page deliberately shows no mastery figure and no comparison (R-h order; D2R-H08, which I confirmed at 1f). The summary prints both, and the print is the page that goes home. Ruling 79's second question («does it work with everything around it?») fails. The learner, or a parent, reads the figure on one page that the result page withholds.
- **Recommendation:** on certifying rows (Lulus or Belum lulus), drop the three percentages and the comparison line. Show the verdict, «{b} dari {t} soal» and the target as the result page does, which is no target figure. Non-certifying rows are unchanged.
- **The decision is Bob's, with Sharon.** It is the row-level twin of Sharon's open question on `learning_delta`'s `akhir`. Whatever she rules there should hold here too.
- **My own miss:** §3's line «the counts line is unchanged» did not name the percentages, so the builder had no instruction about them.

## 3 · Notes (not blocking)

- **N-22 · «Lihat sertifikat» prints as words in the PDF.** A link label means nothing on paper. In print, hide it, or print the certificate number instead.
- **N-23 · Same page, two words for one verdict.** The summary says «1 dari 2 bab yang selesai sudah mencapai target» and «Sertifikat bab yang targetnya tercapai …», while the rows say «Lulus». This is ledger L-33 (Lulus against tercapai), now seen on one learner page. It stays with the audit's L-33 row, not D2-R.
- **§12** (`hasilbelajar.berikutnya_baca_lagi`): section C still reads «… ditandai «pelajari lagi» …» on this head. I'll read it on the head that carries the string.

## 4 · Anticipation

**DAISY-D2R-1:** §3 said «the counts line is unchanged» without saying which figures a certifying row may show, so H-1 came from my underspecification. The lesson: when I withhold something on one surface, list every other surface that shows the same figure.
