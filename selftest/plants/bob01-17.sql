-- bob01-17 — BOB-20 (D-048): ANY SCHOOL'S NUMBER COUNTS. The identity rule no longer asks whether the viewer administers that school, so any school's admin sees every school's recorded staff.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.person_visible_to_me(uuid)'::regprocedure);
  src := replace(orig, $p$where ii.person_id = p_person and public.has_scope('INSTITUTION_ADMIN', ii.institution_id)) then$p$, $p$where ii.person_id = p_person) then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
