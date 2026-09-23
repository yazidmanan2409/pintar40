-- f02-2-fresh — NEW-1 RESTORED. The refusal reads app.seed_intent without
-- coalesce and decides with `not v_allowed`, so on a connection that never set
-- the value (every GoTrue connection) the condition is NULL and the sign-up is
-- admitted. Invisible to the in-suite F09-A01, whose session already set the
-- value; F09-C01, on fresh connections, must go red. Run by ci.yml's
-- db-r1-gates step directly (not plants.mjs, which drives suites only).
do $d$
declare o text; s text;
begin
  o := pg_get_functiondef('public.handle_new_auth_user()'::regprocedure);
  s := replace(o, 'coalesce(current_setting(''app.seed_intent'', true), '''')', 'current_setting(''app.seed_intent'', true)');
  s := replace(s, 'if v_allowed is not true then', 'if not v_allowed then');
  if s = o then raise exception 'the plant did not reach the fail-closed decision'; end if;
  execute s;
end $d$;
