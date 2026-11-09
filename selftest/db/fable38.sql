-- FABLE-38 · PINTAR 4.0 completion (owner, 9 Nov): the approved Action & Consequence gaps and the remaining lifecycle.
--
--   F38-W01  W2.21 «Akhiri penugasan»: who may, and what the preview shows. Kelas A's Guru reads the preview: the learner
--            who finished, the learner with a sitting open (by name) and the learner who never started; B's Guru, a
--            learner and another school's admin are refused ASSIGN_NOT_ALLOWED.
--   F38-W02  W2.21: refusals write nothing. An unknown kind, a reason under 5 characters, and a learner's open sitting
--            without the confirmation (ASSIGN_IN_PROGRESS); B's Guru. The assignment stays ACTIVE, its assessments open,
--            the open sitting open, and no audit row is written.
--   F38-W03  W2.21: ended on the record. With the confirmation: the assignment is ENDED and its assessments CLOSED; the
--            finished sitting and its result are unchanged; the open sitting is TERMINATED as ADMINISTRATIVE_TERMINATION
--            with the reason, its answers kept and its audit row; the one past its deadline EXPIRES; one
--            learning_assignment.ended row with the counts; a learner who never started may not start; the lesson
--            package's release keeps its status (withdrawal is not unpublishing).
--   F38-W04  W2.21: a second press changes nothing (ASSIGN_NOT_LIVE, no second row), and the lesson can be given to the
--            class again (ASSIGN_EXISTS no longer refuses); a withdrawal is recorded as learning_assignment.withdrawn.
--   F38-W05  W2.21: a lesson PINTAR no longer shares can still be ended (found by PENUGASAN-A01 on 9 Nov): an ACTIVE
--            assignment of canonical content whose distribution to the school was WITHDRAWN is ended by the class's
--            Guru, its assessment CLOSED; it still cannot be made ACTIVE again or opened.
--
-- EVERY ROW IS ROLLED BACK (the suite's block ends in 'f38-rollback', as fable37 does).

create schema if not exists selftest;

do $$
begin
  if to_regprocedure('selftest.f37_sebagai(uuid,text)') is null or to_regprocedure('selftest.f35_bab(uuid,text,text,text)') is null
     or to_regprocedure('selftest.f36_sit(uuid,uuid,uuid,uuid,numeric,text,timestamptz,uuid,boolean,jsonb,integer)') is null then
    raise exception 'apply fable11, fable35, fable36 and fable37.sql before fable38.sql: the helpers are missing';
  end if;
end $$;

-- a sitting of this suite's own, open, tied to one learning assignment and one of its assessment assignments
create or replace function selftest.f38_buka(p_tpl uuid, p_person uuid, p_enrol uuid, p_class uuid, p_la uuid, p_aa uuid)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v uuid;
begin
  insert into public.assessment_sessions
    (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, plp_release_id,
     assessment_definition_id, assessment_definition_version, engine_version, scoring_policy_version, evidence_channel,
     evidence_class, mode, status, shuffle_seed, started_at, deadline_extended_count)
  select gen_random_uuid(), p_person, x.institution_id, p_enrol, x.academic_period_id, p_class,
         (select la.plp_release_id from public.learning_assignments la where la.id = p_la), aa.assessment_definition_id,
         1, x.engine_version, x.scoring_policy_version, x.evidence_channel, x.evidence_class,
         d.mode, 'CREATED', x.shuffle_seed, now(), 0
    from public.assessment_sessions x, public.assessment_assignments aa
    join public.assessment_definitions d on d.id = aa.assessment_definition_id
   where x.id = p_tpl and aa.id = p_aa returning assessment_sessions.id into v;
  set local session_replication_role = replica;
  update public.assessment_sessions set learning_assignment_id = p_la, assessment_assignment_id = p_aa where id = v;
  set local session_replication_role = origin;
  return v;
end $$;
revoke all on function selftest.f38_buka(uuid, uuid, uuid, uuid, uuid, uuid) from public;

create or replace function selftest.run_fable38()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_tag text := to_char(clock_timestamp(), 'HH24MISSUS'); v_fatal text := '';
  w01 text[] := '{}'; w02 text[] := '{}'; w03 text[] := '{}'; w04 text[] := '{}'; w05 text[] := '{}';
  v_crel uuid; v_cdef uuid; v_dist uuid; v_la3 uuid; v_aa3 uuid;
  v_tpl uuid; v_inst uuid; v_root uuid; v_period uuid; v_fac uuid; v_dep uuid; v_prog uuid; v_coh uuid; c_a uuid; c_b uuid;
  v_def uuid; v_rel uuid; v_la uuid; v_aa uuid; v_la2 uuid;
  u_guru_a uuid; u_guru_b uuid; u_murid uuid; u_adminx uuid; v_x uuid;
  p_selesai uuid; s_selesai uuid; p_buka uuid; e_buka uuid; s_buka uuid; p_lewat uuid; e_lewat uuid; s_lewat uuid;
  p_belum uuid; e_belum uuid; v_relst text; v_got text; v_pv jsonb; v_aud int; v_res int; v_resp int; r record;
begin
  perform selftest.as_owner();
  begin
    select s.id, s.institution_id into v_tpl, v_inst
      from public.assessment_sessions s join public.assessment_results res on res.session_id = s.id
     where s.mode = 'POST_TEST' and s.status = 'FINALIZED' and s.class_node_id is not null and s.pass_mark is not null
       and not public.release_is_professional(s.plp_release_id)
     order by s.finalized_at desc limit 1;
    if v_tpl is null then raise exception 'the fixture has no finished Uji Penguasaan'; end if;
    select o.id into v_root from public.org_nodes o where o.institution_id = v_inst and o.kind = 'INSTITUTION';
    select ap.id into v_period from public.academic_periods ap where ap.institution_id = v_inst order by ap.created_at limit 1;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_root, 'FACULTY', 'Bagian F38 ' || v_tag) returning org_nodes.id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_fac, 'DEPARTMENT', 'Departemen F38 ' || v_tag) returning org_nodes.id into v_dep;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_dep, 'PROGRAMME', 'Program F38 ' || v_tag) returning org_nodes.id into v_prog;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_prog, 'COHORT', 'Angkatan F38 ' || v_tag, v_period) returning org_nodes.id into v_coh;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_coh, 'CLASS', 'Kelas F38 A ' || v_tag, v_period) returning org_nodes.id into c_a;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_coh, 'CLASS', 'Kelas F38 B ' || v_tag, v_period) returning org_nodes.id into c_b;

    -- the lesson given to Kelas A: its learning assignment ACTIVE and one assessment assignment OPEN, as assign_release
    -- leaves them (written past the triggers: the suite's chapter has no school pass mark of its own)
    v_def := selftest.f35_bab(v_inst, 'F38 ' || v_tag, 'W1', 'Tujuan F38 ' || v_tag);
    select r1.id into v_rel from public.plp_releases r1 join public.assessment_definitions d on d.course_id = r1.course_id where d.id = v_def;
    set local session_replication_role = replica;
    insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id, status, assigned_at)
    select v_inst, x.id, x.course_id, c_a, v_period, 'ACTIVE', now() from public.plp_releases x where x.id = v_rel
    returning learning_assignments.id into v_la;
    insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id,
      academic_period_id, opens_at, status, assigned_at)
    values (v_inst, v_def, v_la, c_a, v_period, now() - interval '1 day', 'OPEN', now()) returning assessment_assignments.id into v_aa;
    set local session_replication_role = origin;

    u_guru_a := selftest.f11_user('f38-guru-a-' || v_tag || '@local.invalid', 'EDUCATOR', c_a);
    u_guru_b := selftest.f11_user('f38-guru-b-' || v_tag || '@local.invalid', 'EDUCATOR', c_b);
    -- another school, with its own admin
    insert into public.institutions (name, slug, is_synthetic, is_active) values ('Sekolah F38 X ' || v_tag, 'f38-x-' || v_tag, true, true)
    returning institutions.id into v_x;
    u_adminx := selftest.f11_user('f38-admin-x-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN',
                                  (select o.id from public.org_nodes o where o.institution_id = v_x and o.kind = 'INSTITUTION'));

    -- four learners of Kelas A: one finished, one with a sitting open, one whose sitting is past its deadline, one never started
    select x.person, x.session into p_selesai, s_selesai
      from selftest.f36_sit(v_tpl, null, c_a, v_def, 0.80, 'W1', now() - interval '2 hours') x;
    set local session_replication_role = replica;
    update public.assessment_sessions set learning_assignment_id = v_la, assessment_assignment_id = v_aa where assessment_sessions.id = s_selesai;
    set local session_replication_role = origin;
    insert into public.persons (display_name) values ('Murid F38 Buka ' || v_tag) returning persons.id into p_buka;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (p_buka, v_inst, v_period, v_prog, 'ACTIVE') returning enrollments.id into e_buka;
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (e_buka, c_a, v_period);
    s_buka := selftest.f38_buka(v_tpl, p_buka, e_buka, c_a, v_la, v_aa);
    insert into public.persons (display_name) values ('Murid F38 Lewat ' || v_tag) returning persons.id into p_lewat;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (p_lewat, v_inst, v_period, v_prog, 'ACTIVE') returning enrollments.id into e_lewat;
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (e_lewat, c_a, v_period);
    s_lewat := selftest.f38_buka(v_tpl, p_lewat, e_lewat, c_a, v_la, v_aa);
    set local session_replication_role = replica;
    update public.assessment_sessions set authoritative_deadline = now() - interval '1 day' where assessment_sessions.id = s_lewat;
    set local session_replication_role = origin;
    u_murid := selftest.f11_user('f38-murid-' || v_tag || '@local.invalid', null, null);
    select a.person_id into p_belum from public.accounts a where a.auth_user_id = u_murid;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (p_belum, v_inst, v_period, v_prog, 'ACTIVE') returning enrollments.id into e_belum;
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (e_belum, c_a, v_period);
    select count(*) into v_resp from public.responses rr where rr.session_id = s_buka;

    -- ═══════════════════════════════════ F38-W01 who may, and the preview
    perform selftest.as_user_uid(u_guru_a);
    begin
      v_pv := public.akhiri_penugasan_pratinjau(v_la);
    exception when others then w01 := w01 || ('Kelas A''s Guru was refused the preview: ' || sqlerrm); end;
    perform selftest.as_owner();
    if v_pv is not null then
      if (v_pv ->> 'selesai')::int <> 1 then w01 := w01 || ('finished learners: ' || (v_pv ->> 'selesai') || ' (expected 1)'); end if;
      if jsonb_array_length(v_pv -> 'berjalan') <> 2
         or not (v_pv -> 'berjalan') @> jsonb_build_array(jsonb_build_object('person_id', p_buka)) then
        w01 := w01 || ('learners with a sitting open: ' || (v_pv -> 'berjalan')::text || ' (expected the two by name)'); end if;
      if (v_pv ->> 'belum_mulai')::int <> 1 then w01 := w01 || ('learners not started: ' || (v_pv ->> 'belum_mulai') || ' (expected 1)'); end if;
    end if;
    for r in select * from (values (u_guru_b, 'B''s Guru'), (u_murid, 'a learner'), (u_adminx, 'another school''s admin')) t(uid, who) loop
      v_got := selftest.f37_sebagai(r.uid, format('select public.akhiri_penugasan_pratinjau(%L)', v_la));
      if v_got <> 'PR050:ASSIGN_NOT_ALLOWED' then w01 := w01 || (r.who || ' reading the preview: ' || v_got || ' (expected PR050:ASSIGN_NOT_ALLOWED)'); end if;
    end loop;

    -- ═══════════════════════════════════ F38-W02 refusals write nothing
    select count(*) into v_aud from public.audit_log a where a.target_id in (v_la::text, s_buka::text, s_lewat::text);
    for r in select * from (values
        (u_guru_a, 'PAUSED', 'Materi sudah selesai', true, 'PR050:ASSIGN_KIND_INVALID', 'an unknown kind'),
        (u_guru_a, 'ENDED', 'oke', true, 'PR050:ASSIGN_REASON_REQUIRED', 'a reason of 3 characters'),
        (u_guru_a, 'ENDED', 'Materi sudah selesai', false, 'PR050:ASSIGN_IN_PROGRESS', 'open sittings without the confirmation'),
        (u_guru_b, 'ENDED', 'Materi sudah selesai', true, 'PR050:ASSIGN_NOT_ALLOWED', 'B''s Guru'),
        (u_adminx, 'WITHDRAWN', 'Materi sudah selesai', true, 'PR050:ASSIGN_NOT_ALLOWED', 'another school''s admin')) t(uid, jenis, alasan, konf, want, who) loop
      v_got := selftest.f37_sebagai(r.uid, format('select public.akhiri_penugasan(%L, %L, %L, %L)', v_la, r.jenis, r.alasan, r.konf));
      if v_got <> r.want then w02 := w02 || (r.who || ': ' || v_got || ' (expected ' || r.want || ')'); end if;
    end loop;
    if (select la.status::text from public.learning_assignments la where la.id = v_la) <> 'ACTIVE' then w02 := w02 || 'a refusal changed the assignment'::text; end if;
    if (select aa.status::text from public.assessment_assignments aa where aa.id = v_aa) <> 'OPEN' then w02 := w02 || 'a refusal closed the assessment'::text; end if;
    if (select s.status::text from public.assessment_sessions s where s.id = s_buka) <> 'CREATED' then w02 := w02 || 'a refusal ended the open sitting'::text; end if;
    if (select count(*) from public.audit_log a where a.target_id in (v_la::text, s_buka::text, s_lewat::text)) <> v_aud then
      w02 := w02 || 'a refusal wrote an audit row'::text; end if;

    -- ═══════════════════════════════════ F38-W03 ended on the record
    select count(*) into v_res from public.assessment_results x where x.session_id = s_selesai;
    select pr.status::text into v_relst from public.plp_releases pr where pr.id = v_rel;
    v_got := selftest.f37_sebagai(u_guru_a, format('select public.akhiri_penugasan(%L, %L, %L, %L)', v_la, 'ENDED', 'Bab ini sudah selesai dibahas', true));
    if v_got <> 'OK' then w03 := w03 || ('Kelas A''s Guru could not end the assignment: ' || v_got);
    else
      if (select la.status::text from public.learning_assignments la where la.id = v_la) <> 'ENDED' then w03 := w03 || 'the assignment is not ENDED'::text; end if;
      if (select aa.status::text from public.assessment_assignments aa where aa.id = v_aa) <> 'CLOSED' then w03 := w03 || 'its assessment is not CLOSED'::text; end if;
      if (select s.status::text from public.assessment_sessions s where s.id = s_selesai) <> 'FINALIZED'
         or (select count(*) from public.assessment_results x where x.session_id = s_selesai) <> v_res then
        w03 := w03 || 'the finished sitting or its result changed'::text; end if;
      if (select s.status::text || '/' || coalesce(s.termination_cause::text, '') || '/' || coalesce(s.termination_reason, '')
            from public.assessment_sessions s where s.id = s_buka) <> 'TERMINATED/ADMINISTRATIVE_TERMINATION/Bab ini sudah selesai dibahas' then
        w03 := w03 || ('the open sitting: ' || (select s.status::text || '/' || coalesce(s.termination_cause::text, '') from public.assessment_sessions s where s.id = s_buka)
                       || ' (expected TERMINATED/ADMINISTRATIVE_TERMINATION with the reason)'); end if;
      if (select count(*) from public.responses rr where rr.session_id = s_buka) <> v_resp then w03 := w03 || 'the open sitting lost answers'::text; end if;
      if not exists (select 1 from public.audit_log a where a.action = 'assessment_session.terminated' and a.target_id = s_buka::text
                       and a.summary ->> 'cause' = 'ADMINISTRATIVE_TERMINATION') then w03 := w03 || 'the ended sitting has no audit row'::text; end if;
      if (select s.status::text from public.assessment_sessions s where s.id = s_lewat) <> 'EXPIRED' then
        w03 := w03 || 'the sitting past its deadline did not expire'::text; end if;
      if (select count(*) from public.audit_log a where a.action = 'learning_assignment.ended' and a.target_id = v_la::text
            and a.summary ->> 'reason' = 'Bab ini sudah selesai dibahas' and (a.summary ->> 'learners_finished')::int = 1
            and (a.summary ->> 'sittings_ended')::int = 1 and (a.summary ->> 'sittings_expired')::int = 1) <> 1 then
        w03 := w03 || 'no single learning_assignment.ended row with the reason and the counts'::text; end if;
      v_got := selftest.f37_sebagai(u_murid, format('select 1 / (case when (select m.ok from public.may_start_assessment(%L) m) then 0 else 1 end)', v_aa));
      if v_got <> 'OK' then w03 := w03 || ('the learner who never started may still start: ' || v_got); end if;
      if (select pr.status::text from public.plp_releases pr where pr.id = v_rel) is distinct from v_relst then w03 := w03 || 'the lesson package''s release changed status'::text; end if;
    end if;

    -- ═══════════════════════════════════ F38-W04 a second press; the lesson can be given again; a withdrawal
    select count(*) into v_aud from public.audit_log a where a.target_id = v_la::text;
    v_got := selftest.f37_sebagai(u_guru_a, format('select public.akhiri_penugasan(%L, %L, %L, %L)', v_la, 'ENDED', 'Bab ini sudah selesai dibahas', true));
    if v_got <> 'PR050:ASSIGN_NOT_LIVE' then w04 := w04 || ('a second press: ' || v_got || ' (expected PR050:ASSIGN_NOT_LIVE)'); end if;
    if (select count(*) from public.audit_log a where a.target_id = v_la::text) <> v_aud then w04 := w04 || 'the second press wrote an audit row'::text; end if;
    v_got := selftest.f37_sebagai(u_guru_a, format('select public.assign_release(%L, %L, null, null)', v_rel, c_a));
    if v_got like '%ASSIGN_EXISTS%' then w04 := w04 || 'giving the lesson again is still refused ASSIGN_EXISTS'::text; end if;
    set local session_replication_role = replica;
    insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id, status, assigned_at)
    select v_inst, x.id, x.course_id, c_b, v_period, 'ACTIVE', now() from public.plp_releases x where x.id = v_rel
    returning learning_assignments.id into v_la2;
    set local session_replication_role = origin;
    v_got := selftest.f37_sebagai(u_guru_b, format('select public.akhiri_penugasan(%L, %L, %L, %L)', v_la2, 'WITHDRAWN', 'Salah kelas, bukan untuk B', false));
    if v_got <> 'OK' then w04 := w04 || ('B''s Guru could not withdraw B''s assignment: ' || v_got);
    elsif (select la.status::text from public.learning_assignments la where la.id = v_la2) <> 'WITHDRAWN'
       or not exists (select 1 from public.audit_log a where a.action = 'learning_assignment.withdrawn' and a.target_id = v_la2::text) then
      w04 := w04 || 'the withdrawal is not WITHDRAWN on the record'::text; end if;

    -- ═══════════════════════════════════ F38-W05 a lesson PINTAR no longer shares can still be ended
    -- a canonical lesson and its Cek penguasaan, both PINTAR's (the definition rides the release's distribution)
    select cr.id, cd.id into v_crel, v_cdef
      from public.assessment_definitions cd join public.institutions co on co.id = cd.institution_id and co.tenant_kind = 'PLATFORM_CANONICAL'
      join public.plp_releases cr on cr.institution_id = co.id and cr.status = 'PUBLISHED'
       and cr.course_id = coalesce(cd.course_id, (select mm.course_id from public.modules mm where mm.id = cd.module_id))
     where cd.mode = 'POST_TEST' order by cr.created_at limit 1;
    if v_crel is null then raise exception 'the fixture has no published canonical lesson with a Cek penguasaan'; end if;
    update public.release_distributions rd set status = 'WITHDRAWN', withdrawn_at = now(), withdrawn_by_person_id = rd.authorized_by_person_id
     where rd.plp_release_id = v_crel and rd.institution_id = v_inst and rd.status = 'ACTIVE';
    insert into public.release_distributions (plp_release_id, institution_id, status, authorized_by_person_id)
    values (v_crel, v_inst, 'ACTIVE', p_selesai) returning release_distributions.id into v_dist;
    set local session_replication_role = replica;
    insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id, status, assigned_at)
    select v_inst, x.id, x.course_id, c_a, v_period, 'ACTIVE', now() from public.plp_releases x where x.id = v_crel
    returning learning_assignments.id into v_la3;
    insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id,
      academic_period_id, opens_at, status, assigned_at)
    values (v_inst, v_cdef, v_la3, c_a, v_period, now() - interval '1 day', 'OPEN', now()) returning assessment_assignments.id into v_aa3;
    set local session_replication_role = origin;
    -- PINTAR stops sharing the lesson with the school
    update public.release_distributions set status = 'WITHDRAWN', withdrawn_at = now(), withdrawn_by_person_id = p_selesai, reason = 'uji F38-W05'
     where release_distributions.id = v_dist;
    v_got := selftest.f37_sebagai(u_guru_a, format('select public.akhiri_penugasan(%L, %L, %L, %L)', v_la3, 'ENDED', 'PINTAR tidak lagi membagikan bab ini', false));
    if v_got <> 'OK' then w05 := w05 || ('the Guru could not end an assignment of a lesson no longer shared: ' || v_got);
    elsif (select la.status::text || '/' || aa.status::text from public.learning_assignments la, public.assessment_assignments aa
            where la.id = v_la3 and aa.id = v_aa3) <> 'ENDED/CLOSED' then
      w05 := w05 || 'the assignment of a lesson no longer shared is not ENDED with its assessment CLOSED'::text;
    end if;
    -- and nothing re-opens it: closing needs no licence to teach, opening still does
    v_got := selftest.f37_sebagai(u_guru_a, format('update public.assessment_assignments set status = %L where id = %L', 'OPEN', v_aa3));
    if v_got = 'OK' then w05 := w05 || 'a closed assessment of a lesson no longer shared was opened again'::text; end if;

    raise exception 'f38-rollback';
  exception when others then
    if sqlerrm <> 'f38-rollback' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in select * from (values
      ('F38-W01', 'W2.21 «Akhiri penugasan»: who may, and what the preview shows', w01,
       'Kelas A''s Guru reads the preview (1 finished, the 2 open sittings by name, 1 not started); B''s Guru, a learner and another school''s admin are refused ASSIGN_NOT_ALLOWED'),
      ('F38-W02', 'W2.21: refusals write nothing', w02,
       'an unknown kind, a 3-character reason, open sittings without the confirmation (ASSIGN_IN_PROGRESS), B''s Guru and another school''s admin are refused; the assignment stays ACTIVE, the assessment OPEN, the sitting open, no audit row'),
      ('F38-W03', 'W2.21: ended on the record', w03,
       'ENDED, its assessment CLOSED; the finished sitting and result unchanged; the open sitting TERMINATED as ADMINISTRATIVE_TERMINATION with the reason, answers kept, audited; the one past its deadline EXPIRED; one learning_assignment.ended row with the counts; no new start; the release''s status unchanged'),
      ('F38-W04', 'W2.21: a second press, giving it again, a withdrawal', w04,
       'a second press is refused ASSIGN_NOT_LIVE with no row; assign_release no longer refuses ASSIGN_EXISTS; B''s Guru withdraws B''s assignment, recorded as learning_assignment.withdrawn'),
      ('F38-W05', 'W2.21: a lesson PINTAR no longer shares can still be ended', w05,
       'an ACTIVE assignment of canonical content whose distribution was WITHDRAWN is ended by the class''s Guru, its assessment CLOSED; the closed assessment cannot be opened again')) t(tid, tarea, probs, good) loop
    id := r.tid; area := r.tarea;
    ok := v_fatal = '' and cardinality(r.probs) = 0;
    detail := case when v_fatal <> '' then 'fixture: ' || v_fatal when ok then r.good else array_to_string(r.probs, '; ') end;
    return next;
  end loop;
  id := 'F38-DONE'; area := 'fable38'; ok := true; detail := 'complete'; return next;
end $$;
revoke all on function selftest.run_fable38() from public;
