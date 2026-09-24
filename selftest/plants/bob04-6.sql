-- bob04-6 — THE TESTS ARE NEVER OPENED. Both assessment assignments stay SCHEDULED.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.assign_release(uuid, uuid, timestamp with time zone, timestamp with time zone)'::regprocedure);
  src := replace(orig, $p$  update public.assessment_assignments set status = 'OPEN' where id in (v_pre, v_post);$p$, $p$  null;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
