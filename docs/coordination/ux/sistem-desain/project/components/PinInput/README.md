A PIN: one masked field of four digits, with a way to see what was typed.

**Status: KEPT, restyled** (the sign-in PIN, DAISY-20's PIN step, DAISY-22's recovery and the class card). One input; the class card keeps its 60 px.

**Markup.** `span.pds-pin[data-pin]` > `input.pds-input[type=password][inputmode=numeric][maxlength=4]` + a reveal button (`data-pin-lihat`, `aria-pressed`, «Tampilkan PIN»). Use `autocomplete="new-password"` to set a PIN and `current-password` to enter one.

**Rules**
- One input, not four boxes: paste, password managers and screen readers work, and a learner can correct one digit.
- Digits only; anything else is dropped as it is typed.
- Help says what is not allowed in plain words («Bukan tanggal lahir, dan bukan angka berurutan seperti 1234.»), from IDENTITY-4.0 §3.
- A wrong PIN says how many tries remain before the consequence («Sisa 2 kali percobaan sebelum sesi ini berakhir.»).
- Large (`pds-input-lg`, 52 px) for a person's own PIN; the class card keeps 60 px (`pds-input-xl`), with «Lupa PIN? Tanyakan kepada guru.»; never smaller than 44 px.
