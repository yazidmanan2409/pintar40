-- bob12-3 — NOTHING IS FORGOTTEN. Attempts older than 15 minutes still count.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.card_signin_attempt(text)'::regprocedure);
  src := replace(orig, $p$where t > v_nu - v_jendela order by t$p$, $p$order by t$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
