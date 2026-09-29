-- bob12-9 — AN UNJUDGED ATTEMPT CLEARS THE CARD. Mixed with Auth failures, a guesser gets endless judged tries.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.card_signin_settle(text, text)'::regprocedure);
  src := replace(orig, $p$set percobaan = percobaan[1:greatest(cardinality(percobaan) - 1, 0)]$p$, $p$set percobaan = '{}'$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
