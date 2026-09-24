-- bob04-5 — A RELEASE IS ASSIGNED TWICE TO ONE CLASS. The one-assignment check is gone.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.assign_release(uuid, uuid, timestamp with time zone, timestamp with time zone)'::regprocedure);
  src := replace(orig, $p$              where la.plp_release_id = r.id and la.node_id = n.id and la.status in ('DRAFT', 'ACTIVE')) then$p$, $p$              where false) then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
