-- bob01-10 — THE CODE IS LOST (D-011). structure_refuse raises without the
-- stable code in DETAIL, leaving a client only the developer's sentence.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.structure_refuse(text)'::regprocedure);
  src := replace(orig, 'detail  = p_code,', '');
  if src = orig then raise exception 'the plant did not reach the detail clause'; end if;
  execute src;
end $d$;
