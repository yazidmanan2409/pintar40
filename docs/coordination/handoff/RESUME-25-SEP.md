# Resume point: paused 25 Sep 2026, ~01:45 UTC (Yazid)

Everyone is paused. Nothing is half-merged: `main` is still `cb44589`.

## Coordinator: Integration 9 (in flight when paused)

- Gate branch `gate/integration-9` at `1e46714` = main `cb44589` + DAISY-14 (`3b822f7`, M10) + BOB-07/BOB-16 (`ed89063`). Manifest v83, no migrations, so staging needs no dispatch.
- Evidence dispatched before the pause: CI #196 (run 36082839165) and audit #24 (run 36082841398, `audit-journeys.yml` with `ref=gate/integration-9`). Read their results. Do not re-run them (D-043).
- If both are green (the audit's only expected FAIL is S8, BOB-10; S18 should now PASS):
  1. Fast-forward `main` to `1e46714`.
  2. Run `python3 docs/coordination/handoff/board_int9.py docs/coordination/BOARD.md '#196 <jobs>' '#24 <counts>' 1e46714`, then update the date and time in the PAUSED line.
  3. Checklist v2.1 (`docs/coordination/checklist/checklist_data.py`):
     - set NOW to `1e46714` with the label "Integration 9";
     - re-mark EDU-06, STU-05, X-06 and ADM-13 from S18/S19, and U-LOC from BOB-07;
     - FINDINGS: M10 FIXED (S18); M7 is server side FIXED, with release blockers left for BOB-17 and DAISY-16; GS-1 is the reader FIXED (BOB-16), with the template left for DAISY-15;
     - take DAISY-14, BOB-07 and BOB-16 out of VERDICT_NOW and add BOB-17 and DAISY-16;
     - re-render the MD and docx, then `git checkout -- '*.pyc'`.
  4. Commit `[skip ci]`, push `main`, merge `main` into this lane, and delete this note and `board_int9.py`.
- If either run is red, diagnose it from the logs before any re-run, and report to Yazid instead of merging.

## Bob (paused after BOB-07/16, CI #195 26/26 on `ed89063`)

Merge main, then work in this order:
1. BOB-08 (it includes Daisy's note on `lingkupPimpinan`, revoked and expired grants), BOB-09, BOB-10, BOB-11.
2. BOB-17 with DAISY-16. Release blockers return codes (one migration), and the four unused release form actions are deleted.
3. BOB-12 with DAISY-13.
4. BOB-15 with DAISY-12, before 1 Nov.
5. BOB-13, before L2 (1 Dec).

## Daisy (paused; lane `a1c0d97` pushed, no CI)

1. Merge main.
2. Run one CI for DAISY-07 and DAISY-15 on the new head.
3. Send both hand-offs, with HEAD, the manifest version (v86) and the CI line updated. The wording review of BOB-07's 26 new copy keys can ride that push.

## Yazid

- REL-08 and REL-09.
- After DAISY-15 merges, one Google Sheets round trip on the new template: type 78.145 and 007 into "Teks pilihan", download the workbook, and upload it here.

## Still deferred

- The hosted Auth idle backstop at 168h on staging (read the units first); production at release.
- Extending the audit to answer the pre-test and post-test.
- Decisions A and C, token revocations, the remaining secret renames, GitHub Environments isolation, the `VERCEL_TOKEN` split.
- The staging reset script (C-07).
- A teacher's review of the Bab 1 transcripts and infographic.
