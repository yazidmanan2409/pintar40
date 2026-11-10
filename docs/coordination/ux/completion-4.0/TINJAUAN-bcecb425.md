# Rendered design check at `bcecb425` (Daisy, 10 Nov 2026)

**Scope:** a read-only design check, not acceptance. I looked at the rendered pages: keyboard and focus, the accessibility tree (Playwright `ariaSnapshot`), axe (WCAG 2.2 AA), 1280, 390 and 320 px, and every disclosure opened.

**Environment:** local only.
- Supabase reset to the migrations at `bcecb425`, then the report world (`audit/fixtures/laporan-lokal.mjs`).
- `next build` and `next start` from `bcecb425`, with the CI's synthetic certificate key.
- **The states were made through the screens.** This includes ending and withdrawing assignments, live sittings closed under the student, three Kenaikan runs (5D, 5B, 5H), two certificates and a WITA school.
- **Local-only data changes made for the test** (none in the product):
  - the teacher given 5E;
  - 5E's assignment reopened between attempts;
  - one 5F learner moved up to the Tingkat, so a Tingkat-only learner exists;
  - one recorded name changed, so the reissue table has a difference;
  - the school set to WITA.

**Evidence:** `verifikasi-bcecb425/`, with the screenshots named below and `catatan-jalan.txt`, the walk logs: aria trees, focus, counts and axe.

---

## A · Two blocking problems in the player (older than this range, on a screen you asked me to check)

Both come from `288cdb52` (8 Oct), so neither is a regression. I am raising them first because they decide whether a student can use the closed-sitting notice at all, and the player at all on a phone.

### A1 · Enter is taken from every control in the player (`src/app/belajar/_components/ItemPlayer.tsx:528–544`)

A `window` keydown handler turns Enter into «next question», with `preventDefault`, whatever has focus. It only skips `INPUT`, `TEXTAREA` and `SELECT`. As a result:

- **Enter on an answer** moves to the next question without choosing it.
  - Seen: `aria-pressed` stayed `false`.
  - Space does choose it, and so do the letters A–D.
- **Enter on «Selesaikan pemetaan»** does nothing: no request is sent.
- **Enter on the new «Kembali ke Belajar» link** in the closed-sitting notice does not navigate.
- The same applies to «Kembali», «Simpan & Jeda», «Perlu contoh?» and «Keluar».

This fails WCAG 2.1.1, and it is the student's main key.

**Change:** ignore the shortcut when `e.target.closest("button, a, summary, [role=button], input, textarea, select, [contenteditable]")` matches. The arrows and letters can stay as they are.

### A2 · The «Perlu contoh?» offer covers the question on a phone (`ItemPlayer.tsx:701` and `src/app/experience.css:1558`)

The player's inline offer and the Help panel share one class, `.pin-bantuan`.
- The later rule (`experience.css:1558`, the Help panel: `position: fixed`, full height on a phone) also applies to the player's offer.
- The offer appears after about 25 s on a question.
- **At 390 and 320 px it covers the whole question:** the student sees only «Perlu contoh?», and no answer can be tapped (`B0-player-layar-390.png`).
- **At 1280 it covers the end of the question and option A** (`B0-player-layar-1280.png`).

**Change:** give the player's offer its own class, for example `pin-bantuan-soal`, styled by the first rule (`experience.css:1016`, inline, `max-width: 60ch`). Leave `.pin-bantuan` to `PanelBantuan.tsx`.

---

## B · The screens you listed

### B1 · `/mengajar/[kelas]` (`C2-lipatan-1280.png`, `C2-lipatan-320.png`)

**✓ As designed:**
- **The working list** holds only what can be acted on. A withdrawn lesson offered again appears **once**, as «Siap disediakan».
- **«Sudah berakhir (2)»** is collapsed.
  - Enter opens it.
  - Each row has its pill, its date, the counting clause and «Alasan: …».
  - «Hasil tiap murid ada di halaman muridnya.» is said once, under the list, with no link.
- No sideways scroll at 320.
- axe: 0 violations at 1280 and 320.
- **The ending flow is right throughout:**
  - the radio follows the arrow keys, and the opener's words follow the choice;
  - focus goes to «Batal», and Shift+Tab reaches the red confirm;
  - the ended and withdrawn result lines are right.

**One change, small:** each folded row says its state twice. The meta begins «Ditarik 10 Nov 2026 · …», and the pill says «Ditarik» again. A screen reader hears both, because the rows are a single run of text.
- Keep the meta, which carries the date and the clause, and leave out the pill in folded rows.
- Or start `mengajar.materi.ditarik_pada` and `mengajar.materi.diakhiri_pada` with the date only.

**Not seen:** «Materi tanpa judul». I could not make a title unreadable without breaking the world.

### B2 · The teacher's learner page

- **✓** A withdrawn result shows the mastery and «Ditarik · tidak dihitung di laporan kelas dan sekolah» only. There is no target judgement and no «Beri ulang».
- **A finished Pemetaan Awal of an ended lesson** shows its figure with no mark, which is right: it still counts.
- **Change: the instrument names are the authoring names.** The rows read «**Pemetaan awal** — Matematika…» and «**Cek penguasaan** — Matematika…», while the student's page and the reports say «Uji Penguasaan».
  - The source is the assessment definition's title, `h.judul` at `mengajar/[kelas]/murid/[orang]/page.tsx:114`.
  - Always use `mengajar.instrumen.{mode}` with the course: «Uji Penguasaan · Matematika Kelas 5 · Bab 1».

### B3 · `/belajar/hasil` and `/belajar`

- **✓** «Guru Anda menarik penugasan ini. Hasil Anda tetap tersimpan di sini.» sits under the withdrawn Bab 1.
- **✓** The kept row: «Pemetaan Awal selesai: 0%. Materi ini ditutup sebelum Uji Penguasaan.» Using «Pemetaan Awal» is right; I accept that departure from my text.
- **Change: when every lesson is closed, `/belajar` no longer leads to the results** (`C5-murid-belajar-390.png`).
  - It shows only «Belum ada materi yang disediakan untuk Anda.»
  - The «Hasil belajar» card is gone: its condition (`capaian.size > 0`, `src/app/belajar/page.tsx:411`) is built from the lessons still assigned.
  - `/belajar/hasil` itself keeps them, from `myLearningHistory`.
  - **Fix:** take the card's condition from the same history, so a student who has results always has the way to them.

### B4 · The player's closed-sitting notice (`B8-murid-ditutup-layar-390.png`)

- **✓** The wording: «Asesmen ini sudah ditutup dan tidak dinilai. Jawaban yang sudah tersimpan tetap ada. Bila ada pertanyaan, tanyakan kepada guru Anda.»
- **✓** It sits in `role="status"` and is announced, with «Kembali ke Belajar» inside it. It reads well at 390.
- **Change:**
  1. **Enter on the link fails** (A1).
  2. **The sitting stays live under the notice.** The answers, «Kembali» and «Selesaikan pemetaan» can still be pressed, and focus stays where it was.
     - **Fix:** when `notice === "sync.diakhiri_sekolah"`, disable the options and the navigation, and move focus to the notice (`tabIndex={-1}`) so the link is the next stop (`ItemPlayer.tsx:728–733`).
- **On reload:** the closed sitting gives «Halaman ini belum tersedia untuk akun Anda. Jika ini keliru, tanyakan kepada guru Anda.» That is neutral and acceptable.

### B5 · `/masuk/buka-kembali`

- **✓** The label is «Email atau username», matching sign-in.
- **✓** The refusal is announced (`role="alert"`).
- **✓** `/masuk` and the reopen page are consistent and neutral. No sideways scroll at 320.
- **Change, `buka_kembali.galat.tunggu`:** the refusal came after **one** request. The pace is «one at a time», so «Sudah terlalu banyak permintaan baru saja» is not true for that person.
  - Use «Baru saja ada permintaan dari jaringan ini. Tunggu beberapa menit, lalu coba lagi.» / EN «A request was just sent from this network. Wait a few minutes, then try again.»
- **Change, `route.ts` and `page.tsx`:** after any refusal, the 303 brings back an empty form. The person loses a message of up to 500 characters.
  - **Fix:** keep what they typed. Either send the form from the page without a full reload, or carry it back for one view in a short-lived cookie.
  - If neither is possible in 4.0, say it: «Pesan Anda belum terkirim; tulis lagi setelah menunggu.»

### B6 · The certificate reissue table (`E1-tabel-390.png`, `E1-tabel-320.png`)

- **✓** «Perbandingan». The difference is marked by the word «berbeda», and the result row says «sama».
- **Change: at 390 and 320 the four columns break words mid-word,** for example «Pe·me·ga·ng», «Sapu·tra», «Nusantar·a».
  - **Fix:** below about 600 px, draw each row as a block in `FormTerbitUlang.tsx`: the field as a heading, then «Tertulis di sertifikat: …», «Tercatat sekarang: …», then the pill.
  - Or keep the table in an `overflow-x: auto` container with normal word breaking.
- **Small:** the row says «Kursus», but `sertifikat.ganti.arti` and `sertifikat.ganti.sama` say «pelajaran». Use one word.

### B7 · The staff ending confirmation (`E2-staf-tanya-390.png`)

**✓ Nothing to change:**
- «Akhiri tugas Pak Yusuf (uji laporan) di SD Cendekia Nusantara (sekolah peragaan)?», then «Semua perannya di sekolah ini berakhir: Guru 5B, Guru 5C dan Guru 5E.», said once;
- focus goes to «Batal», and «Batal» returns focus to the opener;
- readable at 320.

### B8 · Kenaikan kelas (5D, 5B and 5H runs; `G2-tinjau-390.png`)

**✓ As designed:**
- **The folded count equals the names it holds.** For 5B: «22 naik ke 6A · 2027/28» and 22 names, with the Tingkat learner listed under «Pengecualian».
- **«Terapkan»** skipped the Tingkat learner: «Diterapkan ke 24 murid; 1 tidak diubah…».
- **With no destination,** there is no checkbox and the run is accepted.
- **The outcome page:**
  - «Diperiksa dari data PINTAR: semua sesuai.»;
  - the teacher line with the year;
  - «Lanjut ke 5A · 2026/27 (belum diproses)».
- **Sizes and checks:**
  - no sideways scroll at 390 or 320;
  - every select named «Keputusan untuk {nama}»;
  - axe: 0 violations.

**Your question: the outcome without the Tingkat mark. I refuse this departure; please record the source.**

On 5B, the review lists **3** exceptions, including «Yogi Pratama (5F) · dari Tingkat (belum di kelas) · Naik ke 6A · 2027/28». The outcome lists **2** and puts him in the main group, which grows from 22 to 23. The total still agrees (25), but the groups do not.

Two reasons:
- **The outcome is what the administrator checks against what they confirmed.** A name that was an exception on the review must still be one on the outcome.
- **The learner who came from outside the class is exactly the one to check:** «(5F)» in the main group of 5B reads as a mistake.

So add each learner's `sumber` to the run's outcomes, and draw the outcome's «Pengecualian» with the review's rule.

**Changes:**
1. **A class that does not move up is all «Pengecualian».**
   - 5H (4 graduate, 1 leaves) listed **5 of 5** as exceptions, and the outcome did the same.
   - `kelompokkan` (`src/lib/kenaikan.ts`) chooses the main group among «naik» only. A graduating Kelas 6 will therefore list every child as an exception.
   - **Fix:** choose the main group as the largest group of any outcome. Then: «4 lulus» folded, and «Adi Wibowo · keluar: mengundurkan diri» as the exception.
2. **The summary line is ambiguous.**
   - Today: «2 naik ke 6A · 2027/28 · 1 tinggal kelas · 5A · 2027/28 · 1 keluar». The «·» separates the groups and also sits inside them, so it reads as five items.
   - **Fix:** join the groups with «, », and write the repeat as «tinggal kelas di»: «2 naik ke 6A · 2027/28, 1 tinggal kelas di 5A · 2027/28, 1 keluar».
   - Where: the `ringkas` join (`KenaikanKelas.tsx:206`), `judulKelompok` and `kenaikan.tinjau.kalimat`.
3. **The outcome repeats itself on every matching line.**
   - Examples: «Tinggal kelas di 5A · 2027/28 · 5A · 2027/28», and «Lulus · Pendaftaran berakhir · 10 Nov 2026 · lulus».
   - The verification line already says that everything matched.
   - **Fix:** when `sesuai`, show the decision only. Show `tercatat` only on a mismatch, where the warning already carries both values (`tercatat()` calls, `KenaikanKelas.tsx:151` and the exception list).
4. **Small:**
   - With no destination, leave out «Buka Peran & akses di tab baru».
   - `kenaikan.semua.diterapkan` says «0 tidak diubah karena…»: leave out the second clause when it is 0.
   - Each step-2 row reads the name twice: the visible name plus the hidden label. Label the select with `aria-labelledby` on the name, plus the prefix (`DaftarKeputusan.tsx:67`).
   - Struktur sekolah shows a new year as «2027/2028» beside «2026/27». It writes the period name as typed; use `tahunPendek` there too.

### B9 · Jejak audit (`K1-jejak-run-0-1280.png`)

**✓ As designed:**
- «Kenaikan kelas · 5B · 2026/27 → 2027/28» in «Sasaran»;
- «25 murid: 24 naik, 1 tinggal kelas»;
- each learner with the destination and its year: «naik ke 6A · 2027/28», «tinggal kelas di 5A · 2027/28»;
- «Catatan terkait (15)», which opens to its rows;
- the part-of-a-run line naming the run;
- rows in WITA after the school's zone changed;
- the table scrolls inside its own box at 320;
- axe: 0 violations.

**Changes:**
1. **A large run defeats the fold.**
   - 5B (25 learners) wrote about 84 related rows: 34 on page 1 and 50 on page 2.
   - Each one reads «Termasuk kenaikan kelas 5B · 10 Nov 2026; baris utamanya ada di halaman lain.» The run's own row is on **page 3**.
   - With 40 students, an administrator reads two pages of identical lines before reaching the run.
   - **Fix:** page by entries, so that a run and its rows are one entry (`konfigurasi/page.tsx`, the audit read, with `lipatKenaikan`).
   - At least, draw a page's rows of one run as **one** row: «84 catatan dari kenaikan kelas 5B · 10 Nov 2026 · baris utamanya di halaman 3», with the link.
   - **→ Sharon**, because it changes the paging of the audit.
2. **The related rows do not name the learner.** Fifteen rows read «Keanggotaan diakhiri · Keanggotaan» and cannot be told apart. Add the learner's name, and the Kelas, to each.
3. **Small:** «lulus» and «naik ke …» are lowercase, but «Keluar: mengundurkan diri» is capitalised. Write «keluar: mengundurkan diri».

### B10 · The integrity page

- **✓** The empty state reads «Tidak ada catatan yang menunggu tinjauan Anda.»
- **Not seen:** the count line. This world has no integrity records, and by Sharon's ruling the line is hidden at 0.

### B11 · D-199, a school's dates on its own clock

- **✓** With the school set to WITA, the class page's «Mulai» for a start at 16.30 UTC reads «**Rabu, 11 Nov 2026**». Under WIB it read «Selasa, 10 Nov 2026».
- **✓** The maintenance labels read «Mulai (WITA; kosongkan untuk sekarang)», «Perkiraan selesai (WITA)» and «Terbit (WITA; …)».
- **✓** Jejak audit reads «10 Nov 2026, 13.26 WITA».
- **✓** The certificate card («10 November 2026») and the public check («10 Nov 2026») name the same day.
- **Not seen:** the certificate's day at a boundary. Its issue time cannot be moved without signing it again.

### B12 · Also seen: the student's certificate list (`L2-daftar-390.png`; from `288cdb52`)

- **A chapter no longer assigned is titled just «Sertifikat».** After a new school year, the list loses the course: its names come from `engine.myAssignments`. The certificate row already carries `course_title_as_issued`; use it.
- **«Berlaku» appears twice:** `{pill}` is drawn inside and after the meta, at `src/app/belajar/sertifikat/page.tsx:113` and `:116`.

---

## Summary

**Blocking, and older than this range:**
- **A1,** Enter in the player.
- **A2,** the offer covering the question on a phone.

**To change:**
- **B3:** the «Hasil belajar» card when every lesson is closed.
- **B4:** the sitting stays live under the notice.
- **B6:** the reissue table at phone widths.
- **B8:** record the source, so the outcome keeps the review's exceptions; the main group for a graduating class; the summary separators; the repeated outcome lines.
- **B9.1:** paging by entries (**→ Sharon**).
- **B9.2:** the learner named on related rows.
- **B12:** the certificate list.

**Small:**
- the folded row's double state (B1);
- the instrument names on the learner page (B2);
- the reopen pace sentence and the lost message (B5);
- «Kursus» or «pelajaran» (B6);
- the four Kenaikan details (B8.4);
- the audit's casing (B9.3).

**Confirmed as built:**
- the class page's working list and fold;
- the withdrawn result on both learner pages;
- the kept Pemetaan Awal row;
- the notice's words;
- the reopen label;
- «Perbandingan»;
- the staff confirmation;
- the review's folded count;
- no checkbox without a destination;
- the run named, its counts and destinations in the audit;
- «Catatan terkait»;
- D-199 on the four places above;
- axe at 1280 and 320 on eight pages: 0 violations.

**Not seen:**
- «Materi tanpa judul»;
- the integrity count line;
- the certificate's day at a boundary;
- real screen readers;
- Firefox and WebKit.

**Journeys:** pending, as you said.
