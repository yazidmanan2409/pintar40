One value from two to four: a filter, a language, a view. Each segment is a full 44 px target.

**Status: CHANGED** in size only. `.pin-seg` and the language switch `.pin-lang` (26 px) become this one pattern, at 44 px. The selected segment stays filled `pintar-primary`, as in v2.

**Markup.** `div.pds-seg[role=radiogroup][aria-label]` > `label` > `input[type=radio]` + `span`. Native radios, so keyboard and screen readers work without script.

**States.** The selected segment is filled `pintar-primary` with `pintar-primary-ink` text on the `surface-2` track, as v2's `.pin-seg`, `.pin-switch` and the language switch already are. The fill makes the state readable at 3:1 or better (WCAG 1.4.11); an earlier draft's white-on-grey did not, and the 4 Oct references draw selection the same filled way. Hover on an unselected segment is `surface-3`. Focus is the ring on the segment's edge, clear of the fill.

**Rules**
- Two to four options whose labels fit. Five or more, or labels that do not fit at the width: a select with the same options (the Table preview shows the switch below 640 px).
- It changes what is shown, never what is saved. A setting that is saved is a switch or a form.
- A count may follow a label in `ink-3`.

**In PINTAR today.** `.pin-seg` (filled green when chosen), the language switch `.pin-lang` (26 px) and `.pin-switch`. v3 makes them one, quieter, and 44 px.
