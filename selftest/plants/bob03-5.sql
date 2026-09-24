-- bob03-5 — A TEACHER CREATES A RELEASE. The capability asked is CAN_DRAFT.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.create_release(uuid)'::regprocedure);
  src := replace(orig, $p$if c.id is null or not public.can_in_institution('CAN_FREEZE_RELEASE', c.institution_id) then$p$, $p$if c.id is null or not public.can_in_institution('CAN_DRAFT', c.institution_id) then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
