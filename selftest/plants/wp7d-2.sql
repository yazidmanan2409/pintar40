-- wp7d-2 — planted defect. Applied inside a transaction the harness opens and
-- rolls back; it must NOT contain begin/rollback or run a suite itself.
--
-- 10. P2, ROLE BOUNDARY. Administering the school, and outranking
--     Management, each start carrying feedback discovery with them. Both
--     are refused the cycle itself, so both must be refused this.
-- P2 ROLE BOUNDARY: administering the school, or outranking Management, starts
-- carrying feedback discovery with it.
do $d$
declare orig text; src text;
begin
  orig := pg_get_functiondef('public.feedback_subjects_for_class(uuid)'::regprocedure);
  src := replace(orig, 'or not public.management_scope_over_node(p_node) then',
                       'or not (public.management_scope_over_node(p_node) or public.is_system_admin()
        or public.has_scope(''INSTITUTION_ADMIN'', p_node)) then');
  if src = orig then raise exception 'the plant did not reach the authorization check'; end if;
  execute src;
end $d$;
