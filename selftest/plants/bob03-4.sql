-- bob03-4 — A BLOCKED COURSE IS SEALED. The freeze reads readiness and seals anyway.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.freeze_release(uuid)'::regprocedure);
  src := replace(orig, $p$  if v_ready.status = 'BLOCKED' then$p$, $p$  if false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
