-- FABLE-12 database suite: BOB-03, a course is released (audit B3).
--
-- Ordering: depends on fable01.sql (role switches), fable06.sql (as_user_uid)
-- and fable11.sql (f11_user, f11_batch, f11_raised, f11_note). Never applied
-- as a migration; never present in production.
--
--   F12-P01  a school's course goes approve -> create -> freeze -> publish
--            through the functions the Studio actions call, by the people the
--            capabilities name; the teacher's list shows the published release
--   F12-P02  a correction is a revision: after a withdrawal, the revised
--            course's release is 1.1.0 and chains to the first
--   F12-P03  the release is the course's: its author is the course's author,
--            so the course's author cannot freeze it, whoever created the row
--   F12-N01  every refusal is its stable code, and a refused step changes
--            nothing
--   F12-N02  readiness is measured at the seal: a course the validators block
--            is not frozen, and its findings stay for the author to fix
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb
-- of problems, a sentinel to undo the lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.f11_user(text, public.app_role, uuid)') is null then
    raise exception 'apply fable11.sql before fable12.sql';
  end if;
end $$;

-- A small lesson package with one question, as a machine producer sends it.
create or replace function selftest.f12_paket(p_title text, p_stem text, p_correct text, p_wrong text)
returns jsonb language sql immutable as $$
  select jsonb_build_object('courses', jsonb_build_array(jsonb_build_object(
    'title', p_title, 'subject', 'IPA', 'stage', 'SMP', 'grade_label', 'Kelas 7',
    'modules', jsonb_build_array(jsonb_build_object('title', 'Bab satu', 'lessons', jsonb_build_array(
      jsonb_build_object('title', 'Pelajaran satu', 'body_markdown', 'Isi pelajaran untuk siswa kelas tujuh.',
        'items', jsonb_build_array(jsonb_build_object('stem', p_stem, 'use', 'POST_TEST',
          'options', jsonb_build_array(
            jsonb_build_object('label', 'A', 'body', p_correct, 'is_correct', true, 'rationale', 'Ini jawaban yang tepat.'),
            jsonb_build_object('label', 'B', 'body', p_wrong, 'is_correct', false, 'rationale', 'Ini belum tepat.')))))))))))
$$;
revoke all on function selftest.f12_paket(text, text, text, text) from public;
grant execute on function selftest.f12_paket(text, text, text, text) to authenticated;

-- A course and everything in it moved one step, as advanceContentAction moves
-- it: the signed-in person's own updates, under their own row-level security.
create or replace function selftest.f12_advance(p_course uuid, p_to public.content_status)
returns void language plpgsql set search_path = public, pg_temp as $$
declare v_me uuid := public.current_person_id();
begin
  if p_to = 'APPROVED' then
    update public.items set status = p_to, reviewed_by_person_id = v_me
     where lesson_id in (select l.id from public.lessons l join public.modules m on m.id = l.module_id where m.course_id = p_course);
    update public.lessons set status = p_to, reviewed_by_person_id = v_me
     where module_id in (select id from public.modules where course_id = p_course);
    update public.modules set status = p_to, reviewed_by_person_id = v_me where course_id = p_course;
    update public.assessment_definitions set status = p_to, reviewed_by_person_id = v_me
     where course_id = p_course and not is_ad_hoc;
    update public.courses set status = p_to, reviewed_by_person_id = v_me where id = p_course;
  else
    update public.items set status = p_to
     where lesson_id in (select l.id from public.lessons l join public.modules m on m.id = l.module_id where m.course_id = p_course);
    update public.lessons set status = p_to where module_id in (select id from public.modules where course_id = p_course);
    update public.modules set status = p_to where course_id = p_course;
    update public.assessment_definitions set status = p_to where course_id = p_course and not is_ad_hoc;
    update public.courses set status = p_to where id = p_course;
  end if;
end $$;
revoke all on function selftest.f12_advance(uuid, public.content_status) from public;
grant execute on function selftest.f12_advance(uuid, public.content_status) to authenticated;

-- A course from a package: prepared and confirmed by the signed-in person,
-- then taken to IN_REVIEW by them.
create or replace function selftest.f12_course(p_inst uuid, p_paket jsonb)
returns uuid language plpgsql set search_path = public, pg_temp as $$
declare v_batch uuid; v jsonb; v_course uuid;
begin
  v_batch := selftest.f11_batch(p_inst, 'STRUCTURED_PACKAGE', p_paket);
  perform public.prepare_ingest_batch(v_batch);
  v := public.confirm_ingest_batch(v_batch);
  if (v ->> 'ok')::boolean is not true then raise exception 'the fixture package did not materialise: %', left(v::text, 160); end if;
  v_course := (v -> 'courses' ->> 0)::uuid;
  perform selftest.f12_advance(v_course, 'STRUCTURED');
  perform selftest.f12_advance(v_course, 'VALIDATED');
  perform selftest.f12_advance(v_course, 'IN_REVIEW');
  return v_course;
end $$;
revoke all on function selftest.f12_course(uuid, jsonb) from public;
grant execute on function selftest.f12_course(uuid, jsonb) to authenticated;

-- A refusal's stable code, or null when the call went through.
create or replace function selftest.f12_code(p_sql text)
returns text language sql set search_path = public, pg_temp as $$
  select case when e is null then null when e ->> 'code' = 'PR040' then e ->> 'detail'
              else coalesce(e ->> 'code', '?') || ' ' || left(coalesce(e ->> 'message', ''), 120) end
    from selftest.f11_raised(p_sql) e
$$;
revoke all on function selftest.f12_code(text) from public;
grant execute on function selftest.f12_code(text) to authenticated, anon;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable12()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; n int; v_tag text; v jsonb; v_code text; v_code2 text; v_state text;
  v_a uuid; v_b uuid; v_kanon uuid; v_kanon_course uuid;
  v_adm uuid; v_adm_b uuid; v_kajur uuid; v_dean uuid; v_guru uuid; v_sys uuid;
  v_guru_p uuid; v_kajur_p uuid; v_adm_p uuid;
  v_course uuid; v_rel uuid; v_rev uuid; v_rel2 uuid; v_course_k uuid; v_rel_k uuid; v_course_x uuid; v_rel_x uuid;
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  m_steps int := 0; m_refused int := 0;
begin
  perform selftest.as_owner();
  begin
    v_tag := substr(md5(random()::text), 1, 8);
    perform set_config('app.seed_intent', 'synthetic', true);
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F12 ' || v_tag, 'f12a-' || v_tag, true, true) returning institutions.id into v_a;
    insert into public.institutions (name, slug, is_synthetic, is_active)
    values ('Sekolah F12 tetangga ' || v_tag, 'f12b-' || v_tag, true, true) returning institutions.id into v_b;
    perform set_config('app.seed_intent', '', true);
    select i.id into v_kanon from public.institutions i where i.tenant_kind = 'PLATFORM_CANONICAL' limit 1;
    select c.id into v_kanon_course from public.courses c where c.institution_id = v_kanon limit 1;
    if v_kanon_course is null and v_kanon is not null then
      insert into public.courses (institution_id, subject, stage, grade_label, title)
      values (v_kanon, 'IPA', 'SMP', 'Kelas 7', 'Kursus pustaka F12 ' || v_tag) returning courses.id into v_kanon_course;
    end if;
    v_adm   := selftest.f11_user('f12-adm-'   || v_tag || '@local.invalid', 'INSTITUTION_ADMIN',  v_a);
    v_adm_b := selftest.f11_user('f12-adm-b-' || v_tag || '@local.invalid', 'INSTITUTION_ADMIN',  v_b);
    v_kajur := selftest.f11_user('f12-kajur-' || v_tag || '@local.invalid', 'HEAD_OF_DEPARTMENT', v_a);
    v_dean  := selftest.f11_user('f12-dekan-' || v_tag || '@local.invalid', 'DEAN',               v_a);
    v_guru  := selftest.f11_user('f12-guru-'  || v_tag || '@local.invalid', 'EDUCATOR',           v_a);
    v_sys   := selftest.f11_user('f12-sys-'   || v_tag || '@local.invalid', 'SYSTEM_ADMIN',       v_b);
    select a.person_id into v_guru_p  from public.accounts a where a.auth_user_id = v_guru;
    select a.person_id into v_kajur_p from public.accounts a where a.auth_user_id = v_kajur;
    select a.person_id into v_adm_p   from public.accounts a where a.auth_user_id = v_adm;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F12-P01  APPROVE -> CREATE -> FREEZE -> PUBLISH, by the people the
    --          capabilities name, and the teacher's list shows the release.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_guru);
      v_course := selftest.f12_course(v_a, selftest.f12_paket('Gaya dan Gerak ' || v_tag,
        'Apa yang terjadi pada benda diam bila didorong?', 'Benda itu mulai bergerak', 'Benda itu tetap diam'));
      -- not yet approved: nothing to release
      perform selftest.as_user_uid(v_adm);
      v_code := selftest.f12_code(format('select public.create_release(%L)', v_course));
      if v_code is distinct from 'RELEASE_COURSE_NOT_APPROVED' then
        v_probs := selftest.f11_note(v_probs, 'F12-N01', 'a course in review answered ' || coalesce(v_code, 'ok -- a release was created'));
      else m_refused := m_refused + 1; end if;

      perform selftest.as_user_uid(v_kajur);
      perform selftest.f12_advance(v_course, 'APPROVED');
      perform selftest.as_owner();
      select c.status::text into v_state from public.courses c where c.id = v_course;
      if v_state is distinct from 'APPROVED' then
        raise exception 'the head of department''s approval left the course %', v_state;
      end if;

      perform selftest.as_user_uid(v_adm);
      v := public.create_release(v_course);
      v_rel := (v ->> 'release')::uuid;
      perform selftest.as_owner();
      select count(*) into n from public.plp_releases pr
       where pr.id = v_rel and pr.course_id = v_course and pr.institution_id = v_a and pr.status = 'INGESTED'
         and pr.version_label = '1.0.0' and pr.supersedes_release_id is null and pr.author_person_id = v_guru_p;
      if (v ->> 'ok')::boolean is not true or n <> 1 then
        v_probs := selftest.f11_note(v_probs, 'F12-P01', 'the release was not created as 1.0.0 of the course by its author: ' || left(v::text, 160));
      else m_steps := m_steps + 1; end if;

      perform selftest.as_user_uid(v_kajur);
      v := public.freeze_release(v_rel);
      perform selftest.as_owner();
      select count(*) into n from public.plp_releases pr
       where pr.id = v_rel and pr.status = 'FROZEN' and pr.content_sha256 is not null and pr.frozen_at is not null
         and pr.reviewed_by_person_id = v_kajur_p;
      if (v ->> 'ok')::boolean is not true or n <> 1 or not public.content_is_sealed(v_course) then
        v_probs := selftest.f11_note(v_probs, 'F12-P01', 'the head of department''s freeze did not seal the release: ' || left(v::text, 160));
      else m_steps := m_steps + 1; end if;

      -- a WARNING is acknowledged by a reviewer, as the Studio does; an ERROR could not be
      perform selftest.as_user_uid(v_kajur);
      for r in select f.id from public.mcq_quality_findings f where f.course_id = v_course and f.acknowledged_at is null loop
        perform public.acknowledge_finding('MCQ_QUALITY', r.id, 'F12');
      end loop;
      for r in select f.id from public.coaching_findings f where f.course_id = v_course and f.acknowledged_at is null loop
        perform public.acknowledge_finding('COACHING', r.id, 'F12');
      end loop;

      perform selftest.as_user_uid(v_adm);
      perform public.publish_release(v_rel);
      perform selftest.as_owner();
      select pr.status::text into v_state from public.plp_releases pr where pr.id = v_rel;
      if v_state is distinct from 'PUBLISHED' then
        v_probs := selftest.f11_note(v_probs, 'F12-P01', 'the admin''s publication left the release ' || coalesce(v_state, 'gone'));
      else m_steps := m_steps + 1; end if;

      -- what /mengajar/[kelas]/siapkan lists (src/lib/pengajar.ts terbitan):
      -- the school's PUBLISHED releases, read as the teacher
      perform selftest.as_user_uid(v_guru);
      select count(*) into n from public.plp_releases pr
       where pr.institution_id = v_a and pr.status = 'PUBLISHED' and pr.published_at is not null and pr.id = v_rel;
      perform selftest.as_owner();
      if n <> 1 then v_probs := selftest.f11_note(v_probs, 'F12-P01', 'the teacher does not see the published release');
      else m_steps := m_steps + 1; end if;

      select count(*) into n from public.audit_log al
       where al.target_id = v_rel::text and al.action in ('RELEASE_CREATED', 'RELEASE_FROZEN', 'RELEASE_PUBLISHED');
      if n <> 3 then v_probs := selftest.f11_note(v_probs, 'F12-P01', format('%s audit row(s) for create, freeze and publish, expected 3', n));
      else m_steps := m_steps + 1; end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F12-P01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F12-N01  EVERY REFUSAL IS ITS CODE, AND CHANGES NOTHING.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_rel is null then raise exception 'F12-P01 made no release to probe'; end if;
      for r in
        select * from (values
          ('a second release of the course',       v_adm,   format('select public.create_release(%L)', v_course), 'RELEASE_EXISTS'),
          ('a teacher creating a release',         v_guru,  format('select public.create_release(%L)', v_course), 'RELEASE_NOT_ALLOWED'),
          ('a DEAN creating a release',            v_dean,  format('select public.create_release(%L)', v_course), 'RELEASE_NOT_ALLOWED'),
          ('another school''s admin creating',     v_adm_b, format('select public.create_release(%L)', v_course), 'RELEASE_NOT_ALLOWED'),
          ('an unknown course',                    v_adm,   format('select public.create_release(%L)', gen_random_uuid()), 'RELEASE_NOT_ALLOWED'),
          ('freezing a published release',         v_kajur, format('select public.freeze_release(%L)', v_rel), 'RELEASE_STATE_INVALID'),
          ('a teacher freezing',                   v_guru,  format('select public.freeze_release(%L)', v_rel), 'RELEASE_NOT_ALLOWED'),
          ('publishing it again',                  v_adm,   format('select public.publish_release(%L)', v_rel), 'RELEASE_STATE_INVALID'),
          ('a head of department withdrawing',     v_kajur, format('select public.withdraw_release(%L, %L)', v_rel, 'alasan'), 'RELEASE_PUBLISH_NOT_ALLOWED'),
          ('a withdrawal without a reason',        v_adm,   format('select public.withdraw_release(%L, %L)', v_rel, '  '), 'RELEASE_REASON_REQUIRED'),
          ('another school''s admin withdrawing',  v_adm_b, format('select public.withdraw_release(%L, %L)', v_rel, 'alasan'), 'RELEASE_PUBLISH_NOT_ALLOWED')
        ) t(label, who, stmt, want)
      loop
        perform selftest.as_user_uid(r.who);
        v_code := selftest.f12_code(r.stmt);
        perform selftest.as_owner();
        if v_code is distinct from r.want then
          v_probs := selftest.f11_note(v_probs, 'F12-N01', format('%s answered %s, expected %s', r.label, coalesce(v_code, 'ok'), r.want));
        else m_refused := m_refused + 1; end if;
      end loop;
      -- a foreign and an unknown course answer alike, message included
      perform selftest.as_user_uid(v_adm_b);
      v := selftest.f11_raised(format('select public.create_release(%L)', v_course));
      v_code := (v ->> 'detail') || '|' || (v ->> 'message');
      v := selftest.f11_raised(format('select public.create_release(%L)', gen_random_uuid()));
      v_code2 := (v ->> 'detail') || '|' || (v ->> 'message');
      perform selftest.as_owner();
      if v_code is distinct from v_code2 then
        v_probs := selftest.f11_note(v_probs, 'F12-N01', 'another school''s course and an unknown course answer differently');
      end if;
      -- the platform library is not a school (D-029)
      if v_kanon_course is not null then
        perform selftest.as_user_uid(v_sys);
        v_code := selftest.f12_code(format('select public.create_release(%L)', v_kanon_course));
        perform selftest.as_owner();
        if v_code is distinct from 'RELEASE_SCHOOL_NOT_ALLOWED' then
          v_probs := selftest.f11_note(v_probs, 'F12-N01', 'a release of the platform library answered ' || coalesce(v_code, 'ok -- it was created'));
        else m_refused := m_refused + 1; end if;
      else
        v_probs := selftest.f11_note(v_probs, 'F12-N01', 'no PLATFORM_CANONICAL course exists to test D-029 against');
      end if;
      -- nothing moved
      select count(*) into n from public.plp_releases pr where pr.course_id = v_course;
      select pr.status::text into v_state from public.plp_releases pr where pr.id = v_rel;
      if n <> 1 or v_state <> 'PUBLISHED' then
        v_probs := selftest.f11_note(v_probs, 'F12-N01', format('the refusals left %s release(s), the first %s', n, v_state));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F12-N01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F12-P02  A CORRECTION IS A REVISION, AND ITS RELEASE IS 1.1.0.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_rel is null then raise exception 'F12-P01 made no release to revise'; end if;
      perform selftest.as_user_uid(v_adm);
      perform public.withdraw_release(v_rel, 'koreksi soal');
      perform selftest.as_user_uid(v_guru);
      v_rev := public.create_course_revision(v_course);
      perform selftest.f12_advance(v_rev, 'STRUCTURED');
      perform selftest.f12_advance(v_rev, 'VALIDATED');
      perform selftest.f12_advance(v_rev, 'IN_REVIEW');
      perform selftest.as_user_uid(v_kajur);
      perform selftest.f12_advance(v_rev, 'APPROVED');
      perform selftest.as_user_uid(v_adm);
      v := public.create_release(v_rev);
      v_rel2 := (v ->> 'release')::uuid;
      perform selftest.as_owner();
      select count(*) into n from public.plp_releases pr
       where pr.id = v_rel2 and pr.course_id = v_rev and pr.version_label = '1.1.0' and pr.supersedes_release_id = v_rel;
      if n <> 1 then
        v_probs := selftest.f11_note(v_probs, 'F12-P02', 'the revision''s release is not 1.1.0 chained to the first: ' || left(v::text, 160));
      end if;
      -- and the teacher's list no longer offers the withdrawn one
      perform selftest.as_user_uid(v_guru);
      select count(*) into n from public.plp_releases pr
       where pr.institution_id = v_a and pr.status = 'PUBLISHED' and pr.id = v_rel;
      perform selftest.as_owner();
      if n <> 0 then v_probs := selftest.f11_note(v_probs, 'F12-P02', 'the withdrawn release is still offered'); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F12-P02', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F12-P03  THE RELEASE IS THE COURSE'S. A course the head of department
    --          wrote, approved by the admin: the admin creates the release, the
    --          head of department may not freeze it, the admin may.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_kajur);
      v_course_k := selftest.f12_course(v_a, selftest.f12_paket('Energi ' || v_tag,
        'Energi apa yang dimiliki bola yang menggelinding?', 'Energi kinetik bola', 'Energi kimia'));
      perform selftest.as_user_uid(v_adm);
      perform selftest.f12_advance(v_course_k, 'APPROVED');
      v := public.create_release(v_course_k);
      v_rel_k := (v ->> 'release')::uuid;
      perform selftest.as_owner();
      select count(*) into n from public.plp_releases pr where pr.id = v_rel_k and pr.author_person_id = v_kajur_p;
      if n <> 1 then v_probs := selftest.f11_note(v_probs, 'F12-P03', 'the release is not authored by the course''s author'); end if;
      perform selftest.as_user_uid(v_kajur);
      v_code := selftest.f12_code(format('select public.freeze_release(%L)', v_rel_k));
      perform selftest.as_owner();
      if v_code is distinct from 'RELEASE_SAME_PERSON' then
        v_probs := selftest.f11_note(v_probs, 'F12-P03', 'the course''s author freezing its release answered ' || coalesce(v_code, 'ok -- it was frozen'));
      end if;
      perform selftest.as_user_uid(v_adm);
      v := public.freeze_release(v_rel_k);
      perform selftest.as_owner();
      select pr.status::text into v_state from public.plp_releases pr where pr.id = v_rel_k;
      if (v ->> 'ok')::boolean is not true or v_state <> 'FROZEN' then
        v_probs := selftest.f11_note(v_probs, 'F12-P03', 'the second person''s freeze answered ' || left(v::text, 160));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F12-P03', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F12-N02  READINESS AT THE SEAL. The question names its answer: a word
    --          of the correct option appears in the stem and in no distractor
    --          (STEM_REVEALS_ANSWER, an ERROR). No finding exists until the
    --          freeze runs the validators.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_guru);
      v_course_x := selftest.f12_course(v_a, selftest.f12_paket('Magnet ' || v_tag,
        'Benda manakah yang disebut magnet batang?', 'Sebuah magnet batang', 'Sepotong kayu'));
      perform selftest.as_user_uid(v_kajur);
      perform selftest.f12_advance(v_course_x, 'APPROVED');
      perform selftest.as_user_uid(v_adm);
      v := public.create_release(v_course_x);
      v_rel_x := (v ->> 'release')::uuid;
      perform selftest.as_owner();
      select count(*) into n from public.mcq_quality_findings f where f.course_id = v_course_x;
      if n <> 0 then v_probs := selftest.f11_note(v_probs, 'F12-N02', 'the fixture already carries findings; the test would prove nothing'); end if;
      perform selftest.as_user_uid(v_kajur);
      v := public.freeze_release(v_rel_x);
      perform selftest.as_owner();
      if (v ->> 'ok')::boolean is not false or v ->> 'code' is distinct from 'RELEASE_NOT_READY'
         or v ->> 'readiness' is distinct from 'BLOCKED' or (v -> 'blockers')::text not like '%STEM_REVEALS_ANSWER%' then
        v_probs := selftest.f11_note(v_probs, 'F12-N02', 'freezing a blocked course answered ' || left(v::text, 200));
      end if;
      select pr.status::text into v_state from public.plp_releases pr where pr.id = v_rel_x;
      if v_state is distinct from 'INGESTED' or public.content_is_sealed(v_course_x) then
        v_probs := selftest.f11_note(v_probs, 'F12-N02', format('a blocked course was sealed: the release is %s', v_state));
      end if;
      select count(*) into n from public.mcq_quality_findings f
       where f.course_id = v_course_x and f.pattern_class = 'STEM_REVEALS_ANSWER' and f.acknowledged_at is null;
      if n < 1 then v_probs := selftest.f11_note(v_probs, 'F12-N02', 'the finding that blocked the freeze was not kept for the author'); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F12-N02', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    raise exception 'F12_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'F12_UNDO' then v_fatal := sqlerrm; end if;
  end;

  ------------------------------------------------------------------- verdicts
  for r in
    select * from unnest(
      array['F12-P01', 'F12-P02', 'F12-P03', 'F12-N01', 'F12-N02'],
      array['BOB-03 -- a school''s course goes approve, create, freeze, publish, and the teacher sees it',
            'BOB-03 -- a correction is a revision whose release is the next minor version',
            'BOB-03 -- the release is the course''s: its author cannot freeze it',
            'BOB-03 -- every refusal on the release path is its stable code',
            'BOB-03 -- readiness is measured at the seal; a blocked course is not frozen'],
      array[
        format('a teacher''s package became a course; the head of department approved it; the school''s admin created '
          || 'release 1.0.0, authored by the teacher; the head of department froze it (approved by them, content hash '
          || 'stamped, course sealed); the admin published it; the teacher''s list shows it; create, freeze and publish '
          || 'are each audited once (%s of 5)', m_steps),
        'after a withdrawal, the course''s revision was approved and its release is 1.1.0 with supersedes_release_id '
          || 'on the first; the withdrawn release is no longer offered to teachers',
        'a course written by the head of department and approved by the admin: the admin created its release, which '
          || 'is authored by the head of department; the head of department''s freeze is RELEASE_SAME_PERSON and the '
          || 'admin''s freeze goes through',
        format('%s refusal(s), each PR040 with its code: a course in review, a second release, a teacher, a DEAN, '
          || 'another school''s admin and an unknown course (answering identically), the platform library, a second '
          || 'freeze, a teacher''s freeze, a second publication, a head of department''s withdrawal, a withdrawal '
          || 'without a reason and another school''s withdrawal; the release was left as it was', m_refused),
        'a course whose question names its answer had no findings until freeze_release ran the validators; the freeze '
          || 'answered ok=false RELEASE_NOT_READY with readiness BLOCKED naming STEM_REVEALS_ANSWER, left the release '
          || 'INGESTED and the course unsealed, and kept the finding for the author'
      ]) as t(tid, tarea, tdetail)
  loop
    id := r.tid; area := r.tarea;
    if v_fatal <> '' then
      ok := false; detail := 'the suite aborted before this test could report: ' || left(v_fatal, 200);
    elsif v_probs ? r.tid then
      ok := false;
      detail := format('%s problem(s): %s', jsonb_array_length(v_probs -> r.tid),
                       (select string_agg(x, '; ') from jsonb_array_elements_text(v_probs -> r.tid) x));
    else
      ok := true; detail := r.tdetail;
    end if;
    return next;
  end loop;

  id := 'F12-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-12 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable12() from public;
grant execute on function selftest.run_fable12() to authenticated;
