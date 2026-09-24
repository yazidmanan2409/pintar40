-- r1-2 — FINISH STOPS READING THE MANIFEST. finish_my_session ignores what the
-- learner declared, so a finish that raced the outbox scores the paper
-- without the answers still travelling.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.finish_my_session(uuid,jsonb)'::regprocedure);
  src := replace(orig, 'if jsonb_array_length(v_missing) > 0 then', 'if false and jsonb_array_length(v_missing) > 0 then');
  if src = orig then raise exception 'the plant did not reach the manifest check'; end if;
  execute src;
end $d$;
