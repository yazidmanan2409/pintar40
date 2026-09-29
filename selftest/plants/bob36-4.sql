-- bob36-4 — A SAT UJI CEPAT CAN BE MOVED TO ANOTHER CHAPTER. Its rules are held, but not where it was sat.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.enforce_quick_rules_fixed_once_sat()'::regprocedure);
  src := replace(orig, $p$'attempt_limit', 'status',
                               'course_id', 'module_id']$p$, $p$'attempt_limit', 'status']$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
