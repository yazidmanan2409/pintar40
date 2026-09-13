-- 0036 — the same criticism 0035 made of the lint, turned on 0035's own work.
--
-- WHAT WAS WRONG. 0035 pinned `search_path` by catalogue loop and said why:
-- "a name list states an instance and goes stale." It then built
-- `assert_engine_takes_no_identity()` on `entries text[] := array[…27 names…]`.
-- A FABLE-04 entry point is simply not in that array, so the assertion passes
-- and reports 27 while the twenty-eighth goes unexamined. The check could not
-- fail for a function it did not know about, and the phase that adds new
-- client-reachable RPCs is the next one. Claude 1's round-2 review, §3.1.
--
-- Two more instances of the same mistake, from §3.2 and §3.3:
--   * the identity vocabulary was an instance list too. It matched
--     `person|institution|evidence_class|mastery|score` and missed
--     `enrollment` -- and `open_assessment_session(p_enrollment, …)` is
--     precisely the identity-bearing shape the assertion exists to catch.
--   * the assertion inspects argument names and types. It cannot tell a
--     resource id from an identity, and `p_session uuid` passes correctly
--     because ownership is enforced by `session_is_mine` and the definer body.
--     It is a tripwire, not the INV-08 proof. Said plainly here and in the
--     manifest so a green result is never read as more than it is.
--
-- WHAT REPLACES THE LIST. A registry table, in the shape of
-- `record_class_registry` and `item_type_registry`: every SECURITY DEFINER
-- function in `public` that a client role can execute must carry a
-- classification. LEARNER entry points must take no identity-bearing argument.
-- STAFF and PLATFORM functions may, because a staff RPC legitimately names the
-- person it acts on and a policy helper legitimately takes the row it judges.
-- The assertion then checks the *property*, both ways:
--
--   a. every client-executable SECDEF function has a registry row -- so a new
--      unclassified RPC fails the build instead of being skipped by it;
--   b. every registry row still names a real function -- so the registry
--      cannot rot into a list of things that no longer exist;
--   c. every LEARNER row takes no identity-bearing argument.
--
-- AND IT FOUND SOMETHING. Classifying all 54 surfaced a defect neither review
-- caught, because it is not a learner entry point and would never have been in
-- anybody's name list: `excluded_items_for_post_test(p_person, p_learning_assignment)`
-- is SECURITY DEFINER, has no ownership check in its body, and was granted to
-- `authenticated`. Any signed-in learner could pass another learner's person id
-- and read back which items that learner was shown in their pre-test. Verified
-- against seeded data: learner A queried learner B and received 7 rows. It is
-- called only from inside `drawable_items_for_definition` and `assemble_session`,
-- both SECURITY DEFINER and both server-side, so the grant buys nothing. It is
-- revoked below. INV-13, and the reason the set is derived rather than listed.

-- ---------------------------------------------------------------------------
-- 1. The over-grant, revoked.
-- ---------------------------------------------------------------------------
revoke all on function public.excluded_items_for_post_test(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. The classification registry.
-- ---------------------------------------------------------------------------
create type public.rpc_exposure as enum ('LEARNER', 'STAFF', 'PLATFORM');

create table public.client_rpc_registry (
  function_name text primary key,
  exposure      public.rpc_exposure not null,
  note          text not null check (btrim(note) <> '')
);
alter table public.client_rpc_registry enable row level security;
-- no grant and no policy: this is a build-time contract, not client data.

insert into public.client_rpc_registry values
  -- LEARNER — reachable by a learner acting on their own work. Identity comes
  -- from the JWT inside the definer body; none may take it as an argument.
  ('assistance_state',              'LEARNER',  'hesitation state for one delivered item'),
  ('dismiss_assistance',            'LEARNER',  'learner declines the offered help'),
  ('finalize_session',              'LEARNER',  'scores a submitted session; writes what the evaluator returned'),
  ('finish_my_session',             'LEARNER',  'submit + finalize, own session only'),
  ('learner_lessons',               'LEARNER',  'lesson prose for an assigned release'),
  ('learning_delta',                'LEARNER',  'pre/post delta, computed on read'),
  ('may_continue_session',          'LEARNER',  'continue permission (INV-27)'),
  ('may_read_lesson_media',         'LEARNER',  'per-object media authority for the asset route'),
  ('may_start_assessment',          'LEARNER',  'start eligibility (INV-27)'),
  ('my_cycle_state',                'LEARNER',  'where the learner is in the cycle'),
  ('my_learning_assignments',       'LEARNER',  'what is assigned to the caller'),
  ('note_item_view',                'LEARNER',  'server-stamped first view of a delivered item'),
  ('open_assistance',               'LEARNER',  'serves one assistance level, re-checked against INV-02'),
  ('pause_session',                 'LEARNER',  'lifecycle, own session only'),
  ('reading_map',                   'LEARNER',  'personal reading map, derived from own evidence'),
  ('record_answer',                 'LEARNER',  'append-only response receipt (INV-28)'),
  ('record_lesson_progress',        'LEARNER',  'never-regressing reading position'),
  ('resume_session',                'LEARNER',  'lifecycle, own session only'),
  ('sanitized_item',                'LEARNER',  'the allow-listed learner payload (INV-01)'),
  ('session_answers',               'LEARNER',  'what the server holds for the caller''s session'),
  ('session_enforce_deadline',      'LEARNER',  'authoritative deadline evaluation'),
  ('session_is_mine',               'LEARNER',  'ownership predicate; the INV-08 guarantee proper'),
  ('session_outcome',               'LEARNER',  'result payload; no verdict on a pre-test'),
  ('session_paper',                 'LEARNER',  'the delivered paper, sanitized'),
  ('session_review',                'LEARNER',  'post-test review; refuses a pre-test'),
  ('session_state',                 'LEARNER',  'lifecycle and counts, never which items'),
  ('start_learning_session',        'LEARNER',  'assembles and opens a session'),
  ('submit_session',                'LEARNER',  'lifecycle, idempotent at FINALIZED'),

  -- STAFF — legitimately names the person, institution or course it acts on.
  -- Each enforces its own capability check; the argument is the subject of the
  -- action, not a claim about who is calling.
  ('exam_item_is_cooled',           'STAFF',    'exposure cooling for a cohort (INV-24 support)'),
  ('grant_role',                    'STAFF',    'INV-16 anti-escalation enforced in body'),
  ('ingest_structured_package',     'STAFF',    'authoring ingestion; CAN_DRAFT'),
  ('move_learning_assignment_release','STAFF',  'audited release move; CAN_ASSIGN_LEARNING'),
  ('period_rollover',               'STAFF',    'INV-23 rollover; INSTITUTION_ADMIN'),
  ('platform_schema_lint',          'STAFF',    'SYSTEM_ADMIN only; refuses everyone else (INV-37)'),
  ('propose_easy_upload_mapping',   'STAFF',    'proposes, never materialises (INV-32)'),
  ('publish_readiness',             'STAFF',    'readiness projection for a course (INV-35)'),
  ('revoke_role',                   'STAFF',    'INV-18 audited revocation'),
  ('run_mcq_quality',               'STAFF',    'MCQ quality pass over a course'),
  ('transfer_authorize',            'STAFF',    'INV-25 transfer lifecycle'),
  ('transfer_execute',              'STAFF',    'INV-25 transfer lifecycle'),
  ('transfer_reject',               'STAFF',    'INV-25 transfer lifecycle'),
  ('transfer_request',              'STAFF',    'INV-25 transfer lifecycle'),
  ('validate_course_content',       'STAFF',    'content validator; CAN_DRAFT'),

  -- PLATFORM — authorization predicates and policy helpers. They take the row
  -- or subject being judged; that is what they are for.
  ('can_in_institution',            'PLATFORM', 'capability predicate used by policies'),
  ('can_on_node',                   'PLATFORM', 'capability predicate used by policies'),
  ('current_person_id',             'PLATFORM', 'the JWT-derived identity every learner path uses'),
  ('enrollment_readable',           'PLATFORM', 'policy helper, by value (read_helpers_by_value)'),
  ('flag_enabled',                  'PLATFORM', 'feature flag predicate'),
  ('has_scope',                     'PLATFORM', 'role-scope predicate'),
  ('is_member_of_institution',      'PLATFORM', 'tenant predicate used by policies'),
  ('is_system_admin',               'PLATFORM', 'platform-admin predicate'),
  ('membership_readable',           'PLATFORM', 'policy helper, by value'),
  ('person_visible_to_me',          'PLATFORM', 'visibility predicate used by policies');

insert into public.record_class_registry values
  ('client_rpc_registry', 'INSTITUTION_SCOPED', 'build-time contract, not learner evidence');

-- ---------------------------------------------------------------------------
-- 3. The assertion, derived from the property rather than from a list.
-- ---------------------------------------------------------------------------
create or replace function public.assert_engine_takes_no_identity()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}'; n_learner int; n_total int;
begin
  -- (a) every client-executable SECURITY DEFINER function is classified.
  --     This is the half a name list cannot do: a new RPC that nobody
  --     remembered to register fails here instead of being skipped.
  select string_agg(distinct p.proname, ', ') into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prosecdef
     and (has_function_privilege('authenticated', p.oid, 'EXECUTE')
       or has_function_privilege('anon', p.oid, 'EXECUTE'))
     and not exists (select 1 from public.client_rpc_registry r where r.function_name = p.proname);
  if bad is not null then
    problems := problems || ('client-executable SECDEF function(s) with no exposure class: ' || bad);
  end if;

  -- (b) and the registry cannot rot: every row still names a real function
  select string_agg(r.function_name, ', ') into bad
    from public.client_rpc_registry r
   where not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
                      where ns.nspname='public' and p.proname = r.function_name);
  if bad is not null then
    problems := problems || ('registry row(s) naming no existing function: ' || bad);
  end if;

  -- (c) a LEARNER entry point takes no identity-bearing argument. The
  --     vocabulary is deliberately wide and deliberately not word-bounded:
  --     `\y` does not fire inside `p_person` because an underscore is a word
  --     character, and `enrollment` is here because
  --     `open_assessment_session(p_enrollment, …)` is exactly this shape.
  select string_agg(p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')', ', ')
    into bad
    from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
    join public.client_rpc_registry r on r.function_name = p.proname and r.exposure = 'LEARNER'
   where ns.nspname = 'public'
     and pg_get_function_arguments(p.oid) ~*
         '(person|institution|enrollment|learner|user|actor|account|evidence_class|mastery|score|grade|mark)';
  if bad is not null then
    problems := problems || ('LEARNER entry point(s) accept a caller-supplied identity or score: ' || bad);
  end if;

  select count(*) filter (where exposure = 'LEARNER'), count(*)
    into n_learner, n_total from public.client_rpc_registry;

  ok := array_length(problems, 1) is null;
  detail := case when ok then format(
      '%s client-reachable SECDEF RPC(s) classified (%s LEARNER); no LEARNER entry point takes an identity argument. '
      || 'This is a signature tripwire, not the INV-08 proof: ownership is enforced by session_is_mine and the '
      || 'definer bodies, which F03-T10 exercises.', n_total, n_learner)
    else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_engine_takes_no_identity() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. INV-20 as AMENDED, which is stronger than the text FABLE-02 was built on.
--
--    The baseline amendment (2026-09-12, which reached this repository only
--    today) requires that non-OFFICIAL evidence be excluded *structurally*:
--    consumers "read only eligibility-filtered base views/functions and hold no
--    direct grant on raw evidence tables". FABLE-02's boundary was built
--    against the earlier wording and satisfies the new one **vacuously**: no
--    analytics, reporting, psychometric or Question Health consumer role exists
--    yet, so there is nothing holding a forbidden grant.
--
--    Vacuous satisfaction is the failure mode worth guarding, because the
--    moment FABLE-06 creates that consumer the invariant is decided by whoever
--    types the GRANT. This does not decide the design -- that is an
--    architectural choice about the analytics role and is deliberately left
--    open -- it makes the decision impossible to take by accident. The expected
--    grantees on raw evidence are enumerated; any role outside that set fails
--    the build the moment it appears.
--
--    `service_role` is expected here and is not a finding by itself: it is the
--    platform's own role and Supabase grants it by default. It IS the open
--    question, recorded in the checkpoint -- if FABLE-06 runs analytics as
--    `service_role`, the amended INV-20 is violated by construction, because
--    that consumer holds full direct grants on every raw evidence table.
-- ---------------------------------------------------------------------------
create function public.assert_evidence_consumer_boundary()
returns table (ok boolean, detail text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare bad text; problems text[] := '{}'; v_tables text[] := array[
  'assessment_sessions','presented_items','presented_item_views',
  'responses','assessment_results','integrity_signals'];
begin
  -- any grantee on raw evidence beyond the platform's own roles
  select string_agg(distinct g.grantee || ' on ' || g.table_name, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.table_name = any (v_tables)
     and g.grantee not in ('postgres','service_role','supabase_admin','authenticated');
  if bad is not null then
    problems := problems || ('unexpected grantee on raw evidence (amended INV-20): ' || bad);
  end if;

  -- a learner may read their own rows under RLS; a learner may never write them
  select string_agg(g.table_name || ':' || g.privilege_type, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.table_name = any (v_tables)
     and g.grantee in ('authenticated','anon') and g.privilege_type <> 'SELECT';
  if bad is not null then
    problems := problems || ('client role holds a write grant on raw evidence: ' || bad);
  end if;

  -- anon touches none of it at all
  select string_agg(g.table_name, ', ') into bad
    from information_schema.role_table_grants g
   where g.table_schema = 'public' and g.table_name = any (v_tables) and g.grantee = 'anon';
  if bad is not null then problems := problems || ('anon holds a grant on raw evidence: ' || bad); end if;

  ok := array_length(problems, 1) is null;
  detail := case when ok
    then format('raw evidence (%s tables) is reachable only by the platform roles and by authenticated SELECT under RLS; '
             || 'no analytics consumer role exists yet, so the amended INV-20 holds but holds VACUOUSLY -- '
             || 'the consumer role is an open decision (see FABLE-03 checkpoint)', cardinality(v_tables))
    else array_to_string(problems, '; ') end;
  return next;
end $$;
revoke all on function public.assert_evidence_consumer_boundary() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Both become lint counters, so the gate sees them without anyone asking.
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

  -- ADDED IN 0036. A client-reachable SECDEF function with no exposure class.
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and (has_function_privilege('authenticated', p.oid, 'EXECUTE')
       or has_function_privilege('anon', p.oid, 'EXECUTE'))
     and not exists (select 1 from public.client_rpc_registry r where r.function_name = p.proname);
  v := v || jsonb_build_object('unclassified_client_rpcs', n);

  -- ADDED IN 0036. Amended INV-20: a consumer holding direct raw-evidence grants.
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
-- Verification block (ADR-0003). Three planted probes, because the failure
-- this migration repairs was an assertion that could not fail.
-- ---------------------------------------------------------------------------
do $$
declare v_ok boolean; v_detail text; n int; bad text;
begin
  -- the over-grant is gone
  if has_function_privilege('authenticated', 'public.excluded_items_for_post_test(uuid,uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.excluded_items_for_post_test(uuid,uuid)', 'EXECUTE') then
    raise exception 'excluded_items_for_post_test is still client-executable: a learner can read another learner''s exposure (INV-13)';
  end if;

  select a.ok, a.detail into v_ok, v_detail from public.assert_engine_takes_no_identity() a;
  if not v_ok then raise exception 'RPC exposure contract: %', v_detail; end if;
  select a.ok, a.detail into v_ok, v_detail from public.assert_evidence_consumer_boundary() a;
  if not v_ok then raise exception 'amended INV-20: %', v_detail; end if;

  -- PROBE 1: a LEARNER entry point taking a person
  execute 'create function public.session_state(p_session uuid, p_person uuid) returns integer
             language sql stable security definer set search_path = public, pg_temp as $q$ select 1 $q$';
  select a.ok into v_ok from public.assert_engine_takes_no_identity() a;
  execute 'drop function public.session_state(uuid, uuid)';
  if v_ok then raise exception 'probe 1 undetected: a LEARNER entry point accepting p_person passed'; end if;

  -- PROBE 2: the same, taking an enrollment -- the word the old vocabulary missed
  execute 'create function public.session_state(p_session uuid, p_enrollment uuid) returns integer
             language sql stable security definer set search_path = public, pg_temp as $q$ select 1 $q$';
  select a.ok into v_ok from public.assert_engine_takes_no_identity() a;
  execute 'drop function public.session_state(uuid, uuid)';
  if v_ok then raise exception 'probe 2 undetected: a LEARNER entry point accepting p_enrollment passed'; end if;

  -- PROBE 3: the one a name list can never catch -- a brand-new client RPC
  -- that nobody registered. This is the finding this migration exists for.
  execute 'create function public.zz_unregistered_rpc(p_x uuid) returns integer
             language sql stable security definer set search_path = public, pg_temp as $q$ select 1 $q$';
  execute 'grant execute on function public.zz_unregistered_rpc(uuid) to authenticated';
  select a.ok, a.detail into v_ok, v_detail from public.assert_engine_takes_no_identity() a;
  execute 'drop function public.zz_unregistered_rpc(uuid)';
  if v_ok then
    raise exception 'probe 3 undetected: an unregistered client-executable SECDEF function passed the contract';
  end if;
  if v_detail not like '%zz_unregistered_rpc%' then
    raise exception 'probe 3 caught something, but not by name: %', v_detail;
  end if;

  -- and clean again after every probe
  select a.ok into v_ok from public.assert_engine_takes_no_identity() a;
  if not v_ok then raise exception 'the contract stayed red after the probes were dropped'; end if;

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
  if not exists (select 1 from public.record_class_registry where table_name = 'client_rpc_registry') then
    raise exception 'client_rpc_registry has no record class';
  end if;
end $$;
