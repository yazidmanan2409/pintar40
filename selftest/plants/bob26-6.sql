-- bob26-6 — THE NAME STEP NEVER CLOSES. confirm_my_name forgets that the name is confirmed once.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.confirm_my_name(text)'::regprocedure);
  src := replace(orig, $p$if s.name_confirmed_at is not null then$p$, $p$if false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
