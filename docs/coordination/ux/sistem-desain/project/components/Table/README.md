Educational and administrative data in rows: search, filter, sort, select, act and page, in one frame.

**Status: NEW** as a shared component. Rows are striped after Dr Gladys's comment (accepted 5 Oct; see Table rows). Today: `.pin-ttabel` (lesson tables), `.pin-row` lists, and Konfigurasi's Tailwind tables.

**Anatomy**
- **Toolbar:** a search field and up to one segmented filter (a select below 640 px). When rows are selected, the action bar replaces nothing and appears above the table: «2 dipilih», the bulk actions, «Batalkan pilihan».
- **Frame:** `pds-table-frame` on `surface-1` with a hairline and `radius-lg`. When it can scroll, it is focusable (`tabindex="0"`, `role="region"` with a name).
- **Header:** `t-label` in `ink-2` on `table-head`, sticky. A sortable column's header is a button with `aria-sort` on the `th`.
- **Rows:** 52 px or more, alternating `table-row` and `table-row-alt`, with hairlines between rows and none between columns. The identifying cell is a `th scope="row"` and holds the row's checkbox and the name.
- **Cells:** numbers right-aligned and tabular, with their base («3 dari 5»); a status is a badge; a date is «3 Okt 2026», or «03/10/2026» in a narrow column of dates only (see Dates).
- **Row actions:** one visible text action («Lihat») and a menu («Opsi untuk …») for the rest; a destructive item last, in red, opening its confirmation.
- **Pagination** underneath (see Pagination).

**States.** Hover only on rows that open (`table-row-hover`). Selected rows on `table-row-selected` with a 3 px edge and the checked box. A sorted column's icon in `ink-1`. Selected wins over hover, and hover over a stripe.

**Empty.** «Tidak ada murid yang cocok» with a way back, inside the frame. A table with no rows at all is an Empty state, not an empty table.

**Long values.** Names wrap and never break inside a word (`min-width` 16ch); identifiers never wrap; nothing is clipped.

**Responsive.** Below 640 px, columns marked `data-prioritas="rendah"` step back; the table scrolls inside its frame with each row's name held still. **No card view.**

**Rules**
- Alphabetical by name is the default order; there is no ranking (pengajar.ts: «Alphabetical, and that is the only order»).
- Quiet stripes to follow a row (Dr Gladys, 5 Oct). No vertical lines, and no coloured rows for status.

**In PINTAR today.** `.pin-ttabel` (lesson tables), `.pin-row` lists, Pendataan's name list, Konfigurasi's Tailwind tables.
