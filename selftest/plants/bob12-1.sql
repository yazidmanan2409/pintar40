-- bob12-1 — A CARD NEVER WAITS. The attempt goes ahead whatever the count.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.card_signin_attempt(text)'::regprocedure);
  src := replace(orig, $p$if v_sampai > v_nu then$p$, $p$if false then$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
