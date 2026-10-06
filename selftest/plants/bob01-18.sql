-- bob01-18 — BOB-20 (D-048): ANY SCHOOL'S ROLE COUNTS. The role rule no longer asks whether the viewer administers the school the role is held at, so another school's teachers become visible.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.person_visible_to_me(uuid)'::regprocedure);
  src := replace(orig, $p$                and public.has_scope('INSTITUTION_ADMIN', ra.institution_id)) then$p$, $p$                ) then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
