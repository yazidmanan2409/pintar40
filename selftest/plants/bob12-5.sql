-- bob12-5 — A SIGN-IN CLEARS NOTHING. The owner of the card keeps the classmate's failures.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.card_signin_settle(text, text)'::regprocedure);
  src := replace(orig, $p$delete from public.card_signin_cooldowns where kunci = p_kunci;$p$, $p$null;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
