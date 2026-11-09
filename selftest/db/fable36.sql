-- FABLE-36 · Owner decisions 7 and 8, Sharon's follow-up review of 94160304 (9 Nov 2026): ONE EVIDENCE RULE AND ONE
-- DISCLOSURE RULE, measured against supabase/migrations/20270111100000_a_chapter_written_in_studio_names_its_topics.sql
-- by RUNNING the calculators, never by reading their text.
--
--   F36-E01  DECISION 8 (the required regression): a learner sits a chapter at 80%, later at 60%. Current mastery is
--            60% (per bab, Pemahaman, the bands); the learner's history keeps both sittings; Kenaikan pairs the 60%
--            with the earliest Pemetaan Awal; a recomputation of a sitting replaces its result and is not another
--            sitting; recomputing the OLDER sitting later never makes it the current one; the certificate decision
--            still reads its own sealed result.
--   F36-X01  CROSS-REPORT CONSISTENCY: Pemahaman equals the chapters' means weighted by their learners; Kenaikan's
--            akhir − awal equals Kenaikan; with every learner paired, Kenaikan's akhir equals Pemahaman.
--   F36-R01  SHARON'S FINDING 1, her exact case: chapter A, 6 learners, mean 70%; chapter B, 3 learners, mean 40%; nine
--            pairs. No figure an authorized reader is given yields B's 40%: B's row is withheld, Pemahaman is
--            withheld, Kenaikan's pair is withheld; also with two withheld chapters, repeated sittings, learners in
--            both chapters, and a shown chapter whose few unpaired learners would fall out of Kenaikan's pair.
--   F36-R02  SHARON'S FINDING 2: withheld topic and Angkatan rows come after the shown ones in the order of their
--            names or identifiers, never of their hidden means.
--   F36-K01  SCHOOL-LEVEL SMALL POPULATIONS: a school competency, the school's Kenaikan and an Angkatan that combine a
--            class's cell under the class minimum are withheld (never recomputed without it); the same with every cell
--            large enough is shown; sittings with no recorded Angkatan form the «not recorded» row and still count in
--            the school's other figures.
--   F36-G02  SHARON'S FINDING 5: four learners × three sittings = 12 sittings, 4 learners: the safety gate's sample is
--            4 (under the school minimum of 10, so its rate is not disclosed) and its `sittings` 12.
--   F36-H01  SHARON'S FINDING 3 / DECISION 5, through the product's own path: a learner placed in a Kelas under an
--            Angkatan starts a real sitting (start_learning_session); the sitting records that Angkatan; the Kelas is
--            then moved under another Angkatan; the first sitting still records the first, the next sitting records
--            the second; a rewrite is refused (INV-33).
--   F36-H02  open_assessment_session refuses an Angkatan that is not the class's, and, with no class, one the
--            enrolment is not placed in.
--   F36-M01  MISCONCEPTIONS (owner approval): one learner who chose the same wrong option three times is no class
--            pattern (not listed; `withheld` counts it); five learners who chose another are listed with their
--            occurrences; the sample is learners.
--   F36-P01  PARTICIPATION IS NEVER ZERO (decision 7, Daisy's N2): Pemahaman with 0, 1, 4 and 5 learners; two chapters
--            of 4 learners each (8 sat): «withheld to protect a chapter» with 8 learners, never «no evidence»; the
--            same learners counted the same by every figure.
--
-- EVERY ROW IS ROLLED BACK.

create schema if not exists selftest;

do $$
begin
  if to_regprocedure('selftest.f35_bab(uuid,text,text,text)') is null or to_regprocedure('selftest.f11_user(text,public.app_role,uuid)') is null
     or to_regprocedure('selftest.cycle_fixture()') is null or to_regprocedure('selftest.answer_paper(uuid,boolean,boolean)') is null
     or to_regprocedure('selftest.f23_raised(text)') is null then
    raise exception 'apply fable01, fable03, fable06, fable11, fable23 and fable35.sql before fable36.sql: the helpers are missing';
  end if;
end $$;

-- a Pemetaan Awal for the chapter a fable35 Uji Penguasaan belongs to
create or replace function selftest.f36_pre(p_post uuid)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_d uuid;
begin
  insert into public.assessment_definitions (institution_id, course_id, module_id, title, mode, bank_type, item_count)
  select d.institution_id, d.course_id, null, 'Pemetaan Awal ' || d.title, 'PRE_TEST', d.bank_type, 1
    from public.assessment_definitions d where d.id = p_post returning id into v_d;
  return v_d;
end $$;
revoke all on function selftest.f36_pre(uuid) from public;

-- one finished official sitting of a given definition and mode, for a learner of a class (a new learner when p_person
-- is null), with one per_domain code, an optional recorded Angkatan, and optional answers (item, chosen option)
create or replace function selftest.f36_sit(p_template uuid, p_person uuid, p_class uuid, p_definition uuid, p_mastery numeric,
                                            p_code text, p_finished timestamptz, p_cohort uuid default null,
                                            p_gate boolean default true, p_answers jsonb default null)
returns table (person uuid, session uuid) language plpgsql set search_path = public, pg_temp as $$
declare s record; v_person uuid := p_person; v_e uuid; v_new uuid := gen_random_uuid(); v_mode public.assessment_mode; a jsonb; v_pi uuid; k int := 0;
begin
  select x.institution_id, x.academic_period_id, e.programme_id into s
    from public.assessment_sessions x join public.enrollments e on e.id = x.enrollment_id where x.id = p_template;
  select d.mode into v_mode from public.assessment_definitions d where d.id = p_definition;
  if v_person is null then
    insert into public.persons (display_name) values ('Murid F36 ' || left(v_new::text, 8)) returning persons.id into v_person;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (v_person, s.institution_id, s.academic_period_id, s.programme_id, 'ACTIVE') returning enrollments.id into v_e;
    if p_class is not null then
      insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, p_class, s.academic_period_id);
    end if;
  else
    select e.id into v_e from public.enrollments e where e.person_id = v_person and e.institution_id = s.institution_id limit 1;
  end if;
  insert into public.assessment_sessions
    (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, cohort_node_id,
     plp_release_id, assessment_definition_id, assessment_definition_version, engine_version,
     scoring_policy_version, evidence_channel, evidence_class, mode, status, shuffle_seed,
     started_at, submitted_at, finalized_at, deadline_extended_count, assessment_assignment_id)
  select v_new, v_person, x.institution_id, v_e, x.academic_period_id, p_class, p_cohort,
         (select pr.id from public.plp_releases pr join public.assessment_definitions d on d.course_id = pr.course_id
           where d.id = p_definition order by pr.created_at limit 1), p_definition, 1, x.engine_version,
         x.scoring_policy_version, x.evidence_channel, x.evidence_class, v_mode, 'CREATED', x.shuffle_seed,
         p_finished - interval '20 minutes', p_finished, p_finished, 0, x.assessment_assignment_id
    from public.assessment_sessions x where x.id = p_template;
  update public.assessment_sessions set status = 'IN_PROGRESS' where id = v_new;
  for a in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb)) loop
    k := k + 1;
    insert into public.presented_items (session_id, item_id, institution_id, position, presented_at)
    values (v_new, (a ->> 'item')::uuid, s.institution_id, k, now()) returning id into v_pi;
    insert into public.responses (presented_item_id, client_seq, value, value_digest, is_final)
    values (v_pi, 1, jsonb_build_object('pilihan', a ->> 'pilihan'), 'x', true);
  end loop;
  update public.assessment_sessions set status = 'SUBMITTED' where id = v_new;
  update public.assessment_sessions set status = 'FINALIZED', finalized_at = p_finished where id = v_new;
  insert into public.assessment_results
    (id, session_id, institution_id, person_id, evidence_class, engine_version, scoring_policy_version,
     mastery, per_domain, safety_gate_passed, delta_inputs, computed_at)
  select gen_random_uuid(), v_new, r.institution_id, v_person, r.evidence_class, r.engine_version,
         r.scoring_policy_version, p_mastery,
         jsonb_build_object(p_code, jsonb_build_object('benar', round(p_mastery * 5)::int, 'total', 5, 'penguasaan', p_mastery)),
         p_gate, r.delta_inputs, now()
    from public.assessment_results r where r.session_id = p_template limit 1;
  person := v_person; session := v_new; return next;
end $$;
revoke all on function selftest.f36_sit(uuid, uuid, uuid, uuid, numeric, text, timestamptz, uuid, boolean, jsonb) from public;

-- an audited recomputation of a sitting: a NEW result linked to the one it replaces (INV-29)
create or replace function selftest.f36_recompute(p_session uuid, p_mastery numeric, p_code text)
returns void language plpgsql set search_path = public, pg_temp as $$
declare v_prev public.assessment_results;
begin
  select * into v_prev from public.assessment_results r where r.session_id = p_session
   and not exists (select 1 from public.assessment_results q where q.supersedes_result_id = r.id);
  insert into public.assessment_results
    (id, session_id, institution_id, person_id, evidence_class, engine_version, scoring_policy_version,
     mastery, per_domain, safety_gate_passed, delta_inputs, supersedes_result_id, recomputation_reason, computed_at)
  values (gen_random_uuid(), p_session, v_prev.institution_id, v_prev.person_id, v_prev.evidence_class, v_prev.engine_version,
          v_prev.scoring_policy_version, p_mastery,
          jsonb_build_object(p_code, jsonb_build_object('benar', round(p_mastery * 5)::int, 'total', 5, 'penguasaan', p_mastery)),
          v_prev.safety_gate_passed, v_prev.delta_inputs, v_prev.id, 'F36: a corrected key', clock_timestamp());
end $$;
revoke all on function selftest.f36_recompute(uuid, numeric, text) from public;

create or replace function selftest.f36_eval(p_user uuid, p_metric text, p_node uuid, p_inst uuid)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare v jsonb;
begin
  perform selftest.as_user_uid(p_user);
  v := public.metric_evaluate(p_metric, p_node, p_inst);
  perform selftest.as_owner();
  return v;
end $$;
revoke all on function selftest.f36_eval(uuid, text, uuid, uuid) from public;

-- a school calculator read inside a part of the school, so only this suite's sittings are counted
create or replace function selftest.f36_school(p_calc text, p_inst uuid, p_part uuid)
returns jsonb language plpgsql set search_path = public, pg_temp as $$
declare v jsonb;
begin
  perform set_config('pintar.metric_boundary_node', p_part::text, true);
  perform set_config('pintar.metric_boundary_person', '', true);
  execute format('select public.%I(null, $1, $2)', p_calc) into v using p_inst, public.current_metric_catalogue();
  perform set_config('pintar.metric_boundary_node', '', true);
  return v;
end $$;
revoke all on function selftest.f36_school(text, uuid, uuid) from public;

create or replace function selftest.run_fable36()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_tag text := to_char(clock_timestamp(), 'HH24MISSUS'); v_fatal text := '';
  e01 text[] := array[]::text[]; x01 text[] := array[]::text[]; r01 text[] := array[]::text[]; r02 text[] := array[]::text[];
  k01 text[] := array[]::text[]; g02 text[] := array[]::text[]; h01 text[] := array[]::text[]; h02 text[] := array[]::text[];
  m01 text[] := array[]::text[]; p01 text[] := array[]::text[];
  v_tpl uuid; v_inst uuid; v_root uuid; v_period uuid; v_fac uuid; v_dep uuid; v_prog uuid; v_ca uuid; v_cb uuid; v_cc uuid;
  v_dekan uuid; v_guru uuid; v_cat text; v_k int;
  c_e uuid; c_r uuid; c_q uuid; c_p uuid; c_o uuid; c_m uuid; c_sa uuid; c_sb uuid; c_sc uuid; c_sd uuid; c_g uuid;
  c_z0 uuid; c_z1 uuid; c_z4 uuid; c_z5 uuid; c_z44 uuid;
  d_a uuid; d_a0 uuid; d_b uuid; d_b0 uuid; d_c uuid; d_c0 uuid; v_fk uuid; v_dk uuid; v_pk uuid; d_t1 uuid; d_t2 uuid; d_t3 uuid; d_t4 uuid; d_s uuid; d_s0 uuid; d_s2 uuid;
  v_l1 uuid; v_s1 uuid; v_s2 uuid; v_p uuid; v_p2 uuid; v_pp uuid[]; m record; i int;
  v_j jsonb; v_j2 jsonb; v_j3 jsonb; v_rows jsonb; v_n int; v_num numeric; v_got text[]; v_want text[]; v_err text;
  v_item uuid; v_opt_a text; v_code_a text; v_opt_b text; v_code_b text;
  f record; v_lu uuid; v_lp uuid; v_le uuid; v_k5 uuid; v_old_parent uuid; v_y uuid; v_sess uuid; v_sess2 uuid; v_rec uuid;
begin
  perform selftest.as_owner();
  begin
    select s.id, s.institution_id into v_tpl, v_inst
      from public.assessment_sessions s join public.assessment_results res on res.session_id = s.id
     where s.mode = 'POST_TEST' and s.status = 'FINALIZED' and s.pass_mark is not null
       and s.assessment_assignment_id is not null and public.effective_evidence_class(s.id) = 'OFFICIAL'
     order by s.finalized_at desc limit 1;
    if v_tpl is null then raise exception 'the fixture has no finished official Uji Penguasaan'; end if;
    v_cat := public.current_metric_catalogue();
    select o.id into v_root from public.org_nodes o where o.institution_id = v_inst and o.kind = 'INSTITUTION';
    select ap.id into v_period from public.academic_periods ap where ap.institution_id = v_inst order by ap.created_at limit 1;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_root, 'FACULTY', 'Bagian F36 ' || v_tag) returning org_nodes.id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_fac, 'DEPARTMENT', 'Departemen F36 ' || v_tag) returning org_nodes.id into v_dep;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_dep, 'PROGRAMME', 'Program F36 ' || v_tag) returning org_nodes.id into v_prog;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_prog, 'COHORT', 'Angkatan F36 A ' || v_tag, v_period) returning org_nodes.id into v_ca;
    -- F36-K01's school cells, in a part of the school of their own
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_root, 'FACULTY', 'Bagian F36 K ' || v_tag) returning org_nodes.id into v_fk;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_fk, 'DEPARTMENT', 'Departemen F36 K ' || v_tag) returning org_nodes.id into v_dk;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_dk, 'PROGRAMME', 'Program F36 K ' || v_tag) returning org_nodes.id into v_pk;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_pk, 'COHORT', 'Angkatan F36 B ' || v_tag, v_period) returning org_nodes.id into v_cb;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_pk, 'COHORT', 'Angkatan F36 C ' || v_tag, v_period) returning org_nodes.id into v_cc;
    -- the readers: the school's Dekan, and a teacher over this part of the school
    v_dekan := selftest.f11_user('f36-dekan-' || v_tag || '@local.invalid', 'DEAN', v_root);
    v_guru  := selftest.f11_user('f36-guru-'  || v_tag || '@local.invalid', 'EDUCATOR', v_fac);
    select md.minimum_sample into v_k from public.metric_definitions md where md.catalogue_version = v_cat and md.metric_id = 'class.chapter_mastery';

    -- ═══════════════════════════════════ F36-E01 the 80% → 60% retake, a recomputation, the certificate
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_ca, 'CLASS', 'Kelas F36 E ' || v_tag, v_period) returning org_nodes.id into c_e;
    d_a := selftest.f35_bab(v_inst, 'F36 E ' || v_tag, 'E1', 'Tujuan E F36 ' || v_tag); d_a0 := selftest.f36_pre(d_a);
    select x.person into v_l1 from selftest.f36_sit(v_tpl, null, c_e, d_a0, 0.30, 'E1', now() - interval '6 days') x;
    select x.session into v_s1 from selftest.f36_sit(v_tpl, v_l1, c_e, d_a, 0.80, 'E1', now() - interval '4 days') x;
    select x.session into v_s2 from selftest.f36_sit(v_tpl, v_l1, c_e, d_a, 0.60, 'E1', now() - interval '2 days') x;
    for i in 1..4 loop
      select x.person into v_p from selftest.f36_sit(v_tpl, null, c_e, d_a0, 0.20, 'E1', now() - interval '6 days') x;
      perform selftest.f36_sit(v_tpl, v_p, c_e, d_a, 0.50, 'E1', now() - interval '3 days');
    end loop;
    v_j := selftest.f36_eval(v_dekan, 'class.chapter_mastery', c_e, v_inst);
    if (v_j -> 'value' -> 0 ->> 'mean_mastery')::numeric is distinct from 0.52 or (v_j -> 'value' -> 0 ->> 'learners')::int is distinct from 5 then
      e01 := e01 || format('per bab is not the current 60%% with four at 50%% (0.52 over 5 learners): %s', left(v_j::text, 240));
    end if;
    v_j := selftest.f36_eval(v_dekan, 'class.comprehension', c_e, v_inst);
    if (v_j ->> 'value')::numeric is distinct from 0.52 or (v_j ->> 'sample')::int is distinct from 5 then
      e01 := e01 || format('Pemahaman is not 0.52 over 5 learners (the later 60%% is current; the 80%% is not added): %s', left(v_j::text, 200));
    end if;
    v_j := selftest.f36_eval(v_dekan, 'class.net_gain', c_e, v_inst);
    if (v_j ->> 'value')::numeric is distinct from 0.30 then
      e01 := e01 || format('Kenaikan is not current − baseline (0.60 − 0.30 and 0.50 − 0.20, mean 0.30); MC-8 took the highest (0.80): %s', left(v_j::text, 200));
    end if;
    v_j := selftest.f36_eval(v_dekan, 'class.readiness_distribution', c_e, v_inst);
    if (v_j ->> 'sample')::int is distinct from 5 then e01 := e01 || format('the bands do not count 5 learners: %s', left(v_j::text, 200)); end if;
    perform set_config('pintar.metric_boundary_person', v_l1::text, true);
    perform set_config('pintar.metric_boundary_node', '', true);
    v_j := public.calc_learner_result(v_l1, v_inst, v_cat);
    perform set_config('pintar.metric_boundary_person', '', true);
    select array_agg((e ->> 'mastery') order by e ->> 'mastery') into v_got from jsonb_array_elements(v_j -> 'value') e where e ->> 'mode' = 'POST_TEST';
    if v_got is distinct from array['0.6000', '0.8000'] then
      e01 := e01 || format('the learner''s history does not keep both sittings (80%% and 60%%): %s', coalesce(v_got::text, 'nothing'));
    end if;
    -- a recomputation of the current sitting replaces its result: still one sitting, the figure moves to 0.70
    perform selftest.f36_recompute(v_s2, 0.70, 'E1');
    v_j := selftest.f36_eval(v_dekan, 'class.comprehension', c_e, v_inst);
    if (v_j ->> 'value')::numeric is distinct from 0.54 or (v_j ->> 'sample')::int is distinct from 5 then
      e01 := e01 || format('after recomputing the 60%% sitting to 70%%, Pemahaman is not 0.54 over 5: %s', left(v_j::text, 200));
    end if;
    perform set_config('pintar.metric_boundary_person', v_l1::text, true);
    v_j := public.calc_learner_result(v_l1, v_inst, v_cat);
    perform set_config('pintar.metric_boundary_person', '', true);
    select count(*) into v_n from jsonb_array_elements(v_j -> 'value') e where e ->> 'mode' = 'POST_TEST';
    if v_n <> 2 then e01 := e01 || format('a recomputation became another sitting: %s POST sittings', v_n); end if;
    -- recomputing the OLDER sitting, later, never makes it the current one
    perform selftest.f36_recompute(v_s1, 0.95, 'E1');
    v_j := selftest.f36_eval(v_dekan, 'class.chapter_mastery', c_e, v_inst);
    if (v_j -> 'value' -> 0 ->> 'mean_mastery')::numeric is distinct from 0.54 then
      e01 := e01 || format('recomputing the older sitting made it current: per bab %s, not 0.54', v_j -> 'value' -> 0 ->> 'mean_mastery');
    end if;
    v_j := selftest.f36_eval(v_dekan, 'class.net_gain', c_e, v_inst);
    if (v_j ->> 'value')::numeric is distinct from 0.32 then
      e01 := e01 || format('Kenaikan after both recomputations is not (0.70 − 0.30 + 4 × 0.30) / 5 = 0.32: %s', v_j ->> 'value');
    end if;
    -- owner decision E1: the teacher's record of the learner says the 60% sitting was recomputed, and what was sealed
    perform set_config('pintar.metric_boundary_person', v_l1::text, true);
    v_j := public.calc_learner_result(v_l1, v_inst, v_cat);
    perform set_config('pintar.metric_boundary_person', '', true);
    select e into v_rows from jsonb_array_elements(v_j -> 'value') e where e ->> 'session_id' = v_s2::text;
    if v_rows is null or (v_rows ->> 'recomputed')::boolean is distinct from true or (v_rows ->> 'sealed_mastery')::numeric is distinct from 0.60
       or (v_rows ->> 'mastery')::numeric is distinct from 0.70 then
      e01 := e01 || format('the record does not say the sitting was recomputed (70%%) from its sealed 60%%: %s', coalesce(v_rows::text, 'nothing'));
    end if;
    -- E1 through the product's own audited path: recompute_result, as the platform's SYSTEM_ADMIN, on a fresh sitting
    select x.person, x.session into v_p, v_sess from selftest.f36_sit(v_tpl, null, c_e, d_a, 0.55, 'E1', now() - interval '1 day') x;
    v_y := selftest.f11_user('f36-sys-' || v_tag || '@local.invalid', 'SYSTEM_ADMIN', v_root);
    v_err := null;
    begin
      perform selftest.as_user_uid(v_y);
      perform public.recompute_result(v_sess, 'F36: an audited recomputation');
      perform selftest.as_owner();
    exception when others then perform selftest.as_owner(); v_err := sqlerrm;
    end;
    perform set_config('pintar.metric_boundary_person', v_p::text, true);
    v_j := public.calc_learner_result(v_p, v_inst, v_cat);
    perform set_config('pintar.metric_boundary_person', '', true);
    if v_err is not null or not exists (select 1 from jsonb_array_elements(v_j -> 'value') e
                                         where e ->> 'session_id' = v_sess::text and (e ->> 'recomputed')::boolean
                                           and (e ->> 'sealed_mastery')::numeric = 0.55) then
      e01 := e01 || format('recompute_result (the audited path) did not leave a sitting marked recomputed with its sealed 55%%: %s %s',
                           coalesce(v_err, ''), left(coalesce((v_j -> 'value')::text, 'nothing'), 300));
    end if;
    -- the certificate decision reads the sitting's own sealed result (certificate_eligibility, unchanged)
    select ce.mastery into v_num from public.certificate_eligibility(v_s2) ce;
    if v_num is distinct from 0.60 then
      e01 := e01 || format('the certificate decision for the 60%% sitting no longer reads its sealed result: %s', v_num);
    end if;

    -- ═══════════════════════════════════ F36-R01 Sharon's case, and F36-X01 consistency
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_ca, 'CLASS', 'Kelas F36 R ' || v_tag, v_period) returning org_nodes.id into c_r;
    d_b := selftest.f35_bab(v_inst, 'F36 RA ' || v_tag, 'RA', 'Tujuan RA F36 ' || v_tag); d_b0 := selftest.f36_pre(d_b);
    d_c := selftest.f35_bab(v_inst, 'F36 RB ' || v_tag, 'RB', 'Tujuan RB F36 ' || v_tag);
    v_pp := array[]::uuid[];
    for i in 1..6 loop
      select x.person into v_p from selftest.f36_sit(v_tpl, null, c_r, d_b0, 0.40, 'RA', now() - interval '6 days') x;
      perform selftest.f36_sit(v_tpl, v_p, c_r, d_b, 0.70, 'RA', now() - interval '3 days');
      v_pp := v_pp || v_p;
    end loop;
    d_c0 := selftest.f36_pre(d_c);
    for i in 1..3 loop
      select x.person into v_p from selftest.f36_sit(v_tpl, null, c_r, d_c0, 0.20, 'RB', now() - interval '6 days') x;
      perform selftest.f36_sit(v_tpl, v_p, c_r, d_c, 0.40, 'RB', now() - interval '3 days');
    end loop;
    foreach v_p2 in array array[v_dekan, v_guru] loop
      v_j := selftest.f36_eval(v_p2, 'class.chapter_mastery', c_r, v_inst);
      if not exists (select 1 from jsonb_array_elements(v_j -> 'value') e where e ->> 'chapter' = 'F36 RA ' || v_tag and (e ->> 'mean_mastery')::numeric = 0.70 and (e ->> 'learners')::int = 6)
         or not exists (select 1 from jsonb_array_elements(v_j -> 'value') e where e ->> 'chapter' = 'F36 RB ' || v_tag and e -> 'mean_mastery' = 'null'::jsonb and (e ->> 'learners')::int = 3) then
        r01 := r01 || format('per bab is not A 70%% over 6 shown and B withheld over 3: %s', left(v_j::text, 300));
      end if;
      v_j := selftest.f36_eval(v_p2, 'class.comprehension', c_r, v_inst);
      if v_j ? 'value' or v_j -> 'withheld' ->> 'reason' is distinct from 'subgroup' or (v_j ->> 'have')::int is distinct from 9 then
        r01 := r01 || format('Pemahaman (9 learners over A and B) is not withheld to protect B: %s', left(v_j::text, 240));
      end if;
      v_j := selftest.f36_eval(v_p2, 'class.topic_mastery', c_r, v_inst);
      if exists (select 1 from jsonb_array_elements(v_j -> 'value') e where e ->> 'code' = 'RB' and e -> 'mean_score' <> 'null'::jsonb) then
        r01 := r01 || 'chapter B''s topic gives its mean'::text;
      end if;
    end loop;
    -- Kenaikan's pair: the teacher's read (its own net gain is «ok»: no per-chapter gain or baseline is given anywhere)
    v_j := selftest.f36_eval(v_guru, 'class.net_gain', c_r, v_inst);
    if v_j ->> 'status' is distinct from 'ok' then r01 := r01 || format('Kenaikan over nine pairs is not shown: %s', left(v_j::text, 200)); end if;
    perform selftest.as_user_uid(v_guru);
    select to_jsonb(t) into v_j2 from public.kenaikan_awal_akhir(c_r) t;
    perform selftest.as_owner();
    if v_j2 is null or v_j2 -> 'akhir' <> 'null'::jsonb or v_j2 -> 'awal' <> 'null'::jsonb or (v_j2 ->> 'pasangan')::int <> 9 then
      r01 := r01 || format('Kenaikan''s before → after pair gives a mean over nine pairs beside a withheld chapter (Sharon''s 9 × 0.60 − 6 × 0.70 = 3 × 0.40): %s', coalesce(v_j2::text, 'nothing'));
    end if;
    -- a second withheld chapter, a repeated sitting in A, and learners of A also in B: still nothing yields B
    d_t1 := selftest.f35_bab(v_inst, 'F36 RC ' || v_tag, 'RC', 'Tujuan RC F36 ' || v_tag);
    perform selftest.f36_sit(v_tpl, v_pp[1], c_r, d_t1, 0.10, 'RC', now() - interval '1 day');
    perform selftest.f36_sit(v_tpl, v_pp[2], c_r, d_t1, 0.10, 'RC', now() - interval '1 day');
    perform selftest.f36_sit(v_tpl, v_pp[3], c_r, d_b, 0.70, 'RA', now() - interval '1 day');
    perform selftest.f36_sit(v_tpl, v_pp[4], c_r, d_c, 0.40, 'RB', now() - interval '1 day');
    v_j := selftest.f36_eval(v_dekan, 'class.chapter_mastery', c_r, v_inst);
    if not exists (select 1 from jsonb_array_elements(v_j -> 'value') e where e ->> 'chapter' = 'F36 RA ' || v_tag and (e ->> 'learners')::int = 6 and (e ->> 'mean_mastery')::numeric = 0.70) then
      r01 := r01 || format('a repeated sitting changed chapter A''s learners or mean: %s', left(v_j::text, 300));
    end if;
    if exists (select 1 from jsonb_array_elements(v_j -> 'value') e where e ->> 'chapter' in ('F36 RB ' || v_tag, 'F36 RC ' || v_tag) and e -> 'mean_mastery' <> 'null'::jsonb) then
      r01 := r01 || 'with learners in two chapters, a withheld chapter gives its mean'::text;
    end if;
    v_j := selftest.f36_eval(v_dekan, 'class.comprehension', c_r, v_inst);
    if v_j ? 'value' or (v_j ->> 'have')::int is distinct from 9 then
      r01 := r01 || format('with two withheld chapters, Pemahaman is shown or its learners are not 9: %s', left(v_j::text, 200));
    end if;
    -- a shown chapter whose ONE unpaired learner would be the difference between its mean and Kenaikan's akhir
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_ca, 'CLASS', 'Kelas F36 Q ' || v_tag, v_period) returning org_nodes.id into c_q;
    for i in 1..6 loop
      if i <= 5 then
        select x.person into v_p from selftest.f36_sit(v_tpl, null, c_q, d_b0, 0.40, 'RA', now() - interval '6 days') x;
        perform selftest.f36_sit(v_tpl, v_p, c_q, d_b, 0.70, 'RA', now() - interval '3 days');
      else
        perform selftest.f36_sit(v_tpl, null, c_q, d_b, 0.10, 'RA', now() - interval '3 days');
      end if;
    end loop;
    perform selftest.as_user_uid(v_guru);
    select to_jsonb(t) into v_j2 from public.kenaikan_awal_akhir(c_q) t;
    perform selftest.as_owner();
    if v_j2 is null or v_j2 -> 'akhir' <> 'null'::jsonb then
      r01 := r01 || format('Kenaikan''s akhir over 5 of a shown chapter''s 6 learners is given (6 × mean − 5 × akhir = the sixth learner): %s', coalesce(v_j2::text, 'nothing'));
    end if;
    -- F36-X01 the same evidence, every learner paired: the figures agree
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_ca, 'CLASS', 'Kelas F36 P ' || v_tag, v_period) returning org_nodes.id into c_p;
    for i in 1..6 loop
      select x.person into v_p from selftest.f36_sit(v_tpl, null, c_p, d_b0, 0.30 + i * 0.05, 'RA', now() - interval '6 days') x;
      perform selftest.f36_sit(v_tpl, v_p, c_p, d_b, 0.50 + i * 0.05, 'RA', now() - interval '3 days');
    end loop;
    v_j := selftest.f36_eval(v_guru, 'class.comprehension', c_p, v_inst);
    v_j2 := selftest.f36_eval(v_guru, 'class.chapter_mastery', c_p, v_inst);
    v_j3 := selftest.f36_eval(v_guru, 'class.net_gain', c_p, v_inst);
    perform selftest.as_user_uid(v_guru);
    select to_jsonb(t) into v_rows from public.kenaikan_awal_akhir(c_p) t;
    perform selftest.as_owner();
    if (v_j ->> 'value')::numeric is distinct from (v_j2 -> 'value' -> 0 ->> 'mean_mastery')::numeric then
      x01 := x01 || format('Pemahaman %s is not the one chapter''s mean %s', v_j ->> 'value', v_j2 -> 'value' -> 0 ->> 'mean_mastery');
    end if;
    if v_rows is null or (v_rows ->> 'akhir')::numeric is distinct from (v_j ->> 'value')::numeric then
      x01 := x01 || format('with every learner paired, Kenaikan''s akhir %s is not Pemahaman %s', coalesce(v_rows ->> 'akhir', 'nothing'), v_j ->> 'value');
    end if;
    if v_rows is null or round((v_rows ->> 'akhir')::numeric - (v_rows ->> 'awal')::numeric, 4) is distinct from (v_j3 ->> 'value')::numeric then
      x01 := x01 || format('Kenaikan''s akhir − awal is not Kenaikan %s: %s', v_j3 ->> 'value', coalesce(v_rows::text, 'nothing'));
    end if;
    -- two chapters, both shown: Pemahaman is the chapters' means weighted by their learners
    d_s2 := selftest.f35_bab(v_inst, 'F36 PX ' || v_tag, 'PX', 'Tujuan PX F36 ' || v_tag);
    for i in 1..5 loop perform selftest.f36_sit(v_tpl, null, c_p, d_s2, 0.90, 'PX', now() - interval '2 days'); end loop;
    v_j := selftest.f36_eval(v_guru, 'class.comprehension', c_p, v_inst);
    v_j2 := selftest.f36_eval(v_guru, 'class.chapter_mastery', c_p, v_inst);
    select round(sum((e ->> 'mean_mastery')::numeric * (e ->> 'learners')::int) / sum((e ->> 'learners')::int), 4) into v_num from jsonb_array_elements(v_j2 -> 'value') e;
    if abs((v_j ->> 'value')::numeric - v_num) > 0.0001 then
      x01 := x01 || format('Pemahaman %s is not the learner-weighted mean of its chapters %s', v_j ->> 'value', v_num);
    end if;

    -- ═══════════════════════════════════ F36-R02 withheld rows are ordered by name, never by hidden value
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_ca, 'CLASS', 'Kelas F36 O ' || v_tag, v_period) returning org_nodes.id into c_o;
    d_t1 := selftest.f35_bab(v_inst, 'F36 T1 ' || v_tag, 'T1', 'Tujuan F36 T1 ' || v_tag);
    d_t2 := selftest.f35_bab(v_inst, 'F36 T2 ' || v_tag, 'T2', 'Tujuan F36 T2 ' || v_tag);
    d_t3 := selftest.f35_bab(v_inst, 'F36 T3 ' || v_tag, 'T3', 'Tujuan F36 T3 ' || v_tag);
    d_t4 := selftest.f35_bab(v_inst, 'F36 T4 ' || v_tag, 'T4', 'Tujuan F36 T4 ' || v_tag);
    for i in 1..6 loop
      perform selftest.f36_sit(v_tpl, null, c_o, d_t1, 0.40, 'T1', now() - interval '2 days');
      perform selftest.f36_sit(v_tpl, null, c_o, d_t3, 0.60, 'T3', now() - interval '2 days');
    end loop;
    for i in 1..3 loop perform selftest.f36_sit(v_tpl, null, c_o, d_t2, 0.10, 'T2', now() - interval '2 days'); end loop;
    for i in 1..2 loop perform selftest.f36_sit(v_tpl, null, c_o, d_t4, 0.05, 'T4', now() - interval '2 days'); end loop;
    v_j := selftest.f36_eval(v_guru, 'class.topic_mastery', c_o, v_inst);
    select array_agg(e ->> 'code' order by o) into v_got from jsonb_array_elements(v_j -> 'value') with ordinality x(e, o);
    if v_got is distinct from array['T1', 'T3', 'T2', 'T4'] then
      r02 := r02 || format('topics are ordered %s, not the shown ones by their means then the withheld ones by name (T1, T3, T2, T4; by hidden mean it would be T4, T2)', coalesce(v_got::text, 'nothing'));
    end if;

    -- ═══════════════════════════════════ F36-K01 school cells (read inside this suite's part of the school)
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_cb, 'CLASS', 'Kelas F36 SA ' || v_tag, v_period) returning org_nodes.id into c_sa;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_cb, 'CLASS', 'Kelas F36 SB ' || v_tag, v_period) returning org_nodes.id into c_sb;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_cc, 'CLASS', 'Kelas F36 SC ' || v_tag, v_period) returning org_nodes.id into c_sc;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_cc, 'CLASS', 'Kelas F36 SD ' || v_tag, v_period) returning org_nodes.id into c_sd;
    d_s := selftest.f35_bab(v_inst, 'F36 S ' || v_tag, 'S1', 'Tujuan S F36 ' || v_tag); d_s0 := selftest.f36_pre(d_s);
    d_s2 := selftest.f35_bab(v_inst, 'F36 S2 ' || v_tag, 'S2', 'Tujuan S2 F36 ' || v_tag);
    for i in 1..12 loop
      select x.person into v_p from selftest.f36_sit(v_tpl, null, c_sa, d_s0, 0.30, 'S1', now() - interval '6 days', v_cb) x;
      perform selftest.f36_sit(v_tpl, v_p, c_sa, d_s, 0.80, 'S1', now() - interval '3 days', v_cb);
      perform selftest.f36_sit(v_tpl, v_p, c_sa, d_s2, 0.80, 'S2', now() - interval '3 days', v_cb);
    end loop;
    for i in 1..3 loop
      select x.person into v_p from selftest.f36_sit(v_tpl, null, c_sb, d_s0, 0.10, 'S1', now() - interval '6 days', v_cb) x;
      perform selftest.f36_sit(v_tpl, v_p, c_sb, d_s, 0.20, 'S1', now() - interval '3 days', v_cb);
    end loop;
    for i in 1..6 loop perform selftest.f36_sit(v_tpl, null, c_sc, d_s2, 0.50, 'S2', now() - interval '3 days', v_cc); end loop;
    -- sittings that recorded no Angkatan (history before decision 5)
    for i in 1..6 loop perform selftest.f36_sit(v_tpl, null, c_sd, d_s2, 0.60, 'S2', now() - interval '3 days', null); end loop;
    v_j := selftest.f36_school('calc_institution_competency_outcomes', v_inst, v_fk);
    select e into v_rows from jsonb_array_elements(v_j -> 'value') e where e ->> 'code' = 'S1';
    if v_rows is null or v_rows -> 'mean_score' <> 'null'::jsonb or (v_rows ->> 'learners')::int <> 15 then
      k01 := k01 || format('competency S (15 learners: 12 in one class, 3 in another) is not withheld: %s', coalesce(v_rows::text, 'nothing'));
    end if;
    select e into v_rows from jsonb_array_elements(v_j -> 'value') e where e ->> 'code' = 'S2';
    if v_rows is null or v_rows -> 'mean_score' = 'null'::jsonb then
      k01 := k01 || format('competency S2 (12 + 6 + 6 learners, every class cell large enough) is withheld: %s', coalesce(v_rows::text, 'nothing'));
    end if;
    v_j := selftest.f36_school('calc_institution_net_gain', v_inst, v_fk);
    if (v_j ? 'value' and v_j -> 'value' <> 'null'::jsonb) or v_j -> 'withheld' ->> 'reason' is distinct from 'subgroup' or (v_j ->> 'sample')::int <> 15 then
      k01 := k01 || format('the school''s Kenaikan over a 12-pair class and a 3-pair class is not withheld with its 15 learners: %s', left(v_j::text, 240));
    end if;
    v_j := selftest.f36_school('calc_institution_cohort_comparison', v_inst, v_fk);
    if not exists (select 1 from jsonb_array_elements(v_j -> 'value') e where e ->> 'cohort_node_id' = v_cb::text and e -> 'mean_mastery' = 'null'::jsonb) then
      k01 := k01 || format('Angkatan B (its class SB has 3 learners in chapter S) gives its mean: %s', left((v_j -> 'value')::text, 400));
    end if;
    if not exists (select 1 from jsonb_array_elements(v_j -> 'value') e where e ->> 'cohort_node_id' = v_cc::text and (e ->> 'mean_mastery')::numeric = 0.50) then
      k01 := k01 || format('Angkatan C (6 learners in one cell) lost its mean: %s', left((v_j -> 'value')::text, 400));
    end if;
    if not exists (select 1 from jsonb_array_elements(v_j -> 'value') e where e ->> 'cohort_node_id' is null and (e ->> 'recorded')::boolean is false and (e ->> 'learners')::int = 6) then
      k01 := k01 || format('the sittings with no recorded Angkatan are not the «not recorded» row of 6: %s', left((v_j -> 'value')::text, 400));
    end if;
    if (v_j -> 'value' -> -1 ->> 'recorded')::boolean is distinct from false then
      k01 := k01 || 'the «not recorded» row is not listed last'::text;
    end if;
    v_j := selftest.f36_school('calc_institution_participants', v_inst, v_fk);
    if (v_j ->> 'value')::int <> 27 then
      k01 := k01 || format('the school''s participants are %s, not 27 (the 6 with no recorded Angkatan dropped out)', v_j ->> 'value');
    end if;

    -- ═══════════════════════════════════ F36-G02 four learners × three sittings
    -- an Angkatan of its own, so the school figure read inside it counts only these sittings
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_prog, 'COHORT', 'Angkatan F36 G ' || v_tag, v_period) returning org_nodes.id into v_y;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_y, 'CLASS', 'Kelas F36 G ' || v_tag, v_period) returning org_nodes.id into c_g;
    for i in 1..4 loop
      select x.person into v_p from selftest.f36_sit(v_tpl, null, c_g, d_a, 0.50, 'E1', now() - interval '3 days', null, true) x;
      perform selftest.f36_sit(v_tpl, v_p, c_g, d_a, 0.50, 'E1', now() - interval '2 days', null, false);
      perform selftest.f36_sit(v_tpl, v_p, c_g, d_a, 0.50, 'E1', now() - interval '1 day', null, i <= 2);
    end loop;
    v_j := selftest.f36_school('calc_institution_safety_gate_pass_rate', v_inst, v_y);
    if (v_j ->> 'sample')::int is distinct from 4 or (v_j ->> 'sittings')::int is distinct from 12 then
      g02 := g02 || format('four learners × three sittings are not sample 4 over 12 sittings: %s', v_j::text);
    end if;
    if (v_j ->> 'value')::numeric is distinct from 0.5 then
      g02 := g02 || format('the rate over 12 sittings (6 passed) is %s, not 0.5', v_j ->> 'value');
    end if;
    if public.evidence_readiness((v_j ->> 'sample')::numeric,
         (select md.minimum_sample from public.metric_definitions md where md.catalogue_version = v_cat and md.metric_id = 'institution.safety_gate_pass_rate'))
       = 'SUFFICIENT_EVIDENCE' then
      g02 := g02 || 'four learners clear the school minimum of ten'::text;
    end if;

    -- ═══════════════════════════════════ F36-M01 misconception patterns are gated on learners
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_ca, 'CLASS', 'Kelas F36 M ' || v_tag, v_period) returning org_nodes.id into c_m;
    select o.item_id, o.label, o.misconception_code into v_item, v_opt_a, v_code_a
      from public.item_options o join public.misconception_taxonomy t on t.code = o.misconception_code and t.institution_id = o.institution_id
     where o.institution_id = v_inst and not o.is_correct order by o.item_id, o.label limit 1;
    select o.label, o.misconception_code into v_opt_b, v_code_b
      from public.item_options o join public.misconception_taxonomy t on t.code = o.misconception_code and t.institution_id = o.institution_id
     where o.item_id = v_item and not o.is_correct and o.misconception_code <> v_code_a order by o.label limit 1;
    if v_code_b is null then raise exception 'the fixture has no item with two different misconceptions'; end if;
    select x.person into v_p from selftest.f36_sit(v_tpl, null, c_m, d_a, 0.2, 'E1', now() - interval '3 days', null, true,
                                                    jsonb_build_array(jsonb_build_object('item', v_item, 'pilihan', v_opt_a))) x;
    perform selftest.f36_sit(v_tpl, v_p, c_m, d_a, 0.2, 'E1', now() - interval '2 days', null, true, jsonb_build_array(jsonb_build_object('item', v_item, 'pilihan', v_opt_a)));
    perform selftest.f36_sit(v_tpl, v_p, c_m, d_a, 0.2, 'E1', now() - interval '1 day', null, true, jsonb_build_array(jsonb_build_object('item', v_item, 'pilihan', v_opt_a)));
    for i in 1..5 loop
      perform selftest.f36_sit(v_tpl, null, c_m, d_a, 0.3, 'E1', now() - interval '1 day', null, true, jsonb_build_array(jsonb_build_object('item', v_item, 'pilihan', v_opt_b)));
    end loop;
    v_j := selftest.f36_eval(v_guru, 'class.misconceptions', c_m, v_inst);
    if exists (select 1 from jsonb_array_elements(v_j -> 'value') e where e ->> 'code' = v_code_a) then
      m01 := m01 || format('one learner''s three identical mistakes are listed as a class pattern: %s', left(v_j::text, 300));
    end if;
    if not exists (select 1 from jsonb_array_elements(v_j -> 'value') e where e ->> 'code' = v_code_b and (e ->> 'occurrences')::int = 5) then
      m01 := m01 || format('five learners'' shared mistake is not listed with its 5 occurrences: %s', left(v_j::text, 300));
    end if;
    if (v_j -> 'withheld' ->> 'count')::int is distinct from 1 or (v_j ->> 'sample')::int is distinct from 6 then
      m01 := m01 || format('the envelope does not say one pattern is withheld, over 6 learners: %s', left(v_j::text, 300));
    end if;

    -- ═══════════════════════════════════ F36-P01 participation is never zero
    for m in select * from (values (0, 'Z0'), (1, 'Z1'), (4, 'Z4'), (5, 'Z5')) v(n, nm) loop
      insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_ca, 'CLASS', 'Kelas F36 ' || m.nm || ' ' || v_tag, v_period) returning org_nodes.id into c_z0;
      for i in 1..m.n loop perform selftest.f36_sit(v_tpl, null, c_z0, d_a, 0.55, 'E1', now() - interval '1 day'); end loop;
      v_j := selftest.f36_eval(v_guru, 'class.comprehension', c_z0, v_inst);
      if m.n = 0 and (v_j ->> 'statement_key' is distinct from 'laporan.metrik.belum_ada_bukti' or coalesce((v_j ->> 'have')::int, 0) <> 0) then
        p01 := p01 || format('with no learner, Pemahaman is not «belum ada bukti» with 0: %s', left(v_j::text, 200));
      elsif m.n in (1, 4) and (v_j ->> 'statement_key' is distinct from 'laporan.metrik.belum_cukup_data' or (v_j ->> 'have')::int is distinct from m.n) then
        p01 := p01 || format('with %s learner(s), Pemahaman is not «belum cukup data» with %s: %s', m.n, m.n, left(v_j::text, 200));
      elsif m.n = 5 and (v_j ->> 'status' is distinct from 'ok' or (v_j ->> 'sample')::int is distinct from 5) then
        p01 := p01 || format('with five learners, Pemahaman is not shown over 5: %s', left(v_j::text, 200));
      end if;
      -- every class figure counts the same learners
      if m.n > 0 then
        v_j2 := selftest.f36_eval(v_guru, 'class.readiness_distribution', c_z0, v_inst);
        v_j3 := selftest.f36_eval(v_guru, 'class.topic_mastery', c_z0, v_inst);
        if coalesce((v_j2 ->> 'sample')::int, (v_j2 ->> 'have')::int) is distinct from m.n or coalesce((v_j3 ->> 'sample')::int, (v_j3 ->> 'have')::int) is distinct from m.n then
          p01 := p01 || format('with %s learner(s), the bands count %s and the topics %s', m.n, coalesce(v_j2 ->> 'sample', v_j2 ->> 'have'), coalesce(v_j3 ->> 'sample', v_j3 ->> 'have'));
        end if;
      end if;
    end loop;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_ca, 'CLASS', 'Kelas F36 Z44 ' || v_tag, v_period) returning org_nodes.id into c_z44;
    for i in 1..4 loop
      perform selftest.f36_sit(v_tpl, null, c_z44, d_t1, 0.40, 'T1', now() - interval '1 day');
      perform selftest.f36_sit(v_tpl, null, c_z44, d_t3, 0.60, 'T3', now() - interval '1 day');
    end loop;
    v_j := selftest.f36_eval(v_guru, 'class.comprehension', c_z44, v_inst);
    if v_j ->> 'statement_key' is distinct from 'laporan.metrik.dilindungi' or (v_j ->> 'have')::int is distinct from 8 or v_j ? 'value' then
      p01 := p01 || format('two chapters of 4 learners (8 sat) are not «withheld to protect a chapter» with 8 learners: %s', left(v_j::text, 240));
    end if;
    v_j2 := selftest.f36_eval(v_guru, 'class.chapter_mastery', c_z44, v_inst);
    if (select count(*) from jsonb_array_elements(v_j2 -> 'value') e where (e ->> 'learners')::int = 4 and e -> 'mean_mastery' = 'null'::jsonb) <> 2 then
      p01 := p01 || format('per bab does not give two chapters of 4 learners, each withheld: %s', left(v_j2::text, 300));
    end if;

    -- ═══════════════════════════════════ F36-H01 the Angkatan is recorded by the product's own path
    select * into f from selftest.cycle_fixture();
    if f.aa_pre is null then raise exception 'the learning-cycle fixture is absent'; end if;
    select la.node_id into v_k5 from public.learning_assignments la where la.id = f.la;
    select n.parent_id into v_old_parent from public.org_nodes n where n.id = v_k5;
    v_lu := selftest.f06p10_person('f36-murid-' || v_tag);
    select a.person_id into v_lp from public.accounts a where a.auth_user_id = v_lu;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    select v_lp, e.institution_id, e.academic_period_id, e.programme_id, 'ACTIVE'
      from public.memberships mm join public.enrollments e on e.id = mm.enrollment_id
     where mm.node_id = v_k5 and mm.valid_to is null limit 1
    returning enrollments.id into v_le;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    select v_le, v_k5, e.academic_period_id from public.enrollments e where e.id = v_le;
    perform selftest.as_user_uid(v_lu);
    v_sess := public.start_learning_session(f.aa_pre);
    perform selftest.answer_paper(v_sess, true);
    perform public.finish_my_session(v_sess);
    perform selftest.as_owner();
    select s.cohort_node_id into v_rec from public.assessment_sessions s where s.id = v_sess;
    if v_rec is distinct from v_old_parent or (select kind from public.org_nodes where org_nodes.id = v_old_parent) <> 'COHORT' then
      h01 := h01 || format('a learner placed in a Kelas under an Angkatan started a sitting that recorded %s, not that Angkatan', coalesce(v_rec::text, 'none'));
    end if;
    -- the class moves to another Angkatan: the first sitting keeps its history, the next records the new one
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    select n.institution_id, n.parent_id, 'COHORT', 'Angkatan F36 baru ' || v_tag, n.academic_period_id from public.org_nodes n where n.id = v_old_parent
    returning org_nodes.id into v_y;
    update public.org_nodes set parent_id = v_y where org_nodes.id = v_k5;
    if (select s.cohort_node_id from public.assessment_sessions s where s.id = v_sess) is distinct from v_old_parent then
      h01 := h01 || 'moving the Kelas rewrote its past sitting''s Angkatan'::text;
    end if;
    perform selftest.as_user_uid(v_lu);
    begin
      v_sess2 := public.start_learning_session(f.aa_post);
    exception when others then v_err := sqlerrm;
    end;
    perform selftest.as_owner();
    if v_sess2 is null then
      h01 := h01 || format('the next sitting could not start: %s', coalesce(v_err, 'nothing'));
    elsif (select s.cohort_node_id from public.assessment_sessions s where s.id = v_sess2) is distinct from v_y then
      h01 := h01 || 'the sitting after the move did not record the Angkatan the Kelas is in when it was sat'::text;
    end if;
    if selftest.f23_raised(format('update public.assessment_sessions set cohort_node_id = %L where id = %L', v_y, v_sess)) is null then
      h01 := h01 || 'a sitting''s recorded Angkatan could be rewritten (INV-33)'::text;
    end if;
    update public.org_nodes set parent_id = v_old_parent where org_nodes.id = v_k5;

    -- F36-H02 a caller's Angkatan is checked where it is written
    v_err := null;
    begin
      perform public.open_assessment_session(v_le, f.def_pre, f.release, 'ONLINE', 'PRE_TEST', public.engine_version(), public.scoring_policy_version(), v_k5, v_y);
    exception when others then v_err := sqlerrm;
    end;
    if v_err is null or v_err !~ 'not the class''s Angkatan' then
      h02 := h02 || format('an Angkatan that is not the class''s was accepted (%s)', coalesce(v_err, 'no refusal'));
    end if;
    v_err := null;
    begin
      perform public.open_assessment_session(v_le, f.def_pre, f.release, 'ONLINE', 'PRE_TEST', public.engine_version(), public.scoring_policy_version(), null, v_y);
    exception when others then v_err := sqlerrm;
    end;
    if v_err is null or v_err !~ 'not one the enrolment is placed in' then
      h02 := h02 || format('with no class, an Angkatan the enrolment is not placed in was accepted (%s)', coalesce(v_err, 'no refusal'));
    end if;

    raise exception 'f36-rollback';
  exception when others then
    perform set_config('pintar.metric_boundary_node', '', true);
    perform set_config('pintar.metric_boundary_person', '', true);
    perform selftest.as_owner();
    if sqlerrm <> 'f36-rollback' then v_fatal := sqlerrm; end if;
  end;

  for m in select * from (values
      ('F36-E01', 'Decision 8 -- current mastery, history, Kenaikan, recomputation, certificate', e01,
       'a learner''s 80% then 60%: current mastery is 60% (per bab and Pemahaman 0.52 over 5, the bands over 5), the history keeps both, Kenaikan pairs 60% with the earliest Pemetaan Awal (0.30, not the highest 0.80), a recomputation to 70% moves the figures and stays one sitting, recomputing the older sitting later leaves it not current, the teacher''s record says the sitting was recomputed from its sealed 60% (E1), and the certificate decision still reads the sealed 60%'),
      ('F36-X01', 'Cross-report consistency', x01,
       'Pemahaman is the one chapter''s mean and, over two chapters, their learner-weighted mean; with every learner paired Kenaikan''s akhir is Pemahaman and akhir − awal is Kenaikan'),
      ('F36-R01', 'Sharon finding 1 -- a withheld chapter cannot be recovered', r01,
       'chapter A 70% over 6, chapter B 40% over 3, nine pairs: B''s row, Pemahaman and Kenaikan''s pair are withheld for the Dekan and the teacher (Kenaikan itself is shown: no per-chapter gain or baseline is given anywhere); with a second withheld chapter, a repeated sitting and learners in both chapters nothing yields B; a shown chapter''s single unpaired learner withholds Kenaikan''s pair'),
      ('F36-R02', 'Sharon finding 2 -- withheld rows are not placed by their hidden values', r02,
       'topics come shown-by-mean then withheld-by-name (T1, T3, T2, T4), never by the hidden means (which would put T4 before T2)'),
      ('F36-K01', 'School-level small populations and unrecorded history', k01,
       'a competency over a 12-learner and a 3-learner class, the school''s Kenaikan over them and their Angkatan are withheld; a competency whose every class cell is large is shown; another Angkatan keeps its mean; the 6 sittings with no recorded Angkatan are the last, «not recorded», row and still count among the school''s 27 participants'),
      ('F36-G02', 'Sharon finding 5 -- four learners × three sittings', g02,
       'the safety gate over four learners who sat three times each is sample 4 over 12 sittings, its rate 0.5 over the sittings, and four learners do not clear the school minimum of ten'),
      ('F36-H01', 'Sharon finding 3 / decision 5 -- the Angkatan recorded by a real sitting', h01,
       'a learner placed in a Kelas starts a real Pemetaan Awal and it records the Kelas''s Angkatan; the Kelas moves to a new Angkatan: the past sitting keeps its own, the next sitting records the new one, and a rewrite is refused (INV-33)'),
      ('F36-H02', 'Decision 5 -- a caller''s Angkatan is not taken on its word', h02,
       'open_assessment_session refuses an Angkatan that is not the class''s, and with no class one the enrolment is not placed in'),
      ('F36-M01', 'Misconception patterns are gated on learners', m01,
       'one learner''s three identical mistakes are not a class pattern (withheld, counted in `withheld`); five learners'' shared mistake is listed with 5 occurrences; the sample is the 6 learners'),
      ('F36-P01', 'Participation is never zero (decision 7, Daisy N2)', p01,
       'Pemahaman with 0 learners says «belum ada bukti»; with 1 and 4, «belum cukup data» with that count; with 5 it is shown; the bands and topics count the same learners; two chapters of 4 (8 sat) say «withheld to protect a chapter» with 8 learners, each chapter withheld with its 4')
    ) v(tid, tarea, probs, good) loop
    id := m.tid; area := m.tarea;
    if v_fatal <> '' then ok := false; detail := 'the suite aborted: ' || left(v_fatal, 400);
    elsif cardinality(m.probs) > 0 then ok := false; detail := format('%s problem(s): %s', cardinality(m.probs), array_to_string(m.probs, '; '));
    else ok := true; detail := m.good;
    end if;
    return next;
  end loop;
  id := 'F36-DONE'; area := 'fable36'; ok := true; detail := 'done'; return next;
end $$;
revoke all on function selftest.run_fable36() from public;
