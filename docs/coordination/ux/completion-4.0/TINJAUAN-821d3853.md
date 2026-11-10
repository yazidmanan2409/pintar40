# Recheck of the corrected areas at `821d3853` (Daisy, 10 Nov 2026)

**Scope:** a read-only design check, not acceptance. Only the items in the disposition (`TINJAUAN-1fad2861-DISPOSISI.md`). Everything I accepted at `1fad2861` was not looked at again.

**Environment:** local only.
- this commit's own `npm ci` (next 16.4.5);
- Supabase reset to its migrations, then the report world;
- `next build` and `next start`.

**States, made through the screens:**
- 5B Bab 2 ended mid-test, with the student under target in both chapters;
- a 5A run of 28 learners, with **114** related audit rows.

**Local-only test setup:** I gathered the 5C, 5E and 5F learners into 5A for the large run.

**Evidence:** `verifikasi-821d3853/`: screenshots named below, plus `catatan-jalan.txt` with measurements, focus and aria.

**Verification of `821d3853`:**
- local full suite: pending, as reported;
- CI 42780520771: pending, as reported;
- journeys 42780525340: pending, as reported.

**Correction:** at `1fad2861`, CI 42773407799 and journeys 42773411702 completed with **success** on that SHA. I read both runs. `TINJAUAN-1fad2861.md` is updated to say so.

---

## The player's small items: **accepted** (`B4-ditutup-layar-390.png`, `-320.png`, `A2-tawaran-layar-390.png`)

Indra (5B) was mid-test when the teacher ended Bab 2. She then pressed «Kumpulkan». Checked:

- **The chosen answer stays visible.** It keeps a 2 px border (`rgb(95,106,115)`), weight 600 and darker text, in the disabled tone. The other answers have a 1 px transparent border and weight 400.
- **The gap is right.** The notice stands **16 px** below «Sudah dijawab: 8 dari 8.».
- **The notice still works as before.** It takes focus, all buttons are disabled, and Tab then Enter on «Kembali ke Belajar» goes to `/belajar`.
- **«Perlu contoh?» appears once** after 32 s on an unanswered question, as the button, followed by «Sudah cukup, terima kasih». It covers nothing at 390, 320 or 1280.

## B2 · The teacher's learner page: **accepted** (`B2-guru-murid-390.png`, `B2-ulang-diakhiri-390.png`)

This is the first rendered look. The student is Bunga (5B): under target in Bab 1 (still given) and in Bab 2 (ended).

- **«Penilaian di kelas ini»** now names instruments the same way «Hasil resmi» does: «Pemetaan Awal · Matematika Kelas 5 · Bab 1: Pola Bilangan» and «Uji Penguasaan · …».
- **«Minta membaca lagi» follows the chapter's state.**
  - It appears **once**, on Bab 1 (still given).
  - It does not appear on Bab 2 (ended), though she is under target there too.
  - This holds at 1280, 390 and 320.
- **Opened directly,** `/ulang?penugasan=…` for Bab 2 shows «Bab ini tidak lagi diberikan kepada kelas.» with **no form**, and «Permintaan yang sudah dikirim» stays. No sideways scroll at 320.

**Small:** on that closed page, the intro above the sentence still invites the act: «Pilih murid yang perlu bantuan … Mereka akan menemukan permintaan ini di beranda mereka.», then «target 70%».
- When the chapter is closed, let the closed sentence replace the intro and drop the target line.
- Write «kepada kelas **ini**».

## C · Jejak audit: a run's related rows (5A run, 114 rows, by keyboard)

| | 1280 | 390 | 320 |
|---|---|---|---|
| Related rows open as | full-width row, `colSpan` 5 | same | same |
| Opened contents inside the frame's visible box | 0 outside | 0 outside | 0 outside |
| Run's row top after opening, sub-page 2, «Tutup» | 16 px (no bar) | 72 px, under a 57 px bar | 72 px, under a 57 px bar |
| Sub-page 1 / sub-page 2 | 100 / 14 | 100 / 14 | 100 / 14 |
| Words drawn as two boxes, anywhere in the frame | 0 | 0 | 0 |
| Page sideways scroll | none | none | none |
| Next Tab after landing | the run's «28 murid…» summary, then «Tutup», then the sub-page «Berikutnya», all inside the frame | same | same |
| Frame `scrollLeft` after opening and after «Tutup» | 0 | **320, the far right** | **390, the far right** |

### C3 · Words: **accepted**

Words break only at spaces, the table scrolls inside its frame, and the page never scrolls sideways (`C0-tertutup-layar-390.png`).

### C1 · The opened row: **accepted at 1280; change on a phone** (`C1-buka-layar-390.png`, `-320.png`, `-1280.png`)

**Accepted:**
- the full-width row;
- its contents at the frame's visible left edge;
- the wrapping within one screen;
- `C1-buka-layar-1280.png`, which reads well.

**Change, on a phone:** opening leaves the **frame scrolled to its right end** (`scrollLeft` 320 at 390 px, 390 at 320 px).
- The run's own «Waktu» and «Tindakan» cells sit off to the left, at −286 and −99 px. So do those of every other row.
- The reader lands on «Kenaikan kelas · 5A …», «Bu Wulan …» and «28 murid…», with no time and no action, and nothing shows that the table has been scrolled.
- **It stays scrolled after «Tutup»** (`C3-tutup-layar-390.png`). The closed trail then reads without its first two columns.
- I did not find the cause. It appeared on every open and close in my walk. Directly loading a `run=` address once gave `scrollLeft` 0.
- **Fix:** on landing (open, sub-page and «Tutup»), the frame's horizontal scroll is 0. If the sticky contents of the opened row pull the frame, keep them sticky only after the reader scrolls.

### C2 · Landing on the run's row: **vertical position accepted; change the sticky header**

**Accepted:** the run's row top is **72 px**, under the **57 px** bar, at 390 and 320 px, and **16 px** at 1280. That holds after opening, after sub-page 2 and after «Tutup».

**Change: the table's sticky header now shows where it was never seen before.** Both causes are in the shared table rules and predate this commit; the landing exposes them.
1. **On a phone it draws over the app bar.**
   - The header sits at 27–72 px, over the bar at 0–57 px, and hides «PINTAR Konfigurasi» (`C1-buka-layar-390.png`).
   - `.pin-tabel thead th` is `sticky; top: 0` (`experience.css:3285`).
   - **Fix:** under 1024 px, set it to `top: var(--shell-bar)` with a z-index below the bar's.
2. **«Waktu» stays put while its column scrolls away.**
   - `.pin-tabel thead th:first-child` is also sticky to the left (`:3292`), which suits tables whose first body cell is `.pin-tabel-nama`.
   - The audit's first cells are not, so with the frame scrolled, «Waktu» is drawn over the «Sasaran» column (`th` «Waktu» at 34 px, «Sasaran» at 23 px). That labels the wrong column.
   - **Fix:** in `#audit`, the first `th` is not sticky to the left. Or make its first column sticky too.

## Summary

**Accepted:**
- the player's small items (B4, the 16 px gap, «Perlu contoh?» once);
- B2;
- C3;
- C1 at 1280;
- C2's vertical landing.

**To change (phone widths):**
- **C1:** the frame lands, and stays, scrolled to its right end.
- **C2:** the sticky table header covers the app bar, and «Waktu» stays left over another column.

**Small:** the closed «Minta membaca lagi» page's intro and target line, and «kelas ini».

**Kept in the register, as you list:**
- step 2's «·» status line;
- the main group's position;
- «Tambah Tingkat» suggesting «2026/2027»;
- the 320 px top bar;
- «Kursus» in «Cabut sertifikat» (X12).

**Still not seen:**
- the integrity count line;
- a certificate's date at a day boundary;
- «Materi tanpa judul»;
- real screen readers, Firefox and WebKit.
