-- wp8-9 — THE DOOR OPENS BESIDE A LIVING ADMINISTRATOR. The bootstrap stops
-- checking whether an active SYSTEM_ADMIN already exists, which is the check
-- that covers an installation that acquired one by any path other than this
-- function.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.bootstrap_first_system_admin(text,timestamptz)'::regprocedure);
  src := replace(orig, 'if exists (select 1 from public.role_assignments ra', 'if false and exists (select 1 from public.role_assignments ra');
  if src = orig then raise exception 'the plant did not reach the active-administrator check'; end if;
  execute src;
end $d$;
