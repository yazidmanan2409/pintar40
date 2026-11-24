-- d2r-7 — MASTERY PER OBJECTIVE. session_outcome keeps per_domain on a certifying result.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.session_outcome(uuid)'::regprocedure);
  src := replace(orig, 'v_out := (v_out - ''per_domain'') ||', 'v_out := v_out ||');
  if src = orig then raise exception 'the plant did not reach per_domain'; end if;
  execute src;
end $d$;
