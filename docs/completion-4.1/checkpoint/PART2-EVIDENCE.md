# Checkpoint Part 2 · recorded evidence (for Sharon's verification)

Bob, 13 Nov 2026. Against `PART2-EVIDENCE-RULING.md` (Sharon, `b658ec06`). Staging project `keijhmdtsgrfvnvocfvk` only.
Times are UTC, read from the database or the run. Rows 2 and 6 are still open.

## Row 1 · restore — run [43389671254](https://github.com/yazidmanan2409/pintar40/actions/runs/43389671254), `main` at `40ca971f`, success

Lines as printed (job 131766344720):

```
restore exit 3 (history 0); backup 302 s, documented restore 1 s
NOT in any database backup: Storage files (metadata only), CERT_SECRET_KEY_V1 and CARD_PEPPER (Vercel), Auth settings and SMTP (the Supabase project), API keys
launch readiness on staging: 24 PASS, 0 FAIL
launch readiness on the restored copy: 17 PASS, 7 FAIL
trigger definitions read from staging: 5
recreated on the copy: exit 0
launch readiness on the copy after the corrected step: 18 PASS, 6 FAIL
on the copy after: 2263 rights; staging's lacking there 0; the copy's beyond staging's 0
buckets re-applied on the copy: exit 0; on the copy after: assets (private)
the copy's client rights and buckets equal staging's afterwards: yes
tables: 177 on staging, 167 restored identically, 4 differ, 6 missing, 2 only in the copy; 0 moved on staging during the backup
functions: 747 on staging; definitions differing 1, owners differing 0, execute rights differing 0, missing 0
table rights (anon, authenticated): 156 on staging; differing 0, missing 0
launch readiness on the copy after the second corrected step: 24 PASS, 0 FAIL (psql exit 0)
did the restore bring the jobs back: none
installer run 1: answered ok=true; 2 of 2 declared job(s) present exactly once
installer run 2: answered ok=true; 2 of 2 declared job(s) present exactly once
the health read's job findings on the copy: hilang [] berbeda [] tidak_dideklarasikan [] pg_cron true
same     L1-F4 guards (count, definitions md5): 32 e08eab70869d2f27019c62d44a07601e
same     accounts link lock (L1-F2): 11db10649d6009f6876bfe724e8aa15a
same     auth.users triggers (definitions md5): 5 c72efdfe64954caf38c5ca55bd7786a6
same     auth.users triggers: on_auth_user_created,pintar_card_email_guard,pintar_email_correction_guard,pintar_kunci_tetap_jaga,pintar_password_write_guard
same     public triggers (md5): 208 f16fd0a3044a2519c9fe2ac1de56ddca
same     scheduled jobs (pintar-*): pintar-akuntabilitas-buang-lama 17 19 * * * select public.akuntabilitas_buang_lama() postgres true ; pintar-pengerjaan-tutup-terjadwal */5 * * * * select public.pengerjaan_tutup_terjadwal() postgres true
the accountability tables (rows, content) on the copy: public.accountability_events|0 public.accountability_store|1 public.accountability_write_failures|0
audit_log: 10426 row(s); migration 215's rewrite on the copy: column 28 ms, audit_log_run_idx 1 ms, audit_log_run_parent_uq 1 ms (then rolled back)
```

**Known limit, as the run shows it:** the documented logical restore does not by itself bring back the five triggers on
`auth.users` (0 of 4 checked present before the corrected step), PINTAR's client rights, the private bucket, or the
scheduled jobs ("none"). Each is re-applied by a recorded step, after which the copy equals staging on the named facts
and passes 24 of 24. One function definition differs by comments only (`content_canonical_payload`). Storage files and
the secrets held outside the database are not in any database backup. I have not judged the "4 differ, 6 missing, 2 only
in the copy" table line against your five conditions; that is yours.

## Row 2 (part) · the app serves the promoted build — run [43389700266](https://github.com/yazidmanan2409/pintar40/actions/runs/43389700266), success

```
main: `40ca971ff0d7`, 244 migrations
| staging | dpl_3mtremCdgB4v8hgByuxxP6u6zahr (READY) | `40ca971ff0d7` | 244 | 244 | GREEN |
```

The sign-in walk itself (audit rows' `build_sha`, network origin, Auth with the five triggers) comes with row 6's run.

## Row 3 · no other trigger and no row-level-security policy — read 08:06:14

| auth table | row security enabled | forced | user triggers | policies |
|---|---|---|---|---|
| audit_log_entries | true | false | 0 | 0 |
| identities | true | false | 0 | 0 |
| one_time_tokens | true | false | 0 | 0 |
| refresh_tokens | true | false | 0 | 0 |
| sessions | true | false | 0 | 0 |
| users | true | false | 5 | 0 |

Note for your judgment: `relrowsecurity` reads **true** on all six with zero policies and not forced. That is Supabase's
default on the `auth` schema; it does not bind the table owner or a role with BYPASSRLS. Your condition says "no
row-level security"; say whether enabled-with-no-policy-not-forced meets it, given the definers' owner.

## Row 4 · a scheduled job CALLing a procedure that commits between batches

- Before, 08:09:02: scratch schema 0, procedures 0, relations 0, probe jobs 0; jobs 2; migrations 244.
- 08:09:11: `create schema _probe_p2`; a three-column log table; `procedure _probe_p2.p()` (plpgsql: three times,
  insert `(i, txid_current())` then `commit`); `cron.schedule('_probe_p2_once', '12 8 13 11 *', 'CALL _probe_p2.p()')`
  → job 4. One run only (that minute of that day).
- `cron.job_run_details` for job 4: status `succeeded`, message `CALL`, 08:12:00.081 → 08:12:00.089.
- Rows: `1 / xid 77402 / 08:12:00.084434`, `2 / 77403 / 08:12:00.087227`, `3 / 77404 / 08:12:00.088384`: three
  transactions, in order.
- 08:13:05, after `cron.unschedule` and `drop schema … cascade`: **0 0 0 0**; jobs 2, the same two, both active;
  migrations 244. The run-details row for job 4 remains in `cron.job_run_details` as the record.

## Row 5 · advisory lock — by construction, pending A2a's page confirming the fence is taken only inside database functions reached through PostgREST or `pg_cron`.

## Rows 2 (walk) and 6 · open. One small dispatched run at one `sekolah-uji-` school, being built by Second Eye; you read its diff before it is frozen.
