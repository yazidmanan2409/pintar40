One field to find something in a list: an icon, the field, a clear button, and a count of what matched.

**Status: NEW** as a shared component (lists filter in several ways today).

**Markup.** `span.pds-search` > the search icon + `input.pds-input[type=search]` + `button.pds-search-hapus` (hidden while empty). A help line under it, `aria-live="polite"`, says how many matched.

**Rules**
- Results update as the person types when the list is already on the page; otherwise on Enter.
- Always say how many matched, and when nothing does, say so and offer a way back («Hapus pencarian»).
- The placeholder says what can be searched («Nama atau PINTAR ID»); the label is still there (visually, or as `aria-label` in a toolbar).
