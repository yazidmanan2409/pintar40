-- wp8-18 — D-093 G1 RETURNS. The one audit writer stops naming the acting person's role.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.audit_write(text,text,text,uuid,jsonb)'::regprocedure);
  src := replace(orig, 'if v_person is not null and not (v_summary ? ''actor_role'') then', 'if false then');
  if src = orig then raise exception 'the plant did not reach the actor''s role'; end if;
  execute src;
end $d$;
