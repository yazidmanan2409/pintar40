Dates and times in PINTAR: Indonesian first, day before month, never the US order.

**Status: NEW (Dr Gladys, accepted 5 Oct).** One grammar for every date a person reads. `Pintar.tanggal(value, form, time)` in the bundle writes each form, and the product gets one helper like it in the application pass.

**Forms**
| Form | Pattern | Example | Use it for |
|---|---|---|---|
| Human-readable (the default) | d MMM yyyy | 9 Okt 2026 | Any date a person reads: lists, tables, history, results. |
| With the day | EEEE, d MMM yyyy | Jumat, 9 Okt 2026 | A date someone acts on: a deadline, an opening, a schedule; the line under a date field. |
| Date and time | EEEE, d MMM yyyy, HH.mm WIB | Jumat, 9 Okt 2026, 07.30 WIB | Anything with a time that someone acts on. |
| Timestamp | d MMM yyyy, HH.mm WIB | 9 Okt 2026, 07.30 WIB | A record of when something happened: «Diperbarui …», a line of history. |
| Compact numeric | dd/mm/yyyy | 09/10/2026 | Only where space is tight: a narrow table column of dates only, an export. |
| Formal | d MMMM yyyy | 9 Oktober 2026 | Emails and printed letters. The certificate keeps its own form (frozen). |

**Rules**
- **Day, month, year,** always in that order, in both languages. Never month first.
- **The month in words wherever a misreading would matter.** That covers deadlines, openings, confirmations, the line under a date field, and every sentence. «09/10/2026» reads two ways across the world; «9 Okt 2026» reads one.
- **Compact numeric only for density:** two-digit day and month and a four-digit year («09/10/2026»), in a column that holds only dates. Never «9/10/26», never in a sentence, and never alone where a misreading costs something.
- **The year is always written.** Records outlive a school year.
- **Months:** Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu, Sep, Okt, Nov, Des, with no full stop. **Days:** Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu.
- **Time is 24-hour with a full stop** («07.30», «23.59») and always WIB. Never AM or PM. Seconds appear only in a technical log.
- **Ranges:** «9–16 Okt 2026», «28 Sep – 4 Okt 2026», «Jumat, 9 Okt 2026, 07.30–09.00 WIB».
- **Relative words** («hari ini», «kemarin») may accompany a date, never replace it.
- **English** (the second language) keeps the same order with English names, as `en-ID` writes them: «Friday, 9 Oct 2026, 07.30 WIB».
- **A date field** is native, with the date in words under it (see Date and time).
