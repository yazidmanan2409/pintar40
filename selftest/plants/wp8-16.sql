-- wp8-16 — D-093 T2 RETURNS. A place is deactivated with no reason given.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.deactivate_school_node(uuid,text)'::regprocedure);
  src := replace(orig, 'if v_reason is null or length(v_reason) > 300 then', 'if false then');
  if src = orig then raise exception 'the plant did not reach the reason check'; end if;
  execute src;
end $d$;
