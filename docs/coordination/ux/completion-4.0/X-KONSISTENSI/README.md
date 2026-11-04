# D-172 · One PINTAR, one experience: the canonical patterns, and what does not match yet

**Standing directive D-172** (owner, 4 Nov): equivalent interactions look, feel and behave the same everywhere. This is the design authority's record for it. It is not a separate review cycle: each composition's checklist carries one line pointing here, and engineering's gates and journeys check against it.

**Principle:** learn it once, recognise it everywhere.
**Source of truth:** the frozen design system (`sistem-desain/project/`). Nothing here is a new component or token; each row names the existing one.

---

## 1. The canonical patterns

| # | Interaction | The one pattern (DS component) | The rule people learn |
|---|---|---|---|
| P1 | **The page's one main action** | Button primary, at most one per view (Button; Page head) | The primary is the one thing the page is for; everything else is secondary or quiet |
| P2 | **Save, and Cancel** | FormLayout: the primary, then «Batal» as a quiet button, left-aligned at the form's end | Primary first, «Batal» after it, never right-aligned, never before |
| P3 | **Back** | Link `pds-back`, chevron, at the top of the page | **It names its destination** («‹ Studio», «Kembali ke Uji Cepat»), never a bare «Kembali» where the destination is known |
| P4 | **Close** | Dialog and Drawer: an icon button «Tutup …» in the head, and Escape | Close is in the head of what it closes |
| P5 | **The result of an action** | ActionFeedback: TombolKirim's busy word, then BarisHasil **beside the action**, `role="status"` (or `alert` when it failed) | Said where the person acted, in words; never a toast; never claimed before the server confirms |
| P6 | **The result line's form** | Result line: the mark and the words on **one line**, wrapped words aligned under the words | The ✓ never stands alone |
| P7 | **Act on one record in a list** | List row with its one action at the end; the action **opens in place**, one row at a time (B1) | A row's action is the row's own, and the list stays where it was |
| P8 | **Confirm a destructive act** | Button destructive opens the confirmation in place, with a reason where one is recorded; the confirming button is destructive-confirm. An irreversible platform-wide act adds the typed phrase. | Destructive is red twice, never once; a reason is asked where it is kept |
| P9 | **A long list's pages** | Pagination: «Sebelumnya» / «Berikutnya», «Sebelumnya» shown disabled on the first page, the position, and **never a hidden total** (or, when it is unknown, what is shown) | Where am I, how much is there, how do I move: always all three |
| P10 | **Switch views of one thing** | Tabs (pages: links with `aria-current`; panels: `tablist`). A filter is the segmented control; a value is a select or radios. | Underlined and 600 is «the view I'm in» |
| P11 | **Choose one value in a form** | 2–4 options: radio rows; more: a Select. Never a segmented control for a form's answer. | — |
| P12 | **Search and filter a collection** | Collection (Koleksi): search, the segmented filter with «Semua», the Table or list, Pagination. An empty filtered result is the Collection's own empty state, «Tidak ada {benda} yang cocok», with its reset «Hapus pencarian dan saringan» (`koleksi.kosong.reset`), on every filtered list. | One way to narrow, one way back |
| P13 | **Empty** | Empty state (`Kosong`): one sentence of what is not there and, where one exists, the way on | Never a blank, never a zero standing for unknown |
| P14 | **Not yet** | The statement in place of the figure, how far, and what makes it appear (KartuKetiadaan; C1) | «Not yet» is a real answer, in quiet ink |
| P15 | **Refusal** | HalamanPenolakan: the surface's own line, `tolak.arti` in the reader's persona, the way home, who is signed in | Every refusal looks the same and says why |
| P16 | **Loading** | MemuatHalaman: the shell, the skeleton, «Memuat halaman…» | — |
| P17 | **Something to read only if wanted** | Disclosure. **Never for what must be read** (A1). | A closed disclosure means «optional» |
| P18 | **Dates** | DateTime: the native field, then its echo in words; text in the date helper's words once fixed (A5 D6) | A date is always also said in words |
| P19 | **Where am I · where can I go** | AppShell with the context control (E1 + E2); `/` is the one place to change context | One shell, one context, one chooser |
| P20 | **The page head** | Page head: back link, scope line (three levels or more), `t-page` title, intro, actions. **No app-name eyebrow inside the shell.** | The shell names PINTAR; the page names itself |
| P21 | **Who did it, and the record of it** | A well for a quoted reason; a record list read in order, not a table, for a history | — |

## 2. Inconsistencies found, and their corrections at the shared source

| # | What does not match | Where | Correction (at the shared pattern or component) |
|---|---|---|---|
| **K1** | **Bare «Kembali» back links** (P3) | `laporan.kembali` (the Ringkasan), `pimpinan.kembali`, `umpanbalik.kembali`, `pengembangan.kembali`; the built `← Kembali` on `/pimpinan/*`; my C1 specimens followed them | **The back link names its destination.** The calling page passes it; the Ringkasan names `/pimpinan` or «Laporan» as it came. These keys are retired from back links, and the destination's own name (its nav word or its title) is used. A destination that truly varies and is unknown is the one exception: it keeps «Kembali». |
| **K2** | **Two pagers** (P9) | the built Penomoran (`src/components/koleksi/Penomoran.tsx`) uses «Kembali» for the previous page, omits it on page 1 and shows no total, against the DS Pagination; my B1 and C1 specimens followed it; A1 followed the DS | **Penomoran becomes the DS Pagination.**<br>• «Sebelumnya» (`koleksi.sebelumnya`, which already exists) replaces `koleksi.kembali` in the pager.<br>• «Sebelumnya» is shown disabled on the first page.<br>• **Keyset pages, whose total is unknown, say what is shown** («Menampilkan {dari}–{sampai} {benda}»), in place of a total: one NEW key, `koleksi.menampilkan_tanpa_total`. |
| **K3** | **The ✓ alone on its line** (P6) | BarisHasil when wrapping (A5 B3); J5's live result | **In BarisHasil**, once, for every surface (A5 B3, accepted for design) |
| **K4** | **A result line away from its action** (P5) | my B1 section pages placed it at the top | **Corrected in B1:** under the saved row, or under its form. Re-rendered. |
| **K5** | **A scope choice drawn as buttons** (P10) | my C1 part B `/pimpinan` «Lingkup» | **Corrected in C1 part B:** Tabs (pages); the DS says `.pin-lingkup` becomes Tabs. Re-rendered. |
| **K6** | **The pager's words named the unit** (P9) | my A1 «Pelajaran sebelumnya» / «Pelajaran berikutnya» | «Sebelumnya» / «Berikutnya», as P9. The position line «Pelajaran 3 dari 4» keeps the unit. A1's specimen is corrected with the next A1 change; the accepted composition is otherwise unchanged. |
| **K7** | **An app-name eyebrow inside the shell** (P20) | Konfigurasi (RV-24; B1), Studio (A5 C8) | **One rule for the page head:** no «PINTAR» eyebrow inside the shell |
| **K8** | **Step markers that read as radio buttons** (P11 vs named steps) | Studio's step list (A5 B12) | Named steps as J1Terbit (A5 B12), in the one step-list component |
| **K9** | **Disabled fields standing for a fixed value** (P18) | Siapkan after «Disediakan» (A5 D6) | Fixed values are text, in the date helper's words |

## 3. Genuine exceptions, with their reason

| # | Exception | Reason |
|---|---|---|
| **X1** | `/pimpinan`'s decisions show their forms open, not one row at a time (vs P7) | The waiting decisions are the page's work: each one is a to-do, not a maintained record. Opening one at a time would hide what the page exists to ask. Decided cases do follow P7/P17: compact, with the chain in a disclosure. |
| **X2** | A1 jumps by lesson title, a Select of named lessons, not the report pager's page-number jump (vs P9's jump) | Its pages are lessons with names. A reviewer looks for «Menyederhanakan pecahan», not page 237. |
| **X3** | An email action never ends in ✓ or «Terkirim» (vs P5) | The DS's own exception (ActionFeedback; D-098(c)): PINTAR cannot confirm an email arrived |
| **X4** | The Uji Cepat launch ends in the ✓ line only, and the page moves to the running stage (vs P5's «then the next step» on the same view) | W3.17's named exception (A5 D5): the next stage on screen is the answer |
| **X5** | The chooser `/` has no shell (vs P19) | It belongs to no context: it is where a context is chosen (E2) |
| **X6** | A withheld figure has no heading (vs P14) | A refusal must not disclose what it withheld (C1; `not_permitted`) |

**Not a consistency defect, and so not redesigned:** screens whose equivalent interactions already match these patterns.

## 4. How it is checked (no new suite)

- **Each composition's checklist carries one [auto] line:** «equivalent interactions match their canonical pattern», listing its P-numbers.
- **Engineering's cross-screen checks** go in the existing gates and journeys (D-168), one per pattern where it can be tested from the source or the render:
  - one Pagination component, with no «Kembali» in a pager (K2);
  - no `pds-back` reading only «Kembali» where a destination is known (K1);
  - BarisHasil's mark and words on one line (K3);
  - a result line inside the form or row it answers (K4);
  - no «PINTAR» eyebrow inside the shell (K7);
  - no disclosure around required content (P17);
  - every refusal through HalamanPenolakan (P15).

## Words (T table)

| Key | Indonesian | English | Kind |
|---|---|---|---|
| `koleksi.menampilkan_tanpa_total` | Menampilkan {dari}–{sampai} {benda} | Showing {dari}–{sampai} {benda} | NEW · presentation (K2). The keyset pager's «what is shown» line, when the total is unknown. |
| `koleksi.sebelumnya` | Sebelumnya | Previous | EXISTING; replaces `koleksi.kembali` in the pager (K2) |
| the back links' destination names | the destination's own nav word or title | — | EXISTING words (K1) |
