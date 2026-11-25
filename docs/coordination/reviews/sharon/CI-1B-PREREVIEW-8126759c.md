# CI-1b pre-review, review head 8126759c (Sharon, read-only, 2026-11-25)

**Work:** claude/ci-1b 8126759c, on main 0c155a5c: 9df9b90d (red first) and 8126759c (the build). App, print stylesheet, tests and journeys only; there is no migration. I checked it against my L-105 record (`AUDIT79-L105.md`).

**Verdict: FIT TO FREEZE after two changes (P1, P2).** The design follows L-105.

## What holds (checked)
- **DICABUT and DIGANTIKAN print no credential.**
  - `LembarA4` renders only when `rendersVerification(status)`, and the on-screen card is always `pin-noprint`.
  - `PemberitahuanCetak` prints in place of the certificate: the heading, the statement, «Lembar ini bukan sertifikat.», the QR and the printed link, and the print date.
  - It carries no name, no pass sentence, no course, and never the replacement's number. The journey asserts that the new number is absent from the PDF.
- **The notice is never hidden in print.**
  - `.pin-cetak-saja` is `display:block !important` in print.
  - A notice page prints nothing else (the `:has()` rules).
  - CI1B-K01 catches a planted print rule hiding the notice or the line, and the journeys read the real PDF (pdftotext) for each state.
- **DITINJAU** prints the fixed line ahead of the sheet, with the print date (re-written at `beforeprint`). The QR stays, and no reason is printed. It is read from `sertifikat_saya_ditinjau`, CI-1's helper. **BERLAKU** prints as before, and the journey asserts no line and no notice.
- **The state at print time.** «Cetak» re-reads it (`router.refresh`) before `window.print()`, and `SegarkanKeadaan` re-reads it when the tab regains focus.
- **Daisy's notice over a full-page mark:** I accept it. L-105 allowed either, and a notice leaves no credential to crop out.

## Before the freeze
**P1. The review state fails open to a clean print.**
- **The problem:** `page.tsx:193–194` reads `sertifikat_saya_ditinjau(...).then(x => x.data, () => false)`. An RPC error or rejection prints a certificate under review as clean, with no line. The screen banner has the same default, but CI-1b now makes this a printed claim.
- **The fix:** an error, or a result other than `true` or `false`, is treated as **unknown**. Unknown prints the DITINJAU line, Daisy's words, or withholds the sheet. Never a clean sheet.
- **The test:** a plant that makes the read fail must still print the line, or no sheet.
- **Severity:** a condition of the freeze, not a new finding. It completes L-105's "the print carries the state".

**P2. The review line can be clipped without anyone noticing.**
- **The problem:** `.pin-cetak-ditinjau` has `max-height:16mm; overflow:hidden`. A longer line (EN, a long date, or a larger default font) would be cut on paper while pdftotext still finds the full text, so the journey would stay green.
- **The fix:** either drop `overflow:hidden`, or assert in print media, for ID and EN, that the line's `scrollHeight ≤ clientHeight`, i.e. it is wholly visible.

## Residual, accepted (non-blocking, recorded)
- **Ctrl+P skips the refresh.** A browser print (Ctrl+P) without «Cetak» prints the state as of the last load or focus. The QR, which resolves live, and «keadaannya saat ini» are the control for that gap. I don't require more.
- **The public check page** (`/verifikasi/...`) is outside CI-1b. It already states the live status.

## Gate
- Unchanged from L-105: before the first real certificate. **It is not a production blocker** for the current scope, since there is no certificate on production.
- After the freeze: required, ci and journeys green on the frozen head, from the API conclusion. Daisy verifies the words.

Could reasonably have been anticipated:
- P1: yes. The `() => false` default predates CI-1b, but the print turns it into a claim on paper.
- P2: partly. Text extraction doesn't prove visibility.
