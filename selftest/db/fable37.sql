-- FABLE-37 · System Integrity Gate (owner, 9 Nov), measured against
-- supabase/migrations/20270112100000_an_answer_is_read_where_it_was_given.sql.
--
--   F37-D01  CHAIN D, THE EVIDENCE UNDER A RESULT IS READ WHERE THE RESULT IS: one learner's sitting in a Kelas of
--            Departemen A, with an answer, an integrity observation and lesson progress. Signed in as each person and
--            read straight from the tables (no function in between), responses, presented_items, integrity_signals
--            and lesson_progress give their rows to the learner, to the Kepala departemen of A and to the Admin
--            sekolah (CAN_REVIEW_INTEGRITY over the class; the Guru of the class reads the lesson progress), and
--            NOTHING to the Kepala departemen of a sibling Departemen B, to a Guru of a Kelas in B, or to another
--            learner, exactly as assessment_results already answers each of them (R6). Before the migration the
--            sibling head read the answers, the questions shown and the observation (can_in_institution), and the
--            other class's Guru read the lesson progress.
--
-- EVERY ROW IS ROLLED BACK.

create schema if not exists selftest;

do $$
begin
  if to_regprocedure('selftest.f35_bab(uuid,text,text,text)') is null or to_regprocedure('selftest.as_user_uid(uuid)') is null or to_regprocedure('selftest.f11_user(text,public.app_role,uuid)') is null
     or to_regprocedure('selftest.as_owner()') is null
     or to_regprocedure('selftest.f36_sit(uuid,uuid,uuid,uuid,numeric,text,timestamptz,uuid,boolean,jsonb,integer)') is null then
    raise exception 'apply fable01, fable06, fable11 and fable36.sql before fable37.sql: the helpers are missing';
  end if;
end $$;

-- how many rows of each evidence table one person reads for one sitting and one learner, through row security only
create or replace function selftest.f37_baca(p_user uuid, p_session uuid, p_person uuid)
returns text language plpgsql set search_path = public, pg_temp as $$
declare v text;
begin
  perform selftest.as_user_uid(p_user);
  select format('hasil=%s jawaban=%s soal=%s integritas=%s kemajuan=%s',
           (select count(*) from public.assessment_results r where r.session_id = p_session),
           (select count(*) from public.responses x join public.presented_items pi on pi.id = x.presented_item_id where pi.session_id = p_session),
           (select count(*) from public.presented_items pi where pi.session_id = p_session),
           (select count(*) from public.integrity_signals g where g.session_id = p_session),
           (select count(*) from public.lesson_progress lp where lp.person_id = p_person))
    into v;
  perform selftest.as_owner();
  return v;
end $$;
revoke all on function selftest.f37_baca(uuid, uuid, uuid) from public;

create or replace function selftest.run_fable37()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  v_tag text := to_char(clock_timestamp(), 'HH24MISSUS'); v_fatal text := ''; d01 text[] := array[]::text[];
  v_tpl uuid; v_inst uuid; v_root uuid; v_period uuid; v_fac uuid; v_depa uuid; v_depb uuid; v_proga uuid; v_progb uuid;
  v_coha uuid; v_cohb uuid; c_a uuid; c_b uuid; v_def uuid; v_item uuid; v_opt text; v_lesson uuid; v_rel uuid;
  u_murid uuid; u_lain uuid; u_guru_a uuid; u_guru_b uuid; u_kadep_a uuid; u_kadep_b uuid; u_admin uuid;
  v_murid uuid; v_e uuid; v_sess uuid; v_got text; r record;
begin
  perform selftest.as_owner();
  begin
    select s.id, s.institution_id into v_tpl, v_inst
      from public.assessment_sessions s join public.assessment_results res on res.session_id = s.id
     where s.mode = 'POST_TEST' and s.status = 'FINALIZED' and s.class_node_id is not null
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

    -- the chapter and its release of this suite's own (the seed's template may carry no release of its definition)
    v_def := selftest.f35_bab(v_inst, 'F37 ' || v_tag, 'D1', 'Tujuan F37 ' || v_tag);
    u_guru_a  := selftest.f11_user('f37-guru-a-'  || v_tag || '@local.invalid', 'EDUCATOR', c_a);
    u_guru_b  := selftest.f11_user('f37-guru-b-'  || v_tag || '@local.invalid', 'EDUCATOR', c_b);
    u_kadep_a := selftest.f11_user('f37-kadep-a-' || v_tag || '@local.invalid', 'HEAD_OF_DEPARTMENT', v_depa);
    u_kadep_b := selftest.f11_user('f37-kadep-b-' || v_tag || '@local.invalid', 'HEAD_OF_DEPARTMENT', v_depb);
    u_admin   := selftest.f11_user('f37-admin-'   || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_root);
    u_lain    := selftest.f11_user('f37-lain-'    || v_tag || '@local.invalid', null, null);
    u_murid   := selftest.f11_user('f37-murid-'   || v_tag || '@local.invalid', null, null);

    -- the learner: an account, an enrolment and a membership in Kelas A; one finished sitting with one answer
    select a.person_id into v_murid from public.accounts a where a.auth_user_id = u_murid;
    insert into public.enrollments (person_id, institution_id, academic_period_id, programme_id, status)
    select v_murid, v_inst, v_period, v_proga, 'ACTIVE' returning enrollments.id into v_e;
    insert into public.memberships (enrollment_id, node_id, academic_period_id) values (v_e, c_a, v_period);
    select pi.item_id, o.label into v_item, v_opt
      from public.presented_items pi join public.item_options o on o.item_id = pi.item_id
     where pi.session_id = v_tpl order by pi.position, o.label limit 1;
    if v_item is null then raise exception 'the template sitting shows no question'; end if;
    select x.session into v_sess
      from selftest.f36_sit(v_tpl, v_murid, c_a, v_def, 0.60, 'D1', now() - interval '1 day', null, true,
                            jsonb_build_array(jsonb_build_object('item', v_item, 'pilihan', v_opt))) x;
    insert into public.integrity_signals (session_id, institution_id, category) values (v_sess, v_inst, 'VISIBILITY_CHANGE');
    select s.plp_release_id into v_rel from public.assessment_sessions s where s.id = v_sess;
    select l.id into v_lesson from public.plp_releases pr join public.modules m on m.course_id = pr.course_id
      join public.lessons l on l.module_id = m.id where pr.id = v_rel order by l.id limit 1;
    insert into public.lesson_progress (person_id, lesson_id, plp_release_id, institution_id, furthest_position, total_positions)
    values (v_murid, v_lesson, v_rel, v_inst, 2, 4);

    -- ═══════════════════════════════════ F37-D01 who reads the evidence under one result
    for r in select * from (values
        ('the learner',                      u_murid,   'hasil=1 jawaban=1 soal=1 integritas=0 kemajuan=1'),
        ('the Kepala departemen of A',       u_kadep_a, 'hasil=1 jawaban=1 soal=1 integritas=1 kemajuan=1'),
        ('the Admin sekolah',                u_admin,   'hasil=0 jawaban=1 soal=1 integritas=1 kemajuan=1'),
        ('the Guru of Kelas A',              u_guru_a,  'hasil=1 jawaban=0 soal=0 integritas=0 kemajuan=1'),
        ('the Kepala departemen of B',       u_kadep_b, 'hasil=0 jawaban=0 soal=0 integritas=0 kemajuan=0'),
        ('the Guru of Kelas B',              u_guru_b,  'hasil=0 jawaban=0 soal=0 integritas=0 kemajuan=0'),
        ('another learner',                  u_lain,    'hasil=0 jawaban=0 soal=0 integritas=0 kemajuan=0')) t(siapa, uid, mau) loop
      v_got := selftest.f37_baca(r.uid, v_sess, v_murid);
      if v_got is distinct from r.mau then
        d01 := d01 || format('%s reads %s; the contract is %s', r.siapa, v_got, r.mau);
      end if;
    end loop;
  exception when others then
    v_fatal := sqlerrm;
  end;
  perform selftest.as_owner();

  id := 'F37-D01'; area := 'System Integrity, chain D: evidence read where it was given';
  ok := v_fatal = '' and cardinality(d01) = 0;
  detail := case when v_fatal <> '' then 'fixture: ' || v_fatal
                 when ok then 'learner, A''s head, the admin and A''s Guru read what R6 gives them; B''s head, B''s Guru and another learner read nothing'
                 else array_to_string(d01, '; ') end;
  return next;
  -- ═══════════════════════════════════ F37-B01 / F37-D02 own world, after D01's
  v_fatal := ''; d01 := array[]::text[];
  declare
    v_inst2 uuid; v_root2 uuid; u_admin2 uuid; u_sys uuid; v_p uuid; v_n int; v_total bigint; v_kartu boolean; b01 text[] := array[]::text[];
  begin
    -- school 2: another school that issues registration numbers (one already holding some)
    select ii.institution_id into v_inst2 from public.institutional_identities ii
     where ii.institution_id <> v_inst and not exists (select 1 from public.accounts a where a.person_id = ii.person_id)
     group by ii.institution_id order by count(*) desc limit 1;
    if v_inst2 is null then raise exception 'the fixture has no second school issuing registration numbers'; end if;
    select o.id into v_root2 from public.org_nodes o where o.institution_id = v_inst2 and o.kind = 'INSTITUTION';
    u_admin2 := selftest.f11_user('f37-admin2-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN', v_root2);
    u_sys    := selftest.f11_user('f37-sys-'    || v_tag || '@local.invalid', 'SYSTEM_ADMIN', v_root);

    -- F37-D02: a person recorded in school 2 (no account) who holds a staff role in school 1 (CR-91, any school)
    -- a person the seed recorded in school 2 with no account and no staff role (offered a card until now)
    select ii.person_id into v_p from public.institutional_identities ii
     where ii.institution_id = v_inst2 and not exists (select 1 from public.accounts a where a.person_id = ii.person_id)
       and not public.memegang_peran_staf(ii.person_id)
     order by ii.person_id limit 1;
    if v_p is null then raise exception 'school 2 has nobody waiting for an account'; end if;
    perform set_config('app.seed_intent', 'synthetic', true);   -- as selftest.f11_user grants (INV-16)
    insert into public.role_assignments (person_id, role, scope_node_id, valid_from, valid_until)
    values (v_p, 'EDUCATOR', c_a, now() - interval '1 day', now() + interval '30 days');
    perform set_config('app.seed_intent', '', true);
    perform selftest.as_user_uid(u_admin2);
    select x.boleh_kartu into v_kartu from public.persons_awaiting_account() x where x.person_id = v_p;
    perform selftest.as_owner();
    if v_kartu is distinct from false then
      d01 := d01 || format('school 2''s admin is offered a class card for a person holding a staff role in school 1 (boleh_kartu %s)', coalesce(v_kartu::text, 'not listed'));
    end if;

    -- F37-B01: «Yang menunggu»'s Aktivasi count equals the Aktivasi list's total, for the school's admin and the platform admin
    for r in select * from (values ('school 2''s admin', u_admin2, v_inst2), ('the platform admin, one school', u_sys, v_inst2),
                                   ('the platform admin, every school', u_sys, null::uuid)) t(siapa, uid, sekolah) loop
      perform selftest.as_user_uid(r.uid);
      select count(*) into v_n from public.persons_awaiting_account() x where r.sekolah is null or x.institution_id = r.sekolah;
      select coalesce(max(x.total), 0) into v_total from public.persons_awaiting_account_page(r.sekolah, null, 1) x;
      perform selftest.as_owner();
      if v_n <> v_total or v_n = 0 then
        b01 := b01 || format('%s: the count says %s, the list''s total %s', r.siapa, v_n, v_total);
      end if;
    end loop;
    id := 'F37-B01'; area := 'System Integrity, chain B: a waiting count equals its list';
    ok := cardinality(b01) = 0; detail := case when ok then 'equal for the school admin and the platform admin (one school, every school)' else array_to_string(b01, '; ') end;
    return next;
  exception when others then
    v_fatal := sqlerrm; perform selftest.as_owner();
    id := 'F37-B01'; area := 'System Integrity, chain B: a waiting count equals its list'; ok := false; detail := 'fixture: ' || v_fatal; return next;
  end;
  id := 'F37-D02'; area := 'System Integrity, chain D: CR-91 across schools';
  ok := v_fatal = '' and cardinality(d01) = 0;
  detail := case when v_fatal <> '' then 'fixture: ' || v_fatal when ok then 'a staff role in one school withholds the class card in another' else array_to_string(d01, '; ') end;
  return next;
  -- ═══════════════════════════════════ F37-C01 certificate eligibility after a recalculation, both directions (O-B3)
  v_fatal := ''; d01 := array[]::text[];
  declare v_lo uuid; v_hi uuid; e record; v_mark numeric; v_bawah numeric; v_atas numeric;
  begin
    -- each sitting carries the mark sealed on its assignment when it starts (PR080: never changed after)
    select s.pass_mark into v_mark from public.assessment_sessions s where s.id = v_tpl;
    if v_mark is null then raise exception 'the template sitting has no sealed pass mark'; end if;
    v_bawah := greatest(round(v_mark - 0.20, 2), 0); v_atas := least(round(v_mark + 0.20, 2), 1);
    select x.session into v_lo from selftest.f36_sit(v_tpl, v_murid, c_a, v_def, v_bawah, 'C1', now() - interval '3 hours') x;
    select x.session into v_hi from selftest.f36_sit(v_tpl, v_murid, c_a, v_def, v_atas, 'C1', now() - interval '2 hours') x;
    if (select count(*) from public.assessment_sessions s where s.id in (v_lo, v_hi) and s.pass_mark = v_mark) <> 2 then
      raise exception 'the two sittings did not seal the mark %', v_mark;
    end if;
    perform selftest.f36_recompute(v_lo, 1.00, 'C1');
    perform selftest.f36_recompute(v_hi, 0.00, 'C1');
    select * into e from public.certificate_eligibility(v_lo);
    if e.eligible is distinct from false or e.mastery is distinct from v_bawah then
      d01 := d01 || format('sealed %s under the mark %s, recalculated to 1.00: eligibility %s at %s (the sealed result decides: not eligible)', v_bawah, v_mark, e.eligible, e.mastery);
    end if;
    select * into e from public.certificate_eligibility(v_hi);
    if e.eligible is distinct from true or e.mastery is distinct from v_atas then
      d01 := d01 || format('sealed %s over the mark %s, recalculated to 0.00: eligibility %s at %s (the sealed result decides: eligible)', v_atas, v_mark, e.eligible, e.mastery);
    end if;
  exception when others then
    v_fatal := sqlerrm; perform selftest.as_owner();
  end;
  id := 'F37-C01'; area := 'System Integrity, chain A: a certificate after a recalculation';
  ok := v_fatal = '' and cardinality(d01) = 0;
  detail := case when v_fatal <> '' then 'fixture: ' || v_fatal
                 when ok then 'a recalculation above or below the mark leaves eligibility on the sealed result, both ways'
                 else array_to_string(d01, '; ') end;
  return next;
  id := 'F37-DONE'; area := 'fable37'; ok := true; detail := 'complete'; return next;
end $$;
revoke all on function selftest.run_fable37() from public;
