-- wp8-17 — D-093 T2 RETURNS. A feature-flag save that changes nothing is recorded as a change.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.feature_flags_audit()'::regprocedure);
  src := replace(orig, 'if tg_op = ''UPDATE'' and old.enabled is not distinct from new.enabled then return null; end if;', '');
  if src = orig then raise exception 'the plant did not reach the no-change exit'; end if;
  execute src;
end $d$;
