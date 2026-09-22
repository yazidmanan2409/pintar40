-- wp7d-1 — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- WP7D's six. 9. P1, SCOPE. Discovery stops asking whether the caller
--    manages this class and settles for being in the school -- which is
--    the shape a "just let staff see staff" fix would actually take.
-- P1 SCOPE: discovery stops asking whether the caller manages this class.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.feedback_subjects_for_class(uuid)'::regprocedure);
  src := replace(orig, 'or not public.management_scope_over_node(p_node) then',
                       'or not public.is_member_of_institution((select n.institution_id from public.org_nodes n where n.id = p_node)) then');
  if src = orig then raise exception 'the plant did not reach the authorization check'; end if;
  execute src;
end $d$;
