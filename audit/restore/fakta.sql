-- #150, the restore rehearsal: what a database holds, as counts and content hashes only (never a value).
-- Runs READ ONLY (no temporary table: a read-only transaction may not create one), on staging and on the restored copy
-- alike, so the two outputs can be compared line by line:   psql -At -F '|' -f fakta.sql "$DB"
--   T|<schema.table>|<rows>|<md5 of every row's text, in order>
--   F|<fact>|<value>                       what PINTAR keeps outside its own tables (triggers, role settings, grants)
set timezone = 'UTC';
set datestyle = 'ISO, YMD';
set intervalstyle = 'postgres';
set extra_float_digits = 1;
select 'T', format('%I.%I', t.table_schema, t.table_name),
       (xpath('/row/n/text()', x))[1]::text, (xpath('/row/h/text()', x))[1]::text
  from information_schema.tables t
  cross join lateral query_to_xml(format(
    'select count(*) as n, md5(coalesce(string_agg(r::text, %L order by r::text), %L)) as h from %I.%I r',
    '|', '', t.table_schema, t.table_name), false, true, '') x
 where t.table_type = 'BASE TABLE'
   and t.table_schema in ('public', 'auth', 'storage', 'telemetry', 'supabase_migrations')
 order by 2;
select 'F', 'auth.users triggers',
       coalesce((select string_agg(tgname, ',' order by tgname) from pg_trigger
                  where tgrelid = to_regclass('auth.users') and not tgisinternal), '-');
-- 4.1 checkpoint (Sharon's condition 2): what B1, L-1, L1-F2 and L1-F4 add, by name and definition hash, so a copy that
-- reproduces any of them differently is seen: the definitions of the triggers on auth.users (not only their names), the
-- account-link lock on public.accounts, L1-F4's guards, and the scheduled jobs (names, schedules, commands, role, active;
-- never a job id, which a reinstall changes). The accountability tables are compared as tables (T lines) above.
select 'F', 'auth.users triggers (definitions md5)',
       coalesce((select count(*) || ' ' || md5(string_agg(pg_get_triggerdef(oid), '|' order by tgname)) from pg_trigger
                  where tgrelid = to_regclass('auth.users') and not tgisinternal), '-');
select 'F', 'accounts link lock (L1-F2)',
       coalesce((select md5(pg_get_triggerdef(oid)) from pg_trigger
                  where tgrelid = to_regclass('public.accounts') and tgname = '_l1f2_accounts_terkunci'), '-');
select 'F', 'L1-F4 guards (count, definitions md5)',
       coalesce((select count(*) || ' ' || md5(string_agg(pg_get_triggerdef(g.oid), '|' order by g.tgname)) from pg_trigger g
                  where g.tgname like '\_l1f4\_%' and not g.tgisinternal), '-');
select 'F', 'scheduled jobs (pintar-*)',
       case when to_regclass('cron.job') is null then '-'
            else (xpath('/row/j/text()', query_to_xml(
                   'select coalesce(string_agg(jobname || '' '' || schedule || '' '' || command || '' '' || username || '' '' || active, '' ; '' order by jobname), ''none'') as j
                      from cron.job where jobname like ''pintar-%''', false, true, '')))[1]::text end;
select 'F', 'authenticator pre-request',
       coalesce((select string_agg(c, ',' order by c) from pg_roles r, unnest(r.rolconfig) c
                  where r.rolname = 'authenticator' and c like 'pgrst.db_pre_request%'), '-');
select 'F', 'pintar_permintaan functions',
       (select count(*)::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'pintar_permintaan');
select 'F', 'public functions (definitions md5)',
       (select count(*) || ' ' || md5(coalesce(string_agg(pg_get_functiondef(p.oid), '|' order by p.oid::regprocedure::text), ''))
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.prokind in ('f', 'p'));
select 'F', 'public function grants (md5)',
       (select md5(coalesce(string_agg(p.oid::regprocedure::text || '=' || coalesce(p.proacl::text, '-'), '|' order by p.oid::regprocedure::text), ''))
          from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public');
select 'F', 'policies (md5)',
       (select count(*) || ' ' || md5(coalesce(string_agg(concat_ws(':', schemaname, tablename, policyname, cmd, roles::text, qual, with_check), '|'
          order by schemaname, tablename, policyname), '')) from pg_policies where schemaname in ('public', 'storage'));
select 'F', 'public triggers (md5)',
       (select count(*) || ' ' || md5(coalesce(string_agg(pg_get_triggerdef(g.oid), '|' order by pg_get_triggerdef(g.oid)), ''))
          from pg_trigger g join pg_class c on c.oid = g.tgrelid join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and not g.tgisinternal);
select 'F', 'tables without RLS in public',
       (select count(*)::text from pg_tables where schemaname = 'public' and not rowsecurity);
select 'F', 'extensions', (select string_agg(extname, ',' order by extname) from pg_extension);
select 'F', 'storage objects (metadata rows, bytes)',
       coalesce((select count(*) || ' ' || coalesce(sum((metadata ->> 'size')::bigint), 0) from storage.objects), '-');
-- per function (name only): its definition's hash, owner, and who may execute it (anon, authenticated, PUBLIC)
select 'P', p.oid::regprocedure::text, md5(pg_get_functiondef(p.oid)),
       pg_get_userbyid(p.proowner),
       has_function_privilege('anon', p.oid, 'execute')::text || '/' || has_function_privilege('authenticated', p.oid, 'execute')::text || '/' ||
       exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0 and a.privilege_type = 'EXECUTE')::text
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname in ('public', 'pintar_permintaan') and p.prokind in ('f', 'p')
 order by 2;
-- per table (name only): what anon and authenticated may do to it (select/insert/update/delete)
select 'G', format('%I.%I', n.nspname, c.relname),
       (select string_agg(r || ':' || has_table_privilege(r, c.oid, 'SELECT')::text || has_table_privilege(r, c.oid, 'INSERT')::text
                          || has_table_privilege(r, c.oid, 'UPDATE')::text || has_table_privilege(r, c.oid, 'DELETE')::text, ' ' order by r)
          from unnest(array['anon', 'authenticated']) r)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p')
 order by 2;
