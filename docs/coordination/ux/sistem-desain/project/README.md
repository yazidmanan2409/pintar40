**PINTAR 4.0 design completion, stage 1 (republished 4 Nov).** This page is the frozen system (c42fecb) with the outcomes of the design-completion items that needed no decision, and the settled brand: the public wordmark is «Pintar» in `#075056` in every slot once its master exists (F-11, D-161, D-163(a)); the interface palette is unchanged (`--pintar-primary` `#245F55`). **Everything waiting on F-11 or on a decision is marked provisional.** The record, the change log against version 18, and the canonical patterns are in «Completion 4.0».

**Status: approved in principle (token set v3, 5 Oct).** Yazid has ruled on all seventeen questions; «Proposal and rulings» records each ruling. **APPLICATION READY (8 Oct).** J1 to J7 are composed («Composed journeys»), walked and recorded; every finding is corrected at source and every open question decided within the approved grammar; the stripe is A. «Validation» holds the records. The application pass begins with the authorised UI/UX stage. The product still runs token set v2 (`src/app/globals.css`): nothing here is applied to PINTAR until the authorised UI/UX stage begins.

## The intent

**Complex underneath. Calm above.** PINTAR carries evidence, permissions and history; the person using it should feel none of that weight. Every rule below serves one of these:

- **One obvious next action per screen.** Exactly one `pintar-primary` button is visible at a time; everything else is secondary, quiet or behind a menu.
- **Hierarchy from type and space before boxes.** Reach for `t-section`, `t-subsection` and `space-6`/`space-8` before a border or a panel. A container must earn its place (see Panel).
- **The workspace is premium real estate.** Every persistent element earns its place: no decorative dashboards, no "stat tiles" unless the figure is the point of the page, no box drawn round a heading and a paragraph.
- **Quiet by default, colour with a reason.** The interface is neutral: `surface-0`, `ink-1` to `ink-3` and one green. Status colour appears only where there is a state to read, and success (`status-ok`) is rare enough to mean something.
- **PINTAR hears every click.** Every action answers at once, says what it is doing, says honestly how it ended, and offers the next step (Action feedback). It never claims success before the server confirms it, and never fakes progress.
- **Built for school reality.** Shared computers and tablets, 1366 × 768 laptops, slow networks, children who are still learning to read. Nothing depends on a phone, on hover, on animation or on a fast machine.

## Content fundamentals

PINTAR speaks plain Bahasa Indonesia first; English is the second language of every string. Terminology v1 (D-068) decides the words: «Murid», «Guru», «Kelas», «Bab», «Uji Cepat», «Sertifikat», «Akun saya».

- **Address.** Staff are «Anda». Learner copy avoids pronouns: «Ini yang sedang berjalan hari ini.», «Lanjutkan pelajaran». Never «kamu», never a nickname, never an exclamation mark.
- **Case.** Sentence case everywhere: «Tambah guru», not «Tambah Guru». The only capitals are `t-eyebrow`, one short line of context above a title.
- **Actions are a verb and its object.** «Sediakan Bab 4», «Kirim kartu», «Nonaktifkan Kelas 5C». Never «OK», «Ya» or «Submit». A bare verb is allowed only where the heading right above it names the object («Terbitkan» under the chapter's step «Terbitkan»). A destructive act names itself on its own button.
- **The completion grammar.** One pattern, three words: the verb, its progressive with an ellipsis, then ✓ and its result.
  - Simpan → Menyimpan… → ✓ Tersimpan
  - Kirim → Mengirim… → ✓ Terkirim
  - Terbitkan → Menerbitkan… → ✓ Diterbitkan
  The result line beside it then says what changed for whom: «Bab 4 disediakan untuk 31 murid Kelas 5A mulai Senin, 12 Okt 2026.» Publishing is the school's, in Studio; a teacher makes published material available to a class («Siapkan materi», then «Sediakan»).
  **Email is the exception.** PINTAR cannot confirm that an email arrived, so an email action never ends in ✓ or «Terkirim»: it says PINTAR is sending («PINTAR sedang mengirim kode baru.»), D-098(c), enforced by EMAILJUJUR-L01. «✓ Terkirim» is only for a result the server confirmed.
- **Nobody is named on a shared screen unless they are staff.** Staff see their own name; a learner is never named in the bar, which says «Bukan akun Anda?» and «Keluar» (S15). The one exception is the learner's first name in the greeting on Belajar and the home page (D-020). «Keluar» is visible on every signed-in screen.
- **Words live in the copy table** (`src/lib/hle.ts`, D-014). Never an internal word («Menunggu», «Salah», "Failed"), never a promise to notify («notifikasi», «pemberitahuan»), never «dikunci» on a learner's line.
- **Navigation is a short noun** («Kelas», «Pimpinan», «Konfigurasi»). A heading may be a question or a purpose («Apa yang sudah bisa disimpulkan»). «Kembali» names its destination when it is not obvious («Kembali ke Kelas 5A»).
- **Numbers never stand alone.** «24 dari 31», never «77%» without its base; «Belum cukup untuk disimpulkan», never a zero standing in for an unknown.
- **Dates and times** are day before month, Jakarta time, and say so: «Jumat, 9 Okt 2026, 07.30 WIB». Time uses a full stop and 24 hours. The month is in words wherever a misreading would matter; «09/10/2026» only in a dense column of dates (see Dates and times).
- **Quoting the interface** uses guillemets: «Simpan».
- **A middle dot binds to the word before it.** «Bab&nbsp;3&nbsp;· Pecahan senilai» uses no-break spaces so no line starts with «·».
- **Errors blame nobody and say what to do.** «Kode ini tidak cocok. Pakai kode di email terbaru, atau minta kode baru.» Never raw server text (D-011); an unknown failure gives a calm sentence and a short reference.
- **No celebration.** No «Hebat!», no confetti, no badges or points (D-059(e)). Success is the plain fact of what happened.

## Visual foundations

- **Colour.** The canvas is `surface-0`; objects that must stand apart sit on `surface-1`; quiet wells and hover use `surface-2`; pressed uses `surface-3`. Text is `ink-1`, then `ink-2` for secondary text, then `ink-3` for metadata. `pintar-primary` is the one primary action, links, focus and selection. Status colours (`status-ok`, `status-attention`, `status-blocked`, `status-info`) each pair with their `-soft` ground and always come with a word. An accent appears only where it says context, hierarchy, state or attention (Accent; approved, question 12); a selection is filled or underlined, never hinted. Never put a status colour on a person. The card and certificate family colours and the warm gold line are identity colours for those artifacts only, never interface colours.
- **Type.** Plus Jakarta Sans at 400 and 600; IBM Plex Mono 500 for identifiers (`t-identifier`), exactly the weights v2 uses. No third weight. Eight sizes (approved, question 4: `t-display` 36, `t-page` 30, `t-section` 22, `t-subsection` 18, `t-body` 16, `t-small`/`t-label` 14, `t-eyebrow` 12), plus the learner's question stem (`t-stem`, unchanged). Figures in tables and statistics are tabular.
- **Space.** A 4 px base used in 8s (`space-1` to `space-9`). Fields are `space-4` apart, groups `space-5`, sections `space-8`. The gutter is 16 px below 640 px, 24 px above.
- **Layout.** One column at its measure: `measure-narrow` (560) for a task, `measure-read` (760) for reading and forms, `measure-stage` (1120) for tables. No 12-column grid; side-by-side items use an auto-fit grid with a minimum width.
- **Lines.** One weight, 1 px. `line` divides; `line-control` outlines fields (3:1); `line-strong` outlines secondary buttons. 2 px only for focus and the selected tab.
- **Corners.** `radius-md` 8 (buttons, fields, menus; kept, question 13), `radius-lg` 12 (panels, tables, dialogs), `radius-pill` (every small label: badges and tags; the switch), as v2. `radius-sm` 4 for checkboxes, small square controls and skeleton blocks (approved, question 7) replaces the literal 6 px. Nothing larger.
- **Elevation.** None in the page: hairlines and grounds separate things, and ordinary surfaces and cards stay flat. Approved (question 5): a restrained small shadow only on a genuine floating layer, `shadow-overlay` for menus and tooltips and `shadow-dialog` over `scrim` for dialogs and drawers. No blur filters, no backdrop filters.
- **Motion** (approved, question 8). Hover and press 120 ms (`duration-fast`); an ordinary colour or opacity change 160 ms (`duration-base`); a floating layer entering 240 ms (`duration-slow`), travelling 8 px at most; a disclosure's chevron may turn; the working dot's `duration-pulse` (900 ms). Motion acknowledges, guides attention, shows continuity or confirms completion; otherwise it is not there. Nothing spins, bounces or slides across the page. Under `prefers-reduced-motion`, every nonessential motion is removed.
- **States.** Hover is one step of ground or ink; pressed one more; focus is always the same 2 px `focus-ring` with a 2 px offset; selected is `pintar-primary-soft` or the tab underline, with weight 600; disabled is `surface-2` with `ink-disabled`, and always says why nearby.
- **Targets.** Every control is at least `control-md` (44 px) to hit. Sign-in and a learner's own primary action use `control-lg` (52); the class-card path uses `control-xl` (60).

## Iconography

- **Source.** Lucide (ISC licence), PINTAR's single icon source (approved, question 9): a fixed set of forty icons copied unchanged (see Icons). No other icon set and no hand-drawn icons.
- **Drawing.** 20 px (`icon-md`) on a 24 grid, stroke 1.75, round caps and joins, in `currentColor`: `ink-2` or `ink-3` at rest, `pintar-primary` when the item is current. 16 px (`icon-sm`) beside 14 px text.
- **Use.** An icon accompanies a label; it never replaces one, except in an icon-only button, which always has an accessible name and a tooltip. Icons never carry status alone: ✓ «Selesai» has its word.
- **No emoji** in the interface chrome.

## The wordmark and imagery

> **Superseded in part (D-161, D-163(a), 4 Nov).** The public wordmark is **«Pintar» in `#075056`** in every slot once the master exists (F-11); until then each slot holds a placeholder labelled «Pintar (master pending F-11)». The «PINTAR» capitals in `#245F55` described below are **kept for the record and superseded**. The slots' geometry is **provisional** («Completion 4.0», D5). Where «PINTAR SELALU» replaces «PINTAR» in running text, and the tab icon's colour, are the owner's and **open**. The palette is unchanged.

- **The wordmark is PINTAR** (approved brand ruling, 5 Oct; locked).
  - The name in Helvetica Neue 65 Medium capitals, tracking +50, in PINTAR green #245F55, and nothing else: no symbol, no tagline, no «SELALU».
  - Clear space X (the cap height) on every side. Never smaller than a 12 px cap height on screen or 15 mm wide in print.
  - Four versions: green on light, white on green, black, white. See Wordmark for the full production specification.
  - In the product it is outlined artwork, never live text. It replaces the supplied «PINTAR SELALU» artwork everywhere in the interface.
  - Helvetica Neue 65 Medium is the canonical face. The master is made only after the font licence is verified to permit logo artwork, outlining and distribution; no other face substitutes for it. Until then, every wordmark shown is a proof.
- **PINTAR is the only identity inside the product, and the family's one name** (5 Oct): the application, the ID card, the certificate and the documents all carry PINTAR. The ID card and the certificate replaced their «PINTAR SELALU» line with the wordmark as a brand correction, and nothing else in them changed. PT ZAYD PINTAR SELALU, the legal company, appears only where the company itself must: legal and privacy information, official correspondence, and the legal line in a footer. pintarselalu.com is an address, never a brand name.
- **No second mark** (5 Oct): no standalone P, monogram, education symbol or secondary logo. The browser tab's icon is a functional identifier, not a logo: a plain PINTAR-green square (`assets/AppIcon/`). A permanent app icon is a later decision.
- **No illustrations, stock photos or decorative graphics** in the interface. An empty state is a sentence and an action.
- **A school's own mark** may one day replace the PINTAR wordmark in the same place, and nothing else changes (the institution-mark ruling): not a token, not a colour, not a component.
