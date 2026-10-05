Rows in a long table: a quiet stripe to follow a row across, and hover and selection that each read on their own.

**Status: NEW (Dr Gladys, accepted 5 Oct).** Every surface is an existing PINTAR colour under a table role; no new colour is introduced. Not applied to PINTAR until approved.

**The surfaces**
| Role | Token | Is | Job |
|---|---|---|---|
| Header | `table-head` | `surface-2` | The header row's own ground, under `ink-2` labels at 600. Never used for a row. |
| Row | `table-row` | `surface-1` | Odd body rows. |
| Alternate row | `table-row-alt` | `surface-0` | Even body rows: the canvas tint, enough to follow a row across and too quiet to mean anything. |
| Under the pointer | `table-row-hover` | `surface-3` | Only a row that opens. One step darker than either stripe, so it can never be taken for a stripe. |
| Selected | `table-row-selected` | `pintar-primary-soft` | Whatever its stripe, with a 3 px `pintar-primary` edge and its checked box. |

**Rules**
- Stripes count visible rows only: a filter or a page never leaves two tinted rows together.
- Selected wins over hover, and hover wins over a stripe. Each state also has a second sign: the checked box and the edge for selected, the pointer for hover.
- Every text colour keeps its contrast on every row ground. The tightest is `ink-3` under the pointer at 4.52:1, so nothing quieter than `ink-3` goes in a table.
- No colour per row for status: a status is a badge in its cell. No vertical lines.
- Stripes are for tables with columns. A list (one column of rows) keeps hairlines only.
- Print keeps the stripes. They are light enough for a school printer, and help a teacher follow a printed row.

**How strong a stripe (for Dr Gladys and Yazid).** The card shows three strengths side by side.
- **A, proposed:** `surface-0`, existing tokens only. Every state stays distinct. Its weakness is that the stripe is quiet (1.04:1 against white). It shows on a good screen; on a washed-out projector or a cheap laptop panel it may fade. Check it on a school computer before ruling.
- **A+, if A proves too faint:** halfway between `surface-0` and `surface-2` (#F7F6F2). It is derived from two approved tokens but is a new value, so it needs a ruling. Every state still stays distinct.
- **B, not proposed:** `surface-2`. It tracks best, but a neutral badge («Belum mulai», `surface-2`) loses its ground on every second row, and the header has to move to `surface-3`, which is also the row under the pointer.
