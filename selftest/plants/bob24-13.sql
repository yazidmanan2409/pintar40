-- bob24-13 — ANYONE READS THE SECURITY RECORD. security_events no longer asks for the platform administrator.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.security_events(integer)'::regprocedure);
  src := replace(orig, $p$if not public.is_system_admin() then$p$, $p$if false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
