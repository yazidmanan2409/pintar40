-- d2r-7 — MASTERY PER OBJECTIVE. session_outcome gives a certifying result's per_domain its numbers again.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.session_outcome(uuid)'::regprocedure);
  src := replace(orig, 'jsonb_object_agg(e.key, ''{}''::jsonb)', 'jsonb_object_agg(e.key, e.value)');
  if src = orig then raise exception 'the plant did not reach per_domain'; end if;
  execute src;
end $d$;
