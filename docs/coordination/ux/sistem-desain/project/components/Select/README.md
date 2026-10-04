The native select, drawn in tokens: one choice from five or more known options.

**Status: CHANGED,** with the field rules above.

**Markup.** `span.pds-select` > `select` + the chevron icon. Label, help and error as TextField.

**When**
- Five or more options, or options that change with data (a class, a role).
- Two to four options: a segmented control or radios instead, so the choices are visible.
- A long list (more than about 15): a select with search, or a search field.

**Rules**
- The first option of a required select is a prompt («Pilih peran»), not a real value.
- A select never changes the page by itself; a following button applies it, or it is a link list. (Pimpinan's scope list is plain links for this reason.)

**In PINTAR today.** `.pin-picker select`, `.pin-lselect`, Konfigurasi's Tailwind selects.
