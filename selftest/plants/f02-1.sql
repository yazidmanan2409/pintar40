-- f02-1 — A SIGN-UP CREATES A PERSON AGAIN. The Auth trigger stops refusing an
-- identity PINTAR did not ask for, which is the defect that let anyone who
-- could reach the sign-in page provision themselves.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.handle_new_auth_user()'::regprocedure);
  src := replace(orig, 'if not (', 'if false and not (');
  if src = orig then raise exception 'the plant did not reach the provisioning refusal'; end if;
  execute src;
end $d$;
