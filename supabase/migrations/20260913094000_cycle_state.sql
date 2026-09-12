-- 0034 — FABLE-03 §"The cycle" and §4: the two reads the learner screens need
-- that are not a paper, a result or a lesson.
--
-- Both could be assembled in the application from tables a learner may already
-- SELECT under RLS. They are RPCs instead for one reason: the engine module is
-- the only surface the routes call, and giving it a second style of access —
-- table reads alongside RPCs — would make "what may a learner see" a question
-- answered in two places. Here it stays answered in one.
--
-- Neither returns anything about an item. session_state() deliberately reports
-- how many questions are on the paper and how many carry an answer, and
-- nothing about which.

create function public.my_cycle_state(p_learning_assignment uuid)
returns table (pre_assignment uuid, pre_session uuid, pre_status public.session_status,
               post_assignment uuid, post_session uuid, post_status public.session_status)
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_person uuid;
begin
  v_person := public.current_person_id();
  if v_person is null then raise exception 'no person in this session'; end if;
  if not exists (select 1 from public.my_learning_assignments() m
                  where m.learning_assignment_id = p_learning_assignment) then
    raise exception 'this learning assignment is not assigned to you';
  end if;
  return query
  with aa as (
    select a.id, d.mode
      from public.assessment_assignments a
      join public.assessment_definitions d on d.id = a.assessment_definition_id
     where a.learning_assignment_id = p_learning_assignment
  ),
  latest as (
    select distinct on (s.mode) s.mode, s.id, s.status
      from public.assessment_sessions s
     where s.person_id = v_person and s.learning_assignment_id = p_learning_assignment
     order by s.mode, s.created_at desc
  )
  select (select id from aa where mode = 'PRE_TEST'),
         (select id from latest where mode = 'PRE_TEST'),
         (select status from latest where mode = 'PRE_TEST'),
         (select id from aa where mode = 'POST_TEST'),
         (select id from latest where mode = 'POST_TEST'),
         (select status from latest where mode = 'POST_TEST');
end $$;
revoke all on function public.my_cycle_state(uuid) from public, anon;
grant execute on function public.my_cycle_state(uuid) to authenticated, service_role;

create function public.session_state(p_session uuid)
returns table (status public.session_status, mode public.assessment_mode,
               allows_pause boolean, authoritative_deadline timestamptz,
               started_at timestamptz, submitted_at timestamptz,
               item_count integer, answered_count integer,
               hesitation_window_seconds integer, stage text)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  return query
    select s.status, s.mode, d.allows_pause, s.authoritative_deadline,
           s.started_at, s.submitted_at,
           (select count(*)::integer from public.presented_items p where p.session_id = s.id),
           (select count(distinct r.presented_item_id)::integer from public.responses r
             where r.session_id = s.id),
           d.hesitation_window_seconds,
           (select c.stage from public.presented_items p
              join public.items i on i.id = p.item_id
              join public.lessons l on l.id = i.lesson_id
              join public.modules m on m.id = l.module_id
              join public.courses c on c.id = m.course_id
             where p.session_id = s.id limit 1)
      from public.assessment_sessions s
      join public.assessment_definitions d on d.id = s.assessment_definition_id
     where s.id = p_session;
end $$;
revoke all on function public.session_state(uuid) from public, anon;
grant execute on function public.session_state(uuid) to authenticated, service_role;

-- Lesson media is served as a short-lived signed URL by the server route
-- (FABLE-01 §7); the route needs one authority question answered, and this is
-- it. A learner may read a media object only when some lesson they are
-- actually assigned names that exact storage path in its own media column.
-- Path membership rather than a prefix match: "everything under pelajaran/"
-- would let any assigned learner read any course's media.
create function public.may_read_lesson_media(p_path text) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1
      from public.my_learning_assignments() a
      join public.modules m on m.course_id = a.course_id
      join public.lessons l on l.module_id = m.id,
           lateral jsonb_array_elements(l.media) e
     where e ->> 'path' = p_path)
$$;
revoke all on function public.may_read_lesson_media(text) from public, anon;
grant execute on function public.may_read_lesson_media(text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- submit_session(): finalize must be idempotent all the way up.
--
-- 0030 made SUBMITTED and EXPIRED idempotent but not FINALIZED, so a learner
-- who double-tapped Kumpulkan -- or whose client retried after a dropped
-- response -- hit the transition allow-list and saw an error for work that had
-- already succeeded. doc 07 requires the opposite: "a duplicate finalize call
-- must observe the already-computed result". finalize_session() already did;
-- the submit step in front of it did not, so the idempotency stopped one
-- function short of the button. Replaced whole, with the FINALIZED case added.
create or replace function public.submit_session(p_session uuid) returns public.session_status
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_status public.session_status;
begin
  if not public.session_is_mine(p_session) then
    raise exception 'this session belongs to someone else';
  end if;
  v_status := public.session_enforce_deadline(p_session);
  if v_status = 'FINALIZED' then return v_status; end if;  -- already scored; nothing to submit
  if v_status = 'EXPIRED'   then return v_status; end if;  -- finalize scores what was answered
  if v_status = 'SUBMITTED' then return v_status; end if;
  if v_status = 'TERMINATED' then
    raise exception 'this session was ended and accepts no submission';
  end if;
  if v_status = 'PAUSED' then
    update public.assessment_sessions set status = 'IN_PROGRESS' where id = p_session;
  end if;
  update public.assessment_sessions set status = 'SUBMITTED' where id = p_session;
  return 'SUBMITTED';
end $$;
revoke all on function public.submit_session(uuid) from public, anon;
grant execute on function public.submit_session(uuid) to authenticated, service_role;

do $$
declare def text; v text; n int; bad text;
begin
  foreach v in array array['my_cycle_state','session_state'] loop
    select pg_get_functiondef(p.oid) into def from pg_proc p
      join pg_namespace ns on ns.oid=p.pronamespace
     where ns.nspname='public' and p.proname = v;
    if def is null then raise exception 'this migration did not create public.%()', v; end if;
    -- neither may expose item content or an answer key
    if def ~* '\y(i\.stem|i\.stimulus|is_correct|rationale|misconception_code|shuffle_seed)\y' then
      raise exception '%() exposes item content or a server-only column (INV-01)', v;
    end if;
    if pg_get_function_identity_arguments(
         (quote_ident('public') || '.' || quote_ident(v) || '(uuid)')::regprocedure) ilike '%person%' then
      raise exception '%() accepts a person argument (INV-08)', v;
    end if;
  end loop;

  -- a duplicate submit is a no-op, not an error (doc 07)
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='submit_session';
  if def not like '%FINALIZED%' then
    raise exception 'submit_session does not treat an already-scored session as idempotent';
  end if;

  -- media authority is per object, never per prefix
  select pg_get_functiondef(p.oid) into def from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.proname='may_read_lesson_media';
  if def is null then raise exception 'this migration did not create may_read_lesson_media()'; end if;
  if def ~* 'like\s*''[^'']*%' or def ~* '\ystarts_with\y' then
    raise exception 'may_read_lesson_media authorises by prefix; one assigned course would open every other';
  end if;
  if def not like '%my_learning_assignments%' then
    raise exception 'may_read_lesson_media does not require an actual assignment';
  end if;

  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and p.prosecdef
     and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) x where x like 'search_path=%');
  if n > 0 then raise exception '% SECURITY DEFINER function(s) without pinned search_path: %', n, bad; end if;
  select count(*), string_agg(p.proname, ', ') into n, bad from pg_proc p
    join pg_namespace ns on ns.oid=p.pronamespace
   where ns.nspname='public' and has_function_privilege('anon', p.oid, 'EXECUTE');
  if n > 0 then raise exception 'anon can execute % function(s) in public: %', n, bad; end if;
end $$;
