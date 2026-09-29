-- bob37-2 — THE SCHOOL'S COMPETENCY OUTCOMES NEVER SHOW. calc_institution_competency_outcomes keeps only bare numbers again.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.calc_institution_competency_outcomes(uuid, uuid, text)'::regprocedure);
  src := replace(orig, $p$jsonb_typeof(kv.value) = 'object'::text$p$, $p$jsonb_typeof(kv.value) = 'number'::text$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
