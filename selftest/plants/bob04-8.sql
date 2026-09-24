-- bob04-8 — A LESSON WITHOUT A PRE-TEST IS ASSIGNED. The pre-test check is gone.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.assign_release(uuid, uuid, timestamp with time zone, timestamp with time zone)'::regprocedure);
  src := replace(orig, $p$  if d_pre.id is null then perform public.assign_refuse('ASSIGN_PRE_TEST_MISSING'); end if;$p$, $p$  null;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
