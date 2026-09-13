-- 0042 — D1: the OFFICIAL-evidence bootstrap, approved as Option 1.
--
-- THE PROBLEM IT SOLVES. Every institution in this project is synthetic, so
-- `derive_evidence_class` caps every session at SYNTHETIC and nothing can ever
-- reach `OFFICIAL`. FABLE-04 must issue a certificate, and only OFFICIAL
-- evidence can reach ELIGIBLE. FABLE-03 escalated this rather than improvising
-- around it; Yazid answered it on 2026-09-13 with Option 1.
--
-- WHAT IS AND IS NOT CHANGED. Nothing about the evidence-class machinery moves.
-- `derive_evidence_class` is untouched: it already returns OFFICIAL when the
-- tenant is genuinely non-synthetic, so the class arrives the ordinary way
-- rather than through a new input. `evidence_class_min` and the monotonic
-- `min(derived, override)` rule are untouched -- an override can still only
-- weaken a class, never raise one. No fourth derivation input is added. INV-20's
-- structural exclusion is untouched. What changes is that exactly one clearly
-- named institution is permitted to be non-synthetic outside production.
--
-- THE GUARD IS STRUCTURAL, NOT A SEED CONVENTION. A seed that simply inserts
-- `is_synthetic = false` would make the bootstrap an invisible side effect, and
-- the only thing standing between a dev-only OFFICIAL tenant and a real one
-- would be whoever wrote the seed. So:
--
--   * outside production, a non-synthetic institution MUST carry the
--     `is_official_bootstrap` flag -- nothing can quietly become official;
--   * in production, the flag itself is REFUSED -- the bootstrap cannot exist
--     where it would matter;
--   * the flag is single-occupancy, enforced by a partial unique index -- it is
--     "one clearly named institution", not a category;
--   * `platform_schema_lint` counts it, so it is a deliberately non-zero,
--     visible value rather than something an auditor has to go looking for.
--
-- WHAT WOULD HAVE TO BE TRUE FOR AN OFFICIAL TENANT IN PRODUCTION. A real
-- institution, with a real data-processing agreement, real learners who have
-- consented, and a retention policy -- none of which this project has. When
-- that day comes the production path is an ordinary non-synthetic institution
-- created through the normal administrative flow, and this bootstrap flag plays
-- no part in it: the flag exists only to say "this one is deliberate", and in
-- production the answer to that is always no. ADR-0008.

alter table public.institutions
  add column if not exists is_official_bootstrap boolean not null default false;

-- "one clearly named institution", enforced rather than intended
create unique index if not exists institutions_single_official_bootstrap
  on public.institutions ((true)) where is_official_bootstrap;

alter table public.institutions
  add constraint institutions_bootstrap_is_not_synthetic
  check (not is_official_bootstrap or not is_synthetic);

create function public.enforce_official_bootstrap() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_env text;
begin
  select environment into v_env from public.platform_environment;

  if new.is_official_bootstrap and v_env = 'production' then
    raise exception 'the OFFICIAL-evidence bootstrap tenant is refused in production (D1, INV-21)';
  end if;

  -- Outside production nothing becomes official by accident. In production a
  -- non-synthetic institution is the ordinary case and is not this flag's
  -- business.
  if not new.is_synthetic and not new.is_official_bootstrap and v_env <> 'production' then
    raise exception
      'a non-synthetic institution outside production must be the declared OFFICIAL bootstrap (D1): % is not',
      new.slug;
  end if;

  if tg_op = 'UPDATE' and old.is_official_bootstrap and not new.is_official_bootstrap then
    raise exception 'the bootstrap flag is not cleared in place; the tenant is removed instead';
  end if;
  return new;
end $$;
revoke all on function public.enforce_official_bootstrap() from public, anon, authenticated;
create trigger institutions_official_bootstrap
  before insert or update on public.institutions
  for each row execute function public.enforce_official_bootstrap();

create function public.assert_official_evidence_bootstrap()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}'; n_boot int; n_nonsynth int; v_env text; v_name text;
begin
  select environment into v_env from public.platform_environment;
  select count(*) into n_boot from public.institutions where is_official_bootstrap;
  select count(*) into n_nonsynth from public.institutions where not is_synthetic;

  if v_env = 'production' and n_boot > 0 then
    problems := problems || 'an OFFICIAL bootstrap tenant exists in production'::text;
  end if;
  if n_boot > 1 then problems := problems || format('%s bootstrap tenants; D1 permits one', n_boot); end if;

  -- outside production, every non-synthetic tenant is the bootstrap
  select string_agg(i.slug, ', ') into bad from public.institutions i
   where not i.is_synthetic and not i.is_official_bootstrap;
  if bad is not null and v_env <> 'production' then
    problems := problems || ('non-synthetic tenant(s) outside the declared bootstrap: ' || bad);
  end if;

  -- the monotonic rule is untouched: no override may raise a class
  if public.evidence_class_min('SYNTHETIC', 'OFFICIAL') <> 'SYNTHETIC' then
    problems := problems || 'evidence_class_min no longer returns the weaker class: monotonicity is broken'::text;
  end if;
  if exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
              where ns.nspname='public' and p.proname='derive_evidence_class'
                and pg_get_functiondef(p.oid) ~* 'is_official_bootstrap') then
    problems := problems || 'derive_evidence_class reads the bootstrap flag: D1 added a derivation input it must not'::text;
  end if;

  select i.name into v_name from public.institutions i where i.is_official_bootstrap;
  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      'environment=%s; %s bootstrap tenant(s)%s; %s non-synthetic tenant(s); monotonicity intact and '
      || 'derive_evidence_class does not read the flag',
      v_env, n_boot, coalesce(' ("' || v_name || '")', ''), n_nonsynth)
    else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_official_evidence_bootstrap() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- The lint counts it. A deliberately non-zero value, visible by default.
-- ---------------------------------------------------------------------------
create or replace function public.platform_schema_lint() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
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

  -- ADDED IN 0042 (D1). Deliberately non-zero outside production, and zero in
  -- it. Counted rather than hidden, so nobody has to go looking for it.
  select count(*) into n from public.institutions where is_official_bootstrap;
  v := v || jsonb_build_object('official_bootstrap_tenants', n);
  select count(*) into n from public.institutions where not is_synthetic;
  v := v || jsonb_build_object('non_synthetic_institutions', n);
  select a.ok into v_ok from public.assert_official_evidence_bootstrap() a;
  v := v || jsonb_build_object('official_bootstrap_ok', v_ok);
  select count(*) into n from public.evidence_class_overrides;
  v := v || jsonb_build_object('evidence_class_overrides', n);

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  v := v || jsonb_build_object('functions_executable_by_anon', n);
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon' and table_name <> 'published_lessons';
  v := v || jsonb_build_object('anon_table_grants', n);
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon'
     and table_name = 'published_lessons' and privilege_type <> 'SELECT';
  v := v || jsonb_build_object('anon_public_view_write_grants', n);
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon';
  v := v || jsonb_build_object('anon_public_surface', n);
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
end $$;
revoke all on function public.platform_schema_lint() from public, anon;
grant execute on function public.platform_schema_lint() to authenticated;

-- ---------------------------------------------------------------------------
-- Verification block (ADR-0003). Behavioural: the guard is the whole point, so
-- it is exercised rather than inspected.
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text; v_env text; v_id uuid;
begin
  select environment into v_env from public.platform_environment;

  select a.ok, a.detail into v_ok, v_detail from public.assert_official_evidence_bootstrap() a;
  if not v_ok then raise exception 'D1 bootstrap guard: %', v_detail; end if;

  -- a non-synthetic institution that is not the declared bootstrap is refused
  if v_env <> 'production' then
    begin
      insert into public.institutions (slug, name, is_synthetic)
      values ('probe-sneaky-official', 'Probe', false) returning id into v_id;
      raise exception 'a non-synthetic institution was created without the bootstrap declaration (D1)';
    exception when raise_exception then
      if sqlerrm !~ 'declared OFFICIAL bootstrap' then raise; end if;
    end;
  end if;

  -- two bootstraps are refused
  begin
    insert into public.institutions (slug, name, is_synthetic, is_official_bootstrap)
    values ('probe-boot-a', 'Probe A', false, true);
    insert into public.institutions (slug, name, is_synthetic, is_official_bootstrap)
    values ('probe-boot-b', 'Probe B', false, true);
    raise exception 'two OFFICIAL bootstrap tenants were accepted; D1 permits one';
  exception when unique_violation then null;
  end;
  delete from public.institutions where slug like 'probe-boot-%';

  -- a synthetic bootstrap is a contradiction
  begin
    insert into public.institutions (slug, name, is_synthetic, is_official_bootstrap)
    values ('probe-boot-synth', 'Probe', true, true);
    raise exception 'a synthetic institution was flagged as the OFFICIAL bootstrap';
  exception when check_violation then null;
  end;

  -- monotonicity is untouched
  if public.evidence_class_min('SYNTHETIC', 'OFFICIAL') <> 'SYNTHETIC'
     or public.evidence_class_min('OFFICIAL', 'PUBLIC_DEMO') <> 'PUBLIC_DEMO' then
    raise exception 'evidence-class monotonicity changed; D1 must not touch it';
  end if;
  if pg_get_functiondef('public.derive_evidence_class(uuid, public.evidence_channel)'::regprocedure)
       ~* 'is_official_bootstrap' then
    raise exception 'derive_evidence_class gained a fourth input; D1 forbids that';
  end if;
end $$;
