-- Q-12. A learner could EXECUTE a Quick Assessment and could not FIND one.
--
-- Measured on the frozen build before anything was written here:
--
--   * the two learner discovery roots are my_learning_assignments() and
--     authorized_canonical_items();
--   * my_learning_assignments() reaches assessment_assignments only through
--     `learning_assignment_id = la.id`, and projects exactly two of them, by
--     `d.mode = 'PRE_TEST'` and `d.mode = 'POST_TEST'` written into the body;
--   * my_cycle_state(p_learning_assignment) is scoped to a learning assignment
--     and carries the same restriction;
--   * launch_quick_assessment() inserts an assessment_assignment with a node_id
--     and NO learning_assignment_id -- the column is simply not in the insert;
--   * assessment_assignments is RLS-enabled and its SELECT policy reads
--     `can_in_institution('CAN_DRAFT') or can_in_institution('CAN_ASSIGN_LEARNING')`,
--     neither of which a STUDENT holds, so the table is unreadable to a learner;
--   * may_start_assessment(p_assessment_assignment) authorizes by assignment
--     status, window, ACTIVE enrolment in the assignment's institution and
--     ACTIVE membership under the assigned node -- it takes the id and asks no
--     question the learner cannot already satisfy;
--   * start_learning_session() was changed in 0062 to accept an assignment with
--     no learning assignment when the definition is ad hoc.
--
-- So the authorization to start one of these exists and works. What does not
-- exist is any way for the learner to learn the id. That is the whole defect:
-- a doorway, not a room.
--
-- THIS FUNCTION ADDS NO AUTHORITY. It does not decide who may start what. It
-- calls may_start_assessment() -- the same predicate start_learning_session()
-- calls -- once per candidate and returns the ones that answer ok. One
-- authorization primitive, asked by both, exactly as doc 05 requires of the
-- API and the UI. If the rule changes, both change together, because there is
-- only one rule.
--
-- The candidate set is `learning_assignment_id is null`: precisely the
-- assignments no other learner surface can express. It is deliberately NOT
-- filtered by mode. Restricting it to QUICK and PRACTICE would be a product
-- rule about which permitted assessments a learner is allowed to see, and this
-- migration is not the place to invent one -- authorization already decides,
-- and discovery of something you are authorized to start discloses nothing.
-- `status = 'OPEN'` is a pre-filter for cost only; may_start_assessment checks
-- it again and remains the authority, so a divergence could only ever
-- under-disclose, never over-disclose.
-- ---------------------------------------------------------------------------

create function public.my_open_assessments()
returns table (assessment_assignment_id uuid,
               mode public.assessment_mode,
               title text,
               node_id uuid,
               node_name text,
               item_count smallint,
               opens_at timestamptz,
               closes_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $function$
  select aa.id, d.mode, d.title, aa.node_id, n.name, d.item_count, aa.opens_at, aa.closes_at
    from public.assessment_assignments aa
    join public.assessment_definitions d on d.id = aa.assessment_definition_id
    join public.org_nodes n on n.id = aa.node_id
   where aa.learning_assignment_id is null
     and aa.status = 'OPEN'
     and public.current_person_id() is not null
     and (select s.ok from public.may_start_assessment(aa.id) s)
   order by aa.opens_at desc nulls last, aa.id
$function$;
revoke all on function public.my_open_assessments() from public, anon;
grant execute on function public.my_open_assessments() to authenticated, service_role;

insert into public.client_rpc_registry (function_name, exposure, note) values
  ('my_open_assessments', 'LEARNER',
   'the assignments a learner may start that no learning assignment names -- Quick and Practice. '
   'Takes no argument and decides nothing: it returns the candidates may_start_assessment() accepts.');

-- ---------------------------------------------------------------------------
-- Terminal verification (ADR-0014). Every row is built here and rolled back;
-- nothing below assumes a seeded persona, class or assignment.
--
-- The claim is not "a row came back". It is: the learner the assignment was
-- scoped to finds it, a learner of the same institution in a different class
-- does not, the set is EXACTLY what may_start_assessment() accepts, and closing
-- the assignment or letting its window pass removes it from view.
-- ---------------------------------------------------------------------------
do $$
declare
  v_inst uuid; v_period uuid; v_root uuid; v_fac uuid; v_dept uuid; v_prog uuid;
  v_cohort uuid; v_class_a uuid; v_class_b uuid;
  v_uid_a uuid; v_uid_b uuid; v_p_a uuid; v_p_b uuid; v_e_a uuid; v_e_b uuid;
  v_uid_t uuid; v_p_t uuid;
  v_def uuid; v_assign uuid; v_course uuid; v_module uuid; n int; n_disagree int;
begin
  begin
    insert into public.institutions (id, name, slug, is_synthetic, is_active)
    values (gen_random_uuid(), 'probe inst 0087', 'probe-inst-0087', true, true)
    returning institutions.id into v_inst;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/27', current_date - 30, current_date + 300)
    returning academic_periods.id into v_period;

    -- the institution's root node already exists: creating an institution
    -- creates it, with id = institutions.id
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

    -- two learners of the SAME institution, in different classes
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0087-a@local.invalid')
    returning users.id into v_uid_a;
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0087-b@local.invalid')
    returning users.id into v_uid_b;
    select a.person_id into v_p_a from public.accounts a where a.auth_user_id = v_uid_a;
    select a.person_id into v_p_b from public.accounts a where a.auth_user_id = v_uid_b;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (v_p_a, v_inst, v_period, v_prog, 'ACTIVE') returning enrollments.id into v_e_a;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (v_p_b, v_inst, v_period, v_prog, 'ACTIVE') returning enrollments.id into v_e_b;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_e_a, v_class_a, v_period), (v_e_b, v_class_b, v_period);

    -- and the educator who opens it, because opening is a capability act
    insert into auth.users (id, email) values (gen_random_uuid(), 'probe-0087-t@local.invalid')
    returning users.id into v_uid_t;
    select a.person_id into v_p_t from public.accounts a where a.auth_user_id = v_uid_t;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_p_t, 'EDUCATOR', v_class_a, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);

    -- an ad-hoc assignment scoped to class A and named by no learning assignment,
    -- which is the shape launch_quick_assessment() produces
    insert into public.courses (institution_id, subject, stage, grade_label, title)
    values (v_inst, 'Probe', 'SD', '5', 'Probe course 0087') returning courses.id into v_course;
    insert into public.modules (institution_id, course_id, title, ordinal)
    values (v_inst, v_course, 'Probe module', 1) returning modules.id into v_module;
    insert into public.assessment_definitions
      (institution_id, module_id, title, mode, bank_type, version, item_count, is_ad_hoc)
    values (v_inst, v_module, 'Kuis probe 0087', 'QUICK', 'TEST', 1, 5, true)
    returning assessment_definitions.id into v_def;
    -- created at DRAFT and walked to OPEN through the declared transitions,
    -- exactly as launch_quick_assessment() does
    insert into public.assessment_assignments
      (institution_id, assessment_definition_id, node_id, academic_period_id,
       opens_at, closes_at)
    values (v_inst, v_def, v_class_a, v_period, now() - interval '1 minute',
            now() + interval '20 minutes')
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

    -- ---------------------------------------------------------- the doorway --
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_a, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_a::text, true);
    -- AS THE CLIENT ROLE, because RLS does not apply to the owner and a probe
    -- that reads as the owner proves nothing about what a learner can see
    execute 'set local role authenticated';

    select count(*) into n from public.my_open_assessments() o
     where o.assessment_assignment_id = v_assign;
    if n <> 1 then
      raise exception 'the learner the assignment was scoped to cannot find it (% row(s))', n;
    end if;
    -- and no other surface could have told them
    select count(*) into n from public.my_learning_assignments() m
     where m.pre_test_assignment = v_assign or m.post_test_assignment = v_assign;
    if n <> 0 then raise exception 'my_learning_assignments() already exposed it; the premise is wrong'; end if;
    select count(*) into n from public.assessment_assignments where id = v_assign;
    if n <> 0 then raise exception 'the learner can read assessment_assignments directly'; end if;

    -- THE SET IS EXACTLY WHAT AUTHORIZATION ACCEPTS, in both directions
    select count(*) into n_disagree
      from public.assessment_assignments aa
      left join public.my_open_assessments() o on o.assessment_assignment_id = aa.id
     where aa.learning_assignment_id is null
       and (o.assessment_assignment_id is not null)
           <> coalesce((select s.ok from public.may_start_assessment(aa.id) s), false);
    if n_disagree <> 0 then
      raise exception 'discovery and may_start_assessment disagree on % assignment(s)', n_disagree;
    end if;

    execute 'reset role';

    -- ------------------------------------------------- the learner next door --
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_b, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_b::text, true);
    execute 'set local role authenticated';
    select count(*) into n from public.my_open_assessments() o
     where o.assessment_assignment_id = v_assign;
    if n <> 0 then
      raise exception 'a learner of another class in the same institution discovered it';
    end if;
    execute 'reset role';

    -- ------------------------------------------------------------ lifecycle --
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    update public.assessment_assignments
       set opens_at = now() - interval '2 hours', closes_at = now() - interval '1 minute'
     where assessment_assignments.id = v_assign;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_a, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_a::text, true);
    execute 'set local role authenticated';
    select count(*) into n from public.my_open_assessments() o
     where o.assessment_assignment_id = v_assign;
    if n <> 0 then raise exception 'an assignment whose window has passed is still offered'; end if;
    execute 'reset role';

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    update public.assessment_assignments set status = 'CLOSED'
     where assessment_assignments.id = v_assign;
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_uid_a, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_uid_a::text, true);
    execute 'set local role authenticated';
    select count(*) into n from public.my_open_assessments() o
     where o.assessment_assignment_id = v_assign;
    if n <> 0 then raise exception 'a CLOSED assignment is still offered'; end if;
    execute 'reset role';

    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    raise exception 'ROLLBACK_PROBE';
  exception when others then
    begin execute 'reset role'; exception when others then null; end;
    perform set_config('request.jwt.claims', '', true);
    perform set_config('request.jwt.claim.sub', '', true);
    if sqlerrm <> 'ROLLBACK_PROBE' then raise; end if;
  end;

  select count(*) into n from public.institutions where slug = 'probe-inst-0087';
  if n <> 0 then raise exception 'the probe left its institution behind'; end if;

  -- structural: the doorway decides nothing of its own
  if pg_get_functiondef('public.my_open_assessments()'::regprocedure) !~ 'may_start_assessment' then
    raise exception 'my_open_assessments does not defer to may_start_assessment; that is a second authorization path';
  end if;

  raise notice '0087 verified: a learner finds exactly the unbound assignments authorization already accepts';
end $$;
