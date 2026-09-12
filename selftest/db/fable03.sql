-- FABLE-03 database-layer selftest. Sibling of fable01.sql and fable02.sql,
-- same row shape, same throwaway `selftest` schema.
--
-- It runs against the SEEDED CYCLE FIXTURE (supabase/seed/learning_cycle.sql)
-- rather than building its own course. That is deliberate: §"Depends on" says
-- this phase is built end to end against one seeded course, and a suite that
-- assembled its own content would be testing content it wrote to pass. The
-- fixture is published through the real gate — reviewer separate from author,
-- CAN_FREEZE_RELEASE, CAN_PUBLISH, a READY publish_readiness — so if that path
-- breaks, the seed fails before this file is even loaded.
--
-- Evidence is purged at entry so the suite is re-runnable on a long-lived
-- local stack; in CI the database is new every time and the purge finds
-- nothing. Where a test needs a state the schema will not let it leave behind
-- -- an ended enrolment, a closed window -- it uses a plpgsql subtransaction
-- and unwinds it, so nothing is disabled and nothing is left changed.
--
-- Ordering: depends on fable01.sql for the role-switch helpers. Never applied
-- as a migration; never present in production.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.as_user(text)') is null
     or to_regprocedure('selftest.as_owner()') is null then
    raise exception 'apply selftest/db/fable01.sql before fable03.sql: the role-switch helpers are missing';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Fixture handles. Resolved by name, never hard-coded: the synthetic seed
-- creates a fresh institution per run.
-- ---------------------------------------------------------------------------
create or replace function selftest.cycle_fixture()
returns table (inst uuid, course uuid, la uuid, aa_pre uuid, aa_post uuid,
               def_pre uuid, def_post uuid, release uuid)
language sql stable set search_path = public, pg_temp as $$
  select i.id, c.id, la.id,
         (select a.id from public.assessment_assignments a
            join public.assessment_definitions d on d.id = a.assessment_definition_id
           where a.learning_assignment_id = la.id and d.mode = 'PRE_TEST'),
         (select a.id from public.assessment_assignments a
            join public.assessment_definitions d on d.id = a.assessment_definition_id
           where a.learning_assignment_id = la.id and d.mode = 'POST_TEST'),
         (select d.id from public.assessment_definitions d
           where d.institution_id = i.id and d.mode = 'PRE_TEST' limit 1),
         (select d.id from public.assessment_definitions d
           where d.institution_id = i.id and d.mode = 'POST_TEST' limit 1),
         la.plp_release_id
    from public.institutions i
    join public.courses c on c.institution_id = i.id and c.title = 'Pecahan'
    join public.learning_assignments la on la.course_id = c.id
   where i.slug like 'synth-siklus-%'
   order by i.created_at desc
   limit 1
$$;

-- Bring the fixture to the state this suite needs, and leave nothing of its own
-- behind afterwards.
--
-- TWO JOBS, ONE ENTRY POINT, because they are the same job. It removes every
-- piece of learner evidence for the fixture course, so the suite can run twice
-- on one database. Evidence is immutable by design, so the
-- harness -- which owns these tables and is never present in production --
-- disables those triggers for the length of the delete and re-enables them
-- immediately, exactly as fable02.sql's purge does.
create or replace function selftest.purge_cycle_evidence() returns void
language plpgsql set search_path = public, pg_temp as $$
-- `v_row`, not `r`: the deletes below alias plp_releases as `r`, and a
-- plpgsql record of the same name shadows it into "record r has no field id".
-- `v_row`, not `r`: the deletes below alias plp_releases as `r`, and a
-- plpgsql record of the same name would shadow it.
declare v_course uuid;
begin
  select course into v_course from selftest.cycle_fixture();
  if v_course is null then return; end if;

  alter table public.presented_item_views disable trigger presented_item_views_write;
  alter table public.presented_items      disable trigger presented_items_immutable;
  alter table public.responses            disable trigger responses_write;
  alter table public.assessment_results   disable trigger assessment_results_write;
  alter table public.assessment_sessions  disable trigger assessment_sessions_provenance;
  alter table public.assessment_sessions  disable trigger assessment_sessions_status;
  alter table public.lesson_progress      disable trigger lesson_progress_write;
  alter table telemetry.hesitation_events disable trigger hesitation_events_write;
  alter table telemetry.assistance_events disable trigger assistance_events_write;

  delete from telemetry.assistance_events e using public.assessment_sessions s,
                                                public.plp_releases r
   where e.session_id = s.id and s.plp_release_id = r.id and r.course_id = v_course;
  delete from telemetry.hesitation_events e using public.assessment_sessions s,
                                                public.plp_releases r
   where e.session_id = s.id and s.plp_release_id = r.id and r.course_id = v_course;
  delete from public.assistance_grants g using public.assessment_sessions s,
                                             public.plp_releases r
   where g.session_id = s.id and s.plp_release_id = r.id and r.course_id = v_course;
  delete from public.assessment_results a using public.assessment_sessions s,
                                             public.plp_releases r
   where a.session_id = s.id and s.plp_release_id = r.id and r.course_id = v_course;
  delete from public.responses rs using public.assessment_sessions s, public.plp_releases r
   where rs.session_id = s.id and s.plp_release_id = r.id and r.course_id = v_course;
  delete from public.presented_item_views v using public.assessment_sessions s,
                                                public.plp_releases r
   where v.session_id = s.id and s.plp_release_id = r.id and r.course_id = v_course;
  delete from public.presented_items p using public.assessment_sessions s, public.plp_releases r
   where p.session_id = s.id and s.plp_release_id = r.id and r.course_id = v_course;
  delete from public.assessment_sessions s using public.plp_releases r
   where s.plp_release_id = r.id and r.course_id = v_course;
  delete from public.lesson_progress lp using public.lessons l, public.modules m
   where lp.lesson_id = l.id and l.module_id = m.id and m.course_id = v_course;

  alter table telemetry.assistance_events enable trigger assistance_events_write;
  alter table telemetry.hesitation_events enable trigger hesitation_events_write;
  alter table public.lesson_progress      enable trigger lesson_progress_write;
  alter table public.assessment_sessions  enable trigger assessment_sessions_status;
  alter table public.assessment_sessions  enable trigger assessment_sessions_provenance;
  alter table public.assessment_results   enable trigger assessment_results_write;
  alter table public.responses            enable trigger responses_write;
  alter table public.presented_items      enable trigger presented_items_immutable;
  alter table public.presented_item_views enable trigger presented_item_views_write;
end $$;

-- Answer every question on a paper. `p_correct` decides whether the answer
-- given is the right one -- something the harness may know and the learner
-- client may not.
--
-- SECURITY DEFINER precisely because of that asymmetry: a learner holds no
-- capability, so reading item_options through the learner's own role returns
-- nothing, and a harness that silently answered zero questions would report
-- a green cycle over an empty paper. The answers it then submits still go
-- through public.record_answer(), which derives the learner from the JWT, so
-- the evidence is attributed to the persona and not to the harness.
create or replace function selftest.answer_paper(p_session uuid, p_correct boolean,
                                                 p_wrong_safety boolean default false)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; v_pos integer; v_positions integer[]; n integer := 0; v_want boolean;
begin
  for r in select p.id as pid, p.item_id, i.item_type, i.is_safety_critical
             from public.presented_items p join public.items i on i.id = p.item_id
            where p.session_id = p_session order by p.position
  loop
    -- p_wrong_safety flips exactly the safety-critical answers, so a paper can
    -- be built that would pass on score alone and must still fail the gate.
    v_want := case when p_wrong_safety and r.is_safety_critical then false else p_correct end;
    if r.item_type = 'MCQ_MULTI' then
      select array_agg(d.display_position order by d.display_position) into v_positions
        from public.option_display_order(p_session, r.item_id) d
        join public.item_options o on o.item_id = r.item_id and o.label = d.label
       where o.is_correct = v_want;
      perform public.record_answer(r.pid, 1, jsonb_build_object('posisi', to_jsonb(v_positions)));
    else
      select d.display_position into v_pos
        from public.option_display_order(p_session, r.item_id) d
        join public.item_options o on o.item_id = r.item_id and o.label = d.label
       where o.is_correct = v_want
       order by d.display_position limit 1;
      perform public.record_answer(r.pid, 1, jsonb_build_object('posisi', v_pos));
    end if;
    n := n + 1;
  end loop;
  if n = 0 then
    raise exception 'answer_paper found no delivered items for session %: a paper that answers nothing would pass everything', p_session;
  end if;
  return n;
end $$;

revoke all on function selftest.purge_cycle_evidence() from public;
revoke all on function selftest.answer_paper(uuid, boolean, boolean) from public;
grant execute on function selftest.cycle_fixture() to authenticated;
grant execute on function selftest.answer_paper(uuid, boolean, boolean) to authenticated;


-- Backdate the server-stamped first view so the hesitation window can be
-- tested with a fast-forwarded clock rather than a real wait (§6's acceptance
-- item says exactly that). The row is append-only by design, so the harness --
-- which owns the table and is never present in production -- disables that one
-- trigger for a single statement. The control that actually matters is
-- untouched and asserted separately: no client role holds any write grant on
-- this table, so a learner cannot backdate anything.
create or replace function selftest.age_item_view(p_presented_item uuid, p_seconds integer)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  alter table public.presented_item_views disable trigger presented_item_views_write;
  update public.presented_item_views set first_viewed_at = now() - make_interval(secs => p_seconds)
   where presented_item_id = p_presented_item;
  alter table public.presented_item_views enable trigger presented_item_views_write;
end $$;
revoke all on function selftest.age_item_view(uuid, integer) from public;
grant execute on function selftest.age_item_view(uuid, integer) to authenticated;


-- One display position for a delivered item, chosen by whether it is the right
-- answer. SECURITY DEFINER for the same reason answer_paper() is: the mapping
-- from display position to authored label is deliberately unreachable by any
-- client role, which is the point of the shuffle.
create or replace function selftest.pick_position(p_session uuid, p_presented_item uuid,
                                                  p_correct boolean default true)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare v_item uuid; v_pos integer;
begin
  select item_id into v_item from public.presented_items where id = p_presented_item;
  select d.display_position into v_pos
    from public.option_display_order(p_session, v_item) d
    join public.item_options o on o.item_id = v_item and o.label = d.label
   where o.is_correct = p_correct
   order by d.display_position limit 1;
  return v_pos;
end $$;
revoke all on function selftest.pick_position(uuid, uuid, boolean) from public;
grant execute on function selftest.pick_position(uuid, uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- The suite.
-- ---------------------------------------------------------------------------
create or replace function selftest.run_fable03()
returns table (test_id text, invariant text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  f record; r record; n int; n2 int;
  s_pre uuid; s_post uuid; s2_pre uuid; s2_post uuid; s uuid;
  v_ok boolean; v_reason text; v_out jsonb; v_res uuid; v_res2 uuid;
  v_pi uuid; v_pi2 uuid; v_item uuid; v_pos int; v_enr uuid;
  pre_items uuid[]; post_items uuid[]; v_txt text; v_state record;
  v_lesson uuid; v_scoreA numeric; v_scoreB numeric;
  t0 timestamptz := clock_timestamp();
begin
  perform selftest.as_owner();
  select * into f from selftest.cycle_fixture();
  if f.course is null then
    test_id := 'F03-T01'; invariant := '-'; ok := false;
    detail := 'the learning-cycle fixture is absent: apply supabase/seed/learning_cycle.sql';
    return next; return;
  end if;
  perform selftest.purge_cycle_evidence();

  -- =========================================================================
  -- F03-T01 the whole cycle, end to end, for an email learner and a
  -- classroom-card learner. Both carry full provenance and SYNTHETIC evidence.
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('siklus-email@synthetic.pintar.test');
  s_pre := public.start_learning_session(f.aa_pre);
  n := selftest.answer_paper(s_pre, true);
  v_res := public.finish_my_session(s_pre);
  if (select count(*) from public.reading_map(s_pre)) = 0 then
    ok := false; detail := detail || 'the email learner got an empty reading map; ';
  end if;
  select lesson_id into v_lesson from public.learner_lessons(f.la) limit 1;
  perform public.record_lesson_progress(f.la, v_lesson, 2, 4);
  s_post := public.start_learning_session(f.aa_post);
  n2 := selftest.answer_paper(s_post, true);
  perform public.finish_my_session(s_post);
  v_out := public.session_outcome(s_post);
  if v_out is null then ok := false; detail := detail || 'the email learner got no outcome; '; end if;
  if (v_out ->> 'diagnostik')::boolean then
    ok := false; detail := detail || 'the post-test reported itself as diagnostic; ';
  end if;
  if public.session_outcome(s_pre) ? 'lulus' then
    ok := false; detail := detail || 'the pre-test payload carries a verdict field (§1); ';
  end if;

  perform selftest.as_user('card-7002@cards.synthetic.pintar.test');
  s2_pre := public.start_learning_session(f.aa_pre);
  perform selftest.answer_paper(s2_pre, true);
  perform public.finish_my_session(s2_pre);
  s2_post := public.start_learning_session(f.aa_post);
  perform selftest.answer_paper(s2_post, true);
  perform public.finish_my_session(s2_post);
  if public.session_outcome(s2_post) is null then
    ok := false; detail := detail || 'the classroom-card learner got no outcome; ';
  end if;
  if (public.learning_delta(f.la) ->> 'status') <> 'LENGKAP' then
    ok := false; detail := detail || 'the card learner has both sessions but no delta; ';
  end if;

  perform selftest.as_owner();
  select count(*) into n from public.assessment_sessions
   where id in (s_pre, s_post, s2_pre, s2_post) and evidence_class <> 'SYNTHETIC';
  if n > 0 then ok := false; detail := detail || format('%s session(s) not SYNTHETIC; ', n); end if;
  select count(*) into n from public.assessment_sessions
   where id in (s_pre, s_post, s2_pre, s2_post)
     and (enrollment_id is null or academic_period_id is null or plp_release_id is null
       or assessment_definition_id is null or learning_assignment_id is null
       or assessment_assignment_id is null or btrim(engine_version) = ''
       or btrim(scoring_policy_version) = '');
  if n > 0 then ok := false; detail := detail || format('%s session(s) with incomplete provenance; ', n); end if;
  select count(distinct person_id) into n from public.assessment_sessions
   where id in (s_pre, s_post, s2_pre, s2_post);
  if n <> 2 then
    ok := false; detail := detail || format('four sessions resolved to %s learner(s); ', n);
  end if;

  test_id := 'F03-T01'; invariant := 'FABLE-03 §1-§7 / INV-33';
  if ok then detail := format('pre → peta → pelajaran → post → hasil completed for an email learner and a classroom-card learner; four sessions, two people, full provenance, SYNTHETIC throughout'); end if;
  return next;

  -- =========================================================================
  -- F03-T02 INV-24: the post-test shares no item and no parallel sibling with
  -- this learner's pre-test, checked across the whole bank rather than the
  -- paper.
  -- =========================================================================
  ok := true; detail := '';
  select array_agg(item_id) into pre_items from public.presented_items where session_id = s_pre;
  select array_agg(item_id) into post_items from public.presented_items where session_id = s_post;
  select count(*) into n from unnest(post_items) x where x = any (pre_items);
  if n > 0 then ok := false; detail := detail || format('%s item(s) appear in both papers; ', n); end if;
  select count(*) into n from public.items a
   where a.id = any (post_items) and a.parallel_group is not null
     and a.parallel_group in (select b.parallel_group from public.items b
                               where b.id = any (pre_items) and b.parallel_group is not null);
  if n > 0 then ok := false; detail := detail || format('%s parallel sibling(s) crossed over; ', n); end if;
  -- and the exclusion function actually named them, so the draw was not merely lucky
  select count(*) into n from public.excluded_items_for_post_test(
    (select person_id from public.assessment_sessions where id = s_pre), f.la);
  if n < coalesce(array_length(pre_items, 1), 0) then
    ok := false; detail := detail || format('the exclusion names %s item(s) for a %s-item pre-test; ',
      n, array_length(pre_items, 1));
  end if;
  if (select count(*) from public.items i join public.lessons l on l.id = i.lesson_id
       join public.modules m on m.id = l.module_id
      where m.course_id = f.course and i.parallel_group is not null) = 0 then
    ok := false; detail := detail || 'the bank has no parallel group, so the sibling half proves nothing; ';
  end if;
  test_id := 'F03-T02'; invariant := 'INV-24';
  if ok then detail := format('post-test of %s items shares no item and no sibling with the %s-item pre-test; the exclusion names %s item(s)',
    array_length(post_items,1), array_length(pre_items,1), n); end if;
  return next;

  -- =========================================================================
  -- F03-T03 INV-01: the learner payload carries no answer key, and a learner
  -- cannot reach the bank directly either.
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('siklus-email@synthetic.pintar.test');
  for r in select * from public.session_paper(s_post) loop
    select string_agg(k, ', ') into v_txt
      from jsonb_object_keys(r.muatan) k
     where k not in ('item_type','stem','stimulus','opsi');
    if v_txt is not null then
      ok := false; detail := detail || format('payload carries unexpected key(s) %s; ', v_txt);
    end if;
    if r.muatan::text ~* '(is_correct|rationale|misconception|petunjuk|arah_berpikir)' then
      ok := false; detail := detail || 'payload text contains an authoring field name; ';
    end if;
    select string_agg(o ->> 'posisi', ',') into v_txt
      from jsonb_array_elements(r.muatan -> 'opsi') o
     where o ? 'label' or o ? 'is_correct';
    if v_txt is not null then
      ok := false; detail := detail || 'an option carries its authored label or correctness; ';
    end if;
  end loop;
  -- the bank itself is unreachable: a STUDENT holds no capability
  select count(*) into n from public.items;
  if n > 0 then ok := false; detail := detail || format('a learner can read %s item row(s); ', n); end if;
  select count(*) into n from public.item_options;
  if n > 0 then ok := false; detail := detail || format('a learner can read %s option row(s); ', n); end if;
  test_id := 'F03-T03'; invariant := 'INV-01';
  if ok then detail := 'every delivered payload carries only the allow-listed keys; a learner reads zero item and zero option rows'; end if;
  return next;


  -- =========================================================================
  -- F03-T04 INV-27's asymmetry, and INV-17 on top of it. A window that closes
  -- mid-session does not stop the learner; an enrolment that ends does.
  -- =========================================================================
  perform selftest.as_owner();
  perform selftest.purge_cycle_evidence();
  ok := true; detail := '';
  perform selftest.as_user('siklus-email@synthetic.pintar.test');
  s_pre := public.start_learning_session(f.aa_pre);
  select id into v_pi from public.presented_items where session_id = s_pre order by position limit 1;

  perform selftest.as_owner();
  begin
    update public.assessment_assignments set status = 'CLOSED' where id = f.aa_pre;
    perform selftest.as_user('siklus-email@synthetic.pintar.test');
    select c.ok, c.reason into v_ok, v_reason from public.may_continue_session(s_pre) c;
    if not v_ok then
      ok := false; detail := detail || format('a closed window stopped a started session (%s); ', v_reason);
    end if;
    v_pos := selftest.pick_position(s_pre, v_pi, true);
    begin
      perform public.record_answer(v_pi, 1, jsonb_build_object('posisi', v_pos));
    exception when others then
      ok := false; detail := detail || format('a closed window refused an answer: %s; ', sqlerrm);
    end;
    select e.ok into v_ok from public.may_start_assessment(f.aa_pre) e;
    if v_ok then ok := false; detail := detail || 'a closed window still starts new sessions; '; end if;
    perform selftest.as_owner();
    raise exception 'unwind' using errcode = 'PT900';
  exception when sqlstate 'PT900' then
    perform selftest.as_owner();
  end;

  -- INV-17: the enrolment ends mid-session; the next scored action is refused
  begin
    select enrollment_id into v_enr from public.assessment_sessions where id = s_pre;
    update public.enrollments set status = 'ENDED', end_reason = 'WITHDRAWN', valid_to = now()
     where id = v_enr;
    perform selftest.as_user('siklus-email@synthetic.pintar.test');
    select c.ok, c.reason into v_ok, v_reason from public.may_continue_session(s_pre) c;
    if v_ok then ok := false; detail := detail || 'an ended enrolment did not interrupt the session; '; end if;
    begin
      perform public.record_answer(v_pi, 9, '{"posisi":1}'::jsonb);
      ok := false; detail := detail || 'an ended enrolment still accepted an answer; ';
    exception when sqlstate 'PT900' then raise;
              when others then null;
    end;
    perform selftest.as_owner();
    raise exception 'unwind' using errcode = 'PT900';
  exception when sqlstate 'PT900' then
    perform selftest.as_owner();
  end;

  -- and both changes really were unwound
  if (select status from public.assessment_assignments where id = f.aa_pre) <> 'OPEN'
     or (select status from public.enrollments where id = v_enr) <> 'ACTIVE' then
    ok := false; detail := detail || 'the probe left the fixture changed; ';
  end if;
  test_id := 'F03-T04'; invariant := 'INV-27 / INV-17';
  if ok then detail := 'a closing assignment window accepts the next answer and starts nothing new; an ended enrolment refuses the next scored action'; end if;
  return next;

  -- =========================================================================
  -- F03-T05 INV-28 under replay, and the resume contract: after a client dies
  -- the server still holds the paper and every accepted answer.
  -- =========================================================================
  ok := true; detail := '';
  perform selftest.as_user('siklus-email@synthetic.pintar.test');
  v_pos := selftest.pick_position(s_pre, v_pi, true);
  perform public.record_answer(v_pi, 1, jsonb_build_object('posisi', v_pos));
  select outcome into v_reason from public.record_answer(v_pi, 1, jsonb_build_object('posisi', v_pos));
  if v_reason <> 'ACKNOWLEDGED' then
    ok := false; detail := detail || format('an identical replay reported %s; ', v_reason);
  end if;
  perform selftest.as_owner();
  select count(*) into n from public.responses where presented_item_id = v_pi and client_seq = 1;
  if n <> 1 then ok := false; detail := detail || format('the replay produced %s rows; ', n); end if;
  perform selftest.as_user('siklus-email@synthetic.pintar.test');
  begin
    perform public.record_answer(v_pi, 1,
      jsonb_build_object('posisi', selftest.pick_position(s_pre, v_pi, false)));
    ok := false; detail := detail || 'the same receipt accepted a different answer; ';
  exception when others then null;
  end;
  perform public.record_answer(v_pi, 2, jsonb_build_object('posisi', v_pos));
  perform selftest.as_owner();
  select count(*) into n from public.responses where presented_item_id = v_pi;
  if n <> 2 then ok := false; detail := detail || format('a new client_seq did not append (%s rows); ', n); end if;

  -- the resume: everything a returning client needs comes from the server
  perform selftest.as_user('siklus-email@synthetic.pintar.test');
  select count(*) into n from public.session_paper(s_pre);
  select count(*) into n2 from public.session_answers(s_pre);
  if n = 0 then ok := false; detail := detail || 'the paper did not survive the client; '; end if;
  if n2 = 0 then ok := false; detail := detail || 'the accepted answers did not survive the client; '; end if;
  test_id := 'F03-T05'; invariant := 'INV-28';
  if ok then detail := format('an identical replay is acknowledged into one row, a different answer on the same receipt is refused, a new sequence appends; a returning client reads %s items and %s answers back from the server', n, n2); end if;
  return next;

  -- =========================================================================
  -- F03-T06 §3: reading progress never regresses, whichever order it arrives.
  -- =========================================================================
  ok := true; detail := '';
  select lesson_id into v_lesson from public.learner_lessons(f.la) limit 1;
  perform public.record_lesson_progress(f.la, v_lesson, 3, 6);
  if public.record_lesson_progress(f.la, v_lesson, 1, 6) <> 3 then
    ok := false; detail := detail || 'a smaller position moved the learner back; ';
  end if;
  if public.record_lesson_progress(f.la, v_lesson, 5, 6) <> 5 then
    ok := false; detail := detail || 'a larger position did not advance; ';
  end if;
  select furthest_position into n from public.lesson_progress
   where lesson_id = v_lesson and person_id = public.current_person_id();
  if n <> 5 then ok := false; detail := detail || format('the stored position is %s; ', n); end if;
  select furthest_position into n2 from public.learner_lessons(f.la) where lesson_id = v_lesson;
  if n2 <> 5 then ok := false; detail := detail || format('the lesson read reports %s; ', n2); end if;
  test_id := 'F03-T06'; invariant := 'FABLE-03 §3 / doc 06';
  if ok then detail := '3 then 1 then 5 leaves the learner at 5; a resume never shows less than what was recorded'; end if;
  return next;

  -- =========================================================================
  -- F03-T07 INV-10: a safety-critical item answered wrong fails the attempt
  -- even when the overall score would otherwise pass.
  -- =========================================================================
  perform selftest.as_owner();
  perform selftest.purge_cycle_evidence();
  ok := true; detail := '';
  perform selftest.as_user('siklus-email@synthetic.pintar.test');
  s_post := public.start_learning_session(f.aa_post);
  perform selftest.answer_paper(s_post, true, true);   -- everything right except the safety-critical
  perform public.finish_my_session(s_post);
  v_out := public.session_outcome(s_post);
  perform selftest.as_owner();
  select count(*) into n from public.presented_items p join public.items i on i.id = p.item_id
   where p.session_id = s_post and i.is_safety_critical;
  if n = 0 then
    ok := false; detail := detail || 'the drawn paper carried no safety-critical item, so the gate proves nothing; ';
  end if;
  if (v_out ->> 'ambang') is null then
    ok := false; detail := detail || 'the definition names no pass mark, so "would otherwise pass" is untestable; ';
  elsif (v_out ->> 'penguasaan')::numeric < (v_out ->> 'ambang')::numeric then
    ok := false; detail := detail || format('the score %s is below the mark %s, so the gate is not what refused; ',
      v_out ->> 'penguasaan', v_out ->> 'ambang');
  end if;
  if (v_out ->> 'gerbang_keselamatan')::boolean then
    ok := false; detail := detail || 'the safety gate passed with a safety-critical item answered wrong; ';
  end if;
  if (v_out ->> 'lulus')::boolean then
    ok := false; detail := detail || 'the attempt passed despite the gate; ';
  end if;
  test_id := 'F03-T07'; invariant := 'INV-10';
  if ok then detail := format('score %s clears the %s mark and the attempt still fails: %s safety-critical item(s) answered wrong',
    v_out ->> 'penguasaan', v_out ->> 'ambang', n); end if;
  return next;

  -- =========================================================================
  -- F03-T08 INV-11: asking for help costs nothing, and help never arrives
  -- before the configured window.
  -- =========================================================================
  perform selftest.as_owner();
  perform selftest.purge_cycle_evidence();
  ok := true; detail := '';
  perform selftest.as_user('siklus-email@synthetic.pintar.test');
  s_post := public.start_learning_session(f.aa_post);
  perform selftest.answer_paper(s_post, true);
  perform public.finish_my_session(s_post);
  v_scoreA := (public.session_outcome(s_post) ->> 'penguasaan')::numeric;

  s2_post := public.start_learning_session(f.aa_post);
  select id into v_pi from public.presented_items where session_id = s2_post order by position limit 1;
  select * into v_state from public.assistance_state(v_pi);
  if v_state.due then
    ok := false; detail := detail || 'assistance was due before any time had passed; ';
  end if;
  perform selftest.age_item_view(v_pi, v_state.window_seconds - 1);
  select * into v_state from public.assistance_state(v_pi);
  if v_state.due then
    ok := false; detail := detail || format('assistance was due one second before the %ss window; ', v_state.window_seconds);
  end if;
  perform selftest.age_item_view(v_pi, v_state.window_seconds + 5);
  select * into v_state from public.assistance_state(v_pi);
  if not v_state.due then
    ok := false; detail := detail || 'assistance was not offered after the window passed; ';
  end if;
  perform public.open_assistance(v_pi, 1::smallint);
  perform public.open_assistance(v_pi, 2::smallint);
  perform public.open_assistance(v_pi, 3::smallint);
  perform selftest.answer_paper(s2_post, true);
  perform public.finish_my_session(s2_post);
  v_scoreB := (public.session_outcome(s2_post) ->> 'penguasaan')::numeric;
  if v_scoreA is distinct from v_scoreB then
    ok := false; detail := detail || format('identical answers scored %s without help and %s with it; ', v_scoreA, v_scoreB);
  end if;
  perform selftest.as_owner();
  select a.ok, a.detail into v_ok, v_txt from public.assert_telemetry_write_only() a;
  if not v_ok then ok := false; detail := detail || v_txt || '; '; end if;
  select count(*) into n from telemetry.assistance_events where session_id = s2_post;
  if n = 0 then ok := false; detail := detail || 'the assistance that was opened was not recorded at all; '; end if;
  test_id := 'F03-T08'; invariant := 'INV-11';
  if ok then detail := format('the window holds to the second; three levels opened and %s telemetry event(s) written; both attempts score %s',
    n, v_scoreA); end if;
  return next;

  -- =========================================================================
  -- F03-T09 doctrine: nothing a learner is shown carries a forbidden word.
  --
  -- Two halves, because either alone would be weak. The SERVED half scans
  -- every assistance level actually returned by open_assistance() on a live
  -- session, which proves the serving path itself is clean. The AUTHORED half
  -- sweeps every assistance string and every review string in the bank, for
  -- every item of every type — which the draw cannot guarantee to cover, since
  -- a paper is a seeded sample and "we happened to draw an MCQ_MULTI" is not a
  -- test. The n2 = 0 guard makes a silent zero-scan a failure rather than a
  -- pass, and the last check proves the scanner can still fail.
  -- =========================================================================
  perform selftest.as_owner();
  perform selftest.purge_cycle_evidence();
  ok := true; detail := ''; n2 := 0;
  perform selftest.as_user('siklus-email@synthetic.pintar.test');
  s := public.start_learning_session(f.aa_post);
  for r in select p.id as pid from public.presented_items p where p.session_id = s loop
    perform public.note_item_view(r.pid);          -- the view must exist before it can be aged
    perform selftest.age_item_view(r.pid, 120);
    for n in 1..3 loop
      begin
        select isi into v_txt from public.open_assistance(r.pid, n::smallint);
        n2 := n2 + 1;
        if exists (select 1 from public.validate_learner_text(v_txt)) then
          ok := false; detail := detail || format('served assistance level %s carries a forbidden word; ', n);
        end if;
        if public.hint_reveals_answer_shape(v_txt) then
          ok := false; detail := detail || format('served assistance level %s narrows to the answer; ', n);
        end if;
      exception when others then null;   -- a level this item does not carry
      end;
    end loop;
  end loop;
  perform selftest.answer_paper(s, true);
  perform public.finish_my_session(s);
  for r in select stem, jawaban_teks, alasan, arah from public.session_review(s) loop
    for v_txt in select unnest(array[r.stem, r.jawaban_teks, r.alasan, r.arah]) loop
      if v_txt is not null and exists (select 1 from public.validate_learner_text(v_txt)) then
        ok := false; detail := detail || 'a review line carries a forbidden word; ';
      end if;
    end loop;
  end loop;

  -- the authored sweep: every item of every built type, every string a learner
  -- could be shown about it
  perform selftest.as_owner();
  n := 0;
  for r in select i.item_type, i.stem, i.petunjuk, i.arah_berpikir, i.id
             from public.items i join public.lessons l on l.id = i.lesson_id
             join public.modules m on m.id = l.module_id
            where m.course_id = f.course loop
    n := n + 1;
    for v_txt in select unnest(array[r.stem, r.petunjuk, r.arah_berpikir]) loop
      if v_txt is not null then
        if exists (select 1 from public.validate_learner_text(v_txt)) then
          ok := false; detail := detail || format('an authored string on a %s item carries a forbidden word; ', r.item_type);
        end if;
      end if;
    end loop;
    if r.petunjuk is not null and public.hint_reveals_answer_shape(r.petunjuk) then
      ok := false; detail := detail || 'an authored hint narrows to the answer; ';
    end if;
    if r.arah_berpikir is not null and public.hint_reveals_answer_shape(r.arah_berpikir) then
      ok := false; detail := detail || 'an authored direction narrows to the answer; ';
    end if;
    for v_txt in select o.body from public.item_options o where o.item_id = r.id
                 union all select o.rationale from public.item_options o where o.item_id = r.id loop
      if v_txt is not null and exists (select 1 from public.validate_learner_text(v_txt)) then
        ok := false; detail := detail || format('an option or rationale on a %s item carries a forbidden word; ', r.item_type);
      end if;
    end loop;
  end loop;
  if n2 = 0 then
    ok := false; detail := detail || 'no assistance string was served, so the serving path was not scanned; ';
  end if;
  select count(distinct i.item_type) into n from public.items i
    join public.lessons l on l.id = i.lesson_id join public.modules m on m.id = l.module_id
   where m.course_id = f.course
     and i.item_type in (select item_type from public.item_type_learner_support);
  if n < (select count(*) from public.item_type_learner_support) then
    ok := false; detail := detail || format('the bank carries %s of the %s types this phase delivers; ',
      n, (select count(*) from public.item_type_learner_support));
  end if;
  if not exists (select 1 from public.validate_learner_text('Jawabanmu salah dan kamu gagal')) then
    ok := false; detail := detail || 'the doctrine scanner missed a planted forbidden word; ';
  end if;
  test_id := 'F03-T09'; invariant := 'FABLE-00 Learning Safety Doctrine / INV-02';
  if ok then detail := format('%s served assistance string(s) and every review line are clean; every authored string on every item of all %s delivered type(s) passes the doctrine scanner and the INV-02 check; a planted forbidden word is still caught',
    n2, n); end if;
  return next;

  -- =========================================================================
  -- F03-T10 INV-08 and INV-09: identity is the server's, the score is the
  -- server's, and finalize is idempotent.
  -- =========================================================================
  ok := true; detail := '';
  -- another learner cannot touch this one's delivery record
  perform selftest.as_user('card-7002@cards.synthetic.pintar.test');
  select id into v_pi2 from public.presented_items where session_id = s order by position limit 1;
  begin
    perform public.record_answer(v_pi2, 99, '{"posisi":1}'::jsonb);
    ok := false; detail := detail || 'a second learner answered on the first learner''s paper; ';
  exception when others then null;
  end;
  begin
    perform public.session_paper(s);
    ok := false; detail := detail || 'a second learner read the first learner''s paper; ';
  exception when others then null;
  end;

  -- the stored result equals an independent recomputation from raw evidence
  perform selftest.as_owner();
  select mastery into v_scoreA from public.assessment_results
   where session_id = s and supersedes_result_id is null;
  select e.mastery into v_scoreB from public.evaluate_session(s) e;
  if v_scoreA is distinct from v_scoreB then
    ok := false; detail := detail || format('the stored score %s and a fresh recomputation %s disagree; ', v_scoreA, v_scoreB);
  end if;

  -- finalize twice observes the same row rather than computing a second one
  perform selftest.as_user('siklus-email@synthetic.pintar.test');
  v_res := public.finish_my_session(s);
  v_res2 := public.finish_my_session(s);
  if v_res is distinct from v_res2 then
    ok := false; detail := detail || 'a duplicate finalize produced a second result; ';
  end if;
  perform selftest.as_owner();
  select count(*) into n from public.assessment_results
   where session_id = s and supersedes_result_id is null;
  if n <> 1 then ok := false; detail := detail || format('%s root results for one session; ', n); end if;

  -- and there is no argument anywhere in which a score or a person could enter
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public'
     and p.proname in ('finalize_session','finish_my_session','start_learning_session','record_answer')
     and (pg_get_function_identity_arguments(p.oid) ilike '%person%'
       or pg_get_function_identity_arguments(p.oid) ilike '%mastery%'
       or pg_get_function_identity_arguments(p.oid) ilike '%score%');
  if n > 0 then
    ok := false; detail := detail || format('%s entry point(s) accept an identity or a score; ', n);
  end if;
  test_id := 'F03-T10'; invariant := 'INV-08 / INV-09';
  if ok then detail := format('a second learner is refused on both the write and the read path; the stored score %s equals a fresh recomputation; a duplicate finalize observes one root result',
    v_scoreA); end if;
  return next;

  perform selftest.as_owner();
  test_id := 'F03-DONE'; invariant := '-'; ok := true;
  detail := format('elapsed %s ms', round(extract(epoch from clock_timestamp() - t0) * 1000));
  return next;
end $$;

revoke all on function selftest.run_fable03() from public;
