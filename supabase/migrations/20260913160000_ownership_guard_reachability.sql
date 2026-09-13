-- 0037 — two more functions of the same class as 0036's leak, and the assertion
-- that would have caught all three.
--
-- REPRODUCED BEFORE REPAIRED. Claude 1's round-3 review found these by reading
-- live definitions and grants, and said plainly that it had not executed them --
-- hosted carries no sessions -- and that they should be reproduced against
-- seeded data before being treated as confirmed. They were. Against the
-- learning-cycle fixture, with two learners in one institution:
--
--   * learner A called `session_enforce_deadline(B's session)` and read back
--     `SUBMITTED` -- a status oracle on another learner's attempt;
--   * a non-existent id raised `unknown session <uuid>`, distinguishable from
--     a permission error -- an existence oracle;
--   * learner A then called `finalize_session(B's session)` and it SUCCEEDED:
--     an `assessment_results` row was written and B's session moved to
--     FINALIZED. Another learner chose the moment at which B's attempt was
--     scored and closed.
--
-- And across tenants, which the review flagged for the oracle and which turns
-- out to be true of the write as well: `alpha-siswa-1`, a learner in an
-- entirely different institution, finalized the siklus learner's session. INV-13.
--
-- WHAT IS AND IS NOT WRONG. `enforce_result_write` derives `person_id`,
-- `institution_id` and `evidence_class` from the session rather than from the
-- caller, so the row is attributed to its rightful owner and the score is that
-- learner's own work, correctly computed -- INV-08 holds for the data, and this
-- is not a grade-tampering hole. What is wrong is that a stranger picks the
-- moment, can close an attempt that was still legitimately open to its owner's
-- deadline, and does not appear as the actor. Stated at its real size, not
-- inflated.
--
-- WHY EVERY EXISTING CONTROL PASSED THEM, each correctly within its own scope:
--   * 0036's registry answers WHICH functions are exposed, not whether they are
--     guarded. Both were exposed and both were correctly listed.
--   * `assert_engine_takes_no_identity` checks SIGNATURES, and `p_session uuid`
--     is a resource id, not an identity -- exactly as that assertion's own
--     detail line says of itself.
--   * `F03-T10` exercises `finish_my_session`, the wrapper that DOES call
--     `session_is_mine`. The unguarded function underneath it was never called
--     directly by any test.
-- Three gates, each sound, and a defect class living in the space between them.
--
-- THE FIX IS THE ASSERTION, NOT THE REVOKE. Revoking two functions closes
-- today's instance; this is the third instance of the class. So the property is
-- asserted instead: every LEARNER row in the registry must REACH an ownership
-- check -- `current_person_id()` or `session_is_mine()` -- transitively. A
-- depth-0 text scan is useless here and would have been dismissed as noise: it
-- reports thirteen false positives, because `pause_session` and
-- `resume_session` are guarded through `may_continue_session`, `sanitized_item`
-- through `session_paper`, `may_read_lesson_media` through
-- `my_learning_assignments()`. Walking the call graph reports exactly the two
-- above and nothing else.
--
-- The walk is a text match over `prosrc` with comments stripped, not a parser.
-- It can invent an edge that does not exist -- which makes something look
-- guarded when it is not -- so comments are removed first, since a body that
-- merely *mentions* `session_is_mine` in prose would otherwise pass. It is a
-- gate, not a proof, and its own detail line says so.

-- ---------------------------------------------------------------------------
-- 1. Neither is an entry point. `finish_my_session` is the entry point and it
--    is guarded; `session_enforce_deadline` is internal to the engine. Both are
--    still called from inside SECURITY DEFINER bodies, which is unaffected.
-- ---------------------------------------------------------------------------
revoke all on function public.finalize_session(uuid) from public, anon, authenticated;
revoke all on function public.session_enforce_deadline(uuid) from public, anon, authenticated;
delete from public.client_rpc_registry where function_name in ('finalize_session','session_enforce_deadline');

-- ---------------------------------------------------------------------------
-- 2. The property the registry cannot express.
-- ---------------------------------------------------------------------------
create function public.assert_learner_rpcs_are_guarded()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; n_roots int;
begin
  with recursive fn as (
    select (p.proname::text collate "default") as proname,
           regexp_replace(regexp_replace(coalesce(p.prosrc,''), '--[^\n]*', '', 'g'),
                          '/\*.*?\*/', '', 'g') as src
      from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public' and p.prokind = 'f'
  ),
  edge as (
    select distinct f.proname as caller, g.proname as callee
      from fn f join fn g on g.proname <> f.proname
       and f.src ~ ('\m' || g.proname || '\M')
  ),
  roots as (
    select r.function_name as root, r.function_name as node, 0 as depth
      from public.client_rpc_registry r where r.exposure = 'LEARNER'
  ),
  reach as (
    select root, node, depth from roots
    union
    select x.root, e.callee, x.depth + 1
      from reach x join edge e on e.caller = x.node
     where x.depth < 6
  ),
  verdict as (
    select r.root, bool_or(r.node in ('current_person_id','session_is_mine')) as guarded
      from reach r group by r.root
  )
  select string_agg(v.root, ', ' order by v.root), count(*)
    into bad, n_roots
    from verdict v where not v.guarded;

  select count(*) into n_roots from public.client_rpc_registry where exposure = 'LEARNER';
  ok := bad is null;
  detail := case when ok then format(
      '%s LEARNER RPC(s) each reach current_person_id() or session_is_mine() within 6 calls. '
      || 'Reachability is a comment-stripped text walk over prosrc, not a parser: it is a gate against '
      || 'an entry point that forgets the check, not a proof that the check is correct.', n_roots)
    else 'LEARNER RPC(s) that never reach an ownership check: ' || bad end;
  return next;
end $$;
revoke all on function public.assert_learner_rpcs_are_guarded() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Round-3 §5: two small hardenings the review asked for.
--
--    (a) The registry keys on `function_name` alone, so a second signature of
--        an existing name would silently inherit the first's class. Nothing is
--        currently overloaded, and re-keying on (name, identity_arguments)
--        would make every row carry an argument string that goes stale on any
--        signature change -- the failure mode 0029 already hit when
--        `open_assessment_session` gained two arguments. Asserting that no
--        client-executable SECDEF name is overloaded closes the same gap and
--        forces a deliberate decision if one ever is.
--    (b) The INV-29 reading -- that a Result reaches its release id and
--        definition version through its session rather than copying them --
--        rests entirely on `assessment_results.session_id` being NOT NULL.
--        Asserted rather than relied upon.
-- ---------------------------------------------------------------------------
create or replace function public.assert_evidence_consumer_boundary()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}'; v_tables text[] := array[
  'assessment_sessions','presented_items','presented_item_views',
  'responses','assessment_results','integrity_signals'];
begin
  select string_agg(distinct g.grantee || ' on ' || g.table_name, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.table_name = any (v_tables)
     and g.grantee not in ('postgres','service_role','supabase_admin','authenticated');
  if bad is not null then
    problems := problems || ('unexpected grantee on raw evidence (amended INV-20): ' || bad);
  end if;

  select string_agg(g.table_name || ':' || g.privilege_type, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.table_name = any (v_tables)
     and g.grantee in ('authenticated','anon') and g.privilege_type <> 'SELECT';
  if bad is not null then
    problems := problems || ('client role holds a write grant on raw evidence: ' || bad);
  end if;

  select string_agg(g.table_name, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.table_name = any (v_tables) and g.grantee = 'anon';
  if bad is not null then problems := problems || ('anon holds a grant on raw evidence: ' || bad); end if;

  -- INV-29 rests on this column being mandatory (round-3 §5)
  if (select is_nullable from information_schema.columns
       where table_schema='public' and table_name='assessment_results' and column_name='session_id') <> 'NO' then
    problems := problems || 'assessment_results.session_id is nullable: a result could carry no provenance at all (INV-29)';
  end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok
    then format('raw evidence (%s tables) is reachable only by the platform roles and by authenticated SELECT under RLS, '
             || 'and every result is anchored to a session by a NOT NULL key (INV-29); no analytics consumer role exists '
             || 'yet, so the amended INV-20 holds but holds VACUOUSLY -- the consumer role is an open decision', cardinality(v_tables))
    else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_evidence_consumer_boundary() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Both new properties become lint counters.
-- ---------------------------------------------------------------------------
create or replace function public.platform_schema_lint() returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v jsonb := '{}'::jsonb; n int; txt text; v_ok boolean;
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

  -- ADDED IN 0037. A LEARNER RPC that never reaches an ownership check.
  select a.ok into v_ok from public.assert_learner_rpcs_are_guarded() a;
  v := v || jsonb_build_object('learner_rpcs_guarded_ok', v_ok);

  -- ADDED IN 0037. A client-executable SECDEF name carrying more than one
  -- signature would silently inherit its sibling's exposure class.
  select count(*) into n from (
    select p.proname from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
     where ns.nspname='public' and p.prosecdef
       and (has_function_privilege('authenticated', p.oid, 'EXECUTE')
         or has_function_privilege('anon', p.oid, 'EXECUTE'))
     group by p.proname having count(*) > 1) x;
  v := v || jsonb_build_object('overloaded_client_rpcs', n);

  select a.ok into v_ok from public.assert_evidence_consumer_boundary() a;
  v := v || jsonb_build_object('evidence_consumer_boundary_ok', v_ok);

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
-- Verification block (ADR-0003).
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text; n int; bad text;
begin
  -- the two are gone from the client surface, and out of the client registry
  foreach bad in array array['finalize_session','session_enforce_deadline'] loop
    if has_function_privilege('authenticated', ('public.' || bad || '(uuid)')::regprocedure, 'EXECUTE')
       or has_function_privilege('anon', ('public.' || bad || '(uuid)')::regprocedure, 'EXECUTE') then
      raise exception '%() is still client-executable: a learner can act on another learner''s session', bad;
    end if;
    if exists (select 1 from public.client_rpc_registry where function_name = bad) then
      raise exception '%() is no longer client-reachable but still carries a client exposure class', bad;
    end if;
  end loop;

  -- ... and the engine still reaches them internally
  if (select count(*) from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
       where ns.nspname='public' and p.proname in ('finalize_session','session_enforce_deadline')) <> 2 then
    raise exception 'the revoke removed a function the engine calls';
  end if;

  select a.ok, a.detail into v_ok, v_detail from public.assert_learner_rpcs_are_guarded() a;
  if not v_ok then raise exception 'ownership reachability: %', v_detail; end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_engine_takes_no_identity() a;
  if not v_ok then raise exception 'RPC exposure contract: %', v_detail; end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_evidence_consumer_boundary() a;
  if not v_ok then raise exception 'amended INV-20 / INV-29: %', v_detail; end if;

  -- PROBE 1, the one that matters: a registered LEARNER RPC that takes only a
  -- resource id and forgets the ownership call. This is the defect class that
  -- has now produced three instances, and nothing in the suite caught it.
  execute 'create function public.zz_forgot_the_guard(p_session uuid) returns integer
             language plpgsql stable security definer set search_path = public, pg_temp as $q$
             begin return (select 1 from public.assessment_sessions where id = p_session); end $q$';
  execute 'grant execute on function public.zz_forgot_the_guard(uuid) to authenticated';
  insert into public.client_rpc_registry values ('zz_forgot_the_guard','LEARNER','probe');
  select a.ok, a.detail into v_ok, v_detail from public.assert_learner_rpcs_are_guarded() a;
  delete from public.client_rpc_registry where function_name = 'zz_forgot_the_guard';
  execute 'drop function public.zz_forgot_the_guard(uuid)';
  if v_ok then
    raise exception 'probe 1 undetected: a LEARNER RPC with no ownership check anywhere in its call graph passed';
  end if;
  if v_detail not like '%zz_forgot_the_guard%' then
    raise exception 'probe 1 caught something, but not by name: %', v_detail;
  end if;

  -- PROBE 2: the walk must be transitive, not depth-0. A LEARNER RPC that
  -- reaches the check only through a helper must PASS, or the gate is noise.
  execute 'create function public.zz_guarded_one_deeper(p_session uuid) returns boolean
             language sql stable security definer set search_path = public, pg_temp
             as $q$ select public.session_is_mine(p_session) $q$';
  execute 'grant execute on function public.zz_guarded_one_deeper(uuid) to authenticated';
  execute 'create function public.zz_guarded_two_deep(p_session uuid) returns boolean
             language sql stable security definer set search_path = public, pg_temp
             as $q$ select public.zz_guarded_one_deeper(p_session) $q$';
  execute 'grant execute on function public.zz_guarded_two_deep(uuid) to authenticated';
  insert into public.client_rpc_registry values
    ('zz_guarded_one_deeper','LEARNER','probe'), ('zz_guarded_two_deep','LEARNER','probe');
  select a.ok into v_ok from public.assert_learner_rpcs_are_guarded() a;
  delete from public.client_rpc_registry where function_name like 'zz_guarded%';
  execute 'drop function public.zz_guarded_two_deep(uuid)';
  execute 'drop function public.zz_guarded_one_deeper(uuid)';
  if not v_ok then
    raise exception 'probe 2: the walk is not transitive -- a function guarded two calls deep was reported unguarded';
  end if;

  -- PROBE 3: re-granting one of the revoked functions must be caught, by the
  -- unregistered-RPC half of the exposure contract.
  execute 'grant execute on function public.finalize_session(uuid) to authenticated';
  select a.ok, a.detail into v_ok, v_detail from public.assert_engine_takes_no_identity() a;
  execute 'revoke all on function public.finalize_session(uuid) from authenticated';
  if v_ok then raise exception 'probe 3 undetected: re-granting finalize_session to a client passed the contract'; end if;

  -- clean after every probe
  select a.ok into v_ok from public.assert_learner_rpcs_are_guarded() a;
  if not v_ok then raise exception 'reachability stayed red after the probes were dropped'; end if;
  select a.ok into v_ok from public.assert_engine_takes_no_identity() a;
  if not v_ok then raise exception 'the exposure contract stayed red after the probes were dropped'; end if;

  -- standing hygiene
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception '% table(s) without RLS', n; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prokind in ('f','p')
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% function(s) in public unpinned: %', n, bad; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;
end $$;
