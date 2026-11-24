-- d2r-4 — THE LINT IS BLIND. assert_mode_policy_complete no longer names a certifying mode that allows help.
do $d$ declare orig text; src text; begin
  orig := pg_get_functiondef('public.assert_mode_policy_complete()'::regprocedure);
  src := replace(orig, 'where m.certifies and m.allows_assistance;', 'where false;');
  if src = orig then raise exception 'the plant did not reach the rule'; end if;
  execute src;
end $d$;
