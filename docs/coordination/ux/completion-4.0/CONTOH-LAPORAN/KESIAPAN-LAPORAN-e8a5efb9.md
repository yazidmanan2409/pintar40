# Presentation, accessibility and comprehension re-verification (Daisy, 9 Nov 2026)

**Commit reviewed:** `claude/awesome-rubin-bqxp6p` at exactly **`e8a5efb9`**. I only read that branch. My previous report was on `13079a9e` (`ffb91e3b`); the dispositions are in matrix §13.

**Evidence:** `verifikasi-e8a5efb9/`. Screenshot names refer to `laporan/<reader>-<page>-<width>.jpg`.

## How this was verified

1. The stack was rebuilt from nothing (`supabase db reset`), then `laporan-lokal.mjs`.
2. `next build` and `next start -p 3999`.
3. `audit/laporan-jalan.mjs`, its readers and its widths: **120 views, all HTTP 200, none scrolls sideways** (`laporan/`).
4. The same walk with `CEK=1` at 1280 px: axe (WCAG A/AA), the accessibility-tree snapshot of the chapter rows, the shell in print, and an A4 PDF of each of the 40 pages (`cek-1280/laporan-jalan.json`; the grid and 5C PDFs are in `cetak/`).

**D14, through the real path.** On this world, after both walks (`alat/vD14.sql`, local only):
1. I **corrected the answer key** of one question that Gita Wibowo (5B) had answered wrongly. That one content write was done with triggers off.
2. A platform **SYSTEM_ADMIN** ran **`recompute_result`** on her Bab 2 Uji Penguasaan, with the reason «Kunci jawaban satu soal diperbaiki».
3. **The result:**
   - a successor result of 25% against the sealed 12.5%;
   - `per_domain` re-scored;
   - one `assessment_result.recomputed` audit row.
4. Her teacher's and her own pages were then captured at 1280 and 390 px (`dihitung-ulang/`, script `alat/vE1.mjs`).

## Answers

| # | Item | Answer |
|---|---|---|
| 1 | A1/A2, D13 (5C) | **Confirmed** for the class. **One finding** on the school's gate (B1) |
| 2 | A3, stacked grid; A4 print | **Confirmed** |
| 3 | A4, English | **Confirmed**, with one plural left and one term mix (§3) |
| 4 | A5, reasons on the school page | **Confirmed** |
| 5 | A6, accessibility tree | **Confirmed** in the tree. NVDA and TalkBack are not available to me |
| 6 | A7, navigation references | **Confirmed**, except one reference (B2) |
| 7 | «Yang menunggu» | **Confirmed** |
| 8 | D14 | Teacher's note **confirmed**, one ordering suggestion. Learner's notice: tone and position **confirmed**, but the page **contradicts its own figure** (B3) |
| 9 | Kenaikan wording | **Confirmed** |
| 10 | `#487A6F` for «Berkembang» | **Confirmed** |
| 11 | «2 di antaranya…» | **Confirmed** |

**Findings:**

| # | Finding | Page, width, reader | Evidence | Smallest correction |
|---|---|---|---|---|
| **B3** | **The learner's chapter result contradicts its own figure after a recalculation.** It reads «Penguasaan **13%** · Terjawab tepat **2 dari 8** soal», then the notice. The 13% is the sealed result; «2 dari 8» counts her answers against **today's** key, which is 25%. «Hasil belajar» shows the same pair («2 dari 8 soal … Uji Penguasaan: 13%»). So does the per-question «Tinjau kembali», where the corrected question now says «Sudah tepat». The count is `benar = review.filter((r) => r.benar === true).length` (`src/app/belajar/[tugas]/hasil/page.tsx:77`), marked live | Chapter result, Hasil belajar; 1280 and 390; the learner | `dihitung-ulang/murid-bab-1-390`, `murid-hasil-390` | **For the owner (the sealed contract), not a wording change.** Either the learner's count and per-question review are read from the sealed scoring («1 dari 8»), or the page says plainly which one has changed. I would keep everything the learner sees sealed, because the notice already says «Hasil yang Anda lihat di sini … tidak berubah». As it stands that sentence is not true of the count |
| **B1** | **The school's gate hides that it does not apply to most sittings.** It reads «Soal wajib · Belum cukup data untuk menampilkan angka ini. Sekarang **1 murid**; perlu 10.», beside «Peserta 52». Only one sitting (the demonstration «Pecahan Senilai») has a required question; the other 51 are not applicable. The text is true of the one applicable sitting, but a principal reads that one learner sat. D12 says a shown gate states how many sittings were not applicable; the withheld state does not | Ringkasan Sekolah, 1280, Admin sekolah | `laporan/admin-sekolah-1280` (B) | Add the same count to the withheld state: «Tidak berlaku untuk 51 murid: ujinya tanpa soal wajib. Dari Uji Penguasaan yang berisi soal wajib, baru 1 murid; perlu 10.» |
| **B2** | **A pointer to a section that is not there,** for a reader who cannot go there. Ringkasan Sekolah ends «Di PINTAR: Pimpinan › «Kesiapan bukti» menyebut kelas yang buktinya belum cukup.» The Pimpinan page has no «Kesiapan bukti» section (`kadep-pimpinan`, `dekan-pimpinan`). The Admin sekolah reading the summary is refused /pimpinan (`admin-tolak-pimpinan`). The school page's own section D is «Kesiapan bukti» | Ringkasan Sekolah, all widths, Admin sekolah | `laporan/admin-sekolah-1280` (E) | «Bagian D di atas menyebut kelas yang buktinya belum cukup.» |

## 1. A1/A2, D13

**Ringkasan Kelas 5C** (`guru-ringkasan-5C`, `guruEn-ringkasan-5C`) reads «4 dari 4 topik yang punya angka masih di bawah target. Yang paling rendah: Pola Berkurang (29%). Semua topik ada di daftar di bawah. 4 topik lainnya belum dapat ditampilkan, jadi belum diketahui apakah sudah mencapai target.»
- The withheld topics have their own sentence, and it says what is unknown.
- «Semua topik sudah mencapai target» appears on none of the 120 views.
- In this draw, all four shown topics are below target, so I could not see «Semua topik … yang punya angka sudah mencapai target» beside withheld rows.

**The school's gate:** B1.

## 2. A3: the stacked grid, and the A4 print

**At 390 and 320 px** (`kadep-pimpinan-390`, `kadepIpa-pimpinan-320`, `dekan-pimpinan`), the grid reads as approved:
- one block of class bases and targets first;
- then one block per topic: title, statement, and each class with its figure, target mark and bar, or «—».

It is readable at both widths, nothing is cut, and there is no sideways scroll inside the page.

**C:** on the Matematika head's grid, 5A, 5D and 5E have no figure in any topic, so «—» repeats in all eight blocks (24 rows). Once the base block says «Sekarang 1 murid; perlu 5», those classes could be left out of the topic blocks and named once: «5A, 5D, 5E: belum cukup data».

**A4** (`cetak/kadep-pimpinan.pdf`, `kadepIpa-pimpinan.pdf`, `dekan-pimpinan.pdf`): the print gives **the table**, not the stacked blocks. The column heads repeat when the table runs onto the next page, and the shell does not print (`cetakKulit` is empty on all 40 pages). **C:** the Kepala departemen's print ends with a page holding only the «Lihat lebih rinci» button. Interactive controls could be left out of print.

## 3. A4: English

**Seen:**
- «Initial Mapping» throughout, with no «Pre-assessment» in any of the English views;
- «Answered correctly: 1 of 8 questions» (`muridEn-hasil-bab`);
- «1 student so far; 5 needed» (`dekanEn-pimpinan`);
- «counted per pair of a student and a chapter: a student who took two chapters gives two pairs».

**Remaining:**
- **«NOT YET ATTEMPTED 1 learners»** on «Lihat bukti» (`guruEn-bukti-5B`), from `mengajar.bukti.murid` (`hle.ts:5989`, `en: "learners"`, used after the count with no singular).
- **«students» and «learners» still alternate,** about 30 of each across the English views, sometimes in one section («24 learners in this class · 22 have taken…», «Results of the 22 students…»). One term is a glossary decision (Dr Gladys); I would use «students», which the newer copy already uses.

## 4. A5

**Confirmed** (`admin-sekolah`). «Sudah ada hasil untuk 10 tujuan pembelajaran, tetapi belum ada yang dapat ditampilkan. 2 di antaranya masing-masing dikerjakan kurang dari 10 murid. 8 di antaranya di salah satu kelas dikerjakan terlalu sedikit murid, sehingga hasil kelas itu dapat terbaca dari angka sekolah.»

The Matematika Angkatan row gives its one reason: «…ada kelas di dalamnya yang mengerjakan suatu bab dengan terlalu sedikit murid…». «Angkatan tidak tercatat saat Uji Penguasaan · 6 murid · 50%» stands as its own row.

## 5. A6

**Confirmed in the accessibility tree** (Playwright `ariaSnapshot`, `cek-1280/laporan-jalan.json`, `pohonBab`). In Ringkasan Kelas 5B:
- listitem «Matematika Kelas 5 · Bab 1: Pola Bilangan 56% (di bawah target) · 22 murid»;
- listitem «… Bab 2: Data Sederhana 53% (di bawah target) · 13 murid».

In English: «56% (below target) · 22 students».

**axe is clean** on all 40 pages at 1280 px. The title and skip link are present.

**Not heard:** I have no NVDA or TalkBack here. The tree is what a screen reader is given, but it is not a human pass.

## 6. A7

**Confirmed:** a withheld figure now has one explanation. The remaining «muncul setelah…» lines name a condition, not a section:
- «Angka kelas muncul setelah paling sedikit 5 murid mengerjakannya» (5D, 5E);
- the certificate and gate lines on the school page.

**Every other reference points to a visible section of the same page, with the right letter:**
- «Saran penanganan … ada di bagian D» (D is «Pemahaman keliru» on every Ringkasan Kelas that says it);
- «Mulai dari murid di bagian E» (E is «Murid yang perlu penguatan» on the teacher's);
- «lihat nama murid (Ringkasan Kelas, bagian E)» from «Lihat bukti»;
- «semuanya ditandai «pelajari lagi» di bagian B»;
- «Semua topik ada di daftar / tabel di bawah»;
- ««Lihat bukti»» and ««Lihat per soal»», which are links.

**Exception:** B2.

## 7. «Yang menunggu»

**Confirmed** at 390 and 320 px (`admin-persiapan-390`, `-320`). «1» starts the link's first line, and the wrapped words hang beside it.

## 8. D14

**The teacher's learner page** (`dihitung-ulang/guru-murid-390`):
- **Under the recalculated figure:** «25%», then «Hasil sesi ini dihitung ulang setelah disegel. Laporan memakai hasil terbaru (25%); sertifikat dan halaman hasil murid tetap memakai hasil asli yang disegel (13%). Alasan yang dicatat: Kunci jawaban satu soal diperbaiki».
- **Both figures and the recorded reason** are there, and it is clear.
- **One ordering suggestion:** the target line («di bawah target · target 70%») now comes after the note, so it is separated from the figure it qualifies. Figure, then target line, then the note would keep the figure's reading together.
- **Consistent across the teacher's pages:** Ringkasan Kelas section E reads «Gita Wibowo (5B) · 2 dari 8 soal tepat», which agrees with 25% (`dihitung-ulang/guru-ringkasan-1280`).
- **C:** the recorded reason is printed as entered, without a full stop.

**The learner's chapter result** (`dihitung-ulang/murid-bab-1-390`):
- **The notice** sits inside the result card, under the figure and its count line, in the card's small type: «Hasil ini kemudian dihitung ulang. Hasil yang Anda lihat di sini dan sertifikat Anda tidak berubah; laporan guru dapat menampilkan hasil yang dihitung ulang.»
- **Tone and position: right.** It is neutral and explains without alarming: no warning colour, no instruction, and the learner is not asked to do anything.
- **But the card contradicts itself:** B3.

**Your note on my earlier staging:** understood. This time I used the real `recompute_result`, so `per_domain` was re-scored as well.

## 9. Kenaikan

**Confirmed:** «Rata-rata selisih penguasaan sebelum dan sesudah pembelajaran, dihitung per pasangan murid dan bab: murid yang mengerjakan dua bab memberi dua pasangan.», then «+24 poin · Dihitung dari 35 pasangan … milik 22 murid.» (`guru-ringkasan-5B`).

## 10. The «Berkembang» token

**Confirmed: `#487A6F`.**
- **Contrast:** white on it is **4.90:1**, which passes AA for small text. It was 4.28:1 at `#4F8478`.
- **The ramp:** it still steps light to dark. Relative luminance is 0.402 («Perlu penguatan» `#86B3A9`), 0.164 («Berkembang»), 0.092 («Mantap» `#245F55`).
- **Text on each band:** white on «Mantap» is 7.39:1. «Perlu penguatan» carries dark ink, 6.35:1.

**The cost:** «Mantap» and «Berkembang» are now closer to each other, 1.51:1 against 1.72:1 before. On the rendered bar (`laporan/guru-ringkasan-5B-1280`, B) the segments are separated by a thin light gap, the counts are printed in them, and the legend names each band. So the two darker bands still read as two. **I would keep that gap as part of the component:** it carries the boundary that the colours alone no longer do.

## 11. «2 di antaranya…»

**Confirmed** (`admin-sekolah`), as quoted in §4.

## Not seen

- **Staging.**
- **NVDA / TalkBack** (A6 is confirmed in the tree only).
- **PD reports.**
- **A real printer** (A4 was checked as Chromium PDFs).
- **«Tidak berlaku»** as the only state: in this world one applicable sitting exists, so the school gate shows «belum cukup» (B1).
- **A class whose shown topics are all at target beside withheld ones** (§1).
- **The owner's acceptance.**
