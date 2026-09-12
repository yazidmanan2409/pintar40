-- audit_log_no_service_writes (FABLE-01 §8, INV-18; mini-audit finding):
-- Supabase's default privileges gave `service_role` UPDATE/DELETE/TRUNCATE on
-- public.audit_log. The append-only trigger already refuses those statements
-- for every role (F01-T11), but an immutable table carries two locks, not
-- one: the grant goes too. The schema lint now counts service_role as well,
-- so the Config Studio health card and F01-T13 would catch a regression.

revoke update, delete, truncate on public.audit_log from service_role;
-- Default privileges for future tables owned by postgres: audit-class tables
-- are created explicitly append-only in their own migrations; nothing to
-- change globally here.

create or replace function public.platform_schema_lint() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v jsonb := '{}'::jsonb; n int; txt text;
begin
  if not public.is_system_admin() then raise exception 'SYSTEM_ADMIN required'; end if;

  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  v := v || jsonb_build_object('tables_without_rls', n);

  select count(*) into n from pg_policies where schemaname='public' and (qual = 'true' or with_check = 'true');
  v := v || jsonb_build_object('policies_using_true', n);

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  v := v || jsonb_build_object('secdef_without_search_path', n);

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  v := v || jsonb_build_object('functions_executable_by_anon', n);

  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon';
  v := v || jsonb_build_object('anon_table_grants', n);

  select count(*) into n from storage.buckets where public;
  v := v || jsonb_build_object('public_buckets', n);

  select count(*) into n from pg_policies
   where schemaname='storage' and tablename='objects'
     and (roles::text like '%anon%' or roles::text like '%public%' or roles::text like '%authenticated%');
  v := v || jsonb_build_object('client_storage_policies', n);

  select count(*) into n from information_schema.columns
   where table_schema='public' and table_name='persons'
     and column_name in ('institution_id','class_id','cohort_id','node_id');
  v := v || jsonb_build_object('persons_institution_columns', n);

  -- every non-owner role, service_role included (INV-18: two locks)
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and table_name='audit_log' and privilege_type in ('UPDATE','DELETE','TRUNCATE')
     and grantee in ('anon','authenticated','service_role');
  v := v || jsonb_build_object('audit_log_client_write_grants', n);

  select count(*) into n from public.org_nodes
   where cardinality(jalur) = 0 or jalur[cardinality(jalur)] <> id;
  v := v || jsonb_build_object('malformed_jalur', n);

  select environment into txt from public.platform_environment;
  v := v || jsonb_build_object('environment', txt);

  select count(*) into n from supabase_migrations.schema_migrations;
  v := v || jsonb_build_object('migrations_applied', n);

  return v;
end $$;
revoke all on function public.platform_schema_lint() from public, anon;
grant execute on function public.platform_schema_lint() to authenticated;

-- ---------------------------------------------------------------------------
-- Verification (fails the migration on any violation)
-- ---------------------------------------------------------------------------
do $$
declare n int;
begin
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and table_name='audit_log' and privilege_type in ('UPDATE','DELETE','TRUNCATE')
     and grantee in ('anon','authenticated','service_role');
  if n > 0 then raise exception 'audit_log still has % write grant(s) for a non-owner role (INV-18)', n; end if;
  if has_function_privilege('anon', 'public.platform_schema_lint()', 'execute') then
    raise exception 'anon can execute platform_schema_lint';
  end if;
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path', n; end if;
end $$;
