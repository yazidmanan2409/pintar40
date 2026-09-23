-- r1-3 — THE CLOCK CLOSES THE PAPER. finalize_session no longer waits out the
-- late-sync window, so an answer given before the deadline and arriving
-- inside the grace window is scored as unanswered.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.finalize_session(uuid)'::regprocedure);
  src := replace(orig, 'if now() <= v_closes', 'if false and now() <= v_closes');
  if src = orig then raise exception 'the plant did not reach the grace guard'; end if;
  execute src;
end $d$;
