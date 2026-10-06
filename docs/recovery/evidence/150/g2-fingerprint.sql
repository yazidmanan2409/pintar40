-- #150 G2: one read-only statement that fingerprints a PINTAR database as counts, hashes and names only (never a
-- value), for comparing a native "Restore to a New Project" copy with staging through the Supabase connector, which
-- runs one statement at a time. The same facts as audit/restore/fakta.sql (whose T lines it reproduces exactly), plus
-- the security and identity facts G2 is asked for. Run it unchanged on both projects and compare the two JSON objects.
with
tabellen as (
  select format('%I.%I', t.table_schema, t.table_name) as t,
         (xpath('/row/n/text()', x))[1]::text as n, (xpath('/row/h/text()', x))[1]::text as h
    from information_schema.tables t
    cross join lateral query_to_xml(format(
      'select count(*) as n, md5(coalesce(string_agg(r::text, %L order by r::text), %L)) as h from %I.%I r',
      '|', '', t.table_schema, t.table_name), false, true, '') x
   where t.table_type = 'BASE TABLE'
     and t.table_schema in ('public', 'auth', 'storage', 'telemetry', 'supabase_migrations')),
fungsi as (
  select p.oid::regprocedure::text as f, md5(pg_get_functiondef(p.oid)) as d, pg_get_userbyid(p.proowner) as o, p.prosecdef as sd,
         has_function_privilege('anon', p.oid, 'execute')::text || '/' || has_function_privilege('authenticated', p.oid, 'execute')::text || '/' ||
         exists (select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a where a.grantee = 0 and a.privilege_type = 'EXECUTE')::text as x
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname in ('public', 'pintar_permintaan') and p.prokind in ('f', 'p')),
hak as (
  select format('%I.%I', n.nspname, c.relname) as t,
         (select string_agg(r || ':' || has_table_privilege(r, c.oid, 'SELECT')::text || has_table_privilege(r, c.oid, 'INSERT')::text
                            || has_table_privilege(r, c.oid, 'UPDATE')::text || has_table_privilege(r, c.oid, 'DELETE')::text, ' ' order by r)
            from unnest(array['anon', 'authenticated']) r) as g
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'v', 'm', 'p'))
select jsonb_build_object(
  'tables', (select jsonb_object_agg(t, n || ' ' || h) from tabellen),
  'migrations', (select count(*) || ' ' || max(version) from supabase_migrations.schema_migrations),
  'auth_users_triggers', coalesce((select string_agg(tgname || ':' || tgfoid::regprocedure::text || ':' || tgenabled::text, ',' order by tgname)
                                     from pg_trigger where tgrelid = to_regclass('auth.users') and not tgisinternal), '-'),
  'pre_request', coalesce((select string_agg(c, ',' order by c) from pg_roles r, unnest(r.rolconfig) c
                            where r.rolname = 'authenticator' and c like 'pgrst.db_pre_request%'), '-'),
  'functions', (select count(*) from fungsi),
  'functions_definitions_md5', (select md5(string_agg(f || '=' || d, '|' order by f)) from fungsi),
  'functions_owners_md5', (select md5(string_agg(f || '=' || o, '|' order by f)) from fungsi),
  'functions_owners', (select string_agg(distinct o, ',') from fungsi),
  'functions_execute_md5', (select md5(string_agg(f || '=' || x, '|' order by f)) from fungsi),
  'functions_execute_counts', (select jsonb_build_object('anon', count(*) filter (where x like 'true/%'),
                                 'authenticated', count(*) filter (where x like '%/true/%'),
                                 'public', count(*) filter (where x like '%/true')) from fungsi),
  'security_definer', (select count(*) || ' ' || md5(coalesce(string_agg(f, '|' order by f), '')) from fungsi where sd),
  'function_acl_md5', (select md5(coalesce(string_agg(p.oid::regprocedure::text || '=' || coalesce(p.proacl::text, '-'), '|'
                                  order by p.oid::regprocedure::text), ''))
                         from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'),
  'table_rights', (select count(*) || ' ' || md5(string_agg(t || '=' || g, '|' order by t)) from hak),
  'table_rights_anon_any', (select count(*) from hak where g ~ 'anon:[a-z]*true'),
  'table_acl_md5', (select md5(coalesce(string_agg(c.oid::regclass::text || '=' || coalesce(c.relacl::text, '-'), '|' order by c.oid::regclass::text), ''))
                      from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','v','m','p','S')),
  'relation_owners', (select string_agg(distinct pg_get_userbyid(c.relowner), ',') from pg_class c join pg_namespace n on n.oid = c.relnamespace
                       where n.nspname = 'public' and c.relkind in ('r','v','m','p','S')),
  'rls', (select jsonb_build_object('tables', count(*), 'without_rls', count(*) filter (where not c.relrowsecurity),
                                    'forced', count(*) filter (where c.relforcerowsecurity))
            from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','p')),
  'policies', (select count(*) || ' ' || md5(coalesce(string_agg(concat_ws(':', schemaname, tablename, policyname, cmd, roles::text, qual, with_check), '|'
                 order by schemaname, tablename, policyname), '')) from pg_policies where schemaname in ('public', 'storage')),
  'public_triggers', (select count(*) || ' ' || md5(coalesce(string_agg(pg_get_triggerdef(g.oid) || ':' || g.tgenabled::text, '|' order by pg_get_triggerdef(g.oid)), ''))
                        from pg_trigger g join pg_class c on c.oid = g.tgrelid join pg_namespace n on n.oid = c.relnamespace
                       where n.nspname = 'public' and not g.tgisinternal),
  'audit_log', (select jsonb_build_object(
                  'client_write_grants', (select count(*) from information_schema.role_table_grants
                                           where table_schema = 'public' and table_name = 'audit_log'
                                             and privilege_type in ('UPDATE','DELETE','TRUNCATE') and grantee in ('anon','authenticated','service_role')),
                  'triggers', (select string_agg(tgname || ':' || tgenabled::text, ',' order by tgname) from pg_trigger
                                where tgrelid = to_regclass('public.audit_log') and not tgisinternal))),
  'identity', (select jsonb_build_object(
                  'auth_users', (select count(*) from auth.users),
                  'auth_identities', (select count(*) from auth.identities),
                  'accounts_linked', (select count(*) from public.accounts a join auth.users u on u.id = a.auth_user_id),
                  'accounts_unlinked', (select count(*) from public.accounts a where not exists (select 1 from auth.users u where u.id = a.auth_user_id)),
                  'links_md5', (select md5(coalesce(string_agg(a.auth_user_id::text || '>' || a.person_id::text || ':' || a.kind::text, '|'
                                  order by a.auth_user_id), '')) from public.accounts a))),
  'storage', (select jsonb_build_object(
                  'buckets', coalesce((select string_agg(id || ':' || public::text || ':' || coalesce(file_size_limit::text, '-') || ':'
                                        || coalesce(allowed_mime_types::text, '-'), ',' order by id) from storage.buckets), '-'),
                  'objects', (select count(*) || ' ' || coalesce(sum((metadata ->> 'size')::bigint), 0) from storage.objects),
                  'objects_md5', (select md5(coalesce(string_agg(bucket_id || '/' || name || ':' || coalesce(metadata ->> 'size', '-') || ':'
                                    || coalesce(metadata ->> 'eTag', '-'), '|' order by bucket_id, name), '')) from storage.objects))),
  'extensions', (select string_agg(extname || ' ' || extversion, ',' order by extname) from pg_extension),
  'in_recovery', pg_is_in_recovery(),
  'server_version', current_setting('server_version'),
  'database_size', pg_size_pretty(pg_database_size(current_database()))
) as fingerprint;
