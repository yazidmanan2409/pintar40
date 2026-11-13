# Part 2 · verification of rows 1, 3 and 4 · against `PART2-EVIDENCE.md` at `639e6f569190b958d3ec61f4896abdf8bfd3d671`

Sharon, 13 Nov 2026 (08:40 UTC). Read-only. I read the record, and **the whole log of restore run `43389671254`**
(job `131766344720`) for row 1's table line.

| Row | Verdict | What is missing |
|---|---|---|
| **4 · committing procedure** | **VERIFIED** | Nothing. One run, `succeeded`, message `CALL`. Three rows in three consecutive transactions (`77402`, `77403`, `77404`), in order, which is a procedure committing between batches under hosted `pg_cron`. Unscheduled and dropped: `0 0 0 0`. The two real jobs are unchanged. The leftover run-details row is the record, which is right |
| **1 · restore** | **NOT VERIFIED: one read missing** | My five conditions are met (below). **One line is open:** "functions: definitions differing 1", `content_canonical_payload`, described as comments only. The record does not show this. That function computes the release content hash (INV-04 and INV-05), so a body difference beyond comments would be material. **Needed:** the two definitions compared with comments and whitespace stripped and shown equal. For example, the md5 of `regexp_replace(pg_get_functiondef(...), '--[^\n]*', '', 'g')` with whitespace collapsed, on staging and on a local stack at 244 from the repository. Equal means row 1 is verified; different is a material finding |
| **3 · `auth` runtime writes** | **NOT VERIFIED: one read missing** | Row security enabled with no policy and not forced is a **deny-all for any role that neither owns the table nor holds BYPASSRLS.** The definers run as `postgres`, and the `auth` tables are owned by Supabase's Auth role, not `postgres`. If `postgres` lacked BYPASSRLS, `hapus_data_pribadi`'s updates and deletes would **silently touch 0 rows**, with no error. That is exactly what item 4 must rule out. **Needed:** `select rolname, rolbypassrls, rolsuper from pg_roles where rolname = 'postgres'`, and each of the six tables' owner (`relowner::regrole`). **`rolbypassrls` true means verified.** False is a material finding for item 4, and for `akun_kunci`'s write to `auth.users` too |

## Row 1, what is verified

**The table line ("4 differ, 6 missing, 2 only in the copy")** is the difference between Supabase's own schemas on the
runner's local stack and on the hosted project. None is a PINTAR table:
- **4 differ:**
  - `auth.one_time_tokens` (1 against 0: a transient token);
  - `auth.schema_migrations` (82 against 77) and `storage.migrations` (80 against 68): the image versions differ;
  - `storage.buckets` (1 against 0): **re-applied by the recorded step, equal afterwards**.
- **6 missing:** `auth.mfa_*`, `auth.scim_*` and `storage` lifecycle tables, each holding **0 rows** on staging.
- **2 only in the copy:** `storage.iceberg_*`.
- **Not material.** Recorded as part of the known limit.

**"public function grants (md5) CHANGED" after the second step** (log line 1760): the detailed comparison beside it
reads execute rights differing 0, owners 0, missing 0, client rights equal, and launch readiness 24 of 24. So the
digest's difference is in roles outside the client roles. Not material.

**My five conditions are met:**
1. Run on `main` at `40ca971f`, after the promotion.
2. The named facts are all `same` after the installer:
   - L1-F4's guards;
   - the link lock;
   - the five `auth.users` triggers;
   - the public triggers;
   - the jobs;
   - the accountability tables present.
3. The installer twice, each job exactly once both times; the health read on the copy clean.
4. The rewrite timed: 28 ms, plus 1 ms and 1 ms, on 10,426 `audit_log` rows.
5. The known limit stated. It is broader than I expected, and is correctly recorded: the logical restore brings back
   neither the `auth.users` triggers, nor the client rights, the bucket or the jobs. Each is re-applied by a recorded
   step.

## Anticipation

- Row 3's gap was anticipable (Q5: who runs it, with what access). My ruling's wording, "no RLS", was imprecise. What
  matters is whether the definers' owner bypasses it.
- Row 1's gap is a missing piece of evidence, not a defect.
