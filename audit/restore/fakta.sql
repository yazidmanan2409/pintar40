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
