# W6.12 · Screen-reader verification: NVDA and TalkBack (8 Nov 2026)

**Status:** ready to run; needs a person with the devices. Replaces the outline in
`batch-8/evidence/w69-bukti-pemeriksaan.md` §4.

**Why a person:** the automated checks (axe, the keyboard walk, 200 % zoom, contrast and colour vision on 55 screens) prove
the markup. They cannot prove what a screen reader actually says, in what order, or whether a person can complete a task
by ear. That is what this run records.

**Holds no password or PIN.** The tester uses accounts prepared as in `batch-9/evaluator-accounts.md` §2 and a class card
printed by the school's admin.

---

## 1 · What is automated and what needs the person

| Check | Automated (where) | Needs the person |
|---|---|---|
| every control has a name and role in the accessibility tree | axe on 55 screens, CI | **what NVDA/TalkBack actually announces**, and in Indonesian |
| headings in order, one h1 | axe, the crawl | **whether heading navigation (H / swipe) gives a useful outline** |
| the skip link exists and moves focus | the keyboard walk | **that it is announced and lands on the content** |
| focus visible, no trap | the keyboard walk | **that focus order matches the reading order** |
| live updates (saved, errors, timers) | the markup's `role=status`/`aria-live` is checked by tests | **whether «Tersimpan», refusals and the idle lock are spoken, once, at the right time** |
| tables (the reports, the PD record) | named, focusable regions (RB1-C1) | **whether row and column headers are read with each cell** |
| the figures (bands, dots, before/after) | text equivalents in the markup | **whether a listener understands the figure without seeing it** |
| the lesson player and the tests | keyboard walk of the player | **that a learner can answer, change an answer and hand in by ear alone** |

---

## 2 · Setup

| | NVDA | TalkBack |
|---|---|---|
| Device | Windows 10/11 laptop | an Android phone (Android 12 or later) |
| Reader | NVDA, current release, default settings, speech in Indonesian if available (record the voice) | TalkBack, current release, default settings, Indonesian |
| Browser | Chrome (current) | Chrome (current) |
| Address | the staging address the owner gives | the same |
| Navigation used | Tab / Shift+Tab, H (headings), D (landmarks), T (tables), arrows; Insert+F7 (elements list) | swipe right/left, double-tap, the reading-controls menu (headings, links, controls) |

Record the versions of the OS, the reader and the browser at the top of the session file.

---

## 3 · The script

For every step, the tester records:
- **Heard:** the words spoken, as close as possible;
- **OK / Issue:** OK if it matches «Expected»; otherwise the issue, classed A (blocks the task), B (completes with real difficulty), C (cosmetic).

Do NVDA and TalkBack each through the whole list. TalkBack may skip steps marked *(laptop)*.

### S1 · Sign in (staff)
1. Open the staging address.
   - Expected: page title spoken. The skip link «Langsung ke isi» is the first thing reached.
2. Go to «Masuk», enter the email and password, submit.
   - Expected: each field announced with its label. A wrong password gives one spoken error that names the problem; no focus is lost.
3. After sign-in: if a context chooser appears, choose a door.
   - Expected: each door announced as a button with its purpose and school.

### S2 · First screen per role
Do this for Guru, Kepala departemen, Dekan and Admin sekolah.
1. Use heading navigation to get an outline of the page.
   - Expected: one h1 that names the page; sections as h2 in reading order.
2. Use the landmarks list.
   - Expected: navigation, main and the account menu are found and named.
3. *(laptop)* Open and close the account menu with the keyboard.
   - Expected: expanded or collapsed is announced; Escape closes it and returns focus.

### S3 · A form with a mistake (Admin sekolah)
1. Konfigurasi → Struktur sekolah → add a class with the name left empty, then submit.
   - Expected: the error is spoken and tied to the field; focus goes to the field or the error.
2. Fill the name and submit.
   - Expected: success is spoken once («… ditambahkan» or the section's success line).

### S4 · A refusal
1. As Guru, open a page meant for the admin (the observer gives the address, for example `/konfigurasi`).
   - Expected: a spoken line that says the page is not available to this role, with a way back. No silent empty page.

### S5 · A report and its table (Kepala departemen or Dekan)
1. Open «Ringkasan Kelas» for Kelas 5A.
   - Expected: the scope line (school, class, year) is spoken near the top. The section letters are read with their titles.
2. Find the bands (Mantap / Berkembang / Perlu penguatan).
   - Expected: each band is read with its count and the denominator («dari N»). Ask the tester: «How many learners are in "Perlu penguatan"?» They must answer from the speech alone.
3. Open the topics × classes grid (Pimpinan) and move by table cells.
   - Expected: each cell is read with its row (topic) and column (class) headers.

### S6 · The professional-learning record (facilitator)
1. Open the PD class's Ringkasan Kelas.
   - Expected: the owner's sentence is spoken, then Section A with the table. Each participant row is read with its name and each column header.

### S7 · The learner, end to end (class card; phone for TalkBack)
1. Sign in with the card (the PINTAR ID and the PIN).
   - Expected: both fields labelled; a wrong PIN gives one spoken error.
2. Open the chapter and start the Pemetaan Awal.
   - Expected: the question's position (its number and how many there are) is spoken; each option is a radio announced with its letter and text.
3. Answer, change one answer, and move between questions.
   - Expected: the chosen option is announced as selected. «Tersimpan» (or the saved state) is spoken once, without stealing focus.
4. Hand in («Kumpulkan») and read the result.
   - Expected: the confirmation is spoken and its default is the safe choice. The result page's heading and figures are read.
5. Open one lesson and read it.
   - Expected: headings, lists and tables in the lesson are navigable. Images have a text alternative or are skipped as decoration.
6. Find the certificate (if earned).
   - Expected: its name, number and the verification link are spoken.

### S8 · The idle lock (class computer, laptop)
1. Leave the lesson untouched for 5 minutes.
   - Expected: the warning before the lock is spoken. After the lock, «PINTAR terkunci» is spoken, and the PIN field is labelled and resumes the same page.

### S9 · The reports after the Reporting Quality Gate (9 Nov; the owner will not waive this check)

Run on the report world the walk uses (`audit/fixtures/laporan-lokal.mjs` on a local stack, or wherever the owner says;
staging is not authorised for this gate). Stage one real recalculation first, as in §13 of the reporting matrix (a
corrected key, then `recompute_result` as a platform admin), so S9.6–S9.7 have something to read. Record the candidate SHA.

1. **Guru, Ringkasan Kelas 5C, section A.** Read the opening sentence.
   - Expected: «… dari … topik yang punya angka …», then the withheld topics in their own sentence («… topik lainnya
     belum dapat ditampilkan, jadi belum diketahui apakah sudah mencapai target»). Ask: «How many topics have a figure,
     and how many do not?» The tester answers from the speech alone.
2. **Same page, the chapter rows (section B).** Move through the list.
   - Expected: each row reads «[chapter] [percent] (di bawah target) · [n] murid», with «di bawah target» heard right
     after the percentage, never after the number of students. A withheld chapter reads «Belum cukup data: …».
3. **Same page on a phone (TalkBack), the topic grid (Pimpinan, Kepala departemen).** Swipe through the stacked blocks.
   - Expected: each topic is read once, then each class with its figure and «di bawah target» where it applies, or «—».
     The figures are not read twice (the table is hidden at this width).
4. **Admin sekolah, Ringkasan Sekolah.** Section A with every objective withheld, and the safety gate.
   - Expected: «Sudah ada hasil untuk … tujuan pembelajaran, tetapi belum ada yang dapat ditampilkan», then each reason
     on its own («… di antaranya …»). The gate reads «Dari hasil Uji Penguasaan yang memuat soal wajib, baru … murid;
     perlu …» and the results set apart; never a percentage. The last step points to «Bagian D di atas».
5. **A withheld figure** (Pemahaman in 5C, or the school's Kenaikan). Read the card.
   - Expected: one explanation with its reason and how many sat; no second «muncul setelah …» line.
6. **Guru, the recalculated learner's page («Catatan belajar»).** Read «Hasil resmi».
   - Expected: right after the recalculated figure, the note with both figures (latest and original) and «Alasan yang
     dicatat: …»; then the target.
7. **The learner (class card), the recalculated chapter's «Hasil».** Read from the top to the first question.
   - Expected, in this order: «Penguasaan [p]», «Terjawab tepat [n] dari [m] soal», the notice «Hasil ini kemudian dihitung
     ulang. … tetap seperti semula …», then under «Tinjau kembali» the note «Tanda «Sudah tepat» dan «Belum tepat» … bisa
     berbeda dari hasil di atas (n dari m soal tepat). Hasil di atas dan sertifikat Anda tetap seperti semula.», then
     question 1 with its mark. No «disegel». Ask: «Did your result or your certificate change?» The answer must be no.
8. **The same, in English (EN).**
   - Expected: «students» (never «learners») in the reports; the learner's notes say «stay as they were» and name the
     marks «That is right» and «Not right yet».

---

## 4 · The result

Write the session to `docs/completion-4.0/acceptance/sessions/<date>-<reader>-<initials>.md`:
- the versions;
- every step with Heard and OK/Issue.

W6.12 closes for that reader when S1–S9 have no A and no B finding. The Reporting Quality Gate needs S5, S6 and S9 on the gate's candidate SHA, with NVDA and with TalkBack. Each A or B finding becomes an engineering item with
its step id, and the step is run again after the fix.
