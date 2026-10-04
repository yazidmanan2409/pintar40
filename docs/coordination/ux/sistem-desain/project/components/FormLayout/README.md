A long form that stays calm: groups with short headings, one column, validation on submit.

**Status: NEW as a documented pattern.** The error summary is new; validation on submit, «(opsional)» and nothing cleared are today's practice.

**Structure**
- A title (`t-section`) and one sentence saying what happens after saving.
- Groups (`pds-form-group`), each with a short heading (`t-subsection`) and a hairline between groups. No panel around each group.
- One column at `measure-read`; two short related fields may share a row (auto-fit at 220 px).
- The actions at the end, left-aligned: the primary, then «Batal».

**Validation**
- On submit, never per keystroke. Each invalid field shows its message; a form of more than three fields also shows the error summary at the top, which takes focus and links to each field (`data-validasi`, `data-ringkasan-galat`).
- A field clears its own error as soon as it is fixed.
- Nothing typed is ever cleared.

**Required and optional.** Say once, at the top, that everything is required except what says «(opsional)».
