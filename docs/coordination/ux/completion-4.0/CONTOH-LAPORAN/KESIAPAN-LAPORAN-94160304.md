# Design re-verification of the reporting corrections (Daisy, 9 Nov 2026)

**Commit reviewed:** `claude/awesome-rubin-bqxp6p` at **`94160304`**. I only read that branch.

**Compared against:**
- my report on `5cca6a5f` (`KESIAPAN-LAPORAN-5cca6a5f.md`, `afdae96d`);
- the owner's approval of O1, V1 and V2;
- the rulings O2–O4, D5 and D6;
- matrix §5 and §7.

**Evidence:** `verifikasi-94160304/`. Screenshot names refer to `laporan/<reader>-<page>-<width>.jpg`; a name without a width covers 1280, 390 and 320.

## How this was verified

1. The stack was rebuilt from nothing (`supabase db reset`), then `laporan-lokal.mjs`.
2. `next build` and `next start -p 3999`.
3. `audit/laporan-jalan.mjs`: **93 views (31 pages × 3), all HTTP 200, none scrolls sideways** (`laporan/`, with `laporan-jalan.json` holding each page's text).
4. `audit/siap-jalan.mjs`: **8/10 PASS, 2 NOT EXERCISED, 0 FAIL.** R9 now passes (`temuan/siap-jalan-ringkasan.json`).
5. I pressed R9's refusal again at each width for the Temuan cards (`temuan/`).

The world is a new random draw (108 sittings). 5B: 2 Mantap, 6 Berkembang, 14 Perlu penguatan; Kenaikan +18.

## Verdicts

| # | Item | Verdict |
|---|---|---|
| 1 | F1–F5 and V1 | **READY**, except the **no-target grid (F3, second half): NOT READY**, one line, read in code |
| 2 | O1 | **NOT READY: two conditions.** The decision sentence is missing on «Lihat bukti» (N1). One «not yet» state is mislabelled on 5D (N2) |
| 3 | V2 | **READY in Ringkasan Kelas. NOT READY where the short title stands alone:** the grid, Ringkasan Sekolah A and «Lihat bukti» (N3) |
| 4 | New states from the rulings | **READY** for what this world shows; three states not seen (§4) |
| 5 | Decision 1, end to end | **READY** |
| 6 | Temuan cards' inner padding at 390 px | **NOT READY** (cosmetic, unchanged). May follow the walkthrough |

**To correct.** Each is a line or a condition:

| # | Finding | Where | Smallest correction |
|---|---|---|---|
| **N1** | «PINTAR menunjukkan; langkah berikutnya Anda yang memutuskan» is on every Ringkasan Kelas and on Ringkasan Sekolah, but **not on «Lihat bukti»**, the one page whose figures carry the lens lines | `guru-bukti-5B` | Add it once, after Kesimpulan |
| **N2** | **5D's «Pemahaman» tells the wrong «not yet».** Sections A–C say «Belum cukup data… Sekarang 4 murid; perlu 5.» Section E («Angka lain») says «Belum ada bukti yang memenuhi syarat… Sekarang 0 murid; perlu 5.» Four learners have results. Under D6, no chapter reaches the minimum, so the qualifying count is 0. But the reader is told nothing exists, on the same page that says four exist | `kadep-ringkasan-5D` | When results exist but no chapter reaches the minimum, use the «belum cukup» state with the learner count («Sekarang 4 murid; perlu 5»). If chapters matter, add: «…dan belum ada bab dengan 5 murid» |
| **N3** | **The short title alone misnames two topics** where no statement accompanies it: «Mengenal Pola Bertambah» and «Membaca Tabel Data» (see V2 below). That is the Pimpinan grid's rows, Ringkasan Sekolah A's rows (where they are also counted as «ranah») and «Lihat bukti» «Penguasaan per bagian». The approved V2 keeps the statement as the second line | `kadep-pimpinan`, `dekan-pimpinan`, `admin-sekolah`, `guru-bukti-5B` | Put the statement under the title as in Ringkasan Kelas A: small, `pin-meta`. In the grid's narrow row header, at least as the row's accessible description, or under the title at 1280 px |
| **N4** | **F3's second half, by code:** with no readable target the key switches to `laporan.kisi.tanpa_target`, but the meaning line above it is unconditional: «Setiap sel adalah angka … kelas itu sendiri, **terhadap target kelas itu**» (`KisiTopik.tsx:84`). Not seen live: in this world every class's target is readable | code | Drop «, terhadap target kelas itu» when `bertarget === 0` |

## 1. F1–F5 and V1

| # | Verdict | Evidence |
|---|---|---|
| F1, section E | **READY** | One sentence per learner, with short titles joined by `daftarKata`: «Pelajari lagi: Memecahkan Masalah dengan Pola, Pola pada Tabel dan Gambar serta Pola Berkurang», then «4 dari 8 soal tepat». No «.,» (`guru-ringkasan-5B`). C: «serta» and «dan» alternate between neighbouring rows, because «Pola pada Tabel dan Gambar» holds «dan». That is correct by G-01, only uneven to the eye |
| F2, chapter name | **READY** | No «Matematika · Matematika» on any page of the 93. Hasil per bab reads «MATEMATIKA KELAS 5 · BAB 1: POLA BILANGAN» (`murid-hasil-bab`) |
| F3, Dekan's grid | **READY with targets** (`dekan-pimpinan`): column heads «22 dari 24 murid · Target 70%», ticks, amber with words, the same lead as the Kepala departemen's. **The no-target state: NOT READY** (N4) | — |
| F4, misconceptions | **READY** | Eight rows, then «10 pola lain ada di «Lihat bukti».» (`guru-ringkasan-5B`, `kadep-ringkasan-5B`). «Lihat bukti» keeps them all |
| F5, Persiapan | **READY** | «Belum · Murid yang sudah ditempatkan di Kelas · 50 — 1 murid belum punya kelas: tempatkan di Pindah» (`admin-persiapan`) |
| V1, axis | **READY** | At 1280 px: 0 / 20 / 40 / 60 / 80 / 100%, nothing overprinted. The key reads «Garis tegak: target kelas, 70%, yang ditetapkan sekolah pada Uji Penguasaan kelas ini.» At 390 and 320 px the axis shows 0% and 100% only, as phones always have, and the target label no longer collides (`guru-ringkasan-5B`) |

## 2. O1 as implemented

- **The lines are value-independent and point to a place**, on «Lihat bukti» (`guru-bukti-5B`):
  - «Topik mana yang paling menurunkan angka ini: lihat Penguasaan per bagian di bawah.» under Pemahaman 55%;
  - «Kenaikan menunjukkan seberapa jauh kelas bergerak, bukan apakah target tercapai. Baca bersama Pemahaman dan Sebaran hasil.» under Kenaikan;
  - «Siapa saja yang ada di pita «Perlu penguatan»: lihat nama murid (Ringkasan Kelas, bagian E).» under the bands.
- **The contradiction is gone,** and no prescriptive line is used anywhere. `tindakan.ulangi`, `.lanjut`, `.fokus` and `.fokus_pita` remain in the copy table but nothing reads them.
- **The decision sentence appears once,** in «Apa berikutnya», on every Ringkasan Kelas (5B, 5C, 5D, 5E, all four readers) and on Ringkasan Sekolah. It is **missing on «Lihat bukti»** (N1).
- **«Not yet» states:**
  - 5E (no records) says «Belum ada bukti…» throughout, and 5D's sections A–C say «Belum cukup data… Sekarang 4 murid; perlu 5», so the two states are told apart.
  - **Exception:** 5D's Pemahaman (N2).
  - **C:** on 5E the decision sentence is followed by «Tidak ada yang perlu dilakukan sekarang.» On a page with no figures, the decision sentence could be left out.

## 3. V2

**The count-and-lowest leads:**
- Ringkasan Kelas A: «6 dari 8 topik masih di bawah target. Yang paling rendah: Membaca Tabel Data (39%). Semua topik ada di daftar di bawah.» Three lines at 1280 px, five at 390 px and six at 320 px, down from 31.
- The grid: «3 topik di bawah target di lebih dari separuh kelas yang punya angka dan target. Semua topik ada di tabel di bawah.»
- Ringkasan Sekolah A: «…5 ranah masih di pita «Perlu penguatan»; yang paling rendah: Membaca Tabel Data (39%). Semua ranah ada di daftar di bawah.»

**Short titles with the statement on its own line:** done in **Ringkasan Kelas A**. The title is in the label weight and the statement is small beneath it, at every width (`guru-ringkasan-5B`). Section E is one sentence per learner.

**Where a short title reads wrong.** All eight lessons here have one objective, so every topic got its lesson title. Two titles name the lesson, not what is measured:
- **«Mengenal Pola Bertambah»** («getting to know»). The objective is «menentukan selisih pola bertambah tetap dan melanjutkan barisannya», a harder skill. «70%» against «Mengenal» undersells it, and a leader reads «they only recognise it».
- **«Membaca Tabel Data».** The objective also has «membandingkan, dan menjumlahkan». The title is narrower than what was scored.

The others («Modus», «Rata-rata Sederhana», «Pola Berkurang», «Pola pada Tabel dan Gambar», «Memecahkan Masalah dengan Pola», «Mengumpulkan Data dengan Turus») read as the skill.

**So the rule «one objective, so the lesson title» holds only where a statement stands beside the title (N3).** For the lesson titles themselves, that is Studio's authors' and Dr Gladys's question: a lesson title is written to invite, not to name a skill.

**The grid's lead:** «di lebih dari separuh kelas yang punya angka dan target» is accurate. With two such classes, «di kedua kelas yang punya angka dan target» would say it plainly (C).

## 4. The new states from the rulings

| State | Verdict | Evidence |
|---|---|---|
| Withheld rows, «Belum cukup bukti — kurang dari {m} murid» | **READY** where seen: «2 ranah lain belum cukup bukti — kurang dari 10 murid — jadi angkanya tidak ditampilkan.» No 0 is shown (`admin-sekolah`) | Not seen: a withheld topic row in a class, or a withheld chapter row |
| Per-chapter rows in section B | **READY** | The basis sentence «Pita di atas memakai Uji Penguasaan terakhir setiap murid, dari bab mana pun. Setiap bab, terpisah:», then «Matematika Kelas 5 · Bab 1: Pola Bilangan 57% · 22 murid» and «Bab 2: Data Sederhana 53% · 18 murid», amber with screen-reader words (`guru-ringkasan-5B`). C: the label «Penguasaan per bab» is not shown as a heading; the basis sentence introduces the list well enough |
| «Angkatan tidak tercatat saat Uji Penguasaan» | **Not seen** | All new sittings recorded their Angkatan (matrix §5, D5). The copy exists (`laporan.sekolah.angkatan_tak_tercatat`). The one row here reads «Matematika · Angkatan 5 · 2026/27 · 34 murid · 53%» |
| Safety-gate base | **READY** | «Soal wajib 100% · Dari 34 murid yang mengerjakan Uji Penguasaan.» (`admin-sekolah`) |
| Refusal page for a fully refused reader | **READY** | Guru at 5D and at the school, the learner at a class report, the Kepala departemen and the faculty-node Dekan at the school summary. One sentence, who to ask, and the reader's own way home (`guru-tolak-*`, `murid-tolak-ringkasan`, `kadep-sekolah`, `dekan-sekolah`). The Admin at /pimpinan gets the page's own refusal (`admin-tolak-pimpinan`) |
| The 100% rows from one learner | **READY** | Gone: the school summary shows 8 ranah and withholds 2 (D6) |

## 5. Decision 1, end to end

**READY.**
- «Putri Tanpa Kelas (uji) · SDC000001V9» is listed under «Murid yang belum punya kelas» with «Kelas» and «Masukkan ke kelas» (`admin-pindah-tempatkan`).
- «Yang menunggu» reads «1 murid belum punya kelas: masukkan ke kelas di Pindah kelas», and Persiapan marks the step «Belum» with the same hint (`admin-persiapan`).
- Her /belajar reads «Anda belum masuk kelas mana pun, jadi belum ada materi untuk Anda. Admin sekolah Anda dapat memasukkan Anda ke kelas.» at 1280, 390 and 320 px (`tanpaKelas-belajar`).

**C, unchanged since `14361bda`:** «Yang menunggu» still runs the count into its word («1murid»), because `.pin-tautan` is a flex box.

## 6. Temuan padding

**Unchanged.** At 390 and 320 px, the text of each Temuan card touches the card's left border (`temuan/r9-layar-390`). Cosmetic; it may follow. The refusal itself is as before: «Tertahan», the refusal line, and Temuan with how to fix, in about 0.2 s (`temuan/r9-*`).

## 7. Also seen (for Second Eye and the owner)

- **Hasil per bab, «Semua soal penting sudah dijawab dengan tepat»** under «Terjawab tepat 0 dari 8 soal» (`murid-hasil-bab`). The chapter apparently has no required question, so the sentence is true of nothing, and a child reads «all the important ones were right». **B:** say «Bab ini tidak punya soal wajib», or say nothing. This was already so on `5cca6a5f`; it shows now because the learner scored 0.
- **Pimpinan «Per kelas»** still says «5A · Ada angka» while the grid shows 5A as «Sekarang 1 murid; perlu 5» (my B from `5cca6a5f`; not in §7).
- **The grid shows 5C «Pola Berkurang · 0%»** from 7 learners: a real mean of 0 in this draw, not a withheld row. Shown in amber with its words; for Second Eye's count.
- **Learner section A** still reads «0 dari 8 soal / belum mencapai target» (my C; «0 dari 8 soal tepat» would say it).

## What I did not see

- **Staging.**
- **NVDA / TalkBack.**
- **The A4 print.**
- **PD reports.**
- **English-locale pages.**
- **These states live:**
  - the grid with no readable target (N4 is by code);
  - «Angkatan tidak tercatat»;
  - a withheld topic or chapter row in a class.
- **Numerical integrity:** Second Eye's.
- **The owner's acceptance.**
