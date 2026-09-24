-- bob03-7 — A RELEASE IS PUBLISHED FROM ANY STATE. The FROZEN check is gone.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.publish_release(uuid)'::regprocedure);
  src := replace(orig, $p$  if r.status <> 'FROZEN' then perform public.release_refuse('RELEASE_STATE_INVALID'); end if;$p$, $p$  null;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
