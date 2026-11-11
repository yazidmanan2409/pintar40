-- #150 WP-B (D-107 A7, D-108, D-109(a)): pintar_backup's SECURITY PROFILE, as one line per fact, read only.
--
-- The same text on every database where migration 20261125100000 is applied: CI's and the local stack's (where selftest
-- DR-S15 proves the profile by trying every write) and hosted staging's. docs/recovery/pintar-backup-profile.expected
-- is the proven local profile; any line that differs on a hosted database is a stop point (D-109(a)). Only invariants
-- appear here (no counts of platform objects), so a platform's own schemas cannot make two equal profiles differ.
-- Selects only: it can run in a read-only transaction, through Supabase's SQL editor, its connector or psql.
select line from (
  select 1 o, 'attributes|' || format('super=%s inherit=%s createrole=%s createdb=%s login=%s replication=%s bypassrls=%s connlimit=%s validuntil=%s',
         rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolreplication, rolbypassrls, rolconnlimit, coalesce(rolvaliduntil::text, 'none')) line
    from pg_roles where rolname = 'pintar_backup'
  union all
  select 2, 'defaults|' || coalesce((select string_agg(c, ',' order by c) from pg_db_role_setting s, unnest(s.setconfig) c
                                      where s.setrole = (select oid from pg_roles where rolname = 'pintar_backup') and s.setdatabase = 0), 'none')
  union all
  select 3, 'defaults_in_one_database|' || (select count(*) from pg_db_role_setting
                                             where setrole = (select oid from pg_roles where rolname = 'pintar_backup') and setdatabase <> 0)
  union all
  select 4, 'member_of|' || coalesce((select string_agg(g.rolname || format(' admin=%s inherit=%s set=%s', a.admin_option, a.inherit_option, a.set_option), ', ' order by g.rolname)
                                       from pg_auth_members a join pg_roles g on g.oid = a.roleid
                                      where a.member = (select oid from pg_roles where rolname = 'pintar_backup')), 'nothing')
  union all
  -- who could become it or take its rights (a role holding only ADMIN OPTION can neither)
  select 5, 'become_or_inherit_it|' || coalesce((select string_agg(m.rolname, ', ' order by m.rolname)
                                                   from pg_auth_members a join pg_roles m on m.oid = a.member
                                                  where a.roleid = (select oid from pg_roles where rolname = 'pintar_backup') and (a.inherit_option or a.set_option)), 'nobody')
  union all
  select 6, 'can_set_role_to|' || coalesce((select string_agg(rolname, ', ' order by rolname) from pg_roles
                                             where rolname <> 'pintar_backup' and pg_has_role('pintar_backup', oid, 'SET')), 'nothing')
  union all
  select 7, 'owns|' || ((select count(*) from pg_shdepend where refclassid = 'pg_authid'::regclass and deptype = 'o'
                           and refobjid = (select oid from pg_roles where rolname = 'pintar_backup'))
                        + (select count(*) from pg_database where datdba = (select oid from pg_roles where rolname = 'pintar_backup')))
  union all
  -- a right granted to it by name, anywhere (its only right is its membership)
  select 8, 'named_in_a_grant|' || (select count(*) from pg_shdepend where refclassid = 'pg_authid'::regclass and deptype = 'a'
                                       and refobjid = (select oid from pg_roles where rolname = 'pintar_backup'))
  union all
  select 9, 'creates_in_schema|' || coalesce((select string_agg(nspname, ', ' order by nspname) from pg_namespace
                                               where has_schema_privilege('pintar_backup', oid, 'CREATE')), 'none')
  union all
  select 10, 'database|' || format('create=%s temporary=%s connect=%s', has_database_privilege('pintar_backup', current_database(), 'CREATE'),
         has_database_privilege('pintar_backup', current_database(), 'TEMPORARY'), has_database_privilege('pintar_backup', current_database(), 'CONNECT'))
  union all
  -- pg_settings is every session's own SET, PUBLIC's by PostgreSQL's design
  -- (names schema-qualified by hand: a regclass's text depends on the reader's search_path)
  select 11, 'writes_to|' || coalesce((select string_agg(c.relnamespace::regnamespace::text || '.' || c.relname, ', ' order by 1) from pg_class c
     where c.relkind in ('r', 'p', 'v', 'm', 'f') and c.oid <> 'pg_catalog.pg_settings'::regclass
       -- A1 (owner, Option A), the ONE exception: DELETE on cron.job_run_details. pg_cron grants it to PUBLIC on its own
       -- run log, the table is supabase_admin's, and no PINTAR role can revoke that grant. That table and that privilege
       -- only: any other privilege on it, and DELETE on any other relation (cron.job included), is still a write.
       and (has_table_privilege('pintar_backup', c.oid, 'INSERT') or has_table_privilege('pintar_backup', c.oid, 'UPDATE')
            or (has_table_privilege('pintar_backup', c.oid, 'DELETE') and c.oid is distinct from to_regclass('cron.job_run_details'))
            or has_table_privilege('pintar_backup', c.oid, 'TRUNCATE')
            or has_table_privilege('pintar_backup', c.oid, 'TRIGGER') or has_table_privilege('pintar_backup', c.oid, 'REFERENCES'))), 'nothing')
  union all
  select 12, 'advances_sequences|' || (select count(*) from pg_class c
     where case when c.relkind = 'S' then has_sequence_privilege('pintar_backup', c.oid, 'USAGE') or has_sequence_privilege('pintar_backup', c.oid, 'UPDATE') else false end)
  union all
  -- (selftest is the test harness's own schema, on CI's and local databases only; path-check.mjs shows it absent from a
  -- hosted one, so this exclusion excludes nothing there)
  select 13, 'executes_security_definer|' || coalesce((select string_agg(p.pronamespace::regnamespace::text || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', ', ' order by 1) from pg_proc p
     where p.prosecdef and has_function_privilege('pintar_backup', p.oid, 'EXECUTE') and p.pronamespace <> coalesce(to_regnamespace('selftest'), 0)), 'nothing')
  union all
  select 14, 'executes_pintar_function|' || (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and has_function_privilege('pintar_backup', p.oid, 'EXECUTE'))
  union all
  select 15, 'cannot_read_backup_table|' || (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where c.relkind in ('r', 'p') and n.nspname in ('public', 'auth', 'storage', 'supabase_migrations')
       and not has_table_privilege('pintar_backup', c.oid, 'SELECT'))
  union all
  select 16, 'cannot_use_schema|' || coalesce((select string_agg(nspname, ', ' order by nspname) from pg_namespace
     where nspname in ('public', 'auth', 'storage', 'supabase_migrations') and not has_schema_privilege('pintar_backup', oid, 'USAGE')), 'none')
) x order by o;
