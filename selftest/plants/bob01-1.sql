-- bob01-1 — THE STRUCTURE FUNCTIONS FORGET WHO MAY CALL THEM. structure_node
-- resolves the node and no longer asks has_scope, so anyone signed in at the
-- school can build, rename and deactivate its structure.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.structure_node(uuid)'::regprocedure);
  src := replace(orig, 'if v.id is null or not public.has_scope(''INSTITUTION_ADMIN'', v.institution_id) then',
                       'if v.id is null then');
  if src = orig then raise exception 'the plant did not reach the authorization clause'; end if;
  execute src;
end $d$;
