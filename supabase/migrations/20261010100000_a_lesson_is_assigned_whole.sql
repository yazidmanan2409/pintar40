-- BOB-04 -- A LESSON IS ASSIGNED WHOLE: its pre-test and post-test come with
-- it (D-008, audit B4).
--
-- THE DEAD END. A teacher's "Sediakan" wrote a learning assignment and nothing
-- else: no assessment of the cycle. /belajar/[tugas]/pemetaan found no
-- pre-test and answered 404, so every assigned lesson stopped at its door.
-- Only the seeds ever built a whole cycle, by hand.
--
-- THE SHAPE.
--   1. A lesson package's course gets its PRE_TEST and POST_TEST definitions
--      when it is materialised, from the questions marked "Pemetaan awal" and
--      "Cek penguasaan" (items.cycle_role, BOB-02). They are made BEFORE the
--      course can be sealed, because a definition is taught content: it is
--      part of the release's content hash and cannot be added under a frozen
--      course (INV-04). So they are reviewed with the course and frozen with it.
--   2. The draw follows the marks. Where a definition's questions carry a
--      cycle_role, a PRE_TEST or POST_TEST definition draws only the questions
--      marked for it -- never the other test's, never a practice question.
--      Content without marks (the seeded cycle) draws as it always has.
--   3. assign_release(release, class, from, until) is the one way a release is
--      assigned: the learning assignment and both assessment assignments, open,
--      in one transaction -- or a PR050 refusal naming what is missing. It
--      checks now that both tests can be drawn for every learner, INV-24
--      included: a post-test whose questions all share a parallel group with a
--      pre-test question can never be drawn once the pre-test is taken, and is
--      refused as ASSIGN_CYCLE_OVERLAP instead of failing a learner mid-cycle.
--   4. my_cycle_state refuses a stranger with a code, so the learner pages can
--      render a state instead of an error.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. THE MATERIALISER, now making the course's two tests.
-- ---------------------------------------------------------------------------
create or replace function public.lesson_package_materialise(p_batch uuid)
returns uuid[] language plpgsql set search_path = public, pg_temp as $$
declare
  b public.ingest_batches; c jsonb; m jsonb; l jsonb; i jsonb; o jsonb; md jsonb;
  mi int; li int; v_course uuid; v_module uuid; v_lesson uuid; v_item uuid; v_obj uuid;
  v_courses uuid[] := '{}'; v_media jsonb; v_name text; v_groups jsonb; v_group uuid; v_g text; v_use text;
  v_mode public.assessment_mode; v_n int; v_title text; v_version int;
begin
  select * into b from public.ingest_batches where id = p_batch;
  for c in select * from jsonb_array_elements(b.raw_payload -> 'courses') loop
    insert into public.courses (institution_id, subject, stage, grade_label, title, author_person_id, learning_context)
    values (b.institution_id, public.package_text(c, 'subject'), public.package_text(c, 'stage'),
            public.package_text(c, 'grade_label'), public.package_text(c, 'title'), b.confirmed_by_person_id,
            coalesce(public.package_context(c), 'ACADEMIC'::public.learning_context))
    returning id into v_course;
    v_courses := v_courses || v_course;
    v_groups := '{}'::jsonb;
    mi := 0;
    for m in select * from jsonb_array_elements(public.package_array(c, 'modules')) loop
      mi := mi + 1;
      insert into public.modules (course_id, institution_id, ordinal, title, author_person_id)
      values (v_course, b.institution_id, coalesce(public.package_text(m, 'ordinal'), mi::text)::smallint,
              public.package_text(m, 'title'), b.confirmed_by_person_id)
      returning id into v_module;
      li := 0;
      for l in select * from jsonb_array_elements(public.package_array(m, 'lessons')) loop
        li := li + 1;
        select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                 'jenis', public.package_media_kind(public.package_media_name(public.package_text(x, 'file'))),
                 'path', format('pelajaran/%s/%s/%s', b.institution_id, b.id, public.package_media_name(public.package_text(x, 'file'))),
                 'nama', public.package_text(x, 'file'),
                 'transcript', public.package_text(x, 'transcript')))), '[]'::jsonb)
          into v_media from jsonb_array_elements(public.package_array(l, 'media')) x;
        insert into public.lessons (module_id, institution_id, ordinal, title, summary, body_markdown, media, author_person_id)
        values (v_module, b.institution_id, coalesce(public.package_text(l, 'ordinal'), li::text)::smallint,
                public.package_text(l, 'title'), public.package_text(l, 'summary'),
                public.package_text(l, 'body_markdown'), v_media, b.confirmed_by_person_id)
        returning id into v_lesson;
        v_obj := null;
        if jsonb_typeof(l -> 'objective') = 'object' then
          insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom, is_core)
          values (v_lesson, b.institution_id, format('B%sP%s', mi, li),
                  public.package_text(l -> 'objective', 'statement'),
                  coalesce(public.package_text(l -> 'objective', 'bloom'), 'UNDERSTAND')::public.bloom_level, true)
          returning id into v_obj;
        end if;
        for i in select * from jsonb_array_elements(public.package_array(l, 'items')) loop
          v_use := public.package_text(i, 'use');
          v_g := lower(public.package_text(i, 'parallel_group'));
          v_group := null;
          if v_g is not null then
            if not (v_groups ? v_g) then v_groups := v_groups || jsonb_build_object(v_g, gen_random_uuid()); end if;
            v_group := (v_groups ->> v_g)::uuid;
          end if;
          insert into public.items (lesson_id, institution_id, item_type, bank_type, stem, stimulus, petunjuk,
                                    objective_ids, parallel_group, predicted_difficulty, cycle_role, author_person_id)
          values (v_lesson, b.institution_id,
                  coalesce(public.package_text(i, 'item_type'), 'MCQ_SINGLE')::public.item_type,
                  case when v_use is null then 'PRACTICE' else 'TEST' end::public.bank_type,
                  public.package_text(i, 'stem'), public.package_text(i, 'stimulus'), public.package_text(i, 'petunjuk'),
                  case when v_obj is null then '{}'::uuid[] else array[v_obj] end, v_group,
                  public.package_text(i, 'difficulty')::numeric, v_use::public.assessment_mode, b.confirmed_by_person_id)
          returning id into v_item;
          for o in select * from jsonb_array_elements(public.package_array(i, 'options')) loop
            insert into public.item_options (item_id, institution_id, label, body, is_correct, rationale, misconception_code)
            values (v_item, b.institution_id, upper(public.package_text(o, 'label')), public.package_text(o, 'body'),
                    coalesce((o ->> 'is_correct')::boolean, false), public.package_text(o, 'rationale'),
                    public.package_text(o, 'misconception_code'));
          end loop;
        end loop;
      end loop;
    end loop;
    -- D-008 (BOB-04): the course's pre-test and post-test, made here -- before
    -- the course can be sealed, so they are reviewed with it and frozen with it
    -- -- from the questions marked for each. Every marked question is drawn.
    foreach v_mode in array array['PRE_TEST', 'POST_TEST']::public.assessment_mode[] loop
      select count(*) into v_n from public.items it
        join public.lessons ls on ls.id = it.lesson_id join public.modules ms on ms.id = ls.module_id
       where ms.course_id = v_course and it.cycle_role = v_mode;
      continue when v_n = 0;
      v_title := case v_mode when 'PRE_TEST' then 'Pemetaan awal — ' else 'Cek penguasaan — ' end
                 || public.package_text(c, 'title');
      select coalesce(max(ad.version), 0) + 1 into v_version from public.assessment_definitions ad
       where ad.institution_id = b.institution_id and ad.title = v_title and ad.mode = v_mode;
      insert into public.assessment_definitions (institution_id, course_id, title, mode, bank_type, version,
        item_count, difficulty_mix, safety_critical_minimum, passing_rules, hesitation_window_seconds,
        shuffle_policy, allows_pause, offline_tolerant, late_sync_grace_seconds, attempt_limit, author_person_id)
      values (b.institution_id, v_course, v_title, v_mode, 'TEST', v_version,
        v_n, '{}'::jsonb, 0,
        case v_mode when 'POST_TEST' then '{"mastery_min":0.6}'::jsonb else '{}'::jsonb end, 25,
        'ITEMS_AND_OPTIONS', v_mode = 'POST_TEST', true, 120,
        case v_mode when 'PRE_TEST' then 1 else 2 end, b.confirmed_by_person_id);
    end loop;
  end loop;
  return v_courses;
end $$;
revoke all on function public.lesson_package_materialise(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. THE DRAW FOLLOWS THE MARKS.
-- ---------------------------------------------------------------------------
create or replace function public.definition_follows_cycle_roles(p_definition uuid)
returns boolean language sql stable set search_path = public, pg_temp as $$
  select d.mode in ('PRE_TEST', 'POST_TEST') and exists (
    select 1 from public.items i
      join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
     where i.cycle_role is not null
       and ((d.course_id is not null and m.course_id = d.course_id)
         or (d.module_id is not null and l.module_id = d.module_id)))
    from public.assessment_definitions d where d.id = p_definition
$$;
revoke all on function public.definition_follows_cycle_roles(uuid) from public, anon, authenticated;

create or replace function public.eligible_items_for_definition(p_definition uuid)
returns table (item_id uuid, parallel_group uuid, bank_type public.bank_type)
language sql stable set search_path = public, pg_temp as $function$
  select i.id, i.parallel_group, i.bank_type
    from public.assessment_definitions d
    join public.lessons l on true
    join public.modules m on m.id = l.module_id
    join public.items i on i.lesson_id = l.id
   where d.id = p_definition
     and i.institution_id = d.institution_id
     and public.item_is_drawable(i.bank_type, d.bank_type)
     and ((d.course_id is not null and m.course_id = d.course_id)
       or (d.module_id is not null and l.module_id = d.module_id))
     -- BOB-04 (D-008): where the questions are marked, a cycle test draws only
     -- the questions marked for it
     and (not public.definition_follows_cycle_roles(d.id) or i.cycle_role = d.mode)
  union all
  -- AD-HOC ONLY (ADR-0018). Authorized canonical content, under the same tier
  -- and scope tests as the branch above. The owner test is what makes this
  -- branch incapable of duplicating a row from branch (a): every row here is
  -- owned by someone other than the definition's institution.
  select a.item_id, a.parallel_group, a.bank_type
    from public.assessment_definitions d
    join public.authorized_canonical_items() a
      on a.consuming_institution_id = d.institution_id
   where d.id = p_definition
     and d.is_ad_hoc
     and a.owner_institution_id is distinct from d.institution_id
     and public.item_is_drawable(a.bank_type, d.bank_type)
     and ((d.course_id is not null and a.course_id = d.course_id)
       or (d.module_id is not null and a.module_id = d.module_id))
$function$;
-- privileges as before: the Studio's own reads may call it; anon may not
revoke all on function public.eligible_items_for_definition(uuid) from public, anon;
grant execute on function public.eligible_items_for_definition(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. ASSIGN -- the whole cycle, or a code.
-- ---------------------------------------------------------------------------
create function public.assign_refuse(p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception using
    errcode = 'PR050',
    detail  = p_code,
    message = case p_code
      when 'ASSIGN_NOT_ALLOWED'           then 'assigning learning requires CAN_ASSIGN_LEARNING in the class''s institution'
      when 'ASSIGN_CLASS_INVALID'         then 'learning is assigned to an active class or cohort with an academic period'
      when 'ASSIGN_RELEASE_NOT_PUBLISHED' then 'only a PUBLISHED release is assigned'
      when 'ASSIGN_WINDOW_INVALID'        then 'the assignment closes before it opens'
      when 'ASSIGN_EXISTS'                then 'this release is already assigned to this class'
      when 'ASSIGN_PRE_TEST_MISSING'      then 'the lesson has no approved pre-test (Pemetaan awal)'
      when 'ASSIGN_POST_TEST_MISSING'     then 'the lesson has no approved post-test (Cek penguasaan)'
      when 'ASSIGN_PRE_TEST_TOO_SHORT'    then 'the pre-test asks for more questions than the lesson has for it'
      when 'ASSIGN_POST_TEST_TOO_SHORT'   then 'the post-test asks for more questions than the lesson has for it'
      when 'ASSIGN_CYCLE_OVERLAP'         then 'the post-test cannot be drawn apart from the pre-test and its parallel questions (INV-24)'
      when 'CYCLE_NOT_ASSIGNED'           then 'this learning assignment is not assigned to you'
      else 'the assignment could not be made' end;
end $$;
revoke all on function public.assign_refuse(text) from public, anon, authenticated;

-- The cycle definition of a release's course for one mode: approved, not
-- ad hoc; the course-wide one before a module's, the newest version first.
create function public.release_cycle_definition(p_release uuid, p_mode public.assessment_mode)
returns public.assessment_definitions language sql stable set search_path = public, pg_temp as $$
  select d.* from public.plp_releases r
    join public.assessment_definitions d on d.institution_id = r.institution_id
   where r.id = p_release and d.mode = p_mode and not d.is_ad_hoc and d.status = 'APPROVED'
     and (d.course_id = r.course_id
          or d.module_id in (select m.id from public.modules m where m.course_id = r.course_id))
   order by (d.course_id is null), d.version desc, d.created_at desc
   limit 1
$$;
revoke all on function public.release_cycle_definition(uuid, public.assessment_mode) from public, anon, authenticated;

create function public.assign_release(p_release uuid, p_node uuid, p_from timestamptz, p_until timestamptz)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  r public.plp_releases; n public.org_nodes; d_pre public.assessment_definitions; d_post public.assessment_definitions;
  v_pre_n int; v_post_n int; v_post_free int; v_la uuid; v_pre uuid; v_post uuid; v_from timestamptz;
begin
  select * into r from public.plp_releases where id = p_release;
  select * into n from public.org_nodes where id = p_node;
  -- an unknown release or class, another school's class, and content this
  -- school may not teach all answer alike
  if r.id is null or n.id is null or not public.can_in_institution('CAN_ASSIGN_LEARNING', n.institution_id)
     or (r.institution_id <> n.institution_id and not public.release_is_distributed_to(r.id, n.institution_id)) then
    perform public.assign_refuse('ASSIGN_NOT_ALLOWED');
  end if;
  if n.kind not in ('CLASS', 'COHORT') or not n.is_active or n.academic_period_id is null then
    perform public.assign_refuse('ASSIGN_CLASS_INVALID');
  end if;
  if r.status <> 'PUBLISHED' then perform public.assign_refuse('ASSIGN_RELEASE_NOT_PUBLISHED'); end if;
  v_from := coalesce(p_from, now());
  if p_until is not null and p_until <= v_from then perform public.assign_refuse('ASSIGN_WINDOW_INVALID'); end if;
  -- one assignment of a release per class at a time; a double click is one
  perform 1 from public.org_nodes where id = n.id for update;
  if exists (select 1 from public.learning_assignments la
              where la.plp_release_id = r.id and la.node_id = n.id and la.status in ('DRAFT', 'ACTIVE')) then
    perform public.assign_refuse('ASSIGN_EXISTS');
  end if;

  d_pre := public.release_cycle_definition(r.id, 'PRE_TEST');
  if d_pre.id is null then perform public.assign_refuse('ASSIGN_PRE_TEST_MISSING'); end if;
  d_post := public.release_cycle_definition(r.id, 'POST_TEST');
  if d_post.id is null then perform public.assign_refuse('ASSIGN_POST_TEST_MISSING'); end if;

  -- both tests can be drawn for every learner, INV-24 included: the post-test
  -- never repeats a pre-test question or one of its parallel siblings
  select count(*) into v_pre_n from public.eligible_items_for_definition(d_pre.id);
  if v_pre_n < d_pre.item_count then perform public.assign_refuse('ASSIGN_PRE_TEST_TOO_SHORT'); end if;
  select count(*) into v_post_n from public.eligible_items_for_definition(d_post.id);
  if v_post_n < d_post.item_count then perform public.assign_refuse('ASSIGN_POST_TEST_TOO_SHORT'); end if;
  select count(*) into v_post_free
    from public.eligible_items_for_definition(d_post.id) e
   where e.item_id not in (select p.item_id from public.eligible_items_for_definition(d_pre.id) p)
     and (e.parallel_group is null
          or e.parallel_group not in (select p.parallel_group from public.eligible_items_for_definition(d_pre.id) p
                                       where p.parallel_group is not null));
  if v_post_free < d_post.item_count then perform public.assign_refuse('ASSIGN_CYCLE_OVERLAP'); end if;

  insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id,
    available_from, available_until, learning_cycle)
  values (n.institution_id, r.id, r.course_id, n.id, n.academic_period_id, p_from, p_until,
          jsonb_build_object('pre_test', d_pre.id, 'post_test', d_post.id))
  returning id into v_la;
  update public.learning_assignments set status = 'ACTIVE' where id = v_la;

  insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id,
    node_id, academic_period_id, opens_at, closes_at)
  values (n.institution_id, d_pre.id, v_la, n.id, n.academic_period_id, v_from, p_until)
  returning id into v_pre;
  insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id,
    node_id, academic_period_id, opens_at, closes_at)
  values (n.institution_id, d_post.id, v_la, n.id, n.academic_period_id, v_from, p_until)
  returning id into v_post;
  update public.assessment_assignments set status = 'SCHEDULED' where id in (v_pre, v_post);
  update public.assessment_assignments set status = 'OPEN' where id in (v_pre, v_post);

  perform public.audit_write('LEARNING_ASSIGNED', 'learning_assignments', v_la::text, n.institution_id,
    jsonb_build_object('plp_release_id', r.id, 'node_id', n.id, 'pre_test', d_pre.id, 'post_test', d_post.id,
                       'available_from', p_from, 'available_until', p_until));
  return jsonb_build_object('ok', true, 'learning_assignment', v_la, 'pre_assignment', v_pre, 'post_assignment', v_post);
end $$;
revoke all on function public.assign_release(uuid, uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.assign_release(uuid, uuid, timestamptz, timestamptz) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. THE LEARNER'S CYCLE, refusing a stranger with a code.
-- ---------------------------------------------------------------------------
create or replace function public.my_cycle_state(p_learning_assignment uuid)
returns table (pre_assignment uuid, pre_session uuid, pre_status public.session_status,
               post_assignment uuid, post_session uuid, post_status public.session_status)
language plpgsql stable security definer set search_path = public, pg_temp as $function$
declare v_person uuid;
begin
  v_person := public.current_person_id();
  if v_person is null
     or not exists (select 1 from public.my_learning_assignments() m
                     where m.learning_assignment_id = p_learning_assignment) then
    perform public.assign_refuse('CYCLE_NOT_ASSIGNED');
  end if;
  return query
  with aa as (
    select a.id, d.mode
      from public.assessment_assignments a
      join public.assessment_definitions d on d.id = a.assessment_definition_id
     where a.learning_assignment_id = p_learning_assignment
  ),
  latest as (
    select distinct on (s.mode) s.mode, s.id, s.status
      from public.assessment_sessions s
     where s.person_id = v_person and s.learning_assignment_id = p_learning_assignment
     order by s.mode, s.created_at desc
  )
  select (select id from aa where mode = 'PRE_TEST'),
         (select id from latest where mode = 'PRE_TEST'),
         (select status from latest where mode = 'PRE_TEST'),
         (select id from aa where mode = 'POST_TEST'),
         (select id from latest where mode = 'POST_TEST'),
         (select status from latest where mode = 'POST_TEST');
end $function$;
revoke all on function public.my_cycle_state(uuid) from public, anon;
grant execute on function public.my_cycle_state(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. THE REGISTRY (L3-F02).
-- ---------------------------------------------------------------------------
insert into public.client_rpc_registry (function_name, exposure, note, authorization_kind, authorization_requirement)
values
  ('assign_release', 'STAFF',
   'BOB-04 (D-008): assigns a PUBLISHED release to a class -- the learning assignment and its pre-test and '
   || 'post-test assessment assignments, open, in one transaction -- after checking both tests can be drawn for '
   || 'every learner (INV-24 included). Audited. Refusals are PR050 with a stable code in DETAIL.',
   'CAPABILITY', 'CAN_ASSIGN_LEARNING')
on conflict (function_name) do update
   set exposure = excluded.exposure, note = excluded.note,
       authorization_kind = excluded.authorization_kind,
       authorization_requirement = excluded.authorization_requirement;

-- ---------------------------------------------------------------------------
-- TERMINAL VERIFICATION (ADR-0014). Structural; selftest/db/fable13.sql proves
-- the behaviour on every run.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.client_rpc_registry
                  where function_name = 'assign_release' and authorization_kind = 'CAPABILITY'
                    and authorization_requirement = 'CAN_ASSIGN_LEARNING') then
    raise exception 'BOB-04: assign_release is not declared';
  end if;
  if has_function_privilege('anon', 'public.assign_release(uuid, uuid, timestamptz, timestamptz)'::regprocedure, 'execute') then
    raise exception 'BOB-04: an anonymous caller can assign learning';
  end if;
  if has_function_privilege('authenticated', 'public.assign_refuse(text)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.release_cycle_definition(uuid, public.assessment_mode)'::regprocedure, 'execute')
     or has_function_privilege('authenticated', 'public.definition_follows_cycle_roles(uuid)'::regprocedure, 'execute') then
    raise exception 'BOB-04: an internal helper is client-callable';
  end if;
  if pg_get_functiondef('public.lesson_package_materialise(uuid)'::regprocedure) !~ 'assessment_definitions' then
    raise exception 'BOB-04: the materialiser no longer makes the course''s tests';
  end if;
end $$;
