-- UX-40 (W2.13, learner part; Batch 5): A NEW RESULT IS THE NEXT STEP.
--
-- On Belajar's home a finished chapter left the «Langkah berikutnya» panel the moment its Uji Penguasaan was scored,
-- and its «Lihat hasil» became one plain button among the cards: a result the learner had not yet opened was never
-- the next thing to do. Whether a result is NEW is a fact about a person and a session that PINTAR did not hold, so
-- it is recorded here, and nothing else is.
--
-- result_views: one row per finalized Uji Penguasaan session once its own learner has opened its result. It is NOT
-- evidence and NOT part of the result: it carries no score, no answer and no time on task, nothing reads it but the
-- learner's own home, and the sealed result is untouched (the session row is only read). No client may read or write
-- the table; it is reached through the two functions below, each scoped to current_person_id().
--
-- note_result_seen(session)  the learner's own finalized Uji Penguasaan: its result is now seen. Idempotent; anybody
--                            else's session, an unfinished one or a Pemetaan Awal is refused silently (false), so the
--                            answer tells nothing about a session that is not the caller's.
-- my_new_results()           the caller's own learning assignments whose latest Uji Penguasaan is finalized and whose
--                            result the caller has not opened yet.
--
-- EXISTING RESULTS ARE NOT NEW. Every finalized Uji Penguasaan that exists when this runs is recorded as seen, so a
-- learner's earlier chapters do not all come back as "new" the day this ships.
--
-- METRIC CATALOGUE, ENGINE, EVIDENCE AND RLS OF EVERY EXISTING TABLE: unchanged.

create table if not exists public.result_views (
  session_id    uuid        primary key references public.assessment_sessions(id) on delete cascade,
  person_id     uuid        not null,
  first_seen_at timestamptz not null default now()
);
alter table public.result_views enable row level security;
revoke all on table public.result_views from public, anon, authenticated;

-- the backfill: what is already finished is already seen
insert into public.result_views (session_id, person_id, first_seen_at)
select s.id, s.person_id, coalesce(s.finalized_at, now())
  from public.assessment_sessions s
 where s.mode = 'POST_TEST' and s.status = 'FINALIZED'
on conflict (session_id) do nothing;

create or replace function public.note_result_seen(p_session uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_person uuid := public.current_person_id();
begin
  if v_person is null or p_session is null then
    return false;
  end if;
  if not exists (select 1 from public.assessment_sessions s
                  where s.id = p_session and s.person_id = v_person
                    and s.mode = 'POST_TEST' and s.status = 'FINALIZED') then
    return false;
  end if;
  insert into public.result_views (session_id, person_id) values (p_session, v_person)
  on conflict (session_id) do nothing;
  return true;
end $$;
revoke all on function public.note_result_seen(uuid) from public, anon;
grant execute on function public.note_result_seen(uuid) to authenticated;

create or replace function public.my_new_results()
returns table (learning_assignment_id uuid, session_id uuid)
language sql stable security definer set search_path = public, pg_temp as $$
  with latest as (
    select distinct on (s.learning_assignment_id) s.learning_assignment_id, s.id, s.status
      from public.assessment_sessions s
     where s.person_id = public.current_person_id()
       and s.mode = 'POST_TEST' and s.learning_assignment_id is not null
     order by s.learning_assignment_id, s.created_at desc
  )
  select l.learning_assignment_id, l.id
    from latest l
   where l.status = 'FINALIZED'
     and public.current_person_id() is not null
     and not exists (select 1 from public.result_views v where v.session_id = l.id)
$$;
revoke all on function public.my_new_results() from public, anon;
grant execute on function public.my_new_results() to authenticated;

insert into public.client_rpc_registry (function_name, exposure, note) values
  ('note_result_seen', 'LEARNER', 'UX-40 (Batch 5): the learner has opened the result of their own finalized Uji Penguasaan, '
   || 'so it is no longer offered as the next step on Belajar. Not evidence; no score, answer or time on task.'),
  ('my_new_results', 'LEARNER', 'UX-40 (Batch 5): the caller''s own learning assignments whose latest Uji Penguasaan is '
   || 'finalized and whose result they have not opened yet; Belajar offers it as the next step.')
on conflict (function_name) do nothing;

do $$
declare n_lepas int;
begin
  if has_table_privilege('authenticated', 'public.result_views', 'select')
     or has_table_privilege('authenticated', 'public.result_views', 'insert')
     or has_table_privilege('anon', 'public.result_views', 'select') then
    raise exception 'result_views is reachable by a client role directly';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.result_views'::regclass) then
    raise exception 'result_views has no row level security';
  end if;
  if has_function_privilege('anon', 'public.note_result_seen(uuid)', 'execute')
     or not has_function_privilege('authenticated', 'public.note_result_seen(uuid)', 'execute')
     or has_function_privilege('anon', 'public.my_new_results()', 'execute')
     or not has_function_privilege('authenticated', 'public.my_new_results()', 'execute') then
    raise exception 'the result-view functions are reached by the wrong roles';
  end if;
  -- nothing that existed before this migration is new
  select count(*) into n_lepas from public.assessment_sessions s
   where s.mode = 'POST_TEST' and s.status = 'FINALIZED'
     and not exists (select 1 from public.result_views v where v.session_id = s.id);
  if n_lepas > 0 then
    raise exception '% finalized Uji Penguasaan session(s) were left looking new', n_lepas;
  end if;
  -- the learner RPC guard's own rule: each reaches current_person_id()
  if pg_get_functiondef('public.note_result_seen(uuid)'::regprocedure) !~ 'current_person_id'
     or pg_get_functiondef('public.my_new_results()'::regprocedure) !~ 'current_person_id' then
    raise exception 'a result-view function does not scope itself to current_person_id()';
  end if;
end $$;
