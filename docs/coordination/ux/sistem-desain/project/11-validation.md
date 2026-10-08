# Validation

**State: APPLICATION READY (8 Oct).** J1 to J7 are composed, walked and recorded; every finding is corrected at source; the open questions are decided within the approved grammar (owner directive, 8 Oct: Daisy decides design execution within the approved system); the stripe is A. The design system is approved in principle, and every question is ruled («Proposal and rulings»). Nothing is applied to PINTAR until the authorised UI/UX stage. What was checked:
- **the composed journeys:** the approved grammar is checked working together in composed PINTAR journeys, not one component at a time;
- **the table stripe:** checked on real school displays.

Nothing here changes PINTAR, and nothing is propagated to the application.

## Settled: not validated again

| | State |
|---|---|
| The brand: the PINTAR wordmark, its specification and the 4.0 tab icon | Approved. Only the outlined master is pending (production, below). |
| The ID card and the certificate | Frozen. The only change is the 5 Oct brand correction: the PINTAR wordmark in place of «PINTAR SELALU». |
| Tokens, type, colour, corners, elevation, motion, icons, the accessibility standard, dates | Approved (questions 3 to 10, 12, 13 and 15). |
| The shells and the staff navigation | Approved (question 1). The order and grouping are kept for the application pass (question 11) and validated below before they change further. |
| The table stripe | A (question 14), final on 8 Oct (§2). |

## 1. Composed journeys

**Why.** The components pass one at a time (52 previews, axe, 24 and 44 px targets, 390 px, reduced motion). A journey shows what single components cannot:
- whether one action stays obvious per screen;
- whether the navigation says where you are;
- whether every click is answered;
- whether the grammar holds together at school scale.

**How they are made.**
- Each journey is a short clickable sequence of screens, composed only from the design system's components and tokens. No product code, no data, nothing in `src/`.
- The words come from the copy table (`src/lib/hle.ts`, D-014). Where a word does not exist yet, it is marked as new.
- People, schools and classes are invented.
- Each journey is drawn at 1280, 1024 and 390 px, and is walked by keyboard alone and with reduced motion on.

| | Journey | Who | What it validates |
|---|---|---|---|
| J1 | Publish a chapter, then make it available to a class: Studio → «Terbitkan» → «Menerbitkan…» → «✓ Diterbitkan» and «Terbit sejak …» (the school); then Kelas 5A → «Siapkan materi» → «Sediakan» → «✓ Disediakan» and the window in words (the teacher) | Admin sekolah, then a teacher | The staff shell and its places (1, 11); the publishing words (2); the type ladder (4); motion on the result (8) |
| J2 | Look at a whole class and act on one learner: the long table, search, the status filter, the stripe, a row's menu («Minta membaca lagi»); and the one dialog, started from the account menu («Keluar dari semua perangkat…») | Teacher | Floating layers and their shadow (5); the one dialog pattern, started from a menu (6); 4 px small controls (7); entering layers (8); the stripe in context (14) |
| J3 | Move between teaching and learning: «Mengajar» → «Belajar» → back | Educator who also learns | The distinct contexts (11); which shell each context wears (1); that the navigation never suggests a role the person does not hold |
| J4 | A lesson, a question and its result: on a 1366 × 768 shared computer and on a phone | Learner | The learner's top bar at every width (1); the question stem outside the ladder; one obvious next action; WCAG 2.2 AA with the skip link (10) |
| J5 | Set when material opens and closes for a class: the native date fields of «Siapkan» with the date in words beneath, a mistake, then the save | Teacher | Date fields (15); 3:1 field outlines and the error under the field (3); hover and press at 120 ms (8) |
| J6 | See what a learner sees: MODE PERAGAAN, and back | Evaluator (the demonstration room, ADR-0020) | The deep-ink context band, and no new hue (12) |
| J7 | Step away from a shared computer: the idle warning, the lock, the PIN | Any staff member | The identity screens together; entering layers and reduced motion (8); keyboard and screen reader (10) |

**What each journey records**, as pass or finding:
- one obvious next action on every screen;
- where am I: the navigation and the title agree;
- every action answered at once, then its result in words;
- nothing by colour alone;
- every target at least 44 px (24 px the floor), and no sideways scroll at 390 px;
- keyboard order and focus, a screen-reader pass, and reduced motion;
- anything that fights the content.

**The decision (8 Oct).** The definitions above are corrected to what PINTAR does («As composed»). Every finding is corrected at source, and every open question is decided within the approved grammar, under the owner directive of 8 Oct. None changes a ruled item: the staff navigation keeps its order and grouping (question 11); the rail only gains a hairline between its two groups.

### As composed (7 Oct)

Each journey is one card in «Composed journeys», with its record in its README. Where PINTAR did not do what a definition described, the journey shows what PINTAR does; the definitions above were corrected to match on 8 Oct (JQ1, JQ2, JQ5, JQ6).

| | Card | Screens | Where it differs from the definition |
|---|---|---|---|
| J1 | J1 · Publish, then make available | Studio → «Langkah menuju terbit» → «Terbitkan» → Terbit; then Kelas → Kelas 5A → «Siapkan» → «Sediakan» → Tersedia | A teacher cannot publish. The school publishes (CAN_PUBLISH: Admin sekolah and Admin platform), then a teacher makes the chapter available to a class. **JQ1** |
| J2 | J2 · A whole class, one learner | The class table → a row's menu → «Minta membaca lagi»; the account menu → «Keluar dari semua perangkat…» → the dialog | A teacher has no consequential act on one learner. The dialog is met on «Keluar dari semua perangkat». The product's three lists are one table, as the definition asks. **JQ2** |
| J3 | J3 · Teaching and learning | Kelas → Pembelajaran Saya → the course → back | None. Her own learning wears the staff shell, as the product does. **JQ3** |
| J4 | J4 · A lesson, a question, a result | Beranda → the lesson → a question (the focus shell) → the result | None. |
| J5 | J5 · The window's dates | «Siapkan»'s window: «Mulai», «Sampai», a mistake, the save | An Uji Cepat has no opening date: its window counts from the moment it is made available («Berhitung sejak disediakan»). The dates a teacher really sets are the window of «Siapkan». Its fields are dates only, as the product's are. **JQ5** |
| J6 | J6 · MODE PERAGAAN | The demonstration room → viewing as a learner under the band → leaving | MODE PERAGAAN is the evaluator's demonstration room (ADR-0020), not a teacher's mode. **JQ6** |
| J7 | J7 · Stepping away | Working → the warning at four minutes → «PINTAR terkunci» → a wrong PIN → back | None. Every word is Gate 6's, as built. |

### The records

Walked 7 Oct. The evidence:
- `render/laporan.txt`: axe, targets and sideways scroll on every screen at 1280, 1024 and 390 px.
- `render/jalan/`: the keyboard walk (`alat/jalani.mts`) at three widths, with motion on and then reduced. It lists every screen's Tab stops in order, and holds each screen's accessibility tree.
- The screen-reader check is a review of that tree. **It is not a screen reader.** A pass with NVDA or TalkBack belongs to the application pass, on the real screens.

| Check | J1 | J2 | J3 | J4 | J5 | J6 | J7 |
|---|---|---|---|---|---|---|---|
| One obvious next action | pass | pass | pass | pass | pass | pass | pass |
| Where am I | pass | pass | F8 at 1024 | pass | pass | F9 | pass |
| Every action answered, then its result in words | pass | pass | pass | pass | pass | pass | pass |
| Nothing by colour alone | pass | pass | pass | pass | pass | pass | pass |
| Targets 44 px (24 px floor) | pass | pass | pass | pass | pass | pass | pass |
| No sideways scroll at 390 px | pass | F7 | pass | pass | pass | pass | pass |
| Keyboard order and focus | pass | pass | pass | pass | pass | pass | pass |
| Screen reader (the tree) | pass | pass | pass | pass | pass | pass | pass |
| Reduced motion | pass | pass | pass | pass | pass | pass | pass |
| Anything that fights the content | F10 at 390 | C1 | pass | pass | pass | pass | pass |

- **Every F in the table is corrected at source (8 Oct), and C1 is in the copy owed (§4).** The records show the walk as it was found on 7 Oct.
- **Targets:** nothing is under 24 px. The 36 px buttons are the small size for rows, plus the top bar's «Keluar» (F13).
- **Keyboard:** the whole of each journey was walked by Tab, arrows, Enter and Esc alone. In every one of the 42 runs:
  - the skip link is the first stop, shows on focus and lands on the main region;
  - every stop shows its ring;
  - nothing hides under the sticky bar;
  - a menu opens on its first item, and Esc gives focus back;
  - the dialog opens on «Batal».
- **Reduced motion:** nothing moves under reduced motion. With motion on, only 120, 160 and 240 ms are used, with 8 px of travel at most. The working dot pulses, and stops under reduced motion.

### Findings

All corrected at source on 8 Oct. C1 and C2 are copy-table words, applied with the copy owed in the slices (§4).

| | Finding | Correction (done, 8 Oct) |
|---|---|---|
| F2 | The Table and Table rows specimens offer «Kirim pengingat», «Pindahkan ke kelas lain» and «Keluarkan dari kelas». A teacher can do neither of the last two, and PINTAR promises no notifications. | The row menu holds «Lihat bukti» and «Minta membaca lagi». The selection bar offers «Minta membaca lagi» for the selected learners. |
| F3 | «Uji Cepat dibuka» with a date and time, in the Date and time, Dates and Panel specimens. An Uji Cepat has no opening date. | Use the «Siapkan» window («Mulai», «Sampai») for dates. For an Uji Cepat, use its minutes («Berhitung sejak disediakan»). |
| F4 | The Lock screen and Idle warning specimens predate Gate 6. They use sample words («Buka PINTAR», «PIN (4 angka)»). The Lock screen rule says «No name on the lock», but Gate 6 names the staff member («Terkunci untuk …») and names no one for a class card. The rule asks for the consequence of a wrong PIN at every try; the product says it at the last try only (`kunci.tidak_cocok.1`). | Bring both specimens to the built words (`kunci.*`, `jaga.*`). The rule becomes: a staff lock names its owner; a class card's lock names no one. Keep the consequence at the last try, as built. |
| F5 | A teacher publishing to a class, in the App shell («Terbitkan Bab 4»), Confirmation and Specimen («Terbitkan Bab 4 untuk Kelas 5A?») and Action feedback specimens. Action feedback's result line («Bab 3 tersedia untuk 31 murid Kelas 5A mulai sekarang») belongs to «Sediakan». The README's own examples repeat it («Terbitkan Bab 4», «Keluarkan dari kelas» and that result line), and so does J1's definition above. | Publishing stays the school's, in Studio, and its result is «Terbit sejak …». A teacher's act is «Siapkan materi», then «Sediakan». J1's definition is corrected. |
| F7 | J2 at 390 px: the table scrolls in its frame with the name held still, as Table says, but each state is cut at the frame's edge, and a row's actions are reached only by scrolling the table sideways. | Under 640 px a state badge wraps, so the state is read whole. The actions stay in the scroll (Table: no card view). |
| F8 | J3 at 1024 px: the rail drops the group labels, so «Mengajar» and «Belajar» become one column of icons. | A hairline between the groups in the rail (JQ7). Order and grouping unchanged. |
| F9 | J6: inside the room, the page title is the learner's own («Belajar · PINTAR»). A screen reader moving between tabs is not told it is a demonstration. | While in the room, the title starts «MODE PERAGAAN ·». |
| F10 | J1 at 390 px: Studio's tabs hide «Bank Soal» and «Uji Cepat» past the edge, with nothing to show that more follow. | While more tabs follow, the row's edge fades, and the current tab is kept in view (Tabs). |
| F11 | The Confirmation rule asks for a question as the title and two actions. The product's review steps («Tinjauan sebelum disediakan», the assessment's «Kumpulkan») have neither. | The rule names its scope: Confirmation is a step after the act is pressed. A review that comes before the one act is a Panel holding the act; its way back is the back link («Kembali ke pilihan materi»). |
| F12 | Navigation, Identity and Learner shell say a learner is «never named on any screen». D-020 greets a learner by first name on Belajar and the home page. J4 and J6 follow D-020 («Halo, Bagas»). | Reword to: «never named in the bar; greeted by first name on Belajar and the home page only (D-020)». |
| F13 | The App shell's top bar draws «Keluar» as a 36 px small button. The Button rule allows the small size only in a table toolbar or a row. | The bar's «Keluar» at the default 44 px. |
| F14 | The Button rule asks for «a verb and its object». The copy table has bare verbs: «Terbitkan» (ruled in question 2), «Siapkan», «Sediakan», «Kumpulkan», «Tandai», «Lanjutkan». | A bare verb is allowed where the heading above it names the object (the «Terbitkan» step of a chapter; «Sediakan» at the end of «Siapkan materi»). Elsewhere the object is added («Tandai soal ini», «Kumpulkan jawaban»). |
| F15 | The Table specimen's count line is not announced, so a search's result is silent. The Search rule asks for a polite live count. | `aria-live="polite"` on the count, as J2 has it. |
| C1 | The dialog's confirm reads «Ya, keluar dari semua» (`akun.semua.ya`). The grammar's rule is a verb and its object, never «Ya». | «Keluar dari semua», as the Dialog specimen already writes it. |
| C2 | The publishing copy says «Siswa» and «menugaskan» (`studio.paket.terbit_bukan_tugas`, `studio.langkah.terbitkan.arti`). The teacher's screens say «murid» and «Sediakan». | «Setelah terbit, guru dapat menyediakannya untuk kelas mereka.» and «Menerbitkan belum menyediakan. Murid baru melihatnya setelah guru menyediakannya untuk kelas.» |

### Corrected while composing

These are defects against a component's own rule or against question 10. Each is corrected at source and listed here for Yazid's check.
- **Breadcrumb:** the «/» between places was read aloud. It is now drawn but not read (CSS alternative text).
- **App shell:** the main column grew 3 px past 390 px under a long place name («Pembelajaran Saya»). The column now holds its width.
- **Dialog:** under 640 px the actions did not stack as its rule says. They now stack, full width, with the safe one last.
- **The skip link** (new for question 10): it showed above the screen while hidden. Its parent now clips it until it takes focus.

### Decided within the approved grammar (8 Oct)

Put as questions on 7 Oct; under the owner directive of 8 Oct they are design execution, decided here.

| | Question | Decision |
|---|---|---|
| JQ1 | J1: in PINTAR, a teacher does not publish. Publishing (school, Studio) and making available («Siapkan» → «Sediakan», teacher) are two acts by two people. Confirm J1 as composed? | Confirmed. J1's definition and the F5 specimens are corrected. |
| JQ2 | J2: a teacher has no consequential act on one learner, so the one dialog is met on «Keluar dari semua perangkat», started from the account menu. The product has that act on «Akun saya» today, with in-page confirmation, which question 6 keeps as the default. Which do you want validated? (a) J2 as composed: in the application pass, the act moves into the account menu and asks in the dialog. (b) Keep it in-page, and validate the dialog on the school admin's «Kartu hilang atau rusak» (`aktivasi.ulang.*`), the nearest one-learner act. That needs a J2b, which I may not add without your word. Also: the product shows «Siapa yang sudah mengumpulkan» as three lists; here it is one table with a state filter, as the definition asks. Keep the table? | (a), and the table: the account menu holds «Keluar dari semua perangkat…», which asks in the Dialog (Identity). Alphabetical order keeps the table from reading as a ranking; the filter gives each list back. |
| JQ3 | J3: an educator's own learning stays in the staff shell (as the product does), not the learner's top bar.  | Confirmed. One person, one shell; the group labels carry the context. |
| JQ5 | J5: an Uji Cepat has no opening date, so J5 is composed on «Siapkan»'s window (dates only, no time).  | Confirmed. The F3 specimens are corrected. |
| JQ6 | J6: MODE PERAGAAN is the evaluator's demonstration room; a teacher has no such mode. The nearest teacher act is Studio's «Lihat seperti siswa» (a content preview), which wears no band. Confirm J6 with an evaluator? | Confirmed. Studio's «Lihat seperti siswa» stays without the band in 4.0. |
| JQ7 | F8: in the rail (1024 to 1279 px), «Mengajar» and «Belajar» lose their labels and merge. Add a hairline between the groups in the rail? This touches question 11. | Done: a hairline, no labels; order and grouping unchanged. |

## 2. The table stripe on real displays (question 14)

**What is checked.** Option A (`table-row-alt` = `surface-0`, 1.04:1 against white) must let a reader follow a long row on the displays schools really use. A+ (#F7F6F2) is not a token; it is shown only so this check can compare.

**Where.** The «Table rows» page holds the long class table in A, and three eight-row samples (A, A+ and B). To open it full screen:
- **The design-system HTML file:** «Components» → «Data» → «Table rows», then «Open alone in a new tab», then the browser's full screen (F11).
- **The Design System page:** the same page, opened alone the same way.

Row 17 of the long table is the 17th learner from the top, counting the header as row 0.

**On three displays**, each at its usual brightness and in its usual room light:
1. an ordinary school computer or laptop (for example 1366 × 768);
2. a poor display: an older or cheaper panel, or a laptop seen from an angle;
3. a classroom projector, from the back row.

**The test.** On each display:
- follow row 17 of the long table, from the name to the last column, without a finger or the pointer;
- then check that the row under the pointer and a selected row still read differently from the stripe.

**Decided (8 Oct): A stands.** Question 14 ruled A, with A+ only if A demonstrably fails on a real display. No failure has been shown, so A is final. The check below stays available as a field record: if a school display ever fails it, the A+ path in «The rule» applies, with no new ruling.

**The field record** (optional, one row per display):

| Display | Device and panel | Brightness | Room light | Row 17 followed, name to last column? | Pointer and selected rows read apart from the stripe? | A, A+ or B: which reads best here? |
|---|---|---|---|---|---|---|
| 1. Ordinary school computer | | | | | | |
| 2. Poor display | | | | | | |
| 3. Projector, back row | | | | | | |

**The rule.**
- **A is final** (8 Oct). If a reader cannot follow the row on a school's display, the next point applies.
- **A moves to A+** only if A demonstrably fails on one or more displays, and A+ passes there.
- Moving to A+ is then a token change: `table-row-alt` takes #F7F6F2, the contrast table is re-run, and every state is checked again.

## 3. Grammar gaps the closure register will need

For each item, the table says whether the ruled grammar already has the pattern it needs, or names the gap as a question. **None of these screens is designed here.** They are built in the slices after APPLICATION READY. The point is only that the frozen grammar does not leave them out.

| Item | Slice | What it needs | The grammar |
|---|---|---|---|
| CR-52 Bank Soal (D-123(1), deliberately small) | S7 | Filter or search; every applicable question reachable, with no newest-40 ceiling; one question shown with its key and each option's reason; read only | **Has it.** Search and a state filter (Table); every question reached through Pagination; one question opened in a Disclosure, with its stem (`t-stem`), the key as a badge with words and an icon, and each option's reason beneath. Read only: a line names the workbook upload as the way to correct. Its walk, S23q, stays red until S7. |
| CR-81 the class's population beside its bands | S6 | 30 learners → 6 assessed → 24 not yet; later 5 achieved mastery → 1 below threshold; «Belum mengerjakan» never a band | **Has it (8 Oct):** Progress's new «population» kind (GQ1). |
| CR-76 the referrer's waiting state | S6 | The referrer's case card with no control: another leader decides; when nobody can, it says so and points to the school admin | **Has it.** A Panel with a state badge («Menunggu keputusan», new) and the sentence (`pimpinan.menunggu_pemutus_lain`); no button. When nobody else can decide, an attention Alert with `pimpinan.belum_ada_pemutus_lain`. Words in §4. |
| CR-75 the integrity review names learners | S7 | The learner's name, the PINTAR ID secondary; a labelled note; a visible state | **Has it.** The name first, the PINTAR ID beneath in `t-identifier`; the note as a labelled field; the state as a badge with words. |
| CR-77 the referrer sees the outcome | S6/S7 | A school admin who referred sees receive → acknowledge → status → next step | **Has it (8 Oct):** named steps on the page the case was referred from (GQ2). |
| CR-78 «Laporan saya» by navigation | S3 | A link where the reporter's journey needs it | **Has it.** An item in the account menu (Menu: five or fewer), using the existing key `lapor.saya.buka`. With JQ2 (a), the menu holds «Akun saya», «Laporan saya», the language and «Keluar dari semua perangkat…». |
| CR-79 the audit trail in human words | S7 | Labels, the raw value beneath and secondary; CR-13's addresses never on school screens | **Has it.** Table rows with the label, and the raw value beneath in `t-identifier`. Keeping addresses off is a content rule: the screen reads no payload. |
| CR-41 with W-7, a transfer form | S7 | A form a person can fill in; the learner named, not an 8-character ID | **Has it.** Form layout; the learner picked by Search (name first, PINTAR ID secondary); in-page confirmation; the result line naming the learner and both schools. |
| CR-80 report templates told truthfully (no editor) | closed (D-123(6)) | The screen says what exists and what can be done | **Has it.** Text and an Empty state; a second save answered in words. |
| CR-13 correcting a staff email | S7 | From the people list, governed (D-120 QN1) | **Has it.** An item in the row menu (its words new) leads to a form page (the new address, the reason), with in-page confirmation and the result line. It is not the dialog: a dialog asks a short question and holds no form. |
| CR-51 the PINTAR library in Unggah's school list | slice | Last, never preselected | **Has it.** Select with no preselection (its empty first line in new words); the library is the last option. |
| CR-37 briefings removed (D-120 QN4) | S6 | The surface goes | **Has it.** Nothing to draw. |
| CR-46 honest empty states | S3 | No «(0/5)» card that promises figures | **Has it.** Empty state: what is missing, why, and what to do. |
| CR-27 the Uji Cepat score (D-120 Q8) | S6 | The class outcome primary, the learners a drill-down | **Has it.** The class figure in `t-stat` with its base («18 dari 31»); the learners in a Table one step below it. |
| CR-21 the staff Digital Card | S4 | The card as frozen (D-074) | **Has it.** Frozen; outside the screen grammar. |
| CR-22 the email system (D-079) | S4 | Every identity email in the final standard | **Has it (8 Oct):** D-079 is the email standard and the DAISY-19 frame its implementation; the design system refers to them (GQ3). |
| CR-03, CR-04 the certificate and its print | S8 | The frozen design (D-080), on screen and on one A4 page | **Has it.** Frozen; outside the screen grammar. |
| CR-06 «CLASSIC / MODERN / MINIMAL» | S8 | The picker goes; «Awalan nomor» stays | **Has it.** A Text field for the prefix; nothing to choose. |
| CR-07 the profile photo | S8 | A learner's own photo, profile only | **Has it (8 Oct):** the new File field component (GQ4). |
| CR-14 correcting a name | S7 | From the people list, with a reason and confirmation | **Has it.** As CR-13. |
| CR-05 revocation | S7 | A reason, a confirmation, the result | **Has it.** A form page with the reason, then in-page confirmation and the result. Not the dialog, which holds no form. |
| CR-54 the polish pass | all | The approved grammar on every screen | **Has it.** The whole grammar, once frozen. |
| CR-57 educator-as-learner polish | slices | Inside the slices | **Has it**, subject to JQ3. |

**Decided within the approved grammar (8 Oct)**

| | Question | Decision |
|---|---|---|
| GQ1 | CR-81: how a teacher reads a class's population beside its bands. The grammar has no pattern for it. | One sentence-like line of three counts above the bands, not a chart: «30 murid di kelas ini · 6 sudah mengerjakan Uji Penguasaan · 24 belum mengerjakan». The bands are headed by their own base («Hasil 6 murid yang sudah mengerjakan»). «Belum mengerjakan» is never a bar, a band or a band colour. When the pass mark is governed, «5 mencapai target · 1 di bawah target» sits inside the bands. Done: Progress's «population» kind. |
| GQ2 | CR-77: where a school admin who referred a case reads its outcome. /pimpinan refuses them. | On the page they referred it from (Studio's integrity review): the sitting carries the case's named steps and its state in words. No new place in the navigation. |
| GQ3 | CR-22: should the design system carry an email card (the frame, type and colour from the tokens), so the email system is frozen with the grammar? | No separate card: D-079 is the standard, and the DAISY-19 frame (`src/components/email/`) already uses the tokens' colour and type. The design system refers to it. |
| GQ4 | CR-07: a file field (pick, the file's name echoed, replace, remove), for the profile photo and for Unggah. | Done: File field, the native file input under a button, the chosen file named in words beneath. |
| GQ5 | CR-05 and CR-13: a consequential act that needs a reason. Should it be a form page with in-page confirmation, or the dialog with a field in it? | A form page. Question 6's dialog stays a short question with no form. |

## 4. The copy owed

The functional words are in the copy table today. These are the proposed final words. They are applied in the slices: changing `hle.ts` is code, outside this design-only batch.

**CR-50, the «Miskonsepsi» sheet.** Upload problems are read by a school's content author, row by row. Each sentence says what is wrong, then what to do, in the sheet's own column names.

| Key | Today | Proposed |
|---|---|---|
| `studio.paket.masalah.option_misconception_unknown` | Kode miskonsepsi ini tidak ada di lembar Miskonsepsi berkas ini. | Kode ini belum ada di lembar Miskonsepsi. Tambahkan kodenya di lembar itu, atau kosongkan kolom Kode miskonsepsi. |
| `studio.paket.masalah.misconception_code_invalid` | Kode miskonsepsi hanya boleh huruf besar, angka dan tanda hubung, 3 sampai 40 karakter. | Kode ini tidak bisa dipakai. Pakai huruf besar, angka dan tanda hubung saja, 3 sampai 40 karakter, misalnya SD5-M-B1-01. |
| `studio.paket.masalah.misconception_text_missing` | Nama, penjelasan dan cara membantu wajib diisi untuk setiap miskonsepsi. | Baris ini belum lengkap. Isi Nama, Penjelasan dan Cara membantu. |
| `studio.paket.masalah.misconception_repeated` | Kode miskonsepsi ini muncul lebih dari sekali di lembar Miskonsepsi. | Kode ini tertulis lebih dari sekali di lembar Miskonsepsi. Satu kode cukup satu baris; hapus baris yang kembar. |
| `studio.paket.masalah.misconception_definition_differs` | Sekolah Anda sudah memakai kode ini dengan teks lain. Pakai teks yang sama, atau beri kode baru. | Sekolah Anda sudah memakai kode ini dengan Nama, Penjelasan atau Cara membantu yang lain. Samakan teksnya, atau beri kode baru. |

**The downloadable template** has no «Miskonsepsi» sheet yet. Proposed:
- An optional sheet «Miskonsepsi», after «Pilihan», with the contract's four columns: Kode, Nama, Penjelasan, Cara membantu (`src/lib/unggah-kontrak.ts`).
- Each column carries its help text, as the other sheets do. «Kode» is formatted as Text.
- One line in «Cara mengisi»: «Lembar Miskonsepsi boleh dikosongkan. Isi bila sebuah pilihan jawaban menandai pemahaman keliru: tulis kodenya di sini sekali, lalu pakai kode itu di kolom Kode miskonsepsi pada lembar Pilihan.»

**CR-13, «Alamat email akun PINTAR Anda dikoreksi».** The owner's notice goes to the old and the new address. The admin's goes to PINTAR's security recipient.

| Key | Today | Proposed |
|---|---|---|
| `email.aman.email_dikoreksi.subjek` | Alamat email akun PINTAR Anda dikoreksi | Unchanged. |
| `email.aman.email_dikoreksi.judul` | Alamat email dikoreksi | Unchanged. |
| `email.aman.email_dikoreksi.isi` | Admin PINTAR mengoreksi alamat email untuk masuk ke akun PINTAR dengan PINTAR ID ini. Mulai sekarang email dari PINTAR dikirim ke alamat yang baru, dan semua sesi yang terbuka sudah ditutup. Password dan PIN tidak berubah. | Alamat email untuk masuk ke akun PINTAR dengan PINTAR ID ini sudah dikoreksi oleh admin. Mulai sekarang PINTAR mengirim email ke alamat yang baru. Akun ini sudah keluar dari semua perangkat; masuklah lagi dengan alamat yang baru. Password dan PIN Anda tetap sama. |
| `email.aman.email_dikoreksi.bukan_anda` | Jika Anda tidak meminta koreksi ini, segera hubungi admin sekolah Anda. | Bukan Anda yang meminta koreksi ini? Segera hubungi admin sekolah Anda. |
| `email.aman.email_dikoreksi.subjek_admin` | Alamat email sebuah akun dikoreksi | Unchanged. |
| `email.aman.email_dikoreksi.isi_admin` | Alamat email untuk masuk ke akun dengan PINTAR ID ini dikoreksi oleh admin platform setelah aktivasi. Alasannya dan kedua alamat ada di catatan keamanan. | Alamat email untuk masuk ke akun dengan PINTAR ID ini sudah dikoreksi. Siapa yang mengoreksi, alasannya dan kedua alamat ada di catatan keamanan. |

Why the changes:
- «Admin PINTAR» reads as PINTAR's own staff, but before activation the school admin corrects (D-120 QN1). «oleh admin» is true in both cases.
- «sesi» is not a word teachers use. «keluar dari semua perangkat» is the product's own (`akun.semua.*`).
- «oleh admin platform setelah aktivasi» is untrue if this notice is also sent for a correction before activation. Engineering to confirm when it is sent.

**CR-76, the referrer's waiting state.**

| Key | Today | Proposed |
|---|---|---|
| `pimpinan.menunggu_pemutus_lain` | Anda yang meneruskan kasus ini, jadi keputusannya diambil oleh pimpinan lain. Kasus ini menunggu keputusan mereka. | Anda yang meneruskan kasus ini, jadi pimpinan lain yang memutuskannya. Kasus ini menunggu keputusan mereka. |
| `pimpinan.belum_ada_pemutus_lain` | Belum ada pimpinan lain yang berwenang memutuskan di bagian ini. Minta Admin sekolah menunjuk kepala program atau dekan. | Belum ada pimpinan lain yang boleh memutuskan kasus di bagian ini, jadi kasus ini belum bisa diputuskan. Minta Admin sekolah menunjuk kepala program atau dekan untuk bagian ini. |
| new: the card's state | — | Menunggu keputusan |

**CR-81, the three population labels.**

| Key | Today | Proposed |
|---|---|---|
| `kesiapan.populasi.murid` | murid di kelas ini | Unchanged. |
| `kesiapan.populasi.sudah` | sudah mengerjakan Uji Penguasaan | Unchanged. |
| `kesiapan.populasi.belum` | belum mengerjakan Uji Penguasaan | belum mengerjakan |
| new: the bands' heading (GQ1) | — | Hasil {n} murid yang sudah mengerjakan |

Read together: «30 murid di kelas ini · 6 sudah mengerjakan Uji Penguasaan · 24 belum mengerjakan». The assessment is named once, and «belum mengerjakan» is the same words as the class's «Belum mengerjakan» list.

**C1, C2 and F14: words the journeys found.**

| Key | Today | Proposed |
|---|---|---|
| `akun.semua.ya` | Ya, keluar dari semua | Keluar dari semua |
| `studio.langkah.terbitkan.arti` | Setelah terbit, guru dapat menugaskannya ke kelas. | Setelah terbit, guru dapat menyediakannya untuk kelas mereka. |
| `studio.paket.terbit_bukan_tugas` | Menerbitkan belum menugaskan. Siswa baru melihatnya setelah Anda menugaskannya ke kelas. | Menerbitkan belum menyediakan. Murid baru melihatnya setelah guru menyediakannya untuk kelas. |
| `posttest.flag` | Tandai | Tandai soal ini |
| `studio.langkah.sibuk` (step 7) | Memproses… | Menerbitkan… (question 2), then «✓ Diterbitkan» |

## 5. Pending outside design

- **The wordmark master** (production). The steps, in order:
  1. Verify the font licence.
  2. Make the outlined master from licensed Helvetica Neue 65 Medium.
  3. Verify it optically: kerning and exact width.
  4. Measure the card's and the certificate's wordmark again (`merek-pintar.mts`; each at least 15 mm wide).
  5. Re-make the print proofs.
- **The physical proof** of the card and the certificate. Yazid's notes on the 0.75 mm gold line and the QR scans close it (D-074(12), D-080).

## The validation record

| Check | State | Evidence |
|---|---|---|
| J1 to J7, composed | **Done (7 Oct)** | The «Composed journeys» cards and their READMEs; `render/laporan.txt`; `render/jalan/` |
| J1 to J7: findings and questions | **Done (8 Oct):** corrected at source or decided within the approved grammar | §1, §3 and §4; the re-run checks in HANDOFF-DAISY-42 |
| The stripe | **Decided (8 Oct): A** | §2; the field record stays available |
| The wordmark master | Pending: licence verification | Production |
| The physical proof | Waiting for Yazid's notes | The card and certificate round 2 READMEs |

## The gate to the application pass

The application pass («Proposal and rulings», «The application pass») starts only when all of these hold:
- the authorised UI/UX stage has begun, after Engineering Complete;
- the journeys have been composed and their findings corrected (done, 8 Oct);
- the stripe is decided (done: A).

Until then, nothing is propagated to PINTAR's application, its sidebar included.
