-- 0052 -- canonical content ownership: institutions.tenant_kind.
--
-- THE PROBLEM IT SOLVES. PINTAR authors a canonical library that many schools
-- teach from. Every content table already carries `institution_id NOT NULL`,
-- every RLS predicate already reads it, and every evidence row already records
-- it. Introducing a second ownership axis -- a nullable `is_canonical` on seven
-- content tables, or a parallel `canonical_*` hierarchy -- would fork every one
-- of those predicates and leave two definitions of "who owns this row".
--
-- So canonical content is owned by an institution like everything else. What
-- changes is one column on `institutions` saying what KIND of tenant it is.
-- Every existing FK, RLS predicate, provenance column and content-hash input
-- keeps working unchanged, because none of them can tell the difference.
--
-- WHY THIS COLLIDES WITH D1, AND WHY THE TWO ARE GENUINELY DIFFERENT CONCERNS.
-- A canonical tenant is not synthetic -- its content is real, taught to real
-- learners. D1 (0042) refuses a non-synthetic institution outside production
-- unless it is the single declared OFFICIAL-evidence bootstrap, because
-- `derive_evidence_class` reads `is_synthetic` and a non-synthetic tenant is
-- how a session reaches OFFICIAL. That guard exists to stop a dev tenant
-- quietly minting official evidence.
--
-- A canonical tenant cannot mint evidence of any class, because evidence is
-- derived from the ENROLMENT's institution and a canonical tenant holds no
-- enrolments -- ever, structurally, asserted below and enforced by a trigger.
-- It owns content and produces none. That is what makes the two concerns
-- separable rather than an exception carved into D1:
--
--   * `is_synthetic`     -- may this tenant's sessions become OFFICIAL evidence?
--   * `is_official_bootstrap` -- is this the one tenant permitted to answer yes
--                               to that outside production?
--   * `tenant_kind`      -- does this tenant own content for others to teach?
--
-- The split below makes all three separately visible in the lint output rather
-- than letting a canonical tenant read as a bootstrap tenant (which would
-- silently widen D1) or trip the counter (which would make the lint dishonest).
-- A canonical tenant may never carry the bootstrap flag: check constraint,
-- trigger, and assertion. ADR-0015.
--
-- WHY THE TENANT IS CREATED HERE AND NOT SEEDED. The bootstrap tenant is
-- seeded, because it is a development affordance that must not exist in
-- production. The canonical tenant is the opposite: it is a product fixture
-- that must exist in every environment, production included, or canonical
-- content has nowhere to live. Creating it in the migration also makes the
-- `non_synthetic_institutions` movement deterministic and declared rather than
-- dependent on which seeds a given environment ran.

create type public.tenant_kind as enum ('INSTITUTION', 'PLATFORM_CANONICAL');

alter table public.institutions
  add column tenant_kind public.tenant_kind not null default 'INSTITUTION';

-- the two flags are different concerns and may never be the same row
alter table public.institutions
  add constraint institutions_canonical_is_not_bootstrap
  check (tenant_kind <> 'PLATFORM_CANONICAL' or not is_official_bootstrap);

comment on column public.institutions.tenant_kind is
  'INSTITUTION owns its own content and enrols learners. PLATFORM_CANONICAL owns '
  'content distributed to institutions and holds zero enrolments and zero sessions. '
  'Independent of is_synthetic and is_official_bootstrap (D1). ADR-0015.';

-- ---------------------------------------------------------------------------
-- 1. tenant_kind is immutable, and a canonical tenant never enrols anyone.
--
-- Immutability is not fastidiousness. Flipping a school to PLATFORM_CANONICAL
-- would retroactively reclassify every session it has already recorded, and
-- flipping a canonical tenant to INSTITUTION would make its distributed content
-- suddenly institution-owned under every predicate written below. Neither has a
-- correct answer, so neither is permitted.
-- ---------------------------------------------------------------------------
create function public.enforce_tenant_kind() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if tg_op = 'UPDATE' and new.tenant_kind is distinct from old.tenant_kind then
    raise exception
      'institutions.tenant_kind is immutable: % cannot become % (ADR-0015)',
      old.tenant_kind, new.tenant_kind;
  end if;
  if new.tenant_kind = 'PLATFORM_CANONICAL' and new.is_official_bootstrap then
    raise exception 'a PLATFORM_CANONICAL tenant is never the OFFICIAL-evidence bootstrap (D1)';
  end if;
  return new;
end $$;
revoke all on function public.enforce_tenant_kind() from public, anon, authenticated;
create trigger institutions_tenant_kind
  before insert or update on public.institutions
  for each row execute function public.enforce_tenant_kind();

create function public.enforce_canonical_holds_no_enrolments() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if exists (select 1 from public.institutions i
              where i.id = new.institution_id and i.tenant_kind = 'PLATFORM_CANONICAL') then
    raise exception
      'a PLATFORM_CANONICAL tenant owns content and enrols nobody; it produces no evidence (ADR-0015)';
  end if;
  return new;
end $$;
revoke all on function public.enforce_canonical_holds_no_enrolments() from public, anon, authenticated;
create trigger enrollments_never_canonical
  before insert or update on public.enrollments
  for each row execute function public.enforce_canonical_holds_no_enrolments();

-- ---------------------------------------------------------------------------
-- 2. D1's insert guard learns the distinction.
--
-- Before this, "not synthetic and not the bootstrap" was refused outright
-- outside production. A canonical tenant is exactly that shape and is exactly
-- not what the guard was written to stop. The refusal is narrowed by naming the
-- new case, not by deleting the old one -- an ordinary school that is
-- non-synthetic outside production is still refused, by the same message.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_official_bootstrap() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_env text;
begin
  select environment into v_env from public.platform_environment;

  if new.is_official_bootstrap and v_env = 'production' then
    raise exception 'the OFFICIAL-evidence bootstrap tenant is refused in production (D1, INV-21)';
  end if;

  -- Outside production nothing becomes official by accident. In production a
  -- non-synthetic institution is the ordinary case and is not this flag's
  -- business. CHANGED IN 0052: a PLATFORM_CANONICAL tenant is the third case --
  -- non-synthetic, deliberately not the bootstrap, and structurally incapable
  -- of producing evidence of any class because it holds no enrolments.
  if not new.is_synthetic and not new.is_official_bootstrap
     and new.tenant_kind <> 'PLATFORM_CANONICAL' and v_env <> 'production' then
    raise exception
      'a non-synthetic institution outside production must be the declared OFFICIAL bootstrap (D1): % is not',
      new.slug;
  end if;

  if tg_op = 'UPDATE' and old.is_official_bootstrap and not new.is_official_bootstrap then
    raise exception 'the bootstrap flag is not cleared in place; the tenant is removed instead';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 3. The assertion split. Both facts stay separately visible.
-- ---------------------------------------------------------------------------
create or replace function public.assert_official_evidence_bootstrap()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}'; n_boot int; n_nonsynth int; n_canon int;
        v_env text; v_name text;
begin
  select environment into v_env from public.platform_environment;
  select count(*) into n_boot from public.institutions where is_official_bootstrap;
  select count(*) into n_nonsynth from public.institutions where not is_synthetic;
  select count(*) into n_canon from public.institutions where tenant_kind = 'PLATFORM_CANONICAL';

  if v_env = 'production' and n_boot > 0 then
    problems := problems || 'an OFFICIAL bootstrap tenant exists in production'::text;
  end if;
  if n_boot > 1 then problems := problems || format('%s bootstrap tenants; D1 permits one', n_boot); end if;

  -- outside production, every non-synthetic tenant is the bootstrap -- or a
  -- canonical tenant, which is a different concern entirely (0052, ADR-0015)
  select string_agg(i.slug, ', ') into bad from public.institutions i
   where not i.is_synthetic and not i.is_official_bootstrap
     and i.tenant_kind <> 'PLATFORM_CANONICAL';
  if bad is not null and v_env <> 'production' then
    problems := problems || ('non-synthetic tenant(s) outside the declared bootstrap: ' || bad);
  end if;

  -- and the two are never the same row, in either direction
  select string_agg(i.slug, ', ') into bad from public.institutions i
   where i.tenant_kind = 'PLATFORM_CANONICAL' and i.is_official_bootstrap;
  if bad is not null then
    problems := problems || ('canonical tenant(s) carrying the bootstrap flag: ' || bad);
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
  -- ADDED IN 0052. The same probe for the new column: ownership is not an
  -- evidence-derivation input and must never become one.
  if exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
              where ns.nspname='public' and p.proname='derive_evidence_class'
                and pg_get_functiondef(p.oid) ~* 'tenant_kind') then
    problems := problems || 'derive_evidence_class reads tenant_kind: ownership is not an evidence input'::text;
  end if;

  select i.name into v_name from public.institutions i where i.is_official_bootstrap;
  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      'environment=%s; %s bootstrap tenant(s)%s; %s non-synthetic tenant(s) of which %s canonical; '
      || 'monotonicity intact and derive_evidence_class reads neither the flag nor tenant_kind',
      v_env, n_boot, coalesce(' ("' || v_name || '")', ''), n_nonsynth, n_canon)
    else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_official_evidence_bootstrap() from public, anon, authenticated;

-- The canonical-tenant facts get their own assertion rather than being folded
-- into D1's, so a failure names which concern broke.
create function public.assert_canonical_tenants()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare problems text[] := '{}'; n_canon int; n_enrol int; n_sess int; bad text;
begin
  select count(*) into n_canon from public.institutions where tenant_kind = 'PLATFORM_CANONICAL';

  select count(*) into n_enrol from public.enrollments e
    join public.institutions i on i.id = e.institution_id
   where i.tenant_kind = 'PLATFORM_CANONICAL';
  if n_enrol > 0 then
    problems := problems || format('%s enrolment(s) in a canonical tenant; it enrols nobody', n_enrol);
  end if;

  select count(*) into n_sess from public.assessment_sessions s
    join public.institutions i on i.id = s.institution_id
   where i.tenant_kind = 'PLATFORM_CANONICAL';
  if n_sess > 0 then
    problems := problems || format('%s session(s) in a canonical tenant; it produces no evidence', n_sess);
  end if;

  select string_agg(i.slug, ', ') into bad from public.institutions i
   where i.tenant_kind = 'PLATFORM_CANONICAL' and i.is_official_bootstrap;
  if bad is not null then
    problems := problems || ('canonical tenant(s) carrying the bootstrap flag: ' || bad);
  end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      '%s canonical tenant(s), holding 0 enrolments and 0 sessions', n_canon)
    else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_canonical_tenants() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. The canonical tenant itself.
-- ---------------------------------------------------------------------------
insert into public.institutions (name, slug, is_synthetic, is_active, tenant_kind)
values ('PINTAR Kurikulum Nasional', 'pintar-kanonik', false, true, 'PLATFORM_CANONICAL');

-- ---------------------------------------------------------------------------
-- 5. The counters. Three separately visible facts, not one blended number.
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
  select count(*) into n from public.institutions where is_official_bootstrap;
  v := v || jsonb_build_object('official_bootstrap_tenants', n);
  select count(*) into n from public.institutions where not is_synthetic;
  v := v || jsonb_build_object('non_synthetic_institutions', n);
  select a.ok into v_ok from public.assert_official_evidence_bootstrap() a;
  v := v || jsonb_build_object('official_bootstrap_ok', v_ok);
  -- ADDED IN 0052. The canonical tenant is non-synthetic, so it moves
  -- `non_synthetic_institutions`. Both facts are reported so neither hides the
  -- other: a reader can subtract and see how many non-synthetic tenants are
  -- ordinary schools.
  select count(*) into n from public.institutions where tenant_kind = 'PLATFORM_CANONICAL';
  v := v || jsonb_build_object('platform_canonical_tenants', n);
  select a.ok into v_ok from public.assert_canonical_tenants() a;
  v := v || jsonb_build_object('canonical_tenants_ok', v_ok);
  select count(*) into n from public.evidence_class_overrides;
  v := v || jsonb_build_object('evidence_class_overrides', n);

  select count(*) into n from public.public_surface_registry;
  v := v || jsonb_build_object('declared_public_surfaces', n);
  select a.ok into v_ok from public.assert_public_surface() a;
  v := v || jsonb_build_object('public_surface_ok', v_ok);

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
end $$;
revoke all on function public.platform_schema_lint() from public, anon;
grant execute on function public.platform_schema_lint() to authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification.
--
-- Every probe builds its own data in a subtransaction that is rolled back
-- (ADR-0014). Nothing here reads a seeded row, so a from-empty replay proves
-- exactly what a seeded upgrade proves.
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text; n int; v_canon uuid; v_raised boolean;
begin
  -- the tenant this migration created is the canonical one, and it is not
  -- the bootstrap
  select id into v_canon from public.institutions where slug = 'pintar-kanonik';
  if v_canon is null then raise exception 'the canonical tenant was not created'; end if;
  select count(*) into n from public.institutions
   where id = v_canon and tenant_kind = 'PLATFORM_CANONICAL'
     and not is_synthetic and not is_official_bootstrap;
  if n <> 1 then raise exception 'the canonical tenant is not shaped as ADR-0015 requires'; end if;

  select a.ok, a.detail into v_ok, v_detail from public.assert_official_evidence_bootstrap() a;
  if not v_ok then raise exception 'bootstrap assertion: %', v_detail; end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_canonical_tenants() a;
  if not v_ok then raise exception 'canonical assertion: %', v_detail; end if;

  -- D1's own refusal is NARROWED, not removed: an ordinary non-synthetic
  -- school outside production is still refused
  v_raised := false;
  begin
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe school', 'probe-nonsynth-0052', false, true);
    raise exception 'GUARD_DID_NOT_FIRE';
  exception
    when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'D1 no longer refuses an ordinary non-synthetic tenant outside production';
      end if;
      v_raised := true;
  end;
  if not v_raised then raise exception 'the D1 probe did not run'; end if;

  -- tenant_kind is immutable, in both directions
  v_raised := false;
  begin
    update public.institutions set tenant_kind = 'INSTITUTION' where id = v_canon;
    raise exception 'GUARD_DID_NOT_FIRE';
  exception
    when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'a canonical tenant could be demoted to INSTITUTION in place';
      end if;
      v_raised := true;
  end;
  if not v_raised then raise exception 'the immutability probe did not run'; end if;

  -- a canonical tenant carrying the bootstrap flag is refused by the check
  -- constraint before the trigger ever sees it
  v_raised := false;
  begin
    insert into public.institutions (name, slug, is_synthetic, is_active, tenant_kind, is_official_bootstrap)
    values ('probe canon boot', 'probe-canon-boot-0052', false, true, 'PLATFORM_CANONICAL', true);
    raise exception 'GUARD_DID_NOT_FIRE';
  exception
    when others then
      if sqlerrm = 'GUARD_DID_NOT_FIRE' then
        raise exception 'a canonical tenant was permitted to carry the OFFICIAL bootstrap flag';
      end if;
      v_raised := true;
  end;
  if not v_raised then raise exception 'the canonical/bootstrap probe did not run'; end if;

  -- a second canonical tenant is permitted (the model does not assume one),
  -- and it too enrols nobody. Built and rolled back.
  begin
    insert into public.institutions (name, slug, is_synthetic, is_active, tenant_kind)
    values ('probe canon 2', 'probe-canon-2-0052', false, true, 'PLATFORM_CANONICAL');
    select a.ok, a.detail into v_ok, v_detail from public.assert_canonical_tenants() a;
    if not v_ok then raise exception 'a second canonical tenant broke the assertion: %', v_detail; end if;
    raise exception 'ROLLBACK_PROBE';
  exception
    when others then
      if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  -- derive_evidence_class reads neither flag: ownership is not an evidence input
  if pg_get_functiondef('public.derive_evidence_class(uuid, public.evidence_channel)'::regprocedure) ~* 'tenant_kind' then
    raise exception 'derive_evidence_class reads tenant_kind';
  end if;

  -- The zero-enrolment rule is enforced by a trigger, not only asserted after
  -- the fact. The behavioural probe -- an actual enrolment into the canonical
  -- tenant, refused -- needs a person, a period and a programme node and so
  -- lives in F05-T02 where those exist. Here: the trigger is attached.
  select count(*) into n from pg_trigger
   where tgrelid = 'public.enrollments'::regclass and not tgisinternal
     and tgname = 'enrollments_never_canonical';
  if n <> 1 then raise exception 'the canonical zero-enrolment trigger is not attached'; end if;

  raise notice '0052 verified: tenant_kind added, D1 narrowed not weakened, canonical tenant created';
end $$;
