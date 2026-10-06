-- bob01-24 — BOB-21 (D-049): ANY SCHOOL'S NUMBER WILL DO. The identity is not asked of the grant's own school, so another school's teacher is granted by id.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.role_assignments_guard()'::regprocedure);
  src := replace(orig, $p$where ii.person_id = new.person_id and ii.institution_id = v_target_inst)$p$, $p$where ii.person_id = new.person_id)$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
