# Reverse reconciliation: every accepted design's «[auto]» line against the code (D-179(e), D-180) · 4 Nov 2026

**What was read:**
- every «[auto]» acceptance line in Daisy's accepted designs on `ux-1/daisy-experience`: A1–A5, B1, B2, B4, C1 (README and PIMPINAN), C2, D1 (README and STEP-2), D2, D4, D5, E1, E2, E3, SERAH-TERIMA and X-KONSISTENSI;
- each line checked against the test or walk that should hold it, by reading the assertion, not the test's name.

**How:**
- read in three parallel reads at `e7f43ae7`;
- every defect claimed was then checked against the code before anything was changed. Two claims were not defects; they are in §3.

## 1. The count

**Corrected (D-181 closure):** there are **131** acceptance lines, not 138. Two lines first counted were mentions of «[auto]» inside other text, not acceptance lines: a «[manual]» line in C1's `PIMPINAN.md`, and a sentence in X-KONSISTENSI about other designs' checklists. The third group was also first summarised as 45 when its table held 38 lines. The numbers below are counted line by line.

| | Lines | HELD | PARTIAL | NOT HELD | BLOCKED |
|---|---|---|---|---|---|
| **At the reconciliation** (`e7f43ae7`) | **131** | **46** | **64** | **16** | **5** |
| A1–A5, B1 | 47 | 19 | 22 | 5 | 1 |
| B2, B4, C1 (README and PIMPINAN), C2, D1 (README and STEP-2) | 46 | 15 | 24 | 6 | 1 |
| D2, D4, D5, E1, E2, E3, SERAH-TERIMA | 38 | 12 | 18 | 5 | 3 |
| **After the closure** (§6) | **131** | **90** | **31** | **0** | **10** |

**What the classes mean:**
- **PARTIAL:** part of the line is asserted.
- **NOT HELD:** no test asserts the line.
- **BLOCKED:** the line waits on a named decision (K1, K3 or K4).
- B4 and C2 are counted as held where a test holds them, but their designs are still under review (K3).

**What the first count said, and still says:** CI was green throughout, yet only 46 of 131 accepted lines were fully held. «A passing CI run is not proof that every approved requirement has been implemented» (D-180).

## 2. Defects found, and corrected (each with a regression test shown failing on the defect)

**Source:** «line» means an «[auto]» acceptance line surfaced the defect; «fix» means it was found while correcting one.

| # | Source | Accepted rule | Defect | Correction | Test |
|---|---|---|---|---|---|
| 1 | line (A1 #10, SERAH #3) | X-KONSISTENSI K6 (D-173): the pager says «Sebelumnya» / «Berikutnya» | **This session's own A1 build** used A1's older keys «Pelajaran sebelumnya / berikutnya», which K6 had withdrawn, and its own test asserted them | `koleksi.sebelumnya` / `.berikutnya`; the two keys removed; the walk and the copy pack updated | `R3-SOAL-01` (restated) |
| 2 | line (E3 #6) | A5 C6: a filtered empty Bank Soal offers «Hapus pencarian dan saringan» | no way back was offered (the comment said «Daisy, open»; she had answered) | the Collection's own empty sentence and reset; no new key; the unused `studio.bank.saring.kosong` removed | `R3-A5-01` |
| 3a | line (E2 #7, P13) | W3.2 / P13: every empty state is the Empty state | **18 empty sentences** were bare paragraphs: the chooser, both Ringkasan, seven Konfigurasi sections and the certificate list. `R2-KOSONG-01` read one class name only, so it could not see them | all converted to `Kosong`; five declared, each with its reason | `R2-KOSONG-01` (strengthened) |
| 3b | fix | Kosong's rule: a refusal is never drawn as empty | a package that is missing, or not the reader's, said «Belum ada paket di sini.» | the refusal page, as Mengajar answers a class it cannot read | `R2-KOSONG-01` |
| 4 | line (A5 #5, #8) | A5 C1, RV-20: a row's badge shows once, at every width | one rule hid **every** badge in a row's meta line above 560 px. So the learner's lesson status on `/belajar/[tugas]` and Studio's «Dikembalikan ke penyusun» were never seen on a wide screen, and under 560 px Studio's rows showed their badge twice | only a marked narrow copy (`data-salinan-sempit`) waits for a narrow screen; a row with one hides its original there | `R3-LENCANA-01`; walk U5 at 1280 and 390 px |
| 5 | line (A3 #6) | E-A3-1 (D-168): the «how far» line names the place's people on every surface | Ringkasan Kelas never passed its class's kind, so a professional-learning class read «murid» | the class report reads `member_kind` under the reader's own access and passes it | `R3-PESERTA-01` |
| 6 | line (C1 Part B #4) | C1 Part B, B1 §2, W3.22: navigation and forms never print | 35 back links printed (a comment claimed otherwise); Management's decision forms printed | one print rule for `.pin-back`; the forms are `pin-noprint` | `R5-CETAK-01`; `b6-cetak` checks the back link on every page it prints |
| 7 | line (A2 #3, #4) | A2 K4, K6 (D-170(a)) | the class figure's base was 14 px `ink-2` (accepted: body size `ink-1`); «Rincian nilai» was drawn as the section eyebrow (accepted: an h2 in `t-section`) | scoped to the Uji Cepat panel; the shared metric panel is unchanged | `R3-A2-01` |
| 8 | line (B1 #6) | B1: with no environment row, the «Lingkungan» panel is omitted, never «—» | the platform view drew «—» | the panel is drawn only with a value | `R3-A5-01` |
| 9 | fix (CI-W02) | the CI guard D-119 against D-180 | the decision log counted as an inert document. A ruling recorded alone would reuse an earlier proof and skip `R-PROSES-01` | the decision log is a document a test reads, so it is never skipped (the rule `docs/audit` and `docs/onboarding` already follow) | `CI-W02` (restated and extended) |

## 3. Claims that are not defects, or are not engineering's to settle

| Claim | Finding | Goes to |
|---|---|---|
| K8: the step list should show dots with a ring on the current step (A5 B12) | **Ambiguous in the design itself:** B12 asks for «a 2 px ring» on the current step, and in the same paragraph says «never an open circle beside a filled one». The build uses progress segments, with `aria-current` (D168-K8-1). It is not changed again until Daisy rules | **K3, Daisy** |
| D2: the certificate's file name in the reader's language | The build names it in the certificate's issued language, as the frozen certificate itself is. Whether the file name follows the reader or the certificate is a design choice | **K3, Daisy** |
| C1 Part A: a print header with the G6 title and «Halaman n dari m» on every page | The title's words are G6 (Dr Gladys). The page counter and `break-inside` are buildable once the header's words exist | **K1** (G6); then engineering |

## 4. Open coverage: built, not yet proven by a test

These are not known defects. Each is behaviour that is built (or in one case partly built) but not yet asserted. **They stay OPEN in the register until a test or walk holds them (D-180), and they count against GREEN.** They are recorded as obligations in `06-ENGINEERING-ITEMS-FROM-DESIGN.md` («Reverse reconciliation: open coverage»).

| Area | What is not yet proven |
|---|---|
| Widths and axe | A1, B1's section pages, C1 (Ringkasan Sekolah, `/pimpinan*`, `/pengembangan`), C2's PD page and E2's chooser are not walked at every accepted width (1280/820/390/320) with a judged axe run. The crawl records axe but does not fail on it |
| Keyboard | No judged focus-ring walk on `/studio/paket`, Konfigurasi's section pages or `/` |
| A1 | the pager's accessible names at 320 px; its five other states (empty, gagal, large, long at 320) |
| A2, A3 | A2's Indonesian label and `.belum`; a PD render of the base and the «how far» line; a render at 5 and 28 scored |
| B2 | the 11 keys by name; full and short forms; «nomor anggota»; «Kode sekolah»; the identifier's format and the intake headers unchanged |
| C1 | the Ringkasan pages' «no heading for a withheld figure», «every figure carries its sentence» and template order; the rendered empty-heading sweep (E-C1-3) |
| D1 | the frame's structure on recovery, password-changed and security emails (D1E-K01 was never written); the plain text's action URL and footer; the recovery duration |
| D2 | the printed PDF's `/Title`; the tab title restored on leaving the page |
| E1, E2, E3 | «no group label»; axe outside the rail range; a refusal drawn without the navigation; the lapse redirect; door height; «at most one current door»; the idle warning never taking focus |

## 5. Blocked (unchanged; on the coordinated pass)

- D5's shell and email slots, and the placeholder (F-11, **K4**).
- G1's chooser sentences, G6's report title, and the words B1–B5 and B28 of the copy pack (Dr Gladys, **K1**).
- B4 and C2 (Daisy, then the owner, **K3**).
- D1's manual protocol (**K5**).

## 6. The closure (D-181): what changed, and the recount

**New evidence, each reading the rendered page or the real output:**
- **`audit/rb-ujung.mjs`** (in CI's journeys) covers every accepted surface at 1280, 820, 390 and 320 px:
  - Studio's package page;
  - every Konfigurasi section page;
  - Pimpinan and a node of it;
  - Ringkasan Kelas and Sekolah;
  - a professional-learning class's «Lihat bukti» and its record;
  - the chooser.

  At each width it judges axe (WCAG 2.2 AA, target size included) and the sideways scroll. At 1280 px it judges the keyboard: the skip link first, a visible focus on every stop, no trap. It also checks B2's explanation as rendered, the pager's names at 320 px, the chooser's doors, and its session row.
- **`D1E-K01`** renders all eight identity emails.
- Copy checks only where the requirement is the words themselves: A2's label in both languages, and «nomor anggota».

**A defect found by the closure, and fixed at the shared source:**
- At 320 px the session row clipped the reader's name, which is the button that opens the account menu, out of sight. The button lay under «Keluar», so the account menu could not be seen or tapped on a phone, and axe failed the target size.
- The row is now a flex row, and the name truncates inside its own button.
- Held by RB9; the navigation walk is still green (14/14).

**The recount, line by line:**

| | Lines | HELD | PARTIAL | NOT HELD | BLOCKED |
|---|---|---|---|---|---|
| A1–A5, B1 | 47 | 34 | 11 | 0 | 2 |
| B2, B4, C1, C2, D1 | 46 | 31 | 11 | 0 | 4 |
| D2, D4, D5, E1, E2, E3, SERAH-TERIMA | 38 | 25 | 9 | 0 | 4 |
| **Total** | **131** | **90** | **31** | **0** | **10** |

**Held by an accepted manual or design-side verification (D-181(2)), not by a test:**
- D4: Daisy's published page, accepted by D-175(c).
- SERAH-TERIMA #1–#2: Daisy's own render reports on her branch.
- E3 #2: the idle warning never takes focus, by inspection: `PenjagaSesi` calls no `focus()`.
- B2 #4: B2's commit changed copy and one component only; no format, column or migration.

**The 31 PARTIAL lines are not open defects.** Each is the cross-pattern («D-172: P…») line of a composition, or a sub-clause that is built and partly asserted.
- Their P-patterns are held where each pattern lives: K1–K9 and E-P15/E-P17 in `06-ENGINEERING-ITEMS-FROM-DESIGN.md`.
- Per D-181(2) and (4), they are not each re-proven per composition.
- They are recorded, not launch-blocking.

**The 10 BLOCKED lines:**

| Waits on | Lines |
|---|---|
| **K1** (copy and Dr Gladys) | A5 B7, B9 and B11's words; C1's G6 print title; C2's footnote and its three new keys; E2's G1 sentences |
| **K3** (Daisy) | A5 K8's markers; D2's name language |
| **K4** (F-11) | D5's slots and placeholder; D1's 120 × 40 header |

**Minor, recorded and not launch-blocking (D-181(3)):**
- A2's `.belum` English lacks «score».
- D2's browser-tab title while printing.
- C1 Part A's print `break-inside` (with G6's header).
- The ranking-word sweep does not cover `/pengembangan`.
- The PD «Minta membaca lagi» is untested (it is built).

**The closure ends here (D-181(7)).** No further reconciliation cycle is opened.


## 7. The 31 PARTIAL lines and the five minor findings, by risk (D-181(5))

**Risk classes:**
- **None:** the unasserted part is held where its shared pattern lives, so the line is covered by that pattern's own test.
- **Low:** the unasserted part is built and seen working in a walk or by inspection, and a failure would be cosmetic or easily noticed.
- **Material:** a product, security, integrity or critical usability defect. **None was found.**

The «Held where» column names the existing evidence. No new test was written for any line below.

### The PARTIAL lines

| Line | What is not asserted on this composition | Held where | Risk |
|---|---|---|---|
| A1 #10 | P1, P9, P15 on the package page | P9: `D168-K2-1`, `R3-SOAL-01` (K6). P15: E-P15's guards. P1: one primary per step (`STUDIO3A-J1-01`) | None |
| A2 #2 | `.dasar`'s English; the PD noun in its render | the noun executed for both kinds (`R3-PESERTA-01`); `.dasar` (id) in `MENGAJAR3-HASIL-01` | Low |
| A2 #6 | P10 (a section, not tabs) | the page has no tabs (`R3-A2-01` reads its h2 section) | None |
| A3 #7 | no score, permission or metric definition changed | A3 added no migration (`UX1-BRAND-02`'s migration baseline); the figure reads the catalogue's `learner.result` (`MENGAJAR3-HASIL-01`) | None |
| A3 #8 | P14 cross-checked with the reports | P14's sentence is the shared `kalimatJumlahOrang` (`R3-PESERTA-01`) | None |
| A4 #1 | most Indonesian strings asserted one by one | the English corrections exactly (`R3-A5-01`); the Indonesian was confirmed unchanged by A4 | Low; C3 and C9 BLOCKED (K1, K2) |
| A4 #5 | P2, P18 on A4's surfaces | P18: `R2-TANGGAL-01`, `D168-K9-1`; P2: the form pattern (`DAISY-17-KIRIM-01`) | None |
| A5 #1 | the result line rendered at every width | `D168-K3-1` (no layout of its own to break); seen in every walk's screenshots | Low |
| A5 #9 | P10; K8 | K8 is BLOCKED (K3) | None (K3) |
| B1 #6 | «Inteligensi & Laporan» never drawn | built (the row reads `laporan.templat.judul`); RB1-B1 renders every section | Low |
| B1 #9 | P1, P2, P12, P15, P16 on Konfigurasi | `D168-B1-3/6/7` (P7, P8), `D168-K2-1` (P9, P12), `DAISY-17-KIRIM-01` (P2), `DAISY-18-DENGAR-01` (P16), E-P15 guards | None |
| B2 #1 | the 11 keys named one by one; the full and short forms | `D168-B2-1`: no old name in either language, the term in both, ≥10 keys | Low |
| B2 #3 | «Kode sekolah» in the identifier check | the explanation names the three identifiers apart, rendered (RB5) | Low |
| B2 #6 | the exports | the exports read the same copy table (`D168-B2-1`) | Low |
| C1-A #7 | A4 page count, running header, «Halaman n dari m» | the shell and actions do not print (`B5A-LAPORAN-K01`, `R5-CETAK-01`) | Low; the header waits on G6 (K1) |
| C1-B #3 | the ranking-word sweep on `/pengembangan` | `UX1-PIMPINAN-KATA-01` on Pimpinan; `/pengembangan` shows a record, not a list of people by value | Low (also minor finding 4) |
| C1-B #5 | P7/X1, P10/K5, P13, P17, P21 | P13: `R2-KOSONG-01`; P17: `R-PROSES-01`; the rest are declared exceptions (X1) or shared components | None |
| C2 #1 | «no figure» rendered | `D168-C2-1` (no class metric requested); RB1-C2 renders the PD page | None (K3) |
| C2 #2 | the record's pointer «exactly once, under Kesimpulan» | `D168-C2-1`; RB1-C2 | Low (K3) |
| C2 #5 | «Minta membaca lagi» stays for a PD class | built; gated on the assessment's kind, not the class's | Low (also minor finding 5) |
| C2 #8 | P3, P13 on the PD page | P13: `R2-KOSONG-01`; P3: `D168-K1-1` | None (K3) |
| D1 S2 #14 | every email uses only the frame's blocks | `D1E-K01` (the frame's structure on all eight); `D1E-K14`, `D1E-K16` | None |
| D2 #4 | the tab title restored on leaving the page | the print path restores it (`D168-D2-1`) | Low (also minor finding 2) |
| D2 #5 | «the only primary», «no result line after printing» | one `AksiCetak`, a button only (`B6C-PRINT-01`) | None |
| D5 #3 | the rail hides the wordmark; the 12 px screen minimum | the 15 mm print floor (`B6C-SHEET-01`); rail hiding built | Low (K4) |
| D5 #4 | one slot rule on every surface | the certificate and card (`B6C-SHEET-01`, `B6K-MEREK-01`) | None (K4) |
| E1 #9 | a refusal without the navigation; the lapse redirect | the lapse is refused in the database (`F22-K04`), so access is held; the redirect's sentence is G1 | Low (K1) |
| E1 #11 | P4 «close in the head»; P15 for the navigation's refusals | the drawer: Escape, focus back (`e1-navigasi` N4); E-P15 guards | Low |
| E2 #6 | «no empty alert» with no words | no G1 word exists, so no alert can draw (`F22-P04`) | None (K1) |
| E2 #7 | X5 («/» has no shell) | RB9 renders `/`: no staff navigation drawn there | None |
| E3 #3 | the pager's disabled moves carry no reason line | the one pager component (`D168-K2-1`) | None |

**Count:** 31 lines, of which 14 are None and 17 Low. **0 are Material.**

### The five minor findings

| # | Finding | Risk | Disposition |
|---|---|---|---|
| 1 | A2's `.belum` English lacks «score» | Low (copy) | with K1's copy round |
| 2 | D2's browser-tab title while printing | Low (cosmetic) | recorded; no change |
| 3 | C1 Part A's print `break-inside` | Low (print quality) | with G6's header (K1) |
| 4 | the ranking-word sweep does not cover `/pengembangan` | Low | recorded; no change |
| 5 | the PD «Minta membaca lagi» untested | Low (built) | recorded; no change |

**Disposition:** nothing above is launch-blocking. The lines waiting on K1, K3 or K4 are done in the coordinated pass, with their own verification.
