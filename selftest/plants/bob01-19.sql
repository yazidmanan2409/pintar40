-- bob01-19 — BOB-20 (D-048): THE WAITING LIST ASKS NOBODY. Any signed-in person reads any school's newly recorded staff by naming the school.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.persons_awaiting_first_role_at(uuid)'::regprocedure);
  src := replace(orig, $p$if p_institution is null or not public.has_scope('INSTITUTION_ADMIN', p_institution) then$p$, $p$if p_institution is null then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
