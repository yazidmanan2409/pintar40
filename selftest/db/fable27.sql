-- FABLE-27 · D-183 (F-4(f); K6, D-179(b), D-182(7)): EXPOSED QUESTIONS NEVER GIVE A REAL VERDICT.
--
-- The 20 chapters whose answer keys were made public on 2 Nov are treated as compromised. The owner approved the
-- protective flag on three conditions, and each test holds one of them against the real assign and start paths:
--   F27-X01  (1) A REFUSAL, NOT A WARNING: a school that is not synthetic is refused a Pemetaan Awal / Cek penguasaan
--            of a course carrying an exposed title, PR050 ASSIGN_EXPOSED_CONTENT, and nothing is made
--   F27-X02  (1) the same for a RENAMED copy whose questions carry an exposed fingerprint; a «correction» of an exposed
--            course that keeps an exposed question is refused too
--   F27-X03  a REGENERATED chapter (a correction of the exposed course, with new questions) is given normally
--   F27-X04  (1) an assignment made BEFORE the school became real cannot be sat as a real assessment: the start is
--            refused with the same code
--   F27-X05  (2) SYNTHETIC SCHOOLS KEEP WORKING: the same exposed course is assigned and sat in a synthetic school
--   F27-X06  the marks: 20 titles and 240 question fingerprints, permanent (no update, no delete), unreadable by a
--            signed-in person, and no question text in them
--
-- A real school is the seeded learning-cycle school marked not synthetic; the environment is set to production first
-- (as fable01 and fable09 do), because outside production the D1 bootstrap guard refuses a school that is not synthetic. EVERY ROW IS ROLLED BACK: one subtransaction, a sentinel, the verdicts after.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.f13_release(uuid,jsonb,boolean,boolean)') is null
     or to_regprocedure('selftest.f13_code(text)') is null then
    raise exception 'apply fable11, fable12 and fable13.sql before fable27.sql: the helpers are missing';
  end if;
end $$;

create or replace function selftest.f27_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
grant execute on function selftest.f27_note(jsonb, text, text) to authenticated, anon;

-- A published lesson with its school pass mark set, ready to assign; p_stem replaces its first pre-test question;
-- p_revises makes it a correction of that course, through the correction line (ingest_batches.revises_course_id), the
-- only way a course's lineage is set (ADR-0016). The steps after the upload are f13_release's.
create or replace function selftest.f27_lesson(p_inst uuid, p_title text, p_stem text default null, p_revises uuid default null)
returns table (course uuid, release uuid)
language plpgsql set search_path = public, pg_temp as $$
declare v_paket jsonb := selftest.f13_paket(p_title, 2, 2, false); v_batch uuid; v jsonb; r record;
begin
  if p_stem is not null then
    v_paket := jsonb_set(v_paket, '{courses,0,modules,0,lessons,0,items,0,stem}', to_jsonb(p_stem));
  end if;
  if p_revises is null then
    select * into r from selftest.f13_release(p_inst, v_paket, true);
    course := r.course; release := r.release;
  else
    perform selftest.as_user('siklus-guru@synthetic.pintar.test');
    v_batch := selftest.f11_batch(p_inst, 'STRUCTURED_PACKAGE', v_paket);
    update public.ingest_batches b set revises_course_id = p_revises, change_summary = 'Soal Pemetaan Awal dan Cek penguasaan diganti.'
     where b.id = v_batch;
    perform public.prepare_ingest_batch(v_batch);
    v := public.confirm_ingest_batch(v_batch);
    if (v ->> 'ok')::boolean is not true then raise exception 'the correction did not materialise: %', left((v -> 'problems')::text, 300); end if;
    course := (v -> 'courses' ->> 0)::uuid;
    perform selftest.f12_advance(course, 'STRUCTURED');
    perform selftest.f12_advance(course, 'VALIDATED');
    perform selftest.f12_advance(course, 'IN_REVIEW');
    perform selftest.as_user('siklus-kaprodi@synthetic.pintar.test');
    perform selftest.f12_advance(course, 'APPROVED');
    perform selftest.as_user('siklus-admin@synthetic.pintar.test');
    release := (public.create_release(course) ->> 'release')::uuid;
    perform selftest.as_user('siklus-kaprodi@synthetic.pintar.test');
    v := public.freeze_release(release);
    if (v ->> 'ok')::boolean is not true then raise exception 'the correction did not freeze: %', left(v::text, 160); end if;
    for r in select f.id from public.mcq_quality_findings f where f.course_id = course and f.acknowledged_at is null loop
      perform public.acknowledge_finding('MCQ_QUALITY', r.id, 'F27');
    end loop;
    for r in select f.id from public.coaching_findings f where f.course_id = course and f.acknowledged_at is null loop
      perform public.acknowledge_finding('COACHING', r.id, 'F27');
    end loop;
    perform selftest.as_user('siklus-admin@synthetic.pintar.test');
    perform public.publish_release(release);
    perform selftest.as_owner();
    if not exists (select 1 from public.courses c where c.id = course and c.supersedes_course_id = p_revises) then
      raise exception 'the correction does not name the course it corrects';
    end if;
  end if;
  perform selftest.as_user('siklus-admin@synthetic.pintar.test');
  perform public.set_school_pass_mark(p_inst, course, 70, 'F27: ketetapan sekolah');
  perform selftest.as_owner();
  return next;
end $$;
drop function if exists selftest.f27_lesson(uuid, text, text);
revoke all on function selftest.f27_lesson(uuid, text, text, uuid) from public;
grant execute on function selftest.f27_lesson(uuid, text, text, uuid) to authenticated;

-- The assignment of p_release to the class, as the class's teacher: its refusal code, or null when it was made.
create or replace function selftest.f27_assign(p_release uuid, p_class uuid)
returns text language plpgsql set search_path = public, pg_temp as $$
declare v text;
begin
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  v := selftest.f13_code(format('select public.assign_release(%L, %L, null, %L)', p_release, p_class, now() + interval '30 days'));
  perform selftest.as_owner();
  return v;
end $$;
revoke all on function selftest.f27_assign(uuid, uuid) from public;
grant execute on function selftest.f27_assign(uuid, uuid) to authenticated;

create or replace function selftest.run_fable27()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; v_probs jsonb := '{}'::jsonb; v_fatal text := ''; v_tag text := to_char(clock_timestamp(), 'HH24MISSUS');
  v_inst uuid; v_cls uuid; v_code text; v_n int; v_m int; v_v jsonb; v_la uuid; v_pre uuid; v_s uuid;
  v_exposed constant text := 'Matematika Kelas 5 · Bab 6: Sudut';
  v_a record; v_b record; v_c record; v_d record; v_e record; v_f record;
begin
  perform selftest.as_owner();
  begin
    select i.id into v_inst from public.institutions i where i.slug like 'synth-siklus-%' order by i.created_at desc limit 1;
    if v_inst is null then raise exception 'the seeded learning-cycle school is not there'; end if;
    select n.id into v_cls from public.org_nodes n where n.institution_id = v_inst and n.kind = 'CLASS' order by n.created_at limit 1;

    -- ── while the school is synthetic (condition 2)
    -- F27-X05: an exposed chapter is assigned and sat as before
    begin
      select * into v_a from selftest.f27_lesson(v_inst, v_exposed);
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v_v := public.assign_release(v_a.release, v_cls, null, now() + interval '30 days');
      perform selftest.as_owner();
      v_la := (v_v ->> 'learning_assignment')::uuid; v_pre := (v_v ->> 'pre_assignment')::uuid;
      if v_la is null or v_pre is null then
        v_probs := selftest.f27_note(v_probs, 'F27-X05', 'a synthetic school could not be given an exposed chapter: ' || left(v_v::text, 120));
      else
        perform selftest.as_user('siklus-email@synthetic.pintar.test');
        v_s := public.start_learning_session(v_pre);
        perform selftest.as_owner();
        select count(*) into v_n from public.assessment_sessions s where s.id = v_s and s.evidence_class = 'SYNTHETIC';
        if v_n <> 1 then v_probs := selftest.f27_note(v_probs, 'F27-X05', 'the synthetic sitting was not started as SYNTHETIC evidence'); end if;
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f27_note(v_probs, 'F27-X05', 'a synthetic school was refused: ' || left(sqlerrm, 160));
    end;

    -- F27-X04, part one: an assignment made while the school was synthetic, of another exposed chapter, not yet started
    begin
      select * into v_b from selftest.f27_lesson(v_inst, 'Matematika Kelas 5 · Bab 8: Data');
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v_v := public.assign_release(v_b.release, v_cls, null, now() + interval '30 days');
      perform selftest.as_owner();
      v_pre := (v_v ->> 'pre_assignment')::uuid;
      if v_pre is null then raise exception 'the earlier assignment was not made: %', left(v_v::text, 120); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f27_note(v_probs, 'F27-X04', 'the test could not run: ' || left(sqlerrm, 160));
      v_pre := null;
    end;

    -- ── the school becomes real
    update public.platform_environment set environment = 'production';
    update public.institutions i set is_synthetic = false where i.id = v_inst;

    -- F27-X04, part two: that assignment cannot be sat as a real assessment
    begin
      if v_pre is null then raise exception 'no earlier assignment to start'; end if;
      perform selftest.as_user('siklus-email@synthetic.pintar.test');
      v_code := selftest.f13_code(format('select public.start_learning_session(%L)', v_pre));
      perform selftest.as_owner();
      if v_code is distinct from 'ASSIGN_EXPOSED_CONTENT' then
        v_probs := selftest.f27_note(v_probs, 'F27-X04', 'a real learner starting an exposed Pemetaan Awal answered ' || coalesce(v_code, 'ok -- it started'));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f27_note(v_probs, 'F27-X04', 'the test could not run: ' || left(sqlerrm, 160));
    end;

    -- F27-X01: a fresh course carrying an exposed title is refused, and nothing is made
    begin
      select * into v_c from selftest.f27_lesson(v_inst, 'Matematika Kelas X · Bab 7: Peluang');
      select count(*) into v_n from public.learning_assignments la where la.plp_release_id = v_c.release;
      v_code := selftest.f27_assign(v_c.release, v_cls);
      select count(*) into v_m from public.learning_assignments la where la.plp_release_id = v_c.release;
      if v_code is distinct from 'ASSIGN_EXPOSED_CONTENT' then
        v_probs := selftest.f27_note(v_probs, 'F27-X01', 'a real school given an exposed chapter answered ' || coalesce(v_code, 'ok -- it was assigned'));
      end if;
      if v_m <> v_n then v_probs := selftest.f27_note(v_probs, 'F27-X01', 'the refused assignment left a learning assignment behind'); end if;
      -- the case and spacing of the title do not matter
      select * into v_c from selftest.f27_lesson(v_inst, '  matematika kelas x ·   bab 7: PELUANG ');
      v_code := selftest.f27_assign(v_c.release, v_cls);
      if v_code is distinct from 'ASSIGN_EXPOSED_CONTENT' then
        v_probs := selftest.f27_note(v_probs, 'F27-X01', 'the exposed title in another case and spacing answered ' || coalesce(v_code, 'ok -- it was assigned'));
      end if;
      -- an ordinary lesson is given normally in the same real school
      select * into v_c from selftest.f27_lesson(v_inst, 'Pecahan F27 ' || v_tag);
      v_code := selftest.f27_assign(v_c.release, v_cls);
      if v_code is not null then v_probs := selftest.f27_note(v_probs, 'F27-X01', 'an ordinary lesson in a real school answered ' || v_code); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f27_note(v_probs, 'F27-X01', 'the test could not run: ' || left(sqlerrm, 160));
    end;

    -- F27-X02 and F27-X03: one exposed question fingerprint (a synthetic stem, marked inside this rolled-back block;
    -- no exposed text enters the tree)
    begin
      insert into public.exposed_content_marks (kind, fingerprint)
      values ('STEM', public.exposure_fingerprint('Soal terpapar F27 ' || v_tag || ' tentang pecahan?'));
      -- a renamed copy carrying it
      select * into v_d from selftest.f27_lesson(v_inst, 'Bab baru F27 ' || v_tag, 'SOAL terpapar F27 ' || v_tag || '   tentang pecahan?');
      v_code := selftest.f27_assign(v_d.release, v_cls);
      if v_code is distinct from 'ASSIGN_EXPOSED_CONTENT' then
        v_probs := selftest.f27_note(v_probs, 'F27-X02', 'a renamed copy with an exposed question answered ' || coalesce(v_code, 'ok -- it was assigned'));
      end if;
      -- a «correction» of the exposed course that keeps an exposed question
      select * into v_e from selftest.f27_lesson(v_inst, v_exposed, 'Soal terpapar F27 ' || v_tag || ' tentang pecahan?', v_a.course);
      v_code := selftest.f27_assign(v_e.release, v_cls);
      if v_code is distinct from 'ASSIGN_EXPOSED_CONTENT' then
        v_probs := selftest.f27_note(v_probs, 'F27-X02', 'a correction keeping an exposed question answered ' || coalesce(v_code, 'ok -- it was assigned'));
      end if;
      -- F27-X03: a regenerated correction (same title, new questions) is given normally; a correction revises the newest
      -- version of its line, which is now the one above
      select * into v_f from selftest.f27_lesson(v_inst, v_exposed, 'Soal baru F27 ' || v_tag || ' tentang pecahan?', v_e.course);
      v_code := selftest.f27_assign(v_f.release, v_cls);
      if v_code is not null then
        v_probs := selftest.f27_note(v_probs, 'F27-X03', 'a regenerated chapter in a real school answered ' || v_code);
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f27_note(v_probs, 'F27-X02', 'the test could not run: ' || left(sqlerrm, 360));
      v_probs := selftest.f27_note(v_probs, 'F27-X03', 'the test could not run: ' || left(sqlerrm, 160));
    end;

    -- F27-X06: the marks
    begin
      select count(*) filter (where kind = 'TITLE'), count(*) filter (where kind = 'STEM') into v_n, v_m
        from public.exposed_content_marks where exposure = 'TERPAPAR_2026_11_02';
      if v_n <> 20 or v_m < 240 then
        v_probs := selftest.f27_note(v_probs, 'F27-X06', format('%s title and %s question marks, expected 20 and 240', v_n, v_m));
      end if;
      select count(*) into v_n from public.exposed_content_marks where fingerprint !~ '^[0-9a-f]{64}$';
      if v_n <> 0 then v_probs := selftest.f27_note(v_probs, 'F27-X06', 'a mark holds something other than a fingerprint'); end if;
      v_code := selftest.f13_code('update public.exposed_content_marks set exposure = ''CLEARED''');
      if v_code is distinct from 'EXPOSURE_MARK_FIXED' then
        v_probs := selftest.f27_note(v_probs, 'F27-X06', 'clearing a mark answered ' || coalesce(v_code, 'ok -- it was cleared'));
      end if;
      v_code := selftest.f13_code('delete from public.exposed_content_marks');
      if v_code is distinct from 'EXPOSURE_MARK_FIXED' then
        v_probs := selftest.f27_note(v_probs, 'F27-X06', 'deleting the marks answered ' || coalesce(v_code, 'ok -- they were deleted'));
      end if;
      perform selftest.as_user('siklus-admin@synthetic.pintar.test');
      v_code := selftest.f13_code('select count(*) from public.exposed_content_marks');
      perform selftest.as_owner();
      if v_code is null then v_probs := selftest.f27_note(v_probs, 'F27-X06', 'a signed-in school admin read the marks'); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f27_note(v_probs, 'F27-X06', 'the test could not run: ' || left(sqlerrm, 160));
    end;

    raise exception 'F27_ROLLBACK';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F27_ROLLBACK' then v_fatal := sqlerrm; end if;
  end;
  perform selftest.as_owner();

  for r in select * from unnest(
      array['F27-X01', 'F27-X02', 'F27-X03', 'F27-X04', 'F27-X05', 'F27-X06'],
      array['D-183(1) -- an exposed chapter is refused as a real assessment, and nothing is made',
            'D-183(1) -- a renamed copy or a correction that keeps an exposed question is refused',
            'D-183 -- a regenerated chapter is given normally',
            'D-183(1) -- an assignment made before cannot be sat as a real assessment',
            'D-183(2) -- synthetic schools keep working',
            'D-183 -- the marks are fingerprints only, permanent and unreadable'],
      array[
        'in the learning-cycle school made real (not synthetic, production environment), the teacher''s assign_release of a '
          || 'published lesson titled «Matematika Kelas X · Bab 7: Peluang» answered PR050 ASSIGN_EXPOSED_CONTENT and left no '
          || 'learning assignment; the same title in another case and spacing was refused too; an ordinary lesson was given',
        'a lesson under a new title whose first Pemetaan Awal question carries an exposed fingerprint (differing in case and '
          || 'spacing) was refused ASSIGN_EXPOSED_CONTENT, and so was a correction of the exposed course that kept that question',
        'a correction of the exposed course, under the same title, with new questions, was assigned in the real school',
        'a Pemetaan Awal of an exposed chapter assigned while the school was synthetic: once the school is real, the learner''s '
          || 'start_learning_session answered PR050 ASSIGN_EXPOSED_CONTENT',
        'while the school was synthetic, «Matematika Kelas 5 · Bab 6: Sudut» was assigned to its class and its learner started '
          || 'the Pemetaan Awal as SYNTHETIC evidence',
        '20 title and 240 question marks of TERPAPAR_2026_11_02, every one a sha256 fingerprint; an update and a delete '
          || 'answered EXPOSURE_MARK_FIXED; a signed-in school admin cannot read the table'
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

  id := 'F27-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-27 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable27() from public;
grant execute on function selftest.run_fable27() to authenticated;
