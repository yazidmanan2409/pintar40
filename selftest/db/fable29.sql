-- FABLE-29 · W6.10 (D-186): THE CYCLE'S ORDER IS HELD BY THE DATABASE, NOT ONLY BY THE SCREENS.
--
-- The learning cycle is Pemetaan Awal → lessons → Uji Penguasaan → result (ADM-15). The screens hold the order:
-- /belajar/[tugas]/penguasaan sends a learner whose Pemetaan Awal is not finished back to the chapter. The database did
-- not: may_start_assessment() accepted the Uji Penguasaan of a chapter whose Pemetaan Awal the learner had not started,
-- or had started and not finished, so a direct call of start_learning_session() opened it, and the chapter page then
-- ranks the running Uji Penguasaan first while its own screen sends the learner back: a loop.
--
--   F29-S01  In a chapter given whole (a Pemetaan Awal and an Uji Penguasaan), the learner's Uji Penguasaan is refused
--            PRE_TEST_NOT_FINALIZED before the Pemetaan Awal is started and while it is running, assessment_orientation
--            offers nothing for it, and no session is left behind; once the Pemetaan Awal is finished it starts.
--
-- EVERY ROW IS ROLLED BACK.

create schema if not exists selftest;
grant usage on schema selftest to authenticated, anon;

do $$
begin
  if to_regprocedure('selftest.f27_lesson(uuid,text,text,uuid)') is null
     or to_regprocedure('selftest.answer_paper(uuid,boolean,boolean)') is null then
    raise exception 'apply fable03 and fable27.sql (and what they need) before fable29.sql: the helpers are missing';
  end if;
end $$;

create or replace function selftest.f29_note(p jsonb, p_id text, p_problem text)
returns jsonb language sql immutable as $$
  select jsonb_set(coalesce(p, '{}'::jsonb), array[p_id], coalesce(p -> p_id, '[]'::jsonb) || to_jsonb(p_problem))
$$;
grant execute on function selftest.f29_note(jsonb, text, text) to authenticated, anon;

create or replace function selftest.run_fable29()
returns table (id text, area text, ok boolean, detail text)
language plpgsql set search_path = public, pg_temp as $$
declare
  r record; v_probs jsonb := '{}'::jsonb; v_fatal text := ''; v_tag text := to_char(clock_timestamp(), 'HH24MISSUS');
  v_inst uuid; v_cls uuid; v_v jsonb; v_la uuid; v_pre uuid; v_post uuid; v_s uuid; v_code text; v_n int;
  v_a record; v_why text;
begin
  perform selftest.as_owner();
  begin
    select i.id into v_inst from public.institutions i where i.slug like 'synth-siklus-%' order by i.created_at desc limit 1;
    if v_inst is null then raise exception 'the seeded learning-cycle school is not there'; end if;
    select n.id into v_cls from public.org_nodes n where n.institution_id = v_inst and n.kind = 'CLASS' order by n.created_at limit 1;

    -- F29-S01
    begin
      select * into v_a from selftest.f27_lesson(v_inst, 'Urutan Siklus F29 ' || v_tag);
      perform selftest.as_user('siklus-guru@synthetic.pintar.test');
      v_v := public.assign_release(v_a.release, v_cls, null, now() + interval '30 days');
      perform selftest.as_owner();
      v_la := (v_v ->> 'learning_assignment')::uuid; v_pre := (v_v ->> 'pre_assignment')::uuid; v_post := (v_v ->> 'post_assignment')::uuid;
      if v_la is null or v_pre is null or v_post is null then
        raise exception 'the chapter was not given whole: %', left(v_v::text, 160);
      end if;

      -- before the Pemetaan Awal is started
      perform selftest.as_user('siklus-email@synthetic.pintar.test');
      select e.reason into v_why from public.may_start_assessment(v_post) e;
      v_code := selftest.f13_code(format('select public.start_learning_session(%L)', v_post));
      select count(*) into v_n from public.assessment_orientation(v_post);
      perform selftest.as_owner();
      if v_why is distinct from 'PRE_TEST_NOT_FINALIZED' then
        v_probs := selftest.f29_note(v_probs, 'F29-S01', 'before the Pemetaan Awal, may_start_assessment answered ' || coalesce(v_why, 'nothing') || ' for the Uji Penguasaan');
      end if;
      if v_code is null then
        v_probs := selftest.f29_note(v_probs, 'F29-S01', 'the Uji Penguasaan started before the Pemetaan Awal was begun');
      end if;
      if v_n <> 0 then
        v_probs := selftest.f29_note(v_probs, 'F29-S01', 'assessment_orientation offered the Uji Penguasaan before the Pemetaan Awal');
      end if;

      -- while the Pemetaan Awal runs
      perform selftest.as_user('siklus-email@synthetic.pintar.test');
      v_s := public.start_learning_session(v_pre);
      select e.reason into v_why from public.may_start_assessment(v_post) e;
      v_code := selftest.f13_code(format('select public.start_learning_session(%L)', v_post));
      perform selftest.as_owner();
      if v_why is distinct from 'PRE_TEST_NOT_FINALIZED' then
        v_probs := selftest.f29_note(v_probs, 'F29-S01', 'while the Pemetaan Awal ran, may_start_assessment answered ' || coalesce(v_why, 'nothing'));
      end if;
      if v_code is null then
        v_probs := selftest.f29_note(v_probs, 'F29-S01', 'the Uji Penguasaan started while the Pemetaan Awal was still running');
      end if;
      select count(*) into v_n from public.assessment_sessions s where s.assessment_assignment_id = v_post;
      if v_n <> 0 then
        v_probs := selftest.f29_note(v_probs, 'F29-S01', format('%s Uji Penguasaan session(s) left behind by the refused starts', v_n));
      end if;

      -- once the Pemetaan Awal is finished
      perform selftest.as_user('siklus-email@synthetic.pintar.test');
      perform selftest.answer_paper(v_s, true);
      perform public.finish_my_session(v_s);
      select e.reason into v_why from public.may_start_assessment(v_post) e;
      v_code := selftest.f13_code(format('select public.start_learning_session(%L)', v_post));
      perform selftest.as_owner();
      if v_why is distinct from 'OK' or v_code is not null then
        v_probs := selftest.f29_note(v_probs, 'F29-S01', format('after the Pemetaan Awal was finished the Uji Penguasaan answered %s / %s', coalesce(v_why, 'nothing'), coalesce(v_code, 'started')));
      end if;
      select count(*) into v_n from public.assessment_sessions s where s.assessment_assignment_id = v_post;
      if v_n <> 1 then
        v_probs := selftest.f29_note(v_probs, 'F29-S01', format('after the Pemetaan Awal, %s Uji Penguasaan session(s), expected 1', v_n));
      end if;
    exception when others then
      perform selftest.as_owner();
      v_probs := selftest.f29_note(v_probs, 'F29-S01', 'the test could not run: ' || left(sqlerrm, 200));
    end;

    raise exception 'F29_ROLLBACK';
  exception when others then
    perform selftest.as_owner();
    if sqlerrm <> 'F29_ROLLBACK' then v_fatal := sqlerrm; end if;
  end;

  for r in select * from unnest(
      array['F29-S01'],
      array['W6.10 (D-186; ADM-15) -- the cycle''s order is held by the database'],
      array['the Uji Penguasaan is refused PRE_TEST_NOT_FINALIZED before the Pemetaan Awal is begun and while it runs, '
        || 'its orientation offers nothing and no session is left behind; once the Pemetaan Awal is finished it starts']) as t(tid, tarea, tdetail)
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

  id := 'F29-DONE'; area := 'suite'; ok := v_fatal = '';
  detail := case when v_fatal = '' then 'FABLE-29 suite complete; every row rolled back'
                 else 'the suite did not complete: ' || left(v_fatal, 200) end;
  return next;
end $$;
revoke all on function selftest.run_fable29() from public;
grant execute on function selftest.run_fable29() to authenticated;
