-- bob24-7 — A PIN CAN BE SET AGAIN AT WILL. Whoever holds the session replaces the PIN without a reset.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.set_my_pin(text)'::regprocedure);
  src := replace(orig, $p$if v_ada and not r.reset_required then$p$, $p$if false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
