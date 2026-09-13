-- 0044 — FABLE-04 §9 / INV-38 / D3b: exactly one public verification surface,
-- and a closed five-field payload.
--
-- WHY `anon` GETS NO GRANT, NOT EVEN ON THE PROJECTION FUNCTION. The builder
-- prompt asks for two things that look like they conflict: §9 says the
-- verification route "adds a second anonymous surface", and §13 requires
-- `functions_executable_by_anon` to stay **0** and `anon_table_grants` to stay
-- **0**. They only conflict if the anonymous surface is a PostgREST RPC. It is
-- not: the canonical route is a server route, it holds the privilege the way
-- FABLE-01 §7's asset route does, and `anon` in the Postgres sense executes
-- nothing. So both hold literally, and the second public surface is real but
-- lives at the HTTP layer.
--
-- That makes "count it" a different problem, because a route is not a grant and
-- no catalogue query finds it. Widening `anon_public_surface` -- a grant count
-- -- to mean "and also a route" would be the dishonest version of this change,
-- the same move FABLE-02 refused when it kept `anon_table_grants` meaning zero
-- and added separate counters. So the public surface becomes a REGISTRY: every
-- anonymous-reachable surface is a row naming its kind and object, and
-- `assert_public_surface()` asserts set equality in both directions -- a grant
-- that no row declares fails, and a row that names nothing real fails.
--
-- THE PAYLOAD IS CLOSED, AND THE EXCLUSION IS STRUCTURAL (D3b). doc 02's
-- Verification Record enumerates the public-safe read and doc 05's matrix cell
-- says "only": pass · predikat · institution · date · validity. The learner's
-- name is not in either, and no exception clause exists anywhere in docs 01-16.
-- The tension with "a verifier needs to know whose credential it is" is
-- resolved by the artefact, not the route -- the certificate in the verifier's
-- hand carries the holder identity, rendered from the snapshot. So this
-- function does not read `name_as_issued` or `photo_path` AT ALL, and that is
-- asserted, so the exclusion cannot become a template omission somebody later
-- "fixes".

create table public.public_surface_registry (
  surface text primary key,
  kind    text not null check (kind in ('VIEW','ROUTE')),
  object  text not null check (btrim(object) <> ''),
  note    text not null check (btrim(note) <> '')
);
alter table public.public_surface_registry enable row level security;
insert into public.record_class_registry values
  ('public_surface_registry', 'INSTITUTION_SCOPED', 'build-time contract, not learner evidence');

insert into public.public_surface_registry values
  ('published_lessons', 'VIEW', 'public.published_lessons',
   'FABLE-02 §8: lesson prose under a PUBLISHED release. Cross-tenant scope is an open architecture decision.'),
  ('certificate_verification', 'ROUTE', '/verifikasi/[token]',
   'FABLE-04 §9 / INV-38: the one canonical public verification route. Server-held privilege; anon executes nothing.');

-- ---------------------------------------------------------------------------
-- The projection. Five fields, and it never touches identity.
--
-- ORDER MATTERS HERE. The probe §9 asks for -- a sixth field, and a leaked
-- name -- is planted FIRST, under the real name, so the assertion can be shown
-- to catch it; then it is dropped and the real function is created. Recreating
-- the real function from inside a DO block would mean nesting dollar quotes
-- three deep, which is how this migration failed the first time it was written.
-- ---------------------------------------------------------------------------
create function public.verify_certificate(p_token text)
returns table (pass boolean, predikat text, institution text, date text,
               validity text, nama text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_c public.certificates;
begin
  -- DELIBERATELY WRONG. This is the planted defect, alive for exactly two
  -- statements so the gate can be shown to bite.
  select * into v_c from public.certificates c where c.verification_token = p_token;
  if v_c.id is null then return; end if;
  select s.name_as_issued into nama from public.certificate_identity_snapshots s
   where s.id = v_c.snapshot_id;
  return next;
end $$;
revoke all on function public.verify_certificate(text) from public, anon, authenticated;

create function public.assert_public_surface()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}'; n int;
begin
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

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then problems := problems || format('anon can execute %s function(s) in public', n); end if;
  select string_agg(g.table_name || ':' || g.privilege_type, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema='public' and g.grantee='anon' and g.privilege_type <> 'SELECT';
  if bad is not null then problems := problems || ('anon holds a non-SELECT grant: ' || bad); end if;

  -- D3b: the verification path never reads identity
  if pg_get_functiondef('public.verify_certificate(text)'::regprocedure)
       ~* '(name_as_issued|photo_path|photo_content_hash|display_name)' then
    problems := problems || 'verify_certificate reads an identity column; D3b excludes it structurally'::text;
  end if;
  -- ... and returns exactly the five enumerated fields
  -- The OUT parameter names, not the return type: a RETURNS TABLE function has
  -- prorettype `record`, which carries no attributes at all -- so the obvious
  -- pg_attribute join yields NULL for every function and "catches" a correct
  -- projection exactly as loudly as a leaky one. It did, and the probe below
  -- passed for the wrong reason until this was fixed.
  select string_agg(u.n, ',' order by u.ord) into bad
    from pg_proc p
    join pg_namespace ns on ns.oid = p.pronamespace,
         lateral unnest(p.proargnames, p.proargmodes) with ordinality as u(n, m, ord)
   where ns.nspname='public' and p.proname='verify_certificate' and u.m = 't';
  if bad is distinct from 'pass,predikat,institution,date,validity' then
    problems := problems || ('the verification payload is not the enumerated five fields: ' || coalesce(bad,'<none>'));
  end if;

  select count(*) into n from public.public_surface_registry;
  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      '%s declared public surface(s): %s. anon executes 0 functions and holds SELECT only. The verification '
      || 'payload is exactly {pass, predikat, institution, date, validity} and the path reads no identity column.',
      n, (select string_agg(r.surface || ' (' || r.kind || ')', ', ' order by r.surface)
            from public.public_surface_registry r))
    else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_public_surface() from public, anon, authenticated;

-- The planted defect must turn the gate red, and name both reasons.
do $$
declare v_ok boolean; v_detail text;
begin
  select a.ok, a.detail into v_ok, v_detail from public.assert_public_surface() a;
  if v_ok then raise exception 'the probe passed: a sixth field and a leaked name went undetected (D3b)'; end if;
  if v_detail !~ 'identity column' or v_detail !~ 'enumerated five fields' then
    raise exception 'the probe was caught, but not for both reasons: %', v_detail;
  end if;
end $$;

drop function public.verify_certificate(text);

-- The real one.
create function public.verify_certificate(p_token text)
returns table (pass boolean, predikat text, institution text, date text, validity text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_c public.certificates; v_inst text;
begin
  if p_token is null or length(p_token) < 43 then return; end if;
  select * into v_c from public.certificates c where c.verification_token = p_token;
  -- an unknown token yields no row at all: no existence oracle, no distinguishable error
  if v_c.id is null then return; end if;
  if v_c.status = 'ELIGIBLE' then return; end if;   -- not yet issued is not public
  select i.name into v_inst from public.institutions i where i.id = v_c.institution_id;
  pass       := (v_c.canonical_payload -> 'result' ->> 'passed')::boolean;
  predikat   := v_c.canonical_payload -> 'result' ->> 'predikat';
  institution:= v_inst;
  date       := left(v_c.issued_at_iso, 10);
  validity   := case v_c.status when 'ISSUED' then 'BERLAKU'
                                when 'REVOKED' then 'DICABUT'
                                when 'SUPERSEDED' then 'DIGANTIKAN' end;
  return next;
end $$;
-- No client grant at all. The canonical route reaches it server-side.
revoke all on function public.verify_certificate(text) from public, anon, authenticated;

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
-- Verification block (ADR-0003). The probe already ran above, against a live
-- planted defect; this confirms the restored state is clean.
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text; n int; bad text;
begin
  select a.ok, a.detail into v_ok, v_detail from public.assert_public_surface() a;
  if not v_ok then raise exception 'public surface: %', v_detail; end if;

  -- INV-38: exactly one canonical verification surface is declared
  select count(*) into n from public.public_surface_registry where kind = 'ROUTE';
  if n <> 1 then raise exception 'INV-38 requires exactly one public verification route; % declared', n; end if;

  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s); §13 requires 0', n; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prokind in ('f','p')
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% function(s) unpinned: %', n, bad; end if;
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception '% table(s) without RLS', n; end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_engine_takes_no_identity() a;
  if not v_ok then raise exception 'RPC exposure contract: %', v_detail; end if;
end $$;
