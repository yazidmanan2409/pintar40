-- wp8-19 — D-093 S16 RETURNS. The database owner changes a school's state and nothing records it.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.institutions_state_audit()'::regprocedure);
  src := replace(orig, 'if (old.is_synthetic, old.is_active) is distinct from (new.is_synthetic, new.is_active) then', 'if false then');
  if src = orig then raise exception 'the plant did not reach the school''s state'; end if;
  execute src;
end $d$;
