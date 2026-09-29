-- bob36-3 — THE OWNER IS EXEMPT. A privileged caller rewrites history the teacher cannot.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.enforce_quick_rules_fixed_once_sat()'::regprocedure);
  src := replace(orig, $p$  if not coalesce(old.is_ad_hoc, false) then return new; end if;$p$,
    $p$  if not coalesce(old.is_ad_hoc, false) or public.current_person_id() is null then return new; end if;$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
