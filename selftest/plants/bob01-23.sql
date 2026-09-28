-- bob01-23 — BOB-21 (D-049): VISIBLE TO ME INSTEAD OF THE GRANT'S SCHOOL. Anyone the grantor can see may be given a role, so an admin of two schools moves a teacher between them by granting.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.role_assignments_guard()'::regprocedure);
  src := replace(orig, $p$    if not public.is_system_admin()
       and not exists (select 1 from public.institutional_identities ii$p$, $p$    if not public.is_system_admin() and not public.person_visible_to_me(new.person_id)
       and not exists (select 1 from public.institutional_identities ii$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
