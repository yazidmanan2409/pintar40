One value from two to four: a filter, a language, a view. Each segment is a full 44 px target.

**Status: CHANGED.** `.pin-seg` and the language switch `.pin-lang` (26 px) become this one pattern, at 44 px.

**Markup.** `div.pds-seg[role=radiogroup][aria-label]` > `label` > `input[type=radio]` + `span`. Native radios, so keyboard and screen readers work without script.

**States.** The selected segment is `surface-1` with a `line-strong` outline on the `surface-2` track: unmistakable without a fill of colour. Focus is the ring.

**Rules**
- Two to four options whose labels fit. Five or more, or labels that do not fit at the width: a select with the same options (the Table preview shows the switch below 640 px).
- It changes what is shown, never what is saved. A setting that is saved is a switch or a form.
- A count may follow a label in `ink-3`.

**In PINTAR today.** `.pin-seg` (filled green when chosen), the language switch `.pin-lang` (26 px) and `.pin-switch`. v3 makes them one, quieter, and 44 px.
