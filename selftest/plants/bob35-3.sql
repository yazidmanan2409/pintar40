-- bob35-3 — A STARTED CYCLE IS MOVED. A learner's pre-test and post-test can come from two releases.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.move_learning_assignment_release(uuid, uuid, text)'::regprocedure);
  src := replace(orig, $p$  if exists (select 1 from public.assessment_sessions s
              where s.learning_assignment_id = p_assignment$p$, $p$  if false and exists (select 1 from public.assessment_sessions s
              where s.learning_assignment_id = p_assignment$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
