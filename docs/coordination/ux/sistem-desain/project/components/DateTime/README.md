Native date and time fields, each followed by the chosen date in words, so the date is never ambiguous on any computer.

**Status: CHANGED (Dr Gladys, accepted 5 Oct).** The fields stay native and restyled, on Jakarta time as DAISY-14 rules. New: the line under the field (the echo), which says the chosen date in words.

**Why the echo.** PINTAR cannot set how a native date field shows its value: the browser and the computer's language decide. On a computer set to English (US), 9 October shows as «10/09/2026», which an Indonesian reader takes for 10 September, and the time as «07:30 AM». We tested the page's language, the browser's language and locale settings, and the language flag in our test browser; none of them changed it. So the field stays native (keyboard, screen readers and phone pickers all work), and PINTAR says the date itself, right under it.

**Markup**
- `input.pds-input[type=date]` (its focus ring is drawn on `:focus-within`, so the browser's calendar button, the field's last Tab stop, is ringed too: 4.0 correction, B1); for a time, `span.pds-unit` > `input[type=time]` + «WIB». Group a date and a time in a `fieldset` with a `legend`.
- Under the fields: `p.pds-gema[aria-live=polite]` holding `span[data-gema-tanggal="#field"]` (and `data-gema-jam="#field"`).
- Each field's `aria-describedby` names the echo first, so a screen reader hears the date in words.

**Rules**
- **Always the native field;** never a custom calendar, and never a text field that asks for «dd/mm/yyyy».
- **Always the echo, in words with the day:** «Jumat, 9 Okt 2026», or «Jumat, 9 Okt 2026, 07.30 WIB» when there is a time. When empty: «Belum ada tanggal.»
- **The echo is built from the field's value** (yyyy-mm-dd, the same in every browser), never read back from what the field displays. It is always right.
- **Every time is WIB,** and the field says so. A learner sees the same time whatever their device's clock says.
- **The confirmation and the result line repeat the date in words** («Mulai Senin, 12 Okt 2026 · Sampai Selasa, 20 Okt 2026»).
- **A far date** (a birth date, if PINTAR ever asks for one) uses three fields instead (day, the month by name, year), because a calendar is slow to reach it.

**In PINTAR today.** Siapkan's «mulai» and «sampai» and Konfigurasi's «valid_until» are native date fields with no echo. On an English-language computer they show «10/09/2026» for 9 October.
