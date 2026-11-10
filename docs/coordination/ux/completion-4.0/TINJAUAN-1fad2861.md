# Rendered recheck of my bcecb425 findings at `1fad2861` (Daisy, 10 Nov 2026)

**Scope:** a read-only design check, not acceptance. CI and the journeys on this commit are still pending, as you said.

**Environment:** local only.
- `1fad2861` checked out, with **its own** `npm ci`: next 16.4.5.
- Supabase reset to its migrations, then the report world.
- `next build` and `next start`.
- **The states were made through the screens:**
  - two lessons ended or withdrawn mid-test;
  - five Kenaikan runs: 5D, 5B, 5H (graduating), 5G (a 3–3 tie) and 5A (27 learners, 110 related audit rows);
  - two certificates.
- **Local-only data changes made for the test:**
  - one 5F learner moved up to the Tingkat;
  - one recorded name changed;
  - 5C, 5E and 5F learners gathered into 5A for the large run.

**Correction to my bcecb425 report:** that build ran on next 16.3.5 from a shared `node_modules`, not the 16.4.5 its lockfile pins. Every finding in it was in PINTAR's own code and is reproduced or resolved below, but the build was not exact.

**Evidence:** `verifikasi-1fad2861/`, with the screenshots named below and `catatan-jalan.txt`: the walk logs, aria trees, focus, counts and axe.

**axe** (WCAG 2.2 AA), 0 violations on all of these:
- the audit with a run open on sub-page 2;
- the Kenaikan outcome;
- the reissue panel;
- the class fold;
- `/belajar` with every lesson closed;
- the certificate list;

each at 1280, and at 320.

---

## A · The player: **accepted**

| Item | Seen | Verdict |
|---|---|---|
| **A1, Enter** | <ul><li>Enter on a focused answer chose it (`aria-pressed=true`) and stayed on the question.</li><li>A letter key with nothing focused chose C.</li><li>Enter on «Berikutnya» moved on.</li><li>Enter on «Selesaikan pemetaan» finished and opened the reading map.</li><li>Enter on «Mulai» started.</li><li>Enter on «Kembali ke Belajar» followed the link (B4).</li></ul> | **Accept** |
| **A2, the offer** | <ul><li>After 32 s on an unanswered question, «Perlu contoh?» appeared as `.pin-bantuan-soal` with `position: static`, below the answers.</li><li>It covered nothing at 390, 320 or 1280, and every answer could be tapped.</li><li>No sideways scroll (`A2-tawaran-layar-390.png`, `-320.png`).</li></ul> | **Accept** |

**Small (older than this range):** the offer says «Perlu contoh?» twice, as its label and as its button. Keep the button only.

## B · Your other findings

### B4 · A sitting closed mid-test: **accepted, with one small change** (`B4-ditutup-layar-390.png`)

Gita (5B, Uji Penguasaan) answered 8 of 8, then the teacher ended Bab 2 with «Tutup juga asesmen…». She pressed «Kumpulkan», and focus went to «Periksa lagi». She pressed the red «Kumpulkan». Then:
- the notice appeared, with the agreed words, and **took focus**;
- all ten player buttons were `disabled`, in one look;
- Tab reached «Kembali ke Belajar», and Enter went to `/belajar`.

**Small changes:**
1. **The disabled look erases the answer she chose.** Option A had `aria-pressed=true` but is drawn like the others. The notice says «Jawaban yang sudah tersimpan tetap ada», so keep the chosen mark visible while disabled: its border or check, in the disabled tone.
2. «Sudah dijawab: 8 dari 8.» touches the notice's frame. Add the usual gap.

### B3 · «Hasil belajar» when every lesson is closed: **accepted** (`B3-belajar-320.png`, `B3-hasil-320.png`)

Bunga (5B, both lessons closed) still sees the «Hasil belajar» card under «Belum ada materi…», at 1280, 390 and 320. Enter on «Lihat hasil belajar» opens `/belajar/hasil`, which lists both chapters: Bab 1 with the withdrawn mark, and Bab 2 ended.

### B1 · The folded row: **accepted** (`B1-lipatan-320.png`)

There is no second pill. Each folded row is the title, «Ditarik {tanggal} · …» or «Diakhiri {tanggal} · …», and «Alasan: …».

### B2 · The teacher's learner page: **accepted for «Hasil resmi»; change the section above it**

- **✓** «Uji Penguasaan · Matematika Kelas 5 · Bab 1: Pola Bilangan» and «Pemetaan Awal · …».
- **Change:** «Penilaian di kelas ini», the section directly above, still reads «**Pemetaan awal —** Matematika…» and «**Cek penguasaan —** Matematika…». It uses the same authoring titles. Use `mengajar.instrumen.{mode}` with «·» there too (`mengajar/[kelas]/murid/[orang]/page.tsx`, the first section).
- **New, → engineering:** on the **ended** Bab 2, a result under the target still offers «Minta membaca lagi».
  - The page says «Mereka akan menemukan permintaan ini di beranda mereka.», but an ended lesson no longer appears on the student's Belajar.
  - Either hide «Minta membaca lagi» for ended assignments, or confirm that the request opens a lesson the student can still reach.
  - I did not follow a request through to the student.

### B8 · Kenaikan: **my refusal is resolved, so accepted** (`G2-tinjau-390.png`, `G3-hasil-390.png`, `J3-hasil-390.png`, `T2-tinjau-1280.png`)

**Provenance (5D):**
- On the review, «Zahra Lestari (5F) · dari Tingkat (belum di kelas) · Naik ke 6A · 2027/28» is an exception, with «3 naik ke 6A» folded.
- The outcome has the same two exceptions, she is still marked «dari Tingkat», and «3 naik» is folded.
- The counts agree between the pages.

**The main group:**

| Class | What happened | Review and outcome |
|---|---|---|
| 5H (graduating) | 4 lulus, 1 keluar | «4 lulus» folded; Adi «Keluar: mengundurkan diri» the only exception. Same on both |
| 5G (tie) | rows 1–3 lulus, rows 4–6 naik, so «lulus» came first in the list | «3 naik ke 6A · 2027/28» folded; the three «Lulus» as exceptions. Same on both, so the tie went by outcome, not by order |

**The summary and small items, all ✓:**
- «22 naik ke 6A · 2027/28, 1 tinggal kelas di 5A · 2027/28, 1 naik ke 6B · 2027/28»;
- the outcome shows only the decision when everything matched;
- with no destination, there is no checkbox and no role link;
- «Diterapkan ke 24 murid.» with no «0 tidak diubah»;
- each row's select named once: the row reads the name once;
- Struktur shows «2027/28».

**Small changes:**
1. **Step 2's live status line still uses «·» throughout:** «22 naik ke 6A · 2027/28 · 1 tinggal kelas · 1 naik ke 6B · 2027/28 · 0 belum dipilih». Use the review's joining («, » and «tinggal kelas di …») in `DaftarKeputusan.tsx`, the `role="status"` line.
2. **The groups follow the list, so the main group can come last:** «1 keluar, 4 lulus»; «3 lulus, 3 naik ke 6A». Write the main group first, then the rest in your tie order: «4 lulus, 1 keluar».
3. Struktur's «Tambah Tingkat» field still suggests «2026/2027». Suggest «2027/28», the year it will show.

### B6 · The reissue table: **accepted, with one word left** (`E1-blok-320.png`)

- **✓** Below 640 px each row is a block: «Pemegang», then «Tertulis di sertifikat: …», «Tercatat sekarang: …» and the pill.
- **✓** It is readable at 320, with no word broken. The table semantics are kept.
- **✓** «paket» is used in the explanation and the row.
- **Change:** the same panel's «Cabut sertifikat» list above it still says «**Kursus**». Either it follows the X12 item with the list column, or the panel uses «Paket» throughout as stated. I'd leave it with the list column, and say so in the X12 item.

### B12 · The certificate list: **accepted** (`B12-Vina-390.png`)

After the 5D run, Vina (moved up) and Zahra (left) see «Matematika · Matematika Kelas 5 · Bab 1: Pola Bilangan · Terbit 10 Nov 2026 · ✓ Berlaku», with **one** pill. Enter opens the card. This holds at 390 and 320.

### B5 · The reopen form: **accepted**

- The refusal reads «Baru saja ada permintaan dari jaringan ini. Tunggu beberapa menit, lalu coba lagi.» (`role="alert"`).
- **A refused send kept both fields,** and kept them again after a second refused send.
- After a fresh load the form is empty, which is right.

### B9.2 and B9.3 · The run's audit list: **accepted**

- Related rows read «10 Nov 2026, 14.43 WIB · Keanggotaan diakhiri · Keanggotaan · Adi Hidayat (5B) · 5B».
- The run's list reads «keluar: pindah ke sekolah di luar PINTAR» and «keluar: mengundurkan diri» in lowercase.

## C · Jejak audit, one entry per run: **change** (`C-buka-layar-390.png`, `C-tutup-layar-390.png`, `C1-terkait-layar-1280.png`)

**✓ As built:**
- **One entry per run:** page 1 holds the five runs as five rows, with **no** part-of-run lines.
- **n is exact:** «Catatan terkait (n)» matches the database for every run (96, 21, 19, 15 and 110).
- **Sub-pages work:**
  - 100 related rows on sub-page 1 and 10 on sub-page 2, beside the 27 learner lines;
  - «Halaman berikutnya» works by keyboard;
  - «Tutup catatan terkait» closes them.
- After opening, the next Tab stop is «Tutup catatan terkait», inside the run.
- No sideways page scroll at any width.

**Changes:**
1. **The related rows open inside the «Alasan» cell, not under the row.**
   - At 1280 they form a column about 240 px wide beside four empty cells, 6,500 px tall for 100 rows.
   - At 390 and 320 the column is about 45 px wide, one word per line («Keang·gotaa·n»).
   - **Fix:** draw them as a full-width row directly under the run's row (`<tr><td colSpan={…}>`), with their own small table or list. The run's row then stays one row high.
2. **«Returns to the run» does not hold on a phone.**
   - After opening, after sub-page 2, and after «Tutup», the run's own row is above the screen: its top is at −40 px at 1280 and −168 px at 390 and 320.
   - After «Tutup» at 390, only its last 36 px show under the bar.
   - The fragment points inside the row, not at its start, and the sticky bar is not allowed for.
   - **Fix:** put the id on the run's `<tr>`, with `scroll-margin-top` equal to the bar's height. After «Tutup», land on the run's row.
3. **The whole audit table breaks words mid-word at 390 and 320:** «Kenaika·n kelas», «Wul·an», «2026/2·7».
   - The table does scroll inside its frame (507 px wide in a 322 px frame), but `overflow-wrap: anywhere` on its cells lets every column shrink below a word.
   - This was there at bcecb425 too; I missed it then.
   - **Fix:** use `overflow-wrap: break-word` on the audit cells, as you did for the reissue table, with a `min-width` on the table so the frame scrolls instead. Or, below 640 px, draw each row as a block, like the reissue table.

## D · Also seen

- **The app's top bar at 320 breaks the page title mid-word:** «Sertifi·kat sekola·h», «Menga·jar». This is the shell, older than this range, and small.

---

## Summary

**Accepted:**
- A1 and A2;
- B1, B3, B5, B12 and B9.2–3;
- B4 (one small change);
- B6 (one word, which belongs to X12);
- B8: my refusal is resolved; the graduating class and the tie are right in both places.

**To change:**
- **C1:** the related rows as a full-width row under the run.
- **C2:** land on the run's own row, allowing for the bar.
- **C3:** the audit table's mid-word breaks at phone widths.
- **B2:** «Penilaian di kelas ini» still uses the authoring names.

**Questions → engineering:**
- «Minta membaca lagi» on an ended lesson (B2).

**Small:**
- the chosen answer kept visible when disabled, and the gap above the notice (B4);
- the step-2 status line's joining, and the main group written first (B8);
- Struktur's suggested year;
- «Perlu contoh?» said twice;
- the shell's title at 320.

**Still not seen:**
- the integrity count line;
- a certificate's day at a boundary;
- «Materi tanpa judul»;
- real screen readers, Firefox and WebKit;
- a «Minta membaca lagi» request followed through to the student.

**Pending, per you:** CI 42773407799 and journeys 42773411702.
