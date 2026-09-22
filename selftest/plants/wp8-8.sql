-- wp8-8 — THE MARKER BECOMES A KEY. The guard's day-zero clause stops
-- requiring that no administrator exists, so anything able to set the session
-- marker can mint a SYSTEM_ADMIN at any time. This is the clause that keeps
-- the bootstrap from being a general INV-16 bypass.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.role_assignments_guard()'::regprocedure);
  src := replace(orig, 'and not exists (select 1 from public.role_assignments ra', 'and not false and not exists (select 1 from public.role_assignments ra');
  if src = orig then raise exception 'the plant did not reach the day-zero clause'; end if;
  src := replace(src, 'where ra.role = ''SYSTEM_ADMIN'' and ra.revoked_at is null', 'where false and ra.role = ''SYSTEM_ADMIN'' and ra.revoked_at is null');
  execute src;
end $d$;
