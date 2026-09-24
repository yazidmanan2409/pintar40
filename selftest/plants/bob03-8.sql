-- bob03-8 — A COURSE GETS A SECOND RELEASE. The one-release check is gone.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.create_release(uuid)'::regprocedure);
  src := replace(orig, $p$  if exists (select 1 from public.plp_releases r where r.course_id = c.id) then
    perform public.release_refuse('RELEASE_EXISTS');
  end if;$p$, $p$  null;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
