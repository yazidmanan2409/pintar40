# Completion 4.0

**Stage 1 of the republication (D4, W3.21), 4 Nov.** The frozen system with the outcomes of PINTAR 4.0's design-completion items that needed no decision. **Provisional** marks everything that waits on F-11 or on an owner or Dr Gladys decision; nothing provisional is final. Stage 2 resolves them after F-11 and the gated decisions.

Each item's full composition (renders at every width, the keyboard and accessibility walks, the copy table and the acceptance checklist) is on the design lane, `docs/coordination/ux/completion-4.0/<item>/`. Nothing here is applied to PINTAR: implementation, merges and promotion are separate gates.

## Change log against version 18 (8 Oct)

| Change | What |
|---|---|
| The freeze (c42fecb) | Version 18 predated it. Its three Second Eye corrections are now on the page: the table stripe's final wording (`tokens.json` `table-row-alt` usage, Colour), and two words in Validation's copy rows. **No token value changed.** |
| The brand | The public wordmark is «Pintar» in `#075056` (D-161, D-163(a)); the palette unchanged. The Wordmark card is **marked superseded, not removed**. The cover's wordmark is the placeholder «Pintar (master pending F-11)». |
| New section | This one: the outcomes, the canonical patterns (D-172), and the provisional list |

## The outcomes

| Item | What it settles | Status |
|---|---|---|
| **D1** CR-22 / DAISY-37 | The six emails in the DAISY-19 frame: the reason line, the context line (and its absence), the wordmark slot, warm white and the gold line, the card in the email; the email matrix; images blocked | Accepted for design. **Provisional:** the wordmark slot (F-11); «Akun PINTAR Anda di …» with Dr Gladys |
| **A1** W1.2 | Studio's question review: one whole lesson per view, nothing in the open lesson hidden, the key by word, icon, edge and ground | Accepted for design |
| **A2** D1 | The Uji Cepat class figure: «Rata-rata nilai kelas» with its base | Accepted |
| **A4** | Batch 3 wordings | Accepted; **C3 and C9 with Dr Gladys**; X12 (paket / kursus / course) pending one consolidated decision |
| **A5** | Batch 3 layout confirmations | Accepted for design; three new keys pending copy approval |
| **B1** W3.6 | Konfigurasi as an index and one page per section | Accepted for design |
| **B2** UX-09 | **Nomor Registrasi Sekolah** (owner's ruling) | Accepted (owner's term) |
| **B4** | The card with a platform role beside a school role | Confirmed as built |
| **C1** W3.8 | Ringkasan Kelas and Sekolah bodies and their A4 print; the Management and professional-learning bodies | Accepted for design. **Provisional:** the report titles (G6) and the class/school labels (G2) |
| **C2** W2.16 | The PD Kelas «Lihat bukti» | Accepted for design. **Provisional:** its footnote (Dr Gladys) |
| **D2** | The certificate's file name, within W3.1 | Delivered |
| **D5** | The wordmark slots' geometry | Delivered. **Provisional throughout** (F-11) |
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
| Every wordmark slot, and the reversed version | F-11: the master |
| «Akun PINTAR Anda di …» (D1) | Dr Gladys |
| The six context expressions (E2) | G1, Dr Gladys |
| The report titles; «Peserta» / «Kenaikan» at class and school level (C1) | G6, G2, Dr Gladys |
| The PD Kelas footnote (C2) | Dr Gladys |
| «arah berpikir» in a teacher's hint; the «Kursus» sheet (A4 C3, C9) | Dr Gladys; X12 |
| New presentation keys (A5, B1, C1, C2, E3, the pager's unknown-total line) | Copy approval |
| The card with more than two role pairs | B3: the owner, explicitly unresolved |
| Where «PINTAR SELALU» replaces «PINTAR» in running text; the tab icon's colour | The owner |
