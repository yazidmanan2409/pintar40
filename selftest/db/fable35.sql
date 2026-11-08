-- FABLE-35 · Reporting Quality Gate (owner directive, 9 Nov 2026): A CHAPTER WRITTEN IN STUDIO NAMES ITS TOPICS,
-- measured against supabase/migrations/20270111100000_a_chapter_written_in_studio_names_its_topics.sql.
--
--   F35-T01  Two chapters whose Uji Penguasaan are course-level definitions (the shape Studio's intake makes) and whose
--            objectives share the code «X1» (each named by its own statement), each sat by the same five learners of
--            a class of their own: class.topic_mastery, for the class's teacher, gives TWO rows for «X1», each with
--            its objective's id and statement and five learners, and never one merged «X1»; institution.competency_
--            outcomes, for the school's Dekan, names both objectives by their statements; tujuan_belum_tercapai names
--            the one objective a learner is below the mark on by its statement and chapter, not by «X1».
--   F35-S01  THE SAMPLE IS PEOPLE (the 5-learner minimum, H31's rule): those five learners' ten results are a «Pemahaman»
--            sample of five, and three learners who sat both chapters (six results) are under the minimum for
--            class.comprehension and class.topic_mastery, counted as three.
--   F35-A01  Those sittings record no cohort (a learner PINTAR places is a member of a Kelas, never of the COHORT node):
--            institution.cohort_comparison counts them in the Angkatan above their Kelas and has no unnamed row.
--
-- EVERY ROW IS ROLLED BACK.

create schema if not exists selftest;

do $$
begin
  if to_regprocedure('selftest.as_user_uid(uuid)') is null or to_regprocedure('selftest.f11_user(text,public.app_role,uuid)') is null
     or to_regprocedure('selftest.as_owner()') is null or false then
    raise exception 'apply fable01, fable06 and fable11.sql before fable35.sql: the helpers are missing';
  end if;
end $$;

-- a chapter as Studio's intake leaves it: a course, one module, one lesson, one objective, and a COURSE-level Uji
-- Penguasaan (module_id null)
create or replace function selftest.f35_bab(p_inst uuid, p_title text, p_code text, p_statement text)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_c uuid; v_m uuid; v_l uuid; v_d uuid;
begin
  insert into public.courses (institution_id, subject, stage, grade_label, title)
  values (p_inst, 'Matematika', 'SD', 'Kelas 5', p_title) returning id into v_c;
  insert into public.modules (course_id, institution_id, ordinal, title) values (v_c, p_inst, 1, 'Bab ' || p_title) returning id into v_m;
  insert into public.lessons (module_id, institution_id, ordinal, title) values (v_m, p_inst, 1, 'Pelajaran ' || p_title) returning id into v_l;
  insert into public.learning_objectives (lesson_id, institution_id, code, statement, bloom) values (v_l, p_inst, p_code, p_statement, 'APPLY');
  insert into public.assessment_definitions (institution_id, course_id, module_id, title, mode, bank_type, item_count)
  values (p_inst, v_c, null, 'Uji Penguasaan ' || p_title, 'POST_TEST', 'TEST', 1) returning id into v_d;
  -- a release of the course, which a session of its definition records (INV-04, INV-29)
  insert into public.plp_releases (institution_id, course_id, version_label) values (p_inst, v_c, '35.0.1');
  return v_d;
end $$;
revoke all on function selftest.f35_bab(uuid, text, text, text) from public;

-- one finished official Uji Penguasaan of a given chapter (its definition written at insert: INV-33), as F25's
-- f25_attempt makes one, for a learner of a class (a new one when p_person is null)
create or replace function selftest.f35_attempt(p_template uuid, p_person uuid, p_class uuid, p_definition uuid, p_per_domain jsonb,
                                                p_finished timestamptz)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare s record; v_person uuid := p_person; v_e uuid; v_new uuid := gen_random_uuid();
begin
  select x.institution_id, x.academic_period_id, e.programme_id into s
    from public.assessment_sessions x join public.enrollments e on e.id = x.enrollment_id
   where x.id = p_template;
  if v_person is null then
    insert into public.persons (display_name) values ('Murid F35 ' || left(v_new::text, 8)) returning persons.id into v_person;
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
  -- no cohort recorded: a learner PINTAR placed is a member of the Kelas, never of the COHORT node (start_learning_session)
  select v_new, v_person, x.institution_id, v_e, x.academic_period_id, p_class, null,
         (select pr.id from public.plp_releases pr join public.assessment_definitions d on d.course_id = pr.course_id
           where d.id = p_definition order by pr.created_at limit 1), p_definition, 1, x.engine_version,
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
revoke all on function selftest.f35_attempt(uuid, uuid, uuid, uuid, jsonb, timestamptz) from public;

create or replace function selftest.run_fable35()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_tag text := to_char(clock_timestamp(), 'HH24MISSUS'); v_fatal text := ''; t01 text[] := array[]::text[]; a01 text[] := array[]::text[];
  v_kohort uuid; s01 text[] := array[]::text[]; v_kls3 uuid;
  v_tpl uuid; v_inst uuid; v_class uuid; v_parent uuid; v_period uuid; v_mark numeric; v_kls uuid;
  v_da uuid; v_db uuid; v_guru uuid; v_dekan uuid; v_p uuid; v_l1 uuid; v_s uuid; m record;
  v_j jsonb; v_rows jsonb; v_n int; v_got text[];
begin
  perform selftest.as_owner();
  begin
    -- a real finished official Uji Penguasaan with its sealed mark, as F25 takes it
    select s.id, s.institution_id, s.class_node_id, s.pass_mark into v_tpl, v_inst, v_class, v_mark
      from public.assessment_sessions s
      join public.assessment_results res on res.session_id = s.id
     where s.mode = 'POST_TEST' and s.status = 'FINALIZED' and s.pass_mark is not null
       and s.assessment_assignment_id is not null and public.effective_evidence_class(s.id) = 'OFFICIAL'
     order by s.finalized_at desc limit 1;
    if v_tpl is null then raise exception 'the fixture has no finished official Uji Penguasaan with a mark'; end if;
    select n.parent_id, n.academic_period_id into v_parent, v_period from public.org_nodes n where n.id = v_class;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_parent, 'CLASS', 'Kelas F35 ' || v_tag, v_period) returning org_nodes.id into v_kls;
    v_guru  := selftest.f11_user('f35-guru-'  || v_tag || '@local.invalid', 'EDUCATOR', v_kls);
    v_dekan := selftest.f11_user('f35-dekan-' || v_tag || '@local.invalid', 'DEAN',
                                 (select o.id from public.org_nodes o where o.institution_id = v_inst and o.kind = 'INSTITUTION'));

    -- two chapters written in Studio, both naming their objective «X1»
    v_da := selftest.f35_bab(v_inst, 'F35 A ' || v_tag, 'X1', 'Tujuan bab A F35 ' || v_tag);
    v_db := selftest.f35_bab(v_inst, 'F35 B ' || v_tag, 'X1', 'Tujuan bab B F35 ' || v_tag);

    -- five learners each sit both: chapter A at 0.40 (the first under the mark), chapter B at 0.90
    for m in select g from generate_series(1, 5) g loop
      v_p := selftest.f35_attempt(v_tpl, null, v_kls, v_da,
        jsonb_build_object('X1', jsonb_build_object('benar', 2, 'total', 5, 'penguasaan', case when m.g = 1 then round(v_mark - 0.30, 4) else 0.40 end)),
        now() - interval '2 days');
      if m.g = 1 then v_l1 := v_p; end if;
      perform selftest.f35_attempt(v_tpl, v_p, v_kls, v_db,
        jsonb_build_object('X1', jsonb_build_object('benar', 5, 'total', 5, 'penguasaan', 0.90)), now() - interval '1 day');
    end loop;

    -- the class's teacher
    perform selftest.as_user_uid(v_guru);
    v_j := public.metric_evaluate('class.topic_mastery', v_kls, v_inst);
    perform selftest.as_owner();
    v_rows := coalesce(v_j -> 'value', '[]'::jsonb);
    if v_j ->> 'status' is distinct from 'ok' then
      t01 := t01 || format('class.topic_mastery answered %s for the class''s teacher', coalesce(v_j ->> 'status', 'nothing'));
    end if;
    select count(*) into v_n from jsonb_array_elements(v_rows) e where e ->> 'code' = 'X1';
    if v_n <> 2 then
      t01 := t01 || format('class.topic_mastery gave %s row(s) for «X1»; two chapters'' objectives must stay two topics', v_n);
    end if;
    select array_agg(e ->> 'competency' order by e ->> 'competency') into v_got from jsonb_array_elements(v_rows) e
     where e ->> 'objective_id' is not null and (e ->> 'learners')::int = 5;
    if v_got is distinct from array['Tujuan bab A F35 ' || v_tag, 'Tujuan bab B F35 ' || v_tag] then
      t01 := t01 || format('class.topic_mastery named the topics %s, not each objective by its statement with its five learners',
                           coalesce(v_rows::text, 'nothing'));
    end if;

    -- the school's Dekan
    perform selftest.as_user_uid(v_dekan);
    v_j := public.metric_evaluate('institution.competency_outcomes', null, v_inst);
    perform selftest.as_owner();
    select count(*) into v_n from jsonb_array_elements(coalesce(v_j -> 'value', '[]'::jsonb)) e
     where e ->> 'competency' in ('Tujuan bab A F35 ' || v_tag, 'Tujuan bab B F35 ' || v_tag) and e ->> 'objective_id' is not null;
    if v_n <> 2 then
      t01 := t01 || format('institution.competency_outcomes named %s of the two objectives by their statements (status %s)',
                           v_n, coalesce(v_j ->> 'status', 'nothing'));
    end if;

    -- F35-S01: the sample is people. The five learners' class: ten results, five learners
    perform selftest.as_user_uid(v_guru);
    v_j := public.metric_evaluate('class.comprehension', v_kls, v_inst);
    perform selftest.as_owner();
    if (v_j ->> 'sample')::int is distinct from 5 then
      s01 := s01 || format('«Pemahaman» counts %s for five learners who sat ten Uji Penguasaan', coalesce(v_j ->> 'sample', v_j ->> 'have', 'nothing'));
    end if;
    -- three learners who sat both chapters: six results, three learners, under the minimum of five
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_parent, 'CLASS', 'Kelas F35 kecil ' || v_tag, v_period) returning org_nodes.id into v_kls3;
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    select a.person_id, 'EDUCATOR', v_kls3, now() - interval '1 day', now() + interval '30 days' from public.accounts a where a.auth_user_id = v_guru;
    perform set_config('app.seed_intent', '', true);
    for m in select g from generate_series(1, 3) g loop
      v_p := selftest.f35_attempt(v_tpl, null, v_kls3, v_da, jsonb_build_object('X1', jsonb_build_object('benar', 3, 'total', 5, 'penguasaan', 0.6)), now() - interval '2 days');
      perform selftest.f35_attempt(v_tpl, v_p, v_kls3, v_db, jsonb_build_object('X1', jsonb_build_object('benar', 4, 'total', 5, 'penguasaan', 0.8)), now() - interval '1 day');
    end loop;
    perform selftest.as_user_uid(v_guru);
    for m in select x from unnest(array['class.comprehension', 'class.topic_mastery']) x loop
      v_j := public.metric_evaluate(m.x, v_kls3, v_inst);
      if v_j ->> 'status' = 'ok' or v_j ? 'value' then
        s01 := s01 || format('%s shows a figure for three learners (six results): %s', m.x, left(v_j::text, 160));
      elsif (v_j ->> 'have')::int is distinct from 3 then
        s01 := s01 || format('%s counts %s, not the three learners', m.x, coalesce(v_j ->> 'have', 'nothing'));
      end if;
    end loop;
    perform selftest.as_owner();

    -- F35-A01: «Perbandingan angkatan» counts the class's learners in the Angkatan above their Kelas
    select n.id into v_kohort from public.org_nodes k join public.org_nodes n on n.id = any (k.jalur) and n.kind = 'COHORT'
     where k.id = v_kls order by array_position(k.jalur, n.id) desc limit 1;
    if v_kohort is null then raise exception 'the fixture class has no Angkatan above it'; end if;
    perform selftest.as_user_uid(v_dekan);
    v_j := public.metric_evaluate('institution.cohort_comparison', null, v_inst);
    perform selftest.as_owner();
    if exists (select 1 from jsonb_array_elements(coalesce(v_j -> 'value', '[]'::jsonb)) e where e ->> 'cohort_node_id' is null) then
      a01 := a01 || format('a row names no Angkatan: %s', left(coalesce((v_j -> 'value')::text, 'nothing'), 300));
    end if;
    select count(*) into v_n from public.official_sessions s
     where s.class_node_id = v_kls and s.cohort_node_id is null and s.mode = 'POST_TEST';
    if v_n <> 10 then a01 := a01 || format('the case is not measured: %s of the class''s 10 sittings record no cohort', v_n); end if;
    if not exists (select 1 from jsonb_array_elements(coalesce(v_j -> 'value', '[]'::jsonb)) e
                    where e ->> 'cohort_node_id' = v_kohort::text and (e ->> 'learners')::int >= 5) then
      a01 := a01 || 'the Angkatan above the class does not count its five learners'::text;
    end if;

    -- the objective learner 1 has not reached
    perform selftest.as_user_uid(v_guru);
    select array_agg(x.statement order by x.statement) into v_got from public.tujuan_belum_tercapai(v_kls, v_l1) x where x.objective_id is not null;
    perform selftest.as_owner();
    if v_got is distinct from array['Tujuan bab A F35 ' || v_tag] then
      t01 := t01 || format('tujuan_belum_tercapai named %s for the learner under the mark in chapter A only', coalesce(v_got::text, 'nothing'));
    end if;
    -- undo the lot
    raise exception 'f35-rollback';
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    perform selftest.as_owner();
    if sqlerrm <> 'f35-rollback' then v_fatal := sqlerrm; end if;
  end;

  id := 'F35-T01'; area := 'Reporting Quality Gate -- a chapter written in Studio names its topics';
  if v_fatal <> '' then ok := false; detail := 'the suite aborted: ' || left(v_fatal, 300);
  elsif cardinality(t01) > 0 then ok := false; detail := format('%s problem(s): %s', cardinality(t01), array_to_string(t01, '; '));
  else ok := true; detail := 'two Studio chapters sharing the code «X1» stay two topics, each named by its statement with its five '
    || 'learners, for the class''s teacher (class.topic_mastery) and the school''s Dekan (institution.competency_outcomes); '
    || 'tujuan_belum_tercapai names the one objective under the mark by its statement';
  end if;
  return next;
  id := 'F35-S01'; area := 'Reporting Quality Gate -- the 5-learner minimum counts learners, not results';
  if v_fatal <> '' then ok := false; detail := 'the suite aborted: ' || left(v_fatal, 300);
  elsif cardinality(s01) > 0 then ok := false; detail := format('%s problem(s): %s', cardinality(s01), array_to_string(s01, '; '));
  else ok := true; detail := 'five learners who sat ten Uji Penguasaan are a «Pemahaman» sample of five; three learners who sat two chapters '
    || '(six results) are under the minimum for «Pemahaman» and «Penguasaan per topik», counted as three';
  end if;
  return next;
  id := 'F35-A01'; area := 'Reporting Quality Gate -- «Perbandingan angkatan» names the Angkatan of a learner placed in a Kelas';
  if v_fatal <> '' then ok := false; detail := 'the suite aborted: ' || left(v_fatal, 300);
  elsif cardinality(a01) > 0 then ok := false; detail := format('%s problem(s): %s', cardinality(a01), array_to_string(a01, '; '));
  else ok := true; detail := 'sittings that recorded no cohort (every learner PINTAR places is a member of a Kelas) are counted in the '
    || 'Angkatan above their Kelas, and no row of institution.cohort_comparison is unnamed';
  end if;
  return next;
  id := 'F35-DONE'; area := 'fable35'; ok := true; detail := 'done'; return next;
end $$;
revoke all on function selftest.run_fable35() from public;
