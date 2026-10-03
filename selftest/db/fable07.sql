-- FABLE-07 / WP7B database suite: anonymous student -> educator feedback.
--
-- Ordering: depends on fable01.sql (the role-switch helpers). Never applied as
-- a migration; never present in production.
--
-- THE CLAIM UNDER TEST is one sentence, and every test below is a way of
-- trying to break it:
--
--     No ordinary authorized PINTAR application or database path can produce a
--     respondent -> answer pair.
--
-- NON-VACUITY FIRST. F07-P01 establishes that the world this suite reasons
-- about is real -- a class, an educator over it, six learners in it, a
-- governed question set and a governed threshold -- because every isolation
-- claim after it would be trivially true over an empty fixture. That has been
-- this build's most repeated failure and it is checked here before anything
-- is asserted about boundaries.
--
-- EVERY ROW IS ROLLED BACK. The suite builds its school inside one
-- subtransaction, runs every test against it, and raises a sentinel to undo
-- the lot. Verdicts are collected in arrays first and emitted afterwards, so
-- the rollback removes the data and keeps the findings.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user_uid(uuid)') is null
     or to_regprocedure('selftest.as_owner()') is null then
    raise exception 'apply fable01.sql before fable07.sql';
  end if;
  if to_regprocedure('public.open_feedback_cycle(uuid, uuid)') is null then
    raise exception 'fable07.sql needs the WP7B feedback migration';
  end if;
end $$;

-- ═════════════════════════════════════════════════════════════ the fixture
-- A school built for this suite and nobody else. Two classes under one
-- department so a dean, a head of department in scope and a head of department
-- OUT of scope are all real actors rather than hypotheses; two educators so
-- "the subject of one cycle is not a reader of another" can be measured; nine
-- learners so one class can cross the threshold and the other cannot.
create or replace function selftest.f07_user(p_label text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare u uuid; e text := p_label || '@f07.pintar.test';
begin
  select au.id into u from auth.users au where au.email = e;
  if u is not null then return u; end if;
  u := gen_random_uuid();
  insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values (u, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', e, now(),
          '{"provider":"email","providers":["email"]}',
          jsonb_build_object('display_name', p_label), now(), now(), '', '', '', '');
  return u;
end $$;
revoke all on function selftest.f07_user(text) from public;

-- The answer sheet a learner sends: one declared option per declared question,
-- varied by the caller so the published marginals are a distribution rather
-- than a single column of fives.
create or replace function selftest.f07_sheet(p_set text, p_spread int)
returns jsonb language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_object_agg(q.question_key, o.option_key)
    from public.feedback_questions q
    join public.feedback_question_options o
      on o.set_version = q.set_version and o.question_key = q.question_key
     and o.ordinal = (((p_spread + q.ordinal) % 4) + 1)::smallint
   where q.set_version = p_set
$$;
revoke all on function selftest.f07_sheet(text, int) from public;
grant execute on function selftest.f07_sheet(text, int) to authenticated;

-- Collects a problem against a test id, so thirteen tests can share one
-- subtransaction and still report separately.
create or replace function selftest.f07_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id],
                   coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
revoke all on function selftest.f07_note(jsonb, text, text) from public;
-- granted because the suite records findings while impersonating the reader it
-- is testing; it is pure text and reads nothing
grant execute on function selftest.f07_note(jsonb, text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable07()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_inst uuid; v_inst2 uuid; v_period uuid; v_period2 uuid; v_fac uuid;
  v_dep uuid; v_dep2 uuid; v_prog uuid; v_prog2 uuid; v_coh uuid; v_coh2 uuid;
  v_k1 uuid; v_k2 uuid; v_k3 uuid; v_k4 uuid; v_inst2_prog uuid;
  v_hod_u uuid; v_hod uuid; v_hod2_u uuid; v_hod2 uuid; v_dean_u uuid; v_dean uuid;
  v_adm_u uuid; v_adm uuid; v_sys_u uuid; v_sys uuid; v_adm2_u uuid; v_adm2 uuid;
  v_e1_u uuid; v_e1 uuid; v_e2_u uuid; v_e2 uuid; v_e3_u uuid; v_e3 uuid;
  v_lrn_u uuid[] := '{}'; v_lrn uuid[] := '{}';
  v_late_u uuid; v_late uuid; v_mov_u uuid; v_mov uuid;
  v_cycle_a uuid; v_cycle_b uuid; v_course uuid; v_rel uuid; v_enr uuid; v_tr uuid;
  v_one uuid; v_person uuid; v_out jsonb; v_sheet jsonb; v_sheets jsonb[]; v_msg text; v_raised boolean;
  v_probs jsonb := '{}'::jsonb; v_fatal text := ''; r record; i int; n int; v_jalur uuid[];
  v_audit_low bigint; v_metric_before jsonb; v_metric_after jsonb;
  m_eligible int := 0; m_total int := 0; m_rows int := 0; m_blocked int := 0;
  m_readers int := 0; m_denied int := 0; m_audit_submit int := -1;
  m_subj_before text := ''; m_subj_after text := ''; m_subj_denied int := 0;
  v_subj record;
  m_consumers int := 0; m_rel int := 0;
  v_ok boolean; v_detail text;
begin
  perform selftest.as_owner();
  begin
    ---------------------------------------------------------------- fixture
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F07', 'f07-' || substr(md5(random()::text), 1, 8), true, true)
    returning institutions.id into v_inst;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F07 penerima', 'f07r-' || substr(md5(random()::text), 1, 8), true, true)
    returning institutions.id into v_inst2;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, '2026/2027', current_date - 30, current_date + 300)
    returning academic_periods.id into v_period;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst2, '2026/2027', current_date - 30, current_date + 300)
    returning academic_periods.id into v_period2;

    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_inst, 'FACULTY', 'Fakultas') returning org_nodes.id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'Jurusan A') returning org_nodes.id into v_dep;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_fac, 'DEPARTMENT', 'Jurusan B') returning org_nodes.id into v_dep2;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dep, 'PROGRAMME', 'Program A') returning org_nodes.id into v_prog;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst, v_dep2, 'PROGRAMME', 'Program B') returning org_nodes.id into v_prog2;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_prog, 'COHORT', 'Angkatan A', v_period) returning org_nodes.id into v_coh;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_prog2, 'COHORT', 'Angkatan B', v_period) returning org_nodes.id into v_coh2;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh, 'CLASS', 'Kelas K1', v_period) returning org_nodes.id into v_k1;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh, 'CLASS', 'Kelas K2', v_period) returning org_nodes.id into v_k2;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh2, 'CLASS', 'Kelas PD', v_period) returning org_nodes.id into v_k3;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
    values (v_inst, v_coh, 'CLASS', 'Kelas K4', v_period) returning org_nodes.id into v_k4;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst2, v_inst2, 'FACULTY', 'Fakultas penerima') returning org_nodes.id into v_one;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst2, v_one, 'DEPARTMENT', 'Jurusan penerima') returning org_nodes.id into v_person;
    insert into public.org_nodes (institution_id, parent_id, kind, name)
    values (v_inst2, v_person, 'PROGRAMME', 'Program penerima')
    returning org_nodes.id into v_inst2_prog;

    v_hod_u  := selftest.f07_user('f07-kaprodi-a');
    v_hod2_u := selftest.f07_user('f07-kaprodi-b');
    v_dean_u := selftest.f07_user('f07-dekan');
    v_adm_u  := selftest.f07_user('f07-admin');
    v_adm2_u := selftest.f07_user('f07-admin-penerima');
    v_sys_u  := selftest.f07_user('f07-sysadmin');
    v_e1_u   := selftest.f07_user('f07-guru-1');
    v_e2_u   := selftest.f07_user('f07-guru-2');
    v_e3_u   := selftest.f07_user('f07-guru-pd');
    v_late_u := selftest.f07_user('f07-murid-telat');
    v_mov_u  := selftest.f07_user('f07-murid-pindah');
    select a.person_id into v_hod  from public.accounts a where a.auth_user_id = v_hod_u;
    select a.person_id into v_hod2 from public.accounts a where a.auth_user_id = v_hod2_u;
    select a.person_id into v_dean from public.accounts a where a.auth_user_id = v_dean_u;
    select a.person_id into v_adm  from public.accounts a where a.auth_user_id = v_adm_u;
    select a.person_id into v_adm2 from public.accounts a where a.auth_user_id = v_adm2_u;
    select a.person_id into v_sys  from public.accounts a where a.auth_user_id = v_sys_u;
    select a.person_id into v_e1   from public.accounts a where a.auth_user_id = v_e1_u;
    select a.person_id into v_e2   from public.accounts a where a.auth_user_id = v_e2_u;
    select a.person_id into v_e3   from public.accounts a where a.auth_user_id = v_e3_u;
    select a.person_id into v_late from public.accounts a where a.auth_user_id = v_late_u;
    select a.person_id into v_mov  from public.accounts a where a.auth_user_id = v_mov_u;

    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_hod,  'HEAD_OF_DEPARTMENT', v_dep,   now() - interval '1 day', now() + interval '365 days'),
           (v_hod2, 'HEAD_OF_DEPARTMENT', v_dep2,  now() - interval '1 day', now() + interval '365 days'),
           (v_dean, 'DEAN',               v_fac,   now() - interval '1 day', now() + interval '365 days'),
           (v_adm,  'INSTITUTION_ADMIN',  v_inst,  now() - interval '1 day', now() + interval '365 days'),
           (v_adm2, 'INSTITUTION_ADMIN',  v_inst2, now() - interval '1 day', now() + interval '365 days'),
           (v_sys,  'SYSTEM_ADMIN',       v_inst,  now() - interval '1 day', now() + interval '365 days'),
           (v_e1,   'EDUCATOR',           v_k1,    now() - interval '1 day', now() + interval '365 days'),
           (v_e2,   'EDUCATOR',           v_k2,    now() - interval '1 day', now() + interval '365 days'),
           (v_e3,   'EDUCATOR',           v_k3,    now() - interval '1 day', now() + interval '365 days');

    -- THE PROFESSIONAL-DEVELOPMENT BRANCH, built the way WP6 builds it: an
    -- ordinary class under an ordinary department, reached by a learning
    -- assignment over a course that says what it is. Nothing about the NODE
    -- marks it, which is why the cycle endpoint has to ask the course.
    insert into public.courses (institution_id, subject, stage, grade_label, title, learning_context)
    values (v_inst, 'Pengembangan', 'Guru', '-', 'Asesmen untuk Pembelajaran', 'PROFESSIONAL_DEVELOPMENT')
    returning courses.id into v_course;
    insert into public.plp_releases (institution_id, course_id, version_label)
    values (v_inst, v_course, '1.0.0') returning plp_releases.id into v_rel;
    insert into public.learning_assignments
      (institution_id, plp_release_id, course_id, node_id, academic_period_id)
    values (v_inst, v_rel, v_course, v_dep2, v_period);

    -- five learners who answer, one who never does, one who moves, one who
    -- arrives late, two in the small class and one silent beside them
    for i in 1..8 loop
      v_one := selftest.f07_user('f07-murid-' || i);
      v_lrn_u := v_lrn_u || v_one;
      select a.person_id into v_person from public.accounts a where a.auth_user_id = v_one;
      v_lrn := v_lrn || v_person;
      insert into public.enrollments (person_id, institution_id, academic_period_id, status)
      values (v_person, v_inst, v_period, 'ACTIVE') returning enrollments.id into v_enr;
      insert into public.memberships (enrollment_id, node_id, academic_period_id)
      values (v_enr, case when i <= 6 then v_k1 else v_k2 end, v_period);
    end loop;
    insert into public.persons (display_name) values ('Murid diam K1') returning persons.id into v_person;
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (v_person, v_inst, v_period, 'ACTIVE') returning enrollments.id into v_enr;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_enr, v_k1, v_period);
    insert into public.persons (display_name) values ('Murid diam K2') returning persons.id into v_person;
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (v_person, v_inst, v_period, 'ACTIVE') returning enrollments.id into v_enr;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_enr, v_k2, v_period);
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (v_mov, v_inst, v_period, 'ACTIVE') returning enrollments.id into v_enr;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_enr, v_k1, v_period);
    perform set_config('app.seed_intent', '', true);

    -- ═══════════════════════════ F07-P01 the world this suite reasons about
    -- Measured BEFORE anything is claimed about boundaries: an isolation test
    -- over an empty fixture passes while proving nothing, and that is the
    -- failure this build has repaired most often.
    select count(*) into n from public.members_of_node_at(v_k1, now());
    if n <> 8 then
      v_probs := selftest.f07_note(v_probs, 'F07-P01',
        format('K1 holds %s member(s) at this instant, expected 8', n));
    end if;
    select o.jalur into v_jalur from public.org_nodes o where o.id = v_k1;
    if not exists (select 1 from public.role_assignments ra
                    where ra.person_id = v_e1 and ra.role = 'EDUCATOR'
                      and ra.revoked_at is null and now() < ra.valid_until
                      and v_jalur @> array[ra.scope_node_id]) then
      v_probs := selftest.f07_note(v_probs, 'F07-P01', 'the subject holds no teaching authority over K1');
    end if;
    select count(*) into n from public.feedback_questions where set_version = 'FQ-1';
    if n <> 5 then
      v_probs := selftest.f07_note(v_probs, 'F07-P01', format('FQ-1 carries %s question(s), expected 5', n));
    end if;
    select count(*) into n from public.feedback_question_options where set_version = 'FQ-1';
    if n <> 20 then
      v_probs := selftest.f07_note(v_probs, 'F07-P01', format('FQ-1 carries %s option(s), expected 20', n));
    end if;
    if public.current_feedback_question_set() <> 'FQ-1' then
      v_probs := selftest.f07_note(v_probs, 'F07-P01', 'FQ-1 is not the live question set');
    end if;
    if public.current_feedback_threshold() <> 'FT-1'
       or (select minimum_responses from public.feedback_thresholds where version = 'FT-1') <> 5 then
      v_probs := selftest.f07_note(v_probs, 'F07-P01', 'the live anonymity threshold is not FT-1 at five');
    end if;
    -- the professional-development branch really does reach K3 and really
    -- does not reach K1, so the refusal proved in F07-P02 is about context
    select o.jalur into v_jalur from public.org_nodes o where o.id = v_k3;
    if not exists (select 1 from public.learning_assignments la join public.courses c on c.id = la.course_id
                    where c.learning_context <> 'ACADEMIC' and la.node_id = any (v_jalur)) then
      v_probs := selftest.f07_note(v_probs, 'F07-P01', 'no professional-development material reaches the PD class');
    end if;
    select o.jalur into v_jalur from public.org_nodes o where o.id = v_k1;
    if exists (select 1 from public.learning_assignments la join public.courses c on c.id = la.course_id
                where c.learning_context <> 'ACADEMIC' and la.node_id = any (v_jalur)) then
      v_probs := selftest.f07_note(v_probs, 'F07-P01', 'professional-development material reaches the academic class');
    end if;
    -- and the actors are who this suite says they are, measured through the
    -- live predicate rather than assumed from the grant
    perform selftest.as_user_uid(v_hod_u);
    if not public.management_scope_over_node(v_k1) then
      v_probs := selftest.f07_note(v_probs, 'F07-P01', 'the head of department has no Management scope over K1');
    end if;
    perform selftest.as_user_uid(v_e1_u);
    if public.management_scope_over_node(v_k1) then
      v_probs := selftest.f07_note(v_probs, 'F07-P01', 'the subject educator holds Management scope over their own class');
    end if;
    -- THE GATE IS NOT CAN_ASSIGN_LEARNING, and this is why: the subject holds it.
    if not public.can_on_node('CAN_ASSIGN_LEARNING', v_k1) then
      v_probs := selftest.f07_note(v_probs, 'F07-P01',
        'the subject educator does not hold CAN_ASSIGN_LEARNING: the point of not using it as the gate is unproven');
    end if;
    perform selftest.as_owner();

    -- ═════════════════════════════ F07-P02 who may open a cycle, and who may not
    -- (a) the subject, who holds CAN_ASSIGN_LEARNING and is therefore exactly
    --     the actor a briefing-shaped gate would have admitted
    -- EVERY REFUSAL BELOW IS ATTEMPTED INSIDE A SUBTRANSACTION THAT IS ROLLED
    -- BACK EITHER WAY. If a defect ever lets one of these through, the cycle it
    -- creates is undone before the next line, so the test that should go red
    -- goes red -- instead of the whole suite dying later on a collision and
    -- reporting nothing at all. That failure has happened in this build before.
    perform selftest.as_user_uid(v_e1_u);
    v_raised := false; v_msg := '';
    begin
      perform public.open_feedback_cycle(v_k1, v_e1);
      raise exception 'F07_ACCEPTED';
    exception when others then
      if sqlerrm <> 'F07_ACCEPTED' then v_raised := true; v_msg := sqlerrm; end if;
    end;
    perform selftest.as_owner();
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P02', 'the subject opened a feedback cycle about themselves');
    elsif v_msg !~ 'HEAD_OF_DEPARTMENT' then
      v_probs := selftest.f07_note(v_probs, 'F07-P02', 'the subject was refused for the wrong reason: ' || left(v_msg, 90));
    else
      m_blocked := m_blocked + 1;
    end if;

    -- (b) another educator, (c) the institution's administrator, (d) a
    --     SYSTEM_ADMIN and (e) a head of department of the OTHER department:
    --     four actors who are not Management over this class
    for r in select * from unnest(array[v_e2_u, v_adm_u, v_sys_u, v_hod2_u],
                                  array['another educator', 'the institution administrator',
                                        'a SYSTEM_ADMIN', 'a head of department out of scope']) as t(uid, who)
    loop
      perform selftest.as_user_uid(r.uid);
      v_raised := false; v_msg := '';
      begin
        perform public.open_feedback_cycle(v_k1, v_e1);
        raise exception 'F07_ACCEPTED';
      exception when others then
        if sqlerrm <> 'F07_ACCEPTED' then v_raised := true; v_msg := sqlerrm; end if;
      end;
      perform selftest.as_owner();
      if not v_raised then
        v_probs := selftest.f07_note(v_probs, 'F07-P02', r.who || ' opened a feedback cycle');
      elsif v_msg !~ 'HEAD_OF_DEPARTMENT' then
        v_probs := selftest.f07_note(v_probs, 'F07-P02',
          r.who || ' was refused for the wrong reason: ' || left(v_msg, 80));
      else
        m_blocked := m_blocked + 1;
      end if;
    end loop;

    -- (f) the head of department IS Management here, and is still refused a
    --     cohort, professional-development material, an educator who does not
    --     teach the class, and a subject who is not an educator at all
    -- Each case is run by an actor who HAS Management scope over the node it
    -- names -- the dean for the professional-development class, which sits in
    -- the neighbouring department -- so every refusal below is the rule under
    -- test rather than the authorization check in front of it.
    for r in select * from unnest(array[v_hod_u, v_dean_u, v_hod_u, v_hod_u],
                                  array[v_coh, v_k3, v_k1, v_k1],
                                  array[v_e1, v_e3, v_e2, v_adm],
                                  array['CLASS', 'professional-development', 'EDUCATOR', 'EDUCATOR'],
                                  array['a cohort-wide cycle', 'a professional-development class',
                                        'an educator who does not teach the class',
                                        'an administrator as the subject']) as t(uid, node, subj, pat, who)
    loop
      perform selftest.as_user_uid(r.uid);
      v_raised := false; v_msg := '';
      begin
        perform public.open_feedback_cycle(r.node, r.subj);
        raise exception 'F07_ACCEPTED';
      exception when others then
        if sqlerrm <> 'F07_ACCEPTED' then v_raised := true; v_msg := sqlerrm; end if;
      end;
      perform selftest.as_owner();
      if not v_raised then
        v_probs := selftest.f07_note(v_probs, 'F07-P02', r.who || ' was accepted');
      elsif v_msg !~ r.pat then
        v_probs := selftest.f07_note(v_probs, 'F07-P02',
          r.who || ' was refused without naming ' || r.pat || ': ' || left(v_msg, 80));
      else
        m_blocked := m_blocked + 1;
      end if;
    end loop;

    -- (g) and Management opens it
    perform selftest.as_user_uid(v_hod_u);
    v_cycle_a := public.open_feedback_cycle(v_k1, v_e1);
    -- (h) a second cycle over the same class, subject and period is refused
    v_raised := false;
    begin
      perform public.open_feedback_cycle(v_k1, v_e1);
      raise exception 'F07_ACCEPTED';
    exception when others then
      if sqlerrm <> 'F07_ACCEPTED' then v_raised := true; end if;
    end;
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P02', 'a second cycle opened over the same class, subject and period');
    end if;
    perform selftest.as_owner();

    -- (i) a DEAN standing over both departments opens the second class's cycle
    perform selftest.as_user_uid(v_dean_u);
    begin
      v_cycle_b := public.open_feedback_cycle(v_k2, v_e2);
    exception when others then
      v_probs := selftest.f07_note(v_probs, 'F07-P02', 'a dean in scope could not open a cycle: ' || left(sqlerrm, 90));
    end;
    perform selftest.as_owner();

    -- ═══════════════════════════════ F07-P03 eligibility is a snapshot
    begin
    select count(*) into m_eligible from public.feedback_opportunities where cycle_id = v_cycle_a;
    if m_eligible <> 8 then
      v_probs := selftest.f07_note(v_probs, 'F07-P03',
        format('the snapshot holds %s learner(s), expected the 8 who were in K1 when it opened', m_eligible));
    end if;
    if exists (select 1 from public.feedback_opportunities where cycle_id = v_cycle_a and person_id = v_e1) then
      v_probs := selftest.f07_note(v_probs, 'F07-P03', 'the subject was asked to rate themselves');
    end if;
    if exists (select 1 from public.feedback_opportunities where cycle_id = v_cycle_a and consumed) then
      v_probs := selftest.f07_note(v_probs, 'F07-P03', 'a cycle opened with someone already counted as having answered');
    end if;

    -- the measurement F07-P11 compares against, taken before a single answer exists
    perform selftest.as_user_uid(v_hod_u);
    v_metric_before := public.metric_evaluate('class.participants', v_k1, v_inst);
    -- and the subject list as it reads before anybody has answered, which
    -- F07-P15 compares against afterwards: a discovery endpoint that moved
    -- when a class answered would be a participation oracle
    select coalesce(string_agg(s.person_id::text || '=' || s.display_name, '|' order by s.person_id), '(none)')
      into m_subj_before from public.feedback_subjects_for_class(v_k1) s where s.person_id = v_e1;
    perform selftest.as_owner();

    -- a learner who arrives after the opening was not asked, and cannot answer
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (v_late, v_inst, v_period, 'ACTIVE') returning enrollments.id into v_enr;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_enr, v_k1, v_period);
    perform set_config('app.seed_intent', '', true);
    if exists (select 1 from public.feedback_opportunities where cycle_id = v_cycle_a and person_id = v_late) then
      v_probs := selftest.f07_note(v_probs, 'F07-P03', 'a learner enrolled after the opening entered the snapshot');
    end if;
    v_sheet := selftest.f07_sheet('FQ-1', 1);
    perform selftest.as_user_uid(v_late_u);
    v_raised := false;
    begin perform public.submit_feedback(v_cycle_a, v_sheet);
    exception when others then v_raised := true; end;
    perform selftest.as_owner();
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P03', 'a learner who arrived after the opening answered anyway');
    end if;

    -- a learner of the OTHER class is refused this cycle
    perform selftest.as_user_uid(v_lrn_u[7]);
    v_raised := false;
    begin perform public.submit_feedback(v_cycle_a, v_sheet);
    exception when others then v_raised := true; end;
    perform selftest.as_owner();
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P03', 'a learner from another class answered this cycle');
    end if;

    exception when others then
      -- A DEFECT PLANTED IN ONE PLACE MUST MAKE ONE TEST RED, not silence the
      -- suite. Without this the first unexpected refusal would abort the whole
      -- subtransaction and every verdict would read 'the suite aborted' --
      -- which is a failure, but not one that says where to look.
      v_probs := selftest.f07_note(v_probs, 'F07-P03', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═════════════════════════════════ F07-P04 exactly once, and the whole sheet
    begin
    -- THE AUDIT WATERMARK. Everything between here and the fifth sheet is
    -- learners answering and being refused -- no enrolment, no membership, no
    -- Management act -- so the count of audit rows written across that window
    -- is exactly the number the submission path wrote. F07-P13 reads it.
    select coalesce(max(al.id), 0) into v_audit_low from public.audit_log al;
    perform selftest.as_user_uid(v_lrn_u[1]);
    v_out := public.submit_feedback(v_cycle_a, selftest.f07_sheet('FQ-1', 1));
    if v_out ->> 'outcome' <> 'recorded' or (v_out ->> 'answers')::int <> 5 then
      v_probs := selftest.f07_note(v_probs, 'F07-P04', 'a valid sheet was not recorded whole: ' || v_out::text);
    end if;
    -- the retry a lost acknowledgement produces
    v_raised := false;
    begin perform public.submit_feedback(v_cycle_a, selftest.f07_sheet('FQ-1', 1));
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P04', 'a replayed submission was accepted');
    elsif v_msg !~ 'already answered' then
      v_probs := selftest.f07_note(v_probs, 'F07-P04', 'the replay was refused for the wrong reason: ' || left(v_msg, 80));
    end if;
    perform selftest.as_owner();
    select count(*) into n from public.feedback_responses where cycle_id = v_cycle_a;
    if n <> 5 then
      v_probs := selftest.f07_note(v_probs, 'F07-P04',
        format('one learner produced %s answer row(s), expected one sheet of 5', n));
    end if;
    select count(*) into n from public.feedback_opportunities where cycle_id = v_cycle_a and consumed;
    if n <> 1 then
      v_probs := selftest.f07_note(v_probs, 'F07-P04', format('%s opportunities consumed after one sheet', n));
    end if;

    -- a half sheet, an invented question and an invented answer are all refused,
    -- and none of them consumes anybody's one chance to speak
    -- the three invalid sheets, built while the suite still stands as owner:
    -- a learner cannot read the question table at all, which is itself part of
    -- why the questionnaire is served by an endpoint
    select array[
             (select jsonb_object_agg(q.question_key, 'sering') from public.feedback_questions q
               where q.set_version = 'FQ-1' and q.ordinal <= 3),
             selftest.f07_sheet('FQ-1', 2) || jsonb_build_object('pertanyaan_karangan', 'sering'),
             (select jsonb_object_agg(q.question_key, 'luar_biasa') from public.feedback_questions q
               where q.set_version = 'FQ-1')]
      into v_sheets;
    perform selftest.as_user_uid(v_lrn_u[2]);
    for r in select * from unnest(v_sheets,
        array['a half-answered sheet', 'an invented question', 'an invented answer']) as t(sheet, who)
    loop
      v_raised := false;
      begin perform public.submit_feedback(v_cycle_a, r.sheet);
      exception when others then v_raised := true; end;
      if not v_raised then
        v_probs := selftest.f07_note(v_probs, 'F07-P04', r.who || ' was accepted');
      end if;
    end loop;
    -- and that learner can still answer properly afterwards
    begin
      perform public.submit_feedback(v_cycle_a, selftest.f07_sheet('FQ-1', 2));
    exception when others then
      v_probs := selftest.f07_note(v_probs, 'F07-P04',
        'a learner whose invalid sheet was refused then could not answer at all: ' || left(sqlerrm, 80));
    end;
    perform selftest.as_owner();

    exception when others then
      -- A DEFECT PLANTED IN ONE PLACE MUST MAKE ONE TEST RED, not silence the
      -- suite. Without this the first unexpected refusal would abort the whole
      -- subtransaction and every verdict would read 'the suite aborted' --
      -- which is a failure, but not one that says where to look.
      v_probs := selftest.f07_note(v_probs, 'F07-P04', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════════════════ F07-P05 nothing is readable while a cycle is open
    begin
    for i in 3..4 loop
      perform selftest.as_user_uid(v_lrn_u[i]);
      perform public.submit_feedback(v_cycle_a, selftest.f07_sheet('FQ-1', i));
      perform selftest.as_owner();
    end loop;
    -- four in: no snapshot, and no figure for anyone
    for r in select * from unnest(array[v_hod_u, v_dean_u, v_e1_u],
                                  array['the head of department', 'the dean', 'the subject']) as t(uid, who)
    loop
      perform selftest.as_user_uid(r.uid);
      v_out := public.feedback_result(v_cycle_a);
      perform selftest.as_owner();
      if v_out ->> 'state' <> 'OPEN' or v_out ? 'total_responses' or v_out ? 'entries'
         or v_out ? 'have' or v_out ? 'needed' then
        v_probs := selftest.f07_note(v_probs, 'F07-P05',
          r.who || ' was handed a figure from an open cycle: ' || left(v_out::text, 90));
      end if;
    end loop;
    if exists (select 1 from public.feedback_results where cycle_id = v_cycle_a) then
      v_probs := selftest.f07_note(v_probs, 'F07-P05', 'a result snapshot existed while the cycle was open');
    end if;
    -- the fifth answer crosses the threshold, and STILL nothing is published:
    -- an aggregate that appeared here could have been watched arriving
    perform selftest.as_user_uid(v_lrn_u[5]);
    perform public.submit_feedback(v_cycle_a, selftest.f07_sheet('FQ-1', 5));
    perform selftest.as_owner();
    select count(*) into n from public.feedback_opportunities where cycle_id = v_cycle_a and consumed;
    if n <> 5 then
      v_probs := selftest.f07_note(v_probs, 'F07-P05', format('%s answers in, expected 5 at the threshold', n));
    end if;
    select count(*)::int into m_audit_submit from public.audit_log al where al.id > v_audit_low;
    perform selftest.as_user_uid(v_hod_u);
    v_out := public.feedback_result(v_cycle_a);
    perform selftest.as_owner();
    if v_out ->> 'state' <> 'OPEN' or v_out ? 'total_responses' then
      v_probs := selftest.f07_note(v_probs, 'F07-P05',
        'the figures became readable the moment the threshold was crossed: ' || left(v_out::text, 90));
    end if;
    if exists (select 1 from public.feedback_results where cycle_id = v_cycle_a) then
      v_probs := selftest.f07_note(v_probs, 'F07-P05', 'a snapshot was written before the close');
    end if;

    -- ─── and the learner who has since moved on still answers, because they
    --     were there when the class was asked (F07-P03's other half)
    perform set_config('app.seed_intent', 'synthetic', true);
    update public.memberships m set valid_to = now(), close_reason = 'MOVED'
     where m.node_id = v_k1 and m.valid_to is null
       and exists (select 1 from public.enrollments e where e.id = m.enrollment_id and e.person_id = v_mov);
    select e.id into v_enr from public.enrollments e where e.person_id = v_mov and e.institution_id = v_inst;
    insert into public.memberships (enrollment_id, node_id, academic_period_id)
    values (v_enr, v_k4, v_period);
    perform set_config('app.seed_intent', '', true);
    if exists (select 1 from public.members_of_node_at(v_k1, now()) m where m.person_id = v_mov) then
      v_probs := selftest.f07_note(v_probs, 'F07-P03', 'the moved learner is still a member of K1');
    end if;
    perform selftest.as_user_uid(v_mov_u);
    begin
      perform public.submit_feedback(v_cycle_a, selftest.f07_sheet('FQ-1', 6));
    exception when others then
      v_probs := selftest.f07_note(v_probs, 'F07-P03',
        'a learner who was in the class when it was asked could not answer after moving: ' || left(sqlerrm, 80));
    end;
    perform selftest.as_owner();

    exception when others then
      -- A DEFECT PLANTED IN ONE PLACE MUST MAKE ONE TEST RED, not silence the
      -- suite. Without this the first unexpected refusal would abort the whole
      -- subtransaction and every verdict would read 'the suite aborted' --
      -- which is a failure, but not one that says where to look.
      v_probs := selftest.f07_note(v_probs, 'F07-P05', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════════ F07-P06 the raw answers are unreachable by every ordinary role
    begin
    -- Six real client sessions, each trying the three relations directly. The
    -- response table has NO GRANT, so this is not a policy returning nothing:
    -- it is the table refusing to be read at all. The participation table does
    -- have a grant, and a policy that shows a learner their own row and nobody
    -- else theirs -- which is what "no named participation list" means when a
    -- subject or a head of department goes looking for one.
    for r in select * from unnest(array[v_e1_u, v_hod_u, v_dean_u, v_adm_u, v_sys_u, v_lrn_u[1]],
                                  array['the subject', 'the head of department', 'the dean',
                                        'the institution administrator', 'a SYSTEM_ADMIN', 'a respondent'],
                                  array[0, 0, 0, 0, 0, 1]) as t(uid, who, own)
    loop
      perform selftest.as_user_uid(r.uid);
      v_raised := false;
      begin
        select count(*) into n from public.feedback_responses;
      exception when insufficient_privilege then v_raised := true;
               when others then v_raised := true; end;
      if not v_raised then
        v_probs := selftest.f07_note(v_probs, 'F07-P06',
          format('%s read %s raw answer row(s) directly', r.who, n));
      else
        m_denied := m_denied + 1;
      end if;
      v_raised := false;
      begin
        select count(*) into n from public.feedback_results;
      exception when insufficient_privilege then v_raised := true;
               when others then v_raised := true; end;
      if not v_raised then
        v_probs := selftest.f07_note(v_probs, 'F07-P06', r.who || ' read the result snapshots directly');
      end if;
      -- the participation list: everyone sees their own row and nobody else's
      begin
        select count(*) into n from public.feedback_opportunities o where o.cycle_id = v_cycle_a;
        if n <> r.own then
          v_probs := selftest.f07_note(v_probs, 'F07-P06',
            format('%s sees %s participation row(s), expected %s', r.who, n, r.own));
        end if;
      exception when others then
        v_probs := selftest.f07_note(v_probs, 'F07-P06',
          r.who || ' could not read the participation table at all: ' || left(sqlerrm, 60));
      end;
      m_readers := m_readers + 1;
      perform selftest.as_owner();
    end loop;
    -- AND THE GOVERNED READER REFUSES THE TWO ADMINISTRATORS OUTRIGHT.
    -- Administering a school is not being told what its children said about a
    -- named teacher, and outranking Management is not being Management: WP7
    -- gives neither of them a result, and their existing audit authority is
    -- untouched by that.
    for r in select * from unnest(array[v_adm_u, v_sys_u],
                                  array['the institution administrator', 'a SYSTEM_ADMIN']) as t(uid, who)
    loop
      perform selftest.as_user_uid(r.uid);
      v_raised := false;
      begin perform public.feedback_result(v_cycle_a);
      exception when others then v_raised := true; end;
      perform selftest.as_owner();
      if not v_raised then
        v_probs := selftest.f07_note(v_probs, 'F07-P06', r.who || ' read a feedback result');
      else
        m_denied := m_denied + 1;
      end if;
    end loop;

    -- NON-VACUITY: those sessions are real and can read something. The subject
    -- and Management see the cycle row; the learner does not.
    perform selftest.as_user_uid(v_hod_u);
    select count(*) into n from public.feedback_cycles f where f.id = v_cycle_a;
    perform selftest.as_owner();
    if n <> 1 then
      v_probs := selftest.f07_note(v_probs, 'F07-P06',
        'the head of department could not read the cycle row either: these refusals prove nothing');
    end if;
    perform selftest.as_user_uid(v_e1_u);
    select count(*) into n from public.feedback_cycles f where f.id = v_cycle_a;
    perform selftest.as_owner();
    if n <> 1 then
      v_probs := selftest.f07_note(v_probs, 'F07-P06', 'the subject cannot see that a cycle about them exists');
    end if;
    perform selftest.as_user_uid(v_lrn_u[1]);
    select count(*) into n from public.feedback_cycles;
    perform selftest.as_owner();
    if n <> 0 then
      v_probs := selftest.f07_note(v_probs, 'F07-P06', format('a learner reads %s cycle row(s) directly', n));
    end if;

    exception when others then
      -- A DEFECT PLANTED IN ONE PLACE MUST MAKE ONE TEST RED, not silence the
      -- suite. Without this the first unexpected refusal would abort the whole
      -- subtransaction and every verdict would read 'the suite aborted' --
      -- which is a failure, but not one that says where to look.
      v_probs := selftest.f07_note(v_probs, 'F07-P06', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════════════ F07-P07 publication is marginals and a total, once
    begin
    perform selftest.as_user_uid(v_hod_u);
    v_out := public.close_feedback_cycle(v_cycle_a);
    if v_out ->> 'state' <> 'PUBLISHED' then
      v_probs := selftest.f07_note(v_probs, 'F07-P07', 'six answers over a threshold of five did not publish');
    end if;
    if v_out ? 'total_responses' or v_out ? 'entries' then
      v_probs := selftest.f07_note(v_probs, 'F07-P07', 'the close handed figures back outside the governed reader');
    end if;
    v_out := public.feedback_result(v_cycle_a);
    perform selftest.as_owner();
    m_total := coalesce((v_out ->> 'total_responses')::int, -1);
    if v_out ->> 'state' <> 'PUBLISHED' or m_total <> 6 then
      v_probs := selftest.f07_note(v_probs, 'F07-P07',
        format('the snapshot reports %s respondent(s), expected 6', m_total));
    end if;
    if coalesce(jsonb_array_length(v_out -> 'entries'), 0) <> 5 then
      v_probs := selftest.f07_note(v_probs, 'F07-P07', 'the snapshot does not carry all five questions');
    end if;
    -- MARGINALS, NOT A JOINT PROFILE: each question's counts sum to the number
    -- of respondents, and there is no object anywhere in the body that pairs
    -- one question's answer with another's.
    if not coalesce((select bool_and(x.s = 6) from (
         select (select sum((o ->> 'responses')::int) from jsonb_array_elements(e -> 'options') o) as s
           from jsonb_array_elements(v_out -> 'entries') e) x), false) then
      v_probs := selftest.f07_note(v_probs, 'F07-P07', 'a question''s marginal does not sum to the respondent count');
    end if;
    if exists (
      select 1 from jsonb_array_elements(v_out -> 'entries') e,
                    lateral jsonb_object_keys(e) k
       where k not in ('question_key','label_key','ordinal','options')) then
      v_probs := selftest.f07_note(v_probs, 'F07-P07', 'a snapshot entry carries a key outside the declared shape');
    end if;
    if exists (
      select 1 from jsonb_array_elements(v_out -> 'entries') e,
                    lateral jsonb_array_elements(e -> 'options') o,
                    lateral jsonb_object_keys(o) k
       where k not in ('option_key','label_key','ordinal','responses')) then
      v_probs := selftest.f07_note(v_probs, 'F07-P07', 'a snapshot option carries a key outside the declared shape');
    end if;
    if v_out::text ~* '(person|murid|siswa|respondent|sheet|submitted_at)' then
      v_probs := selftest.f07_note(v_probs, 'F07-P07', 'the published snapshot names something about a respondent');
    end if;
    select count(*) into m_rows from public.feedback_responses where cycle_id = v_cycle_a;
    if m_rows <> 30 then
      v_probs := selftest.f07_note(v_probs, 'F07-P07',
        format('%s answer row(s) behind a six-sheet cycle, expected 30', m_rows));
    end if;
    select count(*) into n from public.feedback_results where cycle_id = v_cycle_a;
    if n <> 1 then
      v_probs := selftest.f07_note(v_probs, 'F07-P07', format('the close wrote %s snapshot(s), expected one', n));
    end if;

    exception when others then
      -- A DEFECT PLANTED IN ONE PLACE MUST MAKE ONE TEST RED, not silence the
      -- suite. Without this the first unexpected refusal would abort the whole
      -- subtransaction and every verdict would read 'the suite aborted' --
      -- which is a failure, but not one that says where to look.
      v_probs := selftest.f07_note(v_probs, 'F07-P07', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════════════════════════ F07-P08 both terminal states are terminal
    begin
    v_raised := false;
    begin
      insert into public.feedback_responses (cycle_id, institution_id, question_key, option_key)
      values (v_cycle_a, v_inst, 'penjelasan_jelas', 'selalu');
    exception when others then v_raised := true; end;
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P08', 'an answer arrived after the cycle closed');
    end if;
    v_raised := false;
    begin update public.feedback_cycles f set state = 'OPEN' where f.id = v_cycle_a;
    exception when others then v_raised := true; end;
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P08', 'a closed cycle reopened');
    end if;
    v_raised := false;
    begin update public.feedback_results set total_responses = 99 where cycle_id = v_cycle_a;
    exception when others then v_raised := true; end;
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P08', 'a published snapshot was rewritten');
    end if;
    v_raised := false;
    begin delete from public.feedback_results where cycle_id = v_cycle_a;
    exception when others then v_raised := true; end;
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P08', 'a published snapshot was deleted');
    end if;
    v_raised := false;
    begin delete from public.feedback_opportunities where cycle_id = v_cycle_a;
    exception when others then v_raised := true; end;
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P08', 'the eligibility snapshot was deleted');
    end if;
    v_raised := false;
    begin update public.feedback_opportunities set consumed = false where cycle_id = v_cycle_a;
    exception when others then v_raised := true; end;
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P08', 'a submitted sheet was un-submitted');
    end if;
    perform selftest.as_user_uid(v_hod_u);
    v_raised := false;
    begin perform public.close_feedback_cycle(v_cycle_a);
    exception when others then v_raised := true; end;
    perform selftest.as_owner();
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P08', 'a closed cycle was closed again');
    end if;

    exception when others then
      -- A DEFECT PLANTED IN ONE PLACE MUST MAKE ONE TEST RED, not silence the
      -- suite. Without this the first unexpected refusal would abort the whole
      -- subtransaction and every verdict would read 'the suite aborted' --
      -- which is a failure, but not one that says where to look.
      v_probs := selftest.f07_note(v_probs, 'F07-P08', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════════ F07-P12 the questions and the threshold are governed, and bound
    begin
    perform selftest.as_user_uid(v_hod_u);
    v_raised := false;
    begin
      perform public.publish_feedback_question_set('FQ-9', 'tidak sah',
        '[{"question_key":"x","label_key":"a.b","options":[{"option_key":"y","label_key":"a.c"},
                                                           {"option_key":"z","label_key":"a.d"}]}]'::jsonb);
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    perform selftest.as_owner();
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P12', 'a head of department published a question set');
    elsif v_msg !~ 'SYSTEM_ADMIN' then
      v_probs := selftest.f07_note(v_probs, 'F07-P12', 'the refusal did not name SYSTEM_ADMIN: ' || left(v_msg, 70));
    end if;

    -- a published set is frozen: not its questions, not its options, not its row
    for r in select * from unnest(
        array['update public.feedback_questions set label_key = ''x.y'' where set_version = ''FQ-1''',
              'delete from public.feedback_questions where set_version = ''FQ-1''',
              'update public.feedback_question_options set label_key = ''x.y'' where set_version = ''FQ-1''',
              'update public.feedback_question_sets set note = ''diubah'' where version = ''FQ-1''',
              'update public.feedback_thresholds set minimum_responses = 1 where version = ''FT-1''',
              'delete from public.feedback_thresholds where version = ''FT-1'''],
        array['a question''s wording', 'a question', 'an option''s wording', 'a set''s note',
              'the threshold itself', 'the threshold row']) as t(stmt, who)
    loop
      v_raised := false;
      begin execute r.stmt;
      exception when others then v_raised := true; end;
      if not v_raised then
        v_probs := selftest.f07_note(v_probs, 'F07-P12', r.who || ' was edited after publication');
      end if;
    end loop;

    -- a SYSTEM_ADMIN publishes the next versions, and the OPEN cycle keeps the
    -- ones it bound: a republication is never retroactive
    perform selftest.as_user_uid(v_sys_u);
    begin
      perform public.publish_feedback_question_set('FQ-2', 'versi kedua',
        '[{"question_key":"penjelasan_jelas","label_key":"umpanbalik.pertanyaan.penjelasan_jelas",
           "options":[{"option_key":"jarang","label_key":"umpanbalik.pilihan.jarang"},
                      {"option_key":"selalu","label_key":"umpanbalik.pilihan.selalu"}]}]'::jsonb);
      perform public.publish_feedback_threshold('FT-2', 1, 'umpanbalik.hasil.belum_cukup_tanggapan',
        'ambang uji coba');
    exception when others then
      v_probs := selftest.f07_note(v_probs, 'F07-P12', 'a SYSTEM_ADMIN could not publish: ' || left(sqlerrm, 80));
    end;
    perform selftest.as_owner();
    if public.current_feedback_question_set() <> 'FQ-2'
       or (select superseded_by from public.feedback_question_sets where version = 'FQ-1') <> 'FQ-2' then
      v_probs := selftest.f07_note(v_probs, 'F07-P12', 'the new question set did not supersede the old one');
    end if;
    if public.current_feedback_threshold() <> 'FT-2' then
      v_probs := selftest.f07_note(v_probs, 'F07-P12', 'the new threshold is not live');
    end if;
    if (select f.question_set_version from public.feedback_cycles f where f.id = v_cycle_b) <> 'FQ-1'
       or (select f.threshold_version from public.feedback_cycles f where f.id = v_cycle_b) <> 'FT-1' then
      v_probs := selftest.f07_note(v_probs, 'F07-P12', 'an open cycle''s bound versions moved under it');
    end if;
    perform selftest.as_user_uid(v_lrn_u[7]);
    v_out := public.feedback_questionnaire(v_cycle_b);
    perform selftest.as_owner();
    if coalesce(jsonb_array_length(v_out -> 'questions'), 0) <> 5
       or v_out ->> 'question_set_version' <> 'FQ-1' then
      v_probs := selftest.f07_note(v_probs, 'F07-P12',
        'a learner mid-cycle was shown the new question set instead of the one they were asked');
    end if;

    exception when others then
      -- A DEFECT PLANTED IN ONE PLACE MUST MAKE ONE TEST RED, not silence the
      -- suite. Without this the first unexpected refusal would abort the whole
      -- subtransaction and every verdict would read 'the suite aborted' --
      -- which is a failure, but not one that says where to look.
      v_probs := selftest.f07_note(v_probs, 'F07-P12', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ══════════════ F07-P09 below the threshold: a sentence, and nothing else
    begin
    -- TWO ANSWERS, AND THE LIVE THRESHOLD IS NOW ONE. The cycle still withholds,
    -- because it answers to the version it bound when the class was asked.
    for i in 7..8 loop
      perform selftest.as_user_uid(v_lrn_u[i]);
      perform public.submit_feedback(v_cycle_b, selftest.f07_sheet('FQ-1', i));
      perform selftest.as_owner();
    end loop;
    perform selftest.as_user_uid(v_dean_u);
    v_out := public.close_feedback_cycle(v_cycle_b);
    perform selftest.as_owner();
    if v_out ->> 'state' <> 'WITHHELD' then
      v_probs := selftest.f07_note(v_probs, 'F07-P09',
        'two answers against the bound threshold of five did not withhold: ' || left(v_out::text, 90));
    end if;
    if v_out ->> 'statement_key' <> 'umpanbalik.hasil.belum_cukup_tanggapan' then
      v_probs := selftest.f07_note(v_probs, 'F07-P09', 'the close did not return the canonical suppression key');
    end if;
    if exists (select 1 from public.feedback_results where cycle_id = v_cycle_b) then
      v_probs := selftest.f07_note(v_probs, 'F07-P09', 'a withheld cycle wrote a result snapshot');
    end if;
    for r in select * from unnest(array[v_hod_u, v_dean_u, v_e2_u],
                                  array['the head of department', 'the dean', 'the subject']) as t(uid, who)
    loop
      perform selftest.as_user_uid(r.uid);
      v_out := public.feedback_result(v_cycle_b);
      perform selftest.as_owner();
      if v_out ->> 'state' <> 'WITHHELD'
         or v_out ->> 'statement_key' <> 'umpanbalik.hasil.belum_cukup_tanggapan' then
        v_probs := selftest.f07_note(v_probs, 'F07-P09',
          r.who || ' did not receive the canonical statement: ' || left(v_out::text, 80));
      end if;
      -- THE WHOLE ANSWER IS THREE KEYS. Not a count, not a have, not a needed,
      -- not a total and not a distribution -- and this is checked by naming
      -- what MAY be present rather than guessing what may not.
      if exists (select 1 from jsonb_object_keys(v_out) k
                  where k not in ('cycle_id', 'state', 'statement_key')) then
        v_probs := selftest.f07_note(v_probs, 'F07-P09',
          r.who || ' was handed more than the statement: ' || left(v_out::text, 80));
      end if;
    end loop;
    -- and the answers that were given are still there, unread and unaggregated:
    -- withholding is not deletion, which nobody decided
    select count(*) into n from public.feedback_responses where cycle_id = v_cycle_b;
    if n <> 10 then
      v_probs := selftest.f07_note(v_probs, 'F07-P09',
        format('%s answer row(s) behind the withheld cycle, expected 10', n));
    end if;

    exception when others then
      -- A DEFECT PLANTED IN ONE PLACE MUST MAKE ONE TEST RED, not silence the
      -- suite. Without this the first unexpected refusal would abort the whole
      -- subtransaction and every verdict would read 'the suite aborted' --
      -- which is a failure, but not one that says where to look.
      v_probs := selftest.f07_note(v_probs, 'F07-P09', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ══════════════════ F07-P10 a learner moves school, and nothing follows them
    begin
    -- The real transfer path, not a stand-in: request, authorize, execute --
    -- which also grants the receiving school portable visibility over the
    -- person. That visibility is what makes this test worth running: the
    -- receiving admin genuinely CAN see this learner now, and still sees
    -- nothing of what they said.
    select e.id into v_enr from public.enrollments e
     where e.person_id = v_lrn[1] and e.institution_id = v_inst and e.status = 'ACTIVE';
    perform selftest.as_user_uid(v_adm_u);
    begin
      v_tr := public.transfer_request(v_enr, v_inst2, v_period2, v_inst2_prog, 'pindah rumah');
    exception when others then
      v_probs := selftest.f07_note(v_probs, 'F07-P10', 'the transfer could not be requested: ' || left(sqlerrm, 80));
    end;
    perform selftest.as_owner();
    if v_tr is not null then
      perform selftest.as_user_uid(v_adm2_u);
      begin
        perform public.transfer_authorize(v_tr, '{"wali":"ya"}'::jsonb);
        perform public.transfer_execute(v_tr);
      exception when others then
        v_probs := selftest.f07_note(v_probs, 'F07-P10', 'the transfer could not be executed: ' || left(sqlerrm, 80));
      end;
      perform selftest.as_owner();
      if not exists (select 1 from public.portable_visibility pv
                      where pv.person_id = v_lrn[1] and pv.institution_id = v_inst2) then
        v_probs := selftest.f07_note(v_probs, 'F07-P10',
          'the transfer granted no portable visibility: the refusals below would prove nothing');
      end if;
      perform selftest.as_user_uid(v_adm2_u);
      -- non-vacuity: the receiving admin really does see the person now
      select count(*) into n from public.persons p where p.id = v_lrn[1];
      if n <> 1 then
        v_probs := selftest.f07_note(v_probs, 'F07-P10',
          'the receiving school cannot see the transferred learner at all');
      end if;
      select count(*) into n from public.feedback_cycles;
      if n <> 0 then
        v_probs := selftest.f07_note(v_probs, 'F07-P10', format('the receiving school reads %s feedback cycle(s)', n));
      end if;
      select count(*) into n from public.feedback_opportunities;
      if n <> 0 then
        v_probs := selftest.f07_note(v_probs, 'F07-P10',
          format('the receiving school reads %s participation row(s)', n));
      end if;
      v_raised := false;
      begin select count(*) into n from public.feedback_responses;
      exception when others then v_raised := true; end;
      if not v_raised then
        v_probs := selftest.f07_note(v_probs, 'F07-P10', 'the receiving school read the raw answers');
      end if;
      v_raised := false;
      begin perform public.feedback_result(v_cycle_a);
      exception when others then v_raised := true; end;
      if not v_raised then
        v_probs := selftest.f07_note(v_probs, 'F07-P10', 'the receiving school read another school''s published result');
      end if;
      perform selftest.as_owner();
    end if;
    select string_agg(table_name, ', ') into v_msg from public.record_class_registry
     where table_name like 'feedback\_%' and portability <> 'INSTITUTION_SCOPED';
    if v_msg is not null then
      v_probs := selftest.f07_note(v_probs, 'F07-P10', 'feedback declared portable: ' || v_msg);
    end if;
    select count(*) into n from public.record_class_registry where table_name like 'feedback\_%';
    if n <> 4 then
      v_probs := selftest.f07_note(v_probs, 'F07-P10',
        format('%s feedback table(s) declare a record class, expected 4', n));
    end if;

    exception when others then
      -- A DEFECT PLANTED IN ONE PLACE MUST MAKE ONE TEST RED, not silence the
      -- suite. Without this the first unexpected refusal would abort the whole
      -- subtransaction and every verdict would read 'the suite aborted' --
      -- which is a failure, but not one that says where to look.
      v_probs := selftest.f07_note(v_probs, 'F07-P10', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ══════════════════════════ F07-P11 feedback never becomes evidence
    begin
    select a.ok, a.detail into v_ok, v_detail from public.assert_feedback_is_not_evidence() a;
    if not v_ok then
      v_probs := selftest.f07_note(v_probs, 'F07-P11', 'assert_feedback_is_not_evidence: ' || left(v_detail, 140));
    end if;
    m_rel := coalesce((select count(*)::int from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
                        where ns.nspname = 'public' and c.relkind = 'r' and c.relname like 'feedback\_%'), 0);
    m_consumers := coalesce((select count(*)::int from pg_proc p
                              where p.pronamespace = 'public'::regnamespace and p.proname like 'calc\_%'), 0);
    if m_rel < 8 or m_consumers < 10 then
      v_probs := selftest.f07_note(v_probs, 'F07-P11',
        format('the assertion is measuring %s relation(s) against %s calculator(s)', m_rel, m_consumers));
    end if;
    -- MEASURED, NOT ASSUMED: the class metric a head of department reads is
    -- byte-identical before the class spoke and after thirty answers were
    -- written. Comparing the whole envelope rather than a field catches a
    -- readiness or sample change as well as a value change.
    perform selftest.as_user_uid(v_hod_u);
    v_metric_after := public.metric_evaluate('class.participants', v_k1, v_inst);
    perform selftest.as_owner();
    if v_metric_before is distinct from v_metric_after then
      v_probs := selftest.f07_note(v_probs, 'F07-P11',
        format('a class metric moved when the class gave feedback: %s -> %s',
               left(v_metric_before::text, 60), left(v_metric_after::text, 60)));
    end if;
    -- and no feedback row reached the evidence boundaries at all
    select count(*) into n from public.academic_responses ar
      join public.assessment_sessions s on s.id = ar.session_id
     where s.person_id = any (v_lrn);
    if n <> 0 then
      v_probs := selftest.f07_note(v_probs, 'F07-P11', format('%s academic response(s) appeared for respondents', n));
    end if;
    if exists (select 1 from public.metric_sources where source_relation like 'feedback\_%') then
      v_probs := selftest.f07_note(v_probs, 'F07-P11', 'a feedback relation is a declared metric source');
    end if;

    exception when others then
      -- A DEFECT PLANTED IN ONE PLACE MUST MAKE ONE TEST RED, not silence the
      -- suite. Without this the first unexpected refusal would abort the whole
      -- subtransaction and every verdict would read 'the suite aborted' --
      -- which is a failure, but not one that says where to look.
      v_probs := selftest.f07_note(v_probs, 'F07-P11', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═════════════ F07-P13 the audit trail says what Management did, and no more
    begin
    if m_audit_submit <> 0 then
      v_probs := selftest.f07_note(v_probs, 'F07-P13',
        format('%s audit row(s) were written while five learners answered', m_audit_submit));
    end if;
    select count(*) into n from public.audit_log al
     where al.action like 'feedback%' and al.target_id in (v_cycle_a::text, v_cycle_b::text);
    if n <> 4 then
      v_probs := selftest.f07_note(v_probs, 'F07-P13',
        format('%s audit row(s) for two cycles opened and two closed, expected 4', n));
    end if;
    if exists (select 1 from public.audit_log al
                where al.target_table in ('feedback_responses', 'feedback_opportunities')) then
      v_probs := selftest.f07_note(v_probs, 'F07-P13', 'an audit row is about a response or a participation');
    end if;
    -- no count, no total, no answer text anywhere in a feedback audit row
    select string_agg(distinct al.action, ', ') into v_msg from public.audit_log al
     where al.action like 'feedback%'
       and (al.summary::text ~* '\y(have|needed|count|total|responses|jarang|kadang|sering|selalu)\y');
    if v_msg is not null then
      v_probs := selftest.f07_note(v_probs, 'F07-P13', 'a feedback audit row carries a count or an answer: ' || v_msg);
    end if;
    -- and no respondent is the actor of any feedback audit row
    if exists (select 1 from public.audit_log al
                where al.action like 'feedback%' and al.actor_person_id = any (v_lrn)) then
      v_probs := selftest.f07_note(v_probs, 'F07-P13', 'a respondent is the actor of a feedback audit row');
    end if;
    -- non-vacuity: the two closes ARE audited, by the people who closed them
    select count(*) into n from public.audit_log al
     where al.action = 'feedback_cycle.closed'
       and al.actor_person_id in (v_hod, v_dean) and al.target_id in (v_cycle_a::text, v_cycle_b::text);
    if n <> 2 then
      v_probs := selftest.f07_note(v_probs, 'F07-P13',
        format('%s close(s) are attributed to the person who closed them, expected 2', n));
    end if;

    perform selftest.as_owner();
    exception when others then
      -- A DEFECT PLANTED IN ONE PLACE MUST MAKE ONE TEST RED, not silence the
      -- suite. Without this the first unexpected refusal would abort the whole
      -- subtransaction and every verdict would read 'the suite aborted' --
      -- which is a failure, but not one that says where to look.
      v_probs := selftest.f07_note(v_probs, 'F07-P13', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════ F07-P14 Management can name the teacher it is asking about
    begin
    -- THE DEFECT WP7D FOUND, REPRODUCED HERE RATHER THAN DESCRIBED: this
    -- educator is not enrolled as a learner anywhere, so the learner-shaped
    -- visibility predicate every other person read goes through says nothing
    -- about them -- and an authorized head of department could not have
    -- discovered the id the open contract requires.
    select p.display_name into v_msg from public.persons p where p.id = v_e1;
    perform selftest.as_user_uid(v_hod_u);
    if public.person_visible_to_me(v_e1) then
      v_probs := selftest.f07_note(v_probs, 'F07-P14',
        'the subject educator is visible through learner visibility: this test is not reproducing the defect');
    end if;
    select count(*) into n from public.persons p where p.id = v_e1;
    if n <> 0 then
      v_probs := selftest.f07_note(v_probs, 'F07-P14',
        'the head of department can already read that educator''s person row: the defect is not reproduced');
    end if;
    -- AND THE GOVERNED READ ANSWERS ANYWAY, with the name and nothing else.
    select count(*) into n from public.feedback_subjects_for_class(v_k1);
    if n <> 1 then
      v_probs := selftest.f07_note(v_probs, 'F07-P14',
        format('the class offers %s subject(s), expected the one educator who teaches it', n));
    end if;
    select s.person_id, s.display_name into v_subj from public.feedback_subjects_for_class(v_k1) s;
    if v_subj.person_id is distinct from v_e1 then
      v_probs := selftest.f07_note(v_probs, 'F07-P14', 'the subject offered is not the educator who teaches the class');
    end if;
    if coalesce(v_subj.display_name, '') = '' or v_subj.display_name is distinct from v_msg then
      v_probs := selftest.f07_note(v_probs, 'F07-P14',
        'the display identity is missing or is not the person''s own name: ' || coalesce(v_subj.display_name, '(null)'));
    end if;
    perform selftest.as_owner();

    -- THE ID IT RETURNS IS THE ID THE EXISTING CONTRACT ACCEPTS -- measured on
    -- a class that has no cycle yet, because K1's is already open.
    perform selftest.as_user_uid(v_dean_u);
    select count(*) into n from public.feedback_subjects_for_class(v_k3);
    if n <> 1 then
      v_probs := selftest.f07_note(v_probs, 'F07-P14',
        format('the professional-development class offers %s subject(s), expected 1', n));
    end if;
    -- AND THE ACADEMIC RESIDUAL IS CARRIED UNCHANGED, which is the advisory
    -- contract working: discovery answers about the SUBJECT, and opening still
    -- refuses this class on its own context rule.
    v_raised := false;
    begin
      perform public.open_feedback_cycle(v_k3, v_e3);
      raise exception 'F07_ACCEPTED';
    exception when others then
      if sqlerrm <> 'F07_ACCEPTED' then v_raised := true; v_msg := sqlerrm; end if;
    end;
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P14',
        'a discovered subject opened a cycle over professional-development material');
    elsif v_msg !~ 'professional-development' then
      v_probs := selftest.f07_note(v_probs, 'F07-P14',
        'opening refused the discovered subject for the wrong reason: ' || left(v_msg, 80));
    end if;
    -- AND THE ID DISCOVERY RETURNS IS THE ID THE OPEN CONTRACT ACCEPTS, on an
    -- ordinary academic class that has no cycle yet -- so the refusal above is
    -- the class's context rule and not the subject being unusable.
    perform selftest.as_owner();
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_e1, 'EDUCATOR', v_k4, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);
    perform selftest.as_user_uid(v_dean_u);
    select count(*) into n from public.feedback_subjects_for_class(v_k4) s where s.person_id = v_e1;
    if n <> 1 then
      v_probs := selftest.f07_note(v_probs, 'F07-P14',
        'the educator who teaches the second class was not offered as its subject');
    end if;
    v_raised := false;
    begin
      select s.person_id into v_subj from public.feedback_subjects_for_class(v_k4) s where s.person_id = v_e1;
      perform public.open_feedback_cycle(v_k4, v_subj.person_id);
    exception when others then v_raised := true; v_msg := sqlerrm; end;
    if v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P14',
        'a discovered subject was refused an ordinary academic class: ' || left(v_msg, 90));
    end if;
    -- TWO TEACHERS ARE TWO ROWS, deterministically ordered, with no uniqueness
    -- invented; and the caller is never a candidate for their own round.
    perform selftest.as_owner();
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_e2,  'EDUCATOR', v_k1, now() - interval '1 day', now() + interval '365 days'),
           (v_hod, 'EDUCATOR', v_k1, now() - interval '1 day', now() + interval '365 days');
    perform set_config('app.seed_intent', '', true);
    perform selftest.as_user_uid(v_dean_u);
    select count(*) into n from public.feedback_subjects_for_class(v_k1);
    if n <> 3 then
      v_probs := selftest.f07_note(v_probs, 'F07-P14',
        format('three educators over one class offered %s subject(s) to a dean', n));
    end if;
    if (select count(*) from (select s.person_id from public.feedback_subjects_for_class(v_k1) s) x)
       <> (select count(distinct s.person_id) from public.feedback_subjects_for_class(v_k1) s) then
      v_probs := selftest.f07_note(v_probs, 'F07-P14', 'one educator was offered more than once');
    end if;
    perform selftest.as_user_uid(v_hod_u);
    select count(*) into n from public.feedback_subjects_for_class(v_k1) s where s.person_id = v_hod;
    if n <> 0 then
      v_probs := selftest.f07_note(v_probs, 'F07-P14',
        'a head of department who also teaches the class was offered their own round');
    end if;
    perform selftest.as_owner();
    exception when others then
      v_probs := selftest.f07_note(v_probs, 'F07-P14', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    -- ═══════ F07-P15 discovery is Management's, advisory, and says nothing
    begin
    -- NOBODY OUTSIDE THE MANAGEMENT BOUNDARY MAY ASK, and each refusal names
    -- the boundary rather than what it is protecting.
    for r in select * from unnest(array[v_hod2_u, v_adm_u, v_sys_u, v_e1_u, v_e2_u, v_lrn_u[1]],
                                  array['a head of department of the other department',
                                        'the institution administrator', 'a SYSTEM_ADMIN',
                                        'the subject educator themselves', 'another educator',
                                        'a learner of the class']) as t(uid, who)
    loop
      perform selftest.as_user_uid(r.uid);
      v_raised := false; v_msg := '';
      begin
        perform * from public.feedback_subjects_for_class(v_k1);
        raise exception 'F07_ACCEPTED';
      exception when others then
        if sqlerrm <> 'F07_ACCEPTED' then v_raised := true; v_msg := sqlerrm; end if;
      end;
      perform selftest.as_owner();
      if not v_raised then
        v_probs := selftest.f07_note(v_probs, 'F07-P15', r.who || ' enumerated the subjects of a class');
      elsif v_msg !~ 'HEAD_OF_DEPARTMENT' then
        v_probs := selftest.f07_note(v_probs, 'F07-P15',
          r.who || ' was refused for the wrong reason: ' || left(v_msg, 80));
      else
        m_subj_denied := m_subj_denied + 1;
      end if;
    end loop;

    -- A PERSON THE RULE DOES NOT HOLD IS NOT OFFERED, however senior.
    perform selftest.as_user_uid(v_dean_u);
    select count(*) into n from public.feedback_subjects_for_class(v_k1) s
     where s.person_id in (v_adm, v_sys, v_dean, v_lrn[1], v_e3);
    if n <> 0 then
      v_probs := selftest.f07_note(v_probs, 'F07-P15',
        format('%s person(s) with no teaching authority over the class were offered as subjects', n));
    end if;

    -- IT SAYS NOTHING ABOUT RESPONDENTS. The same class, after six sheets and
    -- a published snapshot, answers exactly what it answered before anybody
    -- had spoken: a discovery endpoint that moved would be a participation
    -- oracle with a Management login in front of it.
    perform selftest.as_user_uid(v_hod_u);
    select coalesce(string_agg(s.person_id::text || '=' || s.display_name, '|' order by s.person_id), '(none)')
      into m_subj_after
      from public.feedback_subjects_for_class(v_k1) s
     where s.person_id = v_e1;
    perform selftest.as_owner();
    if m_subj_after is distinct from m_subj_before then
      v_probs := selftest.f07_note(v_probs, 'F07-P15',
        format('the subject list moved once the class answered: %s -> %s',
               left(m_subj_before, 60), left(m_subj_after, 60)));
    end if;
    -- and it carries no column that could be one
    select string_agg(a.attname, ', ' order by a.attnum) into v_msg
      from pg_proc p, unnest(p.proargnames, p.proargmodes) with ordinality as a(attname, mode, attnum)
     where p.pronamespace = 'public'::regnamespace and p.proname = 'feedback_subjects_for_class'
       and a.mode = 't';
    if v_msg is distinct from 'person_id, display_name' then
      v_probs := selftest.f07_note(v_probs, 'F07-P15',
        'the Management projection is not the two declared columns: ' || coalesce(v_msg, '(none)'));
    end if;
    select string_agg(p.proname, ', ') into v_msg from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.proname in ('feedback_subject_candidates', 'feedback_subjects_for_class')
       and coalesce(p.prosrc, '') ~* '\yfeedback_(responses|opportunities|results)\y';
    if v_msg is not null then
      v_probs := selftest.f07_note(v_probs, 'F07-P15', 'subject discovery reads a respondent relation: ' || v_msg);
    end if;

    -- DISCOVERY IS NOT AUTHORIZATION. The subject is listed, their assignment
    -- then ends, and opening refuses on its own re-validation rather than on
    -- the strength of a list somebody read a moment ago.
    perform selftest.as_user_uid(v_dean_u);
    select count(*) into n from public.feedback_subjects_for_class(v_k2);
    if n <> 1 then
      v_probs := selftest.f07_note(v_probs, 'F07-P15', format('K2 offered %s subject(s) before the revocation', n));
    end if;
    perform selftest.as_owner();
    select ra.id into v_one from public.role_assignments ra
     where ra.person_id = v_e2 and ra.role = 'EDUCATOR' and ra.scope_node_id = v_k2
       and ra.revoked_at is null;
    perform selftest.as_user_uid(v_adm_u);
    perform public.revoke_role(v_one, 'selftest: D-097');
    perform selftest.as_owner();
    perform selftest.as_user_uid(v_dean_u);
    select count(*) into n from public.feedback_subjects_for_class(v_k2);
    if n <> 0 then
      v_probs := selftest.f07_note(v_probs, 'F07-P15', 'a revoked educator is still offered as a subject');
    end if;
    v_raised := false;
    begin
      perform public.open_feedback_cycle(v_k4, v_e2);
      raise exception 'F07_ACCEPTED';
    exception when others then
      if sqlerrm <> 'F07_ACCEPTED' then v_raised := true; v_msg := sqlerrm; end if;
    end;
    perform selftest.as_owner();
    if not v_raised then
      v_probs := selftest.f07_note(v_probs, 'F07-P15',
        'opening accepted a subject whose teaching authority had ended since discovery');
    elsif v_msg !~ 'EDUCATOR' then
      v_probs := selftest.f07_note(v_probs, 'F07-P15',
        'opening refused the stale subject for the wrong reason: ' || left(v_msg, 80));
    end if;
    exception when others then
      v_probs := selftest.f07_note(v_probs, 'F07-P15', 'the test could not run: ' || left(sqlerrm, 150));
      begin perform selftest.as_owner(); exception when others then null; end;
    end;

    raise exception 'F07_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    perform set_config('pintar.feedback_opening', '', true);
    if sqlerrm <> 'F07_UNDO' then v_fatal := sqlerrm; end if;
  end;

  ------------------------------------------------------------------- verdicts
  -- Collected during the run and emitted after the rollback, so the findings
  -- survive and the rows do not.
  for r in
    select * from unnest(
      array['F07-P01','F07-P02','F07-P03','F07-P04','F07-P05','F07-P06','F07-P07',
            'F07-P08','F07-P09','F07-P10','F07-P11','F07-P12','F07-P13','F07-P14','F07-P15'],
      array['WP7B -- the world this suite reasons about is real',
            'WP7B -- who may open a feedback cycle, and who may not',
            'WP7B -- eligibility is a snapshot taken when the class was asked',
            'WP7B -- one sheet per learner, whole, exactly once',
            'WP7B -- nothing is readable while a cycle is open',
            'WP7B -- the raw answers are unreachable by every ordinary role',
            'WP7B -- publication is per-question marginals and a total, once',
            'WP7B -- both terminal states are terminal',
            'WP7B -- below the threshold there is a sentence and nothing else',
            'WP7B -- a learner moves school and nothing they said follows',
            'WP7B -- feedback never becomes evidence about a person',
            'WP7B -- the questions and the threshold are governed, and bound',
            'WP7B -- the audit trail says what Management did, and no more',
            'WP7D -- Management can name the teacher it is asking about',
            'WP7D -- discovery is Management''s, advisory, and says nothing about respondents'],
      array[
        format('a real school: %s learners in the class at the instant it was asked, an educator holding '
            || 'live teaching authority over it, a governed set of 5 questions and 20 closed options, a '
            || 'governed threshold of five, professional-development material reaching the PD class and '
            || 'not this one, a head of department with Management scope here and an educator without it '
            || '-- and that same educator holding CAN_ASSIGN_LEARNING, which is why the briefing-shaped '
            || 'gate was not reused', m_eligible),
        format('%s refusals, each naming its own reason: the subject (who holds CAN_ASSIGN_LEARNING and '
            || 'would have passed a capability gate), another educator, the institution''s administrator, '
            || 'a SYSTEM_ADMIN and a head of department of the neighbouring department are all refused '
            || 'with the Management sentence; a cohort is refused for not being a CLASS; a class reached '
            || 'by professional-development material is refused by name; an educator who does not teach '
            || 'the class and a head of department are both refused as subjects. A head of department in '
            || 'scope opens it, a dean in scope opens the second, and a second cycle over the same class, '
            || 'subject and period is refused', m_blocked),
        format('the snapshot holds the %s learners who were in the class at the opening instant, the '
            || 'subject is not among them, nobody starts out counted as having answered; a learner '
            || 'enrolled afterwards is absent from it and is refused, a learner of another class is '
            || 'refused, and a learner who was there and has since moved to another class still answers '
            || '-- because they were there when the class was asked', m_eligible),
        'one sheet, five rows, one consumed opportunity; the replay a lost acknowledgement produces is '
            || 'refused by name and writes nothing; a half-answered sheet, an invented question and an '
            || 'invented answer are each refused, and the learner whose invalid sheet was refused can '
            || 'still answer properly afterwards -- a rejected sheet costs nobody their one chance to speak',
        'with four answers in, and again with the fifth that crosses the threshold, the head of '
            || 'department, the dean and the subject are each told only that the cycle is open: no total, '
            || 'no have, no needed, no distribution, and no snapshot row exists to read. An aggregate '
            || 'readable here could have been watched arriving one learner at a time',
        format('%s real client sessions -- the subject, a head of department, a dean, the institution''s '
            || 'administrator, a SYSTEM_ADMIN and a respondent -- produce %s refusals of the raw answers, '
            || 'because that table carries no client grant at all rather than a policy that filters, and '
            || 'the snapshots refuse them too. The governed reader refuses the institution''s '
            || 'administrator and a SYSTEM_ADMIN outright -- administering a school is not being told '
            || 'what its children said about a named teacher. Each session sees exactly its own '
            || 'participation row and nobody else''s, so there is no named participation list to be had. '
            || 'The sessions are real: the same readers read the cycle row, and a learner reads none',
            m_readers, m_denied),
        format('%s respondents, %s answer rows, one snapshot: five questions, each option present '
            || 'including the ones nobody chose, every question''s marginal summing to the respondent '
            || 'count, no key outside the declared shape, nothing naming a respondent -- and no joint '
            || 'profile, because a sheet cannot be reassembled from rows that carry no one', m_total, m_rows),
        'an answer arriving after the close is refused by the table itself, not merely by the endpoint; '
            || 'the cycle cannot be reopened, closed twice, or have its snapshot rewritten or deleted; '
            || 'the eligibility snapshot cannot be deleted and a submitted sheet cannot be un-submitted',
        'two answers against a bound threshold of five: WITHHELD, no snapshot written, and the head of '
            || 'department, the dean and the subject each receive exactly three keys -- the cycle, the '
            || 'state and the canonical statement -- with no count, no have, no needed and no '
            || 'distribution among them. The live threshold had by then been republished at one, and the '
            || 'cycle still answered to the version it bound. The ten answers that were given remain '
            || 'unread and unaggregated: withholding is not deletion, which nobody decided',
        'the real transfer path -- requested, authorized, executed -- moves a respondent to another '
            || 'school and grants it portable visibility over them, which it demonstrably uses: the '
            || 'receiving administrator can see the person. They read no feedback cycle, no participation '
            || 'row, no raw answer and no published result, and all four feedback tables are declared '
            || 'INSTITUTION_SCOPED',
        format('the standing assertion holds over %s feedback relations and %s calculators; the class '
            || 'metric a head of department reads is byte-identical before the class spoke and after '
            || 'thirty answers were written; no respondent gained an academic response; and no feedback '
            || 'relation is a declared metric source, so no calculator could reach one', m_rel, m_consumers),
        'a head of department cannot publish a question set and is refused by the name SYSTEM_ADMIN; a '
            || 'published set''s questions, options and note, and the threshold itself, are all frozen '
            || 'against edit and deletion; a SYSTEM_ADMIN publishes the next versions and they supersede '
            || 'the old ones -- while the open cycle keeps the versions it bound, and a learner mid-cycle '
            || 'is still shown the questions they were actually asked',
        format('%s audit rows were written while five learners answered; four rows record two cycles '
            || 'opened and two closed, each attributed to the Management actor who did it; no audit row '
            || 'is about a response or a participation; none carries a count, a total or an answer; and '
            || 'no respondent is the actor of any of them', m_audit_submit),
        'the defect is reproduced before it is closed: the subject educator is enrolled nowhere, so the '
            || 'learner-shaped visibility predicate says nothing about them and the head of department '
            || 'who manages their class cannot read their person row at all -- and the governed read '
            || 'answers anyway, with the one educator who teaches that class and their own name. The id '
            || 'it returns is the id open_feedback_cycle accepts, proven by opening a cycle with it on a '
            || 'class that had none. The ACADEMIC residual is carried unchanged rather than worked '
            || 'around: the same contract names a subject for the professional-development class and '
            || 'opening still refuses that class by name, while the same subject is accepted on an '
            || 'ordinary one. Three educators over one class are three rows to a dean, each offered '
            || 'once, and a head of department who also teaches it is never offered their own round',
        format('%s refusals: a head of department of the neighbouring department, the institution''s '
            || 'administrator, a SYSTEM_ADMIN, the subject educator themselves, another educator and a '
            || 'learner of the class are each refused by the Management sentence -- authenticating is '
            || 'not discovery. Nobody the rule does not hold is offered, however senior. The answer is '
            || 'byte-identical before a single learner has spoken and after six sheets and a published '
            || 'snapshot, so it is not a participation oracle; it projects exactly the person and the '
            || 'name; and neither it nor the rule behind it reads an opportunity, a response or a '
            || 'result. AND IT GRANTS NOTHING: an educator listed a moment ago, whose assignment is '
            || 'then revoked, is refused by open_feedback_cycle on its own re-validation', m_subj_denied)
      ]) as t(tid, tarea, tdetail)
  loop
    id := r.tid; area := r.tarea;
    if v_fatal <> '' then
      ok := false;
      detail := 'the suite aborted before this test could report: ' || left(v_fatal, 200);
    elsif v_probs ? r.tid then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> r.tid),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> r.tid) x));
    else
      ok := true; detail := r.tdetail;
    end if;
    return next;
  end loop;

  id := 'F07-DONE'; area := 'suite'; ok := v_fatal = ''; 
  detail := case when v_fatal = '' then 'FABLE-07 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable07() from public;

-- ════════════════════════════════════ F07-C01: two connections, one learner
-- The suite above proves exactly-once against a RETRY -- the same connection
-- asking twice. That is not the same property as two connections asking at
-- once, and only one of them can be measured from a single session. So this
-- pair of helpers builds a committed cycle for run.ts to race two real psql
-- connections against, exactly as F02-C01 does for response receipts.
--
-- The world is built from nothing rather than borrowed from the seeds, so the
-- race does not depend on which personas a stack happens to carry.
create or replace function selftest.f07_concurrency_fixture()
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_inst uuid; v_period uuid; v_fac uuid; v_dep uuid; v_prog uuid; v_coh uuid; v_cls uuid;
  v_hod_u uuid; v_hod uuid; v_edu_u uuid; v_edu uuid; v_lrn_u uuid; v_lrn uuid;
  v_enr uuid; v_cycle uuid;
begin
  perform selftest.f07_concurrency_teardown();
  perform set_config('app.seed_intent', 'synthetic', true);
  insert into public.institutions (name, slug, is_synthetic, is_active)
  values ('selftest f07 conc', 'f07conc-' || substr(md5(random()::text), 1, 8), true, true)
  returning institutions.id into v_inst;
  insert into public.academic_periods (institution_id, name, starts_on, ends_on)
  values (v_inst, '2026/2027', current_date - 30, current_date + 300)
  returning academic_periods.id into v_period;
  insert into public.org_nodes (institution_id, parent_id, kind, name)
  values (v_inst, v_inst, 'FACULTY', 'F') returning org_nodes.id into v_fac;
  insert into public.org_nodes (institution_id, parent_id, kind, name)
  values (v_inst, v_fac, 'DEPARTMENT', 'D') returning org_nodes.id into v_dep;
  insert into public.org_nodes (institution_id, parent_id, kind, name)
  values (v_inst, v_dep, 'PROGRAMME', 'P') returning org_nodes.id into v_prog;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (v_inst, v_prog, 'COHORT', 'C', v_period) returning org_nodes.id into v_coh;
  insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id)
  values (v_inst, v_coh, 'CLASS', 'K', v_period) returning org_nodes.id into v_cls;

  v_hod_u := selftest.f07_user('f07-conc-kaprodi');
  v_edu_u := selftest.f07_user('f07-conc-guru');
  v_lrn_u := selftest.f07_user('f07-conc-murid');
  select a.person_id into v_hod from public.accounts a where a.auth_user_id = v_hod_u;
  select a.person_id into v_edu from public.accounts a where a.auth_user_id = v_edu_u;
  select a.person_id into v_lrn from public.accounts a where a.auth_user_id = v_lrn_u;
  insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
  values (v_hod, 'HEAD_OF_DEPARTMENT', v_dep, now() - interval '1 day', now() + interval '365 days'),
         (v_edu, 'EDUCATOR',           v_cls, now() - interval '1 day', now() + interval '365 days');
  insert into public.enrollments (person_id, institution_id, academic_period_id, status)
  values (v_lrn, v_inst, v_period, 'ACTIVE') returning enrollments.id into v_enr;
  insert into public.memberships (enrollment_id, node_id, academic_period_id)
  values (v_enr, v_cls, v_period);
  perform set_config('app.seed_intent', '', true);

  perform set_config('request.jwt.claims',
    json_build_object('sub', v_hod_u, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_hod_u::text, true);
  v_cycle := public.open_feedback_cycle(v_cls, v_edu);
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  return v_cycle::text || '|' || v_lrn_u::text;
end $$;
revoke all on function selftest.f07_concurrency_fixture() from public;

-- What the race is judged on: one consumed opportunity, one sheet of answers,
-- and a cycle that is still open and still honest about how many people spoke.
create or replace function selftest.f07_concurrency_verdict(p_cycle uuid)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare n_consumed int; n_rows int; n_questions int; v_set text;
begin
  select f.question_set_version into v_set from public.feedback_cycles f where f.id = p_cycle;
  select count(*) into n_consumed from public.feedback_opportunities o
   where o.cycle_id = p_cycle and o.consumed;
  select count(*) into n_rows from public.feedback_responses r where r.cycle_id = p_cycle;
  select count(*) into n_questions from public.feedback_questions q where q.set_version = v_set;
  if n_consumed <> 1 then
    return format('false|%s opportunity/ies consumed, expected exactly 1', n_consumed);
  end if;
  if n_rows <> n_questions then
    return format('false|%s answer row(s) for a %s-question sheet', n_rows, n_questions);
  end if;
  return format('true|exactly one opportunity consumed and exactly one sheet of %s answers survived',
                n_questions);
end $$;
revoke all on function selftest.f07_concurrency_verdict(uuid) from public;

-- The rows this fixture commits are real, so they are removed the way this
-- suite's other probe data is: guards off for the delete, on again straight
-- after. Nothing outside the probe institution is touched.
create or replace function selftest.f07_concurrency_teardown()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_inst uuid[];
begin
  select coalesce(array_agg(i.id), '{}') into v_inst
    from public.institutions i where i.slug like 'f07conc-%';
  if cardinality(v_inst) = 0 then return; end if;

  alter table public.feedback_results disable trigger feedback_results_immutable;
  alter table public.feedback_responses disable trigger feedback_responses_guard;
  alter table public.feedback_opportunities disable trigger feedback_opportunities_guard;
  alter table public.feedback_cycles disable trigger feedback_cycles_guard;
  alter table public.memberships disable trigger memberships_guard;
  alter table public.enrollments disable trigger enrollments_guard;
  alter table public.role_assignments disable trigger role_assignments_guard;
  alter table public.org_nodes disable trigger org_nodes_no_delete;
  alter table public.academic_periods disable trigger academic_periods_append_only;
  alter table public.institutions disable trigger institutions_no_delete;
  -- BOB-06: every school now carries PINTAR's standard report templates
  alter table public.report_templates disable trigger report_templates_guard;

  delete from public.feedback_results fr where fr.institution_id = any (v_inst);
  delete from public.feedback_responses fr where fr.institution_id = any (v_inst);
  delete from public.feedback_opportunities o using public.feedback_cycles c
   where o.cycle_id = c.id and c.institution_id = any (v_inst);
  delete from public.feedback_cycles c where c.institution_id = any (v_inst);
  delete from public.memberships m using public.enrollments e
   where m.enrollment_id = e.id and e.institution_id = any (v_inst);
  delete from public.enrollments e where e.institution_id = any (v_inst);
  delete from public.role_assignments ra where ra.institution_id = any (v_inst);
  delete from public.org_nodes n where n.institution_id = any (v_inst);
  delete from public.academic_periods ap where ap.institution_id = any (v_inst);
  delete from public.report_templates t where t.institution_id = any (v_inst);
  delete from public.institutions i where i.id = any (v_inst);

  alter table public.report_templates enable trigger report_templates_guard;
  alter table public.institutions enable trigger institutions_no_delete;
  alter table public.academic_periods enable trigger academic_periods_append_only;
  alter table public.org_nodes enable trigger org_nodes_no_delete;
  alter table public.role_assignments enable trigger role_assignments_guard;
  alter table public.enrollments enable trigger enrollments_guard;
  alter table public.memberships enable trigger memberships_guard;
  alter table public.feedback_cycles enable trigger feedback_cycles_guard;
  alter table public.feedback_opportunities enable trigger feedback_opportunities_guard;
  alter table public.feedback_responses enable trigger feedback_responses_guard;
  alter table public.feedback_results enable trigger feedback_results_immutable;
  -- The persons, accounts and auth users stay: audit_log names the head of
  -- department who opened the probe cycle, and an audit row is never deleted
  -- to tidy a test up. f07_user() returns the existing user on the next run.
end $$;
revoke all on function selftest.f07_concurrency_teardown() from public;
