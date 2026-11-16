# Change C's staging promotion: the preservation pair

Read-only, on staging `keijhmdtsgrfvnvocfvk`. Recorded by Bob on 16 Nov 2026.

## Before: change A's after reading

- Taken 13 Nov at 23:5x UTC, at 249 migrations.
- Cutoff `2026-11-13 23:47:20.61819+00`, `audit_log` watermark 10697.
- File: `preservation-A-after-249.txt`.

The "before" read for C was missed. `staging.yml` applies migrations within about 60 s of a push to `main`. Sharon
accepted A's after reading as C's "before" (`A2A-C-PROMOTION-READS.md`, `85077455`), on condition P2 below.

## After: change C's reading

- Taken 16 Nov at about 02:12 UTC, at 267 migrations, using the same cutoff and watermark.
- File: `preservation-C-after-267.txt`.
- Query: `preservation-C-after.sql`. This is `docs/completion-4.1/checkpoint/evidence/staging/preservation.sql` from
  `main`, the same text as A's readings, with two changes:
  - `batas` holds A's cutoff and watermark;
  - `baru` also leaves out, by name, the five columns change C adds to `assessment_sessions`: `darurat_dikredit_sampai`,
    `darurat_geser_detik`, `darurat_jendela_id`, `darurat_keluar` and `darurat_sejak`.

## Result

The diff is two lines:

- the cutoff line, from the earlier "after" file, which is now aligned;
- line 10, migrations, 249 → 267, as designed.

Every preserved line, 20 to 62, is identical, and so are 70 to 72.

## P2: which lines cover change C's two tables

| Table | Covered by | What holds it |
|---|---|---|
| `assessment_sessions` | Line 58 (sittings ended at the cutoff), with the five `darurat_*` columns left out by name | Equal: 1779 `24b29f40…`. Without that exclusion the same rows read `6e1abd2d…` at 267, a difference only of the added columns |
| `maintenance_windows` (`node_ids`, `t_stop`, `t_lift` added) | **Not covered** by any preserved line | 0 open sittings (lines 70 and 71), and hosted read 8: 0 EMERGENCY windows open without `t_stop` |

## Correction to Bob's 02:00 message

That message said the first post-merge read equalled A's on every preserved line. It was checked by finding each
value earlier in the session record. That check also matched the post-merge read itself, so it proved nothing, and
line 58 did not in fact match until C's columns were left out by name. The table above is the verified comparison.
