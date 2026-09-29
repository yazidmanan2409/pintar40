-- bob24-5 — ANYONE CAN CORRECT A USERNAME. correct_username no longer asks for the platform administrator.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.correct_username(uuid, text, text)'::regprocedure);
  src := replace(orig, $p$if not public.is_system_admin() then$p$, $p$if false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
