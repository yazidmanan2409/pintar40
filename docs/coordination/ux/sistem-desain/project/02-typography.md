# Typography

Hierarchy comes from type and space before it comes from boxes. Two faces, two weights and eight sizes are enough for every PINTAR screen.

## Faces

- **Plus Jakarta Sans** at 400 and 600 for everything people read. Self-hosted (`public/fonts`, Latin and Latin Extended), so a school's network never waits on a font server.
- **IBM Plex Mono** at 500 for identifiers only: a PINTAR ID («7Q2Z 0D9K»), a certificate number, a code, a reference. Never for prose or numbers in tables.
- No third face and no third weight. Bold is 600; there is no 700.

## The ladder

| Style | Size / line | Weight | Use |
|---|---|---|---|
| `t-display` | 36 / 44 | 600 | A verdict a stranger reads first, or a welcome. One per page at most. |
| `t-page` | 30 / 36 (26 / 32 below 640 px) | 600 | The page title. One per page. |
| `t-section` | 22 / 28 | 600 | A section of a page. |
| `t-subsection` | 18 / 26 | 600 | A subsection, a panel or dialog title, a course line. |
| `t-body` | 16 / 24 | 400 | Everything people read and type; buttons at 44 px. |
| `t-prose` | 16 / 26 | 400 | Sustained reading (a lesson), at `measure-prose` (64ch). |
| `t-small` | 14 / 20 | 400 | Help text, metadata, captions, table cells in a dense table. |
| `t-label` | 14 / 20 | 600 | Field labels, table headers, badges, compact buttons. |
| `t-eyebrow` | 12 / 16 | 600, capitals, +0.06em | One short line of context above a title. The only capitals. |
| `t-stat` · `t-stat-small` | 30 / 36 · 22 / 28 | 600, tabular | A figure, always followed by what it is out of and what it means. |
| `t-identifier` | 14 / 20 | Mono 500 | IDs, numbers, codes; never broken across lines. |
| `t-stem` · `t-stem-compact` | 21 / 32 · 19 / 28 | 400 | The question a learner is answering. Unchanged from v2, kept outside the ladder on purpose. |

## From v2 to v3

v2 has 14 interface sizes, several within a pixel of each other. v3 keeps 8.

| v2 | v3 | What changes on screen |
|---|---|---|
| eyebrow 12 | `t-eyebrow` 12 | Nothing. |
| fine 13 | `t-small` 14 | Scope lines and definition labels grow 1 px. |
| meta 14 | `t-small` 14 | Nothing. |
| 15 (literals: header tabs, the status line, «Kembali», the sign-in panel on a phone) | `t-body` 16 | They grow 1 px. |
| body 16 | `t-body` 16 | Nothing. |
| card 17 | `t-subsection` 18 | Card titles grow 1 px. |
| course 20 | `t-subsection` 18 | Course lines and card headings shrink 2 px (not on the certificate). |
| subhead 22 | `t-section` 22 | Nothing. |
| section 24 | `t-section` 22 | Section headings shrink 2 px. |
| 26, 27 (literals: the phone page title, the sign-in headings) | `t-page-compact` 26 | One compact title size. |
| 32 (literal, `.pin-metric`) | `t-stat` 30 | The headline figure shrinks 2 px. |
| 20 (literal, the class-card field) | 22 | The card's characters grow 2 px; the field is `control-xl`. |
| page 30 | `t-page` 30 | Nothing. |
| hero 36 | `t-display` 36 | Nothing. |
| The certificate: name 40, 44 printed, 32 on a phone; course 20, 18 on a phone; number 15; verification link 12.5; the sheet's line 15 | unchanged | The certificate's own sizes, outside the interface ladder. The certificate is frozen (D-074, D-080, the 4 Oct rulings). |
| stem 21 / 19 | `t-stem` unchanged | Nothing. |

## Rules

- **One `t-page` per page**, and nothing between it and `t-display`.
- **Figures are tabular** wherever they line up (tables, statistics, counts, times).
- **Line length**: prose at most `measure-prose` (64ch); forms at `measure-read` (760 px).
- **Headings balance** (`text-wrap: balance`) and never end with a full stop.
- **A middle dot binds to the word before it**: «Bab 3 · Pecahan senilai» uses no-break spaces before and after «·» so no line starts with it.
- **Truncation is a last resort.** Names and titles wrap. Only a single-line UI slot (the navigation, the identity block) may ellipsize, and then the full text is available as the accessible name.
