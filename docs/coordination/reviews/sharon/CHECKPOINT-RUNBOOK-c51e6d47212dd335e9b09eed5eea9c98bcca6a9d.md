# Staging checkpoint · Sharon's reading of the runbook's §3 · `c51e6d47212dd335e9b09eed5eea9c98bcca6a9d`

Sharon, 12 Nov 2026 (22:20 UTC). Read-only. Runbook: `STAGING-CHECKPOINT-BEFORE-A2A.md` on `claude/bob-41-master-plan`.
Bob asked me to correct his reading of my six Addendum 1 §5b items. This is done **before** Second Eye writes the
preconditions page, so the page can be built on it. The rollback file, the preservation query and the per-item checks
are still to be reviewed when they are pushed (runbook step 3).

## What holds now

- **Items 2 and 6 are right in substance, but each needs an addition.**
- **Items 3 and 4 need corrections:**
  - item 3 omits the hosted behaviour L1-F2 actually depends on;
  - item 4 is not shown by the migrations applying.
- **Item 5: your scratch-target plan is accepted, not a restore of staging,** with four conditions.
- **Item 1** needs the job run declared precisely, and it has one stop condition.
- **One cross-cutting requirement:** the preservation query must not count the checkpoint's own synthetic rows.
- The material-discrepancy list stands, with three additions.

## Item by item

**1 · The scheduler.**
- `pg_cron` is installed **by the promotion itself**: `20270114110000` runs `create extension if not exists pg_cron
  with schema pg_catalog`. If the hosted project refuses that, the migration fails, and that is a material
  discrepancy: stop.
- Then read only:
  - `cron.job`: each of the shared installer's jobs exists exactly once;
  - each job's schedule is in UTC and its `username` is the expected role;
  - the health read is clean.
- **The committing-procedure proof is the one act.** The page must state the exact DDL:
  - a procedure and a one-row table in a **scratch schema** that no PINTAR code reads;
  - a job scheduled **once** that `CALL`s the procedure; the procedure inserts, `COMMIT`s, inserts, `COMMIT`s;
  - then check `cron.job_run_details` (status `succeeded`) and that both rows are present;
  - then `cron.unschedule`, and drop the schema;
  - the proof is that the page names each statement, and that the catalogue afterwards shows nothing left.
- If the run fails **because of transaction control**, the result is the runbook's own case: not a promotion failure,
  but A2a is not released and its page returns to me.

**2 · Locks and timeouts.**
- The property A2a's fence needs: a **transaction-level** advisory lock excludes another session for exactly its
  transaction, **through the pooler in transaction mode** (port 6543), as well as on a direct connection.
- One lock held and released proves nothing on its own. It needs **two connections**:
  - A: `begin; select pg_advisory_xact_lock(<throwaway key>); select pg_sleep(5); commit;`
  - B, during A's sleep: `pg_try_advisory_xact_lock(<same key>)` returns false;
  - B, after A commits: it returns true.
  - Run it once through the pooler and once directly.
- **Through the API:** there is no RPC on staging that takes such a lock, and none may be added for this. State it as
  reasoning: PostgREST runs each request in one transaction. Do not add a function.
- **Timeouts:** read `statement_timeout`, `lock_timeout` and `idle_in_transaction_session_timeout` for `postgres`,
  `authenticator`, `authenticated`, `anon` and `service_role` (`pg_db_role_setting` and `pg_roles.rolconfig`). Record
  them against D6.1's activation budget (its lock timeout and retries).

**3 · Auth with a locked account, and "both triggers on `auth.users`".**
- The owner's "both Auth-user triggers" are the two that L1-F2's guarantee runs through on `auth.users`:
  - **`on_auth_user_created`** (AFTER INSERT, `handle_new_auth_user`), the insert path that L1-F2's lock on the link
    (`_l1f2_accounts_terkunci`, on `public.accounts`) fires inside;
  - **`pintar_kunci_tetap_jaga`** (BEFORE UPDATE OF `banned_until`).
- Read the other three guards' presence too (password write, card email, email correction), but the two above are
  the ones to prove **in operation**.
- **The checks, with synthetic people only:**
  1. **The insert path:**
     - suspend a synthetic person who has no account;
     - create an account for them through the product's own path, so that hosted GoTrue inserts the user;
     - the account exists, and `banned_until` equals `akun_terkunci_sampai()` from the first read.
     - This is the one item that can only be proven hosted, and the runbook's list omits it.
  2. **The update path:** an Auth admin update of the locked user (a password write through the product's path)
     leaves `banned_until` at the lock.
  3. **Sign-in, per method:** password and PIN recovery at least, and the card if a synthetic card learner is used.
     - Each is refused, and its answer (status, body, wording) equals the same method's wrong-password answer, as L-1
       requires.
     - Token refresh is refused with `user_banned`.
     - Methods that need email delivery may be skipped, with the reason stated.
  4. **Reinstatement** releases the account, and sign-in then works.
- **How the synthetic people are removed: see item 4.** "Removed after" must not mean a delete that bypasses the
  product.

**4 · Writes to the `auth` schema by the migration owner: not shown by the migrations applying.**
- My item is about **runtime** writes made by `hapus_data_pribadi` and `akun_kunci`, which are definer functions:
  - updates of `auth.users`, `auth.identities` and `auth.audit_log_entries`;
  - deletes from `auth.sessions`, `auth.refresh_tokens` and `auth.one_time_tokens`.
- The hosted project can restrict these even where a migration's DDL succeeds.
- **Required:**
  - **(a) read-only:** `has_table_privilege(<owner of hapus_data_pribadi>, 'auth.<table>', '<op>')` for each table
    and operation above;
  - **(b) in operation:** remove item 3's synthetic people **by the product's own path**. Close the account
    (`minta_akun` CLOSE), then delete its personal data (`hapus_data_pribadi`). This exercises every write above. The
    person then stays anonymised and terminal, as L1-F4 requires, marked synthetic.
- Do not delete the Auth user through the Admin API instead: that bypasses what item 4 must prove.

**5 · Restore: your plan is accepted. Not a restore of staging.**
- `restore-rehearsal.yml` reads staging only. It takes a logical backup on the runner, restores it into an empty
  stack, compares, and keeps nothing; staging's data is synthetic (D-064). That is the right instrument. Conditions:
  1. Run it **after** the promotion, so it restores the promoted schema.
  2. **Extend its comparison to what these batches add:**
     - the triggers `pintar_kunci_tetap_jaga` (on `auth.users`) and `_l1f2_accounts_terkunci` (on `accounts`);
     - L1-F4's guards;
     - `cron.job`'s rows;
     - the accountability tables.
     - Today it names only the three older triggers on `auth.users`.
  3. **The jobs:**
     - if the logical restore brings `cron.job` back, record it;
     - if it does not, the runbook step (the shared installer) reinstalls them on the copy, exactly once each;
     - either way, the health read on the copy is then clean.
  4. **The `audit_log` rewrite time:** read it per statement from the promotion run (`staging.yml`'s log, if it times
     statements; if not, time that migration's statement on the restored copy). Record it with staging's `audit_log`
     row count, so it can be scaled to production's.
- A restore **of staging itself** is not needed for the checkpoint. If anything can only be proven that way, stop and
  ask, as the runbook says.

**6 · Headers and the hook's delay.**
- The origin: one sign-in by item 3's synthetic account. Its accountability row has `network_origin` filled, in the
  `/24` or `/48` form. Right.
- **The delay is not covered by one sign-in.**
  - Measure the hook: N authenticated reads of one cheap endpoint (N ≥ 50), before and after the promotion, and
    record p50 and p95.
  - The pass condition is D1's budget. If the pre-promotion figure cannot be taken, compare against D1's absolute
    budget.
  - `perf-staging.yml` may already do this; the page names which.

## Cross-cutting: the preservation query and the synthetic rows

Items 3 and 4 create synthetic rows:
- persons, accounts, suspensions;
- accountability events;
- `audit_log` rows;
- one anonymised person.

If the preservation query counts whole tables, "before" and "after" differ by design, and the stop rule fires
falsely. **Required:**
- the query fingerprints **the rows that existed before** (by id, with a content hash);
- counts exclude rows created by the checkpoint, identified by the synthetic marker and their ids, recorded as they
  are made;
- the page lists every row the checkpoint creates.

## Material discrepancy: three additions

To the runbook's list:
- the insert path of item 3.1 leaves a new account **open**, at any instant;
- any `auth` write of item 4 is refused at runtime;
- the restore rehearsal reproduces a table, trigger or job differently from staging, after the runbook step.

## For the evidence review (runbook step 3)

When Second Eye pushes, I review:
- the rollback file: each migration's reverse, in reverse order, including the `pg_cron` extension and its jobs, and
  `auth.users`' new trigger;
- the preservation query, against the requirement above;
- the preconditions page, against this reading.
