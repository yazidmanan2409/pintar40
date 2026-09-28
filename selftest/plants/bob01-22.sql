-- bob01-22 — BOB-21 (D-049): THE SCHOOL IS NOT ASKED. The relationship check is gone, so a school admin gives a role to anyone whose id they submit.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.role_assignments_guard()'::regprocedure);
  src := replace(orig, $p$    if not public.is_system_admin()
       and not exists (select 1 from public.institutional_identities ii$p$, $p$    if false
       and not exists (select 1 from public.institutional_identities ii$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
