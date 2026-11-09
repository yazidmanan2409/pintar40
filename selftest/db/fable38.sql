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
--   F38-R01  Evidence survives the year (owner, 9 Nov): Kelas A moves up through «Kenaikan kelas dan kelulusan». The
--            learner's finished sitting, its result, its issued certificate and lesson progress are unchanged and still
--            read by the learner (row security and my_certificate) and by the old class's Guru; the certificate's public
--            check still answers BERLAKU; the sitting stays on the old class and the old (ENDED/EXPIRED) enrolment.
--   F38-C01  W2.22 «Terbitkan ulang»: who may, and what the preview shows. The school's admin reads the name, school
--            and course sealed beside those read now (the holder's name corrected since); a Guru, the holder and
--            another school's admin are refused CERT_NOT_ALLOWED.
--   F38-C02  W2.22: refusals write nothing. A reason under 10 characters, a certificate whose name, school and course
--            are unchanged (CERT_NOTHING_CHANGED), a revoked certificate (CERT_NOT_ISSUED), a Guru and another school's
--            admin; no certificate is added and the original stays ISSUED.
--   F38-C03  W2.22: corrected by its replacement. The admin prepares the replacement (ELIGIBLE, not public: a new number
--            from the holder's sequence, a new token, the corrected name, the original's result, the reason and the
--            actor); a second press returns the same one; sealed by the server, the replacement is ISSUED and the
--            original SUPERSEDED with its payload, snapshot, number and token unchanged; the public check answers
--            BERLAKU and DIGANTIKAN; one certificate.superseded row names the reason, the actor and the replacement.
--   F38-C04  W2.22: one replacement per certificate. A superseded certificate cannot be corrected or revoked again; a
--            second prepared replacement of it cannot be sealed; the replacement itself can be revoked.
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

-- an ISSUED certificate of this suite's own for one finished sitting, as certificate_prepare and certificate_seal leave
-- it (the suite's chapter has no school pass mark, so eligibility is not asked; the shape is the real one)
create or replace function selftest.f38_sertifikat(p_session uuid)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_s public.assessment_sessions; v_p public.persons; v_snap uuid; v_id uuid; v_num text; v_tok text; v_iso text;
begin
  select * into v_s from public.assessment_sessions where id = p_session;
  select * into v_p from public.persons where id = v_s.person_id;
  insert into public.certificate_identity_snapshots (person_id, institution_id, name_as_issued, snapshot_hash)
  values (v_p.id, v_s.institution_id, v_p.display_name, md5(v_p.display_name)) returning id into v_snap;
  v_num := coalesce(v_p.pintar_id, 'F38') || '/' || lpad((floor(random() * 90000) + 10000)::int::text, 5, '0') || left(md5(p_session::text), 4);
  v_tok := replace(replace(replace(encode(extensions.gen_random_bytes(32), 'base64'), '+', '-'), '/', '_'), '=', '');
  v_iso := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  insert into public.certificates (session_id, person_id, institution_id, snapshot_id, certificate_number, verification_token,
    status, issued_at_iso, canonical_payload, institution_as_issued, course_subject_as_issued, course_title_as_issued, language_as_issued)
  select v_s.id, v_p.id, v_s.institution_id, v_snap, v_num, v_tok, 'ELIGIBLE', v_iso,
         jsonb_build_object('certificate_number', v_num, 'identity_snapshot_hash', md5(v_p.display_name),
           'result', jsonb_build_object('score', 0.8, 'predikat', 'Baik', 'passed', true, 'safety_gate', true),
           'issued_at', v_iso, 'plp_release_id', v_s.plp_release_id, 'release_content_sha256', null,
           'assessment_definition_id', v_s.assessment_definition_id, 'assessment_definition_version', 1,
           'scoring_policy_version', v_s.scoring_policy_version, 'key_version', 1),
         i.name, co.subject, co.title, 'id'
    from public.institutions i, public.plp_releases r join public.courses co on co.id = r.course_id
   where i.id = v_s.institution_id and r.id = v_s.plp_release_id
  returning certificates.id into v_id;
  perform public.certificate_seal(v_id, 1::smallint, repeat('s', 43));
  return v_id;
end $$;
revoke all on function selftest.f38_sertifikat(uuid) from public;

create or replace function selftest.run_fable38()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_tag text := to_char(clock_timestamp(), 'HH24MISSUS'); v_fatal text := '';
  w01 text[] := '{}'; w02 text[] := '{}'; w03 text[] := '{}'; w04 text[] := '{}'; w05 text[] := '{}'; r01 text[] := '{}'; v_next uuid; v_coh6 uuid; c_6 uuid; s_r uuid; v_cr uuid; v_crtok text; v_res_r int; v_lp int; v_dec jsonb; c01 text[] := '{}'; c02 text[] := '{}'; c03 text[] := '{}'; c04 text[] := '{}';
  u_admin uuid; v_n int; v_cert uuid; v_cert2 uuid; v_new uuid; v_new2 uuid; v_tok text; v_ntok text; v_payload jsonb; v_nomor text; v_snapold uuid; p_holder uuid; u_holder uuid; v_k record;
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


    -- ═══════════════════════════════════ F38-R01 evidence survives the year
    u_admin := selftest.f11_user('f38-admin-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_root);
    -- the learner who never started finishes a sitting now, with a result, a certificate and lesson progress
    select x.session into s_r from selftest.f36_sit(v_tpl, p_belum, c_a, v_def, 0.85, 'W1', now() - interval '30 minutes') x;
    v_cr := selftest.f38_sertifikat(s_r);
    select c.verification_token into v_crtok from public.certificates c where c.id = v_cr;
    insert into public.lesson_progress (person_id, lesson_id, plp_release_id, institution_id, furthest_position, total_positions)
    select p_belum, l.id, v_rel, v_inst, 3, 4 from public.plp_releases pr join public.modules m on m.course_id = pr.course_id
      join public.lessons l on l.module_id = m.id where pr.id = v_rel order by l.id limit 1;
    select count(*) into v_res_r from public.assessment_results x where x.session_id = s_r;
    select count(*) into v_lp from public.lesson_progress x where x.person_id = p_belum;
    -- next year, and Kelas A moves up whole into its Kelas 6
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, 'F38R ' || v_tag, (select ap.ends_on + 1 from public.academic_periods ap where ap.id = v_period),
            (select ap.ends_on + 366 from public.academic_periods ap where ap.id = v_period)) returning academic_periods.id into v_next;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_prog, 'COHORT', 'Tingkat F38 6 ' || v_tag, v_next) returning org_nodes.id into v_coh6;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_coh6, 'CLASS', 'Kelas F38 6 ' || v_tag, v_next) returning org_nodes.id into c_6;
    perform selftest.as_user_uid(u_admin);
    select jsonb_agg(jsonb_build_object('person_id', b.person_id, 'keputusan', 'NAIK', 'kelas_tujuan', c_6))
      into v_dec from (select (pl ->> 'person_id') as person_id from jsonb_array_elements(public.kenaikan_rencana(c_a) -> 'murid') pl) b;
    perform selftest.as_owner();
    v_got := selftest.f37_sebagai(u_admin, format('select public.kenaikan_tetapkan(%L, %L, %L::jsonb, true, true)', c_a, v_next, v_dec));
    if v_got <> 'OK' then r01 := r01 || ('Kelas A could not move up: ' || v_got);
    else
      if not exists (select 1 from public.enrollments en join public.memberships mb on mb.enrollment_id = en.id and mb.valid_to is null
                      where en.person_id = p_belum and en.academic_period_id = v_next and mb.node_id = c_6) then
        r01 := r01 || 'the learner is not in Kelas 6 next year'::text; end if;
      if (select s.class_node_id::text || '/' || e2.status::text || '/' || coalesce(e2.end_reason::text, '')
            from public.assessment_sessions s join public.enrollments e2 on e2.id = s.enrollment_id where s.id = s_r)
         <> c_a::text || '/ENDED/EXPIRED' then
        r01 := r01 || 'the sitting no longer stays on the old class and the old year''s ended enrolment'::text; end if;
      if (select count(*) from public.assessment_results x where x.session_id = s_r) <> v_res_r
         or (select count(*) from public.lesson_progress x where x.person_id = p_belum) <> v_lp
         or (select c.status::text from public.certificates c where c.id = v_cr) <> 'ISSUED' then
        r01 := r01 || 'the result, the lesson progress or the certificate changed'::text; end if;
      -- what the learner reads of their own past year, through row security and their own certificate read
      v_got := selftest.f37_sebagai(u_murid, format('select 1 / (case when (select count(*) from public.assessment_sessions s where s.id = %L) = 1
          and (select count(*) from public.assessment_results x where x.session_id = %L) = %s
          and (select count(*) from public.certificates c where c.id = %L) = 1
          and (select count(*) from public.lesson_progress x where x.person_id = %L) = %s
          and (select count(*) from public.my_certificate(%L)) = 1 then 1 else 0 end)', s_r, s_r, v_res_r, v_cr, p_belum, v_lp, s_r));
      if v_got <> 'OK' then r01 := r01 || ('the learner no longer reads their own sitting, result, certificate or lesson progress: ' || v_got); end if;
      -- the old class's Guru still reads the sitting and its result where it was given
      v_got := selftest.f37_sebagai(u_guru_a, format('select 1 / (case when (select count(*) from public.assessment_sessions s where s.id = %L) = 1
          and (select count(*) from public.assessment_results x where x.session_id = %L) = %s then 1 else 0 end)', s_r, s_r, v_res_r));
      if v_got <> 'OK' then r01 := r01 || ('the old class''s Guru no longer reads the sitting and its result: ' || v_got); end if;
      if (select v.validity from public.verify_certificate(v_crtok) v) is distinct from 'BERLAKU' then
        r01 := r01 || 'the certificate''s public check no longer answers BERLAKU'::text; end if;
    end if;
    -- ═══════════════════════════════════ F38-C01..C04 an erroneous certificate is corrected by its replacement
    u_holder := selftest.f11_user('f38-holder-' || v_tag || '@local.invalid', null, null);
    select a.person_id into p_holder from public.accounts a where a.auth_user_id = u_holder;
    -- the holder's own sitting: the finished one above, given to the holder
    set local session_replication_role = replica;
    update public.assessment_sessions set person_id = p_holder where assessment_sessions.id = s_selesai;
    update public.persons set display_name = 'Murid F38 Salah Ketik ' || v_tag where persons.id = p_holder;
    set local session_replication_role = origin;
    v_cert := selftest.f38_sertifikat(s_selesai);
    select c.verification_token, c.canonical_payload, c.certificate_number, c.snapshot_id into v_tok, v_payload, v_nomor, v_snapold
      from public.certificates c where c.id = v_cert;
    -- a second sitting and certificate whose name is right, for «nothing changed» and the revoked case
    v_cert2 := selftest.f38_sertifikat((select x.session from selftest.f36_sit(v_tpl, null, c_a, v_def, 0.90, 'W1', now() - interval '1 hour') x));
    -- the holder's name is corrected afterwards (as correct_person_name does), so the first certificate is now wrong
    set local session_replication_role = replica;
    update public.persons set display_name = 'Murid F38 Benar ' || v_tag where persons.id = p_holder;
    set local session_replication_role = origin;

    -- C01 who may, and the preview
    v_pv := null;
    perform selftest.as_user_uid(u_admin);
    begin
      v_pv := public.sertifikat_koreksi_pratinjau(v_cert);
    exception when others then c01 := c01 || ('the school''s admin was refused the preview: ' || sqlerrm); end;
    perform selftest.as_owner();
    if v_pv is not null and not (v_pv ->> 'nama_tercetak' = 'Murid F38 Salah Ketik ' || v_tag and v_pv ->> 'nama_kini' = 'Murid F38 Benar ' || v_tag
                                 and (v_pv ->> 'berubah')::boolean and v_pv ->> 'status' = 'ISSUED') then
      c01 := c01 || ('the preview: ' || v_pv::text); end if;
    for r in select * from (values (u_guru_a, 'the Guru'), (u_holder, 'the holder'), (u_adminx, 'another school''s admin')) t(uid, who) loop
      v_got := selftest.f37_sebagai(r.uid, format('select public.sertifikat_koreksi_pratinjau(%L)', v_cert));
      if v_got <> 'PR120:CERT_NOT_ALLOWED' then c01 := c01 || (r.who || ' reading the preview: ' || v_got || ' (expected PR120:CERT_NOT_ALLOWED)'); end if;
    end loop;

    -- C02 refusals write nothing
    select count(*) into v_n from public.certificates c where c.session_id in (s_selesai, (select c2.session_id from public.certificates c2 where c2.id = v_cert2));
    for r in select * from (values
        (u_admin, v_cert, 'salah', 'PR120:CERT_REASON_REQUIRED', 'a reason of 5 characters'),
        (u_admin, v_cert2, 'nama sudah benar sejak awal', 'PR120:CERT_NOTHING_CHANGED', 'a certificate with nothing to correct'),
        (u_guru_a, v_cert, 'nama murid salah ketik', 'PR120:CERT_NOT_ALLOWED', 'the Guru'),
        (u_adminx, v_cert, 'nama murid salah ketik', 'PR120:CERT_NOT_ALLOWED', 'another school''s admin')) t(uid, cid, alasan, want, who) loop
      v_got := selftest.f37_sebagai(r.uid, format('select * from public.sertifikat_koreksi_siapkan(%L, %L, 1::smallint)', r.cid, r.alasan));
      if v_got <> r.want then c02 := c02 || (r.who || ': ' || v_got || ' (expected ' || r.want || ')'); end if;
    end loop;
    v_got := selftest.f37_sebagai(u_admin, format('select public.revoke_certificate(%L, %L)', v_cert2, 'uji F38-C02'));
    v_got := selftest.f37_sebagai(u_admin, format('select * from public.sertifikat_koreksi_siapkan(%L, %L, 1::smallint)', v_cert2, 'nama murid salah ketik'));
    if v_got <> 'PR120:CERT_NOT_ISSUED' then c02 := c02 || ('a revoked certificate: ' || v_got || ' (expected PR120:CERT_NOT_ISSUED)'); end if;
    if (select count(*) from public.certificates c where c.session_id in (s_selesai, (select c2.session_id from public.certificates c2 where c2.id = v_cert2))) <> v_n
       or (select c.status::text from public.certificates c where c.id = v_cert) <> 'ISSUED' then
      c02 := c02 || 'a refusal added a certificate or changed the original'::text; end if;

    -- C03 corrected by its replacement
    perform selftest.as_user_uid(u_admin);
    begin
      select * into v_k from public.sertifikat_koreksi_siapkan(v_cert, 'nama murid salah ketik saat terbit', 1::smallint);
      v_new := v_k.certificate_id;
      select * into v_k from public.sertifikat_koreksi_siapkan(v_cert, 'nama murid salah ketik saat terbit', 1::smallint);
      if v_k.certificate_id is distinct from v_new then c03 := c03 || 'a second press prepared another replacement'::text; end if;
    exception when others then c03 := c03 || ('the admin could not prepare the replacement: ' || sqlerrm); end;
    perform selftest.as_owner();
    if v_new is not null then
      if not exists (select 1 from public.certificates n join public.certificate_identity_snapshots sn on sn.id = n.snapshot_id
                      where n.id = v_new and n.status = 'ELIGIBLE' and n.supersedes_certificate_id = v_cert
                        and sn.name_as_issued = 'Murid F38 Benar ' || v_tag and n.certificate_number <> v_nomor
                        and n.verification_token <> v_tok and n.canonical_payload -> 'result' = v_payload -> 'result'
                        and n.correction_reason = 'nama murid salah ketik saat terbit'
                        and n.corrected_by_person_id = (select a.person_id from public.accounts a where a.auth_user_id = u_admin)) then
        c03 := c03 || 'the prepared replacement does not carry the corrected name, a new number and token, the original''s result, the reason and the actor'::text; end if;
      if exists (select 1 from public.verify_certificate((select n.verification_token from public.certificates n where n.id = v_new))) then
        c03 := c03 || 'the prepared, unsigned replacement answers the public check'::text; end if;
      -- the server signs and seals (service only)
      v_got := selftest.f37_sebagai(u_admin, format('select public.sertifikat_koreksi_segel(%L, 1::smallint, %L)', v_new, repeat('t', 43)));
      if v_got not like '42501%' then c03 := c03 || ('the admin''s own client sealed the replacement: ' || v_got); end if;
      perform public.sertifikat_koreksi_segel(v_new, 1::smallint, repeat('t', 43));
      if (select n.status::text || '/' || o.status::text from public.certificates n, public.certificates o where n.id = v_new and o.id = v_cert) <> 'ISSUED/SUPERSEDED' then
        c03 := c03 || 'after the seal the replacement is not ISSUED and the original SUPERSEDED'::text; end if;
      if not exists (select 1 from public.certificates o where o.id = v_cert and o.canonical_payload = v_payload and o.snapshot_id = v_snapold
                       and o.certificate_number = v_nomor and o.verification_token = v_tok) then
        c03 := c03 || 'the original''s sealed history changed'::text; end if;
      if (select v.validity from public.verify_certificate(v_tok) v) is distinct from 'DIGANTIKAN'
         or (select v.validity from public.verify_certificate((select n.verification_token from public.certificates n where n.id = v_new)) v) is distinct from 'BERLAKU' then
        c03 := c03 || 'the public check does not answer DIGANTIKAN for the original and BERLAKU for the replacement'::text; end if;
      if (select count(*) from public.audit_log a where a.action = 'certificate.superseded' and a.target_id = v_cert::text
            and a.summary ->> 'reason' = 'nama murid salah ketik saat terbit' and a.summary ->> 'replacement_id' = v_new::text
            and a.summary ->> 'actor' = (select ac.person_id::text from public.accounts ac where ac.auth_user_id = u_admin)
            and (a.summary -> 'changed' ->> 'name')::boolean) <> 1 then
        c03 := c03 || 'no single certificate.superseded row with the reason, the actor, the replacement and what changed'::text; end if;
    end if;

    -- C04 one replacement per certificate
    if v_new is not null then
      v_got := selftest.f37_sebagai(u_admin, format('select * from public.sertifikat_koreksi_siapkan(%L, %L, 1::smallint)', v_cert, 'nama murid salah ketik lagi'));
      if v_got <> 'PR120:CERT_NOT_ISSUED' then c04 := c04 || ('correcting a superseded certificate: ' || v_got || ' (expected PR120:CERT_NOT_ISSUED)'); end if;
      v_got := selftest.f37_sebagai(u_admin, format('select public.revoke_certificate(%L, %L)', v_cert, 'uji F38-C04'));
      if v_got = 'OK' then c04 := c04 || 'a superseded certificate was revoked'::text; end if;
      -- a second replacement of the original, prepared behind the rule's back, cannot be sealed
      insert into public.certificates (session_id, person_id, institution_id, snapshot_id, certificate_number, verification_token,
        status, issued_at_iso, canonical_payload, supersedes_certificate_id, correction_reason, corrected_by_person_id)
      select o.session_id, o.person_id, o.institution_id, o.snapshot_id, o.certificate_number || 'X', o.verification_token || 'X',
             'ELIGIBLE', o.issued_at_iso, o.canonical_payload, o.id, 'kedua yang tidak boleh ada', o.person_id
        from public.certificates o where o.id = v_cert returning certificates.id into v_new2;
      begin
        perform public.sertifikat_koreksi_segel(v_new2, 1::smallint, repeat('u', 43));
        c04 := c04 || 'a second replacement of the same certificate was sealed'::text;
      exception when others then null; end;
      v_got := selftest.f37_sebagai(u_admin, format('select public.revoke_certificate(%L, %L)', v_new, 'uji F38-C04: pengganti dicabut'));
      if v_got <> 'OK' or (select c.status::text from public.certificates c where c.id = v_new) <> 'REVOKED' then
        c04 := c04 || ('the replacement could not be revoked: ' || v_got); end if;
    end if;

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
       'an ACTIVE assignment of canonical content whose distribution was WITHDRAWN is ended by the class''s Guru, its assessment CLOSED; the closed assessment cannot be opened again'),
      ('F38-R01', 'Evidence survives the year: a class moves up and nothing it earned is lost', r01,
       'after «Kenaikan kelas dan kelulusan» the learner is in Kelas 6 next year; the sitting stays on the old class and the old ENDED/EXPIRED enrolment; its result, the certificate and lesson progress are unchanged; the learner still reads all four (and my_certificate) and the old class''s Guru the sitting and its result; the public check answers BERLAKU'),
      ('F38-C01', 'W2.22 «Terbitkan ulang»: who may, and what the preview shows', c01,
       'the school''s admin reads the sealed name beside the corrected one (something would change); a Guru, the holder and another school''s admin are refused CERT_NOT_ALLOWED'),
      ('F38-C02', 'W2.22: refusals write nothing', c02,
       'a 5-character reason, a certificate with nothing to correct, a revoked certificate, a Guru and another school''s admin are refused; no certificate added, the original ISSUED'),
      ('F38-C03', 'W2.22: corrected by its replacement', c03,
       'the replacement is prepared ELIGIBLE (not public) with the corrected name, a new number and token, the original''s result, the reason and the actor, once; sealed by the server only, it is ISSUED and the original SUPERSEDED with its sealed history unchanged; the public check answers BERLAKU and DIGANTIKAN; one certificate.superseded row'),
      ('F38-C04', 'W2.22: one replacement per certificate', c04,
       'a superseded certificate is neither corrected nor revoked again; a second replacement of it cannot be sealed; the replacement itself is revoked')) t(tid, tarea, probs, good) loop
    id := r.tid; area := r.tarea;
    ok := v_fatal = '' and cardinality(r.probs) = 0;
    detail := case when v_fatal <> '' then 'fixture: ' || v_fatal when ok then r.good else array_to_string(r.probs, '; ') end;
    return next;
  end loop;
  id := 'F38-DONE'; area := 'fable38'; ok := true; detail := 'complete'; return next;
end $$;
revoke all on function selftest.run_fable38() from public;
