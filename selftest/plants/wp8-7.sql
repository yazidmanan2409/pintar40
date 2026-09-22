-- wp8-7 — THE DOOR STOPS SHUTTING. The day-zero bootstrap no longer checks
-- whether an administrator already exists, so the operator's key becomes a
-- standing grant of SYSTEM_ADMIN rather than a one-time act.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.bootstrap_first_system_admin(text,timestamptz)'::regprocedure);
  src := replace(orig, 'if exists (select 1 from public.role_assignments ra', 'if false and exists (select 1 from public.role_assignments ra');
  if src = orig then raise exception 'the plant did not reach the day-zero condition'; end if;
  execute src;
end $d$;
