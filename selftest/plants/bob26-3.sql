-- bob26-3 — A CODE FOR ANYONE WITH AN ACCOUNT. activation_code_target forgets that only an unfinished set-up is sent a code.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.activation_code_target(text)'::regprocedure);
  src := replace(orig, $p$join public.account_setup s on s.account_id = a.id and s.state = 'REQUIRED'$p$, $p$join public.account_setup s on s.account_id = a.id$p$);
  if src = orig then raise exception 'the plant did not reach its clause'; end if;
  execute src;
end $d$;
