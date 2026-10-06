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
--   F12-N03  releases change only through their functions (D-041): no direct
--            insert or update by a signed-in client; reading stays
--   F12-P04  BOB-17: every readiness rule is its own code with its parameters,
--            and the codes met are exactly the catalogue's
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
  v_c4 uuid; v_d4 uuid; v_les uuid; v_les_t text; v_item uuid; v_item_d uuid; v_rel4 uuid; v_seen text[] := '{}'; v_exp jsonb;
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

      -- an unfrozen release is not published
      perform selftest.as_user_uid(v_adm);
      v_code := selftest.f12_code(format('select public.publish_release(%L)', v_rel));
      perform selftest.as_owner();
      if v_code is distinct from 'RELEASE_STATE_INVALID' then
        v_probs := selftest.f11_note(v_probs, 'F12-N01', 'publishing an unfrozen release answered ' || coalesce(v_code, 'ok -- it was published'));
      else m_refused := m_refused + 1; end if;

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
          ('publishing it again (a second click)', v_adm,   format('select public.publish_release(%L)', v_rel), null),
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
      -- the platform library is not a school (D-029). RESTATED FOR CR-51 (D-120 Q7, a changed requirement): the platform
      -- admin releases the library's standard content; a school role stays refused there, even one holding
      -- CAN_FREEZE_RELEASE in the library itself
      if v_kanon_course is not null then
        perform selftest.f05_actor('kanonik-admin@pintar.test', 'INSTITUTION_ADMIN', v_kanon);
        perform selftest.as_user('kanonik-admin@pintar.test');
        v_code := selftest.f12_code(format('select public.create_release(%L)', v_kanon_course));
        perform selftest.as_owner();
        if v_code is distinct from 'RELEASE_SCHOOL_NOT_ALLOWED' then
          v_probs := selftest.f11_note(v_probs, 'F12-N01', 'a release of the platform library answered ' || coalesce(v_code, 'ok -- it was created'));
        else m_refused := m_refused + 1; end if;
        perform selftest.as_user_uid(v_sys);
        v_code := selftest.f12_code(format('select public.create_release(%L)', v_kanon_course));
        perform selftest.as_owner();
        if v_code is not distinct from 'RELEASE_SCHOOL_NOT_ALLOWED'
           or v_code is distinct from (case when exists (select 1 from public.plp_releases pr where pr.course_id = v_kanon_course) then 'RELEASE_EXISTS'
                                            when (select c.status::text from public.courses c where c.id = v_kanon_course) <> 'APPROVED' then 'RELEASE_COURSE_NOT_APPROVED' end) then
          v_probs := selftest.f11_note(v_probs, 'F12-N01', 'the platform admin''s release of a library course answered ' || coalesce(v_code, 'ok')
            || ', not the course''s own state (D-120 Q7)');
        end if;
      else
        v_probs := selftest.f11_note(v_probs, 'F12-N01', 'no PLATFORM_CANONICAL course exists to test D-029 against');
      end if;
      -- nothing moved
      select count(*) into n from public.plp_releases pr where pr.course_id = v_course;
      select pr.status::text into v_state from public.plp_releases pr where pr.id = v_rel;
      if n <> 1 or v_state <> 'PUBLISHED' then
        v_probs := selftest.f11_note(v_probs, 'F12-N01', format('the refusals left %s release(s), the first %s', n, v_state));
      end if;
      select count(*) into n from public.audit_log al where al.target_id = v_rel::text and al.action = 'RELEASE_PUBLISHED';
      if n <> 1 then v_probs := selftest.f11_note(v_probs, 'F12-N01', format('a second click audited %s publication(s), expected 1', n)); end if;
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

    -- ═══════════════════════════════════════════════════════════════════════
    -- F12-N03  RELEASES CHANGE ONLY THROUGH THEIR FUNCTIONS (D-041): a teacher
    --          cannot insert a release naming another author, an admin cannot
    --          move one by a direct update, and reading stays open.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_rel is null or v_course_x is null then raise exception 'the fixtures above made no release to probe'; end if;
      perform selftest.as_user_uid(v_guru);
      v_code := selftest.f12_code(format(
        'insert into public.plp_releases (institution_id, course_id, version_label, author_person_id) values (%L, %L, %L, %L)',
        v_a, v_course_x, '7.0.0', v_kajur_p));
      perform selftest.as_owner();
      if v_code is null or v_code not like '42501%' then
        v_probs := selftest.f11_note(v_probs, 'F12-N03', 'a teacher''s direct insert of a release naming another author answered '
          || coalesce(v_code, 'ok -- the row was written'));
      end if;
      perform selftest.as_user_uid(v_adm);
      v_code := selftest.f12_code(format('update public.plp_releases set status = %L where id = %L', 'SUPERSEDED', v_rel));
      perform selftest.as_owner();
      if v_code is null or v_code not like '42501%' then
        v_probs := selftest.f11_note(v_probs, 'F12-N03', 'an admin''s direct update of a release answered '
          || coalesce(v_code, 'ok -- the row moved'));
      end if;
      perform selftest.as_user_uid(v_guru);
      select count(*) into n from public.plp_releases pr where pr.institution_id = v_a;
      perform selftest.as_owner();
      if n < 1 then v_probs := selftest.f11_note(v_probs, 'F12-N03', 'a teacher can no longer read the school''s releases'); end if;
      select count(*) into n from pg_policies where schemaname = 'public' and tablename = 'plp_releases' and cmd <> 'SELECT';
      if n <> 0 then v_probs := selftest.f11_note(v_probs, 'F12-N03', format('%s write policy(ies) remain on plp_releases', n)); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F12-N03', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F12-P04  BOB-17 (D-011): EVERY READINESS RULE IS ITS OWN CODE, with its
    --          parameters -- never a sentence. Planted findings for the four
    --          findings rules, then the package walked through the five states
    --          studio_package_state reports. Blockers are read through
    --          to_jsonb, so today's text[] of sentences shows up as strings.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_guru);
      v_c4 := selftest.f12_course(v_a, selftest.f12_paket('Kode Kesiapan ' || v_tag,
        'Berapakah dua ditambah dua?', 'Empat', 'Lima'));
      perform selftest.as_owner();
      delete from public.coaching_findings where course_id = v_c4;
      delete from public.mcq_quality_findings where course_id = v_c4;
      select l.id, l.title into v_les, v_les_t from public.lessons l join public.modules m on m.id = l.module_id
       where m.course_id = v_c4 order by m.ordinal, l.ordinal limit 1;
      select i.id into v_item from public.items i where i.lesson_id = v_les order by i.id limit 1;
      insert into public.coaching_findings (institution_id, course_id, target_table, target_id, target_field, severity,
                                            lokasi, masalah, mengapa_penting, cara_memperbaiki) values
        (v_a, v_c4, 'lessons', v_les, 'body_markdown', 'ERROR', 'uji', 'uji', 'uji', 'uji'),
        (v_a, v_c4, 'items', v_item, 'stem', 'WARNING', 'uji', 'uji', 'uji', 'uji'),
        (v_a, v_c4, 'courses', v_c4, 'title', 'WARNING', 'uji', 'uji', 'uji', 'uji');
      insert into public.mcq_quality_findings (institution_id, course_id, item_id, pattern_class, severity,
                                               lokasi, masalah, mengapa_penting, cara_memperbaiki) values
        (v_a, v_c4, v_item, 'POLA_UJI_GALAT', 'ERROR', 'uji', 'uji', 'uji', 'uji'),
        (v_a, v_c4, v_item, 'POLA_UJI_PERINGATAN', 'WARNING', 'uji', 'uji', 'uji', 'uji'),
        (v_a, v_c4, v_item, 'POLA_UJI_PERINGATAN', 'WARNING', 'uji', 'uji', 'uji', 'uji');

      -- the four findings rules: one blocker per lesson (and pattern), with its count
      select p.status, to_jsonb(p.blockers) into v_state, v from public.publish_readiness(v_c4) p;
      v_exp := jsonb_build_array(
        jsonb_build_object('code', 'READINESS_TEXT_ERROR', 'count', 1, 'lesson_id', v_les, 'lesson', v_les_t),
        jsonb_build_object('code', 'READINESS_TEXT_WARNING', 'count', 1, 'lesson_id', v_les, 'lesson', v_les_t),
        jsonb_build_object('code', 'READINESS_TEXT_WARNING', 'count', 1),
        jsonb_build_object('code', 'READINESS_ITEM_ERROR', 'count', 1, 'lesson_id', v_les, 'lesson', v_les_t, 'pattern', 'POLA_UJI_GALAT'),
        jsonb_build_object('code', 'READINESS_ITEM_WARNING', 'count', 2, 'lesson_id', v_les, 'lesson', v_les_t, 'pattern', 'POLA_UJI_PERINGATAN'));
      if v_state is distinct from 'BLOCKED'
         or (select jsonb_agg(e order by e::text) from jsonb_array_elements(v) e)
            is distinct from (select jsonb_agg(e order by e::text) from jsonb_array_elements(v_exp) e) then
        v_probs := selftest.f11_note(v_probs, 'F12-P04', format('with every findings rule planted, readiness was %s with %s', v_state, left(v::text, 300)));
      end if;
      v_seen := v_seen || array(select e ->> 'code' from jsonb_array_elements(v) e);
      -- errors acknowledged by the head of department (CAN_REVIEW): only warnings are
      -- left, which need action but do not block
      perform selftest.as_user_uid(v_kajur);
      update public.coaching_findings set acknowledged_at = now(), acknowledged_by_person_id = v_kajur_p where course_id = v_c4 and severity = 'ERROR';
      update public.mcq_quality_findings set acknowledged_at = now(), acknowledged_by_person_id = v_kajur_p where course_id = v_c4 and severity = 'ERROR';
      perform selftest.as_owner();
      select p.status, to_jsonb(p.blockers) into v_state, v from public.publish_readiness(v_c4) p;
      if v_state is distinct from 'ACTION_REQUIRED' or jsonb_array_length(v) <> 3 then
        v_probs := selftest.f11_note(v_probs, 'F12-P04', format('with only warnings left, readiness was %s with %s', v_state, left(v::text, 200)));
      end if;
      perform selftest.as_user_uid(v_kajur);
      update public.coaching_findings set acknowledged_at = now(), acknowledged_by_person_id = v_kajur_p where course_id = v_c4;
      update public.mcq_quality_findings set acknowledged_at = now(), acknowledged_by_person_id = v_kajur_p where course_id = v_c4;
      perform selftest.as_owner();
      select p.status, to_jsonb(p.blockers) into v_state, v from public.publish_readiness(v_c4) p;
      if v_state is distinct from 'READY' or v <> '[]'::jsonb then
        v_probs := selftest.f11_note(v_probs, 'F12-P04', format('with everything acknowledged, readiness was %s with %s', v_state, left(v::text, 200)));
      end if;

      -- the package's own state: in review with no release, then approved with an unsealed release
      perform selftest.as_user_uid(v_adm);
      select p.surface_state, to_jsonb(p.reasons) into v_state, v from public.studio_package_state(v_c4) p;
      v_seen := v_seen || array(select e ->> 'code' from jsonb_array_elements(v) e);
      if v_state is distinct from 'ACTION_REQUIRED'
         or not (v @> '[{"code": "READINESS_AWAITING_REVIEW"}]' and v @> '[{"code": "READINESS_NO_RELEASE"}]') then
        v_probs := selftest.f11_note(v_probs, 'F12-P04', format('a course in review with no release reads %s: %s', v_state, left(v::text, 200)));
      end if;
      perform selftest.as_user_uid(v_kajur);
      perform selftest.f12_advance(v_c4, 'APPROVED');
      perform selftest.as_user_uid(v_adm);
      v := public.create_release(v_c4);
      select p.surface_state, to_jsonb(p.reasons) into v_state, v from public.studio_package_state(v_c4) p;
      v_seen := v_seen || array(select e ->> 'code' from jsonb_array_elements(v) e);
      if v <> '[{"code": "READINESS_NOT_SEALED"}]'::jsonb then
        v_probs := selftest.f11_note(v_probs, 'F12-P04', format('an approved course with an unsealed release reads %s: %s', v_state, left(v::text, 200)));
      end if;

      -- and a package still short of validation, then with a question returned to be fixed
      perform selftest.as_user_uid(v_guru);
      v_d4 := (public.confirm_ingest_batch(selftest.f11_batch(v_a, 'STRUCTURED_PACKAGE',
                 selftest.f12_paket('Kode Kesiapan Dua ' || v_tag, 'Berapakah tiga ditambah tiga?', 'Enam', 'Tujuh'))) -> 'courses' ->> 0)::uuid;
      perform selftest.f12_advance(v_d4, 'STRUCTURED');
      perform selftest.as_user_uid(v_adm);
      select p.surface_state, to_jsonb(p.reasons) into v_state, v from public.studio_package_state(v_d4) p;
      v_seen := v_seen || array(select e ->> 'code' from jsonb_array_elements(v) e);
      if not (v @> '[{"code": "READINESS_NOT_VALIDATED"}]') then
        v_probs := selftest.f11_note(v_probs, 'F12-P04', 'a structured package does not say it is short of validation: ' || left(v::text, 200));
      end if;
      perform selftest.as_user_uid(v_guru);
      select i.id into v_item_d from public.items i join public.lessons l on l.id = i.lesson_id
        join public.modules m on m.id = l.module_id where m.course_id = v_d4 limit 1;
      update public.items set status = 'VALIDATED' where items.id = v_item_d;
      update public.items set status = 'VALIDATION_FAILED' where items.id = v_item_d;
      perform selftest.as_user_uid(v_adm);
      select p.surface_state, to_jsonb(p.reasons) into v_state, v from public.studio_package_state(v_d4) p;
      v_seen := v_seen || array(select e ->> 'code' from jsonb_array_elements(v) e);
      if v_state is distinct from 'BLOCKED' or not (v @> '[{"code": "READINESS_RETURNED", "count": 1}]') then
        v_probs := selftest.f11_note(v_probs, 'F12-P04', format('a returned question reads %s: %s', v_state, left(v::text, 200)));
      end if;
      perform selftest.as_owner();

      -- every rule was met, and every code met is the catalogue's (terbitan-kontrak.ts KODE_HAMBATAN).
      -- Sorted in C order to match the literal: under a linguistic collation, as
      -- on Supabase's stack, "_" weighs almost nothing and NO_RELEASE sorts before NOT_*.
      if (select array_agg(x order by x collate "C") from (select distinct x from unnest(v_seen) x) d) is distinct from array[
          'READINESS_AWAITING_REVIEW', 'READINESS_ITEM_ERROR', 'READINESS_ITEM_WARNING', 'READINESS_NOT_SEALED',
          'READINESS_NOT_VALIDATED', 'READINESS_NO_RELEASE', 'READINESS_RETURNED', 'READINESS_TEXT_ERROR',
          'READINESS_TEXT_WARNING'] then
        v_probs := selftest.f11_note(v_probs, 'F12-P04', 'the walk met ' || coalesce(array_to_string(
          (select array_agg(distinct coalesce(x, '(not a code)') order by coalesce(x, '(not a code)')) from unnest(v_seen) x), ', '), 'nothing'));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F12-P04', 'the test could not run: ' || left(sqlerrm, 200));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F12-P05  BOB-17 gate review: publish_readiness IS INTERNAL. It asks no
    --          permission and its answer names lessons, so nobody signed in
    --          calls it directly -- neither a learner nor another school's
    --          staff -- while studio_package_state and freeze_release, which
    --          ask their own permission and read it as its owner, still work
    --          for the school's staff.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user_uid(v_guru);
      v_course := selftest.f12_course(v_a, selftest.f12_paket('Hak Baca Kesiapan ' || v_tag,
        'Apa yang terjadi pada benda diam bila didorong?', 'Benda itu mulai bergerak', 'Benda itu tetap diam'));
      -- a learner of another school, and another school's administrator
      perform selftest.as_user('alpha-siswa-1@synthetic.pintar.test');
      v_code := selftest.f12_code(format('select to_jsonb(p) from public.publish_readiness(%L) p', v_course));
      perform selftest.as_user_uid(v_adm_b);
      v_code2 := selftest.f12_code(format('select to_jsonb(p) from public.publish_readiness(%L) p', v_course));
      perform selftest.as_owner();
      if v_code is null or v_code not like '42501 %' then
        v_probs := selftest.f11_note(v_probs, 'F12-P05', 'a learner calling publish_readiness on another school''s course answered '
          || coalesce(v_code, 'ok -- its lessons and findings were read'));
      end if;
      if v_code2 is null or v_code2 not like '42501 %' then
        v_probs := selftest.f11_note(v_probs, 'F12-P05', 'another school''s administrator calling publish_readiness answered '
          || coalesce(v_code2, 'ok -- its lessons and findings were read'));
      end if;
      if has_function_privilege('authenticated', 'public.publish_readiness(uuid)', 'execute') then
        v_probs := selftest.f11_note(v_probs, 'F12-P05', 'publish_readiness is executable by authenticated');
      end if;
      if exists (select 1 from public.client_rpc_registry g where g.function_name = 'publish_readiness') then
        v_probs := selftest.f11_note(v_probs, 'F12-P05', 'publish_readiness is still offered to clients in client_rpc_registry');
      end if;

      -- the school's own staff: the package's state, then the whole release path
      perform selftest.as_user_uid(v_adm);
      select p.surface_state into v_state from public.studio_package_state(v_course) p;
      if v_state is null then
        v_probs := selftest.f11_note(v_probs, 'F12-P05', 'the school''s administrator could not read the package''s state');
      end if;
      perform selftest.as_user_uid(v_kajur);
      perform selftest.f12_advance(v_course, 'APPROVED');
      perform selftest.as_user_uid(v_adm);
      v_rel := (public.create_release(v_course) ->> 'release')::uuid;
      perform selftest.as_user_uid(v_kajur);
      v := public.freeze_release(v_rel);
      perform selftest.as_owner();
      if (v ->> 'ok')::boolean is not true or not public.content_is_sealed(v_course) then
        v_probs := selftest.f11_note(v_probs, 'F12-P05', 'the head of department''s freeze, which reads readiness inside, did not seal: ' || left(v::text, 160));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F12-P05', 'the test could not run: ' || left(sqlerrm, 200));
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
      array['F12-P01', 'F12-P02', 'F12-P03', 'F12-N01', 'F12-N02', 'F12-N03', 'F12-P04', 'F12-P05'],
      array['BOB-03 -- a school''s course goes approve, create, freeze, publish, and the teacher sees it',
            'BOB-03 -- a correction is a revision whose release is the next minor version',
            'BOB-03 -- the release is the course''s: its author cannot freeze it',
            'BOB-03 -- every refusal on the release path is its stable code',
            'BOB-03 -- readiness is measured at the seal; a blocked course is not frozen',
            'BOB-03 -- releases change only through their functions (D-041)',
            'BOB-17 -- every readiness rule is its own code with its parameters (D-011)',
            'BOB-17 -- publish_readiness is internal: nobody signed in reads it directly'],
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
          || 'another school''s admin and an unknown course (answering identically), a school role''s release of the platform '
          || 'library (the platform admin''s answers the course''s own state, D-120 Q7), a second '
          || 'freeze, a teacher''s freeze, publishing an unfrozen release, a head of department''s withdrawal, a '
          || 'withdrawal without a reason and another school''s withdrawal; the release was left as it was, and a '
          || 'second click on Terbitkan published and audited nothing twice', m_refused),
        'a course whose question names its answer had no findings until freeze_release ran the validators; the freeze '
          || 'answered ok=false RELEASE_NOT_READY with readiness BLOCKED naming STEM_REVEALS_ANSWER, left the release '
          || 'INGESTED and the course unsealed, and kept the finding for the author',
        'a teacher''s direct insert of a release naming the head of department as author and an admin''s direct update '
          || 'of a published release were both refused by the database (42501, no grant), no write policy remains on '
          || 'plp_releases, and the teacher still reads the school''s releases',
        'publish_readiness answered every planted findings rule as its own code -- READINESS_TEXT_ERROR and '
          || 'READINESS_TEXT_WARNING per lesson (and one for the course as a whole), READINESS_ITEM_ERROR and '
          || 'READINESS_ITEM_WARNING per lesson and pattern -- each with its count, lesson and pattern and no sentence; '
          || 'BLOCKED for an error, ACTION_REQUIRED for warnings alone, READY and [] once all were acknowledged; '
          || 'studio_package_state added READINESS_AWAITING_REVIEW and READINESS_NO_RELEASE in review, '
          || 'READINESS_NOT_SEALED once approved and released, READINESS_NOT_VALIDATED for a structured package and '
          || 'READINESS_RETURNED (BLOCKED) for a returned question; the nine codes met are exactly the catalogue''s',
        'a learner of another school and another school''s administrator calling publish_readiness on a school''s '
          || 'draft course were each refused 42501 (no grant) and read nothing; authenticated holds no execute on it and '
          || 'client_rpc_registry no longer offers it; the school''s administrator still read the package''s state '
          || 'through studio_package_state, and the head of department''s freeze, which reads readiness inside, sealed the course'
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
