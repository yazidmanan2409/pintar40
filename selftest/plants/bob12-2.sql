-- bob12-2 — NO CAP. The wait keeps doubling past 5 minutes: a lock in all but name.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.card_signin_attempt(text)'::regprocedure);
  src := replace(orig, $p$least(v_batas, 30 * (2 ^ least(v_n - v_bebas, 8)))::int$p$, $p$(30 * (2 ^ least(v_n - v_bebas, 8)))::int$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
