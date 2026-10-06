-- #150 WP-B (D-106(b), D-107 D6 and A7, closure plan A2): A BACKUP READS EVERYTHING AND WRITES NOTHING.
--
-- The independent database backup needs a credential that can read every row of every table, past row security, so
-- that a dump is complete. Until now only `postgres` could, and its password also writes, creates and grants. This
-- creates the dedicated role `pintar_backup` (C2 in the credential inventory, docs/recovery/CLOSURE-PLAN-150.md):
--   * LOGIN, BYPASSRLS, INHERIT; not a superuser, no CREATEDB, no CREATEROLE, no REPLICATION; at most 3 connections;
--   * a member of pg_read_all_data and nothing else (PostgreSQL's own read-everything role: SELECT on every table,
--     view and sequence, USAGE on every schema; no EXECUTE, no write of any kind);
--   * read-only by default, with statement, lock and idle timeouts that end forgotten sessions;
--   * owner of nothing, and given no other right.
-- It is created WITHOUT a password, so nobody can sign in as it until the owner's password is set by
-- .github/workflows/backup-credential.yml, which sends only a SCRAM-SHA-256 verifier. Revocation is NOLOGIN by the same
-- workflow. Nothing in the application or its runtime ever holds it.
--
-- A7, stated plainly: pg_read_all_data with BYPASSRLS reads across every school. A compromise of this credential
-- could expose the complete database, although it cannot modify it. selftest DR-S15 proves both halves.
--
-- Measured before writing this (local stack and, read only, staging's catalog): a dump made with exactly this profile
-- is byte-identical to one made with `postgres`; no SECURITY DEFINER function is executable by PUBLIC; PUBLIC creates
-- in no schema and not in the database; the one relation PUBLIC may update is pg_catalog.pg_settings (a session's own
-- SET). The timeouts are defaults: PostgreSQL lets any session change its own (pg_dump sets them to 0 for its run), so
-- they bound forgotten sessions, not a determined one; the connection limit is enforced by the server.
--
-- Idempotent on the role, because roles outlive a database reset: an existing pintar_backup is brought to exactly
-- this profile, and the assertions below refuse it if it holds anything more.

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'pintar_backup') then
    create role pintar_backup;
  end if;
end $$;

-- SUPERUSER and REPLICATION are not named: only a superuser may name them, and a new role has neither (asserted below)
alter role pintar_backup with login inherit bypassrls nocreatedb nocreaterole connection limit 3;

grant pg_read_all_data to pintar_backup;

alter role pintar_backup set default_transaction_read_only = on;
alter role pintar_backup set statement_timeout = '15min';
alter role pintar_backup set lock_timeout = '30s';
alter role pintar_backup set idle_in_transaction_session_timeout = '15min';
alter role pintar_backup set idle_session_timeout = '15min';

-- ───────────────────────────────────────────────────────────── assertions (ADR-0014)
do $$
declare
  r record;
  v_n bigint;
  v_txt text;
begin
  select * into r from pg_roles where rolname = 'pintar_backup';
  if not (r.rolcanlogin and r.rolbypassrls and r.rolinherit) or r.rolsuper or r.rolcreatedb or r.rolcreaterole
     or r.rolreplication or r.rolconnlimit <> 3 then
    raise exception '#150: pintar_backup is not LOGIN, BYPASSRLS, INHERIT, unprivileged otherwise, with 3 connections';
  end if;

  -- a member of pg_read_all_data alone, without the right to pass it on
  select string_agg(g.rolname || case when a.admin_option then ' (admin)' else '' end, ', ' order by g.rolname) into v_txt
    from pg_auth_members a join pg_roles g on g.oid = a.roleid where a.member = 'pintar_backup'::regrole;
  if v_txt is distinct from 'pg_read_all_data' then
    raise exception '#150: pintar_backup belongs to %, not to pg_read_all_data alone', coalesce(v_txt, 'nothing');
  end if;
  -- nobody can become it or inherit its rights
  if exists (select 1 from pg_auth_members a where a.roleid = 'pintar_backup'::regrole and (a.inherit_option or a.set_option)) then
    raise exception '#150: another role can become pintar_backup or inherits its rights';
  end if;

  -- read-only by default, and the timeouts
  select string_agg(c, ',' order by c) into v_txt
    from pg_db_role_setting s, unnest(s.setconfig) c where s.setrole = 'pintar_backup'::regrole and s.setdatabase = 0;
  if v_txt is distinct from 'default_transaction_read_only=on,idle_in_transaction_session_timeout=15min,idle_session_timeout=15min,lock_timeout=30s,statement_timeout=15min' then
    raise exception '#150: pintar_backup''s defaults are %', coalesce(v_txt, 'none');
  end if;

  -- owns nothing
  select (select count(*) from pg_class where relowner = 'pintar_backup'::regrole)
       + (select count(*) from pg_proc where proowner = 'pintar_backup'::regrole)
       + (select count(*) from pg_namespace where nspowner = 'pintar_backup'::regrole)
       + (select count(*) from pg_type where typowner = 'pintar_backup'::regrole)
       + (select count(*) from pg_database where datdba = 'pintar_backup'::regrole) into v_n;
  if v_n > 0 then raise exception '#150: pintar_backup owns % object(s)', v_n; end if;

  -- creates nothing
  select string_agg(nspname, ', ') into v_txt from pg_namespace where has_schema_privilege('pintar_backup', oid, 'CREATE');
  if v_txt is not null then raise exception '#150: pintar_backup may create in schema(s) %', v_txt; end if;
  if has_database_privilege('pintar_backup', current_database(), 'CREATE') then
    raise exception '#150: pintar_backup may create schemas in the database';
  end if;

  -- writes nothing (pg_settings is every session's own SET, PUBLIC's by PostgreSQL's design)
  select string_agg(c.oid::regclass::text, ', ') into v_txt
    from pg_class c
   where c.relkind in ('r', 'p', 'v', 'm', 'f') and c.oid <> 'pg_catalog.pg_settings'::regclass
     and (has_table_privilege('pintar_backup', c.oid, 'INSERT') or has_table_privilege('pintar_backup', c.oid, 'UPDATE')
          or has_table_privilege('pintar_backup', c.oid, 'DELETE') or has_table_privilege('pintar_backup', c.oid, 'TRUNCATE')
          or has_table_privilege('pintar_backup', c.oid, 'TRIGGER') or has_table_privilege('pintar_backup', c.oid, 'REFERENCES'));
  if v_txt is not null then raise exception '#150: pintar_backup may write to %', v_txt; end if;
  select count(*) into v_n from pg_class c
   where case when c.relkind = 'S' then has_sequence_privilege('pintar_backup', c.oid, 'USAGE') or has_sequence_privilege('pintar_backup', c.oid, 'UPDATE') else false end;
  if v_n > 0 then raise exception '#150: pintar_backup may advance % sequence(s)', v_n; end if;

  -- runs no function with another role's rights
  select string_agg(p.oid::regprocedure::text, ', ') into v_txt
    from pg_proc p where p.prosecdef and has_function_privilege('pintar_backup', p.oid, 'EXECUTE');
  if v_txt is not null then raise exception '#150: pintar_backup may execute SECURITY DEFINER function(s) %', v_txt; end if;

  -- and reads everything a complete backup reads
  select count(*) into v_n from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where c.relkind in ('r', 'p') and n.nspname in ('public', 'auth', 'storage', 'supabase_migrations')
     and not has_table_privilege('pintar_backup', c.oid, 'SELECT');
  if v_n > 0 then raise exception '#150: pintar_backup cannot read % table(s) a backup needs', v_n; end if;
end $$;
