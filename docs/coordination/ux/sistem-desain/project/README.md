**Status: a proposal for review (token set v3, draft).** The product still runs token set v2 (`src/app/globals.css`). Nothing here is applied to PINTAR until Yazid approves it. The «Proposal and open questions» section lists what is new, what changed and what needs a ruling.

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
- **Actions are a verb and its object.** «Terbitkan Bab 4», «Kirim kartu», «Keluarkan dari kelas». Never «OK», «Ya» or «Submit». A destructive act names itself on its own button.
- **The completion grammar.** One pattern, three words: the verb, its progressive with an ellipsis, then ✓ and its result.
  - Simpan → Menyimpan… → ✓ Tersimpan
  - Kirim → Mengirim… → ✓ Terkirim
  - Terbitkan → Menerbitkan… → ✓ Selesai
  The result line beside it then says what changed for whom: «Bab 3 tersedia untuk 31 murid Kelas 5A mulai sekarang.»
  **Email is the exception.** PINTAR cannot confirm that an email arrived, so an email action never ends in ✓ or «Terkirim»: it says PINTAR is sending («PINTAR sedang mengirim kode baru.»), D-098(c), enforced by EMAILJUJUR-L01. «✓ Terkirim» is only for a result the server confirmed.
- **Nobody is named on a shared screen unless they are staff.** Staff see their own name; a learner sees «Bukan akun Anda?» and «Keluar» (S15, D-020). «Keluar» is visible on every signed-in screen.
- **Words live in the copy table** (`src/lib/hle.ts`, D-014). Never an internal word («Menunggu», «Salah», "Failed"), never a promise to notify («notifikasi», «pemberitahuan»), never «dikunci» on a learner's line.
- **Navigation is a short noun** («Kelas», «Pimpinan», «Konfigurasi»). A heading may be a question or a purpose («Apa yang sudah bisa disimpulkan»). «Kembali» names its destination when it is not obvious («Kembali ke Kelas 5A»).
- **Numbers never stand alone.** «24 dari 31», never «77%» without its base; «Belum cukup untuk disimpulkan», never a zero standing in for an unknown.
- **Dates and times** are Jakarta time and say so: «Jumat, 9 Okt 2026, 07.30 WIB». Time uses a full stop.
- **Quoting the interface** uses guillemets: «Simpan».
- **A middle dot binds to the word before it.** «Bab&nbsp;3&nbsp;· Pecahan senilai» uses no-break spaces so no line starts with «·».
- **Errors blame nobody and say what to do.** «Kode ini tidak cocok. Pakai kode di email terbaru, atau minta kode baru.» Never raw server text (D-011); an unknown failure gives a calm sentence and a short reference.
- **No celebration.** No «Hebat!», no confetti, no badges or points (D-059(e)). Success is the plain fact of what happened.

## Visual foundations

- **Colour.** The canvas is `surface-0`; objects that must stand apart sit on `surface-1`; quiet wells and hover use `surface-2`; pressed uses `surface-3`. Text is `ink-1`, then `ink-2` for secondary text, then `ink-3` for metadata. `pintar-primary` is the one primary action, links, focus and selection. Status colours (`status-ok`, `status-attention`, `status-blocked`, `status-info`) each pair with their `-soft` ground and always come with a word. Never put a status colour on a person. The card and certificate family colours and the warm gold line are identity colours for those artifacts only, never interface colours.
- **Type.** Plus Jakarta Sans at 400 and 600; IBM Plex Mono 500 for identifiers (`t-identifier`), exactly the weights v2 uses. No third weight. Eight sizes (`t-display` 36, `t-page` 30, `t-section` 22, `t-subsection` 18, `t-body` 16, `t-small`/`t-label` 14, `t-eyebrow` 12), plus the learner's question stem (`t-stem`, unchanged). Figures in tables and statistics are tabular.
- **Space.** A 4 px base used in 8s (`space-1` to `space-9`). Fields are `space-4` apart, groups `space-5`, sections `space-8`. The gutter is 16 px below 640 px, 24 px above.
- **Layout.** One column at its measure: `measure-narrow` (560) for a task, `measure-read` (760) for reading and forms, `measure-stage` (1120) for tables. No 12-column grid; side-by-side items use an auto-fit grid with a minimum width.
- **Lines.** One weight, 1 px. `line` divides; `line-control` outlines fields (3:1); `line-strong` outlines secondary buttons. 2 px only for focus and the selected tab.
- **Corners.** `radius-md` 8 (controls, menus), `radius-lg` 12 (panels, tables, dialogs), `radius-pill` (badges, the switch), as v2. `radius-sm` 4 for checkboxes and tags is proposed (question 7) to replace the literal 6 px. Nothing larger.
- **Elevation.** None in the page: hairlines and grounds separate things, as v2 rules. Proposed (question 5): a small shadow only on a layer floating above the page, `shadow-overlay` for menus and tooltips and `shadow-dialog` over `scrim` for dialogs and drawers. No blur filters, no backdrop filters.
- **Motion.** Colour and opacity only, at `duration-base` (160 ms), with the working dot's `duration-pulse` (900 ms), as v2 rules. Motion acknowledges, guides attention, shows continuity or confirms completion; otherwise it is not there. Nothing spins, bounces or slides. Under `prefers-reduced-motion`, nothing moves. Further durations and any travel are proposals for Yazid (question 8).
- **States.** Hover is one step of ground or ink; pressed one more; focus is always the same 2 px `focus-ring` with a 2 px offset; selected is `pintar-primary-soft` or the tab underline, with weight 600; disabled is `surface-2` with `ink-disabled`, and always says why nearby.
- **Targets.** Every control is at least `control-md` (44 px) to hit. Sign-in and a learner's own primary action use `control-lg` (52); the class-card path uses `control-xl` (60).

## Iconography

- **Source.** Lucide (ISC licence), a fixed set of forty icons copied unchanged (see Icons). No other icon set and no hand-drawn icons.
- **Drawing.** 20 px (`icon-md`) on a 24 grid, stroke 1.75, round caps and joins, in `currentColor`: `ink-2` or `ink-3` at rest, `pintar-primary` when the item is current. 16 px (`icon-sm`) beside 14 px text.
- **Use.** An icon accompanies a label; it never replaces one, except in an icon-only button, which always has an accessible name and a tooltip. Icons never carry status alone: ✓ «Selesai» has its word.
- **No emoji** in the interface chrome.

## Imagery and the mark

- **The mark** is the supplied PINTAR SELALU artwork (Logos), used as it is: height only (36 px in the navigation, 32 px in the top bar, 44 px standalone), never cropped, recoloured, redrawn or set as text, and never below 32 px. The collapsed rail shows no mark.
- **No illustrations, stock photos or decorative graphics** in the interface. An empty state is a sentence and an action.
- **A school's own mark** may one day replace the PINTAR mark in the same place, and nothing else changes (the institution-mark ruling): not a token, not a colour, not a component.
