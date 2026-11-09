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
  d01 text[] := '{}'; d07 text[] := '{}'; d03 text[] := '{}'; d04 text[] := '{}'; d05 text[] := '{}'; d06 text[] := '{}';
  b01 text[] := '{}'; d02 text[] := '{}'; c01 text[] := '{}'; s01 text[] := '{}';
  v_tpl uuid; v_inst uuid; v_root uuid; v_period uuid; v_fac uuid; v_depa uuid; v_depb uuid; v_proga uuid; v_progb uuid;
  v_coha uuid; v_cohb uuid; c_a uuid; c_b uuid; v_def uuid; v_def2 uuid; v_item uuid; v_opt text; v_rel uuid; v_rel2 uuid;
  u_murid uuid; u_lain uuid; u_guru_a uuid; u_guru_b uuid; u_kadep_a uuid; u_kadep_b uuid; u_admin uuid; u_sys uuid;
  v_murid uuid; v_e uuid; v_eb uuid; v_sess uuid; v_cohs uuid; v_lo uuid; v_hi uuid; v_got text; v_turun public.evidence_class;
  v_n int; v_total bigint; v_kartu boolean; v_mark numeric; v_bawah numeric; v_atas numeric; v_audit int; v_audit2 int;
  v_x uuid; v_y uuid; v_rooty uuid; u_adminx uuid; v_p uuid; e record; r record;
  u_adminy uuid; v_pery uuid; v_uid uuid; v_pp uuid; v_ex uuid; lc jsonb := '{}'; v_sesi int; s02 text[] := '{}'; d08 text[] := '{}'; l01 text[] := '{}'; l02 text[] := '{}'; l03 text[] := '{}'; s03 text[] := '{}'; l04 text[] := '{}'; t01 text[] := '{}'; l05 text[] := '{}'; s04 text[] := '{}'; s05 text[] := '{}'; v_terbit timestamptz; v_tie timestamptz := now() - interval '3 days'; v_q uuid; v_ey uuid; v_tf uuid; v_mem uuid; v_staf uuid; v_pdc uuid; v_pdd uuid; v_pdsesi uuid; v_fn text; v_sql text; v_boleh boolean; v_lulus boolean;
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
                                   ('B''s Kepala departemen', u_kadep_b, 'integritas=0 sesi=0 antrean=0 boleh_rujuk=false'),
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
    -- owner, 9 Nov: B's head sees the school's oversight as a count, never the case
    perform selftest.as_user_uid(u_kadep_b);
    select coalesce(sum(w.waiting), 0) into v_n from public.integrity_signals_waiting_elsewhere() w where w.institution_id = v_inst;
    perform selftest.as_owner();
    if v_n < 2 then d05 := d05 || format('B''s head is not given the count of observations waiting elsewhere (%s; at least 2 wait in Departemen A)', v_n); end if;
    -- Sharon, finding B: the referral the list offers over the Angkatan is accepted
    v_got := selftest.f37_sebagai(u_kadep_a, format('select public.refer_integrity_signal(%L, %L)',
               (select g.id from public.integrity_signals g where g.session_id = v_cohs limit 1), 'dirujuk F37'));
    if v_got <> 'OK' then d05 := d05 || ('A''s head''s referral of the Angkatan-only sitting was refused: ' || v_got); end if;

    -- ═══════════════════════════════════ F37-D07 deciding, ending and extending another person's sitting (Sharon, finding A)
    for r in select * from (values
        ('decide its observation', format('select public.record_integrity_review(%L, ''NO_CONCERN'', ''F37'')', (select g.id from public.integrity_signals g where g.session_id = v_sess limit 1))),
        ('end the sitting', format('select public.terminate_session(%L, %L, ''F37'')', v_sess, (select e2::text from unnest(enum_range(null::public.termination_cause)) e2 limit 1))),
        ('extend its deadline', format('select public.extend_session_deadline(%L, 10, ''F37'')', v_sess))) t(apa, q) loop
      begin
        v_got := selftest.f37_sebagai(u_kadep_b, r.q);
        if v_got not like '42501%' and v_got !~* 'requires CAN_' then d07 := d07 || format('B''s head may %s on Kelas A''s sitting: %s', r.apa, v_got); end if;
        v_got := selftest.f37_sebagai(u_guru_b, r.q);
        if v_got not like '42501%' and v_got !~* 'requires CAN_' then d07 := d07 || format('B''s Guru may %s on Kelas A''s sitting: %s', r.apa, v_got); end if;
        v_got := selftest.f37_sebagai(u_kadep_a, r.q);
        if v_got ~* 'requires CAN_' then d07 := d07 || format('A''s head was refused to %s: %s', r.apa, v_got); end if;
        raise exception 'f37-undo';
      exception when others then
        if sqlerrm <> 'f37-undo' then d07 := d07 || ('fixture: ' || sqlerrm); end if;
        perform selftest.as_owner();
      end;
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

    -- ═══════════════════════════════════ F37-D08 (SI-D01, Sharon's re-review finding 1) a professional-learning sitting is
    -- the platform's: ending it or extending its deadline is refused to every school role (a Kepala departemen, a Guru,
    -- the Admin sekolah), as reading it already is (boleh_atas_sesi), and allowed to the platform administrator
    insert into public.courses (institution_id, subject, stage, grade_label, title, learning_context)
    values (v_inst, 'Pengembangan Guru', 'SD', 'Guru', 'PD F37 ' || v_tag, 'PROFESSIONAL_DEVELOPMENT') returning courses.id into v_pdc;
    insert into public.assessment_definitions (institution_id, course_id, module_id, title, mode, bank_type, item_count)
    values (v_inst, v_pdc, null, 'Asesmen PD F37 ' || v_tag, 'POST_TEST', 'TEST', 1) returning assessment_definitions.id into v_pdd;
    insert into public.plp_releases (institution_id, course_id, version_label) values (v_inst, v_pdc, '37.0.1');
    for r in select * from (values
        ('A''s Kepala departemen ends it',   u_kadep_a, 'select public.terminate_session(''@SESI'', ''ADMINISTRATIVE_TERMINATION'', ''uji SI-D01 PD'')', false),
        ('the Admin sekolah ends it',        u_admin,   'select public.terminate_session(''@SESI'', ''ADMINISTRATIVE_TERMINATION'', ''uji SI-D01 PD'')', false),
        ('A''s Guru extends it',             u_guru_a,  'select public.extend_session_deadline(''@SESI'', 10, ''uji SI-D01 PD'')', false),
        ('the Admin sekolah extends it',     u_admin,   'select public.extend_session_deadline(''@SESI'', 10, ''uji SI-D01 PD'')', false),
        ('the platform admin extends it',    u_sys,     'select public.extend_session_deadline(''@SESI'', 10, ''uji SI-D01 PD'')', true),
        ('the platform admin ends it',       u_sys,     'select public.terminate_session(''@SESI'', ''ADMINISTRATIVE_TERMINATION'', ''uji SI-D01 PD'')', true)
      ) t(siapa, uid, q, boleh) loop
      -- each case meets its own open PD sitting, so an accepted act never changes what the next one meets
        insert into public.assessment_sessions
          (id, person_id, institution_id, enrollment_id, academic_period_id, class_node_id, plp_release_id,
           assessment_definition_id, assessment_definition_version, engine_version, scoring_policy_version, evidence_channel,
           evidence_class, mode, status, shuffle_seed, started_at, authoritative_deadline, deadline_extended_count)
        select gen_random_uuid(), v_murid, x.institution_id, v_e, x.academic_period_id, c_a,
               (select r2.id from public.plp_releases r2 where r2.course_id = v_pdc limit 1), v_pdd, 1, x.engine_version,
               x.scoring_policy_version, x.evidence_channel, x.evidence_class, x.mode, 'CREATED', x.shuffle_seed,
               now() - interval '5 minutes', now() + interval '1 hour', 0
          from public.assessment_sessions x where x.id = v_tpl
        returning assessment_sessions.id into v_pdsesi;
        update public.assessment_sessions set status = 'IN_PROGRESS' where assessment_sessions.id = v_pdsesi;
        if not public.session_is_professional(v_pdsesi) then raise exception 'the PD sitting is not professional'; end if;
        v_got := selftest.f37_sebagai(r.uid, replace(r.q, '@SESI', v_pdsesi::text));
      if r.boleh and v_got <> 'OK' then d08 := d08 || format('%s: refused (%s)', r.siapa, v_got);
      elsif not r.boleh and v_got = 'OK' then d08 := d08 || format('%s: ACCEPTED on a professional-learning sitting', r.siapa);
      elsif not r.boleh and v_got !~ 'requires CAN_' then d08 := d08 || format('%s: refused, but not by its capability (%s)', r.siapa, v_got);
      end if;
    end loop;

    -- ═══════════════════════════════════ F37-S01 (SI-D03) a school's account-level power follows its current placement
    -- owner, 9 Nov: a historical registration number is kept for the record, and never confers current authority over
    -- a person's sign-in. School X is this suite's school (its admin u_admin), school Y another (its admin u_adminy).
    -- T transferred X -> Y; W withdrew from X; M is a learner at X and a teacher at Y; A is a learner at X only.
    -- Each holds X's registration number for good, and one live session.
    -- school Y here: another school with an academic period (D02's school Y needs none)
    select ap.institution_id, ap.id into v_y, v_pery from public.academic_periods ap
     where ap.institution_id <> v_x order by ap.created_at limit 1;
    if v_pery is null then raise exception 'no second school has an academic period'; end if;
    select o.id into v_rooty from public.org_nodes o where o.institution_id = v_y and o.kind = 'INSTITUTION';
    u_adminy := selftest.f11_user('f37-adminy-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_rooty);
    for r in select * from (values ('T'), ('W'), ('M'), ('A')) t(k) loop
      v_uid := selftest.f11_user('f37-lc-' || lower(r.k) || '-' || v_tag || '@local.invalid', null, null);
      select a.person_id into v_pp from public.accounts a where a.auth_user_id = v_uid;
      insert into public.institutional_identities (person_id, institution_id, institutional_id, sequence_number)
      select v_pp, v_x, i.namespace || lpad(q.n::text, 6, '0') || 'ZZ', q.n
        from public.institutions i,
             (select coalesce(max(ii.sequence_number), 0) + 1 as n from public.institutional_identities ii where ii.institution_id = v_x) q
       where i.id = v_x;
      insert into public.enrollments (person_id, institution_id, academic_period_id, status)
      values (v_pp, v_x, v_period, 'ACTIVE') returning enrollments.id into v_ex;
      if r.k in ('T', 'W') then
        update public.enrollments set status = 'ENDED',
               end_reason = (case r.k when 'T' then 'TRANSFERRED_OUT' else 'WITHDRAWN' end)::public.enrollment_end_reason
         where enrollments.id = v_ex;
      end if;
      if r.k = 'T' then
        insert into public.enrollments (person_id, institution_id, academic_period_id, status) values (v_pp, v_y, v_pery, 'ACTIVE');
      end if;
      if r.k = 'M' then
        perform set_config('app.seed_intent', 'synthetic', true);
        insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
        values (v_pp, 'EDUCATOR', v_rooty, now() - interval '1 day', now() + interval '30 days');
        perform set_config('app.seed_intent', '', true);
      end if;
      insert into auth.sessions (id, user_id) values (gen_random_uuid(), v_uid);
      lc := lc || jsonb_build_object(r.k, jsonb_build_object('uid', v_uid, 'person', v_pp));
    end loop;
    -- refusals first, so each person's session is still there to be kept
    for r in select * from (values
        ('school X''s admin, after T transferred to Y', u_admin,   'T', false),
        ('school X''s admin, after W withdrew',         u_admin,   'W', false),
        ('school Y''s admin, for A of school X only',   u_adminy,  'A', false),
        ('school X''s Guru, for A',                     u_guru_a,  'A', false),
        ('school X''s Kepala departemen, for A',        u_kadep_a, 'A', false),
        ('school Y''s admin, for T now at Y',           u_adminy,  'T', true),
        ('school X''s admin, for M (learner at X)',     u_admin,   'M', true),
        ('school Y''s admin, for M (teacher at Y)',     u_adminy,  'M', true),
        ('school X''s admin, for A',                    u_admin,   'A', true)) t(siapa, uid, k, boleh) loop
      v_uid := (lc -> r.k ->> 'uid')::uuid; v_pp := (lc -> r.k ->> 'person')::uuid;
      v_got := selftest.f37_sebagai(r.uid, format('select public.admin_reset_recovery(%L, %L)', v_pp, 'uji SI-D03: pemulihan dibantu'));
      select count(*) into v_sesi from auth.sessions s where s.user_id = v_uid;
      if r.boleh and v_got <> 'OK' then s01 := s01 || format('%s: refused (%s)', r.siapa, v_got); end if;
      if not r.boleh and v_got = 'OK' then
        s01 := s01 || format('%s: the reset was ACCEPTED, ending %s''s sessions everywhere (%s left) and forcing a new PIN', r.siapa, r.k, v_sesi);
      end if;
      if not r.boleh and v_got <> 'OK' and v_got not like '42501:%' then s01 := s01 || format('%s: refused with %s, not 42501', r.siapa, v_got); end if;
      if r.boleh and v_got = 'OK' and v_sesi <> 0 then s01 := s01 || format('%s: accepted, but %s session(s) survive', r.siapa, v_sesi); end if;
    end loop;
    -- history is kept: X's registration numbers and T's and W's ended enrollments are all still there
    select count(*) into v_n from public.institutional_identities ii
     where ii.institution_id = v_x and ii.person_id in (select (v ->> 'person')::uuid from jsonb_each(lc) j(k, v));
    if v_n <> 4 then s01 := s01 || format('school X''s registration numbers: %s of 4 kept', v_n); end if;
    select count(*) into v_n from public.enrollments en
     where en.institution_id = v_x and en.status = 'ENDED'
       and en.person_id in ((lc -> 'T' ->> 'person')::uuid, (lc -> 'W' ->> 'person')::uuid);
    if v_n <> 2 then s01 := s01 || format('T''s and W''s ended enrollments at X: %s of 2 kept', v_n); end if;

    -- ═══════════════════════════════════ F37-S02 (SI-D03, Sharon 9 Nov) every credential path follows current placement
    -- or narrowly defined onboarding, never a historical registration number. Authority is read from the refusal: a
    -- path refused at its school check names the capability («requires CAN_PROVISION_PEOPLE», «requires SYSTEM_ADMIN»);
    -- anything else (a card not found, an account that exists, OK) means the caller passed the school check.
    -- T, M also hold Y's number (a transfer and a staff placement issue the receiving school's own).
    if (select i.namespace from public.institutions i where i.id = v_y) is null then
      -- the unused code is chosen as the owner: under Y's admin's row security other schools' namespaces are hidden
      select c into v_fn from (select 'Q' || chr(65 + (g / 26)) || chr(65 + (g % 26)) as c from generate_series(0, 675) g) z
       where not exists (select 1 from public.institutions i where i.namespace = z.c) limit 1;
      perform selftest.as_user_uid(u_adminy);
      perform public.reserve_institution_namespace(v_y, v_fn);
      perform selftest.as_owner();
    end if;
    -- O: X issued a number, never placed, no account yet (onboarding at X)
    insert into public.persons (display_name) values ('Calon F37 O ' || v_tag) returning persons.id into v_pp;
    lc := lc || jsonb_build_object('O', jsonb_build_object('person', v_pp));
    -- P: withdrew from X before activating, now given a number at Y and not yet placed (onboarding at Y; departed X)
    insert into public.persons (display_name) values ('Calon F37 P ' || v_tag) returning persons.id into v_pp;
    lc := lc || jsonb_build_object('P', jsonb_build_object('person', v_pp));
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (v_pp, v_x, v_period, 'ACTIVE') returning enrollments.id into v_ex;
    update public.enrollments set status = 'ENDED', end_reason = 'WITHDRAWN' where enrollments.id = v_ex;
    -- F: an account with only a FUTURE role at X (Sharon: the role branch read valid_until and not valid_from)
    v_uid := selftest.f11_user('f37-lc-f-' || v_tag || '@local.invalid', null, null);
    select a.person_id into v_pp from public.accounts a where a.auth_user_id = v_uid;
    lc := lc || jsonb_build_object('F', jsonb_build_object('uid', v_uid, 'person', v_pp));
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_pp, 'EDUCATOR', (select o.id from public.org_nodes o where o.institution_id = v_x and o.kind = 'INSTITUTION'),
            now() + interval '1 day', now() + interval '30 days');
    perform set_config('app.seed_intent', '', true);
    -- registration numbers: O at X; P at X and Y; T and M at Y (they already hold X's)
    -- each number at its own time, as a school issues them (P's X number long before Y's; the onboarding rule reads the
    -- newest, and a tie gives onboarding to nobody: F37-S04)
    for r in select * from (values ('O', v_x, 30), ('P', v_x, 60), ('P', v_y, 2), ('T', v_y, 10), ('M', v_y, 10)) t(k, inst, hari) loop
      insert into public.institutional_identities (person_id, institution_id, institutional_id, sequence_number, issued_at)
      select (lc -> r.k ->> 'person')::uuid, r.inst, i.namespace || lpad(q.n::text, 6, '0') || 'ZZ', q.n, now() - make_interval(days => r.hari)
        from public.institutions i,
             (select coalesce(max(ii.sequence_number), 0) + 1 as n from public.institutional_identities ii where ii.institution_id = r.inst) q
       where i.id = r.inst;
    end loop;
    -- who may act: (person, X's admin, Y's admin). The paths are tried with Y first, so an accepted act by X (an
    -- activation, a reset) never changes what Y's attempt meets.
    for r in select * from (values
        ('T', false, true),  ('W', false, false), ('M', true, true),  ('A', true, false),
        ('O', true, false),  ('P', false, true),  ('F', false, false)) t(k, x_boleh, y_boleh) loop
      v_pp := (lc -> r.k ->> 'person')::uuid;
      foreach v_fn in array array['authorize_card_reissue', 'authorize_card_conversion', 'authorize_email_correction',
                                   'authorize_account_activation', 'admin_reset_recovery'] loop
        -- F holds no registration number: only recovery reads the role branch
        if r.k = 'F' and v_fn <> 'admin_reset_recovery' then continue; end if;
        v_sql := case v_fn
          when 'authorize_card_reissue' then format('select public.authorize_card_reissue(%L, %L, %L)', v_pp, 'HILANG',
                    '9' || lpad((abs(hashtext(v_tag || r.k)) % 1000000000)::text, 9, '0'))
          when 'authorize_card_conversion' then format('select public.authorize_card_conversion(%L, %L, %L)', v_pp,
                    'f37-konv-' || lower(r.k) || '-' || v_tag || '@local.invalid', 'uji SI-D03: konversi kartu')
          when 'authorize_email_correction' then format('select public.authorize_email_correction(%L, %L, %L)', v_pp,
                    'f37-kor-' || lower(r.k) || '-' || v_tag || '@local.invalid', 'uji SI-D03')
          when 'authorize_account_activation' then format('select public.authorize_account_activation(%L, %L, %L, %L)', v_pp,
                    'EMAIL', 'f37-akt-' || lower(r.k) || '-' || v_tag || '@local.invalid', null)
          else format('select public.admin_reset_recovery(%L, %L)', v_pp, 'uji SI-D03') end;
        for e in select * from (values ('Y', u_adminy, r.y_boleh), ('X', u_admin, r.x_boleh)) q(sekolah, uid, boleh) loop
          v_got := selftest.f37_sebagai(e.uid, v_sql);
          v_lulus := v_got !~ 'requires (CAN_PROVISION_PEOPLE|SYSTEM_ADMIN)';
          if e.boleh and not v_lulus then
            s02 := s02 || format('%s by school %s''s admin for %s: refused at the school check (%s)', v_fn, e.sekolah, r.k, v_got);
          elsif not e.boleh and v_lulus then
            s02 := s02 || format('%s by school %s''s admin for %s: PASSED the school check (%s)', v_fn, e.sekolah, r.k, v_got);
          end if;
        end loop;
      end loop;
    end loop;

    -- ═══════════════════════════════════ F37-L01..L03 (account lifecycle, Sharon on 89374424; owner's priority 4)
    -- L01: a placement changes only through its governed functions. A School Admin writing enrollments or memberships
    -- directly (PostgREST) is refused; «Pindah kelas» (move_learner_to_class) still moves the learner, audited.
    select m.id into v_mem from public.memberships m where m.enrollment_id = v_e and m.valid_to is null limit 1;
    v_got := selftest.f37_sebagai(u_admin, format('update public.enrollments set status = %L, end_reason = %L where id = %L', 'ENDED', 'WITHDRAWN', v_e));
    if v_got = 'OK' then l01 := l01 || 'the Admin sekolah ended an enrolment by a direct UPDATE (no reason, no audit, memberships left open)'::text; end if;
    v_got := selftest.f37_sebagai(u_admin, format('update public.memberships set valid_to = now() where id = %L', v_mem));
    if v_got = 'OK' then l01 := l01 || 'the Admin sekolah closed a membership by a direct UPDATE'::text; end if;
    v_got := selftest.f37_sebagai(u_admin, format('insert into public.memberships (enrollment_id, node_id, academic_period_id) values (%L, %L, %L)', v_e, c_b, v_period));
    if v_got = 'OK' then l01 := l01 || 'the Admin sekolah inserted a membership directly (bypassing the placement function and its audit)'::text; end if;
    v_got := selftest.f37_sebagai(u_admin, format('insert into public.enrollments (person_id, institution_id, academic_period_id, status) values (%L, %L, %L, %L)', v_murid, v_inst, v_period, 'PENDING'));
    if v_got = 'OK' then l01 := l01 || 'the Admin sekolah inserted an enrolment directly'::text; end if;
    select m.id into v_mem from public.memberships m where m.enrollment_id = v_e and m.valid_to is null and m.node_id = c_a limit 1;
    if v_mem is not null then
      v_got := selftest.f37_sebagai(u_admin, format('select public.move_learner_to_class(%L, %L)', v_mem, c_b));
      if v_got <> 'OK' then l01 := l01 || ('«Pindah kelas» no longer moves the learner: ' || v_got); end if;
    end if;
    -- L02: one person holds at most one live (PENDING/ACTIVE) enrolment per school and year
    begin
      insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status) values (v_murid, v_inst, v_period, v_proga, 'ACTIVE');
      l02 := l02 || 'a second ACTIVE enrolment of one learner in one school, year and programme was accepted'::text;
    exception when unique_violation then null;
      when others then l02 := l02 || ('refused, but not as a duplicate: ' || sqlerrm);
    end;
    -- L03: a staff member whose only link to the school was a role keeps their name for the school's administrator once
    -- the role is revoked (historical attribution: their authored items, reviews and decisions)
    v_uid := selftest.f11_user('f37-staf-' || v_tag || '@local.invalid', 'EDUCATOR', c_b);
    select a.person_id into v_staf from public.accounts a where a.auth_user_id = v_uid;
    perform selftest.as_user_uid(u_admin);
    select count(*) into v_n from public.persons p where p.id = v_staf;
    perform selftest.as_owner();
    if v_n <> 1 then l03 := l03 || 'the fixture''s serving teacher is not visible to the Admin sekolah'::text; end if;
    update public.role_assignments set revoked_at = now(), revoked_by = v_murid, revoked_reason = 'uji: pensiun'
     where person_id = v_staf and revoked_at is null;
    perform selftest.as_user_uid(u_admin);
    select count(*) into v_n from public.persons p where p.id = v_staf;
    perform selftest.as_owner();
    if v_n <> 1 then l03 := l03 || 'once the role is revoked, the Admin sekolah no longer sees the former teacher''s name (their authored work loses its author)'::text; end if;

    -- ═══════════════════════════════════ Sharon's review of 2ce4ddcf (9 Nov)
    -- S03: onboarding belongs to the school that issued the most recent registration number. Q was numbered by X, left
    -- before being enrolled and never activated; Y then numbered them. Only Y may activate or correct their email.
    insert into public.persons (display_name) values ('Calon F37 Q ' || v_tag) returning persons.id into v_q;
    for r in select * from (values (v_x, now() - interval '30 days'), (v_y, now() - interval '1 day')) t(inst, kapan) loop
      insert into public.institutional_identities (person_id, institution_id, institutional_id, sequence_number, issued_at)
      select v_q, r.inst, i.namespace || lpad(q.n::text, 6, '0') || 'ZZ', q.n, r.kapan
        from public.institutions i,
             (select coalesce(max(ii.sequence_number), 0) + 1 as n from public.institutional_identities ii where ii.institution_id = r.inst) q
       where i.id = r.inst;
    end loop;
    v_got := selftest.f37_sebagai(u_admin, format('select public.authorize_account_activation(%L, %L, %L, %L)', v_q, 'EMAIL', 'f37-q-x-' || v_tag || '@local.invalid', null));
    if v_got !~ 'requires CAN_PROVISION_PEOPLE' then s03 := s03 || format('school X (the older number) passed the school check for Q''s activation (%s)', v_got); end if;
    v_got := selftest.f37_sebagai(u_adminy, format('select public.authorize_account_activation(%L, %L, %L, %L)', v_q, 'EMAIL', 'f37-q-y-' || v_tag || '@local.invalid', null));
    if v_got ~ 'requires CAN_PROVISION_PEOPLE' then s03 := s03 || format('school Y (the newest number) was refused Q''s activation (%s)', v_got); end if;
    -- L04: a live enrolment with no programme never sits beside another live one of the same person, school and year
    begin
      insert into public.enrollments (person_id, institution_id, academic_period_id, status) values (v_murid, v_inst, v_period, 'ACTIVE');
      l04 := l04 || 'a live enrolment with no programme was accepted beside the learner''s live enrolment with one'::text;
    exception when others then
      if sqlerrm !~ 'one live enrolment' then l04 := l04 || ('refused, but not by the rule: ' || sqlerrm); end if;
    end;
    -- T01: a transfer to a school where the learner already holds a live enrolment that year is refused BY NAME, not
    -- with a raw unique_violation. The learner (live at A, this school) gets an enrolment at Y and a transfer Y -> A.
    insert into public.enrollments (person_id, institution_id, academic_period_id, status)
    values (v_murid, v_y, v_pery, 'ACTIVE') returning enrollments.id into v_ey;
    insert into public.transfers (person_id, from_enrollment_id, from_institution_id, to_institution_id, to_academic_period_id,
                                  to_programme_id, status, reason)
    values (v_murid, v_ey, v_y, v_inst, v_period, v_proga, 'REQUESTED', 'uji F37-T01') returning transfers.id into v_tf;
    update public.transfers set status = 'AUTHORIZED', authorized_by = v_murid where transfers.id = v_tf;
    v_got := selftest.f37_sebagai(u_admin, format('select public.transfer_execute(%L)', v_tf));
    if v_got = 'OK' then t01 := t01 || 'the transfer made a second live enrolment at the receiving school'::text;
    elsif v_got !~ 'TRANSFER_ALREADY_ENROLLED' then t01 := t01 || ('refused without a name the screen can read: ' || v_got); end if;

    -- L05: a departed learner is not placed back by the old school through the ordinary placement (demonstration
    -- finding 8). T transferred X -> Y; W withdrew from X. Neither is offered in «Murid yang belum punya kelas», and
    -- tempatkan_murid refuses both by name; a return goes through re-enrolment, never this path.
    for r in select * from (values ('T', 'PLACE_ELSEWHERE'), ('W', 'PLACE_DEPARTED')) t(k, mau) loop
      v_pp := (lc -> r.k ->> 'person')::uuid;
      perform selftest.as_user_uid(u_admin);
      select count(*) into v_n from public.murid_tanpa_kelas(v_x) m where m.person_id = v_pp;
      perform selftest.as_owner();
      if v_n <> 0 then l05 := l05 || format('%s (departed) is offered in «Murid yang belum punya kelas»', r.k); end if;
      v_got := selftest.f37_sebagai(u_admin, format('select public.tempatkan_murid(%L, %L)', v_pp, c_a));
      if v_got = 'OK' then l05 := l05 || format('the old school placed %s back into a Kelas', r.k);
      elsif v_got !~ r.mau then l05 := l05 || format('%s refused, but not as %s: %s', r.k, r.mau, v_got); end if;
    end loop;

    -- S04 (owner, 9 Nov): the newest registration is not assumed authorised. R: X's and Y's numbers share one timestamp,
    -- so neither school onboards R. U: Y's number is the newest but Y is inactive, so nobody onboards U (X, the older,
    -- does not inherit). Each person never enrolled or activated.
    for r in select * from (values ('R'), ('U')) t(k) loop
      insert into public.persons (display_name) values ('Calon F37 ' || r.k || ' ' || v_tag) returning persons.id into v_pp;
      lc := lc || jsonb_build_object(r.k, jsonb_build_object('person', v_pp));
      for e in select * from (values (v_x, case when r.k = 'R' then v_tie else now() - interval '20 days' end),
                                     (v_y, case when r.k = 'R' then v_tie else now() - interval '1 day' end)) q(inst, kapan) loop
        insert into public.institutional_identities (person_id, institution_id, institutional_id, sequence_number, issued_at)
        select v_pp, e.inst, i.namespace || lpad(n.n::text, 6, '0') || 'ZZ', n.n, e.kapan
          from public.institutions i,
               (select coalesce(max(ii.sequence_number), 0) + 1 as n from public.institutional_identities ii where ii.institution_id = e.inst) n
         where i.id = e.inst;
      end loop;
    end loop;
    for r in select * from (values ('R', 'X', u_admin), ('R', 'Y', u_adminy), ('U', 'X', u_admin)) t(k, sekolah, uid) loop
      v_pp := (lc -> r.k ->> 'person')::uuid;
      if r.k = 'U' then update public.institutions set is_active = false where institutions.id = v_y; end if;
      v_got := selftest.f37_sebagai(r.uid, format('select public.authorize_account_activation(%L, %L, %L, %L)', v_pp, 'EMAIL',
                                    'f37-' || lower(r.k) || '-' || lower(r.sekolah) || '-' || v_tag || '@local.invalid', null));
      if r.k = 'U' then update public.institutions set is_active = true where institutions.id = v_y; end if;
      if v_got !~ 'requires CAN_PROVISION_PEOPLE' then
        s04 := s04 || format('%s: school %s passed the school check (%s)', r.k, r.sekolah, v_got);
      end if;
    end loop;

    -- S05 (Sharon on 0b60b012): a registration's issue time is the moment it is issued, after the locks, not the start of
    -- its transaction, so «newest» is the one committed last. Inside this long transaction, a number issued now must be
    -- stamped later than the transaction began.
    insert into public.persons (display_name) values ('Calon F37 V ' || v_tag) returning persons.id into v_pp;
    perform public.issue_institutional_id(v_pp, v_x);
    select ii.issued_at into v_terbit from public.institutional_identities ii where ii.person_id = v_pp and ii.institution_id = v_x;
    if v_terbit is null or v_terbit <= now() then
      s05 := s05 || format('the number was stamped %s, the transaction''s start (%s), not its moment of issue', v_terbit, now());
    end if;

    raise exception 'f37-rollback';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'f37-rollback' then v_fatal := sqlerrm; end if;
  end;

  for r in select * from (values
      ('F37-D01', 'System Integrity, chain D: evidence read where it was given', d01,
       'the learner, A''s head, A''s Guru and the Admin sekolah (no answer, no question shown: D5) read what the rule gives each; B''s head, B''s Guru and another learner read nothing'),
      ('F37-D07', 'System Integrity, chain D: deciding, ending and extending another person''s sitting', d07,
       'B''s head and B''s Guru cannot decide Kelas A''s observation, end its sitting or extend its deadline; A''s head can (each tried and undone)'),
      ('F37-D03', 'System Integrity, chain D: reclassification decided over the class', d03,
       'B''s head and B''s Guru cannot take Kelas A''s sitting out of official evidence (42501); A''s head and the Admin sekolah can'),
      ('F37-D04', 'System Integrity, chain B: lesson progress follows what the class was assigned', d04,
       'A''s Guru reads chapter 1 (assigned to A) and not chapter 2; B''s Guru reads chapter 2 and not chapter 1'),
      ('F37-D05', 'System Integrity, chain D: a sitting with an Angkatan and no class', d05,
       'A''s head and the Admin sekolah read its observation and sitting, list it and refer it (the referral is accepted); B''s head is given only the count of observations waiting elsewhere (owner, 9 Nov), no case'),
      ('F37-D06', 'System Integrity, chain D: D5''s one-sitting investigation', d06,
       'the Admin sekolah opens one sitting''s answers with a reason while its observation is undecided, one audit row per open; refused without a reason, with no undecided observation, and to another department''s head; refusals write nothing'),
      ('F37-B01', 'System Integrity, chain B: a waiting count equals its list', b01,
       'equal for the school admin and the platform admin (one school, every school)'),
      ('F37-D02', 'System Integrity, chain D: CR-91 across schools', d02,
       'a person offered a card in school X is not, once they hold a staff role in school Y'),
      ('F37-C01', 'System Integrity, chain A: a certificate after a recalculation', c01,
       'a recalculation above or below the mark leaves eligibility on the sealed result, both ways'),
      ('F37-D08', 'System Integrity, chain D: a professional-learning sitting is the platform''s to end or extend', d08,
       'a Kepala departemen, a Guru and the Admin sekolah are refused ending a professional-learning sitting or extending its deadline (each refusal names its capability); the platform administrator extends and ends it'),
      ('F37-L01', 'Account lifecycle: a placement changes only through its governed functions', l01,
       'the Admin sekolah''s direct UPDATE or INSERT on enrollments and memberships is refused; «Pindah kelas» still moves the learner'),
      ('F37-L02', 'Account lifecycle: one live enrolment per person, school and year', l02,
       'a second PENDING/ACTIVE enrolment of one learner in one school, year and programme is refused as a duplicate (another programme stays possible, as F37-D04 uses)'),
      ('F37-L03', 'Account lifecycle: a former teacher keeps their name for the school', l03,
       'a teacher whose only link was a role stays visible to the Admin sekolah after the role is revoked'),
      ('F37-S03', 'System Integrity, chain D: onboarding belongs to the newest registration (Sharon, 2ce4ddcf)', s03,
       'a person numbered by X, never enrolled or activated, then numbered by Y: only Y passes the school check for their activation'),
      ('F37-L04', 'Account lifecycle: a live enrolment with no programme stands alone (Sharon, 2ce4ddcf)', l04,
       'a live enrolment with no programme is refused beside another live enrolment of the same person, school and year'),
      ('F37-T01', 'Account lifecycle: a repeated transfer is refused by name (Sharon, 2ce4ddcf)', t01,
       'a transfer to a school where the learner already holds a live enrolment that year is refused PR040 TRANSFER_ALREADY_ENROLLED, nothing written'),
      ('F37-L05', 'Account lifecycle: a departed learner is not placed back by the old school', l05,
       'a learner who transferred to another school (PLACE_ELSEWHERE) or withdrew (PLACE_DEPARTED) is not offered in «Murid yang belum punya kelas» and tempatkan_murid refuses them by name'),
      ('F37-S04', 'System Integrity, chain D: the newest registration is not assumed authorised (owner, 9 Nov)', s04,
       'two schools whose latest numbers share a timestamp: neither onboards the person; the newest number''s school inactive: nobody onboards, and the older school does not inherit'),
      ('F37-S05', 'System Integrity, chain D: a registration is stamped when it is issued (Sharon, 0b60b012)', s05,
       'a number issued late in a long transaction is stamped at its moment of issue, after the transaction began'),
      ('F37-S01', 'System Integrity, chain D: a school''s account-level power follows its current placement (SI-D03)', s01,
       'a former school''s admin cannot reset the recovery of a learner who transferred or withdrew (42501; the session kept); the current school can (sessions ended); a person placed at two schools is assisted by either; another school''s admin, a Guru and a Kepala departemen are refused; registration numbers and ended enrollments are kept'),
      ('F37-S02', 'System Integrity, chain D: every credential path follows the current placement or onboarding (SI-D03)', s02,
       'card re-issue, card conversion, email correction, activation and recovery reset: a former school (T transferred, W and P withdrew) and a future-only role (F) are refused at the school check; the current school, both schools of a person placed at two, and the school onboarding a person it has numbered but never placed (O at X, P at Y) pass it')) t(tid, tarea, probs, good) loop
    id := r.tid; area := r.tarea;
    ok := v_fatal = '' and cardinality(r.probs) = 0;
    detail := case when v_fatal <> '' then 'fixture: ' || v_fatal when ok then r.good else array_to_string(r.probs, '; ') end;
    return next;
  end loop;
  id := 'F37-DONE'; area := 'fable37'; ok := true; detail := 'complete'; return next;
end $$;
revoke all on function selftest.run_fable37() from public;
