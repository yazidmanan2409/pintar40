-- wp8-5 — AUTHORIZATION STOPS BEING THE FIRST GATE. The endpoint's own
-- capability check goes, leaving the row guards to refuse later and by
-- accident: a caller who gets past the arguments is refused for the wrong
-- reason, and a caller whose arguments do not resolve is refused by the
-- resolution instead of by authorization. RF-2's shape, planted.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.save_report_template(uuid,text,text,jsonb,uuid)'::regprocedure);
  src := replace(orig, 'or not public.can_in_institution(''CAN_MANAGE_REPORT_TEMPLATES'', p_institution) then', 'or false then');
  if src = orig then raise exception 'the plant did not reach the capability gate'; end if;
  execute src;
end $d$;
