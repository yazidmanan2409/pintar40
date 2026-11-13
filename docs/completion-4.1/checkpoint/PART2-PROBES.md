# Part 2 · five probes, answered (read-only research)

Second Eye, 13 Nov 2026, for the Chief Architect's request of 08:02 UTC. Nothing here was run on staging. Local reads
and one local dry run (answer 5) only. The local Part 2 commit `7f87c7a5d7bc32f8826242682db21a9df2c00fb0` is kept,
unpushed, as reference only.

## 1 · The existing walk that signs synthetic staff in at a `sekolah-uji-` school with the least writing

**No existing walk signs staff in and writes nothing else.** The smallest is the **Batch 5 walk**:
- **Workflow:** `.github/workflows/staging-golden-school-b5.yml`; script `audit/staging/golden-school-b5.mjs`.
- **How it starts:** not `workflow_dispatch`. A push to `claude/awesome-rubin-bqxp6p` that changes
  `.github/staging-golden-school-b5-request.txt`, whose last line is `slug: <slug>`. Today's last line:
  `slug: sekolah-uji-p7b-1107`. It shares the `staging` concurrency group.
- **Inputs:** the slug only; the class is fixed in the script, «Kelas 5A». The script refuses any slug but
  `sekolah-uji-*`.
- **Who signs in:** the school's admin, the Platform Operator, the Dekan and the Guru (`masukStaf`, `masuk.mjs`).
- **What it writes:**
  - each sign-in: Auth's own `auth.sessions`, `auth.refresh_tokens` and `auth.audit_log_entries`; PINTAR's
    sign-in record (`accountability_events`) and `identity.device_declared` in `audit_log`;
  - **if** a derived password no longer opens an account: the «Lupa password?» recovery's rows (listed on
    `PROMOTION-PRECONDITIONS.md` under "A password recovery by the reused sign-in helper");
  - **K1:** one certificate set to `REVOKED` with its reason, and `certificate.revoked` in `audit_log`. **K0 requires
    an `ISSUED` certificate in the school**, and K1 revokes the first one;
  - **K2:** one integrity decision (`record_integrity_review`) **only if** an observation is waiting (none normally);
  - K3 to K5 only read (screens, the database in read-only transactions).
- **Clean-up: none.** The revocation is permanent by design. The walk never signs out, so the four sessions stay open
  until they expire.
- **The lighter walks do not sign staff in:** `kode-ulang-walk.mjs` writes no database row, but it only asks for codes.
  Every other walk writes more (cards, recoveries, structure, packages).

## 2 · The scratch-schema probe: can a `pg_cron` job `CALL` a procedure that commits between batches

As `PROMOTION-PRECONDITIONS.md` 1e to 1g on `main`, with the removal in the corrected order (run details by the job's
name, then the unschedule). It is run as `postgres` on staging's database, the one `pg_cron` runs in.

**The probe (four statements):**
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
select cron.schedule('uji-41-prosedur-komit', '* * * * *', 'call uji_cron_41.dua_kali()');   -- returns the jobid
```
**The read, after the first minute has passed (up to five minutes):**
```sql
select d.status, d.return_message from cron.job_run_details d
 where d.jobid in (select jobid from cron.job where jobname = 'uji-41-prosedur-komit') order by d.start_time;
select n, pada from uji_cron_41.catatan order by n;
```
Holds when the first run is `succeeded` and rows 1 and 2 are both there, row 2's `pada` after row 1's. A
`return_message` naming `COMMIT` or "invalid transaction termination" means it does not hold (D6.6 returns to
Sharon).

**The removal:**
```sql
delete from cron.job_run_details where jobid in (select jobid from cron.job where jobname = 'uji-41-prosedur-komit');
select cron.unschedule(jobid) from cron.job where jobname = 'uji-41-prosedur-komit';
drop schema uji_cron_41 cascade;
```
**The catalogue read that proves removal** (`0 0 0 0`):
```sql
select (select count(*) from cron.job where jobname = 'uji-41-prosedur-komit'),
       (select count(*) from cron.job_run_details d where not exists (select 1 from cron.job j where j.jobid = d.jobid)),
       (select count(*) from pg_namespace where nspname = 'uji_cron_41'),
       (select count(*) from pg_proc where proname = 'dua_kali');
```
- **Run locally** exactly as above: the first run `succeeded`, rows 1 and 2 in order; removal `0 0 0 0`
  (`evidence/checkpoint-41-local-run.txt` on `main`, step 1e onwards).
- **What it does not show:** a run longer than one batch, or the fence inside each batch. Those are A2a's own tests.
- Between the schedule and the removal, the job runs every minute. Its second and later runs do nothing.

## 3 · A2a's accepted design: a committing procedure, `CALL`ed by cron

**`CALL`.** D6.6 makes the closer "a procedure committing per small batch", and its job text changes `select …` →
`call …` (`docs/completion-4.1/batches/A2A-COMPLETION.md:147`). It depends on answer 2 holding (`:218`). A1's closer
today is a function selected by the job.

## 4 · The Auth (GoTrue) version the local L-1 and L1-F2 tests ran against

**GoTrue `v2.196.0`**, image `supabase/gotrue:v2.196.0` (digest `sha256:c0c25187a6b8…`), as pulled by the Supabase
CLI the repository pins (`supabase` `^2.117.0`, `package-lock.json`).
- **How it was read:** live, from the running local stack, `GET http://127.0.0.1:54321/auth/v1/health` →
  `{"version":"v2.196.0","name":"GoTrue",…}`, and `docker ps` shows that image.
- **CI's runs used the same image:** CI's job log of 12 Nov pulls `public.ecr.aws/supabase/gotrue:v2.196.0`.
- **Hosted staging's version** is read the same way: `GET https://<staging ref>.supabase.co/auth/v1/health` with
  staging's public key. Not read here (no staging probe in this assignment).

## 5 · The smallest bounded hosted probe: "a locked account is refused by hosted Auth"

**On one synthetic `sekolah-uji-` staff user**, for example the Guru `goldenschool+<slug>-guru@pintarselalu.com`,
in a runner that holds `GS_MAILBOX_PASSWORD` (the password is derived there, as the walks derive it, and never printed).
A lock is `auth.users.banned_until = public.akun_terkunci_sampai()` (`2999-12-31 23:59:59+00`). It goes straight to
hosted Auth (`/auth/v1/token`, staging's public key); the app is not involved.

**Before (read):**
- `banned_until` is null, and **no open suspension** for the person. Otherwise do not start: `kunci_tetap_jaga`
  forces the lock back while a person is suspended, so the restore would not take.
- The fingerprint below.

**The steps:**
1. Live: `POST /auth/v1/token?grant_type=password` with the right password → **a session.** This proves the
   credential, and is needed: see the finding below. Keep its refresh token and access token.
2. Lock: `update auth.users set banned_until = public.akun_terkunci_sampai() where id = '<user>' and banned_until is null;`
3. Locked, the right password → **`user_banned`, no session.**
4. Locked, a wrong password → recorded (locally: `user_banned` too).
5. Locked, `grant_type=refresh_token` with step 1's refresh token → **`user_banned`, no new session or token.**
6. Restore: `update auth.users set banned_until = null where id = '<user>' and banned_until = public.akun_terkunci_sampai();`
7. Unlocked: `POST /auth/v1/logout?scope=local` with step 1's access token → `204`. Step 1's session is gone.

**What changes:** for a few seconds, the one user's `banned_until`; step 1's session, ended at step 7. Auth's own
`auth.audit_log_entries` (a sign-in and a sign-out) are the only rows left.

**What must be equal before and after**, as one fingerprint read:
```sql
select coalesce(u.banned_until::text, 'null'), md5(coalesce(u.encrypted_password, '')),
       (select count(*) from auth.sessions s where s.user_id = u.id),
       (select count(*) from auth.refresh_tokens r where r.user_id::uuid = u.id and not r.revoked),
       (select count(*) || '/' || count(*) filter (where ended_at is null) from public.person_suspensions where person_id = a.person_id),
       md5(to_jsonb(a)::text),
       (select count(*) from public.audit_log), (select count(*) from public.accountability_events)
  from auth.users u join public.accounts a on a.auth_user_id = u.id where u.id = '<user>';
```
Every column equal, and `auth.audit_log_entries` grown by exactly the probe's entries.

**Dry run, local only, against GoTrue v2.196.0** (the seed's synthetic Guru): exactly as above.
- Step 1 gave a session.
- Steps 3, 4 and 5 gave `user_banned`, with no new session or token.
- Step 7 gave `204`.
- Before and after were equal on every column; `auth.audit_log_entries` grew by 2.

**What it shows, and what it does not:**
- **It shows** that hosted Auth refuses a sign-in and a refresh for a user whose `banned_until` is PINTAR's lock
  value. L-1 and L1-F2 rest on that.
- **Finding:** v2.196.0 checks the ban **before** the password, so it answers `user_banned` to a wrong password as
  well. That is why step 1 must come first. At Auth's level a refusal alone does not prove the credential was right.
  PINTAR's own routes do not pass that answer through (the sign-in routes answer a locked account as a wrong
  password); that equality is the route's, not Auth's, and this probe does not test it.
- **It does not show** the product's own path to the lock (a suspension through `tangguhkan_akun`, which also ends
  sessions), or Auth's admin password write on a locked user (the checkpoint's 3.2). It writes the lock directly.
