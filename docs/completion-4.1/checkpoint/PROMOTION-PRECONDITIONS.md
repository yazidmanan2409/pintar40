# 4.1 staging checkpoint · the promotion's preconditions and the six checks, exactly

## What governs this page

- **Authority:**
  - the owner's authorization of the staging checkpoint (12 Nov 2026), in `STAGING-CHECKPOINT-BEFORE-A2A.md` on
    `claude/bob-41-master-plan` (runbook §2 step 2 asks for this page);
  - **Sharon's reading of Addendum 1 §5b's six items, which governs this page:** `claude/gracious-lamport-0m1qjr` at
    `e682422328bce43df209d79fbd3d940a4c104d7a`:
    - `docs/coordination/reviews/sharon/CHECKPOINT-RUNBOOK-c51e6d47212dd335e9b09eed5eea9c98bcca6a9d.md`;
    - `docs/coordination/reviews/sharon/CHECKPOINT-ITEM5-152ecea939f780e7c5038f81229fac61879707ce.md`;
  - **Sharon's review of this evidence, PASS with two required lines and her rulings on the four open points:**
    `claude/gracious-lamport-0m1qjr` at `33e1c648c53b31db4439c6f1750f1dbca0e1b839`,
    `CHECKPOINT-EVIDENCE-d8db82bde8d7a47e9936a34fd21686ca11adb472.md`;
  - **the Chief Architect's §3c and §3d** in the runbook (at `b144379689738c6032b7f481e9fcf130ad19d8cf` and
    `87eded54a80d039b7b37d642eb234864198a8f9f`): the acting steps run as one dispatched workflow, and the five
    questions are asked of the checkpoint itself.
- **Pattern:** `docs/completion-4.0/batch-5/` (the promotion preconditions, the rollback file, the preservation query).
- **What it is not: an act.**
  - Nothing on this page has been run on staging.
  - Second Eye does not touch staging, open the pull request or merge.
- **How each step is marked:**
  - **before merge (read-only)** or **after merge**, as the owner's second instruction and Sharon require. Before the
    merge, only reads run, in read-only transactions: the preservation query and the migration count, plus the three
    reads §3c and §3d add (6b's timing, the first runs' counts, and the actors' accounts).
  - **reads** or **acts**: whether it only reads staging, or acts on it.
  - **Who runs it** (runbook §3c):
    - **reads: the Chief Architect**, with his read-only database tool;
    - **acts: the workflow `staging-checkpoint-41.yml`**, with its script `audit/staging/checkpoint-41.mjs`,
      dispatched by the Chief Architect from `main` after the merge.
      - The acts need credentials, and no credential passes through any person, so the workflow uses staging's
        existing secrets only.
      - Its step ids are this page's numbers.
      - It stops at the first result that differs, and uploads its record, `checkpoint-41.json`, alone, as an
        artifact. §3's "The workflow's record, field by field" says what that record holds.
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
| B2 | before merge (read-only) · reads | The migration count | `select count(*), max(version), md5(string_agg(version, ',' order by version)) from supabase_migrations.schema_migrations;` | `224`, `20270113160000`, `d11e89838ecb656c4ca5b06b18941316` (the digest of the repository's first 224 versions; computed locally on a database at 224). *Read on staging by the Chief Architect at 00:56 UTC on 13 Nov: as expected (runbook §4)* |
| B3 | before merge (read-only) · reads | The hook's time, before (6b) | 6b's one `select` (item 6, below) | p50 and p95 recorded. **Gate (Sharon): p95 ≤ 1 ms** |
| B4 | before merge (read-only) · reads | What each scheduled job's first run will act on, by school (§3d, question 1) | `evidence/staging/first-runs.sql`: one `select` | Recorded, and **shown to the owner with the pull request**: per school, the sittings the closer will end (and of those, the ones it will also score), and the sign-in records retention will remove (none: its table does not exist at 224) |
| B5 | before merge (read-only) · reads | The actors exist (§3d, question 5): SA, S and PA, named in §3's opening | The `select` in §3's opening | Each address has one account. SA holds `INSTITUTION_ADMIN` in the Golden School; PA holds an active `SYSTEM_ADMIN` grant; S is an `EDUCATOR` with no platform role. **An actor that does not exist is reported to the owner with the pull request: the workflow would stop at its first act** |

## 3 · After the merge

In this order, after `staging.yml` has applied 244 and its own checks have passed (runbook steps 8 and 9).
- Every statement below is plain SQL on staging's database as `postgres` (the migration owner), or one HTTP request to
  staging's app or Auth, as stated.
- **Who runs it:**
  - Every **read** can be run by the Chief Architect; the workflow also runs the reads its own steps check.
  - Every **act** is the workflow's (`staging-checkpoint-41.yml`). It is dispatched once, from `main`, with the Golden
    School's slug and the class L joins, after `staging.yml` has finished. It refuses to start while `staging.yml`
    runs (§3d, question 3).
- **The actors.** Staging's existing synthetic accounts, never a real person (D-064). Each is named by role and by the
  secret that lets the workflow sign it in (never a value):

| Actor | The account (staging) | Role | How the workflow signs it in | Secret it relies on |
|---|---|---|---|---|
| **SA** | `goldenschool+<slug>-admin@pintarselalu.com` | `INSTITUTION_ADMIN` of the Golden School (`CAN_PROVISION_PEOPLE`), made by `staging-golden-school-admin.yml` | As every Golden School walk does (`audit/staging/masuk.mjs`): the password derived for this address, or the emailed code read from the staging test mailbox | `GS_MAILBOX_PASSWORD` |
| **S** | `goldenschool+<slug>-guru@pintarselalu.com` | `EDUCATOR` of the Golden School; no platform role | Step 3.3b only, through `/masuk/password`, with the password derived for this address | `GS_MAILBOX_PASSWORD` |
| **PA** | `goldenschool+operator@pintarselalu.com` | The staging Platform Operator: an active `SYSTEM_ADMIN` grant until 2026-12-31 (D-088(a), `staging-platform-operator.yml`) | As SA, then «Seluruh platform» | `GS_MAILBOX_PASSWORD` |
| (all) | — | — | Staging's public key, read through the Management API and masked; the database through its URL | `STAGING_SUPABASE_ACCESS_TOKEN`, `STAGING_SUPABASE_DB_URL` |

- **Whether they exist on staging today** cannot be read from the work branch. B5 reads it before the merge:
```sql
select x.who, count(distinct a.id) as accounts,
       string_agg(distinct r.role::text, ',') filter (where r.revoked_at is null and now() >= r.valid_from and now() < r.valid_until) as live_roles
  from (values ('SA', 'goldenschool+<slug>-admin@pintarselalu.com'), ('S', 'goldenschool+<slug>-guru@pintarselalu.com'),
               ('PA', 'goldenschool+operator@pintarselalu.com')) x(who, email)
  left join auth.users u on lower(u.email) = x.email
  left join public.accounts a on a.auth_user_id = u.id
  left join public.role_assignments r on r.person_id = a.person_id
 group by x.who order by x.who;
```
- **No existing secret holds a password as such.**
  - Each walk derives a staff password from `GS_MAILBOX_PASSWORD` and the address, and sets it when it activates that
    account. So S's password is known only if a walk activated S, or recovered it, with the derivation (`kredensial`).
  - The workflow **checks that first** (3.3b), and does not recover or reset it.
  - If the derived password does not sign S in, 3.3b is recorded **`OWNER`** and goes to the owner (Sharon's ruling;
    runbook §3c). The run then continues.
  - **No credential is created.**
  - One caveat, on SA and PA: the walks' own sign-in helper, which the workflow reuses, recovers a password that no
    longer matches. It does so by «Lupa password?» with the emailed code, as every walk does. That is the derived
    password again, not a new credential.

### The workflow's record, field by field (what the artifact holds)

The artifact `staging-checkpoint-41` (90 days) holds **one file, `checkpoint-41.json`**, and nothing else. It holds no
screenshot: a sign-in helper's failure screenshot could show a form. The job log and its summary carry the same step
lines as the record.

**Every string written to the record, the log or the summary passes through one redaction first** (`bersih()` in the
script). It replaces with «redacted»:
- any JWT;
- any value under a key that names a token, key, password, PIN, card, cookie, authorization or secret;
- any `app.settings.*` or `jwt_secret` setting.

The secrets the run handles are also masked in the log before use: the card and PIN, the derived passwords, and each
access and refresh token.

| Field | Holds | Never holds |
|---|---|---|
| `run`, `started`, `finished` | The Actions run id and two UTC instants | — |
| `steps[]` | One entry per step: `id` (the page's number), `judul` (its title), `verdict` (`PASS`, `RECORDED`, `OWNER` or `DIFFERS`), `ms`, `detail` | — |
| `steps[].detail` | What the step read or compared: counts, md5s of definitions, ids, `banned_until` values, the sign-in routes' refusals as status and `{ok, code}` (the per-request `ref` removed), the refresh's `error_code` alone, timings, and `akun_keadaan`'s answer for L and E (anonymised by then) | A card number or PIN, a password, a token, a cookie, an Auth response body (only the refresh's `error_code` is kept), any address, any setting other than the three timeouts |
| `ids` | `jobid` (item 1's scratch job), `L`, `L_user`, `enrolment`, `request` (L's deletion request), `S` (S's person id, if 3.3b ran), `E`, `E_user`, `E_request` | An address or a name |
| `timeouts` | `statement_timeout`, `lock_timeout` and `idle_in_transaction_session_timeout` for the five roles, the database and the server | Any other role or database setting. The read selects only these three by name |
| `endpoint` | 6c's `n`, `p50` and `p95` in ms | — |
| `refresh` | 3.5's `error_code` (`user_banned` or `refresh_token_not_found`) | — |
| `passwordStep` | `OWNER` when 3.3b went to the owner; absent otherwise | — |
| `directUnreachable` | Set when 2a could not reach the direct host and used the session pooler | — |
| `transactionControl` | `FAILED` when 1f failed because of transaction control (A2a held) | — |
| `stopped`, `halaman` | The step it stopped at, and each actor's page path at that moment (for example `/pendataan`) | The page's content |

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

**1e · The committing-procedure proof: the one act** (after merge · acts · the workflow, step 1e). Run locally exactly as written below: the first run `succeeded`, both rows present in order, and 1g reads `0 0 0 0` (test record).

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

**1f** (after merge · reads · the workflow, step 1f, waiting up to five minutes):
```sql
select d.status, d.return_message, d.start_time, d.end_time from cron.job_run_details d
 where d.jobid = <jobid> order by d.start_time;
select n, pada from uji_cron_41.catatan order by n;
```
- **Passes when:** the first run is `succeeded`, and rows 1 and 2 are both present, with `pada` of row 2 after row 1.
- **If the run failed *because of transaction control*** (its `return_message` names `COMMIT` or "invalid transaction
  termination"): that is the runbook's own case. It is not a failure of the promotion, but **A2a is not released, and
  its page returns to Sharon** (D6.6).

**1g** (after merge · acts, then reads · the workflow, step 1g): the clean-up, and the catalogue shows nothing left.
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

**2a · Two connections** (after merge · acts · the workflow, step 2a: one transaction-level advisory lock on a
throwaway key; no row is written).
- The key is `4141004100`; no PINTAR code takes it.
- Connection A is opened **through the pooler in transaction mode (port 6543)**. Connection B is opened through the
  same pooler.

| Step | A | B |
|---|---|---|
| 1 | `begin; select pg_advisory_xact_lock(4141004100); select pg_sleep(20); commit;` (start it, then go to B at once) | |
| 2 | (sleeping) | `select pg_try_advisory_xact_lock(4141004100);` → **must be `false`** |
| 3 | (committed) | `select pg_try_advisory_xact_lock(4141004100);` → **must be `true`** |

- Then the same three steps with both connections **direct** (port 5432).
  - `STAGING_SUPABASE_DB_URL` is staging's **session pooler** (`docs/deployment/STAGING.md`). The transaction pooler is
    the same URL on port 6543.
  - The direct host, `db.<ref>.supabase.co`, may have no IPv4 address, and a runner has no IPv6. If the workflow cannot
    reach it, it records that and runs the direct case on the session pooler instead. The session pooler gives each
    client one server connection, so a transaction-level lock behaves as it does on a direct connection.
  - That substitution is **named in the record, for Sharon**. It is not a pass of "direct".
- **Passes when:** `false` then `true`, both times. Any other answer means the fence would not exclude through that
  path. That is a material discrepancy for A2a: stop, and the page goes to Sharon.

**2b · Through the API** (no act). There is no RPC on staging that takes such a lock, and none is added for this
(Sharon). The reasoning is recorded instead:
- PostgREST runs each request in one transaction, on a connection held for that transaction, and commits or rolls back
  at its end.
- A transaction-level advisory lock taken inside an RPC is therefore held for exactly that request.
- That is the property 2a proves for the pooler.

**2c · The timeouts** (after merge · reads · recorded by the workflow, step 2c; the Chief Architect may read them too):
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
| 3.0 | after merge · acts | SA: one roster row for L, named «Sintetis Pemeriksaan <the run's letters>», into the class the dispatch names (`/pendataan`: `import_open` → `import_validate` → `import_confirm` → `import_advance`) | `select p.id, p.created_at, (select count(*) from public.accounts a where a.person_id = p.id) from public.persons p where p.display_name = '<L''s name>';` | One person, no account. Record its id **L** and its enrolment's id |
| 3.1a | after merge · acts | PA suspends L (`tangguhkan_akun(L, 'ADMINISTRATIVE', …)`: the function `/konfigurasi/keamanan`'s Tangguhkan calls, with PA's own session) | `select id, category, ended_at from public.person_suspensions where person_id = 'L';` | One open `ADMINISTRATIVE` row |
| 3.1b | after merge · acts | SA gives L a class card (`POST /api/akun/aktivasi`, mode `CLASSROOM_CARD`, L's id). Hosted GoTrue inserts the user; `on_auth_user_created` inserts the account; `_l1f2_accounts_terkunci` fires inside that insert | Immediately: `select u.id, u.created_at, u.banned_until, u.banned_until = public.akun_terkunci_sampai() as terkunci from auth.users u join public.accounts a on a.auth_user_id = u.id where a.person_id = 'L';` | **One account, `terkunci` true at the first read.** The lock commits in Auth's own insert transaction (L1-F2 §1), so there is no instant at which it is open. **Any read showing it open is a material discrepancy** (Sharon's first addition). Record the card number and PIN the route returned, and nowhere else |
| 3.2 | after merge · acts | SA reissues L's card while L is suspended (`POST /api/akun/kartu-kelas`: `authorize_card_reissue`, then Auth's admin password write `updateUserById` with the new card's secret). This is the reissue a locked learner is meant to receive (L1-R2) | Before and after: `select banned_until from auth.users where id = '<L's user>';` | The write succeeds, and `banned_until` stays `2999-12-31 23:59:59+00` both times (`pintar_kunci_tetap_jaga` keeps it). Record the new card and PIN |
| 3.3a | after merge · acts (one refused sign-in) | Anyone: `POST /masuk/kartu` with L's card and its right PIN. This is the public path; `/api/masuk/kartu` sits behind the proxy | The answer's status and body, without the per-request `ref` | Refused **by the sign-in route itself**, with its own `code`. **Equal to the card method's wrong-PIN answer** (3.4b), field by field |
| 3.3b | after merge · acts | **Password sign-in on a locked staff account (Sharon's ruling, option (a)).** S is the Golden School's teacher, not a platform administrator. First, S signs in with the derived password through `POST /masuk/password` while live; if that fails, the step is `OWNER` (above). Then PA suspends S, S tries the right password and a wrong one (both through `/masuk/password`), and PA reinstates S | The two answers' status and body | **Both are refused by the route, and they are equal field by field.** S is reinstated. **PIN recovery is skipped (Sharon's ruling, option (c)).** It is decided in the database (`recovery_attempt`), with no hosted Auth step before the PIN check, so it behaves as it does locally, where L-1's tests prove it. And a wrong-PIN attempt would add failures to that account's recovery ladder, which reinstatement does not clear |
| 3.4a | after merge · acts | PA reinstates L (`aktifkan_kembali_akun(L, …)`, 10 to 300 characters, with PA's session) | `select banned_until from auth.users where id = '<L's user>';` and the suspension row's `ended_at` | `banned_until` null, and the suspension ended |
| 3.4b | after merge · acts | `POST /masuk/kartu`: first with L's card and a **wrong** PIN (record the answer: this is 3.3a's comparison), then with the right PIN | The two answers | Wrong PIN refused, with the method's ordinary mismatch. Right PIN signs in. Keep the session's access and refresh tokens for 3.5 and item 6 |
| 3.5 | after merge · acts | PA suspends L again (as 3.1a); then the refresh: `POST <auth>/auth/v1/token?grant_type=refresh_token` with L's refresh token from 3.4b; then PA reinstates L (as 3.4a) | The refresh's answer | **Refused, with no new session.** The `error_code` is `user_banned` or `refresh_token_not_found`: the suspension itself ends L's sessions (`akun_kunci` deletes them), so Auth may find no token left to call banned. Run locally, it was `refresh_token_not_found`; the record says which. A refresh that succeeds is a material discrepancy |

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

**4b and 4c · the synthetic people removed by the product's own path** (after merge · acts · the workflow). The Admin
API is never used: it would bypass what item 4 must prove.
- **Found in the local test:** `hapus_data_pribadi` rewrites and deletes Auth's rows **only for an `EMAIL` account**,
  because a class card's address is the card's, not the person's. So L's deletion (4b) anonymises L but writes nothing
  in `auth`.
- **So 4c adds E**, a synthetic person with an email account on the staging test mailbox
  (`goldenschool+cp41-<run>@pintarselalu.com`):
  - PA records E through `POST /api/akun/aktivasi` (`NEW_PERSON`, the «Orang baru di luar pendataan» path);
  - E signs in as the walks sign in (the emailed code), asks for deletion and closes the account;
  - PA deletes E's personal data.

  That runs every `auth` write of item 4.

| # | Who · the product's path | Exact check | Passes when |
|---|---|---|---|
| 4b.1 | SA ends L's enrolment (`akhiri_pendaftaran`). A learner enrolled through a school cannot close their own account (`ACCOUNT_LEARNER_VIA_SCHOOL`) | `select status, end_reason from public.enrollments where person_id = 'L';` | Ended |
| 4b.2 | L, signed in by card: `/akun`, request deletion of personal data (`minta_akun('DELETE_PERSONAL_DATA', true)`), then close the account (`minta_akun('CLOSE', true)`) | `select kind, status from public.account_requests where person_id = 'L' order by created_at;` and `banned_until` | One `DELETE_PERSONAL_DATA` request `RECEIVED`, one `CLOSE` `DONE`, an open `CLOSED_AT_REQUEST` suspension; locked |
| 4b.3 | PA deletes L's personal data (`POST /api/akun/hapus-data`: `hapus_data_pribadi(<the request>, …)`) | `select anonymized_at, photo_path, display_name from public.persons where id = 'L';` and L's `banned_until` | The call succeeds. `anonymized_at` is set, there is no photo, the name is replaced, and the card account is still locked |
| 4b.4 | reads | `akun_keadaan('L')` with PA's session | Closed and anonymised. L stays terminal (L1-F4), recorded in §4 |
| 4c.0 | PA records E (`POST /api/akun/aktivasi`, `NEW_PERSON`, in «Seluruh platform»); E signs in | `select a.person_id, a.kind from public.accounts a join auth.users u on u.id = a.auth_user_id where lower(u.email) = '<E's address>';` | One `EMAIL` account; E signed in |
| 4c.1 | E calls `minta_akun('DELETE_PERSONAL_DATA', true)`, then `minta_akun('CLOSE', true)`, with E's own session | E's `banned_until` | Locked at the lock instant |
| 4c.2 | PA deletes E's personal data (`POST /api/akun/hapus-data`) | Before: `select count(*) from auth.audit_log_entries where payload::text ilike '%<E's address>%';`. After: the same count; `select email from auth.users where id = '<E's user>';`; `select count(*) from auth.identities where user_id = '<E's user>' and coalesce(identity_data ->> 'email', '') not like 'anonim-%';`; and the counts of `auth.sessions`, `auth.refresh_tokens` and `auth.one_time_tokens` | The call succeeds. E is anonymised, with the email `anonim-<user>@pintar.invalid`. No identity keeps the address, Auth's audit entries naming it go from N to 0, and the three counts read `0 0 0`. **Any refusal by the hosted project of one of these writes is a material discrepancy** (Sharon's second addition) |
| 4c.3 | reads | `akun_keadaan('E')` with PA's session | Closed and anonymised; E stays terminal |

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
| 6a | after merge · reads (the workflow, step 6a) | `select at, kind, method, outcome, network_origin from public.accountability_events where person_id = 'L' order by at;` | L's card sign-in at 3.4b has `network_origin` filled, in the `/24` (IPv4) or `/48` (IPv6) form |
| 6b | **before merge (read-only, B3)** and after merge · reads · the Chief Architect | The hook timed in the database, 200 calls, in one `select` (below) | **Gate (Sharon): p95 ≤ 1 ms with no window active, both before and after; and after ≤ before + 0.5 ms.** The hook's cost with a window active is A2a's to measure, against the same figure, in its own acceptance |
| 6c | after merge · reads (the workflow, step 6c, as L, who is live after 3.5 and before 4b) | 50 authenticated reads of one cheap endpoint, `POST <staging's Supabase URL>/rest/v1/rpc/pintar_status_saya`, with L's access token, each timed; p50 and p95 | **Recorded, not gated** (Sharon): the network dominates it |

**6b's statement: one `select`.** The Chief Architect's database tool reads a result, not a `do` block's notice. It
writes nothing, so it can run in a read-only transaction before the merge (Sharon: accepted). It times 200 calls of the
hook on the path an authenticated request takes:
- the claims are an authenticated role and a subject that matches no one;
- the path is an ordinary RPC, so the maintenance read runs.

Both settings are local to the statement's own transaction. Each call is timed between two clock readings, and the
first interval, which holds the set-up, is left out.
```sql
with recursive r(i, t) as (
  select 0, clock_timestamp()
    from (select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000041"}', true),
                 set_config('request.path', '/rpc/konteks_saya', true)) c
  union all
  select r.i + 1, (select clock_timestamp() + count(h.v::text) * interval '0'
                     from (select pintar_permintaan.periksa() as v) h where r.i >= 0)
    from r where r.i < 201
), d as (
  select i, extract(epoch from t - lag(t) over (order by i)) * 1000 as ms from r
)
select count(ms) as calls,
       round((percentile_cont(0.5) within group (order by ms))::numeric, 4) as p50_ms,
       round((percentile_cont(0.95) within group (order by ms))::numeric, 4) as p95_ms
  from d where i > 1;
```
- **Run locally at 244, three times** (calls, p50 ms, p95 ms): `200 | 0.0370 | 0.0400`, `200 | 0.0370 | 0.0411` and
  `200 | 0.0370 | 0.0430`. The same statement with anon claims gives p50 0.002 ms, which is the hook's early return.
- *(Superseded, kept: the earlier `do` block with anon claims. Its 0.004 ms was that early return.)*
- **Why it is written this way.** Postgres runs an uncorrelated subquery once, and drops a stable call whose result is
  unused. Either way it times nothing, and both showed up locally as all-zero readings. So:
  - the call is tied to each row (`where r.i >= 0`);
  - its result is consumed (`count(h.v::text)`).

**Does `perf-staging.yml` do this?** No.
- Its modes are `probe`, `region`, `journey` and `sessions30`. They time pages, a journey's steps and 30 sessions'
  clicks.
- None times one endpoint N times with p50 and p95, and none isolates the hook.
- So 6b and 6c are done by hand, as above.

**On the runbook's "before merge" list:** Sharon accepts 6b before the merge as read-only (her ruling 2(a)).
*(Superseded, kept: "proposed here, and it runs only if Sharon and the Chief Architect accept it".)*

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
| 3 | **S** (an existing account, not created): one `person_suspensions` row, ended at once; its sessions, ended by the suspension; `accountability_events` for its three sign-ins; `audit_log` rows for the suspension and reinstatement. **L:** L's `persons` row and its `person_usernames` row if the import gives one; the import job and its rows; L's enrolment; 2 `person_suspensions` (3.1a and 3.5), each ended; `account_activation_grants` for the card and its reissue; one `accounts` row; one `auth.users` row, its `auth.identities` row, and Auth's own `auth.audit_log_entries`, `auth.sessions` and `auth.refresh_tokens` for L's sign-in; `password_write_permits` (transient, consumed); `accountability_events` for each sign-in attempt and outcome (3.3a, 3.4b, and SA's and PA's own sign-ins); `audit_log` rows for the import, suspension, activation, reissue and reinstatements |
| 4 | **L:** `account_requests` (`DELETE_PERSONAL_DATA`, `CLOSE`); one `CLOSED_AT_REQUEST` suspension; the enrolment ended; L's person anonymised; `audit_log` rows. **E:** one `persons` row; one `accounts` row (`EMAIL`); one `auth.users` row and its identity; Auth's own audit entries and sessions for E's sign-in (the emailed code: one email to the staging test mailbox); E's two `account_requests`; one `CLOSED_AT_REQUEST` suspension; then E's anonymisation (person, user, identities, Auth's audit entries) and the deletion of E's sessions and tokens; `audit_log` rows. **L and E stay, anonymised and terminal** |
| 5 | None on staging (the copy is on the runner and discarded) |
| 6 | None beyond item 3's sign-in (reads only) |
| — | **The workflow's own record:** the artifact `staging-checkpoint-41`, kept 90 days on GitHub, not on staging |
| — | **The scheduled jobs' own effect** (not the checkpoint's act, A1's design): `pintar-pengerjaan-tutup-terjadwal` closes sittings still open after their deadline. Preservation line 70 counts the open sittings at B1, and line 72 the ones the job closed. Each must be among line 70's |

## 5 · Sharon's two required lines, and her rulings on the open points

**Required line 1 · the database and the app go back together.**
- The rollback returns staging's **database** to 224. Staging's app is deployed from `main`, so a 244 app on a 224
  database calls functions that no longer exist.
- So a rollback is **paired with reverting the merge on `main`** (the app back to 224's commit), in this order:
  1. revert the merge on `main`, so the app redeploys at 224's commit, and wait for that deploy;
  2. then run `ROLLBACK-225-244.sql`.

  For the minutes between the two, a 224 app runs on a 244 database. That is the mirror image of the window every 4.0
  promotion had.
- **Both are the owner's to decide.** Neither runs on anyone else's word.

**Required line 2 · what a rollback re-opens.** Under 224's code, these protections are gone:
- **L1-F4:** an anonymised person can be reopened again (L1F4-A2). That includes the checkpoint's own L and E.
- **L1-F2:** a suspended person's new account is created open.
- **L1-R2:** password-write permits are not deleted when an account is locked.

So, while a rollback stands, **nobody on staging approves a reopen, or creates an account for a suspended or
anonymised person, until 244 is applied again.** The same two lines are in the rollback file's header.

**The open points, ruled** (`CHECKPOINT-EVIDENCE-d8db82bd….md`; runbook §3c):
1. **Password sign-in on a locked account: option (a), as 3.3b now runs it. PIN recovery: option (c), skipped,** with
   Sharon's reason (3.3b).
2. **D1's budget:** 6b is accepted before the merge, read-only. **The gate: p95 ≤ 1 ms with no window active, both
   before and after, and after ≤ before + 0.5 ms.** 6c is recorded, not gated.
3. **`banned_until` kept in the rollback: accepted.**
4. **The rewrite timed on the copy: confirmed.**

*(Superseded where they stood: the open points as first asked, kept below.)*

<details><summary>The open points as first asked (superseded by the rulings above)</summary>

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


</details>

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
- 6b's gate fails: p95 above 1 ms, or after more than before + 0.5 ms;
- the workflow stops at any step (`DIFFERS` in its record). `OWNER` at 3.3b is not a stop: it goes to the owner.

**On any of them:** stop, record it in the runbook and in `STATUS-2026-11-12.md`, and hold. Nothing is repaired on
staging without the owner.

## 7 · What the boundary commit changes

**No migration, table or column.** The rollback file is never applied by anything (its header). The evidence:
- this page;
- the rollback file and its test record;
- the preservation query;
- the first runs' counts (`evidence/staging/first-runs.sql`).

**Two code changes.** Each runs only when dispatched, from `main`:
- **The restore rehearsal's extension** (`8f27ff256d27cf98a97e7a849c85597de59805c0`): `restore-rehearsal.yml` and the
  facts query it reads. It reads staging only, and writes only the copy on its runner:
  - 5b to 5f;
  - the four F lines in `audit/restore/fakta.sql`;
  - the installer twice;
  - the timed rewrite, in a transaction that is rolled back.
- **The checkpoint's acting steps:** `.github/workflows/staging-checkpoint-41.yml` and
  `audit/staging/checkpoint-41.mjs`.
  - It is dispatch only. It refuses any project but staging, as `staging.yml` does, and it refuses to start while
    `staging.yml` runs.
  - It acts only through the product's paths, as the synthetic actors above, and stops at the first difference.
  - It was run end to end against a local stack (`CHECKPOINT_LOCAL=1`, with the seed's synthetic school standing in
    for the Golden School): 25 steps PASS and 2 RECORDED (test record:
    `evidence/checkpoint-41-local-run.txt`).
