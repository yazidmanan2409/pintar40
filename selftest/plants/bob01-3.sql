-- bob01-3 — AN UNKNOWN NODE SAYS SO. structure_node tells "no such node" apart
-- from "not yours", so a caller outside the school can probe which ids exist.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.structure_node(uuid)'::regprocedure);
  src := replace(orig, 'if v.id is null or not public.has_scope',
                       'if v.id is null then perform public.structure_refuse(''STRUCTURE_NODE_INVALID''); end if;'
                       || chr(10) || '  if not public.has_scope');
  if src = orig then raise exception 'the plant did not reach the authorization clause'; end if;
  execute src;
end $d$;
