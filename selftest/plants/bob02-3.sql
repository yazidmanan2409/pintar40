-- bob02-3 — ANYONE SIGNED IN MAY PREPARE OR CONFIRM A PACKAGE. The capability check is gone.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.package_batch(uuid)'::regprocedure);
  src := replace(orig, $p$if b.id is null or not public.can_in_institution('CAN_DRAFT', b.institution_id) then$p$, $p$if b.id is null then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
