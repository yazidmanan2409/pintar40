-- bob03-6 — A REVISION'S RELEASE IS 1.0.0 AGAIN. The predecessor chain is not read.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.create_release(uuid)'::regprocedure);
  src := replace(orig, $p$  if c.supersedes_course_id is not null then$p$, $p$  if false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
