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

## Sharon's two follow-up reads (her `PART2-VERIFY-ROWS-1-3-4.md`, `5b4c39d2`)

**Row 1 · `content_canonical_payload(uuid)`, staging against the repository at 244.** Read 08:20. Staging's `prosrc`:
7037 characters, md5 `80be3b44db8d40bb9090b652c1b7e22a`. The repository's last definition (only two migrations define
it; the later is `20260914120000_ad_hoc_assessments.sql` on `main` at `40ca971f`), body between the `$$` markers:
7037 characters, md5 `80be3b44db8d40bb9090b652c1b7e22a`. **Byte-identical, comments included**, so no stripping was
needed. The difference the rehearsal printed is the restored copy lacking comment lines, not staging differing from
the repository.

**Row 3 · who may write the six `auth` tables.** Read 08:20:36.
- `postgres`: `rolbypassrls` **true**, `rolsuper` false.
- Owner of each of `audit_log_entries`, `identities`, `one_time_tokens`, `refresh_tokens`, `sessions`, `users`:
  `supabase_auth_admin` (`rolbypassrls` false; it is the owner, and row security is not forced).
- `public.hapus_data_pribadi`: owner `postgres`, security definer.
So the deletion's `auth` writes run as a role holding BYPASSRLS; row security enabled with no policy does not silence them.

## Rows 2 and 6 · the hosted Auth probe — run [43404098183](https://github.com/yazidmanan2409/pintar40/actions/runs/43404098183), success, first attempt

**Candidate and gates.** Frozen `e172ba82` (two new files). Sharon's early read: no blocker (`efd535f9`). CI and journeys
A and B green on that SHA (runs 43394114720, 43394112452); local pre-flight green (`d278994b` on `claude/part2-probes`).
Merged as PR 20 → `main` `a6b47466d3f8242b2740f81c186a5cb0f341eac0`. `git diff --name-only 40ca971f a6b47466`: only
`.github/workflows/staging-auth-probe-41.yml` and `audit/staging/auth-probe-41.mjs`.

**Just before the run.** environment-facts run 43403789613, 09:44: `staging | dpl_5LLnRJqGytXAhRb1PPPAG9cmFhCS (READY) |
a6b47466d3f8 | 244 | 244 | GREEN`. Sharon's precondition, read 09:46:18: SA and PA both `account_setup.state` COMPLETE,
`person_pins.reset_required` false, not locked; open suspensions on staging 0.

**Fixture.** `sekolah-uji-b5-1104`, class «Kelas 5A». Dispatched from `main` 09:46:22.

**The run's lines, as printed:**

```
PASS      P0  SA, then PA in «Seluruh platform», sign in with their password (no recovery) :: both by the password
PASS      P1  the app serving staging is the dispatched commit :: the app's 2 audit row(s) carry build_sha a6b47466d3f8242b2740f81c186a5cb0f341eac0
PASS      P2  SA rosters L into «Kelas 5A» through /pendataan; L has no account :: L 7833c46f-a92a-474b-aa15-165278c8babc; account 0
PASS      P3  PA suspends L, who has no account :: suspended: yes; account 0
PASS      P4  SA gives L a class card through the app; the account is locked at its first read :: account 1; locked at the first read: yes (banned_until 2999-12-31 23:59:59+00)
PASS      P5  ONE sign-in with the card's right PIN while locked: refused with the ordinary mismatch :: refused: yes, 401 CARD_NOT_MATCHED; still locked: yes
PASS      P6  PA reinstates L; the account reads released :: released: yes (banned_until null)
PASS      P7  L signs in with the card (for the clean-up); the sign-in records carry a network origin :: signed in: yes; records: SIGN_IN_FAILED 20.65.227.0/24, SIGN_IN_OK 20.65.227.0/24
PASS      P8  the clean-up through the product: enrolment ended, deletion and closure requested, personal data deleted :: enrolment ENDED; CLOSE DONE, DELETE_PERSONAL_DATA RECEIVED; anonymised true, account 1, enrolment ENDED, open suspensions 1 (this run's: 0)
PASS      P9  the app's audit rows written since P0 still carry the dispatched commit :: the app's 7 audit row(s) carry build_sha a6b47466d3f8242b2740f81c186a5cb0f341eac0; written by a direct function call, with no build: account.suspended, account.reactivated, membership.closed, enrollment.ended, enrollment.ended_with_reason
ALL STEPS DONE: 10 PASS. L 7833c46f-a92a-474b-aa15-165278c8babc is anonymised, closed and terminal.
LEFT      L 7833c46f-a92a-474b-aa15-165278c8babc: anonymised true, account 1, enrolment ENDED, open suspensions 1 (this run's: 0)
no suspension of this run is left open
```

For your judgment: L ends with one open suspension that is not this run's (Second Eye: the account closure's own
terminal `CLOSED_AT_REQUEST` state on the anonymised person, the designed end state of a closed account). L's account
row remains, as closure leaves it. Say if either is not the end state you expect.

**Preservation pair** (`evidence/staging/preservation.sql`, unchanged text). Before: 09:45:54.883301+00, watermark 10680.
After: read 09:56:30 with those two values written into `batas`. **Every line is identical, 1 to 72** (`diff` of the two
outputs is empty). The preserved lines:

```
20|4
21|10
22|10
23|3
24|5
25|1
26|91 (6860)
27|bd41b3c9605519cffb916d0352b5148d
28|7deebf17f87ba3ee6bd192f776db01fb
29|25dc4819f4dc97e50eff2f351e8a3751
30|43f6cc69b6e8eee4854a46f88ebe0385
31|e428cb7fc08e301b0f96864bf0487ea4
32|f6e7a4fa62ff7ff83d3e9cd7f36b76c7
33|d41d8cd98f00b204e9800998ecf8427e
40|1579 4ff9a8e9c335eeb36501e8b532c8c76d
41|100 072a88136a241be4d483bbdbce1a1b72
42|100 75532463e4f5b282c1b05b24b7e1762b
43|1579 36f959dc32161dbb310e640dcf1cbd2f
44|1579 9808cca705d476aa656784566961f5c2
45|0
46|99 c9e0d5c267798cb2e4974e829ea63a75
47|0 d41d8cd98f00b204e9800998ecf8427e
48|0 d41d8cd98f00b204e9800998ecf8427e
49|1488 fe0fdb6c3202026eefa950d87dab84fd
50|27 40f65e668cb06bf743f3b7dc741e9d08
51|175 1c11a3cd3707a935d6b0e0b8f81534d1
52|68 3aa3502ddcf4072be04c9b879c37db3e
53|57 f74cdf425da54c86527c8593ec470d3d
54|1388 ff2ffb825aabfdfc4fdd330da477b460
55|5552 56370fd89dddf0543052c1b1ee4a4226
56|80 366c0b4108bf2460f994203ba6749b23
57|182 f046bf7fb4c6d740b54bf7bc3ea30cdd
58|1779 24b29f40d240ee5d937d85e48bb76f87
59|1779 27080cba6c490044c2e8ae7703b78d51
60|249 f9ab228f0c9ec5cba4ff5ba4fef26f64
61|66 550c32200cbbd51a54c9e6385f468165
62|10426 6606107df3f958fb62d628b450abf678
70|0 d41d8cd98f00b204e9800998ecf8427e
71|0
72|0 d41d8cd98f00b204e9800998ecf8427e
```
