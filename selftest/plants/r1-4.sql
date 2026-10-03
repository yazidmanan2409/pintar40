-- r1-4 — D-093 T3 RETURNS. An authorization is recorded as an activation before any account exists.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.authorize_account_activation(uuid,text,text,text)'::regprocedure);
  src := replace(orig, 'display_name := v_name; institution_id := v_inst; return next;',
    'perform public.audit_write(''account.activation_authorized'', ''persons'', p_person::text, v_inst, '
    || 'jsonb_build_object(''person_id'', p_person)); display_name := v_name; institution_id := v_inst; return next;');
  if src = orig then raise exception 'the plant did not reach the end of the authorization'; end if;
  execute src;
end $d$;
