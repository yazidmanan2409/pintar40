# Design fidelity check: built reports and first-time journey (7 Nov)

**From:** Daisy (UX-1). **Read against:** the approved specimens in this folder.
- Reports: `origin/claude/awesome-rubin-bqxp6p` at `d283126c` (`KomposisiKelas`, `KisiTopik`, `KomposisiSekolah`, `.pin-lk*`). They were rendered with the specimen figures at 1280 px, 390 px and A4.
- Journey: `main` at `002852ab`, read from code, because staging is not reachable from the design lane.

This note lists deviations only. It adds no requirement. **PASS** means the item matches.

| # | Screen / report | Actual deviation or usability defect | Expected approved behaviour | Smallest correction |
|---|---|---|---|---|
| 1 | All three reports · the lead | `{daftar}` is joined with «; »: «Penjumlahan dan pengurangan pecahan; Pecahan campuran» | A spoken list: «A dan B», or «A, B, dan C»; «serta» before the last item when a name already contains «dan» | One list helper (the specimens' `daftarKata`) for `topik_di_bawah`, `kisi.pola` and `sekolah.perhatian` |
| 2 | All three reports · tiles and sections | `actionText` advice lines appear and are wrong for their metric. C/Kenaikan: «Tidak perlu diulang — lanjutkan ke materi berikutnya», which contradicts A. Soal wajib: «Fokuskan waktu tambahan … dua tingkat kesiapan terbawah». B: unquoted band names | No advice lines. The remedy lives only in D («Saran penanganan:») and in «Apa berikutnya» | Remove the `data-lk-tindakan` lines (6 call sites) |
| 3 | All three reports · print | No @page header or footer. The body stays a grid. The off-white ground prints. Guru B's heading is separated from its chart, leaving a blank | G-05: the header shows the wordmark plus «report · place · period»; the footer shows «Halaman n dari m»; the body prints as blocks on white; a heading is kept with its chart | Port the specimens' `@page` rules and print block to `.pin-lk`; add `break-after: avoid` on the heading together with `break-inside: avoid` on the chart |
| 4 | All three reports · section letters | The letters are `aria-hidden`. On `/pimpinan` only A is lettered | The letters can be read («Bagian C») and run A… down the page (G-02) | Drop `aria-hidden`; letter every section in `/pimpinan` |
| 4c | All reports · below-target marks (7 Nov, owner: «explain once») | «di bawah target» or «Perlu penguatan» is printed under every amber value and in every amber grid cell | Each value keeps its percentage, its bar or dot, and amber. The words go once in the figure legend: «Angka berwarna jingga menunjukkan penguasaan di bawah target.» and, where a cell can be empty, «Tanda — berarti data belum cukup.». Each amber value carries the same words for assistive technology only. In greyscale, the bar or dot still stops short of its line (specimens corrected) | In `KomposisiKelas`, `KisiTopik` and `KomposisiSekolah`, replace the visible per-value label with a `pin-sr` span and put the two legend sentences under the figure. No value, threshold or calculation changes |
| 5 | Ringkasan Kelas (Guru) · E | «Murid yang perlu penguatan» is missing | Owner decision: named learners within the teacher's access, with «N dari 20 soal tepat», «Pelajari lagi» and «soal wajib belum tepat» | Add section E as in `2-guru.html` (it reads `learner.result` for the teacher's own class) |
| 6 | Ringkasan Kelas · B | No dot strip, one dot per student. The legend reads «Mantap 17» | The strip of the actual class distribution; «Mantap 17 murid (59%)» | Add the strip; put «murid» and the share in the legend |
| 7 | Ringkasan Kelas · C | One number, with no before→after pair | The before→after average pair over the same base | Add the pair row (two values, as in the specimen) |
| 8 | Ringkasan Kelas · D | The remedy is 12 px with no label | «Saran penanganan:» label, 14 px | Use the label and `--t-small` |
| 9 | Ringkasan Kelas · «Angka lain» | An extra «Peserta 29» tile repeats the population line, and its value is unstyled (14 px, not the stat size) | No duplicate. Where shown, the value uses the stat size | Drop the Peserta tile when the population line is drawn; give `.pin-lk-angka-nilai` to the remaining values |
| 10 | Ringkasan Kelas · A, chart | The «Target 75%» label sits on its own row under the 0/100 ticks | The label sits on the scale at the target line | Place it in `.pin-lk-skala-garis` at the target position |
| 11 | Ringkasan Kelas · not enough evidence (2b) | «Belum cukup data… Sekarang 4 murid; perlu 5…» is repeated four times (A, B, C, E). The opening says nothing about what is missing | One lead: «Baru 4 dari 33 murid mengerjakan Uji Penguasaan…; angka kelas muncul setelah paling sedikit 5»; then each figure on one short line; «Tidak ada yang perlu dilakukan sekarang» | When every figure is gated, draw the 2b lead once and collapse the repeats to one line each |
| 12 | Kisi topik × kelas (Kadep) · screen | **PASS**: values, mini bars, target ticks, amber with words, zebra | — | — |
| 13 | Kisi topik × kelas · a class without evidence | «Belum cukup bukti» is repeated in every cell of 7E, under a header that still says «Target 75%» | One note in the column header; «—» in the cells | The header note plus «—» |
| 14 | Kisi topik × kelas · bases | There is no «n dari m murid» per class and no Kenaikan row | «n dari m murid» under each class; the Kenaikan row at the foot | Add both rows from the existing envelopes |
| 15 | Kisi topik × kelas · 10 classes | axe `scrollable-region-focusable`. On A4 the header breaks up («Kelas / 7E / Target / 75%») and «di bawah target» wraps | A focusable, labelled scroll region. On paper: a fixed name column, with the header and cell words kept whole | `tabindex="0" role="region" aria-label` on `.pin-lk-kisi-wadah`. In print: `table-layout: fixed`, a 12rem first column and `white-space: nowrap` on the header and «di bawah target» (a landscape page only if 10 classes still do not fit) |
| 16 | Ringkasan Sekolah (Dekan) · chart, cohorts, certificate and gerbang bases, colour | **PASS**: sorted dots, boundary-safe 59,6%, amber with words, zone legend | — | — |
| 17 | Ringkasan Sekolah · lead | The lead omits Kenaikan and the band, and there is no «6 dari 8 ranah…» sub line | Lead and sub line as in `4-dekan.html` | Add the sub line; join with the list helper (#1) |
| 18 | Ringkasan Sekolah · «Kesiapan bukti» | The section is replaced by a pointer to Pimpinan | The section as in `4-dekan.html` (classes whose evidence is not yet enough) | Draw the section from the readiness envelope already used on `/pimpinan` |
| 19 | Murid · learner overview | **PASS** (owner approved; `1-murid.html`) | — | — |
| 20 | Admin · Konfigurasi | **PASS**: «Yang menunggu» is built into Konfigurasi (`config.menunggu.*`); there is no second dashboard. *Specimen corrected:* report 7 now shows the shipped multi-class cards («Beberapa kelas sekaligus»), with no proposal frame | — | — |
| 21 | Admin · Aktivasi, several classes | The excluded students are named by reason only (`aktivasi.kelas.banyak.dikecualikan`), with no count | H30: «show how many are selected, eligible and excluded, and why» | Put the counts into the excluded sentence («Tidak termasuk: 3 … dan 2 …») |
| 22 | Fasilitator · catatan PD | **PASS** in the build (no headline). *Specimen corrected:* «10 dari 12 peserta sudah mulai; 6 sudah selesai» removed; the lead names who has not begun (D-069(b)) | — | — |
| 23 | Peserta PD · «Tentang hasil ini» | *Specimen corrected:* the visibility sentence left out Admin sekolah, and «siapa pun selain Anda» claimed more than the ruling says | D-069(b): the facilitator, the responsible Kepala departemen and the Dekan; Admin sekolah sees enrolment, participation and completion only; other Guru see nothing | Engineering: use the corrected sentence when this page is built |
| 24 | `/masuk` · sign-in | **PASS**: one primary action per state, a named turning, language before sign-in, no name shown on a shared device | — | — |
| 25 | `/mulai` → landing | **PASS**: one context goes straight to its home; several contexts go to the chooser | — | — |
| 26 | `/` chooser · head | The head line is a plain «PINTAR» text eyebrow, signed in and signed out | E2 §1.1: the wordmark at the start of the head line | `<MerekPintar />` in place of the `app.name` paragraph |
| 27 | `/` chooser · reason and place question | The reason and `context.choose_place` share one plain `<p role="status">` | The reason is an info alert above the doors; `choose_place` is the h2 that names the door list | Split them: `pds-alert-info` for the three reasons; an `h2` (with `aria-labelledby` on the list) for `choose_place` |
| 4b | All reports · section A heading (7 Nov, owner) | A's letter and title sit inside its card, at 16 px `ink-2`, unlike B, C and D | One heading grammar for every section: the letter and title outside the card, 22/28 600. A's summary and its rows stay in the card (specimens corrected) | In `.pin-lk`, render A's heading before its card, as for the other sections; delete the smaller A-heading override |
| 28 | `/` chooser · doors | **PASS**: 64 px tall, 12 px gaps, purpose 18/26 600, place 14/20, current door marked four ways | — | — |

**Changed in the lane today:** specimens 5, 6 and 7 as described in #20, #22 and #23; every specimen's section A heading (#4b); the below-target labels (#4c). They were rebuilt with `buat-contoh.mts`. Nothing else in the dataset or the metrics changed.

## X5 · Ringkasan Kelas of a PD class (D-196), read against `6-fasilitator.html`

Checked against `fa76781b`. `KomposisiPengembangan` was rendered with specimen 6's twelve participants, with full and completion-only columns, at 1280, 390 and A4. axe reported no violations at 1280, and there is no sideways page scroll at 390, where the table scrolls inside its labelled region.

**The two grammar questions**
- **Q1, the owner's sentence:** neither the alert nor the lead. It belongs in the scope line under the h1 (`pin-intro`), the slot where the academic Ringkasan Kelas states what its figures cover. An info alert signals a state the reader must notice. This is the ordinary nature of the class, and the alert's coloured box is the heaviest thing above the record. The lead stays Section A's own sentence (who has not begun). Keep the words verbatim.
- **Q2:** nothing goes between the frame and A, and the sentence takes no letter. Letters name sections a reader refers to («lihat Bagian A»), and a scope line is not one.

| # | Where | Deviation | Expected (approved) | Smallest correction |
|---|---|---|---|---|
| X5-1 | Frame | The owner's sentence sits in `pin-banner pin-info` | The scope line under the h1 | `<p className="pin-intro">` with the same key; remove the banner |
| X5-2 | A · lead | «Belum mulai: Gilang Ramadhan, Imam Syafii.» | «Gilang Ramadhan dan Imam Syafii belum mulai.», with the list joined as in #1 | Reword `pengembangan.belum_mulai` to «{daftar} belum mulai.» and use the list helper. This is a grammar change; send it to Dr Gladys if the key counts as copy |
| X5-3 | A · not-done mark | An open circle | A short dash, matching the legend «Tanda —: belum ada.» (the open circle is not in the legend) | Draw `.pin-lk-tanda:not([data-selesai])` as a 10 × 2 px dash in `ink-3` |
| X5-4 | A · mark and word | The mark wraps away from its word («○ / Belum», «○ / Belum dikerjakan») at 1280, 390 and A4 | The mark and its first word stay on one line (D-172 K3) | Wrap the mark and its word in one `white-space: nowrap` span |
| X5-5 | A · Hasil | «Tercapai · 85%» | «Tercapai» / «Belum tercapai» in words, with no percentage | Drop `format.percent` in that cell. If the percentage is intended (D-069(b) allows the facilitator to see it), that is a change to the approved composition and goes to the owner |
| X5-6 | A · table | 16 px cells, separated tiles with gaps, and every two-word status wrapping onto two lines | 14 px rows with hairline dividers and the DS stripe, as in specimen 6 | Give `[data-pd-paket] .pin-lk-kisi-tabel` the record-table style (`--t-small`, `border-collapse: collapse`, `table-row-alt`) instead of the numeric grid's |
| X5-7 | A4 | Page 1 holds only the frame and the sentence. All of A moves to page 2, leaving page 1 blank under the sentence | A starts under the frame. The table may break between rows, with its thead repeated | In print, `break-inside: auto` on the A card and on `[data-pd-paket]`, and `break-inside: avoid` on `tr` only |
| X5-8 | A4 · headers | **PASS**: the headers wrap between words («Sudah / mulai», «Pelajaran / selesai») and no word breaks mid-word. This applies equally to `/pengembangan/[kelas]`, which uses the same rules | — | — |
| X5-9 | Refused reader or empty class | **PASS**: one line in words. Nothing implies figures will come | — | — |

### X5 · owner ruling (7 Nov): all nine approved; the corrections, prepared and verified

The owner approved X5-1 to X5-9 as presentation corrections: X5-2 in the natural sentence, and X5-5 with the percentage removed. No escalation is needed.

This lane does not commit to `src/`, so the corrections come as one patch against `fa76781b`: **`X5-koreksi.patch`** (5 files, +41 −15). Engineering applies it on `claude/awesome-rubin-bqxp6p`, and Second Eye verifies it there.

| # | Correction in the patch | Verified here |
|---|---|---|
| X5-1 | The owner's sentence as `<p className="pin-intro">` under the h1, verbatim. The alert is removed; there is no letter | Rendered (`render/x5-*`) |
| X5-2 | `pengembangan.belum_mulai` = «{daftar} belum mulai.», with the list joined by `daftarKata` («Gilang Ramadhan dan Imam Syafii belum mulai.») | Rendered; test updated |
| X5-3 | A not-yet step is a 2 px dash in `ink-3`, with its words in `ink-2` | Rendered at 1280, 390 and A4 |
| X5-4 | The mark and its first word in one nowrap span; «n dari m» whole | Rendered; no mark is separated from its word |
| X5-5 | Hasil shows «Tercapai» / «Belum tercapai» only; with no decision it shows «—» | Rendered; test asserts no `%` |
| X5-6 | The record table at `--t-small`, collapsed borders, hairline dividers and the DS stripe | Rendered |
| X5-7 | In print, the section, card and table may break between rows; each row stays whole and the thead repeats. Print measures (8.5 pt, 2 × 1.6 mm) keep seven columns inside the card | A4: page 1 carries the frame and twelve rows; page 2 repeats the header row |
| X5-8 | Header wrapping (engineering's own fix) kept | A4 PASS |
| X5-9 | Unchanged | PASS |
| + | `.pin-actions + .pin-lk` margin `--space-7`: a report's first section stands clear of «Cetak laporan». This is shared with the academic Ringkasan Kelas, which had the same tight gap | Rendered |

**Checks run on the patched tree:**
- `tsc --noEmit`: clean.
- `LAPORAN-KELAS-PD-01` and `LAPORAN-FASILITATOR-01`: PASS, updated to the approved behaviour.
- Full `selftest`: 420 passed and 2 failed. The two failures, `UX1-S0-MUAT-01` (needs `next build`) and `BOB26-K01` (needs `CARD_PEPPER`), fail identically on the unpatched `fa76781b`, so they come from this environment, not the patch.
- axe at 1280: no violations.
- 390 and 1280: no sideways page scroll.

**Not verified here, so not yet resolved:**
- The running application, signed in as the facilitator, the Kepala departemen, the Dekan and Admin sekolah. That needs staging or a local stack with Supabase, which the design lane cannot reach. The renders use the page's own frame components (`KepalaCetak`, `BarisLingkup`, `AksiLaporan`) and the built `KomposisiPengembangan`; only the session shell is absent.
- The DB suites (F33-P01 among them), which were skipped for lack of a database.

Each X5 row is **resolved** only after engineering applies the patch and Second Eye confirms the C12f2 walk (`c12-x5-*`) and the A4 print on the real pages.
