# A5 · Batch 3 cosmetic and layout confirmations

**Form K (a yes, or a correction, per item).** Register entry A5 (`batch-3/05:151-152`).
**Items:** B1, B3, B4, B6–B12, C1, C4, C6, C8, D2, D4, D5, D6, D8, D9, and J5's live «Jendela: …» line. The questions are in `batch-3/02-DAISY-QUESTIONS.md`.
**Evidence:** our render beside hers, `batch-3/evidence/sisi/` and `sisi-penutupan/`: `j1-terbitkan`, `j1-kelas`, `j1-tersedia`, `j1-siapkan`, `j5-jendela`, `f7-bank-guru`.
**Decides:** D. Nothing here changes behaviour, a permission or a figure. Three corrections need new words, marked **NEW** (§ Words).

---

## Studio · the package page

| # | Item | Verdict | The approved form |
|---|---|---|---|
| **B1** | One press creates and locks the release, for a reader who may take both steps | **YES** | The panel names both steps («Buat terbitan · Kunci terbitan»), says both sentences and «Oleh: …» for each, and offers the one button «Kunci terbitan». Doing both together is right, because nothing happens between them that the reader could decide. |
| **B3** | The result line's ✓ sits on its own line when the line wraps | **CORRECT** | **The mark and the words share one line.** The mark hangs at the start, and wrapped words align under the words, never under the mark (the Result line's icon column + text). The same on J5's live result (`sisi-penutupan/j5-jendela`), where the ✓ stands alone above its sentence. |
| **B4** | The send-back confirmation treated as not destructive | **YES** | A normal edge, a primary «Kembalikan ke penyusun», focus in the reason box (not on «Batal»), and no ✓ word in the panel, because the panel moves on. The reviewer's confirmation is `galat.sent_back`, the result line on the page they land on. |
| **B6** | After publication or withdrawal | **YES** | The same panel, «Sekarang» · «Terbit» / «Ditarik», and after publishing the way on to «Paket Pembelajaran» (`data-lanjut`), as built |
| **B7** | «Paket ini terbit setelah langkah 7.» names a number the list no longer shows | **CORRECT** | **«Paket ini terbit setelah langkah Terbitkan.»** The step by its name, as the list shows it. NEW. |
| **B8** | How the reviewer's reason is shown | **YES** | A `surface-2` well on the author's panel; plain lines under each version in «Riwayat perbaikan». It is a record read in order, not a table. |
| **B9** | The first, never-released version reads «— · belum terbit» | **CORRECT** | **«Versi pertama · belum terbit»**. A dash stands in for nothing; this version has a name. NEW. |
| **B10** | The package title as an h2 inside the card, because Studio's layout owns the h1 | **CORRECT** | **The package title is the page's h1** (`t-page`), with the back link «Studio» above it, as in J1Terbit. One `t-page` per page (Hierarchy). Studio's own head («Studio» and its tabs) belongs to Studio's index pages, not to a package's page. |
| **B11** | The author sees no acknowledge button; should the page say a second person reviews findings? | **YES, say it** | One quiet line at the top of «Temuan», for the author only: **«Temuan ditinjau oleh orang kedua, bukan oleh penyusun paket.»** It uses the same verb as the reviewer's button («tinjau», A4 C2). NEW. |
| **B12** | The step list's markers look like radio buttons: open for to come, filled for current | **CORRECT** | **As J1Terbit's named steps:**<br>• **done:** a filled `ink-1` dot;<br>• **current:** a 2 px `pintar-primary` ring, its name at 600, and `aria-current="step"`;<br>• **to come:** the name in `ink-2` beside a filled `line-control` dot.<br>Never an open circle beside a filled one, which is the radio button's grammar. Each step's state is said in its name for assistive technology, never by the marker alone. |

## Studio · other pages

| # | Item | Verdict | The approved form |
|---|---|---|---|
| **C1** | Studio home: a narrowed list; and a sent-back package's badge | **YES to the list; CORRECT the badge** | The narrowed list as built: «<count> · Semua»; an empty narrowed list says nothing matches and offers «Semua»; the selected filter has the primary border. **A sent-back package carries the attention badge «Dikembalikan ke penyusun»** (`studio.paket.riwayat.dikembalikan`, with its icon) **beside** «Sekarang: Susun isi», not instead of it. The badge says why the package is back; the line says what to do. |
| **C4** | Mode, bank and order as radio rows; or a segmented control? | **YES, radio rows** | They are form values saved together. The segmented control is for a filter, a language or a view (DS/05), not for a form's answer. |
| **C6** | Empty states with no action; «Hapus saringan» on a filtered Bank Soal? | **YES, no new button** | A filtered empty Bank Soal says nothing matches the filter. Its way back is the filter's own «Semua», which stays in view directly above. No «Hapus saringan» key is created. Pustaka PINTAR and Tinjauan Integritas show their sentence only. |
| **C8** | Studio's page head: eyebrow «PINTAR», h1 «Studio», the tabs. Keep the eyebrow inside the AppShell? | **CORRECT** | **No «PINTAR» eyebrow.** The shell carries the name (as Konfigurasi, B1 / RV-24). h1 «Studio», then the tabs. |

## Mengajar

| # | Item | Verdict | The approved form |
|---|---|---|---|
| **D2** | «One step below»: a section on the same page, or a separate drill-down? | **YES, a section on the same page** | Settled by DS 11-validation:194 and A2 K6 (accepted): the class figure first, «Rincian nilai» as the page's h2 section below. |
| **D4** | A per-row action to the learner's record («Lihat», as in J2) | **YES** | Each row's name opens the learner's record, as J2 does, where the teacher may open it. The record's own gate decides. One target per row: the name, not a second «Lihat» button. |
| **D5** | The Uji Cepat launch's result word; success leaves the form for the running stage | **YES** | **The named exception to W3.17.** The ✓ result line only («✓ …», B3's form). The next stage, now on screen, is the rest of the answer. |
| **D6** | Siapkan after «✓ Disediakan»: disabled fields or read-only text? And the back link? | **CORRECT the fields; YES to the link** | **The window becomes read-only text:** «Mulai Selasa, 3 Nov 2026 · Sampai Kamis, 3 Des 2026», the date helper's words. Disabled native fields show the computer's format («11/03/2026») in low contrast, the ambiguity the DateTime echo exists to prevent. The back link «Kembali ke pilihan materi» stays: the result, then the way on to the class (J1). |
| **D8** | A row with no score | **YES** | «—» if the learner has not handed in; «Belum ada nilai» if they have but there is no score yet (A2 K8, accepted) |
| **D9** | RV-20: below 560 px a list row's badge moves under its words, on every list | **YES** | Under the words, aligned with them, never squeezed beside a wrapping title. This is the list row's own grid (`pds-list-row`). |

## J5's live «Jendela: …» line

| Item | Verdict | The approved form |
|---|---|---|
| The review panel before «Sediakan» | **CORRECT** | **The review panel carries the window before the button**, as J5Jendela does: «Disediakan untuk **5B** · 1 murid terdaftar hari ini», then **«Jendela: Mulai Selasa, 3 Nov 2026 · Sampai Kamis, 3 Des 2026»**, then the sentence on what changes. Live, the window appears only after «Sediakan», in the result. The teacher must see what they are confirming before they confirm it. Its words exist (J5; `mengajar.sedia.*`). |

## Words (T table)

Only the three corrections that need new words. Everything else uses existing keys.

| Key (proposed) | Indonesian | English | Kind |
|---|---|---|---|
| `studio.langkah.terbit_setelah` (replacing the numbered sentence) | Paket ini terbit setelah langkah Terbitkan. | This package is published after the Terbitkan step. | NEW · presentation (B7) |
| `studio.paket.riwayat.versi_pertama` | Versi pertama | First version | NEW · presentation (B9) |
| `studio.temuan.orang_kedua` | Temuan ditinjau oleh orang kedua, bukan oleh penyusun paket. | Findings are reviewed by a second person, not by the package's author. | NEW · presentation (B11) |

«Paket» follows Terminology v1 (X12's consolidated decision governs any further change).

## Decisions it depends on

None. The three new keys await copy approval.

## Acceptance checklist

- [auto] A result line's mark and words share one line at every width (B3; J5's result).
- [auto] B7, B9 and B11 render the new keys; no step sentence names a step number.
- [auto] The package page's h1 is the package title; no «PINTAR» eyebrow on Studio (B10, C8).
- [auto] The step markers: done filled, current ringed with `aria-current="step"`, to come filled in `line-control`; no open circle (B12).
- [auto] A sent-back package shows the badge «Dikembalikan ke penyusun» with «Sekarang: Susun isi» (C1).
- [auto] After «Disediakan», the window is text in the date helper's words, not disabled fields (D6).
- [auto] J5's review panel shows «Jendela: Mulai … · Sampai …» before «Sediakan».
- [auto] Below 560 px a list row's badge sits under its words (D9).
- [manual] Side-by-side review of the corrected screens beside J1Terbit and J5Jendela (brief G:14).
- [auto] **D-172:** equivalent interactions match their canonical pattern (`../X-KONSISTENSI/`): P5, P6 (K3), P10, P11, P12, P18 (K9), P20 (K7); the named-steps markers (K8).
