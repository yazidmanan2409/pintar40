# A2a change C · the promotion to staging: the hosted reads and the preservation pair

Sharon, 16 Nov 2026 (02:15 UTC). Read-only. This is on Bob's reads of staging `keijhmdtsgrfvnvocfvk`, made at 01:56–01:59 UTC, after PR #22 (`bbed52e4b1d61bb1c57bc6d4883933dee76630c4`) and staging.yml run 43789058922 (267 / `20270119270000`). Bob ran the reads, and I take them as reported.

## What holds now

- **Reads 1, 2 and 4 to 8 match the expected answers, and `pg_cron` 1.6.4 is present.**
- **Read 3 is pending.** The promotion passes when job 5 shows `succeeded` / `CALL` after the promotion. One more check is in N1 below.
- **The preservation pair: Bob's proposal is accepted,** with one condition (P2). It is the stronger statement:
  - change A's *after* (13 Nov, 23:47, watermark 10697, at 249) equals change C's *after* (16 Nov, 01:56, watermark 10697, at 267) on every preserved line, 20 to 62;
  - so nothing preserved changed **over the whole interval, which contains C's migrations**;
  - a separate *before* could only show less.

## P2 · the condition for the pair

- **The preservation query is the same text in both readings:** the same commit of the query, recorded beside both. Columns that C adds are left out by name:
  - `assessment_sessions`: `darurat_sejak`, `darurat_jendela_id`, `darurat_geser_detik`, `darurat_dikredit_sampai`, `darurat_keluar`;
  - `maintenance_windows`: `node_ids`, `t_stop`, `t_lift`.
- **Then name in the record which lines cover which tables.** If the query does not reach `assessment_sessions` or `maintenance_windows` at all, say so. Their unchanged state then rests on "0 open sittings" and no EMERGENCY window, which Bob read: read 8 = 0.

## N1 · confirm one routine

- Read 2 shows `pengerjaan_tutup_terjadwal` is a security-definer function owned by `postgres`. My N1 required it revoked from `service_role` (commit 28).
- **Confirm it is in read 4's ten, or read it separately:** `has_function_privilege` for `anon`, `authenticated` and `service_role`, all false.

## Process (register)

- The *before* reading must be taken **before the merge.** `staging.yml` applies the migrations on merge, within about 60 s.
- For the next promotion: the *before* is read, the PR is merged, the *after* is read.
- Could reasonably have been anticipated: yes (Q4, before and after). It is the step that was missed; nothing was lost, because the interval reading covers it.

## The eight reads

1. **One job, 5,** `postgres`, `call public.pengerjaan_tutup_berkala()`, active. The procedure runs the marking and the release itself. **Matches.**
2. **The three procedures:** prokind p, owner `postgres`, not definer. **Matches.**
3. **Pending.** Expected: `succeeded`, return message `CALL`, after 01:5x.
4. **Ten routines false** for `anon`, `authenticated` and `service_role`. **Matches**, with N1 above.
5. **`lock_timeout=2s` and `1500ms`**, each with `search_path=public, pg_temp`. **Matches.**
6. **All ten triggers mode O.** **Matches.**
7. **No superuser;** `service_role` cannot set `session_replication_role`. **Matches.**
8. **No open EMERGENCY window without `t_stop`: 0.** **Matches.**

## Addendum (02:30 UTC): THE PROMOTION PASSES

- **Read 3:** job 5 `succeeded` / `CALL` at 02:00:00 and 02:05:00 UTC, after the promotion.
- **N1:** `pengerjaan_tutup_terjadwal` is false for `anon`, `authenticated` and `service_role`.
- **Preservation, re-read properly** (`claude/bob-41-master-plan` at `8649099179ac7d5d7c3a29f2027e03235cd4d2e6`, `docs/completion-4.1/batches/a2a-evidence/PRESERVATION-C.md`):
  - the same query text from `main`, with A's cutoff and watermark, and C's five `darurat_*` columns left out by name;
  - against A's *after*, every preserved line from 20 to 62, and lines 70 to 72, is identical. The only expected difference is line 10, migrations 249 → 267;
  - **line 58 (sittings) is equal only with the exclusion.** That is the correct reason: C's new columns carry their defaults.
  - P2 is met.
- **Bob's correction is right.** The earlier "every line equal" was a self-match. The committed comparison is the record. My acceptance of the interval reading stands on the corrected numbers.
- **`maintenance_windows` is not covered by any preserved line.** It rests on 0 open sittings and read 8 = 0, and C changed none of its existing rows (R2's backfill touched 0). **Accepted for C.**
  - **Required before A2b's promotion,** because A2b rewrites how windows are written: the preservation query gains a line for `maintenance_windows`, its columns as of before A2b, with A2a's three left out by name.
