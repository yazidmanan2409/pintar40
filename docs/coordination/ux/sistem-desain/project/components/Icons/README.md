# Icons

PINTAR's icons: a fixed set of forty from Lucide, each with one meaning, always beside a word.

**Status: NEW, NEEDS A RULING (question 9).** PINTAR has no icon set today; the staff navigation's rail and the icon-only buttons need one.

**Source and licence**
- Lucide (`lucide-static` 0.468.0), ISC licence. The SVGs are copied unchanged; nothing is redrawn.
- The list lives in `alat/ikon.mjs`; the bundle draws them with `Pintar.ikon(name)`. In the product they become one module of inline SVGs, with the licence notice beside it.

**Drawing**
- 24 grid, stroke 1.75, round caps and joins, `currentColor`.
- `icon-md` 20 px beside `t-body`; `icon-sm` 16 px beside `t-small`; `icon-lg` 24 px only in an empty state.
- `ink-2` or `ink-3` at rest; `pintar-primary` for the current place.

**Rules**
- **One meaning per icon.** `users` is always Kelas; `log-out` is always Keluar. Never borrow an icon for a second meaning.
- **Beside a word.** An icon never replaces a label, except in an icon-only button, which has an accessible name and a tooltip.
- **Never status alone.** `check` comes with «Tersimpan»; an alert's icon comes with its sentence. Nothing is said by an icon's colour.
- **Decorative to a screen reader.** Every icon is `aria-hidden`; the word beside it is what is read.
- **No other set, no emoji, no hand-drawn icons.** A new meaning is a request to add one icon to this list.
