Several choices from a list, or one statement to confirm. The whole row is the target.

**Status: CHANGED.** Native checkboxes, drawn in tokens, with whole-row targets.

**Markup.** `label.pds-choice` > `input.pds-check` + `span` (the label) + optional `small` (one line of explanation). Group them in `fieldset.pds-fieldset` with a `legend`.

**States.** Unchecked, checked, indeterminate («Semua kelas» when some are chosen), disabled (its reason in the `small` line), error (the box's edge and the group's message).

**Rules**
- A checkbox is chosen now and applied by a button. A setting that takes effect at once is a switch.
- Each row is at least 44 px tall; the box is 20 px.
- A row a person can never choose is left out; a row unavailable for a reason stays, disabled, with the reason.

**In PINTAR today.** Native checkboxes on Konfigurasi and the intake, styled by Tailwind.
