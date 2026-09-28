-- bob01-20 — BOB-20 (D-048): STAFF SEEN THROUGH AN ENROLMENT. The identity rule also answers for anyone enrolled at the school, so a learner sees the school's recorded staff.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.person_visible_to_me(uuid)'::regprocedure);
  src := replace(orig, $p$where ii.person_id = p_person and public.has_scope('INSTITUTION_ADMIN', ii.institution_id)) then$p$, $p$where ii.person_id = p_person and (public.has_scope('INSTITUTION_ADMIN', ii.institution_id) or exists (select 1 from public.enrollments me where me.person_id = v_me and me.institution_id = ii.institution_id))) then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
