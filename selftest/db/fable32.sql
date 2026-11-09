-- FABLE-32 · D-195 (owner, 7 Nov): THE TWO NARROW READS OF THE APPROVED REPORTS, measured against
-- supabase/migrations/20270102100000_a_teacher_names_the_learners_who_need_reinforcement.sql.
--
--   F32-E01  murid_perlu_penguatan(class) names, for the class's teacher, exactly the learners placed in the class now
--            whose band under calc_class_readiness_distribution's rule is the lowest: in a class of its own, A (40%),
--            C (90% with a failed safety gate) and D (85%, then a later 30%) are named; B (70%), E (30%, then a later
--            85%) and F (placed, no Uji Penguasaan) are not; G (35%, since left the class) is counted in the class's
--            lowest band by the calculator but not named. The calculator's lowest-band count is the named three plus
--            G, so the two agree on the band. The answer is the learner's identity and name only (two columns).
--   F32-E02  the same question, isolated: a teacher of another class of the school, the school admin with no teaching
--            role, learner A themselves, and an anonymous caller get nothing (an empty answer, or refused).
--   F32-J01  jenis_belajar_saya(assignment) tells a learner placed under one of their own learning assignments whether
--            that course is professional learning, and a learner not under it nothing.
--
-- EVERY ROW IS ROLLED BACK.

create schema if not exists selftest;

do $$
begin
  if to_regprocedure('selftest.as_user_uid(uuid)') is null or to_regprocedure('selftest.f11_user(text,public.app_role,uuid)') is null
     or to_regprocedure('selftest.as_owner()') is null or to_regprocedure('selftest.as_anon()') is null then
    raise exception 'apply fable01, fable06 and fable11.sql before fable32.sql: the helpers are missing';
  end if;
end $$;

create or replace function selftest.run_fable32()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_tag text := to_char(clock_timestamp(), 'HH24MISSUS');
  e01 text[] := array[]::text[]; e02 text[] := array[]::text[]; j01 text[] := array[]::text[]; v_fatal text := '';
  v_inst uuid; v_tmpl record; v_cls uuid; v_other uuid; v_cat text; v_lowest text;
  m record; v_p uuid; v_e uuid; v_new uuid; v_people jsonb := '{}'::jsonb;
  v_guru uuid; v_guru2 uuid; v_adm uuid; v_ua uuid; v_ub uuid; v_pa uuid;
  v_got text[]; v_n int; v_cols int; v_ben int; v_tot int; v_calc jsonb; v_err text; v_la record; v_ctx text;
begin
  perform selftest.as_owner();
  begin
    v_cat := public.current_metric_catalogue();
    select t.tier_key into v_lowest from public.readiness_tiers t
     where t.catalogue_version = v_cat and t.min_mastery is not null order by t.min_mastery limit 1;
    select i.id into v_inst from public.institutions i where i.slug = 'pintar-human-evaluation';
    if v_inst is null then raise exception 'the demonstration tenant is absent'; end if;
    -- a real finalized official Uji Penguasaan to copy, so the evidence is the tenant's own
    select s.* into v_tmpl from public.assessment_sessions s
     where s.institution_id = v_inst and s.status = 'FINALIZED' and s.mode = 'POST_TEST'
       and exists (select 1 from public.official_sessions o where o.id = s.id)
       and exists (select 1 from public.assessment_results x where x.session_id = s.id)
     order by s.id limit 1;
    if v_tmpl.id is null then raise exception 'the demonstration tenant holds no finalized official Uji Penguasaan to copy'; end if;
    -- every copied result carries the template's per_domain: its own sums are what each learner must be given
    select coalesce(sum((kv.value ->> 'benar')::int), 0), coalesce(sum((kv.value ->> 'total')::int), 0) into v_ben, v_tot
      from public.assessment_results x, jsonb_each(x.per_domain) kv
     where x.session_id = v_tmpl.id and jsonb_typeof(kv.value) = 'object';
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    select v_inst, o.parent_id, 'CLASS', 'Kelas F32 ' || v_tag, o.academic_period_id
      from public.org_nodes o where o.id = v_tmpl.class_node_id
    returning org_nodes.id into v_cls;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    select v_inst, o.parent_id, 'CLASS', 'Kelas F32 lain ' || v_tag, o.academic_period_id
      from public.org_nodes o where o.id = v_tmpl.class_node_id
    returning org_nodes.id into v_other;

    -- the learners: who, mastery, safety gate, how many days ago it was computed (null: no Uji Penguasaan)
    for m in select * from (values
        ('A', 0.40, true,  1), ('B', 0.70, true, 1), ('C', 0.90, false, 1),
        ('D', 0.85, true,  3), ('D', 0.30, true, 1), ('E', 0.30, true, 3), ('E', 0.85, true, 1),
        ('F', null, null, null), ('G', 0.35, true, 1)) x(who, ms, gate, hari) loop
      if not v_people ? m.who then
        if m.who = 'A' then
          v_ua := selftest.f11_user('f32-a-' || v_tag || '@local.invalid', null, null);
          select a.person_id into v_p from public.accounts a where a.auth_user_id = v_ua;
          update public.persons set display_name = 'Murid F32 A ' || v_tag where persons.id = v_p;
          v_pa := v_p;
        else
          insert into public.persons (display_name) values ('Murid F32 ' || m.who || ' ' || v_tag) returning persons.id into v_p;
        end if;
        v_people := v_people || jsonb_build_object(m.who, v_p);
        insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
        select v_p, v_inst, e.academic_period_id, e.programme_id, 'ACTIVE'
          from public.enrollments e where e.id = v_tmpl.enrollment_id
        returning enrollments.id into v_e;
        insert into public.memberships (enrollment_id, node_id, academic_period_id)
        values (v_e, v_cls, v_tmpl.academic_period_id);
      end if;
      v_p := (v_people ->> m.who)::uuid;
      continue when m.ms is null;
      select e.id into v_e from public.enrollments e where e.person_id = v_p and e.institution_id = v_inst;
      v_new := gen_random_uuid();
      insert into public.assessment_sessions
        (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, cohort_node_id,
         plp_release_id, assessment_definition_id, assessment_definition_version, engine_version,
         scoring_policy_version, evidence_channel, evidence_class, mode, status, shuffle_seed,
         started_at, submitted_at, finalized_at, deadline_extended_count)
      values (v_new, v_p, v_inst, v_e, v_tmpl.academic_period_id, v_cls, v_tmpl.cohort_node_id, v_tmpl.plp_release_id,
              v_tmpl.assessment_definition_id, v_tmpl.assessment_definition_version, v_tmpl.engine_version,
              v_tmpl.scoring_policy_version, v_tmpl.evidence_channel, v_tmpl.evidence_class, 'POST_TEST',
              -- RESTATED TO OWNER DECISION 8 (9 Nov): a later sitting is one FINALISED later (it was the result's
              -- computation time alone before, which a recomputation of an old sitting also moves)
              'CREATED', v_tmpl.shuffle_seed, now() - make_interval(days => m.hari, mins => 30), now() - make_interval(days => m.hari, mins => 5),
              now() - make_interval(days => m.hari), 0);
      update public.assessment_sessions set status = 'IN_PROGRESS' where assessment_sessions.id = v_new;
      update public.assessment_sessions set status = 'SUBMITTED'   where assessment_sessions.id = v_new;
      update public.assessment_sessions set status = 'FINALIZED', finalized_at = now() - make_interval(days => m.hari) where assessment_sessions.id = v_new;
      insert into public.assessment_results
        (id, session_id, institution_id, person_id, evidence_class, engine_version, scoring_policy_version,
         mastery, per_domain, safety_gate_passed, delta_inputs, computed_at)
      select gen_random_uuid(), v_new, x.institution_id, v_p, x.evidence_class, x.engine_version,
             x.scoring_policy_version, m.ms, x.per_domain, m.gate, x.delta_inputs, now() - make_interval(days => m.hari)
        from public.assessment_results x where x.session_id = v_tmpl.id;
    end loop;
    -- G has since left the class
    update public.memberships set valid_to = now(), close_reason = 'MOVED'
     where node_id = v_cls and enrollment_id = (select e.id from public.enrollments e
                                                   where e.person_id = (v_people ->> 'G')::uuid and e.institution_id = v_inst);

    v_guru  := selftest.f11_user('f32-guru-'  || v_tag || '@local.invalid', 'EDUCATOR', v_cls);
    v_guru2 := selftest.f11_user('f32-guru2-' || v_tag || '@local.invalid', 'EDUCATOR', v_other);
    v_adm   := selftest.f11_user('f32-adm-'   || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_inst);

    -- ═══════════════════════════════════════════════════════════════════════ F32-E01
    begin
      perform selftest.as_user_uid(v_guru);
      select array_agg(right(p.display_name, length(p.display_name) - length('Murid F32 ')) order by p.display_name) into v_got
        from public.murid_perlu_penguatan(v_cls) p;
      perform selftest.as_owner();
      if v_got is distinct from array['A ' || v_tag, 'C ' || v_tag, 'D ' || v_tag] then
        e01 := e01 || format('the teacher was given %s, not [A, C, D] (40%%; 90%% with a failed gate; 85%% then 30%%)',
                             coalesce(array_to_string(v_got, ', '), 'nobody'));
      end if;
      perform set_config('pintar.metric_boundary_node', v_cls::text, true);
      v_calc := public.calc_class_readiness_distribution(v_cls, v_inst, v_cat);
      perform set_config('pintar.metric_boundary_node', '', true);
      if (v_calc -> 'value' ->> v_lowest)::int is distinct from 4 then
        e01 := e01 || format('the calculator counts %s in the lowest band, not the three named and G who left',
                             coalesce(v_calc -> 'value' ->> v_lowest, 'nothing'));
      end if;
      select count(*) into v_cols from information_schema.routines rt
        join information_schema.parameters pa on pa.specific_name = rt.specific_name and pa.parameter_mode = 'OUT'
       where rt.routine_schema = 'public' and rt.routine_name = 'murid_perlu_penguatan';
      if v_cols <> 5 then e01 := e01 || format('the answer has %s columns, not the identity, the name, the count and the gate', v_cols); end if;
      -- the count is the latest result's own (per_domain summed), the gate its own: C (90%%, gate failed) is named with it
      perform selftest.as_user_uid(v_guru);
      select count(*) filter (where p.soal_wajib_tepat is false and p.display_name like 'Murid F32 C %'),
             count(*) filter (where p.total is distinct from v_tot or p.benar is distinct from v_ben)
        into v_n, v_cols from public.murid_perlu_penguatan(v_cls) p;
      perform selftest.as_owner();
      if v_n <> 1 then e01 := e01 || 'C is not named with «soal wajib belum tepat»'::text; end if;
      if v_cols <> 0 then e01 := e01 || format('%s learner(s) given a count that is not their result''s own', v_cols); end if;
    exception when others then
      perform selftest.as_owner();
      e01 := e01 || ('threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════ F32-E02
    begin
      for m in select * from (values (v_guru2, 'a teacher of another class of the school'),
                                     (v_adm, 'the school admin, with no teaching role'),
                                     (v_ua, 'learner A themselves')) t(u, siapa) loop
        perform selftest.as_user_uid(m.u);
        select count(*) into v_n from public.murid_perlu_penguatan(v_cls);
        perform selftest.as_owner();
        if v_n <> 0 then e02 := e02 || format('%s was given %s name(s)', m.siapa, v_n); end if;
      end loop;
      perform selftest.as_user_uid(v_guru);
      select count(*) into v_n from public.murid_perlu_penguatan(v_other);
      perform selftest.as_owner();
      if v_n <> 0 then e02 := e02 || 'the teacher asking under another class was given names'::text; end if;
      perform selftest.as_anon();
      v_err := null;
      begin
        select count(*) into v_n from public.murid_perlu_penguatan(v_cls);
        v_err := 'answered';
      exception when others then null;
      end;
      perform selftest.as_owner();
      if v_err is not null then e02 := e02 || 'an anonymous caller reached the function'::text; end if;
    exception when others then
      perform selftest.as_owner();
      e02 := e02 || ('threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════ F32-J01
    begin
      select la.id, (c.learning_context = 'PROFESSIONAL_DEVELOPMENT')::text as ctx into v_la
        from public.learning_assignments la join public.courses c on c.id = la.course_id
       where la.status = 'ACTIVE' and la.institution_id = v_inst
       order by la.id limit 1;
      if v_la.id is null then raise exception 'the demonstration tenant has no active learning assignment'; end if;
      -- learner A is placed under it; learner B (an account with no enrolment) is not
      insert into public.memberships (enrollment_id, node_id, academic_period_id)
      select e.id, la.node_id, e.academic_period_id
        from public.enrollments e, public.learning_assignments la
       where e.person_id = v_pa and e.institution_id = v_inst and la.id = v_la.id;
      v_ub := selftest.f11_user('f32-b-' || v_tag || '@local.invalid', null, null);
      perform selftest.as_user_uid(v_ua);
      v_ctx := public.jenis_belajar_saya(v_la.id)::text;
      perform selftest.as_owner();
      if v_ctx is distinct from v_la.ctx then
        j01 := j01 || format('the learner under the assignment was told %s, not the course''s %s', coalesce(v_ctx, 'nothing'), v_la.ctx);
      end if;
      perform selftest.as_user_uid(v_ub);
      v_ctx := public.jenis_belajar_saya(v_la.id)::text;
      perform selftest.as_owner();
      if v_ctx is not null then j01 := j01 || format('a learner not under the assignment was told %s', v_ctx); end if;
    exception when others then
      perform selftest.as_owner();
      j01 := j01 || ('threw: ' || sqlerrm);
    end;

    raise exception 'F32_ROLLBACK';
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    perform selftest.as_owner();
    if sqlerrm <> 'F32_ROLLBACK' then v_fatal := sqlerrm; end if;
  end;

  for m in select * from (values
      ('F32-E01', 'D-195(5) -- the learners who need reinforcement, by name', e01,
       'the class''s teacher is given exactly the learners placed in the class whose band under the readiness '
       || 'calculator''s rule is the lowest (a failed gate included, the latest result deciding), with the latest result''s '
       || 'count and gate; the calculator''s lowest-band count agrees'),
      ('F32-E02', 'D-195(5) -- the same question, isolated', e02,
       'a teacher of another class, the school admin, the learner and the teacher asking under another class get an '
       || 'empty answer; an anonymous caller is refused'),
      ('F32-J01', 'D-195(4) -- the learner''s own learning context', j01,
       'a learner under their own learning assignment is told whether its course is professional learning; anyone else nothing'))
    t(tid, tarea, tprobs, tdetail) loop
    id := m.tid; area := m.tarea;
    if v_fatal <> '' then
      ok := false; detail := 'the suite aborted before this test could report: ' || left(v_fatal, 200);
    elsif cardinality(m.tprobs) > 0 then
      ok := false; detail := format('%s problem(s): %s', cardinality(m.tprobs), array_to_string(m.tprobs, '; '));
    else
      ok := true; detail := m.tdetail;
    end if;
    return next;
  end loop;

  id := 'F32-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-32 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable32() from public;
