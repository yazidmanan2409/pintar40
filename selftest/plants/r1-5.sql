-- r1-5 — D-093 T3 RETURNS. The account comes to exist and nothing records that it did.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.handle_new_auth_user()'::regprocedure);
  src := replace(orig, 'perform public.audit_write(''account.activated'',', 'perform public.audit_write(''account.unrecorded'',');
  if src = orig then raise exception 'the plant did not reach the account''s record'; end if;
  execute src;
end $d$;
