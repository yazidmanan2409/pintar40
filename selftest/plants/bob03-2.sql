-- bob03-2 — A COURSE IN REVIEW IS RELEASED. The APPROVED check is gone.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.create_release(uuid)'::regprocedure);
  src := replace(orig, $p$if c.status <> 'APPROVED' then perform public.release_refuse('RELEASE_COURSE_NOT_APPROVED'); end if;$p$, $p$null;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
