-- UX-1 Slice 2, screen D. LOOKING IS NOT COMMITTING.
--
-- Measured on the frozen build before anything was written here, and every one
-- of the Experience branch's findings reproduced:
--
--   * the orientation facts a learner needs before starting -- how many
--     questions, when it closes, whether it can be paused, whether this is
--     their only attempt -- are held on assessment_definitions and
--     assessment_assignments, and BOTH are closed to a learner:
--     assessment_definitions SELECT requires can_in_institution('CAN_DRAFT'),
--     assessment_assignments SELECT requires CAN_DRAFT or CAN_ASSIGN_LEARNING;
--   * session_state(p_session) returns exactly those facts -- item_count,
--     authoritative_deadline, allows_pause, hesitation_window_seconds -- and
--     needs a session to return them;
--   * the only thing that creates a session is start_learning_session(), which
--     IS the commitment: it stamps started_at and counts against attempt_limit,
--     which is 1 for PRE_TEST, for seven of eight POST_TEST definitions and for
--     seven of twelve QUICK definitions. Starting to find out what you are
--     starting can spend the only attempt there is;
--   * assessment_definition_bounds IS learner-readable, and holds PLATFORM
--     bounds per mode (3-60 items) -- not this assignment's actual count. A
--     range is not a fact about the thing in front of you.
--
-- So the learner was asked to open the door to find out what was behind it.
--
-- THIS FUNCTION INVENTS NOTHING. Every column it returns already exists on the
-- definition or the assignment, and the set is a strict subset of what
-- session_state() hands the same learner one second later. closes_at is the
-- same value start_learning_session() assigns as the session's authoritative
-- deadline, read from the same column, so the window shown before is the
-- deadline enforced after.
--
-- NOR DOES IT DECIDE ANYTHING. Authorization is may_start_assessment() -- the
-- predicate start_learning_session() itself calls -- so a learner can look at
-- exactly what they could start, and one rule answers both questions. That is
-- the same delegation the Q-12 doorway uses.
--
-- IT REFUSES BY SAYING NOTHING. An assignment that is not the caller's and an
-- assignment that does not exist both return zero rows. Raising 'unknown
-- assignment' for one and 'not yours' for the other would make existence an
-- oracle, which is the defect F06-N01 exists to prevent; the two cases are
-- deliberately indistinguishable here.
--
-- WHAT IT DOES NOT ANSWER, because the frozen model does not hold it: there is
-- no duration or time-limit field on an assessment definition.
-- hesitation_window_seconds is per-item telemetry and late_sync_grace_seconds
-- is offline tolerance; neither is "how long will this take". The only time
-- fact that exists is the assignment window, and it is returned as itself.
-- ---------------------------------------------------------------------------

create function public.assessment_orientation(p_assessment_assignment uuid)
returns table (mode public.assessment_mode,
               title text,
               item_count smallint,
               allows_pause boolean,
               hesitation_window_seconds integer,
               opens_at timestamptz,
               closes_at timestamptz,
               attempt_limit smallint,
               attempts_used integer)
language sql stable security definer set search_path = public, pg_temp as $function$
  select d.mode, d.title, d.item_count, d.allows_pause, d.hesitation_window_seconds,
         aa.opens_at, aa.closes_at, d.attempt_limit,
         (select count(*)::integer from public.assessment_sessions s
           where s.assessment_assignment_id = aa.id
             and s.person_id = public.current_person_id())
    from public.assessment_assignments aa
    join public.assessment_definitions d on d.id = aa.assessment_definition_id
   where aa.id = p_assessment_assignment
     and public.current_person_id() is not null
     and (select e.ok from public.may_start_assessment(aa.id) e)
$function$;
revoke all on function public.assessment_orientation(uuid) from public, anon;
grant execute on function public.assessment_orientation(uuid) to authenticated, service_role;

insert into public.client_rpc_registry (function_name, exposure, note) values
  ('assessment_orientation', 'LEARNER',
   'what a learner may know about an assessment BEFORE the act that starts it. Reads nothing '
   'session_state() would not show a second later, decides nothing may_start_assessment() has not '
   'already decided, and creates no session.');

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014). Every row is built here and rolled back;
-- nothing below assumes a seeded persona, class or assignment.
--
-- The claim is not "a row came back". It is: the learner who could start this
-- can read its facts; reading leaves NO session, NO started_at and spends NO
-- attempt; and a learner it is not addressed to gets the same silence as a
-- uuid that does not exist.
-- ---------------------------------------------------------------------------
do $$
declare
  v_inst uuid; v_period uuid; v_root uuid; v_fac uuid; v_dept uuid; v_prog uuid;
  v_cohort uuid; v_class_a uuid; v_class_b uuid; v_course uuid; v_module uuid;
  v_uid_a uuid; v_uid_b uuid; v_uid_t uuid; v_p_a uuid; v_p_b uuid; v_p_t uuid;
  v_e_a uuid; v_e_b uuid; v_def uuid; v_assign uuid;
  n int; n_sessions_before int; n_sessions_after int;
  v_items smallint; v_limit smallint; v_used int; v_closes timestamptz;
begin
  begin
    insert into public.institutions (id, name, slug, is_synthetic, is_active)
    values (gen_random_uuid(), 'probe inst 0088', 'probe-inst-0088', true, true)
    returning institutions.id into v_inst;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/27', current_date - 30, current_date + 300)
    returning academic_periods.id into v_period;
    select o.id into v_root from public.org_nodes o
     where o.institution_id = v_inst and o.kind = 'INSTITUTION';
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_root, 'FACULTY', 'F') returning org_nodes.id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'D') returning org_nodes.id into v_dept;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dept, 'PROGRAMME', 'P') returning org_nodes.id into v_prog;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_prog, 'COHORT', 'K', v_period) returning org_nodes.id into v_cohort;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_cohort, 'CLASS', 'A', v_period) returning org_nodes.id into v_class_a;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_cohort, 'CLASS', 'B', v_period) returning org_nodes.id into v_class_b;

    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0088-a@local.invalid')
    returning users.id into v_uid_a;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0088-b@local.invalid')
    returning users.id into v_uid_b;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0088-t@local.invalid')
    returning users.id into v_uid_t;
    select a.person_id into v_p_a from public.accounts a where a.auth_user_id = v_uid_a;
    select a.person_id into v_p_b from public.accounts a where a.auth_user_id = v_uid_b;
    select a.person_id into v_p_t from public.accounts a where a.auth_user_id = v_uid_t;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (v_p_a, v_inst, v_period, v_prog, 'ACTIVE') returning enrollments.id into v_e_a;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (v_p_b, v_inst, v_period, v_prog, 'ACTIVE') returning enrollments.id into v_e_b;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_e_a, v_class_a, v_period), (v_e_b, v_class_b, v_period);
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_p_t, 'EDUCATOR', v_class_a, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);

    insert into public.courses (institution_id, subject, stage, grade_label, title)
    values (v_inst, 'Probe', 'SD', '5', 'Probe course 0088') returning courses.id into v_course;
    insert into public.modules (institution_id, course_id, title, ordinal)
    values (v_inst, v_course, 'Probe module', 1) returning modules.id into v_module;
    insert into public.assessment_definitions
      (institution_id, module_id, title, mode, bank_type, version, item_count, is_ad_hoc,
       allows_pause, attempt_limit)
    values (v_inst, v_module, 'Kuis probe 0088', 'QUICK', 'TEST', 1, 7, true, false, 1)
    returning assessment_definitions.id into v_def;
    insert into public.assessment_assignments
      (institution_id, assessment_definition_id, node_id, academic_period_id, opens_at, closes_at)
    values (v_inst, v_def, v_class_a, v_period, now() - interval '1 minute', now() + interval '20 minutes')
    returning assessment_assignments.id into v_assign;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_t, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_t::text, true);
    update public.assessment_assignments set status = 'SCHEDULED'
     where assessment_assignments.id = v_assign;
    update public.assessment_assignments set status = 'OPEN'
     where assessment_assignments.id = v_assign;
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);

    select count(*) into n_sessions_before from public.assessment_sessions;

    -- --------------------------------------------------------- the window --
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_a, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_a::text, true);
    execute 'set local role authenticated';

    select o.item_count, o.attempt_limit, o.attempts_used, o.closes_at
      into v_items, v_limit, v_used, v_closes
      from public.assessment_orientation(v_assign) o;
    if v_items is null then
      raise exception 'the learner who may start this cannot read its facts';
    end if;
    if v_items <> 7 then
      raise exception 'orientation reported % questions; the definition says 7', v_items;
    end if;
    if v_limit <> 1 or v_used <> 0 then
      raise exception 'orientation reported attempt % of %; the learner has used none of one', v_used, v_limit;
    end if;
    if v_closes is null then
      raise exception 'orientation carries no closing time, which is the only time fact that exists';
    end if;

    -- the learner it is NOT addressed to, and a uuid that does not exist,
    -- must be indistinguishable
    execute 'reset role';
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_b, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_b::text, true);
    execute 'set local role authenticated';
    select count(*) into n from public.assessment_orientation(v_assign);
    if n <> 0 then raise exception 'a learner of another class read the orientation'; end if;
    execute 'reset role';

    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_a, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_a::text, true);
    execute 'set local role authenticated';
    select count(*) into n from public.assessment_orientation(gen_random_uuid());
    if n <> 0 then
      raise exception 'a uuid that does not exist answered differently from one that is not yours';
    end if;
    execute 'reset role';

    -- --------------------------------------------- LOOKING LEFT NO TRACE --
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    select count(*) into n_sessions_after from public.assessment_sessions;
    if n_sessions_after <> n_sessions_before then
      raise exception 'looking changed the session count % -> %', n_sessions_before, n_sessions_after;
    end if;
    select count(*) into n from public.assessment_sessions s
     where s.assessment_assignment_id = v_assign;
    if n <> 0 then raise exception 'looking created % session(s) against the assignment', n; end if;

    raise exception 'ROLLBACK_PROBE';
  exception when others then
    begin execute 'reset role'; exception when others then null; end;
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  select count(*) into n from public.institutions where slug = 'probe-inst-0088';
  if n <> 0 then raise exception 'the probe left its institution behind'; end if;

  -- structural: the window decides nothing of its own, and creates nothing
  if pg_get_functiondef('public.assessment_orientation(uuid)'::regprocedure) !~ 'may_start_assessment' then
    raise exception 'assessment_orientation does not defer to may_start_assessment; that is a second authorization path';
  end if;
  if (select p.provolatile from pg_proc p
       where p.proname = 'assessment_orientation' and p.pronamespace = 'public'::regnamespace) <> 's' then
    raise exception 'assessment_orientation is not STABLE; a window that may write is not a window';
  end if;

  raise notice '0088 verified: a learner may look at what they could start, and looking starts nothing';
end $$;
