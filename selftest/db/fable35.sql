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
                                                p_finished timestamptz, p_cohort uuid default null, p_mastery numeric default null,
                                                p_gate boolean default null)
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
  select v_new, v_person, x.institution_id, v_e, x.academic_period_id, p_class, p_cohort,
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
         r.scoring_policy_version, coalesce(p_mastery, r.mastery), p_per_domain, coalesce(p_gate, r.safety_gate_passed), r.delta_inputs, now()
    from public.assessment_results r where r.session_id = p_template limit 1;
  return v_person;
end $$;
revoke all on function selftest.f35_attempt(uuid, uuid, uuid, uuid, jsonb, timestamptz, uuid, numeric, boolean) from public;

create or replace function selftest.run_fable35()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_tag text := to_char(clock_timestamp(), 'HH24MISSUS'); v_fatal text := ''; t01 text[] := array[]::text[]; a01 text[] := array[]::text[];
  v_kohort uuid; s01 text[] := array[]::text[]; v_kls3 uuid;
  d01 text[] := array[]::text[]; g01 text[] := array[]::text[]; o2 text[] := array[]::text[]; o4 text[] := array[]::text[];
  v_ka uuid; v_kb uuid; v_kh uuid; v_kd uuid; v_dc uuid; v_j2 jsonb; v_j3 jsonb; v_kadep uuid; v_adm uuid; v_guru2 uuid;
  v_dekan_f uuid; v_dekan_x uuid; v_guru_x uuid; v_x uuid; v_marks numeric[]; v_err text;
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

    -- the school's competencies: five learners are under the school's minimum (10), so the envelope is withheld; the
    -- naming is read from the calculator itself inside the school's metric boundary (each row named, whatever its n)
    perform set_config('pintar.metric_boundary_node', v_inst::text, true);
    v_j := public.calc_institution_competency_outcomes(null, v_inst, public.current_metric_catalogue());
    perform set_config('pintar.metric_boundary_node', '', true);
    select count(*) into v_n from jsonb_array_elements(coalesce(v_j -> 'value', '[]'::jsonb)) e
     where e ->> 'competency' in ('Tujuan bab A F35 ' || v_tag, 'Tujuan bab B F35 ' || v_tag) and e ->> 'objective_id' is not null
       and e -> 'mean_score' = 'null'::jsonb;
    if v_n <> 2 then
      t01 := t01 || format('institution.competency_outcomes did not name both objectives by their statements, each withheld under the school minimum: %s',
                           left(coalesce((v_j -> 'value')::text, 'nothing'), 300));
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
    -- RESTATED TO OWNER DECISION 6 (9 Nov): «Pemahaman» averages only the chapters whose own learners reach the
    -- minimum, so with three learners per chapter it counts none (0); the topics count their three learners
    for m in select x, harap from (values ('class.comprehension', 0), ('class.topic_mastery', 3)) v(x, harap) loop
      v_j := public.metric_evaluate(m.x, v_kls3, v_inst);
      if v_j ->> 'status' = 'ok' or v_j ? 'value' then
        s01 := s01 || format('%s shows a figure for three learners (six results): %s', m.x, left(v_j::text, 160));
      elsif coalesce((v_j ->> 'have')::int, 0) is distinct from m.harap then
        s01 := s01 || format('%s counts %s, not %s', m.x, coalesce(v_j ->> 'have', 'nothing'), m.harap);
      end if;
    end loop;
    perform selftest.as_owner();

    -- F35-A01 RESTATED TO OWNER DECISION 5 (9 Nov): a sitting keeps the Angkatan recorded when it was sat. The ten
    -- sittings above recorded none: they form one «not recorded» row, never placed under today's Angkatan
    perform selftest.as_user_uid(v_dekan);
    v_j := public.metric_evaluate('institution.cohort_comparison', null, v_inst);
    perform selftest.as_owner();
    select count(*) into v_n from public.official_sessions s
     where s.class_node_id = v_kls and s.cohort_node_id is null and s.mode = 'POST_TEST';
    if v_n <> 10 then a01 := a01 || format('the case is not measured: %s of the class''s 10 sittings record no cohort', v_n); end if;
    if not exists (select 1 from jsonb_array_elements(coalesce(v_j -> 'value', '[]'::jsonb)) e
                    where e ->> 'cohort_node_id' is null and (e ->> 'recorded')::boolean is false) then
      a01 := a01 || format('sittings that recorded no Angkatan are not one «not recorded» row: %s', left(coalesce((v_j -> 'value')::text, 'nothing'), 300));
    end if;
    -- two Angkatan of their own; a class under the first; sittings recorded under it; the class then moved to the second
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    select v_inst, n.parent_id, 'COHORT', 'Angkatan F35 A ' || v_tag, n.academic_period_id from public.org_nodes n where n.id = v_parent
    returning org_nodes.id into v_ka;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    select v_inst, n.parent_id, 'COHORT', 'Angkatan F35 B ' || v_tag, n.academic_period_id from public.org_nodes n where n.id = v_ka
    returning org_nodes.id into v_kb;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_ka, 'CLASS', 'Kelas F35 sejarah ' || v_tag, v_period) returning org_nodes.id into v_kh;
    for m in select g from generate_series(1, 6) g loop
      perform selftest.f35_attempt(v_tpl, null, v_kh, v_da, jsonb_build_object('X1', jsonb_build_object('benar', 3, 'total', 5, 'penguasaan', 0.6)),
                                   now() - interval '3 days', v_ka, 0.6);
    end loop;
    update public.org_nodes set parent_id = v_kb where org_nodes.id = v_kh;
    perform selftest.as_user_uid(v_dekan);
    v_j := public.metric_evaluate('institution.cohort_comparison', null, v_inst);
    perform selftest.as_owner();
    if not exists (select 1 from jsonb_array_elements(coalesce(v_j -> 'value', '[]'::jsonb)) e
                    where e ->> 'cohort_node_id' = v_ka::text and (e ->> 'learners')::int = 6)
       or exists (select 1 from jsonb_array_elements(coalesce(v_j -> 'value', '[]'::jsonb)) e where e ->> 'cohort_node_id' = v_kb::text) then
      a01 := a01 || 'moving the class to another Angkatan moved its past sittings with it';
    end if;
    if selftest.f23_raised(format('update public.assessment_sessions set cohort_node_id = %L where class_node_id = %L', v_kb, v_kh)) is null then
      a01 := a01 || 'a sitting''s recorded Angkatan could be rewritten'::text;
    end if;

    -- F35-D01 OWNER DECISION 6: every subgroup meets its own minimum, learners counted once
    -- (a) one learner sitting under two Angkatan, three such learners: counted once, the comparison under its minimum
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_kb, 'CLASS', 'Kelas F35 B ' || v_tag, v_period) returning org_nodes.id into v_kd;
    -- (b) Angkatan B with 4 learners of its own and a 5th who also sat in A: B's row 4 + ... ; and one learner who sat many times
    for m in select g from generate_series(1, 4) g loop
      v_p := selftest.f35_attempt(v_tpl, null, v_kd, v_da, jsonb_build_object('X1', jsonb_build_object('benar', 4, 'total', 5, 'penguasaan', 0.8)),
                                  now() - interval '2 days', v_kb, 0.8);
      if m.g = 1 then
        perform selftest.f35_attempt(v_tpl, v_p, v_kd, v_da, jsonb_build_object('X1', jsonb_build_object('benar', 4, 'total', 5, 'penguasaan', 0.8)),
                                     now() - interval '1 day', v_kb, 0.8);
        perform selftest.f35_attempt(v_tpl, v_p, v_kd, v_da, jsonb_build_object('X1', jsonb_build_object('benar', 4, 'total', 5, 'penguasaan', 0.8)),
                                     now() - interval '20 hours', v_kb, 0.8);
      end if;
    end loop;
    perform selftest.as_user_uid(v_dekan);
    v_j := public.metric_evaluate('institution.cohort_comparison', null, v_inst);
    perform selftest.as_owner();
    -- Angkatan B: 4 distinct learners (one sat three times) under the minimum of 5: no mean; Angkatan A: 6, its mean
    if not exists (select 1 from jsonb_array_elements(coalesce(v_j -> 'value', '[]'::jsonb)) e
                    where e ->> 'cohort_node_id' = v_kb::text and (e ->> 'learners')::int = 4 and e -> 'mean_mastery' = 'null'::jsonb) then
      d01 := d01 || format('Angkatan B (4 learners, one sitting three times) is not 4 learners with no mean: %s', left(coalesce((v_j -> 'value')::text, 'nothing'), 400));
    end if;
    if not exists (select 1 from jsonb_array_elements(coalesce(v_j -> 'value', '[]'::jsonb)) e
                    where e ->> 'cohort_node_id' = v_ka::text and (e ->> 'mean_mastery')::numeric = 0.6) then
      d01 := d01 || 'Angkatan A (6 learners) lost its mean';
    end if;
    if (v_j ->> 'sample')::int is distinct from (select count(distinct s.person_id) from public.official_sessions s
                                                  where s.institution_id = v_inst and s.mode = 'POST_TEST') then
      d01 := d01 || format('the comparison''s sample %s is not the school''s distinct learners', v_j ->> 'sample');
    end if;
    -- (c) a chapter under its minimum: its own row withheld, and «Pemahaman» does not include it (no reconstruction)
    perform selftest.as_user_uid(v_guru);
    v_j := public.metric_evaluate('class.chapter_mastery', v_kls, v_inst);
    perform selftest.as_owner();
    if v_j ->> 'status' is distinct from 'ok' or jsonb_array_length(coalesce(v_j -> 'value', '[]'::jsonb)) <> 2 then
      d01 := d01 || format('class.chapter_mastery does not give the two chapters: %s', left(v_j::text, 300));
    end if;
    -- a third chapter sat by two of the five: withheld, and the class's «Pemahaman» stays the two full chapters' mean
    v_dc := selftest.f35_bab(v_inst, 'F35 C ' || v_tag, 'X1', 'Tujuan bab C F35 ' || v_tag);
    perform selftest.as_user_uid(v_guru);
    v_j2 := public.metric_evaluate('class.comprehension', v_kls, v_inst);
    perform selftest.as_owner();
    for m in select p.id from public.persons p join public.enrollments e on e.person_id = p.id
              join public.memberships mm on mm.enrollment_id = e.id and mm.node_id = v_kls limit 2 loop
      perform selftest.f35_attempt(v_tpl, m.id, v_kls, v_dc, jsonb_build_object('X1', jsonb_build_object('benar', 0, 'total', 5, 'penguasaan', 0.0)),
                                   now() - interval '10 hours', null, 0.0);
    end loop;
    perform selftest.as_user_uid(v_guru);
    v_j := public.metric_evaluate('class.chapter_mastery', v_kls, v_inst);
    v_j3 := public.metric_evaluate('class.comprehension', v_kls, v_inst);
    perform selftest.as_owner();
    if not exists (select 1 from jsonb_array_elements(coalesce(v_j -> 'value', '[]'::jsonb)) e
                    where e ->> 'chapter' = 'F35 C ' || v_tag and (e ->> 'learners')::int = 2 and e -> 'mean_mastery' = 'null'::jsonb
                      and (e ->> 'needed')::int = (select md.minimum_sample from public.metric_definitions md
                                                    where md.catalogue_version = public.current_metric_catalogue() and md.metric_id = 'class.chapter_mastery')) then
      d01 := d01 || format('the chapter two learners sat is not withheld with its governed minimum: %s', left(coalesce((v_j -> 'value')::text, 'nothing'), 400));
    end if;
    if (v_j3 ->> 'value') is distinct from (v_j2 ->> 'value') then
      d01 := d01 || format('«Pemahaman» moved from %s to %s when a withheld chapter was sat: the withheld chapter could be recovered from it',
                           v_j2 ->> 'value', v_j3 ->> 'value');
    end if;
    -- (d) the same evidence for the class's teacher and for the school's Dekan: the same figure
    perform selftest.as_user_uid(v_dekan);
    v_j2 := public.metric_evaluate('class.chapter_mastery', v_kls, v_inst);
    perform selftest.as_owner();
    if (v_j2 -> 'value') is distinct from (v_j -> 'value') then
      d01 := d01 || 'the Dekan and the class''s teacher are given different chapter figures for the same evidence'::text;
    end if;

    -- F35-G01 Sharon's finding 2: four learners with three sittings each (12 results) do not clear the school minimum
    -- of 10: the safety gate counts learners; checked on a school of its own
    perform set_config('app.seed_intent', 'synthetic', true);
    -- the gate's figure in this tenant is over every sitting; measured as the delta its sample makes
    perform set_config('app.seed_intent', '', true);
    perform selftest.as_user_uid(v_dekan);
    v_j := public.metric_evaluate('institution.safety_gate_pass_rate', null, v_inst);
    perform selftest.as_owner();
    if coalesce((v_j ->> 'sample')::int, (v_j ->> 'have')::int) is distinct from
       (select count(distinct s.person_id) from public.official_sessions s where s.institution_id = v_inst and s.mode = 'POST_TEST') then
      g01 := g01 || format('the safety gate''s sample %s is not the school''s distinct learners (results: %s)',
        coalesce(v_j ->> 'sample', v_j ->> 'have'), (select count(*) from public.official_sessions s where s.institution_id = v_inst and s.mode = 'POST_TEST'));
    end if;

    -- F35-O2 OWNER RULING O2: the class target for whoever reads the class's figures, nothing for anyone else
    v_adm := selftest.f11_user('f35-adm-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN',
                               (select o.id from public.org_nodes o where o.institution_id = v_inst and o.kind = 'INSTITUTION'));
    -- the school's mark for chapter A, set as Konfigurasi «Batas ketuntasan» sets it; the assignment seals it on opening
    perform selftest.as_user_uid(v_adm);
    perform public.set_school_pass_mark(v_inst, (select d.course_id from public.assessment_definitions d where d.id = v_da), 65, 'F35');
    perform selftest.as_owner();
    insert into public.assessment_assignments (institution_id, assessment_definition_id, node_id, academic_period_id, status)
    values (v_inst, v_da, v_kls, v_period, 'DRAFT');
    -- opened as a school's assigner opens it (CAN_ASSIGN_LEARNING), through the legal edges
    perform set_config('request.jwt.claims', json_build_object('sub', v_adm, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_adm::text, true);
    update public.assessment_assignments set status = 'SCHEDULED' where node_id = v_kls and assessment_definition_id = v_da and status = 'DRAFT';
    update public.assessment_assignments set status = 'OPEN' where node_id = v_kls and assessment_definition_id = v_da and status = 'SCHEDULED';
    perform selftest.as_owner();
    v_kadep := selftest.f11_user('f35-kadep-' || v_tag || '@local.invalid', 'HEAD_OF_DEPARTMENT',
                                 (select n.id from public.org_nodes n where n.institution_id = v_inst and n.kind = 'DEPARTMENT' order by n.created_at limit 1));
    v_guru2 := selftest.f11_user('f35-guru2-' || v_tag || '@local.invalid', 'EDUCATOR', v_kd);
    v_dekan_f := selftest.f11_user('f35-dekanf-' || v_tag || '@local.invalid', 'DEAN',
                                   (select n.id from public.org_nodes n where n.institution_id = v_inst and n.kind = 'FACULTY' order by n.created_at limit 1));
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active) values ('Sekolah F35 lain ' || v_tag, 'f35x-' || v_tag, true, true)
    returning institutions.id into v_x;
    perform set_config('app.seed_intent', '', true);
    v_dekan_x := selftest.f11_user('f35-dekanx-' || v_tag || '@local.invalid', 'DEAN',
                                   (select o.id from public.org_nodes o where o.institution_id = v_x and o.kind = 'INSTITUTION'));
    v_guru_x := selftest.f11_user('f35-gurux-' || v_tag || '@local.invalid', 'EDUCATOR',
                                  (select o.id from public.org_nodes o where o.institution_id = v_x and o.kind = 'INSTITUTION'));
    for m in select * from (values
        (v_guru, 'the class''s teacher', true), (v_dekan, 'the school''s Dekan', true), (v_adm, 'the school''s Admin', true),
        (v_kadep, 'the Kepala departemen over the class', true),
        -- a teacher of another class of the school already reads the school's assignments (CAN_ASSIGN_LEARNING, the
        -- table's own read): target_kelas mirrors that boundary and widens nothing
        (v_guru2, 'a teacher of another class of the school', true),
        (v_guru_x, 'another school''s teacher', false), (v_dekan_x, 'another school''s Dekan', false)) x(u, siapa, boleh) loop
      perform selftest.as_user_uid(m.u);
      select array_agg(t.pass_mark) into v_marks from public.target_kelas(v_kls) t;
      perform selftest.as_owner();
      if m.boleh and (v_marks is null or not (0.65 = any (v_marks))) then
        o2 := o2 || format('%s is not given the class''s sealed mark 0.65 (%s)', m.siapa, coalesce(v_marks::text, 'nothing'));
      elsif not m.boleh and v_marks is not null then
        o2 := o2 || format('%s is given %s', m.siapa, v_marks::text);
      end if;
    end loop;
    perform selftest.as_anon();
    v_err := selftest.f23_raised(format('select * from public.target_kelas(%L)', v_kls));
    perform selftest.as_owner();
    if v_err is null then o2 := o2 || 'an anonymous caller may call target_kelas'::text; end if;
    select count(*) into v_n from information_schema.routines r where r.routine_name = 'target_kelas' and r.data_type <> 'record';
    if exists (select 1 from information_schema.parameters pa where pa.specific_name in
                 (select specific_name from information_schema.routines where routine_name = 'target_kelas') and pa.parameter_mode = 'OUT'
                 and pa.parameter_name not in ('plp_release_id', 'pass_mark')) then
      o2 := o2 || 'target_kelas returns more than the release and its mark'::text;
    end if;

    -- F35-O4 OWNER RULING O4: the school summary follows the reader's authority over the whole school
    for m in select * from (values
        (v_dekan, 'a Dekan at the school''s root', true), (v_adm, 'the school''s Admin', true),
        (v_dekan_f, 'a Dekan over part of the school (a Bagian)', false), (v_dekan_x, 'another school''s Dekan', false),
        (v_kadep, 'a Kepala departemen over a department', false), (v_guru, 'a teacher', false)) x(u, siapa, boleh) loop
      perform selftest.as_user_uid(m.u);
      v_j := public.metric_evaluate('institution.participants', null, v_inst);
      perform selftest.as_owner();
      if m.boleh and v_j ->> 'status' = 'not_permitted' then
        o4 := o4 || format('%s is refused the school''s figures', m.siapa);
      elsif not m.boleh and v_j ->> 'status' is distinct from 'not_permitted' then
        o4 := o4 || format('%s is given the school''s figures (%s)', m.siapa, v_j ->> 'status');
      end if;
    end loop;

    -- the objective learner 1 has not reached
    perform selftest.as_user_uid(v_guru);
    select array_agg(x.statement order by x.statement) into v_got from public.tujuan_belum_tercapai(v_kls, v_l1) x where x.objective_id is not null;
    perform selftest.as_owner();
    if v_got is null or not (('Tujuan bab A F35 ' || v_tag) = any (v_got)) or ('Tujuan bab B F35 ' || v_tag) = any (v_got) then
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
  id := 'F35-D01'; area := 'Owner decision 6 -- every subgroup meets its own minimum, learners counted once';
  if v_fatal <> '' then ok := false; detail := 'the suite aborted: ' || left(v_fatal, 300);
  elsif cardinality(d01) > 0 then ok := false; detail := format('%s problem(s): %s', cardinality(d01), array_to_string(d01, '; '));
  else ok := true; detail := 'an Angkatan of 4 learners (one sitting three times) is 4 learners with no mean beside one of 6 with its mean; the '
    || 'comparison''s sample is the school''s distinct learners; a chapter two learners sat is withheld with the governed minimum, and '
    || '«Pemahaman» does not move when it is sat (it cannot be recovered); the teacher and the Dekan are given the same chapter figures';
  end if;
  return next;
  id := 'F35-G01'; area := 'Sharon finding 2 -- the safety gate''s population is learners';
  if v_fatal <> '' then ok := false; detail := 'the suite aborted: ' || left(v_fatal, 300);
  elsif cardinality(g01) > 0 then ok := false; detail := format('%s problem(s): %s', cardinality(g01), array_to_string(g01, '; '));
  else ok := true; detail := 'institution.safety_gate_pass_rate''s sample is the school''s distinct learners, not its Uji Penguasaan results';
  end if;
  return next;
  id := 'F35-O2'; area := 'Owner ruling O2 -- the class target for the readers of the class''s figures';
  if v_fatal <> '' then ok := false; detail := 'the suite aborted: ' || left(v_fatal, 300);
  elsif cardinality(o2) > 0 then ok := false; detail := format('%s problem(s): %s', cardinality(o2), array_to_string(o2, '; '));
  else ok := true; detail := 'target_kelas gives the class''s sealed Uji Penguasaan mark (0.65) to its teacher, the school''s Dekan and Admin and '
    || 'the Kepala departemen over it, and to another of the school''s teachers exactly as the assignments table already does; another '
    || 'school''s teacher and Dekan get nothing; anon cannot call it; it returns '
    || 'only the release and the mark';
  end if;
  return next;
  id := 'F35-O4'; area := 'Owner ruling O4 -- the school summary follows authority over the whole school';
  if v_fatal <> '' then ok := false; detail := 'the suite aborted: ' || left(v_fatal, 300);
  elsif cardinality(o4) > 0 then ok := false; detail := format('%s problem(s): %s', cardinality(o4), array_to_string(o4, '; '));
  else ok := true; detail := 'a Dekan at the school''s root and its Admin read the school''s figures; a Dekan over a Bagian, another school''s '
    || 'Dekan, a Kepala departemen and a teacher are refused (not_permitted)';
  end if;
  return next;
  id := 'F35-A01'; area := 'Owner decision 5 -- a sitting keeps the Angkatan recorded when it was sat';
  if v_fatal <> '' then ok := false; detail := 'the suite aborted: ' || left(v_fatal, 300);
  elsif cardinality(a01) > 0 then ok := false; detail := format('%s problem(s): %s', cardinality(a01), array_to_string(a01, '; '));
  else ok := true; detail := 'sittings that recorded no Angkatan form one «not recorded» row, never today''s Angkatan; six sittings recorded '
    || 'under Angkatan A stay there after their class is moved to Angkatan B; a recorded Angkatan cannot be rewritten (INV-33)';
  end if;
  return next;
  id := 'F35-DONE'; area := 'fable35'; ok := true; detail := 'done'; return next;
end $$;
revoke all on function selftest.run_fable35() from public;
