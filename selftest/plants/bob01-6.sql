-- bob01-6 — M5a UNDONE. import_row_problems accepts a learner placed anywhere
-- in the school again.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.import_row_problems(uuid,jsonb)'::regprocedure);
  src := replace(orig, '(v_kind not in (''CLASS'', ''COHORT'') or not v_active)', 'false');
  if src = orig then raise exception 'the plant did not reach the learner-place clause'; end if;
  execute src;
end $d$;
