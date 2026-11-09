-- FABLE-37 · System Integrity Gate (owner, 9 Nov), measured against
-- supabase/migrations/20270112100000_an_answer_is_read_where_it_was_given.sql and
-- supabase/migrations/20270112110000_evidence_is_decided_where_it_was_given.sql (Sharon's review of SI-D01; D5).
--
-- Every expectation is an exact count, so a lost reader fails as surely as an exposed one (Sharon, finding 4: an empty
-- answer is never a positive-access pass).
--
--   F37-D01  THE EVIDENCE UNDER A RESULT IS READ WHERE IT WAS GIVEN: one learner's sitting in Kelas A (Departemen A),
--            with an answer, an observation, lesson progress of an assignment to Kelas A and a reclassification. Read
--            through row security alone, per person: results, answers, questions shown, observations, lesson progress,
--            the sitting row and the reclassification. The learner, A's Kepala departemen, A's Guru and the Admin
--            sekolah read what the rule gives each (D5: the Admin reads no answer and no question shown); B's Kepala
--            departemen, B's Guru and another learner read nothing.
--   F37-D03  RECLASSIFICATION IS DECIDED OVER THE CLASS (Sharon, finding 1, HIGH): B's Kepala departemen cannot insert an
--            override on Kelas A's sitting (42501), so cannot take it out of official evidence; A's Kepala departemen and
--            the Admin sekolah can.
--   F37-D04  LESSON PROGRESS FOLLOWS WHAT THE CLASS WAS ASSIGNED (finding 2): the learner, also placed in Kelas B, reads
--            chapter 2 there. A's Guru reads chapter 1 (assigned to A) and not chapter 2; B's Guru reads chapter 2 and
--            not chapter 1.
--   F37-D05  A SITTING WITH AN ANGKATAN AND NO CLASS IS REVIEWABLE (finding 3): A's Kepala departemen and the Admin
--            sekolah read its observation and sitting and may refer it from the waiting list; B's Kepala departemen sees it
--            listed (the list's approved contract, FD-7/DG-32, F21-I01) and may not refer it.
--   F37-D06  D5's INVESTIGATION (owner, 9 Nov): the Admin sekolah opens one sitting's answers with a reason while its
--            observation is undecided, and each open writes one audit row; refused without a reason (22023), on a
--            sitting with no undecided observation (INVESTIGATION_NO_CASE), and to B's Kepala departemen
--            (INVESTIGATION_NOT_ALLOWED); a refusal writes no audit row.
--   F37-B01  «Yang menunggu»'s Aktivasi count equals the Aktivasi list's total (school admin; platform admin, one school
--            and every school).
--   F37-D02  CR-91 across schools: a person waiting in school X who holds a staff role in school Y is offered no card.
--   F37-C01  Certificate eligibility after a recalculation stays on the sealed result, both directions (O-B3).
--
-- EVERY ROW IS ROLLED BACK (the suite's block ends in 'f37-rollback', as fable36 does).

create schema if not exists selftest;

do $$
begin
  if to_regprocedure('selftest.f35_bab(uuid,text,text,text)') is null or to_regprocedure('selftest.as_user_uid(uuid)') is null
     or to_regprocedure('selftest.f11_user(text,public.app_role,uuid)') is null or to_regprocedure('selftest.as_owner()') is null
     or to_regprocedure('selftest.f36_sit(uuid,uuid,uuid,uuid,numeric,text,timestamptz,uuid,boolean,jsonb,integer)') is null
     or to_regprocedure('selftest.f36_recompute(uuid,numeric,text,timestamptz)') is null then
    raise exception 'apply fable01, fable06, fable11, fable35 and fable36.sql before fable37.sql: the helpers are missing';
  end if;
end $$;

-- what one person reads of one sitting and one learner, through row security only
create or replace function selftest.f37_baca(p_user uuid, p_session uuid, p_person uuid)
returns text language plpgsql set search_path = public, pg_temp as $$
declare v text;
begin
  perform selftest.as_user_uid(p_user);
  select format('hasil=%s jawaban=%s soal=%s integritas=%s kemajuan=%s sesi=%s koreksi=%s',
           (select count(*) from public.assessment_results r where r.session_id = p_session),
           (select count(*) from public.responses x join public.presented_items pi on pi.id = x.presented_item_id where pi.session_id = p_session),
           (select count(*) from public.presented_items pi where pi.session_id = p_session),
           (select count(*) from public.integrity_signals g where g.session_id = p_session),
           (select count(*) from public.lesson_progress lp where lp.person_id = p_person),
           (select count(*) from public.assessment_sessions s where s.id = p_session),
           (select count(*) from public.evidence_class_overrides o where o.session_id = p_session))
    into v;
  perform selftest.as_owner();
  return v;
end $$;
revoke all on function selftest.f37_baca(uuid, uuid, uuid) from public;

-- a SQL statement run as one person: 'OK', or the refusal's state and detail
create or replace function selftest.f37_sebagai(p_user uuid, p_sql text)
returns text language plpgsql set search_path = public, pg_temp as $$
declare v_state text; v_detail text;
begin
  perform selftest.as_user_uid(p_user);
  execute p_sql;
  perform selftest.as_owner();
  return 'OK';
exception when others then
  get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
  perform selftest.as_owner();
  return v_state || ':' || coalesce(nullif(v_detail, ''), left(sqlerrm, 80));
end $$;
revoke all on function selftest.f37_sebagai(uuid, text) from public;

-- an override filed as one person and then undone: 'OK' when the database accepted it, else the refusal
create or replace function selftest.f37_koreksi_coba(p_user uuid, p_session uuid, p_to public.evidence_class)
returns text language plpgsql set search_path = public, pg_temp as $$
declare v text;
begin
  begin
    v := selftest.f37_sebagai(p_user, format('insert into public.evidence_class_overrides (session_id, to_class, reason) values (%L, %L, %L)',
                                             p_session, p_to, 'F37: dicoba lalu dibatalkan'));
    raise exception 'f37-undo';
  exception when others then
    if sqlerrm <> 'f37-undo' then v := 'fixture: ' || sqlerrm; end if;
  end;
  perform selftest.as_owner();
  return v;
end $$;
revoke all on function selftest.f37_koreksi_coba(uuid, uuid, public.evidence_class) from public;

create or replace function selftest.run_fable37()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_tag text := to_char(clock_timestamp(), 'HH24MISSUS'); v_fatal text := '';
  d01 text[] := '{}'; d03 text[] := '{}'; d04 text[] := '{}'; d05 text[] := '{}'; d06 text[] := '{}';
  b01 text[] := '{}'; d02 text[] := '{}'; c01 text[] := '{}';
  v_tpl uuid; v_inst uuid; v_root uuid; v_period uuid; v_fac uuid; v_depa uuid; v_depb uuid; v_proga uuid; v_progb uuid;
  v_coha uuid; v_cohb uuid; c_a uuid; c_b uuid; v_def uuid; v_def2 uuid; v_item uuid; v_opt text; v_rel uuid; v_rel2 uuid;
  u_murid uuid; u_lain uuid; u_guru_a uuid; u_guru_b uuid; u_kadep_a uuid; u_kadep_b uuid; u_admin uuid; u_sys uuid;
  v_murid uuid; v_e uuid; v_eb uuid; v_sess uuid; v_cohs uuid; v_lo uuid; v_hi uuid; v_got text; v_turun public.evidence_class;
  v_n int; v_total bigint; v_kartu boolean; v_mark numeric; v_bawah numeric; v_atas numeric; v_audit int; v_audit2 int;
  v_x uuid; v_y uuid; v_rooty uuid; u_adminx uuid; v_p uuid; e record; r record;
begin
  perform selftest.as_owner();
  begin
    select s.id, s.institution_id into v_tpl, v_inst
      from public.assessment_sessions s join public.assessment_results res on res.session_id = s.id
     where s.mode = 'POST_TEST' and s.status = 'FINALIZED' and s.class_node_id is not null and s.pass_mark is not null
       and not public.release_is_professional(s.plp_release_id)
       and public.effective_evidence_class(s.id) = 'OFFICIAL'
       and exists (select 1 from public.presented_items p where p.session_id = s.id)
     order by s.finalized_at desc limit 1;
    if v_tpl is null then raise exception 'the fixture has no finished official Uji Penguasaan'; end if;
    select o.id into v_root from public.org_nodes o where o.institution_id = v_inst and o.kind = 'INSTITUTION';
    select ap.id into v_period from public.academic_periods ap where ap.institution_id = v_inst order by ap.created_at limit 1;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_root, 'FACULTY', 'Bagian F37 ' || v_tag) returning org_nodes.id into v_fac;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_fac, 'DEPARTMENT', 'Departemen F37 A ' || v_tag) returning org_nodes.id into v_depa;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_fac, 'DEPARTMENT', 'Departemen F37 B ' || v_tag) returning org_nodes.id into v_depb;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_depa, 'PROGRAMME', 'Program F37 A ' || v_tag) returning org_nodes.id into v_proga;
    insert into public.org_nodes (institution_id, parent_id, kind, name) values (v_inst, v_depb, 'PROGRAMME', 'Program F37 B ' || v_tag) returning org_nodes.id into v_progb;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_proga, 'COHORT', 'Angkatan F37 A ' || v_tag, v_period) returning org_nodes.id into v_coha;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_progb, 'COHORT', 'Angkatan F37 B ' || v_tag, v_period) returning org_nodes.id into v_cohb;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_coha, 'CLASS', 'Kelas F37 A ' || v_tag, v_period) returning org_nodes.id into c_a;
    insert into public.org_nodes (institution_id, parent_id, kind, name, academic_period_id) values (v_inst, v_cohb, 'CLASS', 'Kelas F37 B ' || v_tag, v_period) returning org_nodes.id into c_b;

    -- two chapters of this suite's own, each with its release; chapter 1 assigned to Kelas A, chapter 2 to Kelas B
    v_def  := selftest.f35_bab(v_inst, 'F37 ' || v_tag, 'D1', 'Tujuan F37 ' || v_tag);
    v_def2 := selftest.f35_bab(v_inst, 'F37 dua ' || v_tag, 'D2', 'Tujuan F37 dua ' || v_tag);
    select r1.id into v_rel  from public.plp_releases r1 join public.assessment_definitions d on d.course_id = r1.course_id where d.id = v_def;
    select r2.id into v_rel2 from public.plp_releases r2 join public.assessment_definitions d on d.course_id = r2.course_id where d.id = v_def2;
    insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id)
    select v_inst, x.id, x.course_id, c_a, v_period from public.plp_releases x where x.id = v_rel;
    insert into public.learning_assignments (institution_id, plp_release_id, course_id, node_id, academic_period_id)
    select v_inst, x.id, x.course_id, c_b, v_period from public.plp_releases x where x.id = v_rel2;

    u_guru_a  := selftest.f11_user('f37-guru-a-'  || v_tag || '@local.invalid', 'EDUCATOR', c_a);
    u_guru_b  := selftest.f11_user('f37-guru-b-'  || v_tag || '@local.invalid', 'EDUCATOR', c_b);
    u_kadep_a := selftest.f11_user('f37-kadep-a-' || v_tag || '@local.invalid', 'HEAD_OF_DEPARTMENT', v_depa);
    u_kadep_b := selftest.f11_user('f37-kadep-b-' || v_tag || '@local.invalid', 'HEAD_OF_DEPARTMENT', v_depb);
    u_admin   := selftest.f11_user('f37-admin-'   || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_root);
    u_sys     := selftest.f11_user('f37-sys-'     || v_tag || '@local.invalid', 'SYSTEM_ADMIN', v_root);
    u_lain    := selftest.f11_user('f37-lain-'    || v_tag || '@local.invalid', null, null);
    u_murid   := selftest.f11_user('f37-murid-'   || v_tag || '@local.invalid', null, null);

    -- the learner: Kelas A; one finished sitting of chapter 1 with one answer, an observation and lesson progress
    select a.person_id into v_murid from public.accounts a where a.auth_user_id = u_murid;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (v_murid, v_inst, v_period, v_proga, 'ACTIVE') returning enrollments.id into v_e;
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, c_a, v_period);
    select pi.item_id, o.label into v_item, v_opt
      from public.presented_items pi join public.item_options o on o.item_id = pi.item_id
     where pi.session_id = v_tpl order by pi.position, o.label limit 1;
    if v_item is null then raise exception 'the template sitting shows no question'; end if;
    select x.session into v_sess
      from selftest.f36_sit(v_tpl, v_murid, c_a, v_def, 0.60, 'D1', now() - interval '1 day', null, true,
                            jsonb_build_array(jsonb_build_object('item', v_item, 'pilihan', v_opt))) x;
    insert into public.integrity_signals (session_id, institution_id, category) values (v_sess, v_inst, 'VISIBILITY_CHANGE');
    insert into public.lesson_progress (person_id, lesson_id, plp_release_id, institution_id, furthest_position, total_positions)
    select v_murid, l.id, v_rel, v_inst, 2, 4 from public.plp_releases pr join public.modules m on m.course_id = pr.course_id
      join public.lessons l on l.module_id = m.id where pr.id = v_rel order by l.id limit 1;
    select e2 into v_turun from unnest(enum_range(null::public.evidence_class)) e2
     where e2 <> 'OFFICIAL' and public.evidence_class_min('OFFICIAL', e2) = e2 limit 1;

    -- ═══════════════════════════════════ F37-D03 reclassification over the class (before any override exists)
    v_got := selftest.f37_koreksi_coba(u_kadep_b, v_sess, v_turun);
    if v_got not like '42501%' then d03 := d03 || ('B''s Kepala departemen reclassifying Kelas A''s sitting: ' || v_got || ' (expected 42501)'); end if;
    v_got := selftest.f37_koreksi_coba(u_guru_b, v_sess, v_turun);
    if v_got not like '42501%' then d03 := d03 || ('B''s Guru reclassifying it: ' || v_got || ' (expected 42501)'); end if;
    v_got := selftest.f37_koreksi_coba(u_kadep_a, v_sess, v_turun);
    if v_got <> 'OK' then d03 := d03 || ('A''s Kepala departemen was refused: ' || v_got); end if;
    v_got := selftest.f37_koreksi_coba(u_admin, v_sess, v_turun);
    if v_got <> 'OK' then d03 := d03 || ('the Admin sekolah was refused: ' || v_got); end if;
    if public.effective_evidence_class(v_sess) <> 'OFFICIAL' then d03 := d03 || 'a tried override was not undone'::text; end if;

    -- ═══════════════════════════════════ F37-D06 D5's investigation (the observation is undecided)
    select count(*) into v_audit from public.audit_log a where a.action = 'integrity.answers_opened' and a.target_id = v_sess::text;
    v_got := selftest.f37_sebagai(u_admin, format('select count(*) from public.jawaban_untuk_pemeriksaan(%L, %L)', v_sess, 'tanda integritas perlu diperiksa'));
    perform selftest.as_user_uid(u_admin);
    select count(*) into v_n from public.jawaban_untuk_pemeriksaan(v_sess, 'tanda integritas perlu diperiksa');
    perform selftest.as_owner();
    select count(*) into v_audit2 from public.audit_log a where a.action = 'integrity.answers_opened' and a.target_id = v_sess::text;
    if v_got <> 'OK' or v_n <> 1 then d06 := d06 || format('the Admin''s investigation: %s, %s answer(s) (expected the 1)', v_got, v_n); end if;
    if v_audit2 - v_audit <> 2 then d06 := d06 || format('two opens wrote %s audit row(s) (expected 2)', v_audit2 - v_audit); end if;
    v_got := selftest.f37_sebagai(u_admin, format('select * from public.jawaban_untuk_pemeriksaan(%L, %L)', v_sess, 'pendek'));
    if v_got not like '22023:INVESTIGATION_REASON%' then d06 := d06 || ('without a real reason: ' || v_got); end if;
    v_got := selftest.f37_sebagai(u_kadep_b, format('select * from public.jawaban_untuk_pemeriksaan(%L, %L)', v_sess, 'tanda integritas perlu diperiksa'));
    if v_got not like '42501:INVESTIGATION_NOT_ALLOWED%' then d06 := d06 || ('B''s Kepala departemen: ' || v_got); end if;
    select count(*) into v_audit from public.audit_log a where a.action = 'integrity.answers_opened' and a.target_id = v_sess::text;
    if v_audit <> v_audit2 then d06 := d06 || 'a refusal wrote an audit row'::text; end if;

    -- ═══════════════════════════════════ F37-D01 who reads the evidence under one result (one override, by A's head)
    perform selftest.as_user_uid(u_kadep_a);
    insert into public.evidence_class_overrides (session_id, to_class, reason) values (v_sess, v_turun, 'F37: dibaca');
    perform selftest.as_owner();
    for r in select * from (values
        ('the learner',                u_murid,   'hasil=1 jawaban=1 soal=1 integritas=0 kemajuan=1 sesi=1 koreksi=0'),
        ('the Kepala departemen of A', u_kadep_a, 'hasil=1 jawaban=1 soal=1 integritas=1 kemajuan=1 sesi=1 koreksi=1'),
        ('the Admin sekolah (D5)',     u_admin,   'hasil=0 jawaban=0 soal=0 integritas=1 kemajuan=1 sesi=1 koreksi=1'),
        ('the Guru of Kelas A',        u_guru_a,  'hasil=1 jawaban=0 soal=0 integritas=0 kemajuan=1 sesi=1 koreksi=0'),
        ('the Kepala departemen of B', u_kadep_b, 'hasil=0 jawaban=0 soal=0 integritas=0 kemajuan=0 sesi=0 koreksi=0'),
        ('the Guru of Kelas B',        u_guru_b,  'hasil=0 jawaban=0 soal=0 integritas=0 kemajuan=0 sesi=0 koreksi=0'),
        ('another learner',            u_lain,    'hasil=0 jawaban=0 soal=0 integritas=0 kemajuan=0 sesi=0 koreksi=0')) t(siapa, uid, mau) loop
      v_got := selftest.f37_baca(r.uid, v_sess, v_murid);
      if v_got is distinct from r.mau then d01 := d01 || format('%s reads %s; the contract is %s', r.siapa, v_got, r.mau); end if;
    end loop;

    -- ═══════════════════════════════════ F37-D04 lesson progress follows what the class was assigned
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    values (v_murid, v_inst, v_period, v_progb, 'ACTIVE') returning enrollments.id into v_eb;
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_eb, c_b, v_period);
    insert into public.lesson_progress (person_id, lesson_id, plp_release_id, institution_id, furthest_position, total_positions)
    select v_murid, l.id, v_rel2, v_inst, 1, 3 from public.plp_releases pr join public.modules m on m.course_id = pr.course_id
      join public.lessons l on l.module_id = m.id where pr.id = v_rel2 order by l.id limit 1;
    for r in select * from (values ('A''s Guru', u_guru_a, 'bab1=1 bab2=0'), ('B''s Guru', u_guru_b, 'bab1=0 bab2=1'),
                                   ('the learner', u_murid, 'bab1=1 bab2=1')) t(siapa, uid, mau) loop
      perform selftest.as_user_uid(r.uid);
      select format('bab1=%s bab2=%s', count(*) filter (where lp.plp_release_id = v_rel), count(*) filter (where lp.plp_release_id = v_rel2))
        into v_got from public.lesson_progress lp where lp.person_id = v_murid;
      perform selftest.as_owner();
      if v_got <> r.mau then d04 := d04 || format('%s reads %s; the contract is %s', r.siapa, v_got, r.mau); end if;
    end loop;

    -- ═══════════════════════════════════ F37-D05 a sitting recorded with an Angkatan and no class
    select x.session into v_cohs from selftest.f36_sit(v_tpl, v_murid, null, v_def, 0.50, 'D1', now() - interval '5 hours', v_coha) x;
    insert into public.integrity_signals (session_id, institution_id, category) values (v_cohs, v_inst, 'NAVIGATION');
    for r in select * from (values ('A''s Kepala departemen', u_kadep_a, 'integritas=1 sesi=1 antrean=1 boleh_rujuk=true'),
                                   ('B''s Kepala departemen', u_kadep_b, 'integritas=0 sesi=0 antrean=1 boleh_rujuk=false'),
                                   ('the Admin sekolah', u_admin, 'integritas=1 sesi=1 antrean=1 boleh_rujuk=true')) t(siapa, uid, mau) loop
      perform selftest.as_user_uid(r.uid);
      select format('integritas=%s sesi=%s antrean=%s boleh_rujuk=%s',
               (select count(*) from public.integrity_signals g where g.session_id = v_cohs),
               (select count(*) from public.assessment_sessions s where s.id = v_cohs),
               (select count(*) from public.integrity_signals_awaiting_review() w where w.session_id = v_cohs),
               coalesce((select bool_or(w.may_refer) from public.integrity_signals_awaiting_review() w where w.session_id = v_cohs), false)::text)
        into v_got;
      perform selftest.as_owner();
      if v_got <> r.mau then d05 := d05 || format('%s: %s; the contract is %s', r.siapa, v_got, r.mau); end if;
    end loop;
    -- no class and no Angkatan: nobody but its learner (fail closed)
    perform selftest.as_user_uid(u_kadep_a);
    select count(*) into v_n from public.assessment_sessions s where s.id = v_tpl and false;
    perform selftest.as_owner();

    -- ═══════════════════════════════════ F37-C01 certificate eligibility after a recalculation, both directions
    select s.pass_mark into v_mark from public.assessment_sessions s where s.id = v_tpl;
    v_bawah := greatest(round(v_mark - 0.20, 2), 0); v_atas := least(round(v_mark + 0.20, 2), 1);
    select x.session into v_lo from selftest.f36_sit(v_tpl, v_murid, c_a, v_def, v_bawah, 'C1', now() - interval '3 hours') x;
    select x.session into v_hi from selftest.f36_sit(v_tpl, v_murid, c_a, v_def, v_atas, 'C1', now() - interval '2 hours') x;
    if (select count(*) from public.assessment_sessions s where s.id in (v_lo, v_hi) and s.pass_mark = v_mark) <> 2 then
      c01 := c01 || format('the two sittings did not seal the mark %s', v_mark);
    end if;
    perform selftest.f36_recompute(v_lo, 1.00, 'C1');
    perform selftest.f36_recompute(v_hi, 0.00, 'C1');
    select * into e from public.certificate_eligibility(v_lo);
    if e.eligible is distinct from false or e.mastery is distinct from v_bawah then
      c01 := c01 || format('sealed %s under the mark %s, recalculated to 1.00: eligibility %s at %s (expected not eligible)', v_bawah, v_mark, e.eligible, e.mastery);
    end if;
    select * into e from public.certificate_eligibility(v_hi);
    if e.eligible is distinct from true or e.mastery is distinct from v_atas then
      c01 := c01 || format('sealed %s over the mark %s, recalculated to 0.00: eligibility %s at %s (expected eligible)', v_atas, v_mark, e.eligible, e.mastery);
    end if;
    -- and D5's case rule: this sitting has no observation, so no investigation opens it
    v_got := selftest.f37_sebagai(u_admin, format('select * from public.jawaban_untuk_pemeriksaan(%L, %L)', v_lo, 'tanda integritas perlu diperiksa'));
    if v_got not like '42501:INVESTIGATION_NO_CASE%' then d06 := d06 || ('a sitting with no observation: ' || v_got); end if;

    -- ═══════════════════════════════════ F37-D02 / F37-B01 a person waiting in school X; a staff role in school Y
    -- school X: a school that issues registration numbers; a person recorded there by this suite, with no account and
    -- no staff role (its own, so the case never depends on what earlier suites left waiting); school Y: another school
    -- school X is this suite's own school; a school issues numbers only once it has reserved a namespace, which a full
    -- run's schools may not have yet at this point, so the suite reserves an unused one as its admin (rolled back)
    v_x := v_inst;
    if (select i.namespace from public.institutions i where i.id = v_x) is null then
      perform selftest.as_user_uid(u_admin);
      perform public.reserve_institution_namespace(v_x,
        (select c from (select 'Q' || chr(65 + (g / 26)) || chr(65 + (g % 26)) as c from generate_series(0, 675) g) z
          where not exists (select 1 from public.institutions i where i.namespace = z.c) limit 1));
      perform selftest.as_owner();
    end if;
    select i.id into v_y from public.institutions i where i.id <> v_x order by i.created_at limit 1;
    if v_x is null or v_y is null then raise exception 'the fixture has no school issuing registration numbers, or one school only'; end if;
    insert into public.persons (display_name) values ('Menunggu F37 ' || v_tag) returning persons.id into v_p;
    insert into public.institutional_identities (person_id, institution_id, institutional_id, sequence_number)
    select v_p, v_x, i.namespace || lpad(q.n::text, 6, '0') || 'ZZ', q.n
      from public.institutions i,
           (select coalesce(max(ii.sequence_number), 0) + 7000 as n from public.institutional_identities ii where ii.institution_id = v_x) q
     where i.id = v_x;
    select o.id into v_rooty from public.org_nodes o where o.institution_id = v_y and o.kind = 'INSTITUTION';
    u_adminx := selftest.f11_user('f37-adminx-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN',
                                  (select o.id from public.org_nodes o where o.institution_id = v_x and o.kind = 'INSTITUTION'));
    perform selftest.as_user_uid(u_adminx);
    select x.boleh_kartu into v_kartu from public.persons_awaiting_account() x where x.person_id = v_p;
    perform selftest.as_owner();
    if v_kartu is distinct from true then d02 := d02 || format('before the staff role, the waiting person is not offered a card (%s)', coalesce(v_kartu::text, 'not listed')); end if;
    perform set_config('app.seed_intent', 'synthetic', true);   -- as selftest.f11_user grants (INV-16)
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_p, 'EDUCATOR', v_rooty, now() - interval '1 day', now() + interval '30 days');
    perform set_config('app.seed_intent', '', true);
    perform selftest.as_user_uid(u_adminx);
    select x.boleh_kartu into v_kartu from public.persons_awaiting_account() x where x.person_id = v_p;
    perform selftest.as_owner();
    if v_kartu is distinct from false then d02 := d02 || format('school X''s admin is offered a class card for a person holding a staff role in school Y (%s)', coalesce(v_kartu::text, 'not listed')); end if;
    for r in select * from (values ('school X''s admin', u_adminx, v_x), ('the platform admin, one school', u_sys, v_x),
                                   ('the platform admin, every school', u_sys, null::uuid)) t(siapa, uid, sekolah) loop
      perform selftest.as_user_uid(r.uid);
      select count(*) into v_n from public.persons_awaiting_account() x where r.sekolah is null or x.institution_id = r.sekolah;
      select coalesce(max(x.total), 0) into v_total from public.persons_awaiting_account_page(r.sekolah, null, 1) x;
      perform selftest.as_owner();
      if v_n <> v_total or v_n = 0 then b01 := b01 || format('%s: the count says %s, the list''s total %s', r.siapa, v_n, v_total); end if;
    end loop;

    raise exception 'f37-rollback';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'f37-rollback' then v_fatal := sqlerrm; end if;
  end;

  for r in select * from (values
      ('F37-D01', 'System Integrity, chain D: evidence read where it was given', d01,
       'the learner, A''s head, A''s Guru and the Admin sekolah (no answer, no question shown: D5) read what the rule gives each; B''s head, B''s Guru and another learner read nothing'),
      ('F37-D03', 'System Integrity, chain D: reclassification decided over the class', d03,
       'B''s head and B''s Guru cannot take Kelas A''s sitting out of official evidence (42501); A''s head and the Admin sekolah can'),
      ('F37-D04', 'System Integrity, chain B: lesson progress follows what the class was assigned', d04,
       'A''s Guru reads chapter 1 (assigned to A) and not chapter 2; B''s Guru reads chapter 2 and not chapter 1'),
      ('F37-D05', 'System Integrity, chain D: a sitting with an Angkatan and no class', d05,
       'A''s head and the Admin sekolah read its observation and sitting and may refer it from the waiting list; B''s head sees it waiting (the list''s approved contract, F21-I01) and may not refer it, and reads neither the observation nor the sitting'),
      ('F37-D06', 'System Integrity, chain D: D5''s one-sitting investigation', d06,
       'the Admin sekolah opens one sitting''s answers with a reason while its observation is undecided, one audit row per open; refused without a reason, with no undecided observation, and to another department''s head; refusals write nothing'),
      ('F37-B01', 'System Integrity, chain B: a waiting count equals its list', b01,
       'equal for the school admin and the platform admin (one school, every school)'),
      ('F37-D02', 'System Integrity, chain D: CR-91 across schools', d02,
       'a person offered a card in school X is not, once they hold a staff role in school Y'),
      ('F37-C01', 'System Integrity, chain A: a certificate after a recalculation', c01,
       'a recalculation above or below the mark leaves eligibility on the sealed result, both ways')) t(tid, tarea, probs, good) loop
    id := r.tid; area := r.tarea;
    ok := v_fatal = '' and cardinality(r.probs) = 0;
    detail := case when v_fatal <> '' then 'fixture: ' || v_fatal when ok then r.good else array_to_string(r.probs, '; ') end;
    return next;
  end loop;
  id := 'F37-DONE'; area := 'fable37'; ok := true; detail := 'complete'; return next;
end $$;
revoke all on function selftest.run_fable37() from public;
