# Dates and times

**PINTAR is Indonesia-first: a date a person reads never follows the US order** (Dr Gladys, accepted 5 Oct). Not applied to PINTAR until approved.

## The grammar

| Form | Pattern | Example | Use it for |
|---|---|---|---|
| Human-readable (the default) | d MMM yyyy | 9 Okt 2026 | Any date a person reads: lists, tables, history, results. |
| With the day | EEEE, d MMM yyyy | Jumat, 9 Okt 2026 | A date someone acts on: a deadline, an opening, a schedule; the line under a date field. |
| Date and time | EEEE, d MMM yyyy, HH.mm WIB | Jumat, 9 Okt 2026, 07.30 WIB | Anything with a time that someone acts on. |
| Timestamp | d MMM yyyy, HH.mm WIB | 9 Okt 2026, 07.30 WIB | A record of when something happened: «Diperbarui …», a line of history. |
| Compact numeric | dd/mm/yyyy | 09/10/2026 | Only where space is tight: a narrow table column of dates only, an export. |
| Formal | d MMMM yyyy | 9 Oktober 2026 | Emails and printed letters. The certificate keeps its own form (frozen). |

- **Day, month, year,** in both languages. Never month first.
- **The month in words wherever a misreading would matter:** deadlines, openings, confirmations, the line under a date field, every sentence. «09/10/2026» reads two ways across the world; «9 Okt 2026» reads one.
- **Compact numeric only for density:** two-digit day and month and a four-digit year, in a column holding only dates. Never «9/10/26», never in a sentence, never alone where a misreading costs something.
- **The year is always written.** Records outlive a school year.
- **Months:** Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu, Sep, Okt, Nov, Des (no full stop). **Days:** Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu. These are the forms `Intl` writes for `id-ID`.
- **Time:** 24-hour with a full stop («07.30», «23.59»), always WIB, never AM or PM. Seconds only in a technical log.
- **Ranges:** «9–16 Okt 2026», «28 Sep – 4 Okt 2026», «Jumat, 9 Okt 2026, 07.30–09.00 WIB».
- **Relative words** («hari ini», «kemarin») may accompany a date, never replace it.
- **English** keeps the same order with English names, as `en-ID` writes them: «Friday, 9 Oct 2026, 07.30 WIB».
- **One helper.** The bundle's `Pintar.tanggal(value, form, time)` writes every form from the value. In the application pass the product gets one helper like it in the copy table's `format`; no surface formats a date on its own.

## Native date fields

**Finding.** A page cannot set how a native `<input type="date">` or `type="time"` shows its value: the browser and the computer's language decide. We tested in Chromium (the review browser) with:

- the page's `lang="id"`;
- the browser locale set to `id-ID`, through the locale and `Accept-Language`;
- the language flag `--lang=id-ID`.

None of them changed it. The field showed 9 October as «10/09/2026», the time as «07:30 AM», and an empty field as «mm/dd/yyyy». On a computer whose language is English (US), common in Indonesian schools and offices, a teacher sees the same thing. «10/09/2026» is a valid Indonesian date, 10 September, so the misreading is silent.

**What we rejected:**
- **Forcing the format** with a text field and a «dd/mm/yyyy» mask: typing errors, no phone picker, and a value that has to be parsed.
- **A custom calendar widget:** an accessibility cost, and the existing rule is native first.

**The pattern (approved, question 15, 5 Oct).** Keep the native field (keyboard, screen readers and phone pickers all work), and follow it with **the echo**. The echo is one line, in words and with the day: «Jumat, 9 Okt 2026, 07.30 WIB».

- It is built from the field's value (yyyy-mm-dd, the same in every browser), so it is right whatever the field shows.
- It is announced politely as it changes (`aria-live`), and the field's `aria-describedby` points at it.
- When the field is empty, it says «Belum ada tanggal.»
- The confirmation and the result line repeat the date in words.

See Date and time. A far date (a birth date, if PINTAR ever asks for one) uses three fields instead: day, the month by name, and year.

## Specimen audit (5 Oct)

Every specimen and doc in this system was searched for dates.

| Where | Found | Now |
|---|---|---|
| Date and time card | The native fields render «10/09/2026», «07:30 AM» and «mm/dd/yyyy» in an English-language browser (the review browser included). **The only US-order date a reader actually saw.** | The echo line under each field. The illustration shows what each kind of computer displays. |
| Table card | 23 dates without a year («3 Okt», «28 Sep») | «3 Okt 2026», written by `Pintar.tanggal` |
| Table guideline | «a date is short («3 Okt»)» | «3 Okt 2026», or «03/10/2026» in a narrow column of dates only |
| Badge card | «Selesai 2 Okt» | «Selesai 2 Okt 2026» |
| App shell card | «diterbitkan 2 Okt · batas 9 Okt» | «diterbitkan 2 Okt 2026 · batas 9 Okt 2026» |
| Alert card | «Sabtu, 10 Okt, 21.00–22.00 WIB» | «Sabtu, 10 Okt 2026, 21.00–22.00 WIB» |
| Token note (`pintar-primary`) | «Approved 16 Sep» | «Approved 16 Sep 2026» |
| Intent board | «10/9/26 7:30» | Kept on purpose: it is the counter-example in the «Never» column. |

No `mm/dd/yyyy` was written anywhere in the specimens; every other date already followed the grammar.

## In the product today (for the application pass, nothing changed)

- **No date is formatted in the US order.** Every display call uses `id-ID`, or `en-GB`/`en-ID` in English. (`en-US` and `en-CA` appear in `src/lib/hle.ts`, but only to compute an offset and a yyyy-mm-dd value, never for display.)
- **The forms vary,** and two rules break:
  - Studio and Konfigurasi write «9 Okt 2026, 07.30», with no WIB.
  - Keamanan (the security log and PIN recovery) writes «9 Okt, 07.30», with no year and no WIB.
  - Email uji writes «9 Okt, 07.30.00 WIB», with no year.
  - Emails write «9 Oktober 2026 pukul 07.30 WIB», the formal form, which is fine.
- **Three native date fields have no echo:** Siapkan's «mulai» and «sampai», and Konfigurasi's «valid_until». On an English-language computer they show «10/09/2026» for 9 October.
