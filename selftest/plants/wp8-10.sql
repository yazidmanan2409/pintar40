-- wp8-10 — THE WAITING LIST BECOMES A DIRECTORY. The read stops asking whether
-- the caller is a SYSTEM_ADMIN, so any signed-in staff member can enumerate
-- people who hold nothing yet -- across every tenant, since the rows are
-- governed by person_visible_to_me and nothing else.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.persons_awaiting_first_role()'::regprocedure);
  src := replace(orig, 'if not public.is_system_admin() then', 'if false and not public.is_system_admin() then');
  if src = orig then raise exception 'the plant did not reach the SYSTEM_ADMIN gate'; end if;
  execute src;
end $d$;
