# Layout and responsive behaviour

Responsive is not a shrunken desktop. For each element the system decides whether it stays, moves, stacks, steps back or disappears, by its importance to the person at that moment.

## Space

A 4 px base used in 8s: `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-5` 24 · `space-6` 32 · `space-7` 40 · `space-8` 48 · `space-9` 64.

- Inside a control group: `space-2`. A label or help text to its field: `space-2`. Between fields: `space-4`. Between groups: `space-5`. A page header to its first section: `space-6`. Between sections: `space-8`.
- Lay siblings out with `gap`, not margins on each element.
- Empty space is intentional. Do not fill it.

## Widths

| Token | px | For |
|---|---|---|
| `measure-auth` | 400 | The sign-in form. |
| `measure-narrow` | 560 | One task: verification, a short form. |
| `measure-read` | 760 | Reading and forms. |
| `measure-stage` | 1120 | Tables and overviews. The widest anything goes. |
| `measure-prose` | 64ch | A paragraph's line length. |

**No 12-column grid.** A page is one column at its measure. Side-by-side items use an auto-fit grid with a minimum width (fields 220 px, cards 260 px), so the number of columns follows the screen.

## Screen bands

| Band | Shell | Gutter | Page title |
|---|---|---|---|
| Small, under 640 (`bp-medium`) | Top bar; navigation in a drawer | 16 | `t-page-compact` |
| Medium, 640 to 1023 | Top bar; navigation in a drawer | 24 | `t-page` |
| Large, 1024 to 1279 (`bp-large`) | Navigation as a rail (72 px, icons with tooltips) | 24 | `t-page` |
| Wide, 1280 and up (`bp-wide`) | Navigation expanded (248 px); the reader may collapse it | 24 | `t-page` |

Inside a page, components respond to the space they are given (container queries), not to the screen, so a table behaves the same in a wide page and in a narrow panel.

## What stays, moves, stacks or steps back

| Element | Wide | Narrow (under 640) |
|---|---|---|
| The page's one primary action | Beside the title, right | Under the title, left; never hidden |
| Secondary actions | Beside the primary | Wrap under it, or into a menu «Opsi lain» |
| Fields side by side | Auto-fit columns | One column |
| Table | Every column | Columns marked low priority step back; the table scrolls inside its frame with each row's name held still |
| A filter of 2 to 4 choices | Segmented control | A select with the same options |
| Pagination | Position, numbers where useful, labelled buttons | Position («2 / 16») and two icon buttons |
| Staff navigation | Expanded, or the rail | A top bar with the place's name; the full navigation in a drawer |
| Learner navigation | Top bar: two places, Bantuan, language, the name, Keluar | The same bar; the places take their own row and the name steps back |
| Identity | The bottom of the navigation | The bottom of the drawer |

**Never turn every dataset into cards on small screens.** A row of a table stays a row. A list of records read one at a time (a learner's own chapters) may be a list of rows with two lines each; that is a list, not cards.

## School reality

- **A phone is never required** for a student's school journey. SD and SMP students may have no phone at school; every essential student task works on a shared computer or tablet.
- **The reference staff screen is a 1366 × 768 laptop** (a typical school laptop or Chromebook). At that width the expanded navigation still leaves 1118 px of content.
- **Shared tablets** (around 800 × 1280 portrait, 1180 × 820 landscape) get the top bar in portrait and the rail in landscape, with every control at 44 px.
- **Nothing is wider than 320 px** where a page must work on a phone: sign-in, verification, activation, account recovery.
