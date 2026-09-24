-- FABLE-13 database suite: BOB-04, a lesson is assigned whole (D-008, audit B4).
--
-- Ordering: depends on fable01.sql (role switches), fable03.sql (answer_paper,
-- over the seeded learning-cycle school), fable11.sql (f11_user, f11_batch,
-- f11_raised, f11_note) and fable12.sql (f12_advance). Never applied as a
-- migration; never present in production.
--
-- It works inside the seeded learning-cycle school (supabase/seed/
-- learning_cycle.sql): its teacher uploads a package, its head of department
-- reviews, its admin releases, and its email learner -- a member of the class
-- -- takes the cycle.
--
--   F13-P01  a package's course carries its PRE_TEST and POST_TEST, reviewed
--            with it; assigning the published release makes the learning
--            assignment and both tests, open, in one call, audited
--   F13-P02  the learner completes pre -> lesson -> post -> result, and each
--            test draws only the questions marked for it
--   F13-N01  a lesson that cannot make a whole cycle is refused with its code
--            and makes nothing: no pre-test, a post-test that shares parallel
--            groups with the pre-test (INV-24; made after upload, as hand-authored
--            content still could), an unpublished release, a second
--            assignment, a bad window, a class that is not one, and people who
--            may not assign
--   F13-N02  a stranger asking for someone's cycle gets a code, not the cycle
--   F13-N03  the upload refuses a parallel group that holds both a pre-test and
--            a post-test question, naming every row of it (D-040)
--
-- EVERY ROW IS ROLLED BACK: one subtransaction, verdicts collected in a jsonb
-- of problems, a sentinel to undo the lot, and the findings emitted afterwards.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.f12_advance(uuid, public.content_status)') is null
     or to_regprocedure('selftest.answer_paper(uuid, boolean, boolean)') is null then
    raise exception 'apply fable03.sql and fable12.sql before fable13.sql';
  end if;
end $$;

-- A package of one lesson: p_pre questions for the pre-test, p_post for the
-- post-test, one practice question. Each pre question has its own parallel
-- group; the post questions share them when p_overlap, and have their own
-- otherwise.
create or replace function selftest.f13_paket(p_title text, p_pre int, p_post int, p_overlap boolean)
returns jsonb language sql immutable as $$
  select jsonb_build_object('courses', jsonb_build_array(jsonb_build_object(
    'title', p_title, 'subject', 'Matematika', 'stage', 'SD', 'grade_label', 'Kelas 5',
    'modules', jsonb_build_array(jsonb_build_object('title', 'Bab satu', 'lessons', jsonb_build_array(
      jsonb_build_object('title', 'Pelajaran satu', 'body_markdown', 'Isi pelajaran untuk murid kelas lima.',
        'items',
          coalesce((select jsonb_agg(jsonb_build_object(
              '_row', jsonb_build_object('sheet', 'Soal', 'row', k + 1),
              'stem', format('Pertanyaan awal nomor %s tentang pecahan?', k), 'use', 'PRE_TEST',
              'parallel_group', 'A' || k,
              'options', jsonb_build_array(
                jsonb_build_object('label', 'A', 'body', format('Pilihan tepat %s', k), 'is_correct', true, 'rationale', 'Ini tepat.'),
                jsonb_build_object('label', 'B', 'body', format('Pilihan lain %s', k), 'is_correct', false, 'rationale', 'Ini belum tepat.'))))
             from generate_series(1, p_pre) k), '[]'::jsonb)
          || coalesce((select jsonb_agg(jsonb_build_object(
              '_row', jsonb_build_object('sheet', 'Soal', 'row', p_pre + k + 1),
              'stem', format('Pertanyaan akhir nomor %s tentang pecahan?', k), 'use', 'POST_TEST',
              'parallel_group', case when p_overlap then 'A' || k else 'B' || k end,
              'options', jsonb_build_array(
                jsonb_build_object('label', 'A', 'body', format('Pilihan tepat %s', k), 'is_correct', true, 'rationale', 'Ini tepat.'),
                jsonb_build_object('label', 'B', 'body', format('Pilihan lain %s', k), 'is_correct', false, 'rationale', 'Ini belum tepat.'))))
             from generate_series(1, p_post) k), '[]'::jsonb)
          || jsonb_build_array(jsonb_build_object(
              'stem', 'Pertanyaan latihan tentang pecahan?',
              'options', jsonb_build_array(
                jsonb_build_object('label', 'A', 'body', 'Pilihan tepat latihan', 'is_correct', true, 'rationale', 'Ini tepat.'),
                jsonb_build_object('label', 'B', 'body', 'Pilihan lain latihan', 'is_correct', false, 'rationale', 'Ini belum tepat.'))))
      )))))))
$$;
revoke all on function selftest.f13_paket(text, int, int, boolean) from public;
grant execute on function selftest.f13_paket(text, int, int, boolean) to authenticated;

-- A package taken all the way to a PUBLISHED release, by the people the
-- capabilities name: the teacher uploads, the head of department approves and
-- freezes, the admin creates and publishes. Returns the course and release.
-- p_publish false stops at FROZEN.
-- the earlier three-argument form, so a reload onto an existing database is not ambiguous
drop function if exists selftest.f13_release(uuid, jsonb, boolean);
create or replace function selftest.f13_release(p_inst uuid, p_paket jsonb, p_publish boolean default true,
                                                p_overlap boolean default false)
returns table (course uuid, release uuid)
language plpgsql set search_path = public, pg_temp as $$
declare v_batch uuid; v jsonb; r record;
begin
  perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  v_batch := selftest.f11_batch(p_inst, 'STRUCTURED_PACKAGE', p_paket);
  perform public.prepare_ingest_batch(v_batch);
  v := public.confirm_ingest_batch(v_batch);
  if (v ->> 'ok')::boolean is not true then raise exception 'the fixture package did not materialise: %', left(v::text, 160); end if;
  course := (v -> 'courses' ->> 0)::uuid;
  -- p_overlap: after the upload (which refuses it, D-040), each post-test
  -- question joins the parallel group of a pre-test question, as hand-authored
  -- content still could -- so assign_release's own INV-24 check is exercised
  if p_overlap then
    perform selftest.as_owner();
    with pre as (select i.parallel_group g, row_number() over (order by i.stem) n from public.items i
                   join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
                  where m.course_id = course and i.cycle_role = 'PRE_TEST'),
         post as (select i.id, row_number() over (order by i.stem) n from public.items i
                   join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
                  where m.course_id = course and i.cycle_role = 'POST_TEST')
    update public.items it set parallel_group = pre.g from post join pre on pre.n = post.n where it.id = post.id;
    perform selftest.as_user('siklus-guru@synthetic.pintar.test');
  end if;
  perform selftest.f12_advance(course, 'STRUCTURED');
  perform selftest.f12_advance(course, 'VALIDATED');
  perform selftest.f12_advance(course, 'IN_REVIEW');
  perform selftest.as_user('siklus-kaprodi@synthetic.pintar.test');
  perform selftest.f12_advance(course, 'APPROVED');
  perform selftest.as_user('siklus-admin@synthetic.pintar.test');
  release := (public.create_release(course) ->> 'release')::uuid;
  perform selftest.as_user('siklus-kaprodi@synthetic.pintar.test');
  v := public.freeze_release(release);
  if (v ->> 'ok')::boolean is not true then raise exception 'the fixture release did not freeze: %', left(v::text, 160); end if;
  for r in select f.id from public.mcq_quality_findings f where f.course_id = course and f.acknowledged_at is null loop
    perform public.acknowledge_finding('MCQ_QUALITY', r.id, 'F13');
  end loop;
  for r in select f.id from public.coaching_findings f where f.course_id = course and f.acknowledged_at is null loop
    perform public.acknowledge_finding('COACHING', r.id, 'F13');
  end loop;
  if p_publish then
    perform selftest.as_user('siklus-admin@synthetic.pintar.test');
    perform public.publish_release(release);
  end if;
  perform selftest.as_owner();
  return next;
end $$;
revoke all on function selftest.f13_release(uuid, jsonb, boolean, boolean) from public;
grant execute on function selftest.f13_release(uuid, jsonb, boolean, boolean) to authenticated;

-- A refusal's stable code, or null when the call went through.
create or replace function selftest.f13_code(p_sql text)
returns text language sql set search_path = public, pg_temp as $$
  select case when e is null then null when e ->> 'code' = 'PR050' then e ->> 'detail'
              else coalesce(e ->> 'code', '?') || ' ' || left(coalesce(e ->> 'message', ''), 120) end
    from selftest.f11_raised(p_sql) e
$$;
revoke all on function selftest.f13_code(text) from public;
grant execute on function selftest.f13_code(text) to authenticated, anon;

-- ═══════════════════════════════════════════════════════════════ the suite
create or replace function selftest.run_fable13()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; n int; m int; v jsonb; v_code text; v_state text; v_tag text;
  v_inst uuid; v_cls uuid; v_root uuid; v_other_cls uuid; v_dean uuid;
  v_course uuid; v_rel uuid; v_la uuid; v_aa_pre uuid; v_aa_post uuid; v_def_pre uuid; v_def_post uuid;
  v_s_pre uuid; v_s_post uuid; v_lesson uuid;
  v_probs jsonb := '{}'::jsonb; v_fatal text := '';
  m_steps int := 0; m_refused int := 0;
begin
  perform selftest.as_owner();
  begin
    v_tag := substr(md5(random()::text), 1, 8);
    select i.id into v_inst from public.institutions i where i.slug like 'synth-siklus-%' order by i.created_at desc limit 1;
    if v_inst is null then raise exception 'the seeded learning-cycle school is not there'; end if;
    select n.id into v_cls from public.org_nodes n where n.institution_id = v_inst and n.kind = 'CLASS' order by n.created_at limit 1;
    select n.id into v_root from public.org_nodes n where n.institution_id = v_inst and n.kind = 'INSTITUTION' limit 1;
    select n.id into v_other_cls from public.org_nodes n
     where n.kind = 'CLASS' and n.institution_id <> v_inst and n.is_active and n.academic_period_id is not null limit 1;
    v_dean := selftest.f11_user('f13-dekan-' || v_tag || '@local.invalid', 'DEAN', v_inst);

    -- ═══════════════════════════════════════════════════════════════════════
    -- F13-P01  THE COURSE CARRIES ITS TESTS; ASSIGNING MAKES THE WHOLE CYCLE.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      select * into r from selftest.f13_release(v_inst, selftest.f13_paket('Pecahan F13 ' || v_tag, 3, 2, false), false);
      v_course := r.course; v_rel := r.release;
      select d.id into v_def_pre from public.assessment_definitions d
       where d.course_id = v_course and d.mode = 'PRE_TEST' and d.item_count = 3 and d.status = 'APPROVED' and not d.is_ad_hoc;
      select d.id into v_def_post from public.assessment_definitions d
       where d.course_id = v_course and d.mode = 'POST_TEST' and d.item_count = 2 and d.status = 'APPROVED' and not d.is_ad_hoc;
      if v_def_pre is null or v_def_post is null then
        v_probs := selftest.f11_note(v_probs, 'F13-P01', 'the course does not carry an approved pre-test of 3 and post-test of 2 questions');
      else m_steps := m_steps + 1; end if;

      -- frozen but not published: not yet assignable
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v_code := selftest.f13_code(format('select public.assign_release(%L, %L, null, null)', v_rel, v_cls));
      perform selftest.as_owner();
      if v_code is distinct from 'ASSIGN_RELEASE_NOT_PUBLISHED' then
        v_probs := selftest.f11_note(v_probs, 'F13-N01', 'an unpublished release answered ' || coalesce(v_code, 'ok -- it was assigned'));
      else m_refused := m_refused + 1; end if;

      perform selftest.as_user('siklus-admin@synthetic.pintar.test');
      perform public.publish_release(v_rel);
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v := public.assign_release(v_rel, v_cls, null, now() + interval '30 days');
      perform selftest.as_owner();
      v_la := (v ->> 'learning_assignment')::uuid;
      v_aa_pre := (v ->> 'pre_assignment')::uuid;
      v_aa_post := (v ->> 'post_assignment')::uuid;
      select count(*) into n from public.learning_assignments la
       where la.id = v_la and la.status = 'ACTIVE' and la.plp_release_id = v_rel and la.node_id = v_cls
         and la.learning_cycle = jsonb_build_object('pre_test', v_def_pre, 'post_test', v_def_post);
      select count(*) into m from public.assessment_assignments a
       where a.learning_assignment_id = v_la and a.status = 'OPEN' and a.node_id = v_cls
         and ((a.id = v_aa_pre and a.assessment_definition_id = v_def_pre)
           or (a.id = v_aa_post and a.assessment_definition_id = v_def_post));
      if (v ->> 'ok')::boolean is not true or n <> 1 or m <> 2 then
        v_probs := selftest.f11_note(v_probs, 'F13-P01', format('assigning answered %s; %s active learning assignment(s), %s open test(s) of 2',
          left(v::text, 120), n, m));
      else m_steps := m_steps + 1; end if;
      select count(*) into n from public.audit_log al where al.target_id = v_la::text and al.action = 'LEARNING_ASSIGNED';
      if n <> 1 then v_probs := selftest.f11_note(v_probs, 'F13-P01', format('%s LEARNING_ASSIGNED audit row(s), expected 1', n));
      else m_steps := m_steps + 1; end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F13-P01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F13-P02  THE LEARNER COMPLETES PRE -> LESSON -> POST -> RESULT, AND EACH
    --          TEST DRAWS ONLY ITS OWN QUESTIONS.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_def_pre is null or v_def_post is null then raise exception 'F13-P01 made no tests to draw from'; end if;
      -- the draw follows the marks, exactly (read from the definitions, so it
      -- speaks even when the assignment below could not be made)
      select count(*) into n from public.eligible_items_for_definition(v_def_pre) e
        join public.items i on i.id = e.item_id where i.cycle_role = 'PRE_TEST';
      select count(*) into m from public.eligible_items_for_definition(v_def_pre);
      if n <> 3 or m <> 3 then
        v_probs := selftest.f11_note(v_probs, 'F13-P02', format('the pre-test may draw %s question(s), %s of them marked for it; expected 3 and 3', m, n));
      end if;
      select count(*) into n from public.eligible_items_for_definition(v_def_post) e
        join public.items i on i.id = e.item_id where i.cycle_role = 'POST_TEST';
      select count(*) into m from public.eligible_items_for_definition(v_def_post);
      if n <> 2 or m <> 2 then
        v_probs := selftest.f11_note(v_probs, 'F13-P02', format('the post-test may draw %s question(s), %s of them marked for it; expected 2 and 2', m, n));
      end if;

      if v_la is null then raise exception 'F13-P01 made no assignment to take'; end if;
      perform selftest.as_user('siklus-email@synthetic.pintar.test');
      select * into r from public.my_cycle_state(v_la);
      if r.pre_assignment is distinct from v_aa_pre or r.post_assignment is distinct from v_aa_post then
        v_probs := selftest.f11_note(v_probs, 'F13-P02', 'the learner''s cycle does not show both tests');
      end if;
      v_s_pre := public.start_learning_session(v_aa_pre);
      perform selftest.answer_paper(v_s_pre, true);
      perform public.finish_my_session(v_s_pre);
      select lesson_id into v_lesson from public.learner_lessons(v_la) limit 1;
      perform public.record_lesson_progress(v_la, v_lesson, 1, 1);
      v_s_post := public.start_learning_session(v_aa_post);
      perform selftest.answer_paper(v_s_post, true);
      perform public.finish_my_session(v_s_post);
      v := public.session_outcome(v_s_post);
      select * into r from public.my_cycle_state(v_la);
      perform selftest.as_owner();
      if v is null or r.pre_status is distinct from 'FINALIZED' or r.post_status is distinct from 'FINALIZED' then
        v_probs := selftest.f11_note(v_probs, 'F13-P02', format('the cycle ended at pre %s, post %s, outcome %s',
          r.pre_status, r.post_status, coalesce(left(v::text, 80), 'none')));
      end if;
      select count(*) filter (where i.cycle_role = 'PRE_TEST'), count(*) into n, m
        from public.presented_items p join public.items i on i.id = p.item_id where p.session_id = v_s_pre;
      if n <> 3 or m <> 3 then
        v_probs := selftest.f11_note(v_probs, 'F13-P02', format('the pre-test presented %s question(s), %s marked for it', m, n));
      end if;
      select count(*) filter (where i.cycle_role = 'POST_TEST'), count(*) into n, m
        from public.presented_items p join public.items i on i.id = p.item_id where p.session_id = v_s_post;
      if n <> 2 or m <> 2 then
        v_probs := selftest.f11_note(v_probs, 'F13-P02', format('the post-test presented %s question(s), %s marked for it', m, n));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F13-P02', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F13-N01  A LESSON THAT CANNOT MAKE A WHOLE CYCLE IS REFUSED, WITH ITS
    --          CODE, AND MAKES NOTHING.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_rel is null then raise exception 'F13-P01 made no release to probe'; end if;
      for r in
        select * from (values
          ('a second assignment to the class',  'siklus-guru@synthetic.pintar.test', format('select public.assign_release(%L, %L, null, null)', v_rel, v_cls), 'ASSIGN_EXISTS'),
          ('a window that closes before it opens', 'siklus-guru@synthetic.pintar.test', format('select public.assign_release(%L, %L, %L, %L)', v_rel, v_cls, now() + interval '2 days', now() + interval '1 day'), 'ASSIGN_WINDOW_INVALID'),
          ('the school itself instead of a class', 'siklus-guru@synthetic.pintar.test', format('select public.assign_release(%L, %L, null, null)', v_rel, v_root), 'ASSIGN_CLASS_INVALID'),
          ('an unknown release',                 'siklus-guru@synthetic.pintar.test', format('select public.assign_release(%L, %L, null, null)', gen_random_uuid(), v_cls), 'ASSIGN_NOT_ALLOWED')
        ) t(label, who, stmt, want)
      loop
        perform selftest.as_user(r.who);
        v_code := selftest.f13_code(r.stmt);
        perform selftest.as_owner();
        if v_code is distinct from r.want then
          v_probs := selftest.f11_note(v_probs, 'F13-N01', format('%s answered %s, expected %s', r.label, coalesce(v_code, 'ok'), r.want));
        else m_refused := m_refused + 1; end if;
      end loop;
      -- a DEAN may not assign
      perform selftest.as_user_uid(v_dean);
      v_code := selftest.f13_code(format('select public.assign_release(%L, %L, null, null)', v_rel, v_cls));
      perform selftest.as_owner();
      if v_code is distinct from 'ASSIGN_NOT_ALLOWED' then
        v_probs := selftest.f11_note(v_probs, 'F13-N01', 'a DEAN assigning answered ' || coalesce(v_code, 'ok -- it was assigned'));
      else m_refused := m_refused + 1; end if;
      -- another school's class: this school's content is not theirs to teach
      if v_other_cls is not null then
        perform selftest.as_user('siklus-guru@synthetic.pintar.test');
        v_code := selftest.f13_code(format('select public.assign_release(%L, %L, null, null)', v_rel, v_other_cls));
        perform selftest.as_owner();
        if v_code is distinct from 'ASSIGN_NOT_ALLOWED' then
          v_probs := selftest.f11_note(v_probs, 'F13-N01', 'another school''s class answered ' || coalesce(v_code, 'ok -- it was assigned'));
        else m_refused := m_refused + 1; end if;
      end if;

      -- a lesson with no pre-test
      select * into r from selftest.f13_release(v_inst, selftest.f13_paket('Tanpa pemetaan F13 ' || v_tag, 0, 2, false));
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v_code := selftest.f13_code(format('select public.assign_release(%L, %L, null, null)', r.release, v_cls));
      perform selftest.as_owner();
      if v_code is distinct from 'ASSIGN_PRE_TEST_MISSING' then
        v_probs := selftest.f11_note(v_probs, 'F13-N01', 'a lesson with no pre-test answered ' || coalesce(v_code, 'ok -- it was assigned'));
      else m_refused := m_refused + 1; end if;
      select count(*) into n from public.learning_assignments la where la.plp_release_id = r.release;
      if n <> 0 then v_probs := selftest.f11_note(v_probs, 'F13-N01', 'a refused assignment left a learning assignment behind'); end if;

      -- a lesson whose post-test shares every parallel group with the pre-test
      select * into r from selftest.f13_release(v_inst, selftest.f13_paket('Paralel F13 ' || v_tag, 2, 2, false), true, true);
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v_code := selftest.f13_code(format('select public.assign_release(%L, %L, null, null)', r.release, v_cls));
      perform selftest.as_owner();
      if v_code is distinct from 'ASSIGN_CYCLE_OVERLAP' then
        v_probs := selftest.f11_note(v_probs, 'F13-N01', 'a post-test sharing parallel groups with the pre-test answered ' || coalesce(v_code, 'ok -- it was assigned'));
      else m_refused := m_refused + 1; end if;
      select count(*) into n from public.learning_assignments la where la.plp_release_id = r.release;
      if n <> 0 then v_probs := selftest.f11_note(v_probs, 'F13-N01', 'a refused overlapping cycle left a learning assignment behind'); end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F13-N01', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F13-N02  A STRANGER'S QUESTION ABOUT SOMEONE'S CYCLE GETS A CODE.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      if v_la is null then raise exception 'F13-P01 made no assignment to ask about'; end if;
      perform selftest.as_user_uid(v_dean);
      v_code := selftest.f13_code(format('select * from public.my_cycle_state(%L)', v_la));
      perform selftest.as_owner();
      if v_code is distinct from 'CYCLE_NOT_ASSIGNED' then
        v_probs := selftest.f11_note(v_probs, 'F13-N02', 'a stranger asking for a learner''s cycle answered ' || coalesce(v_code, 'ok -- the cycle'));
      end if;
      perform selftest.as_user('siklus-email@synthetic.pintar.test');
      v_code := selftest.f13_code(format('select * from public.my_cycle_state(%L)', gen_random_uuid()));
      perform selftest.as_owner();
      if v_code is distinct from 'CYCLE_NOT_ASSIGNED' then
        v_probs := selftest.f11_note(v_probs, 'F13-N02', 'an unknown assignment answered ' || coalesce(v_code, 'ok'));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F13-N02', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    -- ═══════════════════════════════════════════════════════════════════════
    -- F13-N03  THE UPLOAD REFUSES A PARALLEL GROUP THAT SPANS BOTH TESTS
    --          (D-040), NAMING EVERY ROW OF IT, AND ACCEPTS SEPARATE GROUPS.
    -- ═══════════════════════════════════════════════════════════════════════
    begin
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v := public.prepare_ingest_batch(selftest.f11_batch(v_inst, 'STRUCTURED_PACKAGE',
             selftest.f13_paket('Campur F13 ' || v_tag, 2, 2, true)));
      perform selftest.as_owner();
      select string_agg(distinct x ->> 'code', ','), string_agg((x ->> 'sheet') || ' ' || (x ->> 'row'), ',' order by (x ->> 'row')::int)
        into v_code, v_state from jsonb_array_elements(v -> 'problems') x;
      if (v ->> 'ok')::boolean is not false or v_code is distinct from 'ITEM_PARALLEL_CYCLE_MIXED'
         or v_state is distinct from 'Soal 2,Soal 3,Soal 4,Soal 5' then
        v_probs := selftest.f11_note(v_probs, 'F13-N03', format('a package whose groups span both tests answered %s at %s',
          coalesce(v_code, 'ok'), coalesce(v_state, 'no row')));
      end if;
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v := public.prepare_ingest_batch(selftest.f11_batch(v_inst, 'STRUCTURED_PACKAGE',
             selftest.f13_paket('Terpisah F13 ' || v_tag, 2, 2, false)));
      perform selftest.as_owner();
      if (v ->> 'ok')::boolean is not true then
        v_probs := selftest.f11_note(v_probs, 'F13-N03', 'a package with separate groups was refused: ' || left((v -> 'problems')::text, 160));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f11_note(v_probs, 'F13-N03', 'the test could not run: ' || left(sqlerrm, 150));
    end;

    raise exception 'F13_UNDO';
  exception when others then
    begin perform selftest.as_owner(); exception when others then null; end;
    perform set_config('app.seed_intent', '', true);
    if sqlerrm <> 'F13_UNDO' then v_fatal := sqlerrm; end if;
  end;

  ------------------------------------------------------------------- verdicts
  for r in
    select * from unnest(
      array['F13-P01', 'F13-P02', 'F13-N01', 'F13-N02', 'F13-N03'],
      array['BOB-04 -- a course carries its pre-test and post-test, and assigning makes the whole cycle',
            'BOB-04 -- a learner completes pre, lesson, post and result, each test drawing its own questions',
            'BOB-04 -- a lesson that cannot make a whole cycle is refused with its code and makes nothing',
            'BOB-04 -- a stranger asking for a learner''s cycle gets a code',
            'BOB-04 -- the upload refuses a parallel group spanning both tests, naming its rows (D-040)'],
      array[
        format('a teacher''s package of 3 pre-test, 2 post-test and 1 practice question became a course carrying an '
          || 'approved PRE_TEST of 3 and POST_TEST of 2, reviewed with it; once published, the teacher''s assign_release '
          || 'made an ACTIVE learning assignment naming both and two OPEN test assignments for the class, audited '
          || 'once (%s of 3)', m_steps),
        'each test may draw exactly the questions marked for it (3 and 2, no practice question); the class''s learner '
          || 'saw both in their cycle, took the pre-test (3 pre-test questions presented), the lesson and the post-test '
          || '(2 post-test questions presented), and has an outcome with both sessions FINALIZED',
        format('%s refusal(s), each PR050 with its code: a frozen, unpublished release; a second assignment; a window '
          || 'that closes before it opens; the school instead of a class; an unknown release; a DEAN; another school''s '
          || 'class; a lesson with no pre-test (ASSIGN_PRE_TEST_MISSING); and a post-test sharing every parallel group '
          || 'with the pre-test (ASSIGN_CYCLE_OVERLAP, INV-24) -- the last two leaving no learning assignment', m_refused),
        'my_cycle_state answered PR050 CYCLE_NOT_ASSIGNED to a DEAN asking about a learner''s assignment and to a '
          || 'learner asking about an unknown one',
        'a package whose two pre-test questions share their parallel groups with its two post-test questions came back '
          || 'ok=false with ITEM_PARALLEL_CYCLE_MIXED and nothing else, at Soal rows 2, 3, 4 and 5 -- every question of '
          || 'those groups; the same package with separate groups prepared cleanly'
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

  id := 'F13-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-13 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable13() from public;
grant execute on function selftest.run_fable13() to authenticated;
