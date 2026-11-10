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
--   F38-W06  Owner ruling (10 Nov): a withdrawn assignment is not counted. The finished sitting of Kelas A's ENDED
--            assignment is in the class's figures (scoped_official_sessions and _results under Kelas A's boundary);
--            once its assignment is WITHDRAWN it is not, and its result is still kept.
--   F38-W07  Defect (10 Nov): a closed lesson's outcome stays seen. A learner of Kelas A finds the ENDED assignment in
--            my_learning_history with its status, not in my_learning_assignments, and reads its cycle state.
--   F38-W08  Defect (10 Nov): a sitting the school ended says so. Submitting a TERMINATED sitting is refused
--            PR003 SESSION_ENDED_BY_SCHOOL.
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
--   F38-S01  E5 «Akhiri tugas di sekolah ini»: the school's admin ends all of Kelas A's Guru's roles there with a category,
--            a reason and today's date; each role is revoked once with the reason (role.revoked), one
--            staff.ended_at_school row carries the category and the date, the person stays, and the Guru's authority
--            over Kelas A ends at once (akhiri_penugasan_pratinjau refused).
--   F38-S02  E5 refusals write nothing: an unknown category, a short reason, a future date, the admin's own roles
--            (STAFF_SELF), a Guru and another school's admin (STAFF_NOT_ALLOWED), a person with no role there.
--   F38-S03  «Ubah peran & tanggung jawab», the review: Kelas B's Guru made Kepala departemen as well is shown what is
--            gained at the Departemen (review, integrity, management decisions) and what is kept at Kelas B, with
--            nothing lost; the review writes nothing.
--   F38-S04  «Ubah peran», refusals and atomicity: a stale review (ROLE_STALE), SYSTEM_ADMIN and a role at another
--            school (ROLE_NOT_ALLOWED, ROLE_SCOPE_INVALID), Admin sekolah without its second press
--            (ROLE_ADMIN_UNCONFIRMED), and one bad addition beside a good one: nothing changes, nothing is audited.
--   F38-S05  «Ubah peran», applied: the promotion, then the demotion warned of the decision left with no one to decide
--            it (never reassigned), then a move from Kelas B to Kelas A in one press with no gap and no overlap;
--            teaching stays where it was kept; one role.changed row for each.
--   F38-A01  Platform suspension (§5b): the PINTAR Administrator suspends Kelas B's Guru (SECURITY, a note): the Auth user
--            is banned (sign-in refused), the per-request check refuses the Guru's token (PT403 AKUN_DITANGGUHKAN), the
--            Guru's roles and evidence are untouched, one account.suspended row with the category.
--   F38-A02  Suspension refusals write nothing: a school's admin (ACCOUNT_NOT_ALLOWED), the administrator's own account
--            (ACCOUNT_SELF), an unknown category, «Lainnya» without a note, a second suspension.
--   F38-A03  Reactivation: refused without a 10–300 reason; with one, the suspension ends, sign-in is allowed again,
--            the token answers, one account.reactivated row.
--   F38-A04  L2 / L3, the person's own requests: a learner with a live enrolment is refused (ACCOUNT_LEARNER_VIA_SCHOOL)
--            and no confirmation is refused; the Guru asks to delete their personal data (RECEIVED, in the platform's
--            queue), then closes the account at once (CLOSED_AT_REQUEST, the request DONE, sign-in and every request
--            refused); the requests read back to the person.
--   F38-A05  L4: the PINTAR Administrator deletes the closed account's personal data from the queue: the name becomes the
--            PINTAR ID, the photo and the sign-in email are gone, anonymized_at is set, the roles and the audit log are
--            kept, the request DONE; an open account's request is refused (ACCOUNT_NOT_CLOSED), and a school's admin.
--   F38-S06  Sharon §15 (6faef690): a swap of Kepala departemen for Dekan over the same place is not a false warning;
--            akhiri_tugas_staf records the decisions left with no one to decide; peran_orang reads only a person tied
--            to the school (STAFF_UNKNOWN); removing another Admin sekolah needs its second press, as naming one does.
--   F38-C05  Sharon §14 (6faef690, Low): one pending replacement per certificate. A preparation with another reason
--            reuses it (its number and token), so abandoned preparations never use up the holder's numbers.
--   F38-A06  Sharon §16 findings 1 and 3 (6faef690): L4 for a person who also holds a class card goes through (the card's
--            address is not personal data and is left), and the name and email are removed where else they were copied:
--            activation grants, email corrections, card conversions, import rows, the chosen username, auth.identities.
--   F38-A07  Sharon §16 finding 5: a person holding a live platform role cannot close their own account
--            (ACCOUNT_PLATFORM_ROLE), so the last PINTAR Administrator cannot lock the platform out.
--   F38-O01  Owner ruling 1 (9 Nov): an attempt limit holds across reassignment of the same assessment.
--   F38-O02  Owner ruling 2: a closed account asks to be reopened from outside (minta_buka_kembali, server-only); only the
--            PINTAR Administrator reopens it, from that request, saying how identity was verified (buka_kembali_akun).
--   F38-O03  Owner ruling 3: «Disiplin» is not a platform suspension category.
--   F38-H01  Sharon F1 (7a2c1751): a school's date is its own. Kelas A's school set to WIT by the PINTAR Administrator
--            (a school's admin is refused; the change is audited): hari_sekolah answers WIT's date, an ending with no
--            date is stamped with it, and WIT's tomorrow is refused as a future date.
--   F38-H02  Sharon F2: an ending does not use up an attempt. A sitting TERMINATED as INSTITUTIONAL_REVOCATION is not
--            counted against an attempt limit of 1 (may_start_assessment does not answer ATTEMPT_LIMIT_REACHED).
--   F38-H03  Sharon F3: an open sitting with neither class nor Angkatan does not block a departure: the enrolment ends
--            and the sitting is TERMINATED as INSTITUTIONAL_REVOCATION, audited.
--   F38-H04  Sharon F4: a returning learner's programme is the chosen Kelas's, not their old enrolment's.
--   F38-H05  Sharon F5: an ending in a school year that has ended is not «corrected» (ENROL_YEAR_CLOSED); murid_keluar
--            does not offer it; a return is the way back.
--   F38-H06  Sharon F6 (ruling 3): period_rollover is not a client endpoint.
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
  w01 text[] := '{}'; w09 text[] := '{}'; w10 text[] := '{}'; w11 text[] := '{}'; w12 text[] := '{}'; w13 text[] := '{}'; o04 text[] := '{}'; w12_awal int; v_per_lalu uuid; v_pi_w12 uuid; h07 text[] := '{}'; h08 text[] := '{}'; p_h8 uuid; e_a8 uuid; s_a8 uuid; v_tf8 uuid; w14 text[] := '{}'; w15 text[] := '{}'; p_h7 uuid; e_a7 uuid; e_b7 uuid; v_per_x uuid; s_a7 uuid; s_b7 uuid; s_bx7 uuid; w06 text[] := '{}'; w07 text[] := '{}'; w08 text[] := '{}'; s_t uuid; w02 text[] := '{}'; w03 text[] := '{}'; w04 text[] := '{}'; w05 text[] := '{}'; r01 text[] := '{}'; v_next uuid; v_coh6 uuid; c_6 uuid; s_r uuid; v_cr uuid; v_crtok text; v_res_r int; v_lp int; v_dec jsonb; c01 text[] := '{}'; s01 text[] := '{}'; s02 text[] := '{}'; s03 text[] := '{}'; s04 text[] := '{}'; s05 text[] := '{}'; a01 text[] := '{}'; a02 text[] := '{}'; a03 text[] := '{}'; a04 text[] := '{}'; a05 text[] := '{}'; h01 text[] := '{}'; h02 text[] := '{}'; h03 text[] := '{}'; h04 text[] := '{}'; h05 text[] := '{}'; h06 text[] := '{}'; v_prog2 uuid; v_coh2 uuid; c_p2 uuid; p_h uuid; e_h uuid; s_h uuid; v_def_lim uuid; v_aa_lim uuid; v_old_p uuid; c_old uuid; v_x2 uuid; v_hk record; u_h uuid; o01 text[] := '{}'; o02 text[] := '{}'; o05 text[] := '{}'; u_t5 uuid; p_t5 uuid; o03 text[] := '{}'; u_o uuid; p_o uuid; e_o uuid; v_la_o uuid; v_aa_o uuid; u_t uuid; p_t uuid; v_rq uuid; s06 text[] := '{}'; u_hd uuid; p_hd uuid; v_hdr uuid; p_luar uuid; u_adm2 uuid; p_adm2 uuid; c05 text[] := '{}'; v_num05 text; v_seq05 int; a06 text[] := '{}'; a07 text[] := '{}'; u_c uuid; u_kartu uuid; p_c uuid; v_akk uuid; v_job uuid; v_req3 uuid; v_pid3 text; u_sys uuid; p_sys uuid; v_req uuid; v_req2 uuid; v_pid text; p_guru_a uuid; p_guru_b uuid; p_admin uuid; v_sid text; v_md uuid; v_hod uuid; v_ub jsonb; v_cnt int; c02 text[] := '{}'; c03 text[] := '{}'; c04 text[] := '{}';
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

    -- ═══════════════════════════════════ F38-W06 a withdrawn assignment is not counted (owner ruling, 10 Nov)
    -- the suite's sitting is SYNTHETIC evidence, which no figure counts; for this check it is OFFICIAL, as a real one is
    select s.evidence_class::text into v_got from public.assessment_sessions s where s.id = s_selesai;
    set local session_replication_role = replica;
    update public.assessment_sessions set evidence_class = 'OFFICIAL' where assessment_sessions.id = s_selesai;
    set local session_replication_role = origin;
    perform set_config('pintar.metric_boundary_node', c_a::text, true);
    if (select count(*) from public.scoped_official_sessions x where x.id = s_selesai) <> 1
       or (select count(*) from public.scoped_official_results x where x.session_id = s_selesai) = 0 then
      w06 := w06 || 'the finished sitting of an ENDED assignment is not in the class''s figures'::text; end if;
    -- the suite's sitting was made without answers; one answer, as a real sitting holds, so W12 has something to leave out
    set local session_replication_role = replica;
    insert into public.presented_items (session_id, item_id, institution_id, position, presented_at)
    select s_selesai, i.id, v_inst, 1, now() - interval '3 hours' from public.items i where i.institution_id = v_inst order by i.created_at limit 1
    returning presented_items.id into v_pi_w12;
    insert into public.responses (presented_item_id, session_id, institution_id, client_seq, value, value_digest, is_final)
    values (v_pi_w12, s_selesai, v_inst, 1, jsonb_build_object('pilihan', 'A'), encode(extensions.digest('{"pilihan": "A"}', 'sha256'), 'hex'), true);
    set local session_replication_role = origin;
    select coalesce(sum(x.evidence_count), 0) - (select count(*) from public.academic_responses ar where ar.session_id = s_selesai
                                             and exists (select 1 from public.presented_items pi where pi.id = ar.presented_item_id))
      into w12_awal from public.service_item_statistics x
     where x.item_id in (select pi.item_id from public.presented_items pi where pi.session_id = s_selesai);
    set local session_replication_role = replica;
    update public.learning_assignments set status = 'WITHDRAWN' where learning_assignments.id = v_la;
    set local session_replication_role = origin;
    if (select count(*) from public.scoped_official_sessions x where x.id = s_selesai) <> 0
       or (select count(*) from public.scoped_official_results x where x.session_id = s_selesai) <> 0 then
      w06 := w06 || 'a withdrawn assignment''s sitting is still in the class''s figures'::text; end if;
    if (select count(*) from public.assessment_results x where x.session_id = s_selesai) <> v_res then
      w06 := w06 || 'a withdrawn assignment''s result was not kept'::text; end if;
    -- W09 Sharon's addendum: evaluated under MC-9 (no learning_assignments source) the population is MC-9's
    perform set_config('pintar.metric_catalogue', 'MC-9', true);
    if (select count(*) from public.scoped_official_sessions x where x.id = s_selesai) <> 1 then
      w09 := w09 || 'under MC-9 the withdrawn assignment''s sitting is left out (MC-10''s rule applied to MC-9)'::text; end if;
    perform set_config('pintar.metric_catalogue', 'MC-10', true);
    if (select count(*) from public.scoped_official_sessions x where x.id = s_selesai) <> 0 then
      w09 := w09 || 'under MC-10 the withdrawn assignment''s sitting is counted'::text; end if;
    perform set_config('pintar.metric_catalogue', '', true);
    -- W10 a certificate of a withdrawn assignment leaves the verified-credentials count, and is not revoked (in a block
    -- whose writes are undone: C01 issues this sitting's certificate later)
    begin
    v_cert := selftest.f38_sertifikat(s_selesai);
    perform set_config('pintar.metric_boundary_node', c_a::text, true);
    if exists (select 1 from public.scoped_certificates x where x.id = v_cert) then
      w10 := w10 || 'a certificate of a withdrawn assignment is in the school''s verified credentials'::text; end if;
    if (select c.status::text from public.certificates c where c.id = v_cert) <> 'ISSUED' then
      w10 := w10 || 'the certificate itself was changed'::text; end if;
    raise exception using errcode = 'P0W10';
    exception when sqlstate 'P0W10' then null;
    end;
    v_cert := null;
    -- W11 the learner's own result keeps the sitting, marked
    perform set_config('pintar.metric_boundary_node', '', true);
    perform set_config('pintar.metric_boundary_person', p_selesai::text, true);
    perform set_config('pintar.ditarik_tampil', 'ya', true);
    v_pv := public.calc_learner_result(p_selesai, v_inst, 'MC-10');
    if not exists (select 1 from jsonb_array_elements(v_pv -> 'value') e where e ->> 'session_id' = s_selesai::text and (e ->> 'ditarik')::boolean) then
      w11 := w11 || ('the learner''s own result drops the withdrawn sitting or does not mark it: ' || left(coalesce((v_pv -> 'value')::text, 'null'), 200)); end if;
    perform set_config('pintar.ditarik_tampil', '', true);
    perform set_config('pintar.metric_boundary_person', '', true);
    perform set_config('pintar.metric_boundary_node', c_a::text, true);
    -- W12 question health leaves the withdrawn answers out; the answers are kept
    select coalesce(sum(x.evidence_count), 0) into v_cnt from public.service_item_statistics x
     where x.item_id in (select pi.item_id from public.presented_items pi where pi.session_id = s_selesai);
    if not exists (select 1 from public.academic_responses ar where ar.session_id = s_selesai) then
      w12 := w12 || 'fixture: the finished sitting has no answers, so the check proves nothing'::text;
    elsif v_cnt <> w12_awal then
      w12 := w12 || ('item statistics still count the withdrawn answers (' || w12_awal || ' before, ' || v_cnt || ' after)'); end if;
    set local session_replication_role = replica;
    update public.learning_assignments set status = 'ENDED' where learning_assignments.id = v_la;
    update public.assessment_sessions set evidence_class = v_got::public.evidence_class where assessment_sessions.id = s_selesai;
    set local session_replication_role = origin;
    perform set_config('pintar.metric_boundary_node', '', true);

    -- ═══════════════════════════════════ F38-W07 a closed lesson's outcome stays seen (defect, 10 Nov)
    v_got := selftest.f37_sebagai(u_murid, format('select 1 / (select count(*)::int from public.my_learning_history() h where h.learning_assignment_id = %L and h.status = ''ENDED'')', v_la));
    if v_got <> 'OK' then w07 := w07 || ('the learner does not find the ENDED assignment in my_learning_history: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_murid, format('select 1 / (1 - (select count(*)::int from public.my_learning_assignments() h where h.learning_assignment_id = %L))', v_la));
    if v_got <> 'OK' then w07 := w07 || 'the ENDED assignment is still offered as work (my_learning_assignments)'::text; end if;
    v_got := selftest.f37_sebagai(u_murid, format('select count(*) from public.my_cycle_state(%L)', v_la));
    if v_got <> 'OK' then w07 := w07 || ('the learner cannot read the closed lesson''s cycle state: ' || v_got); end if;

    -- W13 Sharon's addendum: a closed lesson's content is not returned; its outcome stays listed after a move
    v_got := selftest.f37_sebagai(u_murid, format('select count(*) from public.learner_lessons(%L)', v_la));
    if v_got = 'OK' then w13 := w13 || 'learner_lessons returns a closed lesson''s content'::text; end if;
    set local session_replication_role = replica;
    update public.memberships set valid_from = now() - interval '2 days', valid_to = now() - interval '1 day', close_reason = 'MOVED' where memberships.enrollment_id = e_belum and memberships.valid_to is null;
    set local session_replication_role = origin;
    v_got := selftest.f37_sebagai(u_murid, format('select 1 / (select count(*)::int from public.my_learning_history() h where h.learning_assignment_id = %L and not h.kini)', v_la));
    if v_got <> 'OK' then w13 := w13 || ('after leaving the class the closed lesson is no longer listed (or listed as current): ' || v_got); end if;
    set local session_replication_role = replica;
    update public.memberships set valid_to = null, close_reason = null where memberships.enrollment_id = e_belum and memberships.node_id = c_a;
    set local session_replication_role = origin;

    -- ═══════════════════════════════════ F38-W08 a sitting the school ended says so (defect, 10 Nov)
    s_t := selftest.f38_buka(v_tpl, p_belum, e_belum, c_a, v_la, v_aa);
    set local session_replication_role = replica;
    update public.assessment_sessions set status = 'TERMINATED', termination_cause = 'ADMINISTRATIVE_TERMINATION', termination_reason = 'uji F38-W08'
     where assessment_sessions.id = s_t;
    set local session_replication_role = origin;
    v_got := selftest.f37_sebagai(u_murid, format('select public.submit_session(%L)', s_t));
    if v_got <> 'PR003:SESSION_ENDED_BY_SCHOOL' then w08 := w08 || ('submitting a sitting the school ended: ' || v_got || ' (expected PR003:SESSION_ENDED_BY_SCHOOL)'); end if;

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


    -- W14 the owner (10 Nov): a lesson PINTAR no longer shares is still named on the class page, its title only
    v_got := selftest.f37_sebagai(u_guru_a, format('select 1 / (select count(*)::int from public.judul_materi_kelas(%L) j where j.learning_assignment_id = %L and j.title <> '''')', c_a, v_la3));
    if v_got <> 'OK' then w14 := w14 || ('the class''s Guru cannot read the title of a lesson no longer shared: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_adminx, format('select count(*) from public.judul_materi_kelas(%L)', c_a));
    if v_got not like '42501%' and v_got not like 'PR%' then w14 := w14 || ('another school''s admin read the class''s lesson titles: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_guru_b, format('select count(*) from public.judul_materi_kelas(%L)', c_a));
    if v_got not like '42501%' and v_got not like 'PR%' then w14 := w14 || ('a Guru of another Kelas at the school read Kelas A''s lesson titles: ' || v_got); end if;

    -- W15 Daisy (435a2856, §1.1): an ended assignment says when and why, from its own audit row; nothing else, nobody else
    v_got := selftest.f37_sebagai(u_guru_a, format('select 1 / (select count(*)::int from public.riwayat_penugasan_kelas(%L) r where r.learning_assignment_id = %L and r.jenis = %L and r.alasan = %L and r.pada is not null)', c_a, v_la3, 'ENDED', 'PINTAR tidak lagi membagikan bab ini'));
    if v_got <> 'OK' then w15 := w15 || ('the class''s Guru does not read the ended assignment''s kind, moment and reason: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_guru_a, format('select 1 / (1 - (select count(*)::int from public.riwayat_penugasan_kelas(%L) r join public.learning_assignments la on la.id = r.learning_assignment_id where la.status not in (%L, %L)))', c_a, 'ENDED', 'WITHDRAWN'));
    if v_got <> 'OK' then w15 := w15 || ('an assignment still in force is listed as ended: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_adminx, format('select count(*) from public.riwayat_penugasan_kelas(%L)', c_a));
    if v_got not like '42501%' and v_got not like 'PR%' then w15 := w15 || ('another school''s admin read the class''s ended assignments: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_murid, format('select count(*) from public.riwayat_penugasan_kelas(%L)', c_a));
    if v_got not like '42501%' and v_got not like 'PR%' then w15 := w15 || ('a learner read the class''s ended assignments and their reasons: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_guru_b, format('select count(*) from public.riwayat_penugasan_kelas(%L)', c_a));
    if v_got not like '42501%' and v_got not like 'PR%' then w15 := w15 || ('a Guru of another Kelas at the school read Kelas A''s ended assignments: ' || v_got); end if;

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
    -- (Sharon F4) next year's Kelas sits under another programme of the school: the new enrolment takes the Kelas's
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_dep, 'PROGRAMME', 'Program F38 dua ' || v_tag) returning org_nodes.id into v_prog2;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_prog2, 'COHORT', 'Tingkat F38 6 ' || v_tag, v_next) returning org_nodes.id into v_coh6;
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
      if (select en.programme_id from public.enrollments en where en.person_id = p_belum and en.academic_period_id = v_next) is distinct from v_prog2 then
        r01 := r01 || 'the new year''s enrolment does not take the programme of the Kelas it is placed in (Sharon F4)'::text; end if;
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
      -- C05 (Sharon §14 on 6faef690): another reason is the same pending replacement, its number unchanged, the counter
      -- not moved; the last reason given is the one it carries
      perform selftest.as_owner();
      select n.certificate_number into v_num05 from public.certificates n where n.id = v_new;
      select cn.last_sequence into v_seq05 from public.certificate_number_counters cn where cn.person_id = (select x.person_id from public.certificates x where x.id = v_cert);
      perform selftest.as_user_uid(u_admin);
      select * into v_k from public.sertifikat_koreksi_siapkan(v_cert, 'ejaan nama keliru di sertifikat', 1::smallint);
      perform selftest.as_owner();
      if v_k.certificate_id is distinct from v_new then c05 := c05 || 'another reason prepared another replacement (a new number taken)'::text;
      elsif (select n.correction_reason from public.certificates n where n.id = v_new) <> 'ejaan nama keliru di sertifikat' then
        c05 := c05 || 'the pending replacement does not carry the reason given last'::text; end if;
      if (select n.certificate_number from public.certificates n where n.id = v_new) is distinct from v_num05
         or (select cn.last_sequence from public.certificate_number_counters cn where cn.person_id = (select x.person_id from public.certificates x where x.id = v_cert)) is distinct from v_seq05 then
        c05 := c05 || 'the number changed or the holder''s counter moved'::text; end if;
      if (select count(*) from public.certificates n where n.supersedes_certificate_id = v_cert and n.status = 'ELIGIBLE') <> 1 then
        c05 := c05 || 'more than one pending replacement'::text; end if;
      perform selftest.as_user_uid(u_admin);
      select * into v_k from public.sertifikat_koreksi_siapkan(v_cert, 'nama murid salah ketik saat terbit', 1::smallint);
    -- a failure rolls the preparation back, so nothing below may act on it
    exception when others then c03 := c03 || ('the admin could not prepare the replacement: ' || sqlerrm); v_new := null; end;
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

    -- ═══════════════════════════════════ F38-S01..S05 an educator's roles change, or end at the school, on the record
    select a.person_id into p_guru_a from public.accounts a where a.auth_user_id = u_guru_a;
    select a.person_id into p_guru_b from public.accounts a where a.auth_user_id = u_guru_b;
    select a.person_id into p_admin from public.accounts a where a.auth_user_id = u_admin;
    -- S02 refusals first (nothing ends)
    select count(*) into v_aud from public.audit_log a where a.target_id = p_guru_a::text;
    for r in select * from (values
        (u_admin, p_guru_a, 'HOLIDAY', 'mengundurkan diri akhir semester', 0, 'PR130:STAFF_CATEGORY_INVALID', 'an unknown category'),
        (u_admin, p_guru_a, 'RESIGNATION', 'pindah', 0, 'PR130:STAFF_REASON_REQUIRED', 'a short reason'),
        (u_admin, p_guru_a, 'RESIGNATION', 'mengundurkan diri akhir semester', 2, 'PR130:STAFF_DATE_INVALID', 'a future date'),
        (u_admin, p_admin, 'RESIGNATION', 'mengundurkan diri akhir semester', 0, 'PR130:STAFF_SELF', 'the admin''s own roles'),
        (u_guru_b, p_guru_a, 'RESIGNATION', 'mengundurkan diri akhir semester', 0, 'PR130:STAFF_NOT_ALLOWED', 'a Guru'),
        (u_adminx, p_guru_a, 'RESIGNATION', 'mengundurkan diri akhir semester', 0, 'PR130:STAFF_NOT_ALLOWED', 'another school''s admin'),
        (u_admin, p_belum, 'RESIGNATION', 'mengundurkan diri akhir semester', 0, 'PR130:STAFF_NOT_ACTIVE', 'a learner with no role')) t(uid, orang, kat, alasan, hari, want, who) loop
      v_got := selftest.f37_sebagai(r.uid, format('select public.akhiri_tugas_staf(%L, %L, %L, %L, ((now() at time zone ''Asia/Jakarta'')::date + %s))', r.orang, v_inst, r.kat, r.alasan, r.hari));
      if v_got <> r.want then s02 := s02 || (r.who || ': ' || v_got || ' (expected ' || r.want || ')'); end if;
    end loop;
    if (select count(*) from public.staf_peran_hidup(p_guru_a, v_inst)) <> 1
       or (select count(*) from public.audit_log a where a.target_id = p_guru_a::text) <> v_aud then
      s02 := s02 || 'a refusal ended a role or wrote an audit row'::text; end if;

    -- S03 the review of a promotion writes nothing
    v_sid := (select public.staf_sidik(p_guru_b, v_inst));
    perform selftest.as_user_uid(u_admin);
    begin
      v_ub := public.ubah_peran(p_guru_b, v_inst, jsonb_build_array(jsonb_build_object('role', 'HEAD_OF_DEPARTMENT', 'scope_node_id', v_dep,
                'valid_until', (now() + interval '1 year')::text)), null, 'menjadi Kepala departemen juga', v_sid, false, false);
    exception when others then s03 := s03 || ('the review was refused: ' || sqlerrm); end;
    perform selftest.as_owner();
    if v_ub is not null then
      if not (v_ub -> 'dapat' @> jsonb_build_array(jsonb_build_object('tj', 'CAN_REVIEW', 'tempat', 'Departemen F38 ' || v_tag))
              and v_ub -> 'dapat' @> jsonb_build_array(jsonb_build_object('tj', 'MANAGEMENT_DECISION', 'tempat', 'Departemen F38 ' || v_tag))
              and v_ub -> 'tetap' @> jsonb_build_array(jsonb_build_object('tj', 'CAN_DRAFT', 'tempat', 'Kelas F38 B ' || v_tag))
              and jsonb_array_length(v_ub -> 'hilang') = 0) then
        s03 := s03 || ('the review: ' || left(v_ub::text, 300)); end if;
    end if;
    if (select count(*) from public.staf_peran_hidup(p_guru_b, v_inst)) <> 1 then s03 := s03 || 'the review wrote a role'::text; end if;

    -- S04 refusals and atomicity
    select count(*) into v_aud from public.audit_log a where a.target_id = p_guru_b::text or a.action like 'role.%' and a.summary ->> 'person_id' = p_guru_b::text;
    for r in select * from (values
        ('[{"role":"HEAD_OF_DEPARTMENT","scope_node_id":"' || v_dep || '","valid_until":"2099-01-01"}]', 'basi', false, 'PR130:ROLE_STALE', 'a stale review'),
        ('[{"role":"SYSTEM_ADMIN","scope_node_id":"' || v_root || '","valid_until":"2099-01-01"}]', 'ok', false, 'PR130:ROLE_NOT_ALLOWED', 'SYSTEM_ADMIN'),
        ('[{"role":"EDUCATOR","scope_node_id":"' || (select o.id from public.org_nodes o where o.institution_id = v_x and o.kind = 'INSTITUTION') || '","valid_until":"2099-01-01"}]', 'ok', false, 'PR130:ROLE_SCOPE_INVALID', 'a role at another school'),
        ('[{"role":"INSTITUTION_ADMIN","scope_node_id":"' || v_root || '","valid_until":"2099-01-01"}]', 'ok', false, 'PR130:ROLE_ADMIN_UNCONFIRMED', 'Admin sekolah without its second press'),
        ('[{"role":"HEAD_OF_DEPARTMENT","scope_node_id":"' || v_dep || '","valid_until":"2099-01-01"},{"role":"DEAN","scope_node_id":"' || v_dep || '","valid_until":"2000-01-01"}]', 'ok', false, 'PR130:ROLE_UNTIL_INVALID', 'one bad addition beside a good one')) t(tambah, sidik, konf, want, who) loop
      v_got := selftest.f37_sebagai(u_admin, format('select public.ubah_peran(%L, %L, %L::jsonb, null, %L, %L, %L, true)', p_guru_b, v_inst, r.tambah,
                 'perubahan tanggung jawab semester', case r.sidik when 'ok' then v_sid else 'basi' end, r.konf));
      if v_got <> r.want then s04 := s04 || (r.who || ': ' || v_got || ' (expected ' || r.want || ')'); end if;
    end loop;
    v_got := selftest.f37_sebagai(u_guru_a, format('select public.ubah_peran(%L, %L, %L::jsonb, null, %L, %L, false, true)', p_guru_b, v_inst,
               '[{"role":"HEAD_OF_DEPARTMENT","scope_node_id":"' || v_dep || '","valid_until":"2099-01-01"}]', 'perubahan tanggung jawab semester', v_sid));
    if v_got <> 'PR130:STAFF_NOT_ALLOWED' then s04 := s04 || ('a Guru changing roles: ' || v_got); end if;
    if (select count(*) from public.staf_peran_hidup(p_guru_b, v_inst)) <> 1
       or (select count(*) from public.audit_log a where a.target_id = p_guru_b::text or a.action like 'role.%' and a.summary ->> 'person_id' = p_guru_b::text) <> v_aud then
      s04 := s04 || 'a refused change wrote a role or an audit row'::text; end if;

    -- S05 applied: promotion; demotion with its queue warning; a move in one press
    v_got := selftest.f37_sebagai(u_admin, format('select public.ubah_peran(%L, %L, %L::jsonb, null, %L, %L, false, true)', p_guru_b, v_inst,
               '[{"role":"HEAD_OF_DEPARTMENT","scope_node_id":"' || v_dep || '","valid_until":"2099-01-01"}]', 'menjadi Kepala departemen juga', v_sid));
    select x.id into v_hod from public.staf_peran_hidup(p_guru_b, v_inst) x where x.role = 'HEAD_OF_DEPARTMENT';
    if v_got <> 'OK' or v_hod is null or (select count(*) from public.staf_peran_hidup(p_guru_b, v_inst)) <> 2 then
      s05 := s05 || ('the promotion: ' || v_got);
    else
      -- a decision waits at Kelas B, raised by someone else; B is the only Kepala departemen over it
      set local session_replication_role = replica;
      insert into public.management_decisions (family, institution_id, scope_node_id, source_table, source_id, raised_by_person_id)
      values ('LEARNING_INTERVENTION', v_inst, c_b, 'selftest_fable', gen_random_uuid(), p_guru_a) returning management_decisions.id into v_md;
      -- the school's own Kepala departemen and Dekan above Kelas B (the seed's), ended for this rolled-back test, so B is the
      -- only one who could decide it
      update public.role_assignments ra set revoked_at = now(), revoked_reason = 'uji F38-S05'
       where ra.role in ('HEAD_OF_DEPARTMENT', 'DEAN') and ra.person_id <> p_guru_b and ra.revoked_at is null
         and exists (select 1 from public.org_nodes o where o.id = c_b and o.jalur @> array[ra.scope_node_id]);
      set local session_replication_role = origin;
      v_sid := public.staf_sidik(p_guru_b, v_inst);
      perform selftest.as_user_uid(u_admin);
      v_ub := public.ubah_peran(p_guru_b, v_inst, '[]', array[v_hod], 'kembali menjadi Guru saja', v_sid, false, false);
      perform selftest.as_owner();
      if not (v_ub -> 'antrean' @> jsonb_build_array(jsonb_build_object('tempat', 'Kelas F38 B ' || v_tag, 'menunggu', 1))) then
        s05 := s05 || ('the demotion''s review does not warn of the decision left unattended: ' || coalesce(v_ub -> 'antrean', 'null')::text); end if;
      v_got := selftest.f37_sebagai(u_admin, format('select public.ubah_peran(%L, %L, %L::jsonb, %L::uuid[], %L, %L, false, true)', p_guru_b, v_inst, '[]',
                 array[v_hod], 'kembali menjadi Guru saja', v_sid));
      if v_got <> 'OK' or exists (select 1 from public.staf_peran_hidup(p_guru_b, v_inst) x where x.role = 'HEAD_OF_DEPARTMENT')
         or not exists (select 1 from public.staf_peran_hidup(p_guru_b, v_inst) x where x.role = 'EDUCATOR' and x.scope_node_id = c_b)
         or (select md.state::text from public.management_decisions md where md.id = v_md) <> 'AWAITING_REVIEW' then
        s05 := s05 || ('the demotion: ' || v_got || ' (teaching must stay, the decision must wait unreassigned)'); end if;
      -- the move: Kelas B to Kelas A in one press
      v_sid := public.staf_sidik(p_guru_b, v_inst);
      v_got := selftest.f37_sebagai(u_admin, format('select public.ubah_peran(%L, %L, %L::jsonb, %L::uuid[], %L, %L, false, true)', p_guru_b, v_inst,
                 '[{"role":"EDUCATOR","scope_node_id":"' || c_a || '","valid_until":"2099-01-01"}]',
                 array[(select x.id from public.staf_peran_hidup(p_guru_b, v_inst) x where x.scope_node_id = c_b)], 'pindah mengajar ke Kelas A', v_sid));
      if v_got <> 'OK' or (select count(*) from public.staf_peran_hidup(p_guru_b, v_inst)) <> 1
         or not exists (select 1 from public.staf_peran_hidup(p_guru_b, v_inst) x where x.scope_node_id = c_a)
         or not exists (select 1 from public.role_assignments o, public.role_assignments n where o.person_id = p_guru_b and n.person_id = p_guru_b
                          and o.scope_node_id = c_b and n.scope_node_id = c_a and o.revoked_at = n.valid_from) then
        s05 := s05 || ('the move: ' || v_got || ' (one live role at Kelas A, the old one ended at the moment the new one began)'); end if;
      if (select count(*) from public.audit_log a where a.action = 'role.changed' and a.target_id = p_guru_b::text) <> 3 then
        s05 := s05 || 'not one role.changed row per change'::text; end if;
    end if;

    -- S06 Sharon §15 (6faef690): the swap Kepala departemen → Dekan over the same place warns of nothing; ending the last
    -- one who could decide records the decisions left waiting; a person with no tie to the school is not read; removing
    -- another Admin sekolah needs its second press
    if v_md is not null then
      u_hd := selftest.f11_user('f38-kadep-' || v_tag || '@local.invalid', 'HEAD_OF_DEPARTMENT', v_dep);
      select a.person_id into p_hd from public.accounts a where a.auth_user_id = u_hd;
      select x.id into v_hdr from public.staf_peran_hidup(p_hd, v_inst) x where x.role = 'HEAD_OF_DEPARTMENT';
      v_sid := public.staf_sidik(p_hd, v_inst);
      perform selftest.as_user_uid(u_admin);
      begin
        v_ub := public.ubah_peran(p_hd, v_inst, ('[{"role":"DEAN","scope_node_id":"' || v_dep || '","valid_until":"2099-01-01"}]')::jsonb,
                                  array[v_hdr], 'menjadi Dekan atas departemen', v_sid, false, false);
        if jsonb_array_length(coalesce(v_ub -> 'antrean', '[]')) <> 0 then
          s06 := s06 || ('Kepala departemen → Dekan over the same place warns of a decision left unattended: ' || (v_ub -> 'antrean')::text); end if;
      exception when others then s06 := s06 || ('the swap''s review: ' || sqlerrm); end;
      perform selftest.as_owner();
      v_got := selftest.f37_sebagai(u_admin, format('select public.akhiri_tugas_staf(%L, %L, %L, %L, null)', p_hd, v_inst, 'RESIGNATION', 'mengundurkan diri akhir semester'));
      if v_got <> 'OK' then s06 := s06 || ('ending the Kepala departemen: ' || v_got);
      elsif not (coalesce((select a.summary -> 'queues_unattended' from public.audit_log a where a.action = 'staff.ended_at_school' and a.target_id = p_hd::text), '[]')
                 @> jsonb_build_array(jsonb_build_object('tempat', 'Kelas F38 B ' || v_tag, 'menunggu', 1))) then
        s06 := s06 || 'ending the last one who could decide does not record the decision left waiting'::text; end if;
    else
      s06 := s06 || 'fixture: S05 left no waiting decision'::text;
    end if;
    insert into public.persons (display_name) values ('Orang Luar F38 ' || v_tag) returning persons.id into p_luar;
    v_got := selftest.f37_sebagai(u_admin, format('select public.peran_orang(%L, %L)', p_luar, v_inst));
    if v_got <> 'PR130:STAFF_UNKNOWN' then s06 := s06 || ('a person with no tie to the school is read: ' || v_got || ' (expected PR130:STAFF_UNKNOWN)'); end if;
    u_adm2 := selftest.f11_user('f38-admin-dua-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_root);
    select a.person_id into p_adm2 from public.accounts a where a.auth_user_id = u_adm2;
    v_got := selftest.f37_sebagai(u_admin, format('select public.ubah_peran(%L, %L, %L::jsonb, %L::uuid[], %L, %L, false, false)', p_adm2, v_inst, '[]',
               array[(select x.id from public.staf_peran_hidup(p_adm2, v_inst) x where x.role = 'INSTITUTION_ADMIN')], 'tidak lagi mengurus sekolah', public.staf_sidik(p_adm2, v_inst)));
    if v_got <> 'PR130:ROLE_ADMIN_UNCONFIRMED' then s06 := s06 || ('removing another Admin sekolah without the second press: ' || v_got); end if;

    -- S01 E5: Kelas A's Guru leaves the school
    v_got := selftest.f37_sebagai(u_admin, format('select public.akhiri_tugas_staf(%L, %L, %L, %L, (now() at time zone ''Asia/Jakarta'')::date)',
               p_guru_a, v_inst, 'RESIGNATION', 'mengundurkan diri akhir semester'));
    if v_got <> 'OK' then s01 := s01 || ('the Guru''s roles were not ended: ' || v_got);
    else
      if exists (select 1 from public.staf_peran_hidup(p_guru_a, v_inst)) then s01 := s01 || 'a role is still live'::text; end if;
      if not exists (select 1 from public.audit_log a where a.action = 'role.revoked' and a.summary ->> 'person_id' = p_guru_a::text
                       and a.summary ->> 'reason' = 'mengundurkan diri akhir semester') then s01 := s01 || 'no role.revoked row with the reason'::text; end if;
      if (select count(*) from public.audit_log a where a.action = 'staff.ended_at_school' and a.target_id = p_guru_a::text
            and a.summary ->> 'reason_code' = 'RESIGNATION' and a.summary ->> 'effective_date' = ((now() at time zone 'Asia/Jakarta')::date)::text) <> 1 then
        s01 := s01 || 'no single staff.ended_at_school row with the category and the date'::text; end if;
      if not exists (select 1 from public.persons p where p.id = p_guru_a) then s01 := s01 || 'the person is gone'::text; end if;
      v_got := selftest.f37_sebagai(u_guru_a, format('select public.akhiri_penugasan_pratinjau(%L)', v_la));
      if v_got <> 'PR050:ASSIGN_NOT_ALLOWED' then s01 := s01 || ('the Guru still acts on Kelas A: ' || v_got); end if;
    end if;

    -- ═══════════════════════════════════ F38-A01..A05 suspension, closure and deletion (§5b, L2–L4)
    u_sys := selftest.f11_user('f38-sys-' || v_tag || '@local.invalid', 'SYSTEM_ADMIN', v_root);
    select a.person_id into p_sys from public.accounts a where a.auth_user_id = u_sys;
    -- A02 refusals first
    select count(*) into v_aud from public.audit_log a where a.target_id = p_guru_b::text and a.action like 'account.%';
    for r in select * from (values
        (u_admin, p_guru_b, 'SECURITY', null::text, 'PR140:ACCOUNT_NOT_ALLOWED', 'a school''s admin'),
        (u_sys, p_sys, 'SECURITY', null, 'PR140:ACCOUNT_SELF', 'the administrator''s own account'),
        (u_sys, p_guru_b, 'HOLIDAY', null, 'PR140:ACCOUNT_CATEGORY_INVALID', 'an unknown category'),
        (u_sys, p_guru_b, 'OTHER', 'pendek', 'PR140:ACCOUNT_NOTE_REQUIRED', '«Lainnya» without a note')) t(uid, orang, kat, cat, want, who) loop
      v_got := selftest.f37_sebagai(r.uid, format('select public.tangguhkan_akun(%L, %L, %L)', r.orang, r.kat, r.cat));
      if v_got <> r.want then a02 := a02 || (r.who || ': ' || v_got || ' (expected ' || r.want || ')'); end if;
    end loop;
    if exists (select 1 from public.person_suspensions x where x.person_id = p_guru_b)
       or (select count(*) from public.audit_log a where a.target_id = p_guru_b::text and a.action like 'account.%') <> v_aud then
      a02 := a02 || 'a refusal suspended or audited'::text; end if;

    -- A01 the suspension
    v_got := selftest.f37_sebagai(u_sys, format('select public.tangguhkan_akun(%L, %L, %L)', p_guru_b, 'SECURITY', 'akun diduga diambil alih'));
    if v_got <> 'OK' then a01 := a01 || ('the suspension: ' || v_got);
    else
      if (select u.banned_until from auth.users u where u.id = u_guru_b) is distinct from 'infinity'::timestamptz then
        a01 := a01 || 'sign-in is not refused (the Auth user is not banned)'::text; end if;
      v_got := selftest.f37_sebagai(u_guru_b, 'select pintar_permintaan.periksa()');
      if v_got not like 'PT403%' then a01 := a01 || ('the Guru''s token still answers: ' || v_got); end if;
      if not exists (select 1 from public.staf_peran_hidup(p_guru_b, v_inst)) then a01 := a01 || 'the suspension ended the Guru''s roles'::text; end if;
      if (select count(*) from public.audit_log a where a.action = 'account.suspended' and a.target_id = p_guru_b::text and a.summary ->> 'reason_code' = 'SECURITY') <> 1 then
        a01 := a01 || 'no single account.suspended row with the category'::text; end if;
      v_got := selftest.f37_sebagai(u_sys, format('select public.tangguhkan_akun(%L, %L, %L)', p_guru_b, 'SECURITY', null));
      if v_got <> 'PR140:ACCOUNT_ALREADY_SUSPENDED' then a02 := a02 || ('a second suspension: ' || v_got); end if;
    end if;

    -- A03 reactivation
    v_got := selftest.f37_sebagai(u_sys, format('select public.aktifkan_kembali_akun(%L, %L)', p_guru_b, 'oke'));
    if v_got <> 'PR140:ACCOUNT_NOTE_REQUIRED' then a03 := a03 || ('a short reason: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_sys, format('select public.aktifkan_kembali_akun(%L, %L)', p_guru_b, 'akun sudah dipulihkan pemiliknya'));
    if v_got <> 'OK' then a03 := a03 || ('the reactivation: ' || v_got);
    else
      if (select u.banned_until from auth.users u where u.id = u_guru_b) is not null then a03 := a03 || 'sign-in is still refused'::text; end if;
      v_got := selftest.f37_sebagai(u_guru_b, 'select pintar_permintaan.periksa()');
      if v_got <> 'OK' then a03 := a03 || ('the Guru''s token still refused: ' || v_got); end if;
      if (select count(*) from public.audit_log a where a.action = 'account.reactivated' and a.target_id = p_guru_b::text) <> 1 then
        a03 := a03 || 'no account.reactivated row'::text; end if;
    end if;

    -- A04 the person's own requests
    v_got := selftest.f37_sebagai(u_murid, format('select public.minta_akun(%L, true)', 'CLOSE'));
    if v_got <> 'PR140:ACCOUNT_LEARNER_VIA_SCHOOL' then a04 := a04 || ('a learner closing their own account: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_guru_b, format('select public.minta_akun(%L, false)', 'CLOSE'));
    if v_got <> 'PR140:ACCOUNT_CONFIRM_REQUIRED' then a04 := a04 || ('no confirmation: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_guru_b, format('select public.minta_akun(%L, true)', 'DELETE_PERSONAL_DATA'));
    select q.id into v_req from public.account_requests q where q.person_id = p_guru_b and q.kind = 'DELETE_PERSONAL_DATA';
    if v_got <> 'OK' or v_req is null then a04 := a04 || ('the deletion request: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_guru_b, format('select public.minta_akun(%L, true)', 'DELETE_PERSONAL_DATA'));
    if v_got <> 'PR140:ACCOUNT_REQUEST_OPEN' then a04 := a04 || ('a second deletion request: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_guru_b, 'select 1 / (select count(*)::int from public.permintaan_akun_saya() where status = ''RECEIVED'')');
    if v_got <> 'OK' then a04 := a04 || ('the person does not read their own request: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_guru_b, format('select public.minta_akun(%L, true)', 'CLOSE'));
    if v_got <> 'OK' then a04 := a04 || ('the closure: ' || v_got);
    else
      if not exists (select 1 from public.person_suspensions x where x.person_id = p_guru_b and x.ended_at is null and x.category = 'CLOSED_AT_REQUEST')
         or not exists (select 1 from public.account_requests q where q.person_id = p_guru_b and q.kind = 'CLOSE' and q.status = 'DONE') then
        a04 := a04 || 'the closure is not recorded as CLOSED_AT_REQUEST with its request DONE'::text; end if;
      v_got := selftest.f37_sebagai(u_guru_b, 'select pintar_permintaan.periksa()');
      if v_got not like 'PT403%' or (select u.banned_until from auth.users u where u.id = u_guru_b) is distinct from 'infinity'::timestamptz then
        a04 := a04 || ('after closing, the account still signs in or answers: ' || v_got); end if;
    end if;
    perform selftest.as_user_uid(u_sys);
    begin
      if not exists (select 1 from public.permintaan_akun_antrean() x where x.id = v_req and x.ditutup) then
        a04 := a04 || 'the platform''s queue does not hold the request of the closed account'::text; end if;
    exception when others then a04 := a04 || ('the platform''s queue: ' || sqlerrm); end;
    perform selftest.as_owner();

    -- A05 deletion of what needs no retention
    v_got := selftest.f37_sebagai(u_admin, format('select public.hapus_data_pribadi(%L, null)', v_req));
    if v_got <> 'PR140:ACCOUNT_NOT_ALLOWED' then a05 := a05 || ('a school''s admin deleting personal data: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_guru_a, format('select public.minta_akun(%L, true)', 'DELETE_PERSONAL_DATA'));
    select q.id into v_req2 from public.account_requests q where q.person_id = p_guru_a and q.kind = 'DELETE_PERSONAL_DATA';
    v_got := selftest.f37_sebagai(u_sys, format('select public.hapus_data_pribadi(%L, null)', v_req2));
    if v_got <> 'PR140:ACCOUNT_NOT_CLOSED' then a05 := a05 || ('an open account''s data: ' || v_got || ' (expected PR140:ACCOUNT_NOT_CLOSED)'); end if;
    select p.pintar_id into v_pid from public.persons p where p.id = p_guru_b;
    v_got := selftest.f37_sebagai(u_sys, format('select public.hapus_data_pribadi(%L, %L)', v_req, 'sesuai permintaan'));
    if v_got <> 'OK' then a05 := a05 || ('the deletion: ' || v_got);
    else
      if not exists (select 1 from public.persons p where p.id = p_guru_b and p.display_name = v_pid and p.photo_path is null and p.anonymized_at is not null) then
        a05 := a05 || 'the name is not replaced by the PINTAR ID, or the photo or anonymized_at is wrong'::text; end if;
      if (select u.email from auth.users u where u.id = u_guru_b) not like 'anonim-%@pintar.invalid' then a05 := a05 || 'the sign-in email is still there'::text; end if;
      if (select q.status from public.account_requests q where q.id = v_req) <> 'DONE' then a05 := a05 || 'the request is not DONE'::text; end if;
      if not exists (select 1 from public.role_assignments ra where ra.person_id = p_guru_b) then a05 := a05 || 'the role history is gone'::text; end if;
      if (select count(*) from public.audit_log a where a.action = 'account.personal_data_deleted' and a.target_id = p_guru_b::text) <> 1 then
        a05 := a05 || 'no account.personal_data_deleted row'::text; end if;
    end if;

    -- ═══════════════════════════════════ F38-A06/A07 Sharon's §16 findings on 6faef690
    -- A07 a live platform role does not close itself
    v_got := selftest.f37_sebagai(u_sys, format('select public.minta_akun(%L, true)', 'CLOSE'));
    if v_got <> 'PR140:ACCOUNT_PLATFORM_ROLE' then a07 := a07 || ('the PINTAR Administrator closing their own account: ' || v_got); end if;
    if exists (select 1 from public.person_suspensions x where x.person_id = p_sys) then a07 := a07 || 'the refusal still closed the account'::text; end if;

    -- A06 a card holder's deletion, and every copy of the name and email
    u_c := selftest.f11_user('f38-pergi-' || v_tag || '@local.invalid', null, null);
    select a.person_id, a.id into p_c, v_akk from public.accounts a where a.auth_user_id = u_c;
    update public.persons set display_name = 'Nama Asli F38 ' || v_tag where persons.id = p_c;
    set local session_replication_role = replica;
    insert into auth.users (id, email) values (gen_random_uuid(), 'card-f38' || v_tag || '@cards.local.invalid') returning users.id into u_kartu;
    insert into public.accounts (person_id, auth_user_id, kind, card_number) values (p_c, u_kartu, 'CLASSROOM_CARD', '0000038001');
    insert into public.person_usernames (person_id, username, claimed_at) values (p_c, 'namaasli' || substr(v_tag, 1, 6), now());
    insert into public.account_activation_grants (email, person_id, kind, authorized_by, expires_at, consumed_at, consumed_by)
    values ('f38-pergi-' || v_tag || '@local.invalid', p_c, 'EMAIL', p_sys, now() + interval '1 day', now(), u_c);
    insert into public.email_corrections (person_id, account_id, old_email, new_email, activated, reason, authorized_by, expires_at)
    values (p_c, v_akk, 'lama-' || v_tag || '@local.invalid', 'f38-pergi-' || v_tag || '@local.invalid', true, 'uji F38-A06', p_sys, now() + interval '1 day');
    insert into public.card_conversions (person_id, account_id, old_card_number, new_email, reason, authorized_by, expires_at)
    values (p_c, v_akk, '0000038001', 'f38-pergi-' || v_tag || '@local.invalid', 'uji F38-A06 konversi', p_sys, now() + interval '1 day');
    insert into public.import_jobs (institution_id, created_by_person_id) values (v_inst, p_sys) returning import_jobs.id into v_job;
    insert into public.import_rows (job_id, ordinal, payload, state, person_id)
    values (v_job, 1, jsonb_build_object('nama', 'Nama Asli F38 ' || v_tag, 'email', 'f38-pergi-' || v_tag || '@local.invalid'), 'PENDING', p_c);
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, created_at, updated_at)
    values (gen_random_uuid(), u_c, u_c::text, 'email', jsonb_build_object('sub', u_c::text, 'email', 'f38-pergi-' || v_tag || '@local.invalid'), now(), now());
    -- Sharon's addendum (10 Nov): GoTrue's own copies of the address
    insert into auth.audit_log_entries (id, payload, created_at)
    values (gen_random_uuid(), jsonb_build_object('action', 'login', 'actor_id', u_c::text, 'actor_username', 'f38-pergi-' || v_tag || '@local.invalid',
                                                  'traits', jsonb_build_object('user_id', u_c::text, 'user_email', 'f38-pergi-' || v_tag || '@local.invalid')), now());
    insert into auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to)
    values (gen_random_uuid(), u_c, 'recovery_token', md5(v_tag), 'f38-pergi-' || v_tag || '@local.invalid');
    -- Sharon (re-verification at 435a2856): an entry naming the address under neither id (a failed sign-in), the IP
    -- GoTrue records with each entry, and a session's IP and user agent
    insert into auth.audit_log_entries (id, payload, created_at, ip_address)
    values (gen_random_uuid(), jsonb_build_object('action', 'login_failed', 'actor_id', '', 'traits', jsonb_build_object('user_email', 'f38-pergi-' || v_tag || '@local.invalid')), now(), '203.0.113.38'),
           (gen_random_uuid(), jsonb_build_object('action', 'logout', 'actor_id', u_c::text), now(), '203.0.113.39');
    insert into auth.sessions (id, user_id, created_at, updated_at, user_agent, ip)
    values (gen_random_uuid(), u_c, now(), now(), 'Peramban F38 ' || v_tag, '203.0.113.40');
    set local session_replication_role = origin;
    v_got := selftest.f37_sebagai(u_c, format('select public.minta_akun(%L, true)', 'DELETE_PERSONAL_DATA'));
    v_got := selftest.f37_sebagai(u_c, format('select public.minta_akun(%L, true)', 'CLOSE'));
    select q.id into v_req3 from public.account_requests q where q.person_id = p_c and q.kind = 'DELETE_PERSONAL_DATA';
    v_got := selftest.f37_sebagai(u_sys, format('select public.hapus_data_pribadi(%L, null)', v_req3));
    if v_got <> 'OK' then a06 := a06 || ('the deletion for a card holder: ' || v_got);
    else
      if (select u.email from auth.users u where u.id = u_kartu) <> 'card-f38' || v_tag || '@cards.local.invalid' then
        a06 := a06 || 'the class card''s address was changed'::text; end if;
      if exists (select 1 from public.account_activation_grants g where (g.person_id = p_c or g.consumed_by = u_c) and g.email like 'f38-pergi-%') then
        a06 := a06 || 'the activation grant keeps the email'::text; end if;
      if exists (select 1 from public.email_corrections c where c.person_id = p_c and (c.old_email like 'lama-%' or c.new_email like 'f38-pergi-%')) then
        a06 := a06 || 'an email correction keeps an address'::text; end if;
      if exists (select 1 from public.card_conversions c where c.person_id = p_c and c.new_email like 'f38-pergi-%') then
        a06 := a06 || 'a card conversion keeps the email'::text; end if;
      if v_job is not null and exists (select 1 from public.import_rows ir where ir.person_id = p_c and (ir.payload::text like '%Nama Asli%' or ir.payload::text like '%f38-pergi-%')) then
        a06 := a06 || 'the import row keeps the name or email'::text; end if;
      if exists (select 1 from public.person_usernames un where un.person_id = p_c and un.username like 'namaasli%') then
        a06 := a06 || 'the chosen username is kept'::text; end if;
      if exists (select 1 from auth.identities i where i.user_id = u_c and i.identity_data::text like '%f38-pergi-%') then
        a06 := a06 || 'auth.identities keeps the email'::text; end if;
      if exists (select 1 from auth.audit_log_entries x where x.payload::text like '%f38-pergi-' || v_tag || '%') then
        a06 := a06 || 'GoTrue''s audit log keeps the email'::text; end if;
      if exists (select 1 from auth.one_time_tokens x where x.user_id = u_c) then
        a06 := a06 || 'GoTrue keeps a one-time token naming the email'::text; end if;
      if exists (select 1 from auth.audit_log_entries x where x.ip_address in ('203.0.113.38', '203.0.113.39')) then
        a06 := a06 || 'GoTrue''s audit log keeps the person''s IP address'::text; end if;
      if exists (select 1 from auth.sessions x where x.user_id = u_c or x.user_agent like 'Peramban F38 %') then
        a06 := a06 || 'a session keeps the person''s IP and browser'::text; end if;
    end if;

    -- ═══════════════════════════════════ F38-H01..H06 Sharon's findings on 7a2c1751
    -- H06 the rollover is not a client endpoint
    if has_function_privilege('authenticated', 'public.period_rollover(uuid, uuid, uuid, jsonb)'::regprocedure, 'execute') then
      h06 := h06 || 'period_rollover is still executable by authenticated'::text; end if;
    -- H01 a school's date is its own
    begin
      v_got := selftest.f37_sebagai(u_admin, format('select public.atur_zona_waktu_sekolah(%L, %L)', v_inst, 'Asia/Jayapura'));
      if v_got not like 'PR%' and v_got not like '42501%' then h01 := h01 || ('a school''s admin set the time zone: ' || v_got); end if;
      v_got := selftest.f37_sebagai(u_sys, format('select public.atur_zona_waktu_sekolah(%L, %L)', v_inst, 'Asia/Jayapura'));
      if v_got <> 'OK' then h01 := h01 || ('the PINTAR Administrator could not set WIT: ' || v_got);
      else
        if public.hari_sekolah(v_inst) <> (now() at time zone 'Asia/Jayapura')::date then h01 := h01 || 'hari_sekolah does not answer the school''s own date'::text; end if;
        if not exists (select 1 from public.audit_log a where a.action = 'institution.time_zone_changed' and a.target_id = v_inst::text) then
          h01 := h01 || 'the change is not audited'::text; end if;
        insert into public.persons (display_name) values ('Murid F38 H1 ' || v_tag) returning persons.id into p_h;
        insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status, valid_from)
        values (p_h, v_inst, v_period, v_prog, 'ACTIVE', now() - interval '10 days') returning enrollments.id into e_h;
        v_got := selftest.f37_sebagai(u_admin, format('select public.akhiri_pendaftaran(%L, %L, %L, %L::date)', e_h, 'WITHDRAWN', null, (now() at time zone 'Asia/Jayapura')::date + 1));
        if v_got <> 'PR070:ENROL_DATE_INVALID' and v_got not like 'PR070:%DATE%' then h01 := h01 || ('WIT''s tomorrow: ' || v_got); end if;
        v_got := selftest.f37_sebagai(u_admin, format('select public.akhiri_pendaftaran(%L, %L, %L, null)', e_h, 'WITHDRAWN', null));
        if v_got <> 'OK' then h01 := h01 || ('an ending with no date: ' || v_got);
        elsif (select a.summary ->> 'effective_date' from public.audit_log a where a.action = 'enrollment.ended_with_reason' and a.target_id = e_h::text)
              is distinct from ((now() at time zone 'Asia/Jayapura')::date)::text then
          h01 := h01 || 'an ending with no date is not stamped with the school''s own date'::text; end if;
      end if;
    exception when others then h01 := h01 || ('the school time zone: ' || sqlerrm); end;

    -- H02 an ending does not use up an attempt
    u_h := selftest.f11_user('f38-murid-h2-' || v_tag || '@local.invalid', null, null);
    select a.person_id into p_h from public.accounts a where a.auth_user_id = u_h;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (p_h, v_inst, v_period, v_prog, 'ACTIVE') returning enrollments.id into e_h;
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (e_h, c_a, v_period);
    set local session_replication_role = replica;
    update public.assessment_definitions set attempt_limit = 1 where assessment_definitions.id = v_def;
    insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id, status, assigned_at)
    select v_inst, x.id, x.course_id, c_a, v_period, 'ACTIVE', now() from public.plp_releases x where x.id = v_rel returning learning_assignments.id into v_la2;
    insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id, academic_period_id, opens_at, status, assigned_at)
    values (v_inst, v_def, v_la2, c_a, v_period, now() - interval '1 day', 'OPEN', now()) returning assessment_assignments.id into v_aa_lim;
    set local session_replication_role = origin;
    s_h := selftest.f38_buka(v_tpl, p_h, e_h, c_a, v_la2, v_aa_lim);
    set local session_replication_role = replica;
    update public.assessment_sessions set status = 'TERMINATED', termination_cause = 'INSTITUTIONAL_REVOCATION', termination_reason = 'uji F38-H02'
     where assessment_sessions.id = s_h;
    set local session_replication_role = origin;
    perform selftest.as_user_uid(u_h);
    select m.reason into v_got from public.may_start_assessment(v_aa_lim) m;
    perform selftest.as_owner();
    if v_got = 'ATTEMPT_LIMIT_REACHED' then
      h02 := h02 || 'a sitting ended by the school counts against the attempt limit'::text; end if;

    -- H03 a sitting with no place does not block a departure
    insert into public.persons (display_name) values ('Murid F38 H3 ' || v_tag) returning persons.id into p_h;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status, valid_from)
    values (p_h, v_inst, v_period, v_prog, 'ACTIVE', now() - interval '10 days') returning enrollments.id into e_h;
    s_h := selftest.f38_buka(v_tpl, p_h, e_h, c_a, v_la2, v_aa_lim);
    set local session_replication_role = replica;
    update public.assessment_sessions set class_node_id = null, cohort_node_id = null where assessment_sessions.id = s_h;
    set local session_replication_role = origin;
    v_got := selftest.f37_sebagai(u_admin, format('select public.akhiri_pendaftaran(%L, %L, %L, null)', e_h, 'WITHDRAWN', null));
    if v_got <> 'OK' then h03 := h03 || ('a departure with a placeless open sitting: ' || v_got);
    elsif (select s.status::text || '/' || coalesce(s.termination_cause::text, '') from public.assessment_sessions s where s.id = s_h) <> 'TERMINATED/INSTITUTIONAL_REVOCATION'
       or not exists (select 1 from public.audit_log a where a.action = 'assessment_session.terminated' and a.target_id = s_h::text) then
      h03 := h03 || 'the placeless sitting was not ended as an institutional revocation with its audit row'::text; end if;

    -- H07 the owner (10 Nov): a school's departure ends its own sittings only. A learner enrolled at this school (A) and at
    -- another (B), with an open sitting at each, and one sitting recorded at B that carries A's enrolment: A's admin ends
    -- the enrolment at A; A's sitting ends, both of B's stay open
    insert into public.persons (display_name) values ('Murid F38 H7 ' || v_tag) returning persons.id into p_h7;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status, valid_from)
    values (p_h7, v_inst, v_period, v_prog, 'ACTIVE', now() - interval '10 days') returning enrollments.id into e_a7;
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_x, 'Tahun F38 X ' || v_tag, current_date - 30, current_date + 300) returning academic_periods.id into v_per_x;
    insert into public.enrollments (person_id, institution_id, academic_period_id, status, valid_from)
    values (p_h7, v_x, v_per_x, 'ACTIVE', now() - interval '10 days') returning enrollments.id into e_b7;
    s_a7 := selftest.f38_buka(v_tpl, p_h7, e_a7, c_a, v_la2, v_aa_lim);
    s_b7 := selftest.f38_buka(v_tpl, p_h7, e_a7, c_a, v_la2, v_aa_lim);
    s_bx7 := selftest.f38_buka(v_tpl, p_h7, e_a7, c_a, v_la2, v_aa_lim);
    set local session_replication_role = replica;
    update public.assessment_sessions set institution_id = v_x, enrollment_id = e_b7, academic_period_id = v_per_x, class_node_id = null
     where assessment_sessions.id = s_b7;
    update public.assessment_sessions set institution_id = v_x, academic_period_id = v_per_x, class_node_id = null
     where assessment_sessions.id = s_bx7;
    set local session_replication_role = origin;
    v_got := selftest.f37_sebagai(u_admin, format('select public.akhiri_pendaftaran(%L, %L, %L, null)', e_a7, 'WITHDRAWN', null));
    if v_got <> 'OK' then h07 := h07 || ('A''s departure: ' || v_got);
    else
      if (select s.status::text from public.assessment_sessions s where s.id = s_a7) <> 'TERMINATED' then
        h07 := h07 || 'A''s own sitting was not ended'::text; end if;
      if (select s.status::text from public.assessment_sessions s where s.id = s_b7) <> 'CREATED' then
        h07 := h07 || 'B''s sitting under B''s enrolment was ended by A''s departure'::text; end if;
      if (select s.status::text from public.assessment_sessions s where s.id = s_bx7) <> 'CREATED' then
        h07 := h07 || 'a sitting recorded at B was ended by A''s departure because it carries A''s enrolment'::text; end if;
      if (select e.status::text from public.enrollments e where e.id = e_b7) <> 'ACTIVE' then
        h07 := h07 || 'B''s enrolment was changed'::text; end if;
    end if;

    -- H08 Sharon (re-verification at 435a2856): a transfer contains the learner's open sittings as a departure does. A
    -- learner at A with an open sitting moves to B: the transfer ends the sitting at A as an institutional revocation
    insert into public.persons (display_name) values ('Murid F38 H8 ' || v_tag) returning persons.id into p_h8;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status, valid_from)
    values (p_h8, v_inst, v_period, v_prog, 'ACTIVE', now() - interval '10 days') returning enrollments.id into e_a8;
    s_a8 := selftest.f38_buka(v_tpl, p_h8, e_a8, c_a, v_la2, v_aa_lim);
    insert into public.transfers (person_id, from_enrollment_id, from_institution_id, to_institution_id, to_academic_period_id, status, reason)
    values (p_h8, e_a8, v_inst, v_x, v_per_x, 'REQUESTED', 'uji F38-H08') returning transfers.id into v_tf8;
    update public.transfers set status = 'AUTHORIZED', authorized_by = p_h8 where transfers.id = v_tf8;
    v_got := selftest.f37_sebagai(u_admin, format('select public.transfer_execute(%L)', v_tf8));
    if v_got <> 'OK' then h08 := h08 || ('the transfer: ' || v_got);
    elsif (select s.status::text || '/' || coalesce(s.termination_cause::text, '') from public.assessment_sessions s where s.id = s_a8) <> 'TERMINATED/INSTITUTIONAL_REVOCATION'
       or not exists (select 1 from public.audit_log a where a.action = 'assessment_session.terminated' and a.target_id = s_a8::text) then
      h08 := h08 || ('the transfer left the learner''s sitting at the old school '
                     || (select s.status::text from public.assessment_sessions s where s.id = s_a8) || ', not ended as an institutional revocation with its audit row'); end if;

    -- H04 a returning learner takes the chosen Kelas's programme
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_dep, 'PROGRAMME', 'Program F38 tiga ' || v_tag) returning org_nodes.id into v_x2;
    insert into public.persons (display_name) values ('Murid F38 H4 ' || v_tag) returning persons.id into p_h;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status, valid_from)
    values (p_h, v_inst, v_period, v_x2, 'ACTIVE', now() - interval '10 days') returning enrollments.id into e_h;
    v_got := selftest.f37_sebagai(u_admin, format('select public.akhiri_pendaftaran(%L, %L, %L, null)', e_h, 'WITHDRAWN', null));
    v_got := selftest.f37_sebagai(u_admin, format('select public.daftarkan_kembali(%L, %L, %L, %L, %L, null)', p_h, v_inst, 'RETURN', 'kembali bersekolah di sini', c_a));
    if v_got <> 'OK' then h04 := h04 || ('the return: ' || v_got);
    elsif (select en.programme_id from public.enrollments en where en.person_id = p_h and en.status in ('PENDING', 'ACTIVE')) is distinct from v_prog then
      h04 := h04 || 'the returning learner keeps the old programme, not the chosen Kelas''s'::text; end if;

    -- H05 an ending in a year that has ended is not corrected
    insert into public.academic_periods (institution_id, name, starts_on, ends_on)
    values (v_inst, 'F38H lama ' || v_tag, (select ap.starts_on - 400 from public.academic_periods ap where ap.id = v_period),
            (select ap.starts_on - 40 from public.academic_periods ap where ap.id = v_period)) returning academic_periods.id into v_old_p;
    insert into public.persons (display_name) values ('Murid F38 H5 ' || v_tag) returning persons.id into p_h;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status, valid_from)
    values (p_h, v_inst, v_old_p, v_prog, 'ACTIVE', now() - interval '500 days') returning enrollments.id into e_h;
    v_got := selftest.f37_sebagai(u_admin, format('select public.akhiri_pendaftaran(%L, %L, %L, %L::date)', e_h, 'WITHDRAWN', null,
               (select ap.ends_on - 10 from public.academic_periods ap where ap.id = v_old_p)));
    if v_got <> 'OK' then h05 := h05 || ('the old year''s ending: ' || v_got);
    else
      v_got := selftest.f37_sebagai(u_admin, format('select public.daftarkan_kembali(%L, %L, %L, %L, null, %L)', p_h, v_inst, 'CORRECTION', 'dicatat keliru waktu itu', e_h));
      if v_got <> 'PR070:ENROL_YEAR_CLOSED' then h05 := h05 || ('correcting an ending in a closed year: ' || v_got || ' (expected PR070:ENROL_YEAR_CLOSED)'); end if;
      perform selftest.as_user_uid(u_admin);
      select * into v_hk from public.murid_keluar(v_inst) mk where mk.person_id = p_h;
      perform selftest.as_owner();
      if v_hk.person_id is null or v_hk.bisa_dikoreksi then h05 := h05 || 'murid_keluar still offers the correction'::text; end if;
    end if;

    -- ═══════════════════════════════════ F38-O01..O03 the owner's rulings (9 Nov)
    -- O01 an attempt limit holds across reassignment of the same assessment
    if v_aa_lim is not null then
      u_o := selftest.f11_user('f38-murid-o1-' || v_tag || '@local.invalid', null, null);
      select a.person_id into p_o from public.accounts a where a.auth_user_id = u_o;
      insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
      values (p_o, v_inst, v_period, v_prog, 'ACTIVE') returning enrollments.id into e_o;
      insert into public.memberships (enrollment_id, node_id, academic_period_id) values (e_o, c_a, v_period);
      s_h := selftest.f38_buka(v_tpl, p_o, e_o, c_a, v_la2, v_aa_lim);
      set local session_replication_role = replica;
      update public.assessment_sessions set status = 'FINALIZED' where assessment_sessions.id = s_h;
      -- the lesson ended and given to the class again: a new learning assignment, its assessment the same definition
      insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id, status, assigned_at)
      select v_inst, x.id, x.course_id, c_a, v_period, 'ACTIVE', now() from public.plp_releases x where x.id = v_rel returning learning_assignments.id into v_la_o;
      insert into public.assessment_assignments (institution_id, assessment_definition_id, learning_assignment_id, node_id, academic_period_id, opens_at, status, assigned_at)
      values (v_inst, v_def, v_la_o, c_a, v_period, now() - interval '1 day', 'OPEN', now()) returning assessment_assignments.id into v_aa_o;
      set local session_replication_role = origin;
      perform selftest.as_user_uid(u_o);
      select m.reason into v_got from public.may_start_assessment(v_aa_o) m;
      perform selftest.as_owner();
      if v_got is distinct from 'ATTEMPT_LIMIT_REACHED' then
        o01 := o01 || ('a reassignment of the same assessment reset the attempt limit of 1: ' || coalesce(v_got, 'null')); end if;
      -- O04 owner ruling (10 Nov): counted within one school and one school year; a teacher's administrative ending is
      -- not an attempt, an integrity ending still is
      insert into public.academic_periods (institution_id, name, starts_on, ends_on)
      values (v_inst, 'Tahun lalu F38 ' || v_tag, date '2001-07-01', date '2002-06-30') returning academic_periods.id into v_per_lalu;
      set local session_replication_role = replica;
      update public.assessment_assignments set academic_period_id = v_per_lalu where assessment_assignments.id = v_aa_lim;
      set local session_replication_role = origin;
      perform selftest.as_user_uid(u_o); select m.reason into v_got from public.may_start_assessment(v_aa_o) m; perform selftest.as_owner();
      if v_got is not distinct from 'ATTEMPT_LIMIT_REACHED' then o04 := o04 || 'an attempt of another school year was counted'::text; end if;
      set local session_replication_role = replica;
      update public.assessment_assignments set academic_period_id = v_period where assessment_assignments.id = v_aa_lim;
      update public.assessment_sessions set institution_id = v_x where assessment_sessions.id = s_h;
      set local session_replication_role = origin;
      perform selftest.as_user_uid(u_o); select m.reason into v_got from public.may_start_assessment(v_aa_o) m; perform selftest.as_owner();
      if v_got is not distinct from 'ATTEMPT_LIMIT_REACHED' then o04 := o04 || 'an attempt at another school was counted'::text; end if;
      set local session_replication_role = replica;
      update public.assessment_sessions set institution_id = v_inst, status = 'TERMINATED', termination_cause = 'ADMINISTRATIVE_TERMINATION' where assessment_sessions.id = s_h;
      set local session_replication_role = origin;
      perform selftest.as_user_uid(u_o); select m.reason into v_got from public.may_start_assessment(v_aa_o) m; perform selftest.as_owner();
      if v_got is not distinct from 'ATTEMPT_LIMIT_REACHED' then o04 := o04 || 'a sitting the teacher ended administratively was counted'::text; end if;
      set local session_replication_role = replica;
      update public.assessment_sessions set termination_cause = 'SECURITY_INTERVENTION' where assessment_sessions.id = s_h;
      set local session_replication_role = origin;
      perform selftest.as_user_uid(u_o); select m.reason into v_got from public.may_start_assessment(v_aa_o) m; perform selftest.as_owner();
      if v_got is distinct from 'ATTEMPT_LIMIT_REACHED' then o04 := o04 || ('an integrity ending was not counted: ' || coalesce(v_got, 'null')); end if;
    else
      o01 := o01 || 'fixture: H02 made no limited assessment'::text;
    end if;

    -- O03 «Disiplin» is not a platform suspension
    v_got := selftest.f37_sebagai(u_sys, format('select public.tangguhkan_akun(%L, %L, %L)', p_guru_a, 'DISCIPLINARY', null));
    if v_got <> 'PR140:ACCOUNT_CATEGORY_INVALID' then o03 := o03 || ('a disciplinary platform suspension: ' || v_got); end if;

    -- O02 a closed account asks to be reopened from outside, and is reopened only by the PINTAR Administrator after
    -- identity verification
    if has_function_privilege('authenticated', 'public.minta_buka_kembali(text, text)'::regprocedure, 'execute')
       or has_function_privilege('anon', 'public.minta_buka_kembali(text, text)'::regprocedure, 'execute') then
      o02 := o02 || 'the public request is callable by a client, not only by its server route'::text; end if;
    -- (the owner, 9 Nov: reopening restores signing in, never the former authority) a Guru of Kelas A closes the account
    u_t := selftest.f11_user('f38-tutup-' || v_tag || '@local.invalid', 'EDUCATOR', c_a);
    select a.person_id into p_t from public.accounts a where a.auth_user_id = u_t;
    v_got := selftest.f37_sebagai(u_t, format('select public.minta_akun(%L, true)', 'CLOSE'));
    select count(*) into v_cnt from public.account_requests q where q.kind = 'REOPEN';
    perform public.minta_buka_kembali('tidak-ada-' || v_tag || '@local.invalid', 'tolong buka akun saya, hubungi 0812');
    perform public.minta_buka_kembali('f38-guru-a-' || v_tag || '@local.invalid', 'akun ini belum ditutup sama sekali');
    if (select count(*) from public.account_requests q where q.kind = 'REOPEN') <> v_cnt then
      o02 := o02 || 'an unknown or open account recorded a reopening request'::text; end if;
    if (public.minta_buka_kembali('f38-unknown@local.invalid', 'pesan yang cukup panjang')) is distinct from
       (public.minta_buka_kembali('F38-TUTUP-' || v_tag || '@LOCAL.INVALID', 'saya ingin kembali, hubungi saya di 0812')) then
      o02 := o02 || 'the answer tells an unknown address from a closed account'::text; end if;
    select q.id into v_rq from public.account_requests q where q.person_id = p_t and q.kind = 'REOPEN' and q.status = 'RECEIVED';
    if v_rq is null then o02 := o02 || 'the closed account''s request was not recorded'::text;
    else
      perform public.minta_buka_kembali((select p.pintar_id from public.persons p where p.id = p_t), 'sekali lagi lewat PINTAR ID');
      if (select count(*) from public.account_requests q where q.person_id = p_t and q.kind = 'REOPEN') <> 1 then
        o02 := o02 || 'a second request made a second row'::text; end if;
      if not exists (select 1 from public.person_suspensions x where x.person_id = p_t and x.ended_at is null) then
        o02 := o02 || 'the request reopened the account by itself'::text; end if;
      v_got := selftest.f37_sebagai(u_sys, format('select public.aktifkan_kembali_akun(%L, %L)', p_t, 'langsung tanpa permintaan'));
      if v_got <> 'PR140:ACCOUNT_REOPEN_VIA_REQUEST' then o02 := o02 || ('a closed account reopened without its request: ' || v_got); end if;
      v_got := selftest.f37_sebagai(u_admin, format('select public.buka_kembali_akun(%L, %L)', v_rq, 'identitas dicocokkan lewat telepon'));
      if v_got <> 'PR140:ACCOUNT_NOT_ALLOWED' then o02 := o02 || ('a school''s admin reopened: ' || v_got); end if;
      v_got := selftest.f37_sebagai(u_sys, format('select public.buka_kembali_akun(%L, %L)', v_rq, 'pendek'));
      if v_got <> 'PR140:ACCOUNT_NOTE_REQUIRED' then o02 := o02 || ('reopening without saying how identity was verified: ' || v_got); end if;
      v_got := selftest.f37_sebagai(u_sys, format('select public.buka_kembali_akun(%L, %L)', v_rq, 'identitas dicocokkan lewat panggilan video'));
      if v_got <> 'OK' then o02 := o02 || ('the verified reopening: ' || v_got);
      elsif exists (select 1 from public.person_suspensions x where x.person_id = p_t and x.ended_at is null)
         or (select q.status from public.account_requests q where q.id = v_rq) <> 'DONE'
         or (select u.banned_until from auth.users u where u.id = u_t) is not null
         or not exists (select 1 from public.audit_log a where a.action = 'account.reopened' and a.target_id = p_t::text
                          and a.summary ->> 'request_id' = v_rq::text) then
        o02 := o02 || 'after the verified reopening the account is not open, the request not DONE, or no account.reopened row naming it'::text;
      elsif exists (select 1 from public.role_assignments ra where ra.person_id = p_t and ra.revoked_at is null)
         or (select jsonb_array_length(a.summary -> 'roles_ended') from public.audit_log a where a.action = 'account.reopened' and a.target_id = p_t::text) is distinct from 1 then
        o02 := o02 || 'the reopened account got its former school role back (it must be given again by the school), or the ending is not recorded'::text; end if;
    end if;

    -- O05 Daisy (435a2856, §2.4): the reopening form takes what signing in takes, the username too (and still the PINTAR ID)
    u_t5 := selftest.f11_user('f38-tutup5-' || v_tag || '@local.invalid', 'EDUCATOR', c_a);
    select a.person_id into p_t5 from public.accounts a where a.auth_user_id = u_t5;
    insert into public.person_usernames (person_id, username) values (p_t5, 'f38tutup' || v_tag);
    v_got := selftest.f37_sebagai(u_t5, format('select public.minta_akun(%L, true)', 'CLOSE'));
    perform public.minta_buka_kembali(' F38TUTUP' || upper(v_tag) || ' ', 'saya ingin kembali, lewat nama pengguna');
    if not exists (select 1 from public.account_requests q where q.person_id = p_t5 and q.kind = 'REOPEN' and q.status = 'RECEIVED') then
      o05 := o05 || 'a closed account''s request by its username was not recorded'::text; end if;

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
      ('F38-W06', 'Owner ruling (10 Nov): a withdrawn assignment is not counted', w06,
       'the finished sitting of an ENDED assignment is in Kelas A''s figures; once the assignment is WITHDRAWN it is not (sessions and results), and its result is kept'),
      ('F38-W07', 'Defect (10 Nov): a closed lesson''s outcome stays seen', w07,
       'the learner finds the ENDED assignment in my_learning_history with its status, not in my_learning_assignments, and reads its cycle state'),
      ('F38-W08', 'Defect (10 Nov): a sitting the school ended says so', w08,
       'submitting a TERMINATED sitting is refused PR003 SESSION_ENDED_BY_SCHOOL'),
      ('F38-H08', 'Sharon (435a2856): a transfer contains the learner''s open sittings', h08,
       'a learner at A with an open sitting is transferred to B: the sitting at A is TERMINATED as INSTITUTIONAL_REVOCATION, with its audit row'),
      ('F38-H07', 'The owner (10 Nov): a school''s departure ends its own sittings only', h07,
       'a learner enrolled at A and B: A''s admin ends the enrolment at A; A''s open sitting ends; B''s sitting under B''s enrolment, a sitting recorded at B that carries A''s enrolment, and B''s enrolment are untouched'),
      ('F38-W14', 'The owner (10 Nov): a lesson no longer shared keeps its name on the class page', w14,
       'judul_materi_kelas gives the class''s Guru the title of an assignment whose lesson PINTAR no longer shares (no content); a Guru of another Kelas at the school and another school''s admin are refused'),
      ('F38-W15', 'Daisy (435a2856): an ended assignment says when and why on the class page', w15,
       'riwayat_penugasan_kelas gives the class''s Guru the ENDED assignment''s kind, moment and reason from its audit row, lists nothing in force, and refuses a Guru of another Kelas at the school, another school''s admin and a learner'),
      ('F38-W09', 'Sharon (addendum): a figure under MC-9 keeps MC-9''s population', w09,
       'evaluated under MC-9, which names no learning_assignments source, the withdrawn assignment''s sitting is in Kelas A''s figures; under MC-10 it is not'),
      ('F38-W10', 'Sharon (addendum): verified credentials leave a withdrawn assignment''s certificate out', w10,
       'the certificate of the withdrawn assignment''s sitting is not in scoped_certificates; the certificate itself stays ISSUED'),
      ('F38-W11', 'Sharon (addendum): the learner''s own result keeps a withdrawn sitting, marked', w11,
       'calc_learner_result, as learner.result evaluates it, lists the withdrawn assignment''s sitting with ditarik = true'),
      ('F38-W12', 'Owner ruling (10 Nov): question health leaves withdrawn answers out', w12,
       'service_item_statistics no longer counts the withdrawn assignment''s answers; the answers are kept'),
      ('F38-W13', 'Sharon (addendum): a closed lesson''s content is not returned; its outcome stays listed after a move', w13,
       'learner_lessons refuses the ENDED assignment; after the learner leaves the class my_learning_history still lists it, not as current'),
      ('F38-O04', 'Owner ruling (10 Nov): attempts are counted within one school and one school year', o04,
       'an attempt of another school year or at another school is not counted; a sitting the teacher ended administratively is not counted; an integrity ending (SECURITY_INTERVENTION) is'),
      ('F38-R01', 'Evidence survives the year: a class moves up and nothing it earned is lost', r01,
       'after «Kenaikan kelas dan kelulusan» the learner is in Kelas 6 next year; the sitting stays on the old class and the old ENDED/EXPIRED enrolment; its result, the certificate and lesson progress are unchanged; the learner still reads all four (and my_certificate) and the old class''s Guru the sitting and its result; the public check answers BERLAKU'),
      ('F38-C01', 'W2.22 «Terbitkan ulang»: who may, and what the preview shows', c01,
       'the school''s admin reads the sealed name beside the corrected one (something would change); a Guru, the holder and another school''s admin are refused CERT_NOT_ALLOWED'),
      ('F38-C02', 'W2.22: refusals write nothing', c02,
       'a 5-character reason, a certificate with nothing to correct, a revoked certificate, a Guru and another school''s admin are refused; no certificate added, the original ISSUED'),
      ('F38-C03', 'W2.22: corrected by its replacement', c03,
       'the replacement is prepared ELIGIBLE (not public) with the corrected name, a new number and token, the original''s result, the reason and the actor, once; sealed by the server only, it is ISSUED and the original SUPERSEDED with its sealed history unchanged; the public check answers BERLAKU and DIGANTIKAN; one certificate.superseded row'),
      ('F38-C04', 'W2.22: one replacement per certificate', c04,
       'a superseded certificate is neither corrected nor revoked again; a second replacement of it cannot be sealed; the replacement itself is revoked'),
      ('F38-S01', 'E5 «Akhiri tugas di sekolah ini»', s01,
       'the Guru''s roles end with the reason (role.revoked), one staff.ended_at_school row with the category and the date, the person stays, and authority over Kelas A ends at once'),
      ('F38-S02', 'E5: refusals write nothing', s02,
       'an unknown category, a short reason, a future date, the admin''s own roles, a Guru, another school''s admin and a person with no role are refused; nothing ends, nothing is audited'),
      ('F38-S03', '«Ubah peran & tanggung jawab»: the review', s03,
       'a Guru made Kepala departemen too is shown review, integrity and management decisions gained at the Departemen, drafting kept at Kelas B, nothing lost; the review writes nothing'),
      ('F38-S04', '«Ubah peran»: refusals and atomicity', s04,
       'a stale review, SYSTEM_ADMIN, a role at another school, Admin sekolah without its second press, one bad addition beside a good one and a Guru are refused; nothing changes, nothing is audited'),
      ('F38-S05', '«Ubah peran»: promotion, demotion with its queue warning, a move in one press', s05,
       'the promotion adds the role; the demotion''s review warns of the decision left with no one, which waits unreassigned, and teaching stays; the move leaves one live role at Kelas A, the old one ended as the new began; one role.changed row each'),
      ('F38-A01', 'Platform suspension', a01, 'sign-in refused (banned), the token refused PT403, roles and evidence untouched, one account.suspended row with the category'),
      ('F38-A02', 'Suspension refusals write nothing', a02, 'a school''s admin, the administrator''s own account, an unknown category, «Lainnya» without a note and a second suspension are refused; nothing written'),
      ('F38-A03', 'Reactivation', a03, 'refused without a reason; with one, sign-in allowed and the token answers again; one account.reactivated row'),
      ('F38-A04', 'L2 / L3: the person''s own requests', a04, 'a learner is sent to the school, no confirmation is refused; a deletion request is RECEIVED once and read back; the closure is CLOSED_AT_REQUEST at once, its request DONE, sign-in and every request refused; the platform''s queue holds the deletion request'),
      ('F38-S06', 'Sharon §15: queues, visibility and the second press', s06, 'Kepala departemen → Dekan over the same place warns of nothing; ending the last one who could decide records the decision left waiting; a person with no tie to the school is refused STAFF_UNKNOWN; removing another Admin sekolah needs the second press'),
      ('F38-C05', 'Sharon §14: one pending replacement per certificate', c05, 'a preparation with another reason is the same pending replacement, with the same number, the holder''s counter unmoved, carrying the reason given last'),
      ('F38-A06', 'Sharon §16: L4 for a card holder, and every copy of the name and email', a06, 'the deletion goes through with a class card held; the card''s address stays; the activation grant, email corrections, card conversion, import row, username and auth.identities keep neither name nor email'),
      ('F38-A07', 'Sharon §16: a live platform role does not close itself', a07, 'the PINTAR Administrator''s own CLOSE is refused ACCOUNT_PLATFORM_ROLE and nothing is closed'),
      ('F38-O01', 'Owner ruling 1: an attempt limit holds across reassignment', o01, 'a learner who used the one attempt cannot start the same assessment again when the lesson is given to the class again'),
      ('F38-O02', 'Owner ruling 2: a closed account asks to be reopened', o02, 'the public request is server-only, records only for a closed account, answers the same for any address, is one per person and reopens nothing by itself; a closed account is reopened only from its request, by the PINTAR Administrator, with how identity was verified; DONE and audited; the former Guru role is not restored (ended, recorded)'),
      ('F38-O05', 'Daisy (435a2856): the reopening form takes what signing in takes', o05, 'a closed account''s request by its username (any case, spaces trimmed) is recorded, as by its email or PINTAR ID'),
      ('F38-O03', 'Owner ruling 3: no disciplinary platform suspension', o03, 'DISCIPLINARY is refused ACCOUNT_CATEGORY_INVALID'),
      ('F38-H01', 'Sharon F1: a school''s date is its own', h01, 'the PINTAR Administrator sets WIT (a school''s admin refused, audited); hari_sekolah answers WIT''s date; an ending with no date is stamped with it; WIT''s tomorrow is refused'),
      ('F38-H02', 'Sharon F2: an ending does not use up an attempt', h02, 'a sitting TERMINATED as INSTITUTIONAL_REVOCATION is not counted against an attempt limit of 1'),
      ('F38-H03', 'Sharon F3: a placeless open sitting does not block a departure', h03, 'the enrolment ends; the sitting with neither class nor Angkatan is TERMINATED as INSTITUTIONAL_REVOCATION, audited'),
      ('F38-H04', 'Sharon F4: a return takes the chosen Kelas''s programme', h04, 'a learner who left programme 3 and returns into Kelas A is enrolled in Kelas A''s programme'),
      ('F38-H05', 'Sharon F5: an ending in a closed year is not corrected', h05, 'CORRECTION is refused ENROL_YEAR_CLOSED and murid_keluar does not offer it'),
      ('F38-H06', 'Sharon F6: period_rollover is not a client endpoint', h06, 'authenticated cannot execute period_rollover'),
      ('F38-A05', 'L4: deletion of what needs no retention', a05, 'only the PINTAR Administrator, only for a closed account: the name becomes the PINTAR ID, the photo and sign-in email go, anonymized_at is set, roles and audit kept, the request DONE')) t(tid, tarea, probs, good) loop
    id := r.tid; area := r.tarea;
    ok := v_fatal = '' and cardinality(r.probs) = 0;
    detail := case when v_fatal <> '' then 'fixture: ' || v_fatal when ok then r.good else array_to_string(r.probs, '; ') end;
    return next;
  end loop;
  id := 'F38-DONE'; area := 'fable38'; ok := true; detail := 'complete'; return next;
end $$;
revoke all on function selftest.run_fable38() from public;
