# BOB-02 fixtures from real spreadsheet applications (D-030d)

Bob's sample workbook (`selftest/fixtures/bob02/contoh-pelajaran.xlsx`, written by openpyxl),
re-saved by Yazid in real applications, because no container here can produce one.

| File | Saved by | Checked by the coordinator |
|---|---|---|
| `contoh-excel.xlsx` | Microsoft Excel for Mac 16 (`docProps/app.xml`), 24 Sep | 5 sheets; all 159 cells' text identical to the openpyxl original; shared strings (Excel's own layout) |
| `contoh-gsheets.xlsx` | Google Sheets | pending: the first upload was byte-identical to the Excel file, so it was not a Google Sheets export |

Bob: copy these into `selftest/fixtures/bob02/` in your lane and make the reader and the
contract tests read each one to the same package as the original.
