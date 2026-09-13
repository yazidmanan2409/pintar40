-- 0035 — forward-only repair of a standard that moved without a decision.
--
-- WHAT WAS WRONG. FABLE-01's mini audit found four throwaway `selftest.*`
-- helpers with a mutable `search_path`, treated it as a finding worth fixing,
-- and recorded the advisor counter at zero. Sixteen functions in `public` are
-- now in exactly the state those three helpers were fixed for -- twelve of
-- them directly EXECUTE-able by `authenticated` over PostgREST. Twelve came in
-- with FABLE-02 and four with FABLE-03, none of them deliberately: the rule
-- every migration asserts is `prosecdef and not pinned`, so a SECURITY INVOKER
-- function was never asked the question.
--
-- This is not an exploit and is not claimed as one. These are SECURITY INVOKER
-- functions: they execute with the caller's own rights, and PostgREST sets a
-- fixed `search_path` per request, so there is no privilege to escalate
-- through them today. The defect is that the standard changed silently, and
-- that the project's own gate could not see it change.
--
-- THE GATE IS THE REAL FIX. `platform_schema_lint()`'s counter is
-- `secdef_without_search_path` -- SECURITY DEFINER only. A regression in the
-- invoker half was invisible to the lint, invisible to CI, and surfaced only
-- in an advisor pass nobody is obliged to run. Pinning the sixteen without
-- also widening the counter would fix today's instance and leave tomorrow's
-- equally unobservable, which is the shape of fix doc 01 warns about. So the
-- counter is widened to every function in `public`, and F01-T13 asserts it.
--
-- WHY A CATALOGUE LOOP RATHER THAN SIXTEEN NAMES. The rule being applied is
-- "every function in public pins its search_path", not "these sixteen do". A
-- loop states the rule; a name list states an instance of it and goes stale.
-- Four of the sixteen are referenced by CHECK constraints
-- (`hint_reveals_answer_shape` twice, `media_entries_have_transcripts`,
-- `media_entries_are_storage_paths`); `ALTER FUNCTION ... SET` changes neither
-- signature nor volatility, so the constraints are untouched and not
-- revalidated.
--
-- ALSO HERE: `seeded_index` is revoked from client roles. ADR-0005 §3's stated
-- control is that `option_display_order()` is unreachable by a client, which
-- holds. But the primitive underneath it was reachable, so the shuffle rested
-- on `shuffle_seed` being ungrantable elsewhere rather than on the primitive
-- being unreachable. It has no client use. One line, and the control now
-- stands on its own.

-- ---------------------------------------------------------------------------
-- 1. Pin every unpinned function in public.
-- ---------------------------------------------------------------------------
do $$
declare r record; n int := 0;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public'
       and p.prokind in ('f','p')
       and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%')
  loop
    execute format('alter function %s set search_path = public, pg_temp', r.sig);
    n := n + 1;
  end loop;
  raise notice 'pinned search_path on % function(s) in public', n;
end $$;

-- ---------------------------------------------------------------------------
-- 2. ADR-0005 §3: the shuffle primitive is not a client primitive.
-- ---------------------------------------------------------------------------
revoke all on function public.seeded_index(bigint, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. INV-08, made structural rather than argued.
--
--    The learner-facing engine entry points derive identity from the JWT
--    inside SECURITY DEFINER, so there is no person argument to forge. That is
--    a true statement about today's signatures and nothing held it true: a
--    later signature change would retire it silently. This asserts it instead,
--    and the selftest re-runs it on every build.
-- ---------------------------------------------------------------------------
create function public.assert_engine_takes_no_identity()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; entries text[] := array[
  'start_learning_session','session_paper','sanitized_item','note_item_view',
  'record_answer','session_answers','pause_session','resume_session','submit_session',
  'finish_my_session','finalize_session','session_outcome','session_review',
  'reading_map','learning_delta','my_cycle_state','session_state','assistance_state',
  'open_assistance','dismiss_assistance','record_lesson_progress','learner_lessons',
  'my_learning_assignments','may_start_assessment','may_continue_session',
  'may_read_lesson_media','session_is_mine'];
begin
  select string_agg(p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', ', ')
    into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.proname = any (entries)
     -- deliberately NOT word-bounded: `\y` does not fire inside `p_person`,
     -- because an underscore is a word character. The planted probe in this
     -- migration's verification block caught exactly that.
     and pg_get_function_arguments(p.oid) ~* '(person|institution|evidence_class|mastery|score)';

  ok := bad is null;
  detail := case when ok
                 then format('%s learner entry point(s) take no identity, tenant or score argument',
                             (select count(*) from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
                               where ns.nspname='public' and p.proname = any (entries)))
                 else 'entry point(s) accept a caller-supplied identity or score: ' || bad end;
  return next;
end $$;
revoke all on function public.assert_engine_takes_no_identity() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. The lint sees the invoker half now.
-- ---------------------------------------------------------------------------
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

  -- ADDED IN 0035. The counter above sees SECURITY DEFINER only, so sixteen
  -- SECURITY INVOKER functions drifted unpinned across two phases without the
  -- gate noticing. This one sees every function in public.
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prokind in ('f','p')
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  v := v || jsonb_build_object('functions_without_search_path', n);

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
declare n int; bad text; def text; v_ok boolean; v_detail text;
begin
  -- every function in public is pinned, invoker and definer alike
  select count(*), string_agg(p.proname, ', ') into n, bad
    from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prokind in ('f','p')
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%');
  if n > 0 then raise exception '% function(s) in public still unpinned: %', n, bad; end if;

  -- and the lint can now see that, so the next regression is caught by the gate
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='platform_schema_lint';
  if def not like '%functions_without_search_path%' then
    raise exception 'the lint still counts only SECURITY DEFINER functions';
  end if;
  if def not like '%secdef_without_search_path%' then
    raise exception 'the lint lost its SECURITY DEFINER counter';
  end if;

  -- ADR-0005 §3: neither the wrapper nor the primitive is client-reachable
  foreach bad in array array['option_display_order','seeded_index'] loop
    select string_agg(r.rolname, ', ') into def from pg_proc p
      join pg_namespace ns on ns.oid=p.pronamespace, unnest(array['anon','authenticated']) r(rolname)
     where ns.nspname='public' and p.proname = bad
       and has_function_privilege(r.rolname, p.oid, 'EXECUTE');
    if def is not null then
      raise exception '%() is executable by %: the option shuffle would be reconstructable', bad, def;
    end if;
  end loop;

  -- INV-08 is asserted, not argued
  select a.ok, a.detail into v_ok, v_detail from public.assert_engine_takes_no_identity() a;
  if not v_ok then raise exception 'INV-08: %', v_detail; end if;

  -- ... and the assertion bites: a planted entry point taking a person is caught
  execute 'create function public.session_state(p_session uuid, p_person uuid) returns integer
             language sql stable as $q$ select 1 $q$';
  select a.ok into v_ok from public.assert_engine_takes_no_identity() a;
  execute 'drop function public.session_state(uuid, uuid)';
  if v_ok then
    raise exception 'the INV-08 assertion passed with an entry point accepting a person argument';
  end if;
  select a.ok into v_ok from public.assert_engine_takes_no_identity() a;
  if not v_ok then raise exception 'the INV-08 assertion stayed red after the probe was dropped'; end if;

  -- standing hygiene, unchanged
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;
  select count(*) into n from pg_tables where schemaname='public' and not rowsecurity;
  if n > 0 then raise exception '% table(s) without RLS', n; end if;
end $$;
