-- bob36-2 — ONLY THE PASS MARK IS HELD. The other interpretive fields can still be rewritten after a sitting.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.enforce_quick_rules_fixed_once_sat()'::regprocedure);
  src := replace(orig, $p$array['mode', 'bank_type', 'item_count', 'difficulty_mix', 'safety_critical_minimum',
                               'passing_rules', 'shuffle_policy', 'hesitation_window_seconds', 'allows_pause',
                               'offline_tolerant', 'late_sync_grace_seconds', 'attempt_limit', 'status']$p$, $p$array['passing_rules']$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
