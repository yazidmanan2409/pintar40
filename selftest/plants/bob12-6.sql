-- bob12-6 — AN UNJUDGED ATTEMPT STAYS COUNTED. A busy morning locks students out.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.card_signin_settle(text, text)'::regprocedure);
  src := replace(orig, $p$set percobaan = percobaan[1:greatest(cardinality(percobaan) - 1, 0)]$p$, $p$set percobaan = percobaan$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
