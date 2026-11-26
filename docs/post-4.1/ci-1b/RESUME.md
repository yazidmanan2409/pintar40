# CI-1b (L-105) · resume note (Second Eye, 25 Nov 2026, 01:32Z)

Paused on the owner's instruction (via Bob, 01:31Z). **This branch is a REVIEW HEAD, not a frozen candidate.** No freeze,
no PR, no ci or journeys dispatched for CI-1b.

## Where it stopped
- `claude/ci-1b` on main `0c155a5c` (CI-2 merged, staging 311; main ci 45520797680 success per Bob):
  - `9df9b90d` red first;
  - `8126759c` the build (pushed earlier as the review head for Sharon's pre-review);
  - `6992a63f` red first for Sharon's P1/P2 (`CI-1B-PREREVIEW-8126759c.md` @63116255);
  - `6db4770d` the P1/P2 fix;
  - this note.
- Stopped cleanly: the full pre-flight on `6db4770d` was stopped after lint PASS and typecheck PASS, **before the suite
  ran**. Nothing else was running.

## Done
- **The build:**
  - print-only notice for DICABUT/DIGANTIKAN (no name, pass sentence, course, reason or new number; the QR and link);
  - the DITINJAU line in the sheet's top band (the sheet stays A4);
  - the card never prints;
  - «Cetak» re-reads (router.refresh), and the page re-reads on focus and visibilitychange;
  - the print date is re-written at «beforeprint»;
  - Daisy's nine keys. `isi_tanpa_tanggal` is confirmed verbatim by Daisy (@098539b2).
- **P1 (fail-open review read):** `tinjauanDariBacaan` takes three states, and anything not `false` prints the line. The CI1B-A01 plant (EXECUTE revoked from authenticated) went red on 8126759c and is green on 6db4770d.
- **P2 (line clipping):** no max-height or overflow rule. S21j asserts in print that the line is whole and above the header, in ID and EN, with a planted clip caught. Measured on local PDFs: line bottom 36 px, header 83 px, one page.
- **Local results on 6db4770d:**
  - CI1B-K01 and CI1B-A01, B6C-*, D168-SERAH-1, UX1-S0-TOKEN-01, C1W-A02 and D2R-C05: 11/11 green;
  - pre-flight lint and typecheck PASS.
- **Local results on 8126759c:** all 790 static tests PASS.
- **Rendered PDFs of all four states:** one page each, and they pass the journey's PDF check.
- **L-8 sweep:** 3 dependent tests restated (B6C-PRINT-01, B6C-DATA-01 and D168-SERAH-1); 1 dependent screen.
- **Not yet run on any head:** the full suite, plants and redcase.

## Next
1. Full pre-flight on the head: suite, plants and redcase. The machine's median uptime is about 8 min, so run it step by step.
2. Freeze; push once.
3. ci and journeys on the full sha; conclusions from the API only.
4. Diff accounting against `0c155a5c`. Name the workflow change for the owner: one guarded poppler-utils line in audit-journeys job B.
5. Daisy's word check, then Sharon's verification of the delta.

## For the freeze evidence
- Accepted residual (Sharon): a browser Ctrl+P skips the refresh; the live QR covers it.
- The journey fixture S21j writes a review and a replacement, and sets the certificate's language to EN for one print. All of it is past the guards, in the disposable world only, and restored; this was ruled OK by Bob.

## Open questions
None.
