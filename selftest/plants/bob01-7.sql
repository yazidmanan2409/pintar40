-- bob01-7 — THE INTAKE ENROLS INTO THE NEWEST YEAR AGAIN. import_advance
-- ignores the place's own academic period.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.import_advance(uuid,integer)'::regprocedure);
  src := replace(orig, 'coalesce(n.academic_period_id,', 'coalesce(null::uuid,');
  if src = orig then raise exception 'the plant did not reach the period clause'; end if;
  execute src;
end $d$;
