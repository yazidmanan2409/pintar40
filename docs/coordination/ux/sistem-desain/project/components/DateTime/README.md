Native date and time inputs, always in Jakarta time and saying so.

**Status: CHANGED,** restyled; Jakarta time as DAISY-14 rules.

**Markup.** `input.pds-input[type=date]`, and `span.pds-unit` > `input[type=time]` + «WIB». Group a date and time in a `fieldset` with a `legend`.

**Rules**
- Every time is WIB, and the interface says so (DAISY-14); a learner sees the same time whatever their device's clock says.
- Display dates in words: «Jumat, 9 Okt 2026, 07.30 WIB». The input's own format is the browser's.
- Never a custom calendar widget when the native one does the job.
