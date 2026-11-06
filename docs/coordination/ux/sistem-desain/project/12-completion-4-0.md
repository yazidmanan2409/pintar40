# Completion 4.0

**Stage 2 of the republication (D4, W3.21), 6 Nov.** The frozen system with the outcomes of PINTAR 4.0's design completion. F-11 is closed by D-192 (the text wordmark), so stage 1's provisional wordmark is resolved: «Wordmark (text)». **Provisional** still marks what waits on an owner or Dr Gladys decision or on copy approval; nothing provisional is final. Stage 1 was 4 Nov.

Each item's full composition (renders at every width, the keyboard and accessibility walks, the copy table and the acceptance checklist) is on the design lane, `docs/coordination/ux/completion-4.0/<item>/`. Nothing here is applied to PINTAR: implementation, merges and promotion are separate gates.

## Change log against version 18 (8 Oct)

| Change | What |
|---|---|
| The freeze (c42fecb) | Version 18 predated it. Its three Second Eye corrections are now on the page: the table stripe's final wording (`tokens.json` `table-row-alt` usage, Colour), and two words in Validation's copy rows. **No token value changed.** |
| The brand | **Settled (D-192, D-193):** «PINTAR» as live text in Inter Bold (700, OFL, self-hosted), `#075056`, tracked 0.14 em, replacing the supplied PINTAR SELALU artwork everywhere; no image, no master. New card «Wordmark (text)»: the size ladder, clear space, versions. The 5 Oct Wordmark card is **marked superseded, not removed** (stage 1 marked it for D-161's «Pintar»; stage 2 for D-192/D-193). `.pds-merek` corrected from the Helvetica proof in `#245F55` to the text wordmark, so every shell preview shows it; the cover shows it. The palette is unchanged; no token value changed. |
| New section | This one: the outcomes, the canonical patterns (D-172), and the provisional list |
| Component corrections (4 Nov, D-172 S1–S6) | Found re-rendering the compositions; each corrected in `bundle.css` / `bundle.js`, not on a screen. **S1** Pagination: on a phone the buttons' words are visually hidden, never `display: none`, so each keeps its name. **S2** AppShell: in the rail each place keeps its own text as its name, visually hidden. **S3** Tooltip: a rail tooltip follows the rail's state, and shows at once on keyboard focus. **S4** DateTime: the ring on `:focus-within`, so the calendar button is ringed. **S5** Identity: the button is named by its own text after a visually hidden «Akun:», never an `aria-label` that drops what it shows (WCAG 2.5.3). **S6** Navigation: no link carries an `aria-label` repeating its own text (137 in the previews, and the bundle's template). Every preview re-checked: 60, 0 failures |
| Named steps (4 Nov, D-172 K8) | Every marker filled: done `ink-1`, the current step a `pintar-primary` pill, to come `line-control`; never an open circle or a ring (A5 B12) |
| New section «Visual Intelligence» (4 Nov) | The owner's direction adopted as a principle; no 4.0 work changed |

## The outcomes

| Item | What it settles | Status |
|---|---|---|
| **D1** CR-22 / DAISY-37 | The six emails in the DAISY-19 frame: the reason line, the context line (and its absence), warm white and the gold line, the card in the email; the email matrix; images blocked | Accepted for design; **built** with the text wordmark in the header and the card (D-192: no image). **Provisional:** «Akun PINTAR Anda di …» with Dr Gladys. Correction: the card's wordmark 16 px, not 13 px |
| **A1** W1.2 | Studio's question review: one whole lesson per view, nothing in the open lesson hidden, the key by word, icon, edge and ground | Accepted for design (D-166(b)); built on the engineering branch (E-A1-2). **Provisional:** its new words, pending copy approval |
| **A2** D1 | The Uji Cepat class figure: «Rata-rata nilai kelas» with its base | Accepted |
| **A3** D3 | The Uji Cepat class figure for a small group: **O3 (a), a threshold of 5** (owner). Below five, the «not yet» pattern with the scored count and the threshold; zero scored, the Empty state; individual scores stay visible | Accepted for design |
| **A4** | Batch 3 wordings | Accepted; **C3 and C9 with Dr Gladys**; X12 (paket / kursus / course) pending one consolidated decision |
| **A5** | Batch 3 layout confirmations | Accepted for design; three new keys pending copy approval |
| **B1** W3.6 | Konfigurasi as an index and one page per section | Accepted for design |
| **B2** UX-09 | **Nomor Registrasi Sekolah** (owner's ruling) | Accepted (owner's term) |
| **B4** | The card with a platform role beside a school role | Confirmed as built |
| **C1** W3.8 | Ringkasan Kelas and Sekolah bodies and their A4 print; the Management and professional-learning bodies | Accepted for design (D-167); built on the engineering branch. The approved metric words («Peserta», «Kenaikan», «Penguasaan per bagian») are laid out as they are. **Provisional:** the report titles (G6) and G2's question on the class and school labels, both Dr Gladys's |
| **C2** W2.16 | The PD Kelas «Lihat bukti» | Accepted for design. **Provisional:** its footnote (Dr Gladys) |
| **D2** | The certificate's file name, within W3.1 | Delivered |
| **D5** | The wordmark slots' geometry | **Superseded by D-192/D-193:** the slots are the text wordmark's ladder («Wordmark (text)»). Correction: the Digital Card's slot is 18.0 mm wide (the word at 3.99 mm), not 16.4 mm |
| **E1 + E2** W3.12 / W3.16 | One navigation experience: the AppShell's expanded navigation, rail (1024–1279 px), collapse and drawer under L3; the context control; the chooser `/` | Accepted for design, **implemented only together**. **Provisional:** the six expressions (G1) |
| **E3** | The Batch 2 questions | Delivered |
| **X12** | Paket Pembelajaran / Learning Package across every surface | Engineering's reconciliation; one decision for Dr Gladys and the owner |

## One PINTAR, one experience (D-172): the canonical patterns

Equivalent interactions look, feel and behave the same everywhere. **Learn it once, recognise it everywhere.** Each pattern is an existing component of this system:

| # | Interaction | The one pattern |
|---|---|---|
| P1 | The page's one main action | Button primary, one per view |
| P2 | Save, and Cancel | FormLayout: the primary, then «Batal» quiet, left-aligned at the end |
| P3 | Back | Link `pds-back`, naming its destination; never a bare «Kembali» where it is known |
| P4 | Close | In the head of what it closes, and Escape |
| P5 | The result of an action | Action feedback: the result beside the action, in words, never a toast |
| P6 | The result line | The mark and the words on one line |
| P7 | Act on one record | A list row's one action, opened in place, one at a time |
| P8 | A destructive act | Destructive, then destructive-confirm in place, with its reason; the typed phrase for a platform-wide stop |
| P9 | A long list's pages | Pagination: «Sebelumnya» / «Berikutnya», the position, never a hidden total (or what is shown, when it is unknown) |
| P10 | Views of one thing | Tabs; a filter is the segmented control |
| P11 | One value in a form | Radio rows (2–4), else a Select |
| P12 | Search and filter | The Collection; an empty filtered result offers «Hapus pencarian dan saringan» |
| P13 | Empty | The Empty state: a sentence, and the way on |
| P14 | Not yet | The statement in the figure's place, how far, what makes it appear |
| P15 | Refusal | HalamanPenolakan |
| P16 | Loading | MemuatHalaman |
| P17 | Optional reading | Disclosure, never for what must be read |
| P18 | Dates | DateTime and its echo; the one date helper |
| P19 | Where am I | The AppShell and the context control; `/` the one chooser |
| P20 | The page head | Back link, scope line (three levels or more), title, intro; no app-name eyebrow in the shell |
| P21 | A reason and a history | A well for the quoted reason; a record read in order |

**Accepted exceptions, each for a reason:** `/pimpinan`'s waiting decisions show their forms; A1 jumps by lesson title; an email action never ends in ✓; the Uji Cepat launch moves to its running stage; `/` has no shell; a withheld figure has no heading.

## Provisional, and why

| What | Waits on |
|---|---|
| «Akun PINTAR Anda di …» (D1) | Dr Gladys |
| The six context expressions (E2) | G1, Dr Gladys |
| The report titles (G6); G2's question on «Peserta» / «Kenaikan» at class and school level (C1) | Dr Gladys |
| The PD Kelas footnote (C2) | Dr Gladys |
| «arah berpikir» in a teacher's hint; the «Kursus» sheet (A4 C3, C9) | Dr Gladys; X12 |
| New presentation keys (A1, A5, B1, C1, C2, E3, the pager's unknown-total line) | Copy approval |
| The card with more than two role pairs | B3: the owner, explicitly unresolved |
| Whether «PINTAR SELALU» ever replaces «PINTAR» in running text | The owner (nothing here uses it) |

**Resolved since stage 1:** every wordmark slot and its versions (F-11 closed by D-192; «Wordmark (text)»); the tab icon (kept, D-192(4)).
