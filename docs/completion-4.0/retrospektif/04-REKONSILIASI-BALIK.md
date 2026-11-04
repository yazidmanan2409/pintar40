# Reverse reconciliation: every accepted design's «[auto]» line against the code (D-179(e), D-180) · 4 Nov 2026

**What was read:**
- every «[auto]» acceptance line in Daisy's accepted designs on `ux-1/daisy-experience`: A1–A5, B1, B2, B4, C1 (README and PIMPINAN), C2, D1 (README and STEP-2), D2, D4, D5, E1, E2, E3, SERAH-TERIMA and X-KONSISTENSI;
- each line checked against the test or walk that should hold it, by reading the assertion, not the test's name.

**How:**
- read in three parallel reads at `e7f43ae7`;
- every defect claimed was then checked against the code before anything was changed. Two claims were not defects; they are in §3.

## 1. The count

| | HELD | PARTIAL | NOT HELD | BLOCKED | Lines |
|---|---|---|---|---|---|
| A1–A5, B1 | 19 | 22 | 5 | 1 | 47 |
| B2, B4, C1, C2, D1 | 15 | 24 | 6 | 1 | 46 |
| D2, D4, D5, E1, E2, E3, SERAH-TERIMA, X-KONSISTENSI | 13 | 21 | 6 | 5 | 45 |
| **Total** | **47** | **67** | **17** | **7** | **138** |

**What the classes mean:**
- **PARTIAL:** part of the line is asserted.
- **NOT HELD:** no test asserts the line. Most of these are built and untested; the defects are in §2.
- B4 and C2 are counted as held where a test holds them, but their designs are still under review (K3).

**What this says:**
- CI was green throughout, yet only a third of the accepted acceptance lines were fully held by a test.
- Ten lines hid real defects; all ten are fixed in §2.
- D-180's point stands: «a passing CI run is not proof that every approved requirement has been implemented».

## 2. Defects found, and corrected (each with a regression test shown failing on the defect)

| # | Accepted rule | Defect | Correction | Test |
|---|---|---|---|---|
| 1 | X-KONSISTENSI K6 (D-173): the pager says «Sebelumnya» / «Berikutnya» | **This session's own A1 build** used A1's older keys «Pelajaran sebelumnya / berikutnya», which K6 had withdrawn, and its own test asserted them | `koleksi.sebelumnya` / `.berikutnya`; the two keys removed; the walk and the copy pack updated | `R3-SOAL-01` (restated) |
| 2 | A5 C6: a filtered empty Bank Soal offers «Hapus pencarian dan saringan» | no way back was offered (the comment said «Daisy, open»; she had answered) | the Collection's own empty sentence and reset; no new key; the unused `studio.bank.saring.kosong` removed | `R3-A5-01` |
| 3 | W3.2 / P13: every empty state is the Empty state | **18 empty sentences** were bare paragraphs (the chooser, both Ringkasan, seven Konfigurasi sections, the certificate list). `R2-KOSONG-01` read one class name only, so it could not see them | all converted to `Kosong`; five declared, each with its reason. A missing package said «Belum ada paket di sini.», an empty state standing for a refusal: it is now the refusal page, as Mengajar answers a missing class | `R2-KOSONG-01` (strengthened) |
| 4 | A5 C1, RV-20: a row's badge shows once, at every width | one rule hid **every** badge in a row's meta line above 560 px. So the learner's lesson status on `/belajar/[tugas]` and Studio's «Dikembalikan ke penyusun» were never seen on a wide screen, and under 560 px Studio's rows showed their badge twice | only a marked narrow copy (`data-salinan-sempit`) waits for a narrow screen; a row with one hides its original there | `R3-LENCANA-01`; walk U5 at 1280 and 390 px |
| 5 | E-A3-1 (D-168): the «how far» line names the place's people on every surface | Ringkasan Kelas never passed its class's kind, so a professional-learning class read «murid» | the class report reads `member_kind` under the reader's own access and passes it | `R3-PESERTA-01` |
| 6 | C1 Part B, B1 §2, W3.22: navigation and forms never print | 35 back links printed (a comment claimed otherwise); Management's decision forms printed | one print rule for `.pin-back`; the forms are `pin-noprint` | `R5-CETAK-01`; `b6-cetak` checks the back link on every page it prints |
| 7 | A2 K4, K6 (D-170(a)) | the class figure's base was 14 px `ink-2` (accepted: body size `ink-1`); «Rincian nilai» was drawn as the section eyebrow (accepted: an h2 in `t-section`) | scoped to the Uji Cepat panel; the shared metric panel is unchanged | `R3-A2-01` |
| 8 | B1: with no environment row, the «Lingkungan» panel is omitted, never «—» | the platform view drew «—» | the panel is drawn only with a value | `R3-A5-01` |
| 9 | the CI guard D-119 against D-180 | the decision log counted as an inert document. A ruling recorded alone would reuse an earlier proof and skip `R-PROSES-01` | the decision log is a document a test reads, so it is never skipped (the rule `docs/audit` and `docs/onboarding` already follow) | `CI-W02` (restated and extended) |

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
