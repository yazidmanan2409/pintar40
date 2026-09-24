-- bob04-4 — ANYONE MAY ASSIGN. The capability check is gone.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.assign_release(uuid, uuid, timestamp with time zone, timestamp with time zone)'::regprocedure);
  src := replace(orig, $p$or not public.can_in_institution('CAN_ASSIGN_LEARNING', n.institution_id)$p$, $p$$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
