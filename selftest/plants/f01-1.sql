-- f01-1 — ANY ADMINISTRATOR ACTIVATES ANYONE. authorize_account_activation
-- stops asking for CAN_PROVISION_PEOPLE in the person's own institution.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.authorize_account_activation(uuid,text,text,text)'::regprocedure);
  src := replace(orig, 'if v_inst is null and not public.is_system_admin() then', 'if false then');
  if src = orig then raise exception 'the plant did not reach the authority check'; end if;
  execute src;
end $d$;
