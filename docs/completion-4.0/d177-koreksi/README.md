# D-177 corrections: design-found inconsistencies corrected at the source (4 Nov 2026)

**Authority:** D-177 (the owner's continuous-execution directive), D-168 (cross-component integrity), D-172 / D-173 (one experience).

**Where:** the development branch `claude/awesome-rubin-bqxp6p`, from `eeb7dbe9` to `10e6868d`. There is no merge, no staging migration and no production change. No migration was added.

**How each item was done:**
1. Trace the item to its root cause.
2. Correct it in the shared component or rule, not on one screen.
3. Add a `D168-*` regression test, shown red on the old source (`git stash` of the fix) and green on the new.
4. Run the full static suite.

The register is `../daisy-design-completion/06-ENGINEERING-ITEMS-FROM-DESIGN.md`.

## 1. What was corrected

| Item | Root cause | Correction at the source | Test |
|---|---|---|---|
| **E-C2-1/2/3** (PD «Lihat bukti») | The page was the academic class page, with no notion of the class kind | One rule, `adaBuktiSoal(jenis)`, both offers «Lihat per soal» and opens that page. A PD class is never asked for class metrics; it shows one statement and a link to the record, no footnote (D-069(c)), and «Lihat nama peserta». A participant has no academic per-learner page, and roster names link only for learners | D168-C2-1, D168-C1-1 |
| **E-K7** (eyebrow) | Konfigurasi and Studio drew «PINTAR» as an eyebrow inside the shell | No shelled page draws the app's name | D168-K7-1 |
| **E-K2** (pagination) | There were two pagers. `Penomoran` said «Kembali», hid «Sebelumnya» on page 1 and had no count | `Penomoran` now renders the Collection's pager: «Menampilkan 21–40 {benda}», «Halaman n», «Sebelumnya» disabled on page 1. It shows a total only where the list already has one. It is its own container, so it folds at 320 px, and it draws nothing for a single page. The 10 lists each pass a noun, a count and the reader's language (3 lacked the language) | D168-K2-1 |
| **E-K1** (back links) | Six keys read only «Kembali» | Each link is named by its destination, from one place table (`src/lib/nama-tempat.ts`) that the navigation also reads. A history-back is declared and named «Kembali ke halaman sebelumnya». Found on the way: six Mengajar refusals that return to a class page were labelled «Mengajar» | D168-K1-1, D168-C1-1 |
| **E-K3** (✓ alone) | The save-result line shared `.pin-hasil` with the learner's result card, a grid | The card is now `.pin-capaian`, and the result line has no layout rule of its own | D168-K3-1 |
| **E-A2-1** (Uji Cepat title) | The database stamps «Uji Cepat — 2026-11-02 20:26» (one language, raw date), and the result page added «Uji Cepat ·» on top | One helper, `judulAsesmen`: «Uji Cepat · 2 Nov 2026, 20.26 WIB», in the reader's language, on all four surfaces | D168-A2-1 |
| **E-K9** (fixed dates) | Siapkan showed disabled native date fields after «Disediakan» | The shared date field draws a fixed value as the date helper's words in an `<output>` | D168-K9-1 |
| **E-K8** (step markers) | Studio's steps were rings and read as radio buttons | Each step is now a segment of progress over its word | D168-K8-1 |
| **E-C1-6, E-C1-2** | `/pengembangan` and `/lapor` chose their shell from role names; the class report spoke the teacher's words to every reader | Both are chosen by the working context (`cangkangStaf` takes the context), so a teacher who is also an administrator, working in Mengelola, gets Konfigurasi's shell | D168-C1-1 |
| **E-C1-4** | The record's refusal fell back to the generic line | `pengembangan.ditolak` (words pending Dr Gladys) | D168-C1-1 |
| **E-C1-1/3** | Entries were drawn by `label_key ? s(label_key) : ""`, which gave an empty `h2` or the copy table's dash | One helper, `labelMetrik`, on six surfaces: «Ukuran ini belum punya nama» when there is no label. All 34 metric keys in the migrations and the seed have copy | D168-C1-2 |
| **E-A1-1** | The question loader read neither difficulty nor misconception | The loader reads the band (never the number) and the misconception's name, both under the reader's own row security | D168-A1-1 |
| **E-D2-1** | The PDF name could hold `/ \ : * ? " < > \|` and had no length cap | `namaBerkas` replaces those characters and caps the name at 150. The tab title also returns after a cancelled print | D168-D2-1 |
| **E-B1-4** | Daisy's proposed pseudo-element rule has no effect in Chromium (probed) | The field carries the ring while focus is within it but not on it (`:focus-within`, probed) | D168-B1-4; renders `e-b1-4-*.png` |
| **E-C1-5** | The record's footer sat inside `main`, without `pin-noprint` | The footer moved outside `main`, as on the report pages. The A4 walk gains P5: a PD class is made by the product's own functions, and the facilitator prints the record | `audit/b6-cetak.mjs` P5; `e-c1-5-pengembangan-cetak.png` |
| **E-K4** (result away from its action) | A result knew its section but not the form or row that sent it. 12 cases were found, plus answers that no page read | `queryHasil` now carries the origin (`asal`), the row (`baris`) and the list's page. `HasilDi` and Konfigurasi's `result()` answer each one at its form or row. Answers that were never drawn are now drawn: package-less Studio refusals, `?galat=baris`, `izin-*`, `koreksi-*`, and the certificate's context refusal | D168-K4-1 |

**Kept as designed** (E-K4 audit):
- the Uji Cepat refusal returns to the choices it is about (BOB-34; DAISY-27);
- a passed JSON check answers at the top of the next step's panel (W1.4).

## 2. Tests restated (same strictness, the ruled direction)

| Test | Why |
|---|---|
| STUDIO3B-* (i18n), L4F6-K01, B4-HAL-K01 | the one pager |
| HOD09-K01, B5A-LAPORAN-K01, DAISY-07-LAPORAN-01 | the history-back is named; the class report's persona comes from the context |
| M4-K01 | only a learner's name links to a per-learner page (E-C2-1) |
| B6C-PRINT-01 | the sanitised PDF name |
| BOB19-K01, B5-CABUT-K01 | the actions carry their form |

## 3. Verification

**Static suite** (local, every static id): green at each commit.

The database-state ids (F05-T20, TOUR-P01, F22-K01, D101-D01, D102-D01, F04-T11) fail only after a local walk has written to the stack, and pass from a reset. F22-K01 names the cause: P5's PD enrolment of alpha-hod and alpha-dean.

**CI and journeys on `947b9a9`:**
- `ci` 41773400465 passed.
- Journeys 41773392540: job B passed. Job A failed twice on one defect of E-K2: the pager outside a Collection did not fold at 320 px (`/aktivasi` 471 px, sysadmin `/konfigurasi` 443 px).
- Fixed in `10e6868` (the pager is its own container) and asserted in D168-K2-1.

**On `10e6868` and after:** §4.

## 4. Results on `10e6868`

**CI:** `ci` 41777538854 passed.

**Journeys** 41777542062: job B passed. Job A failed one check, B5-W2 («/studio/integritas: skip link first ((body))»); see §4b.

**Job A's walks, run locally on a reset stack against the build of `10e6868`:**

| Walk | Result |
|---|---|
| Studio | 18/18 |
| Administration | 11/11 |
| Batch 5 (B5-W3 included, the 320 px case that failed in CI on `947b9a9`) | 6/6 |
| Print, including P5 | 5/5 |

The crawl could not run locally, because this stack's Auth does not pass the device screen; CI's journeys cover it.

## 4b. Final verification on `f5331f0d`

| Run | Result |
|---|---|
| `ci` 41785462493 | passed |
| Journeys 41785465947 (job A, every walk; job B, Gladys's path) | passed |

Two failures were corrected on the way. Both were in the checks, not in the application:

1. **DAISY-07-LAPORAN-02** (CI on `c2d1f399`), corrected in `79041eb9`.
   - H9 made each report link name where it came from (`&dari=konfigurasi`, `&dari=pimpinan`). The test's link patterns ended at the id. They now require the origin, which is stricter.
   - Pimpinan's class disclosures are streamed in parts, so in the raw HTML a class's link can sit outside its `<details>`. The test now reads each page through `tersusun()`, as the suite's other readers of rendered pages do.
2. **B5-W2** (journeys on `10e6868` and `c2d1f399`), corrected in `f5331f0d`.
   - The walk opens `/studio/integritas#ditinjau`, and its keyboard check reloaded that address. The fragment puts Chromium's sequential-focus starting point at «Sudah ditinjau», and nothing focusable follows it.
   - Probed on the local stack: with the fragment, the first Tab left the page in 2 of 6 loads; without it, the skip link came first in 6 of 6.
   - The check now loads the page without its fragment, as its comment says. The skip-link requirement is unchanged.
   - `c2d1f399` had attributed the failure to BarisHasil's `scrollIntoView`. The reload being checked carries no result, so that diagnosis was wrong, and the change is reverted in `f5331f0d`.

## 4a. Daisy's engineering hand-off (`SERAH-TERIMA`, `ux-1/daisy-experience` at `5a661b6e`), reconciled

| Rows | State |
|---|---|
| H1, H3–H7, H10–H12, H16, H20, H23, H25 | Already corrected under D-177 (§1) |
| H2, H9, H17, H19, H24 | Corrected in `24c33365` |
| E3 #3, #4, #12, #15 | Corrected in `24c33365` |
| H8 | Already correct as built (`MenuAkun`); nothing to change |
| H21 | Done for every surface except the class report on a PD Kelas, which waits on the owner's ruling on whether such a report exists (open item 7 from verification round 2) |
| H13, H14 | Built with E1 + E2 (§4c) |
| H15 | NVDA and TalkBack need devices |
| H18 | The seed school's name waits on Dr Gladys (question pack A8) |
| H22 | X12 T2–T5 wait on Dr Gladys and the owner |

The test is D168-SERAH-1, red on the old source and green on the new.

## 4c. E1 + E2: the integrated navigation (`b03dbba5`)

E1 is accepted (D-170(c), with the correction accepted in D-171(a)). E2 is structurally accepted (D-169(c)). O12 is ruled (D-170(d)). D-177 asks for continuous execution within that approved scope. All of it is built in the shared shell, so every staff surface inherits it.

| Part | Built |
|---|---|
| The rail (E-E1-1, H13) | 72 px by default from 1024 to 1279 px. Each link keeps its own word as its name, visually hidden: never `display: none`, no `aria-label` or `title`. The tooltip is the same word, `aria-hidden`. It shows only while the shell is the rail (the rail's state, not the label's CSS), at once on keyboard focus, and Escape dismisses it. Every place has an icon (Sertifikat sekolah had none and was blank in the rail). |
| Collapse | At 1280 px and up the reader collapses to the rail; in the rail range they expand it. The toggle names the state it offers («Ciutkan navigasi» / «Lebarkan navigasi», `aria-expanded`), read from the rail's own state, and stays hidden until it knows that state. Only a departure from the width's default is kept, per device. |
| The context control (E2) | The navigation's first part: the purpose's short name (G1's slot for Mengelola draws nothing yet), the place, and «Mau ke mana hari ini?» only for a person with another context. In the rail it is one item, named «Mau ke mana hari ini? · purpose · place». |
| O12 order (H14) | The shell sorts its items in the DOM by one table, `URUTAN_TEMPAT`. **Found on the way:** CSS `order` had drawn «Seluruh platform»'s places in O12's order, while the keyboard reached Kirim email uji before Keamanan akun (WCAG 2.4.3). |
| Under 1024 px | «Keluar», then «Buka menu». The drawer is a modal: focus moves in, the page behind is inert, and Escape or «Tutup menu» returns focus to the button. **Found on the way:** the script-less checkbox was a Tab stop at 1024 px and wider, where it did nothing; it now serves only until script loads. |
| The chooser's door (E2) | Purpose and place on two lines. The current door is marked by a check, the primary edge and ground, and `aria-current`, not by weight. |

**Tests:** D168-E1-1 and D168-E2-1, red on the old source and green on the new. The browser walk `audit/e1-navigasi.mjs` (E-E1-2) covers six people and contexts and eight widths: transitions, the places and their order, the chooser, the rail and its names and tooltips, axe in the rail, collapse, the drawer, and a page of another context. It passed 13/13 locally and now runs in the journeys. Job A's other walks pass locally on a reset stack: Studio 18/18, administration 11/11, Batch 5 6/6, print 5/5, focused checks 2/2.

**CI and journeys:** `ci` 41809279563 passed on `d3167b93`; the first CI run on `b03dbba5` failed only lint (`prefer-const` in D168-E1-1), corrected in `d3167b93`. The journeys 41808716931 passed on `b03dbba5`, job A's new walk «the integrated navigation (E1 + E2)» included; `d3167b93` changes only that test file.

**Still required:** the NVDA and TalkBack passes on the rail (H15; E1 §9 [manual]). They need real devices.

**For Daisy:** what the phone bar names.
- E1 §1 and its 390 px walk name the school.
- The design system's AppShell (`bundle.js`) and D-140 RV-4, which a test enforces, name the current page.
- The build keeps the page, since E1 says the AppShell is unchanged, and the school heads the opened menu.

**Words:** «Ciutkan navigasi», «Lebarkan navigasi», «Buka menu» and «Tutup menu» are the design system's approved shell words (J3, question 1). Per E1 §5 they enter the copy table with the build.

## 5. Copy pending Dr Gladys (added under D-177; listed for the question pack)

| Key(s) | Words |
|---|---|
| `koleksi.menampilkan_tanpa_total` (B6), `koleksi.posisi.terbuka`, `koleksi.benda.*` | the pager's count line, position and nouns |
| `kembali.riwayat` | «Kembali ke halaman sebelumnya» |
| `laporan.metrik.tanpa_nama` | «Ukuran ini belum punya nama» |
| `pengembangan.ditolak` (B10) | the record's refusal |
| `mengajar.bukti.siapa_peserta`, `mengajar.bukti.pd.arti`, `mengajar.bukti.pd.buka` (B11–B13) | the PD «Lihat bukti» page |
| `studio.soal.miskonsepsi` | «Pemahaman keliru» |
| `pendataan.buka.gagal` | the intake file that would not open |
