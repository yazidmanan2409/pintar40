One field: its label above, help under the label, the field, and its error under the field.

**Status: CHANGED.** 40 px becomes 44 px; the outline goes from 1.6:1 to 3:1 (`line-control`, approved, question 3); the error edge is drawn inside so nothing moves.

**Markup.** `pds-field` > `label.pds-label` (+ `span.pds-opsional` «(opsional)») > `p.pds-help` > `input.pds-input` > `p.pds-error`. The input's `aria-describedby` names the help and the error.

**Sizes.** 44 px by default; `pds-input-lg` (52 px) on sign-in. Width follows the content expected: `pds-input-pendek` (20ch) for a short value.

**States.** Default (`line-control`, 3:1), hover (`ink-3` edge), focus (the ring), error (`aria-invalid="true"`: a 2 px `status-blocked` edge drawn inside, so nothing moves), read-only (`surface-2`, for a value that is shown but never edited, such as a PINTAR ID), disabled (with its reason as help text).

**Rules**
- Every field has a visible label. A placeholder is an example, never the label.
- Mark only the optional fields, «(opsional)»; required is the default.
- Help text says what to enter and why; the error says how to fix it («Masukkan email lengkap, misalnya nama@sekolah.sch.id.»).
- 16 px text, so phones do not zoom.
- Use `type`, `inputmode` and `autocomplete` so the right keyboard and autofill appear.

**In PINTAR today.** `.pin-input` (40 px), the sign-in's `.pin-inp` (52 px), Konfigurasi's Tailwind fields. Today's outlines are 1.6:1; v3's are 3:1.
