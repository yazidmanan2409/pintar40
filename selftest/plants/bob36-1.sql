-- bob36-1 — A SAT UJI CEPAT'S RULES CAN BE REWRITTEN. The trigger lets every edit through.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.enforce_quick_rules_fixed_once_sat()'::regprocedure);
  src := replace(orig, $p$  if not coalesce(old.is_ad_hoc, false) then return new; end if;$p$, $p$  return new;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
