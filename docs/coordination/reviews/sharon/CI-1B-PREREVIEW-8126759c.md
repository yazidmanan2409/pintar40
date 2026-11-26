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

---

## Addendum: delta verification at the freeze e8a35c3af0ee234fed9fa3d0a46a1db2d0e4c93f (Sharon, 2026-11-26 ~03:40Z)

**Head:** origin/claude/ci-1b = e8a35c3a. `git diff 0c155a5c e8a35c3a`: sha256 begins `12e08c7ed0cd37a7`, matching Bob's value; 18 files, +917/−18; no migration. I read the delta 8126759c..e8a35c3a myself.

**P1, MET.**
- `tinjauanDariBacaan` maps only `true` to YA and only `false` to TIDAK. An error, a rejection, null or a non-boolean are all TIDAK_TAHU. The page prints the review line for anything but TIDAK.
- The words say «Pindai kode QR untuk keadaannya saat ini» either way, so the line stays true.
- The unit cases cover an error, an error beside `false`, and a rejection.
- The journey's PLANT fails the read and catches «a clean certificate, with no review line». Red first: 6992a63f, red on 8126759c.

**P2, MET.**
- `max-height` and `overflow:hidden` are removed.
- S21j asserts in print media that the line is visible, with `scrollHeight ≤ clientHeight + 1` and `scrollWidth ≤ clientWidth + 1`, and that it ends above the sheet's header.
- A planted clip (`max-height: 4mm; overflow: hidden`) is caught.
- The English line, the longer one, is printed and checked.

**The workflow change** (audit-journeys.yml job B, named for the owner): a comment, `poppler-utils` installed only if `pdftotext` is missing, and a version print. It is an apt package from the runner's distribution, not a new project dependency. Acceptable.

**Non-blocking (to the ledger, ruling 93):**
1. On screen, TIDAK_TAHU shows no review banner. The screen keeps the earlier C1w behaviour, and only the print fails closed. The print was CI-1b's scope; the screen's handling of an unknown state is an AR-A item.
2. Bob's local first run, 1447/1 on DR-D02 (the backup drill, «fetch failed»), is in code this diff doesn't touch. It is logged as a test-reliability item, not «flake»: right.
3. The frozen head's own commit message reads «REVIEW HEAD, not a candidate» (the resume note's). The freeze is by Bob's declaration on this sha; I record it that way.

~~**Verdict: CI-1b delta PASS on the code.**~~ **Superseded below: the freeze is void.**
- **Required:** ci 45748677520 and journeys 45748680995 on e8a35c3a green, from the API conclusion. Both were status=in_progress when I read the API at ~03:40Z.
- **Plus** Daisy's word check.

I have not queried staging; this is a code read.

---

## Addendum: the freeze at e8a35c3a is VOID (2026-11-26 ~04:10Z)

- **journeys 45748680995 on e8a35c3a:** status=completed, **conclusion=failure**, attempt 1, updated 03:55:34Z. I read it from the API at ~04:10Z; Bob reports PASS 81 / FAIL 2.
  - **S21j:** the fixture's key correction violates `key_corrections_independent`. The database is right and the fixture is wrong.
  - **B2J:** the Ringkasan's PDF lacks the CTK reference. It is likely a CI-1b print-CSS side effect, which Second Eye is proving on main.
- **My PASS above holds only for the code I read.** It is not a verdict on e8a35c3a as a candidate, since the required runs failed.
- **For the re-freeze, I will check:**
  1. the S21j fixture fix, so the key correction is made by two independent people as the constraint requires, with no weakening of the constraint or the test;
  2. B2J's cause named, with red first. If CI-1b's global print rules (`.pin-cetak-saja`, the `body:has(...)` and `.pin-col:has(...)` hiding rules, the `@page` name) reach other pages, they must be scoped to the certificate page only;
  3. **a sweep of every other print surface** (the card sheet, the reports, Ringkasan, any `window.print()` page), with each one's journey PDF unchanged against main. This asks what else the print CSS changed.

  Then: required, ci and journeys on the new frozen head green, from the API conclusion.
