# 4.1 staging checkpoint · the promotion's preconditions and the six checks, exactly

## What governs this page

- **Authority:**
  - the owner's authorization of the staging checkpoint (12 Nov 2026), in `STAGING-CHECKPOINT-BEFORE-A2A.md` on
    `claude/bob-41-master-plan` (runbook §2 step 2 asks for this page);
  - **Sharon's reading of Addendum 1 §5b's six items, which governs this page:** `claude/gracious-lamport-0m1qjr` at
    `e682422328bce43df209d79fbd3d940a4c104d7a`:
    - `docs/coordination/reviews/sharon/CHECKPOINT-RUNBOOK-c51e6d47212dd335e9b09eed5eea9c98bcca6a9d.md`;
    - `docs/coordination/reviews/sharon/CHECKPOINT-ITEM5-152ecea939f780e7c5038f81229fac61879707ce.md`.
- **Pattern:** `docs/completion-4.0/batch-5/` (the promotion preconditions, the rollback file, the preservation query).
- **What it is not: an act.**
  - Nothing on this page has been run on staging.
  - Second Eye does not touch staging, open the pull request or merge.
- **How each step is marked:**
  - **before merge (read-only)** or **after merge**, as the owner's second instruction and Sharon require. Before the
    merge, only two steps run: the preservation query and the migration count.
  - **reads** or **acts**: whether it only reads staging, or acts on it.
  - Who runs it.
  - The exact statement or request.
  - The result that passes.
- **The stop rule:** a result that differs is a material discrepancy under the owner's rule (§6): stop, record it, hold.

## 1 · The promotion

- Staging is at **224** (`20270113160000`). The boundary commit carries **244**.
- `staging.yml` applies the 20 below on the owner's merge into `main`, checks that the count equals the repository's,
  and verifies sign-in live (runbook §1).

| # | Migration | Batch |
|---|---|---|
| 225 | `20270113170000_the_last_administrator_is_never_removed` | B0 |
| 226 | `20270114100000_a_sitting_is_managed_where_it_was_given` | A1 |
| 227 | `20270114110000_an_abandoned_sitting_is_closed_on_a_schedule` | A1 (installs `pg_cron`) |
| 228 | `20270115100000_a_question_is_written_in_the_app_and_revised_in_its_line` | C1w |
| 229 | `20270115110000_a_wrong_key_is_corrected_by_two_people_and_kept_on_the_record` | C1w |
| 230 | `20270116100000_a_sign_in_a_sign_out_and_a_print_are_kept_on_the_record_for_twelve_months` | B1 |
| 231 | `20270116110000_every_scheduled_job_is_declared_once_installed_by_one_installer_and_checked` | B1 |
| 232 | `20270116120000_a_school_reads_only_its_own_school_of_a_sign_in_record` | B1 |
| 233 | `20270116130000_a_locked_account_is_locked_until_a_date_auth_can_read` | L-1 |
| 234 | `20270117100000_every_view_of_a_corrected_answer_marks_it_by_the_key_in_force` | C1w F-1 |
| 235 | `20270117110000_a_locked_account_is_given_no_password_by_a_grant_or_an_activation` | L-1 |
| 236 | `20270117120000_a_corrected_answer_is_not_explained_by_the_sealed_key` | C1w F-1 |
| 237 | `20270117130000_an_anonymised_person_is_given_nothing_new` | L1-F4 |
| 238 | `20270117140000_a_key_correction_withdraws_the_explanations_it_makes_stale` | F1-R1b |
| 239 | `20270117150000_a_printed_report_is_owned_by_the_schools_whose_evidence_it_shows` | B2 |
| 240 | `20270117160000_a_suspension_covers_the_accounts_made_after_it` | L1-F2 |
| 241 | `20270117170000_a_closure_records_what_it_held` | L1-F4 |
| 242 | `20270117180000_the_teachers_marker_counts_the_answers_in_its_view` | F1-R1b |
| 243 | `20270117190000_the_person_row_is_locked_before_the_account_rows` | L1-F2 |
| 244 | `20270117200000_an_anonymised_person_is_never_reopened` | L1-F4 |

**The evidence beside this page:**

- **`ROLLBACK-225-244.sql`**: the way back to 224's schema without a restore.
  - Its header says what a rollback keeps and loses, and the one deliberate non-reversal, `banned_until` (named for
    Sharon's ruling).
  - It is tested in `evidence/rollback/ROLLBACK-225-244-local-test.txt`.
- **`evidence/staging/preservation.sql`**: read-only. It fingerprints only the rows that existed at the "before" read.
  The same text reads at 224 and at 244. It is tested across a real 224 → 244 promotion in the same test record.
- **The restore rehearsal's extension**: `.github/workflows/restore-rehearsal.yml` and `audit/restore/fakta.sql`, for
  item 5 (Sharon's conditions 2 to 4). It is a workflow change, within the boundary (runbook §3a, the Chief
  Architect's note on scope), and it is named in its own commit.

## 2 · Before the merge (read-only)

Exactly two steps, by the Chief Architect, in a read-only transaction (runbook §2 step 5). Nothing else runs on staging
before the merge.

| # | When · reads or acts | Step | Exact statement | Passes when |
|---|---|---|---|---|
| B1 | before merge (read-only) · reads | Preservation "before" | `evidence/staging/preservation.sql` as committed (both values in `batas` left `null`), in `begin transaction read only; … rollback;` | It completes. Record every line. **Keep lines 1 and 2** (the cutoff and the `audit_log` watermark): the "after" read is given them |
| B2 | before merge (read-only) · reads | The migration count | `select count(*), max(version), md5(string_agg(version, ',' order by version)) from supabase_migrations.schema_migrations;` | `224`, `20270113160000`, `d11e89838ecb656c4ca5b06b18941316` (the digest of the repository's first 224 versions; computed locally on a database at 224) |

## 3 · After the merge

In this order, after `staging.yml` has applied 244 and its own checks have passed (runbook steps 8 and 9).
- Every statement below is plain SQL on staging's database as `postgres` (the migration owner), or one HTTP request to
  staging's app or Auth, as stated.
- Unless stated otherwise, **the Chief Architect runs it.**
- The administrator acts are done by staging's **synthetic** administrators only:
  - **SA:** a synthetic school administrator holding `CAN_PROVISION_PEOPLE` in a synthetic school;
  - **PA:** the synthetic platform administrator.

Never a real person (D-064).

### A · The promotion itself

| # | When · reads or acts | Exact statement | Passes when |
|---|---|---|---|
| A1 | after merge · reads | B2's statement again | `244`, `20270117200000`, `1f41d1a48f39e5544ba5d88b79b463d8` (the repository's 244) |
| A2 | after merge · reads | `select extname, extversion from pg_extension where extname = 'pg_cron';` | One row. **If 227's `create extension if not exists pg_cron with schema pg_catalog` was refused, the migration failed. That is a material discrepancy: stop** (Sharon, item 1) |

### Item 1 · The scheduler

| # | When · reads or acts | Exact statement | Passes when |
|---|---|---|---|
| 1a | after merge · reads | `select jobname, count(*) from cron.job where jobname like 'pintar-%' group by 1 order by 1;` | Exactly `pintar-akuntabilitas-buang-lama` 1 and `pintar-pengerjaan-tutup-terjadwal` 1 (`public.pintar_jadwal_daftar()`, 231), and no other `pintar-%` row |
| 1b | after merge · reads | `select jobname, schedule, command, username, database, active from cron.job where jobname like 'pintar-%' order by 1;` and `show cron.timezone;` | Schedules `17 19 * * *` and `*/5 * * * *`. Commands `select public.akuntabilitas_buang_lama()` and `select public.pengerjaan_tutup_terjadwal()`. `username` `postgres`, `database` `postgres`, `active` true. `cron.timezone` `GMT` or `UTC` |
| 1c | after merge · reads | `select public.pintar_periksa_kesehatan();` | `ok` true, `pg_cron` true, and `hilang`, `berbeda` and `tidak_dideklarasikan` each `[]` |
| 1d | after merge · reads | `select j.jobname, d.status, d.start_time, left(d.return_message, 120) from cron.job_run_details d join cron.job j on j.jobid = d.jobid where j.jobname like 'pintar-%' order by d.start_time desc limit 10;` | At least one `succeeded` row for `pintar-pengerjaan-tutup-terjadwal` (it runs every 5 minutes), and no `failed` row |

**1e · The committing-procedure proof: the one act** (after merge · acts). Run locally exactly as written below: the first run `succeeded`, both rows present in order, and 1g reads `0 0 0 0` (test record).

The DDL is exactly this, in a scratch schema no PINTAR code reads (`uji_cron_41`). The job's name is deliberately not
`pintar-*`, so the health read never counts it.

```sql
create schema uji_cron_41;
create table uji_cron_41.catatan (n int primary key, pada timestamptz not null default clock_timestamp());
create procedure uji_cron_41.dua_kali() language plpgsql as $$
begin
  if exists (select 1 from uji_cron_41.catatan) then return; end if;   -- a second run changes nothing
  insert into uji_cron_41.catatan (n) values (1);
  commit;
  insert into uji_cron_41.catatan (n) values (2);
  commit;
end $$;
select cron.schedule('uji-41-prosedur-komit', '* * * * *', 'call uji_cron_41.dua_kali()');   -- record the jobid it returns
```

**1f** (after merge · reads), within two minutes:
```sql
select d.status, d.return_message, d.start_time, d.end_time from cron.job_run_details d
 where d.jobid = <jobid> order by d.start_time;
select n, pada from uji_cron_41.catatan order by n;
```
- **Passes when:** the first run is `succeeded`, and rows 1 and 2 are both present, with `pada` of row 2 after row 1.
- **If the run failed *because of transaction control*** (its `return_message` names `COMMIT` or "invalid transaction
  termination"): that is the runbook's own case. It is not a failure of the promotion, but **A2a is not released, and
  its page returns to Sharon** (D6.6).

**1g** (after merge · acts, then reads): the clean-up, and the catalogue shows nothing left.
```sql
select cron.unschedule('uji-41-prosedur-komit');
delete from cron.job_run_details where jobid = <jobid>;
drop schema uji_cron_41 cascade;
select (select count(*) from cron.job where jobname = 'uji-41-prosedur-komit') as jobs,
       (select count(*) from cron.job_run_details where jobid = <jobid>) as runs,
       (select count(*) from pg_namespace where nspname = 'uji_cron_41') as schemas,
       (select count(*) from pg_proc where proname = 'dua_kali') as procedures;
```
- **Passes when:** `0 0 0 0`.
- Then repeat 1a to 1c: they are unchanged.

### Item 2 · Locks and timeouts under hosted roles

**2a · Two connections** (after merge · acts: one transaction-level advisory lock on a throwaway key; no row is
written).
- The key is `4141004100`; no PINTAR code takes it.
- Connection A is opened **through the pooler in transaction mode (port 6543)**. Connection B is opened through the
  same pooler.

| Step | A | B |
|---|---|---|
| 1 | `begin; select pg_advisory_xact_lock(4141004100); select pg_sleep(20); commit;` (start it, then go to B at once) | |
| 2 | (sleeping) | `select pg_try_advisory_xact_lock(4141004100);` → **must be `false`** |
| 3 | (committed) | `select pg_try_advisory_xact_lock(4141004100);` → **must be `true`** |

- Then the same three steps with both connections **direct** (port 5432).
- **Passes when:** `false` then `true`, both times. Any other answer means the fence would not exclude through that
  path. That is a material discrepancy for A2a: stop, and the page goes to Sharon.

**2b · Through the API** (no act). There is no RPC on staging that takes such a lock, and none is added for this
(Sharon). The reasoning is recorded instead:
- PostgREST runs each request in one transaction, on a connection held for that transaction, and commits or rolls back
  at its end.
- A transaction-level advisory lock taken inside an RPC is therefore held for exactly that request.
- That is the property 2a proves for the pooler.

**2c · The timeouts** (after merge · reads):
```sql
select r.rolname, r.rolconfig,
       (select array_agg(s.setconfig::text) from pg_db_role_setting s where s.setrole = r.oid) as per_database
  from pg_roles r where r.rolname in ('postgres', 'authenticator', 'authenticated', 'anon', 'service_role') order by 1;
select setconfig from pg_db_role_setting where setrole = 0;   -- the database's own settings
```
- **Record** `statement_timeout`, `lock_timeout` and `idle_in_transaction_session_timeout` for each of the five roles
  (an absent setting reads as the server default: `show` each one, too).
- **Against D6.1:** activation uses a lock timeout and retries (THE PLAN §5.3 D6.1). A2a has not yet fixed the two
  numbers. The constraint the reading sets for A2a is: **lock timeout × retries + the activation's own work <
  `authenticated`'s `statement_timeout`** (the role an admin's request runs as).
- **Passes when:** the values are recorded and the constraint is stated with them. A role whose `lock_timeout` is
  lower than the fence's lock timeout is recorded as a limit A2a must design to. It is not a stop.

### Item 3 · Auth with a locked account, and "both triggers on `auth.users`"

**3a · The triggers** (after merge · reads):
```sql
select t.tgname, t.tgenabled, pg_get_triggerdef(t.oid) from pg_trigger t
 where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal order by 1;
select tgname, tgenabled, pg_get_triggerdef(oid) from pg_trigger
 where tgrelid = 'public.accounts'::regclass and tgname = '_l1f2_accounts_terkunci';
```
- **Passes when:** five triggers on `auth.users`, all enabled (`O`):
  - **the two Sharon names:** `on_auth_user_created` (AFTER INSERT, `handle_new_auth_user`) and
    `pintar_kunci_tetap_jaga` (BEFORE UPDATE OF `banned_until`);
  - the other three guards: `pintar_password_write_guard`, `pintar_card_email_guard`,
    `pintar_email_correction_guard`.
- `_l1f2_accounts_terkunci` is present and enabled on `public.accounts`.
- Each definition's md5 equals the repository's: the rehearsal's `auth.users triggers (definitions md5)` and
  `accounts link lock (L1-F2)` lines, read locally at 244: `5 c72efdfe64954caf38c5ca55bd7786a6` and
  `11db10649d6009f6876bfe724e8aa15a`.

**The synthetic person (L).**
- Sharon's insert path needs a **suspended person who has no account yet**. A staff person is never in that state: the
  product's staff path, `authorize_new_person`, makes the person and the account in one request.
- So L is **a synthetic learner on a synthetic school's roster**, given a **class card**. That is the product's own way
  to give an existing person an account, and it also exercises the card sign-in.
- Record each id as it is made (§4).

| # | When · reads or acts | Who · the product's path | Exact check | Passes when |
|---|---|---|---|---|
| 3.0 | after merge · acts | SA: one roster row for L, named «Sintetis Pemeriksaan 4.1», into a synthetic class (`/pendataan`: `import_open` → `import_validate` → `import_confirm` → `import_advance`) | `select p.id, p.created_at, (select count(*) from public.accounts a where a.person_id = p.id) from public.persons p where p.display_name = 'Sintetis Pemeriksaan 4.1';` | One person, no account. Record its id **L** and its enrolment's id |
| 3.1a | after merge · acts | PA suspends L (`/konfigurasi/keamanan`, Tangguhkan: `tangguhkan_akun(L, 'ADMINISTRATIVE', …)`) | `select id, category, ended_at from public.person_suspensions where person_id = 'L';` | One open `ADMINISTRATIVE` row |
| 3.1b | after merge · acts | SA gives L a class card (`POST /api/akun/aktivasi`, mode `CLASSROOM_CARD`, L's id). Hosted GoTrue inserts the user; `on_auth_user_created` inserts the account; `_l1f2_accounts_terkunci` fires inside that insert | Immediately: `select u.id, u.created_at, u.banned_until, u.banned_until = public.akun_terkunci_sampai() as terkunci from auth.users u join public.accounts a on a.auth_user_id = u.id where a.person_id = 'L';` | **One account, `terkunci` true at the first read.** The lock commits in Auth's own insert transaction (L1-F2 §1), so there is no instant at which it is open. **Any read showing it open is a material discrepancy** (Sharon's first addition). Record the card number and PIN the route returned, and nowhere else |
| 3.2 | after merge · acts | SA reissues L's card while L is suspended (`POST /api/akun/kartu-kelas`: `authorize_card_reissue`, then Auth's admin password write `updateUserById` with the new card's secret). This is the reissue a locked learner is meant to receive (L1-R2) | Before and after: `select banned_until from auth.users where id = '<L's user>';` | The write succeeds, and `banned_until` stays `2999-12-31 23:59:59+00` both times (`pintar_kunci_tetap_jaga` keeps it). Record the new card and PIN |
| 3.3a | after merge · acts (one refused sign-in) | Anyone: `POST /api/masuk/kartu` with L's card and its right PIN | The answer's status, body and wording | Refused. **Equal to the card method's wrong-PIN answer** (3.4b); compared field by field |
| 3.3b | after merge | Password sign-in and PIN recovery | See §5, open point 1 | Run as decided there, each compared with the same method's wrong-password answer |
| 3.4a | after merge · acts | PA reinstates L (`aktifkan_kembali_akun(L, …)`, 10 to 300 characters) | `select banned_until from auth.users where id = '<L's user>';` and the suspension row's `ended_at` | `banned_until` null, and the suspension ended |
| 3.4b | after merge · acts | `POST /api/masuk/kartu`: first with L's card and a **wrong** PIN (record the answer: this is 3.3a's comparison), then with the right PIN | The two answers | Wrong PIN refused, with the method's ordinary mismatch. Right PIN signs in. Keep the session's access and refresh tokens for 3.5 and item 6 |
| 3.5 | after merge · acts | PA suspends L again (as 3.1a); then the refresh: `POST <auth>/auth/v1/token?grant_type=refresh_token` with L's refresh token from 3.4b; then PA reinstates L (as 3.4a) | The refresh's answer | **Refused with `user_banned`** (`error_code`), and no new session. A refresh that succeeds is a material discrepancy |

### Item 4 · Writes to the `auth` schema while the app runs

**4a** (after merge · reads):
```sql
select r.owner,
       has_table_privilege(r.owner, 'auth.users', 'UPDATE')             as users_update,
       has_table_privilege(r.owner, 'auth.identities', 'UPDATE')        as identities_update,
       has_table_privilege(r.owner, 'auth.audit_log_entries', 'UPDATE') as audit_update,
       has_table_privilege(r.owner, 'auth.sessions', 'DELETE')          as sessions_delete,
       has_table_privilege(r.owner, 'auth.refresh_tokens', 'DELETE')    as refresh_delete,
       has_table_privilege(r.owner, 'auth.one_time_tokens', 'DELETE')   as one_time_delete
  from (select proowner::regrole::text as owner from pg_proc
         where oid in ('public.hapus_data_pribadi(uuid,text)'::regprocedure, 'public.akun_kunci(uuid,boolean)'::regprocedure)) r;
```
**Passes when:** both rows (the two definers' owner) read `true` in every column.

**4b · L removed by the product's own path** (after merge · acts). This exercises every write above. The Admin API is
never used: it would bypass what item 4 must prove.

| # | Who · the product's path | Exact check | Passes when |
|---|---|---|---|
| 4b.1 | SA ends L's enrolment (`akhiri_pendaftaran`). A learner enrolled through a school cannot close their own account (`ACCOUNT_LEARNER_VIA_SCHOOL`) | `select status, end_reason from public.enrollments where person_id = 'L';` | Ended |
| 4b.2 | L, signed in by card: `/akun`, request deletion of personal data (`minta_akun('DELETE_PERSONAL_DATA', true)`), then close the account (`minta_akun('CLOSE', true)`) | `select kind, status from public.account_requests where person_id = 'L' order by created_at;` and `banned_until` | One `DELETE_PERSONAL_DATA` request `RECEIVED`, one `CLOSE` `DONE`, an open `CLOSED_AT_REQUEST` suspension; locked |
| 4b.3 | PA deletes L's personal data (`POST /api/akun/hapus-data`: `hapus_data_pribadi(<the request>, …)`) | `select display_name, photo_path, anonymized_at from public.persons where id = 'L';` · `select email from auth.users where id = '<L's user>';` · `select count(*) from auth.identities where user_id = '<L's user>' and identity_data ->> 'email' not like 'anonim-%';` · `select (select count(*) from auth.sessions where user_id = '<L's user>'), (select count(*) from auth.refresh_tokens where user_id = '<L's user>'), (select count(*) from auth.one_time_tokens where user_id = '<L's user>');` | The call succeeds. `anonymized_at` set; the email `anonim-<user>@pintar.invalid`; no identity keeps the address; `0 0 0`. **Any refusal by the hosted project of one of these writes is a material discrepancy** (Sharon's second addition) |
| 4b.4 | reads | `select public.akun_keadaan('L');` as PA | Closed and anonymised. L stays terminal (L1-F4), marked synthetic by its name and recorded in §4 |

### Item 5 · Restore: the rehearsal against a scratch target

Not a restore of staging (Sharon, `CHECKPOINT-ITEM5-…`).

| # | When · reads or acts | Exact step | Passes when |
|---|---|---|---|
| 5a | after merge, after item 4 · reads staging; acts on a copy on the runner only | Dispatch `restore-rehearsal.yml` on `main` (it carries this commit's extension once merged) | The workflow is green. Its new step prints the lines below |
| 5b | (in the run) | "did the restore bring the jobs back:" | Recorded either way (Sharon's condition 3). If `pg_cron` itself did not come back, the step says so and gives the copy the extension, as 227 installs it |
| 5c | (in the run) | "installer run 1" and "installer run 2" | Both: `ok=true; 2 of 2 declared job(s) present exactly once` |
| 5d | (in the run) | "the health read's job findings on the copy" | `hilang [] berbeda [] tidak_dideklarasikan [] pg_cron true` |
| 5e | (in the run) | "the 4.1 checkpoint's named facts": the `auth.users` trigger definitions, the account-link lock, L1-F4's guards, the jobs, the public triggers, and the accountability tables | Every line `same`; no `CHANGED`, `DIFFERS` or `MISSING`; the three accountability tables present. **Any difference after the installer is a material discrepancy** (Sharon's third addition) |
| 5f | (in the run) | "audit_log: N row(s); migration 215's rewrite on the copy: column … ms, audit_log_run_idx … ms, audit_log_run_parent_uq … ms" | Recorded with N, to be scaled to production's row count for its window. (The rewrite is migration 215, already on staging. Runbook §3a records that correction to §5b's text, for Sharon to confirm) |
| 5g | in the verification report | **The known limit:** the scratch target does not show what Supabase's own hosted restore brings back by itself. Item 5 does not require it, and finding out would mean restoring staging, which is not authorized | Stated in the report, not left out (Sharon's condition 5) |

### Item 6 · Headers and the hook's delay

| # | When · reads or acts | Exact statement | Passes when |
|---|---|---|---|
| 6a | after merge · reads | `select at, kind, method, outcome, network_origin from public.accountability_events where person_id = 'L' order by at;` | L's card sign-in at 3.4b has `network_origin` filled, in the `/24` (IPv4) or `/48` (IPv6) form |
| 6b | **before merge (read-only)** and after merge · reads | The hook timed in the database, 200 calls (below) | Recorded before and after |
| 6c | after merge · reads (as L, who is still live after 3.5 and before 4b) | 50 authenticated reads of one cheap endpoint: `GET <app's Supabase URL>/rest/v1/rpc/pintar_status_saya` with L's access token, timed by `curl -s -o /dev/null -w '%{time_total}\n'`; p50 and p95 | Recorded with 6b's figures, against D1's budget (§5, open point 2) |

**6b's statement.** It runs in a read-only transaction, so it is allowed before the merge: it adds nothing to the two
pre-merge steps' writes, which are none.
```sql
begin transaction read only;
do $$
declare t0 timestamptz; ms float8[] := '{}'; i int;
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  for i in 1..200 loop
    t0 := clock_timestamp(); perform pintar_permintaan.periksa();
    ms := ms || extract(epoch from clock_timestamp() - t0) * 1000;
  end loop;
  raise notice 'hook: p50 % ms, p95 % ms over % calls',
    (select round(percentile_cont(0.5) within group (order by x)::numeric, 3) from unnest(ms) x),
    (select round(percentile_cont(0.95) within group (order by x)::numeric, 3) from unnest(ms) x), array_length(ms, 1);
end $$;
rollback;
```
Run locally at 244: p50 0.004 ms and p95 0.004 ms over 200 calls with anon claims. With no window active, the hook
returns at once. So on staging, the reading is recorded with the claims it used, and taken the same way before and
after.

**Does `perf-staging.yml` do this?** No.
- Its modes are `probe`, `region`, `journey` and `sessions30`. They time pages, a journey's steps and 30 sessions'
  clicks.
- None times one endpoint N times with p50 and p95, and none isolates the hook.
- So 6b and 6c are done by hand, as above.

**On the runbook's "before merge" list:**
- 6b before the merge is a read in a read-only transaction. It is not one of the two steps Sharon lists, so it is
  **proposed** here, and it runs only if Sharon and the Chief Architect accept it as read-only.
- If it is not accepted, 6c is compared against D1's budget alone (§5, open point 2).

### Preservation "after"

| # | When · reads or acts | Exact statement | Passes when |
|---|---|---|---|
| Z | after merge, after items 1 to 6 · reads | `preservation.sql` with `batas`'s two `null`s replaced by B1's lines 1 and 2, in a read-only transaction | **Every line from `demo_roles` to `audit_log up to the watermark` equals B1's.** The `state ·` lines read 244, `installed 1.6.x` and the five triggers. Lines 70 to 72 follow the header's rule: each sitting the schedule closed was open at B1 |

## 4 · Every row the checkpoint creates

(Sharon's cross-cutting requirement.)
- Each is created **after** B1's cutoff, so it falls outside every preservation fingerprint by construction.
- Each is recorded by id as it is made, in the verification report.
- None is removed by anything but the product's own paths.

| Item | Rows |
|---|---|
| 1 | `uji_cron_41` (schema, table `catatan` with 2 rows, procedure `dua_kali`); one `cron.job` row and its `cron.job_run_details` rows. **All removed in 1g, shown by the catalogue read.** The two `pintar-*` jobs' own `cron.job_run_details` rows accumulate (every 5 minutes, and daily); that is A1's and B1's design |
| 2 | None (an advisory lock; connection sessions only) |
| 3 | L's `persons` row and its `person_usernames` row if the import gives one; the import job and its rows; L's enrolment; 2 `person_suspensions` (3.1a and 3.5), each ended; `account_activation_grants` for the card and its reissue; one `accounts` row; one `auth.users` row, its `auth.identities` row, and Auth's own `auth.audit_log_entries`, `auth.sessions` and `auth.refresh_tokens` for L's sign-in; `password_write_permits` (transient, consumed); `accountability_events` for each sign-in attempt and outcome (3.3a, 3.4b, and SA's and PA's own sign-ins); `audit_log` rows for the import, suspension, activation, reissue and reinstatements |
| 4 | L's `account_requests` (`DELETE_PERSONAL_DATA`, `CLOSE`); one `CLOSED_AT_REQUEST` suspension; L's enrolment ended; the anonymisation of L's own rows (person, user, identities, Auth's audit entries) and the deletion of L's sessions and tokens; `audit_log` rows. **L stays, anonymised and terminal** |
| 5 | None on staging (the copy is on the runner and discarded) |
| 6 | None beyond item 3's sign-in (reads only) |
| — | **The scheduled jobs' own effect** (not the checkpoint's act, A1's design): `pintar-pengerjaan-tutup-terjadwal` closes sittings still open after their deadline. Preservation line 70 counts the open sittings at B1, and line 72 the ones the job closed. Each must be among line 70's |

## 5 · Open points (for the Chief Architect and Sharon, before the runbook's step 9)

1. **Password sign-in and PIN recovery for a locked account (3.3b).**
   - A class card has no password set-up and no PIN recovery (`my_setup_state` `NOT_APPLICABLE`). So these two
     methods need an account with an email address, a password and a PIN.
   - The product gives such an account its password only through the email link (`signInWithOtp`, then the set-up).
     That needs email delivery to a mailbox the operator can read.
   - **The choice is the Chief Architect's.** Either:
     - **(a)** an **existing** synthetic staff account whose password and PIN the operator already holds, not a
       platform administrator. PA suspends it for the two checks and reinstates it at once. Preservation is unaffected:
       accounts are fingerprinted by whether they are locked, which is the same after reinstatement. The suspension and
       audit rows fall after the cutoff, and the account is not otherwise changed. Or:
     - **(b)** a new synthetic email person, if the operator can read its mailbox. Or:
     - **(c)** skip the two methods, with that reason stated, as Sharon allows for methods that need email delivery.
   - Under (a) or (b), each is checked exactly as 3.3a: the locked right-password answer equals the same method's
     wrong-password answer, field by field.
2. **D1's budget is not a number.** THE PLAN §5.3 D1 says the hook is "measured before and after", and A2a's regression gate says
   "within the measured budget". Neither gives an absolute figure. Sharon says to compare against D1's absolute budget
   if the pre-promotion figure cannot be taken. So:
   - **(a)** accept 6b before the merge as read-only, so a before-figure exists; and
   - **(b)** name an absolute budget for 6c (for example, p95 of the hook under a stated figure) before step 9.
3. **The rollback's one non-reversal, `auth.users.banned_until`**, for Sharon's ruling. It is named in the rollback's
   header, and its reasons are there.
4. **The rewrite timing (5f)** is on the copy, not from the promotion run, because the rewrite is migration 215 and
   already on staging. Runbook §3a records this; Sharon confirms it at her review.

## 6 · Material discrepancy

**The runbook's list:**
- the migration count differs;
- any preservation value differs;
- a migration fails or is skipped;
- `pg_cron` cannot be installed, or cannot run a committing procedure;
- a trigger on `auth.users` is refused by the hosted project or breaks Auth's own writes;
- a locked account can sign in or refresh;
- any sign of an effect on production.

**Sharon's three additions:**
- the insert path (3.1b) leaves a new account **open**, at any instant;
- an `auth` write of item 4 is refused at runtime;
- the rehearsal reproduces a table, trigger or job differently from staging after the runbook step (5e).

**And, from this page:**
- item 2a answers anything but `false` then `true` on either path;
- the committing-procedure job fails for another reason than transaction control. (Failure because of transaction
  control is the runbook's own case: A2a is held, not the promotion.)

**On any of them:** stop, record it in the runbook and in `STATUS-2026-11-12.md`, and hold. Nothing is repaired on
staging without the owner.

## 7 · What this commit changes

**No migration, table or column.** The rollback file is never applied by anything (its header). The commit adds:
- this page;
- the rollback file and its test record;
- the preservation query.

Its one code change is **the restore rehearsal's extension** (a workflow and the facts query it reads). It runs only
when dispatched. It reads staging only and writes only the copy on its runner:
- 5b to 5f;
- the four F lines in `audit/restore/fakta.sql`;
- the installer twice;
- the timed rewrite in a transaction that is rolled back.
