-- 0065 -- an institution authorized for non-production OFFICIAL evidence
-- declares a bounded purpose. ADR B §5, amending ADR-0009's D1 decision.
--
-- WHY. D1 said "one bootstrap tenant". Task 2 needs a second one -- a rich
-- Human Evaluation institution where the genuine OFFICIAL -> eligibility ->
-- certificate journey is reachable, because a synthetic tenant caps every
-- session at SYNTHETIC and would give the evaluator no certificate at all.
--
-- The lazy version of that is "allow two". The problem with allowing two is
-- that `is_official_bootstrap` then becomes a boolean escape hatch: any
-- non-production institution can be made OFFICIAL by setting a flag, and
-- nothing records why. So the count rule is replaced by a PURPOSE rule:
--
--   every institution authorized for non-production OFFICIAL evidence declares
--   a bounded purpose; at most one per purpose; all refused in production.
--
-- An unapproved purpose is impossible BY TYPE. `official_evidence_purpose` is
-- an enum with exactly two values today, so a third purpose costs a migration
-- and an ADR -- not a row somebody inserts. That is the whole point of the
-- refinement and it is why this is an enum rather than text with a CHECK.
--
-- WHAT DOES NOT CHANGE, AND IS ASSERTED RATHER THAN PROMISED.
-- `derive_evidence_class` stays cap-only. It reads `is_synthetic` on the tenant
-- axis and nothing else -- not the flag, not `tenant_kind`, and now not the
-- purpose either. `assert_official_evidence_bootstrap` already probes the first
-- two; this migration adds the third probe, so the new column cannot quietly
-- become a fourth derivation input. `min()` monotonicity is untouched and no
-- override raises a class.
--
-- `is_official_bootstrap` also stays exactly as it is: both existing predicates
-- (`enforce_official_bootstrap`, `assert_official_evidence_bootstrap`) keep
-- reading the boolean. No predicate is rewritten to read the purpose instead.
-- The purpose is an additional, declared fact about a row that is already
-- flagged -- never a replacement for the flag.

create type public.official_evidence_purpose as enum (
  'D1_ENGINEERING_BOOTSTRAP',
  'HUMAN_EVALUATION'
);

alter table public.institutions
  add column official_evidence_purpose public.official_evidence_purpose;

comment on column public.institutions.official_evidence_purpose is
  'Why this institution is authorized for non-production OFFICIAL evidence. '
  'NULL for every ordinary institution. Present iff is_official_bootstrap. '
  'Bounded by type: a new purpose needs a migration and an ADR (ADR B §5).';

-- An existing D1 tenant predates the column. Backfilled before the CHECK is
-- added, so the upgrade path over a seeded database does not fail on it; on a
-- clean replay there are no rows yet and this is a no-op.
update public.institutions
   set official_evidence_purpose = 'D1_ENGINEERING_BOOTSTRAP'
 where is_official_bootstrap and official_evidence_purpose is null;

-- The purpose is present IFF the flag is set. Both directions matter: a purpose
-- without the flag would be a declaration that authorizes nothing, and the flag
-- without a purpose is the escape hatch this migration exists to close.
alter table public.institutions
  add constraint institutions_official_purpose_iff_bootstrap
  check ((official_evidence_purpose is not null) = is_official_bootstrap);

-- THE AMENDED COUNT RULE, AND THE OLD ONE REMOVED IN THE SAME BREATH.
--
-- 0043 enforced "one clearly named institution" as `unique ((true)) where
-- is_official_bootstrap` -- a single-occupancy index. That index IS D1's count
-- rule, so the amendment is not complete until it is gone: leaving it would
-- make the per-purpose rule unreachable while looking like it worked, which is
-- the failure mode where a second control silently does nothing.
--
-- Replacing one index with the other, in one migration, is why the rule can
-- never be two rules at once.
drop index if exists public.institutions_single_official_bootstrap;

-- At most one institution per purpose. Still an index rather than a trigger so
-- it holds under concurrency, and still single-occupancy -- per purpose now
-- rather than overall.
create unique index institutions_one_per_official_purpose
  on public.institutions (official_evidence_purpose)
  where official_evidence_purpose is not null;

-- ---------------------------------------------------------------------------
-- The production refusal, extended to the purpose.
--
-- Unchanged in substance: the flag is still refused in production, a
-- non-synthetic non-bootstrap tenant outside production is still refused unless
-- it is PLATFORM_CANONICAL, and the flag is still never cleared in place. Added:
-- the purpose is refused in production too, so that neither half of the pair can
-- reach production even if the other were somehow permitted -- two independent
-- refusals of the same thing rather than one.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_official_bootstrap()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $function$
declare v_env text;
begin
  select environment into v_env from public.platform_environment;

  if new.is_official_bootstrap and v_env = 'production' then
    raise exception 'the OFFICIAL-evidence bootstrap tenant is refused in production (D1, INV-21)';
  end if;
  -- ADDED IN 0065. The CHECK ties the two together, so this is belt and braces
  -- -- and it is deliberate: a future migration that relaxed the CHECK would
  -- still meet a production refusal here.
  if new.official_evidence_purpose is not null and v_env = 'production' then
    raise exception
      'an institution declaring official_evidence_purpose % is refused in production (ADR B §5, INV-21)',
      new.official_evidence_purpose;
  end if;

  if not new.is_synthetic and not new.is_official_bootstrap
     and new.tenant_kind <> 'PLATFORM_CANONICAL' and v_env <> 'production' then
    raise exception
      'a non-synthetic institution outside production must be the declared OFFICIAL bootstrap (D1): % is not',
      new.slug;
  end if;

  if tg_op = 'UPDATE' and old.is_official_bootstrap and not new.is_official_bootstrap then
    raise exception 'the bootstrap flag is not cleared in place; the tenant is removed instead';
  end if;
  -- ADDED IN 0065. The purpose is an identity, not a setting: repurposing a
  -- tenant in place would silently move whatever evidence it already produced
  -- under a different justification.
  if tg_op = 'UPDATE' and old.official_evidence_purpose is not null
     and new.official_evidence_purpose is distinct from old.official_evidence_purpose then
    raise exception 'official_evidence_purpose is not changed in place (% -> %); the tenant is removed instead',
      old.official_evidence_purpose, new.official_evidence_purpose;
  end if;
  return new;
end $function$;

-- ---------------------------------------------------------------------------
-- The assertion, amended: count by purpose, and probe the third derivation
-- input.
-- ---------------------------------------------------------------------------
create or replace function public.assert_official_evidence_bootstrap()
returns table(ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare bad text; problems text[] := '{}'; n_boot int; n_nonsynth int; n_canon int;
        v_env text; v_purposes text;
begin
  select environment into v_env from public.platform_environment;
  select count(*) into n_boot from public.institutions where is_official_bootstrap;
  select count(*) into n_nonsynth from public.institutions where not is_synthetic;
  select count(*) into n_canon from public.institutions where tenant_kind = 'PLATFORM_CANONICAL';

  if v_env = 'production' and n_boot > 0 then
    problems := problems || 'an OFFICIAL bootstrap tenant exists in production'::text;
  end if;
  -- AMENDED IN 0065. Was "n_boot > 1: D1 permits one". D1's count rule is now a
  -- per-purpose rule, so the check is that no purpose is occupied twice --
  -- enforced by a unique index, asserted here so a dropped index is visible.
  select string_agg(p || ' x' || c, ', ') into bad from (
    select official_evidence_purpose::text as p, count(*) as c
      from public.institutions where official_evidence_purpose is not null
     group by 1 having count(*) > 1) x;
  if bad is not null then
    problems := problems || ('more than one institution per official purpose: ' || bad);
  end if;
  -- and the flag and the purpose never come apart, in either direction
  select string_agg(i.slug, ', ') into bad from public.institutions i
   where i.is_official_bootstrap <> (i.official_evidence_purpose is not null);
  if bad is not null then
    problems := problems || ('bootstrap flag and declared purpose disagree on: ' || bad);
  end if;

  select string_agg(i.slug, ', ') into bad from public.institutions i
   where not i.is_synthetic and not i.is_official_bootstrap
     and i.tenant_kind <> 'PLATFORM_CANONICAL';
  if bad is not null and v_env <> 'production' then
    problems := problems || ('non-synthetic tenant(s) outside the declared bootstrap: ' || bad);
  end if;

  select string_agg(i.slug, ', ') into bad from public.institutions i
   where i.tenant_kind = 'PLATFORM_CANONICAL' and i.is_official_bootstrap;
  if bad is not null then
    problems := problems || ('canonical tenant(s) carrying the bootstrap flag: ' || bad);
  end if;

  if public.evidence_class_min('SYNTHETIC', 'OFFICIAL') <> 'SYNTHETIC' then
    problems := problems || 'evidence_class_min no longer returns the weaker class: monotonicity is broken'::text;
  end if;
  if exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
              where ns.nspname='public' and p.proname='derive_evidence_class'
                and pg_get_functiondef(p.oid) ~* 'is_official_bootstrap') then
    problems := problems || 'derive_evidence_class reads the bootstrap flag: D1 added a derivation input it must not'::text;
  end if;
  if exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
              where ns.nspname='public' and p.proname='derive_evidence_class'
                and pg_get_functiondef(p.oid) ~* 'tenant_kind') then
    problems := problems || 'derive_evidence_class reads tenant_kind: ownership is not an evidence input'::text;
  end if;
  -- ADDED IN 0065. The same probe for the purpose. Evaluation purpose is not an
  -- evidence-derivation input and must never become one: the evaluator gets a
  -- real certificate because the institution is genuinely non-synthetic, never
  -- because it is the evaluation tenant.
  if exists (select 1 from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
              where ns.nspname='public' and p.proname='derive_evidence_class'
                and pg_get_functiondef(p.oid) ~* 'official_evidence_purpose') then
    problems := problems || 'derive_evidence_class reads official_evidence_purpose: evaluation purpose is not an evidence input'::text;
  end if;

  select coalesce(string_agg(i.official_evidence_purpose::text || '="' || i.name || '"', ', '
                             order by i.official_evidence_purpose::text), 'none')
    into v_purposes
    from public.institutions i where i.official_evidence_purpose is not null;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      'environment=%s; %s bootstrap tenant(s) by purpose [%s]; %s non-synthetic tenant(s) of which %s canonical; '
      || 'monotonicity intact and derive_evidence_class reads neither the flag, nor tenant_kind, nor the purpose',
      v_env, n_boot, v_purposes, n_nonsynth, n_canon)
    else array_to_string(problems, '; ') end;
  return next;
end $function$;

-- ---------------------------------------------------------------------------
-- The lint counts by purpose. Declared as its own counters rather than folded
-- into `official_bootstrap_tenants`, which keeps meaning exactly what it meant:
-- the total. A reader can see both the total and its composition.
-- ---------------------------------------------------------------------------
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
end $function$;

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014): builds its own probe data in a rolled-back
-- subtransaction and assumes no seeded row.
-- ---------------------------------------------------------------------------
do $$
declare
  n int; v_inst uuid; v_second uuid; v_refused boolean; v_msg text;
  v_free public.official_evidence_purpose; v_other public.official_evidence_purpose;
begin
  -- === structural ==========================================================
  if not exists (select 1 from pg_type t where t.typname = 'official_evidence_purpose'
                   and t.typnamespace = 'public'::regnamespace) then
    raise exception 'official_evidence_purpose was not created';
  end if;
  select count(*) into n from pg_enum e join pg_type t on t.oid = e.enumtypid
   where t.typname = 'official_evidence_purpose';
  if n <> 2 then
    raise exception 'official_evidence_purpose has % values; ADR B approves exactly two today', n;
  end if;
  if not exists (select 1 from pg_constraint
                  where conname = 'institutions_official_purpose_iff_bootstrap') then
    raise exception 'the purpose-iff-flag CHECK is missing';
  end if;
  if not exists (select 1 from pg_indexes where schemaname='public'
                   and indexname = 'institutions_one_per_official_purpose') then
    raise exception 'the one-institution-per-purpose index is missing';
  end if;
  -- and D1's old overall single-occupancy index is GONE. Without this the
  -- amendment would be inert: the new index would be satisfied by a second
  -- purpose while the old one refused it, and the refusal would look like the
  -- new rule working.
  if exists (select 1 from pg_indexes where schemaname='public'
               and indexname = 'institutions_single_official_bootstrap') then
    raise exception 'D1''s overall single-bootstrap index survives; the count rule is still two rules';
  end if;
  -- the derivation is still cap-only, read from the LIVE function rather than
  -- trusted: this is the property the whole refinement exists to protect
  if pg_get_functiondef('public.derive_evidence_class(uuid, public.evidence_channel)'::regprocedure)
       ~* 'official_evidence_purpose|is_official_bootstrap|tenant_kind' then
    raise exception 'derive_evidence_class gained a tenant-axis input it must not have';
  end if;
  -- and the assertion actually probes for it, so the property has a guard and
  -- not just a comment
  if pg_get_functiondef('public.assert_official_evidence_bootstrap()'::regprocedure)
       !~ 'official_evidence_purpose' then
    raise exception 'assert_official_evidence_bootstrap does not probe the new derivation input';
  end if;

  -- === behavioural, in a rolled-back subtransaction ========================
  begin
    -- (1) an ordinary institution carries no purpose and is unaffected
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('probe 0065 ordinary', 'probe-0065-ordinary', true, true) returning id into v_inst;
    if (select i.official_evidence_purpose from public.institutions i where i.id = v_inst) is not null then
      raise exception 'an ordinary institution acquired a purpose by default';
    end if;

    -- (2) the flag without a purpose is refused by the CHECK -- the escape
    --     hatch this migration closes
    v_refused := false;
    begin
      update public.institutions set is_official_bootstrap = true where id = v_inst;
    exception when others then v_refused := true; end;
    if not v_refused then
      raise exception 'is_official_bootstrap was set without declaring a purpose';
    end if;

    -- (3) a purpose without the flag is refused in the other direction
    v_refused := false;
    begin
      update public.institutions set official_evidence_purpose = 'HUMAN_EVALUATION' where id = v_inst;
    exception when others then v_refused := true; end;
    if not v_refused then
      raise exception 'a purpose was declared without the bootstrap flag';
    end if;

    -- (4) the pair together is accepted, and is non-synthetic.
    --
    -- WHICH purpose is chosen is measured, not assumed. Migrations run before
    -- seeds, so on a clean replay both slots are free; on the upgrade path over
    -- a seeded database the D1 tenant already occupies one. A probe that named
    -- a purpose outright would pass from empty and fail on the upgrade path --
    -- which is exactly what it did the first time this was written (ADR-0014).
    select p into v_free
      from unnest(enum_range(null::public.official_evidence_purpose)) p
     where not exists (select 1 from public.institutions i where i.official_evidence_purpose = p)
     order by p limit 1;
    if v_free is null then
      raise exception 'every official purpose is already occupied; this probe cannot run';
    end if;
    insert into public.institutions (name, slug, is_synthetic, is_active,
                                     is_official_bootstrap, official_evidence_purpose)
    values ('probe 0065 purposed', 'probe-0065-purposed', false, true, true, v_free)
    returning id into v_inst;

    -- (5) a SECOND institution under the SAME purpose is refused
    v_refused := false;
    begin
      insert into public.institutions (name, slug, is_synthetic, is_active,
                                       is_official_bootstrap, official_evidence_purpose)
      values ('probe 0065 purposed two', 'probe-0065-purposed-2', false, true, true, v_free)
      returning id into v_second;
    exception when others then v_refused := true; end;
    if not v_refused then
      raise exception 'two institutions occupy the same official purpose';
    end if;

    -- (6) but a DIFFERENT purpose coexists with it. This is the amended D1
    --     rule and the half that would be missed by only testing refusals:
    --     "at most one PER PURPOSE", not "at most one". Whichever slot is still
    --     free gets filled; if none is, the seeded tenant already provides the
    --     second purpose and coexistence is proven by the count either way.
    select p into v_other
      from unnest(enum_range(null::public.official_evidence_purpose)) p
     where not exists (select 1 from public.institutions i where i.official_evidence_purpose = p)
     order by p limit 1;
    if v_other is not null then
      insert into public.institutions (name, slug, is_synthetic, is_active,
                                       is_official_bootstrap, official_evidence_purpose)
      values ('probe 0065 other purpose', 'probe-0065-other', false, true, true, v_other)
      returning id into v_second;
    end if;
    select count(distinct official_evidence_purpose) into n from public.institutions
     where official_evidence_purpose is not null;
    if n < 2 then
      raise exception 'two distinct official purposes do not coexist: only % occupied', n;
    end if;

    -- (7) the purpose is not repurposed in place, and the REASON is the
    --     in-place refusal rather than the occupancy index -- checked by the
    --     message, because both would refuse and only one is the rule here
    v_refused := false; v_msg := '';
    begin
      update public.institutions
         set official_evidence_purpose =
               (select p from unnest(enum_range(null::public.official_evidence_purpose)) p
                 where p <> v_free order by p limit 1)
       where id = v_inst;
    exception when others then v_refused := true; v_msg := sqlerrm; end;
    if not v_refused then
      raise exception 'official_evidence_purpose was changed in place';
    end if;
    if v_msg !~ 'not changed in place' then
      raise exception 'the in-place repurpose was refused for the wrong reason: %', v_msg;
    end if;

    -- (8) and the purposed tenant derives OFFICIAL for the ORDINARY reason: it
    --     is non-synthetic. Nothing about the purpose enters the derivation --
    --     which is the property the evaluator's real certificate rests on.
    if public.derive_evidence_class(v_inst, 'ONLINE') <> 'OFFICIAL' then
      raise exception 'the purposed tenant does not derive OFFICIAL evidence through the cap model';
    end if;
    if public.derive_evidence_class(
         (select id from public.institutions where slug = 'probe-0065-ordinary'), 'ONLINE') <> 'SYNTHETIC' then
      raise exception 'a synthetic tenant stopped capping at SYNTHETIC';
    end if;

    raise exception 'PROBE_0065_ROLLBACK';
  exception when others then
    if sqlerrm <> 'PROBE_0065_ROLLBACK' then raise; end if;
  end;
end $$;
