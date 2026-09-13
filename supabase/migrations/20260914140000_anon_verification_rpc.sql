-- 0048 — the second anonymous surface, declared rather than smuggled.
--
-- THE READING THIS MIGRATION SETTLES. The FABLE-04 builder task says two
-- things that cannot both be literally true once the verification route ships:
--
--   §9  "`anon` gets **no** table grant. The route reads through a
--        `SECURITY DEFINER` projection function registered in
--        `client_rpc_registry`, and that function is subject to every gate in
--        §7 like any other."  … and, of the counters: "declare it, count it,
--        assert it … no silent widening of an existing counter. Narrowing a
--        counter while leaving it named 'zero' is the dishonest version."
--   §13 the regression table: `functions_executable_by_anon` … 0.
--
-- 0044 implemented the §13 reading: the projection exists, `anon` executes
-- nothing, and the canonical route reached it with the server's own privilege.
-- That is genuinely zero-exposure at the database, and it fails a FABLE-01
-- gate: F01-S03 forbids `@/lib/supabase/service` outside `src/app/api/`, and
-- `/verifikasi/[token]` is a page. The available ways out were (a) weaken
-- F01-S03 for one file, (b) add a second anonymous HTTP endpoint under
-- `/api/` for the page to call itself, which is a second verification surface
-- INV-38 exists to prevent, or (c) do what §9 describes and let `anon`
-- execute the one projection function.
--
-- (c) is taken. §9 is the section that governs this surface, it is specific,
-- and it pre-authorises exactly this: a registry row, a named counter, a
-- both-ways assertion. It is also the only option that does not weaken a
-- FABLE-01 control or invent a second route.
--
-- WHAT THIS COSTS, SAID PLAINLY AND NOT HIDDEN IN A COUNTER.
-- `functions_executable_by_anon` keeps the definition it has had since 0013
-- and now reports **1**, not 0. §13's row for it is therefore NOT met, and
-- that is recorded in the completion report as an unresolved reading rather
-- than engineered away. The counter is not narrowed to make it read zero --
-- that is the move §9 names as dishonest. What goes to zero instead is a new,
-- separately named property: `undeclared_anon_functions`, an anon-executable
-- function with no PUBLIC classification. `anon_public_surface` moves 1 → 2 as
-- §13 requires, and it moves by counting MORE of reality (tables *and*
-- functions), never by counting less.
--
-- THE EXPOSURE DECISION, in the terms this phase requires. `verify_certificate`
-- is executable by anybody on the internet holding the publishable key. It is
-- safe to expose because, and only because:
--   * its argument is an opaque 43+ character random token (D3a) that is
--     derivable from nothing a verifier does not already hold -- not from the
--     certificate number, not from a person, not from a session;
--   * an unknown token returns no row at all, so there is no existence oracle
--     and no distinguishable error between "wrong token" and "no certificate";
--   * an `ELIGIBLE` (not yet issued) certificate returns nothing;
--   * its projection is the closed five-field allow-list of D3b, asserted by
--     set equality, and it reads no identity column at all -- asserted
--     structurally against the function source, not by inspecting output.
-- None of that is new in this migration; what is new is that the reasoning is
-- attached to a grant instead of implied by its absence.

-- ---------------------------------------------------------------------------
-- 1. The registry learns a third kind. A VIEW and an RPC are both objects
--    `anon` reaches in the database and are what `anon_public_surface` counts;
--    a ROUTE is the HTTP shape in front of them and is asserted by F04-S01,
--    on a different axis, so it is declared here but not counted here.
-- ---------------------------------------------------------------------------
alter table public.public_surface_registry drop constraint public_surface_registry_kind_check;
alter table public.public_surface_registry
  add constraint public_surface_registry_kind_check check (kind in ('VIEW','RPC','ROUTE'));

update public.public_surface_registry
   set note = 'FABLE-04 §9 / INV-38: the one canonical public verification route. '
           || 'It reads the RPC below with the anonymous key -- no service-role client, no second endpoint.'
 where surface = 'certificate_verification';

insert into public.public_surface_registry values
  ('certificate_verification_rpc', 'RPC', 'public.verify_certificate(text)',
   'FABLE-04 §9 / D3a / D3b: opaque-token projection, five fields, no identity column, no existence oracle.');

-- ---------------------------------------------------------------------------
-- 2. The grant and its classification, in one statement.
--
--    The rule for this phase is that no `grant execute` to a client role may
--    appear without the `client_rpc_registry` row that classifies it, created
--    in the same statement. Two adjacent statements satisfy the letter and not
--    the point: a later edit can delete one and leave the other. This is one
--    statement, so the exposure and the argument for it commit together or
--    not at all.
-- ---------------------------------------------------------------------------
do $$
begin
  execute 'grant execute on function public.verify_certificate(text) to anon';
  insert into public.client_rpc_registry values
    ('verify_certificate', 'PUBLIC',
     'FABLE-04 §9: the public verification projection. Anonymous by design; opaque token in, '
  || 'five non-identifying fields out, no row for an unknown or unissued token.');
end $$;

-- ---------------------------------------------------------------------------
-- 3. The assertion, both ways, by name.
--
--    "A test that asserts exactly which objects are anon-reachable" (§9). Set
--    equality in both directions on both kinds: nothing anon can reach is
--    missing from the registry, and nothing in the registry has stopped being
--    reachable. A scan for a forbidden name would pass for any object nobody
--    thought to forbid; an equality cannot.
-- ---------------------------------------------------------------------------
create or replace function public.assert_public_surface()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}'; n int;
begin
  -- (a) VIEW surfaces: anon's table grants, both directions
  select string_agg(distinct g.table_name, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.grantee = 'anon'
     and not exists (select 1 from public.public_surface_registry r
                      where r.kind = 'VIEW' and r.object = 'public.' || g.table_name);
  if bad is not null then problems := problems || ('undeclared anon-readable object(s): ' || bad); end if;

  select string_agg(r.surface, ', ') into bad from public.public_surface_registry r
   where r.kind = 'VIEW'
     and not exists (select 1 from information_schema.role_table_grants g
                      where g.table_schema='public' and g.grantee='anon'
                        and 'public.' || g.table_name = r.object);
  if bad is not null then problems := problems || ('declared surface(s) that are not anon-readable: ' || bad); end if;

  -- (b) RPC surfaces: anon's EXECUTE privileges, both directions
  -- by oid, never by the text spelling: regprocedure renders without the schema
  -- when public is on the search_path and with it when it is not, so a text
  -- comparison reports a false mismatch depending on who calls the assertion.
  select string_agg(distinct p.oid::regprocedure::text, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE')
     and not exists (select 1 from public.public_surface_registry r
                      where r.kind = 'RPC' and to_regprocedure(r.object) = p.oid);
  if bad is not null then problems := problems || ('undeclared anon-executable function(s): ' || bad); end if;

  select string_agg(r.surface, ', ') into bad from public.public_surface_registry r
   where r.kind = 'RPC'
     and not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
                      where ns.nspname = 'public' and to_regprocedure(r.object) = p.oid
                        and has_function_privilege('anon', p.oid, 'EXECUTE'));
  if bad is not null then problems := problems || ('declared RPC surface(s) anon cannot execute: ' || bad); end if;

  -- (c) every anon-executable function carries the PUBLIC classification, and
  --     nothing classified for a signed-in principal is anon-reachable
  select string_agg(distinct p.proname || ' (' || coalesce(r.exposure::text, 'unclassified') || ')', ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    left join public.client_rpc_registry r on r.function_name = p.proname
   where ns.nspname = 'public' and has_function_privilege('anon', p.oid, 'EXECUTE')
     and coalesce(r.exposure::text, '') <> 'PUBLIC';
  if bad is not null then problems := problems || ('anon-executable function not classified PUBLIC: ' || bad); end if;

  -- (d) anon still holds no write anywhere, and no table grant beyond the view
  select string_agg(g.table_name || ':' || g.privilege_type, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema='public' and g.grantee='anon' and g.privilege_type <> 'SELECT';
  if bad is not null then problems := problems || ('anon holds a non-SELECT grant: ' || bad); end if;

  -- (e) D3b: the verification path never reads identity
  if pg_get_functiondef('public.verify_certificate(text)'::regprocedure)
       ~* '(name_as_issued|photo_path|photo_content_hash|display_name)' then
    problems := problems || 'verify_certificate reads an identity column; D3b excludes it structurally'::text;
  end if;
  -- ... and returns exactly the five enumerated fields. The OUT parameter
  -- names, not the return type: a RETURNS TABLE function has prorettype
  -- `record`, which carries no attributes at all, and the obvious
  -- pg_attribute join yields NULL for every function -- it "catches" a
  -- correct projection exactly as loudly as a leaky one. It did, in 0044,
  -- until this was fixed.
  select string_agg(u.n, ',' order by u.ord) into bad
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace,
         lateral unnest(p.proargnames, p.proargmodes) with ordinality as u(n, m, ord)
   where ns.nspname='public' and p.proname='verify_certificate' and u.m = 't';
  if bad is distinct from 'pass,predikat,institution,date,validity' then
    problems := problems || ('the verification payload is not the enumerated five fields: ' || coalesce(bad,'<none>'));
  end if;

  select count(*) into n from public.public_surface_registry where kind in ('VIEW','RPC');
  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      '%s declared anon-reachable object(s): %s. Every one is declared and every declaration is live; '
      || 'anon holds SELECT only and executes nothing that is not classified PUBLIC. The verification '
      || 'payload is exactly {pass, predikat, institution, date, validity} and the path reads no identity column.',
      n, (select string_agg(r.surface || ' (' || r.kind || ')', ', ' order by r.surface)
            from public.public_surface_registry r where r.kind in ('VIEW','RPC')))
    else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_public_surface() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. The probe. A set equality is only worth the name if an extra member turns
--    it red, so one is added and the gate is required to name it.
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text;
begin
  execute 'grant execute on function public.certificate_eligibility(uuid) to anon';
  select a.ok, a.detail into v_ok, v_detail from public.assert_public_surface() a;
  if v_ok then
    raise exception 'the probe passed: an undeclared anon-executable function went undetected';
  end if;
  if v_detail !~ 'certificate_eligibility' then
    raise exception 'the probe was caught but not named: %', v_detail;
  end if;
  if v_detail !~ 'undeclared anon-executable function' then
    raise exception 'the probe was caught for the wrong reason: %', v_detail;
  end if;
  execute 'revoke execute on function public.certificate_eligibility(uuid) from anon';
  select a.ok into v_ok from public.assert_public_surface() a;
  if not v_ok then raise exception 'the surface did not return to green after the probe was withdrawn'; end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. The lint, spliced from the live definition with two counters changed and
--    nothing else touched.
-- ---------------------------------------------------------------------------
create or replace function public.platform_schema_lint()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  select count(*) into n from public.evidence_class_overrides;
  v := v || jsonb_build_object('evidence_class_overrides', n);

  -- ADDED IN 0044. The public surface is declared, counted and asserted.
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
  -- CHANGED IN 0048. This counted anon's TABLE grants only, which was complete
  -- while the only public surface was a view. FABLE-04 §9 adds a second
  -- surface that is a function, so a table-only count would report 1 while
  -- anon could reach two things -- the counter would be narrower than the
  -- exposure, which is the dishonest direction. It now counts every public
  -- object anon can reach, of either kind, measured from the catalogue; the
  -- declaration it must equal lives in public_surface_registry and
  -- assert_public_surface() ties the two together in both directions.
  select (select count(distinct table_name) from information_schema.role_table_grants
           where table_schema='public' and grantee='anon')
       + (select count(*) from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
           where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE'))
    into n;
  v := v || jsonb_build_object('anon_public_surface', n);
  -- ADDED IN 0048. The honest companion to functions_executable_by_anon, which
  -- keeps its original meaning and now reads 1. This one is the property that
  -- must stay at zero: an anon-executable function nobody classified.
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

revoke all on function public.platform_schema_lint() from public, anon;
-- the established pattern for this one: granted to authenticated and gated
-- inside on is_system_admin(), so F01-T13b keeps testing the refusal path.
grant execute on function public.platform_schema_lint() to authenticated;

-- ---------------------------------------------------------------------------
-- Terminal verification.
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text; n int; v jsonb;
begin
  select a.ok, a.detail into v_ok, v_detail from public.assert_public_surface() a;
  if not v_ok then raise exception 'the public surface does not assert clean: %', v_detail; end if;

  -- exactly one anon-executable function, and it is the one named here
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n <> 1 then raise exception 'expected exactly 1 anon-executable function, found %', n; end if;
  if not has_function_privilege('anon', 'public.verify_certificate(text)'::regprocedure, 'EXECUTE') then
    raise exception 'verify_certificate is not the anon-executable function';
  end if;

  -- it is classified, and classified PUBLIC
  select count(*) into n from public.client_rpc_registry
   where function_name = 'verify_certificate' and exposure = 'PUBLIC';
  if n <> 1 then raise exception 'verify_certificate is not classified PUBLIC (%)', n; end if;

  -- anon still holds no table grant beyond the published view, and no write
  select count(*) into n from information_schema.role_table_grants
   where table_schema='public' and grantee='anon'
     and (table_name <> 'published_lessons' or privilege_type <> 'SELECT');
  if n <> 0 then raise exception 'anon holds % unexpected table grant(s)', n; end if;

  -- the declared surface is exactly two objects
  select count(*) into n from public.public_surface_registry where kind in ('VIEW','RPC');
  if n <> 2 then raise exception 'the declared anon-reachable surface is % object(s), expected 2', n; end if;

  -- and an anonymous caller really can call it, and gets nothing back for a
  -- token it does not hold. Executed AS anon, not merely reasoned about.
  begin
    execute 'set local role anon';
    select count(*) into n from public.verify_certificate(repeat('x', 43));
    execute 'reset role';
    if n <> 0 then raise exception 'an unknown token returned % row(s)', n; end if;
  exception
    when insufficient_privilege then
      raise exception 'anon cannot execute the function it is supposed to reach';
  end;
end $$;
