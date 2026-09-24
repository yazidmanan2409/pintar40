-- bob04-3 — A CYCLE THAT BREAKS INV-24 IS ASSIGNED. The parallel-group check is gone.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.assign_release(uuid, uuid, timestamp with time zone, timestamp with time zone)'::regprocedure);
  src := replace(orig, $p$  if v_post_free < d_post.item_count then perform public.assign_refuse('ASSIGN_CYCLE_OVERLAP'); end if;$p$, $p$  null;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
