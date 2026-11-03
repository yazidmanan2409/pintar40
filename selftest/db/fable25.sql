-- FABLE-25 database suite: Batch 5 (agent C) — teacher workflows.
--
-- Ordering: depends on fable01.sql (the role switches), fable06.sql (as_user_uid) and fable11.sql (f11_user).
-- Never applied as a migration; never present in production.
--
--   F25-T01  THE OBJECTIVES A LEARNER HAS NOT YET REACHED (W2.18, J5.13), measured against
--            supabase/migrations/20261225100000_a_teacher_sees_the_objectives_a_learner_has_not_yet_reached.sql:
--            tujuan_belum_tercapai(class, learner) answers the class's teacher with the objectives, by their
--            statement, that the learner's latest official Uji Penguasaan in this class recorded below the mark sealed
--            on that attempt, and nothing else: an objective at or over the mark is not listed; a later attempt that
--            reaches the mark takes the objective off the list; an attempt sat in another class is not read; the
--            answer carries the objective and its statement only (no figure, no item, no answer)
--   F25-T02  THE SAME QUESTION, ISOLATED: a teacher of another class of the same school, a teacher of another school,
--            a school admin with no teaching role, and the class's own teacher asking about the learner under another
--            class get nothing (an empty answer, not an error)
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb of problems, a sentinel to undo the
-- lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user_uid(uuid)') is null or to_regprocedure('selftest.f11_user(text,public.app_role,uuid)') is null
     or to_regprocedure('selftest.as_owner()') is null then
    raise exception 'apply fable01, fable06 and fable11.sql before fable25.sql: the helpers are missing';
  end if;
end $$;

create or replace function selftest.f25_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
grant execute on function selftest.f25_note(jsonb, text, text) to authenticated, anon;

-- One more attempt for a learner, copied from a real FINALIZED Uji Penguasaan of the class (its assignment, so the
-- attempt seals the assignment's own mark), with the per-objective record given and the time it was finished.
-- A null person makes a new learner, enrolled in the template's programme and placed in p_class.
create or replace function selftest.f25_attempt(
  p_template uuid, p_person uuid, p_class uuid, p_session_class uuid, p_per_domain jsonb, p_finished timestamptz)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare s record; v_person uuid := p_person; v_e uuid; v_new uuid := gen_random_uuid();
begin
  select x.institution_id, x.academic_period_id, e.programme_id into s
    from public.assessment_sessions x join public.enrollments e on e.id = x.enrollment_id
   where x.id = p_template;
  if v_person is null then
    insert into public.persons (display_name) values ('Murid F25 ' || left(v_new::text, 8)) returning persons.id into v_person;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (v_person, s.institution_id, s.academic_period_id, s.programme_id, 'ACTIVE') returning enrollments.id into v_e;
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, p_class, s.academic_period_id);
  else
    select e.id into v_e from public.enrollments e where e.person_id = v_person and e.institution_id = s.institution_id limit 1;
  end if;
  insert into public.assessment_sessions
    (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, cohort_node_id,
     plp_release_id, assessment_definition_id, assessment_definition_version, engine_version,
     scoring_policy_version, evidence_channel, evidence_class, mode, status, shuffle_seed,
     started_at, submitted_at, finalized_at, deadline_extended_count, assessment_assignment_id)
  select v_new, v_person, x.institution_id, v_e, x.academic_period_id, p_session_class, x.cohort_node_id,
         x.plp_release_id, x.assessment_definition_id, x.assessment_definition_version, x.engine_version,
         x.scoring_policy_version, x.evidence_channel, x.evidence_class, x.mode, 'CREATED', x.shuffle_seed,
         p_finished - interval '20 minutes', p_finished, p_finished, 0, x.assessment_assignment_id
    from public.assessment_sessions x where x.id = p_template;
  update public.assessment_sessions set status='IN_PROGRESS' where id=v_new;
  update public.assessment_sessions set status='SUBMITTED'   where id=v_new;
  update public.assessment_sessions set status='FINALIZED', finalized_at = p_finished where id=v_new;
  insert into public.assessment_results
    (id, session_id, institution_id, person_id, evidence_class, engine_version, scoring_policy_version,
     mastery, per_domain, safety_gate_passed, delta_inputs, computed_at)
  select gen_random_uuid(), v_new, r.institution_id, v_person, r.evidence_class, r.engine_version,
         r.scoring_policy_version, r.mastery, p_per_domain, r.safety_gate_passed, r.delta_inputs, now()
    from public.assessment_results r where r.session_id = p_template limit 1;
  return v_person;
end $$;
revoke all on function selftest.f25_attempt(uuid, uuid, uuid, uuid, jsonb, timestamptz) from public;

create or replace function selftest.run_fable25()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; v_tag text := to_char(clock_timestamp(), 'HH24MISSUS'); v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  v_tpl uuid; v_inst uuid; v_class uuid; v_parent uuid; v_period uuid; v_mark numeric; v_other uuid; v_x uuid;
  v_codes text[]; v_low text; v_high text; v_low_stmt text; v_high_stmt text;
  v_l1 uuid; v_l2 uuid; v_l3 uuid; v_guru uuid; v_guru2 uuid; v_guru_x uuid; v_adm uuid;
  v_got text[]; v_cols int; v_n int; v_err text;
begin
  begin
    -- a real finished Uji Penguasaan of a class, with its sealed mark and an objective code its chapter names
    select s.id, s.institution_id, s.class_node_id, s.pass_mark into v_tpl, v_inst, v_class, v_mark
      from public.assessment_sessions s
      join public.assessment_results res on res.session_id = s.id
      join public.org_nodes n on n.id = s.class_node_id and n.kind = 'CLASS'
     where s.mode = 'POST_TEST' and s.status = 'FINALIZED' and s.pass_mark is not null
       and s.assessment_assignment_id is not null and jsonb_typeof(res.per_domain) = 'object'
       and public.effective_evidence_class(s.id) = 'OFFICIAL'
       and (select count(*) from public.assessment_definitions ad
              join public.lessons le on le.module_id = ad.module_id
              join public.learning_objectives o on o.lesson_id = le.id
             where ad.id = s.assessment_definition_id and res.per_domain ? o.code) >= 2
     order by s.finalized_at desc limit 1;
    if v_tpl is null then raise exception 'the fixture has no finished Uji Penguasaan with two named objectives'; end if;
    select array_agg(k order by k) into v_codes
      from public.assessment_results res, jsonb_object_keys(res.per_domain) k
     where res.session_id = v_tpl
       and exists (select 1 from public.assessment_sessions s join public.assessment_definitions ad on ad.id = s.assessment_definition_id
                     join public.lessons le on le.module_id = ad.module_id
                     join public.learning_objectives o on o.lesson_id = le.id
                    where s.id = v_tpl and o.code = k);
    v_low := v_codes[1]; v_high := v_codes[2];
    select o.statement into v_low_stmt from public.assessment_sessions s join public.assessment_definitions ad on ad.id = s.assessment_definition_id
      join public.lessons le on le.module_id = ad.module_id join public.learning_objectives o on o.lesson_id = le.id
     where s.id = v_tpl and o.code = v_low order by le.ordinal, o.id limit 1;
    select o.statement into v_high_stmt from public.assessment_sessions s join public.assessment_definitions ad on ad.id = s.assessment_definition_id
      join public.lessons le on le.module_id = ad.module_id join public.learning_objectives o on o.lesson_id = le.id
     where s.id = v_tpl and o.code = v_high order by le.ordinal, o.id limit 1;
    select n.parent_id, n.academic_period_id into v_parent, v_period from public.org_nodes n where n.id = v_class;

    -- another class of the same school, and another school
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_parent, 'CLASS', 'Kelas F25 ' || v_tag, v_period) returning org_nodes.id into v_other;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F25 tetangga ' || v_tag, 'f25x-' || v_tag, true, true) returning institutions.id into v_x;
    perform set_config('app.seed_intent', '', true);

    -- L1: below the mark on one objective, at the mark on the other
    v_l1 := selftest.f25_attempt(v_tpl, null, v_class, v_class,
      jsonb_build_object(v_low,  jsonb_build_object('benar', 1, 'total', 4, 'penguasaan', round(v_mark - 0.35, 4)),
                         v_high, jsonb_build_object('benar', 4, 'total', 4, 'penguasaan', v_mark)),
      now() - interval '2 days');
    -- L2: below on both, then a later attempt reaches the mark on both
    v_l2 := selftest.f25_attempt(v_tpl, null, v_class, v_class,
      jsonb_build_object(v_low,  jsonb_build_object('benar', 0, 'total', 4, 'penguasaan', 0),
                         v_high, jsonb_build_object('benar', 0, 'total', 4, 'penguasaan', 0)),
      now() - interval '3 days');
    perform selftest.f25_attempt(v_tpl, v_l2, v_class, v_class,
      jsonb_build_object(v_low,  jsonb_build_object('benar', 4, 'total', 4, 'penguasaan', 1),
                         v_high, jsonb_build_object('benar', 4, 'total', 4, 'penguasaan', 1)),
      now() - interval '1 day');
    -- L3: placed in this class, but the attempt below the mark was sat in the other class
    v_l3 := selftest.f25_attempt(v_tpl, null, v_class, v_other,
      jsonb_build_object(v_low, jsonb_build_object('benar', 0, 'total', 4, 'penguasaan', 0)),
      now() - interval '1 day');

    v_guru   := selftest.f11_user('f25-guru-'   || v_tag || '@local.invalid', 'EDUCATOR', v_class);
    v_guru2  := selftest.f11_user('f25-guru2-'  || v_tag || '@local.invalid', 'EDUCATOR', v_other);
    v_guru_x := selftest.f11_user('f25-gurux-'  || v_tag || '@local.invalid', 'EDUCATOR', v_x);
    v_adm    := selftest.f11_user('f25-adm-'    || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_inst);

    -- ═══════════════════════════════════════════════════════════════════════
    -- F25-T01  the class's teacher
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if to_regprocedure('public.tujuan_belum_tercapai(uuid,uuid)') is null then
        raise exception 'tujuan_belum_tercapai does not exist';
      end if;
      perform selftest.as_user_uid(v_guru);
      execute 'select array_agg(t.statement order by t.statement) from public.tujuan_belum_tercapai($1, $2) t'
        into v_got using v_class, v_l1;
      if v_got is distinct from array[v_low_stmt] then
        v_probs := selftest.f25_note(v_probs, 'F25-T01', format('L1 (below on %s, at the mark on %s) gave %s, not [%s]',
          v_low, v_high, coalesce(v_got::text, 'nothing'), v_low_stmt));
      end if;
      if v_got is not null and (v_low = any (v_got) or v_high_stmt = any (v_got)) then
        v_probs := selftest.f25_note(v_probs, 'F25-T01', 'a code, or an objective at the mark, was listed');
      end if;
      execute 'select count(*) from public.tujuan_belum_tercapai($1, $2)' into v_n using v_class, v_l2;
      if v_n <> 0 then
        v_probs := selftest.f25_note(v_probs, 'F25-T01', format('a later attempt at the mark left %s objective(s) listed', v_n));
      end if;
      execute 'select count(*) from public.tujuan_belum_tercapai($1, $2)' into v_n using v_class, v_l3;
      if v_n <> 0 then
        v_probs := selftest.f25_note(v_probs, 'F25-T01', 'an attempt sat in another class was read');
      end if;
      perform selftest.as_owner();
      select count(*) into v_cols from information_schema.routines rt
        join information_schema.parameters pa on pa.specific_name = rt.specific_name and pa.parameter_mode = 'OUT'
       where rt.routine_schema = 'public' and rt.routine_name = 'tujuan_belum_tercapai';
      if v_cols <> 2 then
        v_probs := selftest.f25_note(v_probs, 'F25-T01', format('the answer has %s columns, not the objective and its statement', v_cols));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f25_note(v_probs, 'F25-T01', 'threw: ' || sqlerrm);
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F25-T02  isolation
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if to_regprocedure('public.tujuan_belum_tercapai(uuid,uuid)') is null then
        raise exception 'tujuan_belum_tercapai does not exist';
      end if;
      for r in select * from (values
          (v_guru2,  v_class, 'a teacher of another class of the school'),
          (v_guru_x, v_class, 'a teacher of another school'),
          (v_adm,    v_class, 'a school admin with no teaching role'),
          (v_guru,   v_other, 'the class''s teacher asking under another class')) as t(u, k, siapa) loop
        perform selftest.as_user_uid(r.u);
        begin
          execute 'select count(*) from public.tujuan_belum_tercapai($1, $2)' into v_n using r.k, v_l1;
          if v_n <> 0 then
            v_probs := selftest.f25_note(v_probs, 'F25-T02', format('%s was given %s objective(s)', r.siapa, v_n));
          end if;
        exception when others then
          v_probs := selftest.f25_note(v_probs, 'F25-T02', format('%s was refused with an error (%s), not an empty answer', r.siapa, sqlerrm));
        end;
        perform selftest.as_owner();
      end loop;
      perform selftest.as_anon();
      v_err := null;
      begin
        execute 'select count(*) from public.tujuan_belum_tercapai($1, $2)' into v_n using v_class, v_l1;
        v_err := 'answered';
      exception when others then null;
      end;
      perform selftest.as_owner();
      if v_err is not null then v_probs := selftest.f25_note(v_probs, 'F25-T02', 'an anonymous caller reached the function'); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f25_note(v_probs, 'F25-T02', 'threw: ' || sqlerrm);
    end;

    raise exception 'F25_ROLLBACK';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F25_ROLLBACK' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in select * from unnest(
      array['F25-T01', 'F25-T02'],
      array['W2.18 -- the objectives a learner has not yet reached', 'W2.18 -- the same question, isolated'],
      array[
        'tujuan_belum_tercapai gives the class''s teacher the objective, by its statement, that the learner''s latest '
          || 'official Uji Penguasaan in the class recorded below the sealed mark, and not the one at the mark; a later '
          || 'attempt at the mark takes both off; an attempt sat in another class is not read; the answer is the '
          || 'objective and its statement only',
        'a teacher of another class of the school, a teacher of another school, a school admin with no teaching role, and '
          || 'the class''s own teacher asking under another class get an empty answer; an anonymous caller is refused'
      ]) as t(tid, tarea, tdetail)
  loop
    id := r.tid; area := r.tarea;
    if v_fatal <> '' then
      ok := false; detail := 'the suite aborted before this test could report: ' || left(v_fatal, 200);
    elsif v_probs ? r.tid then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> r.tid),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> r.tid) x));
    else
      ok := true; detail := r.tdetail;
    end if;
    return next;
  end loop;

  id := 'F25-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-25 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable25() from public;
