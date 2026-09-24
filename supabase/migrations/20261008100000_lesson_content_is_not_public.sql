-- BOB-14 -- LESSON CONTENT IS NOT PUBLIC (D-032).
--
-- public.published_lessons was built as PINTAR's one deliberate public
-- surface (spec §8): lesson prose under a PUBLISHED release, readable by anon
-- and by every signed-in person, through a view that runs as its owner. The
-- schools are real now (D-003), and once BOB-03 lets a course publish, anyone
-- holding the public API key could read every school's published lesson text,
-- and a signed-in person at one school could read another's. Nothing in the
-- application reads the view. Supabase's Security Advisor rates it CRITICAL.
--
-- So, before anything can publish:
--   1. the view loses every client grant (anon, authenticated, PUBLIC);
--   2. it becomes security_invoker, so even a future grant would read the base
--      tables under the reader's own RLS rather than around it;
--   3. it leaves public_surface_registry, which assert_public_surface holds in
--      set equality with anon's grants -- the declared anon surface is now the
--      certificate verification route alone;
--   4. platform_schema_lint drops the view's exception: anon_table_grants
--      counts every object, and a new counter, client_readable_definer_views,
--      is zero.
-- Lesson text is read only through paths that check the reader's school,
-- class and assignment. The view stays, unread, for the service role.
-- ---------------------------------------------------------------------------

revoke all on public.published_lessons from public, anon, authenticated;
alter view public.published_lessons set (security_invoker = true);
delete from public.public_surface_registry where surface = 'published_lessons';

create or replace function public.platform_schema_lint()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare v jsonb := '{}'::jsonb; n int; txt text; v_ok boolean;
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
   where ns.nspname='public' and p.prokind in ('f','p')
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  v := v || jsonb_build_object('functions_without_search_path', n);
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and (has_function_privilege('authenticated', p.oid, 'EXECUTE')
       or has_function_privilege('anon', p.oid, 'EXECUTE'))
     and not exists (select 1 from public.client_rpc_registry r where r.function_name = p.proname);
  v := v || jsonb_build_object('unclassified_client_rpcs', n);
  select a.ok into v_ok from public.assert_learner_rpcs_are_guarded() a;
  v := v || jsonb_build_object('learner_rpcs_guarded_ok', v_ok);
  select count(*) into n from (
    select p.proname from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
     where ns.nspname='public' and p.prosecdef
       and (has_function_privilege('authenticated', p.oid, 'EXECUTE')
         or has_function_privilege('anon', p.oid, 'EXECUTE'))
     group by p.proname having count(*) > 1) x;
  v := v || jsonb_build_object('overloaded_client_rpcs', n);
  select a.ok into v_ok from public.assert_evidence_consumer_boundary() a;
  v := v || jsonb_build_object('evidence_consumer_boundary_ok', v_ok);
  select a.ok into v_ok from public.assert_mode_policy_complete() a;
  v := v || jsonb_build_object('mode_policy_complete_ok', v_ok);
  select a.ok into v_ok from public.assert_integrity_never_scores() a;
  v := v || jsonb_build_object('integrity_never_scores_ok', v_ok);
  select count(*) into n from public.institutions where is_official_bootstrap;
  v := v || jsonb_build_object('official_bootstrap_tenants', n);
  -- ADDED IN 0065. The composition of the line above, one counter per approved
  -- purpose. Named explicitly rather than emitted as a map, so a new purpose
  -- shows up as a new KEY in the lint output and cannot arrive unnoticed inside
  -- an existing one.
  select count(*) into n from public.institutions
   where official_evidence_purpose = 'D1_ENGINEERING_BOOTSTRAP';
  v := v || jsonb_build_object('official_purpose_d1_engineering_bootstrap', n);
  select count(*) into n from public.institutions
   where official_evidence_purpose = 'HUMAN_EVALUATION';
  v := v || jsonb_build_object('official_purpose_human_evaluation', n);
  select count(*) into n from public.institutions where not is_synthetic;
  v := v || jsonb_build_object('non_synthetic_institutions', n);
  select a.ok into v_ok from public.assert_official_evidence_bootstrap() a;
  v := v || jsonb_build_object('official_bootstrap_ok', v_ok);
  select count(*) into n from public.institutions where tenant_kind = 'PLATFORM_CANONICAL';
  v := v || jsonb_build_object('platform_canonical_tenants', n);
  select a.ok into v_ok from public.assert_canonical_tenants() a;
  v := v || jsonb_build_object('canonical_tenants_ok', v_ok);

  -- ADDED IN 0067. The human-evaluation facility, counted so its absence in
  -- production is MEASURED rather than assumed: a production deployment with a
  -- non-zero count fails the gate (ADR B). Declared as new keys; nothing is
  -- folded into an existing counter.
  select count(*) into n from public.evaluation_personas;
  v := v || jsonb_build_object('evaluation_personas', n);
  select count(*) into n from public.evaluation_evaluators where revoked_at is null;
  v := v || jsonb_build_object('evaluation_evaluators_live', n);
  select count(*) into n from public.evaluation_sessions where ended_at is null;
  v := v || jsonb_build_object('evaluation_sessions_live', n);
  select a.ok into v_ok from public.assert_evaluation_boundary() a;
  v := v || jsonb_build_object('evaluation_boundary_ok', v_ok);
  select a.ok into v_ok from public.assert_evaluation_audit_complete() a;
  v := v || jsonb_build_object('evaluation_audit_complete_ok', v_ok);
  select count(*) into n from public.evidence_class_overrides;
  v := v || jsonb_build_object('evidence_class_overrides', n);

  select count(*) into n from public.public_surface_registry;
  v := v || jsonb_build_object('declared_public_surfaces', n);
  select a.ok into v_ok from public.assert_public_surface() a;
  v := v || jsonb_build_object('public_surface_ok', v_ok);

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  v := v || jsonb_build_object('functions_executable_by_anon', n);
  -- RESTATED IN BOB-14 (D-032): anon reads no table or view at all. The
  -- published view's exception is gone; the key keeps its name so the
  -- counter's history reads straight through the change.
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon';
  v := v || jsonb_build_object('anon_table_grants', n);
  -- kept as a key, restated over every object: anon writes nothing anywhere
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon' and privilege_type <> 'SELECT';
  v := v || jsonb_build_object('anon_public_view_write_grants', n);
  -- ADDED IN BOB-14. A view that runs as its owner and that a client role can
  -- read is a way around RLS (the Security Advisor's CRITICAL finding). Zero.
  select count(*) into n from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
   where ns.nspname = 'public' and c.relkind in ('v', 'm')
     and not coalesce(c.reloptions::text[] @> array['security_invoker=true'], false)
     and (has_table_privilege('anon', c.oid, 'SELECT') or has_table_privilege('authenticated', c.oid, 'SELECT'));
  v := v || jsonb_build_object('client_readable_definer_views', n);
  select count(*) into n from public.public_surface_registry where parent is null;
  v := v || jsonb_build_object('anon_public_surface', n);
  select count(*) into n from public.public_surface_registry where kind in ('ROUTE','ENDPOINT');
  v := v || jsonb_build_object('anon_reachable_http_paths', n);
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE')
     and not exists (select 1 from public.client_rpc_registry r
                      where r.function_name = p.proname and r.exposure = 'PUBLIC');
  v := v || jsonb_build_object('undeclared_anon_functions', n);
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
end $function$;
revoke all on function public.platform_schema_lint() from public, anon, authenticated;
grant execute on function public.platform_schema_lint() to authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification.
-- ---------------------------------------------------------------------------
do $$
declare bad text; v_ok boolean; v_detail text;
begin
  select string_agg(g.grantee || ':' || g.privilege_type, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.table_name = 'published_lessons'
     and g.grantee in ('anon', 'authenticated', 'PUBLIC');
  if bad is not null then raise exception 'published_lessons is still granted to a client role: %', bad; end if;
  if has_table_privilege('anon', 'public.published_lessons', 'SELECT')
     or has_table_privilege('authenticated', 'public.published_lessons', 'SELECT') then
    raise exception 'a client role can still read published_lessons';
  end if;
  if not coalesce((select c.reloptions::text[] @> array['security_invoker=true'] from pg_class c
                    where c.oid = 'public.published_lessons'::regclass), false) then
    raise exception 'published_lessons still runs as its owner';
  end if;
  select string_agg(g.table_name || ':' || g.privilege_type, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.grantee = 'anon';
  if bad is not null then raise exception 'anon still holds table grant(s): %', bad; end if;
  if exists (select 1 from public.public_surface_registry where kind = 'VIEW') then
    raise exception 'a VIEW is still declared as a public surface';
  end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_public_surface() a;
  if not v_ok then raise exception 'assert_public_surface fails after BOB-14: %', v_detail; end if;
  if pg_get_functiondef('public.platform_schema_lint()'::regprocedure) ~ 'published_lessons' then
    raise exception 'platform_schema_lint still carries an exception for published_lessons';
  end if;
end $$;
