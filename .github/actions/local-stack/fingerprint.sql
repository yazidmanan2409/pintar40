-- THE FRESH DATABASE'S FINGERPRINT (D-119, S4). The red cases share one local stack per group, and each case starts from
-- `supabase db reset`. A reset rebuilds the database, but roles, memberships and role settings belong to the cluster
-- and outlive it. So every reset is fingerprinted here, and local-stack fails the case if the fingerprint differs from
-- the job's first fresh database: a case can never inherit what an earlier case left behind.
--
-- It covers what a plant or a test could leave: every function and its grants, columns and their grants, policies,
-- relation grants and triggers (public, auth, storage, selftest), the extensions, the roles with their attributes,
-- settings and memberships, and the row count of every table in public and of auth's users and identities. It reads
-- only; it creates nothing.
select md5(string_agg(x, '|' order by x)) from (
  select 'fn ' || p.oid::regprocedure::text || ' ' || md5(pg_get_functiondef(p.oid)) || ' ' || coalesce(array_to_string(p.proacl, ','), '') as x
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname in ('public', 'auth', 'storage', 'selftest') and p.prokind in ('f', 'p')
  union all
  select 'col ' || c.table_schema || '.' || c.table_name || '.' || c.column_name || ' ' || c.data_type || ' ' || coalesce(c.column_default, '')
    from information_schema.columns c where c.table_schema in ('public', 'auth', 'storage', 'selftest')
  union all
  select 'cacl ' || c.oid::regclass::text || '.' || a.attname || ' ' || array_to_string(a.attacl, ',')
    from pg_attribute a join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace
   where n.nspname in ('public', 'auth', 'storage', 'selftest') and a.attnum > 0 and not a.attisdropped and a.attacl is not null
  union all
  select 'pol ' || pol.schemaname || '.' || pol.tablename || '.' || pol.policyname || ' ' || coalesce(pol.qual, '') || ' ' || coalesce(pol.with_check, '')
    from pg_policies pol where pol.schemaname in ('public', 'auth', 'storage', 'selftest')
  union all
  select 'rel ' || c.oid::regclass::text || ' ' || c.relkind::text || ' ' || c.relrowsecurity::text || ' ' || coalesce(array_to_string(c.relacl, ','), '')
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname in ('public', 'auth', 'storage', 'selftest') and c.relkind in ('r', 'v', 'm', 'p', 'S')
  union all
  select 'trg ' || t.tgrelid::regclass::text || '.' || t.tgname || ' ' || t.tgenabled::text
    from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
   where not t.tgisinternal and n.nspname in ('public', 'auth', 'storage', 'selftest')
  union all
  select 'ext ' || e.extname || ' ' || e.extversion || ' ' || e.extnamespace::regnamespace::text from pg_extension e
  union all
  select 'role ' || r.rolname || ' ' || r.rolsuper::text || r.rolinherit::text || r.rolcreaterole::text || r.rolcreatedb::text
         || r.rolcanlogin::text || r.rolreplication::text || r.rolbypassrls::text || ' ' || r.rolconnlimit::text
         || ' ' || coalesce(array_to_string(r.rolconfig, ','), '')
    from pg_roles r where r.rolname !~ '^pg_'
  union all
  select 'member ' || m.roleid::regrole::text || ' > ' || m.member::regrole::text || ' ' || m.admin_option::text
    from pg_auth_members m
  union all
  select 'dbset ' || coalesce(s.setrole::regrole::text, '*') || ' ' || array_to_string(s.setconfig, ',')
    from pg_db_role_setting s
  union all
  select 'rows ' || t.table_schema || '.' || t.table_name || ' '
         || (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', t.table_schema, t.table_name), false, true, '')))[1]::text
    from information_schema.tables t
   where t.table_type = 'BASE TABLE'
     and (t.table_schema = 'public' or (t.table_schema = 'auth' and t.table_name in ('users', 'identities')))
) s;
