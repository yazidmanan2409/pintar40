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

---

## Addendum: B2J was vacuous on main; my judgement on earlier verdicts (2026-11-26 ~04:25Z)

- **The facts** (Second Eye, via Bob):
  - B2J is red on main 0c155a5c too, so CI-1b's CSS is not the cause;
  - its PDF check passed whenever `pdftotext` was absent (`journey.mjs:3465`, `teksPdf === "(pdftotext unavailable)" || …`), and the runner had no `pdftotext` until CI-1b's poppler line;
  - the red comes from the harness: `page.pdf` fires `beforeprint`, which AksiLaporan reads as a browser print («tanpa nomor referensi»).
- **My judgement on what I passed: no verdict of mine rested on B2J.**
  - My CI-1, CI-2, D2-R and Z verdicts were each conditioned on their own named tests and plants, plus the runs' conclusions. None used the printed report's reference footer as evidence.
  - The «green» runs I quoted (e.g. CI-2 journeys 45509965430) did contain this one vacuous check. Their conclusion overstated coverage of **that check only**.
  - The footer is an accountability mark on printed reports, not an access control. No access, disclosure or data-integrity verdict depended on it.
- **Bob's journey-only fix conditions are right.** The fourth is the one that matters to me: proof that a real official «Cetak laporan» print keeps the reference through `beforeprint`. If it doesn't, it is a **product defect**, an audit-trail gap on official prints, and it comes back to me for classification.
- **One addition for the fail-closed sweep:** besides «unavailable» fallbacks, list every check whose pass branch is reachable when its evidence tool or file is missing. That covers `catch → pass`, empty-text matches and absent-file guards. Each one must fail, or be reported as **not run**, never as pass. (The swallowed waits, about 65 `.catch(() => {})` calls, are timing only, provided an assertion follows; the one I sampled, at line 4533, has one.)
- **My scoping check (2) still applies** to CI-1b's global print rules.

Could reasonably have been anticipated: yes, by any reviewer of earlier journey evidence, me included. A check that passes when its tool is missing is the vacuous-evidence pattern. I should add "is the evidence tool present?" to my run-evidence reading.

---

## Addendum: checks (2) and (3) answered by the print sweep (2026-11-26 ~04:30Z)

- **(3), MET in substance.** Second Eye's local sweep, as Bob reports it: every print surface for the learner, teacher, head and dean, and admin, plus the b6-cetak P1–P6 set, compared between main 0c155a5c and e8a35c3a on fresh seeded resets with the clock pinned.
  - Page counts are equal, with no layout or print-rule difference.
  - 11 PDFs are identical byte for byte; the rest differ only in data (the clock minute, per-reset IDs and PINs, row order where validity is equal, the tour).
  - **The sweep's outputs (its list and its compare results) go into the re-freeze evidence,** so the claim is checkable.
- **(2), MET, with no further scoping needed.**
  - I confirmed with `git grep` on claude/ci-1b that `PemberitahuanCetak`, `BarisDitinjauCetak`, `.pin-cetak-saja` and `.pin-cetak-pemberitahuan` are rendered only by `src/app/belajar/[tugas]/sertifikat/page.tsx`, via `CetakKeadaan.tsx`. The CSS is in `experience.css` and the words in `hle.ts`.
  - The `:has()` rules and `@page cetak-keadaan` apply only where the notice renders.
  - **One cheap guard instead of re-scoping:** a static check that these components and classes are rendered only by the certificate page. Then a future page that reuses them knowingly takes on the hiding rules. Non-blocking: build it with the re-freeze if convenient, otherwise ledger it.
- **(1), noted:** S21j is fixed at e7bbd547 with two people and the constraint untouched, per Bob. I verify it in the re-freeze delta.
