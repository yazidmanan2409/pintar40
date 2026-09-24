-- wp8-7 — INITIALISATION BECOMES RECOVERY. The bootstrap stops consulting the
-- durable record of its own act, so an installation that revokes every
-- administrator gets a second day zero and the operator's key becomes a
-- standing grant of SYSTEM_ADMIN.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.bootstrap_first_system_admin(text,timestamptz)'::regprocedure);
  src := replace(orig, 'if v_when is not null then', 'if false and v_when is not null then');
  if src = orig then raise exception 'the plant did not reach the consumed-state check'; end if;
  execute src;
end $d$;
